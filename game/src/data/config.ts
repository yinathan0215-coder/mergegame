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
export const FAN_HALF = ((L.fanDeg / 2) * Math.PI) / 180; // half-fan from straight-up

// taper: each side is (180−taperAngle)/2 below horizontal, ending where it meets the gauge circle.
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
const tA = (((180 - L.taperAngleDeg) / 2) * Math.PI) / 180;
export const TAPER_L = rayCircle(PLAY.x, LINE_Y, Math.cos(tA), Math.sin(tA), GAUGE.cx, GAUGE.cy, GAUGE.r);
export const TAPER_R = rayCircle(PLAY.x + PLAY.w, LINE_Y, -Math.cos(tA), Math.sin(tA), GAUGE.cx, GAUGE.cy, GAUGE.r);

// Inner-line polyline (closed): rounded-rect top → junction → tapers → gauge lower arc. Shared by
// BoardRenderer (draw) + PhysicsWorld (collision walls). Excludes the launcher circle (separate body).
export function innerOutline(): { x: number; y: number }[] {
  const x0 = PLAY.x, x1 = PLAY.x + PLAY.w, ty = PLAY.y;
  const topR = 18, jr = JUNCTION_R;
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
  push(x1, LINE_Y - jr);
  // right junction → right taper start
  const ru = unit(TAPER_R.x - x1, TAPER_R.y - LINE_Y);
  quad(x1, LINE_Y - jr, x1, LINE_Y, x1 + ru.x * jr, LINE_Y + ru.y * jr);
  push(TAPER_R.x, TAPER_R.y);
  // gauge lower arc: from right endpoint, through the bottom, to left endpoint
  const aR = Math.atan2(TAPER_R.y - GAUGE.cy, TAPER_R.x - GAUGE.cx);
  let aL = Math.atan2(TAPER_L.y - GAUGE.cy, TAPER_L.x - GAUGE.cx);
  if (aL < aR) aL += Math.PI * 2;
  const segs = 22;
  for (let i = 1; i <= segs; i++) {
    const ang = aR + ((aL - aR) * i) / segs;
    push(GAUGE.cx + Math.cos(ang) * GAUGE.r, GAUGE.cy + Math.sin(ang) * GAUGE.r);
  }
  // left taper end → left junction
  const lu = unit(TAPER_L.x - x0, TAPER_L.y - LINE_Y);
  push(x0 + lu.x * jr, LINE_Y + lu.y * jr);
  quad(x0 + lu.x * jr, LINE_Y + lu.y * jr, x0, LINE_Y, x0, LINE_Y - jr);
  push(x0, ty + topR);
  quad(x0, ty + topR, x0, ty, x0 + topR, ty);
  return pts;
}
function unit(dx: number, dy: number) {
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
}

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
