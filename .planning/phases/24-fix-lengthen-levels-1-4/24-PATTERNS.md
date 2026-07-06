# Phase 24: Fix & Lengthen Levels 1-4 - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 5 (level-01.js, level-02.js, level-03.js, level-04.js, smoke-progress.mjs)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/levels/level-01.js` | model (pure data descriptor) | CRUD (in-place edit + append) | `src/levels/level-02.js` / `level-04.js` (self family) | exact (self-pattern; sibling files show the append/extension idiom) |
| `src/levels/level-02.js` | model (pure data descriptor) | CRUD (in-place edit + append) | `src/levels/level-03.js` (has `bounds` field to mirror) | exact |
| `src/levels/level-03.js` | model (pure data descriptor) | CRUD (in-place edit + append) | `src/levels/level-04.js` (has enemy/collectZone to mirror) | exact |
| `src/levels/level-04.js` | model (pure data descriptor) | CRUD (in-place edit + append) | `src/levels/level-03.js` (same mechanic set) | exact |
| `scripts/smoke-progress.mjs` | test (regression/geometry-pinning) | batch/transform (deep-equal fixture) | itself — 4 near-identical blocks, one per level | exact (self-pattern; each level's block is the analog for the next) |

All five files are internally self-similar — the strongest analog for each is its own sibling within the same family, not a file from a different subsystem. No cross-subsystem analog search was needed; `src/levels/index.js` (registry) and `src/scenes/game.js`/`src/config.js` (consumers) are read-only reference points, not files to imitate structurally.

## Pattern Assignments

### `src/levels/level-01.js` (model, CRUD append)

**Analog:** itself (existing geometry arrays) + `level-04.js` for multi-mechanic-type extension idiom

**Header/module pattern** (level-01.js lines 1-19):
```js
import { CONFIG } from "../config.js";
const FLOOR_Y = CONFIG.FLOOR_Y; // 320 — top of every floor run
```
No other imports. Never reference engine globals (`add`/`sprite`/`vec2`) — pure data only, enforced by a Wave-0 negative grep.

**Floor run pattern** (lines 40-44): contiguous `{ x, w }` objects; comment states the gap ranges explicitly and what the run is called ("opening run", "final run to the goal"). New appended floor runs must follow this same `{ x, w }` shape and include an inline comment naming the run and its position relative to the prior gap.
```js
floors: [
  { x: 0, w: 560 }, // opening run
  { x: 720, w: 480 }, // middle run (after gap 1)
  { x: 1360, w: 880 }, // final run to the goal (after gap 2), ends at 2240
],
```

**Platform pattern** (lines 48-53): `{ x, y, w, h }`, `h: 24` fixed for all shipped platforms; inline comment describes the platform's role ("hop up before gap 1", "mid-gap-1 stepping stone").

**Coin pattern** (lines 63-74) — CRITICAL off-grid convention documented in the file's own comment (lines 57-62): coins are `{x, y}` TOP-LEFT anchor for a 32x32 sprite, deliberately NOT grid-aligned like other 16px geometry; visual center is `{x+16, y+16}`. New coins in extension sections must keep this same top-left/32px-sprite convention and match existing per-level coin-spacing density (level-01: ~10 coins across ~2240px ≈ one every ~220px).

**Spike + checkpoint pairing pattern** (lines 77-100) — the CONTEXT.md-locked convention verbatim:
```js
spikes: [
  { x: 880, y: FLOOR_Y - CONFIG.SPIKE_SIZE }, // first hazard on the middle run
],
checkpoints: [
  { x: 800, y: FLOOR_Y - 48 }, // before the first spike (x=880) — 80px lead
],
```
Rule: one checkpoint at `x = spikeX - 80` (level-01's exact lead distance), `y: FLOOR_Y - 48` always (never varies). Comment must cross-reference the hazard it precedes.

**Goal pattern** (line 84): `{ x, y: FLOOR_Y - CONFIG.GOAL_SIZE }` — single object, not an array. Move only in the "fix" pass never needed for level-01 (no goal defect); for extension, goal.x moves to the new level end.

**Door pattern** (lines 105-107): `{ x, y: FLOOR_Y - CONFIG.DOOR.H }`, comment documents WHY that x was chosen (blocks bypass, has lintel).

**MathGate pattern** (lines 111-114): `{ x, y: FLOOR_Y - CONFIG.MATH_GATE.H }` array, comment tags the mechanic ID (`MECH-04`) and describes role/order.

**Enemy pattern** (lines 117-119): `{ x, y: FLOOR_Y - CONFIG.ENEMY.H }`.

**CollectZone + answerPickupSlots pattern** (lines 122-132): zone is `{ x, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0,1,2,3] }`; the 4 pickup slots are hand-placed relative offsets from the zone's x (`zoneX - 30`, `zoneX + 30`, two y rows at `FLOOR_Y - 100` and `FLOOR_Y - 40`). Reuse this exact relative-offset shape (`{zoneX-30, top-100}, {zoneX+30, top-100}, {zoneX-30, top-40}, {zoneX+30, top-40}`) for any new collectZone (only level-03/level-04 have these; level-01 also has one at x:300).

**Fix-specific excerpt (over-hole gate reposition target, from RESEARCH.md, verified against this file):**
- mathGate x:600 → reposition to x:528 (rightmost x keeping 32px footprint inside floor-0's 0..560 span)
- mathGate x:1300 → reposition to x:1360 (leftmost x on floor-2, before door at 1400)

---

### `src/levels/level-02.js` (model, CRUD append)

**Analog:** `src/levels/level-03.js` (has explicit `bounds` field to mirror exactly)

**Bounds pattern** (level-02.js line 18, identical shape in level-03.js line 16 and level-04.js line 16):
```js
bounds: { left: 0, right: 2800, top: 0, bottom: 360 },
```
`top`/`bottom` never change (360px screen, fixed across all 3 leveled files). Only `right` needs bumping — target = `new_goal.x + CONFIG.GOAL_SIZE + ~64-80px buffer` (matches the existing 64px buffer pattern: level-02 goal 2720+16=2736, bounds.right 2800 → 64px buffer).

**No enemy/collectZone convention** (lines 80-82): level-02 deliberately ships `enemies: [], collectZones: [], answerPickupSlots: []` — CONTEXT.md locks that the extension must NOT introduce these types here. Keep these three arrays empty in the extended section too.

**Rest of the array shapes** (floors/platforms/coins/spikes/checkpoints/doors/mathGates) — identical shape/convention to level-01, see above; level-02's own existing arrays (lines 21-78) are the direct copy-source for continuing its density (8 checkpoints across ~2800px, 10 coins across ~2800px, 4 spikes, 1 door, 2 mathGates — extension should scale these counts by the same ratio as the length increase).

---

### `src/levels/level-03.js` (model, CRUD append)

**Analog:** `src/levels/level-04.js` (same full mechanic set: enemy + collectZone + answerPickupSlots + doors=[] convention... actually level-03 has doors:[] while level-04 has 1 door — closest full match is level-01 for the enemy+collectZone combo, level-02 for bounds)

**doors: [] convention** (level-03.js line 74): level-03 ships zero doors — CONTEXT.md's "reuse only mechanic types already present" locks this: no new door in level-03's extension.

**Enemy + collectZone pattern** (lines 80-93): single enemy at `{ x, y: FLOOR_Y - CONFIG.ENEMY.H }`; single collectZone + 4 answerPickupSlots at the same relative-offset shape documented above (zone at x:200, slots at 170/230 x-offsets, ±30 from zone x). If Claude's discretion adds a second collectZone/enemy instance in the extension, follow this exact relative-offset formula.

**Checkpoint density example** (lines 62-72): 9 checkpoints across a 3320px level (denser than level-01/02 — roughly one per 370px) with tight clusters right before consecutive-hazard runs (e.g., 740/960 bracket the double-spike at 820/1040). Mirror this "cluster before back-to-back hazards" density in the new section.

**Fix-specific excerpt (unreachable platform lower-y targets, verified against this file):**
- platform x:1880 y:184 w:128 → target y ≥ 250 (rise ≤ ~60-65px recommended; narrow 40px span window per RESEARCH.md caveat)
- platform x:2640 y:192 w:128 → target y ≥ 250 (same narrow-window caveat)
- Iterate with `node scripts/validate-levels.mjs` after each y change; do not trust the target y as final without a green marginRatio.

---

### `src/levels/level-04.js` (model, CRUD append)

**Analog:** `src/levels/level-03.js` (same enemy/collectZone/answerPickupSlots shapes) + `level-01.js`/`level-02.js` for door/mathGate density (level-04 has 1 door, 2 mathGates — same shape as level-01)

**Densest checkpoint pattern** (lines 67-80): 12 checkpoints across 3920px — tightest clustering of all 4 levels (e.g., 740/860/920 bracket 3 close hazards at 820/1000). This is the density ceiling to reference if the extension adds several closely-spaced hazards.

**Fix-specific excerpts (verified against this file):**
- mathGate x:1800 → reposition to x:1728 (rightmost x keeping 32px footprint inside floor-2's 1240..1760 span; stays before enemy at x:2400)
- 6 unreachable platforms → lower y (target rise ≤ ~65-75px, wider 80-128px span windows tolerate more margin than level-03's):
  - x:1080 y:200 w:112 → target y ≥ 245
  - x:1400 y:216 w:80 → target y ≥ 245
  - x:1760 y:176 w:128 → target y ≥ 245
  - x:2140 y:216 w:80 → target y ≥ 245
  - x:2520 y:192 w:112 → target y ≥ 245
  - x:3240 y:184 w:112 → target y ≥ 245

---

### `scripts/smoke-progress.mjs` (test, batch/transform — geometry-pinning fixture)

**Analog:** itself — the level-01 block (lines 282-349, read in full above) is the copy-source pattern for re-baselining all 4 blocks (level-02: lines ~351-413, level-03: ~416-489, level-04: ~492-576 per RESEARCH.md's line map).

**Exact block shape to replicate for each level** (verbatim from level-01's block, lines 282-349):
```js
// --- LVL-02 regression: level-01 geometry === v3.0 src/level.js values, VERBATIM ---
{
  const FLOOR_Y = CONFIG.FLOOR_Y; // 320
  const expectedGeometry = {
    floors: [ /* ...full array, byte-identical to the descriptor... */ ],
    platforms: [ /* ... */ ],
    coins: [ /* ... */ ],
    spikes: [ /* ... */ ],
    goal: { /* ... */ },
    checkpoints: [ /* ... */ ],
    doors: [ /* ... */ ],
    mathGates: [ /* ... */ ],
    enemies: [ /* ... */ ],
    collectZones: [ /* ... */ ],
    answerPickupSlots: [ /* ... */ ],
  };

  const actual = getLevel("level-01").geometry;
  check(deepEqual(actual, expectedGeometry),
    `LVL-02 regression: getLevel("level-01").geometry must deep-equal the v3.0 src/level.js geometry verbatim`);
}
```

**Re-baseline comment convention to apply** (per CONTEXT.md, mirroring project's `CONFIG.JUMP_FORCE`/`jump-envelope.mjs` provenance-comment style):
```js
// Phase 24 re-baseline: level-0N extended + structural fixes applied (VALID-04/LVL-01).
// OLD (pre-Phase-24, v4.1) values, retained for historical traceability:
//   floors: [{ x: 0, w: 560 }, { x: 720, w: 480 }, { x: 1360, w: 880 }]
//   ... (one line per changed array key)
const expectedGeometry = {
  floors: [ /* NEW post-fix/post-extension values */ ],
  ...
};
```
Apply this same pattern to all 4 blocks, not just level-01's — each block's own current array literal (read directly from the file at the line ranges above) is the "OLD" value to preserve in the comment before overwriting with the new post-Phase-24 numbers.

---

## Shared Patterns

### Pure-data module header (all 4 level files)
**Source:** every `src/levels/level-0N.js`, lines 1-9ish
**Apply to:** any edit to level-01/02/03/04.js
```js
import { CONFIG } from "../config.js";
const FLOOR_Y = CONFIG.FLOOR_Y; // 320
```
Never import engine globals. Never add a second import.

### Checkpoint-before-hazard formula (all 4 level files)
**Source:** `src/levels/level-01.js` lines 96-98 (comment explains the `FLOOR_Y - 48` derivation at lines 88-94)
**Apply to:** every new checkpoint in every level's extension
```js
{ x: <hazardX - ~80 to 120>, y: FLOOR_Y - 48 }, // before the <hazard type> (x=<hazardX>)
```
`y: FLOOR_Y - 48` is a universal literal across all 4 shipped files — never vary it.

### Camera bounds field (level-02/03/04 only — NOT level-01)
**Source:** `src/levels/level-02.js` line 18, `level-03.js` line 16, `level-04.js` line 16
**Apply to:** levels 2-4 extension (bump `bounds.right`); do NOT add a `bounds` field to level-01 — its camera clamp is derived dynamically by `src/scenes/game.js` from geometry extent (verified in RESEARCH.md, lines 80-93 of game.js).
```js
bounds: { left: 0, right: <new_goal_x + GOAL_SIZE + ~64-80px buffer>, top: 0, bottom: 360 },
```

### Mechanic-type-reuse constraint (per-level, all 4 files)
**Source:** each level's existing `doors`/`mathGates`/`enemies`/`collectZones` arrays (empty arrays are load-bearing signals, not omissions)
**Apply to:** extension content for every level
- level-01: has doors, mathGates, enemies, collectZones — all types available for reuse
- level-02: has doors, mathGates — NO enemies/collectZones (arrays explicitly `[]`, lines 80-82) — extension must keep these empty
- level-03: has mathGates, enemies, collectZones — NO doors (`doors: []`, line 74) — extension must keep doors empty
- level-04: has doors, mathGates, enemies, collectZones — all types available for reuse

### Structural validator feedback loop (all edits)
**Source:** `scripts/validate-levels.mjs` CLI, documented in RESEARCH.md's "Code Examples" section
**Apply to:** every single x/y edit across all 4 files, run immediately after
```bash
node scripts/validate-levels.mjs
```
Read printed `marginRatio` per row; iterate y/x rather than trusting any target-value table (including this PATTERNS.md's own target numbers) as final.

## No Analog Found

None — all 5 in-scope files have strong same-family or self-referential analogs; no file in this phase requires borrowing a pattern from an unrelated subsystem.

## Metadata

**Analog search scope:** `src/levels/*.js`, `scripts/smoke-progress.mjs` (read in full for lines 280-349; remaining 3 blocks located by line-number map in RESEARCH.md, not independently re-read since their shape is byte-identical to the level-01 block already read)
**Files scanned:** 5 target files + `24-CONTEXT.md` + `24-RESEARCH.md`
**Pattern extraction date:** 2026-07-06
