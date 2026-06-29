---
id: art-ux-result-window
note_type: section
status: design
domain: art-ux
updated: 2026-06-29
tags: [art, ux, result, popup, transition, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 결과창 — Infinite Result · Stage Clear · Stage Fail

> 문서 범위 ④-b(UX 판단). 게임 모드([[../20-core-loop/game-modes]])가 끝날 때 뜨는 세 결과창의
> 연출을 정본화한다. 모두 **공통 팝업 틀**([[popup-system]])의 오픈 전환을 쓴다.

## Summary

세 결과창은 모두 **전환 효과와 함께 등장**한다(공통 팝업 진입 연출: 딤 차오름 + 콘텐츠
스케일/페이드, [[popup-system]] · 수치 `juice.popup`). Infinite는 **스코어 카운트업** 연출,
Stage는 **클리어/실패** 두 종류다.

## Details (decisions)

### Infinite Result (세션 종료)
- **등장:** 카운트 소진 + **모든 행성 정지 시**, 전환 효과와 함께 결과창이 뜬다(고정 지연 없음).
- **스코어 연출:** 표시 점수가 **1부터 최종 점수까지 쭉 상승**(카운트업 트윈, 지속 시간
  [[../40-balancing/game-modes]])한 뒤 최종값에서 멈춘다.
- **NEW RECORD:** 최종 점수가 **영속 최고 점수**(`localStorage`)를 넘으면 `NEW RECORD`를 표시하고
  최고 점수를 갱신한다. 갱신이 아니면 점수만 보여주고 끝난다.
- **하단:** 이번 세션의 **최대 콤보 횟수**(콤보 체인 피크, [[feedback-effects]] §8)를 표시한다.
- **나가기:** 화면을 **탭하면 Title로 복귀**한다([[../20-core-loop/screen-flow]]).

### Stage Clear
- **클리어 연출(결과창 전):** 목표 행성이 합성되는 순간 **추가 발사 정지 + 발사대 비움 + 보드 물리 정지**.
  방금 만든 목표 행성이 **우하단 목표 UI 행성으로 포물선을 그리며 날아가**(회전하며 목표 UI 크기로 축소)
  도달 지점에서 **합쳐지는 머지 버스트**를 내고 사라진다 — **실제 합성이 아니라** 보드에서 제거한 뒤의
  연출 스프라이트다([[../30-systems/stage-mode]] §클리어).
- **등장:** 위 연출(비행 + 버스트)이 끝나면 전환 효과와 함께 클리어 결과창이 뜬다(보상 **코인 +300** 지급 후).
  고정 2초 대기 대신 **연출 완료가 등장 트리거**다.
- **버튼(하단 2개):** **[다음 스테이지]**(다음 레벨 보드로) · **[돌아가기]**(→Title). **어느 쪽이든 클리어
  시점에 현재 스테이지 포인터가 다음 스테이지로 전진·영속**되어, 이후 Title `Stage N`·다음 진입이 다음
  스테이지가 된다([[../30-systems/stage-mode]] §클리어).

### Stage Fail
- **등장:** 카운트 소진(목표 미달) **2초 뒤**, 전환 효과와 함께 Fail 결과창이 뜬다.
- **나가기:** 닫으면 **게임 화면(같은 스테이지 보드)으로 복귀**한다.

### 공통
- **Stage 클리어**는 비행+버스트 연출 완료 후 등장하고, **Stage 실패**는 카운트 소진(목표 미달) 후
  **2초 지연** 등장(수치 [[../40-balancing/game-modes]], 대기 중 화면 탭 시 즉시); **Infinite 결과**는
  카운트 소진 + 모든 행성 정지 후 즉시 등장(고정 지연 없음).
- 결과창은 메타 팝업과 같은 **contain 레이어**(`fgRoot`)에 그려지고, 딤은 DESIGN을 크게 넘는 사각으로
  뷰포트 전체(레터박스 포함)를 덮는다([[popup-system]] §입력·딤). 동시에 하나만 뜬다.

## Relates to
- [[../20-core-loop/game-modes]] — 어떤 모드가 어떤 결과창으로 끝나는지
- [[../30-systems/stage-mode]] — 클리어/실패 종료 규칙·보상
- [[popup-system]] — 공통 팝업 진입 전환·딤
- [[feedback-effects]] — 점수 오도미터·콤보 피크 연출
- [[../40-balancing/game-modes]] — 카운트업 트윈 지속 시간
