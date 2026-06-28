---
id: adr-2026-06-28-stack-pixijs-matter
note_type: decision
status: active
domain: implementation
updated: 2026-06-28
tags: [stack, pixijs, matter, adr]
sources:
  - "[[../../00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 스택 결정: Vite + TypeScript + PixiJS + Matter.js

## Context

프로젝트가 폐기된 Slime Legion 설계에서 **Planet Pool Merge**(Suika 계열 물리 드롭/발사
머지)로 피벗하면서, 이전까지 "미정(TBD)"이던 렌더 스택을 확정해야 했다. 게임의 본질은
**세로 2D 보드 위 원형 행성 바디의 충돌·반사·합성**이다 — 발사 파워, 벽 반사, 연쇄 합성
같은 손맛이 실제 물리 시뮬레이션으로 나와야 한다(소스 §10).

## Decision

스택을 다음으로 고정한다.

- **빌드:** Vite — 정적 산출물, `game/`에서 즉시 실행.
- **언어:** TypeScript — 행성 데이터/상태/점수/합성 규칙의 타입 안정성.
- **렌더:** **PixiJS** (2D WebGL) — 행성 그래픽·UI·조준선·배경.
- **물리:** **Matter.js** (2D 강체) — 원형 바디·벽 충돌·반발·마찰·충돌 이벤트.

물리는 Matter가 권위, 렌더는 Pixi가 매 프레임 읽기 전용으로 반영한다(분리 규칙은
[[../architecture]], 표준은 [[../../90-methodology/layered-rendering]]).

## Alternatives

- **Three.js (3D):** 미채택. 2D 물리 퍼즐에 카메라/조명/메시 비용은 범위 대비 과하다.
  플랫 2D 아이콘 아트([[../../50-art-ux/index]])에 3D 파이프라인은 불필요.
- **Canvas-only(무프레임워크 HTML5 Canvas):** 미채택. 충돌·반발·연쇄 합성 물리를 직접
  구현하면 손맛 튜닝 비용이 커지고 에이전트 실행이 막히기 쉽다. Matter.js가 충돌
  이벤트·반발·속도를 제공해 합성 판정 입력을 안정적으로 만든다. 렌더도 다수 스프라이트
  배칭에 PixiJS가 유리.

## Supersedes

- **이전 Canvas 2D 렌더 방향** — 프로젝트 CLAUDE.md에서 한때 참조되었으나 별도 ADR 파일은
  부재했다. 이 결정이 그 방향을 **대체**한다: 렌더는 Canvas 2D가 아니라 PixiJS이며, 물리는
  Matter.js를 사용한다.
