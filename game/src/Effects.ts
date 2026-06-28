import { Container, Graphics, Text } from 'pixi.js';
import { JUICE, COLORS } from './data/config';

interface FX {
  g: Graphics;
  start: number;
  ms: number;
  color: number;
  alpha: number;
  ring?: { r0: number; scale: number }; // merge: radial ring
  fan?: { angs: number[]; len: number }; // hit: directional spray
}
interface Popup {
  t: Text;
  start: number;
  y0: number;
}

const POPUP_COLOR = parseInt(JUICE.scorePopup.color.slice(1), 16);
const MAX_FX = 28; // bound concurrent effects → bounded draw calls (frame-drop guard)
const MAX_POPUPS = 12;

// Render-only feedback juice (docs/50-art-ux/feedback-effects). Two distinct effects:
//  • merge → radial translucent RING (§2);  • scored hit → directional white SPRAY in the bounce
// direction (§6). Effect Graphics are pooled and capped so a collision storm can't drop frames.
export class Effects {
  private fx: FX[] = [];
  private popups: Popup[] = [];
  private pool: Graphics[] = []; // reusable effect Graphics (avoid per-collision alloc/GC)

  constructor(
    private worldLayer: Container,
    private hudLayer: Container,
    private scoreX: number,
    private scoreY: number
  ) {}

  private acquire(x: number, y: number): Graphics {
    const g = this.pool.pop() ?? new Graphics();
    g.clear();
    g.visible = true;
    g.x = x;
    g.y = y;
    this.worldLayer.addChild(g);
    return g;
  }

  private recycle(g: Graphics) {
    g.clear();
    g.visible = false;
    this.worldLayer.removeChild(g);
    if (this.pool.length < MAX_FX) this.pool.push(g);
    else g.destroy();
  }

  // Merge: diverging translucent ring at the merge location (tier colour).
  mergeBurst(x: number, y: number, color: number, r: number) {
    if (this.fx.length >= MAX_FX) return;
    const b = JUICE.burst;
    this.fx.push({ g: this.acquire(x, y), start: performance.now(), ms: b.ms, color, alpha: b.alpha, ring: { r0: r, scale: b.scale } });
  }

  // Scored hit: short white sparks spraying in the bounce direction (distinct from the merge ring).
  hitBurst(x: number, y: number, dx: number, dy: number) {
    if (this.fx.length >= MAX_FX) return;
    const h = JUICE.hitBurst;
    const base = Math.atan2(dy, dx);
    const spread = (h.spreadDeg * Math.PI) / 180;
    const angs: number[] = [];
    for (let i = 0; i < h.streaks; i++) angs.push(base + (Math.random() * 2 - 1) * spread);
    this.fx.push({ g: this.acquire(x, y), start: performance.now(), ms: h.ms, color: COLORS.aimLine, alpha: h.alpha, fan: { angs, len: h.len } });
  }

  // Floating "+N" near the Score, rising and fading (merges only).
  scorePopup(points: number) {
    if (this.popups.length >= MAX_POPUPS) return;
    const j = JUICE.scorePopup;
    const t = new Text(`+${points}`, {
      fill: POPUP_COLOR,
      fontSize: j.fontSize,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '800',
    });
    t.anchor.set(0.5);
    t.x = this.scoreX + (Math.random() * 2 - 1) * j.spreadX;
    t.y = this.scoreY + (Math.random() * 2 - 1) * j.spreadY;
    this.hudLayer.addChild(t);
    this.popups.push({ t, start: performance.now(), y0: t.y });
  }

  update(now: number) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      const k = (now - f.start) / f.ms;
      if (k >= 1) {
        this.recycle(f.g);
        this.fx.splice(i, 1);
        continue;
      }
      const a = f.alpha * (1 - k);
      f.g.clear();
      if (f.ring) {
        const rr = f.ring.r0 * (1 + (f.ring.scale - 1) * k);
        f.g.lineStyle(Math.max(2, f.ring.r0 * 0.22 * (1 - k)), f.color, a);
        f.g.drawCircle(0, 0, rr);
      } else if (f.fan) {
        const head = f.fan.len * k;
        const tail = Math.max(0, head - f.fan.len * 0.4);
        f.g.lineStyle(2.5, f.color, a);
        for (const ang of f.fan.angs) {
          const cx = Math.cos(ang);
          const cy = Math.sin(ang);
          f.g.moveTo(cx * tail, cy * tail);
          f.g.lineTo(cx * head, cy * head);
        }
      }
    }
    const pop = JUICE.scorePopup;
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      const k = (now - p.start) / pop.ms;
      if (k >= 1) {
        p.t.destroy();
        this.popups.splice(i, 1);
        continue;
      }
      p.t.y = p.y0 - pop.rise * k;
      p.t.alpha = 1 - k;
    }
  }
}
