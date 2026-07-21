---
phase: 30-harness-extensions
plan: 02
subsystem: testing
tags: [playwright, interactive-audit, mechanic-drive, route-planner, secret-alcove]

# Dependency graph
requires:
  - phase: 29-mechanic-cleanup
    provides: "progress.js's markSecretFound/hasSecretFound + secretAlcove.js's levelId-threaded discovery feedback (fx.pop/fx.popupText/audio.playSfx), the entity-destroy/XP-delta signal this plan's audit coverage keys off"
provides:
  - "deriveEncounters() now emits secret-alcove entries alongside door/mathGate/enemy, x-sorted"
  - "planTakeoffs() gains an optional 4th targetY param, disambiguating an x that sits inside both an overlapping floor's and a platform's span (backward-compatible, self-test-proven no-op for every existing call site)"
  - "driveToXPlanned's opts.targetY threading + a surface-disambiguation fix to its own 'well past the target' overshoot back-walk (previously always picked the floor over an overlapping platform, walking the player off elevated targets)"
  - "driveAndDetectAlcove(page, encounter, geometry) — new export driving to and detecting a secret-alcove encounter via entity-destroy + XP-delta, never get(\"challenge\").length"
  - "audit-retry.mjs's per-encounter loop branches on tag === 'secret-alcove' and no longer blocks later encounters in the same attempt when an alcove goes untouched"
  - "Real browser proof: all 8 levels' secret-alcove encounters report triggered:true/resolved:true, reproduced across two consecutive full audit runs"
affects: [34-level-quality-pass, 36-world-motion-ambient-life]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "targetY-disambiguation threading mirrors reachability.mjs's own WR-02 nodeContaining(nodes, x, y) closest-match convention, applied end-to-end through route-planner.mjs and mechanic-drive.mjs for the first non-floor-level driven target"
    - "Bounded, grounded-only horizontal 'nudge' loop (driveAndDetectAlcove) as a strict refinement layered on top of driveToXPlanned's arrival, rather than complicating the generic driver further — keeps the point-target concern isolated to the alcove-specific caller"

key-files:
  created: []
  modified:
    - scripts/lib/route-planner.mjs
    - scripts/lib/mechanic-drive.mjs
    - scripts/lib/audit-retry.mjs

key-decisions:
  - "TDD RED/GREEN followed literally for Task 1's targetY threading: a failing self-test assertion was committed first (2cd9c8d), then the implementation (fe65d5f) turned it green — proven via two separate `node scripts/lib/route-planner.mjs` runs (FAIL then PASS)."
  - "A second, genuine bug (surface-disambiguation in driveToXPlanned's overshoot back-walk) was found ONLY by running the real browser audit (Task 2) — the Task 1 self-test's synthetic single-floor/single-platform fixture never exercised the 'well past the target' code path, so it stayed green while the real level-01 drive silently walked the player off the platform. Fixed under Rule 1 (auto-fix bugs) with a dedicated commit (c9fdd69), scoped to files already in this plan's files_modified list."
  - "Chose a bounded horizontal 'nudge' loop in driveAndDetectAlcove over further generalizing driveToXPlanned's own landing precision — the alcove's small point-footprint-above-a-platform shape is unique to this mechanic; keeping the correction local avoids widening driveToXPlanned's blast radius for door/mathGate/enemy, which never needed sub-32px landing precision."

requirements-completed: [MECH-04]

coverage:
  - id: D1
    description: "deriveEncounters() emits secret-alcove entries from geometry.secretAlcove, x-sorted alongside door/mathGate/enemy; planTakeoffs' new optional targetY param disambiguates an overlapping floor/platform pair without changing behavior for any pre-existing 2-arg/3-arg call site"
    requirement: "MECH-04"
    verification:
      - kind: unit
        ref: "node scripts/lib/route-planner.mjs (self-test: targetY-omitted resolves to the floor with zero takeoffs; targetY:170 resolves to the platform node with a non-empty mount takeoff; every pre-existing case unchanged)"
        status: pass
    human_judgment: false
  - id: D2
    description: "driveAndDetectAlcove detects secret-alcove touch via entity-destroy (afterCount < beforeCount) and XP-delta (CONFIG.PROGRESS.XP_ALCOVE or 0), never via get(\"challenge\").length — grep-verified zero occurrences of the challenge-open signal inside the function's own body"
    requirement: "MECH-04"
    verification:
      - kind: unit
        ref: "grep -n 'get(\"challenge\")' scripts/lib/mechanic-drive.mjs, scoped to driveAndDetectAlcove's body — zero matches"
        status: pass
    human_judgment: false
  - id: D3
    description: "An untouched/failed secret-alcove never blocks the audit from reaching later door/mathGate/enemy encounters in the same attempt — audit-retry.mjs's per-encounter loop only breaks for non-alcove tags"
    requirement: "MECH-04"
    verification:
      - kind: unit
        ref: "grep -n 'secret-alcove' scripts/lib/audit-retry.mjs — shows the tag branch and the non-blocking guard (!everTriggered && encounter.tag !== 'secret-alcove')"
        status: pass
      - kind: automated_ui
        ref: "node scripts/audit-phase21-mechanics.mjs (real browser run) — every level's later door/mathGate/enemy encounters resolved regardless of alcove outcome"
        status: pass
    human_judgment: false
  - id: D4
    description: "A REAL browser-driven `node scripts/audit-phase21-mechanics.mjs` run reports triggered:true and resolved:true for the secret-alcove encounter on all 8 levels (exceeds the plan's stated minimum bar of level-01 alone)"
    requirement: "MECH-04"
    verification:
      - kind: automated_ui
        ref: "node scripts/audit-phase21-mechanics.mjs — full run, all 39 encounters (8 secret-alcove + 31 door/math-gate/enemy) triggered:true/resolved:true, reproduced across two consecutive real browser runs"
        status: pass
    human_judgment: false

# Metrics
duration: 108min
completed: 2026-07-10
status: complete
---

# Phase 30 Plan 02: Interactive Alcove Audit Coverage Summary

**The interactive mechanic audit now genuinely drives to and detects every level's secret alcove via entity-destroy/XP-delta (never challenge-open), closing the automated blind spot since Phase 25 — proven on all 8 levels in two consecutive real headless-browser runs, not just level-01's minimum bar.**

## Performance

- **Duration:** 108 min (includes two real ~2-3min browser audit runs plus interactive debugging of a real positional bug the synthetic self-test never exercised)
- **Started:** 2026-07-10T08:18:04Z
- **Completed:** 2026-07-10T10:13:29+02:00
- **Tasks:** 2 (Task 1 auto/tdd, Task 2 auto)
- **Files modified:** 3

## Accomplishments
- `deriveEncounters()` (`scripts/lib/mechanic-drive.mjs`) now also emits `secret-alcove` entries from `geometry.secretAlcove`, correctly x-sorted alongside door/mathGate/enemy
- `planTakeoffs()` (`scripts/lib/route-planner.mjs`) gained a backward-compatible optional 4th `targetY` param, threaded into `nodeContaining` so an x inside both an overlapping floor's and a platform's span (exactly a secret alcove's real shape) disambiguates to the intended node instead of always resolving to the floor
- `driveToXPlanned` threads `opts.targetY` through to `planTakeoffs`, and its own "well past the target" overshoot back-walk was fixed to disambiguate the retreat surface by the player's current feet height rather than a naive first-array-match — this was a genuine, previously-latent bug the real browser run exposed (see Deviations)
- New export `driveAndDetectAlcove(page, encounter, geometry)`: drives to an alcove via the proven `driveToXPlanned` navigation, performs a bounded grounded-only horizontal nudge onto the alcove's own x-span, then a single deliberate vertical "check for a secret" hop, detecting success via entity-destroy + XP-delta — never `get("challenge").length`
- `audit-retry.mjs`'s per-encounter loop branches on `encounter.tag === "secret-alcove"` to call `driveAndDetectAlcove` directly (still OR-ed across attempts), and the untriggered-blocks-loop guard no longer breaks the attempt for an untouched alcove — it is a non-blocking walk-through bonus, unlike door/mathGate/enemy
- **Real browser proof (Task 2, run twice for reproducibility):** all 8 levels' `secret-alcove` encounters report `triggered: true` and `resolved: true`, and all 39 total encounters across the 8-level audit resolved cleanly — exceeding the plan's stated minimum bar (level-01 alone) by covering the full roster

## Task Commits

Each task was committed atomically, following the TDD RED/GREEN cycle for Task 1's `tdd="true"` flag:

1. **Task 1 (RED): failing self-test for planTakeoffs targetY disambiguation** - `2cd9c8d` (test) — added a level-01-shaped alcove fixture to route-planner.mjs's self-test proving the omitted-targetY and supplied-targetY cases; ran red (confirmed FAIL) before any implementation existed
2. **Task 1 (GREEN): alcove driving + detection — targetY threading, driveAndDetectAlcove, non-blocking retry branch** - `fe65d5f` (feat) — implemented `planTakeoffs`' targetY param, `deriveEncounters`' alcove branch, `driveToXPlanned`'s `opts.targetY` threading, the new `driveAndDetectAlcove` export, and `audit-retry.mjs`'s tag branch + non-blocking guard; self-test turned green
3. **Task 2: real browser verification** - `c9fdd69` (fix) — the required real `node scripts/audit-phase21-mechanics.mjs` run initially FAILED for 5 of 8 levels' alcoves; root-caused and fixed two real bugs the synthetic self-test never exercised (see Deviations); re-ran the full audit twice more, both green across all 8 levels

**Plan metadata:** (this commit — SUMMARY.md + REQUIREMENTS.md)

## Files Created/Modified
- `scripts/lib/route-planner.mjs` — `planTakeoffs`'s new optional `targetY` 4th param + self-test extension
- `scripts/lib/mechanic-drive.mjs` — `deriveEncounters`' alcove branch, `driveToXPlanned`'s `opts.targetY` threading + overshoot-surface-disambiguation fix, new `driveAndDetectAlcove` export (with bounded horizontal nudge)
- `scripts/lib/audit-retry.mjs` — `driveAndDetectAlcove` import, per-encounter tag branch, non-blocking guard for `secret-alcove`

## Decisions Made
- TDD RED/GREEN was followed literally for Task 1 despite this codebase's no-framework "self-test on direct execution" idiom: the failing assertion was committed BEFORE the implementation (proven red via an actual failed `node` run), then a separate commit turned it green.
- The genuine surface-disambiguation bug in `driveToXPlanned`'s overshoot back-walk was fixed under Rule 1 (auto-fix bugs) rather than deferred — it directly blocked this task's own success criterion and was scoped entirely to a file already in this plan's `files_modified` list.
- Chose a bounded horizontal "nudge" loop local to `driveAndDetectAlcove` over further generalizing `driveToXPlanned`'s landing precision for every caller — the alcove's small point-footprint-above-a-platform shape is unique to this mechanic; door/mathGate/enemy never needed sub-32px landing precision and this keeps their proven behavior untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] driveToXPlanned's overshoot back-walk always picked the floor over an overlapping platform**
- **Found during:** Task 2 (the required real `node scripts/audit-phase21-mechanics.mjs` run — NOT caught by Task 1's self-test, whose synthetic fixture had no overlapping floor/platform pair at the exact overshoot code path)
- **Issue:** `driveToXPlanned`'s "well past the target" recovery block picked the retreat surface via a plain `.find()` over `[...floors, ...platforms]`; for a targetX inside BOTH an overlapping floor's span and a platform's span (exactly a secret alcove's real shape — level-01's alcove at x:400 sits above platform-0's 360..520 span, which itself overlaps floor-0's 0..560 span), this always matched the floor first, so the back-walk's `backLimit` anchored to the floor's own left edge and retreated the player clean off the platform, back down to floor height — missing the elevated alcove target entirely. Confirmed empirically: level-01's alcove drive landed the player at y:288 (floor height) instead of staying at y:208 (platform height).
- **Fix:** Disambiguated the candidate surface by the player's CURRENT feet height (`s.y + 32`), mirroring this same function's own `FROM_Y_TOL` takeoff-matching convention.
- **Files modified:** `scripts/lib/mechanic-drive.mjs`
- **Verification:** Real browser re-run after the fix showed the player correctly staying on the platform through the overshoot correction; full 8-level audit confirmed green.
- **Committed in:** `c9fdd69`

**2. [Rule 1 - Bug] driveAndDetectAlcove's vertical hop needed horizontal precision driveToXPlanned's arrival alone couldn't guarantee**
- **Found during:** Task 2, same real audit run
- **Issue:** `driveToXPlanned`'s arrival x is approximate by design — its jump arcs commonly over- or under-shoot a small point target (unlike the ~32px-wide floor triggers it was built to walk directly into). Even after the surface-disambiguation fix above, the player could land tens of pixels short of or past the alcove's own x-span, making the subsequent straight-up "check for a secret" hop miss it (a vertical jump has minimal horizontal drift).
- **Fix:** Added a bounded (3s max), grounded-only horizontal nudge loop in `driveAndDetectAlcove` that walks the player onto the alcove's own x-span (`encounter.x - 8 .. encounter.x + CONFIG.ALCOVE_SIZE`) before the vertical hop — a strict refinement of the already-reached landing spot, never new navigation.
- **Files modified:** `scripts/lib/mechanic-drive.mjs`
- **Verification:** Real browser run confirmed level-01's alcove now triggers/resolves; the full 8-level real audit (run twice) confirmed all 8 alcoves trigger/resolve.
- **Committed in:** `c9fdd69`

---

**Total deviations:** 2 auto-fixed (both Rule 1 — genuine bugs found only by the real browser run, not by static reasoning or the self-test)
**Impact on plan:** Both fixes were essential to satisfy this plan's own hard requirement ("no phase closes on greps alone — interactive proof required"); no scope creep, both scoped to `scripts/lib/mechanic-drive.mjs`, already in this plan's `files_modified` list.

## Issues Encountered

The first real `node scripts/audit-phase21-mechanics.mjs` run (immediately after Task 1's GREEN commit) reported `AUDIT: FAILURES DETECTED` for 5 of 8 levels' secret-alcove encounters (level-01, 02, 04, 07, 08), despite Task 1's self-test being fully green and all acceptance-criteria greps passing. This is precisely why this plan's Task 2 mandates a real browser run rather than accepting code-review of Task 1's logic alone — the synthetic self-test fixture (a single floor + single overlapping platform) never exercised `driveToXPlanned`'s "well past the target" overshoot-recovery code path in a way that revealed the surface-disambiguation bug, and no amount of static reasoning about the targetY threading alone would have caught it. Root-caused via a scratchpad debug script that isolated the exact drive sequence (resolve the preceding math-gate at x:150 first, then drive to the alcove, logging player x/y/grounded state every 300ms) — this made both bugs (surface disambiguation, and the need for a horizontal nudge before the vertical hop) directly observable. After both fixes, two independent full 8-level audit runs both came back fully green.

## User Setup Required

None - no external service configuration required. This plan is pure verification-harness engineering with no player-visible surface (per 30-CONTEXT.md's explicit scope boundary).

## Next Phase Readiness
- MECH-04's dynamic half is now fully satisfied: the interactive audit genuinely detects secret-alcove discovery on real level content across all 8 shipped levels, not just the plan's stated level-01 minimum bar.
- `deriveEncounters`, `driveAndDetectAlcove`, and the `targetY`-threading pattern established here (route-planner.mjs -> mechanic-drive.mjs -> audit-retry.mjs) are the concrete precedent 34-level-quality-pass and 36-world-motion-ambient-life can build on if they ever need to drive/detect another non-floor-level point target.
- No blockers for 30-01 (alcove/mover static reachability) or 30-03 (docs + integration verification) — this plan's changes are isolated to `scripts/lib/mechanic-drive.mjs`, `scripts/lib/route-planner.mjs`, and `scripts/lib/audit-retry.mjs`, disjoint from 30-01's validator/fixture files.

## Self-Check: PASSED

- FOUND: `scripts/lib/route-planner.mjs` exports `planTakeoffs` with the new `targetY` 4th param (`grep -n "targetY" scripts/lib/route-planner.mjs` shows the param + threading + self-test)
- FOUND: `scripts/lib/mechanic-drive.mjs` exports `driveAndDetectAlcove` (`grep -n "driveAndDetectAlcove" scripts/lib/mechanic-drive.mjs`)
- FOUND: `scripts/lib/audit-retry.mjs` imports and branches on `driveAndDetectAlcove`/`secret-alcove`
- FOUND: commit `2cd9c8d` (test: failing self-test, RED)
- FOUND: commit `fe65d5f` (feat: implementation, GREEN)
- FOUND: commit `c9fdd69` (fix: real-browser-run-exposed bugs)
- FOUND: `.planning/phases/30-harness-extensions/30-02-SUMMARY.md`

---
*Phase: 30-harness-extensions*
*Completed: 2026-07-10*
