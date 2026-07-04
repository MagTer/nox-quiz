---
phase: 20-real-cc0-art-redo-human-sign-off
plan: 01
subsystem: assets
tags: [pillow, pil, kenney, cc0, pixel-art, palette-quantization]

requires:
  - phase: 18-art-animation-parallax
    provides: locked frame geometry (80x32/5-frame player, 80x16/5-frame ground), loadSprite contract, animation state machine
provides:
  - Real, licensed CC0 player sprite sheet (Kenney "Platformer Characters" Adventurer)
  - Real, licensed CC0 ground/platform tileset (Kenney "Pixel Platformer")
  - scripts/build-art-assets.py — reproducible sourcing/crop/scale/palette-remap pipeline
  - Corrected CREDITS.md + assets/LICENSES/player.txt + ground.txt
affects: [20-02, 20-03]

tech-stack:
  added: []
  patterns:
    - "Uniform-scale animation frame extraction: one shared scale factor derived from the tallest pose's content bbox, applied to every frame, to avoid visible size jitter between idle/run/jump"
    - "Luminance-ramp palette remap for narrow/dark target palettes: raw nearest-RGB quantization fails when the palette's own dynamic range is very narrow (10-42); normalizing source luminance to the palette's rank order preserves visible structure instead"

key-files:
  created:
    - scripts/build-art-assets.py
    - assets/_kenney-src/platformer-characters/ (5 poses + License.txt)
    - assets/_kenney-src/pixel-platformer/ (5 tiles + License.txt)
  modified:
    - assets/player.png
    - assets/tiles/ground.png
    - assets/LICENSES/player.txt
    - assets/LICENSES/ground.txt
    - CREDITS.md
    - scripts/generate-art-assets.py (docstring-only supersession note)

key-decisions:
  - "Corrected CONTEXT.md's Area 1 pack pick: 'Pixel Platformer' has no walk-cycle player frames (static blob mascots); substituted Kenney 'Platformer Characters' (Adventurer) for the player, kept 'Pixel Platformer' for ground/tileset exactly as CONTEXT.md specified"
  - "Added a luminance-ramp remap variant for ENVIRONMENT_PALETTE after discovering raw nearest-RGB quantization collapsed the ground tile to a near-flat single color (2 colors, 99% one shade) — caught by visually inspecting the output, not by the automated dimension-only check"
  - "Fixed an unused-palette-slot bug: Image.quantize's filler slots defaulted to (0,0,0), which could be selected as 'nearest' for dark pixels instead of the intended (0x0a,0x0a,0x0a) token; fixed by cycling the real palette into all 256 slots"

patterns-established:
  - "scripts/build-art-assets.py is the shipped art pipeline going forward; scripts/generate-art-assets.py stays only as a labeled dev/prototyping tool"

requirements-completed: [ART-05, ART-06, PROC-01]

coverage:
  - id: D1
    description: "Player idle/run/jump sprite sheet built from real Kenney CC0 source art at the locked 80x32/5-frame geometry, light-on-dark and visually distinct per pose"
    requirement: "ART-05"
    verification:
      - kind: unit
        ref: "python3 -c \"from PIL import Image; a=Image.open('assets/player.png'); assert a.size==(80,32)\""
        status: pass
      - kind: manual_procedural
        ref: "visual inspection this session — 6x zoom render confirmed 5 distinct recognizable poses, light-grey silhouette against black"
        status: pass
    human_judgment: true
    rationale: "Silhouette legibility against the actual #0a0a0a in-level background is a perceptual judgment — automated dimension/exists checks cannot confirm visual quality; full in-browser confirmation deferred to plan 20-03's human sign-off task"
  - id: D2
    description: "Ground/platform tileset built from real Kenney CC0 grass/dirt tiles at the locked 80x16/5-frame geometry with genuine material-transition detail (not per-pixel noise)"
    requirement: "ART-06"
    verification:
      - kind: unit
        ref: "python3 -c \"from PIL import Image; b=Image.open('assets/tiles/ground.png'); assert b.size==(80,16)\""
        status: pass
      - kind: manual_procedural
        ref: "visual inspection this session — first remap attempt collapsed to 2 colors/near-flat (defect caught and fixed); luminance-ramp remap produces 5 distinct locked-palette shades with visible top/body banding per frame"
        status: pass
    human_judgment: true
    rationale: "Seam/tiling quality across a real level is a perceptual judgment; full in-browser confirmation deferred to plan 20-03's human sign-off task"
  - id: D3
    description: "License proof files and CREDITS.md rows rewritten to cite real Kenney sources, matching existing rigor; corrective note added documenting Phase 18's mislabeling"
    requirement: "PROC-01"
    verification:
      - kind: other
        ref: "grep -qi CC0 assets/LICENSES/player.txt assets/LICENSES/ground.txt && grep -q kenney.nl/assets/platformer-characters assets/LICENSES/player.txt && grep -q kenney.nl/assets/pixel-platformer assets/LICENSES/ground.txt && grep -q Kenney CREDITS.md"
        status: pass
    human_judgment: false

duration: ~35min (across an interrupted + resumed session)
completed: 2026-07-04
status: complete
---

# Phase 20 Plan 01: Real Player + Ground Art Summary

**Real Kenney CC0 art (Platformer Characters Adventurer + Pixel Platformer grass/dirt tiles) replaces Phase 18's procedural placeholder player/ground sprites, via a new build-art-assets.py pipeline with a luminance-ramp palette remap fix.**

## Performance

- **Duration:** ~35 min (session was interrupted by a provider usage-limit reset mid-Task-2; resumed and completed directly)
- **Tasks:** 3 completed
- **Files modified:** 9 (2 new dirs of vendored source art, 1 new script, 2 asset PNGs, 2 license proofs, CREDITS.md, 1 docstring edit)

## Accomplishments
- Vendored real, CC0-verified Kenney source art (Adventurer pose set + Pixel Platformer grass/dirt tiles) into `assets/_kenney-src/`, with each pack's own `License.txt` re-confirmed CC0 (not CC-BY) at execution time
- Built `scripts/build-art-assets.py`: crops each pose to content bbox, applies ONE shared scale factor across all 5 poses (avoiding cross-frame size jitter), nearest-neighbor resizes, and palette-remaps onto the locked dark-grunge tokens
- Caught and fixed a real defect during execution: the initial nearest-RGB quantization approach collapsed the ground tile to a near-flat 2-color image because the target `ENVIRONMENT_PALETTE`'s luminance range (10-42) is far narrower than the real source art's (0-186) — added a luminance-ramp remap variant that preserves visible structure
- Rewrote `assets/LICENSES/player.txt`/`ground.txt` and the corresponding `CREDITS.md` rows to cite the real Kenney sources, added a corrective Notes entry documenting Phase 18's silent mislabeling

## Task Commits

1. **Task 1: Vendor and verify Kenney source packs** - `a54eb4d` (feat)
2. **Task 2: Build scripts/build-art-assets.py and generate asset sheets** - `372117b` (feat, includes the luminance-remap fix)
3. **Task 3: Rewrite license proofs + CREDITS.md rows** - `3740ca7` (docs)

## Files Created/Modified
- `scripts/build-art-assets.py` - new build pipeline (build_player, build_ground, _remap, _remap_luminance)
- `assets/_kenney-src/platformer-characters/` - vendored Adventurer poses + License.txt
- `assets/_kenney-src/pixel-platformer/` - vendored grass/dirt tiles + License.txt
- `assets/player.png` - real content, 80x32/5-frame (unchanged geometry)
- `assets/tiles/ground.png` - real content, 80x16/5-frame (unchanged geometry)
- `assets/LICENSES/player.txt` / `ground.txt` - rewritten proof files
- `CREDITS.md` - player/ground rows rewritten, corrective note added
- `scripts/generate-art-assets.py` - docstring-only supersession note

## Decisions Made
- Substituted Kenney "Platformer Characters" (Adventurer) for the player instead of CONTEXT.md's literal "Pixel Platformer" pick — that pack's character tiles are static blob mascots with no walk cycle, confirmed by direct inspection during research. "Pixel Platformer" is retained for the ground/tileset exactly as CONTEXT.md specified. Surfaced explicitly in 20-01-PLAN.md's objective, not silently deviated.
- Added `_remap_luminance()` as a second remap technique (beyond the plan's originally-described single `_remap()`) after visually catching that raw RGB nearest-color quantization is unsuitable for a target palette this narrow/dark. This is within Claude's discretion per CONTEXT.md's "exact palette-remap technique... at Claude's discretion."
- Fixed `_build_palette_image`'s unused-slot filler (was defaulting to `(0,0,0)`, now cycles the real palette) so quantization output strictly stays within the declared locked color set.

## Deviations from Plan

### Auto-fixed Issues

**1. [Quality — caught by visual inspection, not the plan's automated verify] Ground tile palette-remap collapsed to near-flat single color**
- **Found during:** Task 2, after running the build script and visually inspecting the output (the plan's automated `<verify>` only asserted image dimensions, which passed even on the defective output)
- **Issue:** `_remap()`'s raw nearest-RGB quantization mapped ~99% of the real Kenney grass/dirt tile pixels to a single `ENVIRONMENT_PALETTE` entry, destroying all visible edge/material-transition detail — because the source art's luminance range (0-186) is far wider than the narrow near-black target palette (10-42), collapsing all mid/high-brightness source pixels onto whichever dark entry happened to be nearest.
- **Fix:** Added `_remap_luminance()`: normalizes source luminance to 0-1 within its own min/max range, then maps to the target palette by luminance rank instead of raw RGB distance — preserves relative light/dark structure even though absolute hue is discarded (acceptable since the whole environment palette is achromatic dark greys anyway).
- **Files modified:** `scripts/build-art-assets.py`
- **Verification:** Re-ran the build; ground.png now uses 5 distinct locked-palette shades with visible top/body banding per frame (visually confirmed via a zoomed render against a mid-grey canvas), vs. the prior 2-color near-flat result.
- **Committed in:** `372117b` (Task 2 commit)

**2. [Correctness] Unused Image.quantize palette slots leaking (0,0,0) instead of the locked near-black token**
- **Found during:** Task 2, while investigating why player.png's color histogram included `(0,0,0)` — a value not in the declared 6-entry `PLAYER_PALETTE`
- **Issue:** `_build_palette_image` filled the 250 unused palette slots (of 256) with `(0,0,0)`, which `quantize()` could select as the "nearest" match for genuinely dark source pixels instead of the intended `(0x0a,0x0a,0x0a)` token — silently introducing an undeclared color.
- **Fix:** Filled all 256 slots by cycling the real declared colors, so any nearest-match resolution lands on one of the actual locked tokens.
- **Files modified:** `scripts/build-art-assets.py`
- **Verification:** Re-ran the build; player.png's color histogram now contains only the 6 declared `PLAYER_PALETTE` entries (or 5, when one goes unused).
- **Committed in:** `372117b` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 quality/visual defect, 1 correctness defect), both discovered by directly inspecting build output rather than trusting the plan's dimension-only automated checks.
**Impact on plan:** Both fixes were necessary for the plan's actual acceptance criteria ("real designed edge/seam frames depicting an actual material transition," "onto the locked palette tokens") to genuinely hold, not just pass a size assertion. No scope creep — both fixes live entirely inside `scripts/build-art-assets.py`, which this plan already owns.

## Issues Encountered
- The initial execution attempt hit a provider session usage-limit mid-Task-2 (after Task 1's commit landed but before Task 2's). Resumed directly from the partial state: `scripts/build-art-assets.py` was already fully written on disk (uncommitted) and needed only running + the two defect fixes above before committing.

## Next Phase Readiness
- `assets/player.png` and `assets/tiles/ground.png` are real, licensed CC0 art at the exact geometry Phase 18's unchanged `loadSprite()` calls expect — no `src/` changes were needed or made.
- Plan 20-02 (parallax + title-bg) can proceed independently; plan 20-03's human sign-off task should include these two assets in its screenshot set.

---
*Phase: 20-real-cc0-art-redo-human-sign-off*
*Completed: 2026-07-04*
