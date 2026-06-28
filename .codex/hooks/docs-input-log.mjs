#!/usr/bin/env node
// UserPromptSubmit hook — mergegame docs pipeline, stage 1 of 3.
//
//   stage 1 (here):  ALWAYS append the raw user prompt VERBATIM to
//                    docs/00-meta/input-log/<YYYY-MM-DD>.md   (deterministic, no judgment)
//   stage 2 (here):  inject a directive telling the assistant to reconcile the
//                    instruction against existing docs and fix any that differ
//   stage 3 (Stop):  docs-reconcile-check.mjs enforces that the reconcile happened
//
// Companion rule: .codex/rules/docs-pipeline.md
// Fail-open on every error — a knowledge hook must never block the user's turn.

import fs from "node:fs";
import path from "node:path";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const pad = (n) => String(n).padStart(2, "0");

function main() {
  const raw = readStdin();
  if (!raw) return 0;

  let hook;
  try {
    hook = JSON.parse(raw);
  } catch {
    return 0;
  }

  const prompt = hook && typeof hook.prompt === "string" ? hook.prompt : "";
  if (!prompt.trim()) return 0;

  const projectDir =
    process.env.CODEX_PROJECT_DIR || hook.cwd || process.cwd();
  const logDir = path.join(projectDir, "docs", "00-meta", "input-log");

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
    now.getSeconds()
  )}`;
  const session = String(hook.session_id || "unknown").slice(0, 8);

  // ── stage 1: unconditional, verbatim capture ──────────────────────────────
  // The raw bytes of the prompt are written exactly as submitted. This is the
  // "무조건 그대로 기록" guarantee — done by the hook, not by the assistant's judgment.
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const file = path.join(logDir, `${dateStr}.md`);
    let body = "";
    if (!fs.existsSync(file)) {
      body +=
        `---\n` +
        `note_type: input-log\n` +
        `status: active\n` +
        `updated: ${dateStr}\n` +
        `---\n\n` +
        `# Input log — ${dateStr}\n\n` +
        `> Verbatim, append-only record of every user instruction (hook-written). ` +
        `Do not edit by hand — this is the raw source the docs are reconciled against.\n`;
    }
    body +=
      `\n---\n\n` +
      `## ${timeStr} · session ${session}\n\n` +
      prompt.replace(/\r\n/g, "\n") +
      `\n`;
    fs.appendFileSync(file, body, "utf8");
  } catch {
    // fail-open: never block the turn because logging failed
  }

  // ── stage 2: drive the reconcile-then-work pipeline ───────────────────────
  // Plain stdout text on a UserPromptSubmit hook is injected into the model's
  // context for this turn.
  const ctx = [
    `[docs pipeline] Your latest instruction was logged verbatim to docs/00-meta/input-log/${dateStr}.md.`,
    `docs/ is the agent-executable 기획문서 (GDD) and living source of truth. Before acting on anything design / content / implementation related, follow .codex/rules/docs-pipeline.md:`,
    `1) Read docs/index.md, then the relevant numbered section (10-concept, 20-core-loop, 30-systems, 40-balancing, 50-art-ux, 60-implementation, 70-verification).`,
    `2) RECONCILE FIRST: if this instruction changes, contradicts, or adds to anything documented, UPDATE the affected section (and docs/log.md) BEFORE implementing — then build on the corrected docs. Cite [[doc/path]] when you rely on a doc.`,
    `3) If the instruction is pure tooling/chore, or docs already match, proceed directly — no doc edit needed. Don't fabricate undecided design (genre detail & stack are still open) — keep such pages status: draft.`,
    `Do not announce this load; surface it only by citing a doc or noting a doc you updated.`,
  ].join("\n");

  process.stdout.write(ctx);
  return 0;
}

try {
  process.exit(main());
} catch {
  process.exit(0);
}
