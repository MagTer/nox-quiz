# Phase 22: Implementation Review & Auto-Fix - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — recommendations auto-accepted after user AFK timeout; Area 1 presented, Areas 2–3 accepted on recommendation. All escalation gates preserved (FIX-02 still pauses for user approval on design changes).

<domain>
## Phase Boundary

Review every runtime entity and surface of the shipped v4.1 game (player, monsters, doors, gates, collect zones, math gate, challenge overlay, HUD, scenes, camera/parallax/fx, progress, config, level data + builder — 24 files, ~3,625 LOC). Fix bugs and obvious UX issues autonomously; batch bigger design changes for explicit user approval. Known structural level defects (doors over floor holes, unreachable areas) are INVENTORIED but deliberately NOT fixed — they are Phase 23's validator calibration targets (roadmap-locked sequencing). Zero regressions: the existing 4 levels must still pass the full interactive audit and static gate suite after all fixes.

</domain>

<decisions>
## Implementation Decisions

### Review Scope & Method
- Review method: static file-by-file review of all runtime `src/` PLUS behavioral evidence from the interactive Playwright audit — v4.1 proved code-only review misses real bugs
- Scope: all 24 runtime files; `lib/kaplay.mjs` (vendored) and `src/math/brain.js` (LOCKED) are read as context only, never modified in this phase
- Regression baseline: run the full gate suite (check-gate.sh, check-import-safety.sh, check-safety.sh, check-progress.sh, smoke-progress.mjs, browser-boot.mjs, interactive mechanic audit) BEFORE any fix as baseline, re-run after fixes — Phase 21's standard
- Findings recorded in `22-FINDINGS.md` in the phase dir: per-entity verdict table + per-finding status (fixed / escalated / deferred-to-phase-N) — this is FIX-01's evidence artifact

### Auto-Fix Boundary
- Auto-fix: objectively wrong behavior — crashes, NaN positions, invisible/garbled rendering, handler leaks/stacking, wrong arithmetic display, dead code — plus UX papercuts with one unambiguous fix
- Escalate (never fix silently): anything changing game feel, difficulty, mechanic semantics, controls, or visual identity; anything touching LOCKED areas; ADHD-safety-relevant changes beyond restoring documented behavior
- Escalation format: batched at end of review as ONE approve/reject decision round (FIX-02) — not per-finding interrupts
- Commit granularity: atomic, one commit per fix (project convention)

### Entity Checklist & Polish Scope
- Per-entity verdict table covers ALL runtime files (player, enemy, door, gates, collect, mathGate, challenge, hud, title, select, game, camera, parallax, fx, progress, config, main, index.html, levels/*, build)
- Small polish auto-fixes allowed ONLY with existing config tokens — no new visual systems (Phase 26 owns palette expansion)
- Refactors only where they fix a real defect or leak — no speculative restructuring right before content doubles in Phases 24–25
- Dead code / debug leftovers removed when the full gate suite stays green

### Claude's Discretion
- Order of entity review, internal structure of 22-FINDINGS.md, and which existing audit scripts to reuse vs lightly extend for evidence gathering
- Judgment calls on the auto-fix vs escalate line follow the criteria above; when genuinely ambiguous, escalate rather than fix

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Full interactive audit tooling from v4.1: `scripts/browser-boot.mjs` (drives all 4 levels with real input), `scripts/lib/mechanic-drive.mjs` (deriveEncounters/driveToXClimbing/resolveIfBoxed helpers)
- Static gate suite: `check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, `check-progress.sh`, `smoke-progress.mjs`
- Phase 21's FINDINGS.md format as the template for 22-FINDINGS.md

### Established Patterns
- a727c13 rule: no Kaplay globals at module top level — engine refs only inside function bodies
- Anti-leak: closure-local scene state, cancel global controllers on onSceneLeave, single-flight tween cancel
- Forgiving/no-timer: every math interaction re-asks on wrong with zero penalty; no countdowns anywhere
- One shared challenge.js seam for all four mechanics + end gate
- CONFIG constants for all magic numbers (src/config.js, 245 LOC)

### Integration Points
- Known-suspect surfaces from v4.1 history: challenge overlay simultaneous-session handling (New Finding 4's visual half was fixed; the underlying shared-tag coupling remains), spike-hazard timing in denser floor runs (6/16 encounter audit blind spot), select.js tile layout (IN-03 overflow flag at ~5 tiles)
- Known structural level defects to INVENTORY ONLY: doors over floor holes, unreachable areas (Phase 23 calibration targets, fixed in Phase 24)

</code_context>

<specifics>
## Specific Ideas

User's milestone framing (from v5.0 kickoff): "Make sure monster, doors and other parts of the game are reviewed and updated" — the per-entity checklist directly satisfies this. Review rigor follows v4.1's lesson: interactive proof over code-only claims.

</specifics>

<deferred>
## Deferred Ideas

- Structural defect FIXES → Phase 24 (inventory here, calibrate validator in 23, fix in 24)
- Palette/visual identity improvements spotted during review → Phase 26 (note in findings, don't fix)
- Audio-related observations → Phase 27
- Any harness/validator improvements beyond evidence gathering → Phase 23

</deferred>