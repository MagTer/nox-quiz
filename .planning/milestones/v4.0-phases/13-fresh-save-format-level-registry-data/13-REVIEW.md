---
phase: 13-fresh-save-format-level-registry-data
reviewed: 2026-06-29T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - scripts/smoke-progress.mjs
  - scripts/check-progress.sh
  - src/config.js
  - src/progress.js
  - src/levels/build.js
  - src/levels/level-01.js
  - src/levels/index.js
  - src/scenes/game.js
  - src/math/brain.js
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-06-29
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the Phase 13 fresh-save-format + level-registry layer against the
project's hard constraints: the import-firewall (a727c13 — no engine globals
at module top level), the never-brick save contract (validate named,
range-checked keys; never spread untrusted data), and the node-importable
purity of `progress.js` and the `src/levels/` modules.

The security posture is strong. I independently verified that:

- Prototype-pollution is closed on BOTH the `createProgress` seeding path AND
  the `validate()` path, including the harder case where `__proto__` arrives as
  a real own key from `JSON.parse` (the smoke test only exercises the object-
  literal case, which is the *weaker* one — see IN-01). No pollution of
  `Object.prototype` occurs.
- `Infinity`/`NaN`/negative/foreign save blobs are all sanitized to safe
  defaults and never throw or brick progression.
- The a727c13 firewall holds: `level-01.js` and `index.js` reference no engine
  globals; `build.js` defers its one `Rect` use behind a runtime guard inside
  the function body.
- The pure modules import cleanly under node, the smoke suite passes, and the
  weighted selector always returns four distinct choices including the answer.

No Critical defects found. The findings below are correctness edge cases that
are currently latent (single-level registry, trusted `allowedTables` source)
plus documentation drift that will mislead the next editor. Several are worth
fixing now precisely because the code is explicitly built to be extended
(future levels, `allowedTables` enforcement in Phase 16).

## Warnings

### WR-01: `isUnlocked` throws on a null/undefined `progress` for any non-first level

**File:** `src/levels/index.js:36-40`
**Issue:** `getLevel` is deliberately forgiving (junk id → first level, never
crashes), but its sibling `isUnlocked` is not. For the first level or an
unknown id (`i <= 0`) it short-circuits safely, but for any known non-first
level it calls `progress.isLevelCleared(...)` with no null guard. The moment a
second level is appended to `LEVELS` (the file's own comment says "Future
levels append here"), any caller that passes a missing/undefined `progress`
will throw `Cannot read properties of undefined (reading 'isLevelCleared')` —
exactly the boot-bricking class this registry is meant to be immune to. This is
latent only because `LEVEL_ORDER.length === 1` today.
**Fix:**
```js
export function isUnlocked(id, progress) {
  const i = LEVEL_ORDER.indexOf(id);
  if (i <= 0) return true; // first level / unknown id — always open
  // Forgiving: a missing or malformed progress means "not yet cleared".
  if (!progress || typeof progress.isLevelCleared !== "function") return false;
  return progress.isLevelCleared(LEVEL_ORDER[i - 1]);
}
```

### WR-02: `createBrain` does not validate `allowedTables`, so out-of-range tables flow into question generation

**File:** `src/math/brain.js:60`, `:128-161`, `:228-236`
**Issue:** `seedAccuracy` and `seedHistory` are rigorously range-checked
(keys 1..9, values 0..1), but `allowedTables` is passed straight through to
`calculateWeights`/`weightedRandom` with no validation. I verified that
`createBrain({ allowedTables: [99, 100] })` happily produces questions like
`100 × 7 = 700`. Today `allowedTables` originates from a trusted level
descriptor, so this is not a live exploit — but it is wired through from
`game.js` and the descriptor `allowedTables` is explicitly described as a
"difficulty seam" to be enforced in Phase 16. A typo'd or future data-driven
table value would silently generate nonsense questions rather than fail loud.
The defensive posture applied to the seeds should extend to this input.
**Fix:**
```js
const pool = Array.isArray(allowedTables)
  ? allowedTables.filter((t) => Number.isInteger(t) && t >= 1 && t <= 9)
  : null;
const allowed = pool && pool.length ? new Set(pool) : null;
// use `allowed` (already computed once) in calculateWeights instead of
// rebuilding `new Set(allowedTables)` per call.
```

### WR-03: `weightedRandom` fallback can return a table outside the allowed pool

**File:** `src/math/brain.js:165-174`
**Issue:** When the weight walk falls through (floating-point rounding, or an
all-zero/empty weight map), the function returns `CONFIG.BRAIN.HARD_TABLES[0]`
(table 6) unconditionally. If a level's `allowedTables` excludes 6 (a plausible
"easy levels only" descriptor in a later phase), the fallback emits a question
for a disallowed table, quietly violating the difficulty seam. The
`calculateWeights` equal-weight guard already handles the empty/all-mastered
case, so the remaining fallback should respect the same pool.
**Fix:**
```js
const weightedRandom = (weights) => {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [table, w] of entries) {
    roll -= w;
    if (roll <= 0) return parseInt(table, 10);
  }
  // Fallback: first table actually present in the weight map (respects the pool).
  return entries.length ? parseInt(entries[0][0], 10) : CONFIG.BRAIN.HARD_TABLES[0];
};
```

### WR-04: Stale save-key comment in `progress.js` contradicts the actual key

**File:** `src/progress.js:180`
**Issue:** The seam comment states "this layer reads/writes ONLY
CONFIG.SAVE.KEY (mathlab_platformer_v1)", but `CONFIG.SAVE.KEY` is
`"mathlab_platformer_v2"` (`src/config.js:87`) and the whole point of Phase 13
is the clean-reset key bump to v2. `check-progress.sh:52` greps specifically
for `mathlab_platformer_v2`, so the code is correct — only the comment is wrong.
A stale key reference in the persistence module is exactly the kind of comment
that will mislead the next person debugging a save bug into checking the wrong
localStorage key.
**Fix:** Change the comment to reference `mathlab_platformer_v2`, or better,
drop the parenthetical literal entirely and let `CONFIG.SAVE.KEY` be the single
source of truth:
```js
// NO migration: this layer reads/writes ONLY CONFIG.SAVE.KEY (the v2 clean-reset
// key). The school game's mathlab_save_* keys are NEVER touched (CONTEXT 35-36).
```

## Info

### IN-01: Prototype-pollution smoke test exercises the weaker (object-literal) case

**File:** `scripts/smoke-progress.mjs:206-224`
**Issue:** The SAVE-05 guard test builds the hostile blob as an object literal
`{ __proto__: { cleared: true }, ... }`. In an object literal, `__proto__` is
*special syntax* that sets the prototype and creates NO own key — so this test
never actually places a `__proto__` own property into the validated map. The
real attack vector is `JSON.parse('{"__proto__":{"cleared":true}}')`, which
DOES create a genuine own enumerable `__proto__` key. I verified the production
code handles the JSON case correctly, but the test does not cover it, so a
future regression in the `validate()`/seeding loops could pass the suite while
being vulnerable. Strengthen the fixture to use the JSON path.
**Fix:**
```js
const hostile = JSON.parse('{"version":2,"levels":{"__proto__":{"cleared":true},"ghost-level":{"cleared":"yes"}}}');
const q = createProgress(hostile);
```

### IN-02: `serialize()`/`loadSave()` JSDoc omit the `levels` field added this phase

**File:** `src/progress.js:46-49` (`serialize` typedef), `:264` (`loadSave`
return), `:298` (`writeSave` param)
**Issue:** Phase 13 added the per-level `levels` map to the serialized blob and
to `validate()`/`defaults()`, but the JSDoc return/param shapes still describe
the old `{ version, xp, level, accuracy, history }` shape. The doc now
understates the contract it documents.
**Fix:** Add `levels` to the `serialize` return typedef, the `loadSave` return
type, and the `writeSave` `@param` blob shape.

### IN-03: `loadSave` JSDoc return type also omits `accuracy`/`history` consistency note

**File:** `src/progress.js:264`
**Issue:** `@returns {{ xp, level, accuracy, history }}` — but `defaults()` and
`validate()` both also return `levels`. Same drift as IN-02; called out
separately because it is a different docblock.
**Fix:** `@returns {{ xp: number, level: number, accuracy: object, history: object, levels: object }}`

### IN-04: `snapshot().accuracy` always serializes all nine tables even when none were played

**File:** `src/math/brain.js:63-73`, `:257-266`
**Issue:** `accuracy` is initialized with all nine seed values, so every
`serialize`d save persists nine accuracy entries even for a brand-new player
who answered nothing. This is harmless (save stays far under quota and
round-trips correctly) and is faithful to the archive, but it does mean the
"fresh" blob is not minimal and a reader cannot distinguish "played and scored
0.4" from "never touched, seeded 0.4". Noting for clarity; no change required
unless a future phase wants per-table "seen" semantics.
**Fix:** None required. If minimal saves are ever desired, snapshot only tables
present in `history`.

### IN-05: `LEVEL_BOTTOM` (360) sits above the spike Y but the relationship is implicit

**File:** `src/config.js:30-31`, `src/levels/level-01.js:76-80`
**Issue:** Spikes sit at `FLOOR_Y - SPIKE_SIZE = 304` and the fall-respawn
threshold is `LEVEL_BOTTOM + FALL_MARGIN = 480`. These are consistent today,
but the coupling between `FLOOR_Y`, `LEVEL_BOTTOM`, and the checkpoint
`FLOOR_Y - 48` offset is spread across three files with only prose comments
tying them together. The level-01 checkpoint comment already flags this
("retune this offset if the player sprite height or FLOOR_Y ever changes").
Noting as a maintainability watch-point for when a second level is authored.
**Fix:** None required for this phase; consider a single documented derivation
when the level set grows.

---

_Reviewed: 2026-06-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
