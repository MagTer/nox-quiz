# Requirements: Math Lab

**Defined:** 2026-06-28
**Milestone:** v4.0 Content & Challenge
**Core Value:** She opens it because she *wants* to, not because she has to.

## v4.0 Requirements

Requirements for the Content & Challenge milestone. Each maps to a roadmap phase.
Built on the shipped v3.0 platformer (movement/camera/respawn spine, `mathGate.js`
bridge, `brain.js`/`progress.js` firewalls) — reuse, don't rebuild. The 6–9 weighted
selection algorithm in `math/brain.js` is LOCKED and unchanged this milestone.

### Levels & Difficulty

- [ ] **LVL-01**: The game has 3–5 distinct, hand-built, completable levels, each traversable start→goal on the existing movement/collider spine.
- [ ] **LVL-02**: Levels are defined as plain JS data consumed by a parameterized builder, registered in an ordered level registry — no build step, no Kaplay `addLevel` symbol maps, no Tiled.
- [ ] **LVL-03**: Table difficulty ramps across levels — early levels draw from easier table pools (e.g. 1–5) and later levels restrict toward the 6–9 weak spots — via a per-level allowed-tables pool passed into the (unchanged) weighted brain.
- [ ] **LVL-04**: Platforming difficulty ramps across levels (length, gap precision, hazard density) through level data.

### Title & Level-Select Shell

- [ ] **NAV-01**: A dark-grunge title screen is shown on load, from which she can start/continue into the game.
- [ ] **NAV-02**: A level-select screen lists the levels with locked / unlocked / cleared state and lets her pick any unlocked level to play.
- [ ] **NAV-03**: Clearing a level unlocks the next; she can return to level-select and resume from any unlocked level (no forced replay of earlier levels).
- [ ] **NAV-04**: Navigation between title, level-select, and a level happens via in-game screens (no browser dialogs), with clean state on each entry — no leaked input handlers, colliders, or effects across screen changes.

### Mid-Game Math Mechanics

- [ ] **MECH-01**: A single shared in-world challenge component (forgiving, no-timer, multiple-choice) backs every math interaction; a wrong answer re-asks with no penalty and no progress lost.
- [ ] **MECH-02**: Locked door / key — answering correctly opens a door or bridge that gates the next section mid-level.
- [ ] **MECH-03**: Collect-the-answer — the correct numeric answer is one of several in-world pickups; collecting the right one clears the challenge, and collecting a wrong one never punishes.
- [ ] **MECH-04**: Multiple checkpoint gates — several in-level math gates (not only at the goal), each independently tracked within the level.
- [ ] **MECH-05**: Defeat-enemy-with-answer — answering correctly removes a blocking enemy; the enemy never deals contact damage and never ends the run.

### Art & Presentation Pass

- [ ] **ART-01**: The player is an animated sprite with idle / run / jump states and faces its movement direction.
- [ ] **ART-02**: Levels render with a real dark-grunge tileset (not single-color placeholders), with readable silhouettes against the background.
- [ ] **ART-03**: A layered / parallax background gives depth — calm, camera-tied (not timer-driven), and non-strobing.
- [ ] **ART-04**: The title and level-select screens are styled to the dark-grunge aesthetic (no pink).

### Persistence

- [ ] **SAVE-05**: v4.0 uses a fresh, versioned save format (new key/version); existing v3.0 progress is NOT migrated (clean slate by design), and a stale or foreign save never bricks the game.
- [ ] **SAVE-06**: Per-level completion (cleared) and derived unlock state persist in localStorage and resume on revisit.
- [ ] **SAVE-07**: XP / level and per-table practice history persist within the fresh save and keep question selection adapted to her weak spots across visits.

### ADHD-Safety (extended)

- [ ] **SAFE-04**: The no-timer / forgiving / no-game-over mandate holds across ALL new mechanics, levels, and enemies (audited) — nothing counts down, punishes a wrong answer, or ends the run.
- [ ] **SAFE-05**: New art, parallax, and effects stay non-strobing and not over-stimulating (motion/flash within the established caps), confirmed in kid-UAT.

## v2 Requirements (deferred to a future milestone)

### Audio

- **AUDIO-01**: Sound effects + calm ambient music (ADHD-safe), deferred since v3.0.

### Richer content

- **CONTENT-FUT-01**: More worlds / level packs beyond the initial 3–5.
- **CONTENT-FUT-02**: Star/score-based completion texture (kept out of v4.0 to stay simple and non-punishing).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Migrating the v3.0 save into v4.0 | User chose a clean reset; fresh save format, no migration |
| Stars / scoring / losable streaks | ADHD-safe simplicity — cleared/locked marks only this milestone |
| Timers, lives, game-over, contact-damage enemies | Hard ADHD-safety mandate — nothing punishes or pressures |
| Audio / SFX / music | Deferred (AUDIO-01) to a future milestone |
| Pink or "girly" visual design | Explicitly excluded project-wide |
| Bundler / sprite-packer / Tiled / any new runtime dependency | No-build, vendored-only constraint; all v4.0 features are native to Kaplay 3001 |
| Upgrading Kaplay past 3001.0.19 | Version-coupled code (Rect class, setCamPos); pin held — any upgrade is its own scoped task |
| Changing the 6–9 weighted selection algorithm | `math/brain.js` is locked and validated; difficulty ramps via table pools only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LVL-01 | Phase 17 | Pending |
| LVL-02 | Phase 13 | Pending |
| LVL-03 | Phase 16 | Pending |
| LVL-04 | Phase 17 | Pending |
| NAV-01 | Phase 14 | Pending |
| NAV-02 | Phase 14 | Pending |
| NAV-03 | Phase 14 | Pending |
| NAV-04 | Phase 14 | Pending |
| MECH-01 | Phase 15 | Pending |
| MECH-02 | Phase 15 | Pending |
| MECH-03 | Phase 16 | Pending |
| MECH-04 | Phase 16 | Pending |
| MECH-05 | Phase 16 | Pending |
| ART-01 | Phase 18 | Pending |
| ART-02 | Phase 18 | Pending |
| ART-03 | Phase 18 | Pending |
| ART-04 | Phase 18 | Pending |
| SAVE-05 | Phase 13 | Pending |
| SAVE-06 | Phase 13 | Pending |
| SAVE-07 | Phase 13 | Pending |
| SAFE-04 | Phase 19 | Pending |
| SAFE-05 | Phase 19 | Pending |

**Coverage:**
- v4.0 requirements: 22 total
- Mapped to phases: 22 ✓ (all mapped; no orphans, no duplicates)
- Unmapped: 0

**Phase → requirement count:**
- Phase 13 (Fresh Save Format + Level Registry/Data): SAVE-05, SAVE-06, SAVE-07, LVL-02 (4)
- Phase 14 (Multi-Scene Shell): NAV-01, NAV-02, NAV-03, NAV-04 (4)
- Phase 15 (Challenge Seam + Locked-Door Mechanic): MECH-01, MECH-02 (2)
- Phase 16 (Remaining Mechanics + Difficulty Curve): MECH-03, MECH-04, MECH-05, LVL-03 (4)
- Phase 17 (Build the Levels): LVL-01, LVL-04 (2)
- Phase 18 (Art, Animation & Parallax): ART-01, ART-02, ART-03, ART-04 (4)
- Phase 19 (Polish & Consolidated Kid-UAT): SAFE-04, SAFE-05 (2)

---
*Requirements defined: 2026-06-28 for v4.0 Content & Challenge*
*Last updated: 2026-06-29 — traceability mapped to Phases 13–19*
