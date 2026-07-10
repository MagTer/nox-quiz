// scripts/fixtures/bad-level-mover.js — DELIBERATELY-BAD level descriptor, mover
// worst-case-extreme reachability calibration fixture (Phase 30, MOT-04).
//
// This is NOT shipped game content. Zero real levels carry geometry.movers today
// (Phase 36 places the first ones) — this fixture exists ONLY so
// scripts/validate-levels.mjs's mover-reachability check (invoked via `--fixture
// scripts/fixtures/bad-level-mover.js`) can be proven RED-first, independent of
// bad-level.js's existing (a)/(b)/(c) defects.
//
// A NEW, dedicated fixture file per 30-CONTEXT.md's "materially different code
// path deserves its own fixture" decision — the worst-case-extreme rule
// (evaluating BOTH mover endpoints and reporting the worse) is a genuinely
// different multi-position code path from bad-level.js's existing single-position
// defects, not an extension of that file.
//
// ONE independently-provable defect, kept isolated so the RED-first proof is
// unambiguous — no other geometry defects:
//
//   geometry.movers[0] = { x1:150, y1:320, x2:250, y2:170 } — the near endpoint
//   (150,320) sits at the SAME y as floor-0 (dy=0, trivially reachable via
//   bestMarginToPoint's same-surface branch), but the far endpoint (250,170)
//   requires a 150px rise (320-170) from FLOOR_Y, unconditionally exceeding the
//   calibrated maxRise (~88.331px) regardless of the exact calibration numbers —
//   proving the worst-case-extreme rule HARD-FAILs even though a naive best-case
//   check (testing only the trivially-reachable near endpoint) would incorrectly
//   PASS.
//
// floors/goal are laid out so spawn-goal/gap-width/mechanic-reachability all stay
// clean/PASS — only mover-reachability should fail, isolating the RED-first proof
// to exactly the code path this fixture exists to exercise.

export const BAD_LEVEL_MOVER = {
  id: "bad-level-mover-fixture",
  displayName: "Deliberately Broken Mover (validator self-test)",

  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Single floor run — spawn (x:64) and the goal both sit here, comfortably
    // covering the mover's near endpoint (x:150) too.
    floors: [{ x: 0, w: 400 }],

    // Trivially reachable on the same floor — keeps spawn-goal clean/PASS so
    // only mover-reachability fails.
    goal: { x: 350, y: 304 },

    // The one deliberate defect — see header for the worst-case-extreme rationale.
    movers: [{ x1: 150, y1: 320, x2: 250, y2: 170 }],

    // Omitted entirely (all `?? []`-guarded elsewhere): doors, mathGates,
    // enemies, secretAlcove.
  },

  // --- Forward-looking optional slots (matches getLevel()'s real-level shape) ---
  mechanics: [],
  theme: null,
  parallax: null,
};
