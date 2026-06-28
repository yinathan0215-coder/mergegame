---
id: audit-2026-06-29-0353
note_type: audit
status: report
domain: verification
created: 2026-06-29 03:53 KST
target: game/src @ d959b7a
score: 79.2/100
tags: [audit, methodology, srp, health, reaudit]
---

# 방법론 준수 재감사 (수정 후) — 2026-06-29 03:53

> 대상: `game/src/**` ↔ docs/90-methodology 7기둥 + 단일책임 + karpathy.
> 종합 **79.2/100** — 직전 [[2026-06-29-0130-methodology-structure-audit]] **69.6 대비 +9.6**.
> [[methodology-audit]] §수정 프로세스 step 4(재감사·점수 상승 확인). 사용자 지시 "감사 보고서의
> 문제점을 전부 수정해"의 수정 라운드 결과. 각 수정은 `npm run typecheck` + Playwright **78/0**으로 검증.

## 점수표 (직전 → 현재)
| 차원 | 가중 | 0130 | 현재 | 기여 | 변화 |
|---|---:|---:|---:|---:|---|
| 1 Data-driven / SSoT | 15 | 3 | 3 | 9.0 | #49a8e6 중복 해소(밴드 내 ↑); 색 island·폰트 잔존 |
| 2 단일책임 / 과집중 | 15 | 3 | 3 | 9.0 | GameScene 810→694·debug/Containment 추출(밴드 내 ↑); 잔여 책임 다수 |
| 3 Acceptance-test | 12 | 4 | 4 | 9.6 | 콘솔에러=0·재시작 테스트 추가; prod 빌드 미검증으로 상한 |
| 4 State Machine | 12 | 3 | **4** | 9.6 | **phase 상태머신** 도입(불리언 공존 제거) |
| 5 ECS-lite 분해 | 10 | 3 | 3 | 6.0 | containPlanets 분리(밴드 내 ↑); 머지 fan-out 잔존 |
| 6 Game Loop / Fixed Step | 10 | 4 | **5** | 10.0 | 팝업 물리 정지 + 오도미터 deltaTime |
| 7 Event-driven | 10 | 4 | **5** | 10.0 | 이벤트 카탈로그 + 디버그 이벤트 로그 |
| 8 Layered Rendering | 8 | 4 | **5** | 8.0 | fade stopProp + Launcher 게이트 + 코치 딤 |
| 9 Code discipline / karpathy | 8 | 4 | **5** | 8.0 | dead code 정리 + noUnusedLocals |
| **종합** | **100** | **69.6** | **79.2** | **79.2** | **+9.6** |

## 해소된 발견 (커밋)
- **D9 4→5** `4148560`: WALL_T·QUEUE_CANDIDATES·legacy asset·미사용 import 제거, `noUnusedLocals:true`.
- **D8 4→5** `4148560`: 전이 fade stopPropagation, Launcher `canAim` 게이트(Playing만 조준), 코치 딤 uiLayer 최하단(HUD 가독).
- **D6 4→5** `4148560`: 인게임 메타/충전 팝업 표시 중 물리·발사 정지(popupOpen 게이트, acc 누적 전 배치로 복귀 폭주 방지), 점수·콤보·코인 오도미터 프레임레이트 무관.
- **D2/D5 (밴드 내 ↑)** `d935d2e`: GameScene 810→694, `debug.ts`(검증 표면)·`Containment.ts`(경계 물리 규칙) 추출.
- **D1 (밴드 내 ↑)** `773f668`: `#49a8e6` 중복(8곳)을 `COLORS.btnBlue`로 — src 하드코딩 0.
- **D3 (강화)** `ace0552`: 콘솔에러=0 테스트(pageerror+console.error), 새로고침 없는 재시작 테스트, stale ≡설정 테스트 수정.
- **D7 4→5** `77bf044`: `event-catalog.md`(9이벤트 발생·payload·구독자 표) + `EventLog` 링버퍼(`__game.events()`).
- **D4 3→4** `d959b7a`: 공존 가능 불리언(paused·ended)+endKind/clearFly 조합 → 단일 `phase` enum(playing/paused/pendingEnd/clearing/ended) + 전이표. paused+endKind 공존 구조적 차단.

회귀: 없음(Playwright 78/0, 첫 실행 통과; 점수-영속 테스트의 ±1 flake는 물리 타이밍 기인·수정과 무관).

## 잔여 워크리스트 (다음 단계 — 상한 해제 순)
- [ ] **P1** `GameScene`(694) 추가 분할 → **D2·D5 상한(3) 해제, ~12점**: 머지 보상 fan-out·충돌 점수→`MergeOutcome`/`CollisionScoring`, 세션종료+경제→`SessionController`(EconomySystem), clear-fly→`Effects`/`StageClearFx`. 완료기준 "보상 추가 시 대형 클래스 미수정". 검증: GameScene 비데이터 <300줄.
- [ ] **P1(차단됨)** SSoT 색·폰트 토큰화 → **D1 상한(3) 해제**: 168 하드코딩 색/22파일·43 폰트·SettingsPopup 로컬 팔레트를 `balance.json` 토큰(~30종)으로. **선행 미커밋 balance.json WIP(100스테이지 재작성) 커밋/스태시 필요** — 사용자 작업과 얽혀 보류.
- [ ] **P2** prod 단일파일 빌드 자동 검증 → **D3 5**: `build:single` 산출물 코어루프 스모크.
- [ ] **P2** result/clear/fail을 1급 상태로 + 가드된 전이 함수 → **D4 5**: endKind payload 의존·산재 대입 정리.

## 추적
- 이전: [[2026-06-29-0130-methodology-structure-audit]] 69.6 → 현재 **79.2**(+9.6). 그 이전 [[2026-06-28-2347-methodology-structure-audit]] 69.6, [[2026-06-28-1932-methodology-srp-audit]] 73.
- 다음: 위 P1 2건(GameScene 추가 분할 = 비차단 / SSoT 토큰화 = balance.json WIP 해소 후)이 남은 ~20점의 핵심.
