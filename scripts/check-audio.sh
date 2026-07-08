#!/usr/bin/env bash
# check-audio.sh — the structural verification gate for Phase 27's audio layer
# (SFX + ambient music + persisted mute toggle).
#
# The project has NO JS test framework (no-build / no-dep canon), so this script IS the
# automated per-commit/per-wave check for the audio asset/license/config-key contract. It
# mirrors scripts/check-progress.sh's shape: fail-fast static assertions, clear FAIL messages,
# a final PASS echo on full success.
#
# EXPECTED until Plan 27-02 lands CONFIG.AUDIO: assertion 4 below (the mute storage key) will
# FAIL — a real gate, not a bug in this script. 27-01-PLAN.md's own <action> text documents
# this exact "real gate, expected red until a later wave" pattern (mirrors check-progress.sh's
# own header for the same reason during earlier phases).
#
# Run from the repo root:
#   bash scripts/check-audio.sh

set -euo pipefail

# Resolve repo root so the script works regardless of the caller's cwd.
ROOT="$(git rev-parse --show-toplevel)"

fail() {
  echo "audio checks: FAIL — $1" >&2
  exit 1
}

# 1. Existence — all 7 SFX + the one ambient music track, by exact literal filename (later
#    plans hardcode these names in loadSound()/loadMusic() calls).
for f in jump land correct wrong door clear pickup; do
  [ -f "$ROOT/assets/sfx/$f.ogg" ] || fail "missing assets/sfx/$f.ogg (Plan 27-01: vendored SFX)"
done
[ -f "$ROOT/assets/music/ambient.ogg" ] || fail "missing assets/music/ambient.ogg (Plan 27-01: vendored ambient loop)"

# 2. Existence — one license proof file per vendored audio asset. NOTE: the door SFX proof is
#    named door-sfx.txt (NOT door.txt) — assets/LICENSES/door.txt already exists as the visual
#    door SPRITE's proof from Phase 26 and must never be overwritten/reused.
for f in jump land correct wrong door-sfx clear pickup ambient; do
  [ -f "$ROOT/assets/LICENSES/$f.txt" ] || fail "missing assets/LICENSES/$f.txt (Plan 27-01: license proof)"
done

# 3. CREDITS.md mentions every new vendored asset's filename.
for f in jump.ogg land.ogg correct.ogg wrong.ogg door.ogg clear.ogg pickup.ogg ambient.ogg; do
  grep -q "$f" "$ROOT/CREDITS.md" \
    || fail "CREDITS.md missing a mention of $f (Plan 27-01: one CREDITS.md row per vendored asset)"
done

# 4. Mute storage key — distinct from the existing save key. This assertion is EXPECTED RED
#    until Plan 27-02 lands CONFIG.AUDIO/src/audio.js; it is a real gate, not a no-op.
grep -q 'noxrun_mute_v1' "$ROOT/src/config.js" \
  || fail "missing mute storage key 'noxrun_mute_v1' in src/config.js (Plan 27-02: CONFIG.AUDIO not yet landed — EXPECTED until then)"

# 4b. NEGATIVE — the mute-key line must never also carry the save-key literal (the two keys
#     must stay genuinely distinct, not just differently-cased copies of one another).
if grep 'noxrun_mute_v1' "$ROOT/src/config.js" | grep -q 'noxrun_platformer_v1'; then
  fail "the mute storage key line in src/config.js also contains the save key literal 'noxrun_platformer_v1' — the mute key must be its own distinct key, never combined with CONFIG.SAVE.KEY"
fi

echo "audio checks: PASS"
