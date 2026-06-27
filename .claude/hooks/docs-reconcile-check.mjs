#!/usr/bin/env node
// Stop hook — mergegame docs pipeline, stage 3 (enforcement).
//
// The pipeline is: log (always) → reconcile docs (if they differ) → work from docs.
// This hook guards the "reconcile" step: if the turn carried real domain intent
// but NO docs/ file was created or edited, block ONCE and require reconciliation.
//
// Companion rule: .claude/rules/docs-pipeline.md
// Fail-open on every error; honors stop_hook_active to avoid loops.

import fs from "node:fs";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Domain-intent keywords (merge-game tuned, EN + KO). If the user's turn matches,
// the turn plausibly changed documented truth and must be reconciled.
const INTENT =
  /design|spec|concept|core ?loop|game ?loop|balance|tun(?:e|ing)|progression|econom|mechanic|merge|chain|generator|producer|board|grid|energy|reward|monetiz|\blevel|content|feature|system|onboard|art|\bux\b|kpi|checklist|prototype|stack|기획|설계|컨셉|재미|가설|밸런스|튜닝|조정|성장|진행|경제|메카닉|머지|합성|생성기|보드|에너지|보상|레벨|콘텐츠|기능|시스템|루프|온보딩|아트|프로토타입|체크리스트|검증/i;

function isDocsPath(p) {
  if (typeof p !== "string") return false;
  const low = p.toLowerCase().replace(/\\/g, "/");
  return low.includes("/docs/") || low.startsWith("docs/");
}

function main() {
  const raw = readStdin();
  if (!raw) return 0;

  let hook;
  try {
    hook = JSON.parse(raw);
  } catch {
    return 0;
  }
  if (hook.stop_hook_active) return 0;

  const tp = hook.transcript_path;
  if (!tp || !fs.existsSync(tp)) return 0;

  let lines;
  try {
    lines = fs
      .readFileSync(tp, "utf8")
      .split("\n")
      .filter((l) => l.trim());
  } catch {
    return 0;
  }
  if (!lines.length) return 0;

  // Locate the start of the current turn = last real user *text* message.
  let turnStart = 0;
  for (let i = lines.length - 1; i >= 0; i--) {
    let e;
    try {
      e = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (e.type !== "user") continue;
    const c = e.message && e.message.content;
    let real = false;
    if (typeof c === "string" && c) real = true;
    else if (Array.isArray(c))
      real = c.some((b) => b && b.type === "text" && b.text);
    if (real) {
      turnStart = i;
      break;
    }
  }

  // Extract the user's text for this turn.
  let userText = "";
  try {
    const u = JSON.parse(lines[turnStart]);
    const c = u.message && u.message.content;
    if (typeof c === "string") userText = c;
    else if (Array.isArray(c))
      userText = c
        .filter((b) => b && b.type === "text")
        .map((b) => b.text)
        .join("\n");
  } catch {
    /* ignore */
  }

  if (!INTENT.test(userText)) return 0; // no domain intent → nothing to reconcile

  // Did this turn write to docs/ (reconcile happened) or at least read docs/?
  let wroteDocs = false;
  let readDocs = false;
  for (let i = turnStart; i < lines.length; i++) {
    let e;
    try {
      e = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (e.type !== "assistant") continue;
    const c = e.message && e.message.content;
    if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (!b || b.type !== "tool_use") continue;
      const p = b.input && b.input.file_path;
      if (
        ["Edit", "Write", "NotebookEdit", "MultiEdit"].includes(b.name) &&
        isDocsPath(p)
      )
        wroteDocs = true;
      if (b.name === "Read" && isDocsPath(p)) readDocs = true;
    }
  }

  if (wroteDocs) return 0; // reconcile / reflect already happened this turn

  const reason = [
    "[docs pipeline] This turn acted on design / content / architecture but did not update docs/.",
    "The required flow is: log → reconcile docs → work from docs (.claude/rules/docs-pipeline.md).",
    readDocs
      ? "You consulted docs but recorded nothing. If this instruction changed or added to the documented truth, update the affected doc (plus its index and nearest log.md) now."
      : "Reconcile the latest instruction against docs/ now: update the doc(s) it changes or adds to, refresh the nearest index, and append the nearest log.md.",
    "If this was genuinely pure tooling/chore, or docs already fully match, say so in one sentence and stop. One pass only — do not loop.",
  ].join(" ");

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  return 0;
}

try {
  process.exit(main());
} catch {
  process.exit(0);
}
