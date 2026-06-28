# Docs auto-reflect (mergegame GDD)

**Soft rule, turn-end only.** At the end of each turn, decide whether the turn produced new
GDD-relevant knowledge and, if so, file it into the right `docs/` section so the final
기획문서 stays the living source of truth. Never mid-task, never silent, never interrupt.

This is the *guidance* half of pipeline stage 3 (reflect). The *gate* half is the `Stop`
hook `.claude/hooks/docs-reconcile-check.mjs`, which blocks once when a design turn ended
with no `docs/` write and names the likely target section. Writing is done with the
[[docs-write]] skill. Companion: `.claude/rules/docs-pipeline.md`.

## When to reflect

File if ANY of these happened **and was decided/added** (not merely discussed):

- A **design decision** was settled (concept, core-loop beat, genre/merge mechanic, UX call).
- A **system / mechanic** was introduced or materially changed → `30-systems/`.
- A **balancing number / curve / table** was fixed → `40-balancing/`.
- An **art or UX rule** an agent can't infer was stated → `50-art-ux/`.
- A **tech-stack / structure / task-breakdown** decision was made → `60-implementation/`.
- A **KPI / completion check** was defined → `70-verification/`.
- A **reference teardown / market fact** was newly established → `80-research/`.

## When to SKIP

- Pure code edits / refactor / rename / lint with no design component.
- Build, CI, tooling, dependency, or hook/skill plumbing changes (this file's own kind).
- Work already fully covered by an existing page (no new facts).
- Anything genuinely undecided — don't fabricate; **ask the user (`AskUserQuestion`) and record
  the decision** rather than parking an open question (see [[docs-write]] "ask & resolve").
- Meta-discussion about the pipeline/ontology itself — **never reflect about reflect** (no
  self-loops).

**When in doubt, skip.** A false reflect (asserting undecided design) is worse than a miss —
the user can always say "기록해줘" explicitly.

## Where to file (route by the decision's nature)

Reuse the routing table in `docs/00-meta/conventions.md`. Quick map:

| Kind of decision | Path |
|---|---|
| Concept / core-fun hypothesis | `docs/10-concept/` |
| Core loop / session flow / onboarding | `docs/20-core-loop/` |
| A named system / mechanic | `docs/30-systems/<slug>.md` |
| Explicit number / curve / cost-drop table | `docs/40-balancing/` |
| Art direction / UX rule | `docs/50-art-ux/` |
| Stack / architecture / task breakdown / runbook | `docs/60-implementation/` |
| KPI / prototype checklist | `docs/70-verification/` |
| Reference teardown / market note | `docs/80-research/` |
| A dated decision that overrides a prior one | `docs/<section>/decisions/<YYYY-MM-DD>-<slug>.md` |
| **Scope unclear** | ask the user — do not guess a folder |

## What to do when triggered

1. **Announce in the end-of-turn summary** (one sentence): `Filing <X> to docs/<path> because <Y>.`
2. **Write the page** via [[docs-write]] — frontmatter + body per `conventions.md`.
3. **Update affected indexes**: the section `index.md`, and `docs/index.md` (MOC) only if
   the page is new / top-level meaningful.
4. **Append the nearest `log.md`**: `## [YYYY-MM-DD] <auto|manual> | <change>` + `why:` line.
   Bump the page's frontmatter `updated:`.
5. If it overrides a prior decision, leave an ADR in the section's `decisions/`.

## Guardrails

- **Turn-end only.** Never mid-task.
- **Never silent.** Always mention the filing in the end-of-turn summary.
- **Never interrupt.** No "should I file this?" mid-flow.
- **Judgment, not obedience.** If nothing substantive was decided, skip even after a long turn.
- **One reflect per turn max, ≤3 pages.** Don't burst.
- **Don't fabricate undecided design.** Undecided → **ask the user (`AskUserQuestion`) and record
  the decision**; never leave a dangling open question parked in a page.
- **Positive canonical, not a changelog.** File the *final* design into the page as positive spec
  — what it IS and what to build, not what changed/was removed/was fixed. No `~가 아닌`·`이전 X`·
  `제거됨`·`오류`·`(X 없음)` in section pages. Bug-fix rationale → **code comments**; dated change
  → `log.md`; superseded decision → `decisions/` ADR.
