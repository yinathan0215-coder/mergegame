# mergegame — 기획문서 (GDD + 에이전트 빌드 스펙)

글로벌 캐주얼 **Merge** 게임의 HTML5 플레이 가능 프로토타입을 위한 기획문서.
이 문서는 **AI 코딩 에이전트(Claude Code 등)에게 그대로 전달**되어 Core Loop를 플레이할 수
있는 프로토타입을 만들어내는 것을 목표로 한다. (베이글코드 신작팀 게임 기획 PD 과제용.)

> 현재 상태: **폴더 구조 + 작업 파이프라인만** 구축됨. 각 섹션은 `draft` 골격이며 장르
> 세부 메카닉과 기술 스택은 미정.

## 과제 요구사항 → 문서 매핑

| 과제 요구 항목 | 위치 |
|---|---|
| ① 게임 컨셉 & 핵심 재미 가설 | [10-concept/](10-concept/index.md) |
| ② Core Loop 정의 & 플레이 흐름 | [20-core-loop/](20-core-loop/index.md) |
| ③ 구현 지시 (스택·구조·태스크 분해) | [60-implementation/](60-implementation/index.md) |
| ④ 명시적 가이드 — 밸런싱 수치 | [40-balancing/](40-balancing/index.md) |
| ④ 명시적 가이드 — 아트·UX | [50-art-ux/](50-art-ux/index.md) |
| ⑤ 검증 기준 (KPI / 체크리스트) | [70-verification/](70-verification/index.md) |
| (③의 입력) 상세 시스템 | [30-systems/](30-systems/index.md) |
| (근거) 레퍼런스·시장 | [80-research/](80-research/index.md) |
| 부록 A · 구조/방법론 기준 | [90-methodology/](90-methodology/index.md) |

## 읽는 순서

1. [10-concept](10-concept/index.md) → 2. [20-core-loop](20-core-loop/index.md) →
3. [30-systems](30-systems/index.md) → 4. [40-balancing](40-balancing/index.md) →
5. [50-art-ux](50-art-ux/index.md) → 6. [60-implementation](60-implementation/index.md) →
7. [70-verification](70-verification/index.md).

전체 목차: [index.md](index.md).

각 섹션은 **부록 A([90-methodology/](90-methodology/index.md))** 의 구조 표준
(ECS-lite·State Machine·Game Loop·Data-driven·Event-driven·Layered Rendering·Acceptance-test)을
따른다. 방법론은 표준(제네릭), 섹션은 merge 게임 전용 인스턴스 — 단일 출처 유지.

## 에이전트에게 전달하는 법

`60-implementation/agent-runbook.md` 가 표지면이다. 에이전트는 거기서 시작해 설계
섹션을 읽고 `game/` 에 Phase 순서대로 구현한 뒤 `70-verification` 체크리스트로 검증한다.

## 살아있는 정본 (hook 파이프라인)

이 문서는 정적인 제출물이 아니라, 게임을 만드는 동안 **훅으로 갱신되는 정본**이다.
모든 지시는 `00-meta/input-log/` 에 그대로 기록되고, 기존 문서와 다르면 문서가 먼저
수정된 뒤 작업이 진행된다. 규칙: `.claude/rules/docs-pipeline.md`,
설계: [00-meta/knowledge-system-blueprint.md](00-meta/knowledge-system-blueprint.md).
