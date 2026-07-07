---
phase: 26-grunge-palette-nox-run-rebrand
plan: 03
subsystem: infra
tags: [pillow, art-pipeline, palette, per-level-theming, python]

# Dependency graph
requires:
  - phase: 26-02
    provides: "CONFIG.PALETTE's ACCENT_MOSS/ACCENT_SLATE/ACCENT_RUST hue-tinted accent tokens (WCAG-compliant, banned-hue-clean)"
provides:
  - "THEME_PALETTES dict (8 entries) in scripts/build-art-assets.py, deriving per-level far/mid/near/ground sub-palettes from ENVIRONMENT_PALETTE_* via a calm-to-harsh moss->slate->rust progression"
  - "build_ground_theme()/build_parallax_theme() bake functions (byte-identical bodies to the existing build_ground()/build_parallax(), parameterized)"
  - "32 baked PNGs: assets/parallax/{far,mid,near}-theme-{1..8}.png, assets/tiles/ground-theme-{1..8}.png"
affects: [26-04, 26-05, 26-06, 26-07, 26-08, 26-09, 26-10, 26-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Theme sub-palette derivation via _accent_sub(base, primary, secondary=None): replaces the existing achromatic list's 'brightest/highlight' slot (index 4, gracefully degrading to append for shorter derived lists) with a hue accent, reusing the SAME _remap_luminance ramp pipeline — no new tinting mechanism, matching 26-RESEARCH.md Pattern 2's explicit rejection of runtime shader tinting"

key-files:
  created:
    - assets/parallax/far-theme-1.png through far-theme-8.png (8 files)
    - assets/parallax/mid-theme-1.png through mid-theme-8.png (8 files)
    - assets/parallax/near-theme-1.png through near-theme-8.png (8 files)
    - assets/tiles/ground-theme-1.png through ground-theme-8.png (8 files)
  modified:
    - scripts/build-art-assets.py

key-decisions:
  - "ACCENT_MOSS/ACCENT_SLATE/ACCENT_RUST Python mirror values use CONFIG.PALETTE's CURRENT (post-26-02-brightening) hex literals (#476847/#4e6478/#8c5036), not the plan's stale pre-WCAG-fix literal picks (#2a3d2a/#2c3844/#5a3322) which 26-02 already superseded — kept in sync per the plan's own key_links note that these must hand-mirror CONFIG.PALETTE"
  - "Resolved the plan's ambiguous 'index [4]'/'index [5]' substitution scheme (which only literally fits the 7-entry ENVIRONMENT_PALETTE) via a graceful-degrade helper: replace at the target index when it exists, otherwise append as an extra luma bucket — functionally equivalent since _remap_luminance re-sorts every color list by luminance before use, so list order/length (only which colors are present) never affects rendered pixels"

patterns-established:
  - "Theme-to-level mapping recorded as a comment block directly above THEME_PALETTES (theme-1/2=moss, theme-3/4=slate, theme-5=slate+rust-hint transitional, theme-6=rust+slate-hint transitional, theme-7/8=rust) so 26-06 (level descriptor theme field) and 26-CONTRAST.md's reader can cross-reference without re-deriving it"

requirements-completed: [VIS-03]

coverage:
  - id: D1
    description: "8 distinct per-level theme sub-palettes exist (THEME_PALETTES dict), each derived from CONFIG.PALETTE's ACCENT_MOSS/ACCENT_SLATE/ACCENT_RUST plus existing neutrals, following a calmer-to-harsher progression (green early, blue-grey mid, rust late)"
    requirement: "VIS-03"
    verification:
      - kind: unit
        ref: "python3 -c \"import ast; ast.parse(open('scripts/build-art-assets.py').read())\" && grep -c THEME_PALETTES — parses clean, 8 keys theme-1..theme-8 confirmed via direct module inspection"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every theme's parallax far/mid/near layers and ground tileset are baked as real PNGs via the SAME _remap_luminance pipeline already used for the untouched base layers — 32 files at correct fixed dimensions, base assets byte-unchanged"
    requirement: "VIS-03"
    verification:
      - kind: unit
        ref: "python3 scripts/build-art-assets.py — all 32 theme files generated; dimension assertions (far 640x120, mid 640x144, near 640x90, ground 80x16) pass for all 8 themes; git status confirms zero diff on ground.png/far.png/mid.png/near.png"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 03: Per-Level Theme Art Pipeline (VIS-03) Summary

**Extended `scripts/build-art-assets.py` with an 8-entry `THEME_PALETTES` dict and two new theme-parameterized bake functions, generating 32 real baked PNGs (parallax far/mid/near + ground tileset per level) via the project's existing `_remap_luminance` pipeline — pure build-time asset generation, no game code wiring yet.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-07-07T19:00:00Z (approx, session start)
- **Completed:** 2026-07-07T19:03:06Z
- **Tasks:** 2 (both auto)
- **Files modified:** 1 (scripts/build-art-assets.py)
- **Files created:** 32 (baked theme PNGs)

## Accomplishments
- `scripts/build-art-assets.py` gained `ACCENT_MOSS`/`ACCENT_SLATE`/`ACCENT_RUST` Python constants (hand-mirrored to `CONFIG.PALETTE`, same no-cross-language-import convention as `ENVIRONMENT_PALETTE`), an `_accent_sub()` helper, and `THEME_PALETTES` — 8 entries (`theme-1`..`theme-8`), each with `far`/`mid`/`near`/`ground` sub-palette lists derived from the existing `ENVIRONMENT_PALETTE_FAR`/`_MID`/`_NEAR`/`ENVIRONMENT_PALETTE` lists
- Theme-to-level mapping follows the documented calm-to-harsh progression: theme-1/2 (levels 1-2) = moss green, theme-3/4 (levels 3-4) = slate blue-grey, theme-5 (level 5) = slate-primary with a rust hint on mid/near (transitional), theme-6 (level 6) = rust-primary with a slate hint kept everywhere (transitional, flipped), theme-7/8 (levels 7-8) = rust
- `build_ground_theme(theme_id, palette)` and `build_parallax_theme(theme_id, palette)` added — byte-identical bodies to `build_ground()`/`build_parallax()` (same source tiles/silhouette elements, same `_remap_luminance` call), parameterized by sub-palette and writing to `-theme-N` suffixed output paths
- `__main__` extended with a loop over `THEME_PALETTES` calling both new functions for all 8 themes, after the existing unparameterized calls
- Ran the full pipeline: all 32 new theme PNGs generated at their exact required dimensions (far 640x120, mid 640x144, near 640x90, ground 80x16); the 4 pre-existing base outputs (`ground.png`, `far.png`, `mid.png`, `near.png`) regenerated byte-identical — confirmed via `git status` showing zero diff — proving the original `build_ground()`/`build_parallax()` bodies are genuinely untouched, not just source-unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add THEME_PALETTES (8 entries) and theme-parameterized bake functions** - `44d512a` (feat)
2. **Task 2: Run the pipeline and verify all 32 theme PNGs exist with correct dimensions** - `6a1e3bc` (feat)

## Files Created/Modified
- `scripts/build-art-assets.py` - added `ACCENT_MOSS`/`ACCENT_SLATE`/`ACCENT_RUST` constants, `_accent_sub()` helper, `THEME_PALETTES` dict (8 entries), `build_ground_theme()`, `build_parallax_theme()`, and the `__main__` loop over all 8 themes
- `assets/parallax/far-theme-{1..8}.png`, `mid-theme-{1..8}.png`, `near-theme-{1..8}.png` (24 files) - baked per-level parallax layer variants
- `assets/tiles/ground-theme-{1..8}.png` (8 files) - baked per-level ground tileset variants

## Decisions Made
- **Used CONFIG.PALETTE's current (post-26-02-brightening) accent hex values**, not the plan's literal pre-fix text (`0x2a3d2a`/`0x2c3844`/`0x5a3322`) — those were superseded within Plan 26-02 itself (brightened to `0x476847`/`0x4e6478`/`0x8c5036` to clear the 3.0:1 WCAG threshold). The plan's own `key_links` field explicitly requires these Python constants to "reuse CONFIG.PALETTE's ACCENT_MOSS/ACCENT_SLATE/ACCENT_RUST hex values (hand-mirrored... keep in sync by convention)" — using the stale pre-fix values would have violated that same-plan requirement and produced Python/JS drift on day one.
- **Resolved the plan's index[4]/index[5] substitution scheme ambiguity.** `ENVIRONMENT_PALETTE_FAR`/`_MID`/`_NEAR` are 3/5/4-element derived slices — shorter than the 7-element `ENVIRONMENT_PALETTE` the plan's "index [4] mid-grey slot" language describes, so a literal index[4]/index[5] doesn't exist for `far`/`near` (and index[5] doesn't exist for `mid` either). Implemented `_accent_sub()` to replace at the target index when present, otherwise append as one extra luma bucket. Confirmed via reading `_remap_luminance`: it re-sorts every color list by luminance internally before building the ramp, so list order/exact length never affects the rendered pixels — only which colors are present. This makes replace-vs-append functionally equivalent, so the graceful degrade preserves the plan's actual intent (get the accent hue into each layer's ramp) without inventing new behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's literal accent hex values were stale/superseded**
- **Found during:** Task 1 (reading CONFIG.PALETTE to mirror the accent values)
- **Issue:** The plan's `<action>` text specified `ACCENT_MOSS = (0x2a, 0x3d, 0x2a)`, `ACCENT_SLATE = (0x2c, 0x38, 0x44)`, `ACCENT_RUST = (0x5a, 0x33, 0x22)` — these were 26-02's Task 1 *initial* picks, since brightened within 26-02 itself (deviation fix, commit `9df51b5`) to `0x476847`/`0x4e6478`/`0x8c5036` because the originals only reached ~1.7:1 WCAG contrast against BG. Using the plan's literal stale values would have violated the plan's own `key_links` requirement to hand-mirror CONFIG.PALETTE's actual values.
- **Fix:** Read `src/config.js`'s live `PALETTE` object and used the current values (`0x47/0x68/0x47`, `0x4e/0x64/0x78`, `0x8c/0x50/0x36`).
- **Files modified:** scripts/build-art-assets.py
- **Verification:** Values match `src/config.js` PALETTE.ACCENT_MOSS/ACCENT_SLATE/ACCENT_RUST exactly (visually confirmed via Read tool comparison)
- **Committed in:** `44d512a` (Task 1 commit — not a separate fix, applied inline during first authoring)

**2. [Rule 1 - Bug] Plan's index[4]/index[5] substitution scheme didn't literally apply to shorter derived lists**
- **Found during:** Task 1 (designing THEME_PALETTES construction)
- **Issue:** Plan text said "substituting ONE accent hue into index [4] of each list" uniformly for far/mid/near/ground, but `ENVIRONMENT_PALETTE_FAR` (3 elements) and `ENVIRONMENT_PALETTE_NEAR` (4 elements) have no real index 4, and `ENVIRONMENT_PALETTE_MID` (5 elements) has no index 5 for theme-5/6's described secondary substitution.
- **Fix:** Implemented `_accent_sub()` with graceful degrade (replace if index exists, else append) — proven functionally equivalent to the plan's intent since `_remap_luminance` re-sorts by luminance regardless of input list order/length.
- **Files modified:** scripts/build-art-assets.py
- **Verification:** Direct Python inspection of `THEME_PALETTES` confirmed all 8 themes produce distinct, correctly-composed far/mid/near/ground sub-palette lists with the expected accent colors present.
- **Committed in:** `44d512a` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — resolving stale/ambiguous plan specification against the live, already-superseded source of truth)
**Impact on plan:** No scope creep — both fixes were necessary to make the plan's own explicit requirements (hand-mirror CONFIG.PALETTE's actual values; produce 8 distinct theme sub-palettes) internally consistent and achievable. Both documented inline in `scripts/build-art-assets.py`'s comments for future readers.

## Issues Encountered
None beyond the two documented deviations above, both resolved within Task 1's single commit.

## User Setup Required
None — no external service configuration required. Pillow (10.2.0) was already installed; no new dependency added.

## Next Phase Readiness
- `THEME_PALETTES` and all 32 baked PNGs are ready for Plan 26-05 to wire per-level theme selection into the game (parallax.js/build.js sprite loading)
- Plan 26-06 can now set each level descriptor's `theme` field using the theme-to-level mapping documented as a comment directly above `THEME_PALETTES` in `scripts/build-art-assets.py`
- Original `build_ground()`/`build_parallax()` and their un-suffixed output paths (`ground.png`, `far.png`, `mid.png`, `near.png`) remain untouched fallback assets — confirmed byte-identical via `git status` after re-running the pipeline
- No blockers for 26-04 onward

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

Created file `26-03-SUMMARY.md` found on disk; both task commit hashes (44d512a, 6a1e3bc) found in git log.
