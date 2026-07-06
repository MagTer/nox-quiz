# Phase 24: Fix & Lengthen Levels 1–4 - Research

**Researched:** 2026-07-06
**Domain:** Pure-data level-descriptor geometry editing, validated against a calibrated BFS reachability model (no engine/UI changes)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Structural Defect Fix Approach**
- Over-hole math gates (level-01 x600/x1300, level-04 x1800): reposition the gate itself onto solid floor (nearest edge), preserving its role/order in the level's mechanic sequence and its exact table-pool wiring — do not extend/reshape floor geometry to chase the existing position
- Unreachable platforms (8 total across level-03/level-04): lower each platform's y until it falls within the calibrated envelope's reach from its neighboring nodes, preserving its x-position/visual role in the level's flow
- "Validator passes green" means zero HARD-FAILs (matches ROADMAP wording exactly) — WARN rows are expected and non-blocking, given Phase 23's own documented marginRatio=1.0 precision limitation for flat/downward hops; this phase is not scoped to retune that
- Repositioning preserves mechanic TYPE and table-pool wiring exactly (x/y-only changes) — no re-authoring of mechanic content during structural fixes

**Level Extension Design**
- Each level gets roughly 50–75% additional length appended after its current ending (e.g., level-01 currently ends ~x2240; add roughly 1200–1700px of new content) — "noticeably longer" without reaching into Phase 25's "8 levels total" scope, since no exact target length is specified in ROADMAP
- New sections continue each level's existing internal difficulty trajectory using the SAME per-level `allowedTables` pool — no new difficulty tier or table-pool change (that's Phase 25's job, not this "fix & lengthen" phase's)
- New sections reuse only mechanic TYPES already present in that specific level (e.g., level-02 has zero enemies/collectZones today — its extension stays that way) — preserves each level's established identity rather than introducing net-new mechanic variety
- New coins are added in proportion to the new length, matching each level's existing coin-spacing density — keeps visual/reward consistency rather than a "bolted-on" feel

**Checkpoint Density & Respawn Safety**
- Concrete placement rule: one checkpoint immediately before each hazard/mechanic encounter in the new section, mirroring the exact existing per-level convention (e.g., level-01 already places one checkpoint before each of its 3 spikes) — directly satisfies "a respawn never sends her back more than one section"
- Existing (pre-extension) checkpoints in the original kid-validated geometry are never touched — only new checkpoints are added in the appended section, consistent with the "append after, never edit inside" boundary

**Verification Evidence & Smoke Re-Baselining**
- `smoke-progress.mjs`'s level-01 geometry-pinning fixture: update the pinned expected-geometry values to the new post-extension numbers, with an explicit code comment explaining why the pin changed (Phase 24 lengthening) — mirrors this project's established "explain why a baseline moved" convention (e.g., `CONFIG.JUMP_FORCE`'s tuning comment, `jump-envelope.mjs`'s calibration provenance comment). Retain the OLD pre-extension values in a comment for historical traceability, not a silent overwrite.
- Interactive-audit acceptance bar: require `triggered:true` (reached) for all encounters — old and new — as the primary, non-negotiable bar; `resolved:true` is the goal but not an absolute per-run blocking requirement, given the pre-existing, already-documented resolution-timing flakiness from Phases 21/22/23 (unrelated to this phase's own changes)
- `node scripts/validate-levels.mjs` is run as this phase's primary acceptance evidence — success criterion 1 requires it explicitly
- `22-FINDINGS.md` and `23-FINDINGS.md` remain historical record (append a brief "resolved in Phase 24" cross-reference note, don't rewrite their tables); this phase creates its own `24-FINDINGS.md` (or equivalent evidence doc) for its own fix verification, per the project's established per-phase evidence-artifact convention

### Claude's Discretion
- Exact new-length figure within the 50–75% range per level, and exact new checkpoint/coin/spike positions within the new sections
- Internal structure of `24-FINDINGS.md`
- Whether lowered platforms need any accompanying visual/collision tweaks beyond the y repositioning (e.g., adjacent coin repositioning if a coin was placed relative to the old platform height)

### Deferred Ideas (OUT OF SCOPE)
- 4 new levels (5–8), difficulty ramp across all 8, 2×4 select grid, dropping tables 1/10 → Phase 25
- Palette/visual identity, rebrand, logo → Phase 26
- Audio/SFX → Phase 27
- Full 8-level interactive-audit closure and final human sign-off → Phase 28 (VALID-03 final close)
- WARN-tier marginRatio precision retuning (Phase 23's documented limitation) → not scoped to any phase yet, noted in STATE.md Blockers/Concerns
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALID-04 | All known structural defects in existing levels fixed (doors over floor holes, unreachable areas) | Exact target x/y computed below for all 3 over-hole gates and all 8 unreachable platforms (see "Structural Defect Fix Targets"); `scripts/validate-levels.mjs`/`over-hole-check.mjs`/`reachability.mjs` behavior fully mapped so fixes can be verified iteratively |
| LVL-01 | Existing 4 levels lengthened (append past kid-validated sections) with checkpoint density scaled to length | Extension mechanics (bounds/camera, checkpoint formula, coin/mechanic reuse, smoke re-baseline scope) fully mapped below for all 4 level files |
</phase_requirements>

## Summary

This phase edits four pure-data descriptor files (`src/levels/level-0{1..4}.js`) and two verification harnesses (`scripts/smoke-progress.mjs`, informationally `scripts/audit-phase21-mechanics.mjs` — the latter needs **no code changes**, only re-running). There is no new library, framework, or external dependency to research — the "domain" here is entirely the project's own already-built validation model (`scripts/lib/reachability.mjs` + `scripts/lib/over-hole-check.mjs` + `scripts/lib/jump-envelope.mjs`), which this research reverse-engineers precisely enough to hand the planner exact target coordinates rather than vague guidance.

Three findings materially change how the planner should scope tasks versus the phase description's own scouting notes:

1. **Camera bounds are NOT a risk for level-01.** `src/scenes/game.js` (lines 80–93) computes the camera-clamp `bounds.right` **dynamically** from `Math.max(...floors, ...platforms, goal.x + GOAL_SIZE)` whenever a level descriptor has no explicit `bounds` field (level-01's case). This directly refutes the phase-description scouting note's concern — level-01 needs **no `bounds` field added**; extending its geometry arrays is automatically picked up by the camera clamp with zero code changes. Levels 2–4 DO have explicit `bounds.right` (2800/3400/4000) that will NOT auto-update and **must be manually bumped** past each level's new goal position, or the camera will clamp before the extended content and/or render into void.

2. **`smoke-progress.mjs` pins ALL FOUR levels' full geometry, not just level-01's.** CONTEXT.md's decision text only calls out level-01's fixture by name, but the actual file (`scripts/smoke-progress.mjs` lines 282–577) contains four separate deep-equal blocks — one per level — each asserting the complete `geometry` object (floors/platforms/coins/spikes/goal/checkpoints/doors/mathGates/enemies/collectZones/answerPickupSlots) byte-for-byte against a hardcoded `expectedGeometry` literal. Extending or repositioning ANY of the 4 levels' geometry will fail that level's block, not just level-01's. The planner must budget re-baselining work for all 4 blocks (with the "retain old values in a comment" convention CONTEXT.md specifies, applied consistently across all four, even though CONTEXT.md's prose only names level-01).

3. **The reachability model's marginRatio behavior for the specific unreachable platforms is now precomputed** (see "Structural Defect Fix Targets" below) — every one of the 8 platforms has a "touching" or narrow-overlap adjacency to its neighboring floor with a small span window (32–128px), which means a rise reduced to roughly 60–75px below the floor (well under the 88.331px calibrated ceiling) reliably produces a comfortable PASS margin, EXCEPT level-03's two platforms (x1880, x2640), whose overlap window with the neighboring floor is only 40px wide — those two need a more conservative rise target (≤ ~70px) to avoid the "neither jump-root reach fits the window" failure mode this research identified by hand-computing the physics.

**Primary recommendation:** Fix all 3 over-hole gates and all 8 unreachable platforms first (x/y-only edits, verified via `node scripts/validate-levels.mjs` after each level's edits), confirming zero HARD-FAILs on the ORIGINAL (pre-extension) geometry before touching extension content at all — this isolates the two kinds of changes and matches CONTEXT.md's "reposition, don't redesign" boundary. Then extend each level by appending new floors/platforms/mechanics/coins/checkpoints strictly after the existing (now-fixed) geometry, re-running `validate-levels.mjs` after each level. Finally, re-baseline all 4 `smoke-progress.mjs` geometry blocks and re-run the interactive audit unmodified.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Level geometry (floors/platforms/mechanics/coins/checkpoints) | Data (level descriptor modules, `src/levels/level-0{1..4}.js`) | — | Pure data, no engine globals; consumed by `build.js`/game scene at runtime and by the Node-side validator/audit at build/CI time |
| Structural validity gate (reachability/over-hole) | Build/CI tooling (`scripts/validate-levels.mjs` + `scripts/lib/*.mjs`) | Data (reads level descriptors) | Pure Node modules, no browser, no engine — a static analysis pass over the same data the client renders |
| Camera bounds / world extent | Client runtime (`src/scenes/game.js`, `src/camera.js`, `src/parallax.js`) | Data (level.bounds override) | Runtime derives or reads the clamp; data optionally overrides it — this phase must keep the two in sync for levels 2–4 |
| Interactive mechanic audit | Build/CI tooling (`scripts/audit-phase21-mechanics.mjs` + `scripts/lib/{audit-retry,mechanic-drive}.mjs`) | Client runtime (drives the real browser-rendered game via Playwright) | Fully data-driven (`deriveEncounters` sorts by x from geometry) — needs no code changes for new/moved encounters, only a re-run |
| Regression/geometry-pinning smoke | Build/CI tooling (`scripts/smoke-progress.mjs`) | Data (hardcoded expected-geometry literals mirroring the descriptors) | Node-importable pure smoke; the ONLY place level geometry is duplicated outside its source-of-truth descriptor file — must be re-baselined whenever the descriptor changes |

## Standard Stack

No new libraries. Zero-dependency, no-build project convention holds (`.claude/CLAUDE.md`). This phase uses only:

| Component | Version | Purpose | Why Standard (already in repo) |
|-----------|---------|---------|--------------------------------|
| Vanilla ES2020 modules | native | Level descriptor data + validator/audit scripts | Existing project-wide convention; zero deps |
| Vendored Kaplay | 3001.0.19 (pinned) | Runtime rendering (unchanged by this phase) | Already vendored; not touched by pure-data edits |
| Playwright | resolved dynamically (see below) | Interactive audit harness (`audit-phase21-mechanics.mjs`) | Already used by Phase 21/23; re-run unmodified |

**Playwright resolution note [VERIFIED: scripts/audit-phase21-mechanics.mjs]:** the audit script resolves `playwright` via (1) normal `require.resolve`, (2) `PLAYWRIGHT_MJS_PATH` env override, (3) a hardcoded machine-specific fallback path (`/home/magnus/.nvm/.../node_modules/gsd-pi/node_modules/playwright/index.mjs`). No `package.json` exists in this repo (confirmed — `package.json` read returns nothing), so whichever machine runs the phase's verification must have Playwright resolvable through one of these three paths. This is a pre-existing condition, not something this phase changes, but worth flagging as an **Environment Availability** risk (see below) since Phase 24's acceptance evidence includes re-running this exact script.

### Package Legitimacy Audit

Not applicable — this phase installs zero new packages (pure data + reuse of already-vendored/already-verified tooling from Phases 21–23).

## Architecture Patterns

### System Architecture Diagram

```
   src/levels/level-0{1..4}.js  (PURE DATA — this phase's primary edit surface)
              │
              │  imported by
              ▼
   ┌──────────────────────────────┐        ┌───────────────────────────────┐
   │  src/levels/index.js         │        │  scripts/validate-levels.mjs   │
   │  (registry — UNCHANGED)      │        │  (CLI orchestrator)            │
   └──────────────┬───────────────┘        └───────────┬─────────────────┬─┘
                  │                                     │                 │
     getLevel(id) │ .geometry                findOverHoleBarriers   checkLevelReachability
                  ▼                                     │                 │
   ┌──────────────────────────────┐                     ▼                 ▼
   │  src/scenes/game.js          │        ┌──────────────────┐  ┌─────────────────────┐
   │  buildLevel + camera bounds  │        │ over-hole-check   │  │ reachability.mjs     │
   │  (RUNTIME — unchanged code,  │        │ .mjs (exact       │  │ (BFS + jump-envelope │
   │  but level-01's derived      │        │ interval math)    │  │ Δy-aware edge model) │
   │  bounds auto-grow with       │        └──────────────────┘  └──────────┬───────────┘
   │  geometry; levels 2-4 need   │                                        │ consumes
   │  bounds.right bumped in DATA)│                                        ▼
   └───────────────────────────────┘                          scripts/lib/jump-envelope.mjs
                                                                (FROZEN calibrated constants —
                                                                maxRise=88.331, runSpeed=218.043
                                                                — never edited by this phase)

   scripts/audit-phase21-mechanics.mjs  ──uses──▶  scripts/lib/audit-retry.mjs
        (re-run unmodified; drives real                  │ composes (unmodified)
         browser via Playwright)                          ▼
                                              scripts/lib/mechanic-drive.mjs
                                              (deriveEncounters sorts geometry
                                               by x — auto-adapts to new/moved
                                               mechanics, no code change needed)

   scripts/smoke-progress.mjs
   (4 hardcoded deep-equal blocks, one per level — MUST be
    re-baselined to match every level-0N.js edit made above)
```

### Recommended Task Sequencing (not a code pattern, but load-bearing for this phase)

1. **Fix-only pass** on the original (pre-extension) geometry of all 4 levels — reposition 3 gates + lower 8 platforms, x/y-only. Run `node scripts/validate-levels.mjs` after each level; confirm zero HARD-FAILs before proceeding.
2. **Extension pass** — append new floors/platforms/mechanics/coins/checkpoints strictly after each level's (now-fixed) existing geometry. Re-run `validate-levels.mjs` after each level.
3. **Bounds pass** — bump `bounds.right` in level-02/03/04 descriptors to clear the new goal position (level-01 needs no bounds edit — see Pitfall 1).
4. **Smoke re-baseline pass** — update all 4 `expectedGeometry` blocks in `smoke-progress.mjs`, each with an inline comment explaining the Phase-24 change and retaining old values in a comment.
5. **Interactive audit pass** — re-run `node scripts/audit-phase21-mechanics.mjs` unmodified; confirm `triggered:true` on every encounter (old + new); document any `resolved:false` rows per the CONTEXT.md-locked acceptance bar.
6. **Evidence pass** — write `24-FINDINGS.md`; append a one-line cross-reference note to `22-FINDINGS.md`/`23-FINDINGS.md`.

This ordering isolates "fix" from "lengthen" edits (matching CONTEXT.md's "reposition, don't redesign" and "append after, never edit inside" decisions) and gives the validator a clean signal at each step rather than one big diff.

### Anti-Patterns to Avoid
- **Editing floor/platform geometry to "catch" a gate's existing over-hole position** — CONTEXT.md explicitly locks "reposition the gate, not the floor." Reshaping a floor run to justify keeping a gate at x600 would touch already-validated kid-tested geometry the "append after, never edit inside" boundary forbids.
- **Trusting `marginRatio` from a WARN row as a fine-grained tightness signal** — for any `dy >= 0` (flat/downward) hop, `marginRatio` is mathematically pinned to `1.000` regardless of how easy the hop actually is (documented limitation in `reachability.mjs` and `23-FINDINGS.md`). Don't over-interpret WARN rows on gap-widths as "nearly failing" — they may be trivially easy.
- **Re-deriving a closed-form jump ceiling instead of using `JUMP_ENVELOPE`** — `reachability.mjs`'s own header comment explicitly forbids this (Phase 22's "no safety factor" flaw). Always import `maxRise`/`runSpeed` from `scripts/lib/jump-envelope.mjs`; never recompute `JUMP_FORCE**2/(2*GRAVITY)` by hand when reasoning about a fix.
- **Assuming `over-hole-check.mjs` covers platform-mounted barriers** — it explicitly only checks `geometry.floors` coverage (its own header states this). Every shipped door/mathGate/enemy/collectZone in this game sits at floor level, and new extension-section mechanics should follow the same convention (mounting a mathGate on a platform would silently bypass this check).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Verifying a repositioned gate/platform is structurally valid | A new ad-hoc reachability check or manual x/y math you trust blindly | `node scripts/validate-levels.mjs` (whole registry) — re-run after every edit | It is the exact calibrated model the ROADMAP names as this phase's gate; hand-verifying invites the same "no safety factor" false-confidence bug Phase 22 already found and fixed |
| Checking whether a new mechanic instance is reachable/interactively triggerable | A bespoke browser script | `node scripts/audit-phase21-mechanics.mjs` (unmodified) | `deriveEncounters` is fully data-driven off `geometry` — any new door/mathGate/enemy/collectZone the level descriptor gains is automatically picked up with zero script changes |
| Re-baselining geometry-pinning assertions | Deleting or loosening the `deepEqual` checks in `smoke-progress.mjs` | Update the 4 `expectedGeometry` literals to the new post-extension values, with the retained-old-value comment CONTEXT.md specifies | CONTEXT.md explicitly forbids deleting the fixture; it must be "consciously re-baselined," preserving the smoke's power to catch FUTURE accidental geometry drift |

**Key insight:** every verification tool this phase needs already exists and is already proven (Phase 21–23 built and RED-first-proved all of them). This phase's job is almost entirely "produce correct data, then run the existing tools against it" — not build new tooling.

## Structural Defect Fix Targets

Computed directly from the current `src/levels/level-0{3,4}.js`/`level-01.js`/`level-04.js` contents and the frozen `JUMP_ENVELOPE` constants (`maxRise: 88.331`, `runSpeed: 218.043`), per this phase's specific research focus #1.

### Over-hole math gates — nearest-floor-edge reposition targets

| Level | Current x | Gap | Nearest floor edge | Recommended new x | Footprint after fix | Role preserved |
|-------|-----------|-----|---------------------|--------------------|----------------------|-----------------|
| level-01 | 600 | 560..720 | floor-0 ends at 560 (40px away) vs floor-1 starts at 720 (120px away) | **528** (rightmost x keeping the 32px footprint fully inside floor-0's 0..560 span) | 528..560 | Stays on the LEFT side of gap 1 — "opening run, just before gap 1" role intact |
| level-01 | 1300 | 1200..1360 | floor-2 starts at 1360 (60px away) — floor-1 ends at 1200 (100px away) | **1360** (leftmost x on floor-2) | 1360..1392 | Stays "before the door at 1400" (1392 < 1400) — role intact |
| level-04 | 1800 | 1760..1960 | floor-2 ends at 1760 (40px away) vs floor-3 starts at 1960 (160px away) | **1728** (rightmost x keeping footprint inside floor-2's 1240..1760 span) | 1728..1760 | Stays before the following enemy at x2400 — sequence order intact |

`[VERIFIED: scripts/lib/over-hole-check.mjs, src/levels/level-01.js, src/levels/level-04.js]` — these are exact interval-arithmetic facts (floor spans read directly from the descriptor files), not heuristics. After repositioning, `findOverHoleBarriers` will report `[]` for these three because the full 32px footprint sits inside a single floor run's `[x, x+w]` span with margin to spare. Re-verify with `node scripts/validate-levels.mjs` — do not hand-trust this table for the final numbers if the extension pass (Structural Defect Fix Targets are all pre-extension repositions) shifts anything nearby.

### Unreachable platforms — lower-y targets

All 8 platforms are either "touching" (adjacent, non-overlapping) or partially/fully-overlapping with a neighboring floor run in the BFS model — meaning `spanMin = 0` in every case (the player can take off from anywhere in the shared/adjacent zone), which is favorable for finding a low-marginRatio fix.

| Level | Platform (x, y, w) | Neighbor relationship | Effective span window (spanMin..spanMax) | Current rise | Target rise | Target y (FLOOR_Y=320) |
|-------|---------------------|------------------------|---------------------------------------------|---------------|-------------|--------------------------|
| level-03 | x:1880 y:184 w:128 | overlaps floor-2 (1320..1920) by 40px (1880..1920); extends into the following gap to x2008 | 0..40 (**narrow — see caveat**) | 136px | ≤70px | ≥250 |
| level-03 | x:2640 y:192 w:128 | overlaps floor-3 (2040..2680) by 40px (2640..2680); extends into gap to x2768 | 0..40 (**narrow — see caveat**) | 128px | ≤70px | ≥250 |
| level-04 | x:1080 y:200 w:112 | touches floor-1's end exactly (floor-1 ends 1080) | 0..112 | 120px | ≤75px | ≥245 |
| level-04 | x:1400 y:216 w:80 | fully contained within floor-2 (1240..1760) | 0..80 (full platform width) | 104px | ≤75px | ≥245 |
| level-04 | x:1760 y:176 w:128 | touches floor-2's end exactly (floor-2 ends 1760) | 0..128 | 144px | ≤75px | ≥245 |
| level-04 | x:2140 y:216 w:80 | fully contained within floor-3 (1960..2520) | 0..80 (full platform width) | 104px | ≤75px | ≥245 |
| level-04 | x:2520 y:192 w:112 | touches floor-3's end exactly (floor-3 ends 2520) | 0..112 | 128px | ≤75px | ≥245 |
| level-04 | x:3240 y:184 w:112 | touches floor-4's end exactly (floor-4 ends 3240) | 0..112 | 136px | ≤75px | ≥245 |

`[VERIFIED: scripts/lib/reachability.mjs canReach() logic, src/levels/level-03.js, src/levels/level-04.js, scripts/lib/jump-envelope.mjs]`

**Physics basis for the "≤70-75px rise" recommendation:** for a rising hop (`dy < 0`), `canReach` accepts EITHER of two positive-root candidates (the short "hop and land near apex" root, or the long "hop and land descending" root) whichever falls within `[spanMin, spanMax]`, and reports the LOWEST `marginRatio` among matches. Hand-computed at `dy = -70` (rise 70px): `disc = 520² + 2×1400×(-70) = 74400`, roots give reach candidates ≈ 38.5px and ≈ 123.4px. Both level-04-style windows (span up to 80–128px) admit the ~38.5px short-root candidate → `marginRatio ≈ 38.5/123.4 ≈ 0.31` — comfortably PASS (well under the 0.9 WARN threshold). At `dy = -75` for level-03's 40px-wide windows, the short root grows to ≈42.7px, which no longer fits the 40px window — **this is the caveat**: level-03's two narrow-overlap platforms need to stay at or below ~70px rise (not up to 75), or the model's narrow 40px effective window rejects both root candidates and the platform reverts to a real HARD-FAIL despite being "under maxRise." **Recommendation: target rise ≈60-65px for level-03's two platforms specifically, and rise ≈65-75px for level-04's six platforms** (the wider windows tolerate the recommendation with margin).

**This is guidance, not a substitute for verification** — the exact numbers depend on final x-positions too (unchanged per CONTEXT.md, but double-check floor spans haven't shifted from any earlier fix in the same file). After each edit, run `node scripts/validate-levels.mjs` and read the printed `marginRatio` directly; iterate the y value if the row prints WARN (≥0.9) or HARD-FAIL rather than trusting this table's numbers as final.

## Camera Bounds / Level Extension Mechanics

`[VERIFIED: src/scenes/game.js lines 80-93, src/camera.js lines 16-30, src/levels/level-0{1..4}.js]`

- **level-01 has NO `bounds` field in its descriptor.** `game.js` computes `bounds.right` dynamically: `Math.max(...floors.map(f => f.x+f.w), ...platforms.map(p => p.x+p.w), goal.x + CONFIG.GOAL_SIZE)`. This means **extending level-01's floors/platforms/goal automatically grows the camera's right clamp** — no descriptor field needs to be added, and `CONFIG.LEVEL_RIGHT` (2240) is NOT read for level-01 once any geometry exists (it's only a fallback inside `game.js`'s own default-bounds object, itself only used as a last resort if `level.geometry` were entirely empty, which never happens for a real level).
- **level-02/03/04 all carry an explicit `bounds: { left, right, top, bottom }` field** that game.js uses AS-IS (`level.bounds ?? {...dynamic}"` — the `??` short-circuits entirely once `level.bounds` is truthy, so the dynamic computation never runs for these three). Current values and current buffer past goal:
  - level-02: `bounds.right: 2800`, goal at x2720 (+16 size = 2736) → 64px buffer
  - level-03: `bounds.right: 3400`, goal at x3320 (+16 = 3336) → 64px buffer
  - level-04: `bounds.right: 4000`, goal at x3920 (+16 = 3936) → 64px buffer
  - **Action required:** when extending these three levels, `bounds.right` MUST be manually bumped to (new goal x + GOAL_SIZE + similar ~64-80px buffer), or the camera will clamp before the new goal and/or the parallax background (`src/parallax.js` reads `bounds.right - bounds.left` for tile count) will under-cover the extended level.
- `CONFIG.LEVEL_BOTTOM`/`FALL_MARGIN` (vertical respawn threshold) are unaffected by horizontal extension — no change needed there for any level.

## Checkpoint Formula (verbatim from level-01.js's own comment)

`[VERIFIED: src/levels/level-01.js lines 88-94]`

```js
// checkpoints: [{ x: <chosen>, y: FLOOR_Y - 48 }]
```

`FLOOR_Y - 48` (= 320 - 48 = 272) is the universal y for every checkpoint in all 4 shipped levels (confirmed identical across level-01/02/03/04's `checkpoints` arrays — every entry uses `y: FLOOR_Y - 48`). The literal couples to player height (32px, topleft-anchor) plus a deliberate 16px "drop-in" gap: `FLOOR_Y - (32 + 16) = FLOOR_Y - 48`. **New checkpoints in extended sections must use this exact same `y: FLOOR_Y - 48` — there is no per-position variation, only `x` changes.** Checkpoint x-placement convention (per CONTEXT.md's locked rule): one checkpoint immediately before each hazard/mechanic encounter, mirroring level-01's existing pattern of placing a checkpoint just before each spike (e.g. checkpoint x:800 before spike x:880 — an 80px lead).

## smoke-progress.mjs Re-Baseline Map

`[VERIFIED: scripts/smoke-progress.mjs — read in full]`

Four separate, independent deep-equal blocks, each comparing `getLevel("level-0N").geometry` against a hardcoded `expectedGeometry` object literal:

| Level | Comment header line | `expectedGeometry` object lines | `check(...)` assertion line |
|-------|----------------------|----------------------------------|-------------------------------|
| level-01 | 282 (`--- LVL-02 regression: level-01 geometry === v3.0 src/level.js values, VERBATIM ---`) | 288–344 | 346–348 |
| level-02 | 351 (`--- LVL-02 regression: level-02 geometry matches authored descriptor ---`) | 354–409 | 411–413 |
| level-03 | 416 (`--- LVL-02 regression: level-03 geometry matches authored descriptor ---`) | 419–485 | 487–489 |
| level-04 | 492 (`--- LVL-02 regression: level-04 geometry matches authored descriptor ---`) | 495–572 | 574–576 |

Each block's `expectedGeometry` is a full byte-for-byte duplicate of that level's current `geometry` object (floors/platforms/coins/spikes/goal/checkpoints/doors/mathGates/enemies/collectZones/answerPickupSlots). **Any edit to any of these arrays in any of the 4 level files (fix OR extension) will fail that level's block** the moment `node scripts/smoke-progress.mjs` (or `scripts/check-progress.sh`, which calls it at line 129) runs. CONTEXT.md's decision text names only level-01's fixture explicitly, but the actual scope is all 4 blocks — the planner should schedule a re-baseline task per level (or one combined task touching all 4 blocks), each following CONTEXT.md's "retain the OLD pre-extension values in a comment, explain why the pin changed" convention. Recommended comment pattern (mirroring the project's `CONFIG.JUMP_FORCE`/`jump-envelope.mjs` provenance-comment convention already in the codebase):

```js
// Phase 24 re-baseline: level-0N extended + structural fixes applied (VALID-04/LVL-01).
// OLD (pre-Phase-24, v4.1) values, retained for historical traceability:
//   floors: [{ x: 0, w: 560 }, { x: 720, w: 480 }, { x: 1360, w: 880 }]
//   ... (etc — old array literal per changed key)
```

## Interactive Audit — No Code Changes Needed

`[VERIFIED: scripts/lib/mechanic-drive.mjs, scripts/lib/audit-retry.mjs, scripts/audit-phase21-mechanics.mjs]`

`deriveEncounters(geometry)` (in `mechanic-drive.mjs`) builds its encounter list by mapping over `geometry.doors`/`mathGates`/`enemies`/`collectZones` and sorting by `x` — it is fully data-driven with no level-specific or count-specific assumptions. `driveToXClimbing` drives to each encounter's absolute `x` in ascending order, starting from wherever the player currently is (not from level start each time), so newly appended mechanics in extended sections are automatically discovered and driven to without any script edit. **Re-run `node scripts/audit-phase21-mechanics.mjs` unmodified** after all descriptor edits land; it will print a longer `results` array (old + new encounters) but requires zero code changes.

One nuance worth flagging as an **Open Question** for the planner: `driveToXClimbing` has a bounded `maxIterations: 250` per single encounter-approach call (each poll tick ≈120-450ms depending on grounded/airborne state), which caps how far a single approach can travel before declaring a stall/timeout. Since the wrapper drives encounter-to-encounter (not the whole level in one call), this is only a risk if a single level's extended section places two consecutive mechanic encounters (or the last encounter and the goal) unusually far apart with no checkpoint stops in between — CONTEXT.md's "checkpoint before every hazard" convention naturally keeps encounter spacing modest, so this is unlikely to bite, but the planner should keep new-mechanic spacing within roughly the same order of magnitude as existing gaps (200–600px between consecutive encounters in the shipped levels) rather than, e.g., placing a single new mathGate 2000px past the last existing one with nothing in between.

## Common Pitfalls

### Pitfall 1: Assuming level-01 needs a `bounds` field added
**What goes wrong:** A plan/task adds an explicit `bounds: { left, right, ... }` to `level-01.js` "to be safe," duplicating logic that `game.js` already derives dynamically, and now risks the new static value drifting out of sync with a LATER edit (e.g., if Phase 25 further modifies level-01).
**Why it happens:** The phase-description's own scouting note raised this as a concern, based on `CONFIG.LEVEL_RIGHT` naming, without reading `game.js`'s actual fallback logic.
**How to avoid:** Leave level-01 with no `bounds` field. Only levels 2–4 (which already have explicit `bounds`) need their `bounds.right` manually bumped.
**Warning signs:** If level-01's camera stops scrolling before the new goal after extension, check whether `level.bounds` was mistakenly added (short-circuiting the dynamic computation) rather than the geometry arrays being incomplete.

### Pitfall 2: Re-baselining only level-01's smoke fixture
**What goes wrong:** `node scripts/smoke-progress.mjs` (and `scripts/check-progress.sh`, which calls it) fails on level-02/03/04's blocks after those levels are extended/fixed, because CONTEXT.md's prose only explicitly named level-01's fixture.
**Why it happens:** CONTEXT.md's Verification Evidence section text only calls out "level-01's smoke-progress.mjs geometry-pinning fixture," but the file itself pins all 4 levels independently.
**How to avoid:** Treat all 4 `expectedGeometry` blocks (lines 288-344, 354-409, 419-485, 495-572) as in-scope for re-baselining, following the same "retain old values in a comment" convention for each.
**Warning signs:** `smoke-progress: FAIL` naming a level-02/03/04 assertion after level-01's own block already passes.

### Pitfall 3: Over-trusting "rise < 88.331px" alone as sufficient for the 8 platform fixes
**What goes wrong:** A platform is lowered to, say, 85px rise (technically under `maxRise`), but for level-03's two narrow-overlap platforms specifically, the resulting jump-reach candidates don't fit the narrow 40px effective span window, and `validate-levels.mjs` still reports HARD-FAIL (or WARN right at the 0.9 boundary).
**Why it happens:** `maxRise` is a hard cutoff for whether ANY candidate reach exists at all (`jumpReach` returns `[]` above it), but whether a candidate reach lands within the SPECIFIC platform's `[spanMin, spanMax]` window is a separate, per-platform geometric constraint that depends on the neighboring floor's overlap/adjacency shape.
**How to avoid:** Use the per-platform target ranges in "Structural Defect Fix Targets" above (≤60-65px rise for level-03's two narrow-window platforms; ≤65-75px for level-04's six wider-window platforms), and always confirm with `node scripts/validate-levels.mjs`'s printed `marginRatio` after each edit rather than trusting the maxRise cutoff alone.
**Warning signs:** `validate-levels.mjs` reports HARD-FAIL or WARN with `marginRatio` near 0.9+ on a platform row after a fix that "should" have worked per the naive maxRise check.

### Pitfall 4: Placing a new mathGate/door/enemy footprint on an elevated platform in the extended section
**What goes wrong:** `over-hole-check.mjs` explicitly only checks `geometry.floors` coverage (documented in its own header: "this checks ONLY floor-run coverage... never geometry.platforms... every shipped door/mathGate/enemy/collectZone in this game sits at floor level"). A new mechanic mounted on a platform would silently bypass this HARD-FAIL check even if its footprint floats over a hole relative to the platform.
**Why it happens:** The check's scope was deliberately narrowed to match the shipped convention, not because platform-mounted barriers are impossible to author.
**How to avoid:** Keep every new door/mathGate/enemy/collectZone in the extended sections at floor level (`y: FLOOR_Y - CONFIG.<KIND>.H`), exactly matching the existing convention in all 4 files.
**Warning signs:** A validator PASS on a level whose new mechanic visually appears to float — this would be a false-negative the validator cannot catch by design.

### Pitfall 5: Editing the ORIGINAL kid-validated geometry while "fixing" a defect
**What goes wrong:** To fix an over-hole gate, a plan reshapes a floor run's width (e.g., extends floor-0 from `w:560` to `w:600` to "catch" the gate at its original x600) instead of moving the gate.
**Why it happens:** It can look like a smaller diff than moving the gate's x value.
**How to avoid:** CONTEXT.md locks "reposition the gate, not the floor" — floor/platform geometry inside the original kid-validated extent must stay byte-identical except for the 8 platforms' y-values (which CONTEXT.md explicitly authorizes lowering) and the goal/floors extension appended strictly after. The 3 gates' x values are the only pre-extension values authorized to change.
**Warning signs:** A diff touching `floors`/`platforms` `x`/`w` values in the pre-extension range for reasons other than the 8 authorized platform y-lowers.

## Code Examples

### Running the structural validator (per-level or full registry)
```bash
# Source: scripts/validate-levels.mjs's own documented CLI usage
node scripts/validate-levels.mjs                    # checks every LEVEL_ORDER entry
node scripts/validate-levels.mjs --fixture <path>   # checks only a fixture's exported level-shaped constant
```

### Reading a HARD-FAIL vs WARN row (verbatim format from validate-levels.mjs)
```
level-04 | over-hole | HARD-FAIL | mathGates footprint 1800..1832
level-01 | gap-width | WARN | gap 560..720 between floor-0 and floor-1 (marginRatio=1.000)
level-04 | mechanic-reachability | HARD-FAIL | mathGates x:1800..1832 not on any floor run
```
Source: `.planning/phases/23-level-validation-harness/23-FINDINGS.md`'s RED-first-proof output (verbatim run against the untouched levels 1-4).

### Checkpoint / spike / mathGate placement idiom (verbatim from level-01.js)
```js
// Source: src/levels/level-01.js
spikes: [
  { x: 880, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
],
checkpoints: [
  { x: 800, y: FLOOR_Y - 48 }, // before the first spike (x=880)
],
mathGates: [
  { x: 600, y: FLOOR_Y - CONFIG.MATH_GATE.H },
],
```

## State of the Art

Not applicable in the traditional sense (no external ecosystem to track) — the relevant "state of the art" is this project's OWN validator, which is only 1 phase old (Phase 23) and has already had one post-plan correction (the `canReach` overlap-span bug, fixed in commit `de093aa`, documented in `23-FINDINGS.md`'s "Post-Plan Correction" section). The CORRECTED validator output (not the pre-correction 13-hard-failure run) is the authoritative baseline to diff against — see `23-FINDINGS.md`'s "Corrected validator output" section for the final, accurate pre-Phase-24 HARD-FAIL list: level-01 over-hole ×2, level-01 mechanic-reachability ×2, level-04 over-hole ×1, level-04 spawn-goal ×1, level-04 gap-width ×1, level-04 mechanic-reachability ×2 (the 8 platforms arbitrated separately in section (e), since they never appear as named rows in the standard 3-check output).

**Deprecated/outdated:** the pre-correction "13 hard-failure(s) across 4 level(s)" figure in `23-FINDINGS.md`'s main RED-first-proof section is superseded by its own "Post-Plan Correction" section — do not cite the uncorrected number as this phase's starting HARD-FAIL count.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Target rise bands (~60-65px for level-03's 2 platforms, ~65-75px for level-04's 6) will produce PASS (not WARN/HARD-FAIL) marginRatios | Structural Defect Fix Targets | Low — explicitly flagged as guidance requiring `validate-levels.mjs` confirmation per-edit, not a locked final number; wrong guess just means one more iteration, not a wrong fix |
| A2 | 50-75% length increase per level maps to specific px ranges cited in CONTEXT.md (e.g., level-01 +1200-1700px) is a reasonable, non-binding starting point for the planner's exact-length discretion | Level Extension Design (inherited from CONTEXT.md, not independently re-derived here) | Low — CONTEXT.md already marks exact length as Claude's discretion; this research doesn't add a stronger claim |

**If this table is empty:** N/A — two low-risk, explicitly-flagged-as-non-final assumptions are logged above; both are computed/verified from real code and physics, not fabricated, but their FINAL correctness depends on iterative validator confirmation the planner must schedule as a task, not skip.

## Open Questions

1. **How many NEW mechanic instances (mathGate/door/enemy/collectZone) should each extended section contain?**
   - What we know: CONTEXT.md locks that any new mechanic must reuse a TYPE already present in that level (e.g., level-02 stays enemy/collectZone-free), and that checkpoint density must scale with new hazards.
   - What's unclear: CONTEXT.md does not specify a minimum/target COUNT of new mechanic instances per level's extension — this is left implicit.
   - Recommendation: Given success criterion 4 ("the upgraded interactive audit drives each lengthened level start→goal with mechanic encounters resolved"), each extended section should contain at least 1 new instance of at least one of that level's existing mechanic types (so there's something new for the audit to exercise) — but the exact count is Claude's discretion per CONTEXT.md's own scope; the planner should make an explicit per-level call (e.g., level-01 gets 1 new mathGate + 1 new spike-set; level-02 gets 1 new mathGate only, no enemy/collectZone) and record the rationale in `24-FINDINGS.md`.

2. **Does the interactive audit need to explicitly reach the GOAL, or is "last mechanic encounter" sufficient?**
   - What we know: `audit-phase21-mechanics.mjs`/`mechanic-drive.mjs` only ever drives to each mechanic encounter's x, never explicitly to `geometry.goal.x` — the static validator's `spawn-goal` check is the only automated proof of goal-reachability today.
   - What's unclear: Success criterion 4's "drives each lengthened level start→goal" phrasing could be read as requiring the interactive audit to be extended to also approach the goal, which would be a code change to `audit-phase21-mechanics.mjs` (currently out of CONTEXT.md's locked scope — CONTEXT.md's Reusable Assets section only says "re-run" this script, not "extend" it).
   - Recommendation: Treat "start→goal" as satisfied by the COMBINATION of (a) the static validator's `spawn-goal` HARD-FAIL/WARN/PASS check (which does check literal goal-reachability) and (b) the interactive audit covering every mechanic encounter along the way — this matches CONTEXT.md's Reusable Assets section, which lists the audit script as reused unmodified. If the planner wants to be extra safe, a trivial task could add one more `driveToXClimbing(page, geometry.goal.x)` call per level as a belt-and-braces check, but this is not CONTEXT.md-mandated and would be a (small) code change to a script CONTEXT.md otherwise treats as reuse-only.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All `scripts/*.mjs` (validator, smoke, audit) | ✓ (assumed — project has run these scripts throughout Phases 21-23) | not pinned in a package.json (none exists) | — |
| Playwright | `scripts/audit-phase21-mechanics.mjs` (interactive audit) | Not independently re-verified this session — resolved dynamically by the script itself via 3-tier fallback (see Standard Stack section) | unspecified | `PLAYWRIGHT_MJS_PATH` env override, or the hardcoded machine-specific fallback path already in the script |
| Chromium (via Playwright) | Same audit script (`chromium.launch({ headless: true })`) | Same as above | — | — |

**Missing dependencies with no fallback:** none identified — Node.js itself has no fallback but is assumed present given the project's entire toolchain depends on it and prior phases (21-23) already ran these exact scripts successfully.

**Missing dependencies with fallback:** Playwright/Chromium resolution has 2 documented fallback paths already built into the audit script; if neither the normal resolution nor the env override works on the execution machine, the hardcoded fallback path is machine-specific (tied to `magnus`'s home directory) and may not exist on a different execution environment — the planner should note this as a possible blocker for the interactive-audit verification step specifically (not for the validator/smoke steps, which are pure Node with no browser dependency).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no-build/no-dep canon) — plain Node ES modules with a hand-rolled `check(cond, msg)`/failures-counter/`process.exit(1)` idiom, consistent across `smoke-progress.mjs`, `validate-levels.mjs`, and the `over-hole-check.mjs`/`reachability.mjs` inline self-tests |
| Config file | none — each script is directly `node`-invoked |
| Quick run command | `node scripts/validate-levels.mjs` (structural gate, <1s, pure data) |
| Full suite command | `node scripts/validate-levels.mjs && node scripts/smoke-progress.mjs && node scripts/check-progress.sh && node scripts/audit-phase21-mechanics.mjs` (adds the XP/level regression smoke, the shell-wrapped progress gate, and the ~30-90s browser-driven interactive audit) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALID-04 | Zero HARD-FAILs across all 4 levels after fixes | structural/static | `node scripts/validate-levels.mjs` (exits 0 on success) | ✅ |
| LVL-01 | Extended geometry stays structurally valid (no new over-hole/unreachable regressions) | structural/static | `node scripts/validate-levels.mjs` (re-run after extension edits) | ✅ |
| LVL-01 | Checkpoint density scales — no respawn loses more than one section | manual/visual (no automated "section size" check exists) | — (verify by inspection: checkpoint immediately precedes each new hazard, per CONTEXT.md's rule) | ❌ — no test file; this is a data-authoring convention, not a testable assertion |
| LVL-01/VALID-04 | Geometry-pinning regression smoke stays accurate post-edit | unit/regression | `node scripts/smoke-progress.mjs` (must be re-baselined FIRST, then re-run to confirm PASS) | ✅ (needs re-baseline, not a new file) |
| VALID-04/LVL-01 | Every mechanic encounter (old + new) is interactively `triggered:true` | integration/e2e (Playwright-driven) | `node scripts/audit-phase21-mechanics.mjs` | ✅ |

### Sampling Rate
- **Per task commit (fix or extension edit to a single level file):** `node scripts/validate-levels.mjs` (fast, pure-data, catches regressions immediately)
- **Per wave merge (after all 4 levels' fixes+extensions land):** full suite — `validate-levels.mjs` + `smoke-progress.mjs` (post re-baseline) + `check-progress.sh` + `audit-phase21-mechanics.mjs`
- **Phase gate:** full suite green (validator zero HARD-FAILs, smoke PASS, audit 100% `triggered:true`) before writing `24-FINDINGS.md` and closing the phase

### Wave 0 Gaps
None — every test file this phase needs already exists (`scripts/validate-levels.mjs`, `scripts/smoke-progress.mjs`, `scripts/audit-phase21-mechanics.mjs` + its `lib/` dependencies). The only "gap" is that `smoke-progress.mjs`'s 4 geometry blocks are currently pinned to PRE-Phase-24 values and must be updated as part of this phase's own work (not a pre-existing infrastructure gap to fill before starting).

## Security Domain

`security_enforcement` is enabled (`.planning/config.json`: `security_asvs_level: 1`), but this phase's scope (editing static level-geometry data consumed only by the local, offline, single-player client and by Node-side build tooling) has essentially no attack surface — no network input, no auth, no user-supplied data parsing beyond what Phase 22/23 already hardened (`createProgress`'s hostile-blob guards in `smoke-progress.mjs`, untouched by this phase).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface in this game |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | Single local player, no access boundaries |
| V5 Input Validation | Marginal | Level descriptors are static data authored by the developer, not runtime-parsed untrusted input — no new validation surface introduced. The EXISTING `createProgress`/`getLevel` forgiving-fallback guards (already hardened in Phase 22/23) are untouched. |
| V6 Cryptography | No | No crypto in this phase |

### Known Threat Patterns for this stack
None applicable — pure local static-data edits with no new input/output boundary. The only "trust boundary" touched (localStorage save blob parsing) is pre-existing code (`src/progress.js`) this phase does not modify.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `scripts/lib/jump-envelope.mjs` — frozen calibrated constants + full provenance comment
- `scripts/lib/reachability.mjs` — BFS/jump-edge model, `canReach`/`checkLevelReachability` full source + inline self-tests
- `scripts/lib/over-hole-check.mjs` — exact interval-arithmetic over-hole checker, full source + inline self-tests
- `scripts/validate-levels.mjs` — CLI orchestrator, full source
- `scripts/smoke-progress.mjs` — full source, all 4 geometry-pinning blocks read and line-numbered
- `scripts/audit-phase21-mechanics.mjs`, `scripts/lib/audit-retry.mjs`, `scripts/lib/mechanic-drive.mjs` — full source
- `src/levels/level-0{1,2,3,4}.js`, `src/levels/index.js` — full source
- `src/scenes/game.js` (lines 70-118), `src/camera.js`, `src/parallax.js` — bounds/camera derivation logic
- `src/config.js` — full CONFIG constants
- `.planning/phases/23-level-validation-harness/23-FINDINGS.md` — RED-first-proof evidence + Post-Plan Correction section (authoritative pre-Phase-24 baseline)
- `.planning/phases/24-fix-lengthen-levels-1-4/24-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — requirement text and project history

### Secondary (MEDIUM confidence)
None used — this phase required no external documentation lookups; the entire domain is this project's own codebase.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, fully verified against the existing repo
- Architecture: HIGH — all bounds/camera/audit/smoke behavior directly read from source, not inferred
- Structural defect fix targets: HIGH for the "which floor edge / which direction" facts (exact interval arithmetic from the files); MEDIUM for the exact recommended rise numbers (physics-derived but explicitly flagged as needing iterative `validate-levels.mjs` confirmation, not a closed-form guarantee)
- Pitfalls: HIGH — each pitfall traces to a specific, quoted line/behavior in the actual code, not a generic platforming-game guess

**Research date:** 2026-07-06
**Valid until:** Effectively indefinite for the reachability-model facts (this is the project's own frozen, checked-in code, not a third-party API that could change underneath this research) — but re-verify against the live files if any OTHER phase touches `scripts/lib/reachability.mjs`, `scripts/lib/jump-envelope.mjs`, or `src/levels/*.js` before Phase 24 executes (e.g., if Phase 24 planning/execution spans multiple sessions with other work interleaved).
