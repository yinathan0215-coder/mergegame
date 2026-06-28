---
id: audit-2026-06-28-1932
note_type: audit
status: report
domain: verification
created: 2026-06-28 19:32 KST
target: game/src @ 3ab901e (+ 미커밋 변경)
score: 73/100
tags: [audit, methodology, srp, health]
---

# 방법론 준수 감사 — 2026-06-28 19:32

> 대상: `game/src/**` (19 .ts + `balance.json` / ~2,224줄) ↔ [[../../90-methodology/index]] 7기둥
> + 단일책임 + karpathy. 종합 **73/100**.
> **감사 보고서(읽기 전용 진단)** — 수정은 §수정 워크리스트를 별도 단계에서 수행한다.
> 생성: [[methodology-audit]] 스킬. 숫자(밸런스) 감사는 별건 → [[audit-methodology-numbers]].

## 점수표

| 차원 | 가중 | 점수(0–5) | 기여 | 근거(file:line) |
|---|---:|---:|---:|---|
| Data-driven / SSoT | 15 | 4 | 12.0 | `balance.json` 정본 + `config.ts`/`planets.ts` 순수 로더·guard. 누수: `TitleScreen.ts` 전체 레이아웃·색 하드코딩(352/426/512, `0x2f86cf`…), `PlanetFactory.ts:5` 단계별 지름표 |
| **단일책임 / 과집중** | 15 | 2 | 6.0 | `GameScene.ts`(380줄) ≥5책임 갓오브젝트; `TitleScreen.ts`(294줄) 궤도 시뮬+UI 혼재 |
| Acceptance-test / 검증 | 12 | 4 | 9.6 | `play.spec.ts`(175줄) 관찰가능 Core-Loop 테스트 + `GameScene.exposeDebug`. 갭: TTF KPI·결과/재시작 테스트 없음 |
| State Machine | 12 | 3 | 7.2 | 씬 2상태+전이는 문서화. 위반: `GameScene.ts:59` `paused` 불리언으로 모달 일시정지(상태 아님) |
| ECS-lite 분해 | 10 | 4 | 8.0 | `Planet.ts` thin entity, `*System` 분리, 렌더=읽기전용. 감점: GameScene가 규칙 보유(containPlanets) |
| Game Loop / Fixed Step | 10 | 5 | 10.0 | `GameScene.ts:309-318` accumulator+`STEP_MS`+5스텝 상한+acc 클램프, 전부 시간기준 |
| Event-driven | 10 | 3 | 6.0 | 직접 결합 0(좋음) but 이벤트 카탈로그 없음·전부 GameScene 허브 콜백 |
| Layered Rendering | 8 | 5 | 8.0 | `GameScene.ts:31-37` 정렬 레이어, 모달 dim·HUD `stopPropagation`·fade 입력차단 |
| Code discipline (karpathy) | 8 | 4 | 6.4 | 죽은 데이터: `planets.ts` `pattern`/`PatternKind` 정의만·미사용(렌더는 PNG); `balance.json` tier-6 `"thinRingStripes"` union 밖 |
| **종합** | **100** | | **73** | |

## 발견 (severity 순)

### 🔴 GameScene = 갓오브젝트 (5책임) — 단일책임/과집중
- 증거: `GameScene.ts` 380줄이 ① 시스템 생성·충돌 라우팅·unlock 모달 로직 ② 엔티티 생명주기
  (`spawnPlanet`/`removePlanet`) ③ **해석적 경계 물리**(`containPlanets` ~30줄) ④ 씬 전이 FSM
  (`setScene`/`applyScene`/`updateTransition`) ⑤ fixed-step 루프+렌더 동기화, +`fitCanvas`(DOM)
  +`exposeDebug`(~50줄)를 모두 보유.
- 방법론 위반: [[../../90-methodology/ecs-lite]] "금지 안티패턴 — GameManager 하나가 입력·밸런스·
  렌더·UI·전투·저장을 모두 처리"; [[../../60-implementation/architecture]]는 GameScene을 "한 가지
  책임"이라 *주장*하나 현재는 거짓.
- 영향: 새 규칙·연출 추가 시 거대 클래스 수정 강제, 충돌 위험·테스트 곤란.

### 🔴 단일책임 원칙이 명시돼 있으나 검증되지 않음 — (메타) 단일책임
- 증거: 방법론·architecture는 SRP를 명시하지만 이를 검사하는 게이트가 없어 위 380줄이 무경보 통과.
- 영향: 이 감사 스킬([[methodology-audit]])이 그 enforcement 층. 보강은 §방법론/규약 참고.

### 🟡 모달 일시정지를 상태가 아니라 boolean으로 — State Machine
- 증거: `GameScene.ts:59` `private paused = false; // unlock 모달 중 게임 프리즈`.
- 방법론 위반: [[../../90-methodology/state-machine]] "`isPlaying`/`isPaused`가 동시 true 가능 —
  boolean 플래그 조합으로 흐름 암묵화 금지". [[../../20-core-loop/screen-flow]] 상태표에 이 일시정지
  상태가 없음(미문서화 상태).
- 영향: tier-unlock 모달 흐름이 상태머신 밖. 향후 다른 모달 추가 시 플래그 누적.

### 🟡 이벤트 카탈로그 부재 — Event-driven
- 증거: 시스템 통신이 DI 콜백(`MergeHost`/`LauncherHost`/`onChange`/`onMerge`/`onCollision`)으로
  전부 `GameScene`을 경유. 직접 결합은 없으나 명명된 이벤트·payload·구독자 표가 없음.
- 방법론 위반: [[../../90-methodology/event-driven]] 이벤트 카탈로그 표준 미인스턴스화
  ([[../../30-systems/index]]가 바인딩만 선언). 콜백 허브가 §🔴 GameScene 집중을 가중.

### 🟡 TitleScreen = un-tabled 상수 섬 + 비기능 장식 — Data-driven / 과집중
- 증거: `TitleScreen.ts`(294줄)가 레이아웃 좌표·색을 `balance.json` 밖에 하드코딩, 궤도 시뮬과
  UI 빌드를 한 파일에 혼재. 📋일일미션·🛒상점·📅출석·🎡돌림판은 기능 없는 장식.
- 방법론 위반: [[../../90-methodology/data-driven]] "조정 가능한 값은 단일 데이터 출처";
  [[../../90-methodology/agent-friendly-spec]] §원칙3 Scope Fence.

### 🟡 죽은 데이터: `pattern` / `PatternKind` — Code discipline
- 증거: `planets.ts`가 `pattern` 필드+9-값 union을 정의하나 어느 렌더도 읽지 않음(`PlanetFactory`는
  PNG 스프라이트). `balance.json` tier-6 `"thinRingStripes"`는 union에 없음(`as` 캐스트라 무검출).
- 방법론 위반: karpathy §2 Simplicity(미사용 제거). `colors`는 `Effects` 사용 中 — 살아있음.

### 🟡 architecture.md가 코드에 뒤처짐 — (문서 reconcile)
- 증거: [[../../60-implementation/architecture]] "9개 모듈"이라 하나 코드는 19파일; "Hud=머니·랭킹"
  이라 하나 코드·커밋(`9f61281`)은 money/ranking 제거됨.
- 영향: 정본 문서가 거짓을 주장 → 에이전트 오인. 분리 리팩터 시 함께 reconcile.

## 수정 워크리스트 (우선순위 · 다음 단계 입력)

- [ ] **P1** `GameScene`에서 `containPlanets`(해석적 경계 물리)를 `PhysicsWorld` 또는
      `BoundarySystem`으로 이동 — 검증: `play.spec.ts` "누출 없음" green 유지 + typecheck.
- [ ] **P1** 모달 일시정지를 `paused` 불리언 대신 씬/상태로 모델링(예: `UnlockPause` 상태) —
      검증: [[../../20-core-loop/screen-flow]] 상태표 reconcile 먼저 → 모달 중 입력차단 테스트.
- [ ] **P2** `GameScene.exposeDebug`(~50줄)를 별도 `debugHooks.ts`로 분리(테스트 전용 표면) —
      검증: `play.spec.ts`의 `__game.*` 호출 그대로 통과.
- [ ] **P2** `TitleScreen` 레이아웃·색 상수를 `balance.json`(또는 `titleConfig`)로 추출 —
      검증: 타이틀 렌더 동일 + 하드코딩 리터럴 grep 0.
- [ ] **P3** 죽은 `pattern` 필드/`PatternKind` 제거 또는 실제 사용 — 검증: typecheck + 미사용 grep.
- [ ] **P3** [[../../60-implementation/architecture]] 모듈표(9→실제) + Hud 책임 reconcile.
- [ ] **P3** Event Catalog 표를 `30-systems`에 인스턴스화하거나, 콜백 경계를 명시 문서화.

## 추적

- 이전 감사: 최초(이 도메인). 밸런스 숫자 감사는 [[audit-methodology-numbers]](별 축).
- 다음: 위 P1부터 **수정 프로세스**([[methodology-audit]] SKILL "수정 프로세스") 진행 → 각 수정 후
  해당 차원 재채점하여 73→ 상승 확인. 목표: 단일책임 2→4, State 3→4.
