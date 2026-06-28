import { Container, Rectangle, Text } from 'pixi.js';
import { makePlanetSprite } from './PlanetFactory';
import { tierData } from './data/planets';
import { LAUNCHER, INNER_INSET } from './data/config';
import { button3D, attachButtonFeedback, BUTTON3D_DY } from './ui/button';
import type { GameMode } from './modes/ModeController';

// In-game HUD widgets sitting on a strip whose BOTTOM aligns with the board outline's bottom edge
// (docs/50-art-ux/layout §2-b · 30-systems/launch-count) — under the playground so nothing covers it:
//   • bottom-left  — COUNT and NEXT as two SIDE-BY-SIDE centred columns (title over value),
//                    vertically centred on the right-hand button
//   • bottom-right — Infinite: "Planet Charge" button (rotating Earth); Stage: target planet
// Lives on GameScene's uiLayer (visible only in PoolInGame). Planets here rotate every frame.
const BOARD_BOTTOM = LAUNCHER.y + LAUNCHER.r + INNER_INSET; // gold shield outline bottom (~696)
const BTN_H = 72;
const STRIP_C = BOARD_BOTTOM + 18; // widget vertical centre just below the board outline end
const COUNT_X = 66;
const NEXT_X = 130;
const RIGHT_X = 388;

function cap(s: string, x: number, y: number): Text {
  const t = new Text(s, { fill: 0x9fb0d8, fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
  t.anchor.set(0.5);
  t.x = x;
  t.y = y;
  return t;
}

export class GameInfoPanel {
  readonly container = new Container();
  private countText: Text;
  private nextWrap = new Container(); // NEXT planet mini-sprite (centred)
  private chargeBtn = new Container(); // Infinite only
  private chargeEarth: Container;
  private targetWrap = new Container(); // Stage only
  private targetCap: Text;
  private targetName: Text;
  private targetPlanet = new Container();

  constructor(layer: Container, onCharge: () => void) {
    // ── bottom-left: COUNT + NEXT — two centred columns (title over value), side by side ──
    this.countText = new Text('0', { fill: 0xffffff, fontSize: 28, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.countText.anchor.set(0.5);
    this.countText.x = COUNT_X;
    this.countText.y = STRIP_C + 11;
    this.nextWrap.x = NEXT_X;
    this.nextWrap.y = STRIP_C + 11;
    this.container.addChild(
      cap('COUNT', COUNT_X, STRIP_C - 15), this.countText,
      cap('NEXT', NEXT_X, STRIP_C - 15), this.nextWrap,
    );

    // ── Infinite: Planet Charge button (bottom-right) ──
    this.chargeBtn.x = RIGHT_X;
    this.chargeBtn.y = STRIP_C;
    this.chargeBtn.hitArea = new Rectangle(-56, -BTN_H / 2, 112, BTN_H);
    this.chargeBtn.addChild(button3D(112, BTN_H, 0x49a8e6));
    this.chargeEarth = makePlanetSprite(5); // 회전하는 지구 아이콘
    this.chargeEarth.scale.set(40 / (tierData(5).radius * 2));
    this.chargeEarth.x = -34;
    this.chargeEarth.y = BUTTON3D_DY;
    const chargeLabel = new Text('Planet\nCharge', {
      fill: 0xffffff, fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: '800', align: 'center', lineHeight: 16,
    });
    chargeLabel.anchor.set(0.5);
    chargeLabel.x = 22;
    chargeLabel.y = BUTTON3D_DY;
    this.chargeBtn.addChild(this.chargeEarth, chargeLabel);
    attachButtonFeedback(this.chargeBtn, onCharge);
    this.container.addChild(this.chargeBtn);

    // ── Stage: target planet (bottom-right, same slot as charge) ──
    this.targetWrap.x = RIGHT_X;
    this.targetWrap.y = STRIP_C - 4;
    this.targetCap = cap('TARGET', RIGHT_X, STRIP_C - 34);
    this.container.addChild(this.targetCap);
    this.targetWrap.addChild(this.targetPlanet);
    this.targetName = new Text('', { fill: 0xffe28a, fontSize: 15, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.targetName.anchor.set(0.5);
    this.targetName.y = 28;
    this.targetWrap.addChild(this.targetName);
    this.container.addChild(this.targetWrap);

    layer.addChild(this.container);
  }

  setCount(n: number) {
    this.countText.text = String(n);
  }

  setNext(tier: number) {
    this.nextWrap.removeChildren();
    const icon = makePlanetSprite(tier);
    icon.scale.set(30 / (tierData(tier).radius * 2));
    this.nextWrap.addChild(icon);
  }

  // Configure which mode widgets are visible + the Stage target planet.
  setMode(mode: GameMode, targetTier: number) {
    const stage = mode === 'Stage';
    this.chargeBtn.visible = !stage;
    this.targetWrap.visible = stage;
    this.targetCap.visible = stage;
    if (stage && targetTier > 0) {
      this.targetPlanet.removeChildren();
      const p = makePlanetSprite(targetTier);
      p.scale.set(44 / (tierData(targetTier).radius * 2));
      this.targetPlanet.addChild(p);
      this.targetName.text = tierData(targetTier).en;
    }
  }

  update(now: number) {
    this.chargeEarth.rotation = now * 0.001; // 회전하는 지구
    this.targetPlanet.rotation = now * 0.001; // 회전하는 목표 행성
  }
}
