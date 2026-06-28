---
name: methodology-audit
description: >
  AUDIT & SCORE the built prototype (game/src/**) against the methodology standard
  (docs/90-methodology — ECS-lite · State Machine · Game Loop/Fixed Step · Data-driven ·
  Event-driven · Layered Rendering · Acceptance-test) PLUS the Single-Responsibility /
  과집중(god-object) lens and the karpathy dev guidelines. Produces a 0–100 health score and
  writes a timestamped report to docs/70-verification/audits/ with a prioritised fix worklist
  that a LATER turn uses to refactor. Use whenever the user asks to 점검/감사/평가/점수 the code,
  check 방법론 준수, hunt 과집중·단일책임·갓오브젝트·책임 분리 problems, or wants a code-health /
  compliance report. Triggers on "감사", "점검해", "점수 매겨", "방법론 준수", "과집중", "단일책임",
  "갓오브젝트", "책임 분리", "코드 건강", "audit", "compliance", "score the code". This is the
  AUDIT half (read-only diagnosis); the actual refactor is a separate step driven by the report.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
---

# methodology-audit

Planet Pool Merge declares its build standard in `docs/90-methodology` (the generic AI-Agent
Friendly stack) and instantiates it in the GDD sections. The methodology **states** the
principles — but nothing **verifies** them, which is how a 380-line `GameScene` orchestrator
(5 responsibilities) passed despite `ecs-lite` forbidding god-objects. This skill is that
missing verification layer: it scores the code against every methodology pillar **plus** the
single-responsibility lens, and records a dated report so the gaps become an actionable
worklist instead of a vibe.

**It is audit-only.** It never edits `game/` code. It writes one report and stops. The fix is a
separate, later turn that reads the report (see "수정 프로세스" below). Keeping diagnosis and
repair apart keeps each report a clean snapshot you can diff over time.

## When to run

- The user asks to score / audit / 점검 / 감사 / 평가 the prototype or its methodology compliance.
- The user suspects 과집중 / 단일책임 / 갓오브젝트 / 책임 분리 problems.
- After a refactor, to confirm the score moved (re-run and compare to the previous report).

## Process

1. **Load the standard.** Read `docs/90-methodology/index.md` + the pillar pages relevant to a
   finding (`ecs-lite`, `state-machine`, `game-loop`, `data-driven`, `event-driven`,
   `layered-rendering`, `acceptance-test`, `agent-friendly-spec`). Read the karpathy guidelines
   (global `~/.claude/CLAUDE.md` §1–4, or the `karpathy-guidelines` skill). The detailed,
   per-pillar checks + anti-patterns live in `references/rubric.md` — **read it; it is the
   scoring key.**
2. **Inventory the code.** List `game/src/**` with line counts
   (`find game/src -name '*.ts' -o -name '*.json' | xargs wc -l | sort -n`). Note the git short
   SHA (`git rev-parse --short HEAD`) so the report pins what was audited.
3. **Score each dimension 0–5** against `references/rubric.md`, citing `file:line` evidence for
   every score below 5. Be specific and adversarial — a score with no cited evidence is invalid.
4. **Detect 과집중 (over-concentration).** For each module list its distinct responsibilities in
   one phrase each. Flag any file that holds **≥3 responsibilities** OR exceeds **~250 lines** of
   non-data logic as a god-object candidate, and name the split. (Data SSoT files like
   `balance.json` are *exempt* — concentrating tunables in one file is the methodology's
   *recommended* pattern, not a smell. Distinguish the two explicitly.)
5. **Compute the weighted score** (table below) → `NN/100`.
6. **Stamp + write the report.** Get the time with `date "+%Y-%m-%d %H:%M %z"`; write to
   `docs/70-verification/audits/<YYYY-MM-DD-HHmm>-<slug>.md` using the template below.
7. **Reconcile (docs pipeline).** Add a one-line link under `docs/70-verification/index.md`
   "## 감사 로그", and append `docs/log.md` (`## [date] auto | audit <score>/100` + `why:`).
8. **Report to the user**: the score, the score table, and the top 3 P1 fixes. Then **stop** —
   do not touch game code.

## Scoring dimensions & weights

| # | 차원 (dimension) | 가중 | 무엇을 보나 (핵심) |
|---|---|---:|---|
| 1 | Data-driven / SSoT | 15 | 튜너블이 `balance.json` 한 곳인가, 로더에 하드코딩 리터럴 누수 없나 |
| 2 | 단일책임 / 과집중 | 15 | 한 파일=한 책임인가, 갓오브젝트(≥3책임)·250줄+ 로직 덩어리 없나 |
| 3 | Acceptance-test / 검증 | 12 | Core Loop을 검증하는 관찰 가능한 테스트가 도는가 |
| 4 | State Machine | 12 | 흐름이 상태로 고정됐나, boolean 플래그(`paused`)로 흐름 암묵화 안 했나 |
| 5 | ECS-lite 분해 | 10 | Entity/Component/System 분리, 렌더↔규칙 분리 |
| 6 | Game Loop / Fixed Step | 10 | 고정 스텝·deltaTime·상한·catch-up, 시간 기준(프레임 비종속) |
| 7 | Event-driven | 10 | 시스템 직접결합 없나, 이벤트/콜백 경계 명확한가 |
| 8 | Layered Rendering | 8 | 레이어 순서·입력 우선순위·모달 차단 |
| 9 | Code discipline (karpathy) | 8 | 죽은 코드·과잉 추상화·미사용 없나(Simplicity), 테스트로 검증(Goal-driven) |

**Contribution** = `weight × (score / 5)`. **Total** = Σ → `NN/100`.

**Score scale (0–5):** 5 = 모범(완료기준 충족·안티패턴 0) · 4 = 양호(사소한 누수) · 3 = 부분(원칙은
따르나 명확한 갭/안티패턴) · 2 = 약함 · 1 = 형식만 · 0 = 부재. Anchor each score with the
pillar's own 완료기준/안티패턴 list in `references/rubric.md`.

## Report template

ALWAYS write the report in exactly this shape:

```markdown
---
id: audit-<YYYY-MM-DD-HHmm>
note_type: audit
status: report
domain: verification
created: <YYYY-MM-DD HH:MM KST>
target: game/src @ <git-short-sha>
score: <NN>/100
tags: [audit, methodology, srp, health]
---

# 방법론 준수 감사 — <YYYY-MM-DD HH:MM>

> 대상: `game/src/**` (<N>파일 / <L>줄) ↔ docs/90-methodology 7기둥 + 단일책임 + karpathy.
> 종합 **<NN>/100**. **감사 보고서(읽기 전용 진단)** — 수정은 §수정 워크리스트를 별도 단계에서.

## 점수표
| 차원 | 가중 | 점수(0–5) | 기여 | 근거(file:line) |
|---|---:|---:|---:|---|
| ... | ... | ... | ... | ... |
| **종합** | **100** | | **<NN>** | |

## 발견 (severity 순)
### 🔴 <제목> — <차원>
- 증거: `file:line`
- 방법론 위반: [[../../90-methodology/<pillar>]] "<인용>"
- 영향: <한 줄>

### 🟡 <제목> — <차원>
...

## 수정 워크리스트 (우선순위·다음 단계 입력)
- [ ] **P1** <행동> — 근거 §발견, 검증: <어떻게 확인>
- [ ] **P2** ...
- [ ] **P3** ...

## 추적
- 이전 감사: <링크 또는 "최초">
- 다음: 이 워크리스트로 **수정 프로세스**(아래) 진행 → 완료 후 재감사하여 점수 비교.
```

## 수정 프로세스 (별도 단계 — 이 스킬은 실행하지 않음)

The report is the worklist. A later turn (or the user explicitly asking "이 감사 기반으로 수정해")
runs the fix loop, which is a deliberate separate step so each audit stays a clean snapshot:

1. **Read the latest report** in `docs/70-verification/audits/` (newest timestamp).
2. **Take P-items top-down.** Each is one surgical change tracing to one finding (karpathy
   §3 — touch only what the finding names). Reconcile the affected `docs/` page **first** if the
   fix changes documented design (e.g. splitting `GameScene` updates
   `60-implementation/architecture`; modelling the modal-pause as a state updates
   `20-core-loop/screen-flow`).
3. **Verify each fix** against its worklist "검증:" note + `npm run typecheck` + the Playwright
   acceptance suite (`game/tests/play.spec.ts`) — green before and after.
4. **Re-run this audit** and confirm the dimension's score rose; link old→new in "추적".
5. Commit per `.claude/rules/commit-on-done.md`.

Don't batch unrelated fixes, and don't let a refactor outrun the docs — the documented design
leads (`.claude/rules/docs-pipeline.md`).
