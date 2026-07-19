// src/levels/level-01.js — "Bog Crossing" descriptor.
//
// ===========================================================================
// ALL-8 DISTINCTNESS + VARIETY REDO (Phase 34.6, docs/LEVEL-DESIGN.md §8.5 rules
// 7-8). Superseded the prior "First Ascent" arch — which cloned the arch shape of
// levels 03/05 (the user's full test-play flagged 01≈03≈05 as near-identical). This
// is a genuinely distinct MACRO-SHAPE per the approved 2026-07-16 concept table.
// ===========================================================================
//
// WHAT LEVEL-01 IS — BOG CROSSING (its distinct signature): a LATERAL, meandering
// ARCHIPELAGO. The path is a chain of small swamp islands (floor runs) linked by
// stepping-stone PLATFORMS (lily pads / a fallen log) over water gaps. There is no
// single tall arch (that is 02) and no descending staircase (that is 03) — the
// y-profile RIPPLES gently up and down across the whole level, never two hops alike.
//
// DIRECTION: lateral. MACRO-SHAPE: archipelago. Distinct from all seven others.
//
// The three §8.5 beats:
//   * VERTICALITY (rule 1): the FALLEN-LOG CLIMB (L1->L2->L3, rising to y:150 — a 170px
//     range from the floor line) then a LILY-PAD DROP (L4 -> F2). One genuine climb, one
//     deliberate descent, gentle 40-66px rises (the §8 L1 open-air 60-70 band).
//   * ROUTE CHOICE (rule 2): the visible LOW/HIGH FORK over the water before F3 — a safe
//     LOW pad chain (LR1->LR2) vs a HIGH arc (HR1->HR2, THREE bonus coins) that rejoins
//     at F3. No key (odd archetype). Nothing hidden.
//   * ACTION & VARIETY (rule 3): every water crossing differs — a lone lily pad, a rising
//     log, a forked arc, a low pad-chain, a final optional mound. The door/enemy are woven
//     into island stops. No two crossings identical (anti-transport, rule 8).
//
// MOST FORGIVING OF THE 8 (§8.5 rule 5): gentle 40-66px rises well inside the 88.331px
// envelope; wide pads (90-130px); ZERO overlapping platform pairs (the §8 L1-2 "no
// ceilings at all" rule — every pad sits over water or a floor, never over another pad);
// open-air and fully legible (rule 6); dense checkpoints (one per climb pad, one before
// every spike). Falls drop into the bog and respawn a hop away (rule 4) — real stakes,
// trivial cost, no game-over/timer.
//
// No `bounds` field: level-01 alone DERIVES its right edge from geometry (game.js), per
// the bounds-convention trap in LEVEL-DESIGN.md §7. Do NOT add one.
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_01 = {
  id: "level-01",
  displayName: "Bog Crossing",

  // Level-01 stays on the v3.0 hard pool (tables 6-9) — do not soften. PRESERVED.
  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Swamp islands (merged-collider floor runs), pinned to FLOOR_Y. Between them lie
    // WATER GAPS — some bare and jumpable (120-155px), most wider crossings bridged by
    // stepping-stone platforms below. The island rhythm is deliberately IRREGULAR
    // (widths 300-560, gaps 120-540) so no stretch reads as a repeating corridor.
    floors: [
      { x: 0, w: 480 }, // F0 — spawn island; the secret-alcove hop (PA)
      { x: 640, w: 440 }, // F1 — water gap 480..640 (160, bridged by S1); the one DOOR (@820)
      { x: 1620, w: 360 }, // F2 — post-log island (the fallen-log climb bridges 1080..1620)
      { x: 2520, w: 460 }, // F3 — fork rejoin island; the one ENEMY (@2700) + spike1
      { x: 3360, w: 340 }, // F4 — after the ripple crossing (2980..3360)
      { x: 4060, w: 360 }, // F5 — after the mini-mound (3700..4060); spike2
      { x: 4900, w: 360 }, // F6 — after the low pad-chain water crossing (4420..4900); spike3
      { x: 5680, w: 340 }, // F7 — meander island (5260..5680); spike4
      { x: 6360, w: 620 }, // F8 — final island: optional MOUND (PD) then the GOAL (@6820)
    ],

    // Stepping stones — ALL h:16 (WYSIWYG, §3.1), every y OFF the 16px grid (§3.4). ZERO
    // pairs overlap in x (the §8 L1 "no ceilings" rule). Climb pads use the proven
    // open-air micro-geometry (rise 40-66, ~25px near-edge gap, ~100px wide — the same
    // that shipped and drove green on the prior level-01 arch); flat water pads sit at
    // y:254 (66px over the floor); descents are free (large reach).
    platforms: [
      // --- Spawn-area optional hop that hosts the secret alcove (rise 66 from F0) ---
      { x: 280, y: 254, w: 120, h: 16 }, // PA  [0] — hosts alcove@320,184

      // --- S1: a lone lily pad bridging the F0->F1 water (480..640) ---
      { x: 505, y: 254, w: 110, h: 16 }, // S1  [1] — rise 66 off F0 (gap 25), drop onto F1

      // --- THE FALLEN-LOG CLIMB over the 1080..1620 water: rise to a y:126 peak (194px range) ---
      { x: 1105, y: 254, w: 110, h: 16 }, // L1  [2] rise 66 from F1 (gap 25); log foot
      { x: 1245, y: 190, w: 110, h: 16 }, // L2  [3] rise 64 from L1 (gap 30); log middle
      { x: 1385, y: 126, w: 120, h: 16 }, // L3  [4] rise 64 from L2 (gap 30); the LOG PEAK, y:126
      // --- LILY-PAD DROP back down to F2 ---
      { x: 1535, y: 230, w: 90, h: 16 }, // L4  [5] drop 104 from L3 (gap 30); pad, then walk down onto F2

      // --- THE LOW/HIGH FORK over the 1980..2520 water (rejoins at F3) ---
      // LOW road: LR1 -> LR2 flat. HIGH road: LR1 -> up onto HR1 (bonus coins) -> down onto
      // LR2. HR1 sits BETWEEN LR1 and LR2 in x (never above either) — the §8 L1 "no ceilings"
      // rule; the two roads are laterally offset, not vertically stacked.
      { x: 2010, y: 254, w: 110, h: 16 }, // LR1 [6] LOW road — rise 66 from F2 (gap 30)
      { x: 2250, y: 254, w: 110, h: 16 }, // LR2 [7] LOW road — flat hop from LR1 (gap 130), then drop to F3
      { x: 2145, y: 188, w: 100, h: 16 }, // HR1 [8] HIGH bump between LR1/LR2 — rise 66 from LR1 (gap 25); 3 bonus coins

      // --- THE RIPPLE crossing 2980..3360: up, up, down (a real meander) ---
      { x: 3010, y: 250, w: 110, h: 16 }, // M1  [9]  rise 70 from F3 (gap 30)
      { x: 3150, y: 186, w: 110, h: 16 }, // M2  [10] rise 64 from M1 (gap 30); ripple crest
      { x: 3290, y: 250, w: 110, h: 16 }, // M3  [11] drop 64 from M2 (gap 30), then onto F4

      // --- THE MINI-MOUND 3700..4060: a two-pad up, then a drop (a second little climb) ---
      { x: 3730, y: 250, w: 110, h: 16 }, // N1  [12] rise 70 from F4 (gap 30)
      { x: 3870, y: 184, w: 110, h: 16 }, // N2  [13] rise 66 from N1 (gap 30); mound top, then drop to F5

      // --- THE LOW PAD-CHAIN water crossing 4420..4900: flat low pads (a calm wade) ---
      // Every drop onto a floor is walk-off-safe (gap <= ~55px, the driver's fall reach)
      // and every flat hop's spanMax clears the 162 flat reach — no jump-descent or
      // long-root hop the in-engine driver can miss.
      { x: 4445, y: 254, w: 110, h: 16 }, // P1 [14] rise 66 from F5 (gap 25)
      { x: 4590, y: 254, w: 140, h: 16 }, // P2 [15] flat hop (gap 35, spanMax 175)
      { x: 4780, y: 254, w: 120, h: 16 }, // P3 [16] flat hop (gap 50, spanMax 170); ends at F6 — walk off onto F6

      // --- THE MEANDER crossing 5260..5680 ---
      { x: 5285, y: 254, w: 160, h: 16 }, // Q1 [17] rise 66 from F6 (gap 25)
      { x: 5490, y: 254, w: 160, h: 16 }, // Q2 [18] flat hop (gap 45, spanMax 205); then walk off onto F7 (gap 30)

      // --- FINAL crossing 6020..6360 ---
      { x: 6045, y: 254, w: 150, h: 16 }, // R1 [19] rise 66 from F7 (gap 25)
      { x: 6240, y: 254, w: 120, h: 16 }, // R2 [20] flat hop (gap 45, spanMax 165); ends at F8 — walk off onto F8

      // --- OPTIONAL final MOUND on F8 (a last gentle up-and-over before the goal) ---
      { x: 6640, y: 254, w: 110, h: 16 }, // PD  [21] well left of goal@6820; walk-off descent back to F8
    ],

    // ~34 coins — every one a fly-through box at walk height (surfaceY-56) or on a pad's
    // own clear surface. The bonus cluster (3 coins) rides the HIGH fork road (HR1/HR2);
    // the log peak L3 carries the highest coin (the climb's reward).
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 420, y: 264 }, // F0
      { x: 330, y: 198 }, // PA (near the secret alcove)
      { x: 560, y: 198 }, // S1
      { x: 760, y: 264 }, // F1 (before the door)
      { x: 1000, y: 264 }, // F1 (after the door)
      { x: 1160, y: 198 }, // L1 (log foot)
      { x: 1300, y: 134 }, // L2 (log middle)
      { x: 1445, y: 70 }, //  L3 (LOG PEAK — highest coin)
      { x: 1580, y: 174 }, // L4 (lily-pad drop)
      { x: 1800, y: 264 }, // F2
      { x: 2065, y: 198 }, // LR1 (low road)
      { x: 2305, y: 198 }, // LR2 (low road)
      { x: 2165, y: 132 }, // HR1 (HIGH bump — bonus 1)
      { x: 2195, y: 132 }, // HR1 (HIGH bump — bonus 2)
      { x: 2225, y: 132 }, // HR1 (HIGH bump — bonus 3)
      { x: 2600, y: 264 }, // F3 (before the enemy)
      { x: 2900, y: 264 }, // F3 (past the enemy, before spike1)
      { x: 3060, y: 194 }, // M1 (ripple)
      { x: 3205, y: 130 }, // M2 (ripple crest)
      { x: 3430, y: 264 }, // F4
      { x: 3785, y: 194 }, // N1 (mini-mound)
      { x: 3925, y: 128 }, // N2 (mound top)
      { x: 4130, y: 264 }, // F5
      { x: 4500, y: 198 }, // P1 (pad-chain)
      { x: 4680, y: 198 }, // P2 (pad-chain)
      { x: 4970, y: 264 }, // F6
      { x: 5335, y: 198 }, // Q1 (meander pad)
      { x: 5525, y: 198 }, // Q2 (meander pad)
      { x: 5750, y: 264 }, // F7
      { x: 6100, y: 198 }, // R1 (final pad)
      { x: 6285, y: 198 }, // R2 (final pad)
      { x: 6430, y: 264 }, // F8
      { x: 6695, y: 198 }, // PD (optional mound)
      { x: 6780, y: 264 }, // F8 (final step to the goal)
    ],

    // 4 floor spikes, each centered on a CLEAR island with margin from both edges and
    // clear of every pad's x-span (no ceiling-bonk, §3.5). NONE on the opening islands
    // (F0/F1) or the final approach — welcome and run-in stay calm. Sparing, for the
    // gentlest level.
    spikes: [
      { x: 2820, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2520..2980) — past enemy@2700
      { x: 4180, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F5 (4060..4420)
      { x: 5020, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (4900..5260)
      { x: 5800, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (5680..6020)
    ],

    // Goal caps the final island (F8 ends 6980; a 160px buffer past the goal@6820).
    goal: { x: 6820, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, one on EACH log-climb pad (L1/L2/L3), before
    // EVERY spike (60-90px lead), at each island landing, before the enemy, and on the
    // final run. y matches the surface (FLOOR_Y-48 on floors, pad.y-48 on pads).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 680, y: FLOOR_Y - 48 }, // F1 — before the door@820
      { x: 1130, y: 254 - 48 }, // L1 — log foot
      { x: 1270, y: 190 - 48 }, // L2 — log middle
      { x: 1410, y: 126 - 48 }, // L3 — log peak (a missed drop costs ~1s)
      { x: 1640, y: FLOOR_Y - 48 }, // F2 — post-log island (before the fork)
      { x: 2540, y: FLOOR_Y - 48 }, // F3 — fork rejoin, before the enemy@2700
      { x: 2760, y: FLOOR_Y - 48 }, // before spike1@2820 (F3, just past the enemy)
      { x: 3380, y: FLOOR_Y - 48 }, // F4 landing
      { x: 4100, y: FLOOR_Y - 48 }, // F5 — before spike2@4180
      { x: 4920, y: FLOOR_Y - 48 }, // F6 — before spike3@5020
      { x: 5720, y: FLOOR_Y - 48 }, // F7 — before spike4@5800
      { x: 6380, y: FLOOR_Y - 48 }, // F8 — the final calm run to the goal
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. On solid
    // F1 (left margin 180, right margin 260), clear of both water gaps.
    doors: [{ x: 820, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy + end gate.
    mathGates: [],

    // Exactly ONE enemy — on solid F3 (left margin 180 from the fork landing, right
    // margin 220), past the fork so the driven harness traverses the whole fork to reach it.
    enemies: [{ x: 2700, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // Exactly ONE secret alcove — ~70px above PA's surface (y:254). Off the required
    // path, never signposted. NO key/lock (odd archetype).
    secretAlcove: [{ x: 320, y: 184 }],

    // --- Phase 36 MOTION (MOT-01/MOT-02) — ADD-ONLY keys, EXCLUDED from the
    // check-geometry-frozen snapshot (36-01); every static array above stays byte-frozen.
    // LIGHT density for the calm ODD level (the most forgiving of the eight): ONE moving
    // platform + ONE patroller, authored to LEVEL-DESIGN §6a/§6b —
    //   * BOTH ping-pong endpoints reachable RIGHTWARD from spawn (§6a validator limit),
    //   * a checkpoint before each (§6b rule 1),
    //   * a solid floor UNDER each so a miss means WAIT, never a killing pit (§6b rule 2),
    //   * the far end visible from the mount ledge (§6b rule 4, telegraphed).
    movers: [
      // M0 — a lateral ferry shuttling over the CLEAN F4 island (3360..3700), WHOLLY above
      // solid floor: a missed hop just lands back on F4 to wait (no killing pit). Behind
      // checkpoint@3380. Both endpoints at y:250 = rise 70 from FLOOR_Y 320, inside the
      // ~88px jump envelope → mover-reachability PASS (from F4 floor, rightward). The
      // running goal-drive WALKS UNDER it (player head 288 vs ledge collider 250..266 =
      // 22px clearance); the audit mounts it with a rightward hop from F4. w110 (NOT wider:
      // a wider ledge pushes its right extent to the F4 edge@3700, and the audit mount's
      // rightward overshoot then runs off into the water and cannot recover).
      { x1: 3420, y1: 250, x2: 3560, y2: 250, w: 110 },
    ],
    patrollers: [
      // P0 — a grounded, telegraphed swamp SKELETON walking the CLEAN F2 island
      // (1620..1980), behind checkpoint@1640. POL-01 (Phase 39, locked decision #4): its
      // feet rest on FLOOR_Y — y:268 = 320 - the 52px skeleton frame (topleft anchor, so
      // the frame bottom = 268+52 = 320) — so it reads as a biped WALKING the lane, not a
      // wraith floating on the coin. A WIDE 200px ping-pong (1630..1830, speed 85 >> the
      // 40 default) sweeps VISIBLY across the mid-lane; the endpoints sit off the floor
      // coin@1800 (it only transits it, never parks on it). Contact is a checkpoint
      // respawn only (WAIT-not-death, §6b); the distinct "patroller" walk sprite (36-10)
      // reads apart from the math-blocker enemy@2700. A grounded skeleton genuinely blocks
      // the walk-lane now — the kid JUMPS it (apex feet ~232 clears its top at 268); the
      // walk-only browser-boot driver clears it via the shared patroller-hop recovery in
      // mechanic-drive.mjs (POL-01 harness retune), so no-softlock traversal is preserved.
      { x1: 1630, y1: 268, x2: 1830, y2: 268, speed: 85 },
    ],
  },

  // --- Forward-looking optional slots (buildLevel ignores them when unset) ---
  mechanics: [],
  biome: "swamp", // level 1 of 8 — Castlevania arc calm->harsh (levels 1-2 swamp)
  parallax: null,

  // --- Decorative props (ART-06/ART-07, Phase 35) — VISUAL-ONLY, top-level (NOT
  // inside geometry, so the frozen-geometry snapshot never sees them). No colliders;
  // buildLevel emits sprite+pos+z ONLY. Both layers render at NEGATIVE z (back -8,
  // surface -3), structurally BEHIND the z(0) player/coins/terrain/mechanics — a prop
  // can never occlude a route, coin, hazard, or the door/enemy/goal (legibility-first,
  // §8.5). RESTRAINED: this is the calm THIN-vocabulary swamp — a handful of accents.
  //
  // Placement rules honored: on-surface props use y = surfaceY - spriteHeight (floor
  // surface = FLOOR_Y 320) so the base rests on the ledge; every prop is kept clear of
  // the DOOR@820, ENEMY@2700, the four spikes (2820/4180/5020/5800), the coins, and the
  // GOAL@6820. Sprite pixel sizes (from build_props): tree 120x159, reed 38x35,
  // fern 45x32, vine 55x21.
  props: [
    // Background gnarled trees (layer "back") rising behind the calm mid-islands —
    // base at the floor line (y = 320 - 159), crown up in the background band. Placed
    // on F2 / F4 / the F8 run-in, all clear of every mechanic.
    { sprite: "prop-swamp-tree", x: 1700, y: 161, layer: "back" }, // behind F2 post-log island
    { sprite: "prop-swamp-tree", x: 3450, y: 161, layer: "back" }, // behind F4 (no spike here)
    { sprite: "prop-swamp-tree", x: 6400, y: 161, layer: "back" }, // behind F8, left of the goal

    // On-surface reeds / fern / vine resting on clear floor tops (y = 320 - height).
    { sprite: "prop-swamp-reed", x: 70, y: 285, layer: "surface" }, //  F0 spawn-left accent
    { sprite: "prop-swamp-fern", x: 960, y: 288, layer: "surface" }, // F1, past the door
    { sprite: "prop-swamp-reed", x: 2560, y: 285, layer: "surface" }, // F3, well left of the enemy
    { sprite: "prop-swamp-vine", x: 4280, y: 299, layer: "surface" }, // F5, right of spike@4180
    { sprite: "prop-swamp-fern", x: 5100, y: 288, layer: "surface" }, // F6, right of spike@5020
    { sprite: "prop-swamp-reed", x: 6500, y: 285, layer: "surface" }, // F8 run-in, left of the goal

    // Phase 36 (MOT-03/MECH-05): the swamp LIGHT — a bog will-o'-wisp on the
    // spawn floor directly below the secret alcove@(320,184), marking it. This is
    // the *-lantern the 36-04 flicker selector matches and the light 36-05 links
    // to the alcove (lit-on-discovery). On-surface: y = FLOOR_Y(320) - 78 = 242.
    // Clear of the spawn (x~64), the DOOR@820, and every hazard.
    { sprite: "prop-swamp-lantern", x: 320, y: 242, layer: "surface" },
  ],
};
