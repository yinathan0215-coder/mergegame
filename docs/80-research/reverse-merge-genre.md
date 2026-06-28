---
id: reverse-merge-genre
note_type: research
status: draft
domain: research
updated: 2026-06-28
tags: [research, merge, suika, reference]
sources:
  - "[[00-meta/input-log/2026-06-28]]"
---

# 레퍼런스 조사 ① — "launch / 역방향 머지" 장르 분해

> 과제 요구: **근거**(레퍼런스). 이 페이지는 *조사 보고서*이며 설계 결정(스펙)이 아니다.
> 장르·메커닉 확정은 아직 열려 있음 → 모든 항목 `draft`.

## 검증 상태 범례

- ✅ **검증** — 2026-06-28 이 세션에서 1차 출처를 직접 재확인.
- 🟡 **출처 주장** — deep-research 워크플로가 수집했으나 검증 단계가 전부
  rate-limit(`Server is temporarily limiting requests`)으로 실패 → 독립 재검증 안 됨.
  (워크플로 결과의 "25 claims killed"는 **claim이 틀려서가 아니라** 검증 투표가 0-0 abstain으로
  기계 처리된 false-negative다. 원자료 자체는 유효.)

## Summary

사용자가 만들고 싶어 하는 게임의 정체는 **"물리 발사(launch) 기반 역방향 머지"** —
Suika(수박게임)류 *fruit-drop physics merge*에서 **중력 낙하 대신 조각을 측면/상방으로
발사·이동시켜** 같은 등급끼리 충돌하면 한 단계 진화하는 변형이다. 두 레퍼런스가 이 정의를
양쪽에서 고정한다:

1. **Tasty Travels의 "launch 모드"** = 본편이 아니라 **광고 크리에이티브(playable/fake ad)
   속 물리 미니게임**으로 보인다. 실제 본편(Century Games)은 *보드형 머지*(드래그 병합)이고
   발사 메커닉이 없다. 유저들이 "광고에 나온 미니게임이 본편엔 없다"고 불평하는 전형적 UA 패턴. ✅
2. **Juice Merge / Merge Fruit Juice** = "주스를 원하는 방향으로 밀어/쏘아 보내 같은 주스끼리
   만나면 합쳐지는" **측면 발사형 역(逆)-Suika**. 이것이 "역방향 머지"의 문자 그대로의 메커닉. ✅

## Details

### 1. Tasty Travels: Merge Game (Century Games) — "launch 모드"의 정체

| 항목 | 내용 | 검증 |
|---|---|---|
| 개발/배급 | Century Games Pte. Ltd. (싱가포르) | ✅ |
| 패키지 / 스토어 | Android `com.fatmerge.global`, iOS id6471045672 | ✅ |
| 출시 | Google Play 2023-12, App Store 2024-04-11 | ✅ |
| 규모 | 13M+ 다운로드, 4.5★, 월 ~3M 신규 (블로그 출처) | 🟡 |
| **본편 코어 루프** | 스포너(producer) 탭 → **에너지 소모** → 기본 아이템 획득 → 같은 아이템 2개 **드래그 병합** → 관광객 주문 완료 → 코인 → 도시(파리/도쿄 등) 여행·스토리 해금 | ✅ |
| 본편 정체 | **보드형(타일) 머지** — Merge Mansion / merge-2 계열. 물리·발사 메커닉 **없음** | ✅ |

**"launch 모드" 핵심 발견** ✅: 공식 페이지·스토어 어디에도 발사/launch 모드 기재가 없다.
대신 검색에서 다수 유저가 *"광고에 나온 미니게임(예: 드링크 글래스를 밀어/슬라이드시키는 게임)을
본편에서 몇 시간을 해도 찾을 수 없다 — 광고에 속았다"* 고 불평한다. 즉:

> **"Tasty Travels의 launch 모드"는 본편 기능이 아니라, 유저 획득용 광고에 등장하는
> 물리 발사/슬라이드 미니게임(실제 게임엔 거의/전혀 없는 "fake playable")일 개연성이 높다.**

이 광고-미니게임이 바로 사용자가 흥미를 둔 "launch + juice 슬라이드" 메커닉이며, **본 과제는
그 광고 속 미니게임을 실제로 플레이 가능한 HTML5 프로토타입으로 만드는 방향**으로 읽힌다.
(이 해석은 조사 결과에 근거한 *관찰*이지 확정 설계 아님 → [[../10-concept/index]]에서 컨셉으로
확정할 때 결정.)

### 2. "역방향 머지(reverse merge)"의 정의 — Merge Fruit Juice

| 항목 | 내용 | 검증 |
|---|---|---|
| 타이틀 | Merge Fruit Juice (개발 Stormborn) | ✅ |
| 패키지 | `com.stormborn.reverse.juice.suika` (이름에 literally `reverse.juice.suika`) | ✅ |
| 메커닉 | "주스를 **원하는 방향으로 밀어/쏘아 보낸다** → 같은 주스끼리 만나면 합쳐져 더 큰 주스로 진화. **떨어뜨리는 게 아니라 한쪽에서 반대쪽으로 보냄**" | ✅ |
| 진화 체인 | Suika와 동일 원리: 동일 등급 충돌 → 한 단계 큰 조각(작은 컵 → 점점 큰 주스) | 🟡 |

→ **"역방향(reverse) = 위에서 떨어뜨리는 fruit-drop의 반대 = 측면/상방으로 능동 발사."**
중력 낙하 입력(drop)을 **방향 발사 입력(launch/slide)**으로 바꾼 것이 장르 변형의 핵심. ✅

비교 레퍼런스(드롭형, 역방향 아님 — 대조군):
- **Juice Merge!** (`com.thinkery.cocktailmerge`, Slash Games) — 칵테일 테마 **드롭형** Suika 클론.
  유리잔에 과일 낙하 → 병합 → 넘치면 실패. "reverse" 문자열은 CSS 키프레임 이름뿐, 발사 메커닉 아님. 🟡
- **Fruit Merge: Juicy Drop** (crazygames) — 표준 드롭형 Suika. 역방향 아님. 🟡

### 3. 장르 원형 — Suika / Watermelon Game

| 항목 | 내용 | 검증 |
|---|---|---|
| 원작 | Suika Game, Aladdin X(일본). 디지털 프로젝터용으로 2021-04 개발, 2021-12 Nintendo eShop(일본) | ✅ |
| 메커닉 3요소 | (a) 물리 충돌(낙하·굴림) + (b) **동일 등급만** 병합 + (c) 진화 체인(작은 과일 → 수박) | ✅ |
| 실패 조건 | 컨테이너 상단 위험선 초과 시 게임오버 | 🟡 |
| 입력 | 상단에서 위치를 정해 **드롭**(원작). 역방향 변형은 이 드롭을 **발사**로 교체 | ✅ |

## 시사점 (조사 관찰 — 설계 결정 아님)

- 사용자 의도 = **`Tasty Travels 광고형 launch 미니게임` ∩ `Juice Merge 역방향(측면/상방 발사)`**
  → 한 줄 정의: **"같은 등급 조각을 방향 발사해 충돌·병합시키는 Suika 변형(reverse/launch merge)."**
- "게임적인 렌더 + 모바일 중심" 요구와 잘 맞음: 물리 충돌·튐·합체 연출은 그리드형보다 비주얼이
  풍부하고, 한 손 방향 입력(드래그/조준)으로 원핸드 모바일 플레이가 가능.
- 기술적으로 HTML5에서 **2D 물리엔진(matter.js 등) + 렌더러** 조합으로 구현 가능 →
  상세는 [[open-source-stack]].

## Relates to
- [[index]] — 리서치 섹션
- [[open-source-stack]] — 이 메커닉의 오픈소스 구현·기술스택
- [[market-notes]] — 머지 장르 시장·수익화
- [[../10-concept/index]] — 이 근거가 뒷받침할 컨셉(아직 미확정)

## 검증 한계 (rate-limit 미독립검증)
> 본 게임의 발사 방향은 **상방(발사 중점에서 위로 부채꼴 90° 발사)으로 확정**됐다 — 정본
> [[../30-systems/launcher]] · [[../50-art-ux/screen-structure]].

- "Tasty Travels launch 모드"가 본편 내 이벤트/미니게임으로 존재하는지(광고 전용 여부)는 본편
  장기 플레이 영상으로만 확인 가능 — 본 리서치는 *광고 미니게임 가설*을 유력 가설로 채택한다.
- 다운로드 수·진화 체인 세부·대조군 클론 메커닉은 검증 단계 rate-limit으로 독립검증을 마치지
  못한 항목이다(레퍼런스 근거로만 사용, 수치 인용 시 재확인 권장).
