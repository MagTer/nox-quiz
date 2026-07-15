// src/levels/level-03.js — "The Old Quarter" descriptor.
//
// ===========================================================================
// PHASE 34.6 REBUILD — THE RAISED BAR (docs/LEVEL-DESIGN.md §8.5), TOWN INTRO.
// ===========================================================================
// level-03 is REBUILT FROM SCRATCH (append-only convention SUSPENDED, §9.1) as the
// calmer of the town pair (03 = calm intro, 04 = intense). Authored directly to §8.5
// and the §8 L3–6 band, matching the quality of the signed-off prototype levels 01/02.
// Doubled length: goal x:5120 → x:10280 (~2x). ODD archetype → NO key; the end gate is
// always math. Density LOCKED: 1 door + 1 enemy + the end math gate (mathGates: []).
//
// WHAT LEVEL-03 IS — A TOWN with its own SIGNATURE: ROOFTOPS + a covered ARCADE + an
// optional BELLTOWER. Distinct from level-01's single swamp ARCH and level-02's tall
// swamp SWITCHBACK SPIRE:
//
//   THE FORK (§8.5 rule 2, on F2): the approach to the rooftop climb splits into a
//   visible LOW road (walk the F2 street straight to the climb base) and a HIGH road
//   (hop the three fork ledges RF1→RF2→RF3 for THREE bonus coins, then drop back to F2).
//   Both diverge on F2 and rejoin at the climb base — nothing hidden. No key (odd).
//
//   THE ROOFTOP CLIMB (§8.5 rule 1, the mandatory vertical SIGNATURE): a stepped climb
//   over a 480px PLAZA PIT (F2 ends 1980 → F3 starts 2460) — RA(rise 70) → RB(rise 66)
//   → RC(the PEAK, rise 64, y:120 = a 200px climb from the street line) → a deliberate
//   DESCENT (RC → RD → down to F3). The peak is MANDATORY, not an optional detour: F3
//   starts at x:2460, BEYOND RB's rightward reach AND beyond RB→RD's reach, so from RB
//   the ONLY forward edge is UP to RC. The player genuinely goes UP ~200px and back
//   DOWN every run. RC carries the level's highest floor-side coin (y:64) as the reward.
//   A NOTCH more than level-01's 196px arch, and it's a townscape, not a swamp ridge.
//
//   THE COVERED ARCADE (§8 "L3–6 ceilings start appearing"): the town's first taste of
//   overhead cover. AR1 is a single awning over F4's street (a brief duck-under), and
//   the BELLTOWER (BT1→BT2→BT3, three OVERLAPPING h:16 tiers at rise 74) is an OPTIONAL
//   stacked climb to a 222px belltower top carrying bonus coins — the town's real
//   vertical flourish. EVERY overlapping tier pair clears the §3.2 headroom floor
//   (rise 74, h:16 → 74−16−32 = 26px ≥ 24) with ~70px x-overlap. These are the first
//   overlapping tiers in the game (levels 01/02 are open-air ceiling-free swamp) — but
//   they sit on OPTIONAL routes, so the REQUIRED path stays open and legible (§8.5
//   rule 6). Level-03 keeps ceilings FEWER and GENTLER than level-04 will (calm pair).
//
//   STEPPING STONES (§8.5 rule 3, anti-repetition): two low stones on F6 (SS1/SS2)
//   vary the beat with a gentle coin-hop between the climbs — a townsquare stepping-
//   stone detail, never a pit crossing (they sit on solid floor).
//
// STILL A CALM ODD INTRO, BUT A STEP UP FROM LEVEL-01 (§8.5 rule 5 — forgiving =
// generous, not flat):
//   * Gaps are the town-band 160px (§8: L3–6 = 140–160) — the deliberate step up from
//     level-01's 120/140 street. Every gap is a bare running jump (≤162 reach); the ONE
//     wide 480px span is the plaza pit, bridged ENTIRELY by the mandatory rooftop climb.
//   * The mandatory climb rises are a gentle 64–70px (the §8 non-overlapping 60–70
//     band), comfortably inside the 88.331px envelope. Overlapping tiers (arcade +
//     belltower) are the tight 74px climb band — but they are OPTIONAL, never on the
//     required street.
//   * 21 checkpoints — one near spawn, ONE ON EACH ROOFTOP-CLIMB TIER (RA/RB/RC) so a
//     missed climb hop or a fall into the plaza pit respawns a hop away, one before
//     EVERY spike, one before the enemy, one per floor stretch (§8.5 rule 4's guardrail:
//     falls into the plaza pit CAN happen, but the respawn always costs seconds).
//   * 4 spikes only (sparing for the calm town intro), each centered on a CLEAR floor
//     with ≥250px margin from BOTH edges (the 34.6-02 spike-before-gap/mount conflict
//     class) and clear of every platform's x-footprint (no ceiling-bonk, §3.5). NONE on
//     F0/F1 (welcome), the climb bases, or F12 (the run-in).
//
// Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds
// trap). bounds.right hand-bumped to 10380 (goal 10280 + GOAL_SIZE 16 + ~84px buffer;
// F12 ends 10400). bounds.top 0 — the town stays within the 360px screen (the belltower
// top BT3 y:98 and its coin y:42 are both well inside y 0–360).
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every street run

export const LEVEL_03 = {
  id: "level-03",
  displayName: "The Old Quarter",
  allowedTables: [3, 4, 5, 6, 7, 8, 9],

  bounds: { left: 0, right: 10380, top: 0, bottom: 360 },

  geometry: {
    // Street runs (one merged collider each), pinned to FLOOR_Y. Gaps are the town-band
    // 160px (§8 L3–6), the step up from level-01. The ONE wide span — the 480px plaza
    // pit 1980..2460 — is bridged ENTIRELY by the mandatory rooftop climb.
    floors: [
      { x: 0, w: 480 }, // F0 — spawn; the secret-alcove hop (PA)
      { x: 640, w: 560 }, // F1 — gap 480..640 (160); the one DOOR (@960)
      { x: 1360, w: 620 }, // F2 — gap 1200..1360 (160); the FORK (low road = this street)
      { x: 2460, w: 620 }, // F3 — the 480px PLAZA PIT is 1980..2460; rooftop landing + spike1
      { x: 3240, w: 620 }, // F4 — gap 3080..3240 (160); the covered ARCADE (AR1 awning)
      { x: 4020, w: 640 }, // F5 — gap 3860..4020 (160); the one ENEMY (@4360)
      { x: 4820, w: 620 }, // F6 — gap 4660..4820 (160); the STEPPING STONES (SS1/SS2)
      { x: 5600, w: 640 }, // F7 — gap 5440..5600 (160); the optional BELLTOWER overhead
      { x: 6400, w: 620 }, // F8 — gap 6240..6400 (160); spike2
      { x: 7180, w: 640 }, // F9 — gap 7020..7180 (160)
      { x: 7980, w: 620 }, // F10 — gap 7820..7980 (160); spike3
      { x: 8760, w: 640 }, // F11 — gap 8600..8760 (160); spike4
      { x: 9560, w: 840 }, // F12 — gap 9400..9560 (160); final calm run — the GOAL (@10280)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1), every y deliberately OFF the 16px grid
    // (§3.4). The mandatory rooftop climb + the fork are OPEN AIR (non-overlapping); the
    // OPTIONAL arcade awning + belltower carry the town's first overlapping tiers.
    platforms: [
      // --- Spawn-area optional hop that hosts the secret alcove (rise 66 from F0) ---
      { x: 280, y: 254, w: 120, h: 16 }, // PA — hosts alcove@320,184

      // --- THE FORK: the optional HIGH road over F2 (3 bonus coins), rejoining F2 ---
      { x: 1470, y: 250, w: 100, h: 16 }, // RF1 — rise 70 from F2
      { x: 1610, y: 186, w: 110, h: 16 }, // RF2 — rise 64 from RF1 (40px gap); the bonus peak
      { x: 1760, y: 250, w: 100, h: 16 }, // RF3 — the DESCENT: drop 64, walk off onto F2 (rejoin)

      // --- THE ROOFTOP CLIMB (bridges the 480px F2→F3 plaza pit): a MANDATORY 200px climb + descent ---
      { x: 2005, y: 250, w: 100, h: 16 }, // RA — rise 70 from F2 (25px gap off F2's edge)
      { x: 2130, y: 184, w: 100, h: 16 }, // RB — rise 66 from RA (25px gap)
      { x: 2260, y: 120, w: 130, h: 16 }, // RC — rise 64 from RB — the PEAK, y:120 = a 200px climb (wide rooftop)
      { x: 2405, y: 190, w: 96, h: 16 }, // RD — the DESCENT: drop 70 from the peak, then down to F3

      // --- THE COVERED ARCADE: one awning over F4's street (a brief duck-under, 1 coin) ---
      { x: 3340, y: 246, w: 130, h: 16 }, // AR1 — rise 74 from F4; the town's first overhead cover

      // --- STEPPING STONES: two low townsquare stones on F6 (on solid floor, never a pit) ---
      { x: 4980, y: 258, w: 80, h: 16 }, // SS1 — rise 62 from F6
      { x: 5140, y: 258, w: 80, h: 16 }, // SS2 — rise 62 from F6

      // --- THE BELLTOWER: an OPTIONAL stacked climb (3 overlapping tiers, rise 74, 222px top) ---
      { x: 5700, y: 246, w: 110, h: 16 }, // BT1 — rise 74 from F7
      { x: 5740, y: 172, w: 120, h: 16 }, // BT2 — rise 74 from BT1 (70px x-overlap); headroom 26
      { x: 5790, y: 98, w: 130, h: 16 }, // BT3 — rise 74 from BT2 (70px x-overlap); the belltower TOP, y:98 = 222px; bonus coins
    ],

    // ~40 coins — every one a fly-through box a driven player reaches (walk-family
    // placement: coin.y = surfaceY − 56). Bonus coins live on the fork high road (RF),
    // the rooftop peak (RC), the belltower (BT), and the stepping stones (SS).
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 400, y: 264 }, // F0
      { x: 330, y: 198 }, // on PA (near the secret alcove)
      { x: 760, y: 264 }, // F1 (before the door)
      { x: 1080, y: 264 }, // F1 (after the door)
      { x: 1400, y: 264 }, // F2 (the LOW road)
      { x: 1900, y: 264 }, // F2 (the LOW road, past the fork)
      { x: 1510, y: 194 }, // FORK high road — RF1 (bonus)
      { x: 1650, y: 130 }, // FORK high road — RF2 peak (bonus)
      { x: 1680, y: 130 }, // FORK high road — RF2 peak (bonus)
      { x: 1800, y: 194 }, // FORK high road — RF3 descent (bonus)
      { x: 2050, y: 194 }, // ROOFTOP ascent (RA)
      { x: 2170, y: 128 }, // ROOFTOP ascent (RB)
      { x: 2320, y: 64 }, // ROOFTOP PEAK (RC) — the climb's reward, the highest floor-side coin
      { x: 2445, y: 134 }, // ROOFTOP descent (RD)
      { x: 2600, y: 264 }, // F3 (before spike1)
      { x: 2900, y: 264 }, // F3 (past spike1)
      { x: 3300, y: 264 }, // F4 street (before the arcade)
      { x: 3400, y: 190 }, // on the ARCADE awning (AR1)
      { x: 4100, y: 264 }, // F5 (before the enemy)
      { x: 4500, y: 264 }, // F5 (past the enemy)
      { x: 4880, y: 264 }, // F6
      { x: 5020, y: 202 }, // on stepping stone SS1
      { x: 5180, y: 202 }, // on stepping stone SS2
      { x: 5340, y: 264 }, // F6
      { x: 5650, y: 264 }, // F7 street (under the belltower)
      { x: 5750, y: 190 }, // BELLTOWER — BT1 (bonus)
      { x: 5800, y: 116 }, // BELLTOWER — BT2 (bonus)
      { x: 5850, y: 42 }, // BELLTOWER TOP — BT3 (bonus, the 222px reward)
      { x: 6500, y: 264 }, // F8 (before spike2)
      { x: 6900, y: 264 }, // F8 (past spike2)
      { x: 7280, y: 264 }, // F9
      { x: 7600, y: 264 }, // F9
      { x: 8100, y: 264 }, // F10 (before spike3)
      { x: 8480, y: 264 }, // F10 (past spike3)
      { x: 8900, y: 264 }, // F11 (before spike4)
      { x: 9280, y: 264 }, // F11 (past spike4)
      { x: 9700, y: 264 }, // F12
      { x: 10050, y: 264 }, // F12
      { x: 10200, y: 264 }, // F12 (final step to the goal)
    ],

    // 4 floor spikes, each centered on a CLEAR street with ≥250px margin from BOTH edges
    // (the 34.6-02 spike-before-gap/mount conflict class) and clear of EVERY platform's
    // x-span (no ceiling-bonk, §3.5). Sparing for the calm town intro; NONE on F0/F1
    // (welcome), the climb bases, or F12 (the run-in).
    spikes: [
      { x: 2790, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2460..3080) — L330 / R290, clear of RD (ends 2501)
      { x: 6710, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F8 (6400..7020) — L310 / R310
      { x: 8290, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F10 (7980..8600) — L310 / R310
      { x: 9080, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F11 (8760..9400) — L320 / R320
    ],

    // Goal caps the final run — x:10280 (~2x the old 5120; F12 ends 10400, a 120px buffer).
    goal: { x: 10280, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, ONE ON EACH ROOFTOP-CLIMB TIER (RA/RB/RC) so a
    // missed climb hop or a fall into the plaza pit respawns a hop away, one before EVERY
    // spike, one before the enemy, and one per street stretch. Checkpoint y matches the
    // surface it sits on (FLOOR_Y−48 on floors, tier.y−48 on each climb platform).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 680, y: FLOOR_Y - 48 }, // F1 start — before the door@960
      { x: 1340, y: FLOOR_Y - 48 }, // F2 start — before the fork + rooftop climb (pre-pit)
      { x: 2030, y: 250 - 48 }, // RA — rooftop ascent tier 1
      { x: 2155, y: 184 - 48 }, // RB — rooftop ascent tier 2
      { x: 2285, y: 120 - 48 }, // RC — the PEAK (a missed descent leap costs ~1s)
      { x: 2500, y: FLOOR_Y - 48 }, // F3 — rooftop landing (post-pit)
      { x: 2700, y: FLOOR_Y - 48 }, // before spike1@2790 (F3)
      { x: 3260, y: FLOOR_Y - 48 }, // F4 start — the arcade
      { x: 4040, y: FLOOR_Y - 48 }, // F5 start
      { x: 4300, y: FLOOR_Y - 48 }, // just before the enemy@4360 (F5)
      { x: 4840, y: FLOOR_Y - 48 }, // F6 start — the stepping stones
      { x: 5620, y: FLOOR_Y - 48 }, // F7 start — before the belltower
      { x: 6410, y: FLOOR_Y - 48 }, // F8 start
      { x: 6630, y: FLOOR_Y - 48 }, // before spike2@6710 (F8)
      { x: 7200, y: FLOOR_Y - 48 }, // F9 start
      { x: 8000, y: FLOOR_Y - 48 }, // F10 start
      { x: 8210, y: FLOOR_Y - 48 }, // before spike3@8290 (F10)
      { x: 8780, y: FLOOR_Y - 48 }, // F11 start
      { x: 9000, y: FLOOR_Y - 48 }, // before spike4@9080 (F11)
      { x: 9580, y: FLOOR_Y - 48 }, // F12 start — the final calm run to the goal
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. On solid F1
    // (left margin 320, right margin 240), clear of the gaps on either side.
    doors: [
      { x: 960, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density locked at exactly 1 door + 1 enemy +
    // the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F5 (@4360), PAST the mandatory rooftop climb, so triggering
    // it in-engine proves the climb was driven. Left margin 340, right margin 300.
    enemies: [
      { x: 4360, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 1 },
    ],

    // Exactly ONE secret alcove — ~70px above PA's surface (y:254). Off the required path,
    // never signposted. Level-03 places NO key (odd archetype) — no geometry.keys/locks.
    secretAlcove: [
      { x: 320, y: 184 },
    ],
  },

  mechanics: [],
  biome: "town", // level 3 of 8 — Castlevania arc calm->harsh (levels 3-4 town)
  parallax: null,
};
