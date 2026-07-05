---
gsd_state_version: 1.0
milestone: v5.0
milestone_name: Nox Run — Real Levels
current_phase: 22
current_phase_name: Implementation Review & Auto-Fix
status: executing
stopped_at: v5.0 roadmap created — ROADMAP.md (Phases 22–28), STATE.md initialized, REQUIREMENTS.md traceability mapped 24/24
last_updated: "2026-07-05T15:49:02.552Z"
last_activity: 2026-07-05
last_activity_desc: Phase 22 execution started
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 5
  completed_plans: 2
  percent: 0
---

# Project State: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v5.0 Nox Run — Real Levels (Phases 22–28)

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-05)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 22 — Implementation Review & Auto-Fix

**Shipped State (v4.1):** Replayable multi-level Kaplay platformer — title → level-select → four hand-built dark-grunge levels → four forgiving in-world math mechanics → persisted XP/leveling + per-level completion — with real curated CC0 art under human sign-off and interactively-audited mechanics. All prior milestone requirements satisfied.

**Tech Stack:** Multi-file, no JS build step — HTML + vanilla ES2020 modules + vendored Kaplay 3001.0.19 (pinned), static files via Docker (nginx) + Dokploy, versioned localStorage persistence. v5.0 confirmed by research to need **zero new runtime dependencies** (Kaplay's built-in audio API covers SFX/music).

## Current Position

Phase: 22 (Implementation Review & Auto-Fix) — EXECUTING
Plan: 3 of 5
Status: Ready to execute
Last activity: 2026-07-05 — Phase 22 execution started

Progress: [░░░░░░░░░░] 0%

**Next:** `/gsd-plan-phase 22`

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

**v5.0:** No plans executed yet.

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

### Cross-Cutting Mitigations (every engine-touching phase)

1. **a727c13 rule** — no Kaplay global at module top level; engine refs only inside function bodies (audio.js gets a documented anti-leak exception like game.js's `onHide`)
2. **Anti-leak** — closure-local run state; cancel global controllers on `onSceneLeave`; `playMusic()` must be idempotent (kills music-stacking and cross-scene leaks)
3. **No-timer / forgiving / no-game-over** — wrong answers re-ask penalty-free; nothing counts down; no buzzers or startle stingers in audio
4. **Audio gesture gate** — this Kaplay build has no gesture-unlock hook; start music + `audioCtx.resume()` inside the title screen's press-to-start handler, never at module load

### Pending Todos

- `2026-07-04-drop-tables-1-and-10-from-practice-rotation.md` — covered by MATH-01/MATH-02 (Phase 25); move to completed when Phase 25 ships

### Blockers/Concerns

- **Research flags:** Phase 23 (validator) — hop-envelope edge cases + one-time empirical calibration against the real engine; Phase 27 (audio) — re-verify exact Kaplay 3001 `play()` handle/volume/autoplay semantics against `lib/kaplay.mjs` before implementing
- **Audit blind spot:** 6/16 mechanic encounters unreachable by the v4.1 harness (spike-timing resonance, documented in 21-FINDINGS.md) — must shrink in Phase 23 and close or except in Phase 28 (VALID-03)

## Deferred Items

Carried forward from previous milestone closes:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| uat | SAFE-05 kid-UAT live sign-off (platforming feel, non-over-stimulation) — protocol in `.planning/milestones/v4.0-phases/19-polish-consolidated-kid-uat/19-UAT.md` | pending (UAT-FUT-01 in REQUIREMENTS.md) | v4.0/v4.1 |
| deploy | SETUP-02 live Dokploy URL playthrough confirmation (container curl-proven locally) | pending (DEPLOY-FUT-01) | v3.0 |
| uat | MOVE-05 throttled/non-60Hz empirical feel check (code verified dt-correct) | pending, low-risk | v3.0 |
| test-tooling | 6/16 encounter audit blind spot | actively addressed in v5.0 (VALID-03) | v4.1 |
| Phase 22 P01 | 15min | 2 tasks | 2 files |
| Phase 22 P02 | 24min | 3 tasks | 4 files |

## Quick Tasks Completed

| Date | Slug | Summary |
|------|------|---------|
| 2026-06-28 | make-the-game-window-render-50-bigger-sc | Display-only +50% canvas scale (960×540); internal 640×360 unchanged |

## Session Continuity

Last session: 2026-07-05T15:48:12.326Z
Stopped at: v5.0 roadmap created — ROADMAP.md (Phases 22–28), STATE.md initialized, REQUIREMENTS.md traceability mapped 24/24
Resume file: None

---

**State initialized:** 2026-06-20
**Last updated:** 2026-07-05 (v5.0 roadmap created)
