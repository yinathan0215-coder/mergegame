import { Container, Graphics } from 'pixi.js';
import {
  DESIGN,
  PLAY,
  GAUGE,
  OUTLINE_W,
  PG_BAND,
  INNER_LINE_W,
  COLORS,
  boardOutline,
  innerOutline,
} from './data/config';
import { GalaxyBackground } from './GalaxyBackground';

type Pt = { x: number; y: number };

// Inset a closed polyline radially toward a centre point (used to clip the bg image just inside
// the inner line). Approximate (radial, not true normal offset) but smooth enough for a mask.
function insetToward(pts: Pt[], cx: number, cy: number, inset: number): Pt[] {
  return pts.map((p) => {
    const dx = p.x - cx, dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const s = Math.max(0, (len - inset) / len);
    return { x: cx + dx * s, y: cy + dy * s };
  });
}

// shieldPath ends on a duplicate of pts[0]; drop it so drawPolygon's auto-close stays clean
// (a duplicate seam vertex makes a degenerate miter spike at the top-left corner).
function ring(pts: Pt[]): number[] {
  const last = pts[pts.length - 1];
  const open = Math.abs(last.x - pts[0].x) < 0.01 && Math.abs(last.y - pts[0].y) < 0.01 ? pts.slice(0, -1) : pts;
  return open.flatMap((p) => [p.x, p.y]);
}

function fillPoly(g: Graphics, pts: Pt[]) {
  g.drawPolygon(ring(pts));
}

function strokePoly(g: Graphics, pts: Pt[], width: number, color: number, alpha = 1) {
  g.lineStyle(width, color, alpha);
  g.drawPolygon(ring(pts)); // closed loop, proper joins all the way around incl. the seam
}

// Layered board (docs/50-art-ux/screen-structure): 1 bg color → 2 gold outline → 3 bg-color band
// → 4 inner line (brown, caps over the launcher top) → 5 bg image (clipped inside the inner line).
// The launcher circle sits OUTSIDE the inner line in the band: its disc IS the bg-color band, its
// only rim is the inner line's upper cap, and the gauge (Launcher) rings its lower half on top.
// Collision (PhysicsWorld) follows the inner line + launcher circle; the gold outline is visual only.
export class BoardRenderer {
  readonly imageLayer = new Container();
  private galaxy!: GalaxyBackground;

  constructor(layer: Container) {
    const outer = boardOutline();
    const inner = innerOutline();
    const floorY = GAUGE.cy + GAUGE.r;
    const cx = PLAY.x + PLAY.w / 2;
    const cy = (PLAY.y + floorY) / 2;

    // 1. background color — fills the whole screen
    const bg = new Graphics();
    bg.beginFill(COLORS.outerBg);
    bg.drawRect(0, 0, DESIGN.w, DESIGN.h);
    bg.endFill();
    layer.addChild(bg);

    // 2. gold outline — uniform-thickness frame stroked on the OUTER shield polyline. The band (3)
    // paints over its inner half, leaving the outer ~OUTLINE_W as the visible gold frame.
    const frame = new Graphics();
    strokePoly(frame, outer, OUTLINE_W * 2 + 6, COLORS.outlineDark);
    strokePoly(frame, outer, OUTLINE_W * 2, COLORS.outline);
    strokePoly(frame, outer, Math.max(4, OUTLINE_W * 2 - 12), COLORS.outlineLight);
    layer.addChild(frame);

    // 3. background-color band — fills inside the gold path; the strip between gold and inner line.
    const band = new Graphics();
    band.beginFill(COLORS.pgBand);
    fillPoly(band, outer);
    band.endFill();
    layer.addChild(band);

    // 4. inner line — brown, inset from the gold outline; THIS is the collision boundary.
    const innerLine = new Graphics();
    strokePoly(innerLine, inner, INNER_LINE_W, COLORS.line, 0.95);
    layer.addChild(innerLine);

    // 5. background IMAGE (swappable) — clipped to just inside the inner line.
    const img = this.imageLayer;
    this.galaxy = new GalaxyBackground({
      x: PLAY.x,
      y: PLAY.y,
      width: PLAY.w,
      height: floorY - PLAY.y,
      seed: 1977,
      count: 34,
    });
    img.addChild(this.galaxy);
    const mask = new Graphics();
    mask.beginFill(0xffffff);
    fillPoly(mask, insetToward(inner, cx, cy, PG_BAND));
    mask.endFill();
    mask.renderable = false;
    img.addChild(mask);
    img.mask = mask;
    layer.addChild(img);
  }

  update(nowMs: number) {
    this.galaxy.update(nowMs);
  }
}
