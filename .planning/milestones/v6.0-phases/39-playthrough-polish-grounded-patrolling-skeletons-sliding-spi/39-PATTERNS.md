# Phase 39: Playthrough Polish (grounded patrolling skeletons, sliding spikes) - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** ~18 (5 requirement groups × builder/config/level-data/harness/bake)
**Analogs found:** 5 / 5 requirements — every requirement has an in-repo analog (no greenfield code)

> Vanilla-JS + Kaplay platformer, no build step. All excerpts obey the binding rules:
> a727c13 (no engine globals at module top level), SAFE-01 (no timers/schedulers —
> `onUpdate` + `dt()` or `tween().onEnd()` only), tunables in `src/config.js`, levels are
> pure data built by the ONE builder `src/levels/build.js`.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/levels/build.js` (POL-01 tuning) | builder | event-driven (onCollide→respawn) | patroller factory `build.js:580-595` (self) | in-place edit |
| `src/levels/level-0N.js` × up to 8 (POL-01 waypoints) | level-data | data | `level-01.js:233-246` patrollers block | exact |
| `src/levels/build.js` (POL-02 sliding-spike factory) | builder | event-driven + transform | mover loop `build.js:543-570` + spike loop `build.js:250-260` | role+flow match (compose) |
| `src/config.js` (POL-02 tunables) | config | data | `CONFIG.MOVER` `config.js:279-286` + `CONFIG.SPIKE_*` `config.js:156-158` | exact |
| `src/levels/level-0N.js` (POL-02 slidingSpikes key) | level-data | data | `geometry.movers` in `level-08.js:322-334` | exact |
| `scripts/lib/mechanic-drive.mjs` + `reachability.mjs` (POL-02 harness) | test-harness | transform | `deriveEncounters` `mechanic-drive.mjs:43-60` + spike fire `:415/:650` | role match |
| `src/levels/level-0N.js` (POL-03 mover re-placement) | level-data | data | `level-08.js:322-334` movers + BARBICAN platforms `:111-126` | exact |
| `scripts/browser-boot.mjs` + `audit-phase21-mechanics.mjs` (POL-03 ride) | test-harness | event-driven | `driveAndDetectMover` `mechanic-drive.mjs:844+` | exact (audit); new (boot) |
| `src/levels/build.js` (POL-04 solid-prop branch) | builder | request-response (static collider) | prop loop `build.js:492-528` + floor collider `build.js:204-234` | role+flow match (compose) |
| `scripts/build-art-assets.py` (POL-05 lantern bake) | asset-bake | file-I/O | `bake_prop("cemetery-lantern",…)` `build-art-assets.py:1608` | exact |
| `src/levels/level-01.js` + `level-02.js` (POL-05 lantern swap) | level-data | data | `level-01.js:287` / `level-02.js:377` (self) | in-place edit |
| `src/levels/level-03.js` (POL-05 well move) | level-data | data | `level-03.js:265` (self) | in-place edit |
| `src/levels/level-08.js` (POL-05 column reposition) | level-data | data | `level-08.js:374-376` (self) | in-place edit |

---

## Pattern Assignments

### POL-01 — Skeletons (patrollers) → ground patrol

**What changes:** NO new code. The `patrol()` component already works (`build.js:580-595`). This is
a **level-data waypoint retune** across up to 8 descriptors + optional config tuning. Current
placements all hover at `y:214`; lower feet to `FLOOR_Y`, widen/speed the sweep, shift x off floor coins.

**Analog — the patroller factory** (`src/levels/build.js:580-595`, leave AS-IS unless retuning defaults):
```javascript
for (const p of g.patrollers ?? []) {
  const foe = add([
    sprite(p.sprite ?? CONFIG.PATROLLER.SPRITE),
    pos(p.x1, p.y1),
    area(),
    patrol({
      // FRESH per-patroller waypoints array literal — "ping-pong" reverses it in place.
      waypoints: [vec2(p.x1, p.y1), vec2(p.x2, p.y2)],
      speed: p.speed ?? CONFIG.PATROLLER.SPEED,
      endBehavior: "ping-pong",
    }),
    "patroller", // DISTINCT from "enemy" — routes to respawn(), never the math seam
  ]);
  foe.play("walk");
}
```

**The data to edit** — each level's `geometry.patrollers` block. Analog (`level-01.js:245`):
```javascript
patrollers: [
  { x1: 1770, y1: 214, x2: 1880, y2: 214 },  // ← lower y1/y2 to ground the feet; widen x2-x1; shift x
],
```
Skeleton frame is 44×52 (CONTEXT). To sit feet on `FLOOR_Y` (320), waypoint `y ≈ 320 - 52 = 268`
(verify against sprite anchor). Per-patroller `speed` override is available (default
`CONFIG.PATROLLER.SPEED = 40`, `config.js:296`) — bump for a visible sweep.

**All placement sites (CONTEXT-verified, all currently y:214):**
- L1 `level-01.js:245` (1770–1880) · L2 `level-02.js:323,329` (900–1000, 4560–4660)
- L3 `level-03.js:238` (1780–1960) · L4 `level-04.js:239,245` (460–560, 3200–3300)
- L5 `level-05.js:214` (1150–1250) · L6 `level-06.js:217,221` (1900–2020, 2470–2560)
- L7 `level-07.js:207` (450–550) · L8 `level-08.js:346,350` (960–1060, 3560–3660)

**Contact seam (already wired, DO NOT touch)** — `src/scenes/game.js:277`:
```javascript
player.onCollide("patroller", () => respawn());
```

**Frozen-geometry:** `geometry.patrollers` is EXEMPT — edit freely, no `--write`.
**Clearability constraint (CONTEXT):** a grounded skeleton across a walk-lane genuinely blocks. The
walk-only `browser-boot` driver (which never times a window) must still cross — leave a passing gap
or keep the lane walkable. This is exactly why they were originally hovered; grounding them may
force a `browser-boot` retune (see POL-03 harness note).

---

### POL-02 — Sliding spikes (NEW mechanic, controller+transform)

**No moving-spike code exists.** Build it by **composing two existing analogs**: the spike sprite +
tightened `area()` (`build.js:250-260`) and the mover raised-cosine oscillation (`build.js:543-570`).

**Analog A — the spike entity (tag + tightened hitbox)** `src/levels/build.js:243-260`:
```javascript
const spikeOffX = (CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_W) / 2; // center horizontally
const spikeOffY = CONFIG.SPIKE_SIZE - CONFIG.SPIKE_HITBOX_H;       // drop to the lower points
for (const s of g.spikes) {
  add([
    sprite("spike"),
    pos(s.x, s.y),
    area({
      shape: new Rect(vec2(0), CONFIG.SPIKE_HITBOX_W, CONFIG.SPIKE_HITBOX_H),
      offset: vec2(spikeOffX, spikeOffY),
    }),
    "spike",
  ]);
}
```

**Analog B — the mover oscillation** `src/levels/build.js:543-570` (THE pattern to copy for motion):
```javascript
for (const m of g.movers ?? []) {
  const w = m.w ?? CONFIG.MOVER.WIDTH;
  const plat = add([ /* sprite + area + body({isStatic:true}) + "mover" */ ]);
  const period = m.period ?? CONFIG.MOVER.PERIOD_S;
  let t = 0; // closure-local PER entity — never module-level (anti-leak)
  plat.onUpdate(() => {
    t += dt();                                                   // dt-based, scheduler-free (SAFE-01)
    const phase = (1 - Math.cos(((2 * Math.PI) / period) * t)) / 2; // raised-cosine 0→1→0
    plat.pos.x = m.x1 + (m.x2 - m.x1) * phase;
    plat.pos.y = m.y1 + (m.y2 - m.y1) * phase;
  });
}
```

**Composed target — a `slidingSpike` loop** = Analog A's spike sprite + tightened `area()` tagged
`"spike"` (routes to the EXISTING respawn seam at `game.js:269`, ZERO new game.js wiring) + Analog B's
`onUpdate`/`dt()` raised-cosine. NO `body()` (a spike is a hazard trigger, not a standable ledge — that
is the ONE structural difference from a mover). CRITICAL: `area()` on a moving entity must track — it
does automatically since `pos` moves and the area is pos-relative.

**Descriptor key decision (CONTEXT):** prefer an EXEMPT motion key (e.g. `geometry.slidingSpikes`)
so placement tuning does not churn the freeze baseline. Mirror how `movers`/`patrollers` are stripped
in `scripts/check-geometry-frozen.mjs:60` (`const { movers, patrollers, ...frozen }`) — add the new
key to that destructure so it is excluded too. Authoring shape mirrors a mover:
`{ x1, y1, x2, y2, period? }` (all at `y = FLOOR_Y - SPIKE_SIZE` for a ground-sliding spike, x1≠x2).

**Config (POL-02 tunables)** — reuse `CONFIG.SPIKE_SIZE/HITBOX_W/HITBOX_H` (`config.js:156-158`) for
the hitbox; add a `PERIOD_S` default like `CONFIG.MOVER.PERIOD_S` (`config.js:280`). No magic numbers
in build.js.

**Harness must learn the new hazard** (else a level fails to validate / the driver runs into it):
1. `scripts/lib/mechanic-drive.mjs:43-60` `deriveEncounters()` — add a `...(geometry.slidingSpikes ?? [])`
   emit (mirror the `movers`/`patrollers` idx-keyed entries at `:59-60`).
2. The spike-jump fire logic already exists — `FIRE_WINDOW.spike` (`mechanic-drive.mjs:415`),
   `spikeJumpHoldMs = 150` (`:386`, applied at `:650`). A sliding spike needs the driver to time its
   crossing (either hop it or wait for the sweep to clear); reuse the spike-hop path.
3. `scripts/lib/reachability.mjs` — spikes are treated as passable/non-blocking today (`:568` "Spikes
   likewise: a spike … can never make a coin permanently unreachable"). Confirm a sliding spike keeps
   that property (its floor span stays walkable between sweeps) so no false HARD-FAIL.

---

### POL-03 — Movers over real holes (FULL re-placement, the big lift)

**Two coupled edits per level: a FROZEN edit (remove static stepping-stones) + an EXEMPT edit
(retune the mover to span the pit).**

**Analog — mover factory** `src/levels/build.js:543-570` (unchanged; see POL-02 Analog B). Config
`CONFIG.MOVER` `config.js:279-286` (WIDTH 48, HEIGHT 32, LEDGE_H 16, PERIOD_S 4, SPRITE "atlas-castle",
FRAME 2). Per-mover `w`/`period`/`sprite` overrides supported.

**Analog — a mover placement over a clean island** `level-01.js:222-232`, and over a run
`level-08.js:322-334`:
```javascript
movers: [
  { x1: 6560, y1: 250, x2: 6600, y2: 250, w: 60 }, // level-08 M0 — narrow ferry
],
```

**Analog — the static stepping-stones to REMOVE** (the BARBICAN / broken-drawbridge over real pits),
`level-08.js:111-126`:
```javascript
{ x: 1920, y: 250, w: 120, h: 16 }, // BA — bridges the 640px MOAT (1880..2520)
// … BARBICAN tiers …
{ x: 4560, y: 262, w: 120, h: 16 }, // SS1 — bridges the 520px DRAWBRIDGE CHASM (4480..5000)
```
Removing/relocating any `platforms` entry TRIPS `check-geometry-frozen` (see Frozen-geometry below).

**Reachability already checks movers** — `scripts/lib/reachability.mjs:1104-1132`
(`mover-reachability`, worst-case-extreme: both endpoints must be reachable rightward from spawn).
Any re-placed mover must keep BOTH endpoints in the ~88px jump envelope from a reachable ledge.

**Harness — teach the drivers to RIDE a mover** (CONTEXT: fix identically in each duplicated copy):
- `scripts/lib/mechanic-drive.mjs:844+` `driveAndDetectMover()` ALREADY exists (walk to a staging
  point left of `x1`, mount, ride, detect grounded platform-moving frames). This is the ride recipe.
- `scripts/audit-phase21-mechanics.mjs` already dispatches mover encounters (`:292-297`).
- `scripts/browser-boot.mjs` is the WALK-ONLY spawn→goal driver and does NOT ride movers yet — this is
  the new work: when a real pit is now bridged only by a mover, the walk-only driver must board it or
  it can never cross. Port the mount/ride logic from `mechanic-drive.mjs:844+` (duplication is
  deliberate per CLAUDE.md — copy, do not extract).

**Frozen-geometry (POL-03 is the ONLY requirement that re-baselines):** after the FROZEN
stepping-stone removals, run `node scripts/check-geometry-frozen.mjs --write` as the deliberate
acknowledgment, and commit the new `scripts/fixtures/geometry-frozen-baseline.json`.

---

### POL-04 — Solid props (opt-in `pr.solid` branch)

**Analog — the current prop loop (collider-free)** `src/levels/build.js:492-528` (header `:463-469`
mandates NO area/body — keep that the default):
```javascript
for (const pr of levelData.props ?? []) {
  const isLight = LIGHT_RE.test(pr.sprite);
  // … linked-light detection …
  const propObj = add([
    sprite(pr.sprite),
    pos(pr.x, pr.y),
    z(pr.layer === "surface" ? CONFIG.PROPS.Z_SURFACE : CONFIG.PROPS.Z_BACK),
    opacity(1),
    "prop",
    ...(linked ? ["alcove-light"] : []),
  ]);
  // … flicker onUpdate for lights …
}
```

**Analog — a static collider to graft on** (floor/platform block) `src/levels/build.js:204-234`:
```javascript
add([
  rect(run.w, CONFIG.FLOOR_THICKNESS),
  pos(run.x, FLOOR_Y),
  area(),
  body({ isStatic: true }),
  opacity(HIDDEN),
  "ground",
]);
```

**Composed target — a `pr.solid` branch:** when a prop descriptor sets `solid: true`, add
`area()` + `body({ isStatic: true })` sized to the sprite AND raise its `z` to `>= 0` so it visually
blocks (default props are negative-z, behind the player — a solid one must be at play depth). Keep the
default (no `solid`) branch collider-free — do NOT regress the whole layer. Sprite sizes for sizing the
collider come from the bake (e.g. barrel/crate footprints; CONTEXT POL-04 lists town props).

**Prop placements (town levels only — barrels/crates):**
- L3 `level-03.js:269-273`: barrel@880, crate@1810, barrel@3400, crate@5420 (all `layer:"surface"`)
- L4 `level-04.js:272-273`: barrel@60, crate@2760

**Clearability:** a solid prop becomes route-affecting. The validator/audit must know it exists so the
level stays clearable — the player must be able to jump it (check the jump envelope in
`docs/LEVEL-DESIGN.md`). Props are TOP-LEVEL (`levelData.props`), so they are invisible to
`validate-levels.mjs` today — a solid prop may need a new reachability input, OR keep solids only where
a jump-over is guaranteed by geometry. CONTEXT default: all 6 town props solid, revisit only if a
route breaks.

---

### POL-05 — Prop cleanup (skull→lantern swap, well move, column reposition)

**(a) Skull → non-skull light.** The "skull" is `prop-swamp-lantern`, baked from `fire-skull.png`
(`build-art-assets.py:1571-1583`). It is ALSO the MECH-05 alcove light, so the swap MUST keep the same
coords and the same alcove-light link.

**Analog — a NON-SKULL light bake already in-repo** `build-art-assets.py:1608` (church altar candle):
```python
bake_prop("cemetery-lantern", church_ts, crop=(247, 88, 273, 117))
```
`bake_prop` signature `build-art-assets.py:1520`:
```python
def bake_prop(out_name, src_rel, crop=None, strip_plate=False, drop_small=0, retint=None):
```
Options: re-bake `swamp-lantern` from a non-skull source (the church candle crop, or the town
street-lamp), OR point L1/L2 at an existing non-skull light key (`prop-cemetery-lantern` /
`prop-castle-candle-stand`). Whatever the key, it MUST still match `LIGHT_RE = /lantern|lamp|candle/`
(`build.js:490`) so the flicker + alcove-link fire.

**Analog — the alcove-light link (must survive)** `src/levels/build.js:490-527` (selector + litLevel +
flicker) and the brighten seam `src/scenes/game.js:162-188` (`lightAmbient()` tweens `litLevel` DIM→1,
derived from `progress.hasSecretFound`). No code change needed — keep the swapped prop within
`CONFIG.AMBIENT.LINK_DIST` (96px, `config.js:329`) of the alcove.

**The data to edit — same coords, new sprite key** `level-01.js:287` & `level-02.js:377`:
```javascript
{ sprite: "prop-swamp-lantern", x: 320, y: 242, layer: "surface" }, // swap sprite key only; keep x/y/layer
```
Both sit within `LINK_DIST` of `secretAlcove: [{ x: 320, y: 184 }]` (`level-01.js:212`,
`level-02.js:280`) — keep that true.

**(b) Well clear of the spike** — `level-03.js:265` `prop-town-well` at `{x:4400,y:255,layer:"back"}`
overlaps the F5 spike at `x:4460` (`level-03.js:161`, FROZEN — do NOT move the spike). Move the WELL
(prop, EXEMPT) clear of x:4460.

**(c) Columns reposition** — `prop-castle-column` (church pillar), `level-08.js:374-376`:
```javascript
{ sprite: "prop-castle-column", x: 40,   y: 130, layer: "back" }, // spawn
{ sprite: "prop-castle-column", x: 3160, y: 130, layer: "back" }, // over F3/F4 gap 3080-3240
{ sprite: "prop-castle-column", x: 6380, y: 130, layer: "back" }, // over F7/F8 gap 6280-6440
```
Reposition all three to read as intentional (props, EXEMPT — no re-baseline).

---

## Shared Patterns

### Motion loop idiom (POL-02, POL-03) — SAFE-01 clean
**Source:** `src/levels/build.js:562-569` (mover) and `:516-526` (light flicker).
**Apply to:** every moving/animated entity.
```javascript
let t = 0; // closure-local PER entity — NEVER module-level (anti-leak)
obj.onUpdate(() => {
  t += dt();                                       // dt-based; no setTimeout/wait/loop/lifespan
  const phase = (1 - Math.cos(((2*Math.PI)/period) * t)) / 2;
  obj.pos.x = x1 + (x2 - x1) * phase;              // raised-cosine eases to rest at BOTH ends
});
```

### Static-collider component stack (POL-04)
**Source:** `src/levels/build.js:204-211` / `:222-229`.
**Apply to:** the new solid-prop branch.
```javascript
add([ rect(w, h), pos(x, y), area(), body({ isStatic: true }), opacity(HIDDEN), "tag" ]);
```

### Respawn hazard seam (POL-01, POL-02) — reuse, do NOT re-invent
**Source:** `src/scenes/game.js:269` (spike) and `:277` (patroller).
**Apply to:** any new hazard tag — tag it `"spike"` (or add one `player.onCollide(tag,()=>respawn())`
line). ZERO hurt/score/game-over/timer wiring (ADHD-safe, CONTEXT-locked).

### Frozen-geometry discipline (all POL requirements)
**Source:** `scripts/check-geometry-frozen.mjs:60` `const { movers, patrollers, ...frozen } = geometry`.
- EXEMPT (edit freely, NO `--write`): `geometry.movers`, `geometry.patrollers`, top-level `props[]`,
  and any NEW motion key you add to that destructure (POL-02 `slidingSpikes`).
- TRIPS the gate (needs `--write` + committed baseline): `floors`, `platforms`, `spikes`, `coins`,
  `goal`, `checkpoints`, `doors`, `mathGates`, `enemies`, `keys`, `locks`, `secretAlcove`, `bounds`.
- Only POL-03 (removing static stepping-stones) intentionally trips it → run
  `node scripts/check-geometry-frozen.mjs --write` and commit the new baseline.

### Harness-parity mandate (POL-02, POL-03)
**Source:** CLAUDE.md — `browser-boot.mjs` / `audit-phase21-mechanics.mjs` / `mechanic-drive.mjs`
deliberately duplicate server/drive code. Fix a bug (or add a ride/hazard) IDENTICALLY in each copy by
hand; do NOT extract a shared module. New hazards register in `deriveEncounters()`
(`mechanic-drive.mjs:43-60`).

---

## No Analog Found

None. Every requirement composes from existing in-repo patterns:

| Requirement | Why it still has coverage |
|-------------|---------------------------|
| POL-02 sliding spike (the only "NEW mechanic") | = spike entity `build.js:250-260` + mover oscillation `build.js:543-570` (compose two analogs) |
| POL-04 solid prop (net-new collider on props) | = prop loop `build.js:492-528` + static collider `build.js:204-234` (compose) |

---

## Metadata

**Analog search scope:** `src/levels/` (build.js, config.js, all 8 level-0N.js), `src/scenes/game.js`,
`scripts/build-art-assets.py`, `scripts/lib/{mechanic-drive,reachability,over-hole-check}.mjs`,
`scripts/{browser-boot,audit-phase21-mechanics,check-geometry-frozen}.mjs`.
**Files scanned:** ~14 read/greped.
**Pattern extraction date:** 2026-07-19
