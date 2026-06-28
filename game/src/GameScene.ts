import { Application, Container, Graphics, Rectangle } from 'pixi.js';
import { Body } from 'matter-js';
import { DESIGN, PLAY, LAUNCHER, LAUNCH, COLORS, STEP_MS, JUICE, SCORING, PROGRESSION, MODES, RESULT } from './data/config';
import { tierData, MAX_TIER, INITIAL_RACK, SUN_TIER } from './data/planets';
import { ModeController } from './modes/ModeController';
import { GameInfoPanel } from './GameInfoPanel';
import { FirstGestureHint } from './FirstGestureHint';
import { ChargePopup } from './popups/ChargePopup';
import { ResultPopup } from './popups/ResultPopup';
import { StageClearPopup, StageFailPopup } from './popups/StageEndPopup';
import { MetaStore } from './MetaStore';
import { MetaUI } from './MetaUI';
import { PhysicsWorld } from './PhysicsWorld';
import { BoardRenderer } from './BoardRenderer';
import { TitleScreen } from './TitleScreen';
import { Hud } from './Hud';
import { Launcher } from './Launcher';
import { QueueSystem } from './QueueSystem';
import { ScoreSystem } from './ScoreSystem';
import { MergeSystem } from './MergeSystem';
import { Effects } from './Effects';
import { UnlockModal } from './UnlockModal';
import { Combo } from './Combo';
import { sound } from './SoundManager';
import { makePlanetSprite } from './PlanetFactory';
import { LoadingScreen } from './LoadingScreen';
import { CoinPill } from './ui/CoinPill';
import { ASSETS } from './assets';
import { exposeDebug } from './debug';
import { containPlanets } from './Containment';
import type { Planet } from './Planet';

type SceneState = 'Loading' | 'Title' | 'PoolInGame';

const LOAD_MIN_MS = 2000; // 최소 로딩 시간 floor (docs/20-core-loop/screen-flow §Loading)

// merge spawn pop curve: startScale → peakScale (0–40%) → settle to 1.0 (40–100%).
function popScale(k: number): number {
  const { startScale, peakScale } = JUICE.mergePop;
  return k < 0.4
    ? startScale + (peakScale - startScale) * (k / 0.4)
    : peakScale + (1 - peakScale) * ((k - 0.4) / 0.6);
}

export class GameScene {
  readonly app: Application;
  private gameLayer = new Container();
  private boardLayer = new Container();
  private comboLayer = new Container(); // combo watermark — behind the planets
  private planetLayer = new Container();
  private effectLayer = new Container();
  private aimLayer = new Container();
  private uiLayer = new Container();

  private planets: Planet[] = [];
  private byBody = new Map<Body, Planet>();
  private nextId = 1;
  private cooldownUntil = 0;
  private acc = 0;

  private physics: PhysicsWorld;
  private hud: Hud;
  private score: ScoreSystem;
  private queue: QueueSystem;
  private merge: MergeSystem;
  private launcher: Launcher;
  private effects: Effects;
  private combo: Combo;
  private board: BoardRenderer;
  private title: TitleScreen;
  private meta: MetaStore; // coin wallet + daily mission/attendance state (docs/30-systems/meta-economy)
  private metaUI: MetaUI; // Title-lobby popups (missions/attendance/wheel/shop)
  private coinPill!: CoinPill; // 코인 잔액 표시(공통) — Title·인게임 동일 위치, 돌림판이 딤 위로 올림
  private coinHomeIndex = 0; // fgRoot에서의 평상시 z(돌림판 닫힐 때 복귀)
  private scene: SceneState = 'Loading';
  private loadingScreen = new LoadingScreen(LOAD_MIN_MS); // 부팅 스플래시(GALAXY PINBALL 스트림)
  private loadT0 = 0; // 부팅 시각 — 최소 로딩 floor 계산용
  private unlockModal!: UnlockModal;
  private unlockedTier = PROGRESSION.unlockStart; // highest tier merges may create (docs/30-systems/tier-unlock)
  private pendingUnlockTier = 0;
  private paused = false; // true while the unlock modal is up (game frozen)
  lastComboBonus = 0; // most recent awarded combo milestone bonus (verification hook; read via window.__game)
  private fade = new Graphics(); // 씬 전이 페이드 오버레이(최상위, 뷰포트 전체)
  private endSkip = new Graphics(); // Stage 종료 지연 중 화면 탭 → 지연 스킵(평소 비활성)
  private trans: { to: SceneState; t0: number; phase: 'out' | 'in' } | null = null;
  private bgRoot = new Container(); // 은하수 배경 — cover로 뷰포트 가득(Title 한정)
  private fgRoot = new Container(); // 태양계·로비 UI·보드·HUD·모든 팝업 — contain(9:16, 잘림 없음)
  private modeC = new ModeController(); // 게임 모드 + 남은 카운트 (docs/20-core-loop/game-modes)
  private info!: GameInfoPanel; // 좌하단 Count/Next + 모드별 위젯
  private gestureHint!: FirstGestureHint; // 첫 발사 전 손가락 코치
  private gestureDone = false; // 이번 세션에서 첫 발사를 했는가(코치 종료 조건)
  private charge!: ChargePopup; // Infinite 충전 팝업
  private result!: ResultPopup; // Infinite 결과창
  private stageClear!: StageClearPopup;
  private stageFail!: StageFailPopup;
  private ended = false; // 세션 종료(결과/클리어/실패 창이 떠 있음)
  private endKind: 'result' | 'clear' | 'fail' | null = null; // 종료 예약(2초 지연 후 창 표시)
  private endAt = 0; // 종료창 등장 예정 시각(performance.now 기준)
  // Stage 클리어 연출 상태(docs/30-systems/stage-mode §클리어): 목표 행성이 우하단 목표 UI로 포물선
  // 비행 → 도달 시 머지 버스트(burst) 잠깐 hold → 클리어창. 연출 중엔 물리·발사 정지.
  private clearFly: { sprite: Container | null; phase: 'fly' | 'burst'; t0: number; from: { x: number; y: number }; to: { x: number; y: number }; r0: number; tier: number } | null = null;
  private maxCombo = 0; // 세션 최대 콤보(Infinite 결과창)
  private sessionPrevBest = 0; // 세션 시작 시점의 최고 점수(NEW RECORD 판정용)

  stats = { shots: 0, merges: 0, maxTier: 1, sunReached: false };

  constructor(mount: HTMLElement) {
    this.app = new Application({
      resizeTo: window, // 캔버스를 뷰포트 크기로 — 배경(cover)은 가득, 전경(contain)은 9:16 중앙
      backgroundColor: COLORS.outerBg,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    mount.appendChild(this.app.view as unknown as HTMLCanvasElement);
    this.gameLayer.addChild(this.boardLayer, this.comboLayer, this.planetLayer, this.effectLayer, this.aimLayer, this.uiLayer);
    this.app.stage.addChild(this.bgRoot, this.fgRoot); // 배경(cover)·전경+팝업(contain)
    this.fgRoot.addChild(this.gameLayer);
    // Stage 종료 지연(클리어/실패 2초) 중 화면을 탭하면 지연을 건너뛴다(평소 비활성, 보드 입력 통과).
    this.endSkip.beginFill(0x000000, 0.001);
    this.endSkip.drawRect(0, 0, DESIGN.w, DESIGN.h);
    this.endSkip.endFill();
    this.endSkip.eventMode = 'none';
    this.endSkip.on('pointerdown', (e) => { e.stopPropagation(); if (this.endKind) this.showEnd(this.endKind); });
    this.fgRoot.addChild(this.endSkip);
    this.app.stage.eventMode = 'static';

    this.physics = new PhysicsWorld();
    this.board = new BoardRenderer(this.boardLayer);
    this.hud = new Hud(this.uiLayer, () => this.setScene('Title'), [
      // ≡ dropdown shortcuts — same actions as the Title-lobby buttons (docs/50-art-ux/layout §2-c)
      { icon: ASSETS.ui.dailyMission, onTap: () => this.metaUI.open('dailyMission'), badge: () => !!this.meta?.hasClaimableMission() },
      { icon: ASSETS.ui.checkIn, onTap: () => this.metaUI.open('attendance'), badge: () => !!this.meta?.attendanceCanClaim() },
      { icon: ASSETS.ui.luckyWheel, onTap: () => this.metaUI.open('wheel') },
      { icon: ASSETS.ui.settings, onTap: () => this.metaUI.open('settings') }, // 설정: Title 설정 기어와 동일한 설정 팝업
    ]); // back button → Title
    this.effects = new Effects(this.effectLayer);
    this.combo = new Combo(this.comboLayer);
    this.info = new GameInfoPanel(this.uiLayer, () => this.openCharge()); // 좌하단 Count/Next + 모드별 위젯
    this.gestureHint = new FirstGestureHint(this.uiLayer); // 첫 발사 전 손가락 코치(발사대 위)
    this.uiLayer.setChildIndex(this.gestureHint.container, 0); // 코치 딤은 보드만 어둡게 — HUD/Count 수치는 그 위에 또렷이(docs/50-art-ux/input-ux)
    this.score = new ScoreSystem((s) => { this.hud.setScore(s); if (!this.modeC.isStage) this.meta.setScore(s); }); // 점수 → HUD + 영속 레코드(Stage는 집계 안 함)
    this.queue = new QueueSystem(
      (slots) => this.info.setNext(slots[1] ?? slots[0]), // Next 미리보기 갱신(좌하단 HUD)
      () => Math.max(1, Math.min(this.unlockedTier - PROGRESSION.queueBelow, PROGRESSION.queueCap))
    );
    this.merge = new MergeSystem(
      {
        planetByBody: (b) => this.byBody.get(b),
        removePlanet: (p) => this.removePlanet(p),
        spawnPlanet: (tier, x, y, vx, vy, now) => this.spawnPlanet(tier, x, y, vx, vy, now, true, true),
        unlockedTier: () => this.unlockedTier,
        terminalMerge: (pa, pb) => this.onTerminalMerge(pa, pb), // 블랙홀끼리 합성 → Infinite 카운트 +20
      },
      (tier, x, y, planet) => {
        this.stats.merges++;
        this.stats.maxTier = Math.max(this.stats.maxTier, tier);
        if (tier >= MAX_TIER) this.stats.sunReached = true;
        const d = tierData(tier);
        this.effects.mergeBurst(x, y, d.colors[0], d.radius); // 발산 버스트(모드 공통 juice)
        sound.play('merge', { pitch: 1 + (tier - 1) * 0.05 }); // 생성 등급↑ → 피치↑ (docs/50-art-ux/sound-design)
        // Stage는 점수·콤보를 집계/표시하지 않는다 (docs/30-systems/stage-mode §인게임 상단 표시)
        if (!this.modeC.isStage) {
          const pts = this.score.onMerge(tier);
          this.effects.scorePopup(pts, x, y); // +N at the merge location
          const comboBonus = this.combo.onMerge(performance.now()); // chain counter; returns milestone bonus
          if (comboBonus > 0) {
            this.score.addBonus(comboBonus); // combo 5/10/15… milestone → large bonus score
            this.effects.comboBonus(comboBonus, this.combo.value); // "+N(combo M)" at screen centre
            this.lastComboBonus = comboBonus;
            sound.play('comboMilestone');
          }
        }
        this.meta.onMerge(this.combo.value, tier === SUN_TIER); // daily missions: merge count / combo peak / sun
        this.maxCombo = Math.max(this.maxCombo, this.combo.value); // session combo peak (Infinite result)
        // Stage clear: created the target tier (docs/30-systems/stage-mode) — launches the fly-to-target
        // animation (which then opens the clear window). Already-cleared stage: no reward → falls through.
        if (this.modeC.isStage && !this.ended && !this.clearFly && tier >= this.modeC.targetTier
            && !this.meta.isStageCleared(this.modeC.stageIndex)) {
          this.startClearFly(tier, x, y, planet);
          return;
        }
        // first time a NEW tier is created → unlock modal + pause (docs/30-systems/tier-unlock).
        // Infinite only — Stage starts fully unlocked and never shows the modal (docs/30-systems/stage-mode).
        if (!this.modeC.isStage && tier > this.unlockedTier && !this.paused) {
          this.pendingUnlockTier = tier;
          this.paused = true;
          const bonus = this.modeC.mode === 'Infinite' ? MODES.infinite.unlockBonusCount : 0;
          if (bonus > 0) {
            this.modeC.addCount(bonus);
            this.info.setCount(this.modeC.count);
          }
          this.unlockModal.show(tier, bonus);
          sound.play('unlock');
        }
      }
    );
    this.physics.onCollision((a, b, impact, cx, cy, bx, by) => {
      const aP = a.label === 'planet';
      const bP = b.label === 'planet';
      if (aP && bP) {
        this.merge.queuePair(a, b); // 머지 큐잉은 impact와 무관(동급 접촉 시)
        if (impact >= SCORING.minImpact) {
          if (!this.modeC.isStage) this.score.onBallHit(); // 행성–행성 충돌 +3 (Stage 미집계)
          this.effects.hitBurst(cx, cy, bx, by);
          sound.play('ballHit'); // 다발 충돌은 throttle로 솎임 (docs/50-art-ux/sound-design)
        }
      } else if (aP || bP) {
        if (impact >= SCORING.minImpact) {
          if (!this.modeC.isStage) this.score.onWallHit(); // 벽(inner line)·발사대 원 충돌 +1 (Stage 미집계)
          this.effects.hitBurst(cx, cy, bx, by);
          sound.play('wall');
        }
      }
    });
    this.launcher = new Launcher(this.app.stage, this.aimLayer, this.uiLayer, {
      currentTier: () => this.queue.current(),
      fire: (tier, vx, vy) => this.fire(tier, vx, vy),
      obstacles: () =>
        this.planets.map((p) => ({ x: p.body.position.x, y: p.body.position.y, r: tierData(p.tier).radius })),
      canAim: () => this.scene === 'PoolInGame' && !this.trans && !this.paused && !this.ended
        && !this.endKind && !this.clearFly && this.metaUI.openKind() === null && !this.charge.container.visible,
    }, this.fgRoot);

    this.meta = new MetaStore();
    this.meta.subscribe(() => this.hud.refreshMenuBadges()); // 보상 수령·KST 리셋 시 ≡ 집계 레드닷 갱신
    this.hud.refreshMenuBadges(); // 부팅 직후 초기 상태(출석 등 받을 보상)
    this.metaUI = new MetaUI(this.meta);
    this.coinPill = new CoinPill(this.meta); // 공통 코인 표시 (docs/30-systems/meta-economy · docs/50-art-ux/layout)
    this.metaUI.wheel.coinHooks = {
      raise: () => this.raiseCoin(),
      restore: () => this.restoreCoin(),
      pour: (count, fx, fy) => this.coinPill.pour(count, fx, fy),
    };
    this.charge = new ChargePopup(() => this.meta.coins, (n) => this.buyCharge(n)); // Infinite 충전 팝업
    this.result = new ResultPopup(() => this.setScene('Title')); // Infinite 결과창 → 탭 → Title
    this.stageClear = new StageClearPopup(
      () => this.setScene('PoolInGame'), // 다음 스테이지 — 전진은 클리어 시점에 이미 영속(startSession이 진행도 로드)
      () => this.setScene('Title') // 돌아가기 → Title
    );
    this.stageFail = new StageFailPopup(() => this.setScene('PoolInGame')); // 실패 → 같은 스테이지 재시작
    this.title = new TitleScreen(
      (mode) => { this.modeC.setMode(mode); sound.play('play'); this.setScene('PoolInGame'); },
      () => ({ current: this.meta.currentScore, best: this.meta.bestScore, maxTier: this.stats.maxTier }), // Title 현재/최고(영속) + 최대 머지 아이콘
      { coins: () => this.meta.coins, subscribe: (fn) => this.meta.subscribe(fn), open: (k) => this.metaUI.open(k),
        badge: (k) => k === 'dailyMission' ? this.meta.hasClaimableMission() : k === 'attendance' ? this.meta.attendanceCanClaim() : false }, // 코인·팝업·레드닷 훅
      () => this.meta.stageProgress + 1 // Play 라벨 "Stage N" — 영속 진행도 기준(클리어 시 전진)
    );
    this.bgRoot.addChild(this.title.galaxy);    // 은하수만 cover 배경 레이어(여백까지 채움)
    this.fgRoot.addChild(this.title.container); // 태양계 공전 + 로비 UI는 contain
    this.fgRoot.addChild(this.coinPill);        // 코인 표시 — title 위, 평상시엔 팝업 딤 아래(돌림판 때만 위로)
    this.coinHomeIndex = this.fgRoot.getChildIndex(this.coinPill);
    this.fgRoot.addChild(this.metaUI.layer);    // 메타 팝업(딤은 oversized로 뷰포트 전체를 덮음) — title 위
    this.fgRoot.addChild(this.loadingScreen.container); // 부팅 스플래시 — 전경(contain) 최상위, 로딩 한정 표시
    this.fade.alpha = 0;
    this.fade.eventMode = 'none';
    this.fade.on('pointerdown', (e) => e.stopPropagation()); // 전이 페이드(static)가 뒤 발사대로 입력을 흘리지 않게 차단(docs/50-art-ux)
    this.unlockModal = new UnlockModal(() => this.onUnlockOk());
    this.fgRoot.addChild(this.unlockModal.container); // 해금 모달 = contain 레이어 + 오버사이즈 딤(메타 팝업과 동일, docs/50-art-ux/popup-system)
    // 게임 모드 팝업(충전·결과·스테이지) = 같은 contain 레이어, 보드/HUD 위 (docs/50-art-ux/result-window)
    this.fgRoot.addChild(this.charge.container, this.result.container, this.stageClear.container, this.stageFail.container);
    this.app.stage.addChild(this.fade); // 씬 전이 페이드(최상위, 뷰포트 전체) — 크기는 layout()
    // 부팅: Loading 씬으로 즉시 진입(페이드 없음) → 최소 LOAD_MIN_MS 후 Title로 전이(tick에서 판정)
    this.loadT0 = performance.now();
    this.loadingScreen.start(this.loadT0);
    this.applyScene('Loading');
    this.app.ticker.add(() => this.tick());

    this.layout();
    this.app.renderer.on('resize', () => this.layout());
    if (import.meta.env.DEV) exposeDebug(this); // 디버그 API(window.__game)는 dev에서만 — 프로덕션 빌드에선 제거
  }

  private setScene(scene: SceneState) {
    if (this.scene === scene && !this.trans) {
      this.applyScene(scene);
      return;
    }
    // 씬 전이: 짧은 페이드(블랙 인 → 씬 교체 → 아웃), 전환 중 입력 차단 (docs/20-core-loop/screen-flow)
    this.trans = { to: scene, t0: performance.now(), phase: 'out' };
    this.fade.eventMode = 'static';
  }

  private applyScene(scene: SceneState) {
    this.scene = scene;
    this.loadingScreen.container.visible = scene === 'Loading'; // 부팅 스플래시는 Loading 한정
    this.gameLayer.visible = scene === 'PoolInGame';
    this.title.container.visible = scene === 'Title';
    this.title.galaxy.visible = scene === 'Title'; // 은하수 배경은 Title 한정
    this.coinPill.visible = scene === 'Title' || scene === 'PoolInGame'; // 코인 표시는 로비·인게임 공통(Loading 제외)
    if (scene === 'Title') this.title.refresh(); // 최대 머지 아이콘 + 현재 점수 갱신
    if (scene === 'PoolInGame') this.startSession(); // fresh session: count, board, queue (docs/20-core-loop/game-modes)
  }

  // Lucky wheel: lift the coin pill above the popup dim while the wheel is open so the spend/payout is
  // visible (docs/30-systems/lucky-wheel 딤 위 코인 표시); restore its normal z when the wheel closes.
  private raiseCoin() {
    this.fgRoot.setChildIndex(this.coinPill, this.fgRoot.children.length - 1);
  }
  private restoreCoin() {
    this.fgRoot.setChildIndex(this.coinPill, this.coinHomeIndex);
  }

  // OK on the unlock modal: raise the unlock cap to the new tier and resume.
  private onUnlockOk() {
    this.unlockedTier = Math.max(this.unlockedTier, this.pendingUnlockTier);
    this.paused = false;
    this.unlockModal.hide();
  }

  private updateTransition(now: number) {
    if (!this.trans) return;
    const DUR = 200; // 각 페이즈(out/in) 지속 ms
    const k = (now - this.trans.t0) / DUR;
    if (this.trans.phase === 'out') {
      this.fade.alpha = Math.min(1, k);
      if (k >= 1) {
        this.applyScene(this.trans.to);
        this.trans = { to: this.trans.to, t0: now, phase: 'in' };
      }
    } else {
      this.fade.alpha = Math.max(0, 1 - k);
      if (k >= 1) {
        this.fade.alpha = 0;
        this.fade.eventMode = 'none';
        this.trans = null;
      }
    }
  }

  private fire(tier: number, vx: number, vy: number): boolean {
    if (this.scene !== 'PoolInGame' || this.paused || this.ended || this.endKind || this.clearFly) return false;
    if (!this.modeC.canFire()) return false; // 카운트 소진 → 발사 불가 (docs/30-systems/launch-count)
    const now = performance.now();
    if (now < this.cooldownUntil) return false;
    this.cooldownUntil = now + LAUNCH.cooldownMs;
    // spawn just OUTSIDE the launcher circle, along the fire direction, so the ball never starts
    // inside the collision pocket (no spin-in-pocket). collidesLauncher=false → it clears cleanly.
    const r = tierData(tier).radius;
    const sp = LAUNCHER.r + r + 1;
    const spd = Math.hypot(vx, vy) || 1;
    const sx = LAUNCHER.x + (vx / spd) * sp;
    const sy = LAUNCHER.y + (vy / spd) * sp;
    // bornAt in the past → a launched ball merges on its FIRST collision (the re-merge delay is
    // only for freshly MERGED balls — docs/30-systems/merge-rules).
    this.spawnPlanet(tier, sx, sy, vx, vy, now - 1000, false);
    this.queue.shift();
    this.stats.shots++;
    this.modeC.consume(); // 카운트 -1 (docs/30-systems/launch-count)
    this.info.setCount(this.modeC.count);
    this.gestureDone = true; // 첫 발사 → 손가락 코치 종료(docs/50-art-ux/input-ux)
    sound.play('launch', { pitch: 0.85 + Math.min(1, Math.hypot(vx, vy) / LAUNCH.vMax) * 0.5 }); // 파워↑ → 피치↑
    return true;
  }

  private spawnPlanet(
    tier: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    now: number,
    inPlayArea: boolean,
    pop = false
  ): Planet {
    const r = tierData(tier).radius;
    const body = this.physics.createPlanetBody(x, y, r, inPlayArea);
    Body.setVelocity(body, { x: vx, y: vy });
    const sprite = makePlanetSprite(tier);
    sprite.x = x;
    sprite.y = y;
    if (pop) sprite.scale.set(JUICE.mergePop.startScale); // start small for the merge pop
    this.planetLayer.addChild(sprite);
    const p: Planet = {
      id: this.nextId++, tier, body, sprite, bornAt: now, merging: false, inPlayArea,
      popMs: pop ? JUICE.mergePop.ms : undefined,
    };
    this.planets.push(p);
    this.byBody.set(body, p);
    return p;
  }

  private removePlanet(p: Planet) {
    this.physics.remove(p.body);
    this.byBody.delete(p.body);
    p.sprite.destroy({ children: true });
    const i = this.planets.indexOf(p);
    if (i >= 0) this.planets.splice(i, 1);
  }

  private buildInitialRack() {
    const cx = PLAY.x + PLAY.w / 2;
    const cy = PLAY.y + PLAY.h * 0.36;
    const spacing = 58;
    const rowGap = 56;
    const rows = INITIAL_RACK.map(({ tier, count }) => Array<number>(count).fill(tier));
    const born = performance.now() - 1000;
    rows.forEach((row, ri) => {
      const y = cy + (ri - 1.5) * rowGap;
      row.forEach((tier, ci) => {
        const x = cx + (ci - (row.length - 1) / 2) * spacing;
        this.spawnPlanet(tier, x, y, 0, 0, born, true);
      });
    });
  }

  // Stage rack: lay out the stage's composition ({tier,count}) as one centred row per tier, stacked
  // top→down with tier-aware spacing so big planets never spawn overlapping (docs/30-systems/stage-mode ·
  // 40-balancing/stage-balance). Positions form the "shape"; physics settles them.
  private buildStageRack(rack: { tier: number; count: number }[]) {
    const born = performance.now() - 1000;
    const cx = PLAY.x + PLAY.w / 2;
    let y = PLAY.y + PLAY.h * 0.22;
    for (const r of rack) {
      const rad = tierData(r.tier).radius;
      const want = 2 * rad + 6; // spacing that avoids spawn overlap
      const maxW = PLAY.w - 2 * rad - 8;
      const spacing = r.count > 1 && (r.count - 1) * want > maxW ? maxW / (r.count - 1) : want;
      for (let ci = 0; ci < r.count; ci++) {
        const x = cx + (ci - (r.count - 1) / 2) * spacing;
        this.spawnPlanet(r.tier, x, y, 0, 0, born, true);
      }
      y += 2 * rad + 10; // next row below, spaced by this row's planet size
    }
  }

  // Start a fresh session of the current mode: clear the board, reset score/combo/count, build the
  // mode's rack + queue, and configure the HUD (docs/20-core-loop/game-modes).
  private startSession() {
    for (const p of [...this.planets]) this.removePlanet(p);
    // Stage는 처음부터 전 단계 해금(목표까지 합성이 막히지 않고 해금 모달도 없음, docs/30-systems/tier-unlock);
    // Infinite는 unlockStart부터 시작해 해금 모달로 한 단계씩 연다.
    if (this.modeC.isStage) this.modeC.stageIndex = this.meta.stageProgress; // 영속 진행도 = 현재 스테이지
    this.unlockedTier = this.modeC.isStage ? MAX_TIER : PROGRESSION.unlockStart;
    this.clearStageFly();
    this.paused = false;
    this.ended = false;
    this.endKind = null;
    this.unlockModal.hide();
    this.charge.container.visible = false; // 새 세션: 떠 있던 충전/종료 팝업 정리(닫기 콜백 없이)
    this.result.container.visible = false;
    this.stageClear.container.visible = false;
    this.stageFail.container.visible = false;
    this.score.reset();
    this.combo.reset();
    this.maxCombo = 0;
    this.gestureDone = false; // 첫 제스처 코치 다시 표시(첫 발사 전까지)
    this.modeC.startSession();
    this.sessionPrevBest = this.meta.bestScore; // snapshot before this run → NEW RECORD compare at end
    this.hud.setBest(this.meta.bestScore); // 인게임 👑 = 영속 최고 점수(localStorage) 로드
    this.hud.setStageMode(this.modeC.isStage ? this.modeC.stageIndex + 1 : null); // Stage: 점수 대신 'STAGE N'
    this.comboLayer.visible = !this.modeC.isStage; // Stage는 콤보 미표시 (docs/20-core-loop/game-modes)
    this.endSkip.eventMode = 'none';
    this.queue.reset(this.modeC.isStage ? this.modeC.stageDef.queue : null);
    if (this.modeC.isStage) this.buildStageRack(this.modeC.stageDef.rack);
    else this.buildInitialRack();
    this.info.setMode(this.modeC.mode, this.modeC.targetTier);
    this.info.setCount(this.modeC.count);
    this.info.setNext(this.queue.next());
    this.acc = 0;
  }

  // Open the Infinite charge popup (no-op in Stage / when the session has ended).
  private openCharge() {
    if (this.modeC.isStage || this.ended) return;
    this.charge.open();
  }

  // Spend coins to add launch count (docs/30-systems/planet-charge). Returns false if unaffordable.
  private buyCharge(n: number): boolean {
    if (this.modeC.isStage) return false; // 카운트 증가는 Infinite 한정 (docs/30-systems/launch-count)
    const c = MODES.infinite.charge;
    const cost = (n / c.stepPlanets) * c.coinPer10;
    if (!this.meta.spendCoins(cost)) return false;
    this.modeC.addCount(n);
    this.info.setCount(this.modeC.count);
    return true;
  }

  // Black hole + black hole (Infinite only): consume both for +blackHoleBonusCount count, no spawn
  // (ADR docs/30-systems/decisions/2026-06-28-blackhole-infinite-count). Other modes: no merge.
  private onTerminalMerge(pa: Planet, pb: Planet): boolean {
    if (this.modeC.mode !== 'Infinite') return false;
    const x = (pa.body.position.x + pb.body.position.x) / 2;
    const y = (pa.body.position.y + pb.body.position.y) / 2;
    this.removePlanet(pa);
    this.removePlanet(pb);
    this.modeC.addCount(MODES.infinite.blackHoleBonusCount);
    this.info.setCount(this.modeC.count);
    const d = tierData(MAX_TIER);
    this.effects.mergeBurst(x, y, d.colors[0], d.radius);
    sound.play('merge', { pitch: 0.55 });
    return true;
  }

  // Stage clear animation (docs/30-systems/stage-mode §클리어): the just-made target planet is removed
  // from the board and a render-only sprite arcs to the bottom-right target UI, where it bursts and
  // vanishes (no real merge); the clear window opens once the animation finishes. Firing stops + the
  // launcher chamber empties immediately, and board physics freezes while clearFly is set (tick).
  private startClearFly(tier: number, x: number, y: number, planet: Planet) {
    if (this.clearFly || this.ended) return;
    this.removePlanet(planet); // 목표 행성은 보드에서 제거 — 실제 합성이 아니라 연출 스프라이트가 날아간다
    this.launcher.clearChamber(); // 발사대 비움(추가 발사 정지는 fire()가 clearFly로 차단)
    const sprite = makePlanetSprite(tier); // scale 1 = 보드 크기(diameter = radius*2)
    sprite.x = x;
    sprite.y = y;
    this.effectLayer.addChild(sprite);
    this.clearFly = { sprite, phase: 'fly', t0: performance.now(), from: { x, y }, to: this.info.targetPos(), r0: tierData(tier).radius, tier };
    sound.play('merge', { pitch: 1.5 });
  }

  // Drive the clear animation each frame; on completion open the clear window (showEnd).
  private updateClearFly(now: number) {
    const cf = this.clearFly;
    if (!cf) return;
    if (cf.phase === 'fly') {
      const k = Math.min(1, (now - cf.t0) / 650);
      const e = k < 0.5 ? 2 * k * k : 1 - ((-2 * k + 2) ** 2) / 2; // easeInOutQuad
      const endScale = 44 / (cf.r0 * 2); // 목표 UI 행성 크기(44px, GameInfoPanel)
      if (cf.sprite) {
        cf.sprite.x = cf.from.x + (cf.to.x - cf.from.x) * e;
        cf.sprite.y = cf.from.y + (cf.to.y - cf.from.y) * e - 90 * Math.sin(Math.PI * e); // 위로 솟는 포물선
        cf.sprite.rotation = now * 0.02;
        cf.sprite.scale.set(1 + (endScale - 1) * e);
      }
      if (k >= 1) {
        this.effects.mergeBurst(cf.to.x, cf.to.y, tierData(cf.tier).colors[0], cf.r0); // 합쳐지는 이펙트
        sound.play('merge', { pitch: 1.7 });
        if (cf.sprite) { this.effectLayer.removeChild(cf.sprite); cf.sprite.destroy({ children: true }); cf.sprite = null; }
        cf.phase = 'burst';
        cf.t0 = now;
      }
    } else if (now - cf.t0 >= 300) { // 버스트가 잠깐 보인 뒤 클리어창
      this.clearFly = null;
      this.showEnd('clear');
    }
  }

  // Tear down any in-flight clear animation sprite (new session / cleanup).
  private clearStageFly() {
    if (this.clearFly?.sprite) { this.effectLayer.removeChild(this.clearFly.sprite); this.clearFly.sprite.destroy({ children: true }); }
    this.clearFly = null;
  }

  // End-of-session check (docs/30-systems/launch-count). Stage: arm the end window after a delay.
  // Infinite: end only once the count is gone AND every planet has settled (no fixed delay).
  private checkSessionEnd() {
    if (this.ended || this.endKind || this.paused || this.clearFly) return;
    if (this.modeC.count > 0) return;
    if (this.modeC.isStage) {
      this.scheduleEnd('fail');
      return;
    }
    if (this.planets.some((p) => Math.hypot(p.body.velocity.x, p.body.velocity.y) > 0.6)) return;
    this.showEnd('result');
  }

  // Arm the end window after RESULT.endDelayMs (docs/50-art-ux/result-window). 'clear' overrides a
  // pending 'fail' (a target made during the fail delay still wins); 'result'/'fail' don't re-arm.
  private scheduleEnd(kind: 'result' | 'clear' | 'fail') {
    if (this.ended) return;
    if (kind !== 'clear' && this.endKind) return;
    this.endKind = kind;
    this.endAt = performance.now() + RESULT.endDelayMs;
    this.endSkip.eventMode = 'static'; // 지연 중 화면 탭 → 즉시 종료창(showEnd)
  }

  // Show an end window — Stage after the armed delay (tick), Infinite immediately on settle.
  private showEnd(kind: 'result' | 'clear' | 'fail') {
    if (this.ended) return;
    this.ended = true;
    this.endKind = null;
    this.endSkip.eventMode = 'none';
    if (kind === 'result') {
      const finalScore = this.score.score;
      this.result.show(finalScore, this.maxCombo, finalScore > this.sessionPrevBest);
    } else if (kind === 'clear') {
      this.meta.markStageCleared(this.modeC.stageIndex); // 클리어 기록(재클리어 보상 방지)
      this.meta.addCoins(MODES.stage.clearReward); // +300 코인 (docs/30-systems/stage-mode)
      this.modeC.nextStage(); // 다음 스테이지로 전진(마지막에서 clamp)
      this.meta.setStageProgress(this.modeC.stageIndex); // 진행도 영속 — Title·다음 진입이 다음 스테이지
      this.stageClear.open();
    } else if (kind === 'fail') {
      this.stageFail.open();
    }
  }

  private tick() {
    const nowMs = performance.now();
    this.title.update(nowMs);
    this.metaUI.update(nowMs); // meta popups (transition + wheel spin + attendance countdown) run on Title too
    this.coinPill.update(nowMs); // 코인 잔액 롤링(odometer) + 쏟아진 코인 비행 — Title·인게임 공통
    this.charge.update(nowMs); // 모드 팝업 전환·행성 회전(항상 — 종료 상태에서도)
    this.result.update(nowMs);
    this.stageClear.update(nowMs);
    this.stageFail.update(nowMs);
    this.updateTransition(nowMs);
    this.unlockModal.update();
    if (this.scene === 'Loading') {
      this.loadingScreen.update(nowMs);
      // 최소 로딩 floor 경과 후 자동 전이(에셋은 동기 로드라 floor가 곧 전이 조건). 세이브 없는
      // 최초 실행은 Title을 건너뛰고 곧장 Stage 1 플레이로 진입한다(docs/20-core-loop/screen-flow
      // §최초 실행); 그 외에는 Title로 페이드.
      if (!this.trans && nowMs - this.loadT0 >= LOAD_MIN_MS) {
        if (this.meta.isFreshInstall) {
          this.modeC.setMode('Stage');
          this.setScene('PoolInGame');
        } else {
          this.setScene('Title');
        }
      }
      return;
    }
    // 인게임 메타/충전 팝업이 떠 있으면 물리·발사를 정지(해금 모달과 동일한 시간정책 — docs/20-core-loop/screen-flow §씬별 입력·시간)
    const popupOpen = this.metaUI.openKind() !== null || this.charge.container.visible;
    if (this.scene !== 'PoolInGame' || this.paused || this.ended || popupOpen) return;

    // Stage 클리어 연출 중: 보드 물리·발사를 멈추고 비행+버스트 연출만 갱신(완료 시 클리어창).
    if (this.clearFly) {
      this.updateClearFly(nowMs);
      this.effects.update(nowMs);
      return;
    }

    this.acc += this.app.ticker.deltaMS;
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 5 && !this.clearFly) { // 연출 시작 시 즉시 중단
      this.physics.update(STEP_MS);
      this.merge.process(performance.now());
      containPlanets(this.planets, this.physics); // absolute play-area containment + one-way line (per substep)
      this.acc -= STEP_MS;
      steps++;
    }
    if (this.acc > STEP_MS * 5) this.acc = 0;
    if (!this.clearFly) this.checkSessionEnd(); // 카운트 소진 → 종료 판정 (docs/30-systems/launch-count)
    if (this.endKind && nowMs >= this.endAt) this.showEnd(this.endKind); // Stage 종료창 지연 등장

    for (const p of this.planets) {
      p.sprite.x = p.body.position.x;
      p.sprite.y = p.body.position.y;
      p.sprite.rotation = p.body.angle;
      // merge spawn pop (small→big→settle), render-only
      if (p.popMs !== undefined) {
        const k = (nowMs - p.bornAt) / p.popMs;
        if (k >= 1) {
          p.sprite.scale.set(1);
          p.popMs = undefined;
        } else {
          p.sprite.scale.set(popScale(k));
        }
      }
    }
    if (!this.clearFly) this.launcher.update(); // 연출 중엔 비운 발사대를 다시 채우지 않음
    this.board.update(nowMs);
    this.hud.update(nowMs); // score odometer roll
    this.info.update(nowMs); // 좌하단 위젯/충전 버튼·목표 행성 회전
    this.gestureHint.setActive(!this.gestureDone && !this.launcher.isAiming, nowMs); // 첫 발사 전·조준 전만
    this.gestureHint.update(nowMs);
    this.combo.update(nowMs); // merge chain counter (window expiry + odometer + fade)
    this.effects.update(nowMs); // bursts + floating popups
  }

  // 2-레이어 fit: 배경(은하수)=cover로 뷰포트 가득, 전경(태양계·UI·보드)=contain(9:16) 중앙, fade=뷰포트 전체.
  private layout() {
    const vw = this.app.screen.width;
    const vh = this.app.screen.height;
    const sFg = Math.min(vw / DESIGN.w, vh / DESIGN.h);
    this.fgRoot.scale.set(sFg);
    this.fgRoot.position.set((vw - DESIGN.w * sFg) / 2, (vh - DESIGN.h * sFg) / 2);
    this.bgRoot.scale.set(1);
    this.bgRoot.position.set(0, 0);
    this.title.galaxy.resize(vw, vh);
    this.app.stage.hitArea = new Rectangle(0, 0, vw, vh);
    this.fade.clear();
    this.fade.beginFill(0x0a0e1a);
    this.fade.drawRect(0, 0, vw, vh);
    this.fade.endFill();
  }
}
