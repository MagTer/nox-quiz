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
  // ADHD-safe). The goal caps the final run. Level extent 3640px since the Phase 24
  // extension (was 2240 = CONFIG.LEVEL_RIGHT in v3.0/v4.x; the camera right edge is
  // now DERIVED from geometry in game.js — this level carries no explicit bounds).
  geometry: {
    // Contiguous floor runs (one merged collider each). Gaps: 560..720, 1200..1360.
    floors: [
      { x: 0, w: 560 }, // opening run
      { x: 720, w: 480 }, // middle run (after gap 1)
      { x: 1360, w: 880 }, // final run to the goal (after gap 2), ends at 2240
      { x: 2400, w: 480 }, // new run after gap 3 (Phase 24 extension), ends at 2880
      { x: 3040, w: 600 }, // final run to the new goal (Phase 24 extension), ends at 3640
    ],

    // Raised platforms (own merged collider each) — stepping stones over the gaps
    // and a small height-variety hop on the final run.
    platforms: [
      { x: 360, y: 240, w: 160, h: 24 }, // hop up before gap 1
      { x: 560, y: 192, w: 128, h: 24 }, // mid-gap-1 stepping stone
      { x: 1208, y: 232, w: 152, h: 24 }, // stepping stone across gap 2
      { x: 1640, y: 232, w: 160, h: 24 }, // late height-variety ledge
      { x: 2240, y: 250, w: 128, h: 24 }, // bridges new gap 3 (2240..2400), touches floor-2's end (Phase 24 extension)
      { x: 2880, y: 250, w: 112, h: 24 }, // bridges new gap 4 (2880..3040), touches floor-3's end (Phase 24 extension)
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
      { x: 2280, y: 264 }, // Phase 24 extension — over the new gap-3 platform
      { x: 2472, y: 184 }, // Phase 24 extension
      { x: 2600, y: 136 }, // Phase 24 extension — before the new spike (x=2640)
      { x: 2800, y: 264 }, // Phase 24 extension
      { x: 3080, y: 264 }, // Phase 24 extension — start of the new final run
      { x: 3400, y: 176 }, // Phase 24 extension — near the new goal
    ],

    // Floor spikes (sit ON the floor at FLOOR_Y). Each has a checkpoint just before it.
    spikes: [
      { x: 880, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // first hazard on the middle run
      { x: 1520, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // hazard on the final run
      { x: 2000, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // last hazard before the goal
      { x: 2640, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // new hazard on the extension's first new floor run (Phase 24 extension)
    ],

    // Goal caps the final run (Phase 24 extension: was x:2160, capping the v4.1 final
    // run at 2240; now caps the new final run — floor-4 ends at 3640, 80px buffer,
    // matching the original's own 80px goal-to-floor-end convention: 2240-2160=80).
    goal: { x: 3560, y: FLOOR_Y - CONFIG.GOAL_SIZE },

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
      { x: 2560, y: FLOOR_Y - 48 }, // before the new spike (x=2640) — 80px lead (Phase 24 extension)
      { x: 3040, y: FLOOR_Y - 48 }, // before the new mathGate (x=3120) — 80px lead (Phase 24 extension)
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
      { x: 150, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // opening run (Phase 24 re-reposition: was x:528 [was x:600 pre-Phase-24, over-hole per VALID-04] — x:528 sat at floor-0's very edge, immediately before the gap-1 climbing platform at x:360-520, trapping forward-only traversal with no runway to execute the platform hop after the challenge resolves; x:150 sits comfortably mid-floor-0, well before the climbing platform, fully inside floor-0's 0..560 span)
      { x: 1360, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // final run, before the door at 1400 (Phase 24 reposition: was x:1300, over-hole per VALID-04; 1360..1392 fully inside floor-2's 1360..2240 span)
      { x: 3120, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // new gate on the new final run (Phase 24 extension, LVL-01 length/audit coverage — 3rd mathGate instance reuses an existing mechanic type, not new variety)
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

    // Phase 25 retrofit (LVL-06) — purely additive, does not touch any existing
    // floor/platform/checkpoint geometry. A short extra hop UP from the gap-1
    // stepping-stone platform (x:360, y:240, w:160) instead of continuing across
    // the gap — not signposted, not gating.
    secretAlcove: [
      { x: 400, y: 170 },
    ],
  },

  // --- Forward-looking optional slots (buildLevel ignores them when unset) ---
  mechanics: [], // Phase 15/16 placeholder — mid-game math mechanics
  theme: null, // Phase 18 placeholder — visual theming
  parallax: null, // Phase 18 placeholder — parallax background layers
};
