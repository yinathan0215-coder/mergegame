import { Container, Text } from 'pixi.js';
import { PLAY, JUICE, FONT } from './data/config';

const C = JUICE.combo;

// Merge CHAIN COUNTER (docs/50-art-ux/feedback-effects §8). An absolute hold timer (holdMs) resets
// on every merge; a merge while the timer is alive increments the count, otherwise the chain restarts
// at 1. Rendered as "Combo / N" centred on the background, BEHIND the planets — full opacity until
// fadeStartMs, then it fades out to 0 by holdMs. Purely a visual count, NOT a score multiplier (the
// multiplier combo was removed: 40-balancing/decisions/2026-06-28-remove-combo).
export class Combo {
  private label: Text;
  private num: Text;
  private count = 0;
  private shown = 0; // odometer display value
  private lastRoll = 0; // 직전 odometer 갱신 시각 — 롤 속도 프레임레이트 무관(docs/90-methodology/game-loop)
  private lastMergeAt = -1e9; // timer anchor; reset on each merge

  constructor(layer: Container) {
    const cx = PLAY.x + PLAY.w / 2;
    const cy = PLAY.y + PLAY.h * C.cyFrac;
    const color = parseInt(C.color.slice(1), 16);
    const mk = (s: string, size: number, anchorY: number, y: number): Text => {
      const t = new Text(s, { fill: color, fontSize: size, fontFamily: FONT, fontWeight: '800' });
      t.anchor.set(0.5, anchorY);
      t.x = cx;
      t.y = y;
      t.alpha = 0; // hidden until a chain starts
      layer.addChild(t);
      return t;
    };
    this.label = mk('Combo', C.labelSize, 1, cy - C.gap / 2); // "Combo" above the line
    this.num = mk('0', C.numberSize, 0, cy + C.gap / 2); // number below
  }

  get value(): number {
    return this.count;
  }

  reset() {
    this.count = 0;
    this.shown = 0;
    this.lastMergeAt = -1e9;
  }

  // A successful merge: increment if the hold timer is still alive, else restart the chain at 1;
  // then reset the timer (absolute hold window from now). Returns the milestone bonus score to award
  // (count × bonusPer) when the count lands on a multiple of `step` (5/10/15…), else 0.
  onMerge(now: number): number {
    this.count = now < this.lastMergeAt + C.holdMs ? this.count + 1 : 1;
    this.lastMergeAt = now;
    return this.count % C.step === 0 ? this.count * C.bonusPer : 0;
  }

  update(now: number) {
    const frames = this.lastRoll ? Math.min(4, (now - this.lastRoll) / (1000 / 60)) : 1;
    this.lastRoll = now;
    if (this.count === 0) {
      this.label.alpha = this.num.alpha = 0;
      return;
    }
    const elapsed = now - this.lastMergeAt;
    if (elapsed >= C.holdMs) {
      // timer ran out → chain ends
      this.count = 0;
      this.shown = 0;
      this.label.alpha = this.num.alpha = 0;
      return;
    }
    // full opacity until fadeStartMs, then linear fade to 0 by holdMs
    const a = elapsed <= C.fadeStartMs ? C.alpha : C.alpha * (1 - (elapsed - C.fadeStartMs) / (C.holdMs - C.fadeStartMs));
    this.label.alpha = this.num.alpha = a;
    // odometer: rise toward the count by 1-unit steps, same as the score roll
    if (this.shown !== this.count) {
      this.shown += Math.max(1, Math.ceil((this.count - this.shown) * JUICE.scoreRoll.lerp * frames));
      if (this.shown > this.count) this.shown = this.count;
      this.num.text = String(this.shown);
    }
  }
}
