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

# 콤보 제거 + 점수 모델 단순화 (ball-feel 개편)

## Context

기존 점수 = `기본점수(등급) × 콤보배율`. 콤보는 한 발사 안의 연쇄 합성을 1.0/1.2/1.5/2.0x로
보너스. 사용자 판단: **"콤보는 정확성이 있는 시스템이 아님"** — 발사·시간 창에 의존해 의도와
무관하게 붙거나 안 붙어 체감이 불명확. 같은 턴에 ball 물리(더 가볍게·경쾌하게)·머지 방향·연출도
함께 개편.

## Decision

- **콤보 시스템 전면 제거.** `combo`(윈도우·배율)를 `balance.json`·`config`·`ScoreSystem`에서 삭제.
- **점수 = 충돌 +1 + 머지 등급 점수.** 모든 행성–행성 충돌마다 `scoring.collisionPoint`(=1),
  머지 시 생성 등급의 기본 점수(배율 없음, 등급 차등은 유지). 벽·일방향 선 충돌은 점수 제외.
- **머지 결과 속도 = 지배적 운동량 방향**(평균 → 질량×속도가 큰 쪽 속도 이어받기). 정본
  [[../../30-systems/merge-rules]].
- **ball 물리 = 더 가볍게·경쾌하게·강하게.** `frictionAir`↓·`restitution`↑·`vMax`↑ 등.
  정본 [[../launch-physics]].
- **연출 추가.** 머지 스케일 팝·발산 버스트·점수 1단위 오도미터·머지 +N 플로팅. 정본
  [[../../50-art-ux/feedback-effects]], 타이밍 SSoT `balance.json`(`juice`).

## Alternatives

- **콤보 유지/개선(정확도 향상):** 미채택. 사용자가 시스템 자체를 부정. 단순 충돌+머지 점수가
  체감이 명확하고 farming만 막으면 충분.
- **충돌 점수에 벽 충돌 포함:** 미채택. 한 공을 벽에 영원히 튕겨 farming 가능 → 행성–행성만.

## Supersedes

- [[../combo-scoring]] 및 [[../../30-systems/scoring-combo]]의 콤보 배율·윈도우 규칙을 폐기하고
  충돌+1·머지 등급 점수로 대체한다.
- [[../../30-systems/merge-rules]]의 "합성 속도 = 두 속도 평균"을 "지배적 운동량 방향"으로 대체.
