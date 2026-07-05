---
phase: 23-level-validation-harness
plan: 01
subsystem: testing
tags: [playwright, kaplay, level-validation, physics-calibration]

# Dependency graph
requires:
  - phase: 22-implementation-review-auto-fix
    provides: 8 heuristic-candidate platforms + 3 confirmed over-hole defects (structural defect inventory this envelope will help arbitrate in Wave 2)
provides:
  - scripts/calibrate-jump-envelope.mjs — one-time Playwright probe measuring real jump physics against the running vendored Kaplay engine
  - scripts/lib/jump-envelope.mjs — frozen, empirically-calibrated JUMP_ENVELOPE constant with a documented non-zero safety margin
affects: [23-level-validation-harness (Wave 2 reachability module), 24-fix-and-lengthen-levels]

# Tech tracking
tech-stack:
  added: []
  patterns: [empirical-physics-calibration-then-freeze, verbatim-server-guard-reuse]

key-files:
  created:
    - scripts/calibrate-jump-envelope.mjs
    - scripts/lib/jump-envelope.mjs
  modified: []

key-decisions:
  - "marginPct floored at 5% because the computed larger relative spread (running-jump reach, 3.75% rounded up to 4%) fell below the 5% floor"
  - "Calibration probe reuses browser-boot.mjs's resolvePlaywright()/server/CR-02 guard verbatim on a new port (8769) rather than importing browser-boot.mjs (which has no exports)"

patterns-established:
  - "Frozen-constant-from-one-time-probe: a manually-invoked Playwright script prints raw trial data; a separate pure-data module hand-documents and exports the derived constant, so the routine validator never launches a browser"

requirements-completed: [VALID-02]

coverage:
  - id: D1
    description: "scripts/calibrate-jump-envelope.mjs measures real standing-jump rise and running-jump reach against the live running Kaplay engine via Playwright (never a closed-form formula)"
    requirement: "VALID-02"
    verification:
      - kind: integration
        ref: "node scripts/calibrate-jump-envelope.mjs (real run, printed 12 standing + 12 running trials, exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/lib/jump-envelope.mjs exports a frozen JUMP_ENVELOPE constant with a documented non-zero safety margin (marginPct=5%), derived from this run's own observed trial variance, importing nothing Playwright-related"
    requirement: "VALID-02"
    verification:
      - kind: unit
        ref: "node -e \"import('./scripts/lib/jump-envelope.mjs')...\" shape/threshold assertion (maxRise>0, runSpeed>0, marginPct>=0.05, 12+ trials each)"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-05
status: complete
---

# Phase 23 Plan 01: Jump Envelope Calibration Summary

**One-time Playwright probe measures real standing-jump rise (~93.9px mean) and running-jump reach (~172.7px mean) against the live Kaplay engine, freezing a margin-shaved JUMP_ENVELOPE constant (maxRise=88.331, runSpeed=218.043, marginPct=5%) for Wave 2's reachability graph.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-05T21:07:00Z
- **Completed:** 2026-07-05T21:19:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Built `scripts/calibrate-jump-envelope.mjs`, a standalone Playwright probe that reposition-and-settles the player on a flat test strip in the real level-01 scene, holds the jump key through the full arc, and samples position/grounded state every ~16ms (never the coarser 120ms traversal poll `driveToXClimbing` uses) — replicating `browser-boot.mjs`'s CR-02 path-traversal guard and loopback-only bind verbatim on a fresh port (8769)
- Ran the probe for real against the live engine: 12 standing-jump trials (min 92.98px, mean 93.91px, max 94.13px) and 12 running-jump trials (min 170.50px, mean 172.71px, max 176.98px) — both measured maxima sit slightly below their respective closed-form ceilings (~96.57px rise, ~178.29px reach), exactly the pattern real per-frame `dt()` discretization should produce
- Derived and froze `scripts/lib/jump-envelope.mjs`'s `JUMP_ENVELOPE` constant (`maxRise: 88.331`, `runSpeed: 218.043`, `marginPct: 0.05`) with the full raw trial arrays and both derivation formulas documented in a `CONFIG.JUMP_FORCE`-style header comment — a pure-data module with zero Playwright/browser imports, ready for Wave 2's `scripts/lib/reachability.mjs` to consume

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the calibration probe (Playwright launch/server + fine-grained sampling)** - `228a0ff` (feat)
2. **Task 2: Run the probe and freeze the calibrated constant** - `f239ee9` (feat)

## Files Created/Modified
- `scripts/calibrate-jump-envelope.mjs` - one-time Playwright probe; `measureStandingJump`/`measureRunningJump` sample real engine state at ~16ms cadence, holding the jump key through the full flight so `CONFIG.JUMP_CUT` never truncates the arc
- `scripts/lib/jump-envelope.mjs` - frozen `JUMP_ENVELOPE` constant with raw trial data, margin derivation, and both `maxRise`/`runSpeed` formulas documented in-comment

## Decisions Made
- **marginPct floor triggered, not the rounded-spread value:** the running-jump trials' relative spread ((176.98-170.50)/172.71 = 3.75%) rounds up to 4%, which is still below the plan's required 5% floor — so `marginPct = 0.05` is the floor case, not a directly-computed percentage. Documented explicitly in the module header so a future reader doesn't mistake 5% for the raw rounded spread.
- **Server code copied verbatim, not imported:** `browser-boot.mjs` has no exports, so the CR-02 guard + loopback bind + `resolvePlaywright()` were copied byte-for-byte into the new script (per plan instruction) rather than refactored into a shared module — avoids touching the already-stable, untouched `browser-boot.mjs`.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and verify commands passed without needing any Rule 1-4 fixes.

## Issues Encountered
None - the calibration probe ran successfully on the first attempt against the real engine, producing clean, low-variance trial data (both relative spreads under 5%).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `scripts/lib/jump-envelope.mjs`'s `JUMP_ENVELOPE` constant is ready for Wave 2's `scripts/lib/reachability.mjs` (Plan 23-04) to import as the Δy-aware jump-edge model's horizontal-speed budget and rise ceiling.
- No blockers. The routine validator (built in later waves) can now import a frozen constant without ever launching a browser, satisfying VALID-02's "does NOT launch a browser on every invocation" constraint.

---
*Phase: 23-level-validation-harness*
*Completed: 2026-07-05*
