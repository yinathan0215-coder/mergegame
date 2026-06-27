---
id: impl-task-breakdown
note_type: spec
status: draft
domain: implementation
updated: 2026-06-27
tags: [tasks, phases]
sources: []
---

# 단계별 태스크 분해 (Phases)

> 과제 요구 ③의 핵심: 에이전트가 **순서대로 실행**할 수 있는 단위로 분해. 각 Phase는
> "산출물 + 완료 판정"을 가진다. `status: draft` — 설계 확정 후 채움.

## Phase 골격 (TBD)

| # | Phase | 산출물 | 완료 판정 → [[../70-verification/index|검증]] |
|---|---|---|---|
| 0 | 부트스트랩 | 빈 캔버스가 브라우저에서 렌더 | 화면이 뜬다 |
| 1 | 보드 렌더 | 그리드 + 아이템 표시 | _TBD_ |
| 2 | 머지 입력 | 탭/드래그로 합성 동작 | _TBD_ |
| 3 | 코어 루프 | 입력→머지→생성/보상 1사이클 플레이 | _TBD_ |
| 4 | 진행/피드백 | 목표·피드백·간단 UX | _TBD_ |
| 5 | 폴리시 | 온보딩, 사운드/연출 최소 | _TBD_ |

> 각 행은 확정 시 [[../20-core-loop/index|코어 루프]] / [[../30-systems/index|시스템]]의
> 구체 규칙으로 채운다. Phase 종료마다 검증 체크리스트를 통과시킨다.

## 관련
- [[agent-runbook]] — 위 Phase들을 에이전트에게 전달하는 형태
