---
id: concept-planet-ladder
note_type: section
status: design
domain: concept
updated: 2026-06-28
tags: [concept, planet-ladder, ssot]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 행성 사다리 (정본 — 11단계 ORDER)

> 과제 요구 ① — *컨셉(행성 등급 순서)*. 섹션 카탈로그: [[index]].

> **이 목록이 행성 등급 순서의 SSoT다.** 다른 섹션은 단계 식별에 이 목록을 참조한다.
> 단계별 **반지름·점수 수치**는 [[../40-balancing/planet-stats]]가 정본,
> 단계별 **색·패턴(아트)**은 [[../50-art-ux/planet-art]]가 정본 — 여기에 중복 기재하지 않는다.

같은 등급 행성끼리 충돌하면 **다음 단계 하나로** 합성된다. 사다리 순서:

1. 소행성
2. 수성
3. 화성
4. 금성
5. 지구
6. 해왕성
7. 천왕성
8. 토성
9. 목성
10. 태양
11. 블랙홀

**블랙홀 = 최종 단계.** 태양끼리 충돌하면 블랙홀로 합성되고, 블랙홀끼리 충돌하면 더 이상 합성되지 않고 일반 물리 충돌만 처리한다(기본). **Infinite 모드 한정**으로 블랙홀끼리 합성하면 둘 다 소멸하고 카운트 +20을 준다([[../30-systems/merge-rules]] · ADR [[../30-systems/decisions/2026-06-28-blackhole-infinite-count]]).

## 관련
- [[index]] — 섹션 카탈로그
- [[concept]] — 이 사다리를 합성으로 오르는 게임 컨셉
- [[../40-balancing/planet-stats]] — 단계별 반지름·점수 수치(정본)
- [[../50-art-ux/planet-art]] — 단계별 색·패턴(정본)
