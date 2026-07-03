# Phase 13: Fresh Save Format + Level Registry/Data - Pattern Map

**Mapped:** 2026-06-29
**Files analyzed:** 9 (3 new, 6 modified)
**Analogs found:** 9 / 9 (every file is a generalization/extension of shipped code)

## Orientation

This phase has **zero external-research surface** — every new capability is a generalization of an existing, kid-validated seam in this repo. The planner should treat all excerpts below as the literal idiom to extend, not redesign. The two structural moves:

1. **Save:** extend `src/progress.js` (new key/version in `config.js` + a `levels` cleared-map + derived-unlock helper) keeping the pure-factory firewall intact.
2. **Levels:** split `src/level.js` into `src/levels/{build.js, level-01.js, index.js}`, lifting geometry + the `buildLevel` body VERBATIM, with the `Rect` guard staying INSIDE `buildLevel`.

Then rewire the single import site (`src/scenes/game.js:22`) and extend the two gate scripts.

## File Classification

| New/Modified File | New/Mod | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|---------|------|-----------|----------------|---------------|
| `src/config.js` | modified | config | constants | `src/config.js` (`CONFIG.SAVE`) | self (extend in place) |
| `src/progress.js` | modified | model/store | CRUD (load/validate/serialize/write) | `src/progress.js` (shipped seam) | self (extend in place) |
| `src/levels/build.js` | new | builder | transform (data → entities) | `src/level.js` `buildLevel` | exact (verbatim lift) |
| `src/levels/level-01.js` | new | data module | static data | `src/level.js` `LEVEL` object | exact (verbatim lift) |
| `src/levels/index.js` | new | registry | lookup/ordering | (synthesized; mirrors module-shape conventions) | role-match |
| `src/scenes/game.js` | modified | scene | request-response (load/build/persist) | `src/scenes/game.js` (shipped) | self (rewire imports + reads) |
| `src/math/brain.js` | modified (1 line) | service | transform (selection) | `src/math/brain.js` `calculateWeights` | self (thread `allowedTables`) |
| `scripts/smoke-progress.mjs` | modified | test | batch (node assertions) | `scripts/smoke-progress.mjs` (shipped) | self (add cases) |
| `scripts/check-progress.sh` | modified | test | batch (grep gate) | `scripts/check-progress.sh` (shipped) | self (update + add asserts) |

> Note: `src/level.js` is DELETED after the lift (research Open Question #1 recommends delete, not shim — only one import site exists). Removing it is part of `game.js`'s rewire wave.

## Pattern Assignments

### `src/config.js` (config, constants) — MODIFY

**Analog:** `src/config.js` `CONFIG.SAVE` block (lines 80-86).

**Existing block to bump** (lines 80-86):
```javascript
// --- Save / persistence (NEW namespaced key — independent of the archive's mathlab_save_*) ---
SAVE: {
  KEY: "mathlab_platformer_v1", // localStorage key for the platformer progression
  VERSION: 1, // bump for future save-format migrations
},
```

**Apply:** bump `KEY` to a NEW string (research A1 suggests `"mathlab_platformer_v2"`) and `VERSION` to `2`. The new key is the PRIMARY clean-reset guard (v1 blob becomes invisible); the version gate in `loadSave` is the second guard. Any registry/level constants the schema needs (none strictly required — `allowedTables` is data) also live here per the "no magic numbers" canon (config.js line 3). Keep the leaf-only firewall: `config.js` imports nothing.

> Grep coupling (research Pitfall 6): `mathlab_platformer_v1` is hard-greped in `check-progress.sh:41`. Bumping the key here REQUIRES updating that grep in the same wave or the gate fails. `smoke-progress.mjs:86` reads `CONFIG.SAVE.VERSION` (the constant, not a literal) so the version bump auto-propagates there.

---

### `src/progress.js` (model/store, CRUD) — MODIFY

**Analog:** `src/progress.js` (the whole shipped seam — extend in place, do not rewrite).

**Pure-factory firewall to preserve** (lines 54-74) — guards stay verbatim:
```javascript
export function createProgress(saved) {        // PURE: never reads localStorage
  let xp =
    saved && typeof saved.xp === "number" && isFinite(saved.xp) && saved.xp >= 0
      ? saved.xp
      : 0;
  let level =
    saved &&
    typeof saved.level === "number" &&
    Number.isFinite(saved.level) &&
    saved.level >= 1
      ? Math.floor(saved.level)
      : 1;
```

**Defaults to extend** (lines 157-159) — add the empty `levels` map:
```javascript
function defaults() {
  return { xp: 0, level: 1, accuracy: {}, history: {} };  // ADD: levels: {}
}
```

**Validate idiom to mirror for the cleared map** (the named-key, range-checked copy — NEVER spread the blob; lines 166-203 show the existing accuracy/history branches). Add a parallel `levels` branch with STRICT boolean coercion and tolerate-junk-ids:
```javascript
// existing accuracy branch (lines 182-189) — the idiom to copy:
if (data.accuracy && typeof data.accuracy === "object") {
  Object.entries(data.accuracy).forEach(([k, v]) => {
    const table = parseInt(k, 10);
    if (table >= 1 && table <= 9 && typeof v === "number" && v >= 0 && v <= 1) {
      out.accuracy[table] = v;
    }
  });
}
// NEW levels branch (research Code Examples) — same shape, boolean coercion:
//   out.levels[id] = { cleared: rec.cleared === true };
```

**Serialize to extend** (lines 131-139) — keep the same shape + version, add `levels`:
```javascript
serialize(brainSnapshot) {
  return {
    version: CONFIG.SAVE.VERSION,
    xp,
    level,
    accuracy: brainSnapshot?.accuracy ?? {},
    history: brainSnapshot?.history ?? {},
    // ADD: levels (built from the closure-local cleared map; only { cleared: true } entries)
  };
},
```

**New helpers to add to the returned object** (mirror the getter style at lines 91-140): seed a closure-local `cleared` map from `saved.levels` (same `=== true` strictness), then expose `isLevelCleared(id)` and `markCleared(id)`. See research "Extend the save shape" Code Example for the exact synthesized form.

**Guarded seam to keep untouched** (lines 208-269): `storageAvailable()`, `loadSave()`, `writeSave()` stay defined-not-called at import; `loadSave` still returns `defaults()` on EVERY failure path (no storage / missing key / corrupt JSON / version mismatch / throwing getItem) and the `QuotaExceededError` catch in `writeSave` stays. The new `levels` data rides through this seam unchanged.

> Firewall (check-progress.sh:65-67): `progress.js` must NOT import the engine. Derived unlock that needs `LEVEL_ORDER` lives in `levels/index.js` (which imports only data), NOT here — `progress.js` only owns the cleared FACTS (`isLevelCleared`/`markCleared`).

---

### `src/levels/build.js` (builder, transform) — NEW (verbatim lift of `src/level.js` buildLevel)

**Analog:** `src/level.js` `buildLevel` (lines 114-185) — lift the body VERBATIM; only the geometry SOURCE changes (read from `levelData.geometry` instead of the module-local `LEVEL`).

**a727c13 guard placement — MUST stay INSIDE the function body** (lines 119-123):
```javascript
export function buildLevel(level) {        // becomes buildLevel(levelData)
  if (typeof Rect === "undefined") {       // guard INSIDE the body, NOT module top level
    throw new Error(
      "level.js: Kaplay global `Rect` is missing — check kaplay({ global }) / engine version",
    );
  }
```
Update the error string's filename to `build.js`. Do NOT hoist this guard to module top level — that is the exact a727c13 bug (research Pitfall 2): it throws at import (ES imports are hoisted before `kaplay({global})` runs) and blanks the game. Greps pass; only a real browser boot catches it.

**Merged-floor collider idiom — lift VERBATIM (anti seam-stick, do NOT switch to per-tile/`addLevel`)** (lines 125-142):
```javascript
for (const run of level.floors) {          // becomes: for (const run of g.floors)
  add([
    rect(run.w, CONFIG.FLOOR_THICKNESS),
    pos(run.x, FLOOR_Y),
    area(),
    body({ isStatic: true }),
    "ground",
  ]);
  for (let tx = run.x; tx < run.x + run.w; tx += T) {
    add([sprite("ground"), pos(tx, FLOOR_Y)]);   // visual-only tiles, NO area()/body()
  }
}
```

**Tightened spike hitbox — lift VERBATIM (Pitfall 3, fair points-only hit)** (lines 169-181):
```javascript
const spikeOffX = (CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_W) / 2; // center horizontally
const spikeOffY = CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_H;       // drop to lower points
for (const s of level.spikes) {            // becomes: for (const s of g.spikes)
  add([
    sprite("spike"),
    pos(s.x, s.y),
    area({
      shape: new Rect(vec2(0), CONFIG.SPIKE_HITBOX_W, CONFIG.SPIKE_HITBOX_H),
      offset: vec2(spikeOffX, spikeOffY),
    }),
    "spike",
  ]);
}
```
Coins (lines 159-162: `sprite("coin")` + `coin.play("spin")`) and goal (line 184) lift identically.

**Import depth (research Pitfall 5):** `build.js` lives in `src/levels/`, so the config import is `../config.js` (TWO directories deep), NOT `./config.js` as in `src/progress.js`. Mirror `src/math/brain.js`. Keep the leaf consts at top: `const T = CONFIG.TILE_SIZE; const FLOOR_Y = CONFIG.FLOOR_Y;` (level.js lines 34-35).

---

### `src/levels/level-01.js` (data module, static data) — NEW (verbatim geometry lift)

**Analog:** `src/level.js` `LEVEL` object (lines 44-107) — lift the floors/platforms/coins/spikes/goal/checkpoints values VERBATIM, wrapped in the forward-looking descriptor schema.

**Geometry to preserve EXACTLY** (the regression smoke deep-equals this against the v3.0 values — research Validation row "LVL-02 regression"). Example fragment (lines 46-50):
```javascript
floors: [
  { x: 0, w: 560 },   // opening run
  { x: 720, w: 480 }, // middle run (after gap 1)
  { x: 1360, w: 880 },// final run to the goal (after gap 2), ends at 2240
],
```
Carry the spike/checkpoint expressions verbatim too — they reference `CONFIG.SPIKE_SIZE` / `FLOOR_Y - CONFIG.GOAL_SIZE` / `FLOOR_Y - 48` (level.js lines 83-106). Keep `checkpoints` INSIDE `geometry` (research A5 / Scene rewire note: `game.js` reads them, so the read-site must move with them).

**Descriptor schema to wrap it in** (research Pattern 3 — required fields + optional placeholder slots Phases 15-18 fill, NOT reshape):
```javascript
import { CONFIG } from "../config.js";   // ../ — level-01.js is in src/levels/
const FLOOR_Y = CONFIG.FLOOR_Y;
export const LEVEL_01 = {
  id: "level-01",
  displayName: "...",            // copy is discretion; placeholder fine
  allowedTables: [6, 7, 8, 9],   // difficulty seam (wired for real Phase 16; A4)
  geometry: { floors, platforms, coins, spikes, goal, checkpoints },  // verbatim v3.0
  // optional placeholder slots — buildLevel ignores unset ones:
  mechanics: [],   // Phase 15/16
  theme:    null,  // Phase 18
  parallax: null,  // Phase 18
};
```

**Firewall:** this data module references NO engine globals at all (no `add`/`rect`/`Rect`/`typeof Rect`). The negative grep (Wave 0) asserts this. `../config.js` import only.

---

### `src/levels/index.js` (registry, lookup/ordering) — NEW

**Analog:** synthesized (no prior registry); mirrors the node-safe, engine-free module shape of `progress.js`/`brain.js`. See research "registry + derived-unlock helper" Code Example for the exact form.

**Pattern (pure, no engine):**
```javascript
import { LEVEL_01 } from "./level-01.js";
const LEVELS = [LEVEL_01];                          // ordered — single source of order
export const LEVEL_ORDER = LEVELS.map((l) => l.id); // ["level-01"]
const BY_ID = new Map(LEVELS.map((l) => [l.id, l]));
export function getLevel(id) {
  return BY_ID.get(id) ?? LEVELS[0];                // forgiving: bad id → first level
}
export function isUnlocked(id, progress) {          // DERIVED — nothing stored
  const i = LEVEL_ORDER.indexOf(id);
  if (i <= 0) return true;                          // first (or unknown→first) always open
  return progress.isLevelCleared(LEVEL_ORDER[i - 1]);
}
```
`isUnlocked` is the single source of unlock truth (research Pitfall 4): store ONLY `cleared` in `progress.js`; derive `unlocked` here from `LEVEL_ORDER`. Imports only `./level-01.js` — no engine, no storage (keeps it node-importable for the smoke).

---

### `src/scenes/game.js` (scene, request-response) — MODIFY (rewire imports + reads)

**Analog:** `src/scenes/game.js` itself — minimal rewire; the load/seed/build/persist spine and ALL anti-leak contracts stay.

**The one import site to change** (line 22):
```javascript
import { LEVEL, buildLevel } from "../level.js";   // REMOVE
// REPLACE with:
import { getLevel, LEVEL_ORDER } from "../levels/index.js";
import { buildLevel } from "../levels/build.js";
```

**Load-by-id + thread allowedTables into the brain** (currently lines 56-61, 73). Pick the level from the registry, pass its `allowedTables` to `createBrain`:
```javascript
const level = getLevel(data?.levelId ?? LEVEL_ORDER[0]);   // load by id (default first)
const saved = loadSave();
const progress = createProgress(saved);
const brain = createBrain({
  seedAccuracy: saved.accuracy,
  seedHistory: saved.history,
  allowedTables: level.allowedTables,   // difficulty seam (enforced Phase 16)
});
// ...
buildLevel(level);          // was buildLevel(LEVEL); Rect guard runs here, post-kaplay-init
```

**Checkpoint read-site moves with the geometry** (lines 89-91): `for (const cp of LEVEL.checkpoints)` becomes `for (const cp of level.geometry.checkpoints)` (research A5 — `checkpoints` now lives inside `geometry`).

**Persist the cleared fact on clear** — extend the existing `onClear` block (lines 161-177). After `progress.addXp(table)` and before/with `writeSave`, mark this level cleared so it round-trips:
```javascript
const leveledUp = progress.addXp(table);
progress.markCleared(level.id);                         // NEW: SAVE-06 cleared fact
hud.refresh();
if (leveledUp) hud.flashLevelUp();
fx.clearBurst();
writeSave(progress.serialize(brain.snapshot()));        // serialize now includes levels
```

**Untouched contracts to preserve:** the closure-only run state (lines 36-47), `reset()`/`respawn()` reposition-in-place (lines 103-112), the `onHide`/`onSceneLeave` anti-leak cancellers (lines 208-224). This phase adds NO scenes (level-select is Phase 14).

---

### `src/math/brain.js` (service, transform) — MODIFY (one line, do not retune)

**Analog:** `src/math/brain.js` `calculateWeights` (lines 128-161) — already accepts `allowedTables` and filters the pool; the LOCKED 6-9 weighting math is NEVER touched.

**The only wiring gap** (line 220-226): `nextQuestion` currently calls `calculateWeights(undefined)` (all 9 tables). Accept an `allowedTables` option on `createBrain({...})` (line 60) and thread it into that call so per-level pools take effect. The weighting algorithm itself (lines 132-160) stays byte-for-byte.
```javascript
// line 226 today:
const weights = calculateWeights(undefined);   // → calculateWeights(allowedTables)
```
> Caution: this is a difficulty-seam WIRING change only. Per CONTEXT, `allowedTables` is enforced for real in Phase 16; in Phase 13 it must merely thread through without changing selection for `[6,7,8,9]`-equivalent pools. Do NOT alter `calculateWeights`'s formulas.

---

### `scripts/smoke-progress.mjs` (test, batch) — MODIFY (add cases)

**Analog:** `scripts/smoke-progress.mjs` itself — same `check(cond, msg)` + `failures++` idiom (lines 26-31), same direct-import-of-real-modules approach (lines 22-24), same `serialize → createProgress(blob)` round-trip pattern (lines 85-90).

**Existing round-trip idiom to reuse for the cleared map** (lines 85-90):
```javascript
const blob = p.serialize(brain.snapshot());
check(blob.version === CONFIG.SAVE.VERSION, `...`);
const restored = createProgress(blob);
check(restored.xp === p.xp, `...`);
```

**Cases to add** (research Wave 0 Gaps):
- SAVE-06: `markCleared(id) → serialize → createProgress(blob) → isLevelCleared(id) === true`.
- SAVE-06 derived: import `isUnlocked` from `../src/levels/index.js`; level-01 unlocked from empty; next-level locked until predecessor cleared.
- SAVE-05: hand-construct corrupt/foreign/junk-`levels` blobs → `createProgress(badBlob)` yields safe defaults, never throws.
- LVL-02: `import { LEVEL_ORDER, getLevel } from "../src/levels/index.js"`; assert `LEVEL_ORDER[0] === "level-01"`, `getLevel("nope")` falls back to first.
- LVL-02 regression: deep-equal `getLevel("level-01").geometry` against the v3.0 `LEVEL` values (verbatim proof).
- SAVE-07: keep the existing xp/level/accuracy/history cases green under the new shape.

Keep the import paths node-relative from repo root (`../src/...`), matching lines 22-24.

---

### `scripts/check-progress.sh` (test, batch) — MODIFY (update + add asserts)

**Analog:** `scripts/check-progress.sh` itself — same `fail()` helper (lines 26-29), same existence+`node --check` loop (lines 33-36), same positive `grep -q` / negative `grep -Eq` assertion style (lines 39-82).

**The grep that MUST update** (lines 41-42, research Pitfall 6):
```bash
grep -q 'mathlab_platformer_v1' "$ROOT/src/config.js" \
  || fail "missing versioned save key 'mathlab_platformer_v1' in src/config.js"
```
Replace `mathlab_platformer_v1` with the NEW key string (e.g. `mathlab_platformer_v2`), or the gate fails after the bump.

**Asserts to add** (mirror the existing positive-grep idiom at lines 39-62):
- `levels` / `cleared` / `isLevelCleared` / `markCleared` present in `src/progress.js`.
- registry existence: `src/levels/index.js`, `src/levels/build.js`, `src/levels/level-01.js` exist + `node --check` (extend the loop at line 33), `LEVEL_ORDER` exported in `index.js`, `buildLevel` defined in `levels/build.js`.
- NEGATIVE (a727c13): no top-level engine global in the levels DATA/registry — assert `level-01.js` and `index.js` contain no `typeof Rect` / bare `add(` / `kaplay`. (Mirror the negative firewall greps at lines 65-72.) `build.js` is allowed to reference `Rect` because it does so INSIDE `buildLevel` — scope that grep so it does not false-positive on build.js, or assert the guard line is inside the function.
- Final step stays: `node "$ROOT/scripts/smoke-progress.mjs"` (line 85).

## Shared Patterns

### Pure factory + defined-not-called guarded seam (THE firewall)
**Source:** `src/progress.js` lines 54-74 (pure factory), 208-269 (the seam).
**Apply to:** `progress.js`, `levels/index.js`, `levels/level-01.js` — every module the node smoke imports.
**Rule:** constructors take an already-loaded plain object and never touch storage; `storageAvailable()`/`loadSave()`/`writeSave()` are defined at module scope but only CALLED by the scene at runtime. Keeps modules node-importable (check-progress.sh:65-72 enforces no engine in progress.js).

### a727c13 — engine global guard INSIDE the function body
**Source:** `src/level.js` lines 25-32 (the comment) + 119-123 (the guard).
**Apply to:** `levels/build.js` ONLY (the sole engine-touching module this phase).
**Rule:** `typeof Rect === "undefined"` and every `add`/`rect`/`sprite`/`vec2`/`Rect` reference stay strictly inside `buildLevel`. Data/registry modules reference NO engine globals. Verify with a real browser boot — greps cannot catch a hoisted top-level guard.

### Untrusted-blob validation (named keys only, range-checked)
**Source:** `src/progress.js` `validate()` lines 166-203.
**Apply to:** the new `levels` cleared-map branch in `progress.js`.
**Rule:** copy ONLY named, range-checked keys into a fresh `defaults()` object — NEVER `{...data}` / `Object.assign(target, data)` (prototype-pollution T-01-01). Cleared flags coerced with `=== true`; unknown level ids tolerated/ignored (a junk id can never unlock a real level — unlock is derived from `LEVEL_ORDER`).

### Never-brick-on-bad-save (finite + shape guards)
**Source:** `src/progress.js` lines 58-74 (createProgress guards), 224-248 (loadSave failure paths).
**Apply to:** every numeric field and the new cleared map.
**Rule:** `Number.isFinite` + `>= 1` + `Math.floor` on numerics (a `{"level":1e400}` parses to Infinity and would freeze progression); `loadSave` returns `defaults()` on EVERY failure (no storage / missing key / corrupt JSON / version mismatch / throwing getItem) and never throws into the caller.

### Relative-import depth by directory
**Source:** `src/progress.js:32` (`./config.js`) vs `src/math/brain.js:32` (`../config.js`).
**Apply to:** all new `src/levels/*` modules.
**Rule:** modules in `src/levels/` import `../config.js` (mirror `src/math/`); `game.js` in `src/scenes/` imports `../levels/index.js` and `../levels/build.js`. Wrong depth 404s in the browser but passes `node --check` (Pitfall 5).

### Difficulty seam (allowedTables → createBrain)
**Source:** `src/math/brain.js` `calculateWeights(allowedTables)` lines 128-161 (already filters); `nextQuestion` line 226 (`calculateWeights(undefined)` today).
**Apply to:** `levels/level-01.js` (the `allowedTables` data field), `game.js` (passes it to `createBrain`), `brain.js` (threads it into `nextQuestion`).
**Rule:** `allowedTables` is a DATA field on the level descriptor; the LOCKED weighting algorithm is NEVER touched — only the option plumbing changes. Fully enforced Phase 16.

### Structural gate ↔ module coupling
**Source:** `scripts/check-progress.sh` (greps as the project's "tests") + `scripts/smoke-progress.mjs` (node assertions).
**Apply to:** every save-shape / registry change.
**Rule:** the bash greps live separate from the modules they verify, so they drift silently — update them in the SAME wave as the change (the `mathlab_platformer_v1` grep at check-progress.sh:41 is the canonical trap). Greens prove structure; a real browser boot proves it runs.

## No Analog Found

None. Every file in this phase is either the same file extended in place or a verbatim generalization of `src/level.js` / `src/progress.js`. `src/levels/index.js` is the only "new shape," and even it follows the established node-safe, engine-free, leaf-import module conventions of `progress.js`/`brain.js`.

## Metadata

**Analog search scope:** `src/`, `src/math/`, `src/scenes/`, `src/ui/`, `scripts/`
**Files scanned:** `src/progress.js`, `src/level.js`, `src/config.js`, `src/scenes/game.js`, `src/math/brain.js`, `scripts/smoke-progress.mjs`, `scripts/check-progress.sh` (plus grep sweep for `level.js`/`allowedTables`/`createBrain` import sites — single import site confirmed at `src/scenes/game.js:22`).
**Pattern extraction date:** 2026-06-29
```