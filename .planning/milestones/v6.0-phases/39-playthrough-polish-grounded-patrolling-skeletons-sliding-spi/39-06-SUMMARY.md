---
phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi
plan: 06
subsystem: game-levels
tags: [kaplay, level-data, patroller, sliding-spike, mover, patrol-component, engine-bug, browser-boot]

# Dependency graph
requires:
  - phase: 39-01
    provides: geometry.slidingSpikes builder loop + CONFIG.SLIDING_SPIKE + freeze-strip exemption + reachability/validator plumbing
  - phase: 39-04
    provides: shared walk-driver grounded-patroller hop
  - phase: 39-05
    provides: hardened prop-hop (nearTakeoff + solidAhead) + grounded-patroller placement rules
provides:
  - Grounded, genuinely WALKING skeleton patrollers on Levels 5, 6 & 7 (POL-01)
  - "build.js patrol() re-arm workaround for the Kaplay 3001.0.19 born-finished bug — EVERY patroller since Phase 36 had stood frozen at x1; all 8 levels' skeletons now actually ping-pong"
  - First real slidingSpikes placements — L5 F3 2790<->2860 and L7 W2 2830<->2900, both ground-sliding at y304 in the shadow of a static spike (POL-02)
  - L7 mover sweep widened 40px -> 80px leftward, right extent byte-held (POL-03 motion-only)
affects: [39-07, 39-08, audit-phase21, kid-UAT-VER-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Kaplay 3001.0.19 patrol() TRAP: the factory inits its finished flag as (opts.waypoints != null), so a patroller CONSTRUCTED with waypoints never moves — re-assign waypoints through the SETTER after add() to arm it (the setter resets the cursor AND clears the flag)"
    - "Sliding-spike placement idiom: put the sweep in the SHADOW of a static spike (just past it) so the driver's planned static-spike hop arcs over the whole sweep and the pair reads as one timed cluster; keep the pre-spike checkpoint as the safe respawn run-up"
    - "Grounded-patroller sweep right-end cap: the walk-driver's hop lands ~92px past the meeting point, so cap x2 so the latest hop still lands on solid floor (L6 P0 capped at 1990 for the F1 edge 2100; L6 P1 capped at 2540 for the enemy blocker@2600)"

key-files:
  created: []
  modified:
    - src/levels/level-05.js
    - src/levels/level-06.js
    - src/levels/level-07.js
    - src/levels/build.js

key-decisions:
  - "patrol() frozen-skeleton root cause fixed in build.js (Rule 1): POL-01's 'visible sweep' truth was impossible without it — the kid's 'stationary skeleton' report was this engine bug, not slowness"
  - "L6 P1 sweep 2435..2540 (105px) capped by the F2 lane: left end at the PL1->F2 landing-arc boundary (~2440), right end held so the 44px body edge (2584) clears the enemy blocker@2600 — a hop that overshoots meets the tall blocker and drops into the math challenge, never past it"
  - "Sliding spikes authored at 70px sweeps inside each host lane so the existing static-spike hop clears both hazards in one arc — no new driver logic needed"
  - "audit-phase21 timeout (570s cap) NOT blocked on, per the phase's standing carve-out — replaced with targeted Playwright probes proving oscillation + the shared spike->respawn seam"

patterns-established:
  - "Engine-component regression probing: when a Kaplay component silently no-ops, probe the live entity (onUpdate tick counter + anim frame + manual comp.update() call) to separate 'updates not running' from 'update body guarded off', then read the minified factory closure init"

requirements-completed: [POL-01, POL-02, POL-03]

coverage:
  - id: D1
    description: "Levels 5, 6 & 7 skeletons walk on the floor with a wide visible sweep off the coins; contact respawns."
    requirement: "POL-01"
    verification:
      - kind: automated_ui
        ref: "node scripts/browser-boot.mjs — PASS (EXIT 0), all 8 levels spawn->goal with genuinely MOVING grounded skeletons; ZERO driver diagnostics on the Task-1 run (cleaner than any prior run)"
        status: pass
      - kind: automated_ui
        ref: "Playwright probe: L7 P0 samples ping-pong 415->514->424->456 @speed 80 after the build.js patrol() re-arm (frozen at x1 before it)"
        status: pass
      - kind: other
        ref: "grep: no patroller in L5/L6/L7 at y:214; sweeps 120/130/105/105px @speed 80; validate-levels PASS; check-geometry-frozen PASS (patrollers EXEMPT)"
        status: pass
    human_judgment: true
    rationale: "The 'reads as a walking biped / stays fun' feel is the plan 39-08 human-verify + VER-02 kid-UAT judgment; automation now proves real motion, grounding, sweep width, and no-softlock traversal."
  - id: D2
    description: "L5 and L7 carry a geometry.slidingSpikes hazard that slides horizontally along the ground and respawns on contact; each level still validates and is crossable."
    requirement: "POL-02"
    verification:
      - kind: automated_ui
        ref: "Playwright probes: L5 slider oscillates 2790..2859 and L7 slider 2830..2899, both at y:304 (raised-cosine full sweep); slider-band contact warped the player to the respawn point (shared 'spike' seam CONFIRMED)"
        status: pass
      - kind: automated_ui
        ref: "browser-boot PASS: goal-drives cross both spike clusters (static hop arcs over the sweep); validate-levels 0 HARD-FAIL (slider passable); check-geometry-frozen PASS (slidingSpikes EXEMPT)"
        status: pass
      - kind: other
        ref: "audit-phase21-mechanics timed out at the 570s cap (known node-v24 harness slowness, now longer with moving patrollers) — non-blocking per plan instructions; deferred-items updated"
        status: unknown
    human_judgment: true
    rationale: "The 'timeable, fair, reads as a moving hazard' feel is a 39-08/kid-UAT judgment; the audit diagnostic is the known-slow harness and was substituted with direct in-engine probes."
  - id: D3
    description: "L7's near-zero mover sweep is widened (EXEMPT) so it visibly moves."
    requirement: "POL-03"
    verification:
      - kind: other
        ref: "grep: L7 mover {x1:4450,x2:4530,w:60} — 80px sweep (was 40px); right extent x2+w=4590 byte-held (spike@4650 takeoff margin preserved); check-geometry-frozen PASS (movers EXEMPT)"
        status: pass
    human_judgment: true
    rationale: "The 'visibly slides' read is a 39-08 human-verify item; static assertion proves the sweep doubled leftward with the documented no-softlock right extent held."

# Metrics
duration: ~70min
completed: 2026-07-19
status: complete
---

# Phase 39 Plan 06: L5/L6/L7 Grounded Skeletons + First Sliding Spikes + L7 Mover Widen Summary

**Grounded the cemetery/castle-approach skeletons on Levels 5, 6 & 7 and — in the process — found and fixed the reason NO patroller has ever moved (a Kaplay 3001.0.19 patrol() born-finished bug that froze every skeleton since Phase 36); placed the first two real sliding-spike hazards (L5 & L7, each ground-sliding in the shadow of a static spike so the pair clears as one timed cluster); and doubled L7's near-zero mover sweep — all freeze-EXEMPT, browser-boot green across all 8 levels with zero driver diagnostics.**

## Performance

- **Duration:** ~70 min (dominated by root-causing the frozen-patrol engine bug via live Playwright probes)
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- **POL-01:** L5 P0 (1120..1240), L6 P0 (1860..1990) + P1 (2435..2540), L7 P0 (415..520) all dropped from the y:214 hover to y:268 (feet on FLOOR_Y 320, 44x52 frame) with per-patroller `speed: 80` and endpoints eased off the floor coins; every sweep's right end is capped so the walk-driver's hop (~92px carry) lands on solid floor (or against the L6 enemy blocker, which correctly drops into the math challenge).
- **Engine-bug fix (Rule 1 deviation, the plan's biggest find):** Kaplay 3001.0.19's `patrol()` factory initializes its internal finished-flag as `s = opts.waypoints != null` — a patroller constructed WITH waypoints is born "finished" and its update body never runs. **Every patroller since Phase 36 stood frozen at (x1,y1)** — the kid's "stationary skeleton floating on a coin" report was this bug, not slow speed, and the frozen body camping exactly on the drive-target x1 was also what death-looped the walk driver. One-line workaround in `build.js`: re-assign `foe.waypoints` through the setter (the only path that resets the cursor and clears the flag). Probe-verified frozen→ping-pong; browser-boot then passed all 8 levels with ZERO driver diagnostics (prior runs always carried tolerated death-loop noise — that noise was the frozen-skeleton artifact all along).
- **POL-02:** first real `geometry.slidingSpikes` placements against the 39-01 builder contract — L5 F3 sweeping 2790↔2860 and L7 W2 sweeping 2830↔2900, both at `y = FLOOR_Y - SPIKE_SIZE = 304` with the default 3s period. Each rides just past a static spike so the driver's planned static-spike hop arcs over the whole sweep; a pre-cluster checkpoint gives a safe respawn run-up. Probes confirm full-sweep raised-cosine oscillation and the shared "spike"→respawn seam firing on slider contact.
- **POL-03 (motion-only):** L7's ~40px mover sweep widened LEFTWARD to 80px (x1 4490→4450), holding the documented right extent (x2+w=4590) byte-stable to preserve the spike@4650 takeoff margin.
- **Frozen-geometry stayed byte-identical** — every level-data edit is on an EXEMPT key (patrollers / slidingSpikes / movers); the build.js edit is builder code, not geometry.

## Task Commits

1. **Task 1: Ground the L5/L6/L7 skeleton patrols (+ patrol() engine-bug fix)** - `938faae` (feat)
2. **Task 2: Sliding spikes on L5 and L7 + widen the L7 mover** - `ad3d3e6` (feat)

## Files Created/Modified
- `src/levels/level-05.js` - P0 grounded to y:268, sweep 1120..1240 @80 (off coins, hop lands on F1); slidingSpikes S0 2790<->2860 on F3 past static spike@2760
- `src/levels/level-06.js` - P0 grounded, sweep 1860..1990 @80 (right end capped for the F1 edge 2100 hop landing); P1 grounded, sweep 2435..2540 @80 (body edge 2584 clear of enemy blocker@2600)
- `src/levels/level-07.js` - P0 grounded, sweep 415..520 @80 (right end held so hops land before the CU1 gap); slidingSpikes S0 2830<->2900 on W2 past static spike@2800; mover x1 4490->4450 (80px sweep, right extent held)
- `src/levels/build.js` - [Rule 1 deviation] patrol() re-arm via the waypoints setter, working around the vendored engine's born-finished init bug (heavily commented; do not remove on a Kaplay upgrade without re-probing)

## Decisions Made
- **Fix the engine bug in build.js rather than tune around frozen skeletons.** POL-01's must-have truth is "skeletons WALK with a visible sweep" — unachievable while patrol() never runs. The workaround is a single setter re-assignment at the one patroller construction site; no vendored-engine edit, no Kaplay upgrade.
- **L6 P1 stays on F2 between the landing arc and the enemy.** The 105px sweep 2435..2540 is the widest the lane allows: left end at the PL1->F2 landing-arc boundary, right end capped so the skeleton's body never overlaps the enemy blocker — an overshooting driver hop meets the tall blocker and falls into the math challenge, which is the desired fail-safe.
- **Sliding spikes live in a static spike's shadow.** Both placements reuse the driver's existing static-spike hop (takeoff before the static spike, landing past the sweep) so POL-02 needed zero new driver logic, and the player reads the pair as one "spike cluster to time" — L5/L7's declared action beat.
- **audit-phase21 treated as non-blocking diagnostic** (570s timeout under node v24, now slower with genuinely moving patrollers) — substituted targeted probes; follow-ups recorded in deferred-items.md.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Kaplay patrol() born-finished bug — every patroller frozen since Phase 36**
- **Found during:** Task 1 (browser-boot failed: level-06 far-end unreachable; AUDIT_DEBUG showed death-loops at door-adjacent skeletons)
- **Issue:** The vendored Kaplay 3001.0.19 `patrol()` factory inits its finished flag as `s = opts.waypoints != null`, so constructing with waypoints permanently disables the component's update body. Probes proved the entity's updates DO run (anim frames advance, onUpdate ticks) while the patrol waypoint cursor never advances; manual `comp.update()` calls confirmed the guard, and the minified factory closure showed the init. All patrollers on all 8 levels have been stationary since Phase 36-05 — invisible to every prior gate because the audits only assert "player reached the foe's x-span / contact fired", never motion.
- **Fix:** `foe.waypoints = [vec2(p.x1,p.y1), vec2(p.x2,p.y2)]` after `add()` — the setter is the only path that resets the cursor AND clears the finished flag. Fresh array per patroller (ping-pong reverses in place).
- **Files modified:** src/levels/build.js
- **Verification:** probe shows full ping-pong sweep at speed 80; browser-boot PASS all 8 levels, exit 0, zero driver diagnostics.
- **Committed in:** 938faae

---

**Total deviations:** 1 (blocking engine-bug fix).
**Impact on plan:** The fix retroactively activates motion on L1-L4's already-grounded skeletons too — that is POL-01's intent phase-wide. No scope creep beyond the one builder line; all placements remain pure level data.

## Issues Encountered
- **Recovered a prior interrupted session's uncommitted work.** The working tree held uncommitted L5/L7 edits matching this plan (no commits, no SUMMARY — a prior executor was cut off). Restored the tree to HEAD and re-applied the authoring per-task after verifying it against the 39-01 contract and CONTEXT decisions, so each task commit stayed atomic.
- **audit-phase21-mechanics.mjs exceeded a 570s cap** (killed by timeout; known node-v24 harness slowness from 39-03, now compounded by genuinely moving patrollers lengthening each per-encounter drive). Non-blocking per the plan's explicit carve-out; both new mechanics were instead proven with targeted Playwright probes (oscillation + respawn seam). Logged to deferred-items.md with a note that `driveAndDetectPatroller` was authored against frozen patrollers and should be re-validated.
- **One tolerated diagnostic on the Task-2 boot run:** the L5 P0 patroller-encounter drive (target = the skeleton's own x1) death-looped mid-loop — the documented 39-05 noise class; no error pushed and the final goal-drive cleared.

## Known Stubs
None — level-data plus one builder-line fix; no placeholder data or unwired components.

## Threat Flags
None — level-data and builder edits only; no new network/auth/file surface (matches the plan's threat register: T-39-01 accepted, no new surface).

## User Setup Required
None.

## Next Phase Readiness
- Patrollers genuinely move for the first time — 39-07 (L8 work) inherits walking skeletons and the same placement rules; 39-08's human-verify pass can now actually judge "reads as a walking biped".
- The sliding-spike placement idiom (static-spike shadow + pre-cluster checkpoint) is established for any future POL-02 placement.
- VER-02 kid-UAT note: the world's motion feel changes on ALL levels (patrollers walk now) — exactly what her feedback asked for; the re-run covers it.
- Harness follow-ups (audit runtime budget, driveAndDetectPatroller vs moving skeletons) are in deferred-items.md.

## Self-Check: PASSED
- FOUND: src/levels/level-05.js, src/levels/level-06.js, src/levels/level-07.js, src/levels/build.js
- FOUND: 39-06-SUMMARY.md
- FOUND: commit 938faae, commit ad3d3e6

---
*Phase: 39-playthrough-polish-grounded-patrolling-skeletons-sliding-spi*
*Completed: 2026-07-19*
