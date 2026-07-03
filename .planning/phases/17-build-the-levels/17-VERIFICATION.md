---
phase: 17-build-the-levels
verified: 2026-07-03T15:45:00Z
status: passed
score: 6/6 must-haves verified
human_sign_off: Automated real-browser boot navigates title -> select -> level-01/02/03/04 with zero runtime errors; human playtest feel-check deferred to Phase 19 kid-UAT.
behavior_unverified: 0
behavior_unverified_items: []
---

# Phase 17: Build the Levels Verification Report

**Phase Goal:** The game has 3–5 distinct, hand-built, completable levels wired into the registry/select, each traversable start→goal on the existing movement/collider spine, with a gentle platforming difficulty ramp.
**Verified:** 2026-07-03T15:45:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | LVL-01: 4 levels are registered in `src/levels/index.js` and selectable from level-select | ✓ VERIFIED | `LEVEL_ORDER` length is 4; smoke-progress asserts `LEVEL_ORDER.length === 4`; browser-boot clicks through level-01..04. |
| 2 | LVL-01: Each level has a distinct hand-authored descriptor file | ✓ VERIFIED | `src/levels/level-02.js`, `level-03.js`, `level-04.js` exist and `node --check` passes. |
| 3 | LVL-04: Platforming difficulty ramps by level length and hazard density | ✓ VERIFIED | `bounds.right`: 2240 -> 2800 -> 3400 -> 4000; spike counts: 2 -> 4 -> 6 -> 7. |
| 4 | LVL-04: Table difficulty ramps on a decoupled axis from platforming | ✓ VERIFIED | `allowedTables`: level-01 [6,7,8,9], level-02 [1..7], level-03 [3..9], level-04 [6..9]. |
| 5 | LVL-01: Levels are wired into the registry/select with no build step | ✓ VERIFIED | `src/levels/index.js` exports the new levels; `src/scenes/select.js` derives unlock from `cleared` facts. |
| 6 | Integration: camera clamps to per-level bounds and levels load without runtime errors | ✓ VERIFIED | `src/camera.js` accepts `bounds`; `src/scenes/game.js` passes `level.bounds`; browser-boot loads every level with zero errors. |

**Score:** 6/6 truths verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/levels/level-02.js` | New level descriptor | ✓ EXISTS | "The Rusted Climb", bounds 2800, tables [1..7], 4 spikes, 1 door, 2 gates. |
| `src/levels/level-03.js` | New level descriptor | ✓ EXISTS | "The Hollow", bounds 3400, tables [3..9], 6 spikes, 1 enemy, 1 collect zone, 1 gate. |
| `src/levels/level-04.js` | New level descriptor | ✓ EXISTS | "The Last Span", bounds 4000, tables [6..9], 7 spikes, 1 door, 2 gates, 1 enemy, 1 collect zone. |
| `src/levels/index.js` | Registry with 4 levels | ✓ UPDATED | `LEVEL_ORDER` contains all four levels. |
| `src/camera.js` | Per-level bounds support | ✓ UPDATED | `followCamera(target, bounds?)` clamps to bounds. |
| `scripts/smoke-progress.mjs` | Geometry fixtures for 4 levels | ✓ UPDATED | Fixtures exist and exit 0. |
| `scripts/browser-boot.mjs` | Loads all levels | ✓ UPDATED | Pre-seeds save, navigates title -> select -> all levels. |

**Artifacts:** 7/7 verified.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Real-browser boot across all levels | `node scripts/browser-boot.mjs` | PASS | ✓ PASS |
| Structural firewall gate | `bash scripts/check-gate.sh` | PASS | ✓ PASS |
| Import-safety / a727c13 gate | `bash scripts/check-import-safety.sh` | PASS | ✓ PASS |
| ADHD-safety gate | `bash scripts/check-safety.sh` | PASS | ✓ PASS |
| Progress/level smoke | `node scripts/smoke-progress.mjs` | PASS | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| LVL-01 | 17-02, 17-03 | 3–5 distinct hand-built levels wired into registry/select | ✓ SATISFIED | 4 levels registered and selectable. |
| LVL-04 | 17-02 | Gentle platforming difficulty ramp | ✓ SATISFIED | Length and hazard density increase progressively. |

No orphaned requirements.

## Gaps Summary

No gaps. All requirements are satisfied and the static suite + automated browser boot across all levels are green. A manual playtest feel-check is deferred to Phase 19 consolidated kid-UAT.

---

_Verified: 2026-07-03T15:45:00Z_
_Verifier: Claude (gsd-executor)_
