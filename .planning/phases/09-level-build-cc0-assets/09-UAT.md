---
status: testing
phase: 09-level-build-cc0-assets
source: [09-VERIFICATION.md]
started: 2026-06-25T00:00:00Z
updated: 2026-06-25T00:00:00Z
---

## Current Test

number: 1
name: Traverse the whole level start→goal
expected: |
  Player crosses every gap via the raised platforms and reaches the goal flag;
  full-speed flat run never seam-sticks; the tallest drop never tunnels through
  the floor; camera clamps with no void at either edge.
awaiting: user response

## Tests

### 1. Traverse the whole level start→goal (platforms, two gaps, three floor runs)
expected: Player crosses every gap via the raised platforms and reaches the goal flag; full-speed flat run never seam-sticks; the tallest drop never tunnels through the floor; camera clamps with no void at either edge.
result: [pending]

### 2. Visual: dark/grunge pixel art against #0a0a0a, readable silhouettes, no disallowed pink
expected: 6 Color Dungeon tiles + player + spike + skull-goal + spinning coin render readably; aesthetic reads dark/grunge. (Dusty-pink palette already reviewed and ACCEPTED as grunge.)
result: [pending]

### 3. Run into each of the 10 coins
expected: Each coin spins, disappears on touch, and the closure coinsCollected count increments (count only — no XP, no sfx).
result: [pending]

### 4. Walk into each of the 3 spikes
expected: Player repositions to the checkpoint just before that spike, momentum zeroed, a quick opacity flash — never a game-over screen, never a lives counter, no respawn loop.
result: [pending]

### 5. Reach the goal flag, then keep overlapping it
expected: onReachGoal fires exactly once — player velocity zeroed, player paused, a single screen-space "GOAL!" banner; no repeated/stacked banners on continued overlap. (The Phase-10 math gate is intentionally a stub here.)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
