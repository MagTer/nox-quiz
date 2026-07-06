---
phase: 24-fix-lengthen-levels-1-4
plan: 01
subsystem: level-descriptor-data
tags: [levels, validator, structural-fix, level-extension]
dependency-graph:
  requires: []
  provides: [level-01-fixed-geometry, level-01-extension-geometry]
  affects: [smoke-progress-level-01-block, interactive-audit-level-01]
tech-stack:
  added: []
  patterns: [pure-data-append, checkpoint-before-hazard-formula, dynamic-camera-bounds]
key-files:
  created: []
  modified:
    - src/levels/level-01.js
decisions:
  - "level-01's 2 over-hole mathGates repositioned onto nearest solid floor edge (x600->528, x1300->1360), not the floor reshaped to chase them, per CONTEXT.md's locked 'reposition the gate, not the floor' rule"
  - "level-01 extended +1400px (2240->3640 floor extent, goal 2160->3560) via pure appends: 2 floors, 2 platforms, 6 coins, 1 spike, 1 mathGate, 2 checkpoints — zero edits inside the original 0..2240 kid-validated geometry beyond the 2 authorized gate x-values"
  - "No bounds field added to level-01 — src/scenes/game.js derives its camera clamp dynamically from geometry extent (Math.max over floors/platforms/goal), confirmed by 24-RESEARCH.md's direct source read"
metrics:
  duration: 12min
  completed: 2026-07-06
status: complete
---

# Phase 24 Plan 01: Fix & Lengthen Level-01 Summary

Fixed level-01's 2 known over-hole mathGate defects and extended the level's floor extent from 2240px to 3640px (+1400px / 62.5% longer), appending all new geometry strictly after the existing kid-validated content.

## What Was Built

**Task 1 — Structural defect fix + extension skeleton:**
- Repositioned `mathGates[0]` from x:600 to x:528 (footprint 528..560, fully inside floor-0's 0..560 span) — fixes the VALID-04 over-hole defect.
- Repositioned `mathGates[1]` from x:1300 to x:1360 (footprint 1360..1392, fully inside floor-2's 1360..2240 span, before the door at 1400) — fixes the second VALID-04 over-hole defect.
- Appended 2 new floor runs: `{x:2400, w:480}` and `{x:3040, w:600}`, extending the level to 3640px.
- Appended 2 new bridging platforms: `{x:2240, y:250, w:128, h:24}` and `{x:2880, y:250, w:112, h:24}`, each a 70px rise from its neighboring floor's end — well inside the calibrated 88.331px `maxRise`.
- Moved `goal.x` from 2160 to 3560 (80px buffer before floor-4's end at 3640, matching the original level's own 80px goal-to-floor-end convention).
- No `bounds` field added — confirmed via research that `src/scenes/game.js` derives level-01's camera clamp dynamically from geometry extent when `level.bounds` is absent.

**Task 2 — Extension content (coins, hazard, mechanic, checkpoints):**
- Appended 6 new coins (x:2280 through x:3400) following the existing top-left-anchor 32x32 sprite convention and alternating-height arc style.
- Appended 1 new spike at x:2640 on the new floor-3 run.
- Appended 1 new mathGate at x:3120 on the new floor-4 run (3rd mathGate instance — reuses the existing mechanic type rather than introducing new variety, satisfying 24-RESEARCH.md's Open Question 1 recommendation for audit coverage).
- Appended 2 new checkpoints at x:2560 (80px before the new spike) and x:3040 (80px before the new mathGate), both at the universal `FLOOR_Y - 48` y.

## Verification Evidence

`node scripts/validate-levels.mjs` after both tasks:
```
level-01 | over-hole | PASS | (no floating barriers)
level-01 | spawn-goal | WARN | goal x:3560 reached via floor-4 (marginRatio=1.000)
level-01 | gap-width | WARN | gap 560..720 ... (marginRatio=1.000)
level-01 | gap-width | WARN | gap 1200..1360 ... (marginRatio=1.000)
level-01 | gap-width | WARN | gap 2240..2400 ... (marginRatio=1.000)
level-01 | gap-width | WARN | gap 2880..3040 ... (marginRatio=1.000)
level-01 | mechanic-reachability | PASS | doors x:1400..1432 on floor-2 reachable from spawn
level-01 | mechanic-reachability | PASS | mathGates x:528..560 on floor-0 reachable from spawn
level-01 | mechanic-reachability | PASS | mathGates x:1360..1392 on floor-2 reachable from spawn
level-01 | mechanic-reachability | PASS | mathGates x:3120..3152 on floor-4 reachable from spawn
level-01 | mechanic-reachability | PASS | enemies x:1000..1032 on floor-1 reachable from spawn
level-01 | mechanic-reachability | PASS | collectZones x:300..364 on floor-0 reachable from spawn
```
Zero `level-01` HARD-FAIL rows — all previously-failing rows (2 over-hole, 2 mechanic-reachability) now PASS; WARN rows are the expected/non-blocking gap-width and spawn-goal rows (marginRatio=1.000 precision limitation documented in Phase 23).

Final geometry counts confirmed via direct import: `coins.length=16`, `spikes.length=4`, `mathGates.length=3`, `checkpoints.length=6`, `floors.length=5`, `platforms.length=6`, `goal.x=3560` — all match the plan's success criteria exactly.

`git diff` on `src/levels/level-01.js` confirmed pure appends plus the 2 authorized mathGate x-value changes — zero edits inside the original 0..2240 extent beyond those 2 gate repositions.

The overall `validate-levels.mjs` registry run still reports failures, but they all belong to `level-04` (its known pre-existing defects, out of scope for this plan — handled by a later plan in this phase). `level-03` and `level-01` both print zero HARD-FAIL rows.

`node scripts/smoke-progress.mjs` fails on the level-01 geometry-pinning block, as explicitly expected and documented in the plan's `<verification>` section — this fixture is intentionally not re-baselined until Plan 24-05 (Wave 2). This is a documented interim state, not a defect.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' acceptance criteria and done conditions were met without requiring any auto-fix, blocking-issue resolution, or architectural deviation.

## Known Stubs

None.

## Threat Flags

None — this plan only edits static level-descriptor geometry data (`src/levels/level-01.js`), consumed by the offline single-player client and Node-side validator tooling. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced, consistent with the plan's own threat model (both STRIDE entries dispositioned `accept`, no new threat surface identified during implementation).

## Self-Check: PASSED
