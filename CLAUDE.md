# mergegame

Global casual **Merge** game — an HTML5 playable prototype. This repo is built for the
Bagelcode game-design-PD assignment: `docs/` is an **agent-executable 기획문서 (GDD)** that
makes a coding agent build a playable Core Loop prototype, and stays the living source of
truth while `game/` is built.

- `docs/` — the planning document (the submission). Section map: `docs/README.md`.
- `game/` — the HTML5 prototype (stack undecided → reserved/empty).

## Docs pipeline (read this first)

Every turn runs **log → reconcile → work**. Full spec: `.claude/rules/docs-pipeline.md`.

1. **Log (automatic).** A `UserPromptSubmit` hook appends every instruction verbatim to
   `docs/00-meta/input-log/<YYYY-MM-DD>.md`. Never hand-edit that log.
2. **Reconcile (do this BEFORE building).** For any design / implementation instruction,
   read `docs/index.md` + the relevant section. If the instruction **changes,
   contradicts, or adds to** the docs, **update the docs first** — then build on the
   corrected docs. Cite `[[doc/path]]`.
3. **Verify (automatic).** A `Stop` hook blocks once if a design turn ended without any
   `docs/` update. Resolve by updating the doc, or stating in one sentence why none was
   needed.

> Stronger-than-usual rule: the documented design leads and the work follows it. If a new
> instruction disagrees with a doc, the doc is wrong until you fix it — fix it first.

Use the **`docs-find`** skill to read the vault and **`docs-write`** to update it (turn-end
reflex: `.claude/rules/docs-auto-reflect.md`). **Don't fabricate undecided design** —
genre detail and tech stack are open; keep such pages `status: draft`. The bar for every
page is **agent-executability**: state what an agent can't infer.

## 방법론 기준 (구조 표준)

프로토타입 설계·구현은 **`docs/90-methodology/index.md`** (AI-Agent Friendly 표준)을 따른다:
ECS-lite · State Machine · Game Loop/Fixed Step · Data-driven · Event-driven ·
Layered Rendering · Acceptance-test. 방법론 = 제네릭 표준(단일 출처), 각 GDD 섹션은 그것을
merge 게임 전용으로 인스턴스화하고 해당 모듈을 링크한다.

## Vault map (assignment-aligned)

| Folder | Holds | 과제 요구 |
|---|---|---|
| `docs/00-meta/` | Pipeline rules, schema, templates, **input-log** | — |
| `docs/10-concept/` | Concept + core fun hypothesis | ① |
| `docs/20-core-loop/` | Core loop + play flow | ② |
| `docs/30-systems/` | Detailed merge systems/mechanics | ③ input |
| `docs/40-balancing/` | Explicit balancing numbers | ④ |
| `docs/50-art-ux/` | Art direction + UX guidance | ④ |
| `docs/60-implementation/` | Tech stack, structure, task breakdown, runbook | ③ |
| `docs/70-verification/` | KPI / prototype checklist | ⑤ |
| `docs/80-research/` | Reference teardowns, market notes | 근거 |
| `game/` | Built HTML5 prototype (stack TBD) | ③ 산출물 |
