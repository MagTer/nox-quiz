#!/usr/bin/env python3
"""Build Phase 20 real-CC0-art pixel assets for Nox Run.

Successor to `scripts/generate-art-assets.py` (which drew flat rectangles +
random noise and is now retained only as a labeled dev/prototyping tool — see
its docstring). This script instead reads REAL, licensed CC0 source art
vendored under `assets/_kenney-src/`, fits it onto the exact locked frame
geometry `18-UI-SPEC.md` already established, and palette-remaps it onto this
project's own locked dark-grunge color tokens before writing the final PNGs:

- assets/player.png          80x32  (5 frames of 16x32) — Kenney "Platformer
  Characters" (Adventurer pose set): idle, stand, walk1, walk2, jump.
- assets/tiles/ground.png    80x16  (5 frames of 16x16) — Kenney "Pixel
  Platformer": tile_0000..tile_0003 (grass-over-dirt variants) + tile_0004
  (plain dirt, no grass cap — a correct material-transition signal for the
  underside frame).

Both output dimensions are unchanged from Phase 18's procedurally-generated
placeholders — `src/main.js`'s existing `loadSprite(...)` calls read these
exact sheets with zero code changes, as long as the dimension asserts below
hold.

The player is the ONE asset that must NOT recede against the game's
near-black (#0a0a0a) background (see `generate-art-assets.py`'s own docstring
for the "invisible player sprite" investigation this project already went
through once) — so PLAYER_PALETTE stays a bright, light-on-dark palette,
while ENVIRONMENT_PALETTE (ground/tileset) stays dark-grunge. The two palette
lists are never mixed (Common Pitfall #4 from 20-RESEARCH.md).
"""

import json
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_kenney-src")

# Player-only palette (bright, must read against #0a0a0a) — the exact locked
# hex tokens already established in scripts/generate-art-assets.py's
# BLACK/PLAYER_HEAD/PLAYER_BODY/PLAYER_SHADOW/PLAYER_ACCENT constants, plus
# the 0x444444 dark-grey token from 20-RESEARCH.md's tested Pattern 2 example.
# No new hex values invented here.
PLAYER_PALETTE = [
    (0x0A, 0x0A, 0x0A),  # near-black (outline/background fill)
    (0xE8, 0xE8, 0xE8),  # bright highlight (project's #e8e8e8 label color)
    (0xD8, 0xD8, 0xD8),  # body light
    (0x90, 0x90, 0x90),  # mid-grey shadow/limb definition
    (0x44, 0x44, 0x44),  # dark grey
    (0x00, 0xFF, 0x88),  # neon-green accent (project's XP/highlight accent)
]

# Environment palette (dark-grunge, background/tileset assets).
#
# REVISED after real human sign-off feedback (2026-07-04): the original
# BLACK..EDGE_GREY ramp (0x0a-0x2a, luminance 10-42) was confirmed live-in-game
# to be effectively invisible against the #0a0a0a stage background — "ledges
# are invisible/also black", "background is all black". Cross-checked against
# this project's own known-good, never-touched assets (spike.png/goal.png,
# real CC0 art shipped since v3.0): those reach luminance up to 245 — a wide,
# clearly-visible range, not a razor-thin near-black band. This revised
# palette keeps the dark-grunge MOOD (no bright saturated hues, matches the
# locked #0a0a0a/#333333/#444444 border tokens from CLAUDE.md/PROJECT.md) but
# widens the actual luminance ramp so ground/parallax/title-bg genuinely read
# as distinct from the void, the same way spike/goal always have.
ENVIRONMENT_PALETTE = [
    (0x0A, 0x0A, 0x0A),  # BLACK — matches stage bg, used for true voids/outlines only
    (0x22, 0x22, 0x22),  # low-visibility dark grey
    (0x33, 0x33, 0x33),  # locked "borders/dividers" token (CLAUDE.md)
    (0x44, 0x44, 0x44),  # locked "borders/dividers" token (CLAUDE.md)
    (0x66, 0x66, 0x66),  # mid grey — clearly visible material highlight
    (0x88, 0x88, 0x88),  # light grey — strong edge/seam highlight
    (0x0F, 0x0F, 0x1A),  # BLUE_TINT — cool-mood accent, kept for far-layer atmosphere
]


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    print(f"generated {os.path.relpath(path, ROOT)} {img.size}")


def _build_palette_image(colors):
    """colors: up to 256 (r,g,b) tuples — the ONLY colors output pixels may use.

    Unused palette slots are filled by CYCLING the real colors (not a (0,0,0)
    filler) — otherwise `quantize()` can pick an unused all-black filler slot
    as the "nearest" match for dark source pixels, silently introducing a
    color outside the declared locked set (confirmed this session: ~20% of
    player.png pixels landed on bare (0,0,0) instead of the intended
    (0x0a,0x0a,0x0a) token before this fix).
    """
    pal_img = Image.new("P", (1, 1))
    flat = []
    for i in range(256):
        flat.extend(colors[i % len(colors)])
    pal_img.putpalette(flat)
    return pal_img


def _remap(src_rgba, colors):
    """Nearest-color palette remap (Pattern 2) — preserves the alpha mask.

    Suitable when `colors` spans a wide luminance range (e.g. PLAYER_PALETTE,
    10-232): raw RGB nearest-neighbor keeps hue identity (the neon-green accent
    must stay green, not just "bright").
    """
    rgb = src_rgba.convert("RGB")
    pal_img = _build_palette_image(colors)
    q = rgb.quantize(palette=pal_img, dither=Image.Dither.NONE)
    result = q.convert("RGB").convert("RGBA")
    if src_rgba.mode == "RGBA":
        result.putalpha(src_rgba.split()[-1])
    return result


def _remap_luminance(src_rgba, colors):
    """Luminance-ramp palette remap for narrow/dark palettes (e.g.
    ENVIRONMENT_PALETTE, 10-42 — a ~13% slice of the 0-255 range).

    Raw RGB nearest-neighbor collapses real source art onto a handful of
    near-identical dark buckets when the target palette's own dynamic range is
    this narrow (confirmed this session: Kenney's grass/dirt tiles, luminance
    0-186, quantized via `_remap` to just 2 colors with 99% single-color fill —
    all edge/material-transition detail lost). Instead, normalize the source's
    OWN luminance range to 0-1, then map each pixel to the nearest palette
    entry by luminance rank (perceptual luma), preserving relative light/dark
    structure (silhouette edges, material transitions) even though absolute
    hue is discarded — appropriate here since the whole palette is achromatic
    dark greys anyway.
    """
    rgb = src_rgba.convert("RGB")
    grey = rgb.convert("L")
    lo, hi = grey.getextrema()
    span = max(hi - lo, 1)

    ranked = sorted(colors, key=lambda c: 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2])
    n = len(ranked)

    px_in = grey.load()
    out = Image.new("RGB", rgb.size)
    px_out = out.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            norm = (px_in[x, y] - lo) / span  # 0..1, stretched to this image's own range
            idx = min(n - 1, int(norm * n))
            px_out[x, y] = ranked[idx]

    result = out.convert("RGBA")
    if src_rgba.mode == "RGBA":
        result.putalpha(src_rgba.split()[-1])
    return result


def build_player():
    """Kenney "Platformer Characters" (Adventurer) -> assets/player.png (80x32, 5x16x32).

    Pattern 1: ONE shared scale factor (derived from the tallest content bbox
    across all 5 poses) is applied to every frame — never fit each frame
    independently, which would make the character visibly grow/shrink between
    idle/run/jump (Common Pitfall #2).
    """
    target_w, target_h = 16, 32
    pose_files = [
        "adventurer_idle.png",  # frame 0 — idle
        "adventurer_stand.png",  # frame 1 — second idle/stand pose
        "adventurer_walk1.png",  # frame 2 — run loop
        "adventurer_walk2.png",  # frame 3 — run loop
        "adventurer_jump.png",  # frame 4 — jump
    ]

    loaded = []
    for fname in pose_files:
        im = Image.open(os.path.join(SRC, "platformer-characters", fname)).convert("RGBA")
        loaded.append((im, im.getbbox()))

    max_content_h = max(bbox[3] - bbox[1] for _, bbox in loaded)
    scale = target_h / max_content_h  # height-bound scale, shared across all frames

    sheet = Image.new("RGBA", (target_w * len(pose_files), target_h), (0, 0, 0, 0))
    for i, (im, bbox) in enumerate(loaded):
        cropped = im.crop(bbox)
        new_w = max(1, round(cropped.width * scale))
        new_h = max(1, round(cropped.height * scale))
        resized = cropped.resize((new_w, new_h), Image.NEAREST)  # NEAREST only — Pitfall 6
        frame = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        px = (target_w - new_w) // 2  # center horizontally (clips if wider than target_w)
        py = target_h - new_h  # bottom-align feet
        frame.paste(resized, (px, py), resized)
        sheet.paste(frame, (i * target_w, 0), frame)

    remapped = _remap(sheet, PLAYER_PALETTE)
    assert remapped.size == (80, 32), f"player sheet wrong size: {remapped.size}"
    save(remapped.convert("RGB"), os.path.join(ROOT, "assets", "player.png"))


def build_ground():
    """Kenney "Pixel Platformer" grass/dirt tiles -> assets/tiles/ground.png (80x16, 5x16x16).

    Pattern 3: tile_0000-0003 are real grass-over-dirt material-transition
    tiles (hand-drawn noise variants, not per-pixel random noise); tile_0004
    is plain dirt with no grass cap — a correct material signal for the
    underside frame, not a fabricated edge shape (Common Pitfall #3).
    """
    target_w, target_h = 16, 16
    frame_source_tiles = [
        "tile_0000.png",  # frame 0 — single
        "tile_0001.png",  # frame 1 — left
        "tile_0002.png",  # frame 2 — center
        "tile_0003.png",  # frame 3 — right
        "tile_0004.png",  # frame 4 — underside (plain dirt, no grass cap)
    ]

    sheet = Image.new("RGBA", (target_w * len(frame_source_tiles), target_h), (0, 0, 0, 0))
    for i, fname in enumerate(frame_source_tiles):
        im = Image.open(os.path.join(SRC, "pixel-platformer", fname)).convert("RGBA")
        resized = im.resize((target_w, target_h), Image.NEAREST)
        sheet.paste(resized, (i * target_w, 0), resized)

    remapped = _remap_luminance(sheet, ENVIRONMENT_PALETTE)
    assert remapped.size == (80, 16), f"ground sheet wrong size: {remapped.size}"
    save(remapped.convert("RGB"), os.path.join(ROOT, "assets", "tiles", "ground.png"))


def build_ground_theme(theme_id, palette):
    """Per-level-theme variant of build_ground() (VIS-03; Phase 26 Plan 03).

    Byte-identical body to build_ground() above (same source tiles, same
    _remap_luminance call) except the sub-palette is a parameter and the
    output path is suffixed — the original build_ground()/ground.png stays
    an untouched fallback asset.
    """
    target_w, target_h = 16, 16
    frame_source_tiles = [
        "tile_0000.png",  # frame 0 — single
        "tile_0001.png",  # frame 1 — left
        "tile_0002.png",  # frame 2 — center
        "tile_0003.png",  # frame 3 — right
        "tile_0004.png",  # frame 4 — underside (plain dirt, no grass cap)
    ]

    sheet = Image.new("RGBA", (target_w * len(frame_source_tiles), target_h), (0, 0, 0, 0))
    for i, fname in enumerate(frame_source_tiles):
        im = Image.open(os.path.join(SRC, "pixel-platformer", fname)).convert("RGBA")
        resized = im.resize((target_w, target_h), Image.NEAREST)
        sheet.paste(resized, (i * target_w, 0), resized)

    remapped = _remap_luminance(sheet, palette)
    assert remapped.size == (80, 16), f"ground-{theme_id} sheet wrong size: {remapped.size}"
    save(remapped.convert("RGB"), os.path.join(ROOT, "assets", "tiles", f"ground-{theme_id}.png"))


# Per-layer environment sub-palettes — all reused from ENVIRONMENT_PALETTE's
# existing tokens (never invented). REVISED after real human sign-off feedback
# (2026-07-04, see ENVIRONMENT_PALETTE's comment above): each layer now spans
# a genuinely visible luminance range rather than a razor-thin near-black
# band, while far < near-mid < mid still preserves relative depth-ordering
# (far stays faintest/most-distant-reading, mid is the brightest/most
# structurally readable layer since it carries the temple/castle/tower
# "horizon rhythm" ART-07 requires). The luminance-ramp remap (not raw
# nearest-RGB) is what makes even a modest palette size preserve real
# silhouette structure (see _remap_luminance docstring).
ENVIRONMENT_PALETTE_FAR = [ENVIRONMENT_PALETTE[0], ENVIRONMENT_PALETTE[6], ENVIRONMENT_PALETTE[3]]
ENVIRONMENT_PALETTE_MID = [
    ENVIRONMENT_PALETTE[0],
    ENVIRONMENT_PALETTE[1],
    ENVIRONMENT_PALETTE[3],
    ENVIRONMENT_PALETTE[4],
    ENVIRONMENT_PALETTE[5],
]
ENVIRONMENT_PALETTE_NEAR = [ENVIRONMENT_PALETTE[0], ENVIRONMENT_PALETTE[1], ENVIRONMENT_PALETTE[2], ENVIRONMENT_PALETTE[4]]
ENVIRONMENT_PALETTE_TITLE = [
    ENVIRONMENT_PALETTE[0],
    ENVIRONMENT_PALETTE[1],
    ENVIRONMENT_PALETTE[3],
    ENVIRONMENT_PALETTE[5],
    ENVIRONMENT_PALETTE[6],
]


# --- Per-level-theme accent hues (VIS-02/VIS-03; Phase 26 Plans 02/03/12) ---
#
# PALETTE_HEX mirror: these 8 RGB tuples MUST stay hand-synced with
# src/config.js's CONFIG.PALETTE.ACCENT_* tokens — there is no cross-language
# import (Python has no path into the JS CONFIG object), same convention
# already established for ENVIRONMENT_PALETTE / PLAYER_PALETTE above. Values
# below match config.js's CURRENT hex literals (MOSS/SLATE/RUST unchanged
# since Plan 26-02's WCAG brightening fix; FERN/TEAL/STEEL/CLAY/EMBER added
# in Plan 26-12's 3->8 accent expansion — see 26-12-SUMMARY.md).
ACCENT_MOSS = (0x47, 0x68, 0x47)  # dark moss green — level 1
ACCENT_FERN = (0x4A, 0x70, 0x58)  # warm mid-green — level 2
ACCENT_TEAL = (0x45, 0x70, 0x70)  # green-to-blue transitional — level 3
ACCENT_SLATE = (0x4E, 0x64, 0x78)  # cold blue-grey — level 4
ACCENT_STEEL = (0x52, 0x5E, 0x82)  # cooler blue-grey than slate — level 5
ACCENT_CLAY = (0x70, 0x5A, 0x48)  # warm grey-brown, toward rust — level 6
ACCENT_RUST = (0x8C, 0x50, 0x36)  # muted rust/umber — level 7
ACCENT_EMBER = (0xA8, 0x50, 0x2C)  # harshest/most saturated stop — level 8


def _accent_sub(base, primary_color):
    """Return a copy of `base` with an accent hue substituted into the
    existing "mid grey / clearly-visible material highlight" slot (index 4
    in the full 7-entry ENVIRONMENT_PALETTE).

    ENVIRONMENT_PALETTE_FAR/_MID/_NEAR are shorter derived slices (3/5/4
    entries) that don't all literally reach index 4 — when the target index
    is out of range this appends the color as one extra luma bucket instead
    of replacing an existing entry. This is functionally equivalent either
    way: _remap_luminance (above) re-sorts every color list by luminance
    before use, so neither the original index position nor exact list
    length — only which colors are present — affects the rendered pixels.
    """
    lst = list(base)

    def _set(idx, color):
        if idx < len(lst):
            lst[idx] = color
        else:
            lst.append(color)

    _set(4, primary_color)
    return lst


def _mid_accent_sub(base, primary_color):
    """MID-layer-specific accent substitution (Plan 26-08 checkpoint fix).

    Bug this replaces: `_accent_sub` above only overwrites ONE slot (index 4,
    which for ENVIRONMENT_PALETTE_MID's 5-entry list is originally P5=0x88
    luma136), leaving the adjacent P4=0x66 (luma102) slot untouched. The
    `mid` layer's own composited source art (hills1.png + temple/castle/tower
    motifs) has a dominant fill luminance that _remap_luminance's per-image
    normalization always buckets into this palette's TOP rank (empirically
    confirmed: idx 4 of 5, every theme, since the source geometry is
    level-invariant — only the accent recolor changes). Whichever color ends
    up ranked highest AFTER _remap_luminance re-sorts by luminance is what
    the player actually sees as the hill fill. All 8 hand-tuned dark-grunge
    accent hues (Plan 26-02/26-12, already human-signed-off — their hex
    values are NOT changed by this fix) have luma ~90-102, clustered BELOW
    P4's 102 for 7 of 8 accents (only EMBER's 102.2 narrowly clears it) — so
    the untouched P4 slot silently kept winning the top rank for every theme
    except 8, making level-01..07's mid hill render as identical neutral
    grey despite each theme's own distinct accent (found via real in-browser
    screenshot review at the Plan 26-08 checkpoint, confirmed via direct
    pixel-luma inspection of the baked assets before this fix).

    Fix: replace BOTH of the two highest slots (indices 3 and 4) with
    accent-derived shades — a darker body tone (scaled 0.8x per channel,
    verified to stay above the next-highest surviving base entry, P3's
    luma68, for even the darkest accent, MOSS at luma90.4 -> shade luma72.2)
    and the accent itself as the brighter highlight. Whichever of the top
    two ranks the dominant source pixel lands on, the result is now always
    accent-family, regardless of the accent's own exact luma — removing the
    fragile exact-luma-tie dependency `_accent_sub` had. Scoped to the `mid`
    sub-palette originally (far/ground already read correctly distinct
    per-theme and still use `_accent_sub` unchanged); `near` shared this same
    underlying pattern and was left out of scope here — see 26-08-SUMMARY.md
    — but was confirmed to exhibit the identical bug (all 8 baked
    `near-theme-*.png` assets pixel-sampled: themes 1-7 shared an identical
    (102,102,102) dominant fill, only theme-8/EMBER distinct — same
    exact-luma-tie failure mode) and fixed with the mirrored
    `_near_accent_sub` below (WR-03 follow-up, 2026-07-08).
    """
    lst = list(base)

    def _set(idx, color):
        if idx < len(lst):
            lst[idx] = color
        else:
            lst.append(color)

    shade = tuple(max(0, round(c * 0.8)) for c in primary_color)
    _set(3, shade)
    _set(4, primary_color)
    return lst


def _near_accent_sub(base, primary_color):
    """NEAR-layer-specific accent substitution (WR-03 follow-up fix, mirrors
    `_mid_accent_sub` above).

    Bug this replaces: `_accent_sub` targets index 4, but
    ENVIRONMENT_PALETTE_NEAR is only a 4-entry list (indices 0-3), so index 4
    is always out of range and the accent gets APPENDED as a 5th bucket
    instead of overwriting anything — the original P4=0x66 (luma102) slot
    (last of the 4 base entries) survives untouched. Confirmed empirically:
    pixel-sampling all 8 baked `near-theme-*.png` assets showed themes 1-7
    sharing an identical (102,102,102) dominant fill (the untouched P4 slot
    winning top rank after `_remap_luminance` re-sorts by luminance, since 7
    of 8 accent hues have luma <102) — only theme-8/EMBER (luma102.2, the one
    accent that narrowly clears 102) rendered distinct. The exact same
    exact-luma-tie fragility as `_mid_accent_sub` was written to fix.

    Fix: replace BOTH of the two highest slots (indices 2 and 3 — the last
    two of this 4-entry list) with accent-derived shades, same shade
    formula and reasoning as `_mid_accent_sub`. The next-highest surviving
    base entry is index 1 (luma34), which the darkest accent's shade
    (MOSS -> luma72.2) safely stays above.
    """
    lst = list(base)

    def _set(idx, color):
        if idx < len(lst):
            lst[idx] = color
        else:
            lst.append(color)

    shade = tuple(max(0, round(c * 0.8)) for c in primary_color)
    _set(2, shade)
    _set(3, primary_color)
    return lst


# Theme-to-level mapping — one dedicated accent per level (Plan 26-12
# mid-execution revision, 2026-07-07: previously 3 shared accents produced
# identical baked output for level pairs 1/2, 3/4, 7/8, undercutting VIS-03's
# distinctness requirement; see 26-CONTEXT.md addendum). Phase 26 Plan 06
# reads this table when it sets each level descriptor's `theme` field; keep
# this comment block in sync with that plan rather than re-deriving the
# mapping:
#   theme-1 -> level-01 : ACCENT_MOSS
#   theme-2 -> level-02 : ACCENT_FERN
#   theme-3 -> level-03 : ACCENT_TEAL
#   theme-4 -> level-04 : ACCENT_SLATE
#   theme-5 -> level-05 : ACCENT_STEEL
#   theme-6 -> level-06 : ACCENT_CLAY
#   theme-7 -> level-07 : ACCENT_RUST
#   theme-8 -> level-08 : ACCENT_EMBER
_THEME_ACCENTS = {
    "theme-1": ACCENT_MOSS,
    "theme-2": ACCENT_FERN,
    "theme-3": ACCENT_TEAL,
    "theme-4": ACCENT_SLATE,
    "theme-5": ACCENT_STEEL,
    "theme-6": ACCENT_CLAY,
    "theme-7": ACCENT_RUST,
    "theme-8": ACCENT_EMBER,
}

THEME_PALETTES = {
    theme_id: {
        "far": _accent_sub(ENVIRONMENT_PALETTE_FAR, accent),
        "mid": _mid_accent_sub(ENVIRONMENT_PALETTE_MID, accent),
        "near": _near_accent_sub(ENVIRONMENT_PALETTE_NEAR, accent),
        "ground": _accent_sub(ENVIRONMENT_PALETTE, accent),
    }
    for theme_id, accent in _THEME_ACCENTS.items()
}


def _load_be(fname):
    return Image.open(os.path.join(SRC, "background-elements", fname)).convert("RGBA")


def _scale_to_width(im, target_w):
    scale = target_w / im.width
    return im.resize((target_w, max(1, round(im.height * scale))), Image.LANCZOS)


def build_parallax():
    """Kenney "Background Elements" silhouettes -> assets/parallax/{far,mid,near}.png.

    Pattern 4: composite real silhouette elements (mountains/hills/temple/
    castle/tower) onto blank canvases at the exact locked dimensions, bottom-
    anchored, then luminance-remap onto a narrow per-layer dark palette. The
    mid layer uses at least two of temple/castle/tower for ART-07's "distant
    ruin/structure silhouette with a deliberate horizon rhythm" — real
    structural variety, not one repeated shape.
    """
    # Far (640x120): pointy_mountains.png as the sole, faintest, most distant base layer.
    far_w, far_h = 640, 120
    far = Image.new("RGBA", (far_w, far_h), (0, 0, 0, 0))
    mtn = _scale_to_width(_load_be("pointy_mountains.png"), far_w)
    far.paste(mtn.crop((0, max(0, mtn.height - far_h), far_w, mtn.height)), (0, far_h - min(far_h, mtn.height)), mtn.crop((0, max(0, mtn.height - far_h), far_w, mtn.height)))
    far_remapped = _remap_luminance(far, ENVIRONMENT_PALETTE_FAR)
    assert far_remapped.size == (far_w, far_h), f"far layer wrong size: {far_remapped.size}"
    save(far_remapped.convert("RGB"), os.path.join(ROOT, "assets", "parallax", "far.png"))

    # Mid (640x144): hills1.png base + temple/castle/tower at intervals — the
    # "horizon rhythm" ART-07 requires (real structural variety, 3 distinct shapes).
    mid_w, mid_h = 640, 144
    mid = Image.new("RGBA", (mid_w, mid_h), (0, 0, 0, 0))
    hills = _scale_to_width(_load_be("hills1.png"), mid_w)
    mid.paste(hills.crop((0, max(0, hills.height - mid_h), mid_w, hills.height)), (0, mid_h - min(mid_h, hills.height)), hills.crop((0, max(0, hills.height - mid_h), mid_w, hills.height)))
    for fname, x, scale in [("temple.png", 60, 0.55), ("castle.png", 280, 0.55), ("tower.png", 500, 0.55)]:
        motif = _load_be(fname)
        motif = motif.resize((max(1, round(motif.width * scale)), max(1, round(motif.height * scale))), Image.LANCZOS)
        mid.paste(motif, (x, mid_h - motif.height), motif)
    mid_remapped = _remap_luminance(mid, ENVIRONMENT_PALETTE_MID)
    assert mid_remapped.size == (mid_w, mid_h), f"mid layer wrong size: {mid_remapped.size}"
    save(mid_remapped.convert("RGB"), os.path.join(ROOT, "assets", "parallax", "mid.png"))

    # Near (640x90): hills2.png, subtler/darker than mid — closest, most muted layer.
    near_w, near_h = 640, 90
    near = Image.new("RGBA", (near_w, near_h), (0, 0, 0, 0))
    hills2 = _scale_to_width(_load_be("hills2.png"), near_w)
    near.paste(hills2.crop((0, max(0, hills2.height - near_h), near_w, hills2.height)), (0, near_h - min(near_h, hills2.height)), hills2.crop((0, max(0, hills2.height - near_h), near_w, hills2.height)))
    near_remapped = _remap_luminance(near, ENVIRONMENT_PALETTE_NEAR)
    assert near_remapped.size == (near_w, near_h), f"near layer wrong size: {near_remapped.size}"
    save(near_remapped.convert("RGB"), os.path.join(ROOT, "assets", "parallax", "near.png"))


def build_parallax_theme(theme_id, palette):
    """Per-level-theme variant of build_parallax() (VIS-03; Phase 26 Plan 03).

    Byte-identical body to build_parallax() above (same source silhouette
    elements, same compositing) except `palette` is a dict of far/mid/near
    sub-palettes and the output paths are suffixed — the original
    build_parallax()/{far,mid,near}.png stay untouched fallback assets.
    """
    far_w, far_h = 640, 120
    far = Image.new("RGBA", (far_w, far_h), (0, 0, 0, 0))
    mtn = _scale_to_width(_load_be("pointy_mountains.png"), far_w)
    far.paste(mtn.crop((0, max(0, mtn.height - far_h), far_w, mtn.height)), (0, far_h - min(far_h, mtn.height)), mtn.crop((0, max(0, mtn.height - far_h), far_w, mtn.height)))
    far_remapped = _remap_luminance(far, palette["far"])
    assert far_remapped.size == (far_w, far_h), f"far-{theme_id} layer wrong size: {far_remapped.size}"
    save(far_remapped.convert("RGB"), os.path.join(ROOT, "assets", "parallax", f"far-{theme_id}.png"))

    mid_w, mid_h = 640, 144
    mid = Image.new("RGBA", (mid_w, mid_h), (0, 0, 0, 0))
    hills = _scale_to_width(_load_be("hills1.png"), mid_w)
    mid.paste(hills.crop((0, max(0, hills.height - mid_h), mid_w, hills.height)), (0, mid_h - min(mid_h, hills.height)), hills.crop((0, max(0, hills.height - mid_h), mid_w, hills.height)))
    for fname, x, scale in [("temple.png", 60, 0.55), ("castle.png", 280, 0.55), ("tower.png", 500, 0.55)]:
        motif = _load_be(fname)
        motif = motif.resize((max(1, round(motif.width * scale)), max(1, round(motif.height * scale))), Image.LANCZOS)
        mid.paste(motif, (x, mid_h - motif.height), motif)
    mid_remapped = _remap_luminance(mid, palette["mid"])
    assert mid_remapped.size == (mid_w, mid_h), f"mid-{theme_id} layer wrong size: {mid_remapped.size}"
    save(mid_remapped.convert("RGB"), os.path.join(ROOT, "assets", "parallax", f"mid-{theme_id}.png"))

    near_w, near_h = 640, 90
    near = Image.new("RGBA", (near_w, near_h), (0, 0, 0, 0))
    hills2 = _scale_to_width(_load_be("hills2.png"), near_w)
    near.paste(hills2.crop((0, max(0, hills2.height - near_h), near_w, hills2.height)), (0, near_h - min(near_h, hills2.height)), hills2.crop((0, max(0, hills2.height - near_h), near_w, hills2.height)))
    near_remapped = _remap_luminance(near, palette["near"])
    assert near_remapped.size == (near_w, near_h), f"near-{theme_id} layer wrong size: {near_remapped.size}"
    save(near_remapped.convert("RGB"), os.path.join(ROOT, "assets", "parallax", f"near-{theme_id}.png"))


def build_title_bg():
    """Kenney "Background Elements" composite -> assets/tiles/title-bg.png (640x360).

    Composites castle + hills1 + a cloud element into one very-low-contrast
    backdrop scene per 18-UI-SPEC.md's title-bg art direction (dark-grunge,
    no animation, no bright/rapidly moving elements).
    """
    w, h = 640, 360
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    hills = _scale_to_width(_load_be("hills1.png"), w)
    canvas.paste(hills.crop((0, max(0, hills.height - 140), w, hills.height)), (0, h - min(140, hills.height)), hills.crop((0, max(0, hills.height - 140), w, hills.height)))

    castle = _load_be("castle.png")
    castle = castle.resize((max(1, round(castle.width * 1.1)), max(1, round(castle.height * 1.1))), Image.LANCZOS)
    canvas.paste(castle, ((w - castle.width) // 2, h - 140 - castle.height + 30), castle)

    cloud = _load_be("cloud1.png")
    cloud = cloud.resize((max(1, round(cloud.width * 0.8)), max(1, round(cloud.height * 0.8))), Image.LANCZOS)
    canvas.paste(cloud, (80, 60), cloud)
    canvas.paste(cloud, (420, 40), cloud)

    remapped = _remap_luminance(canvas, ENVIRONMENT_PALETTE_TITLE)
    assert remapped.size == (w, h), f"title-bg wrong size: {remapped.size}"
    save(remapped.convert("RGB"), os.path.join(ROOT, "assets", "tiles", "title-bg.png"))


def build_door():
    """6 Color Dungeon 16x16 gate/archway tile -> assets/door.png (32x64).

    VIS-04 (Phase 26 Plan 04): replaces the flat-color rect+glyph placeholder
    that has shipped since Phase 18. Crops the sheet's closed-lattice-gate +
    archway-base assembly, scales it 2/3 down to the locked CONFIG.DOOR
    dimensions, and remaps it through the same luminance-ramp pipeline every
    other environment asset uses. The door is a universal barrier element
    (per 26-RESEARCH.md's Anti-Pattern note: danger/reward/barrier elements
    must not be re-themed), so it stays on the base ENVIRONMENT_PALETTE, not
    a per-theme variant.
    """
    target_w, target_h = 32, 64
    sheet_path = os.path.join(
        ROOT, "assets", "_opengameart-src", "6-color-dungeon", "16x16-dungeon-tiles.png"
    )
    im = Image.open(sheet_path).convert("RGBA")
    crop = im.crop((0, 64, 48, 160))  # 48x96 — closed lattice gate + archway base
    resized = crop.resize((target_w, target_h), Image.NEAREST)

    remapped = _remap_luminance(resized, ENVIRONMENT_PALETTE)
    assert remapped.size == (target_w, target_h), f"door sprite wrong size: {remapped.size}"
    save(remapped.convert("RGBA"), os.path.join(ROOT, "assets", "door.png"))


def build_enemies():
    """Kenney "New Platformer Pack" enemy sprites -> assets/enemy-{1,2,3}.png (32x32 each).

    VIS-04 (Phase 26 Plan 04): replaces the flat-color rect+glyph placeholder
    that has shipped since Phase 18, with 3 distinct enemy variants (saw =
    mechanical, barnacle = one-eyed horned monster, fly = insect). Unlike
    build_player()'s shared-scale pose set, these are 3 unrelated static
    single-frame sprites, so each gets an INDEPENDENT scale factor — no
    shared walk-cycle proportion to preserve. Same universal-barrier
    reasoning as build_door(): enemies stay on the base ENVIRONMENT_PALETTE,
    never per-theme tinted.
    """
    target_w, target_h = 32, 32
    content_target = 28  # px — largest bbox dimension after scaling, leaves a small margin
    sources = [
        ("saw_rest.png", "enemy-1.png"),
        ("barnacle_attack_a.png", "enemy-2.png"),
        ("fly_rest.png", "enemy-3.png"),
    ]

    for fname, out_name in sources:
        im = Image.open(os.path.join(SRC, "new-platformer-pack", fname)).convert("RGBA")
        bbox = im.getbbox()
        cropped = im.crop(bbox)
        scale = content_target / max(cropped.width, cropped.height)
        new_w = max(1, round(cropped.width * scale))
        new_h = max(1, round(cropped.height * scale))
        resized = cropped.resize((new_w, new_h), Image.NEAREST)

        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        px = (target_w - new_w) // 2
        py = (target_h - new_h) // 2
        canvas.paste(resized, (px, py), resized)

        remapped = _remap_luminance(canvas, ENVIRONMENT_PALETTE)
        assert remapped.size == (target_w, target_h), f"{out_name} wrong size: {remapped.size}"
        save(remapped.convert("RGBA"), os.path.join(ROOT, "assets", out_name))


FONT_PATH = os.path.join(ROOT, "assets", "_font-src", "monogram.ttf")

# Logo fill/stroke colors (BRAND-01/BRAND-03; Phase 26 Plan 07) — mirror
# CONFIG.PALETTE.ACCENT_MOSS/REWARD's CURRENT live hex values from
# src/config.js (same "read live, don't hand-copy a stale plan literal"
# principle Plan 26-03 established for THEME_PALETTES above). Named
# LOGO_FILL/LOGO_STROKE rather than reusing the module-level ACCENT_MOSS
# constant defined earlier in this file: that constant is Plan 26-12's
# per-level-theme accent (theme-1's ground/parallax tint) and happens to
# share the same hex value as CONFIG.PALETTE.ACCENT_MOSS today only by
# coincidence of which level is first — redefining ACCENT_MOSS here would
# silently collide with that unrelated, already-in-use module constant.
LOGO_FILL = (0x47, 0x68, 0x47)  # == CONFIG.PALETTE.ACCENT_MOSS
LOGO_STROKE = (0x00, 0xFF, 0x88)  # == CONFIG.PALETTE.REWARD


LOGO_TEXT = "NOX RUN"
LOGO_FONT_SIZE = 32  # px — deliberately small (not 64): keeps the padded source
# canvas below BOTH bake targets (360x90 hero, 144x36 badge) so Image.NEAREST
# always scales UP, never down — a downscale-via-NEAREST softened/lost stroke
# pixels at badge size in this plan's first attempt (human-verify feedback,
# 2026-07-07: "logo... hard to read, especially on the level select screen").
LOGO_STROKE_WIDTH = 2  # px — kept absolute (not scaled with font size); at
# LOGO_FONT_SIZE 32 this stroke reads as a clearly visible neon edge without
# fully engulfing the smaller glyph's dark fill (a size-64/stroke-2 pairing
# tried during Task 1 left almost no fill visible — chunky-but-hard-to-read).
LOGO_LETTER_SPACING = 4  # px of EXTRA gap inserted after each character's
# own monospace advance width (human-verify feedback, 2026-07-07: "slightly
# more spacing between the letters would make it easier to read").


def build_logo():
    """Bake the "NOX RUN" wordmark -> assets/logo-hero.png (360x90) and
    assets/logo-badge.png (144x36) using the CC0 "monogram" pixel font
    (BRAND-01/BRAND-03; Phase 26 Plan 07).

    Renders CHARACTER BY CHARACTER (not one draw.text(long_string) call) at a
    fixed per-character pitch (monogram's own uniform monospace advance width
    + LOGO_LETTER_SPACING extra gap) onto a small transparent source canvas —
    Pillow's draw.text() has no letter-spacing/tracking parameter, so this is
    the direct way to add gap between glyphs. The canvas is sized to the
    stroked text's own ink bbox (using the SPACED total width, not the
    single-call bbox), height-rounded so the canvas is an exact 4:1
    width:height ratio — this is what lets both target canvases below
    (360x90 and 144x36, both also exactly 4:1) scale up UNIFORMLY, never a
    non-uniform/distorting stretch. `Image.NEAREST` scales that SAME small
    source canvas independently to each target size (the badge is never
    derived by shrinking the hero PNG — each is its own baked NEAREST scale,
    per this plan's explicit "do not runtime-scale one into the other"
    rule); NEAREST preserves the pixel font's crisp blocky edges instead of
    introducing anti-aliased smoothing on upscale — and LOGO_FONT_SIZE is
    deliberately chosen small enough that both scale steps are upscales.
    """
    font = ImageFont.truetype(FONT_PATH, LOGO_FONT_SIZE)
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))

    # monogram is a genuinely monospace font (every glyph reports the same
    # advance width) — confirmed live via font.getlength() before relying on
    # a single char_pitch for the whole string instead of per-glyph metrics.
    advance = font.getlength("N")
    char_pitch = advance + LOGO_LETTER_SPACING

    # Vertical extent + left-side stroke overflow read from the ORIGINAL
    # single-call bbox (stroke_width bleeds a couple px left/above the
    # nominal glyph origin) — spacing only changes horizontal layout.
    full_bbox = probe.textbbox((0, 0), LOGO_TEXT, font=font, stroke_width=LOGO_STROKE_WIDTH)
    ink_h = full_bbox[3] - full_bbox[1]
    left_overflow = -full_bbox[0]

    ink_w = round(char_pitch * (len(LOGO_TEXT) - 1) + advance) + 2 * left_overflow
    canvas_w = ink_w
    canvas_h = round(canvas_w / 4)  # exact 4:1 canvas -> uniform hero/badge scale
    pad_top = (canvas_h - ink_h) // 2

    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    y = pad_top - full_bbox[1]
    for i, ch in enumerate(LOGO_TEXT):
        x = left_overflow + i * char_pitch
        draw.text(
            (x, y),
            ch,
            font=font,
            fill=(*LOGO_FILL, 255),
            stroke_width=LOGO_STROKE_WIDTH,
            stroke_fill=(*LOGO_STROKE, 255),
        )

    hero = canvas.resize((360, 90), Image.NEAREST)
    assert hero.size == (360, 90), f"logo-hero wrong size: {hero.size}"
    save(hero, os.path.join(ROOT, "assets", "logo-hero.png"))

    badge = canvas.resize((144, 36), Image.NEAREST)
    assert badge.size == (144, 36), f"logo-badge wrong size: {badge.size}"
    save(badge, os.path.join(ROOT, "assets", "logo-badge.png"))


def _load_live_palette():
    """Read CONFIG.PALETTE live from src/config.js via a node subprocess.

    Never hand-mirrored into a Python constant (avoids drift risk) — the
    exact same "single source of truth, no hardcoded hex copy" principle
    scripts/check-contrast.mjs already established, applied from the Python
    side. Returns an ordered dict of role name -> [r, g, b].
    """
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            "import { CONFIG } from './src/config.js'; console.log(JSON.stringify(CONFIG.PALETTE));",
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def build_palette_swatch():
    """CONFIG.PALETTE (live, all roles) -> 26-PALETTE-SWATCH.png (VIS-02).

    Debug-only proof image for the Task 5 human-verify checkpoint: one
    labeled swatch per CONFIG.PALETTE role, arranged in a fixed 4-column
    grid on a mid-grey canvas (so near-black roles like BG stay visible
    against the canvas edge). Not a runtime asset — never loaded by the game.
    """
    palette = _load_live_palette()

    cell_w, cell_h = 140, 70
    cols = 4
    margin = 12
    rows = (len(palette) + cols - 1) // cols

    canvas_w = margin + cols * (cell_w + margin)
    canvas_h = margin + rows * (cell_h + margin)
    canvas = Image.new("RGB", (canvas_w, canvas_h), (0x60, 0x60, 0x60))  # mid-grey
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()

    for i, (role, rgb) in enumerate(palette.items()):
        col = i % cols
        row = i // cols
        x0 = margin + col * (cell_w + margin)
        y0 = margin + row * (cell_h + margin)
        x1, y1 = x0 + cell_w, y0 + cell_h
        r, g, b = rgb[0], rgb[1], rgb[2]
        draw.rectangle([x0, y0, x1, y1], fill=(r, g, b))

        text_color = (0, 0, 0) if (r + g + b) > 384 else (255, 255, 255)
        label = f"{role}\n#{r:02x}{g:02x}{b:02x}"
        draw.multiline_text((x0 + 8, y0 + 8), label, fill=text_color, font=font)

    save(canvas, os.path.join(ROOT, ".planning", "phases", "26-grunge-palette-nox-run-rebrand", "26-PALETTE-SWATCH.png"))


if __name__ == "__main__":
    build_player()
    build_ground()
    build_parallax()
    build_title_bg()
    build_palette_swatch()
    for theme_id, palette in THEME_PALETTES.items():
        build_ground_theme(theme_id, palette["ground"])
        build_parallax_theme(theme_id, palette)
    build_door()
    build_enemies()
    build_logo()
