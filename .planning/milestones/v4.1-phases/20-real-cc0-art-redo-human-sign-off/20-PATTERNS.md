# Phase 20: Real CC0 Art Redo & Human Sign-off - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 12
**Analogs found:** 10 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `scripts/build-art-assets.py` | build-tooling / utility | file-I/O (crop/scale/composite/quantize/write PNG) | `scripts/generate-art-assets.py` | role-match (same tool, different source-of-truth: real art vs. procedural draw) |
| `scripts/screenshot-phase20.mjs` | utility / test | file-I/O (headless browser capture) | `scripts/screenshot-phase18.mjs` | exact (same Playwright static-server-serve-and-screenshot pattern, one more scene) |
| `assets/_kenney-src/` (raw vendored source, no code) | config / static data | file-I/O | none (new staging convention) | no analog — new directory, not code |
| `assets/player.png` (binary PNG) | static asset | file-I/O | `assets/player.png` (current, procedurally generated) | exact (same path, dimensions, frame layout unchanged — only content pipeline changes) |
| `assets/tiles/ground.png` (binary PNG) | static asset | file-I/O | `assets/tiles/ground.png` (current) | exact |
| `assets/parallax/{far,mid,near}.png` (binary PNG) | static asset | file-I/O | `assets/parallax/{far,mid,near}.png` (current) | exact |
| `assets/tiles/title-bg.png` (binary PNG) | static asset | file-I/O | `assets/tiles/title-bg.png` (current) | exact |
| `assets/LICENSES/player.txt` (rewrite) | config / documentation | file-I/O (static text) | `assets/LICENSES/player.txt` (existing, being rewritten) | exact (rewrite same file, same format) |
| `assets/LICENSES/ground.txt` (rewrite) | config / documentation | file-I/O | `assets/LICENSES/ground.txt` (existing) — not read directly this pass but same format as `player.txt` | exact (same template family) |
| `assets/LICENSES/parallax-*.txt` / `title-bg.txt` (new) | config / documentation | file-I/O | `assets/LICENSES/player.txt` | role-match (new files, same template) |
| `CREDITS.md` (edit rows) | documentation | file-I/O (markdown table) | `CREDITS.md` (existing) | exact (edit in place, same table schema) |
| `VERIFICATION.md` sign-off gate (phase deliverable, not code) | process / test | event-driven (human-in-the-loop, blocking) | `.planning/milestones/v3.0-phases/09-level-build-cc0-assets/09-VERIFICATION.md` (closest prior asset-license-proof phase) — but **no positive precedent** exists for an actually-blocking `AskUserQuestion` sign-off in any archived VERIFICATION.md (13,14,15,16,18,19 all self-declared "auto-approved") | no true analog — see "No Analog Found" below |

## Pattern Assignments

### `scripts/build-art-assets.py` (build-tooling, file-I/O)

**Analog:** `scripts/generate-art-assets.py` (full file read — 240 lines, small enough for single read)

**Module docstring + constants pattern** (lines 1-53):
```python
#!/usr/bin/env python3
"""Generate Phase 18 placeholder pixel-art assets for Math Lab.

Outputs dark-grunge PNGs matching the 18-UI-SPEC.md dimensions:
- assets/player.png          80x32  (5 frames of 16x32)
- assets/tiles/ground.png    80x16  (5 frames of 16x16)
...
"""
import os
import random
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BLACK = (0x0A, 0x0A, 0x0A)
...
PLAYER_BODY = (0xD8, 0xD8, 0xD8)
PLAYER_HEAD = (0xE8, 0xE8, 0xE8)
PLAYER_SHADOW = (0x90, 0x90, 0x90)
PLAYER_ACCENT = (0x00, 0xFF, 0x88)
```
**Reuse for build-art-assets.py:** keep the exact `ROOT` path-resolution idiom, the exact locked
hex-token constants (these ARE the palette-remap targets per RESEARCH.md Pattern 2), and the
module docstring convention (state exact output paths + dimensions at the top). Do NOT reuse the
`random.seed`/procedural-draw functions (`fill`, `noise_rect`, `tileable_noise`, `make_player`,
etc.) — those are precisely what this phase replaces. Keep `generate-art-assets.py` itself
UNCHANGED and unlabeled-as-shipped per CONTEXT.md (retained as a dev/prototyping tool).

**save() helper pattern** (lines 55-58):
```python
def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    print(f"generated {os.path.relpath(path, ROOT)} {img.size}")
```
Reuse verbatim in `build-art-assets.py` — same output contract (auto-mkdir, PNG write, relative-path
print for CLI feedback).

**Entry-point pattern** (lines 235-239):
```python
if __name__ == "__main__":
    make_player()
    make_ground()
    make_parallax()
    make_title_bg()
```
Reuse the same shape: one function per output asset group, called from `__main__`. Rename to
e.g. `build_player()`, `build_ground()`, `build_parallax()`, `build_title_bg()`, each internally
following RESEARCH.md's Patterns 1-4 (bbox-crop → uniform-scale → composite → `Image.quantize`
remap → dimension-assert → `save()`).

**Dimension-assert addition (new, from RESEARCH.md Pitfall 1 — not in the analog but required):**
```python
assert img.size == (80, 32), f"player sheet wrong size: {img.size}"
```
Add this assertion before every `save()` call in the new script — the analog file has no such
assertion (it can't be wrong, since it draws to a fixed canvas); the new script CAN silently
produce an off-size PNG from crop/scale math, so this guard is a required addition, not a
copy-paste.

---

### `scripts/screenshot-phase20.mjs` (utility, file-I/O / browser automation)

**Analog:** `scripts/screenshot-phase18.mjs` (full file read — 61 lines)

**Static file server pattern** (lines 1-40):
```javascript
import { chromium } from "/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs";
import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";

const ROOT = new URL("../", import.meta.url);
const PORT = 8766;   // NOTE: browser-boot.mjs already uses 8765 — pick a distinct port,
                      // e.g. 8767, to avoid collision if both scripts ever run concurrently.

const MIME = { ".html": "text/html", ".js": "application/javascript", ... };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let path = decodeURIComponent(url.pathname);
  if (path === "/") path = "/index.html";
  const filePath = join(ROOT.pathname, path);
  try {
    const data = await readFile(filePath);
    const mime = MIME[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((res) => server.listen(PORT, res));
```
Reuse verbatim — same MIME map, same tiny static server, same port-then-serve idiom.

**Capture + navigate pattern** (lines 42-60):
```javascript
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await context.newPage();

try {
  await page.goto(`http://localhost:${PORT}/src/index.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "phase18-title.png" });

  await page.keyboard.press("Space");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "phase18-select.png" });

  console.log("Screenshots saved: phase18-title.png, phase18-select.png");
} finally {
  await context.close();
  await browser.close();
  server.close();
}
```
**Extend (not just copy) for Phase 20:** RESEARCH.md's Validation Architecture/System Diagram
calls for title, select, in-level (player mid-run + mid-jump, tileset visible), and two
camera-X in-level shots to show parallax offset. Follow `browser-boot.mjs`'s save-seeding
pattern (below) to jump directly into a level via localStorage injection rather than manually
playing through — this avoids the screenshot script needing real gameplay input to reach a level.

**Save-seed-to-skip-to-level pattern, borrowed from `browser-boot.mjs`** (lines 1-35):
```javascript
const SAVE_KEY = "mathlab_platformer_v2";
const SAVE_BLOB = {
  version: 2, xp: 0, level: 1, accuracy: {}, history: {},
  levels: { "level-01": { cleared: true }, "level-02": { cleared: true }, "level-03": { cleared: true } },
};
// then, after page.goto(...):
await page.evaluate(({key, blob}) => localStorage.setItem(key, JSON.stringify(blob)), { key: SAVE_KEY, blob: SAVE_BLOB });
await page.reload({ waitUntil: "networkidle" });
```
Use this to seed a save and directly navigate into a level scene for the in-level/parallax
screenshots, instead of scripting keyboard-driven traversal.

---

### `assets/LICENSES/player.txt` and new proof files (documentation, file-I/O)

**Analog:** `assets/LICENSES/player.txt` (full file read — 23 lines; same template applies to
`ground.txt` and the new `parallax-*.txt`/`title-bg.txt` files)

**Exact template to replicate** (lines 1-23):
```
Asset:        assets/player.png  (player character — standing hooded figure, 16x32)
Source pack:  "6 Color Dungeon 16x16"
Author:       HorusKDI
Source URL:   https://opengameart.org/content/6-color-dungeon-16x16
Source file:  https://opengameart.org/sites/default/files/16x16%20dungeon%20tiles.png
Tile:         column 14, rows 5-6 of the 16x16 tile grid (16x32 standing figure)
License:      CC0 (Creative Commons Zero / Public Domain)

Quoted license declaration from the asset's own OpenGameArt page:
    "License(s): CC0"
    (OpenGameArt's License(s) metadata field is the creator's authoritative
     license declaration for the submission.)

CC0 full text:  https://creativecommons.org/publicdomain/zero/1.0/
    "...dedicated the work to the public domain... You can copy, modify,
     distribute and perform the work, even for commercial purposes, all without
     asking permission."

Verification: License page opened and the License(s): CC0 line confirmed this
session (2026-06-25). NOT merely "free" and NOT CC-BY.

Vendor logo / brand art: none.
```
**Field-by-field mapping for the rewrite (Kenney sources):** `Asset` / `Source pack` (now
"Platformer Characters (Adventurer)" for player, "Pixel Platformer" for ground, "Background
Elements" for parallax/title-bg) / `Author: Kenney (Kenney Vleugels)` / `Source URL` (stable
kenney.nl page) / `Source file` (resolved zip URL) / a `Poses used:`/`Tile:` line replacing the
old tile-coordinate line with the specific PNG filenames used / `License: CC0` / a `Quoted
license declaration` block quoting the pack's bundled `License.txt` line verbatim / CC0 full-text
link (unchanged) / `Verification:` dated this session, explicitly "NOT CC-BY" / `Vendor logo /
brand art: none.` closing line — RESEARCH.md's own "License-proof file template" Code Example
already instantiates this exact mapping for `player.txt` and should be used as-is.

---

### `CREDITS.md` (documentation, file-I/O)

**Analog:** `CREDITS.md` (full file read — 38 lines)

**Table row pattern to edit/extend** (lines 13-19):
```markdown
| Asset | File | Author | Source | License | Used for |
|-------|------|--------|--------|---------|----------|
| 6 Color Dungeon 16x16 (brick tile) | `assets/tiles/ground.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Solid ground / platform tile |
| 6 Color Dungeon 16x16 (figure) | `assets/player.png` | HorusKDI | https://opengameart.org/content/6-color-dungeon-16x16 | CC0 | Player character sprite (16x32) |
```
**Reuse:** replace the `player.png`/`ground.png` rows with Kenney-sourced rows (author "Kenney
(Kenney Vleugels)", source = the stable kenney.nl pack page, "Used for" description unchanged),
and append new rows for `parallax/{far,mid,near}.png` and `tiles/title-bg.png`, all citing
"Background Elements". Rows for `spike.png`/`goal.png`/`coin.png` stay untouched (out of scope).

**Notes-section pattern** (lines 21-33) — a bullet list explaining cross-file relationships,
re-gridding/derivative notes, and a rejected-alternative callout. Add a new bullet documenting
that Phase 18 shipped mislabeled procedural placeholders under the old CREDITS.md rows and that
this phase corrects the record (per CONTEXT.md Area 3's explicit honesty requirement) — mirrors
the existing "A separate OpenGameArt page ... was evaluated and rejected" bullet's tone/format.

---

## Shared Patterns

### Locked color tokens (constants reused across build script AND CREDITS/LICENSES prose)
**Source:** `scripts/generate-art-assets.py` lines 32-50 (`BLACK`/`PLAYER_BODY`/etc. hex constants)
**Apply to:** `scripts/build-art-assets.py`'s `PLAYER_PALETTE`/`ENVIRONMENT_PALETTE_*` lists
(RESEARCH.md Pattern 2) — these constants ARE the ground truth for "locked dark-grunge tokens";
do not invent new hex values, copy these exact ones forward into the quantize palette lists.

### Playwright static-serve-and-screenshot harness
**Source:** `scripts/screenshot-phase18.mjs` (whole file) + `scripts/browser-boot.mjs` (save-seed
lines 1-35)
**Apply to:** `scripts/screenshot-phase20.mjs` — combine both: phase18's server/MIME/screenshot
skeleton + browser-boot's `localStorage` save-seed trick to reach an in-level scene without manual
input scripting.

### License-proof-file ↔ CREDITS.md row cross-matching discipline
**Source:** `CREDITS.md` lines 8-9 ("Per-asset license proofs ... live alongside the art in
`assets/LICENSES/`. Each row below cross-matches one proof file.") + the 1:1 row-to-file mapping
already established for `ground.txt`/`spike.txt`/`goal.txt`/`player.txt`/`coin.txt`.
**Apply to:** every new/rewritten `assets/LICENSES/*.txt` file must have exactly one matching
CREDITS.md row (per RESEARCH.md Pitfall 5) — one row ↔ one proof file ↔ one verifiable source page,
even when the parallax layers share a single combined proof file (Claude's discretion per
CONTEXT.md; if combined, make ONE CREDITS.md row per output PNG still pointing at the same shared
proof file, or three rows all citing the same `.txt` — either is fine, just keep the cross-match
resolvable).

## No Analog Found

Files/behaviors with no close match in the codebase (planner should design fresh per RESEARCH.md,
not copy a non-existent precedent):

| File / Behavior | Role | Data Flow | Reason |
|------------------|------|-----------|--------|
| Blocking `AskUserQuestion` human sign-off task writing `VERIFICATION.md` status | process / test | event-driven, human-in-the-loop | RESEARCH.md's Pitfall 7 and "Human Sign-off Mechanism Precedent" both confirm, via direct grep of every archived `VERIFICATION.md`/`SUMMARY.md` in this repo (phases 13,14,15,16,18,19, plus `09-level-build-cc0-assets/09-VERIFICATION.md`), that NO prior phase ever actually invoked a real synchronous `AskUserQuestion` gate — every one either stayed `human_needed` indefinitely or self-declared "auto-approved in autonomous mode." The planner must design this task fresh: capture screenshots via the extended `screenshot-phase20.mjs`, then literally call `AskUserQuestion` with those screenshots/descriptions, record the literal human response text in `VERIFICATION.md`, and leave `status: human_needed` in frontmatter until that response is recorded. There is no code pattern to copy — this is a process/task-design requirement, follow RESEARCH.md's "Architecture Patterns" system diagram (Human Sign-off block) and Pitfall 7 directly. |
| `assets/_kenney-src/` staging directory + `curl`/`unzip` fetch steps | build-tooling | file-I/O | No existing script in this repo downloads external assets (the current pipeline is 100% procedural generation); RESEARCH.md's "Code Examples > Direct zip download" section is the source of truth here (fetch from stable kenney.nl page URL, re-resolve zip hash if it 404s, extract to `assets/_kenney-src/<pack>/`). |

## Metadata

**Analog search scope:** `scripts/`, `assets/LICENSES/`, `CREDITS.md`, `.planning/milestones/**/VERIFICATION.md`
**Files scanned:** `scripts/generate-art-assets.py`, `scripts/screenshot-phase18.mjs`,
`scripts/browser-boot.mjs`, `assets/LICENSES/player.txt`, `CREDITS.md`, plus a directory scan of
archived `VERIFICATION.md` files for sign-off precedent (found none usable, as documented above).
**Pattern extraction date:** 2026-07-03
