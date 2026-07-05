// scripts/lib/over-hole-check.mjs — promoted, exported over-hole interval-arithmetic
// checker (VALID-01). Consumed by scripts/validate-levels.mjs (Wave 3).
//
// This is a BYTE-FOR-BYTE promotion of Phase 22's already-proven scratchpad
// (`interval-check-22-04.mjs`, whose exact source is preserved in 22-RESEARCH.md's
// Code Examples section) into a real, permanent module. It already proved correct
// against the 3 known live over-hole defects (level-01 mathGate x600/x1300,
// level-04 mathGate x1800) — see 22-FINDINGS.md's Structural Defect Inventory.
// The ONLY change from the scratchpad version: export a function returning
// structured rows instead of console.log-ing, so validate-levels.mjs can format
// its own PASS/FAIL report.
//
// SCOPE: this checks ONLY floor-run coverage (geometry.floors), never
// geometry.platforms. Every shipped door/mathGate/enemy in this game sits at
// floor level (y: FLOOR_Y - CONFIG.X.H — see src/levels/level-01.js), never at
// platform level, so platform-membership is intentionally out of scope here.
//
// RESULT CONTRACT: an empty array ([]) means clean (every barrier is fully
// supported by a floor run). A non-empty array means HARD-FAIL — each row names
// the offending barrier's kind/x/w/footprint. This is exact interval arithmetic,
// not a heuristic — a non-empty result is always a real, unconditional defect
// (the barrier's footprint is not fully contained in any single floor run).
//
// NEVER-BRICK GUARD: every optional geometry array (floors, doors, mathGates,
// enemies) is `?? []`-guarded, matching this project's established
// build.js/deriveEncounters "never brick" convention (T-23-02) — a geometry
// object with all four omitted returns [] without throwing.

import { fileURLToPath } from "url";

import { CONFIG } from "../../src/config.js";

const BARRIER_WIDTH = {
  doors: CONFIG.DOOR.W, // 32
  mathGates: CONFIG.MATH_GATE.W, // 32
  enemies: CONFIG.ENEMY.W, // 32
};

/**
 * Find every door/mathGate/enemy whose footprint is NOT fully covered by any
 * single floor run in `geometry.floors`.
 *
 * @param {object} geometry - a level's geometry object (src/levels/*.js shape).
 * @returns {Array<{kind: string, x: number, w: number, footprint: [number, number]}>}
 *   [] means clean; a non-empty array means HARD-FAIL (each row is one offender).
 */
export function findOverHoleBarriers(geometry) {
  const runs = (geometry.floors ?? []).map((f) => [f.x, f.x + f.w]);
  const onFloor = (x) => runs.some(([a, b]) => x >= a && x <= b);
  const rows = [];
  for (const kind of ["doors", "mathGates", "enemies"]) {
    for (const e of geometry[kind] ?? []) {
      const w = BARRIER_WIDTH[kind];
      if (!onFloor(e.x) || !onFloor(e.x + w)) {
        rows.push({ kind, x: e.x, w, footprint: [e.x, e.x + w] });
      }
    }
  }
  return rows; // [] means clean — HARD-FAIL only if length > 0
}

// --- Self-test (runs only when this module is executed directly) ---
// Mirrors scripts/smoke-progress.mjs's check(cond, msg)/failures-counter/
// process.exit(1) idiom — this project's no-framework unit-test layer.
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  let failures = 0;
  const check = (cond, msg) => {
    console.assert(cond, msg);
    if (!cond) failures++;
  };

  // Case 1: a mathGate squarely in a gap (560..720) returns exactly one row.
  {
    const geometry = {
      floors: [
        { x: 0, w: 560 },
        { x: 720, w: 480 },
      ],
      mathGates: [{ x: 600, y: 256 }],
    };
    const rows = findOverHoleBarriers(geometry);
    check(rows.length === 1, `expected 1 over-hole row, got ${rows.length}`);
    check(
      rows[0]?.kind === "mathGates" && rows[0]?.x === 600 && rows[0]?.w === 32 &&
        rows[0]?.footprint[0] === 600 && rows[0]?.footprint[1] === 632,
      `expected row {kind:"mathGates",x:600,w:32,footprint:[600,632]}, got ${JSON.stringify(rows[0])}`
    );
  }

  // Case 2: a door fully inside a floor run returns [].
  {
    const geometry = {
      floors: [{ x: 1360, w: 880 }],
      doors: [{ x: 1400, y: 256 }],
    };
    const rows = findOverHoleBarriers(geometry);
    check(rows.length === 0, `expected [] for a fully-supported door, got ${JSON.stringify(rows)}`);
  }

  // Case 3: doors/mathGates/enemies all omitted — never throws, returns [].
  {
    const geometry = { floors: [{ x: 0, w: 560 }] };
    let rows;
    let threw = false;
    try {
      rows = findOverHoleBarriers(geometry);
    } catch {
      threw = true;
    }
    check(!threw, "findOverHoleBarriers must never throw on omitted optional arrays");
    check(Array.isArray(rows) && rows.length === 0, `expected [] for all-omitted geometry, got ${JSON.stringify(rows)}`);
  }

  if (failures > 0) {
    console.error(`over-hole-check-selftest: FAIL — ${failures} assertion(s) failed`);
    process.exit(1);
  }
  console.log("over-hole-check-selftest: PASS");
}
