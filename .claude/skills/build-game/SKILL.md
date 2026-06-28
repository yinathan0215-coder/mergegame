---
name: build-game
description: >
  BUILD the mergegame HTML5 game (Galaxy Pinball) into a single, standalone, double-clickable
  HTML file — game/dist/galaxy-pinball.html (JS + all PNG art inlined as base64, plays from
  file:// with no server). Use this whenever the user wants to build, package, export, produce
  a deliverable/submission, make a "playable HTML", create a standalone/single-file/portable
  build, or rebuild after code or art changes — even if they don't say "build:single" by name.
  Also covers running the game locally (dev / preview) when a server-based run is wanted instead.
---

# build-game — produce the standalone playable HTML

The prototype lives in `game/` (Vite + TypeScript + PixiJS + Matter.js). The shippable artifact
is a **single self-contained `game/dist/galaxy-pinball.html`** that anyone plays by double-clicking
— no web server, no install. Canonical spec: `docs/60-implementation/tech-stack.md` §제약 (단일 파일
배포본).

## Build it

Run the PowerShell runner from the repo root (it `cd`s into `game/` and installs deps on first run):

```powershell
./build-game.ps1          # build -> game/dist/galaxy-pinball.html
./build-game.ps1 -Open    # build, then open it in the browser
```

Equivalent npm command (run inside `game/`):

```bash
npm run build:single
```

`build:single` runs the normal build (`tsc --noEmit && vite build`) then
`game/scripts/build-single-file.mjs`, which inlines the JS bundle and every `/assets/*.png` as
base64 into one HTML. That inliner **fails loudly if any external reference survives**, so a green
run is itself the guarantee that the file is truly standalone.

## Report the result

After building, tell the user the **absolute path** and size of `game/dist/galaxy-pinball.html` and
that it's double-click-playable. The PowerShell runner already prints this; surface it.

## Why a single file — don't "fix" it back to multi-file

The default `vite build` emits a multi-file `dist/` whose entry is `<script type="module">` and
whose art loads by absolute `/assets/...` path. Browsers block module scripts under `file://`, and
the absolute paths resolve to the drive root — so the multi-file build needs an HTTP server and is
NOT double-clickable. The single-file step exists precisely to remove that constraint. Keep both
outputs: multi-file for local dev/preview, single-file for handoff.

## Running locally instead (server-based)

When the user wants a live dev server rather than a portable file:

```bash
npm run dev       # http://localhost:5199, hot reload
npm run preview   # builds, serves the multi-file dist/ at http://localhost:5174
```

## Verify when in doubt

The real proof is opening the file in a browser: the Title shows the orbiting planets + UI icons
(those ARE the inlined PNGs) and Play enters the physics board. A blank navy screen means the inline
failed — check the browser console for module/CORS errors and confirm the inliner reported the
expected number of assets inlined.
