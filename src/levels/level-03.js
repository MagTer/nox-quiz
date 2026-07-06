// src/levels/level-03.js — "The Hollow" descriptor.
//
// Mixed table pool [3..9] with platforming slightly harder than level-02: some
// gaps need higher stepping-stones and the run layout is longer. Includes one
// enemy encounter, one collect-the-answer zone, and one checkpoint gate.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_03 = {
  id: "level-03",
  displayName: "The Hollow",
  allowedTables: [3, 4, 5, 6, 7, 8, 9],

  bounds: { left: 0, right: 5200, top: 0, bottom: 360 }, // Phase 24: right bumped 3400->5200 (LVL-01)

  geometry: {
    floors: [
      { x: 0, w: 480 },
      { x: 640, w: 560 },
      { x: 1320, w: 600 },
      { x: 2040, w: 640 },
      { x: 2840, w: 560 },
      { x: 3560, w: 600 }, // Phase 24 extension run 1 (after the new 3400..3560 gap)
      { x: 4280, w: 920 }, // Phase 24 extension run 2 (after the new 4160..4280 gap; final run to the new goal)
    ],

    platforms: [
      { x: 280, y: 240, w: 128, h: 24 },
      { x: 480, y: 184, w: 96, h: 24 },
      { x: 1160, y: 224, w: 112, h: 24 },
      { x: 1520, y: 232, w: 96, h: 24 },
      { x: 1880, y: 260, w: 128, h: 24 }, // Phase 24: y lowered 184->260 (rise 136px->60px) — was unreachable, VALID-04
      { x: 2220, y: 232, w: 96, h: 24 },
      { x: 2640, y: 260, w: 128, h: 24 }, // Phase 24: y lowered 192->260 (rise 128px->60px) — was unreachable, VALID-04
      { x: 3400, y: 255, w: 128, h: 24 }, // Phase 24 extension: bridges 3400..3560 gap (rise 65px)
      { x: 4160, y: 255, w: 112, h: 24 }, // Phase 24 extension: bridges 4160..4280 gap (rise 65px)
    ],

    coins: [
      { x: 140, y: 264 },
      { x: 300, y: 184 },
      { x: 520, y: 128 },
      { x: 800, y: 264 },
      { x: 1080, y: 264 },
      { x: 1420, y: 176 },
      { x: 1740, y: 264 },
      { x: 1980, y: 128 },
      { x: 2380, y: 264 },
      { x: 2860, y: 264 },
      { x: 3180, y: 264 },
      { x: 3440, y: 264 }, // Phase 24 extension
      { x: 3640, y: 184 }, // Phase 24 extension
      { x: 3900, y: 128 }, // Phase 24 extension
      { x: 4200, y: 264 }, // Phase 24 extension
      { x: 4460, y: 176 }, // Phase 24 extension
      { x: 4900, y: 264 }, // Phase 24 extension
    ],

    spikes: [
      { x: 820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1040, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1580, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3020, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3260, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3680, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // Phase 24 extension (on floor-5, 3560..4160)
      { x: 4800, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // Phase 24 extension (on floor-6, 4280..5200)
    ],

    goal: { x: 5120, y: FLOOR_Y - CONFIG.GOAL_SIZE }, // Phase 24: extended from x:3320 (LVL-01)

    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 340, y: FLOOR_Y - 48 },
      { x: 740, y: FLOOR_Y - 48 },
      { x: 960, y: FLOOR_Y - 48 },
      { x: 1500, y: FLOOR_Y - 48 },
      { x: 1740, y: FLOOR_Y - 48 },
      { x: 2300, y: FLOOR_Y - 48 },
      { x: 2920, y: FLOOR_Y - 48 },
      { x: 3160, y: FLOOR_Y - 48 },
      { x: 3600, y: FLOOR_Y - 48 }, // Phase 24 extension — before the new spike (x=3680)
      { x: 3720, y: FLOOR_Y - 48 }, // Phase 24 extension — before the new enemy (x=3800)
      { x: 4280, y: FLOOR_Y - 48 }, // Phase 24 extension — before the new mathGate (x=4360), floor-6 start
      { x: 4720, y: FLOOR_Y - 48 }, // Phase 24 extension — before the new spike (x=4800)
    ],

    doors: [],

    mathGates: [
      { x: 420, y: FLOOR_Y - CONFIG.MATH_GATE.H },
      { x: 4360, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // Phase 24 extension (on floor-6, 4280..5200)
    ],

    enemies: [
      { x: 2400, y: FLOOR_Y - CONFIG.ENEMY.H },
      { x: 3800, y: FLOOR_Y - CONFIG.ENEMY.H }, // Phase 24 extension (on floor-5, 3560..4160)
    ],

    collectZones: [
      { x: 200, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0, 1, 2, 3] },
    ],

    answerPickupSlots: [
      { x: 170, y: FLOOR_Y - 100 },
      { x: 230, y: FLOOR_Y - 100 },
      { x: 170, y: FLOOR_Y - 40 },
      { x: 230, y: FLOOR_Y - 40 },
    ],
  },

  mechanics: [],
  theme: null,
  parallax: null,
};
