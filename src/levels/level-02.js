// src/levels/level-02.js — "The Rusted Climb" descriptor.
//
// ===========================================================================
// CHECKPOINT REWORK (Phase 34.6, plan 34.6-03 geometry, human-rejected first cut).
// ===========================================================================
// The first 34.6-03 build of this level was validator-legal but FLAT: three gentle
// open-air "humps" and a math-skip key, read by the human at the 34.6-04 checkpoint
// as "hardly any difference between level 1 and 2, except there is a key ... no
// climbing at all, no going backwards at all." This is the genuine-verticality
// redesign. ONLY the platform/floor/coin/checkpoint/bounds geometry changed — the
// math-skip key mechanic (keys, NO locks), the biome, allowedTables, the 1-door +
// 1-enemy + end-gate math density, and the descriptor schema are all preserved.
//
// WHAT LEVEL-02 NOW IS (the EVEN archetype = intense + vertical, distinct from
// level-01's gentle ground run):
//
//   A real, TALL, MANDATORY switchback climb bridging a wide un-jumpable gap, a
//   DELIBERATE descent down the far side toward the goal, and — at the very APEX,
//   one tier ABOVE the main crossing — an OPTIONAL math-skip KEY.
//
//   * REAL VERTICAL CLIMB: F4 (the climb base, y:320) → T1 → T2 → T3 → T4 → T5,
//     five overlapping tiers at 74px rises. Main peak T5 sits at y:-50 — a 370px
//     climb from the spawn ground line. The camera climbs with it: bounds.top is
//     -400 (like level-07/08's negative-top summit climbs, deeper because this peak
//     is higher). Every overlapping tier obeys LEVEL-DESIGN §3.2's headroom rule:
//     rise 74, h:16 → headroom = 74 - 16 - 32 = 26px (>= 24), and the ~70px
//     consecutive x-overlap the rising-jump graph needs (§3.5).
//
//   * VISIBLE SWITCHBACK (the maneuver the human explicitly liked on level-08):
//     leg A climbs up-RIGHT (F4→T1→T2→T3), then REVERSAL 1 doubles back up-LEFT
//     (T3→T4 — run right past T4's far edge on T3's 190px runway, turn, jump back
//     up-left), then REVERSAL 2 turns up-RIGHT again (T4→T5). The player VISIBLY
//     doubles back over the section below, in full view, nothing hidden. This is
//     the exact shape level-08's capstone uses (Plan 34-04), which the Phase-34
//     bidirectional harness drives; adapted here (not copied numerically) and moved
//     to mid-level over a gap, with a descent added.
//
//   * DELIBERATE DESCENT: from the peak T5 the route drops DOWN and to the right —
//     T5 → M1 (a mid-air ledge) → F5 (the far floor). Both are open-air walk-off
//     falls (185px drops onto wide landing surfaces), the "falling route heading
//     down toward the goal" — going DOWN, not only up.
//
//   * THE MANDATORY CLIMB IS THE ONLY ROUTE FORWARD: F4 (ends 3360) and F5 (starts
//     4520) are 1160px apart — a pit no bare jump can cross. The ONLY path from the
//     spawn side to the goal side is up the switchback and down the far side. So the
//     driven bidirectional harness (browser-boot.mjs) MUST traverse the whole climb
//     + reversal + descent to reach the enemy@5620 and the goal@7980 — it can never
//     fall back on a flat ground bypass the way the rejected flat cut allowed. A
//     fall into the pit is a free checkpoint respawn (one per tier, §5), never a
//     game-over.
//
//   * OPTIONAL HIGH ROUTE + THE MATH-SKIP KEY (KEY-02/LEN-02): KS is ONE MORE tier
//     up-and-over from T5 (y:-124, a 444px apex), a genuine over-the-top branch that
//     rejoins the descent on M1. Climbing it is pure risk/reward: it carries the
//     math-skip KEY (geometry.keys, NO geometry.locks). The main crossing does NOT
//     pass through KS (bottleneckPath descends T5→M1 directly — far cheaper than the
//     T5→KS rise), so a player who never detours up to the apex reaches the goal and
//     answers the end math gate as normal; a player who DOES grab the key clears the
//     level free (full XP, CONFIG.PROGRESS.XP_KEY_SKIP=20, confirmed by the human —
//     leave it at 20). Visible, never hidden.
//
//   * OPEN-AIR / LEGIBLE: no tier ever forms a cramped ceiling (every overlapping
//     pair clears the 24px headroom floor; the tightest is 26px), so "she can always
//     see where she's going" (LEVEL-DESIGN §8's ADHD-safe intent), while the level
//     still reads as genuinely vertical and intense — the tension the §8 L1-2 band
//     and the human's "make it vertical" both have to be honored at once, resolved
//     the way level-08's climb resolves it: verticality via a real stacked climb
//     with generous headroom, not via a flat run of humps.
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
  // LEVEL-DESIGN §7's bounds-convention trap). Hand-bumped to the new extent:
  //   right = 8100  — the final floor F9 ends at 8100 (goal@7980, 120px buffer),
  //                   matching the shipped "bounds.right == final floor's end".
  //   top   = -400  — the climb genuinely goes NEGATIVE now (unlike the rejected
  //                   flat cut, whose deepest peak was y:185). The main peak T5 is
  //                   at y:-50 and the optional key apex KS is at y:-124, with a
  //                   bonus coin above it at y:-180; -400 gives the camera roughly a
  //                   full screen of upward room past the highest entity (deeper
  //                   than level-08's -360 because KS climbs higher than that
  //                   summit). Widen ANY tier upward and this must be hand-bumped.
  bounds: { left: 0, right: 8100, top: -400, bottom: 360 },

  geometry: {
    // Floor runs, pinned to FLOOR_Y. All gaps are the standard bare-jumpable 120px,
    // EXCEPT the one deliberate 1160px pit under the climb (F4→F5) that the
    // switchback bridges and that forces the ascent.
    floors: [
      { x: 0, w: 600 }, // F0 — spawn: calm intro, the secret-alcove hop
      { x: 720, w: 560 }, // F1 — gap 600..720 (120); the one DOOR
      { x: 1400, w: 520 }, // F2 — gap 1280..1400 (120); spike1
      { x: 2040, w: 560 }, // F3 — gap 1920..2040 (120); spike2
      { x: 2720, w: 640 }, // F4 — gap 2600..2720 (120); the CLIMB BASE (ends 3360)
      // ---- the 1160px climb pit: 3360..4520, bridged only by the switchback ----
      { x: 4520, w: 780 }, // F5 — the DESCENT landing (starts 4520); spike3
      { x: 5420, w: 560 }, // F6 — gap 5300..5420 (120); the one ENEMY
      { x: 6100, w: 560 }, // F7 — gap 5980..6100 (120); spike4
      { x: 6780, w: 560 }, // F8 — gap 6660..6780 (120); spike5
      { x: 7460, w: 640 }, // F9 — gap 7340..7460 (120); final run to the goal (ends 8100)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, LEVEL-DESIGN §3.1), every climb-tier y
    // deliberately OFF the 16px grid (§3.4). The climb tiers (T1..T5, KS) overlap in
    // x by ~70px consecutively (§3.5's rising-jump reachability window) at 74px
    // rises, giving the mandated 26px of headroom (74-16-32) on every overlapping
    // pair — the exact level-07/08-band climb the L1-2 flat rule alone could never
    // produce, made legible by keeping every headroom >= 24px.
    platforms: [
      // Spawn-area optional hop that hosts the secret alcove (rise 66 from F0).
      { x: 280, y: 254, w: 120, h: 16 }, // PA

      // ---- THE SWITCHBACK CLIMB (mandatory; bridges the F4→F5 pit) ----
      // leg A, up-RIGHT:
      { x: 3220, y: 246, w: 300, h: 16 }, // T1  rise 74 from F4 (overlaps F4 by 140)
      { x: 3450, y: 172, w: 280, h: 16 }, // T2  rise 74, overlaps T1 by 70 — headroom over T1: 26
      { x: 3660, y: 98, w: 300, h: 16 }, //  T3  rise 74, overlaps T2 by 70 — headroom over T2: 26; the turn-around RUNWAY (190px sticks out right of T4's far edge)
      // REVERSAL 1, up-LEFT (T4 sits left of T3): run right past T4's edge on T3's
      // runway, turn, jump back up-left onto T4.
      { x: 3420, y: 24, w: 350, h: 16 }, //  T4  rise 74, overlaps T3 by 110 — headroom over T3: 26
      // REVERSAL 2, up-RIGHT: walk LEFT along T4 for run-up, then sprint right and
      // jump. T5 is the main peak (y:-50 — a 370px climb from FLOOR_Y).
      { x: 3700, y: -50, w: 340, h: 16 }, // T5  rise 74, overlaps T4 by 70 — headroom over T4: 26

      // ---- THE OPTIONAL KEY APEX (a THIRD reversal — up-and-LEFT off T5) ----
      // KS is the true summit (y:-124, a 444px apex), reached by a SECOND up-LEFT
      // hop off T5 (run right along T5's runway past KS's far edge, turn, jump back
      // up-left). It carries the math-skip KEY. Deliberately placed UP-LEFT (over
      // T4/T2, not over the descent) so the main crossing's rightward descent from
      // T5 never passes under it: the goal-drive and the no-key Path B descend
      // T5→M1 to the RIGHT (far cheaper than the T5→KS rise, and KS leads nowhere
      // toward the goal), so they route straight past it. A player who DOES climb
      // for the key simply walks back off KS's right edge, drops onto T5, and
      // descends — no re-climb needed. Only a deliberate detour touches the key.
      { x: 3470, y: -124, w: 300, h: 16 }, // KS  rise 74 from T5, overlaps T5 by 70 (up-LEFT) — headroom over T5: 26

      // ---- THE DESCENT (down the far side, RIGHT and clear of the whole climb) ----
      // M1 sits far enough right (starts 4160) that ONLY T5 can reach it — the lower
      // ascent tiers (T3 ends 3960) fall short of it, so bottleneckPath cannot route
      // the descent back-and-left through them (an earlier cut did exactly that and
      // the leftward walk-off landed on T4 instead of T3, an infinite oscillation).
      // The single clean rightward hop T5→M1→F5 is the only way down.
      { x: 4160, y: 135, w: 340, h: 16 }, // M1  drop 185 from T5 onto this mid ledge, then drop to F5
    ],

    // ~30 coins — every one a fly-through box a driven player actually reaches.
    // Floor coins use walk-family placement (coin.y = surfaceY - 56); each climb
    // tier carries ONE bonus coin on its own walkable surface, clear of every
    // overhang (obstruction-aware coin-reachability + the in-engine witness replay
    // both arbitrate this). The key apex KS carries the highest coin (y:-180),
    // beside the key — the reward for climbing all the way to the top.
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 450, y: 264 }, // F0
      { x: 340, y: 198 }, // on PA (near the secret alcove)
      { x: 900, y: 264 }, // F1
      { x: 1100, y: 264 }, // F1
      { x: 1500, y: 264 }, // F2
      { x: 1780, y: 264 }, // F2
      { x: 2150, y: 264 }, // F3
      { x: 2450, y: 264 }, // F3
      { x: 2820, y: 264 }, // F4
      { x: 3120, y: 264 }, // F4 (approach to the climb base)
      { x: 3300, y: 190 }, // T1 bonus
      { x: 3520, y: 116 }, // T2 bonus
      { x: 3700, y: 42 }, //  T3 bonus
      { x: 3480, y: -32 }, // T4 bonus (on the leftward reversal leg)
      { x: 3820, y: -106 }, // T5 bonus (main peak)
      { x: 3650, y: -180 }, // KS bonus — the summit, beside the key
      { x: 4340, y: 79 }, //  M1 bonus (on the descent)
      { x: 4620, y: 264 }, // F5
      { x: 5120, y: 264 }, // F5
      { x: 5500, y: 264 }, // F6
      { x: 5860, y: 264 }, // F6
      { x: 6250, y: 264 }, // F7
      { x: 6520, y: 264 }, // F7
      { x: 6900, y: 264 }, // F8
      { x: 7200, y: 264 }, // F8
      { x: 7560, y: 264 }, // F9
      { x: 7860, y: 264 }, // F9
    ],

    // 5 floor spikes, each centered on its floor run with a >= 260px margin from
    // BOTH edges (the spike-before-gap-takeoff discipline 34.6-02 proved necessary
    // via the in-engine harness) and clear of every platform's x-span (no
    // ceiling-bonk risk — no platform sits above any spike). NONE sit on the final
    // approach run (F9 stays a calm run-in to the goal).
    spikes: [
      { x: 1660, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (1400..1920) — 260/260
      { x: 2320, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (2040..2600) — 280/280
      { x: 4910, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F5 (4520..5300) — 390/390
      { x: 6380, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (6100..6660) — 280/280
      { x: 7060, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F8 (6780..7340) — 280/280
    ],

    // Goal caps the final run (F9 ends 8100; 120px buffer past the goal).
    goal: { x: 7980, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — near spawn, before EVERY spike, before the climb, before
    // the enemy, plus ONE PER CLIMB TIER placed where the player actually lands (a
    // fall into the climb pit costs at most one tier — LEVEL-DESIGN §5 respawn
    // policy, exactly level-07/08's per-tier convention). Checkpoint y always matches
    // the surface it sits on (FLOOR_Y-48 on floors, tier.y-48 on each climb tier).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start
      { x: 860, y: FLOOR_Y - 48 }, // before the door@940 (F1)
      { x: 1580, y: FLOOR_Y - 48 }, // before spike1@1660 (F2)
      { x: 2240, y: FLOOR_Y - 48 }, // before spike2@2320 (F3)
      { x: 2780, y: FLOOR_Y - 48 }, // before the climb (start of F4)
      { x: 3260, y: 246 - 48 }, // T1 landing (left end)
      { x: 3500, y: 172 - 48 }, // T2 landing (left end)
      { x: 3720, y: 98 - 48 }, //  T3 landing (left end, before the runway)
      { x: 3560, y: 24 - 48 }, //  T4 landing — the up-LEFT reversal arrives here
      { x: 3760, y: -50 - 48 }, // T5 landing (the peak, left end)
      { x: 3620, y: -124 - 48 }, // KS landing (the key apex, up-left of T5)
      { x: 4220, y: 135 - 48 }, // M1 landing (on the descent)
      { x: 4830, y: FLOOR_Y - 48 }, // before spike3@4910 (F5)
      { x: 5480, y: FLOOR_Y - 48 }, // before the enemy@5620 (start of F6)
      { x: 6300, y: FLOOR_Y - 48 }, // before spike4@6380 (F7)
      { x: 6980, y: FLOOR_Y - 48 }, // before spike5@7060 (F8)
      { x: 7480, y: FLOOR_Y - 48 }, // start of the final calm run to the goal (F9)
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate.
    // Sits mid-F1, well clear of the gaps on either side (220/308px margins).
    doors: [{ x: 940, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at exactly 1 door + 1 enemy
    // + the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F6, PAST the climb. Placing it beyond the pit forces
    // the driven harness to traverse the whole switchback + descent to reach it,
    // so browser-boot proves the climb is navigable, not just statically plausible.
    enemies: [{ x: 5620, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // The math-skip KEY (KEY-02/LEN-02) — NO geometry.locks (math-skip = keys
    // WITHOUT locks). Sits on the KEY APEX tier KS (x:3970..4220), at x:4110 — in a
    // genuine walked middle stretch (left of where the up-left mount from T5 lands
    // the player near KS's right edge, so the player walks left across it to reach
    // it; and left of the right edge where a departing player walks off back onto
    // T5), so a driven player naturally walks through it rather than sailing over it
    // mid-arc (Pitfall 3, the 34.5 x:760 defect class). y = KS's surface (-124)
    // minus 32, the player's own collider height (WR-02; NOT CONFIG.KEY.H), so the
    // trigger box sits flush with a standing player's top edge on that specific tier.
    keys: [{ x: 3600, y: -124 - 32 }],
    // NO physical lock geometry anywhere in this descriptor — this is the math-skip
    // usage (key-held clears the level directly with full XP; missing it just means
    // answering the end math gate as normal — see game.js's heldKeyIds branch,
    // Phase 34.6 Plan 01).

    // Exactly ONE secret alcove, ~70px above the spawn-area optional platform PA
    // (x:280, y:254, w:120) — off the required path, never signposted.
    secretAlcove: [{ x: 320, y: 184 }],
  },

  mechanics: [],
  biome: "swamp", // Phase 32 (ART-02/ART-03) — level 2 of 8, Castlevania arc calm->harsh (levels 1-2 swamp)
  parallax: null,
};
