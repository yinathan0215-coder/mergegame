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

> 점수는 세 갈래: **충돌**(벽 +1 · 행성–행성 +3) + **머지 시 생성 등급의 기본 점수**(등급↑ = 점수↑)
> + **콤보 마일스톤 보너스**(연속 머지 5단위마다 `콤보값 × bonusPer`). 코드 SSoT:
> `game/src/data/balance.json`(`scoring`, `planets[].score`, `juice.combo`).

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

- `baseScore`는 [[planet-stats]] 표(소행성은 머지 결과가 아니라 점수 없음).
- 수성10·화성30·금성70·지구150·해왕성320·천왕성700·토성1500·목성3200·태양7000·블랙홀15000.
- **등급이 높을수록 큰 점수** — 머지 단계에 따른 차별화.

## 3. 콤보 보너스 점수

연속 머지 체인(콤보, [[../50-art-ux/feedback-effects]] §8)이 **`juice.combo.step`의 배수**에 도달할
때마다 **정액 보너스 = `콤보값 × juice.combo.bonusPer`**를 가산한다. 배율이 아니라 마일스톤마다의
결정적 가산이다.

| 값 | SSoT 키 | 기본값 | 의도 |
|---|---|---|---|
| 마일스톤 간격 | `juice.combo.step` | **5** | 5·10·15…콤보에서 보너스 발화 |
| 보너스 계수 | `juice.combo.bonusPer` | **400** | 보너스 = 콤보값 × 400 (예: 5콤보 → 2000, 10콤보 → 4000) |
| 유지 창 | `juice.combo.holdMs` | **5000** ms | 이 시간 안 다음 머지가 없으면 체인 종료(콤보 0) |
| 페이드 시작 | `juice.combo.fadeStartMs` | **3000** ms | "Combo/N" 표시가 이 시점부터 holdMs까지 페이드 아웃 |

- **콤보는 어렵게 쌓이므로 보너스는 크게** 잡는다(태양·블랙홀 머지 점수와 동급의 한 방).
- 보너스 획득 시 **화면 중앙에 큰 `+N` 플로팅**(`juice.combo.bonus*`)으로 강조 →
  [[../50-art-ux/feedback-effects]] §8.

```
충돌마다:        totalScore += (벽 ? 1 : 3)          // impact ≥ minImpact일 때만
머지마다:        totalScore += baseScore(생성_행성_등급)
콤보 step배수마다: totalScore += 콤보값 × bonusPer       // 5·10·15…
```

## 관련

- [[planet-stats]] — 등급별 기본 점수(= 머지 점수)
- [[../30-systems/scoring-combo]] — 점수 규칙(시스템 측)
- [[../50-art-ux/feedback-effects]] — 점수·콤보 연출(1단위 오도미터·머지 +N·콤보 +N 플로팅)
