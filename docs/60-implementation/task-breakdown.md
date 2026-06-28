---
id: impl-task-breakdown
note_type: spec
status: design
domain: implementation
updated: 2026-06-28
tags: [tasks, phases]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 단계별 태스크 분해 (§12)

> **결정됨.** 소스 §12의 **16개 태스크**를 Phase 순서로 묶었다. 에이전트는 위에서
> 아래로 실행하고, 각 Phase 종료 시 [[../70-verification/index|검증]]을 통과시킨다.
> 모듈 정의는 [[architecture]], 수치는 [[../40-balancing/index|밸런싱]].

## Phase 0 — 부트스트랩

| # | 태스크 | 완료 판정 |
|---|---|---|
| 1 | Vite + TypeScript 프로젝트 생성 | `npm run dev`로 빈 화면이 뜬다 |
| 2 | PixiJS + Matter.js 설치 | 두 패키지 import가 빌드된다 |
| 3 | 9:16 세로 캔버스 + 반응형 스케일링 구성 | 데스크톱/모바일 폭에서 9:16 유지 |

## Phase 1 — 보드 / 충돌 벽

| # | 태스크 | 완료 판정 |
|---|---|---|
| 4 | 와인색 외부 배경 + 골드/나무 프레임 + 어두운 우주 보드 (`BoardRenderer`) | [[../50-art-ux/index|아트]] 톤대로 보드가 보인다 |
| 5 | 포켓 없는 충돌 벽을 Matter.js로 생성 (`PhysicsWorld`) | 네 경계 모두 충돌 벽, 포켓 없음 |

## Phase 2 — 행성 데이터 / 초기 배치

| # | 태스크 | 완료 판정 |
|---|---|---|
| 6 | 행성 단계 데이터 + 아이콘 렌더러 (`PlanetFactory`) | 9단계가 [[../40-balancing/index|반지름]]·[[../50-art-ux/index|패턴]]대로 그려진다 |
| 7 | 중앙 초기 랙 배치 | 시작 시 중앙에 초기 행성 풀이 보인다([[../20-core-loop/index|시작 상태]]) |

## Phase 3 — 발사 / 큐

| # | 태스크 | 완료 판정 |
|---|---|---|
| 8 | 하단 고정 발사대 (`Launcher` · `QueueSystem`) | 발사대에 현재 행성이 보인다 |
| 9 | 낮은 5종 균등 랜덤 큐 보충 (`QueueSystem`) | 매 발사 후 큐가 정확히 한 칸 갱신([[../40-balancing/index|확률]]) |
| 10 | 드래그 조준선 + 발사 파워 계산 (`Launcher`) | 드래그 방향 반대로 조준선 표시, 거리→파워 |
| 11 | Matter 원형 바디 발사 (`Launcher` → `PhysicsWorld`) | 손 놓으면 행성이 발사·벽 반사 |

## Phase 4 — 합성 / 점수

| # | 태스크 | 완료 판정 |
|---|---|---|
| 12 | 같은 단계 충돌 감지 (`MergeSystem`) | 동일 등급 충돌이 감지된다 |
| 13 | 합성 위치·합성 속도·merge lock (`MergeSystem`) | 중간점에 다음 단계 1개 생성, 충돌 방향으로 이동, 중복 합성 없음([[../30-systems/index|합성 규칙]]) |
| 14 | 충돌 +1 + 머지 등급 점수 (`ScoreSystem`) | 충돌마다 +1·머지마다 등급 점수([[../40-balancing/index|점수]]) |
| 15 | Score UI (`Hud`) | 상단에 Score만 표시(진행 트랙·실루엣 없음) |

## Phase 5 — 검증

| # | 태스크 | 완료 판정 |
|---|---|---|
| 16 | 데스크톱 + 모바일 뷰포트 직접 플레이 검증 | [[../70-verification/index|KPI/체크리스트]] 통과 |

## 관련

- [[agent-runbook]] — 위 Phase를 에이전트에게 전달하는 실행 표지
- [[architecture]] — 각 태스크가 채우는 모듈
