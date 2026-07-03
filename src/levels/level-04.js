// src/levels/level-04.js — "The Last Span" descriptor.
//
// The hardest platforming and table pool ([6..9]) of the four-level set. Longest
// runs, the smallest/most offset stepping-stones, and the densest seasoning:
// one door, two checkpoint gates, one enemy, one collect zone, and seven spikes.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_04 = {
  id: "level-04",
  displayName: "The Last Span",
  allowedTables: [6, 7, 8, 9],

  bounds: { left: 0, right: 4000, top: 0, bottom: 360 },

  geometry: {
    floors: [
      { x: 0, w: 440 },
      { x: 600, w: 480 },
      { x: 1240, w: 520 },
      { x: 1960, w: 560 },
      { x: 2680, w: 560 },
      { x: 3400, w: 600 },
    ],

    platforms: [
      { x: 240, y: 232, w: 112, h: 24 },
      { x: 440, y: 168, w: 80, h: 24 },
      { x: 1080, y: 200, w: 112, h: 24 },
      { x: 1400, y: 216, w: 80, h: 24 },
      { x: 1760, y: 176, w: 128, h: 24 },
      { x: 2140, y: 216, w: 80, h: 24 },
      { x: 2520, y: 192, w: 112, h: 24 },
      { x: 2880, y: 224, w: 80, h: 24 },
      { x: 3240, y: 184, w: 112, h: 24 },
    ],

    coins: [
      { x: 120, y: 264 },
      { x: 260, y: 176 },
      { x: 460, y: 112 },
      { x: 760, y: 264 },
      { x: 980, y: 264 },
      { x: 1300, y: 176 },
      { x: 1660, y: 264 },
      { x: 1900, y: 128 },
      { x: 2300, y: 264 },
      { x: 2600, y: 264 },
      { x: 3000, y: 264 },
      { x: 3560, y: 264 },
    ],

    spikes: [
      { x: 820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1000, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1480, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1700, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2320, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2480, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3880, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],

    goal: { x: 3920, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 200, y: FLOOR_Y - 48 },
      { x: 740, y: FLOOR_Y - 48 },
      { x: 860, y: FLOOR_Y - 48 },
      { x: 920, y: FLOOR_Y - 48 },
      { x: 1400, y: FLOOR_Y - 48 },
      { x: 1620, y: FLOOR_Y - 48 },
      { x: 1740, y: FLOOR_Y - 48 },
      { x: 2240, y: FLOOR_Y - 48 },
      { x: 2360, y: FLOOR_Y - 48 },
      { x: 2440, y: FLOOR_Y - 48 },
      { x: 3800, y: FLOOR_Y - 48 },
    ],

    doors: [
      { x: 900, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    mathGates: [
      { x: 320, y: FLOOR_Y - CONFIG.MATH_GATE.H },
      { x: 1800, y: FLOOR_Y - CONFIG.MATH_GATE.H },
    ],

    enemies: [
      { x: 2400, y: FLOOR_Y - CONFIG.ENEMY.H },
    ],

    collectZones: [
      { x: 160, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0, 1, 2, 3] },
    ],

    answerPickupSlots: [
      { x: 130, y: FLOOR_Y - 100 },
      { x: 190, y: FLOOR_Y - 100 },
      { x: 130, y: FLOOR_Y - 40 },
      { x: 190, y: FLOOR_Y - 40 },
    ],
  },

  mechanics: [],
  theme: null,
  parallax: null,
};
