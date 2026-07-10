---
phase: 31-asset-bake-style-board-sign-off
plan: 04
subsystem: assets
tags: [gothicvania, pillow, art-pipeline, pink-gate, hue-shift, parallax, terrain-atlas]

# Dependency graph
requires:
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-01)
    provides: "assets/_gothicvania-src/ raw pack files (re-fetched fresh in this plan since the gitignored artifact doesn't propagate across worktrees)"
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-03)
    provides: "scripts/lib/pink_scan.py + scripts/check-pink-gate.sh — the gate this plan's output must pass"
provides:
  - "4 biome terrain atlases (assets/tiles/atlas-{swamp,town,cemetery,castle}.png, 32x32, 2 frames of 16x32 cap+fill each)"
  - "12 biome parallax layers (assets/parallax/{far,mid,near}-{swamp,town,cemetery,castle}.png, 640x120/144/90)"
  - "scripts/build-art-assets.py extended with GV_SRC, hue_shift_band(), _tile_to_width(), _bottom_anchor(), _bake_biome_atlas(), _bake_biome_parallax_layer(), and 8 per-biome build functions"
  - "Numeric proof that Town's roof/sky and Cemetery's horizon-glow sky are pink-gate clean post-retint"
affects: [31-05, 31-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "_bake_biome_atlas()/_bake_biome_parallax_layer() shared per-biome bake helpers, parameterized by crop rect / source path / palette / optional retint tuple — extends build_ground_theme()/build_parallax_theme()'s existing per-variant idiom to Gothicvania's non-grid source material"
    - "_tile_to_width()/_bottom_anchor() — horizontal-tile (not scale) + bottom-anchor-crop compositing for Gothicvania's seamless-tileable narrow parallax strips, distinct from Kenney's _scale_to_width (which stretches a wide panorama)"
    - "hue_shift_band() copied verbatim from styleboard.py into build-art-assets.py (same function, reused not reimplemented) — applied to source crops BEFORE _remap_luminance, per the plan's explicit requirement"

key-files:
  created:
    - "assets/tiles/atlas-swamp.png"
    - "assets/tiles/atlas-town.png"
    - "assets/tiles/atlas-cemetery.png"
    - "assets/tiles/atlas-castle.png"
    - "assets/parallax/far-swamp.png, mid-swamp.png, near-swamp.png"
    - "assets/parallax/far-town.png, mid-town.png, near-town.png"
    - "assets/parallax/far-cemetery.png, mid-cemetery.png, near-cemetery.png"
    - "assets/parallax/far-castle.png, mid-castle.png, near-castle.png"
  modified:
    - "scripts/build-art-assets.py"

key-decisions:
  - "Cemetery's terrain-atlas crop rects were deliberately chosen from the grass-tuft/rock region (0.9%/0.0% pre-remap pink) rather than the cross-shaped grass-cap-over-tombstone region initially considered, to avoid a dark violet/plum tombstone SHADOW tone (RGB (65,25,59), confirmed by direct pixel sampling) that numerically trips the pink-hue band despite not being a visually pink surface — no retint applied, per the plan's explicit 'use your own visual judgment' discretion"
  - "Gothicvania parallax source layers are seamless-tileable narrow vertical strips (not wide panoramas like Kenney's Background Elements), so a new _tile_to_width() helper repeats/pastes the source horizontally to reach 640px width, rather than build_parallax()'s existing _scale_to_width() which stretches — stretching would have distorted the source pixel density"
  - "All 4 biome atlases use a uniform 2-frame (cap + fill) 32x32 shape (16x32 per frame) rather than build_ground()'s 5-frame shape, since Gothicvania's non-grid interlocking terrain blocks don't map cleanly onto a single/left/center/right/underside frame set — this satisfies the plan's 'width multiple of 16, height 16 or 32' acceptance criterion while staying honest about what the hand-identified crops actually contain"
  - "The _gothicvania-src/ raw pack directory (Plan 31-01's gitignored artifact) does not propagate across git worktrees — re-fetched all 5 OGA zips fresh in this plan's worktree (same URLs/directory names as 31-01), verified zip-slip-safe and byte-size-matching before extraction, since no sibling worktree existed to copy from this time (unlike Plan 31-03's cross-worktree copy workaround)"

patterns-established:
  - "Per-biome bake functions parameterized through a single shared helper (_bake_biome_atlas / _bake_biome_parallax_layer) rather than 8 fully-duplicated function bodies — keeps the crop-rect/retint-tuple as the only per-biome-varying data, while the crop/retint/resize/remap/assert/save pipeline stays centralized and auditable in one place"

requirements-completed: [ART-01]

coverage:
  - id: D1
    description: "4 biome terrain atlases baked (swamp/town/cemetery/castle), each 32x32 (2 frames of 16x32 cap+fill), NEAREST-only resize, hand-identified crop rects (never auto-sliced), remapped onto ENVIRONMENT_PALETTE"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "python3 scripts/build-art-assets.py -> exit 0, prints 'generated assets/tiles/atlas-<biome>.png (32, 32)' for all 4; grep -c 'Image.LANCZOS' scripts/build-art-assets.py confirms zero LANCZOS calls inside the 4 new build_biome_atlas_* function bodies"
        status: pass
    human_judgment: false
  - id: D2
    description: "12 biome parallax layers baked (far/mid/near x 4 biomes), 640x120/144/90, via new tile-to-width + bottom-anchor + _remap_luminance pipeline"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "python3 scripts/build-art-assets.py -> exit 0, prints all 12 'generated assets/parallax/<layer>-<biome>.png (640, N)' lines"
        status: pass
    human_judgment: false
  - id: D3
    description: "Town's terrain-atlas + far-sky parallax and Cemetery's far-sky parallax are retinted (hue_shift_band, same params as styleboard.py's town()/cemetery()) and numerically proven pink-gate clean (RED pre-retint on the raw source, GREEN post-bake)"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "python3 scripts/lib/pink_scan.py assets/tiles/atlas-town.png -> 0.0000; python3 scripts/lib/pink_scan.py assets/parallax/far-town.png -> 0.0000; python3 scripts/lib/pink_scan.py assets/parallax/far-cemetery.png -> 0.0000 (raw pre-retint source measured 0.3309/0.6432/0.7868 respectively during this session)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full pink-gate wrapper passes clean over the newly-expanded assets/ tree (16 new files) after both tasks land"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "bash scripts/check-pink-gate.sh -> pink-gate checks: PASS, exit 0"
        status: pass
    human_judgment: false

duration: ~40min
completed: 2026-07-10
status: complete
---

# Phase 31 Plan 04: Biome Terrain Atlas & Parallax Baking Summary

**Extended `scripts/build-art-assets.py` with 4 biome terrain atlases + 12 parallax layers baked from the re-fetched Gothicvania packs, with Town's roof/sky and Cemetery's horizon-glow retinted via `hue_shift_band()` and numerically proven pink-gate clean (0.0000 post-bake, vs. 33%/64%/79% pre-retint on the raw source).**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-07-10T19:25:00Z (approx)
- **Completed:** 2026-07-10T20:02:14Z
- **Tasks:** 2/2
- **Files modified:** 1 script extended, 16 new PNGs (4 atlases + 12 parallax layers)

## Accomplishments
- Re-fetched all 5 Gothicvania OGA zip packs fresh into this worktree's `assets/_gothicvania-src/` (Plan 31-01's gitignored artifact doesn't propagate across worktrees, and no sibling worktree with it existed this time) — byte sizes matched 31-01-SUMMARY.md's recorded values exactly (swamp 436KB, town 9.08MB, cemetery 3.60MB, church 733KB, patreon 4.00MB), all verified zip-slip-safe via `zipfile.is_zipfile()` + path-traversal scan before extraction
- Hand-identified 8 crop rectangles (2 per biome: cap + fill) via a throwaway Pillow crop-preview loop against the real source tilesets, each visually verified before hardcoding — no generic/grid auto-slicer used anywhere (matches `build_door()`'s existing convention)
- Extended `scripts/build-art-assets.py` with: `GV_SRC` constant; `hue_shift_band()` copied verbatim from `styleboard.py`; `_tile_to_width()`/`_bottom_anchor()` (new — Gothicvania parallax layers are seamless-tileable narrow strips, not wide panoramas, so they're tiled not scaled); `_bake_biome_atlas()`/`_bake_biome_parallax_layer()` shared per-biome helpers; and the 8 `build_biome_atlas_*()`/`build_biome_parallax_*()` functions, all appended to the bottom dispatch block
- Town's roof/rooftop terrain crops and dusk-sky parallax retinted via `hue_shift_band(215, 255, -60)` (the exact call already proven in `styleboard.py`'s `town()`) — raw source measured ~33% (tileset) / ~64% (background) dominant-pink; both baked outputs measure `0.0000` post-bake
- Cemetery's horizon-glow sky parallax + mountains mid-layer retinted via `hue_shift_band(195, 245, -50)` (mirrors `styleboard.py`'s `cemetery()`) — raw sky measured ~79% dominant-pink pre-retint, baked output measures `0.0000`
- Cemetery's terrain atlas crop rects were deliberately chosen from a clean grass-tuft/rock region (0.9%/0.0% pre-remap) rather than retinting — direct pixel sampling confirmed the full sheet's ~8.7% figure was dominated by a single dark violet/plum tombstone shadow tone `(65,25,59)`, the same low-brightness HSV-instability class already documented for `assets/player-swamphunter.png`'s pink-scan allowlist entry, not a genuinely pink surface
- Swamp and Castle (all crops/layers) measured 0% or near-0% dominant-pink — no retint needed
- `bash scripts/check-pink-gate.sh` passes clean over the full, newly-expanded `assets/` tree (16 new files)
- Re-ran `python3 scripts/build-art-assets.py` a second time after committing — fully reproducible, byte-identical output, zero git diff

## Task Commits

Each task was committed atomically:

1. **Task 1: Terrain atlas baking — 4 biomes** - `eb8fe9d` (feat)
2. **Task 2: Parallax layer baking — 4 biomes x 3 layers** - `c5fc233` (feat)

**Plan metadata:** (this SUMMARY.md commit, see below)

Note: `scripts/build-art-assets.py`'s edit was one contiguous insertion covering both tasks' shared helpers and all 8 new functions (Task 1's atlas builders and Task 2's parallax builders share the file's single edit region and could not be cleanly split into two separate hunks) — the full script diff is committed with Task 1; Task 2's commit contains only its 12 new PNG outputs, which the already-committed script code produces.

## Files Created/Modified
- `scripts/build-art-assets.py` - extended with `GV_SRC`, `hue_shift_band()`, `_tile_to_width()`, `_bottom_anchor()`, `_bake_biome_atlas()`, `_bake_biome_parallax_layer()`, 8 per-biome build functions, 8 new dispatch calls
- `assets/tiles/atlas-swamp.png`, `atlas-town.png`, `atlas-cemetery.png`, `atlas-castle.png` - 32x32 each (2 frames of 16x32: cap + fill)
- `assets/parallax/far-swamp.png`, `mid-swamp.png`, `near-swamp.png` - 640x120/144/90
- `assets/parallax/far-town.png`, `mid-town.png`, `near-town.png` - 640x120/144/90 (far retinted)
- `assets/parallax/far-cemetery.png`, `mid-cemetery.png`, `near-cemetery.png` - 640x120/144/90 (far + mid retinted)
- `assets/parallax/far-castle.png`, `mid-castle.png`, `near-castle.png` - 640x120/144/90

## Decisions Made
- Cemetery terrain-atlas crop rects chosen to avoid the tombstone-shadow HSV artifact entirely rather than retinting it (see key-decisions above) — a genuine visual judgment call per the plan's explicit discretion, backed by direct pixel sampling proof (only one unique flagged RGB value, `(65,25,59)`, across both candidate crops).
- All 4 biome atlases use a uniform 2-frame (cap + fill) shape rather than build_ground()'s 5-frame single/left/center/right/underside shape — Gothicvania's non-grid interlocking terrain blocks don't decompose cleanly into that shape, and forcing it would have meant either fabricating frame boundaries that don't exist in the source art or picking visually arbitrary sub-crops. Two clearly-identifiable, hand-verified frames (a capped/topped tile and a fill/edge tile) per biome satisfies the plan's literal acceptance criteria (width multiple of 16, height 16 or 32) while staying honest about what the source material actually contains.
- Wrote `_tile_to_width()`/`_bottom_anchor()` as new helpers rather than reusing `_scale_to_width()` — confirmed via direct visual inspection that Gothicvania's parallax source files (e.g. swamp's 96x256 `background.png`) are seamless-tileable narrow strips meant to repeat across a level's width, not single wide panorama images like Kenney's "Background Elements" — stretching them via `_scale_to_width` would have visibly distorted the pixel density.
- Applied the required Town/Cemetery retints as instructed even though `_remap_luminance`'s achromatic output palette (verified empirically this session: remapping a raw, un-retinted pink crop through `_remap_luminance` already independently produces `0.0000` on `pink_scan.py`, since the palette itself contains no hue) makes the retint technically inert for THIS specific pipeline stage — followed the plan's explicit instruction ("do not silently skip the retint") rather than skip it on the strength of that finding, since the instruction's intent (prove the source material is handled, not just rely on incidental palette behavior) still has value as defense-in-depth if a future phase changes the remap step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Re-fetched Plan 31-01's gitignored source packs fresh (no sibling worktree available)**
- **Found during:** Setup, before Task 1
- **Issue:** This plan depends on Plan 31-01's `assets/_gothicvania-src/` output, but that directory is intentionally gitignored (per 31-01's own decision) and does not propagate via git into this isolated parallel worktree. Unlike Plan 31-03 (which copied the two files it needed from a sibling worktree that still existed), no sibling worktree exists anymore at this plan's execution time (`git worktree list` showed only this worktree and the main checkout).
- **Fix:** Re-fetched all 5 OGA zip URLs (identical URLs to 31-01, from ASSET-SCOUTING.md) directly into this worktree's `assets/_gothicvania-src/`, following the exact same integrity checks (`zipfile.is_zipfile()`, zip-slip path-traversal scan) and directory-naming convention 31-01 established. Verified byte sizes matched 31-01-SUMMARY.md's recorded figures exactly before proceeding.
- **Files modified:** none tracked (gitignored path only)
- **Verification:** All 19 source file paths/sizes referenced by this plan's `<action>` text were confirmed present and byte-size-matching before any crop/bake work began; `git check-ignore -q assets/_gothicvania-src` confirmed the directory stayed genuinely ignored throughout.
- **Committed in:** N/A (no git-tracked files changed by this fix — purely local re-fetch of already-gitignored, re-fetchable content)

**2. [Rule 1 - Bug] Removed a stray regenerated `.planning/phases/26-*` artifact produced by running the full build script**
- **Found during:** Task 1, immediately after the first `python3 scripts/build-art-assets.py` run
- **Issue:** The full build script's dispatch block includes `build_palette_swatch()` (a pre-existing, unrelated Phase 26 debug-proof-image function), which writes to `.planning/phases/26-grunge-palette-nox-run-rebrand/26-PALETTE-SWATCH.png` — a directory that a prior commit (`bdabecf chore: archive phase directories from completed milestones`) had intentionally archived out of the live `.planning/phases/` tree. Running the script recreated this now-defunct directory as an untracked artifact.
- **Fix:** Deleted the recreated directory (`rm -rf`, untracked-only, no git operation) after each of the two build runs in this session, before staging/committing.
- **Files modified:** none (untracked artifact only, never staged)
- **Verification:** `git status --short` confirmed no `26-grunge-palette-*` entries remained before either commit.
- **Committed in:** N/A (nothing to commit — the artifact was deleted, not committed)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency re-fetch, 1 bug/out-of-scope-artifact cleanup)
**Impact on plan:** Both were mechanical prerequisites to correctly executing this plan's own scope; no change to the plan's actual deliverables, crop choices, or retint logic.

## Issues Encountered
None beyond the deviations documented above.

## Known Stubs
None — all 16 output files are real baked PNGs from real source crops, not placeholders.

## Threat Flags
None — this plan's `<threat_model>` already anticipated its only two threats (T-31-09 hand-crop tampering, T-31-10 retint-decision repudiation), both mitigated as designed (visual verification before every crop; numeric before/after pink-scan proof). No new network endpoints, auth paths, or trust-boundary changes introduced.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 biome terrain atlases and 12 parallax layers are baked, vendored under `assets/tiles/`/`assets/parallax/`, and proven pink-gate clean.
- `scripts/build-art-assets.py` is fully reproducible — re-running it a second time after committing produced byte-identical output (confirmed via `git status --short` showing zero diff).
- Plan 31-05 (player/enemy sprite baking) and Plan 31-06 (CREDITS.md rows + `assets/LICENSES/*.txt` proofs, final regression pink-scan) can both proceed — this plan's crop-rect/retint decisions and the re-fetched `assets/_gothicvania-src/` tree are available for their reference.
- No blockers. Note for Plan 31-06: this plan's re-fetch of `assets/_gothicvania-src/` (Deviation 1) is itself gitignored and will not propagate to that plan's worktree either — it will need its own re-fetch or a cross-worktree copy, same as this plan and Plan 31-03 both independently needed.

---
*Phase: 31-asset-bake-style-board-sign-off*
*Completed: 2026-07-10*

## Self-Check: PASSED

All 16 baked PNG output files confirmed present on disk at their declared paths; all 3 commits (`eb8fe9d`, `c5fc233`, `2cc6134`) confirmed present in git log. `bash scripts/check-pink-gate.sh` re-run clean immediately before this check.
