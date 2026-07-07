---
phase: 25-levels-5-8-difficulty-ramp-select-grid
fixed_at: 2026-07-07T16:09:51Z
review_path: .planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 4
skipped: 2
status: partial
---

# Phase 25: Code Review Fix Report

**Fixed at:** 2026-07-07T16:09:51Z
**Source review:** .planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (critical_warning): 6 (WR-01 through WR-06; IN-01 excluded per fix_scope)
- Fixed: 4
- Skipped: 2

All four project verification gates (`check-gate.sh`, `check-safety.sh`,
`check-import-safety.sh`, `check-progress.sh`) and `validate-levels.mjs` were re-run
after every individual fix and again after all fixes were applied — all PASS with
zero HARD-FAIL.

## Fixed Issues

### WR-02: select.js hardcodes the grid column count as a magic `4`, bypassing config.js

**Files modified:** `src/config.js`, `src/scenes/select.js`
**Commit:** 8f583b6
**Applied fix:** Added `COLS: 4` to `CONFIG.SELECT` in `src/config.js`. Replaced all 10
bare `4` literals in `src/scenes/select.js` (tile col/row derivation at lines 93-94,
and both `moveCursor`/`moveCursorRow` cursor-navigation functions) with `S.COLS`.
Verified via `grep` that no `% 4` / `/ 4` grid-math literal remains in the file.

### WR-03: level-08's checkpoint-before-collectZone comment is wrong and the actual lead is far thinner than the level's own stated convention

**Files modified:** `src/levels/level-08.js`
**Commit:** 7a7d774
**Applied fix:** Chose the comment-correction option (over moving the checkpoint to
x:80) because moving it would place the collect-zone checkpoint BEFORE the level's
"start" checkpoint (x:96), reversing the checkpoints array's ascending-x order and
introducing an un-reviewed gameplay change with no automated gate covering
checkpoint ordering. Corrected the stale comment from `before collectZone@200 (lead
70)` to `before collectZone@150 (lead 20)`, matching the actual `collectZones` entry
at line 126 (`x: 150`). `node scripts/validate-levels.mjs` re-run: zero HARD-FAIL,
identical PASS/WARN row set for level-08 before and after.

### WR-04: brain.js's docstring/comments still describe the pre-MATH-02 multiplicand range

**Files modified:** `src/math/brain.js`
**Commit:** 5b40bba
**Applied fix:** Updated the `createBrain()` docstring (`` `b`=multiplicand (1..10)``
-> `(1..9)`) and the `generateDistractors` last-resort-pad inline comment ("1–10
range" -> "1–9 range") to match the shipped `Math.floor(Math.random() * 9) + 1` roll.
`git diff` confirmed after the edit that ONLY comment/docstring lines changed — no
executable line in this LOCKED file was touched.

### WR-05: progress.js duplicates the entire level-up carry-over loop between addXp and addBonusXp

**Files modified:** `src/progress.js`
**Commit:** 9933b5c
**Applied fix:** Factored the shared `xp += delta; while (xp >= threshold(level)) {...}`
body into one closure-local helper, `awardAndCarry(delta)`, declared inside
`createProgress()` alongside `calculateXp`. Both `addXp(table)` and
`addBonusXp(amount)` now call `awardAndCarry()` with their respective delta. The
carry-over semantics (`xp -= threshold`, never reset to 0) are byte-identical to the
pre-fix duplicated bodies. `bash scripts/check-progress.sh` (which runs
`smoke-progress.mjs`) was re-run after the change and PASSES, confirming XP/level-up
behavior is unchanged.

## Skipped Issues

### WR-01: secretAlcove mechanic has no automated reachability/trigger coverage

**File:** `scripts/lib/mechanic-drive.mjs:34-43`
**Reason:** Skipped — recommend follow-up. Investigated adding `secretAlcove`
entries to `deriveEncounters()` per the review's suggested
`{ x: a.x, tag: "secret-alcove", renderChoices: false }` shape. This is unsafe to
apply mechanically: every existing `renderChoices:false` case (`collectZones`) still
ultimately opens the shared challenge panel, and the harness's `triggered` flag in
both `scripts/audit-phase21-mechanics.mjs` and `scripts/browser-boot.mjs` is defined
purely as "the live `get("challenge").length` rose above baseline"
(`resolveIfBoxed`/`driveToXPlanned` in `mechanic-drive.mjs`). `src/mechanics/secretAlcove.js`
is explicitly documented as NEVER opening a challenge (silent, walk-through-only XP
bonus — "CRITICAL CONTRACT: this never opens the shared math-challenge UI"). Naively
wiring it into `deriveEncounters()` with the suggested shape would make `triggered`
permanently false for every alcove, which would either (a) fail the
`audit-phase21-mechanics.mjs` `triggered: true` invariant CLAUDE.md itself cites for
every encounter, or (b) require adding an entirely new, untested detection path
(e.g. polling `progress`/HUD XP state or the alcove object's `destroy()`) into
shared infrastructure consumed by both the per-commit boot gate and the full
interactive audit — a materially larger and riskier change than a targeted fix. Left
unfixed rather than forcing a change that could produce false negatives (silently
reporting `triggered:false` for a mechanic that actually works) in the project's own
gating scripts.

### WR-06: level-01's secretAlcove retrofit and the other levels' alcoves are exercised by nothing in this repo's own verification suite (see WR-01) beyond static geometry review

**File:** `src/levels/level-01.js:156-158` (and the equivalent block in every other
`level-0N.js`)
**Reason:** Skipped — recommend follow-up. This finding is explicitly the "resolves
automatically once WR-01's harness coverage lands" case per the review's own Fix
note; no independent action applies here without WR-01 landing first. Additionally
investigated the `validate-levels.mjs`/`reachability.mjs` side directly: its
`mechanic-reachability` check requires a barrier's x-span to be "fully supported by
a single **floor run**" (`nodeContaining(floorNodes, e.x)`), but secret alcoves are
placed in open space relative to a launch **platform** (per level-01's own comment:
"a short extra hop UP from the gap-1 stepping-stone platform"), with no floor-run
association and no explicit "launch platform" field in any level descriptor's data
model — that association exists only in per-level prose comments today. Modeling
alcove reachability correctly would require either a new point-vs-jumpReach
algorithm (distinct from the existing span-containment check used for doors/gates/
enemies/collectZones) or a level-descriptor schema change adding an explicit launch-
node reference to all 8 already-placed, human-partially-verified alcoves. Given the
uncertainty in getting this reachability model right on the first pass and the risk
of producing false HARD-FAILs against already-shipped, playtested content, this was
left for a dedicated follow-up rather than forced into this fix pass.

---

_Fixed: 2026-07-07T16:09:51Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
