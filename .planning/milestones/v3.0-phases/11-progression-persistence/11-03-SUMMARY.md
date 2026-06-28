---
phase: 11-progression-persistence
plan: 03
subsystem: ui
tags: [kaplay, hud, xp, leveling, canvas, adhd-safe]

# Dependency graph
requires:
  - phase: 11-progression-persistence (Wave 0)
    provides: CONFIG.HUD layout constants (X, Y, BADGE_SIZE, BAR_W, BAR_H, BAR_DY, FLASH_SIZE, FLASH_MS=450)
  - phase: 11-progression-persistence (Wave 1)
    provides: src/progress.js — createProgress() with getLevel()/getXp()/nextThreshold() one-way read API
  - phase: 11-progression-persistence (Wave 2)
    provides: src/scenes/game.js — already imports mountHud and calls hud.refresh()/hud.flashLevelUp()
  - phase: 10-math-gate-integration
    provides: src/ui/mathGate.js — the fixed()-overlay idiom + anti-leak tag/destroy pattern mirrored here
provides:
  - "src/ui/hud.js — fixed Kaplay HUD: level badge + XP fill bar (SAVE-04)"
  - "mountHud(progress) factory returning { refresh, flashLevelUp }"
  - "ADHD-safe self-destroying level-up flash (opacity tween over FLASH_MS=450ms)"
affects: [phase-12-juice-polish, the-platformer-uat]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixed camera-immune HUD overlay (fixed() + high z()) reusing the mathGate dark-grunge palette"
    - "One-way read-only view of a progression tracker (no write-back into progress)"
    - "Factory-mounted, tag-and-destroy anti-leak HUD that survives scene replays"
    - "No-timer self-destroying flash via tween(...).onEnd(destroy)"

key-files:
  created:
    - src/ui/hud.js
  modified: []

key-decisions:
  - "Banned-token prose avoidance: rewrote the one-way-contract comments so the literal strings 'progress.addXp' and 'progress.level =' never appear even in prose, because check-progress.sh assertion 8 greps the source file (not just code) and the script header mandates banned tokens live only inside the matcher patterns."
  - "flashLevelUp uses tween(...).onEnd(() => destroy(banner)) — Kaplay's TweenController exposes onEnd; this keeps the flash self-cleaning with no setInterval/setTimeout (ADHD-safe, no-timer canon)."
  - "fill.width is clamped to >=1px and frac clamped to [0,1] with a 0-threshold guard so the bar is always visible and never NaN."

patterns-established:
  - "HUD one-way contract: reads getLevel()/getXp()/nextThreshold(), never mutates the tracker"
  - "Two tags — 'hud' (persistent badge/track/fill) and 'hud-flash' (transient banner) — both destroyed on scene teardown"

requirements-completed: [SAVE-04]

# Metrics
duration: ~20min
completed: 2026-06-27
status: complete
---

# Phase 11 Plan 03: Fixed Kaplay HUD + Level-Up Moment Summary

**A fixed, camera-immune Kaplay HUD (neon-green level badge + XP fill bar toward the next-level threshold) that reads progress one-way, plus a brief ADHD-safe self-destroying "LEVEL UP" flash — the SAVE-04 deliverable.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-06-27T19:40:19Z
- **Tasks:** 1 buildable task complete (Task 2 is a human browser play-test — deferred to the orchestrator/UAT)
- **Files modified:** 1 created

## Accomplishments

- `src/ui/hud.js` created — `mountHud(progress)` factory returning `{ refresh, flashLevelUp }`.
- Fixed (`fixed()` + `z(9000/9001)`) HUD: a "LVL N" badge and a #333 XP track with a neon-green fill rect. Dark-grunge palette reused verbatim from mathGate.js. No pink. No DOM (pure canvas `text()`/`rect()`).
- One-way read contract honored: the HUD reads `progress.getLevel()/getXp()/nextThreshold()` and never awards XP or assigns the tracker's level/xp. `check-progress.sh` assertion 8 (the negative one-way grep) passes.
- `refresh()` syncs badge text and fill width: `fill.width = max(1, BAR_W * min(1, getXp()/nextThreshold()))`.
- `flashLevelUp()` shows a centered "LEVEL UP" banner (`z(9500)`, tagged `"hud-flash"`) that fades 1→0 over `CONFIG.HUD.FLASH_MS` (450ms — ADHD-safe, NOT the archive's 800) via `easeOutQuad`, then self-destroys on tween end. No scale-bomb, no lingering banner, no timer.
- Anti-leak: factory (no module-level mutable state), tagged `"hud"`/`"hud-flash"`, mounted inside the scene closure → destroyed by KAPLAY on scene teardown; replay-safe.
- Matches the call site already wired in `src/scenes/game.js` Wave 2 (`import { mountHud }`, `hud.refresh()` on entry + after each XP award, `hud.flashLevelUp()` when `addXp` returned a level-up).
- `scripts/check-progress.sh` now prints `progress checks: PASS` (it previously failed only on the missing `src/ui/hud.js`). `smoke-progress.mjs` still PASS.

## Task Commits

1. **Task 1: Create src/ui/hud.js — fixed level badge + XP bar (one-way) + level-up flash** — `341b596` (feat)

## Files Created/Modified

- `src/ui/hud.js` (127 lines) — fixed Kaplay HUD: level badge, XP track + fill, one-way `refresh()`, self-destroying `flashLevelUp()`; engine-global discipline (Kaplay primitives are bare globals, only CONFIG imported).

## Decisions Made

- **Banned-token prose avoidance (one-fix during Task 1):** my initial draft described the one-way contract with the literal strings `progress.addXp` and `progress.level / progress.xp` in comments. `check-progress.sh` assertion 8 greps the whole file with `progress\.(addXp|level[[:space:]]*=)` and the script header explicitly mandates that banned tokens appear ONLY inside the matcher patterns, never in matched source even as prose. I rewrote the two comment blocks (header one-way contract + flashLevelUp docstring) to convey the same contract without the literal banned substrings. This is a verification-correctness fix, not a behavior change — see Deviations.
- **`tween(...).onEnd(destroy)`** for the self-cleaning flash — confirmed Kaplay 3001.0.19's TweenController exposes `onEnd`. Keeps the no-timer (no setInterval/setTimeout) discipline of the gate.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed banned token strings from HUD comments so the structural gate passes**
- **Found during:** Task 1 (verification)
- **Issue:** Documentation comments contained the literal strings `progress.addXp` and `progress.level / progress.xp`, which the `check-progress.sh` assertion-8 grep (`progress\.(addXp|level[[:space:]]*=)`) matches anywhere in the file — including prose — causing the gate to FAIL even though no actual write-back exists. The script header mandates banned tokens live only inside its matcher patterns.
- **Fix:** Reworded the header one-way-contract comment and the `flashLevelUp` docstring to convey the same one-way/never-mutate contract without the literal banned substrings.
- **Files modified:** src/ui/hud.js
- **Verification:** `grep -nE 'progress\.(addXp|level[[:space:]]*=)' src/ui/hud.js` returns nothing; `bash scripts/check-progress.sh` prints `progress checks: PASS`.
- **Committed in:** 341b596 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** Necessary to make the mandated structural gate green; no behavior change, no scope creep.

## Issues Encountered

None beyond the deviation above. Verified Kaplay's tween controller exposes `onEnd` in the bundled `lib/kaplay.mjs` (v3001.0.19) before relying on it.

## Human Verify (Task 2) — DEFERRED to the orchestrator / phase UAT

Task 2 is a `checkpoint:human-verify` (gate="blocking") browser play-test. The buildable
work (Task 1) is complete and the full automated gate is green. The interactive browser
confirmation is folded into the phase UAT for the orchestrator to run WITH THE USER. Present
these six checks (the developer types "approved" only after confirming all six):

1. **SAVE-04 (visible HUD):** Serve over HTTP — `python3 -m http.server 8000` from the repo
   root, open `http://localhost:8000/index.html`. Confirm a "LVL 1" badge + an XP bar are
   visible top-left, dark-grunge, NO pink.
2. **SAVE-01 (earn XP + level up):** Reach the goal, answer the math gate correctly → the XP
   bar fills. Repeat clears until a threshold crosses → a brief (~450ms) "LEVEL UP" flash
   appears and the badge increments to "LVL 2". A WRONG answer awards no XP (bar does not
   move) and never ends the run.
3. **SAVE-02/03 (persist + resume):** After earning XP / leveling, close the tab, reopen →
   the badge/bar show the prior level/XP. DevTools → Application → Local Storage: a
   `mathlab_platformer_v1` key exists with `version` + xp/level/accuracy — and NO
   coins/position keys.
4. **SAVE-03 (adaptation resume):** Answer one weak table (e.g. 7×) wrong several times, let
   it persist (clear once or just close — onHide saves), reload → that table keeps appearing
   more often (weak-spot weighting resumed).
5. **ADHD-safety:** The level-up flash is short and not over-stimulating (no big scale-bomb,
   no lingering banner).
6. **Resume signal:** Developer types "approved" if all six check out, else describes what
   looked wrong.

**Automated portion of Task 2 (already green):** `bash scripts/check-progress.sh` →
`progress checks: PASS`; `node scripts/smoke-progress.mjs` → `smoke-progress: PASS`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- SAVE-04 (visible progression + level-up moment) is built and wired; the full Phase 11
  progression loop (earn → level → persist → resume XP + adaptation) is code-complete and
  passes the structural + headless gates.
- The only remaining item is the human browser play-test (Task 2), folded into the phase UAT.
- Phase 12 (juice/polish) owns final flash/visual tuning; the HUD reads all layout from
  `CONFIG.HUD` so retuning stays in one file.

## Self-Check: PASSED

- `src/ui/hud.js` exists (FOUND).
- Commit `341b596` exists in git log (FOUND).

---
*Phase: 11-progression-persistence*
*Completed: 2026-06-27*
