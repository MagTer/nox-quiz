---
phase: 02-combat-foundation
fixed_at: 2026-06-21T00:00:00Z
review_path: .planning/phases/02-combat-foundation/02-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 5
skipped: 2
status: partial
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-06-21
**Source review:** .planning/phases/02-combat-foundation/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (Critical + Warning): 7
- Fixed: 5
- Skipped: 2

## Fixed Issues

### CR-01: Guard resolveAnswer() and getState() against null floorDef

**Files modified:** `math-lab.html`
**Commit:** 50cd6f0
**Applied fix:** Added early-return guard `if (!floorDef) throw new Error(...)` at the top of both `resolveAnswer()` and `getState()` in `CombatEngine`. Any caller that invokes these before `startCombat()` now gets a clear error instead of a silent `TypeError: Cannot read properties of null`.

---

### CR-02: Guard startCombat() against COMBAT→COMBAT illegal FSM transition

**Files modified:** `math-lab.html`
**Commit:** ea28c6c
**Applied fix:** Added guard at the top of `startCombat()`: if `GameFSM.getState() === 'COMBAT'`, throws `[CombatEngine] Cannot startCombat while already in COMBAT state`. This surfaces the contract violation immediately rather than letting the FSM throw an opaque illegal-transition error deep in the call stack.

---

### CR-03: Sanitise accuracy and history in migrate() before writing v2

**Files modified:** `math-lab.html`
**Commit:** f9679d9
**Applied fix:** Added `sanitiseAccuracy()` and `sanitiseHistory()` helper functions inside `migrate()`, matching the same per-entry validation logic already present in `PlayerState.fromJSON()`. The v2Payload now uses `sanitiseAccuracy(data.accuracy || {})` and `sanitiseHistory(data.history || {})` instead of passing raw objects through. Out-of-range keys, non-numeric accuracy values, and non-boolean history entries are stripped before the payload is written to localStorage.

---

### WR-01: Call DungeonState.init() inside startCombat() to reset player HP

**Files modified:** `math-lab.html`
**Commit:** c596bc2
**Applied fix:** Added `DungeonState.init(floorNumber)` call inside `startCombat()` before `DungeonState.setEnemyHP(floorDef.hp)`. This resets `playerHP`, `room`, and `loot` on every combat start. `setEnemyHP` is kept after `init` because `init` sets `enemyHP = null`.

---

### WR-03: Add CombatEngine.reset() to clear stale floor state

**Files modified:** `math-lab.html`
**Commit:** 1b35336
**Applied fix:** Added a `reset()` method to the `CombatEngine` public API that sets `currentFloor = null` and `floorDef = null`. Callers that invoke `GameFSM.reset()` on a new run should also call `CombatEngine.reset()` (and `DungeonState.init(1)`) to bring all module state into alignment. This eliminates the inconsistency where FSM reports `EXPLORE` but `CombatEngine.getState()` still returns the previous floor's enemy.

---

## Skipped Issues

### WR-02: Double level-up notification when question XP and kill XP both trigger level-up

**File:** `math-lab.html:858` vs `math-lab.html:1027-1031`
**Reason:** Deferred by design — `InputHandler` does not yet call `CombatEngine.resolveAnswer()`. The wiring happens in Phase 3. Fix must be applied at Phase 3 when the two XP paths are connected; applying it now would be premature.
**Original issue:** If both question XP and kill-bonus XP trigger a level-up in the same tick, only the first `showLevelUpOverlay` call is visible; the second is silently swallowed.

---

### WR-04: migrate() does not delete the v1 key after successful migration

**File:** `math-lab.html:471-517`
**Reason:** Deferred by design — the v1 key is intentionally preserved as a rollback option per the existing code comment. Changing this behaviour (Option 1: delete v1 key) or updating the comment (Option 2) is a product decision deferred to a later phase.
**Original issue:** If the v2 key is evicted under storage pressure while the v1 key remains, migration re-runs from v1, silently discarding any v2 XP from subsequent sessions.

---

_Fixed: 2026-06-21_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
