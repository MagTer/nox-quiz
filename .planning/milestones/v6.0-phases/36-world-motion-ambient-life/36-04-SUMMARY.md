---
plan: 36-04
status: complete
requirements: [MOT-03, MECH-05]
date: 2026-07-18
---

# Plan 36-04: Ambient Animation + MECH-05 Alcove Torch — Summary

**Tasks:** 2/2 complete. (Executor hit a session limit after writing the final MECH-05 wiring; the
orchestrator verified the uncommitted wiring, ran the gates, and committed it.)

## Commits

- `d877989` feat(36-04): CONFIG.AMBIENT + dt-sine flicker on light-source props
- `1bc557e` feat(36-04): add one-shot onDiscover hook to the secretAlcove seam
- (this closeout) feat(36-04): wire MECH-05 persistent alcove light + goal-unlock pop (game.js + enemy.js comment fix)

## What shipped

### MOT-03 — ambient animation
- `CONFIG.AMBIENT` tunables (no magic numbers): `DIM 0.4`, `ALCOVE_MS 500`, `UNLOCK_SCALE 1.3`, `UNLOCK_MS 260`, flicker params.
- **Flicker** on every light-source prop (all biomes now have one after 36-10): dt-sine flame flicker, `opacity = flick * litLevel`. Pure dt-based loop — no scheduler.
- **Goal unlock pop**: on goal reach, a single self-cleaning easeOutQuad scale tween grows the `"goalflag"` to `UNLOCK_SCALE` via a sin arc then settles to 1 (`tween().onEnd` restores neutral). Cosmetic; the `"goal"` collider is untouched; fire-once via the existing `goalReached` latch.

### MECH-05 — persistent alcove-linked ambient change (positive-only)
- `buildLevel` tags the light-source prop nearest a secret alcove `"alcove-light"` and starts it DIM (`litLevel = CONFIG.AMBIENT.DIM`); its flicker rides that dim baseline.
- `lightAmbient()` (scene body, a727c13-safe) tweens every `"alcove-light"` `litLevel` DIM→1 and **leaves it there** (no reverse, no scheduler). Single-flight: an in-flight brighten is cancelled before re-driving (handle stored ON the object — no module-level state, anti-leak). onSceneLeave cancels any in-flight brighten so a torn-down prop is never written.
- **Persistence is DERIVED**, not stored: lit-on-entry fires `if (progress.hasSecretFound(level.id)) lightAmbient()` — a level whose secret was found in a prior run renders its light already lit on re-entry (mirrors the derived-unlock convention). A fresh level stays dim until `onDiscover` fires during play.
- Wired via the new `onDiscover: () => lightAmbient()` callback on the secretAlcove seam (fires once, only on a genuinely new secret; never opens a challenge).
- **enemy.js**: comment-only fix — the header formerly mis-tagged the defeat-enemy math-blocker as "MECH-05" (requirement-ID drift); corrected to point MECH-05 at the alcove ambient change. Behavior unchanged.

## Verification (gates)

- check-safety — PASS (dt-sine + tween().onEnd only; no wait/loop/lifespan/setTimeout)
- check-import-safety — PASS (engine refs inside function bodies; a727c13)
- validate-levels — PASS (0 HARD-FAIL)
- check-geometry-frozen — PASS (all 8 byte-identical; ambient reads existing props/entities, no geometry edits)
- browser-boot — PASS (all 8 levels boot with flicker + MECH-05 + goal pop, no runtime errors)
- Executor-reported MECH-05 proof: light dim (0.4) on fresh entry → brightens to 1 on alcove discovery → lit-on-entry derived from `hasSecretFound`.

## Notes

- Movers/patrollers remain inert on shipped levels (the trial 36-05 authors the first real motion data).
