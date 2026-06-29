---
id: verification-index
note_type: index
status: design
domain: verification
updated: 2026-06-29
tags: [kpi, checklist, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 70 · 검증 기준 (KPI / 완료 체크리스트)

> 문서 범위 ⑤ — *검증 기준: 프로토타입 완성 여부를 판단할 KPI 또는 체크리스트*.
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
- [[70-verification/audits/2026-06-29-0436-methodology-structure-reaudit2]] — **GameScene 분해 후 재감사**(@237903f).
  종합 **84.2/100**(0353 79.2 → **+5**, 누적 69.6→84.2 **+14.6**). GameScene 810→617, 5모듈 추출
  (debug·Containment·StageClearFx·MergeOutcome·Economy) → D2·D5 3→4(god-object 해소). Playwright 78/0.
  잔여: D1=3(SSoT 토큰화, balance.json WIP 차단)·D2/D3/D4/D5 4→5 폴리시(SessionController·prod 스모크·1급 종료상태).
- [[70-verification/audits/2026-06-29-0459-methodology-structure-reaudit3]] — **수정 완료 재감사**(@0f12f5f).
  종합 **89.0/100**(0436 84.2 → +4.8, 누적 69.6→89.0 **+19.4**). D3(prod 빌드 스모크)·D4(1급 종료상태+가드
  setPhase) → 5 ⇒ **6차원 만점**. Playwright 80/0, 회귀 0. 잔여: **D1=3 차단**(balance.json WIP)·D2·D5=4
  (과분할 회피 판단). 11 수정 커밋(4148560…0f12f5f).
- [[70-verification/audits/2026-06-29-0520-methodology-structure-reaudit4]] — **재감사**(@67bb6b5).
  종합 **91.0/100**(0459 89.0 → +2, 누적 69.6→91.0 **+21.4**). PlanetSystem 추출(엔티티/렌더 시스템) → D5 4→5
  ⇒ **7차원 만점**. GameScene 810→570(6모듈). Playwright 80/0.
- [[70-verification/audits/2026-06-29-0706-methodology-structure-final-100]] — **완료**(@ecfbe7c).
  종합 **100.0/100 — 9차원 전부 만점**(0536 91.0 → +9, 누적 69.6→100 **+30.4**). 마지막: D1 전 UI 색·폰트
  SSoT 토큰화(balance.json 82색+type 스케일) → 5, D2 잔여 메카닉 추출(RackBuilder·LaunchController·terminal)
  → 5. GameScene 810→481(9모듈), 21 수정 커밋, Playwright 80/0, 회귀 0. **모든 문제 해결 완료**.
- [[70-verification/audits/2026-06-29-0536-methodology-structure-reaudit5]] — **종결 재감사**(@ad35999).
  종합 **91.0 유지**. 비차단 잔여였던 D2 세션종료 흐름을 SessionController로 실제 추출(D4=5 보존 — setPhase 단일
  가드점 유지). D2는 **4 천장 확정**(잔여 fire·rack·charge·terminal은 실 메카닉, 추가 분리=과분할). GameScene
  810→547(7모듈), 17 수정 커밋, Playwright 80/0. **유일 잔여 D1=3은 balance.json WIP 차단**.

## 관련
- [[../20-core-loop/index]] — KPI가 검증하는 코어 루프.
- [[../30-systems/merge-rules]] — 합성 규칙 검증의 설계 근거.
- [[../40-balancing/index]] — 점수·랜덤 보충 등 검증 수치 출처.
- [[../50-art-ux/index]] — 레이아웃·아트·부정 항목 범위 근거.
- [[../60-implementation/task-breakdown]] — Phase별 완료 판정 동기화.
