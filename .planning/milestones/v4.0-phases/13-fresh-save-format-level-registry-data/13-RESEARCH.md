# Phase 13: Fresh Save Format + Level Registry/Data - Research

**Researched:** 2026-06-29
**Domain:** Pure ES2020 module design — versioned localStorage save format + level data registry/builder for a vendored-Kaplay platformer (no build step, no new dependencies)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Save format (SAVE-05/06/07) — clean reset, no migration**
- A NEW versioned localStorage key (bump from the v3.0 `mathlab_platformer_v1`); the v3.0 save is deliberately **NOT** migrated — her XP/level/weak-spot history resets when v4.0 ships (clean slate). Removes all migration complexity and the save-bricking risk.
- A missing, stale, foreign, or corrupt save loads safe defaults and NEVER bricks boot — keep the existing isFinite/shape guards (the v3.0 WR-01 lesson) and the guarded localStorage seam (try/catch, storageAvailable).
- Per-level persistence stores ONLY `cleared` facts per level id. `unlocked` is **derived** from `LEVEL_ORDER` (level 1 always unlocked; level N unlocks when N-1 is cleared) — never stored as a second source of truth.
- XP / level / per-table practice history continue to persist within the fresh save and seed `createBrain({ seedAccuracy, seedHistory })` so weak-spot adaptation resumes across visits.

**Level registry + builder (LVL-02)**
- Levels are plain-JS data modules. ONE parameterized `buildLevel(levelData)` consumes them. Registered in an ordered registry exposing `LEVEL_ORDER`. NO Kaplay `addLevel` (its per-tile colliders would undo the validated merged-floor anti-seam-stick spine + tightened spike hitbox), NO Tiled, NO build step.
- v3.0's existing single level lifts in **verbatim** as `level-01` — preserve the merged-floor colliders and the tightened spike hitbox exactly.
- **Forward-looking level-descriptor schema:** each level record carries `id`, `displayName`, the geometry, `allowedTables`, PLUS optional/empty placeholder slots that later phases populate — `mechanics` (Phase 15/16), `theme`/`tileset` + `parallax`/`background` (Phase 18). The builder ignores unset optional fields, so Phases 14–18 fill fields instead of reshaping the format.
- `allowedTables` per level is the difficulty seam (LVL-03 later): it's passed into `createBrain(...)` — the LOCKED 6–9 weighting algorithm in `math/brain.js` is NEVER touched.

**Firewalls / safety**
- `progress.js` stays PURE + node-testable: `createProgress(saved)` factory never reads storage at construction; the load/write/storageAvailable seam is defined-not-called at import.
- The registry + builder data modules stay a727c13-safe — no Kaplay global (or `typeof <global>` guard) at module top level; `buildLevel` uses engine globals only when called at scene time (mirror the existing `level.js`, which moved its `Rect` guard INSIDE `buildLevel`).

### Claude's Discretion
- Exact new save key name + version int.
- Exact module/file layout under `src/levels/` (e.g. `index.js` registry, `build.js` builder, `level-01.js` data).
- Exact field names within the descriptor schema.

### Deferred Ideas (OUT OF SCOPE)
- Title + level-select scenes, game.js parametrized by levelId (Phase 14).
- Shared challenge seam + mechanics (Phases 15/16).
- Additional authored levels + platforming difficulty ramp (Phase 17).
- Art/animation + parallax, theme/tileset fields populated (Phase 18).
- Stars / scoring / completion texture (out of scope, v4.0).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAVE-05 | Fresh, versioned save format (new key/version); v3.0 NOT migrated; a stale/foreign save never bricks the game | Extend the existing `loadSave`/`writeSave`/`validate`/`storageAvailable` seam in `progress.js` (already version-gated, try/catch-guarded, isFinite-guarded). Bump `CONFIG.SAVE.KEY` to a new key + `VERSION` to 2. A new key means the v3.0 blob is invisible by definition; the version gate is a second guard. See "Save Format Architecture" + Pitfall 1. |
| SAVE-06 | Per-level completion (cleared) + derived unlock persist and resume | Add a `levels: { <id>: { cleared: bool } }` map to the save shape + a `validate` branch for it; add a derived-unlock helper `isUnlocked(id)` reading `LEVEL_ORDER` from the registry. Store ONLY `cleared`; never store `unlocked`. See "Per-Level Progress" + Pitfall 4. |
| SAVE-07 | XP/level + per-table practice history persist within the fresh save, keep selection adapted | Already shipped in `progress.js` serialize/validate (`xp`, `level`, `accuracy`, `history`) and wired into `createBrain({ seedAccuracy, seedHistory })`. Preserve verbatim under the new key. See "What Already Works." |
| LVL-02 | Levels = plain JS data + one parameterized builder + ordered registry; no build step, no `addLevel`, no Tiled | Generalize `level.js` → `src/levels/build.js` (`buildLevel(levelData)`) + `src/levels/level-01.js` (verbatim geometry) + `src/levels/index.js` (ordered registry exposing `LEVEL_ORDER` + `getLevel(id)`). See "Level Registry Architecture" + Code Examples. |
</phase_requirements>

## Summary

This is a **pure-modules refactor + extension phase** grounded entirely in shipped, kid-validated v3.0 code. There is zero external research surface: no new packages, no new runtime dependencies, no framework decisions — the project canon is vanilla ES2020 modules, vendored Kaplay 3001.0.19 (pinned), and no build step. Every pattern this phase needs already exists in the codebase and merely needs generalizing.

Two deliverables: (1) extend the already-versioned, already-guarded save seam in `src/progress.js` to a NEW key with a `levels` cleared-map + a derived-unlock helper, keeping the pure-factory firewall intact; (2) split `src/level.js` into a `src/levels/` directory — one parameterized `buildLevel(levelData)`, one verbatim `level-01.js` data module, and an ordered `index.js` registry exposing `LEVEL_ORDER`. A forward-looking level-descriptor schema carries optional empty placeholder slots (`mechanics`, `theme`/`tileset`, `parallax`) that Phases 15–18 will populate without reshaping the format.

The dominant risks are **not** technical novelty — they are regression risks against three hard-won invariants: the a727c13 import-time-global trap (engine globals only inside `buildLevel`'s body), the merged-floor anti-seam-stick collider spine (do NOT switch to `addLevel`), and the never-brick-on-bad-save mandate (keep the isFinite/shape guards). The phase is sequenced first precisely because it has no a727c13 risk in its own logic, but the lift of `level.js` MUST preserve the `Rect`-guard-inside-`buildLevel` placement exactly.

**Primary recommendation:** Generalize, don't rewrite. Move `level.js`'s `buildLevel` into `src/levels/build.js` taking `levelData` as its sole argument with the `Rect` guard kept inside the function body; lift the `LEVEL` object verbatim into `src/levels/level-01.js` wrapped in the new descriptor schema; build `src/levels/index.js` as an ordered array → `LEVEL_ORDER` + `getLevel(id)`. Extend `progress.js`'s existing save seam to a new key (`mathlab_platformer_v2`, VERSION 2) with a `levels` cleared-map + `isLevelCleared`/`markCleared`/`isUnlocked` helpers. Extend the headless smoke + structural greps to cover the new shape and registry. End with a real browser boot loading `level-01` from the registry under the new key.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| XP/level math + threshold curve | Pure module (`progress.js` factory) | — | Already pure + node-testable; no engine, no storage at construction |
| Save load/validate/write seam | Pure module (`progress.js` guarded seam) | Browser localStorage | localStorage lives ONLY behind `storageAvailable`/`loadSave`/`writeSave`, defined-not-called at import (keeps the module node-importable) |
| Per-level cleared facts | Pure module (save shape + helpers) | Browser localStorage | Stored fact; persisted via the same guarded seam |
| Derived unlock state | Pure module (registry + helper) | — | Computed from `LEVEL_ORDER` + cleared map — never stored (one source of truth) |
| Level geometry data | Pure data module (`levels/level-01.js`) | — | Plain JS object literal; no engine references at all |
| Level instantiation (`buildLevel`) | Engine-time function body (`levels/build.js`) | Kaplay globals | Engine globals (`add`, `rect`, `Rect`, `sprite`, `vec2`...) used ONLY inside the function, called at scene time (a727c13 rule) |
| Level registry / ordering | Pure module (`levels/index.js`) | — | Plain array + lookup; imports only the data modules, no engine |
| Brain difficulty seam (`allowedTables`) | Pure data field → pure brain | — | `allowedTables` is a data field; `createBrain`/`calculateWeights` already accept it — wired for real in Phase 16 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JavaScript | ES2020+ | All module logic | Project canon (CLAUDE.md): zero deps, no build step. `[CITED: ./.claude/CLAUDE.md]` |
| ES modules (native `import`/`export`) | Living std | Module boundaries between `progress.js`, `levels/*` | Already the project's module system (`src/main.js` imports `../lib/kaplay.mjs` + sibling modules). `[VERIFIED: src/main.js]` |
| localStorage API | Native | Versioned save persistence | Already in use behind the guarded seam in `progress.js`. `[VERIFIED: src/progress.js]` |
| Kaplay | 3001.0.19 (pinned) | Engine globals consumed by `buildLevel` at scene time only | Pinned + sha256-recorded; any upgrade is its own scoped task. NOT touched by this phase except the `buildLevel` lift. `[VERIFIED: .planning/STATE.md, lib/kaplay.mjs header]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node (built-in, for harness only) | — | Runs `scripts/smoke-progress.mjs` headlessly | The "unit test" layer for pure modules — no framework. `[VERIFIED: scripts/smoke-progress.mjs]` |
| Bash + grep | — | Structural verification gates (`check-progress.sh`) | The "static analysis" layer — encodes firewalls/contracts as fail-fast greps. `[VERIFIED: scripts/check-progress.sh]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One parameterized `buildLevel(levelData)` | Kaplay `addLevel(symbolMap)` | REJECTED (locked): `addLevel` emits per-tile colliders, which would undo the validated merged-floor anti-seam-stick spine + the tightened spike hitbox. `[CITED: 13-CONTEXT.md]` |
| Plain-JS data modules | Tiled JSON / a level editor | REJECTED (locked): adds a build/asset step, breaks the no-build canon. `[CITED: REQUIREMENTS.md Out of Scope]` |
| Derived unlock from `LEVEL_ORDER` | Storing `unlocked` per level | REJECTED (locked): a second source of truth desyncs with reality; derive it. `[CITED: STATE.md Key Decisions]` |
| Migrating v3.0 save | Additive v1→v2 migration | REJECTED (locked): clean reset by user decision; removes bricking risk entirely. `[CITED: REQUIREMENTS.md SAVE-05]` |

**Installation:**
```bash
# None. Zero dependencies, no build step, no package manager.
# The project has no package.json; modules are loaded natively by the browser
# and run headlessly by node for the smoke harness.
```

**Version verification:** N/A — this phase installs no packages. The only versioned dependency (Kaplay 3001.0.19) is vendored, pinned, sha256-recorded in `lib/kaplay.mjs`, and explicitly out of scope to change. `[VERIFIED: src/main.js import, STATE.md]`

## Package Legitimacy Audit

> Not applicable. This phase installs **zero external packages** (no package.json, no dependencies, no build step — project canon per CLAUDE.md). The only third-party code is the already-vendored, pinned, sha256-verified Kaplay 3001.0.19 bundle, which this phase does not add, change, or upgrade.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                        IMPORT TIME (node-safe / hoisted before kaplay init)
  ┌──────────────────────────────────────────────────────────────────────┐
  │  config.js  ──leaf constants──►  progress.js (pure factory + seam)     │
  │      │                                  │                              │
  │      │                                  ├─ createProgress(saved)  PURE │
  │      │                                  ├─ loadSave/writeSave  (defined,│
  │      │                                  │     not called — guarded)     │
  │      │                                  └─ levels-cleared helpers       │
  │      │                                                                  │
  │      └─leaf constants─► levels/level-01.js (plain DATA, no engine)      │
  │                                  │                                      │
  │                         levels/index.js  ──►  LEVEL_ORDER, getLevel(id) │
  │                                                                         │
  │                         levels/build.js  buildLevel(levelData)          │
  │                            (engine globals referenced but NOT executed) │
  └──────────────────────────────────────────────────────────────────────┘
                                      │
                       kaplay({ global:true }) installs add/rect/Rect/... (main.js)
                                      │  go("game", { levelId })
                                      ▼
                        SCENE TIME (engine globals now exist)
  ┌──────────────────────────────────────────────────────────────────────┐
  │  scenes/game.js                                                        │
  │    const saved   = loadSave()            ── reads NEW versioned key    │
  │    const level   = getLevel(data.levelId ?? LEVEL_ORDER[0])            │
  │    const progress= createProgress(saved)                              │
  │    const brain   = createBrain({ seedAccuracy, seedHistory,           │
  │                                  allowedTables: level.allowedTables }) │
  │    buildLevel(level)  ◄── Rect guard runs HERE (after kaplay init)     │
  │    ...on clear:  progress.markCleared(level.id)                        │
  │                  writeSave(progress.serialize(brain.snapshot()))       │
  └──────────────────────────────────────────────────────────────────────┘
```

The critical seam is the IMPORT-TIME / SCENE-TIME boundary: every module above the kaplay-init line must be evaluable with no engine present (node-safe). `buildLevel` may *reference* engine globals in its body but must not *execute* any at module top level. `[VERIFIED: src/level.js, src/main.js, a727c13 commit]`

### Recommended Project Structure
```
src/
├── config.js              # add CONFIG.SAVE new key/version; any registry constants
├── progress.js            # extend: new key + levels-cleared map + derived-unlock helper
├── level.js               # DELETE after lift (or leave a re-export shim — discretion)
├── levels/                # NEW directory
│   ├── index.js           # ordered registry: LEVEL_ORDER (ids) + getLevel(id)
│   ├── build.js           # buildLevel(levelData) — generalized from level.js, Rect guard INSIDE
│   └── level-01.js        # v3.0 LEVEL geometry, lifted VERBATIM, wrapped in the descriptor schema
└── scenes/
    └── game.js            # rewire: load level by id from registry, mark cleared, write new save
```

Note: `src/levels/` is **two** directories below the repo root and **one** below `src/`. Mind the relative-import depth (the same gotcha `brain.js` notes: it lives in `src/math/` so imports `../config.js`; `progress.js` lives in `src/` so imports `./config.js`). Modules in `src/levels/` import `../config.js`. `[VERIFIED: src/math/brain.js, src/progress.js comments]`

### Pattern 1: Pure factory + defined-not-called guarded seam (the firewall)
**What:** Pure construction functions take an already-loaded plain object and never touch storage; the storage seam (`storageAvailable`/`loadSave`/`writeSave`) is defined at module scope but only *called* by the scene at runtime.
**When to use:** Every module that must remain node-importable for the headless smoke (`progress.js`, `levels/*`).
**Example:**
```javascript
// Source: src/progress.js (shipped) — the existing, validated idiom to preserve
export function createProgress(saved) {        // PURE: never reads localStorage
  let xp    = saved && Number.isFinite(saved.xp)    && saved.xp >= 0 ? saved.xp : 0;
  let level = saved && Number.isFinite(saved.level) && saved.level >= 1
                ? Math.floor(saved.level) : 1;
  // ...returns getters + addXp + serialize...
}
function storageAvailable() {                  // defined, not called at import
  try { return typeof localStorage !== "undefined" && localStorage !== null; }
  catch { return false; }
}
export function loadSave() {                    // called only by the scene at runtime
  if (!storageAvailable()) return defaults();
  // ...try/catch JSON.parse, version-gate, validate()...
}
```

### Pattern 2: a727c13 — engine global guard INSIDE the function body
**What:** Kaplay installs its globals (`add`, `rect`, `Rect`, `sprite`, `vec2`, `area`, `body`...) only when `kaplay({ global: true })` runs in `main.js`. ES `import`s are hoisted, so any module evaluated at import time runs BEFORE that. A `typeof Rect` check at module top level therefore ALWAYS throws at import. Keep the fail-loud guard inside `buildLevel`, where it runs at scene-construction time after the engine exists.
**When to use:** `levels/build.js` — the ONLY module in this phase that references engine globals.
**Example:**
```javascript
// Source: src/level.js (shipped, fixed in a727c13) — preserve this placement
export function buildLevel(level) {
  if (typeof Rect === "undefined") {           // guard INSIDE the body, NOT module top level
    throw new Error("build.js: Kaplay global `Rect` missing — check kaplay({global})/version");
  }
  for (const run of level.floors) {
    add([ rect(run.w, CONFIG.FLOOR_THICKNESS), pos(run.x, FLOOR_Y),
          area(), body({ isStatic: true }), "ground" ]);
    // ...
  }
}
```

### Pattern 3: Forward-looking descriptor schema with optional placeholder slots
**What:** Each level record carries required fields (`id`, `displayName`, geometry, `allowedTables`) plus optional empty slots later phases populate. `buildLevel` ignores unset optional fields so Phases 15–18 fill fields instead of reshaping the format.
**When to use:** `levels/level-01.js` and every future level module.
**Example:**
```javascript
// Source: synthesized from 13-CONTEXT.md decisions + src/level.js geometry
import { CONFIG } from "../config.js";
const FLOOR_Y = CONFIG.FLOOR_Y;
export const LEVEL_01 = {
  id: "level-01",
  displayName: "The First Descent",          // copy is discretion; placeholder fine
  allowedTables: [6, 7, 8, 9],               // difficulty seam — wired for real in Phase 16 (LVL-03)
  geometry: {                                 // v3.0 LEVEL lifted VERBATIM
    floors:    [ /* { x, w } ... */ ],
    platforms: [ /* { x, y, w, h } ... */ ],
    coins:     [ /* { x, y } ... */ ],
    spikes:    [ /* { x, y } ... */ ],
    goal:      { /* { x, y } */ },
    checkpoints: [ /* { x, y } ... */ ],
  },
  // --- optional placeholder slots later phases populate; buildLevel ignores unset ones ---
  mechanics:  [],        // Phase 15/16: locked-door/key, gates, collect-answer, defeat-enemy
  theme:      null,      // Phase 18: tileset id
  parallax:   null,      // Phase 18: layered/parallax background config
};
```

### Anti-Patterns to Avoid
- **Switching to Kaplay `addLevel` / symbol maps:** would replace merged-floor colliders with per-tile colliders → reintroduces seam-stick (Pitfall 2 from Phase 9). LOCKED out.
- **A top-level `typeof Rect`/engine guard in any `levels/*` module:** throws at import, blanks the game on every load (the exact a727c13 bug). Guard goes inside `buildLevel`.
- **Storing `unlocked` per level:** second source of truth → desync. Derive from `LEVEL_ORDER` + cleared facts.
- **Spreading/`Object.assign` an untrusted parsed save:** prototype-pollution vector (T-01-01). Copy named, range-checked keys only (existing `validate()` idiom).
- **Reading localStorage inside a factory or at module top level:** breaks node-importability of the smoke. Storage lives only behind the guarded seam.
- **Reusing the v3.0 key `mathlab_platformer_v1`:** the clean reset needs a NEW key so old data is invisible (a stale v1 blob also fails the new version gate, but a new key is the primary guard).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Save validation / corrupt-save tolerance | A fresh validator | The shipped `validate()` + `loadSave()` try/catch/version-gate in `progress.js` | Already handles missing/corrupt-JSON/version-mismatch/throwing-getItem/Infinity-level; just extend it with the `levels` branch. `[VERIFIED: src/progress.js]` |
| Weighted question selection / difficulty | Any selection logic | The LOCKED `createBrain` — pass `allowedTables` (already supported by `calculateWeights`) | `brain.js` is validated and out of scope to change; `calculateWeights(allowedTables)` already filters the pool. `[VERIFIED: src/math/brain.js lines 128-161]` |
| XP/level curve | New XP math | The shipped `createProgress` addXp/threshold/serialize | Verbatim-ported validated v1/v2 values; do not re-tune. `[VERIFIED: src/progress.js + config.js]` |
| Level collider construction | New collider scheme | The merged-floor + tightened-spike `buildLevel` body | The anti-seam-stick + anti-tunnel spine is hard-won (Phase 8/9). Lift it, don't redesign. `[VERIFIED: src/level.js]` |
| Storage availability / quota handling | New try/catch | The shipped `storageAvailable()` + `QuotaExceededError` catch in `writeSave` | Handles node (no localStorage), sandboxed iframes, full quota — never throws into the loop. `[VERIFIED: src/progress.js]` |

**Key insight:** Almost every "new" capability in this phase is a generalization of an existing, validated seam. The phase's value is *structural* (split + extend + a forward-compatible schema), not *algorithmic*. The biggest mistake would be rewriting validated logic during the move.

## Runtime State Inventory

> This phase is a rename/refactor/extension of a module split (`level.js` → `levels/`) AND a save-key change. Runtime-state audit applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Browser localStorage key `mathlab_platformer_v1` (v3.0 save: `{version:1, xp, level, accuracy, history}`) lives in the kid's browser. The clean-reset writes a NEW key (`mathlab_platformer_v2`), so the old key is simply abandoned — NOT migrated, NOT deleted. | Code edit only (new key). Decision (locked): leave the v1 key untouched/orphaned; do NOT read or delete it. Optionally note it as harmless dead data. |
| Live service config | None — local-only/offline app, no backend, no external services. | None — verified by STATE.md "Local-only / offline; no backend." |
| OS-registered state | None — no scheduled tasks, daemons, or OS registrations (a static site served by nginx in a container; this phase touches only `src/`). | None — verified: no task scheduler / launchd / systemd references in repo. |
| Secrets/env vars | None — no secrets, no env vars referencing level ids or save keys. The save key is a plain string in `config.js`. | None — verified: `CONFIG.SAVE.KEY` is the only reference, a code constant. |
| Build artifacts / installed packages | None — no build step, no package.json, no compiled output, no egg-info/dist. The vendored `lib/kaplay.mjs` is unchanged. | None — verified: no build pipeline exists (CLAUDE.md no-build canon). |

**Code references to the changing names (grep targets for the planner):**
- `mathlab_platformer_v1` appears in `src/config.js` (`CONFIG.SAVE.KEY`) and is grep-asserted in `scripts/check-progress.sh` line 41 — **both** must update to the new key, or the structural gate will fail. `[VERIFIED: grep of repo]`
- `from "../level.js"` / `from "./level.js"` import sites: `src/scenes/game.js` imports `{ LEVEL, buildLevel } from "../level.js"`. After the split this becomes imports from `../levels/index.js` / `../levels/build.js`. `[VERIFIED: src/scenes/game.js line 22]`
- `CONFIG.SAVE.VERSION` is read in `progress.js` (`serialize`, `loadSave` gate) and asserted in `smoke-progress.mjs` (`blob.version === CONFIG.SAVE.VERSION`) — the version bump is automatically consistent because the smoke reads the constant, not a literal. `[VERIFIED: scripts/smoke-progress.mjs line 86]`

**The canonical question — after every file is updated, what runtime state still holds the old name?** Only the kid's browser still has the `mathlab_platformer_v1` localStorage entry. By design (clean reset) that entry is abandoned, not migrated — the new key makes it invisible. No other runtime system caches the old name.

## Common Pitfalls

### Pitfall 1: A stale or foreign save bricks boot
**What goes wrong:** A leftover v1 blob, a corrupt JSON string, or a `{"level":1e400}` (parses to `Infinity`) gets read and either throws or permanently freezes progression (Infinity passes a bare `>= 1` check and the level-up loop's `xp >= threshold(Infinity)` is never true).
**Why it happens:** Forgetting to apply the same finite+shape guards to the new save shape, or assuming a new key means no bad data can arrive (a hand-edited/extension-injected blob can).
**How to avoid:** Reuse the existing `validate()` + `Number.isFinite`/`>= 1`/`Math.floor` guards (already in `progress.js`) and extend them to the new `levels` map: every cleared flag coerced to a strict boolean, unknown ids tolerated/ignored. Keep `loadSave` returning `defaults()` on every failure path; never throw into the caller.
**Warning signs:** Boot hangs at a blank screen; progression that never levels up; a thrown error in the console on load.
`[VERIFIED: src/progress.js lines 58-74, 166-203; STATE.md WR-01 lesson; STATE.md Phase 13 research flag "hand-construct a stale-and-foreign save to prove it never bricks boot"]`

### Pitfall 2: The a727c13 import-time global trap resurfaces in the split
**What goes wrong:** Moving `buildLevel` into `levels/build.js` and "tidying" the `Rect` guard up to module top level (or adding a new top-level engine reference) → throws at import, blanks the game on every load.
**Why it happens:** The guard *looks* like it belongs at the top of the file; the failure is invisible to greps and only shows in a real browser boot.
**How to avoid:** Keep `typeof Rect === "undefined"` (and every `add`/`rect`/`sprite`/`vec2` reference) strictly inside `buildLevel`'s body. The data module (`level-01.js`) and registry (`index.js`) reference NO engine globals at all. Verify with a browser boot, not just greps.
**Warning signs:** Greps pass but the canvas is blank/loading-stuck in a real browser.
`[VERIFIED: src/level.js lines 25-32, 114-123; commit a727c13]`

### Pitfall 3: Switching the builder to per-tile colliders (addLevel-style)
**What goes wrong:** During the generalization, replacing the merged-floor `for (const run of level.floors)` single-wide-collider idiom with per-tile colliders reintroduces seam-stick (player snags between adjacent tiles) and breaks the tightened spike hitbox.
**Why it happens:** A "cleaner" tile loop feels natural when parameterizing; `addLevel` is the obvious Kaplay-native path.
**How to avoid:** Lift the floor/platform/coin/spike/goal construction VERBATIM. One merged `body({isStatic:true})` per contiguous run; separate visual-only tiles with no `area()`/`body()`; the tightened `new Rect(...)`/`offset` spike hitbox exactly as shipped.
**Warning signs:** Player catches on floor seams mid-run; spikes kill from empty tile edges; the v3.0-validated feel changes.
`[VERIFIED: src/level.js lines 125-185; STATE.md Phase 09 decisions]`

### Pitfall 4: Storing `unlocked` instead of deriving it
**What goes wrong:** Persisting an `unlocked` flag per level creates a second source of truth that can desync from the cleared facts (e.g., a partial write, or a later code change to the order).
**Why it happens:** It feels symmetric with `cleared`; level-select (Phase 14) wants an `unlocked` value to render.
**How to avoid:** Store ONLY `cleared` per id. Expose `isUnlocked(id)` deriving from `LEVEL_ORDER`: index 0 always unlocked; index N unlocked iff `LEVEL_ORDER[N-1]` is cleared. Phase 14 calls the helper; nothing stores the result.
**Warning signs:** A level shows unlocked but its predecessor isn't cleared (or vice-versa) after an interrupted save.
`[VERIFIED: 13-CONTEXT.md decisions; STATE.md Key Decisions "Unlock state is derived"]`

### Pitfall 5: Relative-import depth wrong in `src/levels/`
**What goes wrong:** A module in `src/levels/` imports `./config.js` (one dot) and silently 404s / fails to resolve, because `config.js` is one directory UP.
**Why it happens:** `progress.js` (in `src/`) correctly uses `./config.js`; copying that import into a `src/levels/` module is wrong by one level.
**How to avoid:** Modules in `src/levels/` import `../config.js` (mirror `src/math/brain.js`). `game.js` (in `src/scenes/`) imports the registry as `../levels/index.js`.
**Warning signs:** Module-not-found in the browser console; `node --check` is fine (it doesn't resolve imports) but the smoke/boot fails.
`[VERIFIED: src/math/brain.js line 32 (`../config.js`), src/progress.js line 32 (`./config.js`)]`

### Pitfall 6: The structural grep gates drift from the new shape
**What goes wrong:** `check-progress.sh` line 41 hard-greps `mathlab_platformer_v1`; after the key bump that assertion either fails (if you keep it) or silently rots (if you don't update it to assert the NEW key + the new levels-cleared seam).
**Why it happens:** The gates are the project's "tests" but live in bash, separate from the modules they verify.
**How to avoid:** As part of the phase, update `check-progress.sh` to assert the new key + a `levels`/`cleared`/`isUnlocked` seam, and extend `smoke-progress.mjs` with cleared-map + derived-unlock + corrupt-levels-safe-default cases and a registry import (ordered, level-01 present, `buildLevel` importable). Greens prove structure; the browser boot proves it runs.
**Warning signs:** A green gate that no longer matches reality; a key change that the gate didn't catch.
`[VERIFIED: scripts/check-progress.sh line 41; scripts/smoke-progress.mjs]`

## Code Examples

### Extend the save shape with a per-level cleared map + derived unlock
```javascript
// Source: synthesized from src/progress.js (shipped idiom) + 13-CONTEXT.md decisions
// In progress.js — extend defaults(), validate(), and the createProgress closure.

function defaults() {
  return { xp: 0, level: 1, accuracy: {}, history: {}, levels: {} };  // + levels map
}

// validate(): add a guarded branch for the cleared map (booleans only; tolerate junk ids).
if (data.levels && typeof data.levels === "object") {
  Object.entries(data.levels).forEach(([id, rec]) => {
    if (typeof id === "string" && rec && typeof rec === "object") {
      out.levels[id] = { cleared: rec.cleared === true };   // strict boolean coercion
    }
  });
}

// In createProgress(saved): seed a closure-local cleared map + expose helpers.
const cleared = {};
if (saved && saved.levels && typeof saved.levels === "object") {
  for (const [id, rec] of Object.entries(saved.levels)) {
    if (rec && rec.cleared === true) cleared[id] = true;
  }
}
return {
  // ...existing getters/addXp/threshold...
  isLevelCleared: (id) => cleared[id] === true,
  markCleared:    (id) => { cleared[id] = true; },
  serialize(brainSnapshot) {
    const levels = {};
    for (const id of Object.keys(cleared)) levels[id] = { cleared: true };
    return {
      version: CONFIG.SAVE.VERSION, xp, level,
      accuracy: brainSnapshot?.accuracy ?? {},
      history:  brainSnapshot?.history  ?? {},
      levels,                                  // NEW
    };
  },
};
```

### The registry + derived-unlock helper (pure, no engine)
```javascript
// Source: synthesized from 13-CONTEXT.md (LEVEL_ORDER + derived unlock) — src/levels/index.js
import { LEVEL_01 } from "./level-01.js";

// Ordered registry — the single source of level order. Add future levels here.
const LEVELS = [LEVEL_01];

export const LEVEL_ORDER = LEVELS.map((l) => l.id);   // ["level-01"]
const BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

export function getLevel(id) {
  return BY_ID.get(id) ?? LEVELS[0];     // forgiving: bad id falls back to the first level
}

// Derived unlock: level 0 always unlocked; level N unlocked iff its predecessor is cleared.
// `progress` is a createProgress() instance (isLevelCleared). Nothing is STORED here.
export function isUnlocked(id, progress) {
  const i = LEVEL_ORDER.indexOf(id);
  if (i <= 0) return true;                               // first (or unknown→first) always open
  return progress.isLevelCleared(LEVEL_ORDER[i - 1]);
}
```

### `buildLevel(levelData)` generalized — guard + geometry source change only
```javascript
// Source: src/level.js (shipped) — generalized into src/levels/build.js
import { CONFIG } from "../config.js";          // NOTE: ../ — build.js is in src/levels/
const T = CONFIG.TILE_SIZE, FLOOR_Y = CONFIG.FLOOR_Y;

export function buildLevel(levelData) {
  if (typeof Rect === "undefined") {            // a727c13 guard — INSIDE the body
    throw new Error("build.js: Kaplay global `Rect` missing — check kaplay({global})/version");
  }
  const g = levelData.geometry;                 // read geometry from the descriptor
  for (const run of g.floors) {                 // ...rest VERBATIM from level.js...
    add([ rect(run.w, CONFIG.FLOOR_THICKNESS), pos(run.x, FLOOR_Y),
          area(), body({ isStatic: true }), "ground" ]);
    for (let tx = run.x; tx < run.x + run.w; tx += T) add([sprite("ground"), pos(tx, FLOOR_Y)]);
  }
  // platforms / coins / spikes (tightened Rect hitbox) / goal — all lifted verbatim,
  // reading from `g.platforms`, `g.coins`, `g.spikes`, `g.goal` instead of `level.*`.
}
```

### Scene rewire (proves the spine; no scenes added)
```javascript
// Source: src/scenes/game.js (shipped) — minimal rewire to load by id from the registry
import { getLevel, LEVEL_ORDER } from "../levels/index.js";
import { buildLevel } from "../levels/build.js";

export function gameScene(data) {
  // ...setGravity, closure state as shipped...
  const level = getLevel(data?.levelId ?? LEVEL_ORDER[0]);   // load by id (default first)
  const saved = loadSave();
  const progress = createProgress(saved);
  const brain = createBrain({
    seedAccuracy: saved.accuracy,
    seedHistory:  saved.history,
    allowedTables: level.allowedTables,        // difficulty seam (wired for real Phase 16)
  });
  buildLevel(level);                            // Rect guard runs here, post-kaplay-init
  // ...on clear: progress.markCleared(level.id); writeSave(progress.serialize(brain.snapshot()));
}
```
> Note: `level.checkpoints` is consumed by the SCENE (`game.js` adds checkpoint marker entities), not by `buildLevel`. Keep `checkpoints` inside `geometry` so the scene can read `level.geometry.checkpoints`. Verify this read-site moves with the geometry restructure. `[VERIFIED: src/scenes/game.js lines 89-91]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `src/level.js` (`LEVEL` + `buildLevel`) | `src/levels/` registry + `build.js` + per-level data modules | This phase | Replayable multi-level spine; future levels are data files |
| v3.0 save key `mathlab_platformer_v1` (VERSION 1) | New key (e.g. `mathlab_platformer_v2`, VERSION 2) + `levels` cleared-map | This phase | Clean reset; per-level completion persisted |
| `nextQuestion()` calls `calculateWeights(undefined)` (all 9 tables) | `allowedTables` threaded from level data into the brain | Wired this phase, *enforced* Phase 16 (LVL-03) | Per-level difficulty without touching the locked algorithm |

**Deprecated/outdated:**
- v3.0 save key `mathlab_platformer_v1`: superseded by the v2 key. Not deleted (orphaned, harmless). Do not read or migrate it (locked clean-reset decision).
- `src/level.js`: superseded by `src/levels/`. Discretion whether to delete or leave a thin re-export shim during the transition (prefer deleting + updating the one import site in `game.js` to avoid dual sources of truth).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | New save key `mathlab_platformer_v2` + `VERSION: 2` is acceptable (exact name/int is Claude's discretion per CONTEXT) | Save Format | Low — any new key satisfies SAVE-05; name is cosmetic. Confirm if a different convention is preferred. |
| A2 | File layout `src/levels/{index.js, build.js, level-01.js}` is acceptable (layout is Claude's discretion) | Project Structure | Low — explicitly discretion; alternative groupings work as long as the registry exposes `LEVEL_ORDER`. |
| A3 | Descriptor field names (`geometry`, `allowedTables`, `mechanics`, `theme`, `parallax`, `displayName`) are acceptable (names are Claude's discretion) | Pattern 3 | Low–Medium — later phases (15–18) consume these names; pick them deliberately so Phases 15/18 fill rather than rename. Worth a quick sanity glance against the Phase 15/18 intent in REQUIREMENTS. |
| A4 | `level-01`'s `allowedTables` is `[6,7,8,9]` as a placeholder (LVL-03 difficulty ramp is Phase 16, not this phase) | Code Examples | Low — value is not enforced until Phase 16; any sane pool is fine now. The field must merely EXIST and thread through. |
| A5 | `checkpoints` belongs inside `geometry` (consumed by the scene, not `buildLevel`) | Scene rewire note | Low — purely structural; verified the read-site is `game.js`, so wherever it lives, `game.js`'s read must match. |

**If this table is empty:** it is not — but every assumption is explicitly within a CONTEXT-granted discretion area, so none blocks planning. All four requirements (SAVE-05/06/07, LVL-02) are supported by VERIFIED/CITED findings.

## Open Questions

1. **Delete `src/level.js` outright, or leave a transitional re-export shim?**
   - What we know: only one import site exists (`src/scenes/game.js` line 22). The registry + build modules supersede it.
   - What's unclear: whether a shim adds safety or just a second source of truth.
   - Recommendation: delete `level.js` and update the single import site; the no-build canon means there is no caching/transpile layer that would benefit from a shim. (Discretion.)

2. **Should the version gate alone be trusted, or rely on the new key as the primary guard?**
   - What we know: a new key makes the v1 blob invisible; the version gate is a second guard for any future v2-shaped corruption.
   - What's unclear: nothing blocking — both guards coexist cheaply.
   - Recommendation: do both (new key + bump VERSION + version gate in `loadSave`), as the shipped code already version-gates.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | Running `scripts/smoke-progress.mjs` headless | ✓ (used by existing smoke/gates) | system node | — (the gate already runs node) |
| bash + grep + sed | `check-progress.sh` / `check-safety.sh` structural gates | ✓ | system | — |
| A real browser | Mandatory boot check (greps ≠ boots) | ✓ (dev machine) | modern | — |
| Local static server (e.g. `python3 -m http.server`) | Serving `src/` over HTTP for the ES-module + sprite loads (file:// is blocked by the inline guard) | ✓ assumed | — | open via the existing dev-server flow / nginx container |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — every tool this phase needs is already used by the shipped validation gates.

## Validation Architecture

> `workflow.nyquist_validation` was not found set to `false` in config (no `.planning/config.json` workflow override observed) — section included. The project has NO JS test framework by canon; the "test framework" is the node smoke + bash structural gates + a mandatory browser boot.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no-build/no-dep canon). Headless node ES-module smoke + bash grep gates. |
| Config file | none — scripts live in `scripts/` |
| Quick run command | `node scripts/smoke-progress.mjs` |
| Full suite command | `bash scripts/check-progress.sh && bash scripts/check-safety.sh` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVE-05 | New key; stale/foreign/corrupt save → safe defaults, never bricks | unit (smoke) + grep | `node scripts/smoke-progress.mjs` (add corrupt-save + foreign-key cases) | ✅ extend `smoke-progress.mjs`; ⬜ add new-key grep to `check-progress.sh` (Wave 0) |
| SAVE-06 | Cleared map persists; unlock derived from LEVEL_ORDER | unit (smoke) | `node scripts/smoke-progress.mjs` (markCleared→serialize→reload→isLevelCleared; isUnlocked derivation) | ❌ Wave 0 — add cases |
| SAVE-07 | XP/level/accuracy/history round-trip under the new key, seeds brain | unit (smoke) | `node scripts/smoke-progress.mjs` (existing round-trip cases — keep green under new shape) | ✅ existing cases, re-verify |
| LVL-02 | Ordered registry; level-01 present; buildLevel importable; data has no engine ref | unit (smoke) + grep | `node scripts/smoke-progress.mjs` (import registry, assert LEVEL_ORDER[0]==="level-01", getLevel works); grep buildLevel guard-inside-body | ❌ Wave 0 — add registry import + greps |
| LVL-02 (regression) | level-01 geometry === v3.0 LEVEL verbatim | unit (smoke) | structural diff / deep-equal the lifted geometry against the original values | ❌ Wave 0 — add a verbatim-geometry assertion |
| all | a727c13: no engine global at module top level in `levels/*` | grep | `bash scripts/check-progress.sh` (extend) / a `check-import-safety` grep | ❌ Wave 0 — add negative grep (no top-level `typeof Rect`/`add(`/`kaplay` in levels data+index) |
| all | Real browser boot: level-01 loads from registry, progress persists under new key | manual UAT | open the app in a browser, clear the level, reload, confirm cleared persists | manual — phase gate |

### Sampling Rate
- **Per task commit:** `node scripts/smoke-progress.mjs`
- **Per wave merge:** `bash scripts/check-progress.sh && bash scripts/check-safety.sh`
- **Phase gate:** full suite green AND a real browser boot (level-01 from registry + cleared persists under the new key) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Extend `scripts/smoke-progress.mjs` — cleared-map round-trip (SAVE-06), derived `isUnlocked` (SAVE-06), corrupt/foreign-save→defaults (SAVE-05), registry import + `LEVEL_ORDER[0]==="level-01"` + `getLevel` fallback (LVL-02), verbatim-geometry deep-equal (LVL-02 regression).
- [ ] Update `scripts/check-progress.sh` — replace the `mathlab_platformer_v1` grep (line 41) with the NEW key; add asserts for `levels`/`cleared`/`isUnlocked`/`markCleared` in `progress.js`; add a registry-existence + `buildLevel`-in-`levels/build.js` assert.
- [ ] Add a negative import-safety grep for `src/levels/*` (no top-level engine global / no `typeof Rect` outside `buildLevel`) — precursor to the `check-import-safety.sh` formalized in Phase 14.
- [ ] No framework install needed (canon).

## Security Domain

> `security_enforcement` not set to `false` — section included. This is an offline, local-only, no-backend app; the attack surface is a single untrusted input: the parsed localStorage blob.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts/auth — local single-user app |
| V3 Session Management | no | No sessions/server |
| V4 Access Control | no | No multi-tenant/server resources |
| V5 Input Validation | **yes** | The parsed save blob is untrusted input → explicit per-key, range-checked validation (existing `validate()` idiom); never spread/`Object.assign` the blob |
| V6 Cryptography | no | No secrets, no PII, no crypto need (local XP/level only) |

### Known Threat Patterns for vanilla-JS + localStorage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prototype pollution via a hand-edited/extension-injected save blob (e.g. `__proto__` key) | Tampering | Copy ONLY named, range-checked keys into a fresh object; NEVER `{...data}`/`Object.assign(target, data)`. Existing `validate()` already does this — extend the same idiom to the new `levels` map. `[VERIFIED: src/progress.js validate(); STATE.md T-01-01]` |
| Corrupt/Infinity numeric fields freezing progression | Denial of Service (self) | `Number.isFinite` + `>= 1` + `Math.floor` guards on numeric fields; strict boolean coercion (`=== true`) on cleared flags. `[VERIFIED: src/progress.js; STATE.md WR-01]` |
| Throwing/blocked `localStorage` (private mode, sandboxed iframe, full quota) | Denial of Service | `storageAvailable()` try/catch probe; `loadSave` returns defaults on any failure; `writeSave` catches `QuotaExceededError` and never rethrows. `[VERIFIED: src/progress.js]` |
| Unknown/garbage level ids in the cleared map | Tampering / integrity | Tolerate-and-ignore unknown ids when reading; derive unlock strictly from `LEVEL_ORDER` (a junk id can never unlock a real level). `[CITED: 13-CONTEXT.md derived-unlock decision]` |

## Sources

### Primary (HIGH confidence)
- `src/progress.js` (shipped) — pure factory + guarded save seam, `validate()`, isFinite guards. The canonical save idiom to extend.
- `src/level.js` (shipped, fixed in commit a727c13) — `LEVEL` data + `buildLevel` with merged-floor colliders, tightened spike hitbox, `Rect` guard inside the body.
- `src/math/brain.js` (shipped) — `createBrain({seedAccuracy, seedHistory})`, `calculateWeights(allowedTables)` (the difficulty seam already exists).
- `src/config.js` (shipped) — `CONFIG.SAVE` (key/version), `CONFIG.PROGRESS`, level constants.
- `src/scenes/game.js` (shipped) — the load/seed/build/persist wiring + anti-leak contracts; the one `level.js` import site.
- `src/main.js` (shipped) — kaplay init + the import-time/scene-time boundary that defines the a727c13 rule.
- `scripts/smoke-progress.mjs` + `scripts/check-progress.sh` + `scripts/check-safety.sh` (shipped) — the project's "test framework"; the gates to extend.
- `.planning/phases/13-fresh-save-format-level-registry-data/13-CONTEXT.md` — locked decisions + discretion areas.
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — requirement text, key decisions, pitfalls catalogue, WR-01/a727c13 lessons.
- `.claude/CLAUDE.md` — no-build/no-dep/vanilla canon + dark-grunge constraints.

### Secondary (MEDIUM confidence)
- None needed — no external research surface (zero new dependencies).

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — fully determined by project canon (no choices to make; zero new deps).
- Architecture: HIGH — every pattern is a generalization of shipped, kid-validated code, read directly from source.
- Pitfalls: HIGH — all six are documented in the codebase comments, STATE.md, and the git history (a727c13, WR-01, Phase 09 collider decisions).

**Research date:** 2026-06-29
**Valid until:** Stable indefinitely for this phase — grounded in committed source, not fast-moving external docs (re-verify only if `progress.js`/`level.js`/`brain.js` change before planning). 30-day nominal.
