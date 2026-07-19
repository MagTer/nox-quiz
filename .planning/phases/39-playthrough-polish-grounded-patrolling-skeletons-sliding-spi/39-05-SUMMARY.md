---
phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi
plan: 05
subsystem: game-levels
tags: [kaplay, level-data, patroller, solid-prop, mover, browser-boot, mechanic-drive, clearability]

# Dependency graph
requires:
  - phase: 39-01
    provides: pr.solid builder branch + reachability.solidBoxes + walk-driver prop-hop
  - phase: 39-04
    provides: shared walk-driver patroller-hop (nearTakeoff "defer only to imminent" rule)
provides:
  - Grounded, wide-sweeping, coin-clear skeleton patrollers on Levels 3 & 4 (POL-01)
  - 5 of 6 town barrels/crates made solid jump-over obstacles (POL-04); the L3 F2 crate flagged NON-solid (route-breaks exception)
  - L3 prop-town-well moved clear of the F5 spike (POL-05)
  - L4 near-zero mover sweep widened so it visibly slides (POL-03, motion-only)
  - Hardened walk-driver prop-hop (nearTakeoff guard + solidAhead gate) that clears a solid prop before a distant platform-mount takeoff without regressing prop-free climb levels
affects: [39-06, 39-07, 39-08, browser-boot-parity, audit-phase21]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Solid props MUST sit clear of a checkpoint respawn point (a prop overlapping the respawn x makes the player respawn INSIDE the collider and death-loops) AND >150px before any platform-mount takeoff (else the prop lands in the walk-driver's hop-suppression zone and deadlocks the goal-drive)"
    - "A floor that carries a grounded ping-pong patroller cannot also clearably carry a solid jump-over prop when the floor's forward exit is a platform mount: the prop steals the driver's run-up so its patroller-hop lands short and respawn-loops — leave that one prop non-solid (user decision #5 'revisit if a route breaks')"
    - "Widen a near-zero mover sweep LEFTWARD (move x1, hold x2+w) to preserve a documented right-extent no-softlock constraint"

key-files:
  created: []
  modified:
    - src/levels/level-03.js
    - src/levels/level-04.js
    - scripts/lib/mechanic-drive.mjs

key-decisions:
  - "L3 F2 crate left NON-solid: F2 is the only clean flat street for L3's grounded patroller and its 400px (bounded by the chimney-landing respawn@1670 and the LST1 mount's 150px takeoff-suppression zone) cannot clearably host both a wide grounded skeleton AND a solid crate. 5 of 6 town props solid; the exception is the sanctioned 'revisit if a route breaks' flag."
  - "Walk-driver prop-hop guard changed from !pending to !nearTakeoff AND gated on a real solid prop being ahead (solidAhead, z>=0 props): !pending deadlocked a solid prop before a distant mount; a bare !nearTakeoff regressed prop-free climb levels (L6) by firing on climb-tier stalls; solidAhead makes it precise."
  - "Every solid prop repositioned off its checkpoint respawn point and >150px before its floor's platform-mount takeoff."

patterns-established:
  - "Pattern: solid-prop placement rule = clear of checkpoint respawn x + >150px before any platform-mount takeoff + not co-located with a grounded patroller on a mount-exit floor."
  - "Pattern: walk-driver solid-prop hop is gated on an actual z>=0 solid prop within propAheadPx ahead at the driver's floor level (never a bare stall)."

requirements-completed: [POL-01, POL-03, POL-05]

coverage:
  - id: D1
    description: "Levels 3 & 4 skeleton patrollers walk on the floor (feet on FLOOR_Y) with a visibly wider, faster sweep off the coins; contact respawns."
    requirement: "POL-01"
    verification:
      - kind: automated_ui
        ref: "node scripts/browser-boot.mjs — PASS (EXIT 0): title -> select -> all 8 levels spawn->goal; grounded L3/L4 skeletons hopped by the walk driver; no runtime errors"
        status: pass
      - kind: other
        ref: "node scripts/validate-levels.mjs PASS (0 HARD-FAIL); node scripts/check-geometry-frozen.mjs PASS (patrollers EXEMPT); grep: no L3/L4 patroller at y:214"
        status: pass
    human_judgment: true
    rationale: "Visual read of the skeleton as a walking biped and the 'stays fun/clearable for the kid' feel are POL-08 human-verify judgments (deferred to 39-08); automation proves grounding, sweep width, coin-clearance, and no-softlock traversal."
  - id: D2
    description: "The town barrels/crates are solid jump-over obstacles that block the player and do NOT block the required route (each jump-clearable per the envelope)."
    requirement: "POL-04"
    verification:
      - kind: automated_ui
        ref: "browser-boot goal-drive clears L3 (barrel@960, barrel@3400, crate@5340) and L4 (barrel@200, crate@2860) by hopping each solid prop — no far-end-unreachable error"
        status: pass
      - kind: other
        ref: "grep: 3 solid props in level-03.js + 2 in level-04.js = 5; reachability models them (validate-levels PASS)"
        status: pass
    human_judgment: true
    rationale: "5 of 6 town props are solid; the L3 F2 crate is the sanctioned 'revisit if a route breaks' exception (co-located with the grounded patroller on a mount-exit floor). Kid-play confirmation of jump-over feel is deferred to 39-08."
  - id: D3
    description: "The L3 prop-town-well is moved clear of the F5 spike at x:4460."
    requirement: "POL-05"
    verification:
      - kind: other
        ref: "grep prop-town-well = x:5000 (was 4400), ~540px from spike@4460; spike unchanged (check-geometry-frozen PASS)"
        status: pass
    human_judgment: true
    rationale: "The visual 'well no longer overlaps the spike' read is a POL-08 human-verify item (39-08); static assertion proves the coordinate move and the spike's immutability."
  - id: D4
    description: "L4's near-zero (~40px) mover sweep is widened so it visibly moves (motion-only, no frozen edit)."
    requirement: "POL-03"
    verification:
      - kind: other
        ref: "grep L4 mover = {x1:4460,x2:4540} (80px sweep, was 40px); right extent x2+w=4660 held; check-geometry-frozen PASS (movers EXEMPT)"
        status: pass
    human_judgment: true
    rationale: "The 'visibly slides' read is a POL-08 human-verify item (39-08); static assertion proves the sweep doubled and the no-softlock right-extent constraint is preserved."

# Metrics
duration: 120min
completed: 2026-07-19
status: complete
---

# Phase 39 Plan 05: Grounded L3/L4 Skeletons + Solid Town Props + Well Move + Mover Widen Summary

**Turned the town-biome pair (Levels 3 & 4) into real platforming: grounded, wide-sweeping skeleton patrollers (POL-01); 5 of 6 town barrels/crates made solid jump-over obstacles (POL-04, with the L3 F2 crate flagged non-solid as the sanctioned route-breaks exception); the L3 well moved off the F5 spike (POL-05); and L4's near-zero mover sweep doubled (POL-03) — all freeze-EXEMPT, plus a hardened walk-driver prop-hop that clears a solid prop before a distant platform mount without regressing prop-free climb levels.**

## Performance

- **Duration:** ~120 min (dominated by 5 full browser-boot iterations diagnosing solid-prop/driver interactions)
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- **POL-01:** L3 F2 patroller and both L4 patrollers dropped from the y:214 hover to a grounded y:268 (feet on FLOOR_Y 320, 44x52 topleft frame), given per-patroller `speed:80` and wider sweeps with endpoints shifted off the floor coins; contact still respawns via the existing patroller seam.
- **POL-04:** 5 of 6 town props made solid jump-over obstacles (L3 barrel@960, barrel@3400, crate@5340; L4 barrel@200, crate@2860). Each was repositioned off its checkpoint respawn point and to >150px before its floor's platform-mount takeoff so the walk driver hops it cleanly. The L3 F2 crate is left NON-solid — the sanctioned "revisit if a route breaks" exception (see Deviations).
- **POL-05:** `prop-town-well` moved x:4400 -> 5000, ~540px clear of the frozen F5 spike@4460.
- **POL-03:** L4's ~40px mover sweep widened to 80px (x1 4500 -> 4460), preserving the documented `x2+w = 4660` right-extent no-softlock guard.
- **Frozen-geometry stayed byte-identical** — every edit is on an EXEMPT key (patrollers / top-level props / movers).
- **Hardened the shared walk-driver** so a solid prop before a distant platform mount is hopped (not deadlocked), while a prop-free climb level (L6) is not regressed.

## Task Commits

1. **Task 1: L3 grounded skeleton + solid props + well move + shared driver fix** - `848a9e5` (feat)
2. **Task 2: L4 grounded skeletons + solid props + widened mover** - `d55578c` (feat)

The shared harness deviation (scripts/lib/mechanic-drive.mjs) is committed with Task 1, where the solid-prop deadlock was first discovered; it also underpins Task 2's solid props.

## Files Created/Modified
- `src/levels/level-03.js` - P0 patroller grounded to y:268 sweep 1760..1880 @speed 80; barrel@880->960 and crate@5420->5340 (+ solid), barrel@3400 (+ solid) — all clear of checkpoints/takeoffs; F2 crate@1810 kept NON-solid (route-breaks exception); well@4400->5000.
- `src/levels/level-04.js` - both patrollers grounded to y:268 (F0 400..580, F1 3140..3300, @speed 80); barrel@60->200 and crate@2760->2860 (+ solid, off checkpoints@96/@2820); F2 mover sweep 40px->80px (x1->4460).
- `scripts/lib/mechanic-drive.mjs` - [Rule 3 deviation] prop-hop guard `!pending` -> `!nearTakeoff` + a new `solidAhead` gate (live z>=0 solid-prop spans in the driver state), plus a `propAheadPx` opt; fixes the solid-prop-before-a-mount deadlock and the L6 climb regression the looser guard introduced.

## Decisions Made
- **L3 F2 crate stays non-solid (route-breaks exception).** F2 (1650..2050) is L3's only clean flat street, so it must carry the grounded patroller (POL-01, core). Its 400px is bounded left by the chimney-landing respawn@1670 and right by the LST1 mount's 150px takeoff-suppression zone, leaving no room to also host a solid jump-over crate: a solid crate steals the driver's run-up to the patroller, shortening its clearing hop so it lands back on the skeleton and the browser-boot goal-drive respawn-loops (proven across two boot iterations, stalling at x:1674 then x:1808). Per user decision #5 ("revisit only if a route breaks") and the plan's flag instruction, this one crate is decoration; 5 of 6 town props are solid.
- **Solid props must clear checkpoint respawn points.** A solid prop whose collider overlaps a checkpoint's respawn x makes the player respawn INSIDE the collider and death-loop (observed as "8 deaths" near L4 spawn: barrel@60 overlapped SPAWN_X 64 + checkpoint@96; crate@2820 overlapped checkpoint@2820). All solid props were moved to keep a clear gap from every respawn x.
- **Solid props must sit >150px before a platform-mount takeoff.** Within the driver's 150px lookahead the prop-hop is (correctly) suppressed to avoid a spurious hop at a real takeoff; a solid prop inside that band deadlocks (crate@5420 stalled the L3 goal-drive at x:5404, 96px before the DW1 mount). Moved to 5340 (176px clearance).
- **Widen a near-zero mover LEFTWARD.** L4's mover right-extent (x2+w=4660) is a documented no-softlock constraint (must stay ~30px left of the spike-jump takeoff); widening moved only x1 (4500->4460) so the right extent is byte-preserved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Hardened the shared walk-driver prop-hop (mechanic-drive.mjs)**
- **Found during:** Task 1 (browser-boot goal-drive acceptance for the L3 solid crate)
- **Issue:** 39-01's prop-hop was guarded by `!pending` — suppressed whenever ANY route takeoff was pending. A solid town prop sits on a floor whose forward exit is a platform mount, so `!pending` deadlocked the driver against every such prop (L3/L4 goal-drives stalled at the crate/barrel). Loosening to `!nearTakeoff` (defer only to imminent takeoffs) fixed the deadlock but regressed a prop-FREE climb level: on L6 the driver's climb-tier repositioning stall fired a spurious hop that blew the platform-2 -> platform-3 hop ("door@1800 never triggered").
- **Fix:** Guard the prop-hop on BOTH `!nearTakeoff` AND a new `solidAhead` predicate — a real z>=0 solid prop within `propAheadPx` ahead of the driver at its own floor level (live `get("prop")` spans, filtered by play-depth z, added to the driver state). Now the hop fires only when a genuine solid prop blocks the lane, never on a bare stall; inert on prop-free levels.
- **Files modified:** scripts/lib/mechanic-drive.mjs
- **Verification:** `node scripts/browser-boot.mjs` -> PASS (EXIT 0), all 8 levels spawn->goal, no far-end-unreachable and no L6 mechanic error.
- **Committed in:** 848a9e5

**2. [Rule 2/Design - route-breaks flag] L3 F2 crate left NON-solid**
- **Found during:** Task 1 (browser-boot goal-drive respawn-looped on the F2 crate + patroller)
- **Issue:** F2 cannot clearably host both the grounded patroller (POL-01) and a solid crate (POL-04) — the plan and user decision #5 explicitly anticipated this ("flag rather than ship an unclearable level").
- **Fix:** Keep the F2 crate as non-solid street dressing (5 of 6 town props solid); document the exception in-file and here.
- **Files modified:** src/levels/level-03.js
- **Committed in:** 848a9e5

**3. [Rule 1 - placement] Repositioned every solid prop off its checkpoint respawn point and out of takeoff-suppression zones**
- **Found during:** Tasks 1 & 2 (browser-boot death-loops and goal-drive stalls)
- **Issue:** Solid props overlapping a checkpoint respawn x (L4 barrel@60/@100, crate@2820) death-looped; a solid prop within 150px of a platform-mount takeoff (L3 crate@5420) deadlocked the goal-drive.
- **Fix:** barrel@60->200, crate@2820->2860 (L4); barrel@880->960, crate@5420->5340 (L3) — all EXEMPT prop moves; frozen hash unchanged.
- **Files modified:** src/levels/level-03.js, src/levels/level-04.js
- **Committed in:** 848a9e5 (L3), d55578c (L4)

---

**Total deviations:** 3 (1 blocking harness retune, 1 sanctioned route-breaks flag, 1 placement class-fix).
**Impact on plan:** The harness retune lives in the shared test-driver lib (no product source, no frozen geometry) and is inert on non-prop levels. POL-04 is delivered as 5/6 solid + 1 documented route-breaks exception exactly as the plan authorized. No product scope creep.

## Issues Encountered
- **Non-fatal driver noise (documented, not a failure):** browser-boot's deliberately-tolerant middle "resolve every remaining encounter" loop drives to each patroller's own x1 (a now-moving grounded skeleton) and logs 5 "no route progress"/"deaths" diagnostics (targetX 800/860/1760/4560/400) before moving on. These are stderr diagnostics only — no error is pushed, every level's FINAL goal-drive reaches goal.x, and the run reports `Browser boot: PASS` with EXIT 0.

## Known Stubs
None — level-data + shared test-harness edits only; no placeholder data or unwired components.

## Threat Flags
None — level-data and test-harness edits only; no new network/auth/file surface (matches the plan's threat register: T-39-01 accepted, no new surface).

## User Setup Required
None.

## Next Phase Readiness
- POL-01 grounding pattern and the hardened solid-prop hop are established for any later plan that grounds patrollers or authors solid props.
- The solid-prop placement rule (clear of checkpoint respawn x; >150px before a platform-mount takeoff; not co-located with a grounded patroller on a mount-exit floor) is documented for 39-06/07.
- The "reads as a walking skeleton / solid props feel like jump-over obstacles / well & mover look intentional / stays fun for the kid" judgments remain for the plan 39-08 human-verify pass (deferred by design).
- POL-04 note for auditors: 5 of 6 town props are solid; the L3 F2 crate is the sanctioned non-solid exception (do not flag as a miss).

## Self-Check: PASSED
- FOUND: src/levels/level-03.js, src/levels/level-04.js, scripts/lib/mechanic-drive.mjs
- FOUND: 39-05-SUMMARY.md
- FOUND: commit 848a9e5, commit d55578c

---
*Phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi*
*Completed: 2026-07-19*
