// Credential source for the blocks/* builder scripts, in priority order:
// 1. process.env — the dynamic path: a real environment variable works on
//    any machine and in CI, no file needed (PowerShell:
//    $env:BLOCKS_WORKFLOW_CLIENT_ID = "…" for the session; setx for good).
// 2. .env.local — the local convenience: the same file Vite dev reads, so
//    one place holds every project credential on a dev machine.
// Nothing here ever reaches the browser bundle: the values only get
// injected into workflow definitions pushed to the platform, and the
// builder outputs (*-gate.json) are gitignored for exactly that reason.

import { readFileSync } from "node:fs";

let dotEnv = null;
const readDotEnv = () => {
  if (dotEnv) return dotEnv;
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    dotEnv = Object.fromEntries(
      text
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const i = line.indexOf("=");
          return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
        }),
    );
  } catch {
    dotEnv = {}; // no .env.local — process.env is the only source then
  }
  return dotEnv;
};

// One variable: process.env wins, .env.local fills in; empty counts as
// missing in both so a half-filled file can't silently win.
export const credential = (name) =>
  process.env[name]?.trim() || readDotEnv()[name]?.trim() || "";

// Resolve a list of names, or exit with one message naming what's missing
// and both places it looked.
export const requireCredentials = (names) => {
  const resolved = {};
  const missing = [];
  for (const name of names) {
    const value = credential(name);
    if (value) resolved[name] = value;
    else missing.push(name);
  }
  if (missing.length > 0) {
    console.error(
      `missing ${missing.join(", ")} — set them as environment variables or in .env.local`,
    );
    process.exit(1);
  }
  return resolved;
};
