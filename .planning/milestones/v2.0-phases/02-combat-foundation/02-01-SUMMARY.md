---
phase: 02-combat-foundation
plan: "01"
subsystem: game-logic
tags: [config, state-machine, enemy-config, dungeon-crawler]
status: complete

dependency_graph:
  requires: []
  provides:
    - CONFIG.DUNGEON (11 named constants for HP, damage, XP, keys)
    - GameFSM (5-state machine, 9 legal transitions, window.GameFSM)
    - FloorConfig (3 enemy definitions with table pools, window.FloorConfig)
  affects:
    - Plan 02 (CombatEngine reads CONFIG.DUNGEON; DungeonState uses GameFSM)
    - Plan 03 (QuestionSelector integration uses FloorConfig.tablePools)

tech_stack:
  added: []
  patterns:
    - IIFE closure module pattern (established in v1, extended for GameFSM and FloorConfig)
    - CONFIG sub-object extension (CONFIG.DUNGEON appended after literal close)
    - window.* export for DevTools console testing (mirrors v1 debugAccuracy pattern)

key_files:
  modified:
    - path: math-lab.html
      changes: >
        Added CONFIG.DUNGEON (11 constants) after MODULE 1 close.
        Added MODULE 6 GameFSM IIFE (5 states, 9 legal transitions) after QuestionSelector.
        Added MODULE 7 FloorConfig IIFE (3 floors, shallow-copy getFloor) after GameFSM.
        Both modules exposed on window for console testing.

decisions:
  - TRANSITIONS map uses plain arrays (not Set) — simpler and fast enough for 5 states
  - FloorConfig uses Object.assign + spread array for shallow copy — satisfies T-02-03 (copy not reference)
  - No magic numbers inside FloorConfig IIFE body — all HP/XP read from CONFIG.DUNGEON constants

metrics:
  duration_seconds: 135
  completed_date: "2026-06-21"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 1
---

# Phase 02 Plan 01: Combat Foundation Logic Summary

**One-liner:** CONFIG.DUNGEON constants, GameFSM 5-state machine, and FloorConfig enemy table — pure JS logic layer for dungeon combat, verified via console.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend CONFIG with CONFIG.DUNGEON sub-object | f5c5872 | math-lab.html |
| 2 | Implement GameFSM state machine (DC-02) | f99ebcd | math-lab.html |
| 3 | Implement FloorConfig module (ENE-01, ENE-02, DIFF-01) | 2ac9382 | math-lab.html |

## What Was Built

### Task 1: CONFIG.DUNGEON

Appended `CONFIG.DUNGEON` as a separate statement directly after the existing CONFIG object literal (`};` on line 322). Contains exactly 11 named constants:

- `PLAYER_HP: 100`, `DAMAGE_CORRECT: 3`, `DAMAGE_WRONG: 8`
- `GOBLIN_HP: 9`, `SKELETON_HP: 15`, `DRAGON_HP: 21`
- `GOBLIN_XP: 30`, `SKELETON_XP: 50`, `DRAGON_XP: 80`
- `ROOMS_PER_FLOOR: 5`, `SAVE_KEY_V2: 'mathlab_save_v2'`

All v1 CONFIG keys (XP_EASY, SAVE_KEY, etc.) are untouched.

### Task 2: GameFSM

IIFE module implementing a 5-state machine with 9 legal transitions enforced via a TRANSITIONS plain-object map. Illegal transitions throw a descriptive Error. Public API: `getState()`, `transition(next)`, `reset()`. Exposed on `window.GameFSM`.

Legal transitions:
- EXPLORE → COMBAT
- COMBAT → LOOT, FLOOR_SUMMARY, DEAD
- LOOT → COMBAT, FLOOR_SUMMARY
- FLOOR_SUMMARY → EXPLORE, DEAD
- DEAD → EXPLORE

### Task 3: FloorConfig

IIFE module with private FLOORS map for 3 enemy types. All HP and XP values reference CONFIG.DUNGEON constants — no magic numbers inside the IIFE body. `getFloor()` returns shallow copies (Object.assign + spread array) so callers cannot mutate internal state. `getAllFloors()` returns array of 3 with floor property attached. Exposed on `window.FloorConfig`.

Floor definitions:
- Floor 1: Goblin 👺, hp: 9, xp: 30, tablePools: [2,3,5]
- Floor 2: Skeleton 💀, hp: 15, xp: 50, tablePools: [4,6,7]
- Floor 3: Dragon 🐉, hp: 21, xp: 80, tablePools: [7,8,9]

## Verification

All assertions verified via node CLI simulation:
- `CONFIG.DUNGEON.PLAYER_HP === 100` ✓
- `CONFIG.DUNGEON.DAMAGE_CORRECT === 3` ✓
- `GameFSM.getState() === 'EXPLORE'` on init ✓
- `GameFSM.transition('DEAD')` from EXPLORE throws `[GameFSM] Illegal transition` ✓
- All 9 legal transitions succeed without throwing ✓
- `FloorConfig.getFloor(1)` returns Goblin, hp 9, pools [2,3,5] ✓
- `FloorConfig.getFloor(4)` throws `[FloorConfig] Unknown floor: 4` ✓
- Copy protection: mutating returned object does not affect FLOORS internal data ✓
- `window.GameFSM` and `window.FloorConfig` accessible ✓

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — these are pure logic modules with no UI or data rendering.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. The plan's threat model covered all relevant surfaces:

- T-02-01 (GameFSM tampering): TRANSITIONS whitelist enforced — unknown state strings throw ✓
- T-02-03 (FloorConfig spoofing): shallow copies returned — internal FLOORS not exposed ✓

No additional threat flags.

## Self-Check: PASSED

- math-lab.html: FOUND ✓
- Commit f5c5872 (CONFIG.DUNGEON): FOUND ✓
- Commit f99ebcd (GameFSM): FOUND ✓
- Commit 2ac9382 (FloorConfig): FOUND ✓
- All node assertions: PASSED ✓
