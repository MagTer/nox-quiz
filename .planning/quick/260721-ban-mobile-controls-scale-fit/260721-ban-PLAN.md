---
quick_id: 260721-ban
slug: mobile-controls-scale-fit
title: "Mobile: shrink touch controls ~30% + move to sides; scale-to-fit framing"
status: ready
date: 2026-07-21
---

# Quick Task 260721-ban — Mobile controls shrink + scale-to-fit framing

Two mobile-only fixes from a real-phone **landscape** play-test (2026-07-21). Both
are tunables/CSS only — no logic, no engine-global refs, no timers. Desktop
(`pointer:fine`) must stay **byte-unchanged**.

## Task 1 — Shrink round touch controls ~30% + push to the outer sides

**File:** `src/config.js` — `CONFIG.TOUCH` (rects are in the internal 640×360 GAME
space; the letterbox maps taps into this space, so these are the AABB hit zones and
touchControls.js inscribes the visible circle at diameter = W).

30% smaller (`96→67`, `112→78`, all still ≥64px hit zones), the LEFT/RIGHT movement
cluster pushed toward the **left** edge and JUMP toward the **right** edge, same
raised bottom band, and GLYPH_SIZE reduced to match.

Apply these exact replacements:

- `LEFT: { X: 20, Y: 220, W: 96, H: 96 },` → `LEFT: { X: 8, Y: 247, W: 67, H: 67 },` (left edge 8, bottom 314)
- `RIGHT: { X: 132, Y: 220, W: 96, H: 96 },` → `RIGHT: { X: 85, Y: 247, W: 67, H: 67 },` (10px right of LEFT, same band)
- `JUMP: { X: 508, Y: 208, W: 112, H: 112 },` → `JUMP: { X: 556, Y: 240, W: 78, H: 78 },` (right edge 634, bottom 318)
- `GLYPH_SIZE: 32,` → `GLYPH_SIZE: 26,`

Update the trailing comments on those lines to reflect the new numbers, and update
the block comment above LEFT (the "Retuned quick 260720-mob" note) with a short
"Re-tuned quick 260721-ban: −30% + hugged to the outer edges (real-phone landscape
play-test)" line. Keep the existing `≥64px` note — 67 and 78 both satisfy it.

## Task 2 — Scale-to-fit (contain) mobile framing instead of fill-width-crop-top

**File:** `src/index.html` — the `@media (pointer: coarse)` `#stage` rule.

Today `#stage` is a fill-width 16:9 box (`height: calc(100vw * 9 / 16)`) anchored to
the visible bottom, so in landscape the box is taller than the screen and the sky
overflows above the fold (too much lost). Switch to letting Kaplay's existing
`letterbox: true` **contain** the whole 640×360 in the visible viewport: give
`#stage` the full **visible** height (`100dvh`, with a `100vh` fallback). The full
sky + ground stay on-screen; thin pillarbox bars appear on the sides in landscape —
the accepted trade-off. This avoids the original `100vh` bug because `dvh` is the
*visible* viewport (not the large-viewport `100vh` that hid the bottom).

Exact change inside `@media (pointer: coarse) { #stage { … } }`:

- Replace `        height: calc(100vw * 9 / 16);`
  with:
  ```
        height: 100vh;      /* fallback for engines without dvh */
        height: 100dvh;     /* visible viewport → Kaplay letterbox CONTAINS 640×360, nothing cropped */
  ```
- Keep `position: fixed; left: 0; bottom: 0; width: 100vw;` as-is.

Also rewrite the big framing comment block above the `@media (pointer: coarse)` rule
(the "Mobile framing (quick 260720-mob…)" comment) so it describes **scale-to-fit /
contain** (full game visible, pillarbox bars on the sides in landscape) rather than
fill-width-crop-top, and records that `dvh` (visible viewport) is what avoids the
original `100vh` large-viewport bug. Do not touch `@media (pointer: fine)` or any
other rule.

## Verification (required — src change)

Run the standard src-change gates, all must be green:
- `bash scripts/check-safety.sh`
- `bash scripts/check-import-safety.sh`
- `bash scripts/check-gate.sh`
- `node scripts/browser-boot.mjs` (real-browser boot + drive across all levels — desktop path unchanged)

Then a mobile-emulation check (Android-Chrome, **landscape**) confirming: the full
sky + ground + player + touch buttons are all visible with **no vertical crop**,
pillarbox bars only on the sides, and a tap on each button's zone still registers
(letterbox tap-mapping intact). If a mobile browser-boot/emulation harness exists
(the prior mobile quick-tasks used one), reuse it; otherwise capture a landscape
screenshot via the browser-boot Playwright harness with a coarse-pointer + landscape
viewport and confirm visually.

## must_haves

- LEFT/RIGHT are 67×67, JUMP is 78×78, GLYPH_SIZE 26 in `src/config.js`.
- LEFT hugs the left edge (X 8), JUMP hugs the right edge (right edge 634).
- `src/index.html` coarse-pointer `#stage` uses `height: 100dvh` (with `100vh` fallback), not `calc(100vw*9/16)`.
- `@media (pointer: fine)` and all desktop rules are byte-unchanged.
- All four gates green; mobile landscape shows no vertical crop.
