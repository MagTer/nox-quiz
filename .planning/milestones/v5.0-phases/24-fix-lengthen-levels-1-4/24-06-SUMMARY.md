---
phase: 24-fix-lengthen-levels-1-4
plan: 06
subsystem: testing
tags: [interactive-audit, findings-doc, phase-close-out]

requires:
  - phase: 24-fix-lengthen-levels-1-4 (24-01..24-05)
    provides: fixed + extended level descriptors, re-baselined smoke fixture, green structural/regression suite
provides:
  - 24-FINDINGS.md — phase evidence doc (defect fixes, extension rationale, interactive audit results)
  - Appended "Resolved in Phase 24" cross-reference notes in 22-FINDINGS.md and 23-FINDINGS.md
  - A rebuilt interactive-audit driver (scripts/lib/route-planner.mjs, driveToXPlanned) proven to complete against all 4 lengthened levels
affects: [phase 25 (levels 5-8 can reuse the same audit driver/validator), phase 28 (final 8-level verification)]

tech-stack:
  added: []
  patterns:
    - "Geometry-informed audit driving: plan jump takeoffs from the same reachability.mjs feasibility graph the structural validator uses (route-planner.mjs), rather than a blind fixed-cadence bot"

key-files:
  created:
    - .planning/phases/24-fix-lengthen-levels-1-4/24-FINDINGS.md
    - scripts/lib/route-planner.mjs
  modified:
    - .planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md
    - .planning/phases/23-level-validation-harness/23-FINDINGS.md
    - scripts/lib/mechanic-drive.mjs
    - scripts/lib/audit-retry.mjs
    - scripts/audit-phase21-mechanics.mjs
    - src/levels/level-01.js
    - src/levels/level-04.js
    - scripts/smoke-progress.mjs

key-decisions:
  - "The interactive audit originally could not complete at all against the lengthened levels — misdiagnosed mid-session as hardware/GPU/browser instability before being root-caused to the audit driver itself (blind 'jump whenever grounded' bunny-hopping): it skipped ground-level checkpoints, made marginal jumps fail deterministically (defeating the retry wrapper's premise), and pushed wall-clock past `timeout`, whose SIGTERM produced misleading Playwright 'closed' errors"
  - "Fixed via a geometry-informed driver (route-planner.mjs + driveToXPlanned) that walks by default and jumps only at takeoffs planned from the validator's own feasibility graph, using measured (not theoretical) in-engine jump physics"
  - "level-01/level-04's Wave 1 gate repositions (x:528, x:1728) were structurally valid but sat at floor-run edges immediately before gap-crossing platforms — a traversal trap only the interactive audit surfaced; re-repositioned mid-floor (x:150, x:1300)"
  - "audit-retry.mjs's retry wrapper skipped ALL further driving once an encounter triggered, even if resolution failed — fixed to retry resolution specifically, since that's exactly the timing-sensitive class the wrapper exists for"
  - "2 encounters (level-03 and level-04's enemy@2400) remain resolved:false after the fixes — a narrower, unisolated issue documented as a follow-up rather than pursued further, consistent with the acceptance bar (triggered:true is non-negotiable; resolved:true is the goal but not blocking)"

patterns-established:
  - "Audit driver takeoffs are derived from the structural validator's own graph (buildNodes/buildGraph/canReach), not re-implemented — the interactive audit and the structural validator now agree on what's reachable, closing the gap between them"

requirements-completed: [VALID-04, LVL-01]

coverage:
  - id: D1
    description: "node scripts/audit-phase21-mechanics.mjs drives all 4 lengthened levels start-to-goal, zero triggered:false rows, total encounter count exceeds the pre-Phase-24 16-encounter baseline"
    requirement: "VALID-04"
    verification:
      - kind: integration
        ref: "node scripts/audit-phase21-mechanics.mjs — 22/22 encounters triggered:true (was: audit could not complete at any timeout before this plan's driver rebuild)"
        status: pass
    human_judgment: false
  - id: D2
    description: "24-FINDINGS.md documents all 11 structural defect fixes (3 gates + 8 platforms), 4 levels' extension rationale, and audit results with concrete before/after evidence"
    requirement: "LVL-01"
    verification:
      - kind: other
        ref: "test -f .planning/phases/24-fix-lengthen-levels-1-4/24-FINDINGS.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "22-FINDINGS.md and 23-FINDINGS.md each carry an appended (not rewritten) cross-reference note"
    verification:
      - kind: other
        ref: "grep -c 'Resolved in Phase 24' .planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md .planning/phases/23-level-validation-harness/23-FINDINGS.md — both 1; git diff --stat both shows additions only"
        status: pass
    human_judgment: false

duration: extended (multi-session; included root-cause diagnosis of the audit driver, not just the two-task plan as originally scoped)
completed: 2026-07-06
status: complete
---

# Phase 24 Plan 06: Interactive Audit & Findings Close-Out Summary

**Rebuilt the interactive mechanic audit's driver after root-causing its inability to complete against the lengthened levels (misdiagnosed initially as hardware/browser instability), fixed two real traversal-trap/checkpoint-skip bugs the rebuild surfaced, then wrote 24-FINDINGS.md and cross-referenced it from 22/23-FINDINGS.md. Final result: 22/22 mechanic encounters triggered:true across all 4 levels (zero regressions), 20/22 fully resolved; 2 remain resolved:false as a documented follow-up.**

## Performance

- **Duration:** extended — this plan's scope grew substantially beyond its original two tasks (run audit, write findings) once the audit was found not to complete at all
- **Completed:** 2026-07-06
- **Tasks:** 2 (plan) + unplanned root-cause diagnosis and driver rebuild
- **Files modified:** 9 (1 new findings doc, 1 new script module, 2 findings-doc appends, 5 script/level edits)

## Accomplishments

- Root-caused the interactive audit's total inability to complete against the Phase-24-lengthened levels: not hardware/GPU instability (multiple false leads chased: launch flags, per-level context recycling) but the driver's own blind "jump whenever grounded" model deterministically failing marginal jumps and skipping ground-level checkpoints
- Built `scripts/lib/route-planner.mjs`: plans jump takeoffs from the same `reachability.mjs` feasibility graph the structural validator uses, via measured in-engine jump physics (in-page 8ms arc sampling)
- Built `driveToXPlanned` in `mechanic-drive.mjs`: walks by default, jumps only at planned takeoffs, retreats past missed-checkpoint respawn traps, back-walks to re-contact overshot triggers
- Fixed `audit-retry.mjs` to retry resolution (not just triggering) on subsequent attempts — the original skip condition discarded that chance for any already-triggered encounter
- Found and fixed a genuine checkpoint-skip bug: an unconditional jump press on flat/descending gaps sailed over level-03's x:740 checkpoint; now skipped when fall momentum alone clears the span
- Re-repositioned level-01/level-04's Wave 1 gate fixes (x:528→x:150, x:1728→x:1300) off a gap-lip traversal trap the interactive audit (not the structural validator) surfaced
- Final audit run: 22/22 encounters triggered:true (exceeds the 16-encounter pre-Phase-24 baseline), 20/22 resolved:true or null-by-design; 2 rows (level-03/level-04 enemy@2400) resolved:false, documented as a follow-up
- Wrote `24-FINDINGS.md` with full before/after evidence for the 3 gate fixes, 8 platform fixes, 4 levels' extension rationale, the traversal-trap correction, the audit driver rebuild, and final audit/regression results
- Appended "Resolved in Phase 24" cross-reference notes to `22-FINDINGS.md` and `23-FINDINGS.md` (Edit-only, additions confirmed via `git diff --stat`)

## Task Commits

1. `c59a11d` — fix(24): re-reposition level-01/level-04 mathGates off gap-lip traversal traps
2. `b9cf1dd` — fix(24): geometry-informed audit driver — walk + planned takeoffs replaces blind bunny-hopping
3. `b5fd3e4` — docs(24): capture interactive audit evidence (26/26 triggered, 8 resolution-flaky) [intermediate result, superseded by final run]
4. `64f655b` — fix(24): retry resolution on retriggered encounters; skip needless jumps that skip checkpoints
5. (this plan's commit) — docs(24-06): write 24-FINDINGS.md, cross-reference 22/23-FINDINGS.md, complete Plan 24-06

## Files Created/Modified

- `.planning/phases/24-fix-lengthen-levels-1-4/24-FINDINGS.md` - new phase evidence doc
- `scripts/lib/route-planner.mjs` - new: geometry-informed takeoff planning
- `scripts/lib/mechanic-drive.mjs` - new `driveToXPlanned` export; `resolveIfBoxed` settle re-check; `AUDIT_DEBUG` diagnostic trace
- `scripts/lib/audit-retry.mjs` - retries resolution (not just triggering) across attempts
- `scripts/audit-phase21-mechanics.mjs` - corrected header comment (context recycling was hygiene, not the root fix)
- `src/levels/level-01.js`, `src/levels/level-04.js` - gate re-reposition (x:150, x:1300)
- `scripts/smoke-progress.mjs` - geometry pins re-baselined a second time for the gate re-reposition
- `.planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md`, `.planning/phases/23-level-validation-harness/23-FINDINGS.md` - appended cross-reference notes only

## Decisions Made

- Treated the audit's total non-completion as a blocking regression requiring root-cause diagnosis rather than working around it with a longer timeout or weaker acceptance bar
- Chose to fix the audit driver (not touch the "shipped" level-01 platform geometry) once the underlying jump physics were confirmed sound via direct in-engine measurement
- Stopped pursuing the 2 remaining resolved:false rows (level-03/04 enemy@2400) after confirming they no longer represent the checkpoint-skip class of bug and are a narrower, separate issue — consistent with the plan's own acceptance bar and this session's quota-discipline instruction

## Deviations from Plan

This plan's scope expanded significantly beyond its original two tasks: the audit did not merely need re-running, it needed rebuilding. This was necessary — the plan's Task 1 acceptance criteria (zero `triggered:false` rows) could not be met with the original driver at all, at any timeout.

## Issues Encountered

- Multiple false leads chased before finding the real root cause (GPU/launch-flag tuning, per-level context recycling) — documented in 24-FINDINGS.md's Audit Driver Rebuild section so future work doesn't repeat the same misdiagnosis path
- 2 encounters (enemy@2400 on level-03 and level-04) remain resolved:false — left as an explicit follow-up

## User Setup Required

None.

## Next Phase Readiness

- `node scripts/audit-phase21-mechanics.mjs` completes reliably (~10-15 min) with zero `triggered:false` rows — usable as-is for Phase 25's 4 new levels
- `scripts/lib/route-planner.mjs` generalizes to any level via `level.geometry` — no per-level special-casing needed for Phase 25
- Full regression suite (`validate-levels.mjs`, `smoke-progress.mjs`, both self-tests) green
- Follow-up available for a future session: diagnose why `enemy@2400` resolves flakily on level-03 and level-04 specifically (same x on both levels — possibly a shared pattern worth a closer look)

---
*Phase: 24-fix-lengthen-levels-1-4*
*Completed: 2026-07-06*

## Self-Check: PASSED

- FOUND: .planning/phases/24-fix-lengthen-levels-1-4/24-FINDINGS.md
- FOUND: scripts/lib/route-planner.mjs
- FOUND: .planning/phases/24-fix-lengthen-levels-1-4/24-06-SUMMARY.md
- FOUND: commits c59a11d, b9cf1dd, b5fd3e4, 64f655b
