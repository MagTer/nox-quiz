# Phase 25: Levels 5–8, Difficulty Ramp & Select Grid - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 14 (4 new level descriptors, 1 new mechanic module, 9 modified files)
**Analogs found:** 14 / 14 (this phase is almost entirely "generalize an existing pattern" — RESEARCH.md already did the heavy analog-finding work; this file adds the concrete excerpts the planner needs)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/levels/level-05.js` (NEW) | model (pure-data descriptor) | transform (data → geometry consumed by build.js) | `src/levels/level-02.js` (softest existing level, no verticality) | exact |
| `src/levels/level-06.js` (NEW) | model | transform | `src/levels/level-01.js` (mixed mechanic types, no verticality) | exact |
| `src/levels/level-07.js` (NEW) | model | transform | `src/levels/level-04.js` (explicit full `bounds`, dense mechanics) | exact |
| `src/levels/level-08.js` (NEW) | model | transform | `src/levels/level-04.js` (hardest pool, explicit full `bounds`, capstone density) | exact |
| `src/levels/level-01.js`..`level-04.js` (EDIT — additive `secretAlcove`) | model | transform | (self — additive edit only, see Pattern below) | exact |
| `src/levels/level-02.js` (EDIT — MATH-01) | model | transform | (self — one-line literal edit) | exact |
| `src/levels/index.js` (EDIT — registry append) | config/registry | CRUD (append-only) | (self — mechanical append, zero derived-logic change) | exact |
| `src/levels/build.js` (EDIT — +secretAlcove loop) | service (level instantiation) | transform (geometry array → engine colliders) | `build.js`'s own existing `collectZones` block (lines 260-270) | exact |
| `src/mechanics/secretAlcove.js` (NEW) | service (mechanic wiring / collision handler) | event-driven | `src/mechanics/enemy.js` (fire-once `Set` latch, NOT `collect.js`'s multi-slot model) | exact |
| `src/progress.js` (EDIT — +`addBonusXp`) | service (pure XP/level module) | CRUD | `progress.js`'s own existing `addXp(table)` method | exact |
| `src/config.js` (EDIT — `+ROW_GAP`, `+XP_ALCOVE`) | config | — | `config.js`'s own existing `CONFIG.SELECT` / `CONFIG.PROGRESS` blocks | exact |
| `src/scenes/select.js` (EDIT — 2×4 grid + row cursor) | component (Kaplay scene) | request-response (keyboard/mouse → tile state) | (self — existing single-row layout + cursor, generalized) | exact |
| `src/scenes/game.js` (EDIT — +1 mechanic wiring call) | controller (scene orchestration) | event-driven | `game.js`'s own existing 4 `wireX({ player, brain })` call sites (lines 251-257) | exact |
| `src/math/brain.js` (EDIT — MATH-02, line 247 only) | service (LOCKED pure module) | transform | (self — one-literal edit) | exact |
| `scripts/smoke-progress.mjs` (EDIT — bump length assertion) | test | batch | (self — line 723 assertion) | exact |
| `scripts/browser-boot.mjs` / `scripts/audit-phase21-mechanics.mjs` (EDIT — row/col nav fix) | test (Playwright driver) | event-driven | (self — existing flat `ArrowRight` × i loop) | exact |

## Pattern Assignments

### `src/levels/level-05.js` / `level-06.js` / `level-07.js` / `level-08.js` (model, transform)

**Analog:** `src/levels/level-04.js` (full schema reference) and `src/levels/level-02.js` (softest-level precedent)

**Imports pattern** (level-04.js lines 1-9):
```javascript
// src/levels/level-04.js — "The Last Span" descriptor.
import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y; // 320
```
Every new level file must import ONLY `../config.js` — no engine globals, no sibling level imports. This is the project's Wave-0 negative-grep firewall (`a727c13`).

**Core descriptor shape** (level-04.js lines 11-131, verified full file):
```javascript
export const LEVEL_04 = {
  id: "level-04",
  displayName: "The Last Span",
  allowedTables: [6, 7, 8, 9],
  bounds: { left: 0, right: 6200, top: 0, bottom: 360 },
  geometry: {
    floors: [ { x, w }, ... ],       // contiguous runs; gaps are the space between runs
    platforms: [ { x, y, w, h }, ... ],
    coins: [ { x, y }, ... ],         // TOP-LEFT of 32x32 sprite, +16px offset from grid
    spikes: [ { x, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, ... ],
    goal: { x, y: FLOOR_Y - CONFIG.GOAL_SIZE },
    checkpoints: [ { x, y: FLOOR_Y - 48 }, ... ],   // one 64-80px before EVERY hazard/mechanic
    doors: [ { x, y: FLOOR_Y - CONFIG.DOOR.H }, ... ],
    mathGates: [ { x, y: FLOOR_Y - CONFIG.MATH_GATE.H }, ... ],
    enemies: [ { x, y: FLOOR_Y - CONFIG.ENEMY.H }, ... ],
    collectZones: [ { x, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0,1,2,3] }, ... ],
    answerPickupSlots: [ { x, y }, ... ],  // 4 per collectZone
  },
  mechanics: [],
  theme: null,
  parallax: null,
};
```

**New `secretAlcove` geometry array (level-05..08 AND additive retrofit into level-01..04):**
Not yet present in any file — add as a new optional array following the same `{x,y}` shape as `coins`, e.g.:
```javascript
secretAlcove: [ { x: 2450, y: FLOOR_Y - 80 } ], // off the main path, no signposting
```
`build.js`'s `?? []` guard convention (see below) means this key can be entirely absent on levels not yet retrofitted, so add it incrementally without touching other geometry.

**Numeric precedent for levels 5-8 (from level-03.js/level-04.js, cited in RESEARCH.md):**
- Max single-jump rise: keep well under 88.331px (validator's calibrated ceiling)
- level-03 uses 60-65px rises (narrow platforms); level-04 uses uniform 70px rises (wide spans)
- Gaps run roughly 120-200px; full-jump horizontal range ~156px
- Checkpoint lead: 64-80px before every spike/door/mathGate/enemy (e.g. level-04.js:95-98, "80px lead")

**bounds pattern for level-07/level-08 (verticality) — MUST be a complete 4-field literal:**
```javascript
// Source: src/levels/level-02.js lines 17-19 (bounds precedent, generalize top/bottom for verticality)
bounds: { left: 0, right: 4280, top: 0, bottom: 360 },
```
For level-07/08, use e.g. `top: -360` (one extra screen of climb upward), keeping `left`/`right`/`bottom` explicit too — a partial object silently falls back to the wrong `CONFIG.LEVEL_RIGHT` (2240px) per `game.js:83-93`'s all-or-nothing `level.bounds ?? {...}` merge (see Pitfall 2 in RESEARCH.md). level-05/level-06 (no verticality) may omit `bounds` entirely (level-01 precedent) or specify it explicitly.

**allowedTables (LOCKED by CONTEXT.md, copy verbatim):**
```javascript
// level-05: allowedTables: [2, 3, 4, 5],
// level-06: allowedTables: [4, 5, 6, 7],
// level-07: allowedTables: [6, 7, 8],
// level-08: allowedTables: [6, 7, 8, 9],
```

---

### `src/levels/level-02.js` (MATH-01 edit)

**Analog:** self — current line 15 (read this session):
```javascript
// src/levels/level-02.js:15 (BEFORE)
allowedTables: [1, 2, 3, 4, 5, 6, 7],
// AFTER (MATH-01 — drop the 1 only, keep 6/7 as-is):
allowedTables: [2, 3, 4, 5, 6, 7],
```

---

### `src/math/brain.js` (MATH-02 edit, LOCKED file)

**Analog:** self — `nextQuestion()` (read this session, lines ~245-252):
```javascript
// src/math/brain.js:247 (BEFORE)
const multiplicand = Math.floor(Math.random() * 10) + 1;
// AFTER (MATH-02 — ONLY this literal changes):
const multiplicand = Math.floor(Math.random() * 9) + 1;
```
Do NOT touch the `parseInt(k, 10)` radix calls elsewhere in the file, or `CONFIG.BRAIN.MASTERY_WINDOW: 10` in config.js — both are unrelated "10"s.

---

### `src/levels/index.js` (registry append)

**Analog:** self (full file read this session — 47 lines, mechanical append target)
```javascript
// src/levels/index.js:14-20 (BEFORE)
import { LEVEL_01 } from "./level-01.js";
import { LEVEL_02 } from "./level-02.js";
import { LEVEL_03 } from "./level-03.js";
import { LEVEL_04 } from "./level-04.js";

const LEVELS = [LEVEL_01, LEVEL_02, LEVEL_03, LEVEL_04];
```
Append 4 new imports + 4 new array entries in the same style. `LEVEL_ORDER`, `BY_ID`, `getLevel`, `isUnlocked` (lines 22-47) all derive automatically from `LEVELS`'s length/order — zero other code change needed in this file.

---

### `src/levels/build.js` (+secretAlcove geometry-array loop)

**Analog:** build.js's own `collectZones` block (lines 260-270, read this session — the correct, simplest template; NOT the doors/mathGates/enemies blocks, which need an apex-derived tall blocker an alcove does not need):
```javascript
// src/levels/build.js:260-270 — existing collectZones block (template to mirror)
for (const z of g.collectZones ?? []) {
  const zoneObj = add([
    rect(CONFIG.COLLECT.ZONE_W, CONFIG.COLLECT.ZONE_H),
    pos(z.x, z.y),
    area(),
    opacity(0),
    "answer-zone",
  ]);
  zoneObj.slots = z.slots;
}
```
New block (adapt, no `slots` field needed):
```javascript
for (const a of g.secretAlcove ?? []) {
  add([
    rect(24, 24), // smaller footprint than a 32x32 coin, reads as a "nook"
    pos(a.x, a.y),
    area(),
    opacity(0), // invisible — hidden via geometry placement only, no signposting
    "secret-alcove",
  ]);
}
```

---

### `src/mechanics/secretAlcove.js` (NEW — service/event-driven)

**Analog:** `src/mechanics/enemy.js` (full file read this session, 71 lines) — copy the fire-once `Set` latch idiom, but strip the `openChallenge`/pause/resume entirely (an alcove never freezes the player):
```javascript
// Source: src/mechanics/enemy.js:29-46 (latch pattern to mirror, freeze logic to STRIP)
export function wireEnemy({ player, brain }) {
  const defeated = new Set(); // fire-once latch, closure-local (anti-leak)
  player.onCollide("enemy", (enemyObj) => {
    if (defeated.has(enemyObj) || busy) return;
    busy = true;
    player.vel = vec2(0);
    player.paused = true;
    openChallenge({ brain, ... });
  });
}
```
**New module, adapted (no challenge, no freeze):**
```javascript
// src/mechanics/secretAlcove.js
export function wireSecretAlcove({ player, progress }) {
  const found = new Set(); // fire-once latch, closure-local

  player.onCollide("secret-alcove", (alcoveObj) => {
    if (found.has(alcoveObj)) return;
    found.add(alcoveObj);
    progress.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE); // NEW method + NEW config constant
    destroy(alcoveObj);
  });
}
```
Note the signature is `{ player, progress }` — NOT `{ player, brain }` like the other four mechanics. This is a new parameter shape at the `game.js` call site (see below), not a copy-paste of the existing four calls.

---

### `src/progress.js` (+`addBonusXp` method)

**Analog:** self — the existing `addXp(table)` method (lines 143-152, full file read this session):
```javascript
// src/progress.js:143-152 — the ONLY existing XP-award method (template for the new sibling)
addXp(table) {
  xp += calculateXp(table);
  let leveledUp = false;
  while (xp >= threshold(level)) {
    xp -= threshold(level); // carry surplus over, never reset to 0
    level += 1;
    leveledUp = true;
  }
  return leveledUp;
},
```
`calculateXp(table)` can only ever return `XP_EASY:10` or `XP_HARD:20` (config.js lines ~147-148) — there is no `table` value that yields 5 XP. Add a new sibling method in the SAME returned object / SAME closure, reusing the identical carry-over while-loop:
```javascript
// NEW — added alongside addXp, same closure, same file
addBonusXp(amount) {
  xp += amount;
  let leveledUp = false;
  while (xp >= threshold(level)) {
    xp -= threshold(level);
    level += 1;
    leveledUp = true;
  }
  return leveledUp;
},
```
Do NOT hack this via `addXp(fabricatedTable)` — impossible (only 10/20 reachable) and would corrupt the HARD/EASY XP semantics.

---

### `src/config.js` (+`ROW_GAP`, +`XP_ALCOVE`)

**Analog:** self — existing `CONFIG.SELECT` block (lines 232-241) and `CONFIG.PROGRESS` block (lines ~147-152), both read this session:
```javascript
// src/config.js:232-241 (BEFORE)
SELECT: {
  TILE_W: 96,
  TILE_H: 96,
  GAP: 24,
  ROW_Y: 180,
  START_X: 120,
  LABEL_SIZE: 28,
  GLYPH_SIZE: 22,
  HEADING_SIZE: 24,
},
```
Add `ROW_GAP: 16` (or up to 24 — MUST stay ≤36px to keep row-2 tiles inside the 640×360 internal canvas; `ROW_Y(180) + TILE_H(96) + ROW_GAP + TILE_H/2(48) <= 360`).

```javascript
// src/config.js CONFIG.PROGRESS block (BEFORE)
PROGRESS: {
  XP_EASY: 10,
  XP_HARD: 20,
  BASE_XP: 200,
  LEVEL_MULT: 1.3,
  HARD_TABLES: [6, 7, 8, 9],
  EASY_TABLES: [1, 2, 3, 4, 5],
},
```
Add `XP_ALCOVE: 5` alongside `XP_EASY`/`XP_HARD` — matches the project's "no magic numbers outside config.js" convention. Also remove/update the stale `IN-03 OVERFLOW FLAG` comment above `SELECT` (config.js lines ~225-231) once the grid ships — it predicted exactly this need and is now resolved.

---

### `src/scenes/select.js` (2×4 grid + row-aware cursor)

**Analog:** self (full file read this session, 196 lines) — the existing single-row layout and Left/Right-only cursor, generalized.

**Current flat layout** (select.js line 93):
```javascript
const x = S.START_X + t.i * (S.TILE_W + S.GAP);
const y = S.ROW_Y;
```
**Generalize to row/col:**
```javascript
const col = t.i % 4;
const row = Math.floor(t.i / 4);
const x = S.START_X + col * (S.TILE_W + S.GAP);
const y = S.ROW_Y + row * (S.TILE_H + S.ROW_GAP);
```

**Current cursor model** (select.js lines 155-172, Left/Right only, `moveCursor(delta)` wraps via `% selectable.length`):
```javascript
function moveCursor(delta) {
  if (selectable.length === 0) return;
  cursor = (cursor + delta + selectable.length) % selectable.length;
  paintCursor();
}
...
onKeyPress("left", () => moveCursor(-1));
onKeyPress("right", () => moveCursor(+1));
onKeyPress("enter", () => playCursor());
```
Extend with Up/Down that jump by a row-width stride (4) with **row-only wrap, no cross-edge wrap** per CONTEXT.md — this needs new logic distinct from the existing `% selectable.length` global wrap (which wraps across the WHOLE selectable list, not within a row). The planner should design a `moveCursorRow(delta)` that computes the tile's current row/col from `tiles[selectable[cursor]].i`, clamps (not wraps) across rows, and finds the nearest valid selectable tile in the target row.

**Everything else in this file (three-state palette, `paintCursor()`, mouse `onClick`, `isUnlocked` derivation) stays unchanged** — this is a layout + cursor-stride generalization only, not a rewrite.

---

### `src/scenes/game.js` (+1 mechanic wiring call)

**Analog:** self — the existing 4 mechanic-wiring call sites (lines 251-257, read this session):
```javascript
// src/scenes/game.js:251-257 (existing)
wireDoor({ player, brain });
wireGates({ player, brain });
wireEnemy({ player, brain });
wireCollect({ player, brain });
```
Add (note the different param shape — `progress`, not `brain`):
```javascript
import { wireSecretAlcove } from "../mechanics/secretAlcove.js"; // new import, mirrors lines 28-31
...
wireSecretAlcove({ player, progress }); // progress already lives in this closure (game.js:72)
```

---

### `scripts/smoke-progress.mjs` (bump assertion)

**Analog:** self, line 723:
```javascript
// BEFORE
check(LEVEL_ORDER.length === 4, "...");
// AFTER
check(LEVEL_ORDER.length === 8, "...");
```
No new byte-pinning `expectedGeometry` blocks are required for levels 5-8 (optional hardening only, per RESEARCH.md Open Question 2).

---

### `scripts/browser-boot.mjs` / `scripts/audit-phase21-mechanics.mjs` (select-nav row/col fix)

**Analog:** self — the existing flat navigation loop (both scripts, currently `ArrowRight` pressed `i` times):
```javascript
// BEFORE (both scripts, flat assumption)
for (let k = 0; k < i; k++) await page.keyboard.press("ArrowRight");
```
```javascript
// AFTER — row/col aware, matching select.js's new layout
const row = Math.floor(i / 4);
const col = i % 4;
for (let k = 0; k < row; k++) await page.keyboard.press("ArrowDown");
for (let k = 0; k < col; k++) await page.keyboard.press("ArrowRight");
```
Per the project's established convention (documented in STATE.md) for this class of duplicated Playwright code: fix BOTH copies by hand independently; do not extract a shared module in this phase.

## Shared Patterns

### Pure-data / no-engine-global firewall (levels)
**Source:** every existing `src/levels/*.js` file (e.g. `level-04.js:7`, `index.js:14-17`)
**Apply to:** `level-05.js`..`level-08.js`, and all additive edits to `level-01.js`..`level-04.js`
```javascript
import { CONFIG } from "../config.js"; // the ONLY allowed import in a level descriptor
```

### Fire-once collision latch (Set, closure-local)
**Source:** `src/mechanics/enemy.js:32` (`const defeated = new Set();`), also used in `door.js`
**Apply to:** `src/mechanics/secretAlcove.js`
```javascript
const found = new Set(); // NEVER module-level — must be GC'd with the scene
if (found.has(obj)) return;
found.add(obj);
```

### `?? []` optional-geometry-array guard
**Source:** `src/levels/build.js` — every geometry loop (e.g. `for (const z of g.collectZones ?? [])`)
**Apply to:** the new `secretAlcove` build.js loop, and confirms the additive level-01..04 retrofit is safe (a missing key on old levels never breaks the loop).

### No-magic-numbers-outside-config.js
**Source:** `src/config.js` header convention; `CONFIG.PROGRESS.XP_EASY/XP_HARD`, `CONFIG.SELECT.*`
**Apply to:** `XP_ALCOVE` (progress/secretAlcove), `ROW_GAP` (select.js) — both belong in `config.js`, never as bare literals in the consuming module.

## No Analog Found

None — every file in this phase's scope has a direct, concrete analog already in the codebase (this is a "generalize existing patterns" phase per RESEARCH.md's own framing, not a "build new capability" phase).

## Metadata

**Analog search scope:** `src/levels/`, `src/mechanics/`, `src/scenes/`, `src/progress.js`, `src/config.js`, `src/math/brain.js`, `scripts/`
**Files scanned (full or targeted reads this session):** `level-02.js`, `level-04.js`, `levels/index.js`, `mechanics/enemy.js`, `progress.js`, `scenes/select.js`, `levels/build.js` (collectZones block), `math/brain.js` (nextQuestion), `config.js` (SELECT + PROGRESS blocks), `scenes/game.js` (mechanic-wiring call sites) — plus the exhaustive prior reads already captured in 25-RESEARCH.md (level-01/03, camera.js, door.js, collect.js, gates.js, parallax.js, the validator/audit scripts)
**Pattern extraction date:** 2026-07-06
