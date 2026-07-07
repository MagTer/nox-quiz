---
phase: 25-levels-5-8-difficulty-ramp-select-grid
reviewed: 2026-07-07T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - scripts/audit-phase21-mechanics.mjs
  - scripts/browser-boot.mjs
  - scripts/check-import-safety.sh
  - scripts/check-progress.sh
  - scripts/lib/mechanic-drive.mjs
  - scripts/lib/route-planner.mjs
  - scripts/smoke-progress.mjs
  - src/config.js
  - src/levels/build.js
  - src/levels/index.js
  - src/levels/level-01.js
  - src/levels/level-02.js
  - src/levels/level-03.js
  - src/levels/level-04.js
  - src/levels/level-05.js
  - src/levels/level-06.js
  - src/levels/level-07.js
  - src/levels/level-08.js
  - src/math/brain.js
  - src/mechanics/secretAlcove.js
  - src/progress.js
  - src/scenes/game.js
  - src/scenes/select.js
findings:
  critical: 0
  warning: 6
  info: 1
  total: 7
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-07-07
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

This phase doubles the level roster (4 → 8 new descriptors as levels 5-8, plus
retrofitted `secretAlcove` data on levels 1-4), expands `src/scenes/select.js` to a
2×4 grid, and applies the one authorized LOCKED-brain diff (`src/math/brain.js`'s
multiplicand roll narrowed from 1-10 to 1-9). All four project verification gates
(`check-import-safety.sh`, `check-progress.sh`, `check-safety.sh`,
`validate-levels.mjs`) were re-run during this review and all PASS with zero
HARD-FAILs — no a727c13 violations, no timer/scheduler/punishment constructs, no
level graph is structurally unreachable. No hardcoded secrets, no `eval`/`innerHTML`,
no empty catch blocks, and no debug artifacts (`console.log`/`TODO`/`FIXME`) were
found in any reviewed source file.

No BLOCKER-tier defect (security vulnerability, crash, or data-loss risk) was found
in this diff. The issues below are all WARNING/INFO tier: a hardcoded grid-size
magic number that violates the project's own "all tunables live in config.js" rule,
a stale/incorrect level-08 comment paired with a checkpoint lead that's noticeably
thinner than the level's own stated convention, a docstring in the LOCKED math brain
that was not updated for this milestone's one authorized diff, a DRY violation in
`progress.js`, and — the most consequential item — the new `secretAlcove` mechanic
(shipped in all 8 levels) has zero automated reachability/trigger coverage in either
verification harness (`mechanic-drive.mjs` / `validate-levels.mjs`), unlike every
other mechanic type in the game.

## Warnings

### WR-01: secretAlcove mechanic has no automated reachability/trigger coverage

**File:** `scripts/lib/mechanic-drive.mjs:34-43`
**Issue:** `deriveEncounters()` — the single function both `scripts/browser-boot.mjs`
(the per-commit boot gate) and `scripts/audit-phase21-mechanics.mjs` (the full
interactive sweep CLAUDE.md cites as requiring `triggered: true` for "every
encounter") build their mechanic list from — only enumerates `doors`, `mathGates`,
`enemies`, and `collectZones`. It never reads `geometry.secretAlcove`. Confirmed by
grep: `secret-alcove`/`secretAlcove` does not appear anywhere under `scripts/`
except the file-existence loop in `check-import-safety.sh` and unrelated XP-math
comments in `smoke-progress.mjs`. `node scripts/validate-levels.mjs` (re-run during
this review) also prints zero `secretAlcove`-tagged rows for any of the 8 levels —
the static reachability validator doesn't model it either.

This means the mechanic added this phase — now present in all 8 shipped levels — is
verified only by whatever manual playtesting happened outside this repo's own
automated gates. A future edit to `build.js`'s alcove wiring, or a future level's
alcove placed at an unreachable position, would pass every existing script cleanly.
**Fix:** Add `secretAlcove` entries to `deriveEncounters()` (e.g.
`{ x: a.x, tag: "secret-alcove", renderChoices: false }`, mirroring the
`collectZones` no-challenge case) so both the boot gate and the full audit actually
approach and touch every alcove, and add an `secretAlcove`-aware reachability check
to `validate-levels.mjs`.

### WR-02: select.js hardcodes the grid column count as a magic `4`, bypassing config.js

**File:** `src/scenes/select.js:93,94,188,191,204,205,210,214,221,223`
**Issue:** CLAUDE.md's binding rule is explicit: "All tunables live in
`src/config.js` — no magic numbers in logic modules." `CONFIG.SELECT` already
externalizes `TILE_W`/`TILE_H`/`GAP`/`ROW_GAP`/`ROW_Y`/`START_X` for this exact
scene, but the grid's column count (4) — the single number that defines the whole
2×4 layout this phase introduces — is a bare literal repeated 10 times across tile
layout, row/col derivation, and both cursor-navigation functions
(`moveCursor`/`moveCursorRow`). `grep -n COLS src/config.js` returns nothing; no
config entry exists for it at all.
**Fix:** Add `COLS: 4` to `CONFIG.SELECT` and replace every `% 4` / `/ 4` literal in
`select.js` with `S.COLS`, so a future grid-width change (the file's own comment at
`config.js:248-252` already anticipates outgrowing 8 levels) is a one-line config
edit instead of a 10-site find/replace.

### WR-03: level-08's checkpoint-before-collectZone comment is wrong and the actual lead is far thinner than the level's own stated convention

**File:** `src/levels/level-08.js:95,126`
**Issue:** The checkpoints block's header comment states the design invariant for
this file: "one 64-80px before EVERY hazard/mechanic" — and every other checkpoint
in this level (door@700→630, spike@850→780, mathGate@1300→1230, spike@1450→1380,
enemy@1600→1530, mathGate@2050→1980, spike@2200→2130, climb-entry@2410→2340) holds
exactly a 70px lead. The collect-zone checkpoint is annotated
`{ x: 130, ... }, // before collectZone@200 (lead 70)`, but the actual
`collectZones` entry is `{ x: 150, ... }` (line 126) — not 200. The real lead is
`150 - 130 = 20px`, not 70, and the "@200" in the comment does not match any
geometry value in this file. This reads as a stale copy-paste from `level-06.js`
(whose own collect zone genuinely sits at `x: 200` with a matching 70px lead) that
was never updated when level-08's zone was authored at `x: 150`.
**Fix:** Either move the checkpoint to `x: 80` (restoring the documented 70px lead)
or, if 20px is intentionally sufficient here, correct the comment to say
`before collectZone@150 (lead 20)` so it no longer misdescribes the geometry.

### WR-04: brain.js's docstring/comments still describe the pre-MATH-02 multiplicand range

**File:** `src/math/brain.js:54-55,224`
**Issue:** This milestone's one authorized diff to the LOCKED brain narrowed the
multiplicand roll from `Math.floor(Math.random() * 10) + 1` (1-10) to
`Math.floor(Math.random() * 9) + 1` (1-9) — confirmed live at line 247 and enforced
by `check-progress.sh`'s MATH-02 grep (re-run, PASSES). However, the public
docstring at the top of `createBrain()` still reads `` `b`=multiplicand (1..10)``
(line 54-55), and the inline comment on `generateDistractors`'s last-resort pad
still says "should be unreachable for multiplicand 1–10 range" (line 224). Both are
now factually wrong statements about this file's own behavior, on a module the
project explicitly treats as a locked, documentation-is-the-contract surface.
**Fix:** Update both comments to `1..9` to match the shipped roll.

### WR-05: progress.js duplicates the entire level-up carry-over loop between addXp and addBonusXp

**File:** `src/progress.js:143-170`
**Issue:** `addXp(table)` and `addBonusXp(amount)` (added this phase for the
secret-alcove reward) are byte-identical after their first line: both run
`let leveledUp = false; while (xp >= threshold(level)) { xp -= threshold(level); level += 1; leveledUp = true; } return leveledUp;`.
The header comment justifies why a *separate method* is needed (no `table` value
maps to a flat 5 XP amount) but does not justify duplicating the loop *body* itself
— the surplus-carry-over logic is exactly the kind of business rule ("never reset to
0, carry the surplus") the file's own comments call out as deliberate and
non-obvious, which makes divergence between the two copies a real risk if it's ever
retuned.
**Fix:** Factor the shared loop into one private closure helper, e.g.
`function awardAndCarry(delta) { xp += delta; let leveledUp = false; while (...) {...} return leveledUp; }`,
and have both `addXp` and `addBonusXp` call it with their respective XP delta.

### WR-06: level-01's secretAlcove retrofit and the other levels' alcoves are exercised by nothing in this repo's own verification suite (see WR-01) beyond static geometry review

**File:** `src/levels/level-01.js:156-158` (and the equivalent block in every other
`level-0N.js`)
**Issue:** This is the content-side half of WR-01: every one of the 8 levels'
`secretAlcove` coordinates was placed and reasoned about only in prose comments
("a short extra hop UP from the gap-1 stepping-stone platform... not signposted, not
gating") with no automated reachability proof backing that reasoning (the reviewer
manually cross-checked each alcove's rise/x-span against its launch platform and
found no obviously-broken placement, but "obviously not broken by inspection" is not
the interactive-proof standard CLAUDE.md itself sets: "Checks that don't play the
game lie.").
**Fix:** Once WR-01's harness coverage lands, this resolves automatically — no
additional geometry change is implied by this finding on its own.

## Info

### IN-01: build.js repeats the identical apex-blocker-height formula three times

**File:** `src/levels/build.js:164,205,243`
**Issue:** The door/math-gate/enemy blocker builders each independently compute
`Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 64` inline. This is
pre-existing (not introduced this phase) but the file is in full scope for this
review; three copies of a physics-derived magic formula is a minor
find-one-fix-three-by-hand risk if `CONFIG.JUMP_FORCE`/`CONFIG.GRAVITY` are ever
retuned and the `+ 64` margin needs to move with them.
**Fix:** Extract `function apexBlockerHeight() { return Math.ceil((CONFIG.JUMP_FORCE ** 2) / (2 * CONFIG.GRAVITY)) + 64; }`
once near the top of `buildLevel` and call it from all three sites.

---

_Reviewed: 2026-07-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
