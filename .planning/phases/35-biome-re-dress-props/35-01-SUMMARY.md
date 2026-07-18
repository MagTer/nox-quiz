---
phase: 35-biome-re-dress-props
plan: 01
subsystem: props-infrastructure
status: complete
tags: [props, renderer, z-order, geometry-freeze, screenshot-evidence, ART-06, ART-07]
requires:
  - "src/levels/index.js (LEVEL_ORDER, getLevel) — registry the frozen-gate + screenshot script import"
  - "src/assets-manifest.js — the manifest load loop props branch keys off `kind`"
  - "scripts/screenshot-phase33-terrain.mjs — cloned boilerplate source"
provides:
  - "CONFIG.PROPS.{Z_BACK:-8, Z_SURFACE:-3} — the props depth tunables (both negative)"
  - "build.js `levelData.props ?? []` collider-free emit loop (sprite+pos+z ONLY)"
  - "main.js `kind === 'prop'` manifest load branch"
  - "scripts/check-geometry-frozen.mjs + fixtures/geometry-frozen-baseline.json — the geometry-freeze gate"
  - "scripts/screenshot-phase35-props.mjs — per-level spawn + vertical-level climb evidence capture"
affects:
  - "The 2-level trial plan + remaining-6 rollout depend on this seam existing (props path, frozen gate, screenshot script)"
tech-stack:
  added: []
  patterns:
    - "Top-level descriptor `props` field (NOT inside geometry) → validator-neutral by construction"
    - "Negative-z props → structural legibility guarantee (props can never occlude z(0) play)"
    - "Pure-data standalone gate idiom (check-assets-manifest.mjs style), NOT wired into check-gate.sh"
    - "Playwright script copy-not-extract (CLAUDE.md duplication convention)"
key-files:
  created:
    - scripts/check-geometry-frozen.mjs
    - scripts/fixtures/geometry-frozen-baseline.json
    - scripts/screenshot-phase35-props.mjs
  modified:
    - src/config.js
    - src/levels/build.js
    - src/main.js
decisions:
  - "Both prop z-layers NEGATIVE (Z_BACK -8, Z_SURFACE -3) — legibility-first §8.5 constraint expressed structurally, not by placement discipline"
  - "props read from TOP-LEVEL levelData.props, never geometry.props — keeps geometry byte-frozen by construction"
  - "geometry-freeze gate baseline captured from current committed post-34.6 geometry (clean tree at b061384)"
  - "climb-shot heuristic keys on getLevel(id).bounds.top < 0 (geometry), never level parity — level-07 is odd AND horizontal"
metrics:
  duration: ~18min
  tasks: 3
  files: 6
  completed: 2026-07-17
---

# Phase 35 Plan 01: Props Infrastructure Summary

The props layer's end-to-end plumbing now exists with ZERO art and ZERO level dressing: a collider-free renderer path (negative-z config tunables → guarded `build.js` emit loop → `main.js` manifest load branch), a geometry-freeze snapshot gate + committed baseline that HARD-FAILs any level-geometry drift, and a per-level screenshot script that captures spawn shots for all levels plus climb-altitude shots for the vertical ones (keyed on `bounds.top < 0`). No descriptor gained a `props` array, so every structural gate is byte-identical-green before and after.

## What was built

### Task 1 — Props renderer path (commit 7c156a8)
- `src/config.js`: new `CONFIG.PROPS` block adjacent to `PARALLAX` — `Z_BACK: -8`, `Z_SURFACE: -3`. Both NEGATIVE by mandate: every gameplay entity renders at z(0), so a negative-z prop can never draw over the player, a coin, a route, or a mechanic. Both sit inside the open (NEAR_Z −10, 0) band so props draw in front of the nearest parallax layer yet behind everything playable.
- `src/levels/build.js`: guarded `for (const pr of levelData.props ?? [])` loop after the `secretAlcove` loop, emitting `add([ sprite(pr.sprite), pos(pr.x, pr.y), z(pr.layer === "surface" ? Z_SURFACE : Z_BACK), "prop" ])` and NOTHING else — no `area()`, no `body()`, no `rect()`. Reads TOP-LEVEL `levelData.props` (not `g.props`) so `g = levelData.geometry` stays byte-frozen. Default layer = back.
- `src/main.js`: `else if (a.kind === "prop") { loadSprite(a.key, webPath); }` branch in the ASSETS_MANIFEST load loop (single static frame — Phase 36 animates later).

### Task 2 — Geometry-freeze snapshot gate + baseline (commit 8f25e22)
- `scripts/check-geometry-frozen.mjs`: pure-data, node-importable gate (imports `LEVEL_ORDER, getLevel` the same way `validate-levels.mjs` does). For each id it serializes `getLevel(id).geometry` and compares against the golden; on any drift it HARD-FAILs, naming the level id + the first differing top-level geometry key. Present-in-one-set-only ids also HARD-FAIL. A `--write` flag regenerates the baseline deterministically. NOT wired into `check-gate.sh` (matches `check-assets-manifest.mjs`).
- `scripts/fixtures/geometry-frozen-baseline.json`: frozen serialized geometry for all 8 LEVEL_ORDER ids, captured from the current committed post-34.6 geometry.
- Negative proof executed: nudging a level-03 coin coordinate produced `HARD-FAIL — level-03 geometry drifted ... (first differing key: "coins")`, exit 1; reverted → PASS, exit 0. Nudge NOT committed.

### Task 3 — Per-level props screenshot script (commit 4175019)
- `scripts/screenshot-phase35-props.mjs`: cloned verbatim from `screenshot-phase33-terrain.mjs` (server/guard/boot/nav copied by hand per the duplication convention; PORT 8777). Changes only: OUT_DIR → `prop-shots/`; filenames `level-NN-<biome>-spawn.png`; climb-altitude capture for any level whose `getLevel(id).bounds.top < 0` (the vertical levels 02/04/06/08) → `level-NN-<biome>-climb.png`, using the `repositionAndSettle` idiom (lift the player toward `bounds.top`, pin across a settle window so the clamped camera eases up, then shoot). Accepts an optional CLI list of level ids (default all 8) so the trial plan can shoot just its pair. Playwright resolved dynamically (honors `PLAYWRIGHT_MJS_PATH`).
- The climb heuristic is keyed on GEOMETRY, never on level parity — `level-01` (no `bounds` field → `bounds?.top` undefined → falsy) and `level-07` (odd, `bounds.top` 0) both correctly get spawn-only.

## Verification results

Run with `PLAYWRIGHT_MJS_PATH=/home/magnus/.nvm/versions/node/v24.18.0/lib/node_modules/playwright/index.mjs` (repo default fallback is stale on this dev host).

| Gate | Result |
|------|--------|
| `bash scripts/check-import-safety.sh` (a727c13) | PASS |
| `bash scripts/check-safety.sh` (no timers/punishment) | PASS |
| `node scripts/validate-levels.mjs` | PASS (0 HARD-FAIL — byte-identical to pre-change) |
| `node scripts/check-assets-manifest.mjs` | PASS (38 assets on disk) |
| `node scripts/check-geometry-frozen.mjs` | PASS (all 8 levels frozen); negative-proof HARD-FAILs on a scratch nudge |
| `node scripts/browser-boot.mjs` | PASS — title → select → all 8 levels loaded, no runtime errors |
| `node scripts/screenshot-phase35-props.mjs level-01` | PASS — `level-01-swamp-spawn.png` (43.6 KB, spawn only) |
| `node scripts/screenshot-phase35-props.mjs level-01 level-06` | PASS — level-06 (vertical) also emits `level-06-cemetery-climb.png` |
| CONFIG.PROPS z assertion | PASS — `{Z_BACK:-8, Z_SURFACE:-3}`, both negative |

Climb shot inspected visually: player lifted to the top band with the cemetery parallax (blue moon, tombstones) visible — a sane climb-altitude capture. No props present yet (correct — infra-only plan).

## Deviations from Plan

None — plan executed exactly as written. Rules 1–4 did not trigger.

## Notes

- **`prop-shots/` PNGs left untracked (intentional).** The screenshot script was run during verification (`level-01`, then `level-01 level-06`), producing spawn/climb PNGs under `.planning/phases/35-biome-re-dress-props/prop-shots/`. These are regenerable smoke output — no props are placed in this infra-only plan, so they are NOT the deliverable trial evidence (the 2-level trial plan produces that after dressing levels). Per the plan's file list (which names only the script), the code commit staged only `scripts/screenshot-phase35-props.mjs`. The PNGs remain untracked verification byproducts.
- `check-assets-manifest` reports 38 assets (the comment header still says 37 pre-`key.png`) — unrelated to this plan; no manifest entries were added here (props art lands in a later plan).

## Known Stubs

None. This plan is pure infrastructure — the props path is inert (`?? []` guarded, no descriptor dressed) by design, which is the intended end state for this plan; the trial plan wires real prop data.

## Self-Check: PASSED

- Created files exist: `scripts/check-geometry-frozen.mjs`, `scripts/fixtures/geometry-frozen-baseline.json`, `scripts/screenshot-phase35-props.mjs` — all present on disk.
- Commits exist: 7c156a8, 8f25e22, 4175019 — all in `git log`.
