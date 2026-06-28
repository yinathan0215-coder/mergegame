import { Container, Graphics, LINE_CAP, Rectangle, Text } from 'pixi.js';
import { COLORS, DESIGN } from '../data/config';
import { Popup } from '../ui/Popup';
import { attachButtonFeedback, button3D, BUTTON3D_DY } from '../ui/button';
import { sound } from '../SoundManager';

// 설정 팝업 — 공통 팝업 셸 사용 (docs/30-systems/settings). 실제 동작은 '사운드'(마스터 뮤트 토글)뿐이고
// 진동·닉네임·UID 복사·언어·게임 저장·구글/Apple 로그인은 레퍼런스 구색용 비동작 placeholder(탭 시
// 공통 프레스 피드백 + uiPress만). 사운드 토글은 SoundManager.toggleMuted()로 ppm.muted를 영속한다.
const BLUE = COLORS.btnBlue;
const GREY = 0x55617f;
const ORANGE = 0xf2a13a;

interface ChipOpts {
  labelSize?: number;
  textColor?: number;
}

export class SettingsPopup extends Popup {
  private soundFace = new Container();

  constructor() {
    super({ title: '설정' });
    const cx = DESIGN.w / 2;

    // 1) 사운드(동작) · 진동(placeholder)
    this.soundChip(cx - 93, 196);
    this.chip(cx + 93, 196, 176, 52, BLUE, '진동', vibrateIcon(0xffffff), () => {});

    // 2) 닉네임(placeholder)
    this.chip(cx, 262, 362, 52, GREY, 'Player_1536384912', editIcon(0xdfe6f5), () => {}, { labelSize: 17 });

    // 3) UID + 복사(placeholder)
    this.uidRow(324);

    // 4) 언어 · 게임 저장(placeholder)
    this.chip(cx - 93, 392, 176, 52, BLUE, '언어', langIcon(0xffffff), () => {});
    this.chip(cx + 93, 392, 176, 52, BLUE, '게임 저장', saveIcon(0xffffff), () => {});

    // 구분선
    const div = new Graphics();
    div.lineStyle(2, 0x8aa0df, 0.22);
    div.moveTo(this.panel.x + 30, 448);
    div.lineTo(this.panel.x + this.panel.w - 30, 448);
    this.body.addChild(div);

    // 5) 소셜 로그인(placeholder)
    this.chip(cx, 498, 362, 50, 0xffffff, '구글 로그인', googleIcon(), () => {}, { textColor: 0x222a3a });
    this.chip(cx, 558, 362, 50, 0x1b1f2c, 'Apple 로그인', appleIcon(0xffffff), () => {}, { textColor: 0xffffff });

    // 버전
    const v = new Text('v1.8.2', { fill: 0x9fb0d8, fontSize: 14, fontFamily: 'Arial, sans-serif', fontWeight: '700' });
    v.anchor.set(0.5);
    v.x = cx;
    v.y = 702;
    this.body.addChild(v);
  }

  // 공통 동작창 진입 시 현재 뮤트 상태로 사운드 버튼을 다시 그린다(외부에서 바뀌었을 수 있음).
  refresh() {
    this.drawSound();
  }

  // 비동작 칩: 3D 페이스 + (아이콘 + 라벨) 가운데 정렬. 탭하면 공통 피드백(uiPress)만.
  private chip(cx: number, cy: number, w: number, h: number, base: number, label: string, icon: Container | null, onTap: () => void, opts: ChipOpts = {}) {
    const c = new Container();
    c.x = cx;
    c.y = cy;
    c.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    c.addChild(button3D(w, h, base));
    this.layoutFace(c, icon, label, opts);
    attachButtonFeedback(c, onTap);
    this.body.addChild(c);
    return c;
  }

  // 아이콘(≈26) + gap + 라벨을 한 덩어리로 가로 가운데 정렬해 face 컨테이너에 얹는다.
  private layoutFace(parent: Container, icon: Container | null, label: string, opts: ChipOpts) {
    const lbl = new Text(label, {
      fill: opts.textColor ?? 0xffffff,
      fontSize: opts.labelSize ?? 18,
      fontFamily: 'Arial, sans-serif',
      fontWeight: '800',
    });
    lbl.anchor.set(0, 0.5);
    const iconW = icon ? 26 : 0;
    const gap = icon ? 10 : 0;
    const total = iconW + gap + lbl.width;
    if (icon) {
      icon.x = -total / 2 + iconW / 2;
      icon.y = BUTTON3D_DY;
      parent.addChild(icon);
    }
    lbl.x = -total / 2 + iconW + gap;
    lbl.y = BUTTON3D_DY;
    parent.addChild(lbl);
  }

  // 사운드 칩(유일한 동작): 탭하면 마스터 뮤트를 토글하고 페이스를 다시 그린다.
  private soundChip(cx: number, cy: number) {
    const c = new Container();
    c.x = cx;
    c.y = cy;
    c.hitArea = new Rectangle(-88, -26, 176, 52);
    c.addChild(this.soundFace);
    attachButtonFeedback(c, () => {
      const wasMuted = sound.isMuted;
      sound.toggleMuted();
      if (wasMuted) sound.play('toggle'); // 음소거 해제 → 들리는 확인음
      this.drawSound();
    });
    this.body.addChild(c);
    this.drawSound();
  }

  private drawSound() {
    this.soundFace.removeChildren();
    const muted = sound.isMuted;
    this.soundFace.addChild(button3D(176, 52, muted ? GREY : BLUE));
    this.layoutFace(this.soundFace, speakerIcon(0xffffff, muted), muted ? '사운드 OFF' : '사운드', { labelSize: 17 });
  }

  // UID 표기(회색 박스) + 복사 버튼(주황) — 둘 다 placeholder.
  private uidRow(cy: number) {
    const box = new Container();
    box.x = 166;
    box.y = cy;
    box.addChild(button3D(244, 52, GREY));
    const cap = new Text('UID', { fill: 0xb9c4e0, fontSize: 11, fontFamily: 'Arial, sans-serif', fontWeight: '700' });
    cap.anchor.set(0.5);
    cap.y = -12;
    const uid = new Text('4620928315709', { fill: 0xeef3ff, fontSize: 15, fontFamily: 'Arial, sans-serif', fontWeight: '800' });
    uid.anchor.set(0.5);
    uid.y = 7;
    box.addChild(cap, uid);
    this.body.addChild(box);
    this.chip(354, cy - 1, 96, 46, ORANGE, '복사', null, () => {});
  }
}

// ── 절차 아이콘(공통 ✕·ShopPopup 자물쇠처럼 Graphics로 그림). 모두 원점(0,0) 기준 ±13 안. ──
function speakerIcon(color: number, muted: boolean): Graphics {
  const g = new Graphics();
  g.beginFill(color);
  g.drawRect(-12, -5, 5, 10); // 콘 뒤 사각
  g.moveTo(-7, -5);
  g.lineTo(0, -11);
  g.lineTo(0, 11);
  g.lineTo(-7, 5);
  g.closePath();
  g.endFill();
  if (muted) {
    g.lineStyle({ width: 2.6, color, cap: LINE_CAP.ROUND });
    g.moveTo(4, -8);
    g.lineTo(13, 8); // 슬래시
  } else {
    g.lineStyle(2.4, color);
    g.arc(2, 0, 6, -0.9, 0.9);
    g.arc(2, 0, 11, -0.9, 0.9);
  }
  return g;
}

function vibrateIcon(color: number): Graphics {
  const g = new Graphics();
  g.lineStyle(2.4, color);
  g.drawRoundedRect(-6, -11, 12, 22, 3); // 폰 몸체
  g.lineStyle({ width: 2.4, color, cap: LINE_CAP.ROUND });
  g.moveTo(-11, -5); g.lineTo(-11, 5); // 좌 진동선
  g.moveTo(11, -5); g.lineTo(11, 5); // 우 진동선
  return g;
}

function editIcon(color: number): Graphics {
  const g = new Graphics();
  g.beginFill(color);
  g.drawRoundedRect(-12, -12, 24, 24, 5); // 카드
  g.endFill();
  g.lineStyle({ width: 2.6, color: 0x2a3550, cap: LINE_CAP.ROUND });
  g.moveTo(2, -6); g.lineTo(8, 0); // 연필 자국
  g.moveTo(-5, 6); g.lineTo(6, 6);
  return g;
}

function langIcon(color: number): Graphics {
  const g = new Graphics();
  g.lineStyle(2.2, color);
  g.drawCircle(0, 0, 12); // 지구본
  g.drawEllipse(0, 0, 5, 12);
  g.moveTo(-12, 0); g.lineTo(12, 0);
  return g;
}

function saveIcon(color: number): Graphics {
  const g = new Graphics();
  g.lineStyle(2.2, color);
  g.drawRoundedRect(-11, -11, 22, 22, 3); // 플로피
  g.beginFill(color);
  g.drawRect(-6, -11, 12, 7); // 셔터
  g.endFill();
  g.lineStyle(2, color);
  g.drawRect(-5, 2, 10, 7); // 라벨
  return g;
}

function googleIcon(): Graphics {
  const g = new Graphics();
  g.lineStyle(3, 0x4285f4); // 파란 링(약식 G)
  g.arc(0, 0, 9, -0.5, 5.0);
  g.lineStyle(3, 0x4285f4);
  g.moveTo(9, 0); g.lineTo(1, 0); // G 가로획
  return g;
}

function appleIcon(color: number): Graphics {
  const g = new Graphics();
  g.beginFill(color);
  g.drawCircle(0, 1, 9); // 사과 몸통
  g.endFill();
  g.beginFill(0x1b1f2c);
  g.drawCircle(7, -2, 5); // 한 입 베어낸 자국(버튼색)
  g.endFill();
  g.beginFill(color);
  g.drawEllipse(2, -9, 2, 4); // 잎
  g.endFill();
  return g;
}
