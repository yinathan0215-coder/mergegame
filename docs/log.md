---
id: log
note_type: log
status: active
domain: meta
updated: 2026-06-28
---

# Vault log (mergegame 기획문서)

Append-only. `## [YYYY-MM-DD] <auto|manual> | <change>` + `why:` line.

---

## [2026-06-28] manual | Title 태양계: 실제 거리 순서(수성=moon)·살짝 눕힘·세로 꽉 채움(모바일)
why: 사용자 지시 — Title 태양계 배경을 (1) **실제 태양계 거리 순서**로 배치(안쪽→바깥: 수성·금성·
지구·화성·목성·토성·천왕성·해왕성 → 게임 tier [1,3,4,2,8,7,6,5]), **수성 자리에는 moon 스프라이트**(1단계).
(2) 궤도를 **살짝 눕힌 타원**으로(ECC 0.82→0.7). (3) 태양계를 **모바일 세로 화면 상하를 꽉 채우도록 확대**
— 중앙 cy=화면 중앙(DESIGN.h/2), 바깥 궤도 ryMax=DESIGN.h×0.56(넘쳐도 됨), 태양/행성 스케일 확대(0.7→1.2,
0.6→0.9). [[50-art-ux/title-screen]] §1 정본화. 구현: `game/src/TitleScreen.ts`(buildOrbitBackground order/
ryMax 비례·update cy=DESIGN.h/2). typecheck OK. (코드는 동시 진행 세션 untracked 파일이라 본 커밋은 docs만.)
why: 사용자 지시 — Title(홈) 배경 태양계를 (1) **행성 8종(수성~목성, 1~8단계) 전부** 공전하도록
(기존 4종에서 확장), (2) 궤도를 **원형에 가까운 낮은 이심률**(ry=rx×0.82)로, (3) **태양도 행성과
같은 y-깊이 정렬**에 포함(orbitLayer.sortableChildren + zIndex=y, 태양 zIndex=cy)해 앞/뒤 가림이
적용되도록 정정. [[50-art-ux/title-screen]] §1 정본화. 구현: `game/src/TitleScreen.ts`
(buildOrbitBackground 8궤도 생성·sortableChildren, update에서 zIndex=y). typecheck OK.

## [2026-06-28] manual | 보드 윤곽 라운드 강화(참 원호·fillet)·촘촘 샘플·1회 베이크
why: 보드 라운드/성능 4건. (1) **상단 모서리 더 둥글게**(cornerR 48→64). (2) **테이퍼↔발사대 호 연결부도
라운드**(FILLET=14 fillet quad) — 깎이던 각 제거. (3) **곡선 촘촘 샘플**(길이비례 분할 ~3.5px) — facet
(각진) 느낌 제거; 위 모서리는 quad 대신 **참 원호(true arc)**. (4) **성능: 보드 윤곽은 정적이므로 1회
베이크(memoize)** — `boardOutline`/`innerOutline`이 첫 호출에 계산 후 캐시(렌더·물리·조준 공유, 매 프레임
재생성 아님). config: `shieldPath`를 fillet/true-arc로 재작성·하단 블록 인덱스 반환, `innerOutline`은 offset
후 하단을 **fillet로 둥근 발사대 윗호 캡**으로 치환. docs: [[50-art-ux/screen-structure]] 구현 메모 정본화.
검증: typecheck·vite build OK · Playwright **18/18** · headed(PLAY→보드) 스크린샷으로 라운드/매끄러움 확인.

## [2026-06-28] manual | 게이지 inset 이동·밝은 빈 트랙, 모서리/연결부 더 둥글게
why: 발사대 디테일 3건 정정. (1) **힘 게이지를 발사대 원과 outline 사이 inset(띠) 안으로 이동**
(gauge.r 58→46, 발사대 원 r38·골드 호 r54 사이) — 발사 행성(중심, 최대 r32)이 가리지 않는 위치. (2)
**게이지 빈 트랙 색을 밝게**(gaugeEmpty #221d29→#efe4cf), 채움은 빨강 유지. (3) **모서리·테이퍼 연결부를
더 둥글게** — inner line은 outline의 내향 오프셋이라, outline 반경을 inset(16)보다 충분히 키워야 inner
line이 둥글게 남는다: `cornerR`(위 모서리) 신설 **48**, `junctionR`(테이퍼 연결) 20→36(오프셋 후 상단
모서리 inner≈32). config: `shieldPath` topR=`L.cornerR`. docs: [[50-art-ux/screen-structure]] 정본화
(게이지 inset·밝은 빈 트랙·둥근 연결부). 검증: typecheck·vite build OK · Playwright **18/18** · headed 확인.

## [2026-06-28] manual | 배경 와인→딥 블루(우주 톤)
why: 사용자 지시 — 바깥 배경의 와인색을 우주 게임에 어울리는 짙은 푸른 톤으로. `outerBg` #46101f→#15203d
(딥 네이비), `pgBand` #16060d→#0b1124(더 어두운 블루, 띠+발사대 채움색). 골드 프레임 대비 유지.
[[50-art-ux/art-direction]] 전체 톤 정본화(바깥 배경=딥 블루). 검증: vite build OK · headed 스크린샷 확인.

## [2026-06-28] manual | Galaxy background 정적 이미지/런타임 반짝임 분리
why: 사용자 지시 — 배경 이미지는 행성 스프라이트와 맞는 **캐주얼 게임풍 우주/은하 물결 배경**만 담당하고, 십자 별표·점·반짝임은 배경 효과로 넣어 루핑해야 한다. 신규 [[50-art-ux/galaxy-background]]에 정적 이미지 레이어와 deterministic 런타임 반짝임 레이어의 책임을 분리해 정본화하고, Pool In-Game 보드 내부([[50-art-ux/screen-structure]])와 Title([[50-art-ux/title-screen]])이 같은 Galaxy background 시스템을 쓰도록 연결했다. 생성/편집 프롬프트와 원본/후처리/최종 경로는 `game/public/assets/prompts/` 아래에 기록한다.

## [2026-06-28] manual | 발사대=inner line 바깥(띠 위), 균일 간격, 게이지 하단 반원
why: 레퍼런스 대조로 보드 하단 6건 추가 정정. (1) **outline↔inner line 간격 균일화** — 테이퍼 구간 간격이
사각형보다 좁던 문제를, inner line을 outline의 **균일 내향 오프셋**(`offsetInward`, 와인딩 기반 법선)으로
계산해 모든 변에서 같게 함. (2) inner line 색 = 발사대 외곽선(rim) 색 일치(둘 다 갈색). (3) **힘 게이지 =
발사대 하단 반원(약 180°)** — 기존 ~210°에서 축소. (4) **발사대 rim은 play(배경 이미지) 쪽 윗호에만**:
inner line이 발사대 **윗호로 캡**(테이퍼가 발사대 원 위쪽에 연결)되어 그 갈색 캡이 곧 rim이고, outline 쪽
아랫호엔 선이 없음. (5) **발사대 채움색 = background color**(띠 색과 동일)로 띠에 녹아듦. (6) 결과적으로
**발사대 원이 inner line 바깥·outline 안쪽 띠 위에 얹힌** 모양. config: `shieldPath`가 하단 호 인덱스를
반환 → `boardOutline`(골드, 하단 호) / `innerOutline`(offsetInward 후 하단 호를 **발사대 윗호로 치환**)
분리, TAPER_L/R 제거. BoardRenderer: 발사대 seat(어두운 포켓) 제거 — 발사대=띠+inner line 캡+게이지+행성.
Launcher: 게이지 하단 반원. docs: [[50-art-ux/screen-structure]] [[30-systems/play-area-boundary]] 정본화.
검증: typecheck·vite build OK · Playwright **18/18** · headed idle/drag 스크린샷으로 6건 시각 확인.

## [2026-06-28] manual | Title 미정 3건 확정 + docs-write "open question 금지(ask & resolve)" 정책
why: 사용자 지시 — GDD 페이지에 **미해결 open question을 남기지 않는다**. 발생 시 `AskUserQuestion`으로
물어 **확정 결과를 본문에 반영**한다. (1) 직전 턴이 남긴 open question 3건을 사용자 확정으로 닫음:
설정(⚙) 버튼 = **설정 창을 연다**(내부 항목은 차후 별도 스펙), 최고·현재 점수 = **둘 다 localStorage
저장**(새로고침 후 이어하기), Loading 화면 = **와인 배경 + 게임 로고 + 프로그레스 바**.
[[20-core-loop/screen-flow]]·[[50-art-ux/title-screen]] 본문에 반영하고 두 페이지의 `## Open questions`
섹션 제거. (2) 정책을 도구에 일원화: `.claude/skills/docs-write` + `docs/00-meta/conventions`·
`templates/section-template` + `.claude/rules/docs-auto-reflect`·`docs-pipeline`에 "undecided → ask &
resolve, 완성 페이지엔 미해결 질문 0" 규칙 명문화.

## [2026-06-28] auto | 조준 충돌각 UX 구현 + input-ux 정본화
why: 조준선을 드래그 길이 비례 직선에서 **충돌 궤적 예측**으로. `Launcher.predict`가 발사 방향으로
다른 행성(원, shot 반지름 팽창)+사각 벽을 레이캐스트해 **첫 충돌 지점까지 조준선 + 충돌점 마커 +
반사각**을 그리고, 파워는 힘 게이지로 표시(드래그 길이 무관). `GameScene`이 obstacles 제공. UX 정본
[[50-art-ux/input-ux]]를 새 동작(충돌 궤적·게이지 파워·자연 경계 종료)으로 갱신, 메카닉 정본
[[30-systems/launcher]]는 기존 정합. typecheck·build·Playwright 18/18.

## [2026-06-28] manual | 화면 3분할(씬) 추가: Loading · Title(로비) · Pool In-Game
why: 사용자 지시 — 현재 구현 화면을 **Pool In-Game**으로 명명하고, **Title(로비)**·**Loading**
씬을 추가. (1) 신규 [[20-core-loop/screen-flow]]: 세 씬 + 최상위 상태/전이(Loading→Title→
PoolInGame, EXIT로 복귀, 게임 오버 없어 Result/Restart 없음)를 [[90-methodology/state-machine]]에
바인딩(감사가 지적한 "흐름 상태머신 부재" 보완). (2) 신규 [[50-art-ux/title-screen]]: 태양계 공전
배경(Pool 행성 리소스 재사용) + 로비 UI — 순위 위젯 제거 후 그 자리에 👑최고 점수(Play 위)·현재
세션 점수(Play 아래), 좌(일일 미션·상점)·우(출석 체크[옛 일일 보너스]·행운의 돌림판) 사이드 버튼,
하단 **Galaxy|Fantasy 알약 토글**(Galaxy 기본 활성, 탭 시 하이라이트 슬라이드 이동, Fantasy는 연결
모드 없는 시각 자리표시자), 우상단 설정(⚙) 버튼, 하단 4버튼·Arcade·광고 카드는 두지 않음. (3)
[[50-art-ux/feedback-effects]] §5 신설: 모든 버튼 공통 **프레스 피드백**(`juice.buttonPress`
downScale0.92·upScale1.04·140ms). 인덱스(20-core-loop·50-art-ux)·MOC 갱신. 설정 내부 항목은
지시 truncated로 미정(Open question). status: design — 아직 `game/` 미구현.

## [2026-06-28] manual | inner line 갈색·outline 간격 분리, 발사대/게이지 확대, 발사 생성점=원 밖
why: 레퍼런스(화면 캡처) 대조로 보드 하단 6건 정정. (1) **inner line 갈색**(#6e4a28). (2) inner line이
**발사대 원형 공간에 연결**(테이퍼 하단 호 = 발사대 원 반지름). (3) **outline ↔ inner line 간격**:
inner line을 outline에서 `innerInset`(16px) 안쪽으로 들여 그려 그 사이를 background color가 채우게 함
(이전엔 둘이 같은 path라 간격 0). (4) **힘 게이지를 outline 위(최상위)에 렌더 + 링 확대**(gauge.r 42→58).
(5) **발사대 원 반지름 확대**(27→38). (6) **발사 생성점 = 발사대 원 바깥 끝**(중심에서 발사 방향으로
`발사대반경+행성반경`) — 발사대 원 안에서 생성돼 빙글빙글 도는 현상 원천 차단. config: `boardOutline`(골드
프레임, OUTER_LOWER_R)·`innerOutline`(갈색/충돌, innerInset+발사대 원 하단 호) 두 윤곽 분리, `shieldPath`
파라미터화. BoardRenderer: 레이어 outline→배경색 띠→inner line→배경 이미지→발사대 seat, drawPolygon으로
닫힌 스트로크(좌상단 seam 스파이크 제거). GameScene.fire: 생성점 원 밖. docs: [[50-art-ux/screen-structure]]
[[30-systems/play-area-boundary]] [[30-systems/launcher]] 정본화. 검증: typecheck·vite build OK ·
Playwright **18/18** · headed(실 GPU) idle/drag/after 스크린샷으로 6건 + 발사대 무회전 시각 확인.

## [2026-06-28] manual | 충돌 경계=inner line+발사대 원, 140° 테이퍼, 120° 부채꼴 발사
why: 레퍼런스 대조 후 보드/발사 지오메트리 7건 정정. (1) 레이어 순서 **outline→배경색→inner line→배경
이미지**. (2) **inner line ↔ 힘 게이지 연결** — 미리 그려진 빈 트랙(dots)을 드래그 파워에 따라 왼쪽부터
시계방향으로 색 채움. (3) 삼각 **테이퍼 기준각 140°**(꼭지각 → tA=20° 벽). (4) **충돌 외곽=inner line**
(outline 아님)이며 **발사대 원형 공간도 충돌 범위**. (5) **충돌 분리 선 제거** → 하단 콜리전 예외는
발사대 원에만 적용(발사된 공이 원을 한 번 빠져나가면 원이 단단해져 재진입 불가). (6) **발사대 부채꼴
120°**(직상방 ±60°) — 범위 밖 방향은 ±60°로 클램프. (7) **무드래그(데드존)→직상방 최소힘** 발사.
balance.json layout(taperAngleDeg:140, fanDeg:120, launcher/gauge 추가, funnel/bulge 제거), config 파생
(innerOutline·TAPER_L/R via rayCircle·CAT.LAUNCHER·FAN_HALF), PhysicsWorld(inner-line 벽 + 발사대 원 1방향),
GameScene(발사대 원 이탈 후 차단·floorY clamp·`launcher()` 디버그 훅), Launcher(부채꼴 클램프·무드래그
직상방·게이지 좌→우 충전). docs: [[50-art-ux/screen-structure]] [[30-systems/play-area-boundary]]
[[30-systems/launcher]] 정본화. 검증: typecheck·vite build OK · Playwright **18/18**(일방향 테스트를 발사대
원 재진입 불가 기준으로 정정) · headed(실 GPU) idle/drag/fan 스크린샷으로 7건 시각 대조 완료.

## [2026-06-28] manual | 천왕성 리소스 고리 포함 정정
why: "우라노스도 띠가 있어야 한다"는 사용자 지시에 따라 [[50-art-ux/planet-art]]의 Tier 6 패턴을 얇은 청록 고리 + 넓은 청록 곡선 줄무늬로 정정했다. 토성은 더 두껍고 큰 황금 고리, 천왕성은 얇고 기울어진 청록/얼음색 고리로 구분한다. 최종 프롬프트와 생성 원본/후처리/런타임 스케일 기준은 `game/public/assets/prompts/planet-sprite-canonical.md`에 기록했다.

## [2026-06-28] manual | 천왕성 리소스 정본 스타일 및 프롬프트 기록 규칙 확정
why: 새 천왕성 이미지가 기존 행성 세트와 다른 렌더링 질감으로 생성되어, [[50-art-ux/planet-art]]에 스프라이트 생성 정본을 명시했다. 행성 리소스는 개별 정사각 캔버스에서 생성하고, 전체 캔버스 256x256 정규화와 프롬프트/원본/후처리/최종 경로 기록을 `game/public/assets/prompts/planet-sprite-canonical.md`에 남긴다. 천왕성(Tier 6)은 밝은 민트/시안 본체와 넓은 청록 곡선 밴드로 고정했다.

## [2026-06-28] manual | 보드 형태 정밀 정정: 완만한 둔덕·공유 중점·균일 outline·라운드 연결부·힘 게이지
why: 레퍼런스 이미지 대조로 보드 디테일 5건 정정. (1) **outline 균일 두께**(테이퍼 포함) — 닫힌 방패
폴리라인을 중앙 정렬 stroke로 균일하게 그림. (2) **둔덕(bulge)=반원 전체가 아닌 하부 세그먼트**
(sagitta≈지름/3)로 완만한 둔덕. (3) 발사대·둔덕·게이지
**중점 공유(P)**. (4) 발사대 아래 아크를 **힘 게이지**로(드래그 시 왼쪽부터 시계방향 빨강 충전).
(5) **테이퍼-사각형 연결부 라운드**. balance.json layout(bulge/gauge/junctionR 추가, funnel 제거),
config 파생, PhysicsWorld(테이퍼+완만 호 벽), BoardRenderer(방패 fill outline), Launcher(동적 게이지).
[[50-art-ux/screen-structure]] 정본화. 검증: typecheck·vite build OK · Playwright **18/18**(기능) ·
headed(실 GPU) 스크린샷으로 5건 시각 대조 완료(headless는 SwiftShader 셰이더 init 한계로 캡처 불가).

## [2026-06-28] auto | 버그픽스: 플레이 영역 절대화(이탈 0) + 일방향 선 반사벽 — 터널링 구조결함
why: 강한 충돌/발사 시 행성이 플레이 영역을 **탈출**, 일방향 선에서 **튕기지 않고 멈춤**. 근본
원인 = Matter.js는 CCD가 없어 빠른 공(vMax30·restitution0.88)이 얇은 벽(22px)·선(8px)을 **터널링**
관통 → 경계가 절대적이지 않음(이산 충돌만 의존). 수정 = [[30-systems/play-area-boundary]] 정본에
**절대 영역(authoritative clamp-and-reflect)** 도입: `GameScene.containPlanets()`가 매 고정 서브스텝마다
`inPlayArea` 행성을 사각 경계 안으로 clamp + 바깥 방향 속도 반사(×wallRestitution). 일방향 하단(선)도
같은 clamp로 벽처럼 반사(멈춤 해소). 충돌필터는 위로 1방향 통과만 담당. docs: play-area-boundary(절대
영역·구조결함 §), launch-physics(vMax 주석), 70-verification/checklist(절대영역·반사 2항목). 검증(TDD):
clamp 비활성 시 신규 '절대 영역' 테스트가 공 y=-2966 탈출로 **실패 재현** → clamp 복원 후 **Playwright
18/18 통과**(typecheck·build OK). 디버그 훅 `bounds()` 추가.

## [2026-06-28] auto | ball-feel 개편: 콤보 제거 + 충돌/머지 점수 + 경량·탄성 물리 + 머지 운동량 방향 + 연출 4종
why: 사용자 지시(ball 물리·머지 방향·머지/스코어 연출·콤보 제거)를 GDD+코드에 reconcile.
- **콤보 전면 제거**(ADR [[40-balancing/decisions/2026-06-28-remove-combo]]): "정확성이 없는 시스템".
  점수 = 행성–행성 충돌마다 **+1** + 머지 시 **생성 등급 기본 점수**(배율 없음). 14개 docs 콤보 참조 정리.
- **물리 경량·탄성**: density 0.0008·frictionAir 0.022→0.006·friction 0·restitution 0.5→0.88·
  wallRestitution 0.72→0.85, 발사 vMax 22→30·dragMax 110(가볍고 경쾌하고 강하게). [[40-balancing/launch-physics]].
- **머지 결과 속도 = 지배적 운동량**(질량×속도 큰 쪽 방향 이어받기; 평균→지배). [[30-systems/merge-rules]].
- **연출 4종**: 머지 스케일 팝(작→큼→작)·발산 버스트(신규 `Effects` 모듈)·점수 1단위 오도미터·머지
  +N 플로팅(랜덤 좌표·페이드). 타이밍 SSoT `balance.json`(`juice`). [[50-art-ux/feedback-effects]].
- 코드: balance.json(combo→scoring/juice), config(COMBO→SCORING/JUICE), ScoreSystem 재작성,
  MergeSystem(운동량+onMerge xy), PhysicsWorld(density), Planet(popMs), Hud(오도미터), Effects 신규,
  GameScene(effectLayer·연출 배선·팝). 검증: typecheck·build OK · Playwright 16/16(동작 보존).

## [2026-06-28] manual | 보드 형태 정정(방패형) + Next 미리보기 제거 (레퍼런스 이미지 정본)
why: 레퍼런스 이미지 대조 결과 (1) 보드는 단순 직사각형이 아니라 **직사각형 + 하단 삼각 테이퍼 +
둥근 볼록 끝(방패형)** 이고 충돌 경계는 이 outline 자체. 이전의 "발사대 반원 충돌 포켓"은
오구현·오문서 → 제거(발사대 원/아크는 시각 장식). (2) **Next 미리보기 큐 제거**(발사대에 현재
행성만). [[50-art-ux/screen-structure]] 보드 형태 정본화, [[30-systems/play-area-boundary]]
발사대=outline로 정정, [[30-systems/launch-queue]]·[[50-art-ux/layout]]·[[20-core-loop/core-loop]]·
70-verification에서 큐 미리보기 제거. 구현은 balance.json/config 지오메트리 + PhysicsWorld(테이퍼+
볼록끝 벽) + BoardRenderer(방패 outline)로 반영.

## [2026-06-28] auto | 밸런스 상수 data-driven 일원화(balance.json SSoT) + 감사 불일치 3건 수정 + 튜닝 스킬/에이전트
why: 감사([[70-verification/audit-methodology-numbers]]) 불일치를 해소하고 [[90-methodology/data-driven]]
완전 준수로 전환. 모든 튜너블 상수를 `game/src/data/balance.json` 단일 출처로 집약하고 `config.ts`/
`planets.ts`를 리터럴 선언 → JSON 로드·검증·파생 모듈로 재작성(소비자 import 무변경, 중복 선언 0).
파생값(LINE_Y/POCKET.cy/LAUNCHER.y/STEP_MS/MAX_TIER)은 로더 계산. 불일치 수정: (a) `minPower=0.14`+
데드존 6px를 [[40-balancing/launch-physics]] 공식에 확정 명문화, (b) 물리계수 7종을 같은 페이지
"현재 구현값" 표로 역반영(Open questions 닫음), (c) `buildInitialRack`을 `INITIAL_RACK` 파생으로
교정(dead code 제거, 동작 보존). SQLite는 미채택(브라우저 정적 상수에 과스펙) — ADR
[[60-implementation/decisions/2026-06-28-data-driven-balance-json]]. 데이터 변경 운영도구로 `/balance-tune`
스킬 + `balance-tuner`(model: sonnet) 에이전트 추가(JSON 편집→docs reconcile→typecheck 자동화).
검증: typecheck OK · vite build OK · Playwright 16/16 통과(동작 보존). [[60-implementation/architecture]] 데이터모델 갱신.

## [2026-06-28] manual | 화면 구조/HUD 개편: 보드 레이어 + 발사대↔플레이영역 일방향 경계
why: 레퍼런스 이미지 기반 화면 재설계. HUD = 좌상단 게임 머니·나가기 / 중앙 Score·👑최고점수 /
우상단 메뉴·랭킹(친구·프리미엄 제외). 보드 레이어 = 배경색(와인, 화면 전체)·아웃라인(고정)·교체
가능 플레이그라운드 배경 이미지·그 사이 단색 띠·발사대(원형+아크)·플레이 영역(사각). 신규 메카닉:
발사대↔플레이 영역 **일방향 경계**(발사는 선 위로 통과, 진입 후 복귀 불가). [[50-art-ux/layout]]
HUD/구조 개편, 신규 [[50-art-ux/screen-structure]]·[[30-systems/play-area-boundary]], 70-verification
체크 추가. 화면비 9:16 유지("16:9" 지시는 세로형 9:16으로 해석).

## [2026-06-28] auto | 방법론·수치 정합 감사 결과를 70-verification에 기록
why: `game/`가 [[90-methodology/index]] 7대 원칙 + [[40-balancing/index]] 수치 SSoT 기반으로
개발됐는지 14에이전트 워크플로로 교차검증. 결과: 못박힌 수치는 전부 코드와 일치(반지름·점수·콤보·
큐·랙·드래그120·V_max22·쿨다운250 — 양방향 독립 재도출 확정). 방법론은 ECS-lite·Game Loop full,
나머지 partial, State Machine none(흐름 상태머신 부재)·Event-driven 카탈로그 부재. 불일치 3건 발견:
(a) `minPower=0.14`가 문서 공식 `clamp(...,0,1)` 위반, (b) 물리계수 7종이 코드에만 존재(SSoT 미완),
(c) `INITIAL_RACK` dead code+랙 재하드코딩. 권고는 감사 페이지에. See [[70-verification/audit-methodology-numbers]].

## [2026-06-28] manual | 섹션 index → 카탈로그 + 정밀 자식 페이지로 분할 (구조 일관화)
why: 10-concept·20-core-loop·40-balancing·50-art-ux·70-verification가 단일 index.md에 내용을
뭉쳐 두던 것을, 30-systems·60-implementation 패턴대로 **index(카탈로그) + 주제별 자식 페이지**로
분할(워크플로). art-ux→{layout,input-ux,art-direction,planet-art}, concept→{concept,planet-ladder,
fun-hypothesis}, core-loop→{core-loop,play-flow}, balancing→{planet-stats,combo-scoring,spawn-rack,
launch-physics}, verification→{kpi,checklist}. 내용 무손실(핵심 수치 grep 확인), 위키링크 무결성
0 broken(콘텐츠 섹션), 10-concept SSoT 포인터 정밀화, stack ADR dangling 링크 교정. 표준은
[[00-meta/conventions]] §Section structure에 명시.

## [2026-06-28] manual | game/ 버티컬 슬라이스 구현 + Playwright 검증 완료
why: [[60-implementation/plan/index|구현 플랜]] Phase 0–7 순서대로 Vite+TS+PixiJS+Matter.js로
Planet Pool Merge 프로토타입 구현(9모듈: GameScene/PhysicsWorld/PlanetFactory/Launcher/QueueSystem/
MergeSystem/ScoreSystem/Hud/BoardRenderer). 초기 랙·슬링샷 발사·3큐·동급 합성·점수/콤보 동작.
Playwright 실플레이 14/14 통과(desktop+mobile): 초기 랙 10, 큐 한 칸 갱신, 동급 합성 100%+충돌방향
이동, 태양 종단, 첫5발 내 합성, 벽 반사(누출 0), 실드래그 발사. 70-verification 충족, 프로덕션 빌드 OK.

## [2026-06-28] manual | Planet Pool Merge 설계 분배: 소스 문서 → GDD 섹션 reconcile (워크플로)
why: `2026-06-28-planet-pool-merge-design.md`(Suika식 물리 발사 머지)를 docs 온톨로지에 분배.
8섹션 병렬 작성 워크플로로 10-concept(컨셉+9행성 사다리+재미가설), 20-core-loop, 30-systems
(merge-rules/launcher/launch-queue/initial-rack/scoring-combo), 40-balancing(수치 SSoT),
50-art-ux, 60-implementation(tech-stack=PixiJS+Matter.js, architecture 9모듈, task-breakdown,
agent-runbook, stack ADR), 70-verification(KPI+체크리스트) 작성. 80-research는 기존
drop-merge/reverse-merge 연구 보존·링크. 장르·스택 draft→design 확정. 폐기된 Slime Legion
잔재는 이미 부재. See [[index]], [[40-balancing/index]].

## [2026-06-28] manual | SessionStart 훅으로 auto-reflect 규칙 상시 로드
why: 턴끝 reflect 반사를 매 세션(시작/재개/compact) 컨텍스트에 항상 띄우기 위해
`.claude/hooks/docs-session-reflect.mjs` 신설 — `.claude/rules/docs-auto-reflect.md`를 읽어
그대로 주입(단일 출처, 드리프트 방지). `.claude/settings.json`에 `SessionStart` 훅 배선.

## [2026-06-28] manual | docs 운영 도구 강화: `docs` 스킬 → `docs-find`/`docs-write` 분할 + auto-reflect 도입
why: 게임 개발 중 결정/변경을 매 턴 끝에 알맞은 GDD 섹션으로 자동 정리·갱신하기 위해 운영 도구를
ProjectA wiki 방식으로 확장. 읽기/쓰기 스킬 분리(`docs-find`/`docs-write`), soft 규칙
`.claude/rules/docs-auto-reflect.md` 신설, `Stop` 훅(`docs-reconcile-check.mjs`)을 강화해
후보 섹션 지목 + reflect 하우스키핑 리마인더를 출력. 파이프라인 stage 3 = reconcile + reflect.
See [[00-meta/knowledge-system-blueprint]].

## [2026-06-27] manual | AI-Agent Friendly 방법론을 부록 A로 도입
why: 사용자 제공 기본 원칙(ai_agent_friendly_prototype_methodology.md)을 패턴별 10모듈로 분해해
docs/90-methodology/(제출 부록)에 단일 출처로 배치. 각 GDD 섹션(10–70)에 "준수 기준" 바인딩,
CLAUDE.md에 인덱스 링크 연결. See [[90-methodology/index]].

## [2026-06-27] manual | 과제 정렬로 docs/ 구조 재설계
why: 베이글코드 게임 기획 PD 과제(HTML5 Merge 프로토타입용 에이전트 실행 기획문서)에 맞춰
토폴로지를 요구사항 섹션(10-concept … 70-verification + 80-research)으로 재편. game/ 예약.
이전 generic 지식볼트 구조(10-design/20-content/30-tech/…) 제거. hook 파이프라인은 유지.
See [[00-meta/knowledge-system-blueprint]].

## [2026-06-27] manual | docs/ 볼트 + log→reconcile→work 훅 파이프라인 최초 구축
why: verbatim input-log 캡처 + 문서 정합화 + reflect 강제. `.claude/hooks/` 참조.
