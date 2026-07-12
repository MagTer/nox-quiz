// src/levels/level-08.js — "The Last Ascent" descriptor.
//
// Capstone of the Phase 25 four-level ramp: table pool [6,7,8,9] (the hardest),
// verticality (LVL-05) mirroring level-07's climb pattern, and the densest
// mechanic mix (door + mathGate + enemy), mirroring level-04's
// density. Same climb rules as level-07: 6 ascending, net-rightward, full-width
// platform tiers (never `floors` — those are pinned to FLOOR_Y in build.js), a
// COMPLETE 4-field `bounds` object (never partial — Pitfall 2), uniform 70px-band
// rises throughout. Exactly one hidden secretAlcove (LVL-06), a sideways detour
// off tier-4.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_08 = {
  id: "level-08",
  displayName: "The Last Ascent",
  allowedTables: [6, 7, 8, 9],

  // COMPLETE 4-field bounds — all 4 present together in ONE literal (never
  // partial, per Pitfall 2). top:-360 gives ~1 extra screen of climb headroom
  // above the tallest tier (y:-100).
  bounds: { left: 0, right: 3540, top: -360, bottom: 360 },

  geometry: {
    // --- Main single-screen run (floors 0-3), densest mechanic mix ---
    floors: [
      { x: 0, w: 420 },
      { x: 560, w: 480 }, // gap 420..560 (140px)
      { x: 1160, w: 520 }, // gap 1040..1160 (120px)
      { x: 1800, w: 560 }, // gap 1680..1800 (120px), ends 2360
    ],

    // --- Raised platforms: gap-bridging stepping stones on the main run,
    // PLUS the 6-tier ascending climb (uniform 70px rises, wide full-width
    // tiers, NET-RIGHTWARD every hop, per Pitfall 4). ---
    platforms: [
      { x: 480, y: 250, w: 112, h: 24 }, // bridges gap 420..560 (rise 70px)
      { x: 1080, y: 250, w: 96, h: 24 }, // bridges gap 1040..1160 (rise 70px)
      { x: 1720, y: 250, w: 96, h: 24 }, // bridges gap 1680..1800 (rise 70px)

      // --- Capstone climb: 6 ascending, net-rightward, full-width tiers.
      // Each consecutive pair OVERLAPS in x by ~70px (not just a few px) — the
      // rising-jump reachability model requires the SHORT-time-of-flight root's
      // reach (~39px at this 70px rise) to land within the overlap window
      // itself when spanMin=0 (an overlapping pair), so a too-narrow overlap
      // (e.g. 20-30px) makes NEITHER quadratic root land inside it and the hop
      // reads as unreachable to the BFS graph even though it is visually a tiny
      // step. 70px overlap comfortably clears that threshold with margin. ---
      { x: 2410, y: 250, w: 280, h: 24 }, // tier 1 (rise 70px from floor-3)
      { x: 2620, y: 180, w: 260, h: 24 }, // tier 2 (rise 70px, overlaps tier 1 by 70px)
      { x: 2810, y: 110, w: 250, h: 24 }, // tier 3 (rise 70px, overlaps tier 2 by 70px)
      { x: 2990, y: 40, w: 240, h: 24 }, // tier 4 (rise 70px, overlaps tier 3 by 70px)
      { x: 3160, y: -30, w: 230, h: 24 }, // tier 5 (rise 70px, overlaps tier 4 by 70px)
      { x: 3320, y: -100, w: 220, h: 24 }, // tier 6 — capstone (rise 70px, overlaps tier 5 by 70px)
    ],

    coins: [
      { x: 100, y: 264 },
      { x: 240, y: 184 },
      { x: 380, y: 128 },
      { x: 620, y: 264 },
      { x: 780, y: 176 },
      { x: 980, y: 264 },
      { x: 1220, y: 264 },
      { x: 1380, y: 176 },
      { x: 1550, y: 264 },
      { x: 1850, y: 264 },
      { x: 2020, y: 176 },
      { x: 2250, y: 264 },
      { x: 2450, y: 220 }, // tier 1
      { x: 2660, y: 150 }, // tier 2
      { x: 2850, y: 85 }, // tier 3
      { x: 3030, y: 15 }, // tier 4
      { x: 3200, y: -55 }, // tier 5
      { x: 3360, y: -125 }, // tier 6, near the goal
    ],

    spikes: [
      { x: 850, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-1 (560..1040)
      { x: 1450, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-2 (1160..1680)
      { x: 2200, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-3 (1800..2360)
    ],

    // Goal sits atop tier 6 (capstone), 80px before its right edge (3540).
    goal: { x: 3460, y: -100 - CONFIG.GOAL_SIZE },

    // One near-start checkpoint + one 64-80px before EVERY hazard/mechanic, PLUS
    // one at the start of EVERY climb tier (a fall during the long climb must
    // never cost more than one tier). Checkpoint y always matches the surface
    // it sits on: FLOOR_Y-48 on the floors, tier.y-48 on each climb tier.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start
      { x: 130, y: FLOOR_Y - 48 }, // before the mid-run approach (lead 20; no mechanic sits at this exact x any more)
      { x: 630, y: FLOOR_Y - 48 }, // before door@700 (lead 70)
      { x: 780, y: FLOOR_Y - 48 }, // before spike@850 (lead 70)
      { x: 1230, y: FLOOR_Y - 48 }, // before mathGate@1300 (lead 70)
      { x: 1380, y: FLOOR_Y - 48 }, // before spike@1450 (lead 70)
      { x: 1530, y: FLOOR_Y - 48 }, // before enemy@1600 (lead 70)
      { x: 1980, y: FLOOR_Y - 48 }, // before mathGate@2050 (lead 70)
      { x: 2130, y: FLOOR_Y - 48 }, // before spike@2200 (lead 70)
      { x: 2340, y: FLOOR_Y - 48 }, // before the climb entry (tier 1 @2410, lead 70)
      { x: 2430, y: 250 - 48 }, // tier 1 landing
      { x: 2640, y: 180 - 48 }, // tier 2 landing
      { x: 2830, y: 110 - 48 }, // tier 3 landing
      { x: 3010, y: 40 - 48 }, // tier 4 landing
      { x: 3180, y: -30 - 48 }, // tier 5 landing
      { x: 3340, y: -100 - 48 }, // tier 6 (capstone) landing
    ],

    doors: [
      { x: 700, y: FLOOR_Y - CONFIG.DOOR.H }, // floor-1 (560..1040)
    ],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy +
    // the end-of-level goal gate (user decision 2026-07-12; removed gates
    // x:1300/2050 are in git history).
    mathGates: [],

    enemies: [
      { x: 1600, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 2 }, // enemy-3 (fly); floor-2 (1160..1680)
    ],

    // Secret XP alcove (LVL-06) — a sideways detour to the left of tier 4's
    // start, roughly at tier-4 height, off the main net-rightward climb path.
    secretAlcove: [
      { x: 2950, y: 40 },
    ],
  },

  mechanics: [],
  biome: "castle", // Phase 32 (ART-02/ART-03) — level 8 of 8, Castlevania arc calm->harsh (levels 1-2 swamp, 3-4 town, 5-6 cemetery, 7-8 castle)
  parallax: null,
};
