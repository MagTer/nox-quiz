# Phase 13: Fresh Save Format + Level Registry/Data — Context

**Gathered:** 2026-06-28
**Status:** Ready for planning
**Mode:** discuss (most decisions inherited from v4.0 milestone scoping + research; one forward-design choice resolved here)

<domain>
## Phase Boundary

The pure DATA SPINE of v4.0 — no scenes, no UI, no mechanics, no art. Deliver:
1. A fresh, versioned, clean-reset save format with per-level completion + the
   existing XP/level/practice-history, all under a NEW key (SAVE-05/06/07).
2. A level registry + ONE parameterized builder consuming plain-JS level data
   modules, with v3.0's existing level lifted in verbatim as level-01 (LVL-02).

In scope: SAVE-05 (fresh clean-reset versioned save, never bricks), SAVE-06
(per-level cleared + derived-unlock persistence), SAVE-07 (XP/level/practice
history within the fresh save, seeds the brain), LVL-02 (JS-data level registry
+ parameterized builder, no addLevel/Tiled/build step).

Out of scope (later phases): title/level-select scenes (Phase 14), the shared
challenge seam + mechanics (15/16), additional authored levels (17), art/animation
+ parallax (18). Stars/scoring are out of scope entirely.

This phase is PURE modules (no a727c13 risk) by design — it is sequenced first so
everything else consumes a stable data spine.
</domain>

<decisions>
## Implementation Decisions

### Save format (SAVE-05/06/07) — clean reset, no migration
- A NEW versioned localStorage key (bump from the v3.0 `mathlab_platformer_v1`);
  the v3.0 save is deliberately **NOT** migrated — her existing XP/level/weak-spot
  history resets when v4.0 ships (USER DECISION: clean slate). This removes all
  migration complexity and the save-bricking risk the research flagged.
- A missing, stale, foreign, or corrupt save loads safe defaults and NEVER bricks
  boot — keep the existing isFinite/shape guards (the v3.0 WR-01 lesson) and the
  guarded localStorage seam (try/catch, storageAvailable).
- Per-level persistence stores ONLY `cleared` facts per level id. `unlocked` is
  **derived** from `LEVEL_ORDER` (level 1 always unlocked; level N unlocks when
  N-1 is cleared) — never stored as a second source of truth.
- XP / level / per-table practice history continue to persist within the fresh
  save and seed `createBrain({ seedAccuracy, seedHistory })` so weak-spot
  adaptation resumes across visits.

### Level registry + builder (LVL-02)
- Levels are plain-JS data modules. ONE parameterized `buildLevel(levelData)`
  consumes them. Registered in an ordered registry exposing `LEVEL_ORDER`. NO
  Kaplay `addLevel` (its per-tile colliders would undo the validated merged-floor
  anti-seam-stick spine + tightened spike hitbox), NO Tiled, NO build step.
- v3.0's existing single level lifts in **verbatim** as `level-01` — preserve the
  merged-floor colliders and the tightened spike hitbox exactly.
- **Forward-looking level-descriptor schema (USER DECISION):** each level record
  carries `id`, `displayName`, the geometry, `allowedTables`, PLUS optional/empty
  placeholder slots that later phases populate — `mechanics` (Phase 15/16),
  `theme`/`tileset` + `parallax`/`background` (Phase 18). The builder ignores
  unset optional fields, so Phases 14–18 fill fields instead of reshaping the
  format (fewer churny data migrations).
- `allowedTables` per level is the difficulty seam (LVL-03 later): it's passed
  into `createBrain(...)` — the LOCKED 6–9 weighting algorithm in `math/brain.js`
  is NEVER touched.

### Firewalls / safety
- `progress.js` stays PURE + node-testable: `createProgress(saved)` factory never
  reads storage at construction; the load/write/storageAvailable seam is
  defined-not-called at import. The registry + builder data modules stay
  a727c13-safe — no Kaplay global (or `typeof <global>` guard) at module top
  level; `buildLevel` uses engine globals only when called at scene time (mirror
  the existing `level.js`, which moved its `Rect` guard INSIDE `buildLevel`).

### Claude's discretion
- Exact new save key name + version int; exact module/file layout under
  `src/levels/` (e.g. `index.js` registry, `build.js` builder, `level-01.js`
  data); exact field names within the descriptor schema.
</decisions>

<code_context>
## Existing Code Insights

### Reusable assets
- `src/progress.js` — `createProgress(saved)` pure factory + guarded localStorage
  seam (key `mathlab_platformer_v1`, isFinite guards). Extend: new key/version +
  a `levels:{}` cleared-map + derived-unlock helper. Keep it node-importable.
- `src/level.js` — the `LEVEL` data object + `buildLevel(level)` with merged-floor
  colliders + tagged coin/spike/goal + the `Rect` guard moved INSIDE buildLevel.
  Generalize into `levels/build.js` + `levels/level-01.js` (verbatim geometry).
- `src/config.js` — `CONFIG.SAVE` (key/version), `CONFIG.PROGRESS`, level constants.
  Add the new save key/version and any registry constants here (no magic numbers).
- `scripts/smoke-progress.mjs` + `scripts/check-progress.sh` — the headless node
  smoke + comment-stripped structural gate; extend to cover the new save shape
  (cleared map, derived unlock, fresh-key, corrupt-save-safe-default) and the
  registry (ordered, level-01 present, builder pure-importable).
- `src/scenes/game.js` — currently boots the single level; rewire to load a level
  by id from the registry (proves the spine) WITHOUT adding scenes yet.

### Established patterns
- Factory functions + guarded seams keep pure modules node-testable (no DOM).
- a727c13: engine globals only inside scene-time function bodies.
- Validation for this no-test-framework game: `node --check` + structural greps +
  headless node smoke + a MANDATORY real browser boot (game still loads level-01
  and persists) — greps passing ≠ boots.

### Integration points
- progress.js ↔ game.js (load on entry, persist on clear/hide) — unchanged seam,
  new save shape.
- levels/index.js (LEVEL_ORDER) ↔ game.js (load by id) and, later, the Phase 14
  select screen.
- allowedTables ↔ createBrain — the difficulty seam, wired for real in Phase 16.
</code_context>

<specifics>
## Specific Ideas
- Sequenced FIRST because it is pure (no a727c13 risk) and is the spine every
  later phase reads. Keep it boring and well-guarded.
- The clean-reset is intentional and user-chosen — do not reintroduce a v3.0→v4.0
  migration (the roadmapper flagged this discrepancy vs the older research SUMMARY).
- End the phase with a real browser boot: level-01 loads from the registry and
  progress persists under the new key.
</specifics>

<deferred>
## Deferred Ideas
- Title + level-select scenes, game.js parametrized by levelId (Phase 14).
- Shared challenge seam + mechanics (Phases 15/16).
- Additional authored levels + platforming difficulty ramp (Phase 17).
- Art/animation + parallax, theme/tileset fields populated (Phase 18).
- Stars / scoring / completion texture (out of scope, v4.0).
</deferred>
