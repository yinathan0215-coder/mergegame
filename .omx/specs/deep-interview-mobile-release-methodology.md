---
workflow: deep-interview
profile: standard
context_type: brownfield
source_context: .omx/context/mobile-release-methodology-20260629T084426Z.md
source_transcript: .omx/interviews/mobile-release-methodology-20260629T090709Z.md
created_utc: 2026-06-29T09:07:09Z
final_ambiguity: 0.164
threshold: 0.20
status: ready_for_planning
---

# Spec: Android Installable App via Capacitor/WebView

## Intent

Create a technically defensible path to make the existing Planet Pool Merge HTML5 game installable on Android, without committing yet to public store launch or a full engine rewrite.

## Desired Outcome

An Android installable app build path based on Capacitor/WebView, using the existing Vite + PixiJS + Matter.js game as the source. The first plan should produce an APK/installable artifact and validate whether the WebView runtime is smooth enough on real Android hardware.

## Selected Method

Use Capacitor as the Android native shell around the existing static web build.

Expected shape:

1. Build the web game from `game/`.
2. Configure Capacitor with `webDir` pointing at the Vite output, expected `dist`.
3. Add Android platform.
4. Sync/copy the built web bundle into the Android project.
5. Build/install APK through Android Studio or Gradle.
6. Validate on Android device/emulator.

## Why This Method

The current game is already a browser-first WebGL game:

- `game/package.json` uses Vite, TypeScript, PixiJS, and Matter.js.
- `game/vite.config.ts` outputs static assets to `dist` and uses `base: './'`.
- The game canvas is already responsive and touch-oriented.

Capacitor/WebView is therefore a packaging and validation path. Godot is not a packaging path for this codebase; it is a rewrite/porting path.

## In Scope

- Android-only first pass.
- Capacitor setup and Android project generation.
- Vite build integration.
- APK/installable build.
- Device/emulator install validation.
- WebView-specific smoke tests: asset loading, touch input, canvas sizing, audio, storage, app pause/resume.
- Performance gate to decide whether WebView remains viable.
- Documentation of fallback triggers for Godot/native porting.

## Out of Scope / Non-goals

- iOS build or signing.
- Public store release.
- App Store / Google Play listing work.
- Ads, IAP, push notifications, login, cloud save, analytics, or privacy policy implementation unless separately requested.
- Godot/Unity/native rewrite in the first pass.
- Replacing PixiJS or Matter.js before measuring the current game on Android.

## Constraints

- Preserve current gameplay behavior during packaging.
- Keep the first implementation narrow and reversible.
- Do not treat "APK builds" as sufficient; the app must be observed running through the Android surface.
- If behavior changes become necessary, reconcile the docs-first project source of truth before code changes.
- Android build tooling availability may need local setup: Android Studio, Android SDK, JDK/Gradle compatibility.

## Testable Acceptance Criteria

- `game` web build succeeds.
- Capacitor Android project exists and is wired to the built web assets.
- Android APK can be built.
- APK installs on at least one Android target.
- App opens to the game UI without blank screen, missing assets, or wrong base path.
- Touch aiming/firing works.
- Layout respects full-screen phone dimensions without unusable clipping.
- Basic foreground/background lifecycle does not corrupt the session or crash.
- Local persistence still works if the existing game uses browser storage.
- Performance is acceptable by the first-pass gate:
  - near-60fps feel during normal play,
  - no obvious input delay,
  - no severe stutter during merge/effects,
  - no excessive heat or battery drain in a short play session.

## Fallback / Escalation Criteria

Escalate from Capacitor/WebView to Godot/native port planning only if one or more of these are observed and cannot be fixed with reasonable web optimization:

- Persistent low FPS or jank on target Android hardware.
- Noticeable input latency that hurts aiming/firing.
- WebGL context or canvas rendering instability.
- Audio or lifecycle issues that are hard to stabilize in WebView.
- Memory pressure or thermal behavior unacceptable for expected play sessions.
- Store/platform requirements later demand native systems that would make the WebView shell too fragile.

## Godot Comparison Decision

Godot remains a strategic fallback, not the first step.

Godot advantages:

- Game-native runtime, editor, scene system, Android export, profiling, and mobile-focused iteration.
- Better long-term fit if the project becomes a native mobile game product.
- Less dependence on Android WebView behavior.

Godot limits for this repo:

- Existing Vite/PixiJS/Matter.js implementation cannot be reused directly.
- Rendering, physics, UI, storage, input, and QA hooks must be rebuilt.
- Higher cost and longer schedule before reaching parity with the current playable prototype.
- Risk of losing current game feel during physics and interaction reimplementation.

## Decision Boundary

Proceed with Capacitor/WebView planning now. Keep Godot only as a fallback branch after measured Android WebView results.

## Recommended Next Step

Run `$ralplan` using this spec to create:

- PRD for Android Capacitor packaging.
- Test spec for build/install/runtime/performance validation.
- Implementation sequence for adding Capacitor with minimal disruption to `game/`.
