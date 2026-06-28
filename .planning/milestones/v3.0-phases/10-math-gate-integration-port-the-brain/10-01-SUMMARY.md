---
phase: 10-math-gate-integration-port-the-brain
plan: 01
subsystem: math-brain
tags: [math, brain, port, weighted-selection, firewall, gate06, gate02]
requires:
  - "archive/math-lab.html (port source: CONFIG 604-619, PlayerState EWMA 663-711, QuestionSelector 911-1030)"
  - "src/config.js (CONFIG export shape)"
provides:
  - "src/math/brain.js — pure createBrain() factory (nextQuestion + reportResult)"
  - "CONFIG.BRAIN namespace (EWMA/table tuning constants)"
  - "CONFIG.GATE namespace (panel/dim UI constants — consumed by Plan 02)"
affects:
  - "10-02 (src/ui/mathGate.js will import createBrain + read CONFIG.GATE)"
tech-stack:
  added: []
  patterns:
    - "Anti-leak createBrain() factory closure (fresh accuracy/history per game)"
    - "Engine-firewall pure ES module (zero game-engine imports, headless node-importable)"
    - "No-magic-numbers: all tuning via CONFIG.BRAIN.*"
key-files:
  created:
    - "src/math/brain.js"
  modified:
    - "src/config.js"
decisions:
  - "Return shape locked to { a, b, answer, choices } (a=table, b=multiplicand); dropped archive `question:` string — the gate builds its own display string (Open Question #1 resolved)."
  - "Brain exposed as createBrain() factory, NOT the archive's module-level IIFE singleton, so per-session accuracy cannot leak across game replays."
  - "Doc-header rephrased to describe dropped subsystems WITHOUT their literal identifier tokens, so the firewall negative-greps (XpCalculator/DUNGEON/toJSON/fromJSON/combat/potion) stay clean across the entire file including comments."
metrics:
  duration: ~12m
  completed: 2026-06-26
  tasks: 2
  files: 2
status: complete
---

# Phase 10 Plan 01: Port the Math Brain Summary

Ported the validated, tuned 6–9-weighted multiplication question selector + in-memory EWMA accuracy weighting from `archive/math-lab.html` into a new pure ES module `src/math/brain.js` exposing a `createBrain()` factory (`nextQuestion()` + `reportResult()`), with a provable GATE-06 firewall (zero engine imports, headless node-importable), plus `CONFIG.BRAIN`/`CONFIG.GATE` namespaces in `src/config.js`.

## What Was Built

- **`src/config.js` — CONFIG.BRAIN + CONFIG.GATE.** `BRAIN` ports the archive's EWMA/table constants verbatim (ACCURACY_ALPHA 0.15, MASTERY_THRESHOLD 0.80, STRUGGLE_THRESHOLD 0.60, STRUGGLE_BOOST 1.5, MASTERY_WINDOW 10, HARD_TABLES [6,7,8,9], EASY_TABLES [1,2,3,4,5]). `GATE` adds panel/dim UI constants (DIM_OPACITY 0.6, PANEL_W 420, PANEL_H 220) for Plan 02. All XP/dungeon constants intentionally dropped.
- **`src/math/brain.js` — pure weighted brain (NEW).** `createBrain()` returns a fresh closure holding its own `accuracy` (hard tables seeded 0.4, easy 0.5) and `history`. Ported verbatim: `shuffle` (Fisher-Yates), `getAccuracy`, `isMastered`, `calculateWeights` (the locked 6–9 bias math), `weightedRandom`, `generateDistractors`. `nextQuestion()` returns `{ a, b, answer, choices }` with 4 distinct shuffled choices (answer included); `reportResult(table, isCorrect)` applies the EWMA update.

## Task-by-Task

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add CONFIG.BRAIN + CONFIG.GATE namespaces | 31746bc | src/config.js |
| 2 | Port pure weighted brain (TDD: RED smoke → GREEN impl) | 55d898d | src/math/brain.js |

## Verification Results

- `node --check src/config.js` and `node --check src/math/brain.js` — pass.
- Headless smoke (1000× `nextQuestion()` on a fresh brain): every result has `choices.length===4`, `choices.includes(answer)`, `answer===a*b`; **78.2%** of `a` values in [6,7,8,9] (>50% hard bias, GATE-02).
- Distinctness: over 2000 draws all 4 choices are distinct positive integers.
- Anti-leak: `createBrain() !== createBrain()`; no top-level `let accuracy`/`let history`; factory yields independent instances.
- Firewall (GATE-06): no non-comment `kaplay`; `grep -L kaplay` lists the file; brain imports only `../config.js`; no `XpCalculator|DUNGEON|level++|combat|potion|SAVE_KEY|toJSON|fromJSON` anywhere; one-way dependency (no import of mathGate/scenes).
- Config firewall: no `XP_EASY|XP_HARD|BASE_XP|LEVEL_MULT|SAVE_KEY|DUNGEON` in config.js.

## TDD Gate Compliance

This is a no-test-framework project (project canon: `node --check` + headless smoke + structural greps replace a unit harness). For Task 2 (`tdd="true"`): the RED gate was the plan's headless smoke failing against the missing module (`MODULE_NOT_FOUND` confirmed before implementation); the GREEN gate is commit 55d898d, after which the same smoke passes (4-choice, answer-included, 78% hard bias). The module is a verbatim port of already-validated logic, so no REFACTOR gate was needed. Both gate commits are a single `feat` commit per the project's no-separate-test-file canon (there is no `test(...)` target file to commit independently).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Doc-header tokens tripped the firewall negative-grep**
- **Found during:** Task 2 verification.
- **Issue:** The doc-header comment listing the DROPPED subsystems used the literal identifier tokens (`XpCalculator`, `toJSON/fromJSON`, `DUNGEON`, `combat`, `potion`). The acceptance criterion requires `grep -Eqi 'XpCalculator|DUNGEON|...|toJSON|fromJSON'` to find NOTHING anywhere in the file — including comments — so the explanatory header failed its own firewall gate.
- **Fix:** Rephrased the header to describe the dropped concepts in prose ("the experience/leveling math, the save/load persistence layer, the HP/encounter/consumable subsystem, and the game state machine") without using the forbidden tokens.
- **Files modified:** src/math/brain.js
- **Commit:** 55d898d (fixed before the task commit)

## Known Stubs

None. The brain is fully functional and headlessly verified. (The gate UI that consumes it is Plan 02; this plan's surface is complete.)

## Notes for Next Plan (10-02)

- Import the factory: `import { createBrain } from "../math/brain.js";` and read panel/dim from `CONFIG.GATE.*`.
- `nextQuestion()` returns `{ a, b, answer, choices }` — build the display string yourself (`q.a + " × " + q.b`); the brain deliberately does not provide one.
- Push results back one-way via `brain.reportResult(q.a, correct)`; the brain never imports the gate.

## Self-Check: PASSED

- FOUND: src/math/brain.js
- FOUND: src/config.js (CONFIG.BRAIN + CONFIG.GATE present)
- FOUND commit 31746bc (config namespaces)
- FOUND commit 55d898d (brain port)
