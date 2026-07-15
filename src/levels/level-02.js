// src/levels/level-02.js — "The Rusted Climb" descriptor, REBUILT from scratch
// (Phase 34.6, LEN-01/LEN-02). The append-only convention (LEVEL-DESIGN.md §9.1) is
// explicitly SUSPENDED for this phase — this is a whole-cloth rewrite, not an
// extension of the old geometry. The old Phase-24-lengthened geometry (goal at
// 4200, throwaway 34.5 key+lock pair at x:900/x:3960) is gone; see git history.
//
// EVEN level (intense + vertical swamp, LEVEL-DESIGN §8 L1-2 band): 120px gaps,
// gentle 60-70px rises, and ZERO overlapping platform tiers anywhere — no ceilings
// at all (Pitfall 1: "vertical" is achieved with tall single-tier climbs and
// deliberate DESCENTS in OPEN AIR, never by stacking platforms into a ceiling).
// Roughly doubled in length (goal.x 4200 -> 8180) with THREE ascent/descent humps
// (two plain, one carrying the optional math-skip KEY on its peak tier) instead of
// level-01's one — the intensity/verticality escalation the biome-pair rhythm
// calls for.
//
// THE KEY (KEY-02/LEN-02, 34.6-CONTEXT.md): an OPTIONAL math-skip token on the
// harder HIGH ROUTE over floor-5/6's gap. NO geometry.locks — a held key clears the
// level with full XP and skips the end math challenge entirely (see game.js
// onReachGoal's heldKeyIds branch, Phase 34.6 Plan 01). The safe GROUND route
// crosses the same stretch via a plain 120px gap with no key and no penalty for
// skipping the high route — visible, never hidden (ADHD-safe backtracking rule).
//
// This is a PURE data module: no engine globals (a727c13). The ONLY import is
// ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_02 = {
  id: "level-02",
  displayName: "The Rusted Climb",
  allowedTables: [2, 3, 4, 5, 6, 7],

  // Explicit, COMPLETE 4-field bounds literal (level-02+ convention, used AS-IS —
  // LEVEL-DESIGN §7's bounds-convention trap). Hand-bumped to the new extent: the
  // final floor run (F11) ends at 8300, matching the shipped "bounds.right ==
  // final floor's end" convention. top stays 0 — every hump/high-route peak in
  // this level stays within the visible 0-360 screen (deepest peak y:185, well
  // clear of 0), unlike level-07/08's negative-top summit climbs.
  bounds: { left: 0, right: 8300, top: 0, bottom: 360 },

  geometry: {
    // 12 contiguous floor runs, pinned to FLOOR_Y. Standard 120px gaps throughout
    // (bare running-jump crossable); the two 410px spans (F3->F4, F8->F9) are the
    // wide exceptions, each bridged entirely by an ascent/descent hump below.
    floors: [
      { x: 0, w: 600 }, // spawn — secret alcove hop
      { x: 720, w: 460 }, // gap 600..720 (120) — the one door
      { x: 1300, w: 520 }, // gap 1180..1300 (120) — spike1, centered 260/260 margins
      { x: 1940, w: 360 }, // gap 1820..1940 (120) — leads into HUMP A
      { x: 2710, w: 520 }, // gap 2300..2710 (410, bridged by HUMP A) — spike2, 260/260
      { x: 3350, w: 600 }, // gap 3230..3350 (120) — the one enemy + the optional HIGH ROUTE (key)
      { x: 4070, w: 520 }, // gap 3950..4070 (120, the safe ground route across the key gap) — spike3, 260/260
      { x: 4710, w: 520 }, // gap 4590..4710 (120) — spike4, 260/260
      { x: 5350, w: 360 }, // gap 5230..5350 (120) — leads into HUMP B
      { x: 6120, w: 520 }, // gap 5710..6120 (410, bridged by HUMP B) — spike5, 260/260
      { x: 6760, w: 520 }, // gap 6640..6760 (120) — spike6, 260/260
      { x: 7400, w: 900 }, // gap 7280..7400 (120) — final calm run to the goal
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, LEVEL-DESIGN §3.1), every y
    // deliberately off the 16px grid (§3.4). ZERO platform pairs overlap in x
    // anywhere in this level (L1-2's "no ceilings at all" rule, §8) — every rise
    // is 65-70px between non-overlapping tiers, separated by small 10-40px gaps
    // (the same open-air hump idiom level-01 already proved in-engine).
    platforms: [
      { x: 280, y: 254, w: 120, h: 16 }, // early optional hop over F0 — hosts the secret alcove (rise 66)

      // --- HUMP A: ascent + DESCENT, bridges the 410px F3->F4 gap. ---
      { x: 2320, y: 250, w: 100, h: 16 }, // HA1 ascent (rise 70 from F3)
      { x: 2440, y: 185, w: 110, h: 16 }, // HA2 peak (rise 65 from HA1)
      { x: 2560, y: 250, w: 110, h: 16 }, // HA3 DESCENT (drop 65 from the peak)

      // --- OPTIONAL HIGH ROUTE: mounts from F5 before it ends, carries the
      // math-skip KEY on its peak tier (HR2, in a WALKED stretch away from both
      // the landing zone and the next takeoff — Pitfall 3), then descends back
      // toward F6's floor. The safe ground route (the 3950..4070 gap on F5/F6)
      // needs no detour at all — this climb is purely optional risk/reward. ---
      { x: 3740, y: 254, w: 110, h: 16 }, // HR1 ascent (rise 66 from F5)
      { x: 3890, y: 188, w: 140, h: 16 }, // HR2 peak — THE KEY TIER (rise 66 from HR1); wide (140) so the key sits in a genuine walked middle stretch
      { x: 4070, y: 254, w: 110, h: 16 }, // HR3 DESCENT (drop 66) — lands back over F6's start

      // --- HUMP B: second ascent + DESCENT, bridges the 410px F8->F9 gap. ---
      { x: 5730, y: 250, w: 100, h: 16 }, // HB1 ascent (rise 70 from F8)
      { x: 5850, y: 185, w: 110, h: 16 }, // HB2 peak (rise 65 from HB1)
      { x: 5970, y: 250, w: 110, h: 16 }, // HB3 DESCENT (drop 65 from the peak)
    ],

    // 35 coins (roughly double the old 15) — every one a fly-through box a driven
    // player actually reaches (walk-family: coin.y = surfaceY - 56). Each hump's
    // peak carries a bonus arc coin (surfaceY - 91-ish), matching level-01's
    // reward-for-climbing convention; the high route's peak carries the key-side
    // bonus coin too.
    coins: [
      { x: 150, y: 264 },
      { x: 340, y: 198 }, // on the early optional platform (near the secret alcove)
      { x: 520, y: 264 },
      { x: 800, y: 264 },
      { x: 1080, y: 264 },
      { x: 1350, y: 264 },
      { x: 1700, y: 264 },
      { x: 2000, y: 264 },
      { x: 2200, y: 264 },
      { x: 2360, y: 194 }, // HUMP A ascent tier
      { x: 2480, y: 129 }, // HUMP A peak — bonus
      { x: 2600, y: 194 }, // HUMP A descent tier
      { x: 2760, y: 264 },
      { x: 3080, y: 264 },
      { x: 3420, y: 264 },
      { x: 3700, y: 264 }, // ground-route coin, just before the safe gap
      { x: 3770, y: 198 }, // HIGH ROUTE tier 1
      { x: 3980, y: 132 }, // HIGH ROUTE peak (HR2) — bonus, near the key
      { x: 4110, y: 198 }, // HIGH ROUTE descent tier (HR3)
      { x: 4150, y: 264 },
      { x: 4470, y: 264 },
      { x: 4750, y: 264 },
      { x: 5120, y: 264 },
      { x: 5420, y: 264 },
      { x: 5620, y: 264 },
      { x: 5770, y: 194 }, // HUMP B ascent tier
      { x: 5900, y: 129 }, // HUMP B peak — bonus
      { x: 6020, y: 194 }, // HUMP B descent tier
      { x: 6180, y: 264 },
      { x: 6560, y: 264 },
      { x: 6820, y: 264 },
      { x: 7180, y: 264 },
      { x: 7460, y: 264 },
      { x: 7760, y: 264 },
      { x: 8060, y: 264 },
    ],

    // 6 floor spikes (up from the old 4 non-throwaway spikes), each centered on
    // its floor run with a ~250-260px margin from BOTH edges (the spike-before-
    // gap-takeoff margin discipline 34.6-02 proved necessary via the in-engine
    // harness), and clear of every platform's x-span (no ceiling-bonk risk — no
    // platform sits above any spike in this level).
    spikes: [
      { x: 1560, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (1300..1820) — 260/260
      { x: 2970, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F4 (2710..3230) — 260/260
      { x: 4330, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (4070..4590) — 260/260
      { x: 4970, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (4710..5230) — 260/260
      { x: 6380, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F9 (6120..6640) — 260/260
      { x: 7020, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F10 (6760..7280) — 260/260
    ],

    // Goal caps the final run (goal.x ~2x the old 4200; 104px buffer before F11's
    // end at 8300, comfortably past the shipped 64-80px convention).
    goal: { x: 8180, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, one just before EVERY spike, plus extra
    // safety nets before each hump/high-route entry (a fall during a long climb
    // must never cost meaningful progress — ADHD-safe, matching level-01's
    // precedent of un-mandated but generous extra checkpoints).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start-area checkpoint
      { x: 740, y: FLOOR_Y - 48 }, // early safety net (start of F1, before the door)
      { x: 1480, y: FLOOR_Y - 48 }, // before spike1 (x=1560)
      { x: 1960, y: FLOOR_Y - 48 }, // before HUMP A's entry (start of F3)
      { x: 2890, y: FLOOR_Y - 48 }, // before spike2 (x=2970)
      { x: 3370, y: FLOOR_Y - 48 }, // before the enemy + the HIGH ROUTE entry (start of F5)
      { x: 4250, y: FLOOR_Y - 48 }, // before spike3 (x=4330)
      { x: 4890, y: FLOOR_Y - 48 }, // before spike4 (x=4970)
      { x: 5370, y: FLOOR_Y - 48 }, // before HUMP B's entry (start of F8)
      { x: 6300, y: FLOOR_Y - 48 }, // before spike5 (x=6380)
      { x: 6940, y: FLOOR_Y - 48 }, // before spike6 (x=7020)
      { x: 7420, y: FLOOR_Y - 48 }, // start of the final calm run to the goal
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate.
    // Sits mid-F1, well clear of the gaps on either side (220/240px margins).
    doors: [
      { x: 940, y: FLOOR_Y - CONFIG.DOOR.H },
    ],

    // Mid-level checkpoint gates: NONE — density locked at exactly
    // 1 door + 1 enemy + the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F5, well clear of the gaps and the high route's
    // mount point.
    enemies: [
      { x: 3600, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 },
    ],

    // The math-skip KEY (KEY-02/LEN-02) — NO geometry.locks (math-skip = keys
    // WITHOUT locks). Sits on the HIGH ROUTE peak tier (HR2, x:3890..4030), at
    // x:3950 — comfortably inside the platform's own walked middle stretch (60px
    // past HR1's landing zone at HR2's left edge, 80px before HR2's takeoff for
    // HR3 at its right edge), so a driven player naturally walks through it, never
    // sailing over it mid-arc (Pitfall 3 — the exact 34.5 x:760 defect class).
    // y = HR2's surface (188) minus 32, the player's own collider height (WR-02;
    // NOT CONFIG.KEY.H), so the trigger box sits flush with a standing player's
    // top edge on that specific tier.
    keys: [{ x: 3950, y: 188 - 32 }],
    // NO physical lock geometry anywhere in this descriptor — this is the
    // math-skip usage (key-held clears the level directly with full XP; missing
    // it just means answering the end math gate as normal — see game.js's
    // heldKeyIds branch, Phase 34.6 Plan 01).

    // Exactly ONE secret alcove, ~70px above the early optional platform
    // (x:280, y:254, w:120) — off the required path, never signposted.
    secretAlcove: [
      { x: 320, y: 184 },
    ],
  },

  mechanics: [],
  biome: "swamp", // Phase 32 (ART-02/ART-03) — level 2 of 8, Castlevania arc calm->harsh (levels 1-2 swamp)
  parallax: null,
};
