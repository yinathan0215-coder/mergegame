---
id: core-loop-index
note_type: section
status: draft
domain: core-loop
updated: 2026-06-27
tags: [core-loop]
sources: []
---

# 20 · Core Loop & 플레이 흐름

> 과제 요구 ② — *Core Loop 정의 및 플레이 흐름*. 프로토타입이 **플레이 가능**해야 하는
> 최소 단위가 여기서 정의된다.
>
> **준수 기준(방법론):** [[../90-methodology/state-machine]] (흐름·UX·입력/시간) · [[../90-methodology/acceptance-test]] (Core Loop 검증 시나리오).

## 작성할 내용 (draft skeleton)

### Core Loop 정의
_TBD — 한 사이클을 단계로. 예: 입력 → 머지 → 보상/생성 → 진행 → 다시 입력._
- 루프 다이어그램(텍스트/머메이드)
- 각 단계의 입력·출력·플레이어 의사결정

### 세션 플레이 흐름
_TBD — 최초 실행부터 한 세션 종료까지._
- 부팅 → 온보딩(첫 머지 학습) → 반복 루프 → 세션 종료/복귀 훅

### MVP 경계 (프로토타입에 들어가는/빠지는 것)
_TBD — Core Loop 검증에 필수인 것만. 메타·수익화·세이브 등은 명시적으로 제외 표시._

## 관련
- [[../10-concept/index]] — 이 루프가 검증하려는 재미 가설
- [[../30-systems/index]] — 루프를 구성하는 시스템 상세
- [[../60-implementation/task-breakdown]] — 루프를 만드는 단계별 태스크

## Open questions
- 한 세션 목표 길이? 루프 1회 체감 시간?
- "플레이 가능"의 합격선(= [[../70-verification/index|검증]])과 동기화
