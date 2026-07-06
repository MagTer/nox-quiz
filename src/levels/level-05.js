// src/levels/level-05.js — "The Gentle Reach" descriptor.
//
// First of the Phase 25 four-level ramp. Softest new-level table pool [2,3,4,5]
// (mirrors level-02's role as the confidence-builder), single-screen-tall (no
// verticality), light mechanic density (one door, two checkpoint gates, no
// enemy/collectZone) — mirroring level-02's own mechanic mix exactly. Carries
// exactly one hidden secretAlcove (LVL-06), a short off-path detour above the
// first bridging platform.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_05 = {
  id: "level-05",
  displayName: "The Gentle Reach",
  allowedTables: [2, 3, 4, 5],

  bounds: { left: 0, right: 3420, top: 0, bottom: 360 },

  geometry: {
    floors: [
      { x: 0, w: 520 },
      { x: 680, w: 560 }, // gap 520..680 (160px)
      { x: 1360, w: 600 }, // gap 1240..1360 (120px)
      { x: 2080, w: 620 }, // gap 1960..2080 (120px)
      { x: 2820, w: 600 }, // gap 2700..2820 (120px), final run to the goal, ends 3420
    ],

    platforms: [
      { x: 280, y: 255, w: 96, h: 24 }, // early height-variety hop on floor-0 (rise 65px)
      { x: 560, y: 250, w: 128, h: 24 }, // bridges gap 520..680 (rise 70px)
      { x: 1280, y: 255, w: 112, h: 24 }, // bridges gap 1240..1360 (rise 65px)
      { x: 2000, y: 255, w: 112, h: 24 }, // bridges gap 1960..2080 (rise 65px)
      { x: 2740, y: 250, w: 128, h: 24 }, // bridges gap 2700..2820 (rise 70px)
    ],

    // Off-grid coin placement ({x,y} is a 32x32 sprite's top-left, +16px to the
    // visual center) — matches the project's established convention.
    coins: [
      { x: 140, y: 264 },
      { x: 300, y: 184 },
      { x: 460, y: 136 },
      { x: 760, y: 264 },
      { x: 960, y: 264 },
      { x: 1180, y: 176 },
      { x: 1440, y: 264 },
      { x: 1680, y: 176 },
      { x: 1900, y: 264 },
      { x: 2140, y: 176 },
      { x: 2400, y: 264 },
      { x: 2600, y: 264 },
      { x: 2860, y: 264 },
      { x: 3080, y: 176 },
      { x: 3260, y: 264 },
    ],

    spikes: [
      { x: 900, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-1 (680..1240)
      { x: 1600, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-2 (1360..1960)
      { x: 2300, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-3 (2080..2700)
    ],

    goal: { x: 3340, y: FLOOR_Y - CONFIG.GOAL_SIZE }, // floor-4 ends 3420, 80px buffer

    // One near-start checkpoint + one 64-80px before EVERY hazard/mechanic. The
    // start checkpoint (x:96) already sits 74px before the first mathGate (x:170),
    // so no separate checkpoint is needed there.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (also covers the 74px lead into mathGate@170)
      { x: 830, y: FLOOR_Y - 48 }, // before spike@900 (lead 70)
      { x: 1530, y: FLOOR_Y - 48 }, // before spike@1600 (lead 70)
      { x: 2080, y: FLOOR_Y - 48 }, // before mathGate@2150 (lead 70), floor-3 start
      { x: 2230, y: FLOOR_Y - 48 }, // before spike@2300 (lead 70)
      { x: 2830, y: FLOOR_Y - 48 }, // before door@2900 (lead 70), floor-4 start
    ],

    doors: [
      { x: 2900, y: FLOOR_Y - CONFIG.DOOR.H }, // floor-4 (2820..3420)
    ],

    mathGates: [
      { x: 170, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // floor-0 (0..520)
      { x: 2150, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // floor-3 (2080..2700)
    ],

    enemies: [],
    collectZones: [],
    answerPickupSlots: [],

    // Secret XP alcove (LVL-06) — a short off-path detour: an extra 70px hop UP
    // from the gap-1 bridging platform (x:560, y:250) instead of continuing
    // straight across to floor-1. Not signposted, not gating.
    secretAlcove: [
      { x: 600, y: 180 },
    ],
  },

  mechanics: [],
  theme: null,
  parallax: null,
};
