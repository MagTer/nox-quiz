# Phase 35: Biome Re-dress & Props - Pattern Map

**Mapped:** 2026-07-16
**Files analyzed:** 10 (3 modified src, 3 modified/new scripts, 8 level descriptors, 1 asset dir)
**Analogs found:** 10 / 10 (every sub-problem has an in-repo seam — this phase is composition, not invention)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/levels/build.js` (MOD — new `props` emit loop) | builder | transform (data→entities) | its own `g.doors ?? []` / `g.coins` / `secretAlcove ?? []` loops | exact (same file, same idiom) |
| `src/config.js` (MOD — new `CONFIG.PROPS` block) | config | — | `CONFIG.PARALLAX.{FAR,MID,NEAR}_Z` block (lines 94–100) | exact |
| `src/assets-manifest.js` (MOD — new `kind:"prop"` rows) | config/data | — | `biome-atlas` / `biome-bg` / `sprite` entry rows | exact |
| `src/main.js` (MOD — new `prop` load branch) | config/boot | file-I/O (asset load) | manifest load loop lines 106–117 (`biome-atlas`/`biome-bg` branches) | exact |
| `src/levels/level-0N.js` ×8 (MOD — new top-level `props: []`) | data | — | existing top-level `mechanics`/`biome`/`parallax` slots (level-01 lines 232–235) | exact |
| `scripts/build-art-assets.py` (MOD — delete theme code + add prop bake) | build tool | file-I/O (Pillow bake) | `_bake_biome_atlas` (line 745) + `hue_shift_band` (691); DELETE `build_ground_theme`/`build_parallax_theme`/`__main__` 1476–1478 | exact (bake); role-match (delete) |
| `scripts/screenshot-phase35-props.mjs` (NEW) | test/evidence | request-response (Playwright drive) | `scripts/screenshot-phase33-terrain.mjs` | exact (clone, copy-not-extract) |
| `scripts/check-geometry-frozen.mjs` (NEW) | test/gate | batch (pure-data snapshot) | `scripts/check-assets-manifest.mjs` + `validate-levels.mjs` | role-match |
| `scripts/fixtures/geometry-frozen-baseline.json` (NEW) | test fixture | — | smoke-progress golden-fixture convention | role-match |
| `assets/props/` (NEW dir of baked PNGs) | asset | — | `assets/tiles/atlas-*.png`, `assets/door.png` (single named sprite) | exact |

## Pattern Assignments

### `src/levels/build.js` — the new `props` emit loop (builder, transform)

**Analog:** its own optional-array loops in the SAME function `buildLevel(levelData)`. The `?? []` guard, the `add([...])` shape, and the engine-globals-inside-body rule are all established here.

**Guarded optional-array idiom** (lines 421–429, the `secretAlcove` loop — closest analog because it too emits a NON-blocking, sometimes-debug-only entity):
```javascript
for (const a of g.secretAlcove ?? []) {
  add([
    rect(CONFIG.ALCOVE_SIZE, CONFIG.ALCOVE_SIZE),
    pos(a.x, a.y),
    area(),
    ...(DEBUG ? [color(255, 0, 255), opacity(0.8)] : [opacity(0)]),
    "secret-alcove",
  ]);
}
```

**Coin loop** (lines 238–241) — the minimal sprite+pos+tag shape (but coins DO carry `area()`; props must NOT):
```javascript
for (const c of g.coins) {
  const coin = add([sprite("coin"), pos(c.x, c.y), area(), "coin"]);
  coin.play("spin");
}
```

**NEW prop loop to add** (per RESEARCH §Pattern 2 — place AFTER the terrain/mechanics emits, inside `buildLevel` body so engine globals are live per a727c13). Note it reads `levelData.props` (TOP-LEVEL), NOT `g.props` — `g = levelData.geometry` stays byte-frozen:
```javascript
// --- Visual-only props (ART-06) — NO area(), NO body(): pure decoration, validator-neutral ---
for (const pr of levelData.props ?? []) {
  add([
    sprite(pr.sprite),
    pos(pr.x, pr.y),
    z(pr.layer === "surface" ? CONFIG.PROPS.Z_SURFACE : CONFIG.PROPS.Z_BACK),
    "prop",
  ]);
}
```

**Critical differences from every other loop in this file:** props get NO `area()`, NO `body()`, NO `rect()` collider, and NO tall apex-blocker. They are the ONLY entity class here that is pure sprite+pos+z. This is what makes them validator-neutral by construction (Pitfall: adding `area()`/`body()` breaks it — RESEARCH Anti-Patterns).

**Stale-comment cleanup in this file:** line 79 mentions "the old theme-aware groundSprite ternary" — update per RESEARCH §Old-Tint-Theme-Cleanup (it is a LIVE-code comment, not dead code; just reword).

---

### `src/config.js` — the new `CONFIG.PROPS` z block (config)

**Analog:** the `PARALLAX` z block (lines 94–100) — the ONLY other negative-z tunables in the project, and the exact band props must sit in front of:
```javascript
PARALLAX: {
  // ...
  FAR_Z: -30, // z-order: behind everything
  MID_Z: -20,
  NEAR_Z: -10,
},
```

**NEW block to add** (both values NEGATIVE and inside the open `(NEAR_Z -10, 0)` band, so props render behind the z(0) player/coins/terrain and in front of the nearest parallax layer — RESEARCH §Pattern 3):
```javascript
PROPS: {
  Z_BACK: -8,     // parallax-adjacent background props (reeds, distant tombstones, banners)
  Z_SURFACE: -3,  // on-surface props resting on ledges/floors (crates, torches, urns)
},
```

**Object budget to respect (lines 110, 120, 130):** `CONFIG.TERRAIN.OBJECT_BUDGET = 650`, `FPS_FLOOR = 40`. Real levels run ~400–420 objects; every prop counts (Pitfall 2). Restrained density keeps well under.

**LEAVE ALONE:** `CONFIG.PALETTE.ACCENT_MOSS..ACCENT_EMBER` (lines 43–50) — dead for rendering but referenced by `scripts/check-contrast.mjs`; deleting breaks that gate. Out of this phase's cleanup scope (not `theme-`-named). RESEARCH §Cleanup A4.

---

### `src/assets-manifest.js` — new `kind:"prop"` rows (config/data)

**Analog:** the existing entry rows. The manifest is a pure-data, zero-import module; the existence gate (`check-assets-manifest.mjs`) iterates ALL entries kind-agnostically, so new `kind:"prop"` rows are auto-covered.

**Single-sprite entry shape** (line 48):
```javascript
{ key: "door", path: "assets/door.png", kind: "sprite" },
```

**NEW prop rows to add** (RESEARCH §Manifest wiring — one per baked prop PNG):
```javascript
{ key: "prop-town-barrel", path: "assets/props/town-barrel.png", kind: "prop" },
```

**Also update:** the header comment's "37 entries total" count + add a `prop (N)` line to the `kind`-group tally (lines 10–16).

---

### `src/main.js` — new `prop` load branch (config/boot, file-I/O)

**Analog:** the manifest load loop, lines 106–117 (this is the exact loop RESEARCH says to extend):
```javascript
for (const a of ASSETS_MANIFEST) {
  const webPath = `../${a.path}`;
  if (a.kind === "biome-atlas") {
    loadSprite(a.key, webPath, { sliceX: 3, sliceY: 1 });
  } else if (a.kind === "biome-bg") {
    loadSprite(a.key, webPath);
  }
}
```

**NEW branch to add** (static single-frame; Phase 36 will animate torches):
```javascript
} else if (a.kind === "prop") {
  loadSprite(a.key, webPath);
}
```

**Stale-comment cleanup:** line 103 mentions "the old hand-written per-theme-N block" — reword per RESEARCH §Cleanup (comment only, code is live).

---

### `src/levels/level-0N.js` ×8 — new top-level `props: []` field (data)

**Analog:** level-01's forward-looking optional slots (lines 232–235) — the exact structural location for the new field (a top-level sibling of `mechanics`/`biome`/`parallax`, OUTSIDE the frozen `geometry` object at lines 79–230):
```javascript
  // --- Forward-looking optional slots (buildLevel ignores them when unset) ---
  mechanics: [],
  biome: "swamp",
  parallax: null,
```

**NEW field to add** (RESEARCH §Pattern 1 — top-level, NOT inside `geometry`; `layer` is `"back"`|`"surface"`, defaults `"back"`; `y` is top-left, so on-surface props use `y = surfaceY - spriteHeight`, Pitfall 4):
```javascript
  props: [
    { sprite: "prop-swamp-reed", x: 640, y: 288, layer: "surface" },
    { sprite: "prop-swamp-tree", x: 1200, y: 40,  layer: "back" },
  ],
```

**HARD constraint:** the `geometry` object (floors/platforms/coins/spikes/goal/checkpoints/doors/mathGates/enemies/keys/locks/secretAlcove/bounds) must remain BYTE-IDENTICAL to its post-34.6 state. Append `props` as a new top-level key; touch nothing inside `geometry`. Enforced by the new frozen-geometry gate below.

**Trial pair (RESEARCH recommendation, confirm at planning):** level-01 (swamp, calm, THIN vocabulary — exercises the CC0 sourcing pipeline) + level-06 (cemetery, vertical switchback, RICH vocabulary — exercises density-vs-legibility + climb screenshots).

---

### `scripts/build-art-assets.py` — delete dead theme code + add prop bake (build tool, file-I/O)

**DELETE (dead since Phase 32 — RESEARCH §Cleanup verified via grep, no callers but the `__main__` loop):**
- `__main__` lines 1476–1478: `for theme_id, palette in THEME_PALETTES.items(): build_ground_theme(...); build_parallax_theme(...)`
- `build_ground_theme` (def @230), `build_parallax_theme` (def @508), `_accent_sub` (@305), `_mid_accent_sub` (@330), `_near_accent_sub` (@383), `_THEME_ACCENTS` (@434), `THEME_PALETTES` (@445).
- These bake orphaned `ground-theme-*.png` / `{far,mid,near}-theme-*.png` loaded by nothing. Not deleting risks a future bake re-littering `assets/` (Pitfall 5).

**DO NOT TOUCH (LIVE biome path):** `build_biome_atlas_*` / `build_biome_parallax_*` (@847+), `_bake_biome_atlas` (@745), `build_parallax` (@465), `build_ground` (@202).

**Prop-bake analog** — `_bake_biome_atlas` (line 745) shows the crop→[retint]→save body and the NORMATIVE rules for props: NEVER `_remap_luminance()` (the achromatic-grey trap, fact #8/#9), NEVER scale-to-cell, retint ONLY via `hue_shift_band`:
```python
def _bake_biome_atlas(out_name, sheet_path, cap_rect, fill_rect, retint=None):
    # NO SCALING and NO PALETTE REMAP -- crops at native resolution, native colors.
    # `retint`, if given, is a (band_lo, band_hi, delta) tuple applied via hue_shift_band()
    # -- the board's own no-pink pass, and the ONLY color transform in this bake.
```

**Retint tuples (RESEARCH §Bake):** town `(215, 255, -60)`, cemetery `(195, 245, -50)`; swamp/castle measure first (0% pink → no retint). `save(img, path)` helper is at line 79; `hue_shift_band(im, band_lo, band_hi, delta)` at line 691.

**NEW `bake_prop` helper** (RESEARCH §Bake pipeline) crops a PRE-SLICED pack file (never a preview sheet — Pitfall 3) → optional retint → `save` to `assets/props/<biome>-<name>.png`.

---

### `scripts/screenshot-phase35-props.mjs` (NEW — test/evidence, Playwright)

**Analog:** `scripts/screenshot-phase33-terrain.mjs` (lines 120–180). Per the binding rule "Playwright script duplication is deliberate" — CLONE it, copy-not-extract. It already boots Kaplay, seeds an all-levels-unlocked save, drives title→select→game with the row/col cursor math, and screenshots each level:
```javascript
const OUT_DIR = new URL("../.planning/phases/33-.../terrain-shots/", import.meta.url).pathname;
mkdirSync(OUT_DIR, { recursive: true });
for (let i = 0; i < LEVEL_ORDER.length; i++) {
  // ...row/col cursor nav, Enter, waitForTimeout(1500)...
  await page.screenshot({ path: OUT(`level-${String(n).padStart(2,"0")}-${biome}.png`) });
}
```

**Changes for phase 35:** point `OUT_DIR` at `.planning/phases/35-biome-re-dress-props/prop-shots/`; for vertical even levels (02/04/06/08) also drive/teleport toward `bounds.top` and capture a climb-altitude shot. Output feeds the `checkpoint:human-verify` sign-off (RESEARCH §Code Examples). This screenshot evidence is load-bearing — the "black mess" regressions were caught exactly here; do NOT rubber-stamp (MEMORY: never_rubber_stamp_checkpoints).

---

### `scripts/check-geometry-frozen.mjs` (NEW — test/gate, pure-data snapshot)

**Analog:** `scripts/check-assets-manifest.mjs` (the whole file, 39 lines) — the pure-data, standalone, `failures`-counter + `process.exit(failures>0?1:0)` gate idiom, NEVER wired into `check-gate.sh`:
```javascript
import { ASSETS_MANIFEST } from "../src/assets-manifest.js";
let failures = 0;
for (const asset of ASSETS_MANIFEST) {
  if (!existsSync(asset.path)) { console.error(`... MISSING ...`); failures += 1; }
}
process.exit(failures > 0 ? 1 : 0);
```

Also mirror `validate-levels.mjs`'s import of the registry: `import { LEVEL_ORDER, getLevel } from "../src/levels/index.js"` (validate-levels line ~33) and its per-descriptor iteration.

**NEW gate logic** (RESEARCH §Geometry-Frozen Enforcement): for each `LEVEL_ORDER` id, compare `JSON.stringify(getLevel(id).geometry)` against a committed golden `scripts/fixtures/geometry-frozen-baseline.json` captured at the phase-start (post-34.6) commit; any diff = HARD-FAIL naming the level + key. Because `props` is TOP-LEVEL, it never enters `geometry` → gate stays green through the whole re-dress. This is the real proof that a git diff can't give (props + frozen geometry share one file).

**Validator-neutrality confirmed:** `validate-levels.mjs` iterates `descriptor.geometry` ONLY (lines 58, 62, 88, 100, 106) — it never reads a top-level `props` field, so props are structurally invisible to it. Must stay 0 HARD-FAIL.

---

### `assets/props/` (NEW — baked prop PNGs)

**Analog:** `assets/tiles/atlas-*.png` and `assets/door.png` — individual named single-sprite files (RESEARCH prefers this 1:1-with-source over a packed atlas). Dir does NOT exist yet; `bake_prop` creates it.

**Pre-sliced source inventory (verified on disk this session, under `assets/_gothicvania-src/`):**

| Biome | Source dir | Available pre-sliced props | Richness |
|-------|-----------|----------------------------|----------|
| town (L3–4) | `gothicvania-town-files/.../PNG/environment/props-sliced/` | barrel, crate, crate-stack, sign, street-lamp, wagon, well (+ house-a/b/c) | RICH — direct named files |
| cemetery (L5–6) | `gothicvania-cemetery-files_1/.../PNG/Environment/sliced-objects/` | statue, stone-1..4, tree-1..3, bush-large, bush-small | RICH — direct named files |
| swamp (L1–2) | `gothicvania_swamp_files/.../Evironment/` | `props.png` (multi-prop STRIP — crop/islands per prop), `trees.png` | THIN — may need extra CC0 |
| castle (L7–8) | `gothicvania-church-files/.../ENVIRONMENT/column.png` + castle tilesets | column only pre-sliced; torches/banners/chains need tileset crops or new CC0 | THINNEST |

Ignore `__MACOSX/._*` shadow files. Props cropped from these packs are ALREADY license-covered (`assets/LICENSES/gothicvania-*.txt`). Any NEW CC0 source needs an `assets/LICENSES/<source>.txt` + `CREDITS.md` entry + must pass `check-pink-gate.sh`.

## Shared Patterns

### The a727c13 engine-global rule (applies to build.js prop loop)
**Source:** `src/levels/build.js` lines 50–61 (the `Rect` guard comment) + CLAUDE.md binding rule.
Engine globals (`add`, `sprite`, `pos`, `z`) may be referenced ONLY inside the `buildLevel` body, never at module top level. The new prop loop sits inside `buildLevel`, so it complies. Enforced by `check-import-safety.sh`.

### The `?? []` optional-array guard (applies to every un-dressed level)
**Source:** `src/levels/build.js` — `g.doors ?? []`, `g.mathGates ?? []`, `g.enemies ?? []`, `g.keys ?? []`, `g.secretAlcove ?? []`.
**Apply to:** `levelData.props ?? []`. Guarantees every level (dressed or not, including the 6 not yet dressed during the trial) still builds.

### Pure-data standalone gate convention (applies to check-geometry-frozen.mjs)
**Source:** `check-assets-manifest.mjs` + `validate-levels.mjs` headers.
`failures` counter, `process.exit(1)` on fail, DELIBERATELY not wired into `check-gate.sh`, node-importable, no browser. Golden fixtures live under `scripts/fixtures/`.

### No-pink / no-remap bake discipline (applies to all prop art)
**Source:** `build-art-assets.py::_bake_biome_atlas` docstring (lines 745–782) + `.planning/research/ART-PARITY-STEERING.md`.
Native color only (NEVER `_remap_luminance`), no scale-to-cell, retint only via `hue_shift_band` with the board's tuples, then let `check-pink-gate.sh` validate the OUTPUT.

## No Analog Found

None. Every file has a strong in-repo analog. The only genuinely-new artifact is the `scripts/fixtures/geometry-frozen-baseline.json` golden, but its capture/compare pattern mirrors the existing smoke-progress golden-fixture convention.

## Metadata

**Analog search scope:** `src/levels/`, `src/config.js`, `src/main.js`, `src/assets-manifest.js`, `scripts/*.mjs`, `scripts/*.sh`, `scripts/build-art-assets.py`, `assets/_gothicvania-src/**` pack dirs.
**Files scanned:** ~12 read + filesystem inventory of 4 biome pack dirs.
**Pattern extraction date:** 2026-07-16
</content>
</invoke>
