---
id: core-loop-game-modes
note_type: section
status: design
domain: core-loop
updated: 2026-06-29
tags: [core-loop, game-mode, infinite, stage, state-machine]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 게임 모드 — Infinite · Stage

> 과제 요구 ② — Pool In-Game은 **두 게임 모드**로 플레이된다: **Infinite(무한)** 와
> **Stage(스테이지)**. 이 페이지가 모드 구조의 정본이다. 8단계 코어 루프 자체는 두 모드가
> 공유하며([[core-loop]]) 모드는 그 위에 **카운트 예산 + 종료 조건**을 씌운다.
>
> **준수 기준(방법론):** [[../90-methodology/state-machine]] (모드/종료 상태·전이).
> 카운트 [[../30-systems/launch-count]] · 충전 [[../30-systems/planet-charge]] ·
> 스테이지 데이터 [[../30-systems/stage-mode]] · 결과창 [[../50-art-ux/result-window]].

## Summary

기본 모드는 **Stage**다. 두 모드 모두 같은 보드·발사·합성·점수를 쓰되, **남은 카운트
(발사 가능 횟수)** 라는 공통 자원과 **종료 조건**이 다르다. Infinite는 점수 누적이 목표이고,
Stage는 **지정한 목표 행성을 카운트 안에 합성**하면 클리어다.

## 모드 선택 (Title 하단)

- Title(로비) 하단 중앙의 **알약(pill) 토글**이 모드를 고른다. 두 세그먼트는 좌 `Stage`·우 `Infinite`이며
  활성 세그먼트 위에 **하이라이트 캡슐**이 놓이고 탭하면 반대 세그먼트로 좌우 슬라이드한다(토글
  시각/애니메이션 규칙은 [[../50-art-ux/title-screen]] §2-4).
- **기본 활성 = Stage**(왼쪽 세그먼트).
- **게임 최초 실행(저장 정보 없음) 시에는 Title을 건너뛰고 바로 Stage 1 플레이로 진입한다**
  ([[screen-flow]] §최초 실행). 이후(저장이 생긴 뒤)에는 Loading → Title 순으로 진입한다.
- **시작(Play) 버튼 라벨은 두 모드 공통 `Game Start`** 다. **Stage를 고르면** Title의 최고·현재
  점수 UI가 숨겨지고, 최고 점수 영역에 **`Stage N`(스테이지 정보)** 가 대신 표시된다
  ([[../50-art-ux/title-screen]] §2-2).
- Play를 누르면 선택 모드로 Pool In-Game에 진입한다(`PLAY_CLICKED` + 모드,
  [[screen-flow]]). 모드는 한 세션 동안 고정된다.

## Infinite 모드

- **시작 카운트 = 50** ([[../30-systems/launch-count]], 수치 [[../40-balancing/game-modes]]).
- **카운트 충전 버튼:** 보드 우측 빈 영역에 충전 버튼이 있다 — 회전하는 지구 아이콘 + 영문
  타이틀(`Planet Charge`). 누르면 코인으로 카운트를 사는 충전 팝업이 열린다
  ([[../30-systems/planet-charge]]).
- **마지막 행성 보너스:** 마지막 행성(블랙홀, 11단계)끼리 합성하면 두 블랙홀이 사라지고
  **카운트 +20** 을 준다(Infinite 한정, [[../30-systems/merge-rules]]).
- **해금 보너스:** 새 단계 해금 팝업(넵튠 6단계부터)이 뜰 때마다 **카운트 +10** 을 준다(Infinite
  한정). 해금 팝업의 OK 버튼 위에 `Count +10` 이 강조 표시된다([[../30-systems/tier-unlock]]).
- **종료 조건:** **카운트를 모두 소진하고 보드의 모든 행성이 멈추면** 세션이 끝나고 결과창이 뜬다
  (Stage와 달리 고정 지연 없이 정지 직후). 결과창은 전환 효과와 함께 등장해 스코어가 1부터 최종 점수까지
  카운트업되고, 최고 점수 갱신이면 `NEW RECORD`, 하단에 **최대 콤보 횟수**를 표시한다. 탭하면
  **Title로 복귀**한다(연출 정본 [[../50-art-ux/result-window]]).

## Stage 모드

- **스테이지 단위:** 각 스테이지는 (1) 큐에 등장할 행성 시퀀스, (2) 시작 랙의 행성 위치·종류,
  (3) **목표 행성**, (4) 카운트를 데이터로 정의한다(스키마 [[../30-systems/stage-mode]]).
  레벨 디자인(실제 스테이지 수치)은 차후 단계이며, 현재는 구조와 1개 플레이스홀더 스테이지만 둔다.
- **클리어 조건:** 카운트 안에 **목표 행성을 합성으로 만들면** 성공이다. 달성 **2초 뒤**(그 사이
  **화면을 탭하면 즉시**) 클리어 결과창이 전환 효과와 함께 뜨고 **코인 +300** 을 준다. 결과창
  하단에는 **[다음 스테이지]** 와 **[돌아가기]**(→Title) 버튼이 있다.
- **이미 클리어한 스테이지는 다시 클리어되지 않는다** — 클리어 기록이 영속되며, 재방문 시 목표를
  만들어도 보상·클리어창이 뜨지 않는다(중복 보상 방지, [[../30-systems/stage-mode]]).
- **인게임 상단:** Stage는 점수·콤보를 집계/표시하지 않으므로 최상단 중앙에 점수 대신
  **`STAGE N`**(현재 스테이지)을 표시한다([[../50-art-ux/layout]]).
- **실패 조건:** 카운트를 모두 소진했는데 목표를 못 만들면 실패다. 소진 **2초 뒤 Fail 결과창**이
  전환 효과와 함께 뜨고, 닫으면 **게임 화면으로 복귀**한다(같은 스테이지 보드).

## 모드별 인게임 HUD 요약

좌하단·우측 빈 영역에 모드별 정보를 둔다(배치 정본 [[../50-art-ux/layout]]):

| 위치 | Infinite | Stage |
|---|---|---|
| **하단 좌측** | 남은 발사 수 **PLANET** + 큐의 Next(가로 나란히) | 남은 발사 수 **PLANET** + Next(가로 나란히) |
| **하단 우측** | 행성 충전 버튼(회전 지구 + `Planet Charge`) | 목표 행성 정보(이름 + 회전하는 행성 이미지) |

하단 위젯은 보드/발사대 **아래 스트립**에 두어 플레이 영역을 가리지 않는다([[../50-art-ux/layout]] §2-b).

## 상태 전이 (모드 종료 — [[../90-methodology/state-machine]])

| From | Event | To | 조건 |
|---|---|---|---|
| `PoolInGame(Infinite)` | `COUNT_DEPLETED` & 모든 행성 정지 | `Result` | 결과창(전환·카운트업) |
| `PoolInGame(Stage)` | 목표 행성 생성 → 2초 | `StageClear` | +300코인·전환 |
| `PoolInGame(Stage)` | `COUNT_DEPLETED` & 목표 미달 → 2초 | `StageFail` | Fail 결과창(전환) |
| `Result` | tap | `Title` | — |
| `StageClear` | [다음 스테이지] / [돌아가기] | 다음 스테이지 / `Title` | — |
| `StageFail` | 닫기 | `PoolInGame(Stage)` | 같은 스테이지 보드 |

## Relates to
- [[core-loop]] — 두 모드가 공유하는 8단계 루프
- [[screen-flow]] — 씬/모드 선택·종료 상태 전이
- [[../30-systems/launch-count]] — 남은 카운트 자원
- [[../30-systems/planet-charge]] — Infinite 충전 버튼·팝업
- [[../30-systems/stage-mode]] — Stage 정의 데이터 스키마
- [[../50-art-ux/result-window]] — 결과/클리어/실패 창 연출
- [[../40-balancing/game-modes]] — 모드 수치(카운트 50·충전·보너스·보상)
