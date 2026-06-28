import { Container, Graphics, Sprite, Text, type FederatedPointerEvent } from 'pixi.js';
import { HUD, COLORS, JUICE } from './data/config';
import { ASSETS, ASSET_SIZES } from './assets';

function txt(s: string, size: number, color: number, weight: string): Text {
  return new Text(s, { fill: color, fontSize: size, fontFamily: 'Arial, sans-serif', fontWeight: weight as any });
}

// Top HUD (docs/50-art-ux/layout): left = back button (→ Title), center = Score + 👑best,
// right = menu button. No money/ranking displays. Queue row sits below the bar.
export class Hud {
  private scoreText: Text;
  private bestText: Text;
  private best = 0;
  private target = 0; // latest actual score
  private shown = 0; // odometer display value, rolls toward target
  private crown!: Sprite;

  constructor(layer: Container, onBack: () => void) {
    const cx = HUD.w / 2;

    // ── center (HUD 수평 중앙 정렬): 👑 best (작게, 위) + Score (크게, 아래) ──
    this.crown = Sprite.from(ASSETS.ui.crown);
    this.crown.anchor.set(0.5);
    this.crown.scale.set(28 / ASSET_SIZES.uiIcon.w);
    layer.addChild(this.crown);
    this.bestText = txt('0', 17, 0xcccccc, '700');
    this.bestText.anchor.set(0, 0.5);
    layer.addChild(this.bestText);
    this.centerBest(); // crown + best 를 cx 기준 수평 중앙 정렬
    this.scoreText = txt('0', 32, COLORS.hudText, '800');
    this.scoreText.anchor.set(0.5, 0.5);
    this.scoreText.x = cx;
    this.scoreText.y = 50;
    layer.addChild(this.scoreText);

    // ── corners: back button (left, → Title) + menu button (right) ──
    this.button(layer, 12, 12, 'exit', onBack);
    this.button(layer, HUD.w - 44, 12, 'menu');
  }

  // x,y top-left of a 32×30 rounded shell button. onTap navigates; pointerdown is swallowed so the
  // tap never reaches the launcher (which would otherwise read it as an aim/fire on the board).
  private button(layer: Container, x: number, y: number, kind: 'exit' | 'menu', onTap?: () => void) {
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
    g.eventMode = 'static';
    g.cursor = 'pointer';
    g.on('pointerdown', (e: FederatedPointerEvent) => e.stopPropagation());
    if (onTap) g.on('pointertap', onTap);
    layer.addChild(g);
  }

  // crown + best 를 HUD 수평 중앙에 정렬 (best 폭이 바뀌면 재호출).
  private centerBest() {
    const cx = HUD.w / 2;
    const crownW = 28;
    const gap = 6;
    const left = cx - (crownW + gap + this.bestText.width) / 2;
    this.crown.x = left + crownW / 2;
    this.crown.y = 24;
    this.bestText.x = left + crownW + gap;
    this.bestText.y = 24;
  }

  setScore(score: number) {
    this.target = score;
    if (score > this.best) {
      this.best = score;
      this.bestText.text = this.best.toLocaleString();
      this.centerBest();
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
