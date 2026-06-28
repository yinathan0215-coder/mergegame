---
name: docs-find
description: >
  READ/navigate/search the mergegame 기획문서(docs/) — the agent-executable GDD for the
  HTML5 Merge prototype (Bagelcode assignment). Use whenever you need to LOOK UP what the
  docs already say before answering or building: game concept, core loop, merge systems,
  balancing numbers, art/UX, implementation/build plan, verification/KPI, or methodology.
  This is the find half; to record/update a decision use [[docs-write]]. Triggers on
  "이 문서 확인", "문서 확인", "어디 있어", "찾아", "참고", "~가 뭐였지", "docs", "기획문서",
  "컨셉", "코어 루프", "core loop", "머지", "밸런스", "검증".
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# docs-find — locate & read the GDD ontology

`docs/` is the agent-executable 기획문서 and the single source of truth. This skill is how
you find the right page fast and read from it; pair with [[docs-write]] when an instruction
must be recorded. Pipeline: `.codex/rules/docs-pipeline.md`.

## Ontology shape (what you are navigating)

Every page carries frontmatter you can filter by (schema: `docs/00-meta/conventions.md`):
`id` · `note_type` (index/moc/blueprint/section/system/spec/decision/checklist/research/
methodology/log/input-log/template) · `status` (draft/design/active/archived) ·
`domain` · `updated` · `sources`.

Folders = assignment sections:
`00-meta` · `10-concept` ① · `20-core-loop` ② · `30-systems` (③ input) ·
`40-balancing` ④ · `50-art-ux` ④ · `60-implementation` ③ · `70-verification` ⑤ ·
`80-research` · `90-methodology`.

## How to find (in order)

1. **Top-down via the MOC.** Read `docs/index.md`, then the relevant `<section>/index.md`,
   then drill into 2–5 linked pages. Navigate by links — don't pre-grep.
2. **By ontology field** when the topic is known but the path isn't:
   - a named system → `docs/30-systems/<slug>.md`
   - a number/curve/table → `docs/40-balancing/`
   - a build/stack/structure question → `docs/60-implementation/`
   - a KPI/checklist → `docs/70-verification/`
   - a structural standard → `docs/90-methodology/`
3. **Search fallback** (path or path unknown): `Grep` over `docs/` for the term, `Glob`
   `docs/**/*.md` for paths.
4. **Trace the raw request**: what was actually asked lives verbatim in
   `docs/00-meta/input-log/<date>.md` — read it to disambiguate intent.

## Reading rules

- **Cite `[[path]]`** for any claim you take from a doc.
- **Respect `status`.** A `draft` page (genre detail, stack, most sections right now) is
  **not** settled — don't treat it as decided.
- **Report, don't infer.** If the docs don't state it, say so — don't fabricate the
  undecided. Undecided design is fixed via [[docs-write]], not guessed here.
