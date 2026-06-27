---
id: implementation-index
note_type: index
status: draft
domain: implementation
updated: 2026-06-27
tags: [implementation]
sources: []
---

# 60 · 구현 지시 (에이전트 빌드 스펙)

> 과제 요구 ③ — *에이전트에게 전달할 구현 지시: 기술 스택, 구조, 단계별 태스크 분해*.
> 이 폴더의 산출물이 `game/` 를 채운다.
>
> **준수 기준(방법론):** [[../90-methodology/ecs-lite]] · [[../90-methodology/game-loop]] · [[../90-methodology/agent-friendly-spec]] (Must/Should/May·Scope Fence·우선순위).

## 페이지

- [[tech-stack]] — 기술 스택 결정(미정 → 결정 시 기록) + 근거
- [[architecture]] — 프로젝트 구조 / 모듈 / 데이터 모델
- [[task-breakdown]] — 단계별(Phase) 태스크 분해, 에이전트 실행 단위
- [[agent-runbook]] — 에이전트에게 그대로 전달하는 실행 지시(프롬프트 형태)

## 읽는 순서 (에이전트 관점)
설계(10–50) → tech-stack → architecture → task-breakdown 순으로 실행, 각 Phase 종료 시
[[../70-verification/index|검증]] 체크.
