---
id: method-checklists
note_type: methodology
status: active
domain: methodology
updated: 2026-06-29
tags: [methodology, checklist, toc]
sources:
  - "raw: ai_agent_friendly_prototype_methodology.md §10,§11,§12"
---

# 권장 목차 · 최종 점검 체크리스트 · 요약

> 적용: [[../README|README]] / [[../index|MOC]] / 릴리스 전 점검. 출처: [[index|방법론 인덱스]].

## 기획문서 권장 목차 (§10)

```text
01. 게임 컨셉 및 핵심 재미 가설
02. Core Loop 정의 및 3분 플레이 흐름
03. ECS-lite 기준의 게임 오브젝트 구조
04. State Machine 및 UX 상태 전이
05. Game Loop와 시스템 실행 순서
06. Data-driven Balance Table
07. Event Catalog 및 시스템 간 통신 규칙
08. Layered Rendering 및 UI/입력 우선순위
09. Art/UX/Feedback 가이드
10. Acceptance Criteria 및 KPI 체크리스트
11. Scope Fence: 포함/제외 범위
```

> 현재 `docs/` 섹션(10-concept … 70-verification)과의 매핑 및 보강 필요 항목은
> [[index|방법론 인덱스]]의 "모듈 ↔ 적용 GDD 섹션" 표 참조. (특히 03·04·05·07은
> 30-systems 하위 페이지로, 11 Scope Fence는 별도 페이지로 분화 권장.)

## 최종 점검 체크리스트 (§11) — 릴리스 전 확인

### 구조 기준
- [ ] Core Loop가 3~5단계로 명확히 정의됨
- [ ] 주요 Entity/Component/System이 표로 정의됨
- [ ] System 실행 순서가 있음
- [ ] 게임 상태·전이가 State Machine으로 정리됨
- [ ] 각 상태의 입력/시간/UI 정책이 명확함
- [ ] 주요 수치가 Data-driven Table로 분리됨
- [ ] 이벤트 카탈로그가 있음
- [ ] 렌더 레이어 순서와 입력 우선순위가 있음

### 기획 판단 기준
- [ ] 핵심 재미 가설이 한 문장으로 정리됨
- [ ] 첫 행동/보상/성장/압박 시점이 수치로 정의됨
- [ ] 보상과 성장의 연결이 명확함
- [ ] 실패 또는 제한 요소가 정의됨
- [ ] 재시작 루프가 정의됨
- [ ] 에이전트가 임의로 추가하면 안 되는 기능이 명시됨

### 검증 기준
- [ ] 3분 세션 기준 KPI가 있음
- [ ] Core Loop 반복 횟수 기준이 있음
- [ ] 실행 가능 여부 기준이 있음
- [ ] 콘솔 에러 기준이 있음
- [ ] 결과 화면과 재시작 기준이 있음
- [ ] 디버그 패널 또는 로그 기준이 있음

## 요약 (§12)
핵심은 세부 코딩을 일일이 지시하는 게 아니라 **프로토타입의 제품적 판단을 문서에서 선점**하는
것. 권장 조합:

```text
ECS-lite + State Machine + Game Loop/Fixed Step + Data-driven Balance
+ Event-driven Systems + Layered Rendering + Acceptance-test Driven Spec
```

"무엇을 만들 것인가"보다 **"무엇을 만들면 Core Loop 검증이 완료되었다고 볼 것인가"** 를
명확히 정의한다.
