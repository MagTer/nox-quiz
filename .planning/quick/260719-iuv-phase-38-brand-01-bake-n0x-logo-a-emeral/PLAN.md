---
quick_id: 260719-iuv
slug: phase-38-brand-01-bake-n0x-logo-a-emeral
date: 2026-07-19
status: in-progress
---

# Quick Task: Phase 38 BRAND-01 — bake N0X logo A + SNES-fidelity title backdrop

## Task

Phase 38 BRAND-01, per `.planning/phases/38-n0x-logo-closing-verification/38-DECISIONS.md`
(logo direction A "Emerald Chisel" already user-picked). Two deliverables:

1. **Bake logo A** — port `a_emerald()` from the throwaway
   `brand-candidates/generate-v2.py` into `scripts/build-art-assets.py`'s
   `build_logo()` path, producing the two REAL locked assets:
   - `assets/logo-hero.png` — 360×90 (title hero)
   - `assets/logo-badge.png` — 144×36 (level-select badge)
   RGBA, NEAREST upscale, transparent background. No scene code change needed
   (`main.js` already loads `sprite("logo-hero")` / `logo-badge`).

2. **Rebuild title backdrop** — replace the flat achromatic-grey silhouette
   `assets/tiles/title-bg.png` (currently a `_remap_luminance` grey castle) with
   a real SNES-fidelity backdrop sourced from the SAME public-domain Gothicvania
   pack the level parallax uses. Chosen source: the **castle-interior background**
   (`old-dark-castle-interior-background.png`, native color — green stained glass +
   stone, matches the emerald N0X identity). Apply a gentle darken/vignette so the
   logo reads on top. Stays 640×360 opaque RGB.

## Approach

- New helper output stays byte-compatible: same filenames, same sizes → no
  `main.js` / `title.js` / manifest path changes.
- `build_logo()`: replace the monogram-wordmark bake with the chiseled-bevel
  N0X pipeline (glyph mask → beveled gradient + rim light → neon glow → drop
  shadow), rendered at a small grid then NEAREST-upscaled to each locked size.
  Keep the two `assert .size == (...)` guards.
- `build_title_bg()`: load the castle interior source at native color, crop to
  the castle biome window, fit to 640×360, darken + radial center vignette.

## Verification gates (CLAUDE.md mandate)

- `node scripts/check-assets-manifest.mjs` (declared sprite paths exist)
- `bash scripts/check-terrain-atlas.sh` (REQUIRED — build-art-assets.py touched)
- pink-scan (emerald + native-castle are non-pink)
- `node scripts/browser-boot.mjs` (title + select render across levels)
- Title + select screenshot → USER BRAND-01 sign-off (multi-round, Phase-26 standard)

## Out of scope

The remaining Phase 38 human/real-world gates (VER-01 live deploy, VER-02 kid-UAT,
VER-03/MOVE-05 non-60Hz, MOB-05/06 device). This task only produces the bake +
sign-off screenshot.
