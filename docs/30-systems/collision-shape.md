---
id: systems-collision-shape
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, collision, physics, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 행성 충돌 형태

> **준수 기준(방법론):** [[90-methodology/data-driven]] · [[90-methodology/ecs-lite]].

## Summary

행성의 충돌 바디는 **그 단계 반지름의 원**이다. 스프라이트 이미지가 원 밖으로 더 그려져도(예:
토성 띠) 충돌은 **디스크(원)** 기준으로 처리한다. 충돌 반지름은 단계별 데이터(`planets[].radius`).

## Details (decisions)

- **충돌 = 원형 디스크.** 모든 행성은 `radius` 크기의 Matter `Bodies.circle`로 충돌한다. 합성·경계
  반사·점수 충돌 판정 모두 이 원을 쓴다.
- **이미지는 원보다 클 수 있다.** 토성 띠처럼 스프라이트가 반지름 밖으로 나가도 그 부분은 **시각
  전용**이며 충돌하지 않는다(충돌은 디스크).
- **반지름은 데이터.** 단계별 충돌 반지름의 SSoT는 [[40-balancing/planet-stats]](`balance.json`).

## Relates to

- [[40-balancing/planet-stats]] — 단계별 충돌 반지름.
- [[play-area-boundary]] · [[merge-rules]] — 이 원이 부딪히는 경계·합성.
- [[50-art-ux/planet-art]] — 행성 이미지(시각, 충돌과 별개).
