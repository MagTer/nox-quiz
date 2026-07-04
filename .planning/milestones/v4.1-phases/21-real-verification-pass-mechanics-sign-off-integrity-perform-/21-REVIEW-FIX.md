---
phase: 21-real-verification-pass-mechanics-sign-off-integrity-perform-
fixed_at: 2026-07-04T15:45:00Z
review_path: .planning/phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/21-REVIEW.md
iteration: 3
findings_in_scope: 6
fixed: 4
skipped: 2
status: partial
---

# Phase 21: Code Review Fix Report

**Fixed at:** 2026-07-04T15:45:00Z
**Source review:** .planning/phases/21-real-verification-pass-mechanics-sign-off-integrity-perform-/21-REVIEW.md
**Iteration:** 3 (final — max 3 --auto iterations)

**Summary:**
- Findings in scope (critical + warning): 6
- Fixed: 4
- Skipped: 2

## Fixed Issues

### CR-01: "Challenge resolved" detection is an absolute zero-count, broken whenever a prior challenge is deliberately left open

**Files modified:** `scripts/browser-boot.mjs`, `scripts/audit-phase21-mechanics.mjs`
**Commit:** b6d3e32
**Applied fix:** Replaced the absolute `get("challenge").length === 0` check with a baseline-capture-then-decrease check in both scripts, exactly mirroring `driveToX`'s existing `baseline`/`>` pattern (the review's own prescribed fix). `audit-phase21-mechanics.mjs`'s `resolveIfBoxed` now captures `initial` before cycling keys 1-4 and returns `resolved: true` only when the live count drops `< initial`. `browser-boot.mjs`'s inline math-gate loop got the identical treatment (`initialChallengeCount` captured before the cycle, `remaining < initialChallengeCount` to detect resolution).

**Empirical verification (not just static review):**
- Before fix: `node scripts/browser-boot.mjs` exited 1 with `"math-gate at x:600 never resolved after cycling keys 1-4"` (confirmed reproduced before editing).
- After fix: `node scripts/browser-boot.mjs` exits 0 — `"Browser boot: PASS — title -> select -> all levels loaded with no runtime errors."` — run 3 times across this session, including after the CR-02/WR-02/WR-04 fixes landed on top, with no regression.
- `node scripts/audit-phase21-mechanics.mjs`: level-01 math-gate x:600, level-02 math-gate x:420, level-03 math-gate x:420, and level-04 math-gate x:320 all now correctly report `triggered:true, resolved:true` (previously `resolved:false` for all four, per the review's own repro).

### CR-02: Checkpoint math-gates and enemy encounters have no anti-jump-over blocker — a player can clear them without answering

**Files modified:** `src/levels/build.js`, `src/mechanics/gates.js`, `src/mechanics/enemy.js`
**Commit:** 38b24e4
**Applied fix:** Gave math-gates and enemy encounters the same apex-derived tall invisible blocker pattern doors already use (`blockerH = ceil(JUMP_FORCE² / (2·GRAVITY)) + 64`), splitting each into an invisible solid blocker (carrying the collision tag `gates.js`/`enemy.js` listen for) plus a separate non-colliding cosmetic panel — mirroring the door's `blocker`/`panel`/`glyph` split exactly. Per the fixer's explicit priority instructions this was applied to BOTH math-gates and enemies (not just math-gates as the review's illustrative snippet showed). Updated `gates.js`'s and `enemy.js`'s `onSuccess` handlers to also destroy the new `panelObj` alongside the collider and glyph (needed once the visible panel became a separate object with no collider of its own — omitting this would have left an orphaned, collider-less visible panel on screen after a correct answer).

**Empirical verification (not just static review):** wrote a one-off Playwright probe (not part of the shipped scripts) that: (1) read `get("math-gate")[0].height` in-browser on level-02 and confirmed it is now `161` (matching the apex+margin formula) with `panelObj`/`glyphObj` both present; (2) drove the player with a full running jump directly at the level-02 math-gate (x:420) the way a player exploiting the bug would, and confirmed the player's x position stayed at `404` (did not sail past the gate to 452+) with a challenge now open (`challengeCount: 12`) — i.e., the jump-over exploit no longer works. Repeated the collider-height check for the level-01 enemy at x:1000 (`height: 161`, `panelObj`/`glyphObj` present). Re-ran `node scripts/browser-boot.mjs` after this change (exit 0, no regression) to confirm normal walk-up-and-answer play is unaffected.

### WR-02: `browser-boot.mjs`'s save blob is still hardcoded, unlike its sibling script's fixed version

**Files modified:** `scripts/browser-boot.mjs`
**Commit:** 4abf906
**Applied fix:** Imported `LEVEL_ORDER` from `../src/levels/index.js` and derived both `SAVE_BLOB.levels` (`Object.fromEntries(LEVEL_ORDER.slice(0, -1).map(...))`) and the level-visiting loop array (`const levels = LEVEL_ORDER`) from it, matching `audit-phase21-mechanics.mjs`'s existing fixed pattern exactly. Verified with `node -c` and a full `node scripts/browser-boot.mjs` run (exit 0).

### WR-04: `driveToX`'s per-gap jump model presses Space at most once per floor-to-floor gap, with no documented margin or assertion

**Files modified:** `scripts/audit-phase21-mechanics.mjs`
**Commit:** 33fd7ed
**Applied fix:** Added `assertGapsAreSingleJumpable(levelId, gapRanges)`, run for every level at true script startup (before the browser even launches — pure `level.geometry` data, no page dependency), computing the single-jump horizontal travel distance from live `CONFIG.RUN_SPEED`/`JUMP_FORCE`/`GRAVITY` and flagging any gap at or beyond it.

**Deviation from the review's literal fix suggestion, with reasoning:** the review said "so a future gap/tuning change fails loudly here" — I implemented this as a hard `throw` initially, matching that literally. Running the script then revealed the assumption is **already** violated today, not just hypothetically in the future: level-02's gap (`[520,700)`, 180px) and level-04's gap (`[1760,1960)`, 200px) both already exceed the ~178.3px single-jump distance at current tuning. A hard throw there crashed the entire diagnostic script (`exit 1`), which directly contradicts the script's own documented header contract ("This script always exits 0 — it is a diagnostic tool... not a pass/fail commit gate"). I changed the assertion to a loud, non-fatal `console.error` instead, so the two real violations are now surfaced immediately and unambiguously at the top of every run's output (rather than the previous confusing, unattributed "mechanic unreachable" logs downstream) while the script still completes and exits 0 as designed. Verified via three full runs of `node scripts/audit-phase21-mechanics.mjs` (before/during/after this specific change) — the tool completes each time with exit 0 and now prints the two `WR-04 WARNING:` lines up front.

**Note for follow-up (not a regression I introduced):** across all runs performed this session (before and after every fix), `audit-phase21-mechanics.mjs` also reports 9 of 16 encounters as `triggered:false`/`resolved:false` because `driveToX` never reaches them (`"mechanic unreachable"`) — identical set, identical `reachedX` values within noise, in the pre-CR-02-fix baseline run and every post-fix run. This is unrelated to CR-01/CR-02/WR-02/WR-04 (none of those change movement/reachability) and was not a REVIEW.md finding, so it was left untouched. The two WR-04 warnings above explain 2 of these 9 directly (level-02/level-04 gaps genuinely un-single-jumpable); the level-01 cases (gap well within the jumpable threshold) point to a separate, deeper `driveToX` reliability issue worth a dedicated investigation.

## Skipped Issues

### WR-01: ~100 lines of server/MIME/playwright-resolution boilerplate duplicated verbatim between the two scripts

**File:** `scripts/browser-boot.mjs:1-95`, `scripts/audit-phase21-mechanics.mjs:1-262`
**Reason:** Deferred — this is a genuine, mechanical-but-nontrivial extraction (new `scripts/lib/serve.mjs` module, both scripts' imports and control flow reworked) touching both scripts' entire top section. This is the final iteration of the `--auto` loop (max 3) and the explicit priority was the 2 CR items; given the remaining time budget after fixing CR-01, CR-02, WR-02, and WR-04 (all empirically re-verified against the actual commit gate, `browser-boot.mjs`), attempting a broader structural refactor now carried more regression risk than benefit this late in the loop. Recommended as a manual follow-up task — extract `resolvePlaywright()`, the `MIME` table (including the `.wav`/`.mp3` entries currently only in `browser-boot.mjs`, closing IN-02 at the same time), and the path-guarded static server into one shared module both scripts import.

### WR-03: `browser-boot.mjs`'s movement still relies on fixed timeouts, not live position polling

**File:** `scripts/browser-boot.mjs:141-177`
**Reason:** Deferred — reusing/extracting `driveToX`'s poll-based approach for `browser-boot.mjs` is a real behavioral rewrite of its movement section (not a small edit), and `browser-boot.mjs` is the actual pass/fail commit gate — the highest-risk place to introduce an untested regression in the final iteration of this loop. The current fixed-timeout approach was verified working (exit 0) after every fix landed in this session, so no live break exists today; the fragility WR-03 describes (timing jitter, future `RUN_SPEED` retunes) is a real but not-yet-manifesting risk, unlike WR-04's gap-width issue which was empirically confirmed to already be live. Recommended as a manual follow-up: port `driveToX`'s `player.pos.x`-polling loop into `browser-boot.mjs` in place of its hand-timed `waitForTimeout` holds.

---

_Fixed: 2026-07-04T15:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 3_
