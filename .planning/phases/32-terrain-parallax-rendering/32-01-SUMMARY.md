---
phase: 32-terrain-parallax-rendering
plan: 01
subsystem: infra
tags: [assets, manifest, node-esm, gate-script, kaplay]

# Dependency graph
requires:
  - phase: 31-asset-bake-style-board-signoff
    provides: baked biome-atlas and biome-bg PNGs under assets/tiles/ and assets/parallax/
provides:
  - "src/assets-manifest.js exporting ASSETS_MANIFEST, the single {key, path, kind} source of truth for every asset src/main.js loads"
  - "scripts/check-assets-manifest.mjs, a standalone Node gate proving every manifest path exists on disk"
affects: [32-04-terrain-parallax-rendering, main.js-asset-loading]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-data manifest module (zero imports) importable identically by Node gate scripts and browser main.js"
    - "Standalone Node ESM gate script convention (not wired into check-gate.sh), matching scripts/validate-levels.mjs"

key-files:
  created: [src/assets-manifest.js, scripts/check-assets-manifest.mjs]
  modified: []

key-decisions:
  - "Manifest excludes the now-superseded ground/theme-N sprite family and Phase-33-scoped hellhound/swamphunter art, per plan-locked scope boundary"

patterns-established:
  - "Assets manifest as single source of truth: gate script and (Plan 32-04) main.js's loader both consume the same ASSETS_MANIFEST constant, no duplicate path literals"

requirements-completed: [ART-02, ART-03]

coverage:
  - id: D1
    description: "src/assets-manifest.js exports ASSETS_MANIFEST with exactly 38 entries (4 biome-atlas, 12 biome-bg, 12 sprite, 2 sprite-anim, 7 sound, 1 music), zero imports"
    requirement: "ART-02"
    verification:
      - kind: unit
        ref: "node -e import assertion: ASSETS_MANIFEST.length === 38, biome-atlas count === 4, biome-bg count === 4*3=12"
        status: pass
      - kind: other
        ref: "grep -c '^import' src/assets-manifest.js === 0; grep -c 'theme' src/assets-manifest.js === 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/check-assets-manifest.mjs exits 0 with a PASS message against the real manifest, and was proven to genuinely fail (exit 1, one MISSING line) against a deliberately broken scratch copy"
    requirement: "ART-03"
    verification:
      - kind: unit
        ref: "node scripts/check-assets-manifest.mjs — prints 'check-assets-manifest: PASS — 38 assets verified on disk.', exit 0"
        status: pass
      - kind: unit
        ref: "node --input-type=module -e (scratch copy with atlas-swamp path replaced by does-not-exist.png) — printed exactly one MISSING line, exit-would-be 1"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-11
status: complete
---

# Phase 32 Plan 01: Assets Manifest & Existence Gate Summary

**Created `src/assets-manifest.js` (38-entry `{key, path, kind}` array) and `scripts/check-assets-manifest.mjs`, a Node gate that proves every asset path resolves on disk — closing the silent-404 class across the full asset surface `main.js` loads.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-11T07:18:00Z
- **Completed:** 2026-07-11T07:30:34Z
- **Tasks:** 2
- **Files modified:** 2 (both created)

## Accomplishments
- Pure-data `src/assets-manifest.js` with exactly 38 entries grouped by `kind` (4 biome-atlas, 12 biome-bg, 12 sprite, 2 sprite-anim, 7 sound, 1 music) — zero imports, safe for both Node and browser consumption
- Standalone Node ESM gate `scripts/check-assets-manifest.mjs` that `existsSync`-checks every manifest path, reporting `MISSING <key> -> <path>` per failure and a `PASS — N assets verified on disk` summary line on success
- Gate proven as a real check (not a rubber-stamp): a scratch copy with one path deliberately broken produced exactly one MISSING line and would exit 1; the scratch file was deleted after the proof

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the assets manifest (src/assets-manifest.js)** - `aee6d0c` (feat)
2. **Task 2: Create the manifest existence gate (scripts/check-assets-manifest.mjs)** - `b5fc695` (feat)

**Plan metadata:** SUMMARY.md commit (this file, committed next)

## Files Created/Modified
- `src/assets-manifest.js` - pure-data `ASSETS_MANIFEST` export, the single source of truth for all 38 asset paths
- `scripts/check-assets-manifest.mjs` - standalone Node CLI gate, exits non-zero on any missing path

## Decisions Made
None - plan executed exactly as written. Manifest intentionally excludes the ground/theme-N sprite family (superseded, removed from main.js's loads in Plan 32-04) and the Phase-33-scoped hellhound/swamphunter art, per the plan's explicit scope boundary.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`src/assets-manifest.js` and `scripts/check-assets-manifest.mjs` are ready for Plan 32-04 to import `ASSETS_MANIFEST` in `main.js`'s biome asset loader (replacing the hand-written `loadSprite`/`loadSound`/`loadMusic` calls for the biome-atlas/biome-bg entries this plan enumerated). No blockers.

---
*Phase: 32-terrain-parallax-rendering*
*Completed: 2026-07-11*
