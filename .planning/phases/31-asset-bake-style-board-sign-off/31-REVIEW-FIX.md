---
phase: 31-asset-bake-style-board-sign-off
fixed_at: 2026-07-10T22:20:00Z
review_path: .planning/phases/31-asset-bake-style-board-sign-off/31-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 31: Code Review Fix Report

**Fixed at:** 2026-07-10T22:20:00Z
**Source review:** .planning/phases/31-asset-bake-style-board-sign-off/31-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (fix_scope: critical_warning — WR-05, WR-06; IN-01 is Info-tier and intentionally out of scope for this pass)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### WR-05: `build_enemies()` still has the unguarded `getbbox()` the WR-03 fix was supposed to eliminate

**Files modified:** `scripts/build-art-assets.py`
**Commit:** `ffc37b5`
**Applied fix:** Read the current `build_enemies()` frame-loading loop (lines 617-622) and confirmed it still had the bare `bbox = im.getbbox(); cropped = im.crop(bbox)` pattern the earlier WR-03 fix (`c82fa7a`) left unguarded, matching the review's description exactly. Applied the same guard idiom already used at the two sites `c82fa7a` did fix (`build_player()` line 177, `build_player_swamphunter()` line 1055): added `if bbox is None: raise ValueError(f"{fname}: fully transparent source frame, cannot derive content bbox")` immediately after `bbox = im.getbbox()` and before the crop. All three `getbbox()` call sites in the file now fail loud on a fully-transparent source frame instead of two guarded and one silently baking an untrimmed canvas. Verified with `python3 -c "import ast; ast.parse(...)"` (syntax OK) and re-read of the modified section.

### WR-06: `assets/tiles/atlas-castle.png` ships with no license/credit record anywhere in the repo

**Files modified:** `assets/LICENSES/gothicvania-patreon.txt`, `CREDITS.md`
**Commit:** `4d55391`
**Applied fix:** Read `build_biome_atlas_castle()` (scripts/build-art-assets.py:836-859) to pull the exact source path (`Old-dark-Castle-tileset-Files/PNG/old-dark-castle-interior-tileset.png`) and the two hand-picked crop rects it bakes from (`cap_rect=(320, 32, 352, 114)`, `fill_rect=(272, 160, 304, 224)`). Added `assets/tiles/atlas-castle.png` (32x32, 2 frames of 16x32: cap + fill) to `gothicvania-patreon.txt`'s `Asset:` block, and appended a new clause to the `Tiles/frames used:` section naming the source tileset path and both crop rects, consistent with the format the other 3 biome license files use for their own terrain-atlas entries. Added `assets/tiles/atlas-castle.png` to `CREDITS.md`'s Gothicvania Patreon Collection row's file list and extended the "Used for" cell to mention the terrain atlas, matching the cross-reference convention CREDITS.md's own header claims ("Each row below cross-matches one proof file"). Plain-text/Markdown files — no syntax checker applicable (Tier 3 fallback); verified via re-read of both modified sections.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-10T22:20:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
