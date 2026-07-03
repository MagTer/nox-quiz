// src/levels/level-02.js — "The Rusted Climb" descriptor.
//
// A gentle step up from level-01: wider floor runs, slightly wider gaps with
// smaller stepping-stone platforms, and four floor spikes. Table pool softens
// to [1..7] so the kid builds confidence after the hard opener. Reuses the
// existing builder and mechanic wiring with one door and two checkpoint gates.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_02 = {
  id: "level-02",
  displayName: "The Rusted Climb",
  allowedTables: [1, 2, 3, 4, 5, 6, 7],

  // Camera clamp scaled to the longer level; top/bottom match the 360px screen.
  bounds: { left: 0, right: 2800, top: 0, bottom: 360 },

  geometry: {
    floors: [
      { x: 0, w: 520 },
      { x: 700, w: 560 },
      { x: 1420, w: 600 },
      { x: 2180, w: 620 },
    ],

    platforms: [
      { x: 280, y: 240, w: 160, h: 24 },
      { x: 500, y: 192, w: 128, h: 24 },
      { x: 640, y: 232, w: 128, h: 24 },
      { x: 1200, y: 232, w: 128, h: 24 },
      { x: 1360, y: 192, w: 96, h: 24 },
      { x: 2020, y: 232, w: 128, h: 24 },
      { x: 2360, y: 240, w: 128, h: 24 },
    ],

    coins: [
      { x: 160, y: 264 },
      { x: 320, y: 184 },
      { x: 540, y: 136 },
      { x: 760, y: 264 },
      { x: 1040, y: 264 },
      { x: 1260, y: 176 },
      { x: 1560, y: 264 },
      { x: 1900, y: 176 },
      { x: 2280, y: 264 },
      { x: 2600, y: 264 },
    ],

    spikes: [
      { x: 920, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1180, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1760, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2560, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],

    goal: { x: 2720, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 340, y: FLOOR_Y - 48 },
      { x: 840, y: FLOOR_Y - 48 },
      { x: 1020, y: FLOOR_Y - 48 },
      { x: 1120, y: FLOOR_Y - 48 },
      { x: 1460, y: FLOOR_Y - 48 },
      { x: 1680, y: FLOOR_Y - 48 },
      { x: 2480, y: FLOOR_Y - 48 },
    ],

    doors: [
      { x: 1540, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    mathGates: [
      { x: 420, y: FLOOR_Y - CONFIG.MATH_GATE.H },
      { x: 1100, y: FLOOR_Y - CONFIG.MATH_GATE.H },
    ],

    enemies: [],
    collectZones: [],
    answerPickupSlots: [],
  },

  mechanics: [],
  theme: null,
  parallax: null,
};
