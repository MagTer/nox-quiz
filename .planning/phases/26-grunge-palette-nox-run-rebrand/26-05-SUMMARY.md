---
phase: 26-grunge-palette-nox-run-rebrand
plan: 05
subsystem: engine
tags: [kaplay, sprites, parallax, theming, door, enemy]

# Dependency graph
requires:
  - phase: 26-03
    provides: "THEME_PALETTES-derived 32 baked PNGs: assets/parallax/{far,mid,near}-theme-{1..8}.png, assets/tiles/ground-theme-{1..8}.png"
  - phase: 26-04
    provides: "assets/door.png (32x64), assets/enemy-1/2/3.png (32x32 each) — real CC0 sprite art"
provides:
  - "buildLevel() theme-aware groundSprite selection (levelData.theme -> `ground-${theme}`, safe fallback to base \"ground\")"
  - "Door and enemy cosmetic panels as real sprite() entities (door.png, enemy-1/2/3.png) — glyph text() blocks and glyphObj stashes removed"
  - "makeParallaxLayers(bounds, theme) — theme-templated bg-far/bg-mid/bg-near sprite names, safe fallback to base untinted layers"
  - "CONFIG.DOOR.SPRITES, CONFIG.ENEMY.SPRITES fields; dead LOCKED_GREY/LOCKED_BORDER/GLYPH_SIZE (DOOR) and COLOR/GLYPH_SIZE (ENEMY) fields removed"
  - "main.js registers all 36 new sprite assets (32 theme variants + door + 3 enemies) under the exact names the rest of the wiring expects"
affects: [26-06, 26-08]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "layerName()/groundSprite theme-templating helper: `${base}-${theme}` with a falsy-theme fallback to the untinted base sprite name — same per-key-defaulting spirit as the existing safeBounds idiom in parallax.js"

key-files:
  created: []
  modified:
    - src/levels/build.js
    - src/config.js
    - src/parallax.js
    - src/scenes/game.js
    - src/main.js

key-decisions:
  - "Updated CONFIG.ENEMY's stale header comment (\"Compact square placeholder; Phase 18 replaces it with a sprite\") to reflect that Phase 26 Plan 05 is the plan that actually did the sprite swap — a minor doc-accuracy fix, not a behavior change"
  - "Confirmed door.js/gates.js/enemy.js's `if (x.glyphObj) destroy(x.glyphObj)` cleanup guards are safe with glyphObj now always undefined on door/enemy blockers — the guard simply no-ops, matching the plan's explicit scope of leaving those mechanic files untouched"

requirements-completed: [VIS-03, VIS-04]

coverage:
  - id: D1
    description: "buildLevel() reads levelData.theme and selects the matching theme-aware ground sprite, with a safe fallback to the base \"ground\" sprite when theme is unset"
    requirement: "VIS-03"
    verification:
      - kind: unit
        ref: "node --check src/levels/build.js; grep confirms groundSprite templating in both floor and platform tile loops"
        status: pass
      - kind: integration
        ref: "node scripts/browser-boot.mjs — PASS, all levels (currently themeless, exercising the fallback path) load with zero runtime errors"
        status: pass
    human_judgment: false
  - id: D2
    description: "makeParallaxLayers threads a theme parameter through to sprite-name selection, with a safe fallback to the base (untinted) layer set when theme is unset"
    requirement: "VIS-03"
    verification:
      - kind: unit
        ref: "node --check src/parallax.js; grep confirms makeParallaxLayers(bounds, theme) signature and layerName() helper"
        status: pass
      - kind: integration
        ref: "node scripts/browser-boot.mjs — PASS"
        status: pass
    human_judgment: false
  - id: D3
    description: "The door and every enemy panel render as real sprite() entities instead of rect()+color()+text() glyphs; the invisible collision blocker and its size are completely untouched"
    requirement: "VIS-04"
    verification:
      - kind: unit
        ref: "grep -c 'sprite(\"door\")' + grep -c 'CONFIG.ENEMY.SPRITES' both 1; grep -c 'text(\"X\"' and 'text(\"!\"' both 0; grep -c 'text(\"?\"' (math-gate) still 1"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs — PASS zero HARD-FAILs (door/enemy blocker geometry, which the validator's over-hole/reachability checks read, is unchanged); node scripts/browser-boot.mjs — PASS"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 05: Wire Per-Level Theming + Door/Enemy Sprite Art (VIS-03, VIS-04) Summary

**Wired 26-03's 32 baked theme PNGs and 26-04's door/enemy sprite art into the running game: `build.js` now selects a theme-aware ground sprite and real `sprite()` door/enemy panels (glyphs removed), `parallax.js`/`game.js` thread the level's `.theme` field through, `config.js` gained sprite-reference fields (dropping the now-dead flat-color/glyph fields), and `main.js` registers all 36 new sprite assets — closing the exact "baked but unreachable" dead-asset gap 26-RESEARCH.md's Pitfall B warned about.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-07T20:09:00Z (approx, session start)
- **Completed:** 2026-07-07T20:27:00Z (approx)
- **Tasks:** 3 (all auto)
- **Files modified:** 5 (src/levels/build.js, src/config.js, src/parallax.js, src/scenes/game.js, src/main.js)
- **Files created:** 1 (this summary)

## Accomplishments

- `src/levels/build.js`: `buildLevel()` now derives `const groundSprite = levelData.theme ? \`ground-${levelData.theme}\` : "ground";` right after reading `levelData.geometry`, and both the floor-run and platform visual-tile loops use `groundSprite` instead of the hardcoded `"ground"` literal
- Door cosmetic panel replaced: `sprite("door")` instead of `rect()+color()+outline()`; the door-glyph `text("X")` block and `blocker.glyphObj` stash deleted (the invisible tall blocker `rect()+area()+body()` is byte-unchanged)
- Enemy cosmetic panel replaced: `sprite(CONFIG.ENEMY.SPRITES[e.variant ?? 0])` instead of `rect()+color()`; the enemy-glyph `text("!")` block and `enemyObj.glyphObj` stash deleted (invisible blocker byte-unchanged)
- Math-gate panel/glyph/blocker left completely untouched, exactly as scoped (VIS-04 only names doors and enemies; math-gates stay flat-color+glyph this phase)
- `src/config.js`: `CONFIG.DOOR` gained `SPRITES: ["door"]`, dropped dead `LOCKED_GREY`/`LOCKED_BORDER`/`GLYPH_SIZE`; `CONFIG.ENEMY` gained `SPRITES: ["enemy-1","enemy-2","enemy-3"]`, dropped dead `COLOR`/`GLYPH_SIZE`. `CONFIG.MATH_GATE` untouched. Confirmed via grep that no remaining consumer referenced the removed fields before deleting them.
- `src/parallax.js`: `makeParallaxLayers(bounds, theme)` new signature with a local `layerName(base)` helper templating all 3 layer sprite names (`bg-far`/`bg-mid`/`bg-near`) through theme, falling back to the untinted base names when theme is falsy; the `name:` field in each returned layer descriptor is also templated (harmless — `updateParallaxLayers` reads `layer.instances`, not `layer.name`, for its per-frame math)
- `src/scenes/game.js`: the `makeParallaxLayers(bounds)` call site updated to `makeParallaxLayers(bounds, level.theme)`
- `src/main.js`: added a loop over the 8 baked themes registering `bg-far-theme-N`/`bg-mid-theme-N`/`bg-near-theme-N`/`ground-theme-N` (32 `loadSprite()` calls at runtime, sliceX matching the base ground sprite's pattern), plus 4 new calls for `door.png` and `enemy-1/2/3.png` — all under the exact names `parallax.js`'s `layerName()` and `build.js`'s `groundSprite` template will request at runtime

## Task Commits

Each task was committed atomically:

1. **Task 1: build.js — theme-aware ground sprite + door/enemy panel sprite swap (glyph removed)** - `2df2937` (feat)
2. **Task 2: config.js sprite fields + parallax.js theme threading + game.js wiring** - `2f93666` (feat)
3. **Task 3: main.js — register every new sprite asset** - `e443998` (feat)

## Files Created/Modified
- `src/levels/build.js` - theme-aware `groundSprite` const; door/enemy panels swapped to `sprite()`; glyph blocks and `glyphObj` stashes removed
- `src/config.js` - `CONFIG.DOOR.SPRITES`/`CONFIG.ENEMY.SPRITES` added; dead `LOCKED_GREY`/`LOCKED_BORDER`/`GLYPH_SIZE`/`COLOR` fields removed; stale ENEMY header comment updated
- `src/parallax.js` - `makeParallaxLayers(bounds, theme)` new signature + `layerName()` helper
- `src/scenes/game.js` - `makeParallaxLayers(bounds, level.theme)` call site update
- `src/main.js` - 36 new `loadSprite()` calls (32 theme variants via an 8-iteration loop + door + 3 enemies)

## Decisions Made
- **Updated CONFIG.ENEMY's stale header comment** ("Compact square placeholder; Phase 18 replaces it with a sprite") since this plan is the one that actually performed the sprite swap — a minor doc-accuracy correction alongside the field changes, not a scope expansion.
- **Verified door.js/gates.js/enemy.js's `if (x.glyphObj) destroy(x.glyphObj)` cleanup guards remain safe** with `glyphObj` now permanently undefined on door/enemy blockers (math-gate's `glyphObj` is unaffected since that block was untouched) — the truthy check simply no-ops, so no change was needed in those mechanic files, matching the plan's explicit scope boundary (Task 1's `<files>` list names only `src/levels/build.js`).

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria and `<verify>` commands from all 3 tasks passed on the first attempt; no auto-fixes were required.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Verification

- `bash scripts/check-safety.sh` — PASS
- `node scripts/validate-levels.mjs` — PASS, zero HARD-FAILs (proves door/enemy blocker geometry is untouched — the validator's over-hole/reachability checks read blocker positions, not panel art)
- `node scripts/browser-boot.mjs` — PASS, title → select → all 8 levels loaded with no runtime errors (proves every newly-referenced sprite name actually resolves; a missing/misnamed asset would 404 and fail this real-browser boot check)

Note: no level descriptor currently sets a `.theme` field (that's Plan 26-06's job), so this run exercised the **fallback path** end-to-end (base "ground"/"bg-far"/"bg-mid"/"bg-near" sprites) rather than the theme-selected path. The theme-selected path is code-reviewed and grep-verified (sprite names match main.js's registrations exactly) but will get its own real-browser proof once 26-06 sets theme fields and 26-08's regression checkpoint runs.

## Next Phase Readiness
- `levelData.theme` is now a live, wired field — Plan 26-06 can set each level descriptor's `.theme` to `"theme-N"` (matching `scripts/build-art-assets.py`'s `THEME_PALETTES`/level-to-theme mapping) and the themed backgrounds/ground will render with zero further code changes
- Door and enemy sprites are live in every level today (no theme field needed for these — they use the universal, non-per-theme-tinted `door.png`/`enemy-N.png` assets per 26-RESEARCH.md's Anti-Pattern note)
- `enemy.variant` field is read via `e.variant ?? 0` — any level descriptor wanting `enemy-2`/`enemy-3` instead of the default `enemy-1` can add a `variant: 1` or `variant: 2` field to its enemy geometry entries; no such fields exist yet in any shipped level (all currently render as `enemy-1`, correct default behavior)
- No blockers for 26-06 onward

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*
