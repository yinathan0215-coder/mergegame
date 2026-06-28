import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { LAUNCHER, LAUNCH, PLAY, GAUGE, FAN_HALF, COLORS, innerOutline } from './data/config';
import { tierData } from './data/planets';
import { makePlanetSprite } from './PlanetFactory';

// First positive ray–circle intersection distance (ray dir is unit length); null if none ahead.
function rayCircle(ox: number, oy: number, dx: number, dy: number, cx: number, cy: number, rad: number): number | null {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - rad * rad;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / 2;
  if (t1 > 0.001) return t1;
  const t2 = (-b + sq) / 2;
  return t2 > 0.001 ? t2 : null;
}

// First positive ray–segment intersection distance (ray dir is unit length); null if none.
function raySegment(ox: number, oy: number, dx: number, dy: number, ax: number, ay: number, bx: number, by: number): number | null {
  const ex = bx - ax;
  const ey = by - ay;
  const det = ex * dy - dx * ey;
  if (Math.abs(det) < 1e-9) return null;
  const rax = ax - ox;
  const ray = ay - oy;
  const t = (ex * ray - ey * rax) / det;
  const s = (dx * ray - dy * rax) / det;
  return t > 0.5 && s >= 0 && s <= 1 ? t : null;
}

export interface LauncherHost {
  currentTier(): number;
  fire(tier: number, vx: number, vy: number): boolean;
  obstacles(): { x: number; y: number; r: number }[];
}

// Press-drag-release slingshot at the launcher circle (docs/30-systems/launcher):
// • fire direction is clamped to a 90° fan around straight-up (±45°, layout.fanDeg);
// • no drag (within the dead-zone) fires straight up at minimum power;
// • the dotted arc under the launcher is a POWER GAUGE — a pre-drawn empty track that fills
//   CLOCKWISE from the left (red) with drag power (docs/50-art-ux/screen-structure).
export class Launcher {
  private aiming = false;
  private curX = 0;
  private curY = 0;
  private gauge: Graphics;
  private aim: Graphics;
  private chamber = new Container();
  private shownTier = -1;
  private readonly outline = innerOutline(); // static board geometry, cached for aim raycasts

  constructor(
    stage: Container,
    aimLayer: Container,
    chamberLayer: Container,
    private host: LauncherHost
  ) {
    this.gauge = new Graphics();
    aimLayer.addChild(this.gauge);
    this.aim = new Graphics();
    aimLayer.addChild(this.aim);
    chamberLayer.addChild(this.chamber);
    stage.on('pointerdown', this.onDown);
    stage.on('pointermove', this.onMove);
    stage.on('pointerup', this.onUp);
    stage.on('pointerupoutside', this.onUp);
    this.drawGauge(0);
  }

  private onDown = (e: FederatedPointerEvent) => {
    this.aiming = true;
    this.curX = e.global.x;
    this.curY = e.global.y;
    this.redraw();
  };

  private onMove = (e: FederatedPointerEvent) => {
    if (!this.aiming) return;
    this.curX = e.global.x;
    this.curY = e.global.y;
    this.redraw();
  };

  private onUp = () => {
    if (!this.aiming) return;
    this.aiming = false;
    this.aim.clear();
    this.drawGauge(0);
    const shot = this.computeShot();
    this.host.fire(this.host.currentTier(), shot.vx, shot.vy);
  };

  // Always returns a shot. No drag → straight up, min power. Direction clamped to the upward fan.
  private computeShot() {
    const pullx = this.curX - LAUNCHER.x;
    const pully = this.curY - LAUNCHER.y;
    const dist = Math.hypot(pullx, pully);
    let dirx: number, diry: number, power: number;
    if (dist < (LAUNCH.deadzonePx ?? 6)) {
      dirx = 0;
      diry = -1;
      power = LAUNCH.minPower;
    } else {
      power = Math.max(LAUNCH.minPower, Math.min(dist / LAUNCH.dragMax, 1));
      dirx = -pullx / dist;
      diry = -pully / dist;
    }
    // clamp direction to ±FAN_HALF around straight-up
    const up = -Math.PI / 2;
    let delta = Math.atan2(diry, dirx) - up;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    if (delta > FAN_HALF) delta = FAN_HALF;
    if (delta < -FAN_HALF) delta = -FAN_HALF;
    const ang = up + delta;
    dirx = Math.cos(ang);
    diry = Math.sin(ang);
    const speed = power * LAUNCH.vMax;
    return { vx: dirx * speed, vy: diry * speed, dirx, diry, power };
  }

  update() {
    const tier = this.host.currentTier();
    if (tier === this.shownTier) return;
    this.shownTier = tier;
    this.chamber.removeChildren();
    const s = makePlanetSprite(tier);
    s.x = LAUNCHER.x;
    s.y = LAUNCHER.y;
    this.chamber.addChild(s);
  }

  // Pre-drawn dot track on the launcher's LOWER SEMICIRCLE (≈180°); fills from the left, clockwise.
  private drawGauge(power: number) {
    this.gauge.clear();
    const n = GAUGE.dots;
    const filled = Math.round(Math.max(0, Math.min(power, 1)) * n);
    const aL = Math.PI, aR = 0; // left (π) → bottom (π/2) → right (0): the lower semicircle
    for (let i = 0; i < n; i++) {
      const ang = aL - ((aL - aR) * i) / (n - 1);
      const x = GAUGE.cx + Math.cos(ang) * GAUGE.r;
      const y = GAUGE.cy + Math.sin(ang) * GAUGE.r;
      this.gauge.beginFill(i < filled ? COLORS.gaugeFill : COLORS.gaugeEmpty, 1);
      this.gauge.drawCircle(x, y, GAUGE.dotR);
      this.gauge.endFill();
    }
  }

  // Cast a unit-direction ray from (ox,oy); return the first collision against any other ball
  // (inflated by the shot radius) or the inner-line wall (each segment offset INWARD by the shot
  // radius) + the surface normal there. Matches the real physics, so the bounce angle is accurate.
  private castRay(ox: number, oy: number, dx: number, dy: number, shotR: number) {
    let bestT = Infinity;
    let nx = 0;
    let ny = 0;
    for (const o of this.host.obstacles()) {
      const t = rayCircle(ox, oy, dx, dy, o.x, o.y, o.r + shotR);
      if (t !== null && t < bestT) {
        bestT = t;
        const l = Math.hypot(ox + dx * t - o.x, oy + dy * t - o.y) || 1;
        nx = (ox + dx * t - o.x) / l;
        ny = (oy + dy * t - o.y) / l;
      }
    }
    const pts = this.outline;
    const ccx = PLAY.x + PLAY.w / 2;
    const ccy = PLAY.y + PLAY.h / 2;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const c = pts[(i + 1) % pts.length];
      let inx = -(c.y - a.y);
      let iny = c.x - a.x;
      const il = Math.hypot(inx, iny) || 1;
      inx /= il;
      iny /= il;
      // make the normal point INWARD (toward the board centre)
      if (((a.x + c.x) / 2 - ccx) * inx + ((a.y + c.y) / 2 - ccy) * iny > 0) { inx = -inx; iny = -iny; }
      const t = raySegment(ox, oy, dx, dy, a.x + inx * shotR, a.y + iny * shotR, c.x + inx * shotR, c.y + iny * shotR);
      if (t !== null && t < bestT) { bestT = t; nx = inx; ny = iny; }
    }
    if (!isFinite(bestT)) return null;
    return { dist: bestT, hx: ox + dx * bestT, hy: oy + dy * bestT, nx, ny };
  }

  // A line from (x,y) along (dx,dy) for `len`, fading to transparent at its end (bounce preview).
  private drawFade(x: number, y: number, dx: number, dy: number, len: number) {
    const n = 10;
    for (let i = 0; i < n; i++) {
      this.aim.lineStyle(3, COLORS.aimLine, 0.4 * (1 - i / n));
      this.aim.moveTo(x + dx * (i / n) * len, y + dy * (i / n) * len);
      this.aim.lineTo(x + dx * ((i + 1) / n) * len, y + dy * ((i + 1) / n) * len);
    }
  }

  // Aim = trajectory to the FIRST collision (wall or ball) + a faded bounce line that STOPS at the
  // next collision. Cast from the real spawn point with the shot radius; power is shown by the gauge.
  private redraw() {
    this.aim.clear();
    const shot = this.computeShot();
    const shotR = tierData(this.host.currentTier()).radius;
    const ox = LAUNCHER.x + shot.dirx * (LAUNCHER.r + shotR + 1); // actual spawn point (outside the circle)
    const oy = LAUNCHER.y + shot.diry * (LAUNCHER.r + shotR + 1);
    const hit = this.castRay(ox, oy, shot.dirx, shot.diry, shotR);
    const hx = hit ? hit.hx : ox + shot.dirx * PLAY.h;
    const hy = hit ? hit.hy : oy + shot.diry * PLAY.h;
    this.aim.lineStyle(4, COLORS.aimLine, 0.5);
    this.aim.moveTo(LAUNCHER.x, LAUNCHER.y);
    this.aim.lineTo(hx, hy);
    if (hit) {
      this.aim.beginFill(COLORS.aimLine, 0.7);
      this.aim.drawCircle(hx, hy, 4);
      this.aim.endFill();
      const dot = shot.dirx * hit.nx + shot.diry * hit.ny;
      const rx = shot.dirx - 2 * dot * hit.nx;
      const ry = shot.diry - 2 * dot * hit.ny;
      const next = this.castRay(hx + rx * 0.5, hy + ry * 0.5, rx, ry, shotR);
      const blen = Math.min(90, next ? next.dist + 0.5 : 90); // bounce line stops at the next collision
      this.drawFade(hx, hy, rx, ry, blen);
    }
    this.drawGauge(shot.power);
  }
}
