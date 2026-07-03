# Phase 18: Art, Animation & Parallax - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss — all grey-area recommendations below were auto-accepted.

<domain>
## Phase Boundary

This phase makes the working four-level platformer **look and feel like a real game** by layering art, animation, and atmosphere onto the already-verified logic. Deliver an animated player character, a real dark-grunge tileset, a calm camera-tied parallax background, and styled title/level-select screens — all while keeping every Kaplay reference inside function bodies (a727c13) and preserving the existing movement/collider/level-geometry contracts.

In scope (ART-01, ART-02, ART-03, ART-04):
- Replace the static 16×32 `assets/player.png` with a frame-based animated sprite (idle / run / jump + facing direction), driven by Kaplay anim `speed`.
- Replace the single-color placeholder ground tiles with a real dark-grunge 16×16 tileset that reads as silhouettes against the background.
- Add a layered parallax background tied to camera position (not timers), calm and non-strobing.
- Style the title and level-select screens to the dark-grunge aesthetic with no pink.
- Keep all engine calls inside function bodies; load new sprites from `../assets/...` in `main.js` after `kaplay()`.

Out of scope:
- New math mechanics, level geometry changes, or difficulty changes (Phases 15–17).
- Audio / SFX / music (AUDIO-01, post-v4.0).
- Changing the brain algorithm, XP curve, or save format.
- Upgrading Kaplay or adding runtime dependencies.
</domain>

<decisions>
## Implementation Decisions

### Player Animation (ART-01)
- **D-01:** Replace the single-frame `assets/player.png` with a multi-frame sprite sheet where each frame stays **16×32 px** so the existing collision footprint, checkpoints, and level geometry remain valid.
- **D-02:** Load the player sheet in `src/main.js` using `loadSprite("player", "../assets/player.png", { sliceX: N, anims: { idle, run, jump } })` — the same `loadSprite` + `sliceX/anims` idiom already used for the coin (no `loadSpriteSheet`).
- **D-03:** Add a small animation state machine inside `src/player.js`: **idle** when grounded and `|vel.x|` is below a small deadzone; **run** when grounded and `|vel.x|` exceeds the deadzone; **jump** when not grounded.
- **D-04:** Face movement direction by setting `player.flipX = player.vel.x < 0` only when `|vel.x|` exceeds the deadzone; preserve the last facing direction when the player stops (no jitter at rest).
- **D-05:** Use Kaplay anim `speed` for frame-rate-independent playback; only call `player.play(anim)` when `player.getCurAnim()?.name !== anim` to avoid resetting to frame 0 every update.

### Tileset & Level Visuals (ART-02)
- **D-06:** Replace the single 16×16 `assets/tiles/ground.png` with a small dark-grunge tile sheet (e.g., 3–5 frames) loaded with `sliceX`.
- **D-07:** Keep the existing **merged-floor collider + visual-only tile** idiom in `src/levels/build.js`; only change which frame is drawn per tile position. Map run position to frames such as left-edge, center, right-edge, single-tile, and platform underside/column.
- **D-08:** Ensure foreground tiles are dark with visible edge contrast so silhouettes read clearly against the parallax background; no pink anywhere.
- **D-09:** Do not change `CONFIG.TILE_SIZE`, `CONFIG.FLOOR_Y`, the 16 px grid, or any collider geometry — this is a pure visual pass.

### Parallax Background (ART-03)
- **D-10:** Add **3 background layers** below the ground/player z-order: far silhouettes, mid structures, and a near grunge texture.
- **D-11:** Drive parallax by camera X only — each layer's position is a function of `getCamPos().x` multiplied by a ratio. Proposed ratios: far **0.15**, mid **0.45**, near **0.75**.
- **D-12:** Use camera position only; no timer-driven or auto-scrolling background (SAFE-01 no-timer mandate).
- **D-13:** Palette stays muted dark greys/blues (e.g., `#151515`, `#0f0f1a`), low saturation, with no bright or rapidly moving elements — motion must remain calm and non-strobing.
- **D-14:** Implement layers as wide sprites/images in `src/scenes/game.js`; reuse/tile them horizontally to cover each level's bounds.

### Title & Level-Select Styling (ART-04)
- **D-15:** Add a shared dark-grunge background image/texture behind both `src/scenes/title.js` and `src/scenes/select.js`.
- **D-16:** Title screen: keep the centered "Math Lab" wordmark rendered via `text()` in the existing neon-green accent; add subtle static decoration (e.g., a pixel border or optional pre-rendered wordmark image) but avoid animation that competes with the 400–500 ms flash cap.
- **D-17:** Level-select: replace the colored `rect()` tiles with stylized panel frames using the existing three-state palette: **locked** dim grey + lock glyph, **unlocked** accent-green frame, **cleared** accent-blue check glyph. Keep the bright white outline for the active keyboard cursor.
- **D-18:** Preserve the current dual-input model (arrow keys + Enter, mouse click); locked tiles remain non-selectable.
- **D-19:** No pink; all colors come from the existing dark-grunge palette in `src/config.js` and `src/scenes/select.js`.

### Engineering & Verification
- **D-20:** Keep every new sprite load in `src/main.js` after `kaplay()` and every engine call inside function bodies (a727c13). New art/parallax helper modules must be pure functions with engine globals used only in their bodies.
- **D-21:** Extend `scripts/check-import-safety.sh` to cover any new art/parallax modules that are called at scene time.
- **D-22:** Mandatory real browser boot before closing the phase: verify idle/run/jump animation switches, facing flip, parallax tracks the camera, title/select remain readable, and no handlers/tweens/effects leak on enter→leave→re-enter.

### Claude's Discretion
- Exact player frame count and poses, exact tileset frame layout, exact parallax art/ratios within the ranges above, and exact decorative details on the title/select screens are at Claude's discretion during implementation, provided all acceptance criteria and ADHD-safety constraints are met.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & milestone context
- `.planning/PROJECT.md` — Vision, constraints, target user, dark-grunge aesthetic, no-timer/no-pink/no-backend rules.
- `.planning/REQUIREMENTS.md` — v4.0 requirements and traceability (ART-01..ART-04 mapped to Phase 18).
- `.planning/STATE.md` — v4.0 roadmap, cross-cutting mitigations (a727c13, anti-leak, real-browser boot), locked decisions.

### Prior phase context
- `.planning/phases/14-multi-scene-shell/14-CONTEXT.md` — Title/select shell decisions; Phase 18 skins those screens.
- `.planning/phases/17-build-the-levels/17-CONTEXT.md` — 4 levels authored; Phase 18 layers art onto them without changing geometry.

### Art, animation, and parallax targets
- `src/player.js` — Player factory; animation state machine and facing flip go here.
- `src/main.js` — Sprite loading site; all `loadSprite` calls must live after `kaplay()`.
- `src/levels/build.js` — Parameterized builder; tile frame selection logic goes here while colliders stay unchanged.
- `src/levels/level-01.js` — Reference descriptor schema with forward-looking `theme`/`parallax` slots.
- `src/scenes/game.js` — Scene update loop where parallax layers track the camera.
- `src/scenes/title.js` — Title screen to style.
- `src/scenes/select.js` — Level-select tiles to style.
- `src/camera.js` — `followCamera` and `setCamPos`; parallax reads from the resulting camera position.
- `src/fx.js` — Established tween/self-destroy effect patterns and the neon-green accent color.
- `src/config.js` — All tuning constants; no new behavior constants expected, but visual constants may be added.

### Gates & verification
- `scripts/check-import-safety.sh` — Extend to cover new scene-time art/parallax modules.
- `scripts/check-safety.sh` — Re-run after changes to confirm no timers or punishment constructs are introduced.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main.js` — Already loads `player`, `ground`, `coin`, `spike`, and `goal` via `loadSprite`. The coin demonstrates the `sliceX + anims` pattern that the new player sheet will mirror.
- `src/player.js` — Builds the player entity with `sprite("player")`, `scale(1)`, and `body()`. The existing squash/stretch tween hooks can coexist with sprite animation.
- `src/levels/build.js` — Already draws visual floor/platform tiles as separate `sprite("ground")` objects on top of merged colliders. Only the per-tile frame selection needs to change.
- `src/fx.js` — Self-cleaning tween effects tagged `"fx"`; any new art transient should reuse this idiom.
- `src/scenes/title.js` and `src/scenes/select.js` — Functional canvas-UI scenes using `text()`/`rect()`/`outline()`; Phase 18 restyles them without changing input logic.

### Established Patterns
- **a727c13 discipline** — Engine globals only inside function bodies; module scope is limited to imports and plain data literals.
- **loadSprite + sliceX/anims** — Coin is the reference: `loadSprite("coin", "../assets/coin.png", { sliceX: CONFIG.COIN_FRAMES, anims: { spin: ... } })`.
- **Merged-floor colliders + visual tiles** — Physics and visuals are decoupled; do not switch to per-tile colliders.
- **Closure-local state** — `game.js` owns scene run state; any parallax update logic should live inside the scene closure.
- **Tween-only effects** — No `wait()`/`loop()`/`setTimeout`; all motion is tween-based and self-destroys on `onEnd`.
- **z-layering** — HUD/title/select use z ≥ 9000; gate dim at z 9990, gate banner at z 9994; effects live at z 50–60; ground/player sit between. Parallax must stay below ground (z < 0 or low positive).

### Integration Points
- New sprites connect through `src/main.js` → loaded before `go("title")`.
- Player animation connects through `src/player.js` → called by `src/scenes/game.js` after `makePlayer()`.
- Tile visuals connect through `src/levels/build.js` → called by `src/scenes/game.js` before `makePlayer()`.
- Parallax connects through `src/scenes/game.js` `onUpdate` → reads camera position and updates layer positions.
- Title/select styling connects through `src/scenes/title.js` and `src/scenes/select.js` → called by `src/main.js` scene registration.
</code_context>

<specifics>
## Specific Ideas

- **Player sheet proposal:** 16×32 frames in one row, e.g., `sliceX: 5` with 2 idle frames + 2 run frames + 1 jump frame. Keep the same silhouette so the 16×32 area collider stays fair.
- **Tile sheet proposal:** 16×16 frames in one row, e.g., `sliceX: 5` with left-edge, center, right-edge, single-tile-top, and platform-column/underside. Use the center frame for long runs and edge frames for run boundaries.
- **Parallax proposal:** Three wide static PNG layers:
  - Far: faint mountain/city silhouette at ~15 % camera scroll.
  - Mid: darker structural shapes at ~45 % camera scroll.
  - Near: subtle grunge texture at ~75 % camera scroll.
  All layers reuse/tile horizontally and sit well below the player z-order.
- **Title/select background proposal:** A single 640×360 dark-grunge texture (or a seamlessly tileable pattern) loaded as a sprite and added behind all text/tiles with `fixed()` and a low z-order.
- **Color lock:** Reuse existing tokens — accent green `#00ff88`, cleared blue `#66ccff`, label grey `#e8e8e8`, locked grey `#444444`, locked border `#555555`, background `#0a0a0a`. No pink.
- **Animation safety:** Use short loops (idle ~6–8 fps, run ~10–12 fps) and avoid rapid flashes. All transitions should be smooth and never reset to frame 0 while the state is unchanged.
</specifics>

<deferred>
## Deferred Ideas

- Audio / SFX / calm ambient music (AUDIO-01) — remains post-v4.0.
- Per-level unique sky colors or environmental themes (future polish).
- Animated environmental details (e.g., flickering lights, drifting dust) — would add visual complexity beyond this phase.
- Particle weather effects (rain, fog) — deferred to avoid over-stimulation.
- Star/score-based completion texture (CONTENT-FUT-02 — kept out for ADHD-safety).
- Additional levels or world packs (CONTENT-FUT-01).
</deferred>

---

*Phase: 18-Art, Animation & Parallax*
*Context gathered: 2026-07-03*
