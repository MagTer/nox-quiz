# Math Lab

## What This Is

A real 2D platformer for a 12-year-old girl, played in the browser with the keyboard — run, jump across platforms, reach the goal — where multiplication is the *gate to progress*, modeled on the Mario-style math game she plays at school. The platforming is the intrinsically fun part; math (weighted toward the 6–9 tables) is what stands between her and the next stage. Dark grunge aesthetic, no pink, no timers, no pressure.

> **Direction correction (v3.0):** v1.0–v2.0 built a multiple-choice quiz with a static picture (a dungeon "crawler" that was really scorekeeping with a goblin emoji above the question). That was a misread of the intent. The actual goal — established at v3.0 kickoff — is an *actual game she controls*: a 2D platformer with a moving avatar, real physics, and levels. v3.0 pivots to that. The tuned "math brain" (weighted question selection toward 6–9 tables) is carried forward; the quiz shell is replaced by a game shell.

## Core Value

She opens it because she *wants* to, not because she has to.

## Current State (shipped v4.1 — Art Rework, 2026-07-04)

Math Lab is a replayable 2D platformer she controls with the keyboard, served as static files over HTTP. The full loop is live: title screen → level-select with locked / unlocked / cleared marks → four hand-built dark-grunge levels → four forgiving, no-timer, multiple-choice math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) woven throughout the levels → correct answers clear gates and award XP/leveling on the v1/v2 curve → per-level completion/unlock, XP/level, and per-table practice history persist in a fresh versioned localStorage save and resume on revisit. Table difficulty ramps from easier pools to the 6–9 weak spots; platforming difficulty ramps gently across levels. This milestone replaced Phase 18's procedurally-generated placeholder art with real curated CC0 pixel art (animated player, tileset, parallax, title/select screens), all under genuine human visual sign-off — and separately closed a verification-integrity gap: `door.js`, `gates.js`, `enemy.js`, and `mathGate.js` now each have real interactive audit coverage (not just code review), the automated boot gate genuinely exercises movement + mechanic resolution on all 4 levels, and several real bugs were found and fixed along the way (an enemy-challenge display bug, a simultaneous-challenge UI/state-corruption bug, a jump-over exploit on math-gates/enemies, and a path-traversal/bind-all-interfaces issue in the local test scripts). Built on vendored Kaplay with no build step; static files in an nginx container. All 10 v4.1 requirements satisfied.

**Validated this milestone:** the game's art now matches the intended dark-grunge aesthetic under real human sign-off, and this project's own verification claims are now held to the same interactive-proof standard the process gap had let slip. **What it isn't yet:** audio/SFX + music, more worlds/level packs, and live deployment confirmation remain for future milestones. Also carried forward as known, intentionally-scoped gaps: New Finding 4's visual-overlap half is fixed but 6/16 mechanic encounters across the 4 levels remain out of the audit script's reach (documented technical reason: spike-hazard timing resonance in the traversal model) — not a game bug, a test-tooling limitation.

**v5.0 progress:** Phase 22 (Implementation Review & Auto-Fix) complete 2026-07-05 — all 24 entities/surfaces carry final review verdicts (17 clean, 6 fixed, 4 structural-deferred), one approved escalation implemented after its recorded decision, full suite green with zero regressions vs the pre-fix baseline; LOCKED surfaces (math brain, vendored Kaplay, level descriptors) diff-proven untouched. Phase 23 (Level Validation Harness) complete 2026-07-06 — `scripts/validate-levels.mjs` built and proven RED-first against the untouched levels 1–4 (9 genuine hard-failures, correctly naming all 3 known over-hole defects), its jump envelope empirically calibrated against the real engine (not closed-form theory), and the interactive audit's 6/16 mechanic-encounter blind spot fully closed to 16/16 on levels 1–4. Zero level-descriptor edits landed (fixes are Phase 24's job). A code review independently caught and fixed 3 additional false-negative bugs in the validator's own detection logic before it was trusted as a gate.

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

### Active

*(v5.0 — REQUIREMENTS.md: 8 longer levels, richer grunge palette, Nox Run rebrand + logo, audio/SFX, drop tables 1 & 10; FIX-01/FIX-02 validated in Phase 22, VALID-01/VALID-02 validated in Phase 23; VALID-03 groundwork laid in Phase 23, final closure across all 8 levels is Phase 28)*


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
*Last updated: 2026-07-06 — v5.0 Phase 23 (Level Validation Harness) complete*
