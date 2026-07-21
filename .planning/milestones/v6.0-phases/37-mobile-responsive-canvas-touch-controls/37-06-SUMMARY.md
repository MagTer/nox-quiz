---
phase: 37-mobile-responsive-canvas-touch-controls
plan: 06
subsystem: input
tags: [kaplay, touch, virtual-buttons, multi-touch, input-seam, mobile, a727c13, MOB-02]

# Dependency graph
requires:
  - phase: 37-03
    provides: src/input.js OR-seam (setLeftHeld/setRightHeld + fireJumpPress/fireJumpRelease + reset) and CONFIG.TOUCH button rects/opacity/glyphs
  - phase: 37-02
    provides: letterbox canvas migration — unified mouse+touch coordinate mapping (Qe) the buttons hit-test against
provides:
  - src/ui/touchControls.js — mountTouchControls(isFrozen): coarse-pointer-gated left/right/jump virtual buttons feeding the input seam; per-identifier multi-touch; returns a teardown handle
  - game.js mount (() => player.paused pause-getter) + onSceneLeave teardown + input.reset()
  - scripts/touch-controls-drive.mjs — Playwright touch-drive proof (move/jump/variable-height/multi-touch + desktop-absent)
affects: [MOB-03 tappable UI already lands via touchToMouse, MOB-06 on-device tuning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Touch-only UI via matchMedia('(pointer: coarse)') feature-detect (NOT UA-sniff, NOT isTouchscreen) — desktop mounts nothing → byte-identical"
    - "Per-identifier multi-touch: Map<Touch.identifier, buttonName> populated on onTouchStart / cleared on onTouchEnd; NO onTouchCancel (engine routes DOM touchcancel to the same touchEnd KEvent)"
    - "Touch feeds the ONE input.js seam (fireJumpPress/Release + setLeft/RightHeld) — LOCKED coyote/buffer/variable-height jump reused, never re-implemented; variable height is press/release edges, zero timers"
    - "CDP Input.dispatchTouchEvent (distinct touchPoint ids) drives held + simultaneous multi-touch in the Playwright harness — page.touchscreen.tap cannot hold or press two fingers"

key-files:
  created:
    - src/ui/touchControls.js
    - scripts/touch-controls-drive.mjs
  modified:
    - src/scenes/game.js

key-decisions:
  - "Mounted touch controls AFTER makePlayer (not at the audio.wireAudioUI region) so the pause-getter can close over the live player: mountTouchControls(() => player.paused). The module self-gates on pointer:coarse, so on desktop it is still a harmless no-op regardless of mount position."
  - "Movement held-state writes are gated on isFrozen() (challenge-pause-aware); jump forwards the raw press edge because player.js's onJumpPress already guards player.paused (a jump while frozen is a no-op there) — so the freeze is airtight without duplicating the guard."
  - "Release (setLeftHeld/RightHeld(false), fireJumpRelease) is always forwarded even when frozen — clearing held-state is always safe; only SETTING true is gated."
  - "onTouchMove intentionally omitted (plan-optional): a finger sliding off a held button is a minor UX nuance, not a correctness bug, and adding it widens the edge-case surface. onTouchStart/onTouchEnd fully cover press/release + cancellation."

requirements-completed: [MOB-02]

coverage:
  - id: MOB-02-UI
    description: "Coarse-pointer-only left/right/jump virtual buttons (>=64px from CONFIG.TOUCH) feed the input seam; desktop never mounts them"
    requirement: MOB-02
    verification:
      - kind: e2e
        ref: "node scripts/touch-controls-drive.mjs — touch context get('touchctl')=6 mounted; desktop context get('touchctl')=0"
        status: pass
      - kind: e2e
        ref: "node scripts/browser-boot.mjs — desktop parity, all 8 levels + mouse audits green (buttons absent)"
        status: pass
  - id: MOB-02-JUMP
    description: "Jump reuses the LOCKED variable-height physics via the seam (press/release edges, no timer)"
    requirement: MOB-02
    verification:
      - kind: e2e
        ref: "touch-drive: tap-rise=60.1px, held-rise=93.3px — held clears tap by a real margin (variable height proven)"
        status: pass
      - kind: integration
        ref: "bash scripts/check-safety.sh (SAFE-01 no-timer)"
        status: pass
  - id: MOB-02-MULTITOUCH
    description: "Per-identifier multi-touch — left+jump held simultaneously moves AND rises"
    requirement: MOB-02
    verification:
      - kind: e2e
        ref: "touch-drive multi(dx=-139.2px, rise=93.6px) — distinct CDP touch ids on LEFT and JUMP both drive the player"
        status: pass
  - id: MOB-02-ANTILEAK
    description: "Torn down + input.reset() on scene leave; a727c13-clean"
    requirement: MOB-02
    verification:
      - kind: integration
        ref: "bash scripts/check-import-safety.sh (a727c13)"
        status: pass
      - kind: e2e
        ref: "browser-boot round-trip title->select re-entry + all-level drive with no leaked handlers/errors"
        status: pass

# Metrics
duration: 32min
completed: 2026-07-19
status: complete
---

# Phase 37 Plan 06: Touch Controls UI & Drive Harness Summary

**On-screen left/right/jump virtual buttons (src/ui/touchControls.js) render only on coarse-pointer devices and feed the src/input.js seam, so a phone player runs and jumps through player.js's LOCKED coyote/buffer/variable-height physics — never a parallel jump path; per-identifier multi-touch lets left+jump work at once, and a Playwright CDP touch-drive harness proves tap-jump/held-jump-higher/move/multi-touch headlessly while desktop mounts zero buttons (browser-boot byte-identical).**

## Performance
- **Duration:** ~32 min
- **Completed:** 2026-07-19
- **Tasks:** 3 (2 files created, 1 modified)

## Accomplishments
- Created `src/ui/touchControls.js`: `mountTouchControls(isFrozen)` feature-detects `matchMedia("(pointer: coarse)")` FIRST — on a fine-pointer desktop it returns a no-op teardown handle and draws nothing. On touch it draws 3 `fixed()`+high-`z()` dark-grunge semi-transparent buttons (PALETTE.MUTED fill + outline, centered glyphs) at CONFIG.TOUCH.LEFT/RIGHT/JUMP (all ≥64px), tracks a closure-local `Map<Touch.identifier, name>`, and wires `onTouchStart`/`onTouchEnd` (no `onTouchCancel` — it isn't a Kaplay 3001 global; the engine routes DOM touchcancel to the same `touchEnd` event) to drive `input.setLeftHeld/setRightHeld` (held, challenge-pause-gated) and `input.fireJumpPress/fireJumpRelease` (jump edges → reused variable height). Returns a teardown that cancels both controllers, clears the map, and `destroyAll("touchctl")`. a727c13-clean, zero timers.
- Wired `src/scenes/game.js`: imports `mountTouchControls` + the input seam; mounts `mountTouchControls(() => player.paused)` right after `makePlayer` (live pause-getter); adds `touchControls.destroy()` + `input.reset()` to the existing `onSceneLeave` sweep (anti-leak T-37-06).
- Created `scripts/touch-controls-drive.mjs`: dup'd browser-boot's hardened loopback/ROOT-clamped server + `resolvePlaywright()` + ephemeral port. A TOUCH context (hasTouch/isMobile) drives into a level and, via CDP `Input.dispatchTouchEvent` with distinct touch ids, proves tap-jump rises, held-jump rises higher (variable height), RIGHT moves the player, and LEFT+JUMP multi-touch moves-and-rises; a second DESKTOP context proves zero buttons mount.

## Task Commits
1. **Task 1: src/ui/touchControls.js — buttons + per-identifier multi-touch** — `2538689` (feat)
2. **Task 2: Mount + teardown in game.js** — `a112e6b` (feat)
3. **Task 3: Playwright touch-drive harness** — `2777db2` (test)

## Files Created/Modified
- `src/ui/touchControls.js` (created) — coarse-pointer-gated virtual buttons feeding the input seam; per-identifier multi-touch; teardown handle.
- `src/scenes/game.js` (modified) — mount (pause-getter) + onSceneLeave teardown + input.reset().
- `scripts/touch-controls-drive.mjs` (created) — CDP touch-drive proof (move/jump/variable-height/multi-touch + desktop-absent).

## Deviations from Plan
None — plan executed as written. The plan permitted mounting "near audio.wireAudioUI()" OR after makePlayer; mounting after makePlayer was chosen so the challenge-pause getter can read the live `player` (documented under Decisions). onTouchMove was left out per its plan-optional status (documented under Decisions).

## Threat Model Coverage
- **T-37-04** (parallel touch jump re-derives locked physics): mitigated — buttons only call `fireJumpPress/Release`; touch-drive proves held-jump (93.3px) clears tap-jump (60.1px), matching the seam's variable-height cut.
- **T-37-06** (held-state / controllers leak across scene re-entries): mitigated — `onSceneLeave → touchControls.destroy()` (cancels onTouchStart/End + `destroyAll("touchctl")`) + `input.reset()`; browser-boot round-trip + all-level drive green.
- **T-37-10** (buttons shown on desktop breaks byte-identical): mitigated — `matchMedia('(pointer: coarse)')` gate; touch-drive desktop context get('touchctl')=0 and browser-boot fully green.
- **T-37-05** (a hold-to-jump timer trips SAFE-01): mitigated — press/release edges only; check-safety green.
- **T-37-01** (drive-harness path traversal): mitigated — dup'd ROOT-clamped + loopback-bound server verbatim.

## Verification Results
- `bash scripts/check-import-safety.sh` — **PASS** (a727c13; touchControls.js + game.js engine globals inside function bodies)
- `bash scripts/check-safety.sh` — **PASS** (SAFE-01 no-timer)
- `node --check src/ui/touchControls.js` / `src/scenes/game.js` / `scripts/touch-controls-drive.mjs` — **PASS**
- `node scripts/browser-boot.mjs` — **PASS** (DESKTOP PARITY: all 8 levels + mouse/keyboard audits, no runtime errors; buttons absent)
- `node scripts/touch-controls-drive.mjs` — **PASS** (touchctl=6; tap-rise=60.1px; held-rise=93.3px > tap; right-dx=139.2px; multi dx=-139.2px, rise=93.6px; desktop touchctl=0)

## Next Phase Readiness
- MOB-02 is complete: the input seam (37-03) now has its visible half. MOB-03 (tappable answer boxes / mute / reset) already falls out of `touchToMouse` + the unified Qe mapping. On-device glyph/art + hit-zone tuning is deferred to MOB-06 (Phase 38) per CONFIG.TOUCH.GLYPHS' own note.

## Self-Check: PASSED
- `src/ui/touchControls.js` exists — FOUND
- `scripts/touch-controls-drive.mjs` exists — FOUND
- Commits `2538689`, `a112e6b`, `2777db2` — FOUND

---
*Phase: 37-mobile-responsive-canvas-touch-controls*
*Completed: 2026-07-19*
