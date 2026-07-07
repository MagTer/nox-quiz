---
status: testing
phase: 25-levels-5-8-difficulty-ramp-select-grid
source: [25-VERIFICATION.md]
started: 2026-07-07T16:24:54Z
updated: 2026-07-07T16:24:54Z
---

## Current Test

number: 1
name: Secret alcove walkthrough — levels 02 through 08 (level-01 already confirmed)
expected: |
  HUD XP increments by exactly 5 on first touch; player never freezes; no challenge UI
  opens; a second touch does nothing further; the level still clears normally if the
  alcove is skipped.
awaiting: user response

## Tests

### 1. Secret alcove walkthrough — levels 02 through 08
expected: |
  Serve the game over HTTP (`python3 -m http.server 8000` from repo root, `?debug=1`
  optional to see the invisible markers, re-confirm in a normal tab), enter each level,
  navigate to its `geometry.secretAlcove` coordinate, and touch it. HUD XP increments
  by exactly 5 on first touch; player never freezes; no challenge UI opens; a second
  touch does nothing further; the level still clears normally if the alcove is skipped.
result: [pending]

### 2. 2×4 select-grid navigation feel + tile-state rendering
expected: |
  Unlock all 8 tiles via the documented localStorage seed, then exercise Left/Right
  (row-scoped wrap) and Up/Down (non-wrapping row-jump, same-or-nearest-column
  landing) live in a browser; visually confirm locked (grey)/unlocked (green)/cleared
  (blue) tile coloring across all 8 tiles. Matches CONTEXT.md's locked wrap semantics
  exactly; tile states are visually distinguishable.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
