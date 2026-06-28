---
id: method-ecs-lite
note_type: methodology
status: active
domain: methodology
updated: 2026-06-28
tags: [methodology, ecs, architecture]
sources:
  - "raw: ai_agent_friendly_prototype_methodology.md §2"
---

# ECS-lite: 프로토타입용 Entity-Component-System

> 적용: [[../30-systems/index|30-systems]], [[../60-implementation/architecture|60-impl/architecture]]. 출처: [[index|방법론 인덱스]].

## 목적
게임 오브젝트를 **데이터(Component)** 와 **처리(System)** 로 분리하는 최소 구조. 정식 ECS
프레임워크 강제가 아니라, 프로토타입에서 다음을 만족하는 것이 목표:
- Core Loop 오브젝트를 빠르게 추가/삭제할 수 있다
- 플레이어·아이템·적·보상·이펙트 상태가 명확히 분리된다
- 렌더 로직과 게임 규칙 로직이 섞이지 않는다
- 에이전트가 대형 클래스 하나에 모든 기능을 몰아넣지 않는다

## 기본 정의
| 구분 | 정의 | 예시 |
|---|---|---|
| Entity | 개체 식별 ID 또는 얇은 객체 | `player_001`, `enemy_012`, `merge_item_003` |
| Component | Entity가 가진 순수 데이터 | `Position`, `Velocity`, `Health`, `Income`, `Mergeable`, `Renderable` |
| System | 특정 Component 조합을 처리하는 규칙 | `MovementSystem`, `MergeSystem`, `EconomySystem`, `RenderSystem` |

## 적용 기준 (문서에 명시)
1. Core Loop에 직접 관여하는 모든 대상은 Entity로 정의
2. Entity 상태값은 Component에 저장
3. Component는 가능한 한 데이터만
4. 게임 규칙은 System에서 처리
5. **System 실행 순서는 문서에서 고정** (→ [[game-loop]])
6. UI 표시는 게임 상태를 참조하되 핵심 규칙을 직접 변경하지 않음
7. 렌더 대상은 `Renderable` 등 표시 Component로 식별

## 문서에 포함할 Entity 기준
| Entity | 설명 | 필수 Component 예시 |
|---|---|---|
| Player | 입력·성장의 중심 | `Position`, `InputControlled`, `Stats`, `Wallet`, `Renderable` |
| Resource | 획득/생산 대상 | `Position`, `Value`, `Collectible`, `Renderable` |
| MergeItem | 병합/업그레이드 대상 | `Position`, `Level`, `Mergeable`, `Income`, `Renderable` |
| Enemy / Threat | 생존·압박·실패 조건 | `Position`, `Health`, `Damage`, `Targeting`, `Renderable` |
| Projectile / ActionEffect | 일시적 효과 | `Position`, `Velocity`, `Lifetime`, `Collision`, `Renderable` |
| UIEntity | 버튼·게이지·재화 표시 | `Anchor`, `Text`, `Clickable`, `Renderable` |
| Effect | 코인 팝업·합성 이펙트·데미지 숫자 | `Position`, `Lifetime`, `Animation`, `Renderable` |

장르상 불필요한 Entity는 제거 가능하지만, Core Loop에 영향을 주는 대상은 반드시 Entity 또는
명확한 데이터 구조로 표현한다.

## 문서에 포함할 Component 기준
| Component | 역할 | 주요 필드 |
|---|---|---|
| `Position` | 월드/UI 좌표 | `x`, `y` |
| `Velocity` | 이동 방향·속도 | `vx`, `vy`, `speed` |
| `Renderable` | 표시 정보 | `shape`, `color`, `size`, `label`, `layer` |
| `Clickable` | 클릭/탭 가능 | `hitArea`, `enabled`, `onClickEvent` |
| `Health` | 생명력/파괴 | `current`, `max` |
| `Wallet` | 보유 재화 | `coins`, `gems`, `energy` |
| `Income` | 시간당 생산량 | `amountPerSecond`, `resourceType` |
| `Mergeable` | 병합 조건 | `level`, `mergeGroup`, `nextLevelId` |
| `Cooldown` | 재사용 대기 | `duration`, `remaining` |
| `Lifetime` | 일시 오브젝트 제거 | `remainingSeconds` |
| `Progression` | 레벨/경험치/단계 | `level`, `xp`, `nextXp` |

## 문서에 포함할 System 기준
| System | 책임 | 실행 조건 |
|---|---|---|
| `InputSystem` | 입력을 게임 이벤트로 변환 | 입력 허용 상태 |
| `TimerSystem` | 쿨다운·지속시간·세션 타이머 | `Playing` |
| `EconomySystem` | 수익·비용·보상·재화 변경 | `Playing` |
| `MergeSystem` | 동일 레벨/타입 병합 판정·결과 | 병합 입력 시 |
| `MovementSystem` | 위치 갱신 | `Playing` |
| `CollisionSystem` | 충돌·수집·피격 판정 | `Playing` |
| `CombatSystem` | 공격·피해·처치 | 전투 요소 존재 시 |
| `ProgressionSystem` | 레벨업·해금·단계 전환 | 진행도 변경 시 |
| `SpawnSystem` | 적·자원·아이템 생성 | 스폰 조건 충족 시 |
| `EffectSystem` | 팝업·파티클·일시 애니메이션 | 항상 또는 `Playing` |
| `UISystem` | 재화·버튼·게이지 표시 | 항상 |
| `RenderSystem` | 레이어 순서대로 출력 | 항상 |

## 금지 안티패턴
- `GameManager` 하나가 입력·밸런스·렌더·UI·전투·저장을 모두 처리
- `Player` 클래스가 UI 텍스트·사운드·스폰·보상 지급까지 직접 처리
- 렌더 함수 내부에서 재화를 변경
- 클릭 이벤트가 여러 시스템 내부 상태를 직접 수정
- 밸런스 숫자가 여러 파일에 하드코딩

## 완료 기준
- 주요 대상이 Entity/Component/System 관점으로 분리됨
- 각 System 책임이 한 문장으로 설명 가능
- System 실행 순서가 문서에 정의됨
- Component=상태 데이터, System=규칙으로 위치함
- 새 아이템·적·보상·효과 추가 시 기존 대형 클래스를 수정하지 않아도 되는 구조
- **검증(enforcement):** 위 기준은 선언으로 끝내지 않고 *검사*한다 — 한 모듈이 단일 책임을 넘기면
  (대형 오케스트레이터·한 파일 ≥3 책임) 감사에서 드러나야 한다. 프로젝트 적용: `methodology-audit`
  스킬이 `game/src`를 이 기준으로 점수화하고 `docs/70-verification/audits/`에 보고서를 남긴다.
