import { Container, Graphics, Sprite } from 'pixi.js';
import { ASSETS, ASSET_SIZES } from './assets';

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
  private bg = Sprite.from(ASSETS.board.background);
  private sparkles = new Graphics();
  private twinkles: Twinkle[] = [];
  private seed: number;
  private count: number;

  constructor(opts: GalaxyBackgroundOptions) {
    super();
    this.x = opts.x;
    this.y = opts.y;
    this.seed = opts.seed;
    this.count = opts.count;
    this.addChild(this.bg);
    this.addChild(this.sparkles);
    this.resize(opts.width, opts.height);
  }

  resize(width: number, height: number) {
    const source = ASSET_SIZES.boardBackground;
    const bgScale = Math.max(width / source.w, height / source.h);
    this.bg.width = source.w * bgScale;
    this.bg.height = source.h * bgScale;
    this.bg.x = (width - this.bg.width) / 2;
    this.bg.y = (height - this.bg.height) / 2;

    const random = rng(this.seed);
    this.twinkles = Array.from({ length: this.count }, (_, i) => ({
      x: random() * width,
      y: random() * height,
      r: 1.2 + random() * 2.4,
      phase: random() * Math.PI * 2,
      speed: 0.0012 + random() * 0.0018,
      alpha: 0.18 + random() * 0.3,
      cross: i % 7 === 0,
      color: random() > 0.72 ? 0xf4c84d : 0x8fa7e8,
    }));
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
