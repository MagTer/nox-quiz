// src/levels/level-03.js — "Rooftop Descent" descriptor.
//
// ===========================================================================
// ALL-8 DISTINCTNESS + VARIETY REDO (Phase 34.6, docs/LEVEL-DESIGN.md §8.5 rules
// 7-8). Superseded the prior "Old Quarter" arch — which cloned the arch shape of
// levels 01/05 (the user's full test-play flagged 01≈03≈05 as near-identical).
// ===========================================================================
//
// WHAT LEVEL-03 IS — ROOFTOP DESCENT (its distinct signature): the player SPAWNS HIGH
// on a town rooftop and works his way DOWN to the street. The opening third is a
// genuine roof-to-street descent (ROOF0 y:120 -> ROOF1 -> ROOF2 -> street); the rest
// is a rooftop-town street run threaded with roof-hops, a CHIMNEY RECLIMB (a deliberate
// ascent inside the descent), and a MARKET-STALL FORK. Net direction: DOWN (spawn y:120,
// goal at street y:320). Distinct from all seven others — no tall single climb (02/08),
// no ripple archipelago (01), no valley/shaft (05/06).
//
// SPAWN-ON-ROOFTOP: the leftmost node is ROOF0, a PLATFORM at y:120 spanning x:0 — there
// is deliberately NO floor run under the spawn x (SPAWN_X 64), so the reachability spawn
// node resolves to ROOF0 and the player (spawned at 64,64) falls onto the rooftop. Every
// math BARRIER (door/enemy) still sits on a street FLOOR run (the over-hole rule — a
// barrier's full-height blocker must stand on solid floor), never on a roof.
//
// The three §8.5 beats:
//   * VERTICALITY (rule 1): the opening roof descent (~200px down) AND the CHIMNEY
//     RECLIMB (CH1->CH2, a real ascent) + roof-hop mounds — climbs and descents both.
//   * ROUTE CHOICE (rule 2): the MARKET-STALL FORK — a low stall route (LST1->LST2) vs a
//     higher BILLBOARD (BILL, bonus coins) that rejoins at LST2. Nothing hidden. No key
//     (odd archetype).
//   * ACTION & VARIETY (rule 3): every street crossing differs — descending awnings, a
//     roof-hop mound, a low stall chain, a dip-and-rise — no repeated corridor
//     (anti-transport, rule 8). Door/enemy woven into street stops.
//
// L3 ramp (§8): town gaps 140-160-ish, mixed 64-70 rises, a couple overlapping awning
// tiers are permitted here (ceilings start appearing at L3-6) but this level keeps its
// tiers laterally offset so none forms a real ceiling. Open-air, legible (rule 6).
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_03 = {
  id: "level-03",
  displayName: "Rooftop Descent",
  allowedTables: [3, 4, 5, 6, 7, 8, 9],

  // Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds
  // trap). right = 7720 (goal 7500 + buffer; F8 ends 7700). top = 0 — the descent never
  // goes above the spawn rooftop (y:120), so the town stays within the 360px screen.
  bounds: { left: 0, right: 7720, top: 0, bottom: 360 },

  geometry: {
    // Street floor runs (merged colliders), pinned to FLOOR_Y. The town STREET only
    // begins at F1 (x:860) — the descent above it rides ROOFTOP PLATFORMS, so there is
    // no floor under the spawn. Wide town gaps (350-480) are bridged by awning/stall
    // platform chains; the door/enemy sit on solid street floors.
    floors: [
      { x: 860, w: 440 }, // F1 — first STREET run (roof descent lands here); the DOOR (@1060)
      { x: 1650, w: 400 }, // F2 — street; chimney reclimb bridges F1..F2
      { x: 2490, w: 440 }, // F3 — market-fork rejoin; the ENEMY (@2680) + spike1
      { x: 3380, w: 400 }, // F4 — awning-chain landing; spike2
      { x: 4260, w: 400 }, // F5 — roof-hop mound landing; spike3
      { x: 5140, w: 400 }, // F6 — stall-chain landing
      { x: 6020, w: 440 }, // F7 — dip-and-rise landing; spike4
      { x: 6940, w: 760 }, // F8 — final street: optional roof PD then the GOAL (@7500)
    ],

    // Platforms — ALL h:16 (WYSIWYG, §3.1), y OFF the 16px grid (§3.4). The three roof
    // tiers descend the opening; awning/stall/billboard tiers are laterally OFFSET so no
    // upper tier sits as a ceiling over a lower walk (kept legible, §8.5 rule 6). Every
    // UP hop is a proven rise 64-70 with a ~25-35px near-edge gap; descents are free.
    platforms: [
      // --- THE OPENING ROOF DESCENT (spawn on ROOF0; step DOWN to the street) ---
      { x: 0, y: 120, w: 440, h: 16 }, //  ROOF0 [0] SPAWN rooftop (contains x:64), y:120 — the high start
      { x: 500, y: 186, w: 120, h: 16 }, // ROOF1 [1] drop 66 from ROOF0 (gap 60)
      { x: 680, y: 250, w: 120, h: 16 }, // ROOF2 [2] drop 64 from ROOF1 (gap 60); alcove hop above it, then drop to F1

      // NOTE ON HEIGHTS: the street tiers sit at a DISTINCT band from level-01's pads —
      // low tiers y:258 (rise 62), crests y:196 — so this descent's y-profile does not
      // read as level-01's ripple (§8.5 rule 7 distinctness; keeps ySeqSim well clear).
      //
      // --- THE CHIMNEY RECLIMB over F1..F2 (a deliberate ASCENT inside the descent) ---
      { x: 1330, y: 258, w: 110, h: 16 }, // CH1 [3] rise 62 from F1 (gap 30)
      { x: 1470, y: 196, w: 110, h: 16 }, // CH2 [4] rise 62 from CH1 (gap 30); chimney top (bonus coins), then drop to F2

      // --- THE MARKET-STALL FORK over F2..F3 (rejoins at LST2) ---
      { x: 2080, y: 258, w: 110, h: 16 }, // LST1 [5] LOW stall — rise 62 from F2 (gap 30)
      { x: 2320, y: 258, w: 110, h: 16 }, // LST2 [6] LOW stall — flat hop (gap 130), then drop to F3
      { x: 2215, y: 196, w: 100, h: 16 }, // BILL [7] HIGH billboard between LST1/LST2 — rise 62 from LST1 (gap 25); bonus coins

      // --- DESCENDING AWNING CHAIN over F3..F4 (two wide awnings; flat hop needs gap+w>=162) ---
      { x: 2960, y: 258, w: 130, h: 16 }, // AW1 [8] rise 62 from F3 (gap 30)
      { x: 3150, y: 258, w: 140, h: 16 }, // AW2 [9] flat hop (gap 60, spanMax 200), then drop to F4

      // --- A ROOF-HOP MOUND over F4..F5 (up for coins, back down) ---
      { x: 3810, y: 258, w: 110, h: 16 }, // RB1 [10] rise 62 from F4 (gap 30)
      { x: 3950, y: 196, w: 110, h: 16 }, // RB2 [11] rise 62 from RB1 (gap 30); roof peak (bonus coins)
      { x: 4090, y: 258, w: 110, h: 16 }, // RB3 [12] drop 62 from RB2 (gap 30), then drop to F5

      // --- A LOW STALL CHAIN over F5..F6 (two wide stalls) ---
      { x: 4690, y: 258, w: 130, h: 16 }, // MS1 [13] rise 62 from F5 (gap 30)
      { x: 4880, y: 258, w: 140, h: 16 }, // MS2 [14] flat hop (gap 60, spanMax 200), then drop to F6

      // --- A DIP-AND-RISE over F6..F7 ---
      { x: 5570, y: 258, w: 110, h: 16 }, // DW1 [15] rise 62 from F6 (gap 30)
      { x: 5710, y: 196, w: 110, h: 16 }, // DW2 [16] rise 62 from DW1 (gap 30); crest
      { x: 5850, y: 258, w: 110, h: 16 }, // DW3 [17] drop 62 from DW2 (gap 30), then drop to F7

      // --- FINAL AWNING CHAIN over F7..F8 (two wide awnings) ---
      { x: 6490, y: 258, w: 130, h: 16 }, // FW1 [18] rise 62 from F7 (gap 30)
      { x: 6680, y: 258, w: 140, h: 16 }, // FW2 [19] flat hop (gap 60, spanMax 200), then drop to F8

      // --- OPTIONAL final roof on F8 (a last up-and-over before the goal) ---
      { x: 7100, y: 258, w: 110, h: 16 }, // PD  [20] left of goal@7500; walk-off descent back to F8
    ],

    // ~33 coins — fly-through boxes at walk height (surfaceY-56). Bonus clusters ride the
    // chimney top (CH2) and the billboard (BILL) and the roof-hop peak (RB2).
    coins: [
      { x: 120, y: 64 }, //  ROOF0 (spawn roof; y:120-56)
      { x: 330, y: 64 }, //  ROOF0
      { x: 560, y: 130 }, // ROOF1
      { x: 740, y: 194 }, // ROOF2
      { x: 940, y: 264 }, // F1 (before the door)
      { x: 1200, y: 264 }, // F1 (after the door)
      { x: 1385, y: 202 }, // CH1 (chimney)
      { x: 1525, y: 140 }, // CH2 (chimney top — bonus)
      { x: 1700, y: 264 }, // F2
      { x: 1950, y: 264 }, // F2
      { x: 2135, y: 202 }, // LST1 (low stall)
      { x: 2375, y: 202 }, // LST2 (low stall)
      { x: 2245, y: 140 }, // BILL (billboard — bonus 1)
      { x: 2285, y: 140 }, // BILL (billboard — bonus 2)
      { x: 2560, y: 264 }, // F3 (before the enemy)
      { x: 2900, y: 264 }, // F3 (past the enemy, before spike1)
      { x: 3015, y: 202 }, // AW1
      { x: 3200, y: 202 }, // AW2
      { x: 3480, y: 264 }, // F4
      { x: 3865, y: 202 }, // RB1
      { x: 4005, y: 140 }, // RB2 (roof peak — bonus)
      { x: 4360, y: 264 }, // F5
      { x: 4745, y: 202 }, // MS1
      { x: 4930, y: 202 }, // MS2
      { x: 5240, y: 264 }, // F6
      { x: 5625, y: 202 }, // DW1
      { x: 5765, y: 140 }, // DW2 (crest)
      { x: 6120, y: 264 }, // F7
      { x: 6545, y: 202 }, // FW1
      { x: 6740, y: 202 }, // FW2
      { x: 7040, y: 264 }, // F8
      { x: 7155, y: 202 }, // PD (optional roof)
      { x: 7460, y: 264 }, // F8 (final step to the goal)
    ],

    // 4 floor spikes on clear street runs, clear of every platform's x-span (no
    // ceiling-bonk, §3.5). NONE on the opening roof descent or the final approach.
    spikes: [
      { x: 2820, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2490..2930) — past enemy@2680
      { x: 3580, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F4 (3380..3780)
      { x: 4460, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F5 (4260..4660)
      { x: 6240, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (6020..6460)
    ],

    // Goal caps the final street (F8 ends 7700; ~200px buffer past the goal@7500).
    goal: { x: 7500, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Checkpoints — near spawn on the rooftop, on each roof-descent tier, before EVERY
    // spike, on the chimney tiers, at each landing, before the enemy, and on the final
    // run. y matches the surface (FLOOR_Y-48 on floors, tier.y-48 on platforms).
    checkpoints: [
      { x: 96, y: 120 - 48 }, //  ROOF0 — spawn rooftop
      { x: 540, y: 186 - 48 }, // ROOF1
      { x: 720, y: 250 - 48 }, // ROOF2
      { x: 880, y: FLOOR_Y - 48 }, // F1 — before the door@1060
      { x: 1360, y: 258 - 48 }, // CH1 — chimney foot
      { x: 1500, y: 196 - 48 }, // CH2 — chimney top
      { x: 1670, y: FLOOR_Y - 48 }, // F2
      { x: 2560, y: FLOOR_Y - 48 }, // F3 — before the enemy@2680
      { x: 2760, y: FLOOR_Y - 48 }, // before spike1@2820 (F3)
      { x: 3480, y: FLOOR_Y - 48 }, // before spike2@3580 (F4)
      { x: 4360, y: FLOOR_Y - 48 }, // before spike3@4460 (F5)
      { x: 5160, y: FLOOR_Y - 48 }, // F6
      { x: 6140, y: FLOOR_Y - 48 }, // before spike4@6240 (F7)
      { x: 6960, y: FLOOR_Y - 48 }, // F8 — the final run to the goal
    ],

    // Exactly ONE door — on solid street F1 (left margin 200, right margin 240).
    doors: [{ x: 1060, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy + end gate.
    mathGates: [],

    // Exactly ONE enemy — on solid street F3 (left margin 190 from the fork landing),
    // past the market fork so the driven harness traverses the fork to reach it.
    enemies: [{ x: 2680, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // Exactly ONE secret alcove — ~70px above ROOF2's surface (y:250). Off the required
    // path, never signposted. NO key/lock (odd archetype).
    secretAlcove: [{ x: 720, y: 180 }],

    // --- Phase 36 MOTION (MOT-01/MOT-02) — ADD-ONLY keys, EXCLUDED from the
    // check-geometry-frozen snapshot (36-01); every static array above stays byte-frozen.
    // LIGHT density for the CALM-ODD town (the forgiving end of the town biome pair): ONE
    // moving platform + ONE patroller (2 motion entities — lighter than the intense evens'
    // 3, but never mover-free), each authored to the §6a/§6b HARD rules with generous
    // margins — both mover endpoints reachable RIGHTWARD from spawn, a checkpoint before
    // each, solid floor UNDER the mover (miss = WAIT, no killing pit), far end telegraphed.
    // Placement is DISTINCT from level-01 (the other calm level): a wide slow F8 goal-floor
    // ferry (not level-01's F4 island) + a slow wide-sweep wraith over F2 (not level-01's
    // 1770..1880 F2 island). Both ride OPEN street floors clear of every roof/fork/stall
    // climb tier and every takeoff/landing/spike band.
    movers: [
      // M0 — a slow WIDE (w130) lateral ferry over the final F8 street (6940..7700), the
      // level's LAST audit encounter (past the enemy@2680; no later blocker to strand).
      // AUTHORING NOTE (36-07 audit tuning): the town is a horizontal HOP-CHAIN — every
      // street floor has a jump-reachable platform 30px past its right edge (F6->DW1,
      // F5->MS1, ...), so the audit's rightward mount-jump ESCAPES FORWARD onto that next
      // climb instead of landing on the ledge; the F6 first-pass mover was chased onto DW1
      // every attempt and never mounted. The ONLY street whose downstream feature is a clean
      // dead-end (the GOAL, no forward platform) is F8, in the stretch AFTER the optional
      // roof PD@7100..7210: this mirrors level-02/06's proven goal-floor recipe (WIDE ledge,
      // goal the sole "soft reset"). Placed 7240..7320 (right extent 7450), ~50px of solid
      // F8 to the GOAL@7500. The WIDE (w130) ledge is the reliability lever — it rides the
      // interactive audit at att=1 across repeated runs (default CONFIG.MOVER.PERIOD_S).
      // Both endpoints y:250 = rise 70 from FLOOR_Y 320 → reachability
      // PASS/WARN (from F8, rightward). Behind checkpoint@6960; solid F8 under it → a missed
      // hop lands back on F8 to WAIT (no killing pit). The goal-drive walks under it
      // (head 288 vs ledge 250..266 = 22px) on the final approach to the goal.
      { x1: 7240, y1: 250, x2: 7320, y2: 250, w: 130 },
    ],
    patrollers: [
      // P0 — a GROUNDED town SKELETON (POL-01, Phase 39) walking the FLAT F2 street
      // (1650..2050). Feet on FLOOR_Y 320 (44x52 topleft frame → y = 320-52 = 268), a WIDE
      // 200px ping-pong sweep 1790..1990 at speed 80 (was a stationary y:214 hover over the
      // coins), shifted so its endpoints sit OFF the F2 floor coins (@1700, @1950). Sits AFTER
      // the chimney-reclimb landing (~1700) + the solid crate@1690 and BEFORE the market-fork
      // LST1 mount takeoff (~2040). Behind checkpoint@1670; a contact respawns there (door@1060
      // already open — no re-gate). A grounded skeleton across the lane now genuinely BLOCKS —
      // that is the intended danger; the walk-only driver hops it (39-04 patroller-hop), and
      // there is room to pass/hop between sweeps (level stays clearable, docs/LEVEL-DESIGN.md).
      // Sweep is CLEARABILITY-BOUNDED to 120px (1760..1880): the driver gets a full run-up from
      // respawn@1670 (the F2 crate is non-solid, so nothing steals its speed), landing its
      // full-arc patroller-hop (~1938) BEYOND the skeleton's rightmost extent (1880+44=1924) and
      // clear of the LST1 mount takeoff (~2040). A wider sweep pushes the skeleton into the
      // takeoff's 150px hop-suppression zone and re-breaks the goal-drive; clearability
      // (CONTEXT + CLAUDE.md) outranks the 200px target here.
      { x1: 1760, y1: 268, x2: 1880, y2: 268, speed: 80 },
    ],
  },

  mechanics: [],
  biome: "town", // level 3 of 8 — Castlevania arc calm->harsh (levels 3-4 town)
  parallax: null,

  // --- Decorative props (ART-06/ART-07, Phase 35) — VISUAL-ONLY, top-level (NOT
  // inside geometry, so check-geometry-frozen never sees them). No colliders;
  // buildLevel emits sprite+pos+z ONLY. Both layers render at NEGATIVE z (back -8,
  // surface -3), structurally BEHIND the z(0) player/coins/terrain/mechanics — a prop
  // can never occlude a route, coin, hazard, or the door/enemy/goal (legibility-first,
  // §8.5). RESTRAINED: town is the RICH-vocabulary biome, so this street dressing stays
  // deliberately UNDER-dressed — a handful of accents, never clutter.
  //
  // Placement rules honored: on-surface props use y = surfaceY - spriteHeight (street
  // surface = FLOOR_Y 320) so the base rests on the floor; every prop is kept OFF the
  // rooftop climb lanes (ROOF0/1/2), the market-stall fork, and clear of the DOOR@1060,
  // ENEMY@2680, the four spikes (2820/3580/4460/6240), the coins, and the GOAL@7500.
  // Sprite pixel sizes (from build_props): barrel 24x30, crate 39x35, street-lamp 35x108,
  // well 65x65, sign 35x44.
  props: [
    // Background street furniture (layer "back", z -8) for town depth — a lamp down in
    // the street below the spawn rooftop, and a well behind the mid street. Base at the
    // floor line; z(-8) keeps them behind every traversal surface.
    { sprite: "prop-town-street-lamp", x: 300, y: 212, layer: "back" }, // town depth below the spawn rooftop
    { sprite: "prop-town-well", x: 5000, y: 255, layer: "back" }, //     POL-05: MOVED off the F5 spike@4460 (was x:4400) to a clear background stretch (between the MS stalls; ~540px from spike@4460, ~1240px from spike@6240). Prop = EXEMPT; the spike stays frozen.

    // On-surface street dressing on clear street floors (y = 320 - spriteHeight), each
    // clear of every mechanic/coin and OFF the roof/fork climb lanes.
    { sprite: "prop-town-barrel", x: 960, y: 290, layer: "surface", solid: true }, //  POL-04 SOLID jump-over — F1 (moved from 880: a solid prop must NOT overlap a checkpoint respawn point — the player would respawn INSIDE the collider and death-loop; checkpoint@880, so 960 keeps a 64px gap), before the door@1060; 24px collider << 88px jump envelope
    { sprite: "prop-town-crate", x: 1810, y: 285, layer: "surface" }, //      F2 street dressing (NON-solid). POL-04 "revisit if a route breaks" EXCEPTION (user decision #5): F2 is the ONLY clean flat street that can host L3's grounded skeleton patroller (POL-01, core), and its 400px — bounded by the chimney-landing respawn@1670 on the left and the LST1 mount's 150px takeoff-suppression zone on the right — cannot ALSO clearably carry a solid jump-over crate: a solid crate here steals the walk-driver's run-up to the patroller, shortening its clearing hop so it lands back on the skeleton and the browser-boot goal-drive respawn-loops (proven). So this one crate stays decoration (5 of 6 town props are solid); the patroller grounding is kept.
    { sprite: "prop-town-street-lamp", x: 2510, y: 212, layer: "surface" }, // F3 left, before the enemy@2680 (decoration — NON-solid)
    { sprite: "prop-town-barrel", x: 3400, y: 290, layer: "surface", solid: true }, //  POL-04 SOLID jump-over — F4 left (past the AW2 landing ~3360), before coin@3480 + spike@3580
    { sprite: "prop-town-crate", x: 5340, y: 285, layer: "surface", solid: true }, //  POL-04 SOLID jump-over — F6 (moved from 5420: a solid prop must sit >150px BEFORE a platform-mount takeoff or it lands in the walk-driver's hop-suppression zone and deadlocks the goal-drive; DW1 takeoff@~5540, so 5340 keeps 176px clearance), clear of coin@5240 + checkpoint@5160
    { sprite: "prop-town-sign", x: 6970, y: 276, layer: "surface" }, //       F8 run-in, left of the goal@7500

    // Phase 36 (MOT-03/MECH-05): the town LIGHT that marks + links the secret alcove — a
    // street-lamp on ROOF2's tier (y:250) directly below the alcove@(720,180): base rests
    // on ROOF2 (y = 250 - 108 lamp height = 142), dist to the alcove = 180-142 = 38px <
    // LINK_DIST 96, so build.js auto-tags it "alcove-light" (starts DIM, brightens on
    // discovery) — NO descriptor field needed. Renders at z(-3) BEHIND the z(0)
    // roof/player so it marks the alcove without occluding the descent (legibility-first).
    // The 36-04 flicker selector (/lantern|lamp|candle/) gives it + the two existing town
    // lamps an ambient flame flicker.
    { sprite: "prop-town-street-lamp", x: 720, y: 142, layer: "surface" },
  ],
};
