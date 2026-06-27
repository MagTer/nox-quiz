---
phase: 11-progression-persistence
reviewed: 2026-06-27T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/config.js
  - src/progress.js
  - src/math/brain.js
  - src/ui/mathGate.js
  - src/scenes/game.js
  - src/ui/hud.js
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-06-27
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 11 adds progression and persistence to the zero-dependency Kaplay platformer:
a pure `src/progress.js` (XP/level math + guarded localStorage seam), an extended
`src/math/brain.js` (seedable + `snapshot()`), the one-line `mathGate.js` change,
scene wiring in `game.js`, and a new fixed HUD in `hud.js`.

The core math was verified by direct simulation and matches the archive verbatim:
the threshold curve `round(200·1.3^(L-1))` produces 200/260/338/439/571/743 for
levels 1–6; the surplus-carry-over `while`-loop is the correct defensive form of the
archive's single `if` and handles multi-level awards and a zero/unknown-table award
(falls to `XP_EASY`, never crashes); `serialize`/`validate` round-trips cleanly; the
firewalls hold (progress.js and brain.js import only `config.js`, no engine/storage);
the localStorage seam try-catches every failure mode (no storage, corrupt JSON,
version mismatch, quota, throwing getItem) and never throws; the brain seeding
validates per-key with range checks (no spread of the untrusted blob), `snapshot()`
returns true copies (verified no shared-reference mutation), the 6–9 weighting is
intact, distractor generation always yields 3 distinct options across the full
1–9 × 1–10 space, and `createBrain()` with no args still works.

Two latent-but-real defects were found: an asymmetric numeric-validation gap that lets
a corrupt save permanently freeze progression, and an app-global `onHide` listener that
is not cancelled on scene teardown (a closure leak that bites on any future replay path).
Neither is a shipping blocker for the single-`go()` current flow, hence WARNING not BLOCKER.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `level` validation is not `isFinite`-guarded — a corrupt save freezes progression forever

**File:** `src/progress.js:62-65` (and identically `src/progress.js:165-168` in `validate`)
**Issue:**
`xp` is validated with `typeof === "number" && isFinite(xp) && xp >= 0`, but `level`
is validated only with `typeof === "number" && level >= 1`. `isFinite` is missing for
`level`. `JSON.parse('{"version":1,"level":1e400}')` yields `level: Infinity`
(confirmed: `JSON.parse("1e400") === Infinity`), and `Infinity >= 1` is true,
`Math.floor(Infinity) === Infinity`, so the garbage value passes both `createProgress`
and the `validate()` seam.

Downstream consequences (all confirmed by simulation):
- `getLevel()` → `Infinity`; the HUD badge renders `"LVL Infinity"`.
- `nextThreshold()` → `threshold(Infinity)` → `round(200·1.3^(Infinity-1))` → `Infinity`.
- In `hud.refresh()`, `denom = Infinity`, `frac = xp / Infinity = 0` → the XP bar is
  permanently empty.
- In `addXp`, the loop condition `xp >= threshold(level)` is `xp >= Infinity` → always
  false, so XP accumulates but the player can never level up again. Progression is
  permanently bricked from a single corrupt write.

This is the exact "defensive validation of corrupt/garbage saved data" class the phase
mandates, and the asymmetry with the already-correct `xp` guard makes it clearly an
oversight rather than intent.

**Fix:** Add the same finite check to `level` in both places:
```js
// src/progress.js:62 (createProgress)
let level =
  saved && typeof saved.level === "number" && isFinite(saved.level) && saved.level >= 1
    ? Math.floor(saved.level)
    : 1;

// src/progress.js:165 (validate)
out.level =
  typeof data.level === "number" && isFinite(data.level) && data.level >= 1
    ? Math.floor(data.level)
    : 1;
```
(Optionally also clamp to a sane upper bound, but `isFinite` alone closes the freeze.)

### WR-02: `onHide` listener is registered on the app-global event bus and never cancelled on scene teardown

**File:** `src/scenes/game.js:200`
**Issue:**
`onHide(() => writeSave(...))` is registered inside the scene closure, but in the
vendored engine (`lib/kaplay.mjs`) `onHide(f)` resolves to `e.events.on("hide", f)` —
the **app-level** event bus, not the scene's local handler set. Unlike object-scoped
handlers (`player.onCollide`, `box.onClick`) and unlike `destroyAll(tag)` cleanup,
this app-global listener is NOT torn down when the scene leaves, and the returned
canceller is discarded.

Today this is not triggerable: `src/main.js` does a single `go("game")` at boot and
respawn is reposition-in-place (no scene re-entry). But the moment any future flow
re-enters the scene (level select, "play again", restart-on-clear), each entry stacks
another permanent `onHide` listener, each closing over a *dead* scene's `progress`/
`brain`. On the next tab-hide every stale listener fires and serializes an old
snapshot, so a later listener can overwrite the live save with stale progress — a
data-integrity bug. This is the "closure-state leak across replays" failure mode the
phase set out to prevent everywhere else (the brain/HUD/gate all correctly use the
factory + tag-destroy pattern; only this app-global handler escapes it).

**Fix:** Capture the canceller and cancel it on scene teardown, e.g. via Kaplay's
scene-leave / object-death seam so it cannot outlive the scene:
```js
const hideHandler = onHide(() => writeSave(progress.serialize(brain.snapshot())));
// Bind cleanup to a scene-scoped object's destruction so a replay can't stack handlers:
player.onDestroy(() => hideHandler.cancel());
// (or onSceneLeave(() => hideHandler.cancel()) if exposed)
```
At minimum, leave a code comment that re-entering the scene is unsafe until this
listener is cancelled, so a future phase does not add a replay path on top of the leak.

## Info

### IN-01: `levelCleared` is dead state — set but never read

**File:** `src/scenes/game.js:51, 163`
**Issue:** `let levelCleared = false;` is declared and set to `true` inside `onClear`,
but no code ever reads it. The comment says "the scene's side of 'cleared' is simply
that the player stays frozen," which makes the variable purely vestigial.
**Fix:** Remove the declaration and the assignment, or wire it into something
observable (e.g. guard against re-opening the gate). If it is being kept as an
intentional Phase-12 seam, leave a one-line TODO so it does not read as forgotten.

### IN-02: History window is clamped twice (validate + createBrain)

**File:** `src/progress.js:183-185` and `src/math/brain.js:94-96`
**Issue:** `validate()` already filters to booleans and `slice(-MASTERY_WINDOW)`, then
`createBrain`'s seed path filters to booleans and `slice(-MASTERY_WINDOW)` again on the
same data. Harmless (idempotent) but redundant work and two sources of truth for the
same invariant.
**Fix:** Pick one layer to own window-clamping. Since `createBrain` must defensively
validate any seed (it can be called outside the loader), keeping it there and
simplifying `validate` to a pass-through copy is the cleaner split — or just leave a
comment that the double-clamp is intentional defense-in-depth.

### IN-03: Last-resort distractor pad loop is unreachable dead code

**File:** `src/math/brain.js:209-213`
**Issue:** The `while (chosen.length < 3)` pad block is proven unreachable for the
actual input domain: across all 1–9 × 1–10 (table × multiplicand) combinations the
distractor pool always reaches at least 3 distinct values (verified by exhaustive
simulation), so `chosen` is never short. The code is correctly defensive but is dead.
**Fix:** Acceptable to keep as a guard (the comment already calls it "should be
unreachable"); no change required. Flagged only so it is a known, deliberate
dead branch rather than an assumed-live path.

### IN-04: `XP_HARD`/`XP_EASY` table membership is computed via array `includes` on every award

**File:** `src/progress.js:77-80`, `src/math/brain.js` (HARD/EASY lists in `config.js:55-56, 76-77`)
**Issue:** `HARD_TABLES`/`EASY_TABLES` are intentionally duplicated across
`CONFIG.BRAIN` and `CONFIG.PROGRESS` (documented as different consumers, firewall
preserved — this is fine). The minor smell is that `calculateXp` uses
`HARD_TABLES.includes(table)` with no validation that `table` is in 1..9; an
out-of-range or `undefined` table silently awards `XP_EASY` rather than rejecting.
In the current single call site `q.a` is always a valid 1..9 table, so this is correct
today.
**Fix:** No change required given the constrained caller. If `addXp` ever becomes a
public/general entry point, add a `Number.isInteger(table) && table >= 1 && table <= 9`
guard so a malformed table cannot quietly mint XP.

---

_Reviewed: 2026-06-27_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
