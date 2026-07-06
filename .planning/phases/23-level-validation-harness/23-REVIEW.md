---
phase: 23-level-validation-harness
reviewed: 2026-07-06T12:00:00Z
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
  critical: 3
  warning: 3
  info: 4
  total: 10
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-07-06T12:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the level-validation harness (over-hole interval checker, Δy-aware BFS
reachability graph, the frozen jump-envelope calibration constant, the CLI orchestrator,
the deliberately-bad fixture, the interactive-audit retry wrapper, and the two
Playwright-driven scripts). All 8 files were read in full; `node scripts/validate-levels.mjs`,
`node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js`,
`node scripts/lib/over-hole-check.mjs`, and `node scripts/lib/reachability.mjs` were all
executed directly to verify claimed behavior against real output rather than trusting the
code/comments alone (per the adversarial brief).

The already-fixed `canReach` overlap-span bug (documented in `reachability.mjs`'s own
comments and in `23-FINDINGS.md`'s "Post-Plan Correction" section) was re-derived
independently and confirmed correct for the cases it covers. However, two **new**,
previously-undocumented correctness gaps were found in the over-hole/reachability
detection logic itself — both are provable false negatives (the validator reports
"clean"/"PASS" for geometry that is actually broken), which is a serious problem for a
tool whose entire purpose is to be a trustworthy structural gate. Both were confirmed by
constructing a minimal synthetic geometry and running the real exported functions against
it (see each finding for the exact repro).

The WARN-tier `marginRatio=1.000` behavior called out in the review brief was independently
re-derived from the quadratic-root math in `canReach` and confirmed, by direct execution of
`validate-levels.mjs` against the real levels, to be **exactly 1.000 for every single
flat-or-downward WARN row across all 4 shipped levels** — the tiering system currently
provides zero discriminating signal for the common case. `23-FINDINGS.md` already
documents this as a known, intentionally-deferred limitation, so it is filed here as a
WARNING (not a BLOCKER) with a note that the characterization is accurate, but the
limitation is not explained anywhere in the shipped source itself.

Also flagged: a latent node-disambiguation bug in the goal lookup, duplicated
security-relevant server/path-guard code across scripts, and several smaller quality/UX
gaps in the CLI and diagnostic-output plumbing.

## Critical Issues

### CR-01: `findOverHoleBarriers` can miss a barrier that straddles a gap narrower than its own width

**File:** `scripts/lib/over-hole-check.mjs:47-60`
**Issue:** `onFloor(x)` (line 49) tests whether a single x-coordinate falls inside **any**
floor run, independently for the barrier's left edge (`e.x`) and right edge (`e.x + w`).
It never checks that **both edges belong to the same run**. If two floor runs are
separated by a gap narrower than the barrier's width (`CONFIG.DOOR.W` /
`CONFIG.MATH_GATE.W` / `CONFIG.ENEMY.W`, all `32`), a barrier whose left edge sits on run A
and whose right edge sits on run B will pass both individual `onFloor` checks even though
the middle of its footprint floats over the gap with no floor beneath it at all — directly
contradicting the module's own documented contract ("RESULT CONTRACT: an empty array
(`[]`) means clean — every barrier is fully supported by a floor run.").

Confirmed by direct execution:
```js
import { findOverHoleBarriers } from "./scripts/lib/over-hole-check.mjs";
findOverHoleBarriers({
  floors: [{ x: 0, w: 390 }, { x: 410, w: 400 }], // 20px gap: 390..410
  mathGates: [{ x: 380, y: 256 }],                 // footprint 380..412, straddles the gap
});
// -> [] (reported "clean" — but 20px of this mathGate's footprint has no floor beneath it)
```
All currently-shipped level gaps are 160px+ (far wider than the 32px barrier widths), so
this does not manifest against today's content, but it is a real, silent hole in the
"exact interval arithmetic" guarantee the module advertises, and a future level author
introducing a narrow sliver gap next to a barrier would ship an over-hole defect with zero
warning from this gate.

**Fix:**
```js
export function findOverHoleBarriers(geometry) {
  const runs = (geometry.floors ?? []).map((f) => [f.x, f.x + f.w]);
  // Require BOTH edges to be covered by the SAME single run, not each edge
  // independently by (possibly different) runs.
  const fullyOnOneFloor = (x0, x1) => runs.some(([a, b]) => x0 >= a && x1 <= b);
  const rows = [];
  for (const kind of ["doors", "mathGates", "enemies"]) {
    for (const e of geometry[kind] ?? []) {
      const w = BARRIER_WIDTH[kind];
      if (!fullyOnOneFloor(e.x, e.x + w)) {
        rows.push({ kind, x: e.x, w, footprint: [e.x, e.x + w] });
      }
    }
  }
  return rows;
}
```

### CR-02: `collectZones` are silently excluded from the over-hole check entirely

**File:** `scripts/lib/over-hole-check.mjs:33-58`
**Issue:** `BARRIER_WIDTH` (line 33) and the `for (const kind of ["doors", "mathGates",
"enemies"])` loop (line 51) never include `"collectZones"`, even though collect zones have
a well-defined footprint width (`CONFIG.COLLECT.ZONE_W = 64`, `src/config.js:126`) and sit
at floor level exactly like doors/mathGates/enemies. `scripts/lib/reachability.mjs`
independently treats `collectZones` as a first-class barrier kind (its own
`BARRIER_WIDTH` map at line 255-260 includes `collectZones: CONFIG.COLLECT.ZONE_W`),
confirming the intent was for all four mechanic types to be checked — this module simply
omits one. The header's "SCOPE" comment (lines 14-16) only explains why *platforms* are
out of scope; it never justifies excluding `collectZones`.

**Fix:** add `"collectZones"` to the loop and give it a width entry:
```js
const BARRIER_WIDTH = {
  doors: CONFIG.DOOR.W,
  mathGates: CONFIG.MATH_GATE.W,
  enemies: CONFIG.ENEMY.W,
  collectZones: CONFIG.COLLECT.ZONE_W,
};
...
for (const kind of ["doors", "mathGates", "enemies", "collectZones"]) { ... }
```

### CR-03: reachability's `mechanic-reachability` check only tests a barrier's start x, never its footprint's far edge — compounds CR-02 with no backstop

**File:** `scripts/lib/reachability.mjs:326-347`
**Issue:** For every barrier kind (including `collectZones`, line 326), the check does
`const node = nodeContaining(floorNodes, e.x)` — it only verifies that the barrier's
**left edge** sits on some floor run, then reports `PASS` if that node is reachable from
spawn. It never checks `e.x + w` (the barrier's right/far edge). Combined with CR-02 (no
over-hole check at all for `collectZones`), a `collectZones` entry whose footprint extends
past the end of its floor run into an adjacent gap will be reported `PASS` by
`validate-levels.mjs` with **no failure anywhere in the pipeline**, even though part of the
interactive zone floats over open air.

Confirmed by direct execution:
```js
const geometry = {
  floors: [{ x: 0, w: 210 }, { x: 400, w: 300 }], // gap 210..400
  collectZones: [{ x: 200, y: 256, slots: [0,1,2,3] }], // footprint 200..264 — 54px hangs into the gap
  goal: { x: 450, y: 320 },
};
findOverHoleBarriers(geometry);           // -> []  (CR-02: collectZones not checked at all)
checkLevelReachability(geometry).rows;    // -> mechanic-reachability: PASS
                                           //    "collectZones x:200..264 on floor-0 reachable from spawn"
```
This directly undermines the module's own design note (lines 22-29): "The ONLY thing that
can make a barrier truly unreachable is its footprint floating over a hole ... or its
floor run being outside the BFS-reachable component" — this specific hole-floating case is
not actually caught for `collectZones`.

**Fix:** require both edges on the same floor node (mirroring CR-01's fix), e.g.:
```js
const node = nodeContaining(floorNodes, e.x);
const endNode = nodeContaining(floorNodes, e.x + w);
if (!node || !endNode || node.id !== endNode.id) {
  rows.push({ check: "mechanic-reachability", status: "HARD-FAIL",
    descriptor: `${kind} x:${e.x}..${e.x + w} not fully supported by any single floor run` });
  continue;
}
```
(This is a useful defense-in-depth fix even after CR-02 is fixed, since CR-02's fix alone
only restores `over-hole-check.mjs`'s coverage for `collectZones` — this check's own
same-shape weakness still exists for the other three kinds too, just currently masked by
`over-hole-check.mjs` running first in `validate-levels.mjs`.)

## Warnings

### WR-01: WARN-tier `marginRatio` is mathematically pinned to ~1.000 for every flat-or-downward hop, making the tier non-discriminating in the common case

**File:** `scripts/lib/reachability.mjs:100-179`
**Issue:** For any hop where `dy >= 0` (landing at the same height or lower —
`jumpReach`, lines 100-112), `rootsAndReaches` (lines 77-85) yields exactly **one**
positive-root candidate, and that candidate's `reach` is, by construction, the same value
used as `theoreticalMaxReach` in `canReach` (lines 160-167: `Math.max` over the same two
roots). So whenever such a hop is feasible at all, `marginRatio = reach /
theoreticalMaxReach` evaluates to `1.0` — there is no way for a flat/downward hop to ever
land below the `WARN_MARGIN_RATIO = 0.9` threshold (line 40) and be reported `PASS`; it is
either `WARN` or has no edge at all. Verified empirically:
```
$ node scripts/validate-levels.mjs | grep -E "gap-width|spawn-goal"
level-01 | gap-width | WARN | gap 560..720 ... (marginRatio=1.000)
level-01 | gap-width | WARN | gap 1200..1360 ... (marginRatio=1.000)
level-02 | gap-width | WARN | gap 520..700 ... (marginRatio=1.000)
... [every gap-width/spawn-goal WARN row across all 4 levels prints marginRatio=1.000]
```
Every single flat/downward WARN row in the whole level set prints the identical
`1.000` — the tier cannot distinguish "this 400px gap is trivially easy" from "this 170px
gap is nearly the calibrated max." `23-FINDINGS.md` already documents this exact behavior
as a known, out-of-scope-for-this-plan limitation, and my independent re-derivation of the
quadratic math confirms that characterization is accurate — this is not a new regression.
It is filed as a WARNING (not BLOCKER) because it's a known, explicitly-deferred design
gap rather than a silent one, but it should be fixed before the WARN tier is relied on for
anything beyond "PASS vs. no-path," and the limitation should be documented **in this file's
own comments**, not only in planning artifacts external to the shipped code — a future
maintainer reading `canReach`'s docstring (lines 114-123) alone would not learn this.

**Fix:** Either (a) add an explicit code comment at `canReach`'s marginRatio computation
noting the flat/downward degenerate case, or (b) compute a real tightness ratio using the
*required* distance (`spanMin`/`spanMax`) against the reachable range instead of the fixed
single-candidate reach, e.g. `marginRatio = spanMin / theoreticalMaxReach` (so a small
required gap yields a small ratio, and a gap near the calibrated ceiling yields near `1.0`).

### WR-02: `checkLevelReachability`'s goal lookup omits `y`, silently depending on node-array ordering to disambiguate from an overlapping platform

**File:** `scripts/lib/reachability.mjs:283`
**Issue:** `const goalNode = goalX !== undefined ? nodeContaining(nodes, goalX) : undefined;`
does not pass `geometry.goal.y`. `nodeContaining`'s own docstring (lines 63-67) states the
`y` parameter exists specifically to "disambiguate an overlapping floor/platform pair at
the same x" — exactly the scenario a goal-on-an-elevated-platform level design would
create. This currently "works" only because `buildNodes` (lines 52-61) always pushes floor
nodes before platform nodes, so `Array.prototype.find` (used inside `nodeContaining`)
happens to return the floor node first whenever one exists at that x — and every shipped
level places its goal on a floor run. If a future level places its goal on a platform that
overlaps a floor run's x-range (a plausible, intentional design — "reach the platform to
win"), this lookup would silently resolve to the wrong node (the floor, not the platform),
producing an incorrect (and unverifiable-by-inspection) spawn-goal verdict.

**Fix:**
```js
const goalNode = goalX !== undefined ? nodeContaining(nodes, goalX, geometry.goal.y) : undefined;
```

### WR-03: Security-relevant static-server + path-traversal guard is duplicated verbatim across multiple scripts

**File:** `scripts/audit-phase21-mechanics.mjs:27-116`, `scripts/calibrate-jump-envelope.mjs:27-99`
**Issue:** Both files (and, per their own comments, `scripts/browser-boot.mjs`) contain a
byte-for-byte copy of `resolvePlaywright()`, the `FALLBACK_PLAYWRIGHT_PATH` constant, and
the local HTTP static server including its CR-02 path-traversal guard and loopback-only
`listen("127.0.0.1")` bind. The guard logic itself is correct in both copies reviewed here,
but duplicating a security control across 3+ files means any future fix to the guard (e.g.
a newly-discovered traversal edge case) must be applied identically everywhere by hand —
a single missed copy reintroduces the vulnerability in that script only, with no automated
way to detect the drift. The project's own comments acknowledge this is a deliberate
"copy verbatim, do not simplify" convention, so this is filed as a WARNING for
maintainability/security-hygiene rather than a live vulnerability.

**Fix:** Extract the shared server/guard/`resolvePlaywright` logic into one small shared
module (e.g. `scripts/lib/dev-server.mjs`) that all Playwright-driving scripts import,
so a future guard fix only needs to land in one place.

## Info

### IN-01: `audit-retry.mjs`'s warmup condition is broader than `mechanic-drive.mjs`'s documented invariant, and the doc comment is now stale

**File:** `scripts/lib/audit-retry.mjs:78`
**Issue:** `mechanic-drive.mjs` documents `warmupUntilFirstGap` as intended "only for the
very first encounter of each level" (mechanic-drive.mjs comment, not in this file's diff
but consumed here). `audit-retry.mjs` instead applies it to **every** encounter whose `x`
is less than the first floor's end (`encounter.x < firstFloorEnd`, line 78). This is
currently safe (both level-03 and level-04 have *two* encounters — a collect zone and a
math-gate — before their first real gap, and applying the warmup to both is harmless/
correct since it only suppresses jumping on gap-free ground), but it silently generalizes
past the single-encounter invariant the sibling module's comments describe, without
updating those comments. A future reader relying on the "only the first encounter" claim
to reason about behavior would be misled.
**Fix:** Update `mechanic-drive.mjs`'s docstring (or add a comment here) to describe the
actual, broader "any encounter before the first genuine gap" semantics.

### IN-02: `reachedX` is always `null` in the printed audit output — a dead field

**File:** `scripts/audit-phase21-mechanics.mjs:174-190`
**Issue:** Each result pushed to `results` hardcodes `reachedX: null` (line 186) because
`auditLevelWithRetries` doesn't surface the underlying `driveToXClimbing` return value's
`reachedX`. The comment at lines 174-179 acknowledges this is intentional, but the field
still appears in every printed JSON row with zero information content, which is confusing
for anyone reading the diagnostic output later (e.g. while triaging a failure) and expecting
it to mean something.
**Fix:** Either drop the field from the output shape, or have `auditLevelWithRetries`
carry the last-observed `reachedX` through in its returned outcome so the field is
meaningful again.

### IN-03: `--fixture` with a missing path argument silently falls back to validating all real levels

**File:** `scripts/validate-levels.mjs:38-42`
**Issue:** `parseFixturePath` returns `argv[idx + 1] ?? null`; if `--fixture` is the last
argv token (a plausible typo, e.g. a forgotten path), `buildDescriptors(null)` treats this
identically to "no `--fixture` flag at all" and validates the full `LEVEL_ORDER` instead of
raising a usage error. A user expecting fixture-only output would get a confusing full-level
report with no indication their flag was ignored.
**Fix:** Distinguish "flag absent" from "flag present but missing its value" and throw/print
a usage error for the latter.

### IN-04: No top-level error handling around `await main()` — an invalid `--fixture` path crashes with a raw stack trace

**File:** `scripts/validate-levels.mjs:90`
**Issue:** `await main();` at module top level has no surrounding `try/catch`. If
`--fixture <path>` points at a nonexistent file, `import(pathToFileURL(resolve(fixturePath)).href)`
(line 47) throws, producing an unhandled-rejection stack trace rather than the clean,
single-line error messages this script uses elsewhere (e.g. line 50's thrown `Error` for a
fixture with no `.geometry` export).
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

_Reviewed: 2026-07-06T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
