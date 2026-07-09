---
phase: 25-levels-5-8-difficulty-ramp-select-grid
plan: 06
subsystem: testing
tags: [node-smoke-test, regression-suite, deep-equal, progress, level-registry]

# Dependency graph
requires:
  - phase: 25-03
    provides: LEVEL_ORDER registry append to 8 entries (level-05..08) and isUnlocked's single-predecessor-chain unlock logic generalized to 8 levels
  - phase: 25-04
    provides: real secretAlcove geometry retrofitted into level-01..04's descriptors (additive, LVL-06)
provides:
  - scripts/smoke-progress.mjs's 4 expectedGeometry blocks (level-01..04) re-baselined to include each level's real secretAlcove entry
  - LEVEL_ORDER.length regression assertion bumped from 4 to 8
  - permanent pre-v5.0-save-resume regression assertion (LVL-04): a save that only ever knew levels 1-4 (all cleared) unlocks level-05 and keeps level-06 locked against the 8-level registry with zero migration code
  - permanent addBonusXp/CONFIG.PROGRESS.XP_ALCOVE regression pin (LVL-06), promoting Plan 25-01's throwaway verify command into a lasting assertion
affects: [28-full-verification-interactive-sign-off]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Node-only regression smoke (scripts/smoke-progress.mjs) is the permanent test layer for pure/engine-agnostic modules — no framework, imports the real src/ modules directly"

key-files:
  created: []
  modified:
    - scripts/smoke-progress.mjs

key-decisions:
  - "secretAlcove key inserted immediately after answerPickupSlots in each expectedGeometry literal, matching the real level files' own key order (deepEqual's key-count check is order-agnostic, but this keeps the test file readable)"
  - "New addBonusXp/XP_ALCOVE assertion placed near the existing SAVE-01 XP/threshold blocks (immediately after the level-up carry-over block), per the plan's placement guidance"
  - "New pre-v5.0-save-resume assertion placed immediately after the existing SAVE-06 derived-unlock block, mirroring its pattern"

patterns-established: []

requirements-completed: [LVL-02, LVL-04, LVL-06]

coverage:
  - id: D1
    description: "4 expectedGeometry blocks (levels 1-4) each pin their level's real secretAlcove entry, byte-matched against src/levels/level-0N.js"
    requirement: "LVL-02"
    verification:
      - kind: unit
        ref: "node scripts/smoke-progress.mjs (LVL-02 regression checks, levels 1-4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "LEVEL_ORDER.length assertion bumped from 4 to 8, matching the 8-level registry"
    requirement: "LVL-04"
    verification:
      - kind: unit
        ref: "node scripts/smoke-progress.mjs (LVL-01/04 registry-length check)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Permanent pre-v5.0-save-resume assertion: a save with only levels 1-4 cleared unlocks level-05 and keeps level-06 locked, proving isUnlocked needs zero migration code for the new 8-level roster"
    requirement: "LVL-04"
    verification:
      - kind: unit
        ref: "node scripts/smoke-progress.mjs (LVL-04 pre-v5.0-save-resume block)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Permanent addBonusXp(CONFIG.PROGRESS.XP_ALCOVE) regression pin: flat +5 XP, no level-up at level 1"
    requirement: "LVL-06"
    verification:
      - kind: unit
        ref: "node scripts/smoke-progress.mjs (LVL-06 addBonusXp/XP_ALCOVE block)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-07-06
status: complete
---

# Phase 25 Plan 06: Smoke-Progress Regression Re-Baseline Summary

**Re-baselined `scripts/smoke-progress.mjs`'s 4 byte-pinned expectedGeometry blocks with each level's real secretAlcove entry, bumped LEVEL_ORDER.length to 8, and added two new permanent regression assertions (pre-v5.0-save-resume unlock semantics, addBonusXp/XP_ALCOVE) — closing the regression gap Plan 25-04 deliberately left open.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-06T21:14:16Z
- **Completed:** 2026-07-06T21:17:34Z
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- All 4 `expectedGeometry` blocks (level-01 through level-04) now include a `secretAlcove: [{ x, y }]` key byte-matched against the real `src/levels/level-0N.js` geometry Plan 25-04 authored, closing the `deepEqual` strict key-count mismatch
- `LEVEL_ORDER.length === 4` assertion bumped to `=== 8`, matching Plan 25-03's registry append (LEVEL_ORDER already had 8 entries; only the test file's pinned expectation was stale)
- New permanent regression assertion proves a pre-v5.0 save (only levels 1-4 known, all cleared) resumes correctly against the 8-level registry: `isUnlocked("level-05", ...) === true`, `isUnlocked("level-06", ...) === false` — zero migration code required
- New permanent regression assertion pins `createProgress().addBonusXp(CONFIG.PROGRESS.XP_ALCOVE)`: `getXp() === 5`, no level-up (`false`) — promoting Plan 25-01's throwaway verify command into a lasting test
- `node scripts/smoke-progress.mjs` and `bash scripts/check-progress.sh` both print PASS again — the automated regression suite is fully green

## Task Commits

Each task was committed atomically:

1. **Task 1: Update the 4 expectedGeometry blocks with secretAlcove + bump LEVEL_ORDER.length to 8** - `527718d` (test)
2. **Task 2: Pre-v5.0-save-resume assertion + addBonusXp/XP_ALCOVE permanent regression pin** - `920b6a7` (test)

**Plan metadata:** (recorded after this summary is committed)

_Note: Task 2 was tagged `tdd="true"` in the plan, but its `<behavior>` was already fully implemented by prior plans (25-01's `addBonusXp`, 25-03's 8-level registry + `isUnlocked`) — this task's job was to promote already-correct, already-verified behavior into permanent test-file assertions, not to drive new implementation. No production code changed; both new assertion blocks passed immediately upon addition. See "TDD Gate Compliance" below._

## Files Created/Modified
- `scripts/smoke-progress.mjs` - 4 expectedGeometry blocks gained `secretAlcove` entries; `LEVEL_ORDER.length` assertion bumped 4→8; 2 new permanent assertion blocks added (pre-v5.0-save-resume unlock semantics, addBonusXp/XP_ALCOVE regression pin)

## Decisions Made
- `secretAlcove` key placed immediately after `answerPickupSlots` in each `expectedGeometry` literal, mirroring the real level files' own key order (readability only — `deepEqual`'s key-count check is order-agnostic)
- New `addBonusXp`/`XP_ALCOVE` assertion placed immediately after the existing SAVE-01 level-up carry-over block (per the plan's "near the existing SAVE-01 XP/threshold blocks" placement guidance)
- New pre-v5.0-save-resume assertion placed immediately after the existing SAVE-06 derived-unlock block, mirroring its guard/structure pattern

## TDD Gate Compliance

Task 2 carried `tdd="true"`, but its behavior (`isUnlocked` across the 8-level registry, `addBonusXp`) was already implemented and correct from prior plans (25-01, 25-03). Both new assertion blocks passed on first run with zero production-code changes — there was no RED phase to observe because the plan's own purpose statement was explicit: this is a regression *pin* for already-implemented behavior, not new-feature TDD. This matches the plan's stated intent ("PERMANENT regression-suite assertion (not just Plan 25-01's throwaway verify command)") and is not a fail-fast violation — the fail-fast rule guards against tests passing unexpectedly *before any implementation exists*; here the implementation was deliberately built in earlier, already-summarized plans.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The automated regression suite (`node scripts/smoke-progress.mjs`, `bash scripts/check-progress.sh`) is fully green again, unblocking Plan 25-07 and Phase 26+ from inheriting a known-red gate
- Full 8-level interactive/structural closure (VALID-03) remains explicitly scoped to Phase 28, per prior decisions — this plan touches only the node-side pure-module smoke test, no browser/interactive coverage
- No blockers identified for the remainder of Phase 25

---
*Phase: 25-levels-5-8-difficulty-ramp-select-grid*
*Completed: 2026-07-06*

## Self-Check: PASSED
