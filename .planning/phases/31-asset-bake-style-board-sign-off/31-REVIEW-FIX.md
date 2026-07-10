---
phase: 31-asset-bake-style-board-sign-off
fixed_at: 2026-07-10T00:00:00Z
review_path: .planning/phases/31-asset-bake-style-board-sign-off/31-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 31: Code Review Fix Report

**Fixed at:** 2026-07-10
**Source review:** .planning/phases/31-asset-bake-style-board-sign-off/31-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (fix_scope: critical_warning — CR-*/BL-*/WR-* only; IN-01 and IN-02 are Info-tier and out of scope for this run)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Biome atlas crops are resized non-uniformly (stretched), unlike this file's own established aspect-preserving convention

**Files modified:** `scripts/build-art-assets.py`
**Commit:** `3f081f6`
**Applied fix:** Added a new `_fit_and_pad()` helper that mirrors `build_player()`'s aspect-preserving idiom — computes ONE shared scale factor (`min(target_w/src.width, target_h/src.height)`), resizes with `Image.NEAREST`, and bottom-anchors the result in a transparent `target_w x target_h` canvas. `_bake_biome_atlas()` now calls `_fit_and_pad(cap, ...)` / `_fit_and_pad(fill, ...)` instead of the raw two-argument `cap.resize((target_w, target_h), Image.NEAREST)` that silently stretched non-16:32 crops. Verified `bash scripts/check-pink-gate.sh` still passes (retinted Town/Cemetery atlases and the allowlisted Swamp Hunter sprite all pass/allowlist as before) since the currently-shipped atlas PNGs are unaffected by this source-level fix until the next actual bake run (Gothicvania source packs are gitignored/not vendored in this environment, so a full re-bake could not be exercised here — the fix was validated by re-deriving all 8 existing hardcoded crop rects against their documented sheet dimensions to confirm none would now fail the new logic's implicit bounds).

### WR-02: Allowlist justification in pink_scan.py mischaracterizes the flagged color's actual role/scope

**Files modified:** `scripts/lib/pink_scan.py`
**Commit:** `99f5e17`
**Applied fix:** Rewrote both the `ALLOWLIST` header comment and the `assets/player-swamphunter.png` entry's inline string to state the measured 43.3%-of-opaque-pixels scope and correct "BASE FILL color" framing (not "outline-shading"), per the REVIEW.md-suggested wording. Re-ran `bash scripts/check-pink-gate.sh` — still PASSes with the corrected allowlist message displayed.

### WR-03: Unguarded `getbbox() -> None` in frame-loading loops

**Files modified:** `scripts/build-art-assets.py`
**Commit:** `c82fa7a`
**Applied fix:** In both `build_player()`'s and `build_player_swamphunter()`'s frame-loading loops, replaced the bare `loaded.append((im, im.getbbox()))` with an explicit `bbox = im.getbbox()` followed by a `None` check that raises a `ValueError` naming the specific offending frame file, before appending to `loaded`. Matches the fix suggestion exactly.

### WR-04: Biome atlas/parallax bakes skip the source-dimension assertion this file uses elsewhere

**Files modified:** `scripts/build-art-assets.py`
**Commit:** `91aec3d`
**Applied fix:** `_bake_biome_atlas()` now validates that both `cap_rect` and `fill_rect` fit within the opened sheet's bounds (`0 <= x0,y0` and `x1,y1 <= im.size`) before cropping, raising a `ValueError` naming which rect and the actual vs. expected sheet size — mirroring `build_enemy_hellhound()`'s assertion pattern but adapted to a bounds check (rather than an exact-size assert) since `_bake_biome_atlas` is called with different sheet sizes per biome. `_bake_biome_parallax_layer()` gained a companion degenerate-source guard (`src.width == 0 or src.height == 0`) since it has no crop rects to bounds-check — it consumes the full source image via a tileable-strip design that intentionally tolerates varying source dimensions. Verified all 8 existing hardcoded cap/fill rects across the 4 biomes still satisfy the new bounds check against their documented sheet sizes (no false-positive rejections of current, correct crops).

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-10_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
