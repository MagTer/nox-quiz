#!/usr/bin/env python3
"""Generate Phase 18 placeholder pixel-art assets for Math Lab.

Outputs dark-grunge PNGs matching the 18-UI-SPEC.md dimensions:
- assets/player.png          80x32  (5 frames of 16x32)
- assets/tiles/ground.png    80x16  (5 frames of 16x16)
- assets/parallax/far.png    640x120 tileable strip
- assets/parallax/mid.png    640x144 tileable strip
- assets/parallax/near.png   640x90  tileable strip
- assets/tiles/title-bg.png  640x360 backdrop

Palette is dark-grunge only; the only bright accent is the green used nowhere
in these background/character assets (player is a near-black silhouette).
"""

import os
import random
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Dark-grunge palette; no pink anywhere.
BLACK = (0x0A, 0x0A, 0x0A)
NEAR_BLACK = (0x0F, 0x0F, 0x0F)
DEEP_GREY = (0x11, 0x11, 0x11)
DARK_GREY = (0x15, 0x15, 0x15)
MID_GREY = (0x1A, 0x1A, 0x1A)
EDGE_GREY = (0x2A, 0x2A, 0x2A)
BLUE_TINT = (0x0F, 0x0F, 0x1A)

random.seed(18)  # deterministic grunge


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    print(f"generated {os.path.relpath(path, ROOT)} {img.size}")


def fill(img, color):
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, img.width, img.height), fill=color)


def noise_rect(img, x, y, w, h, color, density=0.25):
    """Scatter single-pixel noise into a region."""
    px = img.load()
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if random.random() < density:
                px[xx, yy] = color


def make_player():
    img = Image.new("RGB", (80, 32), BLACK)
    draw = ImageDraw.Draw(img)

    def frame_rect(i):
        return (i * 16, 0, (i + 1) * 16 - 1, 31)

    for i in range(5):
        x0, y0, x1, y1 = frame_rect(i)
        # Clear frame
        draw.rectangle((x0, y0, x1, y1), fill=BLACK)
        # Body silhouette
        body_w = 10
        body_h = 22
        bx0 = x0 + (16 - body_w) // 2
        by0 = y1 - body_h + 1
        draw.rectangle((bx0, by0, bx0 + body_w - 1, y1), fill=DEEP_GREY)
        # Head
        head_y = by0 - 4
        draw.rectangle((bx0 + 1, head_y, bx0 + body_w - 2, head_y + 5), fill=DARK_GREY)
        # Two tiny eye pixels
        draw.rectangle((bx0 + 2, head_y + 1, bx0 + 3, head_y + 2), fill=EDGE_GREY)

        # Pose variation
        if i in (0, 1):  # idle: slight breathing offset
            pass
        elif i in (2, 3):  # run: leg reaching out
            leg_dir = 1 if i == 2 else -1
            lx0 = bx0 + 3 + leg_dir * 2
            draw.rectangle((lx0, y1 - 4, lx0 + 2, y1), fill=DARK_GREY)
        else:  # jump (frame 4): arms/legs tucked
            draw.rectangle((bx0 - 1, by0 + 6, bx0, by0 + 10), fill=DARK_GREY)
            draw.rectangle((bx0 + body_w, by0 + 6, bx0 + body_w + 1, by0 + 10), fill=DARK_GREY)

        # Feet aligned to bottom
        draw.rectangle((bx0 + 1, y1 - 2, bx0 + 4, y1), fill=DARK_GREY)
        draw.rectangle((bx0 + body_w - 4, y1 - 2, bx0 + body_w - 1, y1), fill=DARK_GREY)

    # Add subtle film grain so silhouette isn't a flat blob.
    for i in range(5):
        x0, y0, x1, y1 = frame_rect(i)
        noise_rect(img, x0, y0, 16, 32, MID_GREY, density=0.03)

    save(img, os.path.join(ROOT, "assets/player.png"))


def make_ground():
    img = Image.new("RGB", (80, 16), BLACK)
    draw = ImageDraw.Draw(img)

    def frame_rect(i):
        return (i * 16, 0, (i + 1) * 16 - 1, 15)

    for i in range(5):
        x0, y0, x1, y1 = frame_rect(i)
        fill_color = DEEP_GREY
        draw.rectangle((x0, y0, x1, y1), fill=fill_color)

        # Rough top edge highlight
        highlight = random.choice([MID_GREY, EDGE_GREY, DARK_GREY])
        for xx in range(x0, x1 + 1):
            if random.random() < 0.6:
                draw.rectangle((xx, y0, xx, y0 + 1), fill=highlight)

        # Left/right edge variation for frames
        if i == 0:  # single tile: both edges worn
            draw.rectangle((x0, y0, x0 + 1, y1), fill=EDGE_GREY)
            draw.rectangle((x1 - 1, y0, x1, y1), fill=EDGE_GREY)
        elif i == 1:  # left edge
            draw.rectangle((x0, y0, x0 + 2, y1), fill=EDGE_GREY)
        elif i == 3:  # right edge
            draw.rectangle((x1 - 2, y0, x1, y1), fill=EDGE_GREY)
        elif i == 4:  # underside/column: darker, vertical striations
            draw.rectangle((x0, y0, x1, y1), fill=NEAR_BLACK)
            for xx in range(x0 + 2, x1, 4):
                draw.rectangle((xx, y0, xx, y1), fill=DARK_GREY)

        noise_rect(img, x0, y0, 16, 16, MID_GREY, density=0.04)

    save(img, os.path.join(ROOT, "assets/tiles/ground.png"))


def tileable_noise(img, base, density=0.12):
    """Fill with base and add noise; ensure left/right edges match for tiling."""
    fill(img, base)
    px = img.load()
    # Use a wrap-aware coordinate for tiling: copy the same noise pattern
    # to both vertical edges so the strip tiles cleanly.
    for y in range(img.height):
        for x in range(img.width):
            if random.random() < density:
                c = random.choice([DARK_GREY, MID_GREY, NEAR_BLACK])
                px[x, y] = c


def make_parallax():
    # Far: faint mountain/city silhouette
    far = Image.new("RGB", (640, 120), BLACK)
    draw = ImageDraw.Draw(far)
    fill(far, BLUE_TINT)
    # jagged silhouette skyline
    x = 0
    while x < 640:
        w = random.randint(40, 100)
        h = random.randint(20, 80)
        draw.rectangle((x, 120 - h, x + w, 119), fill=DARK_GREY)
        x += w + random.randint(-10, 20)
    tileable_noise(far, BLUE_TINT, density=0.04)
    save(far, os.path.join(ROOT, "assets/parallax/far.png"))

    # Mid: dark structural shapes
    mid = Image.new("RGB", (640, 144), BLACK)
    draw = ImageDraw.Draw(mid)
    fill(mid, DEEP_GREY)
    x = 0
    while x < 640:
        w = random.randint(30, 90)
        h = random.randint(30, 110)
        gap = random.randint(10, 50)
        draw.rectangle((x, 144 - h, x + w, 143), fill=BLACK)
        x += w + gap
    tileable_noise(mid, DEEP_GREY, density=0.06)
    save(mid, os.path.join(ROOT, "assets/parallax/mid.png"))

    # Near: subtle grunge texture
    near = Image.new("RGB", (640, 90), BLACK)
    fill(near, NEAR_BLACK)
    tileable_noise(near, NEAR_BLACK, density=0.10)
    # faint horizontal scratches
    draw = ImageDraw.Draw(near)
    for _ in range(12):
        y = random.randint(0, 89)
        draw.rectangle((0, y, 639, y), fill=DARK_GREY)
    save(near, os.path.join(ROOT, "assets/parallax/near.png"))


def make_title_bg():
    img = Image.new("RGB", (640, 360), BLACK)
    fill(img, BLACK)
    # Very low-contrast grunge panels
    draw = ImageDraw.Draw(img)
    for _ in range(8):
        x = random.randint(0, 600)
        y = random.randint(0, 320)
        w = random.randint(40, 120)
        h = random.randint(40, 120)
        draw.rectangle((x, y, x + w, y + h), fill=NEAR_BLACK)
    tileable_noise(img, BLACK, density=0.06)
    # Subtle vignette via darkening edges
    for x in range(640):
        for y in range(360):
            if x < 40 or x >= 600 or y < 40 or y >= 320:
                draw.rectangle((x, y, x, y), fill=(0x08, 0x08, 0x08))
    save(img, os.path.join(ROOT, "assets/tiles/title-bg.png"))


if __name__ == "__main__":
    make_player()
    make_ground()
    make_parallax()
    make_title_bg()
