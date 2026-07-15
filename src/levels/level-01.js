// src/levels/level-01.js — "The First Descent" descriptor, REBUILT from scratch
// (Phase 34.6, LEN-01/LEN-02). The append-only convention (LEVEL-DESIGN.md §9.1) is
// explicitly SUSPENDED for this phase — this is a whole-cloth rewrite, not an
// extension of the old v3.0-lineage geometry. The old byte-for-byte-frozen v3.0
// geometry (floors to 3640, goal at 3560) is gone; see git history for it.
//
// ODD level (calm swamp intro / soft landing, LEVEL-DESIGN §8 L1-2 band): 120px
// gaps, gentle 60-70px rises, and ZERO overlapping platform tiers anywhere — no
// ceilings at all. Roughly doubled in length (goal.x 3560 -> 7100) with a
// deliberate DESCENT (the hump climb that bridges the 2240..2650 gap: up two
// tiers, then explicitly back DOWN two tiers to the next floor) and one OPTIONAL
// visible high route over floor-2 (bonus coins, no key — keys are even-level
// only). No `bounds` field: level-01 alone derives its right edge from geometry
// (game.js), per the bounds-convention trap in LEVEL-DESIGN.md §7.
//
// This is a PURE data module: no engine globals (a727c13). The ONLY import is
// ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_01 = {
  id: "level-01",
  displayName: "The First Descent",

  // Level-01 stays on the v3.0 hard pool (tables 6-9) — do not soften.
  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Contiguous floor runs (one merged collider each), pinned to FLOOR_Y.
    // Standard 120px gaps throughout (bare running-jump crossable per
    // LEVEL-DESIGN §2); the 2240..2650 span is the one wide exception — it is
    // bridged entirely by the ascent/descent platform hump below, and the
    // 4330..4490 span (160px) is bridged by a single mid-gap stepping stone.
    floors: [
      { x: 0, w: 560 }, // opening run — calm, no hazards
      { x: 680, w: 440 }, // gap 560..680 (120)
      { x: 1240, w: 480 }, // gap 680+440=1120..1240 (120) — door + optional high route + first spike
      { x: 1840, w: 400 }, // gap 1720..1840 (120) — second spike, leads into the hump
      { x: 2650, w: 500 }, // gap 2240..2650 (410, bridged by the hump platforms) — enemy + third spike
      { x: 3270, w: 460 }, // gap 3150..3270 (120) — fourth spike
      { x: 3850, w: 480 }, // gap 3730..3850 (120) — fifth spike
      { x: 4490, w: 460 }, // gap 4330..4490 (160, bridged by one stepping stone) — sixth spike
      { x: 5070, w: 480 }, // gap 4950..5070 (120) — seventh spike
      { x: 5670, w: 500 }, // gap 5550..5670 (120) — eighth spike
      { x: 6290, w: 900 }, // gap 6170..6290 (120) — final calm run to the goal
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, LEVEL-DESIGN §3.1), every y
    // deliberately off the 16px grid (the "don't snap climb-tier y" trap, §3.4).
    // ZERO platform pairs overlap in x anywhere in this level (L1-2's "no
    // ceilings at all" rule, §8) — every rise is 60-70px, non-overlapping tiers.
    platforms: [
      { x: 280, y: 254, w: 120, h: 16 }, // early optional hop over floor-0 — hosts the secret alcove
      { x: 850, y: 254, w: 90, h: 16 }, // height-variety hop over floor-1
      { x: 1480, y: 254, w: 90, h: 16 }, // optional HIGH ROUTE tier 1, over floor-2 (bonus coins, no key)
      { x: 1600, y: 191, w: 90, h: 16 }, // optional HIGH ROUTE tier 2 (peak) — rise 63 from tier 1
      { x: 2260, y: 250, w: 100, h: 16 }, // the HUMP: ascent tier 1 (rise 70 from floor-3)
      { x: 2380, y: 185, w: 110, h: 16 }, // the HUMP: ascent tier 2 / peak (rise 65 from tier 1)
      { x: 2500, y: 250, w: 110, h: 16 }, // the HUMP: DESCENT tier 1 (drop 65 from the peak — the deliberate descent)
      { x: 4370, y: 260, w: 100, h: 16 }, // mid-gap stepping stone bridging the 160px gap6
      { x: 5850, y: 254, w: 90, h: 16 }, // late height-variety hop over floor-9
    ],

    // 34 coins (roughly double the old 16) — every one a fly-through box a
    // driven player actually reaches (walk-family: coin.y = surfaceY - 56, the
    // "walking height" convention that makes it collectable by simply passing
    // through, no jump required). The high-route tier-2 platform (x:1600,y:191)
    // carries the two bonus coins — the optional-route reward.
    coins: [
      { x: 150, y: 264 },
      { x: 450, y: 264 },
      { x: 340, y: 198 }, // on the early optional hop platform (near the secret alcove)
      { x: 750, y: 264 },
      { x: 1030, y: 264 },
      { x: 890, y: 198 }, // on the floor-1 height-variety platform
      { x: 1260, y: 264 },
      { x: 1695, y: 264 },
      { x: 1510, y: 198 }, // high route tier 1
      { x: 1630, y: 135 }, // high route tier 2 — bonus coin 1
      { x: 1660, y: 135 }, // high route tier 2 — bonus coin 2
      { x: 1900, y: 264 },
      { x: 2180, y: 264 },
      { x: 2300, y: 194 }, // hump ascent tier 1
      { x: 2430, y: 129 }, // hump peak
      { x: 2550, y: 194 }, // hump descent tier 1
      { x: 2700, y: 264 },
      { x: 2960, y: 264 },
      { x: 3120, y: 264 },
      { x: 3320, y: 264 },
      { x: 3650, y: 264 },
      { x: 3900, y: 264 },
      { x: 4200, y: 264 },
      { x: 4410, y: 204 }, // mid-gap stepping stone
      { x: 4550, y: 264 },
      { x: 4880, y: 264 },
      { x: 5120, y: 264 },
      { x: 5480, y: 264 },
      { x: 5720, y: 264 },
      { x: 6100, y: 264 },
      { x: 5890, y: 198 }, // late height-variety platform
      { x: 6350, y: 264 },
      { x: 6700, y: 264 },
      { x: 7050, y: 264 },
    ],

    // 8 floor spikes (double the old 4), one checkpoint 80px before each.
    spikes: [
      { x: 1440, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // clear of the high-route platforms (1480..1690) — a spike under a platform bonks the hop arc (LEVEL-DESIGN §3.5)
      { x: 1920, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // clear of the hump's P0 mount takeoff (spike-before-mount/gap conflict — a spike hop landing near a jump takeoff can strand the driven player mid-air, so every spike below keeps a >=250px margin from the floor's own edge)
      { x: 2820, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // 330px clear of floor-4's end (the bare gap takeoff at 3150)
      { x: 3450, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // 280px clear of floor-5's end (the bare gap takeoff at 3730)
      { x: 3930, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // clear of the mid-gap stepping stone's mount takeoff (same conflict class as spike[1])
      { x: 4670, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // 280px clear of floor-7's end (the bare gap takeoff at 4950)
      { x: 5250, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // 300px clear of floor-8's end (the bare gap takeoff at 5550)
      { x: 5760, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // 410px clear of floor-9's end (the bare gap takeoff at 6170)
    ],

    // Goal caps the final run (goal.x roughly double the old 3560; 90px buffer
    // before floor-10's end at 7190, matching the shipped 80-90px convention).
    goal: { x: 7100, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, one extra early safety net, and one
    // just before EVERY spike, plus a final navigational one at the last run.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start-area checkpoint
      { x: 700, y: FLOOR_Y - 48 }, // extra early safety net (start of floor-1)
      { x: 1360, y: FLOOR_Y - 48 }, // before the first spike (x=1440)
      { x: 1840, y: FLOOR_Y - 48 }, // before the second spike (x=1920, start of floor-3)
      { x: 2740, y: FLOOR_Y - 48 }, // before the third spike (x=2820)
      { x: 3370, y: FLOOR_Y - 48 }, // before the fourth spike (x=3450)
      { x: 3850, y: FLOOR_Y - 48 }, // before the fifth spike (x=3930, start of floor-6)
      { x: 4590, y: FLOOR_Y - 48 }, // before the sixth spike (x=4670)
      { x: 5170, y: FLOOR_Y - 48 }, // before the seventh spike (x=5250)
      { x: 5680, y: FLOOR_Y - 48 }, // before the eighth spike (x=5760, start of floor-9)
      { x: 6320, y: FLOOR_Y - 48 }, // start of the final calm run to the goal
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate.
    // Sits on solid floor-2, well clear of the gap on either side.
    doors: [
      { x: 1300, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density locked at exactly
    // 1 door + 1 enemy + the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — on solid floor-4, well clear of the hump above it.
    enemies: [
      { x: 2900, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 },
    ],

    // Exactly ONE secret alcove, ~70px above the early optional platform
    // (x:280, y:254, w:120) — off the required path, never signposted.
    secretAlcove: [
      { x: 320, y: 184 },
    ],
  },

  // --- Forward-looking optional slots (buildLevel ignores them when unset) ---
  mechanics: [],
  biome: "swamp", // level 1 of 8 — Castlevania arc calm->harsh (levels 1-2 swamp)
  parallax: null,
};
