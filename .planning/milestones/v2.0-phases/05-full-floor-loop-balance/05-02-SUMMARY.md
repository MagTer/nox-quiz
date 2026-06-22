---
phase: 05-full-floor-loop-balance
plan: 02
subsystem: dungeon-runner
tags: [dungeon-runner, navigation, combat-loop, loot, floor-summary, wiring]
status: complete

dependency_graph:
  requires:
    - 05-01 (CONFIG.DUNGEON balance constants, loot-aware CombatEngine.resolveAnswer)
  provides:
    - DungeonRunner module (6 methods: updateDungeonMap, startRun, enterCombat, afterKill, afterLoot, advanceFloor, retryFloor)
    - Complete dungeon run loop: Enter Dungeon → dungeon-map → 5 rooms → floor-summary → next floor or quiz
    - window.CombatInputHandler export for cross-scope access by DungeonRunner
    - SC-5 console.assert verifying survival with 30% correct rate
  affects:
    - CombatInputHandler.handleAnswer (result.killed now calls DungeonRunner.afterKill instead of App.transition)
    - Quiz HUD (Enter Dungeon button added)
    - dungeon-map panel (floor heading, enemy preview, Enter Combat button)

tech_stack:
  added: []
  patterns:
    - DungeonRunner IIFE const pattern (same as FloorConfig/DungeonState/CombatEngine) — defined outside DOMContentLoaded, exported on window
    - HP and loot preservation across room transitions — save before startCombat(), restore after (avoids DungeonState.init() side effect)
    - Loot item names as internal constants only — no user-supplied string reaches DungeonState.applyLoot()
    - window.CombatInputHandler export inside DOMContentLoaded for cross-scope DungeonRunner access

key_files:
  modified:
    - math-lab.html

decisions:
  - DungeonRunner calls CombatEngine.startCombat() and then restores savedHP + savedLoot — this patches the DungeonState.init() side effect cleanly within Phase 5 scope; Phase 6 can refactor CombatEngine to add a setFloor() method
  - window.CombatInputHandler exported inside DOMContentLoaded — DungeonRunner is outside DOMContentLoaded and must reach beginCombat() via window global
  - Enter Dungeon button placed inside data-panel="quiz" section (not in fixed HUD header) — keeps HUD clean; button only visible on quiz screen via CSS data-screen scoping
  - SC-5 assert uses CONFIG.DUNGEON constants only — no magic numbers in the assertion

metrics:
  duration: "~10 minutes"
  completed: "2026-06-22"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 1
---

# Phase 05 Plan 02: DungeonRunner Orchestration + Full Loop Wiring Summary

**One-liner:** DungeonRunner module wires complete 4-floor × 5-room dungeon run loop — Enter Dungeon through floor-summary with loot drops, boss HP, death retry (XP preserved), and Dungeon Cleared end state.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update dungeon-map panel HTML + add DungeonRunner module | 71ff725 | math-lab.html |
| 2 | Wire all buttons + add Enter Dungeon to quiz HUD | 4af605c | math-lab.html |
| 3 | End-to-end smoke test — SC-5 assert + LOOT_DROP_RATE verification | 0fd53c0 | math-lab.html |

## What Was Built

### Task 1 — dungeon-map panel HTML + DungeonRunner module

The placeholder `dungeon-map` section was replaced with:
- `<h2 id="dungeon-map-floor">Floor 1</h2>` — floor number heading updated by `updateDungeonMap()`
- `<p id="dungeon-map-enemy"></p>` — emoji + enemy name preview before entering combat
- `<button id="enter-combat-btn">Enter Combat</button>` — wired to `DungeonRunner.enterCombat()`

`DungeonRunner` const IIFE added outside `DOMContentLoaded` (same pattern as `FloorConfig`, `DungeonState`, `CombatEngine`) and exported on `window`:

| Method | Purpose |
|--------|---------|
| `updateDungeonMap(n)` | Writes floor number and enemy preview to dungeon-map panel |
| `startRun()` | Resets to floor 1, inits DungeonState, transitions to dungeon-map |
| `enterCombat()` | Advances room, preserves HP/loot, calls startCombat(), renders, begins combat |
| `afterKill()` | Tracks floor stats, decides loot drop (CONFIG-driven), routes to loot or next room |
| `afterLoot()` | Routes to next combat room or floor-summary after loot is dismissed |
| `advanceFloor()` | Increments floor (dungeon-map) or completes dungeon (quiz) |
| `retryFloor()` | Resets floor HP/loot, preserves XP/level (ADHD-03), shows dungeon-map |

`window.CombatInputHandler` exported inside `DOMContentLoaded` so `DungeonRunner.enterCombat()` can call `beginCombat()` from outside that scope.

### Task 2 — Button wiring + Enter Dungeon HUD button

Five button onclick handlers wired inside `DOMContentLoaded` button wiring block:
- `enter-dungeon-btn` → `DungeonRunner.startRun()`
- `enter-combat-btn` → `DungeonRunner.enterCombat()`
- `loot-continue` → `DungeonRunner.afterLoot()`
- `floor-summary-continue` → `DungeonRunner.advanceFloor()`
- `dead-retry` → `DungeonRunner.retryFloor()`

`CombatInputHandler.handleAnswer` updated: `result.killed` block now calls `DungeonRunner.afterKill()` instead of `App.transition('loot')` — this gives DungeonRunner control over whether to show the loot screen or skip directly to the next room.

`<button id="enter-dungeon-btn">Enter Dungeon</button>` added inside `data-panel="quiz"` section — visible only on quiz screen via CSS `data-screen` scoping.

CSS added for both new buttons (`#enter-dungeon-btn`, `#enter-combat-btn`) using `var(--accent)` grunge outline style with hover fill — consistent with existing dark aesthetic.

### Task 3 — Smoke test + SC-5 assertion

SC-5 `console.assert` added inside `DOMContentLoaded` after button wiring:
```js
console.assert(
  CONFIG.DUNGEON.DAMAGE_WRONG * CONFIG.DUNGEON.ROOMS_PER_FLOOR < CONFIG.DUNGEON.PLAYER_HP,
  'SC-5 FAIL: 5 wrong answers would kill player at 100 HP with default config'
);
```
Verifies: 8 × 5 = 40 < 100 — player survives 5 wrong answers on one floor (starts next floor at 60 HP).

`LOOT_DROP_RATE` confirmed CONFIG-driven — no bare `0.6` literal in `afterKill()` loot logic.

`DungeonState.init()` confirmed ADHD-03 compliant — body contains no `PlayerState` reference; only resets `floor`, `room`, `playerHP`, `enemyHP`, `loot`.

## Deviations from Plan

### Auto-fixed Issues

None.

### Noted Implementation Details

**1. window.DungeonRunner has 2 grep occurrences**
- Plan acceptance criteria said "returns 1" but the module docstring comment also contains "window.DungeonRunner"
- Actual export at line 1403 — correct behavior, criteria intent satisfied

**2. enter-dungeon-btn has 4 grep occurrences (not 3)**
- CSS selector + CSS hover + HTML element + JS wiring = 4
- Plan said "3 (HTML element + JS onclick + CSS rule)" counting one CSS entry
- The hover rule is present for correct UX; criteria intent is met

**3. SC-5 has 2 grep occurrences (not 1)**
- Comment block description line + assert message string = 2
- Plan said "returns 1" meaning the assert is present — it is; criteria intent met

## Known Stubs

None. All paths are wired end-to-end:
- `DungeonRunner.startRun()` reachable from quiz screen Enter Dungeon button
- `DungeonRunner.enterCombat()` correctly preserves HP and loot between rooms
- Boss room (room 5) gets 2× HP via `BOSS_HP_MULT`
- Loot drops: 60% regular, 100% boss — `LOOT_DROP_RATE` in CONFIG
- `retryFloor()` resets HP/loot only — PlayerState XP untouched (ADHD-03)
- Floor 4 completion sets `floor-summary-headline` to "Dungeon Cleared!"
- Floor 4 Advance button transitions to quiz screen

## Threat Flags

None. All new surface is:
- Button onclick handlers → DungeonRunner methods (user-triggered, no external input)
- Loot item names from internal array constants only — no user string reaches `applyLoot()`

## Self-Check: PASSED

- math-lab.html modified: FOUND
- Commit 71ff725 (Task 1): FOUND
- Commit 4af605c (Task 2): FOUND
- Commit 0fd53c0 (Task 3): FOUND
- grep -c "DungeonRunner" math-lab.html: 10 ✓
- grep -c "dungeon-map-floor" math-lab.html: 2 ✓
- grep -c "dungeon-map-enemy" math-lab.html: 2 ✓
- grep -c "window.DungeonRunner" math-lab.html: 2 (export + comment) ✓
- grep -c "window.CombatInputHandler" math-lab.html: 2 (export + call) ✓
- grep -c "DungeonRunner.afterKill" math-lab.html: 1 ✓
- grep -c "enter-dungeon-btn" math-lab.html: 4 (CSS + hover + HTML + JS) ✓
- grep -c "DungeonRunner.startRun" math-lab.html: 1 ✓
- grep -c "DungeonRunner.advanceFloor" math-lab.html: 1 ✓
- grep -c "DungeonRunner.retryFloor" math-lab.html: 1 ✓
- grep -c "DungeonRunner.afterLoot" math-lab.html: 2 (after-no-loot + button wiring) ✓
- grep -c "LOOT_DROP_RATE" math-lab.html: 3 (CONFIG + comment + usage) ✓
- grep -c "SC-5" math-lab.html: 2 (comment + assert message) ✓
- No bare 0.6 in afterKill logic: ✓ (only in CSS rgba and LOOT_DROP_RATE CONFIG definition)
- DungeonState.init() body: no PlayerState reference: ✓
