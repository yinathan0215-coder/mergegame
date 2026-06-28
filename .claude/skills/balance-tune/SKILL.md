---
name: balance-tune
description: Change Planet Pool Merge game data (balance, layout, or colours) through the single source of truth game/src/data/balance.json. Use this whenever the user asks to tweak ANY tunable value — a planet's radius/score, combo multipliers or window, launch-queue odds, the initial rack, launch feel (drag/power/cooldown/deadzone/V_max), physics (friction/restitution/merge speed), board/HUD layout, or any colour — even when they phrase it as a feel goal ("balls roll too long", "make 지구 bigger", "scoring feels flat") rather than naming a constant. Routes the edit + doc reconcile + typecheck through the sonnet balance-tuner agent so values stay data-driven and the docs stay in sync.
---

# balance-tune

Planet Pool Merge is **data-driven**: every tunable constant lives in one file,
`game/src/data/balance.json`, and `config.ts` / `planets.ts` only load and derive from it. This
skill handles requests to change those values without ever hardcoding them into game logic and
without letting the design docs drift out of sync.

## What to do

Dispatch the **`balance-tuner`** subagent (model: **sonnet**) with the user's change request. It
owns the full workflow: locate the value in `balance.json`, edit it surgically, reconcile the
matching design doc (`docs/40-balancing` for numbers, `docs/50-art-ux` for layout/colours) and
`docs/log.md`, then run `npm --prefix game run typecheck` to confirm nothing broke. Relay its
concise `old → new` diff and verification result back to the user.

Pass the request verbatim plus any specifics the user gave. If the request is ambiguous (which
tiers? by how much? absolute or relative?), let the agent ask — or clarify first if you already see
the gap.

## When this applies

Trigger on any ask to change game numbers, feel, layout, or colour — including indirect, feel-based
phrasings. The agent maps the intent to the right JSON section (`planets`, `combo`, `queue`, `rack`,
`launch`, `physics`, `layout`, `colors`, `engine`).

**Examples**
- "지구 반지름을 30으로 키워줘" → `planets[3].radius: 28 → 30`
- "콤보 윈도우를 1.5초로 늘려" → `combo.windowMs: 1200 → 1500`
- "공이 너무 안 멈춰" → physics feel: raise `friction` / `frictionAir` (launch-physics §13 heuristic)
- "발사대 배경색 더 어둡게" → `colors.pocket` (layout/colour → 50-art-ux)

## What this is NOT for

- New mechanics, systems, or screens — that's design work (use the docs pipeline / `docs-write`),
  not a value tweak.
- Editing `config.ts` / `planets.ts` directly — those are loaders; the value source is the JSON.
- Pure code refactors with no tunable-value change.
