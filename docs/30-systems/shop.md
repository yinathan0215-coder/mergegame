---
id: shop
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [meta, shop, locked, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/popups/ShopPopup.ts"
---

# 상점 (잠금)

> 과제 요구 ③(시스템). Title 로비 `상점` 버튼으로 여는 창. 팝업 틀은 [[../50-art-ux/popup-system]].

## Summary

상점은 이번 프로토타입에서 **잠금 상태**다. 버튼을 누르면 팝업 틀로 창이 열리되, 내용은
**잠금(준비 중) 표시**만 보여주고 구매 기능은 제공하지 않는다.

## Details

- `상점` 버튼 → 팝업 틀([[../50-art-ux/popup-system]])로 창 오픈(제목 "상점"), 정상 오픈 연출·X 닫기.
- 본문은 **자물쇠 아이콘 + 안내 문구("준비 중")** 중심의 잠금 상태 표시. 판매 항목·가격·구매
  버튼은 없다(코인 소비처 아님 — [[meta-economy]]).
- 잠금 표시 외 다른 메타 기능과 동일한 입력 차단·딤·전환을 따른다.

## Relates to
- [[../50-art-ux/popup-system]] — 창 틀(BG/제목/X, 잠금 본문)
- [[meta-economy]] — 잠금 상태이므로 상점 자체는 코인 소비처가 아님
