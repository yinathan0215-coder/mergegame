---
id: meta-input-log-readme
note_type: index
status: active
domain: meta
updated: 2026-06-27
---

# Input log

The **verbatim, append-only** record of every user instruction, written automatically by
the `UserPromptSubmit` hook (`.claude/hooks/docs-input-log.mjs`) before the assistant
acts on the turn.

## Rules

- **Do not hand-edit.** This is the raw source the GDD sections are reconciled against;
  editing it destroys the audit trail of what was actually asked.
- Each entry: `## <HH:MM:SS> · session <id>` + the prompt exactly as submitted.
- It records what was **asked**. The settled **design/decisions** derived from it live in
  the numbered GDD sections (`10-concept/` … `70-verification/`). Keep the two separate.

## How it feeds the GDD

```
user instruction ──(hook, verbatim)──▶ input-log/<date>.md
                                          │
                              reconcile (compare to GDD sections)
                                          │
                       docs/<NN-section>/… updated if it differs
                                          │
                                  design / build proceeds
```

See [[../knowledge-system-blueprint]] and `.claude/rules/docs-pipeline.md`.
