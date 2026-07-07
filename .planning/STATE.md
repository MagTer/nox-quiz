---
gsd_state_version: 1.0
milestone: v5.0
milestone_name: Nox Run — Real Levels
current_phase: 26
current_phase_name: Grunge Palette & Nox Run Rebrand
status: ready-to-execute
stopped_at: Phase 26 fully planned (11 plans, 9 waves) and plan-checker verified; ready to execute
last_updated: "2026-07-07T16:35:44.236Z"
last_activity: 2026-07-07
last_activity_desc: Phase 25 complete, transitioned to Phase 26
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 23
  completed_plans: 23
  percent: 57
---

# Project State: Nox Run (formerly Math Lab)

**Project:** Nox Run — Gamified Math Practice for Kids
**Initialized:** 2026-06-20
**Current Milestone:** v5.0 Nox Run — Real Levels (Phases 22–28)

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-06)

**Core Value:** She opens it because she *wants* to, not because she has to.
**Current Focus:** Phase 26 — Grunge Palette & Nox Run Rebrand

**Shipped State (v4.1):** Replayable multi-level Kaplay platformer — title → level-select → four hand-built dark-grunge levels → four forgiving in-world math mechanics → persisted XP/leveling + per-level completion — with real curated CC0 art under human sign-off and interactively-audited mechanics. All prior milestone requirements satisfied.

**Tech Stack:** Multi-file, no JS build step — HTML + vanilla ES2020 modules + vendored Kaplay 3001.0.19 (pinned), static files via Docker (nginx) + Dokploy, versioned localStorage persistence. v5.0 confirmed by research to need **zero new runtime dependencies** (Kaplay's built-in audio API covers SFX/music).

## Current Position

Phase: 26 — Grunge Palette & Nox Run Rebrand
Plan: Not started
Status: Fully planned and plan-checker verified (11 plans across 9 waves — palette centralization/expansion incl. a new human-verify checkpoint for the banned-hue guardrail, per-level theming, door/enemy sprite art (new VIS-04), Nox Run logo, full rebrand sweep with save key intentionally renamed). Ready to execute.
Last activity: 2026-07-07 — Phase 26 planned (research, pattern-mapper, planner, plan-checker revision loop all complete)

Progress: [██████░░░░] 57% (4/7 phases; Phase 26 planned, not yet executed)

**Next:** `/gsd-execute-phase 26`

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

**v5.0:** 23 plans completed across Phases 22–25 (2026-07-05 → 2026-07-07).

<details>
<summary>v5.0 per-plan timing (moved out of the Deferred Items table, where these rows had been mis-appended)</summary>

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
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
| Phase 25 P01 | 3min | 2 tasks | 5 files |
| Phase 25 P02 | 6min | 2 tasks | 2 files |
| Phase 25 P03 | 12min | 2 tasks | 5 files |
| Phase 25 P04 | 5min | 2 tasks | 6 files |
| Phase 25 P05 | 5min | 2 tasks | 2 files |
| Phase 25 P06 | 8min | 2 tasks | 1 files |
| Phase 25 P07 | spans 2 sessions (~16h wall-clock, mostly idle) | 2 tasks | 10 files |

</details>

## Accumulated Context

### Decisions

Full log in PROJECT.md Key Decisions. Binding for v5.0:

- **Brain is LOCKED** — difficulty via per-level table pools only; the single authorized exception is MATH-02's one-literal roll change (1–10 → 1–9); verify zero other diff in `src/math/`
- **`mathlab_platformer_v2` save key is NOT part of the brand** — SUPERSEDED 2026-07-07: user confirmed the save key may be freely renamed/changed as part of the Phase 26 rebrand, intentionally resetting her current pre-rebrand progress (no migration required)
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
- [Phase 25-01]: addBonusXp is a new sibling method on createProgress(), not a call-site reuse of addXp(table) — calculateXp(table) can only ever yield XP_EASY/XP_HARD (10/20), never an arbitrary flat amount like the alcove's 5
- [Phase 25-01]: secretAlcove.js is the only mechanic wired with progress instead of brain in game.js — it never opens a challenge or freezes the player, so it has no need for the brain's math-selection state
- [Phase 25]: Applied the select-nav row/col fix identically at all 3 call sites (browser-boot.mjs's 1 occurrence, audit-phase21-mechanics.mjs's 2 occurrences) rather than extracting a shared helper, per project convention of fixing duplicated Playwright code by hand in each copy
- [Phase 25]: Left scripts/lib/audit-retry.mjs and scripts/lib/mechanic-drive.mjs untouched -- full retry-hardened 8-level closure sign-off is scoped to Phase 28 (VALID-03)
- [Phase 25-03]: Verticality climb tiers must be authored as platforms (not floors, which are pinned to fixed FLOOR_Y in build.js), with ~70px x-overlap between consecutive tiers so the rising-jump reachability model's short-time-of-flight root lands inside the overlap window -- a 20-30px overlap produced false spawn-goal HARD-FAILs on both level-07 and level-08
- [Phase 25-04]: check-progress.sh's final smoke-progress.mjs invocation was already RED before this plan due to Plan 25-03's LEVEL_ORDER bump to 8 (not yet re-baselined) -- confirmed pre-existing/out of scope, deferred to Plan 25-06
- [Phase 25-04]: Each of levels 1-4's secretAlcove placed as a short ~70px extra hop above that level's earliest existing platform, mirroring levels 5-8's established alcove pattern -- off the required path, not signposted, not gating
- [Phase 25-05]: ROW_GAP:16 chosen well under the 36px derived ceiling; moveCursor's row-scoping filters selectable cursor-indices by matching row rather than reusing the whole-list wrap, keeping Left/Right from spilling into an adjacent row
- [Phase 25-06]: secretAlcove key inserted immediately after answerPickupSlots in each expectedGeometry literal, matching the real level files' own key order
- [Phase 25-06]: Both new Task 2 assertions pin already-implemented behavior from prior plans (25-01 addBonusXp, 25-03 8-level registry) -- no production code changed, zero RED phase, per the plan's explicit regression-pin purpose
- [Phase 25-07]: 25-07's human-verify checkpoint (secret alcove + select-grid sign-off) was closed on an explicitly reduced scope (level-01's alcove only) by the human's own choice, honestly recorded rather than treated as a full pass -- see 25-FINDINGS.md (d)
- [Phase 25]: Code review (25-REVIEW.md) found 6 warnings; 4 fixed (config magic number, stale comments in level-08/brain.js, progress.js DRY), 2 (secretAlcove has zero automated reachability/trigger coverage) deliberately left unfixed rather than risk false HARD-FAILs on shipped content -- tracked as a pending todo, not silently dropped
- [Phase 25]: Phase-level UAT (25-UAT.md) closed via a real full-playthrough that surfaced genuine, separate issues (some pickups/ledges unreachable in levels 5-8, level-07/08 end-climb sections near-duplicates); user explicitly accepted these as non-blocking/deferrable rather than reopening Wave 2 plans -- VERIFICATION.md status upgraded human_needed -> passed on this explicit basis, new issues captured as a pending todo

### Cross-Cutting Mitigations (every engine-touching phase)

1. **a727c13 rule** — no Kaplay global at module top level; engine refs only inside function bodies (audio.js gets a documented anti-leak exception like game.js's `onHide`)
2. **Anti-leak** — closure-local run state; cancel global controllers on `onSceneLeave`; `playMusic()` must be idempotent (kills music-stacking and cross-scene leaks)
3. **No-timer / forgiving / no-game-over** — wrong answers re-ask penalty-free; nothing counts down; no buzzers or startle stingers in audio
4. **Audio gesture gate** — this Kaplay build has no gesture-unlock hook; start music + `audioCtx.resume()` inside the title screen's press-to-start handler, never at module load

### Pending Todos

- `2026-07-07-review-levels-against-level-design-rules.md` — review the 8 shipped levels against the new `docs/LEVEL-DESIGN.md` SOFT rules (user: "down the road", not urgent; natural slot near Phase 28)
- `2026-07-07-reconsider-secret-alcove-mechanic-discoverability-and-value.md` — user found the invisible/silent alcove reward "pointless... not what I was expecting" during Phase 25's sign-off; not actioned this milestone, revisit design before adding more content on the same pattern
- `2026-07-07-add-automated-coverage-for-secretalcove-mechanic.md` — Phase 25 code review (WR-01/WR-06) found secretAlcove has zero automated reachability/trigger coverage in either verification harness; deliberately left unfixed (needs new detection/reachability logic, not a mechanical patch) — natural slot before/alongside Phase 28
- `2026-07-07-fix-unreachable-pickups-ledges-and-level-07-08-repetition.md` — human full-playthrough UAT for Phase 25 found some pickups/ledges unreachable in levels 5-8 and level-07/08's end-climb sections are near-duplicates; user explicitly accepted as deferred/non-blocking ("it is playable... can be fixed later")

### Blockers/Concerns

- **Research flags:** Phase 27 (audio) — re-verify exact Kaplay 3001 `play()` handle/volume/autoplay semantics against `lib/kaplay.mjs` before implementing
- **Audit blind spot:** RESOLVED for levels 1-4 in Phase 23 (16/16 triggered) and extended to all 8 levels in Phase 25 (36/36 triggered, zero triggered:false — see 25-FINDINGS.md (b)). Phase 28's VALID-03 is still the milestone's final, formal human-signed-off closure — this just means the automated audit itself already covers all 8 levels going in. Note: `secretAlcove` remains outside both the audit's and the static validator's coverage by design — see the dedicated pending todo.
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
| test-tooling | 6/16 encounter audit blind spot | resolved for levels 1-4 in Phase 23 (16/16); extended to all 8 levels in Phase 25 (36/36); Phase 28 (VALID-03) remains the milestone's formal human-signed-off closure | v4.1 |

## Quick Tasks Completed

| Date | Slug | Summary |
|------|------|---------|
| 2026-06-28 | make-the-game-window-render-50-bigger-sc | Display-only +50% canvas scale (960×540); internal 640×360 unchanged |
| 2026-07-07 | add-a-reset-progress-button-that-clears- | Keyboard-only (R) Reset Progress control on title screen with Y/N confirm overlay; new guarded `resetSave()` seam in progress.js clears only `mathlab_platformer_v2` |

## Session Continuity

Last session: 2026-07-07
Stopped at: Phase 26 fully planned and verified, ready to execute (user requested a context reset here)
Resume file: None

---

**State initialized:** 2026-06-20
**Last updated:** 2026-07-07 (Phase 25 complete — code review + human UAT resolved, transitioned to Phase 26)
