# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-28
**Commit:** 8e17e87
**Branch:** main

## OVERVIEW

`mergegame` is a docs-first HTML5 playable prototype for Planet Pool Merge, a vertical
merge/pool game. The source of truth is `docs/`; the runnable prototype is the nested
Vite + TypeScript + PixiJS + Matter.js app in `game/`.

## STRUCTURE

```text
./
|-- docs/        # agent-executable GDD vault; reconcile here before behavior changes
|-- game/        # runnable prototype package; all build/test commands run here
|-- .claude/     # Claude hook/rule mirror for the docs pipeline
|-- .codex/      # Codex hook/rule mirror and local docs skills
|-- game.js      # legacy standalone prototype script; not loaded by game/index.html
|-- CLAUDE.md    # older top-level operating guide; this AGENTS.md is the Codex entry
`-- repo.json    # upstream/repo metadata
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Understand current design | `docs/index.md` | Start here, then follow the numbered section index. |
| Change gameplay rules | `docs/30-systems/` | Update docs before code if behavior changes. |
| Change numbers/tuning | `docs/40-balancing/` and `game/src/data/balance.json` | `balance.json` is the code-side SSoT. |
| Change layout/art/UX | `docs/50-art-ux/` and `game/src/data/balance.json` | Do not scatter constants through systems. |
| Implement prototype behavior | `game/src/GameScene.ts` | Composition root; delegates to small systems. |
| Verify behavior | `game/tests/play.spec.ts` | Playwright acceptance suite through `window.__game`. |
| Follow local Codex workflow | `.codex/AGENTS.md` | Mirrors the docs pipeline and hook files. |

## CODE MAP

Graph centrality is unmeasured in this checkout: the code-review graph has 0 files indexed
and the LSP MCP was unavailable during generation. This map is from source imports/symbols.

| Symbol | Type | Location | Refs | Role |
|---|---|---|---|---|
| `GameScene` | class | `game/src/GameScene.ts` | unmeasured | App composition root; creates Pixi, Matter, systems, debug hooks. |
| `PhysicsWorld` | class | `game/src/PhysicsWorld.ts` | unmeasured | Matter engine, walls, one-way line, collision callbacks. |
| `Launcher` | class | `game/src/Launcher.ts` | unmeasured | Pointer input, aiming, shot power, fire flow. |
| `MergeSystem` | class | `game/src/MergeSystem.ts` | unmeasured | Same-tier collision processing and next-tier spawn. |
| `QueueSystem` | class | `game/src/QueueSystem.ts` | unmeasured | Three-slot launch queue state. |
| `ScoreSystem` | class | `game/src/ScoreSystem.ts` | unmeasured | Score and combo multiplier state. |
| `BoardRenderer` | class | `game/src/BoardRenderer.ts` | unmeasured | Static board/background rendering. |
| `Hud` | class | `game/src/Hud.ts` | unmeasured | Score, queue, and visible UI layer. |
| `makePlanetSprite` | function | `game/src/PlanetFactory.ts` | unmeasured | Tier-specific Pixi graphics generation. |
| `DESIGN`, `PHYSICS`, `LAUNCH`, `COMBO` | consts | `game/src/data/config.ts` | unmeasured | Derived code constants loaded from `balance.json`. |
| `TIERS`, `INITIAL_RACK` | consts | `game/src/data/planets.ts` | unmeasured | Planet ladder, queue candidates, initial rack. |

## CONVENTIONS

- The workflow is log -> reconcile docs -> work. For design/content/implementation
  changes, read `docs/index.md` plus the relevant numbered section before editing code.
- If the request changes or contradicts documented truth, update the docs and `docs/log.md`
  first, then implement from the corrected docs.
- Cite docs as `[[path]]` when relying on them in discussion or implementation notes.
- Treat `docs/00-meta/input-log/` as append-only hook output. Never hand-edit it.
- Treat unresolved design as `status: draft`; do not invent missing decisions.
- The operational root for app commands is `game/`, not the repository root.
- There is no repo-wide lint/format config. The enforced code gate is TypeScript
  typecheck/build plus Playwright acceptance tests.

## ANTI-PATTERNS (THIS PROJECT)

- Do not silently overwrite a doc conflict. Record a contradiction block and ask if the
  winner is unclear.
- Do not hardcode balance/layout literals in systems or render code; load from
  `game/src/data/balance.json` through the data modules.
- Do not treat `game.js` as the Vite app entry. `game/index.html` loads `src/main.ts`.
- Do not introduce true ECS machinery or generic component registries; methodology calls
  for ECS-lite only.
- Do not spread boolean/timestamp state soup where a documented state machine is required.
- Do not add docs burst updates: one turn-end reflect, maximum three pages.

## UNIQUE STYLES

- This repo is intentionally GDD-first. The docs are not background notes; they drive code.
- `docs/` is also an Obsidian vault, so keep vault-relative wiki links intact.
- The app uses a debug contract on `window.__game` for acceptance tests.
- Built output uses Vite `base: './'` so static artifacts can run from relative paths.

## COMMANDS

```bash
cd game && npm install
cd game && npm run dev
cd game && npm run typecheck
cd game && npm run build
cd game && npx playwright test
cd game && npm run preview
```

## NOTES

- Dev server is pinned to `http://localhost:5199` with `strictPort: true`.
- Preview uses port `5174`; do not assume it matches dev.
- Playwright starts/reuses the Vite dev server and runs desktop plus mobile viewport
  projects.
- Generated/runtime directories may exist locally under `game/` (`dist/`,
  `test-results/`, `playwright-report/`, `node_modules/`); do not treat them as source.
