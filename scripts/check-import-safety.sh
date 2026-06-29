#!/usr/bin/env bash
# check-import-safety.sh — the a727c13 import-safety gate for the Phase 14 scene shell.
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit check that the new SCENE modules never reference a Kaplay engine
# global at MODULE TOP LEVEL. A top-level engine reference throws at import (engine
# globals only exist after kaplay({global}) runs) and blanks the canvas — the a727c13
# regression this gate exists to prevent.
#
# Scaffolding (set -euo pipefail, ROOT, fail(), strip_comments) mirrors
# scripts/check-progress.sh verbatim. The negative grep is SCOPED to the pure-at-import
# scene modules (title.js, select.js) and ANCHORED to top-level statement forms ONLY —
# a naive whole-file grep would false-flag the legitimate, body-internal add()/text()/
# rect() calls those scenes (and game.js) make inside their factory bodies (RESEARCH
# Pitfall 5). game.js and main.js are NOT scanned by the negative grep — they
# legitimately use engine globals inside function bodies / at post-init module scope.
#
# EXPECTED until Plan 02 lands: Section 1's main.js greps FAIL (the title/select scenes
# are registered nowhere and the boot still go("game", ...)). That is the real red state
# this wave — the gate is a real check, not a no-op. It turns fully green once Plan 02
# flips main.js to register title/select and boot go("title").
#
# Run from the repo root:
#   bash scripts/check-import-safety.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"

fail() {
  echo "import-safety checks: FAIL — $1" >&2
  exit 1
}

# Strip // line comments so a banned token in prose never false-matches a NEGATIVE grep
# (repo convention; mirrors scripts/check-progress.sh / check-safety.sh). The codebase
# uses // line comments almost exclusively; extend this if a /* */ block is ever added.
strip_comments() { sed -E 's://.*$::' "$1"; }

# The module-TOP-LEVEL a727c13 trap pattern (anchored — used by Section 2 and the
# calibration). Two forms:
#   (a) a column-0 (const|let|var) declaration whose initializer calls a Kaplay engine
#       factory: add/rect/sprite/text/vec2/rgb/onKeyPress/onKeyDown/onClick/onUpdate
#   (b) a top-level `typeof <engine-symbol>` guard (Rect|add|vec2|rgb)
# Anchored to ^ (column 0 / leading blanks for the typeof form) so an INDENTED in-body
# call is never matched.
TOPLEVEL_TRAP='^(const|let|var)[^=]*=[^=]*\b(add|rect|sprite|text|vec2|rgb|onKeyPress|onKeyDown|onClick|onUpdate)\(|^[[:space:]]*typeof (Rect|add|vec2|rgb)\b'

# 0. Existence + syntax gate for each module this shell is built from.
#    Guarded so a missing/syntax-broken file produces a clear FAIL, not a raw bash error.
for f in \
  "src/scenes/title.js" "src/scenes/select.js" \
  "src/scenes/game.js" "src/main.js"; do
  [ -f "$ROOT/$f" ] || fail "missing module: $f"
  node --check "$ROOT/$f" || fail "node --check failed (syntax error in $f)"
done

# 1. POSITIVE structural invariants — each scene exports a factory; main.js registers
#    both new scenes and boots the title scene (the boot greps go GREEN only in Plan 02).
grep -Eq 'export function .*[Ss]cene\(' "$ROOT/src/scenes/title.js" \
  || fail "title.js must export a scene factory (export function ...Scene(...))"
grep -Eq 'export function .*[Ss]cene\(' "$ROOT/src/scenes/select.js" \
  || fail "select.js must export a scene factory (export function ...Scene(...))"
grep -q 'scene("title"' "$ROOT/src/main.js" \
  || fail "main.js must register the title scene (Plan 02): scene(\"title\", titleScene)"
grep -q 'scene("select"' "$ROOT/src/main.js" \
  || fail "main.js must register the select scene (Plan 02): scene(\"select\", selectScene)"
grep -q 'go("title"' "$ROOT/src/main.js" \
  || fail "main.js must boot the title scene (Plan 02): go(\"title\")"

# 2. NEGATIVE — a727c13 module-TOP-LEVEL gate. SCOPED to the scene modules title.js +
#    select.js ONLY, comment-stripped, anchored to top-level statement forms. game.js and
#    main.js are deliberately EXCLUDED — they legitimately reference engine globals inside
#    function bodies / at post-init module scope (RESEARCH Pitfall 5).
for f in "src/scenes/title.js" "src/scenes/select.js"; do
  if strip_comments "$ROOT/$f" | grep -Eq "$TOPLEVEL_TRAP"; then
    fail "engine global referenced at MODULE TOP LEVEL in $f — scenes must be a727c13-safe (engine globals only INSIDE the factory body; a top-level ref throws at import and blanks the game)"
  fi
done

echo "import-safety checks: PASS"
