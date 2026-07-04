# Milestones: Math Lab

## v4.1 Art Rework (Shipped: 2026-07-04)

**Phases completed:** 2 phases, 10 plans, 22 tasks

**Key accomplishments:**

- Real Kenney CC0 art (Platformer Characters Adventurer + Pixel Platformer grass/dirt tiles) replaces Phase 18's procedural placeholder player/ground sprites, via a new build-art-assets.py pipeline with a luminance-ramp palette remap fix.
- Real Kenney "Background Elements" silhouettes (mountains, hills, temple, castle, tower, clouds) replace Phase 18's random-rectangle parallax and low-contrast noise title backdrop, composited onto the locked canvas dimensions and palette-remapped via Plan 01's luminance-ramp technique.
- A real, two-round, blocking AskUserQuestion sign-off — the first genuine one in this project's history — caught and drove the fix of a real art-invisibility bug, then confirmed the fix, closing PROC-02 for real.
- New Playwright audit script drives real movement + real answer-key input across all 4 levels, refuting 2 of 3 standing hypotheses with screenshot evidence and discovering a new overlapping-challenge bug the code-only hypotheses never predicted.
- Hardened `scripts/browser-boot.mjs` to hold real directional input and fully resolve level-01's collect zone + math gate via real key input, then proved the hardening genuine with a RED/GREEN calibration against the exact v4.0 collect.js soft-lock pattern.
- Replaced v4.0-MILESTONE-AUDIT.md's unqualified "Human browser-boot NAV-01..04 sign-off recorded" claim with a dated, additive annotation citing 14-VERIFICATION.md's own `human_needed` status and never-executed checkpoint, mirrored into v4.0-REQUIREMENTS.md's NAV-04 traceability row.
- Fixed enemy.js's arithmetic-hiding bug via an additive two-line label/arithmetic display in challenge.js, applied defensive color() consistency to challenge.js/build.js, and re-confirmed zero regressions via a full 4-level interactive audit re-run.
- Platform-aware jump-whenever-grounded traversal in scripts/lib/mechanic-drive.mjs newly reaches door.js and enemy.js via real keyboard movement (not teleport), with a Rule-1 regression fix scoping an opt-in reactive warmup to each level's first encounter only.
- openChallenge() now hides an already-open earlier challenge's overlay via Kaplay's base `hidden` flag and restores it on close(), closing the last open gap from VERIFICATION.md's VERIFY-02 truth.
- Replaced `scripts/browser-boot.mjs`'s level-01-only hand-tuned movement/resolution check with a generic, geometry-driven per-level loop (reusing Plan 21-05's shared `mechanic-drive.mjs` helpers) that holds real directional input and fully resolves at least one mechanic on every one of the 4 levels — closing VERIFY-03's remaining gap and fixing a genuine intermittent flake discovered along the way.

---

## v4.0 — Content & Challenge

**Status:** ✅ SHIPPED 2026-07-03
**Phases:** 13–19 (7 phases, 26 plans)
**Timeline:** 2026-06-28 → 2026-07-03 (6 days)

**Delivered:**
Grew the working single-level v3.0 slice into a real, replayable multi-level game: four hand-built dark-grunge levels, a title screen, a level-select map, and four forgiving in-world math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) woven throughout. Table and platforming difficulty ramp gently; art/animation/parallax pass makes it look like an actual game.

**Key Accomplishments:**

1. Fresh save format + level registry: versioned clean-reset save with per-level completion/unlock derived from `LEVEL_ORDER`, plus a pure parameterized builder and plain-JS level descriptors (no build step, no Tiled, no Kaplay `addLevel`).
2. Multi-scene navigation shell: dark-grunge title screen, level-select with locked/unlocked/cleared state, and clean scene transitions with no leaked handlers/effects across title → select → game.
3. Shared `ui/challenge.js` seam + four math mechanics: locked doors, checkpoint gates, defeat-enemy, and collect-the-answer — all forgiving, no-timer, wrong-answer re-asks with zero punishment or progress loss.
4. Four hand-built levels with decoupled platforming and table difficulty ramps, traversable start→goal on the existing movement/collider spine.
5. Art/animation/parallax pass: animated player (idle/run/jump + facing), real dark-grunge tileset, camera-tied parallax, styled title/select screens.
6. Full ADHD-safety + import-safety (a727c13) audits across all new code; automated browser-boot regression green for title → select → all four levels.

**Stats:**

- ~3,456 LOC across `src/` (excl. vendored Kaplay), HTML, and nginx config — multi-file, no build step
- Requirements: 22/22 v4.0 requirements satisfied (21 verified + automated browser boot; SAFE-05 kid-UAT live sign-off deferred)
- Git range `5151d32..HEAD`: 190 files changed, 16,639 insertions(+), 1,664 deletions(-)

**Known Deferred Items at Close:** 1

- Phase 19 SAFE-05: live kid-UAT sign-off for non-strobing/non-over-stimulating art and fun/fair feel. Protocol in `.planning/phases/19-polish-consolidated-kid-uat/19-UAT.md`.

**Archive:** `.planning/milestones/v4.0-ROADMAP.md`, `.planning/milestones/v4.0-REQUIREMENTS.md`

---

## v3.0 — The Platformer

**Status:** ✅ SHIPPED 2026-06-28
**Phases:** 7–12 (6 phases, 18 plans, 29 tasks)
**Timeline:** 2026-06-22 → 2026-06-28 (7 days)

**Delivered:**
Pivoted Math Lab from a quiz/dungeon into a real 2D platformer she controls with the keyboard — run, jump, reach the goal, where math is the gate to progress. Built on vendored Kaplay (no build step), served over HTTP, with persisted XP/leveling. Kid-validated end-to-end: "the game seems to be working… all good."

**Key Accomplishments:**

1. No-build multi-file architecture (HTML + ES modules + `src/lib/assets`) with Kaplay 3001.0.19 vendored locally (sha256-pinned, no CDN/npm) and an inline `file://` guard; packaged into a single-stage nginx:alpine container with the critical `.mjs → application/javascript` MIME fix (curl-proven locally) + a Dokploy deploy checklist.
2. Mario-feel platformer core: dt-correct run/jump with variable jump height, coyote time, and jump buffering; smooth camera follow clamped to level bounds; gentle checkpoint respawn (no lives, no game-over).
3. One polished ~3.5-screen dark-grunge level from verified-CC0 sprites (HorusKDI "6 Color Dungeon" + PuddinThur "Rotating Coin", licenses + CREDITS documented), with merged-floor colliders (anti-seam-stick/tunneling), collectible coins, a forgiving spike hazard, and a goal.
4. The keystone math gate: an in-world, forgiving, no-timer Kaplay overlay driven by the ported 6–9-weighted brain through a single one-way bridge (`ui/mathGate.js`) — engine firewall intact (brain imports nothing from Kaplay); correct clears the level once, wrong re-asks penalty-free.
5. Real progression round-trip: correct answers earn XP and level up on the ported v1/v2 curve; XP/level/per-table practice history persist in versioned localStorage and resume on revisit (weak-spot adaptation survives reload); fixed camera-immune HUD + ADHD-safe level-up flash.
6. Polish + ADHD-safety: self-cleaning juice (squash/stretch, dust, coin pop, non-strobing level-clear burst — no timers, no pink), persistent controls hint, readable contrast; comment-stripped `check-safety.sh` audit (no-timer/forgiving) passing; kid-UAT 7/7.

**Stats:**

- ~1,944 LOC across `src/` (excl. vendored Kaplay), HTML, and nginx config — multi-file, no build step
- Requirements: 33/33 v3.0 requirements satisfied (32 verified + kid-UAT)

**Known Deferred Items at Close:** 3 (see STATE.md Deferred Items)

- Phase 08 MOVE-05: throttled/non-60Hz empirical check not run (code verified dt-correct)
- Phase 08 VERIFICATION human_needed: 13/13 must-haves verified; only the MOVE-05 feel-check outstanding
- Phase 07 SETUP-02: live Dokploy deploy not yet confirmed (container curl-proven locally)

**Post-close quick task:** display-only +50% window scale (960×540, crisp pixel upscale) — quick task 260628-c6e.

**Archive:** `.planning/milestones/v3.0-ROADMAP.md`, `.planning/milestones/v3.0-REQUIREMENTS.md`, `.planning/milestones/v3.0-MILESTONE-AUDIT.md`

---

## v2.0 — Dungeon Crawler Phases

**Status:** ✅ SHIPPED 2026-06-22
**Phases:** 2–6 (v1 Phase 1 was v1.0; v2.0 adds 5 dungeon phases)
**Total Plans:** 16 across 6 phases (Phases 1–6)
**Timeline:** 2026-06-20 → 2026-06-22 (3 days)
**Commits:** 73

**Delivered:**
Transformed a flat multiplication quiz into a fully playable dungeon crawler — multiplication is now combat. She fights Goblins, Skeletons, and Dragons through 4 floors using her times tables.

**Key Accomplishments:**

1. Full dungeon FSM (5-state GameFSM: EXPLORE → COMBAT → LOOT → TRANSITION → DEAD) with 9 legal transitions
2. Turn-based combat engine: correct answer attacks, wrong answer takes damage — HP math driven by named CONFIG constants with no magic numbers
3. Screen architecture: 6 data-panel sections, CSS data-screen visibility system, single renderScreen() routing function
4. DungeonRenderer with emoji enemy sprites, CSS-animated HP bars (300ms transition), floating damage numbers (@keyframes floatUp 400ms)
5. Complete floor loop: 4 floors × (entrance + 4 combat rooms + boss), loot system (sword/shield/potion), death/retry with XP preserved, floor-summary screen
6. ADHD safety audit passed 6/6: no timers, no XP loss on death, wrong-answer damage capped, all combat animations ≤500ms (levelUpFlash 800ms noted as tech debt), death screen zero comparison stats
7. Floor-gated question selection (DIFF-01): each floor pulls from its own multiplication table pool; v1 EWMA adaptive weighting applies within the pool (DIFF-02)
8. PersistenceStore v2 migration: auto-migrates v1 `mathlab_save` → `mathlab_save_v2`, v1 key preserved for rollback

**Stats:**

- Single HTML file: 1,976 LOC (JavaScript-heavy, all inline)
- 52 files changed (planning + HTML), 10,009 insertions, 1,531 deletions
- Requirements: 27/27 v2.0 requirements satisfied

**Known Deferred Items at Close:** 2 (see STATE.md Deferred Items)

- Phase 01 UAT: 11 browser test scenarios not run
- Phase 04 VERIFICATION: animation visual confirmation human_needed

**Archive:** `.planning/milestones/v2.0-ROADMAP.md`, `.planning/milestones/v2.0-REQUIREMENTS.md`

---

*v1.0 — MVP Core Loop (Phase 1) shipped 2026-06-20 — see v1.0 archive (if created)*
