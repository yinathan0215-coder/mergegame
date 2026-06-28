---
id: systems-play-area-boundary
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, boundary, launcher, physics, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: 2026-06-28-planet-pool-merge-design.md"
---

# 충돌 경계 & 발사 일방향 (§화면 구조)

> 과제 요구 ③ — 구현 지시의 입력(충돌 경계 + 발사대 일방향).
>
> **준수 기준(방법론):** [[90-methodology/event-driven]] · [[90-methodology/state-machine]]
> (행성별 `launched` 상태).
>
> 시각 구조는 [[50-art-ux/screen-structure]], 발사 자체는 [[30-systems/launcher]].

## Summary

보드의 **충돌 경계는 inner line**(방패형 보드 윤곽: 둥근 직사각형 + 140° 테이퍼 + **발사대 원 하단 호**)과
**발사대 원형 공간**이다. inner line은 outline에서 안쪽으로 떨어져 그려진 갈색 선이고, 그 하단은 발사대
원에 이어진다. 행성은 inner line과 발사대 원에 부딪혀 보드 안에 머문다.

## Details (decisions)

- **충돌 경계 = inner line.** 좌·우·상 + 테이퍼 양변 + 하단 호가 모두 반사 벽이다. (골드 outline은
  시각 요소이며 충돌에 쓰지 않는다.)
- **발사대 원형 공간도 충돌 경계.** 다른 행성은 이 원에 부딪힌다.
- **생성점 = 발사대 원 바깥.** 발사 행성은 발사대 원 **중심이 아니라 바깥 끝**(발사 방향으로 원 가장자리
  밖, 중심거리 = 원반경 + 행성반경)에서 생성된다. 원 안에서 생성돼 갇혀 도는 현상을 **원천 차단**한다.
- **발사 일방향(발사대 원 예외):** 갓 발사된 행성은 발사대 원과 충돌하지 않고 **밖으로 빠져나간다**.
  완전히 빠져나오면 그 행성에게도 발사대 원이 **고체**가 되어 **재진입하지 못한다**. 이 *예외*는
  **발사대 원에만** 적용한다.
- **절대 영역(Absolute containment).** 행성은 어떤 속도에서도 inner line 안에 머문다 — 빠른 공의 벽
  관통을 막기 위해 사각 플레이 영역에는 아래 clamp-and-reflect를 함께 둔다.

## 절대 영역 강제 (Boundary clamp)

행성은 **매 고정 물리 서브스텝마다** 사각 플레이 영역 안으로 위치를 보정(clamp)하고, 경계를 향하던
속도 성분을 **반사**(× `wallRestitution`)한다. 테이퍼·하단 호·발사대 원은 충돌 벽이 처리한다.

```
매 서브스텝, 행성마다 (r=반지름, e=wallRestitution):
  x < PLAY.left+r  → x=left+r,  vx<0이면 vx=-vx·e
  x > PLAY.right-r → x=right-r, vx>0이면 vx=-vx·e
  y < PLAY.top+r   → y=top+r,   vy<0이면 vy=-vy·e
```

## 구현 힌트 (에이전트)

- inner line·테이퍼·하단 호·발사대 원을 정적 충돌 바디로 만든다. **분리 선 벽은 두지 않는다.**
- **발사 생성 위치**: 발사대 중심에서 발사 방향으로 `발사대반경 + 행성반경`만큼 떨어진 점(원 밖)에서
  행성을 생성한다 — 발사대 원 내부 생성/회전 방지.
- **발사 일방향**은 **충돌 필터(category/mask)**로: 발사대 원에 전용 category를 주고, 갓 발사된
  행성 mask에서 그 category를 **빼 둔다**(원을 빠져나감). 행성 중심이 발사대 원 밖(중심거리 > 원반경 +
  행성반경)으로 나가면 mask에 category를 **다시 넣어** 재진입을 막는다.
- 좌·우·상 사각 경계는 clamp-and-reflect가 정본. 수치는 `balance.json`.

## Relates to

- [[30-systems/launcher]] — 발사대 원에서 부채꼴 120°로 발사.
- [[30-systems/merge-rules]] — 보드 안 합성.
- [[50-art-ux/screen-structure]] — inner line·발사대 원·게이지 시각 구조.
- [[70-verification/index]] — 충돌 경계·일방향 검증.
