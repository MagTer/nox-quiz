---
phase: 26-grunge-palette-nox-run-rebrand
reviewed: 2026-07-08T00:00:00Z
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
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 26: Code Review Report

**Reviewed:** 2026-07-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 30 (diff base `68afd72`)
**Status:** issues_found

## Summary

Phase 26 (grunge palette centralization, per-level theming, door/enemy sprite art,
Nox Run logo, and full rebrand sweep) is well-documented and mostly self-consistent —
`CONFIG.PALETTE` is genuinely the single source of truth for almost every color,
`scripts/check-contrast.mjs`'s WCAG/banned-hue self-tests and role table all pass on
the live palette, the per-theme mid-layer accent baking bug the code's own comments
describe as previously fixed is verified fixed (spot-checked 4 theme PNGs — each
renders a distinct, theme-correct dominant hue), `scripts/check-rebrand.sh` and
`scripts/check-safety.sh`/`check-import-safety.sh` pass, and a real headless
`browser-boot.mjs` run completes with zero runtime errors across all 8 levels.

However, one of the project's own CLAUDE.md-mandated verification gates —
`bash scripts/check-progress.sh` — **currently fails on this exact HEAD** because of
a change this phase made to three level descriptors (see CR-01). This is a real,
reproducible regression (confirmed: the same gate passes cleanly at the pre-phase
commit `68afd72` and fails only after this phase's changes), not a pre-existing
flake, and it is exactly the kind of "checks that don't play the game lie" /
"run scripts/check-progress.sh after any src/ or level change" gate CLAUDE.md
calls out as mandatory. The remaining findings are lower-severity consistency/
drift issues.

## Critical Issues

### CR-01: `scripts/check-progress.sh` fails on HEAD — level enemy `variant` field not synced to the golden regression fixture

**File:** `src/levels/level-01.js:136`, `src/levels/level-03.js:109-110`, `src/levels/level-04.js:113` (root cause); surfaced by `scripts/smoke-progress.mjs` (not itself in the reviewed file list, but it is the gate these files broke)
**Issue:** This phase added a `variant: N` field to every enemy entry in `level-01.js`, `level-03.js`, and `level-04.js`'s `geometry.enemies` arrays (to select `enemy-1`/`enemy-2`/`enemy-3` sprite art). `scripts/smoke-progress.mjs` — invoked as the final step of `scripts/check-progress.sh`, one of the gates CLAUDE.md explicitly requires to be run "after any `src/` or level change" — hardcodes a byte-for-byte "golden" expected `geometry` object per level (its own LVL-02 regression assertions) and deep-equals it against `getLevel(id).geometry`. That golden fixture was never updated to include the new `variant` field, so the deep-equal now fails for exactly the 3 levels this phase touched. Reproduced directly:
```
$ bash scripts/check-progress.sh
Assertion failed: LVL-02 regression: getLevel("level-01").geometry must deep-equal the v3.0 src/level.js geometry verbatim
Assertion failed: LVL-02 regression: getLevel("level-03").geometry must match the authored descriptor
Assertion failed: LVL-02 regression: getLevel("level-04").geometry must match the authored descriptor
smoke-progress: FAIL — 3 assertion(s) failed
progress checks: FAIL — smoke-progress failed (pure XP/level + seed adaptation)
```
Confirmed this is a phase-26 regression, not a pre-existing flake — the identical command passes cleanly (`smoke-progress: PASS`) at the pre-phase commit `68afd72`.
**Fix:** Add the matching `variant: N` field to the three levels' `enemies` entries inside `scripts/smoke-progress.mjs`'s golden `expectedGeometry` objects (level-01 `{ x: 1000, ..., variant: 0 }`, level-03 `{ x: 2400, ..., variant: 1 }` / `{ x: 3800, ..., variant: 2 }`, level-04 `{ x: 2400, ..., variant: 0 }`), then re-run `bash scripts/check-progress.sh` to confirm it goes green before this phase is considered shippable.

## Warnings

### WR-01: `src/main.js` hardcodes the background color instead of reading `CONFIG.PALETTE.BG`

**File:** `src/main.js:22`
**Issue:** Phase 26 Plan 01's stated goal (`src/config.js:12-15`) is that `CONFIG.PALETTE` is "the single source of truth for every color used across src/scenes/, src/ui/, src/fx.js, and src/levels/build.js." `PALETTE.BG` (`[0x0a, 0x0a, 0x0a]`) is defined but never read anywhere in `src/` — `main.js`'s `kaplay({ background: "#0a0a0a", ... })` call still hardcodes the literal hex string instead of deriving it from `CONFIG.PALETTE.BG`. The values happen to match today, but this is exactly the drift risk the rest of the codebase's own comments warn about elsewhere (e.g. `build-art-assets.py`'s `_load_live_palette()` docstring: "Never hand-mirrored into a Python constant (avoids drift risk)"). `main.js` already imports `CONFIG`, so there is no reason for this one value to be the sole exception.
**Fix:**
```js
import { rgbToHex } from ...; // or simply:
const [br, bg, bb] = CONFIG.PALETTE.BG;
const k = kaplay({
  width: 640,
  height: 360,
  background: `#${br.toString(16).padStart(2,"0")}${bg.toString(16).padStart(2,"0")}${bb.toString(16).padStart(2,"0")}`,
  ...
});
```

### WR-02: `scripts/screenshot-phase20.mjs` lacks the path-traversal guard and loopback-only bind every sibling script now has

**File:** `scripts/screenshot-phase20.mjs:78-94`
**Issue:** `browser-boot.mjs`, `audit-phase21-mechanics.mjs`, `screenshot-phase26.mjs`, and `calibrate-jump-envelope.mjs` all carry a "CR-02" fix (visible in their own comments) that (a) resolves and clamps the requested path to `ROOT_ABS` before serving it — preventing a `..`-segment path-traversal escape out of the served directory — and (b) binds the dev HTTP server to `127.0.0.1` only, not all interfaces. `screenshot-phase20.mjs` is one of the files this phase's diff touched (its `SAVE_KEY` literal was updated for the rebrand) but it still uses the pre-fix pattern: `const filePath = join(ROOT.pathname, path);` with no `resolve`/`ROOT_ABS` clamp, and `server.listen(PORT, res)` with no host argument (defaults to all interfaces). It is a local dev/screenshot-only tool, so the practical exposure is low, but it is now the one script in this family that doesn't match the project's own established, already-proven-elsewhere fix, and it does listen on all interfaces while running.
**Fix:** Port the identical `resolve(join(...))` + `ROOT_ABS` clamp + 403 response, and `server.listen(PORT, "127.0.0.1", res)`, from `screenshot-phase26.mjs`/`browser-boot.mjs` into this file (same copy-by-hand convention the project already uses for this whole script family).

### WR-03: `scripts/build-art-assets.py`'s `THEME_PALETTES` docstring reference to `26-08-SUMMARY.md`'s "near" scope note is inert given the `_accent_sub` code path is shared by far/near/ground

**File:** `scripts/build-art-assets.py:326-372`
**Issue:** `_mid_accent_sub`'s docstring states the highest-two-slot-replacement fix "removing the fragile exact-luma-tie dependency" is "Scoped to the `mid` sub-palette only: far/near/ground/title all keep using `_accent_sub` unchanged (far/ground already read correctly distinct per-theme; near shares this same underlying pattern but is explicitly out of scope for this fix)." This is a documentation-quality issue, not a runtime bug: the comment itself concedes the `near` layer shares the same underlying single-slot-overwrite fragility as `mid` did before the fix, but was left out of scope. A spot-check of the shipped `near-theme-*.png` assets (visually verified: `far`/`ground` distinctness already confirmed above) was not performed as part of this review pass, so this is flagged as a WARNING for follow-up verification rather than a confirmed defect — but given `mid`'s identical pattern was silently broken until a dedicated fix, `near` deserves the same explicit pixel-luma check before being assumed safe.
**Fix:** Run the same luma-clustering check the `_mid_accent_sub` docstring describes (compare all 8 accents' luma against the `near` sub-palette's top 1-2 ranked base entries) and either confirm `near` is unaffected or apply the same two-slot fix there.

## Info

### IN-01: `CONFIG.DOOR.SPRITES` is a single-element array while `CONFIG.ENEMY.SPRITES` has 3 — asymmetric shape for no exercised reason

**File:** `src/config.js:141-145`
**Issue:** `DOOR.SPRITES: ["door"]` is always indexed with a literal `sprite("door")` in `src/levels/build.js:180` (never `DOOR.SPRITES[...]`), whereas `ENEMY.SPRITES` is genuinely indexed by `e.variant` in `build.js:246`. The array wrapper around `DOOR.SPRITES` is dead shape — either it's meant to allow future per-theme door variants (in which case `build.js` should already index into it) or it should just be a plain string constant like the rest of `CONFIG.DOOR`'s scalar fields, matching the "universal barrier, never re-themed" design note already in the surrounding comments.
**Fix:** Either drop the array wrapper (`SPRITES: "door"` or just reuse the literal, since it's a permanent design decision per the comment) or, if forward-compatibility is intended, index it in `build.js` (`sprite(CONFIG.DOOR.SPRITES[d.variant ?? 0])`) to match the enemy pattern. Cosmetic — no functional impact today.

---

_Reviewed: 2026-07-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
