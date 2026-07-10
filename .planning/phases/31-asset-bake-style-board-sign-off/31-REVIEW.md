---
phase: 31-asset-bake-style-board-sign-off
reviewed: 2026-07-10T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - assets/LICENSES/gothicvania-cemetery.txt
  - assets/LICENSES/gothicvania-church.txt
  - assets/LICENSES/gothicvania-patreon.txt
  - assets/LICENSES/gothicvania-swamp.txt
  - assets/LICENSES/gothicvania-town.txt
  - docs/LEVEL-DESIGN.md
  - scripts/build-art-assets.py
  - scripts/check-pink-gate.sh
  - scripts/lib/pink_scan.py
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 31: Code Review Report

**Reviewed:** 2026-07-10
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the Phase 31 asset-bake pipeline (`scripts/build-art-assets.py`, `scripts/check-pink-gate.sh`, `scripts/lib/pink_scan.py`), the level-design documentation update (`docs/LEVEL-DESIGN.md` §9), and the 5 new/updated Gothicvania license attribution files.

The license `.txt` files were cross-checked against the actual live bytes in `assets/tiles/atlas-*.png` (alpha coverage per row, per-row luminance) — every specific pixel-measurement claim in `docs/LEVEL-DESIGN.md`'s §9 lip-offset table (swamp ~4px, town ~26px, cemetery rows 10-19 only, castle's bottom-anchored gold highlight at rows 27-31) was verified byte-for-byte against the shipped PNGs and is accurate. The pink-gate itself (`pink_scan.py` + `check-pink-gate.sh`) is logically sound: no shell-injection risk, no divide-by-zero, allowlist matching by suffix is robust, self-test cases pass.

Two real defects were found in the bake pipeline itself, both in `scripts/build-art-assets.py`'s new Phase-31 code:

1. The 4 biome terrain-atlas bakes (`_bake_biome_atlas`, used by `build_biome_atlas_{swamp,town,cemetery,castle}`) crop rectangles whose aspect ratio does **not** match the 16:32 (w:h = 0.5) target frame, then force-resize with a single non-uniform `.resize()` call — unlike this same file's existing `build_door()` (which deliberately hand-picked a crop already at the exact target aspect) or `build_player()`/`build_enemies()` (which derive one shared, aspect-preserving scale factor and pad). This silently stretches the baked cap/fill art by up to ~3.3x more in one axis than the other.
2. `scripts/lib/pink_scan.py`'s `ALLOWLIST` entry for `assets/player-swamphunter.png` characterizes the flagged color as an "outline-shading" artifact, but direct pixel sampling shows it is **43.3% of the sprite's opaque pixels** — the character's main pants/boot fill color, clearly visible as a large solid region in the rendered sprite, not outline pixels. The underlying "not genuinely pink, HSV-hue-unstable at low brightness" technical conclusion checks out numerically, but the comment's framing understates how much of the asset this covers, which matters for whoever next decides whether to trust/extend/remove this allowlist entry.

Additional quality gaps: a `getbbox() -> None` edge case is unguarded in two frame-loading loops, biome-atlas/parallax bakes skip the source-dimension assertion that `build_enemy_hellhound()` uses, and numerous output-size `assert` statements throughout the file are tautological (they check a post-condition that `.resize()` always satisfies, so they can never actually catch a bad crop).

## Warnings

### WR-01: Biome atlas crops are resized non-uniformly (stretched), unlike this file's own established aspect-preserving convention

**File:** `scripts/build-art-assets.py:700-731` (`_bake_biome_atlas`), called from `build_biome_atlas_swamp` (745-747), `build_biome_atlas_town` (769-773), `build_biome_atlas_cemetery` (802-805), `build_biome_atlas_castle` (829-831)

**Issue:** `_bake_biome_atlas` does `cap.resize((target_w, target_h), Image.NEAREST)` / `fill.resize((target_w, target_h), Image.NEAREST)` directly against `cap_rect`/`fill_rect` crops whose own aspect ratio is not checked against the 16:32 (0.5 w:h) target. Computing the actual per-axis scale factors from the hardcoded rects:

| Biome | Crop (cap) | scale_x | scale_y | skew (max/min) |
|---|---|---|---|---|
| swamp cap | 80x64 | 0.20 | 0.50 | 2.5x |
| swamp fill | 80x48 | 0.20 | 0.667 | 3.33x |
| town cap | 64x76 | 0.25 | 0.421 | 1.68x |
| town fill | 64x72 | 0.25 | 0.444 | 1.78x |
| cemetery cap | 96x128 | 0.167 | 0.25 | 1.5x |
| cemetery fill | 32x128 | 0.5 | 0.25 | 2.0x (opposite skew from its own cap) |
| castle cap | 32x82 | 0.5 | 0.390 | 1.28x |
| castle fill | 32x64 | 0.5 | 0.5 | 1.0x (only exact match) |

Only castle's `fill_rect` happens to already match the target aspect; every other cap/fill crop gets non-uniformly squashed/stretched, and in cemetery's case the cap and fill are skewed in *opposite* directions from each other within the same atlas. This is inconsistent with `build_door()` (crop `(0,64,48,160)` = 48x96, exactly 0.5 aspect, chosen deliberately) and with `build_player()`/`build_enemies()` (single shared scale factor derived from content bbox, then centered/padded — never a raw non-uniform `.resize()`). Visual impact is muted today because the post-remap dark-grunge palette collapses most surface detail to near-black, but the distortion is real and undocumented, and will compound if these crops are ever reused at a lower luminance-compression setting or a brighter per-theme accent.

**Fix:** Either hand-pick replacement crop rectangles whose native aspect ratio already matches 16:32 (the `build_door()` convention), or scale-and-letterbox/pad like `build_player()` instead of a raw two-argument `.resize()`:
```python
# instead of: cap.resize((target_w, target_h), Image.NEAREST)
scale = min(target_w / cap.width, target_h / cap.height)
new_w, new_h = max(1, round(cap.width * scale)), max(1, round(cap.height * scale))
resized = cap.resize((new_w, new_h), Image.NEAREST)
frame = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
frame.paste(resized, ((target_w - new_w) // 2, target_h - new_h), resized)  # bottom-anchor
```

### WR-02: Allowlist justification in pink_scan.py mischaracterizes the flagged color's actual role/scope

**File:** `scripts/lib/pink_scan.py:67-84`

**Issue:** The `ALLOWLIST` entry for `assets/player-swamphunter.png` describes the flagged RGB `(50,34,46)` as "Swamp Hunter native dark plum/maroon **outline-shading** color" implying thin edge/shadow pixels. Direct measurement shows this single color accounts for **43.3%** of the sprite's opaque pixels (`pink_scan.py` itself reports `0.4328` for this file) — verified by direct pixel-count sampling and by rendering the sprite: it is the character's pants/boots base fill color, a large solid region, not an outline. The technical HSV-instability claim (hue~223, sat~81, val~50 — confirmed numerically correct) may still be a reasonable basis for allowlisting, but the "outline-shading" framing is inaccurate and could mislead a future maintainer deciding whether this allowlist entry is still narrowly scoped/justified or has quietly become a way to launder a genuinely large maroon/burgundy fill area past the no-pink gate.

**Fix:** Correct the comment to state the actual measured scope, e.g.:
```python
ALLOWLIST = {
    "assets/player-swamphunter.png": (
        "Swamp Hunter's dark plum/maroon pants+boots BASE FILL color "
        "(RGB (50,34,46), HSV hue~223/sat~81/val~50) — 43.3% of the sprite's "
        "opaque pixels, not a thin outline. Confirmed via colorsys round-trip "
        "as a low-brightness HSV hue-instability artifact, not genuine pink "
        "content (31-CONTEXT.md); re-verify against a render, not just the "
        "hue number, if this entry is ever revisited."
    ),
}
```

### WR-03: Unguarded `getbbox() -> None` in frame-loading loops

**File:** `scripts/build-art-assets.py:176-179` (`build_player`), `1024-1030` (`build_player_swamphunter`)

**Issue:** Both loops do `loaded.append((im, im.getbbox()))` then later `max(bbox[3] - bbox[1] for _, bbox in loaded)`. `Image.getbbox()` returns `None` when a frame is fully transparent (no non-zero pixels). If any vendored source frame is ever a blank/placeholder image (e.g. a corrupted download, a renamed-but-empty frame file), this raises an opaque `TypeError: 'NoneType' object is not subscriptable` instead of a clear error identifying which frame file was empty.

**Fix:**
```python
for fname in pose_files:
    im = Image.open(os.path.join(SRC, "platformer-characters", fname)).convert("RGBA")
    bbox = im.getbbox()
    if bbox is None:
        raise ValueError(f"{fname}: fully transparent source frame, cannot derive content bbox")
    loaded.append((im, bbox))
```

### WR-04: Biome atlas/parallax bakes skip the source-dimension assertion this file uses elsewhere

**File:** `scripts/build-art-assets.py:700-731` (`_bake_biome_atlas`), `834-856` (`_bake_biome_parallax_layer`)

**Issue:** `build_enemy_hellhound()` (line 1074-1077) explicitly asserts the source sheet's dimensions (`assert im.size == (frame_w * num_frames, frame_h)`) before slicing frames, so a vendor-pack change is caught immediately with a clear message. `_bake_biome_atlas` and `_bake_biome_parallax_layer` crop hardcoded rectangles out of `im.crop(cap_rect)` / `Image.open(src_path)` with no such check — if a re-fetched Gothicvania pack ever ships a differently-sized sheet (the license docs note these packs were "re-fetched" and "live re-verified" this same session, so re-fetch is an established practice here), the crop rectangles will silently sample the wrong region (or partially transparent padding) and bake a corrupted-looking but structurally "valid" (correctly-sized) PNG with no error raised anywhere in the pipeline.

**Fix:** Add a source-size assertion (or at minimum a bounds check that `cap_rect`/`fill_rect` fit within `im.size`) before cropping, mirroring `build_enemy_hellhound()`'s pattern:
```python
im = Image.open(sheet_path).convert("RGBA")
assert im.size == EXPECTED_SIZE, f"{sheet_path}: unexpected sheet size {im.size}, crop rects need re-deriving"
```

## Info

### IN-01: Output-size `assert` statements throughout the bake pipeline are tautological

**File:** `scripts/build-art-assets.py` — representative instances: `:195`, `:223`, `:251-252`, `:478`, `:492`, `:501`, `:518`, `:530`, `:538`, `:565`, `:590`, `:729`, `:855`

**Issue:** Every bake function ends with e.g. `assert remapped.size == (target_w, target_h), "..."` immediately after a `.resize((target_w, target_h), ...)` (directly or via `_remap`/`_remap_luminance`, both of which preserve input size). `Image.resize()` always returns an image of exactly the requested size — the assert can never fail regardless of whether the *content* of the crop/composite upstream was correct. These asserts read as content-correctness verification but only prove that Pillow's `resize()` did what it always does, giving false confidence that "the bake was verified" when no such verification of the actual pixel content took place.

**Fix:** Either remove these no-op asserts, or replace them with an assertion that actually tests something non-guaranteed (e.g. that the image isn't fully transparent/blank: `assert remapped.getbbox() is not None`).

### IN-02: `pink_scan.py` CLI crashes with a raw traceback on a missing/unreadable path

**File:** `scripts/lib/pink_scan.py:226-264` (`main`)

**Issue:** The single-file CLI branch (`frac = pink_fraction(target)`) calls `Image.open(target)` with no existence/format check. A typo'd path or a non-image file produces an unhandled `FileNotFoundError` / `PIL.UnidentifiedImageError` traceback rather than a clean, actionable CLI error message. Low impact since this is a developer-invoked debug tool, but worth a friendlier guard given the module's docstring explicitly documents this as a supported invocation mode ("single-file report").

**Fix:**
```python
if not os.path.isfile(target):
    print(f"pink_scan: no such file: {target}", file=sys.stderr)
    return 1
```

---

_Reviewed: 2026-07-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
