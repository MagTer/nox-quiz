#!/usr/bin/env node
// scripts/validate-levels.mjs — the standalone level-structural-validity gate
// (VALID-01). Composes scripts/lib/over-hole-check.mjs (Wave 1) and
// scripts/lib/reachability.mjs (Wave 2) into one CLI orchestrator.
//
// The project has NO JS test framework (no-build / no-dep canon). This plain ES
// module IS the automated structural gate for level geometry, mirroring
// scripts/smoke-progress.mjs's check(cond, msg)/failures-counter/process.exit(1)
// idiom, adapted here to per-row reporting instead of per-assertion.
//
// Run from the repo root:
//   node scripts/validate-levels.mjs                        (checks every LEVEL_ORDER entry)
//   node scripts/validate-levels.mjs --fixture <path>        (checks only the fixture's
//                                                              exported level-shaped constant,
//                                                              e.g. scripts/fixtures/bad-level.js)
//
// This script is DELIBERATELY standalone — it is never wired into check-gate.sh
// (23-CONTEXT.md's locked "Validator Check Design" decision). It never launches a
// browser or a browser-automation library: it is pure-data, so it stays fast
// enough for routine, per-commit use (matches this project's existing no-npm,
// direct-`node`-invocation pattern already used by smoke-progress.mjs and
// browser-boot.mjs).
//
// TWO-TIER OUTPUT (23-CONTEXT.md-locked): HARD-FAIL rows are exact facts (a
// floating barrier footprint, or a proven BFS disconnection) and always increment
// the failures counter. WARN rows mean the reachability graph found a path but its
// tightest hop used >= WARN_MARGIN_RATIO of the calibrated envelope (tight, but not
// impossible) — WARN NEVER increments the failures counter, only HARD-FAIL does.

import { resolve } from "path";
import { pathToFileURL } from "url";

import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";
import { findOverHoleBarriers } from "./lib/over-hole-check.mjs";
import { checkLevelReachability } from "./lib/reachability.mjs";

// --- Parse an optional `--fixture <path>` pair from argv ---
function parseFixturePath(argv) {
  const idx = argv.indexOf('--fixture');
  if (idx === -1) return null;
  return argv[idx + 1] ?? null;
}

// --- Build the list of { id, geometry } descriptors to check ---
async function buildDescriptors(fixturePath) {
  if (fixturePath) {
    const mod = await import(pathToFileURL(resolve(fixturePath)).href);
    const descriptor = Object.values(mod).find((v) => v && typeof v === "object" && v.geometry);
    if (!descriptor) {
      throw new Error(`--fixture ${fixturePath} exports no value carrying a .geometry property`);
    }
    return [{ id: descriptor.id ?? fixturePath, geometry: descriptor.geometry }];
  }
  return LEVEL_ORDER.map((id) => ({ id, geometry: getLevel(id).geometry }));
}

async function main() {
  const fixturePath = parseFixturePath(process.argv);
  const descriptors = await buildDescriptors(fixturePath);

  let failures = 0;

  for (const descriptor of descriptors) {
    const overHoleRows = findOverHoleBarriers(descriptor.geometry);
    if (overHoleRows.length === 0) {
      console.log(`${descriptor.id} | over-hole | PASS | (no floating barriers)`);
    } else {
      for (const row of overHoleRows) {
        console.log(
          `${descriptor.id} | over-hole | HARD-FAIL | ${row.kind} footprint ${row.footprint[0]}..${row.footprint[1]}`
        );
      }
      failures += overHoleRows.length;
    }

    const { rows, hardFailCount } = checkLevelReachability(descriptor.geometry);
    for (const row of rows) {
      console.log(`${descriptor.id} | ${row.check} | ${row.status} | ${row.descriptor}`);
    }
    failures += hardFailCount;
  }

  if (failures > 0) {
    console.error(`validate-levels: FAIL — ${failures} hard-failure(s) across ${descriptors.length} level(s)`);
    process.exit(1);
  }
  console.log("validate-levels: PASS");
}

await main();
