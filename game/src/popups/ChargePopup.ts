import { Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { DESIGN, MODES, COLORS } from '../data/config';
import { tierData } from '../data/planets';
import { Popup } from '../ui/Popup';
import { button3D, attachButtonFeedback, BUTTON3D_DY } from '../ui/button';
import { makePlanetSprite } from '../PlanetFactory';
import { coinSprite } from '../ui/coin';

// Infinite-only charge popup (docs/30-systems/planet-charge): a rotating Earth with the "+N" count to
// buy, a slider 0..(max affordable, in stepPlanets units), and a 충전 button with a [coin] current/needed
// readout. coinPer10 coins buy stepPlanets count; default +defaultPlanets. If coins < coinPer10 the
// slider is locked at 0. Coin spend + count grant are done by the host via onBuy().
const CH = MODES.infinite.charge; // { coinPer10, stepPlanets, defaultPlanets }
const TRACK_L = 88;
const TRACK_R = 362;
const TRACK_Y = 474;

export class ChargePopup extends Popup {
  private earth: Container;
  private plusText: Text;
  private fill = new Graphics();
  private knob = new Graphics();
  private btnFace = new Container();
  private coinText: Text;
  private value = 0; // planets to charge (multiple of stepPlanets)
  private maxValue = 0; // max affordable (planets)
  private dragging = false;

  constructor(private getCoins: () => number, private onBuy: (n: number) => boolean) {
    super({ title: 'Planet Charge' });
    const cx = DESIGN.w / 2;

    // rotating Earth + "+N" to its right
    this.earth = makePlanetSprite(5);
    this.earth.scale.set(96 / (tierData(5).radius * 2));
    this.earth.x = cx - 44;
    this.earth.y = 300;
    this.body.addChild(this.earth);
    this.plusText = new Text('+0', { fill: 0xffe28a, fontSize: 46, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.plusText.anchor.set(0, 0.5);
    this.plusText.x = cx + 28;
    this.plusText.y = 300;
    this.body.addChild(this.plusText);

    // slider (track + fill + knob) — interactive strip handles drag
    const track = new Graphics();
    track.beginFill(0x0e1730);
    track.drawRoundedRect(TRACK_L, TRACK_Y - 5, TRACK_R - TRACK_L, 10, 5);
    track.endFill();
    this.body.addChild(track, this.fill, this.knob);

    const strip = new Container();
    strip.eventMode = 'static';
    strip.cursor = 'pointer';
    strip.hitArea = new Rectangle(TRACK_L - 24, TRACK_Y - 28, TRACK_R - TRACK_L + 48, 56);
    strip.on('pointerdown', (e: FederatedPointerEvent) => { this.dragging = true; this.setFromEvent(e); });
    strip.on('globalpointermove', (e: FederatedPointerEvent) => { if (this.dragging) this.setFromEvent(e); });
    strip.on('pointerup', () => { this.dragging = false; });
    strip.on('pointerupoutside', () => { this.dragging = false; });
    this.body.addChild(strip);

    // 충전 button + [coin] current/needed below it
    const btn = new Container();
    btn.x = cx;
    btn.y = 566;
    btn.hitArea = new Rectangle(-120, -32, 240, 64);
    btn.addChild(this.btnFace);
    const btnLabel = new Text('충전', { fill: 0xffffff, fontSize: 22, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    btnLabel.anchor.set(0.5);
    btnLabel.y = BUTTON3D_DY;
    btn.addChild(btnLabel);
    attachButtonFeedback(btn, () => this.doCharge());
    this.body.addChild(btn);

    const coin = coinSprite(22);
    coin.x = cx - 44;
    coin.y = 622;
    this.coinText = new Text('0/0', { fill: 0xdde7ff, fontSize: 18, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.coinText.anchor.set(0, 0.5);
    this.coinText.x = cx - 28;
    this.coinText.y = 622;
    this.body.addChild(coin, this.coinText);
  }

  // Re-read coins and reset the slider to the default (clamped to affordable) each time it opens.
  refresh() {
    const coins = this.getCoins();
    this.maxValue = Math.floor(coins / CH.coinPer10) * CH.stepPlanets;
    this.value = Math.min(CH.defaultPlanets, this.maxValue);
    this.redraw();
  }

  private needed(): number {
    return (this.value / CH.stepPlanets) * CH.coinPer10;
  }

  private setFromEvent(e: FederatedPointerEvent) {
    if (this.maxValue <= 0) { this.value = 0; this.redraw(); return; } // locked at 0
    const x = this.body.toLocal(e.global).x;
    const frac = Math.max(0, Math.min(1, (x - TRACK_L) / (TRACK_R - TRACK_L)));
    const maxSteps = this.maxValue / CH.stepPlanets;
    const steps = Math.round(frac * maxSteps);
    this.value = Math.max(0, Math.min(this.maxValue, steps * CH.stepPlanets));
    this.redraw();
  }

  private redraw() {
    const frac = this.maxValue > 0 ? this.value / this.maxValue : 0;
    const kx = TRACK_L + (TRACK_R - TRACK_L) * frac;
    this.fill.clear();
    this.fill.beginFill(COLORS.btnBlue);
    this.fill.drawRoundedRect(TRACK_L, TRACK_Y - 5, Math.max(0, kx - TRACK_L), 10, 5);
    this.fill.endFill();
    this.knob.clear();
    this.knob.beginFill(this.maxValue > 0 ? 0xffffff : 0x55617f);
    this.knob.drawCircle(kx, TRACK_Y, 15);
    this.knob.endFill();
    this.plusText.text = `+${this.value}`;
    const enabled = this.value > 0;
    this.btnFace.removeChildren();
    this.btnFace.addChild(button3D(240, 64, COLORS.btnBlue, 14, !enabled));
    this.coinText.text = `${this.getCoins()}/${this.needed()}`;
  }

  private doCharge() {
    if (this.value <= 0) return;
    if (this.onBuy(this.value)) this.close();
  }

  protected onUpdate(now: number) {
    this.earth.rotation = now * 0.0012; // 회전하는 지구
  }
}
