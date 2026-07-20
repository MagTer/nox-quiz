// src/levels/level-08.js — "The Throne Keep" descriptor.
//
// ===========================================================================
// PHASE 34.6 REBUILD — THE RAISED BAR (docs/LEVEL-DESIGN.md §8.5), CASTLE FINALE.
// ===========================================================================
// level-08 is REBUILT FROM SCRATCH (append-only convention SUSPENDED, §9.1) as the
// CLIMAX of the whole game — the intense EVEN half of the castle pair (07 = the
// readable iron-gatehouse intro, 08 = the throne-keep capstone) and the summit of the
// 02→04→06→08 even-ladder. Authored directly to §8.5 and the §8 L7–8 band (160px gaps,
// tight 72–75px OVERLAPPING climbs, REAL ceilings at the 24px headroom floor). The
// PLAN's pre-checkpoint geometry hints are SUPERSEDED by §8.5 (per the objective).
//
// WHAT LEVEL-08 IS — "THE THRONE KEEP": the TALLEST + most intense level in the game.
// A varied castle approach (portcullis DOOR, a mandatory BARBICAN outwork climb+DESCENT
// over a moat, a BROKEN-DRAWBRIDGE stepping-stone crossing of a chasm, five timed
// SPIKE hazards, one castle wraith) culminating in the GREAT THRONE KEEP — a colossal
// SWITCHBACK tower that climbs 740px (the tallest single climb ever, > level-06's 666px)
// to a broad summit throne balcony where the GOAL sits, with a DIAMOND FORK (two visible
// routes up) and the math-skip KEY on the single hardest reach ONE tier ABOVE the summit.
//
// SIGNATURE (all eight levels distinct, §8.5 rule 3): the THRONE KEEP — a broad,
// growing-width switchback spire crowned by a throne balcony, reached across a long
// castle gauntlet. Distinct from level-01's swamp ARCH, level-02's swamp SWITCHBACK
// SPIRE, level-03's TOWNSCAPE, level-05's GRAVEYARD MAUSOLEUM, level-06's DOUBLE-
// SWITCHBACK CATHEDRAL SPIRE, and — the one that matters most (LVL-02 / §8: L7 = staircase,
// L8 = switchback, they may NOT converge) — level-07's MONOTONIC GRAND STAIRCASE:
//
//   * level-07 climbs a CLEAN rightward staircase (NO reversal) shrinking toward a narrow
//     summit tower; level-08 REVERSES DIRECTION repeatedly (a real switchback), GROWS toward
//     a broad 420px summit throne balcony, carries the hardest table pool [6,7,8,9] AND the
//     math-skip key, and is 320px TALLER (740px vs 420px). One is a readable staircase; the
//     other is the intense folding spire. They do not converge.
//
// THE KEEP'S DIAMOND FORK (§8.5 rule 2 — a VISIBLE route choice): above the fork base K2 the
// climb SPLITS — a safe LOW road (KL, up-RIGHT, the through route) vs a harder HIGH road (KH,
// up-LEFT spur carrying THREE bonus coins). Both diverge at K2; the low road carries the
// climb on. Nothing hidden — she always sees both (§8.5 rule 6, open stacked tiers).
//
// INTERLEAVED DESCENTS + drop-downs (§8.5 rule 1 / rule 3): the BARBICAN is a real
// up-and-over-and-DOWN (BA→BB→BC peak y:120 = a 200px climb → BD → drop to F3), the BROKEN
// DRAWBRIDGE is a hop-across ending in a DROP onto F6, and the KEY detour is a climb ABOVE
// the summit then a DROP back to the throne goal. Up, over, down, across, up, over, down —
// the most action/variety of any level.
//
// FALL-STAKES at their sharpest (§8.5 rule 4): the 640px moat, the 520px drawbridge chasm,
// and the whole 740px keep all sit over a real fall — a missed hop drops the player and
// respawns her. The guardrail is a DENSE checkpoint cadence (§5 ≤700px on every hazard/height
// stretch): one near spawn, one before EVERY spike, before EVERY pit, on EVERY barbican tier,
// and on EVERY keep tier. A fall costs seconds and a short re-run — NEVER a game-over, NEVER a
// timer, NEVER lost progress (§5). Real tension, ADHD-safe.
//
// L7–8 CEILINGS (§8): every OVERLAPPING keep tier pair rises 74 at h:16 → headroom
// 74 − 16 − 32 = 26px ≥ 24 (§3.2), with ~70–160px consecutive x-overlap (§3.5's rising-jump
// short-root-in-window rule, direction-agnostic — every up-LEFT reversal overlap is ≥ 80px).
// The barbican and drawbridge are OPEN AIR (non-overlapping, gentle 58–70px rises, no ceiling)
// so the required descents stay legible. Climb tiers are PLATFORMS (never floors — build.js
// pins floors to FLOOR_Y), every one h:16 (§3.1) with y deliberately OFF the 16px grid (§3.4).
//
// Explicit COMPLETE 4-field bounds literal (level-02+ convention, used AS-IS — §7's bounds
// trap). bounds.right hand-bumped to 7800 (the rightmost geometry edge is SUM's 7760 + a 40px
// buffer; goal 7620 + GOAL_SIZE 16 = 7636 sits well inside). bounds.top hand-set to -720: the
// climb goes DEEPLY negative — the throne summit SUM is y:-420 and the KEY apex KA is y:-494
// (its coin y:-550) — -720 gives the camera ~170px of upward room past the highest entity.
// Raise ANY tier and BOTH must be hand-bumped or the camera clamps short. The fall-respawn line
// is the GLOBAL LEVEL_BOTTOM(360)+FALL_MARGIN(120), independent of bounds (§7).
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every castle floor run

export const LEVEL_08 = {
  id: "level-08",
  displayName: "The Throne Keep",
  allowedTables: [6, 7, 8, 9], // the hardest pool (preserved) — level 8 of 8

  bounds: { left: 0, right: 7800, top: -720, bottom: 360 },

  geometry: {
    // Castle floor runs (one merged collider each), pinned to FLOOR_Y. Standard gaps are the
    // castle-band 160px (§8 L7–8). The two WIDE spans are hazards bridged by geometry: the
    // 640px MOAT PIT (1880..2520, bridged by the mandatory BARBICAN) and the 520px DRAWBRIDGE
    // CHASM (4480..5000, bridged by the broken-drawbridge stepping stones). Spike floors are
    // sized ≥560px so every spike keeps ≥250px of clear margin from BOTH edges (the 34.6-02
    // spike-before-gap/mount conflict class).
    floors: [
      { x: 0, w: 480 }, // F0 — spawn bailey; the secret-alcove hop (PA)
      { x: 640, w: 520 }, // F1 — gap 480..640 (160); the one DOOR (portcullis @880)
      { x: 1320, w: 560 }, // F2 — gap 1160..1320 (160); spike1; ends 1880 → the MOAT
      // ---- the 640px MOAT PIT: 1880..2520, bridged only by the BARBICAN outwork ----
      { x: 2520, w: 560 }, // F3 — barbican descent landing; spike2; ends 3080
      { x: 3240, w: 520 }, // F4 — gap 3080..3240 (160); the one ENEMY (castle wraith @3500)
      { x: 3920, w: 560 }, // F5 — gap 3760..3920 (160); spike3; ends 4480 → the CHASM
      // ---- the 520px DRAWBRIDGE CHASM: 4480..5000, bridged only by the stepping stones ----
      { x: 5000, w: 560 }, // F6 — drawbridge landing; spike4; ends 5560
      { x: 5720, w: 560 }, // F7 — gap 5560..5720 (160); spike5; ends 6280
      { x: 6440, w: 680 }, // F8 — gap 6280..6440 (160); THRONE KEEP run-up + base; ends 7120
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1); every climb-tier y deliberately OFF the
    // 16px grid (§3.4). The BARBICAN (bridges the moat) and DRAWBRIDGE (bridges the chasm) are
    // OPEN AIR — non-overlapping, gentle 58–70px rises, no ceilings — so the required descents
    // read cleanly. The THRONE KEEP carries the L7–8 REAL CEILINGS: every overlapping pair
    // rises 74 (headroom 26) with ~70–160px x-overlap. The keep GROWS toward a broad summit
    // balcony (widths 240→420) — the opposite of level-07's shrinking staircase.
    platforms: [
      // --- Spawn-area optional hop that hosts the secret alcove (rise 66 from F0) ---
      { x: 280, y: 254, w: 120, h: 16 }, // PA — hosts alcove@320,184

      // POL-03 (decision #3, 2026-07-19): the static stepping-stones that used to bridge the
      // 640px MOAT (F2→F3, the BARBICAN outwork BA/BB/BC/BD) and the 520px DRAWBRIDGE CHASM
      // (F5→F6, the stones SS1/SS2) are REMOVED. Each pit is now spanned by a FLOOR-LEVEL
      // MOVING PLATFORM (see geometry.movers below) that ferries the player across; a missed
      // ride falls into the pit → respawn to the checkpoint before it (@1820 moat / @4440 chasm),
      // never a true softlock. Removing these frozen `platforms` (+ their coins/checkpoints)
      // INTENTIONALLY trips check-geometry-frozen — the --write re-baseline is plan 39-08's task.

      // ================= THE THRONE KEEP — the 740px switchback finale =================
      // A colossal folding spire off F8. Every overlapping pair rises 74 (h:16 → 26px headroom).
      // ~70px+ x-overlap in BOTH directions (§3.5). Grows 240→420 toward the throne balcony.
      { x: 6680, y: 246, w: 240, h: 16 }, // K1 — rise 74 from F8, up-RIGHT (6680..6920)
      { x: 6760, y: 172, w: 280, h: 16 }, // K2 — rise 74 from K1 (overlap 160) — the FORK BASE (6760..7040)

      // ---- THE DIAMOND FORK: two visible routes from K2 (§8.5 rule 2) ----
      // KL's up-RIGHT mount and KH's up-LEFT mount both launch off K2; KH is the harder spur
      // (3 bonus coins), KL is the through route the climb continues on.
      { x: 6970, y: 98, w: 220, h: 16 }, // KL — LOW road, up-RIGHT, the through route (overlap K2 70) (6970..7190)
      { x: 6660, y: 98, w: 200, h: 16 }, // KH — HIGH road, up-LEFT spur, 3 bonus coins (overlap K2 100) (6660..6860)

      // ---- UPPER SWITCHBACK to the throne summit (two up-LEFT reversals, then up-RIGHT to the throne) ----
      { x: 7020, y: 24, w: 280, h: 16 }, //  K4 — rise 74 from KL, up-RIGHT — the through line resumes (overlap KL 170) (7020..7300)
      { x: 7180, y: -50, w: 240, h: 16 }, // K5 — rise 74 from K4, up-RIGHT (overlap 120) (7180..7420)
      { x: 6980, y: -124, w: 280, h: 16 }, // K6 — rise 74 from K5, up-LEFT reversal #1 (overlap 80) (6980..7260)
      { x: 7160, y: -198, w: 260, h: 16 }, // K7 — rise 74 from K6, up-RIGHT (overlap 100) (7160..7420)
      { x: 6960, y: -272, w: 280, h: 16 }, // K8 — rise 74 from K7, up-LEFT reversal #2 (overlap 80) (6960..7240)
      { x: 7140, y: -346, w: 300, h: 16 }, // K9 — rise 74 from K8, up-RIGHT (overlap 100) (7140..7440)
      // SUM is the RIGHTMOST geometry, reached up-RIGHT off K9 (§7 wide-right-summit
      // technique, borrowed from level-07's S6): the throne goal's x-column (7620) exists
      // ONLY at the summit — no lower switchback tier reaches it — so a driven player must
      // physically stand on the throne to touch the goal (a switchback that folds OVER the
      // goal lets the driver "arrive" by X on a lower tier and never fire the end gate — the
      // bug audit-endgate-key caught on the first cut). The two up-LEFT reversals below
      // (K6, K8) + the diamond fork + the key spur keep it a switchback, NOT level-07's
      // monotonic staircase.
      { x: 7360, y: -420, w: 400, h: 16 }, // SUM — rise 74 from K9, up-RIGHT — the broad THRONE BALCONY (overlap 80) (7360..7760); y:-420 = 740px climb (TALLEST IN GAME); the rightmost geometry

      // ---- THE KEY APEX (one tier ABOVE the throne; the single hardest reach) ----
      { x: 7200, y: -494, w: 240, h: 16 }, // KA — rise 74 from SUM, up-LEFT — the KEY APEX (overlap 80) (7200..7440); y:-494 = 814px (highest reach); reachable ONLY from SUM (K9 is 148px down, out of a single hop)
    ],

    // ~35 coins — every one a fly-through box a driven player reaches (walk-family placement:
    // coin.y = surfaceY − 56, collected while walking the surface; each climb coin sits on the
    // CLEAR part of its tier, never under the next tier's overhang — the level-06/07 ceiling-
    // bonk lesson, §3.5). The HIGH-road spur KH carries THREE bonus coins; the throne SUM and
    // the KEY apex KA carry the two highest coins in the game.
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 400, y: 264 }, // F0
      { x: 320, y: 198 }, // PA (near the secret alcove)
      { x: 760, y: 264 }, // F1 (before the door)
      { x: 1040, y: 264 }, // F1 (after the door)
      // POL-03: the barbican-outwork coins (BA@1970, BC@2310, BD@2480) were REMOVED with the
      // stepping-stones that carried them — the moat is now a floor-level ferry (no climb tiers).
      { x: 2620, y: 264 }, // F3 (before spike2)
      { x: 2960, y: 264 }, // F3 (past spike2)
      { x: 3300, y: 264 }, // F4 (before the enemy)
      { x: 3660, y: 264 }, // F4 (past the enemy)
      { x: 4000, y: 264 }, // F5 (before spike3)
      { x: 4380, y: 264 }, // F5 (past spike3, before the chasm)
      // POL-03: the drawbridge-stone coins (SS1@4620, SS2@4860) were REMOVED with the stepping-
      // stones — the chasm is now a floor-level ferry.
      { x: 5100, y: 264 }, // F6 (past the chasm, before spike4)
      { x: 5440, y: 264 }, // F6 (past spike4)
      { x: 5820, y: 264 }, // F7 (before spike5)
      { x: 6160, y: 264 }, // F7 (past spike5)
      { x: 6520, y: 264 }, // F8 (keep run-up)
      // The throne keep — lower climb + the diamond fork:
      { x: 6710, y: 190 }, // K1 (clear left of K2's overhang @6760)
      { x: 6910, y: 116 }, // K2 (clear zone between KH@6860 and KL@6970)
      { x: 6700, y: 42 }, // KH high road — bonus 1
      { x: 6760, y: 42 }, // KH high road — bonus 2
      { x: 6820, y: 42 }, // KH high road — bonus 3
      { x: 6990, y: 42 }, // KL low road (clear left of K4's overhang @7020)
      // The upper switchback:
      { x: 7100, y: -32 }, // K4 (clear left of K5's overhang @7180)
      { x: 7360, y: -106 }, // K5 (clear right of K6's overhang end @7260)
      { x: 7040, y: -180 }, // K6 (clear left of K7's overhang @7160)
      { x: 7320, y: -254 }, // K7 (clear right of K8's overhang end @7240)
      { x: 7040, y: -328 }, // K8 (clear left of K9's overhang @7140)
      { x: 7600, y: -476 }, // SUM — the throne balcony (clear right of KA's overhang end @7440)
      { x: 7320, y: -550 }, // KA — beside the key, the 814px apex (HIGHEST coin in the game)
    ],

    // 5 floor spikes (the sharpest of the eight — level-08 is the finale), each centered on a
    // CLEAR castle run with ≥250px margin from BOTH edges and clear of EVERY platform's x-span
    // (no ceiling-bonk, §3.5). NONE on F0/F1 (welcome), F4 (the enemy floor), or F8 (the keep
    // run-up).
    spikes: [
      { x: 1600, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (1320..1880) — L280 / R280
      { x: 2800, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2520..3080) — L280 / R280
      { x: 4200, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F5 (3920..4480) — L280 / R280
      { x: 5280, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (5000..5560) — L280 / R280
      { x: 6000, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (5720..6280) — L280 / R280
    ],

    // Goal caps the throne balcony SUM — x:7620 (~2.2x the old 3460), on the RIGHTMOST stretch
    // of SUM (7360..7760), right of the KEY apex's overhang (KA ends 7440) and past EVERY lower
    // switchback tier (all end ≤7440) — so the goal's x-column exists ONLY at the summit and a
    // driven player must stand on the throne to touch it. y at the top of the 740px climb (SUM
    // y:-420). The safe LOW-road climb reaches this throne goal WITHOUT the key (→ end math
    // gate); grabbing the key (up-LEFT to KA, then drop back to the throne) is the optional
    // risk/reward that clears the level FREE (XP=20).
    goal: { x: 7620, y: -420 - CONFIG.GOAL_SIZE },

    // Respawn checkpoints (§5 + §8.5 rule 4) — near spawn, before EVERY spike, before EVERY
    // pit (the moat, the chasm), on EVERY barbican tier, and on EVERY keep tier, each placed on
    // the side the player ACTUALLY LANDS (for up-LEFT reversal hops that is near the tier's RIGHT
    // end). Checkpoint y always matches the surface it sits on (FLOOR_Y−48 on floors, tier.y−48
    // on each platform). A fall into the moat/chasm/keep CAN happen — real stakes — but every
    // respawn costs seconds, never progress.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 660, y: FLOOR_Y - 48 }, // F1 — before the door@880
      { x: 1360, y: FLOOR_Y - 48 }, // F2 — before spike1@1600
      { x: 1820, y: FLOOR_Y - 48 }, // before the MOAT ferry (F2 end) — respawn for a missed moat ride
      // POL-03: the four barbican-tier checkpoints (BA/BB/BC/BD) were REMOVED with the tiers.
      // A missed moat ferry falls to @1820 (F2, solid, re-approachable) → no true softlock.
      { x: 2560, y: FLOOR_Y - 48 }, // F3 landing (post-moat ferry)
      { x: 2740, y: FLOOR_Y - 48 }, // before spike2@2800 (F3)
      { x: 3430, y: FLOOR_Y - 48 }, // F4 — before the enemy@3500
      { x: 4130, y: FLOOR_Y - 48 }, // F5 — before spike3@4200
      { x: 4440, y: FLOOR_Y - 48 }, // before the CHASM ferry (F5 end) — respawn for a missed chasm ride
      // POL-03: the two drawbridge-stone checkpoints (SS1/SS2) were REMOVED with the stones.
      // A missed chasm ferry falls to @4440 (F5, solid, re-approachable) → no true softlock.
      { x: 5040, y: FLOOR_Y - 48 }, // F6 landing (post-chasm ferry)
      { x: 5210, y: FLOOR_Y - 48 }, // before spike4@5280 (F6)
      { x: 5930, y: FLOOR_Y - 48 }, // F7 — before spike5@6000
      { x: 6480, y: FLOOR_Y - 48 }, // F8 — the throne-keep run-up
      // One checkpoint per keep tier — placed where the player lands (up-LEFT reversals land
      // near the tier's RIGHT end). A fall during the 740px climb never costs more than one tier.
      { x: 6720, y: 246 - 48 }, // K1 (left end — up-right hop)
      { x: 6800, y: 172 - 48 }, // K2 (the fork base)
      { x: 6700, y: 98 - 48 }, // KH (high-road spur)
      { x: 7010, y: 98 - 48 }, // KL (low road, left end)
      { x: 7060, y: 24 - 48 }, // K4 (left end — up-right)
      { x: 7220, y: -50 - 48 }, // K5 (left end — up-right)
      { x: 7220, y: -124 - 48 }, // K6 (right end — up-LEFT reversal #1)
      { x: 7200, y: -198 - 48 }, // K7 (left end — up-right)
      { x: 7200, y: -272 - 48 }, // K8 (right end — up-LEFT reversal #2)
      { x: 7180, y: -346 - 48 }, // K9 (left end — up-right)
      { x: 7440, y: -420 - 48 }, // SUM (the throne balcony — up-RIGHT off K9 lands near SUM's left)
      { x: 7400, y: -494 - 48 }, // KA (the key apex — up-LEFT off SUM lands near KA's right)
    ],

    // Exactly ONE door — math density LOCKED at 1 door + 1 enemy + end gate. On solid F1 (the
    // castle portcullis), clear of the gaps on either side (L240 / R280).
    doors: [
      { x: 880, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density LOCKED at exactly 1 door + 1 enemy + the
    // end-of-level goal gate (user decision 2026-07-12).
    mathGates: [],

    // Exactly ONE enemy — mid-F4 (@3500), woven into the gauntlet between the barbican and the
    // drawbridge. variant 2 (the castle FLY) — distinct from level-07's variant-0 castle sentinel
    // in the same castle pair. Left margin 260, right margin 260, clear of every platform footprint.
    enemies: [
      { x: 3500, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 2 },
    ],

    // The math-skip KEY (KEY-02/LEN-02) — NO geometry.locks (math-skip = keys WITHOUT locks).
    // Sits on KA, the KEY APEX one tier ABOVE the throne (7200..7440, y:-494), at x:7280 — a
    // genuine walked MIDDLE stretch, clear of both the up-LEFT mount from SUM (which lands near
    // KA's right end ~7420) and KA's own edges, so a driven player naturally walks THROUGH it
    // rather than sailing over it mid-arc (Pitfall 3, the 34.5 x:760 defect class). y = KA's
    // surface (-494) minus 32, the player's own collider height (WR-02; NOT CONFIG.KEY.H), so
    // the trigger box sits flush with a standing player's top edge on that tier.
    keys: [{ x: 7280, y: -494 - 32 }],
    // NO physical lock geometry anywhere in this descriptor — this is the math-skip usage
    // (key-held clears the level directly with full XP; missing it just means answering the end
    // math gate as normal — see game.js's heldKeyIds branch).

    // Exactly ONE secret alcove — ~70px above the spawn-area optional platform PA (x:280, y:254,
    // w:120) — off the required path, never signposted, free to skip. x:320 sits inside PA's own
    // span (280..400) so the rightward-travel point model credits it as an in-footprint hop.
    secretAlcove: [{ x: 320, y: 184 }],

    // ========================= MOTION (Phase 36-08) =========================
    // check-geometry-frozen EXCLUDES geometry.movers / geometry.patrollers — every static
    // array above stays byte-frozen; motion is ADD-ONLY via these two keys.
    // INTENSE-EVEN density (the castle finale): TWO moving platforms + TWO grounded patrollers.
    // POL-03 REPLACEMENT (2026-07-19, decision #3): the movers no longer ride solid floor as a
    // JUMP hazard — they are now the REQUIRED FLOOR-LEVEL FERRIES across L8's two real pits (the
    // 640px MOAT F2→F3 and the 520px DRAWBRIDGE CHASM F5→F6), replacing the removed static
    // stepping-stones (the old barbican + drawbridge). Each is authored to the §6a/§6b HARD rules
    // as a pit-crossing ferry —
    //   * BOTH endpoints flush on the near/far FLOOR edges (board/alight are trivial walk-on/off),
    //   * a checkpoint BEFORE each pit (@1820 moat / @4440 chasm, §6b rule 1),
    //   * a missed ride falls into the pit → respawn to that checkpoint on solid floor (real
    //     fall-stakes, NEVER a true softlock — the no-true-softlock mandate for a human player).
    // The walk-only browser-boot driver RIDES each ferry via the shared driveToMover (the plan
    // 39-03 ride capability; moverBridgesRealPit now fires), and validate-levels' reachability
    // graph rides them via the POL-03 buildGraph bridge edge. level-08 stays the SWITCHBACK (its
    // static keep is untouched); the two grounded wraiths patrol the lower-gauntlet floor lanes.
    movers: [
      // POL-03 (decision #3) — TWO FLOOR-LEVEL FERRIES spanning L8's two REAL pits (replacing
      // both the old solid-floor M0 AND the removed static stepping-stones). Each rides at
      // FLOOR_Y (y:320) with its two rest endpoints flush on the near/far floor edges, so the
      // player WALKS ON at one rest, is carried NATIVELY (body stickToPlatform) across the pit,
      // and WALKS OFF onto the far floor at the other rest — a horizontal drawbridge. Because the
      // endpoints sit flush on real surfaces, validate-levels' buildGraph adds a RIDE bridge edge
      // (POL-03 reachability teach) so the far side validates as reachable; browser-boot's
      // walk-only driver rides them via the shared driveToMover (moverBridgesRealPit fires now).
      // A MISSED ride (walking off over the pit before the ferry arrives) falls to respawn at the
      // checkpoint BEFORE the pit (@1820 moat / @4440 chasm, both on solid re-approachable floor)
      // — real fall-stakes, NEVER a true softlock. w:120 (wide, forgiving mount).

      // WIDE (w:180) + slow (period:6) for a FORGIVING, reliably-boardable ferry: the walk-only
      // driver mounts by hopping right off the near floor (its arc lands ~140px past the board
      // point), so the wide deck catches it regardless of the ferry's phase, and the slow
      // raised-cosine dwells long at each rest endpoint (a generous board/alight window). Both
      // far rests stop short of the first post-pit spike (moat far edge 2540 < spike@2800; chasm
      // far edge 5020 < spike@5280) so the ferry never carries a rider onto a spike.
      //
      // FAR-REST RETUNE (2026-07-20 play-test: "it moves too far right — it overlaps the base
      // platform quite far"): x1/x2 are the DECK'S LEFT EDGE, so the old x2 values (2520/5000 =
      // the far floors' own left edges) parked the ENTIRE 180px deck on top of the far floor at
      // rest. Each x2 is now farFloorX + 20 - w, so at the far rest the deck's RIGHT edge laps
      // just 20px onto the far floor — the ferry docks at the pit lip instead of burying itself
      // in the base platform. (The raised-cosine reaches exactly (x2,y2) at phase 1, so the lip
      // IS the far rest.) Near rests are unchanged: the deck's left edge is flush on the near
      // floor's right edge (walk-on board).

      // M-MOAT — spans the 640px MOAT (F2 ends 1880 → F3 starts 2520). Near rest deck
      // [1880,2060] flush on F2's edge (board); far rest deck [2360,2540] laps 20px onto F3
      // (alight at the lip). Behind checkpoint@1820.
      { x1: 1880, y1: 320, x2: 2360, y2: 320, w: 180, period: 6 },
      // M-CHASM — spans the 520px DRAWBRIDGE CHASM (F5 ends 4480 → F6 starts 5000). Near rest
      // deck [4480,4660] flush on F5's edge (board); far rest deck [4840,5020] laps 20px onto
      // F6 (alight at the lip). Behind checkpoint@4440.
      { x1: 4480, y1: 320, x2: 4840, y2: 320, w: 180, period: 6 },
    ],
    patrollers: [
      // Two castle WRAITHS hovering at y:214 (frame bottom ~266, a 22px gap ABOVE the walking
      // player's head at 288) over FLAT grounded gauntlet lanes: a player WALKING passes safely
      // beneath, but a JUMP in the lane meets it — a gentle, telegraphed air-hazard whose contact
      // is a checkpoint respawn only (WAIT-not-death, §6b rule 3: ZERO hurt wiring). Both are
      // WALK-REACHED (placed after a resolved blocker on a flat run, no jump-gap landing at the
      // patroller's x — the level-06 P0 recipe), and each respawns to a checkpoint before an
      // already-CLEARED blocker (unlock derived, stays cleared) so there is NO re-gate loop.
      // P0 — GROUNDED skeleton (POL-01, decision #4): feet on FLOOR_Y (frame 44x52 → y=268),
      // wide visible sweep 940..1100 on the FLAT F1 lane AFTER the door@880 and BEFORE the
      // F1->F2 takeoff (~1160). Rest endpoints (940/1100) sit OFF the floor coins (760/1040) —
      // it WALKS across the lane rather than parking on a coin. The walk-only browser-boot driver
      // HOPS it (taught in 39-04); a jumping player meets it. Contact → respawn to checkpoint@660
      // (F1; door@880 stays cleared).
      { x1: 940, y1: 268, x2: 1100, y2: 268, speed: 80 },
      // P1 — GROUNDED skeleton (POL-01): feet on FLOOR_Y (y=268), wide sweep 3540..3700 on the
      // FLAT F4 lane AFTER the enemy@3500 and BEFORE the F4->F5 takeoff (F4 ends 3760). Rest
      // endpoints (3540/3700) sit OFF the floor coins (3300/3660) — it walks the lane, never parks
      // on a coin. Contact → respawn to checkpoint@3430 (F4; enemy@3500 stays cleared).
      { x1: 3540, y1: 268, x2: 3700, y2: 268, speed: 80 },
    ],

    // ===================== SLIDING SPIKES (POL-02 pattern; Batch-2 2026-07-20) =====================
    // The proven L5/L7 shadow recipe (sweep = static spike +30..+100; the planned
    // static-spike hop arcs over the whole cluster). EXEMPT from the freeze hash.
    slidingSpikes: [
      // S0 — slides along the F3 gauntlet floor (2520..3080) just past the static
      // spike@2800, sweeping 2830<->2900 (70px) — the finale's timed cluster, right after
      // the moat-ferry landing beat. checkpoint@2740 sits BEFORE the static spike (safe
      // run-up, never inside the sweep); clear of coin@2960 (right of the sweep, walked
      // through after the hop), the candles prop@3040 (collider-free), and the F3->F4 gap
      // takeoff (~3050). Default 3s period.
      { x1: 2830, y1: FLOOR_Y - CONFIG.SPIKE_SIZE, x2: 2900, y2: FLOOR_Y - CONFIG.SPIKE_SIZE },
    ],
  },

  mechanics: [],
  biome: "castle", // level 8 of 8 — Castlevania arc calm->harsh (levels 7-8 castle)
  parallax: null,

  // --- Decorative props (ART-06/ART-07; Phase 35 — VISUAL-ONLY, geometry byte-frozen) ---
  // The RESTRAINED castle vocabulary (plan-03-approved density) from the plan-05 bake:
  //   prop-castle-column 114x190, prop-castle-arch 32x64, prop-castle-candles 31x21,
  //   prop-castle-candle-stand 15x25.
  // level-08 IS the tall vertical finale (bounds.top -720). The THRONE KEEP switchback is
  // a TIGHT 26px-headroom folding spire, so NO prop touches a climb tier: on-surface
  // accents sit ONLY on the lower-gauntlet FLOORS (F0/F1/F3/F6/F8) at clear margins, and
  // the switchback lanes, tight-headroom tiers, and the KEY apex spur (KA) stay pristine.
  // A restrained few background ARCH windows dress the tall shaft at climb altitude (the
  // "black mess" mitigation, T-35-11 — verified by the level-08 climb screenshot); they
  // are z -8 (behind every tier) so they never occlude a route. Every prop is clear of the
  // DOOR@880, ENEMY@3500, the five spikes (1600/2800/4200/5280/6000), the coins, the
  // GOAL@7620, the KEY@7280, and the secret alcove@320. On-surface y = surfaceY - height.
  props: [
    // Background gothic pillars (layer "back", z -8) as gauntlet wall dressing on the
    // lower run — base resting on the floor line (y = 320 - 190 = 130).
    // POL-05 (decision, 2026-07-19): all three repositioned so NONE floats over a gap or the
    // spawn point — each column base (width 114 → spans x..x+114) now rests on a SOLID floor run,
    // reading as intentional gauntlet wall dressing behind traversable ground.
    { sprite: "prop-castle-column", x: 160, y: 130, layer: "back" }, //   F0 bailey backdrop (right of spawn@96, clear of alcove PA@280); off the old x:40 spawn overlap
    { sprite: "prop-castle-column", x: 3320, y: 130, layer: "back" }, //  on solid F4 (3240..3760) before the enemy@3500; off the old F3/F4 gap (3080..3240)
    { sprite: "prop-castle-column", x: 6500, y: 130, layer: "back" }, //  on solid F8 (6440..7120) framing the THRONE KEEP run-up; off the old F7/F8 gap (6280..6440)

    // Batch-2 (2026-07-20): the three shaft arch windows (@7460,-140 / @6600,-320 /
    // @7280,-620) were REMOVED — investigated from the live playthrough's "2 suspended
    // doorways mid-air in the big vertical climb": they are NOT geometry.doors gates (L8
    // has exactly ONE door, the portcullis on solid F1@880) but 32x64 prop-castle-arch
    // props whose dark pointed-door art hung in open air between the keep tiers with no
    // wall behind them, reading as floating doorways. They gate nothing (props are
    // collider-free) -> all three removed (the third, above the summit, is the same
    // defect class the player saw twice). The keep shaft keeps its parallax backdrop
    // windows for depth (those are screen-locked backdrop art, clearly background —
    // T-35-11's "black mess" concern stays covered).

    // On-surface castle light-sources (layer "surface", z -3) on the lower-gauntlet floors
    // ONLY, at clear margins — restrained, off the switchback climb entirely.
    { sprite: "prop-castle-candles", x: 60, y: 299, layer: "surface" }, //       F0 far-left corner (clear of alcove PA@280)
    // MECH-05 alcove torch: a candle on PA (x:280, y:254, w:120) directly below the secret
    // alcove@(320,184) — dist 49 < LINK_DIST 96, so build.js tags it "alcove-light" and it
    // starts DIM, brightening on discovery (36-04 auto-link by proximity). y = PA surface 254
    // - candles height 21 = 233. This is the *-lantern-family light the 36-04 flicker selector
    // (/lantern|lamp|candle/) matches, so it also flickers. Collider-free (cosmetic-only).
    { sprite: "prop-castle-candles", x: 320, y: 233, layer: "surface" }, //      PA — the MECH-05 alcove torch (links alcove@320,184; dist 49)
    { sprite: "prop-castle-candle-stand", x: 700, y: 295, layer: "surface" }, //  F1, flanks the portcullis door@880 (left of coin@760)
    { sprite: "prop-castle-candles", x: 3040, y: 299, layer: "surface" }, //      F3 right end, past spike@2800 + coin@2960
    { sprite: "prop-castle-candle-stand", x: 5520, y: 295, layer: "surface" }, //  F6 right end, past spike@5280 + coin@5440
    { sprite: "prop-castle-candles", x: 6460, y: 299, layer: "surface" }, //      F8 left end, flanks the throne-keep run-up (left of coin@6520)
  ],
};
