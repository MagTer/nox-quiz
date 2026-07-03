---
phase: 16-remaining-mechanics-difficulty-curve
plan: 03
subsystem: gameplay
tags: [kaplay, integration, challenge-seam, real-browser-boot, human-verify]

requires:
  - phase: 16-remaining-mechanics-difficulty-curve
    plan: 02
    provides: challenge.js extension + three mechanic modules + authored level-01 placements

provides:
  - src/scenes/game.js imports and calls wireGates, wireEnemy, and wireCollect once each
  - Full static gate suite green for the first time this phase
  - Real-browser boot sign-off deferred to human verification (VERIFICATION.md)

affects:
  - verify-work / 16-VERIFICATION.md
  - Phase 17 level authoring

tech-stack:
  added: []
  patterns:
    - "Additive scene wiring: three import + three call lines, zero other change to game.js"

key-files:
  created:
    - .planning/phases/16-remaining-mechanics-difficulty-curve/16-VERIFICATION.md
  modified:
    - src/scenes/game.js

key-decisions:
  - "Wired the three mechanics immediately after wireDoor so they share the same closure-local brain instance"
  - "Preserved createBrain({ ..., allowedTables: level.allowedTables }) unchanged — LVL-03 seam is verified, not modified"

patterns-established: []

requirements-completed: [MECH-03, MECH-04, MECH-05, LVL-03]

coverage:
  - id: D1
    description: "src/scenes/game.js imports and calls wireGates, wireEnemy, and wireCollect once each after wireDoor"
    requirement: MECH-04
    verification:
      - kind: other
        ref: "node --check src/scenes/game.js && grep -q 'wireGates({ player, brain })' && grep -q 'wireEnemy({ player, brain })' && grep -q 'wireCollect({ player, brain })'"
        status: pass
    human_judgment: false
  - id: D2
    description: "LVL-03 difficulty seam preserved: createBrain still receives allowedTables: level.allowedTables"
    requirement: LVL-03
    verification:
      - kind: other
        ref: "grep -q 'allowedTables: level.allowedTables' src/scenes/game.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full static gate suite green (check-gate + check-import-safety + check-safety + smoke-progress)"
    requirement: MECH-03
    verification:
      - kind: other
        ref: "bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs"
        status: pass
    human_judgment: false
  - id: D4
    description: "Real-browser boot confirms MECH-03/04/05 work end-to-end with no punishment, no soft-lock, and existing gate/door behavior unchanged"
    requirement: MECH-03
    verification: []
    human_judgment: true
    rationale: "Runtime rendering, collision removal, player.paused toggling, same-frame re-collision avoidance, and z-order are invisible to static greps; only a real browser can confirm soft-lock-free behavior. Recorded as human_needed in 16-VERIFICATION.md."

duration: 3min
completed: 2026-07-03
status: complete
---

# Phase 16 Plan 03: Wave 2 Integration Summary

**Wired the three new mechanic modules into `src/scenes/game.js`, turned the full static gate suite green, and deferred the mandatory real-browser boot sign-off to `16-VERIFICATION.md` because this execution context has no browser runtime.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-03T14:29:51Z
- **Completed:** 2026-07-03T14:33:00Z
- **Tasks:** 2 (Task 2 is a blocking human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- Added three additive imports to `src/scenes/game.js` for `wireGates`, `wireEnemy`, and `wireCollect`.
- Added three additive calls right after `wireDoor({ player, brain })` using the same closure-local `brain` instance.
- Confirmed `createBrain({ ..., allowedTables: level.allowedTables })` is preserved unchanged.
- Ran the full static suite green: `check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, and `smoke-progress.mjs`.
- Captured the runtime verification gap in `16-VERIFICATION.md` with `human_needed` rationale.

## Task Commits

1. **Task 1: Wire mechanics into game.js + full static suite green** - `c7f76a2` (feat)
2. **Task 2: Mandatory real browser boot** — not performed in this context; deferred to human verification.

## Files Created/Modified
- `src/scenes/game.js` — imports and calls `wireGates`, `wireEnemy`, `wireCollect` once each.
- `.planning/phases/16-remaining-mechanics-difficulty-curve/16-VERIFICATION.md` — runtime sign-off deferred to human.

## Decisions Made
- Kept the wiring purely additive and placed it immediately after `wireDoor` so all mid-level mechanics share the same `brain` instance and the same pattern.
- Left `allowedTables: level.allowedTables` untouched — Phase 16's LVL-03 requirement is satisfied by this existing seam, not by a code change.

## Deviations from Plan

### Auto-fixed Issues
None.

---

**Total deviations:** 0
**Impact on plan:** None.

## Issues Encountered
- The mandatory real-browser boot in Task 2 cannot be performed in this headless execution context. Per the parent instruction, the runtime verification items are recorded as `human_needed` in `16-VERIFICATION.md` instead of being skipped silently.

## User Setup Required
None.

## Next Phase Readiness
- Code-level integration is complete and the static suite is green.
- Phase 16 is ready for human runtime sign-off via `16-VERIFICATION.md` before Phase 17 level authoring begins.

---
*Phase: 16-remaining-mechanics-difficulty-curve*
*Completed: 2026-07-03*
