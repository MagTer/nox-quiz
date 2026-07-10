---
phase: 30-harness-extensions
fixed_at: 2026-07-10T00:00:00Z
review_path: .planning/phases/30-harness-extensions/30-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 30: Code Review Fix Report

**Fixed at:** 2026-07-10
**Source review:** .planning/phases/30-harness-extensions/30-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (1 critical, 3 warning — `critical_warning` scope)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: Secret-alcove retry masking — a failed reward verification silently "passes" on the very next attempt

**Files modified:** `scripts/lib/audit-retry.mjs`, `scripts/lib/mechanic-drive.mjs`
**Commit:** `11cbdd1`
**Applied fix:** Root-cause fix at the harness level (not touching `src/mechanics/secretAlcove.js` or `src/progress.js`, per the task's explicit instruction — both are correct as-is):

- `scripts/lib/audit-retry.mjs`: at the start of every retry attempt (`attempt > 1`, right after `reloadLevel()`), the wrapper now reads the persisted save blob and deletes ONLY `blob.levels[level.id].secretFound` before writing it back — never touching `cleared`, `xp`, `level`, `accuracy`, or `history`. This restores `driveAndDetectAlcove`'s own documented "every attempt starts unseeded for this fact" assumption, which `reloadLevel()` alone does not provide (it re-enters the level fresh but never clears `localStorage`). Guarded to only run when the level actually authors a `secretAlcove` (`(level.geometry.secretAlcove ?? []).length > 0`), and wrapped in the standard forgiving `try/catch` so a malformed/missing blob is a no-op, never a throw.
- `scripts/lib/mechanic-drive.mjs`: `driveAndDetectAlcove` now takes a `levelId` parameter (threaded through from `audit-retry.mjs`'s `level.id`) and reads the pre-touch `alreadyFoundBefore = beforeBlob?.levels?.[levelId]?.secretFound === true` state before driving anywhere. The `delta === 0` "already found" resolution branch is now gated on `alreadyFoundBefore` — a zero-delta touch is only accepted as a legitimate re-touch if the persisted fact was ALREADY true before this specific attempt began, never merely because `delta` happens to be `0`.

Together these two changes mean: (a) the persisted `secretFound` residue that used to survive a retry's reload is now cleared before every fresh attempt, so a genuine attempt-1 failure can no longer "self-heal" via the already-found branch on attempt 2; and (b) even in the legitimate same-attempt multi-alcove-per-level case (per `secretAlcove.js`'s own "only the first one touched pays out" content allowance — not used by any of the 8 shipped levels today, all of which author exactly one `secretAlcove` entry), the `alreadyFoundBefore` gate still correctly recognizes a real second-touch-in-the-same-attempt as resolved.

**How the fix was verified (beyond the standard 3-tier check):** Built a throwaway, real-code-driven test harness (`scratchpad/cr01-verify.mjs`, not committed) that imports the ACTUAL `auditLevelWithRetries` from the edited `scripts/lib/audit-retry.mjs` and drives it through a synthetic `page` mock (no real browser needed — the bug and its fix live entirely in post-trigger decision logic and cross-attempt `localStorage` handling, not in physics/rendering). The mock faithfully reproduces `src/mechanics/secretAlcove.js`'s real contract: on first touch it unconditionally destroys the entity and persists `secretFound: true`, regardless of whether the XP award itself was correct — exactly the CR-01 precondition.

- **Regression scenario:** every touch on a fresh alcove genuinely awards `+2` XP instead of `CONFIG.PROGRESS.XP_ALCOVE` (`5`), simulating a persistent real-world regression in `addBonusXp`.
  - Against the **pre-fix** code (reconstructed from `git show HEAD:scripts/lib/{mechanic-drive,audit-retry}.mjs` before this fix, run through the identical mock): `{ triggered: true, resolved: true, attempts: 2 }` — the exact false pass CR-01 describes. Attempt 1 correctly reported `resolved: false` (delta `2` matches neither `XP_ALCOVE` nor `0`); attempt 2's reload left `secretFound: true` persisted from attempt 1, so the "already found" branch fired with a genuine `delta === 0` (no XP awarded because `hasSecretFound` now read `true`) and the pre-fix code accepted it unconditionally — laundering the still-broken award into `resolved: true`.
  - Against the **fixed** code (this commit): `{ triggered: true, resolved: false, attempts: 5 }` — the wrapper now exhausts all 5 retry attempts and correctly reports the encounter as unresolved, because the per-attempt `localStorage` clear means `alreadyFoundBefore` is `false` at the start of every attempt, so every attempt's broken `+2` award is independently (and correctly) rejected by the `delta === CONFIG.PROGRESS.XP_ALCOVE` check, never laundered through the zero-delta branch.
- **Control scenario:** every touch genuinely awards the correct `XP_ALCOVE` amount. Both pre-fix and post-fix code correctly report `{ triggered: true, resolved: true, attempts: 1 }` — confirming the fix does not introduce any false negative for the healthy case.

This was then re-confirmed end-to-end against the real, unmocked harness: `node scripts/audit-phase21-mechanics.mjs` (the actual Phase 21/23/30 interactive audit, run in a real Playwright browser against all 8 shipped levels) reports `AUDIT: ALL MECHANICS RESOLVED` with every `secret-alcove` encounter showing `triggered: true, resolved: true, attempts: 1` — i.e., the fix does not introduce any flakiness or false negatives against real game content, and the retry-clearing logic is a correct no-op when the mechanic is genuinely healthy (which it is — Phase 29 already verified `secretAlcove.js`/`progress.js` deliberately).

### WR-02: Alcove XP-delta equality check doesn't account for `addBonusXp`'s level-up carry-over branch

**Files modified:** `scripts/lib/mechanic-drive.mjs`
**Commit:** `deb05c1`
**Applied fix:** Replaced the bare `delta === CONFIG.PROGRESS.XP_ALCOVE` equality with a `predictAward(beforeBlob, XP_ALCOVE)` helper that mirrors `src/progress.js`'s `awardAndCarry` threshold/carry-over math byte-for-byte (`xp -= threshold(level)`, `level += 1`, looped) using the same `CONFIG.PROGRESS.BASE_XP`/`LEVEL_MULT` curve. `resolved` now checks whether `afterBlob.xp`/`afterBlob.level` match the predicted post-award state exactly (`freshAwardCorrect`), so a genuinely correct award that happens to cross a level-up boundary is still recognized, instead of silently reporting `resolved: false` for a perfectly correct mechanic.

**Verification:** A second throwaway harness (`scratchpad/wr02-verify.mjs`) seeded the persisted blob's `xp` at exactly `threshold(1) - XP_ALCOVE + 1` (196, with `threshold(1) = 200` and `XP_ALCOVE = 5`) so a correct alcove award crosses the level-1→2 boundary (`afterBlob = { xp: 1, level: 2 }`, `delta = -195`, nowhere near `XP_ALCOVE`). Against the fixed code: `{ triggered: true, resolved: true, attempts: 1 }` — correctly recognized deterministically on the very first attempt. Against the CR-01-only (pre-WR-02) commit run through the identical scenario: `{ triggered: true, resolved: true, attempts: 2 }` — it eventually self-corrects via a second retry (because CR-01's per-attempt clearing happens to re-roll the award away from the boundary), but only by accident of the specific seed value, not deterministically; a persistently-close-to-boundary seed could in principle require additional retries. WR-02 removes that latent flakiness by making the check exact and correct on attempt 1, matching the review's characterization of the pre-fix check as "fragile... a future retune... would silently start producing spurious `resolved: false` results."

### WR-01: Mover-reachability comment contradicts its own code (`Math.max` picked, but documented as "lower marginRatio")

**Files modified:** `scripts/lib/reachability.mjs`
**Commit:** `7f06b78`
**Applied fix:** Corrected the comment above the `mover-reachability` check (previously said "reports the WORSE (lower marginRatio, more likely to fail)") to match the code's actual `Math.max(r1.marginRatio, r2.marginRatio)` and this file's own established convention (a HIGHER `marginRatio` means a tighter/harder hop, per `WARN_MARGIN_RATIO`'s own header comment and every other tiering decision in `checkLevelReachability`). Verified via `node --check` and the module's own self-test (`node scripts/lib/reachability.mjs` → `reachability-selftest: PASS`) — comment-only change, no logic touched.

### WR-03: New mover-reachability rule's "rightward-travel-only" modeling limit is undocumented outside code comments

**Files modified:** `docs/LEVEL-DESIGN.md`
**Commit:** `0592444`
**Applied fix:** Added a new "6a. Movers (`geometry.movers`) — preview ahead of Phase 36" section to `docs/LEVEL-DESIGN.md`, between the existing "Secret alcove" and "Camera bounds" sections, documenting: the worst-case-extreme ping-pong-endpoint testing model, the HARD rightward-travel-only constraint (each endpoint must be reachable via a hop launched from a node whose span sits at or before that endpoint's x position — mirroring the same simplification already applied to `secretAlcove` reachability), and practical placement guidance for whoever authors the first `geometry.movers` content in Phase 36.

## Skipped Issues

None — all 4 in-scope findings were fixed.

---

_Fixed: 2026-07-10_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
