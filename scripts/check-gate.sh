#!/usr/bin/env bash
# check-gate.sh — the structural verification gate for the shared src/ui/challenge.js seam.
#
# RESTORED from the Phase 10 archive (.planning/milestones/v3.0-phases/
# 10-math-gate-integration-port-the-brain/scripts/check-gate.sh, commit 4e02732) and
# re-pointed at the Phase 15 shared challenge seam. The archived original targeted
# src/ui/mathGate.js directly; Phase 15 extracts a shared src/ui/challenge.js seam that
# mathGate.js AND src/mechanics/door.js both call through (CONTEXT-locked decision: one
# shared ui/challenge.js seam for all four math mechanics + the end gate).
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit check for the challenge seam. It encodes the firewall / anti-leak /
# no-timer / no-DOM-sink / one-way / thin-caller contracts as fail-fast static assertions.
#
# Each assertion exits non-zero with a clear message on failure. On full success it
# prints "gate checks: PASS". The banned/required tokens appear ONLY inside the grep
# PATTERNS below (the matcher) — never as plain prose in this script.
#
# strip_comments (mirrors scripts/check-safety.sh's idiom) routes EVERY assertion —
# positive and negative — through a comment-stripped view of the target file. The
# archived original had NO comment-stripping at all; without it, a positive assertion
# could accidentally pass on an explanatory comment mentioning the same token instead of
# the real code construct. This restore closes that ambiguity.
#
# DE-FLAKED (Phase 22, Wave 0): every strip_comments pipeline below now uses a count
# form that reads stdin to EOF — [ "$(... | grep -c 'PATTERN')" -gt 0 ] — instead of an
# early-exit quiet-mode match. Root cause of the old ~30% spurious FAIL on a clean tree:
# under pipefail, an early-exiting quiet-mode grep closes its stdin pipe on first match,
# which can SIGPIPE the upstream sed before it finishes writing; the pipeline's exit
# status then reflects sed's SIGPIPE death instead of grep's successful match (diagnosed
# in Phase 21 deferred-items.md, commit 32348f5). The count form also closes a latent
# false-GREEN race in the negative assertions (6-8): a FOUND banned token could
# previously SIGPIPE sed the same way, make the if-condition report failure, and
# silently skip the fail branch. Patterns, fail messages, assertion order, and
# set -euo pipefail are all unchanged — only the pipeline form differs.
#
# EXPECTED RED right now: src/ui/challenge.js does not exist yet (it lands in 15-02),
# and mathGate.js/door.js are not yet thin openChallenge callers (15-02/15-03) — matching
# the project's "expected red until X lands" convention (check-progress.sh, check-safety.sh).
#
# Run from the repo root:
#   bash scripts/check-gate.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"
TARGET="$ROOT/src/ui/challenge.js"

fail() {
  echo "gate checks: FAIL — $1" >&2
  exit 1
}

# Strip // line comments so a banned/required token in prose never satisfies a positive
# grep or dodges a negative grep — every assertion below is routed through this.
strip_comments() { sed -E 's://.*$::' "$1"; }

# 0. The target must exist.
[ -f "$TARGET" ] || fail "missing target file: src/ui/challenge.js"

# 1. Syntax gate.
node --check "$TARGET" || fail "node --check failed (syntax error in src/ui/challenge.js)"

# 2. Public API present.
[ "$(strip_comments "$TARGET" | grep -c 'export function openChallenge')" -gt 0 ] \
  || fail "missing 'export function openChallenge' (public API contract)"

# 3. Bridge wiring present (one-way gate -> brain consumes both methods).
[ "$(strip_comments "$TARGET" | grep -c 'brain.nextQuestion')" -gt 0 ] \
  || fail "missing 'brain.nextQuestion' reference (bridge wiring)"
[ "$(strip_comments "$TARGET" | grep -c 'brain.reportResult')" -gt 0 ] \
  || fail "missing 'brain.reportResult' reference (bridge wiring)"

# 4. Camera-immune overlay (GATE-01).
[ "$(strip_comments "$TARGET" | grep -c 'fixed(')" -gt 0 ] \
  || fail "missing 'fixed(' screen-space overlay (GATE-01 camera-immune render)"

# 5. Leak-safe close: BOTH a controller cancel() AND a destroy()/destroyAll() call.
#    Accepts either teardown form — challenge.js (per 15-PATTERNS.md) tears down via
#    destroyAll("challenge"), and the literal substring destroy( does NOT match
#    destroyAll( (the "A" immediately follows "destroy", not "("), so both are accepted.
[ "$(strip_comments "$TARGET" | grep -c 'cancel()')" -gt 0 ] \
  || fail "missing 'cancel()' — captured key controllers not cancelled on close (leak)"
[ "$(strip_comments "$TARGET" | grep -Ec 'destroy\(|destroyAll\(')" -gt 0 ] \
  || fail "missing 'destroy(' or 'destroyAll(' — tagged gate objects not destroyed on close (leak)"

# 6. NEGATIVE — GATE-01 (no DOM sink): no innerHTML sink, no document. ref, no modal dialog API.
if [ "$(strip_comments "$TARGET" | grep -Ec 'innerHTML|document\.|alert\(')" -gt 0 ]; then
  fail "DOM sink found (innerHTML/document./alert) — gate must render via Kaplay text() only (GATE-01)"
fi

# 7. NEGATIVE — GATE-05 (no timer/time-pressure): no deferred scheduler, no wait/loop countdown.
if [ "$(strip_comments "$TARGET" | grep -Ec 'setTimeout|setInterval|countdown|timer|[^a-zA-Z]wait\(|[^a-zA-Z]loop\(')" -gt 0 ]; then
  fail "timer/scheduler found (setTimeout/setInterval/wait/loop/countdown) — gate must have no time pressure (GATE-05)"
fi

# 8. NEGATIVE — one-way dependency: the gate never imports the scene layer.
if [ "$(strip_comments "$TARGET" | grep -Ec 'from .*scenes/')" -gt 0 ]; then
  fail "scene import found ('from ...scenes/') — the gate must be one-way (gate -> brain only)"
fi

# 9. THIN CALLER — src/ui/mathGate.js must be a thin wrapper over the shared seam
#    (CONTEXT-locked decision: mathGate.js and door.js are each "sanity-checked as thin
#    callers" of the shared ui/challenge.js seam).
MATHGATE="$ROOT/src/ui/mathGate.js"
[ -f "$MATHGATE" ] || fail "missing src/ui/mathGate.js — must be a thin wrapper over the shared seam"
[ "$(strip_comments "$MATHGATE" | grep -c 'openChallenge')" -gt 0 ] \
  || fail "src/ui/mathGate.js does not call openChallenge — must be a thin wrapper over the shared seam"

# 10. THIN CALLER — src/mechanics/door.js must reuse the shared seam.
DOOR="$ROOT/src/mechanics/door.js"
[ -f "$DOOR" ] || fail "missing src/mechanics/door.js — the door mechanic must reuse the shared seam"
[ "$(strip_comments "$DOOR" | grep -c 'openChallenge')" -gt 0 ] \
  || fail "src/mechanics/door.js does not call openChallenge — the door mechanic must reuse the shared seam"

# 11. THIN CALLER — src/mechanics/gates.js must reuse the shared seam (MECH-04).
GATES="$ROOT/src/mechanics/gates.js"
[ -f "$GATES" ] || fail "missing src/mechanics/gates.js — the checkpoint gate mechanic must reuse the shared seam"
[ "$(strip_comments "$GATES" | grep -c 'openChallenge')" -gt 0 ] \
  || fail "src/mechanics/gates.js does not call openChallenge — the checkpoint gate mechanic must reuse the shared seam"

# 12. THIN CALLER — src/mechanics/enemy.js must reuse the shared seam (MECH-05).
ENEMY="$ROOT/src/mechanics/enemy.js"
[ -f "$ENEMY" ] || fail "missing src/mechanics/enemy.js — the enemy mechanic must reuse the shared seam"
[ "$(strip_comments "$ENEMY" | grep -c 'openChallenge')" -gt 0 ] \
  || fail "src/mechanics/enemy.js does not call openChallenge — the enemy mechanic must reuse the shared seam"

echo "gate checks: PASS"
