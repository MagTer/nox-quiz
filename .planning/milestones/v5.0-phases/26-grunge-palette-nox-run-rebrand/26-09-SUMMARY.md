---
phase: 26-grunge-palette-nox-run-rebrand
plan: 09
subsystem: core
tags: [rebrand, localStorage, save-key, string-sweep]

# Dependency graph
requires:
  - phase: 26-07
    provides: "baked Nox Run logo wired into title.js/select.js (config.js/main.js/title.js already touched, this plan's Task 1/2 layer their own edits on top)"
  - phase: 26-08
    provides: "scripts/screenshot-phase26.mjs with its own SAVE_KEY const, which this plan must also sync"
provides:
  - "src/index.html: zero 'Math Lab' occurrences, both <title> strings read 'Nox Run'"
  - "src/config.js: CONFIG.SAVE.KEY renamed to \"noxrun_platformer_v1\"; SAVE/TITLE comments rebranded without embedding the old key literal"
  - "src/progress.js: 6 console.warn dev tags rebranded [MathLab] -> [NoxRun]; the 2 allowlisted mathlab_save_* school-game comments preserved byte-identical"
  - "src/main.js, src/scenes/title.js: header/inline comments rebranded to Nox Run"
  - "scripts/check-progress.sh, scripts/browser-boot.mjs, scripts/audit-phase21-mechanics.mjs, scripts/screenshot-phase20.mjs, scripts/screenshot-phase26.mjs: all agree on the noxrun_platformer_v1 save-key literal"
affects: [26-10, 26-11, 28]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Comments that explain a superseded literal now describe it by role (\"the prior pre-rebrand v4.0 clean-reset key\") rather than quoting the exact old string, so a plan's own negative-literal verification grep (Pitfall A class) stays meaningful instead of self-defeating"

key-files:
  created: []
  modified:
    - src/index.html
    - src/config.js
    - src/progress.js
    - src/main.js
    - src/scenes/title.js
    - scripts/check-progress.sh
    - scripts/browser-boot.mjs
    - scripts/audit-phase21-mechanics.mjs
    - scripts/screenshot-phase20.mjs
    - scripts/screenshot-phase26.mjs

key-decisions:
  - "Reworded src/config.js's SAVE comment and scripts/check-progress.sh's grep-assertion comment to describe the old save key by role instead of quoting its exact literal — the plan's own Task 1 action text asked to quote the old literal in prose, but Task 3's verify greps scripts/ + src/config.js for zero occurrences of that exact string; the executable verify wins per the deviation-rule scope (a negative-literal check must not be defeated by its own explanatory prose)"

requirements-completed: [BRAND-02]

coverage:
  - id: D1
    description: "Zero 'Math Lab'/'mathlab' occurrences in src/index.html, src/config.js, src/progress.js, src/main.js, src/scenes/title.js, except the 2 explicitly allowlisted src/progress.js school-game comments"
    requirement: "BRAND-02"
    verification:
      - kind: unit
        ref: "grep -rni \"mathlab\" src/index.html src/config.js src/main.js src/scenes/title.js -> zero hits; grep -c \"\\[NoxRun\\]\" src/progress.js -> 6; grep -q \"mathlab_save\" src/progress.js -> present (allowlisted)"
        status: pass
    human_judgment: false
  - id: D2
    description: "localStorage save key renamed to noxrun_platformer_v1, consistently applied across config.js and all 5 scripts that hardcode the literal, in the same plan/commit set"
    requirement: "BRAND-02"
    verification:
      - kind: unit
        ref: "node --input-type=module -e checking CONFIG.SAVE.KEY === 'noxrun_platformer_v1'; grep -l 'noxrun_platformer_v1' across all 5 scripts -> 5/5; grep -rn 'mathlab_platformer_v2' scripts/ src/config.js -> zero hits"
        status: pass
      - kind: other
        ref: "bash scripts/check-progress.sh — save-key grep assertion at line 53 passes (script proceeds past it to the smoke-progress.mjs step); overall script FAILs on 3 pre-existing, out-of-scope level-01/03/04 geometry regression-pin assertions in smoke-progress.mjs unrelated to any file this plan touches (already logged in deferred-items.md by Plan 26-07)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No behavior regression from the string sweep + key rename"
    requirement: "BRAND-02"
    verification:
      - kind: other
        ref: "bash scripts/check-safety.sh -> PASS; node scripts/validate-levels.mjs -> PASS, zero HARD-FAIL across all 8 levels"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-07
status: complete
---

# Phase 26 Plan 09: Core src/ String Sweep + Save-Key Rename (BRAND-02) Summary

**Swept every "Math Lab"/"mathlab" occurrence out of the 5 core src/ runtime files (index.html, config.js, progress.js, main.js, title.js — preserving progress.js's 2 allowlisted school-game comments byte-identical) and renamed `CONFIG.SAVE.KEY` from `mathlab_platformer_v2` to `noxrun_platformer_v1`, syncing the new literal across all 5 scripts that hardcode it (check-progress.sh's grep assertion + 4 Playwright scripts' SAVE_KEY consts) in the same commit set, per 26-RESEARCH.md's Pitfall A.**

## Performance

- **Duration:** ~12 min of active task execution (3 auto tasks, no checkpoints)
- **Started:** 2026-07-07T21:17:00Z (approx)
- **Completed:** 2026-07-07T21:29:00Z (approx)
- **Tasks:** 3 (all auto, autonomous)
- **Files modified:** 10

## Accomplishments

- `src/index.html`: both `<title>` strings ("loading" and the `file://` guard's fallback) now read "Nox Run".
- `src/config.js`: `CONFIG.SAVE.KEY` renamed `"mathlab_platformer_v2"` → `"noxrun_platformer_v1"`; SAVE block comment rewritten to describe the Nox Run rebrand's clean-reset key, the orphaned-not-migrated prior key, and the cross-file agreement contract (check-progress.sh + 4 Playwright SAVE_KEY consts); TITLE block's stale "Math Lab" wordmark reference (already superseded by 26-07's logo sprite) rewritten to generic "old plain-text wordmark" prose.
- `src/progress.js`: all 6 `console.warn("[MathLab] ...")` dev-console tags rebranded to `[NoxRun]`; the 2 allowlisted `mathlab_save_*`/`mathlab_save_v1/v2` school-game comments (lines 28, 204) left byte-identical, verified via `grep -q "mathlab_save"` still matching.
- `src/main.js`: header comment ("Math Lab v3.0 game shell") and the logo-loading comment's stale `text("Math Lab")` reference both rebranded to Nox Run.
- `src/scenes/title.js`: header comment and JSDoc prose rebranded to Nox Run.
- `scripts/check-progress.sh`: save-key grep assertion pattern changed to `'noxrun_platformer_v1'`, fail message updated to reference the new key and Phase 26 rebrand (was Phase 13).
- `scripts/browser-boot.mjs`, `scripts/audit-phase21-mechanics.mjs`, `scripts/screenshot-phase20.mjs`, `scripts/screenshot-phase26.mjs`: each `const SAVE_KEY = "mathlab_platformer_v2";` changed to `"noxrun_platformer_v1"`.
- Verified zero remaining `mathlab_platformer_v2` literal anywhere in `scripts/` or `src/config.js` (including comments — see Deviations).

## Task Commits

Each task was committed atomically:

1. **Task 1: index.html + config.js sweep and save-key rename** - `22d2b94` (feat)
2. **Task 2: progress.js, main.js, title.js sweep** - `22b58da` (feat)
3. **Task 3: Sync the save-key literal across all 5 scripts** - `f750a4a` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `src/index.html` - both `<title>` strings rebranded to "Nox Run"
- `src/config.js` - `CONFIG.SAVE.KEY` = `"noxrun_platformer_v1"`; SAVE/TITLE comments rebranded
- `src/progress.js` - 6 `console.warn` tags `[MathLab]` → `[NoxRun]`; 2 allowlisted comments untouched
- `src/main.js` - header + logo-comment prose rebranded
- `src/scenes/title.js` - header + JSDoc prose rebranded
- `scripts/check-progress.sh` - save-key grep assertion + fail message updated
- `scripts/browser-boot.mjs` - `SAVE_KEY` const updated
- `scripts/audit-phase21-mechanics.mjs` - `SAVE_KEY` const updated
- `scripts/screenshot-phase20.mjs` - `SAVE_KEY` const updated
- `scripts/screenshot-phase26.mjs` - `SAVE_KEY` const updated

## Decisions Made
- **Reworded comments referencing the old save key to avoid quoting it literally.** Task 1's action text asked for the SAVE block comment to name the old key (`mathlab_platformer_v2`) explicitly in prose. Task 3's own `<verify>` then greps `scripts/` + `src/config.js` for zero occurrences of that exact literal — a stricter, executable requirement that a prose-only mention would fail. Resolved by describing the old key by role ("the prior pre-rebrand v4.0 clean-reset key") in both `src/config.js`'s SAVE comment and `scripts/check-progress.sh`'s grep-assertion comment, preserving the intent (documenting the orphaned-key decision) without defeating the plan's own negative-literal gate. This is exactly the class of self-consistency issue 26-RESEARCH.md's Pitfall A warns about — a stale/self-contradicting literal reference producing a misleading result, here caught before it caused a FAIL rather than after.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's own Task 1 prose conflicted with Task 3's verify (self-contradicting literal reference)**
- **Found during:** Task 3 (running its `<verify>` command)
- **Issue:** Task 1's action text instructed writing the old key literal (`mathlab_platformer_v2`) into `src/config.js`'s SAVE comment for documentation purposes. Task 3's `<verify>` then asserts `! grep -rn "mathlab_platformer_v2" scripts/ src/config.js` — a strict zero-occurrence check that included `src/config.js`, so the literal written by Task 1's own instructions would fail Task 3's gate. `scripts/check-progress.sh`'s own new comment (written fresh in Task 3) initially had the same self-defeating issue.
- **Fix:** Reworded both comments to describe the orphaned prior key by role instead of quoting its exact string, preserving the documentation intent while satisfying the executable verify.
- **Files modified:** `src/config.js`, `scripts/check-progress.sh`
- **Verification:** `grep -rn "mathlab_platformer_v2" scripts/ src/config.js` returns zero hits; both plan-required negative-literal grep and the intent-preserving prose coexist.
- **Committed in:** `22d2b94` (config.js's first pass), final wording landed in `f750a4a` (Task 3's commit, alongside the check-progress.sh fix)

---

**Total deviations:** 1 auto-fixed (Rule 1 — resolved a self-contradiction between the plan's own Task 1 prose instruction and Task 3's executable verify)
**Impact on plan:** Necessary to make Task 3's own stated gate pass without silently dropping the documentation the plan asked for. No scope creep — no files touched beyond the plan's own `files_modified` list.

## Issues Encountered

- **`bash scripts/check-progress.sh` fails on 3 pre-existing, out-of-scope smoke-progress.mjs assertions** (level-01/03/04 geometry regression-pins), unrelated to this plan. The save-key assertion itself (line 53, the one this plan touches) passes — confirmed because the script's `set -euo pipefail` + `fail()` (immediate `exit 1`) means reaching the later smoke-progress.mjs failure proves every earlier assertion, including the save-key grep, already passed. This is the identical issue Plan 26-07 already found and logged in `deferred-items.md` (unrelated level-geometry regression-pin staleness in `smoke-progress.mjs`, not caused by any file in this plan's `<files>` list). Not fixed here, per the Scope Boundary rule — this plan's files never included any level descriptor or `smoke-progress.mjs`.

## User Setup Required
None — no external service configuration required. Note for the user: this save-key rename intentionally orphans any pre-rebrand progress stored under the old `mathlab_platformer_v2` browser localStorage key — a fresh save starts on next play, exactly as confirmed acceptable in `26-CONTEXT.md`.

## Verification

- `grep -rni "mathlab" src/index.html src/config.js src/main.js src/scenes/title.js` — zero hits (core sweep clean)
- `grep -c "\[NoxRun\]" src/progress.js` — 6; `grep -q "mathlab_save" src/progress.js` — present (allowlist preserved)
- `node --input-type=module -e "..."` — `CONFIG.SAVE.KEY === 'noxrun_platformer_v1'` confirmed
- `grep -rn "mathlab_platformer_v2" scripts/ src/config.js` — zero hits; all 5 scripts confirmed to contain `noxrun_platformer_v1`
- `bash scripts/check-progress.sh` — save-key assertion (line 53) passes; script overall FAILs later on 3 pre-existing, unrelated smoke-progress.mjs level-geometry assertions (documented above, not this plan's scope)
- `bash scripts/check-safety.sh` — PASS
- `node scripts/validate-levels.mjs` — PASS, zero HARD-FAIL across all 8 levels

## Next Phase Readiness
- Core `src/` runtime carries zero "Math Lab" branding outside the allowlisted school-game comments; BRAND-02's core-code half is complete.
- `CONFIG.SAVE.KEY` (`noxrun_platformer_v1`) is the new single source of truth, consistently read by all 5 scripts that reference it.
- 26-10 (the docs/deploy/scripts-docstring half of BRAND-02) can proceed independently — this plan did not touch any of those files.
- The pre-existing smoke-progress.mjs geometry regression-pin failure (level-01/03/04) remains open, tracked in `deferred-items.md` since Plan 26-07; still not this plan's or 26-10's scope.

---
*Phase: 26-grunge-palette-nox-run-rebrand*
*Completed: 2026-07-07*

## Self-Check: PASSED

All 3 task commit hashes (22d2b94, 22b58da, f750a4a) found in git log. SUMMARY.md found on disk.
