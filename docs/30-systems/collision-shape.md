---
id: systems-collision-shape
note_type: system
status: draft
domain: systems
updated: 2026-06-28
tags: [systems, collision, physics, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 행성 충돌 형태 (이미지 종속)

> **준수 기준(방법론):** [[90-methodology/data-driven]] (충돌 형태 = 데이터) · [[90-methodology/ecs-lite]].

## Summary

행성의 충돌 범위는 **이미지(스프라이트)의 생김새를 따른다.** 원형 행성은 원으로, 비원형 실루엣을
가진 행성은 그 형태대로 충돌한다(예: 토성은 띠가 있어 원형이 아니다).

## Details (decisions)

- **충돌 형태 = 시각 실루엣.** 각 단계의 충돌 바디는 그 행성 스프라이트의 외곽 형태와 일치한다.
  렌더(스프라이트)와 충돌(물리 바디)이 **같은 형태 정의**를 참조한다.
- **단계별 형태는 데이터로 둔다.** `balance.json`이 단계별 충돌 형태(원 반지름 / 폴리곤·타원
  파라미터)를 소유하고, `PhysicsWorld`가 그 데이터로 바디를 만든다. 실루엣 정본은 [[50-art-ux/planet-art]].

## Open questions

- 비원형 행성별 **정확한 충돌 형태** 미정: 토성 띠 = 타원인가, 디스크+띠 복합 바디인가, 폭/높이
  비율은 얼마인가. 다른 단계도 실루엣 기준으로 형태 파라미터를 확정해야 한다(`status: draft`).
- 충돌 형태가 비원형이면 [[play-area-boundary]] 경계 clamp와 [[merge-rules]] 합성 위치가 현재
  **반지름** 기준이므로, 외접 반지름 사용 등 처리 방식을 함께 확정한다.

## Relates to

- [[50-art-ux/planet-art]] — 행성별 실루엣(색·패턴) 정본.
- [[play-area-boundary]] · [[merge-rules]] — 충돌 형태가 영향을 주는 경계·합성.
- [[40-balancing/index]] — 단계별 반지름·형태 데이터.
