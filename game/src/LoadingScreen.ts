// LoadingScreen — boot splash (docs/20-core-loop/screen-flow §Loading). Streams the player-facing
// title "GALAXY PINBALL" one letter at a time with a lively pop, over a navy background, and fills a
// slim progress bar across the minimum load window. Pure render (no simulation); drawn in DESIGN space
// inside fgRoot (contain), so it scales/centres with the 9:16 frame.
import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, DESIGN, FONT } from './data/config';

const TITLE_LINES = ['GALAXY', 'PINBALL'];
const FONT_SIZE = 50;
const LETTER_GAP = 3; // extra px between letters
const STREAM_MS = 1100; // total time to reveal every letter (left→right, line by line)
const POP_MS = 280; // each letter's pop-in duration
const TITLE_CY = DESIGN.h * 0.42; // vertical centre of the two-line logo
const LINE_GAP = 60; // distance between the two lines
const BAR_W = 190;
const BAR_H = 6;
const BAR_Y = DESIGN.h * 0.6;

// easeOutBack — overshoots past 1 then settles, giving each letter a bouncy "톡" pop.
function easeOutBack(k: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = k - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

interface Letter { t: Text; baseY: number; delay: number }

export class LoadingScreen {
  readonly container = new Container();
  private letters: Letter[] = [];
  private bar = new Graphics();
  private t0 = 0;
  private durMs: number;

  constructor(durMs: number) {
    this.durMs = durMs;

    const total = TITLE_LINES.join('').length;
    let revealed = 0;
    TITLE_LINES.forEach((word, li) => {
      const baseY = TITLE_CY + (li - (TITLE_LINES.length - 1) / 2) * LINE_GAP;
      // create the line's letters, measure, then centre the row horizontally
      const glyphs = [...word].map((ch) => {
        const t = new Text(ch, { fill: COLORS.white, fontSize: FONT_SIZE, fontFamily: FONT, fontWeight: '800' });
        t.anchor.set(0.5);
        return t;
      });
      const rowW = glyphs.reduce((s, g) => s + g.width + LETTER_GAP, -LETTER_GAP);
      let x = DESIGN.w / 2 - rowW / 2;
      glyphs.forEach((g) => {
        g.x = x + g.width / 2;
        g.y = baseY;
        g.alpha = 0;
        x += g.width + LETTER_GAP;
        this.letters.push({ t: g, baseY, delay: (revealed / total) * STREAM_MS });
        this.container.addChild(g);
        revealed++;
      });
    });

    this.container.addChild(this.bar);
    this.drawBar(0);
  }

  start(now: number) {
    this.t0 = now;
  }

  update(now: number) {
    const e = now - this.t0;
    for (const L of this.letters) {
      const k = Math.max(0, Math.min(1, (e - L.delay) / POP_MS));
      L.t.alpha = k;
      L.t.scale.set(k <= 0 ? 0.001 : easeOutBack(k));
      L.t.y = L.baseY + (1 - k) * 12; // slight upward settle as it pops in
    }
    this.drawBar(Math.max(0, Math.min(1, e / this.durMs)));
  }

  private drawBar(p: number) {
    const x = DESIGN.w / 2 - BAR_W / 2;
    this.bar.clear();
    this.bar.beginFill(COLORS.white, 0.16);
    this.bar.drawRoundedRect(x, BAR_Y, BAR_W, BAR_H, BAR_H / 2); // track
    this.bar.endFill();
    if (p > 0) {
      this.bar.beginFill(COLORS.gold); // gold fill — cheerful accent
      this.bar.drawRoundedRect(x, BAR_Y, BAR_W * p, BAR_H, BAR_H / 2);
      this.bar.endFill();
    }
  }
}
