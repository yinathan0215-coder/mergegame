#!/usr/bin/env node
// Stop hook — mergegame commit-on-done gate.
//
// Rule: a turn that modifies repo files should end with a `git commit`, so the user
// can review that turn's work via `git diff`. This hook guards it: if the turn used a
// file-writing tool but ran NO `git commit`, block ONCE and require a commit (or a
// one-line reason none was needed).
//
// Companion rule: .claude/rules/commit-on-done.md
// Fail-open on every error; honors stop_hook_active so it reminds once, never loops.

import fs from "node:fs";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

// Tools that mutate files in the working tree.
const EDIT_TOOLS = new Set(["Edit", "Write", "NotebookEdit", "MultiEdit"]);
// Tools that can run a shell command (and thus `git commit`). RTK's `rtk git commit`
// still contains the "git commit" substring, so the regex catches the proxied form too.
const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);
const COMMIT_RE = /git\s+commit/i;

function main() {
  const raw = readStdin();
  if (!raw) return 0;

  let hook;
  try {
    hook = JSON.parse(raw);
  } catch {
    return 0;
  }
  if (hook.stop_hook_active) return 0; // remind once, never loop

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

  // Turn start = last real user *text* message (mirrors docs-reconcile-check).
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

  // Walk the turn: did we write any file, and did we run `git commit`?
  let editedFiles = false;
  let committed = false;
  const touched = new Set();
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
      if (EDIT_TOOLS.has(b.name)) {
        editedFiles = true;
        const p = b.input && b.input.file_path;
        if (typeof p === "string") touched.add(p);
      }
      if (SHELL_TOOLS.has(b.name)) {
        const cmd = b.input && b.input.command;
        if (typeof cmd === "string" && COMMIT_RE.test(cmd)) committed = true;
      }
    }
  }

  if (!editedFiles) return 0; // pure conversation/search → nothing to commit
  if (committed) return 0; // already committed this turn → fine

  const files = [...touched];
  const list =
    files.length <= 6
      ? files.join(", ")
      : files.slice(0, 6).join(", ") + ` (+${files.length - 6} more)`;

  const reason = [
    "[commit-on-done] This turn modified files but ran no `git commit`.",
    "A finished turn should leave a reviewable commit so the user can `git diff` your work (.claude/rules/commit-on-done.md).",
    files.length ? `Files touched this turn: ${list}.` : "",
    "Reconcile/reflect docs first if the docs pipeline asked, then stage ONLY this turn's files and commit with a meaningful message you write yourself (not auto-generated). Don't push.",
    "If a commit is genuinely not wanted (user said not to, no real change, throwaway scratch, or an unrelated pre-existing mess to sort first), say so in one sentence and stop. One pass only — do not loop.",
  ]
    .filter(Boolean)
    .join(" ");

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  return 0;
}

try {
  process.exit(main());
} catch {
  process.exit(0);
}
