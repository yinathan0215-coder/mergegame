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
- **벽 충돌 +1, 행성–행성 충돌 +3.** 단 **충돌의 법선 접근 속도(impact)가 최소 기준 이상**일 때만
  점수를 준다 — 각도 있게 튕기는 충돌만 점수가 되고, 벽을 따라 약하게 구르는 저강도 접촉은 점수가
  없다. 값·기준 SSoT [[40-balancing/combo-scoring]].
- 점수에 충족한 충돌은 충돌 위치에 **히트 이펙트**를 낸다([[50-art-ux/feedback-effects]]).
- 구현: 물리 `collisionStart`에서 impact(법선 상대속도) ≥ `minImpact`이면 양쪽 `planet`→`ballPoint`,
  한쪽 벽→`wallPoint`. 머지 큐잉은 impact와 무관(동급 접촉 시 큐잉).

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
