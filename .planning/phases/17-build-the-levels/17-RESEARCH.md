# Phase 17: Build the Levels - Research

**Researched:** 2026-07-03
**Domain:** Hand-authored 2D platformer level data for Kaplay 3001.0.19
**Confidence:** HIGH

## Summary

Phase 17 is a pure content-authoring phase on a completed v3.0/v4.0 spine. Every technical seam it needs already exists and is validated: the plain-JS level descriptor schema (`src/levels/level-01.js`), the parameterized builder (`src/levels/build.js`), the registry (`src/levels/index.js`), the four mechanic modules (`src/mechanics/*.js`), the shared challenge seam (`src/ui/challenge.js`), and the camera-follow utility (`src/camera.js`).

No new runtime dependencies, no new engine primitives, and no new math/physics tuning are required. The only "research" needed was pattern verification: confirming that new level modules can import only `../config.js`, keep all geometry inside the established schema, and be registered with one import + one array append. All of this is already demonstrated by the shipped `level-01` descriptor and the Phase 13–16 mechanic wiring.

The one minor extension is per-level camera bounds: `src/camera.js` currently clamps to global `CONFIG.LEVEL_*` constants. Adding an optional `bounds` argument that defaults to those constants is a backward-compatible, low-risk change consumed by `src/scenes/game.js`.

**Primary recommendation:** Author three new descriptors using the exact schema of `level-01`, ramp length/gap/hazard density per CONTEXT.md D-04..D-07, register them in `LEVEL_ORDER`, update the regression smoke fixture, and verify with the real-browser boot script.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Level geometry data | Static JS module (`src/levels/level-NN.js`) | — | Pure data, no engine refs at module scope (a727c13) |
| Level instantiation | Builder (`src/levels/build.js`) | Scene (`src/scenes/game.js`) | Builder creates tagged entities; scene wires handlers |
| Level registry / unlock | Registry (`src/levels/index.js`) | Progress (`src/progress.js`) | Unlock derived from `LEVEL_ORDER` + cleared facts |
| Per-level camera bounds | Camera utility (`src/camera.js`) | Scene (`src/scenes/game.js`) | Scene passes `level.bounds` into `followCamera` |
| Mechanic wiring | Mechanic modules (`src/mechanics/*.js`) | Scene (`src/scenes/game.js`) | Scene calls `wire*` with closure-local player/brain |
| Completability verification | Browser boot (`scripts/browser-boot.mjs`) | Human playtest | Automated boot catches runtime errors; human verifies feel |

## Standard Stack

No new packages. The phase uses only the existing vendored Kaplay 3001.0.19 stack and project modules.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay (vendored `lib/kaplay.mjs`) | 3001.0.19 | Engine primitives | Project-wide locked engine; no upgrade |
| Project `CONFIG` | — | All tuning constants | Single source of truth for jump distances, sizes, bounds |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| New level format / Tiled parser | Custom format or external tool | Plain JS descriptor + `buildLevel` | Project already enforces no Tiled, no `addLevel`, no build step |
| New mechanic for level variety | Invent new math interaction | Reuse door/gate/enemy/collect data slots | Four mechanics already wired to the shared challenge seam |
| New camera clamp logic | Per-level hardcoded clamps | Extend `followCamera(target, bounds?)` | Keeps one camera utility; default preserves current behavior |

## Common Pitfalls

### Pitfall 1: Engine global at module top level (a727c13 regression)
**What goes wrong:** A new level module references `add`, `rect`, `pos`, etc. at module scope. This throws at import and blanks the canvas because Kaplay globals exist only after `kaplay()` runs.
**Why it happens:** Copy-paste from `build.js` or `game.js` into a data module.
**How to avoid:** Each new `src/levels/level-NN.js` must import ONLY `../config.js` and contain no engine symbols. Use `CONFIG` expressions (e.g., `CONFIG.FLOOR_Y - CONFIG.SPIKE_SIZE`) for derived coordinates.
**Warning signs:** `scripts/check-import-safety.sh` flags top-level engine refs in `src/levels/*.js` only if they are added to the scoped scan; the Wave-0 task must run the gate and confirm green.

### Pitfall 2: Gaps exceed reachable jump distance
**What goes wrong:** A later level's gap is wider than the tuned `RUN_SPEED`/`JUMP_FORCE`/`GRAVITY` arc can clear, making the level impossible.
**Why it happens:** Ramping difficulty by widening gaps without measuring against the existing physics tune.
**How to avoid:** Keep gap widths within the v3.0-stress-tested envelope (~160 px horizontal with appropriate platform stepping). Place platforms so the player can land with margin; never require a frame-perfect jump.
**Warning signs:** Browser-boot or manual playtest cannot reach the goal; player falls past `LEVEL_BOTTOM + FALL_MARGIN` repeatedly at the same gap.

### Pitfall 3: Checkpoint not placed before a hazard or mechanic
**What goes wrong:** A spike, door, gate, enemy, or collect zone has no preceding checkpoint, so a wrong answer or respawn costs meaningful forward progress.
**Why it happens:** Authoring geometry without cross-referencing `checkpoints` against every hazard/mechanic position.
**How to avoid:** For every spike, place a checkpoint at `x ≈ spike.x - 80` (or earlier) on the same run. For each mechanic, place a checkpoint just before its trigger so re-asking never rewinds progress.
**Warning signs:** Kid-testers complain a mistake sends them "back really far."

### Pitfall 4: Smoke fixture drifts from authored geometry
**What goes wrong:** `scripts/smoke-progress.mjs` has an `expectedGeometry` deep-equal check for `level-01`; adding new levels without updating the fixture causes the LVL-02 regression to fail.
**Why it happens:** New geometry arrays are not mirrored in the smoke's expected fixture.
**How to avoid:** Include a task that appends each new level's `geometry` object to the smoke fixture and run `node scripts/smoke-progress.mjs` as the verification command.
**Warning signs:** `node scripts/smoke-progress.mjs` fails with a geometry mismatch on `level-02`/`level-03`/`level-04`.

### Pitfall 5: Camera clamp shows void on long levels
**What goes wrong:** A level longer than `CONFIG.LEVEL_RIGHT` (2240) is authored but camera still clamps to the global constant, showing empty space beyond the right edge or clamping too early.
**Why it happens:** `followCamera` ignores the level's actual extent.
**How to avoid:** Add `bounds` to each descriptor and update `followCamera(target, bounds?)` + `game.js` to pass it. Default to `CONFIG.LEVEL_*` when `bounds` is absent so `level-01` behavior is unchanged.
**Warning signs:** Browser boot shows black void on the right side of level-04, or camera stops before the goal comes into view.

## Code Examples

### Backward-compatible per-level camera bounds

Source: `src/camera.js` current implementation + project config.

```js
export function followCamera(target, bounds) {
  const b = bounds ?? {
    left: CONFIG.LEVEL_LEFT,
    right: CONFIG.LEVEL_RIGHT,
    top: CONFIG.LEVEL_TOP,
    bottom: CONFIG.LEVEL_BOTTOM,
  };
  // ... existing smoothing logic ...
  nx = clamp(nx, b.left + halfW, b.right - halfW);
  ny = clamp(ny, b.top + halfH, b.bottom - halfH);
  setCamPos(nx, ny);
}
```

### Descriptor schema (mirrors `src/levels/level-01.js`)

Source: `src/levels/level-01.js`.

```js
import { CONFIG } from "../config.js";

const FLOOR_Y = CONFIG.FLOOR_Y;

export const LEVEL_02 = {
  id: "level-02",
  displayName: "The Rusted Climb",
  allowedTables: [1, 2, 3, 4, 5, 6, 7],
  bounds: {
    left: 0,
    right: 2800,
    top: 0,
    bottom: 360,
  },
  geometry: {
    floors: [/* ... */],
    platforms: [/* ... */],
    coins: [/* ... */],
    spikes: [/* ... */],
    goal: { x: 2720, y: FLOOR_Y - CONFIG.GOAL_SIZE },
    checkpoints: [/* ... */],
    doors: [/* ... */],
    mathGates: [/* ... */],
    enemies: [],
    collectZones: [],
    answerPickupSlots: [],
  },
  theme: null,
  parallax: null,
};
```

### Registry append (mirrors `src/levels/index.js`)

Source: `src/levels/index.js`.

```js
import { LEVEL_01 } from "./level-01.js";
import { LEVEL_02 } from "./level-02.js";
import { LEVEL_03 } from "./level-03.js";
import { LEVEL_04 } from "./level-04.js";

const LEVELS = [LEVEL_01, LEVEL_02, LEVEL_03, LEVEL_04];
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Static suite + smoke | ✓ | v22.22.2 | — |
| Playwright/Chromium | `scripts/browser-boot.mjs` | ✓ | bundled in gsd-pi | — |
| Kaplay (vendored) | Runtime | ✓ | 3001.0.19 | — |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | plain Node.js ES modules (no test dependency) |
| Config file | none |
| Quick run command | `node scripts/smoke-progress.mjs` |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs && node scripts/browser-boot.mjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LVL-01 | 3–5 distinct, completable levels registered | smoke + browser | `node scripts/smoke-progress.mjs` / `node scripts/browser-boot.mjs` | ✅ existing |
| LVL-04 | Platforming difficulty ramp (length/gaps/hazards) | manual / browser | `node scripts/browser-boot.mjs` + human playtest | ✅ existing |

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements.

## Security Domain

No new trust boundaries, no external packages, no user input parsing. Phase 17 is pure level data and one backward-compatible camera helper change. No additional ASVS categories apply.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Existing `RUN_SPEED`/`JUMP_FORCE`/`GRAVITY` can clear gaps up to ~160 px with platform assistance | Common Pitfalls | Level becomes impossible; mitigated by manual/browser verification |
| A2 | `scripts/browser-boot.mjs` can be extended to navigate multiple levels via localStorage pre-seed | Validation Architecture | Manual verification fallback in Plan 03 checkpoint |

## Open Questions (RESOLVED)

1. **How many levels?** — RESOLVED: 4 total (D-01), keeping `level-01` as the first.
2. **How to handle camera bounds for longer levels?** — RESOLVED: optional per-level `bounds` field with default fallback to `CONFIG.LEVEL_*` (D-04).
3. **Which mechanics go in which level?** — RESOLVED per D-10.

## Sources

### Primary (HIGH confidence)
- `src/levels/level-01.js` — canonical descriptor schema and v3.0 geometry
- `src/levels/build.js` — builder contract for floors, platforms, coins, spikes, goal, doors, gates, enemies, collect zones
- `src/levels/index.js` — registry/derived-unlock contract
- `src/camera.js` — current clamp logic and frame-rate-independent smoothing
- `src/scenes/game.js` — how `followCamera`, `buildLevel`, and mechanic wiring are invoked
- `src/config.js` — all tuning constants that constrain reachable geometry

### Secondary (MEDIUM confidence)
- `scripts/smoke-progress.mjs` — existing LVL-02 regression fixture pattern
- `scripts/browser-boot.mjs` — current automated browser verification pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, existing Kaplay vendored stack
- Architecture: HIGH — patterns already shipped in Phases 13–16
- Pitfalls: HIGH — documented from v3.0 and Phase 13–16 lessons

**Research date:** 2026-07-03
**Valid until:** 2026-08-03 (stable stack)
