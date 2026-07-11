# Math Lab

## What This Is

A real 2D platformer for a 12-year-old girl, played in the browser with the keyboard — run, jump across platforms, reach the goal — where multiplication is the *gate to progress*, modeled on the Mario-style math game she plays at school. The platforming is the intrinsically fun part; math (weighted toward the 6–9 tables) is what stands between her and the next stage. Dark grunge aesthetic, no pink, no timers, no pressure.

> **Direction correction (v3.0):** v1.0–v2.0 built a multiple-choice quiz with a static picture (a dungeon "crawler" that was really scorekeeping with a goblin emoji above the question). That was a misread of the intent. The actual goal — established at v3.0 kickoff — is an *actual game she controls*: a 2D platformer with a moving avatar, real physics, and levels. v3.0 pivots to that. The tuned "math brain" (weighted question selection toward 6–9 tables) is carried forward; the quiz shell is replaced by a game shell.

## Core Value

She opens it because she *wants* to, not because she has to.

## Current State (shipped v5.0 — Nox Run: Real Levels, 2026-07-09)

**Nox Run** (rebranded from Math Lab) is a replayable 2D platformer she controls with the keyboard, served as static files over HTTP. The full loop is live: title screen with a signed-off pixel-wordmark logo and non-strobing reveal → 2×4 level-select grid with locked/unlocked/cleared marks across 8 levels → 8 hand-built, distinctly-themed dark-grunge levels with a gentle platforming + table-difficulty ramp and late-game verticality → forgiving, no-timer, multiple-choice math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) woven throughout, each level carrying a hidden secret-XP alcove → correct answers clear gates and award XP/leveling → per-level completion/unlock, XP/level, and per-table practice history persist in a versioned localStorage save (`noxrun_platformer_v1`) and resume on revisit → the full audio layer (7 CC0 SFX + calm gesture-gated ambient music + persisted M-key mute) plays throughout, ADHD-safe by design. Built on vendored Kaplay with no build step; static files in an nginx container. All 25 v5.0 requirements satisfied.

This milestone: reviewed and auto-fixed the entire v4.1 codebase before doubling content (Phase 22); built a static level validator empirically calibrated against the live engine, proven RED-first (Phase 23); fixed known structural defects and lengthened levels 1–4 by 53–63% (Phase 24); doubled the game to 8 levels with a coherent ramp, verticality, and secret alcoves, plus a scaling select grid, dropping tables 1 and ×10 from the math (Phase 25); rebuilt the visual identity — expanded grunge palette, 8 distinct per-level themes, real CC0 door/enemy sprites, the Nox Run logo, and a full string-sweep rebrand with an intentional save-key reset (Phase 26); added the full audio layer under a genuine 5-round human sound sign-off (Phase 27); and closed the milestone with a consolidated automated gate suite, two new automated proofs (audio-gesture-gate, save-resume-across-reload), and a genuine, non-rubber-stamped human sign-off across all 8 levels (Phase 28).

**Validated this milestone:** structural level integrity (a permanent validator gate), 8 levels of ramped content with a richer grunge visual identity, a full ADHD-safe audio layer, and — per this project's standing "no phase closes on greps/automation alone" rule — every closing claim backed by genuine automated proof or real human sign-off, not assertion.

**What it isn't yet:** live Dokploy URL playthrough confirmation (deferred since v3.0), kid-UAT live sign-off for platforming feel (deferred since v4.0/v4.1), a worlds/level-pack grouping screen, mobile/touch controls (SEED-002), and the "SNES-fidelity" richer sourced-art visual tier the user's ambition is pointing toward (SEED-001, v6.0 candidate). Also carried forward as known, accepted, non-blocking gaps: `secretAlcove` remains outside both the interactive audit's and the static validator's automated coverage by design; some pickups/ledges are unreachable in levels 5–8 and level-07/08's end-climb sections read as near-duplicates; the secret alcove's silent reward reads as low-discoverability; and a "n0x" logo-shortening ask awaits scoping clarification.

## Current Milestone: v6.0 SNES-Fidelity World

**Goal:** Take Nox Run from "tinted minimal art" to a genuinely SNES-fidelity dark world with motion in it, clean up the mechanics that didn't land, and make it playable on mobile — closing the long-deferred live-deploy and kid-UAT loops.

**Target features:**
- **Art overhaul (SEED-001 A):** sourced dark pixel-art biomes (3–4 biomes covering the 8 levels, ansimuz Gothicvania as the scouted anchor), filled terrain with real autotiling, real multi-layer parallax, fully animated player, real art for doors/gates/enemies/math-gate — style-board human sign-off BEFORE any integration; pink spike sprite (backlog 999.2) dies with the old art
- **World motion (SEED-001 B):** patrolling cosmetic enemies, moving platforms (validator learns them), ambient animation — all dt-based, no timers, built on the spike-proven Kaplay idioms (`patrol()`, `stickToPlatform`, chunked tiled fill)
- **Mechanic cleanup:** remove collect-the-answer (backlog 999.1) from all 5 levels it's in and rebalance math pacing; secret alcove gets an on-touch discovery feedback cue plus automated reachability/trigger coverage
- **Level quality pass:** fix unreachable pickups/ledges in levels 5–8, differentiate the level-07/08 end climbs, review all 8 levels against LEVEL-DESIGN.md soft rules — folded into the biome re-dress work
- **"n0x" logo:** new visual treatment (not a text swap), designed as part of the SNES identity, same human sign-off standard as Phase 26's logo
- **Mobile (SEED-002):** touch input layer (virtual movement/jump, tappable answers, touch mute/reset) + responsive canvas scaling — a conscious reversal of the former "Windows laptop only" scope line; keyboard stays primary
- **Closing verification:** live Dokploy URL playthrough confirmation (open since v3.0), kid-UAT live sign-off (open since v4.0), MOVE-05 non-60Hz feel check

**Key context:**
- SEED-001's four decisions locked 2026-07-07 stand: visuals + world motion (no new play mechanics like stomping/power-ups), dark-SNES art direction (Castlevania IV / Demon's Crest register), CC0/CC-BY sourcing, and the pre-work in `.planning/research/v6-scouting/` (ASSET-SCOUTING.md, SPIKE-FINDINGS.md) is consumed as verified fact — not re-researched
- Guardrails unchanged: all gates stay green, kid-validated level geometry re-dressed not rebuilt, no new runtime deps, no Kaplay upgrade, math brain locked, no timers, no pink
- Mechanic decisions (collect removal, alcove cue) land BEFORE the level re-dress so no content gets dressed that's about to change

**Delivered so far:**
- ✓ Validated in Phase 29 — Mechanic cleanup: collect-the-answer removed atomically from all 5 affected levels (code + level data + every defending harness fixture, one commit), math pacing re-verified rhythm-intact with zero XP-path disturbance; secret alcove now gives real on-touch discovery feedback (particle burst + chime + "+5 XP" popup, one-shot per level with anti-farming + anti-loss-on-escape guards) and a positive-only star marker on level-select backed by a save-format version bump — closes the long-open "alcove feels like nothing happened" todo from Phase 25
- ✓ Validated in Phase 30 — Harness extensions: the validator now provably catches an unreachable secret alcove (point-vs-jump-reach, RED-first proven against a fixture, PASS on all 8 real levels) and a mover-dependent path unreachable under a worst-case-extreme rule (RED-first, no real movers exist yet — Phase 36's job); the interactive audit now genuinely detects alcove discovery via entity-destroy/XP-delta (never the always-false challenge-open signal) across all 8 levels — closes the "no automated alcove coverage" todo from Phase 25
- ✓ Validated in Phase 31 — Asset Bake & Style-Board Sign-off: one style-coherent CC0 Gothicvania-anchored collection (4 biomes — swamp/town/cemetery/castle) vendored under `assets/` with per-pack license proofs in `assets/LICENSES/` and credits in `CREDITS.md`; Swamp Hunter player + Hell hound enemy sprites and 4 biome terrain atlases + 12 parallax layers baked; an automated pink-hue scan gate (`check-pink-gate.sh`/`pink_scan.py`), RED-first proven, now guards every future phase, with the two known pink/magenta skies (town, cemetery) retinted; a written anchor/lip convention documented in `docs/LEVEL-DESIGN.md` §9 for downstream integration — genuine 5-round human style-board sign-off found and fixed 2 real floor-alignment bugs before final "Looks good. Approved." (ART-01)
- ✓ Validated in Phase 32 — Terrain & Parallax Rendering: the floating 16px floor strip is gone, replaced by an occupancy-driven autotile cap+chunked-fill renderer (spike-proven `{tiled:true}` recipe, simplified from 8 frames to the real 2-frame biome atlas) with colliders byte-unchanged; all 8 levels now render their locked biome's real multi-layer parallax (levels 1–2 swamp, 3–4 town, 5–6 cemetery, 7–8 castle) in place of the flat triangle silhouettes; a new data-driven assets manifest (`src/assets-manifest.js`, 38 entries) + existence gate (`check-assets-manifest.mjs`) closes the silent-404 class, and the 32 superseded per-level theme-N assets were deleted; `browser-boot.mjs` gained live FPS/object-budget/far-end-render proof across all 8 levels. Code review caught a genuine critical bug in the new far-end check itself (it silently never reached the goal) — chasing the real fix surfaced and fixed a deeper pre-existing pathfinding bug in `scripts/lib/route-planner.mjs` (a spike's own clearance hop could carry the player past a nearby platform's narrow mount-takeoff window), verified live across 3 consecutive full 8-level runs. Level geometry stayed byte-identical throughout (ART-02, ART-03)

## Shipped Milestone: v5.0 Nox Run — Real Levels (2026-07-09)

**Goal:** Take the working game from "functioning" to "next-level experience" — rebrand it as **Nox Run**, double and lengthen the level content with guaranteed-playable structure, enrich the grunge visuals, and add audio.

**Delivered — all target features shipped:**
- ✓ Implementation review + auto-fix: all 24 game entities/surfaces audited, bugs and structural issues fixed autonomously, bigger design changes escalated for approval (Phase 22)
- ✓ Structural validity: known issues fixed (doors over floor holes, unreachable areas), every level validated fully traversable start→goal with all mechanics reachable via a permanent gate (Phases 23-24)
- ✓ More + longer levels: 8 levels total (levels 1-4 lengthened 53-63%, levels 5-8 new), gentle platforming + table difficulty ramp preserved (Phases 24-25)
- ✓ Richer grunge visuals: expanded color palette (19 named roles), 8 distinct per-level themes, still dark/grunge, still no pink (Phase 26)
- ✓ Rebrand: Math Lab → **Nox Run**, with a dark green/black pixel-wordmark logo on the title screen and level-select (Phase 26)
- ✓ Audio / SFX: calm gesture-gated ambient music + 7 sound effects, ADHD-safe mix under genuine human sign-off (AUDIO-01, delivered — Phase 27)
- ✓ Dropped tables 1 & 10 from the practice rotation (Phase 25)
- ✓ Milestone-closing verification: consolidated automated gate suite + genuine human sign-off across all 8 levels (Phase 28)

Both seeds (SEED-001 SNES-fidelity overhaul, SEED-002 mobile touch controls) and all pending open threads were reviewed and absorbed into v6.0 at its 2026-07-09 kickoff — see Current Milestone above.

## Requirements

### Validated

- ✓ Multiplication practice focused on 6–9 tables, mixed with easier ones — v1.0, v2.0
- ✓ Multiple choice answers (4 options) — no typing frustration — v1.0
- ✓ XP and level system that persists between sessions (localStorage) — v1.0, upgraded v2.0
- ✓ Endless play with level-up checkpoints breaking it up — v1.0
- ✓ Dark grunge aesthetic — dark backgrounds, bold fonts, no pink — v1.0
- ✓ No stress-inducing countdown timers — fast feedback, forgiving flow — v1.0, ADHD-safe verified v2.0
- ✓ Runs as a standalone local HTML file on Windows (no server, no install) — v1.0, v2.0
- ✓ Dungeon crawler combat layer: enemies, HP bars, loot, floor progression — v2.0
- ✓ Floor-gated question pools (DIFF-01) + EWMA adaptive weighting in combat (DIFF-02) — v2.0
- ✓ 2D platformer shell (Kaplay): keyboard run/jump, platform collision, goal flag — v3.0
- ✓ One complete, polished dark/grunge level from CC0 assets (licensed) — v3.0
- ✓ In-world, forgiving, no-timer end-of-stage math gate using the ported 6–9-weighted brain — v3.0
- ✓ Served at a web URL via Docker (nginx static) + Dokploy — v3.0 (live deploy confirmation deferred)
- ✓ XP/leveling/practice-history persisted in the browser (localStorage), resumes on revisit — v3.0
- ✓ ADHD-safe juice, discoverable controls, readable contrast (audited + kid-UAT) — v3.0
- ✓ 3–5 hand-built levels + level-select / world-map screen with progression — v4.0
- ✓ Difficulty curve across levels (platforming + table difficulty) — v4.0
- ✓ Mid-game math mechanics: locked doors/keys, collect-the-answer, multiple checkpoint gates, defeat-enemy-with-answer — v4.0
- ✓ Art/presentation pass: animated player, real tileset, background/parallax, title screen — v4.0
- ✓ Per-level completion/unlock state persisted alongside XP/level/practice-history — v4.0
- ✓ Real curated CC0 pixel art (player, tileset, parallax, title/select) replacing v4.0's placeholder art, under mandatory human visual sign-off (ART-05..08, PROC-01/02) — v4.1
- ✓ Interactive verification integrity: door/gates/enemy/mathGate mechanics driven with real movement across all 4 levels, hardened boot gate, corrected milestone-audit sign-off claims (VERIFY-01..04) — v4.1
- ✓ Clean, reviewed base before content doubles: all 24 entities/surfaces reviewed with autonomous in-boundary fixes, batched approve/reject escalation round (none silent), zero regressions proven vs baseline, structural defects inventoried for Phase 23 calibration (FIX-01, FIX-02) — Validated in Phase 22: Implementation Review & Auto-Fix, v5.0
- ✓ Static level validator (`validate-levels.mjs`) checking spawn→goal reachability, gap widths vs an empirically-calibrated jump envelope, door-over-hole placement, and mechanic reachability on every registered level, exiting non-zero on failure; jump envelope measured against the real running engine with a recorded safety margin; proven RED-first against the untouched levels 1–4 by independently catching the known live bugs (VALID-01, VALID-02) — Validated in Phase 23: Level Validation Harness, v5.0
- ✓ All known structural defects in levels 1–4 fixed (3 over-hole gates, 8 unreachable platforms), each level extended 52.9–62.5% past its v4.1 length with checkpoint density scaled to match, zero edits inside kid-validated geometry, structural validator green with zero HARD-FAILs on all 4 (VALID-04, LVL-01) — Validated in Phase 24: Fix & Lengthen Levels 1–4, v5.0
- ✓ Game doubled to 8 levels with a gentle difficulty ramp ([2,3,4,5]→[6,7,8,9] table pools, one mixed-review level), late-game verticality on levels 7–8, a hidden secret-XP alcove on every level (flat +5 XP, silent, no punishment for missing it), a scaling 2×4 level-select grid preserving locked/unlocked/cleared semantics and pre-v5.0 save resume, and tables 1/×10 fully dropped from the math (LVL-02..06, MATH-01, MATH-02) — Validated in Phase 25: Levels 5–8, Difficulty Ramp & Select Grid, v5.0. Human UAT found real, non-blocking content issues (some pickups/ledges unreachable in levels 5-8, level-07/08 end-climb repetition) explicitly accepted as deferred — see pending todos.
- ✓ Nox Run rebrand: `CONFIG.PALETTE` centralized then expanded to 19 named roles (13 base + 8 per-level accent hues, one per level — expanded mid-phase from an initial 3 after the 3-hue scheme produced duplicate-looking themes for 3 level pairs), all WCAG AA-clearing and human-confirmed non-pink; all 8 levels carry distinct baked parallax/ground themes in a calm-green→harsh-rust progression; real CC0 door + 3-variant enemy sprite art replacing the flat-color rect+glyph placeholders open since Phase 18; a baked "NOX RUN" pixel wordmark with a non-strobing reveal on the title screen and a badge on level-select; a full "Math Lab"→"Nox Run" string sweep with a permanent regression gate, save key intentionally renamed (pre-rebrand progress reset, not preserved, per explicit user confirmation) (VIS-01..04, BRAND-01..03) — Validated in Phase 26: Grunge Palette & Nox Run Rebrand, v5.0. Human checkpoints found and fixed 2 real defects (logo reveal/spacing, mid/near parallax-layer tint bug); code review found and fixed a genuine regression (CR-01, stale test fixture) plus 3 warnings. Two pre-existing issues surfaced but explicitly deferred to backlog: the collect-the-answer mechanic (999.1) and a pink hazard sprite (999.2) — neither caused by this phase.
- ✓ Audio layer: 7 CC0 SFX (jump, pickup, correct, soft-neutral wrong, door/gate, level-clear — land SFX deliberately removed at sign-off, it triggered erratically during normal walking and read as stressful) wired at the shared mechanic seams; a calm CC0 ambient music loop ("Flowing Rocks," ~30.8s) that starts only on the title screen's first gesture; an M-key mute toggle (clickable icon added at sign-off) persisted in its own localStorage key, distinct from the progress save; an idempotent music manager proven never to stack/leak across scene transitions (AUD-01..04) — Validated in Phase 27: Audio & ADHD-Safe Sound, v5.0. Human sound sign-off took 5 iterative rounds (land SFX removed, jump SFX re-sourced twice + gain-tuned down twice, ambient music re-sourced for length/repetitiveness, mute icon made clickable) before an explicit "audio approved" — not a rubber stamp.
- ✓ Full v5.0 verification and interactive sign-off: the consolidated 8-command automated gate suite (check-safety/import-safety/gate/progress/audio/rebrand + validate-levels.mjs + browser-boot.mjs) confirmed green in one run, extended with two new proofs — audio genuinely starts only after the first title-screen gesture (AudioContext.state, not the vacuous DOM-audio-element count the original plan spec assumed — Kaplay 3001.0.19 never DOM-attaches audio), and a save under the current key (`noxrun_platformer_v1`) persists and resumes into genuinely reachable gameplay across a real page reload; a genuine, non-rubber-stamped consolidated human sign-off (all 8 levels start→goal, themes/logo/audio together) closed the milestone's one deliberately non-automatable requirement (VALID-03) — Validated in Phase 28: Full Verification & Interactive Sign-off, v5.0. ROADMAP's stale "a pre-rebrand save still resumes" clause (written before Phase 26's intentional save-key rename) was documented as superseded rather than silently dropped or literally attempted. Code review found and fixed 1 blocker (CR-01: isolated save-resume proof context had no error listeners, so a genuine crash there could have silently reported PASS) plus 2 warnings; re-review came back clean of anything above info-level. **v5.0's full requirement set (25/25) is now complete.**

### Active

<!-- v6.0 SNES-Fidelity World — scoped in .planning/REQUIREMENTS.md -->

- [x] SNES-fidelity sourced biome art: cohesive CC0/CC-BY collection (3–4 biomes), style-board human sign-off before integration — Phase 31
- [x] Filled terrain (autotiled ground mass), real multi-layer parallax backgrounds per biome — Phase 32
- [ ] Fully animated player (idle/run/jump/fall/land) and real animated art for mechanic entities
- [ ] Props layer (visual-only, validator-neutral)
- [ ] World motion: patrolling cosmetic enemies, moving platforms (validator-aware), ambient animation
- [ ] Collect-the-answer mechanic removed; math pacing rebalanced in affected levels
- [ ] Secret alcove on-touch discovery feedback cue + automated reachability/trigger coverage; discovered alcoves leave a persistent ambient change and a positive-only secret-found marker on level select
- [ ] Level quality pass: unreachable pickups/ledges fixed, level-07/08 end climbs differentiated, LEVEL-DESIGN.md soft-rules review
- [ ] New "n0x" logo treatment under human sign-off
- [ ] Mobile: touch input layer + responsive canvas scaling (keyboard stays primary); touch layout validated with the kid on a real device
- [ ] Live Dokploy URL playthrough confirmed; kid-UAT live sign-off; MOVE-05 feel check


### Out of Scope

- Backend / server-side logic, accounts, databases, data collection — static hosting only (a container that *serves* files is fine; no app server, nothing leaves her browser)
- Pink or "girly" visual design — explicitly excluded
- Timed pressure mechanics — ADHD context, stress must be avoided
- ~~Mobile-only UI — Windows laptop is the target device~~ — consciously reversed at v6.0 kickoff (2026-07-09): touch controls + responsive canvas are in scope (SEED-002); keyboard/desktop stays primary
- Leaderboards or social comparison — shame spiral risk; solo practice only
- Typed input answers — multiple choice chosen to reduce friction

## Context

- **Target user**: 12-year-old girl, under investigation for ADHD
- **Tone**: Cool, a little edgy, rewarding without being cutesy
- **Input**: Multiple choice (4 options per question) reduces friction when stuck
- **Focus**: 6–9 times tables are the weak spot, but mixing in 1–5 keeps it fun
- **Platform**: Played in any browser by visiting a **web URL**. v3.0 relaxes the single-file rule — multi-file project (HTML + JS modules + vendored Kaplay + assets folder) served as static files from a Docker container (nginx) deployed via Dokploy. Hosting the files over HTTP also sidesteps the `file://` module/asset-loading block — no local server needed for her. A local dev server (`python3 -m http.server`) is used only during development.
- **Reference**: Her school has a Mario-style 2D platformer that gives math questions at the end of each stage. "I want something like this" is the north star — the v1/v2 quiz was a misread of that intent.
- **Current state (v4.1 shipped)**: a real 2D Kaplay platformer, no build step, served over HTTP — title → level-select → four hand-built dark-grunge levels → four forgiving in-world math mechanics → persisted XP/leveling + per-level completion/unlock, now with real curated CC0 art under human sign-off and interactively-audited mechanics (not just code review). Automated browser-boot regression green across all 4 levels; kid-UAT live sign-off for SAFE-05 deferred and tracked. The v1/v2 quiz and v3.0 single-level slice are archived. Next: v5.0 (audio, more worlds, or deployment hardening).
- **Math integration roadmap**: Start with end-of-stage gate (v3.0). Add locked doors/bridges, collect-the-answer, and defeat-the-enemy (reusing v2's 👺💀🐉) as staged additions in later milestones.
- **Art**: Pixel-art sprites from free CC0 packs (Kenney.nl / itch.io), styled to the dark/grunge palette. Pack chosen early in the milestone.
- **User feedback**: Not yet collected post-v2.0 — the platformer is the response to the core feedback that v1/v2 weren't an actual game.

## Constraints

- **Tech stack**: Vanilla JS + Kaplay (one vendored game library). No JS build step, no npm install to run — vendor the library file directly.
- **Deployment**: Static files served from a Docker container (nginx) deployed via Dokploy, reachable at a web URL. This is *packaging + static hosting*, NOT a backend — no database, no accounts, no server-side logic, no data leaves her browser. Docker is not a JS build step.
- **Persistence**: Browser `localStorage` only — XP, level, and practice history live client-side, scoped to the URL's origin (clearing browser data resets it, like her school game).
- **Design**: Grunge/dark aesthetic; explicitly no pink, no bubbly or childish elements. Holds for pixel art too — dark, edgy sprites.
- **No timers / no pressure**: Carries over from v1/v2 — ADHD-safe. Platforming hazards are fine; *countdown* pressure is not.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multiple choice over typed input | Reduces frustration for ADHD profile; faster flow | ✓ Good — retained v2.0 |
| localStorage for persistence | No backend; works offline; simple and reliable | ✓ Good — v2 migrated cleanly |
| Single HTML file | Portable, runs on Windows without setup | ✓ Good — retained through dungeon layer |
| No countdown timer | Pressure is the enemy; fast feedback without stress | ✓ Good — ADHD audit passed |
| Wrap v1 engine, don't replace | CombatEngine/GameFSM wrap QuestionSelector/PlayerState | ✓ Good — zero v1 regressions |
| Session-scoped DungeonState | HP/room/loot not persisted; run resets on tab close | ✓ Good — clean retry semantics |
| Floor-gated table pools | Each floor limits to its multiplication tier | ✓ Good — meaningful difficulty progression |
| Death = restart floor, XP intact | ADHD-safe; no punishment loop | ✓ Good — ADHD-02 passes |
| Loot auto-applies on pickup | No inventory choice = less cognitive load | ✓ Good — LOOT-02 passes |
| 4 floors (3 + boss) | Extended run without permadeath complexity | — Superseded by v3.0 pivot |
| **v3.0: Pivot to real 2D platformer** | v1/v2 quiz misread the intent; she wants a Mario-style game she controls | ✓ Good — kid-validated "all good" |
| **v3.0: Kaplay over vanilla canvas** | Real physics/collision/sprites without hand-writing the bug-prone parts; effort goes to her game, not collision math | ✓ Good — vendored, no-build, shipped |
| **v3.0: Relax single-file rule** | Platformer + assets + vendored library don't fit one file cleanly; multi-file still opens in browser | ✓ Good — clean src/lib/assets layout |
| **v3.0: Port math brain, rebuild shell** | Keep tuned 6–9 weighted selection; replace quiz UI with game | ✓ Good — firewall intact, reused verbatim |
| **v3.0: Math = end-of-stage gate first** | Matches her school game; most reliable to make *feel* good before richer mechanics | ✓ Good — but only one gate = thin content (→ v4.0) |
| **v3.0: Free CC0 pixel-art packs** | Real game look with zero cost/licensing risk; ships immediately | ⚠️ Revisit — reads as early-MVP art; needs an art pass |
| **v3.0: Host via Docker + Dokploy at a URL** | Simplest for her — just visit a URL; also sidesteps the `file://` asset-loading block entirely | — Pending — container curl-proven; live deploy not yet confirmed |
| **v3.0: Static hosting, not a backend** | nginx serves files; no DB/accounts/server logic — privacy intact, complexity low | ✓ Good |
| **v3.0: Persist XP/level/practice in localStorage** | Matches her school game ("stores progress in browser cache"); client-side, no backend | ✓ Good — round-trip + weak-spot resume verified |
| **v3.0: Display-only +50% window scale (post-close)** | Native 640×360 canvas looked tiny on a real monitor; scale display, keep internal res | ✓ Good — zero gameplay change (quick task 260628-c6e) |
| **v4.1: Redo art with real CC0 packs + mandatory human sign-off** | v4.0's Phase 18 art was procedurally-generated placeholder noise, auto-approved without a real human sign-off checkpoint | ✓ Good — real curated art shipped, sign-off actually happened this time |
| **v4.1: Independent interactive audit before trusting "passed"** | v4.0's later phases (15–18) had "human sign-off recorded" claims with no real session evidence, which let a total soft-lock and 5 other real bugs ship in collect.js undetected until a from-scratch playtest | ✓ Good — door/gates/enemy/mathGate now interactively audited, found + fixed 4 more real bugs, hardened the automated gate, corrected the audit record |
| **v5.0 Phase 25: Never let `workflow.auto_advance` silently rubber-stamp a `checkpoint:human-verify` gate** | Project config has auto-mode on, which by default auto-approves human-verify checkpoints; this plan's own threat model explicitly said "never a rubber-stamp" for the secret-alcove/select-grid sign-off, matching the project's standing "no phase closes on greps/automation alone" rule | ✓ Good — user was asked and chose to do the walkthrough themselves; found this policy worth preserving for future autonomous runs |
| **v5.0 Phase 25: Record partial/reduced-scope human sign-offs honestly rather than upgrading them to a full pass** | Human explicitly limited verification scope more than once (level-01-only alcove check, then a full playthrough that wasn't itemized against the 2 specific UAT asks) — the temptation is to round up to "verified"; FINDINGS.md/UAT.md/VERIFICATION.md all record exactly what was and wasn't checked | ✓ Good — real issues surfaced anyway (unreachable pickups/ledges, level-07/08 repetition) and were captured as todos instead of lost |
| **v5.0 Phase 26: Expand accent palette from 3 to 8 mid-execution rather than hold to the original plan** | Wave 3's bake exposed that 3 shared accent hues produced pixel-identical themes for 3 level pairs; user asked for "more life" but explicitly capped ambition at "one distinct accent per level" (8) over an arbitrary round number (10) — cheap, load-bearing correction caught 2 waves in, not after the whole phase shipped | ✓ Good — fixed the actual distinctness gap; kept the 3 already-approved hues to minimize re-review |
| **v5.0: Defer further palette/theme richness to a new v6.0 milestone (SEED-001) rather than keep expanding Phase 26** | Mid-phase the user clarified their real ambition was closer to "a 256-color SNES-style game," which is a full art-asset-sourcing effort, not a tint-palette tweak — codebase scan confirmed the ceiling is source-art fidelity, not engine capability | Seed planted 2026-07-07 (`.planning/seeds/SEED-001-...md`); v5.0 wraps lean on visuals, v6.0 will replace tint-based theming with real sourced biome art |
| **v5.0 Phase 27: Replace the plan's literal `document.querySelectorAll('audio').length` gesture-gate check with `audioCtx.state`** | Live probe + vendored engine source read proved Kaplay 3001.0.19 never DOM-attaches `<audio>` elements for music or SFX — the originally-specified metric was structurally incapable of ever detecting a real regression, gesture or not | ✓ Good — same claim proven via the actual autoplay-gate mechanism instead; caught before landing, not after |
| **v5.0 Phase 28: Do not re-run the full 8-level interactive mechanic audit from scratch; cite Phase 25/27's existing 36/36-triggered evidence instead** | The audit harness already proved zero blind spots across all 8 levels in prior phases; re-deriving identical evidence would be pure cost with no new signal — Phase 28's job is the milestone's *formal, human-signed-off* closure of VALID-03, not rebuilding already-proven coverage | ✓ Good — kept the closing phase scoped to what was actually still open (the gate-suite consolidation, the two new automated proofs, and the human sign-off) |
| **v5.0 Phase 28: Treat ROADMAP's "a pre-rebrand save still resumes" criterion as superseded, not literal** | Phase 26 intentionally renamed the save key with explicit user sign-off that no migration/resume was required — the ROADMAP text predates that later decision; documenting the supersession (not silently dropping or literally attempting an impossible check) matches this project's standing honesty pattern | ✓ Good — verified instead that a *fresh* save under the current key resumes correctly, which is the claim that actually matters now |
| **v5.0 Phase 28: Did not accept a bare "Approved" as sufficient to close the milestone's final human-verify checkpoint** | This plan's own resume-signal spec and the project's `never-rubber-stamp-checkpoints` precedent (Phase 25, reconfirmed Phase 27) both require more than a vague acknowledgment for a `checkpoint:human-verify` gate — a one-word "Approved" alone was indistinguishable from a rubber stamp | ✓ Good — one follow-up question confirmed a genuine, fresh, just-completed 8-level playthrough before the sign-off was recorded as closing |
| **v6.0: Keep math-gate/enemy/door density at one of each per level** | User's explicit live direction during Phase 33 planning (2026-07-11): don't add too many math gates/monsters/doors per level. Matches the status quo already — every one of the 8 levels currently has exactly 1 door + 1 math-gate + 1 enemy blocker. Binding for all remaining v6.0 phases (34 quality pass, 35 re-dress, 36 world motion) — none should raise that count | Locked 2026-07-11 — applies going forward, not just Phase 33 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-11 — Phase 32 (Terrain & Parallax Rendering) complete: ART-02, ART-03 satisfied*
