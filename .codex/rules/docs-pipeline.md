---
name: docs-pipeline
description: The mandatory log → reconcile → work pipeline for the mergegame 기획문서 (docs/ GDD vault). Every user instruction is logged verbatim, reconciled against the documented design, and only then acted on. Referenced by the docs-input-log and docs-reconcile-check hooks.
---

# Docs pipeline (mergegame)

`docs/` is the **agent-executable 기획문서** for the HTML5 Merge prototype and the
living source of truth that stays current while the prototype is built. The rule: **the
documented design leads, and the work follows it.**

Three stages run every turn. Stage 1 and part of stage 3 are enforced by hooks
(`.codex/hooks/docs-input-log.mjs`, `.codex/hooks/docs-reconcile-check.mjs`); the
judgment in stage 2 is yours. Reading is done with the **`docs-find`** skill, writing with
the **`docs-write`** skill; the turn-end reflect reflex is `.codex/rules/docs-auto-reflect.md`,
loaded into context every session by `.codex/hooks/docs-session-reflect.mjs` (`SessionStart`).

## Stage 1 — Capture (automatic, unconditional)

Every user instruction is appended **verbatim** to
`docs/00-meta/input-log/<YYYY-MM-DD>.md` by the `UserPromptSubmit` hook before you see
the turn. Always, no gate, raw bytes preserved.

- The input log is the **raw record of what was asked**. Do not hand-edit it.
- Keep it separate from the GDD sections, which record what is **designed / decided**.

## Stage 2 — Reconcile (your judgment, BEFORE you build)

When the logged instruction touches the design / content / implementation, reconcile it
against the docs before acting:

1. **Load.** Read `docs/index.md`, then the relevant numbered section index, then 2–5
   targeted pages. Navigate by index/links — don't pre-grep.
2. **Compare.** Does the instruction *change*, *contradict*, or *add to* what the docs
   say?
   - **Contradicts / changes** → update the affected section **first**, so the doc states
     the new design. Note it in `docs/log.md`. If it overrides a prior decision, leave an
     ADR in the section's `decisions/` (use `00-meta/templates/decision-template`).
   - **Adds** → write the new page/section per `docs/00-meta/conventions.md` and link it
     from the section index.
   - **Already matches** → no doc edit; proceed.
3. **Then build** on the corrected docs, citing `[[doc/path]]` for anything you take from
   them.

Conflict you can't resolve → record a `> [!warning] Contradiction` block (see
`conventions.md`) and ask the user. Never silently overwrite a decision.

## Stage 3 — Reflect / verify (turn end)

Two halves keep the final GDD organized as the game is built:

- **Guidance (soft).** `.codex/rules/docs-auto-reflect.md` (loaded each session by the
  `SessionStart` hook, so it is always active) — at turn end, judge whether the
  turn *decided/added* GDD-relevant knowledge and, if so, file it into the right section
  with `docs-write` (page → section index → `docs/index.md` MOC if new → nearest `log.md` →
  bump frontmatter `updated:`). When in doubt, skip; never fabricate undecided design.
- **Gate (hard).** The `Stop` hook (`docs-reconcile-check.mjs`) checks the turn: if it
  carried design/implementation intent but **no `docs/` file was created or edited**, it
  blocks once, **naming the likely target section**. Resolve by reflecting per the rule
  above, **or** by stating in one sentence why no doc change was needed (pure tooling/chore,
  or docs already matched). One pass only — never loop.

## Routing — where things go

| Kind of knowledge | Location | Project scope |
|---|---|---|
| Pipeline rules, schema, templates, **input log** | `docs/00-meta/` | — |
| Concept, target, core fun hypothesis | `docs/10-concept/` | ① |
| Core loop, play flow, onboarding | `docs/20-core-loop/` | ② |
| A named gameplay system / mechanic | `docs/30-systems/<slug>.md` | ③ input |
| Explicit balancing numbers, curves, tables | `docs/40-balancing/` | ④ |
| Art direction, UX guidance | `docs/50-art-ux/` | ④ |
| Tech stack, structure, task breakdown, runbook | `docs/60-implementation/` | ③ |
| KPI, prototype completion checklist | `docs/70-verification/` | ⑤ |
| Reference teardowns, market notes | `docs/80-research/` | 근거 |
| A dated decision (ADR) | `docs/<section>/decisions/<YYYY-MM-DD>-<slug>.md` | — |
| Vault-wide change log | `docs/log.md` | — |
| The built prototype (code) | `game/` (stack TBD) | ③ 산출물 |

Scope genuinely unclear → ask the user rather than guessing a folder. Don't add new
top-level sections without asking.

## Guardrails

- **Reconcile before building.** A design doc the prototype already contradicts is the
  failure this pipeline prevents — fix the doc first.
- **Agent-executability is the bar.** Anything an agent can't infer (a number, an art
  rule, a UX call) gets stated explicitly — that's what `40-balancing/` and `50-art-ux/`
  exist for.
- **Verbatim log is sacred.** Never edit `docs/00-meta/input-log/`.
- **Don't fabricate undecided design.** Genre detail and stack are open → keep affected
  pages `status: draft` with explicit open questions; don't assert.
- **Silent load.** Surface docs only by citing them or naming a doc you updated.
- **One reflect per turn, ≤3 pages.**
