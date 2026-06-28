# Phase 9: Level Build & CC0 Assets - Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 8 (3 new, 4 modified, 1 doc)
**Analogs found:** 7 / 8 (the only no-analog is `CREDITS.md` / `assets/LICENSES/` — pure docs)

> Phase 9 is a **content + asset-wiring** phase, not a new-systems phase. Almost every
> new file has a strong in-repo analog in the Phase 7/8 scaffolding. Copy those analogs
> verbatim for structure (module banner, CONFIG-only constants, scene-closure run state,
> `../`-relative imports), and only swap in the new content (sprites, level data,
> coin/spike/goal collisions). The hardest discipline is **NOT regressing** the Phase 8
> merged-collider floor and the reposition-in-place respawn.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/level.js` (NEW) | level-data + builder | transform (data → entities) | `src/scenes/game.js` (the test-strip `add([...])` block, L32-43) + `src/config.js` (leaf-data module) | role-match |
| `src/scenes/game.js` (MODIFY) | scene/controller | event-driven (onCollide/onUpdate) | itself (Phase 8) — in-place edit | exact |
| `src/player.js` (MODIFY) | entity factory | request-response (input→state) | itself (Phase 8) — one-line sprite swap | exact |
| `src/config.js` (MODIFY) | config | static data | itself (Phase 8) — add constants | exact |
| `src/main.js` (MODIFY) | boot/entry | batch (load→register→go) | itself (Phase 8) — add `loadSprite` calls | exact |
| `src/camera.js` (UNCHANGED) | utility | transform (pos→cam) | itself — consumes new CONFIG only, no edit | exact |
| `CREDITS.md` (NEW) | doc | — | none (no markdown asset docs exist yet) | no analog |
| `assets/LICENSES/*` (NEW) | doc | — | none | no analog |

**Engine-global note (applies to every JS file below):** Kaplay runs with `global: true`,
so `add`, `onUpdate`, `onCollide`, `setGravity`, `vec2`, `rect`, `sprite`, `pos`, `area`,
`body`, `opacity`, `destroy`, `text`, `fixed`, `center`, `tween`, `easings`, `loadSprite`,
`loadSpriteAtlas`, `addLevel`, `dt`, etc. are **already in scope — do NOT import them**.
Only project modules (`./config.js`, `../player.js`, `../camera.js`, `../level.js`) are
imported, always with the `../`-relative web-root convention.

---

## Pattern Assignments

### `src/level.js` (NEW — level-data + builder, transform)

**Analog:** `src/config.js` (leaf-data module shape) + `src/scenes/game.js` L32-43 (entity placement).

**Module-banner + leaf-data pattern** — copy the `config.js` style verbatim (a `// src/…`
banner explaining the module's single responsibility, then one exported `const`):
```javascript
// src/config.js L1-12 — copy this banner+export shape for level.js
// src/config.js — all tunable values in ONE place.
//
// CONTEXT-locked: ... Leaf-level constants only: this module imports nothing.
export const CONFIG = { ... };
```
`level.js` should mirror this: a banner, then `export const LEVEL = { coins: [...],
spikes: [...], goal: {...}, floors: [...], platforms: [...] }` as author-written data.
Keep it **import-light** — at most `import { CONFIG } from "./config.js"` if tile size
is referenced; it lives in `src/`, so siblings are `./` (NOT `../`).

**Entity-placement pattern to copy** (from the test strip, `src/scenes/game.js` L34-43):
```javascript
// src/scenes/game.js L34-43 — the merged-floor + platform idiom the builder reproduces
// ONE merged wide static floor (not many tile colliders) — fewer seams to stick on.
add([rect(1600, 32), pos(0, 320), area(), body({ isStatic: true }), "ground"]);
// raised platforms — same component list, different rect/pos
add([rect(160, 24), pos(760, 240), area(), body({ isStatic: true }), "ground"]);
add([rect(160, 24), pos(1060, 200), area(), body({ isStatic: true }), "ground"]);
```
**CRITICAL — preserve the merged collider (Pitfall 2, RESEARCH Pattern 2 Option B):** each
contiguous floor RUN gets ONE wide `body({ isStatic: true })` collider (like the `rect(1600,32)`
above). Render tiles as separate *visual-only* sprites (`add([sprite("ground"), pos(...)])`
with **no `area()`/`body()`**) on top. Do NOT give every tile its own static body — that
re-introduces the seam-stick bug Phase 8 eliminated. A `buildLevel(LEVEL)` function in this
file (or in the scene) should loop the data and emit these `add([...])` calls.

**Decision:** RESEARCH recommends a JS data list + merged colliders over `addLevel` symbol
maps (Open Question #2) specifically to keep the merged-floor property. Prefer that. `addLevel`
is optional for pure visual tile grids only.

---

### `src/scenes/game.js` (MODIFY — scene, event-driven)

**Analog:** itself (Phase 8). This is an **in-place edit**: REPLACE the test-strip geometry
(L34-43), KEEP everything else (closure state, checkpoints, `reset()`/`respawn()`, fall-off
check, `followCamera`).

**Imports pattern** (L17-19) — add `level.js`, keep the `../` convention:
```javascript
import { CONFIG } from "../config.js";
import { makePlayer } from "../player.js";
import { followCamera } from "../camera.js";
// ADD: import { LEVEL, buildLevel } from "../level.js";  (whatever level.js exports)
```

**Scene-closure run-state pattern** (L21-31) — this is the anti-leak contract; the new
`coinsCollected` and `goalReached` counters go HERE, beside `lastCheckpoint`, **never** at
module level:
```javascript
// src/scenes/game.js L21-31 — ALL run state in the closure, seeded from go() data
export function gameScene(data) {
  setGravity(CONFIG.GRAVITY);
  const startX = data?.startX ?? 64;
  const startY = data?.startY ?? 64;
  let lastCheckpoint = vec2(startX, startY);
  // ADD HERE (closure-local, NOT module-level):
  //   let coinsCollected = 0;
  //   let goalReached = false;
```

**Checkpoint + collide-promotion pattern to KEEP & reuse** (L53-65) — the spike hazard
routes into this exact respawn policy; place a checkpoint just before each spike:
```javascript
// src/scenes/game.js L53-65 — checkpoint marker + last-touched promotion
function addCheckpoint(x, y) {
  return add([rect(8, 48), pos(x, y), area(), opacity(0.001), "checkpoint"]);
}
addCheckpoint(96, 272);
player.onCollide("checkpoint", (c) => { lastCheckpoint = c.pos.clone(); });
```

**Respawn seam to KEEP & reuse verbatim** (L72-81) — spikes AND fall-off both call this.
Do NOT build any new death/respawn/lives system:
```javascript
// src/scenes/game.js L72-81 — reposition-in-place, zero momentum, flash. NO go(), NO game-over.
function reset() {
  player.pos = lastCheckpoint.clone();
  player.vel = vec2(0);
  player.opacity = 0.2;
  tween(0.2, 1, 0.18, (v) => (player.opacity = v), easings.easeOutQuad);
}
const respawn = reset;
```

**Per-frame update to KEEP** (L84-92) — camera follow + fall-off-world respawn; unchanged
except `followCamera` now clamps to the new CONFIG.LEVEL_* bounds:
```javascript
// src/scenes/game.js L84-92 — keep as-is; the fall-off branch is hazard seam #2
onUpdate(() => {
  followCamera(player);
  if (player.pos.y > CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN) respawn();
});
```

**NEW collision wiring to ADD** (Patterns 3/4/5 from RESEARCH) — place after `makePlayer`
and after the level entities exist. Each is the same `player.onCollide(tag, …)` idiom the
checkpoint already uses (L63):
```javascript
// Coins (LEVEL-04): count in closure, remove the coin. NO XP (Phase 11).
player.onCollide("coin", (c) => { coinsCollected += 1; destroy(c); });

// Spikes (LEVEL-05): route into the EXISTING respawn() seam — never game-over.
player.onCollide("spike", () => respawn());

// Goal (LEVEL-07): single-point onReachGoal seam, fire-once guard.
function onReachGoal() {
  if (goalReached) return;
  goalReached = true;
  player.paused = true;                       // Phase 9 stub: stop the player
  add([text("GOAL!"), pos(center()), anchor("center"), fixed()]);  // placeholder; Phase 10 swaps body
}
player.onCollide("goal", onReachGoal);
```
**Single-point discipline:** exactly ONE `onReachGoal` function and ONE `onCollide("goal", …)`
— Phase 10 replaces the stub body here, nowhere else.

---

### `src/player.js` (MODIFY — entity factory, request-response)

**Analog:** itself (Phase 8). **One-line visual swap only — movement logic UNCHANGED.**

**The exact swap** (`src/player.js` L24-32) — replace the `rect`+`color` lines with `sprite`,
keep `area`, `body({maxVelocity})` (the anti-tunnel cap — do NOT drop it), and `opacity` (the
respawn flash depends on it):
```javascript
// src/player.js L24-32 — current placeholder
const player = add([
  rect(24, 32),                                  // ← REPLACE with sprite("player")
  pos(startX, startY),
  area(),                                        // ← KEEP (tune {shape,offset} if sprite has padding)
  body({ maxVelocity: CONFIG.MAX_FALL_SPEED }),  // ← KEEP UNCHANGED (anti-tunnel, Pitfall 3)
  color(0, 255, 136),                            // ← REMOVE (placeholder color)
  opacity(1),                                    // ← KEEP (respawn flash tweens this)
  "player",
]);
```
Everything below L33 (coyote/buffer/variable-height jump, the `onUpdate`, the
`onKeyPress`/`onKeyRelease` handlers) is **untouched**. Do not re-derive jump feel.

---

### `src/config.js` (MODIFY — config, static data)

**Analog:** itself (Phase 8). ADD new constants in the existing commented-section style;
UPDATE the level bounds. No magic numbers anywhere else (CONTEXT-locked).

**Bounds to UPDATE** (`src/config.js` L26-31) — widen to the authored ~3–4 screen extent
(~1920–2560px). `followCamera` already clamps to these; no camera-code change:
```javascript
// src/config.js L27-30 — replace the 1600 test-strip width with the real level extent
LEVEL_LEFT: 0,
LEVEL_RIGHT: 1600,   // ← UPDATE to authored level pixel width (~1920–2560)
LEVEL_TOP: 0,
LEVEL_BOTTOM: 360,   // ← UPDATE if the level is taller than one 360px screen
```

**Constants to ADD** — follow the existing `KEY: value, // unit — explanation` comment
convention (every line in this file documents its unit). New section, e.g.:
```javascript
// --- Level / content (Phase 9) ---
TILE_SIZE: 16,        // px — CC0 pack native tile size (sprite slice + grid math)
COIN_SPIN_SPEED: 12,  // fps — coin spin anim frame rate
// + any coin/spike/goal placement constants the level data references
```

---

### `src/main.js` (MODIFY — boot/entry, batch)

**Analog:** itself (Phase 8). ADD `loadSprite`/`loadSpriteAtlas` calls AFTER the `kaplay({...})`
init and BEFORE `go("game", …)` — Kaplay queues the loads and shows its loading screen until
they resolve, so the scene never draws against missing sprites.

**Current boot shape to extend** (`src/main.js` L11-28):
```javascript
// src/main.js L11-28 — init, then register scene, then go()
import kaplay from "../lib/kaplay.mjs";
import { gameScene } from "./scenes/game.js";
const k = kaplay({ width: 640, height: 360, background: "#0a0a0a",
                   canvas: document.querySelector("#game") });
scene("game", gameScene);
go("game", { startX: 64, startY: 64 });
```

**Insert asset loads between init and `scene(...)`** (RESEARCH Pattern 1) — **CRITICAL path
rule:** use `../assets/...`, mirroring the existing `import … from "../lib/kaplay.mjs"`
web-root convention (Pitfall 1 — a wrong path is a silent 404):
```javascript
loadSprite("ground", "../assets/tiles/ground.png");
loadSprite("spike",  "../assets/spike.png");
loadSprite("goal",   "../assets/goal.png");
loadSprite("player", "../assets/player.png");
loadSprite("coin",   "../assets/coin.png", {
  sliceX: 8, anims: { spin: { from: 0, to: 7, loop: true, speed: 12 } },
});
```
**API note:** `loadSpriteSheet` (old Kaboom) does NOT exist in 3001.0.19 — use `loadSprite`
with `sliceX/sliceY/anims`. Do not copy old-Kaboom snippets.

---

### `src/camera.js` (UNCHANGED — utility)

No edit. It reads `CONFIG.LEVEL_LEFT/RIGHT/TOP/BOTTOM` (camera.js L28-29) and clamps to them,
so updating those CONFIG values is the entire camera change. Listed for completeness so the
planner does NOT schedule camera work.

---

## Shared Patterns

### Module banner + responsibility comment
**Source:** every `src/*.js` file (e.g. `config.js` L1-12, `camera.js` L1-14, `player.js` L1-17)
**Apply to:** `src/level.js` (new file)
Every module opens with a `// src/<file> — <one-line role>.` banner and a short paragraph
naming its single responsibility, the engine-globals it relies on, and the CONTEXT/RESEARCH
invariant it upholds. Match this voice exactly for `level.js`.

### Scene-closure run state (anti-leak)
**Source:** `src/scenes/game.js` L21-31; reinforced in `src/player.js` L34-37
**Apply to:** all new run-state in the scene (`coinsCollected`, `goalReached`, any level cursor)
```javascript
// NEVER a module-level `let` for run state — it leaks across go()/respawn.
// Declare inside gameScene(data) { ... } / inside makePlayer() { ... } closure only.
```

### CONFIG-only constants (no magic numbers)
**Source:** `src/config.js` (all logic modules import from it; none hard-code numbers)
**Apply to:** `level.js`, `scenes/game.js`, `player.js` (sprite slice counts, tile size,
coin anim speed, level bounds) — every tunable goes through `CONFIG`.

### Tagged-entity + onCollide collision idiom
**Source:** `src/scenes/game.js` L54 (`"checkpoint"` tag) + L63 (`player.onCollide("checkpoint", …)`)
**Apply to:** coins (`"coin"`), spikes (`"spike"`), goal (`"goal"`)
The repo's one established collision pattern is: `add([... area(), "<tag>"])` to create, then
`player.onCollide("<tag>", handler)` in the scene. All three new interactables reuse it verbatim.

### Reposition-in-place respawn (never game-over)
**Source:** `src/scenes/game.js` L72-81 (`reset()` / `respawn`)
**Apply to:** spike hazard + fall-off-world (both call `respawn()`)
Hard project constraint: no lives, no game-over, no new failure UI. Both hazards funnel into
this single existing function.

### `../`-relative web-root path convention
**Source:** `src/main.js` L11 (`import … from "../lib/kaplay.mjs"`); Dockerfile L14-16 flattens
`src/` to web root with `lib/` + `assets/` as siblings
**Apply to:** every `loadSprite("…", "../assets/…")` call and every cross-dir module import
`assets/` is a sibling of the served root, so from a page served at `src/`-root (dev) or
container root (prod), assets are `../assets/...`. `../assets` is verified correct; `assets/`
or `/assets/` is a silent-404 bug.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `CREDITS.md` (repo root) | doc | — | No asset-credit markdown exists yet. Author per RESEARCH "Verification protocol for LEVEL-08": one row per asset (name, author, source URL, CC0 license, usage). |
| `assets/LICENSES/*.txt` | doc | — | New `assets/LICENSES/` area; one proof file per asset (source URL + quoted CC0 statement). `assets/` currently holds only `.gitkeep`. |

These are pure documentation deliverables (LEVEL-08). No code pattern applies; follow the
RESEARCH 5-step verification protocol. Note: `assets/` is already copied into the container
(`docker/Dockerfile` L16), so vendored PNGs + LICENSES ship automatically — no Dockerfile change.

## Metadata

**Analog search scope:** `src/` (all modules), `docker/` (Dockerfile asset copy), `assets/`, `lib/`
**Files scanned:** 8 (game.js, player.js, camera.js, config.js, main.js, index.html, Dockerfile, assets/)
**Pattern extraction date:** 2026-06-24
**Key constraint carried forward:** Do NOT regress the Phase 8 merged-floor collider
(`game.js` L35) or the reposition-in-place respawn (`game.js` L72-81); do NOT drop the
player `body({maxVelocity})` anti-tunnel cap (`player.js` L28); do NOT introduce module-level
run state; do NOT use non-`../assets` paths.
```
