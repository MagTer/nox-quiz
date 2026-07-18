---
phase: 35-biome-re-dress-props
plan: 05
subsystem: props-art
tags: [props, pixel-art, pillow-bake, gothicvania, town, castle, pink-gate, retint, tileset-crop, ART-06, ART-07]
requires:
  - phase: 35-02
    provides: "scripts/build-art-assets.py::bake_prop + build_props() reusable prop-bake pipeline (crop pre-sliced source / single-panel tileset crop, tighten to bbox, retint-where-measured, native color, NO _remap_luminance, NO scale)"
  - phase: 35-03
    provides: "trial sign-off unblocking the remaining-biome rollout"
provides:
  - "assets/props/ — 9 NEW baked prop sprites (town x5: barrel/crate/street-lamp/well/sign; castle x4: column/candles/candle-stand/arch)"
  - "town props carry the board's steel-blue-night no-pink pass (215,255,-60); castle props native (measure-first, all under the pink gate)"
  - "src/assets-manifest.js — 20 kind:'prop' rows total (58 assets); town+castle art manifest-declared for placement plans 06 (town) + 07 (castle)"
  - "scripts/build-art-assets.py::build_props() extended with town + castle bake sections (all four biomes now covered)"
affects: [35-06, 35-07]
tech-stack:
  added: []
  patterns:
    - "Retint-where-measured, per-biome: town props measured 10-44% pink natively (salmon dusk pack tint) -> apply the board's town hue_shift_band(215,255,-60) uniformly (styleboard town() applies it scene-wide) -> 0.0% pink; castle props measured <3% natively -> baked NATIVE (board-faithful, no retint)"
    - "Tileset-crops-first for a thin biome: castle needs no new CC0 — the vendored Church pack supplies a pre-sliced pillar (column.png) AND single-panel tileset accents (candle sconce, altar candle, gothic arch) by explicit crop rect (one object per rect, never a tiled preview sheet — fact #4)"
    - "Isolated build_props() bake (importlib.exec_module, __main__ guard skipped) — same plan-02 pattern: avoids the full-script theme-orphan regeneration (theme deletion is plan 08) and keeps terrain/parallax byte-frozen (verified sha256-identical across the bake)"
key-files:
  created:
    - assets/props/town-barrel.png
    - assets/props/town-crate.png
    - assets/props/town-street-lamp.png
    - assets/props/town-well.png
    - assets/props/town-sign.png
    - assets/props/castle-column.png
    - assets/props/castle-candles.png
    - assets/props/castle-candle-stand.png
    - assets/props/castle-arch.png
  modified:
    - scripts/build-art-assets.py
    - src/assets-manifest.js
key-decisions:
  - "Castle sourced ZERO new CC0 — the tileset-crops-first path (Open Question 2) fully satisfied castle from vendored, already-licensed packs. The Church pack (assets/LICENSES/gothicvania-church.txt) alone supplied the whole restrained castle set: a fully pre-sliced gothic pillar (column.png, with carved gargoyle heads + two wall lanterns baked in) plus a tileset rich in single-panel gothic accents (a lit candle sconce, an altar candle on a stepped plinth, a pointed-arch window). No assets/LICENSES/ or CREDITS.md change was needed."
  - "Town props DO need the retint (unlike the swamp/cemetery trial, which measured 0.0% native). The Town pack ships a salmon/mauve dusk tint: barrel 26.1%, crate 25.9%, well 9.7%, sign 44.3% pink against the real gate (band 211-239, 8% threshold). Applying styleboard town()'s own scene-wide hue_shift_band(215,255,-60) uniformly to every town prop (board-faithful — the board dresses the whole town scene with it) drops all five to 0.0% pink. This is the plan's literal town retint instruction AND the 'retint only where measured over threshold' rule agreeing for town."
  - "Ran build_props() in ISOLATION (importlib exec_module, not `python3 scripts/build-art-assets.py`) — identical to plan 02's deviation. The full __main__ still regenerates every biome asset + emits orphan *-theme-*.png via the still-present dead THEME_PALETTES loop (theme-code deletion is plan 08, out of scope). A sha256 snapshot of assets/tiles/ + assets/parallax/ before/after the isolated bake proves the terrain/parallax atlases are byte-identical; check-terrain-atlas green independently confirms it."
  - "Restrained vocabulary sized to the thinnest-biome reality: town x5 (rich pre-sliced pack — barrel/crate for clutter, street-lamp for vertical variety, well as a centrepiece, sign as a hanging accent) and castle x4 (column + two candle variants for the iconic castle light-source + an arch window for far-wall dressing). Every crop is a single legible object; nothing over the play lane (placement is plans 06/07)."
patterns-established:
  - "Per-biome retint decision is data-driven: measure the real pink gate on the tight-cropped native prop first, then apply the board's biome tuple only if over threshold"
  - "A thin biome can be covered entirely by single-panel tileset crops (explicit rect per object) from an already-licensed pack — no new CC0 sourcing/license step required"
metrics:
  duration: ~40min
  tasks: 2
  files: 11
  completed: 2026-07-18
status: complete
---

# Phase 35 Plan 05: Biome Re-dress Props — Town + Castle Bake Summary

Baked the prop art for the two biomes the trial did not cover: **town** (levels 3–4,
the RICH pre-sliced pack) and **castle** (levels 7–8, the THINNEST biome). Extended the
plan-02 `build_props()` pipeline with a town section (board steel-blue-night retint) and
a castle section (native, tileset-crops-first). The locked "source additional CC0 where a
biome is thin" decision did **not** bite: castle was fully covered by vendored,
already-licensed packs — zero new CC0. All 9 new sprites are pink-gated, manifest-declared,
and ready for placement plans 06 (town) + 07 (castle); the terrain/parallax atlases are
byte-frozen through the bake.

## What was built

### Task 1 — Town prop vocabulary + pipeline extension (commit ff6e4e6)
- `scripts/build-art-assets.py` `build_props()`: added a **town** section — 5 pre-sliced
  named files from the vendored Town pack's `props-sliced/` dir, each baked through
  `bake_prop(..., retint=(215,255,-60))`.
- `assets/props/town-*.png` (NEW): `town-{barrel 24×30, crate 39×35, street-lamp 35×108,
  well 65×65, sign 35×44}`.
- `src/assets-manifest.js`: town + castle `kind:"prop"` rows, header count 49→58, prop
  tally 11→20.

### Task 2 — Castle prop vocabulary (tileset crops, no new CC0) (commit ec881e3)
- `scripts/build-art-assets.py` `build_props()`: added a **castle** section — the Church
  pack's pre-sliced `column.png` baked directly, plus three single-panel crops from the
  Church tileset (explicit crop rects, one object each).
- `assets/props/castle-*.png` (NEW): `castle-{column 114×190, candles 31×21,
  candle-stand 15×25, arch 32×64}`. All baked NATIVE (measure-first, all under the pink
  gate).

## Baked sprite keys → source + license

| Manifest key | File | Source (vendored, `_gothicvania-src/`) | Bake | Native pink | License |
|---|---|---|---|---|---|
| `prop-town-barrel` | town-barrel.png | Town `PNG/environment/props-sliced/barrel.png` | retint (215,255,-60) | 26.1% → 0.0% | gothicvania-town.txt |
| `prop-town-crate` | town-crate.png | Town `props-sliced/crate.png` | retint (215,255,-60) | 25.9% → 0.0% | gothicvania-town.txt |
| `prop-town-street-lamp` | town-street-lamp.png | Town `props-sliced/street-lamp.png` | retint (215,255,-60) | 0.0% → 0.0% | gothicvania-town.txt |
| `prop-town-well` | town-well.png | Town `props-sliced/well.png` | retint (215,255,-60) | 9.7% → 0.0% | gothicvania-town.txt |
| `prop-town-sign` | town-sign.png | Town `props-sliced/sign.png` | retint (215,255,-60) | 44.3% → 0.0% | gothicvania-town.txt |
| `prop-castle-column` | castle-column.png | Church `ENVIRONMENT/column.png` (pre-sliced pillar) | native | 1.2% | gothicvania-church.txt |
| `prop-castle-candles` | castle-candles.png | Church `ENVIRONMENT/tileset.png` crop (193,38,224,59) — candle sconce | native | 0.0% | gothicvania-church.txt |
| `prop-castle-candle-stand` | castle-candle-stand.png | Church `tileset.png` crop (247,88,273,117) — altar candle on plinth | native | 2.6% | gothicvania-church.txt |
| `prop-castle-arch` | castle-arch.png | Church `tileset.png` crop (286,16,321,81) — gothic pointed-arch window | native | 0.0% | gothicvania-church.txt |

**Tileset crops vs new CC0:** ALL four castle props are from vendored packs — one pre-sliced
file (`column.png`) + three single-panel tileset crops. **Zero new CC0 was sourced**, so no
`assets/LICENSES/<source>.txt` or `CREDITS.md` entry was required (Open Question 2 resolved in
favour of crops).

## Verification (gates)

| Gate | Result |
|---|---|
| `node scripts/check-assets-manifest.mjs` | **PASS** — 58 assets verified on disk |
| `bash scripts/check-pink-gate.sh` | **PASS** — no prop over threshold (only the pre-existing allowlisted player-swamphunter.png reported) |
| `bash scripts/check-terrain-atlas.sh` | **PASS** — all SAW/GAP/SLAB/GREY checks green (atlases untouched) |
| `bash scripts/check-import-safety.sh` | **PASS** (a727c13; manifest stays pure-data) |
| `bash scripts/check-safety.sh` | **PASS** |
| terrain/parallax sha256 before/after isolated bake | **byte-identical** |
| orphan `*theme*.png` after bake | **none** (theme deletion remains plan 08) |

## Deviations from Plan

### Adapted (Rule 3 — blocking)

**1. [Rule 3 - Blocking] Re-fetched the absent town/church/patreon source packs**
- **Found during:** Task 1 setup.
- **Issue:** `assets/_gothicvania-src/` is gitignored; only the two trial packs (swamp,
  cemetery) were on this checkout. Town + Church + Patreon (castle tilesets) were absent —
  no source = no bake.
- **Fix:** Re-fetched the Town, Church, and Patreon-collection zips from the documented,
  Phase-31-approved OpenGameArt URLs in `ASSET-SCOUTING.md`, restructured to the canonical
  styleboard wrapper paths (`gothicvania-town-files/GothicVania-town-files/...`,
  `gothicvania-church-files/gothicvania church files/...`,
  `gothicvaniapatreoncollection/ gothicvania patreon collection/...`). This is the sanctioned
  re-fetch mechanism (the packs are gitignored because they are large + re-fetchable, not
  because they are unvetted); NOT a package install.
- **Files modified:** none tracked (source dir is gitignored).

**2. [Rule 3 - Scope adaptation] Ran build_props() in isolation, not the full bake script**
- **Found during:** Task 1 verify.
- **Issue:** The plan's verify literal is `python3 scripts/build-art-assets.py`, but the full
  `__main__` still runs the dead `THEME_PALETTES` loop (emits orphan `*-theme-*.png`; theme
  deletion is plan 08) and regenerates every committed biome asset.
- **Fix:** Baked ONLY the props via an isolated `importlib` `exec_module` + `build_props()`
  call (`__main__` guard skipped). A sha256 snapshot of `assets/tiles/` + `assets/parallax/`
  before/after proves the terrain/parallax atlases are byte-identical; `check-terrain-atlas`
  green independently confirms it. Identical to plan 02's documented deviation.
- **Files modified:** `scripts/build-art-assets.py` (bake code only).

### Design (board-faithful, documented)

**3. [Deviation - board parity] Castle baked NATIVE (no retint), unlike the plan's "measure first" fallback expectation**
- The plan anticipated castle *might* need retint or new CC0. Measured, every castle prop is
  under the pink gate natively (column 1.2%, candles 0.0%, candle-stand 2.6%, arch 0.0%), so
  all baked native per the "retint only where measured" rule — and every prop came from a
  vendored already-licensed pack, so no CC0 step fired either. The thinnest biome turned out
  fully coverable from crops.

## Known Stubs

None. All 9 new props are real baked art on disk, manifest-declared, and pink-gated. The props
are not yet PLACED — town placement is plan 06, castle placement is plan 07 (this plan bakes
ART ONLY and touches no `src/levels/*.js`).

## Self-Check: PASSED

- Created files exist: `assets/props/{town-barrel,town-crate,town-street-lamp,town-well,town-sign,castle-column,castle-candles,castle-candle-stand,castle-arch}.png` — all present on disk (9/9).
- Commits exist in git log: ff6e4e6 (town), ec881e3 (castle).
- Gates green: check-assets-manifest (58), check-pink-gate, check-terrain-atlas, check-import-safety, check-safety; terrain/parallax byte-identical; no theme orphans.
