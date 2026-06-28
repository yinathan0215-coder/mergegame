import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { DESIGN, COLORS, FONT, TYPE } from './data/config';
import { tierData } from './data/planets';
import { makePlanetSprite } from './PlanetFactory';
import { attachButtonFeedback, button3D, BUTTON3D_DY } from './ui/button';

// Dimmed "new planet unlocked" modal (docs/30-systems/tier-unlock): top title "PLANET UNLOCK", a slowly
// rotating sprite of the just-unlocked planet, the planet's English name BELOW it, and (Infinite only) a
// "Count +N" line below the name, over a single OK button. The game is paused while it is up; OK closes
// it and unlocks the next tier. Render/UI only.
//
// The modal lives in GameScene's CONTAIN layer (fgRoot), like the meta popups (docs/50-art-ux/popup-system):
// content renders at normal size on every aspect ratio; the dim is drawn far past DESIGN so it covers the
// whole viewport (letterbox included) under the contain transform.
const ENTER_MS = 220;
const DIM_ALPHA = 0.72;
const DIM_MARGIN = 3000;
const PLANET_Y = DESIGN.h * 0.42;
const PLANET_SCALE = 1.5;

export class UnlockModal {
  readonly container = new Container();
  private dim = new Graphics();
  private content = new Container(); // title + rotating planet + name + bonus + OK — scales/fades in together
  private planet?: Container;
  private nameText: Text; // English name of the unlocked planet (below the planet)
  private bonusText: Text; // "Count +N" — Infinite only (below the name)
  private t0 = 0;
  private entering = false;

  constructor(onOk: () => void) {
    this.container.visible = false;

    const M = DIM_MARGIN;
    this.dim.beginFill(COLORS.black, 1);
    this.dim.drawRect(-M, -M, DESIGN.w + 2 * M, DESIGN.h + 2 * M);
    this.dim.endFill();
    this.dim.eventMode = 'static';
    this.dim.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(this.dim);

    this.content.pivot.set(DESIGN.w / 2, DESIGN.h / 2);
    this.content.position.set(DESIGN.w / 2, DESIGN.h / 2);
    this.container.addChild(this.content);

    // top title — English "PLANET UNLOCK" (docs/30-systems/tier-unlock 모달 UX)
    const title = new Text('PLANET UNLOCK', {
      fill: COLORS.white, fontSize: TYPE.s28, fontFamily: FONT, fontWeight: '800',
      stroke: COLORS.pocket, strokeThickness: 5,
    });
    title.anchor.set(0.5);
    title.x = DESIGN.w / 2;
    title.y = DESIGN.h * 0.24;
    this.content.addChild(title);

    // OK button
    const bw = 150;
    const bh = 52;
    const okBtn = new Container();
    okBtn.x = DESIGN.w / 2;
    okBtn.y = DESIGN.h * 0.7;
    okBtn.hitArea = new Rectangle(-bw / 2, -bh / 2, bw, bh);
    okBtn.addChild(button3D(bw, bh, COLORS.btnBlue, 14));
    const label = new Text('OK', { fill: COLORS.white, fontSize: TYPE.s26, fontFamily: FONT, fontWeight: '800' });
    label.anchor.set(0.5);
    label.y = BUTTON3D_DY;
    okBtn.addChild(label);
    attachButtonFeedback(okBtn, onOk);
    this.content.addChild(okBtn);

    // planet English name — below the planet (upright), set per-tier in show()
    this.nameText = new Text('', {
      fill: COLORS.white, fontSize: TYPE.s28, fontFamily: FONT, fontWeight: '800',
      stroke: COLORS.pocket, strokeThickness: 4,
    });
    this.nameText.anchor.set(0.5);
    this.content.addChild(this.nameText);

    // "Count +N" — emphasised, Infinite only (below the name, above OK)
    this.bonusText = new Text('', { fill: COLORS.gold, fontSize: TYPE.s24, fontFamily: FONT, fontWeight: '800' });
    this.bonusText.anchor.set(0.5);
    this.bonusText.visible = false;
    this.content.addChild(this.bonusText);
  }

  // countBonus > 0 (Infinite) → show "Count +N" and the count was granted by the caller.
  show(tier: number, countBonus = 0) {
    if (this.planet) this.planet.destroy({ children: true });
    this.planet = makePlanetSprite(tier);
    this.planet.x = DESIGN.w / 2;
    this.planet.y = PLANET_Y;
    this.planet.scale.set(PLANET_SCALE);
    this.content.addChildAt(this.planet, 0); // behind the texts/button
    const nameY = PLANET_Y + tierData(tier).radius * PLANET_SCALE + 24; // below the (1.5×) planet
    this.nameText.text = tierData(tier).en;
    this.nameText.x = DESIGN.w / 2;
    this.nameText.y = nameY;
    this.bonusText.visible = countBonus > 0;
    if (countBonus > 0) {
      this.bonusText.text = `Count +${countBonus}`;
      this.bonusText.x = DESIGN.w / 2;
      this.bonusText.y = nameY + 32;
    }
    this.container.visible = true;
    this.t0 = performance.now();
    this.entering = true;
  }

  hide() {
    this.container.visible = false;
    this.entering = false;
  }

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
