---
id: implementation-index
note_type: index
status: design
domain: implementation
updated: 2026-06-28
tags: [implementation]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 60 · 구현 지시 (에이전트 빌드 스펙)

> 문서 범위 ③ — *에이전트에게 전달할 구현 지시: 기술 스택, 구조, 단계별 태스크 분해*.
> 이 폴더의 산출물이 `game/`를 채운다.
>
> **결정된 스택:** Vite + TypeScript + **PixiJS**(2D 렌더) + **Matter.js**(2D 물리) —
> Three.js 미사용([[tech-stack]]).
>
> **준수 기준(방법론):** [[../90-methodology/ecs-lite]] · [[../90-methodology/game-loop]] ·
> [[../90-methodology/layered-rendering]] · [[../90-methodology/event-driven]] ·
> [[../90-methodology/agent-friendly-spec]].

## 페이지

- [[tech-stack]] — 확정 스택(Pixi+Matter) + 역할 분담 + 근거(Three.js·Canvas 미채택)
- [[architecture]] — 모듈 경계 / 시뮬·렌더 분리 / 데이터 모델(`balance.json` SSoT·no-SQLite 근거)
- [[task-breakdown]] — Phase별 태스크
- [[agent-runbook]] — 읽는 순서 · 만드는 순서 · 범위 판단(Scope Fence)
- [[plan/index|plan]] — **Phase별 빌드 실행 트래커**(만들 파일·수치·수용 기준·진행 체크박스)
- [[sound-manager]] — **`SoundManager`** 스펙: Web Audio 절차 합성 + 동시 보이스 상한·사운드별 스로틀·뮤트·자동재생 해제.

## 읽는 순서 (에이전트 관점)

설계(10–50) → [[tech-stack]] → [[architecture]] → [[task-breakdown]] 순으로 실행,
각 Phase 종료 시 [[../70-verification/index|검증]] 체크.
