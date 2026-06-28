---
id: systems-initial-rack
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, merge, initial-state, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 시작 상태 — 중앙 초기 랙 (§5.1)

> 과제 요구 ③ — 구현 지시의 입력(시작 상태 규칙).
>
> **준수 기준(방법론):** [[90-methodology/data-driven]] (초기 배치 = 데이터 테이블).

## Summary

빈 보드로 시작하지 **않는다**. 첫 발사부터 충돌·합성이 일어나도록, 보드 중앙보다 약간 위쪽에
포켓볼 랙처럼 초기 행성 풀을 미리 배치한다.

## Details (decisions)

- **배치 위치:** 보드 중앙보다 **약간 위쪽**에 벌집형(honeycomb) 또는 삼각 랙 형태로 배치한다.
- **기본 배치 구성:** 수성 / 화성 / 금성 / 지구만 사용한다. 각 등급 **개수의 SSoT는
  [[40-balancing/index]]** (기본값: 수성4·화성3·금성2·지구1).
- **겹침 방지:** 행성끼리 겹치지 않도록 최소 간격을 두고 배치한다. 최소 간격 값은
  [[40-balancing/index]]를 따른다.
- **밀도:** 첫 발사 후 **바로 충돌이 발생할 정도**로 충분히 밀도 있게 모아 배치한다.
  (검증: 첫 5회 발사 내 1회 이상 합성 — [[70-verification/index]].)
- **등급 상한:** **해왕성 이상(해왕성·천왕성·토성·목성·태양)은 시작 배치에 넣지 않는다.**
- 행성 등급 사다리 순서는 [[10-concept/index]]를 단일 출처로 한다.

## Relates to
- [[30-systems/launcher]] — 첫 발사가 이 랙에 충돌한다.
- [[30-systems/merge-rules]] — 랙에서 일어나는 동급 충돌의 합성 규칙.
- [[40-balancing/index]] — 개수·간격·반지름 수치.
