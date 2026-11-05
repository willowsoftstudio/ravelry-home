#!/usr/bin/env node
// ISA ISC-16: the verification note has exactly one valid row per capability.
// Usage: node scripts/check-api-verification.mjs specs/ravelry-api-verification.md
import { readFileSync } from "node:fs";

const REQUIRED = [
  "patterns-search", "patterns-show", "pattern-categories", "pattern-attributes",
  "yarns-search", "yarns-show", "current-user", "projects-read", "projects-write",
  "stash-read", "stash-write", "queue-read", "queue-write", "favorites-read",
  "favorites-write", "library-read", "photos-upload", "messages-read", "messages-send",
  "forums-read", "forums-post", "friends-activity", "carts", "checkout", "deliveries",
  "oauth2-scopes", "rate-limit",
];

const file = process.argv[2] ?? "specs/ravelry-api-verification.md";
const lines = readFileSync(file, "utf8").split(/\r?\n/);
const errors = [];
const seen = new Map();

for (const line of lines) {
  if (!line.startsWith("| ") || /^\|\s*-/.test(line) || line.startsWith("| capability")) continue;
  const cells = line.split("|").slice(1, -1).map((c) => c.trim());
  const [capability, status, checked, evidence] = cells;
  if (!REQUIRED.includes(capability)) {
    errors.push(`unknown capability row: ${capability}`);
    continue;
  }
  if (seen.has(capability)) errors.push(`duplicate row: ${capability}`);
  seen.set(capability, true);
  if (!["confirmed", "unconfirmed"].includes(status)) errors.push(`${capability}: bad status "${status}"`);
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(checked ?? "")) errors.push(`${capability}: bad date "${checked}"`);
  const okEvidence = /^https:\/\/www\.ravelry\.com\/api/.test(evidence ?? "") || /\b[1-5]\d{2}\b/.test(evidence ?? "");
  if (!okEvidence) errors.push(`${capability}: evidence must be a https://www.ravelry.com/api URL or an HTTP status`);
}
for (const c of REQUIRED) if (!seen.has(c)) errors.push(`missing row: ${c}`);

if (errors.length) {
  console.error(`FAIL ${file}\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(`PASS ${file}: ${seen.size} of ${REQUIRED.length} rows valid`);
