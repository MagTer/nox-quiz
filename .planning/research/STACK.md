# Stack Research

**Domain:** Browser 2D platformer (vendored Kaplay, no-build) — v4.0 "Content & Challenge" milestone additions
**Researched:** 2026-06-28
**Confidence:** HIGH

> **Scope note (subsequent milestone):** The v3.0 stack is shipped and validated — vanilla ES2020 modules, vendored **Kaplay 3001.0.19** (`lib/kaplay.mjs`, `kaplay({ global: true })`), no npm/build, nginx-static over HTTP. This document does **not** re-research or propose replacing any of that. It covers ONLY the capabilities the NEW v4.0 features need: animated sprites, multiple scenes + level-select, parallax/layered backgrounds, mid-game math mechanics, and a no-build multi-level authoring format. **The headline finding: v4.0 needs ZERO new runtime code dependencies.** Every required capability already ships inside the vendored `kaplay.mjs` — the only "additions" are static CC0 art files (vendored exactly like v3.0) and new JS data/source modules.

---

## Recommended Stack

### Core Technologies (all already vendored — confirmed present in `lib/kaplay.mjs` @ 3001.0.19)

| Technology | Version | Purpose (v4.0 feature it enables) | Why Recommended |
|------------|---------|-----------------------------------|-----------------|
| **Kaplay `loadSprite` + `sliceX`/`sliceY`/`anims`** | 3001.0.19 (vendored) | Animated player (idle/run/jump), animated enemies, the existing spinning coin | Already the project's sprite path — `src/main.js` uses `loadSprite("coin", …, { sliceX, anims })` today. Multi-row sheets (idle/run/jump on separate rows) just add `sliceY`. **No new loader needed.** |
| **`SpriteComp.play(name, opts)` + `.animSpeed` + `onAnimEnd`** | 3001.0.19 (vendored) | Switching player anims on state change (grounded→`run`, jump→`jump`); one-shot enemy death anims | Confirmed in vendored bundle (`animSpeed`, `onAnimEnd`, `pingpong` symbols all present) and in 3001 docs. `coin.play("spin")` already in use. |
| **Kaplay scenes — `scene(name, cb)` + `go(name, data)` + `onSceneLeave`** | 3001.0.19 (vendored) | Title screen, level-select/world-map screen, per-level scenes, inter-level transitions | Already the boot mechanism (`scene("game", …); go("game", {…})`). Adding `scene("title", …)`, `scene("select", …)`, and `go("game", { levelId })` is the SAME idiom. `data` payload is the project's locked anti-leak pattern. |
| **`setLayers(names, default)` + `layer()` + `fixed()`** | 3001.0.19 (vendored) | Background/parallax layers behind gameplay; camera-immune title/HUD/menu UI | `setLayers` and `layer` confirmed in bundle; `fixed()` ("fixed" comp confirmed) keeps menu/HUD in screen-space. The v3.0 HUD already renders camera-immune — this formalizes it. |
| **`onUpdate` + `getCamPos`/`setCamPos`** | 3001.0.19 (vendored) | Parallax scroll (move bg layers as a fraction of camera) | The camera follow in `src/camera.js` already reads `getCamPos`/`setCamPos` each frame — parallax is the same hook reading `getCamPos()` and offsetting bg `pos`. |
| **`localStorage` (guarded wrapper in `progress.js`)** | Native | Per-level completion/unlock state alongside XP/level/practice-history | The v3.0 guarded save (`loadSave`/`writeSave`) already serializes a versioned JSON blob. Add a `levels: { [id]: { cleared, best } }` field + bump the save version. **No new storage tech.** |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **None (zero new runtime deps)** | — | — | **Always.** This is a hard constraint and it is fully satisfiable: every v4.0 capability is in the already-vendored engine. Do not add a single new `import` from outside `lib/`. |
| Plain JS data modules (`src/levels/*.js`) | ES2020 | Author the 3–5 levels as exported data objects | **Recommended authoring format** — see "Level-authoring format" below. Same shape the shipped `src/level.js` already proves. |

### Static Assets (vendored, NOT code — the only real "additions")

| Asset class | Source (license-clear) | Vendor path | Notes |
|-------------|------------------------|-------------|-------|
| Animated player sheet (idle/run/jump) | OpenGameArt CC0 (see CC0 sources below) | `assets/player.png` (replaces static 16×32) | Multi-row sheet → `loadSprite("player", …, { sliceX, sliceY, anims })`. |
| Real tileset | OpenGameArt CC0 (extend the shipped "6 Color Dungeon 16x16", HorusKDI, CC0) | `assets/tiles/*.png` | Same pack already vendored in v3.0 — extend it for richer tiles; provenance workflow already established. |
| Parallax background layers | OpenGameArt CC0 parallax packs | `assets/bg/*.png` | One PNG per depth layer; placed on `setLayers` bg layers. |
| Enemy sheet(s) | OpenGameArt CC0 | `assets/enemy-*.png` | For defeat-enemy-with-answer mechanic. |

---

## Confirmed Kaplay 3001.0.19 API shapes (verified against vendored `lib/kaplay.mjs` AND kaplayjs.com docs)

> Every claim below was checked two ways: (a) the symbol exists in the vendored bundle, and (b) the signature matches the 3001 docs. **Critically: `loadSpriteSheet` does NOT exist in the bundle** — `grep loadSpriteSheet lib/kaplay.mjs` returns nothing. The correct path is `loadSprite(name, src, { sliceX, sliceY, anims })`. This is already pinned in `src/main.js`'s comments.

### 1. Animated sprite sheets

```js
// Multi-ROW character sheet: e.g. 4 cols x 3 rows = idle/run/jump on separate rows.
// frame index counts left-to-right, top-to-bottom across the WHOLE grid.
loadSprite("player", "../assets/player.png", {
  sliceX: 4,           // columns
  sliceY: 3,           // rows  (omit/=1 for a single-row strip like the coin)
  anims: {
    idle: { from: 0, to: 3, loop: true, speed: 6 },
    run:  { from: 4, to: 7, loop: true, speed: 12 },
    jump: { from: 8, to: 8 },                 // single frame, no loop
    // optional: pingpong: true  (bounce 0→n→0); frames: [..] for non-contiguous
  },
});
```

- `LoadSpriteOpt`: `sliceX`, `sliceY`, `anims` — **confirmed** (docs example uses `sliceX:4, sliceY:1, anims:{run:{from,to}}`).
- `SpriteAnim` fields: `from`, `to`, `loop`, `speed`, `pingpong`, `frames` — **confirmed** (`pingpong` symbol present in bundle).

Playing / switching anims on the sprite GameObj:

```js
player.play("run");                       // SpriteComp.play(name, opts?)
player.play("jump", { speed: 20, loop: false });
player.animSpeed = 1.0;                    // global multiplier for this obj's anims
player.frame;                              // current absolute frame index
player.onAnimEnd((name) => { /* e.g. enemy death -> destroy() */ });
player.onAnimStart((name) => { /* ... */ });
```

- `play(anim, opts?)`, `animSpeed`, `frame`, `onAnimEnd(cb)`, `onAnimStart(cb)` — **all confirmed** in bundle + docs.
- **Integration note:** in `makePlayer` (`src/player.js`) drive `player.play(...)` from the existing grounded/jump state the `body()` already tracks (e.g. on `body.isGrounded()` transitions and vel.x sign), guarding so you only call `play()` on a *change* of anim (calling `play()` with the current anim every frame restarts it). This is a `player.js` change, not a new dependency.

### 2. Multiple scenes + transitions (title → select → level → next level)

```js
scene("title",  () => { /* fixed() menu, "Press Enter" -> go("select") */ });
scene("select", () => { /* world-map: one node per level; locked nodes disabled */ });
scene("game",   (data) => { /* existing scene; now reads data.levelId */ });

go("title");                               // boot the title first (main.js)
go("game", { levelId: 2, startX, startY });// seed via data payload (locked anti-leak)
onSceneLeave(() => { /* teardown — already used for save + fx sweep */ });
```

- `scene`, `go`, `onSceneLeave` — **confirmed** (already used in `scenes/game.js`).
- **Transitions:** Kaplay 3001 has no heavy built-in scene-transition system; do a simple **fade via a `fixed()` full-screen `rect` + the existing `tween`/`fx.js`** before `go(...)`. This reuses the self-cleaning-tween pattern — no library. ADHD-safe: keep fades short and non-strobing.
- **Anti-leak reminder (carried from v3.0):** any `onHide`/global listener registered in a scene MUST be cancelled in `onSceneLeave` (the `hideCtrl.cancel()` discipline in `game.js`). With multiple scenes now entering/leaving repeatedly, this is *more* important — verify every global controller is cancelled.

### 3. Parallax / layered backgrounds

```js
setLayers(["bg", "game", "ui"], "game");   // call ONCE per scene, before any add()
const bgFar  = add([sprite("bg-far"),  pos(0,0), layer("bg")]);
const bgNear = add([sprite("bg-near"), pos(0,0), layer("bg")]);
mountHud(...);                              // HUD objects use fixed() -> "ui" / screen-space

// Parallax scroll: in onUpdate, offset each bg layer by a fraction of the camera.
onUpdate(() => {
  const cam = getCamPos();
  bgFar.pos.x  = cam.x * 0.2;   // far layer moves slowly
  bgNear.pos.x = cam.x * 0.5;   // near layer moves faster
});
```

- `setLayers`, `layer`, `fixed`, `getCamPos` — **all confirmed** in bundle.
- **Integration note:** `setLayers` "should be called before any objects are made" — call it at the very top of each scene callback, before `buildLevel(...)`. The existing camera clamp in `camera.js` is unaffected (parallax bg are decorative, no colliders).

### 4. Level data — two viable no-build paths (both confirmed engine-supported)

- **`addLevel(map, opt)`** EXISTS in the bundle. Signature `addLevel(string[], { tileWidth, tileHeight, tiles: { "=": () => [comp...] } })`. ASCII symbol maps; each symbol maps to a function returning a component array.
- **Plain JS data modules + `buildLevel`** — the v3.0 shipped pattern (`src/level.js`).

See the recommendation + rationale below.

---

## Level-authoring format — RECOMMENDATION: JS data modules (extend the shipped `buildLevel`), NOT `addLevel`, NOT Tiled

**Recommendation:** Author each level as a plain exported JS object (`src/levels/01.js` … `src/levels/05.js`) consumed by a parameterized `buildLevel(level)` — exactly the shape `src/level.js` already ships, refactored to take the level as an argument and return handles for the scene to wire.

| Option | No-build? | Verdict | Why |
|--------|-----------|---------|-----|
| **JS data modules + `buildLevel(level)`** ✅ | Yes | **CHOSEN** | Already proven this milestone-line (`level.js` works). Supports the project's non-grid needs *natively*: merged-floor colliders (anti seam-stick, Pitfall 2), tightened spike `area({shape,offset})` hitboxes, off-grid coin placement, `LEVEL.checkpoints`. Pixel-precise `{x,y,w}` — no ASCII grid to fight. Levels are just `import`s; the scene seeds `go("game",{levelId})` and a level registry picks the data object. Zero new tech. |
| Kaplay `addLevel(map, opt)` | Yes | **Rejected for this project** | ASCII symbol grids are elegant for uniform tile games but fight three things v3.0 deliberately built: (1) it places ONE collider per tile symbol → re-introduces the exact floor-seam-stick problem the merged-floor collider was created to kill; (2) per-tile spike colliders can't carry the tightened `{shape,offset}` hitbox without extra per-symbol code; (3) off-grid/pixel-tuned coin & checkpoint placement doesn't map to a char grid. Adopting it would be a *rewrite* of the validated collision spine, not an addition. Keep it in the toolbox only if a future bonus level is genuinely uniform-tile. |
| Tiled (`.tmx`/`.json`) | **No — needs editor + runtime parser** | **Rejected** | Requires the Tiled editor + a JSON-loading/parsing layer at runtime (`fetch`/`loadJSON` + a custom interpreter) or a build step to transform maps. Adds an external authoring tool and a runtime parser the project doesn't have. Violates the minimal-surface / no-build intent for a 3–5 level scope. Overkill. |

**Concrete shape (extends, doesn't replace, the shipped module):**

```js
// src/levels/02.js  — pixel-precise data, same fields as the shipped LEVEL
export const LEVEL_02 = {
  id: 2,
  floors: [...], platforms: [...], coins: [...], spikes: [...],
  goal: {...}, checkpoints: [...],
  // v4.0 additions, all plain data the existing builder learns to emit:
  keys:    [{ x, y, id: "red" }],
  doors:   [{ x, y, w, h, requires: "red" }],    // locked door / key
  pickups: [{ x, y, kind: "answer" }],           // collect-the-answer
  gates:   [{ x, y, tier: "6-9" }],              // mid-level checkpoint gates
  enemies: [{ x, y, sprite: "enemy-imp" }],      // defeat-enemy-with-answer
  tableTier: "6-9",   // difficulty knob (brain is LOCKED; only selects WHICH tiers are eligible)
};

// src/levels/index.js — registry
export const LEVELS = { 1: LEVEL_01, 2: LEVEL_02, /* ... */ };
```

**Difficulty curve note:** harder *platforming* lives in the level data (gaps, spike density). Harder *tables* must NOT modify `math/brain.js` (the 6–9 weighted brain is LOCKED). Instead, pass a per-level **eligible-tier filter** into the existing `createBrain({...})` call so deeper levels restrict to 6–9 while early levels allow easier tables. This is a parameter at the call site in `game.js`, not a brain change.

---

## Installation

```bash
# Core: nothing. No npm, no build. The engine is already vendored:
#   lib/kaplay.mjs  (Kaplay 3001.0.19)

# v4.0 "install" = vendor static CC0 art files into assets/ (same as v3.0 Phase 09):
#   assets/player.png        (animated idle/run/jump sheet — replaces static)
#   assets/tiles/*.png       (extended tileset)
#   assets/bg/*.png          (parallax layers)
#   assets/enemy-*.png       (enemy sheets)
#   assets/LICENSES/*.txt    (per-asset CC0 proof — REQUIRED, established workflow)
# Then add a CREDITS.md row per new asset. No Dockerfile change (COPY assets/ already present).

# Dev only (unchanged): python3 -m http.server 8000   # sidesteps file:// module/asset block
```

---

## CC0 art sources (real, license-clear, offline-vendorable)

**Established workflow (carry forward verbatim from v3.0 Phase 09):** open each asset's OWN page, confirm `License(s): CC0` directly on the page (not from an aggregator listing), download the file, capture proof to `assets/LICENSES/<asset>.txt`, add a matching `CREDITS.md` row. **Per-asset verification caught a CC-BY-SA coin mislabeled in a CC0 listing last milestone — do this for every new file.**

**Vendoring is trivial and offline-safe:** every source below offers direct PNG downloads (OpenGameArt exposes direct file URLs — the reason v3.0 chose it over itch.io's JS-gated downloads). Commit the PNGs into `assets/`; nothing is fetched at runtime.

| Need | Lead source (verify per-asset before use) | License | Why it fits dark-grunge |
|------|-------------------------------------------|---------|-------------------------|
| **Tileset** (extend existing) | "6 Color Dungeon 16x16" — HorusKDI (already vendored) | CC0 (verified v3.0) | Already shipping; dark dungeon palette, no pink, reads on `#0a0a0a`. Extend from the same pack for cohesion. |
| **Animated player** (idle/run/jump) | OpenGameArt ["Fantasy Pixel Character"](https://opengameart.org/content/fantasy-pixel-character) (idle/walk/run/jump/fall/attack/hurt/death) · ["CC0 Walk Cycles"](https://opengameart.org/content/cc0-walk-cycles) | CC0 (verify on each page) | Dark fantasy pixel sprites; recolor/dim to match the dungeon palette if needed (pixel edits stay CC0). |
| **Parallax backgrounds** | OpenGameArt ["Parallax Backgrounds"](https://opengameart.org/content/parallax-backgrounds) (cave/dead-forest layers, transparent PNG) · ["CC0 Backgrounds"](https://opengameart.org/content/cc0-backgrounds) | CC0 (verify on each page) | Cave / dead-forest themes are inherently dark-grunge; layered transparent PNGs map 1:1 onto `setLayers` bg layers. |
| **Enemies** | OpenGameArt ["Enemies and characters (Pixel Art)"](https://opengameart.org/content/enemies-and-characters-pixel-art) · ["CC0 resources"](https://opengameart.org/content/cc0-resources) | CC0 (verify on each page) | Imps/skeletons/etc. for the 👺💀🐉 defeat-enemy mechanic, dark palette. |

> **Itch.io caveat (learned v3.0):** itch.io downloads are JS-gated and not cleanly fetchable headless; if a Kenney/itch pack is preferred for look, download it manually in a browser and vendor the files — don't rely on automated fetch. OpenGameArt remains the path of least resistance for verified-CC0 direct downloads.

---

## What NOT to Use (hard constraints — flagged for the roadmapper)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Any bundler** (Webpack/Vite/Rollup/Parcel/esbuild) | Introduces a build step — violates the locked no-build constraint; ES modules + vendored `.mjs` already work over HTTP | Ship `src/*.js` + `lib/kaplay.mjs` as-is; nginx serves them. |
| **Sprite-packer / atlas build tools** (TexturePacker, free-tex-packer, `loadSpriteAtlas` JSON pipelines) | A packer is a build/authoring step and atlas JSON is extra machinery; `loadSprite({sliceX,sliceY,anims})` slices a plain grid sheet at load time with no tooling | Plain evenly-gridded PNG sheets + `loadSprite` slicing (the coin already proves this). Re-grid irregular sheets manually once (as the v3.0 coin was), commit the result. |
| **`loadSpriteSheet`** | **Does not exist in Kaplay 3001** (`grep` of the vendored bundle returns nothing) — it's an old Kaboom-era name; calling it is a silent breakage | `loadSprite(name, src, { sliceX, sliceY, anims })`. |
| **Tiled + runtime map loader** | Adds an external editor and a runtime JSON parser the project doesn't need at 3–5 levels | Plain JS data modules + parameterized `buildLevel` (the shipped pattern). |
| **Kaplay `addLevel` for the main levels** | ASCII grids re-introduce per-tile colliders → undoes the merged-floor anti-seam-stick spine and the tightened spike hitbox | Keep the merged-collider `buildLevel`; pixel-precise data. |
| **Any new npm runtime dependency / CDN `<script>`** | Breaks zero-new-dep + offline + privacy constraints | Everything inlined/vendored under `src/` and `lib/`. |
| **Audio/SFX libraries** | Out of scope this milestone (AUDIO-01 deferred) — and Kaplay's `play()` audio is built-in anyway when it's time | Defer. When tackled later, use vendored Kaplay's built-in audio, not a new lib. |
| **Tweening / animation libraries** (anime.js, GSAP) | Kaplay's built-in `tween`/`easings` (already used in `fx.js`) covers scene fades and juice | Reuse `fx.js` self-cleaning tweens. |

---

## Stack Patterns by Variant

**If a level is genuinely uniform-grid (e.g. a simple bonus stage):**
- `addLevel` *is* available and acceptable for that one level.
- Because the per-tile-collider cost only matters where merged floors and tuned hitboxes matter; a uniform stage doesn't need them. Still wrap colliders so seam-stick stays mitigated.

**If the parallax bg needs to scroll vertically too:**
- Offset both `pos.x` and `pos.y` from `getCamPos()` in `onUpdate`, each with its own factor.
- Because the camera already does gentle Y follow (`CAM_Y_FACTOR`); match the bg factor to taste.

**If the player sheet is a single horizontal strip (no rows):**
- Omit `sliceY` (defaults to 1); use `sliceX` + `anims` only — identical to the shipped coin.
- Because not all CC0 character sheets are multi-row; the API handles both.

---

## Version Compatibility

| Component | Pinned to | Notes |
|-----------|-----------|-------|
| Kaplay engine | **3001.0.19** (vendored `lib/kaplay.mjs`) | All v4.0 APIs (`loadSprite` slice/anims, `play`/`animSpeed`/`onAnimEnd`, `scene`/`go`/`onSceneLeave`, `setLayers`/`layer`/`fixed`, `getCamPos`/`setCamPos`, `addLevel`) confirmed present at this exact version. **Do NOT upgrade for v4.0** — the `Rect`-class fail-loud guard and `setCamPos`-not-`camPos` calls are version-coupled; an upgrade is its own scoped task. |
| Save format | Bump version field | Add `levels` map to the JSON; `progress.js` should migrate old saves (missing `levels` → empty) so existing XP/level/history survives — the version field already exists for exactly this. |
| Browsers | Chrome/Firefox/Edge 85+, Safari 14+ | ES modules + the APIs above are universally supported; unchanged from v3.0. |

---

## Sources

- **Vendored engine** `lib/kaplay.mjs` (3001.0.19) — grep-confirmed presence of `loadSprite`/`sliceX`/`sliceY`, `animSpeed`/`onAnimEnd`/`pingpong`, `setLayers`/`layer`/`"fixed"`, `addLevel`, `loadSpriteAtlas`, `onLoad`, `setBackground`; grep-confirmed ABSENCE of `loadSpriteSheet`. (HIGH confidence — the actual code that ships)
- [kaplayjs.com — loadSprite](https://kaplayjs.com/doc/ctx/loadSprite/) — `LoadSpriteOpt {sliceX,sliceY,anims}` + `SpriteAnim {from,to,loop,speed,pingpong,frames}`. (HIGH)
- [kaplayjs.com — SpriteComp](https://kaplayjs.com/doc/SpriteComp/) — `play(anim,opts)`, `animSpeed`, `frame`, `onAnimStart`/`onAnimEnd`. (HIGH)
- [kaplayjs.com — addLevel](https://kaplayjs.com/doc/ctx/addLevel/) — `addLevel(string[], {tileWidth,tileHeight,tiles})`. (HIGH)
- [kaplayjs.com — setLayers](https://kaplayjs.com/doc/ctx/setLayers/) — `setLayers(names, default)`, `layer()`, `fixed()`. (HIGH)
- Existing code: `src/main.js`, `src/scenes/game.js`, `src/camera.js`, `src/level.js` — current loadSprite/scene/camera/level-data patterns this milestone extends. (HIGH)
- v3.0 `09-01-SUMMARY.md` — established CC0 provenance workflow + OpenGameArt-over-itch decision. (HIGH)
- [OpenGameArt — Fantasy Pixel Character](https://opengameart.org/content/fantasy-pixel-character), [CC0 Walk Cycles](https://opengameart.org/content/cc0-walk-cycles), [Parallax Backgrounds](https://opengameart.org/content/parallax-backgrounds), [CC0 Backgrounds](https://opengameart.org/content/cc0-backgrounds), [Enemies and characters (Pixel Art)](https://opengameart.org/content/enemies-and-characters-pixel-art) — candidate CC0 art (verify `License(s): CC0` per-asset before vendoring). (MEDIUM — listings real; per-asset license MUST be re-verified at download, per the v3.0 lesson)

---
*Stack research for: v4.0 Content & Challenge — Kaplay platformer additions (animated sprites, scenes, parallax, multi-level authoring)*
*Researched: 2026-06-28*
