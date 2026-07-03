---
phase: 13-fresh-save-format-level-registry-data
fixed_at: 2026-06-29T00:00:00Z
review_path: .planning/phases/13-fresh-save-format-level-registry-data/13-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-06-29
**Source review:** .planning/phases/13-fresh-save-format-level-registry-data/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (WR-01..WR-04, IN-01, IN-02, IN-03 — `--fix --all` run)
- Fixed: 7
- Skipped: 0
- Out of scope / no change required: IN-04, IN-05 (review explicitly stated "None required")

All gates green after fixes:
- `node scripts/smoke-progress.mjs` → `smoke-progress: PASS`
- `bash scripts/check-progress.sh` → `progress checks: PASS`
- `node --check` passes on all 4 modified files

Constraints honored:
- a727c13 firewall: no engine globals added at module top level; progress.js and src/levels/ stay pure + node-importable (confirmed by the negative grep in check-progress.sh).
- LOCKED weighting formulas and CONFIG.BRAIN values untouched — WR-02/WR-03 are input-validation/fallback hardening only.
- level-01 geometry preserved verbatim (smoke LVL-02 deep-equal regression still passes).

## Fixed Issues

### WR-01: `isUnlocked` throws on a null/undefined progress for any non-first level

**Files modified:** `src/levels/index.js`
**Commit:** e96ab8c
**Applied fix:** Added a forgiving guard mirroring `getLevel` — a missing/malformed
`progress` (no `isLevelCleared` function) now returns `false` (only the first level open)
instead of throwing. Removes the latent boot-bricking once a second level is appended.

### WR-02: `createBrain` does not validate `allowedTables`

**Files modified:** `src/math/brain.js`
**Commit:** 06cac48
**Applied fix:** Added an `allowedTables` sanitation step in the factory that filters to
in-range integer tables (1..9) and builds the validated `allowedSet` once; an empty/invalid
pool falls back to the default all-9 behaviour (`allowedSet = null`). `calculateWeights` now
consumes the precomputed `allowedSet` instead of rebuilding `new Set(allowedTables)` per call.
Verified `createBrain({ allowedTables: [99, 100] })` no longer emits out-of-range tables and
`[7, 8]` restricts to exactly those tables. Input validation only — formulas untouched.

### WR-03: `weightedRandom` fallback can return a table outside the allowed pool

**Files modified:** `src/math/brain.js`
**Commit:** d7ee9f3
**Applied fix:** The floating-point fallback now returns the first table present in the
weight map (which `calculateWeights` already restricts to the allowed pool) instead of
unconditionally `HARD_TABLES[0]`. The CONFIG default remains only as a last resort if the
map is empty. Respects the difficulty seam without changing the locked selection math.
Requires human verification: this touches fallback selection behaviour — confirmed via the
smoke statistical test (`smoke-progress: PASS`), but worth a glance for selection-edge intent.

### WR-04: Stale save-key comment in `progress.js`

**Files modified:** `src/progress.js`
**Commit:** 5538329 (combined with IN-02/IN-03 — same file, overlapping docblocks)
**Applied fix:** Replaced the stale `mathlab_platformer_v1` literal with a reference to the
v2 clean-reset key, making `CONFIG.SAVE.KEY` the single source of truth in the comment.

### IN-01: Prototype-pollution smoke test exercised the weaker (object-literal) case

**Files modified:** `scripts/smoke-progress.mjs`
**Commit:** e666938
**Applied fix:** Rebuilt the SAVE-05 hostile blob via
`JSON.parse('{"version":2,"levels":{"__proto__":{"cleared":true},...}}')` so it places a
genuine own enumerable `__proto__` key (the real attack vector) instead of object-literal
`__proto__` special syntax. Test still passes — production seeding/validate loops withstand
the stronger case; a future regression would now be caught.

### IN-02: `serialize()`/`loadSave()`/`writeSave()` JSDoc omitted the `levels` field

**Files modified:** `src/progress.js`
**Commit:** 5538329 (combined with WR-04/IN-03)
**Applied fix:** Added `levels` to the `serialize` return typedef (now a full inline shape),
the `loadSave` `@returns`, and the `writeSave` `@param` blob shape. Also added the
`isLevelCleared`/`markCleared` members to the `createProgress` return typedef.

### IN-03: `loadSave` JSDoc return type omitted `levels`

**Files modified:** `src/progress.js`
**Commit:** 5538329 (combined with WR-04/IN-02)
**Applied fix:** `@returns` for `loadSave` now reads
`{ xp, level, accuracy, history, levels }`, matching `defaults()`/`validate()`.

## Notes

- WR-04, IN-02, and IN-03 are all documentation-only changes to the same overlapping
  docblocks in `src/progress.js` and were committed together (5538329) as they cannot be
  cleanly separated into independent atomic commits after editing.
- IN-04 and IN-05 from the review were marked "None required" by the reviewer and are
  intentionally not addressed (no code change warranted this phase).

---

_Fixed: 2026-06-29_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
