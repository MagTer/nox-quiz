---
phase: 11-progression-persistence
plan: 00
subsystem: progression-tooling
status: complete
tags: [config, validation, tooling, wave-0, xp, persistence]
requires: []
provides:
  - CONFIG.PROGRESS
  - CONFIG.SAVE
  - CONFIG.HUD
  - scripts/check-progress.sh
  - scripts/smoke-progress.mjs
affects:
  - src/progress.js (Wave 1 — reads CONFIG.PROGRESS/SAVE, is gated by both scripts)
  - src/ui/hud.js (Wave 3 — reads CONFIG.HUD, gated by check-progress.sh)
  - src/math/brain.js (Wave 1–2 — gains snapshot/seedAccuracy/seedHistory, gated)
  - src/scenes/game.js (Wave 1 — gains seedAccuracy/seedHistory boot wiring)
tech-stack:
  added: []
  patterns:
    - "Verification-tools-first (Wave 0): author the gate + headless smoke before the modules they check, so every later task's <automated> verify is runnable from commit one"
    - "Structural gate mirroring (check-progress.sh follows Phase 10 check-gate.sh): set -euo pipefail + git rev-parse root + fail() + guarded existence/syntax + positive/negative greps + final smoke"
    - "Banned tokens live ONLY in grep patterns, never in matched source — keeps the gated files clean"
    - "Headless pure-math smoke: plain ESM + console.assert + process.exit(1), imports the real pure modules, never touches browser storage"
key-files:
  created:
    - scripts/check-progress.sh
    - scripts/smoke-progress.mjs
  modified:
    - src/config.js
decisions:
  - "CONFIG.PROGRESS/SAVE/HUD ported verbatim from archive 604-619 — NOT re-tuned; HARD/EASY_TABLES intentionally duplicated with CONFIG.BRAIN (different consumers, firewall keeps modules independent)"
  - "FLASH_MS=450 (not archive's 800) — the ADHD-safe window from the STATE.md v2.0 tech-debt note"
  - "SAVE.KEY=mathlab_platformer_v1 is a brand-new namespaced key; the archive's mathlab_save_v1/v2 are NEVER read/written (no migration, CONTEXT decision)"
  - "Authored Task 3 (smoke) before Task 2 (gate) — the gate invokes the smoke as its final step, so the referenced artifact exists at each commit (Rule 3 ordering)"
  - "Both scripts are DESIGNED to fail today (the modules they verify arrive in Waves 1–3) — a real gate, not a no-op; they go green as later waves land"
metrics:
  duration: ~3min
  tasks: 3
  files: 3
  completed: 2026-06-26
---

# Phase 11 Plan 00: Wave-0 Tooling & Config Constants Summary

Authored the project's automated test layer (a structural gate + a headless pure-math smoke) FIRST, plus the three CONFIG namespaces every later progression module imports — so Waves 1–3 can point their `<automated>` verify at these scripts from commit one, and the firewall/anti-leak/forgiving contracts are machine-checkable immediately.

## What Was Built

### Task 1 — CONFIG.PROGRESS / CONFIG.SAVE / CONFIG.HUD (`src/config.js`, commit `171fe28`)
Three new sibling namespaces added inside the existing `CONFIG` object, mirroring the `CONFIG.BRAIN`/`CONFIG.GATE` "verbatim port, DO NOT re-tune" block style:
- **PROGRESS:** `XP_EASY=10`, `XP_HARD=20`, `BASE_XP=200`, `LEVEL_MULT=1.3`, `HARD_TABLES=[6,7,8,9]`, `EASY_TABLES=[1,2,3,4,5]` (ported verbatim from archive 604-619).
- **SAVE:** `KEY="mathlab_platformer_v1"` (new namespaced key, no migration), `VERSION=1`.
- **HUD:** `X/Y=16`, `BADGE_SIZE=18`, `BAR_W=160`, `BAR_H=10`, `BAR_DY=24`, `FLASH_SIZE=36`, `FLASH_MS=450` (ADHD-safe; explicitly not the archive's 800).
No HP/combat/dungeon/`ADVANCE_DELAY_MS`/`SEGMENT_COUNT` fields ported (out of milestone scope — verified absent).

### Task 3 — `scripts/smoke-progress.mjs` (commit `450d8af`)
Headless ESM smoke of the PURE progression + brain math (no test framework, `console.assert` + `process.exit(1)`). Imports the real `../src/progress.js` and `../src/math/brain.js` directly; never references browser storage. Assertions:
- **SAVE-01:** `threshold(1)===200`, `threshold(2)===260`; `addXp(7)` adds 20 returns false, `addXp(3)` adds 10; level-up crossing detection + surplus carry-over (exact crossing → 0, overshoot → carries 20, not reset).
- **SAVE-02:** `serialize(brain.snapshot())` round-trips xp/level/accuracy with a `version` field equal to `CONFIG.SAVE.VERSION`.
- **SAVE-02/03 history round-trip:** drive table 7 to a full mastery window, snapshot, then `createBrain({seedHistory})` and assert the per-table boolean window survives (same length, same values) — proves mastery/drill-reduction resume, not just accuracy.
- **SAVE-03 statistical:** seed table 7 at 0.05, draw ~2500 `nextQuestion()`, assert the seeded brain over-selects table 7 by >1.5x vs a fresh brain (the only automated proof weak-spot adaptation resumes).

### Task 2 — `scripts/check-progress.sh` (commit `5027552`)
Structural gate mirroring Phase 10's `check-gate.sh`: `#!/usr/bin/env bash`, `set -euo pipefail`, `ROOT="$(git rev-parse --show-toplevel)"`, `fail()` helper. Guarded existence + `node --check` for `src/progress.js`, `src/ui/hud.js`, `src/math/brain.js`. Positive greps: `QuotaExceededError`, `mathlab_platformer_v1`, `seedAccuracy` (both `game.js` + `brain.js`), `seedHistory` (both ends), `snapshot`, `fixed(`. Negative greps: progress.js imports no engine, brain.js touches no storage, HUD one-way (no write-back), gate awards no XP (forgiving). Final step invokes `smoke-progress.mjs`. Banned tokens appear only inside grep patterns.

## Deviations from Plan

**1. [Rule 3 - Ordering] Authored Task 3 (smoke) before Task 2 (gate).**
- **Found during:** Task 2 setup.
- **Issue:** `check-progress.sh` invokes `smoke-progress.mjs` as its final step; committing the gate before the smoke existed would reference a not-yet-created artifact within the same commit.
- **Fix:** Wrote and committed `smoke-progress.mjs` first (`450d8af`), then `check-progress.sh` (`5027552`). Both tasks still land in this plan; no behavior change.

**2. [Rule 1 - Bug] Removed the literal `localStorage` token from a smoke comment.**
- **Found during:** Task 3 verification.
- **Issue:** Task 3's `<automated>` verify requires `! grep -q 'localStorage' scripts/smoke-progress.mjs`. The token was present in a doc comment ("node has no `localStorage`"), failing the negative grep.
- **Fix:** Reworded the comment to "no browser storage API". The harness genuinely never touches storage; the token now appears nowhere in the file.
- **Files modified:** scripts/smoke-progress.mjs
- **Commit:** 450d8af (fix folded into the task commit before committing).

## Designed-to-Fail Behavior (expected)

Both scripts intentionally exit non-zero today — this is a real gate, not a no-op:
- `bash scripts/check-progress.sh` → `FAIL — missing module: src/progress.js (created by Phase 11 Wave 1–3)`, exit 1.
- `node scripts/smoke-progress.mjs` → `ERR_MODULE_NOT_FOUND` on `../src/progress.js`, exit 1.

They turn green as Waves 1–3 land `src/progress.js` (createProgress/serialize/threshold/addXp + QuotaExceededError seam), the extended `src/math/brain.js` (snapshot/seedAccuracy/seedHistory), `src/scenes/game.js` boot wiring, and `src/ui/hud.js` (fixed() one-way HUD). The smoke runs fully green after Wave 2 (when progress.js + the extended brain both exist).

## Verification Results

- `node --check src/config.js && node --check scripts/smoke-progress.mjs && bash -n scripts/check-progress.sh` → all syntax OK.
- `grep -q 'mathlab_platformer_v1' src/config.js` → present.
- `bash scripts/check-progress.sh; echo $?` → exit 1 with a clear FAIL pointing at the missing `src/progress.js` (confirms a real gate).
- No JS-test-framework imports in either script (project canon: none).
- No dungeon/HP/combat fields leaked into CONFIG.

## Known Stubs

None. The two scripts are complete and final; their non-zero exit is intended gate behavior keyed on Wave-1+ files, not a stub.

## Self-Check: PASSED
