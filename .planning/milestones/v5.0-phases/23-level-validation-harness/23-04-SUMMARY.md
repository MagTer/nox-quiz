---
phase: 23-level-validation-harness
plan: 04
subsystem: testing

tags: [reachability, bfs, jump-physics, level-validation, graph]

# Dependency graph
requires:
  - phase: 23-level-validation-harness (Plan 23-01)
    provides: the frozen, empirically-calibrated JUMP_ENVELOPE constant (maxRise=88.331, runSpeed=218.043, marginPct=0.05)
provides:
  - scripts/lib/reachability.mjs — Δy-aware jump-edge model + multi-hop BFS reachability, exporting checkLevelReachability's spawn-goal / gap-width / mechanic-reachability rows with PASS/WARN/HARD-FAIL tiering
affects: [23-level-validation-harness (Wave 3 validate-levels.mjs orchestrator), 24-fix-and-lengthen-levels]

# Tech tracking
tech-stack:
  added: []
  patterns: [chain-of-hops-BFS-reachability, path-tracking-BFS-for-margin-tiering]

key-files:
  created:
    - scripts/lib/reachability.mjs
  modified: []

key-decisions:
  - "marginRatio is computed as reach/theoreticalMaxReach at the SAME Δy using the SAME calibrated runSpeed for both — for any hop landing lower-or-flat (dy>=0, the vast majority of real gaps), only one positive root exists so marginRatio is trivially 1.0 (always WARN, never PASS). Implemented literally per the plan's formula; PASS is reachable only via the ascending-arc root when climbing to a higher platform (dy<0). Flagged for Phase 24 / 23-RESEARCH Open Question 2 as a likely retune target once real level fixes are attempted."
  - "bfsWithPathMargin (path-tracking BFS) is a first-discovered-path heuristic per the plan's own spec, not a true minimax-shortest-path search — matches the plan's explicit 'straightforward way' wording, sufficient for a pure connectivity + tiering question."

patterns-established:
  - "Chain-of-hops BFS reachability: nodes are floor runs + platforms, directed edges are jump-feasible hops tested via a Δy-aware quadratic reading the calibrated envelope, BFS proves multi-hop connectivity where single-hop heuristics fail"
  - "HARD-FAIL/WARN/PASS tiering via marginRatio: exact graph-disconnection or off-floor-run barriers are HARD-FAIL (unconditional facts); a connected-but-tight hop is WARN; never conflated"

requirements-completed: [VALID-01]

coverage:
  - id: D1
    description: "buildNodes/nodeContaining/jumpReach/canReach/buildGraph/bfsReachableSet implement a Δy-aware jump-edge graph consuming the calibrated JUMP_ENVELOPE (never a locally re-derived closed-form cutoff), proven against 4 synthetic cases including a 3-node multi-hop chain a direct single-hop test alone cannot cross"
    requirement: "VALID-01"
    verification:
      - kind: unit
        ref: "node scripts/lib/reachability.mjs (self-test, 4 Task-1 cases + omitted-platforms guard) — reachability-selftest: PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "checkLevelReachability composes the primitives into spawn-goal / gap-width / mechanic-reachability rows with HARD-FAIL/WARN/PASS tiering; WARN never increments hardFailCount; every row carries a non-empty descriptor; doors/mathGates/enemies/collectZones arrays are ??[]-guarded"
    requirement: "VALID-01"
    verification:
      - kind: unit
        ref: "node scripts/lib/reachability.mjs (self-test, 4 Task-2 synthetic cases + omitted-mechanic-arrays guard) — reachability-selftest: PASS"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-07-05
status: complete
---

# Phase 23 Plan 04: Reachability Graph & Orchestrator Summary

**Δy-aware jump-edge BFS reachability graph (`scripts/lib/reachability.mjs`) replacing Phase 22's flat, Δy-blind, single-hop heuristic — composes into `checkLevelReachability`'s spawn-goal/gap-width/mechanic-reachability rows with HARD-FAIL/WARN/PASS tiering, consuming the Wave 1 empirically-calibrated JUMP_ENVELOPE constant.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-07-05T23:40:00Z
- **Completed:** 2026-07-05T23:58:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Built `buildNodes`/`nodeContaining`/`jumpReach`/`canReach`/`buildGraph`/`bfsReachableSet`: a directed jump-edge graph where every edge test solves the real projectile-motion quadratic (`0.5*GRAVITY*t^2 - JUMP_FORCE*t - dy = 0`) using CONFIG's real physics constants for the time-of-flight algebra, but reads `maxRise`/`runSpeed` exclusively from the imported, empirically-calibrated `JUMP_ENVELOPE` constant — never a locally re-derived closed-form ceiling
- Proved the model is genuinely chain-of-hops (not Phase 22's single-hop-only heuristic): a synthetic 3-node fixture (floor A -> intermediate platform -> floor B) where the direct A->B gap alone exceeds the envelope but each individual hop is within it — `bfsReachableSet` finds B reachable from A even though `canReach(A, B)` alone returns `null`
- Composed the primitives into `checkLevelReachability(geometry, envelope)`, producing exactly the three ROADMAP-named check types (`spawn-goal`, `gap-width`, `mechanic-reachability`) with HARD-FAIL (exact graph-disconnection or off-floor-run barrier) vs WARN (path exists but its tightest hop used >= 90% of the calibrated envelope, named `WARN_MARGIN_RATIO`) vs PASS tiering — WARN rows never increment `hardFailCount`
- Self-tested against 8 synthetic cases total (4 per task) plus 2 never-brick guard checks (omitted `platforms` array, omitted `doors`/`mathGates`/`enemies`/`collectZones` arrays), all passing via the project's `check()`/failure-counter/`process.exit(1)` idiom
- Sanity-ran `checkLevelReachability` against all 4 real shipped levels (not part of this plan's required output — Wave 3's `validate-levels.mjs` owns the real RED-first proof) — it independently flags all 3 known over-hole mathGates plus 2 previously-suspected disconnected regions (level-02's goal, level-04's gap 1760..1960), confirming the module is functioning as the intended arbiter for Phase 22's structural defect inventory

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the Δy-aware jump-edge graph primitives** - `032ddbe` (feat)
2. **Task 2: Build the checkLevelReachability orchestrator with HARD-FAIL/WARN/PASS tiering** - `92a9826` (feat)

## Files Created/Modified
- `scripts/lib/reachability.mjs` - Δy-aware jump-edge graph (`buildNodes`, `nodeContaining`, `jumpReach`, `canReach`, `buildGraph`, `bfsReachableSet`) + the `checkLevelReachability` orchestrator (spawn-goal/gap-width/mechanic-reachability rows, `WARN_MARGIN_RATIO`, `SPAWN_X`), self-tested against 8 synthetic cases

## Decisions Made
- **marginRatio's degenerate 1.0 for descending/flat hops is a literal, faithful implementation of the plan's formula, not a bug:** `theoreticalMaxTAtThisDy` (the marginRatio denominator) and the sole valid candidate root for any `dy >= 0` hop are mathematically identical (both derived from `CONFIG.JUMP_FORCE`/`CONFIG.GRAVITY`, multiplied by the same `envelope.runSpeed`) — there is exactly one physically valid landing time when falling or landing flat, so `marginRatio` is always exactly `1.0` whenever such a hop succeeds, making it WARN rather than PASS. Only the ascending-arc root (climbing to a strictly higher platform, `dy < 0`, where BOTH roots can be positive) can produce a `marginRatio < 1`. Verified this is expected given the plan's literal formula (Task 2's own acceptance criteria and self-tests only require WARN-vs-HARD-FAIL correctness, not a PASS/WARN split on real flat gaps). Flagged here — matching 23-RESEARCH.md's own Open Question 2 — for whoever tunes `WARN_MARGIN_RATIO`/the marginRatio formula once Phase 24 attempts real level fixes and real playtesting data exists.
- **`bfsWithPathMargin` is a first-discovered-path heuristic, not a true min-max search:** matches the plan's own "straightforward way" framing; for a pure connectivity + tiering question (not a shortest-path optimization) this is sufficient and keeps the implementation a simple, auditable BFS variant rather than introducing weighted-graph machinery the roadmap doesn't ask for.
- **Split the single-file build into two atomic commits matching the plan's two tasks**, staging Task-1-only content first (functions + 4 synthetic self-test cases), verifying it independently, then adding Task 2's orchestrator + additional self-test cases as a second commit — preserves the project's one-commit-per-task convention even though both tasks land in the same file.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' acceptance criteria and verify commands passed without needing any Rule 1-4 fixes.

## Issues Encountered
- First attempt at the Task 1 multi-hop self-test fixture (Case 4) used platform/floor coordinates that happened to put the required reach outside both hops' candidate reach windows, causing a false self-test failure (`floor-B` not reachable via the intended chain). Root-caused by manually recomputing the quadratic roots for the chosen Δy values and re-picking coordinates that land within each hop's actual candidate reach — not a code bug, a fixture-authoring error, fixed before the first commit (no separate deviation-tracked commit needed since it never landed in a committed state).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `scripts/lib/reachability.mjs` exports everything Wave 3's `scripts/validate-levels.mjs` orchestrator needs (`checkLevelReachability`, importable with the default `JUMP_ENVELOPE` or an injected test envelope) to compose alongside `scripts/lib/over-hole-check.mjs` (Plan 23-03) for the full VALID-01 validator and the RED-first proof recorded in `23-FINDINGS.md`.
- Flag for Wave 3 / Phase 24: real levels 1-4 currently produce WARN (not PASS) on nearly every legitimate flat/descending gap-width and spawn-goal row, per this plan's "Decisions Made" note on marginRatio's degenerate 1.0 case — this doesn't block the validator (WARN never HARD-FAILs), but the orchestrator's report formatting and Phase 24's retune pass should expect a WARN-heavy baseline on currently-shipped, working gaps, not treat it as a regression.
- No blockers. HARD-FAIL rows already independently corroborate 3 of Phase 22's known structural defects (level-01 mathGates x600/x1300 over-hole, level-04 mathGate x1800 over-hole) plus flag 2 additional disconnected regions (level-02 goal, level-04 gap 1760..1960) for Wave 3's formal RED-first proof to confirm and document in `23-FINDINGS.md`.

## Addendum: Post-Plan Bug Fix (`canReach` overlap-span branch)

**Date:** 2026-07-06 (found and fixed after this plan and Plan 23-05 both closed, via
additional post-plan verification beyond the plan's committed acceptance criteria).

`canReach`'s branch handling OVERLAPPING x-spans (a platform positioned directly
above/within a floor run's x-range — a common, intentional level-design pattern) pinned
`spanMax = 0`, requiring an impossible exact-zero jump/fall reach (every real candidate's
`reach` is strictly > 0, per `rootsAndReaches`'s `t > 0` root filter). This made any two
x-overlapping nodes permanently mutually unreachable in the BFS graph regardless of Δy —
none of this plan's 8 synthetic self-test cases constructed two nodes with genuinely
overlapping x-spans AND a reachable dy, so the bug shipped undetected through both this
plan's and Plan 23-05's acceptance criteria.

**Real-world impact:** broke the graph edge for level-02's real, shipped opening staircase
(floor-0 -> platform-0 -> platform-1 -> platform-2 -> floor-1), producing false spawn-goal
and gap-width HARD-FAILs against a level Phase 21/22 had already confirmed
goal-completable via real interactive traversal.

**Fix:** `spanMax` is now the actual overlap width (`Math.min(fromNode.xEnd, toNode.xEnd) -
Math.max(fromNode.xStart, toNode.xStart)`), keeping `spanMin = 0`. A new self-test case
(Case 3b) covering this exact overlap scenario was added to `reachability.mjs`'s inline
self-test block. Commit: `de093aa` (`fix(23-04): correct overlapping-x-span reach window in
canReach`).

**Verification:** `node scripts/lib/reachability.mjs` still prints
`reachability-selftest: PASS`; the full static regression suite (`check-gate.sh`,
`check-import-safety.sh`, `check-safety.sh`, `smoke-progress.mjs`) remains green; zero
changes to `src/levels/*.js`. See `23-FINDINGS.md`'s "Post-Plan Correction" section for the
full before/after validator evidence.

---
*Phase: 23-level-validation-harness*
*Completed: 2026-07-05*

## Self-Check: PASSED

- FOUND: scripts/lib/reachability.mjs
- FOUND: 032ddbe (Task 1 commit)
- FOUND: 92a9826 (Task 2 commit)
- FOUND: fd8b1b8 (Summary commit)
