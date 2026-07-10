---
phase: 31-asset-bake-style-board-sign-off
reviewed: 2026-07-11T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - assets/enemy-hellhound.png
  - assets/LICENSES/gothicvania-cemetery.txt
  - assets/LICENSES/gothicvania-church.txt
  - assets/LICENSES/gothicvania-patreon.txt
  - assets/LICENSES/gothicvania-swamp.txt
  - assets/LICENSES/gothicvania-town.txt
  - assets/player-swamphunter.png
  - assets/tiles/atlas-castle.png
  - assets/tiles/atlas-cemetery.png
  - assets/tiles/atlas-swamp.png
  - assets/tiles/atlas-town.png
  - docs/LEVEL-DESIGN.md
  - scripts/build-art-assets.py
  - scripts/check-pink-gate.sh
  - scripts/lib/pink_scan.py
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 31: Code Review Report (iteration 2)

**Reviewed:** 2026-07-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** clean

## Summary

This is iteration 2 of the fix/re-review loop for Phase 31. Iteration 1 (this session) found WR-05 (`build_enemies()` missing the `getbbox() is None` guard the WR-03 fix was supposed to add everywhere) and WR-06 (`assets/tiles/atlas-castle.png` shipping with no license/credit record), plus IN-01 (an intentionally out-of-scope doc-dimension nit — three unrelated license files say "32x16" where the shipped atlas is actually 32x32; left unfixed by design, not re-flagged here).

Both carried-forward findings were verified against current file contents, not just trusted from commit messages:

- **WR-05** (fixed in `ffc37b5`): confirmed at `scripts/build-art-assets.py:619-621`. `build_enemies()`'s frame-loading loop now reads `bbox = im.getbbox(); if bbox is None: raise ValueError(f"{fname}: fully transparent source frame, cannot derive content bbox"); cropped = im.crop(bbox)` — the exact idiom already used at the other two `getbbox()` sites. `grep -n "getbbox()" scripts/build-art-assets.py` returns 3 hits (lines 177, 619, 1057); all three are now immediately followed by the None guard. `ast.parse()` confirms the file still parses cleanly.
- **WR-06** (fixed in `4d55391`): confirmed present in both `CREDITS.md` (the Gothicvania Patreon Collection row now lists `assets/tiles/atlas-castle.png` in its file column and its "Used for" cell now says "...castle biome parallax (exterior + interior) and terrain atlas...") and `assets/LICENSES/gothicvania-patreon.txt` (new `Asset:` block line for `atlas-castle.png`, 32x32/2×16x32 cap+fill, and a new clause in `Tiles/frames used:` naming the exact source path `Old-dark-Castle-tileset-Files/PNG/old-dark-castle-interior-tileset.png` and both crop rects `(320,32,352,114)` / `(272,160,304,224)` — these match `build_biome_atlas_castle()`'s actual code at lines 836-859 exactly). `grep -rn "atlas-castle" assets/LICENSES/ CREDITS.md` now returns hits in both files (previously zero).

Fresh checks performed this iteration, independent of the two carried-forward findings:

- Re-read the full `scripts/build-art-assets.py` (both halves, all Phase 31 additions at lines 638-1303) looking for anything new: the WR-04 crop-rect bounds check in `_bake_biome_atlas()`, the WR-01 aspect-preserving `_fit_and_pad()`, and the WR-02-corrected `pink_scan.py` allowlist wording are all still in place and mutually consistent — no regressions introduced by the two new commits (their diffs are minimal and scoped exactly to WR-05/WR-06, confirmed via `git show ffc37b5` / `git show 4d55391`).
- Ran `bash scripts/check-pink-gate.sh` — PASS. `assets/player-swamphunter.png` is the only allowlisted hit (43.3%, text matches the WR-02-corrected justification verbatim); no other shipped PNG trips the threshold.
- Verified on-disk dimensions of every reviewed binary asset against docstring/license claims: `enemy-hellhound.png` (384x32), `player-swamphunter.png` (192x32), all four `atlas-{swamp,town,cemetery,castle}.png` (32x32) — all match their bake functions' asserted output sizes.
- Visually inspected `enemy-hellhound.png`, `player-swamphunter.png`, and all four atlas PNGs — no visible pink/magenta, no corruption, no obvious cropping artifacts (castle/cemetery/swamp atlases read as intentionally near-black per the dark-grunge palette; town atlas shows a visible silhouette shape).
- Confirmed no dangerous patterns (`eval`, hardcoded secrets, empty catch blocks, stray `console.log`/`TODO`/`debugger`) in any reviewed file. The one `console.log` match inside `build-art-assets.py` is a string literal passed as a Node `-e` argument in `_load_live_palette()`'s `subprocess.run()` call (fixed argv list, no `shell=True`) — legitimate use to capture `CONFIG.PALETTE` as JSON from the JS side, not a debug leftover.
- `python3 -m py_compile` / `ast.parse()` on both Python files and `bash -n` on the shell script all succeed.

No new Critical or Warning issues were found, and the two carried-forward Warnings (WR-05, WR-06) are both confirmed fixed and holding. All reviewed files meet quality standards for this iteration.

---

_Reviewed: 2026-07-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
