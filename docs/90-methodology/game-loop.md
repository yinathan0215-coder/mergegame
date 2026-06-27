---
id: method-game-loop
note_type: methodology
status: active
domain: methodology
updated: 2026-06-27
tags: [methodology, game-loop, fixed-step]
sources:
  - "raw: ai_agent_friendly_prototype_methodology.md §4"
---

# Game Loop / Fixed Step 사고방식

> 적용: [[../30-systems/index|30-systems]], [[../60-implementation/index|60-impl]]. 출처: [[index|방법론 인덱스]].

## 목적
시간 기반 시뮬레이션을 안정적으로. 브라우저 프레임 속도·탭 전환·기기 성능에 따라 프레임 간격이
달라지므로, **게임 수치가 프레임 수에 종속되지 않게** 작성한다.

## 기본 원칙
- 렌더는 브라우저 프레임에 맞춰 수행
- 게임 상태 변화는 `deltaTime` 또는 고정 시간 단위 기준으로 계산
- 수익·쿨다운·스폰·이동·지속시간은 **프레임 수가 아니라 시간 기준**
- 지나치게 큰 `deltaTime`은 상한 제한
- 팝업·결과·일시정지에서 어떤 시스템이 멈추는지 명시

## 권장 업데이트 순서 (매 프레임/틱, 문서에서 고정)
| 순서 | System | 목적 |
|---:|---|---|
| 1 | `InputSystem` | 입력 → 이벤트 |
| 2 | `StateSystem` | 현재 상태·전이 처리 |
| 3 | `TimerSystem` | 타이머·쿨다운·지속시간 |
| 4 | `EconomySystem` | 수익·비용·보상 |
| 5 | `SpawnSystem` | 자원·적·아이템 생성 |
| 6 | `MovementSystem` | 이동·위치 갱신 |
| 7 | `CollisionSystem` | 충돌·수집·상호작용 |
| 8 | `Combat / MergeSystem` | 장르별 핵심 규칙 |
| 9 | `ProgressionSystem` | 레벨업·목표·해금 |
| 10 | `EffectSystem` | 팝업·숫자·애니메이션 |
| 11 | `UISystem` | UI 텍스트·버튼 상태 |
| 12 | `RenderSystem` | 레이어 순서대로 출력 |

장르에 따라 일부 System은 제거 가능하나 **실행 순서는 반드시 문서에서 정의**.

## Fixed Step 적용 기준
다음 요소가 있으면 Fixed Step(또는 준하는 사고방식)을 적용: 충돌 판정 중요 / 적 이동·투사체·
추적 존재 / 스폰 타이밍이 압박감에 직접 영향 / 생산·보상이 시간에 민감.

| 항목 | 기준 |
|---|---|
| 시뮬레이션 기준 시간 | 1/60초 또는 1/30초 |
| 렌더링 | 매 브라우저 프레임 |
| 최대 deltaTime | 탭 전환 후 폭주 방지 상한 |
| catch-up 제한 | 한 프레임 과도 반복 금지 |
| 시간 기반 계산 | 이동·수익·쿨다운·스폰 모두 초 단위 |

## 시간 정책 예시
| 상태 | Gameplay | UI | Render | Timer |
|---|---|---|---|---|
| `Title` | 정지 | 활성 | 활성 | 정지 |
| `Tutorial` | 제한 활성 | 활성 | 활성 | 문서 기준 |
| `Playing` | 활성 | 활성 | 활성 | 진행 |
| `RewardPopup` | 정지 | 활성 | 활성 | 정지 |
| `Paused` | 정지 | 활성 | 활성 | 정지 |
| `Result` | 정지 | 활성 | 활성 | 정지 |

## 완료 기준
- 수익·스폰·이동·쿨다운이 프레임 수가 아닌 시간 기준
- System 실행 순서 고정
- 팝업·일시정지에서 멈추는 시간이 명확
- 30fps/60fps에서 핵심 루프 결과가 크게 다르지 않음
- 탭 전환 복귀 시 폭주하지 않음
