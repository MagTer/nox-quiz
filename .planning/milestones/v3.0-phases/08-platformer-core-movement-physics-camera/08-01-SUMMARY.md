---
phase: 08-platformer-core-movement-physics-camera
plan: 01
subsystem: platformer-core
status: complete
tags: [platformer, movement, physics, config, kaplay, stress-strip]
requires:
  - "src/main.js (Phase 7 game shell — kaplay init block, scene/go convention)"
  - "lib/kaplay.mjs (vendored Kaplay 3001.0.19)"
provides:
  - "CONFIG (src/config.js) — all movement/physics/camera/level tunables"
  - "makePlayer(startX, startY) (src/player.js) — placeholder player entity + dt-correct run"
  - "gameScene(data) (src/scenes/game.js) — seeded test-strip scene, closure-owned run state"
  - "'player' / 'ground' tagged entities; go('game', {startX,startY}) seed contract"
affects:
  - "src/main.js (rewired: real scene boot replaces Phase 7 smoke scene)"
tech-stack:
  added: []
  patterns:
    - "CONFIG-only tunables (no magic numbers in logic modules)"
    - "body().vel.x run set directly (dt-correct via engine integration, no dt() multiply)"
    - "body({ maxVelocity }) terminal-velocity anti-tunnel cap"
    - "single merged wide static floor (anti seam-stick) vs many tile colliders"
    - "scene-closure run-state ownership; seed via go(name, data)"
key-files:
  created:
    - src/config.js
    - src/player.js
    - src/scenes/game.js
  modified:
    - src/main.js
decisions:
  - "JUMP_FORCE 520 / MAX_FALL_SPEED 900 set explicitly in CONFIG (not body() defaults) — deterministic, tunable; final tuning is a stress-strip/Phase 12 task"
  - "lastCheckpoint seeded in gameScene closure now (contract) though respawn logic lands in Plan 02"
  - "Basic grounded jump (isGrounded gate) added in scene so landing is observable this plan; coyote/buffer/variable-height replace it in Plan 02"
metrics:
  duration: ~2min
  completed: 2026-06-24
  tasks: 3
  files: 4
---

# Phase 8 Plan 01: Platformer Test-Strip Foundation Summary

Built the dt-correct movement spine and the deliberate collision stress strip: a CONFIG
constants module (every movement/physics/camera number, no magic numbers), a placeholder
player entity with frame-rate-correct horizontal run and an engine-native anti-tunnel cap,
and a seeded test-strip scene (merged wide floor + tall fast-drop ledge + gap platforms)
that replaces the Phase 7 "hello" smoke scene as the real boot target.

## What Was Built

- **src/config.js** — `CONFIG` with all 14 tunables (RUN_SPEED, GRAVITY, JUMP_FORCE,
  JUMP_CUT, COYOTE_MS, BUFFER_MS, MAX_FALL_SPEED, CAM_RATE, CAM_Y_FACTOR, LEVEL_LEFT/RIGHT/
  TOP/BOTTOM, FALL_MARGIN), each commented with its unit. Zero imports (leaf module).
- **src/player.js** — `makePlayer(startX, startY)` builds the `#00ff88` placeholder rect
  (`rect(24,32)` + `area()` + `body({ maxVelocity: CONFIG.MAX_FALL_SPEED })` + `color` +
  `"player"`). `onUpdate` reads `left/a` + `right/d`, sets `vel.x = dir * RUN_SPEED`
  directly (no `dt()` multiply — body() integrates with dt internally).
- **src/scenes/game.js** — `gameScene(data)` owns all run state in its closure; reads
  start position from `data?.startX ?? 64` / `data?.startY ?? 64`. Calls
  `setGravity(CONFIG.GRAVITY)`. Builds the stress strip: one merged 1600-wide static floor,
  a tall fast-drop ledge, two gap platforms. Creates the player and wires a basic grounded
  jump (`isGrounded()` gate → `player.jump(CONFIG.JUMP_FORCE)`).
- **src/main.js** — keeps the Phase 7 kaplay init block verbatim; imports `gameScene`,
  registers `scene("game", gameScene)`, boots `go("game", { startX: 64, startY: 64 })`.
  The `"hello"` smoke scene body is gone.

## Requirements Satisfied

- **MOVE-01** — run left/right with arrows + WASD (player `onUpdate` run wiring).
- **MOVE-02** — gravity + solid landing: engine gravity, merged static floor, `maxVelocity`
  anti-tunnel cap, plus the observable grounded jump.

## Task Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | CONFIG constants module | a422969 | src/config.js |
| 2 | Player factory + dt-correct run | e763b4b | src/player.js |
| 3 | Test-strip scene + main.js rewire | f89345c | src/scenes/game.js, src/main.js |

## Verification

- `node --check` passes on all four files (project's syntax/build gate — no test runner by
  no-build design).
- All modules resolve over HTTP (curled `main.js`, `config.js`, `player.js`,
  `scenes/game.js`, `index.html` → all `200` via `python3 -m http.server`) — the production
  ESM import graph is intact.
- No `"hello"` smoke text remains; the real scene is the boot target.

### Manual (in-browser) checks left for the verifier

These require a human at the served strip (per the plan's `<manual>` steps) and are the
intended verification of the MEDIUM-confidence collision risks:

- MOVE-01: green rect runs both directions (arrows + A/D).
- MOVE-02: rect falls under gravity and lands solidly on the merged floor (no sinking).
- Seam-stick: full-speed flat run shows no stutter/stick.
- Tunneling: jump onto the tall ledge, run off at full speed — rect lands on the floor
  below, does not pass through. Fallback if it snags: lower `CONFIG.MAX_FALL_SPEED` and/or
  thicken floor colliders (RESEARCH Pitfall 3), then re-verify.

## Deviations from Plan

None — plan executed exactly as written. JUMP_FORCE (520) and MAX_FALL_SPEED (900) were set
to the plan's suggested starting values; final feel/anti-tunnel tuning is the stress-strip /
Phase 12 task the plan calls out.

## Known Stubs

None blocking the plan goal. The green `color(0, 255, 136)` rect is the CONTEXT-specified
placeholder avatar; the real sprite is a deliberate Phase 9 deliverable, not a stub. The
`lastCheckpoint` closure variable is declared as the seed contract; its respawn consumer
lands in Plan 02, also by design.

## Notes for Plan 02

- Consume `CONFIG.COYOTE_MS`, `CONFIG.BUFFER_MS`, `CONFIG.JUMP_CUT` to replace the basic
  `isGrounded()` jump gate with coyote-time + jump-buffer + variable-height.
- `lastCheckpoint` is already seeded in the `gameScene` closure — wire `onCollide("checkpoint")`
  + fall-off-world respawn (reposition in place, zero velocity — never `go()`).
- Camera (`CONFIG.CAM_RATE`, `CONFIG.CAM_Y_FACTOR`, level bounds, `FALL_MARGIN`) is unbuilt;
  add `src/camera.js` `followCamera(target)` per PATTERNS.

## Self-Check: PASSED

- Files: src/config.js FOUND, src/player.js FOUND, src/scenes/game.js FOUND, src/main.js modified.
- Commits: a422969 FOUND, e763b4b FOUND, f89345c FOUND.
