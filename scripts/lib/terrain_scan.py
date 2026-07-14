#!/usr/bin/env python3
"""terrain_scan.py -- the pixel math behind check-terrain-atlas.sh.

WHY THIS GATE EXISTS
--------------------
Every other gate in this project checks mechanics, safety, or file EXISTENCE. None of
them look at a rendered pixel. The full 9-gate suite was green while the game shipped
floors made of a repeating sawtooth, and green AGAIN while the ground the player walks
on was grey static. A human caught both, at a checkpoint, twice (33-05-SUMMARY.md).
ART-PARITY-STEERING.md predicted exactly this: "a game whose every level is a black void
passes the whole suite."

This gate closes that hole for terrain. It inspects the actual pixels of each baked biome
atlas and hard-fails on the three failure modes that have ALREADY shipped undetected here:

  SAW   The cap frame's top silhouette is jagged. build.js stamps the cap frame once per
        16px column across a floor run, so ANY diagonal or peaked silhouette repeats
        forever as a sawtooth. Town's cap once pointed at a ROOF TRIANGLE (top-edge range
        70px) and castle's at an ARCH PEAK -- both selected as islands()[0], the largest
        island, which is the ground block only for swamp.

  GREY  The frames are achromatic. _remap_luminance() flattens art onto a grey ramp -- it
        discards hue by design. It was correctly dropped from the PARALLAX bake in caebfae
        but lived on in the TERRAIN bake, so backgrounds regained full Gothicvania color
        while the ground stayed a grey placeholder.

  GAP   The cap frame's top row is fully transparent. build.js draws the cap at
        pos(tx, runY), where runY IS the collider's top edge -- so a transparent top row
        renders the visible ground floating BELOW the surface the player stands on. An
        aspect-preserving fit+bottom-pad (WR-01, 31-REVIEW.md) produced exactly this, and
        it sat undetected in the script for a full phase because nobody re-baked.

  SLAB  (frame 2, added 2026-07-14) The PLATFORM frame's bottom half is not transparent.
        A raised platform's collider is `p.h` (16px), but its visual used to be a 48px
        slab (a 32px cap plus a 32px fill starting 16px down) -- 32px of ledge hanging
        below the surface the player stands on, which ate the headroom under the tier
        above (level-08's 75px rise measured -5px of VISUAL clearance: the player's head
        rendered inside the ledge above her). The fix is frame 2: the cap's top 16px cell
        over a FULLY TRANSPARENT bottom half, drawn at the cap's 32px frame height so it
        reads as a 16px ledge that matches the collider exactly. If that bottom half ever
        fills in, the 48px slab is silently back and no other gate would notice -- so it
        is asserted here, in pixels, like everything else in this file.

It deliberately does NOT re-implement the bake: it reads the committed PNGs, which is what
the game actually loads. A bake that is "correct in theory" but produces a bad PNG fails.

Usage:  python3 scripts/lib/terrain_scan.py <assets_root>
Exit 0 = PASS, exit 1 = HARD-FAIL.
"""

import os
import sys

from PIL import Image

BIOMES = ("swamp", "town", "cemetery", "castle")

# One native terrain tile cell; the atlas is 3 frames: cap | fill | platform.
# Frame 2 (platform) was added 2026-07-14 — see SLAB above.
CELL_W, CELL_H = 16, 32
FRAMES = 3
CAP_X = 0 * CELL_W  # frame 0 — walkable ground surface (floors AND platforms draw it)
PLATFORM_X = 2 * CELL_W  # frame 2 — the 16px WYSIWYG ledge (platforms only)
PLATFORM_SOLID_H = CELL_H // 2  # 16px — the ledge; rows below this MUST be transparent

# A cap tile's top edge may undulate organically (moss, grass blades, rubble). It may not
# RAMP. Swamp's real moss line varies 3px; the roof triangle varied 70px, the arch peak 26.
# 8px sits comfortably above real terrain texture and far below anything that reads as a saw.
MAX_TOP_EDGE_RANGE = 8

# Achromatic detection -- i.e. "has _remap_luminance come back?"
#
# Measured directly against both versions of all four atlases (remapped vs native):
#
#     biome      remapped maxChroma      native maxChroma
#     swamp                     11                    107
#     town                      11                     76
#     cemetery                  11                    135
#     castle                    11                    115
#
# The remap maps EVERY pixel onto ENVIRONMENT_PALETTE, whose entries are near-grey, so no
# remapped pixel can exceed a channel spread of ~11 NO MATTER what the source art was.
# Native art always contains at least some saturated pixel. So the single sharpest test is
# the atlas's MAXIMUM chroma, not the fraction of colored pixels.
#
# Fraction-of-colored-pixels was tried first and rejected: it false-failed town, whose cobble
# is real art but legitimately desaturated (only 7.9% of its pixels carry strong chroma). Max
# chroma separates the two populations with a ~3x margin on BOTH sides and does not punish
# art for being muted -- which matters, because this is a deliberately dark, grungy game.
MIN_MAX_CHROMA = 32  # sits between the remapped ceiling (11) and the native floor (76)


def _frame_profile(px, x0, h=CELL_H):
    """For the CELL_W-wide frame starting at x0: (top_edge, top_row_opaque_count).

    top_edge is the y of the first opaque pixel in each column (columns that are fully
    transparent contribute nothing) -- the frame's drawn top silhouette.
    """
    top_edge = []
    top_row_opaque = 0
    for x in range(x0, x0 + CELL_W):
        if px[x, 0][3] > 0:
            top_row_opaque += 1
        for y in range(h):
            if px[x, y][3] > 0:
                top_edge.append(y)
                break
    return top_edge, top_row_opaque


def _check_saw(out, biome, code, label, top_edge, tiles_across):
    """SAW: a frame stamped once per 16px column must not have a RAMPED top edge."""
    if not top_edge:
        out.append((biome, code, False, f"{label} frame is fully transparent"))
        return
    rng = max(top_edge) - min(top_edge)
    if rng > MAX_TOP_EDGE_RANGE:
        out.append(
            (
                biome,
                code,
                False,
                f"{label} top-edge range {rng}px > {MAX_TOP_EDGE_RANGE}px -- this silhouette "
                f"repeats every 16px as a SAWTOOTH across every {tiles_across}. cap_rect is almost "
                f"certainly pointing at non-ground art (a roof, an arch, a slope). "
                f"profile={top_edge}",
            )
        )
    else:
        out.append(
            (biome, code, True, f"{label} top-edge range {rng}px (<= {MAX_TOP_EDGE_RANGE}px, tiles cleanly)")
        )


def _check_gap(out, biome, code, label, top_row_opaque, where):
    """GAP: a frame drawn at pos(tx, runY) -- where runY IS the collider's top edge --
    must have SOME opaque pixel in row 0, or the art renders below its own collider.
    (Partial transparency is legal: cemetery's grass blades are a silhouette, not a bar.)
    """
    if top_row_opaque == 0:
        out.append(
            (
                biome,
                code,
                False,
                f"{label} frame row 0 is fully transparent -- the ground surface would render BELOW "
                f"its own collider line (build.js draws it at pos(tx, runY) for {where}, and runY IS "
                f"the collider top). This is the aspect-preserving fit+bottom-pad failure (WR-01); "
                f"terrain cells are native 16x32 and are never padded.",
            )
        )
    else:
        out.append(
            (biome, code, True, f"{label} frame row 0 opaque (ground surface sits on the collider line)")
        )


def scan_atlas(path, biome, out):
    if not os.path.exists(path):
        out.append((biome, "missing", False, f"{path} does not exist"))
        return

    im = Image.open(path).convert("RGBA")
    if im.size != (CELL_W * FRAMES, CELL_H):
        out.append(
            (
                biome,
                "geometry",
                False,
                f"atlas is {im.width}x{im.height}, expected {CELL_W * FRAMES}x{CELL_H} "
                f"({FRAMES} native frames of {CELL_W}x{CELL_H} -- cap | fill | platform; terrain "
                f"cells are never scaled). If this atlas is {CELL_W * 2}x{CELL_H} it predates the "
                f"platform frame: re-run scripts/build-art-assets.py. main.js loads these with "
                f"sliceX:{FRAMES}, so a stale 2-frame sheet would slice into garbage.",
            )
        )
        return

    px = im.load()

    # --- SAW + GAP: cap frame is frame 0 (floors AND platforms draw its surface) ---
    cap_top_edge, cap_top_row_opaque = _frame_profile(px, CAP_X)
    _check_saw(out, biome, "saw", "cap", cap_top_edge, "floor")
    _check_gap(out, biome, "gap", "cap", cap_top_row_opaque, "every floor run")

    # --- PLATFORM (frame 2): the 16px WYSIWYG ledge ---
    # Same two surface checks as the cap (it IS the cap's top cell, so it is stamped once
    # per 16px column across a platform and must neither ramp nor float)...
    plat_top_edge, plat_top_row_opaque = _frame_profile(px, PLATFORM_X)
    _check_saw(out, biome, "plat-saw", "platform", plat_top_edge, "platform")
    _check_gap(out, biome, "plat-gap", "platform", plat_top_row_opaque, "every raised platform")

    # ...plus the one check that is unique to it: the bottom half MUST be fully
    # transparent. That emptiness is the entire point of the frame -- it is what makes a
    # raised platform render as a 16px ledge matching its 16px collider instead of the old
    # 48px slab that ate the headroom between tiers. A bake that fills it in would look
    # "fine" to every other gate.
    slab_px = 0
    for x in range(PLATFORM_X, PLATFORM_X + CELL_W):
        for y in range(PLATFORM_SOLID_H, CELL_H):
            if px[x, y][3] > 0:
                slab_px += 1

    if slab_px > 0:
        out.append(
            (
                biome,
                "slab",
                False,
                f"platform frame has {slab_px} opaque pixel(s) below row {PLATFORM_SOLID_H} -- its "
                f"bottom half MUST be fully transparent. It is drawn at the cap's full {CELL_H}px "
                f"frame height, so any opaque pixel down there hangs BELOW the platform's {PLATFORM_SOLID_H}px "
                f"collider: the 48px slab is back and the headroom between tiers is eaten again. "
                f"_bake_biome_atlas() builds this frame as the cap's TOP {PLATFORM_SOLID_H}px cell pasted "
                f"into an otherwise EMPTY {CELL_W}x{CELL_H} frame -- never a scaled/squashed whole cap.",
            )
        )
    else:
        out.append(
            (
                biome,
                "slab",
                True,
                f"platform frame rows {PLATFORM_SOLID_H}-{CELL_H - 1} fully transparent "
                f"(renders as a {PLATFORM_SOLID_H}px ledge == its {PLATFORM_SOLID_H}px collider)",
            )
        )

    # --- GREY: has the luminance remap come back? ---
    max_chroma = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            max_chroma = max(max_chroma, max(r, g, b) - min(r, g, b))

    if max_chroma < MIN_MAX_CHROMA:
        out.append(
            (
                biome,
                "grey",
                False,
                f"max chroma across the whole atlas is {max_chroma} (need >= {MIN_MAX_CHROMA}) -- this "
                f"atlas is achromatic. _remap_luminance() is back in the terrain bake; it maps every "
                f"pixel onto a near-grey palette (ceiling ~11) and discards hue by design. It was "
                f"dropped from the parallax bake for exactly this reason (caebfae). The ground will "
                f"read as a grey placeholder that the player walks on.",
            )
        )
    else:
        out.append((biome, "grey", True, f"max chroma {max_chroma} (native art, not remapped)"))


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "assets"
    results = []
    for biome in BIOMES:
        scan_atlas(os.path.join(root, "tiles", f"atlas-{biome}.png"), biome, results)

    failed = False
    for biome, code, ok, msg in results:
        status = "PASS" if ok else "HARD-FAIL"
        stream = sys.stdout if ok else sys.stderr
        print(f"  {biome:9s} | {code:8s} | {status} | {msg}", file=stream)
        if not ok:
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
