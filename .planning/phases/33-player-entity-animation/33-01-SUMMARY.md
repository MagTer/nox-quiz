---
phase: 33-player-entity-animation
plan: 01
subsystem: art-pipeline
tags: [pillow, asset-baking, gothicvania, pink-gate, credits]

# Dependency graph
requires:
  - phase: 31-asset-bake-style-board-sign-off
    provides: church/castle Gothicvania OGA packs identified + pink-scan gate + native-color bake precedent (build_player_swamphunter/build_enemy_hellhound)
provides:
  - "assets/door.png rebaked at native Gothicvania color from the castle interior tileset (was Kenney-remapped)"
  - "assets/math-gate.png — new sprite art for the previously flat-color math-gate mechanic panel"
  - "scripts/build-art-assets.py build_door() v2 + new build_math_gate(), both native-color, no-remap"
  - "CREDITS.md corrected provenance for door/math-gate; enemy-1/2/3 attribution retired"
affects: [33-02, 33-04, 35-biome-redress-props]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native-color Pillow bake idiom (crop -> Image.NEAREST resize -> paste on transparent RGBA canvas -> assert size -> save) reused for door/math-gate, matching build_player_swamphunter()/build_enemy_hellhound()"

key-files:
  created:
    - assets/math-gate.png
  modified:
    - scripts/build-art-assets.py
    - assets/door.png
    - CREDITS.md
  deleted:
    - assets/enemy-1.png
    - assets/enemy-2.png
    - assets/enemy-3.png

key-decisions:
  - "Removed the stale CREDITS.md Notes bullet describing enemy-1/2/3's New Platformer Pack provenance (not just the table row) — leaving it would document files that no longer exist in the repo"
  - "Uniform Image.NEAREST vertical stretch (32x48 -> 32x64) used for math-gate, matching build_door()'s own existing non-1:1 resize precedent, per 33-RESEARCH.md's Open Question #2 recommendation"

patterns-established:
  - "Pattern 3 (33-RESEARCH.md): any NEW Gothicvania-sourced asset ships at native color (no _remap/_remap_luminance) to match the already-shipped unremapped castle biome atlas/player/enemy assets"

requirements-completed: []  # ART-05 spans all 5 plans in this phase — orchestrator marks it complete only after Phase 33's verifier confirms full delivery (see parallel_execution note)

coverage:
  - id: D1
    description: "assets/door.png rebaked at native Gothicvania color (34x65 castle-interior crop -> 32x64), zero remap calls, pink-gate clean"
    requirement: "ART-05"
    verification:
      - kind: automated_ui
        ref: "bash scripts/check-pink-gate.sh"
        status: pass
      - kind: unit
        ref: "python3 -c \"from PIL import Image; assert Image.open('assets/door.png').size == (32,64)\""
        status: pass
    human_judgment: false
  - id: D2
    description: "assets/math-gate.png — new sprite (32x48 church barred-window/cross crop stretched to 32x64), zero remap calls, pink-gate clean"
    requirement: "ART-05"
    verification:
      - kind: automated_ui
        ref: "bash scripts/check-pink-gate.sh"
        status: pass
      - kind: unit
        ref: "python3 -c \"from PIL import Image; assert Image.open('assets/math-gate.png').size == (32,64)\""
        status: pass
    human_judgment: false
  - id: D3
    description: "CREDITS.md accurately attributes door.png/math-gate.png and no longer references the retired enemy-1/2/3 sprites"
    requirement: "ART-05"
    verification:
      - kind: other
        ref: "grep -q 'assets/door.png' CREDITS.md && grep -q 'assets/math-gate.png' CREDITS.md && test ! -f assets/enemy-1.png && test ! -f assets/enemy-2.png && test ! -f assets/enemy-3.png"
        status: pass
    human_judgment: false
  - id: D4
    description: "Visual quality of the new door/math-gate art reads correctly against the castle biome register (dark, non-flat, no-pink) — a subjective judgment beyond the automated pink-gate"
    verification: []
    human_judgment: true
    rationale: "Pink-gate and size assertions prove the bakes are technically clean, but whether the art actually reads well in-game (against the castle biome, alongside the door/math-gate glyph text overlay per 33-RESEARCH.md Pitfall 6) is a visual-quality call reserved for this phase's overall human sign-off, not this plan alone."

duration: 5min
completed: 2026-07-11
status: complete
---

# Phase 33 Plan 01: Door + Math-Gate Native-Color Art Bake Summary

**Baked new native-Gothicvania-color sprite art for the door (rebaked from the castle interior tileset) and math-gate (new, from the church environment tileset) mechanic panels, and retired the fully-superseded enemy-1/2/3 placeholder sprites.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-11T13:19:00Z (approx, source re-fetch)
- **Completed:** 2026-07-11T13:27:16Z
- **Tasks:** 3
- **Files modified:** 6 (1 script, 2 baked PNGs created/overwritten, 3 dead PNGs deleted, 1 CREDITS.md)

## Accomplishments
- `build_door()` replaced end-to-end: crops a 34x65px wooden door with stone frame + gold hinge from the Gothicvania Patreon Collection's `old-dark-castle-interior-tileset.png`, resizes with `Image.NEAREST` to the locked 32x64 footprint, ships at native Gothicvania color (zero `_remap`/`_remap_luminance` calls) — replaces the old Kenney-sourced, palette-remapped placeholder.
- New `build_math_gate()` added: crops a 32x48px barred iron-lattice window with a cross plaque from the Gothicvania Church pack's `ENVIRONMENT/tileset.png`, uniformly stretched to 32x64, same native-color no-remap discipline. Wired into `__main__` immediately after `build_door()`.
- Both `assets/door.png` and `assets/math-gate.png` pass `bash scripts/check-pink-gate.sh` (PASS, no allowlist entry needed for either).
- `CREDITS.md` corrected: `assets/door.png` folded into the existing Gothicvania Patreon Collection row (replacing the retired HorusKDI "6 Color Dungeon" attribution); `assets/math-gate.png` folded into the existing Gothicvania Church row; the New Platformer Pack row (enemy-1/2/3) and its stale Notes bullet removed.
- `assets/enemy-1.png`, `assets/enemy-2.png`, `assets/enemy-3.png` deleted — zero remaining consumers after Hell hound's swap-in (wired in the parallel 33-02 plan).

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-fetch church + castle-collection source packs** - no commit (gitignored scratch dir `assets/_gothicvania-src/`, never committed by design)
2. **Task 2: Bake build_door() v2 + new build_math_gate(), verify pink-gate** - `0e0988d` (feat)
3. **Task 3: CREDITS.md provenance update + retire dead enemy PNGs** - `7ab5a4d` (chore)

_Note: Task 1 produces no git diff — the re-fetched source packs live under the gitignored `assets/_gothicvania-src/` scratch directory per this phase's `.gitignore` (established Phase 31), never committed._

## Files Created/Modified
- `scripts/build-art-assets.py` - `build_door()` body replaced with a native-color castle-pack crop; new `build_math_gate()` function added and wired into `__main__`
- `assets/door.png` - rebaked in place, 32x64, native Gothicvania color
- `assets/math-gate.png` - new file, 32x64, native Gothicvania color
- `CREDITS.md` - door/math-gate rows folded into existing Gothicvania pack rows; New Platformer Pack row + stale Notes bullet removed
- `assets/enemy-1.png`, `assets/enemy-2.png`, `assets/enemy-3.png` - deleted (retired, fully superseded by Hell hound)

## Decisions Made
- Uniform `Image.NEAREST` vertical stretch (not transparent-pad) used to fit the 32x48 church crop into the 32x64 target — matches `build_door()`'s own existing non-1:1 resize precedent, per 33-RESEARCH.md's Open Question #2 recommendation.
- Removed the CREDITS.md Notes bullet documenting enemy-1/2/3's New Platformer Pack hand-pick rationale (not just the table row) — the plan only explicitly required removing the table row, but leaving prose that describes now-deleted files as if they still shipped would be stale documentation (Rule 1 — factual-accuracy fix, in-scope since this task's own files list includes CREDITS.md).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed source-pack extraction structure to match the exact path convention build_door()/build_math_gate() require**
- **Found during:** Task 1
- **Issue:** `unzip -q %20gothicvania%20patreon%20collection.zip -d assets/_gothicvania-src/` extracts the pack's internal `" gothicvania patreon collection"` folder directly at the top level of `assets/_gothicvania-src/`, but the proven-working path convention (mirrored from `build_enemy_hellhound()`) requires it nested one level deeper, under `assets/_gothicvania-src/gothicvaniapatreoncollection/`.
- **Fix:** Created the `gothicvaniapatreoncollection/` wrapper directory and moved the extracted `" gothicvania patreon collection"` folder into it, matching the exact path `build_enemy_hellhound()`/`build_door()` already hardcode.
- **Files modified:** none (scratch dir only, gitignored, not committed)
- **Verification:** Both `test -f` acceptance-criteria paths (church tileset, castle interior tileset) confirmed present before proceeding to Task 2.
- **Committed in:** N/A (gitignored scratch directory, never committed)

---

**Total deviations:** 1 auto-fixed (1 blocking — Rule 1/3 boundary, extraction-structure fix)
**Impact on plan:** Necessary correction to match the plan's own documented path convention; no scope creep, no behavior change beyond making the re-fetch actually usable by the bake functions.

## Issues Encountered
None beyond the Task 1 extraction-structure fix documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `assets/door.png`/`assets/math-gate.png` are ready for wiring: Plan 33-02 (parallel, same wave) adds the `loadSprite("math-gate", ...)` call and the assets-manifest row; Plan 33-04 swaps the math-gate mechanic panel from `color()+outline()+text()` to `sprite("math-gate")+text()`.
- `assets/enemy-1.png`/`enemy-2.png`/`enemy-3.png` deletion is safe within this wave: Plan 33-02 (parallel) independently removes their `CONFIG.ENEMY.SPRITES`/`loadSprite`/manifest references — both plans' changes are consistent once the wave merges.
- No blockers. This plan's own scope (art bake + provenance) is fully self-contained; the visual-quality human sign-off (ART-04/ART-05's checkpoint:human-verify) is owned by a later plan in this phase, not this one.

---
*Phase: 33-player-entity-animation*
*Completed: 2026-07-11*

## Self-Check: PASSED

- FOUND: assets/door.png
- FOUND: assets/math-gate.png
- FOUND: scripts/build-art-assets.py
- FOUND: CREDITS.md
- CONFIRMED DELETED: assets/enemy-1.png, assets/enemy-2.png, assets/enemy-3.png
- FOUND: .planning/phases/33-player-entity-animation/33-01-SUMMARY.md
- Commit 0e0988d (feat: bake door/math-gate) — FOUND in git log
- Commit 7ab5a4d (chore: CREDITS + delete dead enemies) — FOUND in git log
- Commit 67ca9ed (docs: plan summary) — FOUND in git log
