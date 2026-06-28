import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { DESIGN, COLORS } from './data/config';
import { tierData } from './data/planets';
import { makePlanetSprite } from './PlanetFactory';
import { attachButtonFeedback, button3D, BUTTON3D_DY } from './ui/button';

// Dimmed "new planet unlocked" modal (docs/30-systems/tier-unlock): a slowly rotating sprite of the
// just-unlocked planet + a single OK button over a full-screen dim. The game is paused while it is up;
// OK closes it and unlocks the next tier. Render/UI only.
//
// The dim covers the WHOLE viewport: the modal lives in GameScene's cover popup layer (popupRoot), so the
// Pixi dim rect scales to fill the entire screen (top/bottom included) — the same 2-layer fit as the
// galaxy/scene-fade. No separate DOM dim is needed (the canvas now fills the viewport).
const ENTER_MS = 220; // entrance transition (dim fills + content pops/fades in)
const DIM_ALPHA = 0.72;

export class UnlockModal {
  readonly container = new Container();
  private dim = new Graphics();
  private content = new Container(); // rotating planet + name + OK button — scales/fades in together
  private planet?: Container;
  private nameText: Text; // English name of the unlocked planet (upright, above the rotating planet)
  private t0 = 0;
  private entering = false;

  constructor(onOk: () => void) {
    this.container.visible = false;

    // board dim (Pixi) — alpha animated via this.dim.alpha; swallows board pointer input while up
    this.dim.beginFill(0x000000, 1);
    this.dim.drawRect(0, 0, DESIGN.w, DESIGN.h);
    this.dim.endFill();
    this.dim.eventMode = 'static';
    this.dim.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.dim);

    // content scales around the screen centre (pivot = centre)
    this.content.pivot.set(DESIGN.w / 2, DESIGN.h / 2);
    this.content.position.set(DESIGN.w / 2, DESIGN.h / 2);
    this.container.addChild(this.content);

    // OK button — a centred container so the press feedback scales it in place
    const bw = 150;
    const bh = 52;
    const okBtn = new Container();
    okBtn.x = DESIGN.w / 2;
    okBtn.y = DESIGN.h * 0.62;
    okBtn.hitArea = new Rectangle(-bw / 2, -bh / 2, bw, bh);
    okBtn.addChild(button3D(bw, bh, COLORS.btnBlue, 14)); // 입체 버튼 (docs/50-art-ux/popup-system 버튼 규칙)
    const label = new Text('OK', { fill: 0xffffff, fontSize: 26, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    label.anchor.set(0.5);
    label.y = BUTTON3D_DY;
    okBtn.addChild(label);
    attachButtonFeedback(okBtn, onOk);
    this.content.addChild(okBtn);

    // unlocked planet's English name — upright, set per-tier in show()
    this.nameText = new Text('', {
      fill: 0xffffff,
      fontSize: 28,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '800',
      stroke: 0x0a0a14,
      strokeThickness: 4,
    });
    this.nameText.anchor.set(0.5);
    this.content.addChild(this.nameText);
  }

  show(tier: number) {
    if (this.planet) this.planet.destroy({ children: true });
    this.planet = makePlanetSprite(tier);
    this.planet.x = DESIGN.w / 2;
    this.planet.y = DESIGN.h * 0.4;
    this.planet.scale.set(1.7);
    this.content.addChildAt(this.planet, 0); // behind the OK button
    this.nameText.text = tierData(tier).en;
    this.nameText.x = DESIGN.w / 2;
    this.nameText.y = DESIGN.h * 0.4 - tierData(tier).radius * 1.7 - 18; // above the (1.7×) planet
    this.container.visible = true;
    this.t0 = performance.now();
    this.entering = true;
  }

  hide() {
    this.container.visible = false;
    this.entering = false;
  }

  // Drive the entrance transition + spin the unlocked planet (called every tick, even while paused).
  update() {
    if (!this.container.visible) return;
    if (this.entering) {
      const k = Math.min(1, (performance.now() - this.t0) / ENTER_MS);
      const e = 1 - (1 - k) * (1 - k); // ease-out
      this.dim.alpha = DIM_ALPHA * e;
      this.content.alpha = e;
      this.content.scale.set(0.85 + 0.15 * e);
      if (k >= 1) this.entering = false;
    }
    if (this.planet) this.planet.rotation += 0.02;
  }
}
