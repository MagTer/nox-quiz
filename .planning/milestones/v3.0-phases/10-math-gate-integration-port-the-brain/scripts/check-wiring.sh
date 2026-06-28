#!/usr/bin/env bash
# check-wiring.sh — the structural verification gate for the scene-to-gate wiring
# in src/scenes/game.js (the onReachGoal() seam, GATE-03).
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit check for the scene wiring. It encodes the single-bridge /
# anti-leak / freeze-preserved / stub-removed / single-handler contracts as fail-fast
# static assertions.
#
# Each assertion exits non-zero with a clear message on failure. On full success it
# prints "wiring checks: PASS". The banned token in the NEGATIVE check appears ONLY
# inside the grep PATTERN below (the matcher) — never as a passing line in the source.
#
# Run from the repo root:
#   bash .planning/phases/10-math-gate-integration-port-the-brain/scripts/check-wiring.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"
TARGET="$ROOT/src/scenes/game.js"

fail() {
  echo "wiring checks: FAIL — $1" >&2
  exit 1
}

# 0. The target must exist.
[ -f "$TARGET" ] || fail "missing target file: src/scenes/game.js"

# 1. Syntax gate.
node --check "$TARGET" || fail "node --check failed (syntax error in src/scenes/game.js)"

# 2. The single scene-to-gate bridge handoff is present.
grep -q 'openMathGate(' "$TARGET" \
  || fail "missing 'openMathGate(' — onReachGoal() does not hand off to the gate (GATE-03 bridge)"

# 3. Fresh per-scene brain + the level-clear hook are present.
grep -q 'createBrain(' "$TARGET" \
  || fail "missing 'createBrain(' — the per-scene brain is not constructed (anti-leak, T-10-06)"
grep -q 'onClear' "$TARGET" \
  || fail "missing 'onClear' — the GATE-03 level-clear hook is not wired"

# 4. Player-freeze preserved — the level pauses while the gate is open.
grep -q 'player.paused = true' "$TARGET" \
  || fail "missing 'player.paused = true' — the player-freeze (level pause) was dropped"

# 5. NEGATIVE — the old placeholder stub must be gone (the gate owns the on-goal UI now).
if grep -q 'text("GOAL!")' "$TARGET"; then
  fail "placeholder stub still present (text(\"GOAL!\")) — the gate must own the on-goal UI"
fi

# 6. Exactly ONE goal handler — the single-point seam must not be duplicated (T-10-07).
GOAL_HANDLERS="$(grep -c 'player.onCollide("goal"' "$TARGET" || true)"
[ "$GOAL_HANDLERS" = "1" ] \
  || fail "expected exactly 1 'player.onCollide(\"goal\"' handler, found $GOAL_HANDLERS (single-point seam duplicated)"

echo "wiring checks: PASS"
