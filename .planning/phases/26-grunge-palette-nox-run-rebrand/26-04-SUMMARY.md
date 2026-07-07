---
phase: 26-grunge-palette-nox-run-rebrand
plan: 04
subsystem: infra
tags: [pillow, art-pipeline, cc0, licensing, door, enemy, sprites]

# Dependency graph
requires:
  - phase: 26-03
    provides: "ENVIRONMENT_PALETTE, _remap_luminance pipeline, and the established build-art-assets.py vendor/crop/scale/remap pattern this plan follows for two new sprite categories"
provides:
  - "assets/door.png (32x64) — real CC0 locked-door barrier sprite, replacing the flat-color rect+glyph placeholder shipped since Phase 18"
  - "assets/enemy-1.png, enemy-2.png, enemy-3.png (32x32 each) — 3 distinct real CC0 enemy sprites (saw/mechanical, barnacle/monster, fly/insect), replacing the flat-color rect+glyph placeholder shipped since Phase 18"
  - "assets/LICENSES/door.txt, enemy.txt — CC0 proof files following the project's established template"
  - "build_door()/build_enemies() functions in scripts/build-art-assets.py, callable by the reproducible bake pipeline"
affects: [26-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "build_door(): single-frame crop->scale(NEAREST)->remap(_remap_luminance, ENVIRONMENT_PALETTE) pipeline, same shape as build_ground_theme() but with a fixed non-parameterized palette (door is a universal barrier, never per-theme tinted)"
    - "build_enemies(): 3 unrelated static sprites each get an INDEPENDENT scale factor (bbox-fit to 28px, centered on a 32x32 transparent canvas) — deliberately NOT build_player()'s shared-scale-across-frames pattern, since these are not a walk-cycle pose set"
    - "door.png/enemy-*.png saved as RGBA (alpha preserved), matching the spike.png/goal.png foreground-sprite precedent — NOT the RGB-flattened convention build_player()/build_ground() use for backgrounds/tiles that sit flush against the near-black stage bg"

key-files:
  created:
    - assets/_opengameart-src/6-color-dungeon/16x16-dungeon-tiles.png
    - assets/_kenney-src/new-platformer-pack/saw_rest.png
    - assets/_kenney-src/new-platformer-pack/barnacle_attack_a.png
    - assets/_kenney-src/new-platformer-pack/fly_rest.png
    - assets/door.png
    - assets/enemy-1.png
    - assets/enemy-2.png
    - assets/enemy-3.png
    - assets/LICENSES/door.txt
    - assets/LICENSES/enemy.txt
  modified:
    - scripts/build-art-assets.py
    - CREDITS.md

key-decisions:
  - "door.png/enemy-*.png saved with alpha (convert('RGBA')) rather than flattened to RGB — these are foreground sprites placed over textured level backgrounds (like spike.png/goal.png), not full-bleed background tiles that already match the near-black stage color the way player.png/ground.png do"
  - "Each enemy sprite scaled independently to a shared 28px max-bbox-dimension target rather than one shared scale factor — correct here since saw/barnacle/fly are 3 unrelated single-frame sprites, not a multi-pose walk-cycle set needing consistent character proportions"

patterns-established:
  - "New sprite-category vendor dirs (assets/_opengameart-src/6-color-dungeon/, extended assets/_kenney-src/new-platformer-pack/) follow the exact same 'vendor only the files actually used, not the whole zip/page' discipline as every prior asset"

requirements-completed: [VIS-04]

coverage:
  - id: D1
    description: "Real CC0 door sprite (assets/door.png, 32x64) exists, cropped from the same already-vendored-family 6 Color Dungeon 16x16 sheet that supplies spike.png/goal.png, remapped onto ENVIRONMENT_PALETTE"
    requirement: "VIS-04"
    verification:
      - kind: unit
        ref: "python3 scripts/build-art-assets.py && python3 -c \"from PIL import Image; assert Image.open('assets/door.png').size == (32,64)\" — PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "3 distinct real CC0 enemy sprites (assets/enemy-1/2/3.png, 32x32 each) exist — mechanical (saw), one-eyed horned monster (barnacle), insect (fly) — cropped from Kenney's New Platformer Pack, remapped onto ENVIRONMENT_PALETTE"
    requirement: "VIS-04"
    verification:
      - kind: unit
        ref: "python3 scripts/build-art-assets.py && python3 -c \"from PIL import Image; [Image.open(f'assets/enemy-{i}.png').size == (32,32) for i in (1,2,3)]\" — PASS, all 3 sizes correct"
        status: pass
    human_judgment: false
  - id: D3
    description: "Both new assets are license-proofed (assets/LICENSES/door.txt, enemy.txt, CC0-declared) and credited in CREDITS.md, matching the exact standard every prior asset in this project follows"
    requirement: "VIS-04"
    verification:
      - kind: unit
        ref: "grep -qi CC0 assets/LICENSES/door.txt assets/LICENSES/enemy.txt && grep -c assets/door.png CREDITS.md && grep -c enemy-1.png CREDITS.md — all PASS"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 04: Real CC0 Door + Enemy Sprite Art (VIS-04) Summary

**Sourced, vendored, license-proofed, and baked real CC0 sprite art for the locked door (1 sprite, 32x64, cropped from the already-vendored 6 Color Dungeon 16x16 sheet) and 3 distinct enemy variants (32x32 each — saw/mechanical, barnacle/monster, fly/insect — from Kenney's New Platformer Pack), closing a placeholder-art debt item open since Phase 18.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-07T20:03:00Z (approx)
- **Completed:** 2026-07-07T20:06:43Z
- **Tasks:** 3 (all auto)
- **Files modified:** 2 (scripts/build-art-assets.py, CREDITS.md)
- **Files created:** 10 (4 vendored source PNGs, 4 final sprite PNGs, 2 license proofs)

## Accomplishments
- Vendored `assets/_opengameart-src/6-color-dungeon/16x16-dungeon-tiles.png` (256x208, same "6 Color Dungeon 16x16" pack by HorusKDI that already supplies `spike.png`/`goal.png`) and 3 Kenney "New Platformer Pack" enemy sprites (`saw_rest.png`, `barnacle_attack_a.png`, `fly_rest.png`, 64x64 each) to `assets/_kenney-src/new-platformer-pack/` — only the 3 needed files, not the whole zip
- Wrote `assets/LICENSES/door.txt` and `enemy.txt` following the project's established `spike.txt`/`parallax.txt` proof-file template — source URL, source file, crop/tile location, License: CC0, quoted declaration, dated verification (2026-07-07)
- Added `build_door()` to `scripts/build-art-assets.py`: crops the dungeon sheet's closed-lattice-gate + archway-base assembly (48x96px at box `(0,64,48,160)`), scales 2/3 down to the locked `CONFIG.DOOR` dimensions (32x64) via `Image.NEAREST`, remaps through `_remap_luminance`/`ENVIRONMENT_PALETTE` (universal barrier element, never per-theme tinted per 26-RESEARCH.md's Anti-Pattern note)
- Added `build_enemies()`: for each of the 3 source sprites, crops to its own content bbox, scales INDEPENDENTLY (not a shared walk-cycle scale) so its largest bbox dimension becomes 28px, centers on a 32x32 transparent canvas, remaps through the same `ENVIRONMENT_PALETTE` pipeline
- Ran the pipeline: `assets/door.png` (32x64) and `assets/enemy-1/2/3.png` (32x32 each) generated with correct dimensions; visually confirmed as dark-grunge, distinct silhouettes (lattice gate; saw/gear teeth; horned creature with eyes; insect with wings) — no pink, no placeholder rects
- Confirmed zero unintended diff to any pre-existing baked asset (base or per-theme) — `git status` after the bake run showed only the 4 new sprite files as untracked, nothing else changed
- Added 2 new rows + a Notes bullet to `CREDITS.md`, matching the existing table format exactly

## Task Commits

Each task was committed atomically:

1. **Task 1: Source and vendor the door and enemy source art** - `989dd04` (feat)
2. **Task 2: Add build_door() and build_enemies(), run, produce the 4 final sprite PNGs** - `e43d846` (feat)
3. **Task 3: Add CREDITS.md rows for the door and enemy assets** - `b47425c` (docs)

## Files Created/Modified
- `assets/_opengameart-src/6-color-dungeon/16x16-dungeon-tiles.png` - vendored door/gate source sheet (256x208)
- `assets/_kenney-src/new-platformer-pack/{saw_rest,barnacle_attack_a,fly_rest}.png` - vendored enemy source sprites (64x64 each)
- `assets/LICENSES/door.txt`, `assets/LICENSES/enemy.txt` - CC0 proof files
- `scripts/build-art-assets.py` - added `build_door()`, `build_enemies()`, called from `__main__` after the 26-03 theme loop
- `assets/door.png` (32x64), `assets/enemy-1.png`, `assets/enemy-2.png`, `assets/enemy-3.png` (32x32 each) - final baked sprites
- `CREDITS.md` - 2 new asset rows + a Notes bullet on the enemy-variant selection rationale

## Decisions Made
- **Saved door.png/enemy-*.png with alpha preserved (RGBA)**, not flattened to RGB like `build_player()`/`build_ground()`/`build_parallax()` do. Those are backgrounds/tilesheets whose transparent-canvas edges happen to land on colors close enough to the near-black stage bg not to matter when flattened. Door and enemies are foreground sprites placed over textured (often non-black) level backgrounds — the same category as `spike.png`/`goal.png`, which are already shipped as RGBA. Matching that precedent avoids visible square edges around the sprites.
- **Independent per-sprite scaling for the 3 enemies** rather than one shared scale factor. `build_player()`'s shared-scale pattern exists specifically to keep one character's proportions consistent across its pose frames (idle/walk/jump); saw/barnacle/fly are 3 unrelated single-frame sprites with no such relationship, so fitting each independently to the same 28px target produces a better, less-cramped result for each individual silhouette.

## Deviations from Plan

None — plan executed exactly as written. The plan's door source values (crop box, sheet dimensions) were pre-verified this session per its own `<action>` text ("already verified this session — reuse these exact values, no re-derivation needed") and matched on download (256x208 confirmed). The plan's enemy source files (`saw_rest.png`, `barnacle_attack_a.png`, `fly_rest.png`) all existed at the specified paths in the downloaded zip and matched the expected 64x64 dimensions.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Pillow was already installed (used by 26-03 and earlier plans); no new dependency added.

## Next Phase Readiness
- `assets/door.png` and `assets/enemy-1/2/3.png` are ready for Plan 26-05 to wire into `build.js`'s cosmetic panels (`loadSprite` calls, replacing the flat-color rect+glyph placeholder logic in `src/mechanics/door.js`/`src/mechanics/enemy.js`)
- Both new license proof files and CREDITS.md rows are in place, matching the standard every prior asset in this project follows
- `bash scripts/check-safety.sh` still passes — no `src/` runtime code was touched this plan
- No blockers for 26-05 onward

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 10 created files found on disk (2 vendored source dirs, 4 final sprite PNGs, 2 license proofs, this summary); all 3 task commit hashes (989dd04, e43d846, b47425c) found in git log.
