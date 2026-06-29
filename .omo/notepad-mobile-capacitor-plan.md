# ULW Notepad: Mobile Capacitor Plan

## Bootstrap

- Objective: Write docs for the Android Capacitor/WebView methodology from the deep-interview artifacts, then create a decision-complete OMO work plan for later execution.
- Skills surveyed:
  - `docs-find`: required by `docs-write` to locate the existing GDD target before writing.
  - `docs-write`: required by user; writes/reconciles docs as living GDD source of truth.
  - `omo:ulw-plan`: required by user; creates `.omo` plan artifacts only, no implementation.
- Tier: HEAVY.
- Tier reason: creates a new technical methodology/spec page plus downstream `.omo` execution plan across docs and planning artifacts; affects external Android packaging integration decisions.
- Intent route for ulw-plan: CLEAR.
- Reason: outcome is explicit: Android-first Capacitor/WebView plan, based on existing interview/spec artifacts.

## Success Criteria

1. Docs source of truth includes an Android Capacitor/WebView technical methodology page, linked from the implementation index and logged.
2. `.omo` plan exists and is decision-complete enough for a later worker to implement without more interview.
3. Verification proves the docs links, plan file, and key references exist and include the required decision boundaries.

## Manual QA Scenarios

- Docs artifact scenario: `Select-String -Path docs/60-implementation/android-capacitor-webview.md -Pattern 'Capacitor','Android','quality gate','Godot'` must find all patterns.
- Index link scenario: `Select-String -Path docs/60-implementation/index.md -Pattern 'android-capacitor-webview'` must find the new page link.
- Plan artifact scenario: `Select-String -Path .omo/plans/android-capacitor-webview.md -Pattern '## TL;DR \\(For humans\\)','Capacitor','npx cap sync android','adb install'` must find all patterns.

## Evidence Log

- Official docs checked on 2026-06-29:
  - Capacitor workflow confirms distribution web build, `npx cap sync`, `npx cap run android`, and `npx cap build android`.
  - Android WebView docs confirm WebView JavaScript/native bridge and navigation behavior are Android-runtime concerns, not just web-build concerns.
  - Godot Android export docs confirm Godot is a separate Android export toolchain, supporting the fallback-as-port boundary.
- Local artifact checks:
  - `Select-String` found `android-capacitor-webview` in `docs/60-implementation/index.md`.
  - `Select-String` found `Capacitor/WebView`, `npx cap sync android`, `Android Quality Gate`, `Godot Boundary`, and `game/dist` in `docs/60-implementation/android-capacitor-webview.md`.
  - `Select-String` found the dated Android Capacitor/WebView entry in `docs/60-implementation/log.md`.
  - `Select-String` found `TL;DR`, `npx cap sync android`, `adb install`, `Godot/native remains`, and `com.mergegame.planetpoolmerge` in `.omo/plans/android-capacitor-webview.md`.
  - `Select-String` found `Components ledger`, `Decision surface`, `approved-by-request`, and `Capacitor/WebView` in `.omo/drafts/android-capacitor-webview.md`.
  - `git diff --check` exited 0; only line-ending warning for `docs/60-implementation/index.md`.
- Reviewer loop:
  - Momus plan review returned `OKAY`: references exist, todos are ordered/startable, QA scenarios are executable, final verification rejects false completion, scope is Android Capacitor/WebView only, and no implementation started.
  - Metis initially returned `ITERATE`; fixes applied for verification-gate wording, portrait assumption provenance, evidence-write wording, and stale docs line references.
  - Metis re-review returned `OKAY`.
- Final state checks:
  - `Select-String` found Android-only, installable APK first, `game/dist`, quality gate, and fallback decision text in `docs/60-implementation/android-capacitor-webview.md`.
  - `Test-Path game/capacitor.config.ts` returned `False`.
  - `Test-Path game/android` returned `False`.
- Stop-hook continuation verification:
  - Re-ran `git diff --check`: exited 0; only LF/CRLF warning for `docs/60-implementation/index.md`.
  - Re-ran docs verification: Android-only, installable APK first, `game/dist`, quality gate, fallback, and reversible first-pass assumption were found in `docs/60-implementation/android-capacitor-webview.md`.
  - Re-ran plan verification: agent-executed verification gate, evidence-write allowance, final verification wave, package id, `adb install`, and Godot fallback guardrail were found in `.omo/plans/android-capacitor-webview.md`.
  - Re-ran draft verification: components ledger, Capacitor/WebView approach, approved gate, and reversible orientation assumption were found in `.omo/drafts/android-capacitor-webview.md`.
  - Re-ran no-implementation check: `Test-Path game/capacitor.config.ts` returned `False`; `Test-Path game/android` returned `False`.
- Stop-hook continuation verification 2:
  - Timestamp: `2026-06-29 18:32:49 +09:00`.
  - Re-ran `git diff --check`: exited 0; only LF/CRLF warning for `docs/60-implementation/index.md`.
  - Re-ran docs verification: Android-only, installable APK first, `game/dist`, quality gate, fallback, and reversible first-pass assumption were found in `docs/60-implementation/android-capacitor-webview.md`.
  - Re-ran plan verification: Android installable debug app, Must NOT guardrails, agent-executed verification, evidence-write allowance, `adb install`, and Godot fallback guardrail were found in `.omo/plans/android-capacitor-webview.md`.
  - Re-ran reviewer evidence check: Momus `OKAY`, Metis re-review `OKAY`, and first stop-hook continuation evidence were found in `.omo/notepad-mobile-capacitor-plan.md`.
  - Re-ran no-implementation check: `Test-Path game/capacitor.config.ts` returned `False`; `Test-Path game/android` returned `False`.
- Stop-hook continuation verification 3:
  - Timestamp: `2026-06-29 18:33:32 +09:00`.
  - Re-ran `git diff --check`: exited 0; only LF/CRLF warning for `docs/60-implementation/index.md`.
  - Re-ran docs verification: Android-only, installable APK first, `game/dist`, quality gate, fallback, and reversible first-pass assumption were found in `docs/60-implementation/android-capacitor-webview.md`.
  - Re-ran plan verification: Must NOT guardrails, agent-executed verification, evidence-write allowance, final verification wave, `adb install`, and Godot fallback guardrail were found in `.omo/plans/android-capacitor-webview.md`.
  - Re-ran no-implementation check: `Test-Path game/capacitor.config.ts` returned `False`; `Test-Path game/android` returned `False`.
  - Cleared completed OMX ultrawork planning state with `state_clear(mode="ultrawork")`; follow-up `state_list_active` returned `[]`.
  - Confirmed `.omx/state/ultrawork-state.json` no longer exists.
- Stop-hook continuation verification 4:
  - Timestamp: `2026-06-29 18:36:33 +09:00`.
  - Re-ran `git diff --check`: exited 0; only LF/CRLF warning for `docs/60-implementation/index.md`.
  - Found the remaining session-scoped active state at `.omx/state/sessions/019f127b-e6bb-7993-b35b-20cc390f069c/ultrawork-state.json`; it reported `active=true`, `current_phase=planning`.
  - Found matching session-scoped `skill-active` state containing `ultrawork` active in the same session.
  - Cleared session-scoped `ultrawork` and `skill-active` via `state_clear(..., session_id="019f127b-e6bb-7993-b35b-20cc390f069c")`.
  - Re-ran global and session-scoped `state_list_active`: both returned `[]`.
  - Re-ran state reads: session-scoped `ultrawork` and `skill-active` both returned `exists=false`.
  - Re-ran file checks: global ultrawork state, session ultrawork state, and session skill-active state all returned `False`.
  - Re-ran no-implementation check: `Test-Path game/capacitor.config.ts` returned `False`; `Test-Path game/android` returned `False`.
  - Re-ran docs/plan verification: Android-only, installable APK first, agent-executed verification, `adb install`, and Godot fallback guardrail were found.
