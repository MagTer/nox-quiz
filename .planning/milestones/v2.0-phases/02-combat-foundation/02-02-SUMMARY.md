---
phase: 02-combat-foundation
plan: "02"
subsystem: game-logic
tags: [combat, state, dungeon, session-state, xp]
status: complete

dependency_graph:
  requires:
    - Plan 01 (CONFIG.DUNGEON, GameFSM, FloorConfig)
  provides:
    - DungeonState (session-scoped HP/loot/floor tracking, window.DungeonState)
    - CombatEngine (HP math, damage resolution, XP awarding, FSM transitions, window.CombatEngine)
  affects:
    - Plan 03 (QuestionSelector integration reads floorDef.tablePools from CombatEngine.getState())

tech_stack:
  added: []
  patterns:
    - IIFE closure module pattern (consistent with GameFSM and FloorConfig from Plan 01)
    - All damage/HP constants from CONFIG.DUNGEON — zero magic numbers in logic bodies
    - Session-scoped state (DungeonState never touches localStorage — TECH2-03 enforced by design)

key_files:
  modified:
    - path: math-lab.html
      changes: >
        Added MODULE 8 DungeonState IIFE (session state: floor, room, playerHP, enemyHP, loot).
        Added MODULE 9 CombatEngine IIFE (startCombat, resolveAnswer, getState).
        Both exposed on window for console testing.

decisions:
  - DungeonState uses Object.assign({}, loot) in get() — snapshot isolation, callers cannot mutate internal state
  - applyLoot validates by explicit item-name check and throws on unknown item — fail-fast over silent ignore
  - CombatEngine reads all damage/XP from CONFIG.DUNGEON constants — zero magic numbers, Phase 5 tuning ready
  - getState() exposes full floorDef reference (including tablePools) for Phase 3 QuestionSelector use (DIFF-02)

metrics:
  duration_seconds: 90
  completed_date: "2026-06-21"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 02 Plan 02: CombatEngine and DungeonState Summary

**One-liner:** Session-scoped DungeonState and CombatEngine IIFE modules — HP math, damage resolution, XP awarding, and FSM transitions verified via Node.js assertion suite.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement DungeonState session-scoped module (TECH2-03) | 3ae63c6 | math-lab.html |
| 2 | Implement CombatEngine (COMB-01, COMB-03, DIFF-02, PROG2-01) | 2866070 | math-lab.html |

## What Was Built

### Task 1: DungeonState (MODULE 8)

IIFE closure inserted immediately after `window.FloorConfig = FloorConfig;`. Private state: `floor`, `room`, `playerHP`, `enemyHP`, `loot`. Comment: `// Session-scoped only — never written to localStorage (TECH2-03)`.

Public API:
- `init(floorNumber)`: Resets all fields — floor, room=0, playerHP=CONFIG.DUNGEON.PLAYER_HP, enemyHP=null, loot={sword:false,shield:false,potions:0}
- `get()`: Returns plain-object snapshot; loot cloned via Object.assign — caller mutation cannot affect internal state
- `setEnemyHP(hp)`: Sets enemyHP directly (null clears active enemy)
- `setPlayerHP(hp)`: Clamps to Math.max(0, hp) — prevents negative HP (T-02-05 mitigated)
- `advanceRoom()`: Increments room counter
- `applyLoot(itemName)`: Enforces LOOT-02 (max 1 sword/shield, unlimited potions); throws on unknown item name

Exposed on `window.DungeonState`.

### Task 2: CombatEngine (MODULE 9)

IIFE closure inserted immediately after `window.DungeonState = DungeonState;`. Private state: `currentFloor`, `floorDef`.

Public API:
- `startCombat(floorNumber)`: Calls FloorConfig.getFloor, sets DungeonState enemy HP, transitions FSM to COMBAT; returns {enemy, emoji, enemyHP, playerHP}
- `resolveAnswer(isCorrect)`: Core combat tick — all damage via CONFIG.DUNGEON constants; on kill calls PlayerState.addXp(floorDef.xpReward) and transitions FSM to LOOT; on player death transitions FSM to DEAD; returns {enemyHP, playerHP, killed, died, leveledUp}
- `getState()`: Returns {floor, floorDef, enemyHP, playerHP} — floorDef.tablePools available for Phase 3 QuestionSelector (DIFF-02)

Exposed on `window.CombatEngine`.

## Verification

All assertions verified via Node.js simulation (all modules wrapped in function scope for test isolation):

- `DungeonState.init(1)` sets floor=1, room=0, playerHP=100, enemyHP=null, loot defaults ✓
- `DungeonState.setPlayerHP(-5)` clamps to 0 ✓
- `DungeonState.applyLoot('sword')` returns true first call, false second call (LOOT-02) ✓
- `DungeonState.applyLoot('potion')` increments potions each call ✓
- `DungeonState.get()` snapshot isolation — mutating returned object has no effect ✓
- `CombatEngine.startCombat(1)` returns Goblin, 9HP, 100 playerHP; FSM → COMBAT ✓
- 3 correct answers kill Goblin: r1.enemyHP=6, r2.enemyHP=3, r3.killed=true, r3.enemyHP=0 ✓
- Kill awards 30 XP (GOBLIN_XP) via PlayerState.addXp(); FSM → LOOT ✓
- Wrong answer reduces playerHP by 8 (DAMAGE_WRONG): 100→92 ✓
- Player at 8HP dies on wrong answer: playerHP=0, died=true, FSM → DEAD ✓
- Skeleton 15HP killed in 5 correct answers ✓
- Dragon 21HP killed in 7 correct answers ✓
- `CombatEngine.getState().floorDef.tablePools` is array (DIFF-02 satisfied) ✓
- localStorage contains no dungeon fields after DungeonState operations ✓
- `window.DungeonState` and `window.CombatEngine` accessible ✓

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — these are pure logic modules with no UI or data rendering.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Plan's threat model covered all relevant surfaces:

- T-02-05 (DungeonState.setPlayerHP tampering): Math.max(0, hp) clamp enforced ✓
- T-02-06 (window exposure): mirrors window.GameFSM pattern — DevTools only, no PII ✓
- DungeonState comment confirms TECH2-03 boundary: `// Session-scoped only — never written to localStorage (TECH2-03)` ✓

No additional threat flags.

## Self-Check: PASSED

- math-lab.html: FOUND ✓
- Commit 3ae63c6 (DungeonState): FOUND ✓
- Commit 2866070 (CombatEngine): FOUND ✓
- All Node.js assertions: PASSED ✓
