---
id: systems-scoring-combo
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, scoring, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 점수 (Scoring) (§7)

> **준수 기준(방법론):** [[90-methodology/event-driven]] (충돌·머지 이벤트 → 점수 가산).
> 결정 근거 ADR [[40-balancing/decisions/2026-06-28-remove-combo]].

## Summary

점수는 두 갈래로 오른다: **모든 행성–행성 충돌마다 +1**, **머지 시 생성 등급의 기본 점수**(등급이
높을수록 큰 점수).

## Details (decisions)

### 충돌 점수
- **벽 충돌 +1, 행성–행성 충돌 +3.** 행성이 충돌 경계 벽(inner line · 발사대 원)에 부딪히면 +1,
  두 행성이 부딪히면 +3(머지 여부 무관). 값 SSoT [[40-balancing/combo-scoring]].
- 구현: 물리 `collisionStart`에서 양쪽이 `planet`이면 `ballPoint`, 한쪽이 벽이면 `wallPoint`.

### 머지 점수
- 머지로 생성된 행성 **등급의 기본 점수**를 가산한다(등급 차등). 표 SSoT [[40-balancing/planet-stats]].

### 표시 / 연출
- 상단 `Score`만 표시. 점수는 **1단위 오도미터**로 스크롤하며 오르고, 머지 시 **+N 플로팅 텍스트**가
  Score 주변 랜덤 좌표에 떴다가 사라진다 → 연출 정본 [[50-art-ux/feedback-effects]].
- **만들지 않는다:** 최고 단계 진행 트랙, 미도달 단계 실루엣 트랙.

## Relates to
- [[30-systems/merge-rules]] — 머지 점수의 원천.
- [[40-balancing/combo-scoring]] — 충돌 +1·머지 점수 수치.
- [[50-art-ux/feedback-effects]] — 점수/머지 연출.
