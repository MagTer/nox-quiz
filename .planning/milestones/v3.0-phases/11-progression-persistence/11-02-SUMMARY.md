---
phase: 11-progression-persistence
plan: 02
subsystem: persistence
tags: [progression, save-load, ewma, mastery, kaplay, vanilla-js, firewall]

# Dependency graph
requires:
  - phase: 11-progression-persistence (Plan 01)
    provides: src/progress.js (createProgress/loadSave/writeSave/serialize), CONFIG.PROGRESS/SAVE/HUD
  - phase: 10-math-gate-integration
    provides: src/ui/mathGate.js (openMathGate, onClear seam), src/math/brain.js (createBrain factory)
provides:
  - "createBrain({ seedAccuracy, seedHistory }) resumes weak-spot weighting AND mastery; brain.snapshot() one-way persistence export"
  - "Gate onClear({ table: q.a }) carries the cleared table to the scene (gate awards no XP — forgiving)"
  - "Scene boot load → seed brain → award XP on clear → persist on clear + tab-hide round-trip"
affects: [11-progression-persistence Plan 03 (HUD), phase verification gate, UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Seed-injection: the loader injects validated saved accuracy/history into the pure brain; the brain reads no storage (one-way firewall preserved)"
    - "snapshot() as the single one-way persistence export — shallow copies, mutation-safe"
    - "Persist on event + visibilitychange (onHide), never on a timer (SAFE-01)"

key-files:
  created: []
  modified:
    - src/math/brain.js
    - src/ui/mathGate.js
    - src/scenes/game.js

key-decisions:
  - "seedHistory is LOCKED (not optional) so isMastered() drill-reduction resumes across visits, matching CONTEXT 'persist accuracy/history'"
  - "Seed validation mirrors archive fromJSON (explicit per-key range check, never spread of the untrusted blob — T-01-01 prototype-pollution mitigation)"
  - "Persist on both the correct-clear event and onHide; onHide captures EWMA drift from wrong attempts before the tab closes"
  - "Run/session state (coins, goalReached, position) is never serialized — only xp/level/accuracy/history"

patterns-established:
  - "Loader-injects-saved-state / brain-reads-no-storage keeps the brain node-safe and headlessly testable"
  - "snapshot() returns shallow copies so a caller mutating the blob cannot corrupt brain internals"

requirements-completed: [SAVE-02, SAVE-03]

# Metrics
duration: 3min
completed: 2026-06-26
status: complete
---

# Phase 11 Plan 02: Brain Seed/Snapshot + onClear({table}) + Scene Persistence Wiring Summary

**The progression round-trip is now real: the brain resumes saved weak-spot weighting AND mastery from `createBrain({ seedAccuracy, seedHistory })`, the gate carries the cleared table through `onClear({ table: q.a })`, and the scene loads on entry, awards XP on clear, and persists on both clear and tab-hide — with the brain still reading no storage (firewall intact).**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-26T14:17:07Z
- **Completed:** 2026-06-26T14:20:16Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- `createBrain({ seedAccuracy, seedHistory })` injects validated saved per-table EWMA accuracy AND boolean history (keys 1..9, accuracy 0..1, history filtered to booleans + clamped to `MASTERY_WINDOW`), so a returning session resumes both weak-spot weighting (SAVE-03) and `isMastered()` drill-reduction. No-arg `createBrain()` still works for the gate's fallback caller; the locked 6–9 selection math and EWMA body are untouched.
- `brain.snapshot()` returns shallow copies of accuracy/history as the single one-way persistence export — the loader serializes it; the brain never reads storage (firewall greps still clean).
- Gate `onClear?.({ table: q.a })` carries the cleared question's table to the scene; the gate still awards no XP itself (forgiving mandate — XP flows only through the correct-branch seam).
- Scene now loads the save on entry, constructs `createProgress(saved)` + `createBrain({ seedAccuracy: saved.accuracy, seedHistory: saved.history })`, mounts the HUD (Wave 3), awards `progress.addXp(table)` on clear, and persists via `writeSave(progress.serialize(brain.snapshot()))` on both clear and `onHide`. Run/session state is never serialized; fire-once goal latch, single goal handler, and player-freeze are preserved.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend createBrain({ seedAccuracy, seedHistory }) + snapshot()** - `cf7b6f8` (feat)
2. **Task 2: Carry cleared table through onClear({ table })** - `24caa30` (feat)
3. **Task 3: Scene wiring — load/seed/award/persist on clear + onHide** - `6bfd257` (feat)

_Note: Task 1 was `tdd="true"`; the project's test layer is the pre-existing headless smoke (`scripts/smoke-progress.mjs`), which was RED (`brain.snapshot is not a function`) before the change and GREEN after. No separate test commit — the test file already existed and exercises seedAccuracy/seedHistory/snapshot._

## Files Created/Modified
- `src/math/brain.js` - Factory signature now `createBrain({ seedAccuracy, seedHistory } = {})`; validated seed injection after the accuracy/history literals; `snapshot()` returns shallow copies; firewall header updated to document the seed/snapshot seam (no storage/engine import added).
- `src/ui/mathGate.js` - Correct-branch fires `onClear?.({ table: q.a })`; onClear JSDoc documents the `{ table }` payload. No XP awarded in the gate.
- `src/scenes/game.js` - Added `createProgress/loadSave/writeSave` and `mountHud` imports; replaced bare `createBrain()` with `loadSave()` → `createProgress(saved)` → seeded `createBrain(...)` → `mountHud(progress)` + `hud.refresh()`; extended `onClear({ table })` to award XP, refresh/flash HUD, and `writeSave`; added `onHide(() => writeSave(...))`.

## Decisions Made
- **seedHistory is LOCKED, not optional** (per coordinator revision): CONTEXT persists "accuracy/history" and SAVE-03 resumes adaptation, which includes `isMastered()` drill-reduction. Seeding only accuracy would silently lose mastery resume across reloads.
- **Seed validation copies explicit per-key, range-checked values** (mirrors archive `fromJSON` 726-743) — never `Object.assign`/spread of the untrusted blob (T-01-01 prototype-pollution mitigation), consistent with `src/progress.js` `validate()`.
- **`snapshot()` returns shallow copies** (spread for accuracy, per-table `.slice()` for history) so a caller mutating the returned blob cannot corrupt the brain's internal state — keeps the export strictly one-way.
- **Persist on event, not on a timer**: save fires only on the correct-clear event and on `onHide` (KAPLAY's visibilitychange wrapper). `onHide` captures EWMA accuracy drift from wrong attempts before the tab closes, which the clear-only save would miss (SAFE-01: no timer autosave).

## Deviations from Plan

None - plan executed exactly as written. The only adjustments were two comment-wording fixes to satisfy the negative firewall greps (the source comments must not contain the banned literal tokens the greps match on):

- In `src/math/brain.js`, the new header comment originally used the literal token for the browser storage API in prose, tripping `! grep -qE 'localStorage|...'`. Reworded to "browser storage / save API / store" while preserving meaning.
- In `src/scenes/game.js`, the onHide comment originally named the timer API in prose, tripping `! grep -qE 'setInterval'`. Reworded to "timer-based autosave".

Both are the project's established discipline (banned tokens appear only inside the grep patterns, never in matched source) — not behavioral changes.

## Issues Encountered
None — all three task verifications and the headless smoke pass.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **Plan 03 (HUD) is the remaining wave.** `src/scenes/game.js` already imports `mountHud` from `../ui/hud.js` and calls `hud.refresh()` / `hud.flashLevelUp()`; that import resolves at runtime once Wave 3 creates `src/ui/hud.js` (`node --check` does not resolve imports, so game.js passes now). The HUD contract this plan expects: `mountHud(progress)` returning `{ refresh(), flashLevelUp() }`, rendered `fixed()` (camera-immune), read-only on progress.
- **`scripts/check-progress.sh` currently FAILs on the missing `src/ui/hud.js`** — this is expected and turns fully green once Wave 3 adds the HUD module. The brain/progress/scene structural assertions it runs before that point all pass.
- The SAVE-03 statistical weak-spot-resume + history mastery round-trip are verified by the headless smoke (`scripts/smoke-progress.mjs: PASS`); manual UAT (weak tables keep appearing more often after reload) is deferred to the phase gate.

## Self-Check: PASSED

- Modified files exist: `src/math/brain.js`, `src/ui/mathGate.js`, `src/scenes/game.js`, `11-02-SUMMARY.md` — all FOUND.
- Task commits exist: `cf7b6f8`, `24caa30`, `6bfd257` — all FOUND in git history.
- `node --check` passes on all 3 source files; `node scripts/smoke-progress.mjs` → PASS (brain snapshot/seed/history round-trip + seedAccuracy adaptation).

---
*Phase: 11-progression-persistence*
*Completed: 2026-06-26*
