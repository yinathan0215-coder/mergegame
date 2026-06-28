import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { COLORS, JUICE } from '../data/config';
import { coinSprite } from './coin';
import type { MetaStore } from '../MetaStore';

// Shared coin-balance pill (docs/30-systems/meta-economy · docs/50-art-ux/layout). ONE instance, owned by
// GameScene and shown at the top-left in BOTH the Title lobby and Pool In-Game (same position/component).
// The shown number rolls toward the wallet balance with the same odometer as the score HUD, so a coin
// gain/spend counts up/down 1-by-1. The lucky wheel pours coin sprites into it (`pour`) while GameScene
// lifts it above the wheel dim — so the payout visibly lands and the counter rolls (docs/30-systems/lucky-wheel).
//
// The container sits at fgRoot origin and lays its children out in absolute DESIGN coords (the pill's
// position is in the child coords, not the container's) so that pour `fromX/fromY` — passed in DESIGN
// space by the wheel — need no offset conversion.
const X0 = 18, Y0 = 18, PILL_W = 98, PILL_H = 32; // pill rect (matches the former Title moneyPill)
const ICON_X = X0 + 17, ICON_Y = Y0 + 16;          // coin-icon centre = the pour landing point
const POUR_MS = 620;     // flight time per poured coin
const POUR_STAGGER = 45; // delay between successive coins so they stream rather than clump

interface Flyer { s: Sprite; t0: number; fx: number; fy: number }

export class CoinPill extends Container {
  private label: Text;
  private shown: number;
  private target: number;
  private flyers: Flyer[] = [];

  constructor(store: MetaStore) {
    super();
    const bg = new Graphics();
    bg.beginFill(COLORS.pillBlue);
    bg.drawRoundedRect(X0, Y0, PILL_W, PILL_H, 16);
    bg.endFill();
    this.addChild(bg);

    const coin = coinSprite(24); // shared coin declaration (docs/50-art-ux/popup-system 아이콘 규칙)
    coin.x = ICON_X; coin.y = ICON_Y;
    this.addChild(coin);

    this.shown = this.target = store.coins;
    this.label = new Text(String(this.shown), { fill: 0xffffff, fontSize: 16, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.label.anchor.set(0.5);
    this.label.x = X0 + 57; this.label.y = Y0 + 16;
    this.addChild(this.label);

    store.subscribe(() => { this.target = store.coins; }); // wallet changed → roll toward it
  }

  // Spawn `count` coin sprites at (fromX,fromY) that arc to the pill's coin icon (docs/30-systems/lucky-wheel
  // 보상 연출). Called by the wheel on payout; the counter rolls up on its own as the wallet balance rises.
  pour(count: number, fromX: number, fromY: number) {
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const s = coinSprite(20);
      s.x = fromX; s.y = fromY;
      this.addChild(s);
      this.flyers.push({ s, t0: now + i * POUR_STAGGER, fx: fromX, fy: fromY });
    }
  }

  // Per-frame: roll the shown balance toward the wallet, and advance any poured coins.
  update(now: number) {
    if (this.shown !== this.target) {
      const diff = this.target - this.shown;
      const dir = Math.sign(diff);
      this.shown += Math.max(1, Math.ceil(Math.abs(diff) * JUICE.scoreRoll.lerp)) * dir;
      if ((dir > 0 && this.shown > this.target) || (dir < 0 && this.shown < this.target)) this.shown = this.target;
      this.label.text = String(this.shown);
    }
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i];
      const k = (now - f.t0) / POUR_MS;
      if (k <= 0) continue; // still in its stagger delay
      if (k >= 1) { f.s.destroy(); this.flyers.splice(i, 1); continue; }
      const e = k * k; // ease-in: accelerate toward the pill
      f.s.x = f.fx + (ICON_X - f.fx) * e;
      f.s.y = f.fy + (ICON_Y - f.fy) * e - Math.sin(k * Math.PI) * 40; // slight upward arc
      f.s.alpha = k < 0.85 ? 1 : (1 - k) / 0.15; // fade out as it lands
    }
  }
}
