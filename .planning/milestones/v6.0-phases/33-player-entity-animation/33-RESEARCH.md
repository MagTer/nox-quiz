# Phase 33: Player & Entity Animation - Research

**Researched:** 2026-07-11
**Domain:** Kaplay 3001 sprite-sheet animation wiring + Pillow asset-baking pipeline (no new libraries)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Player Animation Wiring**
- The Swamp Hunter spritesheet (`assets/player-swamphunter.png`, 192×32, 12 frames of 16×32) was already baked in Phase 31 specifically for this phase — no new player art baking needed, only wiring.
- Extend the existing anim-state pattern (`src/player.js` already has a `player.play(target)` state machine driven by grounded/velocity checks, and `src/main.js` already has a `loadSprite("player", ..., { sliceX, anims: {...} })` pattern with `idle`/`run`/`jump` anims) — add distinct `fall` and `land` states to reach the roadmap's required 5 states (idle, run 4+, jump, fall, land).
- Collider lock: when swapping to the new sprite, `area()` must gain an explicit `{ shape: new Rect(vec2(0), 16, 32) }` (or equivalent) so the physics hitbox stays exactly 16×32 regardless of the new sprite's visual size. This is a binding CLAUDE.md decision, not new to this phase.
- The exact 12-frame → idle/run/jump/fall split is a technical/implementation detail left to planning/research — not a product-level grey area.
- Sign-off proof requirement (roadmap success criterion 2): feet-on-ground screenshots against `?debug=1` colliders at 4 spots — flat floor, 1-tile platform, lowest ceiling, door — proving the collider truly stayed 16×32.

**Door / Gate / Math-Gate Art**
- Doors and math-gates currently have no biome-specific or per-phase-31 baked replacement — this phase bakes NEW art for both, sourced from the church/castle packs.
- Scope bound: ONE shared door design + ONE shared math-gate design, baked once and reused across all 8 levels. Per-biome art variety for these entities is NOT in scope this phase.
- Per-biome dressing/re-skinning is explicitly Phase 35's job, not reopened here.
- Invisible blocker colliders stay byte-unchanged — only the visual sprite/rendering layer changes.

**Enemy Blocker Variety**
- Hell hound (`assets/enemy-hellhound.png`, 384×32, 6 idle-only frames) was already baked in Phase 31 as the one animated enemy-blocker sprite — no new enemy art baking needed.
- Hell hound replaces `enemy-1`/`enemy-2`/`enemy-3` (`CONFIG.ENEMY.SPRITES`) as the ONE shared enemy-blocker sprite across ALL 8 levels.
- Per-biome enemy variety is explicitly deferred (candidate for Phase 35).
- Hell hound is idle-only (no walk/run frames baked) — this phase wires only the idle/stationary blocker pose. Motion/patrol is Phase 36's job; do not wire `patrol()` or any movement here.

### Claude's Discretion
- Exact frame-range split of the 12-frame Swamp Hunter sheet into idle/run/jump/fall (inspect the real PNG / known source-pack frame order during planning).
- Exact door/math-gate visual design pulled from the church/castle source packs (which specific door/gate asset within those packs) — informed by the style-board precedent (dark-SNES register, no pink) but not pre-decided here.
- Internal implementation of the fall/land anim-state transition logic in `player.js` (e.g. exact velocity/grounded thresholds distinguishing "jump" from "fall").

### Deferred Ideas (OUT OF SCOPE)
- Per-biome enemy variety (swamp thing for swamp levels, ghost for cemetery, spider, etc.) — confirmed available in the source packs but explicitly deferred; a candidate for Phase 35's re-dress pass if wanted, not committed to now.
- Per-biome door/math-gate visual variants — explicitly deferred to Phase 35 (props/re-dress), this phase ships one shared design for each.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ART-04 | Fully animated player (idle, run 4+ frames, jump, fall, land) with the 16×32 physics collider explicitly locked via `area({ shape })` — supersedes the v4.1 player-art lock with a new human sign-off | Exact 12-frame layout of `assets/player-swamphunter.png` extracted directly from `build_player_swamphunter()`'s source (idle 0-1, run 2-7, jump 8-9, fall 10-11); `area({shape})` idiom already precedented in `src/levels/build.js`'s spike hitbox; land-state synthesis strategy proposed (no dedicated land frames exist in the bake) |
| ART-05 | Real animated art for mechanic entities — doors, checkpoint gates, enemy blockers, math gate (invisible blocker colliders untouched) | Hell hound (6-frame idle loop) already baked and ready to wire as a genuine idle animation; concrete, pink-gate-clean door and math-gate source crops located and pixel-verified this session from the church/castle Gothicvania packs (re-fetched fresh since `assets/_gothicvania-src/` is gitignored); existing `build.js` collider/panel split confirmed unaffected by visual-layer swaps |
</phase_requirements>

## Architectural Responsibility Map

This project is a single-tier, 100% client-side static game (no backend, no SSR) — the 5-tier taxonomy below is adapted accordingly. Every runtime capability lives in the Browser/Client tier; the one non-runtime capability (art baking) is offline build tooling that produces static assets consumed by that same tier.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Player anim state machine + collider lock | Browser/Client (`src/player.js`, Kaplay `onUpdate`) | — | Runs every frame inside the Kaplay game loop; no server involved |
| Sprite-sheet registration (`loadSprite`/`sliceX`/`anims`) | Browser/Client (`src/main.js`, boot-time) | CDN/Static (the PNG itself, served by nginx) | Load call executes in-browser; the bytes it fetches are static files |
| Door/math-gate/enemy visual emission | Browser/Client (`src/levels/build.js`) | — | Pure Kaplay entity construction, no network/server logic |
| Mechanic collider/blocker geometry | Browser/Client (`src/levels/build.js`) | — | Explicitly UNCHANGED this phase — visual-only swap |
| New sprite asset baking (Pillow crop/scale/save) | Offline build tooling (`scripts/build-art-assets.py`, run on a dev machine, not at runtime) | CDN/Static (output PNGs become served static assets) | Executes once per bake, before commit — never runs in the browser or in the nginx container |
| Interactive mechanic re-audit | Offline build tooling (`scripts/audit-phase21-mechanics.mjs`, Playwright-driven) | Browser/Client (drives a real headless browser instance of the same game) | A verification harness, not shipped game code |

## Summary

This phase is pure **wiring + one small asset-bake**, not new-technology research: Kaplay 3001.0.19's `loadSprite(sliceX, anims)` + `play()` pattern is already used three times in this codebase (player, coin, biome atlases) and needs no new API surface — only two new named anim states (`fall`, `land`) added to the existing `idle`/`run`/`jump` set, and one explicit `area({ shape })` collider lock. The player and enemy source art is **already baked** (Phase 31 Plan 05) — this phase reads their real, already-committed frame layout rather than guessing it. Direct inspection of `scripts/build-art-assets.py`'s `build_player_swamphunter()` function (not the PNG pixels, which are ambiguous without the source docstring) gives the exact, unambiguous frame order: **frames 0–1 = idle, 2–7 = run, 8–9 = jump, 10–11 = fall** — 12 frames total, each a fixed 16×32 cell. Critically, **no "land" frames exist anywhere in the bake or the source pack's own folder structure** (`idle`/`run`/`jump`/`fall`/`stand`/`crouch`/`crouch-shoot`/`hurt`/`shoot` — no `land` folder), and CONTEXT.md's locked scope explicitly forbids re-baking the player sheet ("no new player art baking needed, only wiring"). The planner must choose a **land-state synthesis strategy that reuses an existing frame** — this research recommends holding the last fall frame (index 11) briefly on grounding before transitioning to idle/run, mirroring the existing single-frame non-looping `jump` anim idiom already in `main.js` (`speed` must be `>0` even for a 1-frame "loop").

The door and math-gate need genuinely new art (no Phase 31 bake exists for either). This session re-fetched the two relevant Gothicvania OGA zips (church, patreon collection/castle — both confirmed CC0/public-domain via their own `public-license.txt`) and pixel-inspected them directly: a clean wooden door with a stone frame and gold hinge/handle sits in `Old-dark-Castle-tileset-Files/PNG/old-dark-castle-interior-tileset.png` at crop `(664,47)-(698,112)` (34×65px, near-exact fit for the locked 32×64 `CONFIG.DOOR`/`CONFIG.MATH_GATE` footprint), and a barred iron-lattice window with a cross plaque — reading naturally as "locked" — sits in `gothicvania church files/ENVIRONMENT/tileset.png` at crop `(240,32)-(272,80)` (32×48px, exact width match, needs either a uniform vertical stretch to 64px or a transparent-pad decision). Both crops measured **0% pink-hue fraction** via the project's own `pink_scan.py` this session — clean, no allowlist entry needed. Both packs already have committed license-proof files (`assets/LICENSES/gothicvania-church.txt`, `gothicvania-patreon.txt`) from Phase 31's other assets — this phase only needs new CREDITS.md rows, not new proof files.

The enemy-blocker swap is the simplest of the three: `CONFIG.ENEMY.SPRITES` becomes a single-entry array pointing at `enemy-hellhound`, loaded with `sliceX:6` and one looping `idle` anim (genuinely animated — a real multi-frame idle cycle, unlike the door/math-gate which have no multi-frame source material and will ship as single static frames). This is a materially important nuance for the planner: the roadmap's phrase "real animated art... in place of flat-color panels" is satisfied differently per entity — Hell hound gets a true frame-cycling idle loop; door and math-gate get real (non-flat, non-placeholder) sprite art but, absent any multi-frame door/gate source material in the packs surveyed, ship as single static frames, matching the existing `door.png`'s own precedent (which was also always single-frame, despite living under the same "VIS-04 real sprite art" banner). This is flagged as an Open Question, not silently resolved.

**Primary recommendation:** Wire the player exactly as CONTEXT.md specifies (extend `player.play()` with `fall`/`land`, lock `area({shape: new Rect(vec2(0),16,32)})`), using frame ranges idle:0-1, run:2-7, jump:8-9, fall:10-11 and a held-last-fall-frame land pose; bake the door from the castle-pack wooden-door crop and the math-gate from the church-pack barred-window crop, both at **native (non-remapped) Gothicvania color** to match the already-shipped castle biome atlas/player/enemy assets (NOT the old Kenney-sourced `build_door()`'s `_remap_luminance` pipeline, which would look palette-inconsistent against the new native-color assets); wire Hell hound as a real 6-frame looping idle anim replacing the 3-variant static `CONFIG.ENEMY.SPRITES` array; re-run `scripts/audit-phase21-mechanics.mjs` across all 8 levels (each already confirmed to have exactly 1 door + 1 math-gate + 1 enemy) to prove the swap is collision-neutral.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay | 3001.0.19 (vendored, pinned) | Sprite/anim loading (`loadSprite`), area/collider (`area`), animation playback (`play`) | Already the project's sole game engine; `sliceX`/`anims`/`area({shape})` are existing, already-used APIs — no upgrade, no new library `[VERIFIED: codebase]` |
| Pillow (Python) | 10.2.0 (locally installed, no pinned requirements.txt — matches project's "no build step" convention) | Asset baking (`scripts/build-art-assets.py`) — crop/scale/composite/save | Already the sole bake tool for every vendored sprite in this repo `[VERIFIED: python3 -c "import PIL; print(PIL.__version__)"]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Playwright (via gsd-pi's bundled copy, resolved dynamically) | pre-existing, resolved by `scripts/audit-phase21-mechanics.mjs`'s own fallback chain | Interactive mechanic re-audit after the art swap | Already the project's sole browser-automation tool; no new install needed `[VERIFIED: codebase — scripts/audit-phase21-mechanics.mjs's resolvePlaywright()]` |

### Alternatives Considered

None — this phase adds zero new dependencies. Every capability needed (sprite-sheet slicing, named multi-frame anims, explicit collider shape, Pillow-based cropping) already exists in the vendored/installed toolchain.

**Installation:** None required — no `npm install`, no `pip install` (Pillow/Playwright already present in this environment, matching the project's zero-new-dependency constitution for v6.0).

## Package Legitimacy Audit

Not applicable — this phase installs no external packages (no npm, no pip, no cargo). Every tool used (Kaplay vendored engine, Pillow, Playwright) is already present in the repository/environment from prior phases. Skip the Package Legitimacy Gate protocol.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │   OFFLINE (dev machine, pre-commit)      │
                    │                                           │
  Gothicvania       │  scripts/build-art-assets.py             │
  church/castle  ───┼─▶ build_door() [NEW: crop+native-color]  │
  OGA zips          │  build_math_gate() [NEW: crop+native]    │──▶ assets/door.png (overwritten)
  (re-fetch:         │  build_player_swamphunter() [DONE,      │    assets/math-gate.png (new)
   gitignored,       │    Phase 31 — read-only this phase]     │    assets/player-swamphunter.png (existing)
   not re-run)        │  build_enemy_hellhound() [DONE,        │    assets/enemy-hellhound.png (existing)
                    │    Phase 31 — read-only this phase]      │
                    └─────────────────────────────────────────┘
                                        │
                                        ▼ (static PNGs, committed to git)
                    ┌─────────────────────────────────────────┐
                    │   BROWSER RUNTIME (Kaplay game loop)     │
                    │                                           │
  src/main.js  ─────┼─▶ loadSprite("player", ..., {sliceX:12,  │
  (boot-time)        │     anims:{idle,run,jump,fall}})         │
                    │   loadSprite("enemy-hellhound", ...,     │
                    │     {sliceX:6, anims:{idle:loop}})       │
                    │   loadSprite("door", ...) [no slice]     │
                    │   loadSprite("math-gate", ...) [no slice]│
                    └─────────────────────────────────────────┘
                                        │
                                        ▼
  src/player.js ─────▶ makePlayer(): area({shape:16×32 LOCKED})
  (per-frame)          onUpdate(): grounded/vel.y-driven
                        target ∈ {idle,run,jump,fall,land}
                        player.play(target) on transition only
                                        │
  src/levels/build.js ▶ buildLevel(): UNCHANGED colliders
  (level load)          (blocker rect+body({isStatic}) — byte
                         frozen), CHANGED visual panels:
                         sprite("door") [same call, new pixels]
                         sprite("math-gate") [NEW — replaces
                           color()+outline()+text("?") box]
                         sprite(CONFIG.ENEMY.SPRITES[..]) [now
                           single-entry "enemy-hellhound", plays
                           "idle" anim instead of static frame]
                                        │
                                        ▼
  scripts/audit-phase21-mechanics.mjs ▶ drives REAL input across
  (verification, offline)               all 8 levels, proves every
                                         door/math-gate/enemy
                                         encounter still triggers
                                         (tags/colliders untouched
                                         → should pass unmodified)
```

### Recommended Project Structure

No new files/directories — every change lands inside the existing module map:

```
scripts/build-art-assets.py   # + build_door() v2 (native color, church/castle source), + build_math_gate() (new)
src/config.js                 # + PLAYER_FALL_SPEED, PLAYER_LAND_SPEED (fps, single-frame idiom) — extend PLAYER_FRAMES block
src/main.js                   # loadSprite("player", ...) sliceX 5→12, +fall/land anims; loadSprite("enemy-hellhound", ..., {sliceX:6, anims:{idle}}); loadSprite("math-gate", ...) new
src/player.js                 # area({shape}) lock; extended anim-state target logic (fall vs jump split, land hold)
src/levels/build.js           # math-gate panel: color()+outline()+text() → sprite("math-gate")+text() (glyph text() stays, drawn over the new panel); enemy panel: CONFIG.ENEMY.SPRITES[e.variant??0] → plays "idle"
src/assets-manifest.js        # + math-gate sprite entry; enemy-1/2/3 entries removed or kept as orphaned gate-coverage-only rows (planner's call)
CREDITS.md                    # + rows for door/math-gate under the existing Gothicvania Church / Patreon Collection pack rows
```

### Pattern 1: Extending a Kaplay named-anim sprite load (established 3× already in this codebase)

**What:** `loadSprite(key, path, { sliceX, anims: { name: { from, to, loop, speed } } })`, then `entity.play(name)` only on state transitions (never every frame — resets loop position otherwise).
**When to use:** Any multi-frame sprite that needs named states (player, coin, and now Hell hound).
**Example:**
```javascript
// Source: src/main.js (existing player load, to be extended) + src/player.js (existing state-machine, to be extended)
loadSprite("player", "../assets/player-swamphunter.png", {
  sliceX: CONFIG.PLAYER_FRAMES, // 12 (was 5)
  anims: {
    idle: { from: 0, to: 1, loop: true, speed: CONFIG.PLAYER_IDLE_SPEED },
    run:  { from: 2, to: 7, loop: true, speed: CONFIG.PLAYER_RUN_SPEED },
    jump: { from: 8, to: 9, loop: false, speed: CONFIG.PLAYER_JUMP_SPEED },
    fall: { from: 10, to: 11, loop: true, speed: CONFIG.PLAYER_FALL_SPEED },
    // land: no dedicated frames exist in the bake — see Open Questions for the
    // recommended single-frame reuse strategy (hold fall's last frame, index 11).
  },
});
```
Only call `player.play(target)` when `player.getCurAnim()?.name !== target` — this guard already exists in `src/player.js` line ~121 and must be preserved (a naive "call play() every frame" would restart every loop at frame 0, causing visible stutter).

### Pattern 2: Explicit collider-shape lock, independent of sprite footprint (already precedented in `build.js`'s spike hitbox)

**What:** `area({ shape: new Rect(vec2(0), W, H), offset: vec2(...) })` pins the physics body to fixed dimensions regardless of what the currently-playing animation frame's trimmed content bbox would otherwise auto-compute.
**When to use:** Any sprite-driven entity where the collider must NOT visually resize as frames change — this is exactly the player's situation (a run frame with legs spread wide vs. an idle frame could otherwise auto-fit to different pixel bounding boxes if Kaplay's default no-shape `area()` derives from live rendered content rather than the declared slice-cell size).
**Example:**
```javascript
// Source: src/levels/build.js (existing spike hitbox — the direct precedent for this idiom)
area({
  shape: new Rect(vec2(0), CONFIG.SPIKE_HITBOX_W, CONFIG.SPIKE_HITBOX_H),
  offset: vec2(spikeOffX, spikeOffY),
}),
```
```javascript
// Recommended for src/player.js's makePlayer() — same idiom, no offset needed
// since the baked sheet is already bottom-aligned/centered within each 16x32 cell
// (confirmed directly from build_player_swamphunter()'s own crop/paste code).
area({ shape: new Rect(vec2(0), 16, 32) }),
```
`Rect`/`vec2` are Kaplay engine globals — safe to reference inside `makePlayer()`'s function body (after `kaplay({global:true})` has run), following the a727c13 rule already enforced elsewhere in this file.

### Pattern 3: Native-color asset bake (Phase 31/32 precedent — do NOT reuse the old `build_door()`'s palette-remap pipeline)

**What:** Crop → `Image.NEAREST` resize only → paste onto a transparent canvas → `assert` size → `save()`. No `_remap()`/`_remap_luminance()` call.
**When to use:** Any NEW Gothicvania-sourced asset meant to sit visually alongside the already-shipped native-color castle biome atlas (`build_biome_atlas_castle()`), player (`build_player_swamphunter()`), and enemy (`build_enemy_hellhound()`) — all four already ship unremapped, at native Gothicvania purple/brown/gold tones. The OLD `build_door()` function (still in the codebase, sourced from Kenney's "6 Color Dungeon" pack) DOES remap through `ENVIRONMENT_PALETTE` via `_remap_luminance` — that pipeline belongs to a different, older asset generation and must not be extended to the new church/castle-sourced door/math-gate, or the result will visibly clash with the rest of the castle biome's already-native-color art.
**Example:**
```python
# Source: scripts/build-art-assets.py's build_player_swamphunter() (Phase 31 Plan 05) —
# the pattern to mirror for the new build_door()/build_math_gate() functions.
def build_door():
    """Old-Dark-Castle-tileset-Files' wooden-door tile -> assets/door.png (32x64).

    Crop verified this session (Phase 33 research): (664, 47, 698, 112) in
    old-dark-castle-interior-tileset.png (832x240) -- a 34x65px wooden door with
    stone frame + gold hinge/handle, near-exact fit for the locked 32x64 footprint.
    Measured 0% pink/magenta hue (scripts/lib/pink_scan.py) -- no allowlist entry
    needed. Ships at NATIVE Gothicvania color (no _remap_luminance) to match the
    already-shipped castle atlas/player/enemy assets -- do NOT reuse the OLD
    build_door()'s Kenney-sourced remap pipeline (see Architecture Patterns #3).
    """
    target_w, target_h = 32, 64
    sheet_path = os.path.join(
        GV_SRC, "gothicvaniapatreoncollection", " gothicvania patreon collection",
        "Old-dark-Castle-tileset-Files", "PNG", "old-dark-castle-interior-tileset.png",
    )
    im = Image.open(sheet_path).convert("RGBA")
    crop = im.crop((664, 47, 698, 112))  # 34x65 -- verified content-full, 0% pink
    resized = crop.resize((target_w, target_h), Image.NEAREST)  # near-1:1, minor squash
    assert resized.size == (target_w, target_h)
    save(resized, os.path.join(ROOT, "assets", "door.png"))
```

### Anti-Patterns to Avoid
- **Calling `player.play(target)` every `onUpdate` tick regardless of current state:** resets the anim to frame 0 every frame — the existing code already guards this correctly (`if (player.getCurAnim()?.name !== target)`); do not remove or weaken that guard when adding `fall`/`land`.
- **Reusing the OLD `build_door()`'s `_remap_luminance(ENVIRONMENT_PALETTE)` call on the new church/castle door crop:** would silently repaint the already-native-color castle-register asset through a Kenney-era palette, producing a visible tonal mismatch against the rest of the (unremapped) castle biome.
- **Letting `area()` auto-derive the player's collider shape from the currently-playing frame's trimmed content bbox:** this is the exact failure CLAUDE.md's binding decision exists to prevent — always pass an explicit `shape`.
- **Wiring `patrol()` or any velocity/movement onto the Hell hound this phase:** explicitly Phase 36's job per CONTEXT.md; this phase wires only the idle pose/animation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-frame sprite-sheet slicing + named playback | A custom frame-index/timer tracker | Kaplay's built-in `loadSprite({sliceX, anims})` + `.play()`/`.getCurAnim()` | Already the exact API this codebase uses 3× (player, coin, biome atlas caps); reinventing it would duplicate engine functionality and risk drifting from the a727c13/anti-leak conventions already enforced |
| Fixed-size physics collider independent of visual frame | Manual per-frame bbox recomputation in `onUpdate` | `area({ shape: new Rect(vec2(0), w, h) })`, set once at entity creation | The engine already supports declaring a static collider shape; recomputing it in JS every frame would be both redundant and a source of the exact jump-feel regression CLAUDE.md's binding decision warns about |
| Locked-barrier visual variety across levels | Hand-authoring 8 separate door/math-gate sprite variants | ONE shared baked sprite (CONTEXT.md-locked scope), reused via the existing `sprite("door")` call already shared across all 8 levels | Per-biome variety is explicitly deferred to Phase 35; building it now would violate the phase boundary and add unreviewed scope |

**Key insight:** Every technical piece this phase needs (sliced sprite anims, explicit collider shapes, Pillow-based cropping) is already a proven, working pattern elsewhere in this exact codebase — the job is disciplined extension, not invention.

## Common Pitfalls

### Pitfall 1: Assuming the 12-frame Swamp Hunter sheet's frame order from the PNG pixels alone
**What goes wrong:** Pixel-inspecting `assets/player-swamphunter.png` cold (without reading `build_player_swamphunter()`'s docstring/code) risks misreading which 16px cells are idle vs. run vs. jump vs. fall, especially since idle (2 frames) and jump (2 frames) can look visually similar at a glance.
**Why it happens:** The PNG itself carries no embedded frame-name metadata — only the Python source that baked it documents the mapping.
**How to avoid:** Read `scripts/build-art-assets.py`'s `build_player_swamphunter()` function (lines ~1006-1080) directly — its docstring and `frame_files` list give the authoritative order: **idle:0-1, run:2-7, jump:8-9, fall:10-11** (verified this session).
**Warning signs:** An anim range that doesn't match this exact split (e.g., treating frames 8-9 as "fall" and 10-11 as "jump") will play visually wrong animations that only become obvious once compared against the real sprite in-browser.

### Pitfall 2: No "land" frames exist — do not invent a re-bake to get one
**What goes wrong:** ART-04's roadmap wording implies 5 distinct states including "land"; a naive plan might schedule a player-sheet re-bake to carve out a dedicated land pose from the source pack's `stand`/`crouch` folders.
**Why it happens:** The roadmap phrasing and CONTEXT.md's "add distinct fall and land states" language reads as if land needs its own art.
**How to avoid:** CONTEXT.md explicitly locks "no new player art baking needed, only wiring" — this is a binding scope boundary, not a suggestion. The land state must be synthesized from the 12 already-baked frames (recommend: hold the last fall frame, index 11, briefly on the falling→grounded transition, using the same single-frame non-looping idiom `main.js` already uses for `jump` — `to: 11, loop: false, speed: CONFIG.PLAYER_LAND_SPEED` with `speed > 0`).
**Warning signs:** A plan task that adds a new `build_player_swamphunter()` crop/frame or modifies `assets/player-swamphunter.png`'s dimensions — this contradicts the locked "wiring only" scope and must be caught in plan review.

### Pitfall 3: Reusing the OLD `build_door()`'s Kenney-era remap pipeline for the new church/castle-sourced door
**What goes wrong:** `scripts/build-art-assets.py` already has a `build_door()` function — a naive edit might just swap its `sheet_path` to the new church/castle source while leaving the `_remap_luminance(resized, ENVIRONMENT_PALETTE)` call intact, since that's "how the function already works."
**Why it happens:** Editing an existing function in place is the path of least resistance; the remap call is easy to miss as "just another line."
**How to avoid:** The new door/math-gate art must ship at NATIVE Gothicvania color (no remap) to visually match the already-shipped, unremapped castle biome atlas/player/enemy — verify by grep: `grep -A15 "def build_door" scripts/build-art-assets.py` must show zero `_remap(`/`_remap_luminance(` calls, mirroring the acceptance-criteria pattern Phase 31 Plan 05 already used for `build_player_swamphunter()`.
**Warning signs:** A rendered door that looks visually "off-palette" compared to the rest of a castle-biome level once integrated — the remap silently shifts hue/luminance toward the OLD `ENVIRONMENT_PALETTE`.

### Pitfall 4: Forgetting that `assets/_gothicvania-src/` is gitignored and won't exist at execute time
**What goes wrong:** A plan step that assumes `assets/_gothicvania-src/` (this session's re-fetched source zips) is present will fail with a missing-file error the moment execution happens in a fresh worktree/session.
**Why it happens:** This is a well-documented, repeated finding from Plans 31-04 and 31-05 (both had to re-fetch fresh) — but it's easy to forget as "already handled."
**How to avoid:** The execute-phase plan must include an explicit re-fetch step for the two zips needed this phase: church (`https://opengameart.org/sites/default/files/gothicvania%20church%20files.zip`) and the Patreon Collection/castle (`https://opengameart.org/sites/default/files/%20gothicvania%20patreon%20collection.zip`) — both URLs confirmed working and CC0-licensed this session (public-license.txt read directly from each zip).
**Warning signs:** `FileNotFoundError` inside `build_door()`/`build_math_gate()` referencing a path under `assets/_gothicvania-src/`.

### Pitfall 5: Stale CREDITS.md row for `assets/door.png` after overwriting its content
**What goes wrong:** `CREDITS.md` currently attributes `assets/door.png` to "6 Color Dungeon 16x16 (gate/archway)" / HorusKDI. If the new door bake overwrites `assets/door.png` in place (recommended — reuses the existing manifest entry and `loadSprite("door", ...)` call), that CREDITS.md row becomes factually wrong (wrong author, wrong source, wrong license page) unless updated in the same change.
**Why it happens:** CREDITS.md updates are easy to treat as a separate/optional cleanup task rather than part of the same atomic change.
**How to avoid:** Update the `assets/door.png` CREDITS.md row to point at the Gothicvania Patreon Collection / castle source (same pack already has other rows in CREDITS.md for `atlas-castle.png`/`enemy-hellhound.png` — extend that existing row's file list rather than creating a duplicate row) in the SAME task that overwrites the PNG.
**Warning signs:** `grep "door.png" CREDITS.md` still showing "HorusKDI"/"6 Color Dungeon" after the bake lands.

### Pitfall 6: Math-gate glyph text() rendering under/behind the new sprite panel
**What goes wrong:** The current math-gate build order in `src/levels/build.js` is: invisible blocker → flat-color `rect()` panel → `text("?")` glyph, each a separate `add([...])` call. If the flat-color `rect()`+`outline()` panel is swapped for `sprite("math-gate")` but the panel entity is added AFTER the glyph in z-order (or the sprite's own non-transparent background occludes the glyph), the "?" could render invisible/behind the new art.
**Why it happens:** Kaplay's default z-order is insertion order; swapping a `rect()` for a `sprite()` doesn't change ordering automatically, but the new sprite has real opaque pixels across most of its area (unlike the flat-color box, which was intentionally simple) — increasing the chance of visual occlusion if ordering isn't re-verified.
**How to avoid:** Keep the exact same three-entity insertion order (blocker → panel → glyph) and visually confirm in a real browser (not just a code read) that the "?" glyph still reads clearly against the new barred-window/cross art background — the source crop's own cross-plaque motif sits roughly where the glyph would need to be centered, so placement may need a small position tweak.
**Warning signs:** `scripts/audit-phase21-mechanics.mjs` still passes (it doesn't check pixel rendering) but a manual screenshot shows a missing or illegible glyph.

## Code Examples

### Fall vs. jump split (velocity-sign-driven, no new library)
```javascript
// Recommended addition to src/player.js's existing anim state-machine onUpdate()
// (currently: `if (!player.isGrounded()) target = "jump";` — this single branch
// needs to split into rising vs. falling using the existing vel.y Kaplay convention
// this file already documents: "Up is NEGATIVE Y (Vec2.UP = (0,-1))".
let target;
if (!player.isGrounded()) {
  target = player.vel.y < 0 ? "jump" : "fall"; // rising vs. falling, same convention
                                                 // already used by onKeyRelease's
                                                 // variable-height jump-cut check
} else if (speedX >= deadzone) {
  target = "run";
} else {
  target = "idle";
}
```

### Enemy blocker: single static sprite → real looping idle anim
```javascript
// src/main.js — new load call (enemy-1/2/3's 3 static loadSprite calls are replaced
// by ONE sliceX+anims call, mirroring the coin/player pattern)
loadSprite("enemy-hellhound", "../assets/enemy-hellhound.png", {
  sliceX: 6,
  anims: {
    idle: { from: 0, to: 5, loop: true, speed: CONFIG.ENEMY_IDLE_SPEED },
  },
});
```
```javascript
// src/levels/build.js — enemy panel emission (was: sprite(CONFIG.ENEMY.SPRITES[e.variant ?? 0]))
const panel = add([
  sprite("enemy-hellhound"),
  pos(e.x, e.y),
  "enemy-panel",
]);
panel.play("idle"); // mirrors the existing coin.play("spin") call site immediately above in this file
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `player.png` (Kenney, 80×32, 5 frames), 3 named anims (idle/run/jump), `area()` implicit shape | `player-swamphunter.png` (Gothicvania, 192×32, 12 frames), 5 named anims (idle/run/jump/fall/land), `area({shape:16×32})` explicit lock | This phase (33) | Full animation coverage + a hard collider guarantee that survives future art swaps |
| `door.png` (Kenney-adjacent "6 Color Dungeon", Kenney-palette-remapped) | New church/castle-sourced door, native Gothicvania color | This phase (33) | Visual consistency with the already-shipped, unremapped castle biome atlas |
| Math-gate: flat `color()`+`outline()`+`text("?")` box, zero sprite art | Real sprite panel (church barred-window/cross crop) + `text("?")` glyph overlay | This phase (33) | Removes the last "obviously placeholder" mechanic visual in the game |
| `CONFIG.ENEMY.SPRITES` = 3 static Kenney sprites (saw/barnacle/fly), no anim | Single Hell hound sprite, 6-frame looping idle | This phase (33) | Replaces mismatched mechanical/insect placeholder set with one dark-register animated blocker |

**Deprecated/outdated:**
- The old `build_door()` function's `_remap_luminance(resized, ENVIRONMENT_PALETTE)` pipeline is not deprecated globally (other assets may still use it), but must NOT be extended to the new door/math-gate bakes — see Pitfall 3.
- `assets/enemy-1.png`/`enemy-2.png`/`enemy-3.png` become dead assets once the swap lands (still CC0, harmless to leave vendored, but their `CONFIG.ENEMY.SPRITES` consumer and `loadSprite` calls should be removed or clearly marked gate-coverage-only in `src/assets-manifest.js`, per that file's own documented `kind` convention).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Kaplay 3001's default (no-`shape`) `area()` on a sprite-driven entity derives its collider from the currently-rendered frame's content bounding box (not the declared `sliceX` cell size), which is the technical reason a per-frame-varying collider could occur without an explicit `shape` | Architecture Patterns #2, Common Pitfalls | LOW — even if the actual failure mode differs (e.g., `area()` always uses the full declared cell regardless of content), the explicit-shape lock is independently mandated by a binding CLAUDE.md decision, so the mitigation (add `area({shape})`) is correct either way; only the stated *rationale* is unverified against Kaplay's minified source this session |
| A2 | The recommended land-state synthesis (hold fall's last frame, index 11, briefly, non-looping) will read acceptably to the human sign-off reviewer as a "land" pose, even though it is visually identical to the last fall frame | Summary, Pitfall 2, Code Examples | MEDIUM — if the human sign-off (checkpoint:human-verify, per CONTEXT.md's "never rubber-stamp" precedent) judges this insufficiently distinct from "fall", the planner may need a fallback (e.g., a brief `fx.squash()` visual-only landing cue, which already exists and fires on `player.onGround()` independent of the sprite anim) — this is a real, not hypothetical, risk given the standing precedent of genuine (not rubber-stamped) sign-off rounds in this project |
| A3 | The 32×48 church barred-window crop should be uniformly stretched to 32×64 (rather than transparent-padded or re-cropped elsewhere) to fit `CONFIG.MATH_GATE`'s locked footprint | Summary, Common Pitfalls | LOW — purely a visual-quality judgment call for the execute-phase bake step; a stretched 1.33x vertical scale on pixel art at `Image.NEAREST` is a well-precedented technique in this exact codebase (e.g., `build_door()`'s existing 48×96→32×64 door bake is also a non-1:1 NEAREST resize) but could look slightly "squashed" and might warrant a second crop attempt during execution |
| A4 | Overwriting `assets/door.png` in place (same filename) is preferable to baking a new filename for the door swap | Architecture Patterns, Pitfall 5 | LOW — this is a design recommendation, not a verified requirement; the alternative (new filename + manifest/loadSprite path update + deletion of the old file) is equally valid and may be the planner's actual choice depending on how it wants to structure the CREDITS.md diff |

**If this table is empty:** N/A — see rows above.

## Open Questions

1. **Does the roadmap's "real animated art" requirement for door/checkpoint gates/math gate require literal multi-frame animation, or is real (non-flat) single-frame sprite art sufficient?**
   - What we know: CONTEXT.md's locked decisions describe door and math-gate as "ONE shared door design + ONE shared math-gate design, baked once" with no mention of multiple frames or an idle-loop treatment (unlike the enemy, which CONTEXT.md explicitly calls "the one animated enemy-blocker sprite"). Neither source pack surveyed this session (church, castle) contains multi-frame door/gate art — only single static tiles.
   - What's unclear: Whether the planner should treat this as fully resolved by CONTEXT.md (single static frame is in-scope and sufficient, matching the existing single-frame `door.png` precedent) or should propose a lightweight synthetic animation (e.g., a 2-frame torch-flicker overlay near the door/gate, since both source crops sit adjacent to candle/torch elements in their respective tilesets) to more literally satisfy "animated."
   - Recommendation: Treat CONTEXT.md's explicit "ONE shared design, baked once" framing as authoritative and controlling (it is the user-session decision layer for this specific phase) — ship door/math-gate as real, non-flat, single-frame sprite art. If the human sign-off later judges this insufficiently "alive," a follow-up torch-flicker overlay is a small, isolated addition, not a rework.

2. **Exact final crop-and-fit strategy for the math-gate panel (stretch vs. pad vs. re-crop)?**
   - What we know: The verified content-full crop is 32×48 (exact width match to `CONFIG.MATH_GATE.W`, short of the 64px height by 16px); no adjacent transparent-but-fillable content exists below the crop in the source tileset.
   - What's unclear: Whether a uniform vertical stretch to 64px, a transparent-padded 32×64 canvas with the art bottom- or top-anchored at its native 48px height, or a search for an alternate church/castle asset with a native 32×64 (or closer) footprint gives the best visual result.
   - Recommendation: Default to a uniform `Image.NEAREST` stretch (matches the existing `build_door()` precedent of non-1:1 resizing) as the fastest path; treat this as adjustable at execute-time based on a quick visual check, not a blocking decision for planning.

3. **Should `assets/enemy-1.png`/`enemy-2.png`/`enemy-3.png` be deleted, or kept as orphaned/gate-coverage-only assets?**
   - What we know: `src/assets-manifest.js` already has a documented `kind: "sprite"` convention for "gate coverage only" entries (see its own header comment); deleting the files would also require removing their CREDITS.md rows and manifest entries.
   - What's unclear: Whether the phase's scope (a pure animation-wiring phase) should also do this cleanup, or defer it (the old assets are harmless — still CC0, still pass the pink-gate).
   - Recommendation: Leave the decision to the planner; either is safe, but if kept, the manifest/CREDITS.md rows should be clearly annotated as unused-post-Phase-33 to avoid future confusion (mirrors this project's own documented precedent of never leaving silently-stale attribution).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 + Pillow | Asset baking (`scripts/build-art-assets.py`) | ✓ | Pillow 10.2.0 `[VERIFIED: python3 -c "import PIL; print(PIL.__version__)"]` | — |
| Playwright (via gsd-pi's bundled copy) | `scripts/audit-phase21-mechanics.mjs`'s post-swap re-audit | ✓ (resolved dynamically by the script's own fallback chain, already proven working in Phase 32) | resolved at runtime, not independently version-pinned | Script already has its own `PLAYWRIGHT_MJS_PATH` env-var override fallback |
| Network access to opengameart.org | Re-fetching `assets/_gothicvania-src/` (gitignored, must be re-fetched every session/worktree) | ✓ (both zips fetched successfully this session — church 733KB, castle-collection 4.0MB) | — | None needed — both URLs already confirmed live and correctly licensed |
| nginx/Docker/Dokploy | Production serving of the new static PNGs | N/A this phase (dev-server verification only; production deploy is Phase 38's VER-01) | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — every dependency this phase needs is already present and already proven working (used directly, live, during this research session).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (project has no JS test framework by design — shell-script gates + Playwright-driven `.mjs` scripts ARE the suite, per CLAUDE.md) |
| Config file | none — see Wave 0 |
| Quick run command | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && bash scripts/check-progress.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs && node scripts/audit-phase21-mechanics.mjs && bash scripts/check-pink-gate.sh` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ART-04 | Player collider stays exactly 16×32 across all anim states | manual (screenshot proof) + automated (physics-level) | `node scripts/browser-boot.mjs` (drives across all levels; would surface any gross physics regression e.g. falling through floor) + `?debug=1` manual screenshots at flat floor/1-tile platform/lowest ceiling/door | ✅ (browser-boot.mjs exists) |
| ART-04 | Full idle/run/jump/fall/land anim coverage, no stutter on state transitions | manual (visual review) — Kaplay has no anim-frame assertion API this project uses | N/A — human sign-off (`checkpoint:human-verify`) is the authoritative gate per CONTEXT.md, not an automated script | ❌ — no automated frame-content assertion exists or is planned; this is intentional (visual quality is a human judgment, not a code invariant) |
| ART-05 | Door/math-gate/enemy visual swap is collision-neutral (every encounter still triggers) | integration (real browser-driven input) | `node scripts/audit-phase21-mechanics.mjs` | ✅ (exists, Phase 21/23) |
| ART-05 | New assets pass the pink-gate | automated | `bash scripts/check-pink-gate.sh` | ✅ (exists, Phase 31) |
| ART-05 | New assets exist and are manifest-registered | automated | `node scripts/check-assets-manifest.mjs` (exact invocation — confirm current script name/args at execute time) | ✅ (exists, Phase 32) |

### Sampling Rate
- **Per task commit:** `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` (fast, catches the two hard project-wide invariants: no-timer/no-punishment and a727c13)
- **Per wave merge:** the full suite command above
- **Phase gate:** Full suite green + genuine (non-rubber-stamped) human sign-off before `/gsd-verify-work`

### Wave 0 Gaps

None — every automated gate this phase needs already exists from prior phases (`check-safety.sh`, `check-import-safety.sh`, `check-gate.sh`, `check-progress.sh`, `validate-levels.mjs`, `browser-boot.mjs`, `audit-phase21-mechanics.mjs`, `check-pink-gate.sh`, the assets-manifest checker). This phase only needs to keep them all green, not build new harness.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no | No accounts/auth in this static, client-only game |
| V3 Session Management | no | No sessions — `localStorage` progress only, unrelated to this phase |
| V4 Access Control | no | No access-control surface touched |
| V5 Input Validation | no (indirectly touched) | No new user-input surface added — animation state derives from physics values (`vel.y`, `isGrounded()`) already computed by the engine, not from any external/untrusted input |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Malformed/adversarial asset zip during re-fetch (path traversal via zip-slip) | Tampering | Already mitigated by the established pattern from Plan 31-04/31-05 (`zipfile.is_zipfile()` check + zip-slip path-traversal scan before extraction) — the execute-phase plan should reuse this exact pattern for the two zips re-fetched this phase (church, castle collection), not skip it as "already proven safe" (each re-fetch is a fresh network fetch) |
| Silent asset-load 404 (wrong `../assets/...` path) | — (availability, not a STRIDE security category, but this project treats it as gate-worthy) | Already covered by `src/assets-manifest.js`'s existence-check gate — new door/math-gate/enemy-hellhound `loadSprite` calls must be added to the manifest, not just to `main.js`, or the "kills the silent-404 class" guarantee is broken for these new assets |

This phase has essentially no security-relevant surface — it is a pure client-rendering/asset change with no new input, network, or trust-boundary surface beyond the already-mitigated offline asset re-fetch step.

## Sources

### Primary (HIGH confidence — direct tool verification this session)
- `scripts/build-art-assets.py` (local file read) — exact `build_player_swamphunter()`/`build_enemy_hellhound()` frame layout, crop coordinates, native-color-vs-remap pattern
- `src/player.js`, `src/main.js`, `src/config.js`, `src/levels/build.js` (local file reads) — current anim-state machine, `loadSprite` calls, `CONFIG.DOOR`/`CONFIG.MATH_GATE`/`CONFIG.ENEMY` blocks, collider/blocker construction
- Direct download + `unzip -l` + Pillow inspection of `gothicvania%20church%20files.zip` and `%20gothicvania%20patreon%20collection.zip` (this session, via `curl`) — confirmed door/math-gate crop candidates, measured exact pixel dimensions and content bounding boxes
- `scripts/lib/pink_scan.py`'s `pink_fraction()` run directly against both candidate crops this session — measured 0.0% pink-hue fraction for both
- Each zip's own `public-license.txt`, read directly this session — confirmed CC0/public-domain (Luis Zuno / ansimuz) for both packs
- `docs/LEVEL-DESIGN.md` Section 9 (local file read) — biome atlas anchor/lip convention, confirms native-color precedent for castle biome art
- `grep` across `src/levels/level-0{1..8}.js` this session — confirmed every level has exactly 1 door + 1 mathGate + 1 enemy (matches CONTEXT.md's "one shared design" scope)

### Secondary (MEDIUM confidence)
- `.planning/research/v6-scouting/ASSET-SCOUTING.md` — pre-existing project research, consumed as verified fact per project convention ("church/castle packs include doors, gates, statues")
- `.planning/phases/31-asset-bake-style-board-sign-off/31-05-PLAN.md`/`31-05-SUMMARY.md` — the exact bake-pipeline precedent this phase's new functions should follow

### Tertiary (LOW confidence)
- None — every material claim in this document was either read directly from the live codebase/assets this session or independently pixel-verified.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, every API already proven in this exact codebase
- Architecture: HIGH — every pattern (sliced anims, explicit collider shape, native-color bake) has a direct, working precedent already committed in this repo
- Pitfalls: HIGH — pitfalls 1-4 are drawn from directly-observed facts (exact frame layout, missing land frames, existing remap pipeline, gitignored source dir) this session; pitfalls 5-6 are inferred from reading the actual consumer code paths (CREDITS.md, build.js z-order) and are logically sound but not yet proven against a real bake

**Research date:** 2026-07-11
**Valid until:** No fixed expiry — this research is tied to the current, already-committed state of `assets/player-swamphunter.png`/`assets/enemy-hellhound.png` (Phase 31) and the two re-fetched OGA zip URLs (stable, long-lived OpenGameArt file URLs). Re-verify only if either underlying pack's content changes or if Kaplay is ever upgraded (currently pinned, no upgrade planned per v6.0 Out-of-Scope).
