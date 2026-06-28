// Layout / colours / launch / physics / combo loader. SINGLE SOURCE OF TRUTH = ./balance.json.
//
// Board geometry is the SHIELD shape (docs/50-art-ux/screen-structure): a rounded-rect PLAY
// area on top, then the bottom tapers (funnel) inward and ends in a rounded BULGE tip where the
// launcher sits. Collision boundary = this outline (no separate semicircle pocket).
// This file declares NO tunable literals — it loads the JSON and computes DERIVED geometry
// (LINE_Y, BULGE, LAUNCHER.y, STEP_MS) so nothing is duplicated. Edit balance.json instead.
import balance from './balance.json';

export const DESIGN = balance.design;

// ── Layout (primitives from JSON; derived members computed here) ─────────────
const L = balance.layout;
export const HUD = L.hud;
export const OUTLINE_W = L.outlineW;
export const PG_BAND = L.pgBand;
export const PLAY = L.play; // rounded-rect play area
export const LINE_Y = PLAY.y + PLAY.h; // one-way separation line (play-area bottom)
export const WALL_T = L.wallT;
// Launcher circle + power-gauge ring share the same centre P (docs/50-art-ux/screen-structure).
// The board's bottom is two 140°-taper sides meeting the gauge circle's lower arc; the launcher
// circle sits inside it. inner line (= GAUGE/taper/rect outline) is the collision boundary.
export const LAUNCHER = { x: L.launcher.x, y: LINE_Y + L.launcher.offsetY, r: L.launcher.r };
export const GAUGE = { cx: LAUNCHER.x, cy: LAUNCHER.y, r: L.gauge.r, dots: L.gauge.dots, dotR: L.gauge.dotR };
export const JUNCTION_R = L.junctionR;
export const INNER_LINE_W = L.innerLineW;
export const INNER_INSET = L.innerInset; // gap between gold outline and brown inner line
export const FAN_HALF = ((L.fanDeg / 2) * Math.PI) / 180; // half-fan from straight-up

function unit(dx: number, dy: number) {
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
}
// near intersection of a ray (sx,sy)+t·(dx,dy) with circle (cx,cy,r); falls back to start if it misses.
function rayCircle(sx: number, sy: number, dx: number, dy: number, cx: number, cy: number, r: number) {
  const fx = sx - cx, fy = sy - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return { x: sx, y: sy };
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return { x: sx + dx * t, y: sy + dy * t };
}

const tA = (((180 - L.taperAngleDeg) / 2) * Math.PI) / 180; // taper side: tA below horizontal
// gold outline's lower arc sits innerInset outside the launcher rim, so the background-color gap
// between the gold outline and the brown inner line is uniform on the tapers and the bottom too.
const OUTER_LOWER_R = LAUNCHER.r + INNER_INSET;

// Parameterized shield outline (closed polyline): rounded-rect top (inset by `rectInset`), 140°
// tapers, and a lower arc around the LAUNCHER centre at radius `lowerR`. boardOutline = gold frame
// (rectInset 0, outer arc); innerOutline = brown inner line + collision walls (inset, launcher arc).
function shieldPath(rectInset: number, lowerR: number): { x: number; y: number }[] {
  const x0 = PLAY.x + rectInset, x1 = PLAY.x + PLAY.w - rectInset, ty = PLAY.y + rectInset;
  const by = LINE_Y; // tapers start at the play-area bottom on both shapes
  const topR = 18, jr = JUNCTION_R;
  const tL = rayCircle(x0, by, Math.cos(tA), Math.sin(tA), LAUNCHER.x, LAUNCHER.y, lowerR);
  const tR = rayCircle(x1, by, -Math.cos(tA), Math.sin(tA), LAUNCHER.x, LAUNCHER.y, lowerR);
  const pts: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => pts.push({ x, y });
  const quad = (px: number, py: number, cx: number, cy: number, qx: number, qy: number) => {
    for (let i = 1; i <= 5; i++) {
      const t = i / 5, u = 1 - t;
      push(u * u * px + 2 * u * t * cx + t * t * qx, u * u * py + 2 * u * t * cy + t * t * qy);
    }
  };
  push(x0 + topR, ty);
  push(x1 - topR, ty);
  quad(x1 - topR, ty, x1, ty, x1, ty + topR);
  push(x1, by - jr);
  const ru = unit(tR.x - x1, tR.y - by);
  quad(x1, by - jr, x1, by, x1 + ru.x * jr, by + ru.y * jr); // right junction → right taper
  push(tR.x, tR.y);
  // lower arc around the launcher: right taper endpoint → bottom → left taper endpoint
  const aR = Math.atan2(tR.y - LAUNCHER.y, tR.x - LAUNCHER.x);
  let aL = Math.atan2(tL.y - LAUNCHER.y, tL.x - LAUNCHER.x);
  if (aL < aR) aL += Math.PI * 2;
  const segs = 24;
  for (let i = 1; i <= segs; i++) {
    const ang = aR + ((aL - aR) * i) / segs;
    push(LAUNCHER.x + Math.cos(ang) * lowerR, LAUNCHER.y + Math.sin(ang) * lowerR);
  }
  const lu = unit(tL.x - x0, tL.y - by);
  push(x0 + lu.x * jr, by + lu.y * jr);
  quad(x0 + lu.x * jr, by + lu.y * jr, x0, by, x0, by - jr); // left taper → left junction
  push(x0, ty + topR);
  quad(x0, ty + topR, x0, ty, x0 + topR, ty);
  return pts;
}

// Gold visual frame (outer) and brown collision line (inner) — two distinct outlines with a gap.
export function boardOutline(): { x: number; y: number }[] {
  return shieldPath(0, OUTER_LOWER_R);
}
export function innerOutline(): { x: number; y: number }[] {
  return shieldPath(INNER_INSET, LAUNCHER.r);
}

// inner-line taper endpoints on the launcher circle — give the power gauge its angular span.
export const TAPER_L = rayCircle(PLAY.x + INNER_INSET, LINE_Y, Math.cos(tA), Math.sin(tA), LAUNCHER.x, LAUNCHER.y, LAUNCHER.r);
export const TAPER_R = rayCircle(PLAY.x + PLAY.w - INNER_INSET, LINE_Y, -Math.cos(tA), Math.sin(tA), LAUNCHER.x, LAUNCHER.y, LAUNCHER.r);

// collision categories for the one-way line (docs/30-systems/play-area-boundary)
export const CAT = { DEFAULT: 0x0001, LAUNCHER: 0x0002 };

// ── Colours: #rrggbb strings → 0xRRGGBB numbers ─────────────────────────────
export const COLORS = Object.fromEntries(
  Object.entries(balance.colors).map(([k, v]) => [k, parseInt((v as string).slice(1), 16)])
) as Record<string, number>;

// ── Behaviour groups (verbatim from JSON) ───────────────────────────────────
export const LAUNCH = balance.launch;
export const PHYSICS = balance.physics;
export const SCORING = balance.scoring; // { collisionPoint }
export const JUICE = balance.juice; // mergePop / burst / scorePopup / scoreRoll
export const QUEUE_SIZE = balance.queue.size;
export const STEP_MS = 1000 / balance.engine.fixedFps;
