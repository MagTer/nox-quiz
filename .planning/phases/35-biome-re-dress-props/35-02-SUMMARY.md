---
phase: 35-biome-re-dress-props
plan: 02
subsystem: props-art
tags: [props, pixel-art, pillow-bake, gothicvania, pink-gate, geometry-freeze, screenshot-evidence, ART-06, ART-07]
requires:
  - phase: 35-01
    provides: "CONFIG.PROPS.{Z_BACK -8, Z_SURFACE -3} + build.js collider-free props emit loop + main.js kind:'prop' load branch + check-geometry-frozen.mjs gate + screenshot-phase35-props.mjs"
provides:
  - "assets/props/ — 11 baked prop sprites (swamp x4: tree/reed/vine/fern; cemetery x7: statue/stone-1..4/tree/bush), native color, all 0.0% pink"
  - "scripts/build-art-assets.py::bake_prop + build_props() — the reusable prop-bake pipeline (crop pre-sliced source, strip backdrop plate, native color/res, retint-where-measured) for the remaining-6 rollout"
  - "src/assets-manifest.js — 11 kind:'prop' rows (49 assets total)"
  - "level-01 (swamp) + level-06 (cemetery) dressed with restrained top-level props[] arrays; geometry byte-frozen"
  - "prop-shots/ — 4 trial screenshots (the evidence packet for the plan-03 human sign-off)"
affects: [35-03, remaining-6-level rollout, phase-36-motion]
tech-stack:
  added: []
  patterns:
    - "bake_prop pipeline: open RGBA -> [strip top backdrop plate] -> [crop rect] -> [drop stray small islands] -> tighten to alpha bbox -> [hue_shift_band] -> save; NO _remap_luminance, NO scale (props are free-size, not 16x32 terrain cells)"
    - "Retint-only-where-measured: measure the REAL pink gate (pink_scan band 211-239) BEFORE retinting; 0% -> bake native (board-faithful)"
    - "Top-level descriptor props[] (never inside geometry) keeps check-geometry-frozen byte-identical through art dressing"
    - "Vertical-level prop dressing: props on the wide catacomb floors + background dead-corners only, OFF the climb/descent/pillars/key-spur"
key-files:
  created:
    - assets/props/swamp-tree.png
    - assets/props/swamp-reed.png
    - assets/props/swamp-vine.png
    - assets/props/swamp-fern.png
    - assets/props/cemetery-statue.png
    - assets/props/cemetery-stone-1.png
    - assets/props/cemetery-stone-2.png
    - assets/props/cemetery-stone-3.png
    - assets/props/cemetery-stone-4.png
    - assets/props/cemetery-tree.png
    - assets/props/cemetery-bush.png
    - .planning/phases/35-biome-re-dress-props/prop-shots/level-01-swamp-spawn.png
    - .planning/phases/35-biome-re-dress-props/prop-shots/level-06-cemetery-spawn.png
    - .planning/phases/35-biome-re-dress-props/prop-shots/level-06-cemetery-climb.png
    - .planning/phases/35-biome-re-dress-props/prop-shots/level-06-cemetery-catacomb.png
  modified:
    - scripts/build-art-assets.py
    - src/assets-manifest.js
    - src/levels/level-01.js
    - src/levels/level-06.js
key-decisions:
  - "Baked ALL 11 trial props NATIVE (retint=None): every one measures 0.0% pink against the real gate (pink_scan band 211-239), and styleboard.py composites these exact sliced-objects natively — its (195,245,-50) cemetery retint is applied ONLY to the far background/mountains (already in the parallax assets), NOT to foreground objects. 'Retint only where measured' -> native is board-faithful."
  - "swamp-tree required flood-removing trees.png's opaque (30,32,30) crown-backdrop plate (the plate color IS the tree's own shadow tone, so color-keying shreds it; a top-edge flood removes only the connected backdrop band). Cropped the right tree (x>=168) clear of the left tree, dropped stray leaf tips."
  - "Ran build_props() in ISOLATION rather than the full `python3 scripts/build-art-assets.py`: only the two trial packs (swamp+cemetery) are present on this checkout, so the full __main__ crashes on the absent castle tileset, and would also regenerate committed biome assets + emit orphan theme PNGs (out-of-scope dead loop). Terrain-atlas gate confirms the atlases are untouched."
  - "Added a 4th supplementary screenshot (level-06-cemetery-catacomb.png): on a vertical level the richest cemetery dressing (statue/tombstones/bush on F1-F4) sits at neither spawn nor climb altitude, so it is captured explicitly for the load-bearing human sign-off."
patterns-established:
  - "bake_prop / build_props reusable prop-bake pipeline (build-art-assets.py)"
  - "Restrained legibility-first placement: negative-z props + kept clear of every mechanic/route; on-surface y = surfaceY - spriteHeight"
metrics:
  duration: ~35min
  tasks: 3
  files: 15
  completed: 2026-07-17
status: complete
---

# Phase 35 Plan 02: Biome Re-dress Props — 2-Level Trial Summary

Proved the whole props pipeline end-to-end on the two trial biomes: baked a THIN swamp
vocabulary (gnarled tree, reed, vine, fern) and a RICHER cemetery vocabulary (a hooded
statue, four tombstone/cross variants, a bare tree, a bush) from the vendored,
style-board-approved Gothicvania packs — native color, pink-gated — wired them through the
manifest, and hand-placed RESTRAINED top-level `props[]` arrays on level-01 (swamp, calm,
lateral) and level-06 (cemetery, vertical shaft) with geometry left byte-frozen. Captured
four trial screenshots as the evidence packet for the plan-03 human sign-off.

## What was built

### Task 1 — Bake swamp + cemetery props + manifest rows (commit 9d38337)
- `scripts/build-art-assets.py`: added `bake_prop(out_name, src_rel, crop, strip_plate, drop_small, retint)` + two helpers (`_prop_strip_top_plate`, `_prop_drop_small_islands`) + a `build_props()` bake list, and a `build_props()` call in `__main__`. Pipeline mirrors `_bake_biome_atlas`'s crop→[retint]→save MINUS any `_remap_luminance` (the achromatic-grey trap) and MINUS any scale (props are free-size).
- `assets/props/` (NEW): 11 sprites — `swamp-{tree 120x159, reed 38x35, vine 55x21, fern 45x32}`, `cemetery-{statue 63x75, stone-1 21x37, stone-2 27x40, stone-3 27x33, stone-4 19x38, tree 166x117, bush 76x65}`. Every one measured **0.0% pink** against the real gate → baked **native** (see Deviations).
- `src/assets-manifest.js`: 11 `kind:"prop"` rows + header count 37→49 + a `prop (11)` tally line.
- Gates: `check-assets-manifest` PASS (49), `check-pink-gate` PASS (no prop over threshold), `check-terrain-atlas` PASS (atlases untouched).

### Task 2 — Restrained swamp props on level-01 (commit b40009d)
- `src/levels/level-01.js`: appended a top-level `props[]` (sibling of `mechanics`/`biome`/`parallax`) — geometry object byte-untouched. 3 background gnarled trees (layer `back`, base at the floor line) behind the calm F2/F4/F8 islands + 6 on-surface reed/fern/vine accents on clear floor tops (`y = 320 - height`). Every prop clear of DOOR@820, ENEMY@2700, the four spikes, all coins, GOAL@6820.
- Gates: `validate-levels` PASS (0 HARD-FAIL), `check-geometry-frozen` PASS (byte-identical), `check-assets-manifest` PASS.

### Task 3 — Cemetery props on level-06 + trial screenshots (commit 3f9d5d5)
- `src/levels/level-06.js`: appended a top-level `props[]`. This is the VERTICAL switchback density probe — props kept OFF the climb tiers (EL0/EC1/LIP), the rightward shaft descent (DS1..DS4), the coffin-lid pillars (PL1/PL2), and the KEY spur (KA). Dressed only the WIDE catacomb floors F1–F4 + background dead-corners, sparse: 2 background gnarled trees (one frames the entry, one in the catacomb depth) + 7 on-surface statue/stone-1..4/bush accents, all clear of DOOR@1800, ENEMY@2600, the two spikes, coins, KEY, GOAL@4300. The full RICH cemetery vocabulary is exercised.
- `prop-shots/`: captured the trial evidence via `screenshot-phase35-props.mjs level-01 level-06` + a supplementary catacomb capture.
- Gates: `validate-levels` PASS, `check-geometry-frozen` PASS, `browser-boot` PASS (both trial levels boot + stay under OBJECT_BUDGET / above FPS_FLOOR with props).

## Trial screenshot evidence (for the plan-03 human sign-off)

All under `/home/magnus/dev/nox-quiz/.planning/phases/35-biome-re-dress-props/prop-shots/`:

| File | Shows |
|------|-------|
| `level-01-swamp-spawn.png` | Swamp spawn — a reed accent beside the player; coins/route fully legible. |
| `level-06-cemetery-spawn.png` | Cemetery entry — the background gnarled tree frames the spawn ledge behind the player/coin (correct z-order, no occlusion); blue-moon parallax + tombstone silhouettes. |
| `level-06-cemetery-climb.png` | Shaft-top climb altitude — a clean, uncluttered vertical traversal lane (props deliberately kept off the climb/descent). |
| `level-06-cemetery-catacomb.png` | F1 catacomb — the hooded statue, a cross tombstone, and the background tree dress the floor; the green door + player render in front (props behind, no occlusion). Supplementary (see Deviations). |

Visual read: props are atmospheric background/on-surface accents; every route, coin, hazard, mechanic, and the door/enemy/goal stay legible. No floaters/sinkers (on-surface bases rest on their ledges). No mis-cropped sheets — each PNG is a single object.

## Deviations from Plan

### Auto-fixed / adapted (Rule 3 — blocking)

**1. [Rule 3 - Blocking] Re-fetched the absent source packs**
- **Found during:** Task 1 setup.
- **Issue:** `assets/_gothicvania-src/` is gitignored and absent on this checkout (verified nowhere on the filesystem). No source = no bake.
- **Fix:** Re-fetched the swamp + cemetery packs (the only two the trial needs) from the documented, Phase-31-approved OpenGameArt URLs in `ASSET-SCOUTING.md` into the gitignored source dir, restructured to the canonical styleboard wrapper paths. This is the sanctioned re-fetch mechanism (the packs are gitignored because they are large + re-fetchable, not because they are unvetted); NOT a package install.
- **Files modified:** none tracked (source dir is gitignored).

**2. [Rule 3 - Scope adaptation] Ran build_props() in isolation, not the full bake script**
- **Found during:** Task 1 verify.
- **Issue:** The plan's verify runs `python3 scripts/build-art-assets.py`, but the full `__main__` (a) crashes on the absent castle/patreon tileset (only the two trial packs were fetched), and (b) would regenerate every committed biome asset + emit 32 orphan `*-theme-*.png` from the still-present dead theme loop (theme-code deletion is a SEPARATE plan, out of scope here).
- **Fix:** Baked ONLY the new props via an isolated `build_props()` import. The `check-terrain-atlas` gate confirms the terrain atlases are byte-untouched (the point of that gate in the verify list). Cleaned the 32 orphan theme PNGs + a stray palette swatch created before the crash.
- **Files modified:** `scripts/build-art-assets.py` (bake code only).

### Design (board-faithful, documented)

**3. [Deviation - board parity] Baked cemetery props NATIVE, not with the (195,245,-50) retint**
- **Issue:** The plan's Task 1 literal text says to apply `hue_shift_band(_, 195, 245, -50)` to the cemetery props. Measuring the REAL gate (`pink_scan` band 211-239, 8% threshold), all cemetery objects read **0.0% pink** natively; and `styleboard.py`'s `cemetery()` composites these exact `sliced-objects` **natively** — it applies the (195,245,-50) pass only to the far `background.png`/`mountains.png` (already baked into the shipped parallax assets), not to the foreground objects.
- **Resolution:** Followed the plan's own binding artifact rule "`hue_shift_band` retint only where measured" + ART-PARITY-STEERING (styleboard is normative). Native is the board-faithful, gate-passing choice; retinting greyscale stone would deviate from the board for no measured reason.

**4. [Rule 2 - added evidence] Supplementary catacomb screenshot**
- **Issue:** On a vertical level the richest cemetery dressing (statue/tombstones/bush on the F1–F4 catacomb floors) is at neither spawn nor climb altitude — so the 3 required shots don't show it, leaving the load-bearing human sign-off blind to the core vocabulary.
- **Fix:** Captured `level-06-cemetery-catacomb.png` via a throwaway (scratchpad-only) copy of the screenshot script, retargeted to the catacomb floor. The committed `screenshot-phase35-props.mjs` was NOT modified (copy-not-extract convention).

## Known Stubs

None. All 11 props are real baked art on disk, manifest-declared, and placed. The props path is inert-by-design only on the 6 not-yet-dressed levels (`props ?? []` guard) — those are dressed in the plan-03 rollout after the human sign-off.

## Self-Check: PASSED

- Created files exist: `assets/props/*.png` (11), `prop-shots/*.png` (4) — all present on disk.
- Commits exist in git log: 9d38337, b40009d, 3f9d5d5.
- All structural + pixel gates green: check-assets-manifest, check-pink-gate, check-terrain-atlas, validate-levels, check-geometry-frozen, check-import-safety, check-safety, browser-boot.
