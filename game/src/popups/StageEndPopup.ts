import { Container, Rectangle, Text } from 'pixi.js';
import { DESIGN, MODES, COLORS } from '../data/config';
import { Popup } from '../ui/Popup';
import { button3D, attachButtonFeedback, BUTTON3D_DY } from '../ui/button';
import { coinSprite } from '../ui/coin';

// Stage end windows (docs/50-art-ux/result-window · 30-systems/stage-mode). Both open with the common
// popup transition. Clear: +clearReward coins, [다음 스테이지] / [돌아가기]. Fail: [다시 시도] → back
// to the same stage board.
function centred(s: string, size: number, color: number, y: number): Text {
  const t = new Text(s, { fill: color, fontSize: size, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
  t.anchor.set(0.5);
  t.x = DESIGN.w / 2;
  t.y = y;
  return t;
}

function bigButton(cx: number, cy: number, label: string, base: number, onTap: () => void): Container {
  const c = new Container();
  c.x = cx;
  c.y = cy;
  c.hitArea = new Rectangle(-130, -30, 260, 60);
  c.addChild(button3D(260, 60, base));
  const t = new Text(label, { fill: 0xffffff, fontSize: 20, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
  t.anchor.set(0.5);
  t.y = BUTTON3D_DY;
  c.addChild(t);
  attachButtonFeedback(c, onTap);
  return c;
}

export class StageClearPopup extends Popup {
  constructor(onNext: () => void, onHome: () => void) {
    super({ title: 'STAGE CLEAR', hasBg: true, onClose: onHome });
    const cx = DESIGN.w / 2;
    this.body.addChild(centred('스테이지 클리어!', 24, 0xffffff, 300));
    const coin = coinSprite(34);
    coin.x = cx - 40;
    coin.y = 372;
    const reward = new Text(`+${MODES.stage.clearReward}`, { fill: 0xffd23f, fontSize: 34, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    reward.anchor.set(0, 0.5);
    reward.x = cx - 18;
    reward.y = 372;
    this.body.addChild(coin, reward);
    this.body.addChild(bigButton(cx, 520, '다음 스테이지', COLORS.btnBlue, () => { this.close(); onNext(); }));
    this.body.addChild(bigButton(cx, 596, '돌아가기', 0x55617f, () => { this.close(); onHome(); }));
  }
}

export class StageFailPopup extends Popup {
  constructor(onRetry: () => void) {
    super({ title: 'STAGE FAILED', hasBg: true, onClose: onRetry });
    const cx = DESIGN.w / 2;
    this.body.addChild(centred('목표 행성을 만들지 못했어요', 20, 0xdde7ff, 320));
    this.body.addChild(bigButton(cx, 520, '다시 시도', COLORS.btnBlue, () => { this.close(); onRetry(); }));
  }
}
