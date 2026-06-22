# Requirements: Math Lab — v3.0 The Platformer

**Defined:** 2026-06-22
**Core Value:** She opens it because she *wants* to, not because she has to.
**Milestone goal:** A real 2D platformer she controls with the keyboard — run, jump, reach the goal — where math is the gate to progress, like the Mario-style game from her school. Scope: ONE great, polished level + the end-of-stage math gate.

## v1 Requirements

Requirements for this milestone (v3.0). Each maps to a roadmap phase.

### Project Setup & Serving

- [ ] **SETUP-01**: The game runs in a browser via a documented one-line local static server (e.g. `python3 -m http.server`)
- [ ] **SETUP-02**: Opening the game incorrectly (over `file://`) shows a friendly message explaining how to start it
- [ ] **SETUP-03**: Kaplay (pinned to 3001.0.19) is vendored locally — no CDN, no `npm install` needed to play
- [ ] **SETUP-04**: The project uses a clean multi-file layout (HTML + JS modules + assets folder) with no build step

### Movement & Feel

- [ ] **MOVE-01**: Player can run left and right using the keyboard (arrow keys and WASD)
- [ ] **MOVE-02**: Player jumps with gravity and lands solidly on platforms
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

## v2 Requirements

Acknowledged but deferred to later milestones. Tracked, not in this roadmap.

### Richer Math Mechanics

- **DOOR-01**: Mid-level locked doors/bridges that open only on a correct answer (answer choices as platforms/doors)
- **COLLECT-01**: Collect-the-answer — jump to grab the floating number that answers the shown question
- **ENEMY-01**: Defeat-the-enemy — reuse the 👺💀🐉 enemies as path blockers cleared by a correct answer

### Progression & Persistence

- **XP-01**: XP and leveling carry over from gameplay (port v1/v2 PlayerState/XP)
- **SAVE-01**: Progress persists between sessions via localStorage (port v2 PersistenceStore, versioned)

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
| Online / server component, accounts, leaderboards | Local-only, offline, no social comparison |
| Pink or "girly" visual design | Explicitly excluded per project canon |
| Bundler / build step (Webpack, Vite, etc.) | No-build philosophy retained; vendor Kaplay directly |
| Pixel-perfect precision platforming | Too punishing for the target user; forgiving feel instead |
| Modifying the tuned question-selection algorithm | Port the math brain verbatim; the 6–9 weighting is already validated |

## Traceability

Populated during roadmap creation. Each requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | — | Pending |
| SETUP-02 | — | Pending |
| SETUP-03 | — | Pending |
| SETUP-04 | — | Pending |
| MOVE-01 | — | Pending |
| MOVE-02 | — | Pending |
| MOVE-03 | — | Pending |
| MOVE-04 | — | Pending |
| MOVE-05 | — | Pending |
| LEVEL-01 | — | Pending |
| LEVEL-02 | — | Pending |
| LEVEL-03 | — | Pending |
| LEVEL-04 | — | Pending |
| LEVEL-05 | — | Pending |
| LEVEL-06 | — | Pending |
| LEVEL-07 | — | Pending |
| LEVEL-08 | — | Pending |
| GATE-01 | — | Pending |
| GATE-02 | — | Pending |
| GATE-03 | — | Pending |
| GATE-04 | — | Pending |
| GATE-05 | — | Pending |
| GATE-06 | — | Pending |
| JUICE-01 | — | Pending |
| JUICE-02 | — | Pending |
| JUICE-03 | — | Pending |
| SAFE-01 | — | Pending |
| SAFE-02 | — | Pending |
| SAFE-03 | — | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 29 ⚠️ (resolved by roadmapper)

---
*Requirements defined: 2026-06-22*
*Last updated: 2026-06-22 after v3.0 definition*
