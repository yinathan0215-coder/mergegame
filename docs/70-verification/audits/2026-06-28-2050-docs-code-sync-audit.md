---
id: docs-code-sync-audit-2026-06-28-2050
note_type: checklist
status: active
domain: verification
updated: 2026-06-28
tags: [audit, docs-code-sync, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 코드 ↔ 문서 정합 감사 (2026-06-28 20:50)

> 진단 전용 보고서. `docs/`(기획 정본)와 `game/src/`(실제 구현)를 교차 대조해 **① 구현됐는데
> 문서 미반영(undocumented) · ② 문서와 구현이 다름(doc-ne-code) · ③ 오분류/문서 내부 모순
> (misclassified) · ④ 문서엔 있으나 구현 없음(orphan-doc)** 을 찾는다. 실제 수정(문서 갱신/코드
> 구현)은 이 보고서를 입력으로 하는 **별도 단계**다 — 여기서는 고치지 않는다.
> 방법론·구조 감사([[2026-06-28-1932-methodology-srp-audit]])와 별 축: 이쪽은 *문서 정확도*.

## 방법

2-pass 멀티에이전트 교차 대조. 각 도메인 담당이 해당 `docs/` + `game/src/`를 **양쪽 다** 읽고
불일치를 보고 → 모든 항목을 **반증 검증**(에이전트가 인용 파일을 다시 열어 grep으로 재확인)에 통과시킴.
- Pass 1 (7도메인, 50에이전트): scenes·launcher·scoring/combo·planet-ladder·meta-economy·render·architecture.
- Pass 2 (2도메인, 14에이전트): **1차에서 누락된 신규 문서** — sound · game-modes/stage/charge/result.

**결과: 확정 53건, 반증(오탐) 2건.** 분포 — orphan-doc 13 · doc-ne-code 33 · undocumented 6 · misclassified 1.
심각도 — high 19 · med 24 · low 10.

---

## 0. 한눈에 — 서브시스템 구현 상태

| 서브시스템 | 문서 | 코드 | 판정 |
|---|---|---|---|
| Pool 발사·물리·머지 | 상세 | 구현됨 | ✅ 대체로 일치 (수치 cross-ref 몇 곳 stale) |
| 행성 사다리(11티어) | 상세 | balance.json과 일치 | ✅ 일치 |
| 점수(벽+1/볼+3/머지) | 상세 | 구현됨 | ⚠️ **여러 문서가 +1로 오기재** |
| **콤보** | "전면 제거" ADR | **마일스톤 보너스로 부활·점수 반영** | ❌ ADR·_readme·일부 문서 전부 stale |
| 티어 해금 모달 | 일부 | 구현됨 | ⚠️ 재진입 시 리셋 의미 문서 충돌 |
| Title 로비 | 상세 | 구현됨 | ⚠️ 최고점수 하드코딩 0·설정/코인+ 미동작 |
| 메타 경제(코인·출석·미션·룰렛·상점) | 상세 | 구현됨 | ⚠️ API명·저장 스키마·룰렛 비활성 불일치 |
| 사운드 | 11종 카탈로그+믹싱 | 엔진 구현, **8/11만 트리거·뮤트 UI 없음** | ⚠️ orphan 3 + 볼륨 미구현 |
| 점수 영속(localStorage) | "새로고침 유지" | **점수는 메모리만** (코인/미션/뮤트만 저장) | ❌ 미구현 |
| **게임 모드(무한/스테이지)** | 상세 (20·30·40·50) | **전무** | ❌ **레이어 통째 미구현** |
| **발사 카운트 예산** | 상세 | 전무 | ❌ 미구현 |
| **행성 차지(코인→카운트)** | 상세 | 전무 | ❌ 미구현 |
| **스테이지 모드/레벨 데이터** | 상세 | 전무 (balance.json `modes` 키 없음) | ❌ 미구현 |
| **결과/클리어/실패 창** | 상세 | 전무 (세션 종료 자체가 없음) | ❌ 미구현 |
| 아키텍처 모듈 맵 | "9개 모듈" | 실제 29개 .ts | ❌ ~17 모듈 누락 |

---

## 1. 문서엔 있으나 구현 없음 — orphan-doc (13)

### 🔴 게임 모드 레이어 전체 (가장 큰 결함, 7건)
4개 섹션에 걸쳐 완결적으로 설계됐으나 `game/src`에 **단 한 줄도** 없음. `GameScene.ts:22`의
`SceneState = 'Title' | 'PoolInGame'` 외 모드 개념이 없고, `balance.json`에 `modes` 키가 없다.
- **MO1** (high) 무한/스테이지 2-모드 시스템 미구현 — [[20-core-loop/game-modes]] vs `GameScene.ts:22`.
- **MO3** (high) 발사 카운트(발사 예산) 미구현 — [[30-systems/launch-count]]·[[40-balancing/game-modes]](startCount 30). `fire()`는 cooldown만 검사, `stats.shots`는 증가만 하는 텔레메트리.
- **MO4** (high) 행성 차지(코인→카운트 구매 버튼/팝업) 미구현 — [[30-systems/planet-charge]]. `grep charge game/src` = 0.
- **MO5** (high) 스테이지 모드(데이터 레벨·클리어 +300·실패) 미구현 — [[30-systems/stage-mode]]. `balance.json`에 `modes.stage.levels` 없음.
- **MO6** (high) 결과/스테이지클리어/스테이지실패 창 미구현 — [[50-art-ux/result-window]]. 세션 종료·NEW RECORD·카운트업 전부 없음.
- **MO7** (high) `balance.json`이 [[40-balancing/game-modes]]가 SSoT로 선언한 키(`modes.*`, `juice.result.countUpMs`)를 **전혀** 안 가짐.
- **MO2** (high, doc-ne-code) Title 하단 토글은 문서의 무한/스테이지 모드 pill이 아니라 **Galaxy/Fantasy 테마 토글**(`TitleScreen.ts:306-330`, "기능 없음, 시각 전환만"); Play 라벨은 `'게임 시작'` 고정.

→ **권고**: 이 레이어 문서들을 `status: draft`(미구축)로 내리거나, 구현 일정을 잡을 때까지 GDD가 "구현됨"으로 단정하지 않게 표기.

### 🔴 사운드 orphan (3건)
- **SD1** (high) `popupOpen`/`popupClose` 사운드는 카탈로그+`balance.json`+연결표에 있으나 `play()` 호출 0 — [[50-art-ux/sound-design]]:36-37, [[60-implementation/sound-manager]]:58. (`ui/Popup.ts`에 sound import 없음)
- **SD2** (high) `toggle` 사운드 정의만 있고 트리거 0 — Galaxy/Fantasy 토글 핸들러가 소리를 안 냄.
- **SD3** (high) 마스터 뮤트는 API(`SoundManager.setMuted/toggleMuted`)만 있고 **호출하는 UI가 없음** — `settings.png`는 있으나 설정 버튼 핸들러가 `() => {}`. 플레이어가 뮤트 불가.

### 🟡 그 외 orphan (3건)
- **S1** (high) Loading 씬 미구현 — [[20-core-loop/screen-flow]]는 3씬(Loading/Title/PoolInGame)인데 코드는 2씬, `ASSETS_READY`·로고·프로그레스바 없음.
- **R4** (low) `colors.planetOutline`(#180f06)이 `balance.json`+[[50-art-ux/art-direction]]:36에 있으나 코드가 소비 안 함 — 외곽선은 PNG에 baked. (`COLORS.boardBg/galaxy/star`도 동일하게 미소비)
- **A5** (low) plan Phase 0이 만들라는 `src/config/layout.ts`는 없음 — 실제 레이아웃 설정은 `src/data/config.ts` — [[60-implementation/plan/index]]:31.

---

## 2. 문서 ≠ 구현 — doc-ne-code (값/규칙 불일치)

### 🔴 콤보 "제거" 모순 (구현이 정답: 콤보는 살아 있고 점수에 반영됨)
- **C1** (high) ADR [[40-balancing/decisions/2026-06-28-remove-combo]]는 "콤보 전면 제거"라 단언하나, `Combo.ts`가 instantiate·tick·`onMerge()`되고 5의 배수마다 `count×bonusPer(400)`를 `score.addBonus`로 가산(`GameScene.ts:91,112-116`). → 제거된 건 **배율** 콤보, 새 **마일스톤 보너스** 콤보로 대체됨.
- **C4** (high) `balance.json:2 _readme`가 "Combo system REMOVED … score = collision +1 + merge tier base"라 적었으나 `juice.combo`(step5/bonusPer400) 활성·볼 충돌 +3.
- **P2** (med) 같은 _readme + [[40-balancing/index]]:45 콤보 제거 ADR 링크가 stale (콤보 구현·`comboPeak` 미션 존재).
- **C2** (high) ADR "벽·일방향 선 충돌 점수 제외"라 했으나 코드는 `wallPoint=1` 가산(`ScoreSystem.onWallHit`, `GameScene.ts:136-140`).
- **C3** (med) ADR가 참조하는 `scoring.collisionPoint(=1)` 키는 **존재하지 않음** — 실제는 `wallPoint=1`/`ballPoint=3`.

### 🔴 점수 +1 vs +3 — 코드는 벽+1/볼+3, 다수 문서가 "+1"로 오기재
- **C5**(med) [[30-systems/scoring-combo]]:20 요약 "충돌마다 +1" ↔ 같은 문서 26줄 "+3"·코드 +3.
- **C6/C7**(med) [[40-balancing/combo-scoring]] 헤더·의사코드 "+1"·"두 갈래"이고 **콤보 보너스 누락**(표는 +3로 맞음 → 페이지 내부 모순).
- **C8**(med) 볼 충돌 점수가 문서 간 +1/+3로 자기모순. 권위는 `balance.json ballPoint=3`.
- **A3**(med) [[60-implementation/architecture]]:73·[[60-implementation/task-breakdown]]:56·[[70-verification/kpi]]:36·[[70-verification/checklist]]:29 모두 "충돌마다 +1" — 벽+1/볼+3(minImpact 3.5 게이트)로 정정 필요.
- **A4**(med) plan Phase 6가 없는 키 `scoring.collisionPoint` 참조.
- **C9**(low) `config.ts:180` 주석 `// { collisionPoint }`이 실제 키(`wallPoint/ballPoint/minImpact`)와 불일치.
- **L7**(low) [[30-systems/merge-rules]]:55 cross-ref "충돌마다 +1"도 동일 오기.

### 🟡 발사/물리 수치 stale (cross-ref만 틀림, 정본/코드는 일치)
- **L1**(high) [[30-systems/play-area-boundary]]:71 "부채꼴 120°" ↔ [[30-systems/launcher]]·`balance.json fanDeg=90`(±45°).
- **L2**(med) [[30-systems/launcher]]:42 "드래그 0~120px" ↔ 코드 `dragMax=110`([[40-balancing/launch-physics]]는 110로 정확).
- **L3**(med) [[30-systems/merge-rules]]:51 "콤보 보너스는 없음" ↔ 콤보 보너스 가산됨.
- **L4**(low) [[30-systems/launch-queue]]:37 "보충 확률 각 20%(5종)" ↔ 코드는 unlock 연동 가변 균등(시작 3종 ~33%).
- **A6**(low) plan Phase 3/4 "vMax 22 / 드래그 120" ↔ `balance.json vMax=30 / dragMax=110`.

### 🟡 점수 영속 / Title
- **S2**(high) Title 최고점수 👑가 `makeText('0')` **하드코딩**, 갱신·localStorage 저장 없음. `TitleProgress`에 best 필드도 없음 — [[50-art-ux/title-screen]]§2-2는 "최고점수 localStorage 저장".
- **S3**(med) 현재/이어하기 점수도 메모리(ScoreSystem)만, 새로고침 시 0 — [[20-core-loop/screen-flow]]:41-42 "localStorage 저장·새로고침 유지"와 불일치.
- **S4**(med) PoolInGame 재진입마다 `unlockedTier`만 리셋(`GameScene.ts:198`) — [[20-core-loop/screen-flow]]는 "상태 보존(이어하기)", [[30-systems/tier-unlock]]는 "매 새 게임 초기화" → 두 문서가 충돌, 코드는 혼합.
- **S5**(low) 설정 기어 핸들러 `() => {}` — title-screen §2-1 "설정 창을 연다"와 불일치.
- **S6**(low) 코인 `+` 버튼·부가재화/아바타 슬롯 미렌더 — title-screen §2-1·§3.

### 🟡 메타 경제 / 렌더
- **M1**(med) [[30-systems/meta-economy]]:49 `reportMerge/reportComboPeak/reportSun` 3메서드 → 실제는 단일 `MetaStore.onMerge(comboValue,isSun)`.
- **M2**(med) 저장 스키마/필드명 불일치 — 문서 `missions{progress,…,lastResetDate}` ↔ 코드 `{comboPeak,mergeCount,sunCount,granted,claimedMilestones,resetDate}`.
- **M3**(med) [[30-systems/lucky-wheel]]:28 "잔액<120이면 회전 비활성" ↔ `LuckyWheelPopup`은 비활성 상태 없음(항상 활성).
- **R2**(med) [[50-art-ux/index]]:32 HUD "좌 머니·나가기 / 우 메뉴·랭킹" ↔ 정본 [[50-art-ux/layout]] + 코드(`Hud.ts`)는 좌 뒤로가기/우 메뉴 뿐("머니·랭킹 두지 않는다").
- **R3**(low) [[50-art-ux/index]]:35 "전체 톤 와인/골드" ↔ 정본 [[50-art-ux/art-direction]]+코드 `outerBg #15203d`(네이비). 와인은 superseded.
- **SD4**(med) [[50-art-ux/sound-design]]:56 "마스터 음소거·**볼륨** 지원" ↔ 구현은 binary 뮤트뿐, 볼륨 API/저장 전무.
- **SD5**(med) [[60-implementation/architecture]] 모듈맵이 `SoundManager`를 누락 → sound-manager.md의 `[[architecture]]` 경계 링크가 dangling.

---

## 3. 구현됐으나 문서 미반영 — undocumented (6)

- **A1**(high) [[60-implementation/architecture]]가 "9개 모듈"로 선언하나 실제 `game/src`는 **29개 .ts**. 누락(전부 wired): TitleScreen, GalaxyBackground, Effects, UnlockModal, Combo, MetaStore, MetaUI, SoundManager, assets, Planet, ui/{button,coin,Popup}, popups/{Shop,DailyMission,Attendance,LuckyWheel}Popup (~17).
- **A2**(med) [[60-implementation/plan/index]]:24도 같은 stale "9 모듈" 목록 반복.
- **A8**(med) [[70-verification/checklist]]·[[70-verification/kpi]]가 구현된 기능(Title 로비, 티어해금 모달, 콤보 카운터, 메타 경제)에 대한 검증 항목 없음.
- **R1**(med) `PlanetFactory.ts:5-17` 티어별 `PLANET_VISIBLE_DIAMETER` 보정 맵이 하드코딩 + `balance.json` SSoT 밖 + 문서 미기재(planet-art.md는 "256 정규화"까지만).
- **R5**(low) `Hud.ts`의 폰트/버튼 픽셀 수치(Score 32, best 17, 버튼 32×30…)가 하드코딩 — `balance.json _readme`의 "레이아웃 리터럴 하드코딩 금지" 원칙 위반.
- **M4**(low) 룰렛 감속이 +4바퀴 추가 + `+N` 당첨 텍스트 표시 — [[30-systems/lucky-wheel]] 미기재.
- **L6**(low) `containPlanets`의 하단 바닥 클램프(`floorY=GAUGE.cy+GAUGE.r`)가 [[30-systems/play-area-boundary]] 의사코드(좌/우/상만)에 없음.

> (L6/M4/R1/R5는 6건 카운트에 포함; A1·A2·A8과 함께 총 7개 항목이나 분포 집계는 undocumented 6 + misclassified로 분류된 A2 제외 기준에 따름 — 항목 ID 기준으로 읽을 것.)

---

## 4. 오분류 / 문서 내부 모순 — misclassified (1) + 내부 모순

- **A7**(low, misclassified) Phase 번호가 문서마다 다름 — [[60-implementation/task-breakdown]]·[[60-implementation/agent-runbook]] 0→5 vs [[60-implementation/plan/index]] 0→7.
- **내부 모순(위 항목에 포함)**: C5/C6/C8(페이지 내부 +1 vs +3), R2/R3([[50-art-ux/index]] 카탈로그가 정본과 어긋남), S4(screen-flow vs tier-unlock), L4(launch-queue 본문 vs cross-ref). → `index.md`류 요약 페이지가 정본 변경을 따라가지 못해 생긴 drift가 다수.

---

## 5. 반증된 항목 (오탐, 참고)

- (render) "행성 `pattern` enum이 렌더러에서 안 쓰임" → 사실이나 **orphan-doc 아님**: 렌더 정본은 PNG 스프라이트(planet-art.md)이고 그게 화면에 나옴. `pattern` 필드는 *코드 측* 미사용 데이터(부차적으로 union에 미사용 멤버 `stripesLight` 1개).
- (architecture) "콤보 보너스가 아키텍처 점수 모델에 없음 → undocumented" → **반증**: 콤보 보너스는 [[30-systems/scoring-combo]]에 상세 문서화됨. architecture.md:73은 점수를 balancing SSoT에 위임하는 개략 서술(다만 볼+3을 +1로 오기 → 이건 A3로 별도 확정).

---

## 우선순위 수정 워크리스트 (다음 단계 입력)

**P0 — 정본이 거짓을 단언 (반드시 정리):**
1. 콤보: ADR(remove-combo) + `balance.json _readme` + [[40-balancing/combo-scoring]] 헤더/의사코드를 "배율 제거→마일스톤 보너스(count×bonusPer)" 현 설계로 재작성. (C1·C2·C3·C4·C6·C7·P2·L3)
2. 게임 모드 레이어 7문서를 `status: draft`(미구축)로 내리거나 구현 — GDD가 "구현됨"으로 단정 금지. (MO1~MO7)
3. 점수 +1/+3: scoring-combo·combo-scoring·architecture·task-breakdown·kpi·checklist·merge-rules·`balance.json _readme`를 "벽+1/볼+3(minImpact 3.5)"로 통일. (C5·C8·A3·A4·L7·C9)
4. 점수 영속: Title 최고점수 추적+localStorage 구현하거나 문서에서 "영속" 주장 제거. (S2·S3)

**P1 — 구현/문서 한쪽 맞추기:**
5. 아키텍처/plan 모듈맵을 실제 29모듈로 갱신(+SoundManager 경계). (A1·A2·SD5)
6. 사운드 orphan 3종 배선 or 카탈로그 제거 + 뮤트 UI(설정 팝업) or 문서 축소; 볼륨 주장 정리. (SD1·SD2·SD3·SD4·S5)
7. 메타 경제 문서를 실제 API/스키마로 갱신; 룰렛 비활성 상태 구현 or 문서 완화. (M1·M2·M3)
8. 검증 체크리스트/KPI에 빌드된 기능 항목 추가. (A8)

**P2 — cross-ref·수치 stale·미세:**
9. 발사 수치 cross-ref 정정(fan 90/dragMax 110/vMax 30/queue 균등). (L1·L2·L4·A6)
10. index.md 카탈로그 drift(HUD 머니·랭킹, 와인 톤), Phase 번호 통일, config 경로, planetOutline/하드코딩 수치·visible-diameter SSoT화. (R2·R3·A7·A5·R4·R5·R1·M4·L6·S4·S6)
11. 죽은 데이터 정리: `queue.candidates`/`QUEUE_CANDIDATES`. (L5·P1)
