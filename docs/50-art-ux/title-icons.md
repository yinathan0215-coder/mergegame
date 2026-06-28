---
id: art-ux-title-icons
note_type: section
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, ux, title, icon, prompt, imagegen, casual]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# Title Icon Assets

Title 화면의 설정, 일일 미션, 출석 체크, 행운의 돌림판, 상점 아이콘은 모두 개별 PNG 리소스로 관리한다. 코드에서 이모지, 폰트 글리프, 절차적으로 그린 기어를 아이콘 대체물로 쓰지 않는다.

## Canonical Style

- 정본 기준: `game/public/assets/ui/crown.png`, `game/public/assets/ui/gold.png`, `game/public/assets/resource-preview.png`.
- 방향: 캐주얼 모바일 게임용 2.5D 아이콘. 실사 렌더, 사진풍 질감, 과한 금속/유리 재질, 현실 조명은 금지한다.
- 형태: 둥근 실루엣, 두꺼운 다크 브라운 외곽선, 큰 덩어리 위주의 셀 쉐이딩, 선명한 하이라이트 1-2개.
- 색: 기존 행성/왕관/머니와 맞는 블루, 골드, 오렌지, 레드 포인트. 크로마키 배경색은 오브젝트 내부에 쓰지 않는다.
- 구성: 192x192 정사각 캔버스 중앙에 단일 오브젝트를 크게 배치하고, 가장자리는 잘리지 않게 여백을 둔다.
- 금지: 텍스트, 숫자, 워터마크, 별/십자 장식, 배경 오브젝트, 리얼한 그림자, 사진 같은 소재 질감.

## Required Assets

| 기능 | 최종 파일 | 시각 키워드 |
|---|---|---|
| 설정 | `game/public/assets/ui/settings.png` | 블루 톤 기어 + 골드 림 |
| 일일 미션 | `game/public/assets/ui/daily-mission.png` | 체크리스트 클립보드 + 별 메달 |
| 출석 체크 | `game/public/assets/ui/check-in.png` | 달력 + 골드 체크 배지 |
| 행운의 돌림판 | `game/public/assets/ui/lucky-wheel.png` | 컬러 프라이즈 휠 + 포인터 |
| 상점 | `game/public/assets/ui/shop.png` | 작은 상점/어닝 또는 쇼핑백 |
| 게임 시작 9-slice 몸체 | `game/public/assets/ui/play-button.png` | 블루/골드 입체 CTA 버튼 몸체 |
| HUD 나가기 | `game/public/assets/ui/exit.png` | 블루/골드 나가기 또는 뒤로가기 아이콘 |
| HUD 햄버거 메뉴 | `game/public/assets/ui/menu.png` | 골드 배지 위 세 줄 메뉴 아이콘 |

설정과 사이드 버튼 4개처럼 아이콘 이미지가 들어가는 버튼의 외형은 [[button-system]]을 따른다. 검은색 반투명 라운드 사각형은 아이콘 뒤 배경으로만 쓰고, 사이드 버튼 라벨 텍스트는 박스 아래에 분리해서 배치한다.

## Imagegen Prompt Contract

모든 아이콘은 `$imagegen`으로 개별 생성한다. 스프라이트 시트에서 크롭하지 않는다. 생성은 평평한 `#00ff00` 크로마키 배경으로 받고, 로컬에서 배경을 제거한 뒤 전체 캔버스를 192x192로 정규화한다.

공통 프롬프트 골격:

```text
Use case: stylized-concept
Asset type: Planet Pool Merge title UI icon, one standalone 192x192 casual mobile game PNG asset.
Style target: match the existing crown and gold icons from Planet Pool Merge; cute casual 2.5D mobile game icon, bold dark brown outline, rounded shapes, saturated blue/gold/orange accents, simple cel shading, clean vector-like edges.
Primary request: <아이콘별 주제>.
Composition: centered single icon, full object visible, generous padding, no crop, readable at small mobile UI size.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background only.
Constraints: no text, no numbers, no watermark, no emoji, no font glyphs, no extra stars or sparkle marks, no realistic photo rendering, no 3D product render, no detailed material texture, no cast shadow on the background, do not use #00ff00 inside the object.
```

## Accepted Prompts

프롬프트 원문, 생성 원본 경로, 후처리 절차, 최종 파일 경로는 `game/public/assets/prompts/title-icons.md`에 항상 기록한다.

## Play Button

게임 시작 버튼의 버튼 몸체는 `$imagegen`으로 생성한 단일 PNG `play-button.png`를 사용한다. 이 이미지는 9-slice로 실제 버튼 영역 안을 채우며, 눌림 전용 `play-button-pressed.png`는 사용하지 않는다. 한글 텍스트와 흰색 플레이 삼각형은 런타임에서 선명하게 얹고, 눌림 상태는 [[button-system]]의 공통 버튼 피드백으로 처리한다.

## Related

- [[title-screen]] — Title 화면 배치와 버튼 동작.
- [[button-system]] — 9-slice 버튼과 이미지 아이콘 버튼의 공통 규칙.
- [[art-direction]] — 전체 우주/캐주얼 아트 방향.
- [[planet-art]] — 행성 아이콘 정본 스타일.
