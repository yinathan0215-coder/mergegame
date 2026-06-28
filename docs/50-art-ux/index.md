---
id: art-ux-index
note_type: index
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, ux, layout, input]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 50 · 아트 방향 & UX 가이드

> 과제 요구 ④-b — *에이전트가 스스로 판단하기 어려운 영역: 아트 방향, UX 판단*을 못 박는다.
>
> **준수 기준(방법론):** [[../90-methodology/layered-rendering]] (레이어·입력 우선순위·가독성).
>
> 이 폴더는 **Planet Pool Merge** 전용 아트/UX 정본이며, **행성별 ART(색+패턴) 표의 SSoT 홈은
> [[planet-art]]**다. 행성 단계 순서는 [[../10-concept/index]], 반지름 px·점수·드래그/파워/점수
> 숫자는 [[../40-balancing/index]]에 산다(여기서 중복 정의하지 않는다).

> **행성 색·패턴 SSoT → [[planet-art]].** 다른 섹션은 여기를 링크만 한다.

> 상태: `design` — 아트/UX 스펙 확정, 아직 `game/` 미구현.

## 페이지

- [[title-screen]] — **Title(로비) 화면**: 태양계 공전 배경(Pool 리소스 재사용) + 로비 UI(최고/현재 점수·사이드 4버튼·Galaxy/Fantasy 토글·설정) + 버튼 피드백.
- [[layout]] — 화면 비율(9:16) + **상단 HUD 배치**(좌: 머니·나가기 / 중앙: Score·최고점수 / 우: 메뉴·랭킹) + 제외 UI.
- [[screen-structure]] — **보드 내부 레이어**(배경색·아웃라인·교체 가능 배경 이미지·플레이그라운드 단색 띠·발사대·플레이 영역) + **일방향 경계**.
- [[input-ux]] — §8.2 입력 인터랙션(press-drag-release, 반투명 조준선=실제 방향, 반대 방향 발사, 거리→파워) + §13 UX 판단 5개.
- [[art-direction]] — §9 전체 톤(와인/골드/우주/은하/별, 장식 식별 방해 금지) + 행성 아이콘 규칙 + §13 아트 판단 4개.
- [[planet-art]] — §9 행성별 색·패턴 표(9행, **SSoT 홈**) + 패턴 계열 주석.
- [[feedback-effects]] — 머지/점수 **피드백 연출**(스케일 팝·발산 버스트·점수 오도미터·+N 플로팅).

## 관련

- [[../10-concept/index]] — 행성 9단계 순서(SSoT)
- [[../20-core-loop/index]] — 발사/큐 흐름상의 UX 분기
- [[../40-balancing/index]] — 반지름 px·점수·드래그/파워/점수 숫자(SSoT)
- [[../60-implementation/index]] — 렌더/입력 모듈(`Launcher`·`Hud`·`BoardRenderer`·`PlanetFactory`)
- [[../90-methodology/layered-rendering]] — 레이어·입력 우선순위·가독성 표준
