---
id: method-event-driven
note_type: methodology
status: active
domain: methodology
updated: 2026-06-27
tags: [methodology, event-driven, observer]
sources:
  - "raw: ai_agent_friendly_prototype_methodology.md §6"
---

# Event-driven / Observer: 시스템 간 결합 줄이기

> 적용: [[../30-systems/index|30-systems]] (시스템 통신). 출처: [[index|방법론 인덱스]].

## 목적
시스템 간 직접 의존성을 줄인다. 한 시스템이 다른 시스템의 내부 함수를 직접 호출하면 커질수록
수정이 어렵다. 의미 있는 변화는 **이벤트로 발행**, 필요한 시스템이 **구독**해 처리.

## 기본 원칙
- System은 다른 System의 내부 상태를 직접 수정하지 않음
- 의미 있는 변화는 이벤트로 발행
- 이벤트 이름·발생 조건·payload를 문서에 명시
- 이벤트는 디버그 로그/Debug Panel에서 확인 가능
- 매 프레임 위치 변화처럼 너무 빈번한 데이터는 이벤트로 만들지 않음

## 이벤트 카탈로그 기준 (최소 이 형식 포함)
| Event | 발생 조건 | Payload | 구독 시스템 | 결과 |
|---|---|---|---|---|
| `SESSION_STARTED` | 새 세션 시작 | `sessionId`, `startTime` | `UISystem`, `AnalyticsSystem` | UI 초기화, KPI 기록 시작 |
| `COIN_EARNED` | 코인 획득 | `amount`, `source`, `position` | `EconomySystem`, `EffectSystem`, `UISystem` | 재화 증가, 팝업 |
| `ITEM_MERGED` | 동일 레벨 병합 | `fromIds`, `newItemId`, `newLevel` | `MergeSystem`, `EffectSystem`, `ProgressionSystem` | 새 아이템·이펙트 |
| `UPGRADE_PURCHASED` | 업그레이드 구매 | `upgradeId`, `cost`, `newLevel` | `EconomySystem`, `UISystem` | 비용 차감·수치 갱신 |
| `ENEMY_DEFEATED` | 적 처치 | `enemyId`, `reward` | `EconomySystem`, `SpawnSystem`, `EffectSystem` | 보상·다음 스폰 조건 |
| `PLAYER_DAMAGED` | 플레이어 피해 | `amount`, `sourceId` | `HealthSystem`, `UISystem`, `EffectSystem` | 체력 감소·피격 피드백 |
| `LEVEL_UP` | 경험치/목표 달성 | `level`, `choices` | `StateSystem`, `UISystem` | 보상 선택 팝업 |
| `FAIL_CONDITION_MET` | 실패 충족 | `reason`, `elapsedTime` | `StateSystem`, `UISystem` | 결과 화면 |
| `RESTART_REQUESTED` | 재시작 클릭 | 없음/`reason` | `StateSystem` | 세션 초기화 |

## 이벤트 처리 기준
| 항목 | 기준 |
|---|---|
| 이름 | 대문자 SNAKE_CASE |
| Payload | 필요한 값만, 암묵 참조 최소화 |
| 처리 순서 | 같은 프레임 내 처리 순서를 문서에서 정의 |
| 중복 방지 | 같은 조건 반복 발생하지 않도록 조건 명시 |
| 디버그 | 최근 이벤트 로그 확인 가능 |

## 안티패턴
- `CombatSystem`이 `UISystem.updateHpBar()`를 직접 호출
- `MergeSystem`이 `EconomySystem` 재화 값을 직접 변경
- payload에 값이 없어 구독 시스템이 여러 시스템을 재조회
- 매 프레임 `POSITION_CHANGED`를 모든 Entity에 발행
- 동일 이벤트가 한 액션에서 여러 번 발생해 보상 중복 지급

## 완료 기준
- 주요 변화가 이벤트 카탈로그로 정의됨
- 직접 호출보다 발행/구독이 우선됨
- payload가 문서화됨
- 최근 이벤트 흐름을 디버그로 확인 가능
- 보상·성장·실패·재시작이 중복 처리되지 않음
