---
id: balancing-spawn-rack
note_type: section
status: design
domain: balancing
updated: 2026-06-28
tags: [balancing, planet-pool-merge, queue, rack]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 발사 행성 랜덤 & 초기 랙 구성

## 발사 행성 랜덤 (`raw: §5.3`) — 해금 연동

발사하면 새 행성이 발사대에 로드된다. 후보는 **해금 단계에 연동**된다(메카닉 [[../30-systems/tier-unlock]]).

- **후보 범위:** 단계 `1 … min(unlockedTier − 2, queueCap)`, **균등 추출**.
- **`progression`(수치 SSoT):** `unlockStart` = **5**(지구), `queueBelow` = **2**, `queueCap` = **5**(지구).
- **시작 시:** `unlockedTier`=5 → 후보 = **소행성·수성·화성 3종**(균등 1/3). 해금이 오르면 후보가
  늘되 **지구(5)를 넘지 않는다**(해왕성↑은 큐에 안 들어오고 합성으로만 등장).

## 초기 랙 구성 (`raw: §5.1`)

빈 보드로 시작하지 않는다. 보드 중앙보다 약간 위에 포켓볼 랙처럼 초기 행성 풀을 배치.

| 행성 | 개수 |
|---|---|
| 소행성 | 4 |
| 수성 | 3 |
| 화성 | 2 |
| 금성 | 1 |
| **합계** | **10** |

- **지구 이상은 초기 배치에 넣지 않는다.**
- **배치 = 역삼각형(▽):** 위가 넓고(소행성 4개) 아래로 갈수록 좁아져(금성 1개) 아래를 향하는 삼각형.
  행성끼리 겹치지 않는 최소 간격, 첫 발사로 바로 충돌이 일어날 만큼 밀도 있게(`raw: §5.1`).

## 관련

- [[index]] — 40 · 밸런싱 수치 카탈로그
- [[launch-physics]] — 초기 랙 밀도/발사 파워를 함께 조정하는 물리 휴리스틱
- [[../30-systems/index]] — 발사 행성 선택(QueueSystem)·초기 랙 배치 시스템 규칙
