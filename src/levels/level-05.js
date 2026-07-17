// src/levels/level-05.js — "Sunken Vault" descriptor.
//
// ===========================================================================
// ALL-8 DISTINCTNESS + VARIETY REDO (Phase 34.6, docs/LEVEL-DESIGN.md §8.5 rules
// 7-8). Superseded the prior "Sunken Yard" arch — which cloned the arch shape of
// levels 01/03 (the user's full test-play flagged 01≈03≈05 as near-identical).
// ===========================================================================
//
// WHAT LEVEL-05 IS — SUNKEN VAULT (its distinct signature): a DOWN–ACROSS–UP V-VALLEY.
// The player SPAWNS HIGH on a graveyard entrance ledge (EL0 y:150), DESCENDS a run of
// drop-ledges INTO a crypt basin (the low catacomb floor at y:320), CROSSES the long
// pillared catacomb (coffin-lid pillars + a spike cluster + the door/enemy), then CLIMBS
// OUT the far side up a rising stair to a high exit ledge where the GOAL sits. The whole
// level is a valley: down, a long across, up. Distinct from all seven — the only V.
//
// SPAWN-ON-LEDGE: the leftmost node is EL0, a PLATFORM at y:150 spanning x:0 — no floor
// under the spawn x (SPAWN_X 64), so the reachability spawn node is EL0 and the player
// (spawned 64,64) falls onto the entrance ledge. The math BARRIERS (door/enemy) sit on
// the basin FLOOR (over-hole rule — a barrier stands on solid floor), never on a ledge.
//
// The three §8.5 beats:
//   * VERTICALITY (rule 1): the ENTRY DESCENT (EL0->ED1->ED2 into the basin, ~170px down)
//     AND the OUT-CLIMB (OC1->OC2->OC3 up to the exit ledge, ~200px up) — a genuine
//     descent and a genuine climb, the two arms of the V.
//   * ROUTE CHOICE (rule 2): the CRYPT FORK mid-basin — a low pillar route (PLA->PLB) vs
//     a higher slab route (PHB, bonus coins) that rejoins at PLB. No key (odd archetype).
//   * ACTION & VARIETY (rule 3): the catacomb crossing is not a flat hall — coffin-lid
//     pillar hops of varied height, a spike cluster to time, the door/enemy woven in, and
//     the fork keep the beat changing (anti-transport, rule 8).
//
// L5 ramp (§8): cemetery gaps 140-160, mixed 58-70 rises; a couple overlapping tiers are
// permitted (ceilings appear at L3-6) but this level keeps tiers laterally offset — no
// tier forms a real ceiling; open-air and legible (rule 6). Calm = FORGIVING: gentle
// rises well inside the envelope, wide ledges, dense checkpoints.
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_05 = {
  id: "level-05",
  displayName: "Sunken Vault",
  allowedTables: [2, 3, 4, 5],

  // Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds
  // trap). right = 6420 (goal 6180 + buffer; XL exit ledge ends 6300... F-none, XL is a
  // platform, so right is set past the goal). top = 0 — the vault stays within the 360px
  // screen (highest point is the exit ledge y:118 and entrance ledge y:150).
  bounds: { left: 0, right: 6420, top: 0, bottom: 360 },

  geometry: {
    // The crypt BASIN floor runs (merged colliders) sit at FLOOR_Y — the LOW arm of the
    // V. The high entrance/exit ledges are PLATFORMS (below). Basin gaps are bridged by
    // coffin-lid pillar platforms; the door/enemy sit on solid basin floor.
    floors: [
      { x: 830, w: 520 }, //  F1 — basin entrance (entry descent lands here); the DOOR (@1080)
      { x: 1600, w: 500 }, // F2 — catacomb; the ENEMY (@1850) + spike cluster
      { x: 2530, w: 500 }, // F3 — catacomb (fork rejoin); spike
      { x: 3280, w: 500 }, // F4 — catacomb; spike
      { x: 4030, w: 500 }, // F5 — catacomb; spike
      { x: 4780, w: 500 }, // F6 — basin far end (the out-climb launches here)
    ],

    // Platforms — ALL h:16 (WYSIWYG, §3.1), y OFF the 16px grid (§3.4). ENTRY drop-ledges
    // and the OUT-climb stair frame the V; coffin-lid PILLARS (y:258) step across the
    // basin. No upper tier sits as a ceiling over a lower walk (laterally offset, §8.5
    // rule 6). UP hops are proven rise 58-70 with ~25-30px near-edge gaps; descents free.
    platforms: [
      // --- THE ENTRY DESCENT (spawn on EL0; step DOWN into the basin) ---
      { x: 0, y: 150, w: 420, h: 16 }, //  EL0 [0] SPAWN entrance ledge (contains x:64), y:150 — the high start; alcove above
      { x: 470, y: 216, w: 120, h: 16 }, // ED1 [1] drop 66 from EL0 (gap 50)
      { x: 650, y: 282, w: 120, h: 16 }, // ED2 [2] drop 66 from ED1 (gap 60); then drop onto F1

      // --- COFFIN-LID PILLAR over F1..F2 ---
      { x: 1380, y: 258, w: 120, h: 16 }, // PL1 [3] rise 62 from F1 (gap 30), then drop to F2

      // --- THE CRYPT FORK over F2..F3 (rejoins at PLB) ---
      { x: 2130, y: 258, w: 110, h: 16 }, // PLA [4] LOW pillar — rise 62 from F2 (gap 30)
      { x: 2360, y: 258, w: 120, h: 16 }, // PLB [5] LOW pillar — flat hop (gap 120), then drop to F3
      { x: 2250, y: 190, w: 90, h: 16 }, //  PHB [6] HIGH slab between PLA/PLB — rise 68 from PLA (gap 10); bonus coins

      // --- COFFIN-LID PILLAR over F3..F4 ---
      { x: 3060, y: 258, w: 120, h: 16 }, // PL3 [7] rise 62 from F3 (gap 30), then drop to F4

      // --- A COFFIN STEPPING RUN over F4..F5 (three low lids — a set-piece) ---
      { x: 3810, y: 258, w: 110, h: 16 }, // PS1 [8]  rise 62 from F4 (gap 30)
      { x: 3980, y: 258, w: 120, h: 16 }, // PS2 [9]  flat hop (gap 60), then drop to F5

      // --- COFFIN-LID PILLAR over F5..F6 ---
      { x: 4560, y: 258, w: 120, h: 16 }, // PL5 [10] rise 62 from F5 (gap 30), then drop to F6

      // --- THE OUT-CLIMB: a rising stair up to the exit ledge (the far arm of the V) ---
      { x: 5310, y: 254, w: 120, h: 16 }, // OC1 [11] rise 66 from F6 (gap 30)
      { x: 5460, y: 188, w: 120, h: 16 }, // OC2 [12] rise 66 from OC1 (gap 30)
      { x: 5610, y: 122, w: 120, h: 16 }, // OC3 [13] rise 66 from OC2 (gap 30)
      { x: 5760, y: 118, w: 460, h: 16 }, // XL  [14] the EXIT LEDGE — near-flat from OC3 (gap 30); the GOAL sits here
    ],

    // ~33 coins — fly-through boxes at walk height (surfaceY-56). The bonus cluster rides
    // the high fork slab (PHB); the exit ledge XL carries the last coins by the goal.
    coins: [
      { x: 120, y: 94 }, //  EL0 (entrance ledge; y:150-56)
      { x: 330, y: 94 }, //  EL0
      { x: 530, y: 160 }, // ED1
      { x: 710, y: 226 }, // ED2
      { x: 920, y: 264 }, // F1 (before the door)
      { x: 1200, y: 264 }, // F1 (after the door)
      { x: 1440, y: 202 }, // PL1 (coffin-lid)
      { x: 1700, y: 264 }, // F2 (before the enemy)
      { x: 2000, y: 264 }, // F2 (past the enemy)
      { x: 2185, y: 202 }, // PLA (low pillar)
      { x: 2420, y: 202 }, // PLB (low pillar)
      { x: 2295, y: 134 }, // PHB (high slab — bonus 1)
      { x: 2330, y: 134 }, // PHB (high slab — bonus 2)
      { x: 2650, y: 264 }, // F3 (before spike)
      { x: 2900, y: 264 }, // F3 (past spike)
      { x: 3120, y: 202 }, // PL3
      { x: 3400, y: 264 }, // F4
      { x: 3865, y: 202 }, // PS1 (stepping run)
      { x: 4040, y: 202 }, // PS2 (stepping run)
      { x: 4150, y: 264 }, // F5
      { x: 4400, y: 264 }, // F5
      { x: 4620, y: 202 }, // PL5
      { x: 4900, y: 264 }, // F6
      { x: 5150, y: 264 }, // F6 (out-climb approach)
      { x: 5370, y: 198 }, // OC1
      { x: 5520, y: 132 }, // OC2
      { x: 5670, y: 66 }, //  OC3 (climb-out crest)
      { x: 5850, y: 62 }, //  XL (exit ledge)
      { x: 6050, y: 62 }, //  XL (by the goal)
    ],

    // 4 floor spikes on clear basin runs, clear of every pillar's x-span (no ceiling-bonk,
    // §3.5). NONE on the entry descent or the out-climb.
    spikes: [
      { x: 1980, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (1600..2100) — past enemy@1850
      { x: 2760, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2530..3030)
      { x: 3520, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F4 (3280..3780)
      { x: 4270, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F5 (4030..4530)
    ],

    // Goal on the high EXIT LEDGE XL (the top of the V's far arm) — the climb-out is
    // mandatory to reach it. XL spans 5760..6220; goal at 6180.
    goal: { x: 6180, y: 118 - CONFIG.GOAL_SIZE },

    // Checkpoints — near spawn on the entrance ledge, on each entry drop-ledge, before
    // EVERY spike, on each out-climb tier, at each basin landing, before the enemy, and
    // on the exit ledge. y matches the surface.
    checkpoints: [
      { x: 96, y: 150 - 48 }, //  EL0 — spawn entrance ledge
      { x: 520, y: 216 - 48 }, // ED1
      { x: 700, y: 282 - 48 }, // ED2
      { x: 860, y: FLOOR_Y - 48 }, // F1 — before the door@1080
      { x: 1650, y: FLOOR_Y - 48 }, // F2 — before the enemy@1850
      { x: 1900, y: FLOOR_Y - 48 }, // before spike@1980 (F2)
      { x: 2680, y: FLOOR_Y - 48 }, // before spike@2760 (F3)
      { x: 3440, y: FLOOR_Y - 48 }, // before spike@3520 (F4)
      { x: 4190, y: FLOOR_Y - 48 }, // before spike@4270 (F5)
      { x: 4800, y: FLOOR_Y - 48 }, // F6 — the out-climb approach
      { x: 5340, y: 254 - 48 }, // OC1
      { x: 5490, y: 188 - 48 }, // OC2
      { x: 5640, y: 122 - 48 }, // OC3
      { x: 5790, y: 118 - 48 }, // XL — the exit ledge, before the goal
    ],

    // Exactly ONE door — on solid basin F1 (left margin 250, right margin 238).
    doors: [{ x: 1080, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy + end gate.
    mathGates: [],

    // Exactly ONE enemy — on solid basin F2 (left margin 250), so the driven harness
    // crosses the catacomb to reach it.
    enemies: [{ x: 1850, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // Exactly ONE secret alcove — ~70px above EL0's surface (y:150). Off the required
    // path, never signposted. NO key/lock (odd archetype).
    secretAlcove: [{ x: 360, y: 80 }],
  },

  mechanics: [],
  biome: "cemetery", // level 5 of 8 — Castlevania arc calm->harsh (levels 5-6 cemetery)
  parallax: null,

  // --- Decorative props (ART-06/ART-07, Phase 35) — VISUAL-ONLY, top-level (NOT inside
  // geometry, so check-geometry-frozen never sees them). No colliders; sprite+pos+z only.
  // Both layers are NEGATIVE z (back -8, surface -3) so a prop can never occlude the
  // player/coins/terrain/mechanics (legibility-first, §8.5). Reuses the plan-02
  // trial-baked, plan-03-approved cemetery vocabulary (no new bake).
  //
  // This is the CALM cemetery intro — the DOWN–ACROSS–UP V-valley. Props dress the WIDE
  // catacomb BASIN floors (F1..F6 at FLOOR_Y 320) + background dead-corners, kept OFF the
  // entry descent (EL0/ED1/ED2), the crypt fork (PLA/PLB/PHB) + coffin-lid pillars, and
  // the OUT-CLIMB stair (OC1..OC3/XL). On-surface props use y = surfaceY - spriteHeight.
  // Every prop is clear of the DOOR@1080, ENEMY@1850, the four spikes (1980/2760/3520/
  // 4270), the coins, and the GOAL@6180. Uses the full RICH vocabulary (statue + all four
  // stone types + bush) sparsely. Sprite pixel sizes (from build_props): statue 63x75,
  // stone-1 21x37, stone-2 27x40, stone-3 27x33, stone-4 19x38, tree 166x117, bush 76x65.
  props: [
    // Background gnarled cemetery trees (layer "back") in the dead-corner backdrop — one
    // framing the high entrance ledge EL0 (base at the ledge line y:150 -> 150-117=33) and
    // one in the catacomb depth behind F2 (base y320 -> 320-117=203). z(-8) keeps them
    // behind every traversal surface.
    { sprite: "prop-cemetery-tree", x: 100, y: 33, layer: "back" }, //   frames the spawn entrance ledge
    { sprite: "prop-cemetery-tree", x: 1620, y: 203, layer: "back" }, // catacomb depth behind F2

    // On-surface cemetery dressing on the WIDE basin floors (y = 320 - height), clear of
    // every mechanic and OFF the descent/fork/pillars/out-climb. The full RICH vocabulary
    // (statue + all four stone types + bush) sparsely across F1..F6.
    { sprite: "prop-cemetery-statue", x: 845, y: 245, layer: "surface" }, // F1 left corner, before the door@1080
    { sprite: "prop-cemetery-stone-2", x: 1260, y: 280, layer: "surface" }, // F1, right of the door@1080
    { sprite: "prop-cemetery-stone-1", x: 1740, y: 283, layer: "surface" }, // F2, left of the enemy@1850
    { sprite: "prop-cemetery-stone-3", x: 2950, y: 287, layer: "surface" }, // F3, past spike@2760
    { sprite: "prop-cemetery-bush", x: 3300, y: 255, layer: "surface" }, //   F4 left corner, before spike@3520
    { sprite: "prop-cemetery-stone-4", x: 4060, y: 282, layer: "surface" }, // F5 left corner, before spike@4270
    { sprite: "prop-cemetery-bush", x: 4820, y: 255, layer: "surface" }, //   F6, before the out-climb
  ],
};
