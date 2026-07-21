---
phase: 29-mechanic-cleanup
reviewed: 2026-07-10T00:20:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - scripts/audit-phase21-mechanics.mjs
  - scripts/browser-boot.mjs
  - scripts/check-gate.sh
  - scripts/check-import-safety.sh
  - scripts/lib/mechanic-drive.mjs
  - scripts/lib/over-hole-check.mjs
  - scripts/lib/reachability.mjs
  - scripts/smoke-progress.mjs
  - src/config.js
  - src/fx.js
  - src/levels/build.js
  - src/levels/level-01.js
  - src/levels/level-02.js
  - src/levels/level-03.js
  - src/levels/level-04.js
  - src/levels/level-05.js
  - src/levels/level-06.js
  - src/levels/level-07.js
  - src/levels/level-08.js
  - src/mechanics/secretAlcove.js
  - src/progress.js
  - src/scenes/game.js
  - src/scenes/select.js
  - scripts/lib/audit-retry.mjs
  - scripts/screenshot-phase26.mjs
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 29: Code Review Report (Re-review — iteration 2, post-fix)

**Reviewed:** 2026-07-10T00:20:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

This is a re-review after a fix pass that addressed the original review's 2 BLOCKER findings
(CR-01: secret-alcove XP farmable via replay; CR-02: secret discovery lost on Escape-bail) and
3 of 4 WARNING findings (WR-01/02/03), with WR-04 deliberately deferred to Phase 30 per the
project roadmap.

**CR-01 (XP farming) — VERIFIED FIXED.** `src/mechanics/secretAlcove.js`'s collision handler now
checks `progress.hasSecretFound(levelId)` before awarding `XP_ALCOVE`. A previously-found alcove
still plays feedback (pop/chime/destroy) on replay but never re-awards XP or re-persists. Traced
through `src/progress.js`'s `hasSecretFound`/`markSecretFound` (closure-local, prototype-pollution
safe, correctly round-trips through `serialize()`/`createProgress()`) — no gap found.

**CR-02 (lost-on-Escape) — VERIFIED FIXED.** `secretAlcove.js` now calls the scene-supplied `save()`
callback synchronously, immediately after `progress.markSecretFound(levelId)`, mirroring the
goal-clear persist idiom in `src/scenes/game.js`. `writeSave` is guarded (never throws), and the
call order (mutate closure state → save) is correct — a save triggered here will always observe
the just-recorded fact.

**No new bugs found in the CR-01/CR-02 fix logic itself.** However, this re-review surfaced two
issues introduced or left behind *by the fix pass*, and two pieces of stale collect-mechanic
documentation residue the WR-01/02/03 cleanup passes did not reach (both outside the files those
commits touched). None are functional blockers to shipped gameplay; one (WARNING) silently
produces incorrect output from a verification tool.

WR-04 (no validator coverage for `geometry.secretAlcove`) is still absent from
`scripts/lib/over-hole-check.mjs` and `scripts/lib/reachability.mjs`, confirmed unchanged from the
prior review — per this task's explicit instruction, this is noted as still-deferred (Phase 30
scope), not re-raised as a new or regressed finding.

## Warnings

### WR-05: `screenshot-phase26.mjs`'s seeded save blob uses a stale save-format version, silently breaking its own level-unlock seed

**File:** `scripts/screenshot-phase26.mjs:90`
**Issue:** The CR-01/CR-02 fix commit (`09ee4df`) bumped `CONFIG.SAVE.VERSION` from `2` to `3`
(`src/config.js:191`, for MECH-06's new `secretFound` field). `scripts/browser-boot.mjs` and
`scripts/audit-phase21-mechanics.mjs` both correctly seed their save blobs with `version: 3`
(verified: `browser-boot.mjs:80`, `audit-phase21-mechanics.mjs:99`). `scripts/screenshot-phase26.mjs`
was itself touched by the very next fix commit in this pass (`71fe320`, the WR-03 follow-up,
which rewrote the `renderChoices`/collect-zone logic in this same file) but its `SAVE_BLOB.version`
literal was left at `2`.

Effect: `src/progress.js`'s `loadSave()` rejects any blob whose `data.version !== CONFIG.SAVE.VERSION`
and silently falls back to `defaults()` (empty `levels` map) — see `progress.js:335-338`. Since
`src/levels/index.js`'s `isUnlocked()` derives unlock purely from `cleared` facts, an empty
`levels` map means only `level-01` is ever unlocked. The script's per-level loop (`i = 0..7`)
still fires `ArrowDown`/`ArrowRight`/`Enter` key presses assuming all 8 tiles are selectable, but
`src/scenes/select.js`'s cursor only iterates *selectable* tiles — with only tile 0 selectable,
every row/col navigation attempt for `i >= 1` becomes a no-op and `Enter` re-selects `level-01`
every time. The script does not crash or fail its own `saved.length !== 10` check (it still writes
10 files) — it silently captures 10 screenshots of level-01, mislabeled as levels 2 through 8. This
is a genuine regression introduced by this fix pass, not a pre-existing issue (confirmed via
`git show 09ee4df` / `git show 71fe320`).
**Fix:**
```js
// scripts/screenshot-phase26.mjs:90
const SAVE_BLOB = {
  version: 3, // was: version: 2 — must match CONFIG.SAVE.VERSION (bumped in 09ee4df for MECH-06)
  xp: 0,
  level: 1,
  accuracy: {},
  history: {},
  levels: Object.fromEntries(LEVEL_ORDER.slice(0, -1).map((id) => [id, { cleared: true }])),
};
```

### WR-06: `secretAlcove.js`'s file-header docstring still claims "once per alcove object," but the CR-01 fix implemented "once per level"

**File:** `src/mechanics/secretAlcove.js:6-7`
**Issue:** The module's top-of-file overview comment reads: "it is a silent, flat XP bonus
(`CONFIG.PROGRESS.XP_ALCOVE`) awarded exactly once per alcove object." The CR-01 fix (correctly)
implemented the anti-farming gate against `progress.hasSecretFound(levelId)` — a **per-level**
fact, not a per-alcove-object one (the inline comment at lines 51-62, added by the same fix, is
accurate and explains this correctly). Every shipped level (`level-01`..`level-08`) currently
authors exactly one `secretAlcove` entry, so the discrepancy has no live effect today. But the
stale top-of-file claim is now flatly contradicted by the module's actual, deliberately-chosen
semantics: if a future level ever authors a second `secretAlcove` entry, only the *first* one
touched in that level would ever award XP — the second would silently fall into the
"already-found, feedback-only" branch on its very first touch, even on a brand-new save. A future
contributor relying on the file's own header docstring (rather than tracing the inline comment 45
lines down) would ship a level expecting two payouts and get one, with no error or warning
anywhere.
**Fix:** Update the header comment to match the implemented (and correct) per-level contract:
```js
// ...it is a silent, flat XP bonus (CONFIG.PROGRESS.XP_ALCOVE) awarded exactly once per LEVEL
// (not per alcove object — see progress.hasSecretFound/markSecretFound below), deliberately
// below XP_EASY so it reads as a bonus, not a shortcut. If a level ever authors more than one
// secretAlcove entry, only the first one touched pays out; author accordingly.
```

## Info

### IN-04: stale "answer zones, pickup slots" reference in `build.js`'s debug-overlay comment

**File:** `src/levels/build.js:61-63`
**Issue:** The `?debug=1` overlay comment still lists "answer zones, pickup slots" among the
normally-invisible entities the flag makes visible: `"...the tall door/gate/enemy blockers, answer
zones, pickup slots, and the secret alcoves."` Both `answerPickupSlot`/`answer-zone` entities were
removed with `collect.js` in this phase's Plan 01 (MECH-01) — the debug overlay no longer renders
any such thing, since it no longer exists. This is documentation staleness only (zero functional
impact); it just wasn't in the file list the WR-02 fix commit (`3243f9b`, which cleaned level
headers/comments) touched.
**Fix:**
```js
// Serve the game with ?debug=1 (e.g. http://localhost:8000/?debug=1) to make every
// normally-invisible physics/trigger entity faintly visible: the merged floor and
// platform colliders, the tall door/gate/enemy blockers, and the secret alcoves. ...
```

### IN-05: stale "collectZone" reference in `level-05.js`'s header comment

**File:** `src/levels/level-05.js:6`
**Issue:** `"light mechanic density (one door, two checkpoint gates, no enemy/collectZone) —
mirroring level-02's own mechanic mix exactly."` `collectZone` was removed project-wide in this
phase's Plan 01 (MECH-01); this level's header still names it as a mechanic type that could
conceivably have been present. `level-06.js`/`level-07.js`/`level-08.js` (touched by the WR-02
fix commit) no longer carry this phrasing — `level-05.js` was not in that commit's file list and
was missed.
**Fix:** Drop the dead `/collectZone` reference: `"...no enemy) — mirroring level-02's own
mechanic mix exactly."`

### IN-06: `mechanic-drive.mjs`'s deprecated `driveToXClimbing` retains stale collect-zone prose

**File:** `scripts/lib/mechanic-drive.mjs:108, 128, 148, 158-164`
**Issue:** `driveToXClimbing` is explicitly deprecated (see its own "DEPRECATION NOTE," line 254:
"retained for reference" — confirmed via grep that nothing calls it any more; `driveToXPlanned` is
the live driver everywhere). Its JSDoc/inline comments still reference `collect.js`,
"`renderChoices:false`," and "collect zones" throughout (e.g. line 159-161: "a prior encounter's
collect-zone challenge (`renderChoices:false`) is deliberately left OPEN by `resolveIfBoxed`").
Since the function is dead code kept only for historical reference, this is the lowest-priority
finding in this review — but it is stale collect-mechanic residue that a future reader could trip
over if `driveToXClimbing` is ever revived or copied from.
**Fix:** Low priority — either delete `driveToXClimbing` entirely (it has had zero callers since
the Phase 24 close-out per the file's own deprecation note) or, if kept for reference, prefix its
whole block with a one-line note that its internal comments predate the Phase 29 collect-mechanic
removal and describe retired behavior.

---

_Reviewed: 2026-07-10T00:20:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
