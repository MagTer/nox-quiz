---
phase: 16-remaining-mechanics-difficulty-curve
plan: 01
subsystem: testing
tags: [bash, static-gate, a727c13, openChallenge]

requires:
  - phase: 15-challenge-seam-locked-door-mechanic
    provides: shared src/ui/challenge.js seam + check-gate.sh/check-import-safety.sh structure

provides:
  - Extended check-gate.sh thin-caller assertions for mechanics/gates.js, enemy.js, collect.js
  - Extended check-import-safety.sh existence/syntax and a727c13 negative-scan loops for the three new mechanic modules

affects:
  - 16-02-PLAN.md (implementation)
  - 16-03-PLAN.md (integration)

tech-stack:
  added: []
  patterns:
    - "Existing gate scripts extended without weakening prior assertions"
    - "RED-until-wired gate state: new module existence checks fail until 16-02 creates them"

key-files:
  created: []
  modified:
    - scripts/check-gate.sh
    - scripts/check-import-safety.sh

key-decisions:
  - "Followed the plan's insertion points exactly: gate assertions 11-13 added after door.js assertion 10, import-safety file lists appended to both Section 0 and Section 2 loops"

patterns-established: []

requirements-completed: [MECH-03, MECH-04, MECH-05, LVL-03]

coverage:
  - id: D1
    description: "check-gate.sh sanity-checks gates.js, enemy.js, and collect.js as thin openChallenge callers"
    requirement: MECH-03
    verification:
      - kind: other
        ref: "bash -n scripts/check-gate.sh && bash scripts/check-gate.sh (expected RED)"
        status: pass
    human_judgment: false
  - id: D2
    description: "check-import-safety.sh includes the three new mechanic modules in both syntax and a727c13 scan loops"
    requirement: LVL-03
    verification:
      - kind: other
        ref: "bash -n scripts/check-import-safety.sh && bash scripts/check-import-safety.sh (expected RED)"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-07-03
status: complete
---

# Phase 16 Plan 01: Wave 0 Tooling Summary

**Extended the structural gate scripts so the three new Phase 16 mechanic modules are policed by the same challenge-seam and a727c13 contracts established in Phase 15.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-03T14:16:00Z
- **Completed:** 2026-07-03T14:18:54Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added three thin-caller assertions to `scripts/check-gate.sh` for `src/mechanics/gates.js`, `src/mechanics/enemy.js`, and `src/mechanics/collect.js`.
- Added the same three paths to both loops in `scripts/check-import-safety.sh` (existence/syntax check and top-level-engine-global negative scan).
- Preserved every existing assertion and calibration self-test unchanged.
- Confirmed both gates are RED at this wave because the new modules do not yet exist.

## Task Commits

1. **Task 1: Extend check-gate.sh** - `2df480d` (feat)
2. **Task 2: Extend check-import-safety.sh** - `c7f9ab1` (feat)

## Files Created/Modified
- `scripts/check-gate.sh` — added assertions 11-13 (gates/enemy/collect thin `openChallenge` callers).
- `scripts/check-import-safety.sh` — added the three new mechanic modules to Section 0 and Section 2 file lists.

## Decisions Made
- None — followed the plan exactly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Incorrect criterion] `node --check scripts/check-gate.sh` and `node --check scripts/check-import-safety.sh` are not applicable to Bash scripts**
- **Found during:** Task 1 and Task 2 acceptance criteria verification
- **Issue:** The acceptance criteria list `node --check scripts/check-gate.sh` and `node --check scripts/check-import-safety.sh`, but these files are Bash scripts, so Node's syntax check rejects the `.sh` extension.
- **Fix:** Substituted `bash -n <script>` for Bash syntax validation and otherwise ran the listed grep and execution checks.
- **Files modified:** none beyond the planned edits
- **Verification:** `bash -n scripts/check-gate.sh` and `bash -n scripts/check-import-safety.sh` both pass; the scripts execute and produce the expected RED messages.
- **Committed in:** same task commits

---

**Total deviations:** 1 auto-fixed (1 incorrect criterion handled by equivalent Bash syntax check)
**Impact on plan:** Zero impact on deliverables; the gate extensions are exactly as specified.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
Wave 0 gates are in place and expected RED. Ready for Wave 1 (16-02) to create `gates.js`, `enemy.js`, and `collect.js` and turn these gates GREEN.

---
*Phase: 16-remaining-mechanics-difficulty-curve*
*Completed: 2026-07-03*
