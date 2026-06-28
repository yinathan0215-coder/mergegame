---
id: systems-launch-count
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, count, game-mode, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 남은 카운트 (발사 예산) — 모드 공통 자원

> 과제 요구 ③ — 구현 지시의 입력. 두 게임 모드([[20-core-loop/game-modes]])가 공유하는
> **발사 가능 횟수(카운트)** 자원과 그 소비·획득·종료 판정을 정본화한다.
>
> **준수 기준(방법론):** [[90-methodology/event-driven]] (발사·머지 이벤트 → 카운트 변동) ·
> [[90-methodology/state-machine]] (카운트 소진 → 종료 상태).

## Summary

**카운트**는 남은 발사 횟수다. 발사할 때마다 1 줄고, **0이 되면 더 발사할 수 없다**. 모드가
카운트의 시작값과 종료 의미를 정한다([[20-core-loop/game-modes]]).

## Details (decisions)

### 시작값
- **Infinite:** `50` 으로 시작한다(수치 [[40-balancing/game-modes]]).
- **Stage:** 스테이지 데이터가 정의한 값으로 시작한다([[30-systems/stage-mode]]). 레벨 수치는 차후.

### 소비
- **발사 1회 = 카운트 −1.** 발사가 실제로 성사된 순간에만 깐다(데드존 무드래그 발사 포함).
- **카운트 0이면 발사를 막는다** — 발사대 입력이 동작하지 않는다.

### 획득 (Infinite 한정)
- **행성 충전:** 충전 팝업에서 코인으로 카운트를 산다(10개당 100코인,
  [[30-systems/planet-charge]]).
- **마지막 행성 보너스:** 블랙홀끼리 합성하면 **카운트 +20**(둘 다 소멸, [[30-systems/merge-rules]]).
- **해금 보너스:** 새 단계 해금 팝업(넵튠 6단계부터)이 뜰 때마다 **카운트 +10**([[30-systems/tier-unlock]]).

### 종료 판정
- **Infinite:** 카운트 0 **그리고** 보드의 모든 행성이 정지하면 세션이 끝나고 결과창이 뜬다
  ([[50-art-ux/result-window]]) — Stage와 달리 고정 지연 없이 정지 직후.
- **Stage:** 목표 행성을 만들면(카운트가 남아도) 달성 2초 뒤 클리어, 카운트 0인데 목표 미달이면
  2초 뒤 실패([[30-systems/stage-mode]]). 클리어가 실패보다 우선한다.

### 표시
- 남은 카운트는 **좌하단 HUD**에 **`PLANET`** 라벨 + 숫자로, 큐의 Next 미리보기와 **가로로 나란히**
  표시한다([[50-art-ux/layout]] · [[30-systems/launch-queue]]).

## Relates to
- [[20-core-loop/game-modes]] — 모드별 시작값·종료 의미
- [[30-systems/planet-charge]] — Infinite 코인→카운트 충전
- [[30-systems/merge-rules]] — 블랙홀 합성 +20 카운트(Infinite)
- [[30-systems/stage-mode]] — Stage 카운트·종료
- [[50-art-ux/layout]] — 좌하단 카운트/Next 표시
- [[40-balancing/game-modes]] — 카운트 수치(Infinite=30 등)
