import { Container, Rectangle, Text } from 'pixi.js';
import { makePlanetSprite } from './PlanetFactory';
import { tierData } from './data/planets';
import { button3D, attachButtonFeedback, BUTTON3D_DY } from './ui/button';
import type { GameMode } from './modes/ModeController';

// In-game HUD widgets in a BOTTOM STRIP below the board/launcher (docs/50-art-ux/layout §2-b ·
// 30-systems/launch-count) — kept under the playground so nothing covers the play area:
//   • bottom-left  — remaining COUNT + NEXT planet preview, laid out SIDE BY SIDE, vertically
//                    centred on the right-hand button
//   • bottom-right — Infinite: "Planet Charge" button (rotating Earth) opening the charge popup
//                    Stage: the target planet (name + rotating planet image)
// Lives on GameScene's uiLayer (visible only in PoolInGame). Planets here rotate every frame.
const STRIP_Y = 752; // bottom-strip vertical centre (DESIGN h=800, board/launcher end ~688)

function cap(s: string, x: number, y: number, anchorX = 0): Text {
  const t = new Text(s, { fill: 0x9fb0d8, fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
  t.anchor.set(anchorX, 0.5);
  t.x = x;
  t.y = y;
  return t;
}

export class GameInfoPanel {
  readonly container = new Container();
  private countText: Text;
  private nextWrap = new Container(); // NEXT planet mini-sprite
  private chargeBtn = new Container(); // Infinite only
  private chargeEarth: Container;
  private targetWrap = new Container(); // Stage only
  private targetCap: Text;
  private targetName: Text;
  private targetPlanet = new Container();

  constructor(layer: Container, onCharge: () => void) {
    // ── bottom-left: COUNT + NEXT, side by side, centred on STRIP_Y ──
    this.container.addChild(cap('COUNT', 22, STRIP_Y - 15));
    this.countText = new Text('0', { fill: 0xffffff, fontSize: 28, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.countText.anchor.set(0, 0.5);
    this.countText.x = 22;
    this.countText.y = STRIP_Y + 8;
    this.nextWrap.x = 142;
    this.nextWrap.y = STRIP_Y + 6;
    this.container.addChild(this.countText, cap('NEXT', 108, STRIP_Y - 15), this.nextWrap);

    // ── Infinite: Planet Charge button (bottom-right) ──
    this.chargeBtn.x = 388;
    this.chargeBtn.y = STRIP_Y;
    this.chargeBtn.hitArea = new Rectangle(-56, -36, 112, 72);
    this.chargeBtn.addChild(button3D(112, 72, 0x49a8e6));
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
    this.targetWrap.x = 388;
    this.targetWrap.y = STRIP_Y - 2;
    this.targetCap = cap('TARGET', 388, STRIP_Y - 40, 0.5);
    this.container.addChild(this.targetCap);
    this.targetWrap.addChild(this.targetPlanet);
    this.targetName = new Text('', { fill: 0xffe28a, fontSize: 15, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    this.targetName.anchor.set(0.5);
    this.targetName.y = 30;
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
