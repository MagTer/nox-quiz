---
phase: 33-player-entity-animation
plan: 02
subsystem: boot-time sprite/anim registration
tags: [kaplay, sprite-anim, config-tunables, assets-manifest]
dependency-graph:
  requires: []
  provides:
    - "5-state player-swamphunter loadSprite registration (idle/run/jump/fall/land) in main.js"
    - "CONFIG.ENEMY.SPRITES single-entry [\"enemy-hellhound\"] with IDLE_SPEED/FRAME_W tunables"
    - "assets-manifest.js rows mirroring every path this plan changed"
  affects:
    - "Plan 33-03 (player.js state machine) — consumes the exact fall/land anim names registered here"
    - "Plan 33-04 (build.js) — consumes CONFIG.ENEMY.SPRITES and the math-gate/enemy-hellhound sprite keys"
tech-stack:
  added: []
  patterns:
    - "Kaplay loadSprite({sliceX, anims}) named-anim pattern, extended (not invented) — 3rd/4th use in this codebase (player, coin, now enemy-hellhound)"
key-files:
  created: []
  modified:
    - src/config.js
    - src/main.js
    - src/assets-manifest.js
decisions:
  - "Land state synthesized by holding fall's last frame (index 11) as a non-looping single-frame anim — no dedicated land art exists in the Phase-31 bake, per RESEARCH's locked wiring-only scope"
  - "assets-manifest.js header per-kind counts recomputed programmatically (sprite 12->10, sprite-anim 2->3, total 38->37) rather than hand-guessed"
metrics:
  duration: "~20 min"
  completed: 2026-07-11
status: complete
---

# Phase 33 Plan 02: Boot-time Sprite/Anim Registration Summary

Registered the boot-time sprite/anim loading Phase 33 needs: swapped the player sheet to the already-baked 12-frame `player-swamphunter.png` with a full idle/run/jump/fall/land anim set, replaced the 3-variant static enemy-1/2/3 array with the already-baked 6-frame looping `enemy-hellhound` idle anim, added the new `math-gate` sprite load, and mirrored every changed path into `assets-manifest.js`.

## What Was Built

- **`src/config.js`**: `PLAYER_FRAMES` bumped 5→12; added `PLAYER_FALL_SPEED` (8fps), `PLAYER_LAND_SPEED` (1fps), `PLAYER_LAND_HOLD_MS` (120ms); added `CONFIG.ENEMY.IDLE_SPEED` (8fps) and `CONFIG.ENEMY.FRAME_W` (64px); collapsed `CONFIG.ENEMY.SPRITES` to `["enemy-hellhound"]`.
- **`src/main.js`**: player `loadSprite` repointed at `../assets/player-swamphunter.png` with the RESEARCH-verified 5-anim frame layout (idle:0-1, run:2-7, jump:8-9, fall:10-11, land: synthesized hold of frame 11). Removed the three `enemy-1`/`enemy-2`/`enemy-3` `loadSprite` calls, replaced with one `loadSprite("enemy-hellhound", ..., {sliceX:6, anims:{idle: loop 0-5}})`. Added `loadSprite("math-gate", "../assets/math-gate.png")` alongside the unchanged door load. Updated the surrounding comment block to reference ART-04/ART-05/Phase 33 instead of stale VIS-04/Phase-26 attribution.
- **`src/assets-manifest.js`**: `player` row path updated to `player-swamphunter.png`; `enemy-1`/`enemy-2`/`enemy-3` sprite rows removed; `math-gate` (kind `sprite`) and `enemy-hellhound` (kind `sprite-anim`) rows added; header comment counts recomputed (sprite 12→10, sprite-anim 2→3, total 38→37) and verified against the array's actual `.length`.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria grep checks and verification commands passed on first attempt (one micro-fix: an explanatory code comment initially contained the substring `land:`, which double-counted against the `grep -c "land:"` acceptance criterion — reworded the comment to remove the incidental match; not a functional change).

## Verification

- `node --input-type=module -e "import { CONFIG } from './src/config.js'; ..."` → `config OK` (PLAYER_FRAMES=12, ENEMY.SPRITES=["enemy-hellhound"], PLAYER_FALL_SPEED/PLAYER_LAND_HOLD_MS truthy)
- `bash scripts/check-import-safety.sh` → PASS
- `bash scripts/check-safety.sh` → PASS
- `node --input-type=module -e "import { ASSETS_MANIFEST } from './src/assets-manifest.js'; console.log(ASSETS_MANIFEST.length);"` → `37` (matches header comment total exactly)
- All per-task grep acceptance criteria (12 checks across 3 tasks) passed.

## Known Stubs / Deferred Verification

- `assets/math-gate.png` does not yet exist on disk in this worktree — it is baked by the parallel Plan 33-01 (wave 1, no `depends_on` between 33-01 and 33-02). This plan's own `<done>` criterion for Task 3 explicitly defers the full on-disk existence proof (`check-assets-manifest.mjs`) to Plan 33-04/33-05, once 33-01's baked assets merge into the same tree. `assets/player-swamphunter.png` and `assets/enemy-hellhound.png` already exist on disk (baked in Phase 31) and were spot-checked present.
- No stub UI/data patterns introduced — this plan is pure boot-time registration wiring, no rendering logic.

## Threat Flags

None — this plan's own threat register (T-33-04, silent asset-load 404) was fully mitigated in Task 3 by mirroring every new/changed `loadSprite` path into `assets-manifest.js` in the same plan. No new trust boundary or security-relevant surface introduced.

## Self-Check: PASSED

- FOUND: src/config.js (modified, PLAYER_FRAMES=12 confirmed via node import)
- FOUND: src/main.js (modified, check-import-safety.sh PASS)
- FOUND: src/assets-manifest.js (modified, ASSETS_MANIFEST.length=37 confirmed)
- FOUND commit ac14a1c (config.js)
- FOUND commit 3c4b752 (main.js)
- FOUND commit 3fa7b12 (assets-manifest.js)
