---
id: research-index
note_type: index
status: design
domain: research
updated: 2026-06-29
tags: [research, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 80 · 리서치 (레퍼런스 & 시장 근거)

**Planet Pool Merge** — Suika식 물리 드롭/발사 머지. 하단 풀(pool) 발사대에서 행성 공을
조준·발사하고, 같은 등급 행성끼리 충돌하면 다음 행성으로 합성한다(11단계 사다리:
소행성→수성→화성→금성→지구→해왕성→천왕성→토성→목성→태양→블랙홀, 블랙홀이 최종) — [[../10-concept/index]].

이 섹션은 그 컨셉·메카닉·밸런싱 결정의 **근거**를 모은다. 이 프로젝트가 중시하는 "시장
데이터 기반 의사결정"을 문서로 보이는 자리. 한 레퍼런스 = 한 페이지.

Planet Pool Merge는 두 장르 계보가 교차한다 — (1) **Suika식 코어 물리 머지**, (2) **하단
발사(launch) 머지**. 아래 두 조사 보고서가 각각의 근거를 고정한다.

## 페이지

- [[drop-merge-research]] — **코어 물리 머지 근거.** Suika / Fruit-Drop 장르 분해: 2D 강체
  물리 엔진 필수성(타일 그리드 불가), `collisionStart` 핸들러 ~20줄 머지 패턴, 검증된
  오픈소스 스택(Matter.js 사실상 전부), 그리고 원작 Suika의 **드롭 후보 문법(낮은 5종 각
  ~20%)**. → Planet Pool Merge의 합성 규칙·물리 손맛·큐 보충 설계의 직접 근거.
- [[reverse-merge-genre]] — **하단 발사 머지 근거.** "launch / 역방향 머지"(중력 드롭 대신
  방향 발사로 같은 등급을 충돌·병합) 장르 분해. Planet Pool Merge의 **하단 고정 발사대 +
  드래그 조준 발사**가 바로 이 launch-merge 계보(상방 발사형)에 해당한다.

## 근거 → 스펙 매핑 (SSoT: 수치/아트는 각 home 1곳에만 정의, 여기선 링크만)

| 이 근거가 뒷받침하는 결정 | 확정 home |
|---|---|
| 11단계 행성 사다리(순서) | [[../10-concept/index]] |
| 합성 규칙·물리 손맛 기준 | [[../30-systems/index]] |
| 행성 수치(반지름 px·기본 점수)·콤보 배율·랜덤 보충 % | [[../40-balancing/index]] |
| 행성 아트(색·패턴) | [[../50-art-ux/index]] |

## 관련
- [[../10-concept/index]] — 이 근거가 뒷받침하는 컨셉/핵심 재미 가설
- [[../40-balancing/index]] — 레퍼런스에서 가져온 수치 감각의 확정값
