---
phase: 29-mechanic-cleanup
plan: 01
subsystem: game-mechanics
tags: [kaplay, level-design, math-mechanics, cleanup]

# Dependency graph
requires:
  - phase: 28-full-verification-interactive-sign-off
    provides: v5.0 shipped 8-level game with the collect-the-answer mechanic (backlog 999.1) already flagged as a weak, never-landed mechanic
provides:
  - collect-the-answer mechanic fully removed from src/mechanics/, CONFIG, all 5 affected level descriptors, and every harness fixture that defended it
  - confirmed math-pacing rebalance: levels 01/03/04/06/08 retain 5/4/6/3/4 door+mathGate+enemy encounters plus the end gate, zero backfill mechanics added
affects: [30-harness-extensions, 34-level-quality-pass]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/config.js
    - src/levels/build.js
    - src/scenes/game.js
    - src/levels/level-01.js
    - src/levels/level-03.js
    - src/levels/level-04.js
    - src/levels/level-06.js
    - src/levels/level-08.js
    - scripts/check-gate.sh
    - scripts/smoke-progress.mjs
    - scripts/lib/reachability.mjs
    - scripts/lib/over-hole-check.mjs
    - scripts/lib/mechanic-drive.mjs
    - scripts/check-import-safety.sh

key-decisions:
  - "Single atomic commit spanning collect.js deletion, CONFIG.COLLECT removal, all 5 affected level descriptors, and every defending harness fixture — matches MECH-01's explicit atomic-removal wording, no staged/partial commits."
  - "Level-02/05/07's already-empty collectZones:[]/answerPickupSlots:[] arrays left untouched (per CONTEXT.md, unnecessary churn), including the level-02 golden fixture in smoke-progress.mjs."
  - "mechanic-drive.mjs's resolveIfBoxed/driveToXClimbing/driveToXPlanned left untouched — none hardcode collect-specific behavior; only the deriveEncounters collectZones mapping was removed."

requirements-completed: [MECH-01, MECH-02]

coverage:
  - id: D1
    description: "Collect-the-answer mechanic removed atomically: src/mechanics/collect.js deleted, CONFIG.COLLECT block gone, build.js's two collect builder loops gone, game.js's wireCollect import/call gone, collectZones/answerPickupSlots removed from level-01/03/04/06/08 geometry"
    requirement: "MECH-01"
    verification:
      - kind: automated_ui
        ref: "node scripts/browser-boot.mjs (title -> select -> all 8 levels load with no runtime errors)"
        status: pass
      - kind: automated_ui
        ref: "node scripts/audit-phase21-mechanics.mjs (31 remaining door/mathGate/enemy encounters across 8 levels, all triggered:true/resolved:true; zero answer-zone encounters attempted)"
        status: pass
      - kind: unit
        ref: "bash scripts/check-gate.sh (assertion #13 collect thin-caller check removed, 12 remaining assertions pass)"
        status: pass
      - kind: unit
        ref: "bash scripts/check-import-safety.sh (collect.js removed from both file lists, remaining modules pass)"
        status: pass
      - kind: unit
        ref: "bash scripts/check-progress.sh (smoke-progress.mjs golden-geometry fixtures updated, all pass)"
        status: pass
      - kind: unit
        ref: "node scripts/validate-levels.mjs (all 8 levels: zero HARD-FAIL, pre-existing WARN rows unchanged)"
        status: pass
    human_judgment: false
  - id: D2
    description: "MECH-02 math-pacing verification: levels 01/03/04/06/08 retain 5/4/6/3/4 door+mathGate+enemy encounters plus the end gate after collect removal; zero new mechanic instances added; door/gates/enemy mechanics award zero direct XP so removal cannot change earnable XP"
    requirement: "MECH-02"
    verification:
      - kind: automated_ui
        ref: "node scripts/audit-phase21-mechanics.mjs output (level-01: 5 rows [4 math-gate/door + 1 enemy], level-03: 4 rows, level-04: 6 rows, level-06: 3 rows, level-08: 4 rows — all triggered/resolved)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-09
status: complete
---

# Phase 29 Plan 01: Collect-the-Answer Removal Summary

**Atomically deleted the collect-the-answer math mechanic (code, config, level data, and 6 harness fixtures) across a single commit, confirming the 5 affected levels keep their full door/checkpoint-gate/enemy math rhythm with zero XP-economy impact.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-09T20:18:00Z
- **Completed:** 2026-07-09T20:28:32Z
- **Tasks:** 1
- **Files modified:** 15 (14 modified, 1 deleted)

## Accomplishments
- Deleted `src/mechanics/collect.js` and the `CONFIG.COLLECT` block entirely
- Removed the two collect-zone/pickup-slot builder loops from `src/levels/build.js`
- Removed `wireCollect` import/call and reworded the mechanic-wiring comment in `src/scenes/game.js`
- Stripped `collectZones`/`answerPickupSlots` from level-01/03/04/06/08's geometry objects (level-02/05/07 deliberately untouched — already collect-free)
- Updated all 6 defending harness fixtures: `check-gate.sh` assertion #13, 3 `smoke-progress.mjs` golden-geometry fixtures, `reachability.mjs`/`over-hole-check.mjs`'s `BARRIER_WIDTH` maps and kind-lists, `mechanic-drive.mjs`'s `deriveEncounters` collect mapping, `check-import-safety.sh`'s two file lists
- Confirmed MECH-02 verification note: levels 01/03/04/06/08 retain 5/4/6/3/4 mid-level encounters (door+mathGate+enemy) respectively plus the end gate — matches the plan's predicted counts exactly, zero backfill mechanics added
- Confirmed zero-direct-XP finding: door/checkpoint-gate/enemy mechanics award no XP; only `game.js`'s `onReachGoal` → `progress.addXp(table)` awards XP once per level clear, so removing collect cannot change any level's earnable XP

## Task Commits

Each task was committed atomically:

1. **Task 1: Atomically remove the collect-the-answer mechanic everywhere** - `47b1912` (feat)

**Plan metadata:** (this commit — SUMMARY.md)

## Files Created/Modified
- `src/mechanics/collect.js` - deleted (whole file)
- `src/config.js` - `CONFIG.COLLECT` block removed
- `src/levels/build.js` - collect-zone + pickup-slot builder loops removed
- `src/scenes/game.js` - `wireCollect` import/call removed, wiring comment reworded
- `src/levels/level-01.js` - `collectZones`/`answerPickupSlots` keys removed
- `src/levels/level-03.js` - `collectZones`/`answerPickupSlots` keys removed
- `src/levels/level-04.js` - `collectZones`/`answerPickupSlots` keys removed
- `src/levels/level-06.js` - `collectZones`/`answerPickupSlots` keys removed
- `src/levels/level-08.js` - `collectZones`/`answerPickupSlots` keys removed
- `scripts/check-gate.sh` - assertion #13 (collect thin-caller check) removed
- `scripts/smoke-progress.mjs` - `collectZones`/`answerPickupSlots` removed from level-01/03/04 golden-geometry fixtures; stale line-number comment updated; level-02 fixture untouched
- `scripts/lib/reachability.mjs` - `collectZones` removed from `BARRIER_WIDTH` map, kind-list, and self-test comment
- `scripts/lib/over-hole-check.mjs` - `collectZones` removed from `BARRIER_WIDTH` map (and its CR-02 comment), kind-list, and header comments
- `scripts/lib/mechanic-drive.mjs` - `collectZones` mapping removed from `deriveEncounters()`
- `scripts/check-import-safety.sh` - `src/mechanics/collect.js` removed from both Section 0 and Section 2 file lists

## Decisions Made
- Single atomic commit for the entire removal (code + config + level data + all 6 harness fixtures) per MECH-01's explicit "updated atomically in one change" wording — no staged/partial commits, matching 29-CONTEXT.md's locked decision.
- Level-02/05/07's `collectZones: []`/`answerPickupSlots: []` arrays (already empty, never collect-bearing) left byte-identical, including the level-02 golden fixture in `smoke-progress.mjs` — this is deliberate and matches the plan's explicit instruction, even though it means `grep -c "collectZones" scripts/smoke-progress.mjs` returns 2 (level-02's legitimate empty-array fixture), not the literal 0 one acceptance-criteria bullet stated. See Deviations below.
- `mechanic-drive.mjs`'s `resolveIfBoxed`/`driveToXClimbing`/`driveToXPlanned` functions and their internal comments referencing "collect.js" left untouched per the plan's explicit instruction — none of them hardcode collect-specific behavior; only the `deriveEncounters` collectZones mapping was removed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Doc consistency] Updated a stale line-number comment in smoke-progress.mjs**
- **Found during:** Task 1 (editing the level-01 golden-geometry fixture)
- **Issue:** A comment above the level-01 fixture cited line ranges in `src/levels/level-01.js` for `collectZones`/`answerPickupSlots` (lines 138-140/143-148) that no longer exist after the removal — leaving it would mislead future readers of the fixture provenance comment.
- **Fix:** Reworded the comment to note the Phase 29/MECH-01 removal instead of citing now-stale line numbers.
- **Files modified:** scripts/smoke-progress.mjs
- **Verification:** `bash scripts/check-progress.sh` passes (smoke-progress.mjs itself unaffected by comment text).
- **Committed in:** 47b1912 (Task 1 commit)

**2. [Plan-text clarification] Acceptance-criteria bullet vs. explicit action-item instruction for smoke-progress.mjs**
- **Found during:** Task 1 (running acceptance-criteria grep checks)
- **Issue:** The plan's acceptance-criteria bullet list states `grep -c "collectZones\|answerPickupSlots" scripts/smoke-progress.mjs` should return 0, but the plan's own detailed action item 7 explicitly says "Do NOT touch the level-02 golden fixture (it already omits neither key — it legitimately keeps `collectZones: []`/`answerPickupSlots: []`...)" — these two instructions are in direct tension, since level-02's fixture retaining those 2 lines means the grep count is 2, not 0.
- **Resolution:** Followed the more specific, detailed action-item instruction (item 7) and 29-CONTEXT.md's explicit decision ("Leave `scripts/fixtures/bad-level.js`'s `collectZones: []` untouched... unnecessary churn" — same rationale applies to level-02's smoke-progress fixture), which is unambiguous about preserving level-02's legitimate empty-array fixture. The level-01/03/04 fixtures (the ones that actually carried real collect data) were fully scrubbed as required.
- **Files affected:** scripts/smoke-progress.mjs (no additional change beyond what was already made)
- **Verification:** `bash scripts/check-progress.sh` passes; level-02's real descriptor (`src/levels/level-02.js`) still carries `collectZones: []`/`answerPickupSlots: []`, so the fixture's deep-equal check against it is correct and would FAIL if the fixture's arrays were removed.
- **Committed in:** 47b1912 (Task 1 commit) — no separate fix commit needed, this is a documentation/interpretation note, not a code change.

---

**Total deviations:** 2 (1 minor doc-consistency auto-fix, 1 plan-text clarification note — no scope creep, no architectural changes)
**Impact on plan:** Zero functional impact. Both deviations are documentation/interpretation matters resolved in favor of the plan's own more-detailed, more-specific instructions and the phase CONTEXT.md's locked decisions.

## Issues Encountered
None — the full 7-command verification suite (check-gate.sh, check-safety.sh, check-import-safety.sh, check-progress.sh, validate-levels.mjs, browser-boot.mjs, audit-phase21-mechanics.mjs) passed green on the first run after the atomic edit, with all 31 remaining door/mathGate/enemy encounters across all 8 levels triggering and resolving correctly (zero answer-zone encounters attempted, confirming the mechanic is fully gone from runtime behavior).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MECH-01/MECH-02 fully satisfied; the collect mechanic and all its supporting code/data/harness coverage are gone with zero regressions on the remaining door/checkpoint-gate/enemy mechanics.
- Phase 29 Plan 02 (alcove discovery feedback + level-select secret marker, MECH-03/MECH-06) is unblocked and can proceed independently — this plan touched no alcove/select-screen code.
- Phase 30 (Harness Extensions) can now safely add alcove/mover coverage to the same harness modules touched here without any collect-related dead code in the way.
- Phase 34 (Level Quality Pass) inherits levels 01/03/04/06/08 with their collect data cleanly removed and no dead stretches — confirmed via direct position inspection in 29-CONTEXT.md, no further geometry fix needed from this removal.

## Self-Check: PASSED

- FOUND (deleted as expected): `src/mechanics/collect.js`
- FOUND: `.planning/phases/29-mechanic-cleanup/29-01-SUMMARY.md`
- FOUND: commit `47b1912` (feat: atomic collect removal)
- FOUND: commit `99f9343` (docs: SUMMARY.md)

---
*Phase: 29-mechanic-cleanup*
*Completed: 2026-07-09*
