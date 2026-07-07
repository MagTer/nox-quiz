#!/usr/bin/env bash
# check-rebrand.sh — the permanent BRAND-02 regression gate against stale pre-rebrand
# branding text anywhere in the project.
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit check that the old brand name never creeps back in after the
# Phase 26 rebrand swept it out of both the core src/ runtime (Plan 26-09) and the docs/
# deploy-config/art-pipeline-script half (Plan 26-10 — this plan).
#
# It follows check-safety.sh's exact shape: a fail() helper, a comment-stripped scan for
# code files (so the codebase's own explanatory prose about "the old name" — like this
# header — doesn't false-positive), and a clear PASS banner on full success.
#
# Scan scope (the FULL sweep 26-CONTEXT.md specifies):
#   - every *.js / *.mjs file under src/ and scripts/         (comment-stripped)
#   - every *.py file under scripts/                          (comment-stripped)
#   - every *.sh file under scripts/, EXCLUDING this script    (raw — a shell script's own
#     comments are its literal prose here, and this script must not match itself, mirroring
#     check-safety.sh's own "the audit never matches itself" discipline)
#   - README.md, CREDITS.md, docs/*.md, docker/Dockerfile, src/index.html
#                                                              (raw — prose IS the content)
#
# ALLOWLIST: src/progress.js documents the unrelated, never-touched original school game's
# save keys in two comments. Those lines are pre-filtered out of the scan (by their own
# distinguishing suffix) before the negative check runs — any OTHER occurrence of the old
# brand name in that file still fails the gate.
#
# Each hit exits non-zero with the offending file + matched line(s). On full success it
# prints "rebrand checks: PASS".
#
# Run from the repo root (or any cwd — ROOT is resolved via git):
#   bash scripts/check-rebrand.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"

fail() {
  echo "rebrand checks: FAIL — $1" >&2
  exit 1
}

# Strip // line comments so prose mentions of the old name in JS comments don't false-positive.
strip_js_comments() { sed -E 's://.*$::' "$1"; }
# Strip # line comments so prose mentions of the old name in Python comments don't false-positive.
strip_py_comments() { sed -E 's:#.*$::' "$1"; }

# Scan one file's already-prepared content (raw or comment-stripped, per caller) for the
# banned old-brand literal, honoring the single allowlisted exception (the school game's
# save-key comments in src/progress.js). grep -n on the pre-filter step preserves original
# line numbers since line-stripping never removes whole lines, only trailing comment text.
scan_content() {
  local file="$1"
  local content="$2"
  local hits
  hits=$(printf '%s\n' "$content" | grep -Eni 'math ?lab' | grep -vi 'mathlab_save' || true)
  if [ -n "$hits" ]; then
    fail "old brand name found in $file
$hits"
  fi
}

# 1. src/ and scripts/ JS/MJS — comment-stripped.
while IFS= read -r f; do
  scan_content "${f#"$ROOT"/}" "$(strip_js_comments "$f")"
done < <(find "$ROOT/src" "$ROOT/scripts" -type f \( -name '*.js' -o -name '*.mjs' \))

# 2. scripts/ Python — comment-stripped.
while IFS= read -r f; do
  scan_content "${f#"$ROOT"/}" "$(strip_py_comments "$f")"
done < <(find "$ROOT/scripts" -type f -name '*.py')

# 3. scripts/ shell scripts — raw (a shell script's own comments are its literal prose
#    here). Excludes this script itself so the gate never matches its own allowlist/doc text.
while IFS= read -r f; do
  scan_content "${f#"$ROOT"/}" "$(cat "$f")"
done < <(find "$ROOT/scripts" -type f -name '*.sh' ! -name 'check-rebrand.sh')

# 4. Docs / deploy config / entry HTML — raw (prose IS the content being checked).
for f in "$ROOT/README.md" "$ROOT/CREDITS.md" "$ROOT/docker/Dockerfile" "$ROOT/src/index.html"; do
  [ -f "$f" ] && scan_content "${f#"$ROOT"/}" "$(cat "$f")"
done
while IFS= read -r f; do
  scan_content "${f#"$ROOT"/}" "$(cat "$f")"
done < <(find "$ROOT/docs" -type f -name '*.md')

echo "rebrand checks: PASS"
