---
id: method-layered-rendering
note_type: methodology
status: active
domain: methodology
updated: 2026-06-27
tags: [methodology, rendering, ui, input]
sources:
  - "raw: ai_agent_friendly_prototype_methodology.md §7"
---

# Layered Rendering: 화면 구조와 입력 우선순위 고정

> 적용: [[../50-art-ux/index|50-art-ux]] (화면·UI·입력). 출처: [[index|방법론 인덱스]].

## 목적
화면 표시 순서·UI 우선순위·입력 차단 규칙을 명확히. 임의 순서 렌더링이나 "팝업 뒤 오브젝트가
클릭되는" 문제를 막는다.

## 권장 레이어 구조
| 순서 | Layer | 역할 | 입력 |
|---:|---|---|---|
| 0 | `BackgroundLayer` | 배경색·패턴·정적 장식 | 없음 |
| 1 | `WorldLayer` | 보드·필드·경로·기준선 | 제한적 |
| 2 | `EntityLayer` | 플레이어·아이템·적·자원 | 상태에 따라 허용 |
| 3 | `EffectLayer` | 코인 팝업·데미지 숫자·파티클 | 없음 |
| 4 | `UILayer` | 재화·타이머·버튼·진행도 | 허용 |
| 5 | `ModalLayer` | 레벨업·결과·튜토리얼 팝업 | 최우선 |
| 6 | `DebugLayer` | FPS·이벤트 로그·KPI 패널 | 개발 중 허용 |

## 레이어별 작성 기준
- `BackgroundLayer` 플레이 방해 없는 단순 배경
- `WorldLayer` 경계·보드·경로를 명확히
- `EntityLayer` Core Loop 대상이 가장 잘 보이게
- `EffectLayer` 피드백을 주되 조작 방해 금지
- `UILayer` 핵심 수치·버튼을 항상 읽히게
- `ModalLayer` 표시 중 뒤쪽 월드 입력 차단
- `DebugLayer` 검증용, 최종 시연에서 숨길 수 있게

## 입력 우선순위 (위 레이어부터 아래로 판정)
1. `ModalLayer` 활성 시 Modal 외 입력 차단
2. `UILayer` 버튼이 입력을 소비하면 월드로 전달 안 함
3. `EntityLayer` 입력은 `Playing`일 때만 허용
4. `EffectLayer`는 기본적으로 입력 없음
5. 디버그 입력은 개발 모드에서만

## 화면 크기·가독성 기준
| 항목 | 권장 |
|---|---|
| 기준 해상도 | 모바일 세로형, 예: 720×1280 |
| 대응 | 비율에 맞춰 중앙 정렬/스케일 |
| 최소 버튼 | 손가락 터치 가능 크기 |
| 핵심 수치 위치 | 상단/고정 HUD |
| 중요 피드백 | 행동 후 즉시 |
| 텍스트 | 작은 화면에서도 읽힘 |

## 아트 방향 기준 (프로토타입 = 핵심 재미 검증 우선)
- 기본 도형·색·텍스트·간단 아이콘으로 표현 (에셋 없어도 구현 가능)
- 같은 기능 오브젝트는 동일 색/형태 규칙
- 위험·보상·성장·클릭 가능 요소는 시각적으로 구분
- 애니메이션은 기능적 피드백 중심으로 제한
- 장식이 Core Loop 이해를 방해하지 않음

## 완료 기준
- 모든 렌더 대상이 명확한 Layer에 배치
- Layer 순서 고정
- Modal 표시 중 뒤쪽 입력 차단
- 주요 UI 수치가 게임 중 항상 읽힘
- Core Loop 대상이 배경·이펙트에 묻히지 않음
- DebugLayer가 검증용으로 분리됨
