# Math Lab

## What This Is

A real 2D platformer for a 12-year-old girl, played in the browser with the keyboard — run, jump across platforms, reach the goal — where multiplication is the *gate to progress*, modeled on the Mario-style math game she plays at school. The platforming is the intrinsically fun part; math (weighted toward the 6–9 tables) is what stands between her and the next stage. Dark grunge aesthetic, no pink, no timers, no pressure.

> **Direction correction (v3.0):** v1.0–v2.0 built a multiple-choice quiz with a static picture (a dungeon "crawler" that was really scorekeeping with a goblin emoji above the question). That was a misread of the intent. The actual goal — established at v3.0 kickoff — is an *actual game she controls*: a 2D platformer with a moving avatar, real physics, and levels. v3.0 pivots to that. The tuned "math brain" (weighted question selection toward 6–9 tables) is carried forward; the quiz shell is replaced by a game shell.

## Core Value

She opens it because she *wants* to, not because she has to.

## Current State (shipped v4.1 — Art Rework, 2026-07-04)

Math Lab is a replayable 2D platformer she controls with the keyboard, served as static files over HTTP. The full loop is live: title screen → level-select with locked / unlocked / cleared marks → four hand-built dark-grunge levels → four forgiving, no-timer, multiple-choice math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) woven throughout the levels → correct answers clear gates and award XP/leveling on the v1/v2 curve → per-level completion/unlock, XP/level, and per-table practice history persist in a fresh versioned localStorage save and resume on revisit. Table difficulty ramps from easier pools to the 6–9 weak spots; platforming difficulty ramps gently across levels. This milestone replaced Phase 18's procedurally-generated placeholder art with real curated CC0 pixel art (animated player, tileset, parallax, title/select screens), all under genuine human visual sign-off — and separately closed a verification-integrity gap: `door.js`, `gates.js`, `enemy.js`, and `mathGate.js` now each have real interactive audit coverage (not just code review), the automated boot gate genuinely exercises movement + mechanic resolution on all 4 levels, and several real bugs were found and fixed along the way (an enemy-challenge display bug, a simultaneous-challenge UI/state-corruption bug, a jump-over exploit on math-gates/enemies, and a path-traversal/bind-all-interfaces issue in the local test scripts). Built on vendored Kaplay with no build step; static files in an nginx container. All 10 v4.1 requirements satisfied.

**Validated this milestone:** the game's art now matches the intended dark-grunge aesthetic under real human sign-off, and this project's own verification claims are now held to the same interactive-proof standard the process gap had let slip. **What it isn't yet:** audio/SFX + music, more worlds/level packs, and live deployment confirmation remain for future milestones. Also carried forward as known, intentionally-scoped gaps: New Finding 4's visual-overlap half is fixed but 6/16 mechanic encounters across the 4 levels remain out of the audit script's reach (documented technical reason: spike-hazard timing resonance in the traversal model) — not a game bug, a test-tooling limitation.

**v5.0 progress:** Phase 22 (Implementation Review & Auto-Fix) complete 2026-07-05 — all 24 entities/surfaces carry final review verdicts (17 clean, 6 fixed, 4 structural-deferred), one approved escalation implemented after its recorded decision, full suite green with zero regressions vs the pre-fix baseline; LOCKED surfaces (math brain, vendored Kaplay, level descriptors) diff-proven untouched. Phase 23 (Level Validation Harness) complete 2026-07-06 — `scripts/validate-levels.mjs` built and proven RED-first against the untouched levels 1–4 (9 genuine hard-failures, correctly naming all 3 known over-hole defects), its jump envelope empirically calibrated against the real engine (not closed-form theory), and the interactive audit's 6/16 mechanic-encounter blind spot fully closed to 16/16 on levels 1–4. Zero level-descriptor edits landed (fixes are Phase 24's job). A code review independently caught and fixed 3 additional false-negative bugs in the validator's own detection logic before it was trusted as a gate. Phase 24 (Fix & Lengthen Levels 1–4) complete 2026-07-06 — all 4 levels' known structural defects (3 over-hole gates, 8 unreachable platforms) fixed, each extended 52.9–62.5% past its v4.1 length with checkpoint density scaled and zero edits inside the kid-validated geometry, `validate-levels.mjs` green with zero HARD-FAILs on all 4. The interactive audit initially could not complete at all against the lengthened levels — root-caused (not a hardware/browser issue) to the audit driver's own blind "jump whenever grounded" model, which skipped ground-level checkpoints and failed marginal jumps deterministically; rebuilt as a geometry-informed driver (`scripts/lib/route-planner.mjs`) that plans jump takeoffs from the same feasibility graph the structural validator uses. Final result: 22/22 mechanic encounters `triggered:true` across all 4 levels, 20/22 fully resolved; 2 rows (`enemy@2400` on level-03 and level-04) remain resolved:false, documented as a narrower follow-up.

## Current Milestone: v5.0 Nox Run — Real Levels

**Goal:** Take the working game from "functioning" to "next-level experience" — rebrand it as **Nox Run**, double and lengthen the level content with guaranteed-playable structure, enrich the grunge visuals, and add audio.

**Target features:**
- Implementation review + auto-fix: audit the codebase and every game entity (monsters, doors, gates, collect zones, math gate); fix bugs, structural issues, and obvious UX wins autonomously, surfacing only bigger design changes for approval
- Structural validity: fix known issues (doors placed over floor holes, unreachable areas) and validate every level is fully traversable start→goal with all mechanics reachable
- More + longer levels: 8 levels total (lengthen the existing 4, add 4 new), keeping the gentle platforming + table difficulty ramp
- Richer grunge visuals: expanded color palette — more colors, still dark/grunge, still no pink
- Rebrand: Math Lab → **Nox Run**, with a fancy dark green/black themed logo on the title screen and throughout the UI
- Audio / SFX: calm ambient music + sound effects, ADHD-safe (AUDIO-01, deferred since v3.0)
- Drop tables 1 & 10 from the practice rotation (pending todo, 2026-07-04)

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

None — v5.0's full requirement set (25/25) is validated and complete as of Phase 28. Milestone ready for audit/completion.


### Out of Scope

- Backend / server-side logic, accounts, databases, data collection — static hosting only (a container that *serves* files is fine; no app server, nothing leaves her browser)
- Pink or "girly" visual design — explicitly excluded
- Timed pressure mechanics — ADHD context, stress must be avoided
- Mobile-only UI — Windows laptop is the target device
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
*Last updated: 2026-07-09 — v5.0 Phase 28 (Full Verification & Interactive Sign-off) complete — all 7 v5.0 phases (22-28) and all 25 v5.0 requirements done; milestone ready for audit/completion*
