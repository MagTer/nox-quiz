---
phase: 18-art-animation-parallax
plan: 02
subsystem: animation-tiles
requires:
  - 18-01
provides:
  - src/player.js
  - src/levels/build.js
affects:
  - src/scenes/game.js
tags: [animation, player, tileset, state-machine]
tech-stack.added: []
patterns:
  - getCurAnim()?.name guard before play()
  - deadzone-gated facing flip
  - merged-collider + visual-only tile frames
key-files.created: []
key-files.modified:
  - src/player.js
  - src/levels/build.js
key-decisions:
  - Added animation onUpdate as a separate callback after movement/jump logic so it reads the updated vel.x.
  - pickTopFrame is a closure-local helper inside buildLevel, keeping the module pure of scene state.
  - frame() is added only to visual tiles; merged colliders and physics remain unchanged.
requirements-completed:
  - ART-01
  - ART-02
coverage:
  - deliverable: Implement player animation state machine in src/player.js
    verification:
      - kind: command
        ref: node --check src/player.js
        status: pass
      - kind: command
        ref: grep -E 'getCurAnim|\.play\(|flipX|PLAYER_ANIM_DEADZONE' src/player.js
        status: pass
    human_judgment: false
  - deliverable: Add tile-frame selection to src/levels/build.js
    verification:
      - kind: command
        ref: node --check src/levels/build.js
        status: pass
      - kind: command
        ref: grep -n 'pickTopFrame\|frame(' src/levels/build.js
        status: pass
    human_judgment: false
  - deliverable: No timers or physics changes introduced
    verification:
      - kind: command
        ref: bash scripts/check-safety.sh
        status: pass
    human_judgment: false
duration: 8 min
completed: 2026-07-03
---

# Phase 18 Plan 02: Player Animation and Tile Frame Selection Summary

Brought the player and ground tiles to life using the assets and constants from Plan 18-01. Added a small animation state machine inside `makePlayer` that switches between idle, run, and jump while facing the movement direction, and updated `buildLevel` so floor/platform visual tiles pick the correct edge/center frame from the new ground sheet.

## Accomplishments

- Added player animation state machine in `src/player.js`:
  - `jump` when airborne
  - `run` when grounded and `|vel.x|` ≥ `CONFIG.PLAYER_ANIM_DEADZONE`
  - `idle` when grounded and below the deadzone
  - `play()` is guarded by `getCurAnim()?.name !== target` to prevent frame-0 resets.
  - `flipX` is updated only above the deadzone; last facing direction is preserved at rest.
- Added `pickTopFrame(tx, runX, runW)` helper in `src/levels/build.js` and applied `frame(...)` to every visual floor and platform tile.
- Confirmed no collider geometry or physics behavior changed; merged colliders remain the only physics bodies.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `node --check src/player.js` — PASS
- `node --check src/levels/build.js` — PASS
- `bash scripts/check-import-safety.sh` — PASS
- `bash scripts/check-safety.sh` — PASS
- `grep` confirms `getCurAnim`, `play(`, `flipX`, and `pickTopFrame` exist in the expected files — PASS

## Next Step

Ready for Plan 18-03: camera-driven parallax background.
