---
status: passed
phase: 15-challenge-seam-locked-door-mechanic
source: [15-01-SUMMARY.md, 15-02-SUMMARY.md, 15-03-SUMMARY.md, 15-04-SUMMARY.md]
started: 2026-07-03T13:50:52Z
updated: 2026-07-03T13:55:00Z
---

## Current Test

number: 0
name: all tests passed
expected: All real-browser MECH-01/MECH-02 verification items pass.
result: passed

## Tests

### 1. MECH-01 — end-of-level gate still works byte-for-byte after challenge.js extraction
expected: Wrong answer re-asks same question with red tint + shake, no penalty; correct answer shows same LEVEL CLEAR banner, awards XP, returns to select.
result: passed

### 2. MECH-02 — locked door blocks until answered, opens on correct answer, clears path, no soft-lock
expected: Door at x:1400 blocks player; wrong answer never punishes/locks out/consumes progress; correct answer removes door + glyph and player can immediately move/jump; door stays open across respawn.
result: passed

### 3. MECH-02 — overlay pauses world and renders above nearby hazard
expected: With overlay open next to spike, player cannot move/fall/be hurt and overlay renders above world + spike.
result: passed

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
