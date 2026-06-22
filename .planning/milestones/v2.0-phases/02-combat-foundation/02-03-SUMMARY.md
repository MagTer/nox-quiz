---
phase: 02-combat-foundation
plan: "03"
subsystem: game-logic
tags: [persistence, migration, localStorage, versioning, save-format]
status: complete

dependency_graph:
  requires:
    - Plan 01 (CONFIG.DUNGEON including SAVE_KEY_V2 constant)
    - Plan 02 (DungeonState, CombatEngine)
  provides:
    - PersistenceStore v2 (VERSION=2, KEY=mathlab_save_v2, migrate() method)
  affects:
    - All future phases: PersistenceStore now reads/writes mathlab_save_v2
    - Players with v1 saves: XP/level/accuracy silently migrated on first page load

tech_stack:
  added: []
  patterns:
    - Versioned localStorage key migration (v1 → v2 via migrate() private function)
    - Read-validate-write migration pattern (never delete source key)
    - Layered try-catch for QuotaExceededError isolation inside migrate()

key_files:
  modified:
    - path: math-lab.html
      changes: >
        PersistenceStore IIFE modified in-place: VERSION bumped to 2, KEY switched to
        CONFIG.DUNGEON.SAVE_KEY_V2 ('mathlab_save_v2'), private migrate() function added,
        load() updated with migration branch when v2 key is absent.

decisions:
  - migrate() wrapped in outer try-catch with inner try-catch for JSON.parse — QuotaExceededError in setItem caught separately returning null (no loop)
  - v1 key explicitly NOT deleted after migration — preserved for rollback ability (T-02-11 accepted)
  - migration returns v2Payload directly; bootstrap caller's PlayerState.fromJSON(savedData) handles hydration symmetrically for both migration and normal paths
  - double-migration prevented by load() checking v2 key first — migrate() branch only runs when v2 absent

metrics:
  duration_seconds: 180
  completed_date: "2026-06-21"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 02 Plan 03: PersistenceStore v2 Migration Summary

**One-liner:** PersistenceStore upgraded in-place to v2 schema (mathlab_save_v2) with auto-silent migration from v1 saves — XP/level/accuracy forward-ported transparently on first load.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Modify PersistenceStore in-place for v2 schema and migration (PROG2-03) | f67afa7 | math-lab.html |

## What Was Built

### PersistenceStore In-Place Modifications (MODULE 4)

Four targeted changes made to the existing PersistenceStore IIFE. No new module created.

**CHANGE 1 — VERSION constant:** `const VERSION = 1` → `const VERSION = 2`

**CHANGE 2 — KEY constant:** `const KEY = CONFIG.SAVE_KEY` → `const KEY = CONFIG.DUNGEON.SAVE_KEY_V2`
Resolves to `'mathlab_save_v2'` (set by Plan 01 Task 1).

**CHANGE 3 — migrate() private function added** (between `defaults()` and `return { ... }`):
- Reads raw from `localStorage.getItem(CONFIG.SAVE_KEY)` ('mathlab_save_v1')
- Returns null if raw is null (no v1 data)
- JSON.parse inside inner try-catch; returns null on parse failure
- Strict version check: `data.version !== 1` → return null
- Validates data.xp (non-negative finite number) and data.level (positive integer); warns and returns null on failure
- Builds v2 payload: `{ version: 2, xp, level, accuracy: data.accuracy||{}, history: data.history||{} }`
- Writes v2 payload to `localStorage.setItem(KEY, ...)` — QuotaExceededError caught in inner try-catch, returns null
- CRITICAL: does NOT call `localStorage.removeItem(CONFIG.SAVE_KEY)` — v1 key preserved untouched
- Logs `console.info('[MathLab] Migrated save from v1 → v2')` on success
- Returns v2Payload on success, null on any failure

**CHANGE 4 — load() migration branch:** After `localStorage.getItem(KEY)` returns null:
```js
if (raw === null) {
  const migrated = migrate();
  if (migrated !== null) return migrated;
  return defaults();
}
```
Double-migration prevented: migration branch only runs when v2 key is absent. Once v2 is written, subsequent loads read it directly.

**UNCHANGED:** `save()` — already uses `KEY` and `VERSION` by reference; automatically writes to mathlab_save_v2 with version:2 after constant changes.

**defaults()** — already returned `version: VERSION`; now correctly returns version:2. No code change needed.

## Verification

All assertions verified via Node.js simulation (logic extracted and tested offline):

- Setup: `localStorage.setItem('mathlab_save_v1', JSON.stringify({ version: 1, xp: 150, level: 2, accuracy: { 6: 0.72, 7: 0.55 }, history: {} }))` + no v2 key
- After load(): `mathlab_save_v2` written with version:2, xp:150, level:2 ✓
- `mathlab_save_v1` still present and unmodified (version:1, xp:150) ✓
- Second load(): reads v2 directly — no migration log, xp unchanged ✓ (double-migration prevented)
- Fresh load (no v1, no v2): returns `{ version: 2, xp: 0, level: 1, ... }` ✓
- Invalid v1 data (xp: -10): warns to console, falls back to defaults ✓ (T-02-08 mitigated)
- All 4 Node.js simulation tests PASSED ✓

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — PersistenceStore is pure logic with no UI or data rendering.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced beyond what the plan's threat model covered:

- T-02-08 (Tampering via crafted v1 save): validated data.version===1, data.xp non-negative finite, data.level positive integer before writing v2 ✓
- T-02-09 (Prototype pollution via accuracy/history): migrate() does not spread onto prototype; PlayerState.fromJSON validates each key by parseInt range check ✓
- T-02-10 (DoS via repeated migrate() calls): load() checks v2 key first; QuotaExceededError in setItem caught, returns null with no loop ✓
- T-02-11 (v1 key in localStorage): accepted — local-only app, v1 preserved for rollback, no server exfiltration path ✓

No additional threat flags.

## Self-Check: PASSED

- math-lab.html: FOUND ✓
- Commit f67afa7 (PersistenceStore v2): FOUND ✓
- All Node.js simulation assertions: PASSED ✓
- `VERSION = 2` in math-lab.html: VERIFIED ✓
- `KEY = CONFIG.DUNGEON.SAVE_KEY_V2` in math-lab.html: VERIFIED ✓
- `migrate()` function present: VERIFIED ✓
- `load()` migration branch present: VERIFIED ✓
- v1 key not deleted in migrate(): VERIFIED ✓
