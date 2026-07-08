---
phase: 27-audio-adhd-safe-sound
plan: 04
subsystem: audio
tags: [kaplay, sfx, audio-seam, mechanics]

# Dependency graph
requires:
  - phase: 27-audio-adhd-safe-sound (plan 01)
    provides: "assets/sfx/door.ogg, clear.ogg, pickup.ogg — vendored CC0 SFX files"
  - phase: 27-audio-adhd-safe-sound (plan 02)
    provides: "src/audio.js — the ONE audio seam: playSfx(name, vol) and friends"
provides:
  - "src/mechanics/door.js: audio.playSfx(\"door\") in onSuccess, before unfreezing the player"
  - "src/mechanics/gates.js: audio.playSfx(\"door\") in onSuccess, reusing the same cue"
  - "src/ui/mathGate.js: audio.playSfx(\"clear\") in the celebration block"
  - "src/mechanics/collect.js: audio.playSfx(\"pickup\") on correct pickup touch"
affects: [27-05, "any future plan wiring additional mechanic-specific SFX"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mechanic-specific SFX called from the mechanic's own onSuccess/celebration callback, layered ADDITIONALLY on top of challenge.js's shared correct/wrong chime — never replacing it"
    - "Reused SFX name (\"door\") across two distinct mechanics (door.js, gates.js) per CONTEXT.md's explicit direction that door/gate unlocks share one unlock cue"

key-files:
  created: []
  modified: [src/mechanics/door.js, src/mechanics/gates.js, src/ui/mathGate.js, src/mechanics/collect.js]

key-decisions:
  - "Fixed a wrong import path in the plan's Task 2 action text: mathGate.js (src/ui/) importing audio.js (src/) requires \"../audio.js\", not the plan-specified \"./audio.js\" (which would resolve to a nonexistent src/ui/audio.js) — Rule 3 auto-fix (blocking issue, wrong import path)"

patterns-established: []

requirements-completed: [AUD-01]

coverage:
  - id: D1
    description: "Door and checkpoint-gate unlocks each play the same distinct \"door\" unlock SFX, separate from the shared correct-chime"
    requirement: "AUD-01"
    verification:
      - kind: unit
        ref: "node --check src/mechanics/door.js src/mechanics/gates.js && grep audio.playSfx(\"door\") in both files, no playSfx(\"correct\"/\"wrong\") in either (27-04-PLAN.md Task 1 verify command) — pass"
        status: pass
    human_judgment: false
  - id: D2
    description: "Level-clear plays a calm \"clear\" SFX, distinct from both \"correct\" and \"door\""
    requirement: "AUD-01"
    verification:
      - kind: unit
        ref: "node --check src/ui/mathGate.js && grep audio.playSfx(\"clear\"), no addXp regression (27-04-PLAN.md Task 2 verify command) — pass"
        status: pass
    human_judgment: false
  - id: D3
    description: "Collecting the correct pickup plays a \"pickup\" SFX, distinct from the correct-chime; wrong-pickup path unchanged (no new SFX)"
    requirement: "AUD-01"
    verification:
      - kind: unit
        ref: "node --check src/mechanics/collect.js && grep audio.playSfx(\"pickup\") inside if(correct) branch only (27-04-PLAN.md Task 3 verify command) — pass"
        status: pass
    human_judgment: false
  - id: D4
    description: "All four SFX call sites are audible/distinct in an actual browser session (not just grep-proven wiring)"
    verification: []
    human_judgment: true
    rationale: "This plan wires the call sites at the code level only, per its own <verification> section (node --check + grep + check-safety.sh/check-progress.sh). No interactive audio-driving browser script exists yet in this repo (Playwright cannot assert on WebAudio output). Genuine human/interactive audible sign-off across door/gate/clear/pickup remains an open item for this phase's closing plan or Phase 28's final verification pass."

duration: 3min
completed: 2026-07-08
status: complete
---

# Phase 27 Plan 04: Mechanic-Specific SFX Layering Summary

**Layered four distinct mechanic SFX (door/gate unlock, level-clear, pickup) on top of the existing shared correct/wrong chime from Plan 27-03, each fired from its own mechanic's onSuccess/celebration callback rather than duplicated inside challenge.js.**

## Performance

- **Duration:** ~3 min (task commits span 07:41:52Z → 07:42:34Z)
- **Started:** 2026-07-08T07:41:00+02:00 (approx)
- **Completed:** 2026-07-08T07:42:34+02:00
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `src/mechanics/door.js` and `src/mechanics/gates.js` both import `audio.js` and call `audio.playSfx("door")` in their `onSuccess` callback, after `fx.clearBurst()` and before `destroy()` — reusing the identical "door" cue across both mechanics per CONTEXT.md's explicit direction
- `src/ui/mathGate.js` imports `audio.js` and calls `audio.playSfx("clear")` right after the "LEVEL CLEAR" celebration banner's `add()` calls and before `onClear?.()` — confirmed no `addXp` regression (mathGate.js stays XP-free)
- `src/mechanics/collect.js` imports `audio.js` and calls `audio.playSfx("pickup")` as the first statement in the correct-pickup branch, before `cleared.add(zoneObj)` — the wrong-pickup `else` branch is untouched (no punishment SFX)
- Neither door.js, gates.js, nor collect.js calls `playSfx("correct")`/`playSfx("wrong")` — that stays exclusively in challenge.js's `choose()` (Plan 27-03), confirmed by negative grep
- Full `node --check` across all 4 modified files, plus `bash scripts/check-safety.sh` and `bash scripts/check-progress.sh`, both green with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire door + gate unlock SFX** - `734b754` (feat)
2. **Task 2: Wire level-clear SFX** - `d3e940e` (feat)
3. **Task 3: Wire pickup SFX** - `6d90e9a` (feat)

**Plan metadata:** (this commit, see below)

_Note: In worktree mode, STATE.md/ROADMAP.md are NOT updated by this executor — the orchestrator owns those writes after all wave agents complete._

## Files Created/Modified
- `src/mechanics/door.js` - Added `audio.js` import; `audio.playSfx("door")` fired in `onSuccess`, after `fx.clearBurst()`, before `destroy(doorObj)`
- `src/mechanics/gates.js` - Added `audio.js` import; `audio.playSfx("door")` fired in `onSuccess`, after `fx.clearBurst()`, before `destroy(gateObj)` — same cue reused deliberately
- `src/ui/mathGate.js` - Added `audio.js` import (via `"../audio.js"`, corrected from the plan's `"./audio.js"`); `audio.playSfx("clear")` fired after the LEVEL CLEAR banner's `add()` calls, before `onClear?.()`
- `src/mechanics/collect.js` - Added `audio.js` import; `audio.playSfx("pickup")` fired as the first statement of the `if (correct)` branch in the `answer-pickup-slot` collision handler

## Decisions Made
- Reused the identical "door" SFX name across door.js and gates.js per the plan's explicit direction (CONTEXT.md: "Door/gate open: short distinct unlock cue... separate from the correct-chime") — one cue, two call sites, deliberate design not an oversight
- collect.js's "pickup" SFX stands in for both the "you touched something" and "you got it right" roles at once, since collect.js never routes through challenge.js's `choose()` (it uses `renderChoices:false`) and thus has no existing "correct" call to avoid duplicating

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Fixed wrong import path in mathGate.js**
- **Found during:** Task 2 (Wire level-clear SFX)
- **Issue:** The plan's action text specified `import * as audio from "./audio.js";` for `src/ui/mathGate.js`, reasoning that "mathGate.js lives in src/ui/, so the sibling audio.js import is './audio.js' ... same directory as challenge.js." This is incorrect — `audio.js` was created at `src/audio.js` by Plan 27-02 (confirmed via `find` and the 27-02-SUMMARY.md's own `key-files.created: [src/audio.js]`), not `src/ui/audio.js`. A literal `"./audio.js"` import from `src/ui/mathGate.js` would resolve to a nonexistent module and throw at import time.
- **Fix:** Used `import * as audio from "../audio.js";` instead — the correct relative path from `src/ui/` up to `src/`, matching the same pattern already used correctly by door.js/gates.js/collect.js (all in `src/mechanics/`, one level below `src/`) and by mathGate.js's own existing `import { CONFIG } from "../config.js";` line immediately above it.
- **Files modified:** `src/ui/mathGate.js`
- **Verification:** `node --check src/ui/mathGate.js` passes; the plan's own Task 2 verify command (`grep -q 'import \* as audio from "./audio.js"'`) would have failed against the corrected code, so this SUMMARY's D2 coverage row instead documents the corrected, working import path and re-ran the substantive checks (syntax, `playSfx("clear")` present, no `addXp`) — all pass.
- **Committed in:** `d3e940e` (part of Task 2's commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking issue, wrong import path)
**Impact on plan:** Necessary for correctness — the plan's literal import path would have thrown ReferenceError at module load, blanking the game (a727c13-class failure). No scope creep; the fix is a one-line path correction with no behavioral difference from the plan's intent.

## Issues Encountered

None beyond the import-path deviation documented above.

## User Setup Required

None - no external service configuration required. All SFX assets were already vendored by Plan 27-01 and the `audio.js` seam already exists from Plan 27-02; this plan only adds call sites.

## Next Phase Readiness

- All four mechanic-specific SFX call sites (door, gate, clear, pickup) are wired and pass their individual acceptance criteria, plus the plan-level `check-safety.sh`/`check-progress.sh` gates
- Genuine interactive/audible verification of these four SFX cues (confirming they are actually distinct-sounding and non-startling in a real browser session) remains outstanding — no Playwright script in this repo currently asserts on WebAudio output. This is consistent with 27-02-SUMMARY.md's own carried-forward concern that the full audible/interactive proof of AUD-01..04 is deferred until a later plan in this phase (or Phase 28's closing verification) actually drives the game with sound enabled.
- No blockers for Plan 27-05 or subsequent phase-closing work.

## Self-Check: PASSED

- FOUND: src/mechanics/door.js (audio.playSfx("door") present, node --check passes)
- FOUND: src/mechanics/gates.js (audio.playSfx("door") present, node --check passes)
- FOUND: src/ui/mathGate.js (audio.playSfx("clear") present, node --check passes)
- FOUND: src/mechanics/collect.js (audio.playSfx("pickup") present, node --check passes)
- FOUND commit 734b754 (git log --oneline)
- FOUND commit d3e940e (git log --oneline)
- FOUND commit 6d90e9a (git log --oneline)
- bash scripts/check-safety.sh: PASS
- bash scripts/check-progress.sh: PASS

---
*Phase: 27-audio-adhd-safe-sound*
*Completed: 2026-07-08*
