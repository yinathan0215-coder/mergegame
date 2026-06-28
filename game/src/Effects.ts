import { Container, Graphics, Text } from 'pixi.js';
import { JUICE } from './data/config';

interface Burst {
  g: Graphics;
  start: number;
  r0: number;
  color: number;
}
interface Popup {
  t: Text;
  start: number;
  y0: number;
}

const POPUP_COLOR = parseInt(JUICE.scorePopup.color.slice(1), 16);

// Render-only feedback juice (docs/50-art-ux/feedback-effects): an expanding translucent merge
// burst ring (world/effect layer) + a floating "+N" score popup (HUD layer). One-way: reads
// nothing back into the simulation.
export class Effects {
  private bursts: Burst[] = [];
  private popups: Popup[] = [];

  constructor(
    private worldLayer: Container,
    private hudLayer: Container,
    private scoreX: number,
    private scoreY: number
  ) {}

  // Diverging translucent ring at a merge location (planet/world space).
  mergeBurst(x: number, y: number, color: number, r: number) {
    const g = new Graphics();
    g.x = x;
    g.y = y;
    this.worldLayer.addChild(g);
    this.bursts.push({ g, start: performance.now(), r0: r, color });
  }

  // Floating "+N" near the Score, at a random offset, rising and fading (merges only).
  scorePopup(points: number) {
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
    const burst = JUICE.burst;
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      const k = (now - b.start) / burst.ms;
      if (k >= 1) {
        b.g.destroy();
        this.bursts.splice(i, 1);
        continue;
      }
      const rr = b.r0 * (1 + (burst.scale - 1) * k);
      b.g.clear();
      b.g.lineStyle(Math.max(2, b.r0 * 0.22 * (1 - k)), b.color, burst.alpha * (1 - k));
      b.g.drawCircle(0, 0, rr);
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
