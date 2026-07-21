---
phase: 33-player-entity-animation
plan: 05
subsystem: verification-and-signoff
tags: [gate-suite, human-verify, art-parity, terrain-atlas, checkpoint]

# Dependency graph
requires:
  - phase: 33-player-entity-animation
    provides: "Plans 33-01..33-04 fully merged — baked door/math-gate art, sprite/anim registrations, 16x32 collider lock + fall/land states, math-gate/enemy visual swap"
provides:
  - "Full 9-command gate suite green (exit 0) on the fully-merged Phase 33 tree"
  - "Genuine, verbatim-quoted human sign-off superseding the v4.1 player-art lock (ART-04/ART-05 closed)"
  - "scripts/screenshot-phase33-terrain.mjs — the project's first in-engine rendered-pixel check (closes the ART-PARITY-STEERING.md gate hole for terrain)"
  - "Terrain atlas bake corrected: native-resolution, native-color 16x32 tile cells"
affects: [34, 35]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "screenshot-phase33-terrain.mjs copies screenshot-phase26.mjs's server/guard/save-seed skeleton by hand, per the deliberate Playwright-duplication convention (CLAUDE.md)"
    - "Terrain frames are NATIVE 16x32 tile cells — never scaled, never palette-remapped (asserted in _bake_biome_atlas)"

key-files:
  created:
    - scripts/screenshot-phase33-terrain.mjs
    - .planning/phases/33-player-entity-animation/terrain-shots/ (8 in-engine level shots)
  modified:
    - scripts/build-art-assets.py
    - assets/tiles/atlas-{swamp,town,cemetery,castle}.png
    - src/config.js
---

# Phase 33 Plan 05 — Closing Gate Suite + Player-Art Sign-off

## Task 1 — Full consolidated gate suite: GREEN

All nine gates green in one chained run against the fully-merged Phase 33 tree, **exit 0**:

| Gate | Result |
|------|--------|
| check-gate.sh | PASS |
| check-safety.sh | PASS |
| check-import-safety.sh | PASS |
| check-progress.sh | PASS (incl. smoke-progress) |
| validate-levels.mjs | PASS — zero HARD-FAILs, 8/8 levels |
| browser-boot.mjs | PASS — title → select → all levels, no runtime errors |
| audit-phase21-mechanics.mjs | PASS — **24/24 encounters triggered AND resolved** across all 8 levels |
| check-pink-gate.sh | PASS |
| check-assets-manifest.mjs | PASS — 37 assets, 0 MISSING |

Re-run and re-verified green after every fix below.

## Task 2 — Human sign-off: GRANTED, after two rejections

**This checkpoint was NOT rubber-stamped.** The project config carries `auto_advance: true` / `mode: yolo`, which the execute-phase workflow would normally use to auto-approve a `checkpoint:human-verify` gate. That was deliberately overridden per the standing precedent (STATE.md; Phases 25/27/28/31) and this plan's own threat T-33-08. The gate was presented to the human, who **rejected it twice** before approving — vindicating the precedent entirely.

### Round 1 — REJECTED. Verbatim:

> "Some coins are not reachable
> the animation of the dog is a bit fast to be realistic
> the floor / platform/ledges are not aligned to the agreed design. they have sort of a saw pattern that the target design does not."

### Round 2 — REJECTED. Verbatim:

> "Castle and Town shows a clear improvement. cemetery has a very wide grey backdrop to the new improved floor. The flor is a small part of a placeholder grey area that the player walks on. swamp has no improvement at all."

### Round 3 — APPROVED. Verbatim:

> "approved, continue with phase 34"

Plus, on the pink gate, verbatim:

> "dont listen too much to the pink gate. its ok if there is some pink in there.. the design is already approved."

## What the rejections found (3 real bugs, all invisible to the gates)

**1. Saw pattern (commit `27bbeb4`).** `build.js` stamps the atlas cap frame once per 16px column, so the cap's top silhouette repeats forever. Town's cap was a **roof triangle**, castle's an **arch peak** — both selected as `islands()[0]` (largest island), copying styleboard.py's `swamp()` recipe without checking what that island *is*. For swamp the biggest island is the ground block; for town it's a roof. Tiling a triangle produces a sawtooth. Re-pointed both at real floor tiles; derived each fill from its cap's own material (castle's old fill was a *gold-capped* brick, repeating gold lips through the underground mass).

**2. Latent bake landmine (same commit).** The shipped atlases did not match what the script produced. WR-01 (31-REVIEW.md) had replaced the bake's stretch-to-fill with an aspect-preserving fit+pad — a **sprite** rule ("don't squash a character") misapplied to a **tile**, which must fill its cell. Nobody re-baked, so assets kept the stretch while the script drifted. Anyone running the asset bake would have regressed all four biomes into thin bottom-anchored strips.

**3. Grey static ground (commit `f7bfc73`) — the big one.** Two bugs upstream of the crop choice:
   - `_remap_luminance` collapsed every terrain tile onto an achromatic grey ramp (it discards hue by design). **This is the same bug already removed from the PARALLAX bake in `caebfae`** — it was simply never removed from the TERRAIN bake, so backgrounds regained full color while the ground the player walks on stayed grey. styleboard.py (normative per ART-PARITY-STEERING.md) never remaps its ground.
   - Crops were squashed into the 16px cell: swamp's ground tile is 80px wide (5× compression), cemetery's 96px (6×) — which is literally what turned rock/moss/grass/skulls into grey static.

   Fixed by taking **native 16×32 tile cells** (every Gothicvania tileset here is on a 16px grid): 1:1 pixels, zero scaling, no remap. `_bake_biome_atlas` now asserts 16×32 so a scaled rect cannot creep back in. `_remap_luminance` is untouched and still used by the Kenney-silhouette sprite bakes it was written for.

**4. Hell hound too fast (commit `44f773f`).** `ENEMY.IDLE_SPEED` was 8fps — between the player's own idle (6fps) and run (10fps), so it read as sprinting in place. Now 5fps (1.2s loop). Tunable-only; blocker collider byte-unchanged.

## Deferred (correctly, not dropped)

**Unreachable coins** — not a Phase 33 defect. Already scoped as **LVL-01, owned by Phase 34** (Level Quality Pass), which has the Phase-30 extended validator to gate geometry fixes. Carried forward to Phase 34, not fixed ad hoc here.

## The load-bearing lesson

**Every one of these bugs passed all nine gates.** The suite was green while the floors were sawtoothed *and* while the ground was grey static. ART-PARITY-STEERING.md predicted exactly this: no gate looks at rendered pixels. This plan therefore adds `scripts/screenshot-phase33-terrain.mjs` (in-engine spawn shots, all 8 levels / 4 biomes, committed under the phase dir) as the first real rendered-pixel check.

Two of the three art bugs were **the same bug the parallax already had and fixed** — the remap, and the "abstract asset-pipeline instead of reproducing the approved scene" drift. The terrain pipeline never received the parallax's fixes. **Phase 35 (Biome Re-dress) must not assume the art pipeline is sound simply because gates are green** — the recommended `check-biome-coverage.mjs` pixel gate is now clearly worth building.

## Self-Check: PASSED

- Full 9-gate chain re-verified green (exit 0) after the final commit.
- Bake verified idempotent; script and shipped assets now agree.
- In-engine screenshots re-captured across all 4 biomes and reviewed by the human.
- Human sign-off genuine, quoted verbatim above, superseding the v4.1 player-art lock.
