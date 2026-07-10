#!/usr/bin/env python3
"""scripts/lib/pink_scan.py — the ART-01 pink/magenta dominant-hue detector.

Adapted READ-ONLY from `.planning/research/v6-scouting/styleboard.py`'s
`hue_shift_band()` (already live-proven in this repo for the inverse
operation — hue-rotating pink skies to cold-blue). This module only COUNTS,
it never mutates a pixel.

The project has NO JS test framework (no-build / no-dep canon), so this
module + its shell wrapper (`scripts/check-pink-gate.sh`) IS the automated
per-commit check for the "no dominant-pink asset ships" rule (CONTEXT.md,
Phase 31). Threshold: >= 8% of an asset's OPAQUE pixels landing in the
pink/magenta hue band is a HARD-FAIL — the low end of CONTEXT.md's approved
"~8-10%" range, deliberately low so genuinely dominant-pink content (e.g. a
whole sky) still trips even after later brightness-based refinement. Small
incidental pink pixels (a highlight, a tiny detail) pass freely — this is
NOT a zero-tolerance scan.

Run as a library:
    from scripts.lib.pink_scan import pink_fraction
    pink_fraction("assets/some-sprite.png")  # -> float in [0.0, 1.0]

Run as a CLI:
    python3 scripts/lib/pink_scan.py                 # inline self-test (3 synthetic cases)
    python3 scripts/lib/pink_scan.py <file.png>       # single-file report (used for the
                                                       # Plan 31-03 Task 2 RED-first proof
                                                       # against raw, gitignored pack crops)
    python3 scripts/lib/pink_scan.py <directory>      # recursive directory scan (used by
                                                       # scripts/check-pink-gate.sh against
                                                       # the real, shipped assets/ tree)
"""

import os
import sys

from PIL import Image

# ---------------------------------------------------------------------------
# Locked parameters (validated 2026-07-10 planning session against BOTH the
# real re-fetched Gothicvania pack files AND every currently-shipped assets/
# PNG — see 31-RESEARCH.md / 31-03-PLAN.md). PIL 0-255 hue units.
#
# band_lo=211, band_hi=239 is narrower than a naive "200-255 pink range"
# specifically because the wider range false-positives on this project's
# existing shipped goal.png (dominant hue 244) / spike.png (dominant hue
# 185-188) — both just outside this narrower band.
# ---------------------------------------------------------------------------
BAND_LO = 211
BAND_HI = 239
MIN_SAT = 30

# 8% of opaque pixels — the low end of CONTEXT.md's approved "~8-10%" range.
# Still HARD-FAIL tier when tripped: a dominant-pink asset at this threshold
# is unambiguously a real violation, not noise.
THRESHOLD = 0.08

# ---------------------------------------------------------------------------
# Allowlist: a single, named, JUSTIFIED exception — never a silent catch-all.
# Follows scripts/check-rebrand.sh's documented-exception precedent (a
# comment-visible reason, not a hidden config value). Keyed by a path SUFFIX
# (matched against the forward-slash-normalized scanned path via .endswith),
# so it works regardless of the absolute prefix the CLI was invoked with.
#
# Do NOT add entries speculatively — every entry here must cite a specific,
# measured finding.
#
# "assets/player-swamphunter.png": the Swamp Hunter's dark plum/maroon
# pants+boots BASE FILL color (sampled RGB (50,34,46), HSV hue~223/sat~81/
# val~50) numerically falls inside the pink/magenta hue band purely because
# HUE IS UNSTABLE AT LOW BRIGHTNESS (a well-known HSV artifact for
# near-black pixel-art fill/shadow colors) — it is NOT a genuinely pink
# asset. Direct pixel-count sampling shows this single color covers 43.3%
# of the sprite's opaque pixels (a large solid fill region, not a thin
# outline) — re-verify against a render, not just the hue number, if this
# entry is ever revisited. This exact sprite was the kid's explicit
# style-board pick (31-CONTEXT.md). If Plan 31-05's actual baked
# assets/player-swamphunter.png does not in fact trip the gate (e.g.
# because of resizing/cropping choices made there), this entry is harmless
# dead weight, not a bug — it stays for the reasoning trail regardless of
# whether it is ever live.
# ---------------------------------------------------------------------------
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


def pink_fraction(path, band_lo=BAND_LO, band_hi=BAND_HI, min_sat=MIN_SAT):
    """Return the fraction of OPAQUE pixels in `path` whose HSV hue lands in
    [band_lo, band_hi] with saturation >= min_sat. Returns 0.0 if the image
    has zero opaque pixels (guarded — never divides by zero).

    MUST go via RGB before HSV: a direct P-mode -> HSV convert() raises
    ValueError on Pillow >= 6.0 (Pillow issue #3997) — the exact pitfall
    styleboard.py's hue_shift_band() already works around, replicated here.
    """
    rgba = Image.open(path).convert("RGBA")
    alpha = rgba.getchannel("A")
    hsv = rgba.convert("RGB").convert("HSV")
    apx = alpha.load()
    hpx = hsv.load()
    w, h = hsv.size

    opaque = 0
    matched = 0
    for y in range(h):
        for x in range(w):
            if apx[x, y] == 0:
                continue
            opaque += 1
            hue, sat, _val = hpx[x, y]
            if sat >= min_sat and band_lo <= hue <= band_hi:
                matched += 1

    return (matched / opaque) if opaque else 0.0


def _is_allowlisted(filepath):
    """Return the matching ALLOWLIST key (path suffix) if filepath ends with
    one of the documented allowlist entries, else None."""
    norm = filepath.replace(os.sep, "/")
    for key in ALLOWLIST:
        if norm.endswith(key):
            return key
    return None


def _iter_png_files(root_dir):
    """Yield every .png file under root_dir, recursively, PRUNING any raw/
    pre-bake vendored-source subtree along the way — e.g.
    assets/_gothicvania-src/, assets/_kenney-src/, assets/_opengameart-src/,
    assets/_font-src/. Those directories are gitignored (or pre-bake) raw
    pack content, never the shipped scan target (CONTEXT.md: the gate scans
    only shipped assets/ content). Implemented generically: ANY directory
    whose name starts with "_" is pruned from the walk, which covers all of
    the above plus any future _*-src sibling.
    """
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if not d.startswith("_")]
        for name in filenames:
            if name.lower().endswith(".png"):
                yield os.path.join(dirpath, name)


def scan_directory(root_dir):
    """Scan every shipped .png under root_dir (excluding _*-src/ subtrees).

    Returns (failures, allowlisted_hits):
      - failures: list of (path, fraction) at/over THRESHOLD, NOT allowlisted.
      - allowlisted_hits: list of (path, fraction, justification) for
        allowlisted files that tripped the threshold anyway (reported for
        visibility — the exception is always visible in the script's own
        output, never silent).
    """
    failures = []
    allowlisted_hits = []
    for filepath in sorted(_iter_png_files(root_dir)):
        frac = pink_fraction(filepath)
        if frac >= THRESHOLD:
            key = _is_allowlisted(filepath)
            if key:
                allowlisted_hits.append((filepath, frac, ALLOWLIST[key]))
            else:
                failures.append((filepath, frac))
    return failures, allowlisted_hits


def _run_selftest():
    """Inline self-test for the 3 synthetic cases in 31-03-PLAN.md's
    <behavior> block. Runs when the module is invoked with no path argument."""
    import colorsys
    import tempfile

    ok = True

    # Case 1: 2x2 RGBA, 2 fully-opaque salmon-pink pixels (Pillow HSV
    # hue ~= 230) + 2 fully-transparent pixels -> 1.0 (100% of the 2 OPAQUE
    # pixels match; the 2 transparent pixels are excluded from both the
    # numerator and the denominator).
    h_frac, s_frac, v_frac = 230 / 255, 200 / 255, 200 / 255
    r, g, b = colorsys.hsv_to_rgb(h_frac, s_frac, v_frac)
    pink_rgb = (round(r * 255), round(g * 255), round(b * 255))

    im1 = Image.new("RGBA", (2, 2), (0, 0, 0, 0))
    im1.putpixel((0, 0), (*pink_rgb, 255))
    im1.putpixel((1, 0), (*pink_rgb, 255))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f1:
        im1.save(f1.name)
    try:
        frac1 = pink_fraction(f1.name)
        status1 = "PASS" if abs(frac1 - 1.0) < 1e-9 else "FAIL"
        ok = ok and status1 == "PASS"
        print(f"[selftest] opaque-salmon-pink case: fraction={frac1} expect=1.0 -> {status1}")
    finally:
        os.unlink(f1.name)

    # Case 2: all-opaque, all-near-black (10,10,10) -> 0.0 (near-black pixels
    # have unstable/low saturation and must not spuriously match; min_sat
    # correctly excludes them).
    im2 = Image.new("RGBA", (2, 2), (10, 10, 10, 255))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f2:
        im2.save(f2.name)
    try:
        frac2 = pink_fraction(f2.name)
        status2 = "PASS" if frac2 == 0.0 else "FAIL"
        ok = ok and status2 == "PASS"
        print(f"[selftest] near-black case: fraction={frac2} expect=0.0 -> {status2}")
    finally:
        os.unlink(f2.name)

    # Case 3: all-transparent -> 0.0, no divide-by-zero (empty-denominator
    # case is guarded).
    im3 = Image.new("RGBA", (2, 2), (0, 0, 0, 0))
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f3:
        im3.save(f3.name)
    try:
        frac3 = pink_fraction(f3.name)
        status3 = "PASS" if frac3 == 0.0 else "FAIL"
        ok = ok and status3 == "PASS"
        print(f"[selftest] all-transparent case: fraction={frac3} expect=0.0 -> {status3}")
    finally:
        os.unlink(f3.name)

    return ok


def main(argv):
    if len(argv) < 2:
        ok = _run_selftest()
        print("[selftest] ALL PASS" if ok else "[selftest] ONE OR MORE FAILURES ABOVE")
        return 0 if ok else 1

    target = argv[1]

    if os.path.isdir(target):
        failures, allowlisted_hits = scan_directory(target)
        for filepath, frac in failures:
            print(
                f"PINK: {filepath} ({frac * 100:.1f}% of opaque pixels in the "
                f"pink/magenta hue band, threshold {THRESHOLD * 100:.0f}%)",
                file=sys.stderr,
            )
        for filepath, frac, justification in allowlisted_hits:
            print(
                f"ALLOWLISTED (not a failure): {filepath} ({frac * 100:.1f}%) "
                f"- {justification}",
                file=sys.stderr,
            )
        if failures:
            print(
                f"pink_scan: {len(failures)} asset(s) exceed the pink/magenta "
                f"dominant-hue threshold",
                file=sys.stderr,
            )
            return 1
        return 0

    # Single-file mode: report the fraction directly (used for the Task 2
    # RED-first proof against raw pack crops that live under the gitignored
    # _*-src/ trees, which the directory-walk mode deliberately excludes).
    frac = pink_fraction(target)
    print(f"{target}: {frac:.4f} ({frac * 100:.1f}% of opaque pixels in the pink/magenta hue band)")
    if frac >= THRESHOLD and not _is_allowlisted(target):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
