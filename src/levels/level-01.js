// src/levels/level-01.js — "The First Descent" descriptor.
//
// ===========================================================================
// CHECKPOINT REWORK (Phase 34.6, plan 34.6-02 geometry, human-rejected first cut).
// ===========================================================================
// The first 34.6-02 build of this level was validator-legal but FLAT: a single
// ascent/descent "hump" up front, then a long near-monotonous ground-level
// coin-walk to the goal. The human read it at the 34.6-04 checkpoint as "a bit
// too much of a soft landing" — the calm intro had no character. This is the
// genuine-character redesign. ONLY the floor / platform / coin / checkpoint /
// spike geometry changed — the DOOR (@1300), the ENEMY (@2900), the GOAL (@7100),
// the secret alcove (@320,184), the biome, allowedTables, the 1-door + 1-enemy +
// end-gate math density, and the descriptor schema are all preserved AS-IS.
//
// WHAT LEVEL-01 STILL IS (the ODD archetype = the CALM swamp intro, the game's
// soft landing for a 12-year-old, LEVEL-DESIGN §8 L1-2 band):
//
//   * STILL THE GENTLEST OF THE 8 LEVELS. All floor gaps are a forgiving, VARIED
//     120/140px — comfortably shorter than the 160px comfort max and the ~162px
//     bare running-jump reach. No tight/technical sequences. NO ceilings anywhere
//     (ZERO overlapping platform pairs — the L1-2 "no ceilings at all" rule, §8).
//     A missed jump is a free checkpoint respawn (one before every spike/hazard
//     and one either side of every climb pit) — a mistake rarely punishes.
//
//   * NOTE on the validator's gap-width WARN rows. Every floor here sits at
//     FLOOR_Y (320) — floors cannot vary in height (build.js pins them). So every
//     floor→floor hop is FLAT (Δy=0), and per reachability.mjs's documented WR-01
//     limitation a flat hop's marginRatio is ALWAYS exactly 1.000 regardless of
//     how short the gap is — it literally cannot report a flat gap as "easy." The
//     1.000 rows are therefore NOT "gaps at the max jump distance"; they are the
//     Δy=0 degenerate case. The real forgiveness lever — kept comfortably slack
//     here — is the physical gap WIDTH (120/140px). Genuine sub-1.0 margins only
//     appear on the RISING hops onto the step-up tiers below, and those are all
//     gentle 60-70px rises, well inside the 88.331px envelope.
//
// WHAT THE REWORK ADDS (gentle verticality / rolling terrain — the actual fix,
// spread ACROSS the level instead of front-loaded into one hump):
//
//   * TWO gentle up-and-over HUMPS, each a small stepped ascent → peak → stepped
//     descent that bridges a wide gap no bare jump can cross (410px before the
//     enemy, 390px after it), so the up-and-DOWN is a real part of the journey,
//     not decoration. Rises are a calm 65-70px (the §8 L1-2 60-70 band, never the
//     72-75 climb band and never a ceiling). Each hump's far side is a deliberate
//     DESCENT — peak → lower tier → back down to the floor.
//   * ONE short OPTIONAL, fully-visible HIGH ROUTE over floor-2 (two non-
//     overlapping tiers, 3 bonus coins) — inviting, never mandatory, never a key
//     (level-01 is the odd archetype: NO key). A player who ignores it loses
//     nothing but three coins.
//   * ONE optional up-and-over MOUND on the final run (PD) — a last little step-up
//     with a walk-off descent, so even the run-in to the goal rolls instead of
//     lying flat.
//   This is the CONTRAST that makes level-02's tall mandatory switchback climb
//   read as an escalation rather than a genre change: level-01 rolls gently along
//   the ground; level-02 genuinely climbs.
//
// No `bounds` field: level-01 alone DERIVES its right edge from geometry (game.js),
// per the bounds-convention trap in LEVEL-DESIGN.md §7. Do NOT add one.
//
// This is a PURE data module: no engine globals (a727c13). The ONLY import is
// ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_01 = {
  id: "level-01",
  displayName: "The First Descent",

  // Level-01 stays on the v3.0 hard pool (tables 6-9) — do not soften. PRESERVED.
  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Contiguous floor runs (one merged collider each), pinned to FLOOR_Y. All
    // floor→floor gaps are a forgiving, varied 120/140px (bare running-jump
    // crossable, §2). The two WIDE spans — 2100..2510 (410) and 4310..4700 (390) —
    // are bridged ENTIRELY by the two stepped humps below, which is what makes the
    // up-and-over a real, unavoidable part of the route (a fall into either span is
    // a free per-side checkpoint respawn, never a game-over).
    floors: [
      { x: 0, w: 560 }, // F0 — opening calm run; the secret-alcove hop (PA)
      { x: 700, w: 820 }, // F1 — gap 560..700 (140); the one DOOR (@1300)
      { x: 1660, w: 440 }, // F2 — gap 1520..1660 (140); the optional HIGH ROUTE overhead
      { x: 2510, w: 600 }, // F3 — gap 2100..2510 (410, bridged by HUMP 1); the one ENEMY (@2900)
      { x: 3250, w: 480 }, // F4 — gap 3110..3250 (140); spike1
      { x: 3850, w: 460 }, // F5 — gap 3730..3850 (120); spike2, leads into HUMP 2
      { x: 4700, w: 480 }, // F6 — gap 4310..4700 (390, bridged by HUMP 2); spike3
      { x: 5320, w: 540 }, // F7 — gap 5180..5320 (140); spike4
      { x: 5980, w: 480 }, // F8 — gap 5860..5980 (120); spike5
      { x: 6600, w: 600 }, // F9 — gap 6460..6600 (140); final calm run — the optional MOUND (PD) then the GOAL (@7100)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1), every y deliberately OFF the
    // 16px grid (the "don't snap climb-tier y" trap, §3.4). ZERO platform pairs
    // overlap in x anywhere in this level (L1-2's "no ceilings at all" rule, §8) —
    // every rise is a gentle 64-70px, all in the non-overlapping 60-70 band (§3.3).
    platforms: [
      // --- Spawn-area optional hop that hosts the secret alcove (rise 66 from F0) ---
      { x: 280, y: 254, w: 120, h: 16 }, // PA — PRESERVED (hosts alcove@320,184)

      // --- OPTIONAL HIGH ROUTE over F2 (two non-overlapping tiers, 3 bonus coins) ---
      { x: 1720, y: 256, w: 90, h: 16 }, // HR1 — rise 64 from F2
      { x: 1860, y: 192, w: 90, h: 16 }, // HR2 — rise 64 from HR1 (50px x-gap, no overlap); the bonus-coin peak

      // --- HUMP 1 (bridges the 410px F2→F3 gap): ascend two tiers, then DESCEND ---
      { x: 2120, y: 250, w: 100, h: 16 }, // H1a — rise 70 from F2
      { x: 2240, y: 185, w: 110, h: 16 }, // H1b — rise 65 from H1a (20px x-gap); the peak
      { x: 2370, y: 250, w: 110, h: 16 }, // H1c — the DESCENT: drop 65 from the peak, then back down to F3

      // --- HUMP 2 (bridges the 390px F5→F6 gap): ascend two tiers, then DESCEND ---
      { x: 4330, y: 250, w: 100, h: 16 }, // H2a — rise 70 from F5
      { x: 4450, y: 185, w: 110, h: 16 }, // H2b — rise 65 from H2a (20px x-gap); the peak
      { x: 4580, y: 250, w: 100, h: 16 }, // H2c — the DESCENT: drop 65 from the peak, then back down to F6

      // --- OPTIONAL MOUND on the final run (rise 64; a last gentle up-and-over) ---
      { x: 6720, y: 256, w: 110, h: 16 }, // PD — well left of the goal@7100; walk-off descent back to F9
    ],

    // ~32 coins — every one a fly-through box a driven player actually reaches
    // (walk-family placement: coin.y = surfaceY - 56, the "walking height" that
    // makes it collectable by simply passing through, no jump required). The three
    // bonus coins on the HIGH ROUTE (HR1/HR2) are the optional-route reward.
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 450, y: 264 }, // F0
      { x: 330, y: 198 }, // on PA (near the secret alcove)
      { x: 820, y: 264 }, // F1
      { x: 1120, y: 264 }, // F1 (before the door)
      { x: 1440, y: 264 }, // F1 (after the door)
      { x: 1700, y: 264 }, // F2
      { x: 2020, y: 264 }, // F2
      { x: 1765, y: 200 }, // HIGH ROUTE tier 1 (HR1) — bonus
      { x: 1895, y: 136 }, // HIGH ROUTE tier 2 (HR2) — bonus
      { x: 1920, y: 136 }, // HIGH ROUTE tier 2 (HR2) — bonus
      { x: 2170, y: 194 }, // HUMP 1 ascent (H1a)
      { x: 2295, y: 129 }, // HUMP 1 peak (H1b)
      { x: 2425, y: 194 }, // HUMP 1 descent (H1c)
      { x: 2620, y: 264 }, // F3
      { x: 3040, y: 264 }, // F3 (past the enemy)
      { x: 3320, y: 264 }, // F4
      { x: 3640, y: 264 }, // F4
      { x: 3920, y: 264 }, // F5
      { x: 4230, y: 264 }, // F5
      { x: 4380, y: 194 }, // HUMP 2 ascent (H2a)
      { x: 4505, y: 129 }, // HUMP 2 peak (H2b)
      { x: 4630, y: 194 }, // HUMP 2 descent (H2c)
      { x: 4780, y: 264 }, // F6
      { x: 5100, y: 264 }, // F6
      { x: 5400, y: 264 }, // F7
      { x: 5760, y: 264 }, // F7
      { x: 6060, y: 264 }, // F8
      { x: 6380, y: 264 }, // F8
      { x: 6660, y: 264 }, // F9
      { x: 6775, y: 200 }, // on the optional MOUND (PD)
      { x: 7000, y: 264 }, // F9 (final run to the goal)
    ],

    // 5 floor spikes, each centered on a CLEAR dedicated floor run with a >=250px
    // margin from the floor's RIGHT edge (the rightward gap/mount takeoff — the
    // spike-before-gap conflict class 34.6-02 proved via the in-engine harness) and
    // clear of EVERY platform's x-span (no ceiling-bonk risk — no platform sits
    // above any spike, §3.5). Deliberately sparing (down from the prior cut's 8) and
    // NONE on the opening run (F0/F1) or the final approach (F9) — this is the
    // gentlest level and its welcome and its run-in both stay calm.
    spikes: [
      { x: 3480, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F4 (3250..3730) — right margin 250
      { x: 4050, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F5 (3850..4310) — right margin 260 (clear of HUMP 2's mount)
      { x: 4930, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (4700..5180) — right margin 250 (clear of HUMP 2's landing)
      { x: 5580, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (5320..5860) — right margin 280
      { x: 6200, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F8 (5980..6460) — right margin 260
    ],

    // Goal caps the final run — PRESERVED at x:7100 (the ~2x length landmark; F9
    // ends 7200, a 100px buffer, matching the shipped 80-90px convention).
    goal: { x: 7100, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, one just before EVERY spike (80-190px lead),
    // one either side of each climb pit (so a fall into a hump span costs at most
    // the approach), and one at the final calm run. Every checkpoint y matches the
    // floor it sits on (FLOOR_Y - 48).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 760, y: FLOOR_Y - 48 }, // F1 start — before the door@1300
      { x: 1700, y: FLOOR_Y - 48 }, // F2 start — before the high route + HUMP 1 (pre-pit)
      { x: 2560, y: FLOOR_Y - 48 }, // F3 start — HUMP 1 landing (post-pit), before the enemy@2900
      { x: 3400, y: FLOOR_Y - 48 }, // before spike1@3480 (F4)
      { x: 3970, y: FLOOR_Y - 48 }, // before spike2@4050 (F5, also pre-HUMP-2 pit)
      { x: 4740, y: FLOOR_Y - 48 }, // F6 start — HUMP 2 landing (post-pit), before spike3@4930
      { x: 5500, y: FLOOR_Y - 48 }, // before spike4@5580 (F7)
      { x: 6120, y: FLOOR_Y - 48 }, // before spike5@6200 (F8)
      { x: 6640, y: FLOOR_Y - 48 }, // F9 start — the final calm run to the goal
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate.
    // PRESERVED at x:1300, on solid F1 (left margin 600, right margin 220).
    doors: [
      { x: 1300, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density locked at exactly
    // 1 door + 1 enemy + the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — PRESERVED at x:2900, on solid F3 (left margin 390, right
    // margin 210), well clear of HUMP 1's landing to its left.
    enemies: [
      { x: 2900, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 },
    ],

    // Exactly ONE secret alcove — PRESERVED at x:320, y:184 (~70px above PA's
    // surface at y:254). Off the required path, never signposted. Level-01 places
    // NO key (odd archetype) — there is no geometry.keys / geometry.locks here.
    secretAlcove: [
      { x: 320, y: 184 },
    ],
  },

  // --- Forward-looking optional slots (buildLevel ignores them when unset) ---
  mechanics: [],
  biome: "swamp", // level 1 of 8 — Castlevania arc calm->harsh (levels 1-2 swamp)
  parallax: null,
};
