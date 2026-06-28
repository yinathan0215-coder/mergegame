---
id: core-loop-screen-flow
note_type: section
status: design
domain: core-loop
updated: 2026-06-29
tags: [core-loop, scene, screen-flow, state-machine, title, loading, galaxy-pinball]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 화면(씬) 흐름 — Loading · Title · Pool In-Game

> 과제 요구 ② — *Core Loop & 플레이 흐름* 중 **앱 레벨 화면 구조**를 못 박는다. 게임은 단일
> 화면이 아니라 **세 개의 씬(scene)**으로 나뉘며, 이 페이지는 그 씬들과 전이를 정본으로 둔다.
>
> **준수 기준(방법론):** [[../90-methodology/state-machine]] (최상위 상태·전이·입력/시간 정책).
> 8단계 게임 루프 자체는 [[core-loop]], 한 세션 내부 흐름은 [[play-flow]].

## 씬 구성

| 씬 | 역할 | 정본 |
|---|---|---|
| **Loading** | 부팅 시 리소스(행성 스프라이트·보드·폰트) 로드 화면 | 이 페이지 §Loading |
| **Title (Lobby)** | 시작 화면 — 태양계 공전 배경 + 로비 UI. Play로 게임 진입 | [[../50-art-ux/title-screen]] |
| **Pool In-Game** | 현재 구현된 풀 조준·물리 머지 보드(코어 루프가 도는 화면) | [[../50-art-ux/layout]] · [[../50-art-ux/screen-structure]] · [[core-loop]] |

세 씬 모두 같은 **9:16 세로** 프레임을 쓰고, 바깥 네이비(`outerBg`) `background color`가 화면 전체를
채운다([[../50-art-ux/layout]]). 한 번에 **하나의 씬만** 활성화된다.

## 상태 전이 ([[../90-methodology/state-machine]] 바인딩)

| From | Event | To | 조건 | 부가 처리 |
|---|---|---|---|---|
| `Loading` | `ASSETS_READY` & **저장 있음** | `Title` | 리소스 로드 완료 **AND 경과 ≥ 2초**(최소 로딩 floor) | 태양계 배경 공전 시작 |
| `Loading` | `ASSETS_READY` & **저장 없음(최초 실행)** | `PoolInGame(Stage 1)` | 위와 동일 + `localStorage` 세이브 부재 | **Title 건너뜀** — 곧장 Stage 1 세션 시작 |
| `Title` | `PLAY_CLICKED` | `PoolInGame` | Play 버튼(**선택 모드** 동반: Infinite/Stage) | 해당 모드로 세션 시작 또는 **이어하기**(진행 중 점수 유지) |
| `PoolInGame` | `EXIT_CLICKED` | `Title` | 인게임 HUD 나가기(←) 버튼 | Pool 세션 상태·점수 보존(파기하지 않음) |
| `PoolInGame` | **모드 종료** | `Result`/`StageClear`/`StageFail` | 모드별 종료 조건([[game-modes]]) | 결과창(전환). 종료 전이 정본 [[game-modes]] §상태 전이 |

`Boot`(앱 초기화)는 프로토타입에서 `Loading`에 흡수한다. **세션 종료는 게임 모드가 정한다**
([[game-modes]]): Infinite는 카운트 소진 후 결과창, Stage는 목표 달성/실패 결과창으로 끝난다
(아래 §게임 모드 선택). `PoolInGame`을 **나가기(←)** 로 떠나면 진행 중 Pool 세션 상태·점수는
**`localStorage`에 저장**되어 Title의 "현재 점수"로 다시 보이며, 새로고침 후에도 이어진다
(점수 영속 정본 [[../50-art-ux/title-screen]] §2-2).

**씬 전이 효과:** 씬을 바꿀 때 짧은 **페이드(블랙 인 → 씬 교체 → 아웃)** 전환을 둔다(전환 중 입력 무시).

## 씬별 입력·시간 정책

| 씬 | 허용 입력 | 시간(물리) |
|---|---|---|
| `Loading` | 없음 | 정지 (타이틀 스트림 연출만) |
| `Title` | 로비 버튼(Play·일일 미션·상점·출석 체크·행운의 돌림판·토글·설정)만 | 정지 (태양계 배경은 공전 애니메이션) |
| `PoolInGame` | 모든 플레이 입력(press-drag-release 발사) — [[../50-art-ux/input-ux]] | 진행 (고정 스텝 물리) |

Title 배경의 태양계 공전과 Pool In-Game의 물리 시뮬레이션은 **서로 다른 시간 정책**이다:
Title의 공전은 순수 렌더 연출(시뮬레이션 아님), Pool In-Game만 고정 스텝 물리가 돈다.

## PoolInGame 내부 상태 (in-session phase)

`PoolInGame` 씬 안의 세션 흐름은 단일 `phase` 상태로 고정한다 — 불리언 조합으로 흐름을 암묵화하지
않는다([[../90-methodology/state-machine]]). 상태는 **상호배타적**이며 한 번에 하나만 활성이다.

| phase | 의미 | 물리 | 발사 | 진입 | 이탈 |
|---|---|---|---|---|---|
| `playing` | 일반 플레이 | 진행 | 가능 | 세션 시작·재개 | 아래 전이 |
| `paused` | 해금 모달(RewardPopup) | 정지 | 불가 | 새 단계 첫 합성(Infinite) | OK → `playing` |
| `pendingFail` | Stage 카운트 소진 후 실패 대기(2초) | 진행 | 불가 | 카운트 0(Stage·목표 미달) | 타이머/탭 → `stageFail` |
| `clearing` | Stage 클리어 비행 연출 | 정지 | 불가 | 목표 행성 생성 | 연출 종료 → `stageClear` |
| `result` | Infinite 결과창 | 정지 | 불가 | 카운트 0 + 전 행성 정지 | 탭 → Title(씬 전이) |
| `stageClear` | Stage 클리어창 | 정지 | 불가 | `clearing` 완료 | 다음/돌아가기(씬 전이) |
| `stageFail` | Stage 실패창 | 정지 | 불가 | `pendingFail` 만료 | 닫기 → 같은 Stage(씬 전이) |

결과/클리어/실패는 **1급 상태**다(payload 플래그가 아니라 별도 phase). 모든 전이는 단일 가드된
`setPhase()` 한 곳을 통과한다(산재 대입 금지). `* → playing` 은 세션 시작(`startSession`, 재시작 포함)에서
일어난다. `pendingFail` 이 별도 상태이므로 실패 대기 중 발생한 합성이 해금 모달(`paused`)을 띄우는
**상태 공존**은 구조적으로 발생하지 않는다(목표 합성 시엔 `clearing` 으로 전이해 실패를 덮는다). 인게임
메타/충전 팝업 표시 중에는 phase와 별개로 물리·발사를 정지한다(딤 오버레이 동안 시간정책 일관). 이 표는
[[game-modes]] §상태 전이의 모드 종료를 **세션 내부 관점**에서 구현한 것이다.

## Loading 씬

- **목적:** 앱 부팅 시 첫 화면. 에셋이 준비되는 동안, 그리고 **최소 2초** 동안 게임 타이틀을 보여준다(부팅
  첫인상·브랜드 노출).
- **타이틀(텍스트 스트림):** 바깥 `background color`(네이비) 위에 게임 이름 **`GALAXY PINBALL`(영문)**을
  화면 중앙에 **한 글자씩 경쾌하게 스트림 인**한다 — 글자마다 팝-스케일(overshoot)로 톡톡 등장. 하단의
  슬림한 **프로그레스 바**가 로딩 시간 동안 채워진다.
- **최소 로딩 시간(floor):** 에셋이 즉시 준비돼도 Loading은 **최소 2초** 유지한다. 전이 조건은
  `리소스 준비 완료 AND 경과 ≥ 2초`.
- **전이:** 조건을 만족하면 `ASSETS_READY`로 **자동 진입**해 Title로 페이드한다(사용자 입력 없음).

> 플레이어 노출 타이틀은 **`GALAXY PINBALL`(은하 핀볼)**. `Planet Pool Merge`는 GDD 내부 설계
> 디스크립터로 유지한다(로딩 스플래시에 노출되는 이름은 Galaxy Pinball).

## 게임 모드 선택 (Infinite | Stage)

Title 하단 토글 `Stage | Infinite`(좌:Stage, 우:Infinite)가 진입할 **게임 모드**를 고른다
([[game-modes]]). 기본 활성은 **Stage**다. Play 버튼 라벨은 두 모드 공통 `Game Start`이고,
**Stage를 고르면** Title의 최고·현재 점수 영역이 `Stage N` 정보로 대체된다
([[../50-art-ux/title-screen]] §2-2·§2-4). Play를 누르면 선택 모드로 Pool In-Game에 진입하고,
모드는 한 세션 동안 고정된다.

## 최초 실행 (저장 없음 → Stage 1 직행)

`localStorage` 세이브가 없는 **게임 최초 실행**에서는 Loading floor가 끝나면 **Title을 건너뛰고
바로 Stage 1 플레이로 진입**한다(첫 플레이어를 즉시 코어 루프에 노출). 한 번이라도 플레이해
세이브가 생기면 이후 부팅은 Loading → Title 순으로 진입한다. 이때 진입 모드는 Stage,
스테이지는 1번이다([[game-modes]] §Stage 모드).

## 관련
- [[index]] — 섹션 카탈로그
- [[game-modes]] — Infinite/Stage 모드 구조·종료 조건·결과창
- [[core-loop]] — Pool In-Game에서 도는 8단계 루프(모드가 종료를 정함)
- [[play-flow]] — Pool 세션 내부 흐름(초기 랙·온보딩)
- [[../50-art-ux/title-screen]] — Title(로비) 화면 레이아웃·배경·토글·버튼 피드백
- [[../50-art-ux/layout]] · [[../50-art-ux/screen-structure]] — Pool In-Game 화면 정본
- [[../90-methodology/state-machine]] — 최상위 상태·전이·입력/시간 정책 표준
