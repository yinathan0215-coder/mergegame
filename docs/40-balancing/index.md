---
id: balancing-index
note_type: index
status: design
domain: balancing
updated: 2026-06-28
tags: [balancing, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 40 · 밸런싱 수치

> 과제 요구 ④-a — *에이전트가 스스로 판단하기 어려운 영역: 밸런싱 수치*. 에이전트가
> 추측하면 안 되는 모든 구체 수치를 **명시적으로** 못 박는 곳.
>
> **준수 기준(방법론):** [[../90-methodology/data-driven]] (단일 출처·값+단위+의도·공식).

이 섹션은 `Planet Pool Merge`의 **수치 단일 출처(SSoT) 홈**이다. 행성별 반지름·기본 점수,
큐 랜덤 확률, 초기 랙 구성, 발사 튜닝, 물리 휴리스틱은 **여기 자식 페이지에만**
적는다. 다른 섹션은 이 수치를 **링크**하고 값을 복제하지 않는다.

- 행성 사다리 **순서(9단계)** 의 정본: [[../10-concept/planet-ladder]] (여기서는 참조만).
- 행성 **색/패턴** 의 정본: [[../50-art-ux/planet-art]] (여기서는 참조만).

## 페이지

- [[planet-stats]] — 행성 단계별 반지름·기본 점수 표(수성=점수 없음 명시) + 점수 부여 규칙 + 반지름 스케일링.
- [[combo-scoring]] — 점수 수치(충돌 +1 · 머지 등급 점수).
- [[spawn-rack]] — 발사 행성 랜덤 확률(낮은 5종 20%) + 초기 랙 구성(수성4·화성3·금성2·지구1).
- [[launch-physics]] — 발사 튜닝(드래그/파워/V_max/쿨다운) + 물리·밸런싱 휴리스틱(증상→조치) + 달성 목표 + 물리 계수(현재 구현값).

## 상태

`status: design` — 수치 사양 확정. 발사·물리 계수(`V_max`·발사 쿨다운·마찰·반발)의 현재 구현값은
[[launch-physics]] "물리 계수(현재 구현값)" 표와 `game/src/data/balance.json`이 단일 출처이며,
손맛 튜닝은 [[balance-tune]] 스킬로 수행한다.

## 관련

- [[../10-concept/planet-ladder]] — 행성 사다리 9단계 **순서** 정본 (이 섹션은 수치만 소유)
- [[../50-art-ux/planet-art]] — 행성 **색·패턴** 정본
- [[decisions/2026-06-28-remove-combo]] — 콤보 제거 ADR
- [[../30-systems/index]] — 이 수치가 적용되는 합성/발사/큐 시스템 규칙
- [[../70-verification/index]] — 이 수치가 만드는 체감의 합격 기준 (KPI)
- [[../90-methodology/data-driven]] — 수치 단일 출처·데이터 주도 표준
