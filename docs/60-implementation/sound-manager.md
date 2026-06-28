---
id: implementation-sound-manager
note_type: spec
status: design
domain: implementation
updated: 2026-06-28
tags: [implementation, sound, audio, web-audio, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# SoundManager — 구현 스펙 (Web Audio 합성 + 동시 제한)

> 사운드 디자인 컨셉·카탈로그·UX는 [[../50-art-ux/sound-design]], 수치 SSoT는
> `game/src/data/balance.json`(`sound`). 이 페이지는 **`game/src/SoundManager.ts`** 의 구조를 못 박는다.
>
> **준수 기준(방법론):** [[../90-methodology/event-driven]](게임 이벤트의 구독자) ·
> [[../90-methodology/layered-rendering]](사운드 = 렌더처럼 부수 효과, 시뮬레이션 비되먹임).

## 구조

- **단일 모듈 `SoundManager`** (모듈 싱글톤 `sound`). Web Audio `AudioContext` 1개 + 마스터 `GainNode`.
- **절차적 합성**: 각 사운드는 오실레이터(사인/삼각/사각) + **ADSR 비슷한 게인 엔벨로프**(빠른 attack,
  짧은 decay/release) 로 만든다. 노이즈가 필요한 타격음(`wall`·`ballHit`)은 짧은 화이트노이즈 버퍼.
  음원 에셋 파일 없음(차후 에셋 백엔드로 교체 가능, API 동일).
- **데이터 주도**: 사운드별 파라미터(`type`·`freq`·`freq2`(슬라이드 목표)·`dur`·`gain`·`throttleMs`·
  `priority`)와 전역(`master`·`maxVoices`)은 `balance.json`(`sound`)에 둔다.

## 동시 제한 (사용자 핵심 요구)

- **`maxVoices` 상한**: 활성 보이스 수가 상한이면, 새 재생 시 **우선순위 비교** — 활성 중 가장 낮은
  우선순위가 새 소리보다 **낮으면 그걸 중단**하고 재생, 아니면(새 소리가 더 낮거나 같으면) **생략**.
- **`throttleMs` 스로틀**: 같은 `id`는 마지막 재생 후 `throttleMs` 안에는 재생하지 않는다. `wall`·`ballHit`
  처럼 다발로 터지는 소리에 짧은 스로틀을 줘 **충돌 폭주 시 한두 번만** 들리게 한다(가장 큰 절감).
- 활성 보이스는 `onended`로 추적 해제. 우선순위가 같은 머지·해금 소리는 항상 들리도록 낮은 우선순위
  (`wall`·`ballHit`)를 먼저 희생한다.

## 라이프사이클 / API

- **자동재생 해제**: `AudioContext`는 처음 suspended. **첫 `pointerdown`(1회)에서 `resume()`** 한다
  (전역 리스너, `{ once: true }`). 그 전 재생 요청은 무음.
- **뮤트/볼륨**: `setMuted(b)`·`muted` — `localStorage`(`ppm.muted`)에 영속, 기본 OFF(소리 ON).
  뮤트면 `play()`는 즉시 반환(보이스 생성 안 함). 마스터 게인 = `master`(뮤트 시 0).
- **API**: `sound.play(id: SoundId, opts?: { pitch?: number })` — `pitch`는 머지 등급↑/발사 파워↑를 위한
  배수(주파수 곱). `sound.setMuted(b)` · `sound.toggleMuted()`.

## 연결 지점 (이벤트 → play)

| play(id) | 호출 위치 |
|---|---|
| `uiPress` | `ui/button.ts` `attachButtonFeedback`(모든 버튼 공통) |
| `play` | Title Play 버튼 콜백 (`GameScene` setScene→PoolInGame) |
| `launch` | `GameScene.fire` (파워→`pitch`) |
| `wall` / `ballHit` | `GameScene` `physics.onCollision`(스로틀로 솎임) |
| `merge` | `GameScene` 머지 콜백 (생성 등급→`pitch`) |
| `comboMilestone` | `GameScene` 머지 콜백, 콤보 보너스 발생 시 |
| `unlock` | `GameScene` 해금 모달 `show` |
| `popupOpen`/`popupClose` | `UnlockModal`·`MetaUI`·팝업 open/close |

## 검증

- typecheck·vite build OK. 헤드리스로는 출력 음을 못 듣지만, `play` 호출이 예외 없이 동작하고 기존
  Playwright 스위트가 그대로 통과(사운드는 부수 효과)함을 확인. 동시 제한/스로틀은 단위 로직으로 보장.

## 관련
- [[../50-art-ux/sound-design]] — 컨셉·카탈로그·UX 규칙(이 스펙의 설계 출처)
- [[architecture]] — 모듈 경계(사운드 = 신규 부수효과 모듈)
- [[../40-balancing/index]] — `balance.json` `sound` 수치
