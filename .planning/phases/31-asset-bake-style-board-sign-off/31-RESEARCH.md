# Phase 31: Asset Bake & Style-Board Sign-off - Research

**Researched:** 2026-07-10
**Domain:** Pillow-based pixel-art asset baking, license/credit vendoring discipline, HSV-based automated color gate, shell gate-script conventions
**Confidence:** MEDIUM (HIGH for repo-internal conventions verified by direct read; LOW/ASSUMED for the one external technique not yet proven live in this repo — the dominant-hue percentage scan)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Biome Pack Selection & Player Candidate**
- Anchor collection: the Gothicvania family (ansimuz), all CC0 — ASSET-SCOUTING.md's Option 1, already style-boarded across all 4 renders.
- Biome → level mapping: Swamp (1–2) / Town (3–4) / Cemetery (5–6) / Castle (7–8) — the Castlevania calm→harsh arc, CONFIRMED by direct kid feedback on the actual style-board images ("Can they not all be there, just different levels?" — read as approval of all 4 biomes existing, each mapped to its own level pair, not a request to cut any).
- **Player sprite: Swamp Hunter (9-anim set) ships as the player across ALL 4 biomes** — kid's explicit pick over Gothic Hero after viewing the style board. This overrides the pre-work's default framing (Gothic Hero appeared in 3 of 4 renders); the style board must be regenerated showing Swamp Hunter in the town/cemetery/castle renders too, not just swamp.
- **Castle biome enemy: Hell hound replaces the fire skull** — kid's explicit complaint ("The monster in the castle biome is ugly") plus Claude's recommendation, accepted. Bonus: Hell hound is also the Phase 36 patrol-enemy candidate (ground-runner with a run cycle), so this pick avoids a second decision later — but wiring actual patrol MOVEMENT is still Phase 36's job, not this phase's (this phase only vendors/bakes the static sprite).
- Gothicvania Church does NOT ship as its own biome — fold its usable interior tileset/background accents into the Castle biome (levels 7–8) only, matching the "3–4 biomes covering 8 levels" requirement wording.

**Style-Board Sign-off Process**
- The existing 4 style-board renders (built in pre-work, 640×360 exact internal res, NOX RUN badge overlaid) get REGENERATED via `styleboard.py` with the two decisions above baked in: Swamp Hunter as the player in all 4 renders, Hell hound in place of the fire skull in the castle render. The original renders are pre-decision reference material, not the artifact to sign off on.
- **Today's kid feedback (via the parent, live during discuss) is genuine round 1 — real, specific, and it already changed the plan (player swap, enemy swap).** It does NOT substitute for the execute-phase's formal `checkpoint:human-verify` gate. The regenerated board must still be shown fresh at execute time and get explicit re-confirmation — never treat "liked the concept" as "approved the final baked asset." Standing project precedent: never rubber-stamp a `checkpoint:human-verify` gate (Phases 25/27/28).
- Record the sign-off with both rounds quoted verbatim (today's discuss-round quotes above, plus whatever the execute-phase confirmation round produces) in the phase SUMMARY.md or a small dedicated sign-off note — matches this project's evidentiary standard for human-verify gates.
- The parent (user) may give the final execute-phase sign-off themselves — same standard as Phase 26 (logo) / Phase 27 (audio), which were both signed off by the parent alone. Getting the kid's read when possible (as happened today) is a bonus, not a hard requirement for every round.

**Pink-Scan Gate & Hue-Conform Pipeline**
- Detection technique: HSV hue-range scan (Pillow) over each vendored PNG's opaque pixels, flagging pixels in the pink/magenta hue band — same technique already proven in `styleboard.py`'s hue-rotation pass on the town/cemetery skies.
- **Threshold: relaxed to ~8–10% of opaque pixels in the pink/magenta hue band** (explicit user correction — "she dislikes pink but we don't have to hunt it like it is the plague"). This only trips when pink is a DOMINANT hue (a whole sky, a whole character) — small incidental pink pixels (a highlight, a tiny detail) pass freely. Still HARD-FAIL tier when it does trip, since a dominant-pink asset at that threshold is unambiguously a real violation, not noise.
- Known pink assets to retint: the Town dusk sky (salmon-pink) and the Cemetery horizon glow (magenta) — the same two flagged in ASSET-SCOUTING.md, retinted via the same Pillow hue-conform approach already validated in the style-board renders (steel-blue/cold-blue results). The gate re-runs on both post-retint as regression proof.
- Gate location: a new standalone script (`scripts/check-pink-gate.sh` or `.mjs`), sibling to the existing `check-*.sh` gate family — not folded into `check-safety.sh`.

**Atlas/Anchor-Lip Convention & Vendoring Scope**
- Anchor/lip convention: 16×32-compatible cap tiles (matches `CONFIG.TILE_SIZE = 16` and the existing 16×32 player collider), with the lip offset in px written down explicitly in a doc (new `ART-CONVENTIONS.md` or a new section in `docs/LEVEL-DESIGN.md` — Claude's discretion on exact location, not on whether it's written).
- Baking happens via an extension of the existing `scripts/build-art-assets.py` (Pillow, the same reproducible-pipeline convention already used for `player.png`/`ground.png` per CREDITS.md's Phase 20 correction) — not one-off manual crops.
- Explicitly excluded from vendoring: all music/audio files in every zip (CC-BY per ASSET-SCOUTING.md note #2 — Phase 27 already owns audio, and this content isn't ours to ship anyway), any enemy/prop variant not selected for the 8 levels, and any Gothicvania Patreon-collection sub-pack not selected (only the Gothic Castle env + Old Dark Castle interior + Gothic Hero-adjacent bestiary pieces actually used).
- Credits/licenses: follow the exact existing `CREDITS.md` table-row format (Asset / File / Author / Source / License / Used for), one `assets/LICENSES/<name>.txt` proof file per vendored asset group — same discipline as every existing row in that file.

### Claude's Discretion
- Exact doc location for the anchor/lip convention write-up (new file vs. new section in `docs/LEVEL-DESIGN.md`).
- Exact HSV hue-band bounds (degrees) for the pink-scan gate, as long as the ~8–10% dominant-pixel threshold and HARD-FAIL severity hold.
- Exact file/directory naming for the new vendored biome atlases under `assets/` (follow existing `assets/tiles/`, `assets/parallax/` sibling-directory conventions).

### Deferred Ideas (OUT OF SCOPE)
- Hell hound's actual patrol/motion wiring (`patrol()`, waypoints, speed) — explicitly Phase 36 (World Motion & Ambient Life). This phase only vendors and bakes the static sprite.
- Terrain autotiling, multi-layer parallax integration, and player/entity animation wiring into `build.js`/game code — explicitly Phases 32 and 33.
- Any further biome/pack changes beyond the two decided swaps (player, castle enemy) — not raised, out of scope unless a future sign-off round surfaces something new.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ART-01 | One style-coherent sourced dark pixel-art collection (ansimuz Gothicvania anchor, 3–4 biomes) vendored with licenses/credits via the existing CREDITS.md + assets/LICENSES/ process; style-board mock screen gets human sign-off BEFORE any integration; automated pink-hue scan gate added (no pink asset can land) | Package Legitimacy Audit (N/A — no new dependencies), Architecture Patterns (bake pipeline extension), Don't Hand-Roll (reuse styleboard.py/build-art-assets.py idioms), Common Pitfalls (missing source packs, HSV P-mode trap, non-grid sheet cutting), Code Examples (HSV scan skeleton, gate script skeleton) |
</phase_requirements>

## Summary

This phase has no new runtime code and no new dependency — it is a **Pillow-only, offline asset-baking and documentation phase** whose single hardest constraint is a **critical planning risk verified this session: the actual Gothicvania pack ZIP/PNG source files are NOT present anywhere in this repository or on this filesystem.** `.planning/research/v6-scouting/styleboard.py` reads from `ROOT = .../v6-scouting/extracted` — that `extracted/` directory does not exist, was never committed, and a full-filesystem search (`find / -iname "*gothicvania*"`) found nothing outside the committed preview crops and the four already-baked `style-board-*.png` renders. ASSET-SCOUTING.md itself says the downloads live in "this session's scratchpad" — a prior, now-gone Claude session's temp workspace, not this one. **The plan MUST open with a re-fetch task** (`curl`/`wget` the exact 5 OGA zip URLs already recorded in ASSET-SCOUTING.md, unzip into a new `assets/_gothicvania-src/` sibling to the existing `_kenney-src/`/`_opengameart-src/` vendored-source convention) before any regeneration or baking step can run.

Once the source files exist locally, the rest of the phase is straightforward extension of two already-proven, already-committed pipelines: `styleboard.py` (regenerate the 4 renders with the Swamp Hunter player + Hell hound swap already decided) and `scripts/build-art-assets.py` (extend with new `build_biome_atlas_<name>()` functions appended to its existing unconditional `if __name__ == "__main__":` call list, mirroring the already-established per-variant pattern of `build_ground_theme()`/`build_parallax_theme()`). A brand-new fourth piece — the automated pink-hue gate — is genuinely new code but a small, self-contained Pillow HSV scan that can reuse `styleboard.py`'s own `hue_shift_band()` idiom (already live-proven on this exact art) almost verbatim, just counting instead of mutating.

**Primary recommendation:** Sequence the plan as (1) re-fetch the 5 OGA zips into `assets/_gothicvania-src/`, verify each `public-license.txt`/OGA page still says CC0 — a live re-verification, not a re-derivation of ASSET-SCOUTING.md's conclusion; (2) regenerate the style board with the two locked swaps and get the human sign-off gate BEFORE touching anything else; (3) write the anchor/lip convention doc; (4) extend `build-art-assets.py` with hand-identified crop-rectangle constants per biome (NOT a generic auto-slicer — Gothicvania terrain sheets are non-grid decorative blocks, confirmed by SPIKE-FINDINGS.md); (5) write the `check-pink-gate.sh` HSV scan gate and prove it both fails-red on the two known pink assets pre-retint and passes green post-retint; (6) write CREDITS.md rows + `assets/LICENSES/*.txt` proofs in the exact existing format.

## Architectural Responsibility Map

This phase has no browser/server/API tiers — it is offline build tooling + version-controlled static assets + documentation. The standard web-tier table does not apply; the equivalent "which layer owns this" mapping is:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Source pack re-fetch + license re-verification | Offline dev tooling (curl/unzip, human-run) | — | One-time, outside any runtime; result is committed as `assets/_gothicvania-src/` (vendored source), mirroring `_kenney-src/`/`_opengameart-src/` |
| Style-board mock rendering | Offline Python/Pillow tooling (`styleboard.py`) | — | Pure compositing script, no engine/browser involved; output is a static PNG for human eyeballs |
| Biome atlas baking (crop/scale/palette-remap) | Offline Python/Pillow tooling (`build-art-assets.py`) | — | Extends the existing ONE reproducible pipeline; never hand-edited PNGs |
| Pink-hue detection gate | CI/local shell gate (`scripts/check-*.sh` family) | Offline Python/Pillow (the actual HSV scan) | Shell script is the uniform invocation surface every other gate uses; Pillow does the real pixel math, same division of labor as `check-progress.sh` shelling out to `smoke-progress.mjs` |
| License/credit documentation | Docs (`CREDITS.md`, `assets/LICENSES/*.txt`) | — | Human-readable provenance record, no code consumes it |
| Anchor/lip convention documentation | Docs (`docs/LEVEL-DESIGN.md` or new `docs/ART-CONVENTIONS.md`) | — | Read by future phases (32/33) authoring/consuming atlases, not by runtime code this phase |
| Human sign-off (style board) | Human-in-the-loop (`checkpoint:human-verify`) | — | Explicitly outside automation — the whole point of this phase's hard gate |
| Vendored final assets | Version-controlled storage (`assets/`) | — | Consumed by Phases 32/33/35's `src/` code, but wiring is explicitly OUT of this phase's scope |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pillow | 10.2.0 (confirmed installed this session via `python3 -c "import PIL"`) | All image compositing, HSV scanning, palette remap | Already the project's ONE image-processing dependency (`scripts/build-art-assets.py`, `styleboard.py`); no new dependency introduced |

### Supporting
None — this phase adds zero new dependencies. `curl`/`wget`/`unzip` (already available on the dev machine, standard POSIX tools) are the only "new" tools invoked, and only as one-off manual/scripted fetch steps, not runtime dependencies.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pillow HSV pixel-loop scan | numpy vectorized hue histogram | numpy is NOT currently vendored/imported anywhere in this repo's Python scripts (`build-art-assets.py`'s own docstring says "no numpy"); adding it would be a new dependency for a one-off gate script — not worth it at these image sizes (atlases are small, tens of KB) |
| Manual per-tile crop rectangles | A generic connected-component auto-slicer (`styleboard.py`'s own `islands()` helper) | `islands()` works for isolated sprite blobs on transparent backgrounds (characters/enemies/props) but NOT for terrain tilesets — Gothicvania terrain sheets are decorative ~32px interlocking blocks sharing edges, not isolated islands (confirmed by SPIKE-FINDINGS.md's note that the spike's own atlas crop used a hand-identified pixel coordinate, `x512,y152`). Terrain atlas cutting needs hand-identified crop rects, like `build_door()`'s existing `im.crop((0, 64, 48, 160))` pattern — a real precedent already in this codebase |

**Installation:** None required — Pillow is already installed and used.

**Version verification:** `python3 -c "import PIL; print(PIL.__version__)"` → `10.2.0`, confirmed live this session. This matches the version already implicitly in use by `build-art-assets.py`/`styleboard.py` (no separate venv/lockfile in this no-build-step project — Pillow is a system/user Python package, verify its presence rather than pin a version file).

## Package Legitimacy Audit

**Not applicable this phase.** No new package is installed, imported, or vendored as code — Pillow is an existing, already-in-use dependency (confirmed present, `10.2.0`), and the Gothicvania art files are static assets (PNG/license text), not executable packages. The Package Legitimacy Gate protocol targets code dependencies (npm/pip/cargo packages) and does not apply to vendored art asset files.

**Packages removed due to [SLOP] verdict:** none (N/A — no packages evaluated)
**Packages flagged as suspicious [SUS]:** none (N/A — no packages evaluated)

## Architecture Patterns

### System Architecture Diagram

```
[OGA pack URLs, ASSET-SCOUTING.md]
        |
        | (1) re-fetch: curl/wget + unzip  <-- MISSING TODAY, must run first
        v
[assets/_gothicvania-src/<pack>/...]  (raw extracted pack files, vendored-source convention)
        |
        |--> (2) styleboard.py regenerate  --> .planning/research/v6-scouting/board/style-board-*.png
        |         (Swamp Hunter in all 4, Hell hound in castle)
        |         --> checkpoint:human-verify (round 2, execute-time, genuine)
        |
        `--> (3) build-art-assets.py EXTENDED with build_biome_atlas_<name>()
                  (hand-identified crop rects per biome sheet, same _remap_luminance
                   pipeline already used for ground/parallax)
                  --> assets/tiles/atlas-<biome>.png, assets/parallax/<layer>-<biome>.png,
                      assets/player-swamphunter.png, assets/enemy-hellhound.png, ...
                  |
                  v
        (4) scripts/check-pink-gate.sh  <-- NEW gate, scans every vendored PNG's
              opaque pixels for >=8-10% pink/magenta-hue-band dominance;
              HARD-FAILs on Town sky + Cemetery glow pre-retint (RED-first proof),
              PASSes after the Pillow hue-conform retint (regression proof)
                  |
                  v
        (5) CREDITS.md rows + assets/LICENSES/<name>.txt proofs
                  |
                  v
        (6) docs/LEVEL-DESIGN.md (or new ART-CONVENTIONS.md): anchor/lip convention
              written down (16x32 cap tile, lip offset in px)

[Everything above is OUT OF `src/` — Phase 32/33/35 later read these assets into
 build.js / player.js / mechanics; that wiring is explicitly not this phase's job.]
```

### Recommended Project Structure
```
assets/
├── _gothicvania-src/          # NEW — raw extracted OGA pack files (vendored-source
│                               #   convention, sibling to _kenney-src/, _opengameart-src/)
│   ├── gothicvania-swamp/
│   ├── gothicvania-town/
│   ├── gothicvania-cemetery/
│   ├── gothicvania-church/     # accents only, folded into castle biome
│   └── gothicvania-patreon-collection/
├── tiles/
│   └── atlas-<biome>.png       # NEW — baked 16x32-cap-tile terrain atlases (naming: Claude's discretion)
├── parallax/
│   └── <layer>-<biome>.png     # NEW — per-biome parallax layers (far/mid/near), same suffix convention as far-theme-1.png etc.
├── player-swamphunter.png      # NEW — the single locked player sprite sheet (used across all 4 biomes)
├── enemy-hellhound.png         # NEW — castle biome enemy (static sprite only this phase)
└── LICENSES/
    └── gothicvania-<pack>.txt  # NEW — one proof file per vendored asset group

scripts/
├── build-art-assets.py         # EXTENDED — new build_biome_atlas_* functions appended
└── check-pink-gate.sh          # NEW — sibling to check-gate.sh/check-safety.sh/etc.

docs/
└── LEVEL-DESIGN.md              # EXTENDED (or new ART-CONVENTIONS.md) — anchor/lip convention section

.planning/research/v6-scouting/
└── styleboard.py                # EXTENDED IN PLACE — regenerate with Swamp Hunter + Hell hound swap
```

### Pattern 1: Extend the ONE baking pipeline with per-variant functions, never a parallel script
**What:** `build-art-assets.py` already has an established idiom for "same shape, new source/output": `build_ground()` → `build_ground_theme(theme_id, palette)`, `build_parallax()` → `build_parallax_theme(theme_id, palette)`. New biome atlas bakers should follow this exact shape: a `build_biome_atlas(biome_id, crop_rects, palette)`-style function (or one function per biome if crop rects differ enough to make a shared signature awkward), appended to the bottom `if __name__ == "__main__":` block alongside the existing calls.
**When to use:** Any time this phase adds a new baked output — never create a second top-level script.
**Example:**
```python
# Source: scripts/build-art-assets.py (existing, already-shipped pattern)
def build_ground_theme(theme_id, palette):
    """Per-level-theme variant of build_ground() (VIS-03; Phase 26 Plan 03).
    Byte-identical body to build_ground() above ... except the sub-palette is a
    parameter and the output path is suffixed — the original build_ground()/
    ground.png stays an untouched fallback asset.
    """
    # ... same crop/resize/_remap_luminance body as build_ground(), suffixed output path
```

### Pattern 2: Hand-identified crop rectangles for non-grid terrain sheets
**What:** SPIKE-FINDINGS.md documents that Gothicvania sheets are NOT uniform 16px grids — terrain comes as decorative ~32px blocks with ~20–24px gold cap lips, and the spike's own atlas was cut from one hand-identified pixel region (`x512,y152` on the Old Dark Castle sheet). `build_door()` already establishes this exact idiom in this repo (`im.crop((0, 64, 48, 160))` — a hardcoded rectangle on a known sheet, not a generic slicer).
**When to use:** Every biome's terrain/cap-tile atlas bake. Do NOT reach for `styleboard.py`'s `islands()` connected-component helper here — that is for isolated sprite blobs (characters/enemies/props on transparent backgrounds), not interlocking tileset blocks.
**Example:**
```python
# Source: scripts/build-art-assets.py's existing build_door() (repo-verified pattern)
def build_door():
    sheet_path = os.path.join(ROOT, "assets", "_opengameart-src", "6-color-dungeon", "16x16-dungeon-tiles.png")
    im = Image.open(sheet_path).convert("RGBA")
    crop = im.crop((0, 64, 48, 160))  # hand-identified rect, documented in the docstring
    resized = crop.resize((target_w, target_h), Image.NEAREST)
```

### Pattern 3: HSV hue-band pixel-percentage scan (new for this phase, but a one-line generalization of existing code)
**What:** `styleboard.py`'s `hue_shift_band()` already converts an RGBA image to HSV and iterates every pixel checking `band_lo <= hh <= band_hi and s >= min_sat`. The pink-scan gate needs the read-only half of exactly this loop: count pixels matching the band (restricted to opaque pixels, `alpha > 0`) and divide by total opaque pixel count.
**When to use:** `scripts/check-pink-gate.sh`'s underlying Python scan, invoked per vendored PNG under `assets/` (excluding `_*-src/` raw source dirs, which are pre-bake and not shipped).
**Example:**
```python
# Adapted from styleboard.py's live hue_shift_band() (this repo, verified working)
from PIL import Image

def pink_fraction(path, band_lo, band_hi, min_sat=30):
    rgba = Image.open(path).convert("RGBA")
    a = rgba.getchannel("A")
    hsv = rgba.convert("RGB").convert("HSV")  # MUST go via RGB first — direct
                                                # P-mode->HSV convert() raises
                                                # ValueError on Pillow >=6.0 (verified: Pillow issue #3997)
    hpx, apx = hsv.load(), a.load()
    w, h = hsv.size
    opaque = pink = 0
    for y in range(h):
        for x in range(w):
            if apx[x, y] == 0:
                continue
            opaque += 1
            hh, s, v = hpx[x, y]
            if s >= min_sat and band_lo <= hh <= band_hi:
                pink += 1
    return (pink / opaque) if opaque else 0.0
```

### Anti-Patterns to Avoid
- **Writing a second, parallel Pillow "bake" script instead of extending `build-art-assets.py`:** breaks the project's "ONE reproducible pipeline" convention (explicitly called out in CONTEXT.md and CREDITS.md's Phase 20 correction note about the old procedural-placeholder script).
- **Converting a loaded PNG straight to `"HSV"` without first going through `"RGB"`:** raises `ValueError: conversion not supported` on Pillow ≥6.0 for palette-mode images (Pillow issue #3997) — always `im.convert("RGBA").convert("RGB").convert("HSV")`, exactly as `styleboard.py` already does.
- **Scanning ALL pixels (including fully-transparent padding) for the pink percentage:** would silently dilute or inflate the ratio depending on how much transparent padding a given sprite sheet has; always gate on `alpha > 0` pixels only, as CONTEXT.md's threshold explicitly says ("opaque pixels").
- **Auto-slicing terrain sheets with a generic grid or connected-component algorithm:** Gothicvania terrain blocks are non-uniform and interlocking — this will silently produce a wrong/ugly atlas that LOOKS automated-correct but isn't (the exact "checks that don't look at pixels lie" failure mode SPIKE-FINDINGS.md already warns about for the tiled-fill spike). Always visually verify each hand-cropped tile before baking it into the final atlas.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Style-board mock rendering | A new Pillow compositing script from scratch | Extend `styleboard.py` in place (it already handles tiling, badge overlay, hue-shift, contact-sheet assembly) | It is already proven, already produces the exact 640×360/1.5×-scale renders this phase needs to regenerate — a rewrite risks silently changing composition that was already kid-reviewed |
| Palette conformance across biomes | A new remap function | Reuse `_remap`/`_remap_luminance` from `build-art-assets.py` if/when biome atlases need palette conformance | Already handles the "narrow dark palette destroys detail" pitfall this project already hit once (see `_remap_luminance`'s own docstring) |
| Pink/magenta hue detection | A bespoke color-distance heuristic (Euclidean RGB distance to a pink swatch) | The existing HSV hue-band technique already proven in `hue_shift_band()` | HSV hue isolates "is this color in the pink/magenta family" independent of lightness/saturation noise far better than RGB distance; the codebase already trusts this technique for the inverse operation (retinting) |
| License/credit record-keeping | A new format/template | The exact existing `CREDITS.md` table row format + `assets/LICENSES/<name>.txt` free-text proof convention | 19 existing rows and 19 existing proof files already establish the exact expected shape (see Code Examples below) — deviating creates an inconsistent record for a project that treats this file as an audit trail |

**Key insight:** Every piece of infrastructure this phase needs already exists in nearly-final form somewhere in this repo (a rendering script, a baking script, a hue-shift function, a credits table, a gate-script skeleton). The actual net-new work is small: one re-fetch step, some new hand-identified crop rectangles, one new small gate script, and documentation. Resist the urge to rewrite any of the proven pieces.

## Common Pitfalls

### Pitfall 1: The source pack files do not exist in this session's environment
**What goes wrong:** Any task that assumes `styleboard.py` or a new baking function can just run today will fail immediately — `ROOT = .../v6-scouting/extracted` does not exist, and no `gothicvania`/`ansimuz` file was found anywhere on this filesystem (`find / -iname "*gothicvania*"` returned nothing outside this repo's own preview PNGs and markdown).
**Why it happens:** ASSET-SCOUTING.md was produced in a *different* Claude session, "outside the GSD harness," that downloaded the zips into its own now-gone scratchpad (`scouting/`). Only the preview crops, the 4 already-baked style-board renders, and the markdown/Python source were committed to git — the raw pack files themselves were never vendored.
**How to avoid:** The FIRST task in the plan must fetch the 5 zip URLs verbatim from ASSET-SCOUTING.md's table (`gothicvania_swamp_files.zip`, `gothicvania-town-files.zip`, `gothicvania-cemetery-files_1.zip`, `gothicvania%20church%20files.zip`, `%20gothicvania%20patreon%20collection.zip` — all `opengameart.org/sites/default/files/...`), unzip them into a new `assets/_gothicvania-src/` (mirroring `_kenney-src/`/`_opengameart-src/`), and re-verify each pack's bundled `public-license.txt` / OGA page still says CC0 before proceeding.
**Warning signs:** Any task description that says "regenerate styleboard.py" without an explicit prior "re-fetch the packs" task is planning a step that will fail at execute time with a `FileNotFoundError`.

### Pitfall 2: Direct P-mode → HSV conversion throws in modern Pillow
**What goes wrong:** `Image.open(path).convert("HSV")` on a palette-mode (`"P"`) PNG raises `ValueError: conversion not supported` on Pillow ≥6.0 (this project runs 10.2.0).
**Why it happens:** Pillow's HSV converter only supports RGB-mode source images; PNGs are commonly loaded in P or RGBA mode.
**How to avoid:** Always chain `.convert("RGBA").convert("RGB").convert("HSV")` — exactly the sequence `styleboard.py`'s `hue_shift_band()` already uses, live-proven in this repo.
**Warning signs:** A crash trace mentioning `ValueError: conversion not supported` the first time the new gate script is run against a P-mode source PNG.

### Pitfall 3: Treating terrain sheets like isolated sprite sheets
**What goes wrong:** Reusing `styleboard.py`'s `islands()` connected-component cropper on a terrain tileset sheet (rather than a character/enemy sheet) will either merge unrelated tile blocks into one "island" (since terrain tiles touch/share edges) or split a single intended tile into fragments.
**Why it happens:** `islands()` was written for isolated blobs on transparent backgrounds (trees, characters, standalone props) — SPIKE-FINDINGS.md is explicit that terrain sheets are decorative, non-16px-grid, interlocking blocks.
**How to avoid:** Use hand-identified pixel-coordinate crop rectangles per tile (like `build_door()`'s existing `im.crop((0, 64, 48, 160))`), verified by opening the source PNG in an image viewer or via a quick Pillow crop-and-save-preview loop, not an automated slicer.
**Warning signs:** A baked atlas that visually shows partial/cut-off decorative elements, or duplicate/missing tile variants versus what the source sheet actually contains.

### Pitfall 4: Rubber-stamping the style-board sign-off
**What goes wrong:** Treating today's live kid feedback (captured in CONTEXT.md, real and specific) as if it already satisfies the phase's formal `checkpoint:human-verify` gate, and skipping the execute-time re-confirmation.
**Why it happens:** The feedback IS genuine and DID already change the plan (player + enemy swap) — it is tempting to treat that as "done."
**How to avoid:** CONTEXT.md is explicit and this is standing project precedent (Phases 25/27/28): the REGENERATED board (with both swaps baked in) must be shown fresh at execute time and get its own explicit round of confirmation, quoted verbatim in the phase's sign-off record. Two distinct rounds, both quoted.
**Warning signs:** A SUMMARY.md or sign-off note that only quotes today's discuss-phase feedback and has no second, execute-time quote.

### Pitfall 5: Scanning transparent padding pixels for the pink threshold
**What goes wrong:** If the scan iterates every pixel in the image (not just `alpha > 0` pixels), a sprite with a lot of transparent padding around a small pink accent could either be falsely diluted (never trips) or, worse, a sprite with almost all its content in a small opaque region could get a skewed ratio depending on how the denominator is computed.
**Why it happens:** It's a natural coding shortcut to just loop `for y in range(h): for x in range(w)` without checking alpha first.
**How to avoid:** CONTEXT.md's decision explicitly frames the threshold as "% of opaque pixels" — always gate on `getchannel("A")` per-pixel, count only where alpha > 0, for BOTH the numerator and the denominator.
**Warning signs:** The gate flags/misses assets inconsistently versus a manual visual check.

## Code Examples

Verified patterns from this repo's own already-shipped, already-working code (not external docs — this project's Pillow pipeline predates and is more authoritative than any generic Pillow tutorial for this exact codebase):

### Hue-band mutation (existing, reuse as the model for detection)
```python
# Source: .planning/research/v6-scouting/styleboard.py (this repo, already executed/committed)
def hue_shift_band(im, band_lo, band_hi, delta, min_sat=30):
    """Rotate hue by `delta` for pixels whose hue is in [band_lo, band_hi] (PIL 0-255 hue)."""
    rgba = im.convert("RGBA")
    a = rgba.getchannel("A")
    hsv = rgba.convert("RGB").convert("HSV")
    px = hsv.load()
    w, h = hsv.size
    for y in range(h):
        for x in range(w):
            hh, s, v = px[x, y]
            if s >= min_sat and band_lo <= hh <= band_hi:
                px[x, y] = ((hh + delta) % 256, s, v)
    out = hsv.convert("RGB").convert("RGBA")
    out.putalpha(a)
    return out
```

### Hardcoded crop-rectangle bake pattern (existing, model for new biome atlas bakers)
```python
# Source: scripts/build-art-assets.py's build_door() (this repo, already shipped)
def build_door():
    target_w, target_h = 32, 64
    sheet_path = os.path.join(ROOT, "assets", "_opengameart-src", "6-color-dungeon", "16x16-dungeon-tiles.png")
    im = Image.open(sheet_path).convert("RGBA")
    crop = im.crop((0, 64, 48, 160))  # 48x96 — closed lattice gate + archway base
    resized = crop.resize((target_w, target_h), Image.NEAREST)
    remapped = _remap_luminance(resized, ENVIRONMENT_PALETTE)
    assert remapped.size == (target_w, target_h), f"door sprite wrong size: {remapped.size}"
    save(remapped.convert("RGBA"), os.path.join(ROOT, "assets", "door.png"))
```

### CREDITS.md row format (existing, exact format to replicate)
```markdown
| Asset | File | Author | Source | License | Used for |
|-------|------|--------|--------|---------|----------|
| Gothicvania Swamp (tileset/bg/player/enemies) | `assets/tiles/atlas-swamp.png`, ... | ansimuz | https://opengameart.org/sites/default/files/gothicvania_swamp_files.zip | CC0 | Levels 1–2 swamp biome terrain/bg/player/enemies |
```

### `assets/LICENSES/<name>.txt` proof format (existing, exact format to replicate)
```
Asset:        assets/tiles/atlas-swamp.png (biome terrain atlas — N frames)
Source pack:  "Gothicvania Swamp"
Author:       ansimuz
Source URL:   https://opengameart.org/sites/default/files/gothicvania_swamp_files.zip
License:      CC0 (Creative Commons Zero / Public Domain)

Quoted license declaration from the pack's own bundled license file:
    "<paste exact text found in the re-fetched pack's public-license.txt>"

CC0 full text:  https://creativecommons.org/publicdomain/zero/1.0/

Verification: License page and the pack's own bundled license file both
confirmed CC0 this session (<date>). NOT CC-BY.

Vendor logo / brand art: none.
```

### Gate-script shell conventions (existing family style to match)
```bash
#!/usr/bin/env bash
# check-pink-gate.sh — the ART-01 no-pink automated gate (HSV dominant-hue scan).
#
# The project has NO JS test framework, so this script IS the automated per-commit
# check for the no-pink rule across every vendored asset PNG. Threshold: ~8-10%
# of an asset's OPAQUE pixels landing in the pink/magenta hue band is a HARD-FAIL
# (CONTEXT.md's relaxed threshold — small incidental pink pixels must NOT trip it).
#
# Run from the repo root:
#   bash scripts/check-pink-gate.sh
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"

fail() { echo "pink-gate checks: FAIL — $1" >&2; exit 1; }

python3 "$ROOT/scripts/lib/pink_scan.py" "$ROOT/assets" || fail "one or more assets exceed the pink/magenta dominant-hue threshold (see output above)"

echo "pink-gate checks: PASS"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Kenney/6-Color-Dungeon generic CC0 fill art (Phase 18/20/26) | Gothicvania (ansimuz) purpose-styled Castlevania-register CC0 art | This phase (v6.0 kickoff, SEED-001) | First real style-coherent, artist-matched art collection — supersedes the "grab whatever's CC0 and palette-remap it dark" approach that shipped v4.0/v5.0 |
| No automated color-palette gate | Automated HSV pink/magenta dominant-hue scan gate | This phase | First time a *content* (not just code-safety) property gets an automated gate in this project's script family |

**Deprecated/outdated:** none — this phase doesn't remove any prior art (existing `assets/player.png`, `ground.png`, etc. are Phase 32/33's concern to retire, not this phase's).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 5 OGA zip URLs recorded in ASSET-SCOUTING.md are still live/unchanged today (2026-07-10, ~2 days after the 2026-07-07/08 scouting session) | Common Pitfalls #1, Architecture Patterns diagram | Low — OGA is a stable long-running archive and the URLs are direct `sites/default/files/` asset paths, not session-scoped links; if a URL 404s, the OGA page itself (also linked in ASSET-SCOUTING.md) can be used to re-derive the current download link. Low risk, but not re-verified live this session — no network fetch was attempted (out of scope for a code-only research pass) |
| A2 | Pillow's `getcolors()`/pixel-loop percentage-scan pattern generalizes cleanly from `styleboard.py`'s existing per-pixel HSV loop without a meaningful performance problem | Architecture Patterns Pattern 3, Code Examples | Low — vendored art PNGs here are small (tens of KB, similar in scale to the existing `player.png`/`ground.png`/parallax layers, which the existing pure-Python double-loop code already processes without issue); a pure double-loop is adequate at these sizes, confirmed by this repo's own existing code running the equivalent-cost `hue_shift_band()` already |
| A3 | The exact HSV hue-band bounds (degrees) for "pink/magenta" are not yet fixed — CONTEXT.md leaves this to Claude's discretion, and the two known offending assets (Town sky ~215–255, Cemetery glow ~195–245, per `styleboard.py`'s own existing `hue_shift_band()` calls) are a reasonable starting anchor but the exact final band for the NEW gate script (as opposed to the retint pass) hasn't been chosen | User Constraints (Claude's Discretion), Architecture Patterns | Medium — too narrow a band could let a genuinely pink new asset (e.g. an unreviewed enemy variant) slip through; too wide could false-positive on warm reds/oranges/purples common in a dark-grunge palette. The planner should treat the exact band value as a tunable to be verified against BOTH known-bad assets (must trip) and a sampling of already-approved dark-grunge assets like `assets/player.png`'s neon-green accent or the rust/ember theme accents (must NOT trip) |

**If this table is empty:** N/A — see entries above.

## Open Questions

1. **Are the OGA zip URLs still resolvable today, and do the re-fetched packs' bundled license files still say CC0?**
   - What we know: ASSET-SCOUTING.md verified CC0 on 2026-07-07/08 via both the OGA page and each zip's own `public-license.txt`.
   - What's unclear: No live re-fetch was performed this research session (would require a network call outside this pass's scope); it's possible (though historically unlikely for OGA) that a page or file changed in the ~2-day gap.
   - Recommendation: The plan's first task must both fetch AND re-verify (grep the re-fetched `public-license.txt` for the same CC0 language quoted in ASSET-SCOUTING.md) before treating the license conclusion as re-confirmed, not just re-derived from memory.

2. **What are the exact hand-identified crop-rectangle pixel coordinates for each biome's terrain sheet?**
   - What we know: The general technique (hand crop rects, `build_door()`-style) and one worked example from a DIFFERENT pack (Old Dark Castle, `x512,y152`, from the Phase-30-adjacent spike, not this phase's actual bake).
   - What's unclear: The actual coordinates for Swamp/Town/Cemetery/Castle terrain sheets specific to THIS phase's chosen assets — these can only be determined by opening the re-fetched source PNGs once they exist locally (Open Question #1 blocks this).
   - Recommendation: Plan a dedicated task (with a human-eyeball or debug-preview-image checkpoint) to visually identify and record each biome's crop rectangles as code constants, following `build_door()`'s existing documented-rectangle convention — do not guess coordinates blind.

3. **Exact final hue-band bounds + doc location for the anchor/lip write-up** — both explicitly left to Claude's discretion by CONTEXT.md; see Assumptions Log A3 and User Constraints "Claude's Discretion" respectively. Recommendation: resolve both during planning/execution, not deferred further — CONTEXT.md is clear these are implementation details, not decisions requiring another user round.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Pillow (Python) | All baking/rendering/gate-scan code (`build-art-assets.py`, `styleboard.py`, new `check-pink-gate.sh`'s Python helper) | ✓ | 10.2.0 | — |
| python3 | Same as above | ✓ | present (Pillow import succeeded) | — |
| curl/wget + unzip | Re-fetching the 5 OGA zip packs (Pitfall 1) | Assumed ✓ (standard POSIX tools, not explicitly probed this session) | — | If unavailable, a manual browser download + local unzip is the fallback (same as the original scouting session likely did) |
| git | Vendoring `assets/_gothicvania-src/`, committing docs | ✓ (repo is a git working tree) | — | — |
| Playwright/browser | NOT required — this phase touches no `src/` game code and does no browser-driven verification | N/A | — | — |

**Missing dependencies with no fallback:** none identified.

**Missing dependencies with fallback:** curl/wget/unzip not explicitly probed this session (assumed present on a standard Linux dev box per this project's other scripts' `unzip`/shell usage) — if absent, the planner should note a manual-download fallback step.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (project convention: shell gate scripts + Python/Pillow scripts ARE the test suite — no pytest/jest) |
| Config file | none — see Wave 0 |
| Quick run command | `python3 scripts/lib/pink_scan.py assets/tiles/atlas-town.png` (single-asset spot check, once written) |
| Full suite command | `bash scripts/check-pink-gate.sh` (scans all vendored assets) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ART-01 | Vendored art has no dominant pink/magenta asset | gate script (RED-first against the 2 known pink assets, then GREEN post-retint) | `bash scripts/check-pink-gate.sh` | ❌ Wave 0 (new script) |
| ART-01 | Every vendored asset has a matching CREDITS.md row + LICENSES proof file | manual/structural check (no existing automated CREDITS-completeness gate in this repo) | grep-based spot check, e.g. `grep -c "gothicvania" CREDITS.md` vs. count of new asset files | ❌ no existing automation — consider a lightweight new check if the planner wants one, else manual review is acceptable given this project's existing precedent (CREDITS.md has never had an automated completeness gate) |
| ART-01 | Style-board sign-off is genuine (not rubber-stamped) | human-verify checkpoint, not automatable | `checkpoint:human-verify` task, both rounds quoted in SUMMARY.md | N/A — inherently manual |

### Sampling Rate
- **Per task commit:** run `bash scripts/check-pink-gate.sh` after any new asset lands (once the script exists) — before that, no automated check exists yet, so early tasks (re-fetch, style-board regen) rely on visual review only.
- **Per wave merge:** re-run `bash scripts/check-pink-gate.sh` over the full `assets/` tree.
- **Phase gate:** `check-pink-gate.sh` green + genuine (non-rubber-stamped) style-board sign-off, both required before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/check-pink-gate.sh` + its Python HSV-scan helper (e.g. `scripts/lib/pink_scan.py`) — does not exist yet, this phase creates it
- [ ] `assets/_gothicvania-src/` — does not exist yet, this phase's first task creates it via re-fetch
- [ ] No framework install needed — Pillow already present

*(No JS/pytest framework gap — this project has never used one and this phase doesn't need one.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — no auth surface in this phase |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | marginal | The re-fetch step downloads ZIP files from external URLs (opengameart.org) — treat as untrusted input: verify the downloaded file is actually a ZIP (not an HTML error page saved with a `.zip` extension) before `unzip`, and only extract into the intended `assets/_gothicvania-src/` subdirectory (never blindly `unzip` with absolute/traversal paths — standard `unzip` zip-slip caution, though OGA-hosted zips have no history of malicious content and this is a defense-in-depth note, not a specific known threat) |
| V6 Cryptography | no | N/A — no secrets/crypto in this phase |

### Known Threat Patterns for this phase's stack (offline Python asset tooling)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Zip-slip (a malicious zip entry path escaping the extraction directory, e.g. `../../etc/passwd`) | Tampering | Use Python's `zipfile` module (or `unzip` with default safe behavior) and verify each extracted path stays within the target directory before writing; low realistic risk here since OGA is a long-trusted, moderated art archive, but worth a one-line safety check given this is genuinely "download and extract a third-party archive" |
| Downloading a stale/wrong asset silently (e.g. a redirected/expired OGA URL serving a generic 404 page saved as `.zip`) | Tampering (of a sort — supply-chain integrity, not malice) | After download, verify the file is a valid zip (`unzip -t` or Python `zipfile.is_zipfile()`) before proceeding — a silent corrupt-file failure would otherwise surface confusingly deep in the bake pipeline |

## Sources

### Primary (HIGH confidence — repo-internal, directly read this session)
- `.planning/phases/31-asset-bake-style-board-sign-off/31-CONTEXT.md` — locked decisions, full text
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — project state/requirements
- `.planning/research/v6-scouting/ASSET-SCOUTING.md`, `SPIKE-FINDINGS.md`, `styleboard.py` — pre-work, consumed as verified fact per binding decision
- `scripts/build-art-assets.py` (full read) — existing baking pipeline conventions
- `scripts/check-progress.sh`, `scripts/check-safety.sh`, `scripts/check-gate.sh` (headers/relevant sections read) — gate-script shell conventions
- `CREDITS.md`, `assets/LICENSES/ground.txt` — exact credit/license format
- `src/config.js` (full read) — `TILE_SIZE`, `PALETTE`, existing sprite/atlas conventions
- `docs/LEVEL-DESIGN.md` (partial read) — level-authoring doc conventions, candidate location for the anchor/lip write-up
- Direct filesystem verification this session: `find / -iname "*gothicvania*"` (empty outside this repo's own committed files) and `find / -iname "*extracted*" -o -iname "*scouting*"` (empty outside this repo) — confirms the source pack files are genuinely absent

### Secondary (MEDIUM confidence)
- `python3 -c "import PIL; print(PIL.__version__)"` → `10.2.0` — live version verification this session

### Tertiary (LOW confidence — WebSearch only, flagged for validation)
- WebSearch: "Pillow Python HSV convert detect percentage of pixels within hue range" — surfaced the P-mode→HSV `ValueError` behavior (cross-referenced against Pillow GitHub issue #3997) and the general getcolors()-based percentage-threshold technique. This is corroborated (not merely assumed) by this repo's own already-working `hue_shift_band()` code, which independently confirms the `.convert("RGB").convert("HSV")` chain works — so the WebSearch finding is used only for the P-mode pitfall detail, not as the sole basis for the technique itself.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Pillow is already installed and in active use; version verified live this session
- Architecture: HIGH for the extension pattern (directly read existing code); MEDIUM for the new pink-gate script (new code, but built from proven primitives)
- Pitfalls: HIGH for Pitfall 1 (source packs missing) — directly verified via filesystem search this session, the single most important finding for the planner
- Pink-hue detection technique: MEDIUM/LOW — the general approach is sound and partially corroborated by this repo's own working code, but the exact hue-band bounds and threshold behavior have not been executed/tested against the actual (not-yet-fetched) art this session

**Research date:** 2026-07-10
**Valid until:** ~30 days (stable domain — Pillow/OGA/this repo's own conventions change slowly), EXCEPT the OGA URL liveness assumption (A1), which should be re-verified at execute time regardless of this document's age since it was never live-tested this session.
