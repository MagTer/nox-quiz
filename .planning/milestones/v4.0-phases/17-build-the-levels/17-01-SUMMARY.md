---
phase: 17-build-the-levels
plan: 01
status: complete
---

# 17-01 Summary: Per-level camera bounds

## Implemented

- `src/camera.js`: `followCamera(target, bounds?)` now accepts an optional `bounds` object. Clamp values fall back to `CONFIG.LEVEL_LEFT/RIGHT/TOP/BOTTOM` when `bounds` or any individual key is missing, preserving `level-01` behavior.
- `src/scenes/game.js`: The `onUpdate` camera call now passes `level.bounds` to `followCamera`, enabling per-level camera clamping.

## Verification

- `node --check src/camera.js` passed.
- `node --check src/scenes/game.js` passed.
- `bash scripts/check-import-safety.sh` passed.
- `grep` confirms `followCamera(player, level.bounds)` in `src/scenes/game.js`.

## Notes

No behavioral change for `level-01` because its descriptor does not set `bounds`; the camera defaults to the existing `CONFIG.LEVEL_*` constants. Frame-rate-independent smoothing and `CAM_Y_FACTOR` scaling are preserved unchanged.
