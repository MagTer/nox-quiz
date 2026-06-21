---
phase: 05-full-floor-loop-balance
plan: 01
subsystem: combat-engine
tags: [config, floor-config, combat, loot, balance]
status: complete

dependency_graph:
  requires: []
  provides:
    - CONFIG.DUNGEON 8 new balance constants (BOSS_HP_MULT, FINAL_BOSS_HP, FINAL_BOSS_XP, MAX_FLOORS, SWORD_BONUS, SHIELD_REDUCTION, POTION_HEAL, LOOT_DROP_RATE)
    - FloorConfig floor 4 Dragon Lord definition
    - CombatEngine.resolveAnswer loot-aware damage math
  affects:
    - CombatInputHandler (showDamageNumber now uses effective values)

tech_stack:
  added: []
  patterns:
    - Loot snapshot read once per resolveAnswer call — prevents double-reads
    - Effective damage computation from CONFIG constants — no magic numbers
    - Object.assign loot snapshot — caller cannot mutate session state

key_files:
  modified:
    - math-lab.html

decisions:
  - SWORD_BONUS=1 (DAMAGE_CORRECT 3 → 4 with sword), SHIELD_REDUCTION=3 (DAMAGE_WRONG 8 → 5 with shield) — values from plan spec
  - effectiveDamageCorrect and effectiveDamageWrong returned on all resolveAnswer paths so CombatInputHandler can display accurate floating numbers
  - DungeonState.init() comment clarified with ADHD-03 note — no code change required, existing implementation already correct

metrics:
  duration: "83 seconds"
  completed: "2026-06-21"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 05 Plan 01: Balance Constants + Loot-Aware Combat Summary

**One-liner:** 8 CONFIG.DUNGEON balance constants added (MAX_FLOORS=4, LOOT_DROP_RATE=0.6, SWORD_BONUS=1, SHIELD_REDUCTION=3, etc.), Floor 4 Dragon Lord wired to FloorConfig, and CombatEngine.resolveAnswer() now computes effective damage from loot snapshot at resolve time.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend CONFIG.DUNGEON + Floor 4 + Dragon Lord flavor | 179083e | math-lab.html |
| 2 | Loot-aware CombatEngine.resolveAnswer() | 77bb345 | math-lab.html |

## What Was Built

### Task 1 — CONFIG.DUNGEON + FloorConfig Floor 4

Eight new constants appended to `CONFIG.DUNGEON` (after `SAVE_KEY_V2`):

| Constant | Value | Purpose |
|----------|-------|---------|
| BOSS_HP_MULT | 2 | Boss room enemy HP multiplier |
| FINAL_BOSS_HP | 40 | Floor 4 Final Boss base HP |
| FINAL_BOSS_XP | 150 | XP awarded on Final Boss defeat |
| MAX_FLOORS | 4 | Total dungeon floors |
| SWORD_BONUS | 1 | Extra damage per correct answer with sword |
| SHIELD_REDUCTION | 3 | Damage reduction per wrong answer with shield |
| POTION_HEAL | 25 | HP restored on potion pickup |
| LOOT_DROP_RATE | 0.6 | 60% probability of loot drop from regular enemy |

Floor 4 Dragon Lord entry added to `FloorConfig.FLOORS` using `FINAL_BOSS_HP` and `FINAL_BOSS_XP` constants — no magic numbers. Three Dragon Lord flavor lines added to `DungeonRenderer.FLAVOR` to prevent empty flavor text on floor 4.

### Task 2 — Loot-Aware CombatEngine.resolveAnswer()

`resolveAnswer()` now reads `DungeonState.get().loot` once per call into a `lootSnapshot` variable. Effective damage values are computed:

- `effectiveDamageCorrect = DAMAGE_CORRECT + (lootSnapshot.sword ? SWORD_BONUS : 0)` → 3 base or 4 with sword
- `effectiveDamageWrong = max(0, DAMAGE_WRONG - (lootSnapshot.shield ? SHIELD_REDUCTION : 0))` → 8 base or 5 with shield

All three return paths (killed, died, normal) now include both `effectiveDamageCorrect` and `effectiveDamageWrong` in the returned object. `CombatInputHandler.handleAnswer()` updated to pass `result.effectiveDamageCorrect` and `result.effectiveDamageWrong` to `showDamageNumber()` so floating numbers reflect actual loot-modified damage.

`DungeonState.init()` comment updated to explicitly document ADHD-03 compliance: resets dungeon session state only — PlayerState XP and level untouched.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All new constants are used; loot paths are wired end-to-end. Potion heal (POTION_HEAL=25) is defined in CONFIG but actual HP restoration on pickup is deferred to Plan 02 DungeonRunner (documented in plan spec, intentional).

## Threat Flags

None. All changes are read-only CONFIG lookups and local state mutations with no new network surface.

## Self-Check: PASSED

- math-lab.html modified: FOUND
- Commit 179083e (Task 1): FOUND
- Commit 77bb345 (Task 2): FOUND
- grep -c BOSS_HP_MULT: 1 ✓
- grep -c FINAL_BOSS_HP: 2 ✓ (defined in CONFIG, used in FloorConfig)
- grep -c MAX_FLOORS: 1 ✓
- grep -c "Dragon Lord": 3 ✓ (FloorConfig entry + FLAVOR key + FLAVOR line)
- grep -c effectiveDamageCorrect: 8 ✓ (defined, used in resolve x2, returned x4, used in handleAnswer x2)
- grep -c lootSnapshot: 3 ✓ (1 declaration + 2 usages in single function — single snapshot per call)
- grep -c SWORD_BONUS: 2 ✓ (CONFIG definition + resolveAnswer usage)
- DungeonState.init() body: no PlayerState reference ✓
