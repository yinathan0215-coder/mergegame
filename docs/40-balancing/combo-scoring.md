---
id: balancing-combo-scoring
note_type: section
status: design
domain: balancing
updated: 2026-06-28
tags: [balancing, planet-pool-merge, scoring]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 점수 수치 (Scoring)

> 점수는 두 갈래: **행성–행성 충돌마다 +1** + **머지 시 생성 등급의 기본 점수**(등급↑ = 점수↑).
> 코드 SSoT: `game/src/data/balance.json`(`scoring`, `planets[].score`). 결정 근거 ADR
> [[decisions/2026-06-28-remove-combo]].

## 1. 충돌 점수

| 항목 | 값 | 적용 |
|---|---|---|
| 행성–행성 충돌 | **+1** (`scoring.collisionPoint`) | 두 ball이 부딪힐 때마다(머지 여부 무관) 1점 가산. **벽·일방향 선 충돌은 제외**(무한 farming 방지) |

## 2. 머지 점수 (등급 차등)

머지로 **생성된 행성 등급의 기본 점수**를 그대로 가산한다. 점수 표 SSoT는 [[planet-stats]]:

```
충돌마다:  totalScore += 1
머지마다:  totalScore += baseScore(생성_행성_등급)
           // 화성10·금성30·지구70·해왕성150·천왕성320·토성700·목성1500·태양3200
```

- `baseScore`는 [[planet-stats]] 표(수성은 머지 결과가 아니라 점수 없음).
- **등급이 높을수록 큰 점수** — 머지 단계에 따른 차별화.

## 관련

- [[planet-stats]] — 등급별 기본 점수(= 머지 점수)
- [[../30-systems/scoring-combo]] — 점수 규칙(시스템 측)
- [[../50-art-ux/feedback-effects]] — 점수 연출(1단위 오도미터·머지 +N 플로팅)
- [[decisions/2026-06-28-remove-combo]] — 콤보 제거 ADR
