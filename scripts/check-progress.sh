#!/usr/bin/env bash
# check-progress.sh — the structural verification gate for the Phase 11 progression layer.
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit check for the XP/level/persistence layer. It encodes the firewall
# (progress.js imports no engine; brain.js touches no storage), the one-way HUD contract,
# and the forgiving-mandate (no XP awarded in the gate) as fail-fast static assertions, then
# invokes the headless math smoke as its final step.
#
# Each assertion exits non-zero with a clear message on failure. On full success it prints
# "progress checks: PASS". The banned tokens appear ONLY inside the grep PATTERNS below
# (the matcher) — never in matched source as plain prose.
#
# EXPECTED until Wave 1–3 land: this exits non-zero with a clear FAIL pointing at the
# not-yet-created src/progress.js / src/ui/hud.js — a real gate, not a no-op. It turns green
# as later waves create the modules it verifies.
#
# Run from the repo root:
#   bash scripts/check-progress.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"

fail() {
  echo "progress checks: FAIL — $1" >&2
  exit 1
}

# 0. Existence + syntax gate for each module this layer is built from.
#    Each guarded so a missing Wave-1+ file produces a clear FAIL, not a raw bash error.
for f in "src/progress.js" "src/ui/hud.js" "src/math/brain.js"; do
  [ -f "$ROOT/$f" ] || fail "missing module: $f (created by Phase 11 Wave 1–3)"
  node --check "$ROOT/$f" || fail "node --check failed (syntax error in $f)"
done

# 1. Persistence seam present — the guarded quota catch + the versioned save key.
grep -q 'QuotaExceededError' "$ROOT/src/progress.js" \
  || fail "missing 'QuotaExceededError' guard in src/progress.js (writeSave must tolerate a full quota)"
grep -q 'mathlab_platformer_v1' "$ROOT/src/config.js" \
  || fail "missing versioned save key 'mathlab_platformer_v1' in src/config.js"

# 2. Brain seeding wired BOTH ends — accuracy resume (SAVE-03).
grep -q 'seedAccuracy' "$ROOT/src/scenes/game.js" \
  || fail "missing 'seedAccuracy' wiring in src/scenes/game.js (boot must reseed the brain)"
grep -q 'seedAccuracy' "$ROOT/src/math/brain.js" \
  || fail "missing 'seedAccuracy' option in src/math/brain.js (brain must accept the seed)"

# 3. Brain seeding wired BOTH ends — history/mastery resume (SAVE-02/03, locked not optional).
grep -q 'seedHistory' "$ROOT/src/scenes/game.js" \
  || fail "missing 'seedHistory' wiring in src/scenes/game.js (boot must reseed the mastery window)"
grep -q 'seedHistory' "$ROOT/src/math/brain.js" \
  || fail "missing 'seedHistory' option in src/math/brain.js (brain must accept the history seed)"

# 4. Brain exposes a snapshot for serialize.
grep -q 'snapshot' "$ROOT/src/math/brain.js" \
  || fail "missing 'snapshot' on src/math/brain.js (serialize needs brain.snapshot())"

# 5. HUD is a camera-immune screen-space overlay (SAVE-04).
grep -q 'fixed(' "$ROOT/src/ui/hud.js" \
  || fail "missing 'fixed(' in src/ui/hud.js (HUD must render in screen space, camera-immune)"

# 6. NEGATIVE — firewall: progress.js imports NO engine.
if grep -Eq 'kaplay|lib/kaplay' "$ROOT/src/progress.js"; then
  fail "engine import found in src/progress.js — the persistence layer must be engine-agnostic (firewall)"
fi

# 7. NEGATIVE — firewall: brain.js touches NO browser storage.
if grep -Eq 'localStorage' "$ROOT/src/math/brain.js"; then
  fail "storage access found in src/math/brain.js — the brain must stay node-safe/headless (firewall)"
fi

# 8. NEGATIVE — one-way HUD: it reads progress, never writes back into it.
if grep -Eq 'progress\.(addXp|level[[:space:]]*=)' "$ROOT/src/ui/hud.js"; then
  fail "write-back into progress found in src/ui/hud.js — the HUD must be one-way (read-only)"
fi

# 9. NEGATIVE — forgiving mandate: the gate awards NO XP (XP lives only on the correct-clear hook).
if grep -q 'addXp' "$ROOT/src/ui/mathGate.js"; then
  fail "XP award found in src/ui/mathGate.js — wrong answers must be penalty-free; XP only on onClear (forgiving)"
fi

# 10. Final step — invoke the headless math/seed smoke.
node "$ROOT/scripts/smoke-progress.mjs" || fail "smoke-progress failed (pure XP/level + seed adaptation)"

echo "progress checks: PASS"
