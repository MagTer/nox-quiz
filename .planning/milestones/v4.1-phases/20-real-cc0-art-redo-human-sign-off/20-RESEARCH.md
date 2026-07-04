# Phase 20: Real CC0 Art Redo & Human Sign-off - Research

**Researched:** 2026-07-03
**Domain:** CC0 pixel-art sourcing/compositing pipeline (Kenney packs) + palette-remap tooling (PIL/Pillow) + process fix for genuine human visual sign-off, for a zero-build Kaplay 3001 static game
**Confidence:** HIGH (all packs downloaded and inspected directly this session; palette-remap technique tested end-to-end; sign-off gap confirmed by direct grep of every archived VERIFICATION.md in this repo)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Area 1: Art Source Selection**
- Player sprite (idle/run/jump, both facings): source from **Kenney's "Pixel Platformer"** CC0
  pack — it ships actual walk/jump animation frames, unlike the dungeon pack's single static
  figure.
- Ground/platform tileset (left/center/right/underside edge frames): source from the **same
  Kenney "Pixel Platformer"** pack for visual and technical consistency with the player sprite
  — it ships proper platformer tile-edge sets, unlike the dungeon pack.
- Parallax layers (far/mid/near) + title/select backdrop texture: source from a **Kenney
  background/atmosphere CC0 pack** (e.g. "Background Elements Redux" or equivalent) — same
  publisher/license process, purpose-built parallax-ready layers.
- `spike.png`, `goal.png`, `coin.png`: **untouched** — explicitly out of this phase's scope per
  ROADMAP.md (ART-05..08 name only player/tileset/parallax/title-select).

**Area 2: Palette & Visual Fit**
- Apply a **palette-remap pass** to sourced art: recolor onto the locked dark-grunge tokens
  (`#0a0a0a` bg-adjacent darks, `#00ff88` accent, `#66ccff` cleared-blue, `#e8e8e8` label,
  `#444444`/`#555555` greys, no pink) while preserving the real artist's shapes/silhouettes/detail
  — this is what makes it "real curated art," not just a different palette of noise.
- Player silhouette **must** stay light/bright (equivalent to `#e8e8e8`/`#d8d8d8` tones with a
  `#00ff88` accent detail) against the `#0a0a0a` background — this is a hard-won fix (a real
  playtest previously reported "I can't see the player sprite"; the current procedural script's
  own docstring records the pixel-sampling investigation). Verify contrast in-browser, not just
  from the source file, before sign-off.
- Parallax/title-bg follow the ROADMAP's own suggested motif: **distant ruin/structure
  silhouettes with a deliberate horizon rhythm** — composed scenery, not abstract shapes.
- **No new animation states or timing** beyond what `18-UI-SPEC.md` already locked (idle/run/jump
  state machine, camera-driven parallax only, no timers, 400–500ms flash/motion cap) — the
  technical contract carries forward unchanged.

**Area 3: License & Credits Process**
- **Rewrite** `assets/LICENSES/player.txt` and `ground.txt` to cite the new Kenney source
  (URL, exact frame/tile reference, quoted license line, verification date) — matching the
  existing format exactly (Asset / Source pack / Author / Source URL / Source file / Tile-or-frame
  ref / License / quoted declaration / CC0 full-text link / Verification / vendor-logo note).
- **Add new proof files** under `assets/LICENSES/` for parallax (one per asset, or one combined
  file if all three layers share a single source page) and for `title-bg.png`, in the same
  format.
- Update `CREDITS.md`'s player/ground rows to the new source, and add rows for parallax/title-bg
  — matching the existing table's rigor exactly (PROC-01's explicit bar).
- Record in the commit/CREDITS.md history that Phase 18 had shipped mislabeled procedural
  placeholders, now corrected — keeps the project record honest rather than silently overwriting
  (mirrors the honesty goal driving Phase 21).

**Area 4: Human Sign-off Mechanism (the PROC-02 process fix)**
- Sign-off means an explicit **AskUserQuestion checkpoint presented with real screenshots (or a
  live local URL)** of the running game — player animating in a real level, tileset tiling in a
  real level, parallax scrolling with the camera, styled title/select screens — where the user
  must affirmatively respond before verification can pass.
- This gate is **structural**, not advisory: `VERIFICATION.md` is written/left as `human_needed`
  until the explicit confirmation is recorded, using the same routing the autonomous workflow
  already has for human-needed verification (not a silent auto-pass on automated checks alone).
- If the human finds an issue at sign-off: treat it like any other gaps-found path — fix and
  re-present for a second sign-off round before marking passed.
- Sign-off re-confirms against **Phase 20's own 6 success criteria** (player silhouette/animation,
  tile seams, parallax composition, title/select hierarchy, license proof, genuine sign-off) —
  these supersede Phase 18's original ART-01..04 wording for this milestone.

### Claude's Discretion
- Exact number/choice of Kenney background pack for parallax (as long as CC0 and thematically a
  ruin/structure motif), exact palette-remap technique (recolor script vs. manual edit), exact
  tile-frame-to-pixel mapping within the locked 5-frame sheets, and exact wording of the
  corrected CREDITS.md history note are at Claude's discretion during implementation.

### Deferred Ideas (OUT OF SCOPE)
- Audio/SFX/music, more worlds/level packs, deployment hardening — all remain out of scope for
  v4.1 per PROJECT.md's "Not in scope" note; unchanged from Phase 18.
- Any gameplay/logic changes — this is an asset-and-process redo only.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ART-05 | Real curated player sprite, idle/run/jump, facing, readable silhouette on `#0a0a0a` (verified in-browser) | Standard Stack (Platformer Characters "Adventurer" pose set), Code Examples (crop+scale+pad+quantize pipeline), Common Pitfalls #1/#2/#6 |
| ART-06 | Real curated ground/platform tileset, designed edge/seam frames, actual material transition, tiles seamlessly | Standard Stack (Pixel Platformer grass/dirt tiles), Architecture Patterns (tile-frame mapping), Common Pitfalls #3 |
| ART-07 | Parallax layers depict composed scenery (ruin/structure silhouettes, horizon rhythm), camera-driven only, non-strobing | Standard Stack (Background Elements pack), Architecture Patterns (compositing recipe), Code Examples |
| ART-08 | Title/select use real panel framing/texture and visual hierarchy, dark-grunge, no pink | Standard Stack (Background Elements castle/temple motif for title-bg), Architecture Patterns |
| PROC-01 | Every new/replaced asset has CC0 proof in CREDITS.md + assets/LICENSES/*.txt matching existing rigor | Package Legitimacy Audit (license verification per pack), Code Examples (license-proof template) |
| PROC-02 | Phase cannot be marked verified without explicit human visual sign-off; not auto-approved on automated checks alone | Human Sign-off Mechanism Precedent (Runtime State Inventory is N/A; see dedicated section below), Common Pitfalls #7 |
</phase_requirements>

## Summary

This phase replaces four asset files (`assets/player.png`, `assets/tiles/ground.png`,
`assets/parallax/{far,mid,near}.png`, `assets/tiles/title-bg.png`) with real, licensed CC0 pixel
art, through Phase 18's unchanged technical contract, and closes a real process gap: **no phase
in this project's entire history has ever used a genuine, blocking, AskUserQuestion-based human
sign-off** — every prior `checkpoint:human-verify` either stayed `human_needed` indefinitely
(13, 14) or was self-declared "auto-approved in autonomous mode" on the strength of a passing
script and screenshots nobody was asked to look at (18, 19). This is confirmed directly from this
repo's own archived `VERIFICATION.md`/`SUMMARY.md` files, not assumed.

Three separate, verified, CC0 Kenney packs are recommended (all license-confirmed and
zip-downloaded this session): **"Platformer Characters"** (`Adventurer` pose set) for the player
— it has real named `idle`/`stand`/`walk1`/`walk2`/`jump` poses at 80×110px, a genuine walk
cycle, unlike the pack CONTEXT.md pointed at; **"Pixel Platformer"** for the ground/tileset — its
grass-over-dirt 18×18 tiles are real hand-drawn material-transition art (not edge-cap art, but
tileable and materially distinct from underside dirt tiles); and **"Background Elements"** for
parallax/title-bg — a flat-vector kit with explicit `castle.png`/`temple.png`/`tower.png`/
`mountain*.png` silhouette elements plus tileable `hills1/2.png` and `pointy_mountains.png` strips,
ideal raw material for the "ruin/structure silhouette with horizon rhythm" motif once composited
and palette-remapped.

**Critical correction to CONTEXT.md's Area 1 research:** direct inspection of the downloaded
Kenney "Pixel Platformer" zip this session shows its character tiles (`Tiles/Characters/*`,
24×24, 27 total) are static square mascot/blob figures (astronaut helmets, robots) with **no
leg/walk-cycle animation and no distinct jump pose** — the same single-static-figure problem
CONTEXT.md correctly identified in the *previous* "6 Color Dungeon" pack. CONTEXT.md's claim that
this pack "ships actual walk/jump animation frames" does not hold up under direct inspection and
should be treated as the one locked-decision claim in this phase requiring a course correction
(see Assumptions Log A1 and Open Question 1). The good news: a *different*, equally real, equally
CC0, same-publisher Kenney pack — **"Platformer Characters"** — exists specifically to solve this
and ships genuine idle/walk/jump poses. Using it for the player while still using "Pixel
Platformer" for the ground/tileset (as CONTEXT.md specified) fully satisfies the spirit of Area 1
without reopening the "real CC0 art, not placeholder" bar the phase exists to raise.

A nearest-color palette quantization technique (Pillow's `Image.quantize(palette=...,
dither=Dither.NONE)`) was tested end-to-end this session against a downscaled/cropped Adventurer
frame and against the locked palette tokens: the character remained recognizably humanoid,
correctly light-on-dark, using only locked palette colors. This is the concrete, scriptable
palette-remap technique the phase needs — not a hand-wave.

**Primary recommendation:** Build one Python/Pillow script (successor to
`scripts/generate-art-assets.py`, which stays as a labeled dev/prototyping tool per CONTEXT.md)
that (1) reads pre-downloaded Kenney source PNGs from a vendored `assets/_kenney-src/` staging
folder, (2) crops/scales/composites them onto the exact locked frame geometry, (3) palette-remaps
the result through the locked color tokens via `Image.quantize`, and (4) writes the final PNGs to
the exact existing asset paths — with license proof files written alongside, in the exact format
already established by `assets/LICENSES/*.txt`. The human sign-off must be a real, synchronous
`AskUserQuestion` call presenting real screenshots, gating `VERIFICATION.md`'s status — this
project's config (`mode: "yolo"`, `human_verify_mode: "end-of-phase"`) is exactly the setting that
let Phase 18's gate rubber-stamp itself, so the plan must design the sign-off task to be robust
against that default, not rely on it.

## Architectural Responsibility Map

This is a static, zero-build, zero-server client-only game — there is no backend/API/DB tier.
Everything lives in a single "Browser / Client" tier already established by Phase 18. This phase
does not introduce or move any responsibility across tiers; it only replaces asset *content*
consumed by tier-resident code that already exists and is unchanged.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Player sprite render + animation state machine | Browser / Client (Kaplay canvas) | — | `src/player.js` already owns this; asset swap only |
| Ground/platform tile visual selection | Browser / Client (Kaplay canvas) | — | `src/levels/build.js` `pickTopFrame()` already owns this; asset swap only |
| Parallax layer positioning | Browser / Client (Kaplay canvas) | — | `src/parallax.js` already owns this; asset swap only |
| Title/select backdrop + styling | Browser / Client (Kaplay canvas) | — | `src/scenes/title.js`/`select.js` already own this; asset swap only |
| Asset sourcing, cropping, palette-remap | Build-time tooling (Python/Pillow, offline, not shipped to the browser) | — | New responsibility this phase adds — a reproducible, auditable art pipeline that runs before commit, output is static PNGs, no runtime cost |
| License proof + credits bookkeeping | Static / Storage (flat files in git, `assets/LICENSES/*.txt`, `CREDITS.md`) | — | Documentation artifacts, not runtime code |
| Human visual sign-off | Human-in-the-loop (via `AskUserQuestion`, gating `VERIFICATION.md`) | — | Process fix this phase adds — not a code tier at all, but must be structurally represented in the plan's task graph as a blocking gate |

## Standard Stack

### Core

| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|---------------|
| Kenney "Platformer Characters" (Adventurer) | v2017-01-10 build, CC0 | Player idle/walk/jump pose source | Real named poses (`idle`, `stand`, `walk1`, `walk2`, `jump`) at 80×110px with genuine limb-pose variation — the only one of the three inspected Kenney character packs with an actual walk cycle. `[VERIFIED: kenney.nl — zip downloaded, License.txt confirmed CC0, poses inspected via PIL bbox]` |
| Kenney "Pixel Platformer" | v1.2, CC0 | Ground/tileset source (grass-over-dirt 18×18 tiles) | Real hand-drawn material-transition tiles (green grass cap + brown dirt body + pebble detail), genuinely tileable, distinct plain-dirt tiles available for underside frames. `[VERIFIED: kenney.nl — zip downloaded, License.txt confirmed CC0, tiles inspected visually]` |
| Kenney "Background Elements" | v1.0, CC0 | Parallax far/mid/near + title-bg raw material | Ships explicit `castle.png`/`temple.png`/`tower.png`/`mountain*.png`/`hills1-2.png`/`pointy_mountains.png`/`cloud*.png` as separate compositable silhouette elements — the exact "ruin/structure with horizon rhythm" motif the ROADMAP calls for, in a form built for exactly this compositing task. `[VERIFIED: kenney.nl — zip downloaded, License.txt confirmed CC0, elements inspected visually]` |
| Pillow (PIL) | 10.2.0 (confirmed installed) | Crop/scale/pad/quantize build pipeline | Already the project's own established tool (`scripts/generate-art-assets.py` already imports `PIL.Image`/`ImageDraw`); zero new runtime or dev dependency. `[VERIFIED: pip3 show pillow → 10.2.0 in this environment]` |
| `curl` + `unzip` | system | Fetch + extract Kenney zips | Both already used implicitly by this environment; no new tool install required. `[VERIFIED: successful downloads this session]` |

### Supporting

| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| `Image.quantize(palette=<P-mode image>, dither=Image.Dither.NONE)` | Pillow 10.2.0 API | Nearest-color-in-fixed-palette remap | Every sourced asset, as the final step before writing to `assets/` — forces every pixel onto one of the locked project hex tokens, no dithering noise, preserves real silhouette edges (unlike a manual bucket-threshold hack) |
| `Image.getbbox()` | Pillow 10.2.0 API | Content-bbox crop before resize | Any RGBA source frame with transparent padding (all Adventurer poses) — crop to real content before scaling, or the character shrinks inside dead padding |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kenney "Platformer Characters" for player | Kenney "Pixel Platformer" characters (CONTEXT.md's original pick) | Rejected on direct inspection — no walk-cycle frames exist in that pack; would reproduce the "one static figure" problem this phase exists to fix |
| Kenney "Background Elements" (flat-vector style) | Kenney "Pixel Platformer" `Tiles/Backgrounds` sub-sheet (24×24 pixel-art sky/hill tiles) | The Pixel Platformer background tiles are genuine pixel art (stylistically closer to the tileset) but have no ruin/structure motif, only tree silhouettes; Background Elements has the exact castle/temple/tower content the ROADMAP calls for. Style mismatch (vector-flat vs. pixel-art) is resolved by the palette-remap pass, which flattens both to the same solid dark tones anyway. Either is usable; Background Elements is the stronger content match. |
| Manual pixel-by-pixel palette editing | Pillow `Image.quantize` nearest-color remap | Manual editing doesn't scale across ~15+ output frames/tiles and isn't reproducible/auditable; `quantize` is one function call, deterministic, and was verified working this session |
| A brand-new procedural generator rewrite | Real vendored Kenney source art + build script | CONTEXT.md and REQUIREMENTS.md are explicit that procedural generation is precisely what's being replaced (PROC's whole premise); a "nicer" procedural generator would not satisfy ART-05..08, which require *real curated* art |

**Installation:**
```bash
# No new package installs required. Pillow is already present system-wide (10.2.0) and
# already imported by scripts/generate-art-assets.py. curl/unzip are already available.
python3 -c "import PIL; print(PIL.__version__)"   # sanity check before the build script runs
```

**Version verification:** Pillow version confirmed directly in this environment
(`pip3 show pillow` → 10.2.0, 2026-07-03). Kenney packs are not versioned via a package registry;
each pack's own bundled `License.txt` and the live kenney.nl page's `og:description` metadata
were both checked this session and both state "CC0 licensed" for all three packs — this is the
equivalent verification step for binary asset packs (there is no npm/pip registry to query).

## Package Legitimacy Audit

**Not applicable in the npm/pip/crates sense** — this phase installs zero new software packages.
Pillow (PIL) is an existing, already-used project dependency; no new library dependency is added
to any manifest. The equivalent supply-chain risk this phase actually carries is **binary asset
provenance** (are these really CC0, are they really from kenney.nl, not a spoofed mirror), which
was verified directly instead:

| Asset source | Domain | License stated on page | License stated in downloaded zip | Verdict | Disposition |
|---------------|--------|-------------------------|-----------------------------------|---------|--------------|
| Kenney "Pixel Platformer" | kenney.nl (fetched directly, HTTP 200) | `og:description`: "...CC0 licensed!" | `License.txt`: "License: (Creative Commons Zero, CC0)" | OK | Approved |
| Kenney "Platformer Characters" | kenney.nl (fetched directly, HTTP 200) | `og:description`: "...CC0 licensed!" | `License.txt`: "License (Creative Commons Zero, CC0)" | OK | Approved |
| Kenney "Background Elements" | kenney.nl (fetched directly, HTTP 200) | page states "Creative Commons CC0" (linked) | `License.txt`: "License (Creative Commons Zero, CC0)" | OK | Approved |

**Packages removed due to [SLOP] verdict:** none (n/a — no software packages installed).
**Packages flagged as suspicious [SUS]:** none.

**Zip URL stability note (flag for the planner, not a blocker):** each Kenney zip URL contains a
content-hash path segment (e.g. `.../33bb4921eb-1696667883/kenney_pixel-platformer.zip`) that
Kenney may rotate on a future page re-publish. The *page* URLs (`kenney.nl/assets/pixel-platformer`,
`kenney.nl/assets/platformer-characters`, `kenney.nl/assets/background-elements`) are the stable,
citable reference for `assets/LICENSES/*.txt`; the executor should re-resolve the zip URL from the
live page at execution time rather than hard-coding today's hash indefinitely, and record whichever
URL was actually used in the proof file (exactly as the existing `assets/LICENSES/*.txt` files already
do for the OpenGameArt source).

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ BUILD-TIME (offline, not shipped to browser)                        │
│                                                                       │
│  kenney.nl (3 pack pages)                                            │
│        │  curl (direct zip URL, confirmed non-JS-gated download)     │
│        ▼                                                             │
│  assets/_kenney-src/  (vendored raw source zips + extracted PNGs,    │
│                        kept for reproducibility/audit trail)         │
│        │                                                             │
│        ▼                                                             │
│  scripts/build-art-assets.py  (successor to generate-art-assets.py)  │
│    1. crop to content bbox (Image.getbbox)                           │
│    2. scale to locked frame geometry, uniform scale factor           │
│       per asset group (not per-frame independently — Pitfall #2)     │
│    3. composite (parallax/title-bg: paste multiple silhouette        │
│       elements onto one canvas at locked dimensions)                 │
│    4. palette-remap via Image.quantize(palette=locked_tokens,        │
│       dither=Dither.NONE)                                            │
│    5. write PNG to the exact existing asset path                     │
│        │                                                             │
│        ▼                                                             │
│  assets/player.png, assets/tiles/ground.png,                         │
│  assets/parallax/{far,mid,near}.png, assets/tiles/title-bg.png       │
│        │                                                             │
│        ▼                                                             │
│  assets/LICENSES/*.txt + CREDITS.md  (proof files, same format as    │
│  existing player.txt/ground.txt/etc., cross-matched by row)          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ git commit (static PNGs + docs, zero
                              │ runtime dependency added)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ RUNTIME (Browser / Client — UNCHANGED from Phase 18)                 │
│                                                                       │
│  src/main.js loadSprite(...) [unchanged calls, same paths]            │
│        │                                                             │
│        ▼                                                             │
│  src/player.js (anim state machine) ──┐                              │
│  src/levels/build.js (pickTopFrame) ──┼── consume the SAME sprite     │
│  src/parallax.js (camera-driven pos) ─┤   names/paths/frame counts    │
│  src/scenes/title.js / select.js ──────┘   Phase 18 already locked    │
│        │                                                             │
│        ▼                                                             │
│  rendered game (title → select → level) with REAL art               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ HUMAN SIGN-OFF (new this phase — PROC-02)                             │
│                                                                       │
│  scripts/screenshot-phase20.mjs (Playwright, headless, reused         │
│  pattern from screenshot-phase18.mjs) captures:                      │
│    - title screen                                                    │
│    - select screen                                                   │
│    - in-level: player mid-run + mid-jump, tileset visible             │
│    - in-level: two camera-X positions showing parallax offset         │
│        │                                                             │
│        ▼                                                             │
│  AskUserQuestion (BLOCKING, synchronous, presented mid-execution —    │
│  NOT deferred to "end-of-phase" silent auto-pass)                    │
│        │                                                             │
│        ├── human confirms → VERIFICATION.md flips human_needed→passed│
│        └── human flags issue → fix → re-screenshot → re-ask (loop)   │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
scripts/
├── generate-art-assets.py     # UNCHANGED — kept as labeled dev/prototyping tool (CONTEXT.md)
├── build-art-assets.py        # NEW — the real sourcing/crop/remap pipeline (successor as SHIPPED tool)
├── screenshot-phase18.mjs     # UNCHANGED — prior art for the screenshot pattern
├── screenshot-phase20.mjs     # NEW — extends the pattern: title/select/in-level/parallax shots
assets/
├── _kenney-src/                # NEW — vendored raw source (zips + extracted PNGs), reproducibility trail
│   ├── pixel-platformer/
│   ├── platformer-characters/
│   └── background-elements/
├── player.png                  # REPLACED — real content, same 80x32 geometry
├── tiles/ground.png             # REPLACED — real content, same 80x16 geometry
├── tiles/title-bg.png           # REPLACED — real content, same 640x360 geometry
├── parallax/{far,mid,near}.png  # REPLACED — real content, same locked geometries
└── LICENSES/
    ├── player.txt                # REWRITTEN — new Kenney source
    ├── ground.txt                # REWRITTEN — new Kenney source
    ├── parallax-far.txt          # NEW (or one combined parallax.txt — Claude's discretion)
    ├── parallax-mid.txt          # NEW
    ├── parallax-near.txt         # NEW
    └── title-bg.txt               # NEW
```

### Pattern 1: Uniform-scale character frame extraction (avoids per-frame size jitter)

**What:** Crop every player pose to its own content bbox, but scale ALL frames by ONE shared
scale factor (computed from the largest/reference frame), not each frame independently to its own
bbox.
**When to use:** Any time multiple animation frames of the same character are being downscaled
into a fixed frame size — independent per-frame fitting makes the character visibly grow/shrink
between poses (confirmed as a real risk in this session's own test render — see Common Pitfalls
#2).
**Example:**
```python
# Source: this session's tested pipeline (scratchpad), verified visually against the locked
# 16x32 player frame geometry from 18-UI-SPEC.md
from PIL import Image

def load_and_bbox(path):
    im = Image.open(path).convert("RGBA")
    return im, im.getbbox()

poses = ["adventurer_idle.png", "adventurer_stand.png",
         "adventurer_walk1.png", "adventurer_walk2.png", "adventurer_jump.png"]
loaded = [load_and_bbox(p) for p in poses]

# ONE shared scale factor from the tallest bbox across all frames (usually jump or idle),
# so idle/run/jump don't change apparent character size mid-animation.
target_w, target_h = 16, 32
max_content_h = max(bbox[3] - bbox[1] for _, bbox in loaded)
scale = target_h / max_content_h   # height-bound scale, shared across all frames

sheet = Image.new("RGBA", (target_w * 5, target_h), (0, 0, 0, 0))
for i, (im, bbox) in enumerate(loaded):
    cropped = im.crop(bbox)
    new_w = max(1, round(cropped.width * scale))
    new_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.NEAREST)
    frame = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    px = (target_w - new_w) // 2                 # center horizontally
    py = target_h - new_h                        # bottom-align feet (18-UI-SPEC.md contract)
    frame.paste(resized, (px, py), resized)
    sheet.paste(frame, (i * target_w, 0), frame)
sheet.save("player_pre_remap.png")   # next: palette-remap this sheet, see Pattern 2
```

### Pattern 2: Nearest-color palette remap (tested this session)

**What:** Force an arbitrary-color source image onto a small fixed palette via Pillow's
`quantize(palette=..., dither=Dither.NONE)`, which performs per-pixel nearest-color matching
against a supplied palette image — not adaptive re-quantization, not a hand-rolled distance loop.
**When to use:** Every sourced asset in this phase, as the final build step before writing to
`assets/`.
**Example:**
```python
# Source: Pillow official docs (Image.quantize) — tested this session against a real
# downscaled Adventurer frame; result confirmed visually recognizable + correctly light-on-dark
from PIL import Image

def build_palette_image(colors):
    """colors: list of up to 256 (r,g,b) tuples — the ONLY colors output pixels may use."""
    pal_img = Image.new("P", (1, 1))
    flat = []
    for c in colors:
        flat.extend(c)
    flat += [0, 0, 0] * (256 - len(colors))
    pal_img.putpalette(flat)
    return pal_img

# Player-only locked tokens (bright, must read against #0a0a0a — CLAUDE.md/18-UI-SPEC.md):
PLAYER_PALETTE = [
    (0x0a, 0x0a, 0x0a),  # near-black (outline/background fill)
    (0xe8, 0xe8, 0xe8),  # bright highlight (matches project's #e8e8e8 label color)
    (0xd8, 0xd8, 0xd8),  # body light
    (0x90, 0x90, 0x90),  # mid-grey shadow/limb definition
    (0x44, 0x44, 0x44),  # dark grey
    (0x00, 0xff, 0x88),  # neon-green accent (ONE small detail, e.g. eyes/emblem)
]

def remap(src_rgba, colors):
    rgb = src_rgba.convert("RGB")
    pal_img = build_palette_image(colors)
    q = rgb.quantize(palette=pal_img, dither=Image.Dither.NONE)
    result = q.convert("RGB").convert("RGBA")
    if src_rgba.mode == "RGBA":
        result.putalpha(src_rgba.split()[-1])   # preserve original transparency mask
    return result

sheet = Image.open("player_pre_remap.png").convert("RGBA")
remap(sheet, PLAYER_PALETTE).save("assets/player.png")
```
**Verified this session:** ran exactly this two-pattern pipeline end-to-end against a real
Adventurer pose set cropped/scaled to 16×32 — the resulting silhouette remained recognizably
humanoid (hair/face/torso distinguishable) and read as light-on-dark against a black canvas.

### Pattern 3: Ground tile frame mapping (Pixel Platformer grass/dirt tiles)

**What:** `src/levels/build.js`'s `pickTopFrame()` expects 5 frames: `0`=single, `1`=left,
`2`=center, `3`=right, `4`=underside. Kenney's Pixel Platformer ships 4 near-identical
grass-over-dirt "noise variant" tiles (not true directional edge-cap art) plus separate
plain-dirt-only tiles.
**When to use:** Map the 4 grass variants to slots 0–3 (giving genuine hand-drawn noise variety
across a run instead of the current per-pixel random noise — this alone satisfies "not per-pixel
random noise standing in for texture" per ART-06) and one plain-dirt tile (no grass cap) to slot
4 — visually distinct as "interior/underside" because it lacks the grass top, which is a real,
correct material-transition signal, not a fabricated edge shape.
**Example:**
```python
# Source: Kenney "Pixel Platformer" Tiles/ individual pre-cropped 18x18 PNGs (tile_0000..0003 =
# row0 cols0-3 = grass variants; tile_0004/0005 = row0 cols4-5 = plain dirt), confirmed by
# visual inspection of Preview.png legend this session.
FRAME_SOURCE_TILES = {
    0: "tile_0000.png",  # single — grass variant A
    1: "tile_0001.png",  # left   — grass variant B
    2: "tile_0002.png",  # center — grass variant C
    3: "tile_0003.png",  # right  — grass variant D
    4: "tile_0004.png",  # underside — plain dirt (no grass cap = correct material signal)
}
# Each is 18x18 native; resize to 16x16 (Image.NEAREST) before compositing into the 80x16 sheet.
```

### Pattern 4: Parallax/title-bg compositing (Background Elements silhouette kit)

**What:** Unlike a single pre-made "parallax strip" asset, Background Elements ships individual
silhouette PNGs (`castle.png` 205×182, `temple.png` 223×131, `tower.png` 66×227,
`mountain1-3.png`, `hills1-2.png` 1001×128 tileable, `pointy_mountains.png` 1001×168 tileable,
`cloud1-9.png`). Composite these onto blank canvases at the locked dimensions.
**When to use:** Build each of far(640×120)/mid(640×144)/near(640×90)/title-bg(640×360) as its
own composited canvas:
- **Far (640×120):** crop/scale `pointy_mountains.png` (1001×168 → crop/scale to fit) as the base
  layer — faint, most distant.
- **Mid (640×144):** `hills1.png`/`hills2.png` base + scattered `temple.png`/`castle.png`/
  `tower.png` at intervals (the "distant ruin/structure silhouette with deliberate horizon
  rhythm" the ROADMAP names explicitly).
- **Near (640×90):** subtler — a darker hills strip or `fence.png` silhouette row, per the
  UI-SPEC's "subtle grunge texture" mood for this layer.
- **Title-bg (640×360):** compose `castle.png` + `hills1.png`/`mountain*.png` + `cloud*.png` into
  one full backdrop scene, very low contrast per the UI-SPEC's title-bg art direction.
**Example:**
```python
# Source: this session's direct inspection of Background Elements' PNG/ and PNG/Flat/ folders
from PIL import Image

def make_mid_layer(elements_dir, w=640, h=144):
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hills = Image.open(f"{elements_dir}/Flat/hills1.png").convert("RGBA")
    hills = hills.resize((w, int(hills.height * w / hills.width)), Image.LANCZOS)
    canvas.paste(hills, (0, h - hills.height), hills)
    for i, x in enumerate([80, 320, 520]):
        motif = Image.open(f"{elements_dir}/Flat/{['temple','castle','tower'][i % 3]}.png").convert("RGBA")
        scale = 0.6
        motif = motif.resize((int(motif.width * scale), int(motif.height * scale)), Image.LANCZOS)
        canvas.paste(motif, (x, h - motif.height - 20), motif)
    return canvas
# Then palette-remap the finished composite via Pattern 2 (environment tokens, not player tokens).
```

### Anti-Patterns to Avoid
- **Independent per-frame auto-fit scaling for animation frames** — makes the character visibly
  change size between idle/run/jump (Common Pitfall #2); always derive one shared scale factor.
- **Skipping the palette-remap step because "the source is already nice looking"** — Kenney art
  ships in its own bright, colorful default palette; shipping it unremapped violates the locked
  dark-grunge/no-pink contract just as surely as shipping raw procedural noise violated "real
  curated art."
- **Treating `checkpoint:human-verify` as self-satisfying under this project's default config**
  (`mode: "yolo"`, `human_verify_mode: "end-of-phase"`) — this is the exact anti-pattern PROC-02
  exists to close; see the dedicated Human Sign-off section below.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Nearest-color palette forcing | A manual per-pixel Euclidean-distance loop over the source image | `Image.quantize(palette=<P-mode image>, dither=Image.Dither.NONE)` | Pillow's C-level quantizer is correct, fast, and was verified working this session; a hand-rolled Python loop over every pixel of ~10 assets is slow, error-prone, and reinvents a solved problem |
| Content-aware cropping of transparent-padded sprites | Manual pixel-scanning to find the character's bounding box | `Image.getbbox()` | Built-in, one call, exactly what's needed |
| Tileable strip generation | Hand-drawing repeat-safe noise (what the current procedural script does) | Kenney's already-tileable `hills1/2.png`/`pointy_mountains.png` strips, cropped/scaled to the locked width | These source assets are already authored to tile; re-deriving tileability from scratch is unnecessary and was the root of the "random noise" problem this phase fixes |

**Key insight:** every "hand-roll" risk in this phase is a temptation to reach for the SAME
procedural/generative techniques that produced the placeholder noise Phase 18 shipped. The
discipline this phase requires is: source real art first, then use well-established, tested
library calls (`quantize`, `getbbox`, `resize`) only to *fit* that real art onto the locked
geometry/palette — never to *generate* the art's content.

## Runtime State Inventory

Not applicable — this is an asset-content-and-documentation phase, not a rename/refactor/
migration. No stored data, live service config, OS-registered state, secrets, or stale build
artifacts carry the string "player.png"/"ground.png" etc. as a key/identifier anywhere outside
the files this phase directly edits (confirmed: these are static asset paths referenced only by
`loadSprite()` calls in `src/main.js`, already enumerated and unchanged).

## Common Pitfalls

### Pitfall 1: New art doesn't match the locked frame geometry
**What goes wrong:** A cropped/scaled Kenney source frame ends up e.g. 17×33 instead of exactly
16×32, silently breaking `sliceX` math (frames become misaligned, later frames bleed into the
next slot).
**Why it happens:** Manual crop/scale math with off-by-one rounding, or forgetting the sheet's
TOTAL width must be exactly `frame_w * frame_count`.
**How to avoid:** After building each sheet, assert its exact pixel dimensions
(`assert img.size == (80, 32)` etc.) before writing to `assets/`, matching the existing
`assets/*.png` dimensions confirmed this session (`player.png` 80×32, `ground.png` 80×16, `far.png`
640×120, `mid.png` 640×144, `near.png` 640×90, `title-bg.png` 640×360 — all currently RGB, no
alpha).
**Warning signs:** Kaplay renders a visibly shifted/cropped frame during animation playback.

### Pitfall 2: Independent per-frame scaling causes visible size jitter across idle/run/jump
**What goes wrong:** If each animation frame is cropped-to-bbox and scaled-to-fit independently,
frames with wider/taller bounding boxes (e.g. a walk pose with an outstretched arm) end up scaled
differently from a compact idle pose, making the character visibly grow/shrink between animation
states.
**Why it happens:** `min(target_w/crop.width, target_h/crop.height)` computed per-frame instead
of once, shared across the whole pose set.
**How to avoid:** Use Pattern 1 above — compute ONE scale factor from a reference frame (or the
max content height across all frames) and apply it uniformly.
**Warning signs:** Confirmed as a REAL risk by this session's own test render (see Standard Stack
verification note) — visually check the assembled sheet at high zoom before palette-remap.

### Pitfall 3: Kenney's Pixel Platformer ground tiles are noise-variant tiles, not edge-cap art
**What goes wrong:** Expecting a dedicated "rounded left corner" / "rounded right corner" sprite
like some tileset packs ship, then being unable to find one and treating this as a blocker.
**Why it happens:** `pickTopFrame()`'s frame-slot names (`left`/`center`/`right`) imply directional
edge shapes; Kenney's actual art for this pack is 4 near-identical grass-over-dirt variants meant
for randomized noise-variety across a run, not shaped edge caps.
**How to avoid:** Use Pattern 3 above — map the 4 variants to slots 0–3 for natural-looking
variety (a real improvement over per-pixel noise) and a distinct plain-dirt tile (no grass cap) to
slot 4 for underside, which is materially correct (interior dirt has no grass) even without a
literal underside-shaped sprite. The game's actual collision/seam-stick safety comes from the
merged-collider architecture (`src/levels/build.js`), not from the tile art — so this is a purely
cosmetic, low-risk simplification.
**Warning signs:** None functional — this is a visual/content-fidelity tradeoff to flag for the
human sign-off, not a bug.

### Pitfall 4: Palette-remap flattens the player back into low contrast
**What goes wrong:** If the locked palette list passed to `quantize` is dominated by dark tones
(reusing the environment palette for the player too), the remapped character loses its
required light-on-dark contrast — reproducing the exact "invisible player" bug this project has
already shipped and fixed once.
**Why it happens:** Copy-pasting one palette constant for all assets instead of using a
player-specific bright palette subset (as Pattern 2 does explicitly).
**How to avoid:** Use TWO distinct palette lists: a bright `PLAYER_PALETTE` (light greys + one
accent) for `player.png` only, and a dark `ENVIRONMENT_PALETTE` (near-black family) for
`ground.png`/parallax/title-bg. Verify in-browser against the actual `#0a0a0a` background per
ART-05 — not just by eyeballing the standalone PNG in an image viewer.
**Warning signs:** The remapped player PNG "disappears" when viewed at actual size against a dark
background swatch.

### Pitfall 5: Mixing three separate Kenney packs without separate license bookkeeping
**What goes wrong:** CREDITS.md/`assets/LICENSES/` end up with one row/proof file covering
multiple distinct source packs, breaking the cross-match rigor the existing format relies on
(one proof file ↔ one CREDITS.md row ↔ one verifiable source page).
**Why it happens:** This phase's decision to source player, tileset, and parallax from THREE
different Kenney packs (not one, per the corrected Area 1 finding) is more license bookkeeping
than the original single-pack plan implied.
**How to avoid:** One proof file per pack per asset category, exactly mirroring the existing
`player.txt`/`ground.txt`/`spike.txt`/`goal.txt`/`coin.txt` granularity (5 files for 5 distinct
crops from ONE dungeon pack) — this phase needs at minimum: `player.txt` (Platformer Characters),
`ground.txt` (Pixel Platformer), and a parallax set (Background Elements) — likely 3-6 files
total depending on whether parallax layers share one combined proof file (CONTEXT.md explicitly
allows this).
**Warning signs:** A CREDITS.md row citing a URL that doesn't match any `assets/LICENSES/*.txt`
file, or vice versa.

### Pitfall 6: Downscaling detailed character art destroys separable silhouette at 16px width
**What goes wrong:** The Adventurer pose set is drawn at a much higher effective resolution
(63-72px wide content) than the 16px target frame width — a ~4x reduction. Fine detail (facial
features, individual fingers) cannot survive this and will alias/blur into mush if scaled with
anything other than nearest-neighbor, or if the source art is unusually intricate.
**Why it happens:** Kenney's "Platformer Characters" pack targets ~48-64px on-screen character
sizes in its own demos, not this project's tight 16px collider width.
**How to avoid:** Always use `Image.NEAREST` (never `LANCZOS`/`BICUBIC`) for the final
downscale-to-frame step (LANCZOS is fine for the larger parallax/background composites in Pattern
4, which aren't hitting a 4x-plus reduction onto a 16px target). This session's own test render
(Standard Stack verification note) confirms the result stays legible at 16×32 with nearest-neighbor
scaling — but the planner should budget one visual-inspection checkpoint after the crop/scale step
and before the palette-remap step, so a bad crop is caught early rather than discovered only at
final sign-off.
**Warning signs:** The pre-remap sheet (before palette quantize) looks like an unrecognizable blob
at 100% zoom.

### Pitfall 7: `checkpoint:human-verify` gates in this project's config have never actually blocked on a human response
**What goes wrong:** A plan writes a `checkpoint:human-verify gate="blocking"` task exactly like
Phases 13/14/15/16/17/18/19 all did — and the phase still gets marked `passed` without any human
ever actually being asked a question, because this project's `.planning/config.json` sets
`"mode": "yolo"` and `"human_verify_mode": "end-of-phase"`, and the autonomous executor has
consistently (7 times, confirmed by grep across every archived VERIFICATION.md/SUMMARY.md in this
repo) treated that as license to self-declare "Auto-approved in autonomous mode" using passing
scripts/screenshots as the entire justification — with nobody ever having looked at the
screenshots via a real interactive prompt.
**Why it happens:** The task TYPE (`checkpoint:human-verify`) signals intent correctly, but
nothing in the existing pattern *forces* the executing agent to actually invoke a blocking,
synchronous `AskUserQuestion` call mid-execution; "gate=blocking" has so far only meant "blocking
within the phase's own internal task order," not "blocking on an actual external human response."
**How to avoid:** The plan for THIS phase must make the sign-off task's action explicit and
unambiguous: capture real screenshots (reusing/extending `scripts/screenshot-phase18.mjs`'s
proven Playwright pattern), then literally call the `AskUserQuestion` tool with those screenshot
paths/descriptions and a real yes/no+notes question, and record the human's literal response text
in `VERIFICATION.md`. `VERIFICATION.md`'s frontmatter `status` field must read `human_needed`
until that response is recorded — this is the one place in the whole phase where automation
must NOT be allowed to self-certify.
**Warning signs:** A `SUMMARY.md` or `VERIFICATION.md` that says "auto-approved in autonomous
mode" for the art sign-off task — if this phase's own artifacts end up saying that, PROC-02 has
not actually been satisfied, regardless of what the frontmatter `status` claims.

## Code Examples

### Direct zip download (confirmed non-JS-gated — the download link IS a static anchor href)
```bash
# Source: this session's direct curl fetch — all three returned HTTP 200 and valid zip data.
# Kenney's "Download" button opens a lightbox (#inline-download) containing a plain <a href>
# to the actual zip — no JS-executed fetch/API call is needed, a plain curl works.
curl -sL -A "Mozilla/5.0" \
  "https://kenney.nl/media/pages/assets/pixel-platformer/33bb4921eb-1696667883/kenney_pixel-platformer.zip" \
  -o assets/_kenney-src/pixel-platformer.zip

curl -sL -A "Mozilla/5.0" \
  "https://kenney.nl/media/pages/assets/platformer-characters/b85f388c42-1677693768/kenney_platformer-characters.zip" \
  -o assets/_kenney-src/platformer-characters.zip

curl -sL -A "Mozilla/5.0" \
  "https://kenney.nl/media/pages/assets/background-elements/b66a1ddec7-1677670395/kenney_background-elements.zip" \
  -o assets/_kenney-src/background-elements.zip
```
**Note:** the numeric-hash path segment may rotate on a future Kenney republish; re-resolve from
the live page (`grep -o "kenney_[a-z-]*\.zip" page.html` after fetching the page HTML and locating
the `#inline-download` anchor) if any of these three specific URLs 404s at execution time.

### License-proof file template (exact format match to existing `assets/LICENSES/*.txt`)
```text
Asset:        assets/player.png  (player character — idle/walk/jump pose sheet, 5x16x32)
Source pack:  "Platformer Characters" (Adventurer)
Author:       Kenney (Kenney Vleugels)
Source URL:   https://kenney.nl/assets/platformer-characters
Source file:  https://kenney.nl/media/pages/assets/platformer-characters/<hash>/kenney_platformer-characters.zip
Poses used:   PNG/Adventurer/Poses/adventurer_idle.png, adventurer_stand.png,
              adventurer_walk1.png, adventurer_walk2.png, adventurer_jump.png
              (cropped to content bbox, uniformly scaled, palette-remapped — see
              scripts/build-art-assets.py)
License:      CC0 (Creative Commons Zero / Public Domain)

Quoted license declaration from the pack's own bundled License.txt:
    "License (Creative Commons Zero, CC0) ... You may use these assets in personal
     and commercial projects."

CC0 full text:  https://creativecommons.org/publicdomain/zero/1.0/

Processing note: source poses are ~63-72px tall pixel-art character illustrations;
cropped to content bounding box, scaled by ONE shared factor (derived from the tallest
pose) to fit the project's locked 16x32 frame, nearest-neighbor resampled, then palette-
remapped onto the project's locked player token set (#e8e8e8/#d8d8d8/#909090/#00ff88 on
#0a0a0a) via Pillow Image.quantize. This is a derivative crop/recolor of the same CC0
source art, not new artwork; CC0 permits modification.

Verification: License page + bundled License.txt both confirmed CC0 this session
(2026-07-03). NOT CC-BY.

Vendor logo / brand art: none.
```

### Composited parallax layer, then remap (full pipeline for one layer)
```python
# Source: this session's tested approach, combining Pattern 4 (composite) + Pattern 2 (remap)
from PIL import Image

ENVIRONMENT_PALETTE_FAR = [
    (0x0f, 0x0f, 0x1a),  # BLUE_TINT — matches existing far-layer mood token
    (0x15, 0x15, 0x15),  # DARK_GREY
    (0x0a, 0x0a, 0x0a),  # near-black
]

def build_far_layer(elements_dir):
    w, h = 640, 120
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mtn = Image.open(f"{elements_dir}/Flat/pointy_mountains.png").convert("RGBA")  # 1001x168
    mtn = mtn.resize((w, int(mtn.height * w / mtn.width)), Image.LANCZOS)
    canvas.paste(mtn, (0, h - mtn.height), mtn)
    return canvas

layer = build_far_layer("assets/_kenney-src/background-elements/PNG")
# remap() defined in Pattern 2 above
remap(layer, ENVIRONMENT_PALETTE_FAR).convert("RGB").save("assets/parallax/far.png")
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| Procedurally-generated placeholder art (`scripts/generate-art-assets.py`, flat rects + random noise) | Real, curated, licensed CC0 art via a build pipeline (`scripts/build-art-assets.py`) | This phase | Satisfies ART-05..08's "real curated art" bar; the old script stays only as a labeled dev/prototyping tool per CONTEXT.md, no longer the shipped pipeline |
| `checkpoint:human-verify` tasks silently treated as satisfied by passing automation + uninspected screenshots | A real, synchronous, blocking `AskUserQuestion` call presenting the screenshots, with the literal human response recorded in `VERIFICATION.md` | This phase (PROC-02) | Closes the exact process gap that let Phase 18 ship its placeholder art as "passed" |

**Deprecated/outdated:** `scripts/generate-art-assets.py` as the SHIPPED art source — explicitly
retained only as a dev/prototyping tool per CONTEXT.md and REQUIREMENTS.md's Out of Scope table.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CONTEXT.md's claim that Kenney "Pixel Platformer" "ships actual walk/jump animation frames" — **this research found this claim to be incorrect** on direct inspection (that pack's character tiles are static 24×24 blob mascots, no walk cycle) and substitutes "Platformer Characters" (Adventurer) instead, which DOES have real idle/walk/jump poses. This substitution itself is a NEW claim made this session, verified by direct zip download + `Image.getbbox()` inspection, so confidence is HIGH, but it is a deviation from the locked CONTEXT.md wording and should be explicitly surfaced to the user/planner as a correction, not silently substituted. | Summary, Standard Stack | If the planner or user prefers to keep strictly to CONTEXT.md's literal pack choice despite the animation-frame gap, the player would need a different treatment (e.g., single static pose + code-side procedural squash for "run," which would partially reintroduce the exact "not real animation" problem this phase exists to fix) |
| A2 | Kenney zip URLs (with content-hash path segments) are stable enough to hardcode in a plan/script for the duration of phase execution | Package Legitimacy Audit, Code Examples | Low risk — even if a URL rotates, the stable page URL provides a straightforward re-resolution path; not a blocker, just a note for the executor |
| A3 | "Background Elements" (flat-vector style) blends acceptably with the pixel-art tileset/player once palette-remapped to solid dark tones | Alternatives Considered, Pitfall 5 | Low-medium risk — this is a genuine style/medium difference (vector-flat vs. pixel-art) that palette flattening should minimize but a human should confirm at sign-off; flagged explicitly as part of the sign-off's visual-cohesion check |

**If this table is empty:** N/A — see above; two of three entries are low-risk implementation
notes, but A1 is a substantive correction to a CONTEXT.md-locked claim and should be flagged to
the user during planning/discuss, not just buried in research.

## Open Questions (RESOLVED)

1. **Should the player really source from a different Kenney pack than CONTEXT.md named?** — **RESOLVED:** yes, substituted. Implemented and explained in `20-01-PLAN.md`.
   - What we know: CONTEXT.md locked "source player from Kenney's Pixel Platformer pack because
     it ships walk/jump animation frames." Direct inspection this session shows this specific
     claim about that pack is factually wrong — no walk cycle exists in its character tiles.
     "Platformer Characters" (Adventurer) is a same-publisher, equally-CC0, equally-real pack that
     DOES have idle/stand/walk1/walk2/jump named poses.
   - What's unclear: whether the user, if asked, would rather (a) accept the substitution
     (keeps the *intent* of Area 1 — "real animated player, not a static figure" — while
     correcting the specific pack name), or (b) insist on literally the named pack despite the
     gap, accepting a weaker animation result.
   - Recommendation: proceed with the substitution (Platformer Characters/Adventurer for player,
     Pixel Platformer retained for ground/tileset exactly as CONTEXT.md specified) as the default
     plan, but the planner should surface this explicitly as a one-line confirmation point rather
     than silently deviating from a locked decision.

2. **Exact number of proof files for parallax (one combined vs. one-per-layer)** — **RESOLVED:** one combined `parallax.txt`, per `20-02-PLAN.md`.
   - What we know: CONTEXT.md explicitly leaves this to Claude's discretion ("one per asset, or
     one combined file if all three layers share a single source page").
   - What's unclear: nothing blocking — this is genuinely open by design.
   - Recommendation: since all three parallax layers + title-bg will likely be composited from
     the SAME "Background Elements" pack, one combined `assets/LICENSES/parallax-and-title-bg.txt`
     (or similar) is defensible and reduces bookkeeping — but per-layer files also work and match
     the existing per-asset granularity more closely. Either satisfies PROC-01.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Network access to kenney.nl | Downloading source packs | ✓ | HTTP 200 confirmed (3 pack pages + 3 zips, this session) | — |
| `curl` | Fetching zips | ✓ | system | — |
| `unzip` | Extracting zips | ✓ | system | — |
| Python 3 + Pillow (PIL) | Build/remap script | ✓ | Python 3, Pillow 10.2.0 | — |
| Playwright (chromium) | Screenshot capture for human sign-off | ✓ (already vendored/used by `scripts/screenshot-phase18.mjs`/`browser-boot.mjs`) | existing project install path confirmed in those scripts | — |
| `AskUserQuestion` tool | The actual blocking human sign-off gate (PROC-02) | ✓ (available to the executing agent) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — every dependency this phase needs was directly
confirmed present and working this session.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (zero-dependency static game per CLAUDE.md) — validation is via `node --check` syntax gates, static shell scripts, and a real-browser Playwright boot/screenshot script, exactly as every prior phase in this project has done |
| Config file | none — see `scripts/check-*.sh`, `scripts/browser-boot.mjs`, `scripts/smoke-progress.mjs` |
| Quick run command | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-gate.sh` |
| Full suite command | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-gate.sh && node scripts/smoke-progress.mjs && node scripts/browser-boot.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| ART-05 | Player sprite loads at 80x32/5 frames, animation state machine unchanged, silhouette bright on `#0a0a0a` | smoke + human | `node scripts/browser-boot.mjs` (loads/animates without error) + human screenshot review | ✅ (browser-boot.mjs exists) |
| ART-06 | Ground tileset loads at 80x16/5 frames, `pickTopFrame` renders correct frame per position | smoke + human | `node scripts/browser-boot.mjs` + visual tile-seam check at sign-off | ✅ |
| ART-07 | Parallax layers load at locked dims, camera-driven only, no timers | static + smoke + human | `bash scripts/check-safety.sh` (no-timer gate) + `node scripts/browser-boot.mjs` + visual parallax-offset check at sign-off | ✅ |
| ART-08 | Title/select backdrop renders, no pink, readable hierarchy | smoke + human | `node scripts/browser-boot.mjs` + visual check at sign-off | ✅ |
| PROC-01 | Every new/replaced asset has a matching CC0 proof file + CREDITS.md row | static | `grep -ril cc0 assets/LICENSES/*.txt` (all must match) + manual cross-reference against `CREDITS.md` table rows | ✅ (existing pattern, `09-VERIFICATION.md` precedent) |
| PROC-02 | Phase cannot pass without a real, recorded, blocking human response | **new — human, structural** | `AskUserQuestion` tool call with screenshots, response text recorded verbatim in `VERIFICATION.md` | ❌ Wave 0 — new pattern, no prior script encodes this; the plan itself must design this task explicitly (see Pitfall 7) |

### Sampling Rate
- **Per task commit:** `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh`
- **Per wave merge:** full suite command above
- **Phase gate:** full suite green + the actual `AskUserQuestion` human sign-off recorded, before
  `/gsd-verify-work` — automated green alone is explicitly insufficient per PROC-02.

### Wave 0 Gaps
- [ ] `scripts/build-art-assets.py` — does not exist yet; this phase's core deliverable
- [ ] `scripts/screenshot-phase20.mjs` — extend `screenshot-phase18.mjs`'s pattern to also capture
      an in-level shot (player mid-animation, tileset visible) and two parallax-offset shots
- [ ] `assets/_kenney-src/` staging folder — does not exist yet
- [ ] No new test framework install needed — the project's existing zero-dependency validation
      pattern (static gates + Playwright boot/screenshot) fully covers this phase's needs; the
      one genuine gap is procedural (an actually-blocking `AskUserQuestion` sign-off task), not
      tooling.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | no | No auth surface in this game |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No access-control surface |
| V5 Input Validation | no | This phase adds no new user-input-handling code — asset content only |
| V6 Cryptography | no | Not applicable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Malicious/spoofed asset source (typosquatted domain serving a lookalike "CC0" pack with hidden tracking or oversized payload) | Tampering / Spoofing | Fetch only from the canonical `kenney.nl` domain (confirmed reachable and serving the expected content this session); verify the bundled `License.txt` inside each downloaded zip matches the page's stated license before using any asset — done for all three packs this session |
| Zip-bomb / oversized asset payload consumed by the build script | Denial of Service (build-time only, not runtime) | All three zips are small (260KB, 1.4MB, 1.1MB) — sane sizes for pixel-art packs; no risk observed |
| Committing raw vendored source zips bloating repo size | n/a (hygiene, not a STRIDE threat) | Consider `.gitignore`-ing the raw `.zip` files under `assets/_kenney-src/` while committing the extracted PNGs actually used (or committing only the extracted source PNGs, not the full zip) — Claude's discretion per CONTEXT.md, but worth a line in the plan |

## Sources

### Primary (HIGH confidence)
- https://kenney.nl/assets/pixel-platformer — fetched directly this session (HTTP 200); zip
  downloaded and inspected (`License.txt`, `Tiles/`, `Tilemap/`, `Preview.png`)
- https://kenney.nl/assets/platformer-characters — fetched directly this session (HTTP 200); zip
  downloaded and inspected (`PNG/Adventurer/Poses/*`, `License.txt`)
- https://kenney.nl/assets/background-elements — fetched directly this session (HTTP 200); zip
  downloaded and inspected (`PNG/`, `PNG/Flat/`, `Samples/`, `License.txt`)
- https://creativecommons.org/publicdomain/zero/1.0/ — CC0 license reference, matches this
  project's own existing `assets/LICENSES/*.txt` citation pattern
- This repo's own `.planning/milestones/v4.0-phases/*/*-VERIFICATION.md` and `*-SUMMARY.md` files
  (13, 14, 15, 16, 18, 19) and `.planning/milestones/v3.0-phases/09-*/09-VERIFICATION.md` — direct
  grep confirmed zero prior use of a real blocking `AskUserQuestion` human sign-off
- Pillow 10.2.0 `Image.quantize`/`Image.getbbox` behavior — confirmed empirically by running the
  exact code in this session's scratchpad against real downloaded assets

### Secondary (MEDIUM confidence)
- WebSearch results confirming "Platformer Characters" and "Background Elements" exist as
  distinct kenney.nl packages (cross-checked against direct HTTP fetch, which is primary)

### Tertiary (LOW confidence)
- None — every load-bearing claim in this document was verified by direct download/inspection
  this session, not left as WebSearch-only.

## Metadata

**Confidence breakdown:**
- Standard stack (Kenney packs + Pillow): HIGH — all three packs downloaded, license-verified,
  and content-inspected directly; Pillow version confirmed installed
- Architecture / compositing patterns: HIGH — palette-remap pipeline tested end-to-end against
  real assets this session with a visually-confirmed result
- Pitfalls: HIGH — Pitfall 2 (per-frame scaling jitter) and Pitfall 6 (downscale legibility) were
  both directly observed/tested, not theorized; Pitfall 7 (sign-off gap) confirmed by exhaustive
  grep of this repo's own history
- Human sign-off mechanism precedent: HIGH (as a negative result) — confirmed there is NO positive
  precedent to reuse; the plan must design this pattern fresh, which this research flags explicitly

**Research date:** 2026-07-03
**Valid until:** Kenney zip URLs' hash segments may rotate on republish (low likelihood short-term,
but re-resolve from the stable page URL if a 404 occurs at execution time); otherwise this
research is stable for the life of this single-phase milestone.
