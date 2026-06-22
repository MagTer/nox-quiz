---
phase: 01-mvp-core-loop-adhd-safe-mechanics
plan: "03"
subsystem: question-selection
status: complete
tags:
  - html
  - vanilla-js
  - weighted-random
  - adaptive-difficulty
  - accuracy-tracking

dependency_graph:
  requires:
    - phase: 01-01
      provides: QuestionSelector stub (naive random), PlayerState.getAccuracy/isMastered
    - phase: 01-02
      provides: PersistenceStore.save (accuracy persists on every answer)
  provides:
    - QuestionSelector full weighted implementation (calculateWeights, weightedRandom, generateDistractors, shuffle, selectNext)
    - debugAccuracy() DevTools helper for UAT
  affects:
    - plan-04 (CSS grain texture and WCAG audit — no question-selection dependency)

tech_stack:
  added: []
  patterns:
    - Weighted random selection via (1-acc)^1.5 exponent for hard tables and (1-acc)^0.8 * 0.3 for easy tables
    - Struggling boost: accuracy < 0.60 applies 1.5x multiplier to table weight
    - Mastery reduction: isMastered(table) applies 0.3x multiplier (table still selectable)
    - Edge case guard: if all weights sum to zero (all mastered), reset to equal 1.0 per table
    - Fisher-Yates (Knuth) uniform shuffle for answer position randomisation (not biased sort)
    - Distractor deduplication via Set with positive and != answer filter

key_files:
  created: []
  modified:
    - math-lab.html

decisions:
  - "calculateWeights uses exponent 1.5 for hard tables and 0.8 for easy tables — hard tables get ~76% baseline weight with default accuracy (0.4 for hard, 0.5 for easy)"
  - "Wrong-table distractor uses first hard table that isn't the current table — plausible near-answer without being identical multiplier"
  - "debugAccuracy() placed inside DOMContentLoaded so it captures PlayerState closure — exposed on window for DevTools access"
  - "Verify check regexes in plan had false negatives (multi-line call, CONFIG.MASTERY_WINDOW vs literal 10) — code is correct; regex bugs documented as deviation"

metrics:
  duration_minutes: 2
  completed_date: "2026-06-20"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 01 Plan 03: Weighted QuestionSelector and Accuracy Wiring — Summary

**Full weighted QuestionSelector replacing naive stub: hard tables get ~76% selection weight, struggling tables get 1.5x boost, mastered tables get 0.3x reduction; Fisher-Yates shuffle ensures unbiased answer positions; per-table EWMA accuracy persisted on every answer via PersistenceStore.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-20T17:34:48Z
- **Completed:** 2026-06-20T17:36:50Z
- **Tasks:** 2 completed of 2
- **Files modified:** 1 (math-lab.html)

## Accomplishments

- Replaced the naive uniform-random QuestionSelector with a full weighted implementation driven by PlayerState accuracy
- `calculateWeights(playerState)` builds a 9-table weight map: hard tables use `(1-acc)^1.5`, easy tables use `(1-acc)^0.8 * 0.3`; struggling tables below 60% accuracy get 1.5x boost; mastered tables get 0.3x reduction; edge case guard resets all weights to 1.0 if total rounds to zero
- `weightedRandom(weights)` performs a weighted random roll with a floating-point-safe fallback to `CONFIG.HARD_TABLES[0]`
- `generateDistractors(answer, table, multiplicand)` uses a Set for deduplication: ±1/±2 same-table candidates + one wrong-table distractor; extends with ±3 offset if pool < 3; last-resort pad ensures exactly 3 distractors (never duplicates, never equal to answer, never negative)
- Fisher-Yates (Knuth) in-place shuffle replaces any sort-based approach; verified uniform distribution
- `selectNext(playerState)` is the new public API replacing `selectNext()` — `App.nextQuestion()` updated to pass `PlayerState`
- Task 2 audit confirmed `InputHandler.handleAnswer` wiring was already correct from Plan 01: `updateAccuracy` is called after every answer (both correct and wrong), immediately followed by `PersistenceStore.save(PlayerState)`
- Added `window.debugAccuracy()` DevTools helper showing per-table accuracy and mastery state for UAT

## Task Commits

1. **Task 1: Replace Naive QuestionSelector with Full Weighted Implementation** — `5f0c881` (feat)
2. **Task 2: Verify Per-Table Accuracy Drives Question Selection (PROG-03)** — `56e8380` (feat)

## Files Created/Modified

- `math-lab.html` — QuestionSelector full replacement (calculateWeights, weightedRandom, generateDistractors, shuffle, selectNext); App.nextQuestion() passes PlayerState; window.debugAccuracy() added

## Decisions Made

- `calculateWeights` uses exponent 1.5 for hard tables (steeper penalty as accuracy rises) and 0.8 for easy tables (gentler penalty, suppressed further by 0.3 scalar) — hard tables average ~76% weight at default accuracy (0.4 hard, 0.5 easy)
- Wrong-table distractor picks `CONFIG.HARD_TABLES.find(t => t !== table)` — always a hard table for a more challenging wrong answer, not a trivially easy multiplier
- `debugAccuracy()` is placed inside DOMContentLoaded to capture the correct PlayerState closure scope, then exposed on `window` for DevTools access; no UI element added
- Verified plan verify-check regexes had false negatives (see Deviations) but the code is functionally correct

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's automated verify regexes had false negatives**
- **Found during:** Task 2 automated verify
- **Issue:** The verify script regex `/updateAccuracy\s*\(.*\.table.*isCorrect/` uses `.` which doesn't match newlines — the actual code splits the call across three lines. The second regex `h\.length\s*<\s*10` doesn't match our code which uses the named constant `CONFIG.MASTERY_WINDOW`. Both represent regex bugs in the plan, not bugs in the implementation.
- **Fix:** Re-ran with corrected multiline regexes and verified all checks pass; code is correct. Documented here for traceability.
- **Files modified:** None — code was already correct
- **Commit:** N/A (no code change needed)

## Known Stubs

| Stub | File | Behavior | Plan that resolves it |
|------|------|----------|-----------------------|
| `body::after` grain texture `background-image` is empty | math-lab.html | No grain texture rendered | Plan 04 |

All other stubs from Plan 01 and 02 have been resolved by Plan 03.

## Threat Surface Scan

No new threat surface introduced. All T-03-xx threats addressed per plan:

- **T-03-01 (accept):** Self-manipulation of localStorage accuracy values — accepted as single-device solo game. Numeric range validation in `fromJSON` (0–1) prevents nonsensical values from crashing `calculateWeights`.
- **T-03-02 (mitigate):** Distractor duplicating correct answer — mitigated by `Set` deduplication with `v !== answer && v > 0` filter in `generateDistractors`; every candidate is filtered before being added to the pool.
- **T-03-03 (mitigate):** Answer position bias — mitigated by Fisher-Yates (Knuth) uniform shuffle replacing any sort-based approach; commented explicitly in code.

## Verification Results

All automated checks passed (with corrected multiline regexes):

- Task 1: calculateWeights, weightedRandom, generateDistractors, Fisher-Yates comment, Fisher-Yates algorithm, no biased sort, STRUGGLE_THRESHOLD, STRUGGLE_BOOST, isMastered, selectNext(playerState), App passes PlayerState, naive comment removed — all PASSED
- Task 2: updateAccuracy called in handleAnswer (multiline match), ACCURACY_ALPHA 0.15, MASTERY_WINDOW 10, MASTERY_THRESHOLD 0.8, STRUGGLE_THRESHOLD 0.6, debugAccuracy, isMastered checks window length — all PASSED
- Logic simulation: 200-question distribution shows 77.5% hard tables / 22.5% easy tables (target 70%/30%, ±10% acceptable)
- EWMA simulation: after 5 wrong answers on table 8, accuracy drops to 0.177 (below 0.60 struggle threshold — gets 1.5x boost); after 10 correct on table 7, isMastered(7) returns true

## Self-Check

### Files exist:
- [x] `/home/magnus/dev/math-lab/math-lab.html` — FOUND

### Commits exist:
- [x] `5f0c881` — feat(01-03): replace naive QuestionSelector with full weighted implementation
- [x] `56e8380` — feat(01-03): add debugAccuracy helper; verify EWMA and mastery wiring (PROG-03)

## Self-Check: PASSED
