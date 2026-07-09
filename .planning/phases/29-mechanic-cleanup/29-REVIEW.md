---
phase: 29-mechanic-cleanup
reviewed: 2026-07-09T21:39:16Z
depth: standard
files_reviewed: 19
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
  - src/levels/level-03.js
  - src/levels/level-04.js
  - src/levels/level-06.js
  - src/levels/level-08.js
  - src/mechanics/secretAlcove.js
  - src/progress.js
  - src/scenes/game.js
  - src/scenes/select.js
findings:
  critical: 2
  warning: 4
  info: 0
  total: 6
status: issues_found
---

# Phase 29: Code Review Report

**Reviewed:** 2026-07-09T21:39:16Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

This phase (1) atomically removed the collect-the-answer mechanic and (2) added
secret-alcove discovery feedback (`fx.pop` + `fx.popupText` + a "pickup" chime) plus a
level-select star marker, backed by a save-format version bump (2→3, `secretFound`
field). The removal wave is structurally sound — `collect.js` is gone, `build.js` no
longer instantiates `collectZones`/`answerPickupSlots`, and the gate scripts
(`check-gate.sh`, `check-import-safety.sh`) were correctly re-pointed.

The new feedback/marker wave (Plan 29-02) has two correctness bugs in
`src/mechanics/secretAlcove.js` that undermine the very feature it implements: the XP
bonus can be farmed without limit by replaying a level, and a fully-supported
navigation path (Escape back to level-select mid-run) silently discards the discovery
before it is ever persisted. Both trace to the same missing guard against
`progress.hasSecretFound(levelId)`. There is also a secondary batch of quality
findings: the collect-mechanic removal left dead/stale references (empty
`collectZones`/`answerPickupSlots` arrays on 3 of the 8 levels, stale
"collect-the-answer zone" prose in 4 level files, and now-unreachable
`renderChoices:false`/`"answer-zone"` code paths in the Playwright harness scripts) —
directly contradicting the phase's own "atomically removed... across levels/harness
scripts" framing.

## Critical Issues

### CR-01: Secret-alcove XP bonus can be farmed without limit by replaying a level

**File:** `src/mechanics/secretAlcove.js:35-60`
**Issue:** `wireSecretAlcove`'s `onCollide` handler guards only against re-touching the
*same in-run object twice* (`found.has(alcoveObj)` — a `Set` that is recreated empty
every time the scene is entered). It never checks `progress.hasSecretFound(levelId)`
before calling `progress.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE)`. Levels stay selectable
after being cleared (`src/scenes/select.js` renders cleared tiles as still-selectable),
and `buildLevel()` (`src/levels/build.js:261-269`) rebuilds every `secret-alcove`
entity fresh on every entry regardless of prior discovery. The result: entering an
already-cleared level and touching its secret alcove again grants another
`CONFIG.PROGRESS.XP_ALCOVE` (+5) every single time, indefinitely — contradicting this
same module's own header comment ("awarded exactly once per alcove object") and the
entire reason a persisted `secretFound` fact/`hasSecretFound()` API exists in
`src/progress.js`. `scripts/smoke-progress.mjs`'s MECH-06 test (lines 762-781) only
checks that the flag round-trips through serialize; it never asserts that a second
`addBonusXp` call is blocked once `hasSecretFound` is already true, so this regression
has no test coverage.
**Fix:** Gate the award on the persisted fact, not just the in-run latch:
```js
player.onCollide("secret-alcove", (alcoveObj) => {
  if (found.has(alcoveObj)) return;
  found.add(alcoveObj);

  if (progress.hasSecretFound(levelId)) {
    // Already earned in a prior playthrough — still play the discovery feedback so a
    // replay feels rewarding, but never re-award XP.
    fx.pop(alcoveObj.pos.clone());
    audio.playSfx("pickup");
    destroy(alcoveObj);
    return;
  }

  const leveledUp = progress.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE);
  hud.refresh();
  if (leveledUp) hud.flashLevelUp();
  progress.markSecretFound(levelId);
  fx.pop(alcoveObj.pos.clone());
  fx.popupText(alcoveObj.pos.clone(), "+5 XP");
  audio.playSfx("pickup");
  destroy(alcoveObj);
});
```

### CR-02: Secret discovery (XP + star) is silently lost if the player Escapes before reaching the goal

**File:** `src/mechanics/secretAlcove.js:43-59`, `src/scenes/game.js:279-336`
**Issue:** `wireSecretAlcove` mutates `progress` in memory (`addBonusXp` +
`markSecretFound`) but never calls `writeSave()`. In `src/scenes/game.js`, `writeSave`
is invoked from exactly two places: the goal's `onClear` callback
(`game.js:242`) and the `onHide` tab-visibility handler (`game.js:318`). Escape
(`game.js:283`, `onKeyPress("escape", () => go("select"))`) is the documented,
intended way to "bail back to select mid-level with no forced replay of earlier
levels" (NAV-03) and does **not** save. If the player finds the secret alcove and then
presses Escape (a completely normal flow — she may not want to finish a hard level
just to bank a bonus she already found), the in-memory XP and `secretFound` fact are
discarded: `select.js` re-reads `createProgress(loadSave())` fresh on every entry
(`select.js:77`), so the star marker (`select.js:175-185`) will not appear even though
the alcove was genuinely touched. This is the primary persisted-state feature this
phase's Plan 02 exists to ship, and its main navigation path drops it silently.
**Fix:** Persist immediately when a genuinely new secret is found, mirroring the
goal-clear save pattern (needs `brain` and `writeSave` threaded into the mechanic, or a
`save` callback passed from `game.js`):
```js
// game.js
wireSecretAlcove({
  player,
  progress,
  hud,
  levelId: level.id,
  save: () => writeSave(progress.serialize(brain.snapshot())),
});

// secretAlcove.js
export function wireSecretAlcove({ player, progress, hud, levelId, save }) {
  ...
  progress.markSecretFound(levelId);
  save(); // persist the discovery immediately — Escape must not be able to drop it
  ...
}
```

## Warnings

### WR-01: Collect-mechanic removal left dead geometry fields on 3 of 8 levels

**File:** `src/levels/level-02.js:95-96`, `src/levels/level-05.js:88-89`, `src/levels/level-07.js:136-137` (confirmed via grep; not in the required-reading list but directly relevant to MECH-01's completeness claim), cross-referenced against `scripts/smoke-progress.mjs:487-489`
**Issue:** `src/levels/build.js` no longer reads `geometry.collectZones` /
`geometry.answerPickupSlots` anywhere (confirmed: the loops were deleted). Levels
01/03/04/06/08 (in this review's scope) correctly dropped these keys entirely. Levels
02/05/07 still carry `collectZones: []` / `answerPickupSlots: []` as dead data, and
`scripts/smoke-progress.mjs`'s regression pin for level-02 (line 487-489) still expects
them — so the "atomic" removal claimed for MECH-01 is inconsistent across the level
registry: 5 of 8 descriptors were cleaned, 3 were not.
**Fix:** Delete the two dead empty-array fields from `level-02.js`, `level-05.js`,
`level-07.js`, and drop the corresponding `collectZones: [], answerPickupSlots: [],`
lines from `smoke-progress.mjs`'s level-02 expected-geometry fixture, matching the
level-01/03/04 treatment already applied in this same diff.

### WR-02: Stale "collect-the-answer zone" prose left in 4 level-descriptor headers/comments

**File:** `src/levels/level-03.js:5`, `src/levels/level-04.js:5`, `src/levels/level-06.js:6-7,66`, `src/levels/level-08.js:6,95`
**Issue:** These files' module-doc headers and inline checkpoint comments still
describe a "collect-the-answer zone" / "collectZone@200" / "collectZone@150" that no
longer exists in their `geometry` (confirmed: none of these files declare
`collectZones` any more). E.g. `level-03.js:5`: *"Includes one enemy encounter, one
collect-the-answer zone, and one checkpoint gate."* — none of which is accurate any
more (2 enemies, 2 mathGates, no collect zone). This directly contradicts the phase's
stated goal of removing "all its references across config/levels/harness scripts."
**Fix:** Update each header comment to describe the level's actual current mechanic
mix (door/mathGate/enemy/secretAlcove counts) and rename the stale
`// before collectZone@N` checkpoint comments to reference whatever mechanic now sits
at that x (or simply "the mid-run approach", if nothing occupies that exact spot).

### WR-03: Now-unreachable `renderChoices:false` / `"answer-zone"` code paths left in the Playwright harness after collect.js's removal

**File:** `scripts/lib/mechanic-drive.mjs:34-42,56-59`, `scripts/browser-boot.mjs:417-420`, `scripts/audit-phase21-mechanics.mjs:4,7,267-283`
**Issue:** `deriveEncounters()` (`mechanic-drive.mjs:34-42`) now only ever emits
`renderChoices: true` entries (door/math-gate/enemy — the collect-zone entry that used
to produce `renderChoices: false` was removed). This makes several branches dead code
that still reads as live conditional logic:
- `resolveIfBoxed`'s `if (!renderChoices) return { resolved: null };` guard
  (`mechanic-drive.mjs:56-59`) can never be taken via the normal `deriveEncounters()` →
  caller path any more.
- `browser-boot.mjs:417-420`'s `if (!encounter.renderChoices) { continue; }` is
  likewise now unreachable.
- `audit-phase21-mechanics.mjs:271` / `:279`'s `if (r.tag === "answer-zone") ...`
  branches reference a tag (`"answer-zone"`) that `deriveEncounters()` never produces
  (only `"door"`, `"math-gate"`, `"enemy"`).
- Multiple large comment blocks across all three files still narrate `collect.js`'s
  now-deleted behavior in the present tense (e.g. `mechanic-drive.mjs:46-54`,
  `audit-phase21-mechanics.mjs:4,7`).

None of this breaks the harness (the dead branches are simply never entered), but it
directly contradicts the phase's stated scope ("deleted... all its references across
... harness scripts") and will mislead the next person who edits these files into
thinking collect-zone support is still live.
**Fix:** Delete the `renderChoices` parameter/branch from `resolveIfBoxed` (always
called with `true` now), the dead `if (!encounter.renderChoices)` block in
`browser-boot.mjs`, the `"answer-zone"` special case in
`audit-phase21-mechanics.mjs`'s pass/fail computation, and rewrite the surrounding
comments to drop the `collect.js` references.

### WR-04: Secret alcoves are unvalidated by the structural level gates

**File:** `scripts/lib/over-hole-check.mjs:34-38,48-66`, `scripts/lib/reachability.mjs:279-388`
**Issue:** Both structural validators enumerate only `doors` / `mathGates` / `enemies`
(`BARRIER_WIDTH` in each file lists exactly those three kinds). `geometry.secretAlcove`
— the new mechanic this phase's Plan 02 wires up across all 8 levels — is never
checked for floor-run support (over-hole-check) or spawn reachability
(reachability.mjs's `mechanic-reachability` check). A typo'd/mis-authored
`secretAlcove` coordinate (e.g. one that floats over a gap, or sits outside the
BFS-reachable component from spawn) would ship silently: `node
scripts/validate-levels.mjs` would report clean even though the star marker could
never actually be earned on that level.
**Fix:** Extend `over-hole-check.mjs`'s `BARRIER_WIDTH`/loop and
`reachability.mjs`'s `mechanic-reachability` loop to also cover
`geometry.secretAlcove` (width `CONFIG.ALCOVE_SIZE`), treating an unreachable/
over-hole secret as at least a WARN (it's optional content, so HARD-FAIL may be too
strict — but silent is wrong).

---

_Reviewed: 2026-07-09T21:39:16Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
