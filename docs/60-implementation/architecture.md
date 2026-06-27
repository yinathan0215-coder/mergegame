---
id: impl-architecture
note_type: spec
status: draft
domain: implementation
updated: 2026-06-27
tags: [architecture]
sources: []
---

# 프로젝트 구조 / 모듈 / 데이터 모델

> `status: draft` — 스택 확정 후 구체화. 아래는 채울 골격.

## 폴더 구조 (game/ 내부, TBD)
_TBD — 예: `index.html`, `src/`(scene/board/merge/economy/ui), `assets/`, build config._

## 모듈 경계 (TBD)
_TBD — 렌더 / 게임상태 / 입력 / 규칙(merge·economy) / UI 의 책임 분리._

## 데이터 모델 (TBD)
_TBD — 보드 상태, 아이템/체인 정의, (필요 시) 세이브 포맷. 데이터는 코드와 분리해 표/JSON로._

## 관련
- [[tech-stack]] · [[task-breakdown]]
- [[../30-systems/index]] — 모듈이 구현할 시스템 규칙
- [[../40-balancing/index]] — 데이터 모델에 들어갈 수치
