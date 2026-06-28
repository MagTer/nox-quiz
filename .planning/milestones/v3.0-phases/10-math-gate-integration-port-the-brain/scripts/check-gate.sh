#!/usr/bin/env bash
# check-gate.sh — the structural verification gate for src/ui/mathGate.js.
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit check for the math gate. It encodes the firewall / anti-leak /
# no-timer / no-DOM-sink / one-way contracts as fail-fast static assertions.
#
# Each assertion exits non-zero with a clear message on failure. On full success it
# prints "gate checks: PASS". The banned tokens appear ONLY inside the grep PATTERNS
# below (the matcher) — never in the matched source file (src/ui/mathGate.js).
#
# Run from the repo root:
#   bash .planning/phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"
TARGET="$ROOT/src/ui/mathGate.js"

fail() {
  echo "gate checks: FAIL — $1" >&2
  exit 1
}

# 0. The target must exist.
[ -f "$TARGET" ] || fail "missing target file: src/ui/mathGate.js"

# 1. Syntax gate.
node --check "$TARGET" || fail "node --check failed (syntax error in src/ui/mathGate.js)"

# 2. Public API present.
grep -q 'export function openMathGate' "$TARGET" \
  || fail "missing 'export function openMathGate' (public API contract)"

# 3. Bridge wiring present (one-way gate -> brain consumes both methods).
grep -q 'brain.nextQuestion' "$TARGET" \
  || fail "missing 'brain.nextQuestion' reference (bridge wiring)"
grep -q 'brain.reportResult' "$TARGET" \
  || fail "missing 'brain.reportResult' reference (bridge wiring)"

# 4. Camera-immune overlay (GATE-01).
grep -q 'fixed(' "$TARGET" \
  || fail "missing 'fixed(' screen-space overlay (GATE-01 camera-immune render)"

# 5. Leak-safe close: BOTH a controller cancel() AND a destroy() call.
grep -q 'cancel()' "$TARGET" \
  || fail "missing 'cancel()' — captured key controllers not cancelled on close (leak)"
grep -q 'destroy(' "$TARGET" \
  || fail "missing 'destroy(' — tagged gate objects not destroyed on close (leak)"

# 6. NEGATIVE — GATE-01 (no DOM sink): no innerHTML sink, no document. ref, no modal dialog API.
if grep -Eq 'innerHTML|document\.|alert\(' "$TARGET"; then
  fail "DOM sink found (innerHTML/document./alert) — gate must render via Kaplay text() only (GATE-01)"
fi

# 7. NEGATIVE — GATE-05 (no timer/time-pressure): no deferred scheduler, no wait/loop countdown.
if grep -Eq 'setTimeout|setInterval|countdown|timer|[^a-zA-Z]wait\(|[^a-zA-Z]loop\(' "$TARGET"; then
  fail "timer/scheduler found (setTimeout/setInterval/wait/loop/countdown) — gate must have no time pressure (GATE-05)"
fi

# 8. NEGATIVE — one-way dependency: the gate never imports the scene layer.
if grep -Eq 'from .*scenes/' "$TARGET"; then
  fail "scene import found ('from ...scenes/') — the gate must be one-way (gate -> brain only)"
fi

echo "gate checks: PASS"
