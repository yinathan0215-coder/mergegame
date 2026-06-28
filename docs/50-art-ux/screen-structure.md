---
id: art-ux-screen-structure
note_type: section
status: design
domain: art-ux
updated: 2026-06-28
tags: [art, ux, layout, board, layers, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 화면 레이어 & 보드 형태

> 과제 요구 ④-b — 보드(playground)의 **형태 + 레이어 + 발사대**를 못 박는다.
> HUD/화면 비율은 [[layout]], 색·톤은 [[art-direction]], 행성 색·패턴은 [[planet-art]],
> 충돌/발사 일방향은 [[../30-systems/play-area-boundary]].

세로형(9:16) 게임 영역 안에 playground 전체가 들어가고, `background color`가 화면 전체를 채운다.

## 레이어 (바깥→안)

1. **outline** — 오렌지/골드 프레임. 방패형 보드를 균일 두께로 감싸는 고정 테두리(**시각 요소**).
2. **background color** — outline 안쪽의 단색 띠(와인 최암부보다 한 단계 더 어두운 색).
3. **inner line** — 보드 윤곽을 따라 그려진 가시 선. **이 선이 실제 충돌 경계**다.
4. **background image** — inner line 안쪽 배경 이미지(어두운 우주 + 은하 + 별). 교체 가능(별도 슬롯).

## 보드 형태 — 방패형

inner line(=충돌 경계)의 윤곽은 **방패 모양**이다.

- 위쪽은 **모서리가 둥근 직사각형**(플레이 영역).
- 직사각형 하단 좌·우 모서리는 **둥근 연결부**로 꺾여 **삼각 테이퍼**로 내려간다. 테이퍼는 좌우 변
  사이가 **140°**(기준 각)로 벌어진다.
- 테이퍼는 아래 끝에서 **둥근 호**로 이어지고, 그 중심에 **발사대 원형 공간**이 있다.

## inner line ↔ 발사대 힘 게이지 (연결)

inner line은 보드 하단에서 **발사대 힘 게이지와 하나로 이어진다**. 게이지는 발사대 원 둘레의
**반원형 점(●) 트랙**이며, **미리 그려진 빈 트랙**으로 항상 보인다. 조준 드래그를 당기면 이 트랙이
**왼쪽 끝부터 시계 방향으로 색(빨강)으로 채워지며** 현재 파워와 최대치를 보여준다.

## 발사대 원형 공간

발사대는 보드 하단의 **원형 공간**이다. 발사 행성이 여기에 놓이고, 이 원의 둘레가 게이지 트랙이다.
**이 원형 공간도 충돌 경계**다(다른 행성은 여기에 부딪힌다).

## 구현 메모 (에이전트)

- outline은 시각 프레임(균일 두께). **물리 충돌 벽은 inner line + 발사대 원**으로 만든다(outline로
  만들지 않는다).
- inner line 형태: 둥근 직사각형 + 140° 테이퍼 + 하단 호 + 발사대 원 둘레 게이지 트랙(하나로 이어진 path).
- 게이지는 빈 점 트랙을 항상 그리고, 파워에 따라 왼쪽부터 시계방향으로 채운다(동적).
- 구체 px·각도·점 개수는 레이아웃 config에서 정하되 본 규칙(레이어 순서·inner line 충돌·게이지 연결·
  140° 테이퍼·발사대 원 충돌)을 정본으로 한다.

## 관련

- [[layout]] — 화면 비율·HUD 배치.
- [[input-ux]] — 드래그 파워 입력(게이지가 시각화).
- [[art-direction]] — 와인/골드/우주 색 톤.
- [[../30-systems/play-area-boundary]] — 충돌 경계(inner line + 발사대 원)·발사 일방향.
- [[../30-systems/launcher]] — 부채꼴 120° 발사.
- [[../60-implementation/index]] — `BoardRenderer`·`Launcher`·`PhysicsWorld`.
