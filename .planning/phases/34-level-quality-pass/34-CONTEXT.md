# Phase 34: Level Quality Pass - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Interactive discuss (user answered all three grey areas)

<domain>
## Phase Boundary

The known content defects are fixed and the motion rulebook is written — geometry edits land and settle BEFORE art dresses them (Phase 35) and BEFORE anything moves (Phase 36).

Requirements: LVL-01 (unreachable pickups), LVL-02 (07/08 climb repetition), LVL-03 (LEVEL-DESIGN.md soft-rules review + motion rules).

**In scope:** coin repositioning across all 8 levels; level-08's end-climb redesign; a coin-reachability check added to the validator; LEVEL-DESIGN.md soft-rules review + motion rules.

**Out of scope:** any art/visual work (Phase 35), any actual motion/movers (Phase 36), any change to the math density (locked at 1 door + 1 enemy + end gate per level — binding, may not be raised or lowered).
</domain>

<decisions>
## Implementation Decisions

### 1. Coin scope — ALL 8 LEVELS (user decision, overrides the roadmap's "levels 5–8")

Measured, not assumed: **32 coins across all 8 levels currently fail reachability**, not just levels 5–8 as the ROADMAP assumed.

| Level | coins | unreachable |
|-------|-------|-------------|
| level-01 | 16 | 2 |
| level-02 | 15 | 3 |
| level-03 | 17 | 4 |
| level-04 | 19 | 4 |
| level-05 | 15 | 4 |
| level-06 | 15 | 6 |
| level-07 | 17 | 4 |
| level-08 | 18 | 5 |
| **total** | **132** | **32** |

Levels 1–3 are kid-validated and nominally byte-frozen, but Phase 34 IS the sanctioned geometry-fix window, and an unreachable coin in level-01 is among the first things she sees. **Land levels 1–3's fixes in their own separate commit** so the kid-validated diff stays auditable and reviewable in isolation.

### 2. Coin fix method — MOVE THE COINS, never the geometry (user decision)

Reposition each unreachable coin onto the player's actual jump arc. **Zero changes to `floors` / `platforms` arrays** for the coin fix. This keeps the kid-validated platforming feel byte-identical and means a later art diff (Phase 35) cannot hide geometry drift.

(The only sanctioned geometry edit in this phase is level-08's end climb — LVL-02, decision 3.)

### 3. Level-08 end climb — Claude proposes during planning, user sees the shape before it lands

Measured: 07 and 08's end climbs are near-identical monotonic up-and-right staircases — ~65–70px rise per step, widths shrinking 280→220, identical `h:24`.

```
level-07 tail: (2650,255,280) (2860,190,260) (3050,125,250) (3230,60,240) (3400,-5,230) (3560,-70,220)
level-08 tail: (2410,250,280) (2620,180,260) (2810,110,250) (2990,40,240) (3160,-30,230) (3320,-100,220)
```

Claude designs 08's replacement climb against the calibrated jump envelope and `docs/LEVEL-DESIGN.md`, validator-gated, and presents the shape to the user before it lands. Level-08 carries an explicit `bounds` field (`right: 3540`) used AS-IS — **hand-bump `bounds.right` if the climb extends** (the documented bounds-convention trap).

### 4. The coin-reachability MODEL is the crux — RED-first, and it must model a COIN, not an alcove

The 32-coin figure above was produced by probing coins through the **secret-alcove** point-reachability model (identical `{x,y}` shape). That is a strong signal but it **over-reports**, and the plan must not treat it as ground truth:

- A coin is **not a zero-width point**. `build.js` emits `add([sprite("coin"), pos(c.x,c.y), area(), ...])` — a 32×32 sprite with a default `area()`, so its hitbox spans `(x,y)`–`(x+32,y+32)`.
- A coin is collected **mid-arc, in flight** — the player only has to *pass through* its box. The alcove model asks "can I get to and stand at this point", which is a landing question, not a fly-through question.

**LVL-01's automation must therefore add a coin-appropriate `coin-reachability` check to `scripts/validate-levels.mjs`** (the validator currently checks biome, over-hole, spawn-goal, gap-width, mechanic-reachability and secret-alcove-reachability — it has **no coin check at all**, which is exactly why 32 unreachable coins passed every gate). RED-first: land the check, let it go RED on the real offenders, then move coins until GREEN.

The genuinely-unreachable set must be re-derived from that coin model before any coin is moved — the 32 above is an upper bound, not the work list.
</decisions>

<code_context>
## Existing Code Insights

- **Levels are pure data** (`src/levels/level-0N.js`), built by the ONE builder `src/levels/build.js`. Coins are `geometry.coins: [{x, y}]`, emitted at `build.js:199-201`.
- **The reachability engine already exists and is trusted**: `scripts/lib/reachability.mjs` exports `checkLevelReachability`, `buildNodes`, `buildGraph`, `jumpReach`, `canReach`; the point-vs-footprint distinction is already understood and documented there (the alcove check has its own point model precisely because `canReach` pins `spanMax` to 0 for a point inside its own launch node's span). Extend it — do not rewrite it.
- **`scripts/lib/route-planner.mjs`** (`planTakeoffs`) is the in-engine driver's planner and shares the same jump envelope. A pre-existing pathfinding bug in it was root-caused and fixed during Phase 32.
- **Bounds convention trap:** level-01 derives its camera right edge from geometry; level-02+ carry an explicit `bounds` field used AS-IS. Bump `bounds.right` by hand when extending.
- **Extending kid-validated levels:** append new sections after existing geometry — never edit inside it.
- `docs/LEVEL-DESIGN.md` holds the quantified gap/rise/overlap/spacing/checkpoint rules derived from the calibrated jump envelope. Read BEFORE editing any descriptor. §9 documents the cap/fill atlas frame order.

## Inherited warnings (from Phase 33's checkpoint — do not repeat)

- **Green gates do not mean correct.** The full suite was green while the game shipped a sawtoothed floor AND grey-static ground; it is green right now with 32 unreachable coins. Gates check mechanics/safety/existence. `.planning/research/ART-PARITY-STEERING.md` (facts 7–11) and `33-05-SUMMARY.md` record the full episode.
- **Phase 32's VERIFICATION is stale** (W-2, filed by Phase 33's verifier): it closed with 9 green gates while shipping broken terrain.
- A new pixel gate exists: `bash scripts/check-terrain-atlas.sh`. The suite is now **10** gates.
</code_context>

<specifics>
## Specific Ideas

- **Motion rules to write into `docs/LEVEL-DESIGN.md` (LVL-03), BEFORE any motion authoring in Phase 36:** checkpoint before every mover; a missed moving platform means WAIT, never death; patrollers carry zero hurt wiring. These are ADHD-safe/no-punishment invariants, consistent with SAFE-01 and `check-safety.sh`.
- Consider whether the new `coin-reachability` check should also be taught to `scripts/audit-phase21-mechanics.mjs` so coins are proven collectable *in-engine*, not just in the static model — the static model is what failed to catch this class of bug in the first place.
- Land the work in reviewable slices: (a) validator coin check RED-first, (b) coin moves for levels 4–8, (c) coin moves for kid-validated levels 1–3 (separate commit), (d) level-08 climb, (e) LEVEL-DESIGN.md review + motion rules.
</specifics>

<deferred>
## Deferred Ideas

- A `check-biome-coverage.mjs` parallax pixel gate is still recommended (ART-PARITY-STEERING.md) but belongs to Phase 35, not here.
- Any re-verification of Phase 32 (stale VERIFICATION, W-2) is not opened here — noted for the milestone audit.
</deferred>
