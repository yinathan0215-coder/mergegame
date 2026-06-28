---
id: lucky-wheel
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [meta, wheel, gacha, coin, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/popups/LuckyWheelPopup.ts"
---

# 행운의 돌림판

> 과제 요구 ③(시스템). Title 로비 `행운의 돌림판` 버튼으로 여는 창. 코인은 [[meta-economy]],
> 팝업 틀은 [[../50-art-ux/popup-system]], 수치 SSoT는 [[../40-balancing/meta-economy]].

## Summary

코인을 걸고 돌리는 8칸 룰렛. 1회 회전에 **120 코인**을 소모하고, **25·50·75·100·125·150·175·200**
중 하나의 코인을 균등 확률로 돌려준다. 회전 시작 → 정지 입력 → 3초 감속 정착의 인터랙션이다.

## Details

### 구성
- **8칸**, 각 칸 보상 코인 = [[../40-balancing/meta-economy]] `wheel.segments` =
  **25 · 50 · 75 · 100 · 125 · 150 · 175 · 200**.
- **1회 비용 = 120 코인**(`wheel.cost`). 잔액 < 120이면 회전 버튼 비활성.

### 회전 인터랙션
1. **회전 시작**: 회전 버튼을 누르면 코인 120을 차감하고 룰렛이 **빠르게 등속 회전**한다. 버튼은
   `정지`로 바뀐다.
2. **정지 입력**: `정지`를 누른 순간 결과 칸이 **결정**된다 — 8칸 **균등 확률 랜덤**으로 하나 선택.
3. **감속·정착**: 선택된 칸까지 **3초(`wheel.decelMs`)에 걸쳐 ease-out 감속**하며 그 칸의 포인터
   위치에 정확히 정지한다. 감속 구간엔 추가 난수가 없다(**결정론적** — 결과는 정지 순간 고정).
4. **지급**: 정지하면 해당 칸의 코인을 지급한다([[meta-economy]]).

### 표시
- 팝업 틀([[../50-art-ux/popup-system]])을 **BG 패널 없이**(`hasBg=false`) 쓴다 — 딤 위에 제목
  "행운의 돌림판" + 룰렛 + 회전/정지 버튼만. X 버튼으로 닫는다.
- 포인터(고정 화살표)는 룰렛 상단, 결과 칸은 포인터 아래에 멈춘다.
- **회전/정지 버튼**(입체감 있는 공통 버튼, [[../50-art-ux/popup-system]] 버튼 규칙): 대기 시 왼쪽에
  **[코인 아이콘] 위 / [비용 120] 아래**로 세로 정렬한 비용 + 오른쪽에 **"회전"** 텍스트. 회전 중에는
  버튼 안에 **"정지"** 텍스트만 표시한다.

## Relates to
- [[meta-economy]] — 코인 소비(120)/지급(25~200)
- [[../50-art-ux/popup-system]] — 창 틀(BG 생략 형태)
- [[../40-balancing/meta-economy]] — 칸 보상·비용·감속 시간 수치 SSoT
