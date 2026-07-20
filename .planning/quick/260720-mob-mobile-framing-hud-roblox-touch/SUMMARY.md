---
phase: quick-260720-mob
status: complete
date: 2026-07-20
commits:
  - 18ad866 fix(mobile): fill-width bottom-anchored framing + HUD move-down
  - 923c767 feat(mobile): bigger raised Roblox-style touch controls
files_modified:
  - src/index.html
  - src/config.js
  - src/ui/hud.js
  - src/audio.js
  - src/scenes/select.js
  - src/ui/touchControls.js
---

# Quick 260720-mob — Mobile framing + HUD move-down + Roblox-style touch controls

Real-phone Android-Chrome-landscape play-test fixes.

## Root cause (confirmed in Playwright emulation)

On coarse pointer `#stage` was `100vw x 100vh`; 100vh on mobile Chrome is the LARGE
viewport (includes the dynamic-toolbar band), so the letterboxed canvas was taller than
the visible screen — measured in emulation (915x468 large / 412 visible): canvas bottom
468 vs fold 412 -> 56 css px of ground/player/buttons hidden below the fold.

## Fixes

1. **Framing** (`src/index.html`, coarse only): `#stage` = fill-width 16:9 box
   (`100vw x calc(100vw*9/16)`) `position:fixed; left:0; bottom:0`; body capped at
   `100dvh` (100vh fallback) + `overflow:hidden`. Ground/player pinned to the visible
   bottom; overflow crops the TOP (sky). Box is exactly 16:9 -> Kaplay letterbox fills
   with zero bars, single Qe mouse+touch transform preserved.
2. **HUD move-down**: `CONFIG.HUD.MOBILE_DY` (80 game px) shifts badge/XP bar/key
   indicator (hud.js) + mute icon (audio.js) down on coarse pointer;
   `CONFIG.SELECT.MOBILE_DY` (30) shifts the select-screen logo badge + heading.
   Desktop resolves to 0.
3. **Touch controls**: `CONFIG.TOUCH` retuned — LEFT/RIGHT 72->96 px, JUMP 88->112 px,
   bottom edges raised 336->316/320, glyphs 28->32. touchControls.js draws circle()
   visuals inscribed in the (unchanged-idiom) AABB hit rects; input still flows only
   through src/input.js. SAFE-01 + a727c13 clean.

## Verification

- Emulation (915x412, DPR 2.625, isMobile, hasTouch, Android UA): canvas fills width,
  bottom at fold, top at -102.7; synthesized CDP touch — JUMP tap jumps (y 288->217.7),
  RIGHT hold walks (+164 px), release stops, LEFT hold walks back. No page errors.
- Gates: check-gate / check-safety / check-import-safety / check-progress /
  validate-levels / check-assets-manifest all PASS; browser-boot PASS EXIT=0
  (one flaky headless drive failure on first run, clean on re-run; desktop path
  unaffected — all mobile offsets resolve to 0 on fine pointer).
- Before/after screenshots saved to the session scratchpad for human review.

## Known limitation (noted, not fixed — level geometry is kid-validated)

On flat 360-tall levels (01/03/05/07) the camera Y is pinned, so the top-band bonus
coins (world y 62-70) and two checkpoint marker tops (y 70-78) sit partially inside the
cropped sky band on phones wider than 16:9 (up to ~86 game px cropped on 21:9). Nothing
load-bearing (goal/door/gate/enemy/key) is in the band; vertical levels (02/04/06/08)
are clear because their camera range extends upward. Revisit if the kid reports
"invisible" coins on her device.
