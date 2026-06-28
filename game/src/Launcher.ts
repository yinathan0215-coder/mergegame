import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { LAUNCHER, LAUNCH, PLAY, GAUGE, TAPER_L, TAPER_R, FAN_HALF, COLORS } from './data/config';
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

export interface LauncherHost {
  currentTier(): number;
  fire(tier: number, vx: number, vy: number): boolean;
  obstacles(): { x: number; y: number; r: number }[];
}

// Press-drag-release slingshot at the launcher circle (docs/30-systems/launcher):
// • fire direction is clamped to a 120° fan around straight-up (±60°);
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

  // Pre-drawn dot track on the launcher's lower arc; fills CLOCKWISE from the left.
  private drawGauge(power: number) {
    this.gauge.clear();
    const n = GAUGE.dots;
    const filled = Math.round(Math.max(0, Math.min(power, 1)) * n);
    const aR = Math.atan2(TAPER_R.y - GAUGE.cy, TAPER_R.x - GAUGE.cx);
    let aL = Math.atan2(TAPER_L.y - GAUGE.cy, TAPER_L.x - GAUGE.cx);
    if (aL < aR) aL += Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const ang = aL - ((aL - aR) * i) / (n - 1); // left → bottom → right
      const x = GAUGE.cx + Math.cos(ang) * GAUGE.r;
      const y = GAUGE.cy + Math.sin(ang) * GAUGE.r;
      this.gauge.beginFill(i < filled ? COLORS.gaugeFill : COLORS.gaugeEmpty, 1);
      this.gauge.drawCircle(x, y, GAUGE.dotR);
      this.gauge.endFill();
    }
  }

  // Predict the shot's flight to the FIRST collision (a board wall OR another ball), inflating
  // obstacles by the shot ball's radius, and return the hit point + reflected direction (bounce).
  private predict(dirx: number, diry: number) {
    const shotR = tierData(this.host.currentTier()).radius;
    const ox = LAUNCHER.x;
    const oy = LAUNCHER.y;
    let bestT = Infinity;
    let nx = 0;
    let ny = 0;
    // other balls — centre-line stops where the two discs would touch
    for (const o of this.host.obstacles()) {
      const t = rayCircle(ox, oy, dirx, diry, o.x, o.y, o.r + shotR);
      if (t !== null && t < bestT) {
        bestT = t;
        const l = Math.hypot(ox + dirx * t - o.x, oy + diry * t - o.y) || 1;
        nx = (ox + dirx * t - o.x) / l;
        ny = (oy + diry * t - o.y) / l;
      }
    }
    // play-area walls (rect inset by the shot radius): top, left, right
    const top = PLAY.y + shotR;
    const left = PLAY.x + shotR;
    const right = PLAY.x + PLAY.w - shotR;
    if (diry < -1e-6) {
      const t = (top - oy) / diry;
      const hx = ox + dirx * t;
      if (t > 0 && t < bestT && hx >= left && hx <= right) { bestT = t; nx = 0; ny = 1; }
    }
    if (dirx < -1e-6) {
      const t = (left - ox) / dirx;
      if (t > 0 && t < bestT && oy + diry * t >= top) { bestT = t; nx = 1; ny = 0; }
    }
    if (dirx > 1e-6) {
      const t = (right - ox) / dirx;
      if (t > 0 && t < bestT && oy + diry * t >= top) { bestT = t; nx = -1; ny = 0; }
    }
    if (!isFinite(bestT)) bestT = PLAY.h;
    const hx = ox + dirx * bestT;
    const hy = oy + diry * bestT;
    const dot = dirx * nx + diry * ny;
    return { hx, hy, rx: dirx - 2 * dot * nx, ry: diry - 2 * dot * ny };
  }

  // Aim = predicted trajectory to the first collision (wall or ball) + the bounce angle there.
  // The line always reaches the collision; power is shown by the gauge, not the line length.
  private redraw() {
    this.aim.clear();
    const shot = this.computeShot();
    const t = this.predict(shot.dirx, shot.diry);
    this.aim.lineStyle(4, COLORS.aimLine, 0.5);
    this.aim.moveTo(LAUNCHER.x, LAUNCHER.y);
    this.aim.lineTo(t.hx, t.hy);
    this.aim.beginFill(COLORS.aimLine, 0.7);
    this.aim.drawCircle(t.hx, t.hy, 5);
    this.aim.endFill();
    // collision angle: a short reflected segment past the hit point
    this.aim.lineStyle(3, COLORS.aimLine, 0.3);
    this.aim.moveTo(t.hx, t.hy);
    this.aim.lineTo(t.hx + t.rx * 38, t.hy + t.ry * 38);
    this.drawGauge(shot.power);
  }
}
