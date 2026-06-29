---
id: attendance
note_type: system
status: design
domain: systems
updated: 2026-06-29
tags: [meta, attendance, daily, reward, kst, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/popups/AttendancePopup.ts"
---

# 출석 체크 (일일 보너스)

> 문서 범위 ③(시스템). Title 로비 `출석 체크` 버튼으로 여는 창. 코인은 [[meta-economy]],
> 팝업 틀은 [[../50-art-ux/popup-system]], 수치 SSoT는 [[../40-balancing/meta-economy]].

## Summary

**7일 주기** 출석 보상. KST 날짜가 바뀔 때마다 하루 1회 보상을 받을 수 있고, 일차가 1→7로
진행하며 코인이 커진다. 받은 뒤에는 하단에 **다음 보상까지 남은 시간**이 표시된다.

## Details

### 7일 보상 (KST 일자 기준)
- 1~7일차 보상 코인은 [[../40-balancing/meta-economy]] `attendance.rewards` = **100·150·200·250·300·350·400**.
- 일차는 보상을 받을 때마다 1씩 진행하고 **7일차 후 1일차로 순환**한다.
- 출석 streak(현재 일차)·마지막 청구 날짜는 영속된다([[meta-economy]]).

### 하루 1회 / 청구
- **새 KST 날짜**(마지막 청구일 ≠ 오늘)면 그날 보상이 **청구 가능** 상태가 된다.
- 청구 가능 상태에서는 **받기 버튼**이 보인다. **받기 버튼**을 누르거나 **해당 보상 일차 칸을 직접
  눌러** 보상을 받는다. 받으면 코인 지급 + 그 칸에 체크(✓), 일차 +1, 청구일 = 오늘.
- 이미 오늘 받았으면 받기 버튼 대신 하단에 **"다음 보상 시간 HH:MM:SS"** — **다음 KST 자정까지
  남은 시간**을 카운트다운으로 표시한다([[meta-economy]]).

### 레드닷 (받을 보상 알림)
오늘 받을 수 있는 출석 보상이 있으면(마지막 청구일 ≠ 오늘 = `MetaStore.attendanceCanClaim`) 출석 버튼에
**레드닷 뱃지**를 표시한다. 받으면 사라지고 다음 KST 자정에 다시 켜진다. 표시 위치 정본:
[[../50-art-ux/title-screen]] §2-3 · [[../50-art-ux/layout]] §2-c.

### 표시
- 팝업 틀([[../50-art-ux/popup-system]])의 BG(제목 "일일 보너스") 위에 1~6일차 3열 그리드 + 7일차
  와이드 칸 + 하단 안내(받기 버튼 / 다음 보상 시간)를 배치한다. 청구된 칸은 ✓, 현재 청구 가능한
  칸은 강조, 이후 칸은 비활성 톤.

## Relates to
- [[meta-economy]] — 코인 지급·KST 자정 경계·영속(streak/청구일)
- [[../50-art-ux/popup-system]] — 창 틀(BG/제목/X)
- [[../40-balancing/meta-economy]] — 일차별 보상 수치 SSoT
