# Retrospective: Math Lab

## Milestone: v2.0 — Dungeon Crawler Phases

**Shipped:** 2026-06-22
**Phases:** 6 | **Plans:** 16 | **Commits:** 73 | **Timeline:** 3 days (2026-06-20 → 2026-06-22)

### What Was Built

1. Complete walking skeleton: single-file game loop, CONFIG module, XpCalculator, PlayerState, QuestionSelector, Renderer, InputHandler (Phase 1)
2. XP persistence via localStorage with migration-ready versioning (Phase 1)
3. Weighted question selection: 70/30 hard/easy, EWMA accuracy tracking, Fisher-Yates shuffle (Phase 1)
4. Grunge polish: SVG feTurbulence grain via CSS data URI, HUD with backdrop-filter, WCAG AA verified (Phase 1)
5. GameFSM (5-state, 9 transitions) + FloorConfig (4 floors, 3 enemy types, table pools) + CONFIG.DUNGEON (all dungeon constants) (Phase 2)
6. CombatEngine (HP math, damage resolution, XP on kill) + DungeonState (session-scoped) + PersistenceStore v2 migration (Phase 2)
7. data-screen / data-panel CSS visibility system, 6 screen panels, renderScreen() routing (Phase 3)
8. DungeonRenderer: emoji sprites, CSS HP bars (300ms), @keyframes floatUp (400ms) damage numbers, RPG feedback copy (Phase 4)
9. Full floor loop: 4 floors × 6 rooms, loot system (sword/shield/potion), death/retry with XP preservation, DungeonRunner orchestration (Phase 5)
10. Final RPG flavor text (3+ lines/enemy, rotation guard), ADHD safety audit 6/6 passed (Phase 6)

### What Worked

- **Wrap-don't-replace architecture**: Building the dungeon layer on top of v1 modules (QuestionSelector, PlayerState, PersistenceStore) rather than replacing them produced zero v1 regressions. GameFSM and CombatEngine consumed the existing engine cleanly.
- **Named constants from the start**: Enforcing CONFIG.DUNGEON for every HP/damage/XP value made the Phase 5 balance tuning trivial — change the constant, no hunting for magic numbers.
- **CSS data-screen visibility system**: Locking screen switching to a single `renderScreen()` function writing `data-screen` kept the routing sane across 6 panels.
- **Loot snapshot pattern**: Reading DungeonState.get().loot once per resolveAnswer() call prevented double-read bugs cleanly.
- **Audit-driven gap closure**: The milestone audit found DIFF-01 and DIFF-02 as gaps; inline closure commits fixed both within the same session.

### What Was Inefficient

- **DIFF-01 and DIFF-02 slipped through phase verification**: Floor-gated question selection and EWMA accuracy updates in combat were spec'd but not wired until the audit. Better pre-execution checklist of cross-module wiring would have caught these.
- **DungeonRunner.enterCombat() HP/loot save-restore**: This patch exists because DungeonState.init() has a side effect (resets HP). It works but is fragile. Cleaner solution: separate startCombat() from reset semantics.
- **ROADMAP.md and REQUIREMENTS.md went stale**: Phase 3 and 4 plan counts stayed wrong in the progress table; REQUIREMENTS.md checkboxes for DC-03/COMB-02 etc. stayed unchecked. These should be updated atomically with phase completion commits.

### Patterns Established

- IIFE closure module pattern for all new modules (GameFSM, CombatEngine, DungeonState, DungeonRunner, DungeonRenderer)
- `window.ModuleName` export inside DOMContentLoaded for cross-scope access
- `Object.assign` shallow copy for state snapshots exposed by getState()
- `do { } while (idx === lastIdx)` flavor text rotation guard
- SC-N assertion at end of plan execution to verify balance invariants (e.g., `8 × DAMAGE_WRONG < PLAYER_HP`)

### Key Lessons

- **Audit after milestone, not after each phase**: The audit found cross-cutting wiring gaps that per-phase verification missed. Keep the audit step at milestone close rather than trying to run it per-phase.
- **Spec room counts precisely**: "entrance → 3 combat rooms → boss room" vs "entrance + 4 combat + boss" caused a spec mismatch that's now tech debt. Count rooms, not labels.
- **levelUpFlash 800ms is borderline for ADHD-04**: The 500ms cap should be applied to all animations fired during or after combat, not just combat-frame animations. 400ms is a safer default.
- **SC-4 migration test must be human-executed**: Code-level verification of localStorage migration from v1 to v2 is not possible without a real v1 save fixture. Document the 9-step test and run it before first user play.

### Cost Observations

- Model mix: Sonnet 4.6 throughout (budget profile)
- Sessions: Multiple short sessions over 3 days
- Notable: 73 commits for a single 1,976-LOC HTML file — high planning overhead relative to code size, but the planning artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md per plan) caught DIFF-01 and DIFF-02 that would have been hard to find in production

---

## Milestone: v3.0 — The Platformer

**Shipped:** 2026-06-28
**Phases:** 6 (7–12) | **Plans:** 18 | **Timeline:** 7 days (2026-06-22 → 2026-06-28)

### What Was Built

1. No-build multi-file project (HTML + ES modules + `src/lib/assets`), Kaplay 3001.0.19 vendored (sha256-pinned, no CDN/npm), `file://` guard, nginx:alpine container with the `.mjs → application/javascript` MIME fix + Dokploy deploy docs (Phase 7)
2. Mario-feel platformer core: dt-correct run/jump, variable jump height + coyote time + jump buffering, smooth clamped camera, gentle checkpoint respawn (Phase 8)
3. One ~3.5-screen dark-grunge level from verified-CC0 sprites (licenses + CREDITS), merged-floor colliders (anti-seam-stick/tunnel), coins, forgiving spike, goal (Phase 9)
4. Keystone math gate: in-world, forgiving, no-timer Kaplay overlay driven by the ported 6–9-weighted brain through one bridge (`ui/mathGate.js`); engine firewall intact (Phase 10)
5. Progression round-trip: XP/level on the v1/v2 curve, versioned localStorage persist+resume, weak-spot adaptation survives reload, fixed HUD + ADHD-safe level-up flash (Phase 11)
6. Polish: self-cleaning juice (squash/dust/coin-pop/non-strobing clear-burst, no timers), persistent controls hint, contrast; `check-safety.sh` audit passing; kid-UAT 7/7 (Phase 12)

### What Worked

- **Firewall discipline paid off**: the pure `brain.js` / `progress.js` modules (factories, no engine/storage imports) stayed node-testable via headless smoke scripts — the one repeatable automated gate in a no-test-framework game.
- **Negative-grep check scripts** (`check-gate.sh`, `check-progress.sh`, `check-safety.sh`, comment-stripped) substituted well for a missing test harness, catching no-timer/firewall/anti-leak regressions per commit.
- **Consolidated kid-UAT**: one end-to-end play-test validated phases 9/10/11 at once after the boot bug was fixed.

### What Was Inefficient

- **The a727c13 blank-screen bug** (a top-level `typeof Rect` guard that ran at import, before `kaplay({global:true})` installed globals) silently blocked ALL browser UAT for phases 9–11 — they were "passed" on automation but had never actually booted in a browser until that fix. Lesson made a permanent constraint.
- **Verifier ↔ UAT status drift**: phase 08 stayed `human_needed` (one throttled-display feel-check) and was carried as deferred rather than ever being closed — a recurring "behavior-unverified" gap pattern across milestones.
- **Auto-extracted MILESTONES accomplishments** pulled deviation-log lines (`[Rule 2 …]`) and code fragments as "accomplishments" — needed manual curation.

### Patterns Established

- **a727c13 rule**: no Kaplay global (or `typeof <global>` guard) at module top level — imports are hoisted before `kaplay()` runs. Globals only inside scene-time function bodies.
- **Self-cleaning effects**: `tween().onEnd(() => destroy(obj))` + tag, single-flight via `obj._fxTween?.cancel()`, cancelled on `onSceneLeave` — never `setTimeout`/`wait`/`lifespan` (no-timer mandate).
- **Asset/path convention**: `assets/` and `lib/` siblings of `src/`; serve from repo root, open `/src/` (prod flattens to web root).

### Key Lessons

- For an engine with import-time global installation, a "fail-loud" guard must live *inside* the function that uses the global, not at module scope — or it becomes the failure.
- "Passed on automation" ≠ "boots in a browser" — for a static game, a human boot check has to gate phase sign-off, not just structural greps.
- A working mechanic slice (~30s of content) reads as "early MVP" without content variety + an art pass — those are their own milestone, not polish.

### Cost Observations

- Multiple session-limit interruptions during planner/executor subagent runs; resuming mid-phase worked but added overhead.
- Worktrees degraded to sequential (base-check shouldDegrade) throughout — executors ran on the main tree.

---

## Milestone: v4.1 — Art Rework

**Shipped:** 2026-07-04
**Phases:** 2 (20–21) | **Plans:** 10 (7 base + 3 gap-closure) | **Timeline:** ~1 day (2026-07-03 → 2026-07-04)

*(v4.0 — Content & Challenge is not covered here: it was executed by a different, non-Claude AI
runtime in a prior session that lost continuity before a retrospective was written. Its thin
"human sign-off" claims are precisely what motivated Phase 21 of this milestone.)*

### What Was Built

1. Real curated Kenney CC0 pixel art (player, ground tileset, parallax silhouettes, title/select panels) replaced Phase 18's procedurally-generated placeholder noise, via a new `build-art-assets.py` pipeline with a luminance-ramp palette remap (Phase 20)
2. The first genuine, two-round, blocking `AskUserQuestion` human visual sign-off in the project's history — it caught and drove the fix of a real invisible-background/ledge bug that automated checks had missed entirely (Phase 20)
3. A new interactive Playwright audit script (`scripts/audit-phase21-mechanics.mjs` + shared `scripts/lib/mechanic-drive.mjs`) gave `door.js`/`gates.js`/`enemy.js`/`mathGate.js` the same real movement-driven scrutiny `collect.js` got post-v4.0, finding a genuinely new bug (simultaneous-challenge overlap) the code-only hypotheses never predicted (Phase 21)
4. Hardened `scripts/browser-boot.mjs` — the project's actual per-commit gate — to exercise real movement + full mechanic resolution on all 4 levels, not just "scene loaded, zero console errors" (Phase 21)
5. Fixed 5 real bugs found along the way: the art-invisibility bug, enemy.js's arithmetic-display bug, a simultaneous-challenge state-corruption + visual-overlap bug, a jump-over exploit that let players skip required math-gate/enemy checkpoints, and a path-traversal/bind-all-interfaces issue in the local test scripts (Phases 20–21)
6. Corrected `v4.0-MILESTONE-AUDIT.md`'s unsupported "human sign-off recorded" claim for Phase 14/NAV-04 with a dated, additive annotation rather than a silent rewrite (Phase 21)

### What Worked

- **The gap-closure loop worked exactly as designed.** Phase 21's first verification pass scored 1/4 must-haves — door.js and enemy.js had genuinely never been reached with real movement, despite `21-FINDINGS.md` reading as if they had. Rather than rubber-stamping, the verifier independently re-ran the audit script and caught it. The subsequent gap-closure cycle (plans 21-05/06/07) closed all three gaps and re-verification (also independently re-running scripts, not trusting SUMMARY claims) scored 4/4.
- **`code-review --fix --auto`'s 3-iteration loop earned its keep.** It surfaced a real regression the fixer itself introduced (a per-instance `instanceTag` fix broke `browser-boot.mjs`'s absolute-zero "challenge resolved" detection) and a genuinely new jump-over exploit on checkpoints — both fixed and empirically verified by actually running the affected scripts, not just reading the diff.
- **Documenting refuted hypotheses instead of silently dropping them.** `21-FINDINGS.md` tracked 3 standing hypotheses (color() invisibility, enemy prompt-override, collect-zone dim-overlay) through CONFIRMED/REFUTED verdicts with evidence, which kept later plans from "fixing" things that were never actually broken.
- **Rule-1 fixes to the audit tooling itself, not the game.** Several bugs the interactive audit surfaced (Playwright key-name case, a baseline-count false positive, a vacuous-resolve guard, a warmup-cutoff heuristic) were bugs in the new diagnostic script, not the game — fixing the script first was necessary before its findings about the game could be trusted.

### What Was Inefficient

- **A scratchpad tooling bug (this session) silently broke `gsd-tools` calls for a stretch** — a malformed one-line cache file caused several `gsd_run` invocations to return empty output while still exiting 0, which could have caused a real workflow step (the code-review capability check) to be silently skipped had it not been caught by re-verifying against the raw bootstrap script. Lesson: don't cache tool-resolution state across Bash calls in ad-hoc scratch files; re-run the full bootstrap one-liner each time, or verify cached state before trusting it.
- **One executor subagent hit its own session usage limit mid-task** (Plan 21-05's Task 2), requiring a fresh executor to resume from the last commit. No work was lost (Task 1 was already committed), but it cost a discovery pass to confirm what had and hadn't landed before resuming.
- **AskUserQuestion timeouts during autonomous execution** — two decision points (gap-closure choice, phase-archival choice) got no response within 60s and had to proceed on best-judgment defaults. Both were reasonable defaults, but a fully unattended `/gsd-autonomous` run should expect this and lean on its own "recommended option" framing rather than assuming a human is watching.
- **Both phases' `*-VALIDATION.md` frontmatter was never flipped from `nyquist_compliant: false` to `true`** after execution, despite the underlying automated verification actually passing — a cosmetic process gap the plan-checker flagged twice across two plan cycles without it ever being fixed.

### Patterns Established

- **Interactive audit over code review for gameplay claims.** A real Playwright script driving actual keyboard input and reading actual game state is the only thing that reliably catches "passed on code review, never actually played" bugs in this project — code-level review alone repeatedly missed these across v4.0 and this milestone.
- **Annotate, don't rewrite, historical verification records.** Phase 21's correction of `v4.0-MILESTONE-AUDIT.md` added a dated annotation preserving the original (wrong) claim alongside the correction, rather than silently editing history — the same principle later applied to this retrospective's treatment of the missing v4.0 section.
- **Shared traversal helper module (`scripts/lib/mechanic-drive.mjs`)** extracted once in Phase 21's gap closure, then reused by both the exhaustive audit script and the hardened per-commit boot gate — avoiding a second, drifting implementation of "how to drive the player somewhere real."

### Key Lessons

- **"Human sign-off recorded" is a claim, not a fact, until an actual blocking question was asked and an actual human answered it.** This milestone's entire Phase 21 exists because that distinction was blurred across v4.0's later phases. Distinguish "a verifier's own static review found and fixed defects" (true, useful) from "a human played the game and signed off" (a specific, checkable claim that needs its own evidence) in all future VERIFICATION.md writing.
- **A traversal/test-tooling limitation is not the same as a game bug — but don't let that distinction excuse under-coverage.** 6 of 16 mechanic encounters remain unreached by the interactive audit due to a documented spike-timing resonance in the traversal model; this is honestly disclosed rather than concealed, and next milestone should decide whether to invest in fully closing it or accept it as permanent test-tooling debt.
- **When an autonomous run's blocking question times out, the "(recommended)" label in the option set is doing real work** — it's the fallback the orchestrator falls back to. Phrase it as a genuine recommendation, not a formality, because it may be the decision that actually gets made.

### Cost Observations

- Model mix: Sonnet 5 orchestrator throughout, subagents (planner/executor/verifier/reviewer/fixer) on default model resolution
- Sessions: One continuous `/gsd-autonomous` run, one executor-level resume after a subagent hit its session usage limit
- Notable: the gap-closure cycle (research-free replanning + targeted execution) was substantially cheaper than a from-scratch replan — 3 focused plans against a specific VERIFICATION.md gap list, not a full phase re-plan

---

## Milestone: v5.0 — Nox Run: Real Levels

**Shipped:** 2026-07-09
**Phases:** 7 (22–28) | **Plans:** 45 | **Timeline:** 5 days (2026-07-05 → 2026-07-09)

### What Was Built

1. Clean, reviewed base: all 24 game entities/surfaces audited with autonomous in-boundary fixes, zero regressions vs baseline, structural defects inventoried for validator calibration (Phase 22)
2. Level validation harness proven RED-first against real known bugs; jump envelope empirically calibrated against the live engine; interactive audit blind spot closed from 6/16 to 16/16 (Phase 23)
3. Levels 1–4 fixed and lengthened 53–63%; game doubled to 8 levels with a gentle ramp, late-game verticality, secret XP alcoves, a scaling 2×4 select grid, and tables 1/×10 dropped from the math (Phases 24–25)
4. Rich Nox Run visual identity: centralized/expanded grunge palette (19 roles, WCAG AA), 8 distinct per-level baked themes, real CC0 door/enemy sprite art, a signed-off logo, full Math Lab → Nox Run rebrand sweep with an intentional save-key reset (Phase 26)
5. Full audio layer: 7 CC0 SFX + calm gesture-gated ambient music + persisted mute, ADHD-safe mix closed via a genuine 5-round iterative human sound sign-off (Phase 27)
6. Milestone-closing verification: consolidated 8-gate automated suite green in one run, two new automated proofs (audio-gesture-gate via `AudioContext.state`, save-resume-across-reload), and a genuine, non-rubber-stamped human sign-off across all 8 levels closing VALID-03 — the milestone's requirement set (25/25) fully complete (Phase 28)

### What Worked

- **Excluding backlog (999.x) items from the milestone phase-execution loop, based on ROADMAP.md's own "Execution Order: 22 → 23 → 24 → 25 → 26 → 27 → 28" statement and the two 999.1/999.2 directories containing nothing but an empty `.gitkeep`.** This judgment call, made early in the run, was later independently confirmed correct: `complete-milestone.md`'s own `ALL_PHASES_VERIFIED` check explicitly filters out phases matching `^999(\.|$)` before computing milestone readiness. The tooling's own authoritative gate agreed with the reasoning applied by hand.
- **Recovering an interrupted phase-27→28 transition cleanly at session start** — found uncommitted STATE/ROADMAP/REQUIREMENTS changes plus a fully-written-but-uncommitted `27-VERIFICATION.md` left over from a prior session. Read the content in full to confirm it was legitimate (5/5 must-haves genuinely verified) before committing it, rather than either discarding it or blindly trusting it.
- **`never-rubber-stamp-checkpoints` held on the milestone's final human-verify gate.** Plan 28-02's checkpoint got a bare "Approved" as the first response; per the plan's own resume-signal spec and this project's standing precedent, that wasn't accepted at face value — one targeted follow-up question got a real, specific confirmation ("Yes, just played all 8, nothing notable") before the sign-off was recorded as closing.
- **Code review's fix-and-re-review loop caught a genuine blocker** (CR-01: the isolated save-resume proof's browser context had no error listeners, so a real crash inside it could have silently reported `Browser boot: PASS`) before it shipped as a false-positive-capable gap in the milestone's own closing proof.

### What Was Inefficient

- **A background executor agent sent a `completed` task-notification while it had not actually finished.** Plan 28-01's executor returned with an unusual, non-terminal-sounding message ("I'll pause all tool activity now and wait for the Monitor's completion notification before continuing") after committing only Task 1. Following the documented safe-resume-gate guidance (commits exist, SUMMARY.md missing → don't blindly redispatch), the orchestrator inspected the worktree and manually ran Task 2's exact verify command directly — but a second, delayed notification then arrived showing the same agent had in fact completed for real in the interim (committed `f9a7fd1`, wrote its own correct SUMMARY.md). No harm resulted only because the Write tool's "must Read before overwrite" guard caught the near-duplicate before it landed. Cost a few minutes of redundant work and very nearly created a conflicting SUMMARY.md.
- **Sub-agent-written artifacts landed on disk without being committed by the agent that wrote them, twice more after the initial interrupted-transition recovery** — the pattern-mapper's `28-PATTERNS.md` and the code-fixer's `28-REVIEW-FIX.md` both required the orchestrator to notice and commit them manually.
- **`gsd-tools`' generic `phase.complete` next-phase resolver advanced STATE.md's Current Position into backlog item 999.1 after Phase 28 closed** — a manual STATE.md correction was needed. The same tooling's `complete-milestone.md` gate correctly excludes 999.x phases from readiness checks, but the `phase.complete` verb's "what's next" field does not apply the same filter.

### Patterns Established

- **Backlog items (999.x numbering) are excluded from milestone phase-execution and completion checks by design.** Confirmed via `complete-milestone.md`'s own filter: `select((.number | tostring | test("^999(\\.|$)") | not))`. Future autonomous runs should apply the same exclusion rather than trusting a raw `init.manager` phase list at face value — and should expect (and manually correct) STATE.md's "next phase" field to need the same correction, since not every query verb applies this filter.
- **A background agent's `completed` task-notification is a strong signal, not an infallible one.** When the returned result text reads oddly or non-terminally, spot-check the worktree's actual git log / SUMMARY.md state directly (per `execute-phase.md`'s own documented completion-signal fallback) before intervening — a second, delayed notification may follow showing the agent finished correctly on its own.

### Key Lessons

- **Trust the codebase's own authoritative gate over a generic aggregator when they might disagree.** `init.manager`'s raw phase array and `complete-milestone.md`'s `ALL_PHASES_VERIFIED` filter told different stories about whether backlog items counted toward "all phases done" — the more specific, purpose-built check (the actual milestone-completion gate) was the one to trust, and it validated the manual reasoning applied earlier in the run.
- **"Completed" is not always final under race conditions with backgrounded agents.** Design the recovery path (spot-check disk state, don't blindly redispatch) so that even a false-negative "still working" read costs at most a few minutes, not duplicated or conflicting work.

### Cost Observations

- Model mix: Sonnet 5 orchestrator throughout this `/gsd-autonomous` run; subagents (planner/checker/pattern-mapper/executor/reviewer/fixer/verifier/integration-checker) on default model resolution
- Sessions: one continuous autonomous run covering Phase 28 execution through the full milestone lifecycle (audit → complete → cleanup)
- Notable: the milestone-closing phase (28) required disproportionately more orchestrator judgment calls — backlog scoping, stray-artifact recovery, a background-agent race condition — relative to its plan count (3) than any earlier phase in this milestone, appropriate given it's the project's final integrity gate before shipping

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | LOC | Duration | Requirements |
|-----------|--------|-------|-----|----------|--------------|
| v1.0 MVP | 1 | 4 | ~816 | 1 day | 14/14 |
| v2.0 Dungeon Crawler | 5 | 12 | 1,976 | 2 days | 27/27 |
| v3.0 The Platformer | 6 | 18 | ~1,944 (src/, excl. vendored Kaplay) | 7 days | 33/33 |
| v4.1 Art Rework | 2 | 10 | ~3,625 (src/, excl. vendored Kaplay) | ~1 day | 10/10 |
| v5.0 Nox Run — Real Levels | 7 (22–28) | 45 | ~10,268 (src/, scripts/, docker/) | 5 days | 25/25 |
