import { Container, Graphics, Rectangle, Sprite, Text, type FederatedPointerEvent } from 'pixi.js';
import { ASSETS, ASSET_SIZES } from './assets';
import { GalaxyBackground } from './GalaxyBackground';
import { makePlanetSprite } from './PlanetFactory';
import { tierData } from './data/planets';
import { COLORS, DESIGN, JUICE } from './data/config';

// Title이 GameScene으로부터 받는 현재 세션 진행 상태(현재 점수 + 최대 머지 등급).
export interface TitleProgress {
  current: number; // 진행 중(이어하기) 점수
  maxTier: number; // 현재 세션 최대 머지 행성 등급
}

interface Orbit {
  sprite: Container;
  rx: number;
  ry: number;
  speed: number; // 공전 각속도 (rad/ms)
  phase: number;
  spin: number; // 자전 각속도 (rad/ms)
}

function makeText(value: string, size: number, color = 0xffffff, weight: '400' | '700' | '800' = '700') {
  return new Text(value, {
    fill: color,
    fontSize: size,
    fontFamily: 'Arial, sans-serif',
    fontWeight: weight,
  });
}

const ORBIT_CY = DESIGN.h * 0.3; // 태양계 중점 y — 태양이 게임 시작 버튼보다 위에 보이도록 상단 배치

export class TitleScreen {
  readonly container = new Container();
  private galaxy = new GalaxyBackground({ x: 0, y: 0, width: DESIGN.w, height: DESIGN.h, seed: 4242, count: 76 });
  private orbitLayer = new Container();
  private uiLayer = new Container();
  private orbits: Orbit[] = [];
  private sun!: Container;
  private toggleKnob = new Graphics();
  private toggleGalaxy = true;
  private knobTargetX = -48; // 토글 하이라이트 슬라이드 목표 x
  private currentIcon?: Container; // 현재 점수 옆 최대 머지 행성 아이콘
  private currentScore!: Text;
  private currentRowCx = 0;
  private currentRowY = 0;

  constructor(
    private onPlay: () => void,
    private getProgress: () => TitleProgress = () => ({ current: 0, maxTier: 1 })
  ) {
    this.container.eventMode = 'static';
    this.container.addChild(this.galaxy, this.orbitLayer, this.uiLayer);
    this.buildOrbitBackground();
    this.buildUi();
  }

  private buildOrbitBackground() {
    const cx = DESIGN.w / 2;
    const cy = ORBIT_CY; // 태양계 중점 — 게임 시작 버튼보다 위(상단)에 태양이 보이도록
    this.orbitLayer.sortableChildren = true; // y 기준 깊이 정렬(태양 포함, docs/50-art-ux/title-screen §1)

    // 살짝 눕힌 타원(ry = rx × 0.7). 바깥 궤도가 화면 세로(높이)를 꽉 채우도록 크게 — 넘쳐도 됨.
    const ECC = 0.7;
    const ryMax = DESIGN.h * 0.56; // 가장 바깥 궤도의 세로 반경 ≈ 화면 절반 이상 → 상하 꽉 참
    const frac = [0.2, 0.31, 0.43, 0.55, 0.68, 0.8, 0.9, 1.0];
    const radii = frac.map((f) => (ryMax * f) / ECC);
    // 실제 태양계 거리 순(안쪽→바깥): 수성(=moon,1)·금성(3)·지구(4)·화성(2)·목성(8)·토성(7)·천왕성(6)·해왕성(5)
    const order = [1, 3, 4, 2, 8, 7, 6, 5];

    const rings = new Graphics();
    rings.lineStyle(1, 0x8aa0df, 0.12);
    for (const rx of radii) rings.drawEllipse(cx, cy, rx, rx * ECC);
    rings.zIndex = -1000; // 궤도선은 항상 맨 뒤
    this.orbitLayer.addChild(rings);

    // 태양(9단계) — 중앙. 행성과 같은 y-깊이 트랙(zIndex = y)에 두어 앞/뒤 가림이 적용된다.
    this.sun = makePlanetSprite(9);
    this.sun.x = cx;
    this.sun.y = cy;
    this.sun.scale.set(1.2); // 확대
    this.sun.zIndex = cy;
    this.orbitLayer.addChild(this.sun);

    // 행성 8종을 태양계 거리 순으로 공전 — 안쪽이 더 빠르고 방향이 교차한다.
    for (let i = 0; i < 8; i++) {
      const rx = radii[i];
      const sprite = makePlanetSprite(order[i]);
      sprite.scale.set(0.9); // 확대
      this.orbitLayer.addChild(sprite);
      this.orbits.push({
        sprite,
        rx,
        ry: rx * ECC,
        speed: (0.00044 / (1 + i * 0.3)) * (i % 2 === 0 ? 1 : -1),
        phase: i * 0.8,
        spin: (0.0005 + (i % 3) * 0.00025) * (i % 2 === 0 ? 1 : -1), // 행성마다 다른 자전 속도·방향
      });
    }
  }

  private buildUi() {
    const cx = DESIGN.w / 2;
    this.moneyPill(18, 18);
    this.iconButton(DESIGN.w - 54, 18, 'gear', () => {});

    // 중앙 컬럼(docs/50-art-ux/title-screen §2-2): 👑최고점수(Play 위)·Play·🪐현재점수(Play 아래)
    this.centerPanel(cx); // 최고 점수+게임 시작을 감싸는 검은 반투명 박스
    this.bestRow(cx, 352);
    this.playButton(cx, 426);
    this.currentRow(cx, 512);

    // 좌·우 아이콘 카드 버튼(§2-3)
    this.sideButton(58, 374, '📋', '일일 미션');
    this.sideButton(58, 480, '🛒', '상점');
    this.sideButton(DESIGN.w - 58, 374, '📅', '출석 체크');
    this.sideButton(DESIGN.w - 58, 480, '🎡', '행운의 돌림판');

    this.themeToggle(cx, 632);
  }

  // 최고 점수 + 게임 시작 버튼을 감싸는 검은 반투명 사각 박스 (docs §2-2)
  private centerPanel(cx: number) {
    const g = new Graphics();
    g.beginFill(0x000000, 0.4);
    g.drawRoundedRect(cx - 126, 326, 252, 162, 20);
    g.endFill();
    this.uiLayer.addChild(g);
  }

  // 👑 + 최고 점수 — Play 위, 중앙 정렬
  private bestRow(cx: number, y: number) {
    const crown = Sprite.from(ASSETS.ui.crown);
    crown.anchor.set(0.5);
    crown.scale.set(30 / ASSET_SIZES.uiIcon.w);
    const best = makeText('0', 26, 0xf2d071, '800');
    best.anchor.set(0, 0.5);
    const gap = 8;
    const total = 30 + gap + best.width;
    crown.x = cx - total / 2 + 15;
    crown.y = y;
    best.x = cx - total / 2 + 30 + gap;
    best.y = y;
    this.uiLayer.addChild(crown, best);
  }

  // 🪐 + 현재(이어하기) 점수 — Play 아래, 중앙 정렬. 아이콘 = 현재 세션 **최대 머지 행성**(docs §2-2).
  private currentRow(cx: number, y: number) {
    this.currentRowCx = cx;
    this.currentRowY = y;
    this.currentScore = makeText('0', 24, 0xdde7ff, '800');
    this.currentScore.anchor.set(0, 0.5);
    this.uiLayer.addChild(this.currentScore);
    this.refresh();
  }

  // 현재 세션 최대 머지 행성 아이콘 — 등급 무관 ~32px로 정규화(넵튠 고정 아님).
  private makeMaxTierIcon(): Container {
    const tier = Math.max(1, this.getProgress().maxTier);
    const icon = makePlanetSprite(tier);
    icon.scale.set(32 / (tierData(tier).radius * 2));
    return icon;
  }

  // Title 진입(부팅·Pool→Title 복귀) 시 GameScene이 호출 — 현재 점수 + 최대 머지 아이콘 갱신.
  refresh() {
    this.currentScore.text = this.getProgress().current.toLocaleString();
    if (this.currentIcon) {
      this.uiLayer.removeChild(this.currentIcon);
      this.currentIcon.destroy({ children: true });
    }
    this.currentIcon = this.makeMaxTierIcon();
    this.uiLayer.addChild(this.currentIcon);
    const gap = 10;
    const total = 32 + gap + this.currentScore.width;
    this.currentIcon.x = this.currentRowCx - total / 2 + 16;
    this.currentIcon.y = this.currentRowY;
    this.currentScore.x = this.currentRowCx - total / 2 + 32 + gap;
    this.currentScore.y = this.currentRowY;
  }

  private buttonContainer(cx: number, cy: number, w: number, h: number, onPress: () => void) {
    const c = new Container();
    c.x = cx;
    c.y = cy;
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    c.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      c.scale.set(JUICE.buttonPress.downScale);
    });
    c.on('pointerup', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      c.scale.set(1);
      onPress();
    });
    c.on('pointerupoutside', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      c.scale.set(1);
    });
    return c;
  }

  private playButton(cx: number, cy: number) {
    const w = 224;
    const h = 100;
    const c = this.buttonContainer(cx, cy, w, h, this.onPlay);
    const bg = new Graphics();
    bg.beginFill(0x2f86cf);
    bg.drawRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.endFill();
    bg.beginFill(0x57b2ec); // 상단 광택
    bg.drawRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h * 0.42, 14);
    bg.endFill();
    c.addChild(bg);
    const tri = new Graphics();
    tri.beginFill(0xffffff);
    tri.moveTo(-13, -17);
    tri.lineTo(17, 0);
    tri.lineTo(-13, 17);
    tri.closePath();
    tri.endFill();
    tri.y = -14;
    c.addChild(tri);
    const play = makeText('게임 시작', 22, 0xffffff, '800');
    play.anchor.set(0.5);
    play.y = 28;
    c.addChild(play);
    this.uiLayer.addChild(c);
  }

  // 아이콘 타일 + 라벨 카드(레퍼런스 이미지) — docs/50-art-ux/title-screen §2-3
  private sideButton(cx: number, cy: number, icon: string, label: string) {
    const c = this.buttonContainer(cx, cy, 84, 100, () => {});
    const tile = new Graphics();
    tile.beginFill(0x24407e);
    tile.drawRoundedRect(-34, -44, 68, 68, 16);
    tile.endFill();
    tile.lineStyle(2, 0x8aa0df, 0.5);
    tile.drawRoundedRect(-34, -44, 68, 68, 16);
    c.addChild(tile);
    const ic = makeText(icon, 32);
    ic.anchor.set(0.5);
    ic.y = -10;
    c.addChild(ic);
    const lbl = new Text(label, {
      fill: 0xe7edff,
      fontSize: 12,
      fontWeight: '800',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 84,
      lineHeight: 14,
    });
    lbl.anchor.set(0.5);
    lbl.y = 40;
    c.addChild(lbl);
    this.uiLayer.addChild(c);
  }

  private iconButton(x: number, y: number, kind: 'gear', onPress: () => void) {
    const c = this.buttonContainer(x + 18, y + 18, 36, 36, onPress);
    const bg = new Graphics();
    bg.beginFill(COLORS.btnBlue);
    bg.drawRoundedRect(-18, -18, 36, 36, 9);
    bg.endFill();
    bg.lineStyle(3, 0xffffff, 0.95);
    bg.drawCircle(0, 0, kind === 'gear' ? 8 : 7);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      bg.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
      bg.lineTo(Math.cos(a) * 15, Math.sin(a) * 15);
    }
    c.addChild(bg);
    this.uiLayer.addChild(c);
  }

  private moneyPill(x: number, y: number) {
    const g = new Graphics();
    g.beginFill(COLORS.pillBlue);
    g.drawRoundedRect(x, y, 98, 32, 16);
    g.endFill();
    this.uiLayer.addChild(g);
    const coin = Sprite.from(ASSETS.ui.gold);
    coin.anchor.set(0.5);
    coin.x = x + 17;
    coin.y = y + 16;
    coin.scale.set(24 / ASSET_SIZES.uiIcon.w);
    this.uiLayer.addChild(coin);
    const t = makeText('50', 16, 0xffffff, '800');
    t.anchor.set(0.5);
    t.x = x + 57;
    t.y = y + 16;
    this.uiLayer.addChild(t);
  }

  private themeToggle(cx: number, cy: number) {
    const c = this.buttonContainer(cx, cy, 204, 42, () => {
      this.toggleGalaxy = !this.toggleGalaxy;
      this.knobTargetX = this.toggleGalaxy ? -48 : 48; // 슬라이드 목표 (기능 없음, 시각 전환만)
    });
    const bg = new Graphics();
    bg.beginFill(0x10182e, 0.92);
    bg.drawRoundedRect(-102, -21, 204, 42, 21);
    bg.endFill();
    bg.lineStyle(2, 0x8aa0df, 0.45);
    bg.drawRoundedRect(-102, -21, 204, 42, 21);
    // 하이라이트 노브: 한 번만 그리고 x만 애니메이션(update에서 슬라이드)
    this.toggleKnob.beginFill(0x49a8e6, 0.92);
    this.toggleKnob.drawRoundedRect(-48, -17, 96, 34, 17);
    this.toggleKnob.endFill();
    this.toggleKnob.x = -48;
    c.addChild(bg, this.toggleKnob);
    for (const [label, x] of [['Galaxy', -51], ['Fantasy', 51]] as const) {
      const t = makeText(label, 15, 0xffffff, '800');
      t.anchor.set(0.5);
      t.x = x;
      c.addChild(t);
    }
    this.uiLayer.addChild(c);
  }

  update(nowMs: number) {
    this.galaxy.update(nowMs);
    const cx = DESIGN.w / 2;
    const cy = ORBIT_CY;
    for (const o of this.orbits) {
      const a = nowMs * o.speed + o.phase;
      o.sprite.x = cx + Math.cos(a) * o.rx;
      o.sprite.y = cy + Math.sin(a) * o.ry;
      o.sprite.zIndex = o.sprite.y; // 깊이 = y (태양 zIndex=cy와 같은 트랙 → 앞/뒤 가림)
      o.sprite.rotation = nowMs * o.spin; // 자전(자체 축 회전)
    }
    this.sun.rotation = nowMs * 0.00025; // 태양도 제자리에서 느리게 자전
    this.toggleKnob.x += (this.knobTargetX - this.toggleKnob.x) * 0.25; // 토글 노브 슬라이드 애니메이션
  }
}
