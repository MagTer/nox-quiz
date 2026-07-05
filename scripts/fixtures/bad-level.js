// scripts/fixtures/bad-level.js — DELIBERATELY-BAD level descriptor, level-validator
// calibration fixture.
//
// This is NOT shipped game content. It exists ONLY so scripts/validate-levels.mjs's
// own self-test (Wave 3, invoked via `--fixture scripts/fixtures/bad-level.js`) can
// be proven to go RED independent of whatever levels 1-4 currently contain. Two
// defects are deliberately injected, each independently provable:
//
//   (a) over-hole mathGate at x:380 — footprint 380..412 sits squarely inside the
//       300..700 gap between floor A (0..300) and floor B (700..1000), with no
//       floor beneath it anywhere. An exact-interval-arithmetic HARD-FAIL,
//       independent of any jump-envelope calibration.
//
//   (b) unconditionally-unreachable platform + oversized gap blocking the goal —
//       the 300..700 gap is 400px wide, exceeding even the theoretical closed-form
//       max horizontal jump distance (RUN_SPEED * 2*JUMP_FORCE/GRAVITY ~= 178px,
//       src/config.js: RUN_SPEED=240, GRAVITY=1400, JUMP_FORCE=520) with ZERO
//       margin applied — no direct hop can ever bridge it. The lone platform at
//       x:450,y:30 sits inside that gap but requires a 290px rise (FLOOR_Y=320 - y=30)
//       to reach, exceeding the theoretical closed-form max rise
//       (JUMP_FORCE**2/(2*GRAVITY) ~= 96.6px) by a wide margin — it is
//       UNCONDITIONALLY unreachable from either floor regardless of the exact
//       empirically-calibrated numbers scripts/lib/jump-envelope.mjs eventually
//       produces. The goal at x:900 (on floor B) is therefore also unreachable from
//       spawn, so the validator's spawn->goal check independently HARD-FAILs too —
//       not only the over-hole check.
//
// A shipped-good level (src/levels/level-01.js etc.) must stay GREEN against both
// checks; this fixture is the other half of that calibration: it must go RED,
// mirroring scripts/fixtures/bad-scene.js's "deliberately-bad fixture proves the
// checker fires" convention.

export const BAD_LEVEL = {
  id: "bad-level-fixture",
  displayName: "Deliberately Broken (validator self-test)",

  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Two floor runs with a 400px gap (300..700) — exceeds the theoretical
    // closed-form max run distance (~178px) with zero margin. Spawn (x:64) sits
    // on floor A.
    floors: [
      { x: 0, w: 300 }, // floor A — spawn sits on this
      { x: 700, w: 300 }, // floor B — goal sits on this
    ],

    // Isolated platform inside the gap, unconditionally unreachable: 290px
    // required rise (320 - 30) vs. the ~96.6px theoretical closed-form max rise.
    platforms: [{ x: 450, y: 30, w: 80, h: 24 }],

    // Over-hole mathGate: footprint 380..412, no floor run covers it (gap 300..700).
    mathGates: [{ x: 380, y: 320 - 64 }],

    // Not needed to exercise the two defects above.
    doors: [],
    enemies: [],
    collectZones: [],

    // On floor B (900 is within 700..1000) — unconditionally unreachable from
    // spawn given the two defects above.
    goal: { x: 900, y: 320 - 16 },
  },

  // --- Forward-looking optional slots (matches getLevel()'s real-level shape) ---
  mechanics: [],
  theme: null,
  parallax: null,
};
