---
created: 2026-07-07T16:32:00.000Z
title: Fix unreachable pickups/ledges and level-07/08 end-climb repetition
area: level-design
resolves_phase: 34
files:
  - src/levels/level-05.js
  - src/levels/level-06.js
  - src/levels/level-07.js
  - src/levels/level-08.js
  - docs/LEVEL-DESIGN.md
---

## Problem

Human playtest during Phase 25's phase-level UAT (2026-07-07), verbatim report:

> "I have checked all the levels. There are issues, but the game is playable through
> all 8 levels. Some coins are not reachable, some ledges are not reachable and level
> 7/8 raising of the ledges at the end is basically a copy of eachother. But all of
> that can be fixed later. it is playable."

Full context: `.planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-UAT.md`
and `25-VERIFICATION.md`'s "Human UAT Resolution" section.

Three distinct issues, no specific level numbers or coordinates given yet:

1. **Some pickups ("coins") are unreachable.** Likely refers to the
   `answerPickupSlots`/`collectZones` MECH-03 mechanic (the game has no literal "coin"
   entity — this is almost certainly the player's informal term for the collectible
   answer pickups). Could also be `secretAlcove` XP bonuses, given the separate
   discoverability concerns already raised about that mechanic (see
   `2026-07-07-reconsider-secret-alcove-mechanic-discoverability-and-value.md`) —
   worth ruling in/out during triage.
2. **Some ledges are unreachable.** Platform/floor geometry that looks reachable but
   isn't, in the level 5-8 content specifically (the four levels new to Phase 25).
3. **Level-07 and level-08's end-climb verticality sections are "basically a copy of
   each other."** Not a functional bug — a content-variety/design concern. Both levels
   were built with the same verticality pattern (per Phase 25's Wave 2 plans); worth a
   design pass for differentiation once reachability issues are triaged.

The human explicitly accepted this as deferred, non-blocking — the game is playable
start-to-goal on all 8 levels (confirmed separately by the automated interactive audit:
36/36 encounters `triggered:true`, zero `HARD-FAIL` from `validate-levels.mjs`). This
todo exists so the report isn't lost, not because anything is currently broken enough
to block a phase.

## Solution

TBD. Suggested triage approach for whoever picks this up:

1. Walk levels 5-8 with `?debug=1` to see all colliders/pickup slots/alcove markers at
   once, cross-referencing against each level's own `geometry` literals.
2. Cross-check `node scripts/validate-levels.mjs`'s WARN-tier rows for levels 5-8 —
   WARN means "structurally valid but worth a second look," which is exactly the kind
   of "technically reachable but doesn't feel reachable" gap a human would notice and
   automation would pass.
3. For the "unreachable" reports specifically: distinguish "actually impossible to
   reach" (a real defect, should become a HARD-FAIL in the validator if the validator
   isn't already catching it) from "reachable but the required path isn't obvious"
   (a level-design/telegraphing issue, not a hard bug).
4. For level-07/08 similarity: this is a design/content decision, not a code fix —
   needs someone to look at both levels' verticality sections side by side and decide
   what differentiation (different platform arrangement, different pacing, different
   visual treatment once Phase 26's per-level theming lands) is worth adding.

Natural slot: could go before or after Phase 26 (rebrand doesn't block this, and
per-level theming in Phase 26 might make level-07/08 visually distinct enough to
soften the "copy of each other" complaint even without a geometry change) — but
before Phase 28's final interactive sign-off, since that's the milestone's last
verification checkpoint.
