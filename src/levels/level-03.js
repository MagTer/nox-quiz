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
      // Plan 25-07: the former { x: 1160, y: 224, w: 112, h: 24 } stepping stone over
      // the 1200..1320 gap REMOVED — it was unreachable as a landing (96px rise
      // exceeded the calibrated 88.331 maxRise) AND, discovered only by the
      // interactive audit driving a real held jump underneath it, its underside
      // (248) sat a mere 40px above floor level — well within a held jump's first
      // ~100ms of ascent — turning any direct-jump attempt at this gap into a
      // ceiling bonk that killed all upward velocity and dropped the player into
      // the gap. The 120px gap is independently, comfortably within a single direct
      // jump (well under the ~156px calibrated range) per validate-levels.mjs's own
      // WARN-not-HARD-FAIL reading — this platform was never load-bearing for
      // reachability, only an unreachable, hazardous obstruction. Mirrors the
      // identical fix applied to level-07's redundant gap-1 platform this same plan.
      { x: 1520, y: 172, w: 96, h: 24 }, // Plan 25-07: raised 232->172 (underside clearance 64px->124px) — its old underside sat only 64px above floor level, a ceiling-bonk hazard for the spike@1580 hop launched at x:1528 (inside this platform's 1520..1616 span), discovered by the interactive audit. A decorative height-variety hop (not gap-bridging); raising it is cosmetic-only.
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
      { x: 2400, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 1 }, // enemy-2 (barnacle)
      { x: 3800, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 2 }, // enemy-3 (fly); Phase 24 extension (on floor-5, 3560..4160)
    ],

    // Phase 25 retrofit (LVL-06) — purely additive, does not touch any existing
    // floor/platform/checkpoint geometry. A short extra hop UP from the opening
    // platform (x:280, y:240, w:128) — not signposted, not gating.
    secretAlcove: [
      { x: 310, y: 170 },
    ],
  },

  mechanics: [],
  theme: "theme-3", // VIS-03 theme assignment — teal, level 3 of 8
  parallax: null,
};
