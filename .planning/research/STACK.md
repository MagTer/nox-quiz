# Stack Research

**Domain:** No-build, offline, browser 2D platformer (Kaplay) for a 12-year-old; math gate at end of stage
**Researched:** 2026-06-22
**Confidence:** HIGH (versions verified directly against the npm registry + jsDelivr file listing + official kaplayjs.com docs)

> Scope note: The engine (Kaplay), art source (Kenney/itch.io CC0), no-build/offline
> approach, and ported math brain are **already decided**. This file documents *how to
> execute those decisions well* with concrete versions, the exact vendoring/loading
> approach, a minimal file layout, and the asset-loading APIs. It does not re-litigate
> engine choice or question-selection algorithms.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Kaplay** | **3001.0.19** (npm `latest`) | 2D game engine: scenes, sprites, gravity/`body()` physics, AABB collision, keyboard input, game loop | Kaboom.js successor (npm package renamed `kaboom` → `kaplay`). Gives real platformer physics (gravity, jump, grounded checks, platform collision) without hand-writing the bug-prone parts. Ships a single self-contained JS file with **zero runtime dependencies** — drops straight into a no-build offline project. MIT licensed. |
| **Vanilla JavaScript** | ES2020+ (ES modules) | Game wiring, level definition, and the ported "math brain" (weighted 6–9 question selection) | Already the project's language; the v1/v2 `QuestionSelector` ports in unchanged. ES modules let you split `main.js` / `math.js` / `level.js` cleanly without a bundler. |
| **HTML5 + CSS3** | Living Standard | `index.html` host page + `<canvas>` Kaplay mounts into; dark/grunge page chrome around the canvas | Kaplay renders into a canvas; surrounding page styling (dark background, framing) is plain CSS, consistent with the existing aesthetic. |
| **Python `http.server`** (or `npx serve`) | Python 3.x stdlib | One-line local static server for development/play | **Required** — browsers block ES-module loading and image `fetch` over `file://` (CORS / module security). `python3 -m http.server` is already sanctioned in PROJECT.md and ships with Python; no install. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **None** | — | — | **Default.** Kaplay covers physics, sprites, input, audio, and the loop. Resist adding anything else. |
| Kenney CC0 art packs | n/a (asset data, not code) | Pixel-art tiles/sprites for player, platforms, goal | Always — this is the art source. Treated as data files in `assets/`, not a dependency. See "Asset Pipeline" below. |
| Tiled (map editor) | 1.10+ | *Optional* visual level editing exporting JSON | Only if hand-coding the single level's geometry becomes painful. For one level, an in-code array of platform rects is simpler and avoids a JSON loader. **Defer.** |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Text editor (VS Code) | Authoring | No build config needed. |
| `python3 -m http.server 8000` | Serve the project for local play | Run from project root, open `http://localhost:8000/`. This is the canonical run command. |
| Browser DevTools (F12) | Debug Kaplay scenes, inspect console/network, confirm assets load | Kaplay logs asset-load failures to the console — first place to look if a sprite is invisible. |
| Git | Version control | Commit the vendored `kaplay.js` and `assets/` so the project stays self-contained and reproducible offline. |

## Installation

**No `npm install` is needed to run the game.** You vendor one file. Two equivalent ways to obtain it:

```bash
# Option A — download the vendored engine file directly (no Node required)
mkdir -p vendor
curl -L -o vendor/kaplay.js \
  https://cdn.jsdelivr.net/npm/kaplay@3001.0.19/dist/kaplay.js     # global build
# (or, for the ESM approach:)
curl -L -o vendor/kaplay.mjs \
  https://cdn.jsdelivr.net/npm/kaplay@3001.0.19/dist/kaplay.mjs    # ES module build

# Option B — pull via npm once, then copy the dist file out and discard node_modules
npm install kaplay@3001.0.19
cp node_modules/kaplay/dist/kaplay.mjs vendor/kaplay.mjs
```

> **Pin the version.** Commit the copied file. Do **not** point a `<script>` at a live CDN
> URL for the shipped game — that breaks the offline requirement. CDN is only for the
> initial download.

### Loading approach — pick ONE

**Recommended: ES module import (vendored `.mjs`).** Cleaner multi-file structure, matches official "recommended for CDN" guidance, and you'll already need a local server (see below), so the module-loading constraint costs nothing extra.

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><link rel="stylesheet" href="style.css" /></head>
  <body>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```
```js
// main.js
import kaplay from "./vendor/kaplay.mjs";
const k = kaplay({ background: [10, 10, 10] }); // dark canvas
// ... loadSprite(...) / scenes / etc.
```

**Alternative: global `<script>` tag (vendored `kaplay.js`).** Simpler mental model (one global `kaplay()`), no `type="module"`. Use if you prefer a single `main.js` with no `import`:

```html
<script src="./vendor/kaplay.js"></script>  <!-- exposes global kaplay() -->
<script src="./main.js"></script>
```

### file:// vs local server — stated explicitly

| Approach | Opens via `file://` (double-click)? | Why |
|----------|-------------------------------------|-----|
| ESM import (`.mjs`) | No | Browsers refuse `import` over `file://` (module CORS). **Server required.** |
| Global `<script>` + image assets | Unreliable | The script tag loads, but Kaplay's image/`loadSprite` fetches and canvas texture reads are blocked or tainted under `file://` on most browsers. |
| **Either, served over HTTP** | Yes | `python3 -m http.server 8000` then `http://localhost:8000/` makes both modules and asset fetches work. |

**Conclusion:** A one-line static server is required regardless of loading style. This is already
accepted in PROJECT.md. The "double-click the HTML file" experience from v1/v2 does **not**
survive the pivot — provide a tiny `run.bat` / documented command instead.

### Minimal project layout

```
math-lab/
├─ index.html          # host page, mounts canvas, loads main.js
├─ style.css           # dark/grunge page chrome around the canvas
├─ main.js             # kaplay() init, scenes, game loop wiring
├─ math.js             # PORTED v1/v2 QuestionSelector (6–9 weighting) — unchanged logic
├─ level.js            # level geometry (platform rects, spawn, goal) + math-gate trigger
├─ vendor/
│  └─ kaplay.mjs       # pinned, vendored engine (3001.0.19) — committed to git
└─ assets/
   ├─ tiles.png        # Kenney packed spritesheet (e.g. 18×18 grid)
   └─ player.png       # player spritesheet (walk/idle/jump frames)
```

## Asset Pipeline (Kenney / itch.io CC0)

**Loading API (Kaplay):**

```js
// Grid spritesheet → named frames + animations
loadSprite("player", "assets/player.png", {
  sliceX: 9, sliceY: 3,                 // cut the sheet into a 9×3 frame grid
  anims: {
    idle: { from: 0, to: 3, loop: true, speed: 6 },
    run:  { from: 9, to: 16, loop: true, speed: 12 },
    jump: 17,
  },
});

// Many named sub-sprites packed in one image (a "tilemap")
loadSpriteAtlas("assets/tiles.png", {
  "grass":   { x: 0,  y: 0,  width: 18, height: 18 },
  "dirt":    { x: 18, y: 0,  width: 18, height: 18 },
  "flag":    { x: 0,  y: 18, width: 18, height: 18, sliceX: 2, anims: { wave: { from: 0, to: 1, loop: true } } },
});

// then in a scene:
add([ sprite("player"), pos(64, 0), area(), body() ]).play("idle");
```

- `loadSpriteAtlas(src, data)` takes an inline JS object **or** a URL to an external JSON
  atlas — for one level, inline data avoids an extra fetch.
- `sliceX`/`sliceY` divide a region into a frame grid (frame 0 = top-left, indexed across rows).
- `anims` map names to a frame range `{from, to, loop, speed}` or a single frame index.

**Kenney pack conventions (CC0):**
- Packs ship **both** a combined PNG spritesheet (e.g. `tilemap_packed.png`) **and** individual
  PNG tiles. For Kaplay, the packed sheet + `loadSpriteAtlas`/`sliceX` is most efficient.
- "Pixel Platformer" uses **18×18** tiles; other packs use 16/32/64 — confirm the grid before
  setting `sliceX`/`sliceY` (mismatched grid = sliced-wrong sprites).
- **CC0 = public domain.** No attribution required, commercial use allowed, and you may
  **recolor/darken** freely to hit the dark-grunge palette (no pink). A `CREDITS.md` thank-you
  is courteous but not legally required.

**Licensing checklist for any itch.io pack you add:**
1. Confirm the license literally says **CC0** (or "public domain"). Many itch packs are
   "free" but **not** CC0 (e.g. CC-BY needs attribution, or "no redistribution" forbids
   committing the files). Reject anything ambiguous.
2. Save the license text / pack URL in `assets/SOURCES.md` so provenance survives.
3. Prefer **kenney.nl** (and its `kenney-assets.itch.io` mirror) as the default — uniformly
   CC0, consistent grid sizes, large coherent sets.

## Platformer Physics Conventions (Kaplay)

| Need | Kaplay API |
|------|-----------|
| Gravity | `setGravity(1600)` (global, px/s²) |
| Player body | `add([ sprite("player"), pos(), area(), body() ])` |
| Static platform | `add([ rect(w,h) /*or sprite*/, pos(), area(), body({ isStatic: true }) ])` |
| Jump (only when grounded) | `onKeyPress("space", () => { if (player.isGrounded()) player.jump(900); })` |
| Run | `onKeyDown("left", () => player.move(-SPEED, 0))` / `"right"` |
| Goal trigger | `player.onCollide("flag", () => startMathGate())` |

The three components `pos() + area() + body()` are the minimum for a controllable character.
Platforms are the same minus movement, plus `body({ isStatic: true })`.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Kaplay 3001.0.19 (`latest`) | Kaplay `next` = 4000.0.0-alpha | Only for bleeding-edge features; alpha = API churn + bugs. **Avoid** for a shippable kid's game. |
| Kaplay 3001.0.19 | Kaplay 3001.0.2 (`r3001` tag) | If you hit a regression in .19; otherwise take the latest patch. |
| Kaplay (renamed) | Original `kaboom` package | Don't — `kaboom` is the unmaintained predecessor; Kaplay is the maintained fork/successor. |
| Vendored `.mjs` + ESM | Vendored `kaplay.js` global script | Use the global build if you want zero `import` statements / a single script file. Functionally equivalent here. |
| In-code level array | Tiled + JSON map | Use Tiled only once you have several levels; overkill for v3.0's single level. |
| `python3 -m http.server` | `npx serve` / VS Code Live Server | Any static server works; use what's already installed. Live Server adds auto-reload during dev. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Bundlers (Vite, webpack, esbuild, Parcel) | Adds a build step + Node toolchain; breaks the "no build, vendored file" constraint | Vendor `kaplay.js`/`kaplay.mjs` directly; serve statically |
| `npx create-kaplay` scaffold | Generates a Vite project (build step, dev server on 5173) — contradicts no-build | Hand-roll the minimal layout above |
| Live CDN `<script src="https://...">` in the shipped game | Breaks offline requirement; fails with no internet | Download once, commit the vendored file, reference it locally |
| `dist/kaplay.min.js` URL | **Does not exist** in the package — jsDelivr "guesses" it and 404s. Real files are `kaplay.js`, `kaplay.mjs`, `kaplay.cjs` | Use `dist/kaplay.js` (global) or `dist/kaplay.mjs` (ESM) |
| React/Vue/Svelte | Framework + VDOM is pure overhead for a canvas game loop | Kaplay owns the loop; plain JS around it |
| Opening the game by double-clicking `index.html` (`file://`) | ESM imports and asset fetches are blocked by browser security | Always launch via the local HTTP server |
| Non-CC0 "free" itch.io packs without checking | CC-BY/other licenses impose attribution or redistribution limits — risky for a committed-to-git project | Verify CC0 explicitly; default to kenney.nl |
| Anime.js / external animation libs | Kaplay has sprite anims + tween built in | `loadSprite` `anims` + Kaplay `tween()` |

## Stack Patterns by Variant

**If you want the cleanest multi-file structure:**
- Use the vendored **`.mjs`** + `<script type="module">` + `import`.
- Because it matches Kaplay's recommended path and you already need a server, so module
  loading costs nothing.

**If you want a single dumb `main.js` with no imports:**
- Use the vendored **`kaplay.js`** global build + two plain `<script>` tags.
- Because the global `kaplay()` function needs no module machinery.

**If level geometry grows beyond one screen / one level (later milestone):**
- Introduce Tiled + `loadSpriteAtlas(src, jsonUrl)` for external map data.
- Because hand-maintaining large coordinate arrays in `level.js` stops scaling. **Not v3.0.**

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `kaplay@3001.0.19` | Modern evergreen browsers (Chrome/Firefox/Safari/Edge 2022+) | Targets WebGL canvas + ES2020; the Windows-laptop target is fine. |
| `kaplay@3001.x` global `dist/kaplay.js` | `<script>` tag, global `kaplay()` | Self-contained IIFE; no other scripts required. |
| `kaplay@3001.x` `dist/kaplay.mjs` | `import` over **HTTP(S)** only | Will not load over `file://`. |
| Kenney CC0 PNG sheets | `loadSprite`/`loadSpriteAtlas` | Match `sliceX`/`sliceY` to the pack's tile grid (Pixel Platformer = 18×18). |
| `kaplay@3001` vs `kaplay@4000-alpha` | **Not** drop-in compatible | 4000 is a new major with API changes; stay on 3001. |

## Sources

- npm registry `registry.npmjs.org/kaplay` — verified `latest` = **3001.0.19**, dist-tags `r3001`=3001.0.2 / `next`=4000.0.0-alpha, MIT license, exports map (HIGH, directly queried 2026-06-22).
- jsDelivr `data.jsdelivr.com/.../kaplay@3001.0.19` — verified actual dist files: `kaplay.js`, `kaplay.mjs`, `kaplay.cjs` (no `.min.js`); inspected `kaplay.js` header confirming `var kaplay=(()=>...)` global IIFE build (HIGH, directly queried).
- [kaplayjs.com/docs/guides/install](https://kaplayjs.com/docs/guides/install/) — official install methods: global script tag, ESM CDN import, npm, "zero bundlers needs a local HTTP server" (HIGH).
- [kaplayjs.com loadSpriteAtlas / body docs](https://kaplayjs.com/) — `loadSprite`/`loadSpriteAtlas` signatures, `sliceX`/`sliceY`/`anims`; `pos()+area()+body()`, `setGravity`, `jump()`, `isGrounded()`, `onGround` (HIGH).
- [kenney.nl/assets/pixel-platformer](https://kenney.nl/assets/pixel-platformer) + [Platformer Pack Redux](https://kenney.nl/assets/platformer-pack-redux) — CC0 license, 18×18 tiles, packed sheet + individual tiles (HIGH).
- [jsDelivr kaplay package page](https://www.jsdelivr.com/package/npm/kaplay) and [npm kaplay](https://www.npmjs.com/package/kaplay) — corroborating package/version (MEDIUM/web).

---
*Stack research for: no-build offline browser 2D platformer (Kaplay) with CC0 pixel art*
*Researched: 2026-06-22*
