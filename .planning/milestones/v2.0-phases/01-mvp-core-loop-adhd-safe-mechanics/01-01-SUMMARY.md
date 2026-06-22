---
phase: 01-mvp-core-loop-adhd-safe-mechanics
plan: "01"
subsystem: game-core
status: complete
tags:
  - html
  - vanilla-js
  - game-loop
  - xp-system
  - accessibility
dependency_graph:
  requires: []
  provides:
    - math-lab.html (complete single-file game skeleton)
    - CONFIG module (all magic numbers)
    - XpCalculator module
    - PlayerState module
    - PersistenceStore stub
    - QuestionSelector module (naive random)
    - Renderer module
    - InputHandler module
    - App bootstrap
  affects:
    - plan-02 (PersistenceStore full implementation reads PlayerState.toJSON)
    - plan-03 (QuestionSelector weighted selection replaces naive random)
    - plan-04 (CSS grain texture and WCAG verification)
tech_stack:
  added:
    - Vanilla ES2020+ JavaScript (closure modules, IIFE pattern)
    - HTML5 fieldset/legend/label/radio (accessible multiple-choice)
    - CSS custom properties + CSS keyframes (@keyframes levelUpFlash)
    - localStorage API (stubbed in Plan 01, active in Plan 02)
  patterns:
    - IIFE closure module pattern (XpCalculator, PlayerState, PersistenceStore, QuestionSelector)
    - DOM cache object (all getElementById at init, never in render loop)
    - Event delegation (single click listener on optionsList)
    - Fisher-Yates shuffle (uniform answer position distribution)
    - EWMA accuracy tracking (alpha=0.15)
    - XP surplus carry-over (xp -= threshold, not xp = 0)
key_files:
  created:
    - math-lab.html
  modified: []
decisions:
  - "PersistenceStore is a no-op stub in Plan 01 — localStorage wiring deferred to Plan 02 as designed"
  - "QuestionSelector uses naive uniform random in Plan 01 — weighted selection by accuracy deferred to Plan 03 as designed"
  - "grain texture body::after background-image left empty — SVG feTurbulence data URI added in Plan 04 as designed"
  - "Event delegation used on optionsList rather than per-item listeners — cleaner, avoids re-attaching on each question render"
  - "fromJSON validates types before assignment (xp >= 0, level >= 1, boolean arrays only) — mitigates T-01-01 prototype pollution threat"
metrics:
  duration_minutes: 4
  completed_date: "2026-06-20"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 01: Walking Skeleton — HTML + CSS + All JS Modules — Summary

**One-liner:** Single-file walking skeleton with segmented XP bar, EWMA accuracy tracking, Fisher-Yates shuffle, and 1s feedback-only auto-advance; no setInterval, no innerHTML, no timer UI.

## What Was Built

`math-lab.html` — a complete playable single-file game. The user can open it from the filesystem, see a multiplication question with 4 answer choices, click an answer, receive immediate color feedback (green = correct, red = wrong + correct revealed), earn XP (10 easy / 20 hard tables), watch the segmented XP bar fill, and trigger a level-up overlay when 200 XP is reached.

**Architecture delivered:**
- `CONFIG` plain object — all locked magic numbers from CONTEXT.md in one place
- `XpCalculator` IIFE — `getLevelThreshold(level)` exponential curve, `calculateXp(table)`
- `PlayerState` IIFE — `addXp` with surplus carry-over, EWMA accuracy, mastery window, safe `fromJSON`
- `PersistenceStore` IIFE stub — `load()` returns null, `save()` no-op; replaced in Plan 02
- `QuestionSelector` IIFE — naive uniform random, ±1/±2 distractor strategy, Fisher-Yates shuffle
- `Renderer` plain object — `updateHud`, `renderXpBar` (20 segments), `showQuestion` (textContent only), `showLevelUpOverlay`, `clearFeedback`
- `InputHandler` plain object — event delegation, 1s locked feedback window, correct/wrong/disabled CSS classes
- `App` plain object — `nextQuestion()` bootstrap

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 (HTML + CSS) | c310f05 | feat(01-01): HTML structure, CSS base theme, and CONFIG module scaffold |
| Task 2 (JS modules) | 80aba5d | feat(01-01): implement all JS modules — complete game loop walking skeleton |

## Verification Results

All automated checks passed:

- `node -e` Task 1 check: all structural elements and CSS custom properties present, no pink, no timer IDs
- `node -e` Task 2 check: all modules present (CONFIG, XpCalculator, PlayerState, QuestionSelector, Renderer, DOMContentLoaded, etc.), no setInterval, textContent used for question rendering
- Logic unit tests (Node.js): XP calculation, level thresholds, level-up with surplus carry-over, distractor generation, Fisher-Yates shuffle — all PASSED

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Behavior | Plan that resolves it |
|------|------|----------|-----------------------|
| `PersistenceStore.load()` returns `null` | math-lab.html | XP resets to 0 on page reload | Plan 02 |
| `PersistenceStore.save()` is a no-op | math-lab.html | Accuracy/XP not persisted across sessions | Plan 02 |
| `QuestionSelector.selectNext()` uses naive uniform random | math-lab.html | All 9 tables equally likely; no accuracy weighting | Plan 03 |
| `body::after` grain texture `background-image` is empty | math-lab.html | No grain texture rendered | Plan 04 |

These stubs are intentional: Plan 01 scope is the walking skeleton only. The stubs do not prevent the plan's goal (playable end-to-end game loop) from being achieved.

## Threat Surface Scan

No new threat surface beyond what is documented in the plan's threat model. All T-01-xx threats addressed:

- **T-01-01 (mitigate):** `PlayerState.fromJSON` validates types (`xp >= 0`, `level >= 1`, boolean arrays only) and only copies named keys — no `Object.assign(this, data)` spread.
- **T-01-03 (mitigate):** All content rendered with `textContent` — `Renderer.showQuestion` uses `textContent` for question text and option values; verified by automated check.
- **T-01-05 (defer to Plan 02):** `PersistenceStore` is a stub in Plan 01; `try/catch` around `localStorage.setItem` added in Plan 02 as designed.

## Self-Check

### Files exist:
- [x] `/home/magnus/dev/math-lab/math-lab.html` — FOUND (23 545 bytes)

### Commits exist:
- [x] `c310f05` — feat(01-01): HTML structure, CSS base theme, and CONFIG module scaffold
- [x] `80aba5d` — feat(01-01): implement all JS modules — complete game loop walking skeleton

## Self-Check: PASSED
