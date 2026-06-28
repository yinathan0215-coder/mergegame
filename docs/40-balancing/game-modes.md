---
id: balancing-game-modes
note_type: section
status: design
domain: balancing
updated: 2026-06-28
tags: [balancing, game-mode, infinite, stage, count, charge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/data/balance.json"
---

# 게임 모드 수치 (카운트·충전·보너스·보상)

> 과제 요구 ④-a. [[../20-core-loop/game-modes]] · [[../30-systems/launch-count]] ·
> [[../30-systems/planet-charge]] · [[../30-systems/stage-mode]]가 참조하는 모든 구체 수치.
> **코드 SSoT = `game/src/data/balance.json`**(`modes`, `juice.result`).

## 모드 (`modes`)
| 키 | 값 | 의미 |
|---|---|---|
| `startMode` | `"Infinite"` | Title 진입 시 기본 선택 모드 |

## Infinite (`modes.infinite`)
| 키 | 값 | 의미 |
|---|---|---|
| `startCount` | **30** | 세션 시작 카운트(발사 예산) |
| `blackHoleBonusCount` | **20** | 블랙홀끼리 합성 시 추가 카운트(둘 다 소멸) |
| `unlockBonusCount` | **5** | 새 단계 해금 팝업(넵튠 6단계+)마다 추가 카운트 |
| `charge.coinPer10` | **100** | 카운트 10개당 코인 단가 |
| `charge.stepPlanets` | **10** | 충전 단위(슬라이더는 10 단위로만 선택) |
| `charge.defaultPlanets` | **10** | 충전 팝업 기본 선택값(+10) |

- **충전 슬라이더 최대치** = `floor(coins / coinPer10) × stepPlanets` (보유 코인으로 살 수 있는 최대 카운트).
  코인이 `coinPer10`(100) 미만이면 최대치 0 → 슬라이더 왼쪽 끝 고정.
- **N 카운트 구매 비용** = `(N / stepPlanets) × coinPer10`.

## Stage (`modes.stage`)
| 키 | 값 | 의미 |
|---|---|---|
| `clearReward` | **300** | 스테이지 클리어 시 코인 보상 |
| `levels` | 배열 | 스테이지 정의 목록(스키마 [[../30-systems/stage-mode]]) |

### 스테이지 항목 스키마 (`modes.stage.levels[]`)
| 필드 | 타입 | 의미 |
|---|---|---|
| `count` | int | 시작 카운트 |
| `target` | int(tier) | 목표 행성 단계(이 등급 생성 시 클리어) |
| `rack` | `{tier,x,y}[]` | 시작 랙(보드 DESIGN 좌표, [[../50-art-ux/layout]] PLAY 영역) |
| `queue` | int(tier)[] | 발사 큐 등장 시퀀스(결정적) |

> 플레이스홀더 **Stage 1**: 구조 검증용 1개. 실제 난이도(목표·랙·큐·카운트)는 레벨 디자인 단계에서 확정.

## 결과창 (`juice.result`)
| 키 | 값 | 의미 |
|---|---|---|
| `countUpMs` | **1500** | Infinite 결과창 스코어 1→최종 카운트업 지속(ms) |
| `endDelayMs` | **2000** | Stage 클리어/실패 창 등장 지연(ms); Infinite 결과는 정지 후 즉시 |

## Relates to
- [[../20-core-loop/game-modes]] · [[../30-systems/launch-count]] · [[../30-systems/planet-charge]] · [[../30-systems/stage-mode]] — 규칙
- [[meta-economy]] — 코인 지갑(충전 차감·클리어 보상)
- [[index]] — 밸런싱 카탈로그
