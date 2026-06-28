import { Container, Graphics, LINE_CAP, Rectangle, Text } from 'pixi.js';
import { COLORS, DESIGN, FONT, TYPE } from '../data/config';
import { Popup } from '../ui/Popup';
import { attachButtonFeedback, button3D, BUTTON3D_DY } from '../ui/button';
import { sound } from '../SoundManager';

// 설정 팝업 — 공통 팝업 셸 사용 (docs/30-systems/settings). 실제 동작은 '사운드'(마스터 뮤트 토글)뿐이고
// 진동·닉네임·UID 복사·언어·게임 저장·구글/Apple 로그인은 레퍼런스 구색용 비동작 placeholder(탭 시
// 공통 프레스 피드백 + uiPress만). 사운드 토글은 SoundManager.toggleMuted()로 ppm.muted를 영속한다.
const BLUE = COLORS.btnBlue;

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
    this.chip(cx + 93, 196, 176, 52, BLUE, '진동', vibrateIcon(COLORS.white), () => {});

    // 2) 닉네임(placeholder)
    this.chip(cx, 262, 362, 52, COLORS.settingsGrey, 'Player_1536384912', editIcon(COLORS.textSoft), () => {}, { labelSize: 17 });

    // 3) UID + 복사(placeholder)
    this.uidRow(324);

    // 4) 언어 · 게임 저장(placeholder)
    this.chip(cx - 93, 392, 176, 52, BLUE, '언어', langIcon(COLORS.white), () => {});
    this.chip(cx + 93, 392, 176, 52, BLUE, '게임 저장', saveIcon(COLORS.white), () => {});

    // 구분선
    const div = new Graphics();
    div.lineStyle(2, COLORS.panelBorder, 0.22);
    div.moveTo(this.panel.x + 30, 448);
    div.lineTo(this.panel.x + this.panel.w - 30, 448);
    this.body.addChild(div);

    // 5) 소셜 로그인(placeholder)
    this.chip(cx, 498, 362, 50, COLORS.white, '구글 로그인', googleIcon(), () => {}, { textColor: COLORS.googleText });
    this.chip(cx, 558, 362, 50, COLORS.chipDark, 'Apple 로그인', appleIcon(COLORS.white), () => {}, { textColor: COLORS.white });

    // 게임 초기화(동작) — 로컬 저장 전체 삭제 후 첫 로딩 화면으로 재시작 (docs/30-systems/settings)
    this.chip(cx, 660, 362, 52, COLORS.settingsRed, '게임 초기화', resetIcon(COLORS.white), () => this.resetGame());
  }

  // 로컬 저장소를 전부 비우고 첫 로딩 화면(GALAXY PINBALL 스플래시)으로 재시작한다. 저장을 비운 뒤
  // 페이지를 새로 로드해 부팅을 처음부터 다시 태운다 → 코인·진행도·기록이 모두 초기화된다.
  private resetGame() {
    try {
      localStorage.clear();
    } catch {
      // 저장 접근 불가(시크릿 모드 등)여도 리로드해 메모리 상태를 버린다
    }
    location.reload();
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
      fill: opts.textColor ?? COLORS.white,
      fontSize: opts.labelSize ?? 18,
      fontFamily: FONT,
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
    this.soundFace.addChild(button3D(176, 52, muted ? COLORS.settingsGrey : BLUE));
    this.layoutFace(this.soundFace, speakerIcon(COLORS.white, muted), muted ? '사운드 OFF' : '사운드', { labelSize: 17 });
  }

  // UID 표기(회색 박스) + 복사 버튼(주황) — 둘 다 placeholder.
  private uidRow(cy: number) {
    const box = new Container();
    box.x = 166;
    box.y = cy;
    box.addChild(button3D(244, 52, COLORS.settingsGrey));
    const cap = new Text('UID', { fill: COLORS.uidCap, fontSize: TYPE.s11, fontFamily: FONT, fontWeight: '700' });
    cap.anchor.set(0.5);
    cap.y = -12;
    const uid = new Text('4620928315709', { fill: COLORS.uidValue, fontSize: TYPE.s15, fontFamily: FONT, fontWeight: '800' });
    uid.anchor.set(0.5);
    uid.y = 7;
    box.addChild(cap, uid);
    this.body.addChild(box);
    this.chip(354, cy - 1, 96, 46, COLORS.settingsOrange, '복사', null, () => {});
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
  g.lineStyle({ width: 2.6, color: COLORS.iconStroke, cap: LINE_CAP.ROUND });
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
  g.lineStyle(3, COLORS.googleBlue); // 파란 링(약식 G)
  g.arc(0, 0, 9, -0.5, 5.0);
  g.lineStyle(3, COLORS.googleBlue);
  g.moveTo(9, 0); g.lineTo(1, 0); // G 가로획
  return g;
}

function appleIcon(color: number): Graphics {
  const g = new Graphics();
  g.beginFill(color);
  g.drawCircle(0, 1, 9); // 사과 몸통
  g.endFill();
  g.beginFill(COLORS.chipDark);
  g.drawCircle(7, -2, 5); // 한 입 베어낸 자국(버튼색)
  g.endFill();
  g.beginFill(color);
  g.drawEllipse(2, -9, 2, 4); // 잎
  g.endFill();
  return g;
}

function resetIcon(color: number): Graphics {
  const g = new Graphics();
  const r = 9;
  g.lineStyle({ width: 2.6, color, cap: LINE_CAP.ROUND });
  g.arc(0, 0, r, -Math.PI * 0.35, Math.PI * 1.45); // 원형 화살표(위쪽에 틈)
  g.lineStyle(0);
  g.beginFill(color);
  const a = -Math.PI * 0.35; // 호 시작각 — 여기 화살촉을 둔다
  const ex = Math.cos(a) * r;
  const ey = Math.sin(a) * r;
  g.drawPolygon([ex + 5, ey, ex - 3, ey - 5, ex - 1, ey + 4]); // 작은 삼각 화살촉
  g.endFill();
  return g;
}
