---
phase: 23-level-validation-harness
plan: 03
subsystem: testing
tags: [level-validator, interval-arithmetic, fixture, node, no-framework]

# Dependency graph
requires:
  - phase: 22-implementation-review-auto-fix
    provides: interval-check-22-04.mjs scratchpad logic (proven correct against 3 known over-hole defects), scripts/fixtures/bad-scene.js convention
provides:
  - "scripts/lib/over-hole-check.mjs — exported findOverHoleBarriers(geometry), promoted verbatim from Phase 22's scratchpad, with a self-test proving 3 documented behaviors"
  - "scripts/fixtures/bad-level.js — synthetic BAD_LEVEL fixture proving an over-hole HARD-FAIL (mathGate x:380) and an unconditionally-unreachable-platform/goal HARD-FAIL, independent of levels 1-4's content"
affects: [23-04-PLAN (reachability.mjs / validate-levels.mjs orchestrator), 23-FINDINGS.md RED-first proof]

# Tech tracking
tech-stack:
  added: []
  patterns: [promoted-scratchpad-to-module, deliberately-bad-fixture-proves-RED, check/failures-counter/process.exit self-test idiom]

key-files:
  created:
    - scripts/lib/over-hole-check.mjs
    - scripts/fixtures/bad-level.js
  modified: []

key-decisions:
  - "over-hole-check.mjs promoted byte-for-byte from Phase 22's proven scratchpad logic — no new checks, no platform-membership test added, since every shipped barrier is floor-mounted"
  - "isMain detection uses fileURLToPath(import.meta.url) === process.argv[1] rather than URL/pathname string comparison, for robustness"

patterns-established:
  - "Promoted-scratchpad-to-module: lift already-proven ad-hoc audit logic verbatim into a real exported module with a self-test, rather than re-deriving it"

requirements-completed: [VALID-01]

coverage:
  - id: D1
    description: "findOverHoleBarriers(geometry) returns a row for every door/mathGate/enemy whose footprint is not fully covered by any floor run, and [] for a fully-supported level"
    requirement: "VALID-01"
    verification:
      - kind: unit
        ref: "scripts/lib/over-hole-check.mjs self-test (node scripts/lib/over-hole-check.mjs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/fixtures/bad-level.js provides a synthetic level proving both an over-hole HARD-FAIL and an unconditionally-unreachable-platform HARD-FAIL, independent of calibrated envelope numbers"
    requirement: "VALID-01"
    verification:
      - kind: unit
        ref: "node -e import bad-level.js + findOverHoleBarriers, asserts exactly 1 mathGates row (see Task 2 verify command)"
        status: pass
    human_judgment: false

# Metrics
duration: 13min
completed: 2026-07-05
status: complete
---

# Phase 23 Plan 03: Over-Hole Checker Promotion + Bad-Level Fixture Summary

**Promoted Phase 22's proven scratchpad interval-arithmetic over-hole checker into a real exported module, and built the deliberately-broken bad-level.js fixture for the validator's future self-test**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-05T21:38:27Z (STATE.md `Stopped at: Completed 23-02-PLAN.md`)
- **Completed:** 2026-07-05T21:41:02Z
- **Tasks:** 2
- **Files modified:** 2 (both new)

## Accomplishments
- `scripts/lib/over-hole-check.mjs` exports `findOverHoleBarriers(geometry)`, a byte-for-byte promotion of Phase 22's already-proven `interval-check-22-04.mjs` scratchpad, with an inline self-test proving all 3 documented behaviors (over-hole detection, fully-supported pass, all-omitted never-brick)
- `scripts/fixtures/bad-level.js` provides a synthetic `BAD_LEVEL` descriptor with two independent, unconditional defects (an over-hole mathGate and an unreachable platform/goal combination) for the validator's Wave 3 self-test, mirroring the `bad-scene.js` "deliberately-bad fixture proves RED" convention

## Task Commits

Each task was committed atomically:

1. **Task 1: Promote the over-hole interval-arithmetic checker** - `98c6f18` (feat)
2. **Task 2: Build the deliberately-broken bad-level.js fixture** - `3e94d47` (feat)

**Plan metadata:** (this commit) `docs(23-03): complete over-hole-check-plus-bad-level-fixture plan`

_Note: neither task used TDD scaffolding beyond the tdd="true" self-test idiom already present in Task 1's inline block — no separate RED/GREEN commit split, matching this project's no-framework `check()`/`process.exit(1)` unit-test convention._

## Files Created/Modified
- `scripts/lib/over-hole-check.mjs` - Exports `findOverHoleBarriers`, exact interval arithmetic over `geometry.floors` vs door/mathGate/enemy footprints; self-test guarded to run only when executed directly
- `scripts/fixtures/bad-level.js` - Exports `BAD_LEVEL`, a synthetic level descriptor with an over-hole mathGate (x:380, gap 300..700) and an unconditionally-unreachable platform (290px required rise vs ~96.6px theoretical max) blocking the goal at x:900

## Decisions Made
- Promoted the over-hole checker verbatim (no opportunistic extras, no platform-membership test) per the plan's explicit instruction and Phase 22's already-proven correctness against the 3 known live defects
- Used `fileURLToPath(import.meta.url) === process.argv[1]` for the "run only when executed directly" guard instead of a raw URL/pathname string comparison, for cross-platform robustness (functionally equivalent, no behavior change)
- `bad-level.js`'s numbers were used exactly as specified in the plan's `<action>` block, each independently traceable to `src/config.js` constants (`FLOOR_Y=320`, `MATH_GATE.H=64`, `GOAL_SIZE=16`, `GRAVITY=1400`, `JUMP_FORCE=520`)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`scripts/lib/over-hole-check.mjs` and `scripts/fixtures/bad-level.js` are both ready for `scripts/validate-levels.mjs` (a later wave in this phase) to consume: the checker as one of the validator's core checks, the fixture as the `--fixture` self-test input. Neither `src/levels/*.js` file was touched, preserving Phase 23's RED-first proof requirement against the untouched levels 1-4 (Phase 24's job, not this plan's).

No blockers.

---
*Phase: 23-level-validation-harness*
*Completed: 2026-07-05*

## Self-Check: PASSED

- FOUND: scripts/lib/over-hole-check.mjs
- FOUND: scripts/fixtures/bad-level.js
- FOUND: 98c6f18 (Task 1 commit)
- FOUND: 3e94d47 (Task 2 commit)
