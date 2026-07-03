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

  bounds: { left: 0, right: 3400, top: 0, bottom: 360 },

  geometry: {
    floors: [
      { x: 0, w: 480 },
      { x: 640, w: 560 },
      { x: 1320, w: 600 },
      { x: 2040, w: 640 },
      { x: 2840, w: 560 },
    ],

    platforms: [
      { x: 280, y: 240, w: 128, h: 24 },
      { x: 480, y: 184, w: 96, h: 24 },
      { x: 1160, y: 224, w: 112, h: 24 },
      { x: 1520, y: 232, w: 96, h: 24 },
      { x: 1880, y: 184, w: 128, h: 24 },
      { x: 2220, y: 232, w: 96, h: 24 },
      { x: 2640, y: 192, w: 128, h: 24 },
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
    ],

    spikes: [
      { x: 820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1040, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1580, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3020, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3260, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],

    goal: { x: 3320, y: FLOOR_Y - CONFIG.GOAL_SIZE },

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
    ],

    doors: [],

    mathGates: [
      { x: 420, y: FLOOR_Y - CONFIG.MATH_GATE.H },
    ],

    enemies: [
      { x: 2400, y: FLOOR_Y - CONFIG.ENEMY.H },
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
