# Commit on done (mergegame)

**Hard-ish rule, turn-end only.** When a turn **modifies files in the repo**, end it with a
**git commit** so the user can review that turn's work with `git diff`. A finished turn
should leave a reviewable commit, not a dirty working tree. That is the whole point of this
rule.

This is the *guidance* half. The *gate* half is the `Stop` hook
`.claude/hooks/commit-check.mjs`, which blocks **once** when a turn used a file-writing tool
(Edit / Write / NotebookEdit / MultiEdit) but ran **no `git commit`**, and names the files it
touched. Companion: `.claude/rules/docs-pipeline.md` — reconcile/reflect runs *before* the
commit, so the commit captures the doc updates in the same change.

## When to commit

Commit at the end of any turn that **changed tracked or new files** — code in `game/`, a
`docs/` page, a hook/rule, config. The commit should contain **exactly that turn's work**:
stage the files this turn touched, not a blanket `git add -A` that sweeps in unrelated
pre-existing changes.

## How to commit

1. **Reconcile / reflect docs first** (per the docs pipeline), so the commit includes them.
2. **Stage only this turn's files**, then commit with a **meaningful message** you write
   yourself — subject line + a why. Never let a tool auto-generate the message; a generic
   "update" defeats the review purpose.
3. End the message with the `Co-Authored-By` trailer your environment requires.
4. **Don't push.** Commit only; push only when the user asks.
5. If on `main` and the work is substantial, branch first; for small incremental edits,
   committing on the current branch is fine — the goal is a reviewable diff, not ceremony.

## When to SKIP (say so in one sentence, then stop)

- The turn changed **no files** (pure conversation, search, explanation).
- The user **explicitly said not to commit** this turn.
- The edits are **throwaway scratch** outside the repo (e.g. the scratchpad dir).
- The work is **mid-task and the user asked you to pause** before a logical checkpoint, or
  the working tree has a **large pile of unrelated pre-existing changes** that must be sorted
  with the user before a first commit can be scoped cleanly.

## Guardrails

- **Turn-end only.** Never commit mid-task or checkpoint half-built code unasked.
- **One commit per turn** by default; don't fragment a turn's work into noise.
- **Never auto-generate the message.** A bad message defeats the review purpose.
- **Don't `--no-verify` or skip hooks** unless the user asks.
- **Reminded once, not enforced forever.** The gate blocks one pass, then yields — judgment
  is yours; if a commit is genuinely not wanted, state why and stop.
