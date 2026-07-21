# Phase 32: Terrain & Parallax Rendering - Pattern Map

**Mapped:** 2026-07-11
**Files analyzed:** 9 (5 modified, 2 new source, 1 modified script, 1 new script; level-01..08 counted as one pattern set)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/levels/build.js` (MODIFIED — autotile cap+fill renderer) | scene-builder / renderer | transform (geometry → entities) | `src/levels/build.js` itself (`pickTopFrame` floor-run loop, lines 90–130) + spike `spike-code/main.js` (lines 108–150, 179–202) | exact (self) + role-match (spike) |
| `src/parallax.js` (MODIFIED — theme→biome param rename/thread) | scene-builder / renderer | transform (bounds → tiled layers) | `src/parallax.js` itself (`makeParallaxLayers`/`layerName`, lines 45–61) | exact (self, near-zero-change) |
| `src/main.js` (MODIFIED — manifest-driven load loop) | config/boot | batch (asset loading) | `src/main.js` itself (existing `for (let n = 1; n <= 8; n++)` theme-N loop, lines 103–110) | exact (self) |
| `src/assets-manifest.js` (NEW) | config/data module | CRUD (read-only list) | `src/levels/level-01.js` (pure-data, no-engine-global module shape) + `src/main.js`'s existing `loadSprite`/`loadSound` call list (source of entries) | role-match |
| `src/levels/level-0N.js` (MODIFIED — add `biome` field, all 8) | model / data descriptor | CRUD (static data) | `src/levels/level-01.js` (`theme: "theme-1"` field, line 150) | exact |
| `src/config.js` (MODIFIED — add `CONFIG.TERRAIN` block) | config | CRUD (static constants) | `src/config.js` itself (`PARALLAX` block, lines 91–99) | exact (self) |
| `scripts/check-assets-manifest.mjs` (NEW) | test / gate script | batch (static existence check) | `scripts/check-progress.sh` (assertion-list + `fail()` idiom) and `scripts/validate-levels.mjs` (Node ESM gate importing `src/` modules directly, `process.exit(1)` convention) | role-match |
| `scripts/browser-boot.mjs` (MODIFIED — add screenshot/fps/object-budget checks) | test / integration script | event-driven (Playwright drive) | `scripts/browser-boot.mjs` itself (existing per-level loop, `errors.push({type,message})` idiom, lines 371–448) | exact (self) |
| `docs/LEVEL-DESIGN.md` §9 (READ ONLY — consumed, not authored) | docs | — | N/A (already written; Phase 32 is the consumer) | n/a |

## Pattern Assignments

### `src/levels/build.js` (scene-builder, transform)

**Analog 1 (self):** `src/levels/build.js` lines 90–130 — the exact loop this phase replaces.

**Current floor-run pattern to replace** (lines 90–113):
```js
for (const run of g.floors) {
  add([
    rect(run.w, CONFIG.FLOOR_THICKNESS),
    pos(run.x, FLOOR_Y),
    area(),
    body({ isStatic: true }),
    opacity(HIDDEN),
    "ground",
  ]);
  for (let tx = run.x; tx < run.x + run.w; tx += T) {
    add([sprite(groundSprite, { frame: pickTopFrame(tx, run.x, run.w) }), pos(tx, FLOOR_Y)]);
  }
}
```
**Rule:** the `rect()+body({isStatic:true})+opacity(HIDDEN)` collider block is BYTE-UNCHANGED (per CONTEXT's "collider-vs-sprite" decision and Pitfall 4/6) — only the inner visual-tile loop (`pickTopFrame`/`sprite(groundSprite,...)`) is replaced by the autotile cap+chunked-fill emission. Same untouched-collider rule applies to the `g.platforms` loop (lines 116–130).

**Analog 2 (spike):** `.planning/research/v6-scouting/spike-code/main.js` lines 108–150 (occupancy/frame-pick) and 179–202 (chunked tiled fill) — the proven recipe to port and simplify from 8 frames to 2.

**Occupancy + cap/fill emission (2-frame simplified, from RESEARCH.md Pattern 1 — already vetted against this repo's engine):**
```js
const T = CONFIG.TILE_SIZE; // 16
const CAP_FRAME = 0;
const FILL_FRAME = 1;
const FILL_CHUNK_COLS = CONFIG.TERRAIN.FILL_CHUNK_COLS; // <= 40, spike-proven ceiling

function renderRun(atlasName, runX, runY, runW, fillDepthPx) {
  for (let tx = runX; tx < runX + runW; tx += T) {
    add([sprite(atlasName, { frame: CAP_FRAME }), pos(tx, runY)]);
  }
  for (let cx = runX; cx < runX + runW; cx += FILL_CHUNK_COLS * T) {
    const chunkW = Math.min(FILL_CHUNK_COLS * T, runX + runW - cx);
    add([
      sprite(atlasName, { frame: FILL_FRAME, tiled: true, width: chunkW, height: fillDepthPx }),
      pos(cx, runY + T),
    ]);
  }
}
```

**Cemetery overlay compositing (per CONTEXT — cap drawn AS OVERLAY on top of fill, not a replacement):** for the Cemetery biome only, emit BOTH the fill-frame sprite at the cap row's cell AND the cap-frame sprite on top (higher z or later `add()` call = later draw order in Kaplay) rather than skipping the fill row under the cap. Castle renders identically to Swamp/Town (no special-case).

**Theme-aware sprite-name pattern to mirror** (build.js line 76, existing convention — becomes biome-aware the same way):
```js
const groundSprite = levelData.theme ? `ground-${levelData.theme}` : "ground";
```
becomes (new):
```js
const atlasSprite = `atlas-${levelData.biome}`; // biome is now a required field on every descriptor (all 8 set it)
```

**Error handling / guard pattern to mirror** (lines 52–56 — the module's existing fail-loud engine-global guard, same idiom to extend if the autotiler needs another global):
```js
if (typeof Rect === "undefined") {
  throw new Error(
    "build.js: Kaplay global `Rect` is missing — check kaplay({ global }) / engine version",
  );
}
```

---

### `src/parallax.js` (scene-builder, transform)

**Analog (self):** `src/parallax.js` lines 45–61 — near-zero structural change needed.

**Current theme-templating pattern (KEEP the exact shape, just source `biome` instead of `theme`):**
```js
export function makeParallaxLayers(bounds, theme) {
  ...
  const layerName = (base) => (theme ? `${base}-${theme}` : base);
  return [
    { name: layerName("bg-far"), instances: makeParallaxLayer(layerName("bg-far"), safeBounds, P.FAR_RATIO, P.FAR_Z, P.Y_ANCHOR - 120), ratio: P.FAR_RATIO },
    ...
  ];
}
```
**Change:** rename the parameter from `theme` to `biome` (or keep the parameter name generic and pass `level.biome` at the call site) — `makeParallaxLayer`, the ratio/z math, and `updateParallaxLayers` (lines 105–116) need ZERO changes. Per RESEARCH.md Pattern 2, this is the lowest-risk file in the phase.

**Call site to update** — `src/scenes/game.js` line 129:
```js
const parallaxLayers = makeParallaxLayers(bounds, level.theme);
```
becomes:
```js
const parallaxLayers = makeParallaxLayers(bounds, level.biome);
```

---

### `src/main.js` (config/boot, batch loading)

**Analog (self):** `src/main.js` lines 103–110 — the exact block being replaced/generalized.

**Current per-theme-N repeated block (DELETE per CONTEXT's "Rollout & Cleanup Scope"):**
```js
for (let n = 1; n <= 8; n++) {
  loadSprite(`bg-far-theme-${n}`, `../assets/parallax/far-theme-${n}.png`);
  loadSprite(`bg-mid-theme-${n}`, `../assets/parallax/mid-theme-${n}.png`);
  loadSprite(`bg-near-theme-${n}`, `../assets/parallax/near-theme-${n}.png`);
  loadSprite(`ground-theme-${n}`, `../assets/tiles/ground-theme-${n}.png`, {
    sliceX: CONFIG.GROUND_FRAMES,
  });
}
```

**Existing web-root path convention to preserve** (line 62, applies to every manifest-driven load too):
```js
loadSprite("ground", "../assets/tiles/ground.png", { sliceX: CONFIG.GROUND_FRAMES });
```
i.e. every manifest `path` value is `assets/...` (no leading `../`), and the loop prepends `../` — matching RESEARCH.md's Pattern 3 code example exactly.

**New manifest-driven loop (from RESEARCH.md Pattern 3, already vetted):**
```js
import { ASSETS_MANIFEST } from "./assets-manifest.js";
for (const a of ASSETS_MANIFEST) {
  const webPath = `../${a.path}`;
  if (a.kind === "sprite-sliced") loadSprite(a.key, webPath, { sliceX: 2, sliceY: 1 });
  else if (a.kind === "sound") loadSound(a.key, webPath);
  else loadSprite(a.key, webPath);
}
```
Note: sprites needing custom slice/anim options (player, coin) may need either a `kind` variant per asset type or to stay as their own manifest-driven-but-specially-handled entries — see Claude's Discretion in CONTEXT.md for the `kind` field shape.

---

### `src/assets-manifest.js` (NEW — config/data module)

**Analog:** `src/levels/level-01.js` (pure-data module shape, no engine globals, single named export) + the full inventory of existing `loadSprite`/`loadSound` calls in `src/main.js` (lines 62–132) as the enumeration source.

**Pure-data module shape to mirror** (level-01.js lines 17, 22-23 — the "no engine globals, one import, one named export" idiom):
```js
import { CONFIG } from "../config.js"; // only if needed; assets-manifest.js likely needs no import at all

export const ASSETS_MANIFEST = [
  { key: "atlas-swamp", path: "assets/tiles/atlas-swamp.png", kind: "sprite-sliced" },
  { key: "bg-far-swamp", path: "assets/parallax/far-swamp.png", kind: "sprite" },
  // ... one entry per biome x {atlas, bg-far, bg-mid, bg-near} = 16 entries
  // PLUS every pre-existing loadSprite/loadSound call currently in main.js:
  // ground(deleted)/spike/goal/player/coin/title-bg/logo-hero/logo-badge/door/
  // enemy-1/2/3, jump/land/correct/wrong/door/clear/pickup sfx, ambient music.
  // Full coverage is a LOCKED CONTEXT decision (Pitfall 5) — partial manifest
  // defeats the "kills the silent-404 class" goal.
];
```

---

### `src/levels/level-0N.js` ×8 (model/data descriptor, CRUD)

**Analog:** `src/levels/level-01.js` line 150 — the exact field being added alongside.

**Existing theme field (KEEP, per Open Question #1 — `theme` field left alone unless grep shows nothing else reads it):**
```js
theme: "theme-1", // VIS-03 theme assignment — calm moss green, level 1 of 8
```
**New additive field (add alongside, per locked level→biome mapping):**
```js
biome: "swamp", // Phase 32 — level 1 of 8, Castlevania arc calm->harsh (levels 1-2 swamp, 3-4 town, 5-6 cemetery, 7-8 castle)
```
**CRITICAL guard (Pitfall 6):** this field must be added OUTSIDE the `geometry: {...}` object, at the descriptor top level next to `mechanics`/`theme`/`parallax` (lines 148–152) — `git diff` on `geometry` must show zero changes.

---

### `src/config.js` (config, CRUD/static)

**Analog (self):** `src/config.js` lines 91–99 — the `PARALLAX` block, exact sibling-block shape to copy.

**Pattern to mirror (add a new `TERRAIN` block in the same "Visual tuning constants" section):**
```js
PARALLAX: {
  FAR_RATIO: 0.15, // far layer scroll ratio vs camera
  ...
  Y_ANCHOR: 320, // bottom edge anchor near the floor
},
```
becomes (new, alongside):
```js
TERRAIN: {
  FILL_CHUNK_COLS: 40, // count — max columns per {tiled:true} fill chunk (spike-proven ceiling; oversized chunks silently render nothing)
  OBJECT_BUDGET: 650, // count — hard-fail ceiling for browser-boot's per-level terrain object-count assertion (spike measured ~410 safe @ 5,600-tile stress; real levels land ~400 max per Metadata calc — headroom set above that)
  FPS_FLOOR: 45, // fps — hard-fail floor for browser-boot's debug.fps() sample (spike clean-run was 58fps; comfortably below to absorb headless-vs-real-GPU variance)
},
```

---

### `scripts/check-assets-manifest.mjs` (NEW — test/gate script)

**Analog 1:** `scripts/validate-levels.mjs` lines 1–30 — Node ESM gate script header/import conventions (imports directly from `src/`, no build step, `process.exit()`-based).

**Analog 2:** `scripts/check-progress.sh` — the `fail()`-per-assertion idiom (bash flavor; check-assets-manifest.mjs is the Node/`.mjs` equivalent per CONTEXT's explicit format decision).

**Pattern to follow (from RESEARCH.md Pattern 3's own code example, already vetted):**
```js
#!/usr/bin/env node
import { existsSync } from "fs";
import { ASSETS_MANIFEST } from "../src/assets-manifest.js";

let failures = 0;
for (const a of ASSETS_MANIFEST) {
  if (!existsSync(a.path)) {
    console.error(`check-assets-manifest: MISSING ${a.key} -> ${a.path}`);
    failures++;
  }
}
if (failures === 0) console.log("check-assets-manifest: PASS");
process.exit(failures > 0 ? 1 : 0);
```
Note: `a.path` is repo-root-relative (`assets/tiles/atlas-swamp.png`), so run `existsSync` from the script's resolved repo root the same way `validate-levels.mjs` imports `src/` directly (both run via `node scripts/<name>.mjs` from repo root per this project's convention — no `path.resolve` gymnastics needed unless invoked from a different cwd).

---

### `scripts/browser-boot.mjs` (MODIFIED — test/integration script)

**Analog (self):** `scripts/browser-boot.mjs` — the existing per-level loop (lines 371–448) and its `errors.push({type,message})` non-throwing accumulation idiom, plus `driveToXPlanned` (imported line 12) reused per CONTEXT/Pitfall 7's explicit instruction.

**Existing per-level loop shape to extend** (lines 371–448 — add screenshot/fps/object-budget calls inside this loop, not a new loop):
```js
for (let i = 0; i < levels.length; i++) {
  ...
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500); // let game scene build the level
  await assertAudioElementCount(page, errors, `${LEVEL_ORDER[i]}: level entry`);
  // <-- NEW: screenshot non-blank check here -->
  // <-- NEW: debug.fps() sample + CONFIG.TERRAIN.FPS_FLOOR assertion here -->
  // <-- NEW: page.evaluate() terrain object-count query + CONFIG.TERRAIN.OBJECT_BUDGET assertion here -->
  const level = getLevel(LEVEL_ORDER[i]);
  const drivableEncounters = deriveEncounters(level.geometry).filter((e) => e.tag !== "secret-alcove");
  for (const encounter of drivableEncounters) {
    const { triggered } = await driveToXPlanned(page, encounter.x, level.geometry);
    // <-- NEW: after reaching goal.x via driveToXPlanned(page, level.geometry.goal.x, level.geometry),
    //          take the "far-end non-blank" screenshot per CONTEXT/Pitfall 7 -->
    ...
  }
}
```

**Error-accumulation idiom to reuse exactly** (lines 95–103, `assertAudioElementCount`'s shape — model new assertions on this):
```js
async function assertAudioElementCount(page, errors, stopLabel) {
  const count = await page.evaluate(() => document.querySelectorAll("audio").length);
  if (count > 1) {
    errors.push({
      type: "audio",
      message: `${stopLabel}: expected at most 1 <audio> element, found ${count}`,
    });
  }
}
```
New helpers (`assertFpsFloor`, `assertObjectBudget`, `assertScreenshotNonBlank`) should follow this exact `(page, errors, stopLabel, ...)` signature and `errors.push({type, message})` shape — never throw, so one failed level doesn't abort the whole drive (matches the file's own established convention, lines 262–272's `runSaveResumeAcrossReloadProof` catch-and-push idiom too).

**FPS sampling source** (per RESEARCH.md Pitfall 2 warning sign — `debug.fps()` is already exposed as a Kaplay global and already used by the spike):
```js
const fps = await page.evaluate(() => debug.fps());
```

**Object-count query pattern** (new — tag terrain entities, e.g. `"ground-fill"` per the spike's own tag convention at spike-code/main.js line 143/196, then count):
```js
const objectCount = await page.evaluate(() => get("ground").length + get("ground-fill").length);
```

**Hard-fail convention** (matches this script's own existing final gate, lines 464–480):
```js
if (errors.length > 0) {
  console.error("Browser boot encountered errors:");
  for (const e of errors) console.error(JSON.stringify(e));
  failed = true;
} else {
  console.log("Browser boot: PASS — ...");
}
...
process.exit(failed ? 1 : 0);
```

---

## Shared Patterns

### a727c13 engine-global safety (all build.js/parallax.js changes)
**Source:** `src/levels/build.js` lines 44–56 (the fail-loud `typeof Rect === "undefined"` guard) and `src/levels/level-01.js`/`src/levels/index.js`'s complete absence of engine globals at module top level.
**Apply to:** `src/levels/build.js` (autotile helper functions must live INSIDE `buildLevel`'s body, not at module top level), `src/assets-manifest.js` (must stay 100% engine-global-free — it's imported by both a Node script and the browser, so any `add`/`sprite`/`kaplay` reference would break the Node import path entirely, not just violate convention).
```js
if (typeof Rect === "undefined") {
  throw new Error("build.js: Kaplay global `Rect` is missing — check kaplay({ global }) / engine version");
}
```

### No-magic-numbers / CONFIG-only tunables
**Source:** `src/config.js`'s entire structure — every module reads tunables from `CONFIG.*`, never inline literals.
**Apply to:** `src/levels/build.js` (chunk size, cap/fill frame indices as named consts derived from `CONFIG.TERRAIN`), `scripts/browser-boot.mjs` (FPS floor, object budget both from `CONFIG.TERRAIN`, imported via `../src/config.js` the same way `getLevel`/`LEVEL_ORDER` are already imported from `../src/levels/index.js`).

### Debug overlay convention (`?debug=1`)
**Source:** `src/levels/build.js` lines 58–69 (`DEBUG`/`HIDDEN` opacity pattern, already used for merged colliders/blockers/secret alcoves).
**Apply to:** No new debug-overlay code needed for terrain (colliders are unchanged), but developers verifying autotile-vs-collider alignment during manual testing should reuse the existing `?debug=1` flag as-is — no new code, just a documented verification step.

### Gate-script `fail()`/`process.exit(1)` idiom
**Source:** `scripts/check-progress.sh` (`fail()` helper, lines 26–29) and `scripts/validate-levels.mjs` (Node ESM equivalent, `process.exit(1)` on any HARD-FAIL).
**Apply to:** `scripts/check-assets-manifest.mjs` — same fail-fast-with-clear-message philosophy, adapted to `.mjs`/`console.error`+`process.exit`.

## No Analog Found

None — every file this phase creates or modifies has at least a role-match analog already in the codebase (the autotiler recipe itself is spike-proven in this exact repo, not merely a role-match).

## Metadata

**Analog search scope:** `src/`, `scripts/`, `.planning/research/v6-scouting/spike-code/`, `.planning/phases/32-terrain-parallax-rendering/`
**Files scanned:** `src/levels/build.js`, `src/parallax.js`, `src/main.js`, `src/config.js`, `src/levels/level-01.js`, `src/scenes/game.js`, `scripts/browser-boot.mjs`, `scripts/check-progress.sh`, `scripts/validate-levels.mjs`, `.planning/research/v6-scouting/spike-code/main.js`
**Pattern extraction date:** 2026-07-11
