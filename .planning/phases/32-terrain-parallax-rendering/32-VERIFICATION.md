---
phase: 32-terrain-parallax-rendering
verified: 2026-07-11T12:45:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 32: Terrain & Parallax Rendering Verification Report

**Phase Goal:** Levels stand on solid, filled ground under real layered skies — the rendering machinery (autotiler, chunked fill, biome threading, manifest) lands with kid-validated geometry byte-frozen
**Verified:** 2026-07-11T12:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Ground reads as a solid autotiled mass (cap+fill), colliders untouched | VERIFIED | `src/levels/build.js`'s `emitTerrainRun()` (lines 109-158) replaces the old `pickTopFrame()` single-row strip with a chunked `{tiled:true}` fill (`ground-fill`) + per-tile cap row (`ground-cap`), read against `CONFIG.TERRAIN.FILL_CHUNK_COLS/FLOOR_FILL_DEPTH_PX/PLATFORM_FILL_DEPTH_PX`. Collider blocks (`rect()+body({isStatic:true})`, lines 169-176 and 187-194) are byte-identical to pre-phase and physically separate from the visual emission calls. Confirmed live: `node scripts/browser-boot.mjs` PASS (full 8-level drive, run independently in this session) and my own manual screenshots of level-01 show a full-depth textured ground mass, not a 16px strip. |
| 2 | Each biome shows a real multi-layer parallax background that moves with camera | VERIFIED | `src/parallax.js`'s `makeParallaxLayers(bounds, biome)` builds far/mid/near layers named `bg-<layer>-<biome>`; `src/scenes/game.js:129` passes `level.biome`. `updateParallaxLayers` (unchanged, ratio-driven) moves layers with `camX`. Manually screenshotted 4 distinct biomes (swamp/level-01, town/level-03, cemetery/level-05, castle/level-07) via direct `go("game",{levelId})` — each shows genuinely different art (skull/vine silhouettes for swamp, house/tower silhouettes for town, tombstone/dead-tree silhouettes for cemetery, castle window/portcullis silhouettes for castle), replacing the old flat triangle placeholders. |
| 3 | Frame rate holds and nothing renders blank at the far end of every level; perf/screenshot checks are real hard-failing gates | VERIFIED | `scripts/browser-boot.mjs` adds `assertScreenshotNonBlank`, `assertFpsFloor`, `assertObjectBudget` (lines 118-152), wired at level-entry (lines 444-446) AND at the far-end goal (line 519), all reading `CONFIG.TERRAIN` thresholds and `errors.push()` (hard-fail, non-zero exit on violation — never silently swallowed). Far-end proof resolves every remaining chained encounter before driving to `goal.x` (lines 506-511), closing the CR-01 gap the code review caught and fixed. I ran `node scripts/browser-boot.mjs` myself (not trusting SUMMARY/REVIEW claims) — result: `Browser boot: PASS — title -> select -> all levels loaded with no runtime errors`, covering all 8 levels including level-03/level-04, the two levels CR-01's deeper fix specifically targeted. |
| 4 | Every sprite/sound the game loads exists on disk — manifest + static existence gate | VERIFIED | `src/assets-manifest.js` exports `ASSETS_MANIFEST` (38 entries: 4 biome-atlas, 12 biome-bg, 12 sprite, 2 sprite-anim, 7 sound, 1 music) as a zero-import pure data module. `scripts/check-assets-manifest.mjs` is a standalone Node ESM gate asserting on-disk existence per entry. `src/main.js` (lines 97-108) loads `biome-atlas`/`biome-bg` entries via a manifest-driven loop, replacing the old hand-written per-theme-N block; every other hand-written load (door/enemy/player/audio) is untouched, matching CONTEXT's scope decision. I ran the gate myself: `check-assets-manifest: PASS — 38 assets verified on disk.` |
| 5 | Level geometry arrays byte-identical pre/post phase; validator stays green | VERIFIED | `git diff <pre-phase-32-commit> -- src/levels/level-0{1..8}.js` for all 8 levels shows the ONLY change is the top-level `theme:` -> `biome:` field/comment; nothing inside any `geometry: {...}` block changed (confirmed by direct diff inspection, not by trusting SUMMARY). `node scripts/validate-levels.mjs` run by me: `validate-levels: PASS`, zero HARD-FAILs across all 8 levels, including new `biome | PASS` rows (WR-01's added check, live and exercised). |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/assets-manifest.js` | 38-entry `{key,path,kind}` pure data module | VERIFIED | Exists, 38 entries, zero imports, matches plan-declared groupings exactly |
| `scripts/check-assets-manifest.mjs` | Node gate, exit 1 on missing path | VERIFIED | Ran live: PASS, 38/38 verified |
| `CONFIG.TERRAIN` (`src/config.js`) | 6 tunables: FILL_CHUNK_COLS, FLOOR_FILL_DEPTH_PX, PLATFORM_FILL_DEPTH_PX, OBJECT_BUDGET, FPS_FLOOR, MIN_SCREENSHOT_BYTES | VERIFIED | Present at lines 106-113, all 6 keys with documented values, consumed by both `build.js` and `browser-boot.mjs` |
| `biome` field on all 8 `level-0N.js` | required, one of swamp/town/cemetery/castle | VERIFIED | Confirmed on all 8 files; `theme` field fully removed (0 remaining references, confirmed via grep and `validate-levels.mjs`'s new HARD-FAIL check) |
| `emitTerrainRun()` in `src/levels/build.js` | autotile cap+fill renderer replacing `pickTopFrame()` | VERIFIED | Present (lines 109-158), `pickTopFrame` fully removed, tags `ground-cap`/`ground-fill` emitted for both floors and platforms |
| `makeParallaxLayers(bounds, biome)` in `src/parallax.js` | biome-driven layer naming | VERIFIED | Parameter renamed `theme`->`biome`, ternary logic unchanged, `game.js` call site passes `level.biome` |
| Manifest-driven load loop in `src/main.js` | replaces hand-written theme-N block | VERIFIED | Present (lines 97-108), dispatches on `kind` for `biome-atlas`/`biome-bg` |
| 3 new assertion helpers in `scripts/browser-boot.mjs` | assertScreenshotNonBlank/assertFpsFloor/assertObjectBudget | VERIFIED | All 3 present (lines 118-152), wired at level-entry and far-end |
| 32 deleted theme-N asset files | ground-theme-{1-8}.png + parallax {far,mid,near}-theme-{1-8}.png | VERIFIED | `ls assets/tiles`/`assets/parallax` — zero `*theme*` files remain |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/assets-manifest.js` | `scripts/check-assets-manifest.mjs` | Node import, existence check | WIRED | Gate imports and iterates `ASSETS_MANIFEST`, ran live PASS |
| `src/assets-manifest.js` | `src/main.js` | manifest-driven load loop | WIRED | `for (const a of ASSETS_MANIFEST)` dispatches by `kind` |
| `CONFIG.TERRAIN` | `src/levels/build.js` | chunk/fill-depth consts read at top of `buildLevel()` | WIRED | `FILL_CHUNK_COLS`/`FLOOR_FILL_DEPTH_PX`/`PLATFORM_FILL_DEPTH_PX` read from `CONFIG.TERRAIN` |
| `CONFIG.TERRAIN` | `scripts/browser-boot.mjs` | assertion helper thresholds | WIRED | All 3 helpers read `CONFIG.TERRAIN.*` |
| `level.biome` | `src/levels/build.js` atlas selection | `atlas-${levelData.biome}` | WIRED | Line 79 |
| `level.biome` | `src/parallax.js` via `src/scenes/game.js` | `makeParallaxLayers(bounds, level.biome)` | WIRED | game.js line 129 |
| `"ground-cap"`/`"ground-fill"` tags | `scripts/browser-boot.mjs` object-count query | `get("ground-cap").length + get("ground-fill").length` | WIRED | `assertObjectBudget` line 145 |

### Behavioral Spot-Checks (my own live runs, not trusting SUMMARY/REVIEW)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full browser drive across all 8 levels (entry + far-end + FPS + object-budget + screenshot) | `node scripts/browser-boot.mjs` | `Browser boot: PASS` | PASS |
| Static level validator incl. new biome HARD-FAIL check | `node scripts/validate-levels.mjs` | `validate-levels: PASS`, zero HARD-FAIL, `biome | PASS` for all 8 levels | PASS |
| Asset manifest existence gate | `node scripts/check-assets-manifest.mjs` | `38 assets verified on disk` | PASS |
| No-timer/forgiving-mandate scan | `bash scripts/check-safety.sh` | `safety checks: PASS` | PASS |
| a727c13 module-top-level engine-global guard | `bash scripts/check-import-safety.sh` | `import-safety checks: PASS` | PASS |
| Math-gate/challenge invariants | `bash scripts/check-gate.sh` | `gate checks: PASS` | PASS |
| Progress/save invariants + smoke-progress | `bash scripts/check-progress.sh` | `smoke-progress: PASS`, `progress checks: PASS` | PASS |
| Manual visual spot-check: 4 biomes via direct `go("game",{levelId})` (bypassing select's unlock gating) | headless Playwright screenshots | swamp/town/cemetery/castle each show distinct multi-layer parallax art + a full-depth textured ground mass (not a floating strip) | PASS |
| Level geometry byte-identity | `git diff <pre-phase-32 commit> -- src/levels/level-0N.js` (all 8) | only `theme:`->`biome:` field/comment changed; zero diff inside any `geometry: {...}` block | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|--------------|--------|----------|
| ART-02 | 32-01, 32-02, 32-03, 32-04, 32-05 | Filled terrain — solid autotiled ground mass replacing floating strip, colliders untouched | SATISFIED | `emitTerrainRun()`, manifest, CONFIG.TERRAIN, browser-boot object-budget/screenshot checks all live and passing |
| ART-03 | 32-01, 32-02, 32-04, 32-05 | Real per-biome multi-layer parallax replacing flat triangle silhouettes | SATISFIED | `makeParallaxLayers(bounds, biome)`, biome field on all 8 levels, visually confirmed distinct art per biome |

Both requirement IDs cross-reference cleanly against `.planning/REQUIREMENTS.md` (lines 22-23, both marked `[x]` and mapped `Phase 32 | Complete` at lines 96-97). No orphaned requirements — every ID declared across all 5 plans' frontmatter matches REQUIREMENTS.md's Phase 32 mapping exactly, and no additional Phase-32-mapped ID exists that isn't claimed by a plan.

### Anti-Patterns Found

None. Scanned all files modified across the 5 plans for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` — zero matches. No stub returns, no hardcoded-empty data flowing to render, no console.log-only implementations.

### Code Review Status

`32-REVIEW.md` (re-review, iteration 2): 0 critical, 0 warning, 4 info (all either pre-existing/carried-forward dead-code notes or comment-accuracy nits, none blocking). `32-REVIEW-FIX.md` documents a genuine two-layer fix for CR-01 (the far-end check originally resolved only the first encounter, masking a real deterministic `driveToXPlanned` stall on level-03/level-04 caused by a spike-hop/mount-takeoff fire-window conflict in `scripts/lib/route-planner.mjs`) plus WR-01 (biome enum HARD-FAIL check) and WR-02 (cap-tile width-clamp height regression guard). The re-review independently re-ran every gate live and confirmed all fixes. I did not stop at re-reading this documentation — I re-ran `node scripts/browser-boot.mjs`, `node scripts/validate-levels.mjs`, `node scripts/check-assets-manifest.mjs`, and all four `check-*.sh` gates myself in this session, plus added my own manual 4-biome visual spot-check that neither the review nor the summaries performed (all screenshotted, not merely asserted).

### Human Verification Required

None. This phase is pure rendering/tooling with no new player-facing interactive mechanic — the automated gates (all independently re-run live in this session) plus the code review's own live-verified fix pass plus my own manual visual spot-check across all 4 biomes together satisfy this project's "checks that don't play the game lie" standard for this phase's actual scope.

### Gaps Summary

None. All 5 roadmap success criteria are independently verified against the live codebase, not just SUMMARY/REVIEW claims — including a full independent re-run of `browser-boot.mjs` (which itself performs a real headless-browser drive across all 8 levels with FPS/object-budget/screenshot/far-end checks) and a manual 4-biome visual spot-check I performed myself.

---

_Verified: 2026-07-11T12:45:00Z_
_Verifier: Claude (gsd-verifier)_
