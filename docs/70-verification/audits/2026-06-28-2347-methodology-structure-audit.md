---
id: audit-2026-06-28-2347
note_type: audit
status: report
domain: verification
created: 2026-06-28 23:47 KST
target: game/src @ 069fa7e
score: 69.6/100
tags: [audit, methodology, srp, health]
---

# 방법론 준수 감사 — 2026-06-28 23:47

> 대상: `game/src/**` (38 TS + balance.json / 5248줄) ↔ docs/90-methodology 7기둥 + 단일책임 + karpathy.
> 종합 **69.6/100**. **감사 보고서(읽기 전용 진단)** — 수정은 §수정 워크리스트를 별도 단계에서.
>
> 방법: 9개 차원을 차원별 독립 에이전트가 채점 → 차원별 독립 회의론자가 file:line·방법론 인용을
> 재검증(점수 9건 중 9건 회의론자 확정, 단 1건도 번복 없음). data-driven 채점 에이전트가 플레이스홀더를
> 반환해 그 회의론자가 실분석을 재구성했고, karpathy(차원 9)는 원 에이전트의 StructuredOutput 실패 후
> 단일패스로 복구 채점(독립 검증 없음). 점수는 모두 **검증 후 점수**.

## 점수표
| 차원 | 가중 | 점수(0–5) | 기여 | 근거(file:line) |
|---|---:|---:|---:|---|
| 1 Data-driven / SSoT | 15 | 3 | 9.0 | 게임플레이 데이터층 모범(planets.ts:43-48 무결성 가드) but UI/팝업층 SSoT 광범위 누수(141색/19파일) |
| 2 단일책임 / 과집중 | 15 | 3 | 9.0 | `GameScene.ts:42-717` 6범주 혼재 god-object(380→717줄 악화) vs ~35개 모듈은 단일책임 |
| 3 Acceptance-test / 검증 | 12 | 4 | 9.6 | `play.spec.ts`·`stages.spec.ts` 실빌드 코어루프 관찰검증; 콘솔에러=0·KPI수치·prod빌드 미커버 |
| 4 State Machine | 12 | 3 | 7.2 | Scene층은 실 FSM(`GameScene.ts:30,255-310`) but 세션 내 흐름은 `paused/ended/endKind` 불리언 |
| 5 ECS-lite 분해 | 10 | 3 | 6.0 | Planet 얇은 엔티티·System 깨끗 but 머지보상이 `GameScene.ts:145-183` 단일 클로저 집중 |
| 6 Game Loop / Fixed Step | 10 | 4 | 8.0 | 교과서적 고정스텝 누적·catch-up 상한(`GameScene.ts:568-577`); 오도미터 per-frame·팝업 미정지 누수 |
| 7 Event-driven | 10 | 4 | 8.0 | 시스템 간 직접결합 0·실 Observer(`MetaStore.ts:74-81`); 이벤트 카탈로그 부재(부분점수 상한) |
| 8 Layered Rendering | 8 | 4 | 6.4 | 고정 레이어 스택·모달 입력차단 모범(`GameScene.ts:108`); 전환 fade·Launcher 입력 미게이트 |
| 9 Code discipline / karpathy | 8 | 4 | 6.4 | `tsc --noEmit` clean·vestigial 필드 0; dead export 2·unused import 2·과다 export |
| **종합** | **100** | | **69.6** | |

## 발견 (severity 순)

### 🔴 GameScene.ts 717줄 god-object — 시뮬레이션+렌더+입력+UI+수명+디버그 한 파일 혼재 — 단일책임 · ECS-lite
- 증거: `game/src/GameScene.ts:42-717` (scene FSM 255-310 · 시스템 와이어링 120-248 · 머지 오케스트레이션 137-184 · 충돌→점수 라우팅 185-202 · 발사/spawn/remove 312-369 · 랙 빌드 371-405 · 세션 수명 409-436 · 종료·보상 473-510 · 물리 경계 518-547 · 게임루프+렌더 동기 549-602 · 디버그 API 622-716)
- 방법론 위반: [[../../90-methodology/ecs-lite]] "`GameManager` 하나가 입력·밸런스·렌더·UI·전투·저장을 모두 처리"
- 영향: rubric 5의 정의가 금지한 6개 범주를 모두 혼재. **methodology-audit 스킬이 380줄 5책임으로 지목한 클래스가 717줄(~1.9배)로 악화**. 회의론자 두 명이 인용·라인 전부 일치 확인.

### 🔴 머지 결과가 단일 onMerge 클로저에 집중 — 보상/효과 추가 시 717줄 클래스 수정 강제 — 단일책임 · ECS-lite
- 증거: `game/src/GameScene.ts:137-184` (score·effects·sound·combo·meta.onMerge 미션·Stage 클리어·UnlockModal·scheduleEnd 직접 팬아웃)
- 방법론 위반: [[../../90-methodology/ecs-lite]] "새 아이템·적·보상·효과 추가 시 기존 대형 클래스를 수정하지 않아도 되는 구조"
- 영향: EconomySystem/EffectSystem/ProgressionSystem 부재로 머지 보상 1건 추가에도 대형 오케스트레이터 편집 불가피 — 완료기준 정면 위반. (tier 해금 결정 로직도 `:172-182,286-290`에 인라인.)

### 🔴 물리 경계 반사 규칙 containPlanets가 PhysicsWorld가 아닌 오케스트레이터에 — 단일책임
- 증거: `game/src/GameScene.ts:518-547` (사각 경계 클램프 + 속도 반사를 substep마다 수행)
- 방법론 위반: [[../../60-implementation/architecture]] "각 모듈은 한 가지 책임만 가지며, 물리 규칙과 렌더 규칙을 한 파일에 섞지 않는다"
- 영향: 충돌 벽/step을 소유하는 PhysicsWorld와 분리돼 **물리 규칙 SSoT가 GameScene·PhysicsWorld로 쪼개짐**. (Launcher.ts:158-189 castRay도 충돌을 레이캐스트로 재구현 — 동일 누수.)

### 🔴 세션 내 흐름(Paused/Result/StageClear/StageFail)이 상태 아닌 공존 가능 불리언으로 구현 — State Machine
- 증거: `game/src/GameScene.ts:78` (`private paused = false // true while the unlock modal is up`), `:91-92` (`ended`/`endKind`), `:172` (`if (tier > unlockedTier && !this.paused)` — `!ended`/`!endKind` 가드 없음)
- 방법론 위반: [[../../90-methodology/state-machine]] "`isPlaying`/`isPaused`/`isGameOver`가 동시에 true가 될 수 있다" (금지) · "모든 주요 화면·흐름이 상태로 정의됨"
- 영향: SceneState enum은 Loading/Title/PoolInGame 3개뿐. 모달 일시정지를 `paused=true` 플래그로(명명된 안티패턴), Stage-fail 2초 지연 중 머지가 `paused=true`를 세워 `endKind='fail'`과 공존 — 정확히 공존 안티패턴. 런타임 동작은 양성이나 구조 결함. 전이는 산재한 플래그 대입(`:174,:497`)으로 in-code 전이표 부재.

### 🔴 죽은 export 상수 2건 — karpathy(단순성)
- 증거: `game/src/data/config.ts:19` (`WALL_T`), `game/src/data/planets.ts:60` (`QUEUE_CANDIDATES`) — `game/` 트리 전체에서 선언부 외 참조 0
- 방법론 위반: [[../../90-methodology/agent-friendly-spec]] "동일 정보가 여러 곳에 중복되면 …중복을 줄인다 (SSoT)"
- 영향: 순수 dead code. `QUEUE_CANDIDATES`는 `balance.queue.candidates` 재-export이나 큐 로직은 데이터를 다른 곳에서 읽음 — 제거 1줄.

### 🟡 차원별 누수 (점수 5를 막은 사소한 항목)
- **1 SSoT** — UI/팝업층이 balance.json 팔레트를 무시한 **두 번째 색 island**: `SettingsPopup.ts:11-13`(GREY/ORANGE/RED 자체 팔레트)·`LuckyWheelPopup.ts:15`(SEG_FILL)·`TitleScreen.ts:46-47`; **중복 숫자** `#49a8e6`가 `COLORS.btnBlue/pillBlue`로 존재하는데 `0x49a8e6`로 ~6곳 하드코딩(StageEndPopup·ChargePopup·DailyMissionPopup·AttendancePopup·LuckyWheelPopup·GameInfoPanel); **un-tabled 폰트 크기** 41개/12파일. [[../../90-methodology/data-driven]]
- **2 단일책임** — 디버그 API 95줄 상주(`GameScene.ts:622-716`)·TitleScreen 408줄 3책임(공전 애니+로비 UI+nine-slice `:85-308`)·`architecture.md:30`이 GameScene 책임을 5개로 문서화해 과집중을 문서 차원에서 승인. (MetaStore 278줄 6하위도메인은 응집된 영속 권위라 god-object 경계 yellow.)
- **3 Acceptance** — 콘솔에러=0 KPI·"3분 무에러" DoD가 테스트 0커버(`page.on('pageerror')` 없음); 시간 KPI(≤10/30/60/90s, 5loops/3min) 미단언; suite가 DEV 빌드만 구동(`__game`은 `import.meta.env.DEV` 게이트, webServer=`npm run dev`) → 배포 산출물 build:single 미검증. [[../../90-methodology/acceptance-test]]
- **4 State** — sub-state in-code 전이표 부재; `fire()`/`tick()`이 단일 상태 아닌 3플래그 AND로 입력 가능 여부 재계산(`:313,:566`).
- **5 ECS** — Combo가 규칙(마일스톤 보너스 점수)과 렌더(Text/alpha)를 한 클래스 혼재(`Combo.ts:48-76`).
- **6 Game Loop** — 점수/콤보/코인 오도미터가 deltaTime 없이 per-frame 롤(`Hud.ts:198`·`Combo.ts:72`·`CoinPill.ts:97`, cosmetic); ≡ 메뉴 메타 팝업(settings/wheel/daily/attendance)은 `paused`를 안 세워 뒤에서 물리 계속 시뮬(`GameScene.ts:566` vs `:124-127`). [[../../90-methodology/game-loop]]
- **7 Event** — 명명된 Event Catalog 부재(ITEM_MERGED/COIN_EARNED/SESSION_STARTED 미존재); payload 문서표 없음; 최근 이벤트 흐름 디버그 로그 없음 → 부분점수 상한. [[../../90-methodology/event-driven]]
- **8 Layered** — 전환 fade가 `eventMode='static'`(입력차단 자칭)이나 stopPropagation 없어 200ms fade 중 보드 조준/발사 가능(`GameScene.ts:262`); Launcher onDown/onMove가 app.stage 바인딩·상태 미게이트(`Launcher.ts:67-88`, onUp만 게이트). [[../../90-methodology/layered-rendering]]
- **9 karpathy** — unused import `DESIGN`(`DailyMissionPopup.ts:2`)·`COLORS`(`TitleScreen.ts:6`); 자기 파일 내에서만 쓰는 심볼 14개 과다 export(DI 계약 `MergeHost`/`LauncherHost` 등).

## 수정 워크리스트 (우선순위·다음 단계 입력)
- [ ] **P1** `GameScene` god-object 분할 — exposeDebug(622-716)→`debug/` 모듈, containPlanets(518-547)→`PhysicsWorld`, 머지 클로저(137-184)→`MergeOutcome` 코디네이터, 세션/종료(409-510)→`SessionController`, spawn/remove/fire(312-369)→`PlanetSpawner`, tick 스프라이트 동기(581-595)→`PlanetRenderSystem`. 근거 §🔴1·2·3. **선행: [[../../60-implementation/architecture]] 모듈맵(GameScene 5책임) 재조정.** 검증: GameScene 비데이터 로직 <250줄, 각 신모듈 한 문장 책임, `npm run typecheck` + Playwright 그린.
- [ ] **P1** 세션 내 흐름을 상태로 모델링 — `Playing/Paused/RewardPopup/Result/StageClear/StageFail` 상태 + 전이표로 `paused/ended/endKind` 불리언 대체(`:172` 공존 버그 해소). 근거 §🔴4. **선행: [[../../20-core-loop/screen-flow]]·[[../../20-core-loop/game-modes]] 상태표 반영.** 검증: 어떤 두 상태도 동시 true 불가, 전이표 단일 출처.
- [ ] **P2** ≡ 메뉴 메타 팝업 표시 중 게임플레이 물리 정지 — 팝업 오픈 시 상태/일시정지 적용. 근거 §🟡6. 검증: settings/wheel/daily/attendance 뒤에서 공 시뮬 멈춤.
- [ ] **P2** Acceptance suite 보강 — `page.on('pageerror')`/console 에러=0 단언 + KPI 시간 임계 단언 추가, **prod/single-file 빌드 대상 코어루프 테스트** 추가. 근거 §🟡3. 검증: 콘솔 에러 시 테스트 실패, 배포 산출물 통과.
- [ ] **P2** Event Catalog 도입 — 이벤트명·발생조건·payload·구독자 표 작성(또는 DI 콜백 payload 문서화) + 선택적 이벤트 흐름 디버그 로그. 근거 §🟡7. **선행: [[../../90-methodology/event-driven]] 인스턴스화 페이지.** 검증: payload 표 존재.
- [ ] **P3** dead/unused 정리 — `WALL_T`·`QUEUE_CANDIDATES` 제거, unused import `DESIGN`·`COLORS` 제거, 내부 전용 심볼 de-export. 근거 §🔴5·🟡9. 검증: `tsc --noEmit` clean, grep 외부 참조 0.
- [ ] **P3** UI/팝업 색·폰트 SSoT 흡수 — 141개 하드코딩 색·중복 `0x49a8e6`·41개 폰트 크기를 balance.json `COLORS`/타이포 토큰으로. 근거 §🟡1. **선행: [[../../40-balancing/index]]/balance.json 토큰.** 검증: 팝업층 `0x` hex grep → 토큰 참조.
- [ ] **P3** 입력 경계 정리 — 오도미터 deltaTime화(`Hud`/`Combo`/`CoinPill`), Launcher onDown/onMove를 Playing 게이트 + 전환 fade stopPropagation. 근거 §🟡6·8. 검증: 롤 속도 프레임레이트 무관, fade 중 조준 불가.

## 추적
- 이전 감사: [[2026-06-28-1932-methodology-srp-audit]] — 동일 구조 축, 종합 **73/100**. 이번 **69.6/100**으로 하락(채점자 보정 편차 ±1 감안하되, GameScene 380→717줄 악화·`paused` 불리언·이벤트 카탈로그 부재가 두 감사에서 일관). 단일책임은 그때 2/5, 이번 3/5(회의론자 "low/borderline 3, 2로도 방어 가능").
- 다음: 이 워크리스트로 **수정 프로세스**(스킬 §수정 프로세스) 진행 → P1 분할·상태화 완료 후 재감사하여 차원 2·4 점수 상승 확인.
