---
phase: 10-math-gate-integration-port-the-brain
plan: 03
subsystem: ui
tags: [math, gate, integration, scene, seam, onReachGoal, level-clear, kaplay]

# Dependency graph
requires:
  - phase: 10-01
    provides: createBrain() factory (pure, engine-agnostic weighted question selector)
  - phase: 10-02
    provides: openMathGate({ brain, onClear }) — the single in-world gate bridge
provides:
  - "onReachGoal() seam wired to openMathGate({ brain, onClear }) — the join point that closes the GATE-01..06 loop end-to-end"
  - "A fresh per-scene createBrain() construction in the scene closure (anti-leak; resets on replay)"
  - "An onClear level-clear hook (GATE-03) kept clean for Phase 11 XP — no XP implemented"
  - "scripts/check-wiring.sh — the structural per-commit gate for the scene-to-gate wiring"
affects: [phase-11-xp-leveling, phase-12-juice-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scene-closure dependency injection: scene constructs the brain once and hands it to the gate via openMathGate (single one-way bridge)"
    - "Replace-in-place seam wiring: the existing fire-once onReachGoal() handler swapped its stub body for the real gate handoff with zero new handlers"

key-files:
  created:
    - .planning/phases/10-math-gate-integration-port-the-brain/scripts/check-wiring.sh
  modified:
    - src/scenes/game.js

key-decisions:
  - "Brain constructed once near the other closure run-state (coinsCollected/goalReached), not inside onReachGoal — closure-local, fresh per go('game'), never module-level (anti-leak T-10-06)"
  - "onClear sets a closure flag levelCleared = true; the gate owns its own LEVEL CLEAR banner, so the scene side stays minimal as a clean Phase-11 XP hook (no XP/leveling/persistence)"
  - "Single level: onClear does NOT go() to a next level"

patterns-established:
  - "Single scene-to-gate bridge: src/scenes/game.js is the only scene-side consumer and talks to the gate solely through openMathGate"
  - "Per-phase structural verification scripts (check-wiring.sh mirrors check-gate.sh) stand in for a JS test framework in this no-build/no-dep project"

requirements-completed: [GATE-03]

# Metrics
duration: 2min
completed: 2026-06-26
status: complete
---

# Phase 10 Plan 03: Wire the Math Gate into the Goal Seam Summary

**Reaching the goal now opens the real in-world math gate over the dimmed/paused level, and a correct answer clears the level via onClear (GATE-03) — replacing the temporary text("GOAL!") stub and closing the GATE-01..06 loop end-to-end.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-26T07:21:05Z
- **Completed:** 2026-06-26T07:22:55Z
- **Tasks:** 2 completed
- **Files modified:** 1 modified, 1 created

## What Was Built

### Task 1 — Scene-to-gate wiring (src/scenes/game.js)
- Added two imports alongside the existing sibling-module imports: `createBrain` from `../math/brain.js` and `openMathGate` from `../ui/mathGate.js`.
- Constructed a fresh brain once in the scene closure (`const brain = createBrain();`) next to the other run-state (`coinsCollected`/`goalReached`) — closure-local so each `go("game")`/replay gets a clean accuracy/history (anti-leak, T-10-06). Not a module-level `let`.
- Inside the existing fire-once `onReachGoal()` seam, kept the `goalReached` latch, the clean stop `player.vel = vec2(0)`, and the gentle freeze `player.paused = true`, then REPLACED the `text("GOAL!")` banner `add([...])` with a single call to `openMathGate({ brain, onClear })`.
- `onClear` sets a closure flag `levelCleared = true` (declared alongside `goalReached`). The gate already shows its own LEVEL CLEAR banner (Plan 02), so the scene side stays minimal — a clean single hook Phase 11 attaches XP to. No XP/leveling/persistence/next-level wiring.
- Preserved exactly one `onReachGoal` function and one `player.onCollide("goal", onReachGoal)` (no double-fire seam).

### Task 2 — Structural wiring gate (scripts/check-wiring.sh)
- Authored `.planning/phases/10-.../scripts/check-wiring.sh`, mirroring the existing `check-gate.sh` style (resolve repo root, fail-fast `fail()` helper, per-assertion failure branches).
- Encodes all six assertions: (1) `node --check` syntax gate, (2) `openMathGate(` handoff present, (3) `createBrain(` + `onClear` present, (4) `player.paused = true` freeze preserved, (5) NEGATIVE — `text("GOAL!")` stub absent, (6) exactly one `player.onCollide("goal"` handler.
- Prints `wiring checks: PASS` on success; exits non-zero with a descriptive message on any failed assertion.

## Verification

- `node --check src/scenes/game.js` — passes.
- `bash scripts/check-wiring.sh` — `wiring checks: PASS`.
- `bash scripts/check-gate.sh` (Plan 02 gate, re-run as regression) — `gate checks: PASS`.
- Task 1 inline automated check (openMathGate + createBrain present, no GOAL! stub, exactly one goal handler) — PASS.

**Pending (phase-gate UAT, per 10-VALIDATION.md):** Browser UAT over HTTP — run to the goal, confirm the in-world gate opens over the dimmed/paused level, a correct answer (key 1-4 or click) flashes + LEVEL CLEAR and the run ends cleared, and a replay opens a fresh gate with no duplicated keypress effects (anti-leak end-to-end). This is a human-verify manual step; structural gates above stand in for the automated portion.

## Threat Model Coverage

- **T-10-06 (cross-replay brain/gate state leak):** mitigated — `brain` is constructed with `createBrain()` in the scene closure (fresh per `go("game")`); the gate self-cleans on close (Plan 02). check-wiring.sh asserts `createBrain(` is present.
- **T-10-07 (double-fire of onReachGoal/onClear):** mitigated — the `goalReached` fire-once latch is preserved; check-wiring.sh asserts a single `player.onCollide("goal"` seam; the gate's `cleared` latch (Plan 02) guarantees `onClear` fires exactly once.
- **T-10-SC (package installs):** accepted — zero package installs this phase (no-build/no-dep canon).

## Deviations from Plan

None — plan executed exactly as written. The brain was placed in the scene closure (the plan-recommended option per PATTERNS line 130 / must_haves) rather than inside `onReachGoal()`.

## Decisions Made

- Construct the brain once in the scene closure (not per-goal-collision) — matches the `coinsCollected` anti-leak discipline and the must_haves contract.
- `onClear` writes a closure flag (`levelCleared = true`) rather than rendering scene-side UI, keeping the hook minimal for Phase 11 and avoiding duplicate banners (the gate owns LEVEL CLEAR).

## Known Stubs

None. The `text("GOAL!")` placeholder was removed; the gate fully owns the on-goal UI. `onClear`'s minimal body (`levelCleared = true`) is an intentional Phase-11 hook documented in-code, not a stub blocking GATE-03 — a correct answer clears the level via the gate's own LEVEL CLEAR + the frozen player.

## Self-Check: PASSED

- FOUND: src/scenes/game.js (modified, commit 50ddb99)
- FOUND: .planning/phases/10-math-gate-integration-port-the-brain/scripts/check-wiring.sh (commit 42c06c9)
- FOUND commit 50ddb99: feat(10-03): wire onReachGoal to openMathGate (GATE-03)
- FOUND commit 42c06c9: test(10-03): add check-wiring.sh structural gate for scene wiring
