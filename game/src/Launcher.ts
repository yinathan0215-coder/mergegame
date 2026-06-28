import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { LAUNCHER, LAUNCH, PLAY, GAUGE, TAPER_L, TAPER_R, FAN_HALF, COLORS } from './data/config';
import { makePlanetSprite } from './PlanetFactory';

export interface LauncherHost {
  currentTier(): number;
  fire(tier: number, vx: number, vy: number): boolean;
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

  private redraw() {
    this.aim.clear();
    const shot = this.computeShot();
    const maxLen = PLAY.h * 0.95;
    const len = Math.max(28, shot.power * maxLen);
    let ex = LAUNCHER.x + shot.dirx * len;
    let ey = LAUNCHER.y + shot.diry * len;
    ex = Math.max(PLAY.x + 4, Math.min(PLAY.x + PLAY.w - 4, ex));
    ey = Math.max(PLAY.y + 4, ey);
    this.aim.lineStyle(4, COLORS.aimLine, 0.45);
    this.aim.moveTo(LAUNCHER.x, LAUNCHER.y);
    this.aim.lineTo(ex, ey);
    this.aim.beginFill(COLORS.aimLine, 0.6);
    this.aim.drawCircle(ex, ey, 5);
    this.aim.endFill();
    this.drawGauge(shot.power);
  }
}
