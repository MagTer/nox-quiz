# Math Lab

## What This Is

A real 2D platformer for a 12-year-old girl, played in the browser with the keyboard — run, jump across platforms, reach the goal — where multiplication is the *gate to progress*, modeled on the Mario-style math game she plays at school. The platforming is the intrinsically fun part; math (weighted toward the 6–9 tables) is what stands between her and the next stage. Dark grunge aesthetic, no pink, no timers, no pressure.

> **Direction correction (v3.0):** v1.0–v2.0 built a multiple-choice quiz with a static picture (a dungeon "crawler" that was really scorekeeping with a goblin emoji above the question). That was a misread of the intent. The actual goal — established at v3.0 kickoff — is an *actual game she controls*: a 2D platformer with a moving avatar, real physics, and levels. v3.0 pivots to that. The tuned "math brain" (weighted question selection toward 6–9 tables) is carried forward; the quiz shell is replaced by a game shell.

## Core Value

She opens it because she *wants* to, not because she has to.

## Current State (shipped v4.0 — Content & Challenge, 2026-07-03)

Math Lab is now a replayable 2D platformer she controls with the keyboard, served as static files over HTTP. The full loop is live: title screen → level-select with locked / unlocked / cleared marks → four hand-built dark-grunge levels → four forgiving, no-timer, multiple-choice math mechanics (locked doors, checkpoint gates, defeat-enemy, collect-the-answer) woven throughout the levels → correct answers clear gates and award XP/leveling on the v1/v2 curve → per-level completion/unlock, XP/level, and per-table practice history persist in a fresh versioned localStorage save and resume on revisit. Table difficulty ramps from easier pools to the 6–9 weak spots; platforming difficulty ramps gently across levels. Animated player (idle/run/jump + facing), real tileset, camera-tied parallax, styled title/select screens. Built on vendored Kaplay with no build step; static files in an nginx container. All 22 v4.0 requirements satisfied (21 verified + automated browser boot; SAFE-05 kid-UAT live sign-off deferred and tracked in `19-UAT.md`).

**Validated this milestone:** the *game* works as a real, replayable multi-level experience. **What it isn't yet:** audio/SFX + music, more worlds/level packs, and live deployment confirmation remain for future milestones.

## Current Milestone: v4.1 Art Rework

**Goal:** Redo Phase 18's art deliverables with real curated CC0 pixel art in place of the
procedurally-generated placeholder noise that shipped, and close the process gap that let it
ship ungraded.

**Target features:**
- Animated player sprite (idle/run/jump + facing) sourced from real pixel art, silhouette-tested
  against the actual `#0a0a0a` game background
- Dark-grunge tileset with designed edge/seam frames (not random noise)
- Camera-tied parallax background depicting composed scenery
- Styled title/select screens with real panel framing/texture, not flat rectangles
- Mandatory human visual sign-off before the phase can be marked verified

Not in scope: audio/SFX, more worlds, deployment hardening (still deferred to v5.0), any gameplay/
logic changes — this is an asset-and-process redo of Phase 18 only.

## Next Milestone Goals

**v5.0 — TBD.** Candidate directions:
- Audio / SFX / calm ambient music (AUDIO-01, deferred since v3.0)
- More worlds / level packs beyond the initial four levels (CONTENT-FUT-01)
- Deployment hardening: live Dokploy URL playthrough confirmation (deferred from v3.0 SETUP-02)

A fresh `REQUIREMENTS.md` will be created when the next milestone is opened.

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

### Active

*(Next milestone — requirements to be defined when v5.0 is opened)*


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
- **Current state (v4.0 shipped)**: a real 2D Kaplay platformer (~3,456 LOC across `src/`, excl. vendored Kaplay), no build step, served over HTTP — title → level-select → four hand-built dark-grunge levels → four forgiving in-world math mechanics → persisted XP/leveling + per-level completion/unlock. Automated browser-boot regression green; kid-UAT live sign-off for SAFE-05 deferred and tracked. The v1/v2 quiz and v3.0 single-level slice are archived. Next: v5.0 (audio, more worlds, or deployment hardening).
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
*Last updated: 2026-07-03 — v4.0 Content & Challenge milestone shipped*
