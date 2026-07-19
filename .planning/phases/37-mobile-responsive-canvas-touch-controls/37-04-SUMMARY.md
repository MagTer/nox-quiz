---
phase: 37-mobile-responsive-canvas-touch-controls
plan: 04
subsystem: ui
tags: [mobile, touch-action, viewport-meta, css-media-query, orientation, playwright, kaplay]

# Dependency graph
requires:
  - phase: 37-mobile-responsive-canvas-touch-controls (plan 37-02)
    provides: "#stage wrapper + #game canvas, device-class media queries (pointer:fine 960x540, pointer:coarse full-viewport)"
provides:
  - "Portrait 'rotate your device' overlay (#rotate), pure-CSS coarse+portrait media query swap"
  - "Browser-gesture suppression: touch-action:none on #game + scale-pinned viewport meta"
  - "scripts/touch-orientation-probe.mjs — machine assertion of the overlay swap across portrait/landscape coarse-pointer viewports"
affects: [37-05, 37-06, 37-07, mobile-UAT, desktop-parity-UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Orientation enforced by CSS @media (pointer: coarse) and (orientation: portrait), NOT screen-orientation lock API (iOS-unsupported)"
    - "touch-action:none on the canvas as the reliable gesture suppressor (viewport user-scalable=no is honored inconsistently on iOS)"
    - "Static-markup overlay — no user/localStorage interpolation into HTML (T-37-03 injection mitigation)"
    - "Playwright getComputedStyle probe proves a rendered CSS swap (not a grep of the rule string)"

key-files:
  created:
    - scripts/touch-orientation-probe.mjs
  modified:
    - src/index.html

key-decisions:
  - "No screen-orientation lock API anywhere — landscape is enforced purely by the CSS overlay (unsupported/permission-gated on iOS Safari)"
  - "Overlay copy is a static 'Rotate your device to play' with a grunge accent glyph; no dynamic values interpolated"
  - "Probe reads getComputedStyle(#rotate/#stage).display in two coarse-pointer contexts rather than booting the engine — the swap is pure CSS resolved at first layout"

patterns-established:
  - "Coarse-pointer + portrait -> #rotate display:flex + #stage display:none; landscape reverses — desktop pointer:fine never matches"

requirements-completed: [MOB-04]

coverage:
  - id: D1
    description: "Portrait on a coarse-pointer device shows the dark-grunge #rotate overlay and hides #stage; landscape hides the overlay and shows the game — pure CSS, no orientation lock API"
    requirement: MOB-04
    verification:
      - kind: automated_ui
        ref: "node scripts/touch-orientation-probe.mjs (portrait 540x960: #rotate=flex #stage=none; landscape 960x540: #rotate=none #stage=block)"
        status: pass
    human_judgment: false
  - id: D2
    description: "touch-action:none on #game + scale-pinned viewport meta suppress pinch-zoom/scroll/double-tap-zoom over the canvas"
    requirement: MOB-04
    verification:
      - kind: integration
        ref: "grep touch-action:none + maximum-scale=1 + user-scalable=no + viewport-fit=cover in src/index.html (Task 1 verify)"
        status: pass
    human_judgment: true
    rationale: "Static presence is proven; whether the browser actually stops fighting the game on a real phone needs on-device confirmation (deferred to mobile UAT)"
  - id: D3
    description: "Desktop (pointer:fine) byte-unchanged — overlay never shows, #stage stays fixed 960x540, all 8 levels + mouse audits green"
    requirement: MOB-04
    verification:
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (title -> select -> all levels loaded, no runtime errors)"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-19
status: complete
---

# Phase 37 Plan 04: Mobile — Portrait Overlay & Touch Gesture Suppression Summary

**Portrait 'rotate your device' overlay (#rotate) swapped in by a pure-CSS coarse+portrait media query, plus touch-action:none + a scale-pinned viewport meta for gesture suppression — no screen-orientation lock API, desktop byte-unchanged, proven by a getComputedStyle Playwright probe.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-19
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- Portrait overlay (#rotate): dark-grunge, static-markup "Rotate your device to play" with a grunge-accent rotate glyph, hidden by default and swapped in for #stage only under `@media (pointer: coarse) and (orientation: portrait)`.
- Gesture suppression: `#game { touch-action: none }` (the reliable suppressor) + viewport meta pinned to `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`.
- No screen-orientation lock API anywhere — landscape is enforced purely by CSS.
- `scripts/touch-orientation-probe.mjs`: real machine assertion (getComputedStyle) of the overlay swap across a portrait (540x960) and a landscape (960x540) coarse-pointer viewport; dup'd hardened server + resolvePlaywright() + ephemeral port per the deliberate-duplication convention; zero new dependencies.
- Desktop parity preserved: file:// guard byte-identical, #stage sizing from 37-02 unchanged, browser-boot fully green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Viewport meta + touch-action + portrait rotate overlay** - `da34680` (feat)
2. **Task 2: Author scripts/touch-orientation-probe.mjs + desktop unaffected** - `a9137d8` (test)

## Files Created/Modified
- `src/index.html` (modified) - viewport meta pinned; `#game { touch-action: none }`; `#rotate` static overlay markup + the `(pointer: coarse) and (orientation: portrait)` swap; file:// guard and module script tag byte-identical.
- `scripts/touch-orientation-probe.mjs` (created) - Playwright probe asserting getComputedStyle(#rotate/#stage).display across portrait vs landscape coarse-pointer viewports; exits non-zero on any mismatch.

## Decisions Made
- No screen-orientation lock API — CSS-only landscape enforcement (iOS Safari support/permission gating makes the lock API unreliable per 37-RESEARCH.md).
- Overlay copy kept static (no interpolation) to close T-37-03.
- Probe asserts the pure-CSS rendered swap directly (getComputedStyle) rather than a grep of the rule string, and does not require the engine to boot.

## Deviations from Plan
None - plan executed exactly as written.

(One in-flight adjustment worth noting, not a scope deviation: an early inline
comment contained the literal substring `orientation.lock`, which tripped Task 1's
`grep -c "orientation.lock" == 0` guard — the comment was reworded so the code
genuinely contains no reference to the lock API. No behavior change.)

## Issues Encountered
- Task 1 verify initially failed because a code comment phrased "screen-orientation lock" with `orientation` adjacent to `lock` (the guard's `.` wildcard matched the separator). Reworded the comment to "the JS lock API for screen orientation"; verify then passed.

## Verification Gate Results
- `scripts/touch-orientation-probe.mjs` — PASS (portrait 540x960: #rotate=flex, #stage=none; landscape 960x540: #rotate=none, #stage=block; exit 0)
- `scripts/browser-boot.mjs` — PASS (desktop pointer:fine parity; title -> select -> all 8 levels loaded, no runtime errors; overlay never shows on desktop; exit 0)
- `check-import-safety.sh` — PASS
- `check-safety.sh` — PASS

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MOB-04 closed. Portrait handling + gesture suppression are in place for the remaining mobile plans (37-05 audio unlock, 37-06/07).
- On-device confirmation that touch-action fully suppresses native gestures on a real phone remains a deferred mobile-UAT item (D2, human_judgment).

## Self-Check: PASSED

- FOUND: src/index.html (touch-action, #rotate, orientation:portrait, maximum-scale=1, viewport-fit=cover, file:// guard)
- FOUND: scripts/touch-orientation-probe.mjs
- FOUND commit: da34680 (feat 37-04 overlay)
- FOUND commit: a9137d8 (test 37-04 probe)

---
*Phase: 37-mobile-responsive-canvas-touch-controls*
*Completed: 2026-07-19*
