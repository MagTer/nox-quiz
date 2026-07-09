---
phase: 26-grunge-palette-nox-run-rebrand
plan: 12
subsystem: ui
tags: [kaplay, config, palette, wcag, accessibility, art-pipeline, mid-execution-revision]

# Dependency graph
requires:
  - phase: 26-03
    provides: "THEME_PALETTES dict (8 entries) and theme-parameterized bake functions consumed and rewritten by this plan"
provides:
  - "CONFIG.PALETTE expanded from 3 to 8 accent hues: ACCENT_MOSS, ACCENT_FERN, ACCENT_TEAL, ACCENT_SLATE, ACCENT_STEEL, ACCENT_CLAY, ACCENT_RUST, ACCENT_EMBER — one dedicated accent per level"
  - "scripts/check-contrast.mjs extended to check all 8 accents (was 3)"
  - "26-CONTRAST.md refreshed with the full 19-role table and 16-pairing WCAG output"
  - "26-PALETTE-SWATCH.png regenerated with all 19 roles"
  - "Human sign-off closed on the 5 net-new accent hues (FERN/TEAL/STEEL/CLAY/EMBER) — none reads as pink/magenta/mauve"
  - "THEME_PALETTES reassigned to one dedicated accent per level (no more shared/blended accents); all 32 theme PNGs rebaked; no two theme-N outputs are byte-identical"
affects: [26-04, 26-05, 26-06, 26-07, 26-08, 26-09, 26-10, 26-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "THEME_PALETTES built via a dict comprehension over a small theme-id -> accent mapping (_THEME_ACCENTS), replacing 8 hand-written literal dict entries — same _accent_sub/_remap_luminance mechanism 26-03 established, just simpler now that every theme uses exactly one accent (no more 2-color blending special-case)"

key-files:
  created: []
  modified:
    - src/config.js
    - scripts/check-contrast.mjs
    - .planning/phases/26-grunge-palette-nox-run-rebrand/26-CONTRAST.md
    - .planning/phases/26-grunge-palette-nox-run-rebrand/26-PALETTE-SWATCH.png
    - scripts/build-art-assets.py
    - assets/parallax/far-theme-2.png
    - assets/parallax/far-theme-3.png
    - assets/parallax/far-theme-5.png
    - assets/parallax/far-theme-6.png
    - assets/parallax/far-theme-8.png
    - assets/parallax/mid-theme-2.png
    - assets/parallax/mid-theme-3.png
    - assets/parallax/mid-theme-5.png
    - assets/parallax/mid-theme-6.png
    - assets/parallax/mid-theme-8.png
    - assets/parallax/near-theme-2.png
    - assets/parallax/near-theme-3.png
    - assets/parallax/near-theme-5.png
    - assets/parallax/near-theme-6.png
    - assets/parallax/near-theme-8.png
    - assets/tiles/ground-theme-2.png
    - assets/tiles/ground-theme-3.png
    - assets/tiles/ground-theme-5.png
    - assets/tiles/ground-theme-6.png
    - assets/tiles/ground-theme-8.png
    - .planning/phases/26-grunge-palette-nox-run-rebrand/26-CONTEXT.md
    - .planning/ROADMAP.md

key-decisions:
  - "Task 1's initial ACCENT_STEEL literal (0x4a5668) measured ~2.66:1 against BG, below the plan's own 3.0:1 WCAG threshold; brightened to 0x525e82 (~3.09:1), preserving the intended cooler-than-slate blue-grey character. Human later confirmed acceptance of this exact hue at the Task 3 checkpoint, including its slight blue-purple lean."
  - "scripts/check-contrast.mjs's WCAG PAIRINGS table was extended from 3 to 8 accent rows (FERN/TEAL/STEEL/CLAY/EMBER added) — the plan's own acceptance criteria required all 8 accents verified via check-contrast.mjs, but the pre-existing script only checked the original 3; the banned-hue guardrail already swept all palette roles automatically, only the WCAG section needed the addition."
  - "THEME_PALETTES rewritten as a dict comprehension over a compact theme-id->accent mapping rather than 8 hand-written entries, since every theme now uses exactly one accent with no blending — simpler than the pre-existing per-theme literal dict and easier to keep in sync with future accent changes."
  - "theme-1/4/7's baked PNGs came out byte-identical to their pre-plan versions (same ACCENT_MOSS/SLATE/RUST assignment as before); only theme-2/3/5/6/8 changed, confirmed via git diff before staging — expected and correct, not a bug."

patterns-established:
  - "Mid-execution plan insertions get a dated addendum on the ORIGINAL decision bullet (not a silent overwrite) in both 26-CONTEXT.md and ROADMAP.md, plus an explicit Wave N.5 entry in ROADMAP.md's Plans list — matching the phase's existing Superseded/Added annotation convention (criteria 5/6) and now extended to mid-wave insertions."

requirements-completed: [VIS-02, VIS-03]

coverage:
  - id: D1
    description: "CONFIG.PALETTE has 8 total accent hues (up from 3), forming one dedicated, WCAG-clearing, non-pink accent per level"
    requirement: "VIS-02"
    verification:
      - kind: unit
        ref: "node scripts/check-contrast.mjs — 16/16 WCAG pairings PASS (5 new accent rows added), 0/19 roles banned-hue-flagged"
        status: pass
    human_judgment: false
  - id: D2
    description: "A human has explicitly signed off, against a rendered swatch proof of the 5 NEW accent hues only, that none reads as pink/magenta/mauve"
    requirement: "VIS-02"
    verification:
      - kind: human
        ref: "Task 3 checkpoint — human reviewed 26-PALETTE-SWATCH.png directly and responded \"approved\", explicitly accepting ACCENT_STEEL's blue-purple lean as-is"
        status: pass
    human_judgment: true
  - id: D3
    description: "All 8 per-level theme bakes are regenerated so every one of the 8 levels reads as visually distinct — no two levels share an identical theme"
    requirement: "VIS-03"
    verification:
      - kind: unit
        ref: "Pairwise cmp across all 8 ground-theme-N.png files — zero duplicates (previously theme-1==theme-2, theme-3==theme-4, theme-7==theme-8)"
        status: pass
    human_judgment: false

duration: "~9min active work (spans a Task 3 human-verify checkpoint pause between Task 2 and Task 4)"
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 12: Mid-Execution Palette Expansion (3->8 Accents) Summary

**Mid-execution correction requested by the user after reviewing Wave 3's output: expanded `CONFIG.PALETTE`'s accent hues from 3 to 8 (one dedicated hue per level), closing human sign-off on the 5 net-new hues, then reassigned and rebaked all 8 per-level themes so no two levels share an identical background/accent tint — fixing the literal theme-1==theme-2/theme-3==theme-4/theme-7==theme-8 duplication the original 3-hue scheme produced.**

## Performance

- **Duration:** ~9 min active work (spans a Task 3 blocking human-verify checkpoint pause)
- **Started:** 2026-07-07T19:49:00Z (approx)
- **Completed:** 2026-07-07T20:00:07Z
- **Tasks:** 5 (4 auto + 1 human-verify checkpoint)
- **Files modified:** 25 (2 code, 2 evidence/swatch docs, 1 art pipeline script, 20 rebaked theme PNGs, 2 planning docs)
- **Files created:** 0

## Accomplishments
- `CONFIG.PALETTE` expanded to 8 total `ACCENT_*` tokens (`MOSS`, `FERN`, `TEAL`, `SLATE`, `STEEL`, `CLAY`, `RUST`, `EMBER`) — the 3 pre-existing tokens are byte-unchanged from 26-02, reused as-is; the 5 new tokens all clear the 3.0:1 WCAG UI-component threshold and zero read as banned hues
- `scripts/check-contrast.mjs`'s WCAG role-pairing table extended from 3 to 8 accent rows so all 8 are explicitly verified (the banned-hue sweep already covered all palette roles automatically)
- `26-CONTRAST.md` refreshed: 19-role table (up from 16), full 16-pairing verbatim script output, a new Section 3a documenting the ACCENT_STEEL WCAG deviation, and an updated sign-off status section distinguishing the original 26-02 human sign-off from this plan's Task 3 sign-off
- `26-PALETTE-SWATCH.png` regenerated (zero code changes needed — `build_palette_swatch()` already reads `CONFIG.PALETTE` live) — now shows all 19 roles in a 4-column grid
- Task 3's blocking human-verify checkpoint was closed: human reviewed the regenerated swatch directly and responded "approved" — confirmed none of the 5 new hues reads as pink/magenta/mauve and the 8-hue progression (MOSS→FERN→TEAL→SLATE→STEEL→CLAY→RUST→EMBER) reads as coherent, explicitly accepting ACCENT_STEEL's blue-purple lean
- `scripts/build-art-assets.py`'s `THEME_PALETTES` rewritten from 8 hand-written per-theme dict entries (with a 2-color blending special-case for theme-5/theme-6) to a dict comprehension over a compact theme-id→accent mapping, one accent per theme, no blending
- Re-ran the full bake pipeline: 20 of the 32 theme PNGs changed (theme-2/3/5/6/8's far/mid/near/ground); theme-1/4/7 came out byte-identical since their assigned accent (MOSS/SLATE/RUST) didn't change — confirmed via `git diff` before staging. Pairwise `cmp` across all 8 `ground-theme-N.png` files confirms zero duplicates, closing the exact defect this plan was created to fix
- `bash scripts/check-safety.sh` still passes (no `src/` runtime behavior touched — pure config data + build-time asset generation)
- `26-CONTEXT.md`'s VIS-02 decision bullet and `ROADMAP.md`'s Phase 26 success criterion 1 both carry a dated `Revised 2026-07-07` addendum (original text preserved), matching the phase's existing Superseded/Added annotation convention; `ROADMAP.md` also gained a `Wave 3.5` plan entry for 26-12 and an updated 4/12 plan count

## Task Commits

Each task was committed atomically:

1. **Task 1: Expand CONFIG.PALETTE from 3 to 8 accent hues** - `a18214f` (feat) — includes the ACCENT_STEEL brightening fix and check-contrast.mjs's extended PAIRINGS table (Rule 2 deviations, applied inline before commit)
2. **Task 2: Update 26-CONTRAST.md and regenerate the swatch proof image** - `2f93815` (docs)
3. **Task 3: Human sign-off checkpoint** - no code commit (verification-only); sign-off recorded in this SUMMARY and 26-CONTRAST.md — human response: "approved"
4. **Task 4: Reassign THEME_PALETTES to one dedicated accent per level and rebake** - `c05273c` (feat)
5. **Task 5: Annotate 26-CONTEXT.md and ROADMAP.md with the revised decision** - `f9672f4` (docs)

## Files Created/Modified
- `src/config.js` - added `ACCENT_FERN`/`ACCENT_TEAL`/`ACCENT_STEEL`/`ACCENT_CLAY`/`ACCENT_EMBER` to `PALETTE` (Task 1); `ACCENT_STEEL` brightened from its initial pick during the same task; comment block above the accent tokens updated to record the Plan 26-12 expansion
- `scripts/check-contrast.mjs` - extended `PAIRINGS` with 5 new accent rows (Task 1 deviation fix)
- `.planning/phases/26-grunge-palette-nox-run-rebrand/26-CONTRAST.md` - role table expanded to 19 roles, WCAG output refreshed, new Section 3a (ACCENT_STEEL deviation), sign-off status section split by plan (Task 2, updated again in narrative after Task 3 closed)
- `.planning/phases/26-grunge-palette-nox-run-rebrand/26-PALETTE-SWATCH.png` - regenerated with all 19 roles (Task 2)
- `scripts/build-art-assets.py` - added `ACCENT_FERN`/`ACCENT_TEAL`/`ACCENT_STEEL`/`ACCENT_CLAY`/`ACCENT_EMBER` Python mirrors; `THEME_PALETTES` rewritten as a one-accent-per-theme dict comprehension, removing the old 2-color blend helper usage for theme-5/6 (Task 4)
- `assets/parallax/{far,mid,near}-theme-{2,3,5,6,8}.png`, `assets/tiles/ground-theme-{2,3,5,6,8}.png` (20 files) - rebaked with their newly-assigned dedicated accent (Task 4)
- `.planning/phases/26-grunge-palette-nox-run-rebrand/26-CONTEXT.md` - dated addendum on the VIS-02 decision bullet (Task 5)
- `.planning/ROADMAP.md` - dated addendum on Phase 26 success criterion 1, new Wave 3.5 plan entry for 26-12, updated plan count (Task 5)

## Decisions Made
- **Brightened ACCENT_STEEL** from its initial pick (`#4a5668`, ~2.66:1) to `#525e82` (~3.09:1) within Task 1, to clear the plan's own 3.0:1 WCAG UI-component threshold, before the human checkpoint. The human's Task 3 approval explicitly covered this exact brightened value, including its blue-purple lean.
- **Extended check-contrast.mjs's WCAG PAIRINGS table** to cover all 8 accents (was 3) rather than leaving the 5 new accents WCAG-unchecked, since the plan's own Task 1 acceptance criteria required "all 8 accents clearing their WCAG threshold" via that exact script.
- **Simplified THEME_PALETTES construction** to a dict comprehension over `_THEME_ACCENTS` (theme-id -> accent) rather than preserving 8 separate literal dict entries, since the one-accent-per-theme model no longer needs the 2-color blend special-case 26-03 built for the old theme-5/theme-6 transitional pairing.
- **Recorded the mid-execution revision transparently** in both 26-CONTEXT.md and ROADMAP.md as a dated addendum on the original decision text (not a silent overwrite), plus a new Wave 3.5 entry in ROADMAP.md's Plans list — following the phase's established Superseded/Added annotation convention (criteria 5/6) rather than inventing a new documentation pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] ACCENT_STEEL's initial literal failed the plan's own WCAG must-have**
- **Found during:** Task 1 (running `node scripts/check-contrast.mjs` after adding all 5 new tokens)
- **Issue:** The plan's `<action>` text specified `ACCENT_STEEL: [0x4a, 0x56, 0x68]`, which measured ~2.66:1 contrast against BG — below the plan's own must-have truth #1 (all 8 accents WCAG-clearing). The plan itself anticipated this ("these 5 values are starting points, not final... brighten/adjust it... same pattern 26-02 used").
- **Fix:** Brightened to `[0x52, 0x5e, 0x82]` (~3.09:1), verified via `node scripts/check-contrast.mjs` (PASS) and `isBannedHue()` (not flagged). Preserved the intended "cooler/darker blue-grey than slate" character.
- **Files modified:** src/config.js
- **Verification:** `node scripts/check-contrast.mjs` exit 0, 16/16 WCAG pairings PASS; human later explicitly approved this exact value at Task 3
- **Committed in:** `a18214f` (Task 1 commit — applied inline during first authoring, per the plan's own explicit "iterate until it passes" instruction)

**2. [Rule 2 - Missing critical functionality] check-contrast.mjs's WCAG table didn't check all 8 accents**
- **Found during:** Task 1 (verifying the acceptance criteria "all 8 accents clearing their WCAG threshold")
- **Issue:** `scripts/check-contrast.mjs`'s `PAIRINGS` array (established in 26-02) only had rows for the original 3 accents (MOSS/SLATE/RUST). Running the unmodified script after adding 5 new tokens would only report on 3/8 accents' WCAG status, not satisfying the plan's own Task 1 acceptance criteria.
- **Fix:** Added 5 new rows to `PAIRINGS` (FERN/TEAL/STEEL/CLAY/EMBER, all threshold 3.0 against BG). The banned-hue guardrail section required no change — it already sweeps every `CONFIG.PALETTE` role via `Object.entries()`.
- **Files modified:** scripts/check-contrast.mjs
- **Verification:** `node scripts/check-contrast.mjs` output shows all 8 accent rows explicitly, exit 0
- **Committed in:** `a18214f` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 — closing gaps in the plan's own explicit WCAG must-have, both anticipated by the plan's own "starting points, not final" framing for Task 1's literal hex picks)
**Impact on plan:** No scope creep — both fixes were required for the plan's own Task 1 acceptance criteria to be genuinely satisfied, not just superficially. No architectural changes; no route-back to Task 1 was needed since the human approved the final swatch as-is at Task 3.

## Human Checkpoint

**Task 3 (blocking human-verify):** Human reviewed the regenerated `26-PALETTE-SWATCH.png` directly and responded: *"approved"* — confirming none of the 5 new accent hues (ACCENT_FERN, ACCENT_TEAL, ACCENT_STEEL, ACCENT_CLAY, ACCENT_EMBER) reads as pink/magenta/mauve, and that the 8-hue progression (MOSS→FERN→TEAL→SLATE→STEEL→CLAY→RUST→EMBER) reads as coherent — explicitly including acceptance of ACCENT_STEEL's blue-purple lean as-is. No route-back to Task 1 was needed.

This closes the human half of VIS-02's sign-off requirement for the 5 net-new hues (the 3 pre-existing hues already carried 26-02's sign-off and were not re-litigated per the plan's explicit scoping).

## Issues Encountered
None beyond the two documented WCAG-driven deviations above, both resolved within Task 1 and covered by the Task 3 human approval.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- `CONFIG.PALETTE` now carries all 19 roles with 8 fully-distinct, WCAG-clearing, non-pink accent hues — ready for 26-04 onward (door/enemy sprite work, logo, brand sweep) to read from
- `THEME_PALETTES` now assigns one dedicated accent per level with zero duplicate theme outputs — 26-04/26-05/26-06 can proceed on the corrected 8-distinct-theme foundation without carrying forward the theme-1==theme-2/theme-3==theme-4/theme-7==theme-8 defect
- `scripts/check-contrast.mjs` remains a permanent, re-runnable gate, now covering all 8 accents
- No blockers for 26-04 onward

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 10 spot-checked created/modified files found on disk (src/config.js, scripts/check-contrast.mjs, 26-CONTRAST.md, 26-PALETTE-SWATCH.png, scripts/build-art-assets.py, 26-CONTEXT.md, ROADMAP.md, 26-12-SUMMARY.md, assets/tiles/ground-theme-2.png, assets/parallax/far-theme-8.png); all 4 task commit hashes (a18214f, 2f93815, c05273c, f9672f4) found in git log.
