---
phase: 14-multi-scene-shell
plan: 02
subsystem: navigation-shell
tags: [scenes, navigation, boot, nav-03, import-safety]
requires:
  - "src/scenes/title.js (titleScene) — Plan 01"
  - "src/scenes/select.js (selectScene) — Plan 01"
  - "src/scenes/game.js (gameScene; reads data?.levelId, has onClear persist) — Phase 8/13 + Plan 01 spine"
  - "scripts/check-import-safety.sh (Section 1 main.js greps) — Plan 01"
provides:
  - "src/main.js boot generalization — registers title/select/game, boots go('title') (NAV-01)"
  - "src/scenes/game.js clear→select return + Escape→select controller (NAV-03)"
  - "scripts/check-import-safety.sh fully GREEN (Section 1 main.js greps now satisfied) — NAV-04 static half complete"
affects:
  - "Plan 03 (mandatory real browser boot — greps ≠ boots; runtime no-leak proof)"
tech-stack:
  added: []
  patterns:
    - "Register-all-scenes-before-any-go() boot order (title is the boot entry)"
    - "Clear → go('select') return AFTER existing persist — no auto-advance, no timer (SAFE-01)"
    - "In-body app-bus Escape controller auto-cleared by go() (Kaplay 3001) — no manual cancel"
key-files:
  created: []
  modified:
    - "src/main.js (import titleScene/selectScene; register title/select/game; go('title'))"
    - "src/scenes/game.js (onClear → go('select') after persist; in-body onKeyPress('escape') → go('select'))"
decisions:
  - "Boot passes no start coords — go('title') only. The select→game handoff carries levelId; game.js derives start defaults internally (data?.startX ?? 64), so the old {startX,startY} boot payload is dropped."
  - "go('select') placed as the FINAL line of onClear, AFTER the existing writeSave — persist-then-return; fx.clearBurst() fires for the current frame before teardown. No wait()/loop()/setTimeout (SAFE-01)."
  - "Escape controller registered in the scene body (not module top level), keeping a727c13 import-safety intact; go() auto-clears it in Kaplay 3001."
  - "Comment prose reworded to keep the banned grep token 'stay(' out of game.js (acceptance criterion is a whole-file negative grep) — same prose-hygiene pattern Plan 01 established."
metrics:
  duration: ~2min
  completed: 2026-06-29
  tasks: 3
  files: 2
status: complete
---

# Phase 14 Plan 02: Multi-Scene Shell — Boot Wiring + Clear/Escape Return Summary

Wired the three-scene shell together: `main.js` now registers `title`/`select`/`game` and boots `go("title")` (NAV-01), and `game.js`'s clear path returns to level-select via `go("select")` after the existing persist plus a mid-level Escape bail (NAV-03) — turning `check-import-safety.sh` fully GREEN (NAV-04 static half) with no timer, no `stay()`, and no auto-advance into the next level.

## What Was Built

### Task 1 — `src/main.js` boot generalization (commit e675c77)
- Added `import { titleScene } from "./scenes/title.js"` and `import { selectScene } from "./scenes/select.js"` next to the existing `gameScene` import.
- Registered all three scenes BEFORE any `go()`: `scene("title", titleScene)`, `scene("select", selectScene)`, `scene("game", gameScene)`.
- Replaced `go("game", { startX: 64, startY: 64 })` with `go("title")` — the title is now the boot entry.
- LEFT UNTOUCHED: the `kaplay()` init, the +50% canvas display-scale block (`canvas.style.width/height`), and all 5 `loadSprite(...)` asset loads (assets register before any scene runs).

### Task 2 — `src/scenes/game.js` clear→select + Escape→select (commit 35fef2b)
- **(1) Clear → select:** appended `go("select")` as the FINAL line of the existing `onClear` callback, AFTER `writeSave(progress.serialize(brain.snapshot()))`. The previously-terminal "LEVEL CLEAR" stay is now a return; `go()` tears down the gate's `fixed()` objects cleanly. No `wait()`/`loop()`/`setTimeout` introduced (SAFE-01).
- **(2) Escape → select:** added `onKeyPress("escape", () => go("select"))` in the scene body (alongside the `onUpdate` registration), giving mid-level bail with no forced replay. App-bus controller auto-cleared by `go()` in Kaplay 3001 — no manual cancel.
- UNCHANGED: the `data?.levelId` read (line 65), `markCleared`, `writeSave`, `addXp`, HUD, fx, the respawn/checkpoint seams, and the `onHide`/`onSceneLeave` anti-leak cancels.

### Task 3 — Full static gate (no code change)
- Per-wave full-suite gate now that the boot is wired. Both gates run end-to-end and pass.

## Verification

- `node --check src/main.js` and `node --check src/scenes/game.js` pass.
- Task 1 grep battery: all three `scene("title"/"select"/"game"` registrations present; `go("title"` present; old `go("game", { startX` gone; `titleScene`/`selectScene` imports present; `loadSprite(` count unchanged at 5; `canvas.style.width` intact.
- Task 2 grep battery: `go("select"` count is 2 (onClear + Escape); `onKeyPress("escape"` present; `markCleared`/`writeSave`/`data?.levelId` intact; `stay(` finds nothing; `check-safety.sh` green (no `wait(`/`loop(`/`setTimeout`).
- `bash scripts/check-import-safety.sh` → `import-safety checks: PASS` (Section 1 main.js greps now satisfied — the gate flipped from its Plan-01 red state to fully green).
- `bash scripts/check-progress.sh` → `progress checks: PASS` (pure registry/progress layer untouched).
- `bash scripts/check-safety.sh` → `safety checks: PASS`.

## Deviations from Plan

None — plan executed exactly as written. The only adjustment was rewording two of my own added comments in game.js to remove the literal `stay(` token, since Task 2's acceptance criterion is a whole-file negative grep (`! grep -q 'stay('`). This is plan-conformant and mirrors the prose-hygiene pattern Plan 01 established. No behavior change.

## Known Stubs

None. The boot reaches a real title scene; the clear/Escape paths reach a real select scene that derives live unlock state.

## Threat Flags

None. No new network endpoints, auth paths, file access, or schema changes. The two threats this plan mitigates (T-14-03 boot-blank via bad registration/a727c13; T-14-04 clear-path timer) are addressed: all three scenes register before any `go()` and the clear→select transition fires directly with no `wait()`/`loop()`/`setTimeout` (confirmed green by `check-safety.sh`).

## Notes for Plan 03

- The full navigation graph now exists statically: title → select → game → (clear or Escape) → select.
- Plan 03 is the mandatory real browser boot — the runtime no-leak proof that greps ≠ boots (the title must actually render, the clear path must actually return without a leaked listener stacking across go()).

## Self-Check: PASSED

- `src/main.js` modified — FOUND.
- `src/scenes/game.js` modified — FOUND.
- `.planning/phases/14-multi-scene-shell/14-02-SUMMARY.md` — FOUND.
- Commit e675c77 (Task 1) — FOUND in git log.
- Commit 35fef2b (Task 2) — FOUND in git log.
