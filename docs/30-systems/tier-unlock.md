---
id: systems-tier-unlock
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, unlock, progression, modal, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 단계 해금 — 첫 합성 달성 모달 (Tier unlock)

> **준수 기준(방법론):** [[90-methodology/state-machine]] (해금 단계 상태·모달 일시정지) ·
> [[90-methodology/event-driven]] (합성 → 해금 판정).

## Summary

한 단계 위 행성은 **처음 합성으로 만들 때 "달성" 모달**로 해금된다. 새 단계를 처음 만들면 게임이
**일시정지**되고, 화면 중앙에 **그 행성이 회전**하는 딤드 모달이 뜬다. **OK**를 눌러야 그 단계가
해금되어 다음 합성이 진행되고, 그 전까지 그 단계 공끼리는 합성되지 않는다.

## Details (decisions)

- **`unlockedTier` (해금 한계):** 합성으로 만들 수 있는 최고 단계. **새 게임 시작값 = 5(해왕성)**
  (수치 SSoT [[40-balancing/spawn-rack]] `progression`). 매 새 게임마다 시작값으로 초기화된다.
- **합성 게이트:** 두 행성(단계 N)의 합성은 **N ≤ `unlockedTier`** 일 때만 일어난다. 즉 아직
  해금되지 않은 단계(= `unlockedTier`보다 높은 단계) 공끼리는 **합성되지 않는다**.
- **첫 달성 → 모달:** 합성 결과가 `unlockedTier`보다 높은 **새 단계 T**가 생기면(첫 1개는 생성됨),
  즉시 **달성 모달**을 띄우고 게임을 **일시정지**한다. `unlockedTier`는 아직 올리지 않는다.
- **OK → 해금:** 모달의 OK를 누르면 `unlockedTier = T`로 올라가고(다음 단계 합성 해금), 모달이 닫히며
  게임이 재개된다.
- **딤드 = 일시정지:** 모달이 떠 있는 동안 **물리·합성·입력이 모두 정지**한다(회전 행성만 움직인다).
- **새 게임에서만:** 해금 연출은 새 게임 진행 중에만 나온다(세션 내 `unlockedTier`로 추적, 매
  새 게임 초기화).

## 모달 (UX)

- **딤드 오버레이**(반투명 어둠)가 보드를 덮는다.
- **화면 중앙에 해금된 행성**(단계 T 스프라이트)이 **천천히 회전**한다 — 그 외 텍스트/장식은 없다.
- **OK 버튼 1개**. 누르면 해금 + 닫힘 + 재개.

## 큐와의 연동

발사 큐 후보는 해금 단계에 연동된다 — 후보 = `1 … min(unlockedTier − 2, 5)` (정본
[[30-systems/launch-queue]]). 시작 시(`unlockedTier`=5) **수성·화성·금성 3종**, 해금이 오르면 후보가
늘되 **해왕성(5)을 넘지 않는다**.

## Relates to

- [[30-systems/merge-rules]] — 합성 자체(게이트가 얹히는 규칙).
- [[30-systems/launch-queue]] — 해금에 연동된 큐 후보 범위.
- [[40-balancing/spawn-rack]] — `progression` 수치(시작 해금·큐 범위) + 초기 랙.
- [[20-core-loop/screen-flow]] — 씬/일시정지 상태.
