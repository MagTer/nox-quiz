---
phase: 37-mobile-responsive-canvas-touch-controls
plan: 05
subsystem: ui
tags: [touch, kaplay, audio, matchmedia, pointer-coarse, playwright, letterbox]

# Dependency graph
requires:
  - phase: 37-02
    provides: letterbox migration — unified mouse/touch coordinate mapping (one Qe transform) so touchToMouse makes box.onClick fire on tap
provides:
  - Global first-gesture audio unlock (onClick -> ensureMusicPlaying) wired to click/pointerup activation (never touchstart), idempotent, in src/audio.js
  - Coarse-pointer-gated tappable title reset (arm prompt + Yes/No confirm buttons) via area()+onClick, keyboard flow byte-identical
  - Deterministic onClick(start) race resolution (persistent + confirmOpen guard, order-independent) — supersedes the plan's isHovering-only proposal
  - scripts/touch-tap-ui-probe.mjs — Playwright touch proof that tap resolves an answer, toggles mute, and arms/cancels/confirms reset (MOB-03)
affects: [38, on-device MOB-05/MOB-06 audio-activation gate, mobile UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Coarse-pointer feature-detect (matchMedia('(pointer: coarse)')) as the touch-only-widget visibility gate — desktop byte-identical, no UA sniffing"
    - "Persistent-handler + state-flag guard (never cancel/re-arm a global onClick inside a click dispatch) to avoid Kaplay's same-dispatch handler re-fire"
    - "Audio unlock on an activation-triggering event (click/pointerup), documented NOT touchstart (iOS user-activation rule)"

key-files:
  created:
    - scripts/touch-tap-ui-probe.mjs
  modified:
    - src/audio.js
    - src/scenes/title.js
    - src/config.js

key-decisions:
  - "onClick(start) is registered ONCE persistently and gated by `if (confirmOpen) return`, NOT cancelled/re-armed — re-registering it inside a touch button's click handler re-fires start in the same Kaplay mousePress dispatch (the navigate bug the probe caught). This is the deterministic, order-independent resolution the plan asked for; the plan's isHovering-only guard was insufficient for the Yes/No button case (pointer is over the button, not the reset prompt)."
  - "Audio unlock wired via a bare global onClick in wireAudioUI (fires on any tap/click via touchToMouse), never touchstart — satisfies the iOS activation rule; device proof DEFERRED."
  - "iOS ITP ~7-day localStorage eviction documented as expectation only; no code path depends on it (guarded seams default forgivingly)."

patterns-established:
  - "Touch-only UI widgets are additive over an untouched keyboard flow, gated on pointer:coarse, so desktop stays byte-identical and browser-boot is the hard parity gate"
  - "Playwright touch proofs dup browser-boot's ROOT-clamped loopback server + resolvePlaywright + ephemeral port verbatim (deliberate duplication)"

requirements-completed: [MOB-03, MOB-05]

coverage:
  - id: D1
    description: "Global first-gesture audio unlock (onClick -> ensureMusicPlaying, idempotent) wired to click/pointerup activation, never touchstart; iOS activation + ITP caveats documented"
    requirement: "MOB-05"
    verification:
      - kind: automated_ui
        ref: "playwright:scripts/browser-boot.mjs (audioCtx.state suspended->running post-gesture; <=1 audio element)"
        status: pass
      - kind: manual_procedural
        ref: "on-device iOS audio-activation proof — DEFERRED to Phase 38 (headless taps grant activation unconditionally)"
        status: unknown
    human_judgment: true
    rationale: "The touchstart-is-not-activation iOS case cannot be proven headlessly (Playwright synthetic taps always grant user-activation); requires a physical iOS device."
  - id: D2
    description: "Title reset arm + Yes/No confirm are tappable on coarse pointer (area()+onClick), keyboard flow byte-identical, no start-navigation race"
    requirement: "MOB-03"
    verification:
      - kind: automated_ui
        ref: "playwright:scripts/touch-tap-ui-probe.mjs (tap arms; tap-cancel does NOT navigate; tap-Yes clears save)"
        status: pass
      - kind: automated_ui
        ref: "playwright:scripts/browser-boot.mjs (desktop keyboard reset flow + all levels green — parity)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A math answer box tap resolves the challenge and a mute-icon tap toggles mute (getVolume 0<->1) via the unified touchToMouse mapping"
    requirement: "MOB-03"
    verification:
      - kind: automated_ui
        ref: "playwright:scripts/touch-tap-ui-probe.mjs (tap resolves answer; tap toggles mute both ways)"
        status: pass
    human_judgment: false

# Metrics
duration: ~45min
completed: 2026-07-19
status: complete
---

# Phase 37 Plan 05: Tappable UI Proof + Audio Gesture Gate Summary

**Reset became tappable on touch (arm + Yes/No confirm via coarse-gated area()+onClick), audio unlock is wired to a real activation gesture (never touchstart), and a Playwright touch probe proves tap-to-resolve-answer + tap-to-mute + tap-to-arm/cancel/confirm-reset headlessly — desktop stays byte-identical.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 3 completed
- **Files modified:** 3 (+1 created)

## Accomplishments
- **MOB-05 code:** `wireAudioUI()` now registers a global first-gesture audio unlock (`onClick(() => ensureMusicPlaying())`) that fires on any tap/click through touchToMouse — an activation-triggering event, explicitly NOT touchstart (iOS user-activation rule), idempotent and harmless on desktop. iOS activation reasoning + the ~7-day ITP localStorage-eviction expectation are documented in-code; the on-device audio-activation proof is DEFERRED by design.
- **MOB-03 gap fix:** the title reset arm and a new Yes/No confirm button pair are tappable on a coarse pointer (area()+onClick), while the `onKeyPress('r'/'y'/'n'/'escape')` handlers stay byte-for-byte identical. Desktop (pointer:fine) registers nothing new.
- **MOB-03 proof:** `scripts/touch-tap-ui-probe.mjs` drives real `page.touchscreen.tap()` gestures in a coarse-pointer context and asserts: tap arms the reset confirm, tap-cancel does NOT navigate (race guard held), tap-Yes clears the save (resetSave ran), a tap resolves a math answer box, and a tap toggles mute both ways. Exits green.

## Task Commits

1. **Task 1: Wire audio gesture gate + document iOS activation/ITP** - `96e359f` (feat)
2. **Task 2: Tappable title reset arm + Yes/No confirm (coarse; keyboard byte-identical)** - `e4bd9d4` (feat)
3. **Task 3: Playwright touch proof (answer + mute + reset arm/cancel/confirm)** - `64970ad` (test)

## Files Created/Modified
- `src/audio.js` - Added the global first-gesture `onClick -> ensureMusicPlaying` unlock + iOS activation/ITP caveat comments in `wireAudioUI()`. `ensureMusicPlaying` body, mute persistence seam, and icon wiring untouched.
- `src/scenes/title.js` - Coarse-pointer-gated `area()+onClick` on the reset prompt (arms confirm) and new Yes/No confirm buttons; persistent `onClick(start)` gated by `confirmOpen` (deterministic race guard). Keyboard reset flow unchanged.
- `src/config.js` - New `CONFIG.TITLE.CONFIRM_BTN_*` tunables (button W/H/DX/DY/label size) — no magic numbers in the scene.
- `scripts/touch-tap-ui-probe.mjs` - NEW Playwright touch proof (dups browser-boot's hardened server/resolver/ephemeral-port block).

## Decisions Made
See `key-decisions` frontmatter. The load-bearing one: the global `onClick(start)` is persistent (registered once, never cancelled/re-armed) and no-ops via `if (confirmOpen) return`. Because Kaplay's `KEvent.trigger` iterates handlers head→tail in registration order (verified in `lib/kaplay.mjs`), the persistent handler — registered before the confirm buttons exist — always runs first in a tap's `mousePress` dispatch while `confirmOpen` is still true, so it bails out before a button handler flips the flag. This is order-independent and does not weaken the start wiring.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tapping the Yes/No confirm button navigated away from the title**
- **Found during:** Task 3 (running the touch probe against the Task 2 implementation)
- **Issue:** The plan proposed resolving the `onClick(start)` no-occlusion race solely via `start` no-oping when `resetPrompt.isHovering()`. That guard only covers a tap ON the reset prompt. When the touch Yes/No buttons call `closeResetConfirm`/`confirmReset` from inside a `mousePress` dispatch, those functions re-registered `onClick(start)`; Kaplay appends the new handler to the same head→tail handler list being iterated, so `start` fired again in the SAME dispatch — with the pointer over the button (not the reset prompt), the isHovering guard did not catch it, and it navigated to `select`. The probe caught it: cancel navigated away, re-arm failed, Yes never cleared the save.
- **Fix:** Made `onClick(start)` persistent (registered once, never cancelled/re-armed) and added an order-independent `if (confirmOpen) return` guard as `start`'s first check; pulled `onClick(start)` out of the reassignable `startCtrls` array (which now holds only the Enter/Space key controllers, still cancel/re-armed exactly as before). Kept the coarse `isHovering()` guard as belt-and-braces for the arm tap.
- **Files modified:** src/scenes/title.js
- **Verification:** `scripts/touch-tap-ui-probe.mjs` now PASSES (arm, cancel-no-nav, confirm-clears-save); solo `scripts/browser-boot.mjs` PASSES (desktop keyboard reset flow + all levels + audio gesture-gate green).
- **Committed in:** `e4bd9d4` (part of the Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** The fix strengthens (does not weaken) the start race resolution and keeps the keyboard flow byte-identical. No scope creep. Same observable behavior on desktop; correct behavior added on touch.

## Issues Encountered
- **browser-boot headless flakiness (transient, unrelated):** two boot runs surfaced `level-06: door@1800 never triggered` ("cannot fly this hop" physics-drive nondeterminism) and `level-08: fps 38 < 40` (marginal perf floor). Both are in-level and cannot be caused by this plan's changes (title scene + additive CONFIG.TITLE keys + a new script). A clean solo re-run PASSED fully, and Task 1's solo boot passed clean — confirming transient headless-timing/perf flakes documented in CLAUDE.md, not a parity regression. Logged for awareness; not fixed (out of scope per the scope boundary).

## Verification Gate Results
- `bash scripts/check-import-safety.sh` — PASS (a727c13)
- `bash scripts/check-safety.sh` — PASS (no timers/punishment)
- `node scripts/touch-tap-ui-probe.mjs` — PASS (answers + mute + reset arm/cancel/confirm all tap-proven)
- `node scripts/browser-boot.mjs` — PASS on clean solo run (desktop parity: keyboard reset flow + mouse/audio audits + all levels green)

## Deferred / Not Done (by design)
- **MOB-05 real-device audio-activation proof:** DEFERRED to Phase 38 / on-device MOB-06. Playwright synthetic taps grant user-activation unconditionally, so the headless probe cannot prove the iOS "touchstart is not activation-triggering" case. The code wiring (click/pointerup, never touchstart) is done and the headless AudioContext gesture-gate (suspended→running) stays green.
- **iOS ITP ~7-day localStorage eviction:** documentation-only expectation (no backend fix; the laptop remains the progress home). No code path depends on it.

## Next Phase Readiness
- Tappable-UI (answers/mute/reset) is proven headlessly; audio gesture-gate code is in place. Phase 38 owns the on-device audio-activation + coarse-pointer visibility confirmation.

## Self-Check: PASSED
- All modified/created files exist on disk (src/audio.js, src/scenes/title.js, src/config.js, scripts/touch-tap-ui-probe.mjs, this SUMMARY).
- All three task commits verified present: 96e359f, e4bd9d4, 64970ad.

---
*Phase: 37-mobile-responsive-canvas-touch-controls*
*Completed: 2026-07-19*
