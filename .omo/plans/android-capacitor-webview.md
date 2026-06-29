# android-capacitor-webview - Work Plan

## TL;DR (For humans)

**What you'll get:** An Android installable debug app that wraps the current web game, plus repeatable build/install commands and captured runtime QA evidence.

**Why this approach:** It preserves the current PixiJS/Matter.js game and measures real Android WebView quality before paying the much larger cost of a Godot/native rewrite.

**What it will NOT do:** No iOS, no public store release, no ads/IAP/analytics, and no Godot or native rewrite in this pass.

**Effort:** Medium
**Risk:** Medium - Android tooling and real WebView runtime quality must be proven on-device.
**Decisions to sanity-check:** Android-only, debug APK first, app id `com.mergegame.planetpoolmerge`, keep mobile shell work inside the existing game package, and use the recorded reversible portrait-first assumption for the initial Android QA pass.

Your next move: start execution with `$start-work`, or ask for a high-accuracy Momus review of this plan first. Full execution detail follows below.

---

> TL;DR (machine): Medium-risk Android Capacitor/WebView packaging plan: add Capacitor in `game/`, generate Android project, build/install APK, run real Android quality gate, keep Godot as fallback only after measured failure.

## Scope
### Must have

- Add Capacitor dependencies and configuration under `game/`.
- Use app name `Planet Pool Merge`.
- Use Android package/app id `com.mergegame.planetpoolmerge`.
- Use `webDir: 'dist'` so Capacitor packages the existing Vite build output.
- Generate the Android platform project under `game/android/`.
- Keep the web prerequisite as `npm run build`.
- Add repeatable npm scripts for Android sync/open/debug build.
- Build a debug APK.
- Install and launch the APK on an Android target when tooling/device is available.
- Capture evidence for build, sync, APK path, installed launch, logcat, screenshot, touch input, lifecycle, and performance notes.
- Record any WebView failure with a clear fix-or-port recommendation.

### Must NOT have (guardrails, anti-slop, scope boundaries)

- Must not add iOS.
- Must not add Google Play release signing, listing, privacy labels, policy work, ads, IAP, analytics, push, login, or cloud save.
- Must not rewrite gameplay, replace PixiJS, replace Matter.js, or start a Godot/Unity/native port.
- Must not move the runnable web package out of `game/`.
- Must not weaken, skip, delete, or loosen existing Playwright tests.
- Must not claim completion from Gradle success alone; Android runtime must be observed.

## Verification strategy
> Verification is agent-executed. User approval is required only to start implementation or create commits, not to run the final verification wave once execution has begun.
- Test decision: tests-after plus failing-first command proofs. This is packaging/tooling integration around an existing app; the RED proof is that Capacitor sync/build artifacts are absent or fail before the Capacitor setup, followed by GREEN sync/build/install after setup.
- Frameworks/tools: npm scripts, TypeScript, Vite, Playwright, Capacitor CLI, Gradle wrapper, Android Debug Bridge.
- Evidence root: `.omo/evidence/android-capacitor-webview/`.
- Required evidence files:
  - `.omo/evidence/android-capacitor-webview/task-1-preflight.txt`
  - `.omo/evidence/android-capacitor-webview/task-2-capacitor-config.txt`
  - `.omo/evidence/android-capacitor-webview/task-3-sync.txt`
  - `.omo/evidence/android-capacitor-webview/task-4-android-config.txt`
  - `.omo/evidence/android-capacitor-webview/task-5-apk-build.txt`
  - `.omo/evidence/android-capacitor-webview/task-6-runtime.md`
  - `.omo/evidence/android-capacitor-webview/task-6-launch.png`
  - `.omo/evidence/android-capacitor-webview/task-7-final.txt`

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

- Wave 0: Todo 1 only. Establish baseline and RED proof before production changes.
- Wave 1: Todos 2-4. Add Capacitor config/dependencies, generate/sync Android platform, and apply Android runtime settings. Todo 4 depends on generated Android files from Todo 3.
- Wave 2: Todos 5-6. Build APK and run Android runtime QA. Todo 6 depends on Todo 5.
- Wave 3: Todo 7 only. Consolidate evidence, docs receipts, and fallback recommendation.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3, 5, 6, 7 | none |
| 2 | 1 | 3, 5 | none |
| 3 | 2 | 4, 5, 6 | none |
| 4 | 3 | 5, 6 | none |
| 5 | 3, 4 | 6, 7 | none |
| 6 | 5 | 7 | none |
| 7 | 5, 6 | final verification | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Capture baseline and failing-first proof before adding Capacitor
  What to do / Must NOT do: Create `.omo/evidence/android-capacitor-webview/`. Run current web verification and capture that Capacitor artifacts are absent before changes. Do not edit product/source files in this todo; writing evidence under `.omo/evidence/android-capacitor-webview/` is required.
  Parallelization: Wave 0 | Blocked by: none | Blocks: 2, 3, 5, 6, 7
  References (executor has NO interview context - be exhaustive): docs/60-implementation/android-capacitor-webview.md:26-35, docs/60-implementation/android-capacitor-webview.md:41-44, game/package.json:6-22, game/vite.config.ts:5-7, game/index.html:5-8, game/index.html:26-29
  Acceptance criteria (agent-executable): `.omo/evidence/android-capacitor-webview/task-1-preflight.txt` contains outputs for `npm run typecheck`, `npm run build`, `npx playwright test --reporter=line`, `Test-Path game/capacitor.config.ts`, and `Test-Path game/android`.
  QA scenarios (name the exact tool + invocation):
  - Happy: PowerShell invocation from repo root: `New-Item -ItemType Directory -Path .omo/evidence/android-capacitor-webview -Force; cd game; npm run typecheck; npm run build; npx playwright test --reporter=line` exits 0. Evidence: `.omo/evidence/android-capacitor-webview/task-1-preflight.txt`.
  - Failure/RED: PowerShell invocation from repo root: `Test-Path game/capacitor.config.ts; Test-Path game/android` returns `False` for both before setup. If either is already present, stop and inspect whether another agent already implemented the shell. Evidence: `.omo/evidence/android-capacitor-webview/task-1-preflight.txt`.
  Commit: N | baseline evidence only

- [ ] 2. Add Capacitor dependencies, config, and repeatable npm scripts
  What to do / Must NOT do: In `game/`, install `@capacitor/core`, `@capacitor/android`, and dev dependency `@capacitor/cli`. Create `game/capacitor.config.ts` with `appId: 'com.mergegame.planetpoolmerge'`, `appName: 'Planet Pool Merge'`, and `webDir: 'dist'`. Add scripts: `cap:sync:android`, `cap:open:android`, and `cap:build:android`. Do not add iOS, ads, IAP, analytics, or non-Capacitor mobile frameworks.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3, 5
  References (executor has NO interview context - be exhaustive): docs/60-implementation/android-capacitor-webview.md:48-69, docs/60-implementation/android-capacitor-webview.md:106-110, game/package.json:6-22, game/vite.config.ts:5-7
  Acceptance criteria (agent-executable): `game/package.json` includes Capacitor packages and scripts; `game/package-lock.json` is updated; `game/capacitor.config.ts` exists and exports the exact app id/name/webDir; `cd game && npm run build` exits 0.
  QA scenarios (name the exact tool + invocation):
  - Happy: PowerShell invocation from repo root: `cd game; npm install @capacitor/core @capacitor/android; npm install -D @capacitor/cli; npm run build; npx cap --version` exits 0 and command output is appended to `.omo/evidence/android-capacitor-webview/task-2-capacitor-config.txt`.
  - Failure: PowerShell invocation from repo root: `Select-String -Path game/capacitor.config.ts -Pattern \"com.mergegame.planetpoolmerge\",\"Planet Pool Merge\",\"webDir: 'dist'\"` must find all three patterns; missing any pattern fails. Evidence: `.omo/evidence/android-capacitor-webview/task-2-capacitor-config.txt`.
  Commit: Y | build(android): add Capacitor app shell configuration

- [ ] 3. Generate Android platform and sync the built web payload
  What to do / Must NOT do: Run `npx cap add android` only after Todo 2. Then run `npm run cap:sync:android`, which must build web assets and sync them into `game/android/`. Do not hand-create Android project files instead of using Capacitor CLI.
  Parallelization: Wave 1 | Blocked by: 2 | Blocks: 4, 5, 6
  References (executor has NO interview context - be exhaustive): docs/60-implementation/android-capacitor-webview.md:60-69, docs/60-implementation/android-capacitor-webview.md:112-117, game/vite.config.ts:5-7
  Acceptance criteria (agent-executable): `game/android/` exists; `cd game && npx cap sync android` exits 0; Android asset directory contains the copied web payload from `dist`.
  QA scenarios (name the exact tool + invocation):
  - Happy: PowerShell invocation from repo root: `cd game; npx cap add android; npm run cap:sync:android; Test-Path android/app/src/main/assets/public/index.html` returns `True`. Evidence: `.omo/evidence/android-capacitor-webview/task-3-sync.txt`.
  - Failure: PowerShell invocation from repo root: `cd game; npx cap sync android` must fail before `android/` exists and must pass after `npx cap add android`; capture both if possible. Evidence: `.omo/evidence/android-capacitor-webview/task-3-sync.txt`.
  Commit: Y | build(android): generate Capacitor Android project

- [ ] 4. Apply Android runtime settings for first-pass game QA
  What to do / Must NOT do: Inspect the generated Android manifest/activity. Set the main activity to portrait orientation for the first pass. Preserve Capacitor defaults unless a setting is required for local install/runtime. Do not add store signing, release channels, iOS, or extra native plugins.
  Parallelization: Wave 1 | Blocked by: 3 | Blocks: 5, 6
  References (executor has NO interview context - be exhaustive): docs/60-implementation/android-capacitor-webview.md:30-35, docs/60-implementation/android-capacitor-webview.md:50-52, docs/60-implementation/android-capacitor-webview.md:79-87, game/index.html:5-8, game/index.html:19-29
  Acceptance criteria (agent-executable): `game/android/app/src/main/AndroidManifest.xml` contains the generated main activity and a portrait orientation setting; the generated Android Gradle/manifest/config files preserve package identity `com.mergegame.planetpoolmerge`; `cd game && npm run cap:sync:android` remains green.
  QA scenarios (name the exact tool + invocation):
  - Happy: PowerShell invocation from repo root: `Select-String -Path game/android/app/src/main/AndroidManifest.xml -Pattern \"screenOrientation\",\"portrait\"; cd game; npm run cap:sync:android` finds orientation and exits 0. Evidence: `.omo/evidence/android-capacitor-webview/task-4-android-config.txt`.
  - Failure: PowerShell invocation from repo root: `Select-String -Path game/capacitor.config.ts,game/android/app/build.gradle,game/android/app/src/main/AndroidManifest.xml -Pattern \"com.mergegame.planetpoolmerge\"` must find the configured id in Capacitor config and the generated Android project identity files; missing package identity fails. Evidence: `.omo/evidence/android-capacitor-webview/task-4-android-config.txt`.
  Commit: Y | build(android): lock first-pass Android runtime settings

- [ ] 5. Build a debug APK through Gradle
  What to do / Must NOT do: Build the debug APK after web build and Capacitor sync. Use the generated Gradle wrapper under `game/android/`. Do not stop at `npm run build`; the APK artifact must exist.
  Parallelization: Wave 2 | Blocked by: 3, 4 | Blocks: 6, 7
  References (executor has NO interview context - be exhaustive): docs/60-implementation/android-capacitor-webview.md:64-71, docs/60-implementation/android-capacitor-webview.md:73-87, docs/60-implementation/android-capacitor-webview.md:112-118
  Acceptance criteria (agent-executable): `cd game/android && .\\gradlew.bat assembleDebug` exits 0 on Windows; `game/android/app/build/outputs/apk/debug/app-debug.apk` exists.
  QA scenarios (name the exact tool + invocation):
  - Happy: PowerShell invocation from repo root: `cd game; npm run cap:sync:android; cd android; .\\gradlew.bat assembleDebug; Test-Path app/build/outputs/apk/debug/app-debug.apk` returns `True`. Evidence: `.omo/evidence/android-capacitor-webview/task-5-apk-build.txt`.
  - Failure: PowerShell invocation from repo root: `Test-Path game/android/app/build/outputs/apk/debug/app-debug.apk` before Gradle build should be `False`; after Gradle build must be `True`. Evidence: `.omo/evidence/android-capacitor-webview/task-5-apk-build.txt`.
  Commit: N | covered by Android project/config commits unless build script changes are needed

- [ ] 6. Run installed Android runtime smoke and quality gate
  What to do / Must NOT do: Install the debug APK on an Android target, launch it, capture screenshot and logcat, and exercise touch/lifecycle smoke. Prefer a real Android device; use an emulator only when no device is available. Do not mark complete if no Android target is available; record the blocker and exact missing tool/device output.
  Parallelization: Wave 2 | Blocked by: 5 | Blocks: 7
  References (executor has NO interview context - be exhaustive): docs/60-implementation/android-capacitor-webview.md:73-91, docs/60-implementation/android-capacitor-webview.md:93-100, docs/60-implementation/android-capacitor-webview.md:112-120, .omx/specs/deep-interview-mobile-release-methodology.md:74-100
  Acceptance criteria (agent-executable): `.omo/evidence/android-capacitor-webview/task-6-runtime.md` records target device/emulator, install command, launch command, logcat fatal/error summary, touch scenario result, lifecycle result, and performance notes; `.omo/evidence/android-capacitor-webview/task-6-launch.png` exists.
  QA scenarios (name the exact tool + invocation):
  - Happy: PowerShell invocation from repo root: `adb devices; adb install -r game/android/app/build/outputs/apk/debug/app-debug.apk; adb logcat -c; adb shell monkey -p com.mergegame.planetpoolmerge 1; Start-Sleep -Seconds 5; adb exec-out screencap -p > .omo/evidence/android-capacitor-webview/task-6-launch.png; adb logcat -d -t 300 > .omo/evidence/android-capacitor-webview/task-6-logcat.txt` exits 0 and screenshot is non-empty. Evidence: `.omo/evidence/android-capacitor-webview/task-6-runtime.md` and `.omo/evidence/android-capacitor-webview/task-6-launch.png`.
  - Touch: On a 1080x1920 portrait target, PowerShell invocation from repo root: `adb shell input swipe 540 1500 540 900 450; Start-Sleep -Seconds 3; adb exec-out screencap -p > .omo/evidence/android-capacitor-webview/task-6-after-touch.png` captures a post-input screenshot. If the target is not 1080x1920, record `adb shell wm size` and scale the coordinates proportionally in the evidence file. Evidence: `.omo/evidence/android-capacitor-webview/task-6-runtime.md`.
  - Lifecycle: PowerShell invocation from repo root: `adb shell input keyevent KEYCODE_HOME; Start-Sleep -Seconds 30; adb shell monkey -p com.mergegame.planetpoolmerge 1; Start-Sleep -Seconds 5; adb logcat -d -t 500 > .omo/evidence/android-capacitor-webview/task-6-lifecycle-logcat.txt` must show no fatal crash and app must remain visible/playable. Evidence: `.omo/evidence/android-capacitor-webview/task-6-runtime.md`.
  - Failure: If `adb devices` shows no device/emulator, write `BLOCKED: no Android target available` plus full `adb devices` output to `.omo/evidence/android-capacitor-webview/task-6-runtime.md`; do not claim runtime QA passed.
  Commit: N | QA evidence only

- [ ] 7. Consolidate runbook, fallback decision, and final receipts
  What to do / Must NOT do: Add a concise Android runbook only if the implementation lacks one. Update docs only if implementation diverges from `docs/60-implementation/android-capacitor-webview.md`. Summarize WebView pass/fail and fallback recommendation. Do not start Godot/native work.
  Parallelization: Wave 3 | Blocked by: 5, 6 | Blocks: final verification
  References (executor has NO interview context - be exhaustive): docs/60-implementation/android-capacitor-webview.md:24-35, docs/60-implementation/android-capacitor-webview.md:93-110, docs/60-implementation/android-capacitor-webview.md:112-120, .omo/drafts/android-capacitor-webview.md
  Acceptance criteria (agent-executable): `.omo/evidence/android-capacitor-webview/task-7-final.txt` summarizes changed files, exact commands run, Android target status, WebView viability decision, and any blockers; if runbook/docs were edited, their paths are listed and linked.
  QA scenarios (name the exact tool + invocation):
  - Happy: PowerShell invocation from repo root: `Select-String -Path .omo/evidence/android-capacitor-webview/task-7-final.txt -Pattern \"WebView viability\",\"APK\",\"Android target\",\"Godot fallback\"` finds all patterns. Evidence: `.omo/evidence/android-capacitor-webview/task-7-final.txt`.
  - Failure: PowerShell invocation from repo root: `Select-String -Path .omo/evidence/android-capacitor-webview/task-7-final.txt -Pattern \"BLOCKED\"` must be absent for an unblocked completion; if present, final status must be blocked rather than complete. Evidence: `.omo/evidence/android-capacitor-webview/task-7-final.txt`.
  Commit: Y | docs(android): record Capacitor app-shell verification receipts

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE before declaring implementation complete.
- [ ] F1. Plan compliance audit: verify every todo acceptance criterion has matching evidence under `.omo/evidence/android-capacitor-webview/`; reject if any todo is closed by summary-only claims.
- [ ] F2. Code quality review: inspect `git diff -- game/package.json game/package-lock.json game/capacitor.config.ts game/android docs/60-implementation .omo/evidence` for scope creep, generated-file mistakes, secret leakage, or accidental iOS/store work.
- [ ] F3. Real manual QA: re-run or review installed Android launch/input/lifecycle evidence; reject if APK was built but not installed/launched or if Android target absence is hidden.
- [ ] F4. Scope fidelity: reject if the implementation adds iOS, Godot/Unity/native rewrite, ads, IAP, analytics, store signing, or gameplay rewrites.

## Commit strategy

- Do not commit unless the user explicitly asks for commits.
- If commits are requested, keep commits atomic and follow the repository Lore Commit Protocol from `AGENTS.md`.
- Suggested commit slices:
  - `build(android): add Capacitor app shell configuration`
  - `build(android): generate Capacitor Android project`
  - `build(android): lock first-pass Android runtime settings`
  - `docs(android): record Capacitor app-shell verification receipts`
- Every commit message must include relevant Lore trailers such as `Constraint:`, `Confidence:`, `Scope-risk:`, `Tested:`, and `Not-tested:`.

## Success criteria

- Existing web app still passes `cd game && npm run typecheck`.
- Existing web app still passes `cd game && npm run build`.
- Existing Playwright suite still passes `cd game && npx playwright test --reporter=line`, unless a pre-existing unrelated failure is proven and recorded.
- Capacitor config exists with `appId: 'com.mergegame.planetpoolmerge'`, `appName: 'Planet Pool Merge'`, and `webDir: 'dist'`.
- Android platform exists under `game/android/`.
- `cd game && npx cap sync android` exits 0.
- `cd game/android && .\gradlew.bat assembleDebug` exits 0 on Windows and produces `app/build/outputs/apk/debug/app-debug.apk`.
- APK install/launch QA is completed on an Android target, or the final status explicitly says blocked with `adb devices`/tooling evidence.
- WebView viability is stated as pass, fail, or blocked with evidence.
- Godot/native remains a documented fallback only; no porting work starts in this plan.
