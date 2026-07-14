// scripts/fixtures/bad-level-coin.js — DELIBERATELY-BAD level descriptor, coin
// fly-through reachability calibration fixture (Phase 34, LVL-01).
//
// This is NOT shipped game content. It exists ONLY so scripts/validate-levels.mjs's
// new coin-reachability check (invoked via `--fixture scripts/fixtures/
// bad-level-coin.js`) can be proven RED-FIRST — i.e. proven capable of detecting a
// real unreachable coin BEFORE it is ever pointed at the real levels. A check that
// has never been seen to fail is not a check.
//
// A NEW, dedicated fixture file per 30-CONTEXT.md's "a materially different code
// path deserves its own fixture" decision. The coin model is genuinely different
// code from every other fixture's defect: it is a BOX (a 48x64 Minkowski
// pass-through region) evaluated MID-ARC and BIDIRECTIONALLY, not a zero-width
// landing point (secret-alcove / mover) and not a footprint on a floor run
// (door / mathGate / enemy).
//
// ONE independently-provable defect, kept isolated so the RED-first proof is
// unambiguous — no other geometry defects:
//
//   geometry.coins[0] = { x: 200, y: 60 } — floating over a single flat floor run
//   at CONFIG.FLOOR_Y (320). The player's standing top-left y is 320 - PLAYER_H =
//   288, and the coin's Minkowski box spans y [28, 124]; even its BOTTOM edge (the
//   easiest part of it to clip) demands a rise of 288 - 124 = 164px — roughly
//   DOUBLE the calibrated maxRise (~88.331px) and still far beyond even the
//   theoretical apex (~96.57px). Unreachable from any x, in either direction, at
//   any point on any arc — unconditionally, regardless of the exact calibration
//   numbers, so this fixture cannot go stale if the envelope is ever re-measured.
//
// Everything else is deliberately CLEAN so the single HARD-FAIL row is
// unambiguously attributable to the coin check:
//   - biome: "swamp"        (a valid biome — an invalid one would add a biome
//                            HARD-FAIL row and muddy the proof)
//   - floors: one run       (no gaps -> no gap-width rows)
//   - goal on that run      (spawn-goal PASSes)
//   - doors / mathGates / enemies / secretAlcove / movers: omitted entirely
//     (all `?? []`-guarded -> zero rows, no over-hole barriers)

export const BAD_LEVEL_COIN = {
  id: "bad-level-coin-fixture",
  displayName: "Deliberately Broken Coin (validator self-test)",

  biome: "swamp",
  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Single floor run — spawn (x:64) and the goal both sit here.
    floors: [{ x: 0, w: 400 }],

    // Trivially reachable on the same floor — keeps spawn-goal clean/PASS.
    goal: { x: 350, y: 304 },

    // The one deliberate defect — see header for the unreachability rationale.
    coins: [{ x: 200, y: 60 }],

    // Omitted entirely (all `?? []`-guarded elsewhere): platforms, doors,
    // mathGates, enemies, spikes, secretAlcove, movers.
  },

  // --- Forward-looking optional slots (matches getLevel()'s real-level shape) ---
  mechanics: [],
  theme: null,
  parallax: null,
};
