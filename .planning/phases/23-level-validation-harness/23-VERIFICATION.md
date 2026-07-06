---
phase: 23-level-validation-harness
verified: 2026-07-06T04:00:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 23: Level Validation Harness Verification Report

**Phase Goal:** Structural level mistakes can't ship silently — every level edit is machine-gated from here on, before any new level is authored
**Verified:** 2026-07-06T04:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `node scripts/validate-levels.mjs` checks spawn→goal reachability, gap widths vs jump envelope, door-over-hole, and mechanic reachability on every registered level, exiting non-zero on failure | ✓ VERIFIED | Independently ran `node scripts/validate-levels.mjs` — exit code 1, all four check kinds (`over-hole`, `spawn-goal`, `gap-width`, `mechanic-reachability`) printed for all 4 `LEVEL_ORDER` entries, `validate-levels: FAIL — 9 hard-failure(s) across 4 level(s)`. |
| 2 | Validator's jump envelope comes from a one-time empirical measurement against the running engine (not closed-form theory), with a recorded safety margin | ✓ VERIFIED | `scripts/calibrate-jump-envelope.mjs` binds `127.0.0.1` and launches Playwright (verbatim `browser-boot.mjs` pattern) — never used by the routine validator (grepped `playwright/chromium/firefox/webkit` across `validate-levels.mjs`, `reachability.mjs`, `over-hole-check.mjs`, `jump-envelope.mjs` — zero matches). `scripts/lib/jump-envelope.mjs` exports `JUMP_ENVELOPE = {maxRise:88.331, runSpeed:218.043, marginPct:0.05, raw:{...12 standing + 12 running trials...}}` — confirmed by direct `import()`; margin is `min-trial × 0.95`, documented and non-zero. |
| 3 | Run against the untouched levels 1–4, the validator flags both known live bugs (door-over-hole, unreachable areas) — proven RED before it is trusted as a gate | ✓ VERIFIED | Own run reproduces the exact corrected 9-hard-failure output in `23-FINDINGS.md`'s "Post-Plan Correction" section: level-01 mathGate x600/x1300 HARD-FAIL, level-04 mathGate x1800 HARD-FAIL, plus level-04's downstream disconnection cluster (gap 1760..1960, enemy x2400, spawn-goal). Level-02 (previously falsely flagged pre-fix) now shows zero HARD-FAILs, matching the documented `canReach` overlap-span bugfix (commit `de093aa`). `git diff --quiet 5eedee87 -- src/levels/*.js` exits 0 — zero level-descriptor edits confirmed independently. |
| 4 | The interactive mechanic-drive harness reaches encounters previously excluded on levels 1–4, shrinking the 6/16 blind spot, with every remaining exclusion individually documented | ✓ VERIFIED | Independently ran `node scripts/audit-phase21-mechanics.mjs` to completion (uninterrupted background run) — own JSON output shows **16/16 `triggered: true`**, matching `23-FINDINGS.md`'s documented full closure (exceeds the phase's own "shrink, not close" bar). Zero exclusions needed (own run confirms). `git diff --quiet` against baseline for `scripts/lib/mechanic-drive.mjs` and `scripts/browser-boot.mjs` exits 0 — both byte-identical, confirming isolation claim. |

**Score:** 4/4 roadmap truths verified, 0 present-but-behavior-unverified.

### PLAN-Level Must-Haves (merged, deduplicated against roadmap truths above)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | `checkLevelReachability` models jump edges with a Δy-aware quadratic, consuming `JUMP_ENVELOPE` rather than a closed-form formula; BFS supports multi-hop chains | ✓ VERIFIED | `scripts/lib/reachability.mjs:34` imports `JUMP_ENVELOPE` from `./jump-envelope.mjs`; `jumpReach(dy, envelope)` (line 112) implements the quadratic; `bfsReachableSet` docstring (line 232) states "Supports multi-hop chains"; self-test Case 4 (line 464) explicitly exercises a 3-node chain. `node scripts/lib/reachability.mjs` → `reachability-selftest: PASS`. |
| 6 | A hop using more than 90% of the calibrated envelope reports WARN, not a silent PASS or false HARD-FAIL | ✓ VERIFIED | `export const WARN_MARGIN_RATIO = 0.9` (line 40); status assignment at lines 327/352 gates on `>= WARN_MARGIN_RATIO`. Live validator output shows numerous `WARN | ... (marginRatio=1.000)` rows, never silently collapsed to PASS. |
| 7 | `findOverHoleBarriers(geometry)` returns a row for every door/mathGate/enemy whose footprint is not fully covered by any floor run, and `[]` for a fully-supported level; `bad-level.js` proves both an over-hole and unreachable-platform HARD-FAIL | ✓ VERIFIED | `node scripts/lib/over-hole-check.mjs` → `over-hole-check-selftest: PASS`. `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js` → exit 1, 4 HARD-FAIL rows including `over-hole` (mathGate 380..412) and `spawn-goal`/`gap-width` (unreachable platform), confirmed independently. |
| 8 | The interactive audit reruns each still-unreached encounter up to 5 times (OR-across-attempts); `audit-retry.mjs` composes `mechanic-drive.mjs`'s unmodified exports | ✓ VERIFIED | `scripts/lib/audit-retry.mjs:54` — `export async function auditLevelWithRetries(page, level, { maxAttempts = 5, reloadLevel })`. Own independent run's JSON confirms `attempts` values of 1–2 (never exceeding the 5-attempt budget) and OR-semantics (e.g. level-01 math-gate x1300 triggered on attempt 2). | 

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/calibrate-jump-envelope.mjs` | Playwright probe, binds 127.0.0.1 | ✓ VERIFIED | Present, contains `127.0.0.1` (line 101), no exports (standalone), reuses `resolvePlaywright()` verbatim per header comment. |
| `scripts/lib/jump-envelope.mjs` | Frozen `JUMP_ENVELOPE` constant | ✓ VERIFIED | Exports `JUMP_ENVELOPE` with raw trial arrays documented in header; confirmed via `import()`. |
| `scripts/lib/audit-retry.mjs` | `auditLevelWithRetries` export | ✓ VERIFIED | Exported, imported and called by `audit-phase21-mechanics.mjs:169`. |
| `.planning/phases/23-level-validation-harness/23-FINDINGS.md` | Retry-harness + RED-first proof evidence | ✓ VERIFIED | Both sections present (`## Interactive Audit Retry Harness`, `## RED-First Proof`), plus a transparent `## Post-Plan Correction` section documenting the overlap-span bugfix. |
| `scripts/lib/over-hole-check.mjs` | `findOverHoleBarriers` export | ✓ VERIFIED | Exported, self-test passes, wired into `validate-levels.mjs`. |
| `scripts/fixtures/bad-level.js` | `BAD_LEVEL` synthetic fixture | ✓ VERIFIED | Exported, consumable via `--fixture` flag, independently confirmed RED. |
| `scripts/lib/reachability.mjs` | `checkLevelReachability` + primitives | ✓ VERIFIED | All named exports present (`buildNodes`, `nodeContaining`, `jumpReach`, `canReach`, `buildGraph`, `bfsReachableSet`, `checkLevelReachability`, `WARN_MARGIN_RATIO`). Self-test passes. |
| `scripts/validate-levels.mjs` | Standalone CLI orchestrator | ✓ VERIFIED | Composes both modules, supports `--fixture`, exits non-zero on HARD-FAIL, never wired into `check-gate.sh` (confirmed via grep, matching the locked design decision). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `scripts/lib/jump-envelope.mjs` | `scripts/calibrate-jump-envelope.mjs` | frozen constant's raw trial arrays sourced from probe's printed output | ✓ WIRED | Header comment documents the trial provenance; values are internally consistent (`maxRise` = `min(standing trials) × (1 − marginPct)` = `92.98 × 0.95` = `88.331`). |
| `scripts/audit-phase21-mechanics.mjs` | `scripts/lib/audit-retry.mjs` | imports and calls `auditLevelWithRetries` once per level | ✓ WIRED | `import { auditLevelWithRetries } from "./lib/audit-retry.mjs"` (line 32); called at line 169. |
| `scripts/validate-levels.mjs` | `scripts/lib/over-hole-check.mjs` | imports and calls `findOverHoleBarriers` once per level | ✓ WIRED | Line 34 import, line 64 call, confirmed by live output. |
| `scripts/validate-levels.mjs` | `scripts/lib/reachability.mjs` | imports and calls `checkLevelReachability` once per level | ✓ WIRED | Line 35 import, line 76 call, confirmed by live output. |
| `scripts/lib/reachability.mjs` | `scripts/lib/jump-envelope.mjs` | imports calibrated `JUMP_ENVELOPE` instead of re-deriving closed-form cutoff | ✓ WIRED | Line 34: `import { JUMP_ENVELOPE } from './jump-envelope.mjs'`. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Validator gates real levels | `node scripts/validate-levels.mjs` | exit 1, 9 HARD-FAILs, all 3 known over-hole defects named | ✓ PASS |
| Validator gates synthetic fixture | `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js` | exit 1, 4 HARD-FAILs | ✓ PASS |
| over-hole-check self-test | `node scripts/lib/over-hole-check.mjs` | `over-hole-check-selftest: PASS` | ✓ PASS |
| reachability self-test | `node scripts/lib/reachability.mjs` | `reachability-selftest: PASS` | ✓ PASS |
| Interactive audit (real Playwright run, uninterrupted) | `node scripts/audit-phase21-mechanics.mjs` | 16/16 `triggered: true`; `AUDIT: FAILURES DETECTED` (3 `resolved: false` rows this run) | ✓ PASS (see Orchestrator Context Assessment below) |
| Overlap-span regression fix | `git show de093aa` diff + level-02 re-run | level-02 HARD-FAIL count 4 → 0, other levels unaffected | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|-------------|--------|----------|
| VALID-01 | 23-03, 23-04, 23-05 | Static validator checks reachability/gap-width/over-hole/mechanic-reachability, exits non-zero | ✓ SATISFIED | `validate-levels.mjs` runs all 4 checks, exits 1 on real levels and on fixture. |
| VALID-02 | 23-01, 23-02, 23-05 | Validator calibrated against real engine physics, proven by catching known live bugs | ✓ SATISFIED | `jump-envelope.mjs` empirically calibrated (Playwright probe); RED-first proof independently reproduced (9 HARD-FAILs, 3 known defects named exactly). |

No orphaned requirements — `REQUIREMENTS.md`'s traceability table maps only VALID-01/VALID-02 to Phase 23, both already marked `[x]` complete, and both are backed by real, re-executed evidence (not merely the checklist mark).

### Anti-Patterns Found

None. Scanned all 8 phase-modified/created files (`scripts/calibrate-jump-envelope.mjs`, `scripts/lib/jump-envelope.mjs`, `scripts/lib/audit-retry.mjs`, `scripts/audit-phase21-mechanics.mjs`, `scripts/lib/over-hole-check.mjs`, `scripts/fixtures/bad-level.js`, `scripts/lib/reachability.mjs`, `scripts/validate-levels.mjs`) for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — zero matches. No debt markers.

**Code review findings (23-REVIEW.md / 23-REVIEW-FIX.md):** 3 Critical false-negative bugs (CR-01, CR-02, CR-03) found in iteration 1, all fixed and independently re-verified by a second review pass — re-confirmed here by re-running `node scripts/validate-levels.mjs` (still 9 HARD-FAILs, same 3 known defects) and both self-tests (still PASS). 2 Warnings (WR-01 docs-only, WR-02 logic fix) fixed and re-verified. WR-03 (duplicated Playwright server/guard code across `browser-boot.mjs`/`audit-phase21-mechanics.mjs`/`calibrate-jump-envelope.mjs`) was deliberately left unfixed — the source carries an explicit "Do not simplify or rewrite either guard" directive, and the canonical file (`browser-boot.mjs`) sits outside this phase's review scope. This is a reasoned, documented, twice-confirmed skip — not a gap; correctly filed as a low-severity maintainability item, not a live vulnerability (guard logic itself verified correct and byte-identical in both copies). 4 Info-level findings (IN-01..04) are cosmetic/edge-case (stale docstring, dead field, missing usage-error message, missing top-level try/catch) — none affect VALID-01/VALID-02 correctness.

### Orchestrator Context Assessment

**1. `canReach` overlap-span bugfix (commits de093aa, 77fd9f9):** Independently re-verified. Re-ran `node scripts/validate-levels.mjs` myself — level-02 shows zero HARD-FAILs (confirming the fix holds), while the 3 known real over-hole defects (level-01 x600/x1300, level-04 x1800) plus level-04's downstream disconnection cluster (all genuinely caused by the x1800 over-hole, per `23-FINDINGS.md`'s node-level BFS re-check) still correctly HARD-FAIL. Diff of commit `de093aa` confirms the fix (`spanMax` now the real overlap width, not pinned to 0) and a new regression self-test (Case 3b) was added. Real, correct fix.

**2. Code review CR-01/02/03 + WR-01/02 fixes:** Independently re-verified as above — all 5 commits exist, the described logic changes are present in the current source, and re-running the validator/self-tests reproduces the claimed post-fix output exactly. WR-03's skip rationale is sound: an explicit in-code "do not simplify" directive exists, the canonical source is out of scope, and the guard logic itself is correct — this does not block phase completion.

**3. Interactive audit resolve-timing non-determinism:** Independently reproduced. Ran `node scripts/audit-phase21-mechanics.mjs` to completion (uninterrupted, in background to avoid truncating a legitimately slow ~2-3 minute Playwright run) — own JSON output: **16/16 `triggered: true`**, with 3 rows `resolved: false` this run (level-01 door x1400, level-03 enemy x2400, level-04 door x900) — a different specific subset than the 4-row set documented in `23-FINDINGS.md`'s own run, consistent with the orchestrator's observation of "different specific rows each run." Confirmed via `git blame` that `process.exit(0)` (line 224, the script's unconditional-exit behavior) originates from commit `dd037d3` (Phase 21, 2026-07-04) — predates Phase 23 entirely, unchanged. **Assessment: non-blocking for this phase's goal.** Reasoning: (a) VALID-03 (full 8-level interactive closure) is explicitly NOT a Phase 23 requirement — REQUIREMENTS.md traceability maps it to Phase 28, with Phase 23 only owning "groundwork"; (b) Roadmap Success Criterion 4 for Phase 23 is scoped to *reachability* ("reaches encounters previously excluded... shrinking the blind spot"), not *resolution* — the metric it names (triggered) is 16/16 in both the documented run and my independent re-run; (c) `23-FINDINGS.md` itself already documents this exact resolve-timing flakiness as "a *resolution*-flakiness question, not a *reachability* one," explicitly out of this plan's `must_haves` and left for Phase 28; (d) this is consistent with pre-existing, already-documented non-determinism from Phase 21/22 (`resolveIfBoxed`'s answer-key-press timing), not a new defect introduced by Phase 23's retry wrapper. No gap filed.

**Note on my own verification process:** My first attempt to run `audit-phase21-mechanics.mjs` was killed by an external `timeout` wrapper mid-run (at ~150s, while a `keyboard.up` Playwright call was in flight), producing an unhandled-rejection crash trace — this was an artifact of my own harness's timeout interrupting a legitimately slow script, not a phase defect. Re-running uninterrupted (backgrounded, no external timeout) completed cleanly with the expected always-`process.exit(0)` behavior and 16/16 triggered results reported above.

### Human Verification Required

None. All roadmap Success Criteria and PLAN must-haves are backed by directly re-executed evidence (validator runs, self-tests, fixture runs, interactive audit run, git diffs of commits) rather than SUMMARY.md narrative alone. No visual, real-time-feel, or external-service-dependent behavior is in scope for this backend-tooling phase.

### Gaps Summary

No gaps. All 4 roadmap Success Criteria and all PLAN-level must-haves for VALID-01/VALID-02 are independently verified against live code execution, not merely asserted. The two items surfaced by the orchestrator (the `canReach` overlap bugfix and the code-review Critical fixes) were both independently re-derived and confirmed correct. The third item (audit resolve-timing flakiness) was independently reproduced and assessed as a pre-existing, explicitly out-of-scope, non-blocking characteristic — correctly documented rather than silently ignored.

---

_Verified: 2026-07-06T04:00:00Z_
_Verifier: Claude (gsd-verifier)_
