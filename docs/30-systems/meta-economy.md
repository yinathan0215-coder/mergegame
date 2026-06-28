---
id: meta-economy
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [meta, economy, coin, persistence, kst, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/MetaStore.ts"
---

# 메타 경제 — 코인 지갑 · 일일 영속

> 과제 요구 ③(시스템). Title 로비의 메타 기능([[daily-missions]] · [[attendance]] ·
> [[lucky-wheel]] · [[shop]])이 공유하는 **소프트 화폐(코인) 지갑**과 **한국시간(KST) 기준
> 일일 리셋·영속 저장**의 단일 출처. 수치 SSoT는 [[../40-balancing/meta-economy]].

## Summary

코인은 게임의 **소프트 화폐**다. 미션·출석·돌림판으로 벌고, 돌림판 회전(1회 120)에 쓴다.
지갑 잔액과 메타 진행도(미션 진행·출석 streak)는 **`localStorage`에 영속**되며, 날짜가 걸린
리셋은 모두 **KST(UTC+9) 자정**을 경계로 한다. 단일 모듈 `MetaStore`가 이 상태를 소유하고,
변경 시 구독자(Title 코인 표시·열린 팝업)에게 알린다.

## Details

### 코인 지갑
- **시작 잔액 = 0.** 신규 플레이어는 코인 0으로 시작한다([[../40-balancing/meta-economy]]
  `economy.startCoins`). Title 로비 상단에 현재 잔액이 코인 아이콘과 함께 표시된다([[../50-art-ux/title-screen]]).
- **획득:** 미션 달성(개당 50 + 누적 마일스톤 50/100/200), 출석(일차별 100~400), 돌림판(25~200).
- **소비:** 행운의 돌림판 1회 회전 = 120 코인([[lucky-wheel]]). 상점은 잠금이라 코인 소비처가 아니다([[shop]]).
- `addCoins(n)` / `spendCoins(n)`(잔액 부족 시 false) — 잔액은 0 미만이 될 수 없다.
- **코인 아이콘**은 단일 선언 헬퍼 `coinSprite()`(= `ASSETS.ui.gold`)를 참조한다. 재화/아이콘은
  개별 그래픽으로 재정의하지 않고 **항상 같은 선언을 참조**한다([[../50-art-ux/popup-system]] 아이콘 규칙).

### KST 일일 경계
- 날짜 문자열 = **`UTC+9`로 이동한 시각의 `YYYY-MM-DD`**. `kstDateStr(nowMs)`가 단일 출처.
- 미션은 `lastResetDate`가 오늘(KST)과 다르면 진행도·달성·마일스톤 청구를 **전부 초기화**한다([[daily-missions]]).
- 출석의 "다음 보상 시각"·일일 청구 가능 여부는 **다음 KST 자정까지 남은 시간**으로 계산한다([[attendance]]).
- 경계 판정은 로컬 표시용이며(클라이언트 시계 신뢰), 서버 검증은 프로토타입 범위 밖.

### 영속 (`localStorage`)
- 단일 키에 JSON으로 저장: `{ coins, missions, attendance, records }`.
- `MetaStore`는 생성 시 로드하고 **정규화**(누락 필드를 기본값으로 채움 — 구버전 저장이 새 스키마에서
  크래시하지 않도록)한 뒤, 변이 직후 저장한다. 저장 실패(시크릿 모드 등)는 무시하고 메모리 상태로 계속한다.

### 게임 레코드 (점수 영속)
코인·미션처럼 **게임 점수 레코드도 영속**된다([[../50-art-ux/title-screen]] 👑최고/🪐현재 점수의 SSoT).
- `records.best` = **역대 최고 점수**. 현재 점수가 갱신될 때 `best = max(best, current)`로 올린다.
- `records.current` = **현재(이어하기) 점수** — 마지막으로 보고된 점수.
- GameScene이 점수 변경 콜백에서 `setScore(current)`로 보고한다. Title 진입 시 `getProgress()`가
  `records`에서 최고·현재 점수를 읽어 표시한다. 저장은 최고 갱신 즉시 + 그 외 짧은 간격으로 스로틀.

### 게임플레이 → 미션 보고
- Pool In-Game의 머지 콜백([[../60-implementation/architecture]] `GameScene`)이 `MetaStore`에
  보고한다: 머지 1회(`reportMerge`), 현재 콤보값(`reportComboPeak`), 태양(tier 10) 생성(`reportSun`).
- `MetaStore`가 보고를 받아 일일 미션 진행도를 갱신한다. 개당 보상 50은 각 미션 행의 **보상 버튼으로 수령**한다([[daily-missions]]).

## Relates to
- [[daily-missions]] · [[attendance]] · [[lucky-wheel]] · [[shop]] — 코인을 벌고 쓰는 메타 기능들
- [[../50-art-ux/popup-system]] — 이 기능들이 공통으로 쓰는 팝업 틀
- [[../40-balancing/meta-economy]] — 시작 코인·미션·출석·돌림판 수치 SSoT
- [[../60-implementation/architecture]] — `MetaStore`/`MetaUI` 모듈 배치
