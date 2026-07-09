---
phase: 24-fix-lengthen-levels-1-4
plan: 04
subsystem: levels
tags: [level-descriptor, reachability, jump-envelope, kaplay, static-data]

# Dependency graph
requires:
  - phase: 23-level-validation-harness
    provides: scripts/validate-levels.mjs, scripts/lib/reachability.mjs, scripts/lib/jump-envelope.mjs (calibrated maxRise=88.331), scripts/lib/over-hole-check.mjs
provides:
  - level-04's over-hole mathGate (x:1800) repositioned to x:1728, off the over-hole gap 1760..1960 (VALID-04)
  - level-04's 6 known-unreachable platforms (x:1080,1400,1760,2140,2520,3240) lowered into the calibrated jump envelope and BFS-proven reachable from spawn (VALID-04)
  - level-04 extended 55% (goal x:3920 -> x:6120, bounds.right 4000 -> 6200) with 3 new floors, 3 bridging platforms, 7 coins, 2 spikes, 1 door, 1 mathGate, 4 checkpoints appended strictly after x:4000 (LVL-01)
affects: [24-05 (smoke-progress.mjs re-baseline for level-04), 24-06 (final requirements closure), 28-full-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wide-window platform fix: for platforms whose shared/adjacent span with a neighboring floor is 80-128px wide, a uniform 70px rise target (well under the calibrated 88.331px maxRise) produces a comfortable marginRatio without needing per-platform tuning, unlike level-03's narrower 40px-overlap-window platforms which required a tighter 60px target"

key-files:
  created: []
  modified:
    - src/levels/level-04.js

key-decisions:
  - "All 6 fixed platforms lowered uniformly to y:250 (rise 70px) rather than individually tuned values — 24-RESEARCH.md's physics analysis showed all 6 have wide (80-128px) touching/contained span windows that tolerate this rise with comfortable margin, unlike level-03's narrow-window platforms"
  - "New bridging platforms (x:4000, x:4720, x:5520) also use rise 70px for consistency with the fixed-platform convention in the same file"
  - "goal.x moved to 6120 (80px buffer past the new floor-9 end at 6200), matching the original level's own 80px goal-to-floor-end convention"
  - "The over-hole mathGate's fix (x:1800->1728) resolved the cascading gap-width/spawn-goal/enemy-reachability HARD-FAILs 23-FINDINGS.md traced to that node — confirmed by the before/after validator diff (5 named HARD-FAIL rows -> 0)"

patterns-established: []

requirements-completed: []  # VALID-04/LVL-01 fully validated for level-04 only; project-wide completion held per phase note until Plan 24-06

coverage:
  - id: D1
    description: "level-04's over-hole mathGate (x:1800) repositioned to x:1728, and all 6 known-unreachable platforms (x:1080,1400,1760,2140,2520,3240) lowered into the calibrated jump envelope and proven BFS-reachable from spawn"
    requirement: "VALID-04"
    verification:
      - kind: unit
        ref: "node --input-type=module -e (direct reachability.mjs buildNodes/buildGraph/bfsReachableSet query against getLevel('level-04').geometry) -> [[1080,true],[1400,true],[1760,true],[2140,true],[2520,true],[3240,true]]"
        status: pass
      - kind: other
        ref: "node scripts/validate-levels.mjs -- zero level-04 HARD-FAIL rows (down from 5 named: over-hole x1800, spawn-goal, gap-width 1760..1960, mechanic-reachability x1800, mechanic-reachability enemy x2400)"
        status: pass
    human_judgment: false
  - id: D2
    description: "level-04 extended 55% past its v4.1 goal (x:3920 -> x:6120) with new floors/platforms/coins/hazards/mechanics/checkpoints appended strictly after x:4000, bounds.right bumped 4000 -> 6200"
    requirement: "LVL-01"
    verification:
      - kind: other
        ref: "node scripts/validate-levels.mjs -- zero level-04 HARD-FAIL rows (PASS/WARN only), new door x:5000 and new mathGate x:5760 both reachable"
        status: pass
      - kind: unit
        ref: "getLevel('level-04').geometry counts: floors=9, platforms=12, coins=19, spikes=9, doors=2, mathGates=3, checkpoints=16, enemies=1 (unchanged), collectZones=1 (unchanged), goal.x=6120, bounds.right=6200"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-07-06
status: complete
---

# Phase 24 Plan 04: Fix & Extend Level-04 Summary

**Repositioned level-04's over-hole mathGate (x:1800->1728) and lowered its 6 unreachable platforms into the calibrated jump envelope (VALID-04), then extended the level 55% past its v4.1 length with 3 new floors, 3 bridging platforms, 7 coins, 2 spikes, 1 door, 1 mathGate, and 4 checkpoints appended strictly after the existing kid-validated geometry (LVL-01).**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-06T02:31:15Z (prior plan's metadata commit)
- **Completed:** 2026-07-06T02:36:38Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Fixed level-04's over-hole mathGate (x:1800 -> x:1728), moving its footprint off the 1760..1960 gap and fully inside floor-2's 1240..1760 span, still ahead of the enemy at x:2400
- Fixed all 6 confirmed-unreachable platforms (x:1080,1400,1760,2140,2520,3240), each lowered to y:250 (rise reduced from 104-144px down to a uniform 70px), proven BFS-reachable from spawn via a direct `scripts/lib/reachability.mjs` query — this specifically resolved the cascading gap-width (1760..1960) / spawn-goal / enemy-reachability HARD-FAILs `23-FINDINGS.md` traced to platform x:1760's excessive rise
- Extended level-04 from goal x:3920 to x:6120 (+2200px, 55% longer than the v4.1 4000px extent), appending 3 new floor runs, 3 bridging platforms, 7 coins, 2 spikes, 1 door, 1 mathGate, and 4 checkpoints strictly after x:4000
- Bumped `bounds.right` from 4000 to 6200 (level-04's explicit `bounds` field is used AS-IS by `src/scenes/game.js`, unlike level-01's dynamically-derived camera clamp)
- `node scripts/validate-levels.mjs` shows zero level-04 HARD-FAIL rows both after the fix pass and after the extension pass — down from the pre-plan 5 named HARD-FAIL rows (over-hole x1800, spawn-goal, gap-width 1760..1960, mechanic-reachability x1800, mechanic-reachability enemy x2400)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix level-04's over-hole mathGate and 6 unreachable platforms, and append the new geometry skeleton** - `ca8b457` (fix)
2. **Task 2: Add level-04's extension coins, hazards, mechanics, and checkpoints** - `9b3d668` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `src/levels/level-04.js` - mathGate repositioned (VALID-04); 6 platforms lowered into reach (VALID-04); 3 new floors, 3 new bridging platforms, 7 new coins, 2 new spikes, 1 new door, 1 new mathGate, 4 new checkpoints appended after x:4000; goal moved to x:6120; bounds.right bumped to 6200 (LVL-01)

## Decisions Made
- Used a uniform 70px rise target for all 6 fixed platforms (not individually tuned per platform) since 24-RESEARCH.md's physics computation showed all 6 have wide (80-128px) span windows, unlike level-03's narrower 40px-overlap-window platforms which needed a more conservative 60px target
- New bridging platforms (x:4000, x:4720, x:5520) also used 70px rise, consistent with the fixed-platform convention already established in this same file
- Checkpoints clustered with an 80px lead before each new hazard/mechanic, mirroring level-04's own densest-of-all-4-levels clustering style

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and automated verify commands passed on the first attempt with no iteration needed on the y-values (the plan's target rise/y recommendations proved directly correct).

## Issues Encountered

None. `node scripts/smoke-progress.mjs` fails on all 4 levels' geometry-pinning blocks (level-01/02/03 already extended in prior plans, level-04 now extended in this plan) as explicitly expected and documented in the plan's `<verification>` section — this is scheduled for re-baseline in Plan 24-05 (Wave 2), not this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- level-04 is structurally sound (zero HARD-FAILs) and 55% longer, ready for Plan 24-05's smoke-progress.mjs re-baseline and the interactive audit re-run
- This was the last Wave-1 plan (levels 1-4 all now fixed and extended). VALID-04/LVL-01 are NOT marked complete project-wide — per this plan's instructions they stay pending until Plan 24-05 (smoke re-baseline) and Plan 24-06 (interactive audit / final closure) run
- No blockers for subsequent plans in this phase

## Self-Check: PASSED

All claimed files and commits verified present:
- `src/levels/level-04.js` - FOUND
- `.planning/phases/24-fix-lengthen-levels-1-4/24-04-SUMMARY.md` - FOUND
- `ca8b457` - FOUND
- `9b3d668` - FOUND
