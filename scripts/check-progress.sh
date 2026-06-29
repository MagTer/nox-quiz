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

# Strip // line comments so a banned token in prose never false-matches a NEGATIVE grep
# (repo convention; mirrors scripts/check-safety.sh strip_comments). The codebase uses
# // line comments almost exclusively; extend this if a /* */ block comment is ever added.
strip_comments() { sed -E 's://.*$::' "$1"; }

# 0. Existence + syntax gate for each module this layer is built from.
#    Each guarded so a missing Wave-1+ file produces a clear FAIL, not a raw bash error.
#    The three src/levels/* registry modules (Phase 13 Wave 1–2) are added to the loop so a
#    missing or syntax-broken registry file yields a clear FAIL, not a raw bash error.
for f in \
  "src/progress.js" "src/ui/hud.js" "src/math/brain.js" \
  "src/levels/index.js" "src/levels/build.js" "src/levels/level-01.js"; do
  [ -f "$ROOT/$f" ] || fail "missing module: $f (created by Phase 11/13 Wave 1–3)"
  node --check "$ROOT/$f" || fail "node --check failed (syntax error in $f)"
done

# 1. Persistence seam present — the guarded quota catch + the versioned save key.
grep -q 'QuotaExceededError' "$ROOT/src/progress.js" \
  || fail "missing 'QuotaExceededError' guard in src/progress.js (writeSave must tolerate a full quota)"
# Phase 13 clean-reset key bump: the NEW versioned key (v2), NOT the v3.0 v1 key. This grep
# and CONFIG.SAVE.KEY in src/config.js must agree (the canonical grep-coupling trap, Pitfall 6).
grep -q 'mathlab_platformer_v2' "$ROOT/src/config.js" \
  || fail "missing NEW versioned save key 'mathlab_platformer_v2' in src/config.js (Phase 13 clean reset)"

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

# --- Phase 13: new save shape (per-level cleared map) + level registry/builder ---

# 11. Cleared-map seam present in progress.js (SAVE-06 stored fact). The levels map plus the
#     two helpers prove the per-level completion seam exists in the pure module.
grep -q 'markCleared' "$ROOT/src/progress.js" \
  || fail "missing 'markCleared' in src/progress.js (SAVE-06: per-level cleared fact must be settable)"
grep -q 'isLevelCleared' "$ROOT/src/progress.js" \
  || fail "missing 'isLevelCleared' in src/progress.js (SAVE-06: per-level cleared fact must be readable)"
grep -q 'levels' "$ROOT/src/progress.js" \
  || fail "missing 'levels' map in src/progress.js (SAVE-06: serialize/validate must carry the cleared map)"

# 12. Registry / builder API present (LVL-02). The ordered registry exposes LEVEL_ORDER +
#     getLevel + the derived-unlock helper; the builder exposes buildLevel.
grep -q 'LEVEL_ORDER' "$ROOT/src/levels/index.js" \
  || fail "missing 'LEVEL_ORDER' export in src/levels/index.js (LVL-02: the ordered registry)"
grep -q 'getLevel' "$ROOT/src/levels/index.js" \
  || fail "missing 'getLevel' in src/levels/index.js (LVL-02: id → descriptor lookup)"
grep -q 'isUnlocked' "$ROOT/src/levels/index.js" \
  || fail "missing 'isUnlocked' in src/levels/index.js (SAVE-06: derived unlock from LEVEL_ORDER)"
grep -q 'buildLevel' "$ROOT/src/levels/build.js" \
  || fail "missing 'buildLevel' in src/levels/build.js (LVL-02: the one parameterized builder)"

# 13. NEGATIVE — a727c13 import-safety: the DATA + REGISTRY modules reference NO engine globals
#     at all (engine globals only exist after kaplay({global}) runs; a top-level reference would
#     throw at import and blank the game). Comments stripped first so a prose mention never
#     false-flags. SCOPED to level-01.js + index.js ONLY — build.js LEGITIMATELY references
#     Rect/add(/etc. INSIDE buildLevel's body (a727c13-correct), so it is excluded here.
for f in "src/levels/level-01.js" "src/levels/index.js"; do
  if strip_comments "$ROOT/$f" | grep -Eq 'typeof Rect|[^a-zA-Z]add\(|[^a-zA-Z]rect\(|[^a-zA-Z]sprite\(|[^a-zA-Z]vec2\(|kaplay'; then
    fail "engine global referenced in $f — registry/data modules must be a727c13-safe (no top-level engine ref; that throws at import and blanks the game)"
  fi
done

# 14. Final step — invoke the headless math/seed smoke.
node "$ROOT/scripts/smoke-progress.mjs" || fail "smoke-progress failed (pure XP/level + seed adaptation)"

echo "progress checks: PASS"
