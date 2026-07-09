---
phase: 26-grunge-palette-nox-run-rebrand
plan: 07
subsystem: ui
tags: [kaplay, pillow, pixel-font, logo, branding, tween]

# Dependency graph
requires:
  - phase: 26-01
    provides: "CONFIG.PALETTE single source of truth (ACCENT_MOSS, REWARD tokens)"
  - phase: 26-02
    provides: "CONFIG.PALETTE.ACCENT_MOSS/REWARD's CURRENT (WCAG-brightened) live hex values"
provides:
  - "assets/_font-src/monogram.ttf — vendored CC0 pixel font + assets/LICENSES/monogram.txt proof"
  - "scripts/build-art-assets.py build_logo() — bakes assets/logo-hero.png (360x90) and assets/logo-badge.png (144x36) from live CONFIG.PALETTE.ACCENT_MOSS/REWARD, with per-character letter-spacing"
  - "src/scenes/title.js: baked logo-hero sprite + one-shot 500ms non-strobing reveal tween, replacing the old text(\"Math Lab\") wordmark"
  - "src/scenes/select.js: logo-badge sprite near the level-select heading"
  - "CONFIG.TITLE.LOGO_REVEAL_MS (500)"
affects: [26-08, 26-09, 26-10, 26-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-character Pillow rendering for letter-spacing: draw.text() has no tracking/letter-spacing param, so build_logo() iterates LOGO_TEXT and draws each glyph at font.getlength()-derived monospace pitch + a fixed extra gap, instead of one draw.text(long_string) call"
    - "Upscale-only NEAREST bake sizing: choose the source font size so the padded source canvas is smaller than BOTH bake targets, so Image.NEAREST always scales up (never down) — a downscale softened/dropped stroke pixels at the smaller badge size in this plan's first attempt"

key-files:
  created:
    - assets/_font-src/monogram.ttf
    - assets/LICENSES/monogram.txt
    - assets/logo-hero.png
    - assets/logo-badge.png
  modified:
    - scripts/build-art-assets.py
    - src/config.js
    - src/main.js
    - src/scenes/title.js
    - src/scenes/select.js

key-decisions:
  - "Vendored monogram.ttf via the itch.io product page's own embedded direct @font-face URL (an officially-listed companion file, monogram-extended.ttf, mirrored at menez.io) instead of the interactive purchase-flow-gated base monogram.ttf — verified via PIL font-name-table lookup before trusting it"
  - "Named the Python-side logo fill/stroke constants LOGO_FILL/LOGO_STROKE (not ACCENT_MOSS) to avoid colliding with the pre-existing Plan 26-12 module-level ACCENT_MOSS constant (a different, per-level-theme concept that happens to share today's hex value)"
  - "Removed the now-dead CONFIG.TITLE.TITLE_SIZE field after deleting its sole consumer (the old text(\"Math Lab\") block), following the same dead-field cleanup precedent Plan 26-05 set for CONFIG.DOOR/CONFIG.ENEMY"
  - "Human-verify checkpoint (Task 3) found two real defects on first pass — reveal too fast to notice, letters too tight especially on the select badge — both fixed and re-verified before re-presenting; approved on the second look"

requirements-completed: [BRAND-01, BRAND-03]

coverage:
  - id: D1
    description: "Baked assets/logo-hero.png and assets/logo-badge.png from a genuinely CC0-sourced pixel font, dark-green fill + neon-green edge matching CONFIG.PALETTE tokens, with visible per-letter spacing"
    requirement: "BRAND-01"
    verification:
      - kind: manual_procedural
        ref: "Human-verify checkpoint (Task 3), second pass: 'The logo looks better. Approved.'"
        status: pass
    human_judgment: true
    rationale: "Visual legibility/aesthetic quality of a baked logo is a human judgment call — this plan's own checkpoint gate required it, and the first pass caught real issues automation could not (spacing, perceived reveal speed)."
  - id: D2
    description: "Title screen shows the baked logo via a one-shot, non-strobing reveal tween that completes automatically without a key press, replacing the old text(\"Math Lab\") wordmark; select screen shows the badge near its heading"
    requirement: "BRAND-03"
    verification:
      - kind: unit
        ref: "grep -qc 'text(\"Math Lab\"' src/scenes/title.js -> 0; grep 'sprite(\"logo-hero\")' src/scenes/title.js; grep 'sprite(\"logo-badge\")' src/scenes/select.js; CONFIG.TITLE.LOGO_REVEAL_MS === 500"
        status: pass
      - kind: integration
        ref: "node scripts/browser-boot.mjs — PASS, title -> select -> all 8 levels, zero runtime errors, both sprite names resolve"
        status: pass
      - kind: other
        ref: "bash scripts/check-safety.sh — PASS (tween()-only reveal, no scheduler)"
        status: pass
      - kind: manual_procedural
        ref: "Human-verify checkpoint (Task 3), second pass: reveal timing (500ms) explicitly approved"
        status: pass
    human_judgment: true
    rationale: "\"Non-strobing\" and \"reads as a deliberate reveal\" are subjective animation-feel judgments beyond the automated no-scheduler/duration checks — this plan's own checkpoint required a human to watch it play."

# Metrics
duration: 18min (active task work; additional wall-clock time elapsed across two human-verify round trips)
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 07: Nox Run Logo — Bake + Wire (BRAND-01, BRAND-03) Summary

**Baked a "NOX RUN" pixel-font wordmark from a genuinely CC0-sourced monospace font (dark-green fill, neon-green edge, letter-spaced) via a new `build_logo()` in the Pillow pipeline, and wired it into the title screen with a one-shot 500ms non-strobing reveal tween and a badge-sized variant on level-select — replacing the old plain-text "Math Lab" wordmark, with human sign-off obtained after two real fixes (reveal too fast, letters too tight) found in checkpoint review.**

## Performance

- **Duration:** ~18 min of active task execution (Tasks 1–2 + fix round), spanning a human-verify checkpoint round trip
- **Started:** 2026-07-07T22:20:00Z (approx)
- **Completed:** 2026-07-07T22:43:25Z (approx, last commit) + checkpoint approval
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify, blocking)
- **Files modified:** 9 (5 created, 4 modified) + 1 planning doc (deferred-items.md)

## Accomplishments

- Vendored `assets/_font-src/monogram.ttf` (CC0, "monogram" by datagoblin), verified via `PIL.ImageFont.truetype` name-table lookup (`('monogram', 'Regular')`) before trusting it; sourced via the itch.io product page's own embedded direct `@font-face` URL since the base file sits behind an interactive purchase-flow download. Full provenance recorded in `assets/LICENSES/monogram.txt`.
- Added `build_logo()` to `scripts/build-art-assets.py`: renders "NOX RUN" character-by-character (for letter-spacing control Pillow's `draw.text()` doesn't natively support) with a dark-green fill (`CONFIG.PALETTE.ACCENT_MOSS`, read live) and neon-green stroke (`CONFIG.PALETTE.REWARD`, read live), baking both `assets/logo-hero.png` (360×90) and `assets/logo-badge.png` (144×36, exactly 0.4× linear) as independent NEAREST-upscales of one small source canvas.
- `src/scenes/title.js`: deleted the old `text("Math Lab", ...)` wordmark block; mounts `sprite("logo-hero")` at opacity 0 and unconditionally tweens it to opacity 1 over `CONFIG.TITLE.LOGO_REVEAL_MS` (500ms) — one-shot, non-strobing, persists after reveal (no `onEnd(destroy)`).
- `src/scenes/select.js`: `sprite("logo-badge")` added just above the "Select a Level" heading.
- `src/config.js`: added `CONFIG.TITLE.LOGO_REVEAL_MS`; removed the now-dead `TITLE_SIZE` field (its sole consumer, the old wordmark, was deleted).
- `src/main.js`: registered `logo-hero`/`logo-badge` sprites alongside the existing title-bg load.
- **Checkpoint round 1** found two real defects: the 400ms reveal wasn't perceptible, and letters (especially on the small select badge) were too tight to read comfortably.
- **Fix round:** `build_logo()` reworked to per-character rendering with explicit letter-spacing (4px extra gap per glyph pitch) and dropped the source-bake font size from 64→32 so both hero and badge bakes are clean upscales (the badge was previously a slight *downscale*, which can soften stroke pixels); `LOGO_REVEAL_MS` raised 400→500 (the BRAND-03 ceiling itself).
- **Checkpoint round 2:** human approved — "The logo looks better. Approved."

## Task Commits

Each task was committed atomically:

1. **Task 1: Source the monogram font and bake logo-hero.png / logo-badge.png** - `43a0110` (feat)
2. **Task 2: Wire the logo into title.js (reveal tween) and select.js (badge)** - `6ac1b27` (feat)
3. **Task 3: Human sign-off — checkpoint round 1 feedback fixes** - `7e0f726` (fix, letter-spacing + upscale-only bake, routed back to Task 1) and `ecb47a5` (fix, reveal timing 400→500ms, routed back to Task 2)
4. **Task 3: Human sign-off — approved on round 2** (no code change; recorded here and in this plan's checkpoint history)

**Plan metadata:** (this commit) `docs: complete Nox Run logo plan`

## Files Created/Modified
- `assets/_font-src/monogram.ttf` - vendored CC0 "monogram" pixel font
- `assets/LICENSES/monogram.txt` - CC0 provenance/proof file
- `assets/logo-hero.png` - baked 360×90 title-screen logo (dark-green fill, neon-green edge, letter-spaced)
- `assets/logo-badge.png` - baked 144×36 level-select badge logo (0.4× linear of hero, independently baked)
- `scripts/build-art-assets.py` - `build_logo()` function + `LOGO_TEXT`/`LOGO_FONT_SIZE`/`LOGO_STROKE_WIDTH`/`LOGO_LETTER_SPACING`/`LOGO_FILL`/`LOGO_STROKE` constants; called from `__main__`
- `src/config.js` - `CONFIG.TITLE.LOGO_REVEAL_MS` (500); dead `TITLE_SIZE` field removed
- `src/main.js` - `loadSprite("logo-hero"/"logo-badge", ...)`
- `src/scenes/title.js` - old `text("Math Lab")` wordmark deleted; `sprite("logo-hero")` + reveal `tween()` added
- `src/scenes/select.js` - `sprite("logo-badge")` added near the heading
- `.planning/phases/26-grunge-palette-nox-run-rebrand/deferred-items.md` - logged an out-of-scope, pre-existing `check-progress.sh`/`smoke-progress.mjs` level-geometry regression-pin failure discovered while running the full verification gate suite

## Decisions Made
- **Sourced `monogram.ttf` via the itch.io page's own embedded `@font-face` URL** (an officially-listed companion file, `monogram-extended.ttf`, mirrored at the same author's `menez.io` domain) rather than the base file's interactive purchase-flow download, per the plan's stated sourcing fallback order ("first try fetching the page HTML for an embedded direct file URL"). Verified via `PIL.ImageFont.truetype`'s internal name-table lookup before vendoring — confirms it is genuinely the Monogram font, not a mislabeled substitute. Full reasoning in `assets/LICENSES/monogram.txt`.
- **Named the Python logo-color constants `LOGO_FILL`/`LOGO_STROKE`** instead of redefining the plan's suggested `ACCENT_MOSS`/`REWARD_GREEN` names — `ACCENT_MOSS` already exists as a Plan 26-12 module constant (a different, per-level-theme concept) and redefining it would silently collide. Values still mirror `CONFIG.PALETTE.ACCENT_MOSS`/`REWARD`'s live hex, read directly rather than hand-copying the plan's stale literal (same principle Plan 26-03 established).
- **Removed the now-dead `CONFIG.TITLE.TITLE_SIZE` field** after its sole consumer (the old wordmark) was deleted, following the Plan 26-05 dead-field-cleanup precedent.
- **Chose a smaller source-bake font size (32, not 64)** after checkpoint feedback revealed the badge was being slightly downscaled under NEAREST at the original size — switched to a font size whose padded canvas is smaller than both bake targets, so both scale steps are clean upscales.
- **Set `LOGO_REVEAL_MS` to exactly 500 (the BRAND-03 ceiling)** rather than a smaller bump, per explicit human-verify feedback that the fade needed to be clearly noticeable, not merely a bit longer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, found via human-verify checkpoint] Reveal tween imperceptibly fast**
- **Found during:** Task 3 (human-verify checkpoint, round 1)
- **Issue:** `CONFIG.TITLE.LOGO_REVEAL_MS` was 400ms as specified in the plan, but a real human found the fade "not noticeable" in the running game.
- **Fix:** Raised to 500ms (the BRAND-03 ≤500ms ceiling itself), still a single one-shot `tween()`, no scheduler.
- **Files modified:** `src/config.js`
- **Verification:** `check-safety.sh` PASS; `browser-boot.mjs` PASS; human re-verify: approved.
- **Committed in:** `ecb47a5`

**2. [Rule 1 - Bug, found via human-verify checkpoint] Letters too tight to read, especially at badge size**
- **Found during:** Task 3 (human-verify checkpoint, round 1)
- **Issue:** `build_logo()`'s single `draw.text(long_string)` call used the font's default (zero extra) letter spacing; at the smaller 144×36 badge size this read as visually cramped. The badge was also being slightly *downscaled* from the 172×43 source canvas (172>144), which can soften/drop stroke pixels under `Image.NEAREST`.
- **Fix:** Reworked `build_logo()` to render character-by-character with an explicit 4px extra gap between each glyph's monospace advance width, and dropped the source font size from 64→32 so the padded source canvas (112×28) is smaller than both bake targets — both hero and badge are now clean NEAREST upscales.
- **Files modified:** `scripts/build-art-assets.py`, `assets/logo-hero.png`, `assets/logo-badge.png`
- **Verification:** `check-safety.sh` PASS; `browser-boot.mjs` PASS; visual inspection of both baked PNGs confirmed clear letter separation at both sizes; human re-verify: approved.
- **Committed in:** `7e0f726`

**3. [Rule 1 - Bug, dead config field] Removed CONFIG.TITLE.TITLE_SIZE**
- **Found during:** Task 2
- **Issue:** Deleting the old `text("Math Lab", { size: T.TITLE_SIZE })` block left `TITLE_SIZE` with zero remaining consumers.
- **Fix:** Removed the field from `CONFIG.TITLE`, following the Plan 26-05 dead-field-cleanup precedent (that plan removed `CONFIG.DOOR.LOCKED_GREY`/etc. under the same circumstance).
- **Files modified:** `src/config.js`
- **Verification:** grep confirms zero remaining `TITLE_SIZE` references outside the removed line's own history.
- **Committed in:** `6ac1b27`

---

**Total deviations:** 3 auto-fixed (2 found via human-verify checkpoint feedback — Rule 1 bug fixes routed back to their originating tasks and re-verified; 1 dead-field cleanup during normal Task 2 execution)
**Impact on plan:** All three were necessary corrections (2 were literally the checkpoint's own explicit findings, routed and closed within this plan rather than deferred). No scope creep — no architectural changes, no new files beyond what the plan specified.

## Issues Encountered

- `bash scripts/check-progress.sh` failed on 3 pre-existing `smoke-progress.mjs` level-geometry regression-pin assertions (level-01/03/04), unrelated to any file this plan touches. Logged in `deferred-items.md`, not fixed (out of scope per the Scope Boundary rule — this plan's `<files>` lists never included any level descriptor).
- The project's documented dev-serving convention (`cd src && python3 -m http.server 8000`) does not correctly resolve the `../assets/...` sibling-directory sprite paths under plain URL resolution (verified empirically: a server rooted at `src/` 404s on `/assets/...` requests). Served the human-verify checkpoint instead via a server rooted at the project root with the browser pointed at `/src/index.html` — matching exactly how the project's own trusted `scripts/browser-boot.mjs` regression gate serves the game. Not a code change; noted here in case the CLAUDE.md dev-serving doc needs a future correction.

## User Setup Required
None — no external service configuration required.

## Verification

- `bash scripts/check-safety.sh` — PASS (no scheduler in the reveal path)
- `bash scripts/check-gate.sh` — PASS
- `bash scripts/check-import-safety.sh` — PASS
- `node scripts/browser-boot.mjs` — PASS, title → select → all 8 levels loaded with zero runtime errors after both the initial wiring and the post-checkpoint fixes; both `logo-hero`/`logo-badge` sprite names resolve with no 404
- Human-verify checkpoint (Task 3, `gate="blocking"`) — **two rounds.** Round 1 found real, concrete issues (reveal too fast, letters too tight/hard to read especially on select); both routed back to their originating tasks, fixed, and re-verified automatically before re-presenting. Round 2: **"The logo looks better. Approved."**

## Next Phase Readiness
- `assets/logo-hero.png`/`assets/logo-badge.png` are baked, wired, and human-approved — no further logo work needed for BRAND-01/BRAND-03.
- `CONFIG.TITLE.LOGO_REVEAL_MS` (500) is the tuned, human-approved reveal duration; no further tuning expected.
- No blockers for 26-08 onward.

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 11 claimed files found on disk (assets/_font-src/monogram.ttf, assets/LICENSES/monogram.txt, assets/logo-hero.png, assets/logo-badge.png, scripts/build-art-assets.py, src/config.js, src/main.js, src/scenes/title.js, src/scenes/select.js, deferred-items.md, this summary). All 4 task/fix commit hashes (43a0110, 6ac1b27, 7e0f726, ecb47a5) found in git log.
