import { Application, Container, Graphics, Rectangle } from 'pixi.js';
import { DESIGN, COLORS, STEP_MS, PROGRESSION, MODES } from './data/config';
import { tierData, MAX_TIER } from './data/planets';
import { ModeController } from './modes/ModeController';
import { GameInfoPanel } from './GameInfoPanel';
import { FirstGestureHint } from './FirstGestureHint';
import { ChargePopup } from './popups/ChargePopup';
import { ResultPopup } from './popups/ResultPopup';
import { StageClearPopup, StageFailPopup } from './popups/StageEndPopup';
import { MetaStore } from './MetaStore';
import { Economy } from './Economy';
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
import { StageClearFx } from './StageClearFx';
import { Combo } from './Combo';
import { MergeOutcome } from './MergeOutcome';
import { sound } from './SoundManager';
import { LoadingScreen } from './LoadingScreen';
import { CoinPill } from './ui/CoinPill';
import { ASSETS } from './assets';
import { exposeDebug } from './debug';
import { eventLog } from './EventLog';
import { containPlanets } from './Containment';
import { PlanetSystem } from './PlanetSystem';
import { RackBuilder } from './RackBuilder';
import { SessionController } from './SessionController';
import { LaunchController } from './LaunchController';

type SceneState = 'Loading' | 'Title' | 'PoolInGame';
// In-session phase — the end phase itself carries the kind (result / stageClear / stageFail).
type Phase = 'playing' | 'paused' | 'pendingFail' | 'clearing' | 'result' | 'stageClear' | 'stageFail';

const LOAD_MIN_MS = 2000; // 최소 로딩 시간 floor (docs/20-core-loop/screen-flow §Loading)

export class GameScene {
  readonly app: Application;
  private gameLayer = new Container();
  private boardLayer = new Container();
  private comboLayer = new Container(); // combo watermark — behind the planets
  private planetLayer = new Container();
  private effectLayer = new Container();
  private aimLayer = new Container();
  private uiLayer = new Container();

  private planetSys: PlanetSystem; // planet entity store + lifecycle + per-frame sprite-sync (ECS-lite)
  private rack: RackBuilder; // session starting-board spawn geometry (extracted from this orchestrator)
  private launchCtl: LaunchController; // launch execution: cooldown gate + spawn geometry (extracted from this orchestrator, audit D2)
  private acc = 0;

  private physics: PhysicsWorld;
  private hud: Hud;
  private score: ScoreSystem;
  private queue: QueueSystem;
  private merge: MergeSystem;
  private mergeOutcome!: MergeOutcome; // merge reward fan-out + collision scoring (extracted from this orchestrator)
  private launcher: Launcher;
  private effects: Effects;
  private combo: Combo;
  private board: BoardRenderer;
  private title: TitleScreen;
  private meta: MetaStore; // coin wallet + daily mission/attendance state (docs/30-systems/meta-economy)
  private economy!: Economy; // economy/progression rules (stage-clear reward, charge purchase, black-hole bonus)
  private metaUI: MetaUI; // Title-lobby popups (missions/attendance/wheel/shop)
  private coinPill!: CoinPill; // 코인 잔액 표시(공통) — Title·인게임 동일 위치, 돌림판이 딤 위로 올림
  private coinHomeIndex = 0; // fgRoot에서의 평상시 z(돌림판 닫힐 때 복귀)
  private scene: SceneState = 'Loading';
  private loadingScreen = new LoadingScreen(LOAD_MIN_MS); // 부팅 스플래시(GALAXY PINBALL 스트림)
  private loadT0 = 0; // 부팅 시각 — 최소 로딩 floor 계산용
  private unlockModal!: UnlockModal;
  private unlockedTier = PROGRESSION.unlockStart; // highest tier merges may create (docs/30-systems/tier-unlock)
  private pendingUnlockTier = 0;
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
  // In-session phase state machine (docs/20-core-loop/screen-flow §PoolInGame 내부 상태); the end phase
  // encodes its own kind (result/stageClear/stageFail), the 'clearing' animation lives in clearFx.
  // Transitions: playing→paused→playing (unlock modal); playing→pendingFail→stageFail (armed Stage end);
  // playing→clearing→stageClear (clear fly); playing→result (Infinite settle); *→playing on startSession.
  // Every transition routes through setPhase() — the single guarded transition point (audit D4).
  private phase: Phase = 'playing';
  private session!: SessionController; // session-END flow (checkSessionEnd/scheduleEnd/showEnd) — calls back via host.setPhase
  // Stage 클리어 연출(docs/30-systems/stage-mode §클리어): 목표 행성이 우하단 목표 UI로 포물선 비행 →
  // 도달 시 머지 버스트(burst) 잠깐 hold → 클리어창. 연출 모듈이 스프라이트 수명을 소유; 연출 중 물리·발사
  // 정지는 GameScene phase('clearing')가 담당.
  private clearFx!: StageClearFx;
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
    this.endSkip.on('pointerdown', (e) => { e.stopPropagation(); if (this.phase === 'pendingFail') this.session.showEnd('fail'); });
    this.fgRoot.addChild(this.endSkip);
    this.app.stage.eventMode = 'static';

    this.physics = new PhysicsWorld();
    this.planetSys = new PlanetSystem(this.physics, this.planetLayer);
    this.rack = new RackBuilder(this.planetSys);
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
    this.score = new ScoreSystem((s) => { eventLog.emit('SCORE_CHANGED', { score: s }); this.hud.setScore(s); if (!this.modeC.isStage) this.meta.setScore(s); }); // 점수 → HUD + 영속 레코드(Stage는 집계 안 함)
    this.queue = new QueueSystem(
      (slots) => { eventLog.emit('QUEUE_CHANGED', {}); this.info.setNext(slots[1] ?? slots[0]); }, // Next 미리보기 갱신(좌하단 HUD)
      () => Math.max(1, Math.min(this.unlockedTier - PROGRESSION.queueBelow, PROGRESSION.queueCap))
    );
    this.launchCtl = new LaunchController({
      planets: this.planetSys, queue: this.queue, modeC: this.modeC,
      host: {
        canFire: () => this.scene === 'PoolInGame' && this.phase === 'playing',
        bumpShots: () => { this.stats.shots++; },
        onFired: () => { this.gestureDone = true; },
        syncCount: () => this.info.setCount(this.modeC.count),
      },
    });
    this.merge = new MergeSystem(
      {
        planetByBody: (b) => this.planetSys.at(b),
        removePlanet: (p) => this.planetSys.remove(p),
        spawnPlanet: (tier, x, y, vx, vy, now) => this.planetSys.spawn(tier, x, y, vx, vy, now, true, true),
        unlockedTier: () => this.unlockedTier,
        terminalMerge: (pa, pb) => this.mergeOutcome.onTerminalMerge(pa, pb), // 블랙홀끼리 합성 → Infinite 카운트 +20
      },
      (tier, x, y, planet) => this.mergeOutcome.onMerge(tier, x, y, planet, performance.now())
    );
    this.physics.onCollision((a, b, impact, cx, cy, bx, by) => this.mergeOutcome.onCollision(a, b, impact, cx, cy, bx, by));
    this.launcher = new Launcher(this.app.stage, this.aimLayer, this.uiLayer, {
      currentTier: () => this.queue.current(),
      fire: (tier, vx, vy) => this.launchCtl.fire(tier, vx, vy),
      obstacles: () =>
        this.planetSys.planets.map((p) => ({ x: p.body.position.x, y: p.body.position.y, r: tierData(p.tier).radius })),
      canAim: () => this.scene === 'PoolInGame' && !this.trans && this.phase === 'playing'
        && this.metaUI.openKind() === null && !this.charge.container.visible,
    }, this.fgRoot);
    this.clearFx = new StageClearFx(this.effectLayer, {
      removePlanet: (p) => this.planetSys.remove(p),
      clearChamber: () => this.launcher.clearChamber(),
      targetPos: () => this.info.targetPos(),
      burst: (x, y, c, r) => this.effects.mergeBurst(x, y, c, r),
      onComplete: () => this.session.showEnd('clear'),
    });

    this.meta = new MetaStore();
    this.economy = new Economy(this.meta, this.modeC, () => this.info.setCount(this.modeC.count));
    this.meta.subscribe(() => this.hud.refreshMenuBadges()); // 보상 수령·KST 리셋 시 ≡ 집계 레드닷 갱신
    this.hud.refreshMenuBadges(); // 부팅 직후 초기 상태(출석 등 받을 보상)
    // Reward fan-out + collision scoring (extracted from this orchestrator). Host = the flow/state
    // this owns: stats, combo peak, phase machine, stage-clear trigger and the unlock modal.
    this.mergeOutcome = new MergeOutcome({
      score: this.score, combo: this.combo, effects: this.effects, meta: this.meta,
      merge: this.merge, modeC: this.modeC, planetSys: this.planetSys, economy: this.economy,
      host: {
        bumpStats: (tier) => {
          this.stats.merges++;
          this.stats.maxTier = Math.max(this.stats.maxTier, tier);
          if (tier >= MAX_TIER) this.stats.sunReached = true;
        },
        trackCombo: (cv) => { this.maxCombo = Math.max(this.maxCombo, cv); }, // session combo peak (Infinite result)
        setComboBonus: (b) => { this.lastComboBonus = b; },
        canStageClear: () => (this.phase === 'playing' || this.phase === 'pendingFail') && !this.meta.isStageCleared(this.modeC.stageIndex),
        triggerStageClear: (tier, x, y, planet) => { this.clearFx.start(tier, x, y, planet, performance.now()); this.setPhase('clearing'); },
        canUnlock: () => this.phase === 'playing',
        triggerUnlock: (tier) => {
          this.pendingUnlockTier = tier;
          this.setPhase('paused');
          const bonus = this.modeC.mode === 'Infinite' ? MODES.infinite.unlockBonusCount : 0;
          if (bonus > 0) {
            this.modeC.addCount(bonus);
            this.info.setCount(this.modeC.count);
          }
          this.unlockModal.show(tier, bonus);
          sound.play('unlock');
        },
        unlockedTier: () => this.unlockedTier,
      },
    });
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
    // Session-END flow. Host callbacks keep setPhase the single guarded transition point (audit D4) —
    // the controller never writes this.phase directly.
    this.session = new SessionController({
      modeC: this.modeC,
      economy: this.economy,
      planetSys: this.planetSys,
      result: this.result,
      stageClear: this.stageClear,
      stageFail: this.stageFail,
      host: {
        phase: () => this.phase,
        isEnded: () => this.isEnded,
        setPhase: (t) => this.setPhase(t),
        endSkipOn: (on) => { this.endSkip.eventMode = on ? 'static' : 'none'; },
        resultData: () => ({ score: this.score.score, maxCombo: this.maxCombo, prevBest: this.sessionPrevBest }),
      },
    });
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
    eventLog.emit('UNLOCK_OK', {});
    this.unlockedTier = Math.max(this.unlockedTier, this.pendingUnlockTier);
    this.setPhase('playing');
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

  // Start a fresh session of the current mode: clear the board, reset score/combo/count, build the
  // mode's rack + queue, and configure the HUD (docs/20-core-loop/game-modes).
  private startSession() {
    this.planetSys.clear();
    // Stage는 처음부터 전 단계 해금(목표까지 합성이 막히지 않고 해금 모달도 없음, docs/30-systems/tier-unlock);
    // Infinite는 unlockStart부터 시작해 해금 모달로 한 단계씩 연다.
    if (this.modeC.isStage) this.modeC.stageIndex = this.meta.stageProgress; // 영속 진행도 = 현재 스테이지
    this.unlockedTier = this.modeC.isStage ? MAX_TIER : PROGRESSION.unlockStart;
    this.clearFx.clear();
    this.setPhase('playing');
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
    this.session.reset();
    this.endSkip.eventMode = 'none';
    this.queue.reset(this.modeC.isStage ? this.modeC.stageDef.queue : null);
    if (this.modeC.isStage) this.rack.buildStage(this.modeC.stageDef.rack);
    else this.rack.buildInitial();
    this.info.setMode(this.modeC.mode, this.modeC.targetTier);
    this.info.setCount(this.modeC.count);
    this.info.setNext(this.queue.next());
    this.acc = 0;
  }

  // Open the Infinite charge popup (no-op in Stage / when the session has ended).
  private openCharge() {
    if (this.modeC.isStage || this.isEnded) return;
    this.charge.open();
  }

  // Spend coins to add launch count (docs/30-systems/planet-charge). Returns false if unaffordable.
  private buyCharge(n: number): boolean {
    return this.economy.buyCharge(n);
  }

  // Single guarded transition point for the in-session phase machine (audit D4) — every `this.phase`
  // change routes through here.
  private setPhase(to: Phase) { this.phase = to; }

  // The three first-class end phases (window shown). Used by the tick freeze + openCharge + re-entry guards.
  private get isEnded(): boolean {
    return this.phase === 'result' || this.phase === 'stageClear' || this.phase === 'stageFail';
  }

  // phase === 'clearing', read via getter so tick()'s earlier early-returns don't narrow this.phase
  // out of 'clearing' — the loop mutates it back to 'clearing' via clearFx.start (merge.process side effect).
  private get isClearing(): boolean { return this.phase === 'clearing'; }

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
    if (this.scene !== 'PoolInGame' || this.phase === 'paused' || this.isEnded || popupOpen) return;

    // Stage 클리어 연출 중: 보드 물리·발사를 멈추고 비행+버스트 연출만 갱신(완료 시 클리어창).
    if (this.isClearing) {
      this.clearFx.update(nowMs);
      this.effects.update(nowMs);
      return;
    }

    this.acc += this.app.ticker.deltaMS;
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 5 && !this.isClearing) { // 연출 시작 시 즉시 중단
      this.physics.update(STEP_MS);
      this.merge.process(performance.now());
      containPlanets(this.planetSys.planets, this.physics); // absolute play-area containment + one-way line (per substep)
      this.acc -= STEP_MS;
      steps++;
    }
    if (this.acc > STEP_MS * 5) this.acc = 0;
    if (!this.isClearing) this.session.check(); // 카운트 소진 → 종료 판정 (docs/30-systems/launch-count)
    this.session.tickEnd(nowMs); // Stage 종료창 지연 등장

    this.planetSys.syncSprites(nowMs);
    if (!this.isClearing) this.launcher.update(); // 연출 중엔 비운 발사대를 다시 채우지 않음
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
    this.fade.beginFill(COLORS.fadeBlack);
    this.fade.drawRect(0, 0, vw, vh);
    this.fade.endFill();
  }
}
