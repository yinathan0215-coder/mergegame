---
id: impl-architecture
note_type: spec
status: design
domain: implementation
updated: 2026-06-28
tags: [architecture, modules]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 구현 구조 / 모듈 / 데이터 모델 (§11)

> **결정됨.** `game/src/`는 아래 모듈로 나눈다(레이어별 정리). 각 모듈은 **한 가지 책임만**
> 가지며, **물리 규칙과 렌더 규칙을 한 파일에 섞지 않는다**. 스택: [[tech-stack]].

## 모듈 경계 (레이어 + 데이터)

### 데이터 · 부트
| 모듈 | 단일 책임 | 방법론 매핑 |
|---|---|---|
| `data/` (`balance.json` + `config.ts`·`planets.ts`) | **모든 튜너블 상수의 단일 출처**(JSON) + 로드·검증·파생. 시스템/렌더는 값을 정의하지 않고 여기서 로드 | [[../90-methodology/data-driven]] |
| `main` | 부트스트랩 — `GameScene` 생성·마운트 | [[../90-methodology/game-loop]] |
| `assets` | 에셋 매니페스트·로드(행성/UI/보드 텍스처) | — |
| `debug` | `window.__game` 검증 훅 표면(Playwright 관찰 API) — DEV 전용, 프로덕션 빌드에서 제거 | [[../90-methodology/acceptance-test]] |

### 시뮬레이션 · 코어 루프
| 모듈 | 단일 책임 | 방법론 매핑 |
|---|---|---|
| `GameScene` | Pixi 앱·렌더 루프·씬 상태(`Loading`→`Title`→`PoolInGame`) + **세션 내부 phase**(`playing`/`paused`/`pendingEnd`/`clearing`/`ended`, [[../20-core-loop/screen-flow]])·시스템 오케스트레이션·세션 종료 판정. 검증 훅(`debug`)·경계 물리(`Containment`)는 별 모듈로 분리 | [[../90-methodology/state-machine]] · [[../90-methodology/game-loop]] |
| `Containment` | 절대 플레이 영역 경계 — 매 substep clamp+반사로 터널링 방지 + 발사대 원 재진입 차단(물리 규칙, 오케스트레이터에서 분리) | [[../90-methodology/game-loop]] · [[../90-methodology/ecs-lite]] |
| `LoadingScreen` | 부팅 로딩 씬 — `GALAXY PINBALL` 타이틀 글자 스트림 + 최소 2초 floor | [[../90-methodology/state-machine]] · [[../90-methodology/layered-rendering]] |
| `modes/ModeController` | 게임 모드 권위(Infinite/Stage): 남은 카운트·차지·스테이지 레벨 로드·클리어/실패 판정 | [[../90-methodology/state-machine]] · [[../90-methodology/data-driven]] |
| `PhysicsWorld` | Matter 엔진, 충돌 벽, 물리 step, 바디 생성/삭제 | [[../90-methodology/game-loop]] (Fixed Step) |
| `QueueSystem` | 발사 행성 선택(해금 연동 낮은 단계 균등 랜덤) | [[../90-methodology/event-driven]] |
| `MergeSystem` | 동급 충돌 감지, 합성 위치/속도, merge lock·재합성 지연 | [[../90-methodology/event-driven]] |
| `ScoreSystem` | 충돌(벽 +1·행성 +3)·머지 등급 점수·콤보 보너스 가산 | [[../90-methodology/event-driven]] · [[../90-methodology/data-driven]] |
| `Combo` | 연속 머지 체인 카운터(유지창) + 5단위 마일스톤 보너스 산출·"Combo/N" 표시 | [[../90-methodology/event-driven]] · [[../90-methodology/layered-rendering]] |
| `Planet` | 행성 **entity**(바디+단계+스프라이트 묶음) | [[../90-methodology/ecs-lite]] |

### 입력 · 렌더
| 모듈 | 단일 책임 | 방법론 매핑 |
|---|---|---|
| `Launcher` | 하단 발사대, 드래그 입력, 조준선, 발사 처리 | [[../90-methodology/layered-rendering]] (입력 레이어) |
| `PlanetFactory` | 행성 **스프라이트**(디스크·패턴·외곽선) 생성 — 단계 수치/색은 `data/`에서 참조 | [[../90-methodology/layered-rendering]] · [[../90-methodology/ecs-lite]] |
| `BoardRenderer` | 보드 프레임·경계·장식 + 보드 내부 은하 배경 시각화 | [[../90-methodology/layered-rendering]] |
| `GalaxyBackground` | 우주 배경 이미지 + 런타임 반짝임(Title 전체·보드 내부 공용) | [[../90-methodology/layered-rendering]] |
| `Effects` | 머지/충돌 연출(스케일 팝·발산 버스트·히트 스트릭·+N·콤보 +N 플로팅) | [[../90-methodology/layered-rendering]] · [[../90-methodology/event-driven]] |
| `Hud` | 인게임 상단 HUD: Score·👑최고점수·나가기·메뉴 | [[../90-methodology/layered-rendering]] (UI 레이어) |
| `GameInfoPanel` | 인게임 좌하단 위젯: 남은 카운트 + Next 미리보기(모드별) | [[../90-methodology/layered-rendering]] (UI 레이어) |

### Title · 메타 · UI
| 모듈 | 단일 책임 | 방법론 매핑 |
|---|---|---|
| `TitleScreen` | Title 로비(태양계 공전 배경·최고/현재 점수·사이드 4버튼·Infinite\|Stage 모드 토글) | [[../90-methodology/state-machine]] · [[../90-methodology/layered-rendering]] |
| `UnlockModal` | 신규 등급 첫 생성 시 해금 소개 모달(일시정지) | [[../90-methodology/state-machine]] · [[../90-methodology/layered-rendering]] |
| `MetaStore` | 메타 상태 권위: 코인 지갑·일일 미션·출석·점수 레코드(KST 리셋·localStorage 영속) | [[../90-methodology/data-driven]] · [[../90-methodology/event-driven]] |
| `MetaUI` | 메타 팝업 라우터/레이어(일일미션·출석·룰렛·상점·설정 열기) | [[../90-methodology/layered-rendering]] · [[../90-methodology/event-driven]] |
| `popups/` (`DailyMission`·`Attendance`·`LuckyWheel`·`Shop`·`Settings`·`Charge`·`Result`·`StageEnd`) | 각 메타·모드 팝업 뷰(설정·코인충전·결과·스테이지 클리어/실패 포함) | [[../90-methodology/layered-rendering]] |
| `ui/` (`Popup`·`button`·`coin`·`CoinPill`) | 공통 UI 프리미티브(팝업 틀·버튼 프레스 피드백·코인 칩·코인 잔액 pill) | [[../90-methodology/layered-rendering]] |

### 사운드
| 모듈 | 단일 책임 | 방법론 매핑 |
|---|---|---|
| `SoundManager` | Web Audio 절차 합성 효과음(보이스 상한·throttle·우선순위·뮤트) — 게임 이벤트 구독 **부수효과**(시뮬레이션을 되먹이지 않음) | [[../90-methodology/event-driven]] · [[sound-manager]] |

## 시뮬레이션 ↔ 렌더 분리 (핵심 규칙)

- **권위(authoritative)는 Matter**: 위치/속도/충돌은 `PhysicsWorld`의 바디가 정한다.
- **렌더는 읽기 전용**: `GameScene` 렌더 루프가 매 프레임 바디 좌표를 읽어 Pixi
  스프라이트에 반영한다. 스프라이트가 물리를 되먹이지 않는다.
- **충돌 → 이벤트 → 규칙**: `PhysicsWorld` 충돌 이벤트를 `MergeSystem`이 받아 같은
  단계 판정·합성을 수행하고, 합성 결과가 `ScoreSystem`으로 흘러간다(이벤트 흐름:
  [[../90-methodology/event-driven]]).

## 데이터 모델

행성은 ECS-lite 관점의 **entity**: `(Matter 바디) + (단계 데이터) + (Pixi 스프라이트)`.

### 수치 단일 출처 = `game/src/data/balance.json` (코드 SSoT)

> **결정됨.** 게임 내 **모든 튜너블 상수**는 `game/src/data/balance.json` **한 파일에만**
> 선언한다. 시스템/렌더 코드는 값을 하드코딩하지 않고 로더를 통해 로드한다. **중복 변수 선언 금지.**
> `config.ts`·`planets.ts`는 값을 *선언*하지 않고 JSON을 로드·검증·파생만 한다(소비자 import 무변경).

- `balance.json` — 단일 출처: `planets`(11단계 반지름·점수·색·패턴) · `scoring` · `juice`(`combo`·`result` 포함) ·
  `queue` · `rack` · `launch` · `physics` · `progression` · `modes`(Infinite/Stage·카운트·차지·블랙홀 보너스·스테이지 레벨) ·
  `layout`(HUD/보드/PLAY/발사대) · `colors` · `engine` · `economy` · `dailyMissions` · `attendance` · `wheel` · `sound`.
- `game/src/data/planets.ts` — 로더: JSON에서 행성 사다리/랙을 빌드(`TIERS`·`tierData`·
  `INITIAL_RACK`) + 큐 보충(`randomQueueTier` — 해금 범위 균등 랜덤), 색 hex 문자열→숫자 파싱,
  무결성 검증(11단계).
- `game/src/data/config.ts` — 로더: 레이아웃·색·발사·물리·점수·연출 export, **파생값**(`LINE_Y`=
  PLAY 하단, `POCKET.cy`·`LAUNCHER.y`, `STEP_MS`=1000/fps)을 JSON 원시값에서 계산.
- 소비자 모듈은 기존대로 `./data/config`·`./data/planets`에서 import(이름 무변경).

문서별 SSoT 매핑(설계 정본) — JSON은 이 정본의 **코드 미러**다:

| 데이터 | 설계 정본(docs) | JSON 섹션 |
|---|---|---|
| 단계 **순서** | [[../10-concept/index]] | `planets[].tier` |
| 반지름·기본 점수·큐·랙·발사·물리·연출 | [[../40-balancing/index]] | `planets`/`scoring`/`queue`/`rack`/`launch`/`physics`/`juice` |
| 색·패턴·레이아웃 | [[../50-art-ux/index]] · [[../50-art-ux/screen-structure]] | `colors`/`planets[].pattern`/`layout` |
| 일방향 경계 | [[../30-systems/play-area-boundary]] | `layout`(PLAY/LINE/POCKET) |

> 수정은 [[balance-tune]] 스킬 / `balance-tuner`(sonnet) 에이전트로: JSON 편집 → 해당 docs
> 페이지 reconcile → `npm run typecheck`. **SQLite는 미채택** — 데이터는 ~30개 정적 상수라
> 관계·쿼리·동시쓰기 needs가 없어 DB(WASM 로더 + 비동기 부팅)는 과스펙이다(빌드 타임 JSON
> import가 타입 안전 + Vite HMR로 충분). 대규모·관계형·런타임 쿼리가 생기면 재검토.

`ScoreSystem`은 충돌(벽·발사대 원 +1 · 행성–행성 +3, `minImpact` 게이트)·머지 생성 등급 점수·
`Combo` 마일스톤 보너스를 가산한다.
merge lock은 `MergeSystem`이 같은 tick 내 중복 합성을 막는 내부 플래그다.

## 관련

- [[tech-stack]] · [[task-breakdown]] · [[agent-runbook]]
- [[../30-systems/index]] — 모듈이 구현할 합성/발사/큐 규칙
- [[../40-balancing/index]] · [[../50-art-ux/index]] — 데이터 테이블의 출처
