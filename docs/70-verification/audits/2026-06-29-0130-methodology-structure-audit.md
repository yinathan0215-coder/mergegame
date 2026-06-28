---
id: audit-2026-06-29-0130
note_type: audit
status: report
domain: verification
created: 2026-06-29 01:30 KST
target: game/src @ d55419b
score: 69.6/100
tags: [audit, methodology, srp, health]
---

# 방법론 준수 감사 (재감사) — 2026-06-29 01:30

> 대상: `game/src/**` (38 TS + balance.json / 5554줄) ↔ docs/90-methodology 7기둥 + 단일책임 + karpathy.
> 종합 **69.6/100** (직전 [[2026-06-28-2347-methodology-structure-audit]] 69.6과 동일). **읽기 전용 진단**
> — 수정은 §수정 워크리스트를 별도 단계에서. 사용자 요청: "코드가 좀 바뀌었어 → 다시 조사."
>
> 방법: 9차원을 차원별 독립 채점 + 차원별 독립 회의론자 검증. 이번 실행에서 채점 에이전트 2건(data-driven,
> layered-rendering)이 StructuredOutput 한도 초과로 실패 → **프로즈 복구 채점(단일패스)**. 채점 2건(game-loop,
> event-driven)은 플레이스홀더 rationale 반환 → 그 회의론자가 실채점. game-loop은 회의론자가 5로 상향했으나
> **감사자가 직접 재확인 후 4로 환원**(아래 §point 참고). 나머지 5차원은 정상 채점+검증.

## 점수표
| 차원 | 가중 | 점수(0–5) | 기여 | 근거(file:line) |
|---|---:|---:|---:|---|
| 1 Data-driven / SSoT | 15 | 3 | 9.0 | 로더(config/planets)·balance.json 모범 but 하드코딩 색 176개/22파일·`#49a8e6` 중복 8곳 |
| 2 단일책임 / 과집중 | 15 | 3 | 9.0 | `GameScene.ts:43` 810줄 god-object(380→717→810) vs ~35개 모듈 단일책임 |
| 3 Acceptance-test | 12 | 4 | 9.6 | `play.spec.ts`·`stages.spec.ts` 실빌드 코어루프 검증; 콘솔에러=0·재시작·prod빌드 미커버 |
| 4 State Machine | 12 | 3 | 7.2 | Scene층 실 FSM(`GameScene.ts:31`) but 세션 흐름 `paused/ended/endKind/clearFly` 4플래그 공존 |
| 5 ECS-lite 분해 | 10 | 3 | 6.0 | Planet 얇은 엔티티·System 깨끗 but 머지 fan-out `GameScene.ts:152-193`·containPlanets 규칙 집중 |
| 6 Game Loop / Fixed Step | 10 | 4† | 8.0 | 교과서적 고정스텝·catch-up 상한(`GameScene.ts:654-663`); 메타 팝업 미정지·오도미터 per-frame |
| 7 Event-driven | 10 | 4 | 8.0 | 직접결합 0·실 Observer(`MetaStore.ts:85`); 이벤트 카탈로그·디버그 로그 부재(부분점수 상한) |
| 8 Layered Rendering | 8 | 4 | 6.4 | 고정 레이어 스택·모달 차단 모범(`GameScene.ts:114`); fade·Launcher 미게이트·코치 딤이 HUD 가림 |
| 9 Code discipline / karpathy | 8 | 4 | 6.4 | `tsc` clean·vestigial 필드 0; dead export·미사용 import·legacy asset 6건 |
| **종합** | **100** | | **69.6** | |

† **game-loop 점수 환원 근거(감사자 직접 검증):** 워크플로 회의론자는 오도미터를 비-시간민감 cosmetic으로 보고
5로 상향했으나, 직전 감사가 4로 깎은 사유인 "인게임 메타 팝업(dailyMission/attendance/wheel/settings,
`GameScene.ts:130-133`) 표시 중 물리 미정지"가 **코드 변경 없이 잔존**함을 grep으로 직접 확인했다(`paused`는
오직 해금 모달 `:184`만 set, tick 게이트 `:645`는 `paused||ended`만 검사). 시간정책 누수가 실재·미해결이므로
직전 감사와 일관되게 4로 유지한다.

## 변화 (직전 2347 감사 @069fa7e → 이번 @d55419b)
| 차원 | 2347 | 이번 | 추세 | 핵심 변화 |
|---|---:|---:|---|---|
| 1 Data-driven | 3 | 3 | ▼ 밴드 내 악화 | 하드코딩 색 141/19파일 → **176/22파일**, `#49a8e6` 중복 ~6 → **8곳**, 신규 `FirstGestureHint.ts`가 색·juice 상수 island 추가 |
| 2 단일책임 | 3 | 3 | ▼ 밴드 내 악화 | GameScene **717 → 810줄(+93)**, 스테이지 클리어 비행연출(`startClearFly`)이 Effects 아닌 GameScene에 신규 내장 |
| 3 Acceptance | 4 | 4 | = | `play.spec.ts` +69줄 보강했으나 콘솔에러=0 KPI·재시작 탭 검증 여전히 0커버 |
| 4 State | 3 | 3 | ▼ 밴드 내 악화 | 종료 플래그에 **`clearFly` 추가 → 4플래그 공존**(paused/ended/endKind/clearFly), clear>fail 우선순위 ad-hoc |
| 5 ECS-lite | 3 | 3 | = | 머지 fan-out·충돌 점수·세션종료 경제 규칙이 여전히 GameScene 인라인 |
| 6 Game Loop | 4 | 4 | = | 고정스텝 견고 유지; 메타 팝업 미정지·오도미터 per-frame(3곳) 미해결 |
| 7 Event-driven | 4 | 4 | = | 이벤트 카탈로그/EventBus 여전히 부재(grep 0) |
| 8 Layered | 4 | 4 | = | 두 기존 누수(fade stopPropagation·Launcher 게이트) 미해결, 신규 코치는 올바른 레이어로 추가 |
| 9 karpathy | 4 | 4 | ▼ 밴드 내 악화 | dead 항목 4 → **6건**(legacyBackground·legacyBoardBackground vestigial asset 추가) |

> **요지:** 종합 점수는 69.6으로 평평하지만, 직전 감사 이후 6개 피처 커밋이 들어오는 동안 **구조 수정은 0건**이고
> 4개 차원(1·2·4·9)이 밴드 내에서 악화했다. 점수가 평평한 것은 밴드 단위(0–5) 해상도가 누적 드리프트를
> 흡수했기 때문 — **추세는 하방**이다. 신규 온보딩(FirstGestureHint)은 레이어링은 잘 지켰으나 SSoT(색·juice)는
> 깨고 GameScene god-object를 더 키웠다.

## 발견 (severity 순)

### 🔴 GameScene.ts 810줄 god-object — 380→717→810 지속 회귀 — 단일책임 · ECS-lite
- 증거: `game/src/GameScene.ts:43` (~10–13 책임 군집: scene FSM 268-323 · 고정스텝 루프 619-690 · 엔티티 수명 350-383 · 랙 빌드 385-419 · 충돌→점수/머지/사운드/콤보/미션 배선 144-212 · 해금 182-192 · 세션종료+경제 541-580 · 경계물리 588-617 · 스테이지클리어 비행연출 494-537 · 디버그 API 710-808)
- 방법론 위반: [[../../90-methodology/ecs-lite]] "GameManager 하나가 입력·밸런스·렌더·UI·전투·저장을 모두 처리"
- 영향: 직전 감사(717) 대비 **+93줄**. 새 연출(clear-fly)이 오케스트레이터에 직접 추가돼 완료기준 "새 효과 추가 시 대형 클래스를 수정하지 않아도 되는 구조"가 **실증적으로** 깨짐. architecture.md:30 헌장(app+render+scene+orchestration+session-end)을 경계물리·연출·디버그가 초과.

### 🔴 머지 보상/효과 fan-out + 충돌 점수 + 세션종료 경제가 GameScene 인라인 — ECS-lite · 단일책임
- 증거: `game/src/GameScene.ts:152-193` (onMerge: score+combo+meta missions+unlock+stage-clear+effects+sound) · `:195-212` (충돌 점수 onBallHit/onWallHit+버스트+사운드) · `:541-580` (checkSessionEnd 종료규칙 + showEnd 경제 markStageCleared/addCoins/nextStage)
- 방법론 위반: [[../../90-methodology/ecs-lite]] "새 아이템·적·보상·효과 추가 시 기존 대형 클래스를 수정하지 않아도 되는 구조"
- 영향: EconomySystem/EffectSystem/ProgressionSystem 부재로 보상·연출·종료 규칙이 모두 오케스트레이터에 — 새 보상 1건 추가가 곧 god-class 편집.

### 🔴 경계 물리 규칙 containPlanets가 PhysicsWorld와 중복 — 단일책임 · ECS-lite
- 증거: `game/src/GameScene.ts:588-617` (사각 클램프+바닥 floor+속도 반사 매 substep) vs `game/src/PhysicsWorld.ts:27` (addWalls THICK=48 anti-tunnel 벽 소유)
- 방법론 위반: [[../../60-implementation/architecture]] "각 모듈은 한 가지 책임만 가지며, 물리 규칙과 렌더 규칙을 한 파일에 섞지 않는다"
- 영향: 경계/충돌 물리 SSoT가 두 파일로 분열.

### 🔴 세션 흐름이 4개 공존 가능 플래그 — clearFly 추가로 악화 — State Machine
- 증거: `game/src/GameScene.ts:79,94,95,99` (`paused`/`ended`/`endKind`/`clearFly`), `:326` (fire() 가드가 4플래그 한 줄 AND), `:184` (해금 정지 `paused=true`), `:553-556` (clear가 대기중 fail 덮어쓰는 ad-hoc 우선순위)
- 방법론 위반: [[../../90-methodology/state-machine]] "`isPlaying`/`isPaused`/`isGameOver`가 동시에 true가 될 수 있다"(금지) · "모든 주요 화면·흐름이 상태로 정의됨"
- 영향: SceneState는 Loading/Title/PoolInGame 3개뿐. 결과(Result/Clear/Fail)·중단(unlock)이 상태 아닌 플래그. 직전 4플래그째 `clearFly`가 추가돼 조합 모순 표면이 더 넓어짐. 전이표 없는 종료 우선순위.

### 🔴 SSoT 색 island — 176개 하드코딩 색·`#49a8e6` 중복 8곳 — Data-driven
- 증거: `balance.json:42,44`(btnBlue/pillBlue=#49a8e6)인데 `0x49a8e6`로 재하드코딩: `ChargePopup.ts:111,121`·`StageEndPopup.ts:45,55`·`LuckyWheelPopup.ts:125`·`DailyMissionPopup.ts:87`·`AttendancePopup.ts:96`·`GameInfoPanel.ts:57`. 전체 176색/22파일, `SettingsPopup.ts:12-13`(GREY/ORANGE/RED 자체 팔레트), `FirstGestureHint.ts`(0x000000/0xffffff/0x0a0a14 + DRAG/DIM_ALPHA 등 juice 상수)
- 방법론 위반: [[../../90-methodology/agent-friendly-spec]] "동일 정보가 여러 곳에 중복되면 …중복을 줄인다 (SSoT)"
- 영향: 테이블 btnBlue 수정 시 8개 버튼이 조용히 불일치 — SSoT가 죽이려는 모호성. UI/팝업 팔레트 전체가 balance.json 밖.

### 🟡 차원별 누수
- **3 Acceptance** — 콘솔에러=0 KPI·"3분 무에러" DoD 0커버(`page.on('pageerror')` 없음, `play.spec.ts`); 결과/클리어/실패 창의 **재시작 탭** 미구동(상태 재진입 `GameScene.ts:231-236` 미테스트); 시간 KPI(≤10/30s·5loops/3min) 미단언; suite는 DEV 빌드만(`__game` DEV 게이트 `:265`) → prod 단일파일 미검증. [[../../90-methodology/acceptance-test]]
- **6 Game Loop** — 인게임 메타 팝업 표시 중 물리 미정지(`:645` 게이트 vs `:130-133` 팝업); 오도미터 deltaTime 없이 per-frame 롤 3곳(`Hud.ts:227`·`Combo.ts:72`·`CoinPill.ts:97`, cosmetic). [[../../90-methodology/game-loop]]
- **7 Event** — 명명된 Event Catalog/EventBus 부재(SESSION_STARTED/ITEM_MERGED/COIN_EARNED grep 0); payload 문서표·최근 이벤트 디버그 로그 없음 → 부분점수 상한. [[../../90-methodology/event-driven]]
- **8 Layered** — 전환 fade `eventMode='static'`이나 stopPropagation 없어 200ms 중 stray 발사 가능(`GameScene.ts:275`+`Launcher.ts:67`); Launcher onDown/onMove 상태 미게이트(`Launcher.ts:74,82`); 신규 코치 딤(0.55)이 HUD/Count 위에 그려져 첫 발사 전 수치 어둡게(`FirstGestureHint.ts:27`→uiLayer `:138`, transient). [[../../90-methodology/layered-rendering]]
- **2 단일책임** — 스테이지 클리어 비행연출(`GameScene.ts:494-537`)·디버그 100줄(`:710-808`)은 각각 Effects·debug.ts 분리 대상; TitleScreen 425줄 3책임(공전+로비UI+nine-slice). MetaStore 312줄은 응집 영속 권위라 god-object 아님(경계).
- **9 karpathy** — dead export `WALL_T`(`config.ts:19`, balance.json wallT까지 동반)·`QUEUE_CANDIDATES`(`planets.ts:60`); 미사용 import `DESIGN`(`DailyMissionPopup.ts:2`)·`COLORS`(`TitleScreen.ts:6`); vestigial asset `legacyBackground`(`assets.ts:4`)·`legacyBoardBackground`(`assets.ts:37`). tsconfig `noUnusedLocals:false`라 tsc 미검출.

## 수정 워크리스트 (우선순위·다음 단계 입력 — 직전 감사 대비 더 시급)
- [ ] **P1** `GameScene`(810줄) 분할 — exposeDebug(710-808)→`debug/`, containPlanets(588-617)→`PhysicsWorld`, 머지 fan-out(152-193)+충돌 점수(195-212)→`MergeOutcome`/`CollisionScoring`, clear-fly(494-537)→`Effects`, 세션종료+경제(541-580)→`SessionController`. 근거 §🔴1·2·3. **선행: [[../../60-implementation/architecture]] 모듈맵 재조정.** 검증: GameScene 비데이터 <300줄, typecheck+Playwright 그린. (3감사 연속 미해결·매 감사 +90줄 증가 중 → 최우선.)
- [ ] **P1** 세션 흐름 상태화 — `Playing/Paused/RewardPopup/Result/StageClear/StageFail` + 전이표로 `paused/ended/endKind/clearFly` 4플래그 대체. 근거 §🔴4. **선행: [[../../20-core-loop/screen-flow]]·[[../../20-core-loop/game-modes]].** 검증: 두 상태 동시 true 불가.
- [ ] **P2** 메타 팝업 표시 중 물리 정지 — `:130-133` 팝업 오픈 시 상태/일시정지. 근거 §🟡6. 검증: 팝업 뒤 공 시뮬 멈춤.
- [ ] **P2** Acceptance 보강 — `page.on('pageerror')` 에러=0 단언 + 재시작 탭 구동 + prod 빌드 코어루프. 근거 §🟡3. 검증: 콘솔 에러 시 실패.
- [ ] **P2** Event Catalog 도입 — 이벤트명·payload·구독자 표(또는 DI 콜백 문서화) + 이벤트 디버그 로그. 근거 §🟡7.
- [ ] **P3** SSoT 색·juice 흡수 — 176색·중복 `0x49a8e6`(8곳)·43 폰트·`FirstGestureHint` 상수를 balance.json 토큰으로. 근거 §🔴5. **선행: balance.json/[[../../40-balancing/index]].** 검증: 팝업층 `0x` hex grep → 토큰. (악화 중 — 매 피처가 색 island 추가.)
- [ ] **P3** dead/unused 정리(6건) — `WALL_T`·`QUEUE_CANDIDATES`·`legacyBackground`·`legacyBoardBackground` 제거, import `DESIGN`·`COLORS` 제거, `tsconfig noUnusedLocals:true`로 재발 방지. 근거 §🟡9. 검증: tsc clean·grep 0.
- [ ] **P3** 입력 경계 — 오도미터 deltaTime화, Launcher onDown/onMove Playing 게이트, fade stopPropagation, 코치 딤을 board/HUD 사이 레이어로. 근거 §🟡6·8.

## 추적
- 이전 감사: [[2026-06-28-2347-methodology-structure-audit]] — **69.6/100**(@069fa7e). 이번도 **69.6/100**(@d55419b) — 점수 동일하나 1·2·4·9차원 밴드 내 악화(추세 하방). 그 이전 [[2026-06-28-1932-methodology-srp-audit]] 73/100.
- 다음: 6개 피처 커밋 동안 구조 수정 0건 → **P1(GameScene 분할·세션 상태화)을 피처 추가보다 먼저** 진행 권장. 수정 후 재감사하여 1·2·4 밴드 상승 확인.
