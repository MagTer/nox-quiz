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
//
// STATUS: RED — formulas below are deliberately unimplemented stubs; the
// self-tests are expected to fail until Task 2's GREEN step implements them.

import { CONFIG } from "../src/config.js";

// --- Pure math (WCAG 2.x formula) — STUBS, not yet implemented ---

function relativeLuminance(_rgb) {
  return 0; // TODO(GREEN): implement the real sRGB-to-linear-then-luma formula
}

function contrastRatio(_rgbA, _rgbB) {
  return 1; // TODO(GREEN): implement (lighter+0.05)/(darker+0.05)
}

function isBannedHue(_rgb) {
  return false; // TODO(GREEN): implement (r-g)>20 AND (b-g)>20
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

console.log("contrast checks: PASS");
process.exit(0);
