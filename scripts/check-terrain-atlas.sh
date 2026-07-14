#!/usr/bin/env bash
# check-terrain-atlas.sh — the ART-02 terrain pixel gate.
#
# The project has NO JS test framework, so this script IS the automated per-commit check
# that the baked biome ground atlases are actually usable terrain. It is the FIRST gate in
# this repo that looks at rendered pixels rather than at mechanics, safety, or file
# existence.
#
# It exists because the other nine gates cannot see art. The full suite was green while the
# game shipped floors made of a repeating sawtooth (town's ground cap was a ROOF TRIANGLE,
# castle's an ARCH PEAK), and green again while the ground the player walks on was grey
# static (_remap_luminance had been dropped from the parallax bake but never from the
# terrain bake). A human caught both, at a checkpoint, twice — see 33-05-SUMMARY.md and
# ART-PARITY-STEERING.md.
#
# Hard-fails on: SAW (jagged cap silhouette that tiles into a sawtooth), GREY (achromatic
# atlas => the luminance remap is back), GAP (transparent cap top row => ground renders
# below its own collider), and geometry drift (frames that aren't native 16x32).
#
# The actual pixel math lives in scripts/lib/terrain_scan.py (Pillow); this wrapper is the
# uniform invocation surface every other check-*.sh gate uses.
#
# NOTE — this gate reads the COMMITTED PNGs, not the bake script. A bake that is correct in
# theory but emits a bad PNG still fails, which is the point: for a full phase, the script
# and the shipped atlases had silently diverged.
#
# Run from the repo root:
#   bash scripts/check-terrain-atlas.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"

fail() {
  echo "terrain-atlas checks: FAIL — $1" >&2
  exit 1
}

python3 "$ROOT/scripts/lib/terrain_scan.py" "$ROOT/assets" \
  || fail "one or more biome ground atlases would render as a sawtooth, a grey placeholder, or floating ground (see output above)"

echo "terrain-atlas checks: PASS"
