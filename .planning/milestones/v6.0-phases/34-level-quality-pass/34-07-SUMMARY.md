---
phase: 34
plan: "07"
subsystem: verification-harness
tags: [playwright, traversal, route-planning, level-08, switchback, regression-proof]
status: complete
requires:
  - scripts/lib/reachability.mjs (READ-ONLY — its graph was already bidirectional)
  - scripts/lib/jump-envelope.mjs (the calibrated envelope)
provides:
  - bidirectional route planning (legs with per-hop direction)
  - bidirectional player driver (per-leg direction, non-monotonic progress)
  - automated completability proof for level-08 (previously: none)
  - collision-free harness ports (parallel-executor safe)
affects:
  - scripts/browser-boot.mjs
  - scripts/audit-phase21-mechanics.mjs
  - scripts/lib/audit-retry.mjs (via the unchanged driver contract)
  - scripts/screenshot-phase26.mjs, scripts/screenshot-phase34-climb.mjs
tech-stack:
  added: []
  patterns:
    - "route = ordered LEGS, each carrying its own travel direction"
    - "current leg DERIVED from live player state, never a stored cursor (respawns self-heal)"
    - "takeoff mark = position AND heading (dir-relative fire window)"
    - "progress = advanced along the route, never 'x got bigger'"
    - "death = position WARP, not a backward-x warp"
key-files:
  created: []
  modified:
    - scripts/lib/route-planner.mjs
    - scripts/lib/mechanic-drive.mjs
    - scripts/browser-boot.mjs
    - scripts/audit-phase21-mechanics.mjs
decisions:
  - "Leg direction for overlapping spans resolved by span midpoint (every switchback tier pair overlaps by ~70px, by authoring rule)"
  - "Spike hops stay opportunistic (leg:null, dir:+1) — the driver never plans a turn-around for one"
  - "Spike-conflict merge (Strategies 1/2) gated to rightward hops — no spike sits on a climb tier, so generalising it would have added risk with no case to serve"
  - "Dedupe now requires same-surface AND same-direction — x-proximity alone is meaningless on a folded route"
  - "Ports made ephemeral, fixed by hand in each script copy (CLAUDE.md: Playwright duplication is deliberate, no shared module)"
metrics:
  duration: ~75min
  completed: 2026-07-14
---

# Phase 34 Plan 07: Make the Verification Harness Bidirectional — Summary

Taught the Playwright traversal harness to drive the player **left as well as right**, so a
switchback climb can be navigated from spawn. Level-08 is now automatically proven completable
for the first time; `browser-boot.mjs` is green on all 8 levels and all 24 mechanic encounters
trigger and resolve.

## What was actually wrong

Two independent bugs, both downstream of the same rightward-only assumption. The static
reachability graph was **never** at fault — `canReach` has always handled leftward pairs
(`toNode.xEnd <= fromNode.xStart`) and `buildGraph` tests every ordered pair both ways.
`bottleneckPath` duly *found* the switchback path through all 10 of level-08's nodes.
**The graph knew the path existed; only the driver could not follow it.**

**Bug 1 — `route-planner.mjs` had no leftward mount model.** `computeMountTakeoffX` computed
`x = to.xStart - offset` (a rightward mark). For the up-LEFT T3→T4 hop that clamped to
`from.xStart + 4` = **2854**, i.e. T3's own left edge, pointing the jump *away* from T4.

**Bug 1b — and the garbage takeoff then got silently deleted.** The takeoff dedupe merged on
raw x-proximity alone. On a *folded* route, takeoffs from different tiers land close together
in x: the useless `mount@2854` (launch surface y:99) sat 32px from `mount@2822` (launch surface
y:24) — two tiers and three hops apart — so the `< DEDUPE_PX` merge swallowed it. **The goal
route therefore emitted no takeoff whatsoever for the T3→T4 hop.** The diff harness caught this;
it is not something the original diagnosis had spotted.

**Bug 2 — `mechanic-drive.mjs :: driveToXPlanned` held one direction for the whole drive.**
`page.keyboard.down("ArrowRight")` before the loop, `up` in the `finally`, and progress measured
as a monotonically-increasing `maxX`. A leftward leg reads as a stall; the bot walked off the
tier and died (8 deaths, stalling at x≈2870).

The irony, recorded because it is the transferable lesson: plans 34-01/34-02 deliberately made
the **coin** model bidirectional, citing *this very switchback* in `bestWitnessToCoin`'s own
header. The same reasoning was never extended to the driver.

## What was built

**A route is now an ordered chain of LEGS, each carrying its own direction.**

`route-planner.mjs`:
- `hopDir(from, to)` — resolves travel direction, including the overlapping-span case that
  *every* switchback tier pair is (docs/LEVEL-DESIGN.md's ~70px-overlap rule forces consecutive
  tiers to overlap, so disjoint-span logic alone can never classify a climb).
- `expandHop` (chain building) split out of the old fused `pushHopTakeoffs`, so obstruction
  sub-paths land in the chain and get directions like any other leg; `emitLegTakeoff` does
  direction-relative emission.
- Leftward mount marks **mirror** about the target's far edge (`to.xEnd + offset`). T3→T4's
  mark moves from the garbage 2854 to **3028**, out on T3's turn-around runway.
- Every takeoff carries `dir` (the heading the driver must be holding to fire it) and `leg`
  (`null` for spike hops — opportunistic hazard clearance, not route structure).
- Dedupe requires **same-surface AND same-direction**; suppression's node lookup passes `fromY`
  so it resolves by launch surface instead of by `buildNodes` declaration-order luck (the
  T2→T3 mount at x:2782 falls inside *both* T2's and T4's spans — it survived by coincidence).

`mechanic-drive.mjs`:
- **Held direction is per-leg**, and the current leg is **derived from live player state** every
  grounded tick (which surface the feet are on) — never a stored cursor. Respawns onto any
  checkpoint on any tier therefore self-heal for free.
- **Firing is direction-relative**: `along = t.dir * (x - t.x)`, fire on `0 <= along <= window`.
  For a rightward takeoff this is byte-identical to the old `x >= t.x && x <= t.x + window`.
- **Progress is non-monotonic** — "advanced along the route", not "x got bigger". Death
  detection became a **position warp** (>200px between consecutive ~55ms samples; nothing but a
  respawn can do that) rather than a backward-x warp, so a leftward leg's legitimate ~13px/tick
  walk is no longer misread as a stall.
- **Approach/backup**: overshoot a takeoff mark and the driver walks back to it, turns, and
  fires. That single rule flies **both** reversals with zero level-specific code:
  - REVERSAL 1 (T3→T4, up-LEFT): land at T3's left end, walk *right* past T4's far edge onto
    T3's runway, turn around, jump back up-left.
  - REVERSAL 2 (T4→T5, up-RIGHT): land at T4's *right* end (~2913), walk *left* to ~2802 for
    run-up, sprint right and jump.
  Which is, word for word, the maneuver level-08's own descriptor documents.
- **Arrival** walks to `targetX` from either side — this is what finally reaches the alcove at
  x:2650, which sits *left* of where the T3→T4 arc lands the player.

Public contract (`driveToXPlanned`, `resolveIfBoxed`, `deriveEncounters`, `driveAndDetectAlcove`)
is unchanged; every caller works untouched.

## Regression proof (the blast radius was the whole suite)

Every level's completion proof runs through this driver, so "level-08 works" is worthless
without "01–07 provably didn't move". Baseline captured **before** any edit:

| Gate | Baseline (before) | After |
|---|---|---|
| `browser-boot.mjs` | **RED** — level-08 stalled at x:2870, never reached goal.x:3460; level-02 `fps 36 < 40` (known load-contention flake) | **PASS** — all 8 levels reach goal, zero errors |
| `audit-phase21-mechanics.mjs` | 23/24 — `level-08 secret-alcove@2650 triggered=false` after 5 attempts | **24/24 ALL MECHANICS RESOLVED** |
| `audit-coins.mjs` | exit 0 — coins=132 witnessed=124 collected=124 | **exit 0 — 132/124/124, identical** |
| `check-safety.sh` / `check-import-safety.sh` | PASS | **PASS** |
| `route-planner.mjs` self-test | PASS | **PASS** (+ new switchback assertions) |

**Static proof that levels 01–07 did not move:** a throwaway diff harness ran the *old* and
*new* `planTakeoffs` side by side over every level × every real target (every door, gate, enemy,
alcove, and goal — 32 targets). Result: **byte-identical takeoff sets everywhere except the two
level-08 switchback routes.** Levels 01–07 have literally the same plan as before, so the
planner half carries zero regression surface. Level-02's alcove even improved (3 attempts → 1).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] Arrival branch skipped the takeoff fire loop — I introduced this, caught it, fixed it**
- **Found during:** Task 2, first full `browser-boot.mjs` run after the rewrite.
- **Issue:** My first cut of the arrival branch `continue`d straight to the next tick, before the
  spike fire loop. Level-01's spike@880 sits between checkpoint@800 and the enemy@1000 that drive
  targets — so the spike hop never fired. The player walked into the spike, respawned 80px back at
  the checkpoint (a warp far too small to read as a death), walked into it again, and bounced there
  until the 15s stall guard fired. This broke **4 levels** (01/02/03/04 far-end + 01/04 encounters)
  — a far worse regression than the bug being fixed.
- **Why it happened:** the old driver had exactly ONE loop that always ran the fire loop. Splitting
  out an "arrival" mode quietly dropped that invariant.
- **Fix:** restructured the tick so the arrival branch computes only *direction* and the *progress
  metric*; the fire loop now runs unconditionally in both modes (route takeoffs are leg-scoped and
  naturally inert on arrival; spike hops are `leg: null` and stay eligible).
- **Files:** `scripts/lib/mechanic-drive.mjs`
- **Commit:** 4052e60

This is the single most useful thing in this summary: **the regression was invisible to the level
it was meant to fix.** Level-08 would have gone green while levels 01–04 silently rotted. Only
running the full 8-level baseline caught it.

**2. [Rule 1 - Bug] Cross-surface takeoff dedupe (not in the original diagnosis)**
- **Found during:** Task 1, via the old-vs-new diff harness.
- **Issue:** the `< DEDUPE_PX` merge compared raw x only. On a folded route it deleted a
  load-bearing mount belonging to a different tier three hops away — which is why the goal route
  emitted *no* T3→T4 takeoff at all, not merely a wrong one.
- **Fix:** merge now requires same `dir` **and** same `fromY`. Also passed `fromY` to the
  suppression filter's node lookup, which was resolving by declaration order and surviving on luck.
- **Files:** `scripts/lib/route-planner.mjs`
- **Commit:** 4052e60

### Scope notes

- The spike-before-mount conflict merge (Strategies 1/2 in `computeMountTakeoffX`) is deliberately
  **gated to rightward hops**. Its whole walk-order model assumes rightward travel, and no spike in
  this game sits on a climb tier — generalising it would have added risk with no case to serve.
  Documented inline.
- `validate-levels.mjs` remains RED (levels 01–03 coin rows from a deliberately-skipped plan;
  level-07 headroom from a parallel plan). Expected, out of scope, does not block — unchanged by
  this plan.
- `docs/LEVEL-DESIGN.md`, `docs/LEVEL-REVIEW.md`, `scripts/lib/reachability.mjs` (owned by parallel
  plan 34-06) were **not touched**; `reachability.mjs` was read-only input.

## Why this mattered

Before this plan, **nothing automated proved level-08 was navigable from spawn.**
`audit-coins.mjs` *teleports* the player onto each tier, so it proves coins are collectable *on*
the tiers — not that the climb can be reached at all. Only a human's play proved it. That was a
red gate we would otherwise have been quietly agreeing to ignore: the exact failure this phase
exists to end, just inverted.

Phase 34.5 is about to rebuild all 8 levels at twice the length. Every one of those rebuilt levels
now has a driver that can actually prove it completable. Phase 36's moving platforms and patrols
need the same bidirectionality.

## Known Stubs

None.

## Self-Check: PASSED

- `scripts/lib/route-planner.mjs` — FOUND (modified)
- `scripts/lib/mechanic-drive.mjs` — FOUND (modified)
- `scripts/browser-boot.mjs` — FOUND (modified)
- `scripts/audit-phase21-mechanics.mjs` — FOUND (modified)
- `.planning/phases/34-level-quality-pass/34-07-PLAN.md` — FOUND
- Commit 0dceba0 (plan) — FOUND
- Commit 4052e60 (driver + planner) — FOUND
- Commit eb251ff (ports) — FOUND
