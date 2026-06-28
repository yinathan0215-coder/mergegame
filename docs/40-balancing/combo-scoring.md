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

**최소 충돌 힘 기준:** 충돌 점수는 충돌의 **법선 방향 접근 속도(impact)가 `scoring.minImpact`
이상**일 때만 준다 — 각도 있게 튕기는 충돌만 점수가 되고, 벽을 따라 약하게 구르거나 맞닿아 있는
저강도 접촉은 점수가 없다.

| 충돌 종류 | 값 | 적용 |
|---|---|---|
| 벽 충돌 | **+1** (`scoring.wallPoint`) | impact ≥ `minImpact`인 벽(inner line · 발사대 원) 충돌마다 1점 |
| 행성–행성 충돌 | **+3** (`scoring.ballPoint`) | impact ≥ `minImpact`인 행성 충돌마다 3점(머지 여부 무관) |
| 최소 충돌 힘 | `scoring.minImpact` = **3.5** px/step | 이 미만 접촉은 점수 없음(굴러다님 방지). 튜닝값 |

> 점수에 충족한 충돌은 충돌 위치에 **히트 이펙트**를 낸다 → [[../50-art-ux/feedback-effects]].
> 머지 자체는 impact와 무관하게 동급 접촉 시 발생한다.

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
