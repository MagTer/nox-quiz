# Retrospective: Math Lab

## Milestone: v2.0 — Dungeon Crawler Phases

**Shipped:** 2026-06-22
**Phases:** 6 | **Plans:** 16 | **Commits:** 73 | **Timeline:** 3 days (2026-06-20 → 2026-06-22)

### What Was Built

1. Complete walking skeleton: single-file game loop, CONFIG module, XpCalculator, PlayerState, QuestionSelector, Renderer, InputHandler (Phase 1)
2. XP persistence via localStorage with migration-ready versioning (Phase 1)
3. Weighted question selection: 70/30 hard/easy, EWMA accuracy tracking, Fisher-Yates shuffle (Phase 1)
4. Grunge polish: SVG feTurbulence grain via CSS data URI, HUD with backdrop-filter, WCAG AA verified (Phase 1)
5. GameFSM (5-state, 9 transitions) + FloorConfig (4 floors, 3 enemy types, table pools) + CONFIG.DUNGEON (all dungeon constants) (Phase 2)
6. CombatEngine (HP math, damage resolution, XP on kill) + DungeonState (session-scoped) + PersistenceStore v2 migration (Phase 2)
7. data-screen / data-panel CSS visibility system, 6 screen panels, renderScreen() routing (Phase 3)
8. DungeonRenderer: emoji sprites, CSS HP bars (300ms), @keyframes floatUp (400ms) damage numbers, RPG feedback copy (Phase 4)
9. Full floor loop: 4 floors × 6 rooms, loot system (sword/shield/potion), death/retry with XP preservation, DungeonRunner orchestration (Phase 5)
10. Final RPG flavor text (3+ lines/enemy, rotation guard), ADHD safety audit 6/6 passed (Phase 6)

### What Worked

- **Wrap-don't-replace architecture**: Building the dungeon layer on top of v1 modules (QuestionSelector, PlayerState, PersistenceStore) rather than replacing them produced zero v1 regressions. GameFSM and CombatEngine consumed the existing engine cleanly.
- **Named constants from the start**: Enforcing CONFIG.DUNGEON for every HP/damage/XP value made the Phase 5 balance tuning trivial — change the constant, no hunting for magic numbers.
- **CSS data-screen visibility system**: Locking screen switching to a single `renderScreen()` function writing `data-screen` kept the routing sane across 6 panels.
- **Loot snapshot pattern**: Reading DungeonState.get().loot once per resolveAnswer() call prevented double-read bugs cleanly.
- **Audit-driven gap closure**: The milestone audit found DIFF-01 and DIFF-02 as gaps; inline closure commits fixed both within the same session.

### What Was Inefficient

- **DIFF-01 and DIFF-02 slipped through phase verification**: Floor-gated question selection and EWMA accuracy updates in combat were spec'd but not wired until the audit. Better pre-execution checklist of cross-module wiring would have caught these.
- **DungeonRunner.enterCombat() HP/loot save-restore**: This patch exists because DungeonState.init() has a side effect (resets HP). It works but is fragile. Cleaner solution: separate startCombat() from reset semantics.
- **ROADMAP.md and REQUIREMENTS.md went stale**: Phase 3 and 4 plan counts stayed wrong in the progress table; REQUIREMENTS.md checkboxes for DC-03/COMB-02 etc. stayed unchecked. These should be updated atomically with phase completion commits.

### Patterns Established

- IIFE closure module pattern for all new modules (GameFSM, CombatEngine, DungeonState, DungeonRunner, DungeonRenderer)
- `window.ModuleName` export inside DOMContentLoaded for cross-scope access
- `Object.assign` shallow copy for state snapshots exposed by getState()
- `do { } while (idx === lastIdx)` flavor text rotation guard
- SC-N assertion at end of plan execution to verify balance invariants (e.g., `8 × DAMAGE_WRONG < PLAYER_HP`)

### Key Lessons

- **Audit after milestone, not after each phase**: The audit found cross-cutting wiring gaps that per-phase verification missed. Keep the audit step at milestone close rather than trying to run it per-phase.
- **Spec room counts precisely**: "entrance → 3 combat rooms → boss room" vs "entrance + 4 combat + boss" caused a spec mismatch that's now tech debt. Count rooms, not labels.
- **levelUpFlash 800ms is borderline for ADHD-04**: The 500ms cap should be applied to all animations fired during or after combat, not just combat-frame animations. 400ms is a safer default.
- **SC-4 migration test must be human-executed**: Code-level verification of localStorage migration from v1 to v2 is not possible without a real v1 save fixture. Document the 9-step test and run it before first user play.

### Cost Observations

- Model mix: Sonnet 4.6 throughout (budget profile)
- Sessions: Multiple short sessions over 3 days
- Notable: 73 commits for a single 1,976-LOC HTML file — high planning overhead relative to code size, but the planning artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md per plan) caught DIFF-01 and DIFF-02 that would have been hard to find in production

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | LOC | Duration | Requirements |
|-----------|--------|-------|-----|----------|--------------|
| v1.0 MVP | 1 | 4 | ~816 | 1 day | 14/14 |
| v2.0 Dungeon Crawler | 5 | 12 | 1,976 | 2 days | 27/27 |
