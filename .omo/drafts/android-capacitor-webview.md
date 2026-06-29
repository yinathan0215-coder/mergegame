---
slug: android-capacitor-webview
status: drafting
intent: clear
pending-action: write .omo/plans/android-capacitor-webview.md
approach: Android-only Capacitor/WebView packaging inside game/, with real-device/emulator install QA and Godot/native fallback only after failing the WebView quality gate.
---

# Draft: android-capacitor-webview

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| id | outcome | status | evidence path |
| --- | --- | --- | --- |
| C1 docs-source | GDD states Android Capacitor/WebView method and quality gate | active | docs/60-implementation/android-capacitor-webview.md |
| C2 web-build | Existing Vite app builds static `dist` payload for Capacitor | active | game/package.json, game/vite.config.ts |
| C3 capacitor-shell | Capacitor config/dependencies and Android project wrap `game/dist` | active | planned: game/capacitor.config.ts, game/android/ |
| C4 android-build | Gradle builds an installable debug APK | active | planned: game/android/app/build/outputs/apk/debug/app-debug.apk |
| C5 runtime-qa | Installed Android app passes launch/input/layout/lifecycle/performance smoke | active | planned: .omo/evidence/manual-qa-android-capacitor-webview.md |
| C6 fallback-boundary | Godot/native remains fallback after measured WebView failure only | active | docs/60-implementation/android-capacitor-webview.md |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

| assumption | adopted default | rationale | reversible? |
| --- | --- | --- | --- |
| Capacitor project root | Keep Capacitor config and generated Android project under `game/` | `game/` is the runnable package and owns Vite build scripts | yes |
| Package id | `com.mergegame.planetpoolmerge` | Stable reverse-DNS placeholder for local installable build | yes before store/signing |
| App name | `Planet Pool Merge` | Current package name/title source; no store branding decision needed | yes |
| Artifact priority | Debug APK first, AAB later | User asked installable app, not store release | yes |
| Orientation | Portrait lock may be applied for the first Android QA pass | Protects the current 9:16 phone layout while WebView viability is measured | yes; revisit for tablet, foldable, or rotation support |
| Test strategy | tests-after plus failing-first command proofs | Integration is build/tooling oriented; generated Android project appears after dependency setup | yes |

## Findings (cited - path:lines)

- `docs/60-implementation/android-capacitor-webview.md:26-35`: first Android path is Capacitor/WebView, Android only, APK first, quality gate required, Godot fallback only after gate failure.
- `docs/60-implementation/android-capacitor-webview.md:41-44`: existing Vite/Pixi/Matter web build is compatible with a Capacitor shell.
- `docs/60-implementation/android-capacitor-webview.md:52-67`: required implementation sequence is install Capacitor packages, init app, add Android, build, sync, build/install, run quality gate.
- `docs/60-implementation/android-capacitor-webview.md:75-87`: pass criteria require installed Android runtime smoke and performance checks.
- `docs/60-implementation/android-capacitor-webview.md:102-106`: Godot is fallback, not first implementation.
- `game/package.json:6-12`: current scripts include `build`, `build:single`, `preview`, and `typecheck`.
- `game/package.json:13-22`: current runtime dependencies are Matter.js and PixiJS; Capacitor is not yet present.
- `game/vite.config.ts:5-7`: Vite uses `base: './'` and `outDir: 'dist'`.
- `game/index.html:5-8`: viewport is already mobile constrained.
- `game/index.html:26-29`: canvas disables browser touch gestures with `touch-action: none`.
- Advisory planning lane confirmed wave order: web preflight -> Capacitor bootstrap -> Android platform/sync -> debug APK/install -> real Android quality gate.
- Advisory planning lane highlighted runtime QA risks: dev-test bias from `window.__game`, asset-path failure, WebView performance, Android tooling drift, and system-bar/orientation behavior.

## Decisions (with rationale)

- Use Capacitor, not Cordova/React Native/Godot, for the first Android installable pass.
- Keep the implementation inside `game/` to avoid a repo-root mobile workspace before it is needed.
- Add npm scripts for repeatable Android sync/build/open commands instead of relying on remembered CLI sequences.
- Treat `npm run build` and `npx cap sync android` as required before every Android build.
- Require installed-app QA; a successful Gradle build alone is not done.
- Do not add ads, IAP, analytics, push, login, cloud save, store signing, or iOS work in this plan.

## Scope IN

- `game/package.json` dependency/scripts update.
- `game/package-lock.json` dependency lock update.
- `game/capacitor.config.ts` creation.
- Generated `game/android/` project from `npx cap add android`.
- Minimal Android manifest/app metadata required for local install.
- Build/sync/install documentation or scripts needed for repeatable use.
- Android runtime smoke and performance gate evidence.

## Scope OUT (Must NOT have)

- No iOS.
- No Google Play release, signing, listing, policy, privacy labels, ads, IAP, or analytics.
- No Godot/Unity/native rewrite.
- No gameplay rewrite or Pixi/Matter replacement.
- No weakening existing Playwright tests.
- No moving the runnable web package out of `game/`.

## Open questions

None blocking. The plan uses reversible defaults recorded above.

## Approval gate
status: approved-by-request
approval: User explicitly asked to write the docs and OMO ulw-plan from the deep-interview artifacts in this turn. Approval covers plan generation only, not implementation.
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
