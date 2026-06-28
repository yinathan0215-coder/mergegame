import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { DESIGN, COLORS } from './data/config';
import { tierData } from './data/planets';
import { makePlanetSprite } from './PlanetFactory';
import { attachButtonFeedback } from './ui/button';

// Dimmed "new planet unlocked" modal (docs/30-systems/tier-unlock): a slowly rotating sprite of the
// just-unlocked planet + a single OK button over a full-screen dim. The game is paused while it is up;
// OK closes it and unlocks the next tier. Render/UI only.
//
// The dim must cover the WHOLE viewport, but the Pixi canvas is contain-fit and letterboxed, so a Pixi
// rect can only darken the board area. A DOM <div> sitting BEHIND the (opaque) canvas dims the
// letterbox margins; together with the Pixi dim the entire screen reads as one continuous dim.
const ENTER_MS = 220; // entrance transition (dim fills + content pops/fades in)
const DIM_ALPHA = 0.72;

export class UnlockModal {
  readonly container = new Container();
  private dim = new Graphics();
  private content = new Container(); // rotating planet + name + OK button — scales/fades in together
  private planet?: Container;
  private nameText: Text; // English name of the unlocked planet (upright, above the rotating planet)
  private letterboxDim: HTMLDivElement;
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
    const g = new Graphics();
    g.beginFill(COLORS.btnBlue);
    g.drawRoundedRect(-bw / 2, -bh / 2, bw, bh, 14);
    g.endFill();
    okBtn.addChild(g);
    const label = new Text('OK', { fill: 0xffffff, fontSize: 26, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    label.anchor.set(0.5);
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

    // letterbox dim (DOM) — behind the opaque canvas, fades with CSS to match the entrance transition
    this.letterboxDim = document.createElement('div');
    this.letterboxDim.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.72);opacity:0;transition:opacity 180ms ease;pointer-events:none;z-index:-1;';
    document.body.appendChild(this.letterboxDim);
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
    this.letterboxDim.style.opacity = '1';
    this.t0 = performance.now();
    this.entering = true;
  }

  hide() {
    this.container.visible = false;
    this.letterboxDim.style.opacity = '0';
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
