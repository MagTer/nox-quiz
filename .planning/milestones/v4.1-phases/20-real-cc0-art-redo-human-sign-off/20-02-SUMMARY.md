---
phase: 20-real-cc0-art-redo-human-sign-off
plan: 02
subsystem: assets
tags: [pillow, pil, kenney, cc0, pixel-art, compositing, palette-quantization]

requires:
  - phase: 20-real-cc0-art-redo-human-sign-off
    provides: "Plan 01's scripts/build-art-assets.py pipeline (PLAYER_PALETTE/ENVIRONMENT_PALETTE, save(), _remap/_remap_luminance)"
provides:
  - Real, licensed CC0 parallax layers (far/mid/near) composited from Kenney "Background Elements"
  - Real, licensed CC0 title/select backdrop composited from the same pack
  - build_parallax()/build_title_bg() extending Plan 01's shared pipeline
  - Corrected CREDITS.md + new assets/LICENSES/parallax.txt + title-bg.txt
affects: [20-03]

tech-stack:
  added: []
  patterns:
    - "Silhouette compositing: paste multiple real CC0 element PNGs (mountains/hills/temple/castle/tower/clouds) onto a blank RGBA canvas at the exact locked dimensions before palette-remapping, rather than relying on a single pre-made background strip"
    - "Per-layer sub-palettes drawn from the same shared ENVIRONMENT_PALETTE family (never inventing new hues), matched to 18-UI-SPEC.md's stated color-mood tokens per layer"

key-files:
  created:
    - assets/_kenney-src/background-elements/ (7 element PNGs + License.txt)
  modified:
    - scripts/build-art-assets.py (added build_parallax, build_title_bg, per-layer palettes)
    - assets/parallax/far.png
    - assets/parallax/mid.png
    - assets/parallax/near.png
    - assets/tiles/title-bg.png
    - assets/LICENSES/parallax.txt (new)
    - assets/LICENSES/title-bg.txt (new)
    - CREDITS.md

key-decisions:
  - "Mid layer explicitly composites temple + castle + tower (three distinct structures) at staggered x-positions atop a hills base — satisfies ART-07's 'deliberate horizon rhythm' with real structural variety, not a single repeated shape"
  - "Used Image.LANCZOS (not NEAREST) for these larger composites' resizes, since none of them hit the player sprite's ~4x-plus downscale-onto-16px-target problem (Pitfall 6's carve-out)"
  - "Reused the luminance-ramp remap technique from Plan 01 for all four assets here too, since every per-layer palette is similarly narrow/dark — raw nearest-RGB would have collapsed them the same way it collapsed the ground tile in Plan 01"

patterns-established: []

requirements-completed: [ART-07, ART-08, PROC-01]

coverage:
  - id: D1
    description: "Parallax far/mid/near layers composited from real Kenney Background Elements silhouettes (mountains, hills, temple, castle, tower), camera-driven only, at the locked dimensions"
    requirement: "ART-07"
    verification:
      - kind: unit
        ref: "python3 -c \"from PIL import Image; assert Image.open('assets/parallax/far.png').size==(640,120); assert Image.open('assets/parallax/mid.png').size==(640,144); assert Image.open('assets/parallax/near.png').size==(640,90)\""
        status: pass
      - kind: manual_procedural
        ref: "visual inspection this session — far shows a jagged mountain range, mid shows temple/castle/tower silhouettes atop a hills horizon (distinct structural rhythm), near shows a subtler rolling-hill wave"
        status: pass
    human_judgment: true
    rationale: "Whether the parallax genuinely reads as calm composed scenery vs. noise when scrolling live with the camera is a perceptual/motion judgment deferred to plan 20-03's human sign-off task"
  - id: D2
    description: "Title/select backdrop composited from real Kenney elements (castle + hills + clouds), real panel/scene hierarchy instead of a flat rectangle"
    requirement: "ART-08"
    verification:
      - kind: unit
        ref: "python3 -c \"from PIL import Image; assert Image.open('assets/tiles/title-bg.png').size==(640,360)\""
        status: pass
      - kind: manual_procedural
        ref: "visual inspection this session — recognizable castle silhouette with towers/turrets, two clouds, hills horizon, very low contrast per 18-UI-SPEC.md's art direction"
        status: pass
    human_judgment: true
    rationale: "Readability of the title/select hierarchy against actual on-screen text is a perceptual judgment deferred to plan 20-03's human sign-off task"
  - id: D3
    description: "License proof files (combined parallax.txt + title-bg.txt) and 4 new CREDITS.md rows for the Background Elements assets"
    requirement: "PROC-01"
    verification:
      - kind: other
        ref: "grep -qi CC0 assets/LICENSES/parallax.txt assets/LICENSES/title-bg.txt && grep -c assets/parallax/ CREDITS.md (== 3) && grep -q tiles/title-bg.png CREDITS.md"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-07-04
status: complete
---

# Phase 20 Plan 02: Real Parallax + Title-Bg Art Summary

**Real Kenney "Background Elements" silhouettes (mountains, hills, temple, castle, tower, clouds) replace Phase 18's random-rectangle parallax and low-contrast noise title backdrop, composited onto the locked canvas dimensions and palette-remapped via Plan 01's luminance-ramp technique.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3 completed
- **Files modified:** 12 (7 vendored source PNGs, 1 script extension, 4 asset PNGs, 2 new license proofs, CREDITS.md)

## Accomplishments
- Vendored 7 real, CC0-verified Kenney "Background Elements" silhouette PNGs (pointy_mountains, hills1/2, temple, castle, tower, cloud1)
- Extended `scripts/build-art-assets.py` with `build_parallax()` (far/mid/near composites, mid layer using 3 distinct structures for genuine horizon rhythm) and `build_title_bg()` (castle+hills+clouds scene)
- All four assets reuse Plan 01's luminance-ramp remap technique onto narrow per-layer sub-palettes drawn from the shared `ENVIRONMENT_PALETTE` family
- Visually confirmed all four outputs read as real composed scenery, not random shapes or flat noise
- Rewrote CREDITS.md and added two new license proof files, one combined for the three parallax layers (per CONTEXT.md's explicit discretion)

## Task Commits

1. **Task 1: Vendor and verify Kenney "Background Elements" pack** - `9b29f44` (feat)
2. **Task 2: Extend build-art-assets.py with build_parallax/build_title_bg** - `e6ed627` (feat)
3. **Task 3: License proof + CREDITS.md rows** - `85507bf` (docs)

## Files Created/Modified
- `assets/_kenney-src/background-elements/` - vendored silhouette PNGs + License.txt
- `scripts/build-art-assets.py` - added build_parallax(), build_title_bg(), per-layer palettes
- `assets/parallax/far.png` / `mid.png` / `near.png` - real composited content, unchanged geometry
- `assets/tiles/title-bg.png` - real composited content, unchanged geometry
- `assets/LICENSES/parallax.txt` (new, combined) / `title-bg.txt` (new)
- `CREDITS.md` - 4 new rows appended

## Decisions Made
- Mid parallax layer explicitly places temple + castle + tower at staggered intervals atop a hills base, giving ART-07's "deliberate horizon rhythm" real structural variety rather than one repeated silhouette.
- Combined `parallax.txt` proof file for all three layers (CONTEXT.md's explicit discretion, since all three share the same Background Elements source page), separate `title-bg.txt` since it's conceptually a distinct asset even though same pack.
- Reused (did not reinvent) Plan 01's `_remap_luminance` for all four assets here — every per-layer palette is similarly narrow/dark, so the same collapse risk applied and the same fix was reused directly.

## Deviations from Plan
None — plan executed exactly as written. (Plan 01's two mid-execution defect fixes already made the shared pipeline's remap approach correct before this plan started, so no new defects surfaced here.)

## Issues Encountered
None.

## Next Phase Readiness
- All 6 art assets (player, ground, far, mid, near, title-bg) now real, licensed CC0 content at their exact locked dimensions — `scripts/build-art-assets.py` regenerates the complete set end-to-end in one pass.
- Plan 20-03 can now proceed to the real in-browser screenshot + genuine human sign-off task with a complete, real art set to show.

---
*Phase: 20-real-cc0-art-redo-human-sign-off*
*Completed: 2026-07-04*
