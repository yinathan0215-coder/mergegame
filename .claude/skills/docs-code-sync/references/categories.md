# docs-code-sync — categories, routing, domain partition

Read this before classifying findings. The value of the audit is precise, reproducible,
correctly-categorised findings — not a pile of vague "these feel different" notes.

## The 4 categories (precise definitions)

### undocumented — *in code, not (or under-) documented*
The code does something real that no design page states, or states only vaguely. Most common:
a new module absent from `60-implementation/architecture.md`'s module map; a hardcoded constant
that bypasses the `balance.json` SSoT; a behavior (e.g. a clamp, a juice effect) with no spec.
- codeRef = where it lives. docRef = the page that *should* hold it ("none" or the under-spec page).
- Suggested fix usually = add it to the owning doc (or lift the constant into `balance.json`).

### doc-ne-code — *a doc states X, the code does Y*
A documented number, rule, key name, or behavior that disagrees with the running code. The code
is the ground truth; the doc is stale. Quote the **actual value on each side**.
- Watch for stale **cross-references**: a "Relates to" line or an `index.md` summary that restates
  a value the canonical page already has right — the restatement drifts. Flag the drift, and note
  the canonical page is correct (so the fix is local).

### misclassified — *wrong section, or duplicated/contradicted across pages*
Content filed against the routing table below in the wrong folder, OR the same fact living in two
pages that now disagree (an internal contradiction). Phase-numbering that differs across impl
docs, an `index.md` catalog line that contradicts its own canonical page, a number stated twice
with two values.

### orphan-doc — *documented (or has balance data / assets) but not implemented*
A page (or a `balance.json` block, or an art asset) describes something the code does not do.
This is design written ahead of code — legitimate, but the GDD must not *assert it as built*.
- **You MUST prove absence**: grep the mechanic's likely symbols/keys across `game/src` and show
  zero consumers. "I didn't see it" is not proof; "`grep -riE 'stage|clearReward' game/src` = 0"
  is. Distinguish from undocumented dead *data* (a `balance.json` key with no code reader is
  code-side dead data, not doc-without-code — say so).

## Docs routing table (for the misclassified check)

| 지식 종류 | 올바른 위치 |
|---|---|
| 컨셉 / 핵심 재미 가설 | `docs/10-concept/` |
| 코어 루프 / 세션 흐름 / 온보딩 | `docs/20-core-loop/` |
| 이름 있는 시스템 / 메카닉 | `docs/30-systems/<slug>.md` |
| 명시 수치 / 커브 / 표 | `docs/40-balancing/` |
| 아트 방향 / UX 규칙 | `docs/50-art-ux/` |
| 스택 / 구조 / 태스크 / 런북 | `docs/60-implementation/` |
| KPI / 완료 체크리스트 | `docs/70-verification/` |
| 레퍼런스 / 시장 분석 | `docs/80-research/` |
| 구조/방법론 표준(부록) | `docs/90-methodology/` |
| 날짜 결정(ADR) | `docs/<section>/decisions/<YYYY-MM-DD>-<slug>.md` |

`index.md` pages should be **indexers** (links + one-line descriptions); narrative history belongs
in `docs/log.md`. An `index.md` that carries a drifting value or a dated status block is itself a
misclassification finding.

## Domain partition (coverage checklist)

Own every doc page and every code module by ≥1 domain. Gaps cause silent misses — tick each:

- [ ] **scenes / core-loop / title** — `main.ts`, `GameScene.ts` (scene state), `TitleScreen.ts`,
      `GalaxyBackground.ts` ↔ `20-core-loop/*`, `50-art-ux/{screen-structure,title-screen,galaxy-background,title-icons}`, `10-concept/{concept,fun-hypothesis}`
- [ ] **launcher / physics / merge / queue / boundary** — `Launcher.ts`, `PhysicsWorld.ts`,
      `MergeSystem.ts`, `QueueSystem.ts`, `Planet.ts`, `PlanetFactory.ts` ↔ `30-systems/{launcher,launch-queue,merge-rules,play-area-boundary,collision-shape,tier-unlock,initial-rack}`, `40-balancing/{launch-physics,spawn-rack}`, `50-art-ux/input-ux`
- [ ] **scoring / combo** — `ScoreSystem.ts`, `Combo.ts` ↔ `30-systems/scoring-combo`, `40-balancing/combo-scoring`, `40-balancing/decisions/*remove-combo*`
- [ ] **planet-ladder / balance data** — `data/{balance.json,config.ts,planets.ts}` ↔ `10-concept/planet-ladder`, `40-balancing/{planet-stats,index}`, `60-implementation/decisions/*data-driven*`
- [ ] **meta-economy** — `MetaStore.ts`, `MetaUI.ts`, `popups/*`, `UnlockModal.ts`, `ui/*` ↔ `30-systems/{meta-economy,daily-missions,attendance,lucky-wheel,shop,settings}`, `40-balancing/meta-economy`, `50-art-ux/popup-system`
- [ ] **render / art / HUD / effects** — `BoardRenderer.ts`, `Effects.ts`, `Hud.ts`, `assets.ts` ↔ `50-art-ux/{art-direction,feedback-effects,layout,planet-art}`
- [ ] **architecture / task-breakdown / verification / methodology** — module set vs `60-implementation/{architecture,task-breakdown,plan,tech-stack,agent-runbook}`, `70-verification/{checklist,kpi}`, `90-methodology/*`
- [ ] **sound** — `SoundManager.ts` (+ `play()`/mute call sites) ↔ `50-art-ux/sound-design`, `60-implementation/sound-manager`
- [ ] **game-modes / stage / launch-count / planet-charge / result** — grep `game/src` for mode/stage/launchCount/charge/result/gameOver ↔ `20-core-loop/game-modes`, `30-systems/{stage-mode,launch-count,planet-charge}`, `40-balancing/game-modes`, `50-art-ux/result-window`

This list is a starting point, not a fixed set — re-derive it from the *current* Glob output each
run, since modules and pages get added. The discipline is: enumerate, then assign, then confirm
nothing is unassigned.

## Worked false-positives (don't cry wolf)

Real examples this audit method has produced and then correctly *rejected* on verification:

- **"Planet `pattern` enum is never consumed by a renderer → orphan-doc."** Refuted: the renderer
  draws from PNG sprites (the documented rendering canon), so the documented patterns *are* on
  screen. The unread `pattern` field is code-side dead data, not a doc-without-code. Doc & code
  agree.
- **"Combo bonus not in the architecture score model → undocumented."** Refuted: the combo bonus
  *is* documented in the scoring page; `architecture.md` is an admitted overview that defers
  scoring to the balancing SSoT. Not a genuine gap (though a wrong *number* in that overview is a
  separate, real doc-ne-code finding — keep them distinct).

The lesson: before logging a finding, ask "could the other side satisfy this a different way I
haven't checked?" Grep for the alternative. A skeptically-verified small report beats a noisy one.
