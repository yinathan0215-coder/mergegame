---
id: art-ux-button-system
note_type: section
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, ux, button, ui, nine-slice, title, hud]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# Button System

## Common Press Feedback

모든 탭 가능한 버튼은 공통 버튼 피드백을 사용한다. 눌림 전용 이미지를 따로 두지 않고, `juice.buttonPress`의 scale down/up 피드백으로 눌림 상태를 표현한다.

## Image Icon Buttons

Title 로비의 이미지 아이콘 버튼(설정·일일 미션·출석 체크·행운의 돌림판·상점)은 아이콘 뒤에만 **검은색 반투명 라운드 사각형**을 둔다.

- 딤드 박스는 아이콘 배경이다. 라벨 텍스트를 박스 안에 넣지 않는다.
- Title 사이드 버튼의 라벨 텍스트는 딤드 박스 아래에 분리해서 배치한다.
- 코드에서 이모지, 폰트 글리프, 절차 그래픽으로 아이콘을 대체하지 않는다.
- **인게임 HUD 코너 버튼(나가기·햄버거 메뉴)** 은 **아이콘만** 상단 바 위에 띄운다(코너 버튼 = 아이콘 자체가 탭 영역).
- **인게임 ≡ 드롭다운 리스트**는 항목별 박스 대신 **4개 아이콘을 하나의 공통 딤드 박스**로 묶는다([[layout]] §2-c).

## Play Button 9-Slice

게임 시작 버튼은 모드별 버튼 몸체 이미지를 **9-slice**로 늘려 실제 버튼 영역 내부를 채운다. Infinite는 `game/public/assets/ui/play-button.png`, Stage는 같은 형태에서 색상만 짙은 보라색으로 바꾼 `game/public/assets/ui/play-button-stage.png`를 사용한다. 두 소스 이미지와 런타임 버튼 영역은 모두 224x100 기준을 유지하고, 플레이 삼각형과 라벨 텍스트만 버튼 안전영역 안으로 배치한다.

- 눌림 전용 `play-button-pressed.png`는 사용하지 않는다.
- 버튼 몸체 이미지는 텍스트와 플레이 삼각형을 포함하지 않는다.
- 한글/모드별 라벨과 흰색 플레이 삼각형은 런타임에서 버튼 위에 얹는다.
- 라벨 텍스트와 플레이 삼각형은 현재 모드 버튼 면(파랑 또는 보라) 안에만 들어와야 한다. 하단 금색 베벨이나 그림자 영역 위로 내려오면 버튼 이미지를 줄이지 말고 오버레이 위치를 위로 보정한다.
- Stage 버튼은 Infinite 버튼과 동일한 실루엣, 9-slice 절단선, 금색 하단 베벨, 외곽선을 유지하고 색상만 보라 계열로 바꾼다.
- 9-slice 모서리/베벨은 고정하고 중앙 영역만 늘려 버튼 크기 변화에도 외곽선과 모서리가 흐트러지지 않게 한다.
- 표시 크기를 조정할 때는 소스 캔버스 크기와 런타임 버튼 크기를 분리한다. 소스 프레임을 같이 줄이면 9-slice 절단선이 깨진다.

## Related

- [[title-icons]] — 버튼/아이콘 PNG 리소스와 `$imagegen` 프롬프트 기록.
- [[title-screen]] — Title 로비 버튼 배치.
- [[layout]] — Pool In-Game HUD 나가기/메뉴 버튼 배치.
