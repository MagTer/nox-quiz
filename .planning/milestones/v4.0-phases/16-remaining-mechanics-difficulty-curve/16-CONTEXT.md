# Phase 16: Remaining Mechanics + Difficulty Curve - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via workflow.skip_discuss)

<domain>
## Phase Boundary

Wire the remaining three math mechanics over the shared `src/ui/challenge.js` seam and turn the per-level `allowedTables` field into a real difficulty ramp. In scope:

- **MECH-03 — Collect-the-answer:** several in-world numeric pickups; collecting the right answer clears the challenge, wrong pickups never punish.
- **MECH-04 — Multiple checkpoint gates:** several in-level math gates (not only at the goal), each tracked independently.
- **MECH-05 — Defeat-enemy-with-answer:** a blocking enemy opens the challenge on touch; correct answer removes it; enemy never deals contact damage.
- **LVL-03 — Difficulty ramp:** early levels draw from easier table pools (e.g. 1–5), later levels restrict toward 6–9, via the per-level `allowedTables` field already present in level descriptors and already supported by `createBrain({ allowedTables })`.

Out of scope (later phases): level authoring across 3–5 levels (Phase 17), real art/sprites for enemies/pickups (Phase 18), consolidated kid-UAT (Phase 19).

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — discuss phase was skipped per user setting. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

### Mechanic Pattern
Each mechanic reuses the same pattern proven by `src/mechanics/door.js`:
- One `mechanics/{mechanic}.js` module per mechanic.
- Each exports a single `wire{Mech}({ player, brain })` function.
- On collide/touch, freeze the player and call `openChallenge({ brain, onSuccess })`.
- `onSuccess` removes the relevant entity/entities and unpauses the player.
- All engine globals stay inside the exported function body (a727c13).

### Tags
- `math-gate` — checkpoint gate entities (MECH-04).
- `answer-pickup` — numeric answer pickups (MECH-03). A special `answer-zone` or `collect-challenge` tag triggers the challenge when the player enters the zone.
- `enemy` — blocking enemy entities (MECH-05).

### Difficulty Ramp
- `allowedTables` already exists on level descriptors and in `createBrain`.
- Verify `src/scenes/game.js` passes `allowedTables` into `createBrain`.
- Update `LEVEL_01` to keep `[6,7,8,9]` (the existing v3.0 feel) so this phase does not accidentally make level-01 easier.
- Authoring harder/easier pools is Phase 17's job; this phase only proves the seam works.

### Visual Placeholders
- Enemies and pickups use simple shapes/text for now, same placeholder policy as Phase 14/15.
- No new sprite assets; Phase 18 will skin them.

</decisions>

<code_context>
## Existing Code Insights

- `src/ui/challenge.js` exports `openChallenge({ brain, onSuccess, prompt })` and is the one shared seam.
- `src/mechanics/door.js` is the reference mid-level mechanic: `wireDoor({ player, brain })`, freeze → challenge → destroy → unfreeze.
- `src/levels/build.js` owns entity instantiation from level geometry. It already creates doors with invisible blockers + visible panels.
- `src/levels/level-01.js` holds the level geometry descriptor; add new arrays (`mathGates`, `answerPickups`/`collectZones`, `enemies`) following the same data-literal idiom.
- `src/scenes/game.js` wires mechanics with `wireDoor({ player, brain })` after the player exists.
- `src/math/brain.js` `createBrain({ allowedTables })` already restricts question selection to the pool.
- `src/config.js` has `CONFIG.DOOR` as precedent for per-mechanic tuning blocks.

</code_context>

<specifics>
## Specific Ideas

- For MECH-03, the simplest design is a "collection zone" (invisible area) that opens the challenge, plus several numeric pickups. The challenge prompt says something like "Collect the answer to 6 × 7". The player then touches the pickup with the correct value (42). Wrong pickups could show a brief non-punishing feedback.
- Alternatively, entering the zone opens the challenge with choices displayed as pickups; the player walks into the pickup matching the correct choice. This keeps everything in-world.
- For MECH-04, a checkpoint gate is essentially a door without a key glyph: a solid vertical blocker that opens on correct answer. Reuse the door blocker/panel pattern with different styling.
- For MECH-05, an enemy is a blocking entity that disappears on correct answer. It should have a facing direction and maybe a tiny bounce, but no contact damage.

</specifics>

<deferred>
## Deferred Ideas

- Real enemy/pickup art and animation (Phase 18).
- Full level authoring with tuned difficulty pools across 3–5 levels (Phase 17).
- Consolidated ADHD-safety audit and kid-UAT (Phase 19).
</deferred>
