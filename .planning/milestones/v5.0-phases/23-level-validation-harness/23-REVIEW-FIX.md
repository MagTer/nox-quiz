---
phase: 23-level-validation-harness
fixed_at: 2026-07-06T14:35:00Z
review_path: .planning/phases/23-level-validation-harness/23-REVIEW.md
iteration: 2
findings_in_scope: 6
fixed: 5
skipped: 1
status: partial
---

# Phase 23: Code Review Fix Report

**Fixed at:** 2026-07-06T01:04:50Z
**Source review:** .planning/phases/23-level-validation-harness/23-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (3 Critical, 3 Warning; Info findings excluded per `fix_scope: critical_warning`)
- Fixed: 5
- Skipped: 1

All fixes were verified against the RED-first proof after every change: `node
scripts/lib/over-hole-check.mjs`, `node scripts/lib/reachability.mjs`, and `node
scripts/validate-levels.mjs` were re-run after each commit, confirming the
validator still reports exactly 9 HARD-FAILs across all 4 shipped levels, with
the same 3 known real defects (level-01 mathGates x600/x1300, level-04
mathGate x1800) surfacing correctly — no new false positives or false
negatives introduced. After all fixes landed, the full static gate suite
(`check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`,
`smoke-progress.mjs`) and the bad-level fixture run were also re-verified:
all pass with zero cross-cutting regressions.

## Fixed Issues

### CR-01: `findOverHoleBarriers` can miss a barrier that straddles a gap narrower than its own width

**Files modified:** `scripts/lib/over-hole-check.mjs`
**Commit:** `6c5b91f`
**Applied fix:** Replaced the independent per-edge `onFloor(x)` checks with a
single `fullyOnOneFloor(x0, x1)` predicate that requires BOTH the barrier's
left and right edges to be covered by the SAME floor run, matching the
review's proposed fix. Verified via the module's own self-test and the full
validator: identical 9-HARD-FAIL RED-first output, no regression.

### CR-02: `collectZones` are silently excluded from the over-hole check entirely

**Files modified:** `scripts/lib/over-hole-check.mjs`
**Commit:** `961e7c4`
**Applied fix:** Added `collectZones: CONFIG.COLLECT.ZONE_W` to `BARRIER_WIDTH`
and `"collectZones"` to the checked-kind loop, and updated the module's
header comments (SCOPE / NEVER-BRICK GUARD) to reflect the now-5 checked
optional arrays. Verified no real level's collectZones introduced a new
false-positive HARD-FAIL.

### CR-03: reachability's `mechanic-reachability` check only tests a barrier's start x, never its footprint's far edge

**Files modified:** `scripts/lib/reachability.mjs`
**Commit:** `4d35025`
**Applied fix:** Changed the mechanic-reachability loop to look up both
`nodeContaining(floorNodes, e.x)` and `nodeContaining(floorNodes, e.x + w)`,
HARD-FAILing unless both resolve to the same floor node — mirroring CR-01's
fix as explicit defense-in-depth (kept even after CR-02 landed, since the two
modules can be run/consumed independently, per the review's own note).
Verified via the module's self-test and full validator: identical RED-first
output.

### WR-01: WARN-tier `marginRatio` is mathematically pinned to ~1.000 for every flat-or-downward hop

**Files modified:** `scripts/lib/reachability.mjs`
**Commit:** `84288c3`
**Applied fix:** Per the additional guidance's direction (CONTEXT.md grants
Claude's Discretion on exact threshold tuning; a full ratio-formula rework is
a larger algorithmic change out of scope for this quick-fix pass), applied
option (a): added an in-code comment at `canReach`'s marginRatio computation
explaining the flat/downward degenerate case, so a future maintainer reading
the source directly (not just planning artifacts) learns about the
limitation. This is a documentation-only change — no logic was altered, and
the validator's output is byte-for-byte identical before and after.

### WR-02: `checkLevelReachability`'s goal lookup omits `y`, silently depending on node-array ordering

**Files modified:** `scripts/lib/reachability.mjs`
**Commit:** `c82fbe5`
**Applied fix:** Adapted rather than blindly applied the review's literal
one-line suggestion (`nodeContaining(nodes, goalX, geometry.goal.y)`), because
naively passing `geometry.goal.y` through the existing strict
`|y - node.y| < 8` disambiguation broke ALL 4 real levels (their goal's
sprite-anchor y, e.g. `FLOOR_Y - CONFIG.GOAL_SIZE`, is 16px away from the
floor node's own y, which exceeds the 8px threshold) — confirmed by a
regression run showing `validate-levels: FAIL — 12 hard-failure(s)` where 9
was expected. Root-caused this to `nodeContaining`'s disambiguation logic
itself assuming entity y equals node y, which is false for every
sprite-anchored geometry entity in this game. Reworked `nodeContaining` to:
return the sole candidate when only one node's x-span contains `x` (the
common case, unaffected by `y`), and otherwise return the candidate whose `y`
is numerically CLOSEST to the supplied `y` (rather than requiring an exact
match) when multiple candidates' x-spans overlap. This preserves the intended
disambiguation for genuinely overlapping floor/platform pairs while no longer
false-failing every shipped level's goal. Re-verified: RED-first proof
restored (9 HARD-FAILs, same 3 known real defects), full gate suite green.

## Skipped Issues

### WR-03: Security-relevant static-server + path-traversal guard is duplicated verbatim across multiple scripts

**File:** `scripts/audit-phase21-mechanics.mjs:27-116`, `scripts/calibrate-jump-envelope.mjs:27-99`
**Reason:** The source code itself contains an explicit, deliberate directive
that directly conflicts with the review's proposed extraction:
`calibrate-jump-envelope.mjs`'s header comment states "Copies
browser-boot.mjs's resolvePlaywright() and local static server VERBATIM,
including its CR-02 path-traversal guard and loopback-only bind — see
scripts/browser-boot.mjs for the canonical source. **Do not simplify or
rewrite either guard.**" The review's own finding text independently
confirms this: "The project's own comments acknowledge this is a deliberate
'copy verbatim, do not simplify' convention." Additionally, the canonical
source (`scripts/browser-boot.mjs`) was not among the 8 files this review
pass actually read/reviewed, so rewriting it as part of an extraction would
mean modifying unreviewed, security-relevant code with no independent
verification of its current exact behavior. Given (1) an explicit in-code
instruction against this exact change, (2) the finding is filed as a
maintainability WARNING rather than a live vulnerability (the guard logic
itself is correct in both copies reviewed), and (3) the extraction would
require touching a file outside this review's scope, this is deferred to a
deliberate, human-reviewed follow-up rather than applied as a quick-fix.
**Original issue:** Both files (and, per their own comments,
`scripts/browser-boot.mjs`) contain a byte-for-byte copy of
`resolvePlaywright()`, the `FALLBACK_PLAYWRIGHT_PATH` constant, and the local
HTTP static server including its path-traversal guard and loopback-only
bind — any future fix to the guard must be applied identically everywhere by
hand, with no automated way to detect drift.

## Iteration 2: Re-Review Confirmation

A second gsd-code-reviewer pass independently re-derived and re-executed the original
repro for each of the 5 fixes above (not just re-reading commit messages), and confirmed
all 5 correct with no regressions: `node scripts/validate-levels.mjs` still reports exactly
9 HARD-FAILs across the 4 shipped levels, naming the same 3 known real defects; both
modules' self-tests and the `bad-level.js` fixture RED-proof still pass.

The re-review confirmed WR-03 remains a reasonable, intentional skip (not something a
further fix pass would resolve differently) and found zero new Critical or Warning
findings. Remaining open items are WR-03 (deliberately deferred, documented above) and the
4 Info-level findings (IN-01..04), which were out of scope for this `critical_warning` fix
pass by design.

**Orchestrator decision: stopping the `--auto` loop here (after 2 of the allowed 3
iterations) rather than mechanically continuing.** The only remaining in-scope-severity
finding (WR-03) has now been independently confirmed twice as a deliberate, correctly-reasoned
skip — a third iteration would not change that outcome, since the underlying constraint
(an explicit in-code "do not simplify" directive, and the canonical source file being
outside this review's scope) is unchanged. Looping further would burn a cycle for zero
expected benefit. This phase's REVIEW-FIX status is `partial` by design, not by exhaustion
of the iteration budget.

---

_Fixed: 2026-07-06T14:35:00Z (iteration 1 fixes at 2026-07-06T01:04:50Z; iteration 2 was
re-review-only, confirming no further fixes needed)_
_Fixer: Claude (gsd-code-fixer)_
_Reviewer (iteration 2 confirmation): Claude (gsd-code-reviewer)_
_Final iteration: 2_
