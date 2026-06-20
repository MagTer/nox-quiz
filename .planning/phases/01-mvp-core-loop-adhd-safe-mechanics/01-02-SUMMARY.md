---
phase: 01-mvp-core-loop-adhd-safe-mechanics
plan: "02"
subsystem: persistence
tags:
  - html
  - vanilla-js
  - localStorage
  - xp-system
  - accessibility

dependency_graph:
  requires:
    - phase: 01-01
      provides: PersistenceStore stub, PlayerState.toJSON/fromJSON, Renderer.renderXpBar
  provides:
    - PersistenceStore full implementation (load, save, defaults)
    - Versioned JSON save schema (mathlab_save_v1, version: 1)
    - PlayerState.fromJSON hardened for JSON string-keyed accuracy/history
    - visibilitychange + beforeunload save triggers
    - renderXpBar with clamping, DocumentFragment, and xpBar.title tooltip
  affects:
    - plan-03 (QuestionSelector reads PlayerState.getAccuracy — accuracy now persisted)
    - plan-04 (CSS and UX audit may inspect HUD behavior)

tech_stack:
  added:
    - localStorage API (active — versioned save/load with QuotaExceededError handling)
  patterns:
    - Versioned save schema with forward-compat defaults() factory
    - try/catch wrapper around all localStorage operations (never throws to caller)
    - Object.entries iteration with parseInt key validation (mitigates prototype pollution T-02-02)
    - visibilitychange + beforeunload dual-trigger save strategy
    - DocumentFragment for batch DOM insertion (single reflow for 20-segment XP bar)
    - xpBar.title tooltip for accessibility

key_files:
  created: []
  modified:
    - math-lab.html

key-decisions:
  - "PersistenceStore uses CONFIG.SAVE_KEY (not hardcoded string) — single source of truth for storage key"
  - "defaults() factory returns canonical initial state matching PlayerState closure defaults — avoids drift"
  - "fromJSON uses Object.entries + parseInt rather than numeric key lookup — handles JSON string-key coercion correctly"
  - "visibilitychange preferred over beforeunload as primary save trigger — more reliable on mobile"
  - "xpBar.innerHTML cleared before DocumentFragment append — clean slate prevents segment accumulation"

patterns-established:
  - "All localStorage ops wrapped in try/catch; game continues in memory if storage fails"
  - "XP bar always clamped: Math.min(SEGMENT_COUNT, Math.max(0, filledCount))"

requirements-completed:
  - PROG-01
  - PROG-02

duration: 2min
completed: "2026-06-20"
status: complete
---

# Phase 01 Plan 02: Persistence and XP Bar Hardening — Summary

**Versioned localStorage save/load with QuotaExceededError handling, dual-trigger save strategy, and DocumentFragment XP bar with accessibility tooltip — XP and level survive page reload.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-20T17:30:08Z
- **Completed:** 2026-06-20T17:32:14Z
- **Tasks:** 2 completed of 2
- **Files modified:** 1 (math-lab.html)

## Accomplishments

- Replaced PersistenceStore stub with full versioned localStorage implementation: `load()` validates version, xp, level fields and returns `defaults()` on any corruption; `save(playerState)` catches QuotaExceededError and logs a warning — game never crashes
- PlayerState.fromJSON hardened to handle JSON string-keyed accuracy and history objects (JSON.parse always coerces numeric keys to strings); uses Object.entries + parseInt + range validation, directly mitigating T-02-02 prototype pollution
- Added visibilitychange and beforeunload save triggers — progress is saved on every answer, on tab hide, and on window close
- Renderer.renderXpBar hardened: filledCount clamped to prevent over-full/negative bar, DocumentFragment batch insert reduces reflows from 20 to 1, xpBar.title tooltip shows "N / M XP" for accessibility
- Verified updateHud is called after fromJSON in bootstrap — returning users see their saved XP bar state immediately on page load

## Task Commits

1. **Task 1: Replace PersistenceStore Stub with Full localStorage Implementation** — `c546e91` (feat)
2. **Task 2: Verify XP Bar Renders Correctly at All Fill States (PROG-02)** — `90acd6b` (feat)

## Files Created/Modified

- `math-lab.html` — PersistenceStore full implementation, PlayerState.fromJSON hardened, renderXpBar clamped + DocumentFragment + tooltip, visibilitychange + beforeunload event listeners

## Decisions Made

- Used `CONFIG.SAVE_KEY` (not a hardcoded string) inside PersistenceStore — single source of truth prevents key drift across plans
- `defaults()` factory mirrors PlayerState closure defaults exactly (accuracy 0.5 for easy, 0.4 for hard tables) — avoids save-schema drift
- `fromJSON` uses `Object.entries` + `parseInt` iteration rather than numeric index lookup, because JSON.parse returns string-keyed objects for all numeric properties
- `visibilitychange` is the primary save trigger (preferred over `beforeunload` per RESEARCH.md — more reliable on mobile and Firefox)
- DocumentFragment used in `renderXpBar` — creates all 20 segments off-DOM, appends in one operation, then clears and appends the fragment

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. All automated checks passed on first attempt.

## Known Stubs

| Stub | File | Behavior | Plan that resolves it |
|------|------|----------|-----------------------|
| `QuestionSelector.selectNext()` uses naive uniform random | math-lab.html | All 9 tables equally likely; no accuracy weighting | Plan 03 |
| `body::after` grain texture `background-image` is empty | math-lab.html | No grain texture rendered | Plan 04 |

These stubs are intentional carry-overs from Plan 01 and do not affect PROG-01 or PROG-02.

## Threat Surface Scan

No new threat surface introduced. All T-02-xx threats addressed per plan:

- **T-02-01 (mitigate):** `PersistenceStore.load()` validates `xp` (finite number >= 0) and `level` (integer >= 1) before calling `fromJSON`; `fromJSON` validates accuracy values (0–1 float), history values (boolean array), and table keys (1–9 integer).
- **T-02-02 (mitigate):** `fromJSON` uses `Object.entries` + `parseInt` + explicit range check — never spreads raw parsed object into PlayerState closure variables.
- **T-02-03 (mitigate):** `try/catch` in `save()` catches `QuotaExceededError` with console.warn; game continues in memory.

## Self-Check

### Files exist:

- [x] `/home/magnus/dev/math-lab/math-lab.html` — FOUND

### Commits exist:

- [x] `c546e91` — feat(01-02): implement PersistenceStore with versioned localStorage save/load
- [x] `90acd6b` — feat(01-02): harden XP bar rendering with clamping, DocumentFragment, and tooltip

## Self-Check: PASSED
