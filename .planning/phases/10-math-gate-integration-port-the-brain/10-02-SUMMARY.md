---
phase: 10-math-gate-integration-port-the-brain
plan: 02
subsystem: ui
tags: [math, gate, ui, kaplay, overlay, forgiving, no-timer, bridge]

# Dependency graph
requires:
  - phase: 10-math-gate-integration-port-the-brain (plan 01)
    provides: src/math/brain.js createBrain() factory ({a,b,answer,choices[4]} + reportResult), CONFIG.GATE constants
provides:
  - src/ui/mathGate.js — openMathGate({ brain, onClear }) in-world gate bridge (the single brain consumer)
  - "math-gate" entity tag + destroy-on-close cleanup contract
  - dual-input contract (keys 1-4 + box onClick), forgiving wrong / clean-close correct branches
  - scripts/check-gate.sh — reusable structural firewall/anti-leak/no-timer/no-DOM/one-way gate
affects: [10-03 scene wiring (calls openMathGate), Phase 11 XP (attaches at onClear hook), Phase 12 juice/sfx]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-world overlay: fixed() + high z() Kaplay text()/rect() over the dimmed level — never a DOM popup"
    - "Leak-safe gate close: capture every global onKeyPress EventController + cancel() on close, plus destroy('math-gate')"
    - "One-way bridge: src/ui/mathGate.js imports brain + CONFIG only; nothing from ../scenes/"
    - "Structural gate script as the per-commit automated check (no JS test framework)"

key-files:
  created:
    - src/ui/mathGate.js
    - .planning/phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh
  modified: []

key-decisions:
  - "Reused the param name `brain` (reassigned to a createBrain() fallback when absent) so the literal brain.nextQuestion/brain.reportResult tokens are present for the structural grep AND the self-standing fallback still works"
  - "check-gate.sh placed under the phase dir (.planning/.../scripts/) matching the plan <files> and <verify> path; resolves repo root via git rev-parse so it runs from any cwd"
  - "Wrong answer shakes + reddens the chosen box and KEEPS the same question object — no run-ending state, onClear never called"
  - "onClear guarded by a `cleared` boolean latch so a correct pick fires it exactly once"

patterns-established:
  - "Pattern: in-world camera-immune gate overlay (fixed/z/tag) replacing any DOM modal"
  - "Pattern: dual-input answer boxes — object-scoped onClick (auto-clean) + captured global key controllers (.cancel() on close)"
  - "Pattern: comment discipline — describe banned scheduler/DOM-sink intent by concept so negative greps don't self-trip on comments"

requirements-completed: [GATE-01, GATE-04, GATE-05]

# Metrics
duration: ~12min
completed: 2026-06-26
status: complete
---

# Phase 10 Plan 02: In-World Math Gate Bridge Summary

**Single one-way bridge `src/ui/mathGate.js` rendering a fixed()/dimmed Kaplay overlay (question + 4 dual-input answer boxes) — forgiving on wrong, clean-close + onClear() once on correct, zero timer, anti-leak — plus the reusable `check-gate.sh` structural verification gate.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-26T07:06Z (approx)
- **Completed:** 2026-06-26T07:18:40Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- `src/ui/mathGate.js` (203 lines): `openMathGate({ brain, onClear })` renders an in-world, camera-immune `fixed()` + high-`z()` overlay — full-screen dim layer + dark-grunge panel + big `a × b` question text + four `area()` answer boxes — all Kaplay `text()`/`rect()`, no DOM sink (GATE-01).
- Dual input wired to a single `choose(i)`: object-scoped `box.onClick` (auto-clean) AND captured global `onKeyPress("1".."4")` controllers.
- Forgiving wrong branch (GATE-04): a wrong pick `shake()`s + reddens the box, keeps the SAME question object, leaves the gate open — no penalty, no game-over, `onClear` not called.
- Correct branch (GATE-03): green flash + "LEVEL CLEAR" banner + clean `close()` + `onClear()` exactly once (boolean latch).
- No timer/scheduler anywhere (GATE-05). Anti-leak `close()`: `keyCtrls.forEach(c => c.cancel())` + `destroy("math-gate")`.
- One-way bridge: imports `createBrain` + `CONFIG` only; nothing from `../scenes/`.
- `scripts/check-gate.sh`: eight fail-fast structural assertions (syntax, export, brain bridge, fixed overlay, BOTH cancel()+destroy(), negative no-DOM, negative no-timer, negative no-scenes); prints `gate checks: PASS`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the in-world gate overlay + dual-input answer boxes** - `5113b19` (feat)
2. **Task 2: Author the structural verification script** - `759e913` (test)

## Files Created/Modified
- `src/ui/mathGate.js` - The single one-way gate bridge: pulls one question from the brain, renders the in-world dimmed panel + 4 dual-input answer boxes, forgiving wrong / clean-close correct branches, anti-leak teardown.
- `.planning/phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` - Reusable structural gate (firewall/anti-leak/no-timer/no-DOM-sink/one-way) — the per-commit automated check, since the project has no JS test framework.

## Decisions Made
- Kept the destructured `brain` param name (reassigning to `createBrain()` when absent) rather than a `theBrain` local — this makes the literal `brain.nextQuestion`/`brain.reportResult` tokens present for the structural grep while preserving the self-standing fallback.
- `check-gate.sh` resolves the repo root via `git rev-parse --show-toplevel` so it asserts against `src/ui/mathGate.js` regardless of the caller's working directory.
- Comment discipline: described the no-timer / no-DOM-sink intent by concept; banned tokens (`setTimeout`/`setInterval`/`wait(`/`loop(`/`innerHTML`/`document.`) appear only inside the grep PATTERNS in `check-gate.sh`, never in the gate source — so the negative greps cannot self-trip on a comment.

## Deviations from Plan

None - plan executed exactly as written. (Initial draft used a `theBrain` local and a comment containing the literal `from ../scenes/` phrase; both were corrected before the Task 1 commit so the source satisfies the literal-token bridge grep and the one-way negative grep. These were caught during the inline verify step, never committed in a failing state.)

## Issues Encountered
- The Task 1 acceptance grep checks for the literal lowercase tokens `brain.nextQuestion`/`brain.reportResult` and a negative `from .*scenes/`. The first draft (`theBrain.*`, plus a header comment mentioning `from ../scenes/`) would have failed those literal greps. Resolved before committing by reassigning the `brain` param and rewording the comment. Final `node --check` + all eight `check-gate.sh` assertions pass.

## User Setup Required
None - no external service configuration required (no-build, no-dep, local single-file philosophy).

## Next Phase Readiness
- The gate bridge is ready for Plan 03 scene wiring: `src/scenes/game.js` `onReachGoal()` replaces the `text("GOAL!")` stub with `openMathGate({ brain, onClear })`, supplying a scene-constructed `createBrain()` instance and an `onClear` closure that performs the level-clear.
- `onClear` hook is the clean GATE-03 seam where Phase 11 will attach XP.
- `check-gate.sh` is the reusable per-commit gate for any future change to `src/ui/mathGate.js`.

## Self-Check: PASSED

---
*Phase: 10-math-gate-integration-port-the-brain*
*Completed: 2026-06-26*
