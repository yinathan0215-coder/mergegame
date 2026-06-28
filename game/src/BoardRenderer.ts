import { Container, Graphics, Sprite } from 'pixi.js';
import {
  DESIGN,
  PLAY,
  LINE_Y,
  GAUGE,
  LAUNCHER,
  OUTLINE_W,
  PG_BAND,
  COLORS,
  innerOutline,
} from './data/config';
import { ASSETS, ASSET_SIZES } from './assets';

// SHIELD outline (docs/50-art-ux/screen-structure): rounded-rect play area; bottom corners ROUND into
// tapers that meet a SHALLOW bulge mound (lower segment of a circle centred at BULGE, arc alpha..PI-alpha).
// FILL version (arc/quadratic) — used for the dark band + image mask.
function traceShield(g: Graphics, inset: number) {
  const cx = PLAY.x + PLAY.w / 2;
  const cy = (PLAY.y + GAUGE.cy + GAUGE.r) / 2;
  const pts = innerOutline().map((p) => {
    if (inset <= 0) return p;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const scale = Math.max(0, (len - inset) / len);
    return { x: cx + dx * scale, y: cy + dy * scale };
  });
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
}

// Same outline sampled as a closed list of points (pure straight samples).
function shieldOutline(): { x: number; y: number }[] {
  return innerOutline();
}

// Stroke a closed polyline with a uniform-width gold line (smooth + uniform thickness everywhere).
function strokeOutline(g: Graphics, pts: { x: number; y: number }[], width: number, color: number) {
  g.lineStyle(width, color, 1);
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
}

// Layered board: 1 bg color  2 outline (UNIFORM gold)  3 pg-color band  4 background IMAGE
//  5 launcher seat  6 one-way line.
export class BoardRenderer {
  readonly imageLayer = new Container();

  constructor(layer: Container) {
    // 1. background color — fills whole screen
    const bg = new Graphics();
    bg.beginFill(COLORS.outerBg);
    bg.drawRect(0, 0, DESIGN.w, DESIGN.h);
    bg.endFill();
    layer.addChild(bg);

    // 2. outline (gold) — UNIFORM thickness everywhere (incl. tapers). A centered stroke of the closed
    // shield polyline; the band + image below cover its inner half, so the outer ~OUTLINE_W is the frame.
    const outline = shieldOutline();
    const frame = new Graphics();
    strokeOutline(frame, outline, OUTLINE_W * 2 + 6, COLORS.outlineDark);
    strokeOutline(frame, outline, OUTLINE_W * 2, COLORS.outline);
    strokeOutline(frame, outline, Math.max(4, OUTLINE_W * 2 - 12), COLORS.outlineLight);
    layer.addChild(frame);

    // 3. playground background color — dark band (interior shield)
    const band = new Graphics();
    band.beginFill(COLORS.pgBand);
    traceShield(band, 0);
    band.endFill();
    layer.addChild(band);

    // 4. playground background IMAGE (swappable) — clipped to the shield (inset by PG_BAND)
    const img = this.imageLayer;
    const background = Sprite.from(ASSETS.board.background);
    background.x = PLAY.x + PG_BAND;
    background.y = PLAY.y + PG_BAND;
    background.scale.set(
      (PLAY.w - PG_BAND * 2) / ASSET_SIZES.boardBackground.w,
      (GAUGE.cy + GAUGE.r - PLAY.y - PG_BAND * 2) / ASSET_SIZES.boardBackground.h
    );
    img.addChild(background);
    const mask = new Graphics();
    mask.beginFill(0xffffff);
    traceShield(mask, PG_BAND);
    mask.endFill();
    img.addChild(mask);
    mask.renderable = false;
    background.mask = mask;
    layer.addChild(img);

    // 5. inner line — visible collision boundary (docs/30-systems/play-area-boundary)
    const innerLine = new Graphics();
    innerLine.lineStyle(2.5, COLORS.line, 0.85);
    const ip = innerOutline();
    innerLine.moveTo(ip[0].x, ip[0].y);
    for (let i = 1; i < ip.length; i++) innerLine.lineTo(ip[i].x, ip[i].y);
    innerLine.lineTo(ip[0].x, ip[0].y);
    layer.addChild(innerLine);

    // 6. launcher SEAT (dark circle + gold rim) = the launcher collision circle.
    const seat = new Graphics();
    seat.beginFill(COLORS.pocket, 1);
    seat.lineStyle(3, COLORS.launcherRim, 0.95);
    seat.drawCircle(LAUNCHER.x, LAUNCHER.y, LAUNCHER.r);
    seat.endFill();
    layer.addChild(seat);
  }
}
