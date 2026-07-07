#!/usr/bin/env node
// scripts/check-contrast.mjs — WCAG AA contrast + banned-hue guardrail (VIS-02).
//
// Plain-Node ESM CLI script (no dependency — matches the project's zero-new-
// dependency posture), structurally mirroring scripts/validate-levels.mjs: a
// clear numeric exit code, not a test framework. Reads CONFIG.PALETTE LIVE
// from src/config.js (never a hardcoded hex copy) so this script can never
// drift from the real source of truth.
//
// RED/GREEN note (TDD task): relativeLuminance/contrastRatio/isBannedHue are
// pure functions with known reference answers (WCAG's own worked examples:
// pure white vs pure black = 21.0 contrast ratio; magenta trips the banned-hue
// guard, green does not). Self-tests below assert those known answers BEFORE
// the role-pairing table runs, so a broken formula fails loudly and early.

import { CONFIG } from "../src/config.js";

// --- Pure math (WCAG 2.x formula) ---

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgbA, rgbB) {
  const L1 = relativeLuminance(rgbA);
  const L2 = relativeLuminance(rgbB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// isBannedHue: true iff BOTH (r - g) > 20 AND (b - g) > 20 — green channel
// meaningfully suppressed relative to both red and blue, which is what reads
// as magenta/pink/mauve regardless of saturation (26-CONTEXT.md's explicit
// "desaturated magenta/mauve reads as pink" concern).
function isBannedHue([r, g, b]) {
  return r - g > 20 && b - g > 20;
}

// --- Self-tests: known-answer checks on the pure functions above ---

let selfTestFailed = false;
function assertClose(actual, expected, msg, eps = 1e-6) {
  if (Math.abs(actual - expected) > eps) {
    console.error(`SELF-TEST FAIL: ${msg} (expected ${expected}, got ${actual})`);
    selfTestFailed = true;
  }
}
function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    console.error(`SELF-TEST FAIL: ${msg} (expected ${expected}, got ${actual})`);
    selfTestFailed = true;
  }
}

assertClose(relativeLuminance([255, 255, 255]), 1, "white relative luminance should be 1");
assertClose(relativeLuminance([0, 0, 0]), 0, "black relative luminance should be 0");
assertClose(contrastRatio([255, 255, 255], [0, 0, 0]), 21, "black/white contrast ratio should be 21");
assertEqual(isBannedHue([255, 0, 255]), true, "magenta [255,0,255] should trip the banned-hue guard");
assertEqual(isBannedHue([0, 255, 0]), false, "green [0,255,0] should NOT trip the banned-hue guard");

if (selfTestFailed) {
  console.error("check-contrast.mjs self-tests: FAILED (fix the formulas above before trusting any role table below)");
  process.exit(1);
}

// --- Role pairing table ---
// role: the CONFIG.PALETTE key being checked
// on: the CONFIG.PALETTE key it renders against (background/surface it sits on)
// threshold: 4.5 for text roles, 3.0 for UI-component/non-text roles
const PAIRINGS = [
  { role: "TEXT", on: "SURFACE", threshold: 4.5 },
  { role: "TEXT", on: "BG", threshold: 4.5 },
  { role: "TEXT_DIM", on: "BG", threshold: 4.5 },
  { role: "REWARD", on: "BG", threshold: 4.5 }, // used as text in title/hud/mathGate
  { role: "DANGER", on: "BG", threshold: 4.5 }, // used as text in title/challenge
  { role: "CLEARED", on: "SURFACE_UNLOCKED", threshold: 3.0 }, // UI outline
  { role: "MUTED_BORDER", on: "BG", threshold: 3.0 }, // UI outline
  { role: "BORDER", on: "BG", threshold: 3.0 }, // UI outline
  { role: "ACCENT_MOSS", on: "BG", threshold: 3.0 }, // UI-component/background-tint role, not text
  { role: "ACCENT_SLATE", on: "BG", threshold: 3.0 },
  { role: "ACCENT_RUST", on: "BG", threshold: 3.0 },
];

function toHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function main() {
  const palette = CONFIG.PALETTE;
  let anyFail = false;

  console.log("=== WCAG contrast ratios ===");
  console.log(["role", "pairing", "ratio", "threshold", "pass/fail"].join(" | "));
  for (const { role, on, threshold } of PAIRINGS) {
    const roleColor = palette[role];
    const onColor = palette[on];
    if (!roleColor || !onColor) {
      console.log(`${role} | ${role}-on-${on} | MISSING PALETTE KEY | ${threshold} | FAIL`);
      anyFail = true;
      continue;
    }
    const ratio = contrastRatio(roleColor, onColor);
    const pass = ratio >= threshold;
    if (!pass) anyFail = true;
    console.log(`${role} | ${role}-on-${on} | ${ratio.toFixed(2)} | ${threshold} | ${pass ? "PASS" : "FAIL"}`);
  }

  console.log("");
  console.log("=== Banned-hue guardrail (magenta/pink/mauve) ===");
  console.log(["role", "hex", "banned?"].join(" | "));
  let bannedCount = 0;
  for (const [role, rgb] of Object.entries(palette)) {
    const banned = isBannedHue(rgb);
    if (banned) {
      bannedCount++;
      anyFail = true;
    }
    console.log(`${role} | ${toHex(rgb)} | ${banned ? "BANNED (magenta/pink/mauve)" : "ok"}`);
  }
  console.log(`banned-hue guardrail: ${bannedCount} flagged`);

  console.log("");
  if (anyFail) {
    console.log("contrast checks: FAIL");
    process.exit(1);
  } else {
    console.log("contrast checks: PASS");
    process.exit(0);
  }
}

main();
