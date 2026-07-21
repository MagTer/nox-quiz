---
phase: 36-world-motion-ambient-life
plan: 10
subsystem: motion-art
tags: [art, pixel-art, pillow-bake, gothicvania, light-source, will-o-wisp, patroller, walk-anim, pink-gate, MOT-01, MOT-03, MECH-05]
requires:
  - phase: 35-02
    provides: "scripts/build-art-assets.py::bake_prop + build_props() prop-bake pipeline (crop -> tighten bbox -> retint-where-measured -> save; NO scale, NO _remap_luminance) + the isolated-bake / terrain-frozen discipline"
  - phase: 35-05
    provides: "crops-before-new-CC0 precedent (a light-source biome fully covered from already-vendored, already-licensed packs) + the town no-pink hue-conform-pass precedent"
provides:
  - "assets/props/swamp-lantern.png — swamp biome LIGHT (a bog will-o'-wisp: one Patreon Fire-Skull frame, native, 0.0% pink)"
  - "assets/props/cemetery-lantern.png — cemetery biome LIGHT (a grave candle: Church altar-candle-on-plinth crop, native, 2.55% pink)"
  - "assets/patroller.png — a distinct cosmetic patroller sprite (Cemetery 8-frame skeleton WALK cycle, 352x52 sliceX 8, no-pink hue-conform pass -> 0.0% pink)"
  - "src/assets-manifest.js — +prop-swamp-lantern, +prop-cemetery-lantern (kind:prop), +patroller (kind:sprite-anim); 58 -> 61 assets"
  - "src/main.js — loadSprite('patroller', { anims:{walk} }); CONFIG.PATROLLER?.WALK_SPEED optional-chained (36-03 defines it later)"
  - "level-01 props += one prop-swamp-lantern near its alcove; level-06 props += one prop-cemetery-lantern near its alcove; geometry byte-frozen"
affects: [36-03, 36-04, 36-05, 36-06]
tech-stack:
  added: []
  patterns:
    - "Light-source-from-crops: no vendored pack ships a lantern/brazier, so (crops-before-new-CC0) each biome light is a single expressive crop from an already-licensed pack — swamp = a Fire-Skull frame (bog will-o'-wisp), cemetery = the Church altar-candle (grave candle) — measured under the pink gate, baked native, zero new CC0"
    - "No-pink hue-conform pass applied to a CREATURE sheet: the Cemetery skeleton's low-brightness maroon SHADOW band reads 25.3% in the 211-239 pink gate (the same HSV low-brightness hue-instability artifact allowlisted for player-swamphunter, NOT genuine pink); hue_shift_band(211,239,-40) shifts only those dark in-band pixels -> 0.0% with the visible warm-bone silhouette preserved (town-prop retint precedent, applied where measured over threshold)"
    - "Optional-chained forward config: main.js reads CONFIG.PATROLLER?.WALK_SPEED ?? CONFIG.ENEMY.IDLE_SPEED so this Wave-1 art plan lands BEFORE 36-03 adds CONFIG.PATROLLER without throwing at load (a727c13-safe, future-compatible)"
    - "Isolated bake (importlib exec_module of build_props + build_patroller, __main__ skipped) with a sha256 snapshot of assets/tiles + assets/parallax proving the terrain/parallax atlases are byte-identical — same 35-02/35-05 deviation"
key-files:
  created:
    - assets/props/swamp-lantern.png
    - assets/props/cemetery-lantern.png
    - assets/patroller.png
  modified:
    - scripts/build-art-assets.py
    - src/assets-manifest.js
    - src/main.js
    - src/levels/level-01.js
    - src/levels/level-06.js
    - CREDITS.md
key-decisions:
  - "NO vendored pack ships a lantern/brazier/lamp prop (verified: the cemetery objects.png/tileset.png carry only tombstones/trees/crosses/a hooded figure/a column; the swamp props are reed/vine/fern; the only lamp is town-street-lamp). Rather than source new CC0, followed the castle crops-before-new-CC0 precedent and cropped a biome-coherent LIGHT from an already-licensed pack for each biome: swamp = a single frame of the Patreon Fire-Skull sheet (a floating flaming skull = the classic bog will-o'-wisp; its red/orange flame hue sits well outside the 211-239 pink band -> 0.0% native); cemetery = the Church tileset's altar-candle-on-plinth crop (a standing warm-flame gothic candle = a grave candle; 2.55% native, under gate). Zero new CC0, zero new assets/LICENSES/ file — both source packs are already CC0-licensed and credited."
  - "Patroller = the Cemetery pack's 8-frame skeleton WALK cycle (skeleton-1..8.png, 44x52). A hunched, shambling BIPED humanoid is maximally distinct from the quadruped, idle-only enemy-hellhound math-blocker (the plan's explicit first suggestion), and 8 frames give a rich walk telegraph (SC1). Baked native size, NEAREST identity paste (frames already share one 44x52 canvas with feet planted at the bottom edge, so a direct paste keeps the walk bob/registration intact)."
  - "Retinted the patroller, did NOT allowlist it. The skeleton's maroon bone SHADOW measured 25.3% pink — the same low-brightness hue-instability artifact that player-swamphunter is ALLOWLISTED for. Chose the plan's prescribed remedy (retint where over threshold) over an allowlist edit: hue_shift_band(211,239,-40) drops it to 0.0% while leaving the visible warm-bone appearance unchanged (the shifted pixels are near-black shadow noise; a render before/after is indistinguishable). This keeps the gate infra (pink_scan.py) untouched and follows the town-prop no-pink conform precedent."
  - "cemetery-lantern reuses the SAME Church altar-candle crop rect (247,88,273,117) as the existing castle-candle-stand prop — a shared gothic grave/altar light motif, biome-coherent for a cemetery. Two identical-source PNGs under two keys is intentional (distinct biome placement), not a bug."
  - "Lanterns placed in the TOP-LEVEL props[] arrays only (never inside geometry): level-01 swamp-lantern at (320,242) on the spawn floor directly below secretAlcove@(320,184); level-06 cemetery-lantern at (360,95) on the EL0 entry tier below secretAlcove@(360,50). check-geometry-frozen stays byte-identical. Both are visual-only (collider-free, negative-z) so neither can occlude a route or block the EL0 climb."
patterns-established:
  - "Biome light-source via an expressive single crop from an already-licensed pack when no literal lantern object exists"
  - "No-pink hue-conform pass on a creature's low-brightness shadow band (retint where measured over threshold, appearance-preserving)"
metrics:
  duration: ~50min
  tasks: 3
  files: 9
  completed: 2026-07-18
status: complete
---

# Phase 36 Plan 10: Motion Art Assets Summary

Baked the two light-source props and the one distinct walk-anim patroller the whole
Phase-36 motion track depends on, and placed a light in each of the two trial levels
BEFORE the trial runs. The swamp (levels 01/02) and cemetery (levels 05/06) biomes —
which shipped NO light while town/castle did — now each have a baked, license-clean,
no-pink light for MOT-03 flicker and MECH-05 alcove-lighting to target. A shambling
biped skeleton patroller (a real 8-frame walk cycle, visually distinct from the
quadruped idle-only hellhound) is baked, registered, and loaded under key `patroller`
so 36-03's `CONFIG.PATROLLER.SPRITE` can point at a real key and 36-05 can place a
readable, telegraphed hazard.

## What was built

### Task 1 — Swamp + cemetery light-source props (commit a1046f8)
- `scripts/build-art-assets.py` `build_props()`: two `bake_prop(...)` calls.
  - **swamp-lantern** ← Patreon `Fire-Skull-Files/PNG/fire-skull.png` frame 0
    (`crop=(0,0,96,112)`, tightened to 68×78) — a bog will-o'-wisp. **0.0% pink native.**
  - **cemetery-lantern** ← Church `ENVIRONMENT/tileset.png` `crop=(247,88,273,117)`
    (15×25) — a grave candle. **2.55% pink native** (under the 8% gate).
- `src/assets-manifest.js`: +`prop-swamp-lantern`, +`prop-cemetery-lantern` (kind:"prop");
  header counts 58→61, prop tally 20→22.
- `CREDITS.md`: the two outputs traced onto their already-CC0 Patreon / Church pack rows.

### Task 2 — Distinct walk-anim patroller (commit a1046f8)
- `scripts/build-art-assets.py` new `build_patroller()`: composites the Cemetery pack's
  8-frame skeleton walk (`skeleton-1..8.png`, 44×52) into `assets/patroller.png`
  (352×52, sliceX 8), then a `hue_shift_band(211,239,-40)` no-pink conform pass
  (**25.3% → 0.0% pink**, appearance preserved). Wired into `__main__`.
- `src/assets-manifest.js`: +`patroller` (kind:"sprite-anim"); sprite-anim 3→4.
- `src/main.js`: `loadSprite("patroller", …, { sliceX: 8, anims: { walk: { 0→7, loop,
  speed: CONFIG.PATROLLER?.WALK_SPEED ?? CONFIG.ENEMY.IDLE_SPEED } } })`. The `walk`
  name is what build.js's patroller loop plays via `foe.play("walk")` (36-03). The
  hellhound load is unchanged.

### Task 3 — Place a light in each trial level (commit becd2e5)
- `src/levels/level-01.js`: appended one `{ sprite: "prop-swamp-lantern", x: 320,
  y: 242, layer: "surface" }` to the top-level `props[]` — on the spawn floor directly
  below secretAlcove@(320,184).
- `src/levels/level-06.js`: appended one `{ sprite: "prop-cemetery-lantern", x: 360,
  y: 95, layer: "surface" }` — on the EL0 entry tier below secretAlcove@(360,50).
- Geometry objects byte-untouched (props are top-level, outside `geometry`).

## Baked keys → source + license

| Manifest key | File | Source (already-vendored CC0) | Bake | Pink | License |
|---|---|---|---|---|---|
| `prop-swamp-lantern` | swamp-lantern.png | Patreon `Fire-Skull-Files/PNG/fire-skull.png` frame 0 | crop (0,0,96,112) → tight 68×78, native | 0.0% | gothicvania-patreon.txt |
| `prop-cemetery-lantern` | cemetery-lantern.png | Church `ENVIRONMENT/tileset.png` (247,88,273,117) | crop, native | 2.55% | gothicvania-church.txt |
| `patroller` | patroller.png | Cemetery `Sprites/skeleton/skeleton-1..8.png` | 8-frame paste + hue_shift_band(211,239,-40) | 25.3% → 0.0% | gothicvania-cemetery.txt |

**No new CC0 sourced** — every source is an already-vendored, already-licensed CC0 pack,
so no `assets/LICENSES/` file was added (castle crops-before-new-CC0 precedent). CREDITS
rows for the three packs were extended to list the new outputs.

**Patroller has a real `walk` anim:** confirmed — `assets/patroller.png` is an 8-frame
skeleton WALK cycle (not the pack's separate `skeleton-rise` anim), loaded in main.js as
`anims: { walk: { from: 0, to: 7, loop: true } }`, the exact name build.js plays.

## Verification (gates)

| Gate | Result |
|---|---|
| `node scripts/check-assets-manifest.mjs` | **PASS** — 61 assets verified on disk |
| `bash scripts/check-pink-gate.sh` | **PASS** — no baked asset over threshold (only the pre-existing allowlisted player-swamphunter.png reported) |
| `bash scripts/check-terrain-atlas.sh` | **PASS** — all SAW/GAP/SLAB/GREY checks green (atlases untouched) |
| terrain/parallax sha256 before/after isolated bake | **byte-identical** |
| `node scripts/check-geometry-frozen.mjs` | **PASS** — all 8 levels' geometry byte-identical |
| `node scripts/validate-levels.mjs` | **PASS** — 0 HARD-FAIL |
| `bash scripts/check-safety.sh` | **PASS** |
| `bash scripts/check-import-safety.sh` | **PASS** (a727c13 — patroller load is inside the post-init section; CONFIG.PATROLLER optional-chained) |
| `node scripts/browser-boot.mjs` | **PASS** — title → select → all 8 levels loaded with no runtime errors (lanterns render, patroller sprite loads) |

## Deviations from Plan

### Adapted (Rule 3 — blocking)

**1. [Rule 3 - Blocking] Optional-chained CONFIG.PATROLLER in main.js**
- **Found during:** Task 2.
- **Issue:** The plan's load snippet reads `CONFIG.PATROLLER.WALK_SPEED ?? CONFIG.ENEMY.IDLE_SPEED`, but `CONFIG.PATROLLER` does not exist yet — it is added in 36-03, and this is a Wave-1 (no-dependency) art plan that lands BEFORE it. `CONFIG.PATROLLER.WALK_SPEED` would throw "cannot read property of undefined" at module load and blank the game.
- **Fix:** Used `CONFIG.PATROLLER?.WALK_SPEED ?? CONFIG.ENEMY.IDLE_SPEED` — falls back to the enemy idle rate until 36-03 defines `WALK_SPEED`, then future-compatible. browser-boot confirms all levels boot.
- **Files modified:** `src/main.js`.

**2. [Rule 3 - Scope adaptation] Ran the bake in ISOLATION, not the full script**
- **Found during:** Task 1 verify.
- **Issue:** The plan's verify literal is `python3 scripts/build-art-assets.py`; the full
  `__main__` regenerates every committed biome atlas/parallax asset. Running it risks an
  unintended rewrite of frozen terrain art the terrain-atlas gate guards.
- **Fix:** Baked only `build_patroller()` + `build_props()` via an isolated `importlib`
  `exec_module` (the documented 35-02/35-05 deviation), with a sha256 snapshot of
  `assets/tiles/` + `assets/parallax/` before/after proving them byte-identical;
  `check-terrain-atlas` green independently confirms it.
- **Files modified:** `scripts/build-art-assets.py` (bake code only).

### Design (board-faithful, documented)

**3. [Deviation - source availability] No vendored lantern/brazier exists → biome light from an expressive crop**
- The plan anticipated a lantern crop "if the swamp/cemetery packs carry one" and new CC0
  only as a fallback. Verified NO pack ships a literal lantern/brazier/lamp object. Rather
  than source new CC0 (the fallback), followed the castle crops-before-new-CC0 precedent:
  swamp light = a Fire-Skull frame (bog will-o'-wisp), cemetery light = the Church
  altar-candle crop (grave candle). Both biome-coherent, gate-clean, zero new CC0.

**4. [Deviation - no-pink conform] Retinted the patroller creature's shadow band**
- The plan's creature examples were baked native (hellhound/player). The Cemetery skeleton
  trips the pink gate at 25.3% via the low-brightness maroon-shadow hue artifact (the same
  one player-swamphunter is allowlisted for). Per the plan's "retint where over threshold"
  mandate, applied `hue_shift_band(211,239,-40)` → 0.0%, appearance preserved. Chose retint
  over an allowlist edit to keep the gate infra untouched.

## Known Stubs

None. All three assets are real baked art on disk, manifest-declared, main.js-loaded, and
pink-gated; the two lanterns are placed in level-01/06. The `patroller` sprite is loaded
but not yet PLACED — placement (with `CONFIG.PATROLLER`) is 36-03/36-05, by design (this
plan bakes the art prerequisites only).

## Threat Flags

None. No new network endpoint, auth path, or trust boundary — offline static art baking +
visual-only, collider-free prop placement. T-36-22/23/24 mitigations all hold (pink +
terrain-atlas re-run green; distinct biped-walk vs quadruple-idle silhouette; lanterns are
top-level props with geometry byte-frozen).

## Self-Check: PASSED

- Created files exist: `assets/props/swamp-lantern.png`, `assets/props/cemetery-lantern.png`, `assets/patroller.png` — all present on disk (3/3).
- Commits exist in git log: a1046f8 (art bake + registration + load), becd2e5 (level placement).
- Wiring verified: 3 new manifest keys present; `prop-swamp-lantern` in level-01 props (line 253); `prop-cemetery-lantern` in level-06 props (line 215); `loadSprite("patroller", …)` in main.js (line 146).
- All gates green: check-assets-manifest (61), check-pink-gate, check-terrain-atlas, check-geometry-frozen, validate-levels, check-safety, check-import-safety, browser-boot.
