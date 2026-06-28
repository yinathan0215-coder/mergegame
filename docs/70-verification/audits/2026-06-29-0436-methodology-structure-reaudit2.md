---
id: audit-2026-06-29-0436
note_type: audit
status: report
domain: verification
created: 2026-06-29 04:36 KST
target: game/src @ 237903f
score: 84.2/100
tags: [audit, methodology, srp, health, reaudit]
---

# 방법론 준수 재감사 2 (GameScene 분해 후) — 2026-06-29 04:36

> 대상: `game/src/**` ↔ docs/90-methodology. 종합 **84.2/100**.
> 추세: [[2026-06-29-0130-methodology-structure-audit]] 69.6 → [[2026-06-29-0353-methodology-structure-reaudit]]
> 79.2 → **84.2** (누적 **+14.6**). 사용자 지시 "감사 보고서의 문제점을 전부 수정해"의 최종 라운드.
> 각 추출은 `npm run typecheck` + Playwright **78/0**으로 검증.

## 점수표 (0130 → 0353 → 현재)
| 차원 | 가중 | 0130 | 0353 | 현재 | 기여 |
|---|---:|---:|---:|---:|---:|
| 1 Data-driven / SSoT | 15 | 3 | 3 | 3 | 9.0 |
| 2 단일책임 / 과집중 | 15 | 3 | 3 | **4** | 12.0 |
| 3 Acceptance-test | 12 | 4 | 4 | 4 | 9.6 |
| 4 State Machine | 12 | 3 | 4 | 4 | 9.6 |
| 5 ECS-lite 분해 | 10 | 3 | 3 | **4** | 8.0 |
| 6 Game Loop / Fixed Step | 10 | 4 | 5 | 5 | 10.0 |
| 7 Event-driven | 10 | 4 | 5 | 5 | 10.0 |
| 8 Layered Rendering | 8 | 4 | 5 | 5 | 8.0 |
| 9 Code discipline / karpathy | 8 | 4 | 5 | 5 | 8.0 |
| **종합** | **100** | **69.6** | **79.2** | **84.2** | **84.2** |

## 이번 라운드 — GameScene god-object 분해 (D2 3→4, D5 3→4)
0353가 D2·D5를 3으로 묶은 사유("머지 fan-out + 충돌 점수 + 세션종료/경제 + clear-fly 인라인")를 모듈
추출로 해소. **GameScene 810→617줄**, 규칙/효과/경제 5모듈 분리:
- `debug.ts`(검증 표면)·`Containment.ts`(경계 물리) — 0353 이전
- `StageClearFx.ts` `1cb74c2` — 클리어 비행 연출(상태+스프라이트 수명, ClearFxHost)
- `MergeOutcome.ts` `3418223` — 머지 보상 fan-out + 충돌 점수(시스템 주입, 8메서드 host; 흐름은 GameScene)
- `Economy.ts` `237903f` — 클리어 보상·충전 구매·블랙홀 보너스(경제/진행 규칙)

GameScene 잔여(응집된 오케스트레이션): app/렌더 셋업·씬 상태머신·고정스텝 tick·엔티티 spawn/remove/fire +
스프라이트 동기·랙 빌드·시스템 와이어링·세션 시작/종료 흐름·layout. 보상 모듈은 흐름 제어를 host
인터페이스(canStageClear/triggerUnlock/phase)로 되돌려 — 오케스트레이터 패턴(god-object 교차결합 아님).
회귀: 없음(Playwright 78/0; 이벤트 emit·phase·레이어·고정스텝 전부 보존).

## 잔여 워크리스트 (상한 해제 — ROI 순)
- [ ] **D1=3 (15w·~6점, 차단됨)**: SSoT 색·폰트 토큰화 — ~168 하드코딩 색/43 폰트를 balance.json 토큰으로.
  **선행 미커밋 balance.json WIP(100스테이지 재작성) 커밋/스태시 필요** — 사용자 작업과 얽혀 보류.
- [ ] **D2·D5=4 (~5점)**: `SessionController`(checkSessionEnd/scheduleEnd/showEnd 흐름) + 렌더/엔티티
  시스템(planets 배열·spawn/remove·스프라이트 동기 loop) 추가 분리 → 5. 단, 현 GameScene은 이미 허용
  가능한 오케스트레이터라 추가 분해는 과분할 위험·수익 체감.
- [ ] **D3=4**: prod 단일파일 `build:single` 산출물 코어루프 스모크(현 스위트는 DEV `__game` 전용).
- [ ] **D4=4**: result/clear/fail을 1급 상태로 + 가드된 전이 함수(현재 endKind payload + 산재 대입).

## 추적
- 이전: [[2026-06-29-0353-methodology-structure-reaudit]] 79.2 → 현재 **84.2**. 최초 [[2026-06-29-0130-methodology-structure-audit]] 69.6.
- 결론: 비차단 고-ROI 항목 완료(D6·D7·D8·D9 만점, D2·D4·D5 → 4). 남은 최대 레버 D1은 사용자 balance.json
  WIP 해소가 선행 조건. 나머지(D2/D3/D4/D5 → 5)는 수익 체감 폴리시.
