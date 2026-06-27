---
name: docs
description: >
  mergegame 기획문서(docs/) skill — read, navigate, and keep current the agent-executable
  GDD for the HTML5 Merge prototype (Bagelcode assignment). Use whenever a question or
  instruction touches game concept, core loop, merge systems, balancing numbers, art/UX,
  the implementation/build plan, or verification/KPI, and whenever you need to record
  newly-decided design. Triggers on "docs", "문서", "기획", "기획문서", "컨셉", "코어 루프",
  "core loop", "머지", "밸런스", "구현 지시", "검증", "이 문서 확인", "문서 갱신".
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# mergegame docs skill

`docs/` is the agent-executable 기획문서 and the living source of truth. This skill is how
you read it, reason from it, and keep it current under the log → reconcile → work pipeline
(`.claude/rules/docs-pipeline.md`).

## Layout (assignment-aligned)

```
docs/
  00-meta/          # pipeline rules, schema, templates, input-log (verbatim instructions)
  10-concept/       # ① concept + core fun hypothesis
  20-core-loop/     # ② core loop + play flow + onboarding
  30-systems/       # detailed merge systems/mechanics (feeds implementation)
  40-balancing/     # ④ explicit balancing numbers, curves, tables
  50-art-ux/        # ④ art direction + UX guidance
  60-implementation/# ③ tech-stack, architecture, task-breakdown, agent-runbook
  70-verification/  # ⑤ KPI / prototype checklist
  80-research/      # reference teardowns, market notes (rationale)
game/               # ③ output: HTML5 prototype (stack TBD → reserved)
```

Entry points: `docs/README.md` (요구사항↔문서 매핑), `docs/index.md` (MOC) → section index
→ targeted pages.

## Reading (start a design/build task)

1. Read `docs/index.md`, then the relevant section index.
2. Drill into 2–5 pages via links — don't pre-grep.
3. Cite `[[path]]` for claims you take from a doc.
4. Respect `status`: a `draft` page (genre detail, stack, most sections right now) is
   **not** settled. Don't treat it as decided.

Search fallbacks: `Grep` over `docs/`, `Glob` for paths.

## Reconciling (an instruction arrived)

Before building:

- Compare the instruction (in `docs/00-meta/input-log/<date>.md`) to the docs.
- **Differs / contradicts** → edit the affected section so it states the new design;
  append `docs/log.md`; add a `decisions/` ADR if it overrides a prior decision.
- **Adds** → create the page from `docs/00-meta/templates/`; link it from the section
  index.
- **Conflict you can't resolve** → `> [!warning] Contradiction` block + ask the user.
  Never silently overwrite.

## Writing rules

- Frontmatter + body per `docs/00-meta/conventions.md`. slug = lowercase kebab-case.
- **Agent-executability is the bar**: state numbers/rules an agent can't infer; decisions
  not options. Undecided → `status: draft` + explicit open question (don't fabricate).
- Never hand-edit `docs/00-meta/input-log/` — verbatim raw source.
- One reflect per turn, ≤3 pages.
