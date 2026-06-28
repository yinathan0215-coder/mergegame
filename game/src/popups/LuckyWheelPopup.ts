import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { DESIGN, WHEEL } from '../data/config';
import { Popup } from '../ui/Popup';
import { attachButtonFeedback, button3D, BUTTON3D_DY } from '../ui/button';
import { coinSprite } from '../ui/coin';
import type { MetaStore } from '../MetaStore';

// 행운의 돌림판 (docs/30-systems/lucky-wheel). No BG panel — wheel on the dim. Flow: press 회전 (spend
// 120) → the wheel spins at constant speed; press 정지 → a segment is chosen uniformly at random and the
// wheel decelerates over decelMs (ease-out) to land exactly under the top pointer, then pays out. The
// result is fixed at the moment 정지 is pressed (deterministic deceleration, no further randomness).
const SEG = WHEEL.segments as number[];
const N = SEG.length;
const SEG_ANG = (2 * Math.PI) / N;
const SEG_FILL = [0xe23b2e, 0xf0a93f, 0x3fc6d4, 0xe87fae, 0xf0c93f, 0xe23b2e, 0x3fc6d4, 0xe87fae];
const R = 150; // wheel radius (DESIGN space)

type Phase = 'idle' | 'spinning' | 'decel';

export class LuckyWheelPopup extends Popup {
  private static readonly BW = 210;
  private static readonly BH = 60;
  private wheel = new Container();
  private btn = new Container();
  private rot = 0; // current wheel rotation (rad)
  private phase: Phase = 'idle';
  private decelT0 = 0;
  private decelFrom = 0;
  private decelTo = 0;
  private resultIndex = -1;
  private winText!: Text;

  constructor(private store: MetaStore) {
    super({ title: '행운의 돌림판', hasBg: false });
    const cx = DESIGN.w / 2;
    const cy = this.panel.y + 250;
    this.wheel.x = cx;
    this.wheel.y = cy;
    this.drawWheel();
    this.body.addChild(this.wheel);

    // fixed top pointer (arrow pointing down into the wheel)
    const ptr = new Graphics();
    ptr.beginFill(0x2a1530);
    ptr.moveTo(cx - 16, cy - R - 6); ptr.lineTo(cx + 16, cy - R - 6); ptr.lineTo(cx, cy - R + 22); ptr.closePath();
    ptr.endFill();
    this.body.addChild(ptr);
    // hub
    const hub = new Graphics();
    hub.beginFill(0x7a3b12); hub.drawCircle(cx, cy, 26); hub.endFill();
    hub.beginFill(0xe0a23a); hub.drawCircle(cx, cy, 18); hub.endFill();
    this.body.addChild(hub);

    this.winText = new Text('', { fill: 0xffe28a, fontSize: 24, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.winText.anchor.set(0.5);
    this.winText.x = cx; this.winText.y = cy + R + 36;
    this.body.addChild(this.winText);

    this.buildButton(cx, cy + R + 92);
  }

  private drawWheel() {
    const g = new Graphics();
    g.lineStyle(6, 0xe0a23a);
    g.beginFill(0x7a3b12); g.drawCircle(0, 0, R + 8); g.endFill(); // rim
    for (let i = 0; i < N; i++) {
      const a0 = i * SEG_ANG - Math.PI / 2 - SEG_ANG / 2; // segment i centred at the top when rot lands on it
      g.lineStyle(0);
      g.beginFill(SEG_FILL[i % SEG_FILL.length]);
      g.moveTo(0, 0);
      g.arc(0, 0, R, a0, a0 + SEG_ANG);
      g.closePath();
      g.endFill();
    }
    this.wheel.addChild(g);
    for (let i = 0; i < N; i++) {
      const a = i * SEG_ANG - Math.PI / 2; // label angle (segment centre)
      const coin = coinSprite(34); // real coin icon (docs/30-systems/meta-economy)
      coin.x = Math.cos(a) * R * 0.46;
      coin.y = Math.sin(a) * R * 0.46;
      coin.rotation = a + Math.PI / 2;
      this.wheel.addChild(coin);
      const t = new Text(String(SEG[i]), { fill: 0xffffff, fontSize: 22, fontFamily: 'Arial, sans-serif', fontWeight: '800', stroke: 0x5a2a00, strokeThickness: 3 });
      t.anchor.set(0.5);
      t.x = Math.cos(a) * R * 0.74;
      t.y = Math.sin(a) * R * 0.74;
      t.rotation = a + Math.PI / 2;
      this.wheel.addChild(t);
    }
  }

  private buildButton(x: number, y: number) {
    this.btn.x = x; this.btn.y = y;
    this.btn.hitArea = new Rectangle(-LuckyWheelPopup.BW / 2, -LuckyWheelPopup.BH / 2, LuckyWheelPopup.BW, LuckyWheelPopup.BH);
    attachButtonFeedback(this.btn, () => this.onButton());
    this.body.addChild(this.btn);
    this.renderButton();
  }

  // Rebuild the button face + content for the current phase (docs/30-systems/lucky-wheel 표시):
  //   spinning → "정지" only;  idle/decel → [coin] over [cost] stacked on the left + "회전" on the right.
  //   idle with coins < cost → disabled (greyed) so it reads as "need coins", not broken.
  private renderButton() {
    this.btn.removeChildren().forEach((c) => c.destroy({ children: true }));
    const w = LuckyWheelPopup.BW, h = LuckyWheelPopup.BH, dy = BUTTON3D_DY;
    if (this.phase === 'spinning') {
      this.btn.addChild(button3D(w, h, 0xe5483a, 16)); // red stop
      const t = new Text('정지', { fill: 0xffffff, fontSize: 24, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      t.anchor.set(0.5); t.y = dy;
      this.btn.addChild(t);
      return;
    }
    const broke = this.store.coins < WHEEL.cost;
    this.btn.addChild(button3D(w, h, 0x49a8e6, 16, broke));
    const ink = broke ? 0x9aa6c4 : 0xffffff;
    const coin = coinSprite(22); coin.x = -52; coin.y = dy - 11; coin.alpha = broke ? 0.6 : 1;
    const cost = new Text(String(WHEEL.cost), { fill: ink, fontSize: 15, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    cost.anchor.set(0.5); cost.x = -52; cost.y = dy + 12;
    const spin = new Text('회전', { fill: ink, fontSize: 24, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    spin.anchor.set(0.5); spin.x = 24; spin.y = dy;
    this.btn.addChild(coin, cost, spin);
  }

  refresh() {
    // reset to idle each open
    this.phase = 'idle';
    this.winText.text = '';
    this.renderButton();
  }

  private onButton() {
    if (this.phase === 'idle') this.startSpin();
    else if (this.phase === 'spinning') this.stopOn(Math.floor(Math.random() * N)); // uniform random result, fixed now
  }

  // Begin a spin (spend the cost). Returns false if already spinning or coins are insufficient.
  startSpin(): boolean {
    if (this.phase !== 'idle') return false;
    if (!this.store.spendCoins(WHEEL.cost)) return false;
    this.winText.text = '';
    this.phase = 'spinning';
    this.renderButton();
    return true;
  }

  // Public hook so tests can force a deterministic result while spinning.
  stopOn(index: number) {
    if (this.phase !== 'spinning') return;
    this.resultIndex = ((index % N) + N) % N;
    // land so segment `resultIndex` sits under the top pointer: rot ≡ -resultIndex*SEG_ANG (mod 2π)
    const target = -this.resultIndex * SEG_ANG;
    const cur = this.rot % (2 * Math.PI);
    let delta = (target - cur) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;
    this.decelFrom = this.rot;
    this.decelTo = this.rot + delta + 2 * Math.PI * 4; // +4 full turns for a satisfying slow-down
    this.decelT0 = performance.now();
    this.phase = 'decel';
    this.renderButton();
  }

  get lastWin(): number { return this._lastWin; }
  private _lastWin = 0;

  protected onUpdate(now: number) {
    if (this.phase === 'spinning') {
      this.rot += WHEEL.spinSpeed * 16.67; // ~constant per frame
      this.wheel.rotation = this.rot;
    } else if (this.phase === 'decel') {
      const k = Math.min(1, (now - this.decelT0) / WHEEL.decelMs);
      const e = 1 - (1 - k) * (1 - k) * (1 - k); // ease-out cubic
      this.rot = this.decelFrom + (this.decelTo - this.decelFrom) * e;
      this.wheel.rotation = this.rot;
      if (k >= 1) {
        this.phase = 'idle';
        const win = SEG[this.resultIndex];
        this._lastWin = win;
        this.store.addCoins(win);
        this.winText.text = `+${win}`;
        this.renderButton();
      }
    }
  }
}
