---
phase: 25-levels-5-8-difficulty-ramp-select-grid
plan: 05
subsystem: ui
tags: [kaplay, select-screen, keyboard-nav, grid-layout]

# Dependency graph
requires:
  - phase: 25-01
    provides: CONFIG.js shared edit ordering only (no logical dependency; both plans touch src/config.js)
provides:
  - "CONFIG.SELECT.ROW_GAP: 16 constant for the level-select grid's vertical row spacing"
  - "select.js 4-column x N-row tile layout (col = i % 4, row = Math.floor(i / 4))"
  - "row-scoped Left/Right cursor wrap + new non-wrapping Up/Down row-jump cursor (moveCursorRow)"
affects: ["25-07 (interactive proof of the full 2x4 grid nav)", "25-02 (Playwright script row/col nav must agree with this layout)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Row/col derivation from a flat tile index (col = i % 4, row = Math.floor(i / 4)) generalizes cleanly to any level count"
    - "Cursor movement scoped to a filtered index-subset (same-row cursor indices) rather than the whole selectable array, to bound Left/Right wrap to one row"

key-files:
  created: []
  modified:
    - src/config.js
    - src/scenes/select.js

key-decisions:
  - "ROW_GAP:16 chosen well under the 36px derived ceiling (ROW_Y+TILE_H+ROW_GAP+TILE_H/2<=360), leaving headroom without changing any other SELECT constant"
  - "moveCursor's row-scoping filters selectable cursor-indices by matching row (Math.floor(selectable[ci]/4)) rather than reusing a separate flat-list wrap, keeping Left/Right from spilling into an adjacent row"
  - "moveCursorRow's nearest-column landing breaks ties by first-encountered minimal |col-currentCol| in ascending selectable order (not specified further by CONTEXT.md; deterministic and bounded to at most 4 candidates per row)"

patterns-established:
  - "Row-aware keyboard cursor split into two functions (moveCursor for in-row wrap, moveCursorRow for cross-row jump) sharing the same selectable[]/tiles[] model, no new state"

requirements-completed: [LVL-04]

coverage:
  - id: D1
    description: "CONFIG.SELECT.ROW_GAP added (16), all other SELECT constants (TILE_W/TILE_H/GAP/ROW_Y/START_X) unchanged, stale IN-03 OVERFLOW FLAG comment resolved"
    requirement: "LVL-04"
    verification:
      - kind: unit
        ref: "node -e import config.js assertion (ROW_GAP===16 && TILE_W===96 && TILE_H===96 && GAP===24 && ROW_Y===180 && START_X===120) + grep -q IN-03 OVERFLOW FLAG absence"
        status: pass
    human_judgment: false
  - id: D2
    description: "select.js tile layout renders a 4-column x N-row grid (col = t.i % 4, row = Math.floor(t.i / 4)) for tile box, number label, and state glyph"
    requirement: "LVL-04"
    verification:
      - kind: unit
        ref: "node --check src/scenes/select.js; grep -c 't.i % 4' and grep -c 'Math.floor(t.i / 4)' both return 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Left/Right (moveCursor) wraps within the current row's selectable subset only; Up/Down (new moveCursorRow) jumps rows without cross-edge wrap, landing on same-or-nearest selectable column"
    requirement: "LVL-04"
    verification:
      - kind: unit
        ref: "node --check src/scenes/select.js; grep -c 'onKeyPress(\"up\"' and grep -c 'onKeyPress(\"down\"' both return 1; bash scripts/check-import-safety.sh prints PASS"
        status: pass
    human_judgment: true
    rationale: "Only 1 level exists today (LEVEL_ORDER length 1 pre-Phase-25-03), so no interactive session can yet exercise a real 2-row grid or an actual row-jump / nearest-column landing case. The full interactive proof against all 8 levels' real 2x4 grid is explicitly Plan 25-07's job per this plan's own <verification> section."

# Metrics
duration: 5min
completed: 2026-07-06
status: complete
---

# Phase 25 Plan 05: Level-Select 2x4 Grid + Row-Aware Cursor Summary

**Level-select scaled from a single flat row to a 4-column x N-row grid via CONFIG.SELECT.ROW_GAP and index-derived col/row math, with the keyboard cursor rebuilt so Left/Right wraps within a row and new Up/Down jumps rows without cross-edge wrap.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-06T21:07Z (approx, per commit history)
- **Completed:** 2026-07-06T21:13Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- `CONFIG.SELECT.ROW_GAP: 16` added, with the derivation ceiling (`ROW_Y + TILE_H + ROW_GAP + TILE_H/2 <= 360` -> `ROW_GAP <= 36`) documented inline; all other `SELECT` constants (`TILE_W`, `TILE_H`, `GAP`, `ROW_Y`, `START_X`) left byte-identical.
- The stale "IN-03 OVERFLOW FLAG" comment (predicting exactly this need since Phase 14) replaced with a resolution note pointing at the new grid math and the future paging consideration beyond 8 levels.
- `select.js`'s tile layout (tile box, number label, state glyph) now derives `col = t.i % 4` / `row = Math.floor(t.i / 4)` instead of a flat single-row `x`, with row-Y offset by `row * (TILE_H + ROW_GAP)`.
- Keyboard cursor rebuilt: `moveCursor` (Left/Right) now wraps ONLY within the current row's subset of selectable tiles; a new `moveCursorRow` (Up/Down) jumps between rows without wrapping past the top/bottom edge, landing on the same column if selectable there, else the nearest selectable column in the target row.

## Task Commits

Each task was committed atomically:

1. **Task 1: CONFIG.SELECT.ROW_GAP + resolve the stale IN-03 comment** - `cc2c6a7` (feat)
2. **Task 2: select.js 2x4 grid layout + row-aware keyboard cursor** - `150674a` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/config.js` - Added `CONFIG.SELECT.ROW_GAP: 16`; resolved the stale IN-03 overflow-flag comment into a Phase-25-resolution note. No other SELECT constants changed.
- `src/scenes/select.js` - Tile layout now computes `col`/`row` from the tile index for a 4-column grid; `moveCursor` rescoped to wrap within the current row only; new `moveCursorRow` function added and wired to `onKeyPress("up"/"down")`.

## Decisions Made
- `ROW_GAP:16` chosen well under the 36px ceiling, matching 25-RESEARCH.md's Pitfall 5 derivation exactly as specified in the plan.
- Row-scoped Left/Right wrap implemented by filtering `selectable` cursor-indices to those sharing the current tile's row, rather than introducing a separate 2D array structure — keeps the existing `selectable`/`tiles` model unchanged per the plan's "layout + cursor-stride generalization only" scope.
- Nearest-column tie-breaking in `moveCursorRow` uses first-encountered minimal absolute column distance in ascending selectable order; CONTEXT.md does not specify a tie-break rule further, and this is deterministic and bounded (at most 4 candidates per row, per T-25-10's disposition).

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their `<action>` and `<acceptance_criteria>` blocks precisely; no auto-fixes, no architectural questions, no auth gates.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/config.js` and `src/scenes/select.js` are ready for Plan 25-03's 8-level registry to actually populate a full 2-row grid.
- The full interactive proof of Up/Down/Left/Right navigating a real 8-level, 2-row grid in a live browser remains Plan 25-07's job (Wave 4), once Plan 25-03 (8-level registry) and Plan 25-02 (Playwright nav-script row/col fix) have also landed — this plan's own `<verification>` section explicitly scopes that out.
- No blockers for downstream plans in this wave.

## Self-Check: PASSED

- FOUND: src/config.js
- FOUND: src/scenes/select.js
- FOUND: cc2c6a7
- FOUND: 150674a

---
*Phase: 25-levels-5-8-difficulty-ramp-select-grid*
*Completed: 2026-07-06*
