# mergegame Codex Environment

This project mirrors the Claude docs pipeline under `.codex/` so Codex agents can use
the same GDD workflow.

## Required Workflow

`docs/` is the agent-executable 기획문서 (GDD) and the living source of truth.

For any user instruction that touches design, content, implementation, architecture,
balancing, UX, verification, or research:

1. Read `docs/index.md`, then the relevant numbered section index.
2. Reconcile the request against the current docs before implementing.
3. If the request changes, contradicts, or adds documented truth, update the affected
   docs page and `docs/log.md` first.
4. Build from the corrected docs and cite docs with `[[path]]` when relying on them.
5. At turn end, reflect newly settled GDD-relevant knowledge using
   `.codex/rules/docs-auto-reflect.md`.

Pure tooling or environment chores do not require a docs update when they do not change
the game design or implementation plan.

## Local Rules And Skills

- Pipeline rule: `.codex/rules/docs-pipeline.md`
- Turn-end reflect rule: `.codex/rules/docs-auto-reflect.md`
- Read skill: `.codex/skills/docs-find/SKILL.md`
- Write skill: `.codex/skills/docs-write/SKILL.md`
- Hook scripts: `.codex/hooks/*.mjs`

The `.codex/hooks/` scripts are adapted counterparts of `.claude/hooks/`. If a Codex
hook runner is wired later, point it at `.codex/settings.json`.
