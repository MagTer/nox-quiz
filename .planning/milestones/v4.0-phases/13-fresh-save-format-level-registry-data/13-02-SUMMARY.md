---
phase: 13-fresh-save-format-level-registry-data
plan: 02
subsystem: persistence
tags: [save-format, clean-reset, per-level-cleared, prototype-pollution, wave-1, pure-factory]
status: complete
requires:
  - "src/config.js (shipped CONFIG.SAVE block)"
  - "src/progress.js (shipped pure-factory + guarded save seam, Phase 11)"
  - "13-01-SUMMARY.md pinned contract: CONFIG.SAVE.KEY=mathlab_platformer_v2, VERSION=2"
provides:
  - "CONFIG.SAVE.KEY = mathlab_platformer_v2, VERSION = 2 (v4.0 clean-reset key)"
  - "Per-level cleared map in the save shape (defaults/validate/serialize branches)"
  - "createProgress().isLevelCleared(id) / markCleared(id) — cleared FACTS only"
affects:
  - "src/config.js"
  - "src/progress.js"
tech-stack:
  added: []
  patterns:
    - "Generalize-don't-rewrite: extended the validated save seam in place, no rewrite of XP/level math"
    - "Strict === true boolean coercion + copy-named-keys-into-fresh-defaults (prototype-pollution mitigation)"
    - "Store ONLY cleared facts; unlock derived in the registry (one source of truth)"
key-files:
  created: []
  modified:
    - "src/config.js"
    - "src/progress.js"
decisions:
  - "Per-level map stores ONLY {cleared:true}; never an unlocked flag — unlock derived from LEVEL_ORDER in the registry (Plan 03), one source of truth"
  - "cleared coerced with strict === true everywhere (validate + createProgress seed); a non-boolean (cleared:'yes') validates to NOT-cleared"
  - "validate() copies only into the fresh out.levels from defaults() and createProgress reads own keys via Object.keys — a __proto__/junk id never pollutes Object.prototype (T-13-03)"
  - "progress.js firewall held: imports only ./config.js, no engine/registry import; createProgress stays a PURE factory; loadSave/writeSave/storageAvailable stay defined-not-called at import"
metrics:
  duration: ~2min
  tasks: 2
  files: 2
  completed: 2026-06-29
---

# Phase 13 Plan 02: Fresh Save Format (Clean-Reset Key + Per-Level Cleared Map) Summary

Generalized the shipped, validated `src/progress.js` save seam to a FRESH versioned key
(`mathlab_platformer_v2` / VERSION 2) with a per-level `cleared` map plus
`isLevelCleared`/`markCleared` helpers, keeping the pure-factory + guarded-seam firewall
intact. This is the persistence half of the v4.0 data spine — it turns the Wave 0
`progress.js`/new-key greps and the SAVE-05/06/07 smoke cases GREEN (the smoke fully
passes once Plan 03's `src/levels/` registry lands in the same wave). Delivers SAVE-05
(new key clean reset, never bricks), SAVE-06 (per-level cleared facts persist; unlock
derived), SAVE-07 (XP/level/accuracy/history persist verbatim under the new key).

## What Was Built

**Task 1 — `src/config.js` (commit 769a6b5):**
- Bumped `CONFIG.SAVE.KEY` from the v3.0 `mathlab_platformer_v1` string to the v4.0
  clean-reset key `mathlab_platformer_v2`, and `CONFIG.SAVE.VERSION` from 1 to 2 — matching
  the Wave 0 pinned contract exactly.
- Rewrote the adjacent comment to record that the new key is the PRIMARY clean-reset guard
  (SAVE-05): the v3.0 blob under the old key is NOT migrated and NOT deleted — it is made
  invisible by the new key, and the version gate in `loadSave()` is the second guard.
- Added no other constants; `config.js` stays a leaf module (zero imports).

**Task 2 — `src/progress.js` (commit 40c6fb0):**
- `defaults()`: added `levels: {}` so every `loadSave()` failure path returns the new shape.
- `validate()`: added a `levels` branch AFTER the history branch, mirroring the named-key,
  range-checked accuracy idiom — `Object.entries(data.levels)` only when it's a non-null
  object, writing `out.levels[id] = { cleared: rec != null && rec.cleared === true }` into the
  FRESH `out` from `defaults()` (never spread/Object.assign the untrusted blob — T-13-03).
- `createProgress(saved)`: seeded a closure-local `const cleared = {}` from `saved.levels`
  using the same strict `rec.cleared === true` coercion, reading own keys via `Object.keys`
  (no prototype walk). The shipped xp/level finite guards are untouched.
- Added `isLevelCleared(id)` (returns `cleared[id] === true`) and `markCleared(id)`
  (sets `cleared[id] = true`) next to the getters — these own the cleared FACTS only; no
  registry/engine import (derived unlock lives in Plan 03).
- `serialize(brainSnapshot)`: added a `levels` field built by iterating `Object.keys(cleared)`
  and emitting `{ cleared: true }` per id; `version/xp/level/accuracy/history` kept exactly
  as shipped.

## Verification

- `node --check src/config.js` and `node --check src/progress.js` → exit 0.
- Task 1 probe: `CONFIG.SAVE.KEY === "mathlab_platformer_v2"` and `VERSION === 2`;
  `grep -c mathlab_platformer_v1 src/config.js` == 0; `grep -c '^import' src/config.js` == 0.
- Task 2 probe prints `progress13: OK` — proves the cleared round-trip
  (`markCleared → serialize → createProgress → isLevelCleared === true`), strict boolean
  coercion (`cleared:'yes'` → not cleared), never-bricks on `Infinity` level (`1e400`), and
  NO prototype pollution (`({}).cleared === undefined` after a `__proto__` id in the blob).
- `createProgress(undefined)` yields `{ levels: {} }` behavior, no cleared ids, never throws.
- Grep: `markCleared` and `isLevelCleared` each ≥1 in progress.js; `grep -c '^import'` == 1
  (only `./config.js`); `grep -c 'kaplay'` == 0 (firewall intact).

## Expected RED (deferred to wave gate, NOT a failure)

`node scripts/smoke-progress.mjs` currently exits on `ERR_MODULE_NOT_FOUND` for
`src/levels/index.js` — the registry that Plan 03 (running in parallel in this same Wave 1)
creates. This is the documented expected RED state from 13-01-SUMMARY. The progress.js
changes here introduce no new failure; the SAVE-05/06/07 cases go fully green once Plan 03
lands the registry. The acceptance criterion "After Plan 03 lands, smoke prints PASS" is a
wave-completion gate, not a this-plan gate.

## Threat Mitigations Applied

- **T-13-03 (Tampering, validate levels branch):** strict `=== true` coercion; copy only
  named keys into the fresh `defaults()` object; never spread/Object.assign the blob.
- **T-13-04 (Self-DoS, numeric guards):** the shipped `Number.isFinite` + `>= 1` + `Math.floor`
  guards left untouched — an `Infinity` level still falls back to 1 (verified by the probe).
- **T-13-05 (DoS, save seam):** `levels` data rides through the unchanged
  `storageAvailable()`/try-catch/QuotaExceededError seam; all failure paths still return
  `defaults()`.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/config.js (modified)
- FOUND: src/progress.js (modified)
- FOUND: commit 769a6b5 (Task 1)
- FOUND: commit 40c6fb0 (Task 2)
