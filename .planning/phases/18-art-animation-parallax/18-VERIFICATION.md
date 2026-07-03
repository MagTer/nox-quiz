---
phase: 18-art-animation-parallax
verified: 2026-07-03T15:45:00Z
status: passed
score: 6/6 must-haves verified
human_sign_off: Auto-approved in autonomous mode; real-browser boot navigates title -> select -> level-01/02/03/04 -> title -> select with zero runtime errors, and title/select screenshots confirm readable wordmark, distinct tile states, and no pink/motion.
behavior_unverified: 0
behavior_unverified_items: []
---

# Phase 18: Art, Animation & Parallax Verification Report

**Phase Goal:** Make the working four-level platformer look and feel like a real game by layering art, animation, and atmosphere onto the verified logic: animated player character, dark-grunge tileset, calm camera-tied parallax background, and styled title/level-select screens — while keeping every Kaplay reference inside function bodies (a727c13) and preserving movement/collider/level-geometry contracts.
**Verified:** 2026-07-03T15:45:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | ART-01: Player sprite is a 5-frame sheet with idle/run/jump anims loaded via `loadSprite` + `sliceX`/`anims` | ✓ VERIFIED | `src/main.js` loads player with `sliceX: CONFIG.PLAYER_FRAMES` and named `anims`; `assets/player.png` is 80x32. |
| 2 | ART-01: Player animation state machine switches states without frame-0 thrash and faces movement direction | ✓ VERIFIED | `src/player.js` uses `getCurAnim()?.name !== target` guard and deadzone-gated `flipX`. |
| 3 | ART-02: Ground tileset is a 5-frame sheet and visual tiles pick left/center/right/single/underside frames | ✓ VERIFIED | `assets/tiles/ground.png` is 80x16; `src/levels/build.js` defines `pickTopFrame` and passes `{ frame: ... }` to `sprite("ground")`. |
| 4 | ART-03: Three parallax layers are camera-driven, tiled, and cleaned on scene leave | ✓ VERIFIED | `src/parallax.js` uses `getCamPos().x` only; `src/scenes/game.js` creates/updates layers and `destroyAll("parallax")` on leave. |
| 5 | ART-04: Title and select screens share the dark-grunge title-bg backdrop with no pink and readable text | ✓ VERIFIED | `src/scenes/title.js` and `src/scenes/select.js` add `sprite("title-bg")` with `fixed()` and `z(CONFIG.TITLE_BG_Z)`; screenshots show readable wordmark/tiles. |
| 6 | Engineering: No timers introduced; a727c13 import-safety gate passes for new modules | ✓ VERIFIED | `bash scripts/check-safety.sh` PASS; `bash scripts/check-import-safety.sh` PASS and scans `src/parallax.js`. |

**Score:** 6/6 truths verified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `assets/player.png` | 80x32 player sheet, 5 frames | ✓ EXISTS | Dark silhouette, frames 0-1 idle, 2-3 run, 4 jump. |
| `assets/tiles/ground.png` | 80x16 ground sheet, 5 frames | ✓ EXISTS | Dark-grunge single/left/center/right/underside frames. |
| `assets/parallax/far.png` | 640x120 tileable far strip | ✓ EXISTS | Faint silhouette in #151515/#0f0f1a. |
| `assets/parallax/mid.png` | 640x144 tileable mid strip | ✓ EXISTS | Dark structural shapes in #111111/#1a1a20. |
| `assets/parallax/near.png` | 640x90 tileable near strip | ✓ EXISTS | Subtle grunge texture in #0f0f0f/#141414. |
| `assets/tiles/title-bg.png` | 640x360 dark-grunge backdrop | ✓ EXISTS | Low-contrast static texture. |
| `scripts/generate-art-assets.py` | Regenerates placeholder art | ✓ EXISTS | Uses PIL; deterministic grunge palette. |
| `src/config.js` | Animation/parallax/title constants | ✓ UPDATED | `PLAYER_*`, `GROUND_FRAMES`, `PARALLAX`, `TITLE_BG_Z`. |
| `src/main.js` | Sheet loads for player/ground/parallax/title-bg | ✓ UPDATED | Six `loadSprite` calls, no `loadSpriteSheet`. |
| `src/player.js` | Animation state machine + facing | ✓ UPDATED | Idle/run/jump with `getCurAnim()` guard. |
| `src/levels/build.js` | `pickTopFrame` + frame selection | ✓ UPDATED | Visual tiles use correct edge/center frames. |
| `src/parallax.js` | Pure parallax helpers | ✓ CREATED | `makeParallaxLayers` / `updateParallaxLayers`. |
| `src/scenes/game.js` | Parallax wiring + bounds derivation | ✓ UPDATED | Layers created/updated/cleaned; bounds derived from geometry. |
| `src/scenes/title.js` | title-bg backdrop | ✓ UPDATED | Backdrop added behind wordmark/prompt. |
| `src/scenes/select.js` | Styled tiles + backdrop | ✓ UPDATED | Palette per UI-SPEC; white active cursor. |
| `scripts/browser-boot.mjs` | Full round-trip boot check | ✓ UPDATED | title -> select -> all levels -> title -> select. |
| `scripts/check-import-safety.sh` | Scans `src/parallax.js` | ✓ UPDATED | Existence/syntax + a727c13 scan include parallax.js. |

**Artifacts:** 17/17 verified.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Real-browser round-trip boot | `node scripts/browser-boot.mjs` | PASS | ✓ PASS |
| Structural firewall gate | `bash scripts/check-gate.sh` | PASS | ✓ PASS |
| Import-safety / a727c13 gate | `bash scripts/check-import-safety.sh` | PASS | ✓ PASS |
| ADHD-safety gate | `bash scripts/check-safety.sh` | PASS | ✓ PASS |
| Progress/level smoke | `node scripts/smoke-progress.mjs` | PASS | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ART-01 | 18-01, 18-02 | Animated player with idle/run/jump + facing | ✓ SATISFIED | Player sheet + state machine in player.js. |
| ART-02 | 18-01, 18-02 | Dark-grunge tileset with edge/center frames | ✓ SATISFIED | Ground sheet + pickTopFrame in build.js. |
| ART-03 | 18-01, 18-03 | Camera-driven parallax background | ✓ SATISFIED | parallax.js + game.js wiring. |
| ART-04 | 18-01, 18-04 | Styled title/select screens | ✓ SATISFIED | title.js/select.js + title-bg backdrop. |
| SAFE-05 | 18-04 | Non-strobing, no over-stimulation | ✓ SATISFIED | Static backdrop; anims below flash cap; no timers. |

No orphaned requirements.

## Deviations Accepted

1. **Frame option instead of `frame()` component** — Kaplay does not expose a standalone `frame()` component; `src/levels/build.js` uses `sprite("ground", { frame: pickTopFrame(...) })`.
2. **Level bounds derived in game.js** — Authored descriptors do not yet carry `bounds`; `src/scenes/game.js` derives `bounds` from geometry and passes it to camera/parallax helpers.
3. **PLAYER_JUMP_SPEED = 1** — Kaplay rejects `speed: 0` even for a single-frame anim; the constant is set to 1, which still results in a single held frame.
4. **Human checkpoint auto-approved** — The checkpoint:human-verify gate was handled in autonomous mode using the passing browser boot and captured screenshots as evidence.

## Gaps Summary

No gaps. All Phase 18 requirements are satisfied, the static suite is green, and the automated real-browser round-trip boot across all levels passes with zero runtime errors. A final kid-UAT feel-check is deferred to Phase 19.

---

_Verified: 2026-07-03T15:45:00Z_
_Verifier: Claude (gsd-executor)_
