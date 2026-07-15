// src/levels/level-02.js — "The Rusted Spire" descriptor.
//
// ===========================================================================
// CHECKPOINT REWORK v3 — THE RAISED BAR (Phase 34.6, docs/LEVEL-DESIGN.md §8.5).
// ===========================================================================
// The 34.6 human checkpoint REJECTED level-02 TWICE:
//   v1 ("three gentle open-air humps"): "hardly any difference between level 1 and
//       2 ... no climbing, no going backwards."
//   v2 ("one mandatory switchback spire bridging a pit + a key spur"): STILL "too
//       simple, repetitive. Needs more action. More vertical in both levels but
//       level 2, even higher with options on what path to take."
//
// v3 is authored directly to §8.5 ("Level ambition — the raised bar"). ONLY the
// floor/platform/coin/checkpoint/spike/bounds geometry changed — the math-skip KEY
// mechanic (geometry.keys, NO geometry.locks), the swamp biome, allowedTables
// [2,3,4,5,6,7], the descriptor schema, and the LOCKED 1-door + 1-enemy + end-gate
// math density are all preserved. XP_KEY_SKIP stays 20 (human-confirmed).
// audit-endgate-key.mjs is NOT modified — it re-covers this level unchanged.
//
// WHAT LEVEL-02 v3 IS — a BRANCHING SWITCHBACK SPIRE (its distinct signature):
//
//   SPIRE 1 (the tall branching spire): a mandatory climb off F4 with, at tier T2,
//   a genuine VISIBLE FORK — a DIAMOND where two routes to the rejoin tier T4 split:
//     * L (the LOW road, right): a wide, gentle tier — the safe way up, taken by the
//       goal-drive (its leftward-free chain is far cheaper than the HIGH road).
//     * H (the HIGH road, left): a NARROW tier carrying THREE bonus coins — the
//       harder, more rewarding way up. Both rejoin at T4, so choosing the hard road
//       costs nothing structural, only earns the extra coins. Nothing hidden.
//   Above the fork the climb becomes a real SWITCHBACK (T4 -> T5 -> T6[up-LEFT
//   reversal] -> SU[up-RIGHT]) to the summit SU at y:-198 — a 518px climb from the
//   spawn ground line.
//
//   THE MATH-SKIP KEY sits on KA, a spur ONE MORE tier ABOVE the summit (y:-272, a
//   592px apex — the HIGHEST, HARDEST single reach in the level). KA is reachable
//   ONLY from SU (the tier below it, T6, is 148px down — out of a single hop's ~88px
//   reach), so grabbing the key is a real risk/reward detour that no route to the
//   goal ever passes through (the goal-drive descends SU -> DA directly). Key-held =
//   free clear; key-skipped = the end math gate.
//
//   DESCENT 1 (real going-DOWN, #1): from SU's far-right end a rightward stair of
//   drop-ledges (DA -> DB -> DC) descends ~500px back to the mid floor F5. SU is
//   positioned so ONLY it — not any lower tier — reaches DA, making the full 518px
//   crest MANDATORY (proven by re-dumping the planned goal route).
//
//   SPIRE 2 (a SECOND switchback, #2 going-backwards): off F5 a second mandatory
//   switchback climb (U1 -> U2 -> U3[up-LEFT reversal] -> SV) rises ~296px, then
//   DESCENT 2 (VA) drops back to F6 where the one ENEMY sits — placed PAST spire 2
//   so the driven harness must traverse the whole second climb + descent to reach
//   it. Up-down-up-down: two full ascents and two full descents, backwards twice.
//   SV is wide-right for the same reason SU is: VA hangs off its far end so the U3
//   reversal + SV summit are MANDATORY, not shortcut past.
//
//   Both un-jumpable pits (F4->F5, F5->F6) mean BOTH spires are the ONLY way forward
//   — a fall into either pit is a free checkpoint respawn (one before every hard
//   climb, every descent, and one per climb tier; §8.5 rule 4 — missed jumps MAY drop
//   into a pit, and that is WANTED, because the respawn is always a few px away and
//   there is NO game-over/timer/lost progress).
//
// COMPACT (v3.1): tiers/floors are kept as narrow as the ~70px climb-overlap and the
// mandatory-summit trick allow, so the level stays under browser-boot's terrain
// OBJECT_BUDGET (one cap tile per 16px of every floor AND platform). Every rising
// MOUNT takeoff (to.xStart - offset for a rightward hop) is kept CLEAR of any tier
// that overhangs it: the L-road mount was moved right so it no longer launches from
// under H's underside (that bonk stalled the driven climb in an earlier draft).
//
// EVERY overlapping tier pair clears the §3.2 headroom floor (rise 74, h:16 ->
// 74-16-32 = 26px >= 24) with ~70px+ x-overlap (§3.5); every rightward hop's target
// tier advances rightward and every leftward hop's advances leftward (the mount-edge
// rule the in-engine driver enforces). Open-air: no enclosed ceilings/tunnels (§8.5
// rule 6). Climb tiers are PLATFORMS (never floors, which build.js pins to FLOOR_Y).
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_02 = {
  id: "level-02",
  displayName: "The Rusted Spire",
  allowedTables: [2, 3, 4, 5, 6, 7],

  // Explicit, COMPLETE 4-field bounds literal (level-02+ convention, used AS-IS —
  // LEVEL-DESIGN §7's bounds-convention trap). Hand-bumped to the new, taller extent:
  //   right = 7480  — the final floor F8 ends at 7480 (goal@7360, 120px buffer).
  //   top   = -560  — the climb goes deeper NEGATIVE than v2 (-400). The summit SU is
  //                   y:-198 (a 518px climb) and the KEY apex KA is y:-272 (a 592px
  //                   apex; its coin at y:-328); -560 gives the camera roughly a full
  //                   screen of upward room past the highest entity. Raise ANY tier and
  //                   this must be hand-bumped.
  bounds: { left: 0, right: 7480, top: -560, bottom: 360 },

  geometry: {
    // Floor runs, pinned to FLOOR_Y. Standard 120px gaps, EXCEPT the two deliberate
    // un-jumpable pits the two spires bridge: F4->F5 (1680px) and F5->F6 (880px).
    floors: [
      { x: 0, w: 480 }, // F0 — spawn: calm intro, the secret-alcove hop
      { x: 600, w: 440 }, // F1 — gap 480..600 (120); the one DOOR
      { x: 1160, w: 420 }, // F2 — gap 1040..1160 (120); spike1
      { x: 1700, w: 440 }, // F3 — gap 1580..1700 (120); spike2
      { x: 2260, w: 480 }, // F4 — gap 2140..2260 (120); SPIRE 1 base (ends 2740)
      // ---- the 1680px spire-1 pit: 2740..4420, bridged only by spire 1 ----
      { x: 4420, w: 480 }, // F5 — descent-1 landing + SPIRE 2 base; ends 4900
      // ---- the 880px spire-2 pit: 4900..5780, bridged only by spire 2 ----
      { x: 5780, w: 540 }, // F6 — descent-2 landing; the one ENEMY, spike3; ends 6320
      { x: 6440, w: 440 }, // F7 — gap 6320..6440 (120); spike4
      { x: 7000, w: 480 }, // F8 — gap 6880..7000 (120); final calm run to the goal (ends 7480)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1); every climb-tier y deliberately
    // OFF the 16px grid (§3.4). Overlapping climb tiers rise 74 (headroom 26).
    platforms: [
      // Spawn-area optional hop that hosts the secret alcove (rise 66 from F0).
      { x: 280, y: 254, w: 120, h: 16 }, // PA  [0]

      // ================= SPIRE 1 — lower climb up to the FORK =================
      { x: 2680, y: 246, w: 240, h: 16 }, // T1  [1] rise 74 from F4 (2680..2920)
      { x: 2760, y: 172, w: 280, h: 16 }, // T2  [2] rise 74, the FORK base (2760..3040)

      // ---- THE DIAMOND: two visible routes from T2 up to the rejoin tier T4 ----
      // L is placed so its mount takeoff (~2892) clears H's right edge (2880): the
      // rising jump must not launch from under H's underside, or it bonks and stalls.
      { x: 2960, y: 98, w: 220, h: 16 }, // L   [3] LOW road — up-RIGHT, the safe way (2960..3180)
      { x: 2680, y: 98, w: 200, h: 16 }, // H   [4] HIGH road — NARROW, up-LEFT (2680..2880); 3 bonus coins
      { x: 3000, y: 24, w: 280, h: 16 }, // T4  [5] rise 74 — the REJOIN tier, reached from BOTH L and H (3000..3280)

      // ---- UPPER SWITCHBACK to the summit ----
      { x: 3140, y: -50, w: 240, h: 16 }, // T5 [6] rise 74 from T4, up-RIGHT (3140..3380)
      { x: 2940, y: -124, w: 280, h: 16 }, // T6 [7] rise 74 from T5, up-LEFT reversal (2940..3220)
      { x: 3120, y: -198, w: 380, h: 16 }, // SU [8] rise 74 from T6, up-RIGHT — the SUMMIT (3120..3500), y:-198 = 518px; wide-right so ONLY it reaches descent-1's DA

      // ---- THE KEY SPUR (one tier ABOVE the summit; the hardest single reach) ----
      { x: 2960, y: -272, w: 240, h: 16 }, // KA [9] rise 74 from SU, up-LEFT — the KEY APEX (2960..3200), y:-272 = 592px; reachable ONLY from SU

      // ================= DESCENT 1 — SU stairs down to F5 =================
      { x: 3580, y: -90, w: 220, h: 16 }, // DA [10] drop from SU's far-right end (3580..3800)
      { x: 3860, y: 20, w: 220, h: 16 }, //  DB [11] drop from DA (3860..4080)
      { x: 4140, y: 130, w: 200, h: 16 }, // DC [12] drop from DB (4140..4340); walk off onto F5

      // ================= SPIRE 2 — a second switchback off F5 =================
      { x: 4780, y: 246, w: 320, h: 16 }, // U1 [13] rise 74 from F5 (4780..5100)
      { x: 5020, y: 172, w: 260, h: 16 }, // U2 [14] rise 74, overlaps U1 by 80
      { x: 4800, y: 98, w: 300, h: 16 }, //  U3 [15] rise 74 from U2, up-LEFT reversal (4800..5100)
      { x: 5020, y: 24, w: 360, h: 16 }, //  SV [16] rise 74 from U3, up-RIGHT — spire-2 summit (5020..5380); wide-right so VA hangs off it

      // ================= DESCENT 2 — SV down to F6 =================
      { x: 5480, y: 130, w: 220, h: 16 }, // VA [17] drop from SV's far-right end (5480..5700); walk off onto F6
    ],

    // ~38 coins — every one a fly-through box a driven player reaches. Floor coins at
    // walk height (surfaceY-56); each climb tier carries a coin on its OWN clear
    // surface. The HIGH road tier H carries THREE bonus coins (its reward); the KEY
    // apex KA and summit SU carry the two highest coins.
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 420, y: 264 }, // F0
      { x: 340, y: 198 }, // PA (near the secret alcove)
      { x: 720, y: 264 }, // F1
      { x: 920, y: 264 }, // F1
      { x: 1280, y: 264 }, // F2
      { x: 1480, y: 264 }, // F2
      { x: 1820, y: 264 }, // F3
      { x: 2020, y: 264 }, // F3
      { x: 2380, y: 264 }, // F4
      { x: 2620, y: 264 }, // F4 (approach to spire 1)
      { x: 2760, y: 190 }, // T1
      { x: 2920, y: 116 }, // T2 (clear zone between H and L)
      // The diamond:
      { x: 3060, y: 42 }, // L (LOW road)
      { x: 2720, y: 42 }, // H (HIGH road — bonus 1)
      { x: 2780, y: 42 }, // H (HIGH road — bonus 2)
      { x: 2830, y: 42 }, // H (HIGH road — bonus 3)
      // Upper switchback:
      { x: 3080, y: -32 }, // T4
      { x: 3280, y: -106 }, // T5
      { x: 3000, y: -180 }, // T6
      { x: 3380, y: -254 }, // SU (the main summit balcony)
      { x: 3060, y: -328 }, // KA — beside the key, the 592px apex
      // Descent 1:
      { x: 3680, y: -146 }, // DA
      { x: 3960, y: -36 }, //  DB
      { x: 4240, y: 74 }, //   DC
      { x: 4540, y: 264 }, // F5
      { x: 4780, y: 264 }, // F5
      // Spire 2:
      { x: 4880, y: 190 }, // U1
      { x: 5140, y: 116 }, // U2
      { x: 4880, y: 42 }, //  U3
      { x: 5220, y: -32 }, // SV
      { x: 5580, y: 74 }, //  VA (descent 2)
      { x: 5860, y: 264 }, // F6
      { x: 6180, y: 264 }, // F6
      { x: 6520, y: 264 }, // F7
      { x: 6760, y: 264 }, // F7
      { x: 7100, y: 264 }, // F8
      { x: 7340, y: 264 }, // F8
    ],

    // 4 floor spikes, each centered on its floor run and clear of every platform's
    // x-span (no ceiling-bonk risk). NONE on F4/F5 (both are climb bases — a spike
    // beside a climb-entry mount strands the driven player, whose spike hop sails past
    // the mount's fire window: proven in-engine on an earlier draft) and NONE on the
    // final approach (F8 stays a calm run-in to the goal).
    spikes: [
      { x: 1370, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (1160..1580)
      { x: 1920, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (1700..2140)
      { x: 6100, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (5780..6320) — past enemy@6030
      { x: 6660, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (6440..6880)
    ],

    // Goal caps the final run (F8 ends 7480; 120px buffer past the goal).
    goal: { x: 7360, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — §5 + §8.5 rule 4: near spawn, before EVERY spike, before
    // EVERY hard climb, before EVERY descent, before the enemy, PLUS one per climb tier
    // placed where the player lands. Checkpoint y always matches the surface it sits on
    // (FLOOR_Y-48 on floors, tier.y-48 on each platform).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start
      { x: 720, y: FLOOR_Y - 48 }, // before the door@800 (F1)
      { x: 1290, y: FLOOR_Y - 48 }, // before spike1@1370 (F2)
      { x: 1840, y: FLOOR_Y - 48 }, // before spike2@1920 (F3)
      { x: 2320, y: FLOOR_Y - 48 }, // before SPIRE 1 (F4)
      // Spire 1 lower climb + the diamond fork:
      { x: 2700, y: 246 - 48 }, // T1
      { x: 2820, y: 172 - 48 }, // T2 (the fork)
      { x: 3020, y: 98 - 48 }, //  L (LOW road)
      { x: 2720, y: 98 - 48 }, //  H (HIGH road)
      { x: 3060, y: 24 - 48 }, //  T4 (rejoin)
      // Upper switchback + key spur:
      { x: 3200, y: -50 - 48 }, // T5
      { x: 3000, y: -124 - 48 }, // T6
      { x: 3180, y: -198 - 48 }, // SU (the summit)
      { x: 3020, y: -272 - 48 }, // KA (the key apex)
      // Descent 1 (before every drop):
      { x: 3620, y: -90 - 48 }, // DA
      { x: 3900, y: 20 - 48 }, //  DB
      { x: 4180, y: 130 - 48 }, // DC
      { x: 4460, y: FLOOR_Y - 48 }, // F5 landing / SPIRE 2 base
      // Spire 2:
      { x: 4820, y: 246 - 48 }, // U1
      { x: 5060, y: 172 - 48 }, // U2
      { x: 4840, y: 98 - 48 }, //  U3
      { x: 5060, y: 24 - 48 }, //  SV
      { x: 5520, y: 130 - 48 }, // VA (descent 2)
      { x: 5820, y: FLOOR_Y - 48 }, // F6 landing, before enemy@6030
      { x: 6020, y: FLOOR_Y - 48 }, // before spike3@6100 (F6)
      { x: 6580, y: FLOOR_Y - 48 }, // before spike4@6660 (F7)
      { x: 7040, y: FLOOR_Y - 48 }, // start of the final calm run to the goal (F8)
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. Mid-F1,
    // clear of the gaps on either side.
    doors: [{ x: 800, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at exactly 1 door + 1 enemy +
    // the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F6, PAST both spires. Placing it beyond the second pit
    // forces the driven harness to traverse the whole level (both switchbacks + both
    // descents) to reach it, so browser-boot proves the climbs are navigable.
    enemies: [{ x: 6030, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // The math-skip KEY (KEY-02/LEN-02) — NO geometry.locks (math-skip = keys WITHOUT
    // locks). Sits on KA, the KEY-SPUR apex above the summit (x:2960..3200, y:-272), at
    // x:3080 — a genuine walked middle stretch clear of both the up-left mount from SU
    // (which lands near KA's right end) and KA's own edges, so a driven player naturally
    // walks through it rather than sailing over it mid-arc (Pitfall 3, the 34.5 x:760
    // defect class). y = KA's surface (-272) minus 32, the player's own collider height
    // (WR-02; NOT CONFIG.KEY.H), so the trigger box sits flush with a standing player's
    // top edge on that tier.
    keys: [{ x: 3080, y: -272 - 32 }],
    // NO physical lock geometry anywhere in this descriptor — this is the math-skip
    // usage (key-held clears the level directly with full XP; missing it just means
    // answering the end math gate as normal — see game.js's heldKeyIds branch).

    // Exactly ONE secret alcove, ~70px above the spawn-area optional platform PA
    // (x:280, y:254, w:120) — off the required path, never signposted.
    secretAlcove: [{ x: 320, y: 184 }],
  },

  mechanics: [],
  biome: "swamp", // Phase 32 (ART-02/ART-03) — level 2 of 8, Castlevania arc calm->harsh (levels 1-2 swamp)
  parallax: null,
};
