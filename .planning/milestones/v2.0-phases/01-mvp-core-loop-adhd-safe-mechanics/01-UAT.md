---
status: testing
phase: 01-mvp-core-loop-adhd-safe-mechanics
source:
  - .planning/phases/01-mvp-core-loop-adhd-safe-mechanics/01-01-SUMMARY.md
  - .planning/phases/01-mvp-core-loop-adhd-safe-mechanics/01-02-SUMMARY.md
  - .planning/phases/01-mvp-core-loop-adhd-safe-mechanics/01-03-SUMMARY.md
  - .planning/phases/01-mvp-core-loop-adhd-safe-mechanics/01-04-SUMMARY.md
started: 2026-06-20T21:00:00Z
updated: 2026-06-20T21:00:00Z
---

## Current Test

number: 1
name: App Loads Without Errors
expected: |
  Open math-lab.html directly in browser (file:// or local server).
  The page loads immediately with a dark background and a multiplication question visible.
  No console errors on load. No pink anywhere.
awaiting: user response

## Tests

### 1. App Loads Without Errors
expected: Open math-lab.html directly in browser (file:// or local server). Page loads immediately with dark background and a multiplication question visible. No console errors on load. No pink anywhere.
result: [pending]

### 2. Question with 4 Answer Options
expected: A multiplication question (e.g. "7 × 8 = ?") is shown with exactly 4 answer options in a 2×2 grid. The question text is large (font-weight 900) and centered.
result: [pending]

### 3. Correct Answer — Immediate Feedback
expected: Clicking the correct answer immediately turns it green. After ~1 second the next question appears automatically. No timer countdown shown.
result: [pending]

### 4. Wrong Answer — Reveal Correct
expected: Clicking a wrong answer immediately turns it red. The correct answer turns green at the same moment. After ~1 second the next question appears automatically.
result: [pending]

### 5. XP Earned and Bar Fills
expected: After a correct answer, the segmented XP bar (top of screen) visibly fills. The "XP" label is visible to the left of the bar segments. Hard tables (6–9 times) award 20 XP; easy tables (1–5 times) award 10 XP.
result: [pending]

### 6. Level-Up Overlay Fires
expected: When the XP bar fills completely (threshold reached), a level-up overlay appears celebrating the new level. The overlay disappears automatically and the game continues.
result: [pending]

### 7. Progress Persists After Reload
expected: After earning some XP and levelling up, reload the page (F5 or Ctrl+R). The XP bar and level badge restore to the saved values — progress is not lost.
result: [pending]

### 8. Dark Grunge Aesthetic — No Pink
expected: Background is near-black (#0a0a0a). Text is off-white. Accents are neon green. A subtle grain texture is visible on the background. Absolutely no pink colors anywhere.
result: [pending]

### 9. No Timer Visible
expected: Play through 5+ questions. No countdown timer, stopwatch, progress bar tied to time, or any time-based element is visible anywhere on screen.
result: [pending]

### 10. Keyboard Navigation Works
expected: Tab into the answer options. Use arrow keys (Up/Down or Left/Right) to move between the 4 options. Press Space or Enter to select an answer. The selected answer is submitted correctly (same behavior as click).
result: [pending]

### 11. HUD Always Visible
expected: The HUD (level badge + XP bar) stays fixed at the top of the screen while playing. It remains visible even when scrolling, and the segmented XP bar is always present — not hidden or collapsed.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0

## Gaps

[none yet]
