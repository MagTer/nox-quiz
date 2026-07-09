---
phase: 29-mechanic-cleanup
fixed_at: 2026-07-09T22:13:36Z
review_path: .planning/phases/29-mechanic-cleanup/29-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 1
status: partial
---

# Phase 29: Code Review Fix Report

**Fixed at:** 2026-07-09T22:13:36Z
**Source review:** .planning/phases/29-mechanic-cleanup/29-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope (fix_scope: critical_warning — CR-*/WR-*): 5
- Fixed: 5
- Skipped: 1 (WR-04, intentionally deferred — see below)

## Fixed Issues

### CR-01: Secret-alcove XP bonus can be farmed without limit by replaying a level

**Files modified:** `src/mechanics/secretAlcove.js`
**Commit:** `09ee4df`
**Applied fix:** Added a guard at the top of the `onCollide("secret-alcove", ...)` handler
that checks `progress.hasSecretFound(levelId)` before calling `addBonusXp`/
`markSecretFound`. If the secret was already recorded in a prior playthrough, the
handler now plays the discovery feedback (pop + pickup chime) for a rewarding replay
feel but skips the XP award and the persisted-fact write entirely — closing the
unlimited-farming hole while keeping the "walk-through bonus, never an interruption"
contract intact. No new punishment/blocking mechanic was introduced, per this
project's ADHD-safe/no-timers mandate.

### CR-02: Secret discovery (XP + star) is silently lost if the player Escapes before reaching the goal

**Files modified:** `src/mechanics/secretAlcove.js`, `src/scenes/game.js`
**Commit:** `09ee4df` (same commit as CR-01 — both fixes touch the same handler and are
tightly coupled: CR-02's persist call sits directly inside CR-01's new-discovery branch)
**Applied fix:** `wireSecretAlcove` now accepts an optional `save` callback. `game.js`
passes `save: () => writeSave(progress.serialize(brain.snapshot()))` — the exact same
persist pattern already used on goal-clear and tab-hide. The mechanic calls `save()`
immediately after `progress.markSecretFound(levelId)` for a genuinely new discovery, so
Escape-to-select (NAV-03) can no longer silently drop the discovery before it's ever
written to localStorage.

### WR-01: Collect-mechanic removal left dead geometry fields on 3 of 8 levels

**Files modified:** `src/levels/level-02.js`, `src/levels/level-05.js`,
`src/levels/level-07.js`, `scripts/smoke-progress.mjs`
**Commit:** `4204777`
**Applied fix:** Removed the dead `collectZones: []` / `answerPickupSlots: []` lines
from all three level descriptors, matching the treatment already applied to
levels 01/03/04/06/08. Updated `smoke-progress.mjs`'s level-02 expected-geometry
fixture to match (it was still asserting the now-removed keys via `deepEqual`).

### WR-02: Stale "collect-the-answer zone" prose left in 4 level-descriptor headers/comments

**Files modified:** `src/levels/level-03.js`, `src/levels/level-04.js`,
`src/levels/level-06.js`, `src/levels/level-08.js`
**Commit:** `3243f9b`
**Applied fix:** Rewrote each stale module-doc header to drop the "collect-the-answer
zone" / "collectZone" mentions and describe the level's actual current mechanic mix
(enemy/checkpoint-gate/secret-alcove counts, verified against each file's own
`geometry` object). Renamed the two stale `// before collectZone@N` inline checkpoint
comments (level-06:66, level-08:95) to `// before the mid-run approach` per the
review's own fallback guidance, since no mechanic occupies those exact x-coordinates
any more.

### WR-03: Now-unreachable `renderChoices:false` / `"answer-zone"` code paths left in the Playwright harness after collect.js's removal

**Files modified:** `scripts/lib/mechanic-drive.mjs`, `scripts/browser-boot.mjs`,
`scripts/audit-phase21-mechanics.mjs`, `scripts/lib/audit-retry.mjs`,
`scripts/screenshot-phase26.mjs`
**Commits:** `9b4dc66` (the three files named in the review), `71fe320` (follow-up —
see note below)
**Applied fix:** Removed the `renderChoices` parameter from `resolveIfBoxed()` and the
`renderChoices: true` field from `deriveEncounters()`'s output entries in
`mechanic-drive.mjs` (every encounter it can produce is now door/math-gate/enemy, all
boxed); deleted the dead `if (!encounter.renderChoices) { continue; }` block in
`browser-boot.mjs`; removed the `r.tag === "answer-zone"` branches from
`audit-phase21-mechanics.mjs`'s pass/fail computation (that tag is never produced any
more) and rewrote the stale present-tense `collect.js` comments in all three files.

**Scope note (verification-driven follow-up):** running the mandatory verification
suite after this fix surfaced a real regression: `scripts/lib/audit-retry.mjs` (the
actual driver `audit-phase21-mechanics.mjs` uses, not directly named in the review's
file list) and `scripts/screenshot-phase26.mjs` both read `encounter.renderChoices` —
removing that field from `deriveEncounters()`'s output silently made
`audit-retry.mjs`'s resolution-skip condition always true, so `resolveIfBoxed` was
never called and every mechanic in the interactive audit reported `resolved: null`
(confirmed via a full run: `AUDIT: FAILURES DETECTED` with 16 `resolved: null` rows).
Per this workflow's rollback/fix-forward discipline, this was corrected in the same
session (commit `71fe320`) by removing the equivalent dead `renderChoices` checks from
both files (`audit-retry.mjs`'s skip-condition, resolve-condition, and early-exit
condition; `screenshot-phase26.mjs`'s dead `autoResolveCollectZone` branch, which was
already unreachable pre-fix since level-01 no longer has any collect-zone geometry).
Re-running `node scripts/audit-phase21-mechanics.mjs` after the follow-up confirmed
`AUDIT: ALL MECHANICS RESOLVED` with every encounter `resolved: true`.

`src/ui/challenge.js` still exposes a general `renderChoices` parameter (default
`true`) on `openChallenge()` — no caller in `src/` (door/gates/enemy/mathGate) passes
`false` any more, but this is production UI-seam code, was not in the review's file
list, and touching the shared challenge seam was outside this WR-03 finding's stated
scope (Playwright harness scripts only). Left untouched; flagged here for a future
pass if desired.

## Skipped Issues

### WR-04: Secret alcoves are unvalidated by the structural level gates

**File:** `scripts/lib/over-hole-check.mjs:34-38,48-66`, `scripts/lib/reachability.mjs:279-388`
**Reason:** Intentionally deferred, not attempted. Fixing this requires extending two
structural validators' `BARRIER_WIDTH` tables and reachability-check loops to cover a
new mechanic kind (`geometry.secretAlcove`) — new harness reachability-check machinery,
not a narrow guard-before-award or persistence fix like CR-01/CR-02. Per this
project's roadmap, harness-validator extension work of this shape is explicitly
Phase 30's scope ("Harness Extensions"). Building it inside this fix pass risked scope
creep beyond what Phase 29's plan covers. No source files were touched for this
finding.
**Original issue:** `over-hole-check.mjs` and `reachability.mjs` enumerate only
`doors`/`mathGates`/`enemies` for floor-run/spawn-reachability validation;
`geometry.secretAlcove` (introduced this phase) is never checked, so a mis-authored
alcove coordinate could ship silently with `validate-levels.mjs` still reporting clean.

## Post-fix verification

All of the following were re-run after every fix (final pass, all green):

- `bash scripts/check-gate.sh` — PASS
- `bash scripts/check-safety.sh` — PASS
- `bash scripts/check-import-safety.sh` — PASS
- `bash scripts/check-progress.sh` — PASS (includes `smoke-progress.mjs`)
- `node scripts/validate-levels.mjs` — PASS (zero HARD-FAIL; pre-existing WARNs
  unrelated to this fix pass)
- `node scripts/browser-boot.mjs` — PASS ("title -> select -> all levels loaded with
  no runtime errors")
- `node scripts/audit-phase21-mechanics.mjs` — "AUDIT: ALL MECHANICS RESOLVED" (every
  encounter across all 8 levels: `triggered: true`, `resolved: true`)

---

_Fixed: 2026-07-09T22:13:36Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
