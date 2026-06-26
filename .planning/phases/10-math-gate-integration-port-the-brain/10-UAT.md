---
status: testing
phase: 10-math-gate-integration-port-the-brain
source: [10-VERIFICATION.md]
started: 2026-06-26T00:00:00Z
updated: 2026-06-26T00:00:00Z
---

## Current Test

number: 1
name: Gate renders in-world over the paused/dimmed level
expected: |
  Reaching the goal opens an in-world Kaplay gate (game font/palette, big a × b
  question, four answer boxes) over the dimmed, paused level — NOT a system/DOM popup.
awaiting: user response

## Tests

### 1. Gate renders in-world over the paused/dimmed level (GATE-01)
expected: Reaching the goal opens an in-world Kaplay panel (question + four answer boxes) over the dimmed, paused level — not a browser/DOM popup; the avatar is visible behind it.
result: [pending]

### 2. Correct answer clears the level (GATE-03)
expected: Picking the correct answer flashes + shows a persistent "LEVEL CLEAR" banner, the player stays frozen (no soft-lock), and the clear fires exactly once. (This is the path the CR-01 destroyAll fix repaired — confirm no freeze/soft-lock.)
result: [pending]

### 3. Wrong answer is forgiving (GATE-04)
expected: Picking a wrong answer shakes/reddens that box, keeps the SAME question, and the gate stays open — no game-over, no lives lost, no progress lost; retry works.
result: [pending]

### 4. No time pressure (GATE-05)
expected: The gate waits indefinitely — nothing counts down, nothing auto-fails or pressures on time.
result: [pending]

### 5. Replay opens a fresh gate, no leaked state (GATE-06 anti-leak)
expected: After clearing (or restarting the level), reaching the goal again opens a fresh gate; keyboard 1–4 select once each (no stacked/duplicated keypress effects), and question selection is fresh (no brain-state bleed across replays).
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
