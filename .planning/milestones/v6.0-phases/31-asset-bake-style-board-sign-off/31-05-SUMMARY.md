---
phase: 31-asset-bake-style-board-sign-off
plan: 05
subsystem: assets
tags: [gothicvania, pillow, art-pipeline, pink-gate, player-sprite, enemy-sprite, level-design-docs]

# Dependency graph
requires:
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-01)
    provides: "assets/_gothicvania-src/ raw pack files (re-fetched fresh in this plan since the gitignored artifact doesn't propagate across worktrees)"
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-02)
    provides: "The signed-off style board decisions: Swamp Hunter as player across all 4 biomes, Hell hound as castle enemy"
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-03)
    provides: "scripts/lib/pink_scan.py + scripts/check-pink-gate.sh, including the pre-existing assets/player-swamphunter.png allowlist entry"
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-04)
    provides: "The 4 baked biome terrain atlases whose real crop-rect geometry this plan's anchor/lip doc measures and documents"
provides:
  - "assets/player-swamphunter.png (192x32, 12 frames: idle/run/jump/fall) at native Gothicvania colors"
  - "assets/enemy-hellhound.png (384x32, 6 idle-only frames) at native Gothicvania colors"
  - "docs/LEVEL-DESIGN.md Section 9: real, pixel-measured cap-tile lip-offset convention per biome, plus a collider-vs-sprite warning for Phase 32"
affects: [31-06, 32, 33]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native-color (non-remapped) character sprite bake: a deliberate exception to this file's usual _remap/_remap_luminance pipeline, applied only to direct style-board picks (player, castle enemy) per CONTEXT.md's explicit framing"
    - "Pixel-scanned lip-offset measurement: row-by-row alpha/luminance scan of the real baked cap frame to find where a decorative top silhouette becomes fully opaque across the full tile width, rather than citing an unverified estimate"

key-files:
  created:
    - "assets/player-swamphunter.png"
    - "assets/enemy-hellhound.png"
  modified:
    - "scripts/build-art-assets.py"
    - "docs/LEVEL-DESIGN.md"

key-decisions:
  - "Re-fetched all 5 Gothicvania OGA zips fresh into this worktree (assets/_gothicvania-src/ is gitignored and does not propagate across worktrees, same finding as Plan 31-04) — byte sizes matched 31-01/31-04-SUMMARY.md's recorded values exactly, verified zip-slip-safe before extraction"
  - "Player sheet uses 6 hand-picked run frames (run1/4/6/9/11/14) spaced evenly across the 14-frame cycle, not a contiguous slice, so the baked loop reads as a full stride rather than a truncated fragment"
  - "Lip-offset numbers are reported per-biome, not averaged, because they genuinely differ in kind: Swamp is a clean shallow lip (~4px), Town's crop is a full roof silhouette (~26px), Cemetery's crop is a floating mound that doesn't reach the tile's bottom edge at all, and Castle's crop has its gold-trim highlight at the BOTTOM of the tile (an inverted lip), not the top — flagging these honestly rather than forcing a single uniform number"

patterns-established:
  - "Anchor/lip convention numbers must come from a real pixel scan of the actual baked atlas, not from SPIKE-FINDINGS.md's exploratory estimate — this plan's Section 9 write-up sets that precedent for any future biome-atlas documentation"

requirements-completed: []

coverage:
  - id: D1
    description: "assets/player-swamphunter.png baked (192x32, 12 frames: 2 idle + 6 run + 2 jump + 2 fall) from the Swamp Hunter's own source set, shared-scale-factor Pattern 1 idiom, native (non-remapped) color"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "python3 scripts/build-art-assets.py -> prints 'generated assets/player-swamphunter.png (192, 32)'; grep -A15 'def build_player_swamphunter' scripts/build-art-assets.py shows zero _remap(/_remap_luminance( calls; re-run produced a byte-identical file (cmp clean)"
        status: pass
    human_judgment: false
  - id: D2
    description: "assets/enemy-hellhound.png baked (384x32, 6 idle-only frames) — walk/run/jump sources never referenced, native color"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "python3 scripts/build-art-assets.py -> prints 'generated assets/enemy-hellhound.png (384, 32)'; grep -c 'hell-hound-walk\\|hell-hound-run\\|hell-hound-jump' inside build_enemy_hellhound() body -> 0; 384%64==0 and height==32 confirmed"
        status: pass
    human_judgment: false
  - id: D3
    description: "assets/player-swamphunter.png's pink-gate status confirmed (measured 43.3% dominant pink/magenta hue, correctly suppressed by the pre-existing allowlist entry) and the full pink-gate still passes over the expanded assets/ tree"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "python3 scripts/lib/pink_scan.py assets/player-swamphunter.png -> 0.4328; bash scripts/check-pink-gate.sh -> 'ALLOWLISTED (not a failure): .../assets/player-swamphunter.png (43.3%) ...' then 'pink-gate checks: PASS'"
        status: pass
    human_judgment: false
  - id: D4
    description: "docs/LEVEL-DESIGN.md documents the real, measured 16x32 cap-tile + per-biome lip-offset convention from Plan 31-04's actual baked atlases, with an explicit collider-vs-sprite warning for Phase 32"
    requirement: "ART-01"
    verification:
      - kind: other
        ref: "grep -n '^## ' docs/LEVEL-DESIGN.md shows exactly one new '## 9. Biome atlas anchor/lip convention (ART-01)' heading, positioned after '## 8. Workflow'; grep -c 'solid ground' docs/LEVEL-DESIGN.md -> 3 (>= 2 required)"
        status: pass
    human_judgment: false

duration: ~8min
completed: 2026-07-10
status: complete
---

# Phase 31 Plan 05: Player + Enemy Sprite Bake & Anchor/Lip Convention Doc Summary

**Baked the signed-off Swamp Hunter player (192x32, 12-frame idle/run/jump/fall) and Hell hound static enemy (384x32, 6 idle frames) at native Gothicvania color, then documented the REAL pixel-measured cap-tile lip-offset convention per biome (finding two irregular cases — Cemetery's floating-mound crop and Castle's inverted bottom-anchored gold trim — rather than forcing a false uniform number).**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-10T18:06:01Z
- **Completed:** 2026-07-10T18:12:28Z (build/doc work) + this SUMMARY
- **Tasks:** 2/2
- **Files modified:** 3 (`scripts/build-art-assets.py`, `docs/LEVEL-DESIGN.md`) + 2 new PNGs

## Accomplishments
- Re-fetched all 5 Gothicvania OGA zip packs fresh into this worktree's `assets/_gothicvania-src/` (gitignored artifact, doesn't propagate across worktrees — same finding as Plan 31-04); byte sizes matched 31-01/31-04-SUMMARY.md's recorded values exactly, verified zip-slip-safe before extraction
- Extended `scripts/build-art-assets.py` with `build_player_swamphunter()` (12-frame idle/run/jump/fall sheet, shared-scale-factor Pattern 1 idiom mirroring `build_player()`, native color — no `_remap`/`_remap_luminance`) and `build_enemy_hellhound()` (6 idle-only frames sliced from `hell-hound-idle.png`, native color, walk/run/jump sources never referenced)
- Both new calls appended to the bottom dispatch block after Plan 31-04's biome calls
- `assets/player-swamphunter.png` measures 43.3% dominant pink/magenta hue — well above the plan's "MAY report ≥0.08" prediction, but correctly suppressed by the pre-existing, correctly-path-matched allowlist entry in `scripts/lib/pink_scan.py`; `bash scripts/check-pink-gate.sh` reports the allowlist hit explicitly and still exits 0 (PASS)
- Re-ran `python3 scripts/build-art-assets.py` a second time after building — fully reproducible, byte-identical output for both new sprites (confirmed via `cmp`)
- Wrote `docs/LEVEL-DESIGN.md` Section 9 (anchor/lip convention) using a real row-by-row alpha/luminance scan of each biome's actual baked cap frame (not SPIKE-FINDINGS.md's unverified "~20-24px" estimate): Swamp ~4px (clean shallow lip), Town ~26px (the crop is a full roof silhouette, not a shallow lip), Cemetery flagged as not fitting the model at all (a floating mound shape that doesn't reach the tile's bottom edge — a direct consequence of Plan 31-04's deliberate pink-avoidance crop choice), Castle flagged as an inverted lip (the gold-trim highlight sits at the bottom of the crop, not the top)
- Included the explicit collider-vs-sprite warning for Phase 32: the lip is a rendering offset only, never a physics offset

## Task Commits

Each task was committed atomically:

1. **Task 1: Player (Swamp Hunter) and enemy (Hell hound) sprite baking** - `507eb20` (feat)
2. **Task 2: Anchor/lip convention documentation** - `b6564a3` (docs)

**Plan metadata:** this SUMMARY commit (docs, made per worktree convention — orchestrator/wave-merge owns STATE.md/ROADMAP.md updates)

## Files Created/Modified
- `scripts/build-art-assets.py` - added `build_player_swamphunter()`, `build_enemy_hellhound()`, 2 new dispatch calls
- `assets/player-swamphunter.png` - 192x32, 12 frames (2 idle + 6 run + 2 jump + 2 fall), native Gothicvania color
- `assets/enemy-hellhound.png` - 384x32, 6 idle-only frames, native Gothicvania color
- `docs/LEVEL-DESIGN.md` - new Section 9 (anchor/lip convention), positioned after Section 8 (Workflow)

## Decisions Made
- Player run-frame selection: 6 hand-picked frames (run1/4/6/9/11/14) spaced evenly across the 14-frame cycle rather than a contiguous slice, so the baked run loop reads as a full stride rather than a truncated fragment — documented in the function's docstring per `build_player()`'s own convention.
- Both new bakes deliberately skip `_remap`/`_remap_luminance` — CONTEXT.md and 31-02-SUMMARY.md frame both sprites as direct style-board picks (the kid's explicit choice after a 5-round sign-off), so palette-conforming them would silently change what was actually shown and approved.
- Lip-offset numbers documented per-biome rather than averaged: Swamp and Town both fit the simple "decorative top / solid bottom" model at genuinely different depths (4px vs 26px), while Cemetery and Castle do NOT fit the model at all — rather than force a single misleading number, both irregular cases are flagged explicitly with a concrete Phase-32 follow-up note, matching this plan's threat-model requirement (T-31-12) that the documented numbers be real, not projected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Re-fetched Plan 31-01's gitignored source packs fresh (no sibling worktree available)**
- **Found during:** Setup, before Task 1
- **Issue:** This plan depends on Plan 31-01's `assets/_gothicvania-src/` output, but that directory is intentionally gitignored and does not propagate via git into this isolated parallel worktree — confirmed absent via `ls`. Same root cause Plan 31-04 already hit and documented.
- **Fix:** Re-fetched all 5 OGA zip URLs (identical URLs to 31-01/31-04, from ASSET-SCOUTING.md) directly into this worktree's `assets/_gothicvania-src/`, following the exact same integrity checks (`zipfile.is_zipfile()`, zip-slip path-traversal scan) and directory-naming convention 31-01 established. Verified byte sizes matched 31-01-SUMMARY.md's recorded figures exactly before proceeding.
- **Files modified:** none tracked (gitignored path only)
- **Verification:** All source file paths this plan's `<action>` text references (Player idle/run/jump/fall subfolders, `hell-hound-idle.png`) confirmed present and correctly shaped (62x54 native player frames, 384x32 6-frame hell hound sheet) before any bake work began; `git check-ignore -q assets/_gothicvania-src/gothicvania_swamp_files` confirmed the directory stayed genuinely ignored throughout.
- **Committed in:** N/A (no git-tracked files changed by this fix — purely local re-fetch of already-gitignored, re-fetchable content)

**2. [Rule 1 - Bug] Removed a stray regenerated `.planning/phases/26-*` artifact produced by running the full build script**
- **Found during:** Task 1, immediately after the first `python3 scripts/build-art-assets.py` run
- **Issue:** The full build script's dispatch block includes `build_palette_swatch()` (a pre-existing, unrelated Phase 26 debug-proof-image function), which writes to a now-archived `.planning/phases/26-grunge-palette-nox-run-rebrand/` directory — the exact same known issue Plan 31-04 already documented and worked around.
- **Fix:** Deleted the recreated directory (untracked-only, no git operation) after each build run in this session, before staging/committing.
- **Files modified:** none (untracked artifact only, never staged)
- **Verification:** `git status --short` confirmed no `26-grunge-palette-*` entries remained before either commit.
- **Committed in:** N/A (nothing to commit — the artifact was deleted, not committed)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency re-fetch, 1 out-of-scope-artifact cleanup) — both mechanical prerequisites already documented as a known pattern by Plan 31-04, no new risk introduced.
**Impact on plan:** No change to this plan's actual deliverables (sprite content, crop/frame choices, or documented lip numbers).

## Issues Encountered
None beyond the deviations documented above.

## Known Stubs
None — both output PNGs are real baked sprites from real source frames, not placeholders.

## Threat Flags
None — this plan's `<threat_model>` anticipated its two threats (T-31-11 frame-selection scope creep, T-31-12 lip-number repudiation), both mitigated as designed: acceptance-criteria greps confirm only idle/run/jump/fall (player) and idle-only (hound) sources are referenced, and Section 9's numbers come from a direct pixel scan of the real baked atlases, not a carried-over estimate. No new network endpoints, auth paths, or trust-boundary changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both remaining ART-01 character sprites are baked, vendored under `assets/`, confirmed pink-gate clean (via the pre-existing allowlist), and fully reproducible.
- `docs/LEVEL-DESIGN.md` Section 9 gives Phase 32 real numbers to build the autotile renderer against, including two explicit follow-up flags (Cemetery's floating-mound cap, Castle's inverted-lip cap) that Phase 32 should read before wiring those two biomes' ground rendering.
- Plan 31-06 (CREDITS.md rows + `assets/LICENSES/*.txt` proofs, final regression pink-scan) can proceed — this plan's two new asset files need their own credit/license rows, matching the format already established for Plan 31-04's atlases/parallax layers.
- No blockers. Note for Plan 31-06 (matching Plan 31-04's precedent): this plan's re-fetch of `assets/_gothicvania-src/` is itself gitignored and will not propagate to that plan's worktree either — it will need its own re-fetch.

---
*Phase: 31-asset-bake-style-board-sign-off*
*Completed: 2026-07-10*

## Self-Check: PASSED

Both baked PNG output files (`assets/player-swamphunter.png`, `assets/enemy-hellhound.png`) and the modified `docs/LEVEL-DESIGN.md` confirmed present on disk; both task commits (`507eb20`, `b6564a3`) confirmed present in git log. `bash scripts/check-pink-gate.sh` re-run clean immediately before this check.
