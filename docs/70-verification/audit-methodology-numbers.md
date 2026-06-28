---
id: verification-audit-methodology-numbers
note_type: section
status: active
domain: verification
updated: 2026-06-28
tags: [audit, methodology, balancing, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/src/data/config.ts"
  - "raw: game/src/data/planets.ts"
  - "raw: game/src/GameScene.ts"
---

# 방법론·수치 정합 감사 (2026-06-28)

> 섹션: [[70-verification/index|70 · 검증 기준]]. 자매: [[70-verification/kpi]] · [[70-verification/checklist]].
>
> `game/` 구현이 **(1)** [[../90-methodology/index|90-methodology]] 7대 원칙과 **(2)**
> [[../40-balancing/index|40-balancing]] 수치 SSoT를 기반으로 개발됐는지 다중 에이전트로
> 교차검증한 결과. 증거는 모두 `file:line` 인용. 감사 대상 = `game/src/*` 13모듈 + `game/tests/`.

## 결론

**수치 = 합격, 구조 표준 = 부분 합격.** 문서에 못박힌 모든 밸런싱 수치가 코드와 정확히
일치한다(양방향 독립 재도출로 확정). 방법론은 ECS-lite·Game Loop는 충실하나 State
Machine은 사실상 미구현, Event-driven은 카탈로그/버스 부재다.

## 1. 방법론 준수 매트릭스

| 원칙 | 판정 | 비고 |
|---|---|---|
| ECS-lite | ✅ full | Planet=데이터 struct, 시스템 단일책임 분리, GameScene은 월드/호스트(=God-object 아님). |
| Game Loop / Fixed Step | ✅ full | accumulator 고정 스텝(`STEP_MS=1000/60`), 결정적 순서 physics→merge→render, 5스텝 catch-up + spiral guard (`GameScene.ts:139-155`). |
| Layered Rendering | 🟡 partial | 4레이어 고정 z-order + sim→sprite 단방향 미러. 입력 우선순위·ModalLayer·DebugLayer 부재. |
| Acceptance-test | 🟡 partial | Playwright 7케이스가 발사/머지/점수 코어루프 실측. 단 §14 KPI 수치(TTFA/TTFR 등)는 수동 체크박스로만, console-error=0 리스너 없음. |
| Core Principles / Agent-friendly | 🟡 partial | 문서를 따르고 임의 설계로 모순내지 않음. 약점=미실현 구조(FSM·이벤트 카탈로그)+미반영 수치. |
| Data-driven | 🟡 partial | scoring/merge 경제는 SSoT 충실. `INITIAL_RACK` dead code + 랙 재하드코딩(아래 §3-c). |
| Event-driven | 🟠 partial | 이벤트 카탈로그·pub/sub 버스·이벤트 로그 전무. `onChange` 콜백이 `Hud` 직접 갱신(안티패턴). |
| **State Machine** | ❌ **none** | 게임 흐름 상태머신 전무. `aiming` boolean + `cooldownUntil` 타임스탬프 + `merging` 플래그로 대체(플래그 수프). game-over/win 상태 없음(`sunReached`는 stat). |

> [!note] 의도된 scope-out
> game-over·타이틀·일시정지·결과 화면 부재는 [[../20-core-loop/index|코어 루프]]/[[../10-concept/index|컨셉]]이
> 의도적으로 범위에서 제외한 결과이지 누락이 아니다. State Machine 저점은 "단일 Playing
> 상태"라는 설계 의도와 정합하나, 명시적 상태 모델링 자체는 안 됐다.

## 2. 수치 SSoT ↔ 코드 — 전부 일치 ✅

[[../40-balancing/index]] 자식 페이지(planet-stats/combo-scoring/spawn-rack/launch-physics)에
못박힌 값과 `game/src/data/{planets,config}.ts`가 **모두 일치**:

- 9단계 반지름 18·21·24·28·32·37·43·50·58 — `planets.ts` TIERS 동일.
- 9단계 기본점수 —·10·30·70·150·320·700·1500·3200 (수성=0) — 동일.
- 콤보 배율 1.0/1.2/1.5/2.0 + 4번째↑ 상한 — `COMBO.multipliers` + `min(idx,len-1)` 클램프(`ScoreSystem.ts:22`).
- 콤보 윈도우 1200ms · 큐 하위5종 균등20%(상위4종 제외) · 초기 랙 4/3/2/1=10(지구↑ 미배치) — 동일.
- 드래그 제수 120 · V_max 22 px/step · 발사 쿨다운 250ms — 동일.

## 3. 발견된 불일치 — 3건 모두 해소됨 ✅ (2026-06-28)

> 후속 작업으로 전부 수정. data-driven 일원화(`balance.json` 단일 SSoT) + 문서 reconcile.
> 근거: [[../60-implementation/architecture]] (수치 SSoT·no-SQLite). 검증:
> typecheck·build·Playwright 16/16 통과(동작 보존).

### a. 문서 공식 모순 — 발사 파워 하한 → **해소(문서를 코드에 맞춤)**
`power = clamp(dragDist/120, 0.14, 1)` + 데드존 6px를 [[../40-balancing/launch-physics]] 발사
튜닝 표에 **확정 명문화**. `minPower=0.14`는 죽은 발사 방지(손맛) 의도로 코드 채택. 코드는
`balance.json` `launch.deadzonePx`로 데드존도 일원화(`Launcher.ts` 하드코딩 6 제거).

### b. SSoT 미완 — 물리계수 7종 → **해소(문서 역반영)**
`frictionAir·friction·restitution·wallRestitution·mergeMinSpeed·remergeDelayMs·minPower`을
[[../40-balancing/launch-physics]] "물리 계수(현재 구현값)" 표로 기입, Open questions 닫음.
값은 `balance.json` `physics`/`launch`에 단일 존재.

### c. 데이터 주도 누수 — 초기 랙 중복 → **해소(코드 정리)**
`GameScene.buildInitialRack`을 `INITIAL_RACK` 파생(`[...INITIAL_RACK].reverse().map(...)`)으로
교정 — dead code 제거, 산출 `rows` 동일(동작 100% 보존). 랙 구성은 이제 `balance.json` `rack`
한 곳에서 튜닝.

## 후속 산출물

- `game/src/data/balance.json` — 모든 튜너블 상수 단일 SSoT(중복 선언 0). `config.ts`/`planets.ts`는 로더.
- `/balance-tune` 스킬 + `balance-tuner`(model: sonnet) 에이전트 — 데이터 변경 요청 자동화(편집→reconcile→typecheck).

## 관련
- [[../90-methodology/index]] — 감사 기준(7대 원칙).
- [[../40-balancing/index]] — 수치 정본(§2가 검증한 대상).
- [[70-verification/kpi]] — Playwright 검증 결과(코어루프 충족).
