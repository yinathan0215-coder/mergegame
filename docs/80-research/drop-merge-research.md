---
id: research-drop-merge
note_type: research
status: design
domain: research
updated: 2026-06-28
tags: [research, benchmark, drop-merge, fruit-drop, suika]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
  - "raw: https://en.wikipedia.org/wiki/Suika_Game"
  - "raw: https://github.com/moonfloof/suika-game"
  - "raw: https://github.com/TomboFry/suika-game"
  - "raw: https://github.com/sgbj/suika-clone"
  - "raw: https://github.com/JhrJianRan/suika-melon"
  - "raw: https://github.com/Coteh/suika-clone"
  - "raw: https://github.com/andrewn9/tsuika"
  - "raw: https://emanueleferonato.com/2024/01/26/build-a-html5-game-like-watermelon-game-using-phaser-and-box2d-powered-by-planck-js-step-1-the-basic-game-mechanics/"
  - "raw: https://playgama.com/blog/general/enhance-game-experience-with-matter-js-physics-engine/"
  - "raw: https://suikagame.fandom.com/wiki/List_of_fruits"
---

# Drop Merge (Fruit Drop / Suika) — 장르 조사 보고서

> **이 보고서의 지위 & 범위.** 게임을 만들기 전 **조사 보고서**다. 사실·옵션·레퍼런스만 담는다.
> **스펙(컨셉/코어루프/시스템/밸런싱 값/엔진 결정/구현 지시)은 여기서 정하지 않는다** — 그건 이후
> 단계에서 별도 작성. 본 보고서의 미결 결정은 §11에 "다음 단계로 넘기는 결정"으로만 표기한다.
>
> **방법:** 5각도 병렬 웹검색 → 18개 소스 페치 → 80개 주장 추출 → 25개 적대 검증. **검증 한계(중요):**
> 검증 투표 다수가 API rate-limit으로 **기권(abstain)** 처리됨 → 표결상 "killed"여도 **거짓이 아니라
> 미검증**인 항목이 많다. 아래는 (a) 독립 검증 통과 = ✅, (b) 관측됐으나 이번 패스 미검증 = ⚠️ 로 구분.

## 1. 한 줄 요약

**Drop Merge = "수박게임(Suika) / Fruit Drop" 류 — 물리 기반 드롭-머지 퍼즐.** 같은 과일을 떨어뜨려
충돌 시 다음 단계 과일로 합치고, 좁은 통 안에서 연쇄 머지로 점수를 최대화하며, 과일이 상단 라인을
넘으면 게임오버. **타일 그리드가 아니라 2D 강체 물리 엔진(레퍼런스 전부 사실상 Matter.js)** 을
요구한다. 머지 자체는 충돌 핸들러 ~20줄. 검증된 오픈소스가 풍부해 에이전트 구현 적합도가 높다.

## 2. 코어 루프 (✅ high)

> drop → (같은 과일 충돌) merge → 다음 tier 생성 → 통 관리 → 연쇄로 점수 → 상단 초과 시 game over.

- 원문(suika-melon README): *"a physics-based puzzle game where players combine fruits of the same
  type to create larger ones... highest score possible by merging fruits strategically while managing
  the limited space in the container."*
- Wikipedia가 드롭 + 게임오버(과일이 상단 라인 초과 시 종료)를 독립 확증.
- 출처: Wikipedia / moonfloof / suika-melon (3소스 일치, 표결 3-0·2-0).

## 3. 물리 요구사항 (✅ high) — 왜 그리드가 아닌가

- 떨어진 과일은 **충돌·구르기·중력**의 영향을 받고, **두 과일 머지 시의 압력이 다른 과일을 통 밖으로
  튕겨내** 게임오버를 유발할 수 있다. → Tetris식 격자 로직으로는 구현 불가.
- Wikipedia: *"unlike in games such as Tetris, the fruits are affected by physics... the pressure
  released by two fruits merging is enough to send a fruit out of the box and end the game."*
- 조사된 **모든** 오픈소스 클론이 손수 짠 수학이 아니라 **2D 강체 물리 엔진**을 사용. 그리드 기반 구현 0건.
- 표결 3-0·2-0.

## 4. 머지 메커닉 구현 패턴 (✅ high)

레퍼런스 코드가 거의 동일한 패턴을 보인다 — **물리 엔진의 `collisionStart` 핸들러 ~20줄**:

```
충돌한 두 바디 A,B에 대해:
  if (A.tier !== B.tier) continue;          // 같은 종류만 머지
  if (A.popped || B.popped) continue;       // 중복 머지 방지
  remove(A, B);
  spawn(tier = A.tier + 1) at midpoint(A,B); // 또는 B.position
  score += f(tier);                          // 예: (tier+1)*2  (레퍼런스마다 상이)
  if (collidedAboveLoseLine) gameOver();     // lose line 위에서 충돌하면 종료
// 최상위 tier 과일끼리는 더 머지하지 않음(엣지 케이스)
```

- moonfloof `index.js`: `loseHeight=84`; `if(bodyA.sizeIndex!==bodyB.sizeIndex) continue;`
  `newSize=sizeIndex+1`; `Composite.remove([bodyA,bodyB])`; midpoint 스폰; `if(aY<loseHeight||bY<loseHeight) loseGame()`.
- sgbj `src/main.ts`(전체 313줄): 같은 `name`이면 `score += (fruitIndex+1)*2`, 둘 제거, `fruits[i+1]` 스폰.
- 표결 3-0·3-0. **단** lose 판정 기준(원 하단 가장자리 vs 중심), 최상위 wrap 등 엣지 케이스는 레퍼런스별 상이.

## 5. 오픈소스 레퍼런스 (구현 스택)

| repo | 스택 | 빌드 | 렌더 | 물리 | 모바일 | 검증 |
|---|---|---|---|---|---|---|
| **moonfloof/suika-game** | plain JS + matter.js | 없음(index.html→matter.js+index.js) | matter.js 내장 Render(Canvas 스프라이트) | Matter.js | 마우스 이벤트 | ✅ |
| **sgbj/suika-clone** | Phaser 3(^3.70) + TS + Vite | Vite | Phaser | Phaser 내장 Matter.js | — | ✅ |
| **JhrJianRan/suika-melon** | Next.js 14 + TS | Next | React/Canvas | matter-js@0.19 + zustand | — | ✅ |
| **TomboFry/suika-game** | plain JS + matter.js | 없음 | Canvas(matter Render) | Matter.js | MouseConstraint(터치도 캡처 *주장*) | ⚠️ 미검증 |
| **Coteh/suika-clone** | Phaser 3 + TS + Webpack | Webpack | Phaser | Phaser-Matter | **460×800 포트레이트, Scale.FIT+CENTER_BOTH, 멀티터치, PWA**(MIT *주장*) | ⚠️ 미검증 |
| **andrewn9/tsuika** | **Pixi.js + Matter.js** | — | Pixi | Matter.js | — | ⚠️ 미검증 |
| emanueleferonato (튜토리얼) | Phaser + **Planck.js(Box2D)** | — | Phaser | Planck.js | — | ⚠️ 미검증 |

- 공통점: **물리는 사실상 전부 Matter.js**(Planck.js는 대안 1건). 렌더만 Canvas/Phaser/Pixi로 갈림.
- ⚠️ 행은 **rate-limit으로 이번 패스 독립 검증 미완** — 거짓이 아니라 "관측됨, 미확정". 채택 전 직접 확인 필요.
- **라이선스:** Coteh만 MIT를 언급(미검증). 나머지는 미확인 → **코드 차용 전 라이선스 확인 필수**.

## 6. 렌더러 옵션 (Matter.js는 렌더러와 분리, ✅ medium)

- Matter.js는 **물리만** 담당, 렌더와 디커플. 표준 패턴: 매 프레임 `Engine.update()` 후 각 바디의
  `position/rotation`을 스프라이트(Pixi 등)에 복사.
- 관측된 선택지(과제가 허용하는 pixi/three/Canvas와 정합):
  1. **Matter.js 내장 Render → Canvas** — 가장 단순/빠름, 디버그풍 비주얼(moonfloof/TomboFry).
  2. **Pixi.js + Matter.js** — "게임다운" 비주얼에 1급, 디커플 복사 패턴(andrewn9/tsuika, 공식 RenderPixi).
  3. **Phaser 3 올인원** — 렌더+입력+씬+Matter 내장, 모바일 스케일 편의(sgbj/Coteh).
  4. (대안) **Planck.js(Box2D)** + 임의 렌더 — 물리 엔진만 교체.
- three.js는 2D 드롭-머지에 부적합(3D). 출처의 "three.js seamless"는 근거 약함.
- 표결: 분리 사실 3-0(공식 docs 교차확증). 단 1차 인용이 블로그라 medium.

## 7. 모바일 우선 — ⚠️ 근거 약함, GDD에서 직접 규정 필요

- 사용자가 **모바일 중심 + 게임형 렌더**를 강조했으나, 모바일-퍼스트(터치/포트레이트) 처리의 확정 소스가 약하다.
- moonfloof는 matter.js `Mouse/MouseConstraint`(**마우스 이벤트**)만 사용 — "이게 터치를 자동 처리한다"는
  주장은 **반박됨(1-2)**. 즉 마우스 핸들러가 모바일 터치를 공짜로 주지 않는다.
- 가장 강한 모바일 증거(Coteh: 460×800 포트레이트·FIT·멀티터치·PWA)는 **1표 검증**에 그쳐 "미확정 단서".
- **시사점(보고용):** 모바일 대응은 레퍼런스에 의존하지 말고 **GDD가 직접 명시**해야 함 — `touchstart/touchmove`
  전용 핸들러, `viewport`(device-width, user-scalable=no), 포트레이트 고정 + FIT/aspect 스케일 정책.
  → 이건 다음 스펙 단계의 과제(여기선 결정하지 않음).

## 8. 밸런싱 레퍼런스 데이터 (원작 Suika, 참고용)

- 원작 Suika는 **약 11단계 과일 사다리**(작→큰: 체리→딸기→포도→…→멜론→수박)로, **tier가 오를수록 반경↑·점수↑**.
  점수는 대체로 **삼각수(누적 증가)** 곡선. 정확한 과일 목록·반경·점수표는 출처
  [List_of_fruits](https://suikagame.fandom.com/wiki/List_of_fruits) 등에 정리돼 있음.
- ⚠️ **구체 수치는 레퍼런스별 로컬 상수**다 (예: world 640×960, `loseHeight=84`, score `(tier+1)*2`,
  restitution/마찰, 다음-과일 미리보기 큐). **보편 상수가 아니므로** 우리 플레이필드 기준으로 **재산출** 필요.
  → 본 보고서는 수치를 **확정하지 않는다**(밸런싱 스펙 단계의 일).

## 8b. Suika 드롭 후보 문법 (원작 Suika, 참고용)

원작 Suika의 **드롭(스폰) 후보 제한** 규칙 — Planet Pool Merge 큐 보충 설계의 직접 근거.

- Suika Game은 **낮은 일부 과일만** 드롭 후보로 사용한다(상위 과일은 직접 드롭되지 않고
  머지로만 등장).
- 공개 공략/위키 설명 기준, 드롭 후보는 **낮은 5종**이며 각 후보가 **약 20% 균등 확률**로
  등장한다는 설명이 일관적이다.
- ⚠️ 이 "5종/20%" 수치는 공개 공략·위키의 통설이며 버전·집계마다 차이가 있을 수 있다 —
  보편 상수가 아니라 **레퍼런스 관측**이다.
- Planet Pool Merge는 이 원형을 채택한다: 낮은 5종 균등 추첨. **확정 후보군·확률은
  [[../40-balancing/index]] 1곳에 정의**(SSoT — 여기서 중복하지 않음).

참고 링크:
- https://toucharcade.com/2024/03/29/suika-game-tips-and-tricks-guide-watermelon-mobile/
- https://ja.wikipedia.org/wiki/%E3%82%B9%E3%82%A4%E3%82%AB%E3%82%B2%E3%83%BC%E3%83%A0
- https://www.tenkaichi-hanseikai.com/entry/2023/09/19/000009
- https://gamerch.com/suikagame/800493
- https://kibi-tan.com/suikagame-book/

## 9. 핵심 재미(가설 후보, 관측만)

레퍼런스/장르 통설에서 반복 관측된 재미 요소(컨셉 가설은 스펙에서 확정):
- **합치는 손맛 + 숫자 성장**, **"한 번 더"** 의 짧은 세션, **연쇄(콤보)** 시 큰 보상의 도파민,
  **물리의 의외성**(굴러서 우연히 머지)으로 인한 변주, **점수 경쟁/자기 기록 갱신**.

## 10. 출처 (품질)

- primary(코드): moonfloof, TomboFry, sgbj, JhrJianRan/suika-melon, Coteh, andrewn9/tsuika (GitHub)
- secondary: Wikipedia *Suika Game*
- design/balancing: suikagame.fandom `List_of_fruits`, suikagame.com points-list
- blog(교차확증용): playgama(matter.js 렌더 통합), emanueleferonato(Planck.js), daily.dev(물리엔진 비교), Medium(Vite+matter)
- 통계: 18 소스 페치 · 80 주장 · 25 검증(9 confirmed / 16 미검증·기권 다수)

## 11. 다음 단계로 넘기는 결정 (여기서 결정하지 않음)

1. **렌더러 최종 선택** — 내장 Canvas / Pixi+Matter / Phaser 올인원 / Planck 대안 중. (모바일 성능 + "게임형 렌더" 동시 만족)
2. **모바일 입력·스케일 명세** — touch 핸들러 / viewport / 포트레이트 FIT.
3. **밸런싱 값** — 과일 tier 수·반경·점수 곡선·lose line·스폰 큐·물리 계수(우리 플레이필드 기준 재산출).
4. **레퍼런스 라이선스 확인** — 코드 차용/참고 전.
5. ⚠️ 항목 재검증 — rate-limit으로 미완된 단서들(특히 모바일·Pixi 조합) 직접 확인.

## 관련
- [[index|80-research 색인]]
