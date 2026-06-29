---
phase: 13-fresh-save-format-level-registry-data
plan: 03
subsystem: level-registry
tags: [level-registry, parameterized-builder, verbatim-lift, derived-unlock, a727c13, wave-1]
status: complete
requires:
  - "src/level.js (v3.0 shipped geometry + buildLevel body — the verbatim lift source)"
  - "src/config.js (CONFIG.FLOOR_Y/SPIKE_SIZE/GOAL_SIZE/TILE_SIZE/FLOOR_THICKNESS/SPIKE_HITBOX_*)"
  - "src/progress.js (markCleared/isLevelCleared cleared facts — Wave 1 Plan 02 — consumed by isUnlocked)"
provides:
  - "src/levels/level-01.js — LEVEL_01 descriptor with v3.0 geometry lifted verbatim (LVL-02)"
  - "src/levels/build.js — buildLevel(levelData) parameterized builder, Rect guard inside body (LVL-02)"
  - "src/levels/index.js — LEVEL_ORDER, getLevel(id), derived isUnlocked(id, progress) (LVL-02 + SAVE-06)"
affects:
  - "src/levels/level-01.js"
  - "src/levels/build.js"
  - "src/levels/index.js"
tech-stack:
  added: []
  patterns:
    - "Descriptor schema: id/displayName/allowedTables/geometry + unset mechanics/theme/parallax slots the builder ignores"
    - "a727c13 import-safety: data + registry modules reference no engine globals; the lone Rect guard lives INSIDE buildLevel's body"
    - "Derived unlock: isUnlocked recomputed from LEVEL_ORDER + cleared facts; nothing stored (research Pitfall 4)"
    - "Two-dot config import depth for src/levels/* modules (mirrors src/math/brain.js)"
key-files:
  created:
    - "src/levels/level-01.js"
    - "src/levels/build.js"
    - "src/levels/index.js"
  modified: []
decisions:
  - "displayName set to \"The First Descent\" (dark-grunge-toned placeholder; copy was planner discretion)"
  - "Geometry lifted byte-for-byte from src/level.js including CONFIG-relative expressions (FLOOR_Y - CONFIG.SPIKE_SIZE etc.) and the explanatory comments — the Wave-0 regression smoke deep-equals it"
  - "getLevel falls back to LEVELS[0] for any unknown id; isUnlocked treats i<=0 (first OR unknown) as always-open (T-13-07 — a junk id never crashes or unlocks a real level)"
  - "src/level.js NOT deleted here — Wave 2 Plan 04 deletes it after game.js rewires; both coexist this wave"
metrics:
  duration: ~3min
  tasks: 3
  files: 3
  completed: 2026-06-29
---

# Phase 13 Plan 03: src/levels/ — Parameterized Builder + Verbatim level-01 + Ordered Registry Summary

Split the shipped `src/level.js` into a `src/levels/` directory: one parameterized `buildLevel(levelData)` that reads `levelData.geometry`, one `level-01.js` data module wrapping the v3.0 geometry verbatim in a forward-looking descriptor schema, and an ordered `index.js` registry exposing `LEVEL_ORDER`, a forgiving `getLevel(id)`, and the DERIVED `isUnlocked(id, progress)`. This is the level half of the v4.0 data spine, and it turns the remaining Wave-0 registry greps + LVL-02 smoke cases (plus the full gate suite, now that Plan 02's save half is also green) GREEN.

## What Was Built

**Task 1 — `src/levels/level-01.js` (commit c4b7414):**
- Exports `LEVEL_01` — the descriptor: `id: "level-01"`, `displayName: "The First Descent"`, `allowedTables: [6,7,8,9]`, a `geometry` object, and the unset optional slots `mechanics: []` / `theme: null` / `parallax: null`.
- `geometry` holds floors / platforms / coins / spikes / goal / checkpoints lifted VERBATIM from `src/level.js` — same numbers, same CONFIG-relative expressions (`FLOOR_Y - CONFIG.SPIKE_SIZE`, `FLOOR_Y - CONFIG.GOAL_SIZE`, `FLOOR_Y - 48`), and the original explanatory comments preserved.
- Checkpoints kept INSIDE `geometry` (research A5 — game.js reads them; Wave 2 moves the read-site to `level.geometry.checkpoints`).
- Pure DATA module: imports ONLY `../config.js` (two-dot depth, mirrors `src/math/brain.js`); references no engine globals in code (the only `Rect`/`typeof Rect` token is a doc comment, which the gate's comment-stripped negative grep ignores).

**Task 2 — `src/levels/build.js` (commit 70f07e2):**
- Exports `buildLevel(levelData)`. Reads `const g = levelData.geometry` once, then lifts the ENTIRE v3.0 `buildLevel` body verbatim, changing ONLY the geometry source (`level.floors` → `g.floors`, etc.).
- The `typeof Rect` fail-loud guard is the FIRST statement INSIDE the function body (a727c13 — line 46, after the `export function buildLevel` at line 38), not at module top level; error message updated to reference `build.js`.
- Preserves the merged-floor anti-seam-stick idiom (ONE wide `body({isStatic:true})` collider per contiguous run + visual-only `sprite("ground")` tiles), the identical platform loop, the coin loop (`sprite("coin")+area()+"coin"`, `coin.play("spin")`), the tightened spike hitbox (`new Rect(vec2(0), SPIKE_HITBOX_W, SPIKE_HITBOX_H)` with the down-centered offset), and the goal. No `addLevel`. No checkpoints built here.
- Leaf consts `T`/`FLOOR_Y` at module top (pure config reads, safe); imports only `../config.js`.

**Task 3 — `src/levels/index.js` (commit 88c2300):**
- `const LEVELS = [LEVEL_01]` is the single ordered registry; `BY_ID` is the lookup Map.
- Exports `LEVEL_ORDER` (`["level-01"]`), `getLevel(id)` (forgiving fallback to `LEVELS[0]`), and `isUnlocked(id, progress)` (computes `i = LEVEL_ORDER.indexOf(id)`; `i <= 0` → always open; else `progress.isLevelCleared(LEVEL_ORDER[i-1])`).
- Pure module: imports ONLY `./level-01.js`; no engine globals, no storage — stays node-importable for the smoke.

## Verification

- `node --check` passes for all three new files; the three `node -e` probes print `level01: OK`, (build.js structural greps), `index13: OK`.
- Guard placement: comment-stripped `typeof Rect` appears at line 46, after `export function buildLevel` at line 38 — inside the body (a727c13).
- `addLevel` count in build.js code (comment-stripped) == 0; merged colliders + `SPIKE_HITBOX_W` present.
- level-01.js + index.js code reference no engine globals; both use the two-dot `../config.js` import depth (level-01 via direct import; index transitively).
- Full Wave 0 gate suite GREEN: `node scripts/smoke-progress.mjs` → `smoke-progress: PASS`; `bash scripts/check-progress.sh` → `progress checks: PASS`.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- FOUND: src/levels/level-01.js
- FOUND: src/levels/build.js
- FOUND: src/levels/index.js
- FOUND: commit c4b7414 (Task 1)
- FOUND: commit 70f07e2 (Task 2)
- FOUND: commit 88c2300 (Task 3)
