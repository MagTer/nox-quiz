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
- [ ] **Phase 33: Player & Entity Animation** - Fully animated player and real animated mechanic-entity art on explicitly locked colliders
- [ ] **Phase 34: Level Quality Pass** - Levels 5–8 reachability fixed, 07/08 climbs differentiated, soft-rules review done, and motion rules written into LEVEL-DESIGN.md
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

**Plans**: 5 plans

Plans:
**Wave 1**

- [ ] 33-01-PLAN.md — Bake native-color door/math-gate art (church/castle packs) + retire dead enemy-1/2/3 assets — ART-05
- [ ] 33-02-PLAN.md — Boot-time sprite loading: player-swamphunter 5-state anims, enemy-hellhound idle loop, math-gate load, config tunables, manifest rows — ART-04, ART-05

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 33-03-PLAN.md — Lock the player collider to 16x32, add fall/land anim-state logic — ART-04
- [ ] 33-04-PLAN.md — Wire real math-gate/enemy visual emission in build.js, re-prove collision-neutral via the interactive audit — ART-05

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 33-05-PLAN.md — Full consolidated gate suite + genuine human sign-off superseding the v4.1 player-art lock — ART-04, ART-05

### Phase 34: Level Quality Pass

**Goal**: The known content defects are fixed and the motion rulebook is written — geometry edits land and settle before art dresses them and before anything moves
**Depends on**: Phase 29 (level descriptors settle after collect removal), Phase 30 (extended validator gates the geometry edits)
**Requirements**: LVL-01, LVL-02, LVL-03
**Success Criteria** (what must be TRUE):

  1. Every pickup and ledge in levels 5–8 is actually reachable in play — validator-gated geometry fixes, landed in their own commits so drift can't hide in later art diffs
  2. Level-07 and level-08's end climbs are visibly and mechanically different experiences, no longer near-duplicates (with level-07/08's explicit `bounds.right` hand-bumped where extended)
  3. All 8 levels pass a documented review against `docs/LEVEL-DESIGN.md` soft rules, and motion design rules (checkpoint before every mover; missed platform = wait, not death; patrollers carry zero hurt wiring) are written into LEVEL-DESIGN.md BEFORE any motion authoring
  4. Structural validator green with zero HARD-FAILs across all 8 post-fix levels

**Plans**: TBD

### Phase 35: Biome Re-dress & Props

**Goal**: All 8 levels are fully dressed in their assigned biomes with a props layer — purely visual, on geometry that has already settled
**Depends on**: Phases 32 + 33 (terrain/parallax/entity art integrated), Phase 34 (sanctioned geometry fixes landed and settled first)
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
| 33. Player & Entity Animation | v6.0 | 0/5 | Planned | - |
| 34. Level Quality Pass | v6.0 | 0/TBD | Not started | - |
| 35. Biome Re-dress & Props | v6.0 | 0/TBD | Not started | - |
| 36. World Motion & Ambient Life | v6.0 | 0/TBD | Not started | - |
| 37. Mobile — Responsive Canvas & Touch Controls | v6.0 | 0/TBD | Not started | - |
| 38. n0x Logo & Closing Verification | v6.0 | 0/TBD | Not started | - |

---

*Archives: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) · [v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md) · [v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md) · [v4.1-ROADMAP.md](milestones/v4.1-ROADMAP.md) · [v5.0-ROADMAP.md](milestones/v5.0-ROADMAP.md)*
*v6.0 roadmap created 2026-07-09 (revised same day: resized 8 → 10 phases for a Sonnet-5 executor) — next: `/gsd-plan-phase 29`*
