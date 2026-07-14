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
  // partial, per Pitfall 2). top:-360 still clears the tallest tier: the summit
  // balcony rose from y:-90 to y:-125 when the climb's rises were widened for
  // headroom, and the camera wants a top edge of about -125-32-180 = -337 with
  // the player standing on it — inside -360, so `top` did NOT need a bump.
  // The highest entity of any kind is the summit coin at y:-181.
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
      // VERTICAL HEADROOM (Phase 34 follow-up). The first cut of this climb shipped
      // h:24 tiers at 65-70px rises, which leaves
      //     headroom = rise - h - PLAYER_H(32)
      // of only 9-14px between a tier's walking surface and the underside of the
      // tier overhanging it — the climb was playable but felt claustrophobic
      // ("a bit tight between the platforms vertically" — kid playtest). The fix
      // is BOTH levers at once: thin the tiers to h:16 AND widen the rises to
      // 72-75, giving headroom = 75 - 16 - 32 = 27px (~3x the old figure).
      //
      // 75 is the CEILING here: docs/LEVEL-DESIGN.md's soft rise band is 60-75px
      // (65-75 explicitly allowed when the landing span is wide >= 80px — these
      // spans are 280-380px), and the HARD maxRise is 88.33px. Staying at 75
      // preserves the ~13px of margin a kid's imperfect jump needs. DO NOT go
      // higher to buy more headroom — thin the tier instead.
      //
      // x and w are UNCHANGED from the first cut, which is deliberate: it keeps
      // every ~70px overlap, the two reversals, the growing widths, and the
      // rightmost edge (T6: 3160+380 = 3540 == bounds.right) exactly as approved.
      { x: 2410, y: 248, w: 300, h: 16 }, // T1  rise 72 from floor-3 (ends 2710)
      { x: 2640, y: 173, w: 280, h: 16 }, // T2  rise 75, overlaps T1 by 70 (ends 2920) — headroom over T1: 27
      { x: 2850, y: 99, w: 300, h: 16 }, // T3  rise 74, overlaps T2 by 70 (ends 3150) — headroom over T2: 26 — the turn-around runway: 190px of T3 sticks out right of T4
      { x: 2610, y: 24, w: 350, h: 16 }, // T4  rise 75, overlaps T3 by 110 (2850..2960) — headroom over T3: 27 — REVERSAL 1: hop up-LEFT off T3's runway
      { x: 2890, y: -50, w: 340, h: 16 }, // T5  rise 74, overlaps T4 by 70 (2890..2960) — headroom over T4: 26 — REVERSAL 2: walk LEFT along T4 for run-up, then hop up-RIGHT
      { x: 3160, y: -125, w: 380, h: 16 }, // T6  rise 75, overlaps T5 by 70 (3160..3230) — headroom over T5: 27 — the SUMMIT BALCONY (380px wide; ends 3540 == bounds.right)
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
      { x: 2480, y: 192 }, // T1 (y248-56)  — walk-through, on the run-up to T2
      { x: 2760, y: 83 }, // T2 (y173-90)  — HOP; clear of T4's underside (y40) with 43px to spare
      { x: 3040, y: 43 }, // T3 (y99-56)   — walk-through, out on the turn-around runway right of T4's edge (2960): rewards running to the turn
      { x: 2700, y: -66 }, // T4 (y24-90)   — HOP, on the leftward leg, clear of T5's overhang (starts 2890)
      { x: 3000, y: -106 }, // T5 (y-50-56)  — walk-through, clear of T6's overhang (starts 3160)
      { x: 3400, y: -181 }, // T6 (y-125-56) — walk-through on the summit balcony, near the goal
    ],

    spikes: [
      { x: 850, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-1 (560..1040)
      { x: 1450, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-2 (1160..1680)
      { x: 2200, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-3 (1800..2360)
    ],

    // Goal sits atop T6, the summit balcony, 80px before its right edge (3540).
    goal: { x: 3460, y: -125 - CONFIG.GOAL_SIZE },

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
      { x: 2430, y: 248 - 48 }, // T1 landing (left end)
      { x: 2660, y: 173 - 48 }, // T2 landing (left end)
      { x: 2870, y: 99 - 48 }, // T3 landing (left end)
      { x: 2920, y: 24 - 48 }, // T4 landing — RIGHT end: this hop arrives travelling LEFT
      { x: 2910, y: -50 - 48 }, // T5 landing (left end; the up-right hop off T4)
      { x: 3190, y: -125 - 48 }, // T6 landing — the summit balcony
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
      { x: 2650, y: -46 }, // ~70px above T4's new surface (y:24)
    ],
  },

  mechanics: [],
  biome: "castle", // Phase 32 (ART-02/ART-03) — level 8 of 8, Castlevania arc calm->harsh (levels 1-2 swamp, 3-4 town, 5-6 cemetery, 7-8 castle)
  parallax: null,
};
