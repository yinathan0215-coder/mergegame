---
id: core-loop-index
note_type: index
status: design
domain: core-loop
updated: 2026-06-28
tags: [core-loop, merge, launcher]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 20 · Core Loop & 플레이 흐름

> 과제 요구 ② — *Core Loop 정의 및 플레이 흐름*. 프로토타입이 **플레이 가능**해야 하는
> 최소 단위가 여기서 정의된다.
>
> **준수 기준(방법론):** [[../90-methodology/state-machine]] (흐름·UX·입력/시간) · [[../90-methodology/acceptance-test]] (Core Loop 검증 시나리오).

이 섹션은 **카탈로그**다. Core Loop의 상세는 각 자식 페이지에 둔다. status: `design`.

## 페이지
- [[screen-flow]] — **앱 레벨 씬 흐름**(Loading→Title→Pool In-Game) + 최상위 상태/전이([[../90-methodology/state-machine]] 바인딩), Infinite/Stage 모드 선택 토글.
- [[game-modes]] — **게임 모드**(Infinite/Stage): 모드 선택·시작 카운트·종료 조건·결과창 흐름.
- [[core-loop]] — 8단계 코어 루프(모드가 종료를 정함), 검증축(점수·최고 단계·합성 횟수·블랙홀 달성), MVP 경계(포함/제외).
- [[play-flow]] — 한 세션 흐름(부팅→초기 랙 표시→루프), 시작 상태(초기 랙) 요약, 온보딩(첫 발사가 학습), 시스템 상세 링크.

## 관련
- [[../10-concept/index]] — 컨셉·핵심 재미 가설, 행성 사다리(11단계) 순서 정본
- [[../30-systems/index]] — 루프를 구성하는 시스템 상세(발사대·큐·합성·초기 랙)
- [[../40-balancing/index]] — 단계별 반지름·점수, 보충 확률, 드래그/파워/쿨다운 수치
- [[../60-implementation/task-breakdown]] — 루프를 만드는 단계별 태스크
- [[../70-verification/index]] — "플레이 가능" 합격선(첫 5발 내 1회 합성 등)
