import { Container, Graphics, LINE_CAP, Rectangle, Text } from 'pixi.js';
import { DESIGN, POPUP } from '../data/config';
import { attachButtonFeedback } from './button';

// Common popup shell for every Title-lobby meta window (docs/50-art-ux/popup-system). Three elements:
//   • BG  — rounded panel + purple title bar (optional: hasBg=false → just dim + content, e.g. the wheel)
//   • title text
//   • X button (top-right) → close
// Opens with the SAME entrance as the merge/unlock modal (docs/30-systems/tier-unlock): dim fades in,
// content scales startScale→1 and fades in over enterMs (ease-out). The dim swallows pointer input so
// the board/lobby behind it is inert; closing is via the X only (no tap-outside dismiss).
//
// The meta popups live in GameScene's `fgRoot` (contain) so the full panel AND its X button stay inside
// the 9:16 area (popupRoot is cover-scaled, which would push a full-width panel's edges/X off-screen).
// The dim is drawn far past the DESIGN rect so that, under the contain transform, it still bleeds over
// the letterbox margins and covers the whole viewport — no separate DOM dim needed.
//
// Subclasses add their content to `this.body` (a Container inside the scaling content, laid out in
// DESIGN coordinates) and override `refresh()` to re-read MetaStore when the window opens.
export interface PopupOpts {
  title: string;
  hasBg?: boolean; // default true
  onClose?: () => void;
}

const PANEL = { x: 20, y: 100, w: 410, h: 632 }; // shared panel rect (DESIGN space)

export class Popup {
  readonly container = new Container();
  protected body = new Container(); // subclass content, DESIGN coords
  protected readonly panel = PANEL;
  private dim = new Graphics();
  private content = new Container();
  private t0 = 0;
  private entering = false;

  constructor(opts: PopupOpts) {
    const hasBg = opts.hasBg !== false;
    this.container.visible = false;

    // oversized rect → bleeds over the letterbox under the contain transform (covers full viewport)
    const M = 3000;
    this.dim.beginFill(0x000000, 1);
    this.dim.drawRect(-M, -M, DESIGN.w + 2 * M, DESIGN.h + 2 * M);
    this.dim.endFill();
    this.dim.eventMode = 'static';
    this.dim.on('pointerdown', (e) => e.stopPropagation()); // swallow board/lobby input while up
    this.container.addChild(this.dim);

    // content scales around the screen centre (pivot = centre), like UnlockModal
    this.content.pivot.set(DESIGN.w / 2, DESIGN.h / 2);
    this.content.position.set(DESIGN.w / 2, DESIGN.h / 2);
    this.container.addChild(this.content);

    if (hasBg) this.drawPanel(opts.title);
    else this.drawTitleOnly(opts.title);

    this.content.addChild(this.body);
    this.makeCloseButton(hasBg, opts.onClose);
  }

  private drawPanel(title: string) {
    const p = PANEL;
    const g = new Graphics();
    g.beginFill(0x1b2748, 0.98); // panel body (dark slate-blue, matches lobby tone)
    g.drawRoundedRect(p.x, p.y, p.w, p.h, 22);
    g.endFill();
    g.lineStyle(3, 0x8aa0df, 0.5);
    g.drawRoundedRect(p.x, p.y, p.w, p.h, 22);
    this.content.addChild(g);

    // purple title bar pill overlapping the panel top edge
    const barW = 240;
    const barH = 54;
    const bx = DESIGN.w / 2 - barW / 2;
    const by = p.y - 18;
    const bar = new Graphics();
    bar.beginFill(0x7a2fb0);
    bar.drawRoundedRect(bx, by + 4, barW, barH, 16);
    bar.endFill();
    bar.beginFill(0xb24ce6);
    bar.drawRoundedRect(bx, by, barW, barH, 16);
    bar.endFill();
    bar.lineStyle(2, 0xffffff, 0.35);
    bar.drawRoundedRect(bx, by, barW, barH, 16);
    this.content.addChild(bar);
    const t = new Text(title, { fill: 0xffffff, fontSize: 26, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    t.anchor.set(0.5);
    t.x = DESIGN.w / 2;
    t.y = by + barH / 2;
    this.content.addChild(t);
  }

  private drawTitleOnly(title: string) {
    const t = new Text(title, {
      fill: 0xffffff, fontSize: 30, fontFamily: 'Arial, sans-serif', fontWeight: '800',
      stroke: 0x0a0a14, strokeThickness: 4,
    });
    t.anchor.set(0.5);
    t.x = DESIGN.w / 2;
    t.y = PANEL.y + 40;
    this.content.addChild(t);
  }

  private makeCloseButton(hasBg: boolean, onClose?: () => void) {
    const cx = hasBg ? PANEL.x + PANEL.w - 6 : DESIGN.w - 34;
    const cy = hasBg ? PANEL.y - 30 : PANEL.y + 6;
    const c = new Container();
    c.x = cx;
    c.y = cy;
    c.hitArea = new Rectangle(-24, -24, 48, 48);
    c.addChild(this.closeGlyph());
    attachButtonFeedback(c, () => this.close());
    this.content.addChild(c);
    this.onCloseCb = onClose;
  }

  // Designed close ✕ (reference-style): a chunky bevelled grey cross with a drop shadow — drawn once
  // here so every popup shares the same close button (docs/50-art-ux/popup-system 아이콘 규칙).
  private closeGlyph(): Graphics {
    const g = new Graphics();
    const s = 12; // half-length of each diagonal stroke
    const stroke = (width: number, color: number, dy = 0) => {
      g.lineStyle({ width, color, cap: LINE_CAP.ROUND });
      g.moveTo(-s, -s + dy); g.lineTo(s, s + dy);
      g.moveTo(s, -s + dy); g.lineTo(-s, s + dy);
    };
    stroke(14, 0x0e1428, 3); // drop shadow
    stroke(14, 0x4a5573); // dark slate outline
    stroke(7, 0xe4eaf6); // light grey core
    return g;
  }
  private onCloseCb?: () => void;

  // Subclasses override to re-read MetaStore each time the window opens.
  refresh() {}

  open() {
    this.refresh();
    this.container.visible = true;
    this.t0 = performance.now();
    this.entering = true;
  }

  close() {
    this.container.visible = false;
    this.entering = false;
    this.onCloseCb?.();
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  // Drive the entrance transition (+ subclass per-frame work via onUpdate).
  update(now: number) {
    if (!this.container.visible) return;
    if (this.entering) {
      const k = Math.min(1, (now - this.t0) / POPUP.enterMs);
      const e = 1 - (1 - k) * (1 - k); // ease-out
      this.dim.alpha = POPUP.dimAlpha * e;
      this.content.alpha = e;
      this.content.scale.set(POPUP.startScale + (1 - POPUP.startScale) * e);
      if (k >= 1) this.entering = false;
    }
    this.onUpdate(now);
  }

  protected onUpdate(_now: number) {}
}
