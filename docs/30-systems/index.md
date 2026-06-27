---
id: systems-index
note_type: index
status: draft
domain: systems
updated: 2026-06-27
tags: [systems]
sources: []
---

# 30 · 시스템 & 메카닉

코어 루프를 구성하는 상세 시스템. 한 시스템 = 한 페이지
([[../00-meta/templates/section-template|section-template]] 기반). 과제 요구 ③(구현 지시)의
입력이 된다.

> **준수 기준(방법론):** [[../90-methodology/ecs-lite]] (오브젝트 분해) · [[../90-methodology/game-loop]] (실행 순서) · [[../90-methodology/event-driven]] (시스템 통신).

> 머지 세부 메카닉 **미정** → 확정되는 대로 아래에 페이지를 추가한다. 지금은 빈 슬롯.

## 예상 시스템 페이지 (확정 시 생성)

- `merge-mechanic.md` — 합성 규칙(무엇이 무엇과, 결과는)
- `board.md` — 보드/그리드 구조, 배치/이동 규칙
- `generators.md` — 생성기/소스, 아이템 공급
- `economy.md` — 자원(에너지 등) 순환, 소비/획득
- `progression.md` — 진행/해금/목표

각 페이지는 `40-balancing/`(수치)·`60-implementation/`(구현)과 상호 링크한다.

## Open questions
- 머지 위 메타 레이어 유무가 시스템 목록을 좌우 → [[../10-concept/index|컨셉]] 확정 대기.
