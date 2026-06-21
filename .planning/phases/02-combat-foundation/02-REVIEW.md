---
phase: 02-combat-foundation
reviewed: 2026-06-21T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - math-lab.html
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-06-21
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed the Phase 2 additions to `math-lab.html`: `CONFIG.DUNGEON`, `GameFSM`, `FloorConfig`, `DungeonState`, `CombatEngine`, and the `PersistenceStore` v2 migration rewrite. The module structure is clean and the IIFE pattern is consistent. The primary concerns are: (1) a null-dereference crash in `CombatEngine.resolveAnswer` if called before `startCombat`; (2) an FSM state corruption path when `startCombat` is called while already in COMBAT; (3) unvalidated `accuracy`/`history` objects passed straight through in `migrate()` despite careful validation of `xp` and `level`; and (4) `DungeonState.init()` being unused in Phase 2, leaving player HP permanently set to the constructor default rather than being reset between floors.

---

## Critical Issues

### CR-01: `CombatEngine.resolveAnswer` crashes with null dereference if called before `startCombat`

**File:** `math-lab.html:851-876`

**Issue:** `resolveAnswer` reads `floorDef.xpReward` (line 858) and `floorDef.hp` (indirectly via `DungeonState.get().enemyHP`, line 853) when an enemy is killed. `floorDef` is initialised to `null` at line 830 and only set in `startCombat`. If `resolveAnswer` is ever called before `startCombat` — whether by a future caller, a re-entrant event, or a test harness — `floorDef.xpReward` throws `TypeError: Cannot read properties of null`. No guard exists. The `getState()` method on line 882 also returns `floorDef` directly as part of its snapshot, propagating `null` to callers.

**Fix:**
```js
resolveAnswer(isCorrect) {
  if (!floorDef) {
    throw new Error('[CombatEngine] resolveAnswer called before startCombat');
  }
  // ... rest of method
}

getState() {
  if (!floorDef) {
    throw new Error('[CombatEngine] getState called before startCombat');
  }
  // ... rest of method
}
```

---

### CR-02: FSM enters illegal state when `startCombat` is called twice in a row

**File:** `math-lab.html:836-847`

**Issue:** `startCombat` unconditionally calls `GameFSM.transition('COMBAT')` at line 840. The FSM's `TRANSITIONS` table (lines 709-713) does not include `COMBAT → COMBAT` as a legal transition. If `startCombat` is called a second time (e.g. the player enters a new room while FSM is still in `COMBAT` from the previous room — a scenario Phase 5's room loop is likely to trigger), `GameFSM.transition('COMBAT')` throws `Error: [GameFSM] Illegal transition: COMBAT → COMBAT`. This corrupts the session silently since the thrown error propagates uncaught through the caller.

`startCombat` should transition to `EXPLORE` first (or accept an explicit `reset` from the caller), or the FSM should have a self-transition for `COMBAT → COMBAT` when re-entering the same state. The plan for ROOMS_PER_FLOOR (5 rooms, 3 combat) makes this a near-certain hit.

**Fix:**
```js
startCombat(floorNumber) {
  floorDef     = FloorConfig.getFloor(floorNumber);
  currentFloor = floorNumber;
  DungeonState.setEnemyHP(floorDef.hp);

  // If already in COMBAT (chained rooms), reset via LOOT or via reset()
  // Callers must transition FSM to EXPLORE before calling startCombat again.
  // Guard here to surface the contract violation early:
  if (GameFSM.getState() === 'COMBAT') {
    throw new Error('[CombatEngine] Cannot startCombat while already in COMBAT state');
  }
  GameFSM.transition('COMBAT');
  // ...
}
```
Or add `COMBAT: ['LOOT', 'FLOOR_SUMMARY', 'DEAD', 'COMBAT']` to FSM transitions if the design intent is to allow back-to-back combat rooms without an EXPLORE interstitial.

---

### CR-03: `migrate()` passes unvalidated `accuracy` and `history` objects from v1 save into v2 payload

**File:** `math-lab.html:497-503`

**Issue:** The migration code validates `xp` (line 487) and `level` (lines 491-493) with strict type checks but then copies `data.accuracy` and `data.history` directly with `data.accuracy || {}` and `data.history || {}` (lines 501-502). A malicious or corrupted v1 save could embed:
- `accuracy` values outside `[0, 1]` (e.g. `{"6": 999}`) — these would bypass `PlayerState.fromJSON`'s own validation since that validation only runs when loading the returned payload via `fromJSON` which _does_ validate. However the returned `v2Payload` is also written directly to localStorage without sanitisation, so a re-load that bypasses `fromJSON` (or a future code path) would store the bad values.
- `history` values that are not arrays of booleans (e.g. `{"6": "INJECTED"}`) — again, `fromJSON` sanitises on load, but the corrupted payload is persisted as-is.
- Prototype pollution: if `data.accuracy` has a `__proto__` or `constructor` key, `Object.entries` in `fromJSON` would iterate it. The `parseInt(k)` guard catches non-numeric keys (returns `NaN`, fails `>= 1 && <= 9`), so prototype pollution is blocked in practice — but the raw object reference is still written to localStorage.

The risk is low in the current call path (fromJSON sanitises on load), but the v2 record written to disk is uncleaned. A future code path that reads v2 and bypasses `fromJSON` would ingest bad data.

**Fix:** Apply the same per-entry validation in `migrate()` before writing:
```js
const v2Payload = {
  version: 2,
  xp:      data.xp,
  level:   data.level,
  accuracy: sanitiseAccuracy(data.accuracy || {}),
  history:  sanitiseHistory(data.history  || {})
};

function sanitiseAccuracy(raw) {
  const out = {};
  Object.entries(raw).forEach(([k, v]) => {
    const t = parseInt(k, 10);
    if (t >= 1 && t <= 9 && typeof v === 'number' && v >= 0 && v <= 1) out[t] = v;
  });
  return out;
}

function sanitiseHistory(raw) {
  const out = {};
  Object.entries(raw).forEach(([k, v]) => {
    const t = parseInt(k, 10);
    if (t >= 1 && t <= 9 && Array.isArray(v)) {
      out[t] = v.filter(x => typeof x === 'boolean').slice(-CONFIG.MASTERY_WINDOW);
    }
  });
  return out;
}
```

---

## Warnings

### WR-01: `DungeonState.init()` is never called — player HP is never reset between runs

**File:** `math-lab.html:774-779`

**Issue:** `DungeonState` exposes an `init(floorNumber)` method that resets `floor`, `room`, `playerHP`, `enemyHP`, and `loot`. Nothing in the Phase 2 code calls it. `CombatEngine.startCombat` only calls `DungeonState.setEnemyHP(floorDef.hp)` (line 839) — it never resets `playerHP`. This means if a player's HP was depleted from a previous combat session (in-memory, before DEAD state is handled), a new call to `startCombat` would start the enemy at full HP but the player at whatever HP remained. Since `playerHP` initialises to `CONFIG.DUNGEON.PLAYER_HP` at module definition time, the first run is fine; subsequent runs within the same page session without calling `init()` will carry over depleted HP.

**Fix:** Call `DungeonState.init(floorNumber)` inside `CombatEngine.startCombat` before setting enemy HP:
```js
startCombat(floorNumber) {
  floorDef     = FloorConfig.getFloor(floorNumber);
  currentFloor = floorNumber;
  DungeonState.init(floorNumber);          // resets playerHP, room, loot
  DungeonState.setEnemyHP(floorDef.hp);   // still needed if init sets enemyHP to null
  GameFSM.transition('COMBAT');
  // ...
}
```
Note: `DungeonState.init` already sets `enemyHP = null`, so `setEnemyHP` would still be needed after `init`. Alternatively, have `init` accept the enemy HP as a second parameter.

---

### WR-02: `CombatEngine.resolveAnswer` awards XP via `PlayerState.addXp` but also updates `PersistenceStore` independently through `InputHandler` — double XP on kill possible

**File:** `math-lab.html:858` vs `math-lab.html:1027-1031`

**Issue:** When an answer is correct, `InputHandler.handleAnswer` (line 1027) calls `XpCalculator.calculateXp` and `PlayerState.addXp` for the per-question XP reward. If the same correct answer also kills an enemy, `CombatEngine.resolveAnswer` (line 858) calls `PlayerState.addXp(floorDef.xpReward)` for the kill bonus XP. In isolation this is correct — question XP + kill bonus XP. However `InputHandler` is the only caller of `CombatEngine.resolveAnswer` implicitly (via future wiring), and the returned `leveledUp` flag from `resolveAnswer` (line 858) covers only the kill-bonus XP level-up. The question-XP level-up check in `InputHandler` (line 1031) fires separately. If both trigger a level-up in the same tick, only the first `showLevelUpOverlay` call is visible to the player; the second level-up is silently swallowed. This is not a data loss (both levels are applied) but the player never sees the second level-up notification, which is a UX correctness bug.

This is currently latent because `InputHandler` does not yet call `CombatEngine.resolveAnswer`. Document the contract before Phase 3 wiring: the kill-XP level-up result from `resolveAnswer` must be checked and displayed alongside the question-XP level-up result.

**Fix:** When Phase 3 wires `InputHandler` to call `resolveAnswer`, check both `leveledUp` flags:
```js
const questionLeveledUp = PlayerState.addXp(xpAwarded);
const combatResult = CombatEngine.resolveAnswer(isCorrect);
if (questionLeveledUp || combatResult.leveledUp) {
  Renderer.showLevelUpOverlay(PlayerState.getLevel());
}
```

---

### WR-03: `GameFSM.reset()` sets state to `EXPLORE` but `CombatEngine` module-level `floorDef` and `currentFloor` are not reset

**File:** `math-lab.html:729-732` and `math-lab.html:829-830`

**Issue:** `GameFSM.reset()` only resets the FSM internal state string. `CombatEngine` holds `currentFloor` and `floorDef` as module-level closure variables. If a caller calls `GameFSM.reset()` after a DEAD transition (to allow a new run from EXPLORE), subsequent calls to `CombatEngine.getState()` still return the stale `floor` and `floorDef` from the dead session. This gives callers an inconsistent view: FSM says EXPLORE, CombatEngine reports the previous floor's enemy.

**Fix:** Add a `reset()` method to `CombatEngine` and call it together with `GameFSM.reset()`:
```js
// In CombatEngine return object:
reset() {
  currentFloor = null;
  floorDef     = null;
},
```
Then callers do:
```js
GameFSM.reset();
CombatEngine.reset();
DungeonState.init(1);
```

---

### WR-04: `migrate()` does not delete the v1 key after successful migration — migration runs on every page load until v2 key exists

**File:** `math-lab.html:471-517`

**Issue:** The comment at line 470 says "runs once per user; v1 key is preserved." But `migrate()` is called from `load()` every time there is no v2 key. If the `localStorage.setItem(KEY, ...)` at line 506 fails (QuotaExceededError), `migrate()` returns `null` and `load()` returns `defaults()` — losing the v1 data silently. More importantly, if the write succeeds but the browser crashes before the next page load, the v2 key is present and migration is not re-run. If something removes the v2 key but not the v1 key, migration _will_ re-run — which is fine. The stated intent "v1 key is preserved" means the user can roll back, which is a valid design choice. However the code comment is misleading: it implies a one-shot migration, but the actual behaviour is "migrate whenever v2 is absent." This creates a subtle risk: if the v2 key is evicted by the browser (storage pressure) while the v1 key remains, the user's v2 XP from subsequent sessions is silently discarded and they are migrated from v1 again.

**Fix:** Either:
1. Delete the v1 key after successful migration (intent: no rollback, simpler guarantees), or
2. Update the comment to accurately describe the retry semantics and add a note about the eviction race.

```js
// Option 1 — delete v1 after successful migration:
localStorage.setItem(KEY, JSON.stringify(v2Payload));
localStorage.removeItem(CONFIG.SAVE_KEY);  // prevent re-migration
console.info('[MathLab] Migrated save from v1 → v2');
return v2Payload;
```

---

## Info

### IN-01: `FloorConfig.getFloor` shallow-copies `tablePools` but exposes the full `floorDef` object reference via `CombatEngine.getState()`

**File:** `math-lab.html:749-751` and `math-lab.html:882-885`

**Issue:** `FloorConfig.getFloor` returns `Object.assign({}, f, { tablePools: [...f.tablePools] })` — a shallow copy that clones the `tablePools` array. Good. However `CombatEngine.getState()` returns `{ floorDef, ... }` where `floorDef` is the object already returned by `FloorConfig.getFloor` and stored in the closure. Callers of `getState()` receive a reference to that same object. If a caller mutates `getState().floorDef.tablePools` (e.g. splicing it), they mutate the `CombatEngine`-internal reference. Phase 3's question selection from `tablePools` would then see a modified pool.

**Fix:** Return a copy in `getState()`:
```js
getState() {
  return {
    floor:    currentFloor,
    floorDef: floorDef ? Object.assign({}, floorDef, { tablePools: [...floorDef.tablePools] }) : null,
    enemyHP:  DungeonState.get().enemyHP,
    playerHP: DungeonState.get().playerHP
  };
}
```

---

### IN-02: Module numbering in comments is off-by-one from Phase 1 — `Renderer` and `InputHandler` are labelled MODULE 6 and MODULE 7 but those numbers are now taken by `GameFSM` and `FloorConfig`

**File:** `math-lab.html:913` and `math-lab.html:989`

**Issue:** Phase 2 added MODULE 6 (GameFSM), MODULE 7 (FloorConfig), MODULE 8 (DungeonState), and MODULE 9 (CombatEngine). The pre-existing `Renderer` and `InputHandler` blocks were not renumbered and still carry "MODULE 6" and "MODULE 7" in their comment headers. This is a readability issue only — no behavioural impact — but it will cause confusion when navigating the file.

**Fix:** Renumber the Renderer comment to MODULE 10 and InputHandler to MODULE 11 (or drop the numbers entirely and use descriptive names only).

---

_Reviewed: 2026-06-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
