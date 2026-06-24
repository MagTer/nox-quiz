---
status: testing
phase: 08-platformer-core-movement-physics-camera
source: [08-VERIFICATION.md]
started: 2026-06-24T00:00:00Z
updated: 2026-06-24T00:00:00Z
---

## Current Test

number: 1
name: Throttled / non-60Hz playthrough vs 60Hz baseline (MOVE-05)
expected: |
  Run distance per ~1s hold, full-hold jump height, and camera follow feel are
  identical at a throttled / non-60Hz refresh as at 60Hz. Jumps not eaten, camera
  does not speed up, console clean.
awaiting: user response

## Tests

### 1. Throttled / non-60Hz playthrough vs 60Hz baseline (MOVE-05)
expected: Run distance per ~1s hold, full-hold jump height, and camera follow feel are identical at a throttled / non-60Hz refresh as at 60Hz. Jumps not eaten, camera does not speed up, console clean.
how: Serve with `python3 -m http.server` from `src/`, open the game, do a baseline run/jump/camera pass at 60Hz. Then throttle rendering (Chrome DevTools → Rendering, or a non-60Hz display) and repeat. Compare run distance for a ~1s hold, full-hold jump height, and camera follow feel.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
