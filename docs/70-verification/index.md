---
id: verification-index
note_type: index
status: design
domain: verification
updated: 2026-06-28
tags: [kpi, checklist, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 70 · 검증 기준 (KPI / 완료 체크리스트)

> 과제 요구 ⑤ — *검증 기준: 프로토타입 완성 여부를 판단할 KPI 또는 체크리스트*.
>
> **준수 기준(방법론):** [[../90-methodology/acceptance-test]] (DoD·검증 시나리오·KPI 수치).
>
> 대상: **GALAXY PINBALL**(내부 디스크립터 Planet Pool Merge) 세로형 물리 머지 프로토타입.
> 클래식 게임 오버(사망)는 없고 **카운트 소진 시 결과/클리어/실패 창**으로 세션이 끝난다
> ([[../20-core-loop/game-modes]]). 점수·최고 달성 행성·합성 횟수·블랙홀 달성 여부로 재미를
> 검증한다 → [[../10-concept/index|컨셉]].

이 섹션은 카탈로그다. 검증 결과·KPI·완료 체크리스트의 상세는 아래 자식 페이지에 둔다.

## 페이지

- [[70-verification/kpi]] — 검증 결과(2026-06-28, Playwright 22/22) + §14 KPI 8개(핵심 재미 가설 검증).
- [[70-verification/checklist]] — §15 완료 체크리스트 16개(부정 항목 포함) + 평가자 관점 매핑.
- [[70-verification/audit-methodology-numbers]] — 방법론·수치 정합 감사(2026-06-28): 수치 SSoT 전부 일치, 방법론 부분 준수, 불일치 3건.

## 감사 로그 (audits/)

코드 ↔ 방법론 **구조** 준수를 날짜·시각 단위로 점수화해 기록한다([[methodology-audit]] 스킬 생성).
위 수치 정합 감사와 별 축 — 이쪽은 단일책임·과집중·상태머신 등 *구조/책임* 준수를 본다. 각 보고서는
우선순위 수정 워크리스트를 담고, 그 워크리스트가 추후 수정 프로세스의 입력이 된다.

- [[70-verification/audits/2026-06-28-1932-methodology-srp-audit]] — 종합 **73/100**. 강점:
  data-driven·Fixed Step·Layered·Acceptance. 약점: 단일책임(GameScene 갓오브젝트 2/5)·State(paused
  불리언 3/5)·Event(카탈로그 부재 3/5). P1: containPlanets 분리, 모달 일시정지 상태화.
- [[70-verification/audits/2026-06-28-2050-docs-code-sync-audit]] — 코드↔문서 정합 감사. 확정 불일치
  53건(orphan-doc 13·doc-ne-code 33·undocumented 6·misclassified 1) + P0~P2 수정 워크리스트.
- [[70-verification/audits/2026-06-28-2314-docs-code-sync-audit]] — 코드↔문서 정합 재감사(게임모드
  레이어 구현 후). 확정 32건(doc-ne-code 21·undocumented 8·misclassified 2·orphan-doc 1). 핵심:
  MVP·범위 펜스 stale(사운드·저장·세션종료·모드 구현됨), 공개명 GALAXY PINBALL 미표기, 모듈맵 8개 누락.
- [[70-verification/audits/2026-06-28-2347-methodology-structure-audit]] — 9기둥+단일책임+karpathy
  구조 감사(@069fa7e). 종합 **69.6/100**(이전 73→하락). 강점: Acceptance·Fixed Step·Event·Layered(4/5).
  약점: 단일책임(GameScene 380→717줄 god-object)·State(paused 불리언 공존)·ECS·SSoT(UI색 141 하드코딩)
  =3/5. P1: GameScene 6모듈 분할·세션 흐름 상태화.
- [[70-verification/audits/2026-06-29-0130-methodology-structure-audit]] — **재감사**(@d55419b, 6 피처
  커밋 후). 종합 **69.6/100**(2347과 동점이나 1·2·4·9차원 밴드 내 악화=추세 하방). GameScene **717→810줄**,
  하드코딩 색 141→**176**·`#49a8e6` 중복 8곳, 세션 플래그 `clearFly` 추가(4개 공존). 구조 수정 0건 →
  P1(GameScene 분할·세션 상태화)을 피처보다 먼저.
- [[70-verification/audits/2026-06-29-0353-methodology-structure-reaudit]] — **수정 후 재감사**(@d959b7a).
  종합 **79.2/100**(0130 69.6 → **+9.6**). D6·D7·D8·D9=5(만점), D4 3→4(phase 상태머신). 커밋 6건
  (4148560·d935d2e·773f668·ace0552·77bf044·d959b7a), Playwright 78/0. 잔여 상한: GameScene god-object
  (D2·D5=3, ~12점)·색/폰트 SSoT island(D1=3, balance.json WIP 차단)·prod 빌드 미검증(D3)·1급 종료상태(D4).

## 관련
- [[../20-core-loop/index]] — KPI가 검증하는 코어 루프.
- [[../30-systems/merge-rules]] — 합성 규칙 검증의 설계 근거.
- [[../40-balancing/index]] — 점수·랜덤 보충 등 검증 수치 출처.
- [[../50-art-ux/index]] — 레이아웃·아트·부정 항목 범위 근거.
- [[../60-implementation/task-breakdown]] — Phase별 완료 판정 동기화.
