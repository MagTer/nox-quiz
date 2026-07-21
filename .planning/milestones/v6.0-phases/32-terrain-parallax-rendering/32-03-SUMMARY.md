---
phase: 32-terrain-parallax-rendering
plan: 03
subsystem: level-rendering
tags: [autotile, terrain, build.js, atlas, kaplay]

# Dependency graph
requires:
  - phase: 32-terrain-parallax-rendering
    plan: 02
    provides: CONFIG.TERRAIN tunables block (FILL_CHUNK_COLS, FLOOR_FILL_DEPTH_PX, PLATFORM_FILL_DEPTH_PX) and required biome field on all 8 level descriptors
provides:
  - emitTerrainRun() occupancy-driven autotile cap+chunked-fill renderer in src/levels/build.js, replacing the single-row pickTopFrame()/groundSprite strip
  - "ground-cap"/"ground-fill" Kaplay tags on all visual terrain tiles (floor runs + platforms)
affects: [32-05-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [chunked "{tiled:true}" fill idiom ported from spike-code/main.js, decorative-overlay compositing for a biome anomaly (Cemetery) via emission order]

key-files:
  created: []
  modified:
    - src/levels/build.js

key-decisions:
  - "emitTerrainRun() uses two full separate emission branches (cemetery vs. standard) rather than one unified body with conditional y/height math — matches the plan's own grep-count acceptance criteria (ground-cap/ground-fill/emitTerrainRun each counted per call site) and keeps the Cemetery overlay-order requirement explicit and readable"
  - "FLOOR_FILL_DEPTH_PX/PLATFORM_FILL_DEPTH_PX/FILL_CHUNK_COLS read into local consts at module top level (alongside the pre-existing T/FLOOR_Y consts) rather than inline CONFIG.TERRAIN.* lookups at each call site — consistent with the file's own 'pure config read, safe at top level' convention and avoids repeating the CONFIG.TERRAIN.* path 3x"

patterns-established:
  - "Doc comments describing a helper MUST NOT literally repeat tag-literal strings or a removed function's name in prose — the plan's own acceptance criteria grep for exact occurrence counts of these tokens in the file, and an explanatory comment mentioning them inflates the count past what the removal/emission-site math expects (caught and fixed before commit, see Deviations)"

requirements-completed: []

coverage:
  - id: T1
    description: "buildLevel()'s floor-run and platform visual-tile loops replaced by emitTerrainRun() calls emitting ground-cap/ground-fill tagged sprites against atlas-${biome}; Cemetery composites its cap as an overlay on an always-solid fill; both collider blocks byte-unchanged; module stays Node-importable"
    requirement: "ART-02 (partial — plan 3 of 5 in Phase 32)"
    verification:
      - kind: other
        ref: "grep -c pickTopFrame == 0; grep -c ground-cap == 2; grep -c ground-fill == 2; grep -c emitTerrainRun == 3; grep -c levelData.theme == 0; grep -c 'body({ isStatic: true })' == 5 (unchanged from pre-task)"
        status: pass
      - kind: other
        ref: "node --check src/levels/build.js; node -e import(...) prints 'import OK'"
        status: pass
      - kind: other
        ref: "node scripts/validate-levels.mjs — exit 0, validate-levels: PASS, zero HARD-FAIL across all 8 levels"
        status: pass
      - kind: other
        ref: "bash scripts/check-safety.sh, bash scripts/check-import-safety.sh — both PASS (CLAUDE.md's mandatory post-src-change gates)"
        status: pass
    human_judgment: false
---

# Phase 32 Plan 03: Autotile Terrain Renderer Summary

**Replaced `src/levels/build.js`'s single visual-only top-row floor strip (`pickTopFrame()`) with an occupancy-driven `emitTerrainRun()` cap+chunked-fill renderer against the real 2-frame biome atlas, colliders untouched.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-11T07:38:58Z
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments
- `src/levels/build.js` now emits a solid autotiled ground mass (decorative cap row + chunked `{tiled:true}` underground fill) for every floor run and platform, replacing the old floating 16px visual strip
- `atlasSprite` reads `atlas-${levelData.biome}` (required field from Plan 32-02, no fallback) — the old `theme`-aware `groundSprite` ternary and `pickTopFrame()` helper are fully removed, with no migration-note comments left behind
- Cemetery's documented cap-frame anomaly (transparent rows 0-9, `docs/LEVEL-DESIGN.md` §9) is handled by starting its fill body one tile-row earlier and emitting it *before* the cap row, so the cap composites as a decorative overlay on an always-solid fill instead of exposing a gap down to the collider line
- Castle and the other 2 biomes (Swamp, Town) render through the identical standard path — no special-casing, per 32-CONTEXT.md's explicit "render as-is" instruction
- Both merged `rect()+body({isStatic:true})` collider blocks (floor-run and platform) are byte-unchanged — verified they stay the sole physics body for each run; `emitTerrainRun()` never reads or writes geometry, only `runX`/`runY`/`runW`/`fillDepthPx`

## Task Commits

Each task was committed atomically:

1. **Task 1: Port the occupancy/cap+fill autotile renderer into buildLevel()** - `86fa75b` (feat)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified
- `src/levels/build.js` - Removed `pickTopFrame()`/theme-aware `groundSprite` ternary; added `atlasSprite`/`CAP_FRAME`/`FILL_FRAME` consts and the `emitTerrainRun()` helper (defined inside `buildLevel()`'s body per the a727c13 convention); replaced both visual-tile loops (floor-run, platform) with `emitTerrainRun()` calls; added `FILL_CHUNK_COLS`/`FLOOR_FILL_DEPTH_PX`/`PLATFORM_FILL_DEPTH_PX` module-top-level consts reading `CONFIG.TERRAIN.*`

## Decisions Made
- Implemented `emitTerrainRun()` as two full separate emission branches (Cemetery vs. standard 3-biome path) rather than a single unified body with conditional y/height math — this keeps each branch's fill-loop and cap-loop literal, matching the plan's own grep-count acceptance criteria (`ground-cap`/`ground-fill`/`emitTerrainRun` each expected to appear a specific number of times) and keeps the Cemetery overlay-ordering requirement explicit rather than buried in a ternary
- Read `CONFIG.TERRAIN.FILL_CHUNK_COLS`/`FLOOR_FILL_DEPTH_PX`/`PLATFORM_FILL_DEPTH_PX` into local consts at the module top level (alongside the pre-existing `T`/`FLOOR_Y` consts) rather than inline `CONFIG.TERRAIN.*` lookups at each of the two call sites — consistent with the file's own documented "pure config read, safe at top level" convention for `T`/`FLOOR_Y`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Doc comment above `emitTerrainRun()` accidentally reintroduced the removed function name and tag literals, inflating the acceptance-criteria grep counts**
- **Found during:** Task 1 self-verification (running the plan's own acceptance-criteria greps before committing)
- **Issue:** My first draft of the explanatory comment above `emitTerrainRun()` used the exact tokens `pickTopFrame()`, `"ground-cap"`/`"ground-fill"`, and a JSDoc-style `emitTerrainRun():` self-reference in prose — three tokens the plan's acceptance criteria grep-count exactly (`pickTopFrame` must be `0`, `ground-cap`/`ground-fill` must each be `2`, `emitTerrainRun` must be `3`). The comment's presence pushed these to `1`, `3`, `3`, `4` respectively — all four checks would have failed even though the actual renderer logic was correct.
- **Fix:** Rewrote the doc comment to describe the same behavior (what it replaces, what tags it emits, how it stays byte-unchanged vs. the collider) without repeating the exact literal tokens the grep checks count.
- **Files modified:** src/levels/build.js
- **Verification:** Re-ran all 6 grep checks — `pickTopFrame`→0, `ground-cap`→2, `ground-fill`→2, `emitTerrainRun`→3, `levelData.theme`→0, `body({ isStatic: true })`→5 (unchanged from pre-task, confirmed via `git show HEAD:src/levels/build.js` before the edit). All match.
- **Committed in:** 86fa75b (Task 1 commit, no separate fix commit needed — caught before commit)

---

**Total deviations:** 1 auto-fixed (1 bug, self-corrected before commit)
**Impact on plan:** No scope creep — the fix only tightened comment wording to avoid self-referential token inflation; no logic/behavior change.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `emitTerrainRun()`'s `"ground-cap"`/`"ground-fill"` tags are ready for Plan 32-05's `browser-boot.mjs` object-count budget check (`CONFIG.TERRAIN.OBJECT_BUDGET`)
- `atlasSprite` reads `atlas-${levelData.biome}` — this plan does NOT load those sprite assets into the engine (that's `src/main.js`'s manifest-driven load loop, out of this plan's `files_modified` scope); a live-browser render check of the actual atlas art is deferred to Plan 32-05/the phase's manual `?debug=1` spot-check per this plan's own `<verification>` note
- No blockers. Note for the orchestrator: this plan's frontmatter cites `requirements: [ART-02]`, but ART-02 spans all 5 plans in Phase 32 (32-01 through 32-05) — per explicit instruction, this SUMMARY does NOT mark ART-02 as complete in REQUIREMENTS.md; that write is deferred to the orchestrator after Phase 32's verifier confirms full delivery.

---
*Phase: 32-terrain-parallax-rendering*
*Completed: 2026-07-11*

## Self-Check: PASSED

- FOUND: src/levels/build.js
- FOUND: .planning/phases/32-terrain-parallax-rendering/32-03-SUMMARY.md
- FOUND: 86fa75b (Task 1 commit)
