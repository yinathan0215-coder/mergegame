---
id: popup-system
note_type: section
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, ux, popup, modal, meta, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/ui/Popup.ts"
---

# 공통 팝업 틀 (Popup)

> 과제 요구 ④-b(UX 판단). Title 로비의 모든 메타 창([[../30-systems/daily-missions]] ·
> [[../30-systems/attendance]] · [[../30-systems/lucky-wheel]] · [[../30-systems/shop]])이
> 공유하는 **단일 팝업 컴포넌트**. 한 곳에서 오픈 연출·구성요소·입력 차단을 못 박는다.

## Summary

팝업은 **딤(dim) 위에 뜨는 모달**이며 **3가지 구성요소** — BG(배경 패널 + 제목 표시 영역),
**제목**, **X 버튼** — 으로 이뤄진다. 오픈 시 **인게임 머지(해금) 팝업과 동일한 전환 연출**로
나타난다. 모든 메타 창은 이 한 컴포넌트를 상속/구성해 만든다(연출·닫기·입력차단 일관성).

## Details

### 구성요소 (3종)
1. **BG** — 둥근 사각 **배경 패널** + 상단 **제목 표시 영역**(레퍼런스의 보라색 제목 바).
   **생략 가능**: 패널 없이 딤 위에 콘텐츠만 띄우는 형태도 허용한다(예: [[../30-systems/lucky-wheel]]은
   BG 패널 없이 돌림판만 표시). `hasBg` 플래그로 켜고 끈다.
2. **제목** — 창 이름 텍스트. BG가 있으면 제목 바 안에, 없으면 콘텐츠 위에 단독으로 배치.
3. **X 버튼** — 우측 상단. 누르면 팝업이 닫힌다. 공통 버튼 피드백([[feedback-effects]] §5)을 쓴다.

### 오픈 전환 연출
- **머지 해금 모달과 동일**한 진입 연출([[../30-systems/tier-unlock]] · `raw: game/src/UnlockModal.ts`):
  딤 알파 `0 → dimAlpha`, 콘텐츠 **스케일 `startScale → 1.0` + 페이드 `0 → 1`**, ease-out으로
  `enterMs`에 걸쳐 정착. 콘텐츠는 화면 중앙을 피벗으로 제자리에서 커진다.
- 수치 SSoT: `juice.popup`([[../40-balancing/meta-economy]]) — `enterMs` · `dimAlpha` · `startScale`.

### 입력·딤
- 딤은 **전체 화면**을 덮고 뒤(보드/로비)로의 포인터 입력을 **삼킨다**(`stopPropagation`).
- **닫기는 X 버튼으로만.** 딤 바깥 탭으로는 닫히지 않는다(오조작 방지).
- 딤은 **cover 팝업 레이어**(`raw: game/src/GameScene.ts` `popupRoot`)에 그려져 **뷰포트 전체(상하
  여백 포함)**를 덮는다 — 2-레이어 fit의 배경/fade와 같은 방식. 캔버스가 뷰포트를 꽉 채우므로 별도 DOM
  딤은 쓰지 않는다. 팝업 콘텐츠(패널·버튼)는 화면 중앙에 둔다.

### 한 번에 하나
- 동시에 열리는 팝업은 하나다. 로비 사이드 버튼([[title-screen]])이 해당 팝업을 연다.

## Relates to
- [[../30-systems/daily-missions]] · [[../30-systems/attendance]] · [[../30-systems/lucky-wheel]] · [[../30-systems/shop]] — 이 틀을 쓰는 창들
- [[../30-systems/tier-unlock]] · `raw: game/src/UnlockModal.ts` — 동일 진입 연출의 출처
- [[feedback-effects]] — X 버튼이 쓰는 공통 버튼 피드백
- [[title-screen]] — 팝업을 여는 로비 사이드 버튼
- [[../40-balancing/meta-economy]] — `juice.popup` 전환 수치
