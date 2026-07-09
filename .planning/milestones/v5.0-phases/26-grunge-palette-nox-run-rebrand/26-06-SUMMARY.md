---
phase: 26-grunge-palette-nox-run-rebrand
plan: 06
subsystem: levels
tags: [level-data, theming, enemy-sprites, kaplay]

# Dependency graph
requires:
  - phase: 26-03
    provides: "THEME_PALETTES-derived 32 baked PNGs (assets/parallax/{far,mid,near}-theme-{1..8}.png, assets/tiles/ground-theme-{1..8}.png), plus the level-order -> theme-N mapping"
  - phase: 26-05
    provides: "build.js/parallax.js/game.js theme-templating (levelData.theme -> `ground-${theme}`/`bg-*-${theme}` sprite names) and enemy variant selection (CONFIG.ENEMY.SPRITES[e.variant ?? 0]), both previously live but unreachable since every level's theme was null"
provides:
  - "All 8 level descriptors carry a distinct `theme: \"theme-N\"` field (was `theme: null` on all 8) — activates the per-level background/ground theming 26-05 wired but couldn't exercise"
  - "All 6 existing enemy encounters (level-01/03/04/06/08) carry a `variant` field (0/1/2) cycling through all 3 sourced enemy sprites (saw/barnacle/fly) — activates the sprite variety 26-04/26-05 delivered but couldn't exercise"
affects: [26-08]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/levels/level-01.js
    - src/levels/level-02.js
    - src/levels/level-03.js
    - src/levels/level-04.js
    - src/levels/level-05.js
    - src/levels/level-06.js
    - src/levels/level-07.js
    - src/levels/level-08.js

key-decisions:
  - "Followed the exact 1:1 level-order -> theme-N mapping specified in the plan (level-01->theme-1 ... level-08->theme-8), matching 26-03/26-12's THEME_PALETTES assignment — no alternate mapping invented"
  - "variant cycling (0/1/2/0/1/2 across level-01/03(x2)/04/06/08's 6 total enemy encounters in LEVEL_ORDER traversal) followed the plan's exact prescribed values rather than any other distribution scheme"

requirements-completed: [VIS-03, VIS-04]

coverage:
  - id: D1
    description: "Each of the 8 levels carries its own distinct theme field value (theme-1..theme-8), activating per-level background/ground art variety"
    requirement: "VIS-03"
    verification:
      - kind: unit
        ref: "for n in 1..8: grep 'theme: \"theme-$n\"' src/levels/level-0$n.js — all 8 PASS"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs — PASS zero HARD-FAILs (no geometry/reachability regression); node scripts/browser-boot.mjs — PASS, title -> select -> all 8 levels loaded with no runtime errors (proves every theme-N sprite name resolves)"
        status: pass
    human_judgment: false
  - id: D2
    description: "All 6 existing enemy encounters across the 5 levels that have enemies carry a variant field selecting among the 3 sourced enemy sprites (saw/barnacle/fly), distributed rather than defaulting to a single repeated sprite"
    requirement: "VIS-04"
    verification:
      - kind: unit
        ref: "grep -c 'variant: 0' level-01/04 sum=2; grep -c 'variant: 1' level-03/06 sum=2; grep -c 'variant: 2' level-03/08 sum=2 — all PASS"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs — PASS (enemy x/y positions byte-unchanged, only variant field added); node scripts/browser-boot.mjs — PASS"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 06: Assign Level Themes + Enemy Sprite Variants Summary

**Set the `theme` field on all 8 level descriptors (`null` -> `theme-1`..`theme-8`) and the `variant` field on all 6 existing enemy encounters (0/1/2 cycling through saw/barnacle/fly), turning 26-05's theme-aware sprite-selection code from dead-but-wired into live, per-level-distinct visuals.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-07T22:16:00Z (approx)
- **Completed:** 2026-07-07T22:20:00Z (approx)
- **Tasks:** 2 (both auto)
- **Files modified:** 8 (src/levels/level-01.js through level-08.js)

## Accomplishments
- Every level descriptor's `theme: null` placeholder changed to its assigned `theme: "theme-N"` value, matching the exact 1:1 level-order mapping (level-01->theme-1 ... level-08->theme-8) established by 26-03/26-12's `THEME_PALETTES`
- All 6 existing enemy encounters (level-01 x1000, level-03 x2400/x3800, level-04 x2400, level-06 x2150, level-08 x1600) gained a `variant` field cycling 0/1/2 across the roster, selecting `enemy-1`(saw)/`enemy-2`(barnacle)/`enemy-3`(fly) per the plan's exact prescribed distribution
- Levels 02/05/07 (zero enemies) left untouched, as scoped
- No geometry, `allowedTables`, or `bounds` field touched on any of the 8 files — pure data-literal edits only, no engine references introduced (a727c13-safe by construction)

## Task Commits

Each task was committed atomically:

1. **Task 1: Assign theme field on all 8 level descriptors** - `33a7b9a` (feat)
2. **Task 2: Add variant field to every existing enemy encounter** - `85d00dc` (feat)

## Files Created/Modified
- `src/levels/level-01.js` - `theme: "theme-1"`; enemy(x:1000) gains `variant: 0`
- `src/levels/level-02.js` - `theme: "theme-2"` (no enemies)
- `src/levels/level-03.js` - `theme: "theme-3"`; enemies(x:2400, x:3800) gain `variant: 1`, `variant: 2`
- `src/levels/level-04.js` - `theme: "theme-4"`; enemy(x:2400) gains `variant: 0`
- `src/levels/level-05.js` - `theme: "theme-5"` (no enemies)
- `src/levels/level-06.js` - `theme: "theme-6"`; enemy(x:2150) gains `variant: 1`
- `src/levels/level-07.js` - `theme: "theme-7"` (no enemies)
- `src/levels/level-08.js` - `theme: "theme-8"`; enemy(x:1600) gains `variant: 2`

## Decisions Made
- Followed the plan's exact 1:1 level-order -> theme-N mapping and exact variant-cycling values verbatim — no alternate scheme was considered since the plan explicitly pinned both to 26-03/26-12's established mapping and a specific distribution.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and `<verify>` commands passed on the first attempt; no auto-fixes were required.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Verification

- `node scripts/validate-levels.mjs` — PASS, zero HARD-FAILs (proves no geometry/reachability regression from the pure-data theme/variant edits; only WARN-tier rows present, matching pre-existing baseline behavior)
- `bash scripts/check-import-safety.sh` — PASS (proves the new `theme`/`variant` string/number literals introduced no engine-global reference in these pure-data files)
- `bash scripts/check-safety.sh` — PASS
- `bash scripts/check-gate.sh` — PASS
- `node scripts/browser-boot.mjs` — PASS, title -> select -> all 8 levels loaded with no runtime errors, proving every `theme-N`-templated sprite name (`ground-theme-N`, `bg-{far,mid,near}-theme-N`) and the enemy-variant sprite selection actually resolve against 26-05's `main.js` asset registrations

## Next Phase Readiness
- All 8 levels now render with their own distinct per-level theme (background/ground art) and enemy sprite variety is actually exercised in play — the exact "baked but unreachable" gap 26-RESEARCH.md's Pitfall B warned about is closed
- 26-08's regression checkpoint can now get real end-to-end visual proof of the theme-selected code path (26-05 could only prove the fallback path, since no level had a theme set yet)
- No blockers for 26-07 onward

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 8 modified level files found on disk with their expected `theme: "theme-N"` and `variant` field values (re-verified via grep); both task commit hashes (33a7b9a, 85d00dc) found in git log.
