---
phase: 37-mobile-responsive-canvas-touch-controls
plan: 03
subsystem: input
tags: [kaplay, touch, input-seam, player, config, a727c13, mobile]

# Dependency graph
requires:
  - phase: 37-02
    provides: letterbox canvas migration (unified mouse+touch coordinate mapping the touch buttons will feed)
provides:
  - src/input.js — the ONE input seam ORing keyboard held-state with virtual-button state + a jump press/release edge registry
  - CONFIG.TOUCH tunables (LEFT/RIGHT/JUMP button rects >=64px, opacity, glyphs) for touchControls.js (37-06)
  - player.js reads movement + jump through the seam, so the LOCKED coyote/buffer/variable-height jump is the single shared path for keyboard and (future) touch
affects: [37-06 touch controls UI, touchControls.js, game.js scene-leave reset wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unified input seam (input.js): keyboard routed THROUGH the seam via initKeyboardJump so exactly one jump code path exists — no parallel touch jump implementation"
    - "a727c13 module-scope discipline extended to input.js: plain-data held-state + callback arrays at module scope; every isKeyDown/onKeyPress/onKeyRelease inside function bodies only (mirrors audio.js)"

key-files:
  created:
    - src/input.js
  modified:
    - src/config.js
    - src/player.js

key-decisions:
  - "initKeyboardJump() calls reset() before registering, so the module-scope jump-callback registry cannot accumulate across scene re-entries within this self-contained plan — keeping browser-boot's multi-level drive green without depending on 37-06's onSceneLeave reset wiring"
  - "CONFIG.TOUCH rects are authored in the internal 640x360 game space (letterbox maps taps into that space via the engine's single Qe transform), so X/Y/W/H are directly the AABB hit-test coordinates 37-06 will use"

patterns-established:
  - "Input OR-seam: isLeftHeld()/isRightHeld() OR the exact keyboard keys (left/a, right/d) with virtual-button booleans that are always false on desktop → desktop byte-identical"
  - "Jump edge registry: onJumpPress/onJumpRelease (register) + fireJumpPress/fireJumpRelease (invoke) — both keyboard and touch drive player.js's one buffer/coyote/variable-height body"

requirements-completed: [MOB-02]

coverage:
  - id: D1
    description: "src/input.js OR-seam: keyboard held-state ORed with virtual-button state (left/right) + jump press/release edge registry; a727c13-clean, no timers"
    requirement: MOB-02
    verification:
      - kind: integration
        ref: "bash scripts/check-import-safety.sh (a727c13 top-level engine-global trap)"
        status: pass
      - kind: integration
        ref: "bash scripts/check-safety.sh (SAFE-01 no-timer/forgiving)"
        status: pass
      - kind: other
        ref: "node --check src/input.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "CONFIG.TOUCH tunables with >=64px hit zones for LEFT/RIGHT/JUMP buttons"
    requirement: MOB-02
    verification:
      - kind: integration
        ref: "node -e CONFIG.TOUCH presence + W&H>=64 assertion (plan Task 1 verify)"
        status: pass
    human_judgment: false
  - id: D3
    description: "player.js reads movement + jump through the seam; keyboard feel byte-identical (paused guard, jump SFX, buffer, variable-height cut all preserved)"
    requirement: MOB-02
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs — keyboard drive + mouse audits, all 8 levels (desktop parity gate)"
        status: pass
      - kind: integration
        ref: "node scripts/validate-levels.mjs (level smoke)"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-07-19
status: complete
---

# Phase 37 Plan 03: Input Seam & CONFIG.TOUCH Summary

**src/input.js OR-seam merges keyboard + virtual-button input into one interface player.js consumes, so the LOCKED coyote/buffer/variable-height jump is reused verbatim by both keyboard and (future) touch; CONFIG.TOUCH lands the >=64px thumb-button tunables — desktop feel byte-identical (browser-boot green across all 8 levels).**

## Performance

- **Duration:** ~18 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Created `src/input.js`: the single input seam — `isLeftHeld()/isRightHeld()` OR the exact keyboard keys (left/a, right/d) with virtual-button booleans; a jump press/release edge registry (`onJumpPress/onJumpRelease` + `fireJumpPress/fireJumpRelease`); `initKeyboardJump(jumpKeys)` routes the keyboard through the same jump path; `reset()` anti-leak. a727c13-clean, zero timers.
- Added `CONFIG.TOUCH`: LEFT/RIGHT (bottom-left) + JUMP (bottom-right) button rects in 640×360 game space, all with W & H ≥ 64px, plus OPACITY/PRESSED_OPACITY/GLYPH_SIZE/GLYPHS — every tunable touchControls.js (37-06) needs, zero magic numbers deferred.
- Wired `src/player.js` to read movement and jump through the seam: horizontal run reads `input.isLeftHeld()/isRightHeld()`; buffer-set on `input.onJumpPress` (paused guard + jump SFX + BUFFER_MS preserved byte-for-byte); variable-height cut on `input.onJumpRelease` (vel.y<0 → *=JUMP_CUT, no timer).
- Proved desktop parity: `browser-boot.mjs` keyboard drive + mouse audits green across all 8 levels — the seam did not regress the kid-validated feel.

## Task Commits

1. **Task 1: CONFIG.TOUCH tunables + src/input.js seam** - `75c1115` (feat)
2. **Task 2: Wire player.js to read the seam (keyboard byte-identical)** - `f00f3ed` (feat)

## Files Created/Modified
- `src/input.js` (created) - The ONE input seam: keyboard/virtual OR for left/right + jump press/release edge registry + initKeyboardJump + reset.
- `src/config.js` (modified) - Added the `TOUCH` block (button rects ≥64px, opacity, glyphs).
- `src/player.js` (modified) - Movement + jump now flow through `input.js`; keyboard body byte-identical.

## Decisions Made
- **initKeyboardJump() resets the seam before registering.** The keyboard's `onKeyPress/onKeyRelease` app-bus controllers are auto-cancelled by `go()`, but input.js's module-scope callback arrays are not. Since `browser-boot` re-enters the game scene once per level (8 entries), an un-cleared registry would accumulate stale player closures and `fireJumpPress` would invoke destroyed-player callbacks. Having `initKeyboardJump` call `reset()` first guarantees each `makePlayer` starts from an empty registry → exactly one press + one release cb per scene. `reset()` remains exported for 37-06 to also wire on `onSceneLeave` (defence-in-depth). This is the plan's "registers cleanly" mandate made concrete; it keeps this self-contained plan's browser-boot green without depending on 37-06.
- **CONFIG.TOUCH rects authored in 640×360 game space** — the letterbox migration (37-02) maps taps into game space via the engine's single Qe transform, so the rects double as the AABB hit-test coordinates.

## Deviations from Plan

None - plan executed exactly as written. (The `initKeyboardJump`-calls-`reset()` detail is within the plan's Task 1 "registers cleanly" / anti-leak mandate, not a scope change; documented above under Decisions for traceability of the T-37-06 leak mitigation.)

## Issues Encountered
- `browser-boot.mjs` runs longer than a single 5-minute foreground window (it drives all 8 levels in a real browser); ran it in the background and polled to completion. Exit code 0, "Browser boot: PASS — title -> select -> all levels loaded with no runtime errors."

## Verification Results
- `bash scripts/check-import-safety.sh` — **PASS** (a727c13; new src/input.js is a727c13-clean)
- `bash scripts/check-safety.sh` — **PASS** (SAFE-01 no-timer; variable-height stays press/release edges)
- `node --check src/input.js` — **PASS**
- CONFIG.TOUCH presence + ≥64px hit-zone assertion — **PASS**
- `node scripts/validate-levels.mjs` — **PASS**
- `node scripts/browser-boot.mjs` — **PASS** (DESKTOP PARITY: keyboard drive + mouse audits, all 8 levels, no runtime errors)

## Threat Model Coverage
- **T-37-04** (parallel touch jump path re-derives physics): mitigated — keyboard routed THROUGH the seam; exactly one jump path; browser-boot parity green.
- **T-37-05** (stray timer trips SAFE-01): mitigated — variable-height stays press/release + vel.y sign; check-safety green.
- **T-37-06** (jump callback registry accumulates across scene re-entries): mitigated in this plan — `reset()` is invoked by `initKeyboardJump` on every clean mount; also exported for the 37-06 `onSceneLeave` wiring.

## Next Phase Readiness
- The seam is ready for 37-06 to build `src/ui/touchControls.js`: it drives `input.setLeftHeld/setRightHeld` per finger and calls `input.fireJumpPress/fireJumpRelease`, reusing player.js's locked jump physics.
- 37-06 should wire `input.reset()` on `game.js`'s `onSceneLeave` as the designed anti-leak point (already available; belt-and-suspenders alongside the init-time reset).

## Self-Check: PASSED
- `src/input.js` exists on disk — FOUND
- Commit `75c1115` (Task 1) — FOUND
- Commit `f00f3ed` (Task 2) — FOUND

---
*Phase: 37-mobile-responsive-canvas-touch-controls*
*Completed: 2026-07-19*
