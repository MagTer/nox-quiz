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

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

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


# Title backdrop tuning (Phase 38). DARKEN blends the whole plate toward black
# so the interior's bright stained-glass windows can't out-shout the logo;
# VIGNETTE_ALPHA is the peak opacity of a soft black ellipse dropped behind the
# centered N0X hero so it reads regardless of what pixel-art sits under it.
TITLE_BG_DARKEN = 0.62      # kept fraction of original brightness (0=black, 1=native)
TITLE_BG_VIGNETTE_ALPHA = 0.42  # peak alpha of the center logo-backing shade


def build_title_bg():
    """Gothicvania castle-interior background -> assets/tiles/title-bg.png (640x360).

    Phase 38 (BRAND-01): replaces the old Kenney-silhouette-through-_remap_luminance
    grey backdrop with a real SNES-fidelity scene, sourced from the SAME
    public-domain Gothicvania pack the level parallax uses. The plate is the
    castle biome's own far-layer source (old-dark-castle-interior-background.png:
    green stained-glass windows + stone columns), at NATIVE color -- matching the
    already-shipped castle atlas/door/parallax and the emerald N0X logo's
    moss/neon identity. Same window crop (250,0,890,304) and bottom-anchor +
    stretch_top ceiling-fill as build_biome_parallax_castle's far plate, so the
    title reads as the castle biome the player will actually enter.

    Two title-only treatments on top of the raw plate:
      * a global darken (TITLE_BG_DARKEN) so the bright windows can't overpower
        the logo, and
      * a soft radial black vignette (TITLE_BG_VIGNETTE_ALPHA) centered where
        title.js anchors the N0X hero, guaranteeing logo contrast without a hard
        backing rectangle.
    Ships opaque RGB at the locked 640x360, filename unchanged (no scene/manifest
    edit needed).
    """
    w, h = 640, 360
    plate_path = os.path.join(
        GV_SRC,
        "gothicvaniapatreoncollection",
        " gothicvania patreon collection",
        "Old-dark-Castle-tileset-Files",
        "PNG",
        "old-dark-castle-interior-background.png",
    )
    src = Image.open(plate_path).convert("RGBA").crop((250, 0, 890, 304))  # 640x304 window

    base_color = _dominant_opaque_color(src)
    canvas = Image.new("RGBA", (w, h), base_color + (255,))
    top = h - src.height  # 56 -> bottom-anchored, dark ceiling stretched above
    canvas.alpha_composite(src, (0, top))
    _stretch_top(canvas, top)

    # Global darken: blend every pixel toward black by (1 - TITLE_BG_DARKEN).
    black = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    canvas = Image.blend(canvas, black, 1.0 - TITLE_BG_DARKEN)

    # Soft radial logo-backing vignette, centered on title.js's logo anchor
    # (screen center, nudged up to match the hero's baseline). Built as a blurred
    # white ellipse used as the alpha of a black overlay -> a gradient shadow, no
    # hard edge.
    cx, cy = w // 2, 150
    rx, ry = 250, 90
    shade_mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(shade_mask).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    shade_mask = shade_mask.filter(ImageFilter.GaussianBlur(60))
    shade_mask = shade_mask.point(lambda v: int(v * TITLE_BG_VIGNETTE_ALPHA))
    shade = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shade.putalpha(shade_mask)
    canvas.alpha_composite(shade)

    assert canvas.size == (w, h), f"title-bg wrong size: {canvas.size}"
    save(canvas.convert("RGB"), os.path.join(ROOT, "assets", "tiles", "title-bg.png"))


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
# Extends this file's existing terrain/parallax bake idiom (build_ground() /
# build_parallax()) with 4 biomes x (1 terrain atlas + 3 parallax
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
    build_parallax() above.
    """
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    src = im.crop((0, max(0, im.height - target_h), target_w, im.height))
    canvas.paste(src, (0, target_h - min(target_h, im.height)), src)
    return canvas


def _bake_biome_atlas(out_name, sheet_path, cap_rect, fill_rect, retint=None):
    """Shared crop -> [retint] -> paste -> save body for a 3-frame (cap | fill |
    platform) biome terrain atlas (16x32 each, 48x32 total).

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

    FRAME 2 -- THE PLATFORM FRAME (added 2026-07-14, WYSIWYG platform fix)
    ---------------------------------------------------------------------
    A raised platform's COLLIDER is `p.h` (16px on the current levels) but its
    VISUAL used to be a 48px slab: build.js drew the 32px-tall cap at pos(x, y)
    AND a 32px fill starting at y+16 (CONFIG.TERRAIN.PLATFORM_FILL_DEPTH_PX), so
    the drawn ledge overhung its own collider by 32px and ate the headroom under
    the tier above (level-08's 75px rise measured -5px of VISUAL clearance --
    the player's head was drawn inside the ledge above her).

    The fix is a third frame that is the ground SURFACE CELL ONLY: the cap crop's
    TOP 16x16 cell pasted into the top half of a 16x32 frame whose bottom half is
    fully TRANSPARENT. Drawn at the same 32px frame height as the cap, it renders
    as a 16px-thick ledge with nothing below it -- an exact match for the 16px
    collider. It is derived FROM `cap_rect` (each cap crop is a native 16x32
    window = two stacked 16px source cells; the top one IS the walkable surface),
    NOT from a fourth hardcoded rect -- one source of truth, so re-pointing a cap
    can never desync the platform frame from it.

    ZERO SCALING, as everywhere else in this bake: the platform cell is a 1:1
    copy of pixels that already ship in frame 0. Squashing art into a cell is
    exactly what produced the grey static this docstring's rule #2 exists to
    prevent -- never "fit" the cap into 16px height to make this frame.
    """
    target_w, target_h = 16, 32
    cell_h = target_h // 2  # 16px -- one native source cell; the cap crop is two of them
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

    # Frame 2 -- platform: the cap's own TOP cell (already retinted, since it is
    # sliced from `cap` after the hue pass), top-anchored in an otherwise empty
    # 16x32 frame. The empty bottom half is load-bearing: it is what makes the
    # ledge read as 16px instead of the old 48px slab.
    platform = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    platform.paste(cap.crop((0, 0, target_w, cell_h)), (0, 0))

    sheet = Image.new("RGBA", (target_w * 3, target_h), (0, 0, 0, 0))
    sheet.paste(cap, (0, 0), cap)
    sheet.paste(fill, (target_w, 0), fill)
    sheet.paste(platform, (target_w * 2, 0), platform)

    assert sheet.size == (target_w * 3, target_h), f"atlas-{out_name} wrong size: {sheet.size}"
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


def build_patroller():
    """Gothicvania Cemetery's skeleton WALK cycle (8 x 44x52 frame files) ->
    assets/patroller.png (352x52, sliceX 8, anim `walk`).

    A cosmetic ambient patroller (Phase 36 MOT-01) — deliberately a shambling,
    hunched BIPED skeleton so it is VISUALLY DISTINCT from the quadruped,
    idle-only enemy-hellhound math-blocker, and carries a real walk-cycle
    telegraph (SC1). Sourced from the already-vendored gothicvania-cemetery.txt
    pack (skeleton-1..8.png — the pack's walk animation; skeleton-rise is a
    separate rise anim, not used). Native size, NEAREST identity paste (no
    scale, no bbox re-registration — the 8 source frames already share one
    44x52 canvas with feet planted at the bottom edge, so a direct paste keeps
    the walk cycle's bob/registration intact), same discipline as
    build_enemy_hellhound.

    NO-PINK conform pass: the pack's maroon bone SHADOW color sits at a
    low-brightness HSV hue that numerically lands in the 211-239 pink band
    (25.3% measured against the real gate) — the SAME low-brightness
    hue-instability artifact documented for player-swamphunter, NOT genuine
    pink. Per the plan's "retint where over threshold" mandate (the town-prop
    no-pink precedent), a board-faithful hue_shift_band(_, 211, 239, -40) pass
    shifts ONLY those dark in-band shadow pixels out of the band -> 0.0% pink,
    with the visible warm-bone silhouette preserved (the shifted pixels are
    near-black shadow noise; a render before/after is indistinguishable).
    """
    frame_w, frame_h = 44, 52
    num_frames = 8
    src_dir = os.path.join(
        GV_SRC,
        "gothicvania-cemetery-files_1", "gothicvania-cemetery-files",
        "PNG", "Sprites", "skeleton",
    )
    sheet = Image.new("RGBA", (frame_w * num_frames, frame_h), (0, 0, 0, 0))
    for i in range(num_frames):
        frame = Image.open(
            os.path.join(src_dir, f"skeleton-{i + 1}.png")
        ).convert("RGBA")
        assert frame.size == (frame_w, frame_h), (
            f"skeleton-{i + 1}.png unexpected source size: {frame.size}"
        )
        sheet.paste(frame, (i * frame_w, 0), frame)

    # No-pink hue-conform pass (see docstring) — only touches in-band dark
    # shadow pixels; the bone color the player sees is unchanged.
    sheet = hue_shift_band(sheet, 211, 239, -40)

    assert sheet.size == (frame_w * num_frames, frame_h), (
        f"patroller sheet wrong size: {sheet.size}"
    )
    save(sheet, os.path.join(ROOT, "assets", "patroller.png"))


FONT_PATH = os.path.join(ROOT, "assets", "_font-src", "monogram.ttf")

# --- N0X logo (BRAND-01, Phase 38): "Emerald Chisel" candidate A ---
#
# Supersedes the Phase-26 "NOX RUN" monogram wordmark. User-picked direction
# (2026-07-19, .planning/phases/38-n0x-logo-closing-verification/38-DECISIONS.md):
# uppercase N0X rendered chiseled/dimensional — a moss->neon vertical-gradient
# body, a neon rim-light on the up-left glyph edges, a dark chisel-shadow on the
# down-right edges, a soft neon outer glow, and a drop shadow. A higher pixel
# grid than the v1 wordmark = SNES fidelity. The pixel ops below are the verbatim
# a_emerald() pipeline from the throwaway generator
# brand-candidates/generate-v2.py, which produced the exact preview the user
# picked — refactored only into _logo_* helpers + a size-to-target step.
#
# Colors mirror CONFIG.PALETTE (the SAME live hex the rest of this file
# mirrors): ACCENT_MOSS as the body base, REWARD (neon green) for the rim +
# glow. Non-pink by construction (the pink-scan gate passes).
LOGO_TEXT = "N0X"
LOGO_MOSS = (0x47, 0x68, 0x47)    # == CONFIG.PALETTE.ACCENT_MOSS (body top, lerped toward REWARD)
LOGO_REWARD = (0x00, 0xFF, 0x88)  # == CONFIG.PALETTE.REWARD (rim light + outer glow)
LOGO_FONT_SIZE = 92               # native render size; NEAREST-scaled to each locked target
LOGO_BOLD = 1                     # MaxFilter passes thickening the thin monogram glyph mask


def _logo_lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _logo_glyph_mask(txt, size, bold):
    """Filled L-mode alpha mask of `txt` in the monogram pixel font, dilated
    `bold` times (MaxFilter 3) so the thin font can carry a chiseled bevel."""
    font = ImageFont.truetype(FONT_PATH, size)
    bb = font.getbbox(txt)
    pad = bold + 3
    w, h = bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).text((pad - bb[0], pad - bb[1]), txt, font=font, fill=255)
    for _ in range(bold):
        m = m.filter(ImageFilter.MaxFilter(3))
    return m


def _logo_vgrad(size, top, bot):
    w, h = size
    g = Image.new("RGB", (w, h))
    px = g.load()
    for y in range(h):
        c = _logo_lerp(top, bot, y / max(1, h - 1))
        for x in range(w):
            px[x, y] = c
    return g


def _logo_beveled(mask, body_top, body_bot, hi, lo, outline, rim_px):
    """mask -> RGBA chiseled glyph: black outline under a vertical body
    gradient, a neon rim on the up-left edges + a dark chisel on the down-right
    edges (the ImageChops.offset edge-difference trick from a_emerald())."""
    W, H = mask.size
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dil = mask
    for _ in range(rim_px):
        dil = dil.filter(ImageFilter.MaxFilter(3))
    o = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    o.paste(outline + (255,), (0, 0), dil)
    out.alpha_composite(o)
    grad = _logo_vgrad((W, H), body_top, body_bot).convert("RGBA")
    grad.putalpha(mask)
    out.alpha_composite(grad)
    hi_edge = Image.new("L", (W, H), 0)
    lo_edge = Image.new("L", (W, H), 0)
    for d in range(1, rim_px + 1):
        hi_edge = ImageChops.lighter(hi_edge, ImageChops.subtract(mask, ImageChops.offset(mask, -d, -d)))
        lo_edge = ImageChops.lighter(lo_edge, ImageChops.subtract(mask, ImageChops.offset(mask, d, d)))
    hl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hl.paste(hi + (255,), (0, 0), hi_edge)
    out.alpha_composite(hl)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh.paste(lo + (255,), (0, 0), lo_edge)
    out.alpha_composite(sh)
    return out


def _logo_with_glow(mark, mask, glow_col, blur, grow, alpha):
    W, H = mark.size
    g = mask
    for _ in range(grow):
        g = g.filter(ImageFilter.MaxFilter(3))
    gl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gl.paste(glow_col + (alpha,), (0, 0), g)
    gl = gl.filter(ImageFilter.GaussianBlur(blur))
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base.alpha_composite(gl)
    base.alpha_composite(mark)
    return base


def _logo_drop_shadow(mark, dx, dy, blur, alpha):
    W, H = mark.size
    pad = 8
    a = mark.split()[3]
    sh = Image.new("RGBA", (W + pad, H + pad), (0, 0, 0, 0))
    tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tmp.paste((0, 0, 0, alpha), (0, 0), a)
    tmp = tmp.filter(ImageFilter.GaussianBlur(blur))
    sh.alpha_composite(tmp, (pad // 2 + dx, pad // 2 + dy))
    sh.alpha_composite(mark, (pad // 2, pad // 2))
    return sh


def _build_n0x_mark():
    """The finished RGBA 'Emerald Chisel' N0X mark at native resolution
    (a_emerald() from generate-v2.py), trimmed to its own alpha bbox."""
    m = _logo_glyph_mask(LOGO_TEXT, LOGO_FONT_SIZE, LOGO_BOLD)
    mark = _logo_beveled(
        m,
        _logo_lerp(LOGO_MOSS, LOGO_REWARD, 0.25), (0x22, 0x38, 0x28),
        LOGO_REWARD, (0x0E, 0x1C, 0x14),
        (0, 0, 0), 2,
    )
    mark = _logo_with_glow(mark, m, LOGO_REWARD, 5, 2, 90)
    mark = _logo_drop_shadow(mark, 3, 4, 2, 160)
    return mark.crop(mark.getbbox())


def build_logo():
    """Bake the N0X "Emerald Chisel" logo -> assets/logo-hero.png (360x90) and
    assets/logo-badge.png (144x36) (BRAND-01, Phase 38).

    The native mark (_build_n0x_mark) is centered on a transparent canvas of an
    EXACT 4:1 ratio, then Image.NEAREST-scaled independently to each locked
    target (the badge is never derived by shrinking the hero PNG — each is its
    own scale of the SAME source). The 4:1 canvas is what lets both 4:1 targets
    scale UNIFORMLY (equal x/y factor), never a distorting non-uniform stretch.
    N0X is ~2:1, so the canvas is HEIGHT-constrained and the wordmark sits
    centered with transparent side margins — invisible at runtime (title.js
    anchors it at screen center, so only the glyphs show). The source canvas is
    kept small enough that the hero is a NEAREST UPSCALE (crisp blocky SNES
    pixels). The badge (144x36) is a ~0.55x DOWNSCALE of the same source, so it
    uses LANCZOS, not NEAREST: at that size NEAREST drops rows unevenly and the
    chiseled strokes break up (verified this bake) — the exact "hard to read on
    the level-select screen" failure past human-verify flagged. LANCZOS keeps
    the small badge legible; it is already this file's downscale idiom
    (build_title_bg resizes its castle/cloud plates with LANCZOS too). The
    NEAREST-only rule governs the hero upscale, where anti-alias smear would
    soften the crisp SNES pixels — it does not apply to a downscale.
    """
    mark = _build_n0x_mark()
    mw, mh = mark.size

    pad_y = 6
    canvas_h = mh + 2 * pad_y
    canvas_w = canvas_h * 4  # exact 4:1
    if mw > canvas_w:  # guard: never clip a wider-than-4:1 mark (N0X won't hit this)
        canvas_w = mw + 2 * pad_y
        canvas_h = round(canvas_w / 4)
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    canvas.alpha_composite(mark, ((canvas_w - mw) // 2, (canvas_h - mh) // 2))

    hero = canvas.resize((360, 90), Image.NEAREST)  # upscale -> crisp blocky pixels
    assert hero.size == (360, 90), f"logo-hero wrong size: {hero.size}"
    save(hero, os.path.join(ROOT, "assets", "logo-hero.png"))

    badge = canvas.resize((144, 36), Image.LANCZOS)  # downscale -> legibility over blockiness
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


# ===========================================================================
# Decorative props (Phase 35, ART-06/ART-07) — bake single-object sprites from
# the vendored, style-board-approved Gothicvania packs into assets/props/.
#
# NORMATIVE rules (ART-PARITY-STEERING facts #4/#6/#8/#9, and 35-RESEARCH §Bake):
#   * Crop a PRE-SLICED source (cemetery sliced-objects/*.png are already single
#     objects; swamp props.png is a 3-prop STRIP cropped per prop, never tiled
#     whole — Pitfall 3).
#   * Keep NATIVE color and NATIVE resolution — NO _remap_luminance (the
#     achromatic-grey trap, fact #8/#9) and NO scale-to-cell. Props are
#     free-size sprites, not the 16x32 terrain cells.
#   * Retint ONLY via hue_shift_band, and ONLY where a MEASURED pink reading
#     demands it. Every swamp + cemetery trial prop measured 0.0% pink against
#     scripts/lib/pink_scan.py's real band (211-239 PIL hue, min_sat 30), so the
#     whole trial set bakes NATIVE (retint=None). This matches styleboard.py,
#     which composites these exact sliced-objects natively — its cemetery
#     (195,245,-50) hue_shift_band is applied only to the far background /
#     mountains (already baked into the parallax assets), NOT to these
#     foreground objects.
# ===========================================================================
PROPS_DIR = os.path.join(ROOT, "assets", "props")


def _prop_strip_top_plate(im, plate=(30, 32, 30), tol=4):
    """Flood-fill the solid backdrop plate connected to the TOP edge to
    transparency.

    Gothicvania's swamp trees.png ships two gnarled trees hanging BELOW an
    opaque (30,32,30) crown-backdrop plate (the styleboard swamp canvas base
    color — swamp() pastes the whole sheet over a matching (30,32,30) canvas so
    the plate is invisible there). Baked as a standalone prop over arbitrary
    parallax the plate would read as a hard-edged dark rectangle (Pitfall 3), so
    the top-connected plate band is flood-removed. The tree's green crown and
    brown trunk survive (they are not plate-colored); the result reads as a bare
    gnarled dead tree.
    """
    from collections import deque

    im = im.copy()
    px = im.load()
    w, h = im.size

    def is_plate(p):
        return (
            p[3] > 0
            and abs(p[0] - plate[0]) <= tol
            and abs(p[1] - plate[1]) <= tol
            and abs(p[2] - plate[2]) <= tol
        )

    q = deque()
    seen = set()
    for x in range(w):
        if is_plate(px[x, 0]):
            q.append((x, 0))
            seen.add((x, 0))
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and is_plate(px[nx, ny]):
                seen.add((nx, ny))
                q.append((nx, ny))
    return im


def _prop_drop_small_islands(im, min_px):
    """Return im with every 8-connected opaque component smaller than min_px
    cleared — drops the stray neighbour-prop fragments a rectangular crop pulls
    in (e.g. a leaf tip of the adjacent tree), while KEEPING every real part of
    the target prop (do NOT keep-only-largest: plate removal splits the tree
    into many adjacent components that still read as one tree)."""
    w, h = im.size
    px = im.load()
    vis = [[False] * w for _ in range(h)]
    keep = Image.new("RGBA", im.size, (0, 0, 0, 0))
    kp = keep.load()
    for y0 in range(h):
        for x0 in range(w):
            if vis[y0][x0] or px[x0, y0][3] == 0:
                vis[y0][x0] = True
                continue
            stack = [(x0, y0)]
            vis[y0][x0] = True
            pts = []
            while stack:
                x, y = stack.pop()
                pts.append((x, y))
                for nx, ny in (
                    (x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1),
                    (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1),
                ):
                    if 0 <= nx < w and 0 <= ny < h and not vis[ny][nx]:
                        vis[ny][nx] = True
                        if px[nx, ny][3] > 0:
                            stack.append((nx, ny))
            if len(pts) >= min_px:
                for (x, y) in pts:
                    kp[x, y] = px[x, y]
    return keep


def bake_prop(out_name, src_rel, crop=None, strip_plate=False, drop_small=0, retint=None):
    """Bake ONE decorative prop sprite from a vendored Gothicvania source file.

    src_rel is relative to GV_SRC (assets/_gothicvania-src/). Pipeline, in order:
    open RGBA -> [strip top backdrop plate] -> [crop rect] -> [drop stray small
    islands] -> tighten to alpha bbox -> [hue_shift_band retint] -> save to
    assets/props/<out_name>.png. NO scaling, NO _remap_luminance (mirrors
    _bake_biome_atlas's native-color/native-res discipline, minus the 16x32
    terrain assertion since props are free-size).
    """
    im = Image.open(os.path.join(GV_SRC, src_rel)).convert("RGBA")
    if strip_plate:
        im = _prop_strip_top_plate(im)
    if crop:
        im = im.crop(crop)
    if drop_small:
        im = _prop_drop_small_islands(im, drop_small)
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)  # tighten to the sprite's own opaque bounds
    if retint:
        im = hue_shift_band(im, *retint)
    save(im, os.path.join(PROPS_DIR, f"{out_name}.png"))


def build_props():
    """Bake the Phase-35 prop vocabulary for all four biomes. The trial pair
    (plan 02): a THIN swamp set (levels 1-2) + a RICHER cemetery set (levels
    5-6), both native color. The re-dress remainder (plan 05): a town set
    (levels 3-4) baked WITH the board's steel-blue-night no-pink pass
    (215,255,-60) -- the town pack ships a salmon dusk tint that trips the gate
    natively -- and a castle set (levels 7-8) baked NATIVE from tileset crops
    (measure-first: all under the pink threshold; NO new CC0 needed). Every
    output is named assets/props/<biome>-<name>.png and declared in
    src/assets-manifest.js under kind:"prop"."""
    os.makedirs(PROPS_DIR, exist_ok=True)

    # ---- Swamp (THIN — a few atmospheric accents) --------------------------
    swamp = os.path.join(
        "gothicvania_swamp_files", "Gothicvania Swamp files", "Evironment"
    )
    # A gnarled dead tree: trees.png's right tree, crown-backdrop plate removed,
    # cropped clear of the left tree (x>=168), stray leaf tips dropped.
    bake_prop(
        "swamp-tree", os.path.join(swamp, "trees.png"),
        crop=(168, 0, 288, 208), strip_plate=True, drop_small=40,
    )
    # props.png is a 3-prop STRIP — crop each prop by its own column run.
    bake_prop("swamp-reed", os.path.join(swamp, "props.png"), crop=(8, 0, 46, 43))
    bake_prop("swamp-vine", os.path.join(swamp, "props.png"), crop=(60, 0, 115, 43))
    bake_prop("swamp-fern", os.path.join(swamp, "props.png"), crop=(128, 0, 173, 43))
    # Swamp LIGHT-SOURCE (Phase 36 MOT-03/MECH-05): a bog will-o'-wisp. The swamp/
    # cemetery packs carry NO lantern/brazier object, so — following the castle
    # crops-before-new-CC0 precedent — the will-o'-wisp is a single frame of the
    # already-vendored (gothicvania-patreon.txt) Fire-Skull sheet (768x112 = 8x
    # 96px frames); crop frame 0, bake_prop tightens to its own bbox (68x78). A
    # floating flaming skull IS the classic bog wisp; measured 0.0% pink NATIVE
    # (its red/orange flame hue sits well outside the 211-239 pink band) — no
    # retint, no new CC0.
    fire_skull = os.path.join(
        "gothicvaniapatreoncollection", " gothicvania patreon collection",
        "Fire-Skull-Files", "PNG", "fire-skull.png",
    )
    bake_prop("swamp-lantern", fire_skull, crop=(0, 0, 96, 112))

    # ---- Cemetery (RICH — statue + tombstones + a tree + a bush) -----------
    cem = os.path.join(
        "gothicvania-cemetery-files_1", "gothicvania-cemetery-files",
        "PNG", "Environment", "sliced-objects",
    )
    bake_prop("cemetery-statue", os.path.join(cem, "statue.png"))
    bake_prop("cemetery-stone-1", os.path.join(cem, "stone-1.png"))
    bake_prop("cemetery-stone-2", os.path.join(cem, "stone-2.png"))
    bake_prop("cemetery-stone-3", os.path.join(cem, "stone-3.png"))
    bake_prop("cemetery-stone-4", os.path.join(cem, "stone-4.png"))
    bake_prop("cemetery-tree", os.path.join(cem, "tree-1.png"))
    bake_prop("cemetery-bush", os.path.join(cem, "bush-large.png"))
    # Cemetery LIGHT-SOURCE (Phase 36 MOT-03/MECH-05): a grave candle/lantern. The
    # cemetery pack ships no lantern/brazier, so — crops-before-new-CC0 — reuse the
    # already-vendored (gothicvania-church.txt) Church tileset's altar-candle-on-a-
    # stepped-plinth crop (a standing warm-flame gothic candle; the SAME crop rect
    # the castle-candle-stand prop uses — a shared gothic grave/altar light motif,
    # biome-coherent for a cemetery). Measured 2.55% pink NATIVE (under the 8%
    # gate) -> baked NATIVE, no retint, no new CC0.
    church_ts = os.path.join(
        "gothicvania-church-files", "gothicvania church files",
        "ENVIRONMENT", "tileset.png",
    )
    bake_prop("cemetery-lantern", church_ts, crop=(247, 88, 273, 117))

    # ---- Town (levels 3-4; RICH pre-sliced vocabulary) ---------------------
    # Direct pre-sliced named files from the Gothicvania Town pack's
    # props-sliced/ dir (already covered by assets/LICENSES/gothicvania-town.txt).
    # These ship with a salmon/mauve dusk tint: measured native they land 10-44%
    # in the real pink gate band (barrel 26%, crate 26%, well 10%, sign 44%),
    # so they DO need the board's town no-pink pass. styleboard.py's town()
    # applies hue_shift_band(_, 215, 255, -60) scene-wide (salmon dusk -> steel-
    # blue night); applying the SAME tuple uniformly to every town prop is the
    # board-faithful conform pass and drops all of them to 0.0% pink (verified).
    TOWN_RETINT = (215, 255, -60)
    town = os.path.join(
        "gothicvania-town-files", "GothicVania-town-files",
        "PNG", "environment", "props-sliced",
    )
    bake_prop("town-barrel", os.path.join(town, "barrel.png"), retint=TOWN_RETINT)
    bake_prop("town-crate", os.path.join(town, "crate.png"), retint=TOWN_RETINT)
    bake_prop("town-street-lamp", os.path.join(town, "street-lamp.png"), retint=TOWN_RETINT)
    bake_prop("town-well", os.path.join(town, "well.png"), retint=TOWN_RETINT)
    bake_prop("town-sign", os.path.join(town, "sign.png"), retint=TOWN_RETINT)

    # ---- Castle (levels 7-8; THINNEST biome) -------------------------------
    # Tileset-crops-first per the locked "source additional CC0 only where a
    # biome is thin" decision + Open Question 2 (crops before new CC0). ALL
    # castle props come from vendored, already-licensed packs -- NO new CC0 was
    # needed: the Church pack (assets/LICENSES/gothicvania-church.txt) supplies
    # a fully pre-sliced gothic pillar (column.png) AND a tileset rich in single-
    # panel castle accents (candle sconce, altar candle, gothic arch window).
    # Measured native they are all UNDER the pink gate threshold (column 1.2%,
    # candles 0.0%, candle-stand 2.6%, arch 0.0%) -> baked NATIVE (castle
    # "measure first"; board-faithful, no retint). Every crop is a SINGLE object
    # by explicit rect -- never a tiled multi-panel preview sheet (fact #4).
    church = os.path.join(
        "gothicvania-church-files", "gothicvania church files", "ENVIRONMENT",
    )
    # Pre-sliced gothic pillar (carved gargoyle heads + two wall lanterns): the
    # castle "column" straight from the pack's own single-object file.
    bake_prop("castle-column", os.path.join(church, "column.png"))
    # Single-panel crops from the church tileset (each is ONE object, not a tile
    # run): a lit candle shelf/sconce, a single altar candle on a stepped plinth,
    # and a gothic pointed-arch window for far-wall dressing.
    castle_ts = os.path.join(church, "tileset.png")
    bake_prop("castle-candles", castle_ts, crop=(193, 38, 224, 59))
    bake_prop("castle-candle-stand", castle_ts, crop=(247, 88, 273, 117))
    bake_prop("castle-arch", castle_ts, crop=(286, 16, 321, 81))


if __name__ == "__main__":
    build_player()
    build_ground()
    build_parallax()
    build_title_bg()
    build_palette_swatch()
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
    build_patroller()
    build_props()
