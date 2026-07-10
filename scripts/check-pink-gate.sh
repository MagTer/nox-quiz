#!/usr/bin/env bash
# check-pink-gate.sh — the ART-01 no-pink automated gate (HSV dominant-hue scan).
#
# The project has NO JS test framework, so this script IS the automated per-commit
# check for the no-pink rule across every vendored asset PNG. Threshold: ~8-10%
# of an asset's OPAQUE pixels landing in the pink/magenta hue band is a HARD-FAIL
# (CONTEXT.md's relaxed threshold — small incidental pink pixels must NOT trip it).
#
# The actual pixel math lives in scripts/lib/pink_scan.py (Pillow HSV scan); this
# wrapper is the uniform invocation surface every other check-*.sh gate uses.
#
# Scan scope: recursively scans the real, shipped assets/ tree ONLY. Raw/pre-bake
# vendored-source subtrees (assets/_gothicvania-src/, assets/_kenney-src/,
# assets/_opengameart-src/, assets/_font-src/) are pruned by pink_scan.py itself —
# they are gitignored (or pre-bake) source, never the shipped scan target.
#
# Run from the repo root:
#   bash scripts/check-pink-gate.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"

fail() {
  echo "pink-gate checks: FAIL — $1" >&2
  exit 1
}

python3 "$ROOT/scripts/lib/pink_scan.py" "$ROOT/assets" || fail "one or more assets exceed the pink/magenta dominant-hue threshold (see output above)"

echo "pink-gate checks: PASS"
