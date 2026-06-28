#!/usr/bin/env node
// SessionStart hook — mergegame docs pipeline.
//
// Loads the turn-end reflect reflex into context at the start of every session
// (startup / resume / compact) so docs/ auto-reflect is ALWAYS active. It reads the
// canonical rule file and injects it verbatim — single source of truth, no drift.
//
// Companion rule injected:  .codex/rules/docs-auto-reflect.md
// Companion pipeline:        .codex/rules/docs-pipeline.md
// Fail-open on every error — a context hook must never break session startup.

import fs from "node:fs";
import path from "node:path";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  // Hook input is JSON on stdin (hook_event_name, source, session_id, cwd, ...).
  // We don't need any field except cwd as a fallback for the project dir.
  let hook = {};
  try {
    hook = JSON.parse(readStdin() || "{}");
  } catch {
    hook = {};
  }

  const projectDir =
    process.env.CODEX_PROJECT_DIR || hook.cwd || process.cwd();
  const ruleFile = path.join(
    projectDir,
    ".codex",
    "rules",
    "docs-auto-reflect.md"
  );

  let rule;
  try {
    rule = fs.readFileSync(ruleFile, "utf8").trim();
  } catch {
    return 0; // rule missing → inject nothing, never block startup
  }
  if (!rule) return 0;

  const out =
    `[docs pipeline] Turn-end reflect reflex is ACTIVE this session. ` +
    `At the end of each turn, follow this rule (canonical: .codex/rules/docs-auto-reflect.md). ` +
    `Surface it only by filing a doc or noting in the end-of-turn summary — do not announce this load.\n\n` +
    rule;

  process.stdout.write(out);
  return 0;
}

try {
  process.exit(main());
} catch {
  process.exit(0);
}
