import { Container, Graphics, Text } from 'pixi.js';
import { DESIGN, COLORS } from './data/config';
import { makePlanetSprite } from './PlanetFactory';

// Dimmed "new planet unlocked" modal (docs/30-systems/tier-unlock): a slowly rotating sprite of the
// just-unlocked planet + a single OK button over a full-screen dim. The game is paused while it is
// up; OK closes it and unlocks the next tier. Render/UI only.
export class UnlockModal {
  readonly container = new Container();
  private planet?: Container;

  constructor(onOk: () => void) {
    this.container.visible = false;

    // dim overlay — swallows board pointer input while up
    const dim = new Graphics();
    dim.beginFill(0x000000, 0.72);
    dim.drawRect(0, 0, DESIGN.w, DESIGN.h);
    dim.endFill();
    dim.eventMode = 'static';
    dim.on('pointerdown', (e) => e.stopPropagation());
    this.container.addChild(dim);

    // OK button
    const bw = 150;
    const bh = 52;
    const bx = DESIGN.w / 2 - bw / 2;
    const by = DESIGN.h * 0.62;
    const btn = new Graphics();
    btn.beginFill(COLORS.btnBlue);
    btn.drawRoundedRect(bx, by, bw, bh, 14);
    btn.endFill();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => e.stopPropagation());
    btn.on('pointertap', onOk);
    this.container.addChild(btn);
    const label = new Text('OK', { fill: 0xffffff, fontSize: 26, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    label.anchor.set(0.5);
    label.x = DESIGN.w / 2;
    label.y = by + bh / 2;
    this.container.addChild(label);
  }

  show(tier: number) {
    if (this.planet) this.planet.destroy({ children: true });
    this.planet = makePlanetSprite(tier);
    this.planet.x = DESIGN.w / 2;
    this.planet.y = DESIGN.h * 0.4;
    this.planet.scale.set(1.7);
    this.container.addChildAt(this.planet, 1); // above the dim, below the OK button
    this.container.visible = true;
  }

  hide() {
    this.container.visible = false;
  }

  // Spin the unlocked planet (called every tick, even while the game is paused).
  update() {
    if (this.container.visible && this.planet) this.planet.rotation += 0.02;
  }
}
