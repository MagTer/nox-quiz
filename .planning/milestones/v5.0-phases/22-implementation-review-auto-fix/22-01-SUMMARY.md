---
phase: 22-implementation-review-auto-fix
plan: 01
subsystem: testing
tags: [bash, sigpipe, pipefail, playwright, regression-baseline, kaplay]

# Dependency graph
requires:
  - phase: 21-real-verification-pass (v4.1)
    provides: check-gate.sh flake diagnosis (deferred-items.md, commit 32348f5), 21-FINDINGS.md template, audit/boot scripts
provides:
  - Deterministic scripts/check-gate.sh (SIGPIPE race fixed; 20/20 consecutive green runs)
  - 22-FINDINGS.md (FIX-01 evidence artifact) with all 6 sections scaffolded
  - Pre-fix full-suite baseline on unmodified src//lib/ with machine-readable "Baseline commit:" anchor (5eedee870d314307a846bae254f61e7d1e0ef5f4)
  - Characterized audit nondeterminism: stable-core reached/unreached row sets + 3 timing-sensitive rows for Plan 22-05's regression diff
affects: [22-02, 22-03, 22-04, 22-05, 23-level-validation-harness]

# Tech tracking
tech-stack:
  added: []
  patterns: [read-to-EOF grep count form for pipefail-safe gate assertions, stable-core baseline comparison for nondeterministic interactive audits]

key-files:
  created:
    - .planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md
  modified:
    - scripts/check-gate.sh

key-decisions:
  - "Audit baseline is nondeterministic on 3 rows (L1 mg1300, L1 door1400, L3 mg420) — recorded Run 1 as canonical ground truth plus stable cores (5 always-unreached, 8 always-reached); Plan 22-05 must diff against the stable cores, not the naive 6-unreached expected shape"
  - "FIX-01 not marked complete at 22-01 — the requirement spans all five phase-22 plans; Plan 22-05 (which carries FIX-01+FIX-02) marks it"

patterns-established:
  - "Pipefail-safe gate assertion: [ \"$(strip_comments f | grep -c 'PATTERN')\" -gt 0 ] — grep reads stdin to EOF, upstream sed can never be SIGPIPEd"
  - "Baseline deviation discipline: record what was observed verbatim, flag deviations prominently, never normalize toward the expected shape"

requirements-completed: []  # FIX-01 spans plans 22-01..22-05; marked complete by 22-05

coverage:
  - id: D1
    description: "scripts/check-gate.sh is deterministic — 20 consecutive runs print 'gate checks: PASS' on a clean tree; all 14 quiet-mode pipelines converted to read-to-EOF count form with patterns, fail messages, and assertion order byte-preserved"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "for i in $(seq 1 20); do bash scripts/check-gate.sh; done + structural greps (0 quiet-mode flags, 21 fail sites, key patterns intact) → DEFLAKE-OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "22-FINDINGS.md skeleton with all 6 sections and the recorded pre-fix full-suite baseline (4 static gates + smoke + browser-boot + 16-row audit table) captured on byte-identical v4.1 game code, with machine-readable Baseline commit anchor"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "sed/grep verification suite from 22-01-PLAN.md Task 2 (40-hex anchor, 5 PASS lines, 24 pending verdict rows, 2 PENDING-DECISION entries, section headers) → SKELETON-OK"
        status: pass
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-07-05
status: complete
---

# Phase 22 Plan 01: Trustworthy Baseline Summary

**De-flaked check-gate.sh (SIGPIPE race → read-to-EOF count form, 20/20 green) and captured the pre-fix full-suite regression baseline into 22-FINDINGS.md on unmodified v4.1 game code, including a newly-characterized 3-row audit nondeterminism that later plans must diff around**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-05T15:03:57Z
- **Completed:** 2026-07-05T15:19:30Z
- **Tasks:** 2
- **Files modified:** 2 (1 script fixed, 1 evidence artifact created)

## Accomplishments

- `scripts/check-gate.sh` is now deterministic: all 14 `strip_comments`-fed pipelines (11 positive, 3 negative) converted from early-exit quiet-mode grep to `[ "$(… | grep -c 'PATTERN')" -gt 0 ]` count form. Every grep pattern, all 21 fail messages, assertion order, and `set -euo pipefail` preserved byte-identically. Also closes the latent false-GREEN race in negative assertions 6–8. Verified 20/20 consecutive green runs.
- `22-FINDINGS.md` created with all 6 CONTEXT-locked sections: Baseline, Findings scaffold, 24-row Per-Entity Verdict Table (all `pending`), Structural Defect Inventory placeholder, Escalation Candidates (2 pre-seeded PENDING-DECISION entries), Post-Fix Regression placeholder.
- Full-suite baseline recorded from real runs on byte-identical v4.1 `src/`/`lib/`: 4 static gates + smoke green (verbatim lines), browser-boot exit 0, 16-row interactive audit table sourced from the run's own JSON results. Machine-readable anchor: `Baseline commit: 5eedee870d314307a846bae254f61e7d1e0ef5f4`.
- **Audit nondeterminism characterized (new ground truth):** the observed baseline deviated from the expected 21-FINDINGS shape on 2 rows; a supplementary second run confirmed run-to-run traversal jitter across 3 timing-sensitive rows (level-01 math-gate x1300, level-01 door x1400, level-03 math-gate x420). Stable cores recorded: 5 rows always-unreached, 8 rows always-reached. Plan 22-05's zero-regression diff must use the stable cores.

## Task Commits

Each task was committed atomically:

1. **Task 1: De-flake scripts/check-gate.sh (SIGPIPE race fix)** - `5eedee8` (fix) — touches only scripts/check-gate.sh
2. **Task 2: Create 22-FINDINGS.md skeleton and capture the full-suite baseline** - `0d9a55a` (docs) — touches only 22-FINDINGS.md

## Files Created/Modified

- `scripts/check-gate.sh` - Structural gate for the challenge seam; assertions now read stdin to EOF (pipefail-safe), header documents the Phase 21 diagnosis conceptually without echoing the banned quiet-mode flags
- `.planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md` - FIX-01 evidence artifact: baseline section (diff anchor + verbatim green outputs + canonical 16-row audit table + prominent deviation flag), findings log scaffold, 24-row per-entity verdict table, inventory/escalation/regression placeholders

## Decisions Made

- **Recorded Run 1 as the canonical baseline audit table and added a prominent deviation section** rather than normalizing toward the expected shape (per plan instruction). Ran one supplementary characterization run (Run 2) to distinguish stable drift from jitter — result: genuine nondeterminism (spike-timing resonance, consistent with 21-FINDINGS Methodology Note). Both runs' membership recorded; regression rule for 22-05 written into the baseline section: timing-sensitive rows (3) flip freely; stable-core reached rows (8) must stay triggered; stable-core unreached rows (5) must stay unreached.
- **Did not mark FIX-01 complete in REQUIREMENTS.md** — FIX-01 is carried by all five phase-22 plans; Plan 22-05 completes and marks it. Marking at 22-01 would falsely show the review requirement done before any entity was reviewed.

## Deviations from Plan

**1. [Observed-shape deviation — recorded per plan instruction] Audit baseline differs from expected 6-unreached shape**
- **Found during:** Task 2 (baseline capture)
- **Issue:** Expected unreached row L1 math-gate x1300 was reached/resolved in Run 1; expected reached row L3 math-gate x420 went unreached (traversal passed x=420 without triggering)
- **Handling:** Recorded verbatim as ground truth with a prominent ⚠ deviation section; added one supplementary audit run (Run 2) as characterization evidence — Run 2 flipped differently (L3 mg420 reached, L1 mg1300 AND L1 door1400 unreached), proving run-to-run jitter, not a code regression
- **Files modified:** 22-FINDINGS.md (Baseline section)
- **Committed in:** `0d9a55a`

**2. [Stale plan expectation — recorded, not normalized] browser-boot.mjs prints no per-level OK lines**
- **Found during:** Task 2 (baseline capture)
- **Issue:** Plan expected "per-level OK lines"; the committed script prints a single aggregate PASS line (`Browser boot: PASS — title -> select -> all levels loaded with no runtime errors.`) and exits non-zero listing errors on any failure
- **Handling:** Recorded the actual verbatim output with an explicit note in the Baseline section; no script change (harness improvements are Phase 23 scope)
- **Files modified:** 22-FINDINGS.md (Baseline section)
- **Committed in:** `0d9a55a`

---

**Total deviations:** 2 (both evidence-recording deviations; zero code deviations, zero src/ changes)
**Impact on plan:** None on scope. The nondeterminism characterization materially improves Plan 22-05's regression diff correctness — without it, a flip on a timing-sensitive row would be misread as a regression or silent improvement.

## Issues Encountered

None beyond the recorded deviations. All gates green on first post-fix run; both task verification suites passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The phase's regression oracle is now trustworthy (deterministic gate) and the pre-fix ground truth is on disk — Wave 0 requirement of 22-VALIDATION.md satisfied; Plans 22-02..22-04 (review clusters) can start.
- Later plans extract the diff anchor via `sed -n 's/^Baseline commit: //p' 22-FINDINGS.md | head -1`.
- Plan 22-05 must honor the timing-sensitive-rows rule in the Baseline section when diffing the post-fix audit.

## Self-Check: PASSED

- FOUND: scripts/check-gate.sh
- FOUND: .planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md
- FOUND: commit 5eedee8 (fix(22-01): de-flake check-gate.sh SIGPIPE race)
- FOUND: commit 0d9a55a (docs(22-01): 22-FINDINGS.md skeleton + pre-fix full-suite baseline)

---
*Phase: 22-implementation-review-auto-fix*
*Completed: 2026-07-05*
