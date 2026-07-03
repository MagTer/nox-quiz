#!/usr/bin/env bash
# check-safety.sh — the SAFE-01 ADHD-safety audit gate for the whole src/ tree.
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit check for the no-timer + forgiving mandate across ALL of src/.
# It encodes two whole-tree static contracts as fail-fast assertions:
#   (1) NO timers / schedulers anywhere in src/ code (SAFE-01 no-timer mandate).
#   (2) NO punishment constructs anywhere in src/ code (forgiving mandate).
# Plus two positive cross-checks that come green as later Phase-12 waves land:
#   (3) the persistent controls hint text (SAFE-02), and
#   (4) the fx.js self-clean idiom (Plan 01).
#
# CRITICAL nuance: banned words already appear LEGITIMATELY in existing code COMMENTS
# (the gate/hud/scene modules document their own no-scheduler discipline in prose). A naive
# whole-src grep would match that prose. So every negative scan runs on a COMMENT-STRIPPED
# view of each file (the strip_comments pre-pass) — it matches code, never comments.
#
# The matched literals appear ONLY inside the grep PATTERN strings below (the matcher) —
# never as plain prose in this script, so the audit never matches itself.
#
# Each assertion exits non-zero with a clear message on failure. On full success it prints
# "safety checks: PASS".
#
# EXPECTED until Plan 02 lands: the positive SAFE-02 hint check (3) goes red — a real gate,
# not a no-op. The negative no-timer + forgiving scans (1)/(2) pass clean on the current tree.
#
# Run from the repo root (or any cwd — ROOT is resolved via git):
#   bash scripts/check-safety.sh
#
# Phase 19 verified: the whole-src find below covers every new module added in
# Phases 13–18, including src/mechanics/, src/parallax.js, src/levels/, src/ui/,
# src/scenes/, and all art/animation consumers. The no-timer + no-punishment
# scans therefore apply to the fully assembled v4.0 tree.

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"

fail() {
  echo "safety checks: FAIL — $1" >&2
  exit 1
}

# Strip // line comments so prose mentions of banned words don't false-positive.
# The codebase uses // line comments almost exclusively (verified); if a /* */ block
# comment with a banned word is ever added, extend this stripper.
strip_comments() { sed -E 's://.*$::' "$1"; }

# 0. Syntax gate — every src module must parse.
while IFS= read -r f; do
  node --check "$f" || fail "node --check failed (syntax error in $f)"
done < <(find "$ROOT/src" -name '*.js')

# 1. NEGATIVE no-timer (SAFE-01): no scheduler in CODE (comments stripped).
#    Paren-aware: a loop:/wait: object PROPERTY (colon) is fine; only the call forms with an
#    open paren are schedulers. The banned scheduler/countdown literals live in the PATTERN below.
while IFS= read -r f; do
  if strip_comments "$f" | grep -Eq 'setTimeout|setInterval|countdown|[^a-zA-Z]wait\(|[^a-zA-Z]loop\(|lifespan\('; then
    fail "timer/scheduler in code: $f (SAFE-01 no-timer mandate)"
  fi
done < <(find "$ROOT/src" -name '*.js')

# 2. NEGATIVE forgiving: no punishment construct in CODE (comments stripped).
#    Punishment-specific tokens ONLY — deliberately NOT a broad xp-decrement pattern, which
#    would false-positive on the legitimate, firewalled level-up surplus carry-over in
#    src/progress.js (carry surplus over, the OPPOSITE of an XP-loss penalty).
while IFS= read -r f; do
  if strip_comments "$f" | grep -Eiq 'gameOver|game_over|loseLife|lives--|subtractXp|deductXp|xpLoss|penaliz'; then
    fail "punishment construct in code: $f (forgiving mandate)"
  fi
done < <(find "$ROOT/src" -name '*.js')

# 3. POSITIVE (SAFE-02): the persistent controls hint text is present in CODE.
#    Comment-stripped so a mere prose mention (e.g. config.js documenting the hint copy)
#    does NOT satisfy the gate — only the actually-mounted hint string counts.
#    EXPECTED RED until Plan 02 mounts the hint — a real gate, not a no-op.
hint_in_code=""
while IFS= read -r f; do
  if strip_comments "$f" | grep -q 'SPACE jump'; then
    hint_in_code="yes"
    break
  fi
done < <(find "$ROOT/src" -name '*.js')
[ -n "$hint_in_code" ] \
  || fail "missing persistent controls hint 'SPACE jump' in src/ code (SAFE-02 — expected until Plan 02 lands)"

# 4. POSITIVE (Plan 01): fx effects self-clean via tween().onEnd, never a scheduler.
#    Skip if src/fx.js does not exist yet — Plan 01 creates it.
if [ -f "$ROOT/src/fx.js" ]; then
  grep -q 'onEnd' "$ROOT/src/fx.js" \
    || fail "fx.js effects must self-clean via tween().onEnd (no scheduler)"
fi

echo "safety checks: PASS"
