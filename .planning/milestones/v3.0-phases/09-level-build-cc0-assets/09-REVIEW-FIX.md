---
phase: 09-level-build-cc0-assets
fixed_at: 2026-06-25T00:00:00Z
review_path: .planning/phases/09-level-build-cc0-assets/09-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Source review:** `.planning/phases/09-level-build-cc0-assets/09-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (2 Warning, 3 Info)
- Fixed: 5
- Skipped: 0

All changes were validated with `node --check` on the modified file after each edit
(no build step / no test framework, per CLAUDE.md). The merged-floor collider
(anti seam-stick) and the never-game-over respawn behavior are untouched. No art was
touched and no dependencies were added.

## Fixed Issues

### WR-01: `buildLevel` depends on global `Rect` with zero existence guard

**File modified:** `src/level.js`
**Commit:** `44e191a`
**Applied fix:** Added a fail-loud module-load guard `if (typeof Rect === "undefined") throw …`
at the top of `level.js`. `Rect` is a class global (not a factory like `rect`), so a
Kaplay bump or a `kaplay({ global: false })` toggle would otherwise turn the spike-hitbox
line into a silent mid-build ReferenceError. The guard now fails clearly at module load
with a message pointing at the cause, and a comment pins the engine (Kaplay 3001) so a
future upgrade reviews it.

### WR-02: goal-freeze leaves stale `vel.x = +RUN_SPEED`

**File modified:** `src/scenes/game.js`
**Commit:** `bb2b69a`
**Applied fix:** Added `player.vel = vec2(0);` immediately before `player.paused = true;`
in `onReachGoal()`. This makes the goal-freeze consistent with `reset()` (which zeroes
velocity) and ensures Phase 10's math gate cannot inherit a stale running velocity and
lurch on resume.

### IN-01: `CONFIG.COIN_SIZE` defined but never used (dead config)

**File modified:** `src/config.js`
**Commit:** `db04906`
**Applied fix:** Removed the unused `COIN_SIZE: 32` constant. Confirmed via `grep` that no
module reads it — coin placement in `level.js` is intentionally data-driven via raw
`{x, y}`. Left a short comment in its place documenting why no constant is kept, satisfying
the "no magic numbers / no dead config" invariant.

### IN-02: 32px coins sit off the 16px grid (hand-tuned literals)

**File modified:** `src/level.js`
**Commit:** `1647b09`
**Applied fix:** Documented the intentional off-grid placement with a comment block above
the `coins` array (chose the review's "document the intent" option over re-centering, since
`anchor("center")` would visually shift every coin and alter authored level feel — out of
scope for a low-risk cleanup). The comment explains the `{x, y}` is the 32px sprite's
top-left and the visual center sits ~16px right/down.

### IN-03: undocumented 16px respawn drop couples checkpoint-y to player height

**File modified:** `src/level.js`
**Commit:** `7f76a57`
**Applied fix:** Documented the `FLOOR_Y - 48` checkpoint y intent with a comment block:
the player is 16x32, so respawning at y=272 lands its feet 16px above the floor — a
deliberate gentle "drop in." Annotated the literal as `FLOOR_Y - (player height 32 + 16px
drop)` and noted to retune it if player height or `FLOOR_Y` changes. Chose the comment
route over adding a `PLAYER_HEIGHT` derivation to avoid touching `config.js`/`player.js`
beyond the cleanup's scope.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-06-25_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
