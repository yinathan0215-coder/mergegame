---
id: systems-collision-shape
note_type: system
status: design
domain: systems
updated: 2026-06-28
tags: [systems, collision, physics, planet-pool-merge]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: game/public/assets/planets/"
---

# 행성 충돌 형태 (이미지 알파 종속)

> **준수 기준(방법론):** [[90-methodology/data-driven]] · [[90-methodology/ecs-lite]].

## Summary

각 행성은 **투명 PNG**다. 행성의 충돌 범위는 그 PNG에서 **불투명(alpha) 영역의 외곽 그대로**다.
토성은 띠를 포함한 이미지이므로 **띠까지가 충돌체**가 된다. 화면에 보이는 이미지와 충돌 형태가
1:1로 같다.

## Details (decisions)

- **충돌 외곽 = 알파 실루엣.** 행성 충돌 바디의 외곽선은 PNG의 불투명 픽셀(alpha ≥ 임계) 영역의
  외곽 윤곽과 일치한다. 원형에 가까운 행성은 원에 가깝게, 비원형(토성 띠 등)은 그 형태 그대로.
- **렌더와 충돌은 같은 이미지·같은 스케일.** 충돌 폴리곤은 스프라이트와 동일한 배율
  (`radius*2 / 소스 불투명 지름`)로 스케일해, 표시 크기와 충돌 크기가 일치한다(스프라이트 배율은
  `PlanetFactory`).
- **형태는 데이터로 둔다.** 단계별 충돌 폴리곤(중심 기준 정규화 정점 배열)을 데이터로 두고
  `PhysicsWorld`가 그 데이터로 바디를 만든다. 알파 임계·정점 단순화 허용오차는 튜닝 값.

## 구현 힌트 (에이전트)

- **추출(프리로드 1회):** 각 PNG의 알파 채널을 읽어(오프스크린 canvas `getImageData`, 또는 빌드
  스크립트) **외곽 윤곽(marching squares)** 을 따고, Douglas–Peucker로 단순화한 정점 배열을 만든다.
  표시 배율로 스케일해 사용한다. 추출은 보드 빌드 전에 끝나야 한다(스폰 시 동기 사용).
- **물리 바디:** `Matter.Bodies.fromVertices(x, y, [verts], opts)`. 비볼록(토성 띠)은 **poly-decomp**
  (`Matter.Common.setDecomp(decomp)`)로 볼록 분해한다. 추출 실패 시 원(`Bodies.circle`)으로 폴백.
- **경계·합성 정합:** [[play-area-boundary]] clamp와 [[merge-rules]] 합성 위치가 반지름 기준이므로,
  비원형 바디는 그 자리에 **외접 반지름(circumradius = 최대 정점 거리)** 을 쓴다.

## Relates to

- [[50-art-ux/planet-art]] — 행성 이미지(실루엣) 정본.
- [[play-area-boundary]] · [[merge-rules]] — 충돌 형태가 영향을 주는 경계·합성.
- [[../60-implementation/architecture]] — `PhysicsWorld`(바디)·`PlanetFactory`(스프라이트).
