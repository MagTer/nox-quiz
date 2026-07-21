---
phase: 36-world-motion-ambient-life
plan: 08
subsystem: level-motion-rollout
tags: [motion, mover, moving-platform, patroller, wraith, no-softlock, MECH-05, MOT-01, MOT-02, MOT-03]
requires:
  - phase: 36-03
    provides: "mover + patroller entity CLASSES (build.js loops read geometry.movers/geometry.patrollers)"
  - phase: 36-04
    provides: "ambient flicker (sprite-name selector /lantern|lamp|candle/) + MECH-05 alcove-light auto-link by proximity (LINK_DIST 96)"
  - phase: 36-05
    provides: "the proven no-softlock trial template (hovering-wraith patrollers, goal-floor movers)"
  - phase: 36-07
    provides: "the rollout precedent (02/03/04) — WIDE goal-floor movers; documented headless-ride limitation"
provides:
  - "src/levels/level-05.js — geometry.movers (1) + geometry.patrollers (1), LIGHT calm-odd density + the level's FIRST light (prop-cemetery-lantern, MECH-05)"
  - "src/levels/level-07.js — geometry.movers (1) + geometry.patrollers (1), LIGHT calm-odd density + castle candle (MECH-05); staircase signature intact"
  - "src/levels/level-08.js — geometry.movers (1) + geometry.patrollers (2), HEAVIER intense-even density + castle candle (MECH-05); switchback signature intact"
  - ".planning/phases/36-world-motion-ambient-life/motion-shots/ — 9 evidence PNGs (level-05/07/08)"
affects: [36-09]
tech-stack:
  added: []
  patterns:
    - "WALK-REACHED patroller/mover placement (the load-bearing 36-08 finding): browser-boot's deriveEncounters now emits movers/patrollers as drive WAYPOINTS, so the driver drives to each entity's x1. A patroller/mover whose x sits at a jump-GAP descent-landing makes the driver's final leg a fragile precise-landing that fails ('never landed'), cascading into a death-spiral that strands the whole level. The fix: place every patroller/mover on a FLAT floor reached by pure WALKING after a resolved door/enemy — the driver walks straight onto it, no precise-landing. Level-01's shipped patroller works because its floor entry is a gentle walk-off, not a jump-gap; the redo mirrors that."
    - "Respawn-before-a-cleared-blocker is NOT a re-gate (confirmed from level-06 P0): a wraith on the floor just after a door/enemy respawns to the checkpoint BEFORE that blocker, but unlock is derived from cleared facts and stays cleared, so there is no re-answer loop. This unlocks the safest driver placement (flat lane right after the first door)."
key-files:
  created:
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-05-cemetery-spawn.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-05-cemetery-motion.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-05-cemetery-patroller.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-07-castle-spawn.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-07-castle-motion.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-07-castle-patroller.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-08-castle-spawn.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-08-castle-motion.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-08-castle-patroller.png
  modified:
    - src/levels/level-05.js
    - src/levels/level-07.js
    - src/levels/level-08.js
decisions:
  - "All patrollers + the level-05 mover placed WALK-REACHED after a resolved blocker (not near a jump-gap landing) — the empirically-required recipe for browser-boot's waypoint driver. The first-cut placements (patrollers near descent-landings) failed the no-softlock gate on all three levels; the walk-reached redo passes."
  - "Density honors the biome-pair rhythm: intense-EVEN 08 carries 3 motion entities (1 mover + 2 wraiths); calm-ODD 05/07 carry 2 (1 mover + 1 wraith) — lighter, never mover-free. With plan 07, ALL 8 LEVELS now carry motion."
  - "level-07 + level-08 movers are no-softlock-safe + reachability-green + real-player-mountable but do NOT headless-ride the interactive audit (att=5). This is the KNOWN ~80%/run headless mover-mount flakiness, not a defect: the SAME audit run also failed to ride the SHIPPED level-01/02/04 movers. Per the efficiency mandate, documented and moved on — browser-boot (no-softlock) + reachability are the gates that matter."
metrics:
  duration: ~heavy (motion authoring + no-softlock waypoint-driver diagnosis and retune)
  tasks: 2
  files: 3
  completed: 2026-07-19
status: complete
---

# Phase 36 Plan 08: World Motion & Ambient Life — Final Rollout to Levels 05/07/08 Summary

Rolled FULL motion (moving platforms + patrollers + ambient flicker + the MECH-05
alcove-linked torch) onto the final three levels — 05 (cemetery, calm odd), 07 (castle,
calm odd, staircase) and 08 (castle, intense even, switchback) — tuned to the calm/intense
biome-pair rhythm and authored to the LEVEL-DESIGN §6a/§6b no-softlock rules. **With plan 07,
all 8 levels now carry motion.** The load-bearing **no-softlock proof (`browser-boot`) passes**
— all 8 levels drive spawn→goal with motion live. All four hovering-wraith patrollers cross in
the interactive audit (att=1) and the level-05 mover rides (att=1); the level-07 and level-08
movers are no-softlock-safe but do not headless-mount (the known driver flakiness — see
Deviations). Static geometry stays byte-frozen; all motion is add-only via the freeze-excluded
`geometry.movers` / `geometry.patrollers` keys plus top-level `props`.

## Motion placed (per level, tuned to the calm/intense rhythm)

### level-05 — cemetery, CALM odd, LIGHT (1 mover + 1 patroller)
- **Mover M0** `{x1:4980, y1:250, x2:5070, y2:250, w:130}` — a coffin-slab ferry over the WIDE
  basin far-end floor F6 (4780..5280), clear of the PL5→F6 drop landing and the F6→OC1
  out-climb takeoff (right extent 5200 < OC1@5310). Behind checkpoint@4800; solid F6 under it
  (WAIT-not-death). **Rides the audit att=1.**
- **Patroller P0** `{x1:1150..1250, y:214}` — a crypt wraith over the FLAT F1 lane AFTER the
  door@1080, WALK-REACHED (no jump-gap landing at its x). Respawns to checkpoint@860 (door
  stays cleared — no re-gate). **Crosses att=1.**
- **MECH-05:** level-05 carried NO light, so this places its FIRST — `prop-cemetery-lantern`@(360,125)
  below the alcove@(360,80) (dist 45 < LINK_DIST 96), auto-linked + flickering.

### level-07 — castle, CALM odd, LIGHT (1 mover + 1 patroller); STAIRCASE intact
- **Mover M0** `{x1:4490, y1:250, x2:4530, y2:250, w:60}` — a rampart-slab ferry over W4
  (4420..4900), placed in the flat run BEFORE spike@4650 (right extent 4590 clears the spike-jump
  arc). Behind checkpoint@4440; solid W4 under it. Headless-ride limitation documented below.
- **Patroller P0** `{x1:450..550, y:214}` — a castle wraith over the FLAT W1 spawn-wall lane
  AFTER the door@380, WALK-REACHED. Respawns to checkpoint@96 (door stays cleared). **Crosses att=1.**
- **MECH-05:** the level's existing candles all sit far from the alcove@(690,184), so a
  `prop-castle-candles`@(690,233) is placed on CU1 below the alcove (dist 49), auto-linked + flickering.

### level-08 — castle, INTENSE even, HEAVIER (1 mover + 2 patrollers); SWITCHBACK intact
- **Mover M0** `{x1:6560, y1:250, x2:6600, y2:250, w:60}` — a castle-slab ferry over the WIDE F8
  throne-keep run-up (6440..7120), clear of the F7→F8 landing and the K1 climb takeoff (right
  extent 6660, 20px left of K1@6680). Behind checkpoint@6480; solid F8 under it. Headless-ride
  limitation documented below.
- **Patroller P0** `{x1:960..1060, y:214}` — a castle wraith over the FLAT F1 lane AFTER the
  door@880, WALK-REACHED. Respawns to checkpoint@660 (door stays cleared). **Crosses att=1.**
- **Patroller P1** `{x1:3560..3660, y:214}` — a castle wraith over the FLAT F4 lane AFTER the
  enemy@3500, WALK-REACHED. Respawns to checkpoint@3430 (enemy stays cleared). **Crosses att=1.**
- **MECH-05:** a `prop-castle-candles`@(320,233) on PA below the alcove@(320,184) (dist 49),
  auto-linked + flickering. The switchback keep tiers stay pristine.

### Ambient flicker + MECH-05 (no descriptor field)
All light-source props flicker via 36-04's sprite-name selector (`/lantern|lamp|candle/`), and
the light nearest each `secretAlcove` (within LINK_DIST 96) auto-tags `alcove-light` and
brightens on discovery — NO descriptor field. Each of the three levels now has a light within
45–49px of its alcove (the cemetery lantern for 05, castle candles for 07/08).

## Checkpoint coverage (§6b rule 1 — a checkpoint before every mover)
- level-05 mover@4980 → checkpoint@4800 (F6). Patroller → checkpoint@860 (F1).
- level-07 mover@4490 → checkpoint@4440 (W4). Patroller → checkpoint@96 (W1).
- level-08 mover@6560 → checkpoint@6480 (F8). Patrollers → checkpoint@660 (F1), @3430 (F4).

Every mover sits over solid floor (no killing pit) with WAIT-not-death recovery.

## Verification (gates)

| Gate | Result |
|---|---|
| `node scripts/validate-levels.mjs` | **PASS** — mover-reachability **WARN** (green, never HARD-FAIL) for all 3 movers; 0 HARD-FAIL |
| `node scripts/check-geometry-frozen.mjs` | **PASS** — all 8 levels' static geometry byte-identical; motion added ONLY via freeze-excluded keys + top-level props |
| `bash scripts/check-safety.sh` | **PASS** — no timer/scheduler/punishment |
| `bash scripts/check-import-safety.sh` | **PASS** — a727c13 clean |
| `node scripts/check-assets-manifest.mjs` | **PASS** — 61 assets verified (incl. prop-cemetery-lantern) |
| `node scripts/browser-boot.mjs` | **PASS** — title→select→all 8 levels drive spawn→goal with motion LIVE (the deterministic **NO-SOFTLOCK** proof; 05/07/08 reach goal with motion live) |
| `node scripts/audit-phase21-mechanics.mjs` | **PARTIAL (expected)** — all 4 wraith patrollers cross (att=1); level-05 mover rides (att=1); level-07 + level-08 movers do NOT headless-mount (att=5) — the known driver flakiness (the SAME run also failed shipped level-01/02/04 movers) |
| `node scripts/screenshot-phase36-motion.mjs level-05 level-07 level-08` | **PASS** — 9 non-empty evidence PNGs |

**No-softlock proof (the load-bearing SC):** `browser-boot` reaches every goal on all 8 levels
with motion live. Mover-reachability is green (WARN) for all movers; every mover sits behind a
checkpoint over solid floor (WAIT-not-death, no killing pit).

## Deviations from Plan

### [Rule 1 — no-softlock correctness] All patrollers + movers relocated to WALK-REACHED positions
- **Found during:** browser-boot verification (the load-bearing no-softlock gate).
- **Issue:** the first-cut placements put patrollers over floors just past a jump-GAP descent-landing
  (level-05 PL1→F2, level-07 DD1→W2, level-08 BC→F3). browser-boot's `deriveEncounters` now emits
  movers/patrollers as drive WAYPOINTS, so the driver drives to each entity's x1. Targeting an x at a
  jump-gap landing makes the driver's final leg a fragile precise-landing that "never landed," which
  death-spiralled and stranded the whole level — **browser-boot FAILED far-end-unreachable on all
  three (05 stalled x890, 07 x2205, 08 x2513)** while the no-motion baseline PASSED.
- **Fix:** every patroller (and the level-05 mover) moved onto a FLAT floor reached by pure WALKING
  after a resolved door/enemy — the driver walks straight onto it (no precise-landing). This mirrors
  the shipped level-01/06 patroller recipe (respawn-before-a-cleared-blocker is not a re-gate). The
  level-07/08 movers were pulled clear of their spike-jump / climb-takeoff arcs. **browser-boot then
  PASSED all 8 levels; the audit crosses all 4 patrollers att=1 and rides the level-05 mover att=1.**
- **Files:** level-05.js, level-07.js, level-08.js. **Commits:** 4ef79e7, 93ef35d, 7df6eb3.

### [efficiency-mandate — documented driver limitation] level-07 + level-08 movers do not headless-ride
- **Found during:** the interactive audit.
- **Issue:** the level-07 mover@4490 (W4) and level-08 mover@6560 (F8) do not mount in the interactive
  audit (att=5, triggered=false). This is the KNOWN ~80%/run headless mover-mount flakiness explicitly
  called out in the plan's efficiency mandate — **the SAME audit run also failed to ride the SHIPPED
  level-01@3420, level-02@7040, and level-04@4500 movers**, which are proven mountable. It is a
  headless-driver artifact, not a game defect.
- **Resolution:** both movers are reachability-GREEN (WARN), WAIT-not-death (§6b), behind a checkpoint
  over solid floor, and trivially mountable by a real player (a rise-70 ledge). Per the efficiency
  mandate ("do NOT spend more than ~2 attempts … DOCUMENT and MOVE ON — no-softlock + browser-boot are
  the gates that matter"), documented and moved on. browser-boot reaches every goal with the movers live.

## Known Stubs
None. All motion is real, in-engine-verified data: movers render the tiled ledge with the dt
raised-cosine carry (level-05 ridden by the audit; all three mount in isolation / for a real player),
patrollers render the walk-anim skeleton and are crossed by the audit (att=1). No placeholder/empty data.

## Threat Flags
None. Authoring level data + placing decorative props adds no network endpoint, auth path, file
access, or trust boundary. The register's mitigations hold: T-36-17 (no-softlock — every mover
reachability-green, WAIT-not-death, no killing pit, browser-boot reaches every goal), T-36-18
(check-geometry-frozen PASS — motion add-only via excluded keys), T-36-19 (L7 staircase vs L8
switchback authored distinctly; motion layouts differ), T-36-SC (zero new deps).

## Self-Check: PASSED
- Modified files exist on disk (level-05.js, level-07.js, level-08.js) with the finalized motion.
- Commits exist: 7df6eb3 (level-08), 4ef79e7 (level-05), 93ef35d (level-07), 43e45ee (screenshots).
- 9 motion-shot PNGs exist on disk (level-05/07/08 spawn + motion + patroller).
- Gates green: validate-levels (mover-reachability WARN), check-geometry-frozen, check-safety,
  check-import-safety, check-assets-manifest, browser-boot (NO-SOFTLOCK, all 8 goals reached with
  motion live), screenshots; the audit crosses all 4 patrollers att=1 + rides the level-05 mover
  att=1 (level-07/08 movers documented as headless-driver flakiness).
