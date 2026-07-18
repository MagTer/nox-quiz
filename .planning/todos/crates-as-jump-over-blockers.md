# Idea: turn some Phase-35 crates into jump-over blockers

**Captured:** 2026-07-18 (user, mid Phase-36 setup)
**Status:** backlog / for later — NOT in current scope
**Likely home:** Phase 36 candidate, or a small follow-on gameplay slice

## The idea

Phase 35 added decorative props the player currently walks straight through. Some — the **crates**
in particular — are a good size to become **light platforming obstacles**: give them a small solid
collider so the player has to **jump over** them. Turns "set dressing" into gentle gameplay texture.

## Why it's not a trivial change (record for whoever plans it)

- Props today are **collider-free by design** (the whole Phase-35 legibility guarantee: props render
  at negative z and never affect gameplay). Making a crate a blocker is a **gameplay/geometry-class
  change**, NOT a byte-frozen prop tweak.
- A crate-blocker adds a solid collider → it MUST go through the **validator** (`validate-levels.mjs`
  + the mover-aware reachability rule) and the **jump-envelope** rules in `docs/LEVEL-DESIGN.md`
  (crate height must be clearly jump-over-able at the calibrated jump arc; no crate should sit where
  it creates an impossible gap, a headroom trap, or a **softlock**).
- It would break the Phase-35 `check-geometry-frozen` baseline if crates move into the `geometry`
  arrays — so decide the representation: a new **collidable-prop / obstacle** entity class (own tag +
  small `area()/body({isStatic})`, own validator coverage) rather than folding into `geometry`.
- Placement is a real design pass (which crates, which levels, density) + a human look — same
  discipline as hazard placement.

## Suggested framing

A dedicated small slice: "collidable crate obstacles" — pick a jump-over-safe crate height, a new
obstacle entity class with validator + audit coverage, place a few per level off the forced-fail
lines, human sign-off. Could ride alongside Phase 36's motion work (both are "world becomes
interactive") or land as its own quick phase after.
