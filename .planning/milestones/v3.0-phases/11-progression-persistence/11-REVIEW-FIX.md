---
phase: 11-progression-persistence
fixed_at: 2026-06-27T00:00:00Z
review_path: .planning/phases/11-progression-persistence/11-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 3
skipped: 3
status: partial
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-06-27
**Source review:** .planning/phases/11-progression-persistence/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (2 warning, 4 info)
- Fixed: 3 (WR-01, WR-02, IN-01)
- Skipped: 3 (IN-02, IN-03, IN-04 — all "no change required" per the review and non-trivial/non-zero-risk)

**Gate status after all fixes:**
- `bash scripts/check-progress.sh` -> `progress checks: PASS`
- `node scripts/smoke-progress.mjs` -> `smoke-progress: PASS`
- `node --check` clean on every modified file.

Both firewalls preserved (no engine import added to progress.js; brain.js untouched), the
verbatim v1/v2 XP curve is unchanged, the forgiving XP-only-on-correct rule, the fire-once
goal latch + single goal handler, and the one-way HUD read are all intact. STATE.md and
ROADMAP.md were not modified.

## Fixed Issues

### WR-01: `level` validation is not `isFinite`-guarded — a corrupt save freezes progression forever

**Files modified:** `src/progress.js`
**Commit:** c0dc8ec
**Applied fix:** Added the same finite + sane guard already used for `xp` to `level` at
BOTH sites — the `createProgress` construction site and the `validate()` seam. The guard is
`typeof level === "number" && Number.isFinite(level) && level >= 1 ? Math.floor(level) : 1`.
`Number.isFinite` rejects `Infinity`/`NaN` (a corrupt `{"version":1,"level":1e400}` parses
`level` to `Infinity`, which previously slipped through the bare `>= 1` check and bricked
progression because `addXp`'s `xp >= threshold(Infinity)` is never true). The `>= 1` floor
behavior is preserved so a returning valid save still resumes its real level.

Verified directly: a corrupt `Infinity` level now falls back to `1`, `NaN` -> `1`, and a
valid `level: 5` still loads as `5`.

### WR-02: `onHide` listener registered on the app-global event bus and never cancelled on scene teardown

**Files modified:** `src/scenes/game.js`
**Commit:** aa9c9b5
**Applied fix:** Captured the controller returned by `onHide(...)` into `hideCtrl` and
cancelled it on scene leave via `onSceneLeave(() => hideCtrl.cancel())`. Confirmed against
the vendored engine that `onHide(f)` resolves to `events.on("hide", f)` (the app-global bus)
and returns a controller exposing `.cancel()`, and that `onSceneLeave` is exported as a
global. This mirrors the controller-cancel discipline `mathGate.js` already uses for its
global number-key controllers. The save-on-hide behavior for the live scene is unchanged;
the fix only prevents stacked, dead-scene listeners on any future re-entry path.

### IN-01: `levelCleared` is dead state — set but never read

**Files modified:** `src/scenes/game.js`
**Commit:** b789466
**Applied fix:** Confirmed via repo-wide grep that `levelCleared` was only declared
(`let levelCleared = false;`) and assigned (`levelCleared = true;`) and never read anywhere.
Removed both the declaration and the assignment (and the now-stale comment line). The
scene-side "cleared" behavior — the player simply stays frozen — is unchanged. Post-removal
grep returns zero matches and all gates stay green.

## Skipped Issues

### IN-02: History window is clamped twice (validate + createBrain)

**File:** `src/progress.js:183-185` and `src/math/brain.js:94-96`
**Reason:** Skipped — not zero-risk. Both layers must independently clamp because
`createBrain` can be called outside the loader and must defensively validate any seed, while
`validate()` guards the persisted-blob path. Removing either clamp reduces a real
defense-in-depth guard. The review itself offers "just leave a comment that the double-clamp
is intentional defense-in-depth" as an acceptable resolution and marks no behavior change as
required. Left as-is per the trivial/zero-risk-only scope constraint.

### IN-03: Last-resort distractor pad loop is unreachable dead code

**File:** `src/math/brain.js:209-213`
**Reason:** Skipped — the review explicitly states "Acceptable to keep as a guard... no
change required." It is a deliberate defensive branch (the comment already labels it "should
be unreachable") guarding against an unexpected input domain. Removing it would weaken that
guard for no functional gain. Not touched.

### IN-04: `table` membership computed via array `includes` with no range validation in `calculateXp`

**File:** `src/progress.js:77-80`
**Reason:** Skipped — the review states "No change required given the constrained caller."
The only call site passes a valid 1..9 table (`q.a`). Adding a range guard would change XP
behavior for out-of-range inputs and touches the XP-award path, which the scope constraint
protects ("do not touch ... the verbatim XP curve / XP rules"). The suggested guard is only
warranted if `addXp` ever becomes a public/general entry point, which it is not in Phase 11.
Deferred.

---

_Fixed: 2026-06-27_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
