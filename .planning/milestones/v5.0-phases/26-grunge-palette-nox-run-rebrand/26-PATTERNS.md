# Phase 26: Grunge Palette & Nox Run Rebrand - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 13 (modified) + 3 (new)
**Analogs found:** 15 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/config.js` (+`CONFIG.PALETTE`, extended `DOOR`/`ENEMY`) | config | transform (data-only) | itself (existing block conventions) | exact — extend existing file |
| `src/levels/build.js` (door/enemy panel: `rect()+color()` → `sprite()`; floor/platform theme-aware sprite name) | component-factory (Kaplay entity builder) | request-response (build-once per level load) | itself, lines 166-269 (door/gate/enemy panel blocks) | exact — extend existing blocks |
| `src/parallax.js` (`makeParallaxLayers(bounds)` → `makeParallaxLayers(bounds, theme)`) | utility/component-factory | transform (per-frame position update + one-time build) | itself | exact — parameterize existing function |
| `src/levels/level-0N.js` ×8 (`theme: null` → `theme: "theme-N"`) | model (pure data descriptor) | CRUD (static data) | `src/levels/level-01.js` (same file type, sibling files identical shape) | exact |
| `src/scenes/title.js` (logo sprite + reveal tween; `ACCENT_GREEN` etc. → `CONFIG.PALETTE`; string sweep) | route/scene (Kaplay scene factory) | event-driven (scene-enter, key/click handlers) | itself + `src/ui/hud.js` (level-up flash tween idiom) | exact (self) / role-match (tween idiom) |
| `src/scenes/select.js` (local color consts → `CONFIG.PALETTE`) | route/scene | request-response (build grid, cursor nav) | itself | exact — extend existing file |
| `src/ui/hud.js` (local color consts → `CONFIG.PALETTE`) | component (fixed HUD overlay) | event-driven (reads progress, self-cleans flash tween) | itself | exact |
| `src/ui/challenge.js` (local color consts → `CONFIG.PALETTE`) | component (shared math-challenge panel) | request-response | itself | exact |
| `src/fx.js` (local color consts → `CONFIG.PALETTE`) | utility (juice/fx) | event-driven (self-cleaning tweens) | itself | exact |
| `src/mechanics/door.js`, `gates.js`, `enemy.js` (no logic change; panel entity now a sprite, `panelObj`/`glyphObj` destroy wiring untouched) | middleware/event-handler | event-driven (`onCollide` handlers) | `src/mechanics/enemy.js` lines with `panelObj`/`glyphObj` destroy | exact — no functional change, verify unaffected |
| `scripts/build-art-assets.py` (+`PALETTE` dict, N theme sub-palettes, `build_logo()`, `build_door()`, `build_enemies()`, theme-parameterized `build_ground()`/`build_parallax()`) | build-pipeline / utility | batch (offline PNG bake) | itself — `build_parallax()` (lines 261-299) and `build_ground()` (lines 196-219) | exact — extend existing functions with a loop |
| `scripts/check-rebrand.sh` (NEW) | test/gate script | batch (grep-based static check) | `scripts/check-safety.sh` (comment-stripped whole-tree grep gate pattern) | role-match — same gate family |
| `scripts/check-contrast.mjs` or `.py` (NEW) | test/utility | transform (pure computation over `CONFIG.PALETTE`) | none in-tree (new capability); use RESEARCH.md's provided WCAG formula | no analog — see below |
| `scripts/check-progress.sh` (update hardcoded `mathlab_platformer_v2` grep IF save key renamed) | test/gate script | batch | itself | exact — single-line literal update |
| `assets/_font-src/`, `assets/_opengameart-src/` (NEW vendor dirs) + `assets/LICENSES/*.txt` (NEW proof files) | asset/config | file-I/O (static, committed) | `assets/_kenney-src/`, `assets/LICENSES/spike.txt` / `goal.txt` | exact — established provenance convention |
| `CREDITS.md` (+ door/enemy/font rows) | config/doc | CRUD (static append) | itself — existing per-asset row format | exact |
| `README.md`, `docs/DEPLOY.md`, `docker/Dockerfile`, `src/index.html`, `src/main.js`, `src/progress.js` (string sweep only, no logic change) | doc/config/route | transform (literal string replace) | grep inventory in RESEARCH.md (Runtime State Inventory table) — no code pattern needed, mechanical sweep | n/a (mechanical) |

## Pattern Assignments

### `src/config.js` — add `CONFIG.PALETTE`, extend `DOOR`/`ENEMY`

**Analog:** itself — follow the existing per-block commenting/structure convention exactly (see `DOOR`/`MATH_GATE`/`ENEMY` blocks, lines 95-123).

**Existing duplicated-color inventory to centralize (VIS-01), read directly from `src/config.js` + grep across the tree** (do not re-derive — this table is already compiled in RESEARCH.md Pattern 1):
- `ACCENT_GREEN` `[0x00,0xff,0x88]` — 5 files
- `LABEL_FG`/`HINT_FG` `[0xe8,0xe8,0xe8]` — 5 files
- `PANEL_BG` `[20,20,20]` — 2 files
- `PANEL_BORDER` `[0x33,0x33,0x33]` — 2 files + `hud.js TRACK_GREY`
- `DANGER_RED`/`ACCENT_RED` `[0xff,0x44,0x33]` — 2 files + `CONFIG.ENEMY.COLOR`
- `LOCKED_GREY` `[0x44,0x44,0x44]` — `CONFIG.DOOR`, `CONFIG.MATH_GATE`, `select.js`
- `LOCKED_BORDER` `[0x55,0x55,0x55]` — `CONFIG.DOOR`, `CONFIG.MATH_GATE`, `select.js`
- `BOX_BG`/`PICKUP_BG` `[30,30,30]`
- `BOX_BORDER`/`PICKUP_BORDER` `[0x44,0x44,0x44]`

**Existing DOOR/ENEMY blocks to extend** (`src/config.js:98-123`):
```javascript
// --- Locked door (mid-level challenge seam; Plan 15-03) ---
DOOR: {
  W: 32, // px — door footprint width
  H: 64, // px — door panel height (compact visual; an invisible tall blocker handles physics)
  LOCKED_GREY: [0x44, 0x44, 0x44], // locked fill (matches select.js LOCKED_GREY)
  LOCKED_BORDER: [0x55, 0x55, 0x55], // locked outline (matches select.js LOCKED_BORDER)
  GLYPH_SIZE: 22, // px — lock glyph text size (matches SELECT.GLYPH_SIZE)
},
// ...
// --- Defeat-enemy placeholder (MECH-05) ---
// Compact square placeholder; Phase 18 replaces it with a sprite. Muted red, no pink.
ENEMY: {
  W: 32, // px — enemy footprint width
  H: 32, // px — enemy footprint height
  COLOR: [0xff, 0x44, 0x33], // muted red placeholder (NO pink)
  GLYPH_SIZE: 22, // px — enemy glyph text size
},
```
Add `SPRITES: ["door"]` / `SPRITES: ["enemy-1","enemy-2","enemy-3"]` fields alongside existing dims — keep `COLOR`/`LOCKED_GREY` as documented fallback/legacy tokens or fold into `CONFIG.PALETTE` per VIS-01 sequencing (centralize first).

**Save key block to touch IF renamed** (`src/config.js:167-170`):
```javascript
SAVE: {
  KEY: "mathlab_platformer_v2", // v4.0 clean-reset localStorage key for the platformer progression
  VERSION: 2, // v4.0 save-format version (gate: a foreign/older blob → safe defaults)
},
```

---

### `src/parallax.js` — thread `theme` param (VIS-03)

**Analog:** itself, `makeParallaxLayers(bounds)` (lines 44-74) and `makeParallaxLayer(name, ...)` (lines 21-37).

**Core pattern to extend** (lines 44-74) — currently hardcodes literal sprite names `"bg-far"`/`"bg-mid"`/`"bg-near"`; must accept `theme` and template the name (e.g. `` `bg-far-${theme}` ``), with a safe fallback if `theme` is `null`/unset:
```javascript
export function makeParallaxLayers(bounds) {
  const P = CONFIG.PARALLAX;
  const safeBounds = {
    left: bounds?.left ?? CONFIG.LEVEL_LEFT,
    right: bounds?.right ?? CONFIG.LEVEL_RIGHT,
  };
  return [
    {
      name: "bg-far",
      instances: makeParallaxLayer("bg-far", safeBounds, P.FAR_RATIO, P.FAR_Z, P.Y_ANCHOR - 120),
      ratio: P.FAR_RATIO,
    },
    // ...
  ];
}
```
Same per-key-defaulting idiom (`bounds?.left ?? CONFIG.LEVEL_LEFT`) must be preserved when adding the theme parameter — do not regress the NaN-guard documented in the existing comment block (lines 46-56).

**Caller wiring gap (per RESEARCH.md Pitfall B):** `game.js` has `levelData` in scope but currently never reads `.theme`; this is the file that must call `makeParallaxLayers(bounds, levelData.theme)` and pass the same theme into `buildLevel(levelData)`.

---

### `src/levels/build.js` — door/enemy panel sprite swap (VIS-04) + theme-aware ground sprite (VIS-03)

**Analog:** itself — door panel block (lines 174-193), enemy panel block (lines 254-269).

**Door panel — exact lines to change (174-193)**:
```javascript
const panel = add([
  rect(CONFIG.DOOR.W, CONFIG.DOOR.H),
  pos(d.x, d.y),
  color(...CONFIG.DOOR.LOCKED_GREY),
  outline(2, rgb(...CONFIG.DOOR.LOCKED_BORDER)),
  "door-panel",
]);
// Visual lock glyph — purely cosmetic, no area() so it never collides.
const glyph = add([
  text("X", { size: CONFIG.DOOR.GLYPH_SIZE }),
  pos(d.x + CONFIG.DOOR.W / 2, d.y + CONFIG.DOOR.H / 2),
  color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
  "door-glyph",
]);
// ...
blocker.panelObj = panel;
blocker.glyphObj = glyph;
```
Becomes (per RESEARCH.md Pattern 3 — only the panel's component list changes to `sprite("door")`; `panelObj`/`glyphObj` stash-and-destroy wiring in `door.js` stays untouched; whether the glyph is kept alongside the sprite is an open call, default to dropping it since a real sprite doesn't need the "X"):
```javascript
const panel = add([
  sprite("door"),
  pos(d.x, d.y),
  "door-panel",
]);
```

**Enemy panel — exact lines to change (254-269)**, same treatment, plus variant selection:
```javascript
const panel = add([
  rect(CONFIG.ENEMY.W, CONFIG.ENEMY.H),
  pos(e.x, e.y),
  color(...CONFIG.ENEMY.COLOR),
  "enemy-panel",
]);
const glyph = add([
  text("!", { size: CONFIG.ENEMY.GLYPH_SIZE }),
  pos(e.x + CONFIG.ENEMY.W / 2, e.y + CONFIG.ENEMY.H / 2),
  color(LABEL_FG[0], LABEL_FG[1], LABEL_FG[2]),
  "enemy-glyph",
]);
enemyObj.panelObj = panel;
enemyObj.glyphObj = glyph;
```
Becomes:
```javascript
const panel = add([
  sprite(CONFIG.ENEMY.SPRITES[e.variant ?? 0]), // e.g. "enemy-1"/"enemy-2"/"enemy-3"
  pos(e.x, e.y),
  "enemy-panel",
]);
```

**Floor/ground sprite** — currently `rect()` for floor colliders (line 96) is a plain collider rect, not a sprite; the actual ground tile sprite call (theme-aware target) needs locating separately — grep `sprite("ground"` in `build.js` for the exact ground-tile sprite call site before editing (not captured in the excerpts pulled this pass; verify at plan time).

**Untouched invariant:** the invisible tall collision blocker (`opacity(HIDDEN), area(), body({isStatic:true})`, e.g. lines 166-167 for door, 245-246 for enemy) must NOT be touched by VIS-04 — physics stays exactly as-is.

---

### `src/mechanics/door.js` / `gates.js` / `enemy.js` — verify unaffected

**Analog:** itself. Confirm the identical `panelObj`/`glyphObj` destroy-together pattern (per RESEARCH.md: `if (enemyObj.panelObj) destroy(enemyObj.panelObj); if (enemyObj.glyphObj) destroy(enemyObj.glyphObj);`) still works when `panelObj` is a `sprite()`-based entity instead of `rect()`-based — Kaplay's `destroy()` is component-agnostic, so this should be a no-op change, but it is the correctness check for VIS-04's "collision untouched" claim.

---

### `src/scenes/title.js` — logo sprite + reveal tween (BRAND-01, BRAND-03) + palette centralization + string sweep

**Analog:** itself, `confirmReset()`'s self-destroying "Progress reset." banner tween (exact idiom to copy for the logo reveal, per RESEARCH.md Code Examples):
```javascript
// Source: src/scenes/title.js confirmReset()
const banner = add([
  text("Progress reset.", { size: T.PROMPT_SIZE }),
  anchor("center"),
  pos(center()),
  color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
  opacity(1),
  fixed(),
  z(9500),
  "title",
]);
tween(1, 0, T.RESET_FLASH_MS / 1000, (v) => (banner.opacity = v), easings.easeOutQuad).onEnd(
  () => destroy(banner),
);
```
For the logo reveal: tween opacity 0→1 (or opacity+scale) over ≤500ms, triggered unconditionally at scene-enter (top-level of `titleScene()`, not inside an input handler) — mirrors the existing `title-bg` sprite mount pattern:
```javascript
add([sprite("title-bg"), pos(0, 0), fixed(), z(CONFIG.TITLE_BG_Z), "title"]);
```

**Current wordmark call to REPLACE with the new logo sprite** (lines 50-58):
```javascript
add([
  text("Math Lab", { size: T.TITLE_SIZE }),
  anchor("center"),
  pos(center()),
  color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
  fixed(),
  z(9000),
  "title",
]);
```

**Local color consts to replace with `CONFIG.PALETTE` reads** (lines 27-33):
```javascript
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // "Math Lab" wordmark
const HINT_FG = [0xe8, 0xe8, 0xe8];
const RESET_FG = [0x88, 0x88, 0x88];
const DANGER_RED = [0xff, 0x44, 0x33];
const PANEL_BG = [20, 20, 20];
const PANEL_BORDER = [0x33, 0x33, 0x33];
```

**String sweep targets in this file:** header comment ("the Math Lab title scene"), inline comments referencing "Math Lab" wordmark, the `text("Math Lab", ...)` call itself (line 1, 28, 38, 50, 53 per RESEARCH.md Runtime State Inventory).

---

### `src/ui/hud.js` — palette centralization only

**Analog:** itself, lines 32-34 (local color consts to replace):
```javascript
const TRACK_GREY = [0x33, 0x33, 0x33]; // XP bar track (empty portion)
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // badge + XP fill + level-up flash
const HINT_FG = [0xe8, 0xe8, 0xe8]; // controls hint text
```
Same self-cleaning level-up flash tween idiom already lives here — a second precedent for the logo reveal tween if `title.js`'s is insufficiently illustrative.

---

### `scripts/build-art-assets.py` — theme-parameterized bake (VIS-03) + new build functions (VIS-04, BRAND-01)

**Analog:** itself — `build_parallax()` (lines 261-299) and `build_ground()` (lines 196-219), which already call `_remap_luminance(sheet_or_layer, SOME_PALETTE)`; extend into a loop over N theme sub-palettes rather than one static call:
```python
def build_ground():
    # ...
    remapped = _remap_luminance(sheet, ENVIRONMENT_PALETTE)
    # ...

def build_parallax():
    # ...
    far_remapped = _remap_luminance(far, ENVIRONMENT_PALETTE_FAR)
    # ...
    mid_remapped = _remap_luminance(mid, ENVIRONMENT_PALETTE_MID)
    # ...
    near_remapped = _remap_luminance(near, ENVIRONMENT_PALETTE_NEAR)
```
Per-layer sub-palette derivation pattern to copy for the 8 new theme sub-palettes (lines 234-248):
```python
ENVIRONMENT_PALETTE_FAR = [ENVIRONMENT_PALETTE[0], ENVIRONMENT_PALETTE[6], ENVIRONMENT_PALETTE[3]]
ENVIRONMENT_PALETTE_MID = [
    ENVIRONMENT_PALETTE[0], ENVIRONMENT_PALETTE[1], ENVIRONMENT_PALETTE[3],
    ENVIRONMENT_PALETTE[4], ENVIRONMENT_PALETTE[5],
]
```
New `build_logo()`, `build_door()`, `build_enemies()` are new functions with no direct in-file analog for their SPECIFIC crop/compose logic, but must follow `build_player()` (lines 154-191, uses `_remap` for a wide-range palette + `loadSprite`-compatible frame slicing) as the closest structural template for "load source PNG → remap → save."

---

### `scripts/check-rebrand.sh` (NEW) — permanent grep gate

**Analog:** `scripts/check-safety.sh` (lines 1-29) — the project's established whole-tree comment-stripped grep-gate pattern:
```bash
#!/usr/bin/env bash
# check-safety.sh — the SAFE-01 ADHD-safety audit gate for the whole src/ tree.
# ...
# CRITICAL nuance: banned words already appear LEGITIMATELY in existing code COMMENTS
# ... So every negative scan runs on a COMMENT-STRIPPED view of each file (the
# strip_comments pre-pass) — it matches code, never comments.
# ...
# Each assertion exits non-zero with a clear message on failure. On full success it
# prints "safety checks: PASS".
```
`check-rebrand.sh` should follow the identical shape: negative-grep for `mathlab`/`Math Lab` outside an explicit allowlist (the "school-game inspiration comments" + `src/progress.js`'s `mathlab_save_*` references per CONTEXT.md), scoped to the full sweep list (HTML, README, docs, docker, src) not just `src/`, exiting non-zero with a clear message, printing a PASS banner on success.

---

### `scripts/check-contrast.mjs` (NEW) — no analog, use RESEARCH.md's provided formula

**No existing analog** — no contrast-check tooling exists in-tree. Use the WCAG formula RESEARCH.md already worked out verbatim (Code Examples section):
```javascript
function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
function contrastRatio(rgbA, rgbB) {
  const L1 = relativeLuminance(rgbA), L2 = relativeLuminance(rgbB);
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (lighter + 0.05) / (darker + 0.05); // AA text needs >= 4.5, UI components >= 3.0
}
```
Structural analog for "small standalone Node script reading project config, no framework" is `scripts/validate-levels.mjs` (referenced in CLAUDE.md's verification gates) — follow its CLI-script shape (plain Node, no deps, clear pass/fail exit code) rather than any browser-facing script.

---

### `assets/_font-src/`, `assets/_opengameart-src/` (NEW vendor dirs) + license proofs

**Analog:** `assets/_kenney-src/` (existing vendor-source convention) and `assets/LICENSES/spike.txt` / `goal.txt` (existing per-asset license proof-file template — quote the source page's own "License(s):" field, record exact URL, date-stamp). Follow byte-for-byte the same template for the new `monogram.ttf`, `6-color-dungeon` gate sheet, and any new Kenney "Pixel Platformer" enemy frames (which extend the ALREADY-vendored `assets/_kenney-src/pixel-platformer/` dir, not a new one).

---

## Shared Patterns

### Palette centralization
**Source:** `src/config.js` (new `CONFIG.PALETTE` object, following the existing per-block comment-header convention used by `DOOR`/`ENEMY`/`MATH_GATE`/`COLLECT`)
**Apply to:** `src/scenes/title.js`, `src/scenes/select.js`, `src/ui/hud.js`, `src/ui/challenge.js`, `src/ui/mathGate.js`, `src/fx.js`, `src/config.js`'s own `DOOR`/`MATH_GATE`/`ENEMY`/`COLLECT` blocks — every file in the RESEARCH.md duplication inventory (Pattern 1).
**Sequencing:** VIS-01 (centralize existing colors) MUST land before VIS-02 (add 3 new hues) and before VIS-03/VIS-04 read palette tokens for theme baking — every other change in this phase reads from `CONFIG.PALETTE`.

### Self-cleaning tween idiom (no timers/schedulers)
**Source:** `src/scenes/title.js` `confirmReset()`'s "Progress reset." banner (`tween(...).onEnd(() => destroy(...))`), mirrored identically in `src/ui/hud.js`'s level-up flash.
**Apply to:** BRAND-03's logo reveal tween — same `tween()` + `easings.easeOutQuad` + `.onEnd(() => destroy(...))` idiom, single-shot, ≤500ms, non-strobing. This is a hard project invariant (`check-safety.sh`'s no-timer/no-scheduler gate) — do NOT use `setTimeout`/`wait()`/`loop()`.

### Cosmetic-panel vs. collision-blocker split
**Source:** `src/levels/build.js` door/enemy panel blocks (lines 166-269) — every mechanic already separates an invisible tall physics blocker from a separate cosmetic `-panel` entity and an optional `-glyph` text entity, destroyed together via stashed `panelObj`/`glyphObj` refs in the mechanics modules.
**Apply to:** VIS-04's door/enemy sprite swap — change ONLY the `-panel` entity's component list (`rect()+color()+outline()` → `sprite(...)`); never touch the blocker or the destroy wiring.

### Whole-tree grep gate scripts
**Source:** `scripts/check-safety.sh` (comment-stripped negative-grep pattern, clear PASS banner, non-zero exit on failure)
**Apply to:** `scripts/check-rebrand.sh` (NEW) — the BRAND-02 permanent regression check.

### Build-time Pillow remap (not runtime tint)
**Source:** `scripts/build-art-assets.py`'s `_remap()` / `_remap_luminance()` (lines 100-152), already used by `build_player()`, `build_ground()`, `build_parallax()`.
**Apply to:** VIS-02/VIS-03's new hues and 8 theme variants, VIS-04's door/enemy sprite processing, BRAND-01's logo bake — all are parameterizations of these two EXISTING functions, not new pipeline code. Runtime `color()` shader tinting is explicitly rejected (see RESEARCH.md Pattern 2 / Anti-Patterns).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/check-contrast.mjs` (or `.py`) | test/utility | transform | No existing contrast-check tooling in-tree; use the WCAG formula RESEARCH.md already derived (Code Examples section) — implement as a small standalone script, no library dependency (matches zero-new-dependency posture) |
| `assets/logo-hero.png` / `assets/logo-badge.png`, `assets/door.png`, `assets/enemy-{1,2,3}.png` (new baked art) | asset | file-I/O | No direct pixel-content analog (new source packs); PROCESS analog is `build_player()`/`build_ground()`'s load→remap→save shape in `build-art-assets.py` |

## Metadata

**Analog search scope:** `src/config.js`, `src/parallax.js`, `src/levels/build.js`, `src/levels/level-01.js`, `src/levels/index.js`, `src/scenes/title.js`, `src/ui/hud.js`, `scripts/build-art-assets.py`, `scripts/check-safety.sh`
**Files scanned:** 9 read/grepped directly this session, plus RESEARCH.md's own prior full-tree grep inventories (color duplication, "mathlab" string sweep) reused verbatim rather than re-derived
**Pattern extraction date:** 2026-07-07
