---
id: adr-2026-06-28-data-driven-balance-json
note_type: decision
status: active
domain: implementation
updated: 2026-06-28
tags: [data-driven, balance, ssot, json, adr]
sources:
  - "[[../../00-meta/input-log/2026-06-28]]"
  - "raw: game/src/data/balance.json"
  - "raw: game/src/data/config.ts"
  - "raw: game/src/data/planets.ts"
---

# 밸런스 상수 단일 출처: `balance.json` (data-driven 로드, no-SQLite)

## Context

감사([[../../70-verification/audit-methodology-numbers]]) 결과 [[../../90-methodology/data-driven]]
원칙이 부분 준수였다: 밸런스 수치가 `config.ts`/`planets.ts`에 **리터럴로 선언**돼 있고,
`INITIAL_RACK`은 dead code인데 `GameScene`이 랙을 재하드코딩하는 등 **중복 선언/SSoT 누수**가
있었다. 요구: 모든 밸런스 상수를 **최상위 단일 데이터 소스에서 로드**하고, 변경을 한 곳에서
일원화하며, 에이전트가 쉽게 변경 요청할 수 있게 한다. SQLite 사용 여부도 검토 대상.

## Decision

- **단일 출처:** `game/src/data/balance.json` — 게임 내 **모든 튜너블 상수**(planets·combo·
  queue·rack·launch·physics·layout·colors·engine)를 이 한 파일에만 선언한다. **중복 변수 선언
  금지**, 시스템/렌더 코드에 밸런스 리터럴 하드코딩 금지.
- **로더 분리:** `config.ts`·`planets.ts`는 더 이상 값을 *선언*하지 않고 JSON을 **로드·검증·
  파생**해 기존과 동일한 이름으로 export(소비자 import 무변경). 파생값(`LINE_Y`·`POCKET.cy`·
  `LAUNCHER.y`·`STEP_MS`·`MAX_TIER`)은 JSON 원시값에서 계산하며 JSON에 중복 저장하지 않는다.
- **편집 경로:** [[balance-tune]] 스킬 + `.claude/agents/balance-tuner.md`(**model: sonnet**)
  에이전트 — JSON 편집 → 대응 docs(40-balancing/50-art-ux) reconcile → `npm run typecheck`.
- **저장 포맷 = JSON 파일** (Vite 빌드 타임 import). 색은 `#rrggbb` 문자열, 로더가 숫자로 파싱.

## Alternatives

- **SQLite(sql.js/wa-sqlite):** **미채택.** 브라우저 런타임 게임에 DB는 WASM 로더 의존성 +
  비동기 부팅 + (.db→JSON) 빌드 파이프라인을 추가하는데, 데이터는 ~30개 **정적 상수**라
  관계·쿼리·동시쓰기 needs가 전혀 없다. 에이전트도 SQL 마이그레이션보다 JSON 한 파일 편집이
  단순. → **과스펙.** (대규모/관계형/런타임 쿼리가 생기면 재검토.)
- **런타임 `fetch('balance.json')`:** 미채택(현 단계). 빌드 타임 import가 타입 안전 + Vite HMR로
  편집 즉시 반영돼 충분. 무빌드 핫에딧이 필요해지면 전환 가능.
- **TS 상수 유지(현행):** 미채택. 리터럴이 코드 여러 곳에 흩어져 중복/누수가 발생(감사에서 확인).

## Supersedes

- [[../../70-verification/audit-methodology-numbers]] 불일치 (a)minPower·(b)물리계수·(c)랙 중복을
  해소한다(코드 SSoT를 JSON으로 일원화 + `buildInitialRack`을 `INITIAL_RACK` 파생으로 교정).
- `config.ts`/`planets.ts`의 리터럴 선언 방식을 **로더 방식**으로 대체한다.
