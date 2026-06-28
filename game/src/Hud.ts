import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { HUD, COLORS, JUICE } from './data/config';
import { ASSETS, ASSET_SIZES } from './assets';

function txt(s: string, size: number, color: number, weight: string): Text {
  return new Text(s, { fill: color, fontSize: size, fontFamily: 'Arial, sans-serif', fontWeight: weight as any });
}

// Top HUD (docs/50-art-ux/layout): left = money + exit, center = Score + 👑best,
// right = menu + ranking. Friend/Premium excluded. Queue row sits below the bar.
export class Hud {
  private scoreText: Text;
  private bestText: Text;
  private best = 0;
  private target = 0; // latest actual score
  private shown = 0; // odometer display value, rolls toward target

  constructor(layer: Container) {
    const cx = HUD.w / 2;

    // ── center: 👑 best (small) + Score (big) ──
    const crown = Sprite.from(ASSETS.ui.crown);
    const yk = 22;
    crown.anchor.set(0.5);
    crown.x = cx - 58;
    crown.y = yk + 2;
    crown.scale.set(28 / ASSET_SIZES.uiIcon.w);
    layer.addChild(crown);
    this.bestText = txt('0', 17, 0xcccccc, '700');
    this.bestText.anchor.set(0, 0.5);
    this.bestText.x = cx - 42;
    this.bestText.y = yk + 2;
    layer.addChild(this.bestText);
    this.scoreText = txt('0', 32, COLORS.hudText, '800');
    this.scoreText.anchor.set(0.5, 0.5);
    this.scoreText.x = cx;
    this.scoreText.y = 56;
    layer.addChild(this.scoreText);

    // ── top-left: money pill + exit button ──
    this.moneyPill(layer, 12, 12);
    this.button(layer, 12, 50, 'exit');

    // ── top-right: ranking pill + menu button ──
    this.rankingPill(layer, HUD.w - 134, 12);
    this.button(layer, HUD.w - 46, 50, 'menu');
  }

  private moneyPill(layer: Container, x: number, y: number) {
    const g = new Graphics();
    g.beginFill(COLORS.pillBlue);
    g.drawRoundedRect(x, y, 98, 30, 15);
    g.endFill();
    layer.addChild(g);
    const coin = Sprite.from(ASSETS.ui.gold);
    coin.anchor.set(0.5);
    coin.x = x + 16;
    coin.y = y + 15;
    coin.scale.set(24 / ASSET_SIZES.uiIcon.w);
    layer.addChild(coin);
    const c = txt('50', 16, 0xffffff, '800');
    c.anchor.set(0.5, 0.5);
    c.x = x + 56;
    c.y = y + 15;
    layer.addChild(c);
    const plus = new Graphics();
    plus.beginFill(0x35c759);
    plus.drawCircle(x + 94, y + 7, 10);
    plus.endFill();
    layer.addChild(plus);
    const pt = txt('+', 17, 0xffffff, '800');
    pt.anchor.set(0.5, 0.5);
    pt.x = x + 94;
    pt.y = y + 6;
    layer.addChild(pt);
  }

  private rankingPill(layer: Container, x: number, y: number) {
    const g = new Graphics();
    g.beginFill(COLORS.pillDark);
    g.drawRoundedRect(x, y, 122, 30, 8);
    g.endFill();
    g.beginFill(0x2f7fd0);
    g.drawCircle(x + 16, y + 15, 10);
    g.endFill();
    g.beginFill(0x2e9b4a, 0.9);
    g.drawCircle(x + 13, y + 13, 4);
    g.drawCircle(x + 19, y + 18, 3);
    g.endFill();
    layer.addChild(g);
    const t = txt('#1861171', 14, 0x6fb0ff, '800');
    t.anchor.set(0, 0.5);
    t.x = x + 32;
    t.y = y + 15;
    layer.addChild(t);
  }

  private button(layer: Container, x: number, y: number, kind: 'exit' | 'menu') {
    const g = new Graphics();
    g.beginFill(COLORS.btnBlue);
    g.drawRoundedRect(x, y, 32, 30, 8);
    g.endFill();
    g.lineStyle(3, 0xffffff, 1);
    if (kind === 'exit') {
      g.moveTo(x + 23, y + 15);
      g.lineTo(x + 10, y + 15);
      g.moveTo(x + 15, y + 10);
      g.lineTo(x + 10, y + 15);
      g.lineTo(x + 15, y + 20);
    } else {
      for (const dy of [9, 15, 21]) {
        g.moveTo(x + 8, y + dy);
        g.lineTo(x + 24, y + dy);
      }
    }
    layer.addChild(g);
  }

  setScore(score: number) {
    this.target = score;
    if (score > this.best) {
      this.best = score;
      this.bestText.text = this.best.toLocaleString();
    }
  }

  // Odometer: roll the shown value toward target in integer steps (docs/50-art-ux/feedback-effects).
  // Big jumps roll fast, small ones tick by 1. Called every tick.
  update() {
    if (this.shown === this.target) return;
    const diff = this.target - this.shown;
    const dir = Math.sign(diff);
    this.shown += Math.max(1, Math.ceil(Math.abs(diff) * JUICE.scoreRoll.lerp)) * dir;
    if ((dir > 0 && this.shown > this.target) || (dir < 0 && this.shown < this.target)) {
      this.shown = this.target;
    }
    this.scoreText.text = this.shown.toLocaleString();
  }
}
