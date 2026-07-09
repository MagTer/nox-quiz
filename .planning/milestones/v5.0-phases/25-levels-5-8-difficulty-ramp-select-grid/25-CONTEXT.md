# Phase 25: Levels 5–8, Difficulty Ramp & Select Grid - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — 4 areas presented, all accepted on recommendation (same precedent as Phases 22/23/24's CONTEXT.md).

<domain>
## Phase Boundary

Double the game to eight levels: author levels 5–8 as pure-data descriptors through the existing `src/levels/` registry, give the new levels a gentle difficulty ramp plus late-game verticality and one hidden secret-XP alcove per level (including retrofitting an alcove into each of the existing 1–4, additively, without touching their kid-validated geometry), scale the level-select screen to a 2×4 grid, and make the two authorized math changes (drop table 1 from level-02's pool; narrow the second-factor roll from 1–10 to 1–9 in the LOCKED `src/math/brain.js`). Both the static validator (`scripts/validate-levels.mjs`) and the interactive audit must pass green on all 8 levels when done. Visual/palette theming (VIS-01..03) and audio (AUD-01..04) are explicitly out of scope — Phases 26/27's job.

</domain>

<decisions>
## Implementation Decisions

### Difficulty Ramp & Table Pools
- Levels 1–4's existing per-level `allowedTables` pools are NOT revised into one grand monotonic ramp — the new ramp applies fresh to levels 5–8 only. Levels 1–4 stay as shipped, touched only by the MATH-01 edit below. Lowest risk; Phase 24 deferred "table-pool change" here without mandating a rewrite of 1–4's already-validated difficulty identity.
- level-03 ("The Hollow") keeps its existing mixed `[3,4,5,6,7,8,9]` pool and is retroactively designated THE mixed-review level required by success criterion 2 — zero new authoring needed.
- New levels' `allowedTables`: level-05 `[2,3,4,5]`, level-06 `[4,5,6,7]`, level-07 `[6,7,8]`, level-08 `[6,7,8,9]` — a 4-step gentle climb mirroring ROADMAP's literal "[2,3,4,5] → [6,7,8,9]" wording.
- MATH-01 exact edit: `level-02.js`'s `allowedTables` changes from `[1,2,3,4,5,6,7]` to `[2,3,4,5,6,7]` (drop the 1 only, keep 6/7 as-is) — matches the pending todo's own scoped investigation (`.planning/todos/pending/2026-07-04-drop-tables-1-and-10-from-practice-rotation.md`) exactly. Do not add 8/9 to compensate.
- MATH-02 exact edit: `src/math/brain.js:247`'s `Math.floor(Math.random() * 10) + 1` becomes `Math.floor(Math.random() * 9) + 1` — the ONE authorized literal change to the LOCKED brain file. Do not touch the coincidental unrelated "10"s in the same file (parseInt radix arguments at lines 96/104/183/189, or `CONFIG.BRAIN.MASTERY_WINDOW: 10` in config.js — an unrelated EWMA window size).

### New Level Authoring & Verticality
- Levels 5–8 are similar length/scale to the post-Phase-24 extended levels 1–4 (roughly the 3200–4300px range those now span) — consistent pacing, no new length precedent.
- Verticality (LVL-05) applies only to level-07 and level-08 ("late-game verticality" per ROADMAP wording); level-05/06 stay single-screen-tall like 1–4.
- Verticality levels get an explicit `bounds.top`/`bounds.bottom` spanning roughly 2 screens (e.g. `top: -360`) so the camera's Y-clamp domain (currently a collapsed single point at `[180,180]` for all existing levels, per `src/camera.js:32-35`) actually has room to pan. Vertical shaft floors must stay above the existing global fall-respawn threshold (`CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN` = 360+120 = 480, `game.js:275`) — this threshold is a global constant, NOT bounds-derived, so any shaft floor below world-Y 480 would incorrectly trigger a respawn. Zero engine changes required if this constraint is respected.
- Verticality is ascending-only (climb up via platform chains) — sidesteps the fall-respawn trap entirely and fits a capstone-climb feel for the late levels. No descending shafts.

### Secret XP Alcove (LVL-06 — applies to ALL 8 levels per success criterion 5, not just 5–8)
- Mechanism: a new lightweight `secretAlcove` geometry array + a minimal handler mirroring `src/mechanics/collect.js`'s pattern, calling `progress.addXp` directly on touch. No existing mechanic besides the goal calls `addXp` today (`game.js:208`), so this is genuinely new wiring, not a config flip — smallest-footprint approach given that.
- Flat XP bonus of 5 per alcove (not scaled by level) — rewarding without rivaling a math-gate's table-scaled `XP_EASY:10`/`XP_HARD:20`.
- Hidden via geometry placement only (off the main path, no signposting) — matches "optional discovery reward" framing and the project's standing "no maze-like/heavily branching levels" exclusion (REQUIREMENTS.md Out of Scope): it's a nook, not a branch.
- Every level (1–8) gets exactly one. For levels 1–4, the alcove is placed as a new, purely-additive nook that does not touch any existing floor/platform/checkpoint geometry — additive placement is consistent with "never edit inside kid-validated geometry" since nothing existing is modified, only new isolated content is added.

### Level Select 2×4 Grid (LVL-04)
- Grid is 4 columns × 2 rows (matches ROADMAP's literal "2×4" wording as rows×cols). At the existing `TILE_W:96`/`GAP:24`, 4 columns need only 456px, comfortably inside the 640px internal canvas — no tile-size shrink needed.
- Add a `ROW_GAP` constant to `CONFIG.SELECT` plus a second row Y (`ROW_Y + TILE_H + ROW_GAP`); `TILE_W`/`TILE_H`/`GAP`/existing `ROW_Y` stay unchanged — minimal CONFIG surface change.
- Keyboard cursor extends to support Up/Down between rows in addition to the existing Left/Right, wrapping within a row only (no cross-edge wrap).
- Locked/unlocked/cleared visual semantics are unchanged — same three states (locked-grey, unlocked-green, cleared-blue+checkmark) apply per-tile regardless of row. A pre-v5.0 save resumes with levels 5–8 rendering locked-grey by default (no cleared record exists for ids the save has never seen — `isUnlocked`'s existing single-predecessor-chain logic already generalizes to 8 entries with no code change).

### Claude's Discretion
- Exact per-level pixel geometry for levels 5–8 (floors, platforms, coins, spikes, checkpoint placement) and their themed `displayName` strings, following each level's established per-hazard-checkpoint convention (Phase 24 precedent: one checkpoint immediately before each hazard/mechanic encounter).
- Exact mechanic-type distribution (door/gates/enemy/collectZone mix) per new level, following the existing "each level reuses only mechanic types that fit its flavor" pattern.
- Exact pixel placement of each level's secret alcove.
- Whether `bounds` is specified explicitly or left to derive dynamically for levels 5/6 (both patterns are proven live today — level-01 has none, levels 02–04 all specify it explicitly).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/levels/index.js` — registry; adding levels 5–8 is mechanical: 4 new descriptor files + 4 import lines + append to the `LEVELS` array literal. `LEVEL_ORDER`/`BY_ID`/`getLevel`/`isUnlocked` all derive automatically from array length/order, no hardcoded count anywhere in this file.
- `src/levels/level-02.js` — smallest existing descriptor, full schema reference: `{ id, displayName, allowedTables, bounds?, geometry: { floors, platforms, coins, spikes, goal, checkpoints, doors, mathGates, enemies, collectZones, answerPickupSlots }, mechanics: [], theme: null, parallax: null }`. Optional geometry arrays are all `?? []`-guarded in `build.js`.
- `src/mechanics/collect.js` — pattern to mirror for the new `secretAlcove` handler; its multi-zone re-entrancy guards were explicitly added in anticipation of "Phase 25's multi-zone levels" (comment at `collect.js:56-59`).
- `scripts/validate-levels.mjs` — auto-discovers every `LEVEL_ORDER` entry with zero hardcoded count; adding levels 5–8 to the registry is sufficient for it to validate them on the next run. No per-level opt-out exists in a full run (only a whole-registry-replacing `--fixture` flag for the validator's own negative-testing).

### Established Patterns
- Level descriptors are pure data (`import { CONFIG } from "../config.js"` only, no engine globals) — matches the project's `a727c13` rule.
- Checkpoint convention: one checkpoint immediately before each hazard, at `{ x, y: FLOOR_Y - 48 }` (Phase 24 precedent, still applies).
- Off-grid coin placement: 32×32 sprites at `{x,y}` top-left, 16px offset from grid-aligned floor/platform geometry (intentional, documented).
- No-npm/no-build-step convention — everything runs via direct `node scripts/*.mjs`.

### Integration Points
- `src/scenes/select.js` — the level-select scene; currently a single un-wrapped row (`x = START_X + i*(TILE_W+GAP)`, `select.js:93-94`) with a self-documented "IN-03 OVERFLOW FLAG" comment at `config.js:226-231` predicting exactly this 2×4 need. Needs a `col = i % 4` / `row = Math.floor(i / 4)` split plus a second row Y.
- `src/config.js` `CONFIG.SELECT` (`config.js:232-241`) — `TILE_W:96, TILE_H:96, GAP:24, ROW_Y:180, START_X:120` — needs a `ROW_GAP` addition.
- `src/math/brain.js:247` — the exact MATH-02 line (`Math.floor(Math.random() * 10) + 1`, inside `nextQuestion()`).
- `src/camera.js:32-35` — the Y-clamp math verticality depends on (`ny = clamp(ny, top + halfH, bottom - halfH)`); currently collapses to a single point for all existing levels since every `bounds` is exactly one 360px screen tall.
- `game.js:275` — the global fall-respawn threshold (`CONFIG.LEVEL_BOTTOM + CONFIG.FALL_MARGIN`), a trap for downward verticality since it does NOT read per-level `bounds`.
- `game.js:208` — the only existing `progress.addXp` call site (goal's `onClear`), the integration point the new secret-alcove handler must also call into.
- `scripts/smoke-progress.mjs:723-726` — hardcodes `LEVEL_ORDER.length === 4` and `LEVEL_ORDER[1] === "level-02"`; MUST be bumped to reflect 8 levels as a mechanical part of this phase's work, or the full regression suite goes red even though `validate-levels.mjs` stays green. Its 4 byte-for-byte `expectedGeometry` blocks (lines 304/398/496/616) pin only `geometry` for levels 1–4 — they do NOT pin `allowedTables`, so the MATH-01 edit to level-02 won't trip them.

</code_context>

<specifics>
## Specific Ideas

- Current (pre-Phase-25) per-level `allowedTables`: level-01 `[6,7,8,9]`, level-02 `[1,2,3,4,5,6,7]`, level-03 `[3,4,5,6,7,8,9]`, level-04 `[6,7,8,9]` — confirmed non-monotonic today (hard → easy-heavy → mixed → hard), left as-is per the Q1 decision above except level-02's table-1 removal.
- `CONFIG.BRAIN.HARD_TABLES:[6,7,8,9]` / `EASY_TABLES:[1,2,3,4,5]` (`config.js:68-76`) — the weighting split new pools should stay consistent with; the LOCKED EWMA weighting formula itself does not change.
- `CONFIG.PROGRESS.XP_EASY:10`/`XP_HARD:20` — existing XP scale the new secret-alcove's flat 5 XP is deliberately set below.
- Table 10 was already unreachable via any level pool (brain.js's `validTables` sanitizer already caps at 1–9, `brain.js:68-71`) — MATH-02 is specifically about the second-factor multiplicand roll (the "×N" part of a question), not the table/first-factor pool.

</specifics>

<deferred>
## Deferred Ideas

- Palette/visual identity, per-level theme tinting, rebrand, logo → Phase 26 (VIS-01..03, BRAND-01..03)
- Audio/SFX/music → Phase 27 (AUD-01..04)
- Full 8-level interactive-audit closure and final human sign-off → Phase 28 (VALID-03 final close)
- Parallax layers following vertical camera pan — known pre-existing limitation (parallax only tracks camera X today); not fixed as part of this phase, visual polish is Phase 26 turf
- `CONFIG.LEVEL_BOTTOM`/`FALL_MARGIN` becoming per-level bounds-derived (a bigger engine change) — avoided this phase by keeping verticality ascending-only and above the existing global threshold instead
- Worlds/level-pack grouping on select screen — explicitly future (CONTENT-FUT-03, earns its keep at ~12+ levels)

</deferred>
