---
id: systems-planet-charge
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, charge, coin, infinite, popup, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 행성 충전 — 코인으로 카운트 구매 (Infinite)

> 과제 요구 ③. **Infinite 모드 한정**으로 코인을 써서 남은 카운트를 사는 충전 버튼과 팝업을
> 정본화한다. 카운트 [[30-systems/launch-count]] · 코인 경제 [[30-systems/meta-economy]] ·
> 공통 팝업 틀 [[50-art-ux/popup-system]].
>
> **준수 기준(방법론):** [[90-methodology/event-driven]] (구매 → 코인 차감·카운트 가산) ·
> [[90-methodology/data-driven]] (단가·기본값 = 데이터).

## Summary

Infinite 보드 **우측 빈 영역**에 충전 버튼을 둔다. 버튼은 **회전하는 지구 아이콘 + 영문 타이틀
`Planet Charge`** 로 구성된다. 누르면 공통 팝업이 열려 **코인으로 카운트를 구매**한다.

## Details (decisions)

### 충전 버튼
- 위치: Infinite 인게임 보드 **우측 빈 영역**(Stage 모드에는 없음, [[50-art-ux/layout]]).
- 구성: **회전하는 지구(5단계) 아이콘** + 그 아래/옆 **영문 타이틀 `Planet Charge`**.
- 공통 버튼 프레스 피드백([[50-art-ux/feedback-effects]] §5)을 쓴다. 누르면 충전 팝업을 연다.

### 충전 팝업 (공통 팝업 틀)
[[50-art-ux/popup-system]]을 상속한다(BG·제목·X·동일 오픈 전환). 콘텐츠:

- **중앙:** 지구가 회전한다. 지구 **오른쪽**에 `+N`(이번에 충전될 카운트 수, 예: `+10`)을 크게 표시.
- **하단 슬라이더:** 왼쪽 끝 = `0`, 오른쪽 끝 = **현재 코인으로 살 수 있는 최대 카운트**.
  - 단가 = **10개당 100코인**(= 10카운트 단위로만 선택, [[40-balancing/game-modes]]).
  - **기본 선택값 = +10.**
  - **코인이 100 미만이면** 슬라이더는 왼쪽 끝(0)에 고정되고 오른쪽으로 당길 수 없다.
- **충전 버튼:** 슬라이더를 당기면(N>0) 중앙 하단에 `충전` 텍스트 버튼이 활성화된다.
  - 버튼 **바깥 하단**에 **`[코인 아이콘] current/needed`** 형태로 코인 현황을 표시한다
    (current = 현재 보유 코인, needed = 선택한 N에 필요한 코인).
- **구매 처리:** `충전`을 누르면 needed 코인을 차감하고([[30-systems/meta-economy]] 지갑)
  카운트를 N만큼 더한다([[30-systems/launch-count]]). 잔액이 부족하면 구매할 수 없다.

## Relates to
- [[20-core-loop/game-modes]] — Infinite 모드 우측 충전 버튼
- [[30-systems/launch-count]] — 구매로 늘어나는 카운트
- [[30-systems/meta-economy]] — 코인 지갑(차감)
- [[50-art-ux/popup-system]] — 공통 팝업 틀(BG·제목·X·전환)
- [[40-balancing/game-modes]] — 단가(10당 100)·기본값(+10)
