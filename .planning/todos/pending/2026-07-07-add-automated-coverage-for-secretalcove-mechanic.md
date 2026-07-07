---
created: 2026-07-07T16:00:00.000Z
title: Add automated reachability/trigger coverage for secretAlcove
area: testing
files:
  - scripts/lib/mechanic-drive.mjs
  - scripts/validate-levels.mjs
  - scripts/audit-phase21-mechanics.mjs
  - scripts/browser-boot.mjs
---

## Problem

Phase 25's code review (`.planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-REVIEW.md`,
findings WR-01/WR-06) confirmed that the `secretAlcove` mechanic — now shipped in all
8 levels — has zero automated reachability or trigger coverage in either project
verification harness:

- `scripts/lib/mechanic-drive.mjs`'s `deriveEncounters()` (shared by
  `browser-boot.mjs` and `audit-phase21-mechanics.mjs`) only enumerates `doors`,
  `mathGates`, `enemies`, and `collectZones` — never `geometry.secretAlcove`.
- `scripts/validate-levels.mjs`'s reachability check requires a barrier's x-span to be
  fully supported by a single floor run; secret alcoves sit in open space relative to
  a launch *platform*, with no floor-run association and no explicit "launch
  platform" field in the level-descriptor schema.

The code-fixer agent investigated fixing this directly during Phase 25's review-fix
pass (`25-REVIEW-FIX.md`) and deliberately skipped both findings rather than force a
mechanical patch: `secretAlcove.js` contractually never opens the shared challenge
panel, and the harness's `triggered` signal is defined purely as "challenge panel
opened" — naively wiring the alcove into `deriveEncounters()` with the existing
`renderChoices:false` shape would make `triggered` permanently false for every
alcove, which is worse than no coverage (a false-negative regression signal). Closing
this safely needs either a new detection path (e.g. polling XP/HUD state or watching
for the alcove object's `destroy()`) for the trigger side, and either a new
point-vs-jump-reach algorithm or a level-descriptor schema addition (explicit
launch-node reference) for the reachability side.

Currently the only verification any alcove placement gets is: (a) prose reasoning in
each level's own comments, (b) manual code review (25-REVIEW.md's WR-06 spot-checked
rise/x-span by inspection and found nothing obviously broken), and (c) partial human
walkthrough (level-01 only, confirmed in
`.planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-FINDINGS.md` section
(d) — levels 02-08 unverified by a human). A future edit to `build.js`'s alcove
wiring, or a new level's alcove placed at an unreachable position, would currently
pass every existing script cleanly.

## Solution

TBD — two separate sub-problems, likely two separate small plans:

1. **Trigger coverage:** add a detection path to `mechanic-drive.mjs` that doesn't
   rely on the challenge-panel-open signal — e.g. read progress/HUD XP state before
   and after approaching each alcove's coordinates, or watch for the tagged entity's
   removal from the scene graph.
2. **Reachability coverage:** either add an explicit launch-platform/node reference to
   each level's `secretAlcove` descriptor entries (schema change touching all 8
   levels) so `validate-levels.mjs` can run the existing jump-reach math against it,
   or write a standalone point-vs-jump-reach check that doesn't require a floor run.

Related: this mechanic's actual design/value is separately in question — see
`2026-07-07-reconsider-secret-alcove-mechanic-discoverability-and-value.md`. If that
review results in removing or substantially changing the mechanic, revisit whether
this coverage work is still worth doing first.

Natural slot: before or alongside Phase 28's full verification/interactive sign-off
pass, since VALID-03 there is explicitly meant to be the milestone's final proof
point.
