# Deferred Items — Phase 26 (Grunge Palette & Nox Run Rebrand)

Out-of-scope discoveries logged per the executor's Scope Boundary rule
(only auto-fix issues directly caused by the current task's changes).

## 2026-07-07 — Plan 26-07, Task 2

**Observed:** `bash scripts/check-progress.sh` fails with 3 `smoke-progress.mjs`
assertion failures:
- `LVL-02 regression: getLevel("level-01").geometry must deep-equal the v3.0
  src/level.js geometry verbatim`
- `LVL-02 regression: getLevel("level-03").geometry must match the authored
  descriptor`
- `LVL-02 regression: getLevel("level-04").geometry must match the authored
  descriptor`

**Why out of scope:** Plan 26-07's Task 2 only modifies `src/config.js`,
`src/main.js`, `src/scenes/title.js`, `src/scenes/select.js` — none of which
touch level geometry. These assertions are hardcoded expected-geometry pins
in `scripts/smoke-progress.mjs` compared against the live level descriptors
(`src/levels/level-01.js`, `level-03.js`, `level-04.js`). Not caused by this
plan's changes.

**Not fixed.** Per the Scope Boundary rule, this is logged rather than
auto-fixed. STATE.md's own decision log already records this class of issue
as a known, tracked gap: "[Phase 25-04]: check-progress.sh's final
smoke-progress.mjs invocation was already RED before this plan due to Plan
25-03's LEVEL_ORDER bump to 8 (not yet re-baselined)... deferred to Plan
25-06" — this appears to be a recurrence/continuation of that same
regression-pin staleness class (level descriptors evolving faster than the
hardcoded expected-geometry literals in the smoke test), not a new defect
introduced by this plan.

**Suggested follow-up:** Re-baseline `scripts/smoke-progress.mjs`'s
expected-geometry literals for level-01/03/04 against the current live
descriptors, in a plan that owns `scripts/smoke-progress.mjs` (not this
logo/rebrand plan).
