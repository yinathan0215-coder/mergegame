import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { COLORS, JUICE, WHEEL } from '../data/config';
import { coinSprite } from './coin';
import type { MetaStore } from '../MetaStore';

// Shared coin-balance pill (docs/30-systems/meta-economy · docs/50-art-ux/layout). ONE instance, owned by
// GameScene and shown at the top-left in BOTH the Title lobby and Pool In-Game (same position/component).
// The shown number rolls toward the wallet balance with the same odometer as the score HUD.
//
// Lucky-wheel pour (docs/30-systems/lucky-wheel 보상 연출): on payout the wheel calls `pour`, which spills
// `count` coins that SCATTER-FALL from the wheel under gravity (random spawn + varied directions) for ~1s,
// then STOP and arc (parabola) to the pill's coin icon. The win is credited to the wallet immediately, but
// the DISPLAYED number is held back (`pending`) until each coin lands — so the counter rolls up exactly as
// the coins arrive, not before. GameScene lifts the pill above the wheel dim so all of this stays visible.
//
// The container sits at fgRoot origin and lays its children out in absolute DESIGN coords (so pour
// `fromX/fromY`, passed in DESIGN space by the wheel, need no offset conversion).
const X0 = 18, Y0 = 18, PILL_W = 98, PILL_H = 32; // pill rect (matches the former Title moneyPill)
const ICON_X = X0 + 17, ICON_Y = Y0 + 16;          // coin-icon centre = the pour landing point

const COIN_D = 20;        // poured coin diameter
const FALL_MS = 1000;     // scatter-fall duration before coins fly to the pill
const FLY_MS = 560;       // parabola flight time to the icon
const GRAV = 760;         // fall gravity (DESIGN px / s²)
const VY0_MIN = -210, VY0_MAX = 70; // initial vertical velocity (px/s): mostly an upward pop, then gravity
const DRIFT = 170;        // max horizontal drift (px/s, ±) — varied directions
const SCATTER_X = 46, SCATTER_Y = 30; // random spawn offset around the wheel centre
const SPIN = 9;           // max tumble rate (rad/s, ±)
const ARC_MIN = 50, ARC_MAX = 120;    // parabola apex height (px)

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

interface Flyer {
  s: Sprite;
  value: number;   // coins this sprite credits to the display when it lands
  born: number;
  fallMs: number;  // this coin's fall duration (slight jitter so they don't all snap at once)
  sx: number; sy: number; vx: number; vy0: number; spin: number; // fall params
  flying: boolean; flyT0: number; fx: number; fy: number; arc: number; // fly params (set at transition)
}

export class CoinPill extends Container {
  private store: MetaStore;
  private label: Text;
  private shown: number;
  private pending = 0; // coins added to the wallet but not yet "landed" in the display
  private flyers: Flyer[] = [];

  constructor(store: MetaStore) {
    super();
    this.store = store;
    const bg = new Graphics();
    bg.beginFill(COLORS.pillBlue);
    bg.drawRoundedRect(X0, Y0, PILL_W, PILL_H, 16);
    bg.endFill();
    this.addChild(bg);

    const coin = coinSprite(24); // shared coin declaration (docs/50-art-ux/popup-system 아이콘 규칙)
    coin.x = ICON_X; coin.y = ICON_Y;
    this.addChild(coin);

    this.shown = store.coins;
    this.label = new Text(String(this.shown), { fill: 0xffffff, fontSize: 16, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.label.anchor.set(0.5);
    this.label.x = X0 + 57; this.label.y = Y0 + 16;
    this.addChild(this.label);
  }

  // Spill `count` coins from (fromX,fromY) that scatter-fall, then arc to the pill (docs/30-systems/lucky-wheel
  // 보상 연출). The wallet is already credited; `pending` holds the display back until each coin lands.
  pour(count: number, fromX: number, fromY: number) {
    const now = performance.now();
    const per = WHEEL.coinsPerPourSprite;
    this.pending += count * per;
    for (let i = 0; i < count; i++) {
      const s = coinSprite(COIN_D);
      const sx = fromX + rand(-SCATTER_X, SCATTER_X);
      const sy = fromY + rand(-SCATTER_Y, SCATTER_Y);
      s.x = sx; s.y = sy;
      this.addChild(s);
      this.flyers.push({
        s, value: per, born: now, fallMs: FALL_MS + rand(0, 140),
        sx, sy, vx: rand(-DRIFT, DRIFT), vy0: rand(VY0_MIN, VY0_MAX), spin: rand(-SPIN, SPIN),
        flying: false, flyT0: 0, fx: 0, fy: 0, arc: rand(ARC_MIN, ARC_MAX),
      });
    }
  }

  // Per-frame: roll the shown balance toward (wallet − pending), and advance the poured coins.
  update(now: number) {
    const target = this.store.coins - this.pending;
    if (this.shown !== target) {
      const diff = target - this.shown;
      const dir = Math.sign(diff);
      this.shown += Math.max(1, Math.ceil(Math.abs(diff) * JUICE.scoreRoll.lerp)) * dir;
      if ((dir > 0 && this.shown > target) || (dir < 0 && this.shown < target)) this.shown = target;
      this.label.text = String(this.shown);
    }
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i];
      if (!f.flying) {
        // scatter-fall: parametric so it's frame-rate independent (x linear drift, y under gravity)
        const t = (now - f.born) / 1000;
        f.s.x = f.sx + f.vx * t;
        f.s.y = f.sy + f.vy0 * t + 0.5 * GRAV * t * t;
        f.s.rotation = f.spin * t;
        if (now - f.born >= f.fallMs) { f.flying = true; f.flyT0 = now; f.fx = f.s.x; f.fy = f.s.y; }
      } else {
        const k = (now - f.flyT0) / FLY_MS;
        if (k >= 1) {
          this.pending = Math.max(0, this.pending - f.value); // landed → release into the counter
          f.s.destroy(); this.flyers.splice(i, 1); continue;
        }
        const e = k * k; // ease-in: accelerate into the pill
        f.s.x = f.fx + (ICON_X - f.fx) * e;
        f.s.y = f.fy + (ICON_Y - f.fy) * e - Math.sin(k * Math.PI) * f.arc; // parabola apex mid-flight
        f.s.alpha = k < 0.85 ? 1 : (1 - k) / 0.15; // fade out as it lands
      }
    }
  }
}
