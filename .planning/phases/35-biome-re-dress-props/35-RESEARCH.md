# Phase 35: Biome Re-dress & Props - Research

**Researched:** 2026-07-16
**Domain:** Kaplay 3001 visual entity layering + Pillow asset bake pipeline + validator-neutral level data
**Confidence:** HIGH (entirely codebase-internal; zero new runtime deps, engine pinned)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Prop density — RESTRAINED, legibility-first.** Props are sparse/atmospheric; they must NEVER obscure a platform, route, hazard, coin, key, or mechanic. Bound by §8.5 / the ADHD mandate: "she must always be able to SEE where she's going and every route." Legibility beats atmosphere on every conflict. The play lane stays clear.
- **Prop layers — BACKGROUND + ON-SURFACE ONLY.** Props render behind the player (parallax-adjacent depth) OR resting on ledges/floors (on-surface decoration). **NO foreground props over the play lane** — nothing that can cover the player, a jump arc, or a route. (User explicitly declined "foreground framing.")
- **Prop art — vendored packs first, source ADDITIONAL CC0 where a biome is thin.** Start from the CC0 Gothicvania biome packs already vendored + style-board-approved in Phase 31. Where a biome lacks prop variety, source additional CC0 prop art — a real sourcing + license step like Phase 31: new assets get licenses in `assets/LICENSES/`, credits in `CREDITS.md`, named files only, and **`check-pink-gate.sh` MUST pass** over anything new (retint pink/magenta via the proven Pillow hue-conform pass).
- **Sign-off — 2-LEVEL TRIAL, then the rest.** Bake + place props on 2 trial levels FIRST, capture per-level screenshots, get a genuine human sign-off, and ONLY THEN dress the remaining 6. A real mid-phase `checkpoint:human-verify` gate. **Do NOT rubber-stamp** — this is where the "black mess" parallax regressions got caught across Phases 32/33.
- **Props are validator-neutral (hard).** The `props` layer carries NO colliders — pure visual entities. The structural validator and all reachability/audit checks must stay green and UNAFFECTED (props never gate a route).
- **Geometry byte-frozen:** `floors`/`platforms`/`coins`/`checkpoints`/`door`/`enemy`/`goal`/`keys`/`secretAlcove`/`bounds` arrays byte-identical to their post-Phase-34.6 state (review-gated in the re-dress commits — the standing "geometry-frozen art diffs" mitigation).
- **Old tint-theme cleanup:** delete the dead pre-Phase-32 tint-theme assets, and audit/remove residual `theme-` references (grep flags `src/main.js` and `src/levels/build.js`) — determine dead vs. live before deleting; do not break the biome path.

### Claude's Discretion
- Exact `props` descriptor data model, the per-biome prop vocabulary, z-ordering vs. terrain/parallax/player, the props renderer wiring in `build.js`, and precisely which 2 levels are the trial (within the recommendation) — all Claude's discretion within the rules above, surfaced at the 2-level trial checkpoint.
- **Recommended trial pair (confirm at planning):** two DIFFERENT biomes at different intensities — e.g. level-01 (swamp, calm) + level-04 or level-06 (an intense/vertical even level).

### Deferred Ideas (OUT OF SCOPE)
- World MOTION / animated flickering torches / ambient life / patrols / movers → Phase 36 (props here are STATIC).
- Foreground framing props over the play lane → declined.
- Mobile responsive/touch → Phase 37. n0x logo → Phase 38. GHCR CI/CD → backlog.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ART-06 | Visual-only `props` layer in level descriptors (torches, crates, chains…) — no colliders, validator-neutral | §"Props Data Model + Renderer" gives the exact top-level `props` field + `build.js` emit loop with NO `area()`/`body()`; §"Validation Architecture" proves validator-neutrality via `validate-levels.mjs` + the new frozen-geometry snapshot gate. |
| ART-07 | All 8 levels re-dressed in their assigned biome, kid-validated geometry byte-frozen during re-dress | §"Prop Sprite Sourcing + Bake" maps every biome to real pre-sliced CC0 prop art; §"Geometry-Frozen Enforcement" gives the snapshot gate; §"Per-Level Screenshot Verification" gives the 2-level-trial → sign-off → remaining-6 evidence path. |
</phase_requirements>

## Summary

Phase 35 is almost entirely **new level DATA + one small `build.js` emit loop + a Pillow bake of already-vendored prop art** — no engine changes, no new runtime dependencies, no Kaplay upgrade. The biome look already ships: `build.js` auto-selects `atlas-${biome}` terrain and `parallax.js` auto-selects `bg-{far,mid,near}-${biome}` layers from the descriptor's `biome` field. The genuinely-new deliverable is a collider-free `props` layer, a look-pass, and deleting dead `theme-N` bake code.

The engine's z-order landscape is simple and fully mapped (see §"Props Data Model + Renderer"): **all world gameplay entities — terrain tiles, coins, player, mechanic panels — render at the default `z(0)`, sorted by insertion order; parallax layers sit at explicit negative z (`FAR_Z -30`, `MID_Z -20`, `NEAR_Z -10`); UI/fx sit at high positive z (50–9999).** That leaves a clean, empty band between `NEAR_Z (-10)` and `0` for props. Placing BOTH prop layers at negative z (recommended `Z_BACK -8`, `Z_SURFACE -3`) guarantees props render **behind the player and behind every gameplay entity** — which is exactly the CONTEXT constraint ("never cover the player/route") expressed deterministically, and makes props validator-neutral by construction (they carry no `area()` at all).

The prop art largely already exists as **pre-sliced, named CC0 files** in the vendored packs: town (`props-sliced/`: barrel, crate, crate-stack, sign, street-lamp, wagon, well), cemetery (`sliced-objects/`: statue, stone-1..4, tree-1..3, bush-large/small). Swamp is thinner (`props.png` 176×43 + `trees.png`) and **castle is the thinnest** (only `church/column.png` + tilesets) — castle is where the "source extra CC0 where thin" decision will bite, and where the pink-gate retint discipline matters most.

**Primary recommendation:** Add a **top-level** `props: [{ sprite, x, y, layer }]` field on each descriptor (NOT inside `geometry` — this keeps the validator's `geometry` object byte-frozen by construction). Emit it in `build.js` via a guarded `for (const pr of levelData.props ?? [])` loop that adds `sprite + pos + z(...)` and NO `area()`/`body()`. Bake per-biome prop sprites from the pre-sliced pack files into `assets/props/<biome>-<name>.png` (per-biome retint reusing the proven `hue_shift_band` tuples), declare each in `assets-manifest.js` under a new `kind: "prop"`, load them via a new branch in main.js's manifest loop. Trial on **level-01 (swamp, thin vocabulary) + level-06 (cemetery, rich vocabulary, vertical switchback)** to maximize signal on both the sourcing pipeline and the density-vs-legibility question.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Prop placement data | Level descriptor (`src/levels/level-0N.js`) | — | Levels are pure data; props are per-level authored coordinates, exactly like coins. |
| Prop entity emission | The ONE builder (`src/levels/build.js`) | — | build.js is the single descriptor→entities seam; props join its emit list as visual-only tiles. |
| Prop z-ordering / depth | `src/config.js` (`CONFIG.PROPS.Z_*`) + build.js | — | All tunables live in config.js (binding rule); build.js reads them at emit time. |
| Prop sprite art (bake) | `scripts/build-art-assets.py` (Pillow) | new CC0 sourcing → `assets/LICENSES/`, `CREDITS.md` | Same build-time Pillow bake as Phase 31; not a runtime concern. |
| Asset load wiring | `src/main.js` manifest loop + `src/assets-manifest.js` | — | Manifest is the single source of truth; existence gate covers it. |
| Geometry-freeze proof | new `scripts/check-geometry-frozen.mjs` snapshot gate | git diff review | Node-importable pure-data check, mirrors validate-levels/smoke-progress idiom. |
| Look/legibility sign-off | Human (`checkpoint:human-verify`) | `screenshot-phase35-props.mjs` | §8.5 "feel"/legibility is human-only; screenshots are the evidence. |

## Standard Stack

No new packages. Everything is already vendored/installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay | 3001.0.19 (vendored `lib/kaplay.mjs`, PINNED) | `sprite()`, `pos()`, `z()`, `add()` for prop entities | Project engine; `z()` is the only new component props need beyond sprite/pos — already used by parallax.js. |
| Pillow (PIL) | already installed | Crop/retint/save prop sprites from pack sheets | The Phase 31/32/33 bake tool (`build-art-assets.py`); `hue_shift_band`, `save`, `Image.crop` already proven. |
| Playwright | already installed (resolved dynamically) | Per-level screenshots for the trial sign-off | The project's ONLY test harness; `page.screenshot({ path })` already used by `screenshot-phase33-terrain.mjs`. |
| node (ES modules) | system | The frozen-geometry snapshot gate + existing validators | No-build/no-dep canon; `.mjs` scripts ARE the suite. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Individual `assets/props/<biome>-<name>.png` sprites | One packed per-biome props atlas + `sliceX` frames | Atlas is fewer files but couples unrelated props into one sheet and complicates the manifest existence gate; individual named sprites match the pre-sliced source files 1:1 and the existing `door.png`/`math-gate.png` single-sprite convention. Recommend individual sprites. |
| `props` as a top-level descriptor field | `props` inside `geometry` | Inside `geometry` would make the frozen-geometry snapshot include a mutating field, defeating the byte-freeze proof, and the validator iterates `geometry.*`. Top-level keeps `geometry` untouched. **Recommend top-level.** (CONTEXT wording "props: []" is placement-agnostic; top-level is the safer reading.) |

**Installation:** none — `npm install` is not part of this project (no build step, engine vendored).

**Version verification:** No registry packages introduced. Kaplay stays 3001.0.19 (pinned; upgrade is out-of-scope per REQUIREMENTS "Out of Scope"). Pillow/Playwright already satisfy Phases 31–34.

## Package Legitimacy Audit

**Not applicable — this phase installs ZERO external packages.** Kaplay is vendored + pinned; Pillow, Playwright, and node are already present and used by Phases 31–34. No `npm install` / `pip install` / new dependency of any kind. "New assets" are CC0 art files vendored under `assets/` (license/credit process, not a package registry) and gated by `check-pink-gate.sh` + `check-assets-manifest.mjs`.

## Architecture Patterns

### System Architecture Diagram (prop data flow)

```
level-0N.js descriptor
  ├── geometry { floors, platforms, coins, ... }   ← BYTE-FROZEN this phase (untouched)
  ├── biome: "swamp"|"town"|"cemetery"|"castle"     ← already drives terrain+parallax
  └── props: [ { sprite, x, y, layer } ]            ← NEW top-level field (additive)
                    │
                    ▼
        game.js: buildLevel(level)                  ← called BEFORE makePlayer()
                    │
        build.js emit order (unchanged) ────────────┐
          floors→platforms→coins→spikes→goal→        │  all at default z(0),
          doors→gates→enemies→locks→keys→alcove       │  sorted by insertion
                    │                                 │
          + NEW: for (const pr of levelData.props ?? [])
                    add([ sprite(pr.sprite),          │
                          pos(pr.x, pr.y),            │
                          z(layer==="surface"         │
                            ? CONFIG.PROPS.Z_SURFACE(-3)
                            : CONFIG.PROPS.Z_BACK(-8)),
                          "prop" ])   ← NO area(), NO body()
                    │
                    ▼
     makeParallaxLayers(bounds, biome)  → z -30/-20/-10  (BEHIND props)
     makePlayer(startX, startY)         → z 0            (IN FRONT OF props)

  Render stack (back → front):
   parallax far(-30) mid(-20) near(-10)
     → props back(-8) → props surface(-3)
       → [z 0 band: terrain tiles, coins, mechanic panels, PLAYER]
         → fx/juice(50-60) → HUD/UI/challenge(9000-9999)
```

The Component Responsibilities table above maps each file. The diagram shows why props at negative z can never occlude anything at z 0 (player/coins/terrain/mechanics) — legibility guaranteed structurally, not by hand-tuning.

### Pattern 1: The `props` descriptor field (top-level, additive)
**What:** A new optional array parallel to `biome`, `mechanics`, `parallax` — NOT inside `geometry`.
**When to use:** Every dressed level (start with the 2 trial levels).
**Example:**
```javascript
// src/levels/level-0N.js  — geometry object above stays byte-identical to 34.6
export const LEVEL_0N = {
  id: "level-0N",
  allowedTables: [...],
  geometry: { /* FROZEN — do not touch */ },
  mechanics: [],
  biome: "cemetery",
  parallax: null,
  // --- NEW: visual-only props (ART-06). No colliders; validator never sees this. ---
  props: [
    { sprite: "prop-cemetery-statue", x: 640, y: 288, layer: "surface" }, // resting on a floor
    { sprite: "prop-cemetery-tree-1", x: 1200, y: 40,  layer: "back"    }, // parallax-adjacent
  ],
};
```
`layer` is `"back"` (Z_BACK) or `"surface"` (Z_SURFACE); default to `"back"` if omitted. `y` is the sprite's top-left (Kaplay `pos` default anchor is topleft) — for on-surface props place `y = surfaceY - spriteHeight` so the base rests on the ledge.

### Pattern 2: The `build.js` emit loop (guarded, engine-globals-inside-body)
**What:** One loop appended to `buildLevel`, after the terrain/mechanics emits.
**Example:**
```javascript
// src/levels/build.js — inside buildLevel(levelData), engine globals used inside body (a727c13)
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
`?? []` guards every un-dressed level so it still builds (same idiom as `g.doors ?? []`). No `Rect`/collider globals touched. Tag `"prop"` lets a future phase (or a debug overlay) target them; it is NOT wired to any `onCollide`.

### Pattern 3: config z tunables
```javascript
// src/config.js — new block; all tunables live here (binding rule)
PROPS: {
  // Both NEGATIVE so props ALWAYS render behind the player and all gameplay (z 0),
  // and in front of the nearest parallax layer (PARALLAX.NEAR_Z -10). Legibility-first:
  // a prop can never cover the player, a coin, a route, or a mechanic.
  Z_BACK: -8,     // parallax-adjacent background props (reeds, distant tombstones, banners on far walls)
  Z_SURFACE: -3,  // on-surface props resting on ledges/floors (crates, torches, urns) — in front of back props
},
```

### Anti-Patterns to Avoid
- **Positive-z or z-0 props.** Any prop at z ≥ 0 can render over the player/coins/route → violates the locked "never cover the player" + §8.5 legibility mandate. Keep both prop z values negative.
- **Adding `area()` or `body()` to a prop.** Instantly non-validator-neutral: reachability/over-hole/key-lock checks would see a phantom obstacle. Props are sprite+pos+z ONLY.
- **Putting `props` inside `geometry`.** Breaks the byte-freeze proof and exposes props to the structural validator's iteration. Keep it top-level.
- **Dense/foreground dressing.** The CONTEXT is explicit and this is the exact failure the human sign-off exists to catch. Sparse accents only.
- **Baking props with `_remap_luminance()`.** That is the achromatic-grey trap (ART-PARITY-STEERING facts #8/#9). Props keep native color; only `hue_shift_band` retint is allowed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Prop depth ordering | A custom per-frame sort or manual draw loop | Kaplay `z()` component (already used by parallax.js) | Engine sorts by z then insertion order for free. |
| Prop sprite retint | A bespoke recolor | `hue_shift_band(im, lo, hi, delta)` in build-art-assets.py | The exact no-pink pass the approved boards used (town `215,255,-60`; cemetery `195,245,-50`). |
| Prop cropping from packs | Manual pixel math | Pre-sliced pack files (`props-sliced/`, `sliced-objects/`) + `Image.crop`/`islands()` | Town/cemetery already ship named single-prop PNGs; use them directly. |
| "Does this prop path exist?" | Ad-hoc checks | `check-assets-manifest.mjs` existence gate | Kills the silent-404 class; every manifest entry is verified on disk. |
| Geometry-freeze proof | Eyeballing diffs | A JSON-snapshot gate (`check-geometry-frozen.mjs`) | A git diff can't isolate `geometry` from `props` in the same file; a re-import snapshot can. |

**Key insight:** Every hard sub-problem here (depth, retint, existence, freeze) already has a proven seam in this repo — the phase is composition, not invention.

## Runtime State Inventory

> Rename/refactor-adjacent because of the `theme-N` cleanup. Answered explicitly per category.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None.** Props are session-only visual entities; `progress.js`/localStorage store only xp/level/accuracy/history/cleared/secretFound. No prop or theme state is persisted. | none |
| Live service config | **None.** Static game; no external services. | none |
| OS-registered state | **None.** | none |
| Secrets/env vars | **None.** | none |
| Build artifacts / dead theme assets | **Dead `theme-N` BAKE CODE lives in `scripts/build-art-assets.py`** (see §"Old Tint-Theme Cleanup"): `build_ground_theme`, `build_parallax_theme`, `_THEME_ACCENTS`, `THEME_PALETTES`, `_accent_sub`/`_mid_accent_sub`/`_near_accent_sub`, and the `__main__` loop lines 1476–1478. These would REGENERATE orphaned `assets/tiles/ground-theme-*.png` + `assets/parallax/{far,mid,near}-theme-*.png` on the next bake. **No `theme-*.png` files currently exist on disk** (verified: `find assets -name "*theme*" -not -path "*/_*-src/*"` → empty), so nothing to delete on disk today — the risk is a future bake re-creating them. | Delete the dead bake functions + `__main__` loop lines; update 2 stale comments (`build.js:79`, `main.js:103`) and the `screenshot-phase26.mjs:171` comment. |

## Old Tint-Theme Cleanup (Q5 — dead vs. live, verified)

**DEAD (safe to delete):**
- `scripts/build-art-assets.py` lines 1476–1478 (`for theme_id, palette in THEME_PALETTES.items(): build_ground_theme(...); build_parallax_theme(...)`) — the only callers.
- `build_ground_theme` (def @230), `build_parallax_theme` (def @508), `_accent_sub` (@305), `_mid_accent_sub` (@330), `_near_accent_sub` (@383), `_THEME_ACCENTS` (@434), and `THEME_PALETTES` — all only feed the dead loop. They save `ground-theme-*.png` / `far-theme-*.png` / `mid-theme-*.png` / `near-theme-*.png`, which are NOT loaded anywhere (manifest-driven load loop in main.js only handles `biome-atlas`/`biome-bg`).
- Stale COMMENTS mentioning the old theme system: `src/main.js:103` ("hand-written per-theme-N block"), `src/levels/build.js:79` ("old theme-aware groundSprite ternary"), `scripts/screenshot-phase26.mjs:171` ("theme-tinted ground/parallax").

**LIVE (do NOT touch — the biome path):**
- `build_biome_atlas_{swamp,town,cemetery,castle}` and `build_biome_parallax_{...}` (@847–1160) — these bake the shipped `atlas-*`/`bg-*-*` assets.
- `build_parallax()` (@465, saves base `far.png`/`mid.png`/`near.png`) and `build_ground()` (@202) — still produce shipped assets loaded by main.js (`bg-far`/`bg-mid`/`bg-near`). Non-theme; leave alone.

**BORDERLINE — flag, do NOT delete without a decision:**
- `CONFIG.PALETTE.ACCENT_MOSS..ACCENT_EMBER` (config.js:43–50). **Not consumed by any `src/` render code** (verified: `grep -rn "ACCENT_" src/ | grep -v config.js` → empty), so dead for rendering. **BUT `scripts/check-contrast.mjs` references `ACCENT_`** — deleting these palette entries would break the contrast gate. These are not `theme-`-named and are out of the CONTEXT's stated cleanup scope ("dead theme-N assets + residual `theme-` references"). **Recommendation: leave `ACCENT_*` as-is this phase** (or, if the plan wants them gone, it must also update `check-contrast.mjs` — treat as a separate, optional task, not part of the props deliverable).

## Prop Sprite Sourcing + Bake (Q2)

### What already exists per biome (vendored, style-board-approved Phase 31)

| Biome | Levels | Pre-sliced named props available | Sheet(s) | Vocabulary richness |
|-------|--------|----------------------------------|----------|---------------------|
| swamp | 1–2 | `Evironment/props.png` (176×43, small multi-prop strip), `Evironment/trees.png` (288×208, tree crowns via `islands()`) | `gothicvania_swamp_files/.../Evironment/` | **THIN** — needs `islands()`/crop; may source extra CC0 (reeds, bones, vines) |
| town | 3–4 | `props-sliced/`: **barrel, crate, crate-stack, sign, street-lamp, wagon, well** (+ house-a/b/c) | `gothicvania-town-files/.../PNG/environment/props-sliced/` | **RICH** — direct named files |
| cemetery | 5–6 | `sliced-objects/`: **statue, stone-1..4, tree-1..3, bush-large, bush-small** | `gothicvania-cemetery-files_1/.../PNG/Environment/sliced-objects/` | **RICH** — direct named files |
| castle | 7–8 | `church/ENVIRONMENT/column.png` (114×190); Old-dark-Castle + Gothic-Castle tilesets (torches/banners/chains must be cropped from tilesets) | `gothicvania-church-files/`, `gothicvaniapatreoncollection/Gothic-Castle-Files/`, `Old-dark-Castle-tileset-Files/` | **THINNEST** — column only pre-sliced; torches/banners/chains need tileset crops OR extra CC0 sourcing |

**Implication for the "source extra CC0 where thin" decision:** swamp and especially **castle** are the biomes most likely to need additional CC0 props. Town and cemetery are covered by existing sliced files. This is why the trial pair should include a thin biome (swamp) — it exercises the sourcing + license + pink-gate pipeline, not just placement. `[VERIFIED: filesystem — ls of pack dirs + PIL image sizes, this session]`

### Bake pipeline (mirrors `_bake_biome_atlas`, minus scaling/remap)

`scripts/build-art-assets.py` is where props bake. Recommended new function per prop (or a small per-biome helper):
```python
def bake_prop(out_name, src_path, crop=None, retint=None):
    im = Image.open(src_path).convert("RGBA")
    if crop: im = im.crop(crop)          # or islands(im)[k] for multi-prop sheets
    if retint:                            # per-biome no-pink pass, board's own tuples:
        lo, hi, delta = retint            #   town: (215, 255, -60)   cemetery: (195, 245, -50)
        im = hue_shift_band(im, lo, hi, delta)   # swamp/castle: measure first; 0% pink → no retint
    save(im, os.path.join(ROOT, "assets", "props", f"{out_name}.png"))
```
Rules carried from ART-PARITY-STEERING (normative):
- **NEVER call `_remap_luminance()` on props** — that is the grey-static trap (fact #8/#9). Native color only.
- **NEVER scale a crop to fit a cell** (fact #9). Props are free-size sprites, unlike the 16×32 terrain cells.
- **Retint is design, not gate-appeasement** (fact #6): reuse the exact `hue_shift_band` tuples the approved boards used, then let `check-pink-gate.sh` validate the OUTPUT.
- **styleboard.py is the normative reference for what each biome's scene contains** — its `swamp()`/`town()`/`cemetery()`/`castle()` functions already load `trees.png`, `props-sliced` items, `sliced-objects/statue.png` + `stone-1.png`, `church/column.png`, etc. Name exact source paths + crop rects in the PLAN (the sizing note: "art tasks must name exact source paths, crop rects, and retint tuples").

### License / credit step (for any newly-sourced CC0)
- Existing pack licenses already live in `assets/LICENSES/` (gothicvania-swamp.txt, -town.txt, -cemetery.txt, -church.txt, -patreon.txt). Props cropped from these packs are ALREADY covered.
- Any NEW CC0 source: add a `assets/LICENSES/<source>.txt`, a `CREDITS.md` entry, named files only, and it MUST clear `check-pink-gate.sh` (retint if the scan flags >~8–10% pink/magenta opaque pixels).

## The Assets-Manifest + Gates (Q3)

### Manifest wiring
`src/assets-manifest.js` is a pure-data array; add one entry per prop sprite with a NEW `kind: "prop"`:
```javascript
{ key: "prop-town-barrel", path: "assets/props/town-barrel.png", kind: "prop" },
```
Then extend main.js's manifest load loop with a branch (it currently only handles `biome-atlas`/`biome-bg`):
```javascript
// src/main.js, inside the `for (const a of ASSETS_MANIFEST)` loop
} else if (a.kind === "prop") {
  loadSprite(a.key, webPath);   // single-frame static sprite (Phase 36 animates)
}
```
Update the manifest header comment's entry count (currently "37 entries total") when props land.

### Gates that MUST stay green after props
| Gate | What it proves for props | Notes |
|------|--------------------------|-------|
| `node scripts/check-assets-manifest.mjs` | Every declared prop path exists on disk | Kills silent-404. Add prop entries → gate covers them automatically. |
| `bash scripts/check-pink-gate.sh` | No new prop art exceeds the pink threshold | Scans shipped `assets/` recursively (prunes `_*-src/`). Retint town/cemetery/any-pink props. |
| `node scripts/validate-levels.mjs` | Structural geometry still valid; reachability unaffected | Props are top-level → the validator's `geometry.*` iteration never sees them (validator-neutral by construction). Must stay 0 HARD-FAIL. |
| `bash scripts/check-terrain-atlas.sh` | Terrain atlases unchanged (SAW/GREY/GAP/SLAB) | Props don't touch `assets/tiles/`; gate should be untouched-green. Re-run after any `build-art-assets.py` edit (the theme-code deletion counts). |
| `node scripts/browser-boot.mjs` | Real-browser boot across all 8 levels; FPS floor + object budget | Props add game objects → watch `CONFIG.TERRAIN.OBJECT_BUDGET` (650) and `FPS_FLOOR` (40). Restrained density keeps levels ~400–420 objects; a few dozen props is safe, but the budget IS a live ceiling — see Pitfall 2. |
| NEW `check-geometry-frozen.mjs` | The frozen arrays are byte-identical to post-34.6 | See §"Geometry-Frozen Enforcement". |

## Geometry-Frozen Enforcement (Q4)

**Problem:** props live in the same `.js` file as the frozen `geometry`, so a raw `git diff src/levels/level-0N.js` can't isolate "geometry unchanged" from "props added."

**Recommended mitigation — a node-import snapshot gate (`scripts/check-geometry-frozen.mjs`):**
1. At phase start (a commit at/after 34.6 HEAD), capture a golden: for each `LEVEL_ORDER` id, `JSON.stringify(getLevel(id).geometry)` → write to `scripts/fixtures/geometry-frozen-baseline.json` (a committed golden, same pattern as smoke-progress golden fixtures).
2. The gate re-imports every level and compares `JSON.stringify(geometry)` against the baseline; any diff is a HARD-FAIL naming the level + key.
3. Because `props` is a TOP-LEVEL field, adding props never changes `geometry` → the gate stays green through the whole re-dress. If someone accidentally nudges a coin/platform, it fails loudly.

This is the concrete form of the standing "geometry-frozen art diffs" cross-cutting mitigation (#4). It is standalone/pure-data (never wired into `check-gate.sh`), matching validate-levels/check-assets-manifest convention. `validate-levels.mjs` is a weaker backstop — it would catch a geometry change that breaks reachability, but NOT a benign-but-unauthorized tweak; the snapshot gate is the real proof. `[VERIFIED: build.js reads geometry via g=levelData.geometry; validate-levels iterates geometry.* only — this session]`

## Common Pitfalls

### Pitfall 1: A prop at z ≥ 0 covers the player
**What goes wrong:** Prop renders over the player/coin/route, violating the locked legibility mandate.
**Why:** All gameplay entities are z(0), sorted by insertion order; a z-0 prop emitted after the player, or any positive-z prop, draws on top.
**How to avoid:** Both prop z values NEGATIVE (`Z_BACK -8`, `Z_SURFACE -3`). Never author a positive z.
**Warning signs:** The human sign-off shot shows a prop in front of the character; a coin partly hidden behind a crate.

### Pitfall 2: Prop count pushes a level over the object budget / FPS floor
**What goes wrong:** `browser-boot.mjs` HARD-FAILs on `OBJECT_BUDGET` (650) or `FPS_FLOOR` (40).
**Why:** Every prop is a game object; a switchback spire level (04/06/08) already runs ~400–420 objects.
**How to avoid:** Restrained density (the locked decision) keeps props to dozens per level, well under headroom. Check the per-level object count after dressing each level. Static props are cheap (no per-frame update), but they still count.
**Warning signs:** browser-boot object-count assertion climbing toward 650; FPS dipping near 40 on the heaviest level.

### Pitfall 3: A partly-transparent multi-panel source tiled/mis-cropped
**What goes wrong:** Baking a whole multi-prop sheet (swamp `props.png`, cemetery `objects.png`) as one sprite bakes gutters/adjacent props into a single prop.
**Why:** These are SHEETS, not single props (ART-PARITY-STEERING fact #4 — the "odd bits and pieces" class).
**How to avoid:** Use the PRE-SLICED files (`props-sliced/`, `sliced-objects/`) or `islands()`/explicit crop rects per prop — never tile a preview sheet.
**Warning signs:** A prop sprite shows two objects or a hard-edged background rectangle.

### Pitfall 4: On-surface prop floats above or sinks below the ledge
**What goes wrong:** `y` set to the surface line instead of `surfaceY - spriteHeight` → prop hangs in air; or wrong anchor.
**Why:** Kaplay `pos` default anchor is top-left; the surface is where the prop's BASE should sit.
**How to avoid:** For `layer: "surface"`, `y = surfaceY - propPixelHeight` (measure the baked PNG height). styleboard's `put_feet` helper documents the exact per-biome feet-Y measurement discipline — reuse that reasoning.
**Warning signs:** Prop visibly floating or its feet buried in the ground in the sign-off shot.

### Pitfall 5: Re-baking regenerates dead theme PNGs
**What goes wrong:** Deleting the dead theme code is skipped; a future `python3 scripts/build-art-assets.py` re-creates `ground-theme-*.png` etc., re-littering `assets/`.
**Why:** The `__main__` loop still calls the theme bakers.
**How to avoid:** Delete the loop lines 1476–1478 AND the now-unused functions in the same commit; re-run the bake and confirm no `*theme*.png` reappears; re-run `check-pink-gate.sh` + `check-terrain-atlas.sh`.

## Code Examples

### Loading props via the manifest loop (main.js)
```javascript
// Source: src/main.js existing manifest loop (lines 106–117), extended
for (const a of ASSETS_MANIFEST) {
  const webPath = `../${a.path}`;
  if (a.kind === "biome-atlas") {
    loadSprite(a.key, webPath, { sliceX: 3, sliceY: 1 });
  } else if (a.kind === "biome-bg") {
    loadSprite(a.key, webPath);
  } else if (a.kind === "prop") {          // NEW
    loadSprite(a.key, webPath);            // static single-frame (Phase 36 adds anims)
  }
}
```

### Per-level screenshot capture (reuse the phase33 skeleton)
```javascript
// Source: scripts/screenshot-phase33-terrain.mjs (lines 128–176), cloned per the
// "Playwright script duplication is deliberate" binding rule — copy, don't extract.
const OUT_DIR = new URL("../.planning/phases/35-biome-re-dress-props/prop-shots/", import.meta.url).pathname;
mkdirSync(OUT_DIR, { recursive: true });
for (let i = 0; i < LEVEL_ORDER.length; i++) {
  // go("game", { levelId }); wait for boot; then:
  await page.screenshot({ path: join(OUT_DIR, `level-${String(i+1).padStart(2,"0")}-${biome}-spawn.png`) });
  // For any level whose bounds.top < 0 (the vertical levels 02/04/06/08 — keyed on GEOMETRY,
  // NOT level parity; level-07 is odd AND horizontal, bounds.top 0): also drive/teleport to
  // bounds.top and capture a climb shot. Everything else gets a spawn shot only.
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-level `theme-N` luminance-remapped tint on shared base art | Per-BIOME native-color atlas + parallax auto-selected from `descriptor.biome` | Phase 32 (`f6a386e`) | The biome look already ships; Phase 35 only ADDS a props layer. |
| Props implied by baked-in background art (styleboard scenes) | Hand-placed `props` entities per descriptor | Phase 35 (this) | Props become authorable/per-level, not baked into one static plate. |
| No rendered-pixel gate | `check-terrain-atlas.sh` (first pixel gate) + screenshot scripts + human checkpoints | Phase 33 | "Checks that don't play the game lie" — human sign-off is load-bearing for look/legibility. |

**Deprecated/outdated:**
- `theme-N` bake functions (`build_ground_theme`/`build_parallax_theme`/`_THEME_ACCENTS`) — dead since Phase 32; delete this phase.
- `_remap_luminance()` for anything colored (terrain/parallax/props) — correct ONLY for flat Kenney-silhouette sprite bakes.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Z_BACK -8` / `Z_SURFACE -3` are the right depth values | Patterns / config | LOW — any two negative values in `(-10, 0)` satisfy the constraint; exact values are confirmed visually at the trial checkpoint. `[ASSUMED]` (design pick) |
| A2 | Restrained prop density stays under `OBJECT_BUDGET` 650 | Pitfall 2 | LOW–MED — verified per-level via browser-boot after dressing; if a level approaches the ceiling, thin props. `[ASSUMED]` |
| A3 | Castle is the biome most likely to need extra CC0 sourcing | Sourcing table | LOW — based on filesystem inventory (only `column.png` pre-sliced); could crop torches/banners from the castle tilesets instead. `[VERIFIED: filesystem]` for inventory; `[ASSUMED]` for "needs extra." |
| A4 | `ACCENT_*` palette entries are safe to LEAVE (not delete) | Cleanup | LOW — verified unused in src/ but referenced by check-contrast.mjs; leaving them is the conservative default. `[VERIFIED: grep]` |
| A5 | Trial pair = level-01 (swamp) + level-06 (cemetery) | Summary / trial | LOW — within CONTEXT's recommendation; confirm at planning. `[ASSUMED]` (discretion) |

## Open Questions (RESOLVED)

1. **Which exact 2 levels are the trial?**
   - What we know: CONTEXT recommends two DIFFERENT biomes at different intensities; swamp is the thin-vocabulary biome, cemetery/town are rich, the vertical/intense levels are the even ones (2/4/6/8; keyed on `bounds.top < 0`, never on parity alone).
   - What's unclear: swamp-calm + cemetery-vertical vs. swamp-calm + town-vertical.
   - Recommendation: **level-01 (swamp, calm, thin vocabulary — exercises sourcing) + level-06 (cemetery, vertical switchback, rich vocabulary — exercises density-vs-legibility + climb-altitude screenshots).** Confirm at the discuss/plan boundary.
   - RESOLVED: plan 02 uses the trial pair level-01 (swamp, calm) + level-06 (cemetery, vertical switchback) as recommended.

2. **Do castle torches/banners/chains come from tileset crops or new CC0?**
   - What we know: no pre-sliced castle props exist; the Old-dark-Castle + Gothic-Castle tilesets contain wall torches/banners; `church/column.png` is a usable pillar.
   - What's unclear: whether tileset crops give enough variety or extra CC0 is cleaner.
   - Recommendation: try tileset crops first (no new license step), fall back to CC0 sourcing per the locked decision. Decide during the castle-level dressing (after the trial proves the pipeline).
   - RESOLVED: plan 05 Task 2 adopts castle tileset-crops-first, with CC0 sourcing only where the crops are too thin.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| python3 + Pillow | Prop bake (`build-art-assets.py`) | ✓ (used Phases 31–34) | installed | — |
| node (ES modules) | manifest/frozen-geometry/validator gates | ✓ | system | — |
| Playwright | per-level screenshots (`screenshot-phase35-props.mjs`) | ✓ (resolved dynamically; used by browser-boot + screenshot scripts) | installed | — |
| Kaplay | render props (`z()`, `sprite()`) | ✓ vendored | 3001.0.19 pinned | — (no upgrade, out of scope) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.
*(Re-verify Pillow/Playwright presence at Wave 0 if unsure, but STATE.md records both as installed for v6.0.)*

## Validation Architecture

> `workflow.nyquist_validation` is not explicitly false → section included. This project has NO JS test framework; the `.mjs`/`.sh`/`.py` gate scripts + browser-boot + human checkpoints ARE the suite.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no-build/no-dep canon). Gate scripts + Playwright harness. |
| Config file | none |
| Quick run command | `node scripts/validate-levels.mjs && node scripts/check-assets-manifest.mjs` |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/check-assets-manifest.mjs && bash scripts/check-terrain-atlas.sh && bash scripts/check-pink-gate.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs` |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | Exists? |
|-----|----------|-----------|-------------------|---------|
| ART-06 | `props` emitted as sprites with NO collider | structural | `node scripts/validate-levels.mjs` (0 HARD-FAIL; reachability/over-hole/key-lock unaffected) | ✅ |
| ART-06 | Props carry no `area()`/`body()` | code review + import-safety | `bash scripts/check-import-safety.sh` (a727c13) + manual read of the build.js prop loop | ✅ |
| ART-06 | Every prop sprite path exists | existence | `node scripts/check-assets-manifest.mjs` | ✅ (covers new `kind:"prop"` entries automatically) |
| ART-07 | Geometry byte-frozen through re-dress | snapshot | `node scripts/check-geometry-frozen.mjs` (NEW — Wave 0) | ❌ Wave 0 |
| ART-07 | No new prop art is pink | pixel | `bash scripts/check-pink-gate.sh` | ✅ |
| ART-07 | Terrain atlases untouched | pixel | `bash scripts/check-terrain-atlas.sh` | ✅ |
| ART-07 | All 8 levels boot + perform with props | browser | `node scripts/browser-boot.mjs` (FPS floor 40, object budget 650) | ✅ |
| ART-07 | Biome look + prop legibility (§8.5) | **human** | `node scripts/screenshot-phase35-props.mjs` (NEW) → `checkpoint:human-verify` | ❌ Wave 0 (screenshot script); sign-off is human-only |

### Sampling Rate
- **Per task commit:** `node scripts/validate-levels.mjs && node scripts/check-assets-manifest.mjs && node scripts/check-geometry-frozen.mjs`
- **Per wave merge:** add `bash scripts/check-pink-gate.sh && bash scripts/check-terrain-atlas.sh && node scripts/browser-boot.mjs`
- **Phase gate:** full suite green + the 2-level trial human sign-off (mid-phase) + a remaining-6 spot-check sign-off before `/gsd-verify-work`.

### What is provably automatable vs. human-only
- **Automatable:** collider-absence/validator-neutrality (validate-levels), geometry freeze (snapshot gate), asset existence (manifest), no-pink (pink gate), terrain-unchanged (terrain-atlas gate), boot/perf (browser-boot).
- **HUMAN-ONLY (§8.5-style "feel"/legibility):** "props are atmospheric, not obscuring," "the route/coin/hazard is still readable," "the biome reads right." No gate looks at whether a *composed scene* is legible — this is exactly the class the "black mess" checkpoints existed to catch. The `checkpoint:human-verify` is load-bearing and must NOT be auto-approved (standing precedent; MEMORY: "never rubber-stamp checkpoints").

### Wave 0 Gaps
- [ ] `scripts/check-geometry-frozen.mjs` + `scripts/fixtures/geometry-frozen-baseline.json` — proves the frozen arrays (ART-07 / mitigation #4). Capture the baseline from the phase-start commit.
- [ ] `scripts/screenshot-phase35-props.mjs` — per-level spawn + climb-altitude shots for the trial + spot-check sign-off (clone `screenshot-phase33-terrain.mjs`; copy-not-extract per the duplication convention).
- [ ] `CONFIG.PROPS.{Z_BACK,Z_SURFACE}` in config.js; `kind:"prop"` branch in main.js manifest loop; `props ?? []` loop in build.js.

## Security Domain

`security_enforcement` is not configured for this project and the phase has **no security surface**: no auth, no network, no user input parsing, no persistence changes (props are session-only visual sprites), no new dependencies. Static client-only game served over HTTP. ASVS categories V2–V6 are all **not applicable** — there is no trust boundary introduced by adding decorative sprites. (The only "input" is level DATA authored in-repo, covered by the validator + frozen-geometry gate.) No threat patterns apply.

## Sources

### Primary (HIGH confidence — verified in-repo this session)
- `src/levels/build.js` — emit order, entity idioms, `?? []` guards, no-z default → z(0) world band.
- `src/config.js` — `PARALLAX.{FAR,MID,NEAR}_Z` (-30/-20/-10), `TERRAIN.OBJECT_BUDGET`/`FPS_FLOOR`, no existing PROPS block, dead `ACCENT_*` palette.
- `src/parallax.js` — the only user of `z()` in world space (negative z), screen-locked anchoring.
- `src/scenes/game.js` — buildLevel-before-player order, parallax-then-player, onSceneLeave sweeps.
- `src/main.js` + `src/assets-manifest.js` — manifest-driven load loop (`biome-atlas`/`biome-bg` branches), 37-entry manifest.
- `src/levels/level-01.js` — descriptor shape (top-level `biome`/`mechanics`/`parallax`; `geometry` object).
- `scripts/build-art-assets.py` — `_bake_biome_atlas` (crop/retint/no-remap/no-scale rules), dead `build_ground_theme`/`build_parallax_theme`/`_THEME_ACCENTS` + `__main__` loop 1476–1478.
- `scripts/check-assets-manifest.mjs`, `check-pink-gate.sh`, `check-terrain-atlas.sh`, `validate-levels.mjs`, `screenshot-phase33-terrain.mjs`, `browser-boot.mjs` — gate mechanics.
- `.planning/research/v6-scouting/styleboard.py` — normative biome scene composition; names the exact prop source files per biome.
- `.planning/research/ART-PARITY-STEERING.md` — the binding facts (#4 sheet-vs-prop, #6 retint-is-design, #8/#9 no-remap/no-scale, gate-blindness → human screenshots).
- Filesystem/PIL inventory of vendored packs — per-biome pre-sliced prop availability + image sizes.

### Secondary (MEDIUM)
- `grep` audits (theme refs, ACCENT usage, z usage) — this session.

### Tertiary (LOW)
- Design picks (exact z values, trial pair) — confirmed at the human checkpoint, not asserted as fact.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; every tool already in-repo and used by prior phases.
- Architecture (props data model + z-ordering + renderer): HIGH — z landscape fully enumerated from source; the only design freedom (exact negative z values) is low-risk and checkpoint-confirmed.
- Sourcing/bake: HIGH for inventory (filesystem-verified), MEDIUM for "which biome needs extra CC0" (castle inferred).
- Pitfalls/gates: HIGH — all gates read + cross-referenced against ART-PARITY-STEERING history.
- Cleanup dead-vs-live: HIGH — verified by grep (no shipped theme PNGs; ACCENT_ unused in src but referenced by contrast gate).

**Research date:** 2026-07-16
**Valid until:** 2026-08-15 (stable — engine pinned, no external deps; re-verify only if `build-art-assets.py` or the manifest changes before planning).
