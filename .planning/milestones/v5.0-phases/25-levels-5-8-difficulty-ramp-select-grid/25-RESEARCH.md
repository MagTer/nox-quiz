# Phase 25: Levels 5–8, Difficulty Ramp & Select Grid - Research

**Researched:** 2026-07-06
**Domain:** Data-driven level authoring, a new touch-XP mechanic, multi-row keyboard UI navigation, and a locked-brain literal edit — all within an existing, mature Kaplay 3001 codebase with zero new runtime dependencies.
**Confidence:** HIGH (every claim below is grounded in a direct read of the actual source files at the cited line numbers — no external package research was needed or performed; `config.json` has all web-search providers disabled, and this phase introduces no new npm/pip/cargo packages).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Difficulty Ramp & Table Pools**
- Levels 1–4's existing per-level `allowedTables` pools are NOT revised into one grand monotonic ramp — the new ramp applies fresh to levels 5–8 only. Levels 1–4 stay as shipped, touched only by the MATH-01 edit below.
- level-03 ("The Hollow") keeps its existing mixed `[3,4,5,6,7,8,9]` pool and is retroactively designated THE mixed-review level required by success criterion 2 — zero new authoring needed.
- New levels' `allowedTables`: level-05 `[2,3,4,5]`, level-06 `[4,5,6,7]`, level-07 `[6,7,8]`, level-08 `[6,7,8,9]` — a 4-step gentle climb mirroring ROADMAP's literal "[2,3,4,5] → [6,7,8,9]" wording.
- MATH-01 exact edit: `level-02.js`'s `allowedTables` changes from `[1,2,3,4,5,6,7]` to `[2,3,4,5,6,7]` (drop the 1 only, keep 6/7 as-is). Do not add 8/9 to compensate.
- MATH-02 exact edit: `src/math/brain.js:247`'s `Math.floor(Math.random() * 10) + 1` becomes `Math.floor(Math.random() * 9) + 1` — the ONE authorized literal change to the LOCKED brain file. Do not touch the coincidental unrelated "10"s elsewhere in the file (parseInt radix arguments, `CONFIG.BRAIN.MASTERY_WINDOW: 10`).

**New Level Authoring & Verticality**
- Levels 5–8 are similar length/scale to the post-Phase-24 extended levels 1–4 (roughly 3200–4300px).
- Verticality (LVL-05) applies only to level-07 and level-08; level-05/06 stay single-screen-tall like 1–4.
- Verticality levels get an explicit `bounds.top`/`bounds.bottom` spanning roughly 2 screens (e.g. `top: -360`). Vertical shaft floors must stay above the global fall-respawn threshold (`CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN` = 480, `game.js:275`) — a global constant, NOT bounds-derived.
- Verticality is ascending-only (climb up via platform chains) — no descending shafts.

**Secret XP Alcove (LVL-06 — applies to ALL 8 levels, not just 5–8)**
- Mechanism: a new lightweight `secretAlcove` geometry array + a minimal handler mirroring `src/mechanics/collect.js`'s pattern, calling `progress.addXp` directly on touch. Genuinely new wiring, not a config flip.
- Flat XP bonus of 5 per alcove (not scaled by level) — deliberately below `XP_EASY:10`/`XP_HARD:20`.
- Hidden via geometry placement only (off the main path, no signposting) — a nook, not a branch (no maze-like/heavily-branching levels).
- Every level (1–8) gets exactly one. For levels 1–4, purely-additive placement that touches no existing floor/platform/checkpoint geometry.

**Level Select 2×4 Grid (LVL-04)**
- Grid is 4 columns × 2 rows. At `TILE_W:96`/`GAP:24`, 4 columns need only 456px, comfortably inside the 640px internal canvas.
- Add a `ROW_GAP` constant to `CONFIG.SELECT` plus a second row Y (`ROW_Y + TILE_H + ROW_GAP`); `TILE_W`/`TILE_H`/`GAP`/existing `ROW_Y` stay unchanged.
- Keyboard cursor extends to support Up/Down between rows in addition to the existing Left/Right, wrapping within a row only (no cross-edge wrap).
- Locked/unlocked/cleared visual semantics are unchanged. A pre-v5.0 save resumes with levels 5–8 rendering locked-grey by default (no code change needed — `isUnlocked`'s existing single-predecessor-chain logic already generalizes).

### Claude's Discretion
- Exact per-level pixel geometry for levels 5–8 (floors, platforms, coins, spikes, checkpoint placement) and their themed `displayName` strings, following each level's established per-hazard-checkpoint convention.
- Exact mechanic-type distribution (door/gates/enemy/collectZone mix) per new level.
- Exact pixel placement of each level's secret alcove.
- Whether `bounds` is specified explicitly or left to derive dynamically for levels 5/6 (both patterns are proven live today).

### Deferred Ideas (OUT OF SCOPE)
- Palette/visual identity, per-level theme tinting, rebrand, logo → Phase 26 (VIS-01..03, BRAND-01..03)
- Audio/SFX/music → Phase 27 (AUD-01..04)
- Full 8-level interactive-audit closure and final human sign-off → Phase 28 (VALID-03 final close)
- Parallax layers following vertical camera pan — known pre-existing limitation (parallax only tracks camera X today); not fixed as part of this phase
- `CONFIG.LEVEL_BOTTOM`/`FALL_MARGIN` becoming per-level bounds-derived (a bigger engine change) — avoided this phase by keeping verticality ascending-only and above the existing global threshold instead
- Worlds/level-pack grouping on select screen — explicitly future (CONTENT-FUT-03, earns its keep at ~12+ levels)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LVL-02 | 4 new levels (5–8) as pure-data descriptors through the existing registry/builder | Pattern 1 (proven descriptor schema, verified against level-03/level-04 in full); registry append is mechanical (`levels/index.js` has zero hardcoded count) |
| LVL-03 | Gentle difficulty ramp across all 8 levels (platforming + per-level table pools), including a mixed-review level | Pattern 1's numeric precedent (rise/gap/checkpoint bands from level-03/level-04); table pools already locked in CONTEXT.md, no further research needed there |
| LVL-04 | Level select scales to a 2×4 grid, preserving locked/unlocked/cleared semantics | Pattern 3 area is camera, not select — see the full `select.js` read (cursor model at lines 155-196) and Pitfall 5 (ROW_GAP canvas-height ceiling); Pitfall 1 covers the audit-script fallout of this exact change |
| LVL-05 | Verticality segments in late levels (5–8) | Pattern 3 (bounds-driven camera, already proven, zero engine change) + Pitfall 2 (partial-bounds trap) + Pitfall 4 (audit-driver direction assumption) |
| LVL-06 | One secret XP alcove per level — optional discovery reward, no punishment for missing it | Pattern 2 (full mechanic design: build.js block, mechanics module, and the `progress.js` API gap this research surfaces) + Pitfall 3 (validator/audit blind spot, by design) |
| MATH-01 | Table 1 removed from all per-level question pools | Confirmed exact edit location (`level-02.js:15`); no other file touches table-1 exclusion |
| MATH-02 | ×10 questions eliminated entirely — second-factor roll 1–10 → 1–9 | Confirmed exact edit location (`brain.js:247`) and confirmed the four unrelated "10" literals elsewhere in the file that must NOT change |

</phase_requirements>

## Summary

This phase is almost entirely a "generalize existing patterns" exercise, not a "build new engine capability" exercise. Four of five success criteria (levels-as-data, difficulty ramp, select grid, verticality) are proven-safe generalizations of code that already exists and already tolerates exactly this kind of extension (the registry has zero hardcoded level count, the camera clamp is bounds-driven, the validator auto-discovers `LEVEL_ORDER`). The one genuinely new piece of engine-adjacent code is the `secretAlcove` mechanic, which needs a new geometry array, a new build.js block, a new mechanics module, and — this is the one finding CONTEXT.md did not fully resolve — a new `progress.js` method, because `progress.addXp(table)` cannot express a flat, non-table-scaled XP amount.

The single most consequential finding is a verification-tooling gap that is invisible unless you actually read the two Playwright audit scripts: both `scripts/browser-boot.mjs` and `scripts/audit-phase21-mechanics.mjs` select a level by pressing `ArrowRight` `i` times from a freshly-opened select screen. That is a flat, single-row navigation model. The moment `select.js` gains row-wrapped Left/Right (per CONTEXT.md's locked decision), this loop silently fails to reach any tile in row 2 — i.e., it will never actually visit levels 5–8, and the phase's own success criterion ("plays start→goal green on... the interactive audit") cannot be satisfied without also patching this navigation loop, in both scripts, following the project's established "copy verbatim, fix by hand in each copy" convention for this duplicated Playwright code.

**Primary recommendation:** Treat this phase as five independent-but-ordered workstreams: (1) a `secretAlcove` mechanic + one new `progress.js` method, built and proven first since four new levels + a retrofit of levels 1–4 all reference it; (2) four new level descriptors authored against the proven level-03/level-04 geometry conventions; (3) the two authorized math one-liners; (4) the select-screen 2×4 grid + row-aware keyboard cursor, which is a real (if small) redesign, not a copy-paste extension; (5) fixing the two audit scripts' select-navigation loops so the interactive audit can actually reach levels 5–8. Do (1) before (2)/retrofit; (3) and (4)/(5) are independent of everything else and of each other.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Level geometry (floors/platforms/hazards/mechanics) | Client (pure-data descriptor module) | — | `src/levels/*.js` are plain data modules with zero engine globals (node-importable); this is a firewall the project enforces via a Wave-0 negative grep |
| Level registry / unlock derivation | Client (pure module) | — | `src/levels/index.js` derives `LEVEL_ORDER`/`isUnlocked` purely from array order + progress facts; no engine, no storage |
| Level instantiation (colliders, tagged entities) | Client (engine layer) | — | `src/levels/build.js` — the ONE parameterized builder; runs after `kaplay()` boots |
| Secret-alcove touch → XP | Client (mechanics module + progress module) | — | New `src/mechanics/secretAlcove.js` (engine collision) calling into `src/progress.js` (pure XP/level math) — mirrors the existing mechanics→brain/progress split |
| Level-select layout + keyboard nav | Client (scene layer) | Client (config leaf constants) | `src/scenes/select.js` (behavior) reads `CONFIG.SELECT` (`src/config.js`) for every geometry number — no magic numbers in the scene |
| Camera vertical pan | Client (engine layer) | — | `src/camera.js` already reads per-level `bounds.top/bottom`; verticality is enabled purely by descriptor data, zero camera code changes |
| Math table-pool / roll changes | Client (pure module) | — | `src/levels/level-02.js` (data) and `src/math/brain.js` (locked, one-literal exception) |
| Structural validation | Tooling (Node CLI, no browser) | — | `scripts/validate-levels.mjs` + `scripts/lib/{reachability,over-hole-check}.mjs` — pure-data, auto-discovers `LEVEL_ORDER` |
| Interactive/mechanic validation | Tooling (Playwright, headless browser) | — | `scripts/audit-phase21-mechanics.mjs` / `scripts/browser-boot.mjs` — the only tier that can prove the select-grid keyboard nav actually works |

There is no server/backend/database tier in this project — this is a fully client-side, no-build static app (per `CLAUDE.md`).

## Standard Stack

No new libraries, packages, or dependencies. This phase is 100% additive data + a small amount of vanilla-JS/Kaplay-idiom code within the existing stack:

| Technology | Version | Purpose | Already In Use |
|------------|---------|---------|----------------|
| Vanilla ES2020 modules | native | All new code (levels, mechanic, config, scene edits) | Yes — entire codebase |
| Kaplay (vendored, pinned) | 3001.0.19 | Engine globals (`add`, `area`, `rect`, `onCollide`, etc.) used inside the new mechanic + build.js block | Yes — `lib/kaplay.mjs` |
| Node.js (plain, no test framework) | whatever is on the dev machine | `scripts/validate-levels.mjs`, `scripts/smoke-progress.mjs`, Playwright audit scripts | Yes — established no-framework convention |
| Playwright | already resolved via `require.resolve("playwright")` / `PLAYWRIGHT_MJS_PATH` fallback (see `audit-phase21-mechanics.mjs:34-56`) | Headless interactive audit | Yes — no version change needed |

**Installation:** none — no `npm install`, no new imports beyond the project's own sibling modules.

## Package Legitimacy Audit

Not applicable — this phase introduces zero new external packages (npm/pip/cargo). All work is additive data (level descriptors) plus new first-party modules under `src/mechanics/` and `src/levels/`.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────┐
                     │   src/levels/index.js        │
                     │  LEVEL_ORDER = [L01..L08]     │  <- registry: append-only,
                     │  isUnlocked(id, progress)      │     zero hardcoded count
                     └──────────────┬────────────────┘
                                    │ getLevel(id)
                                    v
   ┌───────────────┐   go("game",{levelId})   ┌─────────────────────┐
   │ select.js      │ ───────────────────────> │ game.js (gameScene)  │
   │ 2x4 tile grid  │ <─────── go("select") ───│  owns run state,     │
   │ row+col cursor │        (goal/Escape)      │  progress, brain      │
   └───────┬────────┘                          └──────────┬───────────┘
           │ reads                                          │ calls
           v                                                 v
   ┌───────────────┐                          ┌─────────────────────────┐
   │ progress.js    │ <──── addXp(table) ──────│ onReachGoal (game.js:208)│
   │ createProgress │ <──── addBonusXp(amt) ───│ NEW: secretAlcove touch  │
   │ (XP/level math)│       (NEW METHOD)        └─────────────────────────┘
   └───────────────┘
           ^
           │ progress passed in
   ┌───────┴────────────────────────────────────────────────────────────┐
   │ game.js wires ALL mechanics with { player, brain } TODAY;           │
   │ the NEW secretAlcove mechanic additionally needs { player, progress}│
   └───────────────────────────────────────────────────────────────────┘

   Level descriptor (pure data, e.g. level-05.js)
        │ geometry.{floors,platforms,coins,spikes,goal,checkpoints,
        │           doors,mathGates,enemies,collectZones,
        │           answerPickupSlots, secretAlcove(NEW)}
        v
   build.js::buildLevel(level)  -- instantiates colliders + tagged area() entities
        │
        v
   game.js wires onCollide handlers per tag, incl. NEW "secret-alcove" tag
        │
        v
   scripts/validate-levels.mjs  -- BFS reachability + over-hole check
        │ (reads geometry.{doors,mathGates,enemies,collectZones} ONLY —
        │  secretAlcove is NOT in either checker's kind list, by design)
        v
   scripts/audit-phase21-mechanics.mjs -- real Playwright drive, all 8 levels
        │ (BLOCKED today by the flat select-nav loop — see Pitfall 1)
        v
   PASS/FAIL console output
```

### Recommended Project Structure (additions only)

```
src/
├── levels/
│   ├── level-05.js      # NEW — "gentle climb" table pool [2,3,4,5], no verticality
│   ├── level-06.js      # NEW — table pool [4,5,6,7], no verticality
│   ├── level-07.js      # NEW — table pool [6,7,8], ascending verticality, explicit bounds
│   ├── level-08.js      # NEW — table pool [6,7,8,9], ascending verticality, explicit bounds
│   ├── index.js         # EDIT — +4 imports, +4 entries in LEVELS array literal
│   ├── level-01.js..04.js  # EDIT — additive-only: +1 secretAlcove entry each, nothing else touched
│   └── build.js         # EDIT — +1 new geometry-array loop (secretAlcove), mirrors collectZones block
├── mechanics/
│   └── secretAlcove.js  # NEW — wireSecretAlcove({ player, progress })
├── progress.js           # EDIT — +1 new method (addBonusXp or equivalent), +1 CONFIG constant
├── scenes/
│   ├── select.js         # EDIT — row/col tile layout + row-aware cursor model
│   └── game.js            # EDIT — +1 mechanic wiring call, pass `progress` to it
└── config.js              # EDIT — CONFIG.SELECT.ROW_GAP + second row Y; CONFIG.PROGRESS.XP_ALCOVE

scripts/
├── smoke-progress.mjs         # EDIT — bump LEVEL_ORDER.length assertion 4 -> 8 (line 723)
├── browser-boot.mjs            # EDIT — select-nav loop must become row+col aware
└── audit-phase21-mechanics.mjs # EDIT — same select-nav fix, applied independently (project convention)
```

### Pattern 1: Pure-data level descriptor (already proven 4x — reuse verbatim)

**What:** A level is a plain object `{ id, displayName, allowedTables, bounds?, geometry: {...}, mechanics: [], theme: null, parallax: null }`, importing only `../config.js`, with zero engine globals.
**When to use:** For every new level-05..08 descriptor.
**Example (schema, verified against `level-03.js`/`level-04.js`, both fuller references than the level-02 example already in CONTEXT.md):**
```javascript
// Source: src/levels/level-04.js (full file read this session)
export const LEVEL_04 = {
  id: "level-04",
  displayName: "The Last Span",
  allowedTables: [6, 7, 8, 9],
  bounds: { left: 0, right: 6200, top: 0, bottom: 360 },
  geometry: {
    floors: [ /* { x, w } contiguous runs; gaps are the space between runs */ ],
    platforms: [ /* { x, y, w, h } stepping stones, rise measured from the floor below */ ],
    coins: [ /* { x, y } — TOP-LEFT of a 32x32 sprite, offset +16px from grid-aligned geometry */ ],
    spikes: [ /* { x, y: FLOOR_Y - CONFIG.SPIKE_SIZE } */ ],
    goal: { x, y: FLOOR_Y - CONFIG.GOAL_SIZE },
    checkpoints: [ /* { x, y: FLOOR_Y - 48 } — one near start + one before EVERY hazard/mechanic */ ],
    doors: [ /* { x, y: FLOOR_Y - CONFIG.DOOR.H } */ ],
    mathGates: [ /* { x, y: FLOOR_Y - CONFIG.MATH_GATE.H } */ ],
    enemies: [ /* { x, y: FLOOR_Y - CONFIG.ENEMY.H } */ ],
    collectZones: [ /* { x, y: FLOOR_Y - CONFIG.COLLECT.ZONE_H, slots: [0,1,2,3] } */ ],
    answerPickupSlots: [ /* 4 slots per collectZone, offset around the zone */ ],
  },
  mechanics: [],
  theme: null,
  parallax: null,
};
```

**Concrete numeric precedent from level-03/level-04 (use these bands, not the naive 96.6px theoretical jump ceiling):**
- The validator's calibrated max single-jump rise is **88.331px** (`scripts/lib/reachability.mjs`'s exported test envelope; the real in-engine measured value is 91.7px per `route-planner.mjs`'s header). Every platform rise MUST stay comfortably under this or `validate-levels.mjs` HARD-FAILs.
- level-03 ("The Hollow", the level CONTEXT.md retroactively designates as the required mixed-review level) uses **60–65px rises** for its narrower platforms (explicitly commented at `level-03.js:34,36-38` as "narrower 40px overlap window" band — a Phase-24 correction after some platforms were unreachable at higher rises).
- level-04 ("The Last Span", the hardest existing level) uses a **uniform 70px rise** across wide 80–128px-span platforms (`level-04.js:34-43`, explicitly commented "wide span windows tolerate this uniformly").
- Full-jump horizontal range is ~156px (measured `AIR_SPEED=210px/s` × time-to-apex, `route-planner.mjs:44-51`); gaps in existing levels run roughly 120–200px.
- Checkpoint lead distance: the established convention (both Phase-24-extension comments and the original hand-authored geometry) is **one checkpoint 64–80px before every spike/door/mathGate/enemy**, e.g. `level-04.js:95-98` ("80px lead").
- Coin placement is intentionally off-grid: `{x,y}` is the sprite's top-left, +16px to find the visual center (documented at `level-01.js:59-66`).

**Recommended per-level shape (Claude's Discretion, informed by the above precedent):**
- **level-05** `[2,3,4,5]` — mirror level-02's structure (softest existing level): wide-ish gaps, 60–65px rises, no verticality, 1 door or 1 mathGate + light hazard density. `bounds` can be omitted (dynamic derivation, level-01 precedent) or given explicitly (level-02+ precedent) — CONTEXT.md leaves this as discretion.
- **level-06** `[4,5,6,7]` — one step harder: introduce a second mechanic type (e.g. enemy + collectZone, mirroring level-01's mix) at 65–70px rises; still single-screen-tall.
- **level-07** `[6,7,8]` — MUST carry explicit `bounds` with `top` well below 0 (e.g. `top: -360` for a full extra screen of climb) — see Pitfall 2 below for why this is not optional. Ascending-only platform chain; each hop should make **net rightward progress** (see Pitfall 4) even while climbing, since the interactive audit's route-planner drives toward an x-target, not a y-target.
- **level-08** `[6,7,8,9]` — capstone: verticality + the hardest table pool + the densest mechanic mix, mirroring level-04's density but with an added vertical shaft segment. MUST also carry explicit `bounds.top`.

### Pattern 2: The `secretAlcove` mechanic — new geometry array, new mechanics module, new progress method

CONTEXT.md already identifies the shape ("mirror `collect.js`'s pattern... call `progress.addXp` directly on touch"), but two details need to be exact for the planner, both confirmed by full reads this session:

**(a) It is much simpler than `collect.js`.** `collect.js` (155 lines, fully read) exists to solve a HARD problem: multi-slot pickup zones with a shared challenge overlay, re-entrancy guards across zones, and ownership checks between zone and pickup. A secret alcove has none of that — it is a single silent trigger with no challenge UI at all. The correct analog is the much simpler **fire-once-Set-latch pattern already used by `door.js`/`enemy.js`** (`opened = new Set()` / `defeated = new Set()`, `player.onCollide(tag, (obj) => { if (set.has(obj)) return; set.add(obj); ...; destroy(obj); })`) — minus the `openChallenge`/pause/resume entirely, since touching the alcove should never freeze the player (ADHD-safe, no interruption for a bonus).

**(b) `progress.addXp(table)` cannot express a flat, non-table-scaled amount — this needs a genuinely new method.** Read `progress.js` in full this session (`src/progress.js:143-152`):
```javascript
// src/progress.js:143-152 — the ONLY existing XP-award method
addXp(table) {
  xp += calculateXp(table); // ALWAYS looks up XP_EASY (10) or XP_HARD (20) via CONFIG.PROGRESS.HARD_TABLES.includes(table)
  let leveledUp = false;
  while (xp >= threshold(level)) {
    xp -= threshold(level);
    level += 1;
    leveledUp = true;
  }
  return leveledUp;
},
```
There is no `table` value that maps to 5 XP (`CONFIG.PROGRESS.XP_EASY:10`, `XP_HARD:20` — both config.js:148-149 — are the only two amounts `calculateXp` can ever return). CONTEXT.md's "flat XP bonus of 5... calling progress.addXp directly" cannot be implemented by literally calling the existing `addXp(table)` signature. The planner MUST add a new sibling method that reuses the SAME level-up while-loop (the "carry surplus, never reset to 0" invariant is load-bearing per the archive-verbatim comment at `progress.js:143-147`) but takes a raw amount instead of a table:
```javascript
// RECOMMENDED new method — same file, same closure, added alongside addXp (not replacing it)
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
Pair this with a new `CONFIG.PROGRESS.XP_ALCOVE: 5` constant (config.js, alongside `XP_EASY`/`XP_HARD` at line ~148) rather than a bare literal in the mechanic — matches the project's own "no magic numbers outside config.js" convention stated at the top of `config.js`.

**(c) Wiring reaches one layer deeper than the other four mechanics.** Every existing mechanic module (`door.js`, `gates.js`, `enemy.js`, `collect.js`) is called from `game.js` with `{ player, brain }` only (`game.js:250-257`) — none of them touch `progress`. The new `wireSecretAlcove({ player, progress })` call needs `progress` threaded in from `game.js`'s closure (where it already lives, `game.js:72`) — this is a new parameter shape, not a copy-paste of the existing four calls.

**(d) `build.js` needs one new geometry-array loop**, directly modeled on the existing `collectZones` block (`build.js:259-270`, the simplest existing block — no answer-pickup-slot complexity needed):
```javascript
// Source: src/levels/build.js:259-270 — the collectZones block, the correct template
// (simpler than doors/mathGates/enemies, which all need the apex-derived tall blocker;
// an alcove is a walk-through bonus, not a barrier, so it needs NO blocker collider at all)
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
A `secretAlcove` block would be even simpler still (no `slots` field needed) — a single invisible `area()` rect tagged `"secret-alcove"`.

**(e) Retrofit into levels 1–4 is purely additive.** CONTEXT.md already establishes this is safe ("additive placement... nothing existing is modified"); confirmed by the fact that `build.js` iterates each geometry array independently and `?? []`-guards every optional one — adding a NEW optional `secretAlcove: [...]` array to `level-01.js`..`level-04.js` cannot perturb any existing loop, and appending one new entry does not touch a single existing floor/platform/coin/spike/checkpoint/mechanic literal in those four files.

### Pattern 3: Camera verticality is ALREADY bounds-driven — zero engine changes, but `bounds` must be a COMPLETE explicit object

Confirmed by reading `camera.js` (full file) and `game.js:83-93` (full derivation logic) this session:
```javascript
// src/scenes/game.js:83-93 — bounds derivation. THE KEY DETAIL:
// if level.bounds is present AT ALL, it is used AS-IS (no per-field merge with the
// dynamic default here) — only when level.bounds is ENTIRELY ABSENT does the fallback
// object (with a dynamically-computed `right`, but CONFIG.LEVEL_TOP/BOTTOM for top/bottom)
// kick in.
const levelRight = Math.max(...); // dynamic derivation, only used in the fallback branch
const bounds = level.bounds ?? {
  left: CONFIG.LEVEL_LEFT, right: levelRight, top: CONFIG.LEVEL_TOP, bottom: CONFIG.LEVEL_BOTTOM,
};
```
```javascript
// src/camera.js:27-35 — followCamera THEN per-field-defaults whatever `bounds` it received
const left = bounds?.left ?? CONFIG.LEVEL_LEFT;
// ...same for right/top/bottom...
ny = clamp(ny, top + halfH, bottom - halfH);
```
**Implication for levels 5–8:** for level-07/08 (verticality), `bounds` MUST be specified as a COMPLETE object with all four fields (`left, right, top, bottom`) — exactly like `level-02.js`/`level-03.js`/`level-04.js` already do (`bounds: { left: 0, right: 4280, top: 0, bottom: 360 }` pattern). If a verticality level's `bounds` object is provided but omits `right` (say), `game.js`'s own dynamic-`right`-derivation is bypassed entirely (because `level.bounds ?? {...}` short-circuits on ANY truthy `bounds`), and `camera.js` would silently fall back to the generic `CONFIG.LEVEL_RIGHT` (2240px) — almost certainly wrong for one of these ~3200-4300px levels. **Always author `bounds` as one complete literal, all four fields present, never partial**, exactly matching the existing level-02/03/04 precedent.

For levels 5/6 (no verticality), `bounds` may be omitted entirely (level-01 precedent, dynamic derivation) or given explicitly (level-02+ precedent) — both are proven live today; CONTEXT.md leaves this as discretion.

**Fall-respawn interacts with `bounds` NOT AT ALL** — confirmed by reading `game.js:275`: `if (player.pos.y > CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN) respawn();` uses the GLOBAL `CONFIG.LEVEL_BOTTOM` (360) `+ CONFIG.FALL_MARGIN` (120) = **480**, never the per-level `bounds.bottom`. Ascending-only verticality (CONTEXT.md's locked decision) is inherently safe here: climbing UP means smaller Kaplay-Y values, i.e., moving FURTHER AWAY from the 480 threshold, never closer. The only way this threshold becomes relevant is if a climbing platform tier has a genuine open-air gap beneath it all the way down past y:480 — ensure every vertical tier has a full-width floor run (not just narrow platforms) beneath it, or the checkpoint discipline (see Pattern 1) will still make a fall-through non-punishing, just potentially annoying if it resets a long climb.

### Anti-Patterns to Avoid
- **Reusing `collect.js`'s multi-slot pattern for the alcove:** wildly over-engineered for a single silent touch-and-reward. Use the door/enemy fire-once-Set idiom instead (no challenge, no pause).
- **Calling `addXp(table)` with a fabricated table number to "back into" 5 XP:** impossible (only 10/20 are reachable) and would corrupt the HARD/EASY-table XP semantics if someone tried a hack like `addXp(1)` (gives 10, not 5) inflating the reward and defeating CONTEXT.md's explicit "deliberately below XP_EASY:10" design intent.
- **Editing `src/math/brain.js` anywhere other than line 247:** the file is LOCKED; the parseInt radix arguments at lines 96/104/183/189 contain unrelated "10"s that must NOT be touched (confirmed by direct read — they are `parseInt(key, 10)` calls, nothing to do with the multiplicand roll).
- **Giving a verticality level a partial `bounds` object:** silently falls back to the wrong `right`/`top`/`bottom` per the mechanism explained in Pattern 3 above.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flat/bonus XP award | A parallel XP-tracking side-channel outside `progress.js` | The new `addBonusXp(amount)` method on the SAME `createProgress()` closure | Keeps xp/level/threshold/carry-over as ONE source of truth; a side-channel would desync the HUD (`hud.js` reads `progress.getXp()`/`getLevel()` only) |
| Secret-alcove reachability proof | A bespoke script or manual-only claim | Nothing automated exists for this — see Pitfall 3; this is a genuine, acceptable gap per CONTEXT.md ("missing it costs nothing") but should get at minimum a manual/interactive spot-check, not a hand-rolled parallel validator | The existing validator's `BARRIER_WIDTH` kind-lists intentionally do NOT include `secretAlcove` (confirmed: `over-hole-check.mjs:34-43`, `reachability.mjs:283-288` both hardcode `["doors","mathGates","enemies","collectZones"]`) |
| Row/column select-tile math | A generic grid-layout library or CSS grid analog | Plain arithmetic (`col = i % 4`, `row = Math.floor(i / 4)`) exactly mirroring the project's existing `col`-only math at `select.js:93` | The whole codebase's convention is hand-computed pixel positions read from `CONFIG.SELECT` — no layout engine anywhere in this project |

**Key insight:** every "don't hand-roll" temptation in this phase is really "don't build a second, parallel version of a mechanism that already exists one layer over" (a second XP tracker, a second validator, a second layout system) — the existing `progress.js`/`validate-levels.mjs`/`CONFIG.SELECT` seams are all designed to be extended in place, not duplicated.

## Runtime State Inventory

Not applicable — this phase is pure feature addition (new levels, new mechanic, new config, UI extension), not a rename/refactor/migration. No existing identifiers, keys, or names are being changed except the two explicitly authorized math literals (MATH-01/02), which are data-value edits, not renames — no stored/cached/registered state references those literals by name anywhere (confirmed: `CONFIG.SAVE.KEY` is untouched, and neither table-pool arrays nor the brain's roll constant are ever used as save keys, storage keys, or OS-level identifiers).

One relevant "runtime state" fact from CONTEXT.md worth restating precisely: **a pre-v5.0 save resuming under v5.0 needs NO migration code.** `isUnlocked` (`levels/index.js:39-47`) derives purely from `LEVEL_ORDER.indexOf(id)` and `progress.isLevelCleared(LEVEL_ORDER[i-1])` — appending 4 new ids to the end of `LEVEL_ORDER` means a save with only `level-01..04` cleared-facts simply has `isLevelCleared("level-05")` return `false` (the key is absent from the old save's `levels` map), so `level-05` renders locked until `level-04` is cleared under the SAME save — this already works today with zero code change, confirmed by reading the full derivation logic.

## Common Pitfalls

### Pitfall 1: The two Playwright audit scripts navigate the select screen with a flat, row-blind loop — they will silently never reach levels 5–8

**What goes wrong:** Both `scripts/browser-boot.mjs:134-139` and `scripts/audit-phase21-mechanics.mjs:166-176` (plus its `reloadLevel` callback at `audit-phase21-mechanics.mjs:190-199`) select level `i` by pressing `ArrowRight` exactly `i` times from a freshly-opened select screen, assuming a single flat row. Once `select.js` gets row-wrapped Left/Right (CONTEXT.md's locked decision: "wrapping within a row only, no cross-edge wrap"), this loop can press `ArrowRight` all day and never leave row 1 — levels 5–8 (row 2) become permanently unreachable by both scripts.
**Why it happens:** the scripts were written when the select screen was one row of ≤4 tiles; nobody anticipated the row split because it hadn't shipped yet (the `IN-03 OVERFLOW FLAG` comment at `config.js:226-231` predicted exactly this need but only for `select.js` itself, not its test harnesses).
**How to avoid:** update BOTH scripts' navigation loop to compute `row = Math.floor(i / 4)`, `col = i % 4`, then press `ArrowDown` `row` times followed by `ArrowRight` `col` times (assuming the cursor always starts at tile index 0 / row 0 / col 0 on fresh entry, which is `select.js`'s existing `cursor = selectable.length > 0 ? 0 : -1` behavior). Per the project's own documented convention for this exact class of duplicated Playwright code (STATE.md: "Playwright static-server + path-traversal guard code is duplicated verbatim... a future guard fix must be applied identically in all three places by hand... extracting to a shared module is a reasonable future cleanup, not urgent"), fix this in BOTH copies by hand — do not extract a shared module as part of this phase.
**Warning signs:** the audit script's JSON output will show zero `results` entries for `level-05`..`level-08` (the loop body never runs the `Enter` press or drive logic for those `i` values in a way that lands on the correct level), or — worse — will silently drive against whatever level happens to be under the un-navigated cursor position (a false-positive "PASS" for the wrong level).

### Pitfall 2: A verticality level with a partial (not fully-explicit) `bounds` object silently gets the wrong camera clamp

**What goes wrong:** `game.js:88`'s `level.bounds ?? {...defaults}` is an all-or-nothing fallback at the WHOLE-OBJECT level, not a per-field merge. If `level-07.js`/`level-08.js` provide, say, `{ top: -360, bottom: 360 }` without `left`/`right`, the dynamic `right`-from-geometry derivation (`levelRight` computed at `game.js:83-87`) is bypassed entirely, and `camera.js`'s own per-field `?? CONFIG.LEVEL_RIGHT` (2240px) fallback kicks in — almost certainly the wrong horizontal extent for one of these longer levels.
**Why it happens:** it is easy to assume (reasonably, from `camera.js`'s OWN per-field defaulting) that `bounds` fields merge independently everywhere; they do NOT at the `game.js` call site.
**How to avoid:** author `bounds` as one complete literal for level-07/level-08, all four fields (`left`, `right`, `top`, `bottom`) present, mirroring the existing `level-02.js`/`level-03.js`/`level-04.js` pattern exactly.
**Warning signs:** the camera would clamp horizontally at 2240px on a much longer level, causing either a visibly truncated camera pan near the true goal, or (if the goal is placed past 2240px) the camera simply never following the player correctly near the end of the level.

### Pitfall 3: The structural validator and the interactive audit will NEVER check `secretAlcove` placement — a badly-placed (truly unreachable) alcove passes silently

**What goes wrong:** `scripts/lib/over-hole-check.mjs`'s `BARRIER_WIDTH` map (line 34-43) and `scripts/lib/reachability.mjs`'s identical map (line 283-288) both hardcode exactly `["doors", "mathGates", "enemies", "collectZones"]` — `secretAlcove` is not a recognized "kind" in either checker, and `scripts/lib/mechanic-drive.mjs`'s `deriveEncounters()` (lines 34-43) has the same fixed list, so `audit-phase21-mechanics.mjs` will never attempt to drive to or trigger an alcove either.
**Why it happens:** this is deliberate/desired per CONTEXT.md's "optional discovery reward... no punishment for missing it" framing — the validator's job is to guarantee the CRITICAL PATH (start→goal, every gated mechanic) is reachable, and an alcove is explicitly off that critical path.
**How to avoid:** this is not a bug to fix, but the planner should NOT assume "validate-levels.mjs passing" or "the interactive audit passing" says anything about alcove placement. Include a lightweight manual/interactive spot-check per level (e.g., a one-off browser session walking to each alcove's coordinates) as a verification step, separate from the automated gates.
**Warning signs:** none automated — this is a true blind spot, not a detectable failure mode.

### Pitfall 4: The interactive audit's route-planner drives toward an X target — a verticality chain with net-leftward or purely-vertical hops may defeat it

**What goes wrong:** `scripts/lib/route-planner.mjs`'s `planTakeoffs`/`driveToXPlanned` (in `mechanic-drive.mjs`) model movement as "walk right, jump at planned takeoffs, converge on `targetX`." The underlying feasibility graph (`reachability.mjs::buildGraph`/`canReach`) is direction-agnostic (any `dy`, any node order) so the STATIC validator handles verticality fine regardless of shape. But the AUDIT DRIVER's stall/backward-progress heuristics (`driveToXPlanned`'s `maxX`/`lastProgressAt`/death-detection logic, `mechanic-drive.mjs:380-433`) are tuned around "the player is walking rightward and occasionally falls backward on death" — a vertical shaft where the player must walk LEFT or stay at a near-constant X while climbing could confuse the "no forward progress" stall detector into a false stall/timeout.
**Why it happens:** the driver was built and tuned entirely against the existing 4 (purely horizontal) levels; verticality is new territory for it.
**How to avoid:** author verticality as a gentle ascending ZIGZAG staircase with net rightward progress on every hop (this also matches "capstone-climb feel" from CONTEXT.md and every existing level's own design language) rather than a straight-up vertical pogo shaft or any hop requiring net-negative X progress.
**Warning signs:** if the interactive audit reports a stall/timeout on level-07/08 that the static validator does NOT flag as a HARD-FAIL, suspect the driver's horizontal-progress heuristic first, not a genuine unreachable-geometry defect.

### Pitfall 5: Row 2 select tiles can clip the bottom of the 640×360 internal canvas if `ROW_GAP` is chosen too generously

**What goes wrong:** the internal render buffer is a fixed 640×360 (confirmed: `src/main.js:20-21`, `width: 640, height: 360` — the CSS transform-scale display trick does NOT change this). With `TILE_H:96` and the existing `ROW_Y:180` (row-1 center), row-2's center is `180 + 96 + ROW_GAP`. A row-2 tile's bottom edge is `ROW_Y + TILE_H + ROW_GAP + TILE_H/2`, which must stay `<= 360`. Solving: **`ROW_GAP <= 36`** to keep row 2 fully on-canvas.
**Why it happens:** `ROW_GAP` is a new, unconstrained constant CONTEXT.md leaves to the executor; it is easy to pick a value (e.g., matching `GAP:24`'s "feels right" spacing) without checking the canvas-height arithmetic.
**How to avoid:** choose `ROW_GAP` in the 16–24px range (comfortably under the 36px ceiling), verified against the internal 360px canvas height, not the 540px scaled display size.
**Warning signs:** row-2 tiles (or their glyph/number labels, which sit at `y + TILE_H/2 - GLYPH_SIZE` per `select.js:139`) render partially or fully off the bottom edge of the game window.

## Code Examples

### Fire-once mechanic latch (the correct template for `secretAlcove`, NOT `collect.js`'s multi-slot model)
```javascript
// Source: src/mechanics/enemy.js (full file, this session) — adapt by removing the
// openChallenge/pause/resume entirely; an alcove never freezes the player.
export function wireSecretAlcove({ player, progress }) {
  const found = new Set(); // fire-once latch, closure-local (anti-leak, never module-level)

  player.onCollide("secret-alcove", (alcoveObj) => {
    if (found.has(alcoveObj)) return;
    found.add(alcoveObj);

    const leveledUp = progress.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE); // NEW method + NEW constant
    // optional: fx.pop(alcoveObj.pos.clone()) for a small celebratory nudge, matching the
    // coin-collect idiom at game.js:168-172 — NOT fx.clearBurst() (that's goal-tier)

    destroy(alcoveObj);
  });
}
```

### New `build.js` block (mirrors the `collectZones` block, minus the `slots` field)
```javascript
// Source: adapted from src/levels/build.js:259-270 (collectZones block, full file read)
for (const a of g.secretAlcove ?? []) {
  add([
    rect(/* pick a small footprint, e.g. 24x24 — smaller than a coin's 32x32 sprite area to read as a "nook" */),
    pos(a.x, a.y),
    area(),
    opacity(0), // invisible per CONTEXT.md's "hidden via geometry placement only, no signposting"
    "secret-alcove",
  ]);
}
```

### Wiring call site addition in `game.js`
```javascript
// Source: adapted from src/scenes/game.js:250-257 (the existing 4 mechanic-wiring calls)
wireDoor({ player, brain });
wireGates({ player, brain });
wireEnemy({ player, brain });
wireCollect({ player, brain });
wireSecretAlcove({ player, progress }); // NEW — the only mechanic needing `progress`, not `brain`
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-row select screen, flat `x = START_X + i*(TILE_W+GAP)` | 2×4 grid with `col`/`row` split + `ROW_GAP` | This phase (LVL-04) | The IN-03 overflow flag left at `config.js:226-231` since Phase 14 is finally being addressed at its documented trigger point ("before adding a 5th+ level") |
| `driveToXClimbing` (blind bunny-hop, retired but kept for reference in `mechanic-drive.mjs`) | `driveToXPlanned` (geometry-informed planned takeoffs) | Phase 24 close-out | Already in place; verticality just needs to stay within its existing assumptions (Pitfall 4) |
| 4-level registry, single flat `LEVEL_ORDER` | 8-level registry, same flat array (no new data structure) | This phase (LVL-02) | Confirms the registry design was already future-proofed — zero registry code changes needed, only append |

**Deprecated/outdated:** nothing in this phase deprecates existing code; every change is additive.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `ROW_GAP` in the 16–24px range is the right choice (vs. CONTEXT.md leaving it fully open) | Pitfall 5 / Recommended Project Structure | Low — purely cosmetic; any value ≤36px is provably safe, this is a suggested default within the safe range, not a hard requirement |
| A2 | Verticality should be authored as a net-rightward ascending zigzag (not a pure vertical shaft) | Pitfall 4 / Pattern 1 | Medium — if a pure vertical or net-leftward shaft is authored instead, the interactive audit driver may report a false stall even though the static validator (direction-agnostic) would still pass; this is a recommendation to avoid audit friction, not a hard engine constraint |
| A3 | `addBonusXp(amount)` (exact name/shape) is the right new `progress.js` method, rather than overloading `addXp`'s signature | Pattern 2(b) | Low — the exact method name/shape is a planner/executor naming choice; the CONSTRAINT that a new, distinct code path is needed (not a reuse of the existing `addXp(table)` signature) is the load-bearing, verified part of this claim |

## Open Questions

1. **Should the audit-script select-navigation fix (Pitfall 1) land IN this phase, or be deferred to Phase 28 (VALID-03 final close)?**
   - What we know: REQUIREMENTS.md's traceability table maps `VALID-03` ("Interactive audit drives start→goal... on all 8 levels") to Phase 28, and CONTEXT.md's own Deferred section explicitly defers "Full 8-level interactive-audit closure and final human sign-off" to Phase 28. But this phase's OWN success criterion 1 states each new level must "play start→goal green on both the static validator and the interactive audit."
   - What's unclear: whether "the interactive audit" in criterion 1 means the FORMAL, fully-automated `audit-phase21-mechanics.mjs` run (which cannot reach levels 5–8 without the Pitfall-1 fix), or an informal/manual equivalent proof (e.g., a human or a one-off script driving a single level via direct `go("game", {levelId})` console eval, sidestepping the select-screen cursor entirely).
   - Recommendation: the planner should explicitly resolve this tension. The SAFEST reading given both the existing STATE.md blocker note ("Full 8-level closure... remains Phase 28's job") and the fact that a proper fix is small (a navigation-loop patch in 2 scripts) is: **fix the select-nav loop in this phase** (it is cheap, and otherwise NEITHER script can even smoke-test levels 5-8 at all, blocking this phase's own regression safety) but treat the FULL, formal, retry-hardened multi-attempt closure sign-off (matching Phase 23's rigor for levels 1-4) as still Phase 28's job. This keeps Phase 25 unblocked without duplicating Phase 28's scope.

2. **Does `smoke-progress.mjs` need new `expectedGeometry` byte-pinning blocks for levels 5-8, matching the 4 existing blocks for levels 1-4?**
   - What we know: the 4 existing blocks (e.g. `smoke-progress.mjs:616-719` for level-04) exist specifically to protect ALREADY-SHIPPED, kid-validated geometry from silent regression — they deep-equal a literal expected object against `getLevel(id).geometry`.
   - What's unclear: whether brand-new levels 5-8 (with no prior shipped baseline to protect) need this same treatment from day one, or whether the ONLY required smoke-test change is bumping the `LEVEL_ORDER.length === 4` assertion (line 723) to 8.
   - Recommendation: only the length-assertion bump is REQUIRED to keep the existing suite green; new byte-pinning blocks for levels 5-8 are optional hardening the planner may choose to add (there is no regression to protect against yet), not a gap that blocks this phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All `scripts/*.mjs` (validate-levels, smoke-progress, audit scripts) | ✓ (already used throughout the project) | whatever runs the existing suite | — |
| Playwright | `browser-boot.mjs`, `audit-phase21-mechanics.mjs` | ✓ (resolved via `require.resolve` or `PLAYWRIGHT_MJS_PATH` fallback, confirmed working pattern already in both scripts) | pinned via project's existing resolution chain | Falls back to a hardcoded machine-specific path per `audit-phase21-mechanics.mjs:40-56` — unchanged by this phase |
| Browser (headless Chromium via Playwright) | same as above | ✓ (already in use) | — | — |

No new external dependencies are introduced; nothing here needs fresh verification beyond confirming the existing scripts already run (they are the project's proven regression suite from Phases 22-24).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (project convention: no JS test framework — plain Node ES modules with a `check(cond, msg)`/`failures`-counter/`process.exit(1)` idiom, mirrored across every script) |
| Config file | none |
| Quick run command | `node scripts/smoke-progress.mjs` and `node scripts/validate-levels.mjs` (both fast, pure-data, no browser) |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-progress.sh && node scripts/smoke-progress.mjs && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs && node scripts/audit-phase21-mechanics.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LVL-02 | 4 new levels exist as pure-data descriptors through the registry | structural | `node scripts/validate-levels.mjs` (auto-discovers `LEVEL_ORDER`, zero code change needed) | ✅ |
| LVL-02 | `LEVEL_ORDER.length` reflects 8 levels | smoke | `node scripts/smoke-progress.mjs` | ✅ (EDIT: bump line 723's `=== 4` to `=== 8`) |
| LVL-03 | Gentle ramp + mixed-review level, no table-1 in any pool | structural + manual review | `node scripts/validate-levels.mjs` (reachability only — table-pool correctness is NOT checked by any script; verify by reading each descriptor's `allowedTables`) | ✅ (validator) / ❌ (no automated table-pool assertion exists — Wave 0 gap, optional) |
| LVL-04 | 2×4 grid, locked/unlocked/cleared semantics preserved, pre-v5.0 save resumes correctly | interactive | `node scripts/browser-boot.mjs` (after Pitfall 1 fix) — no existing automated check covers select-screen layout/nav today | ❌ Wave 0 gap — the fix in Pitfall 1 IS this test's enabling change |
| LVL-05 | Verticality segments, camera pans correctly | interactive + structural | `node scripts/validate-levels.mjs` (reachability, direction-agnostic) + `node scripts/audit-phase21-mechanics.mjs` (after Pitfall 1 fix) | ✅ (validator) / ❌ until Pitfall 1 fix lands (audit) |
| LVL-06 | Secret alcove awards XP, missing it costs nothing | manual only (by design — see Pitfall 3) | none — intentionally uncovered by the structural/interactive gates | manual spot-check recommended, not a Wave-0 gap to fill |
| MATH-01 | Table 1 removed from level-02's pool | manual/grep | none automated today | ❌ Wave 0 gap (optional): a one-line grep assertion in `check-progress.sh` (`! grep -q '\[1,' src/levels/level-02.js` style) would close this cheaply |
| MATH-02 | Second-factor roll 1-9, brain.js diff limited to one line | manual diff review | `git diff src/math/brain.js` (manual, one-line expected) | ❌ no automated single-line-diff assertion exists; recommend a manual `git diff --stat`/`git diff` review as the verification step, given the LOCKED-file sensitivity |

### Sampling Rate
- **Per task commit:** `node scripts/validate-levels.mjs` (fast, catches structural regressions immediately after each level descriptor is authored)
- **Per wave merge:** `node scripts/smoke-progress.mjs` + `bash scripts/check-gate.sh` + `bash scripts/check-safety.sh` + `bash scripts/check-progress.sh`
- **Phase gate:** Full suite green (including `browser-boot.mjs` and `audit-phase21-mechanics.mjs`, both AFTER the Pitfall-1 navigation fix) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `scripts/smoke-progress.mjs:723` — bump `LEVEL_ORDER.length === 4` to `=== 8` (mechanical, required)
- [ ] `scripts/browser-boot.mjs:134-139` — select-nav loop needs row/col awareness (required for LVL-04/LVL-05 interactive proof to even reach levels 5-8)
- [ ] `scripts/audit-phase21-mechanics.mjs:166-176,190-199` — same select-nav fix, applied independently per the project's "fix duplicated Playwright code by hand in each copy" convention (required, same reason)
- [ ] (Optional, not blocking) a grep-based `check-progress.sh` assertion for MATH-01 (`level-02.js`'s pool excludes `1`) and MATH-02 (`brain.js`'s roll is `* 9`, not `* 10`) — recommended given how easy a locked-file typo would be to miss otherwise, but no existing convention mandates it

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface anywhere in this client-only static game |
| V3 Session Management | No | No sessions/cookies; `localStorage` only, already guarded |
| V4 Access Control | No | No privilege boundaries; level "locking" is a UX/pacing feature, not a security control |
| V5 Input Validation | Marginal-yes | The new `secretAlcove` geometry array is AUTHORED data (trusted, same trust tier as every other geometry array), not user input — no new validation needed. The existing `progress.js`/`brain.js` explicit-field validation pattern (named-key, range-checked copy, never `Object.assign`/spread of an untrusted blob) is already the standard here and needs no extension for this phase's additions, since neither new method (`addBonusXp`) nor new config constant (`XP_ALCOVE`) reads any external/untrusted input |
| V6 Cryptography | No | No cryptographic operations anywhere in this project |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prototype pollution via a crafted `localStorage` save blob | Tampering | Already mitigated project-wide via `progress.js`'s explicit-field `validate()` (never spreads the untrusted blob) — confirmed unaffected by this phase's additions, since neither new level data nor the new `progress.js` method reads from the save blob at all |
| Path traversal in the Playwright audit scripts' local static file server | Information Disclosure | Already mitigated (`browser-boot.mjs:83-98`, `audit-phase21-mechanics.mjs:93-106` both resolve+clamp to `ROOT_ABS` with a path-separator boundary check) — unaffected by this phase; the navigation-loop fix (Pitfall 1) does not touch this code path |

No new threat surface is introduced by this phase — it adds trusted, authored data (levels) and a small amount of engine-collision code (the alcove mechanic), neither of which processes untrusted external input.

## Sources

### Primary (HIGH confidence — every claim in this document is a direct read of the actual repository source, no external lookups performed)
- `src/levels/level-01.js` through `level-04.js` (full reads) — descriptor schema, geometry conventions, checkpoint/rise/gap precedent
- `src/levels/index.js`, `src/levels/build.js` (full reads) — registry derivation, geometry-array build loops
- `src/scenes/game.js`, `src/scenes/select.js`, `src/camera.js` (full reads) — scene wiring, bounds derivation, camera clamp, select-screen cursor model
- `src/mechanics/collect.js`, `src/mechanics/door.js`, `src/mechanics/enemy.js` (full reads) — mechanic-wiring idioms, fire-once-latch pattern
- `src/progress.js`, `src/math/brain.js`, `src/config.js` (full reads) — XP/level math, the locked brain roll, all tunable constants
- `src/parallax.js` (full read) — confirmed no crash risk from negative `bounds.top`
- `scripts/validate-levels.mjs`, `scripts/lib/reachability.mjs`, `scripts/lib/over-hole-check.mjs`, `scripts/lib/mechanic-drive.mjs`, `scripts/lib/route-planner.mjs` (full reads) — structural validator internals, `BARRIER_WIDTH` kind-lists, audit driver model
- `scripts/browser-boot.mjs`, `scripts/audit-phase21-mechanics.mjs`, `scripts/lib/audit-retry.mjs`, `scripts/smoke-progress.mjs` (excerpts + targeted reads) — the select-nav-loop finding (Pitfall 1), the `LEVEL_ORDER.length` assertion location
- `.planning/phases/25-levels-5-8-difficulty-ramp-select-grid/25-CONTEXT.md` — locked decisions this research builds directly on top of
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/config.json` — requirement IDs, phase history, workflow toggles (`nyquist_validation: true`, `security_enforcement: true`)

### Secondary (MEDIUM confidence)
- None — no web search or external documentation lookup was performed or needed for this phase (config.json has every search provider disabled, and the domain is 100% internal codebase mechanics).

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, confirmed by direct config/CLAUDE.md read
- Architecture (level authoring, camera, build.js wiring): HIGH — every claim traced to an exact file:line read this session
- The `progress.js` addBonusXp gap: HIGH — confirmed by reading the complete, current `addXp`/`calculateXp` implementation; no ambiguity in what values are reachable today
- The audit-script select-nav gap (Pitfall 1): HIGH — confirmed by reading both scripts' exact navigation loops line-by-line
- Exact per-level pixel geometry for levels 5-8: N/A — explicitly Claude's Discretion per CONTEXT.md; this research provides numeric precedent bands (rise/gap/checkpoint-lead) rather than exact literals, since the literals are an authoring task, not a research question

**Research date:** 2026-07-06
**Valid until:** No external time-sensitivity — this is pure internal-codebase research with no version-drift risk from third-party packages (there are none). Valid until the next phase that touches any of `src/scenes/select.js`, `src/levels/build.js`, `src/progress.js`, or the two Playwright audit scripts changes their structure.
