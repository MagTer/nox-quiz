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
