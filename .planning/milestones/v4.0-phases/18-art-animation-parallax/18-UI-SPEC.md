---
phase: 18
slug: art-animation-parallax
status: draft
shadcn_initialized: false
preset: none
created: 2026-07-03
---

# Phase 18 — UI Design Contract: Art, Animation & Parallax

> Visual and interaction contract for the Math Lab v4.0 art pass. Locks player animation, tileset frames, parallax layers, and title/select screen styling before implementation planning.
>
> Source of truth for: `src/main.js` sprite loads, `src/player.js` animation state machine, `src/levels/build.js` tile-frame selection, `src/scenes/game.js` parallax update, `src/scenes/title.js` and `src/scenes/select.js` styling.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Kaplay 3001.0.19 (vendored, `global: true`) |
| Preset | not applicable |
| Component library | none — canvas-based in-game UI only |
| Icon library | none — text glyphs only (`X`, `v`, `!`, `?`) |
| Font | Kaplay default bitmap font (no custom font load) |
| Internal resolution | 640 × 360 px |
| Tile grid | 16 × 16 px |

---

## Spacing Scale

The game already runs on a 16 px grid; Phase 18 inherits and extends it.

| Token | Value | Usage |
|-------|-------|-------|
| tile | 16 px | Tile grid step, player sprite width |
| player-h | 32 px | Player sprite height |
| xs | 4 px | Dust particle size, outline width delta |
| sm | 8 px | Tight spacing inside panels |
| md | 16 px | Standard gap between related objects |
| lg | 24 px | Horizontal gap between level-select tiles (`SELECT.GAP`) |
| xl | 32 px | Minimum parallax layer height step |
| 2xl | 48 px | Checkpoint marker height, small parallax layer height |
| 3xl | 64 px | Tile texture strip height if used |

Exceptions:
- Player sprite frames are 16 × 32 px (non-square) to preserve the existing collider/footprint.
- Parallax layers are wide horizontal strips (640+ px wide, 90–180 px tall) to cover the authored level extents.

---

## Typography

All text is rendered by Kaplay `text()`. Sizes are locked to existing scene configs; Phase 18 only adds the occasional glyph label.

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 64 px | default | Title wordmark "Math Lab" (`CONFIG.TITLE.TITLE_SIZE`) |
| Heading | 24 px | default | Level-select heading "Select a Level" (`CONFIG.SELECT.HEADING_SIZE`) |
| Label | 28 px | default | Level-select tile number (`CONFIG.SELECT.LABEL_SIZE`) |
| Glyph | 22 px | default | Lock/check glyphs on tiles, doors, gates (`CONFIG.DOOR.GLYPH_SIZE`) |
| Prompt | 20 px | default | Title press-to-start prompt (`CONFIG.TITLE.PROMPT_SIZE`) |
| Body / HUD | 12–18 px | default | Controls hint, HUD badge, XP bar (`CONFIG.HUD.BADGE_SIZE`, `CONFIG.HINT.SIZE`) |

Line height is Kaplay default; single-line text only.

---

## Color

Reuse the existing dark-grunge palette. **No pink anywhere.**

| Role | Value | Usage |
|------|-------|-------|
| Dominant (stage bg) | `#0a0a0a` | Kaplay `background`, title/select backdrop, empty void |
| Secondary (surface) | `#111111` | Title/select panel fill, unlocked/cleared tile fill |
| Secondary (panel) | `#1a1a1a` | Parallax near-grunge accent |
| Accent (10%) | `#00ff88` | Title wordmark, unlocked borders, XP bar, coin pop, level-clear burst, controls hint key highlight |
| Cleared / info | `#66ccff` | Cleared level tile border + check glyph, optional parallax far-layer tint |
| Foreground / label | `#e8e8e8` | Tile numbers, prompt text, HUD text (~18:1 on `#0a0a0a`) |
| Locked fill | `#444444` | Locked tile fill, locked door/gate fill |
| Locked border | `#555555` | Locked tile/door/gate outline |
| Track grey | `#333333` | HUD XP bar empty track |
| Dust grey | `#888888` | Landing dust particles |
| Muted red | `#ff4433` | Wrong-pickup nudge, enemy placeholder replacement (NO pink) |
| Cursor white | `#ffffff` | Active keyboard-cursor outline on level-select |

Accent reserved for:
- Title "Math Lab" wordmark
- Unlocked level-select tile borders
- HUD level badge + XP fill + level-up flash
- Coin collect pop + level-clear burst
- Correct-answer pickup glow

---

## Copywriting Contract

Phase 18 does not introduce new functional copy. Existing strings stay locked:

| Element | Copy | Notes |
|---------|------|-------|
| Title wordmark | `Math Lab` | Neon green, centered |
| Title prompt | `press ENTER / SPACE / click to start` | Light grey, below wordmark |
| Select heading | `Select a Level` | Light grey |
| Locked tile glyph | `X` | Grey fill, dim border |
| Cleared tile glyph | `v` | Check mark, blue border |
| Controls hint | `← → move · SPACE jump` | Bottom-left HUD hint (do not change; SAFE-02 audit greps for "SPACE jump") |

No new error/empty/destructive copy in this phase.

---

## Asset Contract

All new assets are PNG sprites loaded from `../assets/...` in `src/main.js` after `kaplay()`. Paths use the web-root convention (assets is a sibling of the served `src/` root).

### Player sprite (`assets/player.png`)

- **Sheet layout:** one horizontal row of 5 frames.
- **Frame size:** 16 × 32 px each → total sheet is 80 × 32 px.
- **Frames:**
  - `0` — idle frame 1
  - `1` — idle frame 2
  - `2` — run frame 1
  - `3` — run frame 2
  - `4` — jump frame (single)
- **No transparent padding** around the character; the 16 × 32 area must match the existing `area()` collider footprint.
- **Art direction:** dark silhouette with minimal internal detail so it reads clearly against parallax layers. Keep the bottom (feet) aligned to the frame bottom for consistent ground contact.

### Tileset (`assets/tiles/ground.png`)

- **Sheet layout:** one horizontal row of 5 frames.
- **Frame size:** 16 × 16 px each → total sheet is 80 × 16 px.
- **Frames:**
  - `0` — single / standalone top tile (used for 1-tile wide runs or column caps)
  - `1` — left edge of a run
  - `2` — center fill of a run
  - `3` — right edge of a run
  - `4` — underside / column / platform bottom (vertical support or platform belly)
- **Art direction:** dark-grunge, near-black with rough edges and subtle highlight so silhouettes read against the parallax background. No pink.

### Parallax layers

Three wide static PNG strips, intended to tile/repeat horizontally across each level.

| Layer | Asset path | Dimensions (min) | Scroll ratio | z-index | Color mood |
|-------|------------|------------------|--------------|---------|------------|
| Far | `assets/parallax/far.png` | 640 × 120 px (tileable X) | 0.15 | -30 | Faint mountain/city silhouette, `#151515` / `#0f0f1a` |
| Mid | `assets/parallax/mid.png` | 640 × 144 px (tileable X) | 0.45 | -20 | Dark structural shapes, `#111111` / `#1a1a20` |
| Near | `assets/parallax/near.png` | 640 × 90 px (tileable X) | 0.75 | -10 | Subtle grunge texture, `#0f0f0f` / `#141414` |

- All layers are **static images** — no animation, no timers.
- Each layer is drawn at `y` so the bottom edge sits near or just above `CONFIG.FLOOR_Y` (320), leaving the playable floor and player z-space clear.
- Layers are tiled/repeated to cover at least `[0, level.bounds.right]` plus one extra tile width on each side.

### Title / select background

- **Asset:** `assets/tiles/title-bg.png`
- **Dimensions:** 640 × 360 px (or seamlessly tileable 640 × 360)
- **Usage:** added behind all text/tiles in `title.js` and `select.js` with `fixed()` and `z(-100)`.
- **Art direction:** dark-grunge texture, very low contrast, no animation, no bright or rapidly moving elements.

---

## `loadSprite` Contract

All loads live in `src/main.js` after `kaplay()`. Replace the existing single-frame loads with the sheet versions below.

```js
// Player: 5 frames in one row, 16x32 each
loadSprite("player", "../assets/player.png", {
  sliceX: CONFIG.PLAYER_FRAMES, // 5
  anims: {
    idle: { from: 0, to: 1, loop: true, speed: CONFIG.PLAYER_IDLE_SPEED },   // ~6 fps
    run: { from: 2, to: 3, loop: true, speed: CONFIG.PLAYER_RUN_SPEED },     // ~10 fps
    jump: { from: 4, to: 4, loop: false, speed: CONFIG.PLAYER_JUMP_SPEED }, // single frame
  },
});

// Ground tileset: 5 frames in one row, 16x16 each
loadSprite("ground", "../assets/tiles/ground.png", {
  sliceX: CONFIG.GROUND_FRAMES, // 5
});

// Existing sprites remain unchanged
loadSprite("spike", "../assets/spike.png");
loadSprite("goal", "../assets/goal.png");
loadSprite("coin", "../assets/coin.png", {
  sliceX: CONFIG.COIN_FRAMES,
  anims: {
    spin: { from: 0, to: CONFIG.COIN_FRAMES - 1, loop: true, speed: CONFIG.COIN_SPIN_SPEED },
  },
});

// Parallax background layers
loadSprite("bg-far", "../assets/parallax/far.png");
loadSprite("bg-mid", "../assets/parallax/mid.png");
loadSprite("bg-near", "../assets/parallax/near.png");

// Title / level-select shared dark-grunge backdrop
loadSprite("title-bg", "../assets/tiles/title-bg.png");
```

---

## Animation Contract

### Player animation state machine

Implemented in `src/player.js` inside `makePlayer`, after the entity is created.

| State | Condition | Animation | Notes |
|-------|-----------|-----------|-------|
| idle | `isGrounded() && abs(vel.x) < CONFIG.PLAYER_ANIM_DEADZONE` | `idle` | 2-frame loop |
| run | `isGrounded() && abs(vel.x) >= CONFIG.PLAYER_ANIM_DEADZONE` | `run` | 2-frame loop |
| jump | `!isGrounded()` | `jump` | single frame |

- **State-change guard:** only call `player.play(anim)` when `player.getCurAnim()?.name !== anim` to avoid resetting to frame 0 every update.
- **Facing:** set `player.flipX = player.vel.x < 0` only when `abs(vel.x) >= CONFIG.PLAYER_ANIM_DEADZONE`; preserve the last facing direction when velocity drops into the deadzone (no jitter at rest).

### Timing constants

Proposed additions to `CONFIG` in `src/config.js`:

```js
PLAYER_FRAMES: 5,           // count — player.png sliceX
PLAYER_ANIM_DEADZONE: 10,   // px/s — below this treat as idle/rest
PLAYER_IDLE_SPEED: 6,       // fps
PLAYER_RUN_SPEED: 10,       // fps
PLAYER_JUMP_SPEED: 0,       // fps — single-frame anim, speed ignored

GROUND_FRAMES: 5,           // count — ground.png sliceX
```

- Idle loop: 2 frames at 6 fps → ~333 ms per cycle.
- Run loop: 2 frames at 10 fps → ~200 ms per cycle.
- Jump: holds frame 4 while airborne.
- These values are intentionally below the 400–500 ms flash/motion cap and are non-strobing.

---

## Tile-Frame Selection Contract

Implemented in `src/levels/build.js`, inside the `for (let tx ...)` loops that draw visual tiles.

### Floor / platform top surface

For each run/platform top at y = `FLOOR_Y` / `p.y`:

```js
function pickTopFrame(tx, runX, runW) {
  const isLeft = tx === runX;
  const isRight = tx + CONFIG.TILE_SIZE >= runX + runW;
  if (isLeft && isRight) return 0; // single-tile run
  if (isLeft) return 1;            // left edge
  if (isRight) return 3;           // right edge
  return 2;                        // center fill
}
```

- Add `frame(pickTopFrame(...))` to the `sprite("ground")` component list.
- Existing merged colliders are **unchanged**; this is a pure visual pass.

### Platform underside / columns (optional visual support)

If a level descriptor later adds vertical supports, use frame `4` for underside tiles. Phase 18 implementation is not required to add new geometry; it only skins existing floors/platforms.

---

## Parallax Contract

Implemented in `src/scenes/game.js` inside the scene closure.

### Layer setup

Create one sprite per layer, wide enough to cover the level, with low z-order:

```js
function makeParallaxLayer(name, ratio, zLayer, y) {
  const levelWidth = level.bounds.right - level.bounds.left;
  const instances = [];
  // Cover level width plus one extra width on each side for scrolling
  const count = Math.ceil((levelWidth + width() * 2) / width()) + 1;
  for (let i = 0; i < count; i++) {
    instances.push(add([
      sprite(name),
      pos(level.bounds.left - width() + i * width(), y),
      z(zLayer),
      { ratio },
    ]));
  }
  return instances;
}
```

### Update loop

Inside the existing `onUpdate` in `game.js`, after `followCamera`:

```js
const camX = getCamPos().x;
parallaxLayers.forEach(({ instances, ratio, layerWidth }) => {
  instances.forEach((inst, i) => {
    // Anchor the layer so the camera position maps to parallax ratio
    inst.pos.x = level.bounds.left - width() + i * layerWidth + camX * (1 - ratio);
  });
});
```

- Motion is driven **only** by camera X (D-11, D-12). No `wait()`, `loop()`, or timers.
- Ratios are locked: far `0.15`, mid `0.45`, near `0.75`.

---

## Z-Index Layering

Layering must keep parallax behind gameplay, gameplay behind HUD, and HUD below gate overlays.

| Layer | z-index | Notes |
|-------|---------|-------|
| Title/select background | -100 | `fixed()`, camera-immune |
| Parallax far | -30 | world-space |
| Parallax mid | -20 | world-space |
| Parallax near | -10 | world-space |
| Ground colliders | 0 | merged static bodies (invisible rect or same as today) |
| Ground/platform visual tiles | 1 | drawn on top of colliders |
| Doors / gates / enemies / spikes / goal | 10–20 | interactable / hazard art |
| Coins | 20 | spin anim |
| Player | 10 | above ground tiles so feet read clearly |
| Dust / pop effects | 50–60 | transient FX (`fx.js`) |
| HUD badge/bar/hint | 9000–9001 | `fixed()`, camera-immune |
| Level-up flash | 9500 | transient HUD |
| Gate cleared dim | 9990 | full-screen dim (`mathGate.js`) |
| Level clear burst | 9993 | below banner, above dim (`fx.js`) |
| Gate cleared banner | 9994 | "LEVEL CLEAR" text |

---

## Title Screen Styling

File: `src/scenes/title.js`

1. Add backdrop first:
   ```js
   add([sprite("title-bg"), pos(0, 0), fixed(), z(-100), "title"]);
   ```
2. Keep the "Math Lab" wordmark centered, neon green `#00ff88`, size `CONFIG.TITLE.TITLE_SIZE` (64 px), `fixed()`, `z(9000)`.
3. Keep the prompt centered below, light grey `#e8e8e8`, size `CONFIG.TITLE.PROMPT_SIZE` (20 px).
4. No animated title effects; any decoration must be static and stay within the 400–500 ms motion/flash cap.

---

## Level-Select Screen Styling

File: `src/scenes/select.js`

1. Add the same `title-bg` backdrop with `fixed()` and `z(-100)`.
2. Tile styling (replace solid-color `rect()` fills):

| State | Fill | Border | Glyph | Cursor behavior |
|-------|------|--------|-------|-----------------|
| locked | `#444444` | `#555555`, 2 px | `X` | not selectable, no click handler |
| unlocked | `#111111` | `#00ff88`, 2 px | none | selectable; cursor → white border 5 px |
| cleared | `#111111` | `#66ccff`, 2 px | `v` | selectable; cursor → white border 5 px |

3. Keep tile dimensions `CONFIG.SELECT.TILE_W` × `CONFIG.SELECT.TILE_H` (96 × 96 px), gap `CONFIG.SELECT.GAP` (24 px), positions unchanged.
4. Preserve dual input (arrow keys + Enter, mouse click) and cursor skip-over locked tiles.
5. Keep the bright white `#ffffff` cursor outline width at 5 px for the active tile (IN-02).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| third-party | none | not applicable |

This phase uses no component registries; all visuals are Kaplay canvas objects and hand-authored PNG assets.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## Traceability

| Requirement | Contract Section |
|-------------|------------------|
| ART-01 Animated player | Player sprite, `loadSprite` contract, Animation contract |
| ART-02 Dark-grunge tileset | Tileset sprite, Tile-frame selection contract |
| ART-03 Parallax background | Parallax layers, Parallax contract, Z-index layering |
| ART-04 Styled title/select | Title screen styling, Level-select styling, Color, Asset contract |
