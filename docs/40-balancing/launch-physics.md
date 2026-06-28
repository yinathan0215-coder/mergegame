---
id: balancing-launch-physics
note_type: section
status: design
domain: balancing
updated: 2026-06-28
tags: [balancing, planet-pool-merge, launch, physics]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 발사 튜닝 & 물리 휴리스틱

## 발사 튜닝 (`raw: §5.2`)

발사대는 보드 하단 중앙 고정. 누른 뒤 뒤로 당겨 조준, 손을 놓으면 드래그 반대 방향으로
발사.

| 파라미터 | 값 | 근거 / 비고 |
|---|---|---|
| 드래그 데드존 | **6 px** (`deadzonePx`) | 이 거리 이하 드래그는 발사하지 않는다(오발 방지) |
| 드래그 거리 → 파워 정규화 | `power = clamp(dragDist / 110, 0.14, 1)` | 0~110px→0~1(`dragMax=110`), 하한 `minPower=0.14`(약발 방지·손맛) |
| 발사 속도 | `speed = power × V_max` | 파워에 비례 |
| 최대 발사 속도 `V_max` | **30 px/step** (Matter.js 속도, 60fps 기준) | 강한 발사감. **상한** — 이 값을 넘기지 않는다. 플레이 영역 잔류는 [[../30-systems/play-area-boundary]] 절대 영역이 보장한다 |
| 발사 쿨다운 | **250ms** | "짧은 쿨다운"(`raw: §5.2`). 보드 물리가 멈추지 않아도 쿨다운 경과 후 다음 발사 허용 |

- 발사 방향 = 드래그 벡터의 반대 방향. 조준선은 실제 발사 방향과 일치(`raw: §8.2`).
- **하한 `0.14`의 뜻:** 데드존(6px) 직후의 초미세 드래그에도 손을 떼면 항상 쓸 만한 샷이 나간다
  (§13 "손맛 우선").
- **코드 SSoT:** 위 값들은 `game/src/data/balance.json`(`launch`)에 단일 출처로 존재 →
  [[../60-implementation/architecture]] 데이터 모델 참조.

## 물리 / 밸런싱 휴리스틱 (`raw: §13`)

> **핵심 원칙:** 정확한 물리 시뮬레이션이 아니라 **손맛**이 우선이다. 아래는 증상 →
> 조치 규칙. 구체 px·계수는 이 규칙으로 반복 튜닝해 확정한다.

| 증상 | 조치 |
|---|---|
| 공이 너무 오래 안 멈추고 계속 굴러감 | 마찰(`friction` / `frictionAir`)을 **높인다** |
| 공이 너무 빨리 죽음(금방 멈춤) | 반발(`restitution`)과 **최대 발사 속도 `V_max`** 를 **높인다** |
| 합성 후 새 행성이 제자리에서 멈춤 | 합성 결과에 **최소 속도**를 부여한다(충돌 법선 방향, 머지 규칙은 [[../30-systems/index]] 정본) |

**달성 목표(검증 연동):**

- **초반 5발 이내 최소 1회 합성**이 자연스럽게 발생해야 한다. 미발생 시 [[spawn-rack]] 초기 랙
  밀도를 높이거나 위 발사 파워 범위를 조정한다.
- 같은 등급 충돌 시 100% 다음 등급으로 합성(규칙은 systems, 검증은 verification).

→ KPI/체크리스트 연동: [[../70-verification/index]].

## 물리 계수 (현재 구현값)

> `game/src/data/balance.json`(`physics`)에 둔 단일 출처 값. §13 손맛 휴리스틱으로 튜닝하며,
> **변경 시 이 표와 JSON을 함께** 갱신한다(중복 선언 금지 — 코드는 JSON만 로드).
>
> 손맛 = **가볍고 경쾌함**: 낮은 공기 저항으로 잘 미끄러지고, 높은 반발로 경쾌하게 튕긴다.

| 파라미터 | 값 | 의미 |
|---|---|---|
| `density` | 0.0008 | 밀도(질량) — 가볍게 (Matter 기본 0.001 미만) |
| `frictionAir` | 0.006 | 공기 저항 — 낮아 가볍게 미끄러진다 |
| `friction` | 0.0 | 표면 마찰 0 (경쾌) |
| `restitution` | 0.88 | 행성 간 반발 — 높아 경쾌한 튕김 |
| `wallRestitution` | 0.85 | 벽 반발 |
| `mergeMinSpeed` | 3.4 px/step | 합성 결과 최소 속도(지배 운동량이 작을 때 충돌 법선 방향 floor) |
| `remergeDelayMs` | 80 ms | 합성 직후 재합성 방지 지연 |
| `minPower` | 0.14 | 발사 파워 하한(위 발사 튜닝 표) |
| `deadzonePx` | 6 px | 드래그 데드존(위 발사 튜닝 표) |

## 튜닝

- 위 값은 `game/src/data/balance.json`(`launch`·`physics`)의 단일 출처다. 손맛 튜닝은
  [[balance-tune]] 스킬/`balance-tuner` 에이전트로 수행하며 JSON과 본 표를 함께 갱신한다.

## 관련

- [[index]] — 40 · 밸런싱 수치 카탈로그
- [[spawn-rack]] — 초반 합성 미발생 시 함께 조정하는 초기 랙 밀도/큐
- [[combo-scoring]] — 점수 수치(충돌 +1·머지 등급 점수)
- [[../30-systems/merge-rules]] — 합성 결과 속도(지배 운동량) 규칙
- [[../30-systems/index]] — 발사(Launcher)·합성(MergeSystem) 시스템 규칙
- [[../70-verification/index]] — 이 튜닝이 만족시켜야 할 KPI/체크리스트
