# Architecture Research — v6.0 "SNES-Fidelity World" Integration

**Domain:** Browser 2D platformer (vanilla ES modules + vendored Kaplay 3001.0.19, no build step) — subsequent-milestone integration into a shipped 8-level game
**Researched:** 2026-07-09
**Confidence:** HIGH (every claim below is read from the live tree, the pinned vendored engine source, or the consumed-as-fact v6-scouting pre-work — not from docs or memory). The one MEDIUM item is flagged inline (touch coordinate mapping, needs a probe).

**Scope note:** This is not greenfield research. The existing architecture is documented in `.claude/CLAUDE.md`'s module map and verified here against the tree. This document answers exactly one question: *how do v6.0's features integrate with what exists* — integration points, new vs modified components, data-flow changes, and a dependency-respecting build order.

---

## System Overview — where v6.0 lands

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ENTRY / BOOT                                                               │
│  index.html ──► main.js (kaplay init, sprite manifest, scale, scenes)      │
│   • MODIFIED: sprite loads → data-driven manifest (src/assets-manifest.js) │
│   • MODIFIED: hardcoded scale(1.5) → responsive scale calc                 │
├────────────────────────────────────────────────────────────────────────────┤
│ INPUT                                                                      │
│  player.js (isKeyDown polling) · challenge.js (onKeyPress 1-4 + onClick)   │
│   • NEW: src/input.js touch-intent seam + DOM virtual-button overlay       │
│   • MODIFIED: player.js polls keyboard OR touch intent                     │
├────────────────────────────────────────────────────────────────────────────┤
│ LEVEL DATA (pure, node-importable)                                         │
│  levels/index.js registry ──► levels/level-0N.js descriptors               │
│   • MODIFIED: theme:"theme-N" → biome:"swamp|town|cemetery|castle"         │
│   • NEW descriptor keys: movers[], patrols[], props[]                      │
│   • DELETED keys: collectZones[], answerPickupSlots[]                      │
├────────────────────────────────────────────────────────────────────────────┤
│ WORLD CONSTRUCTION (the ONE builder)                                       │
│  levels/build.js                                                           │
│   • MODIFIED: pickTopFrame → real autotiler (NEW pure module               │
│     src/levels/autotile.js) + chunked {tiled:true} interior fill           │
│   • NEW blocks: movers (sine onUpdate + native stickToPlatform carry),     │
│     patrols (built-in patrol()), props (sprite-only, no area/body)         │
│   • DELETED blocks: collectZones, answerPickupSlots                        │
├────────────────────────────────────────────────────────────────────────────┤
│ SCENE / MECHANICS                                                          │
│  scenes/game.js ── mechanics/{door,gates,enemy,secretAlcove}.js            │
│   • DELETED: mechanics/collect.js + wireCollect call                       │
│   • MODIFIED: secretAlcove.js gains discovery feedback cue                 │
│   • NEW wiring: player.onCollide("patrol-hazard", respawn) — spike class   │
│   • MODIFIED: player.js anim states idle/run/jump → +fall/land;            │
│     collider stays EXACTLY 16×32 (calibration-locked, see Anti-Pattern 4)  │
├────────────────────────────────────────────────────────────────────────────┤
│ VERIFICATION (scripts/, no framework — the shell gates ARE the suite)      │
│  validate-levels.mjs ── lib/{reachability,over-hole-check}.mjs             │
│   • MODIFIED: reachability learns movers (worst-case-extreme rule) +       │
│     NEW alcove point-reachability check                                    │
│   • MODIFIED: over-hole-check + BARRIER_WIDTH drop collectZones            │
│  lib/mechanic-drive.mjs (deriveEncounters) · browser-boot · audit          │
│   • MODIFIED: drop collectZones encounters; NEW alcove detection path      │
│     (tagged-entity destroy + XP delta — NOT the challenge-open signal)     │
│  check-gate.sh check 13 asserts collect.js EXISTS — must be updated or     │
│  the gate goes RED the moment collect is removed (deliberate, see §4)      │
└────────────────────────────────────────────────────────────────────────────┘
```

Everything above sits on facts already proven: the visual/collider split exists everywhere (merged colliders + separate visual tiles), levels are pure data through one builder, and the spike findings (`.planning/research/v6-scouting/SPIKE-FINDINGS.md`) proved the three risky engine idioms against the pinned engine in a real browser.

---

## 1. Autotiler, biome threading, and the sprite manifest (ART-01/02/03)

### Where it lands

**`build.js` terrain rendering is the only rendering change site; colliders are untouched.** Today `pickTopFrame(tx, runX, runW)` picks 1 of 5 frames per top-surface tile by horizontal run position (`src/levels/build.js:81-88`), drawn as visual-only sprites over the merged colliders. The v6 replacement (spike-proven recipe):

- **NEW pure module `src/levels/autotile.js`** — builds an occupancy `Set` from `g.floors` + `g.platforms` on the 16px grid, exposes `pickFrame(tx, ty, occupancy)` (no-tile-above → cap left/mid/right/single; else fill edge/interior). Zero engine globals → node-importable → unit-testable with the project's `check(cond,msg)` self-test idiom, same as `reachability.mjs`. The spike's `pickFrame` in `spike-code/main.js` is port-ready.
- **`buildLevel()` consumes it**: cap row + edges as per-tile `sprite("terrain-<biome>", { frame })`; interior fill as **chunked `sprite("fill-<biome>", { tiled: true, width, height })`, ≤ ~40 columns per chunk** — the spike's hard object-count lesson (one giant tiled quad *silently renders nothing*; naive per-tile fill hits a 15fps cliff at ~5k objects; the chunked recipe measured 58fps at 5,600 tiles / 410 objects).
- Budget: per-tile sprite count stays O(level-width/16) — a 6,200px level ≈ ~400 cap tiles + ~20 fill chunks, well inside the measured envelope.

### Biome field threading

The `theme: "theme-N"` field already threads exactly the path a biome field needs: descriptor → `game.js` → `buildLevel()` ground-sprite template + `makeParallaxLayers(bounds, theme)` layer-name template (`parallax.js:61`). Recommendation:

- **Add a `biome` field** (`"swamp" | "town" | "cemetery" | "castle"` per ASSET-SCOUTING's locked mapping: levels 1–2 swamp, 3–4 town, 5–6 cemetery, 7–8 castle) rather than overloading `theme` with new values — the sprite-name templates and asset shapes differ (a biome has an atlas + fill + N bg layers, not a 5-frame tinted strip). Keep the existing `theme` fallback path alive during the transition (both `build.js` and `parallax.js` already default gracefully when the field is unset — the never-brick convention), then delete `theme` + the 24 baked `*-theme-N` assets in the final cleanup of the re-dress phase.
- `parallax.js` needs a **per-biome layer count** (biomes ship 2–3 loopable layers plus a sky, not always exactly 3) — generalize `makeParallaxLayers` to build from a per-biome layer descriptor list (name, ratio, z, y) held in `CONFIG` or the manifest, instead of the hardcoded far/mid/near triple.

### Sprite manifest scaling

`main.js` currently registers ~40 sprites inline including an 8-iteration theme loop (`main.js:103-110`). With 3–4 biomes × (terrain atlas + fill + bg layers) + animated player + animated entities + props + patrol enemies, this roughly doubles and gains per-sprite slice/anim options. Recommendation:

- **NEW `src/assets-manifest.js`** — pure data: `export const MANIFEST = [{ name, path, opts }, ...]` (plus sounds). `main.js` loops it after `kaplay()` init (a727c13-safe: the *data* is top-level, the `loadSprite` calls stay in main.js post-init).
- **Payoff beyond tidiness:** a pure-data manifest is node-importable, enabling a cheap new static gate — assert every manifest path exists on disk (kills the documented "wrong path is a SILENT 404" Pitfall 1 class) and every sprite name a level's `biome` implies is present in the manifest. Same shape as `validate-levels.mjs`.

### Asset pipeline

`scripts/build-art-assets.py` (Pillow) shifts from *generating* art to *conforming* sourced art: cutting clean modular per-biome atlases from the non-uniform Gothicvania sheets (spike: terrain comes as ~32px decorative blocks; the real atlas likely wants 16×32 cap tiles), hue-shifting the two flagged pink/magenta skies (town, cemetery — the style-board renders already proved this pass works), and running the no-pink check. Licenses via the existing `assets/LICENSES/` + `CREDITS.md` pattern (all Gothicvania packs verified CC0; do NOT vendor the CC-BY music inside the zips).

---

## 2. Moving platforms + patrol enemies: schema, builder, validator (MOT-01/02)

### Descriptor schema (pure data, additive)

```js
// geometry additions — all ?? []-guarded in build.js like every optional key
movers: [
  { x, y, w, h, axis: "x"|"y", amplitude, periodS }   // dt-based sine, spike idiom
],
patrols: [
  { x, y, waypoints: [{x,y},...], speed, sprite, endBehavior: "ping-pong" }
],
props: [
  { sprite, x, y, anim? }                              // visual-only, validator-neutral
],
```

### Builder (`build.js`)

- **Movers:** `add([sprite(...), pos(x0,y0), area(), body({ isStatic: true }), "mover"])` with an `onUpdate` mutating `pos` via the dt-accumulated sine — the exact port-ready idiom from SPIKE-FINDINGS. **Write NO carry code**: Kaplay 3001's `body()` carries riders natively (`stickToPlatform`, default on); the spike proved manual delta-carry is a rider-slides-off-in-<1s anti-pattern (4.2% mounted vs 100%).
- **Patrols:** built-in `patrol({ waypoints, speed, endBehavior })` component — dt-based `moveTo` in `update()`, no timers. Tag **`"patrol-hazard"`, deliberately distinct from `"enemy"`** (the stationary math-blocker tag `enemy.js` listens for). One new line in `game.js`: `player.onCollide("patrol-hazard", () => respawn())` — the existing spike hazard class (checkpoint respawn, ADHD-safe, no new failure construct).
- Tunables (default amplitude/period/speed, mover sprite sizes) go in `CONFIG` per the all-tunables rule.
- `check-safety.sh` note: `endBehavior: "ping-pong"` avoids even the cosmetic string `"loop"`; if `"loop"` is ever used it's a string literal, not the banned `loop(` scheduler call — the grep matches call syntax, but expect review when it lands in `src/` (the spike itself flagged this).

### Validator (`scripts/lib/reachability.mjs`) — must learn movers BEFORE any level uses them

`buildNodes()` today emits one node per floor run and platform (static x-span + y). Movers break the static assumption. The sound extension, per the spike's validator note:

- **Worst-case-extreme rule (recommended default):** a mover contributes a node whose edges are validated at the extreme *least favorable* for each hop — inbound edges use the mover position farthest from the source node; outbound edges use the position farthest from the target. If reachability holds at the worst case it holds at every phase. This is *conservative* (a patient player can also time the favorable extreme), which is the correct direction for a gate: no false PASS is possible, and level authors simply place movers with margin. Implementation: for axis "x", the node is `{ xStart: x0-amp … xEnd: x0+amp+w }` evaluated per-edge at the worst sub-extreme; for axis "y", evaluate `canReach` at both `y0±amp` and take the worse result. Keep it a pure function extension + new self-test cases + a RED-first fixture (`scripts/fixtures/`) proving a mover placed just past worst-case reach HARD-FAILs — the Phase 23 proven-RED-first pattern.
- `over-hole-check.mjs` is unaffected (movers aren't floor-run-supported barriers), but the mover's **rest footprint must not be treated as a floor run** — it's a new node kind, not a floor.

### Interactive audit harness — the riskiest script work in the milestone

`driveToXPlanned` (`scripts/lib/mechanic-drive.mjs`) plans takeoffs from *static* geometry via `route-planner.mjs`. A mover on the critical path to a math mechanic would defeat the planner (takeoff x/y valid only at some phases). Two-tier mitigation:

1. **Placement policy (cheap, do first):** place movers in re-dressed/new sections that are not *between spawn and any math mechanic* wherever possible — the audit's `triggered` proof never has to cross one. The validator still proves goal reachability across the mover statically (worst-case rule).
2. **Driver extension (only if a level design demands a mover before a mechanic):** a "wait-and-mount" primitive — poll the mover's live position via `page.evaluate`, jump when it enters the fire window. Real work; budget it consciously or design around it.

Playwright-script duplication rule applies: any shared fix lands identically by hand in `browser-boot.mjs` and `audit-phase21-mechanics.mjs` — do not extract a module.

---

## 3. Touch input layer + responsive canvas (SEED-002)

### Verified engine facts (read from the vendored `lib/kaplay.mjs`, pinned 3001.0.19)

- The engine ships `onTouchStart/onTouchMove/onTouchEnd`, `isTouchscreen()`, and `touchToMouse` (default ON — first touch synthesizes `mousePos`, mouse-press/release, and mouseMove events).
- **Coordinate-mapping trap, confirmed in source:** the mouse handler reads `event.offsetX/offsetY` — computed in the element's *untransformed layout box*, which is why the shipped `transform: scale(1.5)` is safe for mouse at any factor (main.js's documented invariant). The **touch handler computes `clientX - canvas.getBoundingClientRect().x`** — and `getBoundingClientRect()` returns the *transformed (visually scaled)* box. Under `scale(1.5)`, touch positions come out in visual pixels (0..960 across a 640-wide world) while the engine expects content pixels (0..640): **every in-canvas tap lands at ~1.5× its intended coordinate.** The two input paths structurally disagree under a CSS transform. *(Confidence: MEDIUM-HIGH — read from minified source; the exact interaction with the internal `windowToContent` mapping must be confirmed by a probe before building on it.)*

### Consequences for the architecture

1. **Virtual movement/jump buttons must be a DOM overlay, not in-canvas Kaplay entities.** Three independent reasons: (a) DOM elements are immune to the canvas coordinate-mapping problem entirely; (b) `go()` clears per-scene Kaplay input handlers on every transition — in-canvas buttons would need re-creation and re-wiring in every scene, whereas DOM listeners persist app-wide (the same reason `audio.js` re-wires per scene is a known cost, not a pattern to copy); (c) at 640×360 internal resolution, thumb-sized in-canvas buttons would eat a huge fraction of the play area — DOM buttons live in *screen* pixels, sized for thumbs, positioned in the letterbox margins.
2. **In-canvas taps (answer boxes, level-select tiles, mute icon, "click to start") ride `touchToMouse` + the existing `onClick` paths — no per-target touch code — BUT only after the scale mechanism is fixed** so touch coordinates map correctly. This is why responsive scale must land before (or with) touch, not after.
3. **Responsive scale replaces the hardcoded `scale(1.5)` block in `main.js:47-50`.** For mouse, a computed CSS transform (`scale = min(innerW/640, innerH/360)`, re-derived on `resize`) is a straight generalization of the shipped, documented-safe mechanism. For touch, two candidate fixes, to be settled by a small probe (Playwright touch emulation drives this cheaply, in the project's spike tradition):
   - **Candidate A — viewport-meta scaling on touch devices:** keep the canvas at its native 640×360 CSS layout size with *no* transform, and set the viewport meta (`width=640`) so the browser scales the whole page uniformly. Browser-zoom scaling keeps `clientX`, `getBoundingClientRect`, *and* `offsetX` in the same CSS-pixel space — both input paths stay consistent by construction. Desktop is untouched (desktop browsers ignore viewport meta) and keeps the transform path.
   - **Candidate B — uniform transform + engine-side verification:** keep one responsive transform everywhere and *prove* (probe) whether taps mis-map; if they do, A wins by default. **Never patch the vendored engine** — it is pinned and byte-verified.

### New/modified components

- **NEW `src/input.js`** — the touch-intent seam: module-level idempotent manager (the `audio.js` precedent — device/input state is app-level, not run state, so the closure-local rule doesn't apply) exposing `intent.left/right/jump` booleans driven by DOM `touchstart/touchend` on the overlay buttons. Buttons render only when `isTouchscreen()` (engine global, checked post-init) or on first touch event. Includes touch mute/reset affordances (M-key and R-key equivalents).
- **MODIFIED `src/player.js`** — the movement poll becomes `isKeyDown("left") || input.intent.left` (etc.); the jump press-edge needs an equivalent intent edge (input.js fires the same buffer-write path the key handler uses, respecting the `player.paused` guard). Keyboard stays primary; the touch path is additive.
- **MODIFIED `src/index.html` + `main.js`** — overlay container markup/CSS + responsive scale computation; the flex-centering + transform-origin reasoning documented in both files carries over.
- `challenge.js`, `select.js`, `title.js` need **zero touch-specific code** if `touchToMouse` + fixed mapping is confirmed — their `onClick` paths already exist. Verify tap-target sizes at sign-off (answer boxes are 84×44 internal px → ~thumb-sized once scaled).

---

## 4. Collect-the-answer removal (backlog 999.1) — exact blast radius

Verified by grep across the tree. **Delete:**

| Site | What |
|------|------|
| `src/mechanics/collect.js` | entire module |
| `src/scenes/game.js` | import + `wireCollect({ player, brain })` call |
| `src/levels/build.js` | the collectZones + answerPickupSlots builder blocks (tags `"answer-zone"`, `"answer-pickup-slot"`) |
| `src/config.js` | `CONFIG.COLLECT` block |
| `src/levels/level-0{1..8}.js` | `collectZones` + `answerPickupSlots` keys — **real entries in 01, 03, 04, 06, 08; empty arrays in 02, 05, 07** — remove the keys everywhere |
| `scripts/lib/mechanic-drive.mjs` | `collectZones` line in `deriveEncounters()`; the `renderChoices:false` branch of `resolveIfBoxed()` becomes dead (all remaining mechanics render choices) |
| `scripts/lib/reachability.mjs` + `over-hole-check.mjs` | `collectZones` entries in `BARRIER_WIDTH` maps and kind loops |
| `scripts/check-gate.sh` | **check 13 asserts `src/mechanics/collect.js` EXISTS and calls `openChallenge`** — the gate goes RED the moment the file is deleted. Update the gate in the same commit (this is the gate doing its job, not an accident — sequence it deliberately) |
| `scripts/fixtures/bad-level.js`, `smoke-progress.mjs`, `audit-phase21-mechanics.mjs`, `screenshot-phase26.mjs` | residual references — sweep and update |

**Simplification dividend in `challenge.js`:** collect was the *only* caller of `renderChoices:false`, the `prompt` override, and the caller-supplied `question` param, and it is the *only* mechanic that leaves a challenge open while the player roams — the sole reason max concurrent-open depth was 2. With collect gone: those three params can be removed, the prior-challenge hide/restore snapshot (the 21-06 fix) becomes dead code, and the audit's `resolveIfBoxed` baseline-vs-absolute complexity (CR-01) loses its motivating case. Keep the per-instance `instanceTag` teardown (harmless, defensive); remove the now-dead branches — but treat this as its own reviewed task, since `challenge.js` is the ONE shared seam every remaining mechanic routes through.

**Rebalance (the actual design work):** levels 01/03/04/06/08 each lose one math encounter. The removed zone's floor position is already validated reachable, so the cheapest rebalance is converting the slot to a `mathGate` or `enemy` **where pacing needs it** — a per-level judgment made in the mechanic-cleanup phase, *before* re-dress, so no content gets dressed that's about to move. The `"pickup"` SFX becomes orphaned (collect.js was its only `playSfx` call site) — reuse it as the alcove discovery cue (§5) rather than deleting the asset.

---

## 5. Secret alcove: feedback cue + automated coverage

Two halves, per the pending todo's analysis (consumed here, not re-derived):

**Discovery cue (design):** `secretAlcove.js` today destroys the alcove, bumps XP, refreshes the HUD — visually near-silent. Add at the touch site: an `fx.js` self-cleaning burst/pop at the alcove position + a small "+5 XP" style text transient (tween().onEnd(destroy) idiom, no timers) + the newly-orphaned `"pickup"` SFX. All within the existing contract: never pauses, never opens a challenge, fire-once per alcove object.

**Trigger coverage (new detection path):** the harness's `triggered` signal is defined as "challenge count rose" — contractually *always false* for alcoves (they never open the panel), which is why Phase 25's code-fixer correctly refused to wire them into `deriveEncounters()` as-is. The clean signal is already built into the mechanic: **the alcove entity is `destroy()`ed on touch.** Detection path: drive to the alcove's coordinates, assert `get("secret-alcove").length` decreased (belt-and-braces: XP delta via the HUD/progress state before/after). Implementation shape: a distinct encounter kind in `deriveEncounters()` carrying its own `detect: "entity-destroy"` discriminator (not the boolean `renderChoices`), or a separate per-level alcove pass in the two harness scripts — either way the false-negative trap the todo documents is avoided because the signal is no longer the challenge count. Note alcoves usually sit *above* the walk path (launch-platform jumps), so the drive needs a planned jump at the alcove x — `route-planner` mount takeoffs already exist for platforms; the alcove's launch platform is a normal geometry node.

**Reachability coverage (validator):** alcoves float in open space with no floor-run association, so the barrier x-span check can't apply. Of the todo's two options, prefer the **schema-neutral standalone point-vs-jump-reach check** over adding a launch-node reference to all 8 descriptors: for each alcove, PASS iff there exists a spawn-BFS-reachable node from which the alcove's AABB is inside the calibrated jump arc (reuse `jumpReach(dy, envelope)` with dy = alcove-y vs node-y and the horizontal-span containment logic `canReach` already implements — the alcove is a degenerate 24px-wide "toNode"). New check row `alcove-reachability` in `checkLevelReachability`, with self-test cases + a RED-first fixture (an alcove above maxRise from every node must HARD-FAIL).

Sequencing note: PROJECT.md keeps the alcove (cue + coverage) — the "reconsider the mechanic" question was resolved at kickoff in favor of improving it, so this coverage work is no longer conditional.

---

## 6. Player + entity animation (ART-04/05) — the one physics-adjacent art change

- `player.js`'s anim state machine currently maps airborne → single `jump` frame. Extend to `idle/run/jump/fall/land`: fall = airborne with `vel.y > 0` (Kaplay Y-down); land = transient one-shot on the existing `onGround()` hook (which already drives squash/dust — the anim and fx coexist). New frames/anims register in the manifest.
- **The collider must remain exactly 16×32.** The Gothicvania player candidates are ~40–48px tall; render the larger sprite with an explicit `area({ shape: new Rect(...) })` sized 16×32 and anchored so feet align — today `area()` derives from the sprite footprint, so a naive sprite swap *silently changes the physics body*. This is not cosmetic: the empirically calibrated jump envelope (`scripts/lib/jump-envelope.mjs`), every validator verdict, the route-planner's takeoff math, and the kid-validated feel all assume the 16×32 body. Changing it forces full recalibration. The style-board phase must also verify visual clipping on low ceilings (scouting flag).
- Mechanic entities: the door already renders as a sprite; the math gate loses its grey rect + "?" glyph for real art; enemy panels gain idle anims. **The invisible apex-derived tall blockers (the actual colliders) are untouched** — only the cosmetic panels change, exactly the split `build.js` already maintains.

---

## Component Change Summary

| Component | Status | Change |
|-----------|--------|--------|
| `src/levels/autotile.js` | **NEW** | pure occupancy-set autotiler (node-importable, self-tested) |
| `src/assets-manifest.js` | **NEW** | pure-data sprite/sound load list + static existence gate |
| `src/input.js` | **NEW** | touch-intent seam + DOM virtual-button overlay manager |
| `src/levels/build.js` | MODIFIED | autotile consumption, chunked fill, movers/patrols/props blocks; collect blocks deleted |
| `src/main.js` | MODIFIED | manifest-driven loads; responsive scale replaces hardcoded 1.5× |
| `src/index.html` | MODIFIED | touch overlay markup/CSS; possibly viewport-meta strategy |
| `src/player.js` | MODIFIED | touch-intent polling; fall/land anims; explicit 16×32 area shape |
| `src/parallax.js` | MODIFIED | per-biome layer descriptor list (variable layer count) |
| `src/levels/level-0N.js` ×8 | MODIFIED | `biome` field; movers/patrols/props where placed; collect keys deleted; quality-pass fixes (levels 5–8 pickups/ledges, 07/08 climb differentiation) — geometry otherwise preserved |
| `src/mechanics/secretAlcove.js` | MODIFIED | discovery cue (fx + SFX + XP text transient) |
| `src/scenes/game.js` | MODIFIED | drop wireCollect; add patrol-hazard respawn wiring |
| `src/ui/challenge.js` | MODIFIED | remove collect-only params/branches (reviewed simplification of the ONE seam) |
| `src/config.js` | MODIFIED | drop COLLECT; add MOVER/PATROL/PROPS/TOUCH tunables + biome layer specs |
| `src/mechanics/collect.js` | **DELETED** | with full blast-radius sweep (§4 table) |
| `scripts/lib/reachability.mjs` | MODIFIED | mover worst-case nodes; alcove point-reachability; drop collectZones |
| `scripts/lib/over-hole-check.mjs` | MODIFIED | drop collectZones |
| `scripts/lib/mechanic-drive.mjs` | MODIFIED | drop collect encounters; alcove entity-destroy detection; (only if needed) mover wait-and-mount |
| `scripts/check-gate.sh` | MODIFIED | replace check 13 (collect existence) with the inverse (collect absent) |
| `scripts/build-art-assets.py` | MODIFIED | generate → palette-conform/atlas-cut sourced art (no-pink pass) |
| `scripts/browser-boot.mjs` / `audit-phase21-mechanics.mjs` | MODIFIED | inherit mechanic-drive changes (duplicated by hand, per convention) |

## Data-Flow Changes

1. **Biome art flow (new):** sourced packs → Pillow conform/atlas bake → `assets/<biome>/` → manifest → `main.js` loads → descriptor `biome` field → `buildLevel` sprite-name templates + `makeParallaxLayers` layer specs. One-directional, data-driven end to end; the existence gate closes the silent-404 hole.
2. **Motion flow (new):** descriptor `movers`/`patrols` → `buildLevel` entities (engine-native carry/patrol) → `game.js` wires only the patrol-hazard respawn. No new state crosses scenes; all motion is `dt`/`onUpdate`-driven (no timers).
3. **Input flow (widened):** DOM touch overlay → `input.js` intent → `player.js` poll (parallel to `isKeyDown`); canvas taps → `touchToMouse` → existing `onClick` paths. Persistence, math seam, and save flow are completely untouched by this milestone.
4. **Verification flow (widened):** validator gains two check kinds (mover extremes, alcove reach); harness gains one detection kind (entity-destroy); both keep the exact per-row PASS/WARN/HARD-FAIL and `triggered` reporting shapes so downstream consumers (`check-progress.sh`, milestone audits) read them unchanged.

---

## Suggested Build Order

Dependencies that force the order: **style-board sign-off gates all art integration** (SEED-001's make-or-break phase); **mechanic decisions precede re-dress** (PROJECT.md: no content gets dressed that's about to change); **the validator learns movers before any level carries one** (quality gate); **responsive scale precedes/accompanies touch** (§3 coordinate trap).

1. **Mechanic cleanup** — collect removal (full §4 sweep, gate update sequenced with the delete, per-level rebalance decisions) + alcove cue + alcove trigger/reachability coverage. No art dependency; unblocks all content work; ships the challenge.js simplification while the seam is quiet.
2. **Art foundation + style-board sign-off** — vendor Gothicvania packs (licenses/CREDITS), Pillow conform pass (pink-sky retints, no-pink check), cut per-biome modular atlases, player-candidate choice, **human sign-off checkpoint before any integration**. Can start in parallel with 1 (disjoint files); nothing downstream of it may start before sign-off.
3. **Validator + harness extensions** — mover worst-case nodes + RED-first fixtures; (deferred-unless-needed) driver wait-and-mount. Pure scripts work; parallel-safe with 2; must be green before 6 places any mover.
4. **Terrain + parallax rendering** — `autotile.js`, chunked fill in `build.js`, `biome` threading, data-driven manifest + existence gate, per-biome parallax. Needs 2's atlases. Geometry untouched → validator green trivially.
5. **Player + entity animation** — player sprite swap with the locked 16×32 hitbox, fall/land states, math-gate/door/enemy real art. Needs 2; independent of 4 (can overlap).
6. **World motion + props + level re-dress/quality pass** — movers/patrols/ambient anims placed in re-dressed sections (never inside kid-validated geometry), props layer, levels 5–8 pickup/ledge fixes, 07/08 climb differentiation, LEVEL-DESIGN.md soft-rules review, theme-asset deletion. Needs 3 (validator) + 4/5 (art in place). Interactive audit + human sign-off on new hazard placement.
7. **Mobile: responsive scale + touch layer** — coordinate-mapping probe FIRST (settles §3 Candidate A vs B), then `input.js` + overlay + player poll + tap-target verification. Independent of the art track — can run in parallel any time after 1; land before 8 so closing verification covers it.
8. **n0x logo + closing verification** — logo treatment under the Phase 26 sign-off standard; consolidated gate suite; live Dokploy URL playthrough (open since v3.0); kid-UAT live sign-off (open since v4.0); MOVE-05 non-60Hz feel check (mobile devices make this newly real).

---

## Anti-Patterns (all empirically grounded)

1. **Manual rider-carry on moving platforms** — double-applies over the engine's native `stickToPlatform`; the spike measured the rider sliding off in under a second (4.2% frames mounted vs 100% native). Platforms mutate `pos` only; zero rider code.
2. **One giant `{tiled:true}` quad, or naive per-tile fill** — the giant quad *silently renders nothing* (vertex-batch ceiling; the spike's first "win" was an invisible fill caught only by screenshot); per-tile fill cliffs to 15fps at ~5k objects and `offscreen({hide})` culling does NOT rescue it (update overhead dominates). Chunk fills ≤ ~40 columns per object; screenshot-verify the render.
3. **In-canvas virtual buttons / trusting touch under the CSS transform** — the engine's touch origin (`getBoundingClientRect`) and mouse origin (`offsetX`) live in different coordinate spaces under `transform: scale()`; per-scene Kaplay handlers also die on every `go()`. DOM overlay + a probed scale mechanism instead. Never patch the vendored engine.
4. **Letting the sprite swap resize the player collider** — bare `area()` derives from the sprite footprint; a 48px-tall sprite silently grows the physics body, invalidating the calibrated jump envelope, every validator verdict, and kid-validated feel. Pin `area({ shape })` to 16×32 explicitly.
5. **Re-dressing by rebuilding** — kid-validated level geometry is re-dressed (visual pass over identical floors/platforms), never re-authored; new movers/patrols go in appended or re-dressed sections only. Extending a `bounds`-carrying level still requires the by-hand `bounds.right` bump.
6. **Deleting collect without updating the gate in the same change** — `check-gate.sh` check 13 hard-fails on the file's absence; sequence the gate edit with the removal so the suite is never red across a commit boundary for a known reason.

## Open Questions / Gaps

- **Touch mapping probe (MEDIUM confidence item):** confirm the §3 coordinate analysis empirically (Playwright touch emulation) before choosing viewport-meta vs transform strategy — first task of the mobile phase.
- **Mover-before-mechanic audit support:** only needed if level design places a mover on a math-mechanic approach path; decide during phase 6 planning (placement policy is the cheap out).
- **Per-biome parallax layer counts/ratios:** exact layer specs per pack are an implementation detail settled when the assets are cut (phase 2/4), not an architecture question.
- **`resolveIfBoxed`/`warmupUntilFirstGap` residue:** both exist substantially because of collect; after removal, review whether the audit callers still need the warmup flag (its rationale — "collect zones are always the first encounter" — dies with the mechanic).

## Sources

- Live tree reads (2026-07-09): `src/levels/build.js`, `src/main.js`, `src/index.html`, `src/player.js`, `src/parallax.js`, `src/scenes/game.js`, `src/ui/challenge.js`, `src/mechanics/collect.js`, `src/mechanics/secretAlcove.js`, `src/levels/level-01..08.js`, `src/config.js`, `scripts/validate-levels.mjs`, `scripts/lib/reachability.mjs`, `scripts/lib/mechanic-drive.mjs`, `scripts/lib/over-hole-check.mjs`, `scripts/check-gate.sh`
- Vendored engine source read: `lib/kaplay.mjs` (pinned 3001.0.19) — touch/mouse coordinate paths, `touchToMouse`, `isTouchscreen`, letterbox branches
- Consumed as verified fact (per milestone directive): `.planning/research/v6-scouting/SPIKE-FINDINGS.md` (2026-07-08 real-browser measurements), `.planning/research/v6-scouting/ASSET-SCOUTING.md` (2026-07-07 license-verified scouting + style boards)
- Context: `.planning/PROJECT.md` (v6.0 milestone scope + locked decisions), `.planning/seeds/SEED-001-v6-snes-fidelity-world-overhaul.md`, `.planning/todos/pending/2026-07-07-add-automated-coverage-for-secretalcove-mechanic.md`, `.claude/CLAUDE.md` module map + binding rules

---
*Architecture research for: Nox Run v6.0 "SNES-Fidelity World" (subsequent-milestone integration)*
*Researched: 2026-07-09*
