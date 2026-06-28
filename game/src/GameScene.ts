import { Application, Container, Rectangle } from 'pixi.js';
import { Body } from 'matter-js';
import { DESIGN, PLAY, LINE_Y, LAUNCHER, GAUGE, LAUNCH, COLORS, STEP_MS, JUICE, PHYSICS } from './data/config';
import { tierData, MAX_TIER, INITIAL_RACK } from './data/planets';
import { PhysicsWorld } from './PhysicsWorld';
import { BoardRenderer } from './BoardRenderer';
import { Hud } from './Hud';
import { Launcher } from './Launcher';
import { QueueSystem } from './QueueSystem';
import { ScoreSystem } from './ScoreSystem';
import { MergeSystem } from './MergeSystem';
import { Effects } from './Effects';
import { makePlanetSprite } from './PlanetFactory';
import type { Planet } from './Planet';

// merge spawn pop curve: startScale → peakScale (0–40%) → settle to 1.0 (40–100%).
function popScale(k: number): number {
  const { startScale, peakScale } = JUICE.mergePop;
  return k < 0.4
    ? startScale + (peakScale - startScale) * (k / 0.4)
    : peakScale + (1 - peakScale) * ((k - 0.4) / 0.6);
}

export class GameScene {
  readonly app: Application;
  private boardLayer = new Container();
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

  stats = { shots: 0, merges: 0, maxTier: 1, sunReached: false };

  constructor(mount: HTMLElement) {
    this.app = new Application({
      width: DESIGN.w,
      height: DESIGN.h,
      backgroundColor: COLORS.outerBg,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    mount.appendChild(this.app.view as unknown as HTMLCanvasElement);
    this.app.stage.addChild(this.boardLayer, this.planetLayer, this.effectLayer, this.aimLayer, this.uiLayer);
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = new Rectangle(0, 0, DESIGN.w, DESIGN.h);

    this.physics = new PhysicsWorld();
    new BoardRenderer(this.boardLayer);
    this.hud = new Hud(this.uiLayer);
    this.effects = new Effects(this.effectLayer, this.uiLayer, DESIGN.w / 2, 56);
    this.score = new ScoreSystem((s) => this.hud.setScore(s));
    this.queue = new QueueSystem(() => {}); // launcher shows the current planet; next is random-refilled
    this.merge = new MergeSystem(
      {
        planetByBody: (b) => this.byBody.get(b),
        removePlanet: (p) => this.removePlanet(p),
        spawnPlanet: (tier, x, y, vx, vy, now) => this.spawnPlanet(tier, x, y, vx, vy, now, true, true),
      },
      (tier, x, y) => {
        this.stats.merges++;
        this.stats.maxTier = Math.max(this.stats.maxTier, tier);
        if (tier >= MAX_TIER) this.stats.sunReached = true;
        const pts = this.score.onMerge(tier);
        const d = tierData(tier);
        this.effects.mergeBurst(x, y, d.colors[0], d.radius); // 발산 버스트
        this.effects.scorePopup(pts); // +N 플로팅
      }
    );
    this.physics.onCollision((a, b) => {
      const aP = a.label === 'planet';
      const bP = b.label === 'planet';
      if (aP && bP) {
        this.score.onBallHit(); // 행성–행성 충돌 +3
        this.merge.queuePair(a, b);
      } else if (aP || bP) {
        this.score.onWallHit(); // 벽(inner line)·발사대 원 충돌 +1
      }
    });
    this.launcher = new Launcher(this.app.stage, this.aimLayer, this.uiLayer, {
      currentTier: () => this.queue.current(),
      fire: (tier, vx, vy) => this.fire(tier, vx, vy),
      obstacles: () =>
        this.planets.map((p) => ({ x: p.body.position.x, y: p.body.position.y, r: tierData(p.tier).radius })),
    });

    this.buildInitialRack();
    this.app.ticker.add(() => this.tick());

    this.fitCanvas();
    window.addEventListener('resize', () => this.fitCanvas());
    this.exposeDebug();
  }

  private fire(tier: number, vx: number, vy: number): boolean {
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
    this.spawnPlanet(tier, sx, sy, vx, vy, now, false);
    this.queue.shift();
    this.stats.shots++;
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

  // 초기 랙: triangle whose rows encode the counts 지구1·금성2·화성3·수성4 (in the play area).
  private buildInitialRack() {
    const cx = PLAY.x + PLAY.w / 2;
    const cy = PLAY.y + PLAY.h * 0.36;
    const spacing = 58;
    const rowGap = 56;
    // Pyramid rows derived from the rack SSoT: 지구(top)→수성(bottom). Each row = `count` copies
    // of `tier`, so row length encodes the count. Reversing INITIAL_RACK yields [[4],[3,3],[2,2,2],[1,1,1,1]].
    const rows = [...INITIAL_RACK].reverse().map(({ tier, count }) => Array<number>(count).fill(tier));
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

    const nowMs = performance.now();
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
    this.hud.update(); // score odometer roll
    this.effects.update(nowMs); // bursts + floating popups
  }

  private fitCanvas() {
    const cv = this.app.view as unknown as HTMLCanvasElement;
    const scale = Math.min(window.innerWidth / DESIGN.w, window.innerHeight / DESIGN.h);
    cv.style.width = Math.round(DESIGN.w * scale) + 'px';
    cv.style.height = Math.round(DESIGN.h * scale) + 'px';
  }

  // Verification hooks (Playwright). Not part of the player-facing game.
  private exposeDebug() {
    (window as any).__game = {
      stats: () => ({ ...this.stats }),
      score: () => this.score.score,
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
    };
  }
}
