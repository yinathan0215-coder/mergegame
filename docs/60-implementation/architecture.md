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

> **결정됨.** `game/src/`는 아래 **9개 모듈**로 나눈다. 각 모듈은 **한 가지 책임만**
> 가지며, **물리 규칙과 렌더 규칙을 한 파일에 섞지 않는다**. 스택: [[tech-stack]].

## 모듈 경계 (9 + 데이터 레이어)

| 모듈 | 단일 책임 | 방법론 매핑 |
|---|---|---|
| `data/` (`balance.json` + `config.ts`·`planets.ts`) | **모든 튜너블 상수의 단일 출처**(JSON) + 로드·검증·파생. 시스템/렌더는 값을 정의하지 않고 여기서 로드 | [[../90-methodology/data-driven]] (ADR [[decisions/2026-06-28-data-driven-balance-json]]) |
| `GameScene` | Pixi 애플리케이션, 렌더 루프, 전체 상태 전환 | [[../90-methodology/state-machine]] · [[../90-methodology/game-loop]] |
| `PhysicsWorld` | Matter 엔진, 충돌 벽, 물리 step, 바디 생성/삭제 | [[../90-methodology/game-loop]] (Fixed Step) |
| `PlanetFactory` | 행성 **스프라이트**(디스크·패턴·외곽선·연출) 생성 — 단계 수치/색은 `data/`에서 참조(정의하지 않음) | [[../90-methodology/layered-rendering]] · [[../90-methodology/ecs-lite]] |
| `Launcher` | 하단 발사대, 드래그 입력, 조준선, 발사 처리 | [[../90-methodology/layered-rendering]] (입력 레이어) |
| `QueueSystem` | 발사 행성 선택, 낮은 5종 균등 랜덤 | [[../90-methodology/event-driven]] |
| `MergeSystem` | 같은 단계 충돌 감지, 합성 위치/속도 계산, merge lock | [[../90-methodology/event-driven]] |
| `ScoreSystem` | 충돌 +1 · 머지 등급 점수 | [[../90-methodology/event-driven]] · [[../90-methodology/data-driven]] |
| `Hud` | Score·최고점수·머니·랭킹 표시 | [[../90-methodology/layered-rendering]] (UI 레이어) |
| `BoardRenderer` | 프레임, 우주 배경, 장식, 보드 경계 시각화 | [[../90-methodology/layered-rendering]] |

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

> **결정됨(ADR [[decisions/2026-06-28-data-driven-balance-json]]).** 게임 내 **모든 튜너블
> 상수**는 `game/src/data/balance.json` **한 파일에만** 선언한다. 시스템/렌더 코드는 값을
> 하드코딩하지 않고 로더를 통해 로드한다. **중복 변수 선언 금지.**

- `balance.json` — 단일 출처: `planets`(9단계 반지름·점수·색·패턴) · `scoring` · `juice` · `queue` ·
  `rack` · `launch` · `physics` · `layout`(HUD/보드/PLAY/포켓/발사대) · `colors` · `engine`.
- `game/src/data/planets.ts` — 로더: JSON에서 행성 사다리/큐/랙을 빌드(`TIERS`·`tierData`·
  `INITIAL_RACK`·`QUEUE_CANDIDATES`), 색 hex 문자열→숫자 파싱, 무결성 검증(9단계).
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
> 페이지 reconcile → `npm run typecheck`. **SQLite는 미채택**(브라우저 정적 상수에 과스펙) —
> 근거는 ADR.

`ScoreSystem`은 충돌마다 +1, 머지마다 생성 등급 점수를 가산한다.
merge lock은 `MergeSystem`이 같은 tick 내 중복 합성을 막는 내부 플래그다.

## 관련

- [[tech-stack]] · [[task-breakdown]] · [[agent-runbook]]
- [[../30-systems/index]] — 모듈이 구현할 합성/발사/큐 규칙
- [[../40-balancing/index]] · [[../50-art-ux/index]] — 데이터 테이블의 출처
