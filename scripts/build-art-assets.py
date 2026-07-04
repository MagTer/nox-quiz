#!/usr/bin/env python3
"""Build Phase 20 real-CC0-art pixel assets for Math Lab.

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

import os

from PIL import Image

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

# Environment palette (dark-grunge only, background/tileset assets) — the
# exact locked hex tokens already established in scripts/generate-art-assets.py's
# BLACK/NEAR_BLACK/DEEP_GREY/DARK_GREY/MID_GREY/EDGE_GREY/BLUE_TINT constants.
ENVIRONMENT_PALETTE = [
    (0x0A, 0x0A, 0x0A),  # BLACK
    (0x0F, 0x0F, 0x0F),  # NEAR_BLACK
    (0x11, 0x11, 0x11),  # DEEP_GREY
    (0x15, 0x15, 0x15),  # DARK_GREY
    (0x1A, 0x1A, 0x1A),  # MID_GREY
    (0x2A, 0x2A, 0x2A),  # EDGE_GREY
    (0x0F, 0x0F, 0x1A),  # BLUE_TINT
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


if __name__ == "__main__":
    build_player()
    build_ground()
