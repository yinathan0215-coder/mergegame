---
id: impl-agent-runbook
note_type: spec
status: design
domain: implementation
updated: 2026-06-28
tags: [runbook, agent, scope]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 에이전트 런북

> 이 문서를 **그대로 코딩 에이전트에게 전달**하면 `Planet Pool Merge` 프로토타입을
> 빌드하도록 쓴 진입 지시. 스택([[tech-stack]])·구조([[architecture]])는 확정됨.

## 1) 읽는 순서

설계가 결정을 내리고 구현은 그것을 따른다. 순서대로 읽는다.

1. [[../10-concept/index|10 컨셉]] — 행성 11단계 순서, 핵심 재미 가설
2. [[../20-core-loop/index|20 코어 루프]] — 발사→충돌→합성→큐 갱신, 시작 상태
3. [[../30-systems/index|30 시스템]] — 발사/큐/합성 규칙(위치·속도·merge lock)
4. [[../40-balancing/index|40 밸런싱]] — 반지름·점수·확률·초기 랙·드래그/파워 수치
5. [[../50-art-ux/index|50 아트·UX]] — 색/패턴, 레이아웃, 입력, 표시/제외 UI
6. [[../60-implementation/index|60 구현]] — tech-stack → architecture → task-breakdown
7. [[../70-verification/index|70 검증]] — KPI / 완료 체크리스트

## 2) 만드는 순서

`game/`에 [[task-breakdown]]의 **Phase 0→5** 순서대로 구현하고, Phase 종료마다
[[../70-verification/index|검증]] 항목을 통과시킨다.

## 3) 판단 불가 영역

임의로 정하지 말 것. 수치·아트·UX 판단은 **40·50 섹션의 명시값**을 따른다. 손맛
관련 물리 튜닝(마찰·반발·최소 속도·최대 발사 속도) 휴리스틱도 [[../40-balancing/index|40-balancing]]이
단일 출처다 — 런북에 다시 적지 않는다.

## 4) 범위 판단 (§13) — Scope Fence

**만들지 않는다 (명시적 제외):**

- 포켓 / 포켓 관련 UI
- 게임 오버
- Shake 버튼 · Change Ball 버튼 · 광고 보상 버튼
- 상단 행성 진행 트랙 · 미도달 단계 실루엣

**프로토타입 필수 범위 아님 (구현하지 않아도 완료):**

- 저장 · 랭킹 · 사운드 · 튜토리얼
- 조준 중 취소 기능

> 우선순위는 방법론을 따른다([[../90-methodology/index|§9.7]]): Core Loop 플레이 가능성 >
> 입력·피드백 명확성 > 밸런스 검증성 > 시각 완성도 > 부가 연출.

## 5) 정지 규칙

설계가 명시하지 않은 값이 막으면 — **가정하지 말고** 해당 섹션(주로 40·50)을 먼저
확인하고, 거기에도 없으면 사용자에게 묻는다. 임의 기획 판단은 금지.

## 완료 기준

[[../70-verification/index|검증 기준]]의 KPI·체크리스트를 Phase마다 통과하면 완료.

## 관련

- [[task-breakdown]] · [[tech-stack]] · [[architecture]]
