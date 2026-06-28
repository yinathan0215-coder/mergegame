---
id: systems-index
note_type: index
status: design
domain: systems
updated: 2026-06-28
tags: [systems, merge, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 30 · 시스템 & 메카닉

`Planet Pool Merge`의 코어 루프를 구성하는 상세 시스템 카탈로그. 한 시스템 = 한 페이지.
과제 요구 ③(구현 지시)의 입력이 된다.

> **준수 기준(방법론):** [[90-methodology/ecs-lite]] (오브젝트 분해) · [[90-methodology/game-loop]]
> (실행 순서/Fixed Step) · [[90-methodology/event-driven]] (충돌→합성→점수 통신) ·
> [[90-methodology/state-machine]] (발사 상태) · [[90-methodology/data-driven]] (수치 단일 출처).

> **수치 SSoT 원칙:** 행성 사다리 **순서**는 [[10-concept/index]], 행성별 **수치**(반지름·점수)와
> 랜덤 보충 확률·초기 랙 개수·드래그/파워/쿨다운·물리 튜닝 값은 [[40-balancing/index]],
> 행성별 **아트**(색·패턴)는 [[50-art-ux/index]]가 단일 출처다. 아래 페이지는 규칙만 정의하고
> 수치는 링크한다.

## 시스템 페이지

- [[30-systems/initial-rack]] — §5.1 시작 상태: 중앙 초기 행성 랙 배치 규칙.
- [[30-systems/launcher]] — §5.2 발사: 하단 고정 발사대, 당겨 조준·반대 방향 발사.
- [[30-systems/launch-queue]] — §5.3 발사 행성 선택: 낮은 5종 균등 랜덤.
- [[30-systems/merge-rules]] — §6 합성 규칙: 동급 충돌→다음 등급, 합성 위치/속도/merge lock.
- [[30-systems/scoring-combo]] — §7 점수: 충돌 +1 + 머지 등급 점수.
- [[30-systems/play-area-boundary]] — 플레이 영역 ↔ 발사대 **일방향 경계**(발사는 위로 통과, 진입 후 복귀 불가).
- [[30-systems/collision-shape]] — 행성 충돌 형태: PNG **알파 실루엣** 그대로(토성 띠 포함).

## 관련
- [[20-core-loop/index]] — 이 시스템들이 엮이는 코어 루프.
- [[40-balancing/index]] — 위 규칙들이 참조하는 모든 구체 수치.
- [[60-implementation/index]] — 시스템 → 모듈 매핑(`MergeSystem`/`Launcher`/`QueueSystem` 등).
