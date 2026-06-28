---
name: docs-code-sync
description: >
  AUDIT docs↔code consistency for Planet Pool Merge: cross-reference the GDD (`docs/**`) against
  the built implementation (`game/src/**`) and report every mismatch in 4 categories —
  **undocumented** (in code, not docs), **doc-ne-code** (a doc states X, code does Y),
  **misclassified** (filed in the wrong docs section / duplicated or contradicted across pages),
  **orphan-doc** (documented, or has balance data/assets, but not implemented). Read-only
  diagnosis: writes ONE timestamped report to `docs/70-verification/audits/` with a P0/P1/P2 fix
  worklist; the actual fixes are a separate later turn. Use this whenever the user wants to check
  whether the docs and the code agree, find stale or undocumented design, hunt 오분류, or verify
  that what's documented is actually built (and vice-versa). This is a DIFFERENT axis from
  [[methodology-audit]] (which scores code *structure* against the methodology standard) — reach
  for THIS skill for docs-vs-implementation **accuracy**. Triggers on "문서 구현 일치", "문서랑 코드
  맞는지", "문서에 반영 안 된", "구현이랑 다른", "오분류", "정합 감사", "구현 반영 확인", "문서가 정확한지",
  "docs sync", "doc-code drift", "spec vs code", "is the doc accurate".
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
---

# docs-code-sync

`docs/` is the agent-executable GDD and **single source of truth**; `game/src/` is the built
HTML5 prototype. The docs-pipeline keeps them aligned turn-by-turn, but drift still accumulates:
an ADR declares a system "removed" while the code keeps it, a scoring number says `+1` in five
pages while the code awards `+3`, a whole design layer gets written but never built, a module
ships with no doc. This skill is the **periodic reconciliation check** that finds that drift and
turns it into an actionable worklist.

**It is audit-only.** It never edits `game/` code and never rewrites the design pages it audits.
It writes one report and stops. Fixing is a separate, later turn that reads the report (see
"수정 프로세스"). Keeping diagnosis and repair apart keeps each report a clean snapshot you can
diff over time, and lets the user decide *which* side is wrong (fix the doc, or fix the code).

It is the **complement** of [[methodology-audit]]: that skill asks "is the code well-structured
against the methodology?"; this skill asks "do the docs and the code say the same thing?"

## When to run

- The user asks whether the docs match the implementation ("문서랑 코드 맞는지", "구현 반영 확인",
  "spec vs code", "is the doc still accurate").
- After a burst of building, to catch docs that the code has outrun (or design written ahead of code).
- Before a submission/milestone, so the GDD doesn't assert features that aren't there.

## The 4 categories (what you are looking for)

| 분류 | 뜻 | 예 |
|---|---|---|
| **undocumented** | 코드에 있는데 문서에 없음(또는 현저히 미반영) | 새 모듈이 `architecture.md` 모듈표에 없음 |
| **doc-ne-code** | 문서가 말하는 값/규칙이 코드와 다름 | 문서 "충돌 +1" ↔ 코드 wall +1 / ball +3 |
| **misclassified** | 잘못된 섹션에 있음 / 두 페이지가 같은 값을 중복·모순 | 같은 점수가 index 요약과 정본에서 충돌 |
| **orphan-doc** | 문서(또는 balance 데이터·에셋)엔 있는데 코드 미구현 | game-modes 레이어가 설계만 있고 코드 0 |

Full taxonomy with edge cases, the docs routing table, and a worked false-positive list:
**read `references/categories.md`** before classifying — getting the category right (and not
crying wolf) is the whole value.

## Process

1. **Inventory BOTH sides completely — with Glob, never `find`.** `find` output gets truncated
   and you will silently miss whole files (this skill exists partly because a truncated listing
   once hid an entire `game-modes`/`sound` doc layer). Run:
   - `Glob docs/**/*.md` (exclude `00-meta/input-log`, `00-meta/templates`) — the design pages.
   - `Glob game/src/**/*.ts` + `game/src/data/*.json` — the modules + data SSoT.
   - Note the git short SHA (`git rev-parse --short HEAD`) so the report pins what was audited.
   Cross-check counts: if a docs section index links pages your Glob didn't list, or vice-versa,
   resolve the discrepancy before proceeding. **Coverage is the #1 failure mode** — a miss reads
   as "everything matches" when it doesn't.
2. **Partition into feature domains** so every doc page AND every code module is owned by exactly
   one domain (overlap is fine; *gaps are not*). The standard partition + a coverage checklist is
   in `references/categories.md` "Domain partition". Typical domains: scenes/core-loop/title ·
   launcher/physics/merge · scoring/combo · planet-ladder/balance-data · meta-economy ·
   render/art/HUD · architecture/verification/methodology · sound · game-modes/stage/result.
3. **Audit each domain by reading BOTH sides.** For every documented claim, open the cited code
   and **confirm wiring with Grep** — a symbol that is declared but never imported/called is dead
   data, not an implementation (e.g. an exported constant with zero consumers). For every code
   behavior, check the owning doc. Record each mismatch with **exact `docRef` (file:line)** and
   **`codeRef` (file:line, or "none — grep X across game/src = 0")**, the actual value on each
   side, and a one-line suggested fix (which side to change).
4. **Adversarially verify every finding before you trust it.** Re-open the cited files and
   **re-run the grep yourself**; default to skeptical. For an orphan-doc claim you MUST grep the
   mechanic's symbols across `game/src` and confirm zero consumers before agreeing. Drop or
   re-label anything you can't reproduce. (In practice ~5% of first-pass findings are false —
   e.g. "this enum is unused" when the renderer reads it a different way. Catching those is what
   makes the report trustworthy.) For a large/thorough audit you may fan this out with the
   `Workflow` tool — one agent per domain (read → classify), then a verify stage per finding —
   but the same read→classify→verify discipline applies whether inline or fanned out.
5. **Aggregate.** Count confirmed findings by category and severity (high/med/low). Note refuted
   (false-positive) findings separately for calibration.
6. **Stamp + write the report.** Get the time (`date "+%Y-%m-%d-%H%M"`); write to
   `docs/70-verification/audits/<YYYY-MM-DD-HHmm>-docs-code-sync-audit.md` using the template below.
7. **Reconcile (docs pipeline).** Add a one-line link under `docs/70-verification/index.md`
   "## 감사 로그", and append `docs/log.md` (`## [date] auto | docs↔code 정합 감사 (N건)` + `why:`).
   This skill writing its own report is a verification artifact, not a design change — so this is
   the only `docs/` write it makes; it does not touch the design pages it audited.
8. **Report to the user**: category counts + the highest-severity discrepancies + the report path.
   Then **stop** — do not fix anything.

## Report template

ALWAYS write the report in this shape (positive, file-anchored, actionable):

```markdown
---
id: docs-code-sync-audit-<YYYY-MM-DD-HHmm>
note_type: checklist
status: active
domain: verification
created: <YYYY-MM-DD HH:MM KST>
target: docs/** ↔ game/src @ <git-short-sha>
tags: [audit, docs-code-sync, planet-pool-merge]
---

# 코드 ↔ 문서 정합 감사 (<YYYY-MM-DD HH:MM>)

> 진단 전용. `docs/`(정본) ↔ `game/src/`(구현) 교차 대조. 확정 불일치 **N건**
> (undocumented X · doc-ne-code Y · misclassified Z · orphan-doc W). 수정은 §워크리스트를
> 읽는 별도 단계. methodology-audit(구조 감사)와 별 축(문서 정확도).

## 0. 한눈에 — 서브시스템 구현 상태
| 서브시스템 | 문서 | 코드 | 판정 |
|---|---|---|---|
| ... | 상세/일부/없음 | 구현/일부/없음 | ✅ 일치 / ⚠️ 불일치 / ❌ 미구현 |

## 1. 문서엔 있으나 구현 없음 (orphan-doc)
### 🔴 <제목>
- 문서: `docs/<path>:<line>` · 코드: none — `grep <sym> game/src` = 0
- 내용: 문서가 말하는 것 vs 코드 현실(정확히)
- 권고: 구현 / 또는 문서를 draft·미구축 표기

## 2. 문서 ≠ 구현 (doc-ne-code)
### 🔴 <제목> — 문서 `path:line` ↔ 코드 `file:line`
- 문서 값/규칙 vs 코드 값/규칙(실제 수치 양쪽), 권고(어느 쪽을 고칠지)

## 3. 구현됐으나 문서 미반영 (undocumented)
## 4. 오분류 / 문서 내부 모순 (misclassified)

## 우선순위 수정 워크리스트 (다음 단계 입력)
- **P0** 정본이 거짓을 단언 — <행동>, 검증: <어떻게 확인>
- **P1** 구현/문서 한쪽 맞추기 — ...
- **P2** cross-ref·요약 drift·미세 — ...

## 반증된 항목 (오탐, 참고)
- <제목> → 왜 실제 불일치가 아닌지
```

## 수정 프로세스 (별도 단계 — 이 스킬은 실행하지 않음)

The report is the worklist. A later turn (or the user saying "이 감사 기반으로 고쳐") runs the fix
loop — deliberately separate so each audit stays a clean snapshot:

1. **Read the latest report** in `docs/70-verification/audits/` (newest timestamp).
2. **Decide per finding which side is wrong.** doc-ne-code/undocumented/misclassified usually fix
   the **doc** (the code is the truth); orphan-doc is a choice: build it, or mark the page
   `status: draft`/미구축 so the GDD stops asserting an unbuilt feature. Confirm with the user
   when the direction isn't obvious.
3. **Reconcile the doc as positive canonical** (`.claude/rules/docs-auto-reflect.md` — no
   changelog/history in section pages; history goes to `log.md`). If fixing code, follow the
   docs-pipeline (doc leads) and verify with `npm run typecheck` + the Playwright suite.
4. **Re-run this audit** and confirm the count dropped; link old→new.

Don't batch unrelated fixes, and don't let a refactor outrun the docs — the documented design
leads (`.claude/rules/docs-pipeline.md`).
