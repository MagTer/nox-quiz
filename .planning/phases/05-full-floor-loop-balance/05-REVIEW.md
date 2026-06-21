---
phase: 05-full-floor-loop-balance
reviewed: 2026-06-22T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - math-lab.html
findings:
  critical: 2
  warning: 2
  info: 1
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-06-22
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed the phase 5 additions to `math-lab.html`: `DungeonRunner` module, loot-aware `CombatEngine.resolveAnswer()`, eight new `CONFIG.DUNGEON` constants, `FloorConfig` floor 4, and all button wiring. The loot modifier math and FSM reset discipline are sound. Two bugs were found that affect visible game state on every boss-room fight: the enemy HP bar renders incorrectly for all boss encounters, and the floor-summary XP total is inflated by 2× for the boss kill. Both are reproducible on the first full playthrough.

---

## Critical Issues

### CR-01: Boss-room enemy HP bar always wrong — percentage calculated against base HP, not boss HP

**File:** `math-lab.html:1521`

**Issue:** `DungeonRenderer.renderCombat()` sets `_currentEnemyMaxHP` by reading `CombatEngine.getState().floorDef.hp`. That value is the **base floor HP** (e.g. 9 for Goblin), not the boss HP that was just set. The actual enemy HP going into boss combat is `floorDef.hp * BOSS_HP_MULT` (e.g. 18), but the denominator used for the width percentage stays at 9. On the first correct answer the bar appears to already be at 50%; the bar width hits 0% while the enemy still has `floorDef.hp` HP remaining, making the boss visually die half a fight early.

`DungeonRunner.enterCombat()` passes the correct `enemyHP` to `renderCombat()` (line 1345) but `renderCombat()` ignores `state.enemyHP` as the denominator and pulls from `CombatEngine` instead, defeating that correct value.

**Fix:** Pass the actual displayed `enemyHP` as the max when entering boss combat, and read it from the state argument rather than from `CombatEngine.getState()`:

```js
// DungeonRenderer.renderCombat — replace line 1521
_currentEnemyMaxHP = state.enemyHP;   // use the actual starting HP for this encounter
// Remove: _currentEnemyMaxHP = CombatEngine.getState().floorDef.hp;
```

This means `renderCombat` no longer needs to call `CombatEngine.getState()` at all, which also removes a coupling dependency.

---

### CR-02: Floor-summary XP display inflated 2× for boss kill — `afterKill` applies `BOSS_HP_MULT` to `xpReward` but `resolveAnswer` does not

**File:** `math-lab.html:1360-1362`

**Issue:** `CombatEngine.resolveAnswer()` awards XP to the player via `PlayerState.addXp(floorDef.xpReward)` at line 1200 — no multiplier. `DungeonRunner.afterKill()` accumulates floor-summary display XP at line 1360-1363:

```js
const xpThisKill = isBoss
  ? Math.round(floorDef.xpReward * CONFIG.DUNGEON.BOSS_HP_MULT)
  : floorDef.xpReward;
_floorXpEarned += xpThisKill;
```

On a boss kill, this adds `xpReward * 2` to `_floorXpEarned`. The floor-summary then displays `_floorXpEarned` which is larger than the XP the player actually received. For a Floor 1 boss: player gets 30 XP, summary shows 60 XP. The mismatch is confusing and potentially misleads the player about their progress.

The plan document (05-02-PLAN.md line 187) notes that XP "was already awarded by `CombatEngine.resolveAnswer`" and says to "accumulate `floorDef.xpReward` per kill" — but the implementation uses `xpReward * BOSS_HP_MULT` on the boss path, contradicting both the note and the underlying award.

**Fix:** Remove the boss multiplier from the display accumulator so it matches what the player actually received:

```js
// DungeonRunner.afterKill — lines 1360-1362
// XP was already awarded in resolveAnswer (no multiplier) — mirror that here
const xpThisKill = floorDef.xpReward;  // same for regular and boss rooms
_floorXpEarned += xpThisKill;
```

If a boss-XP bonus is desired in the future, it must be added to `resolveAnswer` first, then mirrored here.

---

## Warnings

### WR-01: `advanceFloor()` does not reset `CombatEngine` — stale `floorDef` persists between floors

**File:** `math-lab.html:1413-1426`

**Issue:** `DungeonRunner.advanceFloor()` calls `DungeonState.init(_currentFloor)` but does not call `CombatEngine.reset()`. After advancing, `CombatEngine.floorDef` still holds the previous floor's definition. A call to `CombatEngine.getState()` in this window (between `advanceFloor` and the next `enterCombat`) would return stale floor data including incorrect `tablePools`. Currently no code path exercises `getState()` in this window, but it is a latent defect that will bite if a future phase adds any inspection of `CombatEngine` state on the dungeon-map screen.

Compare `retryFloor()` (line 1431-1438) which correctly calls both `DungeonState.init()` and `CombatEngine.reset()` — `advanceFloor()` should follow the same pattern.

**Fix:**

```js
advanceFloor() {
  if (_currentFloor < CONFIG.DUNGEON.MAX_FLOORS) {
    _currentFloor         += 1;
    _floorEnemiesDefeated  = 0;
    _floorXpEarned         = 0;
    CombatEngine.reset();          // add: clear stale floorDef
    GameFSM.reset();               // add: ensure FSM is in EXPLORE before next floor
    DungeonState.init(_currentFloor);
    DungeonRunner.updateDungeonMap(_currentFloor);
    App.transition('dungeon-map');
  } else {
    CombatEngine.reset();
    GameFSM.reset();
    App.transition('quiz');
  }
}
```

---

### WR-02: No feedback delay before routing away from kill screen — `afterKill()` fires synchronously

**File:** `math-lab.html:1870-1873`

**Issue:** When the player lands the killing blow, `CombatInputHandler.handleAnswer()` calls `DungeonRunner.afterKill()` synchronously (line 1872) immediately after `DungeonRenderer.showDamageNumber()` and `DungeonRenderer.showFeedback()`. The damage number animation is 400 ms and the feedback text ("Attack!") never has a chance to be read before the screen transitions to loot or next combat. The 1-second feedback pause that exists for wrong answers and non-killing hits (line 1882-1885) is bypassed entirely on the kill path.

This is inconsistent with the non-kill path and may feel jarring to the player (instant screen change with a floating number mid-animation).

**Fix:** Wrap the `afterKill` call in the same `ADVANCE_DELAY_MS` timeout used for non-kill answers:

```js
if (result.killed) {
  // keep locked — prevent double-fire during delay
  setTimeout(() => {
    CombatInputHandler.locked = false;
    DungeonRunner.afterKill();
  }, CONFIG.ADVANCE_DELAY_MS);
  return;
}
```

---

## Info

### IN-01: `ROOMS_PER_FLOOR` comment says "1 entrance + 3 combat + 1 boss" but room 1 is entered as combat, not a separate entrance screen

**File:** `math-lab.html:632`

**Issue:** The comment on line 632 reads `// 1 entrance + 3 combat + 1 boss; used by Phase 5`. The implementation treats the dungeon-map screen as the "entrance" and uses all 5 room slots for combat (rooms 1–4 are regular combat, room 5 is boss). The comment is misleading and will cause confusion for anyone reading it against the actual `enterCombat()` logic which simply increments room and checks `room >= ROOMS_PER_FLOOR` for boss detection.

**Fix:** Update the comment to match the actual room structure:

```js
ROOMS_PER_FLOOR: 5,   // rooms 1–4 = regular combat, room 5 = boss; dungeon-map is the entrance screen
```

---

_Reviewed: 2026-06-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
