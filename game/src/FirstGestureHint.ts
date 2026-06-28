import { Container, Graphics, Text } from 'pixi.js';
import { DESIGN, LAUNCHER, COLORS, FONT, TYPE } from './data/config';

// First-launch coach (docs/50-art-ux/input-ux §첫 제스처 코치): on entering Pool In-Game the screen is
// DIMMED and a 👆 finger repeatedly mimes the full slingshot — PRESS (shrink), drag DOWN, then RELEASE
// (spring back past 1.0 + lift off) — looping until the player starts aiming (hidden while aiming) and
// gone for good after the first launch. The dim is NON-interactive — pressing through it reaches the
// launcher and starts aiming, which hides the coach. Render-only.
const PERIOD = 1400; // one loop (ms)
const DRAG = 78; // how far the finger travels downward each loop (px)
const PRESS_SCALE = 0.78; // finger shrinks while pressed (눌리는 느낌)
const POP_SCALE = 1.12; // springs back past 1.0 on release (놓는 시늉)
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
    this.dim.beginFill(COLORS.black, DIM_ALPHA);
    this.dim.drawRect(-DIM_MARGIN, -DIM_MARGIN, DESIGN.w + 2 * DIM_MARGIN, DESIGN.h + 2 * DIM_MARGIN);
    this.dim.endFill();
    this.dim.eventMode = 'none';

    this.finger = new Text('👆', { fontSize: TYPE.s46, fontFamily: FONT });
    this.finger.anchor.set(0.5, 0.05);
    this.finger.x = LAUNCHER.x;
    this.hint = new Text('꾹 눌러 아래로 당겨 놓기', {
      fill: COLORS.white, fontSize: TYPE.s16, fontFamily: FONT, fontWeight: '800',
      stroke: COLORS.pocket, strokeThickness: 4,
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

  // One loop mimes press-drag-release: press-in (fade + shrink) → pull down (held small) → release pop
  // (spring back past 1.0 + small lift) → lift off (fade away). docs/50-art-ux/input-ux §첫 제스처 코치.
  update(now: number) {
    if (!this.active) return;
    const k = ((now - this.t0) % PERIOD) / PERIOD;
    const topY = LAUNCHER.y + 6;
    let y: number, scale: number, alpha: number;
    if (k < 0.12) {
      const p = k / 0.12; // press in: fade in + shrink to the pressed scale
      alpha = p;
      scale = 1 - (1 - PRESS_SCALE) * p;
      y = topY;
    } else if (k < 0.6) {
      const p = (k - 0.12) / 0.48; // pull down while pressed
      const e = 1 - (1 - p) * (1 - p); // ease-out
      alpha = 1;
      scale = PRESS_SCALE;
      y = topY + e * DRAG;
    } else if (k < 0.76) {
      const p = (k - 0.6) / 0.16; // release: spring back past 1.0 + a tiny lift (놓는 시늉)
      alpha = 1;
      scale = PRESS_SCALE + (POP_SCALE - PRESS_SCALE) * p;
      y = topY + DRAG - p * 8;
    } else {
      const p = (k - 0.76) / 0.24; // lift off: settle scale + fade away upward
      alpha = Math.max(0, 1 - p);
      scale = POP_SCALE + (1 - POP_SCALE) * p;
      y = topY + DRAG - 8 - p * 18;
    }
    this.finger.y = y;
    this.finger.scale.set(scale);
    this.finger.alpha = alpha;
  }
}
