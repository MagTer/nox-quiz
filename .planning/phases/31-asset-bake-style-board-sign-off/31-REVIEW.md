---
phase: 31-asset-bake-style-board-sign-off
reviewed: 2026-07-10T22:11:49Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - assets/enemy-hellhound.png
  - assets/LICENSES/gothicvania-cemetery.txt
  - assets/LICENSES/gothicvania-church.txt
  - assets/LICENSES/gothicvania-patreon.txt
  - assets/LICENSES/gothicvania-swamp.txt
  - assets/LICENSES/gothicvania-town.txt
  - assets/player-swamphunter.png
  - assets/tiles/atlas-castle.png
  - assets/tiles/atlas-cemetery.png
  - assets/tiles/atlas-swamp.png
  - assets/tiles/atlas-town.png
  - docs/LEVEL-DESIGN.md
  - scripts/build-art-assets.py
  - scripts/check-pink-gate.sh
  - scripts/lib/pink_scan.py
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 31: Code Review Report

**Reviewed:** 2026-07-10T22:11:49Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This is an independent re-review of the same file scope covered by an earlier pass (WR-01..WR-04 plus 2 deferred info items), verifying the 4 fix commits (`3f081f6`, `99f5e17`, `c82fa7a`, `91aec3d`) against the current file contents rather than trusting `31-REVIEW-FIX.md`'s claims. This pass's config also adds 6 binary PNGs to scope (`assets/enemy-hellhound.png`, `assets/player-swamphunter.png`, `assets/tiles/atlas-{castle,cemetery,swamp,town}.png`) that the prior pass did not have.

**Fix verification results:**
- **WR-01** (non-uniform stretch in biome atlas bake) — **confirmed fixed.** `_fit_and_pad()` (added in `3f081f6`) is now used by `_bake_biome_atlas()` for every biome's cap/fill crop. Hand-checked the aspect-preserving `min(w-ratio, h-ratio)` scale factor against all 8 hardcoded crop rects (swamp/town/cemetery/castle × cap/fill) — every one now fits inside the 16x32 target without skew, including cemetery's fill (32x128, previously stretched 2.0x in the opposite direction from its own cap).
- **WR-02** (pink_scan allowlist comment mischaracterized scope) — **confirmed fixed and accurate.** Re-ran `python3 scripts/lib/pink_scan.py assets`; `assets/player-swamphunter.png` reports exactly `43.3%`, matching the corrected allowlist justification text verbatim (no drift between the code-measured value and the doc claim).
- **WR-03** (unguarded `getbbox() -> None` in frame-loading loops) — **only partially fixed.** `c82fa7a` patched `build_player()` and `build_player_swamphunter()` but missed a third, structurally identical loop in `build_enemies()`. See WR-05 below — this is a real regression against the fix's own stated scope ("frame-loading loops", plural), not a new independent bug.
- **WR-04** (source-bounds checks in biome atlas/parallax bakes) — **confirmed fixed.** `_bake_biome_atlas()` now validates both `cap_rect` and `fill_rect` against the source sheet's real dimensions before cropping (raises `ValueError` naming the offending rect), and `_bake_biome_parallax_layer()` now rejects zero-dimension source images before tiling.

**New findings from this pass:** the WR-03 incomplete-fix regression above, and an asset-provenance/documentation gap on `assets/tiles/atlas-castle.png` (newly in this pass's scope) that has no license or credit record anywhere in the repo, unlike the other 3 biome atlases. All 4 biome atlas/parallax PNGs and both character sheets were opened and dimension-checked directly against their bake functions' asserted output sizes — all match. `check-pink-gate.sh`/`pink_scan.py` remain sound (re-run cleanly against the real `assets/` tree, self-tests pass, no shell-injection risk, `subprocess.run()` in `build-art-assets.py` uses a fixed argv list with no `shell=True`). No new security issues, no dead code, no secrets found.

## Warnings

### WR-05: `build_enemies()` still has the unguarded `getbbox()` the WR-03 fix was supposed to eliminate

**File:** `scripts/build-art-assets.py:619-620`
**Issue:** The WR-03 fix (`c82fa7a`, "guard getbbox() None in frame-loading loops") added a `bbox is None` check + `raise ValueError(...)` to `build_player()` (line 177) and `build_player_swamphunter()` (line 1055), but `build_enemies()`'s identical frame-loading loop was never touched:

```python
for fname, out_name in sources:
    im = Image.open(os.path.join(SRC, "new-platformer-pack", fname)).convert("RGBA")
    bbox = im.getbbox()
    cropped = im.crop(bbox)
```

`grep -n getbbox scripts/build-art-assets.py` returns 3 hits (lines 177, 619, 1055); the fix commit's diff only touches 2 of them, despite its own commit message describing the fix as covering "frame-loading loops" (plural).

This is arguably worse than the crash the other two sites now correctly fail loud on. Verified directly (`Image.crop(None)` on a fully-transparent RGBA image returns a full, uncropped copy of the source rather than raising — confirmed by direct test). So a fully-transparent `saw_rest.png`/`barnacle_attack_a.png`/`fly_rest.png` source would silently bake as a full untrimmed canvas scaled by `content_target / max(cropped.width, cropped.height)` (using the whole source canvas's dimensions instead of the intended content bbox) instead of failing the build — a silently-wrong sprite ships with zero error raised anywhere in the pipeline, the exact failure mode WR-03 was written to close off.

**Fix:**
```python
for fname, out_name in sources:
    im = Image.open(os.path.join(SRC, "new-platformer-pack", fname)).convert("RGBA")
    bbox = im.getbbox()
    if bbox is None:
        raise ValueError(f"{fname}: fully transparent source frame, cannot derive content bbox")
    cropped = im.crop(bbox)
```

### WR-06: `assets/tiles/atlas-castle.png` ships with no license/credit record anywhere in the repo

**File:** `assets/LICENSES/gothicvania-patreon.txt`, `CREDITS.md:37`
**Issue:** `assets/tiles/atlas-castle.png` (explicitly in this review's file scope, confirmed present and correctly baked at 32x32) is produced by `build_biome_atlas_castle()` from the Gothicvania Patreon Collection's `Old-dark-Castle-tileset-Files/PNG/old-dark-castle-interior-tileset.png`. Every other biome's terrain atlas has both a `assets/LICENSES/gothicvania-*.txt` proof file naming the exact atlas PNG, and a matching `CREDITS.md` row:

- swamp → `gothicvania-swamp.txt:1` + `CREDITS.md:35` both name `atlas-swamp.png`
- town → `gothicvania-town.txt:1` + `CREDITS.md:36` both name `atlas-town.png`
- cemetery → `gothicvania-cemetery.txt:1-2` + `CREDITS.md:38` both name `atlas-cemetery.png`
- **castle → nothing.** `gothicvania-patreon.txt`'s "Tiles/frames used" section and its matching `CREDITS.md:37` row both enumerate `far-castle.png`, `mid-castle.png`, and `enemy-hellhound.png` from this same source pack, but `atlas-castle.png` is never mentioned. `grep -rn "atlas-castle" assets/LICENSES/ CREDITS.md` returns zero hits.

This breaks the project's own stated convention (`CLAUDE.md`: "Licenses in `assets/LICENSES/`, credits in `CREDITS.md`") and `CREDITS.md`'s own header claim ("Each row below cross-matches one proof file") for an asset that is genuinely shipped in this repo. CC0 doesn't legally require attribution, but every sibling biome atlas carries full sourcing/hue-analysis documentation, and this one has none — a real provenance gap, not a style nit.

**Fix:** Add `assets/tiles/atlas-castle.png` to `gothicvania-patreon.txt`'s "Tiles/frames used" list (naming the `Old-dark-Castle-tileset-Files/PNG/old-dark-castle-interior-tileset.png` source and the two hand-picked crop rects `build_biome_atlas_castle()` uses), and add `assets/tiles/atlas-castle.png` to the file list in `CREDITS.md:37`'s Gothicvania Patreon Collection row.

## Info

### IN-01: Three license files describe the biome atlas as "32x16" when the actual/coded output is 32x32

**File:** `assets/LICENSES/gothicvania-swamp.txt:1`, `assets/LICENSES/gothicvania-cemetery.txt:1-2`, `assets/LICENSES/gothicvania-town.txt:1`
**Issue:** All three say `"...biome terrain atlas — 32x16, 2 frames of 16x32: cap + fill)"`. This is internally inconsistent (two 16-wide x 32-tall frames placed side-by-side horizontally is 32x32, not 32x16) and doesn't match the actual shipped files — verified directly with Pillow: `atlas-swamp.png`, `atlas-cemetery.png`, and `atlas-town.png` are all `(32, 32)`, matching `_bake_biome_atlas()`'s own `(target_w * 2, target_h)` = `(32, 32)` construction and assert. `docs/LEVEL-DESIGN.md` section 9 correctly states "32x32 sheet of two 16x32 frames" for the same assets, so this is an isolated typo copy-pasted across the three license files, not a spec ambiguity — `assets/LICENSES/gothicvania-castle.txt` doesn't exist so it can't repeat the same typo (see WR-06).
**Fix:** Change `"32x16"` to `"32x32"` in all three files' opening `Asset:` line.

---

_Reviewed: 2026-07-10T22:11:49Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
