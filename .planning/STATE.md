---
gsd_state_version: 1.0
milestone: v5.0
milestone_name: Nox Run — Real Levels
current_phase: 24
current_phase_name: Fix & Lengthen Levels 1–4
status: executing
stopped_at: Completed 23-04-PLAN.md
last_updated: "2026-07-06T02:45:03.701Z"
last_activity: 2026-07-06
last_activity_desc: Phase 24 execution started
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 16
  completed_plans: 15
  percent: 29
---

# Project State: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v5.0 Nox Run — Real Levels (Phases 22–28)

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 24 — Fix & Lengthen Levels 1–4

**Shipped State (v4.1):** Replayable multi-level Kaplay platformer — title → level-select → four hand-built dark-grunge levels → four forgiving in-world math mechanics → persisted XP/leveling + per-level completion — with real curated CC0 art under human sign-off and interactively-audited mechanics. All prior milestone requirements satisfied.

**Tech Stack:** Multi-file, no JS build step — HTML + vanilla ES2020 modules + vendored Kaplay 3001.0.19 (pinned), static files via Docker (nginx) + Dokploy, versioned localStorage persistence. v5.0 confirmed by research to need **zero new runtime dependencies** (Kaplay's built-in audio API covers SFX/music).

## Current Position

Phase: 24 (Fix & Lengthen Levels 1–4) — EXECUTING
Plan: 6 of 6
Status: Ready to execute
Last activity: 2026-07-06 — Phase 24 execution started

Progress: [███░░░░░░░] 29% (2/7 phases)

**Next:** `/gsd-discuss-phase 24` (optional: `/gsd-verify-work 23` for human UAT pass, `/gsd-secure-phase 23` for security enforcement)

## v5.0 Roadmap Summary

| Phase | Goal | Requirements |
|-------|------|--------------|
| 22. Implementation Review & Auto-Fix | Clean, reviewed base before content doubles | FIX-01, FIX-02 |
| 23. Level Validation Harness | Static validator + upgraded interactive audit, proven RED-first | VALID-01, VALID-02 |
| 24. Fix & Lengthen Levels 1–4 | Structural defects fixed; longer levels with scaled checkpoints | VALID-04, LVL-01 |
| 25. Levels 5–8, Difficulty Ramp & Select Grid | 8 levels, gentle ramp, 2×4 grid, tables 1 & ×10 dropped | LVL-02..06, MATH-01, MATH-02 |
| 26. Grunge Palette & Nox Run Rebrand | Expanded palette, per-level themes, logo, string sweep, save intact | VIS-01..03, BRAND-01..03 |
| 27. Audio & ADHD-Safe Sound | SFX + calm ambient music + persisted mute, ADHD-safe mix | AUD-01..04 |
| 28. Full Verification & Interactive Sign-off | Interactive proof across all 8 levels + human sign-off | VALID-03 |

**Coverage:** 24/24 v5.0 requirements mapped, no orphans, no duplicates. (REQUIREMENTS.md's coverage block previously said 23 — actual ID count is 24.)

## Performance Metrics

**Velocity (through v4.1):** 21 phases, 62 plans completed across 5 shipped milestones (2026-06-20 → 2026-07-04). Per-plan history archived in `.planning/milestones/`.

**v5.0:** 10 plans completed across Phases 22–23 (2026-07-05 → 2026-07-06).

## Accumulated Context

### Decisions

Full log in PROJECT.md Key Decisions. Binding for v5.0:

- **Brain is LOCKED** — difficulty via per-level table pools only; the single authorized exception is MATH-02's one-literal roll change (1–10 → 1–9); verify zero other diff in `src/math/`
- **`mathlab_platformer_v2` save key is NOT part of the brand** — rebrand must never touch it; pre-rebrand save must resume post-rebrand
- **Zero new runtime dependencies** — no Howler.js, no npm, no Kaplay upgrade; use vendored Kaplay's audio API (`setVolume`, not deprecated `volume()`)
- **Validator trusted only after catching the known live bugs** (door-over-hole, unreachable areas) — Phase 22 inventories them but leaves them in place for Phase 23's RED calibration; Phase 24 fixes them
- **v4.1 verification standard holds** — no phase closes on greps/automation alone; interactive proof + human sign-off where claimed
- [Phase 22-01]: Audit baseline nondeterministic on 3 rows (L1 mg1300, L1 door1400, L3 mg420); Plan 22-05 must diff against stable cores (5 always-unreached, 8 always-reached), not the naive 6-unreached shape — Two identical-code audit runs produced different unreached sets; recorded in 22-FINDINGS.md Baseline
- [Phase 22-01]: check-gate.sh assertions converted to read-to-EOF grep count form (pipefail-safe); patterns, fail messages, and assertion order byte-preserved — Fixes ~30% SIGPIPE flake diagnosed in Phase 21 deferred-items.md
- [Phase 22-02]: door/gates got the WR-03 busy guard (not a why-unneeded comment) — Engine source proves the same-frame double-fire window: the collision pass re-checks only the partner's paused flag per pair, and the player is traversed after buildLevel's barriers
- [Phase 22-02]: collect.js multi-zone corruption fixed as zero-behavior-change hardening (zone re-entrancy + pickup-ownership guards), not escalated — Provably inert on single-zone shipped levels; confirmed by the Cluster A audit row diff
- [Phase 22-02]: challenge.js close() dead-object hazard REFUTED behaviorally; no liveness guard added — .hidden is a plain data property so the restore write on a destroyed object is benign, and gameplay cannot destroy a hidden prior object while a stacked challenge is open
- [Phase 22-03]: Kaplay 3001.0.19 go() teardown engine-verified: app.events.clear() + root.clearEvents() auto-clean app-bus controllers and global tweens — manual onSceneLeave cancels are belt-and-braces, kept per no-speculative-refactor rule (Finding 6)
- [Phase 22-03]: Cluster B reviewed entirely clean (zero fix commits): 6 verdict rows final; IN-03 select overflow deferred-to-phase-25; main.js scale transform documented load-bearing, untouched
- [Phase 22-04]: parallax.js latent partial-bounds NaN fixed as zero-behavior-change per-key defaulting (camera.js idiom) — Silent-invisibility auto-fix class at the descriptor trust boundary; control probe byte-identical pre/post, inert on shipped descriptors
- [Phase 22-04]: Dead COLLECT.CORRECT_GLOW/WRONG_GLOW tokens removed; PROGRESS.EASY_TABLES kept as documented decision token — Sweep-proven zero consumers with stale usage comments; the verbatim-port block records the BRAIN/PROGRESS duplication as intentional (T-22-07 guard)
- [Phase 22-04]: Structural defect inventory delivered (3 over-hole gates exact, 8 platform heuristic candidates), ALL deferred-to-phase-24; descriptors diff-proven byte-identical to baseline 5eedee8 — Preserves Phase 23's validator RED-first proof per the binding roadmap sequencing decision
- [Phase 22-05]: FIX-02 round: glyph clarity REJECTED (deferred to Phase 26); same-time-open prevention REJECTED (hide/restore kept, prevention is a soft-lock hazard); answer-box constants APPROVED (CONFIG.GATE.BOX_W/BOX_H/BOX_GAP lift e4e0d2e, after decisions anchor 45edda5)
- [Phase 22-05]: Phase 22 closed zero-regression: final audit diffed against stable cores per the 22-01 nondeterminism rule (only timing-sensitive rows flipped, within envelope); LOCKED surfaces diff-proven byte-identical to baseline 5eedee8
- [Phase 23]: marginPct floored at 5% (larger computed relative spread of 3.75% rounds up to 4%, still below the 5% floor) — the margin must never be zero per the exact flaw 22-FINDINGS.md documented in the closed-form CONFIG heuristic
- [Phase 23-02]: Interactive audit retry harness (auditLevelWithRetries, maxAttempts=5) closes the previously-documented 6/16 blind spot completely on levels 1-4 (16/16 triggered, every previously-flaky row converged within 2 attempts) — mechanic-drive.mjs/browser-boot.mjs verified byte-identical to pre-plan state
- [Phase 23-03]: over-hole-check.mjs promoted byte-for-byte from Phase 22's proven scratchpad — no platform-membership test added since every shipped barrier is floor-mounted
- [Phase 23-04]: Δy-aware jump-edge BFS reachability graph built consuming Wave 1's calibrated JUMP_ENVELOPE (never a re-derived closed-form cutoff); proven multi-hop via a 3-node chain fixture a direct single-hop test cannot cross; checkLevelReachability composes spawn-goal/gap-width/mechanic-reachability rows with HARD-FAIL/WARN/PASS tiering, WARN never incrementing hardFailCount
- [Phase 23-05]: scripts/validate-levels.mjs composes findOverHoleBarriers + checkLevelReachability into the real VALID-01 gate; RED-first proof against untouched levels 1-4 names all 3 known over-hole defects and individually arbitrates all 8 Phase-22 heuristic-candidate platforms to HARD-FAIL (each requires 104-144px rise vs the calibrated 88.331px maxRise) — zero level-descriptor edits landed anywhere in Phase 23
- [Phase 24-01]: level-01's 2 over-hole mathGates repositioned onto nearest solid floor edge (x600->528, x1300->1360), not the floor reshaped to chase them
- [Phase 24-01]: level-01 extended +1400px (2240->3640, goal 2160->3560) via pure appends only; no bounds field added (dynamic camera clamp derivation confirmed)
- [Phase 24-02]: level-02 required zero structural defect fixes (23-FINDINGS.md's Post-Plan Correction confirms level-02 has none) — this plan was extension-only, unlike Plan 24-01's fix+extend combination
- [Phase 24-02]: level-02 extended +1480px (2800->4280 floor extent, goal 2720->4200) via pure appends; zero edits inside the original 0..2800 kid-validated geometry
- [Phase 24-02]: bounds.right manually bumped 2800->4280 — level-02 carries an explicit bounds field that src/scenes/game.js uses AS-IS, unlike level-01's dynamically-derived camera clamp
- [Phase 24]: [Phase 24-03]: level-03's 2 fixed platforms (x:1880, x:2640) used a narrower 60px rise target (not the wider 65-75px band) per 24-RESEARCH.md's narrow-40px-overlap-window physics caveat; new bridging platforms used 65px rise (wider touching windows)
- [Phase 24]: level-04's over-hole mathGate and all 6 known-unreachable platforms fixed with a uniform 70px rise (wide 80-128px span windows tolerate this uniformly, unlike level-03's narrower 40px-window platforms); level-04 extended 55% (goal 3920->6120, bounds.right 4000->6200) via pure appends after x:4000
- [Phase ?]: [Phase 24-05]: All 4 scripts/smoke-progress.mjs geometry blocks re-baselined (not just level-01's) with old pre-Phase-24 values retained in comments; full suite green (validate-levels PASS zero HARD-FAILs, smoke PASS, check-progress PASS) and LOCKED surfaces (src/math, lib/kaplay.mjs) diff-proven byte-identical to baseline 5eedee8

### Cross-Cutting Mitigations (every engine-touching phase)

1. **a727c13 rule** — no Kaplay global at module top level; engine refs only inside function bodies (audio.js gets a documented anti-leak exception like game.js's `onHide`)
2. **Anti-leak** — closure-local run state; cancel global controllers on `onSceneLeave`; `playMusic()` must be idempotent (kills music-stacking and cross-scene leaks)
3. **No-timer / forgiving / no-game-over** — wrong answers re-ask penalty-free; nothing counts down; no buzzers or startle stingers in audio
4. **Audio gesture gate** — this Kaplay build has no gesture-unlock hook; start music + `audioCtx.resume()` inside the title screen's press-to-start handler, never at module load

### Pending Todos

- `2026-07-04-drop-tables-1-and-10-from-practice-rotation.md` — covered by MATH-01/MATH-02 (Phase 25); move to completed when Phase 25 ships

### Blockers/Concerns

- **Research flags:** Phase 27 (audio) — re-verify exact Kaplay 3001 `play()` handle/volume/autoplay semantics against `lib/kaplay.mjs` before implementing
- **Audit blind spot:** RESOLVED for levels 1-4 in Phase 23 — 16/16 mechanic encounters now reliably triggered via the retry harness (was 6/16 unreached under the v4.1 single-pass harness). Full 8-level closure (once levels 5-8 exist) remains Phase 28's job (VALID-03 final close).
- **[Phase 22] 22-REVIEW.md latent warnings (advisory, none live on shipped content):** collect.js zone→slots→choices contract unvalidated — becomes live with Phase 25 multi-zone content
- **[Phase 23] validate-levels.mjs WR-03 (deferred, non-blocking):** Playwright static-server + path-traversal guard code is duplicated verbatim across `browser-boot.mjs`, `audit-phase21-mechanics.mjs`, and `calibrate-jump-envelope.mjs` by deliberate project convention ("copy verbatim, do not simplify") — a future guard fix must be applied identically in all three places by hand; extracting to a shared module is a reasonable future cleanup, not urgent
- **[Phase 23] reachability.mjs WARN-tier precision gap (deferred, non-blocking):** `marginRatio` is mathematically pinned to ~1.000 for every flat-or-downward hop (documented in-code and in 23-FINDINGS.md) — the WARN tier currently cannot distinguish "trivially easy" from "near the calibrated ceiling" for the common case. Not a correctness bug (no false PASS/HARD-FAIL), but worth revisiting if the WARN tier needs finer signal before Phase 28's final sign-off.

## Deferred Items

Carried forward from previous milestone closes:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| uat | SAFE-05 kid-UAT live sign-off (platforming feel, non-over-stimulation) — protocol in `.planning/milestones/v4.0-phases/19-polish-consolidated-kid-uat/19-UAT.md` | pending (UAT-FUT-01 in REQUIREMENTS.md) | v4.0/v4.1 |
| deploy | SETUP-02 live Dokploy URL playthrough confirmation (container curl-proven locally) | pending (DEPLOY-FUT-01) | v3.0 |
| uat | MOVE-05 throttled/non-60Hz empirical feel check (code verified dt-correct) | pending, low-risk | v3.0 |
| test-tooling | 6/16 encounter audit blind spot | resolved for levels 1-4 in Phase 23 (16/16); full 8-level closure remains Phase 28 (VALID-03) | v4.1 |
| Phase 22 P01 | 15min | 2 tasks | 2 files |
| Phase 22 P02 | 24min | 3 tasks | 4 files |
| Phase 22 P03 | 18min | 2 tasks | 1 files |
| Phase 22 P04 | 13min | 3 tasks | 3 files |
| Phase 22 P05 | 35min | 3 tasks | 3 files |
| Phase 23 P01 | 12min | 2 tasks | 2 files |
| Phase 23 P02 | 25min | 2 tasks | 3 files |
| Phase 23 P03 | 13min | 2 tasks | 2 files |
| Phase 23 P04 | 18min | 2 tasks | 1 files |
| Phase 23 P05 | 8min | 2 tasks | 2 files |
| Phase 24 P01 | 12min | 2 tasks | 1 files |
| Phase 24 P02 | 10min | 2 tasks | 1 files |
| Phase 24 P03 | 9min | 2 tasks | 1 files |
| Phase 24 P04 | 5min | 2 tasks | 1 files |
| Phase 24 P05 | 10min | 2 tasks | 1 files |

## Quick Tasks Completed

| Date | Slug | Summary |
|------|------|---------|
| 2026-06-28 | make-the-game-window-render-50-bigger-sc | Display-only +50% canvas scale (960×540); internal 640×360 unchanged |

## Session Continuity

Last session: 2026-07-06T02:44:56.855Z
Stopped at: Phase 23 complete, ready to plan Phase 24
Resume file: None

---

**State initialized:** 2026-06-20
**Last updated:** 2026-07-06 (Phase 23 complete, transitioned to Phase 24)
