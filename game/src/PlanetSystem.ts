import { Body } from 'matter-js';
import { Container } from 'pixi.js';
import { PLAY, LINE_Y, JUICE } from './data/config';
import { tierData } from './data/planets';
import { makePlanetSprite } from './PlanetFactory';
import type { PhysicsWorld } from './PhysicsWorld';
import type { Planet } from './Planet';

// merge spawn pop curve: startScale → peakScale (0–40%) → settle to 1.0 (40–100%).
function popScale(k: number): number {
  const { startScale, peakScale } = JUICE.mergePop;
  return k < 0.4
    ? startScale + (peakScale - startScale) * (k / 0.4)
    : peakScale + (1 - peakScale) * ((k - 0.4) / 0.6);
}

// Planet entity store + lifecycle + per-frame sprite-sync (ECS-lite: the scene orchestrates,
// this owns the entity array / spawn-remove / render-sync loop).
export class PlanetSystem {
  readonly planets: Planet[] = [];
  private byBody = new Map<Body, Planet>();
  private nextId = 1;

  constructor(private physics: PhysicsWorld, private layer: Container) {}

  spawn(
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
    this.layer.addChild(sprite);
    const p: Planet = {
      id: this.nextId++, tier, body, sprite, bornAt: now, merging: false, inPlayArea,
      popMs: pop ? JUICE.mergePop.ms : undefined,
    };
    this.planets.push(p);
    this.byBody.set(body, p);
    return p;
  }

  remove(p: Planet): void {
    this.physics.remove(p.body);
    this.byBody.delete(p.body);
    p.sprite.destroy({ children: true });
    const i = this.planets.indexOf(p);
    if (i >= 0) this.planets.splice(i, 1);
  }

  at(b: Body): Planet | undefined {
    return this.byBody.get(b);
  }

  clear(): void {
    for (const p of [...this.planets]) this.remove(p);
  }

  // Per-frame render sync: copy body transform → sprite, and run the merge-spawn pop (render-only).
  syncSprites(nowMs: number): void {
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
  }

  get count(): number {
    return this.planets.length;
  }

  tiers(): number[] {
    return this.planets.map((p) => p.tier).sort((a, b) => a - b);
  }

  snapshot(): { tier: number; x: number; y: number; speed: number; inPlayArea: boolean; inBoard: boolean }[] {
    return this.planets.map((p) => ({
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
    }));
  }
}
