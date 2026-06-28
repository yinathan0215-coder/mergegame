---
id: docs-code-sync-audit-2026-06-28-2314
note_type: checklist
status: active
domain: verification
created: 2026-06-28 23:14 KST
target: docs/** ↔ game/src @ 34a7fc7
tags: [audit, docs-code-sync, planet-pool-merge]
---

# 코드 ↔ 문서 정합 감사 (2026-06-28 23:14)

> 진단 전용. `docs/`(정본) ↔ `game/src/`(구현, GALAXY PINBALL) 교차 대조. 확정 불일치 **32건**
> (doc-ne-code 21 · undocumented 8 · misclassified 2 · orphan-doc 1) + 반증 2. 9도메인,
> 2-pass(분류→반증검증), 43 에이전트. 수정은 §워크리스트를 읽는 별도 단계.
> [[docs-code-sync]] 스킬 산출물 · methodology-audit(구조 감사)와 별 축(문서 정확도).

**큰 그림 2가지** — (A) **MVP·범위 펜스가 통째로 stale**: 여러 문서가 "사운드·저장·세션 종료·게임
모드·결과창 = 비범위/미구현"이라 단언하지만 **전부 구현됨**(이게 사용자가 지목한 "MVP가 원본하고 안
맞는다"의 정체). (B) **정체성/네이밍**: concept·MOC·README가 제품명을 **"Planet Pool Merge"로만**
표기 — 실제 플레이어 노출 타이틀은 **GALAXY PINBALL**(LoadingScreen). 단 풀(pool) **조준/반사 메카닉
자체는 여전히 유효**(pinball은 브랜딩) — 장르 서술이 틀린 게 아니라 *공개명 표기가 빠진* 것. 콤보/점수
도메인은 **0건**(직전 reconcile 유지됨 ✓).

## 0. 한눈에 — 서브시스템 구현 상태

| 서브시스템 | 문서 | 코드 | 판정 |
|---|---|---|---|
| 발사·물리·머지·큐 | 상세 | 구현 | ⚠️ cross-ref 수치 stale(120°/120px) |
| 점수·콤보 | 상세 | 구현 | ✅ 일치(직전 reconcile 유지) |
| 행성 사다리(11티어→블랙홀) | 상세 | 구현 | ✅ 일치 |
| 게임 모드 Infinite/Stage | 상세 | **구현(ModeController)** | ⚠️ Title 토글 명칭 stale(아래) |
| 발사 카운트·행성 차지 | 상세 | **구현** | ✅ 대체로 일치 |
| 결과/스테이지 클리어·실패 창 | 상세 | **구현(Result/StageEnd)** | ⚠️ "게임오버 없음" 문서와 모순 |
| Loading 씬(GALAXY PINBALL) | 상세 | **구현** | ⚠️ ASSETS_READY 미사용(2초 floor만) |
| 메타 경제(코인·미션·출석·룰렛·상점·설정) | 상세 | 구현 | ⚠️ API명·룰렛 비용·저장 표기 |
| 사운드 | 상세 | 구현 | ⚠️ toggle 트리거 명칭 stale |
| 점수/코인/미션 영속(localStorage) | **"저장=비범위"** | **구현(MetaStore)** | ❌ MVP 펜스 모순 |
| 이어하기(진행 중 세션 재개) | "이어하기 지원" | **매 Play 새 세션** | ❌ 문서 과대 |
| 아키텍처 모듈 맵 | "9 모듈"/23행 | 실제 ~38 .ts | ❌ 8 모듈 누락 |

---

## 1. MVP·범위 펜스 stale (USER FOCUS — doc-ne-code) 🔴

여러 문서가 구버전 단일 루프 기준 "비범위/미구현" 펜스를 들고 있는데 코드가 추월함.

- **🔴 MVP 경계 — 사운드** `core-loop.md:59` 제외열 "사운드" ↔ `SoundManager.ts:60/192` + GameScene/Title/Popup/Settings 14+ `sound.play` 호출. **사운드는 완전 구현.**
- **🔴 MVP 경계 — 저장** `core-loop.md:59` 제외열 "저장" ↔ `MetaStore.ts:215/246/254`(localStorage `ppm.meta.v1`: 코인·미션·출석·best/current 점수). **영속 구현됨.**
- **🟡 MVP 경계 — 세션 종료** `core-loop.md:55` "세션 종료 조건 자체(비범위)" ↔ `GameScene.ts:440/448/456`(checkSessionEnd→scheduleEnd→showEnd), ModeController, Result/StageEnd 팝업. **종료 조건 구현됨.**
- **🔴 agent-runbook 스코프 펜스** `agent-runbook.md:43-51` "만들지 않는다: 게임 오버 / 필수 범위 아님: 저장·랭킹·사운드·튜토리얼" ↔ 사운드·저장·세션종료창 모두 구현. (랭킹·튜토리얼만 여전히 정확)
- **🟡 verification/index "게임 오버 없음"** `70-verification/index.md:19` ↔ `ResultPopup`/`StageEndPopup`(STAGE FAILED 포함) 종료창 존재. count 소진 종료 상태로 정정 필요.
- **🟡 task-breakdown/plan/KPI/checklist가 단일 코어 루프만 다룸** `task-breakdown.md:13-63`(16태스크 Phase0-5)·`plan/index.md:28-86`(Phase0-7 전부 완료 표기)·`checklist.md`·`kpi.md` — Loading·모드선택·카운트소진·차지·Result/Clear/Fail 검증 항목 없음.

> 권고(P0): `core-loop.md` MVP 경계 표를 **현재 출하 범위**로 재작성(모드·종료·차지·결과·사운드·저장 = 포함), `agent-runbook §4`·`verification/index`·`task-breakdown`/`plan`/`checklist`/`kpi`를 동기화. 랭킹·튜토리얼만 비범위로 유지.

## 2. 정체성 / 네이밍 (USER FOCUS) 🟡

- **🟡 공개 타이틀 미표기** `concept.md:21-24`(+ `docs/index.md:11`, `README.md:3`, `10-concept/index.md:11/23`)가 제품명을 **"Planet Pool Merge"로만** 표기 ↔ `LoadingScreen.ts:8` `TITLE_LINES=['GALAXY','PINBALL']`(부팅 스플래시). 공개명/내부명 구분은 `screen-flow.md:70-71`에만 있음.
  - 권고: concept·MOC·README에 "**GALAXY PINBALL = 플레이어 노출명, Planet Pool Merge = 내부 디스크립터**" 한 줄 추가(screen-flow 표기 미러). **풀 조준/반사 메카닉 서술 자체는 유지**(여전히 정확).
- **🔴 Title 토글 명칭** `architecture.md:51` · `checklist.md:63` · `sound-design.md:34` · `sound-manager.md:53`가 하단 토글을 **"Galaxy/Fantasy"**로 서술 ↔ `TitleScreen.ts:338-364` `modeToggle`는 **Infinite|Stage 모드 선택**(`grep fantasy game/src` = 0). 네 문서 모두 "Infinite|Stage 모드 토글"로 정정.

## 3. 문서 ≠ 구현 — 그 외 doc-ne-code

- **🟡 이어하기 미구현** `screen-flow.md:36,42-44` · `title-screen.md:61,68-70` "진행 중 세션 이어하기(점수 유지)" ↔ `GameScene.ts:263` 매 진입 `startSession()`(점수/보드 리셋, `ScoreSystem.reset()`). best/current 점수는 표시용으로만 영속. → 문서에서 "이어하기" 주장 제거(매 Play 새 게임) 또는 resume 구현.
- **🟡 core-loop 점수 "충돌 +1"** `core-loop.md:30,59` ↔ 벽 +1/행성 +3(`ScoreSystem`, `balance.json scoring{wallPoint1,ballPoint3}`). "벽+1/행성+3"로 정정(또는 40-balancing에 위임).
- **🟡 초기 랙 종 표기** `play-flow.md:19-20` "수성·화성·금성·지구" ↔ 실제 `balance.json rack` tier1-4 = **소행성·수성·화성·금성**(지구 미포함). 정정.
- **🟡 launcher 드래그 거리** `launcher.md:42` "0~120px→파워" ↔ `balance.json launch.dragMax=110`(launch-physics.md는 110로 정확).
- **🟡 부채꼴 각도** `play-area-boundary.md:71` "120°" ↔ `balance.json fanDeg=90`(±45°, launcher.md도 90).
- **🟡 룰렛 비용** `lucky-wheel.md:55` "비용 120" ↔ `balance.json wheel.cost=100`(같은 문서 20/29/32/59줄은 100). 55줄 정정 + 코드 stale 주석 `LuckyWheelPopup.ts:9`("spend 120") 정리.
- **🟡 미션 리포트 API** `meta-economy.md:58` `reportMerge/reportComboPeak/reportSun` ↔ 실제 단일 `MetaStore.onMerge(comboValue,isSun)`(`GameScene.ts:153`). 정정.
- **🟡 보드 톤 "와인"** `galaxy-background.md:39,58` "와인색 보드 프레임" ↔ 정본 `art-direction.md:26` 네이비 + `balance.json outerBg #15203d`. 네이비로 정정.
- **🟢 Loading 전이 게이트** `screen-flow.md:35,66-67` `ASSETS_READY`(리소스 로드+2초) ↔ `GameScene.ts:519-522`는 2초 floor만(`grep ASSETS_READY=0`, 동기 로드). 문서를 "시간 floor만"으로.
- **🟢 Stage 큐 오버플로** `stage-mode.md:39,42` 결정적("마지막 규칙으로 보충") ↔ `QueueSystem.ts:17-20` 스크립트(10) 소진 후 `randomQueueTier`(비결정적), count=30. 큐 길이≥count로 채우거나 fallback 문서화.
- **🟢 HUD 레이아웃 리터럴 하드코딩** `balance.json:2 _readme`("레이아웃 리터럴 하드코딩 금지") ↔ `Hud.ts`·`GameInfoPanel.ts` 폰트/좌표 상수. balance.json로 올리거나 _readme 범위 한정.

## 4. 구현됐으나 문서 미반영 — undocumented

- **🔴 아키텍처 모듈 맵 8개 누락** `architecture.md:18-61` ↔ 실제 wired: `LoadingScreen`·`modes/ModeController`·`GameInfoPanel`·`ui/CoinPill`·`popups/{Settings,Charge,Result,StageEnd}Popup`. 모듈표에 추가.
- **🟡 PLANET_VISIBLE_DIAMETER 하드코딩** `PlanetFactory.ts:5-17,24` 티어별 보정맵 ↔ balance.json·planet-art.md에 없음. SSoT화 또는 문서화.
- **🟢 그 외**: 하단 바닥 클램프(`GameScene.ts:479,500`)가 `play-area-boundary.md:51-56` 의사코드에 없음 · StageFail "다시 시도" 버튼(`StageEndPopup.ts:50-57`)이 result-window.md 미기재 · 룰렛 `+N` 당첨 텍스트(`LuckyWheelPopup.ts:65/201`) 미기재 · 블랙홀 종단 머지 `merge` 사운드 2번째 호출(`GameScene.ts:434`) 연결표 누락 · `architecture.md:83-84` balance.json 섹션 목록이 `modes`·`juice.result` 누락.

## 5. 오분류 / 문서 내부 모순 — misclassified

- **🟡 layout.md 자체 모순** `layout.md:38`("인게임 좌상단 코인 표시") ↔ `:44`("머니 표시 두지 않는다"). 코드는 인게임 CoinPill 표시(`GameScene.ts:202,261`) → :44를 "HUD 바엔 머니 위젯 없음(코인 pill은 별도)"로.
- **🟢 와인 톤 cross-page drift** `index.md:36`·`title-screen.md:36`·`screen-structure.md:89` "와인" ↔ 정본 art-direction.md 네이비. 요약 페이지들 네이비로 통일.

## 6. orphan-doc / dead data

- **🟢 `queue.candidates` 죽은 데이터** `balance.json:74 [1,2,3,4,5]` + `planets.ts:60 QUEUE_CANDIDATES` 소비자 0(`randomQueueTier`는 unlock 연동 동적 범위 사용). 제거.

---

## 우선순위 수정 워크리스트 (다음 단계 입력)

**P0 — 정본이 거짓을 단언(MVP·범위 펜스):**
1. `core-loop.md` MVP 경계 표 = 현재 출하 범위로 재작성(모드·세션종료·차지·결과·사운드·저장 포함; 랭킹·튜토리얼만 제외). 검증: 표의 각 제외 항목을 grep로 미구현 확인.
2. `agent-runbook §4` 스코프 펜스 · `70-verification/index.md:19`("게임오버 없음") 동기화(종료=count 소진 Result/Clear/Fail).
3. 정체성: concept·MOC·README에 GALAXY PINBALL(공개)/Planet Pool Merge(내부) 한 줄 추가.
4. Title 토글 "Galaxy/Fantasy"→"Infinite|Stage" 4문서 정정(architecture·checklist·sound-design·sound-manager).

**P1 — 구현/문서 한쪽 맞추기:**
5. "이어하기" — 문서에서 제거(매 Play 새 게임) **또는** resume 구현(보드/카운트/점수 스냅샷). ← 설계 결정 필요.
6. architecture 모듈표에 누락 8개 추가 + balance.json 섹션 `modes`/`juice.result` 추가 + "9 모듈" 카운트 제거.
7. task-breakdown/plan/KPI/checklist에 Loading·모드선택·카운트소진·차지·Result/Clear/Fail 항목 추가.
8. meta-economy API명(onMerge) 정정, 룰렛 비용 100 통일(+코드 주석).

**P2 — 수치 cross-ref·drift·미세:**
9. launcher 120px→110, boundary 120°→90, core-loop +1→벽+1/행성+3, play-flow 랙 소행성·수성·화성·금성, 와인→네이비(galaxy-background + index/title/screen-structure), layout.md 코인 모순.
10. 미문서 구현 기록: 바닥 클램프·StageFail 다시시도·룰렛 +N·블랙홀 종단 merge음·ASSETS_READY 실제 게이트.
11. PLANET_VISIBLE_DIAMETER SSoT화, HUD 리터럴 정리, `queue.candidates` 죽은 데이터 제거.

## 반증된 항목 (오탐, 참고)

- "Stage 플레이스홀더 큐(10) < count(30)" → 분류 판단 이슈. 플레이스홀더임이 `game-modes.md:52`에 명시돼 있고 stage-balance는 절차 모델이라 데이터 누락이 아님(별도로 §3 큐 오버플로 비결정성은 확정).
- "verification/architecture가 GALAXY PINBALL cross-ref 없이 Planet Pool Merge 사용" → 반증. 내부/공개명 구분은 의도적(`screen-flow.md:70-71`)이고 그 페이지들은 **내부 문서**라 내부명 사용이 정당. (단 §2의 concept·MOC·README는 *플레이어 정체성* 페이지라 확정 유지.)

## 추적
- 이전: [[2026-06-28-2050-docs-code-sync-audit]](게임모드 레이어가 그때는 orphan-doc — 현재 구현되어 본 감사에서 doc-ne-code로 전환).
- 다음: 이 워크리스트로 정본 reconcile(별도 단계) → 재감사하여 건수 비교.
