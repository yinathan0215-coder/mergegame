---
id: art-ux-feedback-effects
note_type: section
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, ux, juice, feedback, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 피드백 연출 (Juice)

> 머지·점수의 **체감 피드백**을 못 박는다(에이전트가 임의로 결정하면 안 되는 연출). 타이밍/크기
> 수치 SSoT는 `game/src/data/balance.json`(`juice`). 렌더 전용 — 시뮬레이션을 되먹이지 않는다
> ([[../90-methodology/layered-rendering]]). 추가 레이어: `effectLayer`(행성 위, 조준선 아래) +
> 점수 연출은 `uiLayer`(HUD).

## 1. 머지 스케일 팝 (생성 연출)
머지로 새 행성이 생성될 때, 스프라이트가 **작게 시작 → 크게 부풀었다 → 원래 크기로** 정착하는
튀어오르는 팝. (`juice.mergePop`)

| 파라미터 | 값 | 의미 |
|---|---|---|
| `ms` | 260 | 팝 지속 |
| `startScale` | 0.35 | 시작 크기 |
| `peakScale` | 1.18 | 최대(오버슈트) 크기 |

- 곡선: 0~40% 구간 `startScale→peakScale`, 40~100% 구간 `peakScale→1.0`.
- **머지 결과 행성에만** 적용(발사·초기 랙 행성은 팝 없음).

## 2. 머지 발산 버스트 (강조 이펙트)
머지 위치에서 **반투명 원이 바깥으로 발산하며 페이드아웃**하는 링. (`juice.burst`)

| 파라미터 | 값 | 의미 |
|---|---|---|
| `ms` | 380 | 버스트 지속 |
| `scale` | 2.6 | 최종 반지름 = 결과 행성 r × 2.6 |
| `alpha` | 0.5 | 시작 불투명도(→0으로 페이드) |

- 색은 **생성된 행성의 메인 색**을 사용. 선 두께는 진행에 따라 가늘어진다.

## 3. 점수 오도미터 (1단위 스크롤)
Score 숫자는 목표값으로 **즉시 점프하지 않고 정수 단위로 빠르게 스크롤하며 상승**한다.
(`juice.scoreRoll`)

| 파라미터 | 값 | 의미 |
|---|---|---|
| `lerp` | 0.18 | 매 프레임 `shown += max(1, ceil(diff×lerp))` — 큰 차는 빠르게, 작은 차는 1씩 |

- 항상 정수로 증가, 목표 초과 없이 수렴. 최고점수(👑)는 목표값 기준 즉시 갱신.

## 4. 머지 +N 플로팅 점수
머지 시 획득 점수가 **`+N`** 텍스트로 Score 주변 **랜덤 좌표**에 떴다가 위로 떠오르며 천천히
사라진다. (`juice.scorePopup`)

| 파라미터 | 값 | 의미 |
|---|---|---|
| `ms` | 950 | 표시 시간(페이드까지) |
| `rise` | 46 | 떠오르는 높이(px) |
| `spreadX` / `spreadY` | 70 / 28 | Score 중심 기준 랜덤 오프셋 범위(±px) |
| `color` | `#ffe28a` | 텍스트 색 |
| `fontSize` | 22 | 텍스트 크기 |

- 충돌 +1은 플로팅을 만들지 않는다(오도미터로만 반영) — 머지만 강조.

## 관련
- [[../30-systems/scoring-combo]] · [[../40-balancing/combo-scoring]] — 점수 규칙/수치
- [[../30-systems/merge-rules]] — 머지 트리거(이 연출의 발생점)
- [[index]] · [[../90-methodology/layered-rendering]] — 레이어·sim/render 분리
