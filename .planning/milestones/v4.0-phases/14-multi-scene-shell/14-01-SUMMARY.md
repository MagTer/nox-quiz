---
phase: 14-multi-scene-shell
plan: 01
subsystem: navigation-shell
tags: [scenes, navigation, import-safety, a727c13, level-select]
requires:
  - "src/levels/index.js (LEVEL_ORDER, isUnlocked) — Phase 13"
  - "src/progress.js (loadSave, createProgress, isLevelCleared) — Phase 11/13"
  - "src/scenes/game.js (scene-factory template; reads data?.levelId) — Phase 8/13"
provides:
  - "src/scenes/title.js (titleScene) — NAV-01 dark-grunge title + dual-input start"
  - "src/scenes/select.js (selectScene) — NAV-02 three-state level tiles + dual-input pick"
  - "scripts/check-import-safety.sh — a727c13 module-top-level negative-grep gate (NAV-04 static half)"
  - "CONFIG.TITLE + CONFIG.SELECT — scene layout constants"
affects:
  - "src/main.js (Plan 02 will register title/select + boot go('title'))"
  - "src/scenes/game.js (Plan 02 will add onClear → go('select') + Escape)"
tech-stack:
  added: []
  patterns:
    - "Scene-factory + closure-state discipline (mirrors game.js): engine globals body-only"
    - "Fresh derived read every entry: createProgress(loadSave()) → isUnlocked/isLevelCleared"
    - "Anchored top-level-only negative grep for a727c13 (scoped to scene modules)"
key-files:
  created:
    - "scripts/check-import-safety.sh"
    - "scripts/fixtures/bad-scene.js"
    - "src/scenes/title.js"
    - "src/scenes/select.js"
  modified:
    - "src/config.js (CONFIG.TITLE + CONFIG.SELECT blocks appended)"
decisions:
  - "check-import-safety.sh negative grep is ANCHORED to top-level forms (column-0 const/let/var engine call OR top-level typeof-engine guard), scoped to title.js/select.js only — game.js/main.js excluded (body-internal globals are correct)"
  - "Calibration fixture (scripts/fixtures/bad-scene.js) proves the gate goes RED on a column-0 const-assigned add(); same pattern stays GREEN on shipped game.js"
  - "Header-comment prose was reworded to keep banned grep tokens (innerHTML/document./localStorage/stay() ) out of the scene files — the acceptance criteria use plain whole-file negative greps"
  - "select.js cursor index is closure-local; unlock is DERIVED via isUnlocked, never stored (one source of truth)"
metrics:
  duration: ~3min
  completed: 2026-06-29
  tasks: 3
  files: 5
status: complete
---

# Phase 14 Plan 01: Multi-Scene Shell — Import-Safety Gate + Title/Select Scenes Summary

The a727c13 import-safety gate (`check-import-safety.sh`, calibrated red-on-fixture / green-on-game.js) plus the two new navigation scene factories — `titleScene` (NAV-01: dark-grunge "Math Lab" + Enter/Space/click → select) and `selectScene` (NAV-02: three-state level tiles derived fresh from `isUnlocked`+`isLevelCleared`, only unlocked tiles reach `go("game",{levelId})`) — establishing the per-scene factory + closure-state + import-safety contracts every later engine-touching phase inherits.

## What Was Built

### Task 1 — `scripts/check-import-safety.sh` + `scripts/fixtures/bad-scene.js` (commit 45658b7)
- Scaffolding mirrors `check-progress.sh` verbatim: `set -euo pipefail`, `ROOT=$(git rev-parse --show-toplevel)`, `fail()` (prints `import-safety checks: FAIL — <msg>`), `strip_comments()`.
- **Section 0** — existence + `node --check` syntax loop over title.js/select.js/game.js/main.js.
- **Section 1** — positive structural greps: each scene exports a `...Scene(` factory; main.js registers `scene("title"`/`scene("select"`/boots `go("title"`. (The main.js greps are RED until Plan 02 — the intended real red state this wave.)
- **Section 2** — SCOPED, comment-stripped, **top-level-anchored** a727c13 negative grep over title.js + select.js ONLY (game.js/main.js excluded — their engine globals live inside bodies / post-init module scope, RESEARCH Pitfall 5). Pattern matches a column-0 `(const|let|var) … = … <engineFactory>(` OR a top-level `typeof (Rect|add|vec2|rgb)`.
- `bad-scene.js` is the calibration fixture: a column-0 `const banner = add([...])` trap proving the gate can go RED, with a header marking it deliberately-bad / not shipped.

### Task 2 — `src/scenes/title.js` + `CONFIG.TITLE`/`CONFIG.SELECT` (commit 2dcc250)
- `titleScene(data)` draws the centered "Math Lab" wordmark (neon-green accent) + a press-to-start prompt (light-grey), both `fixed()` screen-space canvas `text()`. NO pink.
- Dual-input start wired INSIDE the body: `onKeyPress("enter")`, `onKeyPress("space")`, full-screen `onClick`, all `go("select")`.
- `CONFIG.TITLE` (wordmark/prompt sizes + offset) and `CONFIG.SELECT` (tile geometry + text sizes) appended to the CONFIG object — no magic numbers in either scene.

### Task 3 — `src/scenes/select.js` (commit 7cd3ee0)
- `selectScene(data)` reads `createProgress(loadSave())` FRESH on entry, maps `LEVEL_ORDER` → tile model with state `cleared ? "cleared" : isUnlocked(id,progress) ? "unlocked" : "locked"` — unlock DERIVED, never stored (one source of truth).
- Three visually distinguishable tile states (locked = dim grey + "X" glyph, no click handler; unlocked = accent; cleared = blue + "v" glyph), each a tagged `"select"` `fixed()` `rect()`+`text()`.
- Dual input: unlocked tiles get an obj-scoped `onClick → go("game",{levelId})`; a CLOSURE-LOCAL cursor (`left`/`right`/`enter`) navigates UNLOCKED tiles only and plays via `go("game",{levelId})`. `levelId` payload is the sole cross-scene handoff. No `stay()`, no DOM/storage sink, no module-top-level engine reference.

## Verification

- `node --check` passes on src/scenes/title.js, src/scenes/select.js, src/config.js.
- **Calibration proven both directions:** the top-level-trap pattern MATCHES `scripts/fixtures/bad-scene.js` (RED) and does NOT match `src/scenes/game.js` (GREEN).
- Per-task grep batteries all green (scene-factory export, `go("select")`/`go("game"` + `levelId`, dual-input forms, `createProgress`/`loadSave`/`isUnlocked`/`LEVEL_ORDER`/`isLevelCleared`, CONFIG.TITLE/SELECT present; negative DOM-sink + `stay(` find nothing; a727c13 top-level negative stays green on both scenes).
- `bash scripts/check-progress.sh` → `progress checks: PASS` (pure registry/progress modules untouched).
- `bash scripts/check-import-safety.sh` → fails ONLY at the Section 1 main.js registration grep (Plan 02 boundary) — Sections 0 and 2 over the new scenes passed first. The gate is real, not a no-op.

## Deviations from Plan

None — plan executed exactly as written. The only adjustments were rewording header-comment prose in title.js/select.js to keep the banned grep tokens (`innerHTML`, `document.`, `localStorage`, `stay(`) out of the source files, which is plan-conformant: the acceptance criteria explicitly require those whole-file negative greps to find nothing.

## Known Stubs

None. Tiles render real registry/progress state; no empty-data placeholder flows to the UI.

## Notes for Plan 02

- `check-import-safety.sh` Section 1 stays RED until main.js registers `scene("title"…)`, `scene("select"…)` and boots `go("title")` — that flip is Plan 02's job and turns the gate fully green.
- `game.js` clear path (`onClear` → `go("select")`) and the Escape controller are Plan 02 edits (the levelId read at game.js:65 already exists; do NOT rebuild it).
- The mandatory real browser boot is Plan 03 (greps ≠ boots).

## Self-Check: PASSED
