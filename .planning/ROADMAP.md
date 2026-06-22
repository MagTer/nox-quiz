# Roadmap: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Last updated:** 2026-06-22

## Milestones

- ✅ **v1.0 MVP** — Phase 1 (shipped 2026-06-20) — see [v1.0 archive not created; Phase 1 included in v2.0 archive]
- ✅ **v2.0 Dungeon Crawler** — Phases 2–6 (shipped 2026-06-22) — [archive](milestones/v2.0-ROADMAP.md)
- ⏳ **v3.0 The Platformer** — Phases 7–12 (active) — pivot to a real 2D platformer with an end-of-stage math gate, hosted at a web URL, with persisted XP/leveling

## Phases

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

### v3.0 The Platformer (Phases 7–12) — ACTIVE

**Milestone goal:** Turn Math Lab into a real 2D platformer she controls with the keyboard — run, jump, reach the goal — where math is the gate to progress, like the Mario-style game from her school. Hosted at a web URL (Docker/nginx static via Dokploy), with XP/leveling/practice-history persisted in the browser. Scope: ONE great, polished level + the end-of-stage math gate + persistent progression.

**Granularity:** standard · **Phase numbering:** sequential, continuing from v2.0 (ended at Phase 6).

- [ ] **Phase 7: Project Setup & Deployment** - Vendored Kaplay boots from static files served by a Docker/nginx container, deployable to Dokploy and reachable at a web URL.
- [ ] **Phase 8: Platformer Core (Movement / Physics / Camera)** - A responsive, Mario-feel avatar runs, jumps, lands, and respawns gently on a test strip.
- [ ] **Phase 9: Level Build & CC0 Assets** - One polished, completable dark/grunge level with platforms, coins, a hazard, checkpoints, and a goal.
- [ ] **Phase 10: Math-Gate Integration (Port the Brain)** - Reaching the goal opens an in-world, forgiving math gate driven by the ported 6–9-weighted brain.
- [ ] **Phase 11: Progression & Persistence** - Correct answers earn XP and level her up; XP, level, and practice history persist in the browser and resume on revisit.
- [ ] **Phase 12: Polish, ADHD-Safety & UAT** - Juice, discoverable controls, contrast, no-timer/forgiving audit, and verification with the actual kid.

## Phase Details

### Phase 7: Project Setup & Deployment

**Goal**: The new multi-file game project is packaged as static files served by a Docker (nginx) container, deploys via Dokploy, and is reachable at a web URL she can just visit — no install, no launcher, no local files. Kaplay 3001.0.19 is vendored locally and the project has a clean, no-JS-build multi-file layout. This is the riskiest infra step — packaging, hosting, and the Kaplay version-churn pitfalls bite before any game code exists, so they are neutralized first. (Hosting over HTTP also sidesteps the `file://` module/asset-loading block for her; a local dev server is documented for development only.)
**Depends on**: Nothing (first phase of the milestone)
**Requirements**: SETUP-01, SETUP-02, SETUP-03, SETUP-04
**Success Criteria** (what must be TRUE):

  1. The game is packaged as static files served by a Docker container running nginx — no backend, no database, no server-side logic — and the container serves a live Kaplay canvas (an empty `scene("game")` drawing "hello").
  2. The container deploys via Dokploy and the game is reachable at a web URL that loads and runs in the browser with no install, no launcher, and no local files for the user.
  3. Kaplay 3001.0.19 loads from a locally vendored file with no CDN call and no `npm install` step, version commented at the top of the vendored file.
  4. The repo has a clean multi-file layout (HTML + `src/` JS modules + `lib/` + `assets/` folder) that runs with no JS build step, and a local dev server (e.g. `python3 -m http.server`) is documented for development use only.

**Plans**: 2 plans
**Wave 1**

- [ ] 07-01-PLAN.md — Scaffold no-build layout: archive v2, vendor Kaplay 3001.0.19, game shell (index.html + main.js with file:// guard + smoke scene), README (SETUP-03, SETUP-04)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 07-02-PLAN.md — Containerize (nginx:alpine + .mjs MIME fix) with local curl verification, and Dokploy deploy docs (SETUP-01, SETUP-02)

### Phase 8: Platformer Core (Movement / Physics / Camera)

**Goal**: The intrinsically-fun spine works — an avatar she controls runs, jumps with weight, lands solidly, and the camera follows smoothly, all frame-rate independent. The gentle checkpoint-respawn policy is established here so later hazards inherit it.
**Depends on**: Phase 7
**Requirements**: MOVE-01, MOVE-02, MOVE-03, MOVE-04, MOVE-05, LEVEL-06
**Success Criteria** (what must be TRUE):

  1. The player runs left/right with both arrow keys and WASD, and jumps with Space or Up, on a test platform strip.
  2. Jumping feels responsive — variable jump height, coyote time, and jump buffering are all present (not a fixed grounded jump).
  3. The avatar lands solidly on platforms with no sticking on seams and no tunneling through the floor on a fast drop.
  4. The camera follows the player smoothly (no jitter) and stays clamped within level bounds; movement feels identical on a non-60 Hz / throttled display.
  5. Falling off the world respawns the player at the last checkpoint with progress preserved — no lives, no game-over.

**Plans**: TBD
**UI hint**: yes

### Phase 9: Level Build & CC0 Assets

**Goal**: One complete, polished level she can traverse start-to-goal, built from a chosen dark/grunge CC0 pack, with collectible coins, a respawn-triggering hazard, and a goal that hands off to the math gate. Asset licenses are documented.
**Depends on**: Phase 8
**Requirements**: LEVEL-01, LEVEL-02, LEVEL-03, LEVEL-04, LEVEL-05, LEVEL-07, LEVEL-08
**Success Criteria** (what must be TRUE):

  1. The player can traverse one complete level from start to the goal flag, over platforms, gaps, and solid ground with reliable collision.
  2. The level renders in pixel art from a free CC0 pack styled dark/grunge (no pink), with readable silhouettes against the background.
  3. The player can collect coins placed throughout the level.
  4. At least one hazard or enemy triggers a gentle checkpoint respawn — never a game-over.
  5. Reaching the goal triggers the math-gate hook, and `CREDITS`/`LICENSES` records every asset's source and verified license (no vendor logos).

**Plans**: TBD
**UI hint**: yes

### Phase 10: Math-Gate Integration (Port the Brain)

**Goal**: The milestone keystone — the ported, framework-agnostic math brain (6–9-weighted selection) is wired to the level through a single bridge so that reaching the goal opens an in-world, forgiving, no-timer math gate that clears the level on a correct answer. The math port has zero dependency on the game shell and can proceed in parallel with Phases 8–9; this phase is the join point.
**Depends on**: Phase 9 (goal + clean pause); the math-brain port itself has no game-shell dependency and can proceed in parallel from Phase 7 onward
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06
**Success Criteria** (what must be TRUE):

  1. Reaching the goal pauses the level and shows the math question as an in-world gate (game font/palette, avatar visible behind it) — not a system quiz popup.
  2. The question presents 4 multiple-choice answers from the ported weighted selector, biased toward the 6–9 tables.
  3. A correct answer opens the gate / clears the level with a celebratory moment.
  4. A wrong answer is forgiving — it re-asks with no penalty, no progress lost, and the run does not end.
  5. The gate has no countdown or time pressure, and the math module imports nothing from Kaplay (clean firewall; `ui/mathGate.js` is the only bridge), surviving replays with no leaked state.

**Plans**: TBD
**UI hint**: yes

### Phase 11: Progression & Persistence

**Goal**: Her play accumulates — correct answers at the math gate earn XP and level her up using the proven v1/v2 curve, and XP, level, and per-table practice history persist in the browser between visits, just like her school game. Returning to the URL resumes her progression and keeps question selection adapted to her weak spots. This depends on Phase 10 because the math gate's correct/wrong outcomes are what drive XP; persistence comes after the gate produces real results.
**Depends on**: Phase 10 (the math gate's correct/wrong outcomes drive XP)
**Requirements**: SAVE-01, SAVE-02, SAVE-03, SAVE-04
**Success Criteria** (what must be TRUE):

  1. A correct answer at the math gate earns XP, and accumulated XP levels her up following the ported v1/v2 XP curve and level system.
  2. XP, level, and per-table practice history (accuracy/mastery) persist in the browser via versioned localStorage and survive closing the tab.
  3. Returning to the URL resumes her progression with XP/level intact, and the persisted accuracy history keeps question selection adapted to her weak spots.
  4. Current XP and level are visible in-game (XP bar / level indicator) and reaching a new level shows a distinct level-up moment.

**Plans**: TBD
**UI hint**: yes

### Phase 12: Polish, ADHD-Safety & UAT

**Goal**: The game reads and feels like a real game in front of the actual kid — satisfying juice, discoverable controls, readable contrast — and the no-timer / forgiving / low-stimulation mandate is audited and confirmed in UAT. Feel and framing are validated only with the user, so this phase is last.
**Depends on**: Phase 11
**Requirements**: JUICE-01, JUICE-02, JUICE-03, SAFE-01, SAFE-02, SAFE-03
**Success Criteria** (what must be TRUE):

  1. Jumping and landing have satisfying, subtle visual feedback (squash/stretch, dust), and collecting a coin gives a satisfying pop.
  2. Clearing the level has a distinct, celebratory (non-strobing, brief) moment.
  3. An on-screen control hint shows how to move and jump, discoverable on the target Windows laptop.
  4. A no-timer/forgiving audit confirms there are no countdowns anywhere and wrong answers never punish.
  5. Visuals meet readable contrast on the dark theme and effects are not over-stimulating, confirmed in UAT with the kid.

**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. MVP Core Loop & ADHD-Safe Mechanics | v1.0 | 4/4 | ✅ Complete | 2026-06-20 |
| 2. Combat Foundation | v2.0 | 3/3 | ✅ Complete | 2026-06-21 |
| 3. Screen Architecture | v2.0 | 2/2 | ✅ Complete | 2026-06-21 |
| 4. Dungeon Renderer | v2.0 | 3/3 | ✅ Complete | 2026-06-21 |
| 5. Full Floor Loop + Balance | v2.0 | 2/2 | ✅ Complete | 2026-06-21 |
| 6. Polish + ADHD Safety Audit | v2.0 | 2/2 | ✅ Complete | 2026-06-22 |
| 7. Project Setup & Deployment | v3.0 | 0/2 | Not started | - |
| 8. Platformer Core | v3.0 | 0/0 | Not started | - |
| 9. Level Build & CC0 Assets | v3.0 | 0/0 | Not started | - |
| 10. Math-Gate Integration | v3.0 | 0/0 | Not started | - |
| 11. Progression & Persistence | v3.0 | 0/0 | Not started | - |
| 12. Polish, ADHD-Safety & UAT | v3.0 | 0/0 | Not started | - |

## Coverage (v3.0)

- v1 requirements: 33 total
- Mapped to phases: 33 ✓
- Unmapped: 0
- No requirement mapped to more than one phase.

**Per-phase counts:** Phase 7 = 4 · Phase 8 = 6 · Phase 9 = 7 · Phase 10 = 6 · Phase 11 = 4 · Phase 12 = 6 → 33 total.

---

*Archive: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md)*
*v3.0 roadmap created: 2026-06-22 — pivot to a real 2D platformer*
*v3.0 roadmap revised: 2026-06-22 — Phase 7 retitled to Deployment (Docker/nginx/Dokploy URL hosting); new Phase 11 Progression & Persistence added (SAVE-01..04); Polish/UAT shifted to Phase 12*
