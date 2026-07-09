# Phase 24 Findings — Fix & Lengthen Levels 1–4

Evidence artifact for Phase 24 (VALID-04, LVL-01). Cross-referenced from `22-FINDINGS.md` and `23-FINDINGS.md` (historical record — not rewritten).

## (a) Over-hole gate fixes — before/after validator evidence

| Level | Gate | Before | After | Evidence |
|---|---|---|---|---|
| level-01 | mathGates[0] | x:600 (over-hole) | x:528 → **re-repositioned to x:150** (see Traversal-Trap Correction below) | `validate-levels.mjs`: level-01 over-hole PASS |
| level-01 | mathGates[1] | x:1300 (over-hole) | x:1360 | `validate-levels.mjs`: level-01 over-hole PASS |
| level-04 | mathGates[0] | x:1800 (over-hole) | x:1728 → **re-repositioned to x:1300** (see Traversal-Trap Correction below) | `validate-levels.mjs`: level-04 zero HARD-FAIL rows (down from 5 named: over-hole x1800, spawn-goal, gap-width 1760..1960, mechanic-reachability x1800, mechanic-reachability enemy x2400) |

## (b) Unreachable-platform fixes — before/after evidence

| Level | Platforms (x) | Rise before | Rise after | Proof |
|---|---|---|---|---|
| level-03 | x:1880, x:2640 | 128–136px | 60px (y raised to 260) | direct `bfsReachableSet` query, both spawn-reachable |
| level-04 | x:1080, x:1400, x:1760, x:2140, x:2520, x:3240 | 104–144px | 70px (y set to 250) | direct `bfsReachableSet` query, all 6 spawn-reachable |

8 platforms total fixed (2 + 6), all against `scripts/lib/jump-envelope.mjs`'s calibrated `maxRise=88.331`. `node scripts/validate-levels.mjs` shows zero HARD-FAIL rows for level-03 and level-04 both after the fix pass and after the extension pass.

## (c) Per-level extension rationale

| Level | Length change | New mechanic instances | Reuses |
|---|---|---|---|
| level-01 | 2240px → 3640px (+1400px / 62.5%) | +1 mathGate (x:3120), +1 spike (x:2640) | existing types only |
| level-02 | 2800px → 4280px (+1480px / 52.9%) | +1 mathGate (x:3760), +1 spike (x:3200) | existing types only |
| level-03 | pre-ext → +52.9% | +1 enemy (x:3800), +1 mathGate (x:4360), +2 spikes | existing types only |
| level-04 | pre-ext → +55% | +1 door (x:5000), +1 mathGate (x:5760), +2 spikes | existing types only |

Per 24-RESEARCH.md's Open Question 1: at least one new instance of an existing mechanic type per level, for audit coverage, without introducing new mechanic variety. All new geometry appended strictly after existing kid-validated content — zero edits inside the original spans.

## Traversal-Trap Correction (post-Wave-3 fix, not in original Wave 1/2 plans)

The Wave 1 "reposition to nearest solid floor edge" strategy placed level-01's gate at x:528 and level-04's gate at x:1728 — both structurally valid per `validate-levels.mjs` (fully inside their floor run, off the over-hole gap) but each sitting at the very edge of its floor run, immediately before a gap-crossing platform. This left a forward-only bot (and, in principle, a player who resolves the challenge mid-stride) with no runway to execute the platform hop right after the challenge closes — a genuine traversal trap uncovered only by the interactive audit, not the structural validator (whose BFS reachability model doesn't simulate mechanic-in-the-way sequencing).

Fix: re-repositioned mid-floor — level-01 x:528 → x:150, level-04 x:1728 → x:1300 — both comfortably inside their floor run, well before the respective gap-crossing platform. `validate-levels.mjs` and `smoke-progress.mjs` re-confirmed PASS after the change (smoke's geometry pins re-baselined a second time to match).

## Audit Driver Rebuild (root-cause fix, not in original Wave 1/2 plans)

The interactive audit (`scripts/audit-phase21-mechanics.mjs`) initially failed to complete at all against the lengthened levels — misdiagnosed at first as a hardware/GPU/headless-Chromium stability issue (uncaught `browserContext.close`/`keyboard.up` "has been closed" exceptions, preceded by `GPU stall due to ReadPixels` warnings). Root-caused instead to the audit's own driver (`driveToXClimbing`, "press Space whenever grounded"):

1. It bunny-hopped over ground-level checkpoint markers, so a later fall-death respawned at the level **start** instead of the nearest checkpoint, turning one missed jump into a near-infinite loop.
2. Its fixed poll/hold cadence made marginal jumps fail **deterministically** (not the stochastic flakiness the retry wrapper was built to average out), so 5 retries just quintupled wasted time on a guaranteed failure.
3. The resulting stuck encounters pushed wall-clock past the caller's `timeout`, whose SIGTERM fired Playwright's own shutdown handler mid-call — the misleading "has been closed" errors.

Replaced with `scripts/lib/route-planner.mjs` (new) + `driveToXPlanned` (new, in `mechanic-drive.mjs`): walks by default (checkpoints/zones/gates register naturally) and jumps only at takeoffs planned from the same `reachability.mjs` feasibility graph the structural validator uses, via measured in-engine physics (in-page 8ms arc sampling: effective airborne speed ≈210px/s, not CONFIG's 240; full-jump range ≈156px). Also fixed: `resolveIfBoxed` gained a settle re-check for late challenge teardown; `audit-retry.mjs` now retries **resolution** (not just triggering) on subsequent attempts, since the original skip condition discarded that chance entirely; a needless jump on flat/descending gaps (when fall momentum alone clears the span) was removed after it was found to sail over the level-03 x:740 checkpoint.

## (d) Interactive audit results (final run)

Per CONTEXT.md's locked acceptance bar: **triggered:true is the non-negotiable gate; resolved:true is the goal but not blocking** (documented resolution-timing flakiness, not a Phase 24 regression).

- **22/22 encounters triggered:true** across all 4 lengthened levels (exceeds the pre-Phase-24 16-encounter baseline — confirms the new mechanic instances from (c) are present and exercised).
- **20/22 resolved:true** (or `null` by design for the 3 answer-zone/collect-zone encounters, which have no key-input resolution step).
- **2 rows resolved:false**, both named explicitly:
  - `level-03 | enemy | x:2400 | attempts: 5`
  - `level-04 | enemy | x:2400 | attempts: 5`

  These two are a genuine, narrower open item: `enemy@2400` on both levels shares the same x — likely a deeper, still-unisolated reachability/timing interaction further along each level's route (confirmed NOT the checkpoint-skip bug fixed above; both levels now correctly reach and pass their nearer checkpoints before this point). Left as a documented follow-up rather than pursued further this phase, consistent with 22/23-FINDINGS.md's own precedent of naming resolution-timing flakiness rather than blocking on it.

Zero `triggered:false` rows — the phase's hard requirement is met.

## (e) Final regression suite

```
node scripts/validate-levels.mjs   -> validate-levels: PASS (zero HARD-FAIL rows, all 4 levels)
node scripts/smoke-progress.mjs    -> smoke-progress: PASS
node scripts/lib/reachability.mjs  -> reachability-selftest: PASS
node scripts/lib/route-planner.mjs -> route-planner-selftest: PASS
```

All four green on the final commit of this phase.
