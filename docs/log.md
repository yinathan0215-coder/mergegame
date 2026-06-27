---
id: log
note_type: log
status: active
domain: meta
updated: 2026-06-27
---

# Vault log (mergegame 기획문서)

Append-only. `## [YYYY-MM-DD] <auto|manual> | <change>` + `why:` line.

---

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
