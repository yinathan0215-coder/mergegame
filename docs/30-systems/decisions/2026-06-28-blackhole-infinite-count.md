---
id: 2026-06-28-blackhole-infinite-count
note_type: decision
status: active
domain: systems
updated: 2026-06-28
tags: [decision, merge, black-hole, infinite, count]
sources:
  - "[[../../00-meta/input-log/2026-06-28]]"
---

# Infinite 모드: 블랙홀끼리 합성 → 카운트 +20 (둘 다 소멸)

## Context
행성 사다리 정본([[../../10-concept/planet-ladder]])과 합성 규칙([[../merge-rules]])은
**블랙홀(11단계)끼리 충돌해도 합성하지 않고 일반 물리 충돌만 처리**한다고 못 박았다. 블랙홀이
사다리의 끝이기 때문이다. 게임 모드 추가([[../../00-meta/input-log/2026-06-28]])로 Infinite
모드에 **마지막 행성 보너스**가 도입되면서 이 규칙과 충돌한다.

## Decision
**Infinite 모드에 한해** 블랙홀 + 블랙홀이 충돌하면 **두 블랙홀을 모두 제거하고 카운트 +20**
([[../launch-count]])을 준다. 새 행성은 생성하지 않는다(사다리는 여전히 블랙홀에서 끝난다).
**Stage 모드와 그 밖의 기본 동작에서는** 블랙홀끼리 합성하지 않고 일반 물리 충돌만 처리한다
(기존 규칙 유지).

## Alternatives
- 모든 모드에서 블랙홀 합성 허용 — Stage/일반 플레이의 사다리 종단 일관성을 깨므로 채택 안 함.
- 태양(10단계)을 "마지막 행성"으로 해석 — 사용자 확정으로 **블랙홀**(최종 단계)이 마지막 행성.

## Supersedes
- [[../../10-concept/planet-ladder]] · [[../merge-rules]] 의 "블랙홀끼리 합성 없음" 을
  **Infinite 모드 한정으로** 덮어쓴다(다른 모드에서는 그대로 유효).
