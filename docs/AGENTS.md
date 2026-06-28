# DOCS VAULT GUIDE

## OVERVIEW

`docs/` is the agent-executable GDD and the living source of truth for Planet Pool Merge.
Read it before changing game behavior, tuning, UX, verification, or implementation plans.

## STRUCTURE

```text
docs/
|-- 00-meta/           # schema, templates, pipeline metadata, append-only input log
|-- 10-concept/        # concept, target, fun hypothesis, planet ladder
|-- 20-core-loop/      # session loop and play flow
|-- 30-systems/        # named mechanics and gameplay systems
|-- 40-balancing/      # explicit numbers, curves, scoring, physics
|-- 50-art-ux/         # art direction, layout, input UX, screen structure
|-- 60-implementation/ # stack, architecture, task plan, runbook, ADRs
|-- 70-verification/   # KPI, checklist, audit notes
|-- 80-research/       # reference teardowns and market notes
`-- 90-methodology/    # structural standards for agent-friendly specs
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Start navigation | `docs/index.md` | Master map; follow links instead of blind search first. |
| Page schema | `docs/00-meta/conventions.md` | Frontmatter, statuses, note types, contradiction block. |
| Raw user request | `docs/00-meta/input-log/<date>.md` | Verbatim source; do not edit. |
| Implementation scope | `docs/60-implementation/agent-runbook.md` | Scope fence and execution order. |
| Tech/architecture | `docs/60-implementation/tech-stack.md`, `architecture.md` | PixiJS + Matter.js decision and module boundaries. |
| Methodology rules | `docs/90-methodology/` | State machine, loop, data-driven, ECS-lite, acceptance-test rules. |
| Known audit issues | `docs/70-verification/audit-methodology-numbers.md` | Existing mismatch notes to reconcile before touching related code. |

## CONVENTIONS

- Every content page has frontmatter. Preserve `id`, `note_type`, `status`, `domain`,
  `updated`, and `sources` semantics from `00-meta/conventions.md`.
- Section `index.md` files are catalogs, not dumping grounds. Put details in child pages.
- Use `status: draft` for unsettled facts, `design` for authoritative specs not fully
  implemented, and `active` only when reflected in `game/`.
- When adding a page, update its section index. Update `docs/index.md` only for new
  top-level meaningful entries.
- For a decided change, append the nearest `log.md`; the vault-wide log is `docs/log.md`.
- Use vault wiki links like `[[60-implementation/tech-stack]]`; do not replace them with
  filesystem-only prose.

## ANTI-PATTERNS

- Never edit `docs/00-meta/input-log/` by hand.
- Never fabricate undecided design to make implementation easier.
- Never silently replace a conflicting claim. Use the documented contradiction block and
  ask when the winner is unclear.
- Do not reflect about the docs pipeline itself; tooling chores usually need no GDD write.
- Do not burst-reflect: one reflect per turn, maximum three pages.
- Do not copy source code into docs; point to `raw: game/src/...` in `sources` when needed.
