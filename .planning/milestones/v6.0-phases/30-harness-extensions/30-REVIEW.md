---
phase: 30-harness-extensions
reviewed: 2026-07-10T12:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - docs/LEVEL-DESIGN.md
  - scripts/browser-boot.mjs
  - scripts/fixtures/bad-level.js
  - scripts/fixtures/bad-level-mover.js
  - scripts/lib/audit-retry.mjs
  - scripts/lib/mechanic-drive.mjs
  - scripts/lib/reachability.mjs
  - scripts/lib/route-planner.mjs
  - src/progress.js
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 30: Code Review Report (iteration 3 — final)

**Reviewed:** 2026-07-10
**Depth:** standard
**Files Reviewed:** 9
**Status:** clean

## Summary

This is the third and final review pass for Phase 30 (harness extensions; 3-iteration
cap). Iteration 1 found and fixed CR-01 (original), WR-01, WR-02, WR-03. Iteration 2
found a residual bug in the CR-01 fix (`localStorage` cleared *after* `reloadLevel()`
instead of before, poisoning even-numbered retry attempts) plus WR-04 (`predictAward`
math hand-duplicated between `src/progress.js` and `scripts/lib/mechanic-drive.mjs`, a
drift risk). This review verifies both of iteration 2's fixes (`adf18b4`, `f832399`)
against the exact concerns raised, and re-scans the full file set for anything a fresh
look surfaces. **No new Critical or Warning findings.**

### (1) `src/progress.js` production-code safety — verified as a pure refactor

Read the file's own header (the XP amounts/curve are explicitly "the validated values
and MUST NOT be re-tuned") and traced `f832399`'s diff (`git show f832399 --
src/progress.js`) line-by-line against the prior version:

- `threshold(lvl)` was lifted verbatim from a closure-local `const threshold = (lvl) =>
  ...` inside `createProgress()` to a module-level `export function threshold(lvl)`,
  with an **identical body** (`Math.round(CONFIG.PROGRESS.BASE_XP *
  Math.pow(CONFIG.PROGRESS.LEVEL_MULT, lvl - 1))`) reading the same `CONFIG` constants.
  The old closure version captured no per-instance state, so lifting it to module scope
  changes nothing observable.
- The old `awardAndCarry(delta)` closure inlined the carry-over while-loop directly
  against the closure's own `xp`/`level` variables. The new `awardAndCarry(delta)` calls
  `predictAward({ xp, level }, delta)` and reassigns `xp`/`level` from the result. The
  extracted `predictAward` reproduces the **exact same while-loop**
  (`while (xp >= threshold(level)) { xp -= threshold(level); level += 1; leveledUp =
  true; }`), with `xp -= threshold` (not reset to 0) preserved verbatim.
- `predictAward`'s input-validation guards on `state.xp`/`state.level` (finite,
  non-negative, floored) are structurally identical to `createProgress`'s own seed
  guards. Since `xp`/`level` inside the closure are *already* valid per those same
  invariants at every call site, round-tripping them through `predictAward`'s guards is
  a no-op — they pass through unchanged.
- `serialize()`/`validate()`/`loadSave()`/`writeSave()`/`resetSave()` are untouched by
  `f832399` — the diff is scoped entirely to the threshold/predictAward extraction.
- Both existing call sites (`addXp` → `awardAndCarry(calculateXp(table))`, `addBonusXp`
  → `awardAndCarry(amount)`) are unmodified and still route through the same shared
  helper, now backed by `predictAward`, so `createProgress()`'s own internal callers and
  `predictAward`'s new external caller can never diverge (the fix's stated goal).
- Ran `node scripts/smoke-progress.mjs` (the project's real unit-test layer for this
  exact math — `threshold(1)===200`, `threshold(2)===260`, exact-crossing surplus-0,
  overshoot-carry-over-20, and the XP_ALCOVE regression pin): **PASS**. Also ran `bash
  scripts/check-progress.sh`: **PASS**.

No behavioral drift found — this is a genuine pure refactor, not a re-tune.

### (2) CR-01 residual fix soundness — verified sound, no race

Traced the reordered code in `scripts/lib/audit-retry.mjs` (`attempt > 1` branch)
against the actual call chain, rather than trusting the fix's own comments:

- `page.evaluate(...)` is `await`ed and only resolves after the browser-side function (a
  synchronous `try { JSON.parse → delete → JSON.stringify → setItem } catch {}` body)
  has fully completed and Playwright has serialized the result back — there is no
  intermediate window in which `reloadLevel()` could fire before the clear lands. Since
  `reloadLevel()` is only called in the next statement (`await reloadLevel();`), the
  clear is guaranteed to have completed in `localStorage` before any subsequent read.
- Read `src/scenes/game.js` directly: `gameScene(data)` calls `const saved =
  loadSave(); const progress = createProgress(saved);` at lines 80-81, synchronously at
  scene construction — exactly as the fix's own comment claims. `createProgress()`
  snapshots `saved.levels[id].secretFound` into a closure-local map once and never
  re-reads `localStorage` afterward (confirmed in `src/progress.js` lines 141-152).
- Confirmed `reloadLevel()`'s actual implementation
  (`scripts/audit-phase21-mechanics.mjs` lines 216-233): Escape → reposition cursor →
  Enter → settle. Checked whether Escape's handler (`src/scenes/game.js:292`,
  `onKeyPress("escape", () => go("select"))`) performs any intervening `writeSave()`
  that could re-persist the (already-cleared) blob and thereby restore poisoned data
  before the new scene reads it — it does not; the code's own comment ("NAV-03, which
  does not otherwise save") is accurate, and `onHide`'s save-on-hide is gated on
  document-visibility change, not scene navigation, so it never fires here. No
  intervening write undoes the clear.
- Confirmed the clear only runs for `attempt > 1` — attempt 1 is untouched by the
  patch, and the seed `SAVE_BLOB` used by both callers never pre-sets `secretFound` for
  any level, so attempt 1's behavior is provably unchanged.
- On the question of whether clearing before *every* retry (not just even-numbered
  ones) introduces a *new* side effect: no. `driveAndDetectAlcove`'s `alreadyFoundBefore`
  read (its own defensive sanity signal) now correctly reads `false` on every retry
  attempt instead of only every other one — this is the intended fix, not an
  unintended side effect, and it strictly restores (never weakens) the "every attempt
  starts unseeded for this fact" invariant the module's own header documents.
- The clear is scoped to exactly one field (`delete blob.levels[levelId].secretFound`)
  of exactly one level id — `cleared`, `xp`, `level`, `accuracy`, `history`, and every
  other level's data are untouched, matching the header's documented scope claim. A
  missing/malformed blob (`JSON.parse(null)` → `null`, or a level id absent from
  `blob.levels`) is handled by the `blob?.levels?.[levelId]` optional-chain guard —
  no throw, no partial write.

No race and no unintended side effect found. The fix is sound.

### (3) General residue check

Re-read `scripts/lib/mechanic-drive.mjs`, `scripts/lib/reachability.mjs`,
`scripts/lib/route-planner.mjs`, `scripts/browser-boot.mjs`,
`scripts/fixtures/bad-level.js`, `scripts/fixtures/bad-level-mover.js`, and
`docs/LEVEL-DESIGN.md` for anything a fresh pass surfaces (secrets, dangerous
functions, debug artifacts, empty catches, unhandled edge cases, dead code):

- No hardcoded secrets, `eval`, `innerHTML`, or empty catch blocks in any reviewed file.
- The only `console.log` calls found are legitimate self-test/harness PASS output
  (`reachability.mjs`, `route-planner.mjs`, `browser-boot.mjs`), not debug leftovers.
- `driveAndDetectAlcove`'s `predictAward(beforeBlob, CONFIG.PROGRESS.XP_ALCOVE)` call
  correctly handles `beforeBlob === null` (fresh/no-save state) via `predictAward`'s own
  `state && ...` guard, defaulting to `xp:0, level:1` — matches the real game's
  `loadSave()` defaults, so the oracle and the real save start from the same baseline.
  Confirmed `src/mechanics/secretAlcove.js` calls its `save` callback
  (`writeSave(...)`) **synchronously right after** `markSecretFound` (not deferred to
  level-clear/tab-hide), so `afterBlob` genuinely reflects the fresh touch rather than
  stale pre-touch data — this is a prerequisite for `driveAndDetectAlcove`'s
  before/after comparison to be meaningful at all, and it holds.
- All XP constants (`XP_EASY:10`, `XP_HARD:20`, `XP_ALCOVE:5`, `BASE_XP:200`) are
  integers and `threshold()` always returns `Math.round(...)` (an integer), so the
  strict `===` equality checks in `driveAndDetectAlcove`'s `freshAwardCorrect` and
  `smoke-progress.mjs`'s assertions carry no floating-point-equality risk.
- Ran the full harness suite live: `node scripts/smoke-progress.mjs`,
  `node scripts/lib/reachability.mjs` (self-test), `node scripts/lib/route-planner.mjs`
  (self-test), `bash scripts/check-progress.sh`, `bash scripts/check-safety.sh`,
  `bash scripts/check-import-safety.sh`, and `node scripts/validate-levels.mjs`
  (including both `--fixture` runs against `bad-level.js` and `bad-level-mover.js`,
  confirming both still correctly HARD-FAIL RED, and the 8 shipped levels still PASS).
  All passed / behaved as documented.
- `docs/LEVEL-DESIGN.md` and both fixture files are documentation/calibration-only
  content with no executable logic beyond descriptor literals — nothing to flag.

## Structural Findings (fallow)

None provided for this review (no `<structural_findings>` block was supplied).

## Narrative Findings (AI reviewer)

No Critical or Warning findings. Both of iteration 2's fixes (`adf18b4` CR-01 residual,
`f832399` WR-04 `predictAward` extraction) were traced against real code and confirmed
against live test output rather than taken on faith, and hold up under adversarial
scrutiny — no residual defects found in this final pass. This closes the 3-iteration
fix loop for Phase 30.

---

_Reviewed: 2026-07-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
