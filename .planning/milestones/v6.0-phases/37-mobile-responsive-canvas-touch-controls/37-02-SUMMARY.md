---
phase: 37-mobile-responsive-canvas-touch-controls
plan: 02
subsystem: canvas-display
status: complete
tags: [mobile, letterbox, responsive-canvas, coordinate-mapping, desktop-parity]
requires:
  - "37-01 touch-coordinate probe (this plan's GREEN target)"
provides:
  - "letterbox:true responsive canvas — unified mouse+touch coordinate mapping via engine Qe"
  - "#stage device-class container (960x540 desktop / full-viewport touch)"
affects:
  - "37-03 touch controls (virtual buttons read the unified mapping)"
  - "37-04 portrait overlay + gesture suppression (targets #stage)"
tech-stack:
  added: []
  patterns:
    - "Kaplay letterbox:true (requires width+height) fits 640x360 into the canvas parent's offset box"
    - "device-class container sizing via @media (pointer: fine|coarse)"
key-files:
  created: []
  modified:
    - src/main.js
    - src/index.html
decisions:
  - "Desktop #stage fixed at 960x540 so letterbox scales 640->960 = 1.5x with ZERO bars (16:9 into 16:9) — preserves the kid-validated desktop look geometry-for-geometry"
  - "touchToMouse left unset (defaults ON) so taps synthesize a left-mouse press and box.onClick fires on both click and tap"
  - "No CSS transform on the canvas at all — the removed scale is what desynced touch by exactly the 1.5x factor"
metrics:
  duration: ~15m
  completed: 2026-07-19
  tasks: 3
  files: 2
requirements: [MOB-01]
---

# Phase 37 Plan 02: Letterbox Migration — Responsive Canvas Summary

Migrated the display path from the CSS `transform: scale(1.5)` hack to Kaplay's `letterbox: true` at internal 640x360, and wrapped `#game` in a `#stage` device-class container. This unifies mouse (`offsetX`) and touch (`clientX − rect`) through the engine's single `Qe` window→content transform, flipping the 37-01 touch-coordinate probe from RED (game-x 480) to **GREEN (game-x 320.0)** while keeping the desktop look and every mouse-driven interaction byte-behaviorally identical (proven by the hard `browser-boot.mjs` parity gate).

## The RED→GREEN flip (the deliverable)

- **Measured probe result (AFTER):** center tap → game-space `(320.0, 180.0)` — **PASS** ("center tap maps to game-x ~320, coordinate spaces unified").
- **37-01 RED baseline (BEFORE):** `(480.0, 270.0)` — off by exactly the 1.5× display-scale factor.
- The probe stays a permanent gate.

## Desktop-parity gate (load-bearing)

- `node scripts/browser-boot.mjs` → **PASS (exit 0)** — "title → select → all levels loaded with no runtime errors." The non-touch 960×540 context (pointer:fine → #stage 960×540 → zero-bar letterbox) exercised the full desktop path: level-select tile clicks, mute-icon click, challenge answer clicks (box.onClick), and the AudioContext gesture-gate all stayed green. The Phase-14 offsetX/onClick trap did NOT resurface.

## What was built

- **Task 1 — `src/main.js`:** Added `letterbox: true` to the `kaplay({ … })` options (kept `width: 640`, `height: 360`, `background`, `crisp: true`, `canvas`). Deleted the entire `{ const canvas = …; canvas.style.transform = "scale(1.5)"; }` block (zero `style.transform` occurrences remain). Rewrote the stale offsetX/offsetY pitfall comment to describe the letterbox reality by concept — no executable/quoted transform assignment left anywhere. All loadSprite/loadSound/scene/go calls untouched. Commit `9cbce42`.
- **Task 2 — `src/index.html`:** Wrapped `<canvas id="game">` in `<div id="stage">` (the letterbox sizing parent). Added device-class CSS: `@media (pointer: fine) { #stage { width: 960px; height: 540px; } }` (desktop zero-bar 1.5×) and `@media (pointer: coarse) { #stage { width: 100vw; height: 100vh; } }` (touch full-viewport). Kept body flex-centering so #stage stays centered. Rewrote the transform-centering `<style>` comment to the letterbox reality. Did NOT touch viewport meta, touch-action, or add the portrait overlay (37-04 scope). file:// guard + module script left byte-identical. Commit `35d8245`.
- **Task 3 — verification gate:** Ran the probe (GREEN 320.0), static safety gates, validate-levels, and the browser-boot desktop-parity battery — all green. No source change beyond Tasks 1–2.

## Verification

| Gate | Result |
|------|--------|
| `node scripts/touch-coordinate-probe.mjs` | PASS — game-x **320.0** (RED→GREEN flip) |
| `bash scripts/check-import-safety.sh` | PASS |
| `bash scripts/check-safety.sh` | PASS |
| `node scripts/validate-levels.mjs` | PASS |
| `node scripts/browser-boot.mjs` (desktop parity) | PASS (exit 0) |
| `node --check src/main.js` | PASS |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Commits

- `9cbce42` — feat(37-02): switch kaplay() to letterbox:true, delete transform:scale hack
- `35d8245` — feat(37-02): wrap #game in #stage device-class container (960x540 desktop, full-viewport touch)

## Self-Check: PASSED

- `src/main.js` — modified, `letterbox: true` present, zero `style.transform` occurrences.
- `src/index.html` — modified, `#stage` wrapper + device-class CSS present, file:// guard intact.
- Commits `9cbce42` and `35d8245` — present in git history.
