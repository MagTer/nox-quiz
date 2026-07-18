---
phase: 36-world-motion-ambient-life
plan: 03
subsystem: motion-entities
tags: [motion, mover, moving-platform, patroller, patrol, dt-sine, raised-cosine, stickToPlatform, respawn-hazard, MOT-01, MOT-02]
requires:
  - phase: 36-01
    provides: "check-geometry-frozen exclusion of the geometry.movers / geometry.patrollers motion keys (static geometry stays byte-frozen while the motion keys are present)"
  - phase: 36-10
    provides: "assets/patroller.png (8-frame skeleton WALK cycle) baked + registered + loaded under key 'patroller' with anim 'walk'; CONFIG.PATROLLER?.WALK_SPEED optional-chained in main.js"
provides:
  - "src/config.js — CONFIG.MOVER { PERIOD_S, SPRITE, FRAME, WIDTH, HEIGHT, LEDGE_H } and CONFIG.PATROLLER { SPEED, SPRITE, WALK_SPEED } tunable blocks (zero magic numbers in build.js/game.js)"
  - "src/levels/build.js — guarded `for (const m of g.movers ?? [])` dt raised-cosine emit loop (native carry) and `for (const p of g.patrollers ?? [])` patrol() ping-pong loop (distinct 'patroller' tag)"
  - "src/scenes/game.js — player.onCollide('patroller', () => respawn()) mirroring the spike seam"
affects: [36-05, 36-06]
tech-stack:
  added: []
  patterns:
    - "dt raised-cosine ping-pong platform ((1 - cos(2π t/period))/2): reaches EXACTLY (x1,y1)@phase0 and (x2,y2)@phase1 (the two points the Phase-30 validator tests) and eases to REST at both ends — onUpdate+dt() only, no scheduler (SAFE-01)"
    - "Native rider carry: mover is area()+body({isStatic:true}) that mutates pos; the player's own body() stickToPlatform carries the rider with ZERO rider-displacement code (hand-carry is the measured slide-off anti-pattern)"
    - "Fresh per-entity patrol waypoints array literal — 'ping-pong' reverses the array in place, so each patroller gets its own [vec2,vec2] to avoid cross-corruption"
    - "Distinct-tag hazard routing: 'patroller' tag → respawn() seam (gentle checkpoint-respawn), kept separate from the 'enemy' tag → enemy.js math-challenge seam"
key-files:
  created: []
  modified:
    - src/config.js
    - src/levels/build.js
    - src/scenes/game.js
key-decisions:
  - "Mover sprite default = the castle biome atlas PLATFORM ledge frame (CONFIG.MOVER.SPRITE 'atlas-castle', FRAME 2) — a solid stone slab reads as a 'this one moves' platform, and the atlas key is already loaded. Per-mover `sprite`/`w`/`period` descriptor overrides are supported; final art/biome is confirmed at the 36-05 hazard-placement human checkpoint (movers are inert until then)."
  - "Tightened mover collider: area({ shape: new Rect(vec2(0), w, CONFIG.MOVER.LEDGE_H) }) with LEDGE_H 16 matches the opaque top ledge of the 32px-tall PLATFORM frame (lower half transparent), mirroring the 16px static-platform collider so a rider stands on the visible surface, not on empty space. Reuses the existing top-of-buildLevel Rect global guard (a727c13-safe)."
  - "PATROLLER.SPEED default 40 px/s — well under patrol()'s 100 px/s default, per the CONTEXT 'slow + heavily telegraphed' mandate. WALK_SPEED 10fps (8 frames = ~0.8s stride) now defines what main.js's CONFIG.PATROLLER?.WALK_SPEED optional-chain (from 36-10) resolves to."
  - "Reworded the mover loop's anti-pattern comment to avoid the literal token 'moveBy' so the threat-model grep (T-36-05, 'grep asserts zero moveBy in the mover path') reads a clean 0 — the educational intent is preserved ('hand-carrying the rider double-applies and slides it off')."
patterns-established:
  - "dt raised-cosine ping-pong as the sanctioned check-safety-clean moving-platform idiom (endpoint-anchored, eases at both ends, native carry, no scheduler)"
  - "Motion entities read from the freeze-excluded geometry.movers / geometry.patrollers keys and stay inert via ?? [] until a level authors them"
metrics:
  duration: ~25min
  tasks: 3
  files: 3
  completed: 2026-07-18
status: complete
---

# Phase 36 Plan 03: World Motion & Ambient Life — Mover + Patroller Entity Classes Summary

Built the two moving-entity CLASSES the whole phase places, once, in the ONE builder
plus the game scene: the moving platform (dt-based raised-cosine sine ping-pong between
two validated endpoints, native rider-carry) and the patroller (built-in patrol()
ping-pong, distinct "patroller" tag, contact routed through the existing spike→respawn
seam). Both loops are guarded with `?? []` and inert against all 8 shipped levels — no
level authors motion data yet (that is the 36-05 trial). Every structural gate stays
byte-identical-green. The measured anti-patterns (hand-carrying the rider; sharing one
waypoint array; using patrol() for platforms) are avoided by construction.

## What was built

### Task 1 — CONFIG.MOVER + CONFIG.PATROLLER tunable blocks (commit 5e19961)
- `src/config.js`: added `CONFIG.MOVER` and `CONFIG.PATROLLER` adjacent to `ENEMY`.
  - **MOVER** `{ PERIOD_S: 4, SPRITE: "atlas-castle", FRAME: 2, WIDTH: 48, HEIGHT: 32, LEDGE_H: 16 }`
    — the dt raised-cosine round-trip period, the castle-atlas PLATFORM ledge frame,
    the default tiled ledge footprint, and the tightened-collider ledge height. Each
    field is commented with its unit and the rule it serves; per-mover `period`/`sprite`/`w`
    overrides are documented.
  - **PATROLLER** `{ SPEED: 40, SPRITE: "patroller", WALK_SPEED: 10 }` — a slow walk
    speed (well under patrol()'s 100 default), the distinct 36-10 skeleton-walk sprite
    key, and the "walk" anim frame rate main.js already reads via
    `CONFIG.PATROLLER?.WALK_SPEED`.
- No other config block touched.

### Task 2 — build.js mover (dt-sine) + patroller (patrol) emit loops (commit 6f73dc2)
- `src/levels/build.js`, after the props loop inside `buildLevel`:
  - **Mover loop** `for (const m of g.movers ?? [])`: emits
    `sprite(m.sprite ?? CONFIG.MOVER.SPRITE, { frame, tiled, width, height })` +
    tightened `area({ shape: new Rect(vec2(0), w, LEDGE_H) })` + `body({ isStatic: true })`
    tagged `"mover"`, then a closure-local `let t = 0` and a
    `plat.onUpdate(() => { t += dt(); const phase = (1 - Math.cos((2π/period)*t))/2;
    plat.pos.x/y = m.x1/y1 + (m.x2/y2 - m.x1/y1) * phase; })`. Reaches EXACTLY (x1,y1)@0
    and (x2,y2)@1 (the validator's two tested points), eases at both ends. NO
    rider-displacement code — native `stickToPlatform` carry.
  - **Patroller loop** `for (const p of g.patrollers ?? [])`: emits
    `sprite(p.sprite ?? CONFIG.PATROLLER.SPRITE)` + `area()` +
    `patrol({ waypoints: [vec2(p.x1,p.y1), vec2(p.x2,p.y2)], speed, endBehavior: "ping-pong" })`
    tagged `"patroller"` (NOT `"enemy"`), then `foe.play("walk")`. A FRESH per-entity
    waypoints array literal (ping-pong reverses it in place).
  - All engine globals (add, sprite, pos, area, body, patrol, vec2, dt, Rect) stay inside
    `buildLevel` (a727c13). No scheduler; `endBehavior:"ping-pong"` is a string, not the
    banned `loop(` call.

### Task 3 — Wire patroller contact into the existing respawn seam (commit 33b6fae)
- `src/scenes/game.js`: added exactly `player.onCollide("patroller", () => respawn())`
  next to the spike wire (now line 228), reusing the identical reposition-in-place
  `reset()`/`respawn()` contract. ZERO hurt/score/game-over/HP/timer added. Movers need
  no game.js wire — native `stickToPlatform` carries the rider.

## Verification (gates)

| Gate | Result |
|---|---|
| `bash scripts/check-import-safety.sh` | **PASS** — engine globals only inside buildLevel (a727c13) |
| `bash scripts/check-safety.sh` | **PASS** — dt-sine + patrol ping-pong only; no setTimeout/setInterval/wait()/loop()/lifespan(); no punishment construct |
| `node scripts/validate-levels.mjs` | **PASS** — 0 HARD-FAIL (no descriptor authored motion data; loops inert) |
| `node scripts/check-geometry-frozen.mjs` | **PASS** — all 8 levels' geometry byte-identical to the frozen baseline (motion keys excluded per 36-01) |
| `node scripts/browser-boot.mjs` | **PASS** — title → select → all 8 levels loaded with no runtime errors |
| `grep -c "moveBy" src/levels/build.js` | **0** — native carry only (T-36-05 assertion) |
| `grep 'g.movers ?? \[\]'` / `grep 'g.patrollers ?? \[\]'` | present — one guarded loop each |
| `grep 'onCollide("patroller"' src/scenes/game.js` | present — the single respawn wire |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Tightened the mover collider to the visible ledge**
- **Found during:** Task 2.
- **Issue:** The research Pattern 1 emits a bare `area()`, which auto-derives the collider
  from the full 32px-tall rendered sprite — but the PLATFORM frame's lower 16px is
  transparent, so a bare collider would let a rider stand 16px above the visible ledge on
  empty space (an unfair-feel bug when 36-05 places movers).
- **Fix:** Emitted `area({ shape: new Rect(vec2(0), w, CONFIG.MOVER.LEDGE_H) })` with
  `LEDGE_H: 16`, matching the opaque top ledge and the 16px static-platform collider.
  Reuses the existing top-of-buildLevel `Rect` global guard (a727c13-safe).
- **Files modified:** `src/config.js` (LEDGE_H), `src/levels/build.js` (mover area).
- **Commits:** 5e19961, 6f73dc2.

**2. [Rule 3 - Threat-model hygiene] Reworded the anti-pattern comment to keep the moveBy grep at 0**
- **Found during:** Task 2 verify.
- **Issue:** My educational comment referenced the literal token `moveBy`, tripping the
  threat-model assertion (T-36-05: "grep asserts zero moveBy in the mover path") to 1.
- **Fix:** Reworded to "hand-carrying the rider double-applies and slides it off" — the
  warning is preserved and `grep -c "moveBy"` reads a clean 0.
- **Files modified:** `src/levels/build.js`.
- **Commit:** 6f73dc2.

### Design decisions (documented, in-scope discretion)

**3. Mover sprite default = castle atlas PLATFORM frame; per-mover overrides supported**
- The plan left the mover sprite to a "sane existing default confirmed at the human
  checkpoint." Chose the already-loaded `atlas-castle` PLATFORM ledge frame (FRAME 2) — a
  solid stone slab that reads as a moving platform — with `m.sprite`/`m.w`/`m.period`
  per-mover overrides so 36-05 can biome-match/tune without a code change. Movers are
  inert until then.

## Known Stubs

None. Both entity classes are fully wired: the mover renders a real tiled ledge with a
tightened collider and a dt raised-cosine onUpdate; the patroller renders the real
36-10 walk-anim sprite driven by patrol() and routes to respawn(). They are INERT (not
stubbed) — no level authors `geometry.movers`/`geometry.patrollers` yet, by design
(that is the 36-05 trial). The `?? []` guards make the inert state intentional and
gate-clean, not a placeholder.

## Threat Flags

None. No new network endpoint, auth path, file access, or trust boundary — moving sprite
entities + a respawn wire in an offline static browser game. The register's mitigations
hold: T-36-05 (zero moveBy in the mover path — grep 0, native carry), T-36-06 (distinct
"patroller" tag + explicit respawn wire, never the enemy math seam), T-36-07 (dt-sine
onUpdate + patrol ping-pong only, check-safety green), T-36-SC (zero new dependencies).

## Self-Check: PASSED

- Modified files exist: `src/config.js`, `src/levels/build.js`, `src/scenes/game.js` (3/3).
- Commits exist in git log: 5e19961 (config), 6f73dc2 (build.js loops), 33b6fae (game.js wire).
- Wiring verified: CONFIG.MOVER + CONFIG.PATROLLER present (node import check); `g.movers ?? []`
  (build.js:496) + `g.patrollers ?? []` (build.js:533) guarded loops present; `moveBy` count 0;
  `onCollide("patroller"` (game.js:228) present.
- All gates green: check-import-safety, check-safety, validate-levels, check-geometry-frozen,
  browser-boot.
