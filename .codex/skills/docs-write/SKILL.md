---
name: docs-write
description: >
  WRITE/update/reconcile/reflect the mergegame 기획문서(docs/) — the agent-executable GDD
  for the HTML5 Merge prototype (Bagelcode assignment). Use whenever a decision is made or
  an instruction changes/contradicts/adds to the docs, and to file turn-end design changes
  so the final GDD stays the living source of truth. This is the write half; to look up
  existing pages first use [[docs-find]]. Triggers on "문서 갱신", "기획 결정", "반영",
  "정리", "결정했", "확정", "ADR", "밸런스 확정", "구현 지시", "이 문서 갱신", "docs 업데이트".
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# docs-write — author, reconcile & reflect the GDD

`docs/` is the agent-executable 기획문서 and the living source of truth — it must stay
current as the game is built. This skill writes it. Find the target first with
[[docs-find]]. Full pipeline: `.codex/rules/docs-pipeline.md`; turn-end reflex:
`.codex/rules/docs-auto-reflect.md`.

## Reconcile (an instruction arrived) — BEFORE you build

Compare the logged instruction (`docs/00-meta/input-log/<date>.md`) to the docs:

- **Differs / contradicts** → edit the affected section so it states the new design;
  append the nearest `log.md`; add a `decisions/<YYYY-MM-DD>-<slug>.md` ADR if it overrides
  a prior decision (template: `docs/00-meta/templates/decision-template.md`).
- **Adds** → create the page from `docs/00-meta/templates/section-template.md`; link it
  from the section `index.md`.
- **Already matches** → no edit; proceed.
- **Conflict you can't resolve** → write a `> [!warning] Contradiction` block
  (`conventions.md`) and ask the user. Never silently overwrite.

## Reflect (turn end) — keep the final GDD organized

At turn end, if the turn decided/added GDD-relevant knowledge, file it (full criteria &
routing: `.codex/rules/docs-auto-reflect.md`). The housekeeping set for every write:

1. Write/edit the **page** (right folder by routing table in `conventions.md`).
2. Refresh the **section `index.md`** (and `docs/index.md` MOC if the page is new).
3. Append the nearest **`log.md`**: `## [YYYY-MM-DD] <auto|manual> | <change>` + `why:`.
4. Bump the page's frontmatter **`updated:`** date.

## Writing rules

- Frontmatter + body per `docs/00-meta/conventions.md`. `id`/slug = lowercase kebab-case.
- **Agent-executability is the bar**: state numbers/rules an agent can't infer; decisions,
  not options. Genuinely undecided → `status: draft` + an explicit open question (don't
  fabricate).
- **Never hand-edit `docs/00-meta/input-log/`** — verbatim raw source.
- One reflect per turn, ≤3 pages. Don't reflect about the pipeline itself.
