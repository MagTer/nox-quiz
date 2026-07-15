// src/levels/level-06.js — "The Necropolis" descriptor.
//
// ===========================================================================
// PHASE 34.6 REBUILD — THE RAISED BAR (docs/LEVEL-DESIGN.md §8.5), CEMETERY EVEN.
// ===========================================================================
// level-06 is REBUILT FROM SCRATCH (append-only convention SUSPENDED, §9.1) as the
// INTENSE half of the cemetery pair (05 = calm mausoleum intro, 06 = intense
// necropolis). Authored directly to §8.5 and the §8 L3–6 band. It is the THIRD even
// level (the 02→04→06→08 intensity ladder), so it must climb HIGHER than the approved
// even prototype level-02 "The Rusted Spire" (518px). It does: the main goal route
// crests a 666px cathedral spire, and the optional math-skip KEY sits at a 740px apex.
// Doubled length: old goal x:3300 → x:7200 (~2.2x). EVEN archetype → intense + vertical
// + the math-skip KEY. Density LOCKED: 1 door + 1 enemy + the end math gate (mathGates: []).
//
// WHAT LEVEL-06 IS — "THE NECROPOLIS": a great cathedral/necropolis SPIRE you climb over
// a bottomless crypt-pit, a catacomb DESCENT down its far face, a SECOND switchback
// crypt-tower, and a final descent past the graveyard's lone wraith. Its SIGNATURE is
// the DOUBLE-SWITCHBACK CATHEDRAL SPIRE — distinct from level-05's single stepped
// mausoleum, level-02's swamp Rusted Spire, and every other level:
//
//   THE CATHEDRAL SPIRE (spire 1, the mandatory 666px vertical SIGNATURE): a climb off
//   F4 that, at the fork tier T2, SPLITS into a visible DIAMOND — a wide gentle LOW road
//   (L, up-RIGHT, the safe way) vs a narrow HIGH road (H, up-LEFT, carrying THREE bonus
//   coins) — the two roads rejoining at tier T4. Above the fork it becomes a real DOUBLE
//   SWITCHBACK: T4 → T5 → T6[up-LEFT reversal] → T7 → T8[up-LEFT reversal] → SU[up-RIGHT
//   summit]. SU sits at y:-346 — a 666px climb from the graveyard line, TALLER than
//   level-02's 518px summit (the even-ladder escalation the human asked for).
//
//   THE KEY APEX (the math-skip token, the single hardest reach): KA, a spur ONE tier
//   ABOVE the summit at y:-420 (a 740px apex — the HIGHEST reach in the level), reachable
//   ONLY from SU (the tier below it, T8, is 148px down — out of a single hop's ~88px
//   reach). The goal route never passes it (it descends SU → DA to the right); grabbing
//   the key is a real risk/reward detour up-LEFT off the summit. Key-held = free clear,
//   full XP=20; key-skipped = the end math gate as normal (geometry.keys, NO geometry.locks).
//
//   DESCENT 1 — THE CATACOMB STAIR (real going-DOWN, #1): from SU's far-right end a
//   rightward stair of drop-ledges (DA → DB → DC) descends ~666px back to the mid crypt
//   floor F5. SU is wide-right so ONLY it — not any lower tier — reaches DA (the T5/T7
//   tiers are 200px short across a near-flat gap, out of the ~162px running reach), making
//   the full crest MANDATORY (the level-02 "summit shortcut" defect class, closed here by
//   construction).
//
//   THE CRYPT-TOWER (spire 2, a SECOND switchback + #2 going-backwards): off F5 a second
//   mandatory switchback climb (U1 → U2 → U3[up-LEFT reversal] → U4 → SV) rises ~370px,
//   then DESCENT 2 (VA) drops back to F6 where the one WRAITH sits — placed PAST spire 2
//   so the driven harness must traverse the whole second climb + descent to reach it.
//   Up-down-up-down: two full ascents and two full descents, backwards three times.
//
//   TWO un-jumpable CRYPT-PITS (F4→F5: 2820..4480, 1660px; F5→F6: 4920..5860, 940px) mean
//   BOTH spires are the ONLY way forward — a missed hop drops into a pit and respawns
//   (§8.5 rule 4: falls MAY kill because the respawn is always a few px away — one
//   checkpoint before every hard climb, every descent, and one PER climb tier). NO
//   game-over, NO timer, NO lost progress.
//
// L3–6 CEILINGS (§8): the cathedral spire and crypt-tower are OVERLAPPING stacked tiers
// (real ceilings — the cemetery band). EVERY overlapping tier pair clears the §3.2
// headroom floor (rise 74, h:16 → 74−16−32 = 26px ≥ 24) with ~70px+ consecutive x-overlap
// (§3.5). Climb tiers are PLATFORMS (never floors, which build.js pins to FLOOR_Y), every
// one h:16 (§3.1) with y deliberately OFF the 16px grid (§3.4). Open-air stacked tiers —
// no enclosed tunnels; the player can always see up and see every route (§8.5 rule 6).
// Contrast with level-05 (deliberate): 05 is one gentle stepped mausoleum with optional
// ceilings; 06 climbs HIGHER through TWO switchback towers with REQUIRED ceilings and the
// key — clearly the intense half of the cemetery pair.
//
// Explicit COMPLETE 4-field bounds literal (level-02+ convention, used AS-IS — §7's bounds
// trap). bounds.right hand-bumped to 7300 (goal 7200 + GOAL_SIZE 16 + 84px buffer; F8 ends
// 7300). bounds.top -640 — the climb goes deeply NEGATIVE: the summit SU is y:-346 and the
// KEY apex KA is y:-420 (its coin at y:-476); -640 gives the camera roughly a screen of
// upward room past the highest entity. Raise ANY tier and this must be hand-bumped.
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every crypt-floor run

export const LEVEL_06 = {
  id: "level-06",
  displayName: "The Necropolis",
  allowedTables: [4, 5, 6, 7],

  bounds: { left: 0, right: 7300, top: -640, bottom: 360 },

  geometry: {
    // Crypt-floor runs, pinned to FLOOR_Y. Standard cemetery-band 140px gaps, EXCEPT the
    // two deliberate un-jumpable pits the two spires bridge: F4→F5 (1660px) and F5→F6 (940px).
    floors: [
      { x: 0, w: 480 }, // F0 — spawn: calm intro, the secret-alcove hop (PA)
      { x: 620, w: 460 }, // F1 — gap 480..620 (140); the one DOOR (iron gate @830)
      { x: 1220, w: 420 }, // F2 — gap 1080..1220 (140); spike1
      { x: 1780, w: 420 }, // F3 — gap 1640..1780 (140); spike2
      { x: 2340, w: 480 }, // F4 — gap 2200..2340 (140); CATHEDRAL SPIRE base (ends 2820)
      // ---- the 1660px spire-1 crypt-pit: 2820..4480, bridged only by spire 1 ----
      { x: 4480, w: 440 }, // F5 — descent-1 landing + CRYPT-TOWER base; ends 4920
      // ---- the 940px spire-2 crypt-pit: 4920..5860, bridged only by spire 2 ----
      { x: 5860, w: 520 }, // F6 — descent-2 landing; the one WRAITH, spike3; ends 6380
      { x: 6520, w: 360 }, // F7 — gap 6380..6520 (140); spike4
      { x: 7020, w: 280 }, // F8 — gap 6880..7020 (140); final calm run to the goal (ends 7300)
    ],

    // Raised platforms — ALL h:16 (WYSIWYG, §3.1); every climb-tier y deliberately OFF
    // the 16px grid (§3.4). Overlapping climb tiers rise 74 (headroom 26); descent ledges
    // drop 130–190 (falling is free — no rise cap going DOWN, §3b/reachability).
    platforms: [
      // Spawn-area optional hop that hosts the secret alcove (rise 66 from F0).
      { x: 280, y: 254, w: 120, h: 16 }, // PA  [0]

      // ============= CATHEDRAL SPIRE (spire 1) — lower climb up to the FORK =============
      { x: 2680, y: 246, w: 240, h: 16 }, // T1  [1] rise 74 from F4, up-RIGHT (2680..2920)
      { x: 2760, y: 172, w: 280, h: 16 }, // T2  [2] rise 74, the FORK base (2760..3040)

      // ---- THE DIAMOND: two visible routes from T2 up to the rejoin tier T4 ----
      // L's mount takeoff (~2960) is kept RIGHT of H's right edge (2880): the rising jump
      // must not launch from under H's underside or it bonks and stalls (level-02 dev4).
      { x: 2960, y: 98, w: 220, h: 16 }, // L   [3] LOW road — up-RIGHT, the safe way (2960..3180)
      { x: 2680, y: 98, w: 200, h: 16 }, // H   [4] HIGH road — NARROW, up-LEFT (2680..2880); 3 bonus coins
      { x: 3000, y: 24, w: 280, h: 16 }, // T4  [5] rise 74 — the REJOIN tier, reached from L (3000..3280)

      // ---- UPPER DOUBLE SWITCHBACK to the summit (two up-LEFT reversals) ----
      { x: 3140, y: -50, w: 240, h: 16 }, //  T5 [6] rise 74 from T4, up-RIGHT (3140..3380)
      { x: 2940, y: -124, w: 280, h: 16 }, // T6 [7] rise 74 from T5, up-LEFT reversal #1 (2940..3220)
      { x: 3120, y: -198, w: 260, h: 16 }, // T7 [8] rise 74 from T6, up-RIGHT (3120..3380)
      { x: 2920, y: -272, w: 280, h: 16 }, // T8 [9] rise 74 from T7, up-LEFT reversal #2 (2920..3200)
      { x: 3100, y: -346, w: 400, h: 16 }, // SU [10] rise 74 from T8, up-RIGHT — the SUMMIT (3100..3500), y:-346 = 666px; wide-right so ONLY it reaches descent-1's DA

      // ---- THE KEY SPUR (one tier ABOVE the summit; the hardest single reach) ----
      { x: 2940, y: -420, w: 240, h: 16 }, // KA [11] rise 74 from SU, up-LEFT — the KEY APEX (2940..3180), y:-420 = 740px; reachable ONLY from SU

      // ================= DESCENT 1 — the CATACOMB STAIR, SU down to F5 =================
      { x: 3580, y: -186, w: 220, h: 16 }, // DA [12] drop 160 from SU's far-right end (3580..3800)
      { x: 3880, y: -6, w: 220, h: 16 }, //   DB [13] drop 180 from DA (3880..4100)
      { x: 4180, y: 174, w: 220, h: 16 }, //  DC [14] drop 180 from DB (4180..4400); fall onto F5 (drop 146)

      // ================= CRYPT-TOWER (spire 2) — a second switchback off F5 =================
      { x: 4860, y: 246, w: 240, h: 16 }, // U1 [15] rise 74 from F5, up-RIGHT (4860..5100)
      { x: 4940, y: 172, w: 280, h: 16 }, // U2 [16] rise 74 from U1, up-RIGHT (4940..5220)
      { x: 4760, y: 98, w: 280, h: 16 }, //  U3 [17] rise 74 from U2, up-LEFT reversal (4760..5040)
      { x: 4940, y: 24, w: 260, h: 16 }, //  U4 [18] rise 74 from U3, up-RIGHT (4940..5200)
      { x: 5120, y: -50, w: 360, h: 16 }, // SV [19] rise 74 from U4, up-RIGHT — spire-2 summit (5120..5480), y:-50 = 370px; wide-right so VA hangs off it

      // ================= DESCENT 2 — SV down to F6 =================
      { x: 5560, y: 130, w: 220, h: 16 }, // VA [20] drop 180 from SV's far-right end (5560..5780); fall onto F6 (drop 190)
    ],

    // ~41 coins — every one a fly-through box a driven player reaches (walk-family
    // placement: coin.y = surfaceY − 56, collected while walking the surface). The HIGH
    // road tier H carries THREE bonus coins (its reward); the KEY apex KA and summit SU
    // carry the two highest coins in the level.
    coins: [
      { x: 150, y: 264 }, // F0
      { x: 400, y: 264 }, // F0
      { x: 330, y: 198 }, // PA (near the secret alcove)
      { x: 760, y: 264 }, // F1 (before the door)
      { x: 980, y: 264 }, // F1 (after the door)
      { x: 1320, y: 264 }, // F2
      { x: 1520, y: 264 }, // F2
      { x: 1880, y: 264 }, // F3
      { x: 2080, y: 264 }, // F3
      { x: 2440, y: 264 }, // F4
      { x: 2680, y: 264 }, // F4 (approach to the cathedral spire)
      // Cathedral spire — lower climb + the diamond:
      { x: 2700, y: 190 }, // T1
      { x: 2900, y: 116 }, // T2 (clear zone left of L)
      { x: 3060, y: 42 }, // L (LOW road)
      { x: 2720, y: 42 }, // H (HIGH road — bonus 1)
      { x: 2780, y: 42 }, // H (HIGH road — bonus 2)
      { x: 2830, y: 42 }, // H (HIGH road — bonus 3)
      // Upper double switchback:
      { x: 3120, y: -32 }, // T4
      { x: 3240, y: -106 }, // T5
      { x: 3020, y: -180 }, // T6
      { x: 3220, y: -254 }, // T7
      { x: 3020, y: -328 }, // T8
      { x: 3360, y: -402 }, // SU (the summit balcony)
      { x: 3020, y: -476 }, // KA — beside the key, the 740px apex (highest coin)
      // Descent 1 (the catacomb stair):
      { x: 3680, y: -242 }, // DA
      { x: 3980, y: -62 }, //  DB
      { x: 4280, y: 118 }, //  DC
      { x: 4560, y: 264 }, // F5
      { x: 4780, y: 264 }, // F5
      // Crypt-tower (spire 2):
      { x: 4980, y: 190 }, // U1
      { x: 5080, y: 116 }, // U2
      { x: 4820, y: 42 }, //  U3
      { x: 5060, y: -32 }, // U4
      { x: 5300, y: -106 }, // SV (spire-2 summit)
      { x: 5660, y: 74 }, //  VA (descent 2)
      { x: 5960, y: 264 }, // F6
      { x: 6280, y: 264 }, // F6
      { x: 6600, y: 264 }, // F7
      { x: 6800, y: 264 }, // F7
      { x: 7080, y: 264 }, // F8
      { x: 7240, y: 264 }, // F8
    ],

    // 4 floor spikes, each centered on its floor run and clear of every platform's x-span
    // (no ceiling-bonk risk). NONE on F4/F5 (both are climb bases — a spike beside a
    // climb-entry mount strands the driven player, whose spike hop sails past the mount's
    // fire window: proven in-engine on level-02's earlier draft) and NONE on F8 (the final
    // approach stays a calm run-in to the goal).
    spikes: [
      { x: 1430, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (1220..1640) — L210 / R210
      { x: 1990, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F3 (1780..2200) — L210 / R210
      { x: 6260, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F6 (5860..6380) — past the wraith@6060
      { x: 6720, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F7 (6520..6880)
    ],

    // Goal caps the final run (F8 ends 7300; goal x:7200 = ~2.2x the old 3300, 84px buffer).
    goal: { x: 7200, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Respawn checkpoints — §5 + §8.5 rule 4: near spawn, before EVERY spike, before EVERY
    // hard climb, before EVERY descent, before the wraith, PLUS one PER climb tier placed
    // where the player lands. Checkpoint y always matches the surface it sits on (FLOOR_Y−48
    // on floors, tier.y−48 on each platform).
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // start (F0)
      { x: 700, y: FLOOR_Y - 48 }, // before the door@830 (F1)
      { x: 1340, y: FLOOR_Y - 48 }, // before spike1@1430 (F2)
      { x: 1900, y: FLOOR_Y - 48 }, // before spike2@1990 (F3)
      { x: 2400, y: FLOOR_Y - 48 }, // before the CATHEDRAL SPIRE (F4)
      // Spire 1 lower climb + the diamond fork:
      { x: 2720, y: 246 - 48 }, // T1
      { x: 2820, y: 172 - 48 }, // T2 (the fork)
      { x: 3020, y: 98 - 48 }, //  L (LOW road)
      { x: 2720, y: 98 - 48 }, //  H (HIGH road)
      { x: 3060, y: 24 - 48 }, //  T4 (rejoin)
      // Upper double switchback + key spur:
      { x: 3200, y: -50 - 48 }, // T5
      { x: 3160, y: -124 - 48 }, // T6 (up-left reversal — lands near right end)
      { x: 3180, y: -198 - 48 }, // T7
      { x: 3140, y: -272 - 48 }, // T8 (up-left reversal — lands near right end)
      { x: 3160, y: -346 - 48 }, // SU (the summit)
      { x: 3120, y: -420 - 48 }, // KA (the key apex — lands near right end off SU)
      // Descent 1 (before every drop):
      { x: 3620, y: -186 - 48 }, // DA
      { x: 3920, y: -6 - 48 }, //   DB
      { x: 4220, y: 174 - 48 }, //  DC
      { x: 4520, y: FLOOR_Y - 48 }, // F5 landing / CRYPT-TOWER base
      // Spire 2:
      { x: 4900, y: 246 - 48 }, // U1
      { x: 5000, y: 172 - 48 }, // U2
      { x: 4980, y: 98 - 48 }, //  U3 (up-left reversal — lands near right end)
      { x: 5000, y: 24 - 48 }, //  U4
      { x: 5180, y: -50 - 48 }, // SV
      { x: 5600, y: 130 - 48 }, // VA (descent 2)
      { x: 5900, y: FLOOR_Y - 48 }, // F6 landing, before the wraith@6060
      { x: 6180, y: FLOOR_Y - 48 }, // before spike3@6260 (F6)
      { x: 6560, y: FLOOR_Y - 48 }, // before spike4@6720 (F7)
      { x: 7060, y: FLOOR_Y - 48 }, // start of the final calm run to the goal (F8)
    ],

    // Exactly ONE door — math density locked at 1 door + 1 enemy + end gate. Mid-F1 (the
    // iron gate), clear of the gaps on either side (L210 / R250).
    doors: [{ x: 830, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at exactly 1 door + 1 enemy +
    // the end-of-level goal gate.
    mathGates: [],

    // Exactly ONE enemy — mid-F6, PAST both spires. Placing it beyond the second pit forces
    // the driven harness to traverse the whole level (both switchbacks + both descents) to
    // reach it, so browser-boot proves the climbs are navigable. variant 1 (distinct from
    // level-05's variant-2 wraith in the same cemetery pair).
    enemies: [{ x: 6060, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 1 }],

    // The math-skip KEY (KEY-02/LEN-02) — NO geometry.locks (math-skip = keys WITHOUT
    // locks). Sits on KA, the KEY-SPUR apex above the summit (2940..3180, y:-420), at
    // x:3060 — a genuine walked middle stretch clear of both the up-left mount from SU
    // (which lands near KA's right end ~3120) and KA's own edges, so a driven player
    // naturally walks THROUGH it rather than sailing over it mid-arc (Pitfall 3, the 34.5
    // x:760 defect class). y = KA's surface (-420) minus 32, the player's own collider
    // height (WR-02; NOT CONFIG.KEY.H), so the trigger box sits flush with a standing
    // player's top edge on that tier.
    keys: [{ x: 3060, y: -420 - 32 }],
    // NO physical lock geometry anywhere in this descriptor — this is the math-skip usage
    // (key-held clears the level directly with full XP; missing it just means answering the
    // end math gate as normal — see game.js's heldKeyIds branch).

    // Exactly ONE secret alcove — ~70px above the spawn-area optional platform PA (x:280,
    // y:254, w:120) — off the required path, never signposted, free to skip.
    secretAlcove: [{ x: 320, y: 184 }],
  },

  mechanics: [],
  biome: "cemetery", // level 6 of 8 — Castlevania arc calm->harsh (levels 5-6 cemetery)
  parallax: null,
};
