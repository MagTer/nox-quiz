---
phase: 31-asset-bake-style-board-sign-off
plan: 03
subsystem: infra
tags: [pillow, hsv, pink-gate, art-01, shell-gate-family]

# Dependency graph
requires:
  - phase: 31-asset-bake-style-board-sign-off (Plan 31-01)
    provides: "assets/_gothicvania-src/ raw pack files used for the RED-first proof"
provides:
  - "scripts/lib/pink_scan.py — pink_fraction() HSV dominant-opaque-pixel scan + CLI (self-test, single-file, directory-walk modes)"
  - "scripts/check-pink-gate.sh — shell wrapper matching the check-*.sh gate family conventions"
  - "Proven RED-first detection of the 2 known pre-retint pink assets (Town ~64%, Cemetery ~79%), both well above the 8% threshold"
affects: [31-04, 31-05, 31-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "New member of the check-*.sh gate family: scripts/check-pink-gate.sh (set -euo pipefail, ROOT via git rev-parse, fail() helper, trailing PASS echo — matches check-progress.sh/check-safety.sh exactly)"
    - "Single named/justified allowlist entry pattern (scripts/check-rebrand.sh precedent) applied to a content-quality gate for the first time"

key-files:
  created:
    - "scripts/lib/pink_scan.py"
    - "scripts/check-pink-gate.sh"
  modified: []

key-decisions:
  - "Locked HSV parameters as documented in 31-RESEARCH.md/31-03-PLAN.md: band_lo=211, band_hi=239, min_sat=30, THRESHOLD=0.08 — verified zero false positives across all 47 currently-shipped assets/ PNGs"
  - "Allowlist matching is by path-suffix (.endswith on forward-slash-normalized path), not exact-string-equality against a repo-root-relative path, so the gate works regardless of the absolute prefix check-pink-gate.sh invokes it with"
  - "_iter_png_files() prunes ANY directory name starting with '_' generically (not just the 3 named _*-src dirs), which is a superset of the literal exclusion requirement and future-proofs against new _*-src siblings"

patterns-established:
  - "pink_fraction(path, band_lo, band_hi, min_sat) as a reusable library function, importable from other scripts (e.g. a future retint regression check in Plan 31-06) without shelling out"

requirements-completed: [ART-01]

coverage:
  - id: D1
    description: "pink_scan.py's pink_fraction() correctly classifies the 3 synthetic behavior cases: opaque salmon-pink -> 1.0, opaque near-black -> 0.0 (low-saturation HSV instability excluded), fully-transparent -> 0.0 (no divide-by-zero)"
    requirement: "ART-01"
    verification:
      - kind: unit
        ref: "python3 scripts/lib/pink_scan.py (inline self-test, no args) -> [selftest] ALL PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "check-pink-gate.sh passes cleanly (exit 0, 'pink-gate checks: PASS') against the current pre-Gothicvania assets/ tree with zero false positives across all 47 shipped PNGs"
    requirement: "ART-01"
    verification:
      - kind: integration
        ref: "bash scripts/check-pink-gate.sh -> pink-gate checks: PASS, exit 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "RED-first proof: both known pre-retint pink source crops (Town dusk sky, Cemetery horizon glow) trip pink_scan.py's single-file mode well above the 0.08 threshold (~64% and ~79%), and a throwaway in-assets/ copy of one of them causes the full check-pink-gate.sh wrapper to fail non-zero, propagating the detection correctly"
    requirement: "ART-01"
    verification:
      - kind: integration
        ref: "python3 scripts/lib/pink_scan.py assets/_gothicvania-src/gothicvania-town-files/.../background.png -> 0.6432; .../gothicvania-cemetery-files_1/.../background.png -> 0.7868; bash scripts/check-pink-gate.sh (throwaway copy present) -> exit 1"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-07-10
status: complete
---

# Phase 31 Plan 03: Pink-Hue Scan Gate & RED-First Proof Summary

**New `scripts/lib/pink_scan.py` (HSV dominant-opaque-pixel scan, Pillow-only) + `scripts/check-pink-gate.sh` gate-family wrapper, proven RED-first at ~64%/~79% against the two known pre-retint pink Gothicvania source crops, and green (zero false positives) against all 47 currently-shipped `assets/` PNGs.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-10T11:31:00Z (approx)
- **Completed:** 2026-07-10T11:56:00Z
- **Tasks:** 2/2
- **Files modified:** 2 created (`scripts/lib/pink_scan.py`, `scripts/check-pink-gate.sh`)

## Accomplishments
- `pink_fraction(path, band_lo=211, band_hi=239, min_sat=30)` implemented, adapted read-only from `styleboard.py`'s live `hue_shift_band()`, with the required `.convert("RGBA").convert("RGB").convert("HSV")` chain (avoids the Pillow ≥6.0 P-mode→HSV `ValueError`)
- CLI with 3 modes: no-arg inline self-test (3 synthetic behavior cases), single-file report mode (used for the RED-first proof against raw, gitignored pack crops), and recursive directory-scan mode (used by `check-pink-gate.sh` against the real `assets/` tree)
- `scripts/check-pink-gate.sh` created matching the `check-progress.sh`/`check-safety.sh` shell shape exactly (`set -euo pipefail`, `ROOT="$(git rev-parse --show-toplevel)"`, local `fail()` helper, trailing `pink-gate checks: PASS` echo)
- Exactly one documented allowlist entry: `assets/player-swamphunter.png`, justified by its native dark plum/maroon outline-shading color's HSV hue instability at low brightness (not yet baked this phase — status noted below as currently dead/inert, per the plan's explicit instruction to record its live/dead status)
- Directory-walk pruning excludes any `_`-prefixed directory (a superset of the literal `assets/_gothicvania-src`/`assets/_kenney-src`/`assets/_opengameart-src` requirement), confirmed by `grep -c` returning 1 for the literal names (documented in comments, not the runtime logic, which is generic)
- RED-first proof: Town dusk sky background.png scored 0.6432 (64.3%), Cemetery horizon glow background.png scored 0.7868 (78.7%) — both comfortably above the 0.08 threshold and matching the plan's expected ~64%/~79% figures exactly
- Spot-check: a throwaway copy of the Town background inside `assets/` (not under `_*-src/`) caused the full `bash scripts/check-pink-gate.sh` wrapper to exit 1 with a clear `PINK: ... FAIL` message, proving the directory-walk + threshold logic (not just the underlying function) propagates a failure correctly. The throwaway copy was deleted immediately afterward; `git status --short assets/` confirmed no leftover file, and `check-pink-gate.sh` was re-run to confirm it returns to PASS.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write pink_scan.py + check-pink-gate.sh** - `10eb0cc` (feat)
2. **Task 2: RED-first proof against the 2 known pre-retint pink assets** - no commit (plan explicitly declares `<files>(none created/modified)</files>` — proof-only, run against Plan 31-01's already-fetched raw source files; `git status --short` was clean after the throwaway-copy spot-check and cleanup, confirming nothing needed staging)

**Plan metadata:** (this SUMMARY.md commit, see below)

## Files Created/Modified
- `scripts/lib/pink_scan.py` - HSV dominant-opaque-pixel pink/magenta scan: `pink_fraction()` library function + 3-mode CLI (self-test / single-file / directory)
- `scripts/check-pink-gate.sh` - thin `check-*.sh`-family shell wrapper invoking `pink_scan.py` against `assets/`

## Decisions Made
- Matched all locked parameters exactly as specified in 31-RESEARCH.md/31-03-PLAN.md (`band_lo=211, band_hi=239, min_sat=30, THRESHOLD=0.08`) rather than re-deriving them, since Plan 31-04's retint work is tuned against these exact values.
- Used path-suffix matching (`.endswith`) for the allowlist rather than exact repo-root-relative equality, so the same `ALLOWLIST` dict works whether the CLI is invoked with an absolute path (as `check-pink-gate.sh` does, via `$ROOT/assets`) or a relative one (as ad-hoc single-file invocations do).
- Verified the synthetic salmon-pink self-test pixel via `colorsys.hsv_to_rgb()` round-tripped through Pillow's actual HSV converter (rather than assuming an RGB literal maps to a specific Pillow hue value) — confirmed hue=230, sat=200 round-trips correctly before committing to the test fixture.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Copied Plan 31-01's gitignored raw source files from a sibling worktree**
- **Found during:** Task 2 (RED-first proof)
- **Issue:** This plan's Task 2 depends on Plan 31-01's `assets/_gothicvania-src/` output (`depends_on: ["31-01"]`), but that directory is intentionally gitignored (multi-MB raw archives, per Plan 31-01's own decision). Since this plan executes in an isolated parallel worktree, the gitignored artifact from Plan 31-01's execution never propagated here via git — it only exists on disk in whichever sibling worktree ran 31-01.
- **Fix:** Located the populated `assets/_gothicvania-src/` tree in sibling worktree `agent-a72c78daba6f248fc` and copied only the two specific files this task's `<read_first>`/`<verify>` blocks reference (Town `background.png`, Cemetery `background.png`) into this worktree's matching gitignored path. This is a filesystem-only copy of already-gitignored, re-fetchable content — no git operation, no commit, and `git status --short assets/` remained clean throughout (confirmed before and after).
- **Files modified:** none (gitignored paths only)
- **Verification:** `python3 scripts/lib/pink_scan.py <town-bg>` -> 0.6432; `python3 scripts/lib/pink_scan.py <cemetery-bg>` -> 0.7868 — both figures match the plan's expected ~64%/~79% ranges, confirming the copied files are the correct, complete pack crops.
- **Committed in:** N/A (no git-tracked files changed by this fix)

---

**Total deviations:** 1 auto-fixed (1 blocking — cross-worktree gitignored artifact access)
**Impact on plan:** Necessary only to physically locate Plan 31-01's declared dependency inside this parallel worktree's filesystem; no scope creep, no change to any git-tracked file, no change to the gate's logic or parameters.

## Issues Encountered
None beyond the deviation documented above.

## Known Stubs
None. `assets/player-swamphunter.png` does not exist yet (Plan 31-05's job to bake it) — the one allowlist entry in `pink_scan.py` is currently **dead** (matches no existing file), which is the expected, explicitly-anticipated state per the plan's own instruction ("If Plan 31-05's actual baked assets/player-swamphunter.png does not in fact trip the gate ... this allowlist entry is harmless dead weight, not a bug — leave it in with its justification either way"). This is not a stub in the plan's own deliverable — the gate script and its self-tests are fully functional and complete; only the future consumer file doesn't exist yet.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `scripts/check-pink-gate.sh` is live, gate-family-consistent, and proven both RED (on real pre-retint pink content) and clean-GREEN (on every currently-shipped asset) — ready for Plan 31-04's retint work to be checked against it, and for Plan 31-06's final regression re-run (GREEN post-retint, completing the RED-first/GREEN-after proof pair).
- The `assets/player-swamphunter.png` allowlist entry is pre-authored and will only become "live" once Plan 31-05 bakes that sprite; its actual live/dead status should be re-noted in that plan's own SUMMARY.md once the file exists.
- No blockers for Plan 31-04 (parallel, independent of this plan) or subsequent Wave 2/3 plans.

---
*Phase: 31-asset-bake-style-board-sign-off*
*Completed: 2026-07-10*

## Self-Check: PASSED
- FOUND: scripts/lib/pink_scan.py
- FOUND: scripts/check-pink-gate.sh
- FOUND: .planning/phases/31-asset-bake-style-board-sign-off/31-03-SUMMARY.md
- FOUND commit: 10eb0cc
