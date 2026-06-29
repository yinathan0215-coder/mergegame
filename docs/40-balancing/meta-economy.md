---
id: balancing-meta-economy
note_type: section
status: design
domain: balancing
updated: 2026-06-29
tags: [balancing, meta, economy, coin, mission, attendance, wheel]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/data/balance.json"
---

# 메타 경제 수치 (코인·미션·출석·돌림판)

> 문서 범위 ④. [[../30-systems/meta-economy]] · [[../30-systems/daily-missions]] ·
> [[../30-systems/attendance]] · [[../30-systems/lucky-wheel]]가 참조하는 모든 구체 수치.
> **코드 SSoT = `game/src/data/balance.json`** (`economy`/`dailyMissions`/`attendance`/`wheel`/`juice.popup`).

## 코인 지갑 (`economy`)
| 키 | 값 | 의미 |
|---|---|---|
| `startCoins` | 0 | 신규 시작 잔액 |

## 일일 미션 (`dailyMissions`)
- `perMission` = **50** — 미션 1개 달성 시 자동 지급 코인.
- `milestones` = 누적 달성 개수별 보너스: `{ "2": 50, "5": 100, "8": 200 }` (받기 버튼).
- 미션 정의 `list`(순서 = 표시 순서):

| # | id | type | target | 비고 |
|---|---|---|---|---|
| 1 | combo5 | comboPeak | 5 | 콤보 피크 |
| 2 | combo15 | comboPeak | 15 | |
| 3 | combo30 | comboPeak | 30 | |
| 4 | merge100 | mergeCount | 100 | 머지 누적 |
| 5 | merge200 | mergeCount | 200 | |
| 6 | merge300 | mergeCount | 300 | |
| 7 | sun | sunCount | 1 | 태양(tier 10) 생성 |
| 8 | ad | dummy | 3 | **달성 불가 더미**(진행 고정 0/3) |

- 달성가능 7개 → 행 보상 350 + 마일스톤 2·5 = 150. **8단계(200)는 더미로 도달 불가**.
- 리셋: KST 자정([[../30-systems/meta-economy]]).

## 출석 (`attendance`)
- `rewards`(1~7일차) = **[100, 150, 200, 250, 300, 350, 400]** (= 50 + 50×일차).
- 주기 7일, 7일차 후 1일차 순환. 하루 1회 청구(KST 일자).

## 행운의 돌림판 (`wheel`)
| 키 | 값 | 의미 |
|---|---|---|
| `segments` | [10, 25, 50, 75, 100, 120, 150, 250] | 8칸 보상 코인(균등 확률) |
| `cost` | 100 | 1회 회전 비용 |
| `coinsPerPourSprite` | 5 | 보상 적립 시 쏟아지는 코인 스프라이트 1개당 결과 코인(스프라이트 수 = 결과÷5) |
| `decelMs` | 3000 | 정지 후 결과까지 감속 시간 |
| `spinSpeed` | 0.02 | 등속 회전 각속도(rad/ms) |

## 팝업 전환 (`juice.popup`)
| 키 | 값 | 의미 |
|---|---|---|
| `enterMs` | 220 | 진입 전환 지속(머지 해금 모달과 동일) |
| `dimAlpha` | 0.72 | 딤 최종 불투명도 |
| `startScale` | 0.85 | 콘텐츠 진입 시작 스케일(→1.0) |

## Relates to
- [[../30-systems/meta-economy]] · [[../30-systems/daily-missions]] · [[../30-systems/attendance]] · [[../30-systems/lucky-wheel]] — 규칙
- [[index]] — 밸런싱 카탈로그
