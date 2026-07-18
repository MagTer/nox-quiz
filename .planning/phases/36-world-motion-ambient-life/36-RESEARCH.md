# Phase 36: World Motion & Ambient Life - Research

**Researched:** 2026-07-18
**Domain:** Kaplay 3001 motion components (patrol / moving-platform carry), dt-based
check-safety-compliant animation, mover reachability, geometry-freeze reconciliation
**Confidence:** HIGH (engine APIs source-verified in the vendored `lib/kaplay.mjs`; motion
idiom measured in the committed v6.0 spike; all gates read from the live tree)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Motion intensity — FULL motion.** Patrollers are REAL respawn-hazards (not just cosmetic)
  and moving platforms are REAL traversal, across the levels. BOUNDED by the standing
  no-punishment mandate: "challenge/risk" means ONLY checkpoint-respawn. NO hurt, NO score
  loss, NO game-over, NO timer, NO punishment wiring. Full motion = lots of movement +
  respawn-stakes, NOT a frustrating difficulty spike.
- **Placement — ALL 8 levels get gameplay movers.** Patrollers AND moving platforms on all 8
  (not just intense evens). Ambient animation (torch flicker, shimmer, unlock anims) on all 8.
  Calm odd levels get LIGHTER mover density than intense evens, but none is mover-free.
- **Path risk — movers MAY be on the critical path** (overrides "optional-only"). Moving
  platforms and patrollers CAN sit on the main route as real traversal challenge.
  **HARD CONSTRAINT that survives this: NO SOFTLOCK.** A required moving platform must ALWAYS
  return/carry the player so the route is completable; a patroller must never trap the player.
  The Phase-30 mover-aware validator (worst-case-extreme reachability) MUST stay green for
  every placement. **Close checkpoints near every on-path hazard** (§8.5 rule 4).
- **Patroller contact — gentle respawn-hazard.** Touching a patroller = respawn at the nearby
  checkpoint. SAME forgiving hazard class as existing spikes — ZERO hurt/score/punishment
  wiring. Slow, heavily telegraphed (visible walk-cycle, clear waypoint path), visually
  DISTINCT from stationary math-blocker enemies.

### Claude's Discretion
- Exact per-level mover counts/paths/speeds, telegraph styling, which ambient anims per biome,
  and the specific alcove ambient-change art — within the decisions above, confirmed at the
  hazard-placement human checkpoint (SC5, a REAL mid/late-phase `checkpoint:human-verify` — do
  NOT rubber-stamp).

### Deferred Ideas (OUT OF SCOPE)
- Mobile/touch (Phase 37); n0x logo + final closing verification (Phase 38); ANY geometry
  change (existing floors/platforms/coins/spikes/goal/checkpoints/doors/mathGates/enemies/
  keys/locks/secretAlcove/bounds arrays are byte-frozen since Phase 34.6). Math brain LOCKED.
  No Kaplay upgrade, no new runtime deps.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOT-01 | Patrolling cosmetic enemies (respawn-hazard class), telegraphed, dt-based | `patrol()` component CONFIRMED in `lib/kaplay.mjs` (§Standard Stack); routes through existing `respawn()` seam (§Reusing the Respawn Class); distinct `"patroller"` tag |
| MOT-02 | Moving platforms that carry the player, dt-based sine ping-pong, no softlock | native `stickToPlatform` carry CONFIRMED as a `body()` option (§Standard Stack); dt-sine idiom measured in the spike (§check-safety-compliant Motion); `geometry.movers` validated worst-case-extreme (§No-Softlock) |
| MOT-03 | Ambient animation — torch flicker, goal/checkpoint unlock anims, shimmer | pure visual `onUpdate`+`dt()` / `tween().onEnd()` loops over existing Phase-35 light-source props (§Ambient Animation) |
| MECH-05 | Alcove discovery leaves a PERSISTENT, positive-only ambient change for the rest of the run | wired through the existing `secretAlcove` seam via a new `onDiscover` callback; state DERIVED from `progress.hasSecretFound(levelId)` on entry (§MECH-05 Alcove Ambient) |
</phase_requirements>

---

## Summary

Both engine primitives this phase depends on **exist in the vendored Kaplay 3001.0.19**, verified
by reading `lib/kaplay.mjs` directly (not docs, not training data):

- **`patrol()` is a real component** (`function Ca`, minified) — `require:["pos"]`, options
  `{ waypoints, speed=100, endBehavior:"stop"|"loop"|"ping-pong" }`, dt-based `moveTo` inside its
  own `update()`, no scheduler. This is the patroller's movement, free.
- **`stickToPlatform` is NOT a standalone component — it is an option on `body()`** (`function Da`).
  The rider-carry logic lives inside the *player's* `body()` update: when the rider's current
  platform moves, the rider is `moveBy(delta)`-ed unless `body({ stickToPlatform:false })`. Default
  ON. A moving platform therefore needs only `area() + body({ isStatic:true })` and to move by
  **mutating `pos`** — the engine carries the rider natively. The committed v6.0 spike measured this
  at **100% frame-contact horizontally, full-cycle vertically, clean jump-off** — and proved that
  writing your own carry code is an anti-pattern that slides the rider off in <1s.

The **motion idiom is already proven and committed** in `.planning/research/v6-scouting/spike-code/`
+ `SPIKE-FINDINGS.md`: a dt-based `onUpdate(() => { t += dt(); plat.pos.x = ... })` sine oscillation.
This passes `check-safety.sh` (no `setTimeout`/`setInterval`/`wait(`/`loop(`/`lifespan(`). Web Kaplay
examples use the banned `wait()`/`loop()` schedulers and MUST be ignored.

The **one genuine design decision** this phase must resolve is a gate conflict: the Phase-30
mover-reachability validator reads `geometry.movers`, but `check-geometry-frozen.mjs` serializes the
*entire* `geometry` object and HARD-FAILs on ANY new key. Adding `geometry.movers` (and a patroller
key) therefore trips the freeze gate. **Recommended resolution: teach the freeze gate to exclude the
motion keys from its snapshot** — the direct analog of how Phase-35 props were made "structurally
invisible" — so the kid-validated static geometry stays byte-frozen while the validator still sees
movers. (Details + rejected alternatives in §Architecture Patterns.)

**Primary recommendation:** Movers = `geometry.movers` (`{x1,y1,x2,y2}` + Phase-36 visual fields),
built as `area()+body({isStatic:true})` sprites driven by a raised-cosine dt oscillation between the
two validated endpoints; patrollers = a new `geometry.patrollers` array built with the native
`patrol()` component, tagged `"patroller"`, routed through the existing `respawn()` seam. Exclude
both motion keys from `check-geometry-frozen`. Ambient life animates existing Phase-35 light-source
props with self-cleaning visual tweens. Place both endpoints reachable **rightward** (validator
limitation) and a checkpoint before every mover (§6b rule 1).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Moving-platform motion | `src/levels/build.js` (entity emit + `onUpdate` sine) | `src/config.js` (period/amplitude tunables) | Movers are level data → the ONE builder emits them; motion is per-frame on the entity |
| Rider carry | Kaplay `body()` engine (`stickToPlatform`) | `src/player.js` (player already has `body()`) | Engine-native; **do NOT hand-carry** (measured anti-pattern) |
| Patroller motion | `src/levels/build.js` (`patrol()` component) | `src/config.js` (speed/waypoints defaults) | Native component, level-data driven |
| Patroller contact → respawn | `src/scenes/game.js` (`onCollide("patroller", …)`) | existing `respawn()`/`reset()` closure | Reuse the exact spike hazard path — zero new punishment wiring |
| Mover reachability validation | `scripts/lib/reachability.mjs` (Phase 30, already built) | `scripts/validate-levels.mjs` | Static, pure-Node worst-case-extreme rule already ships |
| Interactive "ride/cross" proof | `scripts/lib/mechanic-drive.mjs` (`deriveEncounters()` + `driveToMover`/`driveToPatroller` detectors) + `scripts/lib/audit-retry.mjs` (`auditLevelWithRetries` — the REAL per-encounter dispatch that selects the driver by tag, and the non-blocking-break guard) | `scripts/audit-phase21-mechanics.mjs` (boot/nav caller only — imports auditLevelWithRetries, owns no dispatch) | Extend `deriveEncounters()` for movers/patrollers AND add the mover/patroller dispatch branches + break-exemption in `auditLevelWithRetries` (audit-retry.mjs), mirroring the `tag === "secret-alcove"` precedent |
| Geometry-freeze integrity | `scripts/check-geometry-frozen.mjs` | — | Must exclude motion keys so static arrays stay frozen |
| Alcove persistent ambient | `src/mechanics/secretAlcove.js` seam + `src/scenes/game.js` | `src/progress.js` (`hasSecretFound`) | Positive-only, DERIVED-from-cleared-fact convention |
| Ambient flicker / unlock anims | `src/levels/build.js` prop layer + a small anim helper | `src/fx.js` (self-clean tween idiom) | Pure visual, collider-free, z<0 |

---

## Standard Stack

### Core (all vendored / already present — NO new deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay `patrol()` | 3001.0.19 (vendored) | Patroller waypoint movement | `[VERIFIED: lib/kaplay.mjs]` built-in, dt-based, no scheduler |
| Kaplay `body({ stickToPlatform })` | 3001.0.19 | Native rider-carry on moving platforms | `[VERIFIED: lib/kaplay.mjs]` carry is engine-side; measured in spike |
| Kaplay `onUpdate` + `dt()` | 3001.0.19 | dt-based sine platform motion | `[VERIFIED: SPIKE-FINDINGS.md]` port-ready idiom, check-safety-clean |
| Kaplay `tween().onEnd()` | 3001.0.19 | Self-cleaning ambient/unlock anims | `[VERIFIED: src/fx.js]` the project's ONLY delayed-effect idiom |

### Source-verified API details

**`patrol()` — `function Ca(t={})` in `lib/kaplay.mjs`:**
```
{ id:"patrol", require:["pos"],
  patrolSpeed (get/set) = t.speed || 100,      // px/s
  waypoints  (get/set) = t.waypoints,          // vec2[] (array is reversed in place on ping-pong!)
  nextLocation (get)   = waypoints[o],
  update(){ moveTo(next, speed); if pos.sdist(next) < 9 switch(endBehavior){
      "loop":     o = (o+1) % len;
      "ping-pong": o++; if (o==len){ waypoints.reverse(); o=0; }
      "stop":     o<len-1 ? o++ : trigger("patrolFinished"); } },
  onPatrolFinished(cb) }
```
- `endBehavior` default is **`"stop"`** — for a perpetual patroller pass `"ping-pong"` (or `"loop"`).
- Advance threshold is `pos.sdist(next) < 9` → **squared** distance, i.e. within **3px** of a waypoint.
- `moveTo` is dt-based internally → `patrol` is frame-rate independent and scheduler-free.
- **`"ping-pong"` reverses the `waypoints` array in place.** Each patroller MUST get its own fresh
  waypoint array (closure-local per entity in `build.js`) so two patrollers never share/reverse the
  same array reference.
- **check-safety note:** the string literal `"loop"`/`"ping-pong"` is NOT the banned `loop(` call —
  `check-safety.sh` greps `[^a-zA-Z]loop\(` (an open paren), so `endBehavior:"loop"` passes. Verified
  against the live gate script.

**`stickToPlatform` — inside `body()` (`function Da`), the rider's own update:**
```
update(){
  e && this.isColliding(e) && e.exists() && e.has("body") &&
    ( n && !e.pos.eq(n) && t.stickToPlatform!==false && this.moveBy(e.pos.sub(n)), n = e.pos );
  ...
}
```
where `e` = the rider's current platform (set in `onPhysicsResolve` on `isBottom() && isFalling()`),
`n` = the platform's previous pos. Each frame, if the platform moved, the rider is displaced by the
platform's delta. **Enabled by default** (opt-out only via `body({ stickToPlatform:false })`).
`jump()` clears the current platform in-engine (spike confirmed clean jump-off).

**Consequence for build:** a moving platform is
`add([ sprite(...), pos(x1,y1), area(), body({ isStatic:true }), "mover" ])` and moves by mutating
`pos` in `onUpdate`. The player (`src/player.js`, already has `body()` with default
`stickToPlatform`) is carried with **zero rider code**.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dt-sine for the platform | `patrol({ endBehavior:"ping-pong" })` on the platform too | patrol gives CONSTANT velocity + abrupt reversal at waypoints — no "natural endpoint slow-down." CONTEXT wants sine easing → use dt-sine for **platforms**; keep `patrol()` for **patrollers** (a constant walk speed reads correctly for an enemy) |
| raised-cosine `(1-cos)/2` | plain `sin` | plain `sin` starts at the MIDPOINT at max speed; raised-cosine starts **at an endpoint at rest** (best telegraphing) and still hits exactly `x1`/`x2` at the extremes — recommended (see Code Examples) |
| native carry | manual `moveBy` in the platform's `onUpdate` | **measured anti-pattern** — double-applies on top of native carry, rider slides off in <1s (4.2% mounted). NEVER hand-carry |

**No `npm install` — every primitive above is in the pinned vendored engine. No Package Legitimacy
Audit required (this phase installs zero external packages).**

---

## Architecture Patterns

### The geometry-freeze reconciliation (the one real decision)

**The conflict, source-grounded:**
- `scripts/check-geometry-frozen.mjs` line 44: `map[id] = JSON.stringify(getLevel(id).geometry)` —
  serializes the **whole** geometry object and HARD-FAILs on ANY drift, "naming the first differing
  top-level key" (line 94, `firstDifferingKey`).
- `scripts/lib/reachability.mjs` line 1116: `for (const [i, m] of (geometry.movers ?? []).entries())`
  — the Phase-30 mover-reachability check reads **`geometry.movers`**.
- Phase-30 fixture + tests (Cases K/L/M, reachability.mjs lines 1457–1504) all key off
  `geometry.movers`. `docs/LEVEL-DESIGN.md` §6a documents movers as `geometry.movers`.

So movers MUST live in `geometry.movers` to be validated, but that new key trips the freeze gate.
Patrollers add a second new key with the same problem.

**Recommended: exclude the motion keys from the freeze snapshot (Option C).**
Edit `currentGeometryMap()` in `check-geometry-frozen.mjs` to strip `movers` (and the new patroller
key) before `JSON.stringify` — an explicit exclusion allowlist. This:
1. Keeps the byte-freeze guarantee on ALL kid-validated static arrays (floors/platforms/coins/
   spikes/goal/checkpoints/doors/mathGates/enemies/keys/locks/secretAlcove/bounds).
2. Keeps movers in `geometry.movers` where the shipped Phase-30 validator + fixture already read them
   (zero churn to reachability.mjs / the RED-first fixture).
3. Is the exact analog of the props precedent — props were made "structurally invisible" to the
   freeze gate (build.js reads top-level `levelData.props`, never `geometry.props`; freeze-gate
   comment lines 15–17). Movers can't use that trick (the validator needs them *inside* geometry),
   so the equivalent is an explicit key exclusion.
4. Is a harness edit, NOT a geometry edit — squarely in scope ("motion is placed via new descriptor
   fields", CONTEXT; the freeze gate is a script, not a level).
   **Re-run `node scripts/check-geometry-frozen.mjs --write` is NOT needed** under Option C for the
   motion keys, and MUST NOT be used to "fix" an accidental static-array change.

**Rejected — Option A (re-freeze via `--write`):** regenerate the golden after adding movers.
Rejected because `--write` rewrites the WHOLE baseline, so a stray coin/platform nudge in the same
commit would be silently baked into the new golden — it destroys the guard the gate exists to provide.
**Rejected — Option B (movers at top-level `levelData.movers` like props):** keeps the freeze green
with no edit, BUT the Phase-30 validator reads `geometry.movers` and would see nothing → movers ship
**unvalidated**, violating the CONTEXT's hard "validator must stay green for every placement / a mover
that could strand her is the one thing this phase cannot ship." Re-pointing the validator at top-level
would churn reachability.mjs + the fixture + 3 tests and break the RED-first proof.

### Recommended Project Structure (files touched)

```
src/
├── config.js              # + CONFIG.MOVER {PERIOD_S, THICKNESS, SPRITE...}, CONFIG.PATROLLER {SPEED, ...}
├── levels/
│   ├── build.js           # + emit movers (g.movers) & patrollers (g.patrollers); + ambient anim on props
│   ├── level-0N.js        # + geometry.movers / geometry.patrollers arrays (NEW keys, all 8 levels)
│   └── index.js           # (unchanged — stays node-importable)
├── mechanics/
│   └── secretAlcove.js    # + onDiscover(alcoveObj) callback for the persistent ambient change (MECH-05)
├── scenes/
│   └── game.js            # + onCollide("patroller", () => respawn()); wire alcove onDiscover; derive lit-on-entry
└── (optional) motion.js   # small dt-sine helper IF build.js gets crowded (else inline)

scripts/
├── check-geometry-frozen.mjs   # exclude movers/patrollers keys from the snapshot
├── lib/mechanic-drive.mjs      # deriveEncounters(): + movers, + patrollers
└── audit-phase21-mechanics.mjs # ride every mover, cross every patroller (interactive proof)

assets/                          # ONLY if a new patroller/platform sprite is added (else reuse)
src/assets-manifest.js + main.js # register any new sprite (check-assets-manifest + check-pink-gate gates)
```

### Pattern 1: Moving platform (dt-sine, native carry)
**What:** A solid static-body platform oscillating between two validated endpoints; the engine carries
the rider. **When to use:** every `geometry.movers` entry.
```js
// Source: .planning/research/v6-scouting/SPIKE-FINDINGS.md (measured idiom), adapted to raised-cosine
// In build.js, inside buildLevel(), engine globals referenced only here (a727c13-safe):
for (const m of g.movers ?? []) {
  const plat = add([
    sprite(CONFIG.MOVER.SPRITE),          // or reuse the biome atlas PLATFORM frame
    pos(m.x1, m.y1),
    area(),
    body({ isStatic: true }),             // solid; stickToPlatform on the RIDER does the carry
    "mover",
  ]);
  const period = m.period ?? CONFIG.MOVER.PERIOD_S;  // per-mover override allowed (discretion)
  let t = 0;
  plat.onUpdate(() => {                    // dt-based, no scheduler — check-safety clean
    t += dt();
    const phase = (1 - Math.cos((2 * Math.PI / period) * t)) / 2;  // 0→1→0, eases at BOTH ends
    plat.pos.x = m.x1 + (m.x2 - m.x1) * phase;
    plat.pos.y = m.y1 + (m.y2 - m.y1) * phase;
    // NO rider code — body() stickToPlatform carries the player natively.
  });
}
```
**Contract:** the descriptor's `{x1,y1,x2,y2}` MUST be the platform's TRUE motion extremes — the
raised-cosine reaches exactly `(x1,y1)` at `phase=0` and `(x2,y2)` at `phase=1`, so the two points the
validator tests are the two points the platform actually visits. Never let the visual motion exceed the
declared endpoints or the reachability proof is unsound.

### Pattern 2: Patroller (native `patrol`, respawn-hazard)
```js
// In build.js:
for (const p of g.patrollers ?? []) {
  const foe = add([
    sprite(CONFIG.PATROLLER.SPRITE),      // MUST be visually distinct from CONFIG.ENEMY (math-blocker)
    pos(p.x1, p.y1),
    area(),
    patrol({
      waypoints: [vec2(p.x1, p.y1), vec2(p.x2, p.y2)],  // FRESH array per entity (ping-pong reverses it)
      speed: p.speed ?? CONFIG.PATROLLER.SPEED,
      endBehavior: "ping-pong",
    }),
    "patroller",                          // DISTINCT tag from "enemy"
  ]);
  foe.play("walk");                       // visible walk-cycle telegraph
}
```
```js
// In game.js — reuse the EXACT spike hazard path, zero new punishment wiring:
player.onCollide("patroller", () => respawn());   // mirrors line 220: onCollide("spike", () => respawn())
```

### Pattern 3: Persistent alcove ambient (MECH-05)
**What:** discovering the secret alcove permanently brightens a linked dark torch/light for the rest of
the run — positive-only. **State is DERIVED, never stored as its own fact** (mirrors the "unlock is
derived from cleared facts" convention).
```js
// secretAlcove.js gains an onDiscover callback (called once, in the genuine-new-secret branch):
wireSecretAlcove({ player, progress, hud, levelId, save,
  onDiscover: (alcoveObj) => lightAmbient() });     // brighten the linked torch permanently

// game.js: on scene ENTRY, if already found in a prior run, render the torch ALREADY lit
if (progress.hasSecretFound(level.id)) lightAmbient();  // derived, not a new persisted flag
```
`lightAmbient()` tweens a dim torch prop's opacity/scale up and leaves it there (a `tween` with no
reverse; self-completes). Positive-only: nothing is ever dimmed or taken away.

### Anti-Patterns to Avoid
- **Hand-carrying the rider** (manual `moveBy` in the platform's `onUpdate`) — measured: rider slides
  off in <1s. Let `body()` do it.
- **Sharing one waypoint array across patrollers** — `"ping-pong"` reverses it in place; give each its own.
- **Using `patrol()` for platforms** — constant velocity + abrupt reversal, no sine easing (CONTEXT wants
  natural endpoint slow-down). dt-sine for platforms, `patrol` for enemies.
- **`--write`-ing the freeze baseline to "fix" the movers key** — masks accidental static drift.
- **A killing pit UNDER a mover** (LEVEL-DESIGN §6b rule 2) — a missed mover means WAIT-not-death.
- **Reusing the `"enemy"` tag for patrollers** — it would route them through the math-challenge seam
  (enemy.js), not the respawn seam. Distinct `"patroller"` tag.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rider carried by a moving platform | Manual delta tracking + `moveBy` | `body({ stickToPlatform })` (default on) | Engine-native; hand-rolling is a measured slide-off bug |
| Patroller waypoint traversal | Hand-written lerp + reversal state machine | `patrol({ waypoints, endBehavior })` | Built-in, dt-based, scheduler-free |
| Delayed / eased motion without timers | `setTimeout`/`wait()`/`loop()` scheduling | `onUpdate`+`dt()` sine, or `tween().onEnd()` | Banned by check-safety; dt idiom is the proven, gate-clean path |
| Mover reachability proof | New reachability math | Phase-30 `mover-reachability` in `reachability.mjs` | Already built RED-first; worst-case-extreme rule ships |
| Respawn on patroller contact | New failure/hurt construct | existing `respawn()`/`reset()` closure in game.js | Forgiving hazard class already exists (spikes); zero new wiring |

**Key insight:** every moving-part primitive this phase needs is already in the vendored engine or the
committed spike; the *engineering* work is placement, tuning, schema wiring, and keeping four gates
green — not building motion systems.

---

## Runtime State Inventory

> This phase ADDS entities/keys (movers, patrollers, ambient state). It renames/migrates nothing.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — movers/patrollers are pure level DATA rebuilt on scene entry; no persisted mover state | none |
| Live service config | None — static browser game, no external services | none |
| OS-registered state | None | none |
| Secrets/env vars | None | none |
| Build artifacts | The `check-geometry-frozen` golden (`scripts/fixtures/geometry-frozen-baseline.json`) — will conflict with new `geometry.movers`/`geometry.patrollers` keys | Code edit to `check-geometry-frozen.mjs` to exclude motion keys (Option C); do NOT `--write` the golden for motion keys |
| Persisted alcove fact | `progress.hasSecretFound(levelId)` (already exists) drives the MECH-05 lit-on-entry derivation | none new — derive ambient state from the existing fact |

---

## Common Pitfalls

### Pitfall 1: New geometry key breaks the freeze gate
**What goes wrong:** adding `geometry.movers` / `geometry.patrollers` HARD-FAILs
`check-geometry-frozen.mjs` because it serializes the whole geometry object.
**Why:** the gate freezes every top-level geometry key indiscriminately (line 44).
**How to avoid:** exclude the motion keys from `currentGeometryMap()` (Option C). Verify by running
`node scripts/check-geometry-frozen.mjs` after the edit — it must PASS with the motion keys present.
**Warning signs:** "geometry drifted from the frozen baseline (first differing key: movers)".

### Pitfall 2: Validator rightward-travel-only limitation
**What goes wrong:** a mover endpoint that is genuinely reachable only by walking LEFT from a later
point HARD-FAILs `mover-reachability` even though it's fine in play.
**Why:** `bestMarginToPoint` skips launch nodes whose span is after the target x (`if (point.x < n.xStart) continue`) — LEVEL-DESIGN §6a, "Known limitation — rightward-travel-only."
**How to avoid:** place BOTH ping-pong endpoints so each is reachable by walking/jumping **rightward**
from spawn along the level's normal forward path.
**Warning signs:** `mover[i] endpoint (...) unreachable from spawn (worst-case-extreme)` on a placement
that looks fine under `?debug=1`.

### Pitfall 3: Softlock on a required on-path mover
**What goes wrong:** the player misses the platform and lands where they cannot recover.
**Why:** movers are now ALLOWED on the critical path (CONTEXT).
**How to avoid:** LEVEL-DESIGN §6b rule 2 — a missed mover must leave the player somewhere they can
simply WAIT for it to return (ledge / safe floor / previous tier). No killing pit under a mover.
`mover-reachability` proves the endpoints are reachable; the WAIT-recovery is an authoring rule verified
at the human checkpoint + interactive audit.
**Warning signs:** the only floor under a mover is a respawn pit with no ledge to wait on.

### Pitfall 4: Patroller routed through the wrong seam
**What goes wrong:** a patroller opens a math challenge (or does nothing) instead of respawning.
**Why:** reusing the `"enemy"` tag hits `enemy.js`'s challenge seam; forgetting the wiring does nothing.
**How to avoid:** tag `"patroller"`, add exactly `player.onCollide("patroller", () => respawn())` in
game.js (mirrors the spike line 220). ZERO hurt/score/HP.
**Warning signs:** touching a patroller freezes the player with a math panel, or has no effect.

### Pitfall 5: check-safety trip from a stray scheduler
**What goes wrong:** using `wait()`/`loop()`/`setTimeout` for platform timing or flicker.
**Why:** habit / copied web Kaplay examples (which use `wait()`/`loop()`).
**How to avoid:** dt-sine in `onUpdate` for continuous motion; `tween().onEnd()` for one-shots. Run
`bash scripts/check-safety.sh` — it greps `[^a-zA-Z]wait\(|[^a-zA-Z]loop\(|lifespan\(|setTimeout|setInterval`
on comment-stripped code. `endBehavior:"loop"` (a string) is safe.
**Warning signs:** "timer/scheduler in code: … (SAFE-01)".

### Pitfall 6: Shared/reversed waypoint array
**What goes wrong:** two patrollers drift out of sync or reverse unexpectedly.
**Why:** `patrol("ping-pong")` calls `waypoints.reverse()` in place; a shared array corrupts both.
**How to avoid:** construct a fresh `[vec2(...), vec2(...)]` per patroller inside the build loop.

### Pitfall 7: Mover collider vs jump envelope
**What goes wrong:** the moving platform's collider interacts oddly with the calibrated jump arc (apex
~97px per build.js line 299 `JUMP_FORCE^2/(2*GRAVITY)`), making a jump-on feel unfair.
**Why:** vertical movers change the effective landing height frame-to-frame.
**How to avoid:** keep vertical travel within a single jump's reach at the worst-case endpoint (the
validator's marginRatio guards horizontal/rise reach); telegraph the far end (§6b rule 4 — the path must
be readable from the ledge you jump from). Confirm at the human checkpoint by actually riding it.

### Pitfall 8: Perf — per-frame `onUpdate` on many movers
**What goes wrong:** dozens of `onUpdate` closures + moving colliders add per-frame cost; the spike's
`OBJECT_BUDGET`/`FPS_FLOOR` (config lines 136/146) matter.
**Why:** all 8 levels get movers (CONTEXT), calm levels lighter.
**How to avoid:** movers/patrollers are single sprites, not tiled masses — count stays tiny vs the ~400
terrain objects/level. Keep density modest (calm odds lighter). `browser-boot.mjs` asserts FPS_FLOOR 40;
watch it after placement.

---

## Code Examples

### Verified: patrol component signature (from the engine)
```js
// Source: lib/kaplay.mjs  function Ca(t={})  (patrol)
patrol({ waypoints: [vec2(x1,y1), vec2(x2,y2)], speed: 60, endBehavior: "ping-pong" })
// require:["pos"]; dt-based moveTo; advances within 3px (sdist<9) of a waypoint;
// "ping-pong" reverses the waypoints array in place.
```

### Verified: native carry — platform side is trivial
```js
// Source: lib/kaplay.mjs  function Da(t={})  (body) + SPIKE-FINDINGS.md measurement
const plat = add([sprite("..."), pos(x0,y0), area(), body({ isStatic:true }), "mover"]);
// rider (player) already has body() with default stickToPlatform → carried automatically.
// DO NOT add moveBy on the platform (measured double-carry slide-off).
```

### Verified: existing respawn seam to reuse (game.js)
```js
// Source: src/scenes/game.js:189-198, 220
function reset() { player.pos = lastCheckpoint.clone(); player.vel = vec2(0);
  player.opacity = 0.2; tween(0.2, 1, 0.18, v => (player.opacity = v), easings.easeOutQuad); }
const respawn = reset;
player.onCollide("spike", () => respawn());        // ← patroller mirrors this exactly
```

### Verified: ambient flicker as a self-cleaning visual loop (no timer)
```js
// Source: src/fx.js idiom (tween().onEnd self-clean) + onUpdate/dt for continuous flicker.
// Continuous torch flicker on an existing Phase-35 light-source prop (e.g. prop-castle-candles,
// prop-town-street-lamp), collider-free, z<0:
let ft = 0;
torch.onUpdate(() => { ft += dt();
  torch.opacity = 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(ft * 9 + Math.sin(ft * 23))); });
// One-shot "unlock" pop on goal/checkpoint reach uses tween(...).onEnd(...) like fx.js — never wait().
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Static world (no movers) | dt-based movers + patrollers on all 8 levels | Phase 36 (this) | First moving gameplay elements |
| Validator blind to movers | `mover-reachability` worst-case-extreme rule | Phase 30 (shipped) | Movers can be placed with a reachability proof |
| Motion authoring undefined | LEVEL-DESIGN §6a/§6b HARD rules | Phase 34 (shipped) | Rules exist BEFORE the first mover |
| Props static single-frame | ambient-animated (torch flicker) | Phase 36 (this) | main.js line 122 already anticipates this ("36 animates torches later") |

**Deprecated/outdated (ignore):** web Kaplay moving-platform tutorials using `wait()`/`loop()`
schedulers; any `kaboom(` snippet; `loadSpriteSheet` (does not exist in 3001).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Patrollers get a NEW `geometry.patrollers` key (Phase 30 only defined `geometry.movers`) | Architecture | If the planner prefers modeling patrollers as `movers` too, the schema differs — but patrollers need the respawn seam + `patrol()`, not carry, so a distinct key is cleaner. Confirm at planning |
| A2 | Patrollers do NOT need reachability validation (contact = respawn, cannot softlock) | No-Softlock | If a patroller could trap the player in an inescapable respawn loop, it would need a check. Judged impossible since contact just respawns at a near checkpoint; confirm via interactive audit |
| A3 | MECH-05 = the alcove persistent ambient change (per CONTEXT), despite `enemy.js`'s header calling defeat-enemy "MECH-05" | MECH-05 | Requirement-ID drift in code comments (secretAlcove.js says "MECH-03/06", enemy.js says "MECH-05"). Follow CONTEXT's definition; flag the stale comment |
| A4 | A new patroller sprite may be needed (must be visually distinct from the Hell hound math-blocker) | Standard Stack | If an existing sprite is reused, no manifest/pink-gate work; if new art, it must pass check-assets-manifest + check-pink-gate. Art choice is discretion, confirmed at human checkpoint |
| A5 | Moving-platform sprite can reuse the biome atlas PLATFORM frame (frame 2) or a small distinct sprite | Standard Stack | Reusing the atlas frame avoids new art; a distinct "this one moves" sprite telegraphs better. Discretion |

**All engine-API and gate claims above are `[VERIFIED]` against `lib/kaplay.mjs`, the committed spike,
or the live gate scripts — the assumptions here are placement/schema/scope choices for the planner.**

---

## Open Questions (RESOLVED)

1. **Patroller schema shape.** — **RESOLVED.**
   - Decision: mirror the mover shape — `geometry.patrollers: [{x1,y1,x2,y2,speed?}]` — keeping both
     excluded-from-freeze motion keys symmetric. Adopted in plan 36-03 (build.js patrol loop) and the
     36-02 audit fixture.

2. **Does the interactive audit need a new "ride the mover / cross the patroller" driver — and WHERE
   does the dispatch live?** — **RESOLVED.**
   - Signals: mover-ride = player x/y tracked the platform for N frames while grounded on it;
     patroller-cross = `respawn()` fired (player pos snapped to `lastCheckpoint`) on contact.
   - Dispatch site (CORRECTED): the real per-encounter tag→driver dispatch is NOT in `deriveEncounters()`
     — it lives in **`scripts/lib/audit-retry.mjs`'s `auditLevelWithRetries`** (the `tag === "secret-alcove"`
     else-branch, ~lines 142-167, plus the non-blocking-break guard at line 175). `deriveEncounters()`
     (mechanic-drive.mjs line 43) only EMITS the encounters; `audit-phase21-mechanics.mjs` only boots the
     browser and calls `auditLevelWithRetries`. So the extension is: add mover/patroller cases to
     `deriveEncounters()` + `driveToMover`/`driveToPatroller` detectors (mechanic-drive.mjs), and add the
     `tag === "mover"`/`tag === "patroller"` dispatch branches + break-exemption in `auditLevelWithRetries`
     (audit-retry.mjs), mirroring the `driveAndDetectAlcove` precedent (mechanic-drive.mjs line 744).
     Adopted in plan 36-02.

3. **Ambient anim ownership — inline in build.js or a small helper?** — **RESOLVED.**
   - Decision: inline the flicker/unlock anims in build.js next to the prop loop (they stay small);
     no separate `motion.js`/`ambient.js` extracted. Keep the a727c13 rule (engine refs inside function
     bodies). Adopted in plan 36-04.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Kaplay `patrol()` | MOT-01 | ✓ | vendored 3001.0.19 | — (source-verified) |
| Kaplay `body({stickToPlatform})` | MOT-02 | ✓ | vendored 3001.0.19 | — (source-verified + measured) |
| Phase-30 `mover-reachability` | MOT-02 no-softlock | ✓ | shipped in reachability.mjs | — |
| Existing light-source props | MOT-03/MECH-05 | ✓ | town-street-lamp, castle-candles, castle-candle-stand | animate existing; add art only if desired |
| Playwright harness | interactive audit | ✓ | resolved dynamically (per CLAUDE.md) | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** a dedicated patroller/mover sprite (optional — reuse existing
art or the atlas platform frame).

---

## Validation Architecture

> Nyquist Dimension 8. The project has NO JS test framework — the gate scripts + browser drivers ARE
> the suite (CLAUDE.md). This section maps Phase-36 behaviors to those gates.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Project gate scripts + Playwright drivers (no JS test framework by canon) |
| Config file | none — gates are standalone scripts |
| Quick run command | `bash scripts/check-safety.sh && node scripts/validate-levels.mjs && node scripts/check-geometry-frozen.mjs` |
| Full suite command | the CLAUDE.md gate list + `node scripts/browser-boot.mjs` + `node scripts/audit-phase21-mechanics.mjs` |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Command | Exists? |
|-----|----------|-----------|---------|---------|
| MOT-01 | Patroller moves + contact respawns, distinct from math-enemy | interactive | `node scripts/audit-phase21-mechanics.mjs` (extend: cross every patroller) | ❌ Wave 0 (audit extension) |
| MOT-02 | Platform carries rider between validated endpoints | static + interactive | `node scripts/validate-levels.mjs` (mover-reachability); audit "ride" | ✅ validator / ❌ ride-audit |
| MOT-02 | No softlock — worst-case-extreme reachable, both endpoints rightward | static | `node scripts/validate-levels.mjs` | ✅ (Phase 30) |
| MOT-03 | Ambient flicker/unlock anims render, no scheduler | static + visual | `bash scripts/check-safety.sh`; `?debug=1` eyeball + screenshot | ✅ safety / manual visual |
| MECH-05 | Alcove discovery → persistent lit ambient, incl. lit-on-entry replay | interactive | audit alcove (Phase 30) + manual replay check | ✅ alcove audit / manual |
| all | Static geometry stays byte-frozen with motion keys present | static | `node scripts/check-geometry-frozen.mjs` | ❌ Wave 0 (exclude motion keys) |
| all | No timers / no punishment anywhere in src/ | static | `bash scripts/check-safety.sh` | ✅ |

### Sampling Rate
- **Per task commit:** `bash scripts/check-safety.sh` + `node scripts/validate-levels.mjs` +
  `node scripts/check-geometry-frozen.mjs`.
- **Per wave merge:** full CLAUDE.md gate list + `node scripts/browser-boot.mjs`.
- **Phase gate:** `node scripts/audit-phase21-mechanics.mjs` (read output, not exit code — every
  mover/patroller encounter must show it was ridden/crossed) + the SC5 human hazard-placement sign-off.

### Wave 0 Gaps
- [ ] `scripts/check-geometry-frozen.mjs` — exclude `movers`/`patrollers` keys from the snapshot.
- [ ] `scripts/lib/mechanic-drive.mjs` — `deriveEncounters()` emit mover + patroller encounters; + `driveToMover`/`driveToPatroller` detectors.
- [ ] `scripts/lib/audit-retry.mjs` — `auditLevelWithRetries` mover/patroller dispatch branches + non-blocking-break exemption (the REAL dispatch site; `audit-phase21-mechanics.mjs` is the boot/nav caller only).
- [ ] (optional) a GREEN mover/patroller companion fixture, if cheap (Phase-30 left this to judgment).
- [ ] Framework install: none (no JS test framework by canon).

---

## Security Domain

Not applicable in the web-app sense: this is a static, offline, single-player browser game with no
backend, no network, no accounts, no user input beyond keyboard controls, and localStorage-only
persistence (CLAUDE.md). No ASVS category (auth/session/access-control/crypto) applies. The relevant
"safety" surface is the ADHD-safety / no-punishment mandate, enforced by `check-safety.sh` (covered in
Validation Architecture). No untrusted input crosses a trust boundary.

---

## Project Constraints (from CLAUDE.md)

- **a727c13:** engine globals (`add`, `patrol`, `body`, `vec2`, `dt`, `tween`, …) referenced ONLY inside
  function bodies, never module top-level. New mover/patroller/ambient code lives inside `buildLevel()`
  / scene callbacks. Enforced by `check-import-safety.sh`.
- **No timers/schedulers** (`setTimeout`/`setInterval`/`wait()`/`loop()`/`lifespan()`) and no punishment
  constructs anywhere in `src/`. Delayed effects use `tween().onEnd()`. Enforced by `check-safety.sh`.
- **All tunables in `src/config.js`** — add `CONFIG.MOVER` / `CONFIG.PATROLLER` blocks; no magic numbers
  in build.js/game.js.
- **`src/math/brain.js` LOCKED** — untouched.
- **Levels are pure data** built by the ONE builder `build.js`; `index.js` stays node-importable.
- **Byte-frozen geometry (34.6):** existing arrays unchanged; motion added via NEW keys + the freeze-gate
  exclusion (Option C).
- **No Kaplay upgrade, no new runtime deps.**
- **Verification standard:** no phase closes on greps/automation alone — interactive proof + the SC5
  human sign-off on hazard placement. "Checks that don't play the game lie."

---

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` — `function Ca` (patrol), `function Da` (body/stickToPlatform), `function Ka`
  (platformEffector) — signatures quoted verbatim above.
- `.planning/research/v6-scouting/SPIKE-FINDINGS.md` + `spike-code/run-spikes.mjs` — measured native
  carry (100% mounted H, full cycle V, clean jump-off), the port-ready dt-sine idiom, the double-carry
  anti-pattern, the validator worst-case-extreme note.
- `src/scenes/game.js` (respawn/reset seam, onCollide idioms), `src/mechanics/secretAlcove.js`
  (MECH-05 seam), `src/mechanics/enemy.js` (math-blocker seam to stay distinct from), `src/levels/build.js`
  (entity emission + props layer), `scripts/check-geometry-frozen.mjs`, `scripts/lib/reachability.mjs`
  (mover-reachability lines 1104–1131, tests 1455–1504), `scripts/check-safety.sh`,
  `docs/LEVEL-DESIGN.md` §5/§6a/§6b/§8.5.
- `.planning/phases/30-*/30-CONTEXT.md` — the `geometry.movers` schema + worst-case-extreme rule +
  fixture design.

### Secondary (MEDIUM confidence)
- `src/main.js` (sprite/anim load pattern; line 122 "36 animates torches later"),
  `src/assets-manifest.js` (existing light-source prop keys), `src/config.js` (tunable structure),
  `scripts/lib/mechanic-drive.mjs` (`deriveEncounters` extension point).

### Tertiary (LOW confidence)
- None — all findings are grounded in the live tree or the committed spike.

---

## Metadata

**Confidence breakdown:**
- Standard stack (patrol/stickToPlatform): HIGH — source-verified in the vendored engine + measured spike.
- Architecture (freeze reconciliation, seam reuse): HIGH — read directly from the gate scripts and game.js.
- Pitfalls: HIGH — derived from LEVEL-DESIGN HARD rules, the spike anti-pattern, and gate mechanics.
- Patroller schema / audit-extension exact signals: MEDIUM — sound plan, exact shape is a planning call.

**Research date:** 2026-07-18
**Valid until:** stable — the engine is pinned and the gates are committed; re-verify only if Kaplay is
bumped (forbidden this phase) or Phase 30/34/35 artifacts change.
