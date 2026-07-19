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

      // --- THE BARBICAN (bridges the 640px moat F2→F3): a MANDATORY 200px climb + DESCENT.
      // Open air (non-overlapping) so the required descent stays legible. Rises 64–70 (the
      // gentler non-overlapping band), gaps 40 (the proven level-07 gatehouse spacing). ---
      { x: 1920, y: 250, w: 120, h: 16 }, // BA — rise 70 from F2 (gap 40 off F2's edge 1880)
      { x: 2080, y: 184, w: 120, h: 16 }, // BB — rise 66 from BA (gap 40)
      { x: 2240, y: 120, w: 150, h: 16 }, // BC — rise 64 from BB (gap 40) — the PEAK, y:120 = 200px climb (wide gate top)
      { x: 2430, y: 200, w: 110, h: 16 }, // BD — the DESCENT: drop 80 from the peak (gap 40), then drop 120 down to F3

      // --- THE BROKEN DRAWBRIDGE (bridges the 520px chasm F5→F6): two raised STONE stepping
      // stones over a real fall — a miss drops into the chasm — but the REQUIRED crossing
      // (§3.5: the 520px gap is far past a bare jump, so the stones ARE the route). Sized to
      // the reach model (34.6-08 lesson): F5→SS1 is a rise (long root ~132 lands inside SS1),
      // SS1→SS2 is a FLAT hop (fixed ~162 reach lands inside the 120px-wide SS2), SS2→F6 is a
      // drop. NOT a chain of narrow same-height stones (which overshoot). ---
      { x: 4560, y: 262, w: 120, h: 16 }, // SS1 — rise 58 from F5 (gap 80 off F5's edge 4480)
      { x: 4800, y: 262, w: 120, h: 16 }, // SS2 — flat hop from SS1 (gap 120); drop 58 down onto F6 (gap 80)

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
      // The barbican outwork:
      { x: 1970, y: 194 }, // BA (ascent)
      { x: 2310, y: 64 }, // BC (the gate PEAK — the climb's reward)
      { x: 2480, y: 144 }, // BD (descent)
      { x: 2620, y: 264 }, // F3 (before spike2)
      { x: 2960, y: 264 }, // F3 (past spike2)
      { x: 3300, y: 264 }, // F4 (before the enemy)
      { x: 3660, y: 264 }, // F4 (past the enemy)
      { x: 4000, y: 264 }, // F5 (before spike3)
      { x: 4380, y: 264 }, // F5 (past spike3, before the chasm)
      // The broken drawbridge:
      { x: 4620, y: 206 }, // SS1
      { x: 4860, y: 206 }, // SS2
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
      { x: 1820, y: FLOOR_Y - 48 }, // before the MOAT + barbican (F2 end)
      { x: 1960, y: 250 - 48 }, // BA — barbican ascent tier 1
      { x: 2120, y: 184 - 48 }, // BB — barbican ascent tier 2
      { x: 2300, y: 120 - 48 }, // BC — the PEAK
      { x: 2470, y: 200 - 48 }, // BD — barbican descent tier
      { x: 2560, y: FLOOR_Y - 48 }, // F3 landing (post-moat)
      { x: 2740, y: FLOOR_Y - 48 }, // before spike2@2800 (F3)
      { x: 3430, y: FLOOR_Y - 48 }, // F4 — before the enemy@3500
      { x: 4130, y: FLOOR_Y - 48 }, // F5 — before spike3@4200
      { x: 4440, y: FLOOR_Y - 48 }, // before the CHASM + drawbridge (F5 end)
      { x: 4600, y: 262 - 48 }, // SS1 — drawbridge stone 1
      { x: 4840, y: 262 - 48 }, // SS2 — drawbridge stone 2
      { x: 5040, y: FLOOR_Y - 48 }, // F6 landing (post-chasm)
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
    // INTENSE-EVEN density (the castle finale): ONE moving platform + TWO patrollers (3 motion
    // entities — HEAVIER than the calm-odd 05/07's 2, matching the shipped level-06 intense
    // template), each authored to the §6a/§6b HARD rules —
    //   * BOTH mover endpoints reachable RIGHTWARD from spawn (§6a),
    //   * a checkpoint before each (§6b rule 1),
    //   * solid castle floor UNDER the mover (a miss = WAIT, no killing pit — §6b rule 2),
    //   * far end telegraphed (§6b rule 4).
    // NO-SOFTLOCK OVER SWITCHBACK-DRAMA (the 36-05/36-07 precedent, load-bearing): the THRONE
    // KEEP is a TIGHT 26px-headroom folding spire over a 740px fall — a mover on a climb tier is
    // both a softlock hazard AND unmountable by the headless driver (documented on level-04/06).
    // So the mover rides the WIDE clean F8 keep RUN-UP (the last FLOOR_Y encounter, past the
    // enemy@3500), and the two wraiths hover over grounded lower-gauntlet lanes. This keeps the
    // walk-only browser-boot spawn->goal driver clear (the deterministic no-softlock proof) while
    // a JUMPING player still meets every entity. level-08 stays the SWITCHBACK (its static keep is
    // untouched); the motion layout is its own, distinct from level-07's staircase.
    movers: [
      // M0 — a gentle castle-slab ferry over the WIDE F8 THRONE-KEEP RUN-UP (6440..7120), the
      // level's LAST audit encounter (past the enemy@3500; riding it strands no later blocker).
      // Placed in F8's run-up LEFT stretch, clear of BOTH the F7->F8 landing (~6440..6540) and
      // the K1 keep-climb takeoff (K1 left edge 6680): right extent (6600+60) = 6660 stays 20px
      // left of K1, so it never overlaps a keep climb tier and the keep climb reads clean. y:250
      // = rise 70 from FLOOR_Y 320 -> reachability PASS/WARN (from F8, rightward). Behind
      // checkpoint@6480; solid F8 under it -> a missed hop lands back on F8 to WAIT (no killing
      // pit). WALK-REACHED: x1:6560 sits in F8's flat run past the F7->F8 landing (~6440..6540)
      // and clear of the K1 keep-climb takeoff (K1 left edge 6680; ledge right extent 6660), so
      // the driver walks straight onto it and the ledge never overhangs the K1 climb arc.
      { x1: 6560, y1: 250, x2: 6600, y2: 250, w: 60 },
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

    // Background arch windows (layer "back", z -8) dressing the TALL switchback shaft at
    // climb altitude so the keep never reads as an empty parallax void — anchored to the
    // far wall on the OPEN side of each switchback fold (behind the tiers, never over a
    // lane). These are the T-35-11 climb-legibility dressing the climb shot verifies.
    { sprite: "prop-castle-arch", x: 7460, y: -140, layer: "back" }, //  right far-wall window behind the mid switchback (K5/K7)
    { sprite: "prop-castle-arch", x: 6600, y: -320, layer: "back" }, //  left far-wall window behind the upper switchback (K8/K9)
    { sprite: "prop-castle-arch", x: 7280, y: -620, layer: "back" }, //  crowning window above the keep summit/apex

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
