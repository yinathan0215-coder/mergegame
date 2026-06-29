---
id: android-capacitor-webview
note_type: spec
status: design
domain: implementation
updated: 2026-06-29
tags: [android, capacitor, webview, packaging]
sources:
  - "[[00-meta/input-log/2026-06-29]]"
  - "raw: .omx/specs/deep-interview-mobile-release-methodology.md"
  - "raw: .omx/interviews/mobile-release-methodology-20260629T090709Z.md"
  - "raw: game/package.json"
  - "raw: game/vite.config.ts"
  - "raw: game/index.html"
  - "https://capacitorjs.com/docs/basics/workflow"
  - "https://developer.android.com/develop/ui/views/layout/webapps/webview"
  - "https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html"
---

# Android Capacitor/WebView App Shell

> Project coverage: technical path for turning the current HTML5 prototype into an Android installable app before public store launch.

## Decision

The first Android app path is **Capacitor/WebView around the existing `game/` Vite build**.

This page is the source of truth for the first installable-app pass:

- Target platform: Android only.
- Build artifact target: installable APK first; AAB is allowed later for Play distribution work.
- Web payload: `game/dist`, produced by `npm run build` from `game/`.
- Native shell: Capacitor Android project.
- Quality gate: the APK must be installed and played on Android before WebView is accepted as viable.
- Fallback: Godot/native port planning starts only after the WebView build fails the quality gate or the user changes the target.

## Existing Web Build Fit

The current prototype already has the shape needed for a Capacitor shell:

- `game/package.json` defines `npm run build` as `tsc --noEmit && vite build`.
- `game/vite.config.ts` writes the production bundle to `dist` and uses `base: './'`, so static asset paths are compatible with packaged local assets.
- `game/index.html` uses a mobile viewport with `maximum-scale=1.0`, disables body scrolling, fixes `#app` to the viewport, and sets `canvas { touch-action: none; }`.
- `GameScene` creates a PixiJS `Application` with `resizeTo: window`, caps DPR at `Math.min(window.devicePixelRatio || 1, 2)`, and uses a 9:16 contained foreground layout.

## Implementation Shape

The executor should keep the Capacitor work inside `game/` unless a later plan explicitly chooses another package root.

Reversible first-pass assumption:

- Orientation may be locked to portrait during the first Android QA pass if that is the fastest way to protect the current 9:16 phone layout. This is not a product/store decision; revisit it after runtime QA if tablet, foldable, or rotation support becomes a target.

Required sequence:

1. Install Capacitor packages in `game/`:
   - `@capacitor/core`
   - `@capacitor/cli`
   - `@capacitor/android`
2. Initialize Capacitor for the app:
   - app name: `Planet Pool Merge`
   - app id/package id: `com.mergegame.planetpoolmerge`
   - web directory: `dist`
3. Add Android platform:
   - `npx cap add android`
4. Build web payload:
   - `npm run build`
5. Copy/sync payload into Android:
   - `npx cap sync android`
6. Build/install APK through Android Studio or Gradle.
7. Run the Android quality gate below.

## Android Quality Gate

Do not treat "APK builds" as completion. Completion requires the app to run through the Android surface.

Minimum pass criteria:

- APK installs on at least one Android target: real device preferred; emulator acceptable only when no device is available.
- App launches to the game UI without a blank screen, missing asset, or wrong base path.
- Touch aiming and firing work inside the packaged app.
- The first playable session can start and proceed through at least one merge or shot sequence.
- Layout respects the phone viewport: no unusable clipping, hidden launcher, or broken 9:16 containment.
- Audio initialization does not crash the app; any autoplay limitation is recorded.
- Basic lifecycle works: foreground -> background -> foreground does not crash or permanently freeze the session.
- Local persistence still works for the current meta/progression data if the existing browser storage path is active.
- Performance is acceptable for a short play session:
  - near-60fps feel during normal play,
  - no obvious input delay while dragging and releasing,
  - no severe stutter during merge/effect bursts,
  - no excessive heat or battery drain during a short manual run.

## WebView Risk Register

WebView remains viable only if the quality gate passes. Track these risks during implementation:

| Risk | Evidence to collect | First response |
|---|---|---|
| Asset path failure | blank screen, 404s, missing textures | verify Vite `base: './'`, Capacitor `webDir: 'dist'`, and copied assets |
| Touch/input delay | drag/release feels late or misses | inspect Pixi pointer handling, CSS `touch-action`, viewport, and WebView settings |
| WebGL instability | black canvas, context loss, device-specific render failure | test another device; reduce DPR/effects before porting |
| Lifecycle breakage | background/resume freezes or resets unexpectedly | add explicit Capacitor app lifecycle handling if needed |
| Audio limitation | sounds missing until user gesture or after resume | gate audio resume on player gesture and lifecycle events |
| Thermal/battery issue | device heats quickly or frame pacing drops | profile effects, physics step load, DPR, texture size, and ticker work |

## Godot Boundary

Godot is a fallback strategy, not the first Android packaging step.

Godot is appropriate only when the WebView path cannot meet the quality gate or the product direction changes to a long-term native-engine rebuild. A Godot path requires rebuilding the PixiJS renderer, Matter.js physics behavior, HUD/popup UI, storage, input, and QA/debug hooks in a Godot project. That is a port/rewrite, not a wrapper.

## Verification Surface

The plan for this page must include both web and Android checks:

- Web prerequisite: `cd game && npm run build`
- Capacitor sync: `cd game && npx cap sync android`
- Android build/install: Gradle or Android Studio command chosen by the executor's environment
- Runtime smoke: installed app launches and can be played with touch input
- Failure evidence: logs/screenshots/notes for blank screen, broken asset, lifecycle failure, or performance failure

## Relates to

- [[tech-stack]]
- [[architecture]]
- [[agent-runbook]]
- [[../70-verification/index]]
