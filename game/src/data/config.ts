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

// Polyline sampling — dense enough that large-radius curves read as smooth, not faceted. The board
// geometry is STATIC, so this cost is paid once (boardOutline/innerOutline are memoised below).
const DENS = 3.5; // ~px between samples
const segN = (len: number) => Math.max(2, Math.ceil(Math.abs(len) / DENS));
function quadInto(out: Pt[], p0: Pt, c: Pt, p1: Pt) {
  const n = segN(Math.hypot(c.x - p0.x, c.y - p0.y) + Math.hypot(p1.x - c.x, p1.y - c.y));
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push({ x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y });
  }
}
function arcInto(out: Pt[], cx: number, cy: number, r: number, a0: number, a1: number) {
  const n = segN(Math.abs(a1 - a0) * r);
  for (let i = 1; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
}
const FILLET = 14; // round-off length where a taper meets the launcher arc

// Gold shield outline. ai/bi bracket the bottom block (right-taper-end .. left-taper-start), so the
// inner line can keep the offset tapers and swap the gold's lower arc for a launcher-TOP cap.
function shieldPath(): { pts: Pt[]; ai: number; bi: number } {
  const x0 = PLAY.x, x1 = PLAY.x + PLAY.w, ty = PLAY.y, by = LINE_Y;
  const topR = L.cornerR, jr = JUNCTION_R, R = OUTER_LOWER_R, cX = LAUNCHER.x, cY = LAUNCHER.y;
  const tL = rayCircle(x0, by, Math.cos(tA), Math.sin(tA), cX, cY, R);
  const tR = rayCircle(x1, by, -Math.cos(tA), Math.sin(tA), cX, cY, R);
  const ru = unit(tR.x - x1, tR.y - by), lu = unit(tL.x - x0, tL.y - by);
  const Rj = { x: x1 + ru.x * jr, y: by + ru.y * jr }; // right rect→taper junction end (taper start)
  const Lj = { x: x0 + lu.x * jr, y: by + lu.y * jr }; // left taper end (rect junction start)
  const tdR = unit(tR.x - Rj.x, tR.y - Rj.y);
  const tuL = unit(Lj.x - tL.x, Lj.y - tL.y);
  const aR = Math.atan2(tR.y - cY, tR.x - cX);
  let aL = Math.atan2(tL.y - cY, tL.x - cX);
  if (aL < aR) aL += Math.PI * 2;
  const dA = FILLET / R;
  const rTaperEnd = { x: tR.x - tdR.x * FILLET, y: tR.y - tdR.y * FILLET };
  const lTaperStart = { x: tL.x + tuL.x * FILLET, y: tL.y + tuL.y * FILLET };
  const arc0 = { x: cX + Math.cos(aR + dA) * R, y: cY + Math.sin(aR + dA) * R };
  const arc1 = { x: cX + Math.cos(aL - dA) * R, y: cY + Math.sin(aL - dA) * R };

  const out: Pt[] = [];
  out.push({ x: x0 + topR, y: ty });
  out.push({ x: x1 - topR, y: ty });
  arcInto(out, x1 - topR, ty + topR, topR, -Math.PI / 2, 0); // top-right corner (true arc)
  out.push({ x: x1, y: by - jr }); // right side
  quadInto(out, { x: x1, y: by - jr }, { x: x1, y: by }, Rj); // right rect→taper junction
  out.push(rTaperEnd); // right taper (straight)
  const ai = out.length - 1;
  quadInto(out, rTaperEnd, tR, arc0); // right taper→arc fillet (rounded)
  arcInto(out, cX, cY, R, aR + dA, aL - dA); // lower arc
  quadInto(out, arc1, tL, lTaperStart); // arc→left taper fillet (rounded)
  const bi = out.length - 1;
  out.push(Lj); // left taper (straight)
  quadInto(out, Lj, { x: x0, y: by }, { x: x0, y: by - jr }); // left taper→rect junction
  out.push({ x: x0, y: ty + topR }); // left side
  arcInto(out, x0 + topR, ty + topR, topR, -Math.PI, -Math.PI / 2); // top-left corner (true arc)
  return { pts: out, ai, bi };
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

let _board: Pt[] | null = null;
let _inner: Pt[] | null = null;

// Gold visual frame (outer shield) — STATIC, baked once.
export function boardOutline(): Pt[] {
  if (!_board) _board = shieldPath().pts;
  return _board;
}

// Inner line (brown, collision): gold offset inward by INNER_INSET (uniform gap), then the bottom is
// a launcher-TOP cap rounded into the tapers — so the launcher sits OUTSIDE the inner line, in the
// background-color band. STATIC, baked once (shared by render, physics, and aim raycasts).
export function innerOutline(): Pt[] {
  if (_inner) return _inner;
  const g = shieldPath();
  const off = offsetInward(g.pts, INNER_INSET);
  const nn = off.length;
  const A = off[g.ai], B = off[g.bi]; // offset taper ends (right, left)
  const beforeA = off[(g.ai - 1 + nn) % nn], afterB = off[(g.bi + 1) % nn];
  const cX = LAUNCHER.x, cY = LAUNCHER.y, R = LAUNCHER.r;
  const aA = Math.atan2(A.y - cY, A.x - cX);
  let aB = Math.atan2(B.y - cY, B.x - cX);
  while (aB > aA) aB -= Math.PI * 2; // upper way: decreasing from aA through straight-up to aB
  const dA = Math.min(FILLET / R, (aA - aB) / 4); // don't let the fillets swallow the cap
  const arc0 = { x: cX + Math.cos(aA - dA) * R, y: cY + Math.sin(aA - dA) * R };
  const arc1 = { x: cX + Math.cos(aB + dA) * R, y: cY + Math.sin(aB + dA) * R };
  const cap: Pt[] = [];
  quadInto(cap, beforeA, A, arc0); // round the right taper→cap corner
  arcInto(cap, cX, cY, R, aA - dA, aB + dA); // launcher-top cap arc
  quadInto(cap, arc1, B, afterB); // round the cap→left taper corner
  _inner = [...off.slice(0, g.ai), ...cap, ...off.slice(g.bi + 2)];
  return _inner;
}

// collision categories for the one-way line (docs/30-systems/play-area-boundary)
export const CAT = { DEFAULT: 0x0001, LAUNCHER: 0x0002 };

// ── Colours: #rrggbb strings → 0xRRGGBB numbers ─────────────────────────────
export const COLORS = Object.fromEntries(
  Object.entries(balance.colors).map(([k, v]) => [k, parseInt((v as string).slice(1), 16)])
) as Record<string, number>;

// ── Typography: single font family + named size scale (SSoT = balance.json) ──
export const FONT = balance.fontFamily as string;
export const TYPE = balance.type as Record<string, number>;

// ── Behaviour groups (verbatim from JSON) ───────────────────────────────────
export const LAUNCH = balance.launch;
export const PHYSICS = balance.physics;
export const SCORING = balance.scoring; // { collisionPoint }
export const JUICE = balance.juice; // mergePop / burst / scorePopup / scoreRoll
export const QUEUE_SIZE = balance.queue.size;
export const PROGRESSION = balance.progression; // { unlockStart, queueBelow, queueCap }
export const STEP_MS = 1000 / balance.engine.fixedFps;

// ── Game modes (Infinite / Stage): count + charge + black-hole bonus + stage levels ─────────
// Rules: docs/20-core-loop/game-modes · docs/30-systems/{launch-count,planet-charge,stage-mode}.
export const MODES = balance.modes;
export const RESULT = balance.juice.result; // Infinite result count-up tween (countUpMs)

// ── Meta layer (Title lobby): coin economy + daily missions + attendance + lucky wheel ───────
// Rules: docs/30-systems/{meta-economy,daily-missions,attendance,lucky-wheel,shop}. Numbers SSoT
// = balance.json (mirrored in docs/40-balancing/meta-economy).
export const ECONOMY = balance.economy; // { startCoins }
export const MISSIONS = balance.dailyMissions; // { perMission, milestones, list[] }
export const ATTENDANCE = balance.attendance; // { rewards[7] }
export const WHEEL = balance.wheel; // { segments[8], cost, coinsPerPourSprite, decelMs, spinSpeed }
export const POPUP = balance.juice.popup; // { enterMs, dimAlpha, startScale } — shared open transition
