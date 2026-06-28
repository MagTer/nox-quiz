---
status: passed
phase: 11-progression-persistence
source: [11-VERIFICATION.md]
started: 2026-06-27T00:00:00Z
updated: 2026-06-27T12:00:00Z
---

## Current Test

number: 1
name: HUD shows level + XP bar
expected: |
  An always-visible fixed HUD shows the current level badge ("LVL N") and an XP
  fill bar toward the next-level threshold, in dark grunge (no pink).
awaiting: user response

## Tests

### 1. HUD shows level + XP bar (SAVE-04)
expected: Fixed HUD shows "LVL N" badge + XP fill bar toward the next threshold; dark grunge, no pink.
result: pass

### 2. Correct answer earns XP and levels up (SAVE-01)
expected: A correct gate answer increases XP on the v1/v2 curve (hard tables 6-9 award more); crossing a threshold levels up and shows a distinct level-up flash.
result: pass

### 3. Wrong answer earns no XP (forgiving) (SAVE-01)
expected: A wrong answer awards no XP and loses no progress; the gate stays open to retry.
result: pass

### 4. Progress persists across tab close (SAVE-02)
expected: Earn XP, close the tab, reopen the URL; XP/level are restored (localStorage key mathlab_platformer_v1). 
result: pass

### 5. Returning resumes weak-spot adaptation (SAVE-03)
expected: After persisting practice history, reloading keeps question selection targeted at weak tables (not reset to a fresh distribution).
result: pass

### 6. Level-up flash is ADHD-safe (SAVE-04)
expected: The level-up moment is a brief (~450ms) readable flash — celebratory but not a harsh/long/strobing effect.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

## Sign-off

All 6 items confirmed by the user in a live browser play-test (consolidated end-to-end run, 2026-06-27) — "all good". The Rect import-time guard bug (fixed in a727c13) had been blocking boot; once fixed, the full stack rendered and behaved as specified.
