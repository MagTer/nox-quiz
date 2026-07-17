#!/usr/bin/env node
// scripts/check-geometry-frozen.mjs — the geometry-freeze snapshot gate
// (ART-06/ART-07; Phase 35, mitigation T-35-02 / the standing "geometry-frozen
// art diffs" mitigation #4).
//
// WHY this gate exists: Phase 35 dresses all 8 levels with a decorative `props`
// layer that lives in the SAME level-descriptor FILE as the byte-frozen geometry
// arrays (floors/platforms/coins/spikes/goal/checkpoints/doors/mathGates/enemies/
// secretAlcove/keys/locks/bounds). A stray keystroke in a re-dress commit could
// nudge a coin or platform coordinate while "just adding props", and NO existing
// gate would catch a change that still validates. This gate freezes each level's
// serialized `geometry` object against a committed golden and HARD-FAILs on ANY
// drift, naming the level + the first differing top-level key.
//
// Props are structurally invisible here: build.js reads props from the TOP-LEVEL
// `levelData.props` field, never `geometry.props`, so `getLevel(id).geometry` is
// unaffected by dressing a level — exactly what makes props validator-neutral.
//
// This script is DELIBERATELY standalone — it is NEVER wired into check-gate.sh
// (mirrors scripts/check-assets-manifest.mjs / scripts/validate-levels.mjs's
// 23-CONTEXT.md-locked "pure-data checks stay separate from the shell suite"
// convention). It imports the registry the SAME way validate-levels.mjs does.
//
// Run from the repo root:
//   node scripts/check-geometry-frozen.mjs           (compare vs the golden — the gate)
//   node scripts/check-geometry-frozen.mjs --write   (regenerate the golden from current geometry)

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

import { LEVEL_ORDER, getLevel } from "../src/levels/index.js";

const BASELINE_PATH = fileURLToPath(
  new URL("./fixtures/geometry-frozen-baseline.json", import.meta.url),
);

// Serialize every level's geometry into a stable { id: "<json>" } map. Using
// JSON.stringify with no whitespace gives a deterministic, byte-comparable string
// per level (object key order is authored order in the descriptor source, which is
// itself frozen by this very gate).
function currentGeometryMap() {
  const map = {};
  for (const id of LEVEL_ORDER) {
    map[id] = JSON.stringify(getLevel(id).geometry);
  }
  return map;
}

// --write: regenerate the golden deterministically from current geometry. Pretty-
// printed (2-space) so the committed fixture is diff-reviewable, while the VALUES
// (each level's serialized geometry) stay compact single-line strings.
if (process.argv.includes("--write")) {
  const map = currentGeometryMap();
  writeFileSync(BASELINE_PATH, JSON.stringify(map, null, 2) + "\n");
  console.log(
    `check-geometry-frozen: WROTE baseline — ${Object.keys(map).length} levels -> ${BASELINE_PATH}`,
  );
  process.exit(0);
}

// --- Gate mode: compare current geometry against the committed golden ---
let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
} catch (e) {
  console.error(
    `check-geometry-frozen: HARD-FAIL — cannot read baseline ${BASELINE_PATH}: ${e.message}`,
  );
  console.error("  (run `node scripts/check-geometry-frozen.mjs --write` to create it)");
  process.exit(1);
}

const current = currentGeometryMap();
let failures = 0;

// Levels present in the golden but missing from the current registry (a deleted or
// renamed level) — HARD-FAIL.
for (const id of Object.keys(baseline)) {
  if (!(id in current)) {
    console.error(`check-geometry-frozen: HARD-FAIL — ${id} is in the baseline but not in LEVEL_ORDER`);
    failures += 1;
  }
}

// Levels present now but not in the golden (a new/unfrozen level), plus per-level
// geometry drift — HARD-FAIL, naming the first differing top-level geometry key.
for (const id of Object.keys(current)) {
  if (!(id in baseline)) {
    console.error(`check-geometry-frozen: HARD-FAIL — ${id} is in LEVEL_ORDER but not in the baseline`);
    failures += 1;
    continue;
  }
  if (current[id] !== baseline[id]) {
    const key = firstDifferingKey(baseline[id], current[id]);
    console.error(
      `check-geometry-frozen: HARD-FAIL — ${id} geometry drifted from the frozen baseline` +
        (key ? ` (first differing key: "${key}")` : ""),
    );
    failures += 1;
  }
}

if (failures === 0) {
  console.log(
    `check-geometry-frozen: PASS — all ${Object.keys(current).length} levels' geometry byte-identical to the frozen baseline.`,
  );
}

process.exit(failures > 0 ? 1 : 0);

// Best-effort: parse both serialized geometries and report the first top-level key
// whose serialized value differs (or a present/absent key). Best-effort only — any
// parse hiccup just yields null and the caller still reports the level-level drift.
function firstDifferingKey(baselineJson, currentJson) {
  try {
    const a = JSON.parse(baselineJson);
    const b = JSON.parse(currentJson);
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return k;
    }
  } catch {
    // fall through — level-level drift is already reported by the caller
  }
  return null;
}
