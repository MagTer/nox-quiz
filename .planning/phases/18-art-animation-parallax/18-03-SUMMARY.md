---
phase: 18-art-animation-parallax
plan: 03
subsystem: parallax
requires:
  - 18-01
provides:
  - src/parallax.js
  - src/scenes/game.js
  - scripts/check-import-safety.sh
affects:
  - src/scenes/game.js
tags: [parallax, camera, a727c13, no-timers]
tech-stack.added: []
patterns:
  - camera-driven parallax (function of getCamPos().x only)
  - horizontal tiling with padding
  - tag-based scene-leave cleanup
key-files.created:
  - src/parallax.js
key-files.modified:
  - src/scenes/game.js
  - scripts/check-import-safety.sh
key-decisions:
  - Parallax helpers are pure functions; all engine globals live inside function bodies (a727c13).
  - Layer instances are tagged "parallax" and destroyed with destroyAll("parallax") on scene leave.
  - updateParallaxLayers uses getCamPos().x only; no wait/loop/setTimeout.
requirements-completed:
  - ART-03
coverage:
  - deliverable: Create src/parallax.js with pure helper functions
    verification:
      - kind: command
        ref: node --check src/parallax.js
        status: pass
      - kind: command
        ref: bash scripts/check-import-safety.sh
        status: pass
    human_judgment: false
  - deliverable: Wire parallax into src/scenes/game.js
    verification:
      - kind: command
        ref: node --check src/scenes/game.js
        status: pass
      - kind: command
        ref: grep -E 'makeParallaxLayers|updateParallaxLayers|getCamPos|destroyAll\("parallax"\)' src/scenes/game.js
        status: pass
    human_judgment: false
  - deliverable: Extend scripts/check-import-safety.sh for src/parallax.js
    verification:
      - kind: command
        ref: bash scripts/check-import-safety.sh
        status: pass
    human_judgment: false
  - deliverable: No timers introduced
    verification:
      - kind: command
        ref: bash scripts/check-safety.sh
        status: pass
    human_judgment: false
duration: 10 min
completed: 2026-07-03
---

# Phase 18 Plan 03: Parallax Background Summary

Added a calm, camera-tied parallax background to every level. Created a new pure module `src/parallax.js` that builds three horizontally tiled layers and updates their positions from the camera X coordinate, then wired it into `src/scenes/game.js` so the layers track the camera without timers, tweens, or scene leaks. Extended `scripts/check-import-safety.sh` so the new module is covered by the a727c13 gate.

## Accomplishments

- Created `src/parallax.js` exporting `makeParallaxLayers(bounds)` and `updateParallaxLayers(layers, camX, bounds)`.
- Built three tiled layers (far/mid/near) covering `levelWidth + 2 * width()` plus one extra strip.
- Wired the layers into `src/scenes/game.js`:
  - Created after `buildLevel(level)` and before `makePlayer(...)`.
  - Updated each frame from `getCamPos().x` inside the existing `onUpdate`.
  - Cleaned up with `destroyAll("parallax")` on scene leave.
- Extended `scripts/check-import-safety.sh` to syntax-check and a727c13-scan `src/parallax.js`.
- Confirmed no `wait()`, `loop()`, `setTimeout`, or other timers were introduced.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `node --check src/parallax.js` — PASS
- `node --check src/scenes/game.js` — PASS
- `bash scripts/check-import-safety.sh` — PASS
- `bash scripts/check-safety.sh` — PASS
- `grep` confirms parallax helpers are imported, instantiated after `buildLevel`, updated from `getCamPos().x`, and cleaned on scene leave — PASS

## Next Step

Ready for Plan 18-04: title/select styling and mandatory real-browser boot.
