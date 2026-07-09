---
phase: 26-grunge-palette-nox-run-rebrand
plan: 01
subsystem: ui
tags: [kaplay, config, palette, refactor]

# Dependency graph
requires: []
provides:
  - "CONFIG.PALETTE — a single 13-key color-role source of truth in src/config.js"
  - "Zero raw [0x..,0x..,0x..] color-array literals in src/scenes/, src/ui/, src/fx.js, src/levels/build.js"
  - "CONFIG.DOOR/MATH_GATE/ENEMY/COLLECT color fields re-sourced from CONFIG.PALETTE (mirror duplication closed)"
affects: [26-02, 26-03, 26-04, 26-05, 26-06, 26-07, 26-08, 26-09, 26-10, 26-11]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Centralized color palette: every color() / outline()/rgb() call site in scene/ui/fx/level-builder code reads CONFIG.PALETTE.<ROLE>, never a raw hex literal or a local module-level color const"

key-files:
  created: []
  modified:
    - src/config.js
    - src/scenes/title.js
    - src/scenes/select.js
    - src/ui/hud.js
    - src/ui/challenge.js
    - src/ui/mathGate.js
    - src/fx.js
    - src/levels/build.js

key-decisions:
  - "PALETTE ships with 13 named color-role keys (BG, SURFACE, SURFACE_ALT, SURFACE_UNLOCKED, BORDER, MUTED, MUTED_BORDER, TEXT, TEXT_DIM, DANGER, REWARD, CLEARED, CURSOR), not the 12 the plan's prose stated — the plan's own explicit key list contained 13 entries; the '12' in the objective/artifacts prose was an internal miscount. Kept all 13 as literally specified (dropping one would silently break a consumer mapping in Tasks 2/3, since every key except BG is consumed by name)."

patterns-established:
  - "Color-source swap discipline: when centralizing a literal, delete the local const entirely (no unused alias left behind) and keep call-site call shape identical (color(X[0],X[1],X[2])) — pure re-source, zero layout/tween/logic change."

requirements-completed: [VIS-01]

coverage:
  - id: D1
    description: "CONFIG.PALETTE exists in src/config.js with 13 named color-role keys, exposed as CONFIG.PALETTE"
    requirement: "VIS-01"
    verification:
      - kind: unit
        ref: "node --input-type=module -e checking CONFIG.PALETTE shape and DOOR/MATH_GATE/ENEMY/COLLECT rewiring (ad hoc, run during execution)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Zero raw [0x..,0x..,0x..] color-array literals remain in src/scenes/, src/ui/, src/fx.js, src/levels/build.js"
    requirement: "VIS-01"
    verification:
      - kind: other
        ref: "grep -rn \"= \\[0x\" src/scenes/ src/ui/ src/fx.js src/levels/build.js (zero rows, exit 1)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No visual/behavioral regression from the color-source swap — check-safety.sh, validate-levels.mjs (all 8 levels), and browser-boot.mjs all pass"
    requirement: "VIS-01"
    verification:
      - kind: other
        ref: "bash scripts/check-safety.sh"
        status: pass
      - kind: other
        ref: "node scripts/validate-levels.mjs (zero HARD-FAIL across levels 01-08)"
        status: pass
      - kind: e2e
        ref: "node scripts/browser-boot.mjs (title -> select -> all levels load, no runtime errors)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 01: Centralize Color Palette (CONFIG.PALETTE) Summary

**Added a 13-key `CONFIG.PALETTE` object to `src/config.js` and rewired every color literal across `src/scenes/`, `src/ui/`, `src/fx.js`, and `src/levels/build.js` to read from it — zero raw `[0x..,0x..,0x..]` arrays remain outside the palette itself.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-07-07T18:27:32Z
- **Completed:** 2026-07-07T18:34:20Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- `CONFIG.PALETTE` established as the single source of truth for every UI/FX/level-builder color, closing the DOOR/MATH_GATE mirror-duplication RESEARCH.md flagged
- Every consuming file (title.js, select.js, hud.js, challenge.js, mathGate.js, fx.js, build.js) reads colors exclusively via `CONFIG.PALETTE.<ROLE>` — no local module-level color consts remain
- Zero visual/behavioral change: RGB values are byte-identical to their pre-refactor literals, verified by `check-safety.sh`, `validate-levels.mjs` (all 8 levels, zero HARD-FAIL), and a real-browser `browser-boot.mjs` run (title → select → every level loads with no runtime errors)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CONFIG.PALETTE and rewire config.js's own DOOR/MATH_GATE/ENEMY/COLLECT blocks** - `8d503bc` (feat)
2. **Task 2: Sweep title.js, hud.js, fx.js to read CONFIG.PALETTE** - `831ea29` (feat)
3. **Task 3: Sweep select.js, challenge.js, mathGate.js, and build.js's LABEL_FG to read CONFIG.PALETTE** - `e123b37` (feat)

_No TDD tasks in this plan — pure refactor, verified by automated grep/safety/validator/browser gates._

## Files Created/Modified
- `src/config.js` - new module-level `PALETTE` const (13 keys) exposed as `CONFIG.PALETTE`; DOOR/MATH_GATE `LOCKED_GREY`/`LOCKED_BORDER`, ENEMY `COLOR`, and COLLECT `PICKUP_BG`/`PICKUP_BORDER`/`PICKUP_FG` now reference `PALETTE.*` values instead of re-declaring hex literals
- `src/scenes/title.js` - `ACCENT_GREEN`/`HINT_FG`/`RESET_FG`/`DANGER_RED`/`PANEL_BG`/`PANEL_BORDER` consts removed; call sites read `CONFIG.PALETTE.REWARD`/`TEXT`/`TEXT_DIM`/`DANGER`/`SURFACE`/`BORDER`
- `src/scenes/select.js` - `ACCENT_GREEN`/`UNLOCKED_FILL`/`LOCKED_GREY`/`CLEARED_BLUE`/`LABEL_FG`/`SELECTABLE_BORDER`/`LOCKED_BORDER`/`CURSOR_BORDER` consts removed; call sites read `CONFIG.PALETTE.REWARD`/`SURFACE_UNLOCKED`/`MUTED`/`CLEARED`/`TEXT`/`MUTED_BORDER`/`CURSOR`
- `src/ui/hud.js` - `TRACK_GREY`/`ACCENT_GREEN`/`HINT_FG` consts removed; call sites read `CONFIG.PALETTE.BORDER`/`REWARD`/`TEXT`
- `src/ui/challenge.js` - `PANEL_BG`/`PANEL_BORDER`/`BOX_BG`/`BOX_BORDER`/`ACCENT_RED`/`LABEL_FG` consts removed; call sites read `CONFIG.PALETTE.SURFACE`/`BORDER`/`SURFACE_ALT`/`MUTED`/`DANGER`/`TEXT`
- `src/ui/mathGate.js` - `ACCENT_GREEN` const removed; the LEVEL CLEAR banner reads `CONFIG.PALETTE.REWARD`
- `src/fx.js` - `ACCENT_GREEN` const removed; pop + clear-burst effects read `CONFIG.PALETTE.REWARD`
- `src/levels/build.js` - module-level `LABEL_FG` const removed; door/math-gate/enemy glyph `text()` calls read `CONFIG.PALETTE.TEXT`

## Decisions Made
- Followed the plan's exact 12-vs-13 key list literally: the plan's prose said "12 named color-role keys" but the plan's own explicit RGB-triple list enumerates 13 (`BG, SURFACE, SURFACE_ALT, SURFACE_UNLOCKED, BORDER, MUTED, MUTED_BORDER, TEXT, TEXT_DIM, DANGER, REWARD, CLEARED, CURSOR`). Kept all 13 rather than guessing which one to drop — every key except `BG` is a required consumer mapping in Tasks 2/3, and `BG` (near-black background token) is a legitimate forward-looking palette role even though no current call site references it yet.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's own key-count prose ("12 keys") contradicted its own 13-entry key list**
- **Found during:** Task 1 (adding CONFIG.PALETTE)
- **Issue:** The plan's `<action>` text says "Define exactly these 12 keys" then lists 13 comma-separated key:value pairs (BG through CURSOR). The task's automated verify script and acceptance criteria both hardcode "12" as the expected `Object.keys(CONFIG.PALETTE).length`.
- **Fix:** Implemented all 13 keys exactly as named in the explicit list (not truncating to 12), since Tasks 2 and 3 require 12 of the 13 named roles by exact name (BG is the only key without a current consumer, kept as a legitimate forward-looking token). Ran a corrected manual verification (checking for exactly the 13 named keys and the 8 rewired DOOR/MATH_GATE/ENEMY/COLLECT fields) instead of the plan's literal `length !== 12` check, which would have failed on a correct implementation.
- **Files modified:** src/config.js
- **Verification:** `node --input-type=module -e` script confirming all 13 PALETTE keys present and all 8 rewired CONFIG.DOOR/MATH_GATE/ENEMY/COLLECT fields deep-equal their PALETTE source; `node --check` syntax pass
- **Committed in:** 8d503bc (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — plan documentation miscount, Rule 1)
**Impact on plan:** No functional impact — the fix is fully forward-compatible with every later Phase 26 plan since Tasks 2/3's consumer mappings match the 13-key list, not the miscounted "12". No scope creep.

## Issues Encountered
None beyond the key-count documentation deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `CONFIG.PALETTE` is now the single source of truth every later Phase 26 plan (palette expansion, per-level theming, door/enemy sprite art, logo, rebrand sweep) can extend or read from without touching scattered literals
- Zero raw color-array literals remain in scope — the VIS-01 gate this plan exists to satisfy is closed and independently re-verifiable via `grep -rn "= \[0x" src/scenes/ src/ui/ src/fx.js src/levels/build.js`
- No blockers for 26-02 onward

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 8 modified source files and the SUMMARY.md itself found on disk; all 3 task commit hashes (8d503bc, 831ea29, e123b37) found in git log.
