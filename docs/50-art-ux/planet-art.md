---
id: art-ux-planet-art
note_type: section
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, planet, color, pattern, ssot, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 행성별 ART 표 — 색·패턴 SSoT (§9)

> 과제 요구 ④-b — 행성별 아트(색+패턴)의 단일 정본.
>
> **준수 기준(방법론):** [[../90-methodology/layered-rendering]] (식별성).

## 행성별 ART 표 — SSoT (§9 권장 패턴)

**이 표가 행성별 색+패턴의 단일 정본이다.** 다른 섹션은 여기를 링크만 한다. 단계 순서는
[[../10-concept/index]], 반지름 px·기본 점수는 [[../40-balancing/index]]에 있다.

| # | 행성 | 주색(들) | 패턴 |
|---|---|---|---|
| 1 | 수성 | 회색 | 작은 크레이터 |
| 2 | 화성 | 붉은색 | 진한 크레이터 |
| 3 | 금성 | 베이지 | 작은 점무늬 |
| 4 | 지구 | 초록 + 하늘색 | 초록 대륙 + 하늘색 바다 |
| 5 | 해왕성 | 진한 파랑 | 물결 줄무늬 |
| 6 | 천왕성 | 밝은 민트/시안 + 청록 | 얇은 청록 고리 + 넓은 청록 곡선 줄무늬 |
| 7 | 토성 | 노랑/황금색 | **링 포함** |
| 8 | 목성 | 주황/갈색 | 큰 줄무늬 + 반점 |
| 9 | 태양 | 노랑/오렌지 | **밝은 빛 테두리** (최종 단계) |

> 패턴 종류는 §9 레퍼런스의 크레이터·점무늬·대륙·줄무늬·용암형 계열을 사용한다. 색·패턴은
> 두꺼운 외곽선([[art-direction]]) 안에서 표현한다.

> 반지름 px는 여기 두지 않는다. 단계별 반지름 값의 SSoT → [[../40-balancing/index]].

## 스프라이트 생성 정본

- 렌더링 정본은 `game/public/assets/resource-preview.png`의 행성 세트다: 굵은 짙은 외곽선, 플랫 2D 원형 아이콘, 단순 셀 셰이딩, 선명한 벡터형 가장자리.
- 행성 리소스 생성은 개별 정사각 캔버스 단위로 진행한다. 최종 PNG는 전체 캔버스를 축소해 256x256으로 정규화하고, 크롭된 시트 조각을 쓰지 않는다.
- AI 생성 리소스는 최종 프롬프트, 생성 원본 경로, 후처리 절차, 최종 산출물 경로를 `game/public/assets/prompts/planet-sprite-canonical.md`에 기록한다.
- 천왕성(Tier 6)은 밝은 민트/시안 본체, 넓은 청록 곡선 밴드, 얇고 기울어진 청록/얼음색 고리로 식별한다. 토성(Tier 7)은 더 두껍고 큰 황금 고리로 구분한다.

## 관련

- [[50-art-ux/index]] — 아트/UX 카탈로그.
- [[art-direction]] — 외곽선·플랫 2D·2~3색 등 아이콘 규칙.
- [[input-ux]] — 작은 발사대 행성에서도 패턴이 읽혀야 한다(UX 판단 4번).
- [[../10-concept/index]] — 행성 9단계 순서(SSoT).
- [[../40-balancing/index]] — 단계별 반지름 px·기본 점수(SSoT).
