import { Engine, Bodies, Composite, Events, type Body } from 'matter-js';
import { innerOutline, LAUNCHER, CAT, PHYSICS } from './data/config';

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
    // inner-line collision walls (closed polyline)
    const pts = innerOutline();
    const segs: Body[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      segs.push(PhysicsWorld.segment(a.x, a.y, b.x, b.y, 16, wall));
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
