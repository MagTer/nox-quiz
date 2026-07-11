#!/usr/bin/env node
// scripts/check-assets-manifest.mjs — the standalone existence gate for
// src/assets-manifest.js (Phase 32 Plan 01, ART-02/ART-03).
//
// The project has NO JS test framework (no-build / no-dep canon). This plain
// ES module IS the automated gate: it proves every asset path the manifest
// declares actually exists on disk, killing the silent-404 class (a wrong or
// renamed asset path failing invisibly at runtime).
//
// This script is DELIBERATELY standalone — it is never wired into
// check-gate.sh (mirrors scripts/validate-levels.mjs's 23-CONTEXT.md-locked
// "Validator Check Design" convention: pure-data checks stay separate from
// the shell-script suite).
//
// Run from the repo root (paths in the manifest are repo-root-relative):
//   node scripts/check-assets-manifest.mjs

import { existsSync } from "fs";

import { ASSETS_MANIFEST } from "../src/assets-manifest.js";

let failures = 0;

for (const asset of ASSETS_MANIFEST) {
  if (!existsSync(asset.path)) {
    console.error(`check-assets-manifest: MISSING ${asset.key} -> ${asset.path}`);
    failures += 1;
  }
}

if (failures === 0) {
  console.log(`check-assets-manifest: PASS — ${ASSETS_MANIFEST.length} assets verified on disk.`);
}

process.exit(failures > 0 ? 1 : 0);
