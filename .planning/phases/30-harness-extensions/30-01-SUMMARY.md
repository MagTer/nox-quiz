---
phase: 30-harness-extensions
plan: 01
subsystem: testing
tags: [reachability, level-validator, jump-envelope, red-first-fixture]

requires:
  - phase: 23-level-validation-harness
    provides: "canReach/jumpReach/buildNodes/bfsWithPathMargin/checkLevelReachability — the calibrated jump-envelope reachability graph this plan extends"
provides:
  - "bestMarginToPoint(point, nodes, spawnPaths, envelope) — shared zero-width-point reachability helper in scripts/lib/reachability.mjs"
  - "secret-alcove-reachability check wired into checkLevelReachability (MECH-04 static half)"
  - "mover-reachability check (worst-case-extreme rule) wired into checkLevelReachability (MOT-04)"
  - "scripts/fixtures/bad-level.js defect (c) — RED-first unreachable-alcove fixture"
  - "scripts/fixtures/bad-level-mover.js — new RED-first worst-case-extreme mover fixture"
affects: [34-level-quality-pass, 36-world-motion-and-ambient-life]

tech-stack:
  added: []
  patterns:
    - "Point-vs-jump-reach model (bestMarginToPoint) distinct from footprint-vs-footprint (canReach): reused for both alcove and mover-endpoint reachability, avoiding duplicated math"
    - "In-footprint hop vs. cross-height gap hop distinction inside bestMarginToPoint — a feasibility-only check for points above/within an already-reachable node's own span, vs. a precision reach-matching window for points beyond a node's far edge"

key-files:
  created:
    - scripts/fixtures/bad-level-mover.js
  modified:
    - scripts/lib/reachability.mjs
    - scripts/fixtures/bad-level.js

key-decisions:
  - "Relaxed the in-footprint-hop branch of bestMarginToPoint to a maxRise/maxFall feasibility gate (not exact reach-matching) after empirically proving the plan's literal window formula false-HARD-FAILs level-03/level-04's real, shipped alcoves"
  - "Marked only MOT-04 complete in REQUIREMENTS.md, not MECH-04 — MECH-04 explicitly requires both the validator (this plan) AND the interactive-audit dynamic half (30-02, a separate parallel plan not confirmed complete from this worktree); MOT-04's interactive-audit half is explicitly deferred to Phase 36 per 30-CONTEXT.md (no real movers exist to audit yet), so this plan alone fully satisfies MOT-04's Phase-30 scope"

requirements-completed: [MOT-04]  # MECH-04 intentionally NOT marked here — static half only; needs 30-02's dynamic half too (see key-decisions)

coverage:
  - id: D1
    description: "secret-alcove-reachability check catches an unreachable secretAlcove, independent of other defects, and passes cleanly on all 8 shipped levels"
    requirement: "MECH-04"
    verification:
      - kind: unit
        ref: "node scripts/lib/reachability.mjs (reachability-selftest, cases E-J)"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs (all 8 real levels, zero secret-alcove-reachability HARD-FAILs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "mover-reachability check applies the worst-case-extreme rule (worse of two ping-pong endpoints), catching a far-endpoint defect a best-case-only check would miss, and produces zero rows on all 8 real levels (none carry movers yet)"
    requirement: "MOT-04"
    verification:
      - kind: unit
        ref: "node scripts/lib/reachability.mjs (reachability-selftest, cases K-M)"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level-mover.js (exactly one HARD-FAIL)"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs (all 8 real levels, zero mover-reachability rows)"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-07-10
status: complete
---

# Phase 30 Plan 01: Alcove & Mover Reachability Summary

**`scripts/lib/reachability.mjs` gains a shared `bestMarginToPoint` helper powering two new RED-first-proven checks — secret-alcove-reachability and mover-reachability (worst-case-extreme) — both clean across all 8 shipped levels.**

## Performance

- **Duration:** ~27 min
- **Started:** 2026-07-10T07:31:41Z
- **Completed:** 2026-07-10T07:58:25Z
- **Tasks:** 2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `bestMarginToPoint(point, nodes, spawnPaths, envelope)` — a new module-private helper in `scripts/lib/reachability.mjs` that tests reachability of a floating, zero-width point (not a footprint) from every node already known reachable from spawn, reusing `jumpReach` unmodified for candidate generation (never `canReach`, whose overlapping-span formula pins `spanMax` to 0 for a zero-width target).
- `secret-alcove-reachability` check wired into `checkLevelReachability` (MECH-04 static half): HARD-FAIL for an unreachable `secretAlcove` entry, PASS/WARN otherwise. Proven RED-first via `bad-level.js` defect (c), and proven clean (zero HARD-FAIL) against all 8 real levels' shipped alcoves.
- `mover-reachability` check wired into `checkLevelReachability` (MOT-04): evaluates both ping-pong endpoints via `bestMarginToPoint` and reports the WORSE of the two (worst-case-extreme rule), HARD-FAILing if either endpoint is flatly unreachable. Proven RED-first via a new dedicated fixture (`bad-level-mover.js`) whose near endpoint is trivially reachable but far endpoint exceeds maxRise — demonstrating the worst-case rule catches what a best-case-only check would miss. `geometry.movers` is `?? []`-guarded; zero real levels carry movers today, so this produces zero rows against all 8 shipped levels.
- `scripts/validate-levels.mjs` required zero code changes — its existing generic per-descriptor row-print loop already forwards whatever `checkLevelReachability` returns (confirmed, not assumed).

## Task Commits

Each task was committed atomically:

1. **Task 1: Alcove point-reachability — bestMarginToPoint helper + wiring + RED fixture** - `be17931` (feat)
2. **Task 2: Mover worst-case-extreme reachability — reuse bestMarginToPoint + new RED fixture** - `7d03f88` (feat)

**Plan metadata:** commit pending (this SUMMARY + REQUIREMENTS.md, worktree mode)

## Files Created/Modified
- `scripts/lib/reachability.mjs` - Added `bestMarginToPoint` helper, `secret-alcove-reachability` and `mover-reachability` check blocks inside `checkLevelReachability`, and 8 new self-test cases (E-M)
- `scripts/fixtures/bad-level.js` - Added defect (c): an unreachable `secretAlcove` entry, documented in the header alongside existing (a)/(b)
- `scripts/fixtures/bad-level-mover.js` - New RED-first fixture: a mover whose far endpoint requires an impossible rise, proving the worst-case-extreme rule

## Decisions Made
- Kept `bestMarginToPoint` as the single shared implementation for both checks (Task 2 reuses Task 1's helper verbatim, no duplicated reachability math), matching the plan's explicit success criterion.
- Split the in-footprint (point above/within a reachable node's own span) and cross-height-gap (point beyond a node's far edge) cases inside `bestMarginToPoint` with different rigor levels — see Deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's literal window formula false-HARD-FAILed real, shipped alcoves in level-03 and level-04**
- **Found during:** Task 1, while implementing `bestMarginToPoint` per the plan's exact `<action>` specification
- **Issue:** The plan's prescribed window formula for the "point within node's own span" case (`window = [0, point.x - n.xStart]`) requires the take-off position implied by a `jumpReach` candidate's fixed running-jump reach to fall strictly within `[n.xStart, point.x]`. Implemented literally and run against all 8 real levels via `node scripts/validate-levels.mjs`, this produced `HARD-FAIL` for level-03's alcove (`x:310`, platform `xStart:280` — only 30px of runway, but the shortest real running-jump candidate at the alcove's ~70px rise needs ~38.5px of horizontal travel) and level-04's alcove (`x:270`, platform `xStart:240` — same 30px/38.5px mismatch). Both alcoves are real, shipped, human-verified content from Phase 25/29 — this would have made the RED-first validator immediately fail its own "zero HARD-FAIL on real content" acceptance criterion.
- **Fix:** Split `bestMarginToPoint`'s cross-height branch into two cases: (2) an "in-footprint hop" (point's x falls within the launch node's own span) now treats any `jumpReach`-feasible rise/fall as reachable — a maxRise/maxFall feasibility gate only, matching real gameplay's "hop up and touch it" rather than a precision running-jump landing; (3) a "cross-height gap hop" (point beyond the node's far edge, a genuine horizontal gap) keeps the original precision reach-matching window, since that IS a real landing-distance scenario (and is what `mover-reachability`'s far-endpoint case exercises). Neither RED-first fixture is affected, since both fixtures' failures come from `jumpReach`'s `maxRise` guard returning `[]` entirely (200px and 150px required rises, vastly exceeding the ~88px calibrated ceiling), never from the window/reach-matching logic.
- **Files modified:** `scripts/lib/reachability.mjs` (the `bestMarginToPoint` function only)
- **Verification:** Re-ran `node scripts/lib/reachability.mjs` (self-test PASS), `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js` (still 5 HARD-FAILs including the alcove defect), `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level-mover.js` (still exactly 1 HARD-FAIL), and `node scripts/validate-levels.mjs` against all 8 real levels (zero HARD-FAIL rows from either new check — level-03/level-04 now PASS at marginRatio 0.414/0.541 respectively).
- **Committed in:** `be17931` (part of Task 1's commit — the fix was applied before the first commit, so no separate commit exists)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary for correctness — without this fix, the plan's own stated acceptance criteria ("zero HARD-FAIL... on all 8 real levels") would have been violated by the literal specification. No scope creep; the fix stayed entirely within `bestMarginToPoint`'s existing responsibility.

## Issues Encountered
The Claude Code process restarted mid-task after the bug was identified but before the fix was fully verified end-to-end. On resume, `git status`/`git diff --stat` confirmed the in-progress `reachability.mjs` edits were intact and uncommitted; re-verification (self-test + both fixtures + all 8 real levels) confirmed the fix was complete and correct, and execution continued from there with no rework.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
The validator and its self-test now genuinely cover both new v6.0 dynamics (alcoves and movers) a full phase-boundary before Phase 36 places any real mover in a level, per the roadmap's ordering constraint. Phase 30 Plan 02 (interactive audit alcove detection) and Plan 03 (docs + integration verification) can proceed independently — this plan touched only `scripts/lib/reachability.mjs` and the two fixture files, with no changes to `scripts/lib/mechanic-drive.mjs`, `scripts/audit-phase21-mechanics.mjs`, or any `docs/*.md`, matching the plan's declared `files_modified` scope exactly. No blockers.

---
*Phase: 30-harness-extensions*
*Completed: 2026-07-10*

## Self-Check: PASSED

- FOUND: scripts/lib/reachability.mjs
- FOUND: scripts/fixtures/bad-level.js
- FOUND: scripts/fixtures/bad-level-mover.js
- FOUND commit: be17931
- FOUND commit: 7d03f88
