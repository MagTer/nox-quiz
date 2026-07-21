---
phase: 37-mobile-responsive-canvas-touch-controls
plan: 01
subsystem: test-harness
status: complete
tags: [mobile, touch, playwright, red-first, coordinate-mapping]
requires: []
provides:
  - "scripts/touch-coordinate-probe.mjs — RED-first permanent touch-coordinate gate"
affects:
  - "37-02 letterbox migration (this probe is its GREEN target)"
tech-stack:
  added: []
  patterns:
    - "RED-first Playwright gate committed before the fix"
    - "deliberate script duplication of browser-boot's server + resolvePlaywright()"
key-files:
  created:
    - scripts/touch-coordinate-probe.mjs
  modified: []
decisions:
  - "Read touch coord back through the engine's own onTouchStart (single Qe transform), not app-side math; mousePos() kept as the documented A5 fallback"
  - "Fixed 960x540 hasTouch/isMobile context so the transform-scaled 640x360 canvas fills it exactly — a clean center tap"
metrics:
  duration: ~15m
  completed: 2026-07-19
  tasks: 2
  files: 1
requirements: [MOB-01]
---

# Phase 37 Plan 01: RED-first Touch-Coordinate Probe Summary

Authored `scripts/touch-coordinate-probe.mjs` — a Playwright probe that boots the game in a hasTouch/isMobile context, taps the visual center of `#game`, reads the resulting game-space coordinate back through the engine's own `onTouchStart`, and asserts it maps to game-x ~320. It goes RED against the current `transform: scale(1.5)` build, empirically proving the mouse/touch coordinate desync ahead of the 37-02 letterbox migration.

## Measured RED baseline (the deliverable)

- **Center tap → game-space:** `(480.0, 270.0)`
- **Expected game-x:** `~320` (internal center of the 640-wide game space)
- **Desync magnitude:** `480 / 320 = 1.5×` — exactly the `transform: scale(1.5)` display factor, matching 37-RESEARCH.md finding 2 (`clientX − rect.x = 480`, mapped `480 × 640/640 = 480`).
- **Failure mode:** assertion failure with `EXIT=1` — a clean RED, **not** a crash (no page/console errors, read-back succeeded). This is the intended, correct outcome for this RED-first plan.

## What was built

- **Task 1** — Authored the probe. Copied browser-boot.mjs's hardened static server (loopback `127.0.0.1` bind, ROOT-clamped path resolution for T-37-01, ephemeral `listen(0)` port) and `resolvePlaywright()` + `FALLBACK_PLAYWRIGHT_PATH` verbatim per the deliberate-duplication convention (no shared module). Touch context: `{ viewport: 960×540, hasTouch: true, isMobile: true }`. Boot readiness gated on `typeof window.onTouchStart === "function"` (a727c13-safe). A5 fallback (`mousePos()` read) included as a commented-live guard against cross-frame read flake.
- **Task 2** — Ran the probe against the UNCHANGED transform build and confirmed RED for the RIGHT reason (assertion reading 480, not an infrastructure crash). No `src/` file was touched — 37-02 owns the flip to GREEN.

## Verification

- `node --check scripts/touch-coordinate-probe.mjs` — passes.
- Task 1 grep gate (`hasTouch: true`, `touchscreen.tap`, `320`, `listen(0)`) — PASS.
- `node scripts/touch-coordinate-probe.mjs` — RED (exit 1, assertion `got 480.0`), confirmed via the inverted Task 2 wrapper ("RED confirmed (expected)").

## Deviations from Plan

None — plan executed exactly as written. The probe read game-x back cleanly via the primary `onTouchStart` path; the A5 `mousePos()` fallback was not needed at runtime (kept in place for robustness).

## Known Stubs

None.

## Commits

- `eac8536` — test(37-01): add RED-first touch-coordinate probe (proves ~480-vs-320 desync)

## Self-Check: PASSED

- `scripts/touch-coordinate-probe.mjs` — exists on disk.
- Commit `eac8536` — present in git history.
