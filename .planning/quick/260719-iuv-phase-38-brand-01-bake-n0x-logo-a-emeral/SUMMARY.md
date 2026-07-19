---
quick_id: 260719-iuv
slug: phase-38-brand-01-bake-n0x-logo-a-emeral
date: 2026-07-19
status: complete
---

# Summary: Phase 38 BRAND-01 — N0X logo A + SNES-fidelity title backdrop

## What shipped

**1. N0X logo A "Emerald Chisel" baked** (`scripts/build-art-assets.py` `build_logo`)
- Ported the `a_emerald()` pipeline from the throwaway `brand-candidates/generate-v2.py`
  into `build-art-assets.py` as `_logo_*` helpers + `_build_n0x_mark()`, and rewrote
  `build_logo()` to size the native mark onto an exact 4:1 canvas and scale to the two
  locked targets.
- `assets/logo-hero.png` (360×90) — NEAREST **upscale** → crisp blocky SNES pixels.
- `assets/logo-badge.png` (144×36) — LANCZOS **downscale** (deliberate deviation from the
  NEAREST-only note: at badge size NEAREST broke the chiseled strokes — the exact
  "hard to read on the level-select screen" failure prior human-verify flagged; LANCZOS
  keeps it legible and is already this file's downscale idiom).
- Added `ImageFilter, ImageChops` to the PIL import.
- Uppercase **N0X**, moss→neon vertical-gradient body, neon rim-light, dark chisel
  shadow, neon outer glow, drop shadow. Colors mirror CONFIG.PALETTE (ACCENT_MOSS + REWARD).

**2. Title backdrop rebuilt** (`build_title_bg`)
- Replaced the flat achromatic-grey Kenney silhouette (`_remap_luminance` grey castle)
  with a real SNES-fidelity scene from the SAME public-domain Gothicvania pack the level
  parallax uses: the castle biome's own far-layer source
  (`old-dark-castle-interior-background.png` — green stained-glass windows + stone
  columns), **native color**, same (250,0,890,304) window + bottom-anchor + stretch_top
  ceiling-fill as `build_biome_parallax_castle`.
- Two title-only treatments: a global darken (`TITLE_BG_DARKEN=0.62`) so the bright
  windows can't overpower the logo, and a soft radial black vignette
  (`TITLE_BG_VIGNETTE_ALPHA=0.42`) centered on title.js's logo anchor for guaranteed
  logo contrast (no hard backing rect).
- Same filename/size (640×360 opaque RGB) → no scene/manifest edit.

No `src/` changes — `main.js` already loads `sprite("logo-hero")` / `logo-badge` and
`sprite("title-bg")`.

## Verification (all green)

- `check-pink-gate` PASS · `check-assets-manifest` PASS (61 assets) · `check-terrain-atlas` PASS
- `check-safety` PASS · `check-import-safety` PASS · `check-gate` PASS · `check-progress` PASS
- `browser-boot` **PASS** (exit 0) — title → select → all 8 levels, no runtime errors
- Live title + select screenshots captured and shown to user for BRAND-01 sign-off.

## Follow-up / still open (Phase 38 human gates)

- **BRAND-01 human sign-off** on the shown title/select shots (multi-round, Phase-26
  standard — not auto-closed by this task).
- The other Phase 38 finish-line gates remain user/device-gated: VER-01 live Dokploy
  playthrough, VER-02 kid-UAT, VER-03/MOVE-05 non-60Hz, MOB-05 device audio,
  MOB-06 kid touch tuning.

## Notes

- `ENVIRONMENT_PALETTE_TITLE` is now unused by `build_title_bg` (left in place; harmless).
- Ignored the pre-existing untracked strays per STATE.md (`assets/enemy-{1,2,3}.png`,
  `.planning/phases/26-*/`) — not staged.
