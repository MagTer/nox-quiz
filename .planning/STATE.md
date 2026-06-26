---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: The Platformer
current_phase: 10
current_phase_name: Math-Gate Integration (Port the Brain
status: verifying
stopped_at: Completed 07-02-PLAN.md
last_updated: "2026-06-26T07:24:05.125Z"
last_activity: 2026-06-26
last_activity_desc: Phase 10 execution started
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 11
  completed_plans: 11
  percent: 67
---

# Project State: Math Lab

**Project:** Math Lab - Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v3.0 The Platformer (Phases 7–12)

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-22)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 10 — Math-Gate Integration (Port the Brain)

**Tech Stack (v3.0):** Multi-file (no JS build step) — HTML + vanilla ES2020 modules + vendored Kaplay 3001.0.19 + CC0 pixel-art assets. Packaged as static files served by a Docker (nginx) container, deployed via Dokploy, reachable at a web URL she just visits (no install, no launcher). A local dev server (`python3 -m http.server`) is used during development only. Persistence via versioned localStorage.
**Shipped State (v2.0, being replaced):** 1,976 LOC single HTML file — a multiple-choice quiz with a goblin emoji. The math brain (weighted 6–9 selection) is carried forward; the quiz shell is replaced by a game shell.

## Current Position

Milestone: v3.0 The Platformer
Phase: 10 (Math-Gate Integration (Port the Brain)) — EXECUTING
Plan: 3 of 3
Status: Phase complete — ready for verification
Last activity: 2026-06-26 — Phase 10 execution started

## v3.0 Roadmap (Phases 7–12)

| Phase | Goal | Requirements |
|-------|------|--------------|
| 7. Project Setup & Deployment | Static files served by Docker/nginx, deployed via Dokploy at a web URL; Kaplay vendored; clean no-build multi-file layout; local dev server documented | SETUP-01..04 |
| 8. Platformer Core | Mario-feel run/jump/land, smooth clamped camera, dt-correct, gentle checkpoint respawn | MOVE-01..05, LEVEL-06 |
| 9. Level Build & CC0 Assets | One polished dark/grunge level: platforms, coins, a hazard, goal; licenses documented | LEVEL-01..05, LEVEL-07, LEVEL-08 |
| 10. Math-Gate Integration | Ported math brain wired via single bridge; in-world, forgiving, no-timer gate (keystone/join) | GATE-01..06 |
| 11. Progression & Persistence | Correct answers earn XP + level up (v1/v2 curve); XP/level/practice-history persist in localStorage and resume on revisit; XP/level visible + level-up moment | SAVE-01..04 |
| 12. Polish, ADHD-Safety & UAT | Juice, control hints, contrast, no-timer/forgiving audit, verify with the kid | JUICE-01..03, SAFE-01..03 |

**Parallelization:** The math-brain port (Phase 10 prerequisite) has zero dependency on the game shell and can proceed alongside Phases 8–9; Phase 10's bridge is the join point.

## Key Decisions (v3.0)

| Decision | Rationale | Status |
|----------|-----------|--------|
| Pivot to a real 2D platformer | v1/v2 quiz misread the intent; she wants a Mario-style game she controls | Locked in |
| Kaplay 3001.0.19, vendored locally | Real physics/collision/sprites without hand-writing bug-prone parts; offline, no CDN | Locked in |
| Relax single-file rule → multi-file, no build | Platformer + assets + vendored library don't fit one file; still opens in browser | Locked in |
| Local static server is the launch path | `file://` blocks ES-module + sprite fetch; one-line server is first-class | Locked in |
| Port math brain verbatim, rebuild shell | Keep tuned 6–9 weighted selection; replace quiz UI with game | Locked in |
| Math = end-of-stage gate, paused overlay | Matches her school game; level stays visible behind question (no scene cut) | Locked in |
| All four differentiators IN | In-world gate framing, coins, one hazard/enemy, juice/celebration | Locked in |
| Wrong answer = forgiving re-ask, no penalty | ADHD-safe; no punishment loop | Locked in |
| Respawn = checkpoint, progress preserved | ADHD-safe; no lives, no game-over | Locked in |
| Persistence/XP is Phase 11 (pulled into this milestone) | She wants progress to persist like her school game; XP/level/practice-history in versioned localStorage | Locked in |
| CC0 pixel-art packs (Kenney default) | Real game look, zero licensing risk; verify each pack's license page | Locked in |

## Carried-Forward Decisions (v1/v2, still valid)

| Decision | Rationale | Status |
|----------|-----------|--------|
| Multiple-choice answers (no typing) | Reduces friction for ADHD profile; faster flow | Locked in |
| No countdown timer (hard constraint) | Time pressure triggers stress; contradicts ADHD context | Locked in |
| Dark grunge aesthetic, no pink | Cool/edgy, not cute; holds for pixel art too | Locked in |
| 70% hard tables (6–9), 30% easy (1–5) weighting | Targets weakness while building confidence; do not modify the algorithm | Locked in |
| WCAG AA contrast minimum on dark theme | Accessibility non-negotiable; prevents visual stress | Locked in |
| Local-only / offline; no backend | Privacy, simplicity, no install | Locked in |

## Critical Pitfalls to Prevent (from research)

1. **`file://` CORS asset failure** (Phase 7) — sprites silently never load when double-clicked. Mandate local server + `file:` protocol guard.
2. **Kaplay/Kaboom version churn** (Phase 7) — pin 3001.0.19, comment source+version, code against that version's docs only.
3. **Module-level state leaks across `go()`/retries** (Phase 8 discipline / Phase 10) — init run state inside scene callbacks; pass via `go(name,data)`; expose `reset()`.
4. **Gate reads as a punishing quiz popup** (Phase 10 / Phase 12) — build a NEW in-world gate in the game's font/palette, avatar visible; reuse only the brain.
5. **Frame-rate-dependent movement** (Phase 8) — use `body()`/`vel` or multiply manual movement by `dt()`; verify on non-60 Hz.
6. **Floaty jump** (Phase 8 / Phase 12) — coyote time, jump buffering, variable height; tune with the kid.
7. **Tile-seam stick / tunneling** (Phase 8 physics / Phase 9 colliders) — merge floor colliders, cap fall speed; build a stress strip early.
8. **Progress loss on death** (Phase 8 / Phase 10) — checkpoint respawn; wrong answer penalty-free re-ask.
9. **Over-stimulation / over-long level** (Phase 9 / Phase 12) — subtle effects, one short level, no timers.
10. **CC0 license mistakes** (Phase 9) — verify each pack's license page; keep CREDITS; never ship vendor logos.

## Research Flags

- **Phase 8:** Coyote time / jump buffering / variable jump height are NOT built into Kaplay `body()` — spike the engine-specific wiring. Collision edge cases (seam/tunneling) are MEDIUM-confidence — plan a small stress-test.
- **Phase 10:** The paused-overlay pause-ordering gotcha (`wait(0,...)` deferred unpause) and the exact minimal PlayerState port surface warrant a focused re-read of `math-lab.html` during planning.
- **Phase 7 / Phase 9:** Standard, well-documented patterns (vendoring/server, asset loading + string tile-map) — likely skip research-phase.

## Gaps to Address (from research)

- Game feel is iterative: exact gravity/jump-impulse/coyote/buffer values must be tuned with the kid in Phase 12 — research ranges are starting points only.
- ADHD response is individual: no-timer/forgiving/low-stimulation principles must be confirmed via UAT (Phase 12), not assumed.
- Kaplay collision robustness (MEDIUM): build a long-flat-run + fast-drop stress strip early (Phase 8/9).
- Minimal port surface: confirm which PlayerState methods `selectNext` depends on by re-reading `math-lab.html` during Phase 10 planning (selector + CONFIG + accuracy/mastery half + keep `toJSON/fromJSON`).
- Audio deferred but flagged: silence weakens the "real game" feel; revisit immediately after the loop validates.

## Deferred (v2 & beyond)

- Richer math mechanics: locked doors/bridges (DOOR-01), collect-the-answer (COLLECT-01), defeat-the-enemy (ENEMY-01)
- Content/atmosphere: multiple levels + level select (WORLD-01), audio (AUDIO-01), double jump (MOVE2-01)

## Session Continuity

**Stopped at:** Completed 07-02-PLAN.md

**Resume file:** None

**Last session:** 2026-06-26T07:23:47.202Z

**Next steps:**

1. User reviews and approves ROADMAP.md (Phases 7–12)
2. Execute `/gsd-plan-phase 7` to create the detailed plan for Project Setup & Deployment
3. (Optional, parallel) begin porting the math brain — it has no game-shell dependency
4. Proceed Phase 8 → 9 → 10 (keystone) → 11 (progression/persistence) → 12 (UAT with the kid)

**Context for next session:**

- v3.0 is a 6-phase, dependency-driven roadmap (Phases 7–12) continuing v2.0's numbering
- 33/33 v1 requirements mapped, no orphans, no duplicates
- Infra risk (Docker/nginx static hosting via Dokploy + Kaplay version pinning) front-loaded into Phase 7
- Phase 10 (math gate) is the keystone/join point; math port parallelizable
- Phase 11 adds XP/leveling/persistence (depends on Phase 10's gate outcomes); feel/safety validated last and with the actual user (Phase 12)

---

**State initialized:** 2026-06-20
**Last updated:** 2026-06-22 (v3.0 roadmap revised — Phases 7–12)

## Historical Decisions (v1/v2)

- [Phase 1]: PersistenceStore stub deferred to Plan 02
- [Phase 1]: QuestionSelector uses naive uniform random in Plan 01; weighted selection by accuracy deferred to Plan 03 as designed
- [Phase 1]: Event delegation on optionsList rather than per-item listeners — cleaner, avoids re-attaching on each question render
- [Phase 1]: PlayerState.fromJSON validates types before assignment — mitigates T-01-01 prototype pollution threat
- [Phase 1]: calculateWeights uses exponent 1.5 for hard tables and 0.8*0.3 for easy — ~76% hard baseline
- [Phase 1]: Fisher-Yates uniform shuffle replaces sort(random) — unbiased answer positions across 4 slots
- [Phase 1]: debugAccuracy() inside DOMContentLoaded, exposed on window for DevTools UAT
- [Phase 1]: SVG feTurbulence grain via CSS data URI
- [Phase 1]: HUD uses rgba(10,10,10,0.92) + backdrop-filter blur(4px)
- [Phase 1]: Question text color is var(--text) #e8e8e8 — accent #00ff88 is decorative only
- [Phase 1]: WCAG 2.1 AA verified: #e8e8e8 on #0a0a0a ~18:1, #888888 on #0a0a0a ~5.4:1 — UX-03 satisfied
- [Phase 2]: TRANSITIONS map uses plain arrays not Set — simpler sufficient for 5 states
- [Phase 2]: FloorConfig returns shallow copies via Object.assign plus spread array — prevents caller mutation (T-02-03)
- [Phase 2]: CONFIG.DUNGEON appended as separate statement after CONFIG literal close
- [Phase 2]: DungeonState.get() uses Object.assign for loot snapshot — caller mutation cannot affect session state
- [Phase 2]: CombatEngine reads all damage/HP/XP from CONFIG.DUNGEON constants — no magic numbers
- [Phase 2]: getState() exposes floorDef.tablePools for Phase 3 QuestionSelector — DIFF-02 bridge
- [Phase 2]: migrate() wrapped in outer+inner try-catch; QuotaExceededError in setItem caught returning null
- [Phase 2]: v1 localStorage key preserved untouched after migration — required for rollback
- [Phase 2]: PersistenceStore.load() migration branch symmetric with normal path
- [Phase 2]: loot snapshot per resolveAnswer call prevents double-reads
- [Phase 2]: effectiveDamageCorrect/effectiveDamageWrong returned on all resolveAnswer paths
- [Phase 2]: DungeonState.init() confirmed ADHD-03 compliant — XP and level never touched on reset
- [Phase 5]: DungeonRunner preserves HP+loot by saving before startCombat() and restoring after
- [Phase 2]: window.CombatInputHandler exported inside DOMContentLoaded for DungeonRunner access
- [Phase 3]: Enter Dungeon button placed inside data-panel='quiz' section for CSS data-screen visibility

## Deferred Items (from v2.0 close)

Items acknowledged and deferred at milestone close on 2026-06-22:

| Category | Item | Status |
|----------|------|--------|
| uat | Phase 01: 01-UAT.md — 11 pending browser UAT scenarios (v1 baseline) | acknowledged |
| verification | Phase 04: 04-VERIFICATION.md — floating damage animation + HP bar drain visual confirmation (human_needed) | acknowledged |

Tech debt also noted in v2.0-MILESTONE-AUDIT.md:

- SC-4: v1 localStorage migration browser test (9-step manual test documented in Phase 6 VERIFICATION.md)
- levelUpFlash animation is 800ms; recommend reducing to 400–500ms for strict ADHD-04 compliance
- DC-01 room-count spec mismatch: implementation uses entrance + 4 combat + 1 boss (6 rooms), spec says entrance + 3 + boss (5)

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 01 P03 | 2 | 2 tasks | 1 files |
| Phase 01 P04 | 1 | 2 tasks | 1 files |
| Phase 02 P01 | 135 | 3 tasks | 1 files |
| Phase 02 P02 | 90 | 2 tasks | 1 files |
| Phase 02 P03 | 180 | - tasks | - files |
| Phase 05 P01 | 83s | 2 tasks | 1 files |
| Phase 05 P02 | 10m | 3 tasks | 1 files |
| Phase 07 P01 | ~2min | 3 tasks | 6 files |
| Phase 07 P02 | ~2min | 3 tasks | 3 files |
| Phase 08 P01 | ~2min | 3 tasks | 4 files |
| Phase 08 P02 | ~4min | 3 tasks | 3 files |
| Phase 08 P03 | ~1min | 1 tasks | 0 files |
| Phase 09 P01 | 25min | 2 tasks | 11 files |
| Phase 09 P02 | 4min | 3 tasks | 5 files |
| Phase 09 P03 | 3min | 2 tasks | 1 files |
| Phase 10 P01 | 12m | 2 tasks | 2 files |
| Phase 10 P02 | 12 | 2 tasks | 2 files |
| Phase 10 P03 | 2min | 2 tasks | 2 files |

## Decisions

- [Phase ?]: [Phase 7] Vendored folder is lib/ (not vendor/) — passes the phase verification gate
- [Phase ?]: [Phase 7] file:// guard inline in index.html head, not main.js — top-level import is hoisted and runs before an in-module guard
- [Phase ?]: [Phase 7] Kaplay 3001.0.19 sha256 fb4a4ef2... recorded in lib/kaplay.mjs header for integrity (T-07-SC)
- [Phase 7]: Custom Dockerfile over Dokploy Static preset — keeps the .mjs MIME fix under our control
- [Phase 7]: nginx types{} re-declares js alongside mjs to avoid regressing .js to octet-stream (verified via curl on /main.js)
- [Phase 7]: Live Dokploy deploy DEFERRED — config + docs/DEPLOY.md satisfy SETUP-02 now; live deploy is a user-triggered follow-up
- [Phase 08]: Plan 02: single jump path — removed the Plan 01 basic grounded jump; the coyote/buffer/variable-height path in makePlayer is the only jump trigger
- [Phase 08]: Plan 02: respawn is reposition-in-place (never go()); reset() is the named anti-leak contract, respawn() delegates to it; added opacity(1) to the player so the flash renders
- [Phase ?]: [Phase 08]: Plan 03: MOVE-05 dt-correctness audit clean — no double-scale on vel.x, no hand-rolled gravity, timers/camera use dt(), no raw-constant lerp; zero code changes
- [Phase ?]: [Phase 08]: Plan 03: MOVE-05 human-verify (throttled vs 60Hz) deferred to end-of-phase per human_verify_mode: end-of-phase
- [Phase ?]: Phase 9 assets sourced from OpenGameArt CC0 (6 Color Dungeon by HorusKDI + Rotating Coin by PuddinThur); rejected spinning-coin-0 (CC-BY-SA)
- [Phase ?]: 09-02: Authored a JS data-list level (LEVEL) + buildLevel() with merged-floor colliders instead of addLevel symbol maps, preserving the Phase 8 anti-seam-stick property
- [Phase ?]: 09-02: Spike hitbox tightened to 12x8 offset onto the visible points (Pitfall 4), set definitively in level.js not deferred to Plan 03
- [Phase ?]: 09-02: buildLevel OWNS creation of the tagged coin/spike/goal area() entities; Plan 03 only attaches onCollide handlers
- [Phase 09]: 09-03: Single-point goal seam — one onReachGoal() + one onCollide goal handler, fire-once guarded; Phase 10 replaces only the stub body
- [Phase 09]: 09-03: coinsCollected + goalReached declared in the gameScene closure (anti-leak); goal placeholder via Kaplay text() not a DOM sink (no XSS)
- [Phase ?]: Math brain return shape locked to { a, b, answer, choices } (a=table, b=multiplicand); gate builds its own display string.
- [Phase ?]: Math brain exposed as createBrain() factory (fresh closure per game) — anti-leak vs archive's module-level singleton.
- [Phase ?]: 10-02: math gate is in-world Kaplay fixed()/z overlay (no DOM); one-way bridge gate->brain; close cancels key controllers + destroy('math-gate') anti-leak; wrong forgiving, correct onClear() once
- [Phase ?]: 10-02: check-gate.sh is the per-commit structural gate (no JS test framework) — 8 fail-fast assertions incl. negative no-DOM/no-timer/no-scenes greps; banned tokens live only in grep patterns to keep gate source clean
- [Phase ?]: Phase 10: brain constructed once in the game.js scene closure (anti-leak) and injected into the gate via openMathGate — the single scene-to-gate bridge
- [Phase ?]: Phase 10: onClear sets a closure levelCleared flag as a clean Phase-11 XP hook; the gate owns the LEVEL CLEAR banner; no XP/persistence implemented (GATE-03)
