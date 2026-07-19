// src/levels/level-04.js — "Twin Towers" descriptor.
//
// ===========================================================================
// ALL-8 DISTINCTNESS + VARIETY REDO (Phase 34.6, docs/LEVEL-DESIGN.md §8.5 rules
// 7-8). Superseded the prior "Clocktower" — which was a byte-for-byte re-skin of
// level-02's single switchback spire (the user's full test-play flagged 02≈04≈06 as
// identical). Replaced with a genuinely distinct MACRO-SHAPE per the approved table.
// ===========================================================================
//
// WHAT LEVEL-04 IS — TWIN TOWERS (its distinct signature): UP–ACROSS–UP. The player
// climbs a switchback up TOWER A, crosses a HIGH BEAM TRAVERSE over a wide pit (the
// "across" — a lateral run of beams at altitude, unique to this level), descends the
// far side to a mid valley floor, then climbs a TALLER switchback up TOWER B whose peak
// spur carries the MATH-SKIP KEY, and finally descends to the goal. Two SEPARATE towers
// joined by a lateral high span — structurally unlike level-02/08's single spire.
//
// EVEN/INTENSE (§8.5 rule 1): multiple switchbacks (Tower A 4 tiers, Tower B 6 tiers, both
// with visible up-LEFT reversals), total climb work far exceeding the single-spire evens;
// Tower B summit at y:-124 (444px) and the KEY spur at y:-198 (518px). The switchback
// uses the proven overlapping-tier recipe (rise 74, ~70-120px x-overlap, headroom 26 —
// the level-02/08 geometry the in-engine driver already traverses).
//
// THE MATH-SKIP KEY (KEY-02): geometry.keys, NO geometry.locks. Sits on BKEY, tower B's
// peak spur (the HARDEST branch — reachable ONLY from the summit B6, one tier up). Key
// held -> free clear +20 XP; key skipped -> the end math gate. The goal-drive descends
// from B6 directly (never through BKEY), so the key is a real risk/reward detour.
//
// ROUTE CHOICE (rule 2): multiple branches — the key spur is the hardest; the beam
// traverse and the tower climbs each offer bonus-coin lines. Nothing hidden (rule 6).
//
// L4 ramp (§8): town, gaps to ~160, overlapping switchback tiers (ceilings at L3-6, here
// at the 26px headroom of the tower climbs). Fall-stakes with a checkpoint per tier (§8.5
// rule 4): a missed climb hop drops into the pit and respawns a hop away — no game-over.
//
// PURE data module: no engine globals (a727c13). The ONLY import is ../config.js.

import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run

export const LEVEL_04 = {
  id: "level-04",
  displayName: "Twin Towers",
  allowedTables: [6, 7, 8, 9],

  // Explicit COMPLETE bounds literal (level-02+ convention, used AS-IS — §7's bounds
  // trap). right = 5460 (goal 5000; F2 ends 5400; buffer). top = -420 — Tower B's KEY
  // spur reaches y:-198 (coin at -254); -420 gives roughly a screen of room above it.
  // Raise ANY tier and this must be hand-bumped.
  bounds: { left: 0, right: 5320, top: -420, bottom: 360 },

  geometry: {
    // Three floor runs: the spawn wall F0 (Tower A base + door), the mid valley floor F1
    // (between the towers; the enemy), and the goal floor F2. The two wide pits (F0->F1,
    // F1->F2) are bridged ENTIRELY by the towers/traverse — a fall into either is a free
    // per-tier checkpoint respawn.
    floors: [
      { x: 0, w: 640 }, //    F0 — spawn; the DOOR (@360); Tower A rises from here
      { x: 2740, w: 600 }, // F1 — mid valley floor (beam traverse descends here); the ENEMY (@3100) + spike
      { x: 4460, w: 800 }, // F2 — goal floor (Tower B descends here); spike; the GOAL (@5000)
    ],

    // Platforms — ALL h:16 (WYSIWYG, §3.1), climb-tier y OFF the 16px grid (§3.4). The two
    // towers are overlapping switchbacks (rise 74, headroom 26); the beam traverse is a
    // flat run at y:24 (each beam hop's spanMax clears the 162px flat reach); descents free.
    platforms: [
      // ================= TOWER A — a 4-tier switchback off F0 (gain 296) =================
      { x: 660, y: 246, w: 200, h: 16 }, // A1 [0] rise 74 from F0 (gap 20); alcove hop above
      { x: 740, y: 172, w: 220, h: 16 }, // A2 [1] rise 74, up-right (overlap 120)
      { x: 620, y: 98, w: 220, h: 16 }, //  A3 [2] rise 74, up-LEFT reversal (overlap 100)
      { x: 740, y: 24, w: 220, h: 16 }, //  A4 [3] rise 74, up-right — Tower A top, y:24 (296px), onto the traverse

      // ================= THE HIGH BEAM TRAVERSE at y:24 (the "across") =================
      { x: 1080, y: 24, w: 150, h: 16 }, // BM1 [4] flat from A4 (gap 120, spanMax 270)
      { x: 1330, y: 24, w: 150, h: 16 }, // BM2 [5] flat (gap 100)
      { x: 1580, y: 24, w: 150, h: 16 }, // BM3 [6] flat (gap 100)
      { x: 1830, y: 24, w: 150, h: 16 }, // BM4 [7] flat (gap 100)
      { x: 2080, y: 24, w: 150, h: 16 }, // BM5 [8] flat (gap 100)

      // ================= DESCENT to the mid valley floor F1 (walk-off-safe gaps) =========
      { x: 2280, y: 120, w: 180, h: 16 }, // BD1 [9]  drop 96 from BM5 (gap 50)
      { x: 2510, y: 240, w: 180, h: 16 }, // BD2 [10] drop 120 from BD1 (gap 50), then drop to F1 (gap 50)

      // ================= TOWER B — a 6-tier switchback off F1 (summit gain 444) =========
      { x: 3420, y: 246, w: 200, h: 16 }, // B1 [11] rise 74 from F1 (gap 40)
      { x: 3500, y: 172, w: 220, h: 16 }, // B2 [12] rise 74, up-right (overlap 120)
      { x: 3380, y: 98, w: 220, h: 16 }, //  B3 [13] rise 74, up-LEFT reversal (overlap 100)
      { x: 3500, y: 24, w: 220, h: 16 }, //  B4 [14] rise 74, up-right (overlap 100)
      { x: 3380, y: -50, w: 220, h: 16 }, // B5 [15] rise 74, up-LEFT reversal (overlap 100)
      { x: 3500, y: -124, w: 220, h: 16 }, // B6 [16] rise 74, up-right — Tower B SUMMIT, y:-124 (444px)

      // --- THE KEY SPUR: one tier ABOVE the summit, the hardest single reach ---
      { x: 3360, y: -198, w: 200, h: 16 }, // BKEY [17] rise 74 from B6, up-LEFT — the KEY APEX, y:-198 (518px); reachable ONLY from B6

      // ================= DESCENT from B6 down to the goal floor F2 (walk-off-safe gaps) ==
      { x: 3770, y: -40, w: 180, h: 16 }, // BD3 [18] drop 84 from B6 (gap 50)
      { x: 4000, y: 80, w: 180, h: 16 }, //  BD4 [19] drop 120 from BD3 (gap 50)
      { x: 4230, y: 200, w: 180, h: 16 }, // BD5 [20] drop 120 from BD4 (gap 50), then drop to F2 (gap 50)
    ],

    // ~38 coins — fly-through boxes; floor coins at walk height (264), each tier a coin on
    // its own surface. The beam traverse and the KEY spur carry the reward lines.
    coins: [
      { x: 150, y: 264 }, // F0 (before the door)
      { x: 520, y: 264 }, // F0 (after the door)
      { x: 760, y: 190 }, // A1
      { x: 850, y: 116 }, // A2
      { x: 720, y: 42 }, //  A3
      { x: 850, y: -32 }, // A4 (tower A top)
      { x: 1150, y: -32 }, // BM1 (beam)
      { x: 1400, y: -32 }, // BM2 (beam)
      { x: 1650, y: -32 }, // BM3 (beam)
      { x: 1900, y: -32 }, // BM4 (beam)
      { x: 2150, y: -32 }, // BM5 (beam)
      { x: 2370, y: 64 }, //  BD1 (descent)
      { x: 2600, y: 184 }, // BD2 (descent)
      { x: 2900, y: 264 }, // F1 (before the enemy)
      { x: 3250, y: 264 }, // F1 (past the enemy)
      { x: 3520, y: 190 }, // B1
      { x: 3610, y: 116 }, // B2
      { x: 3480, y: 42 }, //  B3
      { x: 3610, y: -32 }, // B4
      { x: 3480, y: -106 }, // B5
      { x: 3610, y: -180 }, // B6 (summit)
      { x: 3440, y: -254 }, // BKEY — beside the key (the highest coin, 518px apex)
      { x: 3860, y: -96 }, // BD3 (descent)
      { x: 4090, y: 24 }, //  BD4 (descent)
      { x: 4320, y: 144 }, // BD5 (descent)
      { x: 4700, y: 264 }, // F2
      { x: 4900, y: 264 }, // F2 (approach to goal)
      { x: 5150, y: 264 }, // F2 (past the goal)
    ],

    // 2 floor spikes, each centered on a clear floor run, clear of every tier's x-span
    // (no ceiling-bonk). NONE on the climb tiers (a spike beside a climb-entry mount
    // strands the driven player — level-02's proven caveat) and NONE on the F0 welcome.
    spikes: [
      { x: 4750, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // F2 (4460..5260) — after Tower B lands, before the goal (190px runway)
    ],
    // NOTE: exactly ONE spike, on F2, the ONLY floor with no climb rising off it (Tower B
    // only DESCENDS into F2). Every other floor is a climb base (F0->Tower A, F1->Tower B),
    // and level-02's proven caveat is that a spike beside a climb-entry mount strands the
    // driven player (the spike-hop sails past the mount's fire window) — and a spike boxed
    // against a climb base / enemy has no respawn runway and death-loops. The towers ARE
    // this level's challenge; floor spikes stay off every climb floor.

    // Goal on the goal floor F2 (F2 ends 5400; buffer past the goal@5000).
    goal: { x: 5000, y: FLOOR_Y - CONFIG.GOAL_SIZE },

    // Checkpoints — near spawn, ONE PER climb tier (both towers), one per beam/descent
    // ledge, one before the enemy, one before each spike, and at the goal approach. A
    // missed hop respawns a hop away (§8.5 rule 4). y matches each surface.
    checkpoints: [
      { x: 96, y: FLOOR_Y - 48 }, // F0 — start, before the door@360
      { x: 700, y: 246 - 48 }, // A1
      { x: 800, y: 172 - 48 }, // A2
      { x: 680, y: 98 - 48 }, //  A3
      { x: 800, y: 24 - 48 }, //  A4 (tower A top)
      { x: 1120, y: 24 - 48 }, // BM1 (traverse)
      { x: 1620, y: 24 - 48 }, // BM3 (traverse)
      { x: 2120, y: 24 - 48 }, // BM5 (traverse end)
      { x: 2360, y: 120 - 48 }, // BD1 (descent)
      { x: 2590, y: 240 - 48 }, // BD2 (descent)
      { x: 2820, y: FLOOR_Y - 48 }, // F1 — before the enemy@3100
      { x: 3180, y: FLOOR_Y - 48 }, // F1 — past the enemy, before Tower B's base
      { x: 3460, y: 246 - 48 }, // B1
      { x: 3560, y: 172 - 48 }, // B2
      { x: 3440, y: 98 - 48 }, //  B3
      { x: 3560, y: 24 - 48 }, //  B4
      { x: 3440, y: -50 - 48 }, // B5
      { x: 3560, y: -124 - 48 }, // B6 (summit)
      { x: 3420, y: -198 - 48 }, // BKEY (the key spur)
      { x: 3850, y: -40 - 48 }, // BD3 (descent)
      { x: 4080, y: 80 - 48 }, //  BD4 (descent)
      { x: 4310, y: 200 - 48 }, // BD5 (descent)
      { x: 4500, y: FLOOR_Y - 48 }, // F2 landing
      { x: 4560, y: FLOOR_Y - 48 }, // F2 — before spike@4750 (190px runway)
    ],

    // Exactly ONE door — on solid F0 (left margin 360, right margin 280).
    doors: [{ x: 360, y: FLOOR_Y - CONFIG.DOOR.H }],

    // Mid-level checkpoint gates: NONE — density locked at 1 door + 1 enemy + end gate.
    mathGates: [],

    // Exactly ONE enemy — on solid mid-valley F1 (between the towers), so the driven
    // harness must climb+traverse+descend Tower A to reach it.
    enemies: [{ x: 3100, y: FLOOR_Y - CONFIG.ENEMY.H, variant: 0 }],

    // The math-skip KEY (KEY-02) — NO geometry.locks. Sits on BKEY, the peak spur above
    // Tower B's summit (x:3360..3560, y:-198), at x:3440 (a walked middle stretch clear of
    // the up-left mount landing and the tier's edges, so a driven player walks through it,
    // not over it). y = BKEY surface (-198) minus 32 (the player's collider height).
    keys: [{ x: 3440, y: -198 - 32 }],

    // Exactly ONE secret alcove — ~70px above A1's surface (y:246). Off the required path.
    secretAlcove: [{ x: 720, y: 176 }],

    // --- Phase 36 MOTION (MOT-01/MOT-02) — ADD-ONLY keys, EXCLUDED from the
    // check-geometry-frozen snapshot (36-01); every static array above stays byte-frozen.
    // HEAVIER density for the INTENSE-EVEN twin-towers town: ONE moving platform + TWO
    // patrollers (3 motion entities, the level-06 intense template), each authored to the
    // §6a/§6b HARD rules — both mover endpoints reachable RIGHTWARD from spawn, a checkpoint
    // before each, solid floor UNDER the mover (miss = WAIT), far end telegraphed. The mover
    // rides the WIDE F2 goal floor's LANDING (the level's LAST audit encounter, past the
    // enemy@3100 and both towers — riding it strands no later blocker-drive). The two
    // patrollers are HOVERING WRAITHS at y:214 over FLAT grounded walk-lanes (walk under /
    // jump into) OFF every tower climb tier, the beam traverse, the descents, and every
    // takeoff/landing band. Layout DISTINCT from level-02 (swamp spire, F8 last-floor mover).
    movers: [
      // M0 — a WIDE (w120), SLOW (period 10s) lateral ferry over the F2 goal floor's LANDING
      // (4460..5260), in the flat stretch AFTER the BD5->F2 descent landing (~4460), placed
      // CLEAR of the spike@4750: right extent (4540+120 = 4660) stays ~30px LEFT of the
      // goal-drive's spike-jump takeoff (~4690) so the deterministic browser-boot goal-drive
      // jumps the spike UNOBSTRUCTED (a wider ledge that overhangs the takeoff wedged the
      // goal-drive at x~4581 — a NO-SOFTLOCK failure that this placement fixes; no-softlock
      // is the load-bearing safety and OVERRIDES the audit-mount convenience).
      // KNOWN LIMITATION (36-07, honest): the interactive headless audit's mount-driver does
      // NOT reliably ride THIS mover. On the frozen twin-towers F2 the audit's ~200px running
      // mount-jump lands at ~x4700 — inside the spike-jump zone — so the ONLY ledge the
      // headless driver can mount is one that reaches x4700, which is exactly the ledge that
      // blocks the goal-drive. Every no-softlock-safe placement (spike-clear F2, after-spike,
      // F0/F1) was play-tested against the driver and none rode; the two constraints are
      // irreconcilable on this one level's geometry. This is a HEADLESS-DRIVER limitation, not
      // a game defect: a real player mounts a w120 ledge at rise 70 trivially, the mover is
      // reachability-GREEN, and levels 02/03 movers + all five wraith patrollers DO ride the
      // audit. `period: 10` keeps it a slow telegraphed near-static ride (the calm end of the
      // audit-vs-safety trade). Behind checkpoint@4500; solid F2 under it → a missed hop lands
      // on F2 to WAIT; an overshoot to the spike@4750 is a gentle respawn to checkpoint@4560
      // ~2s away (§8.5 rule 4) — NOT a killing pit. Both endpoints y:250 = rise 70 from
      // FLOOR_Y 320 → reachability PASS/WARN. Goal-drive walks under it (head 288 vs 250..266).
      // POL-03 (Phase 39): the ~40px near-zero sweep is WIDENED to 80px (4460..4540) so the
      // ferry VISIBLY slides. Only x1 moved LEFT (4500 -> 4460, the F2 left edge) — x2 and w
      // are held so the rightmost extent stays x2+w = 4660, ~30px LEFT of the goal-drive's
      // spike-jump takeoff (~4690): the documented NO-SOFTLOCK constraint above is preserved
      // byte-for-byte. Both endpoints y:250 ride solid F2 (miss = WAIT, no pit). EXEMPT motion
      // key — frozen-hash-neutral.
      { x1: 4460, y1: 250, x2: 4540, y2: 250, w: 120, period: 10 },
    ],
    patrollers: [
      // P0 — a GROUNDED town SKELETON (POL-01, Phase 39) walking the FLAT F0 spawn lane
      // (0..640). Feet on FLOOR_Y 320 (44x52 topleft → y:268), a 180px sweep 400..580 at
      // speed 80 (was a stationary y:214 hover), endpoints OFF the F0 coins (@150, @520).
      // Sits AFTER the door@360 (+ the solid barrel@100 before it) and BEFORE the Tower-A A1
      // mount takeoff (~620). Behind checkpoint@96; a contact respawns there and re-walks the
      // ALREADY-open door (no re-gate). A grounded skeleton across the lane now genuinely
      // BLOCKS (intended danger) — the walk-only driver hops it (39-04 patroller-hop) and
      // stays clearable (docs/LEVEL-DESIGN.md).
      { x1: 400, y1: 268, x2: 580, y2: 268, speed: 80 },
      // P1 — a GROUNDED town SKELETON (POL-01) walking the FLAT mid-valley F1 lane
      // (2740..3340). Feet on FLOOR_Y (y:268), a 160px sweep 3140..3300 at speed 80 (was a
      // y:214 hover), endpoints OFF the F1 coins (@2900, @3250). Sits in the GROUNDED stretch
      // AFTER the enemy@3100 and BEFORE the Tower-B B1 mount takeoff (~3340). Behind
      // checkpoint@3180 (F1, past the enemy); a contact respawns there (enemy already answered
      // — no re-gate). Distinct "patroller" walk sprite (36-10) reads apart from the
      // math-blocker enemy@3100.
      { x1: 3140, y1: 268, x2: 3300, y2: 268, speed: 80 },
    ],
  },

  mechanics: [],
  biome: "town", // level 4 of 8 — Castlevania arc calm->harsh (levels 3-4 town)
  parallax: null,

  // --- Decorative props (ART-06/ART-07, Phase 35) — VISUAL-ONLY, top-level (NOT inside
  // geometry, so check-geometry-frozen never sees them). No colliders; sprite+pos+z only.
  // Both layers are NEGATIVE z (back -8, surface -3) so a prop can never occlude the
  // player/coins/terrain/mechanics (legibility-first, §8.5).
  //
  // BUDGET-CRITICAL: this is the LONGEST even level, closest to the 650 OBJECT_BUDGET
  // ceiling (Pitfall 2 / T-35-09), so props here are MINIMAL — a handful of accents on
  // the three WIDE floors ONLY (F0/F1/F2 at FLOOR_Y 320), OFF both towers' switchback
  // climb tiers, the high beam traverse, the descents, and the KEY spur (BKEY). On-surface
  // props use y = surfaceY - spriteHeight. Every prop is clear of the DOOR@360, ENEMY@3100,
  // the spike@4750, the coins, the KEY, and the GOAL@5000. Sprite pixel sizes (from
  // build_props): barrel 24x30, crate 39x35, street-lamp 35x108, well 65x65, sign 35x44.
  props: [
    // Background depth — a single town street-lamp behind the spawn base (z -8), for the
    // vertical Clocktower town mood without adding surface clutter.
    { sprite: "prop-town-street-lamp", x: 110, y: 212, layer: "back" }, // behind F0 spawn (town depth)

    // On-surface accents on the three wide floors ONLY (y = 320 - spriteHeight) — off
    // every switchback tier, the beam traverse, and the key spur.
    { sprite: "prop-town-barrel", x: 200, y: 290, layer: "surface", solid: true }, //   POL-04 SOLID jump-over — F0 (moved from x:60; a solid prop must NOT overlap the checkpoint@96 respawn point — the player respawns INSIDE the collider and death-loops — nor SPAWN_X 64, so 200 keeps an 88px gap), before the door@360; 24px collider << 88px jump envelope
    { sprite: "prop-town-crate", x: 2860, y: 285, layer: "surface", solid: true }, //  POL-04 SOLID jump-over — F1 (moved from 2760: clears the checkpoint@2820 respawn point, ~24px gap, and coin@2900), before the enemy@3100
    { sprite: "prop-town-sign", x: 4480, y: 276, layer: "surface" }, //   F2 landing corner, before spike@4750

    // Phase 36 (MOT-03/MECH-05): the town LIGHT that marks + links the secret alcove — a
    // street-lamp on Tower-A's A1 tier (y:246) directly below the alcove@(720,176): base
    // rests on A1 (y = 246 - 108 lamp height = 138), dist to the alcove = 176-138 = 38px <
    // LINK_DIST 96, so build.js auto-tags it "alcove-light" (starts DIM, brightens on
    // discovery) — NO descriptor field needed. Renders at z(-3), structurally BEHIND the
    // z(0) climb/player so it marks the alcove without occluding the Tower-A route
    // (legibility-first). The 36-04 flicker selector (/lantern|lamp|candle/) also gives it +
    // the existing back-layer lamp@110 an ambient flame flicker.
    { sprite: "prop-town-street-lamp", x: 720, y: 138, layer: "surface" },
  ],
};
