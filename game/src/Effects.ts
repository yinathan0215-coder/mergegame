import { Container, Graphics, Text } from 'pixi.js';
import { JUICE, COLORS, DESIGN, FONT } from './data/config';

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
  t: Container; // a Text (merge +N) or a Container of two Texts (combo bonus)
  start: number;
  y0: number;
  ms: number;
  rise: number;
}

const POPUP_COLOR = parseInt(JUICE.scorePopup.color.slice(1), 16);
const BONUS_COLOR = parseInt(JUICE.combo.bonusColor.slice(1), 16);
const MAX_FX = 28; // bound concurrent effects → bounded draw calls (frame-drop guard)
const MAX_POPUPS = 12;

// Render-only feedback juice (docs/50-art-ux/feedback-effects). Two distinct effects:
//  • merge → radial translucent RING (§2);  • scored hit → directional white SPRAY in the bounce
// direction (§6). Effect Graphics are pooled and capped so a collision storm can't drop frames.
export class Effects {
  private fx: FX[] = [];
  private popups: Popup[] = [];
  private pool: Graphics[] = []; // reusable effect Graphics (avoid per-collision alloc/GC)

  constructor(private worldLayer: Container) {}

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

  // Floating "+N" at the merge location (board/world space), rising and fading (merges only).
  scorePopup(points: number, x: number, y: number) {
    if (this.popups.length >= MAX_POPUPS) return;
    const t = new Text(`+${points}`, {
      fill: POPUP_COLOR,
      fontSize: JUICE.scorePopup.fontSize,
      fontFamily: FONT,
      fontWeight: '800',
    });
    t.anchor.set(0.5);
    t.x = x;
    t.y = y;
    this.worldLayer.addChild(t);
    this.popups.push({ t, start: performance.now(), y0: y, ms: JUICE.scorePopup.ms, rise: JUICE.scorePopup.rise });
  }

  // Combo milestone bonus: two lines at SCREEN CENTRE — "combo M" (smaller) over "+N" (bigger) —
  // longer hold than the merge popup (docs/50-art-ux/feedback-effects §8). Rare → skips the popup cap.
  comboBonus(points: number, combo: number) {
    const c = JUICE.combo;
    const mk = (s: string, size: number, anchorY: number, y: number): Text => {
      const t = new Text(s, { fill: BONUS_COLOR, fontSize: size, fontFamily: FONT, fontWeight: '800' });
      t.anchor.set(0.5, anchorY);
      t.y = y;
      return t;
    };
    const g = new Container();
    g.addChild(mk(`combo ${combo}`, c.bonusLabelSize, 1, -2)); // smaller label, above
    g.addChild(mk(`+${points}`, c.bonusFontSize, 0, 2)); // bigger amount, below
    g.x = DESIGN.w / 2;
    g.y = DESIGN.h / 2;
    this.worldLayer.addChild(g);
    this.popups.push({ t: g, start: performance.now(), y0: g.y, ms: c.bonusMs, rise: c.bonusRise });
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
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      const k = (now - p.start) / p.ms;
      if (k >= 1) {
        p.t.destroy({ children: true });
        this.popups.splice(i, 1);
        continue;
      }
      p.t.y = p.y0 - p.rise * k;
      p.t.alpha = 1 - k;
    }
  }
}
