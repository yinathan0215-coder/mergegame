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

## [2026-06-28] manual | Stage 밸런싱 기조 정본화 — 밸류(2^단계) 기반 스테이지 설계 기준
why: 사용자 지시(밸런싱 기준을 문서로 먼저). 신규 정본 [[40-balancing/stage-balance]]: 행성 **밸류=2^단계**
(소행성2…지구32…블랙홀2048, 인게임 점수와 별개·합성은 밸류 보존), **렉/큐/최대/목표 밸류**로 균형 —
기조 `최대 밸류 > 목표 밸류`(매우 어려움=등호). 큐는 지구(32) 상한(긴 스테이지 큐 최대 960), 랙은 등급
무제한+모양, 렉:큐≈5:5. 길이=카운트(짧15·중20·김30), **김=스테이지 번호 10의 배수**·짧=3·5·8의 배수.
난이도=슬랙 `N`(렉밸류+큐밸류(첫 count−N발)>목표밸류), `N=max(0,10−⌊stage/10⌋)`(처음 10→스테이지100에서 0).
[[30-systems/stage-mode]]의 "레벨 디자인 차후" 공백을 채움. 결정 확정: 사용자 AskUserQuestion — 밸류=2^단계
(금성=16, '금성=8'은 화성 착오 정정), 긴 스테이지=10단위. 인덱스([[40-balancing/index]])·stage-mode Relates 갱신.
why: 사용자 지시 4건. (1) 인게임 하단 위젯을 보드아웃라인 끝(발사대 아래)에 맞춰 위로 올리고
Count/Next를 각각 제목+값 **중앙정렬 세로 컬럼**으로 두 컬럼 **나란히**, 우측 버튼과 수직 중앙 정렬
([[50-art-ux/layout]] §2-b, `GameInfoPanel`). (2) 종료창 **2초 지연**: Infinite 카운트 소진 2초 뒤 결과,
Stage 목표 달성/소진 2초 뒤 클리어/실패([[20-core-loop/game-modes]]·[[30-systems/launch-count]]·
[[50-art-ux/result-window]], `juice.result.endDelayMs=2000`). (3) **Infinite 해금 보너스**: 넵튠(6)+
해금 팝업마다 **카운트 +5**(`modes.infinite.unlockBonusCount=5`). (4) **해금 팝업 레이아웃**: 상단 영문
`PLANET UNLOCK`, 행성 이름을 **행성 하단**으로, 이름 밑 **`Count +5`** 강조(Infinite 한정), OK 위
([[30-systems/tier-unlock]], `UnlockModal`). 구현: `GameInfoPanel`·`UnlockModal`·`GameScene`(scheduleEnd/
showEnd 지연·해금 시 +5·모달 show(tier,bonus))·`balance.json`. 검증: tsc·vite build·Playwright.

## [2026-06-28] manual | 게임 모드 main 반영 + HUD 하단 정렬 + Stage Title(점수 UI→Stage 정보)
why: 사용자 지시 — (1) feat/game-modes를 main에 반영(동시 세션 중단 후 인플라이트 작업 일괄
커밋 → cherry-pick, TitleScreen 충돌 1건 해결[playLabel 유지 + main의 위치 튜닝 y=14]).
(2) 인게임 HUD 재배치: Count/Next를 **가로로 나란히**, 행성 충전/목표 행성을 **하단 우측**으로,
전체를 보드/발사대 **아래 하단 스트립**으로 내려 플레이 영역을 가리지 않게 함([[50-art-ux/layout]] §2-b).
(3) Title 모드 UX 변경: Play 라벨은 두 모드 공통 **`Game Start`**(Stage N 라벨 폐기), **Stage 선택 시
최고·현재 점수 UI를 숨기고 최고 점수 영역에 `Stage N` 정보 표시**([[50-art-ux/title-screen]] §2-2·§2-4 ·
[[20-core-loop/game-modes]] · [[20-core-loop/screen-flow]]). 구현: `GameInfoPanel`(하단 스트립·가로 정렬),
`TitleScreen`(playLabel 고정·Stage 정보 토글·점수 UI show/hide). 검증: tsc·vite build·Playwright.

## [2026-06-28] manual | Play 버튼 텍스트 파란 면 안전영역 보정
why: 사용자 지시 — 버튼 이미지를 줄이거나 9-slice 구조를 바꾸는 문제가 아니라 `게임 시작` 라벨이 파란 버튼 면 밖으로 내려오는 문제였음. 구현(`game/src/TitleScreen.ts`): `play-button.png`와 224x100 런타임 버튼 영역은 유지하고, 흰색 플레이 삼각형과 라벨 오버레이만 위로 재배치해 하단 금색 베벨 위로 내려오지 않게 함. docs: [[50-art-ux/button-system]] · [[50-art-ux/title-screen]] · `game/public/assets/prompts/title-icons.md`.

## [2026-06-28] manual | 인게임 ≡ 메뉴 외형 — 코너 버튼 BG 제거 + 드롭다운 공통 BG·≡ 바로 아래
why: 사용자 지시 — (1) 햄버거(≡)·나가기 **코너 버튼은 배경 박스 없이 아이콘만**(코너 버튼=아이콘 자체가
탭 영역), (2) ≡ 드롭다운 리스트를 **≡ 버튼 바로 아래**(버튼 중심 정렬)에 매달리게, (3) 4개 항목을
**항목별 박스 대신 하나의 공통 딤드 박스**로 묶음. 구현(`game/src/Hud.ts`): `button()`에서 코너 버튼 BG
Graphics 제거(아이콘+hitArea+피드백만), `buildMenu()`는 공통 패널(검은 반투명 라운드) 1개를 ≡ 하단
(topY=48, ≡ hitArea 하단 ≈44 바로 아래)에 그리고 그 위에 아이콘만 올림(패널은 아이콘 사이 탭 흡수→리스트
유지). docs: [[50-art-ux/button-system]](코너=아이콘만·드롭다운=공통 박스) · [[50-art-ux/layout]] §2·§2-c.
검증: tsc OK · Playwright 메뉴 테스트 8/8(토글·바깥닫힘·4아이콘·실포인터 z-order, 양 뷰포트 ×2).

## [2026-06-28] manual | 해금 모달 와이드(웹 16:9) 과대 크기 수정 — contain 레이어 + 오버사이즈 딤
why: 사용자 보고 — 웹 16:9(와이드)에서 신규 행성 해금 팝업이 다른 메타 팝업과 달리 **엄청 크게** 표시됨.
원인: 해금 모달이 **cover 레이어(`popupRoot`, `sBg=max(...)`)**에 있어 콘텐츠가 cover 스케일로 커짐(와이드일수록
`sBg≫sFg`). 해소: 모달을 메타 팝업과 동일하게 **contain 레이어(`fgRoot`)**로 옮기고(콘텐츠=정상 contain
스케일), **딤만 DESIGN을 크게 넘는 사각(±3000)**으로 그려 contain 변환 아래에서도 레터박스까지 화면 전체를
덮게 함. 이제 모든 전체화면 팝업(메타+해금)이 동일한 2-레이어 fit을 쓴다. 죽은 `popupRoot` 레이어 제거.
docs: [[50-art-ux/popup-system]] 입력·딤(모든 팝업=contain+오버사이즈 딤) · [[30-systems/tier-unlock]] 모달 UX.
검증: tsc OK · Playwright **40/40**(신규 회귀 테스트: 1600×900에서 모달 부모 스케일 = sFg(contain), cover 아님).

## [2026-06-28] manual | 설정 팝업(공통 셸) + 사운드 효과음 3종 배선
why: 사용자 지시(레퍼런스 이미지 첨부) — Title 설정 기어에 **설정 팝업**을 공통 팝업 시스템으로 구현.
**사운드(마스터 뮤트 토글)만 실제 동작**하고 진동·닉네임·UID 복사·언어·게임 저장·구글/Apple 로그인은
구색용 비동작 placeholder(탭=프레스 피드백만). 신규 정본 [[30-systems/settings]], 진입점
[[50-art-ux/title-screen]] §2-1 갱신. 감사(pass2) 사운드 orphan 해소: `toggle`(Galaxy/Fantasy 토글)·
`popupOpen`/`popupClose`(공통 `ui/Popup` open/close) 배선, 뮤트 UI = 설정 팝업 사운드 버튼 →
[[50-art-ux/sound-design]] 볼륨 문구 제거(뮤트만)·[[60-implementation/sound-manager]] 연결표 갱신.
구현: `game/src/popups/SettingsPopup.ts`(공통 `Popup`+`button3D`), `MetaUI`(`settings` 종류 추가),
`TitleScreen`(기어→open·토글음), `ui/Popup`(open/close 차임). 검증: tsc·vite build OK · Playwright 38/38 ·
헤드리스 스크린샷으로 레퍼런스 일치 확인.

## [2026-06-28] manual | Galaxy background 16:9 cover master 추가
why: 사용자 지시 — 기존 9:16 계열 `space-background.png`는 유지하되, 16:9 화면과 9:16·1:2 cover 크롭에서도 패턴이 충분히 보이도록 더 촘촘한 물결 밴드의 새 정적 배경을 추가. 런타임 기본 배경은 `game/public/assets/board/space-background-cover-16x9.png`(1920x1080)로 전환하고, `GalaxyBackground`는 원본 비율을 유지한 cover 배치로 렌더한다. docs: [[50-art-ux/galaxy-background]].

## [2026-06-28] manual | Play 버튼 크기 원복 + 내부 텍스트 위치 보정
why: 사용자 정정 — 문제는 9-slice 버튼 이미지를 줄이는 것이 아니라, 기존 크기 버튼 안에서 `게임 시작`
텍스트가 벗어나는 배치였다. `play-button.png` 소스와 런타임 버튼 영역은 224x100으로 되돌리고,
플레이 삼각형·라벨만 버튼 안전영역 내부에 맞춰 배치하도록 정정. [[50-art-ux/button-system]]·
[[50-art-ux/title-screen]] 및 프롬프트 기록에서 204x82 표시 크기 설명 제거.

## [2026-06-28] manual | Play 9-slice 버튼 표시 크기 조정
why: 사용자 지시 — 9-slice 적용 후 게임 시작 버튼 몸체가 내부 플레이 삼각형·라벨 대비 과하게 커 보임.
`play-button.png` 소스 캔버스는 224x100으로 유지하고 런타임 표시 크기를 204x82로 분리해 9-slice 절단선을
보존하면서 내부 요소와 CTA 몸체 비율을 맞춤. [[50-art-ux/button-system]]·[[50-art-ux/title-screen]] 및
프롬프트 기록을 갱신.

## [2026-06-28] manual | 인게임 ≡ 메뉴 → 드롭다운 단축 메뉴(일일미션·출석·돌림판·설정)
why: 사용자 지시 — Pool In-Game 상단 오른쪽 햄버거(≡) 버튼을 누르면 그 아래로 **아이콘만 있는 4버튼
드롭다운**이 토글된다. 항목 = Title 로비의 일일 미션·출석 체크·행운의 돌림판·설정과 **동일 아이콘·동일
기능**(같은 `MetaUI` 팝업을 연다). **설정**은 Title 설정 버튼과 동일 동작(전용 팝업 없음 → 공유 no-op).
햄버거 재탭 또는 **바깥(다른 화면) 탭으로 닫힘**. 구현: `Hud`에 드롭다운+투명 스크림(바깥 탭 가로채 닫기,
보드 입력 차단; 스크림 위에 항목·≡ 버튼만 눌림), `GameScene`이 4항목을 `metaUI.open`(+설정 no-op)으로
배선, `MetaUI.openKind()`. docs: [[50-art-ux/layout]] §2-c(인게임 드롭다운) · [[50-art-ux/popup-system]]
(두 진입점=로비 사이드 버튼+인게임 ≡). 검증: tsc OK · Playwright **34/34**(메뉴 토글·바깥닫힘·4아이콘→
팝업·설정 no-op 상태머신 + 실포인터 햄버거 열기/바깥 닫힘 z-order, 양 뷰포트 ×3 반복 결정론 확인).

## [2026-06-28] manual | Loading 씬 추가 — GALAXY PINBALL 텍스트 스트림 + 최소 로딩 2초
why: 사용자 지시("게임 처음 실행 시 최소 로딩 2초 확보, 텍스트 스트림으로 '은하 핀볼(영문)' 이름이
경쾌하게 등장"). 코드엔 Loading 씬이 없어 부팅 즉시 Title이었음 → `SceneState`에 `Loading` 추가,
부팅 시 Loading으로 진입해 `LoadingScreen`이 플레이어 노출 타이틀 **GALAXY PINBALL**을 글자 단위
팝(easeOutBack) 스트림 + 하단 골드 프로그레스 바로 표시, 경과 ≥ 2000ms이면 Title로 페이드. 정본은
[[20-core-loop/screen-flow]] §Loading(전이 조건에 최소 로딩 floor 명문화, 플레이어 타이틀=Galaxy
Pinball·내부 디스크립터=Planet Pool Merge 구분). 헤드리스 프로브로 스트림/2초 floor(Title 도달
~2.4s) 확인, Playwright 34/34.

## [2026-06-28] manual | 충돌음 가청도 — wall/ballHit 게인을 발사·머지와 동등 수준으로 상향
why: 사용자 지시 "충돌 사운드가 빠졌어". 헤드리스 프로브로 검증 결과 충돌음은 정상 발화(보이스 캡 0회
preempt, 폭주는 스로틀로 솎임)했으나 게인이 wall 0.09·ballHit 0.12로 launch 0.17·merge 0.22의 약 절반
이라 인접한 발사·머지 소리에 묻혀 "빠진" 것처럼 들렸다. wall→0.16, ballHit→0.20(+dur 0.06→0.08로 타격
바디 보강)으로 상향해 가청 동등화. `balance.json` `sound`와 `SoundManager` DEFAULTS 동기, 정본 규칙은
[[50-art-ux/sound-design]] §3 "충돌음 가청도"에 기록. Playwright 34/34.

## [2026-06-28] manual | 버튼 리소스 정정: Play 9-slice 단일 이미지 + HUD PNG 버튼 + 사이드 라벨 분리
why: 사용자 정정 지시 — 게임 시작 버튼은 `play-button-pressed.png`를 쓰지 않고 단일 `play-button.png`를
9-slice로 채우며, 눌림 상태는 공통 `juice.buttonPress` 피드백으로만 처리한다. 출석체크·행운의 돌림판·
일일 미션·상점 버튼은 텍스트를 이미지/딤드 박스 안에 넣지 않고, 검은 반투명 라운드 박스는 아이콘 뒤
배경으로만 둔다. 인게임 HUD 나가기·햄버거 메뉴도 `exit.png`·`menu.png` 이미지 아이콘으로 연결한다.
정본 규칙은 신규 [[50-art-ux/button-system]]에 기록하고 [[50-art-ux/title-icons]]·[[50-art-ux/title-screen]]·
[[50-art-ux/layout]]을 갱신.

## [2026-06-28] auto | 코드↔문서 정합 감사 보고서 추가 (53건 확정)
why: 사용자 지시("구현 여부 + 문서 미반영 + 구현과 다른 내용 + 오분류를 찾아봐"). 2-pass 멀티에이전트
교차 대조(반증 검증 포함)로 `docs/` vs `game/src/` 불일치 **53건** 확정 → 진단 전용 보고서
[[70-verification/audits/2026-06-28-2050-docs-code-sync-audit]] 신설, [[70-verification/index]] 감사
로그에 링크. 핵심: 게임 모드 레이어(설계만 됨, 미구축)·콤보 "제거" ADR 모순·점수 +1/+3 및 영속·
아키텍처 9모듈 stale. **수정은 이 보고서를 입력으로 하는 별도 단계**(이번 턴은 정본 본문 미수정).

## [2026-06-28] manual | 게임 모드(Infinite/Stage) 구조 설계 — 카운트·충전·블랙홀 보너스·결과창·Stage 데이터
why: 사용자 지시(docs-write 선행 후 개발) — Pool In-Game에 **두 게임 모드**를 추가. Title 하단
Galaxy/Fantasy 토글을 **Infinite|Stage 모드 선택**으로 전환, Play 라벨이 모드별(`Game Start`/`Stage N`).
신규 정본: [[20-core-loop/game-modes]](모드 개요·선택·종료·결과 흐름), [[30-systems/launch-count]]
(남은 카운트=발사 예산, Infinite=30, 발사 −1, 0이면 발사 차단), [[30-systems/planet-charge]]
(Infinite 우측 충전 버튼[회전 지구+`Planet Charge`]+공통 팝업: 중앙 회전 지구·우측 `+N`·하단 슬라이더
0~보유코인 최대치·10당 100코인·기본 +10·코인<100이면 좌측 고정·`충전` 버튼+`[코인] current/needed`),
[[30-systems/stage-mode]](스테이지 스키마=count·target·rack[위치/종류]·queue[결정적 시퀀스],
목표 행성 카운트 내 합성=클리어+300코인, 실패→게임 화면 복귀, 레벨 디자인 차후·플레이스홀더 1개),
[[50-art-ux/result-window]](전환효과 결과창: Infinite 스코어 1→최종 카운트업·NEW RECORD·하단 최대 콤보·
탭→Title / Stage 클리어 [다음 스테이지]·[돌아가기] / Stage Fail→게임 화면), [[40-balancing/game-modes]]
(수치 SSoT: balance.json `modes`/`juice.result`). 사용자 확정: 마지막 행성=**블랙홀**(11), Infinite 한정
블랙홀끼리 합성→둘 다 소멸+카운트 +20(ADR [[30-systems/decisions/2026-06-28-blackhole-infinite-count]],
[[10-concept/planet-ladder]]·[[30-systems/merge-rules]]의 "블랙홀 합성 없음"을 Infinite 한정 덮어씀);
결과창 종료=탭→Title; Stage 클리어=[다음 스테이지]+[돌아가기]; Infinite 시작 텍스트="Game Start".
좌하단 Count+Next 미리보기([[30-systems/launch-queue]] Next 재도입·HUD 위젯), [[50-art-ux/layout]] §2-b
하단·측면 HUD(모드별) 추가. "게임 오버 없음"을 모드 종료로 정합화([[20-core-loop/core-loop]]·
[[20-core-loop/play-flow]]·[[20-core-loop/screen-flow]] Result/StageClear/StageFail 상태). 인덱스
4종·MOC 갱신. 다음: `game/` 구현.

## [2026-06-28] manual | 사운드 시스템 — 컨셉(docs-write) + SoundManager(절차 합성·동시 제한) + 코어 SFX 연결
why: 사용자 지시(art처럼 docs-write로 컨셉부터). 신규 정본: [[50-art-ux/sound-design]](효과음/UI 사운드
컨셉·톤·카탈로그 11종 + **동시재생 제한 UX**: maxVoices 상한·사운드별 throttle·우선순위 선점, 머지=등급↑→
피치↑, 뮤트/자동재생 해제) · [[60-implementation/sound-manager]](Web Audio 절차 합성 스펙). 구현: 신규
`game/src/SoundManager.ts`(오실레이터/노이즈+게인 엔벨로프, **maxVoices=6 동시 보이스 상한 + id별 throttleMs +
우선순위 선점/생략**으로 충돌 폭주 시 wall/ballHit 솎임, 첫 pointerdown에 AudioContext resume, `ppm.muted`
localStorage). 연결: `ui/button.ts`(모든 버튼 `uiPress`), `GameScene`(merge 등급→pitch·comboMilestone·unlock·
launch 파워→pitch·wall/ballHit). 수치 SSoT `balance.json`(`sound`, 코드 DEFAULTS 폴백). BGM은 범위 밖.
인덱스(50-art-ux·60-implementation) 갱신. 검증: tsc·vite build OK · Playwright 통과(사운드=부수효과).

## [2026-06-28] manual | Title 버튼 외형 재정의: 검은 반투명 아이콘 버튼 + Play 기본/눌림 PNG
why: 사용자 지시 — 설정·일일 미션·출석 체크·행운의 돌림판·상점처럼 이미지가 들어간 버튼 외형은
**검은색 반투명 라운드 사각형**으로 통일. 게임 시작 버튼 몸체는 코드 드로잉이 아니라 `$imagegen`으로 뽑은
`play-button.png`(기본)와 `play-button-pressed.png`(눌림) 2상태 PNG를 사용하도록 [[50-art-ux/title-icons]]와
[[50-art-ux/title-screen]] 갱신. 프롬프트·원본·후처리는 `game/public/assets/prompts/title-icons.md`에 기록.

## [2026-06-28] manual | 해금 소개 팝업 첫 등장 = 해왕성(Neptune) 명시·검증
why: 사용자 점검 지시 — 행성 사다리(11종)·기본 큐 변경 후 해금 소개 팝업이 **해왕성부터** 떠야 함을
확인. `progression.unlockStart=5`(지구) → 지구끼리 합성해 6단계 해왕성이 처음 생성될 때
`MergeSystem`은 소스 단계만 게이트(`pa.tier > unlockedTier` 차단)하므로 첫 결과 단계 = 6(해왕성),
`GameScene`이 `6 > 5`로 첫 모달을 띄움 → 첫 팝업 = 해왕성 확정. [[30-systems/tier-unlock]]에
"첫 모달 = 해왕성(Neptune)" 정본 명시(소개 팝업 등장 순서 단일 출처 = `unlockStart` + 등급 사다리).
구 사다리 잔재인 해금 테스트 라벨 "천왕성"→"해왕성"(`game/tests/play.spec.ts` 테스트명·주석) 정정.
검증: 해금 테스트 desktop·mobile 2/2 통과(첫 팝업 tier 6 = 해왕성).

## [2026-06-28] manual | 인게임 팝업 딤 뷰포트 전체로 — cover 팝업 레이어(popupRoot), 검증 완료
why: 사용자 지시 — 인게임 딤 팝업(해금 모달 등)이 2-레이어 fit 후 상하 여백을 못 덮음. 원인: 모달이
contain `fgRoot`에 있어 Pixi 딤이 9:16만 덮고, 기존 레터박스용 DOM 딤(`letterboxDim`)은 뷰포트를 꽉 채운
캔버스 뒤(z-index:-1)라 가려짐. 해소: 신규 **`popupRoot`(cover)** 레이어에 모달을 두어 딤이 **뷰포트 전체
(상하 여백 포함)**를 덮게 함(배경/fade와 동일 2-레이어 방식), 콘텐츠는 중앙. `UnlockModal`의 DOM
`letterboxDim` 제거(불필요). [[50-art-ux/popup-system]] §입력·딤 정본화(딤=cover 레이어, DOM 딤 폐기).
검증: tsc·vite build OK · headed로 해금 모달 딤이 상하까지 꽉 참 스크린샷 확인 · Playwright **24/24**.

## [2026-06-28] manual | 메타 레이어 설계 — 공통 팝업 틀 + 일일 미션·출석·돌림판·상점 + 코인 경제(GDD)
why: 사용자 지시(이미지 4종 첨부) — Title 로비 메타 기능 5종을 docs-write 선행 후 구현. 신규 정본 페이지:
[[50-art-ux/popup-system]](BG/제목/X 3요소 + 머지 모달과 동일한 오픈 전환, BG 생략 가능),
[[30-systems/meta-economy]](코인 지갑 + KST 자정 일일 리셋 + localStorage 영속, 게임플레이→미션 보고),
[[30-systems/daily-missions]](미션 8개=콤보 피크 5/15/30·머지 100/200/300·태양 만들기·**광고 더미(달성불가)**;
개당 50 자동지급 + 누적 받기 2/5/8=50/100/200, 8단계는 더미로 도달불가),
[[30-systems/attendance]](7일 100~400, KST 일자 1회, 받기/일차칸 클릭, 받은 뒤 다음 보상 카운트다운),
[[30-systems/lucky-wheel]](8칸 25~200, 120 코인, 정지 시 균등랜덤 결정 후 3초 감속 정착, BG 없음),
[[30-systems/shop]](잠금 표시). 수치 SSoT [[40-balancing/meta-economy]]. 결정사항: 코인 시작=**0**(사용자
확정), 8번째 미션=광고 더미(사용자 확정). 인덱스([[30-systems/index]]·[[50-art-ux/index]]·[[40-balancing/index]]) 갱신.

## [2026-06-28] manual | Title 은하수 2-레이어 구현 — cover로 상하 여백 채움(태양계·UI는 contain), 검증 완료
why: 사용자 지시(동시 세션 정지 후 단독 구현). 근본 원인 = 고정 9:16 캔버스 + contain → Pixi 은하수가
레터박스(캔버스 밖)를 못 칠함. 해소: 캔버스를 **뷰포트 크기**(`resizeTo: window`)로 바꾸고 배경/전경
2-레이어 분리 — **은하수(GalaxyBackground=이미지+반짝임)만 `bgRoot`(cover, `max` 스케일)** 로 뷰포트 가득
(상하 여백 0), **태양계 공전·로비 UI·보드·HUD는 `fgRoot`(contain 9:16, `min` 스케일·중앙)** 로 잘림 없음.
씬 전이 `fade`도 뷰포트 전체. 입력은 `Launcher`가 `fgRoot.toLocal(e.global)`로 전경 디자인 좌표 변환.
`GameScene.layout()`이 resize마다 fg/bg 스케일+중앙·hitArea·fade 갱신. `TitleScreen.galaxy` 공개(컨테이너에서
분리)·Title 한정 visible. [[50-art-ux/title-screen]] §1·[[50-art-ux/layout]] §1 설계와 일치. 검증: tsc·vite
build OK · headed Playwright(390×844) **밴드 top/bottom=0**(캔버스=뷰포트, fg=390×693 9:16) 스크린샷 확인 ·
Playwright **24/24**(전경 9:16 비율 테스트 fgRect로 정정, 드래그 발사로 launcher 좌표 변환 검증 포함).

## [2026-06-28] manual | 행성 사다리 11단계화 — 소행성 선행·블랙홀 최종·큐 최대 지구
why: 사용자 지시 — 수성 전 단계에 **소행성**을 추가하고 태양 다음 단계에 **블랙홀**을 추가해 총 11단계로 확장. 최종 단계는 태양이 아니라 블랙홀이며, 태양+태양은 블랙홀을 만든다. 기존 `queueCap=5`는 숫자를 유지하되 새 사다리 기준 **지구**가 되도록 정본화했고, 초기 랙/시작 큐 후보도 새 낮은 단계(소행성·수성·화성·금성) 기준으로 재정렬. docs: [[10-concept/planet-ladder]] · [[40-balancing/planet-stats]] · [[50-art-ux/planet-art]] · [[30-systems/launch-queue]].

## [2026-06-28] manual | 공통 버튼 피드백 모듈 + 해금 팝업 전환·행성 이름·풀스크린 딤
why: 사용자 지시 4건. (1) **공통 버튼 프레스 피드백을 단일 모듈**(`game/src/ui/button.ts`
`attachButtonFeedback`)로 묶어 Title 로비·HUD·**해금 모달 OK** 버튼이 같은 눌림→탄성 복귀를 쓰게 함
(rAF 구동 → 모달 일시정지 중에도 동작). (2) **해금 팝업 등장 전환**(딤 차오름+내용 팝/페이드인 220ms).
(3) **해금 팝업의 행성 위에 영어 이름**(예: Neptune) 표시 — **팝업 한정**(보드 행성엔 미표시),
SSoT `balance.json` `planets[].en`. (4) **팝업 딤을 화면 전체**로 — 보드(캔버스)는 Pixi 딤, 캔버스 바깥
레터박스는 캔버스 뒤 DOM 딤으로 채워 여백 제거. docs: [[30-systems/tier-unlock]] 모달 UX ·
[[50-art-ux/feedback-effects]] §5 공통 모듈. 검증: typecheck·vite build OK · Playwright **24/24**.

## [2026-06-28] manual | Title 상하 여백 진단(76px) + 은하수만 cover 채움 정본화(태양계·UI는 contain)
why: 사용자 지시 — Title 상하 여백을 채우되 **은하수 배경(GalaxyBackground=이미지+반짝임)만** Title 한정
cover로 확장, **태양계·UI는 contain(9:16)** 유지, 기본/레터박스 배경은 단색 outerBg로 환원. headed
Playwright(390×844)로 **상하 76px 밴드** 확인(캔버스 390×693 중앙). 임시 `#app` galaxy CSS는 환원(은하
반짝임 효과가 Pixi라 정적 CSS로는 불가). [[50-art-ux/title-screen]] §1 정본화. **구현 보류**: Pixi 은하수가
레터박스를 채우려면 캔버스가 밴드를 덮어야 하고(=GameScene 캔버스 변경) 그 멀티파일 변경이 **동시 진행
세션의 GameScene/Launcher/TitleScreen 실시간 편집과 충돌**(이번 턴 Launcher.ts·TitleScreen.ts "modified on
disk" 충돌)하므로, 해당 세션 정지 후 단일 세션 전용 접근에서 1패스로 구현(스크린샷 검증 가능).
why: Title 화면의 설정·일일 미션·출석 체크·행운의 돌림판·상점 아이콘을 이모지/절차 그래픽 대신 개별 PNG 리소스로 쓰도록
[[50-art-ux/title-icons]]를 신설. 기존 `crown.png`/`gold.png`와 같은 캐주얼 모바일 게임 2.5D 스타일을 정본으로 고정하고,
프롬프트·생성 원본·후처리·최종 경로를 `game/public/assets/prompts/title-icons.md`에 항상 기록하도록 명시.
Play 버튼은 같은 톤의 입체 CTA(하이라이트·베벨·그림자·흰색 플레이 삼각형)로 정리.

## [2026-06-28] manual | 콤보 5s/3s + 5단위 마일스톤 보너스(중앙 2줄 "combo M / +N")
why: 사용자 지시 — 콤보 유지 5초(`holdMs` 4000→5000)·**3초부터 페이드아웃**(`fadeStartMs` 2000→3000).
**콤보가 5의 배수(5·10·15·20·25…)에 도달할 때마다 큰 보너스 점수**(`콤보값 × bonusPer=400`) 지급 —
배율 아님, 마일스톤 정액(콤보는 어렵게 쌓이므로 상당히 큰 베네핏). 보너스는 **화면 중앙에 2줄 플로팅**:
위 `combo M`(작은 글씨 `bonusLabelSize=22`) + 아래 `+N`(큰 글씨 `bonusFontSize=40`, 머지 22보다 큼·유지
`bonusMs=1800`>머지 950), 색 `bonusColor`. 구현: `Combo.onMerge`가 마일스톤 보너스 반환, `ScoreSystem.addBonus`,
`Effects.comboBonus(points, combo)`(2줄 Container·팝업 ms/rise 개별화), `GameScene` 머지 콜백에서 보너스 가산+
중앙 팝업+`lastComboBonus` 훅. SSoT `balance.json` `juice.combo`. docs: [[50-art-ux/feedback-effects]] §8 ·
[[30-systems/scoring-combo]](보너스=세 번째 점수원) 정본화. 검증: typecheck·vite build OK · Playwright
**24/24**(신규 마일스톤 보너스 테스트 포함) · headed 콤보5 도달 시 "combo 5 / +2000" 중앙 표시 확인.

## [2026-06-28] manual | 방법론 감사 스킬 신설 + 첫 코드 준수 감사(73/100) + SRP enforcement·karpathy 규약 보강
why: 사용자 지시 — (1) karpathy 개발철학이 방법론·CLAUDE.md에 빠졌는지 점검: **단일책임(SRP)은
[[90-methodology/ecs-lite]]에 명시**돼 있으나 *검증(enforcement)*이 없어 GameScene 갓오브젝트(380줄·5책임)가
무경보 통과, **karpathy는 글로벌 CLAUDE.md에만** 있고 프로젝트 CLAUDE.md엔 없음. (2) 신규
`.claude/skills/methodology-audit` — `game/src`를 7기둥+단일책임+karpathy로 점수화(0–100)하고
`docs/70-verification/audits/<날짜-시각>.md`에 보고서+우선순위 수정 워크리스트를 기록(감사 전용, 수정은
별도 단계). (3) 첫 감사 [[70-verification/audits/2026-06-28-1932-methodology-srp-audit]] = **73/100**
(약점: 단일책임 2·State 3·Event 3). (4) 보강: [[90-methodology/ecs-lite]] 완료기준에 "검증" 항목,
프로젝트 `CLAUDE.md`에 karpathy+감사 스킬 규약 추가. **코드(game/) 무수정** — 진단·도구·문서만.

## [2026-06-28] auto | 검증 결과 갱신 — Playwright 22/22(해금 게이트·콤보 카운터 포함)
why: tier-unlock 해금 게이트 e2e(잠긴 등급 머지 → 일시정지 → OK 해금) + 콤보 카운터 테스트가 더해져
실플레이 스위트가 16→22 전부 통과. [[70-verification/kpi]]·[[70-verification/index]]의 통과 수와 시나리오
목록을 현재 검증 상태로 정합화. See [[30-systems/tier-unlock]].

## [2026-06-28] manual | 콤보 카운터(머지 체인) 추가 — 절대 4s 타이머·2~4s 페이드, 행성 뒤 중앙
why: 사용자 지시 — 연속 머지를 세는 **시각 콤보 카운터**(점수 배율 아님; 배율 콤보는 ADR로 제거됨).
**유지 타이머 = 절대 4초**(`juice.combo.holdMs`), 머지마다 0으로 **리셋**; 타이머가 살아 있는 동안 머지 시
콤보 **+1**, 지나면 다음 머지부터 **1**로 재시작(첫 머지=1). 표시: **행성 뒤(배경 위)** 레이어에 `Combo`
라벨 + 숫자, **중앙 정렬**, 숫자는 점수처럼 **1단위 오도미터** 상승. 사라짐: 마지막 머지 후 **2초까지 풀
불투명 → 2~4초 선형 페이드아웃**(`fadeStartMs`). 구현: 신규 `game/src/Combo.ts`(타이머·카운트·오도미터·
페이드), `GameScene`에 `comboLayer`(boardLayer↔planetLayer 사이) + 머지 콜백 `combo.onMerge` + tick
`combo.update` + 디버그 `comboValue`. SSoT `balance.json` `juice.combo`. docs: [[50-art-ux/feedback-effects]]
§8 정본화. 검증: typecheck·vite build OK · Playwright **20/20**(신규 콤보 1→2 증가 테스트 포함) · headed
머지 연쇄로 "Combo 7" 워터마크가 행성 뒤 중앙에 표시됨 확인.

## [2026-06-28] manual | Title 태양 게임시작 위로 노출 + 검은 반투명 박스; 배경 fill 롤백 진단=untracked
why: 사용자 지시 3건. (1) 태양계 중점(태양)을 **게임 시작 버튼보다 위**로 올려 노출 — `ORBIT_CY=DESIGN.h×0.3`
(궤도 중심 상단). (2) **최고 점수 + 게임 시작 버튼을 검은색 반투명 사각 박스**로 묶음(`centerPanel` alpha 0.4).
[[50-art-ux/title-screen]] §1·§2-2 정본화. (3) "은하수+태양계 배경 세로 fill이 계속 롤백" 진단: 코드상 fill은
현재 존재(`GalaxyBackground`=DESIGN.w×h, 궤도 `ryMax=DESIGN.h×0.56`)하고 docs도 반영됨(title-screen §1
"상하 꽉 채움"·layout §1 cover/contain 2-레이어). 롤백 원인 = `TitleScreen.ts`·`GalaxyBackground.ts`가
**untracked(미커밋)**이라 다중 세션 편집이 last-write-wins로 서로 덮어씀(git revert 아님). 해소: 현재 그린
상태(tsc·vite build OK)의 game/src를 **baseline 커밋**해 추적 시작 — 이후 편집은 diff로 보이고 silent 덮어쓰기 방지.

## [2026-06-28] manual | Title 로비 UI 정렬(아이콘 카드·중앙 컬럼·토글 슬라이드) + 씬 전이 페이드
why: 사용자 지시 2건(레퍼런스 이미지). (1) Title 로비 UI를 정본 레이아웃으로: 👑최고점수(Play 위)·
**게임 시작** 버튼(▶ 아이콘·확대)·🪐현재점수(Play 아래) 중앙 컬럼, 좌·우 **아이콘 타일+라벨 카드** 4개
(일일 미션·상점·출석 체크·행운의 돌림판), Galaxy|Fantasy **토글 슬라이드 애니메이션**(노브 x lerp, 기능 없음).
(2) **씬 전이 페이드** — `setScene` 시 블랙 인→씬 교체→아웃(각 200ms, 전환 중 입력 차단).
[[50-art-ux/title-screen]] §2-3 · [[20-core-loop/screen-flow]] 정본화. 구현: `game/src/TitleScreen.ts`
(bestRow/currentRow·sideButton 아이콘 카드·playButton 확대·themeToggle 슬라이드) · `game/src/GameScene.ts`
(fade 오버레이·updateTransition). 본 변경은 type-clean(코드는 동시 진행 세션 파일 → 본 커밋은 docs만; 현재
tsc는 동시 세션의 MergeSystem in-flight 편집[unlockedTier]으로 일시 실패하나 본 변경과 무관).

## [2026-06-28] manual | Pool HUD: 머니·랭킹 제거 → 좌상단 뒤로가기(→Title)·우상단 메뉴
why: 사용자 지시 — Pool In-Game 상단 좌(머니)·우(랭킹) 표시를 제거하고 그 자리에 셸 버튼만. 좌상단
**뒤로가기 버튼(←)** → 누르면 **Title 화면 복귀**(`GameScene.setScene('Title')` 콜백), 우상단 **메뉴 버튼(≡)**
(동작 placeholder). 중앙 Score·👑최고점수는 유지. 구현: `Hud`에서 `moneyPill`·`rankingPill` 제거, 버튼을
상단 모서리(좌 12,12 / 우 HUD.w-44,12)로 배치, `button()`에 `pointerdown` stopPropagation(탭이 발사로
새지 않게)+`pointertap` 콜백; `Hud(layer, onBack)` 시그니처에 콜백 추가, `GameScene`이 `()=>setScene('Title')`
전달. docs: [[50-art-ux/layout]] HUD 표 정본화(좌=뒤로가기→Title·우=메뉴, 머니/랭킹 없음). 검증: typecheck·
vite build OK · Playwright **18/18** · headed(startGame→back 클릭) scene 전이 PoolInGame→Title 확인.

## [2026-06-28] manual | Title 배경 풀블리드 설계: 배경 cover / 전경 contain 2-레이어
why: 사용자 지시 — Title 태양계 배경은 화면 끝까지 채우되(cover) UI/플레이그라운드는 잘리지 않게
(contain). 선택 = **전체화면 배경 레이어**. 단일 캔버스를 **뷰포트 크기**로 두고 배경(은하·태양계)=cover
그룹, 전경(보드·발사대·HUD·로비 UI)=contain 그룹으로 분리(캔버스 1개 유지). [[50-art-ux/layout]] §1 ·
[[50-art-ux/title-screen]] §1 정본화. 구현(GameScene 캔버스=뷰포트 크기·bg/fg 스케일 그룹 + TitleScreen
배경/UI 분리)은 동시 진행 세션의 GameScene 재구조화이고 브라우저 시각검증이 필요해, 협의/체크포인트 후 진행.

## [2026-06-28] manual | 캔버스 cover-fit 되돌림 → contain(인게임/UI 잘림 방지)
why: 사용자 지시 — 직전 cover-fit이 인게임/UI를 잘라 "UI가 다 짤림"(특히 데스크톱·비-9:16 뷰포트는
대폭 크롭). 단일 캔버스라 배경만 cover·UI만 contain을 동시에 할 수 없으므로, `fitCanvas`를 cover(max)→
**contain(min)**으로 되돌려 9:16 전체가 잘림 없이 보이게 함. 배경 풀블리드는 **게임 캔버스를 자르지 않는**
별도 방식으로 가야 함(구현 방식은 사용자와 협의). [[50-art-ux/layout]] §1 정본화(인게임/UI=contain 보존).
구현: `game/src/GameScene.ts` fitCanvas min. typecheck OK.

## [2026-06-28] manual | Title 행성 자전 추가 + 캔버스 cover-fit(모바일 풀블리드)
why: 사용자 지시 2건. (1) **행성 자전** — Title 공전 행성이 공전과 동시에 자체 축 회전하도록
(`Orbit.spin` 추가, update에서 `rotation = nowMs×spin`, 행성마다 다른 속도·방향). **태양도 제자리에서
느리게 자전**한다(`this.sun.rotation`). [[50-art-ux/title-screen]] §1. (2) **캔버스 cover-fit** — `fitCanvas`를 contain(min)→cover(max)로 바꿔
모바일에서 상하 레터박스 없이 뷰포트를 꽉 채움(넘치는 폭은 잘림); playground 코어는 중앙 안전영역이라
보존, 바깥 배경/HUD 모서리는 가장자리에 닿을 수 있음. [[50-art-ux/layout]] §1 정본화. 구현:
`game/src/TitleScreen.ts`(spin)·`game/src/GameScene.ts`(fitCanvas max). typecheck OK. (코드 파일은
동시 진행 세션 소유라 본 커밋은 docs 정본만.)

## [2026-06-28] manual | HTML 페이지/레터박스 배경을 outerBg로(잔존 와인 제거)
why: 사용자 지시 — 캔버스 바깥(레터박스)에 보이던 와인색을 기본 배경색과 동일하게. `game/index.html`의
`html,body { background }`가 아직 와인 `#3a0d1a`이라 캔버스 둘레에 와인 띠가 보였음 → `outerBg` #15203d
(딥 블루)로 맞춤. [[50-art-ux/art-direction]] 전체 톤에 "캔버스 바깥/HTML 페이지 배경도 outerBg" 명문화.
검증: vite build OK · wide 뷰포트 headed 스크린샷으로 좌우 레터박스 = 캔버스 동색 확인.

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
