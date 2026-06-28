---
phase: 11-progression-persistence
plan: 01
subsystem: progression-persistence
status: complete
tags: [progression, persistence, xp, localstorage, firewall, pure-module]
requires:
  - "src/config.js (CONFIG.PROGRESS.* / CONFIG.SAVE.* / CONFIG.BRAIN.MASTERY_WINDOW)"
provides:
  - "src/progress.js — createProgress(saved) pure factory + loadSave()/writeSave() guarded seam"
  - "serialize() blob shape {version,xp,level,accuracy,history} (the persistence contract)"
affects:
  - "11-02 (brain.snapshot/seedAccuracy/seedHistory consumes this serialize shape)"
  - "11-03 (HUD reads progress.getLevel/getXp/nextThreshold; game.js wires loadSave/writeSave)"
tech-stack:
  added: []
  patterns:
    - "pure-factory: createProgress() returns a fresh closure, never reads storage at construction (node-importable)"
    - "guarded seam: localStorage confined to storageAvailable()/loadSave()/writeSave(), defined-not-called at import time"
    - "explicit-field validation: whitelisted, range-checked copy (no Object.assign/spread of untrusted blob)"
key-files:
  created:
    - "src/progress.js"
  modified: []
decisions:
  - "Exposed BOTH explicit getters (getXp/getLevel) AND live xp/level getter properties — the headless smoke (smoke-progress.mjs) reads p.xp/p.level directly while the plan behaviour spec uses getXp()/getLevel(). Rule 2 add."
  - "Ported XP amounts (10/20) and the level curve round(BASE_XP*MULT^(L-1)) VERBATIM from the archive — not re-tuned (validated v1/v2 values)."
  - "addXp uses a while-loop (RESEARCH Pattern 1) not the archive's single if — carries surplus across multi-level awards; xp -= threshold (never reset to 0)."
  - "NO migration: loadSave reads/writes ONLY CONFIG.SAVE.KEY (mathlab_platformer_v1); the school game's mathlab_save_* is never touched."
metrics:
  duration: "~2 min"
  completed: "2026-06-26"
  tasks: 2
  files: 1
---

# Phase 11 Plan 01: Pure progress.js (XP/level + guarded save seam) Summary

Created `src/progress.js` — the pure progression module owning the validated v1/v2 XP/level math plus a guarded localStorage seam, imports ONLY `./config.js` (zero Kaplay), and is headlessly runnable in plain node.

## What Was Built

**`createProgress(saved)`** — a pure factory returning a fresh per-game closure:
- `threshold(lvl) = round(CONFIG.PROGRESS.BASE_XP * LEVEL_MULT^(lvl-1))` — verbatim curve (200, 260, ...).
- `calculateXp(table)` — HARD tables (6–9) award 20, EASY (1–5) award 10.
- `addXp(table)` — adds XP, while-loop carries surplus on level-up (`xp -= threshold`, never reset to 0), returns `true` exactly when a level-up occurs.
- `getXp()/getLevel()` + live `xp`/`level` getter properties; `threshold` / `nextThreshold()`.
- `serialize(brainSnapshot)` → `{version, xp, level, accuracy, history}` — persists ONLY progression + brain stats, never run/session state. Missing snapshot defaults accuracy/history to `{}`.
- Seeds `xp`/`level` from `saved` with archive-grade validation (xp finite & ≥0 else 0; level number ≥1 floored else 1). **Never reads localStorage at construction** — this is the load-bearing decision that keeps the node smoke able to exercise the math without a browser.

**Guarded seam** (`storageAvailable()` / `loadSave()` / `writeSave()`):
- `storageAvailable()` — try-catch probe (node has no localStorage; iframe access can throw).
- `loadSave()` — forgiving: missing storage / missing key / corrupt JSON / version mismatch / throwing getItem all return `defaults()` and never throw. **No migration** — version mismatch is a fresh start.
- `writeSave(blob)` — no-op when storage blocked; catches `QuotaExceededError` and any other setItem failure, warns, never rethrows.
- `validate(data)` — explicit-field copy: whitelisted, range-checked keys only (no `Object.assign`/spread of the untrusted blob — prototype-pollution mitigation T-01-01), `parseInt` JSON string keys, accuracy clamped to table 1..9 / value 0..1, history filtered to booleans and clamped to `MASTERY_WINDOW`.
- All three are defined-not-called at import time, so importing the module under node touches no storage API and cannot throw.

## Verification

- `node --check src/progress.js` — passes.
- Task 1 automated verify (threshold 200/260, addXp 20/false, 11×hard → level 2 + surplus 20) — **PASS**.
- Task 2 automated verify (`QuotaExceededError`/`createProgress` greps, no-kaplay grep, node loadSave→defaults + writeSave no-op) — **PASS**.
- Isolated full progress.js contract check (SAVE-01 math, exact/overshoot surplus, serialize whitelist keys, garbage-clamp validation, defaults) — **PASS**.
- `import('./src/progress.js')` does not throw at module scope (no storage leak — RESEARCH Pitfall 1 warning sign absent).
- Firewall: `! grep -qE 'kaplay|lib/kaplay' src/progress.js` holds; the only import is `./config.js`.

**Expected partial smoke state:** `node scripts/smoke-progress.mjs` passes the SAVE-01 threshold/XP/surplus blocks (lines 33–73) then stops at line 85 on `brain.snapshot is not a function` — a Wave-2 brain dependency, exactly as the plan's verification note (line 132) predicted. The two `mathlab_save_v1/v2` grep hits in progress.js are explanatory comments (the firewall documents that the old key is never touched), not code references; the only key actually read/written is `CONFIG.SAVE.KEY`.

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] Live `xp`/`level` getter properties added alongside `getXp()`/`getLevel()`**
- **Found during:** Task 1 (reading the acceptance harness `scripts/smoke-progress.mjs`).
- **Issue:** The plan `<behavior>`/`<verify>` use `getXp()`/`getLevel()`, but the authoritative SAVE-01/SAVE-02 smoke reads `p.xp`, `p.level`, `restored.xp`, `restored.level` directly as properties. Getters-only would fail the SAVE-02 round-trip assertions.
- **Fix:** Exposed `get xp()` / `get level()` mirroring the closure, in addition to the explicit getters. Satisfies both contracts.
- **Files modified:** src/progress.js
- **Commit:** ae28f54

No other deviations — XP curve, XP amounts, surplus carry-over, validation, and the seam were ported as specified.

## Known Stubs

None. The module is complete and fully functional; the only unmet smoke assertions are Wave-2/3 brain/HUD dependencies external to this plan.

## Self-Check: PASSED
- FOUND: src/progress.js
- FOUND commit ae28f54 (feat 11-01: pure createProgress factory)
- FOUND commit 36648fb (feat 11-01: guarded localStorage seam)
