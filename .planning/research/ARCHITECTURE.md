# Architecture Research

**Domain:** Kaplay 2D platformer (browser game) embedding a ported vanilla-JS "math brain"
**Researched:** 2026-06-22
**Confidence:** HIGH

> Scope: integration architecture for the NEW game shell (v3.0). Covers how a Kaplay platformer
> should be structured so the existing weighted question-selection logic plugs in cleanly, where the
> future XP/localStorage persistence seam lives, and a dependency-ordered build sequence.
> **New vs ported is called out explicitly throughout.** The selection algorithm itself is NOT
> redesigned — only its wiring.

---

## What Is Being Ported (the "math brain")

Read directly from `math-lab.html` (HIGH confidence — source of truth):

| Module | Public surface | Port verdict |
|--------|----------------|--------------|
| **QuestionSelector** (`selectNext(playerState, allowedTables)`) | Returns `{ table, multiplicand, answer, options[4], question }`. Internals: weighted table selection (6–9 boosted ~70%, struggle 1.5× boost, mastered ×0.3), Fisher-Yates shuffle, `generateDistractors` (±1/±2 same-table + one wrong-table). | **PORT verbatim.** This is the tuned asset. Do not touch the algorithm. |
| **CONFIG** (subset) | `HARD_TABLES=[6,7,8,9]`, `EASY_TABLES=[1..5]`, `STRUGGLE_THRESHOLD`, `STRUGGLE_BOOST`, `MASTERY_WINDOW`, `MASTERY_THRESHOLD`, `ACCURACY_ALPHA` | **PORT** (only the keys QuestionSelector + PlayerState read). |
| **PlayerState** (`getAccuracy`, `isMastered`, `updateAccuracy`, `addXp`, `toJSON`, `fromJSON`, `reset`) | QuestionSelector **depends on `getAccuracy()` + `isMastered()`**. The rest (XP, history persistence) is the future-persistence concern. | **PORT the accuracy half now** (selector needs it); **XP/history persistence is the deferred seam.** |
| **PersistenceStore** (localStorage v2, versioned, migration from v1) | Save/load JSON, quota handling, v1→v2 migration. | **DO NOT port this milestone.** This is the seam left open (see Integration Points). |

**Critical coupling fact:** `QuestionSelector.selectNext()` requires a `playerState`-shaped object exposing
`getAccuracy(table)` and `isMastered(table)`. The minimum viable port is therefore *QuestionSelector +
CONFIG + a PlayerState that can answer accuracy/mastery queries and record `updateAccuracy()`*. XP,
leveling, and localStorage are not required for the selector to work — that is the natural cut line.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  index.html  (single entry; <script type="module" src=main.js>)   │
│  + vendored kaplay.mjs (no CDN, loaded offline)                    │
├──────────────────────────────────────────────────────────────────┤
│                        GAME SHELL  (NEW)                           │
│  ┌────────────┐   ┌─────────────────┐   ┌──────────────────────┐  │
│  │  main.js   │   │  scenes/        │   │  entities/           │  │
│  │ kaplay()   │──▶│  game.js        │──▶│  player.js           │  │
│  │ init+load  │   │  (the level)    │   │  platform.js goal.js │  │
│  │ assets     │   │                 │   │                      │  │
│  └────────────┘   └────────┬────────┘   └──────────────────────┘  │
│                            │ player touches goal                  │
│                            ▼                                       │
│                   ┌─────────────────────┐                          │
│                   │  ui/mathGate.js     │  PAUSED OVERLAY          │
│                   │  (renders question, │  (NEW glue)              │
│                   │   reads result)     │                          │
│                   └──────────┬──────────┘                          │
├──────────────────────────────┼─────────────────────────────────────┤
│                  MATH MODULE  │  (PORTED, framework-agnostic)      │
│  ┌────────────────────────────▼───────────────────────────────┐   │
│  │  math/questionSelector.js  ← selectNext(playerState, tables)│   │
│  │  math/config.js                                             │   │
│  │  math/playerState.js  ← getAccuracy/isMastered/updateAccuracy│  │
│  └─────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│              PERSISTENCE  (DEFERRED — seam only)                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  persistence/store.js   (empty/no-op this milestone)         │  │
│  │  localStorage v2 save  ← hooks into playerState.toJSON()     │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New / Ported | Implementation |
|-----------|----------------|--------------|----------------|
| `main.js` | `kaplay()` init, global asset load, register scenes, `go("game")` | **NEW** | Kaplay entry; no game logic. |
| `scenes/game.js` | Build the level (parent container), spawn player/platforms/goal, run loop, detect goal collision → trigger math gate | **NEW** | One scene; parent-object pause pattern. |
| `entities/player.js` | Player game object: `sprite + pos + area + body`, run/jump input | **NEW** | Kaplay ECS components. |
| `entities/platform.js`, `goal.js` | Static colliders (`body({ isStatic: true })`), goal flag (`area`) | **NEW** | Kaplay ECS. |
| `ui/mathGate.js` | Render the question + 4 options as a **paused overlay**, capture answer, return correct/incorrect, advance/resume | **NEW (glue)** | Calls `QuestionSelector.selectNext`; renders with Kaplay `text`/`rect` or DOM. |
| `math/questionSelector.js` | Weighted question generation | **PORTED verbatim** | ES module export. |
| `math/playerState.js` | Accuracy/mastery state + `updateAccuracy` | **PORTED (accuracy half)** | ES module export. |
| `math/config.js` | Tables, thresholds | **PORTED** | ES module export. |
| `levels/level1.js` | Level definition (layout, spawn, goal position) | **NEW** | Data file (see Data Flow). |
| `persistence/store.js` | localStorage save/load (XP, history) | **DEFERRED** | Stubbed seam; no behavior this milestone. |

---

## Recommended Project Structure

```
math-lab/
├── index.html              # entry; loads vendored kaplay + main.js as module
├── lib/
│   └── kaplay.mjs          # VENDORED Kaplay (no CDN, offline-safe)
├── src/
│   ├── main.js             # NEW: kaplay() init, loadAssets(), scene registration, go("game")
│   ├── assets.js           # NEW: all loadSprite/loadSpriteAtlas calls in one place
│   ├── scenes/
│   │   └── game.js         # NEW: the one playable level scene
│   ├── entities/
│   │   ├── player.js       # NEW: makePlayer() → component array
│   │   ├── platform.js     # NEW: makePlatform()
│   │   └── goal.js         # NEW: makeGoal()
│   ├── ui/
│   │   └── mathGate.js     # NEW (glue): paused overlay, runs a question, returns result
│   ├── levels/
│   │   └── level1.js       # NEW: level layout data (string-map or object list)
│   ├── math/               # PORTED — framework-agnostic, zero Kaplay imports
│   │   ├── config.js
│   │   ├── playerState.js
│   │   └── questionSelector.js
│   └── persistence/
│       └── store.js        # DEFERRED seam: no-op/stub this milestone
└── assets/
    ├── sprites/            # CC0 pixel-art PNGs (player, tiles, goal)
    └── atlas.json          # optional sprite-atlas definition (see Asset Loading)
```

### Structure Rationale

- **`src/math/` imports NOTHING from Kaplay.** This is the decoupling firewall: the ported brain stays a
  pure module that could be unit-tested in Node or reused in a future quiz mode. The game depends on math;
  math never depends on the game.
- **`ui/mathGate.js` is the ONLY bridge** between game and math. It is the single integration point — it
  imports `questionSelector` + `playerState`, and the game scene imports only `mathGate`. Keeping the bridge
  in one file means the coupling is auditable and the math module can change provider (overlay → scene)
  without touching the algorithm.
- **`assets.js` centralizes loads** so the offline/`file://` asset-path gotcha is fixed in one place.
- **`persistence/` exists from day one as a stub** so wiring it later is "fill in the file," not "restructure
  the project." (See seam below.)
- **`levels/` separate from scene** so adding level 2..N is adding a data file + a `go("game", level2)`,
  not editing scene code.

---

## Architectural Patterns

### Pattern 1: Paused-Overlay Math Gate (RECOMMENDED) vs Separate Scene

**The central decision.** Two viable models for "playing the level" vs "answering a question":

**(A) Paused overlay within one scene — RECOMMENDED.**
Kaplay supports `obj.paused = true`, which stops `onUpdate()` and event listeners for that object **and all
its children**, while still drawing them. The idiomatic pattern: gameplay entities are children of one parent
container; the math overlay is attached to the scene root, so it stays live while the world freezes behind it.

```javascript
// scenes/game.js
const world = add([]);                       // parent container (pausable)
const player = world.add([ /* player comps */ ]);
world.add([ /* platforms, goal */ ]);

player.onCollide("goal", () => {
  world.paused = true;                       // freeze the level, keep it drawn
  runMathGate({                              // overlay attached to root → stays live
    onResolved(correct) {
      // resume; deferred to avoid event-ordering bug
      wait(0, () => { world.paused = false; });
      if (correct) advanceOrWinLevel();
    },
  });
});
```

- **What:** The level stays visible (frozen) behind a question overlay. No teardown, no reload.
- **When:** Default for this project.
- **Trade-offs (ADHD-friendly feel — decisive):** The world stays on screen, so there is **no jarring
  scene cut, no asset re-init, no context loss** — the question feels like part of the same moment. This
  directly serves the "seamless, no-pressure" requirement. Downside: pause-event ordering needs the
  `wait(0, ...)` deferred-unpause guard (a known, documented Kaplay gotcha).

**(B) Separate `question` scene via `go("question", data)`.**

```javascript
player.onCollide("goal", () => go("question", { table: ..., levelId: 1 }));
// in scene("question", ...) → on correct: go("game", nextLevelData)
```

- **What:** Switch to a dedicated scene; switch back on resolve.
- **When:** Choose only if the question UI becomes large/complex enough to warrant its own scene, or for a
  full-screen "stage clear" sequence later.
- **Trade-offs:** Cleaner separation, BUT `go()` **destroys all objects in the previous scene** — the level
  visually disappears and must be rebuilt on return. That cut is exactly the discontinuity to avoid for a
  12-year-old (possible ADHD) who should feel "I'm still in my level." Also re-running the level scene
  re-spawns the player at start unless you thread position through.

**Verdict:** Use **(A) paused overlay** for the end-of-stage gate this milestone. Keep `mathGate` decoupled
enough that swapping to (B) later is a `mathGate` internal change, not a game-logic change.

### Pattern 2: Math Module as a Pure ES-Module Firewall

**What:** The ported brain is plain ES modules with no Kaplay imports. `mathGate` is the single adapter.
**When:** Always — this is the decoupling contract.
**Trade-offs:** One extra indirection file (`mathGate`) vs calling the selector from scene code directly.
Worth it: keeps the tuned algorithm testable and reusable, and isolates the future overlay/scene swap.

```javascript
// ui/mathGate.js  — the ONLY file that imports both worlds
import { QuestionSelector } from "../math/questionSelector.js";
import { playerState } from "../math/playerState.js";

export function runMathGate({ allowedTables, onResolved }) {
  const q = QuestionSelector.selectNext(playerState, allowedTables);
  // render q.question + q.options (Kaplay objects or DOM), on pick:
  //   const correct = pick === q.answer;
  //   playerState.updateAccuracy(q.table, correct);   // feeds the weighting loop
  //   onResolved(correct);
}
```

### Pattern 3: Player-as-Component-Factory (Kaplay ECS)

**What:** Entities are functions returning a component array passed to `add()`/`world.add()`.
**When:** All entities.
**Trade-offs:** Idiomatic Kaplay; keeps `body()`/`area()`/`pos()`/`sprite()` composition readable.

```javascript
// entities/player.js
export function makePlayer(spawn) {
  return [
    sprite("player"), pos(spawn), area(), body(),
    "player",
    { speed: 200, jumpForce: 640 },
  ];
}
// in scene: const player = world.add(makePlayer(level.spawn));
//   onKeyDown("left"/"right") → player.move(...); onKeyPress("space") → if(player.isGrounded()) player.jump(player.jumpForce)
```

### Pattern 4: Centralized Asset Loading + Sprite Atlas for CC0 packs

**What:** One `assets.js` with all `loadSprite()` / `loadSpriteAtlas()` calls, awaited at boot.
**When:** Always.
**Trade-offs:** Kaplay loads sprites async before the first scene; centralizing prevents the common
`file://`-vs-server path bug and missing-frame errors.

```javascript
// assets.js
export function loadAssets() {
  // simple per-file
  loadSprite("player", "assets/sprites/player.png");
  // OR sprite atlas (one PNG + frame map) for a CC0 pack:
  loadSpriteAtlas("assets/sprites/tiles.png", {
    "grass":  { x: 0,  y: 0, width: 16, height: 16 },
    "goal":   { x: 16, y: 0, width: 16, height: 16 },
    "player": { x: 0, y: 16, width: 16, height: 32, sliceX: 4, anims: { run: { from: 0, to: 3, loop: true } } },
  });
}
```
For CC0 packs (Kenney/itch) that already ship a single spritesheet, **prefer `loadSpriteAtlas` with a
hand-written or pack-provided frame map** over many `loadSprite` calls — fewer HTTP requests offline, and
animations (`anims`) live with the atlas. Kenney packs typically include per-frame sizes; itch packs may
need you to author the atlas JSON. Pin the chosen pack's tile size (commonly 16×16) into `config`.

---

## Data Flow

### Level → Play → Gate → Advance

```
boot:  main.js → kaplay() → loadAssets() → scene("game", build) → go("game", level1)
        ↓
play:  level1 data → build platforms/player/goal under `world` parent
        ↓ (keyboard) move/jump, body() gravity + platform collision
reach: player.onCollide("goal")
        ↓
gate:  world.paused = true → mathGate.runMathGate({allowedTables})
        ↓                         ↓
        │                    QuestionSelector.selectNext(playerState, allowedTables)
        │                         ↓  → { table, multiplicand, answer, options[4], question }
        │                    render overlay (4 choices, no timer)
        ↓                         ↓ user picks
resolve: correct? ── playerState.updateAccuracy(table, correct)  ← closes weighting loop
        ↓
        ├─ correct  → wait(0) → world.paused=false → level complete / next level
        └─ wrong    → wait(0) → world.paused=false → re-ask (no punishment; ADHD-safe)
```

### Level Definition (ONE level, room for more)

**Recommendation: a tiny per-level data object with a string tile-map.** Kaplay's `addLevel()` consumes a
string array + a tile legend, which is the lowest-effort way to lay out one hand-designed level and trivially
add more.

```javascript
// levels/level1.js
export const level1 = {
  id: 1,
  tileSize: 16,
  allowedTables: [6, 7, 8, 9],          // feeds QuestionSelector for this stage
  spawn: { x: 32, y: 200 },
  layout: [
    "                      ",
    "                  $   ",   // $ = goal
    "          ===         ",
    "   @           ===    ",   // @ = player spawn (or use spawn{})
    "======================",   // = = ground
  ],
  legend: {
    "=": () => [sprite("grass"), area(), body({ isStatic: true }), "ground"],
    "$": () => [sprite("goal"), area(), "goal"],
  },
};
```

- **Why string-map over hard-coded `add()` calls:** Editing a level becomes editing ASCII art (designer-
  friendly, fast to iterate one *polished* level), and adding level 2 is a new file + `go("game", level2)`.
- **Why not a full Tiled/JSON tilemap this milestone:** Overkill for one level; adds a tool + export step
  against the no-build-step constraint. Revisit only when level count grows.
- **`allowedTables` travels with the level** → the same field the v2 brain already accepts (`allowedTables`
  arg to `selectNext`). Zero new selector code.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `scenes/game.js` ↔ `ui/mathGate.js` | direct call `runMathGate({allowedTables, onResolved})` + callback | Game never imports the selector directly — only the gate. |
| `ui/mathGate.js` ↔ `math/*` | `QuestionSelector.selectNext(playerState, allowedTables)`, `playerState.updateAccuracy()` | The one place the two worlds meet. Result returned via callback. |
| `math/questionSelector.js` ↔ `math/playerState.js` | reads `getAccuracy()`, `isMastered()` | **Pre-existing coupling — ported as-is.** Determines the minimal port. |
| `levels/level1.js` → `scenes/game.js` | passed as `go("game", levelData)` arg | Level data is the only scene parameter. |

### The Deferred Persistence Seam (leave open, do NOT build now)

The v1/v2 app already proved the localStorage pattern (versioned key `mathlab_save_v2`, `toJSON`/`fromJSON`,
quota handling, v1→v2 migration). To avoid a rewrite when persistence returns:

1. **Keep `playerState.toJSON()` / `fromJSON()` in the ported module even though nothing calls them yet.**
   They are cheap and define the save shape.
2. **Create `persistence/store.js` now as a no-op stub** with the eventual signatures:
   `save(playerState)` and `load() → savedData | null`. This milestone they do nothing (or `load()` returns
   `null` → fresh state).
3. **Route all state mutation through `playerState`** (already true: `updateAccuracy`, future `addXp`). When
   persistence lands, the only new calls are `store.save(playerState)` after a resolved question and
   `playerState.fromJSON(store.load())` at boot in `main.js`. No restructuring.
4. **XP/leveling is part of the deferred chunk** — `addXp` exists in the ported PlayerState but stays unwired
   to UI this milestone. The seam is "call `addXp` on correct, then `store.save`," both single lines.

**Net:** wiring persistence later = ~3 lines in `main.js` (load at boot) + ~2 lines in `mathGate` (save on
resolve). The architecture must not require more than that.

### External / Offline

| Concern | Pattern | Notes |
|---------|---------|-------|
| Vendored Kaplay | `lib/kaplay.mjs`, imported by `main.js` | No CDN; ships offline. |
| `file://` module + asset loading | one-line `python3 -m http.server` | Browsers block ES-module + sprite loads over `file://`; document the server command (already accepted in PROJECT.md). |
| Assets | `assets/` + centralized `assets.js` | CC0 PNGs only; no external fetch. |

---

## Anti-Patterns

### Anti-Pattern 1: Calling QuestionSelector from scene/loop code

**What people do:** Import `questionSelector` directly in `game.js` and scatter `updateAccuracy` calls in
collision handlers.
**Why it's wrong:** Re-couples the tuned brain to Kaplay specifics; makes the overlay→scene swap a
multi-file change; loses the single auditable bridge.
**Do this instead:** Route everything through `ui/mathGate.js`. Game code knows only `runMathGate`.

### Anti-Pattern 2: Modifying the ported selection algorithm to "fit" the game

**What people do:** Tweak weights/distractors while wiring it in.
**Why it's wrong:** The 6–9 weighting + EWMA was tuned and audited across v1/v2 (DIFF-01/DIFF-02). Changing
it during a port conflates two concerns and risks regressions.
**Do this instead:** Port verbatim. Pass `allowedTables` per level for difficulty; leave the math alone.

### Anti-Pattern 3: Using `go()` to a question scene for the end-of-stage gate

**What people do:** `go("question")` and `go("game")` round-trip.
**Why it's wrong:** `go()` destroys the level; the world vanishes and re-spawns — a discontinuity that
undercuts the "still in my game" feel and re-inits the player position.
**Do this instead:** Paused overlay (Pattern 1). Reserve scene switches for genuinely full-screen moments
(title, "level complete" celebration) later.

### Anti-Pattern 4: Building persistence/XP UI now "while we're here"

**What people do:** Wire localStorage + level-up overlays in the same milestone.
**Why it's wrong:** PROJECT.md explicitly defers it; it widens scope against "one polished level."
**Do this instead:** Stub the seam (above) and stop. Make the *first* level feel like a real game.

---

## Scaling Considerations

(Single-user local game — "scale" means content/feature growth, not load.)

| Growth | Architecture adjustment |
|--------|-------------------------|
| 1 level → many levels | Add `levels/levelN.js` files; `go("game", levelN)`. No scene rewrite. String-map already supports it. |
| Bigger/complex levels | Migrate from hand-string-map to Tiled JSON + a loader; only `levels/` + `assets.js` change. |
| Richer math mechanics (locked doors, defeat-enemy) | New gate *triggers* (door collide, enemy hit) call the same `runMathGate`; selector untouched. The `mathGate` bridge is the extension point. |
| Persistence + XP + level-up | Fill the stubbed seam (3–5 lines as described); reuse v2 save format. |
| Audio | Add `loadSound` to `assets.js`; play in `mathGate`/scene events. |

### First bottleneck
**Coupling creep**, not performance. If math calls leak into scene/loop code, every future mechanic gets
harder. The `mathGate` firewall is the thing to protect.

---

## Suggested Build Order (dependency-driven)

1. **Project skeleton + vendored Kaplay boot.** `index.html`, `lib/kaplay.mjs`, `main.js` with `kaplay()` and
   an empty `scene("game")` that draws "hello". Confirm it runs via `python3 -m http.server`.
   *(Unblocks everything; verifies the offline/module/server path first — the riskiest infra step.)*
2. **Asset loading + one sprite on screen.** Choose CC0 pack, drop PNGs in `assets/`, write `assets.js`
   (`loadSprite`/`loadSpriteAtlas`), render the player sprite. *(Validates atlas + path handling early.)*
3. **Platformer core.** Player `body()`+`area()`, gravity, run/jump input, static platforms, camera if needed.
   Make movement *feel* good. *(The intrinsically-fun part; depends on assets.)*
4. **Level definition + goal.** `levels/level1.js` string-map via `addLevel()`, place ground/platforms/goal,
   detect `onCollide("goal")`. One polished, completable level. *(Depends on core movement.)*
5. **Port the math brain.** Extract `config.js`, `playerState.js` (accuracy half + keep `toJSON/fromJSON`),
   `questionSelector.js` into `src/math/` as pure ES modules. Smoke-test `selectNext` in isolation.
   *(Independent of game; can run in parallel with 3–4.)*
6. **Math-gate integration (the bridge).** `ui/mathGate.js`: on goal collision → `world.paused=true` →
   render question overlay → capture pick → `updateAccuracy` → resume/advance with deferred unpause.
   *(Depends on 4 + 5; this is the milestone's keystone.)*
7. **Persistence seam stub.** Add `persistence/store.js` no-ops + confirm the load-at-boot / save-on-resolve
   call sites are one-liners. *(Depends on 5; closes the milestone without building persistence.)*
8. **Polish pass.** Dark/grunge styling on overlay + sprites, ADHD checks (no timer, forgiving wrong-answer
   loop, clear feedback), tune jump feel. *(Last; depends on all.)*

**Parallelization note:** Step 5 (port) has zero dependency on the game shell and can proceed alongside
steps 3–4. Step 6 is the join point.

---

## Sources

- [KAPLAY Guides — Scenes](https://kaplayjs.com/docs/guides/scenes/) — `scene()`/`go()` API, data passing, `stay()`, "code inside scenes" guidance. (HIGH — official docs)
- [KAPLAY Guides — Pausing](https://v4000.kaplayjs.com/docs/guides/pausing/) — `obj.paused`, parent-object pause pattern, deferred-unpause `wait(0,...)` gotcha. (HIGH — official docs)
- [KAPLAY Guides — Creating your first game / Reference](https://kaplayjs.com/docs/guides/creating_your_first_game/) — `body()`, `isGrounded()`, `jump(force)`, component/ECS model, `loadSprite`/`loadSpriteAtlas`, `addLevel`. (HIGH — official docs)
- [The KAPLAY Game Library in 5 Minutes](https://jslegenddev.substack.com/p/the-kaplay-game-library-in-5-minutes) — ECS overview, scene basics. (MEDIUM — community)
- `math-lab.html` (this repo, lines ~611–1030) — QuestionSelector / PlayerState / CONFIG / PersistenceStore source of truth for the port. (HIGH — direct source read)
- `.planning/PROJECT.md` v3.0 — constraints, deferred-scope decisions, target user. (HIGH — project canon)

---
*Architecture research for: Kaplay 2D platformer + ported math brain (v3.0 The Platformer)*
*Researched: 2026-06-22*
