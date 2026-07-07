---
status: resolved
phase: 25-levels-5-8-difficulty-ramp-select-grid
source: [25-VERIFICATION.md]
started: 2026-07-07T16:24:54Z
updated: 2026-07-07T16:32:00Z
---

## Current Test

None — human playtest complete, disposition recorded below.

## Tests

### 1. Secret alcove walkthrough — levels 02 through 08
expected: |
  Serve the game over HTTP (`python3 -m http.server 8000` from repo root, `?debug=1`
  optional to see the invisible markers, re-confirm in a normal tab), enter each level,
  navigate to its `geometry.secretAlcove` coordinate, and touch it. HUD XP increments
  by exactly 5 on first touch; player never freezes; no challenge UI opens; a second
  touch does nothing further; the level still clears normally if the alcove is skipped.
result: |
  The human played through all 8 levels rather than narrowly re-testing just this item.
  No alcove-specific failure (freeze, missing XP, challenge UI opening) was reported.
  Real issues WERE reported, but they are level-geometry issues distinct from the
  alcove mechanic itself — see "Reported issues" below. Treated as accepted/no
  alcove-mechanism regression found, not as a clean per-alcove confirmation of all 7
  remaining coordinates individually.

### 2. 2×4 select-grid navigation feel + tile-state rendering
expected: |
  Unlock all 8 tiles via the documented localStorage seed, then exercise Left/Right
  (row-scoped wrap) and Up/Down (non-wrapping row-jump, same-or-nearest-column
  landing) live in a browser; visually confirm locked (grey)/unlocked (green)/cleared
  (blue) tile coloring across all 8 tiles. Matches CONTEXT.md's locked wrap semantics
  exactly; tile states are visually distinguishable.
result: |
  Not specifically itemized by the human — they navigated through all 8 levels via the
  select grid as part of the same playthrough and reported no navigation/rendering
  complaint. No explicit wrap-semantics or tile-color confirmation was given.

## Summary

total: 2
passed: 0
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

### Reported issues (human playtest, 2026-07-07T16:32:00Z, verbatim)

> "I have checked all the levels. There are issues, but the game is playable through
> all 8 levels. Some coins are not reachable, some ledges are not reachable and level
> 7/8 raising of the ledges at the end is basically a copy of eachother. But all of
> that can be fixed later. it is playable."

**Disposition: Accepted / deferred by explicit human decision — not a phase blocker.**
The human found real content issues during a genuine playthrough (not a rubber-stamp)
but explicitly judged the game playable end-to-end and chose to defer fixes rather
than block Phase 25 or re-open Wave 2 plans now. Captured as a new pending todo
(`.planning/todos/pending/2026-07-07-fix-unreachable-pickups-ledges-and-level-07-08-repetition.md`)
for future triage — likely candidates: `docs/LEVEL-DESIGN.md` reachability rules
against the actual shipped levels 5-8 geometry (the answerPickupSlots/collectZones
"coins", and platform/ledge placements), plus a design pass on level-07/08's
end-climb verticality section for more visual/structural variety.

No specific level numbers or coordinates were given — a future investigation should
start with `?debug=1` walkthroughs of levels 5-8 and cross-check against
`node scripts/validate-levels.mjs`'s WARN-tier rows (structurally valid but worth a
second look) before assuming anything is a HARD-FAIL-worthy defect.
