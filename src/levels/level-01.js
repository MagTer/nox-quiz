// src/levels/level-01.js — the v3.0 shipped level, lifted VERBATIM as plain DATA.
//
// Single responsibility: hold ONE author-written ~3.5-screen linear level as a
// forward-looking DESCRIPTOR (id / displayName / allowedTables / geometry plus the
// unset optional mechanics/theme/parallax slots) so the parameterized buildLevel in
// ./build.js can instantiate it. The geometry here is a byte-for-byte lift of the
// hand-tuned v3.0 level in src/level.js (Phase 8/9): merged-floor runs, the gap
// layout, the arced coins, the floor spikes, the goal, and the respawn checkpoints.
//
// This is a PURE data module: it references NO engine globals at all (no
// add/rect/sprite/vec2/Rect/typeof Rect). The ONLY import is ../config.js — this file
// lives in src/levels/, so the config sibling is TWO dirs up (`../`), mirroring
// src/math/brain.js. The Wave-0 negative grep asserts the no-engine-global invariant
// (a727c13); the Wave-0 regression smoke deep-equals this geometry against the v3.0
// values, so the numbers must stay byte-for-byte identical.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run (supports the spike/goal/checkpoint expressions)

// --- The level-01 descriptor (v3.0 geometry inside the forward-looking schema) ---
export const LEVEL_01 = {
  id: "level-01",
  displayName: "The First Descent",

  // Difficulty seam — DATA only (wired through in Wave 2; enforced for real in
  // Phase 16). NOT a behavior change here.
  // Reminder: level-01 stays on the v3.0 hard pool (tables 6–9); do not soften.
  allowedTables: [6, 7, 8, 9],

  // --- Authored level geometry (gentle left-to-right difficulty curve) ---
  //
  // Floor runs are { x, w } at FLOOR_Y; the empty spans between them are the gaps.
  // Platforms are raised { x, y, w, h } ledges spanning the gaps so every gap is
  // crossable. Coins arc over jumps; spikes sit on the floor with a generous
  // checkpoint placed just before each (a respawn never costs meaningful progress —
  // ADHD-safe). The goal caps the final run. Level extent ≈ CONFIG.LEVEL_RIGHT (2240).
  geometry: {
    // Contiguous floor runs (one merged collider each). Gaps: 560..720, 1200..1360.
    floors: [
      { x: 0, w: 560 }, // opening run
      { x: 720, w: 480 }, // middle run (after gap 1)
      { x: 1360, w: 880 }, // final run to the goal (after gap 2), ends at 2240
    ],

    // Raised platforms (own merged collider each) — stepping stones over the gaps
    // and a small height-variety hop on the final run.
    platforms: [
      { x: 360, y: 240, w: 160, h: 24 }, // hop up before gap 1
      { x: 560, y: 192, w: 128, h: 24 }, // mid-gap-1 stepping stone
      { x: 1208, y: 232, w: 152, h: 24 }, // stepping stone across gap 2
      { x: 1640, y: 232, w: 160, h: 24 }, // late height-variety ledge
    ],

    // 10 coins arced over the jumps and along the runs (count exercised in Plan 03).
    //
    // NOTE — intentional off-grid placement: coins render at 32x32 (default `topleft`
    // anchor) while everything else is 16px and grid-aligned. The {x, y} below are the
    // coin's TOP-LEFT corner, so its visual CENTER sits 16px right/down of {x, y}. This
    // is deliberate hand-tuning (the 32px area() matches the sprite, so collection is
    // unaffected) — these are authored visual positions, NOT grid coordinates. When
    // editing, read {x, y} as the top-left, and add ~16px to picture the center.
    coins: [
      { x: 200, y: 264 },
      { x: 392, y: 184 },
      { x: 592, y: 136 },
      { x: 800, y: 264 },
      { x: 960, y: 264 },
      { x: 1240, y: 176 },
      { x: 1440, y: 264 },
      { x: 1680, y: 176 },
      { x: 1900, y: 264 },
      { x: 2080, y: 264 },
    ],

    // Floor spikes (sit ON the floor at FLOOR_Y). Each has a checkpoint just before it.
    spikes: [
      { x: 880, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // first hazard on the middle run
      { x: 1520, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // hazard on the final run
      { x: 2000, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // last hazard before the goal
    ],

    // Goal caps the final run.
    goal: { x: 2160, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — one near the start and one just BEFORE each spike.
    //
    // The `FLOOR_Y - 48` y is INTENTIONAL and couples to player height: the player is
    // 16x32 (topleft anchor), so respawning at y=272 puts its feet at 304 while the
    // floor top is FLOOR_Y=320 — a deliberate ~16px gap that reads as a gentle "drop
    // in" onto the floor after every respawn (harmless; the fall-threshold is far
    // below at LEVEL_BOTTOM+FALL_MARGIN). The literal is FLOOR_Y minus (player height
    // 32 + a 16px drop). If the player sprite height or FLOOR_Y ever changes, retune
    // this offset to preserve the "feet land on the floor" relationship.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start-area checkpoint (32px player height + 16px drop)
      { x: 800, y: FLOOR_Y - 48 }, // before the first spike (x=880)
      { x: 1440, y: FLOOR_Y - 48 }, // before the second spike (x=1520)
      { x: 1920, y: FLOOR_Y - 48 }, // before the third spike (x=2000)
    ],

    // Locked door — mid-level challenge seam (Plan 15-03). Sits on the final run
    // away from the raised platform at x:1640 so it cannot be bypassed from the air,
    // with a lintel above that blocks jumping over from the floor.
    doors: [
      { x: 1400, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // --- Mid-level math mechanics (Phase 16) ---
    // MECH-04: two checkpoint gates on different floor runs.
    mathGates: [
      { x: 600, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // opening run, just before gap 1
      { x: 1300, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // final run, before the door at 1400
    ],

    // MECH-05: one defeat-enemy encounter on the middle run.
    enemies: [
      { x: 1000, y: FLOOR_Y - CONFIG.ENEMY.H },
    ],

    // MECH-03: one collect-the-answer zone near the start.
    collectZones: [
      { x: 300, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0, 1, 2, 3] },
    ],

    // MECH-03: four pickup slot positions around the zone.
    answerPickupSlots: [
      { x: 270, y: FLOOR_Y - 100 },
      { x: 330, y: FLOOR_Y - 100 },
      { x: 270, y: FLOOR_Y - 40 },
      { x: 330, y: FLOOR_Y - 40 },
    ],
  },

  // --- Forward-looking optional slots (buildLevel ignores them when unset) ---
  mechanics: [], // Phase 15/16 placeholder — mid-game math mechanics
  theme: null, // Phase 18 placeholder — visual theming
  parallax: null, // Phase 18 placeholder — parallax background layers
};
