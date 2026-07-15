// src/levels/level-01.js — "The First Ascent" descriptor.
//
// ===========================================================================
// CHECKPOINT REWORK v3 — THE RAISED BAR (Phase 34.6, docs/LEVEL-DESIGN.md §8.5).
// ===========================================================================
// The 34.6 human checkpoint REJECTED level-01 twice:
//   v1 (Sonnet "one hump then a flat coin-walk"): "a bit too much of a soft landing."
//   v2 ("two gentle rolling humps"): STILL "too simple, repetitive. Needs more
//       action. More vertical in both levels." — plus the standing note that "missed
//       jumps can lead to death, to some extent; the restart is so close so it is fine."
//
// v3 is authored directly to §8.5 ("Level ambition — the raised bar"). ONLY the
// floor/platform/coin/checkpoint/spike geometry changed — the DOOR (@1300), the ENEMY
// (@2900), the GOAL (@7100, the ~2x-length landmark), the secret alcove (@320,184),
// the swamp biome, allowedTables [6-9], the LOCKED 1-door + 1-enemy + end-gate math
// density, and the NO-KEY odd-archetype schema are all preserved AS-IS.
//
// WHAT LEVEL-01 v3 IS — a SWAMP RIDGE with a MANDATORY tall arch (its signature):
//
//   THE FORK (§8.5 rule 2, on F2): the approach to the ridge splits into a visible
//   LOW road (walk the F2 ground straight to the arch base) and a HIGH road (hop the
//   three fork ledges HF1->HF2->HF3 for THREE bonus coins, then drop back to F2). Both
//   diverge on F2 and rejoin at the arch base — nothing hidden, the very first level
//   teaches "you can choose your path." No key (odd archetype).
//
//   THE ARCH (§8.5 rule 1, the vertical SIGNATURE): a MANDATORY stepped climb over a
//   480px pit — RA(rise 68) -> RB(rise 66) -> RC(the PEAK, rise 62, y:124 = a 196px
//   climb from the ground line) -> a deliberate DESCENT (RC -> RD -> down to F3). The
//   peak is MANDATORY, not an optional detour: the pit's far floor F3 starts at x:2760,
//   which is BEYOND RB's maximum rightward reach (RB->F3 spanMin 230 > RB max reach
//   206) AND beyond RB->RD's reach (spanMin 170 > 168) — so from RB the ONLY forward
//   edge is UP to RC. The player genuinely goes UP ~196px and back DOWN, every run.
//   RC carries the level's highest coin (y:68) as the climb's reward.
//
//   A SECOND OPTIONAL HIGH ROUTE (HG1->HG2 over F5, 1 bonus coin at a 130px peak) and
//   a final optional MOUND (PD before the goal) keep the back half rolling instead of
//   flat — more route choice, more up-and-down, never mandatory.
//
// STILL THE MOST FORGIVING OF THE 8 LEVELS (§8.5 rule 5 — forgiving = generous
// platforms + wide margins + dense checkpoints, NOT flat/simple):
//   * All climb rises are a gentle 62-70px (the §8 L1-2 60-70 non-overlapping band),
//     comfortably inside the 88.331px envelope — never pushed to the limit. Wide
//     platforms (RC is 120px, the fork/HG ledges 100-110px).
//   * ZERO overlapping platform pairs anywhere (the L1-2 §8 "no ceilings at all" rule):
//     every raised ledge sits over a FLOOR or the pit, never over another platform.
//     Open-air, fully legible (§8.5 rule 6) — the player can always see up and see
//     every route.
//   * 14 checkpoints — one near spawn, ONE ON EACH ARCH TIER (RA/RB/RC) so a missed
//     climb hop respawns you a hop away, one before EVERY spike, one at each landing,
//     one before the enemy, one on the final run. §8.5 rule 4's guardrail: falls into
//     the arch pit CAN happen (real platforming stakes — the human WANTS this), but the
//     respawn is always a hop away, so a miss costs seconds, never progress.
//   * 5 spikes, each centered on a CLEAR dedicated floor with >=250px margin from BOTH
//     edges (the rightward gap/mount-takeoff conflict class 34.6-02 proved in-engine)
//     and clear of every platform's x-footprint (no ceiling-bonk, §3.5). NONE on the
//     opening runs (F0/F1) or the final approach (F9) — welcome and run-in stay calm.
//
//   CONTRAST WITH LEVEL-02 (deliberate): level-01's arch peaks at y:124 (a 196px
//   climb) with ONE simple up-over-and-down arch and no reversals; level-02 climbs to
//   y:-198 (518px) through MULTIPLE switchbacks with a key apex. Level-01 is clearly,
//   structurally the gentler of the two — vertical and route-rich, but the easy one.
//
// No `bounds` field: level-01 alone DERIVES its right edge from geometry (game.js),
// per the bounds-convention trap in LEVEL-DESIGN.md §7. Do NOT add one.
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_01 = {
  id: "level-01",
  displayName: "The First Ascent",

  // Level-01 stays on the v3.0 hard pool (tables 6-9) — do not soften. PRESERVED.
  allowedTables: [6, 7, 8, 9],

  geometry: {
    // Contiguous floor runs (one merged collider each), pinned to FLOOR_Y. Standard
    // forgiving gaps are a varied 120/140px (bare running-jump crossable, §2). The ONE
    // wide span — the 480px arch pit 2280..2760 — is un-jumpable by design and bridged
    // ENTIRELY by the mandatory arch, which is what makes the up-and-over a real,
    // unavoidable part of the route (a fall into it is a free per-tier checkpoint
    // respawn, never a game-over).
    floors: [
      { x: 0, w: 560 }, // F0 — opening calm run; the secret-alcove hop (PA)
      { x: 700, w: 820 }, // F1 — gap 560..700 (140); the one DOOR (@1300)
      { x: 1660, w: 620 }, // F2 — gap 1520..1660 (140); the FORK (low road = this ground)
      { x: 2760, w: 760 }, // F3 — the 480px ARCH PIT is 2280..2760; arch landing + the one ENEMY (@2900) + spike1
      { x: 3660, w: 520 }, // F4 — gap 3520..3660 (140); spike2
      { x: 4300, w: 480 }, // F5 — gap 4180..4300 (120); the 2nd optional HIGH ROUTE overhead
      { x: 4900, w: 520 }, // F6 — gap 4780..4900 (120); spike3
      { x: 5560, w: 520 }, // F7 — gap 5420..5560 (140); spike4
      { x: 6220, w: 520 }, // F8 — gap 6080..6220 (140); spike5
      { x: 6880, w: 400 }, // F9 — gap 6740..6880 (140); final run — the optional MOUND (PD) then the GOAL (@7100)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1), every y deliberately OFF the 16px
    // grid (the "don't snap climb-tier y" trap, §3.4). ZERO platform pairs overlap in x
    // anywhere in this level (L1-2's "no ceilings at all" rule, §8): every ledge sits
    // over a FLOOR or over the arch pit, never over another platform. Every rise is a
    // gentle 62-70px, all in the non-overlapping 60-70 band (§3.3).
    platforms: [
      // --- Spawn-area optional hop that hosts the secret alcove (rise 66 from F0) ---
      { x: 280, y: 254, w: 120, h: 16 }, // PA — PRESERVED (hosts alcove@320,184)

      // --- THE FORK: the optional HIGH road over F2 (3 bonus coins), rejoining F2 ---
      { x: 1760, y: 250, w: 100, h: 16 }, // HF1 — rise 70 from F2
      { x: 1900, y: 186, w: 110, h: 16 }, // HF2 — rise 64 from HF1 (40px x-gap); the bonus peak
      { x: 2050, y: 250, w: 100, h: 16 }, // HF3 — the DESCENT: drop 64, then walk off onto F2 (rejoin)

      // --- THE ARCH (bridges the 480px F2->F3 pit): a MANDATORY 196px climb + descent ---
      { x: 2305, y: 252, w: 100, h: 16 }, // RA — rise 68 from F2 (25px gap off F2's edge)
      { x: 2430, y: 186, w: 100, h: 16 }, // RB — rise 66 from RA (25px gap)
      { x: 2555, y: 124, w: 120, h: 16 }, // RC — rise 62 from RB — the PEAK, y:124 = a 196px climb (wide 120px summit)
      { x: 2700, y: 200, w: 90, h: 16 }, // RD — the DESCENT: drop 76 from the peak, then down to F3

      // --- 2nd OPTIONAL HIGH ROUTE over F5 (1 bonus coin at a 130px peak) ---
      { x: 4360, y: 252, w: 100, h: 16 }, // HG1 — rise 68 from F5
      { x: 4500, y: 190, w: 100, h: 16 }, // HG2 — rise 62 from HG1 (40px x-gap); the bonus peak, then drop back to F5

      // --- OPTIONAL final MOUND (rise 66; a last gentle up-and-over before the goal) ---
      { x: 6980, y: 254, w: 110, h: 16 }, // PD — well left of the goal@7100; walk-off descent back to F9
    ],

    // ~34 coins — every one a fly-through box a driven player actually reaches
    // (walk-family placement: coin.y = surfaceY - 56, the "walking height" that makes it
    // collectable by simply passing through, no precision jump required). The bonus
    // coins live on the two optional high routes (HF/HG) and at the arch PEAK (RC).
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 420, y: 264 }, // F0
      { x: 330, y: 198 }, // on PA (near the secret alcove)
      { x: 850, y: 264 }, // F1 (before the door)
      { x: 1150, y: 264 }, // F1 (before the door)
      { x: 1440, y: 264 }, // F1 (after the door)
      { x: 1700, y: 264 }, // F2 (the LOW road)
      { x: 1810, y: 194 }, // FORK high road — HF1 (bonus)
      { x: 1930, y: 130 }, // FORK high road — HF2 peak (bonus)
      { x: 1960, y: 130 }, // FORK high road — HF2 peak (bonus)
      { x: 2100, y: 194 }, // FORK high road — HF3 descent (bonus)
      { x: 2200, y: 264 }, // F2 (the LOW road, past the fork)
      { x: 2355, y: 196 }, // ARCH ascent (RA)
      { x: 2480, y: 130 }, // ARCH ascent (RB)
      { x: 2615, y: 68 }, // ARCH PEAK (RC) — the climb's reward, the highest coin
      { x: 2745, y: 144 }, // ARCH descent (RD)
      { x: 2860, y: 264 }, // F3 (before the enemy)
      { x: 3100, y: 264 }, // F3 (past the enemy, before spike1)
      { x: 3400, y: 264 }, // F3
      { x: 3760, y: 264 }, // F4
      { x: 4040, y: 264 }, // F4
      { x: 4340, y: 264 }, // F5
      { x: 4410, y: 196 }, // 2nd HIGH ROUTE — HG1 (bonus)
      { x: 4550, y: 134 }, // 2nd HIGH ROUTE — HG2 peak (bonus)
      { x: 4720, y: 264 }, // F5
      { x: 5000, y: 264 }, // F6
      { x: 5300, y: 264 }, // F6
      { x: 5640, y: 264 }, // F7
      { x: 5940, y: 264 }, // F7
      { x: 6300, y: 264 }, // F8
      { x: 6600, y: 264 }, // F8
      { x: 6940, y: 264 }, // F9
      { x: 7030, y: 198 }, // on the optional MOUND (PD)
      { x: 7080, y: 264 }, // F9 (final step to the goal)
    ],

    // 5 floor spikes, each centered on a CLEAR dedicated floor run with a >=250px margin
    // from BOTH edges (the rightward gap/mount takeoff is the spike-before-gap conflict
    // class 34.6-02 proved via the in-engine harness) and clear of EVERY platform's
    // x-span (no ceiling-bonk risk — no platform sits above any spike, §3.5). Deliberately
    // sparing for the gentlest level, and NONE on the opening runs (F0/F1) or the final
    // approach (F9) — the welcome and the run-in stay calm.
    spikes: [
      { x: 3220, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2760..3520) — L288 from enemy edge, R300 (past the enemy)
      { x: 3920, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F4 (3660..4180) — L260 / R260
      { x: 5160, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (4900..5420) — L260 / R260
      { x: 5820, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (5560..6080) — L260 / R260
      { x: 6480, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F8 (6220..6740) — L260 / R260
    ],

    // Goal caps the final run — PRESERVED at x:7100 (the ~2x length landmark; F9 ends
    // 7280, a 180px buffer past the goal).
    goal: { x: 7100, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, ONE ON EACH ARCH TIER (RA/RB/RC) so a missed
    // climb hop or a fall into the arch pit respawns you a single hop away, one just
    // before EVERY spike (60-90px lead), one at each landing, one before the enemy, and
    // one on the final run. Checkpoint y matches the surface it sits on (FLOOR_Y-48 on
    // floors, tier.y-48 on each arch platform).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 760, y: FLOOR_Y - 48 }, // F1 start — before the door@1300
      { x: 1700, y: FLOOR_Y - 48 }, // F2 start — before the fork + arch (pre-pit)
      { x: 2340, y: 252 - 48 }, // RA — arch ascent tier 1
      { x: 2470, y: 186 - 48 }, // RB — arch ascent tier 2
      { x: 2600, y: 124 - 48 }, // RC — the PEAK (a missed descent leap costs ~1s)
      { x: 2800, y: FLOOR_Y - 48 }, // F3 — arch landing (post-pit), before the enemy@2900
      { x: 3140, y: FLOOR_Y - 48 }, // before spike1@3220 (F3)
      { x: 3840, y: FLOOR_Y - 48 }, // before spike2@3920 (F4)
      { x: 4300, y: FLOOR_Y - 48 }, // F5 start — before the 2nd high route
      { x: 5080, y: FLOOR_Y - 48 }, // before spike3@5160 (F6)
      { x: 5740, y: FLOOR_Y - 48 }, // before spike4@5820 (F7)
      { x: 6400, y: FLOOR_Y - 48 }, // before spike5@6480 (F8)
      { x: 6880, y: FLOOR_Y - 48 }, // F9 start — the final calm run to the goal
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. PRESERVED
    // at x:1300, on solid F1 (left margin 600, right margin 220).
    doors: [
      { x: 1300, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density locked at exactly
    // 1 door + 1 enemy + the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — PRESERVED at x:2900, on solid F3 (left margin 140 from the
    // arch landing, right margin 620), well clear of the arch's descent to its left.
    enemies: [
      { x: 2900, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 },
    ],

    // Exactly ONE secret alcove — PRESERVED at x:320, y:184 (~70px above PA's surface at
    // y:254). Off the required path, never signposted. Level-01 places NO key (odd
    // archetype) — there is no geometry.keys / geometry.locks here.
    secretAlcove: [
      { x: 320, y: 184 },
    ],
  },

  // --- Forward-looking optional slots (buildLevel ignores them when unset) ---
  mechanics: [],
  biome: "swamp", // level 1 of 8 — Castlevania arc calm->harsh (levels 1-2 swamp)
  parallax: null,
};
