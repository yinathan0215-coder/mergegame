---
id: systems-stage-mode
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, stage, game-mode, level, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# Stage 모드 — 정의 데이터 & 클리어/실패

> 과제 요구 ③. **Stage 모드**의 데이터 구조(스테이지를 무엇으로 정의하는가)와 클리어/실패
> 규칙을 정본화한다. 모드 개요 [[20-core-loop/game-modes]] · 카운트 [[30-systems/launch-count]] ·
> 결과창 [[50-art-ux/result-window]].
>
> **준수 기준(방법론):** [[90-methodology/data-driven]] (스테이지 = 데이터 테이블) ·
> [[90-methodology/state-machine]] (클리어/실패 종료 상태).

## Summary

Stage 모드는 **데이터로 정의한 스테이지**를 차례로 푼다. 각 스테이지는 **시작 랙·큐 시퀀스·
목표 행성·카운트**를 못 박는다. 카운트 안에 **목표 행성을 합성**하면 클리어(코인 +300),
못 만들면 실패다. **레벨 디자인(실제 스테이지별 수치)은 차후 단계**이고, 지금은 이 구조와
플레이스홀더 **Stage 1** 하나만 둔다.

## Details (decisions)

### 스테이지 정의 스키마
한 스테이지는 다음 필드를 갖는다(수치 SSoT [[40-balancing/game-modes]], 코드 SSoT
`game/src/data/balance.json` `modes.stage.levels`):

| 필드 | 의미 |
|---|---|
| `count` | 이 스테이지의 시작 카운트(발사 예산) |
| `target` | **목표 행성 단계**(이 등급을 합성으로 만들면 클리어). 사다리 순서 [[10-concept/index]] |
| `rack` | **시작 랙**: 각 행성의 `{ tier, x, y }`(보드 좌표) 목록 — 위치와 종류를 직접 지정 |
| `queue` | **발사 큐 시퀀스**: 등장 순서대로의 `tier` 배열(결정적). 길이가 카운트보다 짧으면 마지막 규칙으로 보충 |

- Infinite의 랜덤 큐·기본 랙([[30-systems/launch-queue]] · [[30-systems/initial-rack]])과 달리,
  Stage는 **랙과 큐를 스테이지가 직접 지정**한다(결정적 레벨 디자인).

### 클리어
- **카운트 안에 `target` 등급 행성이 합성으로 생성되면 즉시 클리어.** (카운트가 남아 있어도 됨)
- 보상: **코인 +300**([[30-systems/meta-economy]] 지갑).
- 클리어 결과창(전환 효과) → 하단 **[다음 스테이지]**(다음 레벨로) / **[돌아가기]**(→Title)
  ([[50-art-ux/result-window]]).

### 실패
- **카운트를 모두 소진했는데 `target`을 못 만들면 실패.**
- **Fail 결과창**(전환 효과)이 뜨고, 닫으면 **게임 화면(같은 스테이지 보드)으로 복귀**한다.

### 우하단 목표 표시
- Stage 인게임 화면 **우하단**에 **목표 행성 정보**를 둔다: 행성 **이름** + **회전하는 행성
  이미지**([[50-art-ux/layout]]).

### 플레이스홀더 Stage 1
- 구조 검증용으로 `levels[0]`(Stage 1) 하나를 둔다. 실제 난이도 수치는 레벨 디자인 단계에서 채운다.

## Relates to
- [[20-core-loop/game-modes]] — Stage 모드 개요·종료 흐름
- [[30-systems/launch-count]] — 스테이지 카운트
- [[30-systems/launch-queue]] — Stage는 결정적 큐 시퀀스
- [[30-systems/initial-rack]] — Infinite 기본 랙(대비: Stage는 지정 랙)
- [[50-art-ux/result-window]] — 클리어/실패 창
- [[40-balancing/game-modes]] — 클리어 보상 300·스테이지 스키마 수치
- [[40-balancing/stage-balance]] — 밸류(`2^단계`) 기반 난이도 설계 기준(렉·큐·최대·목표 밸류, 카운트·슬랙 `N`)
