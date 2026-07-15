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
  allowedTables: [2, 3, 4, 5, 6, 7],

  // Camera clamp scaled to the longer level; top/bottom match the 360px screen.
  // Phase 24: bumped 2800 -> 4280 to cover the +1480px extension (goal 4200 + GOAL_SIZE + 64px buffer).
  bounds: { left: 0, right: 4280, top: 0, bottom: 360 },

  geometry: {
    floors: [
      { x: 0, w: 520 },
      { x: 700, w: 560 },
      { x: 1420, w: 600 },
      { x: 2180, w: 620 },
      { x: 2960, w: 560 }, // Phase 24 extension run 1 (after gap 2800..2960)
      { x: 3680, w: 600 }, // Phase 24 extension run 2 (after gap 3520..3680), final run to the new goal
    ],

    platforms: [
      { x: 280, y: 240, w: 160, h: 24 },
      { x: 500, y: 192, w: 128, h: 24 },
      { x: 640, y: 232, w: 128, h: 24 },
      { x: 1200, y: 232, w: 128, h: 24 },
      { x: 1360, y: 192, w: 96, h: 24 },
      { x: 2020, y: 232, w: 128, h: 24 },
      { x: 2360, y: 240, w: 128, h: 24 },
      { x: 2800, y: 250, w: 128, h: 24 }, // Phase 24: bridges the new 2800..2960 gap, touches floor-3's end at 2800
      { x: 3520, y: 250, w: 112, h: 24 }, // Phase 24: bridges the new 3520..3680 gap, touches the new floor-4's end at 3520
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
      { x: 2840, y: 264 }, // Phase 24 extension coin
      { x: 3040, y: 184 }, // Phase 24 extension coin
      { x: 3260, y: 136 }, // Phase 24 extension coin
      { x: 3560, y: 264 }, // Phase 24 extension coin
      { x: 3900, y: 176 }, // Phase 24 extension coin
    ],

    spikes: [
      { x: 920, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1180, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 1760, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 2560, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
      { x: 3200, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // Phase 24 extension hazard, on the new floor-4 run
    ],

    goal: { x: 4200, y: FLOOR_Y - CONFIG.GOAL_SIZE }, // Phase 24: moved from 2720 (80px buffer before floor-5's end at 4280)

    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 },
      { x: 340, y: FLOOR_Y - 48 },
      { x: 840, y: FLOOR_Y - 48 },
      { x: 1020, y: FLOOR_Y - 48 },
      { x: 1120, y: FLOOR_Y - 48 },
      { x: 1460, y: FLOOR_Y - 48 },
      { x: 1680, y: FLOOR_Y - 48 },
      { x: 2480, y: FLOOR_Y - 48 },
      { x: 3120, y: FLOOR_Y - 48 }, // Phase 24: before the new spike (x=3200) — 80px lead
      { x: 3680, y: FLOOR_Y - 48 }, // Phase 24: start of the final run (historical: led the since-removed x:3760 mathGate)
    ],

    doors: [
      { x: 1540, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Phase 34.5 (KEY-01/KEY-02) — throwaway in-engine proof vehicle: ONE key-lock
    // pair. Key sits spawn-side on floor run {x:700,w:560} (700..1260), well before
    // the door at x:1540, so the sequence reads get-key -> door -> enemy -> locked
    // exit-corridor -> end math gate. The lock sits on the goal's floor run
    // {x:3680,w:600} (3680..4280), AFTER the enemy (x:1860) and door (x:1540), so it
    // never obstructs those earlier math encounters, and BEFORE the goal (x:4200) so
    // the end math-gate's go("select") teardown never skips evaluating it (CONTEXT
    // ordering: locked exit-corridor -> end math gate -> LEVEL CLEAR). Phase 34.6
    // rebuilds this level's geometry from scratch; this pair is acknowledged
    // throwaway, kept solely to prove the mechanic end-to-end in-engine.
    //
    // Rule-1 fix (found running node scripts/browser-boot.mjs for real, not
    // guessed from the static model): the RESEARCH-suggested x:760 sits inside the
    // jump arc that clears the 520..700 gap onto this run — a driven player jumping
    // that gap lands past x:790, sailing OVER a ground-level x:760 trigger without
    // ever touching down on it, so the key was never collected during a genuine
    // drive-through even though the static reachability model (which is arc/
    // landing-blind by design) still called it reachable. x:900 sits comfortably
    // past every observed landing spot and well before the next takeoff (~x:1200,
    // for the 1260..1420 gap), squarely in the walked stretch between them —
    // confirmed via a direct driveToXPlanned(door.x) drive that the key is now
    // collected incidentally before the door ever triggers.
    // WR-02: y is FLOOR_Y - 32, NOT CONFIG.KEY.H (20) — 32 is the player's own
    // collider height (src/player.js's locked 16x32 AABB, duplicated as
    // PLAYER_H in scripts/lib/reachability.mjs), chosen so the key's trigger
    // box sits flush with a standing player's own top edge rather than the
    // key sprite's smaller footprint.
    keys: [{ x: 900, y: FLOOR_Y - 32 }],
    locks: [{ x: 3960, y: FLOOR_Y - CONFIG.LOCK.H }],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy +
    // the end-of-level goal gate (user decision 2026-07-12; removed gates
    // x:420/1100/3760 are in git history).
    mathGates: [],

    enemies: [
      { x: 1860, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }, // enemy-1 (saw); floor-2 (1420..2020), 320px past the door at x:1540, 128px runway to the run's end
    ],

    // Phase 25 retrofit (LVL-06) — purely additive, does not touch any existing
    // floor/platform/checkpoint geometry. A short extra hop UP from the early
    // platform (x:280, y:240, w:160) — not signposted, not gating.
    secretAlcove: [
      { x: 320, y: 170 },
    ],
  },

  mechanics: [],
  biome: "swamp", // Phase 32 (ART-02/ART-03) — level 2 of 8, Castlevania arc calm->harsh (levels 1-2 swamp, 3-4 town, 5-6 cemetery, 7-8 castle)
  parallax: null,
};
