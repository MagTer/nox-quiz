// src/levels/level-08.js — "The Last Ascent" descriptor.
//
// Capstone of the Phase 25 four-level ramp: table pool [6,7,8,9] (the hardest),
// verticality (LVL-05), and the locked mechanic mix (1 door + 1 enemy + the end
// goal gate). Climb tiers are PLATFORMS, never `floors` (those are pinned to
// FLOOR_Y in build.js), and the level carries a COMPLETE 4-field `bounds` object
// (never partial — Pitfall 2). Exactly one hidden secretAlcove (LVL-06).
//
// PHASE 34 (LVL-02) — THE END CLIMB IS A SWITCHBACK, NOT A STAIRCASE.
// Until Phase 34 this level ended with a monotonic up-and-right staircase that
// was a near-duplicate of level-07's (same ~65-70px rises, same shrinking
// 280->220 widths, same h:24). The capstone should feel like a different
// building, so the climb now REVERSES DIRECTION TWICE:
//
//   leg A (up-RIGHT):  T1 -> T2 -> T3      widening 300 / 280 / 300
//   REVERSAL 1:        T3 -> T4 is a hop up-LEFT (run right past T4's edge on
//                      T3's runway, turn around, jump back up-left onto T4)
//   leg B (up-LEFT):   T4                  350 wide — the turn-around shelf
//   REVERSAL 2:        T4 -> T5 is a hop up-RIGHT (walk LEFT along T4 to get
//                      running room, then sprint right and jump)
//   leg C (up-RIGHT):  T5 -> T6            340 -> 380 — widening into the summit
//
// Level-07 shrinks toward a narrow perch; level-08 GROWS toward a broad 380px
// summit balcony, so the arrival reads as an arrival. Rises are varied (70/65/
// 70/70/65) instead of level-07's flat 65 band.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_08 = {
  id: "level-08",
  displayName: "The Last Ascent",
  allowedTables: [6, 7, 8, 9],

  // COMPLETE 4-field bounds — all 4 present together in ONE literal (never
  // partial, per Pitfall 2). top:-360 gives ~1 extra screen of climb headroom
  // above the tallest tier (the summit balcony at y:-90).
  //
  // THE BOUNDS-CONVENTION TRAP (docs/LEVEL-DESIGN.md §7): level-01 derives its
  // camera right edge from geometry; level-02+ (this file) carry `bounds` and
  // game.js uses it AS-IS. The Phase-34 switchback's rightmost geometry edge is
  // the summit balcony's right edge, T6.x + T6.w = 3160 + 380 = 3540 — exactly
  // `right`, unchanged, because the switchback folds back on itself instead of
  // marching further right. Widen ANY tier and this must be hand-bumped or the
  // camera clamps short of the goal. Asserted by 34-04-PLAN's automated verify.
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
    // PLUS the 6-tier SWITCHBACK climb. ---
    platforms: [
      { x: 480, y: 250, w: 112, h: 24 }, // bridges gap 420..560 (rise 70px)
      { x: 1080, y: 250, w: 96, h: 24 }, // bridges gap 1040..1160 (rise 70px)
      { x: 1720, y: 250, w: 96, h: 24 }, // bridges gap 1680..1800 (rise 70px)

      // --- Capstone SWITCHBACK climb (Phase 34, LVL-02). Six ascending,
      // full-width tiers that reverse direction TWICE — see the file header.
      //
      // THE ~70px-OVERLAP RULE STILL BINDS, IN BOTH DIRECTIONS. Consecutive
      // tiers must overlap in x by ~70px: with spanMin=0 (an overlapping pair)
      // the rising-jump reachability model needs the SHORT-time-of-flight
      // root's reach (38.5px at a 70px rise, 34.7px at 65px) to land inside the
      // overlap window itself, so a 20-30px overlap makes NEITHER quadratic root
      // land inside it and the hop reads as unreachable to the BFS graph even
      // though it is visually a tiny step (25-03 produced exactly that false
      // HARD-FAIL on both level-07 and level-08). This applies identically to
      // the two LEFTWARD hops — `canReach`'s overlapping-span branch is
      // direction-agnostic; every overlap below is >= 70px.
      //
      // HOW EACH HOP IS ACTUALLY FLOWN (the long root, ~123.5px at a 70px rise,
      // is the LANDING root — the player takes off well clear of the next tier's
      // near edge and lands on it while DESCENDING; the short root is what the
      // graph matches against the overlap window). For the two reversals that
      // means running PAST the target tier's far edge, turning, and jumping back
      // — which is the whole point: the turn is a real, deliberate move.
      { x: 2410, y: 250, w: 300, h: 24 }, // T1  rise 70 from floor-3 (ends 2710)
      { x: 2640, y: 180, w: 280, h: 24 }, // T2  rise 70, overlaps T1 by 70 (ends 2920)
      { x: 2850, y: 115, w: 300, h: 24 }, // T3  rise 65, overlaps T2 by 70 (ends 3150) — the turn-around runway: 190px of T3 sticks out right of T4
      { x: 2610, y: 45, w: 350, h: 24 }, // T4  rise 70, overlaps T3 by 110 (2850..2960) — REVERSAL 1: hop up-LEFT off T3's runway
      { x: 2890, y: -25, w: 340, h: 24 }, // T5  rise 70, overlaps T4 by 70 (2890..2960) — REVERSAL 2: walk LEFT along T4 for run-up, then hop up-RIGHT
      { x: 3160, y: -90, w: 380, h: 24 }, // T6  rise 65, overlaps T5 by 70 (3160..3230) — the SUMMIT BALCONY (380px wide; ends 3540 == bounds.right)
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

      // --- The 6 switchback-climb coins (Phase 34). Each sits on the CLEAR part
      // of its tier — never under the next tier's overhang, which is a ceiling
      // bonk (Plan 34-02 falsified 9 shipped coins on exactly that: the rising
      // arc's head hits the platform underside and the coin is never touched).
      // A coin at ~tier.y-56 is inside the walking player's pass-through box; at
      // ~tier.y-90 it needs a real hop. Both kinds are used, so the climb still
      // rewards jumping.
      { x: 2480, y: 194 }, // T1 (y250-56)  — walk-through, on the run-up to T2
      { x: 2760, y: 90 }, // T2 (y180-90)  — HOP; clear of T4's underside (y69) with 21px to spare
      { x: 3040, y: 59 }, // T3 (y115-56)  — walk-through, out on the turn-around runway right of T4's edge (2960): rewards running to the turn
      { x: 2700, y: -45 }, // T4 (y45-90)   — HOP, on the leftward leg, clear of T5's overhang (starts 2890)
      { x: 3000, y: -81 }, // T5 (y-25-56)  — walk-through, clear of T6's overhang (starts 3160)
      { x: 3400, y: -146 }, // T6 (y-90-56)  — walk-through on the summit balcony, near the goal
    ],

    spikes: [
      { x: 850, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-1 (560..1040)
      { x: 1450, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-2 (1160..1680)
      { x: 2200, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-3 (1800..2360)
    ],

    // Goal sits atop T6, the summit balcony, 80px before its right edge (3540).
    goal: { x: 3460, y: -90 - CONFIG.GOAL_SIZE },

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
      { x: 2340, y: FLOOR_Y - 48 }, // before the climb entry (T1 @2410, lead 70)

      // --- One checkpoint per switchback tier, placed on the side the player
      // ACTUALLY ARRIVES ON — a fall during the climb must never cost more than
      // one tier (the ADHD-safe no-game-over policy). For the three rightward
      // hops that is near the tier's LEFT end; for REVERSAL 1 (the up-LEFT hop
      // onto T4) the player lands near T4's RIGHT end, so T4's checkpoint goes
      // there. Checkpoint y always matches the surface it sits on (tier.y - 48).
      { x: 2430, y: 250 - 48 }, // T1 landing (left end)
      { x: 2660, y: 180 - 48 }, // T2 landing (left end)
      { x: 2870, y: 115 - 48 }, // T3 landing (left end)
      { x: 2920, y: 45 - 48 }, // T4 landing — RIGHT end: this hop arrives travelling LEFT
      { x: 2910, y: -25 - 48 }, // T5 landing (left end; the up-right hop off T4)
      { x: 3190, y: -90 - 48 }, // T6 landing — the summit balcony
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

    // Secret XP alcove (LVL-06) — one per level, ~70px above a tier, never
    // gating, free to skip. The old alcove ({x:2950, y:40}) sat off the OLD
    // tier-4 and is now INSIDE T4's collider, so it moved with the climb.
    //
    // New home: the DEAD END of the leftward leg. The required path across T4 is
    // "land at its right end (~2930), walk left to ~2800, sprint right and jump
    // to T5" — so walking on past the take-off spot to T4's far left corner is a
    // genuine, optional detour that costs nothing to skip. Hop up 70px from
    // there and the alcove is yours.
    //
    // CRITICAL — the alcove is judged by the RIGHTWARD-TRAVEL-ONLY point model
    // (`bestMarginToPoint`, unlike coins which Plan 34-01 made bidirectional):
    // it is only credited from a launch node whose span starts at or before it.
    // x:2650 sits inside T4's own span (2610..2960) with T4.xStart < 2650, so it
    // is credited as an in-footprint hop off T4 and does not HARD-FAIL.
    secretAlcove: [
      { x: 2650, y: -25 },
    ],
  },

  mechanics: [],
  biome: "castle", // Phase 32 (ART-02/ART-03) — level 8 of 8, Castlevania arc calm->harsh (levels 1-2 swamp, 3-4 town, 5-6 cemetery, 7-8 castle)
  parallax: null,
};
