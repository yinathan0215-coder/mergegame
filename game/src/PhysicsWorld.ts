import { Engine, Bodies, Composite, Events, type Body } from 'matter-js';
import { innerOutline, LAUNCHER, PLAY, CAT, PHYSICS } from './data/config';

// Matter is authoritative. Top-down pool table: gravity 0, frictionAir damps motion.
// Collision boundary = inner line (board outline: rounded rect + 140° tapers + gauge lower arc) +
// the launcher circle (docs/30-systems/play-area-boundary). Launch one-way is a collision-filter
// exception on the LAUNCHER category only: a just-fired ball ignores the launcher circle until it
// has cleared it, then the circle becomes solid for it too.
export class PhysicsWorld {
  readonly engine: Engine;

  constructor() {
    this.engine = Engine.create();
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;
    this.addWalls();
  }

  private static segment(x1: number, y1: number, x2: number, y2: number, thick: number, opt: object): Body {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    return Bodies.rectangle(cx, cy, len + thick, thick, { ...opt, angle });
  }

  private addWalls() {
    const wall = {
      isStatic: true,
      restitution: PHYSICS.wallRestitution,
      friction: 0,
      label: 'wall',
      collisionFilter: { category: CAT.DEFAULT, mask: 0xffffffff },
    };
    // inner-line collision walls (closed polyline). THICK and offset OUTWARD so the inner face
    // stays on the visual outline while the wall is tunnel-proof for fast balls: Matter has no
    // continuous collision detection, so a wall thinner than a ball's per-step travel (~vMax) can
    // be passed through. A 48px wall safely contains the 30px/step max speed on every edge of the
    // shield (incl. the tapers), so strong launches/collisions can't escape the playground.
    const pts = innerOutline();
    const cx = PLAY.x + PLAY.w / 2;
    const cy = PLAY.y + PLAY.h / 2;
    const THICK = 48;
    const segs: Body[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      // outward normal (away from board centre) → offset the wall outward by half its thickness
      let nx = -(b.y - a.y);
      let ny = b.x - a.x;
      const nl = Math.hypot(nx, ny) || 1;
      nx /= nl;
      ny /= nl;
      if (((a.x + b.x) / 2 - cx) * nx + ((a.y + b.y) / 2 - cy) * ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      const ox = (nx * THICK) / 2;
      const oy = (ny * THICK) / 2;
      segs.push(PhysicsWorld.segment(a.x + ox, a.y + oy, b.x + ox, b.y + oy, THICK, wall));
    }
    Composite.add(this.engine.world, segs);

    // launcher circle (one-way: own category so a launched ball can pass out once)
    Composite.add(
      this.engine.world,
      Bodies.circle(LAUNCHER.x, LAUNCHER.y, LAUNCHER.r, {
        isStatic: true,
        restitution: PHYSICS.wallRestitution,
        friction: 0,
        label: 'launcher',
        collisionFilter: { category: CAT.LAUNCHER, mask: 0xffffffff },
      })
    );
  }

  // collidesLauncher=false → ball ignores the launcher circle (so a just-fired ball exits it).
  createPlanetBody(x: number, y: number, r: number, collidesLauncher: boolean): Body {
    const b = Bodies.circle(x, y, r, {
      density: PHYSICS.density,
      restitution: PHYSICS.restitution,
      frictionAir: PHYSICS.frictionAir,
      friction: PHYSICS.friction,
      label: 'planet',
      slop: 0.02,
      collisionFilter: {
        category: CAT.DEFAULT,
        mask: collidesLauncher ? 0xffffffff : (~CAT.LAUNCHER >>> 0),
      },
    });
    Composite.add(this.engine.world, b);
    return b;
  }

  // Re-enable launcher-circle collision once a launched ball has cleared it (no re-entry).
  blockAtLauncher(b: Body) {
    b.collisionFilter.mask = 0xffffffff;
  }

  remove(b: Body) {
    Composite.remove(this.engine.world, b);
  }

  update(dtMs: number) {
    Engine.update(this.engine, dtMs);
  }

  onCollision(cb: (a: Body, b: Body) => void) {
    Events.on(this.engine, 'collisionStart', (e) => {
      for (const p of e.pairs) cb(p.bodyA, p.bodyB);
    });
  }
}
