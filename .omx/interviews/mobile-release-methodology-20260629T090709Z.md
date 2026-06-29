---
interview_id: b4d101d7-67e9-449b-8a2d-784c245af162
workflow: deep-interview
profile: standard
context_type: brownfield
created_utc: 2026-06-29T09:07:09Z
final_ambiguity: 0.164
threshold: 0.20
---

# Deep Interview Transcript: Android Installable App Methodology

## Final Decision

Use Capacitor/WebView as the first Android installable-app path for the existing Vite + PixiJS + Matter.js game.

This is not a final claim that WebView is production-smooth. It is the lowest-cost installable artifact path and must pass a real-device quality gate. Godot/native porting remains a fallback if the WebView build fails performance or UX criteria.

## Context Evidence

- The runnable game is `game/`.
- `game/package.json` builds a Vite + TypeScript app with PixiJS and Matter.js.
- `game/vite.config.ts` outputs static assets to `game/dist` with `base: './'`.
- The game is browser-first and uses Pixi Application resizing to `window`, DPR capped to 2, canvas `touch-action: none`, and a 9:16 contained foreground layout.
- No existing Android native shell, Capacitor, Cordova, Godot, Unity, or native Android project exists in the inspected context.

## Rounds

| Round | Target | Question | Answer | Interpretation |
|---:|---|---|---|---|
| 1 | Intent/outcome | Is the goal store release, quick installable build, or technology decision? | "출시까지는 아니더라도 설치 가능한 앱" | Goal is an installable app artifact, not full public store launch. |
| 2 | Scope/non-goals | Should first scope be Android only, both Android/iOS, or Android actual + iOS methodology? | "Android" | First pass targets Android only. |
| 3 | Decision boundary | May WebView/Capacitor be assumed as default, excluding native/engine rewrites? | User challenged WebView smoothness and asked about porting. | WebView must be a validation gate, not an assumed final answer. |
| 4 | Method comparison | Asked for broader method comparison. | User requested pros/cons of options. | Compare wrapper and port paths before committing. |
| 5 | WebView vs Godot | Asked for stronger WebView/Godot comparison. | User requested deeper comparison. | WebView packages current code; Godot is a rewrite/port target. |
| 6 | Decision | User chose WebView/Capacitor plan. | "그러면 일단 WebView/Capacitor 로 계획을 잡자." | Capacitor/WebView is selected for the first Android plan. |

## Clarity Breakdown

| Dimension | Score | Remaining Gap |
|---|---:|---|
| Intent | 0.90 | Clear enough: make an installable Android app from the current game. |
| Outcome | 0.88 | Clear enough: APK/installable artifact plus device validation. |
| Scope | 0.86 | Android first; iOS and public store launch excluded. |
| Constraints | 0.76 | Need confirm local Android Studio/JDK/SDK availability during execution. |
| Success | 0.74 | Quality gate defined; exact device list can be refined during planning. |
| Context | 0.88 | Current web build shape is known; native shell does not exist yet. |

Weighted ambiguity: 0.164, below standard threshold 0.20.

## Readiness Gates

- Non-goals: resolved for first pass.
- Decision boundaries: resolved for first pass.
- Pressure pass: complete. The WebView assumption was challenged and converted into a gated validation methodology.

## Non-goals

- iOS build path for this pass.
- Public Google Play or App Store launch.
- Store listing, ratings, privacy-label, payment, ad, or policy submission work.
- Godot/native rewrite as the first implementation.
- Rebuilding gameplay in another engine before measuring the current web game on Android.

## Decision Boundaries

OMX may proceed with a Capacitor-first Android plan, including repository structure, command sequence, Android project generation, and device validation checklist.

OMX should not silently switch to Godot, Unity, React Native, Cordova, or native Kotlin unless the Capacitor path fails an explicit quality gate or the user changes the target.

## Acceptance Criteria

- Android installable artifact can be produced from the current `game/` build.
- The artifact installs on at least one real Android device or emulator.
- The game launches without a blank screen or asset-path failure.
- Core loop is playable through touch input.
- Rendering feels near 60fps on at least one target device.
- No obvious input latency, layout clipping, audio breakage, or lifecycle failure on basic foreground/background testing.
- Any WebView-specific issues are documented with a fix/porting recommendation.

## Recommended Handoff

Use `$ralplan` next to create the implementation PRD and test spec from `.omx/specs/deep-interview-mobile-release-methodology.md`.
