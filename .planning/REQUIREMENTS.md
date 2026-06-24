# Requirements: Math Lab — v3.0 The Platformer

**Defined:** 2026-06-22
**Core Value:** She opens it because she *wants* to, not because she has to.
**Milestone goal:** A real 2D platformer she controls with the keyboard — run, jump, reach the goal — where math is the gate to progress, like the Mario-style game from her school. Scope: ONE great, polished level + the end-of-stage math gate.

## v1 Requirements

Requirements for this milestone (v3.0). Each maps to a roadmap phase.

### Project Setup & Deployment

- [x] **SETUP-01**: The game is packaged as static files served by a Docker container (nginx) — no backend, no database, no server-side logic
- [x] **SETUP-02**: The container deploys via Dokploy and the game is reachable at a web URL she can visit to play (no install, no launcher, no local files)
- [x] **SETUP-03**: Kaplay (pinned to 3001.0.19) is vendored locally — no CDN, no `npm install` needed to play
- [x] **SETUP-04**: The project uses a clean multi-file layout (HTML + JS modules + assets folder) with no JS build step; a local dev server is documented for development

### Movement & Feel

- [x] **MOVE-01**: Player can run left and right using the keyboard (arrow keys and WASD)
- [x] **MOVE-02**: Player jumps with gravity and lands solidly on platforms
- [ ] **MOVE-03**: Jumping feels responsive — variable jump height, coyote time, and jump buffering
- [ ] **MOVE-04**: The camera follows the player and stays clamped within the level bounds
- [ ] **MOVE-05**: Movement is frame-rate independent (consistent feel on any display refresh rate)

### Level & Assets

- [ ] **LEVEL-01**: One complete, polished level the player can traverse from start to the goal
- [ ] **LEVEL-02**: Level art uses pixel-art sprites from a free CC0 pack, styled dark/grunge (no pink)
- [ ] **LEVEL-03**: Level has platforms, gaps, and solid ground with reliable collision (no sticking or falling through)
- [ ] **LEVEL-04**: Player can collect coins placed throughout the level
- [ ] **LEVEL-05**: Level has at least one hazard or enemy that triggers a respawn (never a game-over)
- [ ] **LEVEL-06**: Player respawns at the last checkpoint with progress preserved — no lives, no game-over screen
- [ ] **LEVEL-07**: Reaching the goal triggers the math gate
- [ ] **LEVEL-08**: CC0 asset sources and licenses are documented in the repository

### Math Gate

- [ ] **GATE-01**: At the goal, a math question appears as an in-world gate (not a system quiz popup), with the level paused and visible behind it
- [ ] **GATE-02**: The question presents 4 multiple-choice answers using the ported weighted selection (biased toward the 6–9 tables)
- [ ] **GATE-03**: A correct answer opens the gate / clears the level with a celebratory moment
- [ ] **GATE-04**: A wrong answer is forgiving — re-ask with no penalty and no progress lost
- [ ] **GATE-05**: The gate has no countdown timer or any time pressure
- [ ] **GATE-06**: The ported math brain is a standalone module with no dependency on the game engine (clean firewall)

### Polish & Juice

- [ ] **JUICE-01**: Jumping and landing have satisfying visual feedback (e.g. squash/stretch, dust)
- [ ] **JUICE-02**: Collecting a coin gives a satisfying pop/feedback
- [ ] **JUICE-03**: Clearing the level has a distinct celebratory moment

### ADHD Safety & Accessibility

- [ ] **SAFE-01**: No timers or countdowns appear anywhere in the game (audited)
- [ ] **SAFE-02**: Controls are discoverable — an on-screen hint shows how to move and jump
- [ ] **SAFE-03**: Visuals meet readable contrast on the dark theme and effects are not over-stimulating

### Progression & Persistence

- [ ] **SAVE-01**: The player earns XP for correct answers and levels up (port the v1/v2 XP curve and level system into the platformer)
- [ ] **SAVE-02**: XP, level, and per-table practice history (accuracy/mastery) persist in the browser (localStorage, versioned) between visits
- [ ] **SAVE-03**: Returning to the URL resumes her progression with XP/level intact; the persisted accuracy history keeps question selection adapted to her weak spots
- [ ] **SAVE-04**: Current XP and level are visible in-game (XP bar / level indicator) with a level-up moment

## v2 Requirements

Acknowledged but deferred to later milestones. Tracked, not in this roadmap.

### Richer Math Mechanics

- **DOOR-01**: Mid-level locked doors/bridges that open only on a correct answer (answer choices as platforms/doors)
- **COLLECT-01**: Collect-the-answer — jump to grab the floating number that answers the shown question
- **ENEMY-01**: Defeat-the-enemy — reuse the 👺💀🐉 enemies as path blockers cleared by a correct answer

### Content & Atmosphere

- **WORLD-01**: Multiple connected levels with increasing difficulty and a level select
- **AUDIO-01**: Sound effects and ambient music (the biggest remaining "real game" gap once the loop feels good)
- **MOVE2-01**: Double jump / advanced movement abilities

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Any countdown timer / time pressure | ADHD context — time pressure triggers stress; hard constraint across all milestones |
| Lives counter / game-over screen | Punishment loop; contradicts the no-pressure mandate |
| Score/grade/accuracy shaming | Shame-spiral risk; solo, judgment-free practice only |
| Instant-death pits without respawn | Punishing; gentle checkpoint respawn instead |
| Fail-out (ejected) on a wrong answer | Frustration; wrong answers re-ask with no penalty |
| Backend / server-side logic, accounts, databases, leaderboards | Static hosting only — a container serves files; no app server, no data collection, nothing leaves her browser |
| Pink or "girly" visual design | Explicitly excluded per project canon |
| Bundler / build step (Webpack, Vite, etc.) | No-build philosophy retained; vendor Kaplay directly |
| Pixel-perfect precision platforming | Too punishing for the target user; forgiving feel instead |
| Modifying the tuned question-selection algorithm | Port the math brain verbatim; the 6–9 weighting is already validated |

## Traceability

Each v1 requirement maps to exactly one phase. v3.0 phases continue from v2.0 (which ended at Phase 6).

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 7 | Complete |
| SETUP-02 | Phase 7 | Complete |
| SETUP-03 | Phase 7 | Complete |
| SETUP-04 | Phase 7 | Complete |
| MOVE-01 | Phase 8 | Complete |
| MOVE-02 | Phase 8 | Complete |
| MOVE-03 | Phase 8 | Pending |
| MOVE-04 | Phase 8 | Pending |
| MOVE-05 | Phase 8 | Pending |
| LEVEL-06 | Phase 8 | Pending |
| LEVEL-01 | Phase 9 | Pending |
| LEVEL-02 | Phase 9 | Pending |
| LEVEL-03 | Phase 9 | Pending |
| LEVEL-04 | Phase 9 | Pending |
| LEVEL-05 | Phase 9 | Pending |
| LEVEL-07 | Phase 9 | Pending |
| LEVEL-08 | Phase 9 | Pending |
| GATE-01 | Phase 10 | Pending |
| GATE-02 | Phase 10 | Pending |
| GATE-03 | Phase 10 | Pending |
| GATE-04 | Phase 10 | Pending |
| GATE-05 | Phase 10 | Pending |
| GATE-06 | Phase 10 | Pending |
| SAVE-01 | Phase 11 | Pending |
| SAVE-02 | Phase 11 | Pending |
| SAVE-03 | Phase 11 | Pending |
| SAVE-04 | Phase 11 | Pending |
| JUICE-01 | Phase 12 | Pending |
| JUICE-02 | Phase 12 | Pending |
| JUICE-03 | Phase 12 | Pending |
| SAFE-01 | Phase 12 | Pending |
| SAFE-02 | Phase 12 | Pending |
| SAFE-03 | Phase 12 | Pending |

**Coverage:**

- v1 requirements: 33 total
- Mapped to phases: 33 ✓
- Unmapped: 0
- No requirement mapped to more than one phase.

**Per-phase counts:** Phase 7 = 4 · Phase 8 = 6 · Phase 9 = 7 · Phase 10 = 6 · Phase 11 = 4 · Phase 12 = 6 → 33 total.

---
*Requirements defined: 2026-06-22*
*Last updated: 2026-06-22 — traceability repopulated by roadmapper (v3.0 Phases 7–12; SETUP→Deployment, new SAVE phase 11, Polish/UAT → phase 12)*
