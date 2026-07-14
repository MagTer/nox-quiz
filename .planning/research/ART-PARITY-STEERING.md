# Art-Parity Steering — binding rules for all v6.0 visual work (Phases 34–38)

**Written 2026-07-12 by Fable 5 at the user's explicit request**, after three
rounds of biome-parallax regressions (commits `caebfae`, `78b7dd2`, `f6a386e`)
all traced to the same failure mode: implementing "backgrounds" as an abstract
asset-pipeline task instead of reproducing the *specific composed scenes* the
human approved. This doc exists to steer future (Sonnet-executed) planning and
implementation so that class of drift cannot recur.

## The one rule that matters

**`.planning/research/v6-scouting/styleboard.py` is the normative spec for how
every biome scene is built — not just inspiration.** For any art-touching task:
source file selection, crop windows, retint calls, base-canvas colors, layer
ordering, and bottom-at-360 alignment all come FROM the corresponding scene
function (`swamp()`, `town()`, `cemetery()`, `castle()`). If an implementation
choice differs from what that function does, the difference must be justified
in writing in the plan — silence means "match the board."

## Established facts (verified 2026-07-12, do not re-litigate)

1. **Far plates are full 640×360 opaque scenes.** `_bake_biome_far_plate()` in
   `scripts/build-art-assets.py` tiles the board's primary background to 640
   wide, bottom-anchors it, and `stretch_top`-fills the sky (swamp instead
   keeps its hand-picked `(30,32,30)` base above the art, exactly like the
   board). Never bake a background layer shorter than the viewport again.
2. **Mid/near layers keep native height and real RGBA transparency.**
   `_bake_biome_feature_layer()` never flattens to RGB. The runtime composites
   them over the far plate the same way the board's `alpha_composite` does.
3. **Single-plate boards get transparent placeholder layers** (town near,
   castle mid+near via `_bake_empty_feature_layer()`) — board parity beats
   invented extra layers. Phase 35/36 may add depth layers ONLY with a new
   human sign-off against the board.
4. **Never tile a multi-panel preview sheet.** `gothic-castle-background.png`
   and church `backgrounds.png` are discrete-vignette SHEETS with gutters; raw
   tiling produced the "odd bits and pieces" band. If a sheet must be used,
   crop ONE panel (islands/bbox), never the sheet.
5. **Runtime parallax is vertically screen-locked** (`src/parallax.js`): far
   plate top at view top, mid/near bottoms at view bottom — the boards' own
   `tile_x(..., bottom=360)` alignment, with real terrain covering the lowest
   band. This is what keeps levels 07/08 (bounds.top −360) fully covered at
   climb altitude. Do not reintroduce world-space Y anchors for backgrounds.
6. **Retints are the board's retints.** Town `(215, 255, −60)`, cemetery
   `(195, 245, −50)` — the same `hue_shift_band` calls the approved boards
   were rendered through. The pink gate validates the *output*; the retint is
   design, not gate-appeasement (see below).

## TERRAIN: the same failure modes, found again at the Phase 33 checkpoint (2026-07-14)

**This doc was written about parallax. The identical bugs were still live in the
TERRAIN bake** — because the parallax fixes were never carried across. A human
rejected the Phase 33 sign-off twice and found all of it; all 9 gates were green
throughout. Established facts, same standing as the list above:

7. **Terrain frames are NATIVE 16x32 tile cells — never scaled, never remapped.**
   Every Gothicvania tileset here is on a 16px grid, so a 16x32 window is two real
   source cells at 1:1 pixels. `_bake_biome_atlas()` now ASSERTS 16x32.
8. **`_remap_luminance()` must never touch terrain.** It maps every pixel onto a
   near-grey palette and discards hue *by design*. It was correctly dropped from
   the parallax bake in `caebfae` but lived on in the terrain bake — so the
   backgrounds regained full color while **the ground the player walks on stayed a
   grey placeholder** ("a placeholder grey area that the player walks on"). It
   remains correct for the flat Kenney-silhouette *sprite* bakes it was written for.
   Only terrain stops calling it.
9. **Never scale a terrain crop.** Swamp's ground tile is 80px wide and was squashed
   into the 16px cell (5x); cemetery's 96px (6x). That is what reduced moss, rock,
   grass and skulls to literal grey static.
10. **The cap frame's top row IS the walkable surface.** `build.js` stamps it at
    `pos(tx, runY)` where `runY` is the collider's top. A transparent top row floats
    the visible ground below the surface the player stands on. WR-01 (31-REVIEW.md)
    introduced exactly this by swapping stretch-to-fill for an aspect-preserving
    fit+bottom-pad — a SPRITE rule ("don't squash a character") misapplied to a TILE.
    It shipped undetected for a full phase **because nobody re-baked**: the assets kept
    the old behaviour while the script silently drifted. Re-running the bake would have
    regressed all four biomes.
11. **`islands()[0]` is NOT "the ground tile."** It is the largest island — which is
    the ground block only for swamp. Copying `styleboard.py`'s `swamp()` recipe blindly
    gave town a **roof triangle** and castle an **arch peak** as their ground caps. The
    cap repeats every 16px, so a triangle tiles into a **sawtooth** along every floor.
    Always tile a candidate cap and LOOK at it before committing.

### The hole is now partially closed by an actual gate

`bash scripts/check-terrain-atlas.sh` (+ `scripts/lib/terrain_scan.py`) is the repo's
FIRST rendered-pixel gate. It reads the committed PNGs — not the bake script, precisely
because those two silently diverged for a phase — and hard-fails SAW (jagged cap
silhouette), GREY (max chroma < 32; remapped atlases ceiling at 11, native art runs
76–135), GAP (transparent cap top row), and geometry drift. It is verified to FAIL on the
pre-fix atlases from git and PASS on the current ones. **Run it after any `assets/tiles/`
or `build-art-assets.py` change.**

`scripts/screenshot-phase33-terrain.mjs` captures in-engine spawn shots across all 8
levels / 4 biomes for human review — the gate proves the tile is sane, the screenshots
prove the *scene* is.

**Phase 35 (Biome Re-dress) must not assume the art pipeline is sound because gates are
green.** It was green through every bug above. The parallax gate hole (`check-biome-coverage.mjs`,
recommended below) is still open.

## Why the automated gates missed this (and what closes the hole)

All 9 gates check *mechanics, safety, and file existence* — none of them look
at the rendered image. A game whose every level is a black void passes the
whole suite. Until a rendered-pixels gate exists, **any task that touches
`assets/`, `scripts/build-art-assets.py`, `src/parallax.js`, or level visuals
MUST end with in-engine screenshots of each affected biome compared
side-by-side against the corresponding `style-board-*.png`** — attached to the
SUMMARY, not just described. For vertical levels (07/08), include a
climb-altitude shot, not only spawn. Recommended Phase 35 addition: a
`check-biome-coverage.mjs` gate that screenshots each biome at spawn and at
`bounds.top` altitude and fails if more than ~30% of pixels are within a small
delta of `#0a0a0a`.

## Sizing note for planners

Per the standing "Sonnet 5 executes this milestone" decision: art tasks must
name exact source paths, crop rects, and retint tuples in the PLAN (copied
from styleboard.py), never "select appropriate background art" — that
abstraction is where all three regressions came from.
