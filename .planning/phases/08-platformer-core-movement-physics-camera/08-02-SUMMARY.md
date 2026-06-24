---
phase: 08-platformer-core-movement-physics-camera
plan: 02
subsystem: platformer-core
status: complete
tags: [platformer, game-feel, coyote, jump-buffer, variable-height, camera, checkpoint, respawn, kaplay]
requires:
  - "CONFIG (src/config.js) — COYOTE_MS / BUFFER_MS / JUMP_CUT / JUMP_FORCE / CAM_RATE / CAM_Y_FACTOR / LEVEL_* / FALL_MARGIN (Plan 01)"
  - "makePlayer(startX, startY) (src/player.js) — Plan 01 player factory extended here"
  - "gameScene(data) (src/scenes/game.js) — Plan 01 test-strip scene + seeded lastCheckpoint closure var"
provides:
  - "followCamera(target) (src/camera.js) — frame-rate-independent lerp + clamp to level bounds"
  - "game-feel layer in makePlayer — coyote/buffer/variable-height jump (single jump path)"
  - "checkpoint-respawn policy in gameScene — addCheckpoint() + onCollide(checkpoint) + reset()/respawn() reposition-in-place (the seam Phase 9 hazards reuse)"
affects:
  - "src/player.js (extended: game-feel layer replaces the basic jump; opacity(1) added for flash)"
  - "src/scenes/game.js (extended: camera follow + checkpoints + respawn; basic jump removed)"
tech-stack:
  added: []
  patterns:
    - "Hand-wired game-feel (coyote/buffer/variable-height) on body() primitives — closure-local dt() timers"
    - "Frame-rate-independent camera smoothing: 1 - exp(-CAM_RATE*dt()) (never raw constant lerp)"
    - "Camera clamp to level bounds via width()/2, height()/2 (no void at edges)"
    - "Reposition-in-place respawn (never go()) — progress preserved, ADHD-safe, no game-over"
    - "Named reset() anti-leak contract in scene closure; respawn() delegates to it"
key-files:
  created:
    - src/camera.js
  modified:
    - src/player.js
    - src/scenes/game.js
decisions:
  - "Single jump path: the Plan 01 basic grounded jump (in the scene) was removed; the coyote/buffer/variable-height path in makePlayer is the only jump trigger (prevents double-trigger)"
  - "Added opacity(1) to the player entity so the respawn flash actually renders (the opacity component is required for player.opacity to affect rendering)"
  - "Respawn flash implemented as tween(0.2 -> 1, 0.18s, easeOutQuad) on player.opacity — quick, no fail UI"
  - "Two checkpoints placed: near start (96,272) and by the gap platforms (820,192); last-touched wins"
  - "respawn = reset (alias): reset() is the named CONTEXT/RESEARCH anti-leak contract; respawn() is the fall-off-world caller"
metrics:
  duration: ~4min
  completed: 2026-06-24
  tasks: 3
  files: 3
---

# Phase 8 Plan 02: Game-Feel, Camera & Checkpoint Respawn Summary

Layered the Mario-feel and presentation on top of the Plan 01 spine: hand-wired
variable jump height, coyote time, and jump buffering inside `makePlayer`; a
frame-rate-independent camera (`src/camera.js`) that follows the player and clamps to
level bounds; and the gentle checkpoint-respawn policy in the scene (last-touched
checkpoint marker -> reposition-in-place on fall-off-world, momentum zeroed, quick
opacity flash, no game-over). This establishes the respawn policy Phase 9 hazards reuse.

## What Was Built

- **src/player.js (extended)** — added the game-feel layer to `makePlayer`:
  closure-local `coyote` / `buffer` timers (seconds), both decremented by `dt()` in the
  player `onUpdate` (frame-rate independent). Coyote refills to `COYOTE_MS/1000` while
  grounded, bleeds down in air; `buffer` always bleeds down. A buffered jump is consumed
  (`player.jump(CONFIG.JUMP_FORCE)`, both timers zeroed) when `buffer > 0 &&
  (isGrounded() || coyote > 0)`. `onKeyPress(["space","up","w"])` sets the buffer;
  `onKeyRelease(...)` cuts a still-rising jump (`player.vel.y < 0`) by `CONFIG.JUMP_CUT`
  (variable height; up is negative Y). Added `opacity(1)` to the entity so the scene's
  respawn flash renders.
- **src/camera.js (new)** — `followCamera(target)`: reads `getCamPos()`, computes the
  frame-rate-independent factor `t = 1 - Math.exp(-CONFIG.CAM_RATE * dt())`, lerps X
  toward the target primarily and Y gently (`t * CONFIG.CAM_Y_FACTOR`), then clamps the
  camera center to `[LEVEL_LEFT+halfW, LEVEL_RIGHT-halfW]` / `[LEVEL_TOP+halfH,
  LEVEL_BOTTOM-halfH]` (`halfW/halfH` from `width()/2`, `height()/2`) and calls
  `setCamPos`. No raw constant-factor lerp anywhere.
- **src/scenes/game.js (extended)** — imports `followCamera`; removed the Plan 01 basic
  grounded jump (single jump path now). Added `addCheckpoint(x,y)` near-invisible markers
  (`rect(8,48)`, `opacity(0.001)`, `"checkpoint"` tag) at `(96,272)` and `(820,192)`;
  `player.onCollide("checkpoint", c => lastCheckpoint = c.pos.clone())`. Added the named
  `reset()` anti-leak contract (reposition `player.pos` to `lastCheckpoint.clone()`,
  `player.vel = vec2(0)`, quick opacity flash) with `const respawn = reset`. The scene
  `onUpdate` calls `followCamera(player)` and, on `player.pos.y > CONFIG.LEVEL_BOTTOM +
  CONFIG.FALL_MARGIN`, calls `respawn()` — reposition-in-place, never `go()`.

## Requirements Satisfied

- **MOVE-03** — variable jump height (release-cut), coyote time, and jump buffering, all
  via closure-local `dt()` timers; thresholds from CONFIG.
- **MOVE-04** — camera follows the player with frame-rate-independent smoothing and clamps
  to level bounds (no void shown at edges).
- **LEVEL-06** — fall-off-world respawns at the last-touched checkpoint with momentum
  zeroed and a quick flash; no lives, no game-over; all state in the scene closure.

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Game-feel layer (variable height + coyote + buffer) | 28e4471 | src/player.js, src/scenes/game.js |
| 2 | Camera module (follow + bounds clamp) | cef20cf | src/camera.js, src/scenes/game.js |
| 3 | Checkpoint markers + gentle respawn | 2b39933 | src/scenes/game.js, src/player.js |

## Verification

- `node --check` passes on src/player.js, src/camera.js, src/scenes/game.js (the project's
  syntax/build gate — no test runner by no-build design).
- All modules resolve over HTTP (`200` for main.js, config.js, player.js, camera.js,
  scenes/game.js, index.html via `python3 -m http.server`) — the production ESM import
  graph is intact.
- Per-task automated greps all pass: CONFIG.COYOTE_MS/BUFFER_MS/JUMP_CUT + onKeyRelease +
  `vel.y < 0` (player); `1 - Math.exp(-CONFIG.CAM_RATE*dt())` + setCamPos + clamp + no raw
  constant lerp (camera); `onCollide("checkpoint")` + `LEVEL_BOTTOM+FALL_MARGIN` +
  `lastCheckpoint.clone()` + `vec2(0)` + a named `reset()` symbol + no `go("game")` in the
  respawn path (scene).
- Single jump-trigger path confirmed: the scene no longer references `isGrounded` (the
  Plan 01 basic jump was removed).

### Manual (in-browser) checks left for the verifier

These require a human at the served strip (per the plan's `<manual>` steps):

- MOVE-03: tap jump -> short hop; hold jump -> noticeably taller (variable height). Run off
  the ledge and press jump within a beat -> still jumps (coyote). Press jump just before
  landing -> fires on touchdown, not eaten (buffer). No double-jump on one press.
- MOVE-04: run the full strip -> camera trails smoothly with gentle vertical drift, no
  jitter; at the left/right ends the camera stops at the bounds, no void shown.
- LEVEL-06: touch the second checkpoint, then fall off the world -> respawn at the second
  checkpoint (not the start), momentum zeroed, quick flash, instant control return, NO
  game-over / NO lives. Fall before touching the second -> respawn at the first.
- MOVE-05 (phase gate): repeat MOVE-03/04 with DevTools refresh emulation / on a 120-144Hz
  display -> jump height, run distance, and camera feel must match 60Hz.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added `opacity(1)` to the player entity**
- **Found during:** Task 3
- **Issue:** The plan's respawn flash sets/tweens `player.opacity`, but the Plan 01 player
  entity had no `opacity()` component, so writing `player.opacity` would not affect
  rendering — the flash would be silently inert.
- **Fix:** Added `opacity(1)` to the `add([...])` component list in `makePlayer` and noted
  `opacity` in the player module's globals comment.
- **Files modified:** src/player.js
- **Commit:** 2b39933

**2. [Rule 3 - Blocking verification-gate issue] Reworded doc comments to clear `grep` guards**
- **Found during:** Task 2 and Task 3
- **Issue:** Two automated `! grep` guards (no raw constant lerp; no `go("game")` in the
  respawn path) matched explanatory text inside doc comments (`lerp(a, b, 0.1)` and `go("game",
  data)`), not actual code, causing the verify command to fail despite correct logic.
- **Fix:** Reworded the comments ("raw constant-factor lerp"; "seeded via the go() data
  payload") so the guards reflect actual code only. No logic changed.
- **Files modified:** src/camera.js, src/scenes/game.js
- **Commits:** cef20cf, 2b39933

## Known Stubs

None. The green placeholder rect remains the CONTEXT-specified avatar (real sprite is a
Phase 9 deliverable, not a stub). Checkpoint markers are intentionally near-invisible
(`opacity(0.001)`) collision volumes — the visible checkpoint art is Phase 9/12 polish.

## Notes for Plan 03 / Phase 9

- The respawn policy is the reusable seam: `reset()` / `respawn()` reposition-in-place and
  zero velocity; Phase 9 hazards should call the same path (no `go()`).
- `lastCheckpoint` and all run state live in the `gameScene` closure — add hazard/coin state
  there too (no module-level `let`).
- Camera lookahead and respawn juice are deferred to Phase 12 (CONTEXT).
- Game-feel CONFIG values (COYOTE_MS, BUFFER_MS, JUMP_CUT, CAM_RATE, CAM_Y_FACTOR) are
  starting tunables — final feel is tuned with the kid in Phase 12.

## Self-Check: PASSED

- Files: src/camera.js FOUND, src/player.js FOUND, src/scenes/game.js FOUND,
  08-02-SUMMARY.md FOUND.
- Commits: 28e4471 FOUND, cef20cf FOUND, 2b39933 FOUND.
