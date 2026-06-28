# Scoring rubric — per-dimension anchors

The scoring key for `methodology-audit`. Each dimension lists **what 5 looks like**, the
**anti-patterns** that drop the score (lifted from the methodology pages' own 안티패턴/완료기준),
and **where to look** in `game/src`. Score 0–5; cite `file:line` for anything below 5.

Source of truth for the principles: the named `docs/90-methodology/*` page. If a principle and
this file disagree, the methodology page wins — update this file.

---

## 1. Data-driven / SSoT (weight 15) — [[data-driven]] · [[agent-friendly-spec]] §원칙5

- **5**: every tunable (radius, score, cost, timing, layout, colour, juice) resolves to ONE
  source (`game/src/data/balance.json`); loaders (`config.ts`, `planets.ts`) declare no tunable
  literals, only load + derive; integrity guards present.
- **Anti-patterns**: same number hardcoded in code/UI/test; magic numbers with no unit/intent;
  a second un-tabled island of layout/colour constants (e.g. a screen file with its own palette);
  per-tier tables duplicated in code instead of data.
- **Look at**: `data/balance.json`, `data/config.ts`, `data/planets.ts`, and any `*.ts` with
  numeric literals that look like balance/layout (grep for `0x`, px sizes, ms durations).
- **Exempt**: `balance.json` being one big file is *correct* (recommended SSoT), not 과집중.

## 2. 단일책임 / 과집중 (weight 15) — [[ecs-lite]] 금지 안티패턴 · 60-impl/architecture "한 가지 책임만"

- **5**: each module's responsibility states in one phrase; no file mixes simulation rules +
  rendering + input + UI + lifecycle + debug; adding an item/effect doesn't force editing a big
  orchestrator.
- **Anti-patterns** (each drops a point): a `GameManager`/`GameScene` that does input + balance +
  render + UI + spawn + boundary physics + debug; a class that owns analytic physics AND scene
  transition AND test hooks; render functions mutating game state; click handlers writing several
  systems' internals.
- **Heuristic**: list each file's distinct responsibilities. **≥3 responsibilities** or **>250
  lines of non-data logic** = god-object candidate → name the split (which responsibility moves
  where). A long-but-cohesive pure-function file (one responsibility, e.g. geometry derivation)
  is NOT a violation — judge by responsibility count, not raw length.
- **Look at**: the largest files by `wc -l`; for each, enumerate responsibilities.

## 3. Acceptance-test / 검증 (weight 12) — [[acceptance-test]]

- **5**: an automated suite drives the real build through observable Core-Loop checks (enter →
  act → reward/merge → score → containment/result); debug hooks expose key state; "관찰 가능"
  not "느껴진다".
- **Anti-patterns**: no Core-Loop completion test; only "looks fun" subjective criteria;
  run instructions but no play-completion check; missing session-completeness (result/restart)
  where the design has it.
- **Look at**: `game/tests/*.spec.ts`, the `__game` debug surface in `GameScene`.

## 4. State Machine (weight 12) — [[state-machine]]

- **5**: flow is a declared state set with a transition table; per-state input/time/UI policy is
  explicit; modals block world input; restart/reset targets defined; minimum 플레이 전/중/중단·결과
  distinguished (or a documented reason a category is absent, e.g. endless arcade has no fail).
- **Anti-patterns**: `isPlaying`/`isPaused`/`isGameOver` boolean combos that can co-exist; an
  in-game modal pause done as a `paused = true` flag instead of a state; ad-hoc transition logic
  with no table; an undocumented state.
- **Look at**: scene/state enum + transitions in `GameScene`; any `paused`/`is*` booleans;
  reconcile against `docs/20-core-loop/screen-flow`.

## 5. ECS-lite 분해 (weight 10) — [[ecs-lite]]

- **5**: Core-Loop objects are thin entities (data) + systems (rules); render reads state,
  never writes rules; systems each describable in one sentence.
- **Anti-patterns**: a `Player`/entity class doing UI text + sound + spawn + rewards; render
  loop changing currency/score; no separation of state-data from rule-logic.
- **Look at**: `Planet.ts` (entity), the `*System.ts` files, who mutates what.

## 6. Game Loop / Fixed Step (weight 10) — [[game-loop]]

- **5**: state changes use fixed step or deltaTime (not frame count); max-deltaTime cap +
  catch-up limit guard tab-switch runaway; cooldown/spawn/motion/lifetime all time-based;
  pause/popup time policy explicit.
- **Anti-patterns**: per-frame increments (`x += 5` per tick) for time-sensitive values; no
  deltaTime clamp; unclear what freezes during a popup.
- **Look at**: the tick/update loop, accumulator, `STEP_MS`, `deltaMS` usage.

## 7. Event-driven (weight 10) — [[event-driven]]

- **5**: systems don't call each other's internals; meaningful changes flow through events or
  injected callbacks with clear payloads; no system reaches into another's state.
- **Anti-patterns**: `CombatSystem` calling `UISystem.updateHpBar()` directly; `MergeSystem`
  mutating `ScoreSystem`'s value; per-frame events for position; duplicate event → double reward.
- **Partial-credit note**: DI callbacks routed through one orchestrator achieve decoupling but
  lack a named Event Catalog (payload/subscriber table) — score 3–4, not 5, and note the gap.
- **Look at**: constructor wiring, `on*`/`onChange`/host-interface callbacks; check no direct
  cross-system mutation.

## 8. Layered Rendering (weight 8) — [[layered-rendering]]

- **5**: every draw target sits in an ordered layer (background→world→entity→effect→ui→modal);
  modal blocks behind-input; key HUD numbers always readable; debug separable.
- **Anti-patterns**: arbitrary draw order; clickable object behind an active popup; core-loop
  objects lost under effects/background.
- **Look at**: layer containers + z-order in `GameScene`/`BoardRenderer`; `stopPropagation` /
  input gating on modal & HUD.

## 9. Code discipline / karpathy (weight 8) — [[agent-friendly-spec]] + karpathy §2/§4

- **5**: no dead/vestigial code or unused fields; no speculative abstraction or
  configurability that wasn't needed; changes verified by tests.
- **Anti-patterns**: typed-but-never-read fields (vestigial data), unused exports/imports,
  abstractions with a single call site, "flexibility" nobody asked for.
- **Look at**: grep for declared-but-unread types/fields; unused exports; one-call-site
  abstractions. (karpathy §1 Think-first / §3 Surgical are *process* traits — judge from git
  history if asked, but don't score them against static code.)

---

## Weighting recap

`contribution = weight × (score/5)`; total over the 9 rows = `/100`. Weights bias toward what the
methodology's conflict-priority order protects first (Core-Loop playability, verifiability,
state/restart stability) over visual polish — see [[index]] §판단 우선순위.
