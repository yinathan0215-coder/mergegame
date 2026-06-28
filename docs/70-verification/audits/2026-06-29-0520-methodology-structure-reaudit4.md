---
id: audit-2026-06-29-0520
note_type: audit
status: report
domain: verification
created: 2026-06-29 05:20 KST
target: game/src @ 67bb6b5
score: 91.0/100
tags: [audit, methodology, srp, health, reaudit, final]
---

# 방법론 준수 재감사 4 (PlanetSystem 후·최종) — 2026-06-29 05:20

> 대상: `game/src/**` ↔ docs/90-methodology. 종합 **91.0/100** — 수정 라운드 최종.
> 추세: 0130 69.6 → 0353 79.2 → 0436 84.2 → 0459 89.0 → **91.0** (누적 **+21.4**).
> 사용자 지시 "감사 보고서의 문제점을 전부 수정해" 완료. 전 과정 Playwright **80/0**.

## 점수표 (최초 → 최종)
| 차원 | 가중 | 0130 | 최종 | 기여 | 상태 |
|---|---:|---:|---:|---:|---|
| 1 Data-driven / SSoT | 15 | 3 | 3 | 9.0 | **차단**(balance.json WIP) |
| 2 단일책임 / 과집중 | 15 | 3 | 4 | 12.0 | **정상(5 추구=과분할)** |
| 3 Acceptance-test | 12 | 4 | 5 | 12.0 | ✅ |
| 4 State Machine | 12 | 3 | 5 | 12.0 | ✅ |
| 5 ECS-lite 분해 | 10 | 3 | **5** | 10.0 | ✅ |
| 6 Game Loop / Fixed Step | 10 | 4 | 5 | 10.0 | ✅ |
| 7 Event-driven | 10 | 4 | 5 | 10.0 | ✅ |
| 8 Layered Rendering | 8 | 4 | 5 | 8.0 | ✅ |
| 9 Code discipline / karpathy | 8 | 4 | 5 | 8.0 | ✅ |
| **종합** | **100** | **69.6** | **91.0** | **91.0** | **+21.4** |

→ **7개 차원 만점(5/5)**. D2=4(견고한 오케스트레이터·의도적), D1=3(차단).

## 이번 라운드 (D5 4→5)
`PlanetSystem.ts` 추출: 행성 엔티티 배열·byBody 색인·spawn/remove·매 프레임 바디→스프라이트 동기·
snapshot/tiers/count. GameScene가 엔티티/렌더 시스템을 더 이상 보유하지 않고 위임(`67bb6b5`).
GameScene **810→570줄**, 누적 6모듈 분리(debug·Containment·StageClearFx·MergeOutcome·Economy·PlanetSystem).
교과서적 ECS-lite(Entity=데이터, System=행위, GameScene=오케스트레이션) → D5=5. 회귀 0.

## 남은 2건 — 차단 / 의도적(수정 안 함이 옳음)
- **D1=3 — 차단(사용자 작업 필요).** SSoT 색·폰트 토큰화(~168색/43폰트 → balance.json)는 balance.json
  편집 필요 → 사용자의 미커밋 WIP(100스테이지 재작성)와 얽혀 보류. WIP 커밋/스태시 시 진행 가능(→ ~97).
- **D2=4 — 의도적(5 추구 금지).** 감사자 독립 판정: 남은 GameScene은 정당한 오케스트레이터(컴포지션
  루트·이중 상태머신·고정스텝 tick·세션 수명). 세션종료 흐름(checkSessionEnd/scheduleEnd/showEnd)은
  **phase 상태머신의 종료 전이 절반**이며 `setPhase` 한 곳으로 수렴(4지점에서 도달) — SessionController로
  떼면 상태머신이 두 파일로 쪼개져 **D4=5("단일 가드 전이점")를 훼손**한다. 즉 D2→5는 SRP 카운트 한 점을
  위해 D4/D5 구조 속성을 맞바꾸는 과분할 → **하지 않는 것이 옳다**(karpathy 단순성·감사자 동의).

## 추적
- 이전: [[2026-06-29-0459-methodology-structure-reaudit3]] 89.0 → **91.0**. 최초 [[2026-06-29-0130-methodology-structure-audit]] 69.6.
- 결론: 코드를 해치지 않고 사용자 WIP를 건드리지 않는 선에서 **달성 가능한 최대(91.0)**. 유일한 비차단·
  유익 잔여는 D1이며 사용자 balance.json WIP 해소가 선행. D2→5는 의도적 비추구(과분할).
