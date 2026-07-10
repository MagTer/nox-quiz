# Phase 31: Asset Bake & Style-Board Sign-off - Pattern Map

**Mapped:** 2026-07-10
**Files analyzed:** 8 (new/modified)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `assets/_gothicvania-src/**` (re-fetched raw pack files) | config/vendored-source | file-I/O | `assets/_kenney-src/`, `assets/_opengameart-src/` (existing vendored-source dirs) | exact (directory convention) |
| `scripts/build-art-assets.py` (extended: `build_biome_atlas_<name>()` etc.) | utility (build/bake script) | file-I/O / transform | `scripts/build-art-assets.py`'s own `build_door()` / `build_ground_theme()` | exact (same file, established idiom) |
| `assets/tiles/atlas-<biome>.png`, `assets/parallax/<layer>-<biome>.png`, `assets/player-swamphunter.png`, `assets/enemy-hellhound.png` (baked outputs) | config (static asset) | file-I/O (bake output) | `assets/tiles/ground-theme-N.png`, `assets/parallax/{far,mid,near}-theme-N.png`, `assets/player.png`, `assets/enemy-{1,2,3}.png` | exact |
| `scripts/check-pink-gate.sh` + `scripts/lib/pink_scan.py` | utility (gate script) | batch / transform | `scripts/check-progress.sh`, `scripts/check-safety.sh` (shell gate family) | role-match (shell wrapper); `styleboard.py`'s `hue_shift_band()` (core HSV logic analog) |
| `.planning/research/v6-scouting/styleboard.py` (extended in place: Swamp Hunter + Hell hound swap) | utility (mock-render script) | transform / file-I/O | itself (existing file, extend in place) | exact |
| `CREDITS.md` (new rows appended) | config/docs | CRUD (append rows) | existing rows (e.g. the `ground.png` row) | exact |
| `assets/LICENSES/<name>.txt` (new proof files, one per vendored group) | config/docs | file-I/O (write proof text) | `assets/LICENSES/ground.txt` | exact |
| `docs/LEVEL-DESIGN.md` (new section) or new `docs/ART-CONVENTIONS.md` | docs | CRUD (append) | `docs/LEVEL-DESIGN.md`'s existing numbered-section structure (e.g. "## 6. Secret alcove") | exact (same file) / role-match (new file) |

## Pattern Assignments

### `scripts/build-art-assets.py` — new `build_biome_atlas_<name>()` functions (utility, file-I/O/transform)

**Analog:** `scripts/build-art-assets.py`'s own `build_door()` (hand-cropped, non-grid sheet) and `build_ground_theme()`/`build_parallax_theme()` (per-variant extension idiom).

**Imports pattern** (lines 31-38, top of file — already present, do not re-add):
```python
import json
import os
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_kenney-src")
```
New biome bake functions should add a sibling constant, e.g. `GV_SRC = os.path.join(ROOT, "assets", "_gothicvania-src")`, following this exact `os.path.join(ROOT, "assets", "_<pack>-src")` shape — never a hardcoded absolute path.

**Hand-identified crop-rectangle pattern (core pattern)** (lines 568-590, `build_door()`):
```python
def build_door():
    target_w, target_h = 32, 64
    sheet_path = os.path.join(
        ROOT, "assets", "_opengameart-src", "6-color-dungeon", "16x16-dungeon-tiles.png"
    )
    im = Image.open(sheet_path).convert("RGBA")
    crop = im.crop((0, 64, 48, 160))  # 48x96 — closed lattice gate + archway base
    resized = crop.resize((target_w, target_h), Image.NEAREST)

    remapped = _remap_luminance(resized, ENVIRONMENT_PALETTE)
    assert remapped.size == (target_w, target_h), f"door sprite wrong size: {remapped.size}"
    save(remapped.convert("RGBA"), os.path.join(ROOT, "assets", "door.png"))
```
Every new biome atlas/sprite baker MUST follow this shape: hardcoded `crop()` rect (with a comment explaining what the rect contains, visually verified first — never a generic slicer per CONTEXT.md/RESEARCH.md Pitfall 3), `Image.NEAREST` resize (never LANCZOS for pixel-art re-scale), a size `assert`, then `save()`.

**Per-variant extension pattern** (lines 226-252, `build_ground_theme()` — model for looping per biome):
```python
def build_ground_theme(theme_id, palette):
    """Per-level-theme variant of build_ground() ... Byte-identical body to
    build_ground() above ... except the sub-palette is a parameter and the
    output path is suffixed — the original build_ground()/ground.png stays
    an untouched fallback asset."""
    ...
    save(remapped.convert("RGB"), os.path.join(ROOT, "assets", "tiles", f"ground-{theme_id}.png"))
```
New biome bakers should take `biome_id` (or similar) as a parameter and suffix the output filename — never hardcode one-off filenames inline per function.

**Palette-remap pattern (error/quality handling)** — use `_remap_luminance` (lines 118-153) for atlases whose target palette is a narrow dark-grunge ramp (mirrors ENVIRONMENT_PALETTE's own precedent); use `_remap` (lines 102-115) only for a wide-luminance-range palette like PLAYER_PALETTE. Do not invent a third remap function — CONTEXT.md decisions do not require new palette logic, only new crop rects/sources.

**Dispatch pattern** (lines 789-800, bottom of file):
```python
if __name__ == "__main__":
    build_player()
    build_ground()
    ...
    build_enemies()
    build_logo()
```
New biome bake calls append here, never a new script (RESEARCH.md's "Don't Hand-Roll" table + CONTEXT.md's explicit "extension of the existing... not one-off manual crops").

---

### `.planning/research/v6-scouting/styleboard.py` — extend in place (utility, transform)

**Analog:** itself, already committed and proven at 640x360/badge-overlay.

**Core hue-conform pattern to reuse for regen (and to model `check-pink-gate.sh`'s scan on)** (existing `hue_shift_band()`):
```python
def hue_shift_band(im, band_lo, band_hi, delta, min_sat=30):
    """Rotate hue by `delta` for pixels whose hue is in [band_lo, band_hi] (PIL 0-255 hue).
    Demo of the v6.0 palette-conform pass (no-pink rule) on sourced art."""
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
The pink-gate's scan is the **read-only half** of this exact loop (count instead of mutate) — see below.

**Connected-component helper** (`islands()`) exists in this file for isolated sprite blobs (player/enemy) — explicitly do NOT reuse it for terrain sheets (RESEARCH.md Anti-Pattern / Pitfall 3).

**Player/enemy swap for regen:** locate the existing per-biome render function(s) in `styleboard.py` (below line ~80, not yet read in full) that pick the player sprite and castle enemy sprite per render, and change the source file reference to Swamp Hunter (all 4 renders) and Hell hound (castle render only) — do not change the compositing/tiling/badge logic.

---

### `scripts/check-pink-gate.sh` + `scripts/lib/pink_scan.py` (new) — utility gate, batch/transform

**Analog:** `scripts/check-progress.sh` / `scripts/check-safety.sh` for shell shape; `styleboard.py`'s `hue_shift_band()` for the core HSV logic.

**Shell wrapper pattern** (mirrors `check-progress.sh`'s header/structure, lines 1-30 of that file):
```bash
#!/usr/bin/env bash
# check-pink-gate.sh — the ART-01 no-pink automated gate (HSV dominant-hue scan).
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"

fail() { echo "pink-gate checks: FAIL — $1" >&2; exit 1; }

python3 "$ROOT/scripts/lib/pink_scan.py" "$ROOT/assets" || fail "one or more assets exceed the pink/magenta dominant-hue threshold (see output above)"

echo "pink-gate checks: PASS"
```
Follow `check-progress.sh`/`check-safety.sh`'s exact conventions: `set -euo pipefail`, `ROOT="$(git rev-parse --show-toplevel)"`, a local `fail()` helper, a final unconditional `echo "<name> checks: PASS"` on success — this is the uniform invocation contract every gate in this family already honors, and the planner/executor should verify `bash scripts/check-pink-gate.sh` prints that exact trailing line.

**Core HSV scan pattern (Python helper)** — adapt `hue_shift_band()`'s loop into a read-only percentage counter, restricted to opaque (`alpha > 0`) pixels only (per CONTEXT.md's explicit "% of opaque pixels" framing and RESEARCH.md Pitfall 5):
```python
from PIL import Image

def pink_fraction(path, band_lo, band_hi, min_sat=30):
    rgba = Image.open(path).convert("RGBA")
    a = rgba.getchannel("A")
    hsv = rgba.convert("RGB").convert("HSV")  # MUST go via RGB first — direct
                                                # P-mode->HSV convert() raises
                                                # ValueError on Pillow >=6.0
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
Threshold: ~8-10% (CONTEXT.md-locked), HARD-FAIL severity. Exclude `assets/_*-src/` raw vendored-source directories from the scan (pre-bake, not shipped) — walk only the shipped `assets/` subtree per RESEARCH.md's architecture diagram.

---

### `CREDITS.md` — new rows (docs, CRUD-append)

**Analog:** existing table rows, e.g.:
```markdown
| Pixel Platformer (grass/dirt tiles) | `assets/tiles/ground.png` | Kenney (Kenney Vleugels) | https://kenney.nl/assets/pixel-platformer | CC0 | Ground/platform tileset — left/center/right/underside frames |
```
New Gothicvania rows must use the identical 6-column shape (`Asset | File | Author | Source | License | Used for`), author `ansimuz`, one row per vendored asset group (swamp/town/cemetery/castle atlas + player + hellhound enemy), appended to the existing `## Assets` table — never a new table or new heading level.

---

### `assets/LICENSES/<name>.txt` — new proof files (docs, file-I/O)

**Analog:** `assets/LICENSES/ground.txt` (full file read above) — exact structure to replicate:
```
Asset:        <path + brief content description>
Source pack:  "<pack name>"
Author:       <author>
Source URL:   <URL>
Source file:  <direct download URL, if applicable>
Tiles used:   <what was cropped/used, and why>
License:      CC0 (Creative Commons Zero / Public Domain)

Quoted license declaration from the pack's own bundled License.txt:
    "<exact quoted text>"

CC0 full text:  https://creativecommons.org/publicdomain/zero/1.0/

Processing note: <any remap/retint/crop rationale, referencing scripts/build-art-assets.py>

Verification: License page (<url>) and the pack's own bundled license file both
confirmed CC0 this session (<date>). NOT CC-BY.

Vendor logo / brand art: none.
```
One file per vendored asset group (e.g. `gothicvania-swamp.txt`, `gothicvania-town.txt`, `gothicvania-cemetery.txt`, `gothicvania-castle.txt` — castle folds in Church accents, document that fold explicitly in that one proof file's "Processing note").

---

### `docs/LEVEL-DESIGN.md` (new section) or new `docs/ART-CONVENTIONS.md` — docs, CRUD-append

**Analog:** `docs/LEVEL-DESIGN.md`'s own existing numbered-section convention (e.g. `## 6. Secret alcove (LVL-06)`, `## 6a. Movers ... — preview ahead of Phase 36`):
```markdown
## 6. Secret alcove (LVL-06)

Exactly one per level: a 24×24 (`CONFIG.ALCOVE_SIZE`) invisible walk-through trigger.

- Place it **~70px above an early/mid-level platform** as one extra optional hop...
```
If Claude's discretion lands on a new section in `docs/LEVEL-DESIGN.md`, follow this exact heading level (`## N. Title (REQ-ID)`), HARD/SOFT rule-tier convention already established at the top of the doc, and cite the concrete measured numbers (16x32 cap tile, lip offset in px) rather than vague prose — matching this doc's own stated standard ("Every number here is engine-measured... none are theory"). If a new `docs/ART-CONVENTIONS.md` file is chosen instead, open it with the same tier-legend preamble (lines 1-9 of `LEVEL-DESIGN.md`) for consistency with sibling docs.

---

## Shared Patterns

### Vendored-source directory convention
**Source:** `assets/_kenney-src/`, `assets/_opengameart-src/` (directory naming, referenced throughout `build-art-assets.py`)
**Apply to:** the new `assets/_gothicvania-src/` re-fetch target — same `_<pack>-src` naming, sibling under `assets/`, excluded from the pink-gate scan and from CREDITS.md rows (raw source, not a shipped asset).

### Palette-remap pipeline (`_remap` / `_remap_luminance`)
**Source:** `scripts/build-art-assets.py` lines 102-153
**Apply to:** every new baked biome atlas/sprite — reuse these two functions verbatim; do not write a third remap variant. Use `_remap_luminance` for narrow dark-grunge palettes (terrain/environment), `_remap` only if a wide-luminance player-style palette is needed (Swamp Hunter, per CONTEXT.md, ships as-is across all 4 biomes — confirm with the planner whether it gets ANY remap or ships closer to source colors, since "she picked it after viewing the style board" suggests its baked look should closely match what she approved).

### Gate-script shell conventions
**Source:** `scripts/check-progress.sh`, `scripts/check-safety.sh` (both fully read above)
**Apply to:** `scripts/check-pink-gate.sh` — `set -euo pipefail`, `ROOT="$(git rev-parse --show-toplevel)"`, local `fail()` helper, final `echo "<name> checks: PASS"`, comment-stripping only if this gate ever needs a negative code-content scan (it doesn't — it scans binary PNGs, not `src/*.js`, so `strip_comments` does NOT apply here).

### Pink/pitfall guards (Pillow HSV)
**Source:** `.planning/research/v6-scouting/styleboard.py`'s `hue_shift_band()`
**Apply to:** both the styleboard.py regen's retint pass AND the new `pink_scan.py` gate — always chain `.convert("RGBA").convert("RGB").convert("HSV")` (never convert P-mode directly to HSV — raises `ValueError` on Pillow ≥6.0), always gate on `alpha > 0` opaque pixels for both numerator and denominator.

## No Analog Found

None — every file in this phase's scope has at least a role-match analog already in the codebase (this phase is explicitly framed by RESEARCH.md as "every piece of infrastructure already exists in nearly-final form somewhere in this repo").

## Metadata

**Analog search scope:** `scripts/build-art-assets.py`, `scripts/check-*.sh`, `assets/LICENSES/*.txt`, `CREDITS.md`, `docs/LEVEL-DESIGN.md`, `.planning/research/v6-scouting/styleboard.py`, `src/config.js` (TILE_SIZE/PALETTE only)
**Files scanned:** 8 (all fully or near-fully read this session)
**Pattern extraction date:** 2026-07-10
