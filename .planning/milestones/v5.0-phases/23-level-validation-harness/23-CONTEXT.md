# Phase 23: Level Validation Harness - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — Area 1 presented, user AFK on timeout; Areas 1–4 all accepted on recommendation (same precedent as Phase 22's CONTEXT.md).

<domain>
## Phase Boundary

Build and prove a static level validator (`scripts/validate-levels.mjs`) plus an upgraded interactive mechanic-drive audit, both scoped to the existing 4 levels. The validator's jump envelope must come from a one-time empirical measurement against the real running engine (not the closed-form CONFIG formula, which Phase 22 already proved produces unsafe-margin false candidates). Before the validator is trusted as a gate, it must be run RED-first against the untouched levels 1–4 and shown to independently catch the known structural defects Phase 22 inventoried (3 exact over-hole math gates, 8 heuristic-candidate platforms). No level descriptor is fixed in this phase — Phase 24 owns fixes; this phase only calibrates and proves the gate. The interactive audit upgrade only needs to shrink (not close) the existing 6/16 mechanic-encounter blind spot on levels 1–4, with every remaining exclusion individually documented — full 8-level closure is Phase 28's job (VALID-03).

</domain>

<decisions>
## Implementation Decisions

### Validator Check Design
- Spawn→goal reachability: graph/BFS reachability over floor runs + platforms + gap edges, using the calibrated jump envelope as edge cost (chain-of-hops model) — not a single-hop-only check, since Phase 22 already found level-04 candidates that may only be reachable via multi-platform chains
- Door/mathGate-over-hole check: exact interval arithmetic (barrier footprint vs floor-run coverage) — promote Phase 22's scratchpad `interval-check-22-04.mjs` logic into the real validator; it already proved correct against the 3 known over-hole rows
- Output format: human-readable per-level stdout report (level id / check name / PASS-FAIL / offending descriptor), non-zero exit on any failure — matches `check-gate.sh`'s existing convention; no JSON needed (no CI consumes it)
- Standalone script only (`node scripts/validate-levels.mjs`, per ROADMAP wording verbatim) — not wired into `check-gate.sh`; matches the no-npm direct-`node` invocation pattern already used by `smoke-progress.mjs` and `browser-boot.mjs`
- Scope is exactly the 4 ROADMAP-named checks (spawn→goal reachability, gap width vs envelope, door-over-hole, mechanic reachability) — no opportunistic extra checks, to avoid scope creep in a phase meant to close a specific known failure class

### Jump Envelope Calibration
- Empirical measurement via a dedicated Playwright probe reusing `browser-boot.mjs`'s launch/page pattern — spawn the player on a flat test strip, press jump, sample real position via `page.evaluate` (same technique already proven in `mechanic-drive.mjs`)
- Safety margin derived empirically from the calibration run's own variance, with the chosen margin explicitly documented in code comments (not a blind round-number guess) — the CONFIG-formula heuristic's "no safety factor" was already flagged in 22-FINDINGS as a source of false candidates
- One-time measurement recorded as a checked-in constant (mirrors `CONFIG.JUMP_FORCE`'s tuning-comment style) — the validator does NOT launch a browser on every invocation; re-measuring every run would make it too slow for routine use
- Multi-hop/chain reachability is supported by the envelope model (feeds Area 1's BFS graph), not single-hop-only

### RED-First Proof & Findings Documentation
- "Proven RED" means: validator non-zero-exits against the untouched levels 1–4 AND its failure list specifically names the known defects (level-01 mathGate x600/x1300, level-04 mathGate x1800) — recorded as an evidence table, not just a bare non-zero exit code
- Two severity tiers in validator output: HARD-FAIL (exact interval arithmetic proves impossible) vs WARN (reachability graph says technically reachable but tight/near-envelope-edge) — mirrors 22-FINDINGS' own "exact" vs "heuristic candidate" distinction, avoids false-failing legitimate tight jumps
- Zero level-descriptor fixes in this phase (already-locked project decision, not re-litigated): "Validator trusted only after catching the known live bugs... Phase 24 fixes them"
- Findings written to a new `23-FINDINGS.md` following the 21/22-FINDINGS.md per-check evidence-table format — keeps the RED-first proof auditable for Phase 28's final sign-off

### Interactive Audit Harness Upgrade (VALID-03 groundwork)
- Blind-spot reduction via a multiple-run retry strategy (3–5 retries) on the existing `driveToXClimbing` model — an encounter counts as reached if ANY retry reaches it, since 22-FINDINGS already documented some rows as timing-sensitive (flip between identical-code runs) rather than fundamentally unreachable
- Effort ceiling: 3–5 retries per still-unreached encounter, then accept it as a documented exclusion rather than continuing to chase it (matches this project's existing flake-diagnosis retry norms, e.g. the check-gate.sh SIGPIPE investigation)
- Remaining exclusions after retries are individually documented in `23-FINDINGS.md` (level + position + mechanic type + technical reason), mirroring 21-FINDINGS' "Methodology Note" style
- Changes isolated to the mechanic-drive audit path (`mechanic-drive.mjs` / its caller script) — `browser-boot.mjs` (the shipped boot gate) stays untouched; it's a separate, already-stable concern (basic boot-and-traverse smoke, not exhaustive mechanic-encounter auditing)

### Claude's Discretion
- Internal structure/ordering of `23-FINDINGS.md` beyond the required evidence tables
- Exact retry count within the 3–5 range, and exact chosen safety-margin percentage (to be set from observed calibration variance, not pre-decided)
- Naming/internal organization of the graph-reachability implementation (e.g. adjacency list vs matrix) as long as it correctly models chain-of-hops

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/lib/mechanic-drive.mjs` — `deriveEncounters`, `resolveIfBoxed`, `driveToXClimbing`: the proven jump-envelope traversal model to extend with retry logic
- `scripts/browser-boot.mjs` — Playwright launch/page pattern to reuse for the calibration probe
- Phase 22's `interval-check-22-04.mjs` (scratchpad) — exact-interval over-hole arithmetic, already validated against real defects; promote into the real validator
- `scripts/smoke-progress.mjs` — the project's no-test-framework assertion convention (`check(cond, msg)` + failure counter + `console.error`/`process.exit(1)` on failure, `console.log("...: PASS")` on success) to mirror in `validate-levels.mjs`
- `src/levels/index.js` (`LEVEL_ORDER`, `getLevel`) — the registry the validator must iterate over for "every registered level"
- `src/config.js` physics constants (`RUN_SPEED` 240, `GRAVITY` 1400, `JUMP_FORCE` 520, `LEVEL_LEFT`/`LEVEL_RIGHT`) — the theoretical baseline the empirical calibration supersedes with a recorded safety margin

### Established Patterns
- No JS test framework, no build step, no npm — scripts run directly via `node scripts/foo.mjs`
- `a727c13` rule (no Kaplay globals at module top level) — the validator itself is pure-data/node-importable (like `src/levels/*.js`), so this mainly constrains the calibration probe, which is Playwright-driven and external to the engine's own module graph
- `-FINDINGS.md` per-phase evidence-table convention (`21-FINDINGS.md`, `22-FINDINGS.md`) — established documentation format for this kind of audit work

### Integration Points
- `src/levels/*.js` geometry shape (`floors`, `platforms`, `doors`, `mathGates`, `enemies`, `collectZones`) — the validator's input schema
- The interactive audit's existing `deriveEncounters` output — the harness upgrade's integration seam

</code_context>

<specifics>
## Specific Ideas

Exact known defects to use as RED-proof targets (from `22-FINDINGS.md`'s Structural Defect Inventory, fresh computation via `interval-check-22-04.mjs`):
- level-01 mathGate x600..632 over hole (gap 560..720) — bridged by a stepping-stone platform, audit stably reaches it
- level-01 mathGate x1300..1332 over hole (gap 1200..1360) — timing-sensitive audit row
- level-04 mathGate x1800..1832 over hole (gap 1760..1960) — stable-unreached audit row
- 8 heuristic-candidate platforms (level-03: x1880, x2640; level-04: x1080, x1400, x1760, x2140, x2520, x3240) — candidates only, Phase 23's calibrated envelope is the arbiter of which are real

6/16 mechanic-encounter blind spot baseline is documented in `21-FINDINGS.md`'s Methodology Note (spike-hazard timing resonance) — the number to shrink from.

</specifics>

<deferred>
## Deferred Ideas

- All structural defect FIXES (doors over holes, unreachable platforms) → Phase 24
- Full 8-level / 16-encounter interactive audit closure → Phase 28 (VALID-03 final close)
- New level content / 2×4 select grid → Phase 25
- Any CI wiring beyond local `node` invocation → not requested, no CI system exists in this project

</deferred>
