---
phase: 32-terrain-parallax-rendering
plan: 04
subsystem: rendering
tags: [parallax, assets-manifest, biome, kaplay, asset-loading]

# Dependency graph
requires:
  - phase: 32-terrain-parallax-rendering
    plan: "01"
    provides: "src/assets-manifest.js exporting ASSETS_MANIFEST, the single {key, path, kind} source of truth for every asset src/main.js loads"
  - phase: 32-terrain-parallax-rendering
    plan: "02"
    provides: "level.biome field (swamp/town/cemetery/castle) replacing theme on all 8 level descriptors"
provides:
  - "makeParallaxLayers(bounds, biome) in src/parallax.js — biome-driven layer naming, zero other logic change"
  - "src/main.js manifest-driven load loop for biome-atlas/biome-bg assets, replacing the hand-written per-theme-N block"
  - "32 deleted superseded theme-N asset files (8 ground + 24 parallax layers)"
affects: [32-05-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manifest-driven asset loading: a single loop over ASSETS_MANIFEST dispatches on `kind` to the right loadSprite() call shape, replacing hand-written per-asset-family blocks"

key-files:
  created: []
  modified:
    - src/parallax.js
    - src/scenes/game.js
    - src/main.js
    - .planning/codebase/STACK.md
    - .claude/CLAUDE.md
  deleted:
    - "assets/tiles/ground-theme-1.png .. ground-theme-8.png (8 files)"
    - "assets/parallax/far-theme-1.png .. near-theme-8.png (24 files)"

key-decisions:
  - "build.js's own theme/ground-sprite consumption was left untouched — it is explicitly Plan 32-03's scope (same wave, parallel worktree), not this plan's files_modified list"

requirements-completed: []

coverage:
  - id: D1
    description: "makeParallaxLayers' second parameter renamed theme -> biome (JSDoc + ternary), game.js's call site passes level.biome; makeParallaxLayer/updateParallaxLayers byte-unchanged"
    requirement: "ART-03"
    verification:
      - kind: unit
        ref: "node --check src/parallax.js && node --check src/scenes/game.js — both exit 0"
        status: pass
      - kind: other
        ref: "grep -c biome src/parallax.js == 4; grep -c level.theme src/scenes/game.js == 0; grep -c level.biome src/scenes/game.js == 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "main.js loads all 16 biome-atlas/biome-bg assets via a manifest-driven loop over ASSETS_MANIFEST; old ground/theme-N loads removed; every other hand-written load untouched"
    requirement: "ART-02"
    verification:
      - kind: unit
        ref: "node --check src/main.js — exit 0"
        status: pass
      - kind: other
        ref: "grep -c 'loadSprite(\"ground\"' src/main.js == 0; grep -c 'for (let n = 1; n <= 8' src/main.js == 0; grep -c ASSETS_MANIFEST src/main.js == 3; grep -c player/coin/jump hand-written calls == 3"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 32 superseded theme-N asset files deleted, zero remaining references in src/, both STACK.md and CLAUDE.md list the new check-assets-manifest.mjs gate"
    requirement: "ART-02"
    verification:
      - kind: other
        ref: "find assets/tiles assets/parallax -name '*theme*' | wc -l == 0; grep -rn 'theme-[1-8]' src/ | wc -l == 0"
        status: pass
      - kind: unit
        ref: "node scripts/check-assets-manifest.mjs — PASS, 38 assets verified on disk"
        status: pass
      - kind: other
        ref: "grep -c check-assets-manifest .planning/codebase/STACK.md == 1; grep -c check-assets-manifest .claude/CLAUDE.md == 1"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-07-11
status: complete
---

# Phase 32 Plan 04: Terrain & Parallax Rendering — Parallax Biome Wiring & Asset Cleanup Summary

**Threaded `level.biome` through `parallax.js`'s existing layer-naming logic (near-zero structural change), switched `main.js`'s asset loading to a manifest-driven loop for biome-atlas/biome-bg assets, and deleted the 32 now-superseded theme-N asset files.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-11T07:35:56Z
- **Completed:** 2026-07-11T07:38:27Z
- **Tasks:** 3
- **Files modified:** 5 (3 code, 2 docs) + 32 deleted assets

## Accomplishments
- `makeParallaxLayers(bounds, theme)` renamed to `makeParallaxLayers(bounds, biome)` in `src/parallax.js` — JSDoc, parameter, and the `layerName` ternary all updated; `makeParallaxLayer`/`updateParallaxLayers` left byte-unchanged
- `src/scenes/game.js`'s call site now passes `level.biome` instead of the removed `level.theme` field
- `src/main.js` gained a manifest-driven load loop over `ASSETS_MANIFEST`, dispatching on `kind` (`biome-atlas` -> 2-frame `sliceX:2` atlas load, `biome-bg` -> plain sprite load), replacing the hand-written `loadSprite("ground", ...)` call and the numeric `for (let n = 1; n <= 8; n++)` theme-N loop
- 32 superseded theme-N asset files deleted (8 `ground-theme-N.png` + 24 `{far,mid,near}-theme-N.png`), confirmed zero remaining `theme-[1-8]` references anywhere in `src/`
- Both `.planning/codebase/STACK.md` and `.claude/CLAUDE.md`'s "Verification gates" lists now include the `check-assets-manifest.mjs` gate bullet, kept in sync per CLAUDE.md's GSD-marker generation convention

## Task Commits

Each task was committed atomically:

1. **Task 1: Thread biome through parallax.js and its game.js call site** - `1c939c1` (feat)
2. **Task 2: Manifest-driven biome asset loading in main.js** - `b1cfbfd` (feat)
3. **Task 3: Delete superseded theme-N asset files and update gate docs** - `70d42a6` (chore)

**Plan metadata:** SUMMARY.md commit (this file, committed next, worktree mode — SUMMARY.md only)

## Files Created/Modified
- `src/parallax.js` - `makeParallaxLayers` parameter renamed `theme` -> `biome`, ternary updated to match; `makeParallaxLayer`/`updateParallaxLayers` untouched
- `src/scenes/game.js` - `makeParallaxLayers(bounds, ...)` call site now reads `level.biome`; adjacent comment updated to note the Phase 32 biome-driven source
- `src/main.js` - added `ASSETS_MANIFEST` import; removed the hand-written `loadSprite("ground", ...)` call and the per-theme-N (1-8) loop block; added a manifest-driven loop loading all `biome-atlas`/`biome-bg` entries; every other hand-written `loadSprite`/`loadSound`/`loadMusic` call untouched
- `.planning/codebase/STACK.md` / `.claude/CLAUDE.md` - added the `check-assets-manifest.mjs` gate bullet to the Verification gates list (identical edit in both, per their documented sync convention)
- 32 deleted asset files: `assets/tiles/ground-theme-{1..8}.png`, `assets/parallax/{far,mid,near}-theme-{1..8}.png`

## Decisions Made
- `src/levels/build.js`'s own `levelData.theme` consumption (the other historical consumer of the old `theme` field, alongside `parallax.js`) was deliberately left untouched — it belongs entirely to Plan 32-03 (autotile terrain render), which is the same wave (wave 2) but a separate parallel worktree agent with `src/levels/build.js` in its own `files_modified` list. This plan's `files_modified` list never included `build.js`, so touching it would have been scope creep into a sibling agent's file. The transient state where `build.js` still reads `levelData.theme` (always falsy post-32-02) and falls back to the now-unloaded plain `"ground"` sprite key is expected to resolve when both wave-2 plans (32-03 and 32-04) merge together — confirmed via grep that this plan's own acceptance criteria (no literal `theme-[1-8]` substrings in `src/`) held regardless, since `build.js`'s reference is a template-literal property access, not a literal string match.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' acceptance criteria (grep counts, `node --check`, file existence/absence checks) passed as specified on the first attempt.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/parallax.js` and `src/scenes/game.js` are biome-driven and ready to render per-biome parallax once `build.js` (Plan 32-03, parallel wave-2 work) lands its own `level.biome`-driven atlas selection
- `src/main.js` loads all 16 biome-atlas/biome-bg assets via the manifest loop with zero duplicate/dead loads; `node scripts/check-assets-manifest.mjs` confirms all 38 manifest entries resolve on disk
- The 32 superseded theme-N asset files are gone from disk (recoverable via git history if ever needed, per 32-CONTEXT.md's locked "no on-disk fallback kept" decision)
- Full end-to-end proof (biome parallax actually visible and moving with camera in a real browser) is explicitly deferred to Plan 32-05's `browser-boot.mjs` extension, per this plan's own `<verification>` section
- No blockers for Plan 32-05, once Plan 32-03's `build.js` work has also landed in the same merged tree

---
*Phase: 32-terrain-parallax-rendering*
*Completed: 2026-07-11*
