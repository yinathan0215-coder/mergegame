---
id: verification-kpi
note_type: checklist
status: design
domain: verification
updated: 2026-06-28
tags: [kpi, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 검증 결과 · KPI

> 섹션: [[70-verification/index|70 · 검증 기준]]. 자매 페이지: [[70-verification/checklist]].

## 검증 결과 (2026-06-28)

`game/` 프로토타입 구현 완료. **Playwright 실플레이 22/22 통과**(desktop 1280×800 + mobile
390×844) — 초기 랙 10, 발사 후 발사대에 새 행성 로드, 동급 충돌 100%
합성 + 충돌 방향 이동, **신규 등급 첫 생성 시 해금 모달·일시정지 후 OK로 해금**([[../30-systems/tier-unlock]]),
**콤보 카운터**(유지 시간 안 연속 머지 누적), 태양 종단, 첫 5발 내 ≥1 합성, 벽 반사(보드 누출 0),
**일방향 경계**(진입 후 선 아래 복귀 0), 실드래그 발사. **방패형 보드**(직사각형+테이퍼+둥근 볼록 끝)·9:16
유지·DOM 컨트롤 0(포켓/Shake/Change Ball 없음). 프로덕션 빌드 OK. 스펙: `game/tests/play.spec.ts`,
실행 트래커 [[../60-implementation/plan/index|plan]].

## KPI (핵심 재미 가설 검증)

§14 기준. 프로토타입 완성 여부는 다음 8개 지표로 판단한다.

- [ ] 1분 안에 플레이어가 조준, 발사, 합성을 이해할 수 있다.
- [ ] 첫 5회 발사 안에 최소 1회 합성이 발생한다.
- [ ] 같은 등급 충돌 시 100% 다음 등급으로 합성된다.
- [ ] 합성 후 새 행성이 충돌 방향으로 움직인다.
- [ ] 발사 후 발사대에 새 발사 행성이 로드된다(낮은 5종 랜덤).
- [ ] 점수는 충돌(+1)과 머지(등급 점수)에 따라 증가한다.
- [ ] 머지 시 생성/발산 연출과 +N 플로팅 점수가 나타난다.
- [ ] 점수는 1단위로 스크롤하며 오른다.
- [ ] 9:16 모바일 화면에서 UI 겹침이 없다.
- [ ] 데스크톱 브라우저와 모바일 크기 뷰포트에서 모두 플레이 가능하다.

관련 설계 근거: 코어 루프 → [[../20-core-loop/index]], 합성 규칙 → [[../30-systems/merge-rules]],
점수·랜덤 보충 수치 → [[../40-balancing/index]], 레이아웃·아트 → [[../50-art-ux/index]].
