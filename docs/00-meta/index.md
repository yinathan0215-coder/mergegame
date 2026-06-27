---
id: meta-index
note_type: index
status: active
domain: meta
updated: 2026-06-27
---

# 00-meta

How the GDD vault operates: the pipeline, the page schema, the templates, and the
verbatim input log. (This folder is operational infrastructure — it is **not** part of
the submitted document body.)

## Pages

- [[knowledge-system-blueprint]] — what this vault is (assignment context + topology + rules)
- [[conventions]] — frontmatter schema + agent-executability bar
- [[input-log/README]] — verbatim instruction log (hook-written, append-only)

## Templates

- [[templates/section-template]] — a required GDD section
- [[templates/decision-template]] — a dated design/tech decision (ADR)

## Pipeline (summary)

Every turn: **log → reconcile → work**.

1. **Log** — `UserPromptSubmit` hook appends the instruction verbatim to
   `input-log/<date>.md` (always).
2. **Reconcile** — before building, update any GDD section the instruction changes.
3. **Work** — build on the corrected docs; the `Stop` hook checks a doc was touched.

Full spec: `.claude/rules/docs-pipeline.md`.
