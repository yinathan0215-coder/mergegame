# mergegame

Global casual **Merge** game — an HTML5 playable prototype. This repo is a game
repository: `docs/` is an **agent-executable 기획문서 (GDD)** that
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

## Commit on done

When a turn **changes files in the repo, end it with a `git commit`** so the user can review
that turn's work with `git diff`. Stage **only that turn's files** (not a blanket `git add
-A`), write a meaningful message yourself, and don't push. Full rule:
`.claude/rules/commit-on-done.md`. The `Stop` hook `.claude/hooks/commit-check.mjs` enforces
it — it blocks **once** if a turn wrote files but ran no commit. Reconcile/reflect docs
*before* committing so the commit captures them. Skip only when nothing changed, the user
said not to, or the tree has unrelated pre-existing changes to sort first.

## 방법론 기준 (구조 표준)

프로토타입 설계·구현은 **`docs/90-methodology/index.md`** (AI-Agent Friendly 표준)을 따른다:
ECS-lite · State Machine · Game Loop/Fixed Step · Data-driven · Event-driven ·
Layered Rendering · Acceptance-test. 방법론 = 제네릭 표준(단일 출처), 각 GDD 섹션은 그것을
merge 게임 전용으로 인스턴스화하고 해당 모듈을 링크한다.

## 개발 규약 / 코드 건강 (dev discipline)

코드 작업엔 글로벌 **karpathy-guidelines**(Think-first · Simplicity · Surgical · Goal-driven)를
적용한다 — 단, **단일책임/과집중(갓오브젝트) 금지**는 karpathy가 아니라 방법론
`docs/90-methodology/ecs-lite.md` 소관이다(karpathy엔 SRP 항목 없음). 이 원칙들이 지켜지는지는
**`methodology-audit`** 스킬로 점검한다: `game/src`를 방법론 7기둥 + 단일책임 + karpathy로 점수화하고
`docs/70-verification/audits/<YYYY-MM-DD-HHmm>.md`에 보고서 + 우선순위 수정 워크리스트를 남긴다(감사
전용; 실제 수정은 그 문서를 읽는 **별도 단계**). 구조 감사·수정 워크리스트의 단일 출처 = 그 폴더.

## Vault map (game-doc aligned)

| Folder | Holds | Project scope |
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
