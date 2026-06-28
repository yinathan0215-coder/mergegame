---
id: index
note_type: moc
status: active
domain: meta
updated: 2026-06-28
---

# mergegame 기획문서 — 목차 (MOC)

**Planet Pool Merge** — 풀 조준 + Suika식 물리 머지를 결합한 글로벌 캐주얼 게임의 HTML5
프로토타입 기획문서이자, 게임 제작 과정에서 훅으로 갱신되는 **정본**. 진입 안내는 [[README]].

## 섹션 (과제 요구사항 정렬)

| # | 섹션 | 과제 요구 |
|---|---|---|
| 00 | [[00-meta/index\|meta]] | 파이프라인·스키마·템플릿·input-log (운영) |
| 10 | [[10-concept/index\|concept]] | ① 컨셉 & 핵심 재미 가설 |
| 20 | [[20-core-loop/index\|core-loop]] | ② Core Loop & 플레이 흐름 |
| 30 | [[30-systems/index\|systems]] | (③ 입력) 상세 시스템/메카닉 |
| 40 | [[40-balancing/index\|balancing]] | ④ 밸런싱 수치 |
| 50 | [[50-art-ux/index\|art-ux]] | ④ 아트·UX 가이드 |
| 60 | [[60-implementation/index\|implementation]] | ③ 구현 지시 (스택·구조·태스크) |
| 70 | [[70-verification/index\|verification]] | ⑤ KPI / 체크리스트 |
| 80 | [[80-research/index\|research]] | (근거) 레퍼런스·시장 |
| 90 | [[90-methodology/index\|methodology]] | 부록 A · 구조/방법론 기준 (제출 부록) |

산출물(게임): `game/` (HTML5 프로토타입, 스택 미정 → 예약).

## 시작점

- 무엇을·왜 → [[00-meta/knowledge-system-blueprint]]
- 작성 규칙 → [[00-meta/conventions]]
- 최근 변경 → [[log]]

## 상태

2026-06-28 **Planet Pool Merge 설계 분배 완료** — `2026-06-28-planet-pool-merge-design.md`를
각 섹션에 reconcile. 장르 = 물리 드롭/발사 머지(Suika 계열), 스택 = **Vite + TS + PixiJS +
Matter.js** 확정. 섹션 본문 `status: design`. 다음: phase별 구현 플랜
([[60-implementation/plan/index|plan]]) → `game/` 빌드 → Playwright 검증.
