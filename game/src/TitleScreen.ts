import { Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import { ASSETS, ASSET_SIZES } from './assets';
import { GalaxyBackground } from './GalaxyBackground';
import { makePlanetSprite } from './PlanetFactory';
import { tierData } from './data/planets';
import { DESIGN, COLORS, FONT, TYPE } from './data/config';
import { attachButtonFeedback, redDot } from './ui/button';
import { sound } from './SoundManager';
import type { PopupKind } from './MetaUI';
import type { GameMode } from './modes/ModeController';

// Title이 GameScene으로부터 받는 진행 상태(현재/최고 점수 + 최대 머지 등급). 점수는 영속 레코드(docs/30-systems/meta-economy).
export interface TitleProgress {
  current: number; // 현재(이어하기) 점수 — 영속
  best: number; // 역대 최고 점수 — 영속
  maxTier: number; // 현재 세션 최대 머지 행성 등급
}

// 메타 레이어 훅(코인 지갑 + 팝업 열기) — GameScene이 MetaStore/MetaUI를 주입한다 (docs/30-systems/meta-economy).
export interface TitleMeta {
  coins: () => number;
  subscribe: (fn: () => void) => () => void;
  open: (kind: PopupKind) => void;
  badge: (kind: PopupKind) => boolean; // 받을 보상 있으면 레드닷(일일미션·출석, docs/50-art-ux/title-screen §2-3)
}

interface Orbit {
  sprite: Container;
  rx: number;
  ry: number;
  speed: number; // 공전 각속도 (rad/ms)
  phase: number;
  spin: number; // 자전 각속도 (rad/ms)
}

function makeText(value: string, size: number, color = COLORS.white, weight: '400' | '700' | '800' = '700') {
  return new Text(value, {
    fill: color,
    fontSize: size,
    fontFamily: FONT,
    fontWeight: weight,
  });
}

const ORBIT_CY = DESIGN.h * 0.3; // 태양계 중점 y — 태양이 게임 시작 버튼보다 위에 보이도록 상단 배치
// 하이라이트 캡슐 색 — Stage=파랑(기본·좌측), Infinite=보라(우측) (docs/50-art-ux/title-screen §2-4)
const TOGGLE_ACTIVE_COLOR: Record<GameMode, number> = {
  Stage: COLORS.stageAccent,
  Infinite: COLORS.infiniteAccent,
};

export class TitleScreen {
  readonly container = new Container(); // 태양계 공전 + 로비 UI (contain 9:16)
  readonly galaxy = new GalaxyBackground({ x: 0, y: 0, width: DESIGN.w, height: DESIGN.h, seed: 4242, count: 76 }); // 은하수 배경 (cover, GameScene이 배경 레이어로 둠)
  private orbitLayer = new Container();
  private uiLayer = new Container();
  private orbits: Orbit[] = [];
  private sun!: Container;
  private playButtonBody?: Container;
  private playButtonBodyAsset = '';
  private toggleKnob = new Graphics();
  private gameMode: GameMode = 'Stage'; // 하단 토글이 고르는 진입 모드, 기본 Stage (docs/20-core-loop/game-modes)
  private playLabel!: Text; // Play 버튼 라벨(두 모드 공통 'Game Start')
  private knobTargetX = -48; // 기본 Stage = 좌측(-48); Infinite = 우측(+48)
  private currentIcon?: Container; // 현재 점수 옆 최대 머지 행성 아이콘
  private currentScore!: Text;
  private currentRowCx = 0;
  private currentRowY = 0;
  private bestText!: Text; // 👑 최고 점수(영속) — refresh마다 갱신
  private bestCrown!: Sprite;
  private bestRowCx = 0;
  private bestRowY = 0;
  private stageInfo!: Text; // Stage 모드 시 최고 점수 영역에 표시되는 'Stage N'

  constructor(
    private onPlay: (mode: GameMode) => void,
    private getProgress: () => TitleProgress = () => ({ current: 0, best: 0, maxTier: 1 }),
    private meta?: TitleMeta,
    private getStageNo: () => number = () => 1
  ) {
    this.container.eventMode = 'static';
    this.container.addChild(this.orbitLayer, this.uiLayer); // galaxy는 GameScene이 cover 배경 레이어에 둔다
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
    const solarOrbitTiers = [2, 4, 5, 3, 9, 8, 7, 6];

    const rings = new Graphics();
    rings.lineStyle(1, COLORS.panelBorder, 0.12);
    for (const rx of radii) rings.drawEllipse(cx, cy, rx, rx * ECC);
    rings.zIndex = -1000; // 궤도선은 항상 맨 뒤
    this.orbitLayer.addChild(rings);

    const sunTier = 10;
    this.sun = makePlanetSprite(sunTier);
    this.sun.x = cx;
    this.sun.y = cy;
    this.sun.scale.set(1.2); // 확대
    this.sun.zIndex = cy;
    this.orbitLayer.addChild(this.sun);

    // 행성 8종을 태양계 거리 순으로 공전 — 안쪽이 더 빠르고 방향이 교차한다.
    for (let i = 0; i < 8; i++) {
      const rx = radii[i];
      const sprite = makePlanetSprite(solarOrbitTiers[i]);
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
    // 코인 잔액 표시는 GameScene 소유 공통 CoinPill(왼쪽 상단 18,18) — Title·인게임 동일 (docs/50-art-ux/layout)
    this.iconButton(DESIGN.w - 54, 18, ASSETS.ui.settings, () => this.meta?.open('settings'));

    // 중앙 컬럼(docs/50-art-ux/title-screen §2-2): 👑최고점수(Play 위)·Play·🪐현재점수(Play 아래)
    this.centerPanel(cx); // 최고 점수+게임 시작을 감싸는 검은 반투명 박스
    this.bestRow(cx, 352);
    this.playButton(cx, 426);
    this.currentRow(cx, 512);

    // 좌·우 아이콘 카드 버튼(§2-3) — 각 팝업을 연다 (docs/30-systems/*, MetaUI)
    this.sideButton(58, 374, ASSETS.ui.dailyMission, '일일 미션', () => this.meta?.open('dailyMission'), 'dailyMission');
    this.sideButton(58, 480, ASSETS.ui.shop, '상점', () => this.meta?.open('shop'));
    this.sideButton(DESIGN.w - 58, 374, ASSETS.ui.checkIn, '출석 체크', () => this.meta?.open('attendance'), 'attendance');
    this.sideButton(DESIGN.w - 58, 480, ASSETS.ui.luckyWheel, '행운의 돌림판', () => this.meta?.open('wheel'));

    this.modeToggle(cx, 632);
    this.applyModeUi();
  }

  // 최고 점수 + 게임 시작 버튼을 감싸는 검은 반투명 사각 박스 (docs §2-2)
  private centerPanel(cx: number) {
    const g = new Graphics();
    g.beginFill(COLORS.black, 0.4);
    g.drawRoundedRect(cx - 126, 326, 252, 162, 20);
    g.endFill();
    this.uiLayer.addChild(g);
  }

  // 👑 + 최고 점수(영속) — Play 위, 중앙 정렬. 값은 refresh()마다 layoutBestRow로 갱신.
  private bestRow(cx: number, y: number) {
    this.bestRowCx = cx;
    this.bestRowY = y;
    this.bestCrown = Sprite.from(ASSETS.ui.crown);
    this.bestCrown.anchor.set(0.5);
    this.bestCrown.scale.set(30 / ASSET_SIZES.uiIcon.w);
    this.bestText = makeText('0', 26, COLORS.bestGold, '800');
    this.bestText.anchor.set(0, 0.5);
    this.uiLayer.addChild(this.bestCrown, this.bestText);
    // Stage 모드 전용: 최고 점수 영역에 'Stage N'을 대신 표시(평소 숨김, applyModeUi가 토글)
    this.stageInfo = makeText('Stage 1', 28, COLORS.goldText, '800');
    this.stageInfo.anchor.set(0.5);
    this.stageInfo.x = cx;
    this.stageInfo.y = y;
    this.stageInfo.visible = false;
    this.uiLayer.addChild(this.stageInfo);
    this.layoutBestRow();
  }

  // 최고 점수 텍스트 갱신 + 왕관/숫자 중앙 정렬(텍스트 폭이 바뀌므로 재정렬).
  private layoutBestRow() {
    this.bestText.text = this.getProgress().best.toLocaleString();
    const gap = 8;
    const total = 30 + gap + this.bestText.width;
    this.bestCrown.x = this.bestRowCx - total / 2 + 15;
    this.bestCrown.y = this.bestRowY;
    this.bestText.x = this.bestRowCx - total / 2 + 30 + gap;
    this.bestText.y = this.bestRowY;
  }

  // 🪐 + 현재(이어하기) 점수 — Play 아래, 중앙 정렬. 아이콘 = 현재 세션 **최대 머지 행성**(docs §2-2).
  private currentRow(cx: number, y: number) {
    this.currentRowCx = cx;
    this.currentRowY = y;
    this.currentScore = makeText('0', 24, COLORS.textBlue, '800');
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
    this.layoutBestRow(); // 👑 최고 점수(영속) 갱신
    for (const u of this.badgeUpdaters) u(); // 일일미션·출석 레드닷 재평가(Title 진입 시)
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
    this.applyModeUi(); // 모드별 점수 UI/Stage 정보 표시 재적용(currentIcon 재생성 후)
  }

  // Centred button shell; press feedback comes from the shared module (docs/50-art-ux/feedback-effects §5).
  private buttonContainer(cx: number, cy: number, w: number, h: number, onPress: () => void) {
    const c = new Container();
    c.x = cx;
    c.y = cy;
    c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    return attachButtonFeedback(c, onPress);
  }

  private playButton(cx: number, cy: number) {
    const { w, h } = ASSET_SIZES.playButton;
    const c = this.buttonContainer(cx, cy, w, h, () => this.onPlay(this.gameMode));
    this.playButtonBody = new Container();
    c.addChild(this.playButtonBody);
    this.renderPlayButtonBody();
    const tri = new Graphics();
    tri.beginFill(COLORS.white);
    tri.moveTo(-13, -16);
    tri.lineTo(17, 0);
    tri.lineTo(-13, 16);
    tri.closePath();
    tri.endFill();
    tri.y = -18;
    c.addChild(tri);
    this.playLabel = makeText('Game Start', 22, COLORS.white, '800');
    this.playLabel.anchor.set(0.5);
    this.playLabel.y = 14;
    c.addChild(this.playLabel);
    this.uiLayer.addChild(c);
  }

  // 모드별 Title UI (docs/50-art-ux/title-screen §2-2·§2-4): Play 라벨은 두 모드 공통 'Game Start'.
  // Stage 모드에서는 최고·현재 점수 UI를 숨기고 최고 점수 영역에 'Stage N'을 표시한다.
  private applyModeUi() {
    const stage = this.gameMode === 'Stage';
    this.bestCrown.visible = !stage;
    this.bestText.visible = !stage;
    this.currentScore.visible = !stage;
    if (this.currentIcon) this.currentIcon.visible = !stage;
    this.stageInfo.visible = stage;
    if (stage) this.stageInfo.text = `Stage ${this.getStageNo()}`;
    this.renderPlayButtonBody();
    this.renderToggleKnob();
  }

  private renderPlayButtonBody() {
    if (!this.playButtonBody) return;
    // Play 버튼 색도 모드별로 swap — Stage=파랑 playButton, Infinite=보라 playButtonStage (docs/50-art-ux/title-screen §2-2)
    const asset = this.gameMode === 'Stage' ? ASSETS.ui.playButton : ASSETS.ui.playButtonStage;
    if (this.playButtonBodyAsset === asset) return;
    for (const child of this.playButtonBody.removeChildren()) child.destroy();
    const { w, h } = ASSET_SIZES.playButton;
    this.addNineSliceBody(this.playButtonBody, asset, w, h);
    this.playButtonBodyAsset = asset;
  }

  private addNineSliceBody(c: Container, asset: string, w: number, h: number) {
    const texture = Texture.from(asset);
    const sourceW = ASSET_SIZES.playButtonSource.w;
    const sourceH = ASSET_SIZES.playButtonSource.h;
    const left = 42;
    const right = 42;
    const top = 34;
    const bottom = 34;
    const srcX = [0, left, sourceW - right];
    const srcY = [0, top, sourceH - bottom];
    const srcW = [left, sourceW - left - right, right];
    const srcH = [top, sourceH - top - bottom, bottom];
    const dstX = [-w / 2, -w / 2 + left, w / 2 - right];
    const dstY = [-h / 2, -h / 2 + top, h / 2 - bottom];
    const dstW = [left, w - left - right, right];
    const dstH = [top, h - top - bottom, bottom];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const frame = new Rectangle(srcX[col], srcY[row], srcW[col], srcH[row]);
        const sprite = new Sprite(new Texture(texture.baseTexture, frame));
        sprite.x = dstX[col];
        sprite.y = dstY[row];
        sprite.width = dstW[col];
        sprite.height = dstH[row];
        c.addChild(sprite);
      }
    }
  }

  // 아이콘 타일 + 라벨 카드(레퍼런스 이미지) — docs/50-art-ux/title-screen §2-3
  private badgeUpdaters: (() => void)[] = []; // 레드닷 갱신 클로저(meta 구독 + Title 진입 refresh)

  private sideButton(cx: number, cy: number, iconAsset: string, label: string, onPress: () => void = () => {}, badgeKind?: PopupKind) {
    const c = this.buttonContainer(cx, cy, 84, 100, onPress);
    const tile = new Graphics();
    tile.beginFill(COLORS.black, 0.46);
    tile.drawRoundedRect(-34, -44, 68, 68, 16);
    tile.endFill();
    tile.lineStyle(2, COLORS.white, 0.18);
    tile.drawRoundedRect(-34, -44, 68, 68, 16);
    c.addChild(tile);
    const ic = Sprite.from(iconAsset);
    ic.anchor.set(0.5);
    ic.scale.set(52 / ASSET_SIZES.uiIcon.w);
    ic.y = -10;
    c.addChild(ic);
    const lbl = new Text(label, {
      fill: COLORS.textBright,
      fontSize: TYPE.s12,
      fontWeight: '800',
      fontFamily: FONT,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 84,
      lineHeight: 14,
    });
    lbl.anchor.set(0.5);
    lbl.y = 40;
    c.addChild(lbl);
    // 받을 보상 레드닷(일일 미션·출석, docs/50-art-ux/title-screen §2-3) — 타일 우상단
    if (badgeKind) {
      const dot = redDot();
      dot.x = 28;
      dot.y = -38;
      c.addChild(dot);
      const update = () => { dot.visible = !!this.meta?.badge(badgeKind); };
      update();
      this.meta?.subscribe(update); // 보상 수령·KST 리셋 시 실시간 갱신
      this.badgeUpdaters.push(update);
    }
    this.uiLayer.addChild(c);
  }

  private iconButton(x: number, y: number, iconAsset: string, onPress: () => void) {
    const c = this.buttonContainer(x + 18, y + 18, 36, 36, onPress);
    const bg = new Graphics();
    bg.beginFill(COLORS.black, 0.46);
    bg.drawRoundedRect(-18, -18, 36, 36, 9);
    bg.endFill();
    bg.lineStyle(2, COLORS.white, 0.18);
    bg.drawRoundedRect(-18, -18, 36, 36, 9);
    c.addChild(bg);
    const icon = Sprite.from(iconAsset);
    icon.anchor.set(0.5);
    icon.scale.set(34 / ASSET_SIZES.uiIcon.w);
    c.addChild(icon);
    this.uiLayer.addChild(c);
  }

  // 하단 모드 토글 — Infinite | Stage (docs/50-art-ux/title-screen §2-4). 선택 모드는 Play로 진입.
  private modeToggle(cx: number, cy: number) {
    const c = this.buttonContainer(cx, cy, 204, 42, () => {
      this.gameMode = this.gameMode === 'Infinite' ? 'Stage' : 'Infinite';
      this.knobTargetX = this.gameMode === 'Stage' ? -48 : 48; // Stage=좌, Infinite=우
      this.applyModeUi();
      sound.play('toggle'); // 모드 전환 효과음 (docs/50-art-ux/sound-design)
    });
    const bg = new Graphics();
    bg.beginFill(COLORS.gaugeTrack, 0.92);
    bg.drawRoundedRect(-102, -21, 204, 42, 21);
    bg.endFill();
    bg.lineStyle(2, COLORS.panelBorder, 0.45);
    bg.drawRoundedRect(-102, -21, 204, 42, 21);
    this.renderToggleKnob();
    this.toggleKnob.x = -48;
    c.addChild(bg, this.toggleKnob);
    for (const [label, x] of [['Stage', -51], ['Infinite', 51]] as const) {
      const t = makeText(label, 15, COLORS.white, '800');
      t.anchor.set(0.5);
      t.x = x;
      c.addChild(t);
    }
    const modeLabel = makeText('Mode', 13, COLORS.textBlue, '800');
    modeLabel.anchor.set(0.5);
    modeLabel.y = -35;
    c.addChild(modeLabel);
    this.uiLayer.addChild(c);
  }

  private renderToggleKnob() {
    this.toggleKnob.clear();
    this.toggleKnob.beginFill(TOGGLE_ACTIVE_COLOR[this.gameMode], 0.92);
    this.toggleKnob.drawRoundedRect(-48, -17, 96, 34, 17);
    this.toggleKnob.endFill();
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
    this.toggleKnob.x += (this.knobTargetX - this.toggleKnob.x) * 0.25;
  }
}
