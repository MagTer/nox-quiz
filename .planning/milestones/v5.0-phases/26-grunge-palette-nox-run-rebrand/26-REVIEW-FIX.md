---
phase: 26-grunge-palette-nox-run-rebrand
fixed_at: 2026-07-07T22:09:04Z
review_path: .planning/phases/26-grunge-palette-nox-run-rebrand/26-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 26: Code Review Fix Report

**Fixed at:** 2026-07-07T22:09:04Z
**Source review:** .planning/phases/26-grunge-palette-nox-run-rebrand/26-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (fix_scope: critical_warning — CR-01, WR-01, WR-02, WR-03; IN-01 excluded)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: `scripts/check-progress.sh` fails on HEAD — level enemy `variant` field not synced to the golden regression fixture

**Files modified:** `scripts/smoke-progress.mjs`
**Commit:** `8fe577b`
**Applied fix:** Added the matching `variant: N` field to the three affected levels' `enemies` entries inside `smoke-progress.mjs`'s golden `expectedGeometry` objects — `level-01` (`variant: 0`), `level-03` (`variant: 1` / `variant: 2`), `level-04` (`variant: 0`) — matching the live values in `src/levels/level-01.js:136`, `level-03.js:109-110`, `level-04.js:113`. **Re-verified per task instruction:** ran `bash scripts/check-progress.sh` directly after the fix (not just re-read) — it now reports `smoke-progress: PASS` / `progress checks: PASS`, confirming the regression is closed, not just patched on paper.

### WR-01: `src/main.js` hardcodes the background color instead of reading `CONFIG.PALETTE.BG`

**Files modified:** `src/main.js`
**Commit:** `fd97408`
**Applied fix:** Changed the `kaplay({ background: "#0a0a0a", ... })` literal to `background: CONFIG.PALETTE.BG`. Adapted from the REVIEW.md suggestion (which proposed a manual hex-string conversion) after inspecting the vendored `lib/kaplay.mjs` init code directly: it accepts `background` as either a hex string OR an `[r,g,b]` array (spread into its internal color constructor), so `CONFIG.PALETTE.BG` — already an `[r,g,b]` array — can be passed straight through with no conversion helper needed. Verified `scripts/check-import-safety.sh` still passes (background is read inside the `kaplay()` call, not at bare module top-level before init).

### WR-02: `scripts/screenshot-phase20.mjs` lacks the path-traversal guard and loopback-only bind every sibling script now has

**Files modified:** `scripts/screenshot-phase20.mjs`
**Commit:** `76b5629`
**Applied fix:** Ported the identical `resolve(join(...))` + `ROOT_ABS` clamp + 403 response, and `server.listen(PORT, "127.0.0.1", res)` pattern from `screenshot-phase26.mjs` (the already-fixed sibling), matching this script family's established copy-by-hand convention. Added `resolve, sep` to the existing `path` import.

### WR-03: `scripts/build-art-assets.py`'s `THEME_PALETTES` docstring reference to `26-08-SUMMARY.md`'s "near" scope note is inert given the `_accent_sub` code path is shared by far/near/ground

**Files modified:** `scripts/build-art-assets.py`, `assets/parallax/near-theme-1.png` through `near-theme-8.png`
**Commit:** `335555c`
**Applied fix:** Did not treat this as documentation-only. Ran the follow-up verification the finding called for: pixel-sampled all 8 baked `near-theme-*.png` assets before touching code and confirmed the bug is real — themes 1-7 shared an identical `(102,102,102)` dominant fill; only theme-8/EMBER (the one accent whose luma narrowly clears the tied `P4` slot) rendered distinct. This is the exact same exact-luma-tie failure mode `_mid_accent_sub` was written to fix, just manifesting differently in `near`'s 4-entry palette (index-4 accent substitution falls out of range and *appends* instead of overwriting, so the original `P4=102` slot survives untouched — worse than `mid`'s in-range overwrite-but-adjacent-slot bug, same net effect). Added a new `_near_accent_sub` function mirroring `_mid_accent_sub`'s two-slot overwrite (indices 2 and 3, the top two of the 4-entry list, vs. `mid`'s indices 3/4 of its 5-entry list), wired it into `THEME_PALETTES["near"]`, updated the `_mid_accent_sub` docstring's now-inert scope note, then ran `python3 scripts/build-art-assets.py` to regenerate all baked assets. Re-verified via pixel sampling: all 8 `near-theme-*.png` now show distinct theme-correct dominant hues (moss/fern/teal/slate/steel/clay/rust/ember). Confirmed the full asset regen only changed the 8 `near-theme-*.png` files (`git status` showed no diff for any other regenerated asset — ground/far/mid/door/enemies/logo/title-bg/palette-swatch all came out byte-identical), so the fix is narrowly scoped. Also re-ran `scripts/check-contrast.mjs` (WCAG + banned-hue gates) and `scripts/check-rebrand.sh` — both still pass.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-07T22:09:04Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
