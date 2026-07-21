---
quick_id: 260721-ban
slug: mobile-controls-scale-fit
title: "Mobile: shrink touch controls ~30% + move to sides; scale-to-fit framing"
status: complete
date: 2026-07-21
commit: b76970f
tags: [mobile, touch-controls, framing, css, config]
key-files:
  modified:
    - src/config.js
    - src/index.html
---

# Quick Task 260721-ban — Mobile controls shrink + scale-to-fit framing — Summary

Two mobile-only fixes from a real-phone landscape play-test: shrank the virtual
touch buttons ~30% and hugged them to the outer screen edges, and switched the
coarse-pointer framing from fill-width-crop-top to scale-to-fit (contain) so the
full 640×360 game stays on-screen with pillarbox bars on the sides. Both edits are
tunables/CSS only, confined to the touch/coarse-pointer path; desktop
(`@media (pointer: fine)`) is byte-unchanged.

## What changed

### `src/config.js` — final `CONFIG.TOUCH` values
- `LEFT:  { X: 8,   Y: 247, W: 67, H: 67 }`  (was `{ X: 20,  Y: 220, W: 96,  H: 96 }`) — hugs left edge, bottom 314
- `RIGHT: { X: 85,  Y: 247, W: 67, H: 67 }`  (was `{ X: 132, Y: 220, W: 96,  H: 96 }`) — 10px right of LEFT (8+67+10=85), same band
- `JUMP:  { X: 556, Y: 240, W: 78, H: 78 }`  (was `{ X: 508, Y: 208, W: 112, H: 112 }`) — hugs right edge (right edge 634), bottom 318
- `GLYPH_SIZE: 26`  (was `32`)
- Block comment above `LEFT` gained the "Re-tuned quick 260721-ban: −30% + hugged to the outer edges" note; inline comments updated to the new numbers.
- All hit zones remain ≥64px (67 and 78 both satisfy the CONTEXT "≥64px effective hit zones" rule). `touchControls.js` consumes these via `T.LEFT/RIGHT/JUMP` (W/H/X/Y) and `T.GLYPH_SIZE` — value changes flow through with no code edit.

### `src/index.html` — coarse-pointer `#stage` framing
- Inside `@media (pointer: coarse) { #stage { … } }`, replaced `height: calc(100vw * 9 / 16);` with:
  ```
  height: 100vh;      /* fallback for engines without dvh */
  height: 100dvh;     /* visible viewport → Kaplay letterbox CONTAINS 640×360, nothing cropped */
  ```
  `position: fixed; left: 0; bottom: 0; width: 100vw;` kept as-is.
- Rewrote the framing block comment above the `@media (pointer: coarse)` rule to describe scale-to-fit/contain (full game visible, pillarbox on the sides in landscape) and to record that `dvh` (the visible viewport) is what avoids the original `100vh` large-viewport bug.
- `@media (pointer: fine)` and all desktop rules untouched (byte-identical, verified in diff).

## Verification — gate results

| Gate | Result |
| --- | --- |
| `bash scripts/check-safety.sh` | **PASS** — `safety checks: PASS` (exit 0) |
| `bash scripts/check-import-safety.sh` | **PASS** — `import-safety checks: PASS` (exit 0) |
| `bash scripts/check-gate.sh` | **PASS** — `gate checks: PASS` (exit 0) |
| `node scripts/browser-boot.mjs` | **RED — PRE-EXISTING baseline flakiness, NOT caused by this change** (see below) |

### browser-boot: pre-existing flaky red, proven unrelated to this change
`node scripts/browser-boot.mjs` exits 1 with level-traversal/mechanic drive
findings (e.g. "cannot fly this hop", "cannot survive the route", "level-06 door
never triggered", "level-05 far-end drive stalled"). These are the "known
headless-timing flakiness" / "genuine route-finding findings" CLAUDE.md documents
for browser-boot + the audit scripts.

This was confirmed **not** caused by this change via an A/B stash test:
- **With my edits**: exit 1 — `level-06: encounter door at x:1800 never triggered`.
- **After `git stash` of both files (pristine baseline)**: exit 1 — `level-05: far-end drive stalled at x:2711…, never reached goal.x:6180` — a **different** failing leg, confirming nondeterministic headless flakiness rather than a deterministic regression.

The change is architecturally isolated to the coarse-pointer/touch path
(`@media (pointer: coarse)` CSS + `CONFIG.TOUCH`, which is touch-device-only
config). browser-boot exercises the **desktop/fine-pointer** path, whose
`@media (pointer: fine) { #stage { width: 960px; height: 540px; } }` rule is
byte-identical in the diff — so these edits cannot affect the browser-boot path.
The three deterministic src-change gates that DO validate this change are all
green.

## Verification — mobile landscape emulation

Wrote a throwaway Playwright landscape probe (scratchpad `landscape-shot.mjs`,
reusing `touch-orientation-probe.mjs`'s server + playwright-resolver boilerplate):
serves the repo over an ephemeral-port loopback http server, launches headless
chromium in a **740×360** coarse-pointer viewport (`hasTouch: true`,
`isMobile: true`, `deviceScaleFactor: 2` — aspect 2.056:1, deliberately wider than
16:9 so a `contain` letterbox must produce side pillarbox), loads
`/src/index.html`, waits for the `#game` canvas to size, and screenshots.

- **Result: PASS** — `verticalCropped = false`; canvas top=0, height=360 fully
  within the 360px viewport (no vertical crop at either edge).
- **Screenshot:** `/tmp/claude-1000/-home-magnus-dev-nox-quiz/7501ba52-9fc8-4ecd-9036-b04762745487/scratchpad/landscape-260721-ban.png`
- **Visual confirmation (title scene):** the full 640×360 frame is visible
  top-to-bottom — NOX logo, full arch/door backdrop, "press ENTER / SPACE / click
  to start" prompt, "SND" mute icon (top, y=8), AND "press R to reset progress"
  (bottom, y=336) all on-screen — with clear **black pillarbox bars on the left and
  right edges**. Kaplay's `letterbox: true` draws the bars inside the canvas, so
  the `#game` element rect fills `#stage` while the rendered game is contained
  within it. No sky/ground/UI is cropped vertically — exactly the scale-to-fit
  intent.

## Commit
- **b76970f** — `fix(260721-ban): mobile controls -30% + scale-to-fit framing` (2 files, +24 −19; src only, no deletions)

## Deviations from Plan
None — the two edits were applied exactly as the plan specified (its exact
old→new string replacements). No auto-fixes needed.

## Notes
- browser-boot's pre-existing red is flagged, not papered over: it is documented,
  reproduced on the pristine baseline, and provably outside this change's (touch/
  coarse-only) surface. If a green browser-boot baseline is desired, the underlying
  headless route-finding flakiness is a separate, pre-existing item unrelated to
  this quick task.

## Self-Check: PASSED
- `src/config.js` — modified, committed in b76970f (FOUND)
- `src/index.html` — modified, committed in b76970f (FOUND)
- Commit b76970f present in `git log` (FOUND)
- Screenshot `landscape-260721-ban.png` exists on disk (FOUND)
