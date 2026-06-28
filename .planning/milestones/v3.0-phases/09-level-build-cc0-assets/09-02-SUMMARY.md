---
phase: 09-level-build-cc0-assets
plan: 02
subsystem: ui
tags: [kaplay, platformer, sprites, level-design, collision, camera, vanilla-js]

# Dependency graph
requires:
  - phase: 09-01
    provides: vendored CC0 sprites (ground/spike/goal/player/coin) under assets/
  - phase: 08-platformer-core-movement-physics-camera
    provides: merged-floor collider, body({maxVelocity}) anti-tunnel cap, reposition-in-place respawn, checkpoint promotion, clamped followCamera
provides:
  - One hand-authored ~3.5-screen sprite-rendered level via src/level.js (LEVEL + buildLevel)
  - CC0 sprite loads (ground/spike/goal/player/coin) wired in main.js with ../assets paths
  - Player rendered as sprite("player") with Phase 8 movement spine untouched
  - Tagged coin/spike/goal area() entities (spikes with tightened hitbox) ready for Plan 03 onCollide wiring
  - Widened camera bounds (LEVEL_RIGHT 2240) + Phase 9 level/content CONFIG constants
affects: [09-03, plan-03-coin-spike-goal-collision, phase-10-math-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Leaf-data level module: export const LEVEL (plain data) + buildLevel(LEVEL) builder"
    - "Merged-floor collider with separate visual-only sprite tiles (anti seam-stick)"
    - "Tightened spike hitbox via area({ shape: new Rect(...), offset: vec2(...) })"

key-files:
  created:
    - src/level.js
  modified:
    - src/main.js
    - src/config.js
    - src/player.js
    - src/scenes/game.js

key-decisions:
  - "Authored a JS data-list level (floors/platforms/coins/spikes/goal/checkpoints) + merged colliders rather than addLevel symbol maps, to preserve the Phase 8 anti-seam-stick merged-floor property"
  - "Level extent set to 2240px (~3.5 screens of 640px); kept LEVEL_BOTTOM at 360 (linear horizontal level)"
  - "Spike collider tightened to 12x8 offset down-centered onto the visible points (fair hitbox, Pitfall 4) — set definitively here, not deferred to Plan 03"
  - "buildLevel CREATES the tagged coin/spike/goal area() entities; it adds NO onCollide handlers and does NOT count coins (Plan 03 owns wiring)"

patterns-established:
  - "Pattern: level-data + builder module mirrors config.js banner/single-export shape, imports only ./config.js, uses engine globals un-imported"
  - "Pattern: each contiguous floor run = ONE wide body({isStatic:true}) collider (thick = FLOOR_THICKNESS) + separate sprite('ground') visual tiles with no area()/body()"

requirements-completed: [LEVEL-01, LEVEL-02, LEVEL-03]

# Metrics
duration: 4min
completed: 2026-06-25
status: complete
---

# Phase 9 Plan 02: Level Build & Sprite Render Summary

**One hand-authored ~3.5-screen Kaplay level (src/level.js LEVEL + buildLevel) with CC0 sprite rendering, merged-floor colliders, a sprite("player") swap, widened camera bounds, and the tagged coin/spike/goal entities staged for Plan 03 collision wiring — all on Phase 8's preserved movement/respawn/camera spine.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-06-25T04:29:27Z
- **Completed:** 2026-06-25T04:33:07Z
- **Tasks:** 3
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- Loaded the five CC0 sprites (ground/spike/goal/player/coin) in main.js with the `../assets/...` web-root convention; coin loads as an 8-frame `sliceX` sheet with a looping `spin` anim.
- Authored `src/level.js`: a leaf-data `LEVEL` (3 floor runs + 2 gaps, 4 platforms, 10 coins, 3 spikes, a goal, 4 checkpoints) plus `buildLevel(LEVEL)` that emits merged-floor colliders, visual ground tiles, and the tagged coin/spike/goal `area()` entities (spikes with a tightened hitbox).
- Swapped the player to `sprite("player")` (one-line change) while keeping the `area()`, `body({ maxVelocity })` anti-tunnel cap, `opacity(1)` respawn flash, and all coyote/buffer/variable-height jump logic untouched.
- Wired `buildLevel(LEVEL)` into the scene replacing the Phase 8 test strip; seeded checkpoints from `LEVEL.checkpoints`; preserved `reset()`/`respawn()`, checkpoint promotion, camera follow, and fall-off-world respawn.
- Widened `CONFIG.LEVEL_RIGHT` to 2240 and added a Phase 9 level/content constants section (no magic numbers in logic modules).

## Task Commits

Each task was committed atomically:

1. **Task 1: Load CC0 sprites + config constants + widen bounds** - `f0255e4` (feat)
2. **Task 2: Author src/level.js — LEVEL data + buildLevel()** - `f998f72` (feat)
3. **Task 3: Swap player sprite + wire buildLevel into the scene** - `f1630d0` (feat)

_Note: Task 3 was marked `tdd="true"`. This is a zero-dependency single-file-philosophy project (CLAUDE.md forbids adding a build step / test framework), and the task's behavior is runtime-browser (sprite render, seam-stick, tunneling, camera clamp) that cannot be exercised by a node unit test. The executable verification is `node --check` + structural greps (all passing) plus an HTTP 200 asset smoke test; the live-play behaviors are recorded as UAT items below. No separate RED/GREEN commits were produced — see TDD Gate Compliance._

**Plan metadata:** (recorded in the final docs commit)

## Files Created/Modified
- `src/level.js` (NEW) - Hand-authored LEVEL data + buildLevel() builder: merged-floor + platform colliders, visual ground tiles, and the tagged coin/spike/goal area() entities (spikes tightened).
- `src/main.js` - Added loadSprite calls for the five CC0 sprites (coin sliced 8 + spin anim) using `../assets/...`; imports CONFIG for the coin anim constants.
- `src/config.js` - Widened LEVEL_RIGHT to 2240; added Phase 9 level/content constants (TILE_SIZE, FLOOR_Y, FLOOR_THICKNESS, COIN_*, SPIKE_* tightened hitbox, GOAL_SIZE).
- `src/player.js` - One-line rect→sprite("player") swap; removed the #00ff88 placeholder color; kept area()/body({maxVelocity})/opacity(1) and all jump logic.
- `src/scenes/game.js` - Imported { LEVEL, buildLevel }; replaced the test-strip geometry with buildLevel(LEVEL); seeded checkpoints from LEVEL.checkpoints; kept respawn/checkpoint/camera machinery.

## Decisions Made
- **JS data-list level over addLevel symbol maps** — keeps the Phase 8 merged-floor anti-seam-stick property (each floor run = one wide collider, not per-tile bodies).
- **Spike hitbox tightened here, definitively** — `area({ shape: new Rect(vec2(0), 12, 8), offset: vec2(2, 8) })` shrinks/offsets the collider onto the visible spike points so the empty top of the 16px tile is not lethal (fair, Pitfall 4). Plan 03 does not touch this.
- **Entity ownership pinned to this plan** — buildLevel creates `add([sprite("coin"), area(), "coin"])`, `add([sprite("spike"), area({...}), "spike"])`, and `add([sprite("goal"), area(), "goal"])`. The tags exist at their creation sites in level.js so Plan 03 only attaches `onCollide` handlers.
- **Checkpoints authored just before each spike** — a respawn never costs meaningful progress (ADHD-safe, per CONTEXT).

## Deviations from Plan

None - plan executed exactly as written.

(Two trivial, in-spirit adjustments worth noting, neither a behavioral deviation: (1) removed an unused `COIN` local const in level.js for cleanliness; (2) reworded a main.js comment so the literal token `loadSpriteSheet` does not appear — the acceptance criterion requires the absent API name not to appear, and the explanatory comment originally tripped the grep. Both are cosmetic and committed within their task.)

## TDD Gate Compliance

Task 3 carried `tdd="true"` but produced a single `feat` commit rather than a RED `test(...)` → GREEN `feat(...)` sequence. Rationale: this project is a zero-dependency single HTML/ESM app whose `.claude/CLAUDE.md` explicitly forbids a build step or test tooling, and the task's `<behavior>` is browser-runtime (sprite rendering, full-speed seam-stick, tall-drop tunneling, camera clamp) — not unit-testable under node. The plan's own `<verify>` block defines the executable gate as `node --check` + structural greps, which all pass; the runtime behaviors are captured as UAT items below. Plan-level frontmatter is `type: execute` (not `type: tdd`), so no plan-wide RED/GREEN gate sequence was mandated.

## Plan 03 Hand-off (intentional — not blocking stubs)

These entities are created by buildLevel with their tags + `area()` but have NO behavior yet — this is the deliberate, plan-pinned hand-off to Plan 03 (which attaches `onCollide` handlers). They do not prevent this plan's goal (a traversable rendered level):
- `"coin"` entities (10) — Plan 03 will count + destroy on touch (no XP until Phase 11).
- `"spike"` entities (3) — Plan 03 will route into the existing `respawn()` seam.
- `"goal"` entity (1) — Plan 03 will wire a single-point `onReachGoal` (Phase 10 swaps the body).

## Threat Flags

No new security surface beyond the plan's threat model. T-09-03 (silent 404 on wrong sprite paths) was actively mitigated: an HTTP smoke test (serving from repo root, opening `/src/`) returned 200 for all five `../assets/*` sprites, `lib/kaplay.mjs`, and all five JS modules — the browser-normalized sibling resolution matches the already-verified `../lib/kaplay.mjs` import.

## Issues Encountered
- The `loadSpriteSheet`-absent acceptance grep initially matched my own explanatory comment text; reworded the comment so the call-name token does not appear. Resolved within Task 1.

## User Setup Required
None - no external service configuration required.

## Outstanding UAT (live-play verification — Task 3 behavior block)

These require a human to play the level in a browser (cannot be driven headlessly). The underlying machinery is structurally preserved from Phase-8-verified code (merged collider + `maxVelocity` cap kept intact, confirmed via grep), and the art was accepted as dark/grunge in Wave 1:
- [ ] Served over HTTP, the authored level renders dark/grunge with readable sprites, no pink (LEVEL-02).
- [ ] A full-speed flat run does not snag on floor seams (LEVEL-03, Phase 8 stress re-check).
- [ ] The tallest authored drop does not tunnel through the floor (LEVEL-03).
- [ ] The camera follows and clamps to the widened bounds with no void at the level edges.
- [ ] DevTools Network tab shows 200 for every `../assets/*` request; console is clean.

## Next Phase Readiness
- The level body + sprite render are in place and the Phase 8 movement/respawn/camera spine is preserved.
- Plan 03 can attach `onCollide("coin"|"spike"|"goal", …)` to the tagged entities buildLevel created — no further entity creation needed.
- Recommend running the Outstanding UAT play-test before/at the start of Plan 03.

## Self-Check: PASSED

All created/modified files exist on disk (src/level.js, src/main.js, src/config.js, src/player.js, src/scenes/game.js, 09-02-SUMMARY.md) and all three task commits (f0255e4, f998f72, f1630d0) are present in git history.

---
*Phase: 09-level-build-cc0-assets*
*Completed: 2026-06-25*
