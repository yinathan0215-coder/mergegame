---
id: art-ux-result-window
note_type: section
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, ux, result, popup, transition, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 결과창 — Infinite Result · Stage Clear · Stage Fail

> 과제 요구 ④-b(UX 판단). 게임 모드([[../20-core-loop/game-modes]])가 끝날 때 뜨는 세 결과창의
> 연출을 정본화한다. 모두 **공통 팝업 틀**([[popup-system]])의 오픈 전환을 쓴다.

## Summary

세 결과창은 모두 **전환 효과와 함께 등장**한다(공통 팝업 진입 연출: 딤 차오름 + 콘텐츠
스케일/페이드, [[popup-system]] · 수치 `juice.popup`). Infinite는 **스코어 카운트업** 연출,
Stage는 **클리어/실패** 두 종류다.

## Details (decisions)

### Infinite Result (세션 종료)
- **등장:** 카운트 소진 **2초 뒤**, 전환 효과와 함께 결과창이 뜬다(마지막 연출 여운).
- **스코어 연출:** 표시 점수가 **1부터 최종 점수까지 쭉 상승**(카운트업 트윈, 지속 시간
  [[../40-balancing/game-modes]])한 뒤 최종값에서 멈춘다.
- **NEW RECORD:** 최종 점수가 **영속 최고 점수**(`localStorage`)를 넘으면 `NEW RECORD`를 표시하고
  최고 점수를 갱신한다. 갱신이 아니면 점수만 보여주고 끝난다.
- **하단:** 이번 세션의 **최대 콤보 횟수**(콤보 체인 피크, [[feedback-effects]] §8)를 표시한다.
- **나가기:** 화면을 **탭하면 Title로 복귀**한다([[../20-core-loop/screen-flow]]).

### Stage Clear
- **등장:** 목표 달성 **2초 뒤**, 전환 효과와 함께 클리어 결과창이 뜬다(보상 **코인 +300** 지급 후).
- **버튼(하단 2개):** **[다음 스테이지]**(다음 레벨 보드로) · **[돌아가기]**(→Title).
  ([[../30-systems/stage-mode]]).

### Stage Fail
- **등장:** 카운트 소진(목표 미달) **2초 뒤**, 전환 효과와 함께 Fail 결과창이 뜬다.
- **나가기:** 닫으면 **게임 화면(같은 스테이지 보드)으로 복귀**한다.

### 공통
- 종료 조건 충족 후 **2초 지연**을 두고 등장한다(연출 여운, 수치 [[../40-balancing/game-modes]]).
- 결과창은 메타 팝업과 같은 **contain 레이어**(`fgRoot`)에 그려지고, 딤은 DESIGN을 크게 넘는 사각으로
  뷰포트 전체(레터박스 포함)를 덮는다([[popup-system]] §입력·딤). 동시에 하나만 뜬다.

## Relates to
- [[../20-core-loop/game-modes]] — 어떤 모드가 어떤 결과창으로 끝나는지
- [[../30-systems/stage-mode]] — 클리어/실패 종료 규칙·보상
- [[popup-system]] — 공통 팝업 진입 전환·딤
- [[feedback-effects]] — 점수 오도미터·콤보 피크 연출
- [[../40-balancing/game-modes]] — 카운트업 트윈 지속 시간
