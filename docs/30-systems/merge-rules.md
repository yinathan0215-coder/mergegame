---
id: systems-merge-rules
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, merge, physics, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 합성 규칙 — 동급 충돌 → 다음 등급 (§6)

> 과제 요구 ③ — 구현 지시의 입력(핵심 합성 메카닉).
>
> **준수 기준(방법론):** [[90-methodology/event-driven]] (충돌 이벤트 → 합성) ·
> [[90-methodology/state-machine]] (merge lock / 재합성 지연 상태) ·
> [[90-methodology/data-driven]] (등급 사다리 데이터).

## Summary

같은 등급 행성 둘이 충돌하면 **다음 등급 행성 하나**로 합성된다. 새 행성은 두 행성 사이에서
생성되어 충돌 힘의 방향으로 날아간다. 동시·즉시 중복 합성은 lock과 지연으로 막되, 자연스러운
연쇄는 허용한다.

## Details (decisions)

### 합성 트리거
- **동급 충돌 → 한 등급 상승:** 같은 등급 행성 2개가 충돌하면 두 행성을 제거하고 다음 등급
  행성 1개를 생성한다. 등급 사다리 순서의 SSoT는 [[10-concept/index]].
- **최종 등급:** **태양끼리 충돌하면 합성하지 않고 일반 물리 충돌만** 처리한다(태양은 사다리 끝).

### 합성 위치
- 새 행성은 **두 행성 중심점의 중간 지점**에 생성한다.

### 합성 속도 — 지배적 운동량 방향
- 새 행성은 충돌한 두 행성 중 **운동량(질량×속도)이 큰 쪽의 속도 벡터를 이어받아** 그 방향으로
  쭉 날아간다(A가 이동하며 B에 부딪히면 합성 결과가 A의 방향·속도를 유지한다).
- 지배측 속도가 너무 작으면 **두 중심을 잇는 충돌 법선 방향으로 최소 속도**를 부여한다(제자리
  정지 방지). 임계값·최소 속도(`mergeMinSpeed`) SSoT는 [[40-balancing/launch-physics]].
- 결과적으로 새 행성은 **힘이 큰 쪽 방향**으로 합쳐지며 날아간다(검증: [[70-verification/index]]).
- 머지 순간 연출(스케일 팝·발산 버스트): [[50-art-ux/feedback-effects]].

### 중복 합성 방지
- **merge lock:** 같은 물리 tick에서 하나의 행성이 둘 이상의 합성에 동시에 사용되지 않도록
  잠근다(한 tick·한 행성 1합성).
- **재합성 지연:** 합성 직후 생성된 새 행성은 짧은 시간 동안 추가 합성 판정을 지연시켜, 겹침으로
  인한 즉시 재합성을 막는다. 지연 시간 값은 [[40-balancing/index]].
- **연쇄 허용:** 위 지연을 둔 채로도 **자연스러운 연쇄 합성은 허용**한다(콤보 보너스는 없음 —
  점수는 [[30-systems/scoring-combo]]).

## Relates to
- [[30-systems/scoring-combo]] — 합성 1건마다 등급 점수, 충돌마다 +1.
- [[30-systems/launch-queue]] — 상위 등급은 큐가 아니라 여기 합성으로만 등장.
- [[40-balancing/launch-physics]] — 최소 속도·재합성 지연 등 물리 튜닝 값.
- [[40-balancing/index]] — 등급별 반지름·점수.
