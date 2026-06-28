import { Body } from 'matter-js';
import { PLAY, GAUGE, LAUNCHER, PHYSICS } from './data/config';
import { tierData } from './data/planets';
import type { Planet } from './Planet';
import type { PhysicsWorld } from './PhysicsWorld';

// Absolute play-area containment (docs/30-systems/play-area-boundary). Matter has no continuous
// collision detection, so a fast ball (strong launch / hard collision) can tunnel through the
// thin walls and escape the playground. We enforce the rectangular boundary ANALYTICALLY every
// physics substep — clamp the ball inside and reflect the outward velocity component. This also
// turns the one-way bottom line into a crisp reflecting wall (no mushy stop). Collision filters
// still handle the upward one-way pass-through.
export function containPlanets(planets: Planet[], physics: PhysicsWorld): void {
  const e = PHYSICS.wallRestitution;
  const floorY = GAUGE.cy + GAUGE.r; // coarse bottom floor (bulge bottom)
  for (const p of planets) {
    const r = tierData(p.tier).radius;
    const b = p.body;
    // launched ball: once it has cleared the launcher circle, the circle blocks re-entry
    if (!p.inPlayArea) {
      const d = Math.hypot(b.position.x - LAUNCHER.x, b.position.y - LAUNCHER.y);
      if (d > LAUNCHER.r + r) {
        p.inPlayArea = true;
        physics.blockAtLauncher(b);
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
