// src/levels/level-07.js — "The Iron Gatehouse" descriptor.
//
// ===========================================================================
// PHASE 34.6 REBUILD — THE RAISED BAR (docs/LEVEL-DESIGN.md §8.5), CASTLE INTRO.
// ===========================================================================
// level-07 is REBUILT FROM SCRATCH (append-only convention SUSPENDED, §9.1) as the
// CALMER — but still hard — half of the castle pair (07 = the READABLE castle intro,
// 08 = the intense capstone). Authored directly to §8.5 and the §8 L7–8 band (160px
// gaps, tight 72–75px overlapping climbs, REAL ceilings). It is LEVEL 7 near the top
// of the 1→8 ramp, so it is genuinely challenging — just the more LEGIBLE of the two.
// Doubled length: goal x:3700 → x:7560 (~2.04x). ODD archetype → NO key; the end gate
// is always math. Density LOCKED: 1 door + 1 enemy + the end math gate (mathGates: []).
//
// THIS REBUILD DELETES THE 5 DEFERRED PHASE-34 HEADROOM HARD-FAILs. The shipped
// level-07 climbed 6 tiers of `h:24` at 65px rises → 9px headroom on EVERY tier (a 32px
// player in a 41px slot, §3.2). Every overlapping tier here is `h:16` at a 73px rise →
// headroom = 73 − 16 − 32 = 25px ≥ 24. The `headroom` validator rows for level-07 go
// to ZERO; the project-wide HARD-FAIL count drops 5 → 0.
//
// WHAT LEVEL-07 IS — A CASTLE with its own SIGNATURE, mechanically DISTINCT from
// level-08's SWITCHBACK (LVL-02 / §8: L7 = monotonic staircase, L8 = switchback — they
// may NOT converge). Distinct from level-01's swamp ARCH, level-02's swamp SWITCHBACK
// SPIRE, level-03's TOWNSCAPE, and level-05's GRAVEYARD MAUSOLEUM:
//
//   THE GATEHOUSE (§8.5 rule 1 — the mandatory DESCENT): a stepped climb UP over an
//   iron gatehouse (GA→GB→GC peak y:120 = a 200px climb) then a deliberate DESCENT
//   DOWN the far side (GC→GD→down to F2) into the inner bailey. It bridges a 720px MOAT
//   PIT (F1 ends 1240 → F2 starts 1960) and is MANDATORY — the moat is far past a bare
//   running jump, so the up-and-over-and-down is the only crossing. This is the level's
//   deliberate descent; the grand staircase (below) is its climb.
//
//   THE BATTLEMENT FORK (§8.5 rule 2 — a VISIBLE route choice on F2): the inner-bailey
//   walk splits into a LOW road (stroll straight along F2 to the far gap) and a HIGH road
//   (hop the three crenellated BATTLEMENT ledges BW1→BW2→BW3 for THREE bonus coins, then
//   drop back onto F2). Both diverge on F2 and rejoin at F2's far end — nothing hidden.
//   No key (odd archetype).
//
//   THE BROKEN DRAWBRIDGE (§8.5 rule 3 — anti-repetition, castle stepping stones): two
//   raised STONE stepping stones (SS1/SS2, y:262) bridge a 500px CHASM (F5→F6) — a
//   collapsed drawbridge you hop across. A real fall hazard (a miss drops into the chasm),
//   but a required crossing (§3.5: the 500px gap is far past a bare jump, so the stones
//   are the route, never a decorative interceptor inside a jumpable gap).
//
//   THE GRAND STAIRCASE (§8.5 rule 1 / §8 — the mandatory VERTICAL SIGNATURE, and the
//   L7–8 band's REAL CEILINGS): a clean MONOTONIC rightward castle staircase of SIX
//   overlapping `h:16` tiers (S1→S6) climbing 420px from the courtyard line (y:320) to
//   the summit tower (S6 y:-100) — the TALLEST ODD climb in the game (more than level-05's
//   260px, well below the even levels' 600–700px). EVERY consecutive pair overlaps in x by
//   ~70px and rises 73px → 25px headroom (§3.2 floor with a 1px margin), so the climb
//   carries genuine castle ceilings while staying OPEN, stacked, and legible (§8.5 rule 6):
//   you can always see up the whole staircase. NO leftward reversal anywhere — that
//   monotonic read is exactly what keeps it DISTINCT from level-08's switchback.
//
// STILL THE READABLE ONE, BUT A HARD LEVEL (§8.5 rule 5 — the ramp still climbs):
//   * Gaps are the castle-band 160px (§8 L7–8), the widest floor gaps in the game.
//   * The mandatory gatehouse rises are a gentle 64–70px (open air, no ceiling) so the
//     REQUIRED descent stays legible; the tight 73px OVERLAPPING (ceilinged) rises are
//     reserved for the grand-staircase signature — the L7–8 "real ceilings" band, on the
//     required path but always open/stacked/see-through (§8.5 rule 6).
//   * 3 spikes (a notch sharper than calm level-05's 2 — this is a hard level), each
//     centered on a CLEAR floor with ≥250px margin from BOTH edges (the 34.6-02
//     spike-before-gap/mount conflict class) and clear of every platform's x-footprint
//     (no ceiling-bonk, §3.5).
//   * Real FALL STAKES behind CLOSE checkpoints (§8.5 rule 4): the moat pit, the chasm,
//     and the staircase all sit over a fall — but there is a checkpoint on EVERY gatehouse
//     tier, EVERY staircase tier, before EVERY spike, and before EVERY pit, so a fall
//     always costs seconds and a short re-run, never progress. No game-over, no timer (§5).
//
//   CONTRAST WITH LEVEL-08 (deliberate, LVL-02): level-07 is a MONOTONIC staircase that
//   shrinks toward a narrow summit tower; level-08 REVERSES DIRECTION TWICE (a switchback)
//   and GROWS toward a broad summit balcony, with the hardest table pool and a math-skip
//   key. Level-07 is clearly the more readable of the castle pair.
//
// Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds trap).
// bounds.right hand-bumped to 7720 (goal 7560 + GOAL_SIZE 16 + buffer; S6 ends 7640).
// bounds.top hand-set to −360 (the shipped castle convention): ~1 screen above the summit
// tier (S6 y:-100) and its coin (y:-156). The fall-respawn line is the GLOBAL
// LEVEL_BOTTOM(360)+FALL_MARGIN(120), independent of bounds (§7).
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every castle floor run

export const LEVEL_07 = {
  id: "level-07",
  displayName: "The Iron Gatehouse",
  allowedTables: [6, 7, 8],

  bounds: { left: 0, right: 7720, top: -360, bottom: 360 },

  geometry: {
    // Castle floor runs (one merged collider each), pinned to FLOOR_Y. Standard gaps are
    // the castle-band 160px (§8 L7–8). The two WIDE spans are hazards bridged by geometry:
    // the 720px MOAT PIT (1240..1960, bridged by the mandatory gatehouse) and the 540px
    // CHASM (4980..5520, bridged by the broken-drawbridge stepping stones).
    floors: [
      { x: 0, w: 520 }, // F0 — spawn bailey; the secret-alcove hop (PA)
      { x: 680, w: 560 }, // F1 — gap 520..680 (160); the one DOOR (@940)
      { x: 1960, w: 620 }, // F2 — the 720px MOAT PIT is 1240..1960; gatehouse landing + BATTLEMENT FORK
      { x: 2740, w: 660 }, // F3 — gap 2580..2740 (160); the one ENEMY (@3060); fork rejoins
      { x: 3560, w: 640 }, // F4 — gap 3400..3560 (160); spike1
      { x: 4360, w: 620 }, // F5 — gap 4200..4360 (160); spike2; the broken-drawbridge chasm start
      { x: 5480, w: 600 }, // F6 — the 500px CHASM is 4980..5480; rampart approach + spike3
      { x: 6240, w: 460 }, // F7 — gap 6080..6240 (160); the grand-staircase run-up
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1), every climb-tier y deliberately OFF the
    // 16px grid (§3.4). The gatehouse + battlements + drawbridge stones are OPEN AIR
    // (non-overlapping, no ceilings); the GRAND STAIRCASE carries the L7–8 REAL CEILINGS —
    // six overlapping tiers, each pair rise 73 / ~70px x-overlap → 25px headroom ≥ 24 (§3.2).
    platforms: [
      // --- Spawn-area optional hop that hosts the secret alcove (rise 66 from F0) ---
      { x: 280, y: 254, w: 110, h: 16 }, // PA — hosts alcove@320,184

      // --- THE GATEHOUSE (bridges the 720px moat F1→F2): a MANDATORY 200px climb + DESCENT.
      // Open air (non-overlapping) so the required descent stays legible. ---
      { x: 1280, y: 250, w: 110, h: 16 }, // GA — rise 70 from F1 (gap 40 off F1's edge)
      { x: 1430, y: 184, w: 110, h: 16 }, // GB — rise 66 from GA (gap 40)
      { x: 1580, y: 120, w: 140, h: 16 }, // GC — rise 64 from GB (gap 40) — the PEAK, y:120 = 200px climb (wide gate top)
      { x: 1770, y: 200, w: 110, h: 16 }, // GD — the DESCENT: drop 80 from the peak, then down to F2

      // --- THE BATTLEMENT FORK: the optional HIGH road over F2 (3 bonus coins), rejoining F2 ---
      { x: 2140, y: 250, w: 100, h: 16 }, // BW1 — crenel, rise 70 from F2
      { x: 2290, y: 250, w: 100, h: 16 }, // BW2 — crenel (gap 50 off BW1)
      { x: 2440, y: 250, w: 100, h: 16 }, // BW3 — crenel (gap 50 off BW2); drop back onto F2 (rejoin)

      // --- THE BROKEN DRAWBRIDGE: two raised stepping stones bridging the 500px chasm
      // (F5→F6). Over a real fall — a miss drops into the chasm — but the required crossing
      // (§3.5: the 500px gap is far past a bare jump, so the stones are the route). Sized to
      // the reach model: F5→SS1 is a rise (long root ~132 lands inside SS1), SS1→SS2 is a
      // flat hop (fixed ~162 reach lands inside the 120px-wide SS2), SS2→F6 is a drop. ---
      { x: 5060, y: 262, w: 120, h: 16 }, // SS1 — rise 58 from F5 (gap 80 off F5's edge)
      { x: 5300, y: 262, w: 120, h: 16 }, // SS2 — flat hop from SS1 (gap 120); drop 58 down onto F6 (gap 60)

      // --- THE GRAND STAIRCASE (bridges the final chasm past F7): a MONOTONIC rightward
      // climb of SIX overlapping tiers — the TALLEST ODD climb (420px, y:320 → y:-100) and
      // the L7–8 REAL CEILINGS. Each consecutive pair overlaps in x by ~70px (§3.5: the
      // rising-jump short root must land inside the overlap window) and rises 73px →
      // headroom = 73 − 16 − 32 = 25px ≥ 24 (§3.2). S1's first hop off F7 is a gentle
      // non-overlapping 55px (F7 carries no ceiling); every S→S rise is the tight 73px.
      // NO leftward reversal — a clean upward staircase, DISTINCT from level-08's switchback. ---
      { x: 6740, y: 265, w: 200, h: 16 }, // S1 — rise 55 from F7 (gap 40 off F7's edge); overlapped by S2 (headroom 25)
      { x: 6870, y: 192, w: 200, h: 16 }, // S2 — rise 73, overlaps S1 by 70 (6870..6940) — headroom over S1: 25
      { x: 7000, y: 119, w: 200, h: 16 }, // S3 — rise 73, overlaps S2 by 70 (7000..7070) — headroom over S2: 25
      { x: 7130, y: 46, w: 200, h: 16 }, // S4 — rise 73, overlaps S3 by 70 (7130..7200) — headroom over S3: 25
      { x: 7260, y: -27, w: 200, h: 16 }, // S5 — rise 73, overlaps S4 by 70 (7260..7330) — headroom over S4: 25
      { x: 7390, y: -100, w: 250, h: 16 }, // S6 — rise 73, overlaps S5 by 70 (7390..7460) — the SUMMIT TOWER (y:-100 = 420px climb; ends 7640)
    ],

    // ~32 coins — every one a fly-through box a driven player reaches (walk-family
    // placement: coin.y = surfaceY − 56; every staircase coin sits on the CLEAR (left)
    // part of its tier, never under the next tier's overhang — the level-08 ceiling-bonk
    // lesson). Bonus coins live on the battlement high road (BW), the gatehouse peak (GC),
    // and the grand staircase (S1..S6).
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 440, y: 264 }, // F0
      { x: 330, y: 198 }, // on PA (near the secret alcove)
      { x: 800, y: 264 }, // F1 (before the door)
      { x: 1120, y: 264 }, // F1 (after the door)
      { x: 1330, y: 194 }, // GATEHOUSE ascent (GA)
      { x: 1480, y: 128 }, // GATEHOUSE ascent (GB)
      { x: 1650, y: 64 }, // GATEHOUSE PEAK (GC) — the climb's reward
      { x: 1820, y: 144 }, // GATEHOUSE descent (GD)
      { x: 2020, y: 264 }, // F2 (the LOW road)
      { x: 2180, y: 194 }, // FORK high road — BW1 (bonus)
      { x: 2330, y: 194 }, // FORK high road — BW2 (bonus)
      { x: 2480, y: 194 }, // FORK high road — BW3 (bonus)
      { x: 2820, y: 264 }, // F3 (before the enemy)
      { x: 3280, y: 264 }, // F3 (past the enemy)
      { x: 3680, y: 264 }, // F4 (before spike1)
      { x: 4060, y: 264 }, // F4 (past spike1)
      { x: 4460, y: 264 }, // F5 (before spike2)
      { x: 4860, y: 264 }, // F5 (past spike2, before the chasm)
      { x: 5120, y: 206 }, // BROKEN DRAWBRIDGE — SS1
      { x: 5360, y: 206 }, // BROKEN DRAWBRIDGE — SS2
      { x: 5560, y: 264 }, // F6 (past the chasm)
      { x: 5920, y: 264 }, // F6 (past spike3)
      { x: 6360, y: 264 }, // F7 (staircase run-up)
      { x: 6560, y: 264 }, // F7 (staircase run-up)
      { x: 6800, y: 209 }, // GRAND STAIRCASE — S1 (clear of S2's overhang)
      { x: 6930, y: 136 }, // GRAND STAIRCASE — S2 (clear of S3's overhang)
      { x: 7060, y: 63 }, // GRAND STAIRCASE — S3 (clear of S4's overhang)
      { x: 7190, y: -10 }, // GRAND STAIRCASE — S4 (clear of S5's overhang)
      { x: 7320, y: -83 }, // GRAND STAIRCASE — S5 (clear of S6's overhang)
      { x: 7500, y: -156 }, // GRAND STAIRCASE — S6 summit, near the goal
    ],

    // 3 floor spikes (a notch sharper than calm level-05's 2 — level-07 is a HARD level),
    // each centered on a CLEAR castle run with ≥250px margin from BOTH edges (the 34.6-02
    // spike-before-gap/mount conflict class) and clear of EVERY platform's x-span (no
    // ceiling-bonk, §3.5). NONE on F0/F1 (welcome) or F7 (the staircase run-up).
    spikes: [
      { x: 3880, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F4 (3560..4200) — L320 / R320
      { x: 4670, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F5 (4360..4980) — L310 / R310
      { x: 5780, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (5480..6080) — L300 / R300
    ],

    // Goal caps the summit tower S6 — x:7560 (~2.04x the old 3700; S6 ends 7640, an 80px
    // buffer), y at the top of the 420px climb (S6 y:-100).
    goal: { x: 7560, y: -100 - CONFIG.GOAL_SIZE },

    // Respawn checkpoints (§5 + §8.5 rule 4) — near spawn, one on EVERY gatehouse tier and
    // EVERY staircase tier (a missed climb/descent hop respawns a hop away), one before
    // EVERY spike, and one before EVERY pit (the moat, the chasm, the final staircase
    // chasm). Checkpoint y matches the surface it sits on (FLOOR_Y−48 on floors, tier.y−48
    // on each platform). Falls into the moat/chasm/staircase CAN happen — real stakes —
    // but every respawn costs seconds, never progress.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 700, y: FLOOR_Y - 48 }, // F1 start — before the door@940
      { x: 1180, y: FLOOR_Y - 48 }, // before the MOAT PIT + gatehouse climb (F1 end)
      { x: 1300, y: 250 - 48 }, // GA — gatehouse ascent tier 1
      { x: 1450, y: 184 - 48 }, // GB — gatehouse ascent tier 2
      { x: 1600, y: 120 - 48 }, // GC — the PEAK (a missed descent leap costs ~1s)
      { x: 1790, y: 200 - 48 }, // GD — gatehouse descent tier
      { x: 1990, y: FLOOR_Y - 48 }, // F2 landing (post-moat) — the fork + low road
      { x: 2760, y: FLOOR_Y - 48 }, // F3 start (post-gap)
      { x: 2980, y: FLOOR_Y - 48 }, // before the enemy@3060 (F3)
      { x: 3600, y: FLOOR_Y - 48 }, // F4 start — before spike1@3880
      { x: 4400, y: FLOOR_Y - 48 }, // F5 start — before spike2@4670
      { x: 4920, y: FLOOR_Y - 48 }, // before the CHASM + broken drawbridge (F5 end)
      { x: 5520, y: FLOOR_Y - 48 }, // F6 landing (post-chasm)
      { x: 5680, y: FLOOR_Y - 48 }, // before spike3@5780 (F6)
      { x: 6280, y: FLOOR_Y - 48 }, // F7 start — the staircase run-up
      { x: 6660, y: FLOOR_Y - 48 }, // before the GRAND STAIRCASE chasm (F7 end)
      { x: 6800, y: 265 - 48 }, // S1 — staircase tier 1
      { x: 6930, y: 192 - 48 }, // S2 — staircase tier 2
      { x: 7060, y: 119 - 48 }, // S3 — staircase tier 3
      { x: 7190, y: 46 - 48 }, // S4 — staircase tier 4
      { x: 7320, y: -27 - 48 }, // S5 — staircase tier 5
      { x: 7460, y: -100 - 48 }, // S6 — the summit tower
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. On solid F1
    // (left margin 260, right margin 268), clear of the gaps on either side.
    doors: [
      { x: 940, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density locked at exactly 1 door + 1 enemy +
    // the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F3 (@3060), PAST the mandatory gatehouse climb/descent, so
    // triggering it in-engine proves the moat crossing was driven. Left margin 320, right
    // margin 308.
    enemies: [
      { x: 3060, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }, // castle sentinel (saw variant), on solid F3
    ],

    // Exactly ONE secret alcove — ~70px above PA's surface (y:254). Off the required path,
    // never signposted. Level-07 places NO key (odd archetype) — no geometry.keys/locks.
    secretAlcove: [
      { x: 320, y: 184 },
    ],
  },

  mechanics: [],
  biome: "castle", // level 7 of 8 — Castlevania arc calm->harsh (levels 7-8 castle)
  parallax: null,
};
