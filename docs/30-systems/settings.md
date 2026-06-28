---
id: systems-settings
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, settings, popup, sound, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 설정 (Settings) 팝업

> Title 로비 우상단 **설정 기어**(`settings.png`, [[../50-art-ux/title-screen]] §2-1)를 누르면 열리는
> 창. **공통 팝업 셸**([[../50-art-ux/popup-system]])을 그대로 사용한다(보라색 타이틀 바 `설정` + ✕ +
> 등장 전환·딤). 레퍼런스(캐주얼 머지 게임 설정창) 구색을 맞추되, **실제 동작은 `사운드` 하나뿐**이고
> 나머지는 비동작 placeholder다.

## 구성 (위 → 아래)

| 행 | 항목 | 동작 |
|---|---|---|
| 1 | **사운드** · 진동 | **사운드 = 동작**(마스터 뮤트 토글). 진동 = placeholder |
| 2 | 닉네임(`Player_…` + 편집 아이콘) | placeholder |
| 3 | UID(숫자) + **복사** 버튼(주황) | placeholder |
| 4 | 언어 · 게임 저장 | placeholder |
| — | 구분선 | — |
| 5 | 구글 로그인 · Apple 로그인 | placeholder |
| 하단 | 버전(`v1.8.2`) | 표시용 |

- **버튼 외형:** 공통 3D 버튼 페이스([[../50-art-ux/popup-system]] 입체감 규칙, `ui/button.ts button3D`) —
  파랑(기본)·주황(복사)·회색(닉네임/UID)·흰색(구글)·검정(Apple). 모든 버튼은 탭 시 **공통 프레스
  피드백 + `uiPress`**([[../50-art-ux/feedback-effects]] §5)를 준다.
- **placeholder 규칙:** 진동·닉네임·UID 복사·언어·게임 저장·로그인은 **탭해도 아무 기능이 없다**
  (눌림 피드백만). 데이터 저장·계정·언어 변경은 이 프로토타입 범위 밖 — 구색용.

## 사운드 항목 (유일한 동작)

- `사운드` 버튼은 **마스터 뮤트 토글**이다 → `SoundManager.toggleMuted()`([[../60-implementation/sound-manager]]).
  상태는 `localStorage`(`ppm.muted`)에 영속되며 새로고침 후에도 유지된다(기본 = 소리 ON).
- **상태 시각화:** 켜짐 = 파란 버튼 + 스피커 아이콘 / 꺼짐 = 회색 버튼 + 음소거(슬래시) 아이콘·`사운드 OFF`.
- 음소거 해제 시 확인용으로 `toggle` 효과음을 한 번 낸다([[../50-art-ux/sound-design]]).

## Relates to

- [[../50-art-ux/popup-system]] — 공통 팝업 셸(이 창이 그대로 사용)
- [[../50-art-ux/title-screen]] — 설정 기어 진입점(§2-1)
- [[../50-art-ux/sound-design]] · [[../60-implementation/sound-manager]] — 사운드 뮤트(유일 동작)의 정본·구현
