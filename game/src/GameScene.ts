import { Application, Container, Graphics, Rectangle } from 'pixi.js';
import { Body } from 'matter-js';
import { DESIGN, PLAY, LINE_Y, LAUNCHER, GAUGE, LAUNCH, COLORS, STEP_MS, JUICE, PHYSICS, SCORING, PROGRESSION } from './data/config';
import { tierData, MAX_TIER, INITIAL_RACK, SUN_TIER } from './data/planets';
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
import type { Planet } from './Planet';

type SceneState = 'Title' | 'PoolInGame';

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
  private scene: SceneState = 'Title';
  private unlockModal!: UnlockModal;
  private unlockedTier = PROGRESSION.unlockStart; // highest tier merges may create (docs/30-systems/tier-unlock)
  private pendingUnlockTier = 0;
  private paused = false; // true while the unlock modal is up (game frozen)
  private lastComboBonus = 0; // most recent awarded combo milestone bonus (verification hook)
  private fade = new Graphics(); // 씬 전이 페이드 오버레이(최상위, 뷰포트 전체)
  private trans: { to: SceneState; t0: number; phase: 'out' | 'in' } | null = null;
  private bgRoot = new Container(); // 은하수 배경 — cover로 뷰포트 가득(Title 한정)
  private fgRoot = new Container(); // 태양계·로비 UI·보드·HUD — contain(9:16, 잘림 없음)
  private popupRoot = new Container(); // 인게임/로비 팝업 — cover로 딤이 뷰포트 전체(상하 여백 포함)를 덮음

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
    this.app.stage.addChild(this.bgRoot, this.fgRoot, this.popupRoot); // 배경(cover)·전경(contain)·팝업(cover)
    this.fgRoot.addChild(this.gameLayer);
    this.app.stage.eventMode = 'static';

    this.physics = new PhysicsWorld();
    this.board = new BoardRenderer(this.boardLayer);
    this.hud = new Hud(this.uiLayer, () => this.setScene('Title')); // back button → Title
    this.effects = new Effects(this.effectLayer);
    this.combo = new Combo(this.comboLayer);
    this.score = new ScoreSystem((s) => this.hud.setScore(s));
    this.queue = new QueueSystem(
      () => {}, // launcher shows the current planet; next is random-refilled
      () => Math.max(1, Math.min(this.unlockedTier - PROGRESSION.queueBelow, PROGRESSION.queueCap))
    );
    this.merge = new MergeSystem(
      {
        planetByBody: (b) => this.byBody.get(b),
        removePlanet: (p) => this.removePlanet(p),
        spawnPlanet: (tier, x, y, vx, vy, now) => this.spawnPlanet(tier, x, y, vx, vy, now, true, true),
        unlockedTier: () => this.unlockedTier,
      },
      (tier, x, y) => {
        this.stats.merges++;
        this.stats.maxTier = Math.max(this.stats.maxTier, tier);
        if (tier >= MAX_TIER) this.stats.sunReached = true;
        const pts = this.score.onMerge(tier);
        const d = tierData(tier);
        this.effects.mergeBurst(x, y, d.colors[0], d.radius); // 발산 버스트
        this.effects.scorePopup(pts, x, y); // +N at the merge location
        sound.play('merge', { pitch: 1 + (tier - 1) * 0.05 }); // 생성 등급↑ → 피치↑ (docs/50-art-ux/sound-design)
        const comboBonus = this.combo.onMerge(performance.now()); // chain counter; returns milestone bonus
        if (comboBonus > 0) {
          this.score.addBonus(comboBonus); // combo 5/10/15… milestone → large bonus score
          this.effects.comboBonus(comboBonus, this.combo.value); // "+N(combo M)" at screen centre
          this.lastComboBonus = comboBonus;
          sound.play('comboMilestone');
        }
        this.meta.onMerge(this.combo.value, tier === SUN_TIER); // daily missions: merge count / combo peak / sun
        // first time a NEW tier is created → unlock modal + pause (docs/30-systems/tier-unlock)
        if (tier > this.unlockedTier && !this.paused) {
          this.pendingUnlockTier = tier;
          this.paused = true;
          this.unlockModal.show(tier);
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
          this.score.onBallHit(); // 행성–행성 충돌 +3
          this.effects.hitBurst(cx, cy, bx, by);
          sound.play('ballHit'); // 다발 충돌은 throttle로 솎임 (docs/50-art-ux/sound-design)
        }
      } else if (aP || bP) {
        if (impact >= SCORING.minImpact) {
          this.score.onWallHit(); // 벽(inner line)·발사대 원 충돌 +1
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
    }, this.fgRoot);

    this.meta = new MetaStore();
    this.metaUI = new MetaUI(this.meta);
    this.buildInitialRack();
    this.title = new TitleScreen(
      () => { sound.play('play'); this.setScene('PoolInGame'); },
      () => ({ current: this.score.score, maxTier: this.stats.maxTier }), // Title 현재 점수·최대 머지 아이콘
      { coins: () => this.meta.coins, subscribe: (fn) => this.meta.subscribe(fn), open: (k) => this.metaUI.open(k) } // 코인·팝업 훅
    );
    this.bgRoot.addChild(this.title.galaxy);    // 은하수만 cover 배경 레이어(여백까지 채움)
    this.fgRoot.addChild(this.title.container); // 태양계 공전 + 로비 UI는 contain
    this.fgRoot.addChild(this.metaUI.layer);    // 메타 팝업(딤은 oversized로 뷰포트 전체를 덮음) — title 위
    this.fade.alpha = 0;
    this.fade.eventMode = 'none';
    this.unlockModal = new UnlockModal(() => this.onUnlockOk());
    this.popupRoot.addChild(this.unlockModal.container); // 모달 딤은 cover 팝업 레이어(뷰포트 전체)
    this.app.stage.addChild(this.fade); // 씬 전이 페이드(최상위, 뷰포트 전체) — 크기는 layout()
    this.setScene('Title');
    this.app.ticker.add(() => this.tick());

    this.layout();
    this.app.renderer.on('resize', () => this.layout());
    this.exposeDebug();
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
    this.gameLayer.visible = scene === 'PoolInGame';
    this.title.container.visible = scene === 'Title';
    this.title.galaxy.visible = scene === 'Title'; // 은하수 배경은 Title 한정
    if (scene === 'Title') this.title.refresh(); // 최대 머지 아이콘 + 현재 점수 갱신
    if (scene === 'PoolInGame') {
      this.acc = 0;
      this.unlockedTier = PROGRESSION.unlockStart; // new game: reset unlock progression
      this.paused = false;
      this.unlockModal.hide();
    }
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
    if (this.scene !== 'PoolInGame' || this.paused) return false;
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

  // Absolute play-area containment (docs/30-systems/play-area-boundary). Matter has no continuous
  // collision detection, so a fast ball (strong launch / hard collision) can tunnel through the
  // thin walls and escape the playground. We enforce the rectangular boundary ANALYTICALLY every
  // physics substep — clamp the ball inside and reflect the outward velocity component. This also
  // turns the one-way bottom line into a crisp reflecting wall (no mushy stop). Collision filters
  // still handle the upward one-way pass-through.
  private containPlanets() {
    const e = PHYSICS.wallRestitution;
    const floorY = GAUGE.cy + GAUGE.r; // coarse bottom floor (bulge bottom)
    for (const p of this.planets) {
      const r = tierData(p.tier).radius;
      const b = p.body;
      // launched ball: once it has cleared the launcher circle, the circle blocks re-entry
      if (!p.inPlayArea) {
        const d = Math.hypot(b.position.x - LAUNCHER.x, b.position.y - LAUNCHER.y);
        if (d > LAUNCHER.r + r) {
          p.inPlayArea = true;
          this.physics.blockAtLauncher(b);
        }
      }
      // rectangular containment (top/left/right) + coarse bottom floor (fast-ball anti-tunnel)
      let x = b.position.x;
      let y = b.position.y;
      let vx = b.velocity.x;
      let vy = b.velocity.y;
      let hit = false;
      if (x < PLAY.x + r) { x = PLAY.x + r; if (vx < 0) vx = -vx * e; hit = true; }
      else if (x > PLAY.x + PLAY.w - r) { x = PLAY.x + PLAY.w - r; if (vx > 0) vx = -vx * e; hit = true; }
      if (y < PLAY.y + r) { y = PLAY.y + r; if (vy < 0) vy = -vy * e; hit = true; }
      else if (y > floorY - r) { y = floorY - r; if (vy > 0) vy = -vy * e; hit = true; }
      if (hit) {
        Body.setPosition(b, { x, y });
        Body.setVelocity(b, { x: vx, y: vy });
      }
    }
  }

  private tick() {
    const nowMs = performance.now();
    this.title.update(nowMs);
    this.metaUI.update(nowMs); // meta popups (transition + wheel spin + attendance countdown) run on Title too
    this.updateTransition(nowMs);
    this.unlockModal.update();
    if (this.scene !== 'PoolInGame' || this.paused) return;

    this.acc += this.app.ticker.deltaMS;
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 5) {
      this.physics.update(STEP_MS);
      this.merge.process(performance.now());
      this.containPlanets(); // absolute play-area containment + one-way line (per substep)
      this.acc -= STEP_MS;
      steps++;
    }
    if (this.acc > STEP_MS * 5) this.acc = 0;

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
    this.launcher.update();
    this.board.update(nowMs);
    this.hud.update(); // score odometer roll
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
    const sBg = Math.max(vw / DESIGN.w, vh / DESIGN.h);
    this.bgRoot.scale.set(sBg);
    this.bgRoot.position.set((vw - DESIGN.w * sBg) / 2, (vh - DESIGN.h * sBg) / 2);
    this.popupRoot.scale.set(sBg); // 팝업 딤도 cover로 뷰포트 전체(상하 여백까지)
    this.popupRoot.position.set((vw - DESIGN.w * sBg) / 2, (vh - DESIGN.h * sBg) / 2);
    this.app.stage.hitArea = new Rectangle(0, 0, vw, vh);
    this.fade.clear();
    this.fade.beginFill(0x0a0e1a);
    this.fade.drawRect(0, 0, vw, vh);
    this.fade.endFill();
  }

  // Verification hooks (Playwright). Not part of the player-facing game.
  private exposeDebug() {
    (window as any).__game = {
      scene: () => this.scene,
      fgRect: () => {
        const s = Math.min(this.app.screen.width / DESIGN.w, this.app.screen.height / DESIGN.h);
        return { w: DESIGN.w * s, h: DESIGN.h * s }; // 전경(9:16) 화면 크기
      },
      startGame: () => this.setScene('PoolInGame'),
      showTitle: () => this.setScene('Title'),
      unlockedTier: () => this.unlockedTier,
      unlockPending: () => this.paused,
      okUnlock: () => this.onUnlockOk(),
      unlockAll: () => {
        this.unlockedTier = MAX_TIER;
      },
      stats: () => ({ ...this.stats }),
      score: () => this.score.score,
      comboValue: () => this.combo.value,
      comboBonusAwarded: () => this.lastComboBonus,
      planetCount: () => this.planets.length,
      queue: () => this.queue.peek(),
      tiersOnBoard: () => this.planets.map((p) => p.tier).sort((a, b) => a - b),
      snapshot: () =>
        this.planets.map((p) => ({
          tier: p.tier,
          x: p.body.position.x,
          y: p.body.position.y,
          speed: Math.hypot(p.body.velocity.x, p.body.velocity.y),
          inPlayArea: p.inPlayArea,
          inBoard:
            p.body.position.x > PLAY.x - 30 &&
            p.body.position.x < PLAY.x + PLAY.w + 30 &&
            p.body.position.y > PLAY.y - 30 &&
            p.body.position.y < LINE_Y + 90,
        })),
      lineY: () => LINE_Y,
      launcher: () => ({ x: LAUNCHER.x, y: LAUNCHER.y, r: LAUNCHER.r }),
      bounds: () => {
        const floorY = GAUGE.cy + GAUGE.r;
        return { x: PLAY.x, y: PLAY.y, w: PLAY.w, h: floorY - PLAY.y, lineY: floorY };
      },
      fire: (angleRad: number, power: number) => {
        this.cooldownUntil = 0;
        const speed = Math.max(0, Math.min(power, 1)) * LAUNCH.vMax;
        return this.fire(this.queue.current(), Math.cos(angleRad) * speed, Math.sin(angleRad) * speed);
      },
      clearBoard: () => {
        for (const p of [...this.planets]) this.removePlanet(p);
      },
      spawnPair: (tier: number) => {
        const now = performance.now() - 1000;
        const cx = PLAY.x + PLAY.w / 2;
        const cy = PLAY.y + PLAY.h * 0.5;
        const r = tierData(tier).radius;
        this.spawnPlanet(tier, cx - r - 1, cy, 5, 0, now, true);
        this.spawnPlanet(tier, cx + r + 1, cy, -5, 0, now, true);
      },
      // meta layer (coin wallet + missions + attendance + wheel) — docs/30-systems/meta-economy
      meta: () => ({ coins: this.meta.coins, completed: this.meta.completedCount(), attendanceDay: this.meta.attendanceDay }),
      metaMissions: () => this.meta.missionRows(),
      metaReset: () => this.meta.__reset(),
      metaAddCoins: (n: number) => this.meta.addCoins(n),
      openPopup: (kind: 'dailyMission' | 'attendance' | 'wheel' | 'shop') => this.metaUI.open(kind),
      claimAttendance: () => this.meta.claimAttendance(),
      claimMilestone: (n: number) => this.meta.claimMilestone(n),
      wheelStart: () => this.metaUI.wheel.startSpin(),
      wheelStop: (i: number) => this.metaUI.wheel.stopOn(i),
      wheelWin: () => this.metaUI.wheel.lastWin,
    };
  }
}
