---
phase: 24-fix-lengthen-levels-1-4
plan: 02
subsystem: level-descriptor-data
tags: [levels, validator, level-extension]
dependency-graph:
  requires: []
  provides: [level-02-extension-geometry]
  affects: [smoke-progress-level-02-block, interactive-audit-level-02]
tech-stack:
  added: []
  patterns: [pure-data-append, checkpoint-before-hazard-formula, explicit-bounds-camera-clamp]
key-files:
  created: []
  modified:
    - src/levels/level-02.js
decisions:
  - "level-02 required zero structural defect fixes (23-FINDINGS.md's Post-Plan Correction confirms level-02 has none) — this plan was extension-only, unlike Plan 24-01's fix+extend combination"
  - "level-02 extended +1480px (2800->4280 floor extent, goal 2720->4200) via pure appends: 2 floors, 2 platforms, 5 coins, 1 spike, 1 mathGate, 2 checkpoints — zero edits inside the original 0..2800 kid-validated geometry"
  - "bounds.right manually bumped 2800->4280 — level-02 carries an explicit bounds field that src/scenes/game.js uses AS-IS (level.bounds ?? {...} short-circuits the dynamic computation), unlike level-01's dynamically-derived camera clamp"
  - "enemies/collectZones/answerPickupSlots kept empty in the extension — level-02's established 'no enemies' identity is a load-bearing signal per 24-PATTERNS.md, not an omission to fill in"
metrics:
  duration: 10min
  completed: 2026-07-06
status: complete
---

# Phase 24 Plan 02: Fix & Lengthen Level-02 Summary

Extended level-02's floor extent from 2800px to 4280px (+1480px / 52.9% longer), appending all new geometry strictly after the existing kid-validated content, and manually bumped the level's explicit `bounds.right` field to match. Level-02 had zero known structural defects going into this plan, so no VALID-04 fix work applied — this was a pure LVL-01 extension plan.

## What Was Built

**Task 1 — Extension geometry skeleton + bounds bump:**
- Appended 2 new floor runs: `{x:2960, w:560}` and `{x:3680, w:600}`, extending the level's floor extent to 4280px.
- Appended 2 new bridging platforms: `{x:2800, y:250, w:128, h:24}` and `{x:3520, y:250, w:112, h:24}`, each a 70px rise from its neighboring floor's end — well inside the calibrated 88.331px `maxRise`.
- Moved `goal.x` from 2720 to 4200 (80px buffer before floor-5's end at 4280, matching the original level's own 80px goal-to-floor-end convention).
- Bumped `bounds.right` from 2800 to 4280, keeping `left`/`top`/`bottom` unchanged — required because level-02's explicit `bounds` field is consumed AS-IS by `src/scenes/game.js`'s `level.bounds ?? {...dynamic}` short-circuit; unlike level-01 (no bounds field, dynamic derivation), the camera/parallax would clip before the new content without this manual bump.

**Task 2 — Extension content (coins, hazard, mechanic, checkpoints):**
- Appended 5 new coins (x:2840 through x:3900) matching level-02's existing ~1-per-280px density and alternating-height style.
- Appended 1 new spike at x:3200 on the new floor-4 run.
- Appended 1 new mathGate at x:3760 on the new floor-5 run (3rd mathGate instance — reuses the existing mechanic type rather than introducing new variety, per CONTEXT.md's "reuse only mechanic types already present" rule).
- Appended 2 new checkpoints at x:3120 (80px before the new spike) and x:3680 (80px before the new mathGate), both at the universal `FLOOR_Y - 48` y.
- Left `enemies: []`, `collectZones: []`, `answerPickupSlots: []` untouched — level-02's established "no enemies/collectZones" identity is preserved exactly.

## Verification Evidence

`node scripts/validate-levels.mjs` after both tasks:
```
level-02 | over-hole | PASS | (no floating barriers)
level-02 | spawn-goal | WARN | goal x:4200 reached via floor-5 (marginRatio=1.000)
level-02 | gap-width | WARN | gap 520..700 between floor-0 and floor-1 (marginRatio=1.000)
level-02 | gap-width | WARN | gap 1260..1420 between floor-1 and floor-2 (marginRatio=1.000)
level-02 | gap-width | WARN | gap 2020..2180 between floor-2 and floor-3 (marginRatio=1.000)
level-02 | gap-width | WARN | gap 2800..2960 between floor-3 and floor-4 (marginRatio=1.000)
level-02 | gap-width | WARN | gap 3520..3680 between floor-4 and floor-5 (marginRatio=1.000)
level-02 | mechanic-reachability | PASS | doors x:1540..1572 on floor-2 reachable from spawn
level-02 | mechanic-reachability | PASS | mathGates x:420..452 on floor-0 reachable from spawn
level-02 | mechanic-reachability | PASS | mathGates x:1100..1132 on floor-1 reachable from spawn
level-02 | mechanic-reachability | PASS | mathGates x:3760..3792 on floor-5 reachable from spawn
```
Zero `level-02` HARD-FAIL rows — WARN rows are the expected/non-blocking gap-width and spawn-goal rows (marginRatio=1.000 precision limitation documented in Phase 23).

Final geometry counts confirmed via direct import: `coins.length=15`, `spikes.length=5`, `mathGates.length=3`, `checkpoints.length=10`, `floors.length=6`, `platforms.length=9`, `enemies.length=0`, `collectZones.length=0`, `goal.x=4200`, `bounds.right=4280` — all match the plan's success criteria exactly.

`git diff` (against the pre-plan commit) on `src/levels/level-02.js` confirmed pure appends to floors/platforms/coins/spikes/mathGates/checkpoints plus the `goal.x` move and `bounds.right` value change — zero edits inside the original 0..2800 extent.

The overall `validate-levels.mjs` registry run still reports 5 hard-failures, but they all belong to `level-04` (its known pre-existing defects, out of scope for this plan — handled by a later plan in this phase). `level-01` and `level-02` both print zero HARD-FAIL rows.

`node scripts/smoke-progress.mjs` is expected to fail on its level-02 geometry-pinning block after this plan's edits, as explicitly documented in the plan's `<verification>` section — this fixture is intentionally not re-baselined until Plan 24-05 (Wave 2). This is a documented interim state, not a defect.

## Deviations from Plan

None — plan executed exactly as written. Both tasks' acceptance criteria and done conditions were met without requiring any auto-fix, blocking-issue resolution, or architectural deviation.

## Known Stubs

None.

## Threat Flags

None — this plan only edits static level-descriptor geometry data (`src/levels/level-02.js`), consumed by the offline single-player client and Node-side validator tooling. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries were introduced, consistent with the plan's own threat model (both STRIDE entries dispositioned `accept`, no new threat surface identified during implementation).

## Self-Check: PASSED
