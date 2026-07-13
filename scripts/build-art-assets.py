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
GV_SRC = os.path.join(ROOT, "assets", "_gothicvania-src")

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
        bbox = im.getbbox()
        if bbox is None:
            raise ValueError(f"{fname}: fully transparent source frame, cannot derive content bbox")
        loaded.append((im, bbox))

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
    """Old-Dark-Castle-tileset-Files' wooden-door tile -> assets/door.png (32x64).

    ART-05 (Phase 33 Plan 01), v2: replaces the Kenney-adjacent "6 Color
    Dungeon" gate/archway crop (Phase 26) with a genuinely new crop sourced
    from the Gothicvania Patreon Collection's castle interior tileset, so the
    door reads as part of the same style-coherent Gothicvania castle biome as
    the already-shipped atlas/player/enemy assets.

    Crop verified this session (Phase 33 research): (664, 47, 698, 112) in
    old-dark-castle-interior-tileset.png (832x240) -- a 34x65px wooden door
    with stone frame + gold hinge/handle, near-exact fit for the locked
    32x64 footprint. Measured 0% pink/magenta hue (scripts/lib/pink_scan.py)
    -- no allowlist entry needed. Ships at NATIVE Gothicvania color (no
    _remap/_remap_luminance) to match the already-shipped castle biome
    atlas/player/enemy assets -- do NOT reuse the OLD build_door()'s
    Kenney-sourced remap pipeline (see 33-RESEARCH.md Architecture
    Patterns #3).
    """
    target_w, target_h = 32, 64
    sheet_path = os.path.join(
        GV_SRC, "gothicvaniapatreoncollection", " gothicvania patreon collection",
        "Old-dark-Castle-tileset-Files", "PNG", "old-dark-castle-interior-tileset.png",
    )
    im = Image.open(sheet_path).convert("RGBA")
    crop = im.crop((664, 47, 698, 112))  # 34x65 -- verified content-full, 0% pink
    resized = crop.resize((target_w, target_h), Image.NEAREST)  # near-1:1, minor squash

    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas.paste(resized, (0, 0), resized)
    assert canvas.size == (target_w, target_h), f"door sprite wrong size: {canvas.size}"
    save(canvas, os.path.join(ROOT, "assets", "door.png"))


def build_math_gate():
    """Gothicvania Church's barred-window/cross tile -> assets/math-gate.png (32x64).

    ART-05 (Phase 33 Plan 01): the math-gate mechanic previously had no
    sprite art of its own (a flat color()+outline()+text("?") panel). This
    bakes a genuinely new crop -- a barred iron-lattice window with a cross
    plaque, reading naturally as "locked" -- sourced from the Gothicvania
    Church pack's environment tileset.

    Crop verified this session (Phase 33 research): (240, 32, 272, 80) in
    tileset.png -- a 32x48px content-full crop, exact width match to
    CONFIG.MATH_GATE.W but 16px short of the 64px target height (no
    adjacent fillable content exists in the source to pad with instead, so
    a uniform vertical stretch is used -- same non-1:1 NEAREST-resize
    precedent as build_door()). Measured 0% pink/magenta hue
    (scripts/lib/pink_scan.py) -- no allowlist entry needed. Ships at
    NATIVE Gothicvania color (no _remap/_remap_luminance), same discipline
    as build_door() above.
    """
    target_w, target_h = 32, 64
    sheet_path = os.path.join(GV_SRC, "gothicvania church files", "ENVIRONMENT", "tileset.png")
    im = Image.open(sheet_path).convert("RGBA")
    crop = im.crop((240, 32, 272, 80))  # 32x48 -- verified content-full, 0% pink
    resized = crop.resize((target_w, target_h), Image.NEAREST)  # uniform vertical stretch

    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas.paste(resized, (0, 0), resized)
    assert canvas.size == (target_w, target_h), f"math-gate sprite wrong size: {canvas.size}"
    save(canvas, os.path.join(ROOT, "assets", "math-gate.png"))


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
        if bbox is None:
            raise ValueError(f"{fname}: fully transparent source frame, cannot derive content bbox")
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


# --- Phase 31 (ART-01): Gothicvania biome terrain atlases + parallax layers ---
#
# Extends this file's existing per-variant idiom (build_ground_theme() /
# build_parallax_theme()) with 4 biomes x (1 terrain atlas + 3 parallax
# layers), baked from the re-fetched Gothicvania (ansimuz) CC0 packs under
# GV_SRC. Every crop rectangle below was hand-identified via a throwaway
# Pillow crop-preview loop (visually verified against the real source
# sheet) BEFORE being hardcoded here -- never a generic/grid auto-slicer
# (T-31-09; SPIKE-FINDINGS.md's explicit warning that Gothicvania terrain
# sheets are non-grid, interlocking decorative blocks), matching
# build_door()'s existing hand-cropped-rectangle convention.


def hue_shift_band(im, band_lo, band_hi, delta, min_sat=30):
    """Rotate hue by `delta` for pixels whose hue is in [band_lo, band_hi]
    (PIL 0-255 hue units).

    Copied verbatim (body unchanged) from
    .planning/research/v6-scouting/styleboard.py's hue_shift_band() -- the
    same live-proven no-pink hue-conform pass already used to regenerate the
    4 style-board renders (Plan 31-02) -- reused here rather than
    reimplemented, per 31-RESEARCH.md's "Don't Hand-Roll" guidance.
    """
    rgba = im.convert("RGBA")
    a = rgba.getchannel("A")
    hsv = rgba.convert("RGB").convert("HSV")
    px = hsv.load()
    w, h = hsv.size
    for y in range(h):
        for x in range(w):
            hh, s, v = px[x, y]
            if s >= min_sat and band_lo <= hh <= band_hi:
                px[x, y] = ((hh + delta) % 256, s, v)
    out = hsv.convert("RGB").convert("RGBA")
    out.putalpha(a)
    return out


def _tile_to_width(im, target_w):
    """Tile `im` horizontally (paste repeats) to reach target_w.

    Gothicvania parallax layers are seamless-tileable narrow vertical strips
    meant to repeat across the screen width (unlike Kenney's "Background
    Elements" wide silhouettes, which build_parallax()'s _scale_to_width
    stretches to fit) -- so the correct bake here is repetition, not a
    scale, which would distort the source art's intended pixel density.
    """
    canvas = Image.new("RGBA", (target_w, im.height), (0, 0, 0, 0))
    x = 0
    while x < target_w:
        canvas.paste(im, (x, 0), im)
        x += im.width
    return canvas


def _bottom_anchor(im, target_w, target_h):
    """Bottom-anchor an already-tiled `im` (width == target_w) onto a
    target_h canvas, cropping overflow off the top or padding the top with
    transparency -- the same crop/paste idiom already used by
    build_parallax()/build_parallax_theme() above.
    """
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    src = im.crop((0, max(0, im.height - target_h), target_w, im.height))
    canvas.paste(src, (0, target_h - min(target_h, im.height)), src)
    return canvas


def _bake_biome_atlas(out_name, sheet_path, cap_rect, fill_rect, retint=None):
    """Shared crop -> [retint] -> paste -> save body for a 2-frame (cap + fill)
    biome terrain atlas (16x32 each, 32x32 total).

    NO SCALING and NO PALETTE REMAP -- both crops are taken at the source
    tileset's NATIVE resolution and keep their NATIVE Gothicvania colors. Every
    Gothicvania tileset here is on a 16px grid, so a 16x32 window is two real
    source cells, 1:1 pixels, and it repeats on the game's own 16px tile step.
    Two separate bugs made the old ground look like a grey placeholder, and both
    are fixed by that:

    1. `_remap_luminance(sheet, ENVIRONMENT_PALETTE)` collapsed every tile onto
       an achromatic grey ramp -- it discards hue by design. This is the SAME
       bug already removed from the parallax bake in commit caebfae ("stop
       crushing biome parallax layers to near-black"); it was simply never
       removed from the terrain bake, so the ground stayed grey while the
       backgrounds went back to full color. styleboard.py -- the normative spec
       per ART-PARITY-STEERING.md -- never remaps its ground either: swamp()
       tiles the raw tileset island straight onto the canvas.
    2. The crops were then SQUASHED into the 16px cell (swamp's ground tile is
       80px wide -- a 5x horizontal compression), which turned rock/moss texture
       into grey static. Human sign-off called it exactly that: "a placeholder
       grey area that the player walks on."

    `cap_rect` MUST therefore be exactly 16x32 (asserted below), and its TOP row
    MUST be the walkable ground surface: build.js stamps this frame once per
    16px column across a run, so whatever silhouette the crop has repeats every
    16px forever. Town and castle once pointed at a ROOF TRIANGLE and an ARCH
    PEAK (both picked as islands()[0] -- the largest island, which is the ground
    block only for swamp), and tiled into a sawtooth along every floor. Always
    verify a new cap_rect by tiling it before committing -- no automated gate
    looks at rendered pixels (ART-PARITY-STEERING.md); scripts/screenshot-phase33-terrain.mjs
    is the in-engine check.

    `retint`, if given, is a (band_lo, band_hi, delta) tuple applied to both
    crops via hue_shift_band() -- the board's own no-pink pass, and now the ONLY
    color transform in this bake.
    """
    target_w, target_h = 16, 32
    im = Image.open(sheet_path).convert("RGBA")
    for rect_name, rect in (("cap_rect", cap_rect), ("fill_rect", fill_rect)):
        rx0, ry0, rx1, ry1 = rect
        if rx0 < 0 or ry0 < 0 or rx1 > im.width or ry1 > im.height:
            raise ValueError(
                f"{sheet_path}: {rect_name} {rect} does not fit within sheet size "
                f"{im.size} -- crop rects need re-deriving (vendor pack may have changed)"
            )
        if (rx1 - rx0, ry1 - ry0) != (target_w, target_h):
            raise ValueError(
                f"{sheet_path}: {rect_name} {rect} is {rx1 - rx0}x{ry1 - ry0}, must be "
                f"exactly {target_w}x{target_h} -- terrain frames are native-resolution "
                f"tile cells and are never scaled (scaling is what turned the old ground "
                f"into grey static)"
            )
    cap = im.crop(cap_rect)
    fill = im.crop(fill_rect)

    if retint is not None:
        band_lo, band_hi, delta = retint
        cap = hue_shift_band(cap, band_lo, band_hi, delta)
        fill = hue_shift_band(fill, band_lo, band_hi, delta)

    sheet = Image.new("RGBA", (target_w * 2, target_h), (0, 0, 0, 0))
    sheet.paste(cap, (0, 0), cap)
    sheet.paste(fill, (target_w, 0), fill)

    assert sheet.size == (target_w * 2, target_h), f"atlas-{out_name} wrong size: {sheet.size}"
    save(sheet, os.path.join(ROOT, "assets", "tiles", f"atlas-{out_name}.png"))


def build_biome_atlas_swamp():
    """Gothicvania Swamp Evironment/tileset.png (336x112, note the pack's own
    "Evironment" misspelling) -> assets/tiles/atlas-swamp.png.

    Measured 0% dominant-pink (31-RESEARCH.md) -- no retint needed.
    """
    sheet_path = os.path.join(
        GV_SRC, "gothicvania_swamp_files", "Gothicvania Swamp files", "Evironment", "tileset.png"
    )
    _bake_biome_atlas(
        "swamp",
        sheet_path,
        # Native 16x32 cells from the MIDDLE of the 80x59 mossy-rock ground island
        # (32,5)-(112,64) -- an interior column, so it repeats seamlessly. The whole
        # island used to be squashed 80px -> 16px, which is what shredded the moss
        # texture into grey static.
        cap_rect=(64, 5, 80, 37),  # mossy top surface
        fill_rect=(64, 32, 80, 64),  # the same block's dirt body below it
    )


def build_biome_atlas_town():
    """Gothicvania Town PNG/environment/layers/tileset.png (592x192) ->
    assets/tiles/atlas-town.png.

    Measured ~33% dominant-pink (31-RESEARCH.md) -- retint REQUIRED. Applies
    the SAME hue_shift_band(prev, 215, 255, -60) call already proven in
    styleboard.py's town() function, to both crops BEFORE the palette remap.
    """
    sheet_path = os.path.join(
        GV_SRC,
        "gothicvania-town-files",
        "GothicVania-town-files",
        "PNG",
        "environment",
        "layers",
        "tileset.png",
    )
    _bake_biome_atlas(
        "town",
        sheet_path,
        # Native 16x32 cells from the cobbled ground block at (320,137)-(352,176): a FLAT
        # top edge that repeats cleanly. Replaces the original (16,4,80,80) crop, which was
        # the sheet's largest island but is a ROOF TRIANGLE (top-edge range 70px) -- stamped
        # every 16px it tiled into a repeating sawtooth across every town floor.
        cap_rect=(328, 137, 344, 169),  # cobble surface
        fill_rect=(328, 144, 344, 176),  # the same block's dark body below it
        retint=(215, 255, -60),
    )


def build_biome_atlas_cemetery():
    """Gothicvania Cemetery PNG/Environment/tileset.png (448x160) ->
    assets/tiles/atlas-cemetery.png.

    31-RESEARCH.md measured the FULL sheet at ~8.7% dominant-pink
    (borderline) -- but direct pixel sampling this session confirmed that
    figure is dominated by a single dark violet/plum tombstone SHADOW tone
    (RGB (65,25,59)), the same low-brightness HSV-hue-instability class
    already documented for assets/player-swamphunter.png's pink_scan
    allowlist entry -- not a genuinely pink surface. Rather than retint that
    shadow tone, the crop rects below were deliberately chosen from the
    tileset's grass-tuft/rock region, which measures 0.9%/0.0% dominant-pink
    BEFORE any remap (well under the 8% gate, and the shadow tone is absent
    entirely from these rects). No retint applied -- see 31-04-SUMMARY.md
    for the recorded judgment call and the pixel-sampling proof.
    """
    sheet_path = os.path.join(
        GV_SRC,
        "gothicvania-cemetery-files_1",
        "gothicvania-cemetery-files",
        "PNG",
        "Environment",
        "tileset.png",
    )
    _bake_biome_atlas(
        "cemetery",
        sheet_path,
        # Native 16x32 cells from the 96x128 grass-over-mound island (64,16)-(160,144).
        # The cap starts at the island's real grass line (y=55), NOT its bbox top -- the
        # bbox top is 39px of empty air above the tallest blade. The whole island used to
        # be squashed 96px -> 16px, which is what reduced the grass+skull detail to grey
        # static ("a placeholder grey area that the player walks on").
        cap_rect=(80, 55, 96, 87),  # grass blades over skull/dirt surface
        fill_rect=(80, 96, 96, 128),  # the same mound's dirt body below it
    )


def build_biome_atlas_castle():
    """Gothicvania Patreon Collection's Old-Dark-Castle interior tileset
    (832x240) -> assets/tiles/atlas-castle.png.

    Measured 0% dominant-pink (31-RESEARCH.md) -- no retint needed. Both rects
    come from the same gold-lipped stone column (source x 656-688): the cap is
    its gold surface lip over stone, the fill is the plain stone body below
    that lip. The gold-lip-over-dark-stone-body cap convention is native to the
    source art, not something this bake invents -- but the lip belongs ONLY on
    the cap, never repeated down through the fill.
    """
    sheet_path = os.path.join(
        GV_SRC,
        "gothicvaniapatreoncollection",
        " gothicvania patreon collection",
        "Old-dark-Castle-tileset-Files",
        "PNG",
        "old-dark-castle-interior-tileset.png",
    )
    _bake_biome_atlas(
        "castle",
        sheet_path,
        # Native 16x32 cells from the gold-lipped stone column at source x 656-688. The cap
        # opens on its gold surface lip (source rows 154-165) -- a flat, fully-opaque top
        # edge that repeats cleanly. Replaces the original (320,32,352,114) crop, an ARCH
        # PEAK whose notched silhouette tiled into the same repeating sawtooth as town's roof.
        cap_rect=(664, 154, 680, 186),  # gold surface lip over stone
        # Plain stone body from the same column, BELOW its lip. The original
        # (272,160,304,224) fill was another gold-CAPPED brick, which repeated bright gold
        # lips down through the underground mass.
        fill_rect=(664, 190, 680, 222),
    )


def _dominant_opaque_color(im_rgba, fallback=(10, 10, 10)):
    """Most-common fully-opaque (alpha>=128) RGB color in `im_rgba`.

    Used as the alpha-composite backing plate for _bake_biome_parallax_layer
    (see its 2026-07-12 "bits and pieces" fix below) -- reading a color the
    source art itself already uses means the backing always blends with that
    same layer's own palette, no per-biome/per-layer hand-tuned constant
    needed. Falls back to near-black (matches styleboard.py's default
    new_canvas() plate) if the image is fully transparent.
    """
    from collections import Counter

    counts = Counter(px[:3] for px in im_rgba.convert("RGBA").getdata() if px[3] >= 128)
    return counts.most_common(1)[0][0] if counts else fallback


# --- Biome parallax bake (Phase 32 ART-03; architecture reworked 2026-07-12) ---
#
# History: two earlier fixes at the Phase 33 human-verify checkpoint removed a
# luminance-crush remap ("black mess", commit caebfae) and a transparent->black
# RGB flatten ("odd bits and pieces", commit 78b7dd2). A third human look showed
# the remaining root cause was ARCHITECTURAL: the old _bake_biome_parallax_layer
# bottom-cropped every 179-304px-tall Gothicvania source into a 90-144px strip
# (showing only the bottom sixth of the approved art), and the runtime anchored
# those strips at the floor line of a viewport whose camera climbs 360px above
# them (levels 07/08 bounds.top -360) -- so most of the screen was the #0a0a0a
# clear color by construction, and what art survived read as random fragments.
#
# The human-approved style boards (.planning/research/v6-scouting/styleboard.py)
# are full 640x360 COMPOSED SCENES: one primary background plate bottom-anchored
# at native height, sky rows above filled by repeating the plate's top row
# (stretch_top), feature layers alpha-composited at native height. This section
# now mirrors that exactly:
#
#   far-<biome>.png  = full 640x360 opaque plate (tile -> bottom-anchor ->
#                      stretch_top sky fill), the whole approved scene backdrop.
#   mid/near-<biome>.png = native-height RGBA feature layers, transparency
#                      PRESERVED (never flattened -- the runtime composites them
#                      over the far plate, like styleboard.py's alpha_composite).
#                      Biomes whose approved board is a single plate (town near,
#                      castle mid+near) bake fully-transparent placeholders --
#                      board parity beats invented extra layers; Phase 35/36 may
#                      add sanctioned depth later.
#
# src/parallax.js pins these vertically to the camera (screen-locked), so the
# far plate covers the viewport at any camera height.

FAR_PLATE_W, FAR_PLATE_H = 640, 360


def _stretch_top(canvas, y_top):
    """Fill canvas rows 0..y_top-1 by repeating the row AT y_top -- port of
    styleboard.py's stretch_top() sky-padding idiom (the plate's own top row
    extended upward, so the fill is always the art's sky/ambient color)."""
    if y_top <= 0:
        return
    row = canvas.crop((0, y_top, canvas.width, y_top + 1))
    for y in range(y_top):
        canvas.paste(row, (0, y))


def _bake_biome_far_plate(out_name, src_path, retint=None, crop=None, base=None, stretch=True):
    """One biome's full-viewport background plate -> assets/parallax/far-<biome>.png.

    load -> [crop x-window] -> [hue_shift_band retint] -> tile to 640 wide ->
    bottom-anchor onto a 640x360 base-colored canvas -> stretch_top the rows
    above -> save opaque RGB. `base` overrides the auto-sampled dominant color
    for biomes whose styleboard scene hand-picked one (swamp's (30,32,30)).
    `stretch=False` keeps the base color above the art instead of repeating
    the art's top row -- styleboard.py's swamp() does exactly that (its
    background.png top row is bright canopy green; the board leaves the dark
    (30,32,30) base showing above it, and the swamp mid layers' own opaque
    crown-backdrop plates cover the seam)."""
    src = Image.open(src_path).convert("RGBA")
    if src.width == 0 or src.height == 0:
        raise ValueError(f"{src_path}: degenerate zero-dimension source image")
    if crop is not None:
        src = src.crop(crop)
    if retint is not None:
        band_lo, band_hi, delta = retint
        src = hue_shift_band(src, band_lo, band_hi, delta)
    tiled = _tile_to_width(src, FAR_PLATE_W)
    base_color = base if base is not None else _dominant_opaque_color(src)
    canvas = Image.new("RGBA", (FAR_PLATE_W, FAR_PLATE_H), base_color + (255,))
    top = FAR_PLATE_H - tiled.height
    if top < 0:
        tiled = tiled.crop((0, -top, FAR_PLATE_W, tiled.height))
        top = 0
    canvas.alpha_composite(tiled, (0, top))
    if stretch:
        _stretch_top(canvas, top)
    assert canvas.size == (FAR_PLATE_W, FAR_PLATE_H), f"far-{out_name} wrong size: {canvas.size}"
    save(canvas.convert("RGB"), os.path.join(ROOT, "assets", "parallax", f"far-{out_name}.png"))


def _bake_biome_feature_layer(out_name, layer, src_path, retint=None):
    """One biome's mid/near feature layer at NATIVE height, RGBA transparency
    preserved -> assets/parallax/<layer>-<biome>.png. The runtime bottom-anchors
    it at the floor line over the far plate, so transparent regions show the
    plate through -- exactly styleboard.py's alpha_composite layering."""
    src = Image.open(src_path).convert("RGBA")
    if src.width == 0 or src.height == 0:
        raise ValueError(f"{src_path}: degenerate zero-dimension source image")
    if retint is not None:
        band_lo, band_hi, delta = retint
        src = hue_shift_band(src, band_lo, band_hi, delta)
    tiled = _tile_to_width(src, FAR_PLATE_W)
    if tiled.height > FAR_PLATE_H:
        tiled = tiled.crop((0, tiled.height - FAR_PLATE_H, FAR_PLATE_W, tiled.height))
    # Drop fully-transparent TOP rows (bottom rows must stay — the runtime
    # bottom-anchors this layer, so cropping the top is alignment-neutral but
    # saves per-frame blend fill (town's middleground carries a 33-row empty sky
    # band; invisible pixels still cost fill rate on the software renderer).
    bbox = tiled.getchannel("A").getbbox()
    if bbox is not None and bbox[1] > 0:
        tiled = tiled.crop((0, bbox[1], FAR_PLATE_W, tiled.height))
    save(tiled, os.path.join(ROOT, "assets", "parallax", f"{layer}-{out_name}.png"))


def _bake_empty_feature_layer(out_name, layer):
    """Fully-transparent placeholder for biomes whose approved style board is a
    single composed plate with no separate feature layers (town near, castle
    mid+near). Keeps the 3-sprite-keys-per-biome runtime/manifest contract
    without inventing art the board never showed. 1px tall: the quad is still
    blended every frame by the renderer, so a 90px-tall invisible layer was
    pure fill-rate waste on the software-rendered browser-boot rig."""
    canvas = Image.new("RGBA", (FAR_PLATE_W, 1), (0, 0, 0, 0))
    save(canvas, os.path.join(ROOT, "assets", "parallax", f"{layer}-{out_name}.png"))


def build_biome_parallax_swamp():
    """Swamp scene per styleboard.py swamp(): far <- Evironment/background.png
    tiled over the hand-picked (30,32,30) crown-backdrop base (the board's own
    canvas color, so the 96px-wide plates merge into one continuous canopy
    band); mid <- mid-layer-02.png, near <- mid-layer-01.png at native 256px
    height with transparency preserved (board composites them over the
    backdrop; drawn last -> closest to camera). All 3 measured 0% dominant-pink
    -- no retint.
    """
    env = os.path.join(GV_SRC, "gothicvania_swamp_files", "Gothicvania Swamp files", "Evironment")
    _bake_biome_far_plate("swamp", os.path.join(env, "background.png"), base=(30, 32, 30), stretch=False)
    _bake_biome_feature_layer("swamp", "mid", os.path.join(env, "mid-layer-02.png"))
    _bake_biome_feature_layer("swamp", "near", os.path.join(env, "mid-layer-01.png"))


def build_biome_parallax_town():
    """Town scene per styleboard.py town(): the board renders
    environment-preview.png, which is the artist's own composite of the pack's
    two dedicated layer files -- so far <- environment/layers/background.png
    (dusk sky + far houses, ~64% dominant-pink, retint REQUIRED via the same
    hue_shift_band(..., 215, 255, -60) as the board) and mid <-
    environment/layers/middleground.png (near houses, RGBA, native 288px) with
    the same retint for cohesion. The board shows no third layer -> near bakes
    fully transparent (the old near source was a Patreon night-town strip the
    board never used).
    """
    layers_dir = os.path.join(
        GV_SRC,
        "gothicvania-town-files",
        "GothicVania-town-files",
        "PNG",
        "environment",
        "layers",
    )
    _bake_biome_far_plate("town", os.path.join(layers_dir, "background.png"), retint=(215, 255, -60))
    _bake_biome_feature_layer(
        "town", "mid", os.path.join(layers_dir, "middleground.png"), retint=(215, 255, -60)
    )
    _bake_empty_feature_layer("town", "near")


def build_biome_parallax_cemetery():
    """Cemetery scene per styleboard.py cemetery(): far <-
    PNG/Environment/background.png (magenta horizon glow, ~79% dominant-pink,
    retint REQUIRED, same hue_shift_band(bg, 195, 245, -50) as the board);
    mid <- mountains.png (same retint, matching the board's own mts call);
    near <- graveyard.png (0.1% pink, no retint). Mid/near keep native height
    + transparency -- the board alpha-composites exactly these three files.
    """
    env = os.path.join(GV_SRC, "gothicvania-cemetery-files_1", "gothicvania-cemetery-files", "PNG", "Environment")
    _bake_biome_far_plate("cemetery", os.path.join(env, "background.png"), retint=(195, 245, -50))
    _bake_biome_feature_layer(
        "cemetery", "mid", os.path.join(env, "mountains.png"), retint=(195, 245, -50)
    )
    _bake_biome_feature_layer("cemetery", "near", os.path.join(env, "graveyard.png"))


def build_biome_parallax_castle():
    """Castle scene per styleboard.py castle(): the approved board is ONE
    composed interior scene -- a 640px window of the Old-Dark-Castle interior
    art cropped at x=250 (window-arch centered, same x-window as the board's
    prev.crop((250, 0, 890, h))) with stretch_top sky fill. far <-
    old-dark-castle-interior-background.png (the pack's dedicated background
    plate, visually the board's scene minus tileset props; 0% pink, no
    retint). The board shows no separate feature layers -> mid+near bake fully
    transparent. The OLD sources are deliberately dropped: Gothic-Castle
    gothic-castle-background.png and Church backgrounds.png are multi-panel
    preview SHEETS (discrete vignettes with gutters), and tiling them raw was
    the "odd bits and pieces" band + the purple palette clash against the
    approved teal.
    """
    plate_path = os.path.join(
        GV_SRC,
        "gothicvaniapatreoncollection",
        " gothicvania patreon collection",
        "Old-dark-Castle-tileset-Files",
        "PNG",
        "old-dark-castle-interior-background.png",
    )
    _bake_biome_far_plate("castle", plate_path, crop=(250, 0, 890, 304))
    _bake_empty_feature_layer("castle", "mid")
    _bake_empty_feature_layer("castle", "near")


# --- Phase 31 (ART-01): Swamp Hunter player + Hell hound enemy sprite bakes ---
#
# The two remaining character-class sprites for this phase. Both ship at
# NATIVE Gothicvania colors (no _remap/_remap_luminance) -- unlike every
# other bake in this file, which palette-conforms onto PLAYER_PALETTE or
# ENVIRONMENT_PALETTE. This is deliberate: CONTEXT.md frames both the Swamp
# Hunter and the Hell hound as direct style-board picks (31-02-SUMMARY.md's
# 5-round sign-off), not a request for further palette conforming -- baking
# them through a remap would silently change what was actually shown and
# approved.


def build_player_swamphunter():
    """Gothicvania Swamp "Sprites/Player/{idle,run,jump,fall}/*.png" (62x54
    native canvas each) -> assets/player-swamphunter.png (192x32, 12 frames
    of 16x32 each).

    Frames chosen (ART-04's move-set only -- crouch/shoot/hurt excluded,
    they are not part of this game's move-set per CONTEXT.md):
      - idle: idle1.png, idle2.png (2 frames)
      - run:  run1.png, run4.png, run6.png, run9.png, run11.png, run14.png
              (6 frames hand-picked, evenly spaced across the 14-frame run
              cycle -- not a contiguous slice, so the baked loop still reads
              as a full stride cycle rather than a truncated fragment)
      - jump: jump1.png, jump2.png (2 frames)
      - fall: fall1.png, fall2.png (2 frames)
    Cell layout: 12 frames total, each a 16x32 cell, laid out left-to-right
    in the above order -> 192x32 sheet.

    Pattern 1 (mirrors build_player()'s own shared-scale-factor idiom): ONE
    scale factor is derived from the TALLEST frame's own content bbox across
    ALL 12 included frames (measured this session: jump1.png, content height
    49px of the 54px native canvas) and applied uniformly to every frame, so
    the character does not visibly grow/shrink between idle/run/jump/fall.
    Each frame is bottom-aligned (feet on the cell's bottom edge) and
    horizontally centered within its 16px-wide cell.

    Deliberately NOT run through _remap/_remap_luminance -- ships at native
    Gothicvania colors, per this section's header comment. Image.NEAREST is
    the only resize used (never LANCZOS, which would blur pixel-art edges).
    """
    target_w, target_h = 16, 32
    player_dir = os.path.join(
        GV_SRC, "gothicvania_swamp_files", "Gothicvania Swamp files", "Sprites", "Player"
    )
    frame_files = [
        ("idle", "idle1.png"),
        ("idle", "idle2.png"),
        ("run", "run1.png"),
        ("run", "run4.png"),
        ("run", "run6.png"),
        ("run", "run9.png"),
        ("run", "run11.png"),
        ("run", "run14.png"),
        ("jump", "jump1.png"),
        ("jump", "jump2.png"),
        ("fall", "fall1.png"),
        ("fall", "fall2.png"),
    ]

    loaded = []
    for subdir, fname in frame_files:
        im = Image.open(os.path.join(player_dir, subdir, fname)).convert("RGBA")
        bbox = im.getbbox()
        if bbox is None:
            raise ValueError(f"{subdir}/{fname}: fully transparent source frame, cannot derive content bbox")
        loaded.append((im, bbox))

    max_content_h = max(bbox[3] - bbox[1] for _, bbox in loaded)
    scale = target_h / max_content_h  # height-bound scale, shared across all 12 frames

    sheet = Image.new("RGBA", (target_w * len(frame_files), target_h), (0, 0, 0, 0))
    for i, (im, bbox) in enumerate(loaded):
        cropped = im.crop(bbox)
        new_w = max(1, round(cropped.width * scale))
        new_h = max(1, round(cropped.height * scale))
        resized = cropped.resize((new_w, new_h), Image.NEAREST)  # NEAREST only
        frame = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        px = (target_w - new_w) // 2  # center horizontally (clips if wider than target_w)
        py = target_h - new_h  # bottom-align feet
        frame.paste(resized, (px, py), resized)
        sheet.paste(frame, (i * target_w, 0), frame)

    assert sheet.size == (target_w * len(frame_files), target_h), (
        f"player-swamphunter sheet wrong size: {sheet.size}"
    )
    save(sheet, os.path.join(ROOT, "assets", "player-swamphunter.png"))


def build_enemy_hellhound():
    """Gothicvania Patreon Collection's Hell-Hound-Files/PNG/hell-hound-idle.png
    (384x32, 6 frames of 64x32 each) -> assets/enemy-hellhound.png.

    Deliberately NOT hell-hound-walk.png/-run.png/-jump.png -- CONTEXT.md is
    explicit this phase vendors the STATIC sprite only; motion wiring
    (patrol/waypoints/speed) is Phase 36's job.

    Ships at native size (no resize needed -- 64x32 per frame already sits
    at a reasonable scale alongside the other enemy sprites) and native
    Gothicvania color (no _remap/_remap_luminance), same reasoning as
    build_player_swamphunter() above: this is a direct style-board pick,
    not a request for further palette conforming.
    """
    frame_w, frame_h = 64, 32
    num_frames = 6
    sheet_path = os.path.join(
        GV_SRC,
        "gothicvaniapatreoncollection",
        " gothicvania patreon collection",
        "Hell-Hound-Files",
        "PNG",
        "hell-hound-idle.png",
    )
    im = Image.open(sheet_path).convert("RGBA")
    assert im.size == (frame_w * num_frames, frame_h), (
        f"hell-hound-idle.png source unexpected size: {im.size}"
    )

    sheet = Image.new("RGBA", (frame_w * num_frames, frame_h), (0, 0, 0, 0))
    for i in range(num_frames):
        frame = im.crop((i * frame_w, 0, (i + 1) * frame_w, frame_h))
        resized = frame.resize((frame_w, frame_h), Image.NEAREST)  # identity-scale NEAREST
        sheet.paste(resized, (i * frame_w, 0), resized)

    assert sheet.size == (frame_w * num_frames, frame_h), (
        f"enemy-hellhound sheet wrong size: {sheet.size}"
    )
    save(sheet, os.path.join(ROOT, "assets", "enemy-hellhound.png"))


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
    build_math_gate()
    build_enemies()
    build_logo()
    build_biome_atlas_swamp()
    build_biome_atlas_town()
    build_biome_atlas_cemetery()
    build_biome_atlas_castle()
    build_biome_parallax_swamp()
    build_biome_parallax_town()
    build_biome_parallax_cemetery()
    build_biome_parallax_castle()
    build_player_swamphunter()
    build_enemy_hellhound()
