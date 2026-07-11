# Phase 33: Player & Entity Animation - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning
**Mode:** Autonomous smart-discuss (batch table proposals, all 3 areas accepted as-recommended)

<domain>
## Phase Boundary

The avatar and every mechanic entity look alive at SNES fidelity while physics stay byte-identical to the kid-validated feel. In scope: wiring the already-baked Swamp Hunter player spritesheet into full idle/run/jump/fall animation with an explicit 16×32 collider lock (superseding the v4.1 player-art lock with a NEW genuine human sign-off — checkpoint:human-verify, never rubber-stamped, per standing project precedent); baking and wiring one shared animated door design and one shared animated math-gate design (reused across all 8 levels); wiring the already-baked Hell hound sprite as the one animated enemy-blocker sprite for all levels; re-proving the full interactive mechanic audit still triggers every encounter across all 8 levels post-swap (collision-neutral, not assumed). Out of scope: per-biome enemy variety (deferred to Phase 35 if wanted), props (ART-06, Phase 35), world motion/patrol wiring for Hell hound (Phase 36), level geometry changes (Phase 34).

</domain>

<decisions>
## Implementation Decisions

### Player Animation Wiring

- The Swamp Hunter spritesheet (`assets/player-swamphunter.png`, 192×32, 12 frames of 16×32) was already baked in Phase 31 specifically for this phase — no new player art baking needed, only wiring.
- Extend the existing anim-state pattern (`src/player.js` already has a `player.play(target)` state machine driven by grounded/velocity checks, and `src/main.js` already has a `loadSprite("player", ..., { sliceX, anims: {...} })` pattern with `idle`/`run`/`jump` anims) — add distinct `fall` and `land` states to reach the roadmap's required 5 states (idle, run 4+, jump, fall, land).
- Collider lock: when swapping to the new sprite, `area()` must gain an explicit `{ shape: new Rect(vec2(0), 16, 32) }` (or equivalent) so the physics hitbox stays exactly 16×32 regardless of the new sprite's visual size (~40–48px tall per `ASSET-SCOUTING.md`'s own note: "keep the physics hitbox, render the sprite larger"). This is a binding CLAUDE.md decision, not new to this phase.
- The exact 12-frame → idle/run/jump/fall split is a technical/implementation detail (pixel-inspect the real baked PNG or the known Gothicvania Swamp Hunter pack frame order) left to planning/research — not a product-level grey area.
- Sign-off proof requirement (roadmap success criterion 2): feet-on-ground screenshots against `?debug=1` colliders at 4 spots — flat floor, 1-tile platform, lowest ceiling, door — proving the collider truly stayed 16×32.

### Door / Gate / Math-Gate Art

- Doors and math-gates currently have no biome-specific or per-phase-31 baked replacement — this phase bakes NEW art for both, sourced from the church/castle packs (`ASSET-SCOUTING.md` confirms: "church/castle packs include doors, gates, statues").
- Scope bound: ONE shared door design + ONE shared math-gate design, baked once and reused across all 8 levels — matches the current uniform pattern (`door.png` and the math-gate's flat-color box are already biome-agnostic across all levels today). Per-biome art variety for these entities is NOT in scope this phase.
- Per-biome dressing/re-skinning is explicitly Phase 35's job (ART-06/ART-07 — props layer + biome re-dress), not reopened here.
- Invisible blocker colliders (the tall solid `rect()+body({isStatic:true})` physics blockers behind doors/math-gates) stay byte-unchanged — only the visual sprite/rendering layer changes, same "geometry/collider frozen, visual pass only" discipline as Phase 32's terrain work.

### Enemy Blocker Variety

- Hell hound (`assets/enemy-hellhound.png`, 384×32, 6 idle-only frames) was already baked in Phase 31 as the one animated enemy-blocker sprite for this phase — no new enemy art baking needed for the primary path.
- Hell hound replaces the existing `enemy-1`/`enemy-2`/`enemy-3` static placeholder set (`CONFIG.ENEMY.SPRITES`) as the ONE shared enemy-blocker sprite across ALL 8 levels (matches the existing pattern of one shared sprite set, not per-biome).
- Per-biome enemy variety (swamp thing, ghost, spider — confirmed available in the source packs per `ASSET-SCOUTING.md`, each with usable idle frames) is explicitly deferred, not baked this phase — a future consideration for Phase 35's re-dress pass if wanted later, not committed to now.
- Hell hound is idle-only (no walk/run frames baked) — this phase wires only the idle/stationary blocker pose. Any motion/patrol animation is explicitly Phase 36's job (World Motion & Ambient Life) — this phase does not wire `patrol()` or any movement for Hell hound.

### Claude's Discretion

- Exact frame-range split of the 12-frame Swamp Hunter sheet into idle/run/jump/fall (inspect the real PNG / known source-pack frame order during planning).
- Exact door/math-gate visual design pulled from the church/castle source packs (which specific door/gate asset within those packs) — informed by the style-board precedent (dark-SNES register, no pink) but not pre-decided here.
- Internal implementation of the fall/land anim-state transition logic in `player.js` (e.g. exact velocity/grounded thresholds distinguishing "jump" from "fall").

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `assets/player-swamphunter.png` (Phase 31, 192×32, 12-frame idle/run/jump/fall sheet, native Gothicvania color) — ready to wire, no new baking needed.
- `assets/enemy-hellhound.png` (Phase 31, 384×32, 6 idle-only frames, native Gothicvania color) — ready to wire, no new baking needed.
- `scripts/build-art-assets.py` already has `build_player_swamphunter()` and `build_enemy_hellhound()` (Phase 31) as reference for the bake-pipeline pattern this phase's new door/math-gate bake functions should follow (shared-scale-factor idiom, no `_remap`/`_remap_luminance`, native color).
- `src/player.js`'s existing `player.play(target)` state machine (driven by grounded/velocity checks in `onUpdate`) and `src/main.js`'s existing `loadSprite("player", ..., { sliceX: CONFIG.PLAYER_FRAMES, anims: {...} })` pattern are the direct analogs to extend — not replace.
- `CONFIG.PLAYER_FRAMES`/`PLAYER_IDLE_SPEED`/`PLAYER_RUN_SPEED`/`PLAYER_JUMP_SPEED` in `src/config.js` are the existing per-anim tunable pattern to extend with fall/land equivalents (no magic numbers, per project convention).

### Established Patterns

- `src/levels/build.js` currently renders the door as `sprite("door")` (single static image, no anim) and the math-gate as a flat `color()+outline()+text("?")` box with NO sprite at all — this is exactly the "flat-color panel" the roadmap goal names directly.
- `CONFIG.ENEMY.SPRITES = ["enemy-1", "enemy-2", "enemy-3"]` (flat static placeholder art from Phase 26/VIS-04) is the array this phase's Hell hound wiring replaces.
- `gates.js`'s "checkpoint math-gate" and the roadmap's "math gate" are the same entity — no separate checkpoint-gate visual to design beyond the math-gate itself.
- Debug overlay convention (`?debug=1`) already renders normally-invisible colliders — this is the exact tool the collider-lock sign-off screenshots (flat floor/platform/ceiling/door) will use.

### Integration Points

- `src/main.js` — where the player/enemy `loadSprite` calls get their new `sliceX`/`anims` config, and where new door/math-gate sprite loads get added (manifest-driven per Phase 32's `ASSETS_MANIFEST` convention — this phase's new assets should be added to `src/assets-manifest.js` too, keeping the "kills the silent-404 class" guarantee intact).
- `src/player.js` — where the fall/land anim-state logic gets added to the existing `player.play(target)` state machine, and where `area({ shape })` gets added to lock the collider.
- `src/levels/build.js` — where the door/math-gate/enemy visual-emission code swaps from static `sprite("door")`/flat-color-box/`CONFIG.ENEMY.SPRITES` to the new animated equivalents. Colliders (`rect()+body({isStatic:true})`) stay byte-unchanged.
- `scripts/build-art-assets.py` — where new `build_door()` (replacing/extending the existing one) and a new `build_math_gate()` bake function get added, following `build_player_swamphunter()`/`build_enemy_hellhound()`'s pattern.
- `scripts/audit-phase21-mechanics.mjs` — the interactive mechanic audit this phase must re-prove still triggers every encounter across all 8 levels after the art swap (roadmap success criterion 4).

</code_context>

<specifics>
## Specific Ideas

No additional specifics beyond the grey-area decisions above — all three areas (Player Animation Wiring, Door/Gate/Math-Gate Art, Enemy Blocker Variety) were accepted as recommended with no free-text overrides.

</specifics>

<deferred>
## Deferred Ideas

- Per-biome enemy variety (swamp thing for swamp levels, ghost for cemetery, spider, etc.) — confirmed available in the source packs but explicitly deferred; a candidate for Phase 35's re-dress pass if wanted, not committed to now.
- Per-biome door/math-gate visual variants — explicitly deferred to Phase 35 (props/re-dress), this phase ships one shared design for each.

</deferred>
