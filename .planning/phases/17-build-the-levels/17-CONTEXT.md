# Phase 17: Build the Levels - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss — all grey-area recommendations below were auto-accepted.

<domain>
## Phase Boundary

This phase turns the working single-level slice into a replayable multi-level game.
Deliver **3–5 distinct, hand-built, completable levels** (chosen: 4) that traverse
start→goal on the existing movement/collider spine, with a gentle platforming
difficulty ramp across the set. Levels are authored as plain-JS data descriptors,
registered in `src/levels/index.js`, and consumed by the existing `buildLevel`
parameterized builder and `src/scenes/game.js`.

In scope (LVL-01, LVL-04):
- Author `level-02`, `level-03`, `level-04` data modules.
- Increase level length, gap precision, and hazard density across the set.
- Add per-level bounds so the camera clamp scales with longer levels.
- Wire every new level into the registry/level-select without changing unlock logic.
- Keep all existing mechanics (door, checkpoint gates, enemy, collect) available for
  placement; reuse them to vary level texture.

Out of scope:
- New math mechanics beyond the four already built (Phase 15/16).
- New art, animation, tileset, parallax, or sound (Phase 18 / AUDIO-01).
- Changing the brain algorithm, XP curve, or save format.
- Stars, scoring, timed challenges, or fail-out mechanics.
</domain>

<decisions>
## Implementation Decisions

### Level Count & Ordering
- **D-01:** Ship **4 levels** for v4.0. This satisfies the "3–5" target, keeps the
  level-select row from overflowing the 640px internal canvas under current
  `CONFIG.SELECT` constants, and leaves headroom for a future fifth level if needed.
- **D-02:** Keep the existing v3.0 level as `level-01` and first in `LEVEL_ORDER`.
  It is kid-validated and its `[6,7,8,9]` table pool is locked by Phase 16; do not
  renumber or soften it.
- **D-03:** Use dark-grunge working names for the new levels:
  - `level-02` — "The Rusted Climb"
  - `level-03` — "The Hollow"
  - `level-04` — "The Last Span"
  Final display names can be polished in Phase 19; the level-select screen currently
  renders 1-based numbers, so names are not player-facing yet.

### Platforming Difficulty Ramp
- **D-04:** Add a per-level `bounds: { left, right, top, bottom }` field to each
  descriptor. Update `src/camera.js` so `followCamera(target, bounds?)` accepts an
  optional bounds object, defaulting to `CONFIG.LEVEL_LEFT/RIGHT/TOP/BOTTOM` when
  omitted. This lets later levels be longer without a global camera clamp change.
- **D-05:** Scale authored level length:
  - `level-01` — ~2240 px (existing)
  - `level-02` — ~2800 px
  - `level-03` — ~3400 px
  - `level-04` — ~4000 px
- **D-06:** Ramp gap precision by widening gaps and narrowing/moving stepping-stone
  platforms as levels progress. All gaps must remain jumpable with the existing
  `RUN_SPEED` / `JUMP_FORCE` / coyote / buffer tuning — no engine-feel changes.
- **D-07:** Ramp hazard density:
  - `level-01` — 3 spikes (existing)
  - `level-02` — 4 spikes
  - `level-03` — 5–6 spikes
  - `level-04` — 6–7 spikes
  Checkpoints stay placed just before each spike/mechanic so a respawn never costs
  meaningful progress (ADHD-safe).

### Math Seams & Mechanics Placement
- **D-08:** Keep `level-01.allowedTables = [6, 7, 8, 9]` as decided in Phase 16.
- **D-09:** Set `allowedTables` for new levels to create a broad confidence-to-weak-spot
  arc:
  - `level-02` — `[1, 2, 3, 4, 5, 6, 7]` (confidence-building after the hard opener)
  - `level-03` — `[3, 4, 5, 6, 7, 8, 9]` (mixed)
  - `level-04` — `[6, 7, 8, 9]` (hard pool, narrow)
- **D-10:** Reuse the four existing mechanics as level "seasoning"; do not invent new
  ones. Distribution target:
  - `level-01` — 1 door, 2 checkpoint gates, 1 enemy, 1 collect zone (existing)
  - `level-02` — 1 door, 2 checkpoint gates
  - `level-03` — 1 enemy, 1 collect zone, 1 checkpoint gate
  - `level-04` — 1 door, 2 checkpoint gates, 1 enemy, 1 collect zone (max density)
- **D-11:** Continue the existing forgiving contract: every mechanic pauses the player,
  re-asks on a wrong answer with zero penalty, and resumes only on a correct answer.
  No contact damage, no timer, no progress loss.

### Authoring Conventions & Verification
- **D-12:** Each level lives in its own `src/levels/level-NN.js` module exporting a
  `LEVEL_NN` descriptor with `id`, `displayName`, `allowedTables`, `bounds`, `geometry`,
  and the same optional mechanic arrays used by `build.js`. Register each new level in
  `src/levels/index.js` by appending it to the `LEVELS` array in play order.
- **D-13:** Keep the same geometry schema as `level-01` (`floors`, `platforms`, `coins`,
  `spikes`, `goal`, `checkpoints`, `doors`, `mathGates`, `enemies`, `collectZones`,
  `answerPickupSlots`). No new tags, no builder behavior changes.
- **D-14:** Update `scripts/smoke-progress.mjs` expectedGeometry for every new level so
  the LVL-02 regression smoke stays green.
- **D-15:** Verify each new level in a real browser before closing the phase:
  start→goal reachable, every mechanic opens/closes cleanly, checkpoints placed before
  hazards, no soft-locks, camera clamp correct, and the full static suite
  (`check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, `smoke-progress.mjs`)
  passes.

### Claude's Discretion
- Exact pixel coordinates, final display names, minor mechanic counts, coin placement,
  and exact gap widths are at Claude's discretion during implementation, provided the
  ramp and completability criteria above are met.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & milestone context
- `.planning/PROJECT.md` — Vision, constraints, target user, dark-grunge aesthetic, no-timer/no-pink/no-backend rules.
- `.planning/REQUIREMENTS.md` — v4.0 requirements and traceability (LVL-01, LVL-04 mapped to Phase 17).
- `.planning/STATE.md` — v4.0 roadmap, cross-cutting mitigations (a727c13, anti-leak, real-browser boot), locked decisions.

### Prior phase context
- `.planning/phases/13-fresh-save-format-level-registry-data/13-CONTEXT.md` — Registry/builder decisions, clean-reset save, derived unlock.
- `.planning/phases/16-remaining-mechanics-difficulty-curve/16-CONTEXT.md` — Mechanic patterns, `allowedTables` wiring, keep `level-01` hard.

### Level data & builder
- `src/levels/level-01.js` — Reference descriptor schema and v3.0 geometry.
- `src/levels/build.js` — Parameterized builder that instantiates geometry + mechanic entities.
- `src/levels/index.js` — Ordered registry, `LEVEL_ORDER`, `getLevel`, `isUnlocked`.
- `scripts/smoke-progress.mjs` — LVL-02 regression fixture; must mirror every new geometry array.

### Scene, camera, and navigation
- `src/scenes/game.js` — Loads level by id, wires mechanics, owns closure state.
- `src/scenes/select.js` — Renders one tile per `LEVEL_ORDER` entry; 4 levels avoid overflow.
- `src/camera.js` — `followCamera` currently clamps to `CONFIG.LEVEL_*`; needs optional per-level bounds.

### Mechanics & challenge seam
- `src/ui/challenge.js` — Shared in-world, no-timer, forgiving challenge overlay.
- `src/mechanics/door.js` — Reference mid-level mechanic pattern.
- `src/mechanics/gates.js` — Checkpoint gate mechanic (MECH-04).
- `src/mechanics/enemy.js` — Defeat-enemy mechanic (MECH-05).
- `src/mechanics/collect.js` — Collect-the-answer mechanic (MECH-03).

### Config & math
- `src/config.js` — All tuning constants: player movement, camera, gate/door/enemy/collect sizes, SELECT layout.
- `src/math/brain.js` — `createBrain({ allowedTables })` difficulty seam; algorithm is LOCKED.
- `src/player.js` — Jump/movement tuning that constrains reachable gap sizes.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/levels/build.js` — Already builds floors, platforms, coins, spikes, goal, doors,
  checkpoint gates, enemies, and collect zones from descriptor arrays. No new builder
  code is needed for Phase 17.
- `src/levels/index.js` — Adding a level is one import + one array append.
- `src/mechanics/*.js` (`door.js`, `gates.js`, `enemy.js`, `collect.js`) — Each exports a
  single `wire*` function that consumes the scene's `player` and `brain`; reusing them is
  pure data placement.
- `src/ui/challenge.js` — Shared overlay for every math interaction; no new UI needed.
- `src/scenes/select.js` — Already renders the full `LEVEL_ORDER` with locked/unlocked/cleared
  states.

### Established Patterns
- **Plain-JS level descriptors** — No Tiled, no `addLevel`, no build step. Geometry is a
  data literal; the builder owns entity instantiation.
- **Merged-floor colliders** — Each floor run gets one wide `body({ isStatic: true })`
  collider plus separate visual tiles. Do not switch to per-tile colliders.
- **a727c13 discipline** — Engine globals only inside function bodies. New data modules
  must import only `../config.js` and must not reference Kaplay globals at module top level.
- **Closure-local run state** — `game.js` keeps coins, goal latch, checkpoint, and tween
  handles in the scene closure. New wiring must not introduce module-level mutable state.
- **Derived unlock** — `isUnlocked` computes from `LEVEL_ORDER` + cleared facts. Do not
  store an unlocked list.
- **Checkpoint respawn policy** — Respawn is reposition-in-place at the last-touched
  checkpoint; no lives, no game-over, no progress loss.
- **Forgiving math** — Wrong answers re-ask with the same question; no penalty, timer, or
  despawn.

### Integration Points
- New levels connect through `src/levels/index.js` → `LEVEL_ORDER` → `src/scenes/select.js`
  and `src/scenes/game.js` (`getLevel(data.levelId)`).
- `game.js` passes `level.allowedTables` into `createBrain`; Phase 17 sets those values per
  descriptor.
- `game.js` wires mechanics after `buildLevel(level)` and `makePlayer`; new levels reuse
  the same four `wire*` calls.
- `src/camera.js` must accept per-level bounds; `game.js` will pass `level.bounds` when
  calling `followCamera`.
- `scripts/smoke-progress.mjs` must include each new descriptor in its expectedGeometry
  fixture.
</code_context>

<specifics>
## Specific Ideas

- Proposed level progression:
  | Level | Working name | Bounds right (px) | allowedTables | Mechanical seasoning |
  |-------|--------------|-------------------|---------------|----------------------|
  | 01 | The First Descent | 2240 | [6,7,8,9] | door + 2 gates + enemy + collect |
  | 02 | The Rusted Climb | 2800 | [1,2,3,4,5,6,7] | door + 2 gates |
  | 03 | The Hollow | 3400 | [3,4,5,6,7,8,9] | enemy + collect + gate |
  | 04 | The Last Span | 4000 | [6,7,8,9] | door + 2 gates + enemy + collect |
- Keep `FLOOR_Y = 320` and the 16px tile grid in every level so jump distances and
  spike/checkpoint expressions remain consistent.
- Place the first checkpoint near the start (mirroring `level-01` at `{ x: 96, y: 272 }`)
  and one checkpoint just before each spike/mechanic that can cost forward progress.
- Use the existing `CONFIG.DOOR`, `CONFIG.MATH_GATE`, `CONFIG.ENEMY`, and `CONFIG.COLLECT`
  sizes for all mechanic placements; do not add new tuning blocks.
- Coin arcs and raised platforms should feel like natural paths through the gaps, not
  precision pixel-perfect challenges.
</specifics>

<deferred>
## Deferred Ideas

- Real art/animation/parallax/tileset pass for all levels (Phase 18).
- Audio, music, and sound effects (AUDIO-01, post-v4.0).
- More than 4 levels or additional world packs (CONTENT-FUT-01).
- Star/score-based completion texture (CONTENT-FUT-02 — kept out for ADHD-safety).
- Moving hazards, bosses, or new math mechanics beyond the four already built.
- Dynamic difficulty adjustment beyond the static `allowedTables` pools.

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 17-Build the Levels*
*Context gathered: 2026-07-03*
