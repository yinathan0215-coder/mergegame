# GAME PACKAGE GUIDE

## OVERVIEW

`game/` is the runnable prototype package. It is a Vite + TypeScript app using PixiJS for
2D rendering and Matter.js for physics; all app commands run from this directory.

## STRUCTURE

```text
game/
|-- index.html              # browser entry; loads /src/main.ts
|-- src/main.ts             # creates GameScene
|-- src/GameScene.ts        # composition root and debug API owner
|-- src/data/balance.json   # single source of truth for tunable numbers
|-- src/data/config.ts      # derived layout/physics/config exports
|-- src/data/planets.ts     # planet ladder, queue candidates, initial rack
|-- tests/play.spec.ts      # Playwright acceptance suite
|-- package.json            # scripts and dependencies
|-- vite.config.ts          # dev/build port/base config
`-- playwright.config.ts    # test server and viewport projects
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| App bootstrap | `index.html`, `src/main.ts` | `main.ts` mounts `GameScene`. |
| Runtime wiring | `src/GameScene.ts` | Creates app, systems, ticker, resize, `window.__game`. |
| Balance/layout changes | `src/data/balance.json` | Edit here, then loaders expose typed constants. |
| Physics boundary/collision | `src/PhysicsWorld.ts` | Matter engine, walls, one-way line, callbacks. |
| Shot input | `src/Launcher.ts` | Pointer drag/release and debug fire path. |
| Merge behavior | `src/MergeSystem.ts` | Collision pair processing and remerge delay. |
| Queue/scoring | `src/QueueSystem.ts`, `src/ScoreSystem.ts` | Small state helpers. |
| Rendering/HUD | `src/BoardRenderer.ts`, `src/Hud.ts`, `src/PlanetFactory.ts` | Pixi display objects. |
| Acceptance tests | `tests/play.spec.ts` | Uses `window.__game`; no unit-test layer exists. |

## CONVENTIONS

- Reconcile behavior changes against root `docs/` first. The code should implement the
  corrected GDD, not invent local rules.
- Keep `balance.json` as the only place for tunable constants. Derived constants belong in
  `config.ts` or `planets.ts`, not in systems.
- `GameScene` is allowed to compose systems; keep system files focused and small.
- The test contract depends on `window.__game` debug helpers. Preserve it when refactoring.
- TypeScript is strict, but unused locals/parameters are not compiler errors in this
  package.
- There is no `npm test` script. Run Playwright directly.

## ANTI-PATTERNS

- Do not edit generated outputs (`dist/`, `test-results/`, `playwright-report/`) as source.
- Do not load or modernize root `game.js` unless explicitly asked; it is not the Vite path.
- Do not duplicate launch, layout, or scoring numbers outside `balance.json`.
- Do not replace the acceptance suite with screenshots only; assertions use game state.
- Do not change dev port casually: Playwright and Vite both assume `5199`.

## COMMANDS

```bash
npm install
npm run dev
npm run typecheck
npm run build
npx playwright test
npm run preview
```
