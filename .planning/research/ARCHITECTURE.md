# Architecture Research

**Domain:** Kaplay 3001 single-page platformer (no build step), v4.0 "Content & Challenge" integration into a shipped v3.0 slice
**Researched:** 2026-06-28
**Confidence:** HIGH (grounded in the actual v3.0 source: `main.js`, `scenes/game.js`, `level.js`, `progress.js`, `ui/mathGate.js`, `config.js`, `fx.js`, `player.js`)

> **Mode: subsequent-milestone integration.** This is NOT a greenfield design. Every recommendation below extends the shipped v3.0 architecture and is constrained by four invariants that already gate the repo: **no-build** (vendored `lib/kaplay.mjs`, ES modules served static), **a727c13** (no Kaplay global / `typeof <global>` reference at module top level — imports are hoisted before `kaplay()` installs globals), **anti-leak** (closure-local run state + tag/`destroy` cleanup across `go()`/respawn, global controllers `.cancel()`ed on `onSceneLeave`), and **no-timer** (`scripts/check-safety.sh` fails the commit on `setTimeout`/`setInterval`/`wait(`/`loop(`/`lifespan(` and on any punishment construct). Reuse, don't rebuild.

---

## Standard Architecture

### System Overview — target v4.0 module graph

```
┌──────────────────────────────────────────────────────────────────────┐
│  BOOT  (src/main.js)                                                   │
│  kaplay({global:true}) → loadSprite(...×N) + loadSpriteAtlas(player)   │
│  → registerScenes() → go("title")        [the ONLY top-level globals]  │
├──────────────────────────────────────────────────────────────────────┤
│  SCENE LAYER  (src/scenes/*)   — Kaplay scenes; globals used at run-time│
│  ┌──────────┐   go("select")   ┌────────────┐  go("game",{levelId})    │
│  │ title.js │ ───────────────► │ select.js  │ ───────────────────────┐ │
│  └──────────┘                  │ (world-map)│ ◄── go("select",{from}) │ │
│        ▲ go("title")           └────────────┘                        ▼ │
│        └────────────────────────────  go("select",{from})  ┌───────────┐│
│                                                            │  game.js  ││
│                                                            │ (param by ││
│                                                            │  levelId) ││
│                                                            └─────┬─────┘│
├──────────────────────────────────────────────────────────────────┼────┤
│  CONTENT LAYER  (data + builders) — pure data; built at scene time │    │
│  ┌────────────────┐   getLevel(id)   ┌────────────────────────────┐│    │
│  │ levels/index.js│ ◄─────────────── │ buildLevel(levelData) emits ││    │
│  │  LEVELS{} reg. │                  │ floors/platforms/coins/spike││    │
│  │  + ORDER[]     │                  │ + math-mechanic entities    ││    │
│  └────────────────┘                  └─────────────┬──────────────┘│    │
├──────────────────────────────────────────────────┼────────────────┼────┤
│  MATH-CHALLENGE SEAM  (src/ui/*) — one-way: ui → brain, never scenes│    │
│  ┌──────────────────────────────────────────────────────────────┐ │    │
│  │ ui/challenge.js  openChallenge({brain,onSolved,onWrong?,…})    │◄┘    │
│  │   ← mathGate.js becomes the END-OF-LEVEL caller of this seam   │      │
│  │   attached to: door · key-pickup · checkpoint · enemy          │      │
│  └──────────────────────────────┬───────────────────────────────┘      │
├─────────────────────────────────┼──────────────────────────────────────┤
│  PURE FACTORY LAYER (firewall — ZERO Kaplay imports, node-testable)     │
│  ┌──────────────┐  ┌──────────────────────────────────────────────┐    │
│  │ math/brain.js│  │ progress.js  createProgress + loadSave/writeSave│   │
│  │ createBrain()│  │   serialize() v2 blob {version,xp,level,        │    │
│  └──────────────┘  │   accuracy,history, levels:{}}  + migrate(v1→v2)│   │
│                    └──────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────────────────────┤
│  PRESENTATION HELPERS  player.js · camera.js · fx.js · ui/hud.js        │
│  parallax.js (NEW) — all engine-globals-inside-functions (a727c13)      │
├────────────────────────────────────────────────────────────────────────┤
│  CONFIG  (src/config.js) — every tunable; imports nothing (leaf)        │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New / Modified / Reused |
|-----------|----------------|-------------------------|
| `main.js` | Boot: `kaplay()`, register **all** sprite assets (incl. atlas + tiles + bg), `registerScenes()`, `go("title")` | **Modified** — more `loadSprite`/`loadSpriteAtlas`, register N scenes, boot title not game |
| `scenes/title.js` | Title screen: art + "press any key / click PLAY" → `go("select")` | **New** |
| `scenes/select.js` | World-map / level-select: read progress, render node per level (locked/unlocked/cleared), `go("game",{levelId})` | **New** |
| `scenes/game.js` | The play scene, **parametrized by `data.levelId`**. Loads that level's data, builds it, wires mechanics, on clear persists per-level completion + returns to select | **Modified** (heavily, but spine preserved) |
| `levels/index.js` | Level **registry**: `LEVELS` map keyed by id + ordered `LEVEL_ORDER`; `getLevel(id)`, `nextLevelId(id)` | **New** |
| `levels/<id>.js` | One level's authored data object (the v3.0 `LEVEL` shape, extended with mechanic arrays) | **New** (3–5 of them) — `level.js`'s `LEVEL` becomes the first one |
| `level.js` → `levels/build.js` | `buildLevel(levelData)` — pure builder; emits colliders + tagged entities incl. the four mechanic entity types | **Modified** (rename + extend; keep merged-floor/tight-spike idioms verbatim) |
| `ui/challenge.js` | The shared **math-challenge seam**: `openChallenge(...)` generalizing `mathGate.js` | **New** (extracted from mathGate) |
| `ui/mathGate.js` | Thin end-of-level caller of `openChallenge` (back-compat alias) | **Modified** (or kept as a 1-line wrapper) |
| `math/brain.js` | Weighted 6–9 selection + EWMA. **Unchanged** (locked, out of scope) | **Reused verbatim** |
| `progress.js` | XP/level + save seam, **extended** with `levels:{}` completion map + a real v1→v2 migration | **Modified** (additive + migration) |
| `parallax.js` | Multi-layer scrolling background bound to camera pos | **New** |
| `player.js` | Player entity + game-feel; swap static sprite for an **animated atlas** (idle/run/jump) | **Modified** (sprite + `play()` calls) |
| `fx.js`, `camera.js`, `ui/hud.js`, `config.js` | Juice / camera / HUD / tunables | **Reused** (config grows new namespaces) |

---

## Recommended Project Structure

```
src/
├── index.html              # unchanged (file:// guard stays)
├── main.js                 # MODIFIED — load all assets, registerScenes(), go("title")
├── config.js               # MODIFIED — SAVE.VERSION=2 + ANIM, BG, MECHANIC, MAP namespaces
├── scenes/
│   ├── title.js            # NEW
│   ├── select.js           # NEW — world-map / level-select
│   └── game.js             # MODIFIED — parametrized by data.levelId
├── levels/
│   ├── index.js            # NEW — registry: LEVELS{}, LEVEL_ORDER[], getLevel(), nextLevelId()
│   ├── build.js            # MODIFIED level.js — buildLevel(levelData) (mechanic-aware)
│   ├── level-01.js         # NEW (the v3.0 LEVEL moves here, extended)
│   ├── level-02.js … 05.js # NEW
├── ui/
│   ├── challenge.js        # NEW — openChallenge() shared math-challenge seam
│   ├── mathGate.js         # MODIFIED — thin caller of challenge.js (end-of-level flavor)
│   └── hud.js              # reused
├── math/brain.js           # REUSED verbatim
├── progress.js             # MODIFIED — levels{} + migrate v1→v2
├── player.js               # MODIFIED — animated atlas
├── camera.js               # reused (takes bounds as param)
├── parallax.js             # NEW
└── fx.js                   # reused
assets/                     # sibling of src/ (web-root convention — `../assets/...`)
├── player.png|json         # animated atlas (sliceX/atlas + anims)
├── tiles/                  # tileset
├── bg/                     # parallax layers
├── key.png door.png enemy.png …  # mechanic sprites
lib/kaplay.mjs              # vendored — unchanged
scripts/check-safety.sh     # reused as-is — still gates the WHOLE src/ tree
```

### Structure Rationale

- **`levels/` folder:** v3.0 had one `LEVEL` const + `buildLevel` in `level.js`. Many levels need a registry + per-level data files. Splitting `build.js` (logic) from `level-NN.js` (data) keeps the builder a single tested unit while data scales. `level.js`'s data lifts verbatim into `level-01.js`; its builder logic becomes `build.js`.
- **`scenes/` grows from 1 → 4:** Kaplay's `scene(name, cb)` / `go(name, data)` is the *native, intended* multi-screen mechanism — no router library, no DOM. Each screen is one closure file, mirroring `game.js`.
- **`ui/challenge.js` separate from `mathGate.js`:** the four mid-game mechanics + the end gate are five callers of one overlay+brain bridge. Extract the bridge once; `mathGate.js` becomes the "end of level" preset so its name/contract survive for existing wiring.
- **Everything pure stays pure:** `math/`, `progress.js`, `levels/*.js` (data) import only `config.js` — node-testable, firewall intact. Only `build.js`, `scenes/*`, `ui/*`, `player/camera/fx/parallax` touch Kaplay globals, and only **inside function bodies**.

---

## Architectural Patterns

### Pattern 1 — Level registry + `go("game",{levelId})` parametrization (Question 1)

**What:** Replace the single imported `LEVEL` with a keyed registry. The `game` scene reads `data.levelId` from the `go()` payload (the *same* CONTEXT-locked seam already used for `startX/startY`) and looks up its data — never imports a specific level.

**Why this shape:** `game.js` already proves the pattern — it reads `data?.startX ?? 64`. Extending the payload with `levelId` is zero new mechanism and preserves anti-leak (no module-level "current level" `let`; the level identity lives in the call, recreated each `go()`).

**Registry (`levels/index.js`) — pure, imports only data files:**
```js
import { LEVEL_01 } from "./level-01.js";
import { LEVEL_02 } from "./level-02.js";
// …
export const LEVELS = { "01": LEVEL_01, "02": LEVEL_02, /* … */ };
export const LEVEL_ORDER = ["01", "02", "03", "04", "05"];
export const getLevel = (id) => LEVELS[id] ?? LEVELS[LEVEL_ORDER[0]]; // forgiving fallback
export const nextLevelId = (id) => {
  const i = LEVEL_ORDER.indexOf(id);
  return i >= 0 && i + 1 < LEVEL_ORDER.length ? LEVEL_ORDER[i + 1] : null; // null = last
};
```

**Level data shape** — superset of today's `LEVEL` (floors/platforms/coins/spikes/goal/checkpoints) plus per-level identity, difficulty, bounds, and mechanic arrays:
```js
export const LEVEL_02 = {
  id: "02",
  name: "The Drop",
  bounds: { left: 0, right: 2560, top: 0, bottom: 360 },  // was global CONFIG.LEVEL_*; now per-level
  start: { x: 64, y: 64 },                                 // spawn (replaces go() literals)
  tables: [6, 7],                                          // difficulty knob (selection scope)
  floors: [...], platforms: [...], coins: [...], spikes: [...],
  checkpoints: [...], goal: { x, y },
  // NEW mechanic arrays (any may be empty → mechanic absent for this level):
  doors: [{ x, y, w, h, keyId: "k1" }],
  keys:  [{ x, y, id: "k1" }],
  collectibles: [{ x, y }],                  // collect-the-answer pickups
  mathGates: [{ x, y, kind: "checkpoint" }], // multiple mid-level gates
  enemies: [{ x, y, patrol: 80 }],
};
```

**`game.js` change (spine preserved):**
```js
export function gameScene(data) {
  const levelId = data?.levelId ?? LEVEL_ORDER[0];   // NEW — read from payload
  const level = getLevel(levelId);                   // NEW — registry lookup
  const startX = data?.startX ?? level.start.x;       // start now comes from level data
  // … buildLevel(level) instead of buildLevel(LEVEL) …
  // bounds: read level.bounds.* instead of CONFIG.LEVEL_* in camera clamp + fall check
}
```

**Trade-off:** `bounds` move from global `CONFIG.LEVEL_*` to per-level data — required for differently-sized levels. `camera.js`/`followCamera` and the fall-threshold check must take bounds as a parameter rather than reading `CONFIG` directly. Small, mechanical edit; keep `CONFIG.LEVEL_*` as defaults for safety.

### Pattern 2 — Multi-scene navigation (Question 2)

**What:** Three new screens are three `scene()` registrations. Navigation is `go(name, data)`; data flows one-way through the payload, exactly like `game.js` today.

```
title ──any key/PLAY──► select ──node click──► game(levelId)
  ▲                        ▲                        │
  └────(optional)──────────┴────on clear / on back─┘  go("select", { lastCleared: levelId })
```

**`registerScenes()` in `main.js`** keeps all `scene(...)` calls in one place (run-time globals, after `kaplay()`):
```js
function registerScenes() {
  scene("title",  titleScene);
  scene("select", selectScene);
  scene("game",   gameScene);
}
// … registerScenes(); go("title");
```

**Anti-leak across scenes (CRITICAL):** every new scene must honor the same teardown `game.js` already does — any **global** controller (`onKeyPress`, `onHide`, app-global `onClick`) must be `.cancel()`ed in `onSceneLeave`. Tagged objects are wiped by Kaplay on scene change, but global event controllers are not. The title screen's "press any key" `onKeyPress` and the select screen's node hotkeys are the new leak risks — cancel them on leave. (`mathGate.js` already models this with `keyCtrls.forEach(c => c.cancel())`.)

**`go()` data flow:** `select` reads progress on entry to decide locked/unlocked/cleared (see Pattern 4); on clearing a level, `game.js` does `go("select", { lastCleared: levelId })` so the map can highlight/scroll to the freshly unlocked node. No shared module state — the payload is the channel.

**Trade-off:** `go()` rebuilds the destination scene fresh each time (good for leak hygiene, costs a re-mount). For these tiny scenes that's negligible and is the engine's intended model.

### Pattern 3 — One shared math-challenge seam for four mechanics (Question 3)

**What:** Generalize `mathGate.js` into `ui/challenge.js`. The current `openMathGate({brain,onClear})` already *is* 90% of the abstraction — it renders an in-world `fixed()/z()` overlay, pulls `q = brain.nextQuestion()`, runs the dual-input `choose(i)`, calls `brain.reportResult(q.a, correct)`, and fires a one-shot callback on correct. The four mechanics differ only in **what the correct answer does** and **how a wrong answer behaves**, not in the question UI.

**The seam:**
```js
// ui/challenge.js
export function openChallenge({
  brain,                 // injected (one-way: challenge → brain, never → scenes)
  onSolved,              // fired exactly once on correct  (was onClear)
  flavor = "gate",       // "gate" | "door" | "key" | "checkpoint" | "enemy" — picks copy/skin only
  dismissable = false,   // collectible/door may allow walking away; gate does not
}) { /* same overlay + choose(i) machinery as today */ }
```

**Mechanic = (entity tag) + (collision wiring) + (one `openChallenge` call).** All four live in `game.js` (or a small `mechanics.js` helper invoked by `game.js`), each following the *exact* `onReachGoal` idiom already in the code (freeze interaction → open challenge → on solved, mutate world):

| Mechanic | Entity (built by `build.js`, tagged) | `onSolved` action | Wrong-answer behavior |
|----------|--------------------------------------|-------------------|-----------------------|
| Locked door / key | `"door"` (+ required `keyId`) | `destroy(door)` (or open anim) → passage clears | forgiving: re-ask same q (today's default) |
| Collect-the-answer | `"collectible"` | award coin/XP, `destroy(pickup)` | forgiving |
| Mid-level checkpoint gate | `"mathgate"` marker | promote checkpoint + open path | forgiving |
| Defeat enemy | `"enemy"` (👺💀🐉 reuse) | `destroy(enemy)` + `fx.pop` | forgiving — enemy never "wins"; ADHD-safe, never game-over |

**Why one seam, not four:** the brain firewall must have exactly one consumer pattern (`brain.nextQuestion`/`reportResult`); four hand-rolled overlays would (a) risk four anti-leak bugs (global key controllers), (b) duplicate the dual-input + dim/panel draw, (c) drift the dark-grunge look. The existing `check-gate.sh` structural firewall (fixed overlay, BOTH `cancel()`+`destroy`, no-DOM, no-timer, no-scenes import) should be **re-pointed at `challenge.js`** so all five callers inherit one verified bridge.

**Key engine wiring (matches `onReachGoal` exactly):** open on collision (door/enemy) or on overlap (gate marker) or on `onCollide` pickup; freeze the relevant interaction; the challenge's own fire-once latch guarantees a single `onSolved`. `mathGate.js` becomes:
```js
export const openMathGate = ({ brain, onClear }) =>
  openChallenge({ brain, flavor: "gate", onSolved: onClear });
```
so all current `game.js` wiring keeps working unchanged.

**Trade-off:** a `dismissable` surface adds a little config breadth. Keep wrong-answer **forgiving by default** (no penalty) per the no-timer/forgiving mandate — `check-safety.sh` will reject any punishment construct anyway, which is a useful guardrail on this seam.

### Pattern 4 — Additive save migration v1 → v2 (Question 4)

**What:** Extend the persisted blob with a `levels` completion/unlock map *without* discarding existing v1 XP/level. Today `progress.js` does **NO migration** — a version mismatch returns `defaults()` (a wipe). That was correct for v3.0 (deliberately ignoring the school game's keys), but v4.0 must **not** wipe the kid's real XP. Introduce a real migration step.

**New blob shape (v2):**
```js
{ version: 2, xp, level, accuracy, history,
  levels: { "01": { cleared: true, bestCoins: 8 }, "02": { cleared: false } } }
```

**Migration in `loadSave()` — change the one branch that currently wipes:**
```js
if (data.version === 1) data = migrateV1toV2(data);   // NEW — additive, not a wipe
if (!data || data.version !== CONFIG.SAVE.VERSION) return defaults();
return validate(data);

function migrateV1toV2(v1) {
  return { ...v1, version: 2, levels: {} };  // keep xp/level/accuracy/history; add empty levels
}
```
…and `validate()` gains a whitelisted, range-checked `levels` copier (same explicit-field discipline already used for `accuracy`/`history` — never spread the untrusted blob; this is the prototype-pollution mitigation T-01-01 already in the file). Bump `CONFIG.SAVE.VERSION = 2`.

**Unlock logic = derived, not stored separately:** a level is *unlocked* iff it's the first level OR the previous level (`LEVEL_ORDER`) is `cleared`. Store only `cleared` (a fact); compute `unlocked` from order. This avoids a second source of truth that could desync.

**`progress.js` additions (pure, still node-testable):**
```js
markCleared(levelId, { coins })   // set levels[id].cleared = true; track bestCoins
isCleared(levelId)                // read
isUnlocked(levelId, order)        // first || isCleared(order[i-1])
serialize(brainSnapshot)          // now includes `levels`
```

**Trade-off:** versioned migration is a forward-only chain (`v1→v2`, future `v2→v3`). That's the standard localStorage game-save pattern and keeps each step small. The firewall holds — `progress.js` still imports only `config.js` and stays runnable under node (test the migration headlessly, like the existing smoke).

### Pattern 5 — Animated player + parallax under the a727c13 rule (Question 5)

**What:** Animated player and parallax are pure presentation; both must keep **every Kaplay reference inside function bodies**, never at module top level (the exact bug that bit `level.js` and is documented across `fx.js`/`player.js`).

**Animated player (`player.js` modified):** asset registration is a **boot-time** concern → in `main.js` (after `kaplay()`), swap `loadSprite("player", …)` for an atlas/sliced sheet with named anims (Kaplay 3001 `loadSprite(name, png, { sliceX, sliceY, anims:{ idle, run, jump } })` — the same `anims` mechanism already used for the coin's `spin`). In `player.js`, call `player.play("run"|"idle"|"jump")` from the **existing** `onUpdate`/`onGround`/jump handlers (all already run after init). No new top-level globals; just more `play()` calls inside the factory body where Kaplay is guaranteed installed.

**Parallax (`parallax.js` NEW):** a factory `mountParallax(layers)` called from inside `gameScene`. Each layer is a background sprite offset by a fraction of `camPos()` each frame in an `onUpdate`. Critically: `import { CONFIG } from "./config.js"` is the **only** top-level statement; `add/sprite/pos/onUpdate/camPos/width/height` are used **only inside `mountParallax`** — copy `fx.js`'s header discipline verbatim. Background layers draw at the lowest `z()` so they sit behind the level; the HUD/gate `z()` ceilings (9990+) already sit above everything.

**Why it can't violate a727c13:** the rule only bites top-level evaluation. Both changes add engine calls strictly inside `makePlayer()` / `mountParallax()` / scene callbacks, which run at scene-construction time — long after `kaplay({global:true})`. `node --check` (step 0 of `check-safety.sh`) plus a "no bare engine token at module scope" review keep it honest.

**Trade-off:** parallax adds per-frame draws; at 640×360 with a handful of layers this is well within the 60 FPS target. Keep layer count small (2–3) and `crisp:true` upscaling unchanged.

---

## Data Flow

### Navigation + play flow

```
boot → go("title")
title:  press key / click PLAY → go("select")
select: loadSave() → render node[i] = cleared? unlocked? locked
        click unlocked node → go("game", { levelId })
game:   getLevel(levelId) → buildLevel(level) → makePlayer(level.start)
        play … reach mechanic → openChallenge({brain, onSolved})
        reach goal → openChallenge(flavor:"gate") → onSolved:
            progress.addXp(table); progress.markCleared(levelId,{coins})
            writeSave(progress.serialize(brain.snapshot()))   // includes levels{}
            go("select", { lastCleared: levelId })            // unlocks next via derived rule
```

### Persistence flow (v2)

```
on scene entry:  loadSave() ──(v1?)──► migrateV1toV2 ──► validate ──► {xp,level,accuracy,history,levels}
                 createProgress(saved) + createBrain({seedAccuracy,seedHistory})
on level clear:  progress.addXp → markCleared → writeSave(serialize(brain.snapshot()))
on tab hide:     onHide(writeSave(...))   [controller .cancel()ed onSceneLeave — anti-leak, already present]
```

### Key data flows

1. **Level identity:** travels *only* in the `go("game",{levelId})` payload → registry lookup → builder. Never a module-level `let`. (Same channel as v3.0's `startX/startY`.)
2. **Unlock state:** stored as `cleared` facts in the save; `unlocked` is *derived* from `LEVEL_ORDER` at render time in `select.js`. One source of truth.
3. **Math challenge:** scene/mechanic → `openChallenge({brain})` → `brain.nextQuestion/reportResult` → `onSolved` back into the scene. One-way `ui → brain`; the brain never imports a scene or the challenge.

---

## Scaling Considerations

| Scale | Architecture adjustments |
|-------|--------------------------|
| 3–5 levels (this milestone) | Registry + data files is exactly right; hand-authored data objects. No tooling needed. |
| ~10–20 levels | Same registry; consider extracting level data to JSON fetched at boot if files get unwieldy — but **only if** it stays no-build and same-origin. Probably unnecessary. |
| Many mechanics per level | The `build.js` mechanic-array loops scale linearly; the single `openChallenge` seam means new mechanic = new tag + new `onSolved` action, not new UI. |

### Scaling priorities

1. **First "bottleneck" is authoring ergonomics, not runtime.** Keep `build.js` the single tested builder; keep level data declarative so adding level-06 is a data file + one registry line.
2. **Anti-leak across many `go()`s is the real risk** — every new global controller in title/select/mechanics must be `.cancel()`ed on leave. Make this a review checklist item (and extend `check-safety.sh`/`check-gate.sh` coverage to the new files).

---

## Anti-Patterns

### Anti-Pattern 1 — A module-level "current level" or "unlocked levels" `let`

**What people do:** stash `let currentLevelId` / `let unlocked = []` at module top in `level.js`/`select.js`.
**Why it's wrong:** survives `go()` and respawn → state leaks across plays (the exact failure `game.js` warns against), and duplicates the save as a second source of truth.
**Do this instead:** pass `levelId` through `go()` data; derive `unlocked` from the save's `cleared` facts + `LEVEL_ORDER` each render.

### Anti-Pattern 2 — Four bespoke math overlays for the four mechanics

**What people do:** copy `mathGate.js` four times with small tweaks.
**Why it's wrong:** four anti-leak surfaces (global key controllers), four chances to drift the dark-grunge look, four brain consumers to keep firewalled.
**Do this instead:** one `openChallenge` seam; mechanics differ only in `onSolved` + a `flavor` skin. Re-point the structural firewall script at it.

### Anti-Pattern 3 — Touching Kaplay at module top level for the new files

**What people do:** in `parallax.js`/`select.js`, write `const W = width()` or `typeof add === "undefined"` guards at module scope.
**Why it's wrong:** imports are hoisted before `kaplay()` installs globals → throws at import time → blank game (a727c13, the `level.js` bug).
**Do this instead:** only `import { CONFIG }` at top; all engine calls inside the exported function/scene bodies. Mirror the `fx.js` header discipline.

### Anti-Pattern 4 — Wiping the save on version bump

**What people do:** keep `progress.js`'s current "version mismatch → defaults()" for the v2 change.
**Why it's wrong:** erases the kid's real XP/level — a regression and a trust break.
**Do this instead:** `migrateV1toV2` (additive: keep xp/level/accuracy/history, add `levels:{}`); only fall to defaults for truly unknown/corrupt versions.

### Anti-Pattern 5 — A countdown or "enemy defeats you" failure for the enemy mechanic

**What people do:** make the enemy damage the player / time the answer.
**Why it's wrong:** violates no-timer + forgiving mandates; `check-safety.sh` fails the commit on `gameOver`/`loseLife`/`countdown`.
**Do this instead:** enemy is just another `openChallenge` host; wrong answers re-ask (forgiving); correct destroys it. No HP, no timer.

---

## Integration Points

### External services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| None | — | Static hosting only; no backend, no CDN. All assets vendored under `assets/`/`lib/` (web-root `../` convention — a wrong path is a SILENT 404, per `main.js` Pitfall 1). |

### Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `main.js` ↔ scenes | `scene()` register + `go(name,data)` | The only top-level globals live in `main.js` (after `kaplay()`). |
| scene ↔ scene | `go(name, data)` payload, one-way | No shared module state; payload is the channel (extends v3.0's `startX/startY` seam). |
| `game.js` ↔ `levels/index.js` | `getLevel(id)` / `nextLevelId(id)` | Pure lookup; level identity from `go()` data only. |
| mechanics ↔ `ui/challenge.js` | `openChallenge({brain,onSolved,flavor})` | One bridge for all five callers (4 mechanics + end gate). |
| `ui/challenge.js` ↔ `math/brain.js` | `nextQuestion`/`reportResult` | One-way `ui → brain`; firewall enforced by re-pointed `check-gate.sh`. |
| `scenes/select.js` ↔ `progress.js` | `loadSave`, `isCleared`, `isUnlocked` | `select` reads progress one-way (like HUD reads progress); writes happen only in `game.js` on clear. |
| any module ↔ `config.js` | import leaf constants | `config.js` imports nothing; grows `SAVE.VERSION=2`, `ANIM`, `BG`, `MECHANIC`, `MAP` namespaces. |

---

## Suggested Build Order (dependency-respecting)

> Ordered so each step lands on a green tree, reuses prior seams, and never blocks on art. Persistence-migration and the level-registry are the spine everything else hangs on, so they come early but **additively**.

1. **Save v2 + migration (`progress.js`, `config.js`).** Additive `levels:{}`, `migrateV1toV2`, `validate` extension, `markCleared/isCleared/isUnlocked`, `SAVE.VERSION=2`. Pure + node-testable; no UI dependency. *Why first:* every later screen/level reads/writes this; doing it additively up front avoids a wipe regression and unblocks select + per-level clear. **No engine, no a727c13 risk.**
2. **Level registry + builder refactor (`levels/index.js`, `levels/build.js`, `level-01.js`).** Lift the v3.0 `LEVEL` into `level-01.js`; move builder logic into `build.js`; add `getLevel/nextLevelId`. Parametrize `game.js` by `data.levelId` + per-level `bounds/start` (camera + fall-check take bounds as params). *Why second:* turns one level into "many" with the existing single level still playable end-to-end — proves the parametrization before authoring more content.
3. **Multi-scene shell (`scenes/title.js`, `scenes/select.js`, `main.js registerScenes`, boot `go("title")`).** Wire title→select→game→select navigation with `go()` payloads; `select` reads progress for locked/unlocked/cleared; `game.js` on-clear does `markCleared` + `go("select")`. Anti-leak: cancel new global controllers on leave. *Why third:* needs the registry (2) and save (1); delivers the "sense of progression" loop with placeholder art.
4. **Shared math-challenge seam (`ui/challenge.js`; refactor `mathGate.js` to a thin caller; re-point `check-gate.sh`).** Extract the overlay+brain bridge; keep end-of-level behavior byte-for-byte via the `gate` flavor. *Why fourth:* end-gate keeps working throughout; this is a refactor that *enables* step 5 without changing current behavior.
5. **The four mid-game mechanics** (door/key, collectible, mid-level checkpoint gate, enemy) — each = a tagged entity in `build.js` + a collision wiring in `game.js` + one `openChallenge` call with its `onSolved`. Author into level-02…05 data. *Why fifth:* depends on the seam (4), the registry/builder (2), and multiple levels (3). Add mechanics incrementally; each is independent.
6. **Difficulty curve.** Tune per-level `tables` (6–9 weighting scope) + platforming density across `level-02…05`. Pure data; depends on the levels existing (2/3/5). No code.
7. **Art pass — animated player + tileset + parallax + title art (`player.js`, `parallax.js`, `main.js` asset loads, `config.js ANIM/BG`).** *Why near-last:* presentation overlays a working game; deferring art means steps 1–6 validate with placeholders and the a727c13-sensitive parallax lands once the scene graph is stable.
8. **Polish + UAT.** Juice on mechanics (reuse `fx.js`), HUD tweaks, kid playtest of difficulty/feel. Extend `check-safety.sh`/`check-gate.sh` coverage to all new files.

**Dependency summary:** 1 (save) and 2 (registry) are the spine → enable 3 (scenes). 4 (seam) is a no-behavior-change refactor that unblocks 5 (mechanics). 6 (difficulty) and 7 (art) are data/presentation layered on a working game; 8 polishes. Steps 1, 2, 6 carry **zero a727c13 risk** (pure/data); steps 3, 4, 5, 7 add engine calls and must keep them **inside function bodies** and **cancel global controllers on leave**.

---

## Sources

- v3.0 source (authoritative, read directly): `src/main.js`, `src/scenes/game.js`, `src/level.js`, `src/progress.js`, `src/ui/mathGate.js`, `src/math/brain.js`, `src/config.js`, `src/player.js`, `src/fx.js`, `src/index.html`, `scripts/check-safety.sh` — HIGH confidence (the architecture being extended).
- `.planning/PROJECT.md` (v4.0 milestone goals + carried-forward constraints) — HIGH.
- `.planning/milestones/v3.0-phases/10-…/10-02-SUMMARY.md` (mathGate bridge contract, one-way firewall, `check-gate.sh`) — HIGH.
- `.planning/milestones/v3.0-phases/11-…/11-01-SUMMARY.md` (progress.js save shape, versioning, "NO migration" decision now revisited for v2) — HIGH.
- Kaplay 3001 multi-scene model (`scene`/`go`) and `loadSprite` `anims`/`sliceX` — confirmed in repo usage (coin `spin` anim in `main.js`; `scene`/`go` in `main.js`+`game.js`) — HIGH.

---
*Architecture research for: Kaplay no-build platformer — v4.0 content/challenge integration*
*Researched: 2026-06-28*
