---
id: impl-plan
note_type: spec
status: design
domain: implementation
updated: 2026-06-28
tags: [plan, phases, execution, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 구현 실행 플랜 (Phase별 빌드 트래커)

> **이 페이지는 `game/`를 채우는 실행 트래커다.** 설계 수준 분해는 [[../task-breakdown]],
> 모듈 경계는 [[../architecture]], 수치는 [[../../40-balancing/index]]. 여기서는 각 Phase의
> **만들 파일 · 핵심 수치 · 수용 기준(검증 연동)** 을 못 박고, 진행을 체크박스로 추적한다.
> 에이전트는 Phase 0→7 **순서대로** 실행하고, 각 Phase 수용 기준을 통과해야 다음으로 넘어간다.

스택: **Vite + TypeScript + PixiJS + Matter.js** ([[../tech-stack]]). 권위=Matter 바디,
렌더=읽기 전용(매 프레임 바디 좌표 → 스프라이트). 수용 기준의 최종 출처는
[[../../70-verification/index|KPI/체크리스트]].

`game/src/` 모듈 구성·단일 책임의 단일 출처는 [[../architecture]](레이어별 모듈 표).

---

## Phase 0 — 스캐폴드 · 9:16 캔버스
- **만든다:** `game/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`,
  `src/main.ts`, `src/GameScene.ts`(부트), `src/config/layout.ts`(보드 9:16 치수).
- **deps:** `pixi.js`, `matter-js`, `@types/matter-js`, `vite`, `typescript`.
- **수치:** 기준 화면비 **9:16**; 보드는 화면 중앙 대부분; 데스크톱/모바일 폭에서 비율 유지.
- **수용:** `npm run dev` → 빈 9:16 스테이지가 뜨고 창 크기에 맞춰 스케일된다.
- [x] 완료

## Phase 1 — 보드 · 충돌 벽
- **만든다:** `src/BoardRenderer.ts`(와인색 외부배경 + 골드/나무 프레임 + 어두운 우주 보드 +
  낮은대비 은하/별 장식), `src/PhysicsWorld.ts`(Matter 엔진 + step + 4면 충돌 벽, **포켓 없음**).
- **수용:** [[../../50-art-ux/index|아트 톤]]대로 보드가 보인다; 테스트 바디가 4면 벽에 반사된다.
- [x] 완료

## Phase 2 — 행성 데이터 · 초기 랙
- **만든다:** `src/data/planets.ts`(11단계 테이블: 순서[[../../10-concept/index]] · 반지름/점수
  [[../../40-balancing/index]] · 색/패턴 [[../../50-art-ux/index]]), `src/PlanetFactory.ts`
  (스프라이트 생성: 두꺼운 외곽선·플랫 2D·크기+패턴 구분), `src/Planet.ts`(entity: 바디+단계+스프라이트),
  초기 랙 배치(GameScene).
- **수치:** 반지름 15·18·21·24·28·32·37·43·50·58·67px; 초기 랙 **소행성4·수성3·화성2·금성1**(중앙 약간 위
  벌집/삼각, 겹침 방지, 첫 발사 즉시 충돌 밀도, 지구↑ 제외).
- **수용:** 시작 시 중앙 초기 랙이 보이고, 11단계가 크기+패턴으로 구분되며, 스프라이트가 바디를 따라간다.
- [x] 완료

## Phase 3 — 발사대 · 큐 · 조준
- **만든다:** `src/QueueSystem.ts`(현재 발사 행성 1칸, 해금 연동 낮은 단계 보충), `src/Launcher.ts`(하단 중앙 고정,
  press-drag 조준, 반투명 조준선=실제 방향, 거리→파워), `src/Hud.ts`(상단 HUD: Score·최고점수·머니·랭킹).
- **수치:** 큐 후보는 `1 … min(unlockedTier - 2, queueCap=5)` 균등 추출, 최대 지구까지; 해왕성↑은 큐 제외(합성으로만); 파워 `clamp(드래그/120,0,1)`.
- **수용:** 발사대 현재 행성 표시; 드래그 시 반대 방향 조준선 + 파워; (발사 연결은 Phase 4).
- [x] 완료

## Phase 4 — 발사 · 물리
- **만든다:** Launcher→PhysicsWorld 발사(원형 바디, `speed = power × Vmax`, 드래그 반대 방향,
  쿨다운), 발사 시 QueueSystem 시프트+보충.
- **수치:** **Vmax 22 px/step**, **쿨다운 250ms**(권장 초기값, 손맛 튜닝). 물리 안 멈춰도 쿨다운 후 발사.
- **수용:** release 시 행성이 드래그 반대 방향으로 발사·벽 반사; 큐가 매 발사 후 정확히 한 칸 갱신.
- [x] 완료

## Phase 5 — 합성
- **만든다:** `src/MergeSystem.ts`(충돌 이벤트 → 동급 판정 → 중간점에 다음 등급 1개 생성, 속도=두 속도
  평균(작으면 충돌 법선 최소속도), **merge lock**(한 tick 1합성), 재합성 지연, **블랙홀=종단**).
- **수용:** 동급 충돌 → 다음 등급 1개가 중간점에 생성되어 충돌 방향으로 이동; 중복 합성 없음;
  태양+태양은 블랙홀로 합성되고 블랙홀+블랙홀은 일반 충돌만([[../../30-systems/merge-rules|합성 규칙]]).
- [x] 완료

## Phase 6 — 점수(충돌 +1 · 머지 등급)
- **만든다:** `src/ScoreSystem.ts`(충돌마다 +1 가산(`scoring.collisionPoint`), 합성 시 생성 등급
  기본 점수 가산), Hud Score 갱신(1단위 오도미터 스크롤).
- **수치:** 충돌 +1; 머지 점수 10·30·70·150·320·700·1500·3200·7000·15000(수성~블랙홀).
- **수용:** 충돌마다 +1, 머지마다 등급 점수, 상단 Score만 표시, 1단위 오도미터 스크롤.
- [x] 완료

## Phase 7 — 검증 · 튜닝 (버티컬 슬라이스 완료)
- **한다:** `npm run dev` 구동 → **Playwright**로 데스크톱(예: 1280×800) + 모바일 뷰포트(예: 390×844)
  에서 실플레이: 초기 랙 표시 → 드래그 발사 → 벽 반사 → 동급 합성 → 점수 증가 캡처. 손맛 튜닝
  (마찰·반발·Vmax)으로 **초반 5발 내 1회 합성** 보장.
- **수용:** [[../../70-verification/index|KPI 8 + 완료 체크리스트 16]] 전부 통과(부정 항목 포함:
  진행트랙·실루엣·포켓·Shake·Change Ball 없음), 두 뷰포트 모두 UI 겹침 없음.
- [x] 완료

---

## 관련
- [[../task-breakdown]] — 소스 §12의 16태스크(설계 수준 Phase)
- [[../architecture]] — 모듈/데이터 모델 · [[../agent-runbook]] — 실행 표지
- [[../../40-balancing/index]] — 모든 수치 SSoT · [[../../70-verification/index]] — 수용 기준
