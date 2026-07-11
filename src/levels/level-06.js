// src/levels/level-06.js — "The Cracked Vault" descriptor.
//
// Second of the Phase 25 four-level ramp: "one step harder" than level-05, table
// pool [4,5,6,7]. Still single-screen-tall (no verticality), but introduces mixed
// mechanic variety beyond level-05's door+mathGate — an enemy encounter, mirroring
// level-01's mechanic mix. Carries exactly one hidden secretAlcove (LVL-06), a
// short off-path detour above the gap-3 bridge.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320

export const LEVEL_06 = {
  id: "level-06",
  displayName: "The Cracked Vault",
  allowedTables: [4, 5, 6, 7],

  bounds: { left: 0, right: 3380, top: 0, bottom: 360 },

  geometry: {
    floors: [
      { x: 0, w: 480 },
      { x: 640, w: 560 }, // gap 480..640 (160px)
      { x: 1320, w: 600 }, // gap 1200..1320 (120px)
      { x: 2040, w: 620 }, // gap 1920..2040 (120px)
      { x: 2780, w: 600 }, // gap 2660..2780 (120px), final run to the goal, ends 3380
    ],

    platforms: [
      { x: 520, y: 255, w: 128, h: 24 }, // bridges gap 480..640 (rise 65px)
      { x: 840, y: 190, w: 112, h: 24 }, // Plan 25-07: raised 250->190 (underside clearance 46px->106px) — its old underside sat only 46px above floor level, a ceiling-bonk hazard for the spike@900 hop launched at x:848 (inside this platform's 840..952 span), discovered by the interactive audit. Still purely a height-variety hop on floor-1 (not gap-bridging); raising it is cosmetic-only.
      { x: 1240, y: 250, w: 96, h: 24 }, // bridges gap 1200..1320 (rise 70px)
      { x: 1960, y: 250, w: 96, h: 24 }, // bridges gap 1920..2040 (rise 70px)
      { x: 2700, y: 255, w: 112, h: 24 }, // bridges gap 2660..2780 (rise 65px)
    ],

    coins: [
      { x: 120, y: 264 },
      { x: 260, y: 184 },
      { x: 440, y: 128 },
      { x: 700, y: 264 },
      { x: 860, y: 176 },
      { x: 1080, y: 264 },
      { x: 1360, y: 264 },
      { x: 1560, y: 176 },
      { x: 1780, y: 264 },
      { x: 2080, y: 264 },
      { x: 2260, y: 176 },
      { x: 2480, y: 264 },
      { x: 2820, y: 264 },
      { x: 3000, y: 184 },
      { x: 3200, y: 264 },
    ],

    spikes: [
      { x: 900, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-1 (640..1200), after the door
      { x: 1700, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-2 (1320..1920), after the mathGate
      { x: 2450, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // floor-3 (2040..2660), after the enemy
    ],

    goal: { x: 3300, y: FLOOR_Y - CONFIG.GOAL_SIZE }, // floor-4 ends 3380, 80px buffer

    // One near-start checkpoint + one 64-80px before EVERY hazard/mechanic.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start
      { x: 130, y: FLOOR_Y - 48 }, // before the mid-run approach (lead 70; no mechanic sits at this exact x any more)
      { x: 650, y: FLOOR_Y - 48 }, // before door@720 (lead 70)
      { x: 830, y: FLOOR_Y - 48 }, // before spike@900 (lead 70)
      { x: 1330, y: FLOOR_Y - 48 }, // before mathGate@1400 (lead 70)
      { x: 1630, y: FLOOR_Y - 48 }, // before spike@1700 (lead 70)
      { x: 2080, y: FLOOR_Y - 48 }, // before enemy@2150 (lead 70)
      { x: 2380, y: FLOOR_Y - 48 }, // before spike@2450 (lead 70)
    ],

    doors: [
      { x: 720, y: FLOOR_Y - CONFIG.DOOR.H }, // floor-1 (640..1200)
    ],

    mathGates: [
      { x: 1400, y: FLOOR_Y - CONFIG.MATH_GATE.H }, // floor-2 (1320..1920)
    ],

    enemies: [
      { x: 2150, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 1 }, // enemy-2 (barnacle); floor-3 (2040..2660)
    ],

    // Secret XP alcove (LVL-06) — a short off-path detour: an extra 70px hop UP
    // from the gap-3 bridging platform (x:1960, y:250) instead of continuing
    // straight across to floor-3. Not signposted, not gating.
    secretAlcove: [
      { x: 2000, y: 180 },
    ],
  },

  mechanics: [],
  biome: "cemetery", // Phase 32 (ART-02/ART-03) — level 6 of 8, Castlevania arc calm->harsh (levels 1-2 swamp, 3-4 town, 5-6 cemetery, 7-8 castle)
  parallax: null,
};
