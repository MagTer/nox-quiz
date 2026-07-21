# Milestones: Math Lab

## v6.0 SNES-Fidelity World (Shipped: 2026-07-21)

**Phases completed:** 14 phases, 80 plans, 113 tasks

**Key accomplishments:**

- Atomically deleted the collect-the-answer math mechanic (code, config, level data, and 6 harness fixtures) across a single commit, confirming the 5 affected levels keep their full door/checkpoint-gate/enemy math rhythm with zero XP-economy impact.
- Secret alcove touch now fires a particle burst + audible chime + rising "+5 XP" popup exactly once, and level-select shows a positive-only star marker that survives reload — both threaded through a version-3, no-migration save-format bump, with genuine human sign-off received in a real browser.
- `scripts/lib/reachability.mjs` gains a shared `bestMarginToPoint` helper powering two new RED-first-proven checks — secret-alcove-reachability and mover-reachability (worst-case-extreme) — both clean across all 8 shipped levels.
- The interactive mechanic audit now genuinely drives to and detects every level's secret alcove via entity-destroy/XP-delta (never challenge-open), closing the automated blind spot since Phase 25 — proven on all 8 levels in two consecutive real headless-browser runs, not just level-01's minimum bar.
- Fixed two stale passages in `docs/LEVEL-DESIGN.md` (dead `collectZone` references, false "alcoves are unchecked" claim), found and fixed a real regression in `browser-boot.mjs` that Plan 30-02's new alcove-encounter emission exposed, then ran the full existing 7-command gate suite live — genuinely green, zero false HARD-FAILs, closing Phase 30.
- Re-fetched and integrity-verified all 5 Gothicvania (ansimuz) CC0 OGA packs into a gitignored scratch dir, live-reconfirming public-domain status and the 3-pack CC-BY-music carve-out, unblocking Plan 31-02's style-board regeneration.
- Regenerated the 4-biome style board with the Swamp Hunter (all biomes) + Hell hound (castle) swaps, then carried it through 5 real human-review rounds — 3 of them surfacing genuine floor-alignment bugs that were fixed before the board was finally approved — closing the hard gate that Plans 31-04/31-05's asset baking waits on.
- New `scripts/lib/pink_scan.py` (HSV dominant-opaque-pixel scan, Pillow-only) + `scripts/check-pink-gate.sh` gate-family wrapper, proven RED-first at ~64%/~79% against the two known pre-retint pink Gothicvania source crops, and green (zero false positives) against all 47 currently-shipped `assets/` PNGs.
- Extended `scripts/build-art-assets.py` with 4 biome terrain atlases + 12 parallax layers baked from the re-fetched Gothicvania packs, with Town's roof/sky and Cemetery's horizon-glow retinted via `hue_shift_band()` and numerically proven pink-gate clean (0.0000 post-bake, vs. 33%/64%/79% pre-retint on the raw source).
- Baked the signed-off Swamp Hunter player (192x32, 12-frame idle/run/jump/fall) and Hell hound static enemy (384x32, 6 idle frames) at native Gothicvania color, then documented the REAL pixel-measured cap-tile lip-offset convention per biome (finding two irregular cases — Cemetery's floating-mound crop and Castle's inverted bottom-anchored gold trim — rather than forcing a false uniform number).
- Created `src/assets-manifest.js` (38-entry `{key, path, kind}` array) and `scripts/check-assets-manifest.mjs`, a Node gate that proves every asset path resolves on disk — closing the silent-404 class across the full asset surface `main.js` loads.
- Added the CONFIG.TERRAIN tunables block (6 keys) and replaced the theme field with a locked biome field (swamp/town/cemetery/castle) on all 8 level descriptors — pure config/data foundation with zero engine-facing behavior change.
- Replaced `src/levels/build.js`'s single visual-only top-row floor strip (`pickTopFrame()`) with an occupancy-driven `emitTerrainRun()` cap+chunked-fill renderer against the real 2-frame biome atlas, colliders untouched.
- Threaded `level.biome` through `parallax.js`'s existing layer-naming logic (near-zero structural change), switched `main.js`'s asset loading to a manifest-driven loop for biome-atlas/biome-bg assets, and deleted the 32 now-superseded theme-N asset files.
- Extended `scripts/browser-boot.mjs` with three CONFIG.TERRAIN-driven assertion helpers (screenshot non-blank, FPS floor, object-count budget) plus a per-level far-end (goal) render check — turning Phase 32's silent-blank-fill and perf-cliff pitfalls into real, hard-failing automated gates; ran clean (exit 0) across all 8 levels.
- Baked new native-Gothicvania-color sprite art for the door (rebaked from the castle interior tileset) and math-gate (new, from the church environment tileset) mechanic panels, and retired the fully-superseded enemy-1/2/3 placeholder sprites.
- 1. Cross-plan gap: `CONFIG.ENEMY.SPRITES` / `src/levels/build.js` variant indexing
- Swapped the math-gate's flat-color placeholder panel for `sprite("math-gate")` and wired the enemy panel to `panel.play("idle")` on the Hell hound sprite with a modulo-safe variant index and FRAME_W-centering offset — proven collision-neutral by a full re-run of the 8-level interactive mechanic audit (all encounters `triggered: true`, `resolved: true`) and browser-boot (all levels non-blank, in-budget).
- This checkpoint was NOT rubber-stamped.
- The model must only ever UNDER-credit. If a coin is doubtful, it is unreachable.
- Run 1 (against Plan 34-01's model): RED — exit 1, 9 offenders.
- None.
- `browser-boot.mjs` fails on level-08
- A route is now an ordered chain of LEGS, each carrying its own direction.
- A sound, RED-first-proven static reachability check (`checkKeyLockReachability`) that HARD-proves every key/lock pair's key is reachable from spawn before its lock, via a per-lock lock-cut BFS graph that clips every node at the lock's x-band and drops cross-band edges — built and composed into `validate-levels.mjs` before any mechanic code or level content exists.
- The key/lock mechanic exists as CODE (KEY-01): a new `src/mechanics/key.js` `wireKey()` seam wires both halves — a secretAlcove-style walk-through key pickup and a door.js-style apex-height solid lock that opens on a key-held collide (destroying collider + panel before the next frame) or shows a self-cleaning non-blocking hint otherwise — with `build.js` emitting the entities from `geometry.keys`/`geometry.locks`, `game.js` threading closure-local `keyHeld` run-state, and the HUD showing a persistent key-held indicator. All a727c13-clean, no timers, no punishment, no new assets. The mechanic is inert until a descriptor uses it (Plan 03).
- One throwaway key-lock pair placed on level-02 (key x:900, lock x:3960) proven softlock-free by the static validator AND proven collectible/openable by a real driven player via a new `scripts/audit-key-lock.mjs` — closing KEY-01/KEY-02 with the SC3 in-engine proof this milestone's own history (sawtooth floor, grey ground, ceiling-bonk coins) says a green static model alone cannot provide.
- Extracted a shared `clearLevel()` closure in `src/scenes/game.js` and made `onReachGoal()` branch on `heldKeyIds` — a held math-skip key now clears the level with full XP (`CONFIG.PROGRESS.XP_KEY_SKIP`) instead of opening the end math challenge, while keyless levels are byte-behaviourally unchanged.
- Rebuilt `src/levels/level-01.js` from scratch as a ~2x-length, ceiling-free calm swamp intro (goal.x 3560 -> 7100) with a deliberate ascent/descent hump and an optional visible high route, catching and fixing two real driven-player-only defects (a ceiling-bonked spike-hop and several spike-before-gap-takeoff conflicts) that the static validator could not see.
- Rebuilt `src/levels/level-02.js` from scratch as a ~2x-length, open-air intense/vertical swamp (goal.x 4200 -> 8180) with three ascent/descent humps — the third carrying an optional math-skip KEY (no physical lock) on its peak — and added `scripts/audit-endgate-key.mjs`, a dynamically-level-discovering in-engine audit that proves the key-conditional end gate holds both ways: key collected clears the level free, key skipped requires the end math as normal.
- Rebuilt `src/levels/level-03.js` from scratch as a ~2x-length calm TOWN intro (goal.x 5120 -> 10280) with its own townscape signature — a mandatory 200px rooftop climb over a plaza pit, a visible low/high fork, a covered arcade awning, an optional 222px belltower (the game's first overlapping-tier ceilings, on optional routes only), and townsquare stepping stones — proven in-engine (zero HARD-FAIL, all 40 coins collected, door+enemy+alcove triggered, completes spawn->goal).
- Rebuilt `src/levels/level-05.js` from scratch as a ~2x-length calm CEMETERY intro (goal.x 3340 -> 6930) with its own graveyard signature — a mandatory 260px MAUSOLEUM climb over a 700px sunken crypt pit, a visible grave-mound low/high fork, an optional 222px overlapping-tier CRYPT VAULT, and a row of tombstone stepping stones — proven in-engine (zero HARD-FAIL, all 35 coins collected, door+enemy+alcove triggered, completes spawn->goal across two runs).
- Rebuilt `src/levels/level-06.js` from scratch as "The Necropolis" — a ~2.2x-length intense/vertical CEMETERY (goal.x 3300 -> 7200) whose main goal route crests a 666px double-switchback cathedral spire (TALLER than the approved even prototype level-02's 518px), with a diamond fork (two visible routes), a second crypt-tower switchback, two interleaved catacomb descents, and an OPTIONAL math-skip KEY on a 740px above-summit apex (geometry.keys, NO locks) — proven both ways in the real engine.
- Rebuilt `src/levels/level-07.js` from scratch as a ~2x-length CASTLE intro (goal.x 3700 -> 7560) — the calmer/readable half of the castle pair — with a mandatory 200px iron-GATEHOUSE climb+DESCENT over a 720px moat, a visible BATTLEMENT low/high fork, a BROKEN-DRAWBRIDGE chasm crossing, and a 420px MONOTONIC GRAND STAIRCASE (the tallest odd climb, mechanically distinct from level-08's switchback). The rebuild DELETES the 5 deferred Phase-34 headroom HARD-FAILs (project total 5 -> 0) by authoring every overlapping tier h:16 at rise 73 -> 25px headroom. Proven in-engine (zero HARD-FAIL, all 31 coins collected, door+enemy+alcove triggered, completes spawn->goal).
- Rebuilt `src/levels/level-08.js` from scratch as "The Throne Keep" — the game's TALLEST + most intense level and the CLIMAX of the 02→04→06→08 even-ladder (goal.x 3460 → 7620, ~2.2x). A varied castle gauntlet (portcullis door + a mandatory BARBICAN outwork climb+DESCENT over a 640px moat + a BROKEN-DRAWBRIDGE chasm crossing + 5 spikes + a castle wraith) culminates in a colossal 740px SWITCHBACK spire — two up-LEFT reversals + a diamond fork — crowned by a broad wide-right throne balcony where the GOAL sits, with the math-skip KEY on the 814px apex one tier ABOVE the throne (geometry.keys, NO locks). Mechanically distinct from level-07's monotonic staircase, and proven both ways in the real engine.
- Rebuilt `src/levels/level-04.js` from scratch as "The Clocktower" — the intense TOWN even level and the SECOND rung of the 02→04→06→08 even-ladder (goal.x 6120 → 9460). A mandatory 592px switchback clocktower spire (a visible diamond fork of tenement routes + an up-left reversal + a wide-right summit) bridges a 1720px market pit, with the math-skip KEY on the 666px apex one tier ABOVE the summit (geometry.keys, NO locks); a gantry-stair descent, an optional tenement-stacks climb+drop, market stalls, and a run past the town watchman fill out the length. Distinct from level-03's calm rooftops/arcade/belltower, and proven both ways in the real engine. The literal ~2x/12000 length is capped by the HARD perf-objects budget — level-04 is the LONGEST even level at the budget ceiling.
- The whole rebuilt 8-level world passes the full consolidated gate suite in one pass, zero HARD-FAIL — the 13 deferred Phase-34 fails deleted — documented per-level against the full LEVEL-DESIGN rule set incl. §8.5, with a real monotonic difficulty ramp (even 592<666<740<814px).
- Amplified wrong-answer feedback (stronger shake + full-panel red pulse) plus a closure-local, tween-gated `settling` flag in the shared challenge overlay that makes both mouse and 1-4-key input inert for ~250ms after a wrong pick — defeating input-mashing without any punishment (SAFE-01).
- Wired the vendored coin/goal/key sprites into build.js with footprint-pinned colliders (goal 16px, key 20px via `sprite({width,height})` + bare `area()`, never `scale()`), and reworded the key pickup popup + HUD indicator to plain-ASCII "SKIP KEY" framing sourced from config.
- 1. [Rule 3 - Blocking] Re-fetched the absent source packs
- `checkpoint:human-verify` — the load-bearing trial sign-off before the remaining-6 rollout (this is the gate that historically caught the Phase 32/33 "black mess" parallax regressions).
- 1. [Clarification] level-05 got a spawn shot only (not spawn + climb)
- 1. [Rule 3 - Blocking] Re-fetched the absent town/church/patreon source packs
- Task 1 (commit `14a4881`)
- 1. [Rule 1 - Correctness] Tightened the mover collider to the visible ledge
- 2/2 complete. (Executor hit a session limit after writing the final MECH-05 wiring; the
- 1. [Rule 1 — no-softlock correctness] Patrollers authored as HOVERING wraiths, not grounded floor-walkers.
- `checkpoint:human-verify` (SC5 hazard-placement sign-off) — the gate before the remaining-6 motion rollout.
- No code authored or edited.
- 1. [Rule 3 - Blocking] Optional-chained CONFIG.PATROLLER in main.js
- src/input.js OR-seam merges keyboard + virtual-button input into one interface player.js consumes, so the LOCKED coyote/buffer/variable-height jump is reused verbatim by both keyboard and (future) touch; CONFIG.TOUCH lands the >=64px thumb-button tunables — desktop feel byte-identical (browser-boot green across all 8 levels).
- Portrait 'rotate your device' overlay (#rotate) swapped in by a pure-CSS coarse+portrait media query, plus touch-action:none + a scale-pinned viewport meta for gesture suppression — no screen-orientation lock API, desktop byte-unchanged, proven by a getComputedStyle Playwright probe.
- Reset became tappable on touch (arm + Yes/No confirm via coarse-gated area()+onClick), audio unlock is wired to a real activation gesture (never touchstart), and a Playwright touch probe proves tap-to-resolve-answer + tap-to-mute + tap-to-arm/cancel/confirm-reset headlessly — desktop stays byte-identical.
- On-screen left/right/jump virtual buttons (src/ui/touchControls.js) render only on coarse-pointer devices and feed the src/input.js seam, so a phone player runs and jumps through player.js's LOCKED coyote/buffer/variable-height physics — never a parallel jump path; per-identifier multi-touch lets left+jump work at once, and a Playwright CDP touch-drive harness proves tap-jump/held-jump-higher/move/multi-touch headlessly while desktop mounts zero buttons (browser-boot byte-identical).
- Ran the entire gate suite — every existing CLAUDE.md gate plus the four NEW permanent touch gates — green in one consolidated pass, proving the mobile layer landed without regressing the kid-validated desktop build, and wrote 37-VERIFICATION.md documenting MOB-01..MOB-05 delivered with per-requirement gate evidence + the explicit list of on-device gates deferred to Phase 38. No source changes.
- Two net-new builder capabilities — a dt-driven horizontally-sliding spike (geometry.slidingSpikes, shared 'spike' respawn seam) and an opt-in solid prop (pr.solid static collider at play depth) — plus the freeze-gate exemption, reachability model, validator plumbing, and walk-only driver stall-recovery that make both safe to author.
- Re-baked `prop-swamp-lantern` from the town street-lamp's single amber-glass lantern head — the L1/L2 secret-alcove light is now a dark-grunge hanging lantern instead of a fire-skull, at the stable key/path so the MECH-05 flicker + alcove-light link survive untouched.
- Grounded, wide-sweeping, coin-clear skeleton patrollers on Levels 1 & 2, plus a shared walk-driver patroller-hop that keeps browser-boot spawn->goal clearable past a now-blocking grounded skeleton; L1/L2 lantern alcove link confirmed intact.
- Turned the town-biome pair (Levels 3 & 4) into real platforming: grounded, wide-sweeping skeleton patrollers (POL-01); 5 of 6 town barrels/crates made solid jump-over obstacles (POL-04, with the L3 F2 crate flagged non-solid as the sanctioned route-breaks exception); the L3 well moved off the F5 spike (POL-05); and L4's near-zero mover sweep doubled (POL-03) — all freeze-EXEMPT, plus a hardened walk-driver prop-hop that clears a solid prop before a distant platform mount without regressing prop-free climb levels.
- Grounded the cemetery/castle-approach skeletons on Levels 5, 6 & 7 and — in the process — found and fixed the reason NO patroller has ever moved (a Kaplay 3001.0.19 patrol() born-finished bug that froze every skeleton since Phase 36); placed the first two real sliding-spike hazards (L5 & L7, each ground-sliding in the shadow of a static spike so the pair clears as one timed cluster); and doubled L7's near-zero mover sweep — all freeze-EXEMPT, browser-boot green across all 8 levels with zero driver diagnostics.
- Relocated Level 8's two moving platforms into floor-level ferries spanning the real moat and drawbridge chasm, removed the static stepping-stones, grounded the skeletons and repositioned the face-columns — and taught both the validate-levels reachability graph and the walk-only browser-boot driver to ride a ferry-only pit end-to-end.

**Closeout:** override closeout (user chose "fast override-close" 2026-07-21). No v6.0 milestone audit was run; Phases 38 & 39 closed without formal per-phase SUMMARY/VERIFICATION bookkeeping. The game is shipped, deployed (nox.falle.se), and kid-approved (VER-02 ✓).

**Known Deferred Items at Close:** 7 (see STATE.md Deferred Items) — 4 open human/device verification gates (VER-01 live-URL playthrough, VER-03/MOVE-05 non-60Hz feel, MOB-05 real-device audio, MOB-06 kid touch-layout tuning), 2 bookkeeping gaps (Phase 38 & Phase 39 lack formal SUMMARYs), and 1 design gate (check-level-distinctness RED for level-02≈level-08 → tracked as SEED-003 for v7). SEED-001 (SNES overhaul) and SEED-002 (mobile) were HARVESTED by this milestone; the 4 prior pending todos were filed complete.

**Archive:** `.planning/milestones/v6.0-ROADMAP.md`, `.planning/milestones/v6.0-REQUIREMENTS.md`, `.planning/milestones/v6.0-phases/` (no MILESTONE-AUDIT — override close)

---

## v5.0 Nox Run — Real Levels (Shipped: 2026-07-09)

**Phases completed:** 7 phases (22-28), 45 plans, 98 tasks

**Delivered:**
Rebranded Math Lab → Nox Run, doubled the game to 8 levels with guaranteed-playable structure, added a rich per-level grunge visual identity, and shipped a full ADHD-safe audio layer — closing with a genuinely-proven, non-rubber-stamped verification pass.

**Key Accomplishments:**

1. Clean, reviewed base before content doubled: all 24 game entities/surfaces audited with autonomous in-boundary fixes, zero regressions vs baseline, structural defects inventoried for validator calibration (Phase 22)
2. Level validation harness built and proven RED-first against real known bugs; jump envelope empirically calibrated against the live engine (not closed-form theory); interactive audit blind spot closed from 6/16 to 16/16 (Phase 23)
3. Levels 1-4 structurally fixed and lengthened 52.9-63%; game doubled to 8 levels total with a gentle difficulty ramp, late-game verticality, secret XP alcoves, and a scaling 2×4 select grid; tables 1 and ×10 dropped from the math (Phases 24-25)
4. Rich Nox Run visual identity: centralized/expanded grunge palette (19 named roles, WCAG AA-proven, no pink), 8 distinct per-level baked themes, real CC0 door/3-variant-enemy sprite art, a signed-off pixel-wordmark logo with non-strobing reveal, full Math Lab → Nox Run rebrand sweep with an intentional save-key reset (Phase 26)
5. Full audio layer: 7 CC0 SFX + calm gesture-gated ambient music + persisted M-key mute, ADHD-safe mix closed via a genuine 5-round iterative human sound sign-off (Phase 27)
6. Milestone-closing verification: consolidated 8-gate automated suite green in one run, two new automated proofs (audio-gesture-gate via `AudioContext.state`, save-resume-across-reload), and a genuine (non-rubber-stamped) human sign-off across all 8 levels closing VALID-03 — the milestone's requirement set (25/25) fully complete (Phase 28)

**Stats:**

- 563 files changed, +32,195/-746 lines (git range 18a1615..HEAD)
- ~10,268 LOC across `src/`, `scripts/`, `docker/`
- Timeline: 5 days (2026-07-05 → 2026-07-09)
- Requirements: 25/25 v5.0 requirements satisfied

**Milestone Audit:** tech_debt status (25/25 requirements, 7/7 phases, 0 integration breaks; 10 tracked non-blocking deferred items, all already human-accepted or existing tracking notes) — accepted by user 2026-07-09.

**Known Deferred Items at Close:** 7 (see STATE.md Deferred Items) — 5 pending todos (secretAlcove automated coverage + discoverability redesign, levels 5-8 pickup/ledge reachability + level-07/08 repetition, LEVEL-DESIGN.md soft-rules review, "n0x" logo shortening) and 2 dormant seeds (SEED-001 v6.0 SNES-fidelity visual overhaul, SEED-002 mobile touch controls).

**Archive:** `.planning/milestones/v5.0-ROADMAP.md`, `.planning/milestones/v5.0-REQUIREMENTS.md`, `.planning/milestones/v5.0-MILESTONE-AUDIT.md`

---

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
