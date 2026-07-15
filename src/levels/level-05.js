// src/levels/level-05.js — "The Sunken Yard" descriptor.
//
// ===========================================================================
// PHASE 34.6 REBUILD — THE RAISED BAR (docs/LEVEL-DESIGN.md §8.5), CEMETERY INTRO.
// ===========================================================================
// level-05 is REBUILT FROM SCRATCH (append-only convention SUSPENDED, §9.1) as the
// calmer of the cemetery pair (05 = calm intro, 06 = intense). Authored directly to
// §8.5 and the §8 L3–6 band, matching the quality of the signed-off levels 01/02/03.
// Doubled length: goal x:3340 → x:6930 (~2x). ODD archetype → NO key; the end gate is
// always math. Density LOCKED: 1 door + 1 enemy + the end math gate (mathGates: []).
//
// WHAT LEVEL-05 IS — A GRAVEYARD with its own SIGNATURE: a tall MAUSOLEUM climb over a
// sunken crypt, an optional CRYPT VAULT of stacked stone, and a ROW OF TOMBSTONES.
// Distinct from level-01's single swamp ARCH, level-02's swamp SWITCHBACK SPIRE, and
// level-03's TOWNSCAPE (rooftops + arcade + belltower):
//
//   THE FORK (§8.5 rule 2, on F2): the approach to the mausoleum splits into a visible
//   LOW road (walk the F2 graveyard path straight to the crypt) and a HIGH road (hop the
//   three GRAVE-MOUND ledges GM1→GM2→GM3 for THREE bonus coins, then drop back to F2).
//   Both diverge on F2 and rejoin at the mausoleum base — nothing hidden. No key (odd).
//
//   THE MAUSOLEUM (§8.5 rule 1, the mandatory vertical SIGNATURE): a stepped climb over
//   a 700px SUNKEN CRYPT PIT (F2 ends 1960 → F3 starts 2660) — RA(rise 70) → RB(rise 68)
//   → RC(rise 64) → RD(the PEAK, rise 58, y:60 = a 260px climb from the graveyard line)
//   → a deliberate DESCENT (RD → RE → down to F3). The peak is MANDATORY, not an optional
//   detour: from RC the ONLY forward edge is UP to RD — RE (gap 230 > 162 reach) and F3
//   are both beyond a bare running jump, so the player genuinely goes UP ~260px and back
//   DOWN every run. A clear NOTCH taller than level-03's 200px rooftop — a real graveyard
//   mausoleum you climb over, not a townhouse. RD carries the level's highest coin (y:4)
//   as the climb's reward.
//
//   THE CRYPT VAULT (§8 "L3–6 ceilings start appearing"): an OPTIONAL stacked climb of
//   three OVERLAPPING h:16 tiers (VT1→VT2→VT3, rise 74 each) to a 222px vault top carrying
//   bonus coins — the cemetery's stone overhead cover. EVERY overlapping pair clears the
//   §3.2 headroom floor (rise 74, h:16 → 74−16−32 = 26px ≥ 24) with ~70px x-overlap. Like
//   level-03's belltower these sit on an OPTIONAL route, so the REQUIRED graveyard path
//   stays open and legible (§8.5 rule 6). Calm cemetery → fewer/gentler ceilings than
//   level-06 will carry.
//
//   THE TOMBSTONE ROW (§8.5 rule 3, anti-repetition): three low tombstone stones on F6
//   (SS1/SS2/SS3, rise 62) vary the beat with a gentle coin-hop between the climbs — a
//   graveyard stepping-stone detail, never a pit crossing (they sit on solid floor).
//
// STILL A CALM ODD INTRO, BUT A STEP UP FROM LEVEL-03 (§8.5 rule 5 — forgiving =
// generous, not flat):
//   * Gaps are the cemetery-band 140–160px (§8 L3–6). Every gap is a bare running jump
//     (≤162 reach); the ONE wide 700px span is the sunken crypt pit, bridged ENTIRELY by
//     the mandatory mausoleum climb.
//   * The mandatory climb rises are a gentle 58–70px (the §8 non-overlapping 60–70 band),
//     comfortably inside the 88.331px envelope — never pushed to the limit. Overlapping
//     tiers (the crypt vault) are the tight 74px band — but OPTIONAL, never on the path.
//   * The mausoleum peaks at y:60 (a 260px climb) — the step up from level-03's 200px
//     rooftop: taller AND with a longer two-tier descent (RD→RE→F3), a real "over the
//     mausoleum and down into the sunken yard."
//   * 16 checkpoints — one near spawn, ONE ON EACH MAUSOLEUM TIER (RA/RB/RC/RD) so a
//     missed climb hop or a fall into the crypt pit respawns a hop away, one before EVERY
//     spike, one before the enemy, one per graveyard stretch (§8.5 rule 4's guardrail:
//     falls into the crypt pit CAN happen — real stakes — but the respawn always costs
//     seconds, never progress).
//   * 2 spikes only (sparing for the calm cemetery intro; the crypt pit is the main fall
//     hazard), each centered on a CLEAR floor with ≥250px margin from BOTH edges (the
//     34.6-02 spike-before-gap/mount conflict class) and clear of every platform's
//     x-footprint (no ceiling-bonk, §3.5). NONE on F0/F1 (welcome) or F8 (the run-in).
//
//   CONTRAST WITH LEVEL-06 (deliberate): level-05 is the calm cemetery intro — one
//   mandatory mausoleum, gentle rises, optional ceilings only. Level-06 (the intense
//   cemetery even level) will climb higher through multiple switchbacks with required
//   ceilings and the math-skip key. Level-05 is clearly the gentler of the pair.
//
// Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds trap).
// bounds.right hand-bumped to 7020 (goal 6930 + GOAL_SIZE 16 + ~74px buffer; F8 ends
// 7130). bounds.top 0 — the yard stays within the 360px screen (the mausoleum peak RD
// y:60 and its coin y:4 are both inside y 0–360).
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every graveyard run

export const LEVEL_05 = {
  id: "level-05",
  displayName: "The Sunken Yard",
  allowedTables: [2, 3, 4, 5],

  bounds: { left: 0, right: 7020, top: 0, bottom: 360 },

  geometry: {
    // Graveyard runs (one merged collider each), pinned to FLOOR_Y. Gaps are the
    // cemetery-band 140–160px (§8 L3–6). The ONE wide span — the 700px sunken crypt pit
    // 1960..2660 — is bridged ENTIRELY by the mandatory mausoleum climb.
    floors: [
      { x: 0, w: 480 }, // F0 — spawn; the secret-alcove hop (PA)
      { x: 630, w: 560 }, // F1 — gap 480..630 (150); the one DOOR (@900)
      { x: 1340, w: 620 }, // F2 — gap 1190..1340 (150); the FORK (low road = this path)
      { x: 2660, w: 600 }, // F3 — the 700px SUNKEN CRYPT PIT is 1960..2660; mausoleum landing + spike1
      { x: 3410, w: 620 }, // F4 — gap 3260..3410 (150); the optional CRYPT VAULT overhead
      { x: 4190, w: 620 }, // F5 — gap 4030..4190 (160); the one ENEMY (@4450)
      { x: 4960, w: 640 }, // F6 — gap 4810..4960 (150); the TOMBSTONE ROW (SS1/SS2/SS3)
      { x: 5740, w: 600 }, // F7 — gap 5600..5740 (140); spike2
      { x: 6490, w: 640 }, // F8 — gap 6340..6490 (150); final calm run — the GOAL (@6930)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1), every y deliberately OFF the 16px grid
    // (§3.4). The mandatory mausoleum climb + the grave-mound fork are OPEN AIR
    // (non-overlapping); the OPTIONAL crypt vault carries the cemetery's overlapping tiers.
    platforms: [
      // --- Spawn-area optional hop that hosts the secret alcove (rise 66 from F0) ---
      { x: 280, y: 254, w: 120, h: 16 }, // PA — hosts alcove@320,184

      // --- THE FORK: the optional HIGH road over F2 (3 bonus coins), rejoining F2 ---
      { x: 1450, y: 250, w: 100, h: 16 }, // GM1 — grave mound, rise 70 from F2
      { x: 1590, y: 186, w: 110, h: 16 }, // GM2 — rise 64 from GM1 (40px gap); the bonus peak
      { x: 1740, y: 250, w: 100, h: 16 }, // GM3 — the DESCENT: drop 64, walk off onto F2 (rejoin)

      // --- THE MAUSOLEUM (bridges the 700px F2→F3 crypt pit): a MANDATORY 260px climb + descent ---
      { x: 1990, y: 250, w: 90, h: 16 }, // RA — rise 70 from F2 (30px gap off F2's edge)
      { x: 2105, y: 182, w: 90, h: 16 }, // RB — rise 68 from RA (25px gap)
      { x: 2220, y: 118, w: 90, h: 16 }, // RC — rise 64 from RB (25px gap)
      { x: 2335, y: 60, w: 120, h: 16 }, // RD — rise 58 from RC (25px gap) — the PEAK, y:60 = a 260px climb (wide crypt roof)
      { x: 2510, y: 150, w: 90, h: 16 }, // RE — the DESCENT: drop 90 from the peak, then down to F3

      // --- THE CRYPT VAULT: an OPTIONAL stacked climb (3 overlapping tiers, rise 74, 222px top) ---
      { x: 3510, y: 246, w: 110, h: 16 }, // VT1 — rise 74 from F4; the cemetery's first overhead stone
      { x: 3550, y: 172, w: 120, h: 16 }, // VT2 — rise 74 from VT1 (70px x-overlap); headroom 26
      { x: 3590, y: 98, w: 130, h: 16 }, // VT3 — rise 74 from VT2 (80px x-overlap); the vault TOP, y:98 = 222px; bonus coins

      // --- THE TOMBSTONE ROW: three low stones on F6 (on solid floor, never a pit) ---
      { x: 5060, y: 258, w: 80, h: 16 }, // SS1 — tombstone, rise 62 from F6
      { x: 5220, y: 258, w: 80, h: 16 }, // SS2 — tombstone, rise 62 from F6
      { x: 5380, y: 258, w: 80, h: 16 }, // SS3 — tombstone, rise 62 from F6
    ],

    // ~35 coins — every one a fly-through box a driven player reaches (walk-family
    // placement: coin.y = surfaceY − 56). Bonus coins live on the fork high road (GM),
    // the mausoleum peak (RD), the crypt vault (VT), and the tombstone row (SS).
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 400, y: 264 }, // F0
      { x: 330, y: 198 }, // on PA (near the secret alcove)
      { x: 760, y: 264 }, // F1 (before the door)
      { x: 1080, y: 264 }, // F1 (after the door)
      { x: 1400, y: 264 }, // F2 (the LOW road)
      { x: 1900, y: 264 }, // F2 (the LOW road, past the fork)
      { x: 1490, y: 194 }, // FORK high road — GM1 (bonus)
      { x: 1640, y: 130 }, // FORK high road — GM2 peak (bonus)
      { x: 1670, y: 130 }, // FORK high road — GM2 peak (bonus)
      { x: 1790, y: 194 }, // FORK high road — GM3 descent (bonus)
      { x: 2030, y: 194 }, // MAUSOLEUM ascent (RA)
      { x: 2145, y: 126 }, // MAUSOLEUM ascent (RB)
      { x: 2260, y: 62 }, // MAUSOLEUM ascent (RC)
      { x: 2385, y: 4 }, // MAUSOLEUM PEAK (RD) — the climb's reward, the highest coin
      { x: 2555, y: 94 }, // MAUSOLEUM descent (RE)
      { x: 2760, y: 264 }, // F3 (before spike1)
      { x: 3100, y: 264 }, // F3 (past spike1)
      { x: 3450, y: 264 }, // F4 path (before the vault)
      { x: 3560, y: 190 }, // CRYPT VAULT — VT1 (bonus)
      { x: 3600, y: 116 }, // CRYPT VAULT — VT2 (bonus)
      { x: 3650, y: 42 }, // CRYPT VAULT TOP — VT3 (bonus, the 222px reward)
      { x: 3950, y: 264 }, // F4 (past the vault)
      { x: 4280, y: 264 }, // F5 (before the enemy)
      { x: 4650, y: 264 }, // F5 (past the enemy)
      { x: 5010, y: 264 }, // F6
      { x: 5100, y: 202 }, // on tombstone SS1
      { x: 5260, y: 202 }, // on tombstone SS2
      { x: 5420, y: 202 }, // on tombstone SS3
      { x: 5540, y: 264 }, // F6
      { x: 5850, y: 264 }, // F7 (before spike2)
      { x: 6180, y: 264 }, // F7 (past spike2)
      { x: 6600, y: 264 }, // F8
      { x: 6800, y: 264 }, // F8
      { x: 6910, y: 264 }, // F8 (final step to the goal)
    ],

    // 2 floor spikes, each centered on a CLEAR graveyard run with ≥250px margin from BOTH
    // edges (the 34.6-02 spike-before-gap/mount conflict class) and clear of EVERY
    // platform's x-span (no ceiling-bonk, §3.5). Sparing for the calm cemetery intro (the
    // sunken crypt pit is the main fall hazard); NONE on F0/F1 (welcome) or F8 (the run-in).
    spikes: [
      { x: 2960, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2660..3260) — L300 / R300, clear of RE (ends 2600)
      { x: 6040, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (5740..6340) — L300 / R300
    ],

    // Goal caps the final run — x:6930 (~2x the old 3340; F8 ends 7130, a 200px buffer).
    goal: { x: 6930, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, ONE ON EACH MAUSOLEUM TIER (RA/RB/RC/RD) so a
    // missed climb hop or a fall into the crypt pit respawns a hop away, one before EVERY
    // spike, one before the enemy, and one per graveyard stretch. Checkpoint y matches the
    // surface it sits on (FLOOR_Y−48 on floors, tier.y−48 on each mausoleum platform).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 680, y: FLOOR_Y - 48 }, // F1 start — before the door@900
      { x: 1340, y: FLOOR_Y - 48 }, // F2 start — before the fork + mausoleum (pre-pit)
      { x: 2000, y: 250 - 48 }, // RA — mausoleum ascent tier 1
      { x: 2115, y: 182 - 48 }, // RB — mausoleum ascent tier 2
      { x: 2225, y: 118 - 48 }, // RC — mausoleum ascent tier 3
      { x: 2360, y: 60 - 48 }, // RD — the PEAK (a missed descent leap costs ~1s)
      { x: 2680, y: FLOOR_Y - 48 }, // F3 — mausoleum landing (post-pit)
      { x: 2870, y: FLOOR_Y - 48 }, // before spike1@2960 (F3)
      { x: 3420, y: FLOOR_Y - 48 }, // F4 start — the crypt vault
      { x: 4200, y: FLOOR_Y - 48 }, // F5 start
      { x: 4360, y: FLOOR_Y - 48 }, // just before the enemy@4450 (F5)
      { x: 4970, y: FLOOR_Y - 48 }, // F6 start — the tombstone row
      { x: 5750, y: FLOOR_Y - 48 }, // F7 start
      { x: 5950, y: FLOOR_Y - 48 }, // before spike2@6040 (F7)
      { x: 6500, y: FLOOR_Y - 48 }, // F8 start — the final calm run to the goal
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. On solid F1
    // (left margin 270, right margin 290), clear of the gaps on either side.
    doors: [
      { x: 900, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density locked at exactly 1 door + 1 enemy +
    // the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F5 (@4450), PAST the mandatory mausoleum climb, so triggering
    // it in-engine proves the climb was driven. Left margin 260, right margin 360.
    enemies: [
      { x: 4450, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 2 }, // graveyard wraith (fly variant)
    ],

    // Exactly ONE secret alcove — ~70px above PA's surface (y:254). Off the required path,
    // never signposted. Level-05 places NO key (odd archetype) — no geometry.keys/locks.
    secretAlcove: [
      { x: 320, y: 184 },
    ],
  },

  mechanics: [],
  biome: "cemetery", // level 5 of 8 — Castlevania arc calm->harsh (levels 5-6 cemetery)
  parallax: null,
};
