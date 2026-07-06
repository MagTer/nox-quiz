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

  bounds: { left: 0, right: 6200, top: 0, bottom: 360 }, // Phase 24: bumped 4000->6200 for the +2200px extension (LVL-01)

  geometry: {
    floors: [
      { x: 0, w: 440 },
      { x: 600, w: 480 },
      { x: 1240, w: 520 },
      { x: 1960, w: 560 },
      { x: 2680, w: 560 },
      { x: 3400, w: 600 },
      { x: 4160, w: 560 }, // Phase 24 extension run 1 (after new gap 4000..4160)
      { x: 4920, w: 600 }, // Phase 24 extension run 2 (after new gap 4720..4920)
      { x: 5680, w: 520 }, // Phase 24 extension run 3, final run to the new goal (after new gap 5520..5680), ends at 6200
    ],

    platforms: [
      { x: 240, y: 232, w: 112, h: 24 },
      { x: 440, y: 168, w: 80, h: 24 },
      { x: 1080, y: 250, w: 112, h: 24 }, // Phase 24: rise reduced 120->70px (VALID-04) — was y:200
      { x: 1400, y: 250, w: 80, h: 24 }, // Phase 24: rise reduced 104->70px (VALID-04) — was y:216
      { x: 1760, y: 250, w: 128, h: 24 }, // Phase 24: rise reduced 144->70px (VALID-04) — was y:176
      { x: 2140, y: 250, w: 80, h: 24 }, // Phase 24: rise reduced 104->70px (VALID-04) — was y:216
      { x: 2520, y: 250, w: 112, h: 24 }, // Phase 24: rise reduced 128->70px (VALID-04) — was y:192
      { x: 2880, y: 224, w: 80, h: 24 },
      { x: 3240, y: 250, w: 112, h: 24 }, // Phase 24: rise reduced 136->70px (VALID-04) — was y:184
      { x: 4000, y: 250, w: 128, h: 24 }, // Phase 24 extension: bridges new gap 4000..4160, touching floor-6's end at 4000 exactly, rise 70px
      { x: 4720, y: 250, w: 128, h: 24 }, // Phase 24 extension: bridges new gap 4720..4920, touches floor-7's end exactly, rise 70px
      { x: 5520, y: 250, w: 112, h: 24 }, // Phase 24 extension: bridges new gap 5520..5680, touches floor-8's end exactly, rise 70px
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
      { x: 4040, y: 264 }, // Phase 24 extension
      { x: 4260, y: 184 }, // Phase 24 extension
      { x: 4460, y: 136 }, // Phase 24 extension
      { x: 4760, y: 264 }, // Phase 24 extension
      { x: 5060, y: 176 }, // Phase 24 extension
      { x: 5300, y: 264 }, // Phase 24 extension
      { x: 5900, y: 264 }, // Phase 24 extension
    ],

    spikes: [
      { x: 820, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1000, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1480, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1700, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2320, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2480, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3880, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 4300, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // Phase 24 extension, on floor-7 (4160..4720 span)
      { x: 5200, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // Phase 24 extension, on floor-8 (4920..5520 span)
    ],

    goal: { x: 6120, y: FLOOR_Y - CONFIG.GOAL_SIZE }, // Phase 24: moved 3920->6120 for the +2200px extension (LVL-01); 80px buffer before floor-9's end at 6200

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
      { x: 4220, y: FLOOR_Y - 48 }, // Phase 24 extension, before the new spike (x=4300) — 80px lead
      { x: 4920, y: FLOOR_Y - 48 }, // Phase 24 extension, before the new door (x=5000), at floor-8's start — 80px lead
      { x: 5120, y: FLOOR_Y - 48 }, // Phase 24 extension, before the new spike (x=5200) — 80px lead
      { x: 5680, y: FLOOR_Y - 48 }, // Phase 24 extension, before the new mathGate (x=5760), at floor-9's start — 80px lead
    ],

    doors: [
      { x: 900, y: FLOOR_Y - CONFIG.DOOR.H },
      { x: 5000, y: FLOOR_Y - CONFIG.DOOR.H }, // Phase 24 extension, on floor-8 (4920..5520 span)
    ],

    mathGates: [
      { x: 320, y: FLOOR_Y - CONFIG.MATH_GATE.H },
      { x: 1300, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // Phase 24 re-reposition: was x:1728 [was x:1800 pre-Phase-24, over-hole per VALID-04] — x:1728 sat at floor-2's very edge, immediately before the gap 1760..1960 crossing platform, trapping forward-only traversal with no runway after the challenge resolves; x:1300 sits comfortably mid-floor-2, well before that platform, fully inside floor-2's 1240..1760 span
      { x: 5760, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // Phase 24 extension, on floor-9 (5680..6200 span)
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
