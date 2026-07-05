# Phase 23: Level Validation Harness — Findings

This is the first write to this file (Plan 23-02, Wave 1). Plan 23-05 (Wave 3) later
APPENDS its own RED-first-proof section to this same file — it never overwrites this
section.

## Interactive Audit Retry Harness (VALID-03 groundwork)

**Requirement:** VALID-02/VALID-03 groundwork — shrink the interactive mechanic-drive
audit's 6/16 encounter blind spot with a bounded (3-5 attempt), OR-across-attempts retry
strategy, without touching `scripts/lib/mechanic-drive.mjs` or `scripts/browser-boot.mjs`.

**Method:** `scripts/lib/audit-retry.mjs`'s `auditLevelWithRetries(page, level, { maxAttempts: 5, reloadLevel })`
composes `mechanic-drive.mjs`'s unmodified `deriveEncounters`/`driveToXClimbing`/`resolveIfBoxed`
exports. `scripts/audit-phase21-mechanics.mjs` was upgraded in place to drive each of the
4 levels through this wrapper instead of a single pass, supplying a `reloadLevel` callback
that re-enters the level fresh (Escape -> reposition select cursor -> Enter) before every
retry attempt after the first. An encounter already recorded as `triggered: true` from an
earlier attempt within the same run is never re-driven (cost guard, 23-RESEARCH.md Pitfall
5) and the attempts loop exits early once every encounter in a level has been triggered at
least once.

### Real run against the untouched levels 1-4 (2026-07-05, port 8768)

`node scripts/audit-phase21-mechanics.mjs` exited 0 (this script is a diagnostic tool that
always exits 0 — the JSON `results` array + the final `AUDIT:` line are what's interpreted
here, not the process exit code). Final per-encounter results table, sourced directly from
this run's own printed JSON `results` array:

| Level | Mechanic | x | Triggered | Resolved | Attempts |
|-------|----------|---|-----------|----------|----------|
| level-01 | answer-zone | 300 | true | null (by design) | 1 |
| level-01 | math-gate | 600 | true | true | 1 |
| level-01 | enemy | 1000 | true | true | 1 |
| level-01 | math-gate | 1300 | true | true | 2 |
| level-01 | door | 1400 | true | false | 1 |
| level-02 | math-gate | 420 | true | true | 1 |
| level-02 | math-gate | 1100 | true | true | 2 |
| level-02 | door | 1540 | true | true | 2 |
| level-03 | answer-zone | 200 | true | null (by design) | 1 |
| level-03 | math-gate | 420 | true | true | 1 |
| level-03 | enemy | 2400 | true | false | 2 |
| level-04 | answer-zone | 160 | true | null (by design) | 1 |
| level-04 | math-gate | 320 | true | true | 1 |
| level-04 | door | 900 | true | false | 2 |
| level-04 | math-gate | 1800 | true | true | 1 |
| level-04 | enemy | 2400 | true | false | 2 |

**16/16 triggered.** Every encounter that needed a retry converged by attempt 2 — no
encounter in this run consumed more than 2 of the 5 available attempts.

### Timing-sensitive rows (22-FINDINGS.md Baseline) — all now reliably triggered

22-FINDINGS.md's Baseline section documented 3 rows that flip between triggered/unreached
across identical-code single-pass runs ("timing-sensitive," distinct from the 5 stable-
always-unreached rows):

| Row | Baseline behavior (single pass) | This run (retry harness) |
|-----|----------------------------------|---------------------------|
| level-01 math-gate x1300 | flips true/false across runs | **triggered: true** (attempt 2) |
| level-01 door x1400 | flips true/false across runs | **triggered: true** (attempt 1) |
| level-03 math-gate x420 | flips true/false across runs | **triggered: true** (attempt 1) |

All 3 previously-flaky rows register as triggered in this run. The retry harness's own
design (OR-across-attempts, an encounter counts as reached if ANY attempt reaches it)
is exactly what converts a single-pass coin-flip into a reliable positive: a row that was
only sometimes reached in one attempt is virtually certain to be reached in at least one
of up to 5 independent attempts, confirming 23-CONTEXT.md's hypothesis that these rows are
timing-sensitive (traversal-model flakiness), not fundamentally unreachable.

### Individually-documented exclusions (encounters still unreached after 5 attempts)

**None.** Zero encounters remain unreached after the retry budget — every one of the 16
encounters across levels 1-4 triggered within at most 2 of the 5 available attempts,
including the 5 rows 22-FINDINGS.md's Baseline had classified as "stable core —
always-unreached" (level-02 math-gate x1100, level-02 door x1540, level-03 enemy x2400,
level-04 math-gate x1800, level-04 enemy x2400) and the 3 timing-sensitive rows above. This
is a full closure of the previously-documented 6/16 blind spot on levels 1-4 (not merely a
shrink) — 23-CONTEXT.md's stated bar for this phase was "shrink (not close)" the blind
spot, so this result exceeds the phase's own success criterion. Full 8-level closure
(levels 5-8, once they exist) remains Phase 28's job (VALID-03 final close), per
23-CONTEXT.md's explicit scope boundary.

### Reached-encounter count: before vs. after

- **22-FINDINGS.md Baseline (single-pass, no retries):** 10/16 triggered (Run 1); up to
  11/16 after Phase 22's Cluster A fixes (per 22-FINDINGS.md's regression-diff section) —
  6/16, later 5/16, encounters unreached.
- **This run (bounded 5-attempt OR-across-attempts retry harness, real untouched levels
  1-4, 2026-07-05):** **16/16 triggered** — the retry harness reaches every previously
  problematic row (both the stable-unreached and the timing-sensitive rows) within its
  5-attempt budget, with the slowest row still converging by attempt 2.

### Secondary observation: 4 rows triggered but not resolved this run (out of VALID-03's scope, noted for completeness)

4 rows this run show `triggered: true, resolved: false`: level-01 door x1400, level-03
enemy x2400, level-04 door x900, level-04 enemy x2400 (all `renderChoices:true`
door/enemy mechanics whose answer-box challenge opened but `resolveIfBoxed`'s 1-4 key
cycle did not detect it closing within this run's 4-press cycle). This is a **direct,
documented consequence of the retry wrapper's own cost-guard design** (23-RESEARCH.md
Pitfall 5, implemented in `scripts/lib/audit-retry.mjs`): once an encounter is recorded
`triggered: true` on some attempt, it is never re-driven on a later attempt — so if that
same triggering attempt's `resolveIfBoxed` call happens to fail to detect closure (a
known source of run-to-run flakiness independent of reachability, per
`mechanic-drive.mjs`'s own CR-01 baseline-decrease comments), the harness has no further
chance to re-resolve it within this run. This is a *resolution*-flakiness question, not a
*reachability* one — VALID-03's scope (and this plan's `must_haves`) is specifically about
shrinking the unreached-encounter blind spot, which this run closes completely (16/16
triggered). Re-running the script a second time (informal spot-check, not part of this
plan's committed evidence) reached and resolved a different subset of these same 4 rows,
confirming this is the SAME class of run-to-run resolve-timing flakiness already
documented for reachability in 22-FINDINGS.md, now surfacing on the resolve step instead —
left as a documented observation for Phase 28's final closure work, not fixed in this plan
(would require extending the retry semantics to cover post-trigger resolution separately,
a design change outside this plan's `must_haves`).

### Files verified unchanged

`git diff --quiet -- scripts/lib/mechanic-drive.mjs scripts/browser-boot.mjs` exits 0 —
both files remain byte-identical to their pre-plan state. The retry upgrade is isolated to
the new `scripts/lib/audit-retry.mjs` module and the caller script
`scripts/audit-phase21-mechanics.mjs`.
