---
phase: 24-fix-lengthen-levels-1-4
plan: 05
subsystem: testing
tags: [level-descriptors, geometry-pinning, regression-smoke, validator]

requires:
  - phase: 24-fix-lengthen-levels-1-4 (24-01, 24-02, 24-03, 24-04)
    provides: the 4 fixed + extended level descriptors (src/levels/level-0{1..4}.js) whose final geometry this plan re-baselines against
provides:
  - All 4 scripts/smoke-progress.mjs expectedGeometry blocks re-baselined to the post-Phase-24 (fixed + extended) geometry
  - Old (pre-Phase-24, v4.1) geometry values retained in comments for historical traceability
  - Phase-gate confirmation that the full structural/regression suite is green with zero HARD-FAILs across all 4 levels
  - Confirmation that LOCKED surfaces (src/math, lib/kaplay.mjs) remain byte-identical to the Phase 22 baseline commit
affects: [24-06 (24-FINDINGS.md evidence doc), phase 25 (levels 5-8 extension work reusing the same smoke re-baseline convention), phase 28 (final 8-level verification)]

tech-stack:
  added: []
  patterns:
    - "Smoke-fixture re-baseline convention: OLD values retained in a comment above the new expectedGeometry block, never silently overwritten (mirrors CONFIG.JUMP_FORCE / jump-envelope.mjs provenance-comment style)"

key-files:
  created: []
  modified:
    - scripts/smoke-progress.mjs

key-decisions:
  - "All 4 geometry-pinning blocks (not just level-01's, despite CONTEXT.md's prose only naming level-01) were re-baselined, per 24-RESEARCH.md's finding that the fixture pins all 4 levels independently"
  - "Only per-key OLD values that actually changed (floors/platforms/coins/spikes/goal/checkpoints/mathGates as applicable) were retained in the traceability comment; unchanged keys (doors/enemies/collectZones/answerPickupSlots where untouched) were omitted per the plan's own scoping rule"

patterns-established:
  - "Re-baseline comment convention: '// Phase 24 re-baseline: ...' + '// OLD (pre-Phase-24, v4.1) values, retained for historical traceability:' followed by one comment line per changed array key, applied identically across all 4 blocks"

requirements-completed: [VALID-04, LVL-01]

coverage:
  - id: D1
    description: "All 4 smoke-progress.mjs geometry-pinning blocks re-baselined to the post-Phase-24 geometry with old values retained in comments"
    requirement: "LVL-01"
    verification:
      - kind: unit
        ref: "node scripts/smoke-progress.mjs (prints 'smoke-progress: PASS')"
        status: pass
      - kind: other
        ref: "grep -c 'Phase 24 re-baseline' scripts/smoke-progress.mjs == 4"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full structural/regression suite (validate-levels.mjs + smoke-progress.mjs + check-progress.sh) is green with zero HARD-FAILs across all 4 levels"
    requirement: "VALID-04"
    verification:
      - kind: unit
        ref: "node scripts/validate-levels.mjs (prints 'validate-levels: PASS', all rows PASS/WARN, zero HARD-FAIL)"
        status: pass
      - kind: unit
        ref: "bash scripts/check-progress.sh (prints 'progress checks: PASS')"
        status: pass
    human_judgment: false
  - id: D3
    description: "LOCKED surfaces (src/math, lib/kaplay.mjs) confirmed byte-identical to the Phase 22 baseline commit"
    verification:
      - kind: other
        ref: "git diff --quiet 5eedee870d314307a846bae254f61e7d1e0ef5f4 -- src/math && git diff --quiet 5eedee870d314307a846bae254f61e7d1e0ef5f4 -- lib/kaplay.mjs"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-06
status: complete
---

# Phase 24 Plan 05: Smoke Re-Baseline & Phase-Gate Confirmation Summary

**All 4 smoke-progress.mjs geometry-pinning blocks re-baselined to the Wave-1-committed post-Phase-24 geometry (old values retained in comments); full structural suite confirmed green with zero HARD-FAILs and LOCKED surfaces (src/math, lib/kaplay.mjs) proven byte-identical to the Phase 22 baseline.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-06T00:00:00Z (approx)
- **Completed:** 2026-07-06
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Re-baselined all 4 `scripts/smoke-progress.mjs` `expectedGeometry` deep-equal blocks (level-01 through level-04) to byte-for-byte match the final Wave-1-committed `src/levels/level-0{1..4}.js` descriptors, each preceded by a traceability comment retaining the OLD pre-Phase-24 (v4.1) values for the keys that changed
- Confirmed `node scripts/smoke-progress.mjs` exits 0 and prints `smoke-progress: PASS`
- Confirmed `node scripts/validate-levels.mjs` exits 0, prints `validate-levels: PASS`, with zero HARD-FAILs across all 4 levels (only expected WARN rows on gap-width/spawn-goal checks, consistent with the documented `marginRatio=1.0` precision limitation for flat/downward hops)
- Confirmed `bash scripts/check-progress.sh` exits 0 and prints `progress checks: PASS`
- Confirmed `src/math` and `lib/kaplay.mjs` are byte-identical to the Phase 22 baseline commit `5eedee870d314307a846bae254f61e7d1e0ef5f4` via `git diff --quiet`

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-baseline all 4 smoke-progress.mjs geometry-pinning blocks** - `92ec940` (test)
2. **Task 2: Confirm the phase-gate full suite is green and LOCKED surfaces are untouched** - no commit (verification-only task, no file changes)

**Plan metadata:** commit pending (docs: complete plan)

## Files Created/Modified
- `scripts/smoke-progress.mjs` - all 4 `expectedGeometry` blocks (level-01..04) updated to the post-Phase-24 geometry; old pre-Phase-24 values retained in comments per level for historical traceability

## Decisions Made
- Re-baselined all 4 blocks (not just level-01's) per 24-RESEARCH.md's finding that CONTEXT.md's prose only named level-01 explicitly while the actual fixture pins all 4 levels independently — treating this as the correct in-scope reading, consistent with the plan's own must-haves
- In each traceability comment, only listed OLD values for keys that actually changed (e.g., level-02's `doors`/`enemies`/`collectZones`/`answerPickupSlots` were untouched and omitted from the OLD comment, since the plan's action step explicitly excludes unchanged keys from the retained-value comment)

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria were met on the first attempt with no auto-fixes required.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The full structural/regression suite (validator + smoke + check-progress.sh) is green across all 4 levels with the smoke fixture correctly tracking the new v5.0 (post-Phase-24) geometry baseline going forward, ready to catch future accidental drift
- LOCKED surfaces confirmed untouched, satisfying the phase's "brain is LOCKED" binding decision
- Plan 24-06 (24-FINDINGS.md evidence doc) can now cite this plan's console output (validate-levels: PASS with zero HARD-FAILs, smoke-progress: PASS, LOCKED-surface diff-clean proof) as its primary VALID-04/LVL-01 acceptance evidence
- The interactive audit (`node scripts/audit-phase21-mechanics.mjs`) was not run in this plan (not required by this plan's two tasks); it remains available for Plan 24-06 or a later phase-gate step per 24-RESEARCH.md's recommended sequencing

---
*Phase: 24-fix-lengthen-levels-1-4*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: scripts/smoke-progress.mjs
- FOUND: .planning/phases/24-fix-lengthen-levels-1-4/24-05-SUMMARY.md
- FOUND: commit 92ec940
