---
phase: 26-grunge-palette-nox-run-rebrand
reviewed: 2026-07-08T00:20:00Z
depth: standard
files_reviewed: 30
files_reviewed_list:
  - docs/DEPLOY.md
  - scripts/audit-phase21-mechanics.mjs
  - scripts/browser-boot.mjs
  - scripts/build-art-assets.py
  - scripts/check-contrast.mjs
  - scripts/check-progress.sh
  - scripts/check-rebrand.sh
  - scripts/generate-art-assets.py
  - scripts/screenshot-phase20.mjs
  - scripts/screenshot-phase26.mjs
  - scripts/smoke-progress.mjs
  - src/config.js
  - src/fx.js
  - src/index.html
  - src/levels/build.js
  - src/levels/level-01.js
  - src/levels/level-02.js
  - src/levels/level-03.js
  - src/levels/level-04.js
  - src/levels/level-05.js
  - src/levels/level-06.js
  - src/levels/level-07.js
  - src/levels/level-08.js
  - src/main.js
  - src/parallax.js
  - src/progress.js
  - src/scenes/game.js
  - src/scenes/select.js
  - src/scenes/title.js
  - src/ui/challenge.js
  - src/ui/hud.js
  - src/ui/mathGate.js
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
status: clean
---

# Phase 26: Code Review Report (re-review — confirmation pass)

**Reviewed:** 2026-07-08T00:20:00Z
**Depth:** standard
**Files Reviewed:** 31 (30 originally in-scope + `scripts/smoke-progress.mjs`, added because it is the file CR-01's fix actually touched)
**Status:** clean

## Summary

This is a confirmation pass after `26-REVIEW-FIX.md` (iteration 1) applied fixes for
CR-01, WR-01, WR-02, and WR-03 from the prior `26-REVIEW.md`. All four fixes were
independently re-verified against the live tree (not just re-read from the fix
report) and are confirmed real, complete, and correctly scoped:

- **CR-01 (fixed, verified):** `scripts/smoke-progress.mjs`'s golden `expectedGeometry`
  fixtures for level-01/03/04 now carry the `variant` field matching the live level
  descriptors exactly (diffed commit `8fe577b` against `src/levels/level-01.js:136`,
  `level-03.js:109-110`, `level-04.js:113` — byte-for-byte match). Ran
  `bash scripts/check-progress.sh` directly: `smoke-progress: PASS` / `progress checks:
  PASS`. The mandatory CLAUDE.md gate is green again.
- **WR-01 (fixed, verified):** `src/main.js:22` now passes `CONFIG.PALETTE.BG`
  (the `[0x0a,0x0a,0x0a]` array) directly to `kaplay({ background: ... })` instead of
  a hardcoded hex literal. Traced the vendored `lib/kaplay.mjs` init code directly:
  it branches on `typeof t.background`, and for a non-string (array) value does
  `I(...t.background)` with `t.background[3] ?? 1` as alpha — a bare 3-element RGB
  array is handled correctly with no conversion helper needed, exactly as the fix
  report claims. `CONFIG.PALETTE.BG` is read inside the `kaplay()` call, not at
  bare module top level, so it doesn't trip the a727c13 rule; `check-import-safety.sh`
  still passes. `CONFIG.PALETTE` is now genuinely the sole source of truth for every
  color in `src/`, including the canvas background.
- **WR-02 (fixed, verified):** `scripts/screenshot-phase20.mjs` now carries the
  identical `resolve(join(...))` + `ROOT_ABS` prefix-clamp + 403 response, and
  `server.listen(PORT, "127.0.0.1", res)` loopback-only bind, that
  `screenshot-phase26.mjs`/`browser-boot.mjs` already had. Diffed commit `76b5629`
  line-by-line against the sibling scripts' established pattern — matches exactly,
  including the `sep`-suffixed prefix check (avoids the classic `startsWith(ROOT_ABS)`
  sibling-directory bypass, e.g. `ROOT_ABS-evil`).
- **WR-03 (fixed, verified — went beyond the review's request):** The fix report
  claims it didn't stop at updating a docstring but actually pixel-sampled all 8
  `near-theme-*.png` assets, found the real bug (index-4 accent substitution falling
  out of range on `ENVIRONMENT_PALETTE_NEAR`'s 4-entry list and *appending* instead
  of overwriting, so the untouched P4=102-luma slot silently won the top rank for
  7 of 8 themes), added a mirrored `_near_accent_sub` two-slot fix, and regenerated
  only the 8 `near-theme-*.png` files. Independently re-verified all three claims:
  (1) `git show --stat 335555c` confirms the diff touches exactly
  `scripts/build-art-assets.py` + the 8 `near-theme-*.png` files, nothing else; (2)
  re-derived the luma math by hand from the new `_near_accent_sub` function body and
  the palette constants (`ENVIRONMENT_PALETTE_NEAR = [P0,P1,P2,P4]`, replacing indices
  2/3 with a 0.8×-shaded body tone + the raw accent) — the darkest accent (MOSS,
  shade luma ≈72.2) safely clears the next-highest surviving entry (P1, luma 34), so
  the fix is robust across all 8 accents, not just empirically lucky; (3) pixel-sampled
  the shipped `assets/parallax/near-theme-{1..8}.png` directly with PIL and confirmed
  8 distinct dominant RGB fills that track the theme accent progression (moss →
  fern → teal → slate → steel → clay → rust → ember), where before the fix themes
  1-7 shared an identical `(102,102,102)` grey. Also re-ran `check-contrast.mjs` and
  `check-rebrand.sh` — both still pass.

**Regression check:** confirmed via `git diff --stat b2ec000..HEAD` that the fix
commits touched exactly the files the fix report claims (`scripts/smoke-progress.mjs`,
`src/main.js`, `scripts/screenshot-phase20.mjs`, `scripts/build-art-assets.py`, and
the 8 `near-theme-*.png` binaries) — no unrelated drift. Re-ran the full mandatory
gate suite on HEAD: `check-gate.sh`, `check-safety.sh`, `check-import-safety.sh`,
`check-progress.sh`, `check-rebrand.sh`, `check-contrast.mjs`, `validate-levels.mjs`
(zero HARD-FAIL, only the pre-existing `spawn-goal`/`gap-width` WARNs already
present pre-phase), and a full headless `browser-boot.mjs` run (title → select →
all 8 levels, zero runtime errors). All green. A fresh `screenshot-phase26.mjs` run
and visual spot-check of the resulting level-01 (moss/green) and level-06
(clay/tan) theme screenshots confirms the per-level palette theming renders as
distinct hues in the actual running game, not just in the baked PNG source assets.

No new Critical or Warning findings were introduced by the fix commits. The one
finding explicitly excluded from the fix pass's scope, IN-01, remains open exactly
as before (unchanged — `src/config.js:144`'s `DOOR.SPRITES: ["door"]` is still a
single-element array that `src/levels/build.js:180` never indexes into, vs.
`ENEMY.SPRITES`'s genuinely-indexed 3-element array). This is cosmetic/informational
only and does not block shipping.

## Info

### IN-01: `CONFIG.DOOR.SPRITES` is a single-element array while `CONFIG.ENEMY.SPRITES` has 3 — asymmetric shape for no exercised reason

**File:** `src/config.js:144-145`
**Issue:** `DOOR.SPRITES: ["door"]` is always indexed with a literal `sprite("door")` in `src/levels/build.js` (never `DOOR.SPRITES[...]`), whereas `ENEMY.SPRITES` is genuinely indexed by `e.variant` in `build.js`. The array wrapper around `DOOR.SPRITES` is dead shape — either it's meant to allow future per-theme door variants (in which case `build.js` should already index into it) or it should just be a plain string constant like the rest of `CONFIG.DOOR`'s scalar fields, matching the "universal barrier, never re-themed" design note already in the surrounding comments. Carried forward unchanged from the prior review — excluded from the `26-REVIEW-FIX.md` fix scope (info-tier, not critical/warning), so its continued presence here is expected, not a regression.
**Fix:** Either drop the array wrapper (`SPRITES: "door"`) or, if forward-compatibility is intended, index it in `build.js` (`sprite(CONFIG.DOOR.SPRITES[d.variant ?? 0])`) to match the enemy pattern. Cosmetic — no functional impact today.

---

_Reviewed: 2026-07-08T00:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
