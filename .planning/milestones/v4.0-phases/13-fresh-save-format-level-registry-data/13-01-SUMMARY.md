---
phase: 13-fresh-save-format-level-registry-data
plan: 01
subsystem: test-harness
tags: [save-format, level-registry, gates, wave-0, a727c13, import-safety]
status: complete
requires:
  - "scripts/smoke-progress.mjs (shipped Phase 11 harness)"
  - "scripts/check-progress.sh (shipped Phase 11 gate)"
  - "src/progress.js, src/config.js, src/level.js (shipped sources read for assertions)"
provides:
  - "Extended node smoke covering SAVE-05/06/07 + LVL-02 + LVL-02-regression (RED until Wave 1/2)"
  - "Extended structural grep gate covering the v2 key, levels seam, registry, a727c13 import-safety (RED until Wave 1/2)"
  - "Pinned contract: CONFIG.SAVE.KEY = mathlab_platformer_v2, VERSION = 2 (Wave 1 Plan 02 must match)"
affects:
  - "scripts/smoke-progress.mjs"
  - "scripts/check-progress.sh"
tech-stack:
  added: []
  patterns:
    - "Wave-0 gates-first: assertions land RED before the implementation they verify"
    - "Inline recursive deep-equal (no dependency) for verbatim-geometry regression"
    - "Comment-stripped negative grep, scoped to data+registry modules only (a727c13)"
key-files:
  created: []
  modified:
    - "scripts/smoke-progress.mjs"
    - "scripts/check-progress.sh"
decisions:
  - "Save key/version pinned to mathlab_platformer_v2 / VERSION 2 (Claude discretion per 13-CONTEXT A1); the smoke reads CONFIG.SAVE.VERSION (constant, auto-propagates), the gate hard-greps the v2 KEY string"
  - "Geometry regression reconstructs expected spike/goal/checkpoint values from CONFIG (SPIKE_SIZE/GOAL_SIZE/FLOOR_Y) with the same expressions src/level.js uses — byte-equivalent, not eyeballed"
  - "Negative a727c13 grep scoped to level-01.js + index.js ONLY; build.js excluded because it legitimately references Rect/add inside buildLevel's body"
metrics:
  duration: ~6min
  tasks: 2
  files: 2
  completed: 2026-06-29
---

# Phase 13 Plan 01: Wave-0 Test Gates for Fresh Save Format + Level Registry Summary

Extended the project's two no-framework "test" scripts (headless node smoke + bash structural grep gate) to assert the NEW save shape (per-level `cleared` map + derived unlock + corrupt-save tolerance), the level registry (ordered, level-01 verbatim geometry, builder importable), and the a727c13 import-safety invariant for `src/levels/` — landed RED before the Wave 1/2 implementation that turns them green.

## What Was Built

**Task 1 — `scripts/smoke-progress.mjs` (commit a862871):**
- Added a top-of-file registry import `import { LEVEL_ORDER, getLevel, isUnlocked } from "../src/levels/index.js"` — this is what makes the smoke RED now (`ERR_MODULE_NOT_FOUND` until Wave 1/2 creates the module).
- SAVE-06 cleared-map round-trip: `markCleared("level-01") → serialize → createProgress(blob) → isLevelCleared === true`; never-cleared id is false.
- SAVE-06 derived unlock: `isUnlocked(LEVEL_ORDER[0], fresh) === true`; a hypothetical second id (length-guarded so a single-level registry does not false-fail) is locked until its predecessor is cleared, then unlocked.
- SAVE-05 never-bricks: four hostile blobs passed DIRECTLY to `createProgress` (the smoke never touches storage) — `levels:"not-an-object"`, a `__proto__`/junk-id map with a non-boolean cleared flag, an `Infinity` level (`1e400`), and a wholly foreign blob. Asserts no throw, finite/sane level, non-boolean cleared not truthy, and no prototype pollution (`({}).cleared === undefined`).
- LVL-02 registry: `LEVEL_ORDER[0] === "level-01"`; `getLevel("level-01").id === "level-01"`; `getLevel(bad)` falls back to the first level.
- LVL-02 regression: an inline recursive `deepEqual` compares `getLevel("level-01").geometry` against the EXACT v3.0 `src/level.js` values (spike/goal/checkpoint reconstructed from CONFIG with the same expressions).
- SAVE-07: existing xp/level/accuracy/history cases kept green; added an assertion that `serialize()` now ALSO carries a `levels` object recording level-01 cleared.

**Task 2 — `scripts/check-progress.sh` (commit 45a61d8):**
- Added a repo-convention `strip_comments()` (sed `s://.*$::`) for the negative grep.
- Replaced the v3.0 `mathlab_platformer_v1` key grep with the NEW `mathlab_platformer_v2` key grep (the canonical grep-coupling trap, Pitfall 6).
- Added `src/levels/{index,build,level-01}.js` to the existence + `node --check` loop.
- Positive greps: `markCleared` / `isLevelCleared` / `levels` in progress.js; `LEVEL_ORDER` / `getLevel` / `isUnlocked` in index.js; `buildLevel` in build.js.
- NEGATIVE a727c13 grep (comment-stripped) scoped to `level-01.js` + `index.js` ONLY — fails if any engine global (`typeof Rect`, bare `add(`/`rect(`/`sprite(`/`vec2(`, `kaplay`) appears. build.js is deliberately excluded (it references `Rect` inside `buildLevel`).
- Kept the final `node scripts/smoke-progress.mjs` invocation as the last step.

## Verification

- `node --check scripts/smoke-progress.mjs` → exit 0.
- `bash -n scripts/check-progress.sh` → exit 0.
- Grep counts: `isUnlocked`/`LEVEL_ORDER`/`markCleared`/`getLevel` all ≥1 in the smoke; the v2 import path present.
- `mathlab_platformer_v2` ≥1 in the gate; `mathlab_platformer_v1` == 0 in the gate (old assertion removed).
- Both gates RED now (smoke exits 1 with `ERR_MODULE_NOT_FOUND` for `src/levels/index.js`; gate exits 1 with "missing module: src/levels/index.js") — the documented, expected RED state. They turn green after Waves 1–2.

## Contract Pinned for Wave 1

Wave 1 Plan 02 MUST set, in `src/config.js`, `CONFIG.SAVE.KEY = "mathlab_platformer_v2"` and `CONFIG.SAVE.VERSION = 2`, or this gate stays red. Wave 1/2 MUST create `src/levels/index.js` (exporting `LEVEL_ORDER`, `getLevel`, `isUnlocked`), `src/levels/build.js` (`buildLevel`), and `src/levels/level-01.js` (verbatim geometry inside a `geometry` field) plus extend `src/progress.js` with `markCleared`/`isLevelCleared`/`levels`.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- FOUND: scripts/smoke-progress.mjs (modified)
- FOUND: scripts/check-progress.sh (modified)
- FOUND: commit a862871 (Task 1)
- FOUND: commit 45a61d8 (Task 2)
