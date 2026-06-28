---
id: core-loop-play-flow
note_type: section
status: design
domain: core-loop
updated: 2026-06-28
tags: [core-loop, play-flow, onboarding]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 플레이 흐름

## 시작 상태 — 초기 랙

첫 플레이부터 충돌과 합성이 일어나야 하므로 **빈 보드로 시작하지 않는다.** 보드 중앙(약간
위쪽)에 포켓볼 랙처럼 초기 행성 풀을 벌집/삼각 배치한다. 기본 초기 배치는 **낮은 4종(수성·
화성·금성·지구)** 으로만 구성하고 **해왕성 이상은 시작 배치에 넣지 않는다**. 행성별 개수와
배치 좌표·간격·밀도 규칙의 정본은 [[../30-systems/initial-rack]](배치 규칙)과
[[../40-balancing/index]](초기 랙 수치)에 둔다. **Stage 모드는 이 기본 랙 대신 스테이지가
지정한 랙을 쓴다**([[../30-systems/stage-mode]]).

## 한 세션

부팅 → 초기 랙이 깔린 보드 표시 → 8단계 루프 반복. 별도 온보딩 화면 없이, 첫 발사가 곧
학습이다(버튼 없이도 발사 방법이 직관적이어야 함 — UX는 [[../50-art-ux/index]]). **세션 종료
조건은 게임 모드가 정한다**([[game-modes]]) — Infinite는 카운트 소진 후 모든 행성 정지,
Stage는 목표 달성(클리어)/카운트 소진(실패).

## 관련
- [[index]] — 섹션 카탈로그
- [[core-loop]] — 이 흐름이 반복하는 8단계 코어 루프
- [[../30-systems/launcher]] · [[../30-systems/launch-queue]] · [[../30-systems/merge-rules]] · [[../30-systems/initial-rack]] — 루프를 구성하는 시스템 상세
- [[../50-art-ux/index]] — 온보딩/입력 직관성 UX
