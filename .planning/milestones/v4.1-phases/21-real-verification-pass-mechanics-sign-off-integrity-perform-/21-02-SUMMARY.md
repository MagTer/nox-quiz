---
phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-
plan: 02
subsystem: testing
tags: [playwright, browser-boot, verification-gate, kaplay]

# Dependency graph
requires:
  - phase: 21 (Plan 01)
    provides: the one-off 4-level interactive audit script (scripts/audit-phase21-mechanics.mjs) and its live-scene `get("challenge")` introspection technique, reused here for the fast per-commit gate
provides:
  - A hardened scripts/browser-boot.mjs that actually exercises real movement and fully resolves one boxed mechanic (collect zone + math gate) on level-01, not just "scene loaded, zero console errors"
  - A proven RED/GREEN calibration confirming the hardening is a genuine check, not a no-op
affects: [any future phase touching scripts/browser-boot.mjs, src/mechanics/collect.js, or the level-01 mechanic layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-commit boot gate now holds real keyboard input (keyboard.down/up + press cycling) and polls live scene state via page.evaluate(() => get(\"challenge\").length) — same introspection technique as Plan 21-01's exhaustive audit, scoped to level-01 only for speed"

key-files:
  created: []
  modified:
    - scripts/browser-boot.mjs

key-decisions:
  - "Hardening scoped to level-01 only (not all 4 levels) to keep the per-commit gate fast, per 21-RESEARCH.md's Pitfall 3 guidance — the exhaustive 4-level sweep stays in Plan 21-01's one-off audit script"
  - "New assertions feed the SAME existing `errors` array/pass-fail gate rather than introducing a second mechanism — keeps the script's single source of truth for pass/fail"

patterns-established:
  - "RED/GREEN calibration for a browser-based gate: temporarily reintroduce a fixed bug (`player.paused = true` in collect.js's wireCollect), confirm the gate fails, revert via `git checkout --`, confirm the gate passes again — mirrors check-import-safety.sh's Section 1b self-test discipline for a live-browser gate instead of a static grep"

requirements-completed: [VERIFY-03]

coverage:
  - id: D1
    description: "scripts/browser-boot.mjs holds real ArrowRight input to reach and trigger the level-01 collect zone (x:300), asserted via get(\"challenge\").length > 0"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (level-01 branch, collect-zone assertion)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scripts/browser-boot.mjs continues real ArrowRight input to the level-01 math-gate (x:600) and cycles keys 1-4 to fully resolve it"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (level-01 branch, math-gate resolution loop)"
        status: pass
    human_judgment: false
  - id: D3
    description: "RED/GREEN calibration proves the hardened gate is a genuine check: reintroducing the exact v4.0 collect.js soft-lock (player.paused = true in wireCollect) makes the gate fail with a mechanic-typed error; reverting makes it pass again"
    requirement: VERIFY-03
    verification:
      - kind: e2e
        ref: "manual calibration run this session: RED confirmed non-zero exit with {\"type\":\"mechanic\",...}; GREEN confirmed exit 0 after git checkout -- src/mechanics/collect.js"
        status: pass
    human_judgment: false

duration: ~8min
completed: 2026-07-04
status: complete
---

# Phase 21 Plan 02: Harden Automated Boot Gate Summary

**Hardened `scripts/browser-boot.mjs` to hold real directional input and fully resolve level-01's collect zone + math gate via real key input, then proved the hardening genuine with a RED/GREEN calibration against the exact v4.0 collect.js soft-lock pattern.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-04T09:47:34Z
- **Completed:** 2026-07-04T09:51:24Z
- **Tasks:** 2 completed
- **Files modified:** 1 (scripts/browser-boot.mjs); src/mechanics/collect.js was temporarily edited for calibration and fully reverted (0 net changes)

## Accomplishments

- `scripts/browser-boot.mjs`'s level-01 branch now holds `ArrowRight` for real movement, reaches the collect zone at world x:300, and asserts `get("challenge").length > 0` — closing the exact validation gap that let the v4.0 collect.js total soft-lock ship as "passed" (the prior gate seeded every level as pre-cleared and never played).
- The same branch continues holding `ArrowRight` to the math-gate at world x:600 and cycles keys `1`-`4` (with a poll after each) to confirm the challenge fully resolves (`get("challenge").length` reaches `0`).
- Proved via RED/GREEN calibration that the hardening is a real check: temporarily reintroducing `player.paused = true;` in `src/mechanics/collect.js`'s `wireCollect` (the exact v4.0 soft-lock pattern) made the gate exit non-zero with a `"mechanic"`-typed error; reverting the edit made it pass again.
- Confirmed no regression across the full static gate suite (`check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, `smoke-progress.mjs`) plus the hardened `browser-boot.mjs` itself.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add movement + mechanic-resolution assertions to browser-boot.mjs for level-01** - `390fd03` (feat)
2. **Task 2: RED/GREEN calibration + full static suite confirmation** - no commit (verification-only task; the calibration edit to `src/mechanics/collect.js` was required by the plan to be fully reverted before completion, leaving zero net file changes — confirmed via `git status --porcelain src/mechanics/collect.js` being empty)

**Plan metadata:** (recorded below)

## Files Created/Modified

- `scripts/browser-boot.mjs` - level-01 branch now holds real `ArrowRight` input to trigger the collect zone (x:300) and resolve the math-gate (x:600) via keys 1-4, feeding the existing `errors` array/pass-fail gate; zero-console-error assertion and levels 2-4 behavior unchanged.

## Decisions Made

- Kept the hardening scoped to level-01 only (not all four levels), matching 21-RESEARCH.md's Pitfall 3 guidance to keep this per-commit gate fast — the exhaustive 4-level sweep already exists as Plan 21-01's one-off audit script.
- Reused the existing `errors` array/pass-fail mechanism rather than introducing a second one, per the plan's explicit instruction.

## Deviations from Plan

**1. [Documentation-only] Calibration's actual failing assertion differed from the plan's prediction, but the required invariant (genuine non-no-op check) still held.**
- **Found during:** Task 2 (RED/GREEN calibration)
- **Detail:** The plan's `<action>` text predicted the RED run would fail with a `"mechanic"` error specifically about the **collect zone never triggering**. In practice, because the collect zone's `onCollide` handler had already fired (opening the challenge) *before* `player.paused = true` executes inside that same handler, the collect-zone assertion (`get("challenge").length > 0`) still passed — the challenge was already open. The freeze instead prevented all further movement, so the subsequent math-gate assertion failed instead, producing `{"type":"mechanic","message":"math-gate at x:600 never resolved after cycling keys 1-4"}`. This still satisfies the plan's actual `acceptance_criteria` (a `"mechanic"`-typed error occurred during calibration, then reverting produced GREEN again) — the acceptance criteria is looser than the action's narrative prediction and does not name which specific message must appear.
- **Fix:** None needed — no code change, just a documentation note. No auto-fix rule applies since nothing is broken; this is purely a note that the plan author's narrative prediction of *which* assertion would fire first didn't match the actual collision-then-freeze ordering in collect.js.
- **Files modified:** None (informational only).
- **Verification:** Both RED (non-zero exit, mechanic-typed error) and GREEN (exit 0) were manually confirmed this session before the calibration edit was reverted via `git checkout -- src/mechanics/collect.js`.
- **Committed in:** N/A (no commit; the calibration edit was never committed, as required)

---

**Total deviations:** 1 (documentation-only, no code impact)
**Impact on plan:** None on functionality or scope — the calibration still proves the hardened gate is a genuine, non-no-op check, which is the actual requirement.

## Issues Encountered

None beyond the documentation deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `scripts/browser-boot.mjs` is hardened and proven as a real per-commit gate exercising movement and mechanic resolution for level-01; it stays fast (single-level scope) while Plan 21-01's exhaustive audit remains the tool for a full 4-level sweep.
- No blockers for the remaining plans in Phase 21 (sign-off integrity work).

---
*Phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-*
*Completed: 2026-07-04*

## Self-Check: PASSED

- FOUND: scripts/browser-boot.mjs
- FOUND: 390fd03 (Task 1 commit)
- FOUND: SUMMARY.md
