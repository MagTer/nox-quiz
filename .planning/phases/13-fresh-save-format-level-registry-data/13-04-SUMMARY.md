---
phase: 13-fresh-save-format-level-registry-data
plan: 04
subsystem: data-spine-integration
tags: [wire, registry-load, allowed-tables-seam, cleared-persist, level-js-delete, wave-2, a727c13, pending-human-verify]
status: complete
requires:
  - "src/levels/index.js (getLevel, LEVEL_ORDER — Plan 03)"
  - "src/levels/build.js (buildLevel(levelData) — Plan 03)"
  - "src/levels/level-01.js (LEVEL_01 descriptor; allowedTables [6,7,8,9]; geometry.checkpoints — Plan 03)"
  - "src/progress.js (markCleared/isLevelCleared + levels-aware serialize — Plan 02)"
  - "src/config.js (CONFIG.SAVE.KEY=mathlab_platformer_v2 / VERSION 2 — Plan 02)"
provides:
  - "game.js loads the level by id from the registry (getLevel(data?.levelId ?? LEVEL_ORDER[0])) + buildLevel(level)"
  - "Per-level cleared fact persists on clear (progress.markCleared(level.id) in the same writeSave as XP — SAVE-06)"
  - "allowedTables threaded level → createBrain → nextQuestion → calculateWeights (difficulty seam WIRED, not enforced — SAVE-07/LVL-03-prep)"
  - "checkpoint read-site moved into geometry (level.geometry.checkpoints)"
  - "src/level.js deleted; the single import site repointed; no module references the old path"
affects:
  - "src/scenes/game.js"
  - "src/math/brain.js"
  - "src/level.js (deleted)"
tech-stack:
  added: []
  patterns:
    - "Load-by-id with forgiving fallback: getLevel(data?.levelId ?? LEVEL_ORDER[0]) — unknown id never crashes (T-13-10)"
    - "Difficulty seam wired-not-enforced: allowedTables flows through; LOCKED weighting formulas untouched (enforcement is Phase 16)"
    - "Atomic cleared+XP persist: markCleared(level.id) before the existing single writeSave on clear (SAVE-06)"
    - "Delete-over-shim for the superseded module once the lone import site is repointed (research Open Question #1)"
key-files:
  created: []
  modified:
    - "src/math/brain.js"
    - "src/scenes/game.js"
  deleted:
    - "src/level.js"
decisions:
  - "level loaded via getLevel(data?.levelId ?? LEVEL_ORDER[0]) — the seam is ready for Phase 14 level-select while this phase adds NO scenes"
  - "allowedTables wired through nextQuestion but NOT enforced as a difficulty gate — the LOCKED 6-9 weighting formulas and CONFIG.BRAIN are untouched (Phase 16 owns enforcement)"
  - "markCleared placed AFTER addXp and BEFORE the existing writeSave so the cleared fact and XP persist in one atomic write (SAVE-06)"
  - "checkpoint read-site moved to level.geometry.checkpoints (research A5); the addCheckpoint/respawn anti-leak contracts and all onCollide wiring preserved verbatim"
  - "src/level.js deleted (git rm) rather than shimmed — the only import site is repointed; no module imports the old path"
  - "Stale doc-comment references to buildLevel(LEVEL)/level.js in game.js updated to buildLevel(level)/levels registry for accuracy (no behavior change)"
metrics:
  duration: ~5min
  tasks: 3
  files: 3
  completed: 2026-06-29
---

# Phase 13 Plan 04: Wave 2 (Wire) — Registry-Driven Load + Cleared-Persist + level.js Delete Summary

Rewired the single `src/level.js` import site in `src/scenes/game.js` to load a level **by id**
from the Wave-1 registry (`getLevel(data?.levelId ?? LEVEL_ORDER[0])` + `buildLevel(level)`),
threaded the level's `allowedTables` pool through the brain (`createBrain → nextQuestion →
calculateWeights`) as a WIRED-not-enforced difficulty seam, moved the checkpoint read-site into
`level.geometry.checkpoints`, persisted the per-level `cleared` fact on clear
(`progress.markCleared(level.id)` in the same `writeSave` as XP), and **deleted** the superseded
`src/level.js`. This is the integration half of the v4.0 data spine — it joins Plan 02's fresh
save shape and Plan 03's level registry into a single end-to-end path. Delivers LVL-02 (load by
id), SAVE-06 (per-level cleared persists), and SAVE-07/LVL-03-prep (allowedTables seam). The
mandatory real-browser boot (Task 3) is the one remaining gate and is **pending human
verification** (see below).

## What Was Built

**Task 1 — `src/math/brain.js` (commit e1eaa3c):**
- Extended `createBrain`'s destructured options from `{ seedAccuracy, seedHistory }` to
  `{ seedAccuracy, seedHistory, allowedTables }` and captured `allowedTables` in the closure.
- Replaced `calculateWeights(undefined)` with `calculateWeights(allowedTables)` inside
  `nextQuestion()` so a per-level pool, when provided, restricts selection; when `undefined`
  the call is **byte-identical** to before (all 9 tables, 6-9 biased).
- Updated only the `nextQuestion` doc comment to note `allowedTables` now flows through and that
  the pool is wired but NOT yet enforced (Phase 16). **No change** to `calculateWeights`'s
  formulas, the EWMA, the distractor logic, or any `CONFIG.BRAIN` value — the LOCKED algorithm
  is intact (confirmed by the scoped `git diff`).

**Task 2 — `src/scenes/game.js` + delete `src/level.js` (commit fa44246):**
- Swapped the import `import { LEVEL, buildLevel } from "../level.js"` for two registry imports:
  `import { getLevel, LEVEL_ORDER } from "../levels/index.js"` and
  `import { buildLevel } from "../levels/build.js"`.
- Added the load-by-id lookup `const level = getLevel(data?.levelId ?? LEVEL_ORDER[0]);` before
  brain construction (forgiving fallback — an unknown id never crashes, T-13-10).
- Threaded `allowedTables: level.allowedTables` into the `createBrain({ ... })` options alongside
  `seedAccuracy`/`seedHistory`.
- Changed `buildLevel(LEVEL)` → `buildLevel(level)`.
- Moved the checkpoint read-site `for (const cp of LEVEL.checkpoints)` →
  `for (const cp of level.geometry.checkpoints)`.
- In the `onClear` handler, added `progress.markCleared(level.id);` **after** `addXp(table)` and
  **before** the existing `writeSave(progress.serialize(brain.snapshot()))` so the cleared fact
  and XP persist in one atomic write (SAVE-06).
- Updated two stale doc comments (`buildLevel(LEVEL)` / `level.js`) to reflect the registry path
  (no behavior change).
- **Deleted `src/level.js`** via `git rm` — the only import site is now repointed; no module
  imports the old path.
- **Preserved verbatim**: the closure anti-leak contracts, `reset()`/`respawn()`, the
  coin/spike/goal `onCollide` wiring, the spike collider shape, the `onHide`/`onSceneLeave`
  cancellers, and the camera follow — none touched.

**Task 3 — Mandatory real-browser boot (checkpoint:human-verify, gate=blocking): PENDING.**
This task writes no code. It is the mandatory live browser boot that greps cannot substitute for
(the most expensive v3.0 lesson; STATE.md cross-cutting mitigation #2). It is **deferred to the
orchestrator for manual human verification** — see "Pending Human Verification" below.

## Verification (automated — all GREEN)

- `node --check src/math/brain.js` → exit 0; the **brain13 probe prints `brain13: OK`** (a `[6,7]`
  pool yields only tables 6 and 7 across 200 draws).
- `grep -c 'calculateWeights(allowedTables)' src/math/brain.js` == 1;
  `grep -c 'calculateWeights(undefined)' src/math/brain.js` == 0.
- Scoped `git diff src/math/brain.js`: changes only to the `createBrain` options line, the
  `nextQuestion` call, and the doc comment — the LOCKED weight formulas + `CONFIG.BRAIN` untouched.
- `node --check src/scenes/game.js` → exit 0.
- `test ! -f src/level.js` → DELETED (also confirmed in the commit stat: 185 lines removed).
- `grep -rEc 'from "\.\.?/level\.js"' src/` across every src file → **0** (no module imports the
  old path).
- game.js contains: registry imports (`levels/index.js` + `levels/build.js`),
  `allowedTables: level.allowedTables`, `buildLevel(level)`, `level.geometry.checkpoints`,
  `markCleared` — and `markCleared` (line 180) sits after `addXp` (175) and before `writeSave`
  (194) (atomic cleared+XP persist).
- **Wave merge gate GREEN**: `node scripts/smoke-progress.mjs` → `smoke-progress: PASS`;
  `bash scripts/check-progress.sh` → `progress checks: PASS`.

## Pending Human Verification (Task 3 — MANDATORY before phase is fully done)

The blocking `checkpoint:human-verify` real-browser boot has NOT been performed by the executor
(per the sequential-executor objective — the executor does not launch a browser). The orchestrator
must route this for manual testing. Steps for the human:

1. Serve over HTTP from the repo root (`file://` is blocked by the inline guard):
   `python3 -m http.server 8000`, open `http://localhost:8000/`.
2. Confirm the game **BOOTS to a visible canvas** with level-01 rendered (floor, platforms, coins,
   spikes, goal) — NOT a blank/loading-stuck screen (an a727c13 import-time-global regression).
3. Play level-01: confirm the **merged-floor feel is intact** — no snag on floor seams; spikes
   only kill on a real points touch.
4. Reach the goal, answer the math gate correctly to clear.
5. DevTools → Application → Local Storage: confirm key **`mathlab_platformer_v2`** exists with a
   `levels` object marking level-01 `cleared: true`, plus xp/level/accuracy/history; confirm the
   old `mathlab_platformer_v1` key (if present) is NOT read or modified.
6. Reload: confirm the game still boots and the cleared fact + xp/level survive.
7. (Optional) Set `localStorage.mathlab_platformer_v2` to junk (`"not json"`), reload, confirm the
   game still boots to safe defaults (never bricks).

Resume signal: type **"approved"** if all the above hold; otherwise describe what you saw
(blank screen, seam-stick, wrong key, lost progress).

## Threat Mitigations Applied

- **T-13-10 (Tampering, unknown levelId):** `getLevel(data?.levelId ?? LEVEL_ORDER[0])` — the
  forgiving fallback (Plan 03) means an unknown/junk id loads the first level, never crashes.
- **T-13-11 (Repudiation, cleared fact lost):** `markCleared(level.id)` persists in the SAME
  `writeSave` as XP — one atomic write. (Live confirmation is in the pending boot, steps 5-6.)
- **T-13-09 (DoS, a727c13 regression):** the engine-referencing `Rect` guard stays inside
  `buildLevel`'s body (Plan 03); the only browser-surfacing risk is covered by the mandatory boot
  checkpoint (PENDING).

## Deviations from Plan

None — plan executed exactly as written. (Two stale doc comments in game.js referencing the old
`buildLevel(LEVEL)`/`level.js` were updated to the registry path for accuracy; this is comment-only,
no behavior change.)

## Self-Check: PASSED

- FOUND: src/math/brain.js (modified)
- FOUND: src/scenes/game.js (modified)
- CONFIRMED DELETED: src/level.js
- FOUND: commit e1eaa3c (Task 1)
- FOUND: commit fa44246 (Task 2)
- PENDING: Task 3 real-browser boot (human-verify, gate=blocking) — deferred to orchestrator
