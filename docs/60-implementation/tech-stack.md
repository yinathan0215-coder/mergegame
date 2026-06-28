---
id: impl-tech-stack
note_type: spec
status: design
domain: implementation
updated: 2026-06-28
tags: [stack, pixijs, matter, vite]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 기술 스택 (§10)

> **결정됨.** `Planet Pool Merge`는 **2D 물리 머지 퍼즐**이므로 2D 렌더러 + 2D 물리
> 엔진 조합으로 고정한다. 채택 근거 ADR: [[decisions/2026-06-28-stack-pixijs-matter]].

## 결정

| 영역 | 채택 | 비고 |
|---|---|---|
| 빌드 | **Vite** | 정적 산출물, 즉시 `game/`에서 실행 |
| 언어 | **TypeScript** | 행성 데이터·상태·점수·합성 규칙의 타입 안정성 |
| 렌더 | **PixiJS** (2D WebGL) | 행성 그래픽·UI·조준선·배경 |
| 물리 | **Matter.js** (2D 강체) | 원형 바디·벽 충돌·반발·충돌 이벤트 |

## 역할 분담

물리 규칙과 렌더 규칙을 **한 파일에 섞지 않는다**(모듈 경계는 [[architecture]]).

- **PixiJS** — 렌더링, UI, 행성 그래픽, 조준선, 배경 장식. 매 프레임 Matter 바디의
  위치/각도를 읽어 스프라이트에 반영(시뮬레이션 → 렌더 단방향).
- **Matter.js** — 원형 행성 바디, 보드 경계 충돌 벽, 반발(restitution), 마찰,
  속도, 충돌 이벤트. 충돌 이벤트가 합성 판정의 입력이 된다([[../30-systems/index|합성 규칙]]).
- **TypeScript** — 행성 단계 데이터, 게임 상태, 점수 계산, 합성 규칙을 타입으로
  고정. 움직이는 수치는 코드에 박지 않고 데이터 테이블로 둔다([[../40-balancing/index|밸런싱]]).

## Three.js 미사용 (근거)

이 게임은 세로 2D 보드 위의 원형 바디 충돌·합성이 전부다. 3D 엔진(Three.js)은
**범위 대비 과하다** — 카메라/조명/메시 비용 없이 PixiJS의 플랫 2D 아이콘만으로
[[../50-art-ux/index|아트 방향]]을 충족한다. 전체 비교는 ADR 참조.

## 제약

- 산출물은 `game/`에서 **정적 실행** 가능해야 한다(브라우저로 열기 / 간단 서브).
- 외부 네트워크 의존 최소화 — 오프라인에서도 Core Loop 플레이 가능.
- **단일 파일 배포본**: `npm run build:single`은 일반 빌드 산출물(JS 번들 + 행성/UI/배경 PNG)을
  전부 base64로 인라인해 **자체완결 `dist/galaxy-pinball.html` 한 개**를 만든다. 이 파일은
  서버 없이 `file://`(더블클릭)로 바로 플레이된다. 일반 `npm run build`는 멀티파일 `dist/`를
  내며 `npm run preview`·로컬 서브용으로 둔다.

## 관련

- [[architecture]] — 9 모듈 경계 / 데이터 모델
- [[task-breakdown]] — Phase 순 구현
- [[decisions/2026-06-28-stack-pixijs-matter]] — 채택 ADR
- [[../90-methodology/layered-rendering]] — 시뮬/렌더 분리 표준
