import { Graphics, Text } from 'pixi.js';
import { DESIGN, COLORS, FONT, TYPE } from '../data/config';
import { Popup } from '../ui/Popup';

// Shop — locked for this prototype (docs/30-systems/shop). Opens through the common popup shell but
// shows only a lock + "준비 중"; no items, prices, or purchase. Coins have no shop sink.
export class ShopPopup extends Popup {
  constructor() {
    super({ title: '상점' });
    const cy = DESIGN.h / 2;

    const lock = new Graphics();
    lock.beginFill(COLORS.panelBorder);
    lock.drawRoundedRect(DESIGN.w / 2 - 34, cy - 30, 68, 54, 10); // body
    lock.endFill();
    lock.lineStyle(10, COLORS.panelBorder);
    lock.arc(DESIGN.w / 2, cy - 30, 22, Math.PI, 2 * Math.PI); // shackle
    lock.beginFill(COLORS.panelBg);
    lock.drawCircle(DESIGN.w / 2, cy - 2, 7); // keyhole
    lock.endFill();
    this.body.addChild(lock);

    const t = new Text('준비 중', { fill: COLORS.textSoft, fontSize: TYPE.s26, fontFamily: FONT, fontWeight: '800' });
    t.anchor.set(0.5);
    t.x = DESIGN.w / 2;
    t.y = cy + 56;
    this.body.addChild(t);
  }
}
