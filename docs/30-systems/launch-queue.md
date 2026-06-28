---
id: systems-launch-queue
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, random, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 발사 행성 선택 — 해금 연동 랜덤 (§5.3)

> 과제 요구 ③ — 구현 지시의 입력(발사 행성 선택/랜덤 생성).
>
> **준수 기준(방법론):** [[90-methodology/data-driven]] (보충 확률 = 데이터 테이블) ·
> [[90-methodology/event-driven]] (발사 이벤트 → 다음 행성 로드).

## Summary

발사대는 **현재 발사 행성 하나**를 보여준다. 발사하면 **해금 단계에 연동된 낮은 단계**에서 균등
랜덤으로 뽑은 새 행성이 발사대에 로드된다.

## Details (decisions)

- **현재 행성:** 발사대 원 안에 현재 발사 행성 1개를 표시한다.
- **발사 후 로드:** 발사 시 현재 행성이 나가고 새 랜덤 행성 1개가 발사대에 로드된다.
- **후보(해금 연동):** 단계 `1 … min(unlockedTier − 2, 5)` 균등 추출. 시작 시 **수성·화성·금성 3종**.
  범위·수치 SSoT [[40-balancing/spawn-rack]](`progression`), 해금 메카닉 [[30-systems/tier-unlock]].
- **상위 등급 등장:** **천왕성 · 토성 · 목성 · 태양**은 큐에 안 들어오고 **합성으로만** 등장한다.
- 행성 등급 사다리 순서는 [[10-concept/index]]를 단일 출처로 한다.

## Relates to
- [[30-systems/launcher]] — 현재 발사 행성이 발사된다.
- [[30-systems/merge-rules]] — 상위 등급은 합성으로 등장.
- [[40-balancing/index]] — 보충 확률(각 20%).
- [[50-art-ux/index]] — 발사대 현재 행성 표시.
