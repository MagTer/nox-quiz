// src/levels/level-07.js — "The Ascending Vault" descriptor.
//
// Third of the Phase 25 four-level ramp: table pool [6,7,8], the first level with
// a verticality segment (LVL-05). A single-screen-tall main run (floors 0-3, two
// hazards + a mathGate + a door) leads into a 6-tier ascending, net-rightward
// "capstone climb" — each tier is a wide platform, NOT a floor (floors are
// pinned to the fixed FLOOR_Y=320 in build.js, so climbing height must be
// authored via `platforms`, which carry their own {x,y}). Every tier is a
// full-width landing (not a narrow ledge) so a fall during the climb lands on
// solid ground, never past the global fall-respawn threshold (world-Y 480,
// per game.js — the climb only ever gets HIGHER, further from that threshold).
// Carries a COMPLETE 4-field `bounds` object (Pitfall 2 — game.js's
// `level.bounds ?? {...}` is all-or-nothing, never a per-field merge) with
// `top: -360` giving the camera roughly one extra screen of upward pan room.
// Exactly one hidden secretAlcove (LVL-06), a sideways detour off tier-4.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_07 = {
  id: "level-07",
  displayName: "The Ascending Vault",
  allowedTables: [6, 7, 8],

  // COMPLETE 4-field bounds — all 4 present together in ONE literal (never
  // partial, per Pitfall 2). top:-360 gives ~1 extra screen of climb headroom
  // above the tallest tier (y:-70).
  bounds: { left: 0, right: 3780, top: -360, bottom: 360 },

  geometry: {
    // --- Main single-screen run (floors 0-3) ---
    floors: [
      { x: 0, w: 460 },
      { x: 600, w: 520 }, // gap 460..600 (140px)
      { x: 1240, w: 560 }, // gap 1120..1240 (120px)
      { x: 1920, w: 680 }, // gap 1800..1920 (120px), ends 2600
    ],

    // --- Raised platforms: the gap-bridging stepping stones on the main run,
    // PLUS the 6-tier ascending climb (each tier is a wide, full-width landing;
    // Δy=-65..-70px per hop, well under the 88.331px calibrated ceiling; every
    // hop makes NET-RIGHTWARD x progress, per Pitfall 4). ---
    platforms: [
      { x: 500, y: 255, w: 112, h: 24 }, // bridges gap 460..600 (rise 65px)
      { x: 1160, y: 250, w: 96, h: 24 }, // bridges gap 1120..1240 (rise 70px)
      { x: 1840, y: 255, w: 96, h: 24 }, // bridges gap 1800..1920 (rise 65px)

      // --- Capstone climb: 6 ascending, net-rightward, full-width tiers.
      // Each consecutive pair OVERLAPS in x by ~70px (not just a few px) — the
      // rising-jump reachability model requires the SHORT-time-of-flight root's
      // reach (~35px at this 65px rise) to land within the overlap window
      // itself when spanMin=0 (an overlapping pair), so a too-narrow overlap
      // (e.g. 20-30px) makes NEITHER quadratic root land inside it and the hop
      // reads as unreachable to the BFS graph even though it is visually a tiny
      // step. 70px overlap comfortably clears that threshold with margin. ---
      { x: 2650, y: 255, w: 280, h: 24 }, // tier 1 (rise 65px from floor-3)
      { x: 2860, y: 190, w: 260, h: 24 }, // tier 2 (rise 65px, overlaps tier 1 by 70px)
      { x: 3050, y: 125, w: 250, h: 24 }, // tier 3 (rise 65px, overlaps tier 2 by 70px)
      { x: 3230, y: 60, w: 240, h: 24 }, // tier 4 (rise 65px, overlaps tier 3 by 70px)
      { x: 3400, y: -5, w: 230, h: 24 }, // tier 5 (rise 65px, overlaps tier 4 by 70px)
      { x: 3560, y: -70, w: 220, h: 24 }, // tier 6 — capstone (rise 65px, overlaps tier 5 by 70px)
    ],

    coins: [
      { x: 120, y: 264 },
      { x: 260, y: 184 },
      { x: 420, y: 128 },
      { x: 650, y: 264 },
      { x: 1050, y: 264 },
      { x: 1300, y: 176 },
      { x: 1500, y: 264 },
      { x: 1700, y: 264 },
      { x: 1960, y: 264 },
      { x: 2200, y: 176 },
      { x: 2400, y: 264 },
      { x: 2680, y: 220 }, // tier 1
      { x: 2900, y: 155 }, // tier 2
      { x: 3100, y: 90 }, // tier 3
      { x: 3300, y: 25 }, // tier 4
      { x: 3480, y: -40 }, // tier 5
      { x: 3620, y: -105 }, // tier 6, near the goal
    ],

    spikes: [
      { x: 700, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-1 (600..1120)
      { x: 1400, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-2 (1240..1800)
    ],

    // Goal sits atop tier 6 (capstone), 80px before its right edge (3780).
    goal: { x: 3700, y: -70 - CONFIG.GOAL_SIZE },

    // One near-start checkpoint + one 64-80px before EVERY hazard/mechanic, PLUS
    // one at the start of EVERY climb tier (a fall during the long climb must
    // never cost more than one tier). Checkpoint y always matches the surface
    // it sits on: FLOOR_Y-48 on the floors, tier.y-48 on each climb tier.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start
      { x: 630, y: FLOOR_Y - 48 }, // before spike@700 (lead 70)
      { x: 1330, y: FLOOR_Y - 48 }, // before spike@1400 (lead 70)
      { x: 1930, y: FLOOR_Y - 48 }, // before mathGate@2000 (lead 70), floor-3 start
      { x: 2230, y: FLOOR_Y - 48 }, // before door@2300 (lead 70)
      { x: 2580, y: FLOOR_Y - 48 }, // before the climb entry (tier 1 @2650, lead 70)
      { x: 2670, y: 255 - 48 }, // tier 1 landing
      { x: 2880, y: 190 - 48 }, // tier 2 landing
      { x: 3070, y: 125 - 48 }, // tier 3 landing
      { x: 3250, y: 60 - 48 }, // tier 4 landing
      { x: 3420, y: -5 - 48 }, // tier 5 landing
      { x: 3580, y: -70 - 48 }, // tier 6 (capstone) landing
    ],

    doors: [
      { x: 2300, y: FLOOR_Y - CONFIG.DOOR.H }, // floor-3 (1920..2600)
    ],

    mathGates: [
      { x: 2000, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // floor-3 (1920..2600)
    ],

    enemies: [],
    collectZones: [],
    answerPickupSlots: [],

    // Secret XP alcove (LVL-06) — a sideways detour to the left of tier 4's
    // start, roughly at tier-4 height, off the main net-rightward climb path.
    secretAlcove: [
      { x: 3190, y: 60 },
    ],
  },

  mechanics: [],
  theme: null,
  parallax: null,
};
