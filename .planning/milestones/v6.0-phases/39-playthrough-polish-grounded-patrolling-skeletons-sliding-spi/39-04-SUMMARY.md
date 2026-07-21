---
phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi
plan: 04
subsystem: game-levels
tags: [kaplay, level-data, patroller, playwright, browser-boot, mechanic-drive, ambient-light]

# Dependency graph
requires:
  - phase: 39-02
    provides: re-baked prop-swamp-lantern sprite (the L1/L2 alcove light)
  - phase: 36
    provides: patroller factory (build.js patrol/ping-pong seam) + alcove-light link (LINK_DIST)
provides:
  - Grounded, wide-sweeping, coin-clear skeleton patrollers on Levels 1 & 2 (POL-01)
  - Shared walk-driver patroller-hop so browser-boot stays spawn->goal clearable past a grounded patroller
  - Confirmed L1/L2 lantern->secretAlcove ambient link survives the 39-02 re-bake (POL-05)
affects: [39-05, 39-06, 39-07, 39-08, browser-boot-parity, audit-phase21]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Grounded patroller placement: feet on FLOOR_Y via y = 320 - 52 (44x52 topleft frame), per-patroller speed override, endpoints off floor coins"
    - "Walk-driver reactive patroller-hop in the SHARED mechanic-drive.mjs (mirrors POL-04 prop-hop): proactive envelope-bounded leap over a same-floor grounded patroller, re-hop on overshoot, defer only to IMMINENT planned takeoffs"

key-files:
  created: []
  modified:
    - src/levels/level-01.js
    - src/levels/level-02.js
    - scripts/lib/mechanic-drive.mjs

key-decisions:
  - "Grounded a ping-pong patroller across the walk-corridor is un-passable by the walk-only driver for ANY phase (intermediate-value certainty), so the forecasted browser-boot retune was required — implemented as a shared patroller-hop, not a per-script copy."
  - "Suppress the patroller-hop only for IMMINENT planned takeoffs (within lookahead), not distant pending gaps — otherwise L2's far F1->F2 gap vetoed hopping the F1 skeleton."
  - "L2 P0 left endpoint nudged to x:860 (~40px right of door@800) to give the walker run-up before the skeleton zone; body kept on F1 (right end 990+44 < 1040 gap lip)."

patterns-established:
  - "Pattern: grounded patroller = y:268 + speed override + coin-clear endpoints (freeze-EXEMPT geometry key, hash-neutral)."
  - "Pattern: driver clears a grounded respawn-hazard patroller by hopping (respawn contact never trips the POL-04 physical-stall recovery, so the hop must be proactive)."

requirements-completed: [POL-01, POL-05]

coverage:
  - id: D1
    description: "Levels 1 & 2 skeleton patrollers walk on the floor (feet on FLOOR_Y) with a visibly wider, faster ping-pong sweep, shifted off the floor coins; contact still respawns via the existing patroller seam."
    requirement: "POL-01"
    verification:
      - kind: automated_ui
        ref: "node scripts/browser-boot.mjs — PASS: title -> select -> all 8 levels spawn->goal, both grounded skeletons hopped, no runtime errors"
        status: pass
      - kind: other
        ref: "node scripts/validate-levels.mjs — PASS (0 HARD-FAIL); node scripts/check-geometry-frozen.mjs — PASS (patrollers EXEMPT, hash-neutral); grep: no patroller at y:214"
        status: pass
    human_judgment: true
    rationale: "Visual read of the skeleton as a WALKING biped (not a floating wraith) and the 'stays fun/clearable for the kid' feel are POL-08 human-verify judgments; automation only proves grounding, sweep width, coin-clearance, and no-softlock traversal."
  - id: D2
    description: "The L1/L2 alcove light (re-baked prop-swamp-lantern@320,242) still sits within LINK_DIST of secretAlcove@320,184 and lights on discovery."
    requirement: "POL-05"
    verification:
      - kind: other
        ref: "grep prop-swamp-lantern (1 per level) + distance check = 58px < LINK_DIST 96; validate-levels PASS"
        status: pass
    human_judgment: true
    rationale: "The dim->bright-on-discovery flicker is an in-game visual, deferred to plan 39-08 human-verify per the plan's own acceptance criteria; static verification only proves the link geometry survives."

# Metrics
duration: 40min
completed: 2026-07-19
status: complete
---

# Phase 39 Plan 04: Grounded L1/L2 Skeleton Patrols + Alcove-Light Link Summary

**Grounded, wide-sweeping, coin-clear skeleton patrollers on Levels 1 & 2, plus a shared walk-driver patroller-hop that keeps browser-boot spawn->goal clearable past a now-blocking grounded skeleton; L1/L2 lantern alcove link confirmed intact.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- POL-01: L1 P0, L2 P0, and L2 P1 skeletons dropped from the y:214 hover to a grounded y:268 (feet on FLOOR_Y 320, 44x52 topleft frame), widened from ~100px to 130-200px ping-pong sweeps, given `speed:85` overrides, and shifted so their endpoints sit off the floor coins.
- Frozen-geometry stayed byte-identical (patrollers are an EXEMPT key) — proof the edit touched no frozen static array.
- POL-05: verified the re-baked `prop-swamp-lantern@(320,242)` still links to `secretAlcove@(320,184)` at 58px < LINK_DIST 96 in both levels — no coordinate change needed.
- Taught the shared walk-only test driver to HOP a grounded patroller so `browser-boot` still crosses L1/L2 without a softlock.

## Task Commits

1. **Task 1 + Task 2: ground/widen L1/L2 patrols, verify lantern link, add walk-driver patroller-hop** - `050b4d5` (feat)

**Plan metadata:** (this commit)

_Task 2 required no source change (verification-only), so it shares Task 1's atomic commit alongside the harness deviation it depends on._

## Files Created/Modified
- `src/levels/level-01.js` - P0 patroller grounded to y:268, sweep 1630..1830 (200px), speed:85, off coin@1800; comment rewritten for grounded rationale.
- `src/levels/level-02.js` - P0 grounded 860..990 (130px, ~40px run-up past door@800, body on F1), P1 grounded 4560..4720 (160px, threaded between coins@4540 & @4780); both speed:85, y:268.
- `scripts/lib/mechanic-drive.mjs` - [Rule 3 deviation] shared `driveToXPlanned` patroller-hop: live `get("patroller")` spans, an envelope-bounded proactive leap over a same-floor skeleton ahead in the travel direction, re-hop on overshoot, and suppression only for IMMINENT planned takeoffs.

## Decisions Made
- **Grounded patroller is mathematically un-passable by a walk-only driver.** A ping-pong patroller spanning the corridor forces the driver (which must traverse the whole span while the skeleton is inside it) to share an x with it at some instant, for ANY sweep phase/speed — an intermediate-value certainty, not a timing flake. This is exactly why the pre-39 placements hovered above head height, and exactly the "browser-boot retune" 39-PATTERNS forecasted (POL-01 clearability constraint).
- **Hop deferral to imminent (not merely pending) takeoffs.** L2's F1->F2 leg carries a distant pending gap-takeoff (~1040); an initial `!pending` guard suppressed the hop for the whole leg and stranded the driver before the F1 skeleton. Fixed to defer only within the `lookaheadPx` band.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a walk-driver patroller-hop to the shared mechanic-drive lib**
- **Found during:** Task 1 (browser-boot acceptance criterion)
- **Issue:** The plan's own acceptance criterion requires `browser-boot` to cross L1/L2 spawn->goal, but grounding the patrollers made the corridor un-passable for the walk-only driver (proven: 5-min global timeout, then per-level `far-end-unreachable` at L2). A patroller contact routes through respawn (a position WARP), not a physical stall, so the existing POL-04 prop-hop recovery never engages.
- **Fix:** Extended `driveToXPlanned` (the SHARED driver imported by both browser-boot.mjs and audit-phase21-mechanics.mjs — not copied per-script) with an envelope-bounded patroller-hop mirroring the POL-04 prop-hop: query live `get("patroller")` spans, and when grounded and driving toward a same-floor skeleton within the take-off lead, press the jump (full 450ms hold arc, apex feet ~232 clears the skeleton top at 268). Re-hops a fleeing skeleton it lands near; defers only to imminent planned takeoffs. Inert on hover/patroller-free levels (`s.foes` empty).
- **Files modified:** scripts/lib/mechanic-drive.mjs
- **Verification:** `node scripts/browser-boot.mjs` → PASS (EXIT 0), all 8 levels spawn->goal, both grounded skeletons hopped.
- **Committed in:** 050b4d5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking harness retune).
**Impact on plan:** The retune is the browser-boot work 39-PATTERNS explicitly forecasted for POL-01; it lives in the shared test-driver lib (no frozen geometry, no product source touched) and is inert on every non-patroller level. No product scope creep.

## Issues Encountered
- **Non-fatal driver noise (documented, not a failure):** `browser-boot`'s deliberately-tolerant middle "resolve every remaining encounter" loop drives to each patroller's own `x1`; because that target is now a MOVING grounded skeleton, the hop overshoots it and the arrival-walk logs a `no route progress` diagnostic before moving on. These are stderr diagnostics only — no error is pushed, the FINAL goal-drive (the actual gate) reaches goal.x, and the run reports `Browser boot: PASS` with EXIT 0. The dedicated `driveToPatroller` respawn-seam proof (audit-phase21) is unaffected by this.

## Known Stubs
None — no placeholder data or unwired components introduced (level-data + test-harness edits only).

## Threat Flags
None — level-data and test-harness edits only; no new network/auth/file surface (matches the plan's threat register: T-39-01 accepted, no new surface).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- POL-01 grounded-patroller pattern and the shared patroller-hop are established for any later plan that grounds additional patrollers.
- The dim->bright alcove-light flicker and the "reads as a walking skeleton / stays fun" feel remain for the plan 39-08 human-verify pass (deferred by design).

## Self-Check: PASSED
- FOUND: src/levels/level-01.js, src/levels/level-02.js, scripts/lib/mechanic-drive.mjs
- FOUND: 39-04-SUMMARY.md
- FOUND: commit 050b4d5

---
*Phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi*
*Completed: 2026-07-19*
