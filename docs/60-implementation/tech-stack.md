---
id: impl-tech-stack
note_type: spec
status: draft
domain: implementation
updated: 2026-06-27
tags: [stack]
sources: []
---

# 기술 스택

> **미정.** 후보: pixi.js(2D WebGL) / vanilla HTML5 Canvas / three.js(3D). 결정 시 이
> 페이지에 "결정 + 근거 + 버전"을 적고 `status: design` 으로 올린다.

## 결정 (TBD)
- 렌더러:
- 언어/빌드: _TBD (예: TypeScript + Vite, 또는 무빌드 단일 index.html)_
- 의존성 정책: _TBD (정적 호스팅으로 바로 열리는 산출물 권장)_

## 근거 (TBD)
- 머지 보드는 2D 스프라이트 위주 → 2D 렌더러 적합성 기록.
- "평가자가 바로 열어볼 수 있는가" / "에이전트가 막힘없이 만들 수 있는가" 기준.

## 제약
- 산출물은 `game/` 에서 **정적으로 실행** 가능해야 한다 (브라우저로 열기/간단 서브).
- 외부 네트워크 의존 최소화 (오프라인에서도 Core Loop 플레이 가능).

## 관련
- [[architecture]] · [[task-breakdown]] · [[../../game/README|game/ 예약 폴더]]
