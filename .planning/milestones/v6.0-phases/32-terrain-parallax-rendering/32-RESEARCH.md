# Phase 32: Terrain & Parallax Rendering - Research

**Researched:** 2026-07-11
**Domain:** Kaplay 3001 sprite/tile rendering (autotile + chunked fill), camera-driven parallax, data-driven asset loading, Playwright perf/screenshot gating
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Level → Biome Mapping (established fact, not re-litigated)**
- Locked at v6.0 kickoff research (`ASSET-SCOUTING.md`, "Castlevania arc, calm → harsh"): levels 1–2 Swamp, 3–4 Town, 5–6 Cemetery, 7–8 Castle
- Phase 32 wires this mapping across all 8 levels now — the mapping is already fixed for all 8 and Phase 35 ("Biome Re-dress & Props") is scoped to the props layer and any re-dress corrections (ART-06/07), not base terrain — staging a subset now would mean redoing the terrain/parallax wiring twice

**Biome Terrain Rendering**
- The real baked atlas (`assets/tiles/atlas-{biome}.png`) has only 2 frames (cap, fill) per biome — not the spike demo's 8 (left/mid/right cap variants). Simplify the autotiler to this reality: one cap frame repeats across every run's top row, chunked `{tiled:true}` fill beneath (≤40 cols/chunk, per SPIKE-FINDINGS.md). No dedicated corner/single-tile variant since the atlas doesn't have one.
- Cemetery's cap frame doesn't reach the tile's bottom edge (documented anomaly, `docs/LEVEL-DESIGN.md` §9) — composite it as a decorative overlay drawn on top of the fill frame, not directly against the solid-ground line, per §9's own suggested fix.
- Castle's cap trim is bottom-anchored/inverted (documented anomaly, same §9) — render as-is; it reads as a plinth/baseboard, purely cosmetic, no special-casing needed.
- Underground fill depth: floor runs fill down to the camera's lower clamp bound (never a visible gap when panning); thin platforms (floating, not ground) get a shallow 1–2 tile fill, not a deep mass.
- Collider-vs-sprite: the decorative lip (top or bottom, per biome) is a rendering offset only, never a physics offset — colliders stay exactly at `FLOOR_Y`/platform `y`, unaffected by cap-frame appearance (per §9's explicit warning).

**Assets Manifest**
- Format: a plain JS module (e.g. `src/assets-manifest.js`) exporting a `{key, path, kind}` list — no build step, importable by both a Node gate script and browser `main.js`.
- Gate scope: for every manifest entry, assert the file exists on disk at its declared path. New single-purpose `scripts/check-assets-manifest.mjs`, added to CLAUDE.md's verification-gate list (matches the project's one-script-per-concern convention: check-gate/check-safety/check-import-safety/check-progress).
- `main.js` refactor: the biome/parallax/terrain loads (currently an 8×-repeated per-theme-N block) loop over the manifest instead of hand-written `loadSprite` calls. Door/enemy/player/audio `loadSprite`/`loadSound` calls stay hand-written — out of this phase's scope (Phase 33 territory).
- Coverage: the manifest covers the full asset surface `main.js` already loads (not just the new biome files) — a partial manifest defeats the "kills the silent-404 class" goal.

**Rollout & Cleanup Scope**
- Delete the old per-level tinted `theme-N` ground/parallax assets (`ground-theme-N`, `bg-*-theme-N`) once biome art replaces them across all 8 levels — matches the "no unused pack content" spirit and the manifest/geometry-frozen goals. Git history preserves them if ever needed; no on-disk fallback kept.
- The new FPS/object-count-budget check (added to `browser-boot.mjs` per the ROADMAP's own wording) is a hard fail (non-zero exit) — matches `validate-levels.mjs`'s existing convention that silent perf regressions are exactly the failure class these gates exist to catch.

### Claude's Discretion
- Exact chunk-size tuning within the ≤40-column spike-proven ceiling, and the exact object-count budget threshold (informed by the spike's measured ~410-object safe case) are implementation parameters for planning/execution, not user-facing grey areas — set in `src/config.js` per the project's "no magic numbers in logic modules" convention.
- Whether the manifest's `kind` field distinguishes sprite vs sound vs future asset types, and the exact internal shape of the autotiler's occupancy-set/frame-picking helper functions, are implementation details left to the planner/executor, informed by `SPIKE-FINDINGS.md`'s already-proven recipe (`spike-code/main.js`).

### Deferred Ideas (OUT OF SCOPE)
- Re-deriving true left/mid/right cap-tile variants (closer visual polish than the simplified 2-frame model) — deferred indefinitely unless a future human sign-off flags the simplified cap tiling as visually insufficient.
- Re-cropping Cemetery's cap frame to reach the tile's bottom edge, or re-deriving a top-anchored Castle cap crop — both explicitly deferred per §9's own "flagged, not averaged away" language; Phase 32 works around the anomalies rather than re-baking art (re-baking is Phase-31-scope tooling, not reopened here).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ART-02 | Filled terrain — solid autotiled ground mass (surface + underground fill + edge/corner tiles) replacing the floating 16px strip, using the spike-proven chunked `{tiled:true}` rendering recipe; colliders untouched | Architecture Patterns (autotile cap+fill), Code Examples (2-frame adaptation of `spike-code/main.js`), Common Pitfalls (batch-limit silent-blank, perf cliff, collider/sprite desync), Sources (SPIKE-FINDINGS.md Spike B, LEVEL-DESIGN.md §9) |
| ART-03 | Real per-biome multi-layer parallax backgrounds (sky + 2–3 detail layers) replacing the flat triangle silhouettes | Architecture Patterns (biome threading through `parallax.js`/`build.js`), Standard Stack (existing `makeParallaxLayers`/`updateParallaxLayers` reuse), Code Examples (biome-name templating) |
</phase_requirements>

## Summary

This phase has almost no external unknowns — the rendering recipe (autotile cap row + chunked `{tiled:true}` fill) is already spike-proven in this exact repo, against a byte-copy of the pinned vendored Kaplay 3001.0.19, and is documented in `SPIKE-FINDINGS.md` with measured FPS/object-count numbers. The work is 100% a port-and-adapt job: take the spike's 8-frame occupancy-set autotiler and simplify it to the real 2-frame atlas (cap, fill) that Phase 31 actually baked, thread the already-fixed level→biome mapping through the already-working 3-layer parallax system (which only needs a new sprite-name source, not new logic), and add a manifest + gate script following the project's existing one-script-per-concern convention.

The one genuine new-build surface is the manifest (`src/assets-manifest.js` + `scripts/check-assets-manifest.mjs`) and the browser-boot extensions (per-level screenshot/FPS/far-end-non-blank/object-count-budget checks) — both are net-new files with no direct precedent in the codebase, but both closely mirror existing patterns (`screenshot-phase26.mjs`'s per-level screenshot loop, `validate-levels.mjs`'s HARD-FAIL/PASS reporting idiom, `deriveEncounters`/`driveToXPlanned`'s reusable driving helpers).

The real per-level object-count math (computed below from the shipped level-04 geometry, the widest level) lands comfortably inside the spike's proven-safe ~410-object case — because the spike's stress test filled 16 rows deep (a worst-case excavated-pit simulation), while real levels only need ~3 rows of fill (40px, floor-to-camera-bottom-clamp). This means the phase is LOW execution risk on performance; the main risks are (1) the two documented per-biome cap-frame anomalies (Cemetery/Castle) being rendered wrong, (2) the tiled-fill silent-blank trap (one oversized `{tiled:true}` object renders nothing, no error), and (3) collider/sprite desync if a decorative lip offset leaks into a `body()`/`area()` position.

**Primary recommendation:** Port `spike-code/main.js`'s `buildOccupancy`/`pickFrame`/chunked-fill idiom into `src/levels/build.js` almost verbatim, but collapse `pickFrame`'s 8-way frame selection to a 2-way one (frame 0 = cap for every "no tile above" position, frame 1 = fill for everything else, with Cemetery's cap composited as an overlay on top of fill rather than a replacement). Thread `level.biome` (a new descriptor field, additive alongside the existing `level.theme`) through `parallax.js`'s existing `layerName()` template with zero structural change to `makeParallaxLayers`/`updateParallaxLayers`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Autotile ground/fill rendering | Client (Kaplay scene build) | — | Pure client-side sprite composition in `src/levels/build.js`; no server, static hosting only |
| Parallax background layers | Client (Kaplay scene build) | — | Camera-driven visual layers, already client-only in `src/parallax.js` |
| Biome→level mapping | Client (level descriptor data) | — | Static data field on each `src/levels/level-0N.js` descriptor, consumed at build time |
| Assets manifest + existence gate | Build-time / CI tooling (Node script) | Client (loop consumed by `main.js`) | The manifest is a plain data module shared by a Node gate script (dev-time safety net) and the browser loader (runtime source of truth) — no server round-trip either way |
| Perf/screenshot/object-budget checks | Build-time / CI tooling (Playwright script) | — | `scripts/browser-boot.mjs` runs headless outside the shipped game; asserts against the real rendered client |
| Static asset hosting | CDN / Static (nginx via Dokploy) | — | Baked PNGs served as static files; no transformation at request time |

## Standard Stack

### Core
No new libraries. This phase is a pure port-and-adapt of Kaplay 3001.0.19 (already vendored, pinned, `lib/kaplay.mjs`) primitives already used elsewhere in the codebase:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay | 3001.0.19 (vendored, pinned) | `loadSprite(..., {sliceX, sliceY})`, `sprite(name, {frame})`, `sprite(name, {tiled:true, width, height})`, `add()`, `pos()`, `z()` | Already the project's only engine; `[VERIFIED: local spike run against byte-copy of lib/kaplay.mjs]` — the exact `{tiled:true}` chunking recipe this phase needs was measured live in this repo, not read from docs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Playwright | (already resolved dynamically via `scripts/browser-boot.mjs`'s `resolvePlaywright()`) | headless screenshot/FPS/object-count assertions | Extending the existing `browser-boot.mjs` script per CONTEXT's explicit "extend, don't duplicate" instruction for this one script |
| Pillow | (already installed, used by `scripts/build-art-assets.py`) | NOT needed this phase | Baking is Phase-31-scope; Phase 32 only consumes the already-baked atlases/parallax PNGs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Chunked `{tiled:true}` fill (spike-proven, chosen) | Kaplay `addLevel()` tilemap helper | Rejected in `build.js`'s own header comment ("Do NOT switch to per-tile colliders or Kaplay addLevel — that reintroduces the seam-stick the merge fixed"); also untested at this project's object-count scale |
| Kaplay `{tiled:true}` fill (chosen) | Per-tile `sprite()` for every fill tile | Spike-measured 15fps at 5,600 tiles (`SPIKE-FINDINGS.md` Spike B table) — a proven perf cliff, not a style choice |
| Plain JS manifest module (chosen) | JSON manifest file | JS module can be imported directly by both Node (`import`) and the browser (`<script type="module">` / bundler-free ESM) with zero parse step and no build tool needed — matches the project's zero-build-step constraint; a JSON file would need an extra `fetch`+`await res.json()` round-trip in the browser path for no benefit |

**Installation:**
No installation — zero new dependencies. All primitives are already vendored/pinned.

**Version verification:** Not applicable — no new packages. Kaplay stays at the pinned 3001.0.19 (`STATE.md`: "Kaplay upgrade" is explicitly Out of Scope for the whole v6.0 milestone).

## Package Legitimacy Audit

**Not applicable — this phase installs zero external packages.** All work uses the already-vendored, pinned Kaplay 3001.0.19 engine and the project's existing zero-npm-dependency toolchain (Playwright resolved dynamically at test-run time via `scripts/browser-boot.mjs`'s existing `resolvePlaywright()`, already in place before this phase). No `npm install`, no new `import` from a package registry, no new `pip`/`cargo` dependency.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────┐
                     │  src/assets-manifest.js      │
                     │  [{key, path, kind}, ...]     │  ← single source of truth
                     └──────────┬───────────────────┘
                                │  imported by BOTH
                 ┌──────────────┴───────────────┐
                 ▼                               ▼
   scripts/check-assets-manifest.mjs      src/main.js (boot)
   (Node, dev-time gate: for each          loop over manifest entries →
    entry, fs.existsSync(path))            loadSprite/loadSound per {kind}
   exit 1 on any missing file              (replaces the old 8×-repeated
                                             per-theme-N loadSprite block)
                                                    │
                                                    ▼
                                          kaplay() sprite/sound cache
                                                    │
              level select → go("game", {levelId}) │
                                                    ▼
                                        src/scenes/game.js (gameScene)
                                     reads level descriptor incl. .biome
                                          ┌─────────┴──────────┐
                                          ▼                     ▼
                            src/levels/build.js         src/parallax.js
                        buildLevel(level):          makeParallaxLayers(bounds, level.biome):
                       - occupancy Set from          - bg-far-<biome>, bg-mid-<biome>,
                         g.floors + g.platforms         bg-near-<biome> (3 layers,
                         (16px grid)                    UNCHANGED ratio/z/update logic)
                       - cap row: per-tile
                         sprite("atlas-<biome>",
                         {frame:0}) on every
                         "no-tile-above" cell
                       - fill: chunked
                         sprite("atlas-<biome>",
                         {tiled:true, frame:1,
                          width≤40*16, height})
                       - Cemetery: cap composited
                         AS OVERLAY on fill (not
                         a replacement)
                       - merged rect()+body()
                         colliders: UNTOUCHED,
                         same FLOOR_Y/platform.y
                                          │
                                          ▼
                              player spawns onto solid
                              ground; camera + parallax
                              update every onUpdate tick
                              (updateParallaxLayers reads
                               getCamPos().x only)

  ── verification path (separate from the runtime path above) ──

  scripts/browser-boot.mjs (headless Chromium, per commit)
    for each LEVEL_ORDER entry:
      1. load level → page.screenshot() (visual non-blank proof)
      2. sample debug.fps() after settle (perf proof)
      3. driveToXPlanned(page, level.geometry.goal.x, ...) → far-end
         non-blank screenshot (reuses existing drive helper — the goal
         is already authored near each level's far end)
      4. page.evaluate object-count query against tagged terrain
         entities → assert <= CONFIG object-count budget
    any failure → non-zero exit (hard fail, per CONTEXT's convention)
```

### Recommended Project Structure
```
src/
├── assets-manifest.js     # NEW — {key, path, kind} list, the manifest single source of truth
├── levels/
│   └── build.js           # MODIFIED — autotile cap+fill renderer replaces pickTopFrame() single-row loop
├── parallax.js             # UNCHANGED logic — only the sprite-name source becomes biome-driven
├── main.js                 # MODIFIED — manifest-driven load loop replaces the 8×-repeated theme-N block
└── levels/
    └── level-0N.js          # MODIFIED (all 8) — add `biome: "swamp"|"town"|"cemetery"|"castle"` field

scripts/
├── check-assets-manifest.mjs  # NEW — one-script-per-concern gate (existence check per manifest entry)
└── browser-boot.mjs           # MODIFIED — add per-level screenshot/fps/far-end/object-budget checks

assets/
├── tiles/atlas-{swamp,town,cemetery,castle}.png   # ALREADY BAKED (Phase 31) — 32x32, 2 frames (16x32 cap, 16x32 fill)
└── parallax/{far,mid,near}-{swamp,town,cemetery,castle}.png  # ALREADY BAKED (Phase 31)
```

### Pattern 1: Occupancy-Set Autotile with 2-Frame Simplification
**What:** Build a `Set` of occupied `"gx,gy"` 16px-grid cells from `g.floors` + `g.platforms`. For each occupied cell, if the cell directly above is unoccupied, render the biome's cap frame (`frame: 0`); otherwise render the fill frame (`frame: 1`) — but as part of a chunked `{tiled:true}` fill body, not a per-tile sprite, for everything below the cap row.
**When to use:** Every floor run and platform in `buildLevel()`.
**Example:**
```js
// Source: adapted from .planning/research/v6-scouting/spike-code/main.js (Spike B),
// simplified from the spike's 8-frame model to the real 2-frame atlas
// (docs/LEVEL-DESIGN.md §9; 32-CONTEXT.md "Biome Terrain Rendering" decision).
const T = CONFIG.TILE_SIZE; // 16
const CAP_FRAME = 0;
const FILL_FRAME = 1;
const FILL_CHUNK_COLS = CONFIG.TERRAIN.FILL_CHUNK_COLS; // <= 40, spike-proven ceiling

function buildOccupancy(rects) {
  const occ = new Set();
  for (const r of rects) {
    for (let gx = r.x / T; gx < (r.x + r.w) / T; gx++) {
      for (let gy = r.y / T; gy < (r.y + r.h) / T; gy++) occ.add(`${gx},${gy}`);
    }
  }
  return occ;
}

// One run = one contiguous horizontal span at a fixed y (a floor run or a platform).
// capRowY/fillDepthPx are computed per-run by the caller (fillDepthPx is
// CONFIG.LEVEL_BOTTOM-derived for floor runs, a shallow 1-2 tile constant for platforms).
function renderRun(atlasName, runX, runY, runW, fillDepthPx) {
  // Cap row: per-tile sprites (needed for correct per-tile positioning + the
  // Cemetery/Castle anomaly compositing below).
  for (let tx = runX; tx < runX + runW; tx += T) {
    add([sprite(atlasName, { frame: CAP_FRAME }), pos(tx, runY)]);
  }
  // Fill body: ONE (or several, if runW > FILL_CHUNK_COLS*T) chunked tiled sprite(s).
  for (let cx = runX; cx < runX + runW; cx += FILL_CHUNK_COLS * T) {
    const chunkW = Math.min(FILL_CHUNK_COLS * T, runX + runW - cx);
    add([
      sprite(atlasName, { frame: FILL_FRAME, tiled: true, width: chunkW, height: fillDepthPx }),
      pos(cx, runY + T),
    ]);
  }
}
```

### Pattern 2: Biome Threading Through Existing Parallax (No New Logic)
**What:** `parallax.js`'s `makeParallaxLayers(bounds, theme)` already builds a `layerName()` closure templating `${base}-${theme}`. Rename the parameter's semantic meaning from "theme" to "biome" (or pass an explicit `biome` alongside/instead of `theme`) — zero change to `makeParallaxLayer`, tiling math, or `updateParallaxLayers`.
**When to use:** `game.js`'s existing call site `makeParallaxLayers(bounds, level.theme)` → `makeParallaxLayers(bounds, level.biome)`.
**Example:**
```js
// Source: src/parallax.js (already shipped, unmodified logic) — only the caller's
// argument changes, from level.theme ("theme-N") to level.biome ("swamp"|"town"|...).
const layerName = (base) => (biome ? `${base}-${biome}` : base);
// layerName("bg-far") -> "bg-far-swamp" for level-01/02, matching the already-baked
// assets/parallax/far-swamp.png filename exactly.
```

### Pattern 3: Manifest-Driven Sprite/Sound Loading
**What:** A flat `{key, path, kind}` array is the single source of truth for every asset `main.js` loads; both the browser boot path and the Node existence-gate script consume it.
**When to use:** Replace `main.js`'s hand-written biome/parallax/terrain `loadSprite` calls (currently the 8×-repeated `for (let n = 1; n <= 8; n++)` theme-N block) with a loop over manifest entries filtered by `kind`.
**Example:**
```js
// Source: pattern derived from this codebase's existing loadSprite/loadSound calls
// (src/main.js) + CONTEXT.md's locked "Assets Manifest" decision.
// src/assets-manifest.js
export const ASSETS_MANIFEST = [
  { key: "atlas-swamp", path: "assets/tiles/atlas-swamp.png", kind: "sprite-sliced" },
  { key: "bg-far-swamp", path: "assets/parallax/far-swamp.png", kind: "sprite" },
  // ...one entry per biome x {atlas, bg-far, bg-mid, bg-near}, plus every
  // pre-existing main.js loadSprite/loadSound call (ground, spike, goal, player,
  // coin, door, enemy-*, sfx/*, music/ambient) — coverage must be the FULL surface.
];

// src/main.js (excerpt)
import { ASSETS_MANIFEST } from "./assets-manifest.js";
for (const a of ASSETS_MANIFEST) {
  const webPath = `../${a.path}`; // preserves the existing ../assets/... web-root convention
  if (a.kind === "sprite-sliced") loadSprite(a.key, webPath, { sliceX: 2, sliceY: 1 });
  else if (a.kind === "sound") loadSound(a.key, webPath);
  else loadSprite(a.key, webPath);
}

// scripts/check-assets-manifest.mjs (excerpt)
import { existsSync } from "fs";
import { ASSETS_MANIFEST } from "../src/assets-manifest.js";
let failures = 0;
for (const a of ASSETS_MANIFEST) {
  if (!existsSync(a.path)) {
    console.error(`check-assets-manifest: MISSING ${a.key} -> ${a.path}`);
    failures++;
  }
}
process.exit(failures > 0 ? 1 : 0);
```

### Anti-Patterns to Avoid
- **One giant `{tiled:true}` quad for a whole run's fill:** spike-proven to silently render nothing past an internal vertex-batch ceiling — no error, no console warning, just a blank fill (`SPIKE-FINDINGS.md`: "First run's 59fps 'win' was actually an invisible fill — caught by screenshot verification"). Always chunk to ≤40 columns per tiled object.
- **Per-tile sprites for the fill body:** spike-measured 15fps at 5,600 tiles vs 58fps for the chunked-tiled equivalent at the same coverage. Object count, not pixel count, is the perf cliff.
- **Treating Cemetery's cap frame as a drop-in replacement for the other 3 biomes' cap:** its cap doesn't reach the tile's bottom edge (LEVEL-DESIGN.md §9) — compositing it directly against the solid-ground line the way Swamp/Town/Castle's caps work leaves a visible transparent gap between cap and collider-implied ground. Composite it as an overlay ON TOP OF the fill frame instead.
- **Letting the lip-offset rendering trick leak into collider position:** `docs/LEVEL-DESIGN.md` §9's explicit warning — the sprite's decorative lip (top or bottom, per biome) must be a pure rendering offset; `rect()`+`body({isStatic:true})` colliders stay at `FLOOR_Y`/`platform.y`, byte-unchanged from today.
- **Editing level geometry arrays while wiring biome/terrain rendering:** this phase's success criterion #5 requires byte-identical geometry — any accidental edit to `g.floors`/`g.platforms`/`g.coins`/etc. while touching `build.js` breaks the geometry-freeze gate. Keep rendering changes strictly additive/replacing in the visual-tile-emission code path, never touching the geometry arrays imported from `level-0N.js`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tiling a fill texture across a wide/tall region | A loop emitting one `sprite()` per 16px cell | Kaplay's native `sprite(name, {tiled:true, width, height})` | Kaplay already does GPU-side texture repeat for a `{tiled:true}` sprite in one draw call; hand-rolled per-tile loops are the exact perf cliff the spike measured (15fps @ 5,600 tiles) |
| Neighbor-aware frame picking for autotile | A bespoke per-project tile-bitmask system | The occupancy-`Set` + `pickFrame(occ, gx, gy)` idiom already proven in `spike-code/main.js` | Already written, already measured correct on floor/platform/pillar/single-tile cases (`spike-autotile-demo.png`) — porting it is strictly cheaper and lower-risk than re-deriving |
| Per-level parallax layer management (create/position/cleanup) | A new parallax subsystem keyed by biome | The existing `src/parallax.js` `makeParallaxLayers`/`updateParallaxLayers` (already handles N layers, ratio-based scroll, bounds-driven tiling count) | Zero new logic needed — only the sprite-name argument changes from theme to biome; the ratio/z/tiling-count math is unchanged and already correct |
| Asset-existence checking at runtime (try/catch around every `loadSprite`) | Runtime error handlers wrapping every sprite/sound load | A static Node-side existence gate (`scripts/check-assets-manifest.mjs`) run at commit/CI time | Catches a missing-file 404 BEFORE it ships, not as a runtime fallback the player would see as a blank sprite; matches the project's existing static-gate philosophy (`validate-levels.mjs`, `check-safety.sh`) |

**Key insight:** Every piece of this phase's "hard part" (the autotile+chunked-fill recipe) has already been built, run, and measured in this exact repo against the exact pinned engine version. The job is porting and simplifying (8 frames → 2), not inventing.

## Common Pitfalls

### Pitfall 1: Silent blank fill from an oversized `{tiled:true}` quad
**What goes wrong:** A single tiled sprite covering more than ~40 columns (at 16px/tile) renders nothing — no console error, no exception, just an invisible region.
**Why it happens:** An internal vertex-batch ceiling in the vendored Kaplay 3001.0.19 build (confirmed via spike, not documented upstream).
**How to avoid:** Always chunk fill sprites to `CONFIG.TERRAIN.FILL_CHUNK_COLS` (≤40) columns per object, per the already-proven `spike-code/main.js` `stressTiled()` recipe.
**Warning signs:** A level looks fine in the editor/description but a screenshot shows missing ground under a wide run — this is exactly why CONTEXT's success criteria include per-level screenshot checks in `browser-boot.mjs`, not just a "no console error" pass.

### Pitfall 2: Object-count perf cliff from per-tile fill
**What goes wrong:** FPS drops from ~58 to ~15-22 as fill coverage grows, even with `offscreen({hide})` culling (culling doesn't help — the cost is per-object `update()` overhead, not draw calls).
**Why it happens:** Kaplay's per-object update loop cost scales with object COUNT, not screen coverage.
**How to avoid:** Cap row = per-tile sprites (needed for correct positioning); everything else = chunked `{tiled:true}`. Real levels need shallow fill only (see Metadata's object-count calculation below) so this should stay well under the spike's proven-safe ~410-object case.
**Warning signs:** `debug.fps()` (already exposed as a Kaplay global, used by the spike's `window.__spike.fps` helper) sampled after a level settles.

### Pitfall 3: Cemetery/Castle cap-frame anomalies rendered as if they were Swamp/Town
**What goes wrong:** Cemetery shows a visible transparent gap between its cap sprite and the (correctly positioned) collider; Castle's decorative gold trim reads as floating above the ground instead of sitting at its base.
**Why it happens:** `docs/LEVEL-DESIGN.md` §9's pixel-scan found Cemetery's cap frame is only opaque in a MIDDLE band (rows 10-19 of 32) — it does not reach the tile's bottom edge like the other 3 biomes — and Castle's cap frame has its decorative highlight at the BOTTOM of the frame (rows 27-31), not the top.
**How to avoid:** Per CONTEXT's locked decision — Cemetery: composite the cap sprite as an overlay drawn ON TOP OF the fill frame (both frames render at the same cell), not as a cap-replaces-fill swap. Castle: render as-is; the bottom-anchored trim is cosmetically correct as a plinth/baseboard, needs no special-casing.
**Warning signs:** A visible seam or gap at the top of Cemetery ground runs; Castle ground reading as "floating trim" rather than a grounded plinth — catch via the per-level screenshot checks.

### Pitfall 4: Collider/sprite Y-offset desync
**What goes wrong:** A biome's decorative lip rendering offset accidentally shifts the `rect()`+`body({isStatic:true})` collider position, silently changing the effective ground height the player stands on — this would also risk breaking the kid-validated jump envelope.
**Why it happens:** Easy to conflate "where the sprite looks like it sits" with "where the collider is" when compositing per-biome cap frames with different lip depths (Swamp ~4px, Town ~26px, Cemetery n/a, Castle ~0px-by-alpha).
**How to avoid:** Per `docs/LEVEL-DESIGN.md` §9's explicit warning and the CONTEXT.md locked decision: colliders are derived from level geometry alone (`FLOOR_Y`, `platform.y`) and NEVER read from sprite/atlas pixel data. Keep the two code paths (collider emission vs. visual-tile emission) fully separate in `build.js`, as they already are today.
**Warning signs:** `?debug=1` overlay (already shows merged colliders at 0.35 opacity) diverging visually from where the ground sprite appears to be.

### Pitfall 5: Partial manifest coverage defeats the silent-404 goal
**What goes wrong:** A manifest that only lists the NEW biome files (not the pre-existing ground/player/door/enemy/audio assets) leaves the exact same silent-404 risk class alive for everything it doesn't cover.
**Why it happens:** It's tempting to scope the manifest narrowly to "what this phase adds."
**How to avoid:** CONTEXT.md's locked decision is explicit: "the manifest covers the full asset surface `main.js` already loads (not just the new biome files)." Enumerate every current `loadSprite`/`loadSound` call in `main.js` (player, coin, spike, goal, door, enemy-1/2/3, title-bg, logo-hero, logo-badge, all 7 sfx, ambient music) into the manifest, in addition to the new biome atlas/parallax entries — noting that `enemy-hellhound.png` and `player-swamphunter.png` already exist on disk (Phase 31 leftovers) but are NOT yet loaded by `main.js`; they belong to Phase 33's scope, so exclude them from this phase's manifest unless Phase 33 explicitly wires them first.
**Warning signs:** `check-assets-manifest.mjs` passes green while a genuinely broken/renamed asset path elsewhere in `main.js` still 404s silently — the gate is only as strong as its coverage.

### Pitfall 6: Geometry-array edits creeping in during rendering changes
**What goes wrong:** While rewriting `build.js`'s floor/platform rendering loop, a stray edit to `run.x`/`run.w`/`p.x`/`p.w` (reading from `level-0N.js`'s geometry) or — more subtly — a "helpful" tweak to a level descriptor while testing biome rendering, breaks the phase's success criterion #5 (byte-identical geometry) and desyncs `validate-levels.mjs`'s cached reachability assumptions.
**Why it happens:** `build.js` and `level-0N.js` are read together constantly while iterating on rendering; it's easy to "fix" a visual gap by nudging geometry instead of the render offset.
**How to avoid:** Any visual misalignment must be solved via rendering-layer offsets (the cap/fill compositing, sprite `pos()` calculations) — never via geometry array edits. `git diff` on every `level-0N.js` file's `geometry` object should show zero changes at the end of this phase (only the new `biome` field, added outside `geometry`).
**Warning signs:** `git diff --stat` on `src/levels/level-0N.js` touching lines inside the `geometry: { ... }` block.

### Pitfall 7: Far-end-of-level checks that don't actually reach the far end
**What goes wrong:** A "far-end non-blank" check that screenshots too early (before the player/camera has traveled far enough) trivially passes without ever proving the far end renders correctly.
**Why it happens:** Levels are wide (up to 6,200px for level-04); a naive fixed-duration hold-right drive may not cover the full distance, especially for the longest levels.
**How to avoid:** Reuse the existing `driveToXPlanned` helper (already imported in `browser-boot.mjs` from `./lib/mechanic-drive.mjs`) targeting `level.geometry.goal.x` — every level's goal is authored near its far end by design, so driving to the goal x-coordinate is both a natural "far end" proxy and reuses proven, already-tested driving logic rather than inventing a new one.
**Warning signs:** A far-end screenshot that visually shows mid-level content, not the goal/final area.

## Code Examples

### Adapting the spike's occupancy/frame-pick idiom to the real 2-frame atlas
```js
// Source: .planning/research/v6-scouting/spike-code/main.js (Spike B, lines 108-150),
// simplified per 32-CONTEXT.md's locked "Biome Terrain Rendering" decision — the real
// atlas has only 2 frames (cap=0, fill=1), not the spike's 8.
function buildOccupancy(rects, T) {
  const occ = new Set();
  for (const r of rects) {
    for (let gx = r.x / T; gx < (r.x + r.w) / T; gx++) {
      for (let gy = r.y / T; gy < (r.y + r.h) / T; gy++) occ.add(`${gx},${gy}`);
    }
  }
  return occ;
}
function isCap(occ, gx, gy) {
  return !occ.has(`${gx},${gy - 1}`); // no tile above -> this cell shows the cap
}
```

### Loading the 2-frame biome atlas (sliceX/sliceY, matches LEVEL-DESIGN.md §9's documented 32x32/2x16x32 layout)
```js
// Source: src/main.js's existing loadSprite convention, extended per the manifest pattern.
// docs/LEVEL-DESIGN.md §9: "a 32x32 sheet of two 16x32 frames (cap, then fill)".
loadSprite("atlas-swamp", "../assets/tiles/atlas-swamp.png", { sliceX: 2, sliceY: 1 });
// frame 0 = cap (left half), frame 1 = fill (right half)
```

### Chunked tiled fill, ceiling-safe
```js
// Source: .planning/research/v6-scouting/spike-code/main.js stressTiled() (lines 179-202),
// the exact proven-safe (58fps, 410 objects for 5,600-tile coverage) recipe.
const CHUNK = CONFIG.TERRAIN.FILL_CHUNK_COLS; // <= 40, tunable, spike ceiling
for (let cx = runX; cx < runX + runW; cx += CHUNK * T) {
  const cw = Math.min(CHUNK * T, runX + runW - cx);
  add([
    sprite(atlasName, { frame: 1, tiled: true, width: cw, height: fillDepthPx }),
    pos(cx, runY + T),
    "ground-fill",
  ]);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Single visual-only top-row floor strip (`pickTopFrame` picking left/mid/right/single from a 5-frame `ground.png`) | Autotile cap+chunked-fill rendering (occupancy-Set-driven, 2-frame biome atlas) | This phase (32) | Ground now reads as a solid mass instead of a floating 16px strip — success criterion #1 |
| Flat triangle silhouette backgrounds (implied by the phase goal's "replacing the flat triangle silhouettes" language) / theme-N tinted parallax | Real per-biome multi-layer parallax (already-baked Gothicvania-derived far/mid/near art per biome) | This phase (32) | Each biome shows real layered sky+detail art that moves with the camera — success criterion #2 |
| Hand-written, 8×-repeated per-theme-N `loadSprite` block in `main.js` | Manifest-driven load loop (`src/assets-manifest.js` + a Node existence gate) | This phase (32) | Kills the silent-404 class — success criterion #4 |
| No perf/screenshot checks in the automated harness | Per-level screenshot, FPS, far-end non-blank, and object-count-budget checks in `browser-boot.mjs` | This phase (32) | Success criterion #3 — "checks that don't play the game lie" extended to rendering |

**Deprecated/outdated:**
- `groundSprite` / `ground-theme-N.png` / `pickTopFrame()`: replaced by the biome atlas + autotiler. Per CONTEXT's locked "Rollout & Cleanup Scope" decision, the old `ground-theme-N`/`bg-*-theme-N` assets and their `loadSprite` calls are deleted outright (git history preserves them), not kept as a fallback.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No established numeric FPS floor exists yet in this codebase for "frame rate holds" (success criterion #3) — this research recommends a concrete threshold (e.g., sustained ≥50fps, informed by the spike's 58fps-safe / 15-22fps-cliff data points) rather than citing a locked project value, since none exists. `[ASSUMED]` | Common Pitfalls (Pitfall 2), roadmap success criterion #3 | If the planner picks a threshold far from the spike's observed safe/cliff boundary (e.g., too strict at 55fps+ given headless-Chromium is measured as "pessimistic vs real GPU" per SPIKE-FINDINGS.md), the gate could flap or under-protect; recommend keeping it comfortably below the spike's 58fps clean-run number (e.g. 45-50fps) to absorb headless-vs-real-GPU variance |
| A2 | `level.biome` is assumed to be a NEW additive descriptor field (separate from the existing `level.theme`, which stays for now since it's not explicitly ordered removed) rather than replacing `theme` outright. `[ASSUMED]` | Architecture Patterns (Pattern 2), Recommended Project Structure | If `theme` is actually meant to be fully retired this phase (not just its sprite assets), the planner should explicitly decide whether to keep, deprecate-but-keep, or remove the `theme` field/its accent-color consumers (e.g. `PALETTE.ACCENT_*` usage elsewhere) — CONTEXT.md does not address this explicitly, only the sprite-asset deletion |

**If this table is empty:** N/A — see above; both entries are recommendations filling a genuine gap CONTEXT.md leaves open (a numeric FPS floor, and the exact fate of the `theme` field), not verified facts.

## Open Questions

1. **Does `level.theme` (and its `PALETTE.ACCENT_*` consumers) get removed, deprecated, or left alone this phase?**
   - What we know: CONTEXT.md's "Rollout & Cleanup Scope" locks deletion of the theme-N ground/parallax ART ASSETS and their `loadSprite` calls; it does not mention the `theme` STRING FIELD on level descriptors itself, nor whether anything else in the codebase (e.g., select-screen tile coloring, if any) still reads `level.theme`.
   - What's unclear: whether leaving a now-asset-less `theme: "theme-N"` field on descriptors is acceptable dead data, or whether the planner should remove it as part of the same pass.
   - Recommendation: grep for all `level.theme`/`.theme` reads at planning time (a fast, cheap check) and decide based on what's actually still consuming it — this is a mechanical planning-time check, not a research gap.

2. **Exact numeric object-count budget and FPS floor for the new browser-boot hard-fail gates.**
   - What we know: the spike measured ~410 objects / 58fps as the proven-safe case for a 5,600-tile-deep-fill (16-row) stress scenario; this phase's REAL per-level fill depth is only ~2-3 rows (floor-to-camera-bottom-clamp), so real object counts should land well under 410 per level (see Metadata below for the level-04 estimate).
   - What's unclear: the exact CONFIG constant values to lock in (both are explicitly Claude's Discretion per CONTEXT.md, "informed by the spike's measured ~410-object safe case").
   - Recommendation: set `CONFIG.TERRAIN.OBJECT_BUDGET` generously above the calculated real-world max (see Metadata's ~400-object estimate for level-04, the widest level) — e.g. 600-700 — so the gate catches genuine regressions (a chunk-size bug reverting to per-tile fill) without false-failing on legitimate level-width growth from Phase 34's LVL-01 fixes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Kaplay (vendored) | All rendering work | ✓ | 3001.0.19 (pinned, `lib/kaplay.mjs`) | — |
| Playwright | `browser-boot.mjs` extensions | ✓ (dynamically resolved — see `resolvePlaywright()`) | resolved at run time | Already has a 3-tier fallback in place (project dep → `PLAYWRIGHT_MJS_PATH` env → nvm-wide gsd-pi search); no change needed this phase |
| Python3 + Pillow | NOT required this phase (baking already done in Phase 31) | — | — | — |
| Baked biome atlases (`assets/tiles/atlas-{swamp,town,cemetery,castle}.png`) | ART-02 | ✓ (verified on disk, 32x32px each) | Phase 31 output | — |
| Baked biome parallax layers (12 files: far/mid/near × 4 biomes) | ART-03 | ✓ (verified on disk) | Phase 31 output | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — every dependency this phase needs is already present and verified on disk.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (project convention) — shell gate scripts + Playwright-driven `.mjs` scripts ARE the test suite |
| Config file | none |
| Quick run command | `node scripts/validate-levels.mjs` (fast, pure-data, geometry-only — proves ART-02/03 rendering changes didn't touch geometry, success criterion #5) |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/check-assets-manifest.mjs && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ART-02 | Ground renders as solid autotiled mass (cap+fill), colliders untouched | integration (headless browser) | `node scripts/browser-boot.mjs` (new per-level screenshot check) | ❌ Wave 0 — extend `browser-boot.mjs` |
| ART-02 | Fill chunking never silently blanks (batch-limit trap) | integration (headless browser, visual) | `node scripts/browser-boot.mjs` (screenshot pixel-non-blank assertion) | ❌ Wave 0 |
| ART-02 | Level geometry arrays byte-identical | static/structural | `node scripts/validate-levels.mjs` + `git diff` review gate | ✅ existing script, no code change needed |
| ART-02 | Perf holds (no FPS regression from fill strategy) | integration (headless browser) | `node scripts/browser-boot.mjs` (new `debug.fps()` sampling + object-count budget assertion) | ❌ Wave 0 |
| ART-03 | Each biome shows a real multi-layer parallax that moves with camera | integration (headless browser, visual) | `node scripts/browser-boot.mjs` (existing per-level visit loop, extended with a screenshot) | ❌ Wave 0 (extend existing loop) |
| ART-02/03 (manifest) | Every manifest-declared asset exists on disk | static | `node scripts/check-assets-manifest.mjs` | ❌ Wave 0 — new script |

### Sampling Rate
- **Per task commit:** `node scripts/validate-levels.mjs` (fast, geometry-only — catches the highest-risk regression class, accidental geometry edits, in seconds)
- **Per wave merge:** Full suite (`check-gate.sh`, `check-safety.sh`, `check-import-safety.sh`, `check-progress.sh`, `check-assets-manifest.mjs`, `validate-levels.mjs`, `browser-boot.mjs`)
- **Phase gate:** Full suite green before `/gsd-verify-work`, plus a real interactive playtest per this project's "checks that don't play the game lie" verification standard (CLAUDE.md)

### Wave 0 Gaps
- [ ] `src/assets-manifest.js` — the manifest itself (new file, no code exists yet)
- [ ] `scripts/check-assets-manifest.mjs` — the new existence-gate script (new file)
- [ ] `scripts/browser-boot.mjs` extensions — per-level screenshot capture, `debug.fps()` sampling, far-end non-blank check (via `driveToXPlanned` to `level.geometry.goal.x`), and object-count-budget assertion (new code in an existing file)
- [ ] `CONFIG.TERRAIN` block in `src/config.js` — `FILL_CHUNK_COLS`, `OBJECT_BUDGET`, and any FPS-floor constant (new config, no magic numbers per project convention)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Static client-only game, no accounts (project constitution) |
| V3 Session Management | No | No sessions — `localStorage` only |
| V4 Access Control | No | No access control surface |
| V5 Input Validation | Marginal — yes, narrowly | The assets manifest's `path` values are static, hand-authored, repo-local data (not user input); the existence-gate script does a plain `fs.existsSync()` against these repo-controlled paths — no path traversal or injection surface since paths never derive from any runtime/user input |
| V6 Cryptography | No | No crypto in this phase |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/oversized asset PNG causing a render hang or memory spike | Denial of Service (minor, client-local only) | Not a new risk this phase — all assets are pre-baked, licensed, pink-gate-verified CC0/CC-BY content already vendored by Phase 31; no new asset ingestion pipeline is introduced |
| Path traversal via manifest `path` field | Tampering | Not applicable — manifest entries are hand-authored constants in a committed source file, never derived from user/runtime input; `check-assets-manifest.mjs`'s `fs.existsSync()` calls operate on these fixed, repo-controlled strings only |

This phase has no meaningful new attack surface: it is a rendering/asset-loading change to a static, client-only, no-account, no-network-write game. Security review effort here should be near-zero relative to other v6.0 phases (e.g. Phase 37's touch-input surface).

## Sources

### Primary (HIGH confidence)
- `.planning/research/v6-scouting/SPIKE-FINDINGS.md` — Spike B (autotile fill renderer), measured live against a byte-copy of the pinned vendored `lib/kaplay.mjs` in this repo, 2026-07-08. `[VERIFIED: local spike run against pinned engine]`
- `.planning/research/v6-scouting/spike-code/main.js` — the port-ready idiom source (`buildOccupancy`, `pickFrame`, `renderTerrain`, `stressTiled`). `[VERIFIED: local spike run]`
- `docs/LEVEL-DESIGN.md` §9 — pixel-scanned per-biome lip-offset measurements against the REAL baked atlas files (not the spike's exploratory estimate). `[VERIFIED: pixel-scan against real assets/tiles/atlas-*.png]`
- `src/levels/build.js`, `src/parallax.js`, `src/main.js`, `src/config.js`, `src/scenes/game.js`, `src/camera.js`, `src/levels/index.js` — read directly from the live tree, 2026-07-11. `[VERIFIED: codebase read]`
- `assets/tiles/atlas-{swamp,town,cemetery,castle}.png` and `assets/parallax/*-{swamp,town,cemetery,castle}.png` — confirmed present on disk with `PIL.Image.open().size` (32x32 atlases; 640x120/144/90 parallax layers matching `CONFIG.PARALLAX`'s existing Y-offset constants). `[VERIFIED: file inspection]`
- `.planning/phases/32-terrain-parallax-rendering/32-CONTEXT.md` — user-locked decisions from `/gsd-discuss-phase`, copied verbatim above.
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — project decision history, phase traceability. `[VERIFIED: codebase read]`
- `.planning/research/v6-scouting/ASSET-SCOUTING.md` — level→biome mapping origin (Castlevania arc, calm→harsh). `[VERIFIED: codebase read, cross-referenced against CONTEXT.md's restatement]`

### Secondary (MEDIUM confidence)
None needed — no external web/docs lookups were required this phase; every technical claim traces to a local, already-verified source (spike run against the pinned engine, or direct codebase/asset inspection).

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, pure port of already-spike-verified engine primitives
- Architecture: HIGH — recipe already proven in this repo against the pinned engine; only the frame-count simplification (8→2) and biome-name threading are new, both mechanical
- Pitfalls: HIGH — all 7 pitfalls trace to either a measured spike finding, a documented `docs/LEVEL-DESIGN.md` §9 anomaly, or an explicit CONTEXT.md-locked constraint — none are speculative

**Real-world object-count sanity check (level-04, the widest shipped level, 6,200px):**
Summing `level-04.js`'s 9 floor runs (440+480+520+560+560+600+560+600+520 = 4,840px ≈ 303 cap tiles) and 11 platforms (≈1,264px ≈ 79 cap tiles) gives ≈382 cap-row tile objects. Since every run/platform width is ≤600px (well under the 40-column/640px chunk ceiling) and real fill depth is only ~2-3 rows (40px, floor-to-`bounds.bottom`-clamp, per CONTEXT's locked decision — NOT the spike's 16-row/256px stress-test depth), each run/platform needs exactly ONE fill chunk object: 9+11 = 20 fill objects. **Total ≈ 402 objects for the widest level** — landing almost exactly at the spike's independently-measured "410 objects, 58fps, 9ms build" safe case, despite level-04 being a real, wider, multi-run level rather than the spike's single-run synthetic stress test. This is strong corroborating evidence the chosen recipe has ample headroom for all 8 shipped levels.

**Research date:** 2026-07-11
**Valid until:** 2026-08-10 (30 days — stable, pinned-engine, no external dependency drift risk; the only invalidation vector would be a future re-bake of the atlas art changing frame count/layout, which is explicitly out of this phase's scope)
