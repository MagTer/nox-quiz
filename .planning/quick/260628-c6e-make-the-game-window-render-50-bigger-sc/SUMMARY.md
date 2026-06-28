---
quick_id: 260628-c6e
slug: make-the-game-window-render-50-bigger-sc
date: 2026-06-28
status: complete
files_modified:
  - src/main.js
---

# Summary: Render the game window 50% bigger

## What changed

`src/main.js` only:
- Added `crisp: true` to the `kaplay({...})` init for pixel-perfect upscaling
  (image-rendering: pixelated).
- After init, override the displayed canvas to 960×540 (640×360 × 1.5):
  `canvas.style.width = "960px"; canvas.style.height = "540px"`.

Internal render resolution stays 640×360, so **no** CONFIG physics/level/camera
numbers changed — pure display scaling.

## Why this approach

Kaplay sets `canvas.style.cssText` at init with inline `width: 640px; height:
360px` (both dimensions were passed), which overrides any stylesheet rule in
`index.html`. The override therefore had to run after `kaplay()` in `main.js`,
not as CSS. Existing `canvas { display:block; margin:auto }` keeps it centered.

## Verification

- `node --check src/main.js` → OK.
- HTTP smoke (server on :8000): index, main.js, kaplay.mjs, player.png all 200.
- No gameplay constants touched (grep of src/config.js unchanged).

## Follow-ups (deferred to next milestone)

- Sprite/art pass (placeholder CC0 art reads as early-MVP).
- Mid-game challenge variety / multiple levels.
