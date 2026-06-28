import { Container } from 'pixi.js';
import type { MetaStore } from './MetaStore';
import type { Popup } from './ui/Popup';
import { DailyMissionPopup } from './popups/DailyMissionPopup';
import { AttendancePopup } from './popups/AttendancePopup';
import { LuckyWheelPopup } from './popups/LuckyWheelPopup';
import { ShopPopup } from './popups/ShopPopup';

// Owns the four Title-lobby meta popups and a single layer they live in (mounted in fgRoot by
// GameScene). One popup open at a time; opening one closes any other. update() drives every popup's
// entrance transition + per-frame work (wheel spin, attendance countdown) and must run even on the
// Title scene, so GameScene calls it before its PoolInGame early-return.
export type PopupKind = 'dailyMission' | 'attendance' | 'wheel' | 'shop';

export class MetaUI {
  readonly layer = new Container();
  readonly wheel: LuckyWheelPopup;
  private popups: Record<PopupKind, Popup>;

  constructor(store: MetaStore) {
    const dailyMission = new DailyMissionPopup(store);
    const attendance = new AttendancePopup(store);
    this.wheel = new LuckyWheelPopup(store);
    const shop = new ShopPopup();
    this.popups = { dailyMission, attendance, wheel: this.wheel, shop };
    for (const p of Object.values(this.popups)) this.layer.addChild(p.container);
  }

  open(kind: PopupKind) {
    for (const p of Object.values(this.popups)) if (p.isOpen) p.close();
    this.popups[kind].open();
  }

  // Which popup is currently open (null = none) — verification hook for the HUD dropdown.
  openKind(): PopupKind | null {
    for (const k of Object.keys(this.popups) as PopupKind[]) if (this.popups[k].isOpen) return k;
    return null;
  }

  update(now: number) {
    for (const p of Object.values(this.popups)) p.update(now);
  }
}
