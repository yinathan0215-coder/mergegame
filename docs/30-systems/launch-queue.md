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

발사대는 **현재 발사 행성 하나**를 보여준다. 발사하면 미리 결정해 둔 **Next** 행성이 발사대로
올라오고 새 Next가 뽑힌다(Infinite = 해금 연동 균등 랜덤, Stage = 스테이지 지정 시퀀스). Next는
**좌하단 HUD**에 미리보기로 표시된다([[50-art-ux/layout]]).

## Details (decisions)

- **현재 행성:** 발사대 원 안에 현재 발사 행성 1개를 표시한다.
- **Next 미리보기:** 다음에 발사될 행성(**Next**) 1개를 미리 결정해 **좌하단 HUD**에 미리보기로
  보여준다([[50-art-ux/layout]] · [[30-systems/launch-count]]). 발사대 원에는 현재 행성만 그린다.
- **발사 후 로드:** 발사 시 현재 행성이 나가고 **Next가 현재로** 올라오며, 새 Next 1개가 뽑힌다.
- **Stage 모드 큐:** Stage는 랜덤 대신 스테이지가 지정한 **결정적 큐 시퀀스**를 순서대로 로드한다
  ([[30-systems/stage-mode]]).
- **후보(해금 연동):** 단계 `1 … min(unlockedTier − 2, 5)` 균등 추출. `queueCap=5`는 새 사다리 기준 **지구**다. 시작 시 **소행성·수성·화성 3종**.
  범위·수치 SSoT [[40-balancing/spawn-rack]](`progression`), 해금 메카닉 [[30-systems/tier-unlock]].
- **상위 등급 등장:** **해왕성 · 천왕성 · 토성 · 목성 · 태양 · 블랙홀**은 큐에 안 들어오고 **합성으로만** 등장한다.
- 행성 등급 사다리 순서는 [[10-concept/index]]를 단일 출처로 한다.

## Relates to
- [[30-systems/launcher]] — 현재 발사 행성이 발사된다.
- [[30-systems/launch-count]] — 좌하단에 Next와 함께 표시되는 남은 카운트.
- [[30-systems/stage-mode]] — Stage의 결정적 큐 시퀀스.
- [[30-systems/merge-rules]] — 상위 등급은 합성으로 등장.
- [[40-balancing/index]] — 보충 확률(각 20%).
- [[50-art-ux/index]] — 발사대 현재 행성 표시.
