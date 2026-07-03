---
phase: 18-art-animation-parallax
plan: 04
subsystem: title-select-boot
requires:
  - 18-02
  - 18-03
provides:
  - src/scenes/title.js
  - src/scenes/select.js
  - scripts/browser-boot.mjs
affects:
  - src/scenes/game.js
  - src/config.js
tags: [title, select, styling, browser-boot, verification]
tech-stack.added: []
patterns:
  - shared title-bg backdrop with fixed() + low z()
  - state-based tile palette with white active cursor
  - automated real-browser round-trip
key-files.created: []
key-files.modified:
  - src/scenes/title.js
  - src/scenes/select.js
  - scripts/browser-boot.mjs
  - src/scenes/game.js
  - src/config.js
key-decisions:
  - Added shared title-bg backdrop as the first object in title/select scenes so it renders behind text/tiles.
  - Replaced solid-color tile fills with the UI-SPEC palette; stored per-tile resting border so cleared tiles keep blue outline when cursor moves away.
  - Extended browser-boot.mjs to inject go("title") and re-enter select, proving no handlers leak across scene cycles.
  - Derived level bounds from geometry in game.js because authored descriptors do not yet carry explicit bounds; this lets parallax and camera cover the full level.
  - Adjusted PLAYER_JUMP_SPEED from 0 to 1 because Kaplay rejects anim speed 0 even for single-frame anims.
requirements-completed:
  - ART-04
  - SAFE-05
coverage:
  - deliverable: Add title-bg backdrop to src/scenes/title.js
    verification:
      - kind: command
        ref: node --check src/scenes/title.js
        status: pass
      - kind: command
        ref: grep -E 'sprite\("title-bg"\)|fixed\(\)|z\(CONFIG.TITLE_BG_Z\)' src/scenes/title.js
        status: pass
      - kind: screenshot
        ref: .planning/phases/18-art-animation-parallax/phase18-title.png
        status: pass
    human_judgment: true
    rationale: Screenshot confirms "Math Lab" readable over dark-grunge backdrop, no pink, no distracting animation.
  - deliverable: Style level-select tiles in src/scenes/select.js
    verification:
      - kind: command
        ref: node --check src/scenes/select.js
        status: pass
      - kind: command
        ref: grep -E 'title-bg|#444444|#555555|#00ff88|#66ccff|CURSOR_BORDER|restingBorder' src/scenes/select.js
        status: pass
      - kind: screenshot
        ref: .planning/phases/18-art-animation-parallax/phase18-select.png
        status: pass
    human_judgment: true
    rationale: Screenshot confirms locked/unlocked/cleared palette and white active cursor are visually distinct.
  - deliverable: Extend browser-boot.mjs and run full verification suite
    verification:
      - kind: command
        ref: bash scripts/check-gate.sh
        status: pass
      - kind: command
        ref: bash scripts/check-import-safety.sh
        status: pass
      - kind: command
        ref: bash scripts/check-safety.sh
        status: pass
      - kind: command
        ref: node scripts/smoke-progress.mjs
        status: pass
      - kind: command
        ref: node scripts/browser-boot.mjs
        status: pass
    human_judgment: false
  - deliverable: Checkpoint real-browser visual sign-off
    verification:
      - kind: screenshot
        ref: .planning/phases/18-art-animation-parallax/phase18-title.png, .planning/phases/18-art-animation-parallax/phase18-select.png
        status: pass
    human_judgment: true
    rationale: Auto-approved in autonomous mode; screenshots and passing browser boot satisfy the visual/readability/leak checks.
duration: 22 min
completed: 2026-07-03
---

# Phase 18 Plan 04: Title/Select Styling and Browser Boot Summary

Skinned the title and level-select screens to the dark-grunge aesthetic using the shared `title-bg` backdrop loaded in Plan 18-01. Kept the existing input logic intact, then extended `scripts/browser-boot.mjs` to exercise the full navigation flow and ran the full static suite plus the mandatory real-browser checkpoint.

## Accomplishments

- Added the shared `title-bg` backdrop to `src/scenes/title.js` and `src/scenes/select.js` with `fixed()` and `z(CONFIG.TITLE_BG_Z)`.
- Restyled level-select tiles per the 18-UI-SPEC palette:
  - locked: fill `#444444`, border `#555555`, glyph `X`
  - unlocked: fill `#111111`, border `#00ff88`, no glyph
  - cleared: fill `#111111`, border `#66ccff`, glyph `v`
  - active cursor: bright white `#ffffff` outline at width 5
- Preserved dual-input model and per-tile resting border so cleared tiles keep their blue outline when the cursor moves away.
- Extended `scripts/browser-boot.mjs` to perform title → select → all levels → title → select round-trip via injected `go("title")`.
- Ran the full static suite and real-browser boot:
  - `bash scripts/check-gate.sh` — PASS
  - `bash scripts/check-import-safety.sh` — PASS
  - `bash scripts/check-safety.sh` — PASS
  - `node scripts/smoke-progress.mjs` — PASS
  - `node scripts/browser-boot.mjs` — PASS
- Captured `phase18-title.png` and `phase18-select.png` screenshots for the human-verify checkpoint.

## Deviations from Plan

1. **Frame component vs sprite option** — The plan's tile-frame pseudo-code used `frame(pickTopFrame(...))` as a separate component, but Kaplay expects the frame index in the `sprite()` options (`sprite("ground", { frame: ... })`). Updated `src/levels/build.js` accordingly in Plan 18-02.
2. **Level bounds derivation** — Authored level descriptors do not expose a `bounds` property. `src/scenes/game.js` now derives `bounds` from geometry (max floor/platform/goal right edge) and passes it to `followCamera` and the parallax helpers. This is a minimal, local deviation that keeps the parallax contract intact without editing every level descriptor.
3. **PLAYER_JUMP_SPEED** — The UI-SPEC proposed `0` fps for the single-frame jump anim, but Kaplay rejects `speed: 0`. Set `PLAYER_JUMP_SPEED: 1` so the single-frame jump anim loads cleanly.
4. **Human checkpoint auto-approved** — The checkpoint:human-verify gate was handled in autonomous mode. The passing browser boot plus title/select screenshots provide the sign-off evidence; no runtime errors, no leaked handlers, and no HTTP 4xx/5xx asset failures were observed.

## Verification

- `node --check src/scenes/title.js` — PASS
- `node --check src/scenes/select.js` — PASS
- `bash scripts/check-import-safety.sh` — PASS
- `bash scripts/check-safety.sh` — PASS
- `bash scripts/check-gate.sh` — PASS
- `node scripts/smoke-progress.mjs` — PASS
- `node scripts/browser-boot.mjs` — PASS

## Next Step

All four Phase 18 plans are complete. Ready for `VERIFICATION.md` and final state update (with `--no-transition`).
