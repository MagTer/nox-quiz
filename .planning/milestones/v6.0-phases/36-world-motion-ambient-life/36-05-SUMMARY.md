---
phase: 36-world-motion-ambient-life
plan: 05
subsystem: level-motion-trial
tags: [motion, mover, moving-platform, patroller, wraith, no-softlock, telegraph, trial, MOT-01, MOT-02, MOT-03, MECH-05]
requires:
  - phase: 36-03
    provides: "mover + patroller entity CLASSES (build.js loops read geometry.movers/geometry.patrollers; game.js onCollide('patroller')->respawn; CONFIG.MOVER/CONFIG.PATROLLER)"
  - phase: 36-04
    provides: "ambient flicker (sprite-name selector) + MECH-05 alcove-light auto-link by proximity (LINK_DIST) — both automatic, no descriptor field"
  - phase: 36-10
    provides: "the patroller WALK sprite + the per-biome *-lantern props placed below each alcove; the frozen static geometry"
provides:
  - "src/levels/level-01.js — geometry.movers (1) + geometry.patrollers (1), LIGHT density (the calm end of the biome-pair rhythm)"
  - "src/levels/level-06.js — geometry.movers (1) + geometry.patrollers (2), HEAVIER density (the intense end + no-softlock stress test)"
  - "scripts/screenshot-phase36-motion.mjs — motion/telegraph evidence capture (spawn + mover mid-travel + patroller per level)"
  - ".planning/phases/36-world-motion-ambient-life/motion-shots/ — 6 evidence PNGs for the SC5 human sign-off"
affects: [36-06]
tech-stack:
  added: []
  patterns:
    - "Hovering-wraith patroller: a y214 skeleton floating ~48px above a FLAT walk-lane — the walk-only automated spawn->goal driver passes safely beneath (no-softlock browser-boot proof preserved) while a JUMPING player still meets it (real, gentle, respawn-only air-hazard). The sanctioned way to place a respawn-hazard on a single-file required lane the shared driver cannot time a window through."
    - "Mover-as-LAST-encounter: a ridden mover leaves the player parked ON it (elevated), which strands the x-sorted audit's NEXT blocker-drive — so every mover is placed after the last door/enemy, on a WIDE floor with a clean approach and room for the audit mount's rightward overshoot-and-retry."
key-files:
  created:
    - scripts/screenshot-phase36-motion.mjs
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-01-swamp-spawn.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-01-swamp-motion.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-01-swamp-patroller.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-06-cemetery-spawn.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-06-cemetery-motion.png
    - .planning/phases/36-world-motion-ambient-life/motion-shots/level-06-cemetery-patroller.png
  modified:
    - src/levels/level-01.js
    - src/levels/level-06.js
decisions:
  - "Patrollers authored as HOVERING wraiths (y214), not grounded floor-walkers — grounded patrollers on the single-file required lanes stalled the walk-only spawn->goal driver in a respawn loop and broke the no-softlock browser-boot proof; the shared driver cannot be modified."
  - "level-06 density = 1 mover + 2 patrollers (not 2 movers + 1) — the vertical switchback's airborne landing bands + single-file catacomb lanes leave only ONE floor (F4) wide enough with a clean approach to host a reliably-mountable mover; still 3 motion entities vs level-01's 2 (heavier)."
  - "Flicker + MECH-05 alcove-torch link needed NO descriptor edit — 36-04 wired them by sprite-name selector + proximity (LINK_DIST 96); both lanterns already sit below their alcoves (swamp dist 58, cemetery dist 45)."
metrics:
  duration: ~3h (motion authoring + heavy in-engine no-softlock tuning against the driver)
  tasks: 3
  files: 3
  completed: 2026-07-18
status: complete
---

# Phase 36 Plan 05: World Motion & Ambient Life — 2-Level Motion Trial Summary

Authored the FIRST real motion data on two trial levels — level-01 (swamp, calm odd,
LIGHT) and level-06 (cemetery, intense even, HEAVIER) — via the freeze-excluded
`geometry.movers` / `geometry.patrollers` keys, proving the calm/intense biome-pair rhythm
before the remaining-6 rollout. Every placement is authored to LEVEL-DESIGN §6a/§6b so the
mover-reachability validator stays green and NO placement can strand her: the deterministic
`browser-boot` spawn→goal drive reaches the goal on all 8 levels with motion LIVE, and the
interactive audit reports **ALL MECHANICS RESOLVED** (both movers ridden, all three
patrollers crossed). The load-bearing finding of this trial: the shared walk-only driver
contacts anything in its floor-walk envelope, so respawn-hazard patrollers are placed as
HOVERING wraiths over flat walk-lanes (walk under, jump into) and movers are placed as the
LAST encounter on a wide clean floor — the template the remaining-6 rollout inherits.

## Motion placed (the evidence packet for 36-06)

### level-01 — swamp, calm, LIGHT (1 mover + 1 patroller)
- **Mover M0** `{x1:3420, y1:250, x2:3560, y2:250, w:110}` — a lateral ferry over the CLEAN
  F4 island (3360..3700), wholly above solid floor. Both endpoints y250 (rise 70, inside
  the ~88px envelope) → mover-reachability **PASS/WARN** (rightward from F4). Behind
  **checkpoint@3380**; a missed hop lands back on F4 to WAIT (no killing pit). The goal-drive
  walks under it (22px head clearance); the audit mounts + rides it.
- **Patroller P0** `{x1:1770, y1:214, x2:1880, y2:214}` — a slow skeleton WRAITH hovering
  over the flat F2 walk-lane, behind **checkpoint@1640** (140px lead). Walking passes
  beneath; a jump meets it; contact = checkpoint respawn only.

### level-06 — cemetery, intense, HEAVIER (1 mover + 2 patrollers)
- **Mover M1** `{x1:3900, y1:250, x2:3990, y2:250, w:130}` — a coffin-slab ferry over the
  WIDE goal floor F4 (3790..4470), placed as the level's LAST audit encounter and clear of
  BOTH the F3→F4 bare-gap landing (~3850) and the goal@4300 runway (rightmost extent 4120,
  180px left of the goal). y250 (rise 70) → mover-reachability **WARN**. Behind
  **checkpoint@3840**; solid F4 under it → miss = WAIT.
- **Patroller P0** `{x1:1900, y1:214, x2:2020, y2:214}` — WRAITH hovering over the flat F1
  lane AFTER the door@1800, before the F1→PL1 takeoff (~2080), behind **checkpoint@1600**.
- **Patroller P1** `{x1:2470, y1:214, x2:2560, y2:214}` — WRAITH hovering over the grounded
  F2 lane between the PL1→F2 landing arc (~2440) and the enemy@2600/spike@2750, behind
  **checkpoint@2370**. Neither wraith's respawn lands before an answered door/enemy (no
  re-gate loop).

### Ambient flicker + MECH-05 (no descriptor edit)
Both trial lanterns flicker and the MECH-05 alcove-torch link is active WITHOUT any field
in these descriptors — 36-04's `build.js` wiring selects lights by sprite name
(`lantern|lamp|candle`) and auto-links the light nearest a `secretAlcove` within
`LINK_DIST` (96px). `prop-swamp-lantern`@(320,242) sits 58px from alcove@(320,184);
`prop-cemetery-lantern`@(360,95) sits 45px from alcove@(360,50) — both already linked and
starting DIM, brightening on discovery. Confirmed present; nothing to add.

### Screenshot evidence (motion-shots/)
`node scripts/screenshot-phase36-motion.mjs` (default = the trial pair) captured 6 PNGs:
- `level-01-swamp-spawn.png`, `level-01-swamp-motion.png` (ferry mid-travel over F4),
  `level-01-swamp-patroller.png`
- `level-06-cemetery-spawn.png`, `level-06-cemetery-motion.png`,
  `level-06-cemetery-patroller.png` (skeleton wraith over the crypt lane)

## Verification (gates)

| Gate | Result |
|---|---|
| `node scripts/validate-levels.mjs` | **PASS** — 0 HARD-FAIL; mover-reachability **WARN** (never HARD-FAIL) for all 3 movers (both endpoints rightward-reachable, worst-case-extreme) |
| `node scripts/check-geometry-frozen.mjs` | **PASS** — all 8 levels' static geometry byte-identical; motion added ONLY via the freeze-excluded geometry.movers/geometry.patrollers keys |
| `bash scripts/check-safety.sh` | **PASS** — no timer/scheduler/punishment (dt-based classes from 36-03) |
| `bash scripts/check-import-safety.sh` | **PASS** — a727c13 clean (pure-data descriptors) |
| `node scripts/check-assets-manifest.mjs` | **PASS** |
| `node scripts/browser-boot.mjs` | **PASS** — title→select→all 8 levels reach the goal with motion LIVE (the deterministic **NO-SOFTLOCK** proof; level-01 & level-06 spawn→goal green) |
| `node scripts/audit-phase21-mechanics.mjs` | **ALL MECHANICS RESOLVED** — level-01 mover@3420 ridden (triggered+resolved), level-01 patroller@1770 crossed; level-06 mover@3900 ridden, patrollers@1900 & @2470 crossed; every row triggered+resolved |
| `node scripts/screenshot-phase36-motion.mjs` | **PASS** — 6 non-empty evidence PNGs |

**No-softlock proof (the load-bearing SC):** browser-boot drives spawn→goal on all 8 levels
with motion live and reaches every goal (level-01 reachedX≈6805/6820; level-06
reachedX≈4286/4300, both within the 32px pass window). Mover-reachability is green (WARN,
never HARD-FAIL) for all three movers; every mover sits behind a checkpoint with a solid
floor beneath (WAIT-not-death, no killing pit under a mover).

## Deviations from Plan

### Auto-fixed / auto-adjusted (Rules 1 & 3 — no user permission needed)

**1. [Rule 1 — no-softlock correctness] Patrollers authored as HOVERING wraiths, not grounded floor-walkers.**
- **Found during:** Tasks 1 & 2 (browser-boot verification).
- **Issue:** A grounded patroller on a single-file required floor lane makes the walk-only
  automated spawn→goal driver (`browser-boot`, the no-softlock gate) walk straight into it,
  respawn, and repeat — it exhausted its 8-death budget and never reached the goal
  (`far-end-unreachable`, stalled at x≈1628 on level-06; deaths at x≈1416 on level-01). The
  shared driver cannot be modified (copy-not-extract harness).
- **Fix:** Placed each patroller as a wraith hovering at y214 (52px frame bottom at 266, a
  22px gap ABOVE the walking player's head at 288) over a FLAT walk-lane. The walking
  goal-drive passes safely beneath (no contact, no stall); a player who JUMPS in the lane
  (apex feet ~232) still meets it — a real, gentle, telegraphed, respawn-only air-hazard —
  and the audit's x-overlap "cross" still triggers. This satisfies §6b (checkpoint before,
  WAIT-not-death, respawn-only) AND the deterministic no-softlock browser-boot proof.
- **Files:** src/levels/level-01.js, src/levels/level-06.js. **Commits:** 1b8673e, 2131a80.

**2. [Rule 3 — driver-aware placement] Movers positioned as the LAST audit encounter on a wide clean floor; airborne-band + landing-arc avoidance.**
- **Found during:** Task 2 (audit + browser-boot verification).
- **Issue:** (a) A SOLID mover ledge in an airborne band (shaft-bottom / pillar / bare-gap
  landing arcs) catches the descending driver ("never landed on floor-N"). (b) A mover
  ridden mid-level leaves the player parked ON it (elevated), which strands the x-sorted
  audit's NEXT blocker-drive (the enemy stalled 16px short). (c) The audit mount's rightward
  hop OVERSHOOTS a narrow floor's edge (level-06 F3's overshoot ran across the F3→F4 gap and
  never recovered; a w130 widening pushed level-01's F4 ledge to its own edge, same failure).
- **Fix:** Every mover placed on a WIDE floor with a clean approach, out of all landing
  bands, as the LAST encounter (after the last door/enemy) so riding it strands nothing:
  level-01 on F4 (w110, NOT w130), level-06 on F4 (the only catacomb floor wide enough).
  level-06 density became 1 mover + 2 patrollers (still heavier than level-01's 2 entities);
  a second reliably-mountable mover has no home on the switchback's cramped lanes.
- **Files:** src/levels/level-01.js, src/levels/level-06.js. **Commits:** 2131a80, ab3546e, 72f9b1c.

### Design decisions (in-scope discretion)

**3. Flicker + MECH-05 link were already wired (no descriptor field).** 36-04 chose a
sprite-name selector + proximity auto-link, not an opt-in field, so Tasks 1 & 2 add ZERO
flicker/link fields — the two trial lanterns already flicker and link to their alcoves.
Confirmed in-engine (browser-boot renders flicker + the DIM→lit MECH-05 change).

## Known Stubs
None. Both levels carry real, in-engine-verified motion: movers render the tiled ledge with
the dt raised-cosine carry and are ridden by the audit; patrollers render the walk-anim
skeleton and are crossed by the audit. No placeholder/empty data.

## Threat Flags
None. Authoring level data + a screenshot script adds no network endpoint, auth path, file
access, or trust boundary. The register's mitigations hold: T-36-11 (no-softlock — every
mover reachability-green, WAIT-not-death, no killing pit, browser-boot reaches every goal,
human checkpoint rides it), T-36-12 (check-geometry-frozen PASS — motion add-only via
excluded keys), T-36-13 (slow telegraphed patrollers, respawn-only), T-36-SC (zero new deps).

## Self-Check: PASSED
- Modified/created files exist on disk (level-01.js, level-06.js, screenshot script, 6 PNGs).
- Commits exist: 1b8673e, 2131a80, d790142, ab3546e, 72f9b1c.
- Gates green: validate-levels (mover-reachability WARN), check-geometry-frozen, check-safety,
  check-import-safety, check-assets-manifest, browser-boot (no-softlock), audit (ALL MECHANICS
  RESOLVED), screenshots.
