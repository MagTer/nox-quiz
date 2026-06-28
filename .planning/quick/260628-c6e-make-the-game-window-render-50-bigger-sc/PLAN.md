---
quick_id: 260628-c6e
slug: make-the-game-window-render-50-bigger-sc
date: 2026-06-28
---

# Quick Task: Render the game window 50% bigger

## Goal

Make the game window render +50% bigger without changing any gameplay. The kid
play-test (Phase 12 sign-off) flagged the window as too small on a real monitor.

## Approach

DISPLAY-ONLY scaling — do not touch the internal resolution:

- Keep `kaplay({ width: 640, height: 360 })` so every collider, jump, camera, and
  level number in `src/config.js` stays valid (zero gameplay risk).
- Add `crisp: true` to the kaplay init so the upscale is pixel-perfect
  (image-rendering: pixelated) instead of blurry.
- Override the displayed canvas size to 960×540 (= 640×360 × 1.5) AFTER init in
  `src/main.js`. Kaplay writes `canvas.style.cssText` at init with inline
  `width/height` (because both dimensions are passed), which beats any stylesheet
  rule — so the override must run after `kaplay()`, not via `index.html` CSS.
- Centering is preserved by the existing `canvas { display:block; margin:auto }`
  rule in `index.html` (cssText leaves those properties untouched).

## Tasks

1. Edit `src/main.js`: add `crisp: true` to the kaplay init; after init, set
   `canvas.style.width = "960px"` and `canvas.style.height = "540px"`.

## Verification

- `node --check src/main.js` passes.
- Page + assets still serve (HTTP 200) and boot with no console errors.
- No CONFIG physics/level numbers changed.
