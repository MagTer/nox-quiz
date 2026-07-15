# Roadmap: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Last updated:** 2026-07-09

## Milestones

- ✅ **v1.0 MVP** — Phase 1 (shipped 2026-06-20) — see v2.0 archive (Phase 1 included)
- ✅ **v2.0 Dungeon Crawler** — Phases 2–6 (shipped 2026-06-22) — [archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 The Platformer** — Phases 7–12 (shipped 2026-06-28) — [archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 Content & Challenge** — Phases 13–19 (shipped 2026-07-03) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v4.1 Art Rework** — Phases 20–21 (shipped 2026-07-04) — [archive](milestones/v4.1-ROADMAP.md)
- ✅ **v5.0 Nox Run — Real Levels** — Phases 22–28 (shipped 2026-07-09) — [archive](milestones/v5.0-ROADMAP.md)
- 🚧 **v6.0 SNES-Fidelity World** — Phases 29–38 (in progress)

## Phases

**Phase Numbering:**

- Integer phases (29, 30, 31…): Planned milestone work (numbering continues across milestones)
- Decimal phases (29.1, 29.2…): Urgent insertions (marked with INSERTED)

<details>
<summary>✅ v1.0 MVP (Phase 1) — SHIPPED 2026-06-20</summary>

- [x] Phase 1: MVP Core Loop & ADHD-Safe Mechanics (4/4 plans) — completed 2026-06-20

Single-file gamified math practice: XP, levels, 70/30 hard/easy weighting, Fisher-Yates shuffle, EWMA accuracy tracking, SVG grain texture, WCAG AA verified.

</details>

<details>
<summary>✅ v2.0 Dungeon Crawler (Phases 2–6) — SHIPPED 2026-06-22</summary>

- [x] Phase 2: Combat Foundation (3/3 plans) — completed 2026-06-21
- [x] Phase 3: Screen Architecture (2/2 plans) — completed 2026-06-21
- [x] Phase 4: Dungeon Renderer (3/3 plans) — completed 2026-06-21
- [x] Phase 5: Full Floor Loop + Balance (2/2 plans) — completed 2026-06-21
- [x] Phase 6: Polish + ADHD Safety Audit (2/2 plans) — completed 2026-06-22

Dungeon crawler layer: GameFSM, CombatEngine, DungeonRenderer, DungeonRunner, 4 floors, 3 enemy types, loot system, ADHD audit passed. All 27 v2.0 requirements satisfied.

</details>

<details>
<summary>✅ v3.0 The Platformer (Phases 7–12) — SHIPPED 2026-06-28</summary>

- [x] Phase 7: Project Setup & Deployment (2/2 plans) — completed 2026-06-22
- [x] Phase 8: Platformer Core / Movement / Physics / Camera (3/3 plans) — completed 2026-06-24
- [x] Phase 9: Level Build & CC0 Assets (3/3 plans) — completed 2026-06-25
- [x] Phase 10: Math-Gate Integration / Port the Brain (3/3 plans) — completed 2026-06-26
- [x] Phase 11: Progression & Persistence (4/4 plans) — completed 2026-06-27
- [x] Phase 12: Polish, ADHD-Safety & UAT (3/3 plans) — completed 2026-06-28

Real 2D Kaplay platformer (vendored, no-build, served over HTTP): one polished dark-grunge level → in-world forgiving 6–9-weighted math gate → XP/leveling on the v1/v2 curve → versioned localStorage persist+resume, with ADHD-safe juice and discoverable controls. All 33 v3.0 requirements satisfied (32 verified + kid-UAT; 2 low-risk manual checks deferred — see STATE.md Deferred Items). Full phase details in the [v3.0 archive](milestones/v3.0-ROADMAP.md).

</details>

<details>
<summary>✅ v4.0 Content & Challenge (Phases 13–19) — SHIPPED 2026-07-03</summary>

- [x] Phase 13: Fresh Save Format + Level Registry/Data (4/4 plans) — completed 2026-06-29
- [x] Phase 14: Multi-Scene Shell (3/3 plans) — completed 2026-07-02
- [x] Phase 15: Challenge Seam + Locked-Door Mechanic (4/4 plans) — completed 2026-07-02
- [x] Phase 16: Remaining Mechanics + Difficulty Curve (3/3 plans) — completed 2026-07-03
- [x] Phase 17: Build the Levels (4/4 plans) — completed 2026-07-03
- [x] Phase 18: Art, Animation & Parallax (4/4 plans) — completed 2026-07-03
- [x] Phase 19: Polish & Consolidated Kid-UAT (4/4 plans) — completed 2026-07-03

Grew the single-level v3.0 slice into a replayable multi-level game: four hand-built dark-grunge levels, a title screen, a level-select map, and four forgiving in-world math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) woven throughout. Table and platforming difficulty ramp gently; art/animation/parallax pass. All 22 v4.0 requirements satisfied (21 verified + automated browser boot; SAFE-05 kid-UAT live sign-off deferred and tracked in `19-UAT.md`). Full phase details in the [v4.0 archive](milestones/v4.0-ROADMAP.md).

</details>

<details>
<summary>✅ v4.1 Art Rework (Phases 20–21) — SHIPPED 2026-07-04</summary>

- [x] Phase 20: Real CC0 Art Redo & Human Sign-off (3/3 plans) — completed 2026-07-04
- [x] Phase 21: Real Verification Pass — Mechanics & Sign-off Integrity (7/7 plans) — completed 2026-07-04

Replaced Phase 18's procedurally-generated placeholder art (player, tileset, parallax, title/select) with real curated CC0 pixel art under a genuine two-round human visual sign-off, then closed the verification-integrity gap that let it (and other pre-v4.1 gameplay claims) ship unsubstantiated: `door.js`/`gates.js`/`enemy.js`/`mathGate.js` got the same real interactive audit `collect.js` got post-ship, the automated boot gate now genuinely exercises movement + mechanic resolution on all 4 levels, and the milestone-audit record's unsupported sign-off claims were corrected. Found and fixed 5 additional real bugs along the way. All 10 v4.1 requirements satisfied. Full phase details in the [v4.1 archive](milestones/v4.1-ROADMAP.md).

</details>

<details>
<summary>✅ v5.0 Nox Run — Real Levels (Phases 22–28) — SHIPPED 2026-07-09</summary>

- [x] Phase 22: Implementation Review & Auto-Fix (5/5 plans) — completed 2026-07-05
- [x] Phase 23: Level Validation Harness (5/5 plans) — completed 2026-07-05
- [x] Phase 24: Fix & Lengthen Levels 1–4 (6/6 plans) — completed 2026-07-06
- [x] Phase 25: Levels 5–8, Difficulty Ramp & Select Grid (7/7 plans) — completed 2026-07-07
- [x] Phase 26: Grunge Palette & Nox Run Rebrand (12/12 plans) — completed 2026-07-07
- [x] Phase 27: Audio & ADHD-Safe Sound (7/7 plans) — completed 2026-07-08
- [x] Phase 28: Full Verification & Interactive Sign-off (3/3 plans) — completed 2026-07-09

Rebranded Math Lab → Nox Run; doubled the game to 8 levels (levels 1–4 fixed and lengthened 53–63%, levels 5–8 new) behind a permanent structural validator; rebuilt the visual identity (expanded grunge palette, 8 distinct per-level themes, real CC0 door/enemy sprites, signed-off logo); added a full ADHD-safe audio layer (7 SFX + ambient music + mute); closed with a consolidated automated gate suite and genuine, non-rubber-stamped human sign-off across all 8 levels. All 25 v5.0 requirements satisfied. Full phase details in the [v5.0 archive](milestones/v5.0-ROADMAP.md).

</details>

### 🚧 v6.0 SNES-Fidelity World (Phases 29–38) — IN PROGRESS

**Milestone Goal:** Take Nox Run from "tinted minimal art" to a genuinely SNES-fidelity dark world with motion in it, clean up the mechanics that didn't land, make it playable on mobile, and close the long-deferred live-deploy and kid-UAT loops. 31 requirements — see `.planning/REQUIREMENTS.md`.

**Executor sizing:** Phases are deliberately sized for a Sonnet-5 executor — small and single-concern (user decision, 2026-07-09).

**Absorbed backlog (no longer carried):** the two v5.0-era backlog entries are absorbed into this milestone's requirements and removed from this roadmap — Phase 999.1 (reconsider/remove collect-the-answer) → **MECH-01/MECH-02** (Phase 29); Phase 999.2 (pink spike hazard sprite) → subsumed by **ART-01**'s full art replacement + permanent pink-hue scan gate (Phase 31).

**Ordering constraints (binding, from research):** mechanic cleanup before any re-dress; ART-01's style-board human sign-off is a hard blocking gate for all downstream art phases; the validator learns movers RED-first (Phase 30) a full phase-boundary before any level ships one (Phase 36); mobile's letterbox/coordinate probe before its input layer; closing verification last. Per project convention, no phase closes on greps/automation alone — interactive proof, and genuine (never rubber-stamped) human sign-off where claimed.

- [x] **Phase 29: Mechanic Cleanup** - Collect-the-answer removed everywhere atomically, math pacing rebalanced, and the secret alcove finally feels like finding a secret — cue on touch, positive-only marker on select (completed 2026-07-09)
- [x] **Phase 30: Harness Extensions** - The validator and interactive audit learn every new dynamic RED-first — alcove reachability + trigger signal, mover worst-case-extreme rule — before any level uses them (completed 2026-07-10)
- [x] **Phase 31: Asset Bake & Style-Board Sign-off** - Gothicvania-anchored biome art vendored, conformed, and human-approved on a style board before one pixel is integrated (completed 2026-07-10)
- [x] **Phase 32: Terrain & Parallax Rendering** - Solid autotiled ground and real multi-layer parallax replace floating strips and flat triangles — geometry byte-frozen (completed 2026-07-11)
- [x] **Phase 33: Player & Entity Animation** - Fully animated player and real animated mechanic-entity art on explicitly locked colliders (completed 2026-07-14)
- [ ] **Phase 34: Level Quality Pass** - Coin reachability fixed across all 8 levels behind a new coin-shaped validator check + in-engine coin gate, 07/08 climbs differentiated, soft-rules review done, and motion rules written into LEVEL-DESIGN.md
- [ ] **Phase 35: Biome Re-dress & Props** - All 8 levels dressed in their assigned biomes with a visual-only props layer — geometry byte-frozen
- [ ] **Phase 36: World Motion & Ambient Life** - Patrolling enemies, moving platforms, ambient animation, and the alcove's persistent torch — the world moves, ADHD-safe
- [ ] **Phase 37: Mobile — Responsive Canvas & Touch Controls** - Letterbox canvas migration + touch input layer — playable on a phone/tablet, keyboard untouched
- [ ] **Phase 38: n0x Logo & Closing Verification** - New n0x mark, live Dokploy playthrough, kid-UAT live sign-off, MOVE-05, and the consolidated v6.0 gate suite green in one run

## Phase Details

### Phase 29: Mechanic Cleanup

**Goal**: The mechanics that didn't land are gone or fixed before anything gets dressed — collect-the-answer dies atomically, the affected levels get their math rhythm back, and finding a secret alcove actually feels like something
**Depends on**: Nothing (first phase of v6.0; parallel-safe with Phase 31 — disjoint files)
**Requirements**: MECH-01, MECH-02, MECH-03, MECH-06
**Success Criteria** (what must be TRUE):

  1. No level anywhere presents a collect-the-answer encounter — the mechanic's code, level data, and every gate/fixture defending it (check-gate.sh #13, smoke-progress golden geometry, audit expectations, validator entries) are removed in one atomic change, and the full consolidated gate suite runs green afterward
  2. Each of the 5 formerly-collect levels (01/03/04/06/08) still plays with a satisfying math rhythm — at least 2 mid-level encounters plus the end gate using the remaining mechanics — and the XP economy checks out
  3. Touching a secret alcove produces immediate discovery feedback (particle burst + chime + "+5 XP" popup), exactly once per run, revealed only AFTER discovery — never pre-signposted, no secrets counter
  4. Level select shows a positive-only secret-found marker on levels where the secret was discovered (no "0/1" missing-framing), with the save version bump handled through the guarded progress seam

**Plans**: 2/2 plans complete
Plans:

- [x] 29-01-PLAN.md — Atomically remove the collect-the-answer mechanic (code, config, level data, harness fixtures) — MECH-01, MECH-02
- [x] 29-02-PLAN.md — Secret-alcove discovery feedback + level-select marker via a version-bumped save seam — MECH-03, MECH-06

### Phase 30: Harness Extensions

**Goal**: The verification harness can genuinely see every new v6.0 dynamic before any level ships one — alcoves become fully covered, and the validator stops being blind to movers a full phase-boundary before Phase 36 places any
**Depends on**: Phase 29 (the audit's alcove trigger signal detects the discovery cue MECH-03 lands); still precedes all re-dress and all motion
**Requirements**: MECH-04, MOT-04
**Success Criteria** (what must be TRUE):

  1. The validator provably catches an unreachable secret alcove — the point-vs-jump-reach rule demonstrated RED-first against a failing fixture before passing on all 8 real levels
  2. The interactive audit detects alcove discovery via the entity-destroy/XP-delta signal (never the challenge-open signal, which is contractually always false for alcoves) — closing the known automated blind spot across all 8 levels
  3. The validator HARD-FAILs a fixture level whose mover-dependent path is unreachable under the worst-case-extreme rule — proven RED-first before any real level ships a mover
  4. The full existing gate suite stays green — the new rules add coverage without false HARD-FAILs on shipped content

**Plans**: 3/3 plans complete

Plans:

- [x] 30-01-PLAN.md — Alcove point-reachability + mover worst-case-extreme reachability in reachability.mjs, both proven RED-first — MECH-04, MOT-04
- [x] 30-02-PLAN.md — Interactive audit alcove driving + entity-destroy/XP-delta detection, real browser-verified — MECH-04
- [x] 30-03-PLAN.md — LEVEL-DESIGN.md accuracy fixes + full 7-gate integration verification — MECH-04, MOT-04

### Phase 31: Asset Bake & Style-Board Sign-off

**Goal**: A style-coherent SNES-fidelity dark pixel-art collection is vendored, license-clean, conformed, and human-approved on a style board before any of it touches game code — the hard blocking gate for every downstream art phase
**Depends on**: Nothing (can run in parallel with Phases 29–30 — disjoint files); gates Phases 32, 33, 35
**Requirements**: ART-01
**Success Criteria** (what must be TRUE):

  1. User reviews a style-board mock screen (built from the candidate biome assets) and gives a genuine, multi-round human sign-off BEFORE any asset is integrated into the game — Phase 26 logo standard, never rubber-stamped
  2. One style-coherent CC0/CC-BY collection (ansimuz Gothicvania anchor, 3–4 biomes covering the 8 levels) is vendored under `assets/` with licenses in `assets/LICENSES/` and credits in `CREDITS.md`, named files only — no CC-BY music or unused pack content leaks in
  3. An automated pink-hue scan gate exists and passes over all vendored art — no pink asset can land now or in any future phase; the two known pink/magenta skies are retinted via the live-proven Pillow hue-conform pass
  4. Baked per-biome atlases follow a written anchor/lip convention (16×32-compatible cap tiles, documented lip offset) so downstream integration can prove sprites don't lie about solid ground

**Plans**: 6/6 plans complete

Plans:
**Wave 1**

- [x] 31-01-PLAN.md — Re-fetch the 5 Gothicvania OGA zip packs (source files absent from this filesystem), verify CC0 live — ART-01

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 31-02-PLAN.md — Regenerate the style board (Swamp Hunter + Hell hound swaps) and get a genuine round-2 human sign-off — ART-01
- [x] 31-03-PLAN.md — Write the pink-scan gate (`check-pink-gate.sh` + `pink_scan.py`), proven RED-first against the 2 known pink assets — ART-01

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 31-04-PLAN.md — Bake all 4 biomes' terrain atlases + parallax layers, retinting Town/Cemetery's pink skies — ART-01

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 31-05-PLAN.md — Bake the Swamp Hunter player + Hell hound enemy sprites, write the anchor/lip convention doc — ART-01

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 31-06-PLAN.md — CREDITS.md + LICENSES proof files, final full-tree pink-gate regression proof — ART-01

### Phase 32: Terrain & Parallax Rendering

**Goal**: Levels stand on solid, filled ground under real layered skies — the rendering machinery (autotiler, chunked fill, biome threading, manifest) lands with kid-validated geometry byte-frozen
**Depends on**: Phase 31 (style-board sign-off + baked atlases — hard gate)
**Requirements**: ART-02, ART-03
**Success Criteria** (what must be TRUE):

  1. Standing anywhere in any level, the ground reads as a solid autotiled mass (surface + underground fill + edge/corner tiles) instead of a floating 16px strip — rendered via the spike-proven chunked `{tiled:true}` recipe, with colliders untouched
  2. Each biome shows a real multi-layer parallax background (sky + 2–3 detail layers) that moves with the camera, replacing the flat triangle silhouettes
  3. Frame rate holds and nothing renders blank at the far end of the longest level — per-level screenshot, FPS, and far-end non-blank checks added to browser-boot, with an object-count budget assertion guarding the known perf cliffs
  4. Every sprite/sound the game loads exists on disk — a data-driven assets manifest with a static existence gate kills the silent-404 class
  5. Level geometry arrays are byte-identical to their pre-phase state (review-gated) and the structural validator stays green with zero HARD-FAILs

**Plans**: 5/5 plans complete

Plans:
**Wave 1**

- [x] 32-01-PLAN.md — Assets manifest + existence gate (src/assets-manifest.js, scripts/check-assets-manifest.mjs) — ART-02, ART-03
- [x] 32-02-PLAN.md — CONFIG.TERRAIN tunables + biome field on all 8 level descriptors (replaces theme) — ART-02, ART-03

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 32-03-PLAN.md — Autotile cap+chunked-fill terrain renderer in src/levels/build.js — ART-02
- [x] 32-04-PLAN.md — Biome-threaded parallax + manifest-driven main.js loading + theme-N asset cleanup — ART-02, ART-03

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 32-05-PLAN.md — browser-boot.mjs screenshot/FPS/object-budget/far-end checks — ART-02, ART-03

### Phase 33: Player & Entity Animation

**Goal**: The avatar and every mechanic entity look alive at SNES fidelity while physics stay byte-identical to the kid-validated feel
**Depends on**: Phase 31 (style-board sign-off — hard gate); independent of Phase 32, can overlap
**Requirements**: ART-04, ART-05
**Success Criteria** (what must be TRUE):

  1. The player is fully animated — distinct idle, run (4+ frames), jump, fall, and land states — under a new human sign-off superseding the v4.1 player-art lock
  2. Jump feel is unchanged: the physics collider stays exactly 16×32 via explicit `area({ shape })`, proven with feet-on-ground screenshots (flat floor, 1-tile platform, lowest ceiling, door) against `?debug=1` colliders
  3. Doors, checkpoint gates, enemy blockers, and the math gate show real animated art in place of flat-color panels, with their invisible blocker colliders untouched
  4. The full interactive mechanic audit still triggers every encounter across all 8 levels — the art swap is proven collision-neutral, not assumed

**Plans**: 5/5 plans complete

Plans:
**Wave 1**

- [x] 33-01-PLAN.md — Bake native-color door/math-gate art (church/castle packs) + retire dead enemy-1/2/3 assets — ART-05
- [x] 33-02-PLAN.md — Boot-time sprite loading: player-swamphunter 5-state anims, enemy-hellhound idle loop, math-gate load, config tunables, manifest rows — ART-04, ART-05

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 33-03-PLAN.md — Lock the player collider to 16x32, add fall/land anim-state logic — ART-04
- [x] 33-04-PLAN.md — Wire real math-gate/enemy visual emission in build.js, re-prove collision-neutral via the interactive audit — ART-05

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 33-05-PLAN.md — Full consolidated gate suite + genuine human sign-off superseding the v4.1 player-art lock — ART-04, ART-05

### Phase 34: Level Quality Pass

**Goal**: The known content defects are fixed and the motion rulebook is written — geometry edits land and settle before art dresses them and before anything moves
**Depends on**: Phase 29 (level descriptors settle after collect removal), Phase 30 (extended validator gates the geometry edits)
**Requirements**: LVL-01, LVL-02, LVL-03
**Success Criteria** (what must be TRUE):

  1. Every pickup and ledge is actually reachable in play across ALL 8 levels (34-CONTEXT.md decision 1 — measurement showed unreachable coins in every level, not just 5–8) — fixed by MOVING COINS, never geometry, validator-gated, landed in their own commits (levels 1–3 in a separate commit) so drift can't hide in later art diffs
  2. Level-07 and level-08's end climbs are visibly and mechanically different experiences, no longer near-duplicates (with level-08's explicit `bounds.right` hand-bumped where extended)
  3. All 8 levels pass a documented review against `docs/LEVEL-DESIGN.md` soft rules, and motion design rules (checkpoint before every mover; missed platform = wait, not death; patrollers carry zero hurt wiring) are written into LEVEL-DESIGN.md BEFORE any motion authoring
  4. Structural validator green with zero HARD-FAILs across all 8 post-fix levels

**Plans**: 6/7 plans executed

Plans:

- [x] 34-07-PLAN.md

**Wave 1**

- [x] 34-01-PLAN.md — Coin-appropriate `coin-reachability` check in reachability.mjs (48×64 pass-through box, not the alcove point model), proven RED-first; re-derives the true work list — LVL-01

**Wave 2** *(blocked on Wave 1)*

- [x] 34-02-PLAN.md — `scripts/audit-coins.mjs`: in-engine witness replay proving every model-PASS coin is actually collected by a real driven player — LVL-01

**Wave 3** *(blocked on Wave 2; the two plans are file-disjoint)*

- [x] 34-03-PLAN.md — Coin moves, levels 04–07 (coins only, zero geometry edits) + level-04 golden-fixture re-baseline — LVL-01
- [x] 34-04-PLAN.md — Level-08 switchback end climb + its coins/checkpoints/alcove/goal/bounds, with a blocking human sign-off on the shape — LVL-02, LVL-01

**Wave 4** *(blocked on 34-03 — shares scripts/smoke-progress.mjs)*

- [ ] 34-05-PLAN.md — Coin moves, kid-validated levels 01–03, in their own auditable commit — LVL-01

**Wave 5** *(blocked on Waves 3–4)*

- [x] 34-06-PLAN.md — Motion rules + coin HARD rule into LEVEL-DESIGN.md, documented 8-level soft-rules review, full consolidated suite green — LVL-03, LVL-01, LVL-02

### Phase 34.5: Key & Lock Mechanic — the first non-math gate

**Goal**: A key/lock mechanic exists, is provably softlock-free, and is validator- and audit-covered — BEFORE any level is authored to use it
**Depends on**: Phase 34 (the bidirectional harness — a key on a doubling-back route cannot be driven or proven without it)
**Requirements**: KEY-01, KEY-02
**Added**: 2026-07-15, at the user's explicit request.

**⚠ THIS REVERSES A LOCKED v6.0 DECISION.** SEED-001 (2026-07-07) locked v6.0 to *"visuals + cosmetic world motion only — **no new play mechanics**"*. The user explicitly chose to override it ("Keep keys — override the lock"). Recorded as a knowing reversal, not an oversight.

**It is also the game's FIRST non-math gate.** The project's thesis is that *multiplication is the gate to progress*; a key-lock blocks her for a reason that is not math. That is a real change to the game's identity and was accepted deliberately.

**Why it lands BEFORE the rebuild:** a key is code (a mechanics module, descriptor fields, validator + audit coverage), not geometry. If it landed after Phase 34.6, all 8 rebuilt levels would need a second geometry pass to retrofit key/lock placements — the same "pay for it twice" trap the Phase-35 ordering exists to avoid.

**Success Criteria** (what must be TRUE):

  1. `geometry.keys` / `geometry.locks` descriptor fields + a `src/mechanics/key.js` seam, following the existing mechanic conventions (pure-data levels; the ONE builder owns entity creation; no engine globals at module top level).
  2. **HARD — no softlock is possible.** The validator must PROVE, per level, that every lock's key is reachable from spawn *and* reachable BEFORE the lock is required. A key she can miss on a route she cannot re-traverse is a dead end — and a dead end in a no-punishment game is the worst failure this project can ship. This gets a HARD validator check, exactly like coin-reachability got one.
  3. In-engine audit coverage: a real driven player picks up the key and opens the lock (`audit-*.mjs`). The static model is not sufficient — this milestone has repeatedly shipped bugs past a green static model.
  4. No timers, no punishment, no game-over. Missing the key means *go back and get it*, never death or a reset.
  5. **OPEN DESIGN QUESTION for the phase's discuss step:** does the key-lock ADD a 4th barrier to the level (1 math door + 1 enemy + end gate + 1 key lock), or REPLACE the math door? Math density is currently LOCKED at 3 challenges per level. This must be decided explicitly — it changes the game's pacing either way.
     - **RESOLVED (discuss, 2026-07-15):** ADD a 4th NON-math barrier — do NOT replace the math door. Math density stays LOCKED at 3. The key opens the EXIT (locked corridor → end math gate → LEVEL CLEAR).

**Plans**: 3/3 plans complete

Plans:
**Wave 1**

- [x] 34.5-01-PLAN.md — Static softlock proof: key-lock-check.mjs + LOCK/KEY/HUD config + reachability exports + RED-first bad-level-key fixture composed into validate-levels.mjs (KEY-02)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 34.5-02-PLAN.md — Mechanic wiring: src/mechanics/key.js (pickup + lock-open) + build.js entity emission + game.js keyHeld run-state + hud.js indicator + import-safety guard (KEY-01)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 34.5-03-PLAN.md — In-engine proof: level-02 throwaway key-lock placement + audit-key-lock.mjs driven-player audit (KEY-01, KEY-02)

### Phase 34.6: Level Redesign — Rebuild and Double Every Level

**Goal**: Every level's platform layout is REBUILT from scratch and roughly twice as long — the last geometry change of the milestone, landing before any art dresses it
**Depends on**: Phase 34 (quality fixes, the headroom rule, and the bidirectional harness must all settle first — the harness fix is what makes a long, non-linear level's completion provable at all)
**Requirements**: LEN-01, LEN-02
**Added**: 2026-07-14, at the user's request, mid-Phase-34.

**Why HERE and not later** — this is the only cheap moment. The roadmap's own ordering principle is "geometry settles before re-dress." Terrain and parallax are procedural (autotiled per floor-run, camera-driven), so new geometry gets dressed for FREE by the renderer; but the **props layer (Phase 35)** and **motion placement (Phase 36)** are hand-placed and would have to be re-run over any geometry that changes after them. Geometry settles once, art dresses it once, motion is placed on it once.

**⚠ THIS PHASE DELIBERATELY BREAKS THE KID-VALIDATED FREEZE (explicit user decision, 2026-07-14).**
The standing convention — "extending kid-validated levels: append new sections after the existing geometry, never edit inside it" (CLAUDE.md) — is **suspended for this phase and this phase only**. The user's instruction was unambiguous: *"make sure to redo the entire level. not just extending, as the current placements are a bit 'beta'."* A full rebuild is judged better than dressing a weak layout in SNES-fidelity art.

**The cost, stated plainly so nobody is surprised by it:** levels 01–03's kid-validated platforming is being thrown away. Her prior sign-off no longer covers them. **Every level must therefore be re-validated by the kid in Phase 38's UAT (VER-02)** — that is no longer a formality on unchanged levels, it is a real re-approval of new content. Phase 38 must budget for a rejection.

**Success Criteria** (what must be TRUE):

  1. Every level's `floors`/`platforms` layout is REBUILT (not appended to) and each level is ~2x its current length. The "append-only" rule does not apply here; the CLAUDE.md convention is explicitly overridden for this phase.
  2. **Math density stays LOCKED at 1 door + 1 enemy + the end gate per level** (user decision, reaffirmed 2026-07-14). Twice the level with the same 3 challenges means twice the platforming per math gate — this is the INTENT, not a dilution: "the platforming is the intrinsically fun part; math is what stands between her and the next stage."
  3. A documented platform-placement review across every level against the FULL `docs/LEVEL-DESIGN.md` rule set — **including the headroom rule added in Phase 34** (`rise − thickness − 32 ≥ 24px`; 9px headroom shipped unnoticed on every tier of level-07 because no rule and no gate existed for it). The new layouts are authored against the rules from the start, not retrofitted to them.
  4. Each level's explicit `bounds.right` hand-bumped to match its new extent (the documented bounds-convention trap — level-02+ carry bounds used AS-IS).
  5. The gentle difficulty ramp across levels 1→8 is preserved (level-01 must still be a soft landing for a 12-year-old; the arc calm→harsh is a design property, not an accident of the old layouts).
  6. Structural validator + coin-reachability + the bidirectional in-engine drive all green with zero HARD-FAILs across all 8 rebuilt levels — every level provably completable from spawn by a real driven player, and every coin provably collectable.
  7. Level-07 and level-08 remain mechanically DIFFERENT (LVL-02 must not be undone by the rebuild). NOTE: LVL-02 requires only that they are *not near-duplicates of each other* — it never mandated altitude. The end-climb was inherited design, not a requirement.

**AGREED LEVEL-SHAPE BRIEF (user, 2026-07-15) — what the rebuilt levels must actually feel like:**

  8. **ALTITUDE IS A CORE FEATURE, NOT AN ENDING.** Verticality runs through the whole game, not bolted onto the last two levels. `LEVEL-REVIEW.md` found the current arrangement is the defect: six of eight levels have ZERO overlapping tiers, and 07/08 carry the game's *easiest* gaps — the ramp is a cliff at the end, not a curve.

  9. **THE BIOME-PAIR RHYTHM (the organising idea).** Biomes are already pairs — 1–2 swamp, 3–4 town, 5–6 cemetery, 7–8 castle. The **odd** level is the first visit to a biome (calmer, introduces it); the **even** level is the second visit and goes **intense and vertical**. So levels **2, 4, 6, 8** are the vertical ones. This gives every biome its own arc and makes the difficulty ramp structural rather than aspirational.

  10. **DESCENTS, not only ascents.** Levels currently only ever go up. Author deliberate downward sections — drops onto ledges below, falling routes. (Cheap now: the Phase-34 bidirectional driver handles non-monotonic routes.)

  11. **OPTIONAL HIGH ROUTES (risk/reward).** A harder upper path carrying more coins alongside the safe ground route. Rewards skill without punishing failure — consistent with the no-punishment mandate, and a natural companion to the existing secret alcove.

  12. **BACKTRACKING — VISIBLE DOUBLING-BACK ONLY.** Routes may fold back on themselves (now provable, since the harness drives leftward), but she must ALWAYS be able to SEE where she is going next. **No hidden routes, no "where am I supposed to go?"** — a 12-year-old with ADHD who loses the thread stops playing, and that is the one failure this project cannot afford. Level-08's switchback is the reference: it doubles back in full view, and she read it fine.

  13. **Keys/locks placed per Phase 34.5's mechanic** — and the softlock proof (34.5 SC2) must be green for every rebuilt level. **REFINED (34.6-CONTEXT.md, overrides 34.5's shipped design):** on EVEN levels the key is an OPTIONAL "math-skip token" on a high risk/reward route — NO physical lock; key-held clears the level FREE with FULL XP (skip the end math), no key answers the end math. Use `geometry.keys` WITHOUT `geometry.locks`; the 34.5 physical-lock code + its softlock validator stay dormant (not deleted).

**Plans**: 6/11 plans executed

Plans:
**Wave 1** *(parallel — file-disjoint)*

- [x] 34.6-01-PLAN.md — End-gate key-conditional mechanic seam (game.js shared clearLevel() + heldKeyIds branch; config XP_KEY_SKIP) — LEN-02
- [x] 34.6-02-PLAN.md — Rebuild level-01 (calm swamp intro, ~2x, no ceilings) + smoke re-baseline — LEN-01, LEN-02

**Wave 2**

- [x] 34.6-03-PLAN.md — Rebuild level-02 (intense/vertical + math-skip key, no lock) + two-path audit-endgate-key.mjs + smoke re-baseline — LEN-01, LEN-02

**Wave 3** *(mandated mid-phase human checkpoint)*

- [x] 34.6-04-PLAN.md — checkpoint:human-verify on the 01+02 prototype shape + lock A1 (key-skip XP) / A3 (level-02 verticality) — LEN-01, LEN-02

**Wave 4** *(parallel — blocked on the checkpoint)*

- [x] 34.6-05-PLAN.md — Rebuild level-03 (town intro, calm) + smoke re-baseline — LEN-01, LEN-02
- [x] 34.6-06-PLAN.md — Rebuild level-05 (cemetery intro, calm) — LEN-01, LEN-02
- [ ] 34.6-07-PLAN.md — Rebuild level-06 (cemetery, intense/vertical + math-skip key) — LEN-01, LEN-02
- [ ] 34.6-08-PLAN.md — Rebuild level-07 (castle intro, monotonic staircase — deletes the 5 headroom fails) — LEN-01, LEN-02
- [ ] 34.6-09-PLAN.md — Rebuild level-08 (castle finale, switchback + math-skip key) — LEN-01, LEN-02

**Wave 5** *(serialized after 34.6-05 — shared smoke-progress fixture)*

- [ ] 34.6-10-PLAN.md — Rebuild level-04 (town, intense/vertical + math-skip key) + smoke re-baseline — LEN-01, LEN-02

**Wave 6**

- [ ] 34.6-11-PLAN.md — Final consolidation: full 8-level gate suite green (zero HARD-FAIL) + documented LEVEL-DESIGN review — LEN-01, LEN-02

### Phase 35: Biome Re-dress & Props

**Goal**: All 8 levels are fully dressed in their assigned biomes with a props layer — purely visual, on geometry that has already settled
**Depends on**: Phases 32 + 33 (terrain/parallax/entity art integrated), Phase 34 + 34.5 (sanctioned geometry fixes AND the level-length change landed and settled first — Phase 35 must dress FINAL geometry, or the props layer gets re-run)
**Requirements**: ART-06, ART-07
**Success Criteria** (what must be TRUE):

  1. All 8 levels are re-dressed in their assigned biome, with kid-validated geometry byte-frozen during re-dress — geometry arrays byte-identical to their post-Phase-34 state (review-gated)
  2. Levels carry a visual-only `props` layer (torches, crates, chains…) in their descriptors — no colliders, validator-neutral
  3. Each level's in-game look matches the signed-off style-board direction, spot-checked with per-level screenshots; old tint-theme assets are deleted
  4. Full gate suite + structural validator green across all 8 re-dressed levels

**Plans**: TBD

### Phase 36: World Motion & Ambient Life

**Goal**: The world visibly moves — patrols, moving platforms, flickering ambient life — all dt-based, telegraphed, and ADHD-safe, placed only where the re-dressed levels and the mover-aware validator allow
**Depends on**: Phase 30 (mover validation live RED-first), Phase 34 (LEVEL-DESIGN.md motion rules), Phase 35 (re-dressed sections to place motion in)
**Requirements**: MOT-01, MOT-02, MOT-03, MECH-05
**Success Criteria** (what must be TRUE):

  1. Patrolling cosmetic enemies walk fixed waypoint paths with a walk-cycle telegraph; touching one respawns her at the checkpoint (existing hazard class) with zero hurt/punishment wiring, and they're visually distinct from stationary math-blocker enemies
  2. Moving platforms carry the player natively (`stickToPlatform`), ping-pong with natural endpoint slow-down (dt-based sine easing, no timers), and appear only in new/re-dressed sections behind a checkpoint
  3. Torch flames flicker, goal/checkpoint unlocks animate, and ambient shimmer plays — pure visual loops built exclusively from check-safety-compliant spike-code idioms (no `wait()`/`loop()`)
  4. Discovering a secret alcove leaves a persistent, visible in-level ambient change for the rest of the run (e.g. a torch lights up) — positive-only reinforcement
  5. Validator and interactive audit stay green with motion live — the audit rides every mover and crosses every patroller — and hazard placement gets a genuine human sign-off

**Plans**: TBD

### Phase 37: Mobile — Responsive Canvas & Touch Controls

**Goal**: She can play on a phone or tablet — responsive canvas, touch movement/jump, tappable answers — while the kid-validated keyboard/desktop experience stays byte-identical
**Depends on**: Phase 29 (challenge-seam simplification settled); independent of the art/motion track (Phases 31–36) — parallel-safe after Phase 29
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04, MOB-05
**Success Criteria** (what must be TRUE):

  1. A RED-first Playwright touch-coordinate probe first proves the current CSS-transform desync, then proves the letterbox migration fixes it, and stays as a permanent gate — desktop look and all mouse behavior preserved, stale pitfall comments in main.js/index.html rewritten
  2. On a touch device she can run and jump with discrete left/right + jump virtual buttons with hold semantics (variable-height jump works by press duration), multi-touch per-identifier tracking, ≥64px effective hit zones, visible only on touch devices, and challenge-pause-aware — tunables in CONFIG
  3. Math answers, the mute toggle, and reset are tappable on touch devices via the unified coordinate mapping
  4. Holding the device portrait shows a "rotate your device" overlay, and browser scroll/zoom gestures never fight the game (`touch-action: none`, viewport meta — no `screen.orientation.lock()` reliance)
  5. Audio genuinely starts after the first touch on a real device (`touchstart` is not an activation-triggering event — verified, not assumed), and iOS ITP 7-day storage eviction is documented as expectation (laptop stays the progress home)

**Plans**: TBD
**UI hint**: yes

### Phase 38: n0x Logo & Closing Verification

**Goal**: The finished SNES-fidelity world carries its new mark and every long-open verification debt is genuinely closed — live URL, kid in the loop, all gates green in one run
**Depends on**: Phases 36, 37 (rides on the finished visual/motion/mobile state — everything converges here)
**Requirements**: BRAND-01, MOB-06, VER-01, VER-02, VER-03, VER-04
**Success Criteria** (what must be TRUE):

  1. The title screen and level-select badge carry a new "n0x" logo treatment — a redesigned mark belonging to the SNES identity, not a text swap — approved through a Phase-26-standard multi-round human sign-off
  2. The game is played end-to-end at the live Dokploy URL (open since v3.0), confirming the deployed build actually works where she plays it
  3. The kid plays a live session and signs off — platforming feel, the moving world, touch feel, and non-over-stimulation (open since v4.0) — with the touch layout validated and tuned on a real device by watching her hands
  4. Movement feels right on a throttled/non-60Hz display — the MOVE-05 empirical feel check (open since v3.0) is closed
  5. The full consolidated automated gate suite — every existing gate plus every new v6.0 gate (pink-scan, touch-mapping, mover validation, alcove coverage, manifest existence) — passes green in one run

**Plans**: TBD

## Progress

**Execution Order:** Phases execute in numeric order: 29 → 30 → 31 → 32 → 33 → 34 → 35 → 36 → 37 → 38. Parallel tracks allowed by dependencies: 31 ∥ 29–30 (disjoint files), 33 ∥ 32 (both gated only by 31), 37 ∥ the art/motion track (31–36) any time after 29; everything converges at 38.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. MVP Core Loop & ADHD-Safe Mechanics | v1.0 | 4/4 | ✅ Complete | 2026-06-20 |
| 2. Combat Foundation | v2.0 | 3/3 | ✅ Complete | 2026-06-21 |
| 3. Screen Architecture | v2.0 | 2/2 | ✅ Complete | 2026-06-21 |
| 4. Dungeon Renderer | v2.0 | 3/3 | ✅ Complete | 2026-06-21 |
| 5. Full Floor Loop + Balance | v2.0 | 2/2 | ✅ Complete | 2026-06-21 |
| 6. Polish + ADHD Safety Audit | v2.0 | 2/2 | ✅ Complete | 2026-06-22 |
| 7. Project Setup & Deployment | v3.0 | 2/2 | ✅ Complete | 2026-06-22 |
| 8. Platformer Core | v3.0 | 3/3 | ✅ Complete | 2026-06-24 |
| 9. Level Build & CC0 Assets | v3.0 | 3/3 | ✅ Complete | 2026-06-25 |
| 10. Math-Gate Integration | v3.0 | 3/3 | ✅ Complete | 2026-06-26 |
| 11. Progression & Persistence | v3.0 | 4/4 | ✅ Complete | 2026-06-27 |
| 12. Polish, ADHD-Safety & UAT | v3.0 | 3/3 | ✅ Complete | 2026-06-28 |
| 13. Fresh Save Format + Level Registry/Data | v4.0 | 4/4 | ✅ Complete | 2026-06-29 |
| 14. Multi-Scene Shell | v4.0 | 3/3 | ✅ Complete | 2026-07-02 |
| 15. Challenge Seam + Locked-Door Mechanic | v4.0 | 4/4 | ✅ Complete | 2026-07-02 |
| 16. Remaining Mechanics + Difficulty Curve | v4.0 | 3/3 | ✅ Complete | 2026-07-03 |
| 17. Build the Levels | v4.0 | 4/4 | ✅ Complete | 2026-07-03 |
| 18. Art, Animation & Parallax | v4.0 | 4/4 | ✅ Complete | 2026-07-03 |
| 19. Polish & Consolidated Kid-UAT | v4.0 | 4/4 | ✅ Complete | 2026-07-03 |
| 20. Real CC0 Art Redo & Human Sign-off | v4.1 | 3/3 | ✅ Complete | 2026-07-04 |
| 21. Real Verification Pass — Mechanics & Sign-off Integrity | v4.1 | 7/7 | ✅ Complete | 2026-07-04 |
| 22. Implementation Review & Auto-Fix | v5.0 | 5/5 | ✅ Complete | 2026-07-05 |
| 23. Level Validation Harness | v5.0 | 5/5 | ✅ Complete | 2026-07-05 |
| 24. Fix & Lengthen Levels 1–4 | v5.0 | 6/6 | ✅ Complete | 2026-07-06 |
| 25. Levels 5–8, Difficulty Ramp & Select Grid | v5.0 | 7/7 | ✅ Complete | 2026-07-07 |
| 26. Grunge Palette & Nox Run Rebrand | v5.0 | 12/12 | ✅ Complete | 2026-07-07 |
| 27. Audio & ADHD-Safe Sound | v5.0 | 7/7 | ✅ Complete | 2026-07-08 |
| 28. Full Verification & Interactive Sign-off | v5.0 | 3/3 | ✅ Complete | 2026-07-09 |
| 29. Mechanic Cleanup | v6.0 | 2/2 | Complete    | 2026-07-09 |
| 30. Harness Extensions | v6.0 | 3/3 | Complete    | 2026-07-10 |
| 31. Asset Bake & Style-Board Sign-off | v6.0 | 6/6 | Complete    | 2026-07-10 |
| 32. Terrain & Parallax Rendering | v6.0 | 5/5 | Complete    | 2026-07-11 |
| 33. Player & Entity Animation | v6.0 | 5/5 | Complete   | 2026-07-14 |
| 34. Level Quality Pass | v6.0 | 6/7 | In Progress|  |
| 35. Biome Re-dress & Props | v6.0 | 0/TBD | Not started | - |
| 36. World Motion & Ambient Life | v6.0 | 0/TBD | Not started | - |
| 37. Mobile — Responsive Canvas & Touch Controls | v6.0 | 0/TBD | Not started | - |
| 38. n0x Logo & Closing Verification | v6.0 | 0/TBD | Not started | - |

---

*Archives: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md) · [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md) · [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md) · [v5.0-ROADMAP.md](milestones/v5.0-ROADMAP.md)*
*v6.0 roadmap created 2026-07-09 (revised same day: resized 8 → 10 phases for a Sonnet-5 executor) — next: `/gsd-plan-phase 29`*
