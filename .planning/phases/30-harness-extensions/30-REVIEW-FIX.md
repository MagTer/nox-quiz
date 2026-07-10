---
phase: 30-harness-extensions
fixed_at: 2026-07-10T09:34:18Z
review_path: .planning/phases/30-harness-extensions/30-REVIEW.md
iteration: 2
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 30: Code Review Fix Report

**Fixed at:** 2026-07-10T09:34:18Z
**Source review:** .planning/phases/30-harness-extensions/30-REVIEW.md
**Iteration:** 2

**Summary:**
- Findings in scope: 2 (CR-01 residual, WR-04 — `critical_warning` scope)
- Fixed: 2
- Skipped: 0

This is iteration 2, addressing the re-review's findings against iteration 1's fix commits (`11cbdd1`, `deb05c1`, `7f06b78`, `0592444`). Iteration 1's REVIEW-FIX.md is preserved in git history (superseded by this file — see `git log -- .planning/phases/30-harness-extensions/30-REVIEW-FIX.md`).

## Fixed Issues

### CR-01: CR-01's own `localStorage` clear ran too late to un-poison the retry attempt it was meant to fix

**Files modified:** `scripts/lib/audit-retry.mjs`
**Commit:** `adf18b4`
**Applied fix:** Reordered the two steps inside `auditLevelWithRetries`'s per-attempt block so the `secretFound` `localStorage` clear-patch runs **before** `reloadLevel()`, not after. Root cause confirmed by reading the full call chain: `reloadLevel()`'s `Enter` press synchronously triggers `src/scenes/select.js:275`'s `go("game", { levelId })` → `src/scenes/game.js:80-81`'s `createProgress(loadSave())`, which is a **pure, one-shot snapshot** of `localStorage` taken at that exact instant (`src/progress.js:59-99`) and never re-read afterward. `src/mechanics/secretAlcove.js`'s `onCollide` handler branches on that frozen in-memory `progress.hasSecretFound(levelId)` (`src/progress.js:164-166`), never on live storage. With the old (iteration-1) ordering, the clear ran *after* the new scene's snapshot was already taken from the stale, still-poisoned value — silently forcing every even-numbered retry attempt onto the "already found, zero-delta" no-op replay branch regardless of whether the real award mechanism was broken. Moving the clear before `reloadLevel()` is safe because it operates on `localStorage` directly (never a live scene object) — it only needs to land before the *next* scene's `loadSave()` call, and running it while the previous attempt's scene is still active is harmless.

**Verification (beyond the standard 3-tier check):** Per this finding's explicit re-review brief, built an executable before/after proof at `scratchpad/cr01-residual-verify.mjs` that models the exact race the mock-based iteration-1 proof (`scratchpad/cr01-verify.mjs`) could not — a `reloadLevel()` mock that snapshots `secretFound` from `localStorage` **once, synchronously**, mirroring `createProgress()`'s real one-shot-at-construction contract, with the touch handler branching on that frozen snapshot rather than live storage.
- Run against the pre-fix (iteration-1) `audit-retry.mjs`: per-attempt snapshot-at-touch sequence was `[false, true, false, true, false]` — attempts 2 and 4 were confirmed poisoned no-ops, exactly matching the review's predicted "even-numbered attempts are guaranteed no-ops" defect, for a scenario that simulates a persistent (every-touch) XP-award regression.
- Run against the fixed `audit-retry.mjs`: per-attempt sequence is `[false, false, false, false, false]` — all 5 attempts are now genuine, unseeded re-tests of the award path. The persistent-regression scenario still correctly resolves `false` (no false-pass reopened) and spends the full 5-attempt budget. The healthy-award control case is unchanged (`resolved: true`, `attempts: 1`).
- Full verification suite additionally re-run end-to-end afterward (see below) — `node scripts/audit-phase21-mechanics.mjs` against all 8 real shipped levels reports `AUDIT: ALL MECHANICS RESOLVED` with every encounter (including every level's secret alcove) resolving on `attempts: 1`, confirming no regression against real content.

### WR-04: `predictAward` in `mechanic-drive.mjs` was a hand-duplicated, unexported, untested reimplementation of `progress.js`'s `awardAndCarry`

**Files modified:** `src/progress.js`, `scripts/lib/mechanic-drive.mjs`
**Commit:** `f832399`
**Applied fix:** Applied option (a) from the review — the cleaner extraction, since `src/progress.js`'s own header explicitly documents itself as import-nothing/engine-free (firewall #2), so exporting a pure function does not violate the a727c13 firewall or any "LOCKED math" convention (the header's "MUST NOT be re-tuned" warning is about the XP *values*/curve *numbers*, not about refactoring the calculation into an exported function — the formula itself is preserved byte-for-byte).
- Exported `threshold(lvl)` and a new pure `predictAward(state, delta)` from `src/progress.js` as the module's single source of truth for the XP-award threshold/carry-over math.
- `createProgress()`'s internal `awardAndCarry` closure now **delegates to** the exported `predictAward` instead of re-deriving the while-loop locally, so the real game's live progression tracker and any external caller are provably backed by the identical code path (not just identical-looking duplicated code).
- `scripts/lib/mechanic-drive.mjs`'s `driveAndDetectAlcove` now imports `predictAward` from `src/progress.js` directly and removed its hand-duplicated local `threshold`/`predictAward` definitions entirely.

**Verification (beyond the standard 3-tier check):** Ran a direct equivalence check comparing a live `createProgress().addBonusXp()` call against the exported `predictAward()` for the same seed across 6 levels x 11 xp seeds (66 combinations spanning multiple level-up boundaries) — all matched exactly (`xp`, `level`, and `leveledUp`), confirming the two code paths can no longer silently diverge (they are now literally the same function, not two independently-maintained copies). Also re-ran the CR-01 residual proof (`scratchpad/cr01-residual-verify.mjs`) after this change to confirm `driveAndDetectAlcove`'s behavior is unaffected by switching its internals to the imported function.

## Post-Fix Verification Suite

All gates run against the fixed worktree, in the order requested:

- `bash scripts/check-gate.sh` — PASS
- `bash scripts/check-safety.sh` — PASS
- `bash scripts/check-import-safety.sh` — PASS (re-checked after `src/progress.js` changed — no top-level engine-global refs introduced)
- `bash scripts/check-progress.sh` — PASS (includes `smoke-progress.mjs`, which exercises `createProgress`'s XP/level math headlessly)
- `node scripts/validate-levels.mjs` — PASS, zero HARD-FAIL across all 8 real levels + both RED-first fixtures (`bad-level.js`, `bad-level-mover.js`); only informational WARNs (expected, unrelated to this fix)
- `node scripts/browser-boot.mjs` — PASS — title → select → all levels loaded with no runtime errors
- `node scripts/audit-phase21-mechanics.mjs` — PASS — `AUDIT: ALL MECHANICS RESOLVED` across all 8 levels; every encounter (door/math-gate/enemy/secret-alcove) triggered and resolved on `attempts: 1`, confirming the CR-01 residual fix introduced no regression against real, already-correct content

## Skipped Issues

None — both in-scope findings were fixed.

---

_Fixed: 2026-07-10T09:34:18Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 2_
