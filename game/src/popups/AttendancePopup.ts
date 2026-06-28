import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { DESIGN } from '../data/config';
import { Popup } from '../ui/Popup';
import { attachButtonFeedback } from '../ui/button';
import { coinSprite } from '../ui/coin';
import { MetaStore, msUntilNextKstMidnight } from '../MetaStore';

// 출석 체크 / 일일 보너스 (docs/30-systems/attendance). 7-day grid (3×2 + a wide day-7), one claim per
// KST day. The claimable day is bright and tappable; claimed days show ✓; once claimed, the bottom
// switches from a 받기 button to a live "다음 보상 시간 HH:MM:SS" countdown to the next KST midnight.
function hhmmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

export class AttendancePopup extends Popup {
  private countdown?: Text;

  constructor(private store: MetaStore) {
    super({ title: '일일 보너스' });
    store.subscribe(() => { if (this.isOpen) this.refresh(); });
  }

  refresh() {
    this.countdown = undefined;
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));

    const sub = new Text('매일 더 많은 보상을 획득하세요!', { fill: 0xe7edff, fontSize: 18, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    sub.anchor.set(0.5);
    sub.x = DESIGN.w / 2; sub.y = this.panel.y + 88;
    this.body.addChild(sub);

    const cellW = 116, cellH = 110, gap = 14;
    const startX = this.panel.x + (this.panel.w - (3 * cellW + 2 * gap)) / 2;
    const y0 = this.panel.y + 124;
    for (let d = 1; d <= 6; d++) {
      const col = (d - 1) % 3, rowi = Math.floor((d - 1) / 3);
      this.body.addChild(this.cell(d, startX + col * (cellW + gap), y0 + rowi * (cellH + gap), cellW, cellH));
    }
    const y2 = y0 + 2 * (cellH + gap);
    this.body.addChild(this.cell(7, startX, y2, 3 * cellW + 2 * gap, 96));

    this.buildBottom(y2 + 96 + 22);
  }

  private cell(day: number, x: number, y: number, w: number, h: number): Container {
    const next = this.store.attendanceDay;
    const canClaim = this.store.attendanceCanClaim();
    const reward = this.store.attendanceRewards()[day - 1];
    const claimed = day < next;
    const claimable = day === next && canClaim;
    const future = day > next || (day === next && !canClaim);

    const c = new Container();
    c.x = x; c.y = y;
    const bg = new Graphics();
    bg.beginFill(claimed ? 0x2f4a86 : claimable ? 0x3f93e0 : future ? 0x222c49 : 0x2b3556);
    bg.drawRoundedRect(0, 0, w, h, 12);
    bg.endFill();
    bg.lineStyle(2, claimable ? 0x9fd0ff : 0x8aa0df, claimable ? 0.9 : 0.35);
    bg.drawRoundedRect(0, 0, w, h, 12);
    c.addChild(bg);

    const label = new Text(`${day}일차`, { fill: 0xffffff, fontSize: 16, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    label.anchor.set(0.5, 0);
    label.x = w / 2; label.y = 8;
    c.addChild(label);

    if (claimed) {
      const ok = new Text('✓', { fill: 0x6fe39a, fontSize: 44, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      ok.anchor.set(0.5);
      ok.x = w / 2; ok.y = h / 2 + 12;
      c.addChild(ok);
    } else {
      const cs = coinSprite(40);
      cs.x = w / 2; cs.y = h / 2 + 4;
      c.addChild(cs);
      const amt = new Text(String(reward), { fill: 0xffffff, fontSize: 20, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      amt.anchor.set(0.5);
      amt.x = w / 2; amt.y = h - 22;
      c.addChild(amt);
    }
    if (claimable) {
      c.hitArea = new Rectangle(0, 0, w, h);
      attachButtonFeedback(c, () => this.store.claimAttendance());
    }
    return c;
  }

  private buildBottom(y: number) {
    if (this.store.attendanceCanClaim()) {
      const c = new Container();
      c.x = DESIGN.w / 2; c.y = y + 6;
      const w = 180, h = 50;
      const g = new Graphics();
      g.beginFill(0x49a8e6);
      g.drawRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.endFill();
      c.addChild(g);
      const t = new Text('받기', { fill: 0xffffff, fontSize: 22, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      t.anchor.set(0.5);
      c.addChild(t);
      c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
      attachButtonFeedback(c, () => this.store.claimAttendance());
      this.body.addChild(c);
    } else {
      this.countdown = new Text('', { fill: 0xdfe6f5, fontSize: 20, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      this.countdown.anchor.set(0.5);
      this.countdown.x = DESIGN.w / 2; this.countdown.y = y + 6;
      this.body.addChild(this.countdown);
    }
  }

  protected onUpdate() {
    if (this.countdown) this.countdown.text = `다음 보상 시간 ${hhmmss(msUntilNextKstMidnight(Date.now()))}`;
  }
}
