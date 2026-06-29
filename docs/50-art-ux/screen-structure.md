---
id: art-ux-screen-structure
note_type: section
status: design
domain: art-ux
updated: 2026-06-29
tags: [art, ux, layout, board, layers, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 화면 레이어 & 보드 형태

> 문서 범위 ④-b — 보드(playground)의 **형태 + 레이어 + 발사대**를 못 박는다.
> HUD/화면 비율은 [[layout]], 색·톤은 [[art-direction]], 행성 색·패턴은 [[planet-art]],
> 충돌/발사 일방향은 [[../30-systems/play-area-boundary]].

세로형(9:16) 게임 영역 안에 playground 전체가 들어가고, `background color`가 화면 전체를 채운다.

## 레이어 (바깥→안)

1. **outline** — 오렌지/골드 프레임. 방패형 보드를 균일 두께로 감싸는 고정 테두리(**시각 요소**).
2. **background color** — outline 안쪽을 채우는 단색 띠(바깥 배경(딥 블루)보다 한 단계 더 어두운 색).
   outline과 inner line **사이의 간격(inset)을 이 색이 채운다** — 둘은 붙지 않고 띠만큼 떨어져 있으며,
   그 간격은 직사각형 변·테이퍼·하단에서 **균일**하다(inner line = outline을 안쪽으로 균일 오프셋한 윤곽).
3. **inner line** — 보드 윤곽을 따라 outline에서 **안쪽으로 일정 간격 들어가** 그려진 **갈색** 가시 선.
   **이 선이 실제 충돌 경계**다.
4. **background image** — inner line 안쪽 배경 이미지. 정적 리소스는 **어두운 은하수/성운 흐름**을
   담당하고, 별·점광·반짝임은 [[galaxy-background]]의 런타임 효과 레이어가 담당한다. 교체 가능(별도 슬롯).

## 보드 형태 — 방패형

inner line(=충돌 경계)의 윤곽은 **방패 모양**이다.

- 위쪽은 **모서리가 둥근 직사각형**(플레이 영역).
- 직사각형 하단 좌·우 모서리는 **크게 둥근 연결부**로 꺾여 **삼각 테이퍼**로 내려간다. 테이퍼는 좌우 변
  사이가 **140°**(기준 각)로 벌어진다. 위 모서리와 이 연결부는 **inset보다 충분히 큰 반경**으로 둥글려,
  inner line(=outline을 안쪽으로 오프셋)이 그 만큼 깎인 뒤에도 **모서리·연결부가 뚜렷이 둥글게** 남는다.
- 테이퍼는 아래 끝에서 **발사대 원 윗호**(원의 위쪽 호)로 이어져 inner line이 닫힌다. 따라서 **발사대
  원은 inner line 바깥**(아래)에 놓여, outline 안쪽 background color 띠 위에 얹힌 모양이 된다.

## inner line ↔ 발사대 힘 게이지 (연결)

inner line은 보드 하단에서 **발사대 원 윗호로 이어진다**(테이퍼 하단이 발사대 원 위쪽에 연결). 힘
게이지는 발사대 원 **아래쪽 반원(약 180°) 점(●) 트랙**으로, **발사대 원과 outline 사이의 inset(띠) 안**
(발사대 원 바깥·outline 안쪽 중간)에 그려 **발사 행성이 가리지 않게** 한다. **미리 그려진 빈 트랙은 밝은
색**으로 항상 보이고, 조준 드래그를 당기면 **왼쪽 끝부터 시계 방향으로 빨강으로 채워지며** 현재 파워와
최대치를 보여준다.

## 발사대 원형 공간

발사대는 보드 하단의 **원형 공간**이며, 발사 행성이 충분히 들어갈 **넉넉한 반지름**을 가진다. 시각적으로
발사대는 **inner line 바깥·outline 안쪽의 background color 띠 위에 얹힌** 원처럼 보인다:

- **채움(배경) 색 = background color**(띠 색과 동일)이라 띠에 자연스럽게 녹아든다.
- **외곽선(rim)은 play 영역(배경 이미지) 쪽과 맞닿는 윗호에만** 그린다(색은 **inner line과 동일한 갈색**).
  outline(골드) 쪽을 향한 아랫호에는 선을 그리지 않는다 — 윗호 rim은 테이퍼 하단의 inner line과 이어진다.

**이 원형 공간도 충돌 경계**다(다른 행성은 여기에 부딪힌다). 발사 행성의 **생성 위치는 이 원 바깥 끝**
(발사 방향으로 원 가장자리 밖)이라 원 안에서 생성·회전하지 않는다 — [[../30-systems/play-area-boundary]].

## 구현 메모 (에이전트)

- outline은 시각 프레임. **물리 충돌 벽은 inner line + 발사대 원**으로 만든다(outline로 만들지 않는다).
- outline과 inner line은 **서로 다른 두 윤곽**이다: inner line은 outline을 안쪽으로 `innerInset`만큼
  **균일 오프셋**한 path(직사각형 변·테이퍼·하단 모두 같은 간격). 그 사이를 background color가 채운다.
- inner line 형태: 둥근 직사각형 + 140° 테이퍼 + **발사대 원 윗호**(테이퍼가 발사대 원 위쪽에 연결,
  발사대 원은 inner line 바깥).
- 발사대 seat 렌더: 채움 = **background color**, rim = **inner line 색(갈색) · play 영역 쪽 윗호에만**.
  게이지 = 발사대 원 **아래 반원(180°)** 점 트랙을 **발사대 원과 outline 사이 inset(띠) 안**에 그린다
  (발사 행성이 가리지 않게 발사대 원 바깥). **빈 트랙 = 밝은 색, 채움 = 빨강**, 왼쪽부터 시계방향.
- 모든 둥근 부위는 **둥근 느낌**으로: 위 모서리는 **참 원호(true arc)**, 테이퍼↔사각형 및 **테이퍼↔발사대
  호 연결부는 라운드 fillet**으로 잇는다(깎인 각이 보이지 않게). 반경은 `cornerR`(위 모서리)·`junctionR`
  (테이퍼-사각형)을 **inset보다 충분히 크게** 잡아 inner line(=offset)도 둥글게 남긴다.
- **곡선은 촘촘히 샘플**한다(곡선 길이에 비례한 분할). 점이 적어 facet(각진)으로 보이지 않게.
- 보드 윤곽(`boardOutline`·`innerOutline`)은 **정적**이므로 **모듈 로드 시 1회 베이크(메모이즈)**한다 —
  매 프레임/매 호출 재생성 금지(렌더·물리·조준 모두 같은 캐시 사용).
- 구체 px·각도·점 개수는 레이아웃 config에서 정하되 본 규칙(레이어 순서·inner line 갈색·outline↔inner
  line 균일 간격·inner line 충돌·발사대 원 inner line 바깥/윗호 rim/배경색 채움·게이지 inset 안 하단 반원·
  밝은 빈 트랙·둥근 모서리/연결부·140° 테이퍼·발사 생성점=원 밖)을 정본으로 한다.
- 보드 내부 galaxy background는 [[galaxy-background]]를 따른다. 정적 이미지는 캐주얼 게임풍 우주 물결
  배경만 담당하고, 작은 별·점광·반짝임은 같은 clip 영역 안에서 루핑 효과로 렌더한다.

## 관련

- [[layout]] — 화면 비율·HUD 배치.
- [[input-ux]] — 드래그 파워 입력(게이지가 시각화).
- [[art-direction]] — 네이비/골드/우주 색 톤.
- [[galaxy-background]] — 공유 은하수 배경 이미지와 런타임 반짝임 효과.
- [[../30-systems/play-area-boundary]] — 충돌 경계(inner line + 발사대 원)·발사 일방향.
- [[../30-systems/launcher]] — 부채꼴 90° 발사.
- [[../60-implementation/index]] — `BoardRenderer`·`Launcher`·`PhysicsWorld`.
