---
phase: 25-levels-5-8-difficulty-ramp-select-grid
plan: 02
subsystem: testing
tags: [playwright, audit-tooling, select-screen-navigation]

# Dependency graph
requires:
  - phase: 23-level-validation-harness
    provides: audit-retry.mjs retry wrapper and mechanic-drive.mjs's proven driver, both left untouched by this plan
provides:
  - browser-boot.mjs's select-nav loop computes row/col instead of a flat ArrowRight-times-i loop
  - audit-phase21-mechanics.mjs's select-nav loop fixed independently at both call sites (main loop + reloadLevel)
affects: [25-03-levels-5-8-registry, 25-05-select-grid, 25-07-final-8-level-audit-proof, 28-full-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Duplicated Playwright navigation code fixed by hand independently at each call site, not extracted to a shared helper (project convention per STATE.md)"

key-files:
  created: []
  modified:
    - scripts/browser-boot.mjs
    - scripts/audit-phase21-mechanics.mjs

key-decisions:
  - "Applied the row/col fix identically at all 3 call sites (browser-boot.mjs's 1 occurrence, audit-phase21-mechanics.mjs's 2 occurrences) rather than extracting a shared helper, per the project's documented duplicated-Playwright-code convention"
  - "Left scripts/lib/audit-retry.mjs and scripts/lib/mechanic-drive.mjs untouched -- full retry-hardened 8-level closure sign-off is scoped to Phase 28 (VALID-03), not this plan"

patterns-established:
  - "Select-nav row/col computation: row = Math.floor(i / 4), col = i % 4, then ArrowDown x row followed by ArrowRight x col, assuming the select screen's fixed 4-column layout"

requirements-completed: [LVL-04, LVL-05]

coverage:
  - id: D1
    description: "browser-boot.mjs's select-nav loop computes row/col (4-column grid) instead of a flat ArrowRight-times-i loop; levels 1-4 (row=0) drive identically to before"
    requirement: "LVL-04"
    verification:
      - kind: other
        ref: "node --check scripts/browser-boot.mjs; grep -c 'Math.floor(i / 4)' scripts/browser-boot.mjs; grep -c 'i % 4' scripts/browser-boot.mjs; grep -c 'ArrowDown' scripts/browser-boot.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "audit-phase21-mechanics.mjs's select-nav loop fixed independently at both call sites (main per-level loop and the reloadLevel retry callback), each computing row/col; audit-retry.mjs and mechanic-drive.mjs left byte-identical"
    requirement: "LVL-05"
    verification:
      - kind: other
        ref: "node --check scripts/audit-phase21-mechanics.mjs; grep -c 'Math.floor(i / 4)' (>=2); grep -c 'ArrowDown' (>=2); git diff --stat scripts/lib/audit-retry.mjs scripts/lib/mechanic-drive.mjs (empty)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-06
status: complete
---

# Phase 25 Plan 02: Fix Playwright audit scripts' select-nav loops for row/col grid Summary

**Both `browser-boot.mjs` and `audit-phase21-mechanics.mjs` now navigate the select screen with a row/col-aware loop (`ArrowDown` x row, then `ArrowRight` x col, assuming 4 columns) instead of a flat `ArrowRight`-times-i loop that would silently never leave row 1 once the select grid grows past 4 tiles.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-06T20:51:00Z
- **Completed:** 2026-07-06T20:51:50Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- `scripts/browser-boot.mjs`'s per-level select-nav loop now computes `row = Math.floor(i / 4)` / `col = i % 4` and presses `ArrowDown` row times then `ArrowRight` col times
- `scripts/audit-phase21-mechanics.mjs`'s select-nav loop fixed independently at BOTH call sites -- the main per-level loop and the `reloadLevel` retry callback -- with the identical row/col math applied by hand in each copy
- Both scripts verified `node --check` clean and proven byte-identical for levels 1-4 (row=0 case: zero `ArrowDown` presses, `ArrowRight` count == i)
- `scripts/lib/audit-retry.mjs` and `scripts/lib/mechanic-drive.mjs` confirmed untouched (zero diff)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix browser-boot.mjs's select-nav loop to be row/col aware** - `b12a089` (fix)
2. **Task 2: Fix audit-phase21-mechanics.mjs's select-nav loop at both call sites (main loop + reloadLevel)** - `9897c22` (fix)

**Plan metadata:** (this commit)

## Files Created/Modified
- `scripts/browser-boot.mjs` - select-nav loop now computes row/col (4-column grid), presses ArrowDown row times then ArrowRight col times
- `scripts/audit-phase21-mechanics.mjs` - same row/col fix applied independently at 2 call sites: the main per-level loop and the `reloadLevel` retry callback

## Decisions Made
- Applied the fix by hand at all 3 call sites instead of extracting a shared navigation helper, per the project's documented convention (STATE.md) that duplicated Playwright code is fixed independently in each copy, not consolidated
- Scoped strictly to select-nav loops -- did not touch `audit-retry.mjs` or `mechanic-drive.mjs`; the full retry-hardened 8-level closure sign-off remains Phase 28's job (VALID-03) per 25-RESEARCH.md's Open Question 1 resolution

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both scripts can now navigate a row-wrapped 2x4 select grid once select.js grows to that layout (Plan 25-05) and the level registry grows to 8 levels (Plan 25-03)
- Full end-to-end proof against a real 2x4 grid + 8-level registry cannot happen until those plans land -- deferred to Plan 25-07 (Wave 4) per this plan's own verification note
- No blockers for downstream Phase 25 plans

---
*Phase: 25-levels-5-8-difficulty-ramp-select-grid*
*Completed: 2026-07-06*

## Self-Check: PASSED
- FOUND: scripts/browser-boot.mjs
- FOUND: scripts/audit-phase21-mechanics.mjs
- FOUND: b12a089 (Task 1 commit)
- FOUND: 9897c22 (Task 2 commit)
