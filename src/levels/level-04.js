// src/levels/level-04.js — "The Clocktower" descriptor.
//
// ===========================================================================
// PHASE 34.6 REBUILD — THE RAISED BAR (docs/LEVEL-DESIGN.md §8.5), TOWN EVEN.
// ===========================================================================
// level-04 is REBUILT FROM SCRATCH (append-only convention SUSPENDED, §9.1) as the
// INTENSE half of the town pair (03 = calm Old Quarter intro, 04 = intense Clocktower).
// Authored directly to §8.5 and the §8 L3–6 band. It is the SECOND even level on the
// 02→04→06→08 intensity ladder, so it must climb HIGHER than the approved even prototype
// level-02 "The Rusted Spire" (518px) and LOWER than level-06 "The Necropolis" (666px) —
// keeping the ramp monotonic. It does: the main goal route crests a 592px clocktower
// spire, and the optional math-skip KEY sits at a 666px apex. EVEN archetype → intense +
// vertical + the math-skip KEY. Density LOCKED: 1 door + 1 enemy + the end math gate
// (mathGates: []).
//
// WHAT LEVEL-04 IS — "THE CLOCKTOWER": a great town CLOCKTOWER you climb over the
// market-square pit (a mandatory 592px switchback spire with a visible DIAMOND FORK of
// two tenement routes), a GANTRY-STAIR descent down its far face, a second optional
// TENEMENT-STACKS climb+drop, market stalls, and a final run past the town watchman.
// Its SIGNATURE is THE CLOCKTOWER-OVER-THE-MARKET-SQUARE — distinct from level-03's
// rooftops+arcade+belltower calm intro, level-02's swamp Rusted Spire, level-06's
// cemetery cathedral spire, and level-08's castle throne keep:
//
//   THE CLOCKTOWER (spire 1, the mandatory 592px vertical SIGNATURE): a climb off F4
//   that, at the fork tier T2, SPLITS into a visible DIAMOND — a wide gentle LOW road
//   (L, up-RIGHT, the safe way) vs a narrow HIGH road (H, up-LEFT, carrying THREE bonus
//   coins) — the two roads rejoining at tier T4. Above the fork it becomes a real
//   SWITCHBACK: T4 → T5 → T6[up-LEFT reversal] → T7 → SU[up-RIGHT summit]. SU sits at
//   y:-272 — a 592px climb from the market line, TALLER than level-02's 518px summit and
//   SHORTER than level-06's 666px (the monotonic even-ladder step the human asked for).
//
//   THE KEY APEX (the math-skip token, the single hardest reach): KA, a spur ONE tier
//   ABOVE the summit at y:-346 (a 666px apex — the HIGHEST reach in the level), reachable
//   ONLY from SU (the tier below it, T7, is 148px down — out of a single hop's ~88px
//   reach). The goal route never passes it (it descends SU → DA to the right); grabbing
//   the key is a real risk/reward detour up-LEFT off the summit. Key-held = free clear,
//   full XP=20; key-skipped = the end math gate as normal (geometry.keys, NO geometry.locks).
//
//   DESCENT 1 — THE GANTRY STAIR (real going-DOWN, #1): from SU's far-right end a rightward
//   stair of drop-ledges (DA → DB → DC) descends ~592px back to the market floor F5. SU is
//   wide-right so ONLY it — not any lower tier — reaches DA (T7 ends 3240, out of the ~162px
//   running reach across the 320px gap to DA), making the full crest MANDATORY (the level-02
//   "summit shortcut" defect class, closed here by construction).
//
//   THE TENEMENT STACKS (a SECOND vertical feature + #2 going-backwards/up-down): off F5 a
//   short optional stacked climb (TN1 → TN2 → TN3) rises ~222px to a tenement roof carrying
//   bonus coins, then DROPS rightward onto F6 — a visible HIGH road that diverges from the
//   safe LOW road (walk F5 → jump the 160px gap to F6) and rejoins at F6. Up-down-up-down:
//   the clocktower climbs then the gantry descends; the tenements climb then drop to F6.
//
//   THE MARKET PIT (2880..4600, 1720px, un-jumpable) means the clocktower is the ONLY way
//   forward — a missed hop drops into the square and respawns (§8.5 rule 4: falls MAY kill
//   because the respawn is always a few px away — one checkpoint before every hard climb,
//   every descent, and one PER climb tier). NO game-over, NO timer, NO lost progress.
//
// L3–6 CEILINGS (§8): the clocktower spire and the tenement stacks are OVERLAPPING stacked
// tiers (real ceilings — the town band starts showing them, escalated past level-03's mostly
// optional arcade/belltower). EVERY overlapping tier pair clears the §3.2 headroom floor
// (rise 74, h:16 → 74−16−32 = 26px ≥ 24) with ~70px+ consecutive x-overlap (§3.5). Climb
// tiers are PLATFORMS (never floors, which build.js pins to FLOOR_Y), every one h:16 (§3.1)
// with y deliberately OFF the 16px grid (§3.4). Open-air stacked tiers — no enclosed tunnels;
// the player can always see up and see every route (§8.5 rule 6).
//
// LENGTH / OBJECT-BUDGET NOTE (documented deviation): the plan's pre-checkpoint hint of a
// ~12000–12400px goal is SUPERSEDED by §8.5, and is ALSO physically capped by the HARD
// perf-objects budget (CONFIG.TERRAIN.OBJECT_BUDGET = 650 ground-cap/fill tiles, one cap per
// 16px of EVERY floor AND platform — browser-boot's assertObjectBudget). The §8.5-mandated
// 592px clocktower + tenement + gantry consume ~235 platform caps, so a two-spire 12000px
// level would land ~900 caps and HARD-FAIL perf-objects. level-04 is therefore built to the
// longest length the budget allows (goal x:9460, ~1.55x the old 6120) — the LONGEST even
// level (> level-06's 7200, > level-08's 7620) and the tallest town level, honoring every
// §8.5 requirement under the HARD budget. See 34.6-10-SUMMARY.md's deviation log.
//
// Explicit COMPLETE 4-field bounds literal (level-02+ convention, used AS-IS — §7's bounds
// trap). bounds.right hand-bumped to 9520 (goal 9460 + GOAL_SIZE 16 + 44px buffer; F12 ends
// 9520). bounds.top -560 — the climb goes NEGATIVE: the summit SU is y:-272 and the KEY apex
// KA is y:-346 (its coin at y:-402); -560 gives the camera roughly a screen of upward room
// past the highest entity. Raise ANY tier and this must be hand-bumped.
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every town-street/market run

export const LEVEL_04 = {
  id: "level-04",
  displayName: "The Clocktower",
  allowedTables: [6, 7, 8, 9],

  bounds: { left: 0, right: 9520, top: -560, bottom: 360 },

  geometry: {
    // Town-street/market runs, pinned to FLOOR_Y. Standard town-band 160px gaps, EXCEPT
    // the deliberate un-jumpable MARKET PIT the clocktower bridges: F4→F5 (2880..4600, 1720px).
    floors: [
      { x: 0, w: 480 }, // F0 — spawn: calm intro, the secret-alcove hop (PA)
      { x: 640, w: 440 }, // F1 — gap 480..640 (160); the one DOOR (clocktower gate @820)
      { x: 1240, w: 420 }, // F2 — gap 1080..1240 (160); spike1
      { x: 1820, w: 420 }, // F3 — gap 1660..1820 (160); spike2
      { x: 2400, w: 480 }, // F4 — gap 2240..2400 (160); CLOCKTOWER base (ends 2880)
      // ---- the 1720px MARKET PIT: 2880..4600, bridged only by the clocktower + gantry ----
      { x: 4600, w: 440 }, // F5 — gantry-descent landing + TENEMENT-STACKS base; ends 5040
      { x: 5200, w: 500 }, // F6 — tenement-drop landing + market stalls (SS1/SS2); gap 5040..5200 (160); ends 5700
      { x: 5860, w: 420 }, // F7 — gap 5700..5860 (160); spike3
      { x: 6440, w: 460 }, // F8 — gap 6280..6440 (160); the one WATCHMAN (enemy)
      { x: 7060, w: 420 }, // F9 — gap 6900..7060 (160); spike4
      { x: 7640, w: 520 }, // F10 — gap 7480..7640 (160); spike5
      { x: 8320, w: 460 }, // F11 — gap 8160..8320 (160)
      { x: 8940, w: 580 }, // F12 — gap 8780..8940 (160); final calm run to the goal (ends 9520)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1); every climb-tier y deliberately OFF the
    // 16px grid (§3.4). Overlapping climb tiers rise 74 (headroom 26); descent ledges drop
    // 130–174 (falling is free — no rise cap going DOWN, §3b/reachability).
    platforms: [
      // Spawn-area optional hop that hosts the secret alcove (rise 66 from F0).
      { x: 280, y: 254, w: 120, h: 16 }, // PA  [0]

      // ================= THE CLOCKTOWER (spire 1) — lower climb up to the FORK =================
      { x: 2600, y: 246, w: 200, h: 16 }, // T1  [1] rise 74 from F4, up-RIGHT (2600..2800)
      { x: 2680, y: 172, w: 240, h: 16 }, // T2  [2] rise 74, the FORK base (2680..2920)

      // ---- THE DIAMOND: two visible tenement routes from T2 up to the rejoin tier T4 ----
      // L's mount takeoff (~2860) is kept RIGHT of H's right edge (2780): the rising jump
      // must not launch from under H's underside or it bonks and stalls (level-02 dev4).
      { x: 2860, y: 98, w: 180, h: 16 }, // L   [3] LOW road — up-RIGHT, the safe way (2860..3040)
      { x: 2600, y: 98, w: 180, h: 16 }, // H   [4] HIGH road — NARROW, up-LEFT (2600..2780); 3 bonus coins
      { x: 2900, y: 24, w: 240, h: 16 }, // T4  [5] rise 74 — the REJOIN tier, reached from L (2900..3140)

      // ---- UPPER SWITCHBACK to the summit (one up-LEFT reversal) ----
      { x: 3000, y: -50, w: 220, h: 16 }, // T5 [6] rise 74 from T4, up-RIGHT (3000..3220)
      { x: 2840, y: -124, w: 260, h: 16 }, // T6 [7] rise 74 from T5, up-LEFT reversal (2840..3100)
      { x: 3020, y: -198, w: 220, h: 16 }, // T7 [8] rise 74 from T6, up-RIGHT (3020..3240)
      { x: 3080, y: -272, w: 320, h: 16 }, // SU [9] rise 74 from T7, up-RIGHT — the SUMMIT (3080..3400), y:-272 = 592px; wide-right (ends 3400) so ONLY it reaches descent-1's DA (gap 160 ≤162; T7 ends 3220 → 340 out of reach)

      // ---- THE KEY SPUR (one tier ABOVE the summit; the hardest single reach) ----
      { x: 2960, y: -346, w: 220, h: 16 }, // KA [10] rise 74 from SU, up-LEFT — the KEY APEX (2960..3180), y:-346 = 666px; reachable ONLY from SU

      // ================= DESCENT 1 — the GANTRY STAIR, SU down to F5 =================
      { x: 3560, y: -142, w: 200, h: 16 }, // DA [11] drop 130 from SU's far-right end (3560..3760)
      { x: 3860, y: 2, w: 240, h: 16 }, //    DB [12] drop 144 from DA (3860..4100)
      { x: 4260, y: 146, w: 220, h: 16 }, //  DC [13] drop 144 from DB (4260..4480); fall onto F5 (drop 174)

      // ================= THE TENEMENT STACKS (spire 2) — a second climb+drop off F5 =================
      { x: 4760, y: 246, w: 180, h: 16 }, // TN1 [14] rise 74 from F5, up-RIGHT (4760..4940)
      { x: 4820, y: 172, w: 200, h: 16 }, // TN2 [15] rise 74 from TN1, up-RIGHT (4820..5020)
      { x: 4880, y: 98, w: 180, h: 16 }, //  TN3 [16] rise 74 from TN2 — the tenement roof (4880..5060), bonus coins; DROPS rightward onto F6 (rejoin)

      // ================= MARKET STALLS — two low stepping stones on F6 =================
      { x: 5360, y: 258, w: 80, h: 16 }, // SS1 [17] rise 62 from F6 (on solid floor, never a pit)
      { x: 5520, y: 258, w: 80, h: 16 }, // SS2 [18] rise 62 from F6
    ],

    // ~46 coins — every one a fly-through box a driven player reaches (walk-family placement:
    // coin.y = surfaceY − 56, collected while walking the surface). The HIGH road tier H
    // carries THREE bonus coins (its reward); the KEY apex KA and summit SU carry the two
    // highest coins; the tenement roof TN3 carries a bonus.
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 400, y: 264 }, // F0
      { x: 330, y: 198 }, // PA (near the secret alcove)
      { x: 760, y: 264 }, // F1 (before the door)
      { x: 1000, y: 264 }, // F1 (after the door)
      { x: 1340, y: 264 }, // F2
      { x: 1560, y: 264 }, // F2
      { x: 1920, y: 264 }, // F3
      { x: 2140, y: 264 }, // F3
      { x: 2460, y: 264 }, // F4
      { x: 2700, y: 264 }, // F4 (approach to the clocktower)
      // Clocktower — lower climb + the diamond:
      { x: 2700, y: 190 }, // T1
      { x: 2760, y: 116 }, // T2 (clear zone left of L)
      { x: 2960, y: 42 }, // L (LOW road)
      { x: 2650, y: 42 }, // H (HIGH road — bonus 1)
      { x: 2700, y: 42 }, // H (HIGH road — bonus 2)
      { x: 2740, y: 42 }, // H (HIGH road — bonus 3)
      // Upper switchback:
      { x: 3020, y: -32 }, // T4
      { x: 3120, y: -106 }, // T5
      { x: 2920, y: -180 }, // T6
      { x: 3140, y: -254 }, // T7
      { x: 3320, y: -328 }, // SU (the summit balcony)
      { x: 3020, y: -402 }, // KA — beside the key, the 666px apex (highest coin)
      // Descent 1 (the gantry stair):
      { x: 3660, y: -198 }, // DA
      { x: 3980, y: -54 }, //  DB
      { x: 4360, y: 90 }, //   DC
      { x: 4660, y: 264 }, // F5
      { x: 4880, y: 264 }, // F5
      // Tenement stacks (spire 2):
      { x: 4840, y: 190 }, // TN1
      { x: 4900, y: 116 }, // TN2
      { x: 4960, y: 42 }, //  TN3 (tenement roof — bonus)
      { x: 5260, y: 264 }, // F6
      { x: 5620, y: 264 }, // F6
      { x: 5400, y: 202 }, // SS1 (market stall)
      { x: 5560, y: 202 }, // SS2 (market stall)
      { x: 5960, y: 264 }, // F7
      { x: 6180, y: 264 }, // F7
      { x: 6520, y: 264 }, // F8
      { x: 6820, y: 264 }, // F8
      { x: 7160, y: 264 }, // F9
      { x: 7380, y: 264 }, // F9
      { x: 7740, y: 264 }, // F10
      { x: 8060, y: 264 }, // F10
      { x: 8500, y: 264 }, // F11
      { x: 9100, y: 264 }, // F12
      { x: 9400, y: 264 }, // F12 (final step to the goal)
    ],

    // 5 floor spikes (the intense town level — sharper than level-03's 4), each centered on
    // its floor run with ≥200px margin from BOTH edges (level-02/06 intense norm) and clear
    // of every platform's x-span (no ceiling-bonk risk, §3.5). NONE on F4/F5 (both climb
    // bases — a spike beside a climb-entry mount strands the driven player: proven in-engine
    // on level-02's earlier draft) and NONE on F12 (the final approach stays a calm run-in).
    spikes: [
      { x: 1450, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (1240..1660) — L210 / R210
      { x: 2030, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (1820..2240) — L210 / R210
      { x: 6070, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (5860..6280) — L210 / R210
      { x: 7270, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F9 (7060..7480) — L210 / R210
      { x: 7900, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F10 (7640..8160) — L260 / R260
    ],

    // Goal caps the final run (F12 ends 9560; goal x:9460 = ~1.55x the old 6120, 84px buffer).
    goal: { x: 9460, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — §5 + §8.5 rule 4: near spawn, before EVERY spike, before EVERY
    // hard climb, before EVERY descent, before the watchman, PLUS one PER climb tier placed
    // where the player lands. Checkpoint y always matches the surface it sits on (FLOOR_Y−48
    // on floors, tier.y−48 on each platform).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 680, y: FLOOR_Y - 48 }, // before the door@820 (F1)
      { x: 1300, y: FLOOR_Y - 48 }, // before spike1@1450 (F2)
      { x: 1880, y: FLOOR_Y - 48 }, // before spike2@2030 (F3)
      { x: 2440, y: FLOOR_Y - 48 }, // before the CLOCKTOWER (F4)
      // Clocktower lower climb + the diamond fork:
      { x: 2640, y: 246 - 48 }, // T1
      { x: 2740, y: 172 - 48 }, // T2 (the fork)
      { x: 2920, y: 98 - 48 }, //  L (LOW road)
      { x: 2660, y: 98 - 48 }, //  H (HIGH road)
      { x: 2960, y: 24 - 48 }, //  T4 (rejoin)
      // Upper switchback + key spur:
      { x: 3060, y: -50 - 48 }, // T5
      { x: 3000, y: -124 - 48 }, // T6 (up-left reversal — lands near right end)
      { x: 3100, y: -198 - 48 }, // T7
      { x: 3160, y: -272 - 48 }, // SU (the summit)
      { x: 3080, y: -346 - 48 }, // KA (the key apex — lands near right end off SU)
      // Descent 1 (before every drop):
      { x: 3600, y: -142 - 48 }, // DA
      { x: 3920, y: 2 - 48 }, //   DB
      { x: 4320, y: 146 - 48 }, //  DC
      { x: 4640, y: FLOOR_Y - 48 }, // F5 landing / TENEMENT base
      // Tenement stacks:
      { x: 4800, y: 246 - 48 }, // TN1
      { x: 4880, y: 172 - 48 }, // TN2
      { x: 4940, y: 98 - 48 }, //  TN3 (tenement roof)
      { x: 5240, y: FLOOR_Y - 48 }, // F6 landing / market stalls
      { x: 5900, y: FLOOR_Y - 48 }, // before spike3@6070 (F7)
      { x: 6480, y: FLOOR_Y - 48 }, // F8 start, before the watchman@6670
      { x: 7100, y: FLOOR_Y - 48 }, // before spike4@7270 (F9)
      { x: 7700, y: FLOOR_Y - 48 }, // before spike5@7900 (F10)
      { x: 8360, y: FLOOR_Y - 48 }, // F11 start
      { x: 8980, y: FLOOR_Y - 48 }, // start of the final calm run to the goal (F12)
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. Mid-F1 (the
    // clocktower gate), clear of the gaps on either side (L180 / R260).
    doors: [{ x: 820, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at exactly 1 door + 1 enemy +
    // the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F8, PAST the clocktower + gantry + tenement. Placing it beyond
    // the market pit forces the driven harness to traverse the whole climb + descent to reach
    // it, so browser-boot proves the spire is navigable. variant 0 (the town-even watchman;
    // distinct from level-03's variant-1 in the same town pair).
    enemies: [{ x: 6670, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // The math-skip KEY (KEY-02/LEN-02) — NO geometry.locks (math-skip = keys WITHOUT locks).
    // Sits on KA, the KEY-SPUR apex above the summit (2960..3180, y:-346), at x:3060 — a
    // genuine walked middle stretch clear of both the up-left mount from SU (which lands near
    // KA's right end ~3120) and KA's own edges, so a driven player naturally walks THROUGH it
    // rather than sailing over it mid-arc (Pitfall 3, the 34.5 x:760 defect class). y = KA's
    // surface (-346) minus 32, the player's own collider height (WR-02; NOT CONFIG.KEY.H), so
    // the trigger box sits flush with a standing player's top edge on that tier.
    keys: [{ x: 3060, y: -346 - 32 }],
    // NO physical lock geometry anywhere in this descriptor — this is the math-skip usage
    // (key-held clears the level directly with full XP; missing it just means answering the
    // end math gate as normal — see game.js's heldKeyIds branch).

    // Exactly ONE secret alcove — ~70px above the spawn-area optional platform PA (x:280,
    // y:254, w:120) — off the required path, never signposted, free to skip.
    secretAlcove: [{ x: 320, y: 184 }],
  },

  mechanics: [],
  biome: "town", // level 4 of 8 — Castlevania arc calm->harsh (levels 3-4 town)
  parallax: null,
};
