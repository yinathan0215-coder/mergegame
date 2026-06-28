import type { Body } from 'matter-js';
import { PHYSICS } from './data/config';
import { MAX_TIER } from './data/planets';
import type { Planet } from './Planet';

export interface MergeHost {
  planetByBody(b: Body): Planet | undefined;
  removePlanet(p: Planet): void;
  spawnPlanet(tier: number, x: number, y: number, vx: number, vy: number, now: number): Planet;
  unlockedTier(): number; // highest tier merges may create (docs/30-systems/tier-unlock)
  // Two MAX_TIER planets (black holes) collide. Infinite mode consumes both for a count bonus
  // (docs/30-systems/launch-count · ADR 2026-06-28-blackhole-infinite-count); other modes return
  // false (no merge — black hole is terminal). Returns true if the host consumed the pair.
  terminalMerge(pa: Planet, pb: Planet): boolean;
}

// Collision-driven merge. Pairs collected during the physics step are processed after it,
// with a merge lock (one merge per planet per pass) and a re-merge delay on fresh planets.
export class MergeSystem {
  private pending: [Body, Body][] = [];

  constructor(private host: MergeHost, private onMerge: (tier: number, x: number, y: number, planet: Planet) => void) {}

  queuePair(a: Body, b: Body) {
    if (a.label === 'planet' && b.label === 'planet') this.pending.push([a, b]);
  }

  process(now: number) {
    const pairs = this.pending;
    this.pending = [];
    for (const [ba, bb] of pairs) {
      const pa = this.host.planetByBody(ba);
      const pb = this.host.planetByBody(bb);
      if (!pa || !pb || pa === pb) continue;
      if (pa.merging || pb.merging) continue;
      if (pa.tier !== pb.tier) continue;
      if (now - pa.bornAt < PHYSICS.remergeDelayMs || now - pb.bornAt < PHYSICS.remergeDelayMs) continue;
      if (pa.tier >= MAX_TIER) {
        // black hole + black hole: Infinite consumes both for a count bonus; else terminal (no merge)
        if (this.host.terminalMerge(pa, pb)) {
          pa.merging = true;
          pb.merging = true;
        }
        continue;
      }
      if (pa.tier > this.host.unlockedTier()) continue; // locked tier: not mergeable until unlocked
      pa.merging = true;
      pb.merging = true;
      this.doMerge(pa, pb, now);
    }
  }

  private doMerge(pa: Planet, pb: Planet, now: number) {
    const ax = pa.body.position.x, ay = pa.body.position.y;
    const bx = pb.body.position.x, by = pb.body.position.y;
    const mx = (ax + bx) / 2, my = (ay + by) / 2;

    // Result keeps the DOMINANT parent's velocity (greater momentum = mass×speed), so the merge
    // shoots off in the direction of the larger force (docs/30-systems/merge-rules). If that is
    // too small, push along the collision normal so it never stalls in place.
    const sa = Math.hypot(pa.body.velocity.x, pa.body.velocity.y);
    const sb = Math.hypot(pb.body.velocity.x, pb.body.velocity.y);
    const dom = pa.body.mass * sa >= pb.body.mass * sb ? pa : pb;
    let vx = dom.body.velocity.x;
    let vy = dom.body.velocity.y;
    if (Math.hypot(vx, vy) < PHYSICS.mergeMinSpeed) {
      const other = dom === pa ? pb : pa;
      let nx = dom.body.position.x - other.body.position.x;
      let ny = dom.body.position.y - other.body.position.y;
      const nl = Math.hypot(nx, ny) || 1;
      vx = (nx / nl) * PHYSICS.mergeMinSpeed;
      vy = (ny / nl) * PHYSICS.mergeMinSpeed;
    }

    const newTier = pa.tier + 1;
    this.host.removePlanet(pa);
    this.host.removePlanet(pb);
    const np = this.host.spawnPlanet(newTier, mx, my, vx, vy, now);
    this.onMerge(newTier, mx, my, np);
  }
}
