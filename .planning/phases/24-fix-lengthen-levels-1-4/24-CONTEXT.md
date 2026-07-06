# Phase 24: Fix & Lengthen Levels 1–4 - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — Area 1 presented, user AFK on timeout; Areas 1–4 all accepted on recommendation (same precedent as Phases 22 and 23's CONTEXT.md).

<domain>
## Phase Boundary

Fix every structural defect Phase 23's validator confirmed on levels 1–4 (3 exact over-hole math gates: level-01 x600/x1300, level-04 x1800; 8 confirmed-unreachable platforms: level-03 x1880/x2640, level-04 x1080/x1400/x1760/x2140/x2520/x3240 — all 8 require 104–144px of rise against the calibrated 88.331px maxRise), then extend each of the 4 levels with new content appended strictly AFTER the existing kid-validated geometry — never editing inside it. Checkpoint density in the new sections must keep respawns within one section's reach. `scripts/validate-levels.mjs` (built in Phase 23) is this phase's primary structural-soundness gate; it must pass green (zero HARD-FAILs) on all four levels when done. Level-01's smoke-progress.mjs geometry-pinning fixture must be consciously re-baselined to the new post-extension geometry, not deleted.

</domain>

<decisions>
## Implementation Decisions

### Structural Defect Fix Approach
- Over-hole math gates (level-01 x600/x1300, level-04 x1800): reposition the gate itself onto solid floor (nearest edge), preserving its role/order in the level's mechanic sequence and its exact table-pool wiring — do not extend/reshape floor geometry to chase the existing position
- Unreachable platforms (8 total across level-03/level-04): lower each platform's y until it falls within the calibrated envelope's reach from its neighboring nodes, preserving its x-position/visual role in the level's flow
- "Validator passes green" means zero HARD-FAILs (matches ROADMAP wording exactly) — WARN rows are expected and non-blocking, given Phase 23's own documented marginRatio=1.0 precision limitation for flat/downward hops; this phase is not scoped to retune that
- Repositioning preserves mechanic TYPE and table-pool wiring exactly (x/y-only changes) — no re-authoring of mechanic content during structural fixes

### Level Extension Design
- Each level gets roughly 50–75% additional length appended after its current ending (e.g., level-01 currently ends ~x2240; add roughly 1200–1700px of new content) — "noticeably longer" without reaching into Phase 25's "8 levels total" scope, since no exact target length is specified in ROADMAP
- New sections continue each level's existing internal difficulty trajectory using the SAME per-level `allowedTables` pool — no new difficulty tier or table-pool change (that's Phase 25's job, not this "fix & lengthen" phase's)
- New sections reuse only mechanic TYPES already present in that specific level (e.g., level-02 has zero enemies/collectZones today — its extension stays that way) — preserves each level's established identity rather than introducing net-new mechanic variety
- New coins are added in proportion to the new length, matching each level's existing coin-spacing density — keeps visual/reward consistency rather than a "bolted-on" feel

### Checkpoint Density & Respawn Safety
- Concrete placement rule: one checkpoint immediately before each hazard/mechanic encounter in the new section, mirroring the exact existing per-level convention (e.g., level-01 already places one checkpoint before each of its 3 spikes) — directly satisfies "a respawn never sends her back more than one section"
- Existing (pre-extension) checkpoints in the original kid-validated geometry are never touched — only new checkpoints are added in the appended section, consistent with the "append after, never edit inside" boundary

### Verification Evidence & Smoke Re-Baselining
- `smoke-progress.mjs`'s level-01 geometry-pinning fixture: update the pinned expected-geometry values to the new post-extension numbers, with an explicit code comment explaining why the pin changed (Phase 24 lengthening) — mirrors this project's established "explain why a baseline moved" convention (e.g., `CONFIG.JUMP_FORCE`'s tuning comment, `jump-envelope.mjs`'s calibration provenance comment). Retain the OLD pre-extension values in a comment for historical traceability, not a silent overwrite.
- Interactive-audit acceptance bar: require `triggered:true` (reached) for all encounters — old and new — as the primary, non-negotiable bar; `resolved:true` is the goal but not an absolute per-run blocking requirement, given the pre-existing, already-documented resolution-timing flakiness from Phases 21/22/23 (unrelated to this phase's own changes)
- `node scripts/validate-levels.mjs` is run as this phase's primary acceptance evidence — success criterion 1 requires it explicitly
- `22-FINDINGS.md` and `23-FINDINGS.md` remain historical record (append a brief "resolved in Phase 24" cross-reference note, don't rewrite their tables); this phase creates its own `24-FINDINGS.md` (or equivalent evidence doc) for its own fix verification, per the project's established per-phase evidence-artifact convention

### Claude's Discretion
- Exact new-length figure within the 50–75% range per level, and exact new checkpoint/coin/spike positions within the new sections
- Internal structure of `24-FINDINGS.md`
- Whether lowered platforms need any accompanying visual/collision tweaks beyond the y repositioning (e.g., adjacent coin repositioning if a coin was placed relative to the old platform height)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/validate-levels.mjs`, `scripts/lib/reachability.mjs`, `scripts/lib/over-hole-check.mjs`, `scripts/lib/jump-envelope.mjs` (Phase 23) — the structural-soundness gate this phase must satisfy; run early and often while fixing/extending
- `scripts/audit-phase21-mechanics.mjs` + `scripts/lib/audit-retry.mjs` (Phase 23) — the interactive audit with retry harness; drives each level start→goal and reports per-encounter `triggered`/`resolved`
- `scripts/smoke-progress.mjs` — contains the level-01 geometry-pinning deep-equals assertion that must be consciously re-baselined
- `src/levels/level-0{1..4}.js` — the 4 level descriptors to edit; `src/levels/index.js` — the registry (no changes needed, ids/order unchanged)
- `src/config.js` — `FLOOR_Y`, `LEVEL_RIGHT`/`LEVEL_LEFT`, mechanic H/W constants used throughout level descriptors

### Established Patterns
- Level descriptors are PURE data modules (no engine globals) — `import { CONFIG } from "../config.js"` only
- Checkpoint convention: one checkpoint placed just before each hazard, at `{ x, y: FLOOR_Y - 48 }` (couples to player height, documented in level-01.js's own comment)
- Coins are 32×32 sprites at `{x,y}` top-left anchor (16px offset from grid-aligned floor/platform geometry) — intentional, documented off-grid placement
- No-npm/no-build-step convention — everything runs via direct `node scripts/*.mjs`

### Integration Points
- `src/levels/*.js` geometry arrays (`floors`, `platforms`, `doors`, `mathGates`, `enemies`, `collectZones`, `coins`, `spikes`, `checkpoints`, `goal`) — the surfaces this phase edits
- `scripts/validate-levels.mjs`'s HARD-FAIL/WARN output — the direct feedback loop while fixing

</code_context>

<specifics>
## Specific Ideas

Exact confirmed defects to fix (from Phase 23's RED-first proof, `23-FINDINGS.md`):
- level-01 mathGate x600..632 over hole (gap 560..720)
- level-01 mathGate x1300..1332 over hole (gap 1200..1360)
- level-04 mathGate x1800..1832 over hole (gap 1760..1960)
- 8 confirmed-unreachable platforms (each requires 104–144px rise vs the calibrated 88.331px maxRise): level-03 x1880 y184 w128, x2640 y192 w128; level-04 x1080 y200 w112, x1400 y216 w80, x1760 y176 w128, x2140 y216 w80, x2520 y192 w112, x3240 y184 w112

Current level end/goal positions (for extension planning): level-01 goal x2160 (extent ~2240); level-02 goal x2720 (bounds right 2800); level-03 goal x3320; level-04 goal x3920.

</specifics>

<deferred>
## Deferred Ideas

- 4 new levels (5–8), difficulty ramp across all 8, 2×4 select grid, dropping tables 1/10 → Phase 25
- Palette/visual identity, rebrand, logo → Phase 26
- Audio/SFX → Phase 27
- Full 8-level interactive-audit closure and final human sign-off → Phase 28 (VALID-03 final close)
- WARN-tier marginRatio precision retuning (Phase 23's documented limitation) → not scoped to any phase yet, noted in STATE.md Blockers/Concerns

</deferred>
