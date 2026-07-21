---
quick_id: 260721-cct
slug: mobile-touch-overlay
title: "Mobile: touch controls as HTML viewport overlay (screen-edge based, screen-relative size)"
status: ready
date: 2026-07-21
---

# Quick Task 260721-cct — Touch controls → HTML viewport overlay

## Why

Today the touch buttons are Kaplay `fixed()` circles drawn **inside the internal
640×360 game buffer** (`src/ui/touchControls.js`). After the scale-to-fit change,
the game is letterbox-*contained* with pillarbox bars on the sides, so those
in-buffer buttons sit **inside the game frame** (overlaying the art) and their
size is a **fixed** game-space px value that can't reach the bars.

Fix: move the buttons OUT of the Kaplay canvas into an **HTML overlay pinned to the
physical viewport**, so they base on the real screen edges (the bars/corners) and
their size is **screen-relative** (viewport units → naturally bigger, scales per
device). The input path is unchanged: they drive the SAME `src/input.js` seam.

**Hard constraints (project):**
- Desktop (`pointer:fine`) must stay **byte-identical** — the overlay is
  `display:none` off coarse-pointer, and `touchControls.js` still no-ops on fine
  pointer (returns the empty teardown handle, adds no `.active`, binds nothing).
- **No timers/schedulers** (SAFE-01) — pure pointer edges, no duration measurement.
- **a727c13**: `touchControls.js` uses only DOM/browser globals now (no Kaplay
  engine globals at all) — even safer than before. No engine ref at module top.
- Reuse the input seam verbatim (`input.setLeftHeld/setRightHeld/fireJumpPress/
  fireJumpRelease`) — never re-implement jump/movement. Movement respects `isFrozen()`
  exactly as today (no held-state mutation while a math panel is open); jump always
  forwards the edge (player.js guards `paused`).

## Task 1 — Add the HTML overlay + screen-relative CSS (`src/index.html`)

**1a. Markup** — add a sibling of `#stage`/`#rotate` in `<body>` (after `#rotate`):

```html
<!-- Touch controls: an HTML overlay pinned to the PHYSICAL viewport (NOT the
     Kaplay canvas), so the thumb buttons base on the real screen edges / pillarbox
     bars rather than the letterboxed game frame. Shown only on a coarse-pointer
     device in landscape, and only while the game scene mounts them (.active,
     toggled by src/ui/touchControls.js). Desktop never renders it. -->
<div id="touch-controls" aria-hidden="true">
  <button type="button" id="tc-left"  class="tc-btn" aria-label="Move left">&lt;</button>
  <button type="button" id="tc-right" class="tc-btn" aria-label="Move right">&gt;</button>
  <button type="button" id="tc-jump"  class="tc-btn tc-jump" aria-label="Jump">JUMP</button>
</div>
```

**1b. CSS** — add to the `<style>` block. Hidden by default; visible only on
coarse-pointer + landscape + `.active`. Sizes/positions are screen-relative and
use `env(safe-area-inset-*)` (the viewport meta already sets `viewport-fit=cover`).
Grunge palette matched to CONFIG.PALETTE (MUTED `rgb(68,68,68)`, border
`rgb(112,112,112)`, text `rgb(232,232,232)`, resting opacity 0.35 / pressed 0.55):

```css
#touch-controls { display: none; }
@media (pointer: coarse) and (orientation: landscape) {
  #touch-controls.active {
    position: fixed; inset: 0; z-index: 9500;
    pointer-events: none;              /* container is transparent to touches… */
  }
  #touch-controls.active .tc-btn {
    position: fixed;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 3vh);
    display: flex; align-items: center; justify-content: center;
    box-sizing: border-box;
    width: min(15vw, 26vh); height: min(15vw, 26vh);
    border-radius: 50%;
    background: rgba(68, 68, 68, 0.35);
    border: 2px solid rgba(112, 112, 112, 0.6);
    color: rgb(232, 232, 232);
    font: 600 6vh/1 system-ui, sans-serif;
    padding: 0;
    -webkit-user-select: none; user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;                /* …the buttons own the touch (no scroll/zoom) */
    pointer-events: auto;
  }
  #touch-controls.active .tc-btn.pressed { background: rgba(68, 68, 68, 0.55); }
  /* movement cluster hugs the LEFT screen edge; jump hugs the RIGHT screen edge */
  #touch-controls.active #tc-left  { left: calc(env(safe-area-inset-left, 0px) + 2vw); }
  #touch-controls.active #tc-right { left: calc(env(safe-area-inset-left, 0px) + 2vw + min(15vw, 26vh) + 3vw); }
  #touch-controls.active #tc-jump  {
    right: calc(env(safe-area-inset-right, 0px) + 2vw); left: auto;
    width: min(18vw, 30vh); height: min(18vw, 30vh);
    font-size: 3.4vh;                  /* "JUMP" word fits the larger circle */
  }
}
```

Do NOT touch `@media (pointer: fine)` or the coarse `#stage`/`#rotate` rules.

## Task 2 — Rewrite `src/ui/touchControls.js` to drive the DOM overlay

Keep the `mountTouchControls(isFrozen)` signature and the coarse-pointer guard and
the teardown-handle contract (game.js calls it at :209 and `.destroy()` at :536 —
do NOT change game.js). Replace the Kaplay-drawn body with DOM wiring:

- Coarse guard unchanged (`matchMedia("(pointer: coarse)")`); on fine pointer return
  `{ destroy(){} }` and do nothing.
- `const container = document.getElementById("touch-controls")` — if missing (e.g.
  headless without the element) return the no-op handle (never throw).
- `container.classList.add("active")` on mount; remove on teardown.
- For `#tc-left` / `#tc-right`: `pointerdown` → `el.setPointerCapture?.(e.pointerId)`,
  add `.pressed`, and `if (!isFrozen()) input.setLeftHeld(true)` (resp. right).
  `pointerup` + `pointercancel` → remove `.pressed`, `input.setLeftHeld(false)`
  (clearing is always safe, frozen or not). `e.preventDefault()` on each.
  Because each button is its OWN element with pointer capture, multi-touch
  (left + jump held together, lifting one keeps the other) is inherent — no
  identifier Map needed.
- For `#tc-jump`: `pointerdown` → capture + `.pressed` + `input.fireJumpPress()`
  (player.js guards `paused`); `pointerup`/`pointercancel` → remove `.pressed` +
  `input.fireJumpRelease()`.
- Track every `addEventListener` in a closure-local array and remove them all in
  `destroy()` (anti-leak); also `container.classList.remove("active")` and strip
  any lingering `.pressed`. Closure-local only — no module-level `let`.
- Update the file header comment: it is now a **DOM overlay** driver (no Kaplay
  primitives), still SAFE-01 / a727c13-clean, still input-seam-only.

## Task 3 — Retire the now-dead `CONFIG.TOUCH` geometry (`src/config.js`)

The DOM overlay owns geometry in CSS now, so the game-space rect tunables are dead.
Remove the `X/Y/W/H` rects, `GLYPH_SIZE`, and `GLYPHS` from `CONFIG.TOUCH` (they are
no longer imported — verify nothing else references them: `grep -rn "CONFIG.TOUCH\|T\.LEFT\|T\.RIGHT\|T\.JUMP\|GLYPH_SIZE\|T\.GLYPHS" src/`). Keep the
`TOUCH` key only if `OPACITY`/`PRESSED_OPACITY` are still referenced anywhere; if
nothing references `CONFIG.TOUCH` at all after the rewrite, remove the whole
`TOUCH` block and its comment. Leave a one-line note where it was pointing to the
CSS overlay in `src/index.html`. Do not leave dead config.

## Verification (required — src + input change)

- `bash scripts/check-safety.sh`  (no timers/punishment)
- `bash scripts/check-import-safety.sh`  (a727c13 — no engine globals at module top)
- `bash scripts/check-gate.sh`
- `node scripts/browser-boot.mjs`  (desktop/fine-pointer path — must stay green; if
  it flakes, A/B-stash prove it against the pristine baseline like 260721-ban did —
  do NOT paper over a real regression)

**Mobile input proof (the important one)** — reuse/extend the landscape coarse-pointer
Playwright approach from 260721-ban / 260720-mob (scratchpad throwaway is fine).
Serve the repo over http, launch chromium at a landscape coarse-pointer viewport
(e.g. 780×360, `hasTouch:true`, `isMobile:true`), load `src/index.html`, start a
level (so the game scene mounts the controls → `.active`), then prove BOTH:
1. **Placement** — `#tc-left`/`#tc-right`/`#tc-jump` are visible, their bounding
   boxes sit at the physical screen corners (left cluster within a few vw of x=0;
   jump within a few vw of the right edge), i.e. in the bar region, NOT centered in
   the game frame. Screenshot it.
2. **Input wiring** — synthesize a touch/pointer press on `#tc-jump` and confirm the
   player leaves the ground (jump fired), and a press-hold on `#tc-right` moves the
   player right (poll player x, or read a debug hook). Use CDP
   `Input.dispatchTouchEvent` or `element.dispatchEvent(new PointerEvent(...))`.
   Report the observed effect.

Report both screenshots/paths + the input-proof result in the SUMMARY.

## must_haves

- `#touch-controls` HTML overlay exists in `src/index.html`, positioned/`sized` in
  screen-relative CSS, shown only on coarse+landscape+`.active`.
- `src/ui/touchControls.js` uses NO Kaplay engine globals — pure DOM pointer wiring
  into the existing `src/input.js` seam; `mountTouchControls(isFrozen)` signature and
  teardown contract unchanged; `game.js` untouched.
- Multi-touch (left+jump) works; movement respects `isFrozen()`; jump uses the
  locked buffer/coyote path via `fireJumpPress/Release`.
- Desktop `pointer:fine` byte-identical; browser-boot green (or A/B-proven flake).
- Mobile emulation: buttons render at the physical screen edges (bars/corners) and a
  synthesized press fires jump + move.
- No dead `CONFIG.TOUCH` geometry left behind.
