---
phase: 25-levels-5-8-difficulty-ramp-select-grid
plan: 07
subsystem: testing
tags: [playwright, kaplay, level-validation, interactive-audit]

requires:
  - phase: 25-02
    provides: select-grid row/col navigation fix consumed by browser-boot.mjs/audit-phase21-mechanics.mjs
  - phase: 25-05
    provides: 2x4 select grid + row-aware cursor
  - phase: 25-06
    provides: 8-level registry + regression pins
provides:
  - Full 8-level automated regression + interactive-audit run, captured as evidence in 25-FINDINGS.md
  - Fixed browser-boot.mjs verticality-climb driver (was stalling indefinitely on levels 07/08)
  - Fixed route-planner.mjs mid-flight-obstruction routing for multi-hop mount chains
  - Fixed secretAlcove XP award not being rendered in the HUD (hud.refresh() now wired in)
  - Scope-limited human sign-off on the secret-alcove mechanic (level-01 only) and the select-grid's reachability (via automated audit, not human eyeballing)
affects: [26-grunge-palette-nox-run-rebrand, 28-full-verification-interactive-signoff]

tech-stack:
  added: []
  patterns:
    - "Segmented human-verify checkpoint executed inline (2-task plan, at/under workflow.inline_plan_threshold) rather than via subagent dispatch"

key-files:
  created:
    - .planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-FINDINGS.md
  modified:
    - scripts/browser-boot.mjs
    - scripts/lib/mechanic-drive.mjs
    - scripts/lib/route-planner.mjs
    - scripts/smoke-progress.mjs
    - src/levels/level-03.js
    - src/levels/level-04.js
    - src/levels/level-06.js
    - src/levels/level-07.js
    - src/mechanics/secretAlcove.js
    - src/scenes/game.js

key-decisions:
  - "Human sign-off for Task 2 accepted with explicitly reduced scope: only level-01's secret alcove was walked by the human, not all 8 alcoves and not the select-grid feel; the human judged the level-01 check sufficient and approved before completing the full checklist."
  - "Secret-alcove 'nothing visible happens beyond the XP tick' was confirmed as intended design (25-CONTEXT.md's 'no signposting' decision + build.js's opacity(0)), not a defect — but the human separately flagged the mechanic's value as questionable and a candidate for future removal/redesign (recorded as a STATE.md pending todo, not actioned this phase)."

patterns-established: []

requirements-completed: [LVL-02, LVL-03, LVL-04, LVL-05, LVL-06, MATH-01, MATH-02]

coverage:
  - id: D1
    description: "Full automated gate suite (check-gate/check-safety/check-import-safety/check-progress/validate-levels/browser-boot) green across all 8 levels"
    verification:
      - kind: integration
        ref: "bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "Interactive audit (audit-phase21-mechanics.mjs) shows zero triggered:false across all 8 levels, total encounters exceeding the pre-Phase-25 16-encounter/4-level baseline"
    verification:
      - kind: e2e
        ref: "node scripts/audit-phase21-mechanics.mjs — 36/36 triggered:true (34/36 resolved), see 25-FINDINGS.md (b)"
        status: pass
    human_judgment: false
  - id: D3
    description: "MATH-01/MATH-02 diff confirmation — LOCKED brain.js diff is exactly the one authorized literal, no level pool includes table 1"
    verification:
      - kind: other
        ref: "git diff 5eedee8 -- src/math/brain.js; grep -n allowedTables src/levels/level-*.js — see 25-FINDINGS.md (c)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Human sign-off on secret-alcove behavior and select-grid navigation feel"
    verification:
      - kind: manual_procedural
        ref: "25-FINDINGS.md (d) — human walked level-01's alcove only, confirmed XP+5, approved with explicitly reduced scope"
        status: pass
    human_judgment: true
    rationale: "Secret-alcove reward/freeze behavior and select-grid feel are explicitly excluded from both the static validator and the interactive audit (secretAlcove is not a checked kind) and require subjective human judgment; the human elected to verify level-01 only and approve on that basis rather than complete the full 8-level + grid-feel checklist — this is a real, human-authorized scope reduction, not an automation gap."

duration: spans 2026-07-07T01:12Z (Task 1 start) to 2026-07-07T15:55Z (Task 2 checkpoint resolved) across multiple sessions
completed: 2026-07-07
status: complete
---

# Phase 25 Plan 07: Full 8-Level Regression + Human Sign-off Summary

**Full 8-level automated suite green (36/36 interactive-audit encounters triggered), two real bugs fixed along the way (verticality-climb driver stall, silent alcove XP), and human sign-off closed on a human-authorized reduced scope (level-01 alcove only).**

## Performance

- **Duration:** Spans two sessions (Task 1: 2026-07-07 ~01:12–07:17; Task 2 checkpoint resolved 2026-07-07 ~15:55)
- **Started:** 2026-07-07T01:12:17Z
- **Completed:** 2026-07-07T15:55:00Z
- **Tasks:** 2 (Task 1: auto: full suite + FINDINGS.md; Task 2: checkpoint:human-verify: alcove + grid sign-off)
- **Files modified:** 10 (9 from Task 1's two commits + this SUMMARY/FINDINGS close-out)

## Accomplishments
- Ran the full automated gate suite (check-gate, check-safety, check-import-safety, check-progress, validate-levels, browser-boot) green across all 8 levels
- Interactive audit (`audit-phase21-mechanics.mjs`) shows 36/36 `triggered:true` across all 8 levels (34/36 `resolved`), well above the pre-Phase-25 16-encounter/4-level baseline
- Fixed `browser-boot.mjs`'s stale `driveToXClimbing` driver (was stalling indefinitely on level-07/08 verticality climbs) — swapped to `driveToXPlanned`
- Fixed `route-planner.mjs` to detect mid-flight obstructions and route through them as real multi-hop mount chains
- Fixed `secretAlcove.js`/`game.js`: XP was being silently awarded but never rendered in the HUD — wired in `hud.refresh()`
- Closed Task 2's blocking human-verify checkpoint on an explicit, reduced-scope human approval (level-01 alcove verified directly; remaining 7 alcoves and select-grid feel deferred, recorded honestly in 25-FINDINGS.md (d))

## Task Commits

1. **Task 1: Run the full automated suite across all 8 levels and write 25-FINDINGS.md** - `9e84a88` (fix) + `61f2169` (fix — HUD refresh follow-up found during human verification)
2. **Task 2: Human sign-off checkpoint** - documentation-only close-out, this commit (docs)

## Files Created/Modified
- `.planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-FINDINGS.md` - Full run evidence (a)-(c) plus human sign-off notes (d)
- `scripts/browser-boot.mjs` - Swapped retired climbing driver for `driveToXPlanned`
- `scripts/lib/route-planner.mjs` - Multi-hop mount-chain routing around mid-flight obstructions
- `scripts/lib/mechanic-drive.mjs` - Shorter dedicated jump hold for spike-kind takeoffs
- `scripts/smoke-progress.mjs` - Re-baselined geometry expectations
- `src/levels/level-03.js`, `level-04.js`, `level-06.js` - Raised low decorative platforms (ceiling-bonk hazard fix)
- `src/levels/level-07.js` - Removed 3 redundant stepping-stone platforms that intercepted jumps
- `src/mechanics/secretAlcove.js`, `src/scenes/game.js` - Wired `hud.refresh()` so alcove XP renders

## Decisions Made
- Human sign-off accepted with explicitly reduced scope (level-01 alcove only) rather than the full 8-alcove + grid-feel checklist the plan originally specified — a human decision, not an automation shortcut. See 25-FINDINGS.md (d) for the exact reasoning and what remains unverified by a human.
- Confirmed the alcove's "invisible, XP-only" behavior is working as specified (25-CONTEXT.md's binding "no signposting" decision), not a bug — but recorded the human's concern that the mechanic itself may be worth removing or redesigning later, as a STATE.md pending todo rather than in-scope work.

## Deviations from Plan

### Auto-fixed Issues (Task 1, pre-existing in prior commits — see 25-FINDINGS.md "Deviations found and fixed" for full list)

Five genuine bugs were found and fixed while running the full 8-level suite for the first time (browser-boot's stale driver, route-planner's obstruction blind spot, mechanic-drive's overlong spike hold, two low decorative platforms, three redundant level-07 stepping stones). Full detail in 25-FINDINGS.md; none weakened the acceptance bar.

**1. [Rule 1 - Auto-fix bugs] secretAlcove XP awarded but never rendered**
- **Found during:** Task 2 (human walkthrough of level-01's alcove)
- **Issue:** `progress.addBonusXp()` updated internal XP/level state correctly, but nothing called `hud.refresh()`, so the on-screen XP bar never moved even though the bonus was applied
- **Fix:** Passed `hud` into `wireSecretAlcove()` and called `hud.refresh()` (+ `hud.flashLevelUp()` on level-up) after the XP award, mirroring the goal's own `onReachGoal` idiom
- **Files modified:** `src/mechanics/secretAlcove.js`, `src/scenes/game.js`
- **Verification:** Human re-confirmed in the live checkpoint that the HUD XP display now visibly increments by 5 on touch
- **Committed in:** `61f2169`

---

**Total deviations:** 1 auto-fixed during Task 2 (on top of the 5 already fixed and documented as part of Task 1's own commit) — all bug fixes, no scope creep.
**Impact on plan:** All auto-fixes were required for the plan's own acceptance criteria (a working, HUD-visible alcove reward) or pre-existing correctness bugs surfaced by the first-ever full 8-level continuous run. No scope creep.

## Issues Encountered
- The human's first reaction to the (now-fixed) HUD update was surprise that "nothing happens" beyond the XP number — this was investigated and confirmed as intentional design (no visual marker, by explicit 25-CONTEXT.md decision), not a further bug. See 25-FINDINGS.md (d).
- Checkpoint was resolved with reduced verification scope by explicit human choice — see "Decisions Made" above and 25-FINDINGS.md (d) for the full accounting of what was and wasn't human-verified.

## Next Phase Readiness
- Phase 25's automated success criteria are fully met (8-level validator/audit green, MATH-01/MATH-02 diff confirmed, select grid reachable).
- LVL-06 (secret alcove) is implemented and working as specified, but its long-term value is now an open design question — flagged as a pending todo, not a blocker, for whoever next touches level content or mechanics.
- Phase 26 (Grunge Palette & Nox Run Rebrand) can proceed; nothing in this plan's scope-reduced sign-off blocks it.

---
*Phase: 25-levels-5-8-difficulty-ramp-select-grid*
*Completed: 2026-07-07*
