---
id: meta-conventions
note_type: blueprint
status: active
domain: meta
updated: 2026-06-27
---

# Conventions

Frontmatter schema + page rules for the `docs/` GDD vault. Canonical for the docs
pipeline (`.claude/rules/docs-pipeline.md`).

## Frontmatter schema

```yaml
---
id: <slug-unique-in-vault>     # lowercase, kebab-case, stable
note_type: <type>             # see table
status: draft                  # draft | design | active | archived
domain: <section>              # meta | concept | core-loop | systems | balancing | art-ux | implementation | verification | research | methodology
updated: 2026-06-27
tags: [merge, onboarding]      # optional
sources:                       # optional — what this page derives from
  - "[[00-meta/input-log/2026-06-27]]"   # the instruction that produced it
  - "raw: game/src/board.ts"             # repo path — do NOT copy code in
---
```

### `note_type` values

| Value | Purpose | Location |
|---|---|---|
| `index` | Folder catalog / section landing | `<folder>/index.md` |
| `moc` | Master table-of-contents | `docs/index.md` |
| `blueprint` | High-level design / system spec | `00-meta/`, section roots |
| `section` | A required GDD section (concept, core-loop, kpi, …) | numbered folders |
| `system` | One named gameplay system | `30-systems/<slug>.md` |
| `spec` | An agent-facing implementation spec | `60-implementation/` |
| `decision` | ADR — a dated design/tech decision | `*/decisions/<YYYY-MM-DD>-<slug>.md` |
| `checklist` | Verification checklist / KPI list | `70-verification/` |
| `research` | Reference-game teardown / market note | `80-research/` |
| `methodology` | Structural standard module (agent-friendly patterns) | `90-methodology/` |
| `log` | Append-only change log | `docs/log.md` |
| `input-log` | Verbatim instruction capture (hook) | `00-meta/input-log/` |
| `template` | Template for new pages | `00-meta/templates/` |

### Section structure — index(카탈로그) + 정밀 자식 페이지

각 번호 섹션 폴더는 **`index.md`(note_type: `index`) = 카탈로그**(과제 요구 프레이밍 ·
방법론 바인딩 · 자식 페이지 링크 · SSoT 포인터 · status)이고, **상세 내용은 한 주제당
하나의 자식 페이지**(note_type: `section`/`system`/`spec`/`checklist`)에 둔다. 한 `index.md`에
모든 내용을 뭉쳐 쓰지 않는다(30-systems·60-implementation 패턴을 모든 섹션에 적용).

### `status` values

| Value | Meaning |
|---|---|
| `draft` | Placeholder / WIP — **not** settled. Genre detail & stack are `draft`. |
| `design` | Spec authoritative, not yet implemented |
| `active` | Authoritative and reflected in `game/` |
| `archived` | Frozen history — do not edit |

## Agent-executability (the bar every page must clear)

The whole document exists to be handed to a coding agent. So:

- **No undefined hand-waving.** A number, rule, or asset the agent can't infer must be
  stated explicitly (that's what `40-balancing/` and `50-art-ux/` are for).
- **Decisions, not options.** Where the design is settled, state the choice. Where it's
  genuinely open, mark it `draft` with an explicit open question — don't bury ambiguity.
- **Positive canonical spec — destination, not journey.** State what the design IS and what to
  build. A section page is not a changelog: no bug-fix narratives, no change history, no
  negation/contrast (`~가 아닌`, `이전엔 X`, `제거됨`, `오류였다`, `A에서 B로`, `(X 없음)`).
  Route the journey: bug-fix rationale → **code comments**; superseded decision → `decisions/`
  ADR; dated change → `log.md`. Rewrite `X 없음` as a positive statement of what exists.
  (Exception: verification `부정 항목` checks — "Shake 버튼이 없다" — are legitimate test items.)
- **Traceable.** Claims cite a source (`[[…]]` or `raw:`). Implementation specs point at
  the design section they realize.

## Links & slugs

- Internal: `[[60-implementation/tech-stack]]` (vault-relative) or `[[tech-stack]]`
  (filename). Alias with `|`: `[[10-concept/index|concept]]`.
- Repo pointer (don't copy code): `raw: game/src/...` in frontmatter `sources`.
- slug: lowercase kebab-case, no extension.

## Contradictions

New instruction conflicts with an existing claim and the winner is unclear → do **not**
overwrite silently. Mark and ask:

```markdown
> [!warning] Contradiction
> - **Old**: claim A — [[source-a]]
> - **New**: claim B — [[00-meta/input-log/2026-06-27]]
> Unresolved. Needs decision.
```
