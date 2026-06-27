---
id: method-state-machine
note_type: methodology
status: active
domain: methodology
updated: 2026-06-27
tags: [methodology, state-machine, ux]
sources:
  - "raw: ai_agent_friendly_prototype_methodology.md §3"
---

# State Machine / Statechart: 게임 흐름과 UX 판단 고정

> 적용: [[../20-core-loop/index|20-core-loop]], [[../30-systems/index|30-systems]]. 출처: [[index|방법론 인덱스]].

## 목적
게임 진행 흐름·UI 표시·입력 가능 여부를 명확히 고정한다. "팝업 중에도 시간이 흐르는가?",
"튜토리얼 중 실패 가능?", "게임오버 후 어떤 버튼이 보이나?" 를 에이전트가 임의 판단하지 않게 한다.

## 최상위 상태 기준
| 상태 | 설명 | 입력 정책 | 시간 정책 |
|---|---|---|---|
| `Boot` | 앱 초기화 | 입력 없음 | 정지 |
| `Loading` | 리소스·설정 로드 | 입력 없음 | 정지 |
| `Title` | 시작 화면 | 시작 버튼만 | 정지 |
| `Tutorial` | 첫 행동 안내 | 제한 입력만 | 정지 또는 저속 |
| `Playing` | 핵심 루프 | 모든 플레이 입력 | 진행 |
| `RewardPopup` | 보상/레벨업 선택 | 팝업 입력만 | 기본 정지 |
| `Paused` | 일시정지 | 재개/재시작만 | 정지 |
| `Result` | 성공/실패/세션 결과 | 재시작/타이틀만 | 정지 |
| `Restart` | 세션 초기화 | 입력 없음 | 정지 |

상태 이름은 게임 성격에 따라 변경 가능하나, 최소 **플레이 전 / 플레이 중 / 중단·결과** 세
범주는 반드시 구분한다.

## 상태 전이 기준 (표로 작성)
| From | Event | To | 조건 | 부가 처리 |
|---|---|---|---|---|
| `Title` | `START_CLICKED` | `Tutorial` | 첫 실행 | 튜토리얼 UI |
| `Title` | `START_CLICKED` | `Playing` | 튜토리얼 완료 후 | 세션 타이머 시작 |
| `Tutorial` | `FIRST_ACTION_DONE` | `Playing` | 첫 행동 성공 | 기본 UI 전환 |
| `Playing` | `LEVEL_UP` | `RewardPopup` | 레벨업 충족 | 선택지 3개 표시 |
| `RewardPopup` | `UPGRADE_SELECTED` | `Playing` | 선택 완료 | 보상 적용 |
| `Playing` | `FAIL_CONDITION_MET` | `Result` | 체력 0/타이머 종료 | 결과 패널 |
| `Playing` | `PAUSE_CLICKED` | `Paused` | 일시정지 | 시간 정지 |
| `Paused` | `RESUME_CLICKED` | `Playing` | 재개 | 시간 재개 |
| `Result` | `RESTART_CLICKED` | `Restart` | 재시작 | 세션 데이터 초기화 |
| `Restart` | `RESET_DONE` | `Playing` | 초기화 완료 | 새 세션 시작 |

## 상태별 UX 판단 기준 (각 상태마다 명시)
허용 입력 / 차단 입력 / 표시 UI / 숨김 UI / 시간 처리(흐름·정지) / 시스템 활성·비활성 /
진입 처리(1회) / 종료 처리(정리).

## 안티패턴
- `isPlaying`/`isPaused`/`isGameOver`가 동시에 true가 될 수 있다
- 튜토리얼 팝업 중인데 적이 계속 공격
- 결과 화면에서 뒤쪽 오브젝트가 클릭됨
- 레벨업 팝업 중 생산량은 흐르는데 적만 정지 등 시간 정책이 불명확
- 새 세션 시작 시 이전 세션 Entity/이벤트가 잔존

## 완료 기준
- 모든 주요 화면·흐름이 상태로 정의됨
- 전이 조건이 이벤트와 함께 명시됨
- 상태별 입력 가능 여부·시간 흐름이 명확
- Modal/Popup에서 월드 입력 차단 여부 명시
- Restart 시 초기화 대상 정의됨
