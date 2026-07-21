# Phase 33: Player & Entity Animation - Pattern Map

**Mapped:** 2026-07-11
**Files analyzed:** 8
**Analogs found:** 8 / 8 (all self-analogs — this phase extends existing files in place, no new modules)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/player.js` (anim state machine + collider lock) | controller/entity-factory | event-driven (onUpdate state machine) | itself (existing `player.onUpdate` anim block, lines 107-129) | exact — extend in place |
| `src/main.js` (player `loadSprite` sliceX/anims swap) | config/boot | request-response (boot-time asset registration) | itself (existing player `loadSprite` call, lines 65-72) + `coin` `loadSprite` (lines 73-80) | exact |
| `src/main.js` (enemy-hellhound `loadSprite`) | config/boot | request-response | `coin`/`player` `loadSprite` calls (same file, lines 65-80) | exact |
| `src/main.js` (door/math-gate `loadSprite`) | config/boot | request-response | existing `loadSprite("door", ...)` (line 112) | exact |
| `src/config.js` (PLAYER_FALL_SPEED/PLAYER_LAND_SPEED + PLAYER_FRAMES bump) | config | CRUD (tunable constants) | existing `PLAYER_FRAMES`/`PLAYER_IDLE_SPEED`/`PLAYER_RUN_SPEED`/`PLAYER_JUMP_SPEED` block (lines 85-89) | exact |
| `src/levels/build.js` (math-gate panel: flat box → sprite; enemy panel: play("idle")) | component/entity-builder | CRUD (per-level entity emission) | itself — door panel emission (lines 244-246) and coin `play("spin")` (line 201) | exact |
| `scripts/build-art-assets.py` (`build_door()` v2, new `build_math_gate()`) | utility/offline-build | file-I/O (Pillow crop/bake) | `build_player_swamphunter()` (lines 1006-1080) / `build_enemy_hellhound()` (lines 1083-1121) | exact (native-color bake idiom) |
| `src/assets-manifest.js` (+ math-gate entry, enemy-1/2/3 → enemy-hellhound) | config | CRUD (manifest rows) | existing `sprite`/`sprite-anim` rows (lines 39-55) | exact |

No files with zero analog — every change is an in-place extension of an already-established pattern in this exact codebase (per RESEARCH.md's own framing: "disciplined extension, not invention").

## Pattern Assignments

### `src/player.js` (entity-factory, event-driven anim state machine)

**Analog:** itself — existing anim-state block, `src/player.js` lines 105-129, and the `area()` call at line 30.

**Current area() (collider, to be locked)** (line 30):
```javascript
area(), // collider matches the 16x32 sprite footprint (no transparent padding to tune)
```
Replace with the explicit-shape lock (mirrors `src/levels/build.js`'s spike hitbox idiom, lines 215-218):
```javascript
area({ shape: new Rect(vec2(0), 16, 32) }), // LOCKED 16x32 hitbox, independent of any anim frame's visual footprint
```
`Rect`/`vec2` are Kaplay engine globals — safe here because they're referenced inside `makePlayer()`'s function body (a727c13 rule already respected by this file's own header comment).

**Current anim-state machine** (lines 105-129):
```javascript
player.onUpdate(() => {
  const deadzone = CONFIG.PLAYER_ANIM_DEADZONE;
  const speedX = Math.abs(player.vel.x);

  let target;
  if (!player.isGrounded()) {
    target = "jump";
  } else if (speedX >= deadzone) {
    target = "run";
  } else {
    target = "idle";
  }

  // Only call play() on real state transitions so loops don't reset to frame 0.
  if (player.getCurAnim()?.name !== target) {
    player.play(target);
  }

  if (speedX >= deadzone) {
    player.flipX = player.vel.x < 0;
  }
});
```
Extend the `!player.isGrounded()` branch to split jump vs. fall (RESEARCH's exact recommended patch, using the file's own documented "Up is NEGATIVE Y" convention already used at line 102):
```javascript
let target;
if (!player.isGrounded()) {
  target = player.vel.y < 0 ? "jump" : "fall";
} else if (speedX >= deadzone) {
  target = "run";
} else {
  target = "idle";
}
```
The `player.getCurAnim()?.name !== target` guard (line 121) MUST be preserved unchanged — it is the anti-stutter idiom this whole file depends on; do not call `play()` unconditionally.

**Land-state synthesis (no dedicated frames exist in the bake — RESEARCH Pitfall 2):** land is NOT a `target` value computed every frame from grounded/velocity; it must be a one-shot, non-looping anim held briefly on the falling→grounded transition, mirrored on the existing `player.onGround()` landing hook (lines 50-53) which already fires the JUICE-01 squash/dust and is the correct closure-local seam to also trigger `player.play("land")` (or set target="land" for one tick) — same idiom as the file's own single-frame non-looping `jump` anim (`to: 4, to: 4, loop: false, speed: CONFIG.PLAYER_JUMP_SPEED` in `main.js`, generalized to `10,11,loop:false` for land per RESEARCH).

---

### `src/main.js` (boot-time `loadSprite` registration)

**Analog:** itself — existing player `loadSprite` (lines 65-72), coin `loadSprite` (lines 73-80), door `loadSprite` (line 112), enemy `loadSprite` block (lines 113-115).

**Current player load** (lines 65-72):
```javascript
loadSprite("player", "../assets/player.png", {
  sliceX: CONFIG.PLAYER_FRAMES,
  anims: {
    idle: { from: 0, to: 1, loop: true, speed: CONFIG.PLAYER_IDLE_SPEED },
    run: { from: 2, to: 3, loop: true, speed: CONFIG.PLAYER_RUN_SPEED },
    jump: { from: 4, to: 4, loop: false, speed: CONFIG.PLAYER_JUMP_SPEED },
  },
});
```
Swap the path to the already-baked `player-swamphunter.png` and extend `sliceX`/`anims` to the RESEARCH-verified 12-frame layout (idle:0-1, run:2-7, jump:8-9, fall:10-11 — read directly from `build_player_swamphunter()`'s docstring, not guessed from pixels):
```javascript
loadSprite("player", "../assets/player-swamphunter.png", {
  sliceX: CONFIG.PLAYER_FRAMES, // now 12
  anims: {
    idle: { from: 0, to: 1, loop: true, speed: CONFIG.PLAYER_IDLE_SPEED },
    run:  { from: 2, to: 7, loop: true, speed: CONFIG.PLAYER_RUN_SPEED },
    jump: { from: 8, to: 9, loop: false, speed: CONFIG.PLAYER_JUMP_SPEED },
    fall: { from: 10, to: 11, loop: true, speed: CONFIG.PLAYER_FALL_SPEED },
    land: { from: 11, to: 11, loop: false, speed: CONFIG.PLAYER_LAND_SPEED }, // synthesized: holds fall's last frame
  },
});
```

**Enemy-hellhound load — replaces the current 3-static-sprite block** (lines 113-115):
```javascript
// CURRENT (to be replaced):
loadSprite("enemy-1", "../assets/enemy-1.png");
loadSprite("enemy-2", "../assets/enemy-2.png");
loadSprite("enemy-3", "../assets/enemy-3.png");
```
New call, mirroring the coin `loadSprite` pattern (lines 73-80) exactly:
```javascript
loadSprite("enemy-hellhound", "../assets/enemy-hellhound.png", {
  sliceX: 6,
  anims: {
    idle: { from: 0, to: 5, loop: true, speed: CONFIG.ENEMY_IDLE_SPEED },
  },
});
```

**Door / math-gate loads** — door stays a plain single-arg call (line 112 pattern), math-gate is new but identical shape:
```javascript
loadSprite("door", "../assets/door.png"); // unchanged call, new baked pixels underneath
loadSprite("math-gate", "../assets/math-gate.png"); // NEW — single static frame, no sliceX/anims (RESEARCH Open Q1: real, non-flat, single-frame art is sufficient this phase)
```

---

### `src/config.js` (tunables block)

**Analog:** itself — existing PLAYER_* block (lines 85-89).

```javascript
PLAYER_FRAMES: 5, // count — player.png sliceX (5 frames of 16x32)
PLAYER_ANIM_DEADZONE: 10, // px/s — below this treat horizontal speed as idle/rest
PLAYER_IDLE_SPEED: 6, // fps — idle anim frame rate
PLAYER_RUN_SPEED: 10, // fps — run anim frame rate
PLAYER_JUMP_SPEED: 1, // fps — single-frame jump anim; speed must be >0 in Kaplay
```
Extend with: `PLAYER_FRAMES: 12` (bumped from 5), `PLAYER_FALL_SPEED`, `PLAYER_LAND_SPEED` (both fps, single-frame-safe `>0`), and (for the enemy swap) `ENEMY_IDLE_SPEED` alongside the existing `ENEMY` block (lines 172-178). No magic numbers in `main.js`/`player.js` — every new fps/frame constant must live here first, per the project's binding "all tunables live in `src/config.js`" rule.

`ENEMY.SPRITES` (line 177) changes from `["enemy-1", "enemy-2", "enemy-3"]` to `["enemy-hellhound"]` (single-entry array — `src/levels/build.js`'s `CONFIG.ENEMY.SPRITES[e.variant ?? 0]` consumer keeps working unchanged since index 0 always resolves).

---

### `src/levels/build.js` (per-level entity emission)

**Analog:** itself — door panel emission (lines 244-246) as the exact structural precedent for the math-gate panel swap, and coin `play("spin")` (line 201) as the exact precedent for the enemy `play("idle")` call.

**Door panel — pattern already correct, only the underlying PNG changes** (lines 244-246):
```javascript
const panel = add([sprite("door"), pos(d.x, d.y), "door-panel"]);
```
No code change needed here — same call, new baked pixels via `build_door()` v2.

**Math-gate panel — CURRENT flat-color box** (lines 270-284):
```javascript
const panel = add([
  rect(CONFIG.MATH_GATE.W, CONFIG.MATH_GATE.H),
  pos(mg.x, mg.y),
  color(...CONFIG.MATH_GATE.LOCKED_GREY),
  outline(2, rgb(...CONFIG.MATH_GATE.LOCKED_BORDER)),
  "math-gate-panel",
]);

const glyph = add([
  text("?", { size: CONFIG.MATH_GATE.GLYPH_SIZE }),
  anchor("center"),
  pos(mg.x + CONFIG.MATH_GATE.W / 2, mg.y + CONFIG.MATH_GATE.H / 2),
  color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
  "math-gate-glyph",
]);
```
Swap the `rect()+color()+outline()` panel for `sprite("math-gate")`, mirroring the door panel pattern exactly, and KEEP the exact same insertion order (blocker → panel → glyph, RESEARCH Pitfall 6) so the glyph still renders on top:
```javascript
const panel = add([
  sprite("math-gate"),
  pos(mg.x, mg.y),
  "math-gate-panel",
]);
// glyph add() call stays unchanged, immediately after, same z-order
```

**Enemy panel — CURRENT static sprite, no anim** (lines 311-315):
```javascript
const panel = add([
  sprite(CONFIG.ENEMY.SPRITES[e.variant ?? 0]),
  pos(e.x, e.y),
  "enemy-panel",
]);
```
Add the `play("idle")` call, mirroring the coin precedent (`coin.play("spin")`, line 201) exactly:
```javascript
const panel = add([
  sprite(CONFIG.ENEMY.SPRITES[e.variant ?? 0]),
  pos(e.x, e.y),
  "enemy-panel",
]);
panel.play("idle"); // looping idle anim registered in main.js loadSprite("enemy-hellhound", ...)
```
All three blocker `rect()+area()+body({isStatic:true})` calls (lines 227-242, 253-268, 290-306) stay byte-unchanged — visual-only swap, per CONTEXT.md's "geometry/collider frozen" discipline.

---

### `scripts/build-art-assets.py` (`build_door()` v2 + new `build_math_gate()`)

**Analog:** `build_player_swamphunter()` (lines 1006-1080) and `build_enemy_hellhound()` (lines 1083-1121) — the native-color, no-remap bake idiom to mirror. Do NOT use the OLD `build_door()` (currently at line 572) — it remaps through `ENVIRONMENT_PALETTE` via `_remap_luminance`, which must NOT be extended to the new church/castle source (RESEARCH Pitfall 3/Architecture Pattern 3).

**Shared `save()` helper** (lines 79-82):
```python
def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG")
    print(f"generated {os.path.relpath(path, ROOT)} {img.size}")
```

**Native-color bake pattern to follow (from `build_enemy_hellhound()`, lines 1083-1121)** — crop, `Image.NEAREST` resize only, paste onto transparent canvas, assert size, `save()`, NO `_remap`/`_remap_luminance` call anywhere in the function body. `GV_SRC` (line 39) is the shared gitignored-source root — both new bake functions must reference paths under it and the execute-phase plan must re-fetch the church + Patreon Collection/castle zips first (RESEARCH Pitfall 4).

**New `build_door()` v2 crop** (per RESEARCH's pixel-verified coordinates): `old-dark-castle-interior-tileset.png`, crop `(664, 47, 698, 112)` (34×65px), resize to locked `CONFIG.DOOR` 32×64 footprint, native color, saved to `assets/door.png` (overwrite in place — RESEARCH's A4 recommendation, keeps the existing manifest/loadSprite entry and only requires a CREDITS.md row update, not a new one).

**New `build_math_gate()` crop**: `gothicvania church files/ENVIRONMENT/tileset.png`, crop `(240, 32, 272, 80)` (32×48px), stretch to `CONFIG.MATH_GATE` 32×64 footprint (uniform `Image.NEAREST` resize, same non-1:1 idiom the old `build_door()` already used), native color, saved to `assets/math-gate.png` (new file, new manifest entry).

Both crops already measured 0% pink-hue fraction via `scripts/lib/pink_scan.py` this session (RESEARCH) — no `pink_scan` allowlist entry needed, but re-verify with `bash scripts/check-pink-gate.sh` after baking, per the project's standard gate.

---

### `src/assets-manifest.js` (manifest rows)

**Analog:** itself — existing `sprite`/`sprite-anim` rows (lines 39-55).

```javascript
// CURRENT rows to modify/remove:
{ key: "door", path: "assets/door.png", kind: "sprite" }, // KEEP — same path, new baked pixels
{ key: "enemy-1", path: "assets/enemy-1.png", kind: "sprite" }, // REMOVE (or mark orphaned) — see RESEARCH Open Q3
{ key: "enemy-2", path: "assets/enemy-2.png", kind: "sprite" }, // REMOVE (or mark orphaned)
{ key: "enemy-3", path: "assets/enemy-3.png", kind: "sprite" }, // REMOVE (or mark orphaned)
{ key: "player", path: "assets/player.png", kind: "sprite-anim" }, // path/kind unchanged, but path must become "assets/player-swamphunter.png"
```
New rows to add:
```javascript
{ key: "math-gate", path: "assets/math-gate.png", kind: "sprite" },
{ key: "enemy-hellhound", path: "assets/enemy-hellhound.png", kind: "sprite-anim" },
```
Run `node scripts/check-assets-manifest.mjs` (RESEARCH Phase Requirements → Test Map) after editing — this is the automated gate that "kills the silent-404 class" per the file's own header comment; every new/changed `loadSprite` call in `main.js` MUST have a matching manifest row.

## Shared Patterns

### Explicit collider-shape lock (`area({ shape })`)
**Source:** `src/levels/build.js` lines 215-218 (spike hitbox — the direct, already-shipped precedent)
```javascript
area({
  shape: new Rect(vec2(0), CONFIG.SPIKE_HITBOX_W, CONFIG.SPIKE_HITBOX_H),
  offset: vec2(spikeOffX, spikeOffY),
}),
```
**Apply to:** `src/player.js`'s `makePlayer()` `area()` call (no offset needed — the baked sheet is already bottom-aligned/centered per `build_player_swamphunter()`'s own crop/paste code).

### Sliced sprite-sheet named-anim loading + guarded `.play()`
**Source:** `src/main.js` lines 65-80 (player/coin `loadSprite`), `src/player.js` line 121 (`getCurAnim()?.name !== target` guard), `src/levels/build.js` line 201 (`coin.play("spin")`)
**Apply to:** every new `loadSprite({sliceX, anims})` call (player-swamphunter, enemy-hellhound) and every `.play(name)` call site (enemy panel, player state machine). NEVER call `.play()` unconditionally in an `onUpdate` — always guard on a state-transition check, or (for one-shot panel anims like the enemy idle loop) call `.play()` exactly once at entity-creation time.

### Native-color Pillow bake (no palette remap)
**Source:** `scripts/build-art-assets.py`'s `build_player_swamphunter()` (lines 1006-1080) / `build_enemy_hellhound()` (lines 1083-1121)
**Apply to:** `build_door()` v2 and new `build_math_gate()` — crop → `Image.NEAREST` resize → paste on transparent canvas → `assert` size → `save()`. Zero `_remap()`/`_remap_luminance()` calls.

### Manifest-driven asset registration
**Source:** `src/assets-manifest.js` (whole file) + `src/main.js`'s manifest-loop for biome atlases/backgrounds (lines 101-108)
**Apply to:** every new/changed `loadSprite` path in `main.js` — add/update the matching manifest row in the SAME change, then run `node scripts/check-assets-manifest.mjs`.

## No Analog Found

None. Every file this phase touches is an in-place extension of an already-established, already-shipped pattern in this exact codebase (per RESEARCH.md's Summary: "pure wiring + one small asset-bake, not new-technology research").

## Metadata

**Analog search scope:** `src/player.js`, `src/main.js`, `src/config.js`, `src/levels/build.js`, `scripts/build-art-assets.py`, `src/assets-manifest.js` (all read directly this session; no Glob/Grep-only matches — every analog is a full in-file read).
**Files scanned:** 6 source files fully read + targeted greps across `src/config.js` and `src/levels/build.js`
**Pattern extraction date:** 2026-07-11
