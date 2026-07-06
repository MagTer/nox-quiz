---
phase: 25-levels-5-8-difficulty-ramp-select-grid
plan: 03
subsystem: game-content
tags: [kaplay, level-design, pure-data-descriptor, verticality, reachability-validation]

requires:
  - phase: 25-01
    provides: secretAlcove mechanic (build.js/game.js wiring, progress.addBonusXp, CONFIG.PROGRESS.XP_ALCOVE)
provides:
  - "4 new level descriptors (level-05..level-08) as pure-data modules through the existing registry"
  - "level-05/06: single-screen-tall gentle ramp, allowedTables [2,3,4,5] and [4,5,6,7]"
  - "level-07/08: ascending net-rightward verticality (LVL-05), allowedTables [6,7,8] and [6,7,8,9]"
  - "src/levels/index.js registry extended to 8 levels (LEVEL_ORDER length 8)"
  - "one secretAlcove per new level (4 of the 8 total required by LVL-06)"
affects: [25-04, 25-05, 25-06, 25-07]

tech-stack:
  added: []
  patterns:
    - "Verticality tiers are authored as `platforms` (not `floors`) since build.js pins every `floors` entry to the fixed FLOOR_Y=320 — climbing height needs per-entry {x,y}"
    - "Ascending climb tiers need ~70px x-overlap (not a token few px) so the rising-jump reachability model's short-time-of-flight quadratic root lands inside the overlap window; a 20-30px overlap leaves neither root inside the span and falsely reports the goal unreachable"

key-files:
  created:
    - src/levels/level-05.js
    - src/levels/level-06.js
    - src/levels/level-07.js
    - src/levels/level-08.js
  modified:
    - src/levels/index.js

key-decisions:
  - "Levels 5-8 authored as unique, purpose-built geometry (not copy-truncated from level-02/level-04) following the numeric precedent bands (60-70px rises, 120-160px gaps, 64-80px checkpoint leads) documented in 25-RESEARCH.md"
  - "level-07/08 climb tiers use 6 ascending platform tiers each rising 65px (level-07) or a uniform 70px (level-08), with the tier x-spans widened to ~70px overlap after the initial 20-30px overlap design produced 2 spawn-goal HARD-FAILs — fixed by design, not by relaxing acceptance criteria"
  - "bounds.top set to -360 for both verticality levels, giving ~1 extra screen of camera headroom above the tallest tier (level-07 tier6 y:-70, level-08 tier6 y:-100), matching CONTEXT.md's literal example"
  - "smoke-progress.mjs's hardcoded LEVEL_ORDER.length===4 assertion was deliberately NOT bumped in this plan -- confirmed via 25-04-PLAN.md/25-RESEARCH.md that this is an intentional, documented interim expected-red state closed by a later plan in this phase (25-06), mirroring the project's established 'expected red until X lands' convention"

requirements-completed: [LVL-02, LVL-03, LVL-05, LVL-06]

coverage:
  - id: D1
    description: "level-05.js and level-06.js authored as pure-data descriptors (single import of ../config.js), CONTEXT-locked allowedTables pools, no verticality, exactly one secretAlcove each, zero validate-levels.mjs HARD-FAILs in isolation"
    requirement: "LVL-02"
    verification:
      - kind: unit
        ref: "node scripts/validate-levels.mjs --fixture src/levels/level-05.js"
        status: pass
      - kind: unit
        ref: "node scripts/validate-levels.mjs --fixture src/levels/level-06.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "level-07.js and level-08.js authored with complete 4-field bounds objects (top<=-300), ascending net-rightward verticality via 6 full-width overlapping platform tiers, exactly one secretAlcove each"
    requirement: "LVL-05"
    verification:
      - kind: unit
        ref: "node -e \"...LEVEL_07.bounds/LEVEL_08.bounds key+top<=-300 check...\" (inline node script, Task 2 verify block)"
        status: pass
    human_judgment: false
  - id: D3
    description: "src/levels/index.js registry extended to 8 levels (4 new imports + LEVELS array append), LEVEL_ORDER length 8 in correct order, zero changes to BY_ID/getLevel/isUnlocked derivation logic"
    requirement: "LVL-02"
    verification:
      - kind: unit
        ref: "node -e \"...LEVEL_ORDER.length===8 && order[4..7]===level-05..level-08...\""
        status: pass
    human_judgment: false
  - id: D4
    description: "Full registry validate-levels.mjs run (no --fixture) shows zero HARD-FAIL across all 8 levels; levels 1-4 remain unaffected"
    requirement: "LVL-03"
    verification:
      - kind: unit
        ref: "node scripts/validate-levels.mjs (full run, exit 0, 'validate-levels: PASS')"
        status: pass
    human_judgment: false
  - id: D5
    description: "Each new level (05-08) carries exactly one secretAlcove entry, placed off the main path (LVL-06, this plan's share of the 8-level requirement)"
    requirement: "LVL-06"
    verification:
      - kind: unit
        ref: "node -e \"...geometry.secretAlcove.length===1 for LEVEL_05..LEVEL_08...\""
        status: pass
    human_judgment: true
    rationale: "The structural validator and interactive audit deliberately never check secretAlcove placement/reachability by design (Pitfall 3, 25-RESEARCH.md) -- automated checks confirm array shape/count only. A human/interactive spot-check of actual in-game reachability is Plan 25-07's job (LVL-06 truth: 'a human has walked to each of the 8 levels' secret alcove')."

duration: 12min
completed: 2026-07-06
status: complete
---

# Phase 25 Plan 03: Levels 5-8 (Ramp, Verticality, Registry Append) Summary

**Four new pure-data level descriptors (level-05 through level-08) authored with a 4-step table-pool ramp [2,3,4,5]→[6,7,8,9], ascending net-rightward verticality on the final two, and the registry extended to 8 levels — zero HARD-FAILs on the full validate-levels.mjs run.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-06T22:52:00Z (approx.)
- **Completed:** 2026-07-06T23:04:25Z
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- Authored `level-05.js` ("The Gentle Reach", `[2,3,4,5]`) and `level-06.js` ("The Cracked Vault", `[4,5,6,7]`) — single-screen-tall, light-to-mixed mechanic density (door+2 mathGates, then door+mathGate+enemy+collectZone), one secretAlcove each
- Authored `level-07.js` ("The Ascending Vault", `[6,7,8]`) and `level-08.js` ("The Last Ascent", `[6,7,8,9]`) — each with a complete 4-field `bounds` object (`top:-360`) and a 6-tier ascending, net-rightward "capstone climb" built from full-width overlapping `platforms` (never `floors`, which are pinned to a fixed Y in `build.js`)
- Extended `src/levels/index.js`'s registry to 8 levels: 4 new imports + `LEVELS` array append only — `LEVEL_ORDER`/`BY_ID`/`getLevel`/`isUnlocked` untouched, confirming the registry's zero-hardcoded-count design
- Full `node scripts/validate-levels.mjs` run (all 8 levels, no `--fixture`) exits 0 with `validate-levels: PASS` — zero `HARD-FAIL` rows anywhere, levels 1-4 unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Author level-05.js and level-06.js (single-screen, no verticality)** - `b859dfd` (feat)
2. **Task 2: Author level-07.js and level-08.js (verticality) and append all 4 new levels to the registry** - `382ddf9` (feat)

## Files Created/Modified
- `src/levels/level-05.js` - "The Gentle Reach" descriptor, `allowedTables:[2,3,4,5]`, door+2 mathGates, 1 secretAlcove
- `src/levels/level-06.js` - "The Cracked Vault" descriptor, `allowedTables:[4,5,6,7]`, door+mathGate+enemy+collectZone, 1 secretAlcove
- `src/levels/level-07.js` - "The Ascending Vault" descriptor, `allowedTables:[6,7,8]`, complete `bounds` (top:-360), 6-tier climb, door+mathGate, 1 secretAlcove
- `src/levels/level-08.js` - "The Last Ascent" descriptor, `allowedTables:[6,7,8,9]`, complete `bounds` (top:-360), 6-tier climb, door+2 mathGates+enemy+collectZone, 1 secretAlcove
- `src/levels/index.js` - 4 new imports + `LEVELS` array append; `LEVEL_ORDER` now length 8

## Decisions Made
- Chose fresh, purpose-built pixel geometry for all four levels rather than truncating/copying level-02/level-04 verbatim, following 25-RESEARCH.md's numeric precedent bands (60-70px rises, 120-160px gaps, 64-80px checkpoint leads) so each level reads as distinct content
- Set each secretAlcove as a short off-path vertical or lateral detour requiring one extra jump beyond the level's critical path (e.g. an extra hop above a gap-bridging platform, or a sideways nook beside a climb tier) — consistent with "not signposted, not gating"
- Kept levels 1-4 completely untouched in this plan (their secretAlcove retrofit is explicitly Plan 25-04's scope per the phase's task sequencing)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Widened verticality climb-tier x-overlaps from ~20-30px to ~70px**
- **Found during:** Task 2 (level-07.js/level-08.js authoring, initial verification pass)
- **Issue:** The first-drafted climb tiers overlapped by only 20-30px between consecutive tiers. `node scripts/validate-levels.mjs` reported `spawn-goal | HARD-FAIL | goal ... unreachable from spawn` for both level-07 and level-08. Root cause: the reachability model's rising-jump quadratic produces two horizontal-reach roots for a Δy<0 hop; for an *overlapping* x-span pair (spanMin=0), a valid reach must fall within `[0, overlapWidth]`. At a 65-70px rise, the short-time-of-flight root's reach is ~35-40px — a 20-30px overlap window is narrower than even that shortest reach, so neither root landed inside it and the hop (and everything past it, including the goal) was BFS-unreachable, even though the tier gap looked trivially small visually.
- **Fix:** Widened every consecutive climb-tier pair's x-overlap to ~70px (comfortably above the ~35-40px minimum-reach threshold with margin), keeping the same per-tier rise (65px level-07, uniform 70px level-08), same tier count (6), same net-rightward ordering, and re-deriving the dependent goal/checkpoint/coin/secretAlcove coordinates and `bounds.right` to match the resulting (slightly shorter) total extent.
- **Files modified:** src/levels/level-07.js, src/levels/level-08.js
- **Verification:** Full `node scripts/validate-levels.mjs` run: `level-07 | spawn-goal | WARN | goal x:3700 reached via platform-8` and `level-08 | spawn-goal | WARN | goal x:3460 reached via platform-8` (WARN, not HARD-FAIL — never increments the failure counter); zero `HARD-FAIL` rows for levels 5-8 or anywhere in the 8-level registry; exit 0.
- **Committed in:** 382ddf9 (Task 2 commit — the fix was applied before the task's single commit, so no separate fix commit exists)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary for correctness — an unreachable goal would have shipped a broken level. No scope creep; the fix stayed entirely within the two files Task 2 already owned.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 8 levels now exist in the registry (`LEVEL_ORDER.length === 8`); `src/levels/index.js` requires zero further code changes for level count
- Plan 25-04 can proceed with the levels 1-4 secretAlcove retrofit and the MATH-01/MATH-02 edits
- Plan 25-06 must still re-baseline `scripts/smoke-progress.mjs`'s `LEVEL_ORDER.length === 4` assertion (currently expected-red per 25-04-PLAN.md's documented interim state — not a regression introduced by this plan)
- Plan 25-07's human sign-off pass still needs to interactively confirm all 4 new secretAlcove placements (levels 5-8) are actually reachable and non-gating in a live playthrough — the structural validator does not check this by design

---
*Phase: 25-levels-5-8-difficulty-ramp-select-grid*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 4 created level files and the SUMMARY.md found on disk; all 3 commit hashes (b859dfd, 382ddf9, 73645d4) found in git log.
