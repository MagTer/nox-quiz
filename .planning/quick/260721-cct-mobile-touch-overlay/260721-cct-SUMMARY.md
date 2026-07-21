---
quick_id: 260721-cct
slug: mobile-touch-overlay
title: "Mobile: touch controls as HTML viewport overlay (screen-edge based, screen-relative size)"
status: complete
date: 2026-07-21
commit: 28e1abb
---

# Quick Task 260721-cct — Touch controls → HTML viewport overlay (Summary)

## Outcome

Touch controls moved OUT of the Kaplay 640×360 buffer into an HTML `#touch-controls`
overlay pinned to the physical viewport. The buttons now base on the real screen
edges (over the pillarbox bars) and size in viewport units, instead of sitting inside
the letterboxed game frame at a fixed game-space px value. Desktop (pointer:fine) is
byte-inert: the overlay is `display:none` off coarse-pointer AND `touchControls.js`
returns the no-op teardown handle on a fine pointer (binds nothing, adds no `.active`).

**Input wiring is PROVEN** (jump + move + stop-on-release), so status is `complete`.

## Files changed

- `src/index.html` — added the `#touch-controls` overlay markup (`#tc-left` `<`,
  `#tc-right` `>`, `#tc-jump` JUMP) after `#rotate`, plus a screen-relative CSS block
  gated on `@media (pointer: coarse) and (orientation: landscape)` + `.active`.
- `src/ui/touchControls.js` — REWRITTEN from Kaplay-drawn `fixed()` circles to pure
  DOM pointer wiring into the `src/input.js` seam. Zero Kaplay engine globals now.
- `src/config.js` — retired the dead `CONFIG.TOUCH` game-space geometry (LEFT/RIGHT/
  JUMP rects, OPACITY/PRESSED_OPACITY, GLYPH_SIZE, GLYPHS); replaced with a one-line
  note pointing at the CSS overlay. Nothing imports `CONFIG.TOUCH` anymore.

`src/scenes/game.js` was NOT edited — the `mountTouchControls(isFrozen)` signature and
the `.destroy()` teardown-handle contract (game.js :209 mount, :536 teardown) are
unchanged.

## Final CSS sizes / positions (from `src/index.html`)

- Container: `#touch-controls { display:none }` base; `.active` → `display:block;
  position:fixed; inset:0; z-index:9500; pointer-events:none` (coarse+landscape only).
- Movement buttons (`.tc-btn`): `width/height: min(15vw, 26vh)`, circle, resting
  `rgba(68,68,68,0.35)`, border `rgba(112,112,112,0.6)`, text `rgb(232,232,232)`,
  pressed `rgba(68,68,68,0.55)`, `bottom: calc(env(safe-area-inset-bottom,0px) + 3vh)`,
  `touch-action:none; pointer-events:auto`.
- `#tc-left`: `left: calc(env(safe-area-inset-left,0px) + 2vw)` (hugs left edge).
- `#tc-right`: `left: calc(...left + 2vw + min(15vw,26vh) + 3vw)` (right of the left pad).
- `#tc-jump`: `right: calc(env(safe-area-inset-right,0px) + 2vw); left:auto`, larger
  `width/height: min(18vw, 30vh)`, `font-size: 3.4vh` (hugs right edge).

Measured at a 780×360 landscape viewport: left pad x=16 (≈2vw from x=0), right pad
x=133, JUMP right=764 (16px from vw=780). Sizes 94×94px (movement) / 108×108px (jump).

## Deviations from plan

**[Rule 1 — Bug] `#touch-controls.active` never restored `display`.** The plan's CSS
set `#touch-controls { display:none }` as the base and only added position/z-index to
`#touch-controls.active` inside the media query — it never overrode `display`, so the
container stayed `display:none` and all three buttons rendered at 0×0 (not visible),
even with `.active` set and matchMedia reporting coarse+landscape. The first mobile
proof caught this: input wiring passed (dispatchEvent runs handlers on hidden elements)
but placement showed 0×0 boxes. Fixed by adding `display: block` to the
`#touch-controls.active` rule inside the media query (higher specificity than the base
`#touch-controls`, and scoped to coarse+landscape). Re-ran the proof → placement then
passed. Included in commit 28e1abb.

## Gate results (verbatim)

- `bash scripts/check-safety.sh` → `safety checks: PASS`
- `bash scripts/check-import-safety.sh` → `import-safety checks: PASS`
- `bash scripts/check-gate.sh` → `gate checks: PASS`
- `node scripts/browser-boot.mjs` → EXIT 1 on a `far-end-unreachable` headless
  mechanic-drive stall — **A/B-proven pre-existing flake, NOT a regression**:
  - WITH my change: stalled on `level-06` (x:3250 → goal x:4300).
  - PRISTINE baseline (my 3 tracked files `git checkout`'d away, re-run): ALSO
    EXIT 1, `far-end-unreachable` on a **different** level (`level-03`, x:6187 →
    goal x:7500), plus additional "cannot survive the route" findings.
  - The stall lands on a different level each run → the headless drive routing is
    non-deterministic/stochastic; the failure is independent of this change (which
    is a desktop-inert `display:none` overlay + a fine-pointer no-op). Same pattern
    quick 260721-ban documented. My files restored after the baseline run; all three
    fast gates re-verified PASS.

## Mobile proof (landscape coarse-pointer, 780×360, hasTouch+isMobile)

Throwaway Playwright script (scratchpad, reusing browser-boot.mjs's server + playwright
resolution): `/tmp/claude-1000/-home-magnus-dev-nox-quiz/7501ba52-9fc8-4ecd-9036-b04762745487/scratchpad/mobile-proof.mjs`

- matchMedia in-page: `{ coarse: true, landscape: true }`; container `.active: true`.

**1) PLACEMENT (screenshot):**
`/tmp/claude-1000/-home-magnus-dev-nox-quiz/7501ba52-9fc8-4ecd-9036-b04762745487/scratchpad/mobile-touch-overlay.png`
- `#tc-left`: x=16, w=94, h=94, visible.
- `#tc-right`: x=133, right=226, visible (left cluster).
- `#tc-jump`: x=656, right=764 (16px from the vw=780 right edge), w=108, visible.
- Screenshot confirms `<` / `>` at the bottom-LEFT screen corner and `JUMP` at the
  bottom-RIGHT corner, over the letterbox bar regions — NOT centered in the game frame.

**2) INPUT WIRING** (synthesized `PointerEvent` pointerdown/pointerup on the elements;
player state read via `get("player")[0].pos` / `.isGrounded()`):
- JUMP: baseline grounded=true, y=288 → pressed `#tc-jump` → `leftGround=true`,
  minY=193.96 → **rise ≈ 94px**. Jump fired via `fireJumpPress()` (locked buffer/coyote
  path).
- MOVE RIGHT: x0=64 → press-hold `#tc-right` ~0.6s → xHeld=298.5 → **deltaHeld ≈ +234px**
  (player moved right). Released → settled x=304 → **driftAfterRelease ≈ +5.5px** (i.e.
  it stops; only residual velocity carry). Movement respects `isFrozen()` (not frozen at
  level entry) and clears held-state on pointerup.

No page errors, no console errors during the mobile proof.

## Self-Check: PASSED

- `src/index.html`, `src/config.js`, `src/ui/touchControls.js` — all modified and staged.
- Commit `28e1abb` exists in `git log` (`feat(260721-cct): touch controls as HTML
  viewport overlay (screen-edge based)`).
- `grep CONFIG.TOUCH src/ui/touchControls.js` → 0 matches (only a doc-comment mention in
  config.js remains).
