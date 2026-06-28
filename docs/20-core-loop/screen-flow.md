---
id: core-loop-screen-flow
note_type: section
status: design
domain: core-loop
updated: 2026-06-28
tags: [core-loop, scene, screen-flow, state-machine, title, loading]
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

세 씬 모두 같은 **9:16 세로** 프레임을 쓰고, 바깥 와인색 `background color`가 화면 전체를
채운다([[../50-art-ux/layout]]). 한 번에 **하나의 씬만** 활성화된다.

## 상태 전이 ([[../90-methodology/state-machine]] 바인딩)

| From | Event | To | 조건 | 부가 처리 |
|---|---|---|---|---|
| `Loading` | `ASSETS_READY` | `Title` | 리소스 로드 완료 | 태양계 배경 공전 시작 |
| `Title` | `PLAY_CLICKED` | `PoolInGame` | Play(게임 시작) 버튼 | Pool 세션 시작 또는 **이어하기**(진행 중 점수 유지) |
| `PoolInGame` | `EXIT_CLICKED` | `Title` | 인게임 HUD 나가기(←) 버튼 | Pool 세션 상태·점수 보존(파기하지 않음) |

`Boot`(앱 초기화)는 프로토타입에서 `Loading`에 흡수한다. 게임 오버가 없으므로
([[core-loop]]) `Result`/`Restart` 상태는 두지 않는다 — `PoolInGame`은 나가기로만 떠나고
Pool 세션은 메모리에 유지되어 Title의 "현재 점수"로 다시 보인다.

## 씬별 입력·시간 정책

| 씬 | 허용 입력 | 시간(물리) |
|---|---|---|
| `Loading` | 없음 | 정지 (배경 공전 연출만) |
| `Title` | 로비 버튼(Play·일일 미션·상점·출석 체크·행운의 돌림판·토글·설정)만 | 정지 (태양계 배경은 공전 애니메이션) |
| `PoolInGame` | 모든 플레이 입력(press-drag-release 발사) — [[../50-art-ux/input-ux]] | 진행 (고정 스텝 물리) |

Title 배경의 태양계 공전과 Pool In-Game의 물리 시뮬레이션은 **서로 다른 시간 정책**이다:
Title의 공전은 순수 렌더 연출(시뮬레이션 아님), Pool In-Game만 고정 스텝 물리가 돈다.

## Loading 씬

- **목적:** 부팅 시 행성 스프라이트·보드 그래픽·폰트 등 에셋이 준비될 때까지 한 화면을 보여준다.
- **표시:** 와인색 `background color` 위에 진행 표시(프로그레스 바 또는 스피너) 1개.
- **전이:** 에셋 로드가 끝나면 `ASSETS_READY`로 **자동 진입**해 Title로 넘어간다(사용자 입력 없음).
- 로딩 화면의 구체 아트(브랜드 로고·일러스트)는 미정 → Open question.

## Galaxy / Fantasy (테마 토글)

Title 하단 토글 `Galaxy | Fantasy`는 **테마/모드 선택의 시각 자리표시자**다. 현재 Pool In-Game은
**Galaxy(태양계 행성 테마)** 하나만 가지며 기본 활성이다. **Fantasy 뒤에 연결된 콘텐츠/모드는
아직 없으므로**, 토글을 Fantasy로 옮겨도 Play는 동일한 Galaxy Pool In-Game으로 진입한다. 토글의
시각/애니메이션 규칙은 [[../50-art-ux/title-screen]].

## 관련
- [[index]] — 섹션 카탈로그
- [[core-loop]] — Pool In-Game에서 도는 8단계 루프(게임 오버 없음)
- [[play-flow]] — Pool 세션 내부 흐름(초기 랙·온보딩)
- [[../50-art-ux/title-screen]] — Title(로비) 화면 레이아웃·배경·토글·버튼 피드백
- [[../50-art-ux/layout]] · [[../50-art-ux/screen-structure]] — Pool In-Game 화면 정본
- [[../90-methodology/state-machine]] — 최상위 상태·전이·입력/시간 정책 표준

## Open questions
- **설정(⚙) 버튼 내용**: Title 우상단 설정 버튼의 내부 항목 지시가 truncated(입력 로그 17:15:49)
  되어 미정. 프로토타입은 placeholder로 둔다([[../50-art-ux/title-screen]]).
- **Fantasy 모드**: Fantasy 테마/모드의 실제 콘텐츠 미정 — 현재는 토글 시각 전환만.
- **점수 영속성**: 최고 점수·현재 점수의 저장 방식(메모리 vs localStorage) 미정 — 프로토타입
  기본은 메모리 유지.
