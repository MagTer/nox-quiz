---
phase: 09-level-build-cc0-assets
reviewed: 2026-06-25T04:43:42Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/config.js
  - src/level.js
  - src/main.js
  - src/player.js
  - src/scenes/game.js
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-06-25T04:43:42Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 9 wires CC0 sprite loading, a hand-authored level (`src/level.js`), merged-floor
colliders, tagged coin/spike/goal entities, and the `onCollide` handlers (coin collect,
spike→gentle respawn, fire-once goal seam). I reviewed all five files at standard depth and
cross-checked every Kaplay 3001 API call against the vendored engine (`lib/kaplay.mjs`) and
every asset path against the real files on disk.

The implementation is correct on the points the phase brief flags as high-risk:

- **Asset paths are valid (no silent 404s).** All five `../assets/...` paths resolve to real
  files: `assets/tiles/ground.png`, `assets/spike.png`, `assets/goal.png`, `assets/player.png`,
  `assets/coin.png`. PNG dimensions match config exactly: coin is 256x32 (= 8 frames of 32px,
  matching `sliceX: COIN_FRAMES`), player 16x32, spike/goal/ground 16x16.
- **No `loadSpriteSheet` misuse.** The code correctly uses `loadSprite(..., { sliceX, anims })`;
  `loadSpriteSheet` does not exist in 3001 and is not called.
- **`new Rect(vec2(0), W, H)` is the correct 3001 signature.** Verified the engine's `Rect`
  class is `constructor(pos, width, height)` and is exported as a global. The spike hitbox
  offset math (`offX=2`, `offY=8`) correctly drops the 12x8 collider onto the lower spike points
  and still overlaps a standing/running player — fair hit, no false positives.
- **Merged-floor colliders did NOT regress.** Each floor run and platform gets exactly ONE wide
  `body({ isStatic: true })`; visual tiles are `add([sprite, pos])` with no `area()`/`body()`.
  Anti seam-stick invariant holds.
- **Fire-once goal guard is correct.** `goalReached` is closure-local, latched before any side
  effect, and there is exactly one `onReachGoal` function and one `onCollide("goal")` wiring.
- **Closure-state discipline holds.** `coinsCollected`, `goalReached`, `lastCheckpoint`, and the
  player's `coyote`/`buffer` timers are all closure-local — no module-level run state, no leak
  across respawn.
- **Spike respawn cannot loop.** Checkpoints are seeded before each spike, so `respawn()`
  teleports the player off the spike on the collision frame; the next frame has no overlap.
- **Global key handlers do not leak.** `onKeyPress`/`onKeyRelease` in `makePlayer` are
  scene-scoped (the engine calls `clearEvents` on scene switch), and the app only ever enters
  `go("game")` once.

No Critical issues found. The Warnings below are genuine robustness/correctness-adjacent gaps;
the Info items are minor quality nits.

## Warnings

### WR-01: `buildLevel` depends on global engine symbols with zero existence guard or fallback

**File:** `src/level.js:90-151` (and the same pattern in `src/scenes/game.js`, `src/player.js`)
**Issue:** `buildLevel` calls `add`, `sprite`, `rect`, `pos`, `area`, `body`, `vec2`, and `Rect`
as bare globals supplied by Kaplay's `global: true`. This is the project's chosen idiom, but
`Rect` in particular is a fragile dependency: it is a class global (not a factory like `rect`),
and a single typo or a future `kaplay({ global: false })` toggle would turn the spike hitbox line
into a silent runtime `ReferenceError` that throws *during scene construction*, taking down the
entire level build (coins, goal, and player are added after spikes in `buildLevel`, but the scene
would still be half-built). Because there is no test framework and no build-time symbol checking
(per CLAUDE.md), a regression here is only catchable by manually opening the page. The `area({ shape })`
path is the most likely place to break silently if `Rect` is ever renamed/removed in a Kaplay bump.
**Fix:** This is acceptable for the no-build philosophy, but harden the one non-obvious global.
Either build the shape via the factory the rest of the code already trusts, or assert once at
module load:
```js
// At top of level.js, fail loud instead of mid-build:
if (typeof Rect === "undefined") {
  throw new Error("level.js: Kaplay global `Rect` missing — check kaplay({ global }) / version");
}
```
Alternatively, prefer `area({ shape: new Rect(...) })` only after confirming the engine pin; pin
the Kaplay version in a comment next to the `new Rect(...)` call so a future upgrade reviews it.

### WR-02: `player.paused = true` freezes input but leaves residual `vel.x`/`vel.y` — goal-freeze can drift

**File:** `src/scenes/game.js:119`
**Issue:** On reaching the goal, the code sets `player.paused = true` to "gently freeze" the
player. In Kaplay, `paused` halts the object's own update lifecycle (including `body()` integration),
so the player stops — but the player's `vel` is whatever it was on the collision frame (running
into the goal means `vel.x = +RUN_SPEED`). If a later phase or any code path ever *unpauses* the
player (Phase 10's math gate is explicitly going to replace this stub and may resume the player),
the stale non-zero velocity will cause an immediate unexpected lurch on resume. The freeze also
does not zero velocity the way `reset()` deliberately does (`player.vel = vec2(0)`), so the two
"stop the player" code paths are inconsistent.
**Fix:** Zero the velocity when freezing so the state is clean for whatever Phase 10 does on resume:
```js
player.vel = vec2(0);
player.paused = true;
```

## Info

### IN-01: `CONFIG.COIN_SIZE` is defined but never used (dead config)

**File:** `src/config.js:39`
**Issue:** `COIN_SIZE: 32` is documented as the "rendered coin sprite frame size
(placement/centering reference)" but no module references `CONFIG.COIN_SIZE` (verified across
`src/`). Coins in `level.js` are placed with raw `{x, y}` data and default `topleft` anchor; the
32px frame size is never read. By contrast `SPIKE_SIZE` and `GOAL_SIZE` *are* used to derive
placement. Given the project's stated "no magic numbers in logic modules" invariant, an unused
constant is a small smell — either it should be wired into coin placement/centering or removed.
**Fix:** Remove `COIN_SIZE` if coin placement is intentionally data-driven, or use it to center
coins (e.g. anchor or offset) so the constant earns its place.

### IN-02: Coin sprite (32px) sits on a 16px-everything grid — placement is by hand-tuned literals only

**File:** `src/level.js:53-64`
**Issue:** Every other entity is 16px and aligned to the `TILE_SIZE` grid, but coins render at
32x32 with `topleft` anchor and hand-picked y-values (264, 184, 136, ...). There's no centering
helper, so a coin's *visual* center is 16px right/down of its `{x, y}`. This is not a bug (the
`area()` matches the 32px footprint, so collection still works), but it makes the relationship
between authored coordinates and on-screen position non-obvious and easy to mis-tune later.
**Fix:** Consider `anchor("center")` on coins (and adjust the data to center points) so authored
`{x, y}` reads as "where the coin visually is," matching intuition for future level edits.

### IN-03: Respawn places the player 16px above the floor, causing a small drop on every respawn

**File:** `src/scenes/game.js:59, 78-79` + `src/level.js:77-82`
**Issue:** Checkpoint markers are authored at `y = FLOOR_Y - 48 = 272`, and `reset()` does
`player.pos = lastCheckpoint.clone()`. The player is 16x32 with `topleft` anchor, so respawning at
y=272 puts the player's feet at 304 while the floor top is 320 — a 16px gap, so the player always
falls a little after every respawn (and after the start spawn at y=64, a larger intentional drop).
This is harmless and arguably even reads as a gentle "drop in," but it is an implicit coupling
between the checkpoint `y` literal and the player height that isn't documented and would surprise
someone who changes player height or `FLOOR_Y`.
**Fix:** Either document the intent ("respawn drops the player onto the floor") next to the
checkpoint y-values, or derive the checkpoint/spawn y from `FLOOR_Y - PLAYER_HEIGHT` so the
"feet on floor" relationship survives future sprite/height changes.

---

_Reviewed: 2026-06-25T04:43:42Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
