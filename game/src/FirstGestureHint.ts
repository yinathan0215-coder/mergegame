import { Container, Graphics, Text } from 'pixi.js';
import { DESIGN, LAUNCHER } from './data/config';

// First-launch coach (docs/50-art-ux/input-ux §첫 제스처 코치): on entering Pool In-Game the screen is
// DIMMED and a 👆 finger repeatedly presses at the launch planet and drags DOWN ("press & pull back to
// launch"), looping until the player starts aiming (hidden while aiming) and gone for good after the
// first launch. The dim is NON-interactive — pressing through it reaches the launcher and starts aiming,
// which hides the coach. Render-only.
const PERIOD = 1400; // one loop (ms)
const DRAG = 78; // how far the finger travels downward each loop (px)
const DIM_ALPHA = 0.55;
const DIM_MARGIN = 3000; // oversize so the dim bleeds to the viewport edges under the contain transform

export class FirstGestureHint {
  readonly container = new Container();
  private dim = new Graphics();
  private finger: Text;
  private hint: Text;
  private active = false;
  private t0 = 0;

  constructor(layer: Container) {
    // 코치 표시 중 화면 딤드 — 입력은 막지 않는다(누르면 조준 시작 → 코치 사라짐)
    this.dim.beginFill(0x000000, DIM_ALPHA);
    this.dim.drawRect(-DIM_MARGIN, -DIM_MARGIN, DESIGN.w + 2 * DIM_MARGIN, DESIGN.h + 2 * DIM_MARGIN);
    this.dim.endFill();
    this.dim.eventMode = 'none';

    this.finger = new Text('👆', { fontSize: 46, fontFamily: 'Arial, sans-serif' });
    this.finger.anchor.set(0.5, 0.05);
    this.finger.x = LAUNCHER.x;
    this.hint = new Text('꾹 눌러 아래로 당기기', {
      fill: 0xffffff, fontSize: 16, fontFamily: 'Arial, sans-serif', fontWeight: '800',
      stroke: 0x0a0a14, strokeThickness: 4,
    });
    this.hint.anchor.set(0.5);
    this.hint.x = LAUNCHER.x;
    this.hint.y = LAUNCHER.y + DRAG + 46;

    this.container.addChild(this.dim, this.finger, this.hint); // dim 뒤, finger/hint 앞
    this.container.visible = false;
    layer.addChild(this.container);
  }

  // Toggle the coach on/off (GameScene drives this each tick: on until aiming/first launch).
  setActive(on: boolean, now: number) {
    if (on === this.active) return;
    this.active = on;
    this.container.visible = on;
    if (on) this.t0 = now;
  }

  update(now: number) {
    if (!this.active) return;
    const k = ((now - this.t0) % PERIOD) / PERIOD;
    const e = 1 - (1 - k) * (1 - k); // ease-out downward drag
    this.finger.y = LAUNCHER.y + 6 + e * DRAG;
    // fade in at the start of each loop, fade out at the end (the drag "lifts off")
    this.finger.alpha = k < 0.12 ? k / 0.12 : k > 0.82 ? Math.max(0, (1 - k) / 0.18) : 1;
  }
}
