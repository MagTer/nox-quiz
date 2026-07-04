---
phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-
plan: 06
subsystem: ui
tags: [kaplay, challenge-overlay, gap-closure, playwright]

requires:
  - phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-
    provides: "Plan 21-04's instanceTag scoping (state-corruption half of New Finding 4) and Plan 21-05's committed interactive audit script (real-movement evidence generator)"
provides:
  - "openChallenge() hide/restore same-time-open guard closing New Finding 4's visual-overlap half"
  - "Updated 21-FINDINGS.md disposition: New Finding 4 fully closed (both halves fixed)"
  - "Regenerated + new screenshot evidence proving single-overlay rendering and post-close restoration"
affects: [21-VERIFICATION]

tech-stack:
  added: []
  patterns:
    - "Kaplay base GameObj.hidden flag used to suppress rendering without destroying/retagging an object (draw() short-circuits on hidden, independent of any component)"
    - "Closure-local snapshot-at-open (priorChallengeObjs) mirrors this file's existing anti-leak convention (instanceTag/cleared/keyCtrls) — captured once per openChallenge() call, restored by the matching close()"

key-files:
  created: []
  modified:
    - src/ui/challenge.js
    - .planning/phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/21-FINDINGS.md
    - .planning/phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/screenshots/

key-decisions:
  - "Hide (not destroy) the prior challenge's objects — keeps a non-freezing challenge (e.g. collect.js's zone) fully alive and resolvable underneath, only its rendering suppressed"
  - "Explicitly rejected a 'refuse to open a second challenge' guard — door/gates/enemy freeze the player before calling openChallenge(), so refusing to create the new overlay would soft-lock a frozen player with nothing to answer"
  - "priorChallengeObjs captured BEFORE any of this instance's own add([...]) calls, so the snapshot never includes this instance's own not-yet-created objects"

patterns-established:
  - "Snapshot-capture-then-restore-on-teardown is the standard shape for any future same-time-open coordination in this shared challenge seam"

requirements-completed: [VERIFY-02]

coverage:
  - id: D1
    description: "openChallenge() hides any already-open earlier challenge's objects on entry (priorChallengeObjs snapshot, hidden=true) and restores them in close() (hidden=false), so only one challenge overlay is ever visible at a time"
    requirement: "VERIFY-02"
    verification:
      - kind: e2e
        ref: "node scripts/audit-phase21-mechanics.mjs — regenerated screenshots/level-01-math-gate-600-before.png shows single clean overlay, zero regressions across 16/16 encounters vs Plan 21-05 baseline"
        status: pass
      - kind: manual_procedural
        ref: "throwaway supplementary Playwright script — get(\"challenge\").length/hidden inspection before/after math-gate close(): 3 collect-zone objects hidden while math-gate open, 0 hidden + 4 pickups intact after close(); screenshots level-01-overlap-mathgate-open-verify.png / level-01-overlap-collectzone-restored-verify.png"
        status: pass
    human_judgment: false
  - id: D2
    description: "The new instance's own overlay (dim/panel/prompt/boxes/1-4 key bindings) is created unconditionally — the fix never refuses or skips creating a new challenge's overlay, avoiding a soft-lock regression for frozen players"
    requirement: "VERIFY-02"
    verification:
      - kind: e2e
        ref: "audit script confirms all 3 newly-reachable door/enemy encounters plus all math-gate encounters still trigger+resolve identically; full static gate suite (check-gate.sh, check-import-safety.sh, check-safety.sh, smoke-progress.mjs) all PASS"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-07-04
status: complete
---

# Phase 21 Plan 06: Fix New Finding 4's Visual-Overlap Half Summary

**openChallenge() now hides an already-open earlier challenge's overlay via Kaplay's base `hidden` flag and restores it on close(), closing the last open gap from VERIFICATION.md's VERIFY-02 truth.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2/2 completed
- **Files modified:** 3 (`src/ui/challenge.js`, `21-FINDINGS.md`, `screenshots/` — 32 regenerated + 2 new)

## Accomplishments

- Added a same-time-open hide/restore guard to `openChallenge()` in `src/ui/challenge.js`: captures `get("challenge")` before creating any of the new instance's own objects, hides the prior instance's objects (`hidden = true`) for the duration, and restores them (`hidden = false`) in `close()` after its own `destroyAll(instanceTag)` teardown.
- Confirmed via a real re-run of the committed `scripts/audit-phase21-mechanics.mjs` that the exact scenario New Finding 4 originally reported (level-01's collect-zone at x:300 walked into the math-gate at x:600 before resolving) now renders a single, clean overlay with no ghosted/overlapping second prompt — zero regressions across all 16 encounters vs. Plan 21-05's baseline.
- Wrote a throwaway supplementary Playwright script (not committed) that directly inspected live Kaplay scene state before/after the math-gate's `close()` fires: 3 collect-zone challenge objects were hidden while the math-gate overlay was open, and all 3 became visible again (with all 4 pickups still present/uncollected) immediately after the math-gate resolved — definitive proof of both the hide and restore halves.
- Updated `21-FINDINGS.md`'s New Finding 4 disposition: both halves (state-corruption from Plan 21-04, visual-overlap from this plan) are now fixed and re-verified with concrete evidence.

## Task Commits

1. **Task 1: Add a hide-prior/restore-on-close same-time-open guard to openChallenge()** - `f58f3fb` (fix)
2. **Task 2: Verify the fix with real interactive evidence, confirm zero regressions, update 21-FINDINGS.md** - `8ae2dff` (docs)

_Note: Task 2 was documentation/evidence-only (screenshots + FINDINGS update), committed as `docs`._

## Files Created/Modified

- `src/ui/challenge.js` - `openChallenge()` captures `priorChallengeObjs = get("challenge")` before creating its own objects, hides them when non-empty; `close()` restores them after `destroyAll(instanceTag)`.
- `.planning/phases/21-.../21-FINDINGS.md` - New Finding 4 disposition updated to "both halves fixed," citing the `hidden`/`priorChallengeObjs` mechanism and new screenshot evidence.
- `.planning/phases/21-.../screenshots/` - all 32 pre-existing screenshots regenerated by this run (byte-for-byte scenario re-execution, same encounters/results as Plan 21-05's baseline); 2 new supplementary screenshots (`level-01-overlap-mathgate-open-verify.png`, `level-01-overlap-collectzone-restored-verify.png`) added as direct hide/restore evidence.

## Decisions Made

- Hide (not destroy) the prior challenge's objects, per the plan's explicit design — preserves collect.js's independently-resolvable zone underneath a newer overlay.
- Did not implement a "refuse to open a second challenge" guard, since door/gates/enemy already freeze the player before calling `openChallenge()` — refusing the new overlay would strand a frozen player with nothing to answer, a worse regression than the status quo.

## Deviations from Plan

None — plan executed exactly as written. The plan itself anticipated the two verification paths used (shared audit script re-run + a throwaway supplementary script if the shared script's own screenshot timing didn't capture the restore moment) and both were needed and used exactly as scoped.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

VERIFY-02's remaining gap (New Finding 4's visual-overlap half) is now closed with real interactive evidence. Combined with Plan 21-05 (VERIFY-01, door.js/enemy.js reachability), this closes the two mechanics-related gaps `21-VERIFICATION.md` identified. VERIFY-03 (boot-check per-level movement coverage) remains a separate, still-open gap tracked in `21-VERIFICATION.md` if a future plan chooses to address it — not in scope for this plan.

## Self-Check: PASSED

- FOUND: src/ui/challenge.js
- FOUND: 21-06-SUMMARY.md
- FOUND: commit f58f3fb (Task 1)
- FOUND: commit 8ae2dff (Task 2)
