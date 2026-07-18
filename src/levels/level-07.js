// src/levels/level-07.js — "The Ramparts" descriptor.
//
// ===========================================================================
// ALL-8 DISTINCTNESS + VARIETY REDO (Phase 34.6, docs/LEVEL-DESIGN.md §8.5 rules
// 7-8). Superseded the prior "Iron Gatehouse" monotonic staircase — which read too
// close to level-08's castle climb and was a single-file up-staircase. Replaced with
// a genuinely distinct MACRO-SHAPE per the approved 2026-07-16 concept table.
// ===========================================================================
//
// WHAT LEVEL-07 IS — THE RAMPARTS (its distinct signature): a LATERAL, ELEVATED
// wall-walk. After a short low-wall intro the player CLIMBS UP onto the battlement and
// spends most of the level TRAVERSING it — WIDE parapet segments with merlon up-hops and
// a MURDER-HOLE gap at altitude — crosses a DRAWBRIDGE, takes a tower-side FORK, then
// climbs a final TOWER to the goal at its top. Unlike every other level it is spent
// mostly ON RAISED PLATFORMS, not on the floor: the wall IS the path. Distinct from
// 08's tall single climb, from 01's water archipelago, from 03/05's descent/valley.
//
// The three §8.5 beats:
//   * VERTICALITY (rule 1): the opening CLIMB up onto the rampart (CU1->WALK1), the merlon
//     hops, and the final TOWER climb (TW1->TW2->TW3 to the y:122 top) — plus the DD
//     descent to the courtyard. Range ~200px. Climbs AND descents.
//   * ROUTE CHOICE (rule 2): the tower-side FORK — a low wall route (FL1->FL2) vs a higher
//     parapet slab (FH, bonus coins) rejoining at FL2. No key (odd archetype).
//   * ACTION & VARIETY (rule 3): merlon hops, a murder-hole gap, a drawbridge, the fork,
//     the tower — the beat keeps changing along the wall (anti-transport, rule 8).
//
// L7 ramp (§8): castle — gaps up to ~150, rises kept at a comfortable 62-66 (this is the
// CALMER castle intro; the tight 72-75 overlapping climbs are level-08's). Tiers are
// laterally offset — no ceiling over a walk; open-air and legible (rule 6). WIDE wall-walk
// segments avoid the fragile short flat hop (spanMax must clear the 162px flat reach).
//
// SPAWN-ON-WALL: the spawn is a normal low FLOOR run (W1) at FLOOR_Y — the door sits on
// it (over-hole rule). The rampart platforms rise from there.
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_07 = {
  id: "level-07",
  displayName: "The Ramparts",
  allowedTables: [6, 7, 8],

  // Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds
  // trap). right = 5900 (goal 5580 on the tower-top ledge TT which ends 5800; buffer).
  // top = 0 — the whole wall-walk stays within the 360px screen (highest point y:122).
  bounds: { left: 0, right: 5900, top: 0, bottom: 360 },

  geometry: {
    // FEW floor runs — this is a wall-WALK: most of the path rides WIDE raised parapet
    // platforms. The floors are the low intro wall (W1), a mid courtyard (W2), the enemy
    // wall (W3), and the fork base (W4). The door/enemy sit on these solid floors.
    floors: [
      { x: 0, w: 620 }, //    W1 — low intro wall; the DOOR (@380); the rampart climb rises from here
      { x: 2600, w: 420 }, // W2 — mid courtyard (the elevated walk descends here); spike; drawbridge after
      { x: 3500, w: 420 }, // W3 — the enemy wall (@3700) + spike; reached over the drawbridge
      { x: 4420, w: 480 }, // W4 — fork base + spike; the final tower rises from here
    ],

    // Platforms — ALL h:16 (WYSIWYG, §3.1), y OFF the 16px grid (§3.4). The rampart top
    // sits at y:188 in WIDE segments (WALK1..WALK4); merlons pop up to y:124; the final
    // tower climbs to y:122. Tiers are laterally offset (no ceiling over a walk, §8.5
    // rule 6). UP hops are proven rise 62-66 with ~25-30px near-edge gaps; the murder-hole
    // flat hop is 130px (well under the 162 flat reach); descents are free.
    platforms: [
      // --- CLIMB UP onto the rampart (off W1) ---
      { x: 650, y: 254, w: 110, h: 16 }, // CU1 [0] rise 66 from W1 (gap 30); alcove hop above

      // --- THE ELEVATED WALL-WALK: wide parapet segments + merlon hops + a murder-hole ---
      { x: 790, y: 188, w: 300, h: 16 }, //  WALK1 [1] rise 66 from CU1 (gap 30); the wall-walk begins
      { x: 1120, y: 124, w: 100, h: 16 }, // MER1  [2] MERLON — rise 64 from WALK1 (gap 30); bonus coin
      { x: 1250, y: 188, w: 300, h: 16 }, // WALK2 [3] drop 64 from MER1 (gap 30); wide walk
      { x: 1680, y: 188, w: 300, h: 16 }, // WALK3 [4] MURDER-HOLE flat hop (gap 130); wide walk
      { x: 2010, y: 124, w: 100, h: 16 }, // MER2  [5] MERLON — rise 64 from WALK3 (gap 30); bonus coin
      { x: 2140, y: 188, w: 300, h: 16 }, // WALK4 [6] drop 64 from MER2 (gap 30); wide walk
      { x: 2470, y: 254, w: 110, h: 16 }, // DD1   [7] drop 66 from WALK4 (gap 30); step down, then drop to W2

      // --- THE DRAWBRIDGE over W2..W3 (two planks) ---
      { x: 3050, y: 254, w: 120, h: 16 }, // DB1 [8] rise 66 from W2 (gap 30)
      { x: 3230, y: 254, w: 140, h: 16 }, // DB2 [9] flat plank hop (gap 60, spanMax 200), then drop to W3

      // --- THE TOWER-SIDE FORK over W3..W4 (rejoins at FL2) ---
      { x: 3950, y: 254, w: 110, h: 16 }, // FL1 [10] LOW wall — rise 66 from W3 (gap 30)
      { x: 4190, y: 254, w: 120, h: 16 }, // FL2 [11] LOW wall — flat hop (gap 130), then drop to W4
      { x: 4085, y: 188, w: 90, h: 16 }, //  FH  [12] HIGH parapet slab between FL1/FL2 — rise 66 from FL1 (gap 25); bonus coins

      // --- THE FINAL TOWER off W4 (climb to the goal at the top) ---
      { x: 4930, y: 254, w: 110, h: 16 }, // TW1 [13] rise 66 from W4 (gap 30)
      { x: 5070, y: 188, w: 110, h: 16 }, // TW2 [14] rise 66 from TW1 (gap 30)
      { x: 5210, y: 122, w: 110, h: 16 }, // TW3 [15] rise 66 from TW2 (gap 30)
      { x: 5350, y: 122, w: 450, h: 16 }, // TT  [16] the TOWER TOP — near-flat from TW3 (gap 30); the GOAL sits here
    ],

    // ~28 coins — fly-through boxes at walk height (surfaceY-56). Bonus coins ride the
    // merlons (MER1/MER2) and the fork's high slab (FH); TT carries the last coins.
    coins: [
      { x: 150, y: 264 }, // W1 (before the door)
      { x: 500, y: 264 }, // W1 (after the door)
      { x: 705, y: 198 }, // CU1
      { x: 900, y: 132 }, // WALK1
      { x: 1170, y: 68 }, // MER1 (merlon — bonus)
      { x: 1400, y: 132 }, // WALK2
      { x: 1830, y: 132 }, // WALK3
      { x: 2060, y: 68 }, // MER2 (merlon — bonus)
      { x: 2290, y: 132 }, // WALK4
      { x: 2525, y: 198 }, // DD1
      { x: 2700, y: 264 }, // W2
      { x: 2900, y: 264 }, // W2
      { x: 3110, y: 198 }, // DB1 (drawbridge)
      { x: 3300, y: 198 }, // DB2 (drawbridge)
      { x: 3560, y: 264 }, // W3 (before the enemy)
      { x: 3850, y: 264 }, // W3 (past the enemy)
      { x: 4005, y: 198 }, // FL1 (low wall)
      { x: 4245, y: 198 }, // FL2 (low wall)
      { x: 4110, y: 132 }, // FH (high slab — bonus 1)
      { x: 4150, y: 132 }, // FH (high slab — bonus 2)
      { x: 4520, y: 264 }, // W4
      { x: 4760, y: 264 }, // W4
      { x: 4985, y: 198 }, // TW1 (tower)
      { x: 5125, y: 132 }, // TW2 (tower)
      { x: 5265, y: 66 }, //  TW3 (tower crest)
      { x: 5450, y: 66 }, //  TT (tower top)
      { x: 5650, y: 66 }, //  TT (by the goal)
    ],

    // 3 floor spikes on clear wall runs, clear of every platform's x-span (no
    // ceiling-bonk, §3.5). Sparing — most of the danger is the murder-hole gap at
    // altitude (falls respawn a hop away). NONE on the final tower.
    spikes: [
      { x: 2800, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // W2 (2600..3020) — courtyard
      { x: 3800, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // W3 (3500..3920) — past enemy@3700
      { x: 4650, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // W4 (4420..4900)
    ],

    // Goal on the high TOWER TOP TT (the wall-walk's far tower) — the tower climb is
    // mandatory to reach it. TT spans 5350..5800; goal at 5580.
    goal: { x: 5580, y: 122 - CONFIG.GOAL_SIZE },

    // Checkpoints — near spawn, on the rampart climb, on the wall-walk, before EVERY
    // spike, at each courtyard/wall landing, before the enemy, on each tower tier, and on
    // the tower top. Falls off the parapet respawn a hop away (§8.5 rule 4).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // W1 — start, before the door@380
      { x: 680, y: 254 - 48 }, // CU1 — rampart climb
      { x: 900, y: 188 - 48 }, // WALK1 — onto the wall-walk
      { x: 1400, y: 188 - 48 }, // WALK2 — mid wall-walk
      { x: 2200, y: 188 - 48 }, // WALK4 — mid wall-walk
      { x: 2620, y: FLOOR_Y - 48 }, // W2 — courtyard
      { x: 2720, y: FLOOR_Y - 48 }, // before spike@2800 (W2)
      { x: 3520, y: FLOOR_Y - 48 }, // W3 — before the enemy@3700
      { x: 3720, y: FLOOR_Y - 48 }, // before spike@3800 (W3, past the enemy)
      { x: 4440, y: FLOOR_Y - 48 }, // W4 — before spike@4650
      { x: 4960, y: 254 - 48 }, // TW1 — tower
      { x: 5100, y: 188 - 48 }, // TW2 — tower
      { x: 5240, y: 122 - 48 }, // TW3 — tower crest
      { x: 5380, y: 122 - 48 }, // TT — tower top, before the goal
    ],

    // Exactly ONE door — on solid W1 (left margin 380, right margin 240).
    doors: [{ x: 380, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy + end gate.
    mathGates: [],

    // Exactly ONE enemy — on solid W3 (left margin 200), reached over the drawbridge so
    // the driven harness traverses the whole wall-walk + drawbridge to reach it.
    enemies: [{ x: 3700, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // Exactly ONE secret alcove — ~70px above CU1's surface (y:254). Off the required
    // path, never signposted. NO key/lock (odd archetype).
    secretAlcove: [{ x: 690, y: 184 }],
  },

  mechanics: [],
  biome: "castle", // level 7 of 8 — Castlevania arc calm->harsh (levels 7-8 castle)
  parallax: null,

  // --- Decorative props (ART-06/ART-07; Phase 35 — VISUAL-ONLY, geometry byte-frozen) ---
  // The RESTRAINED castle vocabulary (plan-03-approved density) from the plan-05 bake:
  //   prop-castle-column 114x190 (tall gothic pillar), prop-castle-arch 32x64 (pointed
  //   window), prop-castle-candles 31x21 (wall sconce), prop-castle-candle-stand 15x25.
  // level-07 is a HORIZONTAL wall-walk (bounds.top 0) — so the "back" props are anchored
  // as intentional wall/battlement dressing along the lateral run (base resting on the
  // floor/walk line, NOT floating high in a shaft). On-surface accents sit only on the
  // WIDE low floors (W1/W2/W4) and the broad tower top, at clear margins — never on the
  // narrow WALK/merlon/drawbridge/fork/tower LANE. Every prop is clear of the DOOR@380,
  // ENEMY@3700, the three spikes (2800/3800/4650), the coins, the GOAL@5580, and the
  // secret alcove@690. On-surface y = surfaceY - spriteHeight.
  props: [
    // Background gothic pillars + arch windows (layer "back", z -8 — behind every
    // traversal surface) as battlement wall dressing along the horizontal run. Columns
    // rest on the floor line (y = 320 - 190 = 130); arches are battlement windows at
    // walk height. All stay inside the 0..360 screen band (bounds.top 0 — no tall shaft).
    { sprite: "prop-castle-column", x: 60, y: 130, layer: "back" }, //   frames the spawn wall (left of the door@380)
    { sprite: "prop-castle-arch", x: 1580, y: 124, layer: "back" }, //   battlement window in the WALK2/WALK3 gap depth
    { sprite: "prop-castle-column", x: 4780, y: 130, layer: "back" }, //  frames the base of the final TOWER climb (behind TW1@4930)
    { sprite: "prop-castle-arch", x: 5420, y: 58, layer: "back" }, //     far window crowning the keep, left of the goal@5580

    // On-surface castle light-sources (layer "surface", z -3) on the WIDE low floors and
    // the broad tower top, at clear margins — restrained, off the wall-walk lane.
    { sprite: "prop-castle-candle-stand", x: 250, y: 295, layer: "surface" }, // W1, between coin@150 and the door@380
    { sprite: "prop-castle-candles", x: 2960, y: 299, layer: "surface" }, //     W2 right end, past spike@2800 + coin@2900
    { sprite: "prop-castle-candle-stand", x: 4860, y: 295, layer: "surface" }, // W4 right end, past spike@4650 + coin@4760
    { sprite: "prop-castle-candles", x: 5720, y: 101, layer: "surface" }, //     TT tower top, right of the goal@5580 (throne accent)
  ],
};
