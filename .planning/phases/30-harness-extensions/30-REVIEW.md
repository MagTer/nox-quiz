---
phase: 30-harness-extensions
reviewed: 2026-07-10T12:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - docs/LEVEL-DESIGN.md
  - scripts/browser-boot.mjs
  - scripts/fixtures/bad-level.js
  - scripts/fixtures/bad-level-mover.js
  - scripts/lib/audit-retry.mjs
  - scripts/lib/mechanic-drive.mjs
  - scripts/lib/reachability.mjs
  - scripts/lib/route-planner.mjs
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
---

# Phase 30: Code Review Report (iteration 2 — post-fix re-review)

**Reviewed:** 2026-07-10
**Depth:** standard (with explicit deep cross-file tracing on the CR-01 retry-flow per the re-review brief)
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This is iteration 2, re-reviewing the fixer's commits (`11cbdd1` CR-01, `deb05c1` WR-02, `7f06b78` WR-01, `0592444` WR-03) against the four findings from iteration 1's review (superseded — see git history of this file).

Three of the four prior findings hold up cleanly under re-inspection:

- **WR-01** (misleading `Math.max`/marginRatio comment in `reachability.mjs`) — genuinely fixed; the corrected comment matches the code and the file's own `WARN_MARGIN_RATIO` convention.
- **WR-03** (missing mover rightward-only doc note) — genuinely fixed; the new `docs/LEVEL-DESIGN.md` §6a accurately describes `bestMarginToPoint`'s `if (point.x < n.xStart) continue;` restriction.
- **WR-02** (fragile alcove XP-delta equality) — the immediate bug (breaking on a level-up boundary) is genuinely fixed: `predictAward()` correctly reimplements `progress.js`'s `awardAndCarry` threshold/carry-over loop (verified line-for-line against `src/progress.js:121-130`). A residual drift-risk finding is raised below (WR-04) since this is a hand-duplicated implementation with no shared import and no regression test tying it to `progress.js`.

**CR-01 does not fully hold up.** Tracing the actual retry-attempt flow across `audit-retry.mjs` → the real browser scene lifecycle (`src/scenes/select.js` → `src/scenes/game.js` → `src/progress.js` → `src/mechanics/secretAlcove.js`) — not just the fixer's own mock-based proof — surfaces a genuine ordering bug in the fix itself: the `localStorage` clear that's supposed to reset the "unseeded" state for a retry attempt executes **after** the new scene instance has already read and cached the *stale* pre-clear value into its in-memory `progress` closure. This does not reopen the *original* false-pass vulnerability (verified below — no path produces a false `resolved: true`), but it does silently poison every even-numbered retry attempt into a guaranteed, artifactual `resolved: false`, roughly halving the wrapper's effective retry budget and contradicting the fix's own stated goal ("restores `driveAndDetectAlcove`'s own documented 'every attempt starts unseeded' assumption"). See CR-01 (below) — same finding ID as iteration 1 since it is the same underlying defect area, but this is a *distinct residual bug in the fix itself*, not the original bug recurring verbatim.

## Critical Issues

### CR-01: CR-01's own `localStorage` clear runs too late to un-poison the retry attempt it's meant to fix — every even-numbered retry is a guaranteed false-negative, not a genuine re-test

**Files:** `scripts/lib/audit-retry.mjs:69-101`, `scripts/lib/mechanic-drive.mjs:549-645`; root cause spans into `src/scenes/select.js:275`, `src/scenes/game.js:80-81`, `src/progress.js:59-99`, `src/mechanics/secretAlcove.js:49-89` (not in this review's file list, but load-bearing for the actual defect and read to confirm it).

**Issue:**

The CR-01 fix's ordering, per `audit-retry.mjs`'s attempt loop:

```js
if (attempt > 1) {
  await reloadLevel();                    // (A) re-enters the level — builds a NEW scene
  if ((level.geometry.secretAlcove ?? []).length > 0) {
    await page.evaluate(/* delete blob.levels[levelId].secretFound; setItem(...) */);  // (B) clears localStorage
  }
}
```

`reloadLevel()` (the caller-supplied callback in `scripts/audit-phase21-mechanics.mjs`) presses `Escape` → repositions the cursor → presses `Enter` → waits 1500ms. Pressing `Enter` on the select screen synchronously calls `go("game", { levelId })` (`src/scenes/select.js:275`), which synchronously invokes `gameScene(data)` (`src/scenes/game.js`). Lines 80-81 of `game.js` read:

```js
const saved = loadSave();
const progress = createProgress(saved);
```

`createProgress()` (`src/progress.js:59-99`) is a **pure factory**: it seeds a closure-local `secretFound` map **once**, at construction time, from whatever `saved.levels[id].secretFound` was at that instant, and never re-reads storage afterward. `src/mechanics/secretAlcove.js`'s collision handler (line 59) checks `progress.hasSecretFound(levelId)` — which reads this frozen in-memory closure map (`src/progress.js:164-166`), **not** live `localStorage`.

So the sequence for attempt N (N > 1), following a genuine attempt-(N-1) reward-verification failure (which, per `secretAlcove.js`'s unconditional-marking design, still leaves `localStorage`'s `secretFound` persisted as `true` even though the award itself was wrong):

1. `reloadLevel()` step (A) runs — the new scene's `progress` closure is constructed from the **still-poisoned** (pre-clear) `localStorage`, capturing `hasSecretFound(levelId) === true` into memory.
2. Only *after* `reloadLevel()` resolves does step (B)'s `page.evaluate` delete `secretFound` from `localStorage`.
3. `driveAndDetectAlcove` then reads `beforeBlob` (post-clear) and correctly computes `alreadyFoundBefore = false` — but this now describes only the *external* `localStorage` snapshot, not the *actual* decision the running scene will make.
4. When the player touches the alcove, `secretAlcove.js` branches on the **stale in-memory** `progress.hasSecretFound(levelId)`, which is still `true` from step 1 — so it unconditionally takes the "already found" replay branch: `fx.pop` / `audio.playSfx` / `destroy(alcoveObj)`, **never** calling `addBonusXp`, `markSecretFound`, or `save()`. The real award logic is never re-exercised on this attempt.
5. Result: `triggered = true` (the entity is destroyed either way), `delta = 0` (xp genuinely unchanged, since no award ran), `freshAwardCorrect = false` (afterBlob.xp doesn't match the predicted post-award state), `alreadyFoundBefore = false` (per the now-cleared `localStorage` read in step 3) → `resolved = false`.

This step is a **guaranteed** `resolved: false`, independent of whether the underlying `addBonusXp`/`awardAndCarry` mechanism is genuinely broken or was just a one-off timing flake. Because step 4 never wrote anything back to `localStorage`, the *next* reload (attempt N+1) picks up the correctly-cleared state and gets a genuine, unbiased test — so attempts 1, 3, 5 are real tests and attempts 2, 4 are deterministic no-ops. With `maxAttempts: 5` (the value this codebase always passes — `scripts/audit-phase21-mechanics.mjs:236`), this silently reduces the effective retry budget from up to 5 genuine attempts to 3, directly undermining 23-CONTEXT.md's "3-5 retries... timing-sensitive, not fundamentally unreachable" design intent this whole wrapper exists to serve, and contradicts the fix's own comment claim that clearing `localStorage` "restores `driveAndDetectAlcove`'s own documented 'every attempt starts unseeded for this fact' assumption" — it restores that assumption only for the *external* before/after `localStorage` diff the detector reads, never for the *live game session* whose branch decision actually determines what happens on that attempt.

**Why this wasn't caught by the fixer's own proof:** the fixer's `scratchpad/cr01-verify.mjs` (per `30-REVIEW-FIX.md`) drove `auditLevelWithRetries` against a synthetic mock `page`, not a real browser. The mock "faithfully reproduces `secretAlcove.js`'s real contract" for the *storage write* semantics (unconditional persist-on-first-touch) but — necessarily, since it never runs `src/scenes/game.js`/`src/progress.js` — cannot reproduce the fact that a real browser scene's `progress` object is a **one-shot snapshot** taken at scene-construction time, before `audit-retry.mjs`'s `localStorage` patch has a chance to run. The mock's per-attempt "delta" is presumably driven straight off its own simulated `localStorage`, updated transactionally in the correct read/clear/write order — sidestepping exactly the race this finding describes. The `30-REVIEW-FIX.md` follow-up "re-confirmed end-to-end" run (`node scripts/audit-phase21-mechanics.mjs` against real shipped levels) also would not surface this: every shipped level's alcove genuinely works today, so it resolves on attempt 1 and never reaches the poisoned attempt-2 path at all — the bug is latent precisely in the scenario (a persistently-broken award needing 2+ attempts) that real content never exercises.

**Does this reopen the original false-pass vulnerability?** No — traced exhaustively above, the poisoned attempt always computes `delta === 0` *and* `alreadyFoundBefore === false` (since the `localStorage` read that feeds `alreadyFoundBefore` genuinely is cleared, even though the live scene's branch decision isn't), so `resolved` can never evaluate `true` on a poisoned attempt. The severity here is about the retry mechanism silently failing at its one job (reliably distinguishing "genuinely broken" from "just unlucky this run") by wasting half its budget on deterministic non-tests, which can cause a legitimately-flaky-but-correct mechanic to be reported as a HARD finding in `23-FINDINGS.md`-style output when a genuine 5-attempt budget would have caught it. Classified Critical because a verification harness whose core value proposition is "produces a reliable pass/fail signal so a human doesn't have to" silently delivering a materially weaker guarantee than documented is a correctness defect in the tool itself, not a cosmetic one.

**Fix:** Reorder the two steps — clear the `localStorage` fact **before** calling `reloadLevel()`, not after, so the new scene's `loadSave()`/`createProgress()` call (triggered synchronously by the `Enter` press inside `reloadLevel()`) observes the already-cleared state:

```js
if (attempt > 1) {
  if ((level.geometry.secretAlcove ?? []).length > 0) {
    await page.evaluate(
      ({ key, levelId }) => {
        try {
          const blob = JSON.parse(localStorage.getItem(key));
          if (blob?.levels?.[levelId]) {
            delete blob.levels[levelId].secretFound;
            localStorage.setItem(key, JSON.stringify(blob));
          }
        } catch {
          // forgiving — a malformed/missing blob just leaves nothing to clear
        }
      },
      { key: CONFIG.SAVE.KEY, levelId: level.id }
    );
  }
  await reloadLevel(); // now observes the already-cleared secretFound state
}
```

This is safe: the clear-patch operates on `localStorage` directly (not via any live scene object), so running it while the *previous* attempt's scene is still the active page context is harmless — it only needs to land before the *next* scene's `loadSave()` call, which is exactly what moving it before `reloadLevel()` guarantees. Re-verify with a mock that actually models the "scene snapshot is taken once, at `Enter`-press time" ordering (or, more convincingly, add this exact regression to the real Playwright-driven audit: seed a deliberately-broken `addBonusXp` via a monkeypatch/build flag and confirm `attempts` in the final result reflects genuine re-tries, not a mix of real and poisoned ones).

## Warnings

### WR-04: `predictAward` in `mechanic-drive.mjs` is a hand-duplicated reimplementation of `progress.js`'s `awardAndCarry`, with no shared import and no regression test tying the two together

**File:** `scripts/lib/mechanic-drive.mjs:616-626`

**Issue:** The WR-02 fix's `predictAward` helper is a byte-for-byte re-derivation of `src/progress.js:104-130`'s `threshold`/`awardAndCarry` logic (confirmed correct in this review — the `Math.round(BASE_XP * LEVEL_MULT ** (lvl-1))` threshold formula and the `while (xp >= threshold) { xp -= threshold; level += 1 }` carry-over loop match exactly). The fix's own comment acknowledges the risk ("never re-tune independently — this MUST stay byte-for-byte in sync with progress.js's awardAndCarry"), but `progress.js` exports only `createProgress`/`loadSave`/`writeSave`/`resetSave` — `threshold` and `awardAndCarry` are private closure-local functions, not exported — so there is no way for `mechanic-drive.mjs` to import the real logic instead of re-deriving it, and no automated check (lint rule, shared fixture, or self-test comparing the two implementations) that would catch the two silently diverging if `progress.js`'s curve or carry-over shape is ever changed without a matching edit here. Since both read the same `CONFIG.PROGRESS.BASE_XP`/`LEVEL_MULT` constants, a pure *tuning* change (retuning the numbers) stays in sync automatically; only an *algorithmic* change to `progress.js`'s award/carry-over shape (e.g., changing the reset-on-level-up semantics, or adding a cap) would silently break this oracle without either file's own tests noticing.

**Fix:** Either (a) export `threshold`/`awardAndCarry` (or a `predictAward`-shaped pure function) from `src/progress.js` as the single source of truth and import it here — `progress.js`'s own header already documents it as import-nothing/engine-free, so this wouldn't violate the a727c13 firewall — or (b) at minimum, add a small cross-file self-test (in `mechanic-drive.mjs` or a new `scripts/lib/*.mjs` self-test) that constructs a real `createProgress()` instance, calls `.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE)` across a level-up boundary, and asserts the result matches `predictAward`'s prediction for the same seed — so a future divergence fails loudly instead of silently degrading this specific verification path.

---

_Reviewed: 2026-07-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
