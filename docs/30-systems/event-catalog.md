---
id: systems-event-catalog
note_type: section
status: design
domain: systems
updated: 2026-06-29
tags: [systems, event-driven, catalog, methodology]
sources:
  - "[[00-meta/input-log/2026-06-29]]"
---

# 이벤트 카탈로그 (Event Catalog)

> 과제 요구 ③ — 시스템 간 통신의 **정본**. [[../90-methodology/event-driven]]가 요구하는
> "주요 변화가 이벤트 카탈로그로 정의됨 · payload 문서화 · 최근 이벤트 흐름을 디버그로 확인 가능"을
> 충족한다. 본 게임은 전역 EventBus 대신 **DI 콜백을 `GameScene` 오케스트레이터 한 곳으로 라우팅**해
> 시스템 간 직접 결합을 0으로 유지한다(시스템은 서로의 내부를 호출하지 않는다). 이 페이지가 그
> 콜백들을 **이름 있는 이벤트**로 고정한다.

## 카탈로그 (이벤트 · 발생 조건 · payload · 구독자)

| 이벤트 | 발생(emitter) | payload | 구독자(반응) |
|---|---|---|---|
| `COLLISION` | `PhysicsWorld.onCollision` (Matter `collisionStart`) | `(a, b, impact, cx, cy, bx, by)` | `GameScene`: 동급쌍→`MergeSystem.queuePair`; `impact≥minImpact`→`ScoreSystem.onBallHit/onWallHit`·`Effects.hitBurst`·`sound` |
| `ITEM_MERGED` | `MergeSystem` onMerge 콜백 (동급 충돌 병합 성사) | `(tier, x, y, planet)` | `GameScene`: stats·`Effects.mergeBurst`·`sound`·`ScoreSystem.onMerge`·`Combo.onMerge`·`MetaStore.onMerge`(미션)·Stage 클리어 판정·해금 모달 |
| `TERMINAL_MERGE` | `MergeSystem.terminalMerge` (블랙홀+블랙홀, Infinite) | `(pa, pb)` | `GameScene.onTerminalMerge`: 두 행성 제거·카운트 +20·버스트·sound |
| `SCORE_CHANGED` | `ScoreSystem.onChange` (점수 가산 시) | `(score)` | `Hud.setScore`(오도미터) + `MetaStore.setScore`(영속, Stage 제외) |
| `COMBO_MILESTONE` | `Combo.onMerge` 반환값 > 0 (5/10/15… 도달) | `(bonus)` | `GameScene`: `ScoreSystem.addBonus`·`Effects.comboBonus`·sound |
| `QUEUE_CHANGED` | `QueueSystem.onChange` (발사·리필 후) | `(slots)` | `GameInfoPanel.setNext`(Next 미리보기) |
| `FIRE` | `Launcher` onUp→host.fire (조준 릴리스) | `(tier, vx, vy)` | `GameScene.fire`: 스폰·큐 shift·카운트 소비·코치 종료·sound |
| `UNLOCK_OK` | `UnlockModal` OK 버튼 | `()` | `GameScene.onUnlockOk`: `unlockedTier` 상승·재개 |
| `META_CHANGED` | `MetaStore.changed` (코인·미션·출석·점수 변동) | `()` (구독자가 상태를 pull) | Observer: `CoinPill`·열린 메타 팝업·`Hud` 레드닷·`TitleScreen` |

> 중복 처리 방지(완료기준 "보상·성장·실패·재시작이 중복 처리되지 않음"): merge lock(`MergeSystem`
> 같은 tick 재합성 차단), 재클리어 가드(`MetaStore.isStageCleared`), 1일 1회 출석·청구 배열 dedup.

## 디버그 — 최근 이벤트 흐름

`window.__game.events()` 가 최근 이벤트 링버퍼(이름·시각·요약 payload)를 돌려준다(DEV 전용,
[[../90-methodology/event-driven]] "이벤트는 디버그 로그/Debug Panel에서 확인 가능"). 위 카탈로그의
이벤트가 발생 순서대로 기록돼 Core-Loop 통신 흐름을 검증·관찰할 수 있다.

## 관련
- [[../90-methodology/event-driven]] — 표준(이벤트 카탈로그·payload·디버그 로그 요구)
- [[merge-rules]] · [[scoring-combo]] · [[launch-count]] — 이벤트가 구동하는 규칙
- [[../60-implementation/architecture]] — 모듈 경계(emitter↔구독자가 사는 곳)
