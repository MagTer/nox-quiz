// src/levels/level-06.js — "Deep Shaft" descriptor.
//
// ===========================================================================
// ALL-8 DISTINCTNESS + VARIETY REDO (Phase 34.6, docs/LEVEL-DESIGN.md §8.5 rules
// 7-8). Superseded the prior spire — which was a re-skin of level-02's switchback
// (the user's full test-play flagged 02≈04≈06 as identical). Replaced with a
// genuinely distinct MACRO-SHAPE per the approved 2026-07-16 concept table.
// ===========================================================================
//
// WHAT LEVEL-06 IS — DEEP SHAFT (its distinct signature): MOSTLY DOWN. The player spawns
// high on a crypt entrance ledge, takes a BRIEF entry climb up to the shaft lip, then
// makes a long BRANCHING DESCENT down a necropolis shaft — a rightward-descending
// zig-zag of drop-ledges — before bottoming out into a low catacomb and the goal. It is
// the ONLY intense level whose dominant direction is DOWNWARD: the mirror of level-02/08's
// ascending spires and distinct from 03/05's gentler descents.
//
// SPAWN-ON-LEDGE: the leftmost node is EL0, a PLATFORM at y:120 — no floor under the spawn
// x (SPAWN_X 64), so the reachability spawn node is EL0 and the player (spawned 64,64)
// falls onto the entrance ledge. The math BARRIERS (door/enemy) sit on the LOW catacomb
// FLOOR at the shaft's bottom (over-hole rule — a barrier stands on solid floor).
//
// EVEN/INTENSE (§8.5 rule 1): the shaft is a long multi-tier descent (lip y:-14 down to
// y:282, ~300px) after a brief climb (120 -> -14). Descending hops are all RIGHTWARD
// (the driver's native case — no leftward reversals to stall the harness).
//
// THE MATH-SKIP KEY (KEY-02): geometry.keys, NO geometry.locks. Sits on KA, a spur one
// tier ABOVE the shaft lip (the hardest single reach) — reachable ONLY by climbing UP from
// LIP, exactly like the other evens' key-above-summit. The goal-drive descends from LIP
// straight down the shaft and never climbs to KA, so the key is a real risk/reward detour
// (rule 2 branch). Key held -> free clear +20 XP; key skipped -> the end math gate.
// (An earlier draft put the key on a below-path ledge you DROP to mid-descent; the
// rightward-descending in-engine driver never drops to a below-path ledge, so it could not
// collect the key — audit-endgate-key path A failed. The up-spur is driver-reachable.)
//
// L6 ramp (§8): cemetery, gaps to ~160, overlapping descending tiers (headroom 26, rise
// 74). Fall-stakes with a checkpoint per tier (§8.5 rule 4): a missed drop lands a hop
// lower in the shaft and respawns — no game-over. Open-air, legible (rule 6).
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every crypt-floor run

export const LEVEL_06 = {
  id: "level-06",
  displayName: "Deep Shaft",
  allowedTables: [4, 5, 6, 7],

  // Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds
  // trap). right = 4560 (goal 4300; F4 ends 4470; buffer). top = -240 — the KEY spur KA is
  // y:-88 (coin at -144); -240 gives room above. Raise KA and hand-bump this.
  bounds: { left: 0, right: 4560, top: -240, bottom: 360 },

  geometry: {
    // The LOW catacomb floor runs (merged colliders) sit at FLOOR_Y — the bottom of the
    // shaft. The high entrance ledge and every descent tier are PLATFORMS (below). The
    // door/enemy sit on the catacomb floor; pillar platforms bridge the catacomb gaps.
    floors: [
      { x: 1580, w: 520 }, // F1 — catacomb: the shaft bottoms out here; the DOOR (@1800)
      { x: 2350, w: 520 }, // F2 — catacomb; the ENEMY (@2600) + spike
      { x: 3120, w: 520 }, // F3 — catacomb; spike; the last pillar mounts a JUMP onto F4
      { x: 3790, w: 680 }, // F4 — catacomb goal floor: bottom out here and walk to the exit GOAL@4300 (F4 ends 4470)
    ],

    // Platforms — ALL h:16 (WYSIWYG, §3.1), climb/drop-tier y OFF the 16px grid (§3.4).
    // The entry climb rises to the lip; the shaft descends RIGHTWARD in ~74px drops
    // (overlapping tiers, headroom 26); coffin-lid pillars bridge the catacomb.
    platforms: [
      // ================= ENTRY: spawn ledge + climb to the shaft lip + the KEY spur =====
      { x: 0, y: 120, w: 420, h: 16 }, //   EL0 [0] SPAWN entrance ledge (contains x:64), y:120; alcove above
      { x: 450, y: 54, w: 130, h: 16 }, //  EC1 [1] rise 66 from EL0 (gap 30)
      { x: 610, y: -14, w: 150, h: 16 }, // LIP [2] rise 68 from EC1 (gap 30); the SHAFT LIP
      // --- THE KEY SPUR: one tier ABOVE the lip — the hardest single reach, reachable ONLY
      //     from LIP (like the other evens' key-above-summit). The goal-drive descends from
      //     LIP straight down the shaft and never climbs to KA, so the key is a real detour;
      //     but the driven key-path CAN climb to it (a below-path ledge could not be reached
      //     by the rightward-descending driver — the reason the old drop-down KL failed). ---
      { x: 640, y: -88, w: 150, h: 16 }, // KA [3] rise 74 from LIP — the KEY APEX (y:-88); then descend to DS1

      // ================= THE DEEP SHAFT — a rightward-descending zig-zag ================
      { x: 810, y: 60, w: 140, h: 16 }, //  DS1 [4] drop 74 from LIP or KA (gap 50)
      { x: 1000, y: 134, w: 140, h: 16 }, // DS2 [5] drop 74 from DS1 (gap 50)
      { x: 1190, y: 208, w: 140, h: 16 }, // DS3 [6] drop 74 from DS2 (gap 50)
      { x: 1380, y: 282, w: 140, h: 16 }, // DS4 [7] drop 74 from DS3 (gap 50), then drop to the catacomb F1

      // ================= THE CATACOMB — coffin-lid pillars bridge F1..F3 ================
      { x: 2130, y: 258, w: 120, h: 16 }, // PL1 [8] rise 62 from F1 (gap 30), then drop to F2
      { x: 2900, y: 258, w: 120, h: 16 }, // PL2 [9] rise 62 from F2 (gap 30), then drop to F3
      // NOTE: F3 -> F4 is a BARE 150px GAP JUMP (no pillar) — the driver crosses it with a
      // running jump and lands on F4 carrying rightward momentum, so it sweeps CLEANLY
      // across the goal collider (a gentle pillar walk-off onto the goal floor left the
      // driver decelerating and stopping a few px short of the goal, missing the collision
      // — audit-endgate-key path B; a jump-landing is how the other evens reach their goal).
    ],

    // ~31 coins — fly-through boxes. The descent tiers each carry a coin; the KEY spur KA
    // carries the highest coin beside the key; catacomb floor coins at walk height (264).
    coins: [
      { x: 120, y: 64 }, //  EL0 (entrance ledge; y:120-56)
      { x: 330, y: 64 }, //  EL0
      { x: 510, y: -2 }, //  EC1
      { x: 680, y: -70 }, // LIP (shaft lip)
      { x: 715, y: -144 }, // KA — beside the key (the highest coin, the key spur)
      { x: 880, y: 4 }, //   DS1
      { x: 1070, y: 78 }, // DS2
      { x: 1260, y: 152 }, // DS3
      { x: 1450, y: 226 }, // DS4
      { x: 1650, y: 264 }, // F1 (before the door)
      { x: 1950, y: 264 }, // F1 (after the door)
      { x: 2170, y: 202 }, // PL1 (coffin-lid)
      { x: 2380, y: 264 }, // F2 (before the enemy)
      { x: 2760, y: 264 }, // F2 (past the enemy/spike)
      { x: 2950, y: 202 }, // PL2 (coffin-lid)
      { x: 3200, y: 264 }, // F3 (before the spike)
      { x: 3500, y: 264 }, // F3 (past the spike)
      { x: 3860, y: 264 }, // F4 (jump landing)
      { x: 4100, y: 264 }, // F4 (approach to the exit)
      { x: 4380, y: 264 }, // F4 (past the goal)
    ],

    // 2 floor spikes on clear catacomb runs, clear of every pillar's x-span (no
    // ceiling-bonk). NONE on the shaft descent (a spike beside a drop-tier strands the
    // driven player).
    spikes: [
      { x: 2750, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (2350..2870) — past enemy@2600
      { x: 3300, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (3120..3640)
    ],
    // NOTE: NO spike on F4 — the goal floor is kept a clean flat runway so the driven
    // player crosses the goal at full speed (a marginal hop or spike right before the goal
    // leaves the driver stuttering and stopping a few px short of the goal collider).

    // Goal on the catacomb floor F4 (F4 ends 4610; buffer past the goal@4250).
    goal: { x: 4300, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Checkpoints — near spawn on the ledge, on the entry climb, ONE PER descent tier (a
    // missed drop lands a hop lower and respawns), at the key ledge, at each catacomb
    // landing, before the enemy, and before each spike. y matches each surface.
    checkpoints: [
      { x: 96, y: 120 - 48 }, //  EL0 — spawn entrance ledge
      { x: 500, y: 54 - 48 }, //  EC1 — entry climb
      { x: 660, y: -14 - 48 }, // LIP — the shaft lip
      { x: 690, y: -88 - 48 }, // KA — the key spur
      { x: 860, y: 60 - 48 }, //  DS1
      { x: 1050, y: 134 - 48 }, // DS2
      { x: 1240, y: 208 - 48 }, // DS3
      { x: 1430, y: 282 - 48 }, // DS4
      { x: 1600, y: FLOOR_Y - 48 }, // F1 — catacomb, before the door@1800
      { x: 2370, y: FLOOR_Y - 48 }, // F2 — before the enemy@2600
      { x: 2670, y: FLOOR_Y - 48 }, // before spike@2750 (F2)
      { x: 3220, y: FLOOR_Y - 48 }, // before spike@3300 (F3)
      { x: 3840, y: FLOOR_Y - 48 }, // F4 — jump landing, before the walk to the exit@4300
    ],

    // Exactly ONE door — on solid catacomb F1 (left margin 220, right margin 300).
    doors: [{ x: 1800, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy + end gate.
    mathGates: [],

    // Exactly ONE enemy — on solid catacomb F2, so the driven harness descends the whole
    // shaft to reach it.
    enemies: [{ x: 2600, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // The math-skip KEY (KEY-02) — NO geometry.locks. Sits on KA, the key spur above the
    // shaft lip (x:640..790, y:-88), at x:715 (a walked middle clear of the LIP->KA mount
    // landing and the ledge edges). y = KA surface (-88) minus 32 (the player's collider
    // height). Reachable ONLY from LIP; the goal-drive descends past it without climbing up.
    keys: [{ x: 715, y: -88 - 32 }],

    // Exactly ONE secret alcove — ~70px above EL0's surface (y:120). Off the required path.
    secretAlcove: [{ x: 360, y: 50 }],

    // --- Phase 36 MOTION (MOT-01/MOT-02) — ADD-ONLY keys, EXCLUDED from the
    // check-geometry-frozen snapshot (36-01); every static array above stays byte-frozen.
    // HEAVIER density for the intense EVEN level (the density + no-softlock stress test):
    // ONE moving platform + TWO patrollers (3 motion entities vs level-01's 2), each
    // authored to the §6a/§6b HARD rules —
    //   * BOTH mover endpoints reachable RIGHTWARD from spawn (§6a),
    //   * a checkpoint before each (§6b rule 1),
    //   * solid catacomb floor UNDER the mover (a miss = WAIT, no killing pit — §6b rule 2),
    //   * far end telegraphed (§6b rule 4),
    //   * NOTHING on the F4 goal runway — it stays a clean full-speed lane (the level-06
    //     goal-drive invariant).
    // Placement discipline (verified against the in-engine driver): level-06's vertical
    // switchback keeps the player AIRBORNE across wide bands (the DS4->F1 landing
    // ~x1540..1650, the PL1->F2 landing ~x2350..2440, the PL2->F3 landing ~x3120..3190, and
    // the spike/gap jumps). A SOLID mover ledge in an airborne band catches the descending
    // player ("never landed"); a hovering wraith in one respawns it mid-hop. AND a ridden
    // mover leaves the player parked ON it (elevated), which strands the NEXT blocker-drive
    // in the x-sorted audit — so the mover is placed as the LAST encounter (after the
    // enemy, mirroring level-01's ridden F4 mover), while the two wraiths hover over
    // grounded walk-lanes (patrollers pass through at floor level and never strand a later
    // drive). This keeps the walk-only spawn->goal driver clear (no-softlock browser-boot
    // proof) and the audit's ride/cross reliable, while a JUMPING player still meets each.
    movers: [
      // M1 — coffin-slab ferry over the WIDE goal floor F4 (3790..4470), the level's LAST
      // audit encounter (riding it strands no later drive). F4 is the only catacomb floor
      // wide enough to give the audit's rightward-hop mount room to overshoot-and-retry
      // without running off the ledge (on the cramped F3 the mount overshot across the
      // F3->F4 gap and could never recover). Placed in F4's LEFT-CENTRE, clear of BOTH the
      // bare-gap landing (~3850) and the goal@4300 runway: rightmost extent (3990 + 130)
      // stays 180px left of the goal so the driven player still sweeps the goal collider at
      // full speed. y:250 = rise 70 from FLOOR_Y 320 → reachability PASS (from F4,
      // rightward). Wide (w130) for a reliable mount; solid F4 under it → miss = WAIT; the
      // goal-drive walks under it (22px head clearance).
      { x1: 3900, y1: 250, x2: 3990, y2: 250, w: 130 },
    ],
    patrollers: [
      // POL-01 (Phase 39): both crypt skeletons GROUNDED (y:214 hover -> y:268, feet on
      // FLOOR_Y 320, 44x52 frame) and widened @speed 80 so each visibly WALKS its catacomb
      // lane. A grounded skeleton genuinely blocks — the walk-only browser-boot driver
      // clears each with the grounded-patroller hop (landing ~92px past the sweep's right
      // end, so each right end is capped to keep every hop on solid floor). Contact is
      // still a checkpoint respawn only (WAIT-not-death, §6b: ZERO hurt wiring); neither
      // respawn lands before an unanswered gate (door unlock derived — no re-gate).
      // P0 — walks the FLAT F1 lane AFTER the door@1800, sweep 1860..1990 (130px, was
      // 1900..2020@y214). RIGHT end capped at 1990 so the latest hop lands ~2082, still on
      // solid F1 (ends 2100) before the F1->PL1 takeoff (~2080). Endpoints eased OFF the
      // floor coins (@1950 is mid-sweep, clear of both ends). Contact respawns to
      // checkpoint@1600 (door already open).
      { x1: 1860, y1: 268, x2: 1990, y2: 268, speed: 80 },
      // P1 — walks F2 (2350..2870) in the lane BETWEEN the PL1->F2 landing arc (~x2440)
      // and the enemy@2600, sweep 2435..2540 (105px, was 2470..2560@y214). RIGHT end capped
      // at 2540 (44px body edge 2584) to stay clear of the enemy blocker@2600 — a hop that
      // overshoots meets the tall enemy blocker and drops into the math challenge, never
      // past it. Coin@2380 sits left of the sweep. Contact respawns to checkpoint@2370
      // (still on F2; door already open — no re-gate).
      { x1: 2435, y1: 268, x2: 2540, y2: 268, speed: 80 },
    ],
  },

  mechanics: [],
  biome: "cemetery", // level 6 of 8 — Castlevania arc calm->harsh (levels 5-6 cemetery)
  parallax: null,

  // --- Decorative props (ART-06/ART-07, Phase 35) — VISUAL-ONLY, top-level (NOT inside
  // geometry, so check-geometry-frozen never sees them). No colliders; sprite+pos+z only.
  // Both layers are NEGATIVE z (back -8, surface -3) so a prop can never occlude the
  // player/coins/terrain/mechanics (legibility-first, §8.5).
  //
  // This is a VERTICAL switchback (the density-vs-legibility probe) — so props stay OFF
  // the climb tiers (EL0/EC1/LIP), the rightward shaft descent (DS1..DS4), the coffin-lid
  // pillars (PL1/PL2), and the KEY spur (KA). Only the WIDE catacomb floors (F1..F4 at
  // FLOOR_Y 320) and background dead-corners are dressed, and deliberately SPARSE. On-surface
  // props use y = surfaceY - spriteHeight. Every prop is clear of the DOOR@1800, ENEMY@2600,
  // the two spikes (2750/3300), the coins, the KEY, and the GOAL@4300. Sprite pixel sizes
  // (from build_props): statue 63x75, stone-1 21x37, stone-2 27x40, stone-3 27x33,
  // stone-4 19x38, tree 166x117, bush 76x65.
  props: [
    // Background gnarled cemetery trees (layer "back") in the dead-corner backdrop —
    // one behind the entry ledge (frames the spawn) and one in the catacomb depth behind
    // F1. Base rests at the surface line; z(-8) keeps them behind every traversal surface.
    { sprite: "prop-cemetery-tree", x: 120, y: 3, layer: "back" }, //  behind the entry ledge (base ~y120)
    { sprite: "prop-cemetery-tree", x: 1650, y: 203, layer: "back" }, // catacomb depth behind F1 (base y320)

    // On-surface cemetery dressing on the WIDE catacomb floors (y = 320 - height), clear
    // of every mechanic and OFF the shaft/climb/pillars. Uses the full RICH vocabulary
    // (statue + all four stone types + bush) sparsely across F1..F4.
    { sprite: "prop-cemetery-statue", x: 1600, y: 245, layer: "surface" }, // F1 left corner, before the door
    { sprite: "prop-cemetery-stone-2", x: 2010, y: 280, layer: "surface" }, // F1, right of the door@1800
    { sprite: "prop-cemetery-stone-1", x: 2390, y: 283, layer: "surface" }, // F2, left of the enemy@2600
    { sprite: "prop-cemetery-stone-3", x: 3160, y: 287, layer: "surface" }, // F3, before spike@3300
    { sprite: "prop-cemetery-bush", x: 3560, y: 255, layer: "surface" }, //   F3, right of spike@3300
    { sprite: "prop-cemetery-stone-4", x: 3850, y: 282, layer: "surface" }, // F4 run-in
    { sprite: "prop-cemetery-bush", x: 4080, y: 255, layer: "surface" }, //   F4, left of the goal@4300

    // Phase 36 (MOT-03/MECH-05): the cemetery LIGHT — a small grave candle on
    // the EL0 entry-tier surface (y:120) directly below the secret alcove@(360,50),
    // marking it. This is the *-lantern the 36-04 flicker selector matches and the
    // light 36-05 links to the alcove (lit-on-discovery). On-surface: y = 120 - 25
    // = 95. Visual-only (no collider, negative-z) — it cannot block the EL0 climb.
    { sprite: "prop-cemetery-lantern", x: 360, y: 95, layer: "surface" },
  ],
};
