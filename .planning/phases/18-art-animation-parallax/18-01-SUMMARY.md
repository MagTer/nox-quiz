---
phase: 18-art-animation-parallax
plan: 01
subsystem: art-loading
requires: []
provides:
  - assets/player.png
  - assets/tiles/ground.png
  - assets/parallax/far.png
  - assets/parallax/mid.png
  - assets/parallax/near.png
  - assets/tiles/title-bg.png
  - src/config.js
  - src/main.js
  - scripts/generate-art-assets.py
affects:
  - src/player.js
  - src/levels/build.js
  - src/parallax.js
  - src/scenes/title.js
  - src/scenes/select.js
tags: [art, assets, config, loadSprite]
tech-stack.added: []
patterns:
  - loadSprite with sliceX/anims
  - dark-grunge palette
key-files.created:
  - assets/parallax/far.png
  - assets/parallax/mid.png
  - assets/parallax/near.png
  - assets/tiles/title-bg.png
  - scripts/generate-art-assets.py
key-files.modified:
  - assets/player.png
  - assets/tiles/ground.png
  - src/config.js
  - src/main.js
key-decisions:
  - Kept player and ground frame dimensions exactly 16x32 and 16x16 to preserve collider geometry.
  - Used loadSprite with sliceX/anims; loadSpriteSheet is not used anywhere in code.
  - All animation/parallax/title constants centralized in CONFIG so later plans consume them without magic numbers.
requirements-completed:
  - ART-01
  - ART-02
  - ART-03
  - ART-04
coverage:
  - deliverable: Generate placeholder pixel-art assets matching UI-SPEC dimensions
    verification:
      - kind: command
        ref: file assets/player.png assets/tiles/ground.png assets/parallax/far.png assets/parallax/mid.png assets/parallax/near.png assets/tiles/title-bg.png
        status: pass
    human_judgment: false
  - deliverable: Add animation, tile, and parallax constants to src/config.js
    verification:
      - kind: command
        ref: node --check src/config.js
        status: pass
      - kind: command
        ref: grep -E 'PLAYER_FRAMES|PLAYER_ANIM_DEADZONE|PLAYER_IDLE_SPEED|PLAYER_RUN_SPEED|PLAYER_JUMP_SPEED|GROUND_FRAMES|PARALLAX|TITLE_BG_Z' src/config.js
        status: pass
    human_judgment: false
  - deliverable: Load the new sprite sheets in src/main.js
    verification:
      - kind: command
        ref: node --check src/main.js
        status: pass
      - kind: command
        ref: grep -E 'loadSprite\("player"|loadSprite\("ground"|loadSprite\("bg-far"|loadSprite\("bg-mid"|loadSprite\("bg-near"|loadSprite\("title-bg"' src/main.js
        status: pass
    human_judgment: false
duration: 12 min
completed: 2026-07-03
---

# Phase 18 Plan 01: Assets and Sprite Loading Summary

Created the Phase 18 pixel-art assets and the configuration/sprite-loading surface that the rest of the phase depends on. Replaced the single-frame `player.png` and `ground.png` with the exact sheet layouts from 18-UI-SPEC.md, added the three parallax strips and the shared title/select backdrop, exposed all tuning constants in `src/config.js`, and loaded every sprite in `src/main.js` after `kaplay()`.

## Accomplishments

- Generated `scripts/generate-art-assets.py` and produced six PNG assets with the exact UI-SPEC dimensions:
  - `assets/player.png` — 80×32, five 16×32 frames (idle/run/jump)
  - `assets/tiles/ground.png` — 80×16, five 16×16 frames (single/left/center/right/underside)
  - `assets/parallax/far.png` — 640×120 tileable far silhouette strip
  - `assets/parallax/mid.png` — 640×144 tileable mid-structure strip
  - `assets/parallax/near.png` — 640×90 tileable near-grunge strip
  - `assets/tiles/title-bg.png` — 640×360 dark-grunge title/select backdrop
- Added `PLAYER_*`, `GROUND_FRAMES`, `PARALLAX`, and `TITLE_BG_Z` constants to `src/config.js`.
- Updated `src/main.js` to load the player sheet (with `sliceX` and named `anims`), the ground sheet, the three parallax layers, and the title backdrop after `kaplay()`.
- Confirmed all static checks pass: `node --check src/config.js`, `node --check src/main.js`, and `bash scripts/check-import-safety.sh`.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `node --check src/config.js` — PASS
- `node --check src/main.js` — PASS
- `bash scripts/check-import-safety.sh` — PASS
- `file` confirms every generated PNG dimension matches the UI-SPEC — PASS
- `loadSprite` calls for player, ground, bg-far, bg-mid, bg-near, and title-bg are present — PASS
- `loadSpriteSheet` is not present in code (only mentioned in a comment explaining it does not exist) — PASS

## Next Step

Ready for Plan 18-02: player animation state machine and tile frame selection.
