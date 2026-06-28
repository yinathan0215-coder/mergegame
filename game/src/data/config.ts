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
// gold outline's lower arc sits innerInset outside the launcher rim → after the uniform inward
// offset, the inner line's arc lands exactly on the launcher circle (LAUNCHER.r).
const OUTER_LOWER_R = LAUNCHER.r + INNER_INSET;

type Pt = { x: number; y: number };

// Gold shield outline (closed polyline) + the [ai,bi] index range of its lower arc block, so the
// inner line can offset the whole shape and swap that block for an upper arc.
function shieldPath(): { pts: Pt[]; ai: number; bi: number } {
  const x0 = PLAY.x, x1 = PLAY.x + PLAY.w, ty = PLAY.y, by = LINE_Y;
  const topR = 18, jr = JUNCTION_R;
  const tL = rayCircle(x0, by, Math.cos(tA), Math.sin(tA), LAUNCHER.x, LAUNCHER.y, OUTER_LOWER_R);
  const tR = rayCircle(x1, by, -Math.cos(tA), Math.sin(tA), LAUNCHER.x, LAUNCHER.y, OUTER_LOWER_R);
  const pts: Pt[] = [];
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
  const ai = pts.length - 1; // right taper endpoint = lower-arc start
  const aR = Math.atan2(tR.y - LAUNCHER.y, tR.x - LAUNCHER.x);
  let aL = Math.atan2(tL.y - LAUNCHER.y, tL.x - LAUNCHER.x);
  if (aL < aR) aL += Math.PI * 2;
  const segs = 24;
  for (let i = 1; i <= segs; i++) {
    const ang = aR + ((aL - aR) * i) / segs;
    push(LAUNCHER.x + Math.cos(ang) * OUTER_LOWER_R, LAUNCHER.y + Math.sin(ang) * OUTER_LOWER_R);
  }
  const bi = pts.length - 1; // left taper endpoint = lower-arc end
  const lu = unit(tL.x - x0, tL.y - by);
  push(x0 + lu.x * jr, by + lu.y * jr);
  quad(x0 + lu.x * jr, by + lu.y * jr, x0, by, x0, by - jr); // left taper → left junction
  push(x0, ty + topR);
  quad(x0, ty + topR, x0, ty, x0 + topR, ty);
  return { pts, ai, bi };
}

// Inward (toward interior) uniform offset of a closed polyline by d, using winding-consistent
// edge normals — gives a UNIFORM perpendicular gap on every edge (rect sides, tapers, arcs).
function offsetInward(pts: Pt[], d: number): Pt[] {
  const n = pts.length;
  let area2 = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    area2 += a.x * b.y - b.x * a.y;
  }
  const f = area2 > 0 ? 1 : -1; // interior side from winding
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n];
    const e1 = unit(cur.x - prev.x, cur.y - prev.y);
    const e2 = unit(next.x - cur.x, next.y - cur.y);
    let nx = -f * (e1.y + e2.y), ny = f * (e1.x + e2.x); // mean of the two edges' inward normals
    const nl = Math.hypot(nx, ny) || 1;
    out.push({ x: cur.x + (nx / nl) * d, y: cur.y + (ny / nl) * d });
  }
  return out;
}

// Gold visual frame (outer shield).
export function boardOutline(): Pt[] {
  return shieldPath().pts;
}

// Inner line (brown, collision): gold outline offset inward by INNER_INSET for a UNIFORM gap on the
// rect + tapers, then the lower-arc block is replaced by the launcher's UPPER arc (over the top) —
// so the launcher circle sits OUTSIDE the inner line, in the background-color band.
export function innerOutline(): Pt[] {
  const g = shieldPath();
  const off = offsetInward(g.pts, INNER_INSET);
  const IR = off[g.ai], IL = off[g.bi]; // taper endpoints, now on the launcher circle (upper sides)
  const aR = Math.atan2(IR.y - LAUNCHER.y, IR.x - LAUNCHER.x);
  let aL = Math.atan2(IL.y - LAUNCHER.y, IL.x - LAUNCHER.x);
  while (aL > aR) aL -= Math.PI * 2; // go the UPPER way (decreasing, through straight-up)
  const upper: Pt[] = [];
  const segs = 18;
  for (let i = 1; i < segs; i++) {
    const a = aR + ((aL - aR) * i) / segs;
    upper.push({ x: LAUNCHER.x + Math.cos(a) * LAUNCHER.r, y: LAUNCHER.y + Math.sin(a) * LAUNCHER.r });
  }
  return [...off.slice(0, g.ai + 1), ...upper, ...off.slice(g.bi)];
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
