import { Container, Graphics, Sprite } from 'pixi.js';
import { ASSETS } from './assets';

interface GalaxyBackgroundOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  seed: number;
  count: number;
}

interface Twinkle {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  alpha: number;
  cross: boolean;
  color: number;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export class GalaxyBackground extends Container {
  private sparkles = new Graphics();
  private twinkles: Twinkle[];

  constructor(opts: GalaxyBackgroundOptions) {
    super();
    this.x = opts.x;
    this.y = opts.y;

    const bg = Sprite.from(ASSETS.board.background);
    bg.width = opts.width;
    bg.height = opts.height;
    this.addChild(bg);

    const random = rng(opts.seed);
    this.twinkles = Array.from({ length: opts.count }, (_, i) => ({
      x: random() * opts.width,
      y: random() * opts.height,
      r: 1.2 + random() * 2.4,
      phase: random() * Math.PI * 2,
      speed: 0.0012 + random() * 0.0018,
      alpha: 0.18 + random() * 0.3,
      cross: i % 7 === 0,
      color: random() > 0.72 ? 0xf4c84d : 0x8fa7e8,
    }));
    this.addChild(this.sparkles);
  }

  update(nowMs: number) {
    this.sparkles.clear();
    for (const t of this.twinkles) {
      const k = 0.5 + Math.sin(nowMs * t.speed + t.phase) * 0.5;
      const a = t.alpha * (0.22 + k * 0.78);
      if (t.cross) {
        const len = t.r * (2.1 + k * 1.2);
        this.sparkles.lineStyle(1.2, t.color, a);
        this.sparkles.moveTo(t.x - len, t.y);
        this.sparkles.lineTo(t.x + len, t.y);
        this.sparkles.moveTo(t.x, t.y - len);
        this.sparkles.lineTo(t.x, t.y + len);
      } else {
        this.sparkles.beginFill(t.color, a);
        this.sparkles.drawCircle(t.x, t.y, t.r * (0.65 + k * 0.35));
        this.sparkles.endFill();
      }
    }
  }
}
