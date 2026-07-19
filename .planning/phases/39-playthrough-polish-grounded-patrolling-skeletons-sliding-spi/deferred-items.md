# Phase 39 — Deferred / out-of-scope observations

## From 39-02 (POL-05 lantern re-bake)

- **`scripts/build-art-assets.py` regenerates `assets/logo-badge.png` on a full run**
  with different bytes (3186 → 4878) than the committed Phase-38 BRAND-01 signed-off
  version. Running the monolithic bake for the swamp-lantern therefore also re-diffs the
  logo badge. Reverted `assets/logo-badge.png` to HEAD after the bake so 39-02 stays
  scoped to the lantern. Root cause NOT investigated (out of scope for POL-05) — the
  committed badge may have been hand-tuned after baking, or the badge bake is
  non-deterministic. Flag for a future prop/logo-pipeline pass.
