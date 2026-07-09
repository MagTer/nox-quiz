---
phase: 25-levels-5-8-difficulty-ramp-select-grid
plan: 04
subsystem: game-content
tags: [level-descriptors, math-brain, difficulty-tuning, secret-alcove]

requires:
  - phase: 25-01
    provides: "src/mechanics/secretAlcove.js's wireSecretAlcove + src/levels/build.js's secretAlcove ?? [] loop (the mechanism this plan retrofits into levels 1-4)"
provides:
  - "level-02.js's allowedTables narrowed to [2,3,4,5,6,7] (table 1 dropped, MATH-01)"
  - "src/math/brain.js's LOCKED multiplicand roll narrowed from 1-10 to 1-9 (MATH-02), the ONE authorized literal edit to this milestone"
  - "scripts/check-progress.sh gains 2 permanent regression assertions guarding both edits"
  - "levels 1-4 each carry one new, purely-additive secretAlcove entry (LVL-06 now applies to all 8 levels, not just 5-8)"
affects: ["25-06 (must re-baseline smoke-progress.mjs's LEVEL_ORDER count and the 4 geometry deepEqual literals for the new secretAlcove keys)"]

tech-stack:
  added: []
  patterns:
    - "secretAlcove retrofit onto pre-existing (not newly-authored) levels: append-only geometry key, zero edits to any existing floor/platform/checkpoint value, placed as a short extra hop above an early existing platform"

key-files:
  created: []
  modified:
    - src/levels/level-02.js
    - src/math/brain.js
    - scripts/check-progress.sh
    - src/levels/level-01.js
    - src/levels/level-03.js
    - src/levels/level-04.js

key-decisions:
  - "Both MATH-01 and MATH-02 committed as a single Task-1 commit, verified with git diff --stat showing exactly '1 insertion(+), 1 deletion(-)' per file before touching anything else"
  - "check-progress.sh's final smoke-progress.mjs invocation was already RED before this plan's edits, due to Plan 25-03's LEVEL_ORDER bump to 8 (smoke-progress.mjs's LEVEL_ORDER.length===4 assertion not yet re-baselined) -- confirmed pre-existing and out of this plan's scope per 25-04-PLAN.md's own verification notes and 25-05-SUMMARY.md's identical finding; not fixed here, Plan 25-06's job"
  - "Each of levels 1-4's secretAlcove placed as a short extra hop (~70px rise) directly above that level's earliest existing platform, mirroring level-05/06/07/08's established alcove pattern -- off the required path, not signposted, not gating"

patterns-established:
  - "Retrofitting a new optional mechanic into pre-existing, already-shipped levels: pure append, verified via git diff --numstat showing zero deletions, never touching an existing key/value"

requirements-completed: [MATH-01, MATH-02, LVL-03, LVL-06]

coverage:
  - id: D1
    description: "level-02.js's allowedTables narrowed to [2,3,4,5,6,7] -- table 1 dropped, no compensating table added"
    requirement: "MATH-01"
    verification:
      - kind: unit
        ref: "grep -q 'allowedTables: \\[2, 3, 4, 5, 6, 7\\]' src/levels/level-02.js && git diff --stat (1 insertion, 1 deletion)"
        status: pass
    human_judgment: false
  - id: D2
    description: "brain.js's LOCKED multiplicand roll narrowed from Math.random()*10+1 to Math.random()*9+1 -- the ONE authorized literal edit, single-line diff"
    requirement: "MATH-02"
    verification:
      - kind: unit
        ref: "grep -q 'Math.floor(Math.random() * 9) + 1' src/math/brain.js && git diff --stat (1 insertion, 1 deletion)"
        status: pass
    human_judgment: false
  - id: D3
    description: "check-progress.sh gains 2 permanent regression assertions guarding MATH-01/MATH-02"
    verification:
      - kind: unit
        ref: "scripts/check-progress.sh assertions 14-15 (positive grep for both new literals, negative grep for the old 10-based roll)"
        status: pass
    human_judgment: false
  - id: D4
    description: "levels 1-4 each retrofit with exactly one new, purely-additive secretAlcove entry (LVL-06 now applies to all 8 levels)"
    requirement: "LVL-06"
    verification:
      - kind: unit
        ref: "node -e alcove-retrofit-count-ok check + git diff --numstat all-additive PASS + validate-levels.mjs zero HARD-FAILs on levels 1-4"
        status: pass
    human_judgment: false
  - id: D5
    description: "smoke-progress.mjs's level 1-4 geometry deepEqual checks and the LEVEL_ORDER count assertion are expected to be RED at this point -- documented interim state, not fixed until Plan 25-06"
    verification: []
    human_judgment: false

duration: 5min
completed: 2026-07-06
status: complete
---

# Phase 25 Plan 04: Math Edits + Secret Alcove Retrofit Summary

**Dropped table 1 from level-02's pool and narrowed the LOCKED brain's multiplicand roll to 1-9 (the two sole authorized math edits this milestone), then retrofit one purely-additive secret XP alcove into each of levels 1-4.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-06T21:04:00Z (approx)
- **Completed:** 2026-07-06T21:09:03Z
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments
- `src/levels/level-02.js`'s `allowedTables` narrowed from `[1, 2, 3, 4, 5, 6, 7]` to `[2, 3, 4, 5, 6, 7]` — MATH-01, table 1 dropped, 6/7 kept intact
- `src/math/brain.js:247`'s multiplicand roll narrowed from `Math.floor(Math.random() * 10) + 1` to `Math.floor(Math.random() * 9) + 1` — MATH-02, the ONE authorized literal change to the LOCKED math brain this milestone, proven single-line via `git diff --stat`
- `scripts/check-progress.sh` gained 2 new permanent regression assertions (renumbered 14/15, with the prior "final step" comment renumbered to 16) guarding both edits — a positive grep for each new literal plus a negative grep proving the old 10-based roll is gone
- `src/levels/level-01.js`, `level-02.js`, `level-03.js`, `level-04.js` each gained exactly one new `secretAlcove: [{ x, y }]` array — LVL-06's "every level hides one optional secret XP alcove" now covers all 8 levels, not just the newly-authored 5-8

## Task Commits

Each task was committed atomically:

1. **Task 1: MATH-01 + MATH-02 literal edits + check-progress.sh regression grep** - `a40d946` (fix)
2. **Task 2: Retrofit one secretAlcove into each of levels 1-4, purely additively** - `cad1e3b` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/levels/level-02.js` - `allowedTables` `[1..7]` → `[2..7]` (MATH-01); plus 1 new `secretAlcove` entry at `{x:320, y:170}` (LVL-06)
- `src/math/brain.js` - line 247's multiplicand roll `* 10 + 1` → `* 9 + 1` (MATH-02), the sole authorized edit to this LOCKED file
- `scripts/check-progress.sh` - 2 new permanent regression assertions (14, 15) guarding both math edits; the prior final-step comment renumbered to 16
- `src/levels/level-01.js` - 1 new, purely-additive `secretAlcove` entry at `{x:400, y:170}` (LVL-06)
- `src/levels/level-03.js` - 1 new, purely-additive `secretAlcove` entry at `{x:310, y:170}` (LVL-06)
- `src/levels/level-04.js` - 1 new, purely-additive `secretAlcove` entry at `{x:270, y:162}` (LVL-06)

## Decisions Made
- Combined MATH-01 and MATH-02 into a single Task 1 commit (as the plan specified), each verified independently via `git diff --stat` showing exactly `1 insertion(+), 1 deletion(-)` per file before proceeding.
- `check-progress.sh`'s final `smoke-progress.mjs` invocation was already failing before any edit in this plan landed — root cause is Plan 25-03's registry bump to 8 levels (`LEVEL_ORDER.length === 4` assertion not yet re-baselined). Confirmed via `25-04-PLAN.md`'s own documented interim-state language and `25-05-SUMMARY.md`'s identical independent finding ("smoke-progress.mjs's hardcoded LEVEL_ORDER.length===4 assertion was deliberately NOT bumped... closed by a later plan in this phase (25-06)"). This is out of this plan's scope per the deviation rules' scope boundary (pre-existing, unrelated-file failure) — not fixed here.
- Each of levels 1-4's secret alcove is placed as a short (~70px) extra hop directly above that level's earliest existing platform, mirroring the established pattern from levels 5-8 (level-05.js's alcove above its gap-1 bridging platform). Off the required path, unsignposted, not gating.

## Deviations from Plan

None — plan executed exactly as written. The pre-existing `LEVEL_ORDER` count failure (see Decisions above) is a documented interim state inherited from Plan 25-03, explicitly out of scope per this plan's own verification notes, not an auto-fix or deviation introduced here.

## Issues Encountered

`bash scripts/check-progress.sh` (Task 1's final verify step) does not print `progress checks: PASS` at the end of this plan, because its last step invokes `node scripts/smoke-progress.mjs`, which fails on:
1. The pre-existing `LEVEL_ORDER.length === 4` assertion (caused by Plan 25-03's registry extension to 8 levels, not by this plan) — expected-red, deferred to Plan 25-06 per 25-04-PLAN.md and 25-05-SUMMARY.md.
2. Four new `deepEqual` geometry-mismatch assertions on levels 1-4 (caused by this plan's Task 2 adding the new `secretAlcove` key) — explicitly documented as an EXPECTED, deliberate interim state in this plan's own Task 2 action/acceptance-criteria/verification text, not to be fixed until Plan 25-06 re-baselines the 4 `expectedGeometry` literals.

All other individual assertions in `check-progress.sh` (0-13, plus the 2 new MATH-01/MATH-02 assertions 14-15 added by Task 1) pass. `node scripts/validate-levels.mjs` shows zero `HARD-FAIL` rows for levels 1-4. This matches the plan's own documented expectations exactly — no unplanned regression.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- MATH-01/MATH-02 are fully landed and permanently regression-guarded; no further math-brain or table-pool edits are authorized this milestone.
- Levels 1-4 now have secret alcoves alongside levels 5-8 — LVL-06 is functionally complete across all 8 levels.
- Plan 25-06 (Wave 3) must re-baseline `scripts/smoke-progress.mjs`'s `LEVEL_ORDER.length` assertion (4 → 8) and its 4 `expectedGeometry` literals for levels 1-4 (adding the new `secretAlcove` key with the exact coordinates authored here) before `check-progress.sh` can go green again.

---
*Phase: 25-levels-5-8-difficulty-ramp-select-grid*
*Completed: 2026-07-06*

## Self-Check: PASSED

All 6 modified files verified present on disk; both task commits (`a40d946`, `cad1e3b`) verified present in `git log`.
