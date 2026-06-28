---
id: adr-2026-06-28-remove-combo
note_type: decision
status: active
domain: balancing
updated: 2026-06-28
tags: [scoring, combo, ball-feel, adr]
sources:
  - "[[../../00-meta/input-log/2026-06-28]]"
  - "raw: game/src/data/balance.json"
---

# 점수 모델 — 충돌 + 머지 + 콤보 마일스톤 보너스 (ball-feel 개편)

## Context

콤보를 **점수 배율**(한 발사 내 연쇄에 1.0/1.2/1.5/2.0x)로 두면 발사·시간 창에 의존해 의도와
무관하게 붙거나 안 붙어 체감이 불명확하다 — 정확성이 낮다. 그래서 배율 방식 대신 **결정적인
마일스톤 정액 보너스**로 콤보를 설계하고, 같은 턴에 ball 물리(더 가볍게·경쾌하게)·머지 방향·
연출도 함께 개편했다.

## Decision

- **점수 = 충돌 + 머지 등급 점수 + 콤보 마일스톤 보너스.**
  - **충돌:** `scoring.minImpact`(=3.5) 이상으로 부딪힐 때, **벽·발사대 원 충돌 +1**(`scoring.wallPoint`),
    **행성–행성 충돌 +3**(`scoring.ballPoint`). 저강도 접촉(굴러다님)은 점수 없음 → 벽 farming 차단.
  - **머지:** 생성 등급의 기본 점수(`planets[].score`, 배율 없음, 등급 차등 유지).
  - **콤보:** 연속 머지 체인이 `juice.combo.step`(=5)의 배수일 때 **`콤보값 × juice.combo.bonusPer`**(=400)
    정액 가산. 배율이 아니라 결정적 마일스톤. 값 SSoT [[../combo-scoring]] · `juice.combo`.
- **머지 결과 속도 = 지배적 운동량 방향**(질량×속도가 큰 쪽 속도 이어받기). 정본
  [[../../30-systems/merge-rules]].
- **ball 물리 = 더 가볍게·경쾌하게·강하게.** `frictionAir`↓·`restitution`↑·`vMax`↑ 등.
  정본 [[../launch-physics]].
- **연출.** 머지 스케일 팝·발산 버스트·점수 1단위 오도미터·머지 +N·콤보 +N 플로팅. 정본
  [[../../50-art-ux/feedback-effects]], 타이밍 SSoT `balance.json`(`juice`).

## Alternatives

- **콤보 점수 배율 유지:** 미채택. 발사·시간 창 의존으로 체감이 불명확 → 결정적 마일스톤 보너스로 대체.
- **벽 충돌 점수 제외(행성 충돌만):** 미채택. `minImpact` 게이트가 저강도 벽 farming을 막으므로,
  벽 충돌도 약하게(+1)만 점수를 줘 타격 피드백을 일관되게 한다(행성 충돌은 +3).

## Supersedes

- [[../combo-scoring]] · [[../../30-systems/scoring-combo]]의 **콤보 점수 배율·윈도우** 규칙을
  마일스톤 정액 보너스로 대체.
- [[../../30-systems/merge-rules]]의 "합성 속도 = 두 속도 평균"을 "지배적 운동량 방향"으로 대체.
