# Phase 8: Platformer Core (Movement / Physics / Camera) - Research

**Researched:** 2026-06-24
**Domain:** 2D platformer game-feel on Kaplay 3001.0.19 (vendored, pinned) — input, physics, collision, camera, checkpoint-respawn
**Confidence:** HIGH (Kaplay API verified directly against the vendored source; game-feel ranges are ASSUMED/tunable)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Movement Feel (starting tune values — final feel tuned with the kid in Phase 12):**
- Run speed ~240 px/s — snappy Mario-feel, responsive
- Gravity ~1400 px/s²; jump impulse tuned to ~3-tile jump height
- Coyote time window ~100 ms — forgiving edge jumps
- Jump buffer window ~120 ms — pre-land jump presses register
- All values MUST be CONFIG constants (no magic numbers) — Phase 12 tunes them with the user.

**Avatar & Test Strip Structure:**
- Avatar in Phase 8 is a placeholder colored rect — real sprite arrives in Phase 9.
- Test strip layout: long flat run + a tall fast-drop ledge + a few gaps/platforms — deliberately stress-tests seam-stick and tunneling.
- Player/run state is initialized INSIDE the scene callback, passed via `go(name, data)`, and a `reset()` is exposed — avoids module-level state leaks across `go()`/respawns.
- Code layout: split into new `src/` modules (e.g. `player.js`, `camera.js`, `scenes/`) imported by `main.js`, replacing the Phase 7 smoke scene.

**Camera Behavior:**
- Smooth lerp follow (no jitter), dt-corrected.
- Clamp camera to level bounds — never show outside the level.
- Follow X primarily with a gentle Y follow.
- No lookahead for now — keep it simple; revisit in Phase 12 polish.

**Respawn & Checkpoints:**
- Fall detection: respawn when the player's Y passes the level bottom + a margin.
- Checkpoint model: lightweight checkpoint markers; last-touched marker is the respawn point — establishes the policy Phase 9 hazards reuse.
- Respawn transition: quick fade/flash, no game-over UI, instant control return.
- Progress is preserved on respawn — no penalty (ADHD-safe locked decision: no lives, no game-over).

### Claude's Discretion
- Exact internal module boundaries (file names within `src/`).
- Whether movement is driven by Kaplay `body().vel` or a manual `dt()`-scaled position update — research below recommends the `body()`/`vel` path for run, manual wiring only for coyote/buffer/variable-height.
- Camera lerp factor and the exact frame-rate-independent smoothing formula (recommendation below).
- Test-strip exact geometry (must include the stress cases).

### Deferred Ideas (OUT OF SCOPE)
- Final game-feel tuning (exact gravity/jump-impulse/coyote/buffer values) → Phase 12 with the kid.
- Real level art, coins, hazards as content → Phase 9 (only the respawn policy is built here).
- Camera lookahead and juice → Phase 12 polish.
- Double jump (MOVE2-01) → deferred beyond this milestone.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOVE-01 | Run left/right with arrows + WASD | `onKeyDown` + `isKeyDown` confirmed in source; set `body().vel.x` per frame (Pattern 1). |
| MOVE-02 | Jump with gravity, land solidly on platforms | `body()` + `area()` provide gravity + collision resolution; `isGrounded()`, `onGround`, `setGravity()` all confirmed (Pattern 2, Pattern 5). |
| MOVE-03 | Responsive jump — variable height, coyote time, jump buffering | NOT built into `body()`; must be wired manually on `isGrounded()`/`onKeyPress`/`onKeyRelease` + `dt()` timers (Pattern 3). |
| MOVE-04 | Camera follows player, clamped to level bounds | `setCamPos()`/`getCamPos()` confirmed; manual lerp + clamp in `onUpdate` (Pattern 4). |
| MOVE-05 | Frame-rate independent movement | All velocity/timer math multiplied by `dt()`; `body()` already integrates gravity with `dt()`; verify on non-60 Hz (Pattern 6). |
| LEVEL-06 | Respawn at last checkpoint, progress preserved, no lives/game-over | `onFallOff`/manual Y-threshold + last-touched checkpoint marker; re-position player, no scene cut needed (Pattern 7). |
</phase_requirements>

## Summary

Phase 8 builds the platformer spine on **Kaplay 3001.0.19**, already vendored at `lib/kaplay.mjs` and proven to boot from `src/main.js` (Phase 7). The engine's `body()` + `area()` components give us gravity, velocity integration, and AABB collision resolution out of the box — **but the Mario-feel layer (variable jump height, coyote time, jump buffering) is explicitly NOT in `body()`** and must be hand-wired on top of the primitives the engine does expose: `isGrounded()`, `jump(force)`, `vel`, `onKeyPress`/`onKeyRelease`, and `dt()`. I verified every one of these against the vendored source directly, so the API claims here are HIGH-confidence and version-exact (no guessing from a different Kaplay/Kaboom release).

The two MEDIUM-confidence risk areas flagged by project research — **seam-stick on tile boundaries** and **tunneling on fast drops** — are both addressable with engine-native levers I confirmed exist: merge floor colliders into few large static bodies (fewer seams), and cap fall speed with `body({ maxVelocity })` (the source applies a terminal-velocity clamp every physics step). The CONTEXT decision to build a deliberate stress strip (long flat run + tall fast-drop ledge + gaps) early is the right call — it surfaces both pitfalls before Phase 9 builds real content on this foundation.

Frame-rate independence (MOVE-05) is mostly handled by the engine: `body()` integrates gravity as `vel += gravity * gravityScale * dt()` and `move(vel)` is itself dt-scaled. The risk is in **our** hand-wired code — coyote/buffer timers and the camera lerp must use `dt()`, and the camera smoothing must use a frame-rate-independent formula (not a raw `lerp(a, b, 0.1)` that speeds up at high refresh rates). State-leak discipline (pitfall #3) is a planning constraint, not an engine feature: init all run state *inside* the `scene()` callback and pass seed data via `go(name, data)`.

**Primary recommendation:** Drive horizontal run via `body().vel.x` (engine-integrated, dt-correct for free); hand-wire coyote/buffer/variable-height as `dt()`-decremented timers gated on `isGrounded()`; clamp fall speed with `maxVelocity`; merge floor colliders; follow the camera with a half-life-based (frame-rate-independent) lerp clamped to level bounds; respawn by repositioning the player to the last-touched checkpoint with a quick flash and zeroed velocity — no scene reload needed.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Keyboard input (run/jump) | Game loop (Kaplay input) | — | `onKeyDown`/`onKeyPress`/`onKeyRelease` are engine globals; read in the scene's update. |
| Gravity + velocity integration | Engine physics (`body`) | — | `body()` integrates `vel` with `dt()` in its fixedUpdate; do not re-implement. |
| Collision resolution (land/block) | Engine physics (`body`+`area`) | — | `area()` provides AABB; `body()` resolves overlap via `physicsResolve`. |
| Game-feel (coyote/buffer/var-height) | Our code (player module) | Engine primitives | Not in `body()`; wired on `isGrounded()`/`jump()`/`vel` + `dt()` timers. |
| Camera follow + clamp | Our code (camera module) | Engine (`setCamPos`) | Engine only sets cam position; smoothing + bounds clamp are ours. |
| Checkpoint state + respawn | Our code (scene state) | Engine (`onFallOff`, `pos`) | Last-touched marker + reposition; policy is project logic, not engine. |
| Run/level state lifecycle | Our code (scene callback) | Engine (`scene`/`go`) | State MUST live in scene closure; engine just routes scenes via `go`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay | 3001.0.19 (vendored) | Game loop, ECS components, physics (`body`/`area`), input, camera, scenes | Locked decision; already vendored + MIME-served (Phase 7). Code ONLY against this version's API. `[VERIFIED: lib/kaplay.mjs header + package version field]` |
| Vanilla ES2020 modules | native | Player/camera/scene module split, no build step | Project constraint; Phase 7 established relative ESM imports resolve identically in dev + container. `[VERIFIED: 07 SUMMARYs]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | No new dependencies. Everything is Kaplay built-ins + our modules. The single-purpose/no-build/vendored-only constraints forbid adding packages. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `body().vel` for run movement | Manual `pos.x += speed * dt()` | Manual works but you re-derive collision push-out yourself; `body()` already integrates + resolves. Use `body()`. |
| `body()` gravity | Hand-rolled gravity in `onUpdate` | Loses the engine's terminal-velocity clamp and physics-resolve events (`onGround`/`fall`/`headbutt`). Don't hand-roll. |
| Kaplay `scene()`/`go()` for respawn | Reposition player in-place | For checkpoint respawn, **reposition in-place** — no scene reload — to preserve coins/progress (Phase 9) and avoid module-state leaks. Reserve `go()` for actual level changes. |

**Installation:** None. Kaplay is vendored at `lib/kaplay.mjs` (3001.0.19, sha256 `fb4a4ef2…`). No `npm install`, no CDN.

**Version verification:** The vendored file's embedded package metadata reports `version:"3001.0.19"` and `license:"MIT"`, matching the header pin. `[VERIFIED: grep of lib/kaplay.mjs package object]` No registry lookup performed (offline/vendored by design; external search disabled in config).

## Package Legitimacy Audit

> This phase installs **no** external packages. Kaplay is pre-vendored and pinned (Phase 7); no new dependencies are added.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| kaplay | npm (vendored, not installed) | established | — | github.com/kaplayjs/kaplay | OK | Already vendored Phase 7; pinned 3001.0.19, sha256-verified |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
  Keyboard (arrows/WASD/Space/Up)
            │  onKeyDown / onKeyPress / onKeyRelease  (Kaplay input globals)
            ▼
  ┌───────────────────────────────────────────────────────────────┐
  │  scene("game", (data) => { ... })   ← ALL run state lives here  │
  │                                                                 │
  │   ┌──────────────┐   reads input    ┌───────────────────────┐   │
  │   │ player module│ ───────────────▶ │ game-feel layer (OURS) │   │
  │   │  add([        │                 │  coyote timer (dt)     │   │
  │   │   rect/sprite,│                 │  jump-buffer timer(dt) │   │
  │   │   area(),     │ ◀────────────── │  variable-height cut   │   │
  │   │   body({...}),│  sets vel /     │  (onKeyRelease ⇒ vel↓) │   │
  │   │   pos(),      │  calls jump()   └───────────────────────┘   │
  │   │   "player"    │                                              │
  │   │  ])           │                                              │
  │   └──────┬───────┘                                              │
  │          │ body+area: gravity integrate (vel += g·dt),         │
  │          │ maxVelocity clamp, AABB collide → physicsResolve    │
  │          ▼                                                       │
  │   ┌──────────────┐   onGround/onFall/onFallOff                  │
  │   │ static floor │   (engine physics events)                   │
  │   │ colliders    │                                              │
  │   │ (merged)     │                                              │
  │   └──────────────┘                                              │
  │          │                                                       │
  │          ▼  player.pos                                           │
  │   ┌──────────────┐   lerp + clamp to level bounds (OURS)        │
  │   │ camera module│ ── setCamPos(...) every onUpdate ───────────▶│ render
  │   └──────────────┘                                              │
  │          ▲                                                       │
  │   player Y > levelBottom+margin  OR onFallOff                    │
  │          │                                                       │
  │   ┌──────────────┐  reposition to lastCheckpoint, vel=0, flash  │
  │   │ respawn logic│  (NO scene reload — progress preserved)      │
  │   └──────────────┘                                              │
  └───────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── index.html        # unchanged (file:// guard + canvas#game stay)
├── main.js           # kaplay init + scene registration + go("game", {...})
├── config.js         # CONFIG constants: RUN_SPEED, GRAVITY, JUMP_FORCE,
│                     #   COYOTE_MS, BUFFER_MS, MAX_FALL_SPEED, CAM_* (no magic numbers)
├── player.js         # makePlayer(opts) → entity + game-feel update fn
├── camera.js         # makeCameraFollow(target, bounds) update fn
└── scenes/
    └── game.js       # scene callback: builds test strip, player, checkpoints,
                      #   respawn logic; all run state in this closure
```
*(Exact file boundaries are Claude's discretion; this is a recommended shape that satisfies the "split into modules, replace smoke scene" decision.)*

### Pattern 1: Horizontal run via `body().vel` (MOVE-01, dt-correct for free)
**What:** Read input each frame, set `player.vel.x` to a CONFIG run speed. The engine integrates and resolves collisions; because `body()` multiplies by `dt()` internally, run speed is frame-rate independent without you touching `dt()`.
**When to use:** Always, for left/right movement.
**Example:**
```javascript
// Source: API shapes verified in lib/kaplay.mjs (body component exposes `vel`)
// onKeyDown / isKeyDown confirmed as Kaplay globals.
const player = add([
  rect(24, 32),
  pos(64, 64),
  area(),
  body(),          // gravity + collision; defaults verified below
  color(0, 255, 136),
  "player",
]);

onUpdate(() => {
  let dir = 0;
  if (isKeyDown("left")  || isKeyDown("a")) dir -= 1;
  if (isKeyDown("right") || isKeyDown("d")) dir += 1;
  player.vel.x = dir * CONFIG.RUN_SPEED;   // engine applies *dt() in move()
});
```
**Verified `body()` defaults (from source):** `vel: vec2(0)`, `jumpForce: <default ds>`, `gravityScale: 1`, `mass: 1`, `isStatic: false`, plus optional `drag`, `maxVelocity`, `stickToPlatform`. `[VERIFIED: lib/kaplay.mjs body component literal]`

### Pattern 2: Gravity + solid landing (MOVE-02)
**What:** Enable world gravity once, give the player `body()`, give floors a static `body()` + `area()`. The engine resolves overlap and fires `onGround`/`onLand`.
**Example:**
```javascript
// setGravity is a Kaplay global; body integrates: vel += gravity*gravityScale*dt()
setGravity(CONFIG.GRAVITY);             // e.g. 1400  [VERIFIED: gravity used in body fixedUpdate]

// A floor segment: static body so it doesn't fall and resolves the player.
add([ rect(800, 32), pos(0, 320), area(), body({ isStatic: true }), "ground" ]);

player.onGround(() => { /* landed — Phase 12 will add squash/dust */ });
```
**Confirmed physics events on `body()`:** `onGround`, `onFall`, `onFallOff`, `onHeadbutt`, plus targets receive `land`/`headbutted`. Query methods: `isGrounded()` (`return e!==null` — true while resting on a surface), `isJumping()`, `isFalling()`. `[VERIFIED: lib/kaplay.mjs]`

### Pattern 3: Mario-feel jump — variable height + coyote + buffer (MOVE-03) — HAND-WIRED
**What:** `body().jump(force)` only applies an upward impulse (`vel = up * force`). The *feel* is entirely ours, layered on `isGrounded()` and `dt()` timers.
**When to use:** This is the heart of the phase. Wire all three together.
**Example:**
```javascript
// All three timers tick down in dt-seconds → frame-rate independent.
let coyote = 0;        // seconds of grace after leaving ground
let buffer = 0;        // seconds a pending jump press stays valid
let jumpHeld = false;

onUpdate(() => {
  // refill coyote while grounded; otherwise bleed it down
  if (player.isGrounded()) coyote = CONFIG.COYOTE_MS / 1000;
  else                     coyote = Math.max(0, coyote - dt());

  buffer = Math.max(0, buffer - dt());

  // consume a buffered jump if we have ground OR coyote grace
  if (buffer > 0 && (player.isGrounded() || coyote > 0)) {
    player.jump(CONFIG.JUMP_FORCE);   // engine sets vel upward
    buffer = 0;
    coyote = 0;
    jumpHeld = true;
  }
});

onKeyPress(["space", "up", "w"], () => { buffer = CONFIG.BUFFER_MS / 1000; });

// VARIABLE HEIGHT: releasing early cuts upward velocity → shorter hop.
onKeyRelease(["space", "up", "w"], () => {
  jumpHeld = false;
  // if still moving up, damp the rising velocity (cut the jump short)
  if (player.vel.y < 0) player.vel.y *= CONFIG.JUMP_CUT;   // e.g. 0.45
});
```
- Coyote window: refill to `COYOTE_MS` on ground, decrement by `dt()` in air; allow a jump while `coyote > 0`. `[ASSUMED — standard platformer pattern; ~100ms per CONTEXT]`
- Jump buffer: a press sets `buffer = BUFFER_MS`; if it's still > 0 when we touch ground, the jump fires. `[ASSUMED — standard pattern; ~120ms per CONTEXT]`
- Variable height: on key release while rising, scale `vel.y` toward 0. `[ASSUMED — standard pattern]`
- **Sign convention:** `up` is negative Y in Kaplay (`Vec2.UP = (0,-1)` confirmed in source), so "rising" is `vel.y < 0`. `[VERIFIED: lib/kaplay.mjs Vec2.UP]`

### Pattern 4: Smooth clamped camera follow (MOVE-04) — frame-rate-independent lerp
**What:** Each `onUpdate`, move the camera toward the player with an exponential (half-life) smoothing that is correct at any refresh rate, then clamp to level bounds so we never reveal outside the level.
**Why not raw lerp:** `lerp(cur, target, 0.1)` applied per-frame converges faster at 144 Hz than 60 Hz → feel changes with refresh rate (violates MOVE-05). Use a `dt`-aware factor.
**Example:**
```javascript
// setCamPos / getCamPos confirmed Kaplay globals (camPos is the deprecated alias).
// Frame-rate-independent smoothing: factor = 1 - exp(-rate * dt())
onUpdate(() => {
  const cur = getCamPos();                    // current camera center
  const t = 1 - Math.exp(-CONFIG.CAM_RATE * dt());  // CAM_RATE ~ 8..12
  let nx = lerp(cur.x, player.pos.x, t);            // follow X primarily
  let ny = lerp(cur.y, player.pos.y, t * CONFIG.CAM_Y_FACTOR);  // gentle Y

  // clamp to level bounds (half the viewport so edges never show outside)
  const halfW = width() / 2, halfH = height() / 2;
  nx = clamp(nx, CONFIG.LEVEL_LEFT + halfW, CONFIG.LEVEL_RIGHT - halfW);
  ny = clamp(ny, CONFIG.LEVEL_TOP + halfH,  CONFIG.LEVEL_BOTTOM - halfH);

  setCamPos(nx, ny);
});
```
- `getCamPos()` returns a clone of `game.cam.pos` (or screen center when unset). `[VERIFIED: lib/kaplay.mjs getCamPos body]`
- `width()`/`height()` give the canvas dims (640×360 here). `clamp` and `lerp` are Kaplay math globals (`clamp` = `Te`, `lerp` = `de` in source). `[VERIFIED: lib/kaplay.mjs]`
- The `1 - exp(-rate*dt)` form is the standard frame-rate-independent smoothing. `[ASSUMED — well-established technique; engine does not provide it]`

### Pattern 5: Solid colliders / seam + tunneling mitigation (MOVE-02, pitfall #7)
**What:** Two engine-native levers, both confirmed present:
1. **Merge floor colliders** — represent a long flat run as ONE wide static body, not many tiles. Fewer internal seams = fewer chances for the resolver to catch the player on a vertical edge between adjacent boxes (seam-stick).
2. **Cap fall speed** — `body({ maxVelocity })`. The source clamps velocity to `maxVelocity` every physics step (`this.vel.slen() > p*p → vel = vel.unit().scale(p)`), preventing the player from moving far enough in one step to skip past a thin collider (tunneling on the fast-drop ledge).
**Example:**
```javascript
// One merged floor instead of 25 tile colliders:
add([ rect(1600, 32), pos(0, 320), area(), body({ isStatic: true }), "ground" ]);

// Player caps fall speed so the tall ledge can't tunnel:
const player = add([ rect(24,32), pos(64,64), area(), body({ maxVelocity: CONFIG.MAX_FALL_SPEED }), "player" ]);
```
- `maxVelocity` is a real `body()` option and is enforced per physics step. `[VERIFIED: lib/kaplay.mjs body fixedUpdate clamp]`
- **MEDIUM confidence on completeness:** Kaplay's collision is discrete AABB (no continuous/swept collision in this version — the resolver pushes out of overlap each step). Capping fall speed is the documented mitigation; the stress strip exists to confirm it holds at the chosen `GRAVITY`/`MAX_FALL_SPEED`. If tunneling persists, the fallback is thicker floor colliders and/or a lower `MAX_FALL_SPEED`. `[ASSUMED — discrete-collision behavior inferred from physicsResolve/displacement code; no swept-collision API found in source]`

### Pattern 6: Frame-rate independence (MOVE-05)
**What:** Anything that changes per frame must scale by `dt()`; anything the engine already integrates is already dt-correct.
- Run velocity via `body().vel`: engine multiplies by `dt()` in `move()` — **already correct**, do not double-scale.
- Gravity: engine does `vel += gravity * gravityScale * dt()` — **already correct**.
- Our coyote/buffer timers: decrement by `dt()` (seconds) — correct.
- Our camera lerp: use `1 - exp(-rate*dt())` — correct (raw constant lerp is NOT).
- **Verify:** test at a non-60 Hz / throttled refresh (CONTEXT requirement). DevTools "rendering → emulate refresh" or a 120/144 Hz display; jump height and run distance per key-press must match 60 Hz.
- `dt()`, `fixedDt()`, `restDt()` are all exposed globals; physics runs on a fixed accumulator at `1/50` s (50 Hz) feeding `fixedUpdate`. `[VERIFIED: lib/kaplay.mjs — dt:ee, fixedDt:an, restDt:un; fixed step 1/50]`

### Pattern 7: Checkpoint respawn, progress preserved (LEVEL-06)
**What:** Track the last-touched checkpoint marker; on fall-off-world, reposition the player there, zero velocity, brief flash. **No scene reload** — preserves everything else in the scene (and Phase 9 coins).
**Example:**
```javascript
// state lives in the SCENE CLOSURE (pitfall #3 — no module-level leaks)
scene("game", (data) => {
  let lastCheckpoint = vec2(data?.startX ?? 64, data?.startY ?? 64);

  // checkpoint markers: overlap with player updates the respawn point
  function addCheckpoint(x, y) {
    const cp = add([ rect(8, 48), pos(x, y), area(), opacity(0.001), "checkpoint" ]);
    player.onCollide("checkpoint", (c) => { lastCheckpoint = c.pos.clone(); });
    return cp;
  }

  // fall-off-world → respawn (no game-over, no lives)
  onUpdate(() => {
    if (player.pos.y > CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN) {
      respawn();
    }
  });

  function respawn() {
    player.pos = lastCheckpoint.clone();
    player.vel = vec2(0);                 // kill momentum
    // quick flash — Phase 12 polishes; here a brief opacity blink is enough
    flash(player);                        // small helper, ADHD-safe (no fail UI)
  }
});
```
- `onFallOff` exists on `body()` (fires when the supporting platform disappears) but the **CONTEXT-specified** trigger is a Y-threshold (`player.pos.y > levelBottom + margin`) — use the threshold as the authority; `onFallOff` is for moving-platform edge cases only. `[VERIFIED: onFallOff in source; threshold approach is the CONTEXT decision]`
- Reposition-in-place (not `go()`) is what preserves progress and avoids re-running the scene callback. `[ASSUMED — design choice consistent with "progress preserved" + pitfall #3]`

### Anti-Patterns to Avoid
- **Module-level mutable run state** (`let score = 0` at file top, mutated across respawns/`go()`): leaks across retries. Put it in the scene closure; pass seeds via `go("game", {...})`. `[CITED: STATE.md pitfall #3]`
- **Manual gravity in `onUpdate`** when `body()` already does it: loses `maxVelocity` clamp + physics events. `[VERIFIED: body integrates gravity itself]`
- **Raw constant camera lerp** (`lerp(a,b,0.1)` per frame): refresh-rate-dependent feel. Use `1-exp(-rate*dt())`. `[ASSUMED]`
- **Many tiny tile colliders for a flat run**: multiplies seam-stick risk. Merge into wide static bodies. `[ASSUMED — mitigation for pitfall #7]`
- **Reloading the scene with `go()` on respawn**: wipes progress + re-runs init. Reposition in place. `[ASSUMED]`
- **Reading `vel.y > 0` as "rising"**: wrong sign — up is negative Y in Kaplay. `[VERIFIED: Vec2.UP=(0,-1)]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gravity + velocity integration | Custom `pos.y += vy; vy += g*dt` loop | `body()` | Engine already integrates with `dt()`, clamps to `maxVelocity`, fires ground/fall events. |
| AABB collision resolution | Custom overlap push-out | `area()` + `body()` | Engine's `physicsResolve`/`displacement` handles mass-weighted push-out + static bodies. |
| Terminal velocity / anti-tunnel cap | Custom max-speed clamp | `body({ maxVelocity })` | Built in and applied every physics step. |
| Camera transform | Custom view matrix / pos offset on every entity | `setCamPos()` / `getCamPos()` | Engine maintains the camera transform; you only choose the target position. |
| Per-frame timing | `setInterval` / `Date.now()` deltas | `dt()` / `onUpdate` / `onFixedUpdate` | Engine's loop pauses on tab-blur and gives a stable `dt`; fixed step (1/50) for physics. |
| Vector math (lerp/clamp/dist) | Custom helpers | `lerp`, `clamp`, `vec2`, `Vec2` methods | All present as globals (`de`, `Te`, `v`/`E` in source). |

**Key insight:** The only thing genuinely worth hand-writing this phase is the **game-feel layer** (coyote/buffer/variable-height) and the **camera smoothing/clamp** — because Kaplay deliberately does not opinion-ate those. Everything below that (physics, collision, input, timing, camera transform) is engine-owned; reimplementing it adds bugs and breaks dt-correctness.

## Common Pitfalls

### Pitfall 1: Game-feel reimplemented inside the wrong loop
**What goes wrong:** Putting coyote/buffer logic in `onFixedUpdate` (physics, 50 Hz) instead of `onUpdate` (render) — input edges can be missed or double-counted.
**Why it happens:** Kaplay has both update channels; physics is fixed-step.
**How to avoid:** Read input and run the game-feel timers in `onUpdate`; let `body()` own `fixedUpdate`. Use `onKeyPress`/`onKeyRelease` for edges (fire once), `isKeyDown` for held state.
**Warning signs:** Jumps occasionally "eaten," variable height inconsistent.
`[VERIFIED: onUpdate vs onFixedUpdate both exist; body uses fixedUpdate]`

### Pitfall 2: Seam-stick on tile boundaries
**What goes wrong:** Player snags on the vertical edge between two adjacent floor colliders while running.
**Why it happens:** Discrete AABB resolver can pick a horizontal displacement at the shared seam.
**How to avoid:** Merge contiguous floor into one wide static body; keep the player collider slightly narrower than the run gap; build the long-flat-run stress case first.
**Warning signs:** Player stutters/stops mid-run on flat ground.
`[VERIFIED levers exist; MEDIUM confidence the merge fully resolves it — that's why the stress strip is mandated]`

### Pitfall 3: Tunneling on the fast-drop ledge
**What goes wrong:** At high fall speed the player passes through a thin floor in one step.
**Why it happens:** No swept/continuous collision in this Kaplay version — resolution is per-step overlap.
**How to avoid:** Set `body({ maxVelocity: MAX_FALL_SPEED })`; use thick-enough floor colliders; tune `GRAVITY` so terminal speed × step < collider thickness.
**Warning signs:** Player vanishes below the world after the tall ledge.
`[VERIFIED: maxVelocity clamp in source; ASSUMED no swept collision — confirm on stress strip]`

### Pitfall 4: Frame-rate-dependent feel
**What goes wrong:** Jump height / camera smoothing differ on a 120/144 Hz display.
**Why it happens:** A per-frame constant (raw lerp, or a manual `pos += v` without `dt()`).
**How to avoid:** `dt()`-scale all our timers; use `1-exp(-rate*dt())` for the camera; lean on `body().vel` (already dt-correct). Test on non-60 Hz.
**Warning signs:** Movement faster/floatier on a high-refresh monitor.
`[VERIFIED engine dt-integration; CONTEXT mandates non-60Hz verification]`

### Pitfall 5: Module-level state leak across respawn / go()
**What goes wrong:** Stale checkpoint/score/velocity carries into a fresh run.
**Why it happens:** State declared at module scope persists; `go()` re-runs the scene callback but not module init.
**How to avoid:** Declare all run state inside the `scene()` callback closure; pass seeds via `go("game", data)`; expose `reset()`. Respawn repositions in-place rather than reloading.
**Warning signs:** Checkpoint "remembered" wrongly after a reload; doubled event handlers.
`[CITED: STATE.md pitfall #3 + CONTEXT decision]`

### Pitfall 6: Camera reveals outside the level
**What goes wrong:** Edges show void/black beyond level bounds.
**Why it happens:** Following the player to the literal level edge centers the camera past the content.
**How to avoid:** Clamp camera center to `[LEFT+halfW, RIGHT-halfW]` / `[TOP+halfH, BOTTOM-halfH]`.
**Warning signs:** Empty background at level start/end.
`[ASSUMED — standard clamp; bounds are CONFIG]`

## Code Examples

### Kaplay init (reuse Phase 7 shell, replace scene)
```javascript
// Source: src/main.js (Phase 7) — keep init, replace the smoke scene
import kaplay from "../lib/kaplay.mjs";
const k = kaplay({ width: 640, height: 360, background: "#0a0a0a",
                   canvas: document.querySelector("#game") });
// register scene(s) from scenes/game.js, then:
go("game", { startX: 64, startY: 64 });
```

### Confirmed input globals (MOVE-01 / MOVE-03)
```javascript
// All verified present in lib/kaplay.mjs:
isKeyDown("left"); isKeyDown("a");          // held state
onKeyDown(["right","d"], () => {});          // every frame while held
onKeyPress(["space","up","w"], () => {});    // once on press  → buffer
onKeyRelease(["space","up","w"], () => {});  // once on release → variable height
```

## Runtime State Inventory

> Greenfield additive phase (new scene/modules replacing a smoke scene). No rename/migration. Included for completeness because it touches persisted nothing yet.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 8 adds no persistence (XP/localStorage is Phase 11). | none |
| Live service config | None — static client-only game. | none |
| OS-registered state | None. | none |
| Secrets/env vars | None. | none |
| Build artifacts | None — no build step; `src/` is served as-is. The Phase 7 smoke scene in `main.js` is **replaced**, not migrated. | replace smoke scene code |

**Nothing found in 4 of 5 categories** — verified: this phase only adds/edits files under `src/`; no datastore, service, OS registration, or secret references the changed code.

## Common State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Kaboom.js | KAPLAY (renamed) | 2024 | Same engine lineage; we pin 3001.0.19 — use KAPLAY-era API names (`setGravity`, `setCamPos`), not legacy aliases. `[VERIFIED: package name "kaplay", formerly kaboom]` |
| `camPos()` getter/setter | `setCamPos()`/`getCamPos()` | 3001 series | `camPos` still present as a deprecated alias; prefer the explicit setters to avoid deprecation warnings. `[VERIFIED: both present in source]` |

**Deprecated/outdated:** Do not copy Kaboom v0.x or KAPLAY 2000-series snippets from the web — `body()` option names and event names differ. Code against the 3001.0.19 surface documented here only.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Coyote ~100ms / buffer ~120ms / run ~240 / gravity ~1400 are good starting points | User Constraints / Pattern 3 | Low — explicitly tunable CONFIG, final tune is Phase 12 with the kid. |
| A2 | `1 - exp(-rate*dt())` camera smoothing is the right frame-rate-independent form | Pattern 4 | Low — standard technique; alternative is fixed-step camera, but this is simpler and correct. |
| A3 | Capping `maxVelocity` + merged colliders fully prevents tunneling/seam-stick | Pattern 5 / Pitfall 2,3 | MEDIUM — discrete collision; the mandated stress strip is the verification. Fallback: thicker colliders, lower MAX_FALL_SPEED. |
| A4 | This Kaplay version has no swept/continuous collision (discrete AABB only) | Pattern 5 / Pitfall 3 | MEDIUM — inferred from `physicsResolve`/`displacement` per-step push-out; no swept API found in grep. If wrong, tunneling risk is even lower (good). |
| A5 | Reposition-in-place (not `go()`) is the correct respawn mechanic | Pattern 7 | Low — consistent with "progress preserved" + pitfall #3; the only alternative (scene reload) is explicitly worse here. |
| A6 | Variable jump height via scaling `vel.y` on key-release | Pattern 3 | Low — standard; exact `JUMP_CUT` factor is a Phase-12 tune. |

**These six assumptions need confirmation during planning/UAT.** A3/A4 are the highest-value to retire early via the stress strip (which CONTEXT already mandates).

## Open Questions (RESOLVED)

1. **Exact `body()` default `jumpForce` / `maxVelocity` constants (`ds`/`fs` in source)**
   - What we know: both have engine defaults; we override both via CONFIG anyway.
   - What's unclear: the literal default numbers (minified symbol names).
   - Recommendation: Don't rely on defaults — set `jumpForce`/`maxVelocity` explicitly from CONFIG so feel is deterministic and tunable. Decode the literals only if a baseline is needed (grep `ds=`/`fs=` in source).
   - **RESOLVED:** Defaults are irrelevant to the plan — `JUMP_FORCE` and `MAX_FALL_SPEED` are set explicitly from `src/config.js` (08-01 Task 1), so engine defaults are never relied upon. No literal-decode needed.

2. **Does merging colliders fully kill seam-stick at 240 px/s run + 1400 gravity?**
   - What we know: merge + maxVelocity are the levers; collision is discrete.
   - What's unclear: whether any residual snag remains at the chosen tune.
   - Recommendation: First task on the stress strip is a long flat run + the tall fast-drop; verify in-browser before building anything on top. (Plan should include this as an explicit verification step.)
   - **RESOLVED:** Verified empirically on the stress strip — 08-01 Task 3 builds the merged-floor + tall fast-drop ledge and runs the seam-stick/tunneling manual check before any feel/camera layer is built on top. Documented fallback if a snag remains: thicker colliders / lower `MAX_FALL_SPEED`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Kaplay engine | All movement/physics/camera | ✓ | 3001.0.19 (vendored `lib/kaplay.mjs`) | — |
| Local dev server | In-browser testing (file:// blocks ESM) | ✓ (documented) | `python3 -m http.server 8000` | nginx container (Phase 7) |
| Modern browser w/ DevTools | dt / non-60Hz verification (MOVE-05) | ✓ (assumed dev machine) | — | — |
| High-refresh display OR refresh emulation | MOVE-05 non-60Hz check | ? | — | DevTools rendering panel can throttle/emulate |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Non-60Hz hardware — if unavailable, use DevTools refresh-rate emulation / CPU throttling to validate dt-correctness.

## Validation Architecture

> `nyquist_validation` is enabled in config. No automated test framework exists in this project (no package.json, no test runner — by no-build design). Validation here is **manual in-browser UAT + DevTools**, which is appropriate for game-feel that cannot be unit-tested meaningfully.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no-build, no node_modules) — manual browser UAT |
| Config file | none |
| Quick run command | `cd src && python3 -m http.server 8000` then open `http://localhost:8000/` |
| Full suite command | same + DevTools console clean + non-60Hz pass |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Command / Method | Exists? |
|--------|----------|-----------|------------------|---------|
| MOVE-01 | Runs left/right (arrows + WASD) | manual | Serve, press arrows/WASD, observe rect moves both directions | ❌ Wave 0 (scene) |
| MOVE-02 | Jumps, lands solidly on platforms | manual | Jump onto floor/platform; no sink/pass-through | ❌ Wave 0 |
| MOVE-03 | Variable height + coyote + buffer | manual | Tap vs hold jump (height differs); jump just after leaving ledge (coyote); press jump just before landing (buffer fires) | ❌ Wave 0 |
| MOVE-04 | Camera follows, clamped | manual | Run across level; camera trails smoothly; no void shown at edges | ❌ Wave 0 |
| MOVE-05 | Frame-rate independent | manual | Repeat MOVE-01..03 with DevTools refresh emulation / on 120-144Hz; height+distance match 60Hz | ❌ Wave 0 |
| LEVEL-06 | Checkpoint respawn, progress preserved | manual | Touch a checkpoint, fall off world → respawn at that checkpoint; no game-over UI; momentum zeroed | ❌ Wave 0 |

### Sampling Rate
- **Per task:** `node --check` each new module (syntax gate, as Phase 7 did) + serve & eyeball the changed behavior.
- **Per wave merge:** full manual run of the stress strip + clean console.
- **Phase gate:** all 6 requirement behaviors pass in-browser, incl. the non-60Hz check, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `src/scenes/game.js` — the test-strip scene exercising all 6 requirements (covers MOVE-01..05, LEVEL-06)
- [ ] `src/config.js` — CONFIG constants so behaviors are tunable/inspectable (no magic numbers)
- [ ] No framework install needed (manual UAT is the chosen, appropriate validation for game-feel)

## Security Domain

> `security_enforcement` enabled (ASVS L1). This is a **client-only static game with no input sinks, no auth, no network, no storage in this phase**. Attack surface is near-zero.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts/auth anywhere (project canon). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | Single-user local/static game. |
| V5 Input Validation | minimal | Only keyboard events drive game state; no untrusted strings parsed. `go(name, data)` payload is self-authored (constants), not user input. |
| V6 Cryptography | no | No secrets, no crypto. |
| V7 Error Handling/Logging | minimal | Keep DevTools console clean; no sensitive data to log. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed `go()` scene data | Tampering | Data is author-controlled constants; default-guard fields (`data?.startX ?? 64`). |
| Prototype pollution via untrusted JSON | Tampering | N/A this phase (no JSON parse / no untrusted input; persistence is Phase 11 where v1 already validates types on `fromJSON`). |
| XSS via dynamic DOM | — | N/A — Kaplay renders to canvas; no innerHTML from data (the only `innerHTML` is the static file:// guard message in index.html). |

**Net:** No new security obligations in Phase 8 beyond "don't introduce untrusted-input sinks." The persistence/serialization threat surface arrives in Phase 11.

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (vendored Kaplay 3001.0.19) — directly grepped/inspected for: `body()` component (vel/jumpForce/gravityScale/mass/maxVelocity/drag/stickToPlatform, `add`/`update`/`fixedUpdate` impl), `isGrounded`/`isJumping`/`isFalling`/`jump`/`addForce`, events `ground`/`fall`/`fallOff`/`headbutt`/`land`/`physicsResolve`/`beforePhysicsResolve`, gravity integration `vel += gravity*gravityScale*dt()` + `maxVelocity` clamp, input globals `onKeyDown`/`onKeyPress`/`onKeyRelease`/`isKeyDown`/`isKeyPressed`, camera `setCamPos`/`getCamPos`/`setCamScale`/`camPos`(deprecated alias), timing `dt`/`fixedDt`/`restDt` (fixed step 1/50), `setGravity`/`getGravity`, `Vec2.UP=(0,-1)`, `area()`/`onCollide`/`loadSprite`/`rect`.
- `.planning/phases/07-project-setup-deployment/07-01-SUMMARY.md`, `07-02-SUMMARY.md` — existing shell, ESM import convention, vendoring, MIME serving.
- `.planning/phases/08-.../08-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — locked decisions, requirements, pitfall register.
- `src/main.js`, `src/index.html` — current shell to extend.

### Secondary (MEDIUM confidence)
- (none — external web search disabled in config; vendored source is authoritative for this pinned version.)

### Tertiary (LOW confidence)
- Game-feel parameter ranges and the coyote/buffer/variable-height/camera-smoothing techniques are standard platformer knowledge from training data, not fetched this session — tagged `[ASSUMED]` and tunable via CONFIG (Phase 12). The exact minified default constants (`ds`/`fs`) were not decoded.

## Metadata

**Confidence breakdown:**
- Standard stack / engine API: HIGH — every API claim verified by direct grep of the exact vendored 3001.0.19 source.
- Architecture / patterns: HIGH for engine wiring; MEDIUM for collision-robustness completeness (discrete AABB — stress strip is the verification).
- Pitfalls: HIGH — levers (maxVelocity, merged colliders, scene-closure state, dt smoothing) all confirmed; seam/tunnel *sufficiency* is MEDIUM by design (hence the early stress strip).
- Game-feel values: LOW/ASSUMED by intent — starting points, tuned with the user in Phase 12.

**Research date:** 2026-06-24
**Valid until:** Stable — the engine is pinned and vendored, so the API surface cannot drift. ~30 days nominal; effectively valid for the life of the 3001.0.19 pin.
