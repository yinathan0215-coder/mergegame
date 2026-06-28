import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import { HUD, COLORS, JUICE, FONT } from './data/config';
import { ASSETS, ASSET_SIZES } from './assets';
import { attachButtonFeedback, redDot } from './ui/button';

function txt(s: string, size: number, color: number, weight: string): Text {
  return new Text(s, { fill: color, fontSize: size, fontFamily: FONT, fontWeight: weight as any });
}

// One in-game dropdown shortcut: an icon that runs the same action as a Title-lobby button
// (docs/50-art-ux/layout §2-c). `icon` is an ASSETS.ui.* path; `onTap` opens the matching popup.
export interface HudMenuItem {
  icon: string;
  onTap: () => void;
  badge?: () => boolean; // 받을 보상 있으면 항목 우상단 레드닷(일일미션·출석, docs/50-art-ux/layout §2-c)
}

// Top HUD (docs/50-art-ux/layout): left = back button (→ Title) sitting BELOW the coin pill (the coin
// balance is a GameScene-owned pill shown top-left in both Title and game); center = Score + 👑best;
// right = menu button. No ranking display. Queue row sits below the bar.
export class Hud {
  private scoreText: Text;
  private bestText: Text;
  private stageText: Text; // Stage 모드 시 점수 대신 표시되는 'STAGE N'
  private best = 0;
  private target = 0; // latest actual score
  private shown = 0; // odometer display value, rolls toward target
  private lastRoll = 0; // 직전 odometer 갱신 시각 — 롤 속도를 프레임레이트와 무관하게(docs/90-methodology/game-loop)
  private crown!: Sprite;
  private scrim = new Graphics(); // full-screen tap-catcher: an outside tap closes the dropdown
  private dropdown = new Container(); // the icon-only shortcut list under the ≡ button
  private menuItems: HudMenuItem[];
  private menuOpen = false;
  private menuDot = redDot(); // ≡ 버튼 집계 레드닷(드롭다운 항목 중 받을 보상 있으면)
  private itemDots: { dot: Graphics; badge: () => boolean }[] = [];

  constructor(layer: Container, onBack: () => void, menuItems: HudMenuItem[] = []) {
    this.menuItems = menuItems;
    const cx = HUD.w / 2;

    // ── center (HUD 수평 중앙 정렬): 👑 best (작게, 위) + Score (크게, 아래) ──
    this.crown = Sprite.from(ASSETS.ui.crown);
    this.crown.anchor.set(0.5);
    this.crown.scale.set(28 / ASSET_SIZES.uiIcon.w);
    layer.addChild(this.crown);
    this.bestText = txt('0', 17, COLORS.textGrey, '700');
    this.bestText.anchor.set(0, 0.5);
    layer.addChild(this.bestText);
    this.centerBest(); // crown + best 를 cx 기준 수평 중앙 정렬
    this.scoreText = txt('0', 32, COLORS.hudText, '800');
    this.scoreText.anchor.set(0.5, 0.5);
    this.scoreText.x = cx;
    this.scoreText.y = 50;
    layer.addChild(this.scoreText);
    // Stage 모드: 점수/콤보를 집계·표시하지 않으므로 중앙 상단에 'STAGE N'을 대신 표시한다(docs/50-art-ux/layout).
    this.stageText = txt('', 30, COLORS.hudText, '800');
    this.stageText.anchor.set(0.5, 0.5);
    this.stageText.x = cx;
    this.stageText.y = 40;
    this.stageText.visible = false;
    layer.addChild(this.stageText);

    // ── corners: back button (left, BELOW the coin pill at y18–50) + ≡ menu button (right) ──
    this.button(layer, 12, 54, 'exit', onBack);
    this.buildMenu(layer); // dropdown scrim + icon list (above the board, below the items + ≡ button)
    const menuBtn = this.button(layer, HUD.w - 44, 12, 'menu', () => this.toggleMenu()); // ≡ toggles the dropdown (added last → on top)
    this.menuDot.x = 14; // ≡ 아이콘 우상단 집계 레드닷(docs/50-art-ux/layout §2-c)
    this.menuDot.y = -14;
    this.menuDot.visible = false;
    menuBtn.addChild(this.menuDot);
    this.refreshMenuBadges();
  }

  // Icon-only corner button (docs/50-art-ux/button-system: HUD corner buttons have NO background box —
  // the icon itself is the tap target). A 36×34 hitArea + the shared press feedback (feedback-effects §5);
  // the tap is swallowed so it never reaches the launcher (which would read it as an aim/fire on the board).
  private button(layer: Container, x: number, y: number, kind: 'exit' | 'menu', onTap?: () => void): Container {
    const c = new Container();
    c.x = x + 16;
    c.y = y + 15;
    c.hitArea = new Rectangle(-18, -17, 36, 34);
    const icon = Sprite.from(kind === 'exit' ? ASSETS.ui.exit : ASSETS.ui.menu);
    icon.anchor.set(0.5);
    icon.scale.set(42 / ASSET_SIZES.uiIcon.w);
    c.addChild(icon);
    attachButtonFeedback(c, onTap ?? (() => {}));
    layer.addChild(c);
    return c;
  }

  // ≡ dropdown (docs/50-art-ux/layout §2-c): an icon-only shortcut list that hangs DIRECTLY below the ≡
  // button. The 4 icons share ONE common dimmed box (not per-item tiles). The scrim sits above the board
  // but below the panel + ≡ button, so an outside tap closes the list (and is swallowed, keeping the board
  // inert) while the items/button stay tappable. Inert until opened.
  private buildMenu(layer: Container) {
    this.scrim.beginFill(0x000000, 0.001); // near-invisible; the filled geometry makes it hit-testable
    this.scrim.drawRect(-2000, -2000, 5000, 5000); // covers the whole viewport incl. letterbox (contain transform)
    this.scrim.endFill();
    this.scrim.eventMode = 'none'; // dormant while closed → board input passes through
    this.scrim.on('pointerdown', (e) => { e.stopPropagation(); this.closeMenu(); });
    layer.addChild(this.scrim);

    const slot = 44; // per-item vertical slot
    const gap = 4;
    const pad = 6; // panel inner padding around the icon column
    const n = this.menuItems.length;
    const cx = HUD.w - 28; // centred under the ≡ button
    const topY = 48; // directly below the ≡ button (its hitArea bottom ≈ 44)
    const panelW = slot + pad * 2;
    const panelH = n * slot + (n - 1) * gap + pad * 2;

    // ONE shared dimmed box wrapping the whole list (docs/50-art-ux/layout §2-c · button-system)
    const panel = new Graphics();
    panel.beginFill(COLORS.black, 0.46);
    panel.drawRoundedRect(cx - panelW / 2, topY, panelW, panelH, 12);
    panel.endFill();
    panel.lineStyle(2, COLORS.white, 0.18);
    panel.drawRoundedRect(cx - panelW / 2, topY, panelW, panelH, 12);
    panel.eventMode = 'static';
    panel.on('pointerdown', (e) => e.stopPropagation()); // taps between icons don't fall through to close
    this.dropdown.addChild(panel);

    // icon-only items over the shared panel
    this.menuItems.forEach((item, i) => {
      const c = new Container();
      c.x = cx;
      c.y = topY + pad + slot / 2 + i * (slot + gap);
      c.hitArea = new Rectangle(-slot / 2, -slot / 2, slot, slot);
      const icon = Sprite.from(item.icon);
      icon.anchor.set(0.5);
      icon.scale.set(34 / ASSET_SIZES.uiIcon.w);
      c.addChild(icon);
      if (item.badge) { // 받을 보상 레드닷(일일미션·출석, docs/50-art-ux/layout §2-c)
        const dot = redDot();
        dot.x = 14;
        dot.y = -14;
        c.addChild(dot);
        this.itemDots.push({ dot, badge: item.badge });
      }
      attachButtonFeedback(c, () => { item.onTap(); this.closeMenu(); });
      this.dropdown.addChild(c);
    });
    this.dropdown.visible = false;
    layer.addChild(this.dropdown);
  }

  get menuIsOpen(): boolean { return this.menuOpen; }
  get menuItemCount(): number { return this.menuItems.length; }

  // Re-evaluate each dropdown item's red-dot + the ≡ aggregate dot (docs/50-art-ux/layout §2-c).
  // Called on open (item dots) and by GameScene on meta change / scene entry (≡ dot stays live).
  refreshMenuBadges() {
    let any = false;
    for (const it of this.itemDots) {
      const on = it.badge();
      it.dot.visible = on;
      any = any || on;
    }
    this.menuDot.visible = any;
  }

  toggleMenu() { if (this.menuOpen) this.closeMenu(); else this.openMenu(); }

  private openMenu() {
    this.menuOpen = true;
    this.refreshMenuBadges(); // 펼치기 직전 항목 레드닷 최신화
    this.dropdown.visible = true;
    this.scrim.eventMode = 'static'; // now catches outside taps (and blocks board input) to close
  }

  closeMenu() {
    this.menuOpen = false;
    this.dropdown.visible = false;
    this.scrim.eventMode = 'none';
  }

  // Test hook (Playwright): run item i's action then close — the same as a real tap on its icon.
  tapMenuItem(i: number) {
    const it = this.menuItems[i];
    if (it) { it.onTap(); this.closeMenu(); }
  }

  // crown + best 를 HUD 수평 중앙에 정렬 (best 폭이 바뀌면 재호출).
  private centerBest() {
    const cx = HUD.w / 2;
    const crownW = 28;
    const gap = 6;
    const left = cx - (crownW + gap + this.bestText.width) / 2;
    this.crown.x = left + crownW / 2;
    this.crown.y = 24;
    this.bestText.x = left + crownW + gap;
    this.bestText.y = 24;
  }

  // Seed the 👑 best from the persisted record (docs/50-art-ux/title-screen §2-2) at session start;
  // setScore then raises it live as the current score climbs past it.
  setBest(best: number) {
    this.best = best;
    this.bestText.text = this.best.toLocaleString();
    this.centerBest();
  }

  // Stage 모드 → 점수·최고 점수를 숨기고 'STAGE N' 표시; Infinite → 점수/최고 점수 표시 (docs/50-art-ux/layout).
  setStageMode(stageNo: number | null) {
    const stage = stageNo !== null;
    this.crown.visible = !stage;
    this.bestText.visible = !stage;
    this.scoreText.visible = !stage;
    this.stageText.visible = stage;
    if (stage) this.stageText.text = `STAGE ${stageNo}`;
  }

  setScore(score: number) {
    this.target = score;
    if (score > this.best) {
      this.best = score;
      this.bestText.text = this.best.toLocaleString();
      this.centerBest();
    }
  }

  // Odometer: roll the shown value toward target in integer steps (docs/50-art-ux/feedback-effects).
  // Big jumps roll fast, small ones tick by 1. Called every tick.
  update(now: number) {
    const frames = this.lastRoll ? Math.min(4, (now - this.lastRoll) / (1000 / 60)) : 1; // 60fps 프레임 수(상한 4)
    this.lastRoll = now;
    if (this.shown === this.target) return;
    const diff = this.target - this.shown;
    const dir = Math.sign(diff);
    this.shown += Math.max(1, Math.ceil(Math.abs(diff) * JUICE.scoreRoll.lerp * frames)) * dir;
    if ((dir > 0 && this.shown > this.target) || (dir < 0 && this.shown < this.target)) {
      this.shown = this.target;
    }
    this.scoreText.text = this.shown.toLocaleString();
  }
}
