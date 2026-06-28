# Phase 8: Platformer Core (Movement / Physics / Camera) - Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 6 (1 modified, 5 new)
**Analogs found:** 1 codebase analog (the Phase 7 shell) / 6 files

> **Reality check for the planner:** this is an early-stage, near-greenfield codebase.
> `src/` contains only two files (`main.js`, `index.html`) plus the vendored engine
> (`lib/kaplay.mjs`). There is **one** real in-repo analog — `src/main.js` (Phase 7
> game shell). It supplies the project-convention patterns (ESM import of the vendored
> engine, `kaplay()` init, `scene()`/`go()` registration, dark-grunge palette).
> Everything *inside* the new modules (movement, physics wiring, camera lerp, respawn)
> has **no in-repo analog** — those patterns come from RESEARCH.md (which verified each
> API directly against the vendored 3001.0.19 source). I re-verified the key API symbols
> against `lib/kaplay.mjs` myself (see "API Verification" below) so the planner can cite
> them with confidence.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/main.js` (modify) | entry / bootstrap | event-driven (game loop) | `src/main.js` (itself, Phase 7) | exact (edit in place) |
| `src/config.js` (new) | config | transform (constants only) | — (no analog) | no-analog |
| `src/player.js` (new) | factory / entity module | event-driven (per-frame input→velocity) | `src/main.js` `add([...])` block | role-partial (entity-build shape only) |
| `src/camera.js` (new) | utility / update-fn module | transform (pos→lerp→clamp→setCamPos) | — (no analog) | no-analog |
| `src/scenes/game.js` (new) | scene / state container | event-driven (scene callback owns run state) | `src/main.js` `scene("game", ...)` | role-partial (scene shell only) |
| `src/index.html` (no change) | config / host page | request-response (page load) | `src/index.html` (itself) | unchanged — do not edit |

> File names follow the RESEARCH.md "Recommended Project Structure" (Claude's discretion
> per CONTEXT). The planner may adjust internal boundaries but should keep:
> CONFIG constants isolated, player as a factory, camera as an update fn, all run state
> inside the scene closure.

## Pattern Assignments

### `src/main.js` (entry / bootstrap) — MODIFY IN PLACE

**Analog:** `src/main.js` itself (Phase 7 shell). The init block stays; the **smoke
`scene("game", ...)` body is replaced** by importing/registering the real scene.

**Import + init pattern to KEEP (`src/main.js` lines 12-21):**
```javascript
import kaplay from "../lib/kaplay.mjs";

// global: true (default) exposes scene/add/text/pos/anchor/color/go on globals.
const k = kaplay({
  width: 640,
  height: 360,
  background: "#0a0a0a",            // project dark-grunge background
  canvas: document.querySelector("#game"),
});
```
- **Keep verbatim:** the relative `../lib/kaplay.mjs` import (resolves identically under
  the dev server and inside the nginx container — the Phase 7 invariant).
- **Keep:** 640×360 canvas, `#0a0a0a` background, `#game` canvas selector. These are
  contractually tied to `index.html` (canvas id `#game`) — do not change.
- New modules import from the *same* relative-path convention (`./config.js`,
  `./player.js`, `./camera.js`, `./scenes/game.js`).

**Scene registration + boot pattern (`src/main.js` lines 24-33) — REPLACE the body:**
```javascript
// BEFORE (Phase 7 smoke — DELETE this body):
scene("game", () => {
  add([ text("hello", { size: 48 }), pos(320, 180), anchor("center"),
        color(0, 255, 136) ]);
});
go("game");
```
- **After:** register the real scene (import the callback from `scenes/game.js`, e.g.
  `scene("game", gameScene)`), then seed it with `go("game", { startX: 64, startY: 64 })`
  (RESEARCH Pattern 7 / Code Examples). Passing seed data via `go(name, data)` is the
  CONTEXT-locked anti-leak mechanism (pitfall #3).
- **Keep the accent color** `color(0, 255, 136)` (#00ff88) available for the placeholder
  player rect and checkpoint/flash visuals — it is the established project accent.

---

### `src/config.js` (config, constants) — NO ANALOG

**Analog:** none. First config module in the repo. Pattern comes from CONTEXT
("CONFIG constants, no magic numbers") + RESEARCH "Recommended Project Structure".

**Shape (plain ES2020 module export — matches the project's no-build ESM convention
established by `src/main.js` line 12):**
```javascript
// src/config.js — all tunable values in ONE place (Phase 12 tunes these with the kid).
export const CONFIG = {
  // Movement (CONTEXT starting tune values — ASSUMED/tunable)
  RUN_SPEED: 240,          // px/s
  GRAVITY: 1400,           // px/s^2
  JUMP_FORCE: /* tuned to ~3-tile height */ 0,
  JUMP_CUT: 0.45,          // variable-height: vel.y *= JUMP_CUT on early release
  COYOTE_MS: 100,          // ms grace after leaving ground
  BUFFER_MS: 120,          // ms a pending jump press stays valid
  MAX_FALL_SPEED: 0,       // body({ maxVelocity }) — anti-tunnel cap (tune on stress strip)

  // Camera
  CAM_RATE: 10,            // 1 - exp(-CAM_RATE*dt) smoothing (8..12)
  CAM_Y_FACTOR: 0.5,       // gentle Y follow vs primary X follow

  // Level bounds (test strip) + respawn
  LEVEL_LEFT: 0, LEVEL_RIGHT: 1600, LEVEL_TOP: 0, LEVEL_BOTTOM: 360,
  FALL_MARGIN: 120,        // respawn when player.pos.y > LEVEL_BOTTOM + FALL_MARGIN
};
```
- Every number referenced by player/camera/scene MUST come from `CONFIG` — no inline
  literals in logic modules (CONTEXT-locked, Phase 12 retune requirement).
- Values above are the CONTEXT starting points; planner leaves `JUMP_FORCE`/`MAX_FALL_SPEED`
  as explicit tunables (RESEARCH Open Question #1 — don't rely on `body()` defaults).

---

### `src/player.js` (factory / entity module) — ROLE-PARTIAL ANALOG

**Analog:** the `add([...])` entity-build block in `src/main.js` (lines 25-30) — supplies
only the *entity-construction shape* (`add([ component, component, ... ])`). The movement /
game-feel logic has **no analog** and comes from RESEARCH Patterns 1-3.

**Entity-build shape (from `src/main.js` lines 25-30, generalized):**
```javascript
// Phase 7 used: add([ text(...), pos(...), anchor(...), color(...) ])
// Phase 8 player follows the SAME add([...]) component-list shape:
import { CONFIG } from "./config.js";

export function makePlayer(startX, startY) {
  const player = add([
    rect(24, 32),
    pos(startX, startY),
    area(),
    body({ maxVelocity: CONFIG.MAX_FALL_SPEED }),  // gravity + collision + anti-tunnel cap
    color(0, 255, 136),                             // #00ff88 placeholder (real sprite = Phase 9)
    "player",
  ]);
  return player;
}
```
- Reuse the project accent `color(0, 255, 136)` for the placeholder rect (CONTEXT: avatar
  is a placeholder colored rect this phase).

**Core run pattern (RESEARCH Pattern 1 — no in-repo analog, verified API):**
```javascript
onUpdate(() => {
  let dir = 0;
  if (isKeyDown("left")  || isKeyDown("a")) dir -= 1;
  if (isKeyDown("right") || isKeyDown("d")) dir += 1;
  player.vel.x = dir * CONFIG.RUN_SPEED;   // body() applies *dt() in move() — already dt-correct
});
```

**Game-feel pattern (RESEARCH Pattern 3 — the heart of the phase, HAND-WIRED):**
```javascript
let coyote = 0, buffer = 0;
onUpdate(() => {
  if (player.isGrounded()) coyote = CONFIG.COYOTE_MS / 1000;
  else                     coyote = Math.max(0, coyote - dt());
  buffer = Math.max(0, buffer - dt());
  if (buffer > 0 && (player.isGrounded() || coyote > 0)) {
    player.jump(CONFIG.JUMP_FORCE); buffer = 0; coyote = 0;
  }
});
onKeyPress(["space", "up", "w"], () => { buffer = CONFIG.BUFFER_MS / 1000; });
onKeyRelease(["space", "up", "w"], () => {
  if (player.vel.y < 0) player.vel.y *= CONFIG.JUMP_CUT;   // up is NEGATIVE Y (Vec2.UP=(0,-1))
});
```
- **Sign convention (verified):** rising = `vel.y < 0`. Do not write `vel.y > 0` for "up".
- Run game-feel timers in `onUpdate` (render loop), NOT `onFixedUpdate` (RESEARCH Pitfall 1).

---

### `src/camera.js` (utility / update-fn module) — NO ANALOG

**Analog:** none. Pattern is RESEARCH Pattern 4 (frame-rate-independent lerp + clamp).

**Shape (ESM export consistent with project convention):**
```javascript
import { CONFIG } from "./config.js";

export function followCamera(target) {
  // call once per frame from the scene's onUpdate (or register its own onUpdate)
  const cur = getCamPos();
  const t  = 1 - Math.exp(-CONFIG.CAM_RATE * dt());     // frame-rate-independent
  let nx = lerp(cur.x, target.pos.x, t);                // follow X primarily
  let ny = lerp(cur.y, target.pos.y, t * CONFIG.CAM_Y_FACTOR);  // gentle Y
  const halfW = width() / 2, halfH = height() / 2;      // 320 / 180 (640x360 canvas)
  nx = clamp(nx, CONFIG.LEVEL_LEFT + halfW, CONFIG.LEVEL_RIGHT  - halfW);
  ny = clamp(ny, CONFIG.LEVEL_TOP  + halfH, CONFIG.LEVEL_BOTTOM - halfH);
  setCamPos(nx, ny);
}
```
- **Do NOT** use raw `lerp(a, b, 0.1)` — refresh-rate-dependent (RESEARCH Pitfall 4).
  Always the `1 - exp(-rate*dt())` form.
- Clamp prevents revealing void at level edges (RESEARCH Pitfall 6).

---

### `src/scenes/game.js` (scene / state container) — ROLE-PARTIAL ANALOG

**Analog:** the `scene("game", () => { ... })` shell in `src/main.js` (lines 24-31) —
supplies only the *callback shape*. The test-strip build + checkpoint/respawn state has
**no analog** (RESEARCH Pattern 2, 5, 7).

**Scene-callback shape (from `src/main.js` line 24, extended with seed data):**
```javascript
// Phase 7: scene("game", () => { add([...]) })
// Phase 8: scene callback OWNS all run state in its closure (anti-leak, pitfall #3/#5).
import { CONFIG } from "../config.js";        // note: ../ because scenes/ is one level deeper
import { makePlayer } from "../player.js";
import { followCamera } from "../camera.js";

export function gameScene(data) {
  setGravity(CONFIG.GRAVITY);

  // ALL run state lives HERE (closure), seeded via go("game", data):
  let lastCheckpoint = vec2(data?.startX ?? 64, data?.startY ?? 64);

  // Merged wide floor (anti seam-stick) + fast-drop ledge + gaps (stress strip):
  add([ rect(1600, 32), pos(0, 320), area(), body({ isStatic: true }), "ground" ]);
  // ...tall ledge + gap platforms here...

  const player = makePlayer(lastCheckpoint.x, lastCheckpoint.y);

  // checkpoint markers — last touched is the respawn point:
  function addCheckpoint(x, y) {
    add([ rect(8, 48), pos(x, y), area(), opacity(0.001), "checkpoint" ]);
  }
  player.onCollide("checkpoint", (c) => { lastCheckpoint = c.pos.clone(); });

  // fall-off-world -> respawn in place (NO go(), progress preserved):
  onUpdate(() => {
    followCamera(player);
    if (player.pos.y > CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN) {
      player.pos = lastCheckpoint.clone();
      player.vel = vec2(0);     // zero momentum
      // quick flash — ADHD-safe, no game-over UI
    }
  });
}
```
- **Relative imports use `../`** because `scenes/` is one directory below `src/` — mirror
  the `../lib/kaplay.mjs` depth convention from `main.js`.
- **Respawn repositions in place — never `go()`** (RESEARCH Pattern 7 / Pitfall 5):
  preserves progress, avoids re-running init / doubled handlers.
- **Merge floor into one wide static body** (not many tiles) — RESEARCH Pattern 5 / Pitfall 2.

---

## Shared Patterns

### ESM module import of the vendored engine + sibling modules
**Source:** `src/main.js` line 12 (`import kaplay from "../lib/kaplay.mjs";`)
**Apply to:** every new module.
```javascript
// from src/ (main.js, config.js, player.js, camera.js):  "../lib/kaplay.mjs", "./config.js"
// from src/scenes/ (game.js):                             "../../lib/kaplay.mjs" if needed, "../config.js"
```
- No build step, no bundler. Plain relative ESM that resolves identically under
  `python3 -m http.server` and the nginx container (Phase 7 invariant). `global: true`
  means engine functions (`add`, `scene`, `go`, `onUpdate`, `setGravity`, `setCamPos`,
  `vec2`, `lerp`, `clamp`, `dt`, etc.) are available as globals without importing them —
  only your own modules need explicit imports.

### Dark-grunge palette
**Source:** `src/main.js` (background `#0a0a0a` line 19; accent `color(0,255,136)` = #00ff88 line 29) + `src/index.html` (`#0a0a0a` body, `#00ff88` headings)
**Apply to:** player placeholder rect, checkpoint/flash visuals, any new text.
- Background `#0a0a0a`, accent `#00ff88` (`color(0, 255, 136)`). No pink, no bubbly.

### Frame-rate independence (dt discipline)
**Source:** RESEARCH Pattern 6 (no in-repo analog yet — this phase establishes it)
**Apply to:** every hand-wired timer + the camera lerp.
- Engine-integrated motion (`body().vel`, gravity) is **already dt-correct — do not
  double-scale**. Our coyote/buffer timers decrement by `dt()`. Camera uses
  `1 - exp(-rate*dt())`. Verify on non-60Hz (DevTools refresh emulation) before phase gate.

### Scene-closure state ownership (anti-leak)
**Source:** CONTEXT decision + RESEARCH Pitfall 3/5 (no in-repo analog — establishes the policy)
**Apply to:** `scenes/game.js` and any future scene.
- Declare ALL mutable run state inside the `scene()` callback closure. Seed via
  `go("game", data)` with `data?.field ?? default` guards. No module-level `let` for run state.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/config.js` | config | transform | First config module; pattern is plain ESM `export const CONFIG` per CONTEXT/RESEARCH. |
| `src/camera.js` | utility | transform | No camera code exists yet; pattern = RESEARCH Pattern 4. |
| `src/player.js` (logic) | factory | event-driven | Entity-build shape borrows from `main.js add([...])`, but movement/game-feel logic is new (RESEARCH Patterns 1-3). |
| `src/scenes/game.js` (logic) | scene | event-driven | Scene-callback shape borrows from `main.js scene("game",...)`, but test-strip/checkpoint/respawn logic is new (RESEARCH Patterns 2,5,7). |

**Planner guidance:** for the four no-/partial-analog files, copy the engine-wiring
patterns from RESEARCH.md's Pattern sections (they were verified against the exact
vendored source), and copy only the *project conventions* (import style, palette, scene
shape, ESM exports) from `src/main.js`.

## API Verification (re-confirmed against `lib/kaplay.mjs` this session)

All symbols cited in the patterns above are present in the vendored 3001.0.19 source
(grep-confirmed): `setCamPos`, `getCamPos`, `setCamScale`; `setGravity`, `getGravity`;
`onKeyDown`, `onKeyPress`, `onKeyRelease`, `isKeyDown`, `isKeyPressed`; `onUpdate`,
`onFixedUpdate`; `isGrounded`, `isJumping`, `isFalling`, `maxVelocity`, `gravityScale`,
`jumpForce`, `stickToPlatform`; `area`, `body`, `rect`, `opacity`, `anchor`, `onCollide`;
`lerp`, `clamp`, `vec2`, `width`, `height`, `dt`; `scene`, `go`.
Use KAPLAY 3001 names (`setGravity`, `setCamPos`) — NOT legacy Kaboom/`camPos()` aliases.

## Metadata

**Analog search scope:** `src/` (2 files), `lib/` (vendored engine — read-only reference).
The repo has no other source directories.
**Files scanned:** `src/main.js`, `src/index.html` (full read); `lib/kaplay.mjs` (API
symbol grep, not full read — 188 KB minified vendored engine).
**Pattern extraction date:** 2026-06-24
