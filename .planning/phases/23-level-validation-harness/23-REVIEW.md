---
phase: 23-level-validation-harness
reviewed: 2026-07-06T14:30:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - scripts/audit-phase21-mechanics.mjs
  - scripts/calibrate-jump-envelope.mjs
  - scripts/fixtures/bad-level.js
  - scripts/lib/audit-retry.mjs
  - scripts/lib/jump-envelope.mjs
  - scripts/lib/over-hole-check.mjs
  - scripts/lib/reachability.mjs
  - scripts/validate-levels.mjs
findings:
  critical: 0
  warning: 1
  info: 4
  total: 5
status: issues_found
---

# Phase 23: Code Review Report (Iteration 2 — Re-review)

**Reviewed:** 2026-07-06T14:30:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This is the iteration-2 re-review of the level-validation harness. The prior review
(iteration 1) found 3 Critical false-negative correctness bugs (CR-01, CR-02, CR-03) and
3 Warnings (WR-01, WR-02, WR-03). Per the fix pass's `fix_scope: critical_warning`, CR-01,
CR-02, CR-03, WR-01, and WR-02 were addressed across 5 commits (6c5b91f, 961e7c4, 4d35025,
84288c3, c82fbe5); WR-03 was deliberately left unfixed with a documented rationale. The
4 Info-level findings (IN-01..04) were out of scope for this fix pass and were not touched.

Per the adversarial re-review brief, every fix was independently re-derived and re-tested
against the live code rather than trusted from commit messages:

- **CR-01** (`over-hole-check.mjs`): re-ran the exact prior repro (a 20px gap with a
  mathGate straddling both floor runs) against the current `findOverHoleBarriers` —
  now correctly returns a non-empty HARD-FAIL row (`{"kind":"mathGates","x":380,"w":32,"footprint":[380,412]}`)
  instead of `[]`. Confirmed fixed: the new `fullyOnOneFloor(x0, x1)` helper requires both
  edges inside the same `[a, b]` run.
- **CR-02** (`over-hole-check.mjs`): confirmed `collectZones` is now in `BARRIER_WIDTH` and
  the iteration loop; re-ran the prior repro (a collectZone footprint 200..264 straddling a
  210..400 gap) — now correctly flagged (`{"kind":"collectZones","x":200,"w":64,"footprint":[200,264]}`)
  instead of being silently skipped.
- **CR-03** (`reachability.mjs`): confirmed `mechanic-reachability` now computes both
  `node` (near edge) and `endNode` (far edge) and requires `node.id === endNode.id`. Re-ran
  the prior full-pipeline repro (the same straddling collectZone, now checked end-to-end via
  `checkLevelReachability`) — correctly reports `HARD-FAIL: "collectZones x:200..264 not
  fully supported by any single floor run"` where it previously reported `PASS` with zero
  failures anywhere in the pipeline.
- **WR-01**: confirmed the marginRatio=1.000-pinning limitation is now explained directly in
  `canReach`'s own comments (reachability.mjs:181-196), not only in external planning docs.
  No behavior change, as intended (deferred algorithmic rework, correctly scoped out).
- **WR-02** (`reachability.mjs`): confirmed `geometry.goal.y` is now passed through to
  `nodeContaining`, and that `nodeContaining` itself was reworked from a strict `<8px` match
  to "closest candidate by y among x-containing nodes." Constructed a synthetic repro (a
  goal placed on an elevated platform whose x-range overlaps a floor run, sprite-anchored
  32px above the platform's node y) — `nodeContaining` correctly resolves to the platform
  node when `y` is passed, versus incorrectly resolving to the floor node when `y` is
  omitted (reproducing the pre-fix bug on demand). The "closest by y" heuristic is sound:
  the documented safety margin (envelope maxRise ~88px separation between genuinely distinct
  overlapping nodes vs. <=32px max sprite-anchor offset in this game) holds up under
  inspection — there is more than 2x headroom between the sprite-offset noise and the
  minimum real vertical separation the heuristic must discriminate against.

`node scripts/validate-levels.mjs` was re-run against all 4 real levels: the 3 previously-
known real defects (level-01 mathGates x:600/x:1300, level-04 mathGate x:1800) still
HARD-FAIL as expected (now via the corrected same-run/same-node logic, not the old
independent-edge logic), and level-04's spawn-goal / gap 1760..1960 HARD-FAILs (a real,
pre-existing, unrelated gap defect) are unchanged — no regression introduced by any of the
5 fixes. `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js` still
goes RED (4 HARD-FAILs, exit 1) as designed. Both self-tests
(`node scripts/lib/over-hole-check.mjs`, `node scripts/lib/reachability.mjs`, including the
new Case 3b regression test added alongside these fixes) pass.

**WR-03 skip assessment:** confirmed the skip is reasonable. `audit-phase21-mechanics.mjs`
and `calibrate-jump-envelope.mjs` still contain byte-identical copies of
`resolvePlaywright()`/`FALLBACK_PLAYWRIGHT_PATH` and the local static server + CR-02
path-traversal guard, each explicitly commented as "copied verbatim from
scripts/browser-boot.mjs ... Do not simplify or rewrite either guard." The canonical
source (`browser-boot.mjs`) is outside this review's file scope, and the guard logic
itself is correct and byte-identical in both copies reviewed here (loopback-only bind,
`sep`-boundary-aware path clamp). This remains a maintainability/security-hygiene
WARNING, not a live vulnerability, and de-duplicating it would require touching a file
outside this phase's scope — reasonable to continue deferring, not a blocker.

The 4 Info-level findings from iteration 1 were spot-checked against the current source
and are still present at the same line numbers (not touched by this fix pass, as
expected — they were out of `fix_scope`). They are re-listed below, unchanged, per the
task brief's instruction not to drop them.

No new Critical or Warning issues were found during this re-review beyond confirming
WR-03 remains appropriately deferred.

## Warnings

### WR-03: Security-relevant static-server + path-traversal guard is duplicated verbatim across multiple scripts

**File:** `scripts/audit-phase21-mechanics.mjs:27-116`, `scripts/calibrate-jump-envelope.mjs:27-99`
**Issue:** Both files (and, per their own comments, `scripts/browser-boot.mjs`, which is
outside this review's file scope) contain a byte-for-byte copy of `resolvePlaywright()`,
the `FALLBACK_PLAYWRIGHT_PATH` constant, and the local HTTP static server including its
CR-02 path-traversal guard and loopback-only `listen("127.0.0.1")` bind. The guard logic
itself is correct in both copies re-verified here, but duplicating a security control
across 3+ files means any future fix to the guard (e.g. a newly-discovered traversal edge
case) must be applied identically everywhere by hand — a single missed copy reintroduces
the vulnerability in that script only, with no automated way to detect the drift. The
project's own comments acknowledge this is a deliberate "copy verbatim, do not simplify"
convention (calibrate-jump-envelope.mjs:22-25), which is why this was intentionally
skipped in the fix pass rather than reworked — reasonable, since de-duplicating it would
require modifying the canonical source file (`browser-boot.mjs`), which sits outside this
review's scope. Still filed as a WARNING because the underlying maintainability/drift risk
is real and unresolved.

**Fix:** Extract the shared server/guard/`resolvePlaywright` logic into one small shared
module (e.g. `scripts/lib/dev-server.mjs`) that all Playwright-driving scripts import
(including `browser-boot.mjs`), so a future guard fix only needs to land in one place.
This is a cross-file change touching `browser-boot.mjs`, so it should be scoped as its own
follow-up rather than folded into this phase.

## Info

### IN-01: `audit-retry.mjs`'s warmup condition is broader than `mechanic-drive.mjs`'s documented invariant, and the doc comment is now stale

**File:** `scripts/lib/audit-retry.mjs:78`
**Issue:** `mechanic-drive.mjs` documents `warmupUntilFirstGap` as intended "only for the
very first encounter of each level." `audit-retry.mjs` instead applies it to **every**
encounter whose `x` is less than the first floor's end (`encounter.x < firstFloorEnd`,
line 78). This is currently safe (both level-03 and level-04 have *two* encounters — a
collect zone and a math-gate — before their first real gap, and applying the warmup to
both is harmless/correct since it only suppresses jumping on gap-free ground), but it
silently generalizes past the single-encounter invariant the sibling module's comments
describe, without updating those comments. A future reader relying on the "only the first
encounter" claim to reason about behavior would be misled. Unchanged since iteration 1
(out of fix scope).
**Fix:** Update `mechanic-drive.mjs`'s docstring (or add a comment here) to describe the
actual, broader "any encounter before the first genuine gap" semantics.

### IN-02: `reachedX` is always `null` in the printed audit output — a dead field

**File:** `scripts/audit-phase21-mechanics.mjs:174-190`
**Issue:** Each result pushed to `results` hardcodes `reachedX: null` (line 186) because
`auditLevelWithRetries` doesn't surface the underlying `driveToXClimbing` return value's
`reachedX`. The comment at lines 176-179 acknowledges this is intentional, but the field
still appears in every printed JSON row with zero information content, which is confusing
for anyone reading the diagnostic output later (e.g. while triaging a failure) and
expecting it to mean something. Unchanged since iteration 1 (out of fix scope).
**Fix:** Either drop the field from the output shape, or have `auditLevelWithRetries`
carry the last-observed `reachedX` through in its returned outcome so the field is
meaningful again.

### IN-03: `--fixture` with a missing path argument silently falls back to validating all real levels

**File:** `scripts/validate-levels.mjs:38-42`
**Issue:** `parseFixturePath` returns `argv[idx + 1] ?? null`; if `--fixture` is the last
argv token (a plausible typo, e.g. a forgotten path), `buildDescriptors(null)` treats this
identically to "no `--fixture` flag at all" and validates the full `LEVEL_ORDER` instead of
raising a usage error. A user expecting fixture-only output would get a confusing full-level
report with no indication their flag was ignored. Unchanged since iteration 1 (out of fix
scope).
**Fix:** Distinguish "flag absent" from "flag present but missing its value" and throw/print
a usage error for the latter.

### IN-04: No top-level error handling around `await main()` — an invalid `--fixture` path crashes with a raw stack trace

**File:** `scripts/validate-levels.mjs:90`
**Issue:** `await main();` at module top level has no surrounding `try/catch`. If
`--fixture <path>` points at a nonexistent file, `import(pathToFileURL(resolve(fixturePath)).href)`
(line 47) throws, producing an unhandled-rejection stack trace rather than the clean,
single-line error messages this script uses elsewhere (e.g. line 50's thrown `Error` for a
fixture with no `.geometry` export). Unchanged since iteration 1 (out of fix scope).
**Fix:**
```js
try {
  await main();
} catch (e) {
  console.error(`validate-levels: ERROR — ${e.message}`);
  process.exit(1);
}
```

---

_Reviewed: 2026-07-06T14:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
