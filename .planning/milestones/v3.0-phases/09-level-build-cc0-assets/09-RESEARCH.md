# Phase 9: Level Build & CC0 Assets - Research

**Researched:** 2026-06-24
**Domain:** Kaplay 3001.0.19 level/tilemap construction + sprite-asset loading + CC0 dark/grunge pixel-art sourcing & license verification + coin pickup + hazard→checkpoint-respawn integration + goal→math-gate seam
**Confidence:** HIGH (every Kaplay API verified directly against the vendored `lib/kaplay.mjs` source; CC0 pack sourcing MEDIUM — web-verified, but final pack pick + license proof is a human-confirmable build step)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CC0 Asset Pack & Art Pipeline**
- I (Claude) source ONE verified-CC0 dark/grunge pixel platformer pack (e.g. a Kenney or itch.io CC0 pack), vendor it locally under `assets/`, and document its license. No CDN — assets load from local files so the offline/no-build constraint holds. Pack is swappable in Phase 12 polish.
- Load via Kaplay 3001 `loadSprite` / `loadSpriteAtlas` (or sliced spritesheet) from the vendored files. Dark/grunge, no pink, readable silhouettes against the `#0a0a0a` background.

**Level Design & Layout**
- One **medium linear level (~3–4 screens)** with a gentle difficulty curve and generous checkpoints — ADHD-safe, low-pressure, no time limits.
- **Hand-authored level data** (an array/object map) read by the scene to place platforms, gaps, coins, spikes, checkpoints, and the goal — no Tiled import dependency.
- Reliable collision reusing the Phase 8 `body()`/`area()` + merged-collider approach (no seam-stick, no tunneling). Camera clamps to the new level bounds.

**Coins, Hazard & Goal**
- **~8–12 coins** placed throughout, simple pickup (collected count tracked in scene state only — XP scoring is Phase 11, not here).
- Hazard = **static spikes** + the existing fall-off-world trigger; both route through the Phase 8 checkpoint `reset()`/`respawn()` policy. Never a game-over, no lives. Enemies deferred.
- Goal = a goal flag that, on the player reaching it, fires a single **`onReachGoal`** event/callback. Phase 9 attaches a temporary stub (e.g. pause player + placeholder message); Phase 10 wires the real in-world math gate to this exact seam. Keep the seam clean and single-point.

**Asset Licensing & Documentation**
- `CREDITS.md` at repo root + an `assets/LICENSES/` area recording each asset's source URL and CC0 license proof. No vendor logos. This satisfies LEVEL-08.

### Claude's Discretion
- Which specific CC0 pack to source (subject to: verified CC0, dark/grunge, no pink, readable silhouettes, no vendor logos).
- Exact level geometry / data-format shape (array-of-strings tilemap vs. object list) — must be hand-authored, no Tiled.
- Whether to use `addLevel` (symbol-map tilemap) or direct `add([...])` entity placement for the level body.
- Coin/spike/goal sprite choice and exact placement.
- The internal shape of the `onReachGoal` seam (event vs. callback) — must be single-point.

### Deferred Ideas (OUT OF SCOPE)
- Enemies / patrolling hazards → beyond this phase (static spikes only here).
- The real math gate behavior → Phase 10 (Phase 9 only fires `onReachGoal`).
- Coin → XP scoring and persistence → Phase 11.
- Tiled-editor level pipeline → not needed; hand-authored data is sufficient.
- Final art swap / juice / feel tuning with the kid → Phase 12.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEVEL-01 | One complete, polished level traversable start→goal | `addLevel(map, opts)` symbol-map tilemap OR direct `add([...])` placement; reuse Phase 8 merged-collider floor + camera-clamp (Pattern 1, Pattern 2). |
| LEVEL-02 | Pixel-art from a free CC0 pack, dark/grunge, no pink | `loadSprite`/`loadSpriteAtlas` from vendored `assets/`; verified CC0 dark packs in "CC0 Asset Sourcing" (0x72 DungeonTileset II is the lead candidate). |
| LEVEL-03 | Platforms, gaps, solid ground, reliable collision | Reuse Phase 8 anti-seam-stick (merge colliders) + anti-tunnel (`body({ maxVelocity })`) levers — already stress-verified in Phase 8 (Pattern 2). |
| LEVEL-04 | Collect coins placed throughout | Coin = `area()` + `"coin"` tag; `player.onCollide("coin", c => { count++; destroy(c); })` (Pattern 3). Count in scene closure only. |
| LEVEL-05 | At least one hazard triggers respawn (never game-over) | Static spikes = `area()` + `"spike"` tag; `player.onCollide("spike", () => respawn())` reusing the Phase 8 `reset()`/`respawn()` seam (Pattern 4). |
| LEVEL-07 | Reaching the goal triggers the math gate | Goal = `area()` + `"goal"` tag; `player.onCollide("goal", onReachGoal)` single-point seam; Phase 9 stub, Phase 10 real gate (Pattern 5). |
| LEVEL-08 | CC0 sources and licenses documented | `CREDITS.md` + `assets/LICENSES/` with per-asset source URL + CC0 proof; no vendor logos (see "Asset Licensing & Documentation"). |
</phase_requirements>

## Summary

Phase 9 replaces the Phase 8 stress-test strip in `src/scenes/game.js` with **one hand-authored, polished, sprite-rendered level** — without touching the movement, camera, or respawn machinery Phase 8 already built and verified. Every API this phase needs (`addLevel`, `loadSprite`, `loadSpriteAtlas`, the `sprite()` component, `area()`/`onCollide`/`destroy`) is present in the vendored `lib/kaplay.mjs` (3001.0.19), grep-confirmed this session. The big "new" surface versus Phase 8 is **asset loading** (sprites instead of colored rects) and **content authoring** (a real level layout instead of a stress strip) — both well-trodden, low-risk Kaplay patterns.

The single most important *project-specific* constraint is the **web-root path convention** established in Phase 7: `index.html` is served at root, with `lib/` and `assets/` as siblings (`/lib/`, `/assets/`). In dev you `cd src && python3 -m http.server`, so from the page, assets are at `../assets/...`. This parity (dev == container) is exactly why `main.js` imports `../lib/kaplay.mjs`. **Asset-load paths MUST follow the same `../assets/...` convention** or sprites will silently 404 in dev and/or production — this is the Phase-7-flagged `file://`/path pitfall in a new guise.

The three integration seams (coins, spikes, goal) are all the same Kaplay idiom — `area()` + a tag + `player.onCollide(tag, handler)` — and all three plug into machinery Phase 8 already exposes: coins mutate a scene-closure counter, spikes call the existing `respawn()`, and the goal fires a single `onReachGoal` that Phase 10's math gate will attach to. The CONTEXT discipline (all run state in the scene closure, no module-level `let`, reposition-in-place respawn) carries forward unchanged. The only genuinely external dependency is the **CC0 art pack**: web research confirms strong dark/grunge CC0 candidates (lead: **0x72 "16x16 DungeonTileset II"** — CC0, dark dungeon, includes spike traps + animated characters), but the final pick, the download, and the license-proof capture are a human-verifiable build step (the `[ASSUMED]` items in the Assumptions Log).

**Primary recommendation:** Load the chosen CC0 pack via `loadSprite`/`loadSpriteAtlas` using `../assets/...` paths (Phase 7 web-root parity). Hand-author the level as a data structure the scene reads to `add([sprite(...), area(), body({isStatic:true}), "ground"])` solid tiles + place coins/spikes/goal as tagged `area()` entities. Reuse the Phase 8 merged-collider anti-seam-stick approach for the floor, the `body({maxVelocity})` anti-tunnel cap, and the existing `reset()`/`respawn()` for spikes. Track coin count in the scene closure (no XP). Wire coins, spikes, and goal each as `player.onCollide(tag, …)`. Fire a single `onReachGoal()` from the goal collision; attach a temporary pause+message stub now, leaving that one call site as the clean Phase-10 seam. Document every asset in `CREDITS.md` + `assets/LICENSES/` and ship no vendor logos.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Sprite/atlas asset loading | Engine (`loadSprite`/`loadSpriteAtlas`) | Our code (path + slicing config) | Engine fetches + decodes + slices; we only supply `../assets/...` path + `sliceX/sliceY/anims`. |
| Level geometry construction | Our code (scene + level data) | Engine (`addLevel` or `add`) | Layout is authored content; engine just instantiates entities from our symbol map / list. |
| Solid-tile collision | Engine physics (`body`+`area`) | Our code (merged colliders) | Reuse Phase 8 — engine resolves; we choose merged-vs-tiled collider strategy to avoid seam-stick. |
| Coin pickup | Our code (scene state) | Engine (`onCollide`/`destroy`) | Engine detects overlap + removes the entity; the count + game meaning is ours. |
| Spike hazard → respawn | Our code (reuse Phase 8 `respawn()`) | Engine (`onCollide`) | Engine detects the hit; respawn *policy* is the Phase-8 seam, unchanged. |
| Goal → math-gate handoff | Our code (`onReachGoal` seam) | Engine (`onCollide`) | Engine detects arrival; the handoff contract is project logic (Phase 10 attaches here). |
| Camera clamp to new bounds | Our code (`camera.js` + new CONFIG bounds) | Engine (`setCamPos`) | Reuse Phase 8 `followCamera`; only the `LEVEL_*` CONFIG values change. |
| Run/level state lifecycle | Our code (scene closure) | Engine (`scene`/`go`) | All run state (coin count, lastCheckpoint) stays in the scene closure (CONTEXT anti-leak). |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay | 3001.0.19 (vendored) | Asset loading (`loadSprite`/`loadSpriteAtlas`), level build (`addLevel`), `sprite()`/`area()`/`body()` components, collisions, scenes | Locked decision; already vendored + MIME-served (Phase 7). Code ONLY against this version's API. `[VERIFIED: lib/kaplay.mjs — addLevel(Vi), loadSprite(Ot), loadSpriteAtlas($r) all present]` |
| Vanilla ES2020 modules | native | Level-data + scene module split, no build step | Project constraint; Phase 7/8 established relative ESM imports resolve identically in dev + container. `[VERIFIED: 07/08 SUMMARYs]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | No new code dependencies. Everything is Kaplay built-ins + our modules + static CC0 image files. No npm install, no CDN — the vendored/no-build constraint forbids it. |

### Asset "dependencies" (not packages — static image files vendored into `assets/`)
| Asset | Source candidate | License | Use |
|-------|-----------------|---------|-----|
| Dark/grunge tileset + spikes (+ optional character) | **0x72 "16x16 DungeonTileset II"** (`0x72.itch.io/dungeontileset-ii`) | **CC0** (attribution optional) | Level tiles, spike trap, player sprite `[ASSUMED — final pick + download is a build step]` |
| Animated coin | **OpenGameArt CC0 spinning-coin spritesheet** (`opengameart.org/content/spinning-coin-0` or `…/pixel-coins-asset`) | **CC0** | Collectible coins (0x72 pack has no coin) `[ASSUMED]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 0x72 DungeonTileset II | Kenney **1-Bit Pack** (CC0, monochrome dark) | 1-bit is very minimal/abstract — readable silhouettes but less "real little platformer" feel. Good safe fallback. |
| 0x72 DungeonTileset II | Kenney **Pixel Platformer** (CC0, 18×18) | CC0 and huge, but **bright/colorful — wrong aesthetic** (CONTEXT wants dark/grunge). Reject for the look unless recolored. |
| 0x72 DungeonTileset II | VEXED **Retro Lines** (CC0, 16×16) | CC0, stylized line-art; viable dark alt if dungeon tiles read poorly at this scale. |
| `addLevel` symbol map | Direct `add([...])` per entity from a JS object list | `addLevel` is concise for tile grids (one char = one tile) but adds the `tilePos`/spatial-map machinery; a plain list is simpler for ~3–4 screens with sparse coins/spikes. **Either is valid (Claude's discretion).** Recommend `addLevel` for the solid-tile body, direct `add` for sparse coins/spikes/goal — or all-direct if simpler. |
| `loadSprite` with `sliceX/sliceY` | `loadSpriteAtlas` (named sub-rects) | Use `sliceX/sliceY/anims` for an evenly-gridded spritesheet (coin frames, character anims); use `loadSpriteAtlas` when sub-images sit at irregular offsets in one big sheet. |

**Installation:** None (code). Assets: download the chosen CC0 pack, extract the needed PNGs into `assets/` (e.g. `assets/tiles/…`, `assets/coin.png`), capture the license page proof into `assets/LICENSES/`. No `npm install`, no CDN.

**Version verification:** Engine unchanged from Phase 8 — `lib/kaplay.mjs` still reports `version:"3001.0.19"`, `license:"MIT"`, sha256 `fb4a4ef2…` (Phase 7 pin). `[VERIFIED: lib/kaplay.mjs header + package object]` No registry lookup (offline/vendored by design).

## Package Legitimacy Audit

> This phase installs **no** npm/PyPI/crates packages. Kaplay is pre-vendored and pinned (Phase 7). The only external artifacts are **static CC0 image files** — these carry a *licensing* risk (handled in "Asset Licensing & Documentation" + the LEVEL-08 CREDITS gate), not a supply-chain package risk.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| kaplay | npm (vendored, not installed) | established | — | github.com/kaplayjs/kaplay | OK | Already vendored Phase 7; pinned 3001.0.19, sha256-verified |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

**Asset-legitimacy note (not a package, but the real risk this phase):** Each downloaded image pack must have its CC0 license verified at the source page and the proof captured into `assets/LICENSES/`. "Found on a free-assets site" is NOT proof of CC0 — check the *individual pack's* license statement (some itch.io creators mix CC0 art with CC-BY or custom terms across packs). This is the LEVEL-08 obligation and the highest-value human verification step.

## Architecture Patterns

### System Architecture Diagram

```
   CC0 pack files in assets/  (tiles.png, coin.png, spikes.png, goal.png, player.png)
            │  loadSprite("tile", "../assets/...") / loadSpriteAtlas(...)   [BEFORE go("game")]
            ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  scene("game", (data) => { ... })   ← ALL run state lives here (closure)   │
   │                                                                            │
   │   level data (hand-authored array/object)                                  │
   │            │  read by the scene                                            │
   │            ▼                                                               │
   │   ┌─────────────────┐   solid tiles: add([ sprite(...), area(),           │
   │   │ level builder   │ ───────────────  body({isStatic:true}), "ground" ]) │
   │   │ (addLevel OR    │   merged floor colliders (anti seam-stick, Ph8)     │
   │   │  direct add)    │   coins:  add([ sprite("coin"), area(), "coin" ])    │
   │   │                 │   spikes: add([ sprite("spike"), area(), "spike" ])  │
   │   │                 │   goal:   add([ sprite("goal"),  area(), "goal" ])   │
   │   └────────┬────────┘                                                      │
   │            │                                                               │
   │   ┌────────▼────────┐  makePlayer(startX,startY)  (Phase 8 — sprite swap)  │
   │   │ player (Phase 8)│  movement/jump/coyote/buffer UNCHANGED               │
   │   └────────┬────────┘                                                      │
   │            │ player.onCollide(...)                                         │
   │   ┌────────┴───────────────────────────────────────────────────────────┐ │
   │   │  onCollide("coin",  c => { coins++; destroy(c); /*Ph12 juice*/ })   │ │
   │   │  onCollide("spike", () => respawn())   ← Phase 8 reset()/respawn()  │ │
   │   │  onCollide("goal",  () => onReachGoal())  ← SINGLE Phase-10 seam    │ │
   │   └────────────────────────────────────────────────────────────────────┘ │
   │            │                                                               │
   │            ▼  player.pos → followCamera(player)  (Phase 8, new bounds)     │
   │   fall-off-world (player.y > LEVEL_BOTTOM+FALL_MARGIN) → respawn()  (Ph8)  │
   │                                                                            │
   │   onReachGoal(): Phase 9 = pause player + placeholder msg (STUB)           │
   │                  Phase 10 = attach the real in-world math gate HERE        │
   └──────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── index.html        # unchanged (file:// guard + canvas#game)
├── main.js           # add loadSprite/loadSpriteAtlas calls BEFORE go("game"); register goal-stub if desired
├── config.js         # UPDATE LEVEL_* bounds for the new ~3–4 screen level; ADD coin/spike/goal/tile constants
├── player.js         # Phase 8 — swap the placeholder rect for sprite("player"); movement UNCHANGED
├── camera.js         # Phase 8 — unchanged (consumes new CONFIG.LEVEL_* bounds)
├── level.js          # NEW (recommended): hand-authored level data + a buildLevel() that the scene calls
└── scenes/
    └── game.js       # REPLACE the test-strip geometry with buildLevel(); ADD coin/spike/goal onCollide;
                      #   KEEP checkpoint markers + reset()/respawn() + fall-off-world + followCamera
assets/
├── tiles/…           # vendored CC0 tileset PNG(s)
├── coin.png          # CC0 coin spritesheet
├── spike.png, goal.png, player.png
└── LICENSES/         # per-asset CC0 proof (source URL + license screenshot/txt)  [LEVEL-08]
CREDITS.md            # repo root — every asset's source + verified CC0 license   [LEVEL-08]
```
*(Exact file boundaries are Claude's discretion. Keep the Phase-8 invariants: all run state in the scene closure, CONFIG-only constants, reposition-in-place respawn.)*

### Pattern 1: Loading CC0 sprites (LEVEL-02) — `loadSprite` / `loadSpriteAtlas`, web-root paths
**What:** Register image assets by name BEFORE the scene uses them. `loadSprite` slices an evenly-gridded sheet via `sliceX/sliceY` and names animations via `anims`; `loadSpriteAtlas` maps named sub-rects of one big sheet.
**When to use:** Call `loadSprite`/`loadSpriteAtlas` once, at boot in `main.js` (or a `scene`-level loader), before `go("game")`. Kaplay queues loads and shows its loading screen until they resolve.
**CRITICAL path rule:** assets sit at the web root's `assets/` sibling. From a page served at `src/` root (dev) or container root (prod), use **`../assets/...`** — exactly mirroring `import … from "../lib/kaplay.mjs"`. A wrong path → silent 404 → sprite never renders (the Phase-7 path/`file://` pitfall).
**Example:**
```javascript
// Source: API verified in lib/kaplay.mjs — loadSprite(name, src, {sliceX, sliceY, anims})
// Single sprite (e.g. a goal flag, a spike):
loadSprite("spike", "../assets/spike.png");
loadSprite("goal",  "../assets/goal.png");

// Gridded spritesheet sliced into frames + named animation (e.g. spinning coin, 8 frames in a row):
loadSprite("coin", "../assets/coin.png", {
  sliceX: 8, sliceY: 1,
  anims: { spin: { from: 0, to: 7, loop: true, speed: 12 } },
});

// Atlas: one big sheet, named irregular sub-rects:
loadSpriteAtlas("../assets/tiles.png", {
  "ground":  { x: 0,  y: 0,  width: 16, height: 16 },
  "wall":    { x: 16, y: 0,  width: 16, height: 16 },
  // ...one entry per named tile
});
```
- `loadSprite(name, src, opts)` default opts `{ sliceX:1, sliceY:1, anims:{} }`. `[VERIFIED: lib/kaplay.mjs Ot(t,e,n={sliceX:1,sliceY:1,anims:{}})]`
- `loadSpriteAtlas(src, definition)` maps each key to a sub-rect of the sheet. `[VERIFIED: lib/kaplay.mjs $r(t,e)]`
- Anim frame options seen in source: `from`, `to`, `loop`, `speed`, `pingpong`. `[VERIFIED: anims/loop/speed/pingpong present]`
- **NOTE:** `loadSpriteSheet` (a Kaboom-legacy name) is **NOT present** — do not copy old-Kaboom snippets. Use `loadSprite` with `sliceX/sliceY` instead. `[VERIFIED: grep returns nothing for loadSpriteSheet]`
- Other loaders present if useful: `loadAseprite`, `loadPedit`, `loadBean`. `[VERIFIED]`

### Pattern 2: Building the level — `addLevel` symbol map OR direct `add` (LEVEL-01, LEVEL-03)
**What:** Two valid ways to instantiate the level body. Both reuse the Phase-8 collision approach (merged static colliders for the floor, `body({maxVelocity})` cap on the player).
**Option A — `addLevel` (concise for tile grids):**
```javascript
// Source: addLevel(map, opts) verified — opts MUST include tileWidth/tileHeight; tiles maps a
// single-char symbol to a (pos)=>[components] function; wildcardTile handles unmapped symbols.
addLevel([
  "                    ",
  "          c         ",
  "   c            x   ",
  "================goal",   // example only — author the real ~3–4 screen layout
], {
  tileWidth: 16,
  tileHeight: 16,
  pos: vec2(0, 0),
  tiles: {
    "=": (p) => [ sprite("ground"), area(), body({ isStatic: true }), "ground" ],
    "c": (p) => [ sprite("coin"), area(), "coin" ],
    "x": (p) => [ sprite("spike"), area({ /* tighter shape, see Pattern 4 */ }), "spike" ],
  },
});
```
- `addLevel` throws if `tileWidth`/`tileHeight` are missing; each `tiles[symbol]` MUST be a function returning a component list (it is called with the tile's world pos). `[VERIFIED: lib/kaplay.mjs Vi — "Must provide tileWidth and tileHeight" + "Level symbol def must be a function returning a component list"]`
- `wildcardTile(symbol, pos)` handles any character not in `tiles`. `[VERIFIED]`
- **Caveat:** `addLevel` builds a parent object with `tilePos`/spatial-map machinery (used for pathfinding/getSpatialMap). For a static hand-authored level you don't need that — but it's harmless. **Seam-stick note:** a grid of per-tile `body({isStatic:true})` colliders re-introduces the many-collider seam risk Phase 8 avoided. Mitigate by giving the *floor run* one merged wide collider (Option B) even if you render tiles individually, OR confirm on a flat-run test that the gridded colliders don't snag (Phase 8 fallback: lower MAX_FALL_SPEED / thicker colliders).
**Option B — direct `add` from a JS list (simpler for sparse content + merged floor):**
```javascript
// Solid ground as ONE merged collider (anti seam-stick, Phase 8 Pattern 5) but tiled VISUALS:
add([ rect(LEVEL_WIDTH, 16), pos(0, FLOOR_Y), area(), body({ isStatic: true }), "ground", opacity(0) ]);
for (const x of floorTileXs) add([ sprite("ground"), pos(x, FLOOR_Y) ]); // visuals only, no collider
// Sparse coins/spikes/goal from a data list:
for (const c of LEVEL.coins)  add([ sprite("coin"),  pos(c.x, c.y), area(), "coin" ]);
for (const s of LEVEL.spikes) add([ sprite("spike"), pos(s.x, s.y), area(), "spike" ]);
add([ sprite("goal"), pos(LEVEL.goal.x, LEVEL.goal.y), area(), "goal" ]);
```
**Recommendation:** Use **Option B's merged collider for the floor run** (keeps Phase 8's verified anti-seam-stick property) and a data list for coins/spikes/goal. `addLevel` is fine for the visual tile grid or raised platforms. The key invariant is: **don't regress the merged-floor collision Phase 8 proved out.** `[ASSUMED — merged-floor recommendation carried from Phase 8 RESEARCH Pattern 5; gridded-collider seam risk is the reason]`

### Pattern 3: Coin collection (LEVEL-04) — tag + onCollide + destroy + scene-closure count
**What:** Coins are `area()` (+ optional sprite anim) tagged `"coin"`. On overlap, increment a **scene-closure** counter and remove the coin. NO XP this phase (count only).
**Example:**
```javascript
// state lives in the SCENE CLOSURE (CONTEXT anti-leak — no module-level let)
let coinsCollected = 0;
const totalCoins = LEVEL.coins.length;

// place coins (Pattern 2), each plays its spin anim:
for (const c of LEVEL.coins) {
  const coin = add([ sprite("coin"), pos(c.x, c.y), area(), anchor("center"), "coin" ]);
  coin.play("spin");   // the named anim from loadSprite
}

player.onCollide("coin", (coin) => {
  coinsCollected += 1;        // tracked count only — Phase 11 reads this into XP
  destroy(coin);              // remove the collected coin
  // Phase 12 adds the satisfying pop/sfx (JUICE-02) — NOT here
});
```
- `onCollide(tag, cb)`, `destroy(obj)`, `play(animName)` all present. `[VERIFIED: onCollide, destroy, anims/play in lib/kaplay.mjs]`
- Keep the count in the closure (mirrors `lastCheckpoint` from Phase 8). Phase 11 will surface it as XP. `[CITED: 09-CONTEXT — coin count in scene state only]`

### Pattern 4: Spike hazard → reuse Phase 8 respawn (LEVEL-05) — never game-over
**What:** Static spikes are `area()` tagged `"spike"`. On overlap, call the **existing Phase 8 `respawn()`** — reposition to the last checkpoint, zero velocity, quick flash. No lives, no game-over (project hard constraint).
**Example:**
```javascript
// respawn() / reset() already exist in scenes/game.js (Phase 8). Spikes reuse them verbatim.
player.onCollide("spike", () => {
  respawn();   // Phase 8 seam: player.pos = lastCheckpoint.clone(); player.vel = vec2(0); flash.
});
```
- **Tighter hitbox:** a full-tile `area()` on a spike makes it feel unfair (you die from the empty top of the tile). Use `area({ shape: new Rect(vec2(0), w, h), offset: vec2(...) })` to shrink/offset the collider to the spike's visible points. `area()` supports `shape`/`offset`/`collisionIgnore`. `[VERIFIED: shape:, offset:, collisionIgnore present in area component]`
- **ADHD-safety:** spikes route through the SAME gentle respawn as fall-off-world — no new failure UI, no lives counter. `[CITED: 09-CONTEXT + REQUIREMENTS LEVEL-05/LEVEL-06 + Out-of-Scope "no game-over"]`
- Place a generous checkpoint just before each spike so a respawn never costs meaningful progress (CONTEXT: generous checkpoints, ADHD-safe).

### Pattern 5: Goal → `onReachGoal` single-point seam (LEVEL-07)
**What:** The goal flag is `area()` tagged `"goal"`. On the player reaching it, fire **one** `onReachGoal()` call. Phase 9 attaches a temporary stub (pause player + placeholder message); Phase 10 replaces the stub body with the real in-world math gate — at this **single** call site.
**Example:**
```javascript
// Phase 9 stub — keep it ONE function so Phase 10 has exactly one place to wire the gate.
let goalReached = false;     // closure flag — fire once, don't re-trigger every frame of overlap
function onReachGoal() {
  if (goalReached) return;
  goalReached = true;
  // Phase 9 STUB: stop the player + show a placeholder. Phase 10 swaps this body for the math gate.
  player.paused = true;                       // or zero vel + disable input
  add([ text("GOAL!  (math gate → Phase 10)"), pos(center()), anchor("center"), fixed() ]);
}

player.onCollide("goal", onReachGoal);
```
- **Single-point discipline:** exactly one `onReachGoal` function, one `onCollide("goal", …)` wiring. Phase 10 attaches the gate by replacing the stub body (or by `onReachGoal` invoking a Phase-10 module) — not by adding new collision logic. `[CITED: 09-CONTEXT "keep the seam clean and single-point"]`
- **Fire-once guard:** `area()` overlap fires continuously while overlapping; a `goalReached` flag (or `player.onCollide` + immediate `player.paused`) prevents re-entry. `[ASSUMED — standard onCollide-overlap behavior; guard is defensive]`
- `text()`, `fixed()` (screen-space HUD), `center()`/`add` are Kaplay globals. `[VERIFIED: text/fixed/anchor present; used in Phase 7 smoke scene]`

### Pattern 6: Camera + bounds for the new level (LEVEL-01) — reuse Phase 8
**What:** `followCamera(player)` is unchanged. Only the `CONFIG.LEVEL_LEFT/RIGHT/TOP/BOTTOM` values change to match the new ~3–4 screen level so the camera clamps correctly (no void at edges).
```javascript
// src/config.js — widen bounds to the authored level extent (replaces the 1600 test-strip width)
LEVEL_LEFT: 0, LEVEL_RIGHT: <level pixel width>, LEVEL_TOP: 0, LEVEL_BOTTOM: <level pixel height>,
```
- `followCamera` already clamps to these (Phase 8 `camera.js`). `[VERIFIED: src/camera.js reads CONFIG.LEVEL_*]`
- 640×360 canvas; a "screen" ≈ 640px wide, so ~3–4 screens ≈ 1920–2560px `LEVEL_RIGHT`. `[ASSUMED — CONTEXT "~3–4 screens"; exact width is authoring discretion]`

### Anti-Patterns to Avoid
- **Wrong asset paths** (`"assets/coin.png"` or `"/assets/coin.png"` instead of `"../assets/coin.png"`): silent 404, sprite never shows. Mirror the `../lib/kaplay.mjs` web-root convention. `[VERIFIED: Phase 7 README web-root parity]`
- **Per-tile static colliders for a long flat run**: re-introduces the seam-stick risk Phase 8 eliminated with a merged collider. Merge the floor-run collider (render tiles separately). `[CITED: Phase 8 RESEARCH Pattern 5 / Pitfall 2]`
- **CDN/`http(s)://` asset URLs**: breaks the offline/no-CDN constraint. Vendor every file into `assets/`. `[CITED: 09-CONTEXT "No CDN"]`
- **Module-level run state** (`let coins = 0` at file top): leaks across `go()`/respawn. Keep in the scene closure. `[CITED: STATE.md pitfall #3]`
- **Game-over / lives on spike hit**: violates the project hard constraint. Spikes route to the gentle Phase-8 respawn only. `[CITED: REQUIREMENTS Out-of-Scope]`
- **Multiple goal-handoff call sites**: makes Phase 10's job ambiguous. Exactly one `onReachGoal`. `[CITED: 09-CONTEXT single-point seam]`
- **Shipping vendor logos / non-CC0 art**: LEVEL-08 violation + licensing risk. Verify each pack's own license page; strip any logo art. `[CITED: 09-CONTEXT / REQUIREMENTS LEVEL-08]`
- **Copying old-Kaboom asset snippets** (`loadSpriteSheet`, `kaboom(`): wrong API for 3001. `[VERIFIED: loadSpriteSheet absent]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image decode + spritesheet slicing | Manual `Image()` + canvas crop | `loadSprite(name, src, {sliceX,sliceY,anims})` | Engine fetches, decodes, slices, names anims, and shows a loading screen. `[VERIFIED]` |
| Atlas sub-rect mapping | Manual offset bookkeeping | `loadSpriteAtlas(src, def)` | Named sub-rects in one call. `[VERIFIED]` |
| Tile-grid instantiation | Nested loops + manual pos math | `addLevel(map, {tileWidth,tileHeight,tiles})` | One char = one tile, auto-positioned (if you want a grid). `[VERIFIED]` |
| Coin pickup detection | Manual AABB overlap test each frame | `player.onCollide("coin", …)` + `destroy()` | Engine fires on overlap; you just count + remove. `[VERIFIED]` |
| Sprite animation loop | Manual frame-index timer | `sprite` anim + `play("spin")` (`from/to/loop/speed`) | Engine ticks frames at `speed`. `[VERIFIED]` |
| Hazard respawn policy | New death/respawn system | Reuse Phase 8 `reset()`/`respawn()` | The seam already exists, is ADHD-safe, and is stress-verified. `[VERIFIED: src/scenes/game.js]` |
| Camera follow/clamp | New camera code | Reuse Phase 8 `followCamera()` | Frame-rate-independent + bounds-clamped already. `[VERIFIED: src/camera.js]` |

**Key insight:** Phase 9 is mostly *content + asset wiring*, not new systems. The only genuinely new engine surface is **asset loading** (`loadSprite`/`loadSpriteAtlas`) — everything else (collision, respawn, camera, scene-state discipline) is reused verbatim from Phase 8. The biggest non-engine risk is **CC0 license correctness**, which is documentation discipline, not code.

## Runtime State Inventory

> Phase 9 is an additive content phase (new level + assets + collision wiring) that **replaces the Phase 8 test-strip geometry** inside `src/scenes/game.js`. No rename/migration of persisted data (persistence is Phase 11). Included for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 9 adds no persistence. Coin count lives in the scene closure only (Phase 11 will persist XP). | none |
| Live service config | None — static client-only game served by nginx (Phase 7). | none |
| OS-registered state | None. | none |
| Secrets/env vars | None. | none |
| Build artifacts | None — no build step. New `assets/*` files are served as-is. The Dockerfile **already copies `assets/`** into the image (`COPY assets/ /usr/share/nginx/html/assets/`), so vendored CC0 files ship automatically — no Dockerfile change needed. The Phase 8 test-strip geometry in `scenes/game.js` is **replaced**, not migrated. | drop CC0 files into `assets/`; replace test-strip code |

**Verified:** the Dockerfile (`docker/Dockerfile` line 16) already copies `assets/` to the web root, and nginx serves it; PNGs get a correct MIME from the bundled `mime.types` (only `.mjs` needed the Phase-7 fix). `[VERIFIED: docker/Dockerfile, docker/nginx.conf]`

## Common Pitfalls

### Pitfall 1: Asset path mismatch (dev vs. container) — silent 404
**What goes wrong:** Sprites never render; canvas shows the loading screen forever or blank tiles.
**Why it happens:** `assets/` is a **sibling of the served root**, not inside `src/`. Paths like `"assets/x.png"` (no `../`) or `"/assets/x.png"` (absolute) resolve differently in dev (`cd src`) vs. container.
**How to avoid:** Use **`../assets/...`**, mirroring `import … from "../lib/kaplay.mjs"`. Verify by curling the asset URL over the dev server (Phase-8 verification habit) and watching the Network tab for 200s.
**Warning signs:** 404s in the Network tab; "failed to load sprite" console errors.
`[VERIFIED: Phase 7 README web-root parity + Dockerfile flatten of src/ to root, lib/ + assets/ as siblings]`

### Pitfall 2: Seam-stick from per-tile colliders (regressing Phase 8)
**What goes wrong:** Player snags mid-run on the boundary between adjacent floor tiles — the exact bug Phase 8 eliminated.
**Why it happens:** If you give every tile its own `body({isStatic:true})`, you re-create the many-collider seam grid.
**How to avoid:** Render tiles individually for visuals, but use ONE merged wide collider for each contiguous floor run (Pattern 2, Option B). Re-run the Phase-8 flat-run check on the real level.
**Warning signs:** Stutter/stop on flat ground; the symptom Phase 8 fixed reappears.
`[CITED: Phase 8 RESEARCH Pattern 5 / Pitfall 2 — the merged-collider fix must be preserved]`

### Pitfall 3: Tunneling on fast drops in the new level
**What goes wrong:** Player passes through a thin platform after a tall fall (Phase 8 Pitfall 3, on new geometry).
**Why it happens:** Discrete AABB collision; a fast step can skip a thin collider. The new level may have taller drops than the test strip.
**How to avoid:** Keep the player's `body({maxVelocity: CONFIG.MAX_FALL_SPEED})` cap; make floor/platform colliders thick enough; re-test the tallest drop in the authored level.
**Warning signs:** Player vanishes below a platform after a big fall.
`[CITED: Phase 8 RESEARCH Pitfall 3 — same lever applies to new geometry]`

### Pitfall 4: Unfair spike hitboxes
**What goes wrong:** Player "dies" from the empty top corner of a spike tile, feeling unfair (anti-ADHD-safe).
**Why it happens:** A default full-tile `area()` covers transparent pixels above the spikes.
**How to avoid:** Shrink/offset the spike collider with `area({ shape, offset })` to the visible points; place a checkpoint right before each spike.
**Warning signs:** Respawns that feel undeserved during playtest.
`[VERIFIED: area supports shape/offset]`

### Pitfall 5: Goal fires repeatedly / multiple handoff sites
**What goes wrong:** The placeholder message spawns every frame of overlap; or Phase 10 finds several places to wire the gate.
**Why it happens:** `onCollide` fires continuously while overlapping; scattered goal logic.
**How to avoid:** One `onReachGoal()` with a `goalReached` fire-once flag; pause the player on first contact. Exactly one `onCollide("goal", …)`.
**Warning signs:** Stacked messages; Phase-10 planner asks "where does the gate attach?"
`[ASSUMED — standard overlap behavior; single-point is the CONTEXT requirement]`

### Pitfall 6: CC0 license assumed, not verified (LEVEL-08)
**What goes wrong:** An asset shipped as "CC0" is actually CC-BY or has custom terms → license violation; or a vendor logo ships.
**Why it happens:** Free-asset aggregators mix licenses; a creator's *account* may host both CC0 and non-CC0 packs.
**How to avoid:** Open the *individual pack's* license statement, confirm CC0/public-domain, capture the proof (URL + screenshot/text) into `assets/LICENSES/`, list it in `CREDITS.md`. Strip any logo/brand art.
**Warning signs:** Can't find an explicit license line on the asset page; license differs per-file in the pack.
`[CITED: 09-CONTEXT + REQUIREMENTS LEVEL-08; web research confirms mixed-license risk on aggregators]`

## Code Examples

### Boot-time asset loading (main.js, before go("game"))
```javascript
// Source: API verified in lib/kaplay.mjs. Paths use ../assets (web-root parity, Phase 7).
import kaplay from "../lib/kaplay.mjs";
import { gameScene } from "./scenes/game.js";
const k = kaplay({ width: 640, height: 360, background: "#0a0a0a",
                   canvas: document.querySelector("#game") });

loadSprite("ground", "../assets/tiles/ground.png");
loadSprite("spike",  "../assets/spike.png");
loadSprite("goal",   "../assets/goal.png");
loadSprite("player", "../assets/player.png");
loadSprite("coin",   "../assets/coin.png", {
  sliceX: 8, anims: { spin: { from: 0, to: 7, loop: true, speed: 12 } },
});

scene("game", gameScene);
go("game", { startX: 64, startY: 64 });   // Kaplay waits for loads before the scene draws
```

### Sprite swap in makePlayer (player.js — movement UNCHANGED)
```javascript
// Phase 8: rect(24,32) + color(0,255,136). Phase 9: swap the visual to the CC0 sprite.
const player = add([
  sprite("player"),                              // was rect(24,32) + color(...)
  pos(startX, startY),
  area(),                                        // collider; tune w/ {shape} if sprite has padding
  body({ maxVelocity: CONFIG.MAX_FALL_SPEED }),  // UNCHANGED
  opacity(1),                                    // UNCHANGED (respawn flash)
  "player",
]);
// ... all coyote/buffer/variable-height onUpdate logic UNCHANGED ...
```

### Scene wiring (scenes/game.js — replace test strip, keep respawn/camera/state)
```javascript
// KEEP: setGravity, lastCheckpoint closure, addCheckpoint, reset()/respawn(),
//       followCamera(player), fall-off-world threshold.  REPLACE: the test-strip add([...]) lines.
import { LEVEL } from "../level.js";   // hand-authored data (recommended)

let coinsCollected = 0;
buildLevelGeometry(LEVEL);             // merged floor collider + tiled visuals + platforms (Pattern 2)
for (const c of LEVEL.coins)  { const o = add([sprite("coin"), pos(c.x,c.y), area(), "coin"]); o.play("spin"); }
for (const s of LEVEL.spikes) add([sprite("spike"), pos(s.x,s.y), area({/*tight*/}), "spike"]);
add([sprite("goal"), pos(LEVEL.goal.x, LEVEL.goal.y), area(), "goal"]);

const player = makePlayer(startX, startY);
player.onCollide("coin",  (c) => { coinsCollected++; destroy(c); });
player.onCollide("spike", () => respawn());                 // Phase 8 seam
let goalReached = false;
player.onCollide("goal",  () => { if (!goalReached){ goalReached = true; onReachGoal(); } });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Kaboom `loadSpriteSheet(...)` | KAPLAY `loadSprite(name, src, {sliceX,sliceY,anims})` | KAPLAY 3001 | `loadSpriteSheet` is absent from 3001.0.19 — slicing folds into `loadSprite`. Don't copy old snippets. `[VERIFIED: grep]` |
| Kaboom `addLevel(map, {width,height,...})` | KAPLAY `addLevel(map, {tileWidth,tileHeight,tiles,wildcardTile})` | KAPLAY 3001 | Option keys renamed to `tileWidth`/`tileHeight`; tiles are `(pos)=>[components]` functions. `[VERIFIED: Vi throws on missing tileWidth/tileHeight]` |

**Deprecated/outdated:** Ignore any `kaboom(`, `loadSpriteSheet`, or 2000-series KAPLAY snippets from the web — asset/level option names differ. Code against the 3001.0.19 surface documented here only.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 0x72 "16x16 DungeonTileset II" is CC0, dark, includes spike traps + a usable character | Standard Stack / CC0 Sourcing | LOW-MEDIUM — web-verified CC0 + dark; final pick is Claude's discretion + a human-confirmable download. If unsuitable, fall back to Kenney 1-Bit Pack / VEXED Retro Lines (both CC0). |
| A2 | The pack has no built-in coin → a separate CC0 coin (OpenGameArt spinning-coin) is needed | Standard Stack | LOW — if the chosen pack includes a coin, skip the extra source. Either way coin is CC0. |
| A3 | ~3–4 screens ≈ 1920–2560px level width on the 640px canvas | Pattern 6 | LOW — authoring discretion; just set `CONFIG.LEVEL_RIGHT` to the actual extent. |
| A4 | Merged-floor collider (not per-tile bodies) is the right anti-seam-stick choice for the real level | Pattern 2 / Pitfall 2 | LOW — carried from Phase-8 verified behavior; the alternative (gridded colliders) re-introduces a known risk. |
| A5 | A `goalReached` fire-once flag is needed because `onCollide` fires every overlap frame | Pattern 5 / Pitfall 5 | LOW — defensive; worst case it's redundant. |
| A6 | CC0 art on aggregators can be mixed-license per pack/file, so per-pack verification is required | Pitfall 6 / Licensing | LOW — this is the safe assumption; verifying anyway costs little and satisfies LEVEL-08. |
| A7 | Spike `area({shape,offset})` tightening is needed for fair hitboxes | Pattern 4 / Pitfall 4 | LOW — feel/UAT detail; tune during playtest. |

**Highest-value to retire early:** A1/A2 — pick + download + license-verify the actual CC0 pack(s) at the start of the phase (a `checkpoint:human-verify` task), since all visual work depends on it and LEVEL-08 hinges on it.

## Open Questions (RESOLVED)

1. **Exactly which CC0 pack ships?**
   - What we know: 0x72 DungeonTileset II (CC0, dark, spikes, character) is the lead; Kenney 1-Bit Pack and VEXED Retro Lines are CC0 fallbacks; OpenGameArt has CC0 coins.
   - What's unclear: which reads best at 16×16 against `#0a0a0a` and matches "real little platformer" without pink — a visual judgment.
   - Recommendation: Plan a first task that downloads + license-verifies the chosen pack(s) into `assets/` + `assets/LICENSES/` (a `checkpoint:human-verify` is appropriate given LEVEL-08), before authoring the level.
   - RESOLVED: This is Claude's Discretion per CONTEXT (pack pick). Plan 09-01 adopts the 0x72 lead + CC0 fallbacks behind a `checkpoint:human-verify` license gate before any visual work.

2. **`addLevel` symbol map vs. direct `add` list for the level body?**
   - What we know: both are valid; `addLevel` is concise for grids but adds spatial-map machinery and per-tile colliders (seam risk); direct `add` lets you merge floor colliders.
   - What's unclear: which the planner prefers for authoring ergonomics.
   - Recommendation: Merged collider for floor runs (preserve Phase-8 behavior) + data list for sparse coins/spikes/goal; `addLevel` optional for the visual tile grid. Either way, re-run the flat-run collision check.
   - RESOLVED: This is Claude's Discretion per CONTEXT (level-data shape). Plan 09-02 adopts the merged floor collider (anti seam-stick) + hand-authored data list for sparse coins/spikes/goal.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Kaplay engine (loadSprite/loadSpriteAtlas/addLevel) | All asset/level work | ✓ | 3001.0.19 (vendored `lib/kaplay.mjs`) | — |
| Local dev server | In-browser testing (file:// blocks ESM + asset fetch) | ✓ (documented) | `cd src && python3 -m http.server 8000` | nginx container (Phase 7) |
| Internet access to download CC0 packs | Sourcing the art (one-time) | ✓ (this session reached itch.io/Kenney/OpenGameArt) | — | Use already-known CC0 packs; offline once vendored |
| Image editor (optional) | Cropping/recoloring tiles, stripping logos | ? (assume available) | — | Use packs as-is if no edit needed |
| `assets/` served by nginx | Production asset delivery | ✓ | Dockerfile already `COPY assets/ …` | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none material — once CC0 files are vendored, the rest is offline/no-build.

## Validation Architecture

> `nyquist_validation` is enabled. This project has **no automated test framework** (no `package.json`, no test runner — by no-build design). As in Phase 8, validation is **`node --check` syntax gate per module + manual in-browser UAT** — appropriate for asset rendering + level feel that can't be meaningfully unit-tested.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no-build, no node_modules) — `node --check` syntax gate + manual browser UAT |
| Config file | none |
| Quick run command | `node --check src/<changed>.js` per file; then `cd src && python3 -m http.server 8000` → open `http://localhost:8000/` |
| Full suite command | same + DevTools Network tab (all asset 200s) + console clean + a full start→goal playthrough |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Command / Method | Exists? |
|--------|----------|-----------|------------------|---------|
| LEVEL-01 | Traverse start→goal over platforms/gaps/ground | manual | Serve, play the level end-to-end; reach the goal | ❌ Wave 0 (level.js + scene) |
| LEVEL-02 | Dark/grunge CC0 sprites render, readable, no pink | manual | Visual check vs. `#0a0a0a`; confirm silhouettes readable; confirm no pink/logos | ❌ Wave 0 (assets + loadSprite) |
| LEVEL-03 | Reliable collision (no seam-stick / tunneling) | manual | Full-speed flat run + tallest drop on the real level (Phase-8 stress check re-run) | ❌ Wave 0 |
| LEVEL-04 | Collect coins | manual | Touch each coin → it disappears, count increments (DevTools/console-exposed count) | ❌ Wave 0 |
| LEVEL-05 | Spike triggers respawn, no game-over | manual | Touch a spike → respawn at last checkpoint, momentum zeroed, NO game-over/lives | ❌ Wave 0 |
| LEVEL-07 | Goal fires the handoff | manual | Reach goal → `onReachGoal` stub fires once (pause + placeholder); no repeat spam | ❌ Wave 0 |
| LEVEL-08 | CC0 sources + licenses documented | inspect | `CREDITS.md` + `assets/LICENSES/` list every asset's source URL + CC0 proof; no logos | ❌ Wave 0 |

### Sampling Rate
- **Per task:** `node --check` each changed module + serve & eyeball the changed behavior + Network-tab asset 200s.
- **Per wave merge:** full manual start→goal playthrough + clean console + all assets load.
- **Phase gate:** all 7 requirement behaviors pass in-browser, the collision stress re-check passes, and the CREDITS/LICENSES inspection passes, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `assets/*` — the vendored CC0 PNGs (tiles, coin, spike, goal, player) + `assets/LICENSES/` proofs
- [ ] `CREDITS.md` — per-asset source + CC0 license (LEVEL-08)
- [ ] `src/level.js` (recommended) — hand-authored level data + builder
- [ ] `src/scenes/game.js` — replace test-strip geometry; add coin/spike/goal onCollide + onReachGoal stub (covers LEVEL-01/03/04/05/07)
- [ ] `src/config.js` — new LEVEL_* bounds + coin/spike/goal/tile constants
- [ ] No framework install needed (manual UAT is the chosen, appropriate validation)

## Security Domain

> `security_enforcement` enabled (ASVS L1). Still a **client-only static game**: no auth, no network calls at play time, no storage this phase (persistence is Phase 11). Phase 9 adds **static image assets** + **author-controlled level data** — both author-trusted, not untrusted input.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts/auth (project canon). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | Single-user local/static game. |
| V5 Input Validation | minimal | Only keyboard events + author-authored level data / asset names drive state; no untrusted strings parsed. `loadSprite` paths are author-controlled constants. |
| V6 Cryptography | no | No secrets, no crypto. |
| V7 Error Handling/Logging | minimal | Keep console clean (failed sprite loads should be caught in dev, not shipped). |
| V12 File/Resources | minimal | Assets are same-origin static files under `assets/`; no user uploads, no remote fetch. nginx `nosniff` + correct MIME already set (Phase 7). |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/missing asset (404) | DoS (visual) | Author-controlled paths; verify 200s in dev; no runtime fetch of untrusted URLs. |
| Untrusted level data | Tampering | N/A — level data is author-written JS constants, not user input. |
| XSS via dynamic DOM | — | N/A — Kaplay renders to canvas; the only `innerHTML` is the static file:// guard in index.html. The goal-stub message uses Kaplay `text()` (canvas), not DOM. |
| License/IP violation (non-CC0 art) | Legal/compliance | Per-pack CC0 verification + `CREDITS.md` + `assets/LICENSES/` (LEVEL-08). This is the one real "compliance" obligation this phase. |

**Net:** No new code-security obligations beyond "don't introduce untrusted-input sinks" and "keep console clean." The material compliance obligation is **CC0 license correctness** (LEVEL-08), handled as documentation discipline + a human-verify checkpoint.

## CC0 Asset Sourcing (web-verified this session)

> External web search was available this session (built-in `WebSearch`). Findings below are MEDIUM-confidence (`[CITED:]` to the source pages); the final pick + download + license-proof capture is a human-confirmable build step (`[ASSUMED]` until done).

| Candidate | URL | License | Style | Tile | Contents | Fit |
|-----------|-----|---------|-------|------|----------|-----|
| **0x72 — 16x16 DungeonTileset II** | `0x72.itch.io/dungeontileset-ii` | **CC0** ("use for whatever you like (CC-0)… credit not necessary") | Dark dungeon, retro/fantasy | 16×16 | tiles, walls, floors, **spike traps**, switches, animated chars (heroes/monsters/torches) | **LEAD** — dark/grunge, spikes + character built in `[CITED: 0x72.itch.io/dungeontileset-ii]` |
| Kenney — 1-Bit Pack | `kenney-assets.itch.io/1-bit-pack` | CC0 | Monochrome (dark) | small | huge 1-bit set | Fallback — very minimal/abstract `[CITED: kenney.nl]` |
| VEXED — Retro Lines | `v3x3d.itch.io/retro-lines` | CC0 | Stylized line-art | 16×16 | hundreds of platformer tiles | Fallback — dark-capable `[CITED: itch.io]` |
| Kenney — Pixel Platformer | `kenney.nl/assets/pixel-platformer` | CC0 | **Bright/colorful** | 18×18 | 200 tiles | **Reject for look** (not dark/grunge) `[CITED: kenney.nl — confirmed bright]` |
| OpenGameArt — spinning coin | `opengameart.org/content/spinning-coin-0` / `…/pixel-coins-asset` | CC0 | pixel | 16×16 (and others) | animated coin frames | Coin source (0x72 has none) `[CITED: opengameart.org]` |

**Verification protocol for LEVEL-08 (do per asset before shipping):**
1. Open the asset's *own* page; confirm the license line says **CC0 / Creative Commons Zero / Public Domain** (not just "free" or CC-BY).
2. Save proof into `assets/LICENSES/<asset>.txt` (source URL + the quoted license statement) and/or a screenshot.
3. Add a row to `CREDITS.md` (asset name, author, source URL, license, what it's used for).
4. Confirm no company logo / brand art is in the shipped subset (strip if present).
5. CC0 attribution is optional, but listing the author in CREDITS is good practice and costs nothing.

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (vendored Kaplay 3001.0.19) — directly grepped/inspected this session for: `addLevel` (`Vi`: requires `tileWidth`/`tileHeight`; `tiles` = symbol→`(pos)=>[components]`; `wildcardTile`; spatial-map machinery), `loadSprite` (`Ot(t,e,n={sliceX:1,sliceY:1,anims:{}})`), `loadSpriteAtlas` (`$r(t,e)` named sub-rects), `loadAseprite`/`loadPedit`/`loadBean` present, `loadSpriteSheet` **absent**, `sprite()` component (`fn`; `flipX/flipY/frame/anims/play/onAnimEnd`), `area()` options (`shape`/`offset`/`collisionIgnore`), `onCollide`/`onCollideUpdate`/`onCollideEnd`/`destroy`, anim frame opts (`from/to/loop/speed/pingpong`).
- `src/scenes/game.js`, `src/player.js`, `src/camera.js`, `src/config.js` (Phase 8) — the exact `reset()`/`respawn()` seam, checkpoint markers, `followCamera`, CONFIG to extend.
- `docker/Dockerfile`, `docker/nginx.conf`, `README.md` (Phase 7) — web-root parity (`index.html` at root, `lib/`+`assets/` siblings → `../assets/...` paths), `assets/` already copied into the image, PNG MIME handled.
- `.planning/phases/08-.../08-RESEARCH.md`, `08-PATTERNS.md`, `08-0{1,2}-SUMMARY.md` — verified Phase-8 collision levers (merged colliders, `maxVelocity`), scene-closure discipline, respawn policy.
- `.planning/phases/09-.../09-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — locked decisions, requirement IDs, pitfall register (#9 over-stim/over-long, #10 CC0 license).

### Secondary (MEDIUM confidence)
- [0x72 — 16x16 DungeonTileset II](https://0x72.itch.io/dungeontileset-ii) — CC0 dark dungeon tileset + spikes + animated characters (lead pack).
- [Kenney — Pixel Platformer](https://kenney.nl/assets/pixel-platformer) — CC0 18×18, confirmed bright/colorful (rejected for look).
- [Kenney — 1-Bit Pack](https://kenney-assets.itch.io/1-bit-pack), [VEXED — Retro Lines](https://v3x3d.itch.io/retro-lines) — CC0 dark fallbacks.
- [OpenGameArt — spinning coin](https://opengameart.org/content/spinning-coin-0), [Pixel Coins Asset](https://opengameart.org/content/pixel-coins-asset) — CC0 coin.
- [itch.io CC0 tilesets](https://itch.io/game-assets/assets-cc0/tag-tileset), [free Dark+Tileset](https://itch.io/game-assets/free/tag-dark/tag-tileset) — browse for alternates.

### Tertiary (LOW confidence)
- Coin/goal/spike placement specifics, level geometry, and the "feels like a real little platformer" judgment are authoring/UAT calls (Phase 9 build + Phase 12 tune), not fetched facts — tagged `[ASSUMED]`.

## Metadata

**Confidence breakdown:**
- Kaplay asset/level/collision API: HIGH — every symbol (`addLevel`, `loadSprite`, `loadSpriteAtlas`, `sprite`, `area` options, `onCollide`, `destroy`, anim opts) grep-verified in the exact vendored 3001.0.19 source this session.
- Reuse seams (respawn, camera, scene-state): HIGH — read directly from the current Phase-8 source files.
- Web-root/asset-path convention: HIGH — verified against Dockerfile + nginx + README.
- CC0 pack sourcing: MEDIUM — web-verified CC0 + dark for the lead/fallback packs, but the final pick/download/license-proof is a human-confirmable build step.
- Level geometry / coin-spike-goal placement / feel: LOW/ASSUMED by intent — authoring + Phase-12 tuning.

**Research date:** 2026-06-24
**Valid until:** Engine surface is stable for the life of the 3001.0.19 pin (vendored — cannot drift). CC0 pack availability is web-state (~30 days nominal); once vendored into `assets/`, it's permanent and offline.
