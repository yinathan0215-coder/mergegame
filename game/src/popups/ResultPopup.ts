import { Graphics, Rectangle, Text } from 'pixi.js';
import { DESIGN, RESULT, COLORS, FONT } from '../data/config';
import { Popup } from '../ui/Popup';

// Infinite session result (docs/50-art-ux/result-window): opens with the common popup transition, the
// score counts up from 1 to the final value over RESULT.countUpMs, shows NEW RECORD when the run beat
// the stored best, and the session's max combo at the bottom. Tapping anywhere returns to Title.
function centred(s: string, size: number, color: number, y: number): Text {
  const t = new Text(s, { fill: color, fontSize: size, fontFamily: FONT, fontWeight: '800' });
  t.anchor.set(0.5);
  t.x = DESIGN.w / 2;
  t.y = y;
  return t;
}

export class ResultPopup extends Popup {
  private scoreText: Text;
  private recordText: Text;
  private comboText: Text;
  private finalScore = 0;
  private countT0 = 0;

  constructor(onLeave: () => void) {
    super({ title: '결과', hasBg: true, onClose: onLeave });
    this.body.addChild(centred('SCORE', 20, COLORS.labelMuted, 250));
    this.scoreText = centred('0', 58, COLORS.white, 312);
    this.recordText = centred('NEW RECORD', 26, COLORS.gold, 372);
    this.recordText.visible = false;
    this.comboText = centred('', 22, COLORS.goldText, 600);
    this.body.addChild(this.scoreText, this.recordText, this.comboText);
    this.body.addChild(centred('탭하여 계속', 16, COLORS.labelMuted, 678));

    // tap anywhere on the panel → leave to Title (sits behind the texts; non-interactive texts let it through)
    const tap = new Graphics();
    tap.beginFill(0x000000, 0.001);
    tap.drawRect(this.panel.x, this.panel.y, this.panel.w, this.panel.h);
    tap.endFill();
    tap.eventMode = 'static';
    tap.hitArea = new Rectangle(this.panel.x, this.panel.y, this.panel.w, this.panel.h);
    tap.on('pointertap', () => this.close());
    this.body.addChildAt(tap, 0);
  }

  show(finalScore: number, maxCombo: number, isRecord: boolean) {
    this.finalScore = finalScore;
    this.recordText.visible = isRecord;
    this.comboText.text = `MAX COMBO  ${maxCombo}`;
    this.scoreText.text = '0';
    this.open();
    this.countT0 = performance.now();
  }

  protected onUpdate(now: number) {
    const k = Math.min(1, (now - this.countT0) / RESULT.countUpMs);
    const e = 1 - (1 - k) * (1 - k); // ease-out
    const shown = this.finalScore <= 1 ? this.finalScore : Math.round(1 + (this.finalScore - 1) * e);
    this.scoreText.text = shown.toLocaleString();
  }
}
