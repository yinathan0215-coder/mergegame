---
id: methodology-index
note_type: methodology
status: active
domain: methodology
updated: 2026-06-29
tags: [methodology, appendix]
sources:
  - "raw: (imported) ai_agent_friendly_prototype_methodology.md"
---

# 부록 A · 구조/방법론 기준 (AI-Agent Friendly Prototype)

이 부록은 특정 게임 기획이 아니라, **GDD 작성·구현에 적용하는 구조적 표준**이다. 핵심은
세부 코딩을 일일이 지시하는 것이 아니라, **AI 에이전트가 임의로 결정하면 안 되는
제품/기획/UX 판단을 문서에서 선점**하는 것. 각 모듈이 단일 출처이며, GDD 섹션(10–70)은
이 모듈들을 참조해 merge 게임 전용으로 인스턴스화한다.

## 권장 조합 (스택)

```text
ECS-lite + State Machine + Game Loop/Fixed Step + Data-driven Balance
+ Event-driven Systems + Layered Rendering + Acceptance-test Driven Spec
```
빠른 구현과 명확한 검증을 동시에 노린다. 문서에서 "무엇을 만들 것인가"보다
"무엇을 만들면 **Core Loop 검증이 완료**되었다고 볼 것인가"를 정의하는 것이 목표.

## 6대 핵심 원칙 (요약 — 전체는 [[00-core-principles]])

1. 결정은 문서가 한다 (에이전트의 임의 기획 판단 차단)
2. 움직이는 값은 데이터로 고정한다 (밸런스 = 단일 테이블)
3. 흐름은 상태로 고정한다 (boolean 플래그 조합 금지 → State Machine)
4. 시스템 간 직접 결합을 줄인다 (Event-driven)
5. 렌더링과 시뮬레이션을 분리한다
6. 완료 기준은 실행 가능한 체크리스트로 쓴다

## 모듈 ↔ 적용 GDD 섹션

| 모듈 | 무엇을 고정하나 | 적용 섹션 |
|---|---|---|
| [[00-core-principles]] | 전체를 관통하는 6대 원칙 | 전 섹션 |
| [[ecs-lite]] | 게임 오브젝트 분해(Entity/Component/System) | [[../30-systems/index\|30-systems]], [[../60-implementation/architecture\|60-impl]] |
| [[state-machine]] | 게임 흐름·UX·입력/시간 정책 | [[../20-core-loop/index\|20-core-loop]], 30-systems |
| [[game-loop]] | 업데이트 순서·시간 기준(Fixed Step) | 30-systems, [[../60-implementation/index\|60-impl]] |
| [[data-driven]] | 밸런스 수치·공식의 단일 출처 | [[../40-balancing/index\|40-balancing]] |
| [[event-driven]] | 시스템 간 통신(이벤트 카탈로그) | 30-systems |
| [[layered-rendering]] | 화면 레이어·입력 우선순위 | [[../50-art-ux/index\|50-art-ux]] |
| [[acceptance-test]] | 완료 기준·KPI·검증 시나리오 | [[../70-verification/index\|70-verification]] |
| [[agent-friendly-spec]] | 스펙 작성 원칙(모호성 제거·Scope Fence·Must/Should/May) | 전 섹션 |
| [[checklists]] | 권장 목차 + 최종 점검 체크리스트 | [[../README\|README]], 릴리스 전 점검 |

## 적용 방식

- **상시(작음):** `CLAUDE.md` 가 이 인덱스만 링크 → 스택·원칙·매핑을 항상 인지.
- **필요시(상세):** 해당 섹션을 작업할 때 위 표의 모듈을 로드해 그 기준을 따른다.
- **단일 출처(§9.6):** 내용은 이 모듈들에만. GDD 섹션은 값을 *인스턴스화*하고 모듈을 *링크*한다.
- **판단 우선순위(§9.7):** Core Loop 플레이 가능성 > 입력·피드백 명확성 > 밸런스 검증성
  > 상태/재시작 안정성 > 코드 단순성 > 시각 완성도 > 부가 연출.

> 출처: `ai_agent_friendly_prototype_methodology.md` (사용자 제공 기본 원칙)를 모듈로 분해.
