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
[[docs-find]]. Full pipeline: `.claude/rules/docs-pipeline.md`; turn-end reflex:
`.claude/rules/docs-auto-reflect.md`.

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
routing: `.claude/rules/docs-auto-reflect.md`). The housekeeping set for every write:

1. Write/edit the **page** (right folder by routing table in `conventions.md`).
2. Refresh the **section `index.md`** (and `docs/index.md` MOC if the page is new).
3. Append the nearest **`log.md`**: `## [YYYY-MM-DD] <auto|manual> | <change>` + `why:`.
4. Bump the page's frontmatter **`updated:`** date.

## Writing rules

- Frontmatter + body per `docs/00-meta/conventions.md`. `id`/slug = lowercase kebab-case.
- **Agent-executability is the bar**: state numbers/rules an agent can't infer; decisions,
  not options.
- **No lingering open questions — ask & resolve.** A finished page holds decisions, not open
  questions. When reconciling/reflecting hits something undecided (an ambiguous or **truncated**
  instruction, or a fork with no obvious default), **ask the user with `AskUserQuestion` in the
  same turn**, then write the resolved decision into the page as positive spec and **delete the
  matching `## Open questions` item**. Never end a turn with an unresolved open question parked
  in a page. If the user explicitly defers, record the *decided behavior/scope* now (e.g. "설정
  버튼은 설정 창을 연다; 내부 항목은 차후 스펙") — a settled statement, not a dangling question.
  Don't fabricate a decision the user hasn't made — ask.
- **Positive canonical spec — record the destination, not the journey.** Write each page as the
  FINAL design: state what it IS and what an agent must build. Do NOT write bug-fix narratives,
  change history, or negation/contrast framing (`~가 아닌`, `이전엔 X`, `제거됨`, `오류였다`,
  `A에서 B로 바꿈`, parenthetical `(X 없음)`). The reader needs the current truth, not how it
  got there. The journey lives elsewhere: **bug-fix rationale → code comments**; a superseded
  decision → a `decisions/` ADR; the dated change → `log.md`. Rewrite `X 없음` as a positive
  description of what exists. (Verification `부정 항목` like "Shake 버튼이 없다" are legitimate
  *checks*, not spec prose — those stay.)
- **Never hand-edit `docs/00-meta/input-log/`** — verbatim raw source.
- One reflect per turn, ≤3 pages. Don't reflect about the pipeline itself.
