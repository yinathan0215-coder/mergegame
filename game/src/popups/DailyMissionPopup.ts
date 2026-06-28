import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { MISSIONS, COLORS } from '../data/config';
import { Popup } from '../ui/Popup';
import { attachButtonFeedback, button3D, BUTTON3D_DY } from '../ui/button';
import { coinSprite } from '../ui/coin';
import type { MetaStore } from '../MetaStore';

// 일일 미션 (docs/30-systems/daily-missions). Top: a cumulative-reward bar whose position = number of
// completed missions, with 받기 claim buttons at the 2/5/8 milestones. Below: the 8 mission rows (7
// achievable + the 광고 보기 dummy). Per-mission rewards are auto-granted by MetaStore; this view just
// reflects state and lets the player claim milestones. Rebuilt on open and on any MetaStore change.
const TYPE_GLYPH: Record<string, string> = { comboPeak: '🔥', mergeCount: '🪐', sunCount: '☀️', dummy: '🎬' };
const MILESTONES = Object.keys(MISSIONS.milestones).map(Number); // [2,5,8]

export class DailyMissionPopup extends Popup {
  constructor(private store: MetaStore) {
    super({ title: '일일 미션' });
    store.subscribe(() => { if (this.isOpen) this.refresh(); });
  }

  refresh() {
    this.body.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.buildMilestoneBar();
    this.buildRows();
  }

  private buildMilestoneBar() {
    const p = this.panel;
    const tx0 = p.x + 34;
    const tx1 = p.x + p.w - 34;
    const ny = p.y + 86;
    const done = this.store.completedCount();
    const nodeX = (i: number) => tx0 + (i / 8) * (tx1 - tx0);

    // track (grey base, green up to `done`)
    const track = new Graphics();
    track.lineStyle(6, 0x39456b);
    track.moveTo(tx0, ny); track.lineTo(tx1, ny);
    track.lineStyle(6, 0x49d06a);
    track.moveTo(tx0, ny); track.lineTo(nodeX(Math.min(done, 8)), ny);
    this.body.addChild(track);

    const milestoneReward = MISSIONS.milestones as Record<string, number>;
    for (let i = 0; i <= 8; i++) {
      const x = nodeX(i);
      const lit = i <= done;
      const isMs = MILESTONES.includes(i);
      const node = new Graphics();
      node.beginFill(lit ? 0x49d06a : 0x2b3556);
      node.drawCircle(x, ny, isMs ? 16 : 11);
      node.endFill();
      node.lineStyle(2, 0xffffff, 0.5);
      node.drawCircle(x, ny, isMs ? 16 : 11);
      this.body.addChild(node);
      if (isMs) {
        const cs = coinSprite(26);
        cs.x = x; cs.y = ny;
        this.body.addChild(cs);
        const amt = new Text(String(milestoneReward[String(i)]), { fill: 0xffffff, fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
        amt.anchor.set(0.5);
        amt.x = x; amt.y = ny + 26;
        this.body.addChild(amt);
        this.body.addChild(this.milestoneClaim(x, ny + 48, i));
      } else {
        const num = new Text(String(i), { fill: lit ? 0x103018 : 0x9fb0e0, fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
        num.anchor.set(0.5);
        num.x = x; num.y = ny;
        this.body.addChild(num);
      }
    }
  }

  // 받기 button under a milestone node — disabled until reached, ✓ once claimed.
  private milestoneClaim(x: number, y: number, threshold: number): Container {
    const done = this.store.completedCount();
    const claimed = this.store.milestoneRows().find((m) => m.threshold === threshold)?.claimed ?? false;
    const c = new Container();
    c.x = x; c.y = y;
    if (claimed) {
      const ok = new Text('✓', { fill: 0x49d06a, fontSize: 22, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      ok.anchor.set(0.5);
      c.addChild(ok);
      return c;
    }
    const reachable = done >= threshold;
    const w = 52, h = 28;
    c.addChild(button3D(w, h, COLORS.btnBlue, 8, !reachable));
    const t = new Text('받기', { fill: reachable ? 0xffffff : 0x6c7aa0, fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    t.anchor.set(0.5); t.y = BUTTON3D_DY;
    c.addChild(t);
    if (reachable) {
      c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
      attachButtonFeedback(c, () => this.store.claimMilestone(threshold));
    }
    return c;
  }

  private buildRows() {
    const p = this.panel;
    const rows = this.store.missionRows();
    const top = p.y + 150;
    const rowH = 56;
    const left = p.x + 18;
    rows.forEach((m, i) => {
      const y = top + i * rowH;
      // icon tile
      const tile = new Graphics();
      tile.beginFill(0x24407e);
      tile.drawRoundedRect(left, y, 44, 44, 10);
      tile.endFill();
      tile.lineStyle(2, 0x8aa0df, 0.4);
      tile.drawRoundedRect(left, y, 44, 44, 10);
      this.body.addChild(tile);
      const glyph = new Text(TYPE_GLYPH[m.type] ?? '•', { fontSize: 24, fontFamily: 'Arial, sans-serif' });
      glyph.anchor.set(0.5);
      glyph.x = left + 22; glyph.y = y + 22;
      this.body.addChild(glyph);

      // name
      const name = new Text(m.name, { fill: 0xe7edff, fontSize: 16, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      name.x = left + 56; name.y = y + 2;
      this.body.addChild(name);

      // progress gauge
      const gx = left + 56, gy = y + 26, gw = 230, gh = 18;
      const gauge = new Graphics();
      gauge.beginFill(0x10182e);
      gauge.drawRoundedRect(gx, gy, gw, gh, 9);
      gauge.endFill();
      const frac = Math.max(0, Math.min(1, m.progress / m.target));
      if (frac > 0) {
        gauge.beginFill(0xf0902a);
        gauge.drawRoundedRect(gx, gy, Math.max(gh, gw * frac), gh, 9);
        gauge.endFill();
      }
      this.body.addChild(gauge);
      const pt = new Text(`${m.progress} / ${m.target}`, { fill: 0xffffff, fontSize: 12, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      pt.anchor.set(0.5);
      pt.x = gx + gw / 2; pt.y = gy + gh / 2;
      this.body.addChild(pt);

      // per-mission reward button (보상): grey locked → green claimable → ✓ claimed
      this.body.addChild(this.rewardButton(p.x + p.w - 48, y + 22, m));
    });
  }

  // Right-side per-mission reward button (docs/30-systems/daily-missions "미션 행 보상 버튼"):
  //   미달성 → grey [coin][50] / "보상";  달성 → green clickable;  수령 완료 → ✓.
  private rewardButton(cx: number, cy: number, m: { id: string; done: boolean; claimed: boolean }): Container {
    const c = new Container();
    c.x = cx; c.y = cy;
    if (m.claimed) {
      const ok = new Text('✓', { fill: 0x49d06a, fontSize: 30, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
      ok.anchor.set(0.5);
      c.addChild(ok);
      return c;
    }
    const claimable = m.done; // done & unclaimed
    const w = 78, h = 50;
    c.addChild(button3D(w, h, 0x2faa48, 10, !claimable)); // 초록(수령 가능) / 회색 비활성(미달성)
    const dy = BUTTON3D_DY;
    // 위 줄: [코인 아이콘][보상 숫자]
    const coin = coinSprite(18);
    const num = new Text(String(MISSIONS.perMission), { fill: claimable ? 0xffffff : 0xaab4cc, fontSize: 15, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    num.anchor.set(0, 0.5);
    const gap = 2;
    const groupW = 18 + gap + num.width;
    coin.x = -groupW / 2 + 9; coin.y = dy - 10; coin.alpha = claimable ? 1 : 0.6;
    num.x = coin.x + 9 + gap; num.y = dy - 10;
    c.addChild(coin, num);
    // 아래 줄: 보상
    const label = new Text('보상', { fill: claimable ? 0xffffff : 0xaab4cc, fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    label.anchor.set(0.5);
    label.y = dy + 13;
    c.addChild(label);
    if (claimable) {
      c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
      attachButtonFeedback(c, () => this.store.claimMission(m.id));
    }
    return c;
  }
}
