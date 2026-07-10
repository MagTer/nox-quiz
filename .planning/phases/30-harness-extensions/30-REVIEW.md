---
phase: 30-harness-extensions
reviewed: 2026-07-10T00:00:00Z
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
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 30: Code Review Report

**Reviewed:** 2026-07-10
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase extends the verification harness with static secret-alcove/mover reachability
(`reachability.mjs`'s `bestMarginToPoint`) and interactive alcove-trigger detection
(`mechanic-drive.mjs`'s `driveAndDetectAlcove` + `audit-retry.mjs`'s alcove branch). The
static-reachability math (`bestMarginToPoint`, the mover worst-case-extreme rule, the
`targetY` disambiguation threaded through `nodeContaining`/`planTakeoffs`) is sound and
matches its own documented rationale and self-tests; both new RED-first fixtures fail for
the reasons their headers claim. `reachability.mjs` stays a pure, browser-free module and
every new optional geometry array (`secretAlcove`, `movers`) is `?? []`-guarded, satisfying
the project's "never brick" convention. `browser-boot.mjs`'s alcove-filtering fix correctly
restores its pre-Phase-30 "first drivable mechanic" scope rather than masking anything.

However, there is one real correctness bug in the *dynamic* half of the alcove audit: the
OR-across-attempts retry wrapper (`audit-retry.mjs`) can silently launder a genuine
reward-verification failure into a false "resolved: true" on a retry, because the secret
alcove's cross-run persisted `secretFound` fact changes the observable outcome of a
second touch regardless of whether the first touch's XP award was correct. This defeats
the actual purpose of the MECH-04 dynamic check for the exact class of runs (any first
attempt that doesn't cleanly resolve) the retry wrapper exists to rescue. See CR-01 below.
Two secondary documentation/fragility issues are also noted.

## Critical Issues

### CR-01: Secret-alcove retry masking — a failed reward verification silently "passes" on the very next attempt

**File:** `scripts/lib/audit-retry.mjs:95-101` (interacting with `scripts/lib/mechanic-drive.mjs:538-598`, `driveAndDetectAlcove`)

**Issue:**

`driveAndDetectAlcove`'s `resolved` claim is:

```js
const resolved = triggered && (delta === CONFIG.PROGRESS.XP_ALCOVE || delta === 0);
```

The `delta === 0` branch exists to tolerate a legitimate *already-found* re-touch (per
`secretAlcove.js`'s CR-01 anti-farming guard: once `progress.markSecretFound(levelId)` has
fired and been persisted, a later touch destroys the entity again but awards no XP). The
comment on this function explicitly assumes "every audit run seeds a fresh SAVE_BLOB with
no `secretFound` field, so the `XP_ALCOVE` branch is the one actually expected to fire in
this harness" — i.e. the `delta === 0` branch is treated as a defensive edge case that
should basically never fire in practice.

That assumption is false specifically *because of* `audit-retry.mjs`'s own retry loop.
`reloadLevel()` re-enters the level but does not clear `localStorage` — the persisted
`secretFound` fact from `secretAlcove.js`'s own `save()` call (fired unconditionally right
after `progress.markSecretFound(levelId)`, regardless of whether the XP award itself was
computed/observed correctly) survives across attempts within the same audit run. Trace the
sequence:

1. Attempt 1: `driveAndDetectAlcove` reaches the alcove, the entity is destroyed
   (`triggered: true`), but for any reason (a genuine regression in `addBonusXp`, a stale
   `beforeBlob` read, a timing race, or simply an unrelated flake) `delta !== XP_ALCOVE` →
   `resolved: false`. Because `secretAlcove.js`'s collision handler still ran
   `progress.markSecretFound(levelId)` and `save()` unconditionally (they are not gated on
   the XP amount being correct), the persisted blob now has `secretFound: true` regardless.
2. `audit-retry.mjs`'s skip guard (`if (previous?.triggered && previous.resolved === true) continue;`)
   does **not** skip this encounter on attempt 2, since `resolved` was `false` — it retries.
3. Attempt 2: the level is reloaded fresh, a new alcove entity is built, but
   `progress.hasSecretFound(levelId)` now reads `true` from the persisted blob seeded at
   scene entry. `secretAlcove.js` takes the "already found" branch: the entity is still
   destroyed (`triggered: true` again) but `delta === 0` by design.
4. `resolved = outcome.resolved || (previous?.resolved ?? false)` → `0 === 0` →
   `resolved: true`. The wrapper records this as fully resolved and (if this was the last
   pending encounter) exits early via `everyEncounterDone`.

The final audit result reports `resolved: true` for an encounter whose *actual* reward path
was never successfully observed even once. A genuine regression in the alcove XP-award
mechanic — the exact thing MECH-04's dynamic half exists to catch — would reliably self-heal
into a false PASS on the second attempt, as long as the entity-destroy signal keeps firing.
This directly undermines this project's own "checks that don't play the game lie" standard
(CLAUDE.md, Binding rules), for the very check this phase was built to add.

**Fix:**

Distinguish a legitimate "already found before this attempt began" re-touch from a "reward
check failed on a fresh alcove" case, instead of accepting `delta === 0` unconditionally.
For example, read the pre-touch `hasSecretFound` state and only accept the zero-delta
branch as `resolved` when that pre-condition already held:

```js
// mechanic-drive.mjs — driveAndDetectAlcove
const alreadyFoundBefore = !!beforeBlob?.levels?.[levelId]?.secretFound; // encounter must
// carry levelId, or derive it from geometry/caller

...

const triggered = afterCount < beforeCount;
const delta = (afterBlob?.xp ?? 0) - (beforeBlob?.xp ?? 0);
const resolved =
  triggered &&
  (delta === CONFIG.PROGRESS.XP_ALCOVE || (delta === 0 && alreadyFoundBefore));

return { triggered, resolved };
```

With this fix, an attempt-1 failure where the alcove was NOT previously found but the delta
still isn't `XP_ALCOVE` correctly stays `resolved: false` on attempt 2 as well (since
`alreadyFoundBefore` is now `true` from attempt 1's own persisted write, but the delta is
still `0` and `alreadyFoundBefore` is true this time — so it WOULD now pass, which is
correct only if attempt 1's award genuinely succeeded). The more robust fix is for
`audit-retry.mjs` to treat the secret-alcove reward claim as needing to succeed on some
attempt where the pre-touch state was genuinely not-yet-found — i.e., stop OR-ing
`resolved` across attempts once the persisted fact has flipped, and instead surface
"reward never observed correctly on a genuine first touch" as its own distinct, non-passing
outcome. At minimum, log/flag when a `delta === 0` resolution occurs on an attempt where
`previous.triggered` was already `true` (i.e., a retry of an already-triggered encounter) so
this failure mode is visible in the audit output rather than silently absorbed.

## Warnings

### WR-01: Mover-reachability comment contradicts its own code (`Math.max` picked, but documented as "lower marginRatio")

**File:** `scripts/lib/reachability.mjs:530-535` (code at line 550)

**Issue:** The comment block introducing the mover-reachability check says:

> "... so this reports the WORSE (lower marginRatio, more likely to fail) of the two
> endpoint results ..."

but the code immediately below picks the opposite:

```js
const worst = Math.max(r1.marginRatio, r2.marginRatio);
```

Per this same file's own established convention (`WARN_MARGIN_RATIO`'s header comment, and
every other tiering decision in `checkLevelReachability`), a **higher** `marginRatio` means
a **tighter/harder** hop (closer to the calibrated envelope's max reach, more likely a real
player misses it), not a lower one. The code (`Math.max`) is correct and consistent with
that convention; the comment's parenthetical is backwards. Left as-is, this is likely to
mislead a future maintainer retuning this logic (e.g. "fixing" a correct `Math.max` to a
`Math.min` because the comment says "lower marginRatio is worse").

**Fix:** Correct the comment to match the code and the file's established convention:

```js
// ... so this reports the WORSE (higher marginRatio, tighter/more likely to fail) of
// the two endpoint results; if EITHER endpoint is flatly unreachable, the whole mover
// HARD-FAILs.
```

### WR-02: Alcove XP-delta equality check doesn't account for `addBonusXp`'s level-up carry-over branch

**File:** `scripts/lib/mechanic-drive.mjs:593-595`

**Issue:**

```js
const delta = (afterBlob?.xp ?? 0) - (beforeBlob?.xp ?? 0);
const resolved = triggered && (delta === CONFIG.PROGRESS.XP_ALCOVE || delta === 0);
```

`progress.js`'s `addBonusXp`/`addXp` share `awardAndCarry`, whose `xp` field is a
**within-level** counter that resets on overflow (`xp -= threshold(level)`, not `xp = 0`,
possibly looping multiple times) rather than a monotonically increasing running total. If
the alcove's `+XP_ALCOVE` award happens to push cumulative XP across a level-up threshold
(`CONFIG.PROGRESS.BASE_XP` / `LEVEL_MULT` curve), `afterBlob.xp - beforeBlob.xp` will be
some small carried-over remainder (or even negative) rather than exactly `XP_ALCOVE` — and
`resolved` would be reported `false` even though the award mechanic behaved perfectly
correctly, just crossed a level boundary at that exact moment.

Given the current 8 shipped levels only award XP at the goal-clear gate (not at
intermediate doors/mathGates/enemies) and `BASE_XP` is 200 while at most a handful of
prior level-clears (≤20 XP each) could have accumulated by the time any given level's
alcove is reached in a single sequential audit pass, this is unlikely to trigger against
today's real content. But it is a fragile, undocumented assumption baked into a magic-number
equality check — a future `BASE_XP`/`XP_HARD`/`XP_ALCOVE` retune, a longer multi-pass audit
run that doesn't reset `localStorage`, or additional intermediate-mechanic XP awards would
silently start producing spurious `resolved: false` results with no obvious cause.

**Fix:** Either compute the expected post-award threshold-aware value directly (mirror
`awardAndCarry`'s carry-over math) instead of a magic equality check, or bound the check to
the plausible non-level-up delta while explicitly documenting the assumption and asserting
it holds for the current curve (e.g. an inline check that `beforeBlob.xp + XP_ALCOVE <
threshold(beforeBlob.level)` is true for every real level's launch platform, failing loudly
if that invariant is ever violated by future content).

### WR-03: New mover-reachability rule's "rightward-travel-only" modeling limit is undocumented outside code comments

**File:** `scripts/lib/reachability.mjs:357-359` (and `docs/LEVEL-DESIGN.md`)

**Issue:** `bestMarginToPoint` — the function backing both the new
`secret-alcove-reachability` and `mover-reachability` checks — explicitly only considers
launch nodes whose span is at or before the target point (`if (point.x < n.xStart)
continue;`, documented in-code as a "Rightward-travel-only model"). This is a reasonable,
documented simplification, but `docs/LEVEL-DESIGN.md` (updated in this phase for the
alcove section) has no "Movers" section at all describing this constraint, even though
Phase 36 is explicitly slated to author the first real `geometry.movers` content. A future
level author placing a mover whose reachable launch point is only accessible by walking
*left* (e.g. after a required backtrack, or a mover parked behind a checkpoint) would get a
HARD-FAIL from this validator that has nothing to do with the mover's actual in-game
reachability — and the only trace of *why* lives in a code comment inside
`scripts/lib/reachability.mjs`, not the authoritative level-design rules doc a level author
would consult.

**Fix:** Add a short "Movers" stub to `docs/LEVEL-DESIGN.md` (even ahead of Phase 36's full
authoring-rules pass) noting that `geometry.movers` reachability is currently modeled via
worst-case-extreme testing of both ping-pong endpoints, and that each endpoint must be
reachable via a **rightward-only** hop from some already-reachable node — mirroring the
constraint this file already documents for `secretAlcove`.

---

_Reviewed: 2026-07-10_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
