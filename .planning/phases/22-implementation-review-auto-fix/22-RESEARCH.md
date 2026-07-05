# Phase 22: Implementation Review & Auto-Fix - Research

**Researched:** 2026-07-05
**Domain:** Codebase review of a shipped vanilla-JS Kaplay 3001.0.19 platformer (24 runtime files, ~3,625 LOC, no build step)
**Confidence:** HIGH — nearly every claim verified directly against the repo (source, git history, milestone archives, live script runs this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Review Scope & Method
- Review method: static file-by-file review of all runtime `src/` PLUS behavioral evidence from the interactive Playwright audit — v4.1 proved code-only review misses real bugs
- Scope: all 24 runtime files; `lib/kaplay.mjs` (vendored) and `src/math/brain.js` (LOCKED) are read as context only, never modified in this phase
- Regression baseline: run the full gate suite (check-gate.sh, check-import-safety.sh, check-safety.sh, check-progress.sh, smoke-progress.mjs, browser-boot.mjs, interactive mechanic audit) BEFORE any fix as baseline, re-run after fixes — Phase 21's standard
- Findings recorded in `22-FINDINGS.md` in the phase dir: per-entity verdict table + per-finding status (fixed / escalated / deferred-to-phase-N) — this is FIX-01's evidence artifact

#### Auto-Fix Boundary
- Auto-fix: objectively wrong behavior — crashes, NaN positions, invisible/garbled rendering, handler leaks/stacking, wrong arithmetic display, dead code — plus UX papercuts with one unambiguous fix
- Escalate (never fix silently): anything changing game feel, difficulty, mechanic semantics, controls, or visual identity; anything touching LOCKED areas; ADHD-safety-relevant changes beyond restoring documented behavior
- Escalation format: batched at end of review as ONE approve/reject decision round (FIX-02) — not per-finding interrupts
- Commit granularity: atomic, one commit per fix (project convention)

#### Entity Checklist & Polish Scope
- Per-entity verdict table covers ALL runtime files (player, enemy, door, gates, collect, mathGate, challenge, hud, title, select, game, camera, parallax, fx, progress, config, main, index.html, levels/*, build)
- Small polish auto-fixes allowed ONLY with existing config tokens — no new visual systems (Phase 26 owns palette expansion)
- Refactors only where they fix a real defect or leak — no speculative restructuring right before content doubles in Phases 24–25
- Dead code / debug leftovers removed when the full gate suite stays green

### Claude's Discretion
- Order of entity review, internal structure of 22-FINDINGS.md, and which existing audit scripts to reuse vs lightly extend for evidence gathering
- Judgment calls on the auto-fix vs escalate line follow the criteria above; when genuinely ambiguous, escalate rather than fix

### Deferred Ideas (OUT OF SCOPE)
- Structural defect FIXES → Phase 24 (inventory here, calibrate validator in 23, fix in 24)
- Palette/visual identity improvements spotted during review → Phase 26 (note in findings, don't fix)
- Audio-related observations → Phase 27
- Any harness/validator improvements beyond evidence gathering → Phase 23
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIX-01 | Implementation review across all game entities (player, monsters, doors, gates, collect zones, math gate, scenes, HUD) with bugs and obvious UX issues fixed autonomously | Suspect Surface Inventory (below) enumerates every runtime file with its known-weak areas from v4.1 history; Kaplay 3001 Bug-Pattern Checklist gives per-file grep/behavioral checks; Regression Baseline table gives exact before/after commands; 21-FINDINGS.md format documented as the 22-FINDINGS.md template |
| FIX-02 | Bigger design changes surfaced from the review are presented for user approval before implementation | Escalation Candidates section pre-identifies the known judgment calls (glyph clarity, concurrency prevention, magic-number extraction) so the planner can structure the single batched approve/reject round; auto-fix vs escalate boundary mapped per finding class |
</phase_requirements>

## Summary

This is a review-and-fix phase over an existing, working, shipped codebase — not a greenfield build. There is no new stack to select and zero new dependencies to install (STATE.md: "Zero new runtime dependencies" is a binding v5.0 decision). The research question is therefore *where to look, what to look for, and how to prove nothing broke*.

Direct investigation this session produced: (1) a per-file suspect inventory grounded in v4.1's 21-FINDINGS.md, the milestone audit's recorded tech debt, and a fresh read of all mechanic/scene/UI source; (2) two latent defects found during this research itself (collect.js multi-zone `active`-slot corruption, door/gates missing the `busy` re-entrancy guard that enemy.js got in WR-03) — handed to the planner as pre-seeded review targets, not pre-judged fixes; (3) a concrete data-level structural-defect candidate list (3 math-gates whose footprints span floor gaps, 8 platforms flagged possibly-unreachable by a rough envelope check) for the inventory-only deliverable; (4) the exact green-output shape of every baseline script, including the documented ~30% check-gate.sh SIGPIPE flake that should be fixed FIRST so the baseline itself is trustworthy.

**Primary recommendation:** Structure the phase as: Wave 0 = fix check-gate.sh flake + capture full baseline → three parallel review clusters (challenge seam + mechanics; scenes/shell; world/engine + data) → final wave = structural-defect inventory table + batched FIX-02 escalation round + full-suite re-run. Reuse `scripts/audit-phase21-mechanics.mjs` and Phase 21's throwaway-Playwright precedent for behavioral evidence; do not build new harness machinery (Phase 23 owns that).

## Project Constraints (from CLAUDE.md)

Directives in `./.claude/CLAUDE.md` that bind this phase:

- **Zero dependencies, no build step** — vanilla ES2020+, vendored Kaplay only; no npm, no CDN, no framework. Any fix must stay inside this envelope. `[VERIFIED: .claude/CLAUDE.md]`
- **No timers / no time pressure** — `setTimeout`/`setInterval`/`wait()`/`loop()` banned in src/ (enforced by check-safety.sh); fixes must use the `tween().onEnd` self-clean idiom. `[VERIFIED: scripts/check-safety.sh]`
- **Forgiving mandate** — no punishment constructs (gameOver/loseLife/XP loss); wrong answers re-ask penalty-free. `[VERIFIED: scripts/check-safety.sh]`
- **Dark grunge, no pink** — palette constants stay in the established dark/neon family; Phase 26 owns palette changes, so Phase 22 polish uses only existing config tokens. `[VERIFIED: CLAUDE.md + CONTEXT.md]`
- **Accessible canvas UI, no DOM sink** — all visuals via Kaplay `text()`/`rect()`; `innerHTML`/`document.*`/`alert(` banned in challenge.js (check-gate.sh assertion 6). `[VERIFIED: scripts/check-gate.sh]`
- **GSD workflow enforcement** — all file changes go through GSD phase execution.
- Note: CLAUDE.md's "single HTML file" framing is stale (predates the v4.0 multi-file restructure); STATE.md's "Multi-file, no JS build step" is the operative truth. Do not "fix" the codebase back toward one file. `[VERIFIED: STATE.md tech stack section]`

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Review evidence gathering (interactive) | Dev tooling (Node + Playwright scripts) | Browser (headless Chromium) | `scripts/audit-phase21-mechanics.mjs` + `scripts/lib/mechanic-drive.mjs` already drive real input against the served game `[VERIFIED: scripts/]` |
| Review evidence gathering (static) | Dev tooling (bash gate scripts) | — | check-gate/import-safety/safety/progress encode the project's contracts as greps `[VERIFIED: scripts/]` |
| Game logic fixes | Browser client (src/ modules) | — | All runtime code is client-side vanilla ES modules; no server tier exists |
| Findings/escalation artifact | Planning docs (`22-FINDINGS.md`) | — | Pure markdown in the phase dir; FIX-01's evidence artifact per CONTEXT.md |
| Structural defect inventory | Dev tooling (pure-data check over `src/levels/*.js`) | — | Level descriptors are pure data modules importable in Node with zero mocking `[VERIFIED: ran such a check this session]` |

## Standard Stack

No new libraries. The "stack" for this phase is the existing verification tooling:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js | v22.22.2 (installed) | Runs all scripts, `node --check` syntax gates, headless smoke | `[VERIFIED: node --version this session]` |
| Playwright (chromium) | global install via gsd-pi fallback path | Real-browser interactive evidence | Not project-resolvable; `FALLBACK_PLAYWRIGHT_PATH` in both browser scripts EXISTS on this machine `[VERIFIED: resolved this session]` |
| bash gate suite | in-repo | Static contract regression | The project's substitute for a JS test framework (no-build canon) `[VERIFIED: all four ran green this session]` |
| Kaplay | 3001.0.19 vendored `lib/kaplay.mjs` | Read-only engine context | LOCKED read-only this phase per CONTEXT.md |

### Supporting
| Asset | Purpose | When to Use |
|-------|---------|-------------|
| `scripts/audit-phase21-mechanics.mjs` (port 8768) | 16-encounter interactive audit, screenshots per encounter | Behavioral evidence for mechanic-cluster findings; re-run for regression diff against the 21-FINDINGS baseline table |
| `scripts/browser-boot.mjs` (port 8765) | Boot gate: title→select→all 4 levels, zero uncaught errors, exits non-zero | Per-fix and end-of-phase regression gate |
| `scripts/lib/mechanic-drive.mjs` | `deriveEncounters`/`driveToXClimbing`/`resolveIfBoxed` shared traversal | Imported by both scripts above; light extension allowed per CONTEXT.md discretion (evidence gathering only — harness *improvements* are Phase 23's) |
| Throwaway one-off Playwright scripts in scratchpad | Targeted visual/state verification of a specific fix | Phase 21 precedent (21-04, 21-06): uncommitted supplementary scripts are acceptable evidence when the committed audit can't reach a scenario `[VERIFIED: 21-FINDINGS.md]` |
| `.planning/milestones/v4.1-phases/21-.../21-FINDINGS.md` | Template for 22-FINDINGS.md | Numbered findings: what broke / why / fix / file, verdict per hypothesis, disposition per finding |

**Installation:** nothing to install. If Playwright's fallback path ever breaks, set `PLAYWRIGHT_MJS_PATH` (both scripts honor it). `[VERIFIED: scripts/browser-boot.mjs resolvePlaywright()]`

## Package Legitimacy Audit

**No packages are installed by this phase.** Zero new runtime or dev dependencies (binding v5.0 decision, STATE.md). Playwright is already present as a machine-global install and is not being added or upgraded. No legitimacy check required.

## Architecture Patterns

### Review Pipeline (data flow)

```
                     ┌─────────────────────────────────────────────┐
                     │ Wave 0: Trustworthy baseline                │
  repo (clean) ────► │  1. fix check-gate.sh SIGPIPE flake         │
                     │  2. run full suite → record green shapes    │
                     │     in 22-FINDINGS.md "Baseline" section    │
                     └───────────────┬─────────────────────────────┘
                                     ▼
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
┌───────────────────┐    ┌────────────────────┐    ┌────────────────────────┐
│ Cluster A:        │    │ Cluster B:         │    │ Cluster C:             │
│ challenge seam +  │    │ scenes & shell     │    │ world/engine + data    │
│ mechanics         │    │ main, index.html,  │    │ player, camera,        │
│ challenge, mathGate│   │ title, select,     │    │ parallax, fx, build,   │
│ door, gates, enemy│    │ game, hud          │    │ config, progress,      │
│ collect           │    │                    │    │ levels/* (+ structural │
│ (behavioral +     │    │ (static + boot     │    │  defect INVENTORY)     │
│  static evidence) │    │  screenshots)      │    │ (mostly static + smoke)│
└─────────┬─────────┘    └─────────┬──────────┘    └───────────┬────────────┘
          │   per-fix: atomic commit + static gates re-run     │
          └────────────────────────┬───────────────────────────┘
                                   ▼
                     ┌─────────────────────────────────────────────┐
                     │ Final wave:                                 │
                     │  • per-entity verdict table complete        │
                     │  • FIX-02 batched approve/reject round      │
                     │  • approved escalations implemented         │
                     │  • FULL suite re-run vs baseline (0 regress)│
                     └─────────────────────────────────────────────┘
```

### Pattern 1: Findings-file discipline (22-FINDINGS.md structure)

**What:** Mirror 21-FINDINGS.md `[VERIFIED: archived file read this session]`: numbered findings, each with **what broke / why (root cause) / fix (or disposition) / file**, verdict language (CONFIRMED/REFUTED for hypotheses), explicit evidence caveats stated honestly, and per-finding disposition updated in place as later plans close them. Add what CONTEXT.md requires on top: a **per-entity verdict table** (all 24 files, verdict: clean / fixed / escalated / deferred-to-phase-N), a **structural defect inventory table** (inventory-only), and a **baseline vs post-fix regression table** (the 16-encounter audit rows + gate suite outputs).

**When to use:** every finding, including "reviewed, nothing found" verdicts — the planner cannot distinguish "clean" from "not checked" otherwise.

### Pattern 2: Behavioral evidence tiering

**What:** Three evidence tiers, in cost order, established by Phase 21 `[VERIFIED: 21-FINDINGS.md]`:
1. **Direct source read** — sufficient only for unconditional-semantics bugs (e.g. the `??` prompt-override bug needed no runtime proof).
2. **Committed audit script re-run** — `audit-phase21-mechanics.mjs` regenerates before/after screenshots for the 10 reachable encounters; diff `triggered`/`resolved` against the baseline table.
3. **Throwaway targeted Playwright script** — for scenarios the committed script can't reach (teleport-adjacent is acceptable when the skipped portion is irrelevant to the claim, per the 21-04 precedent).

**When to use:** Cluster A (mechanics/challenge) findings default to tier 2–3. Cluster C data/pure-module findings can rest on tier 1 + `smoke-progress.mjs`. Anything claiming "visual" needs a screenshot.

### Pattern 3: One fix, one commit, gates between

**What:** Atomic commit per fix (project convention, CONTEXT-locked). After each fix: `node --check` on touched files + the four static gates (seconds). Browser-boot + audit re-runs batch at cluster boundaries and at phase end (minutes each).

### Anti-Patterns to Avoid
- **Fixing structural level defects.** Doors/gates over holes and unreachable platforms are Phase 23's RED calibration targets — inventoried, deliberately left broken. Fixing one silently destroys Phase 23's validator proof. `[VERIFIED: STATE.md binding decision]`
- **Speculative refactoring.** CONTEXT.md: refactors only where they fix a real defect or leak. The codebase's comment-heavy, convention-citing style is load-bearing documentation — don't "clean it up."
- **Turning evidence gathering into harness building.** Light extension of mechanic-drive.mjs is allowed; shrinking the 6/16 blind spot is Phase 23 (VALID-03 groundwork).
- **New visual systems or palette tokens.** Phase 26 owns palette; polish uses existing CONFIG tokens only.
- **Touching `src/math/brain.js` or `lib/kaplay.mjs`.** Read-only context. The single authorized brain change (MATH-02 one-literal) is Phase 25's, not this phase's.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive traversal to a mechanic | New Playwright driver | `driveToXClimbing` + `resolveIfBoxed` from `scripts/lib/mechanic-drive.mjs` | Encodes jump-envelope physics, stall detection, warmup edge cases learned across 3 rejected models `[VERIFIED: 21-FINDINGS Methodology Note]` |
| Serving the game to a browser | New static server | The server skeleton inside browser-boot/audit scripts (loopback-bound, path-clamped — CR-02 hardened) | Path-traversal and bind-all-interfaces bugs were already found and fixed there once `[VERIFIED: commit 20903c4]` |
| Regression assertion of seam contracts | New test framework | The four bash gates + smoke-progress.mjs | The project's no-dep canon; the gates ARE the unit layer |
| Structural-defect detection | A real validator | A quick pure-data interval check (see Code Examples) — inventory only | The real validator is Phase 23 (VALID-01/02); Phase 22 only needs a candidate list |

**Key insight:** every piece of verification machinery this phase needs already exists and has already had its own bugs found and fixed. Reuse is not just cheaper — it is the only way the "zero regressions vs v4.1 baseline" claim is comparable, because the baseline numbers were produced by these exact scripts.

## Suspect Surface Inventory (per-file, with provenance)

The planner should seed each review cluster with these known-weak areas. Items marked ⚠ were newly observed during this research session by direct source read and need confirmation during the review proper (they are review targets, not pre-confirmed bugs).

### Cluster A — challenge seam + mechanics (highest risk, behavioral evidence required)

| File | Suspect area | Provenance |
|------|-------------|------------|
| `src/ui/challenge.js` | Shared-`"challenge"`-tag coupling remains by design (dual tag: generic + `instanceTag`); the hide/restore guard (21-06) fixes visual overlap but **concurrency itself is still possible** — recorded as residual tech debt in the v4.1 milestone audit. Whether to add same-time-open *prevention* is an architectural/game-feel change → escalation candidate, not auto-fix. | `[VERIFIED: v4.1-MILESTONE-AUDIT.md tech_debt]` |
| `src/ui/challenge.js` | ⚠ `close()` restores `priorChallengeObjs` by setting `.hidden = false` on a snapshot taken at open — if a hidden prior object were destroyed in the interim, this writes to a dead object. Currently unreachable (frozen player can't resolve the hidden collect challenge), but verify the invariant holds on the Escape→`go("select")` path. | ⚠ source read this session |
| `src/ui/challenge.js` | Answer-box layout constants (BOX_W 84, BOX_H 44, GAP 16) are inline magic numbers unlike sibling `CONFIG.GATE.*` — flagged IN-03 in 21-REVIEW, never fixed. Extracting them creates *new* config tokens → judgment call against the "existing config tokens only" rule; recommend note-in-findings or escalate. | `[VERIFIED: 21-REVIEW.md IN-03 + source read]` |
| `src/mechanics/door.js`, `src/mechanics/gates.js` | ⚠ Both lack the `busy` re-entrancy guard enemy.js received in WR-03 (`5d168dc`). Likely benign because both set `player.paused = true` synchronously (paused objects are skipped by Kaplay's collision pass), but the asymmetry is unexplained — verify whether a same-frame double-fire is possible, then either add the guard for consistency (auto-fix: leak class) or document why it's unneeded. | ⚠ source read this session; `[VERIFIED: commit 5d168dc applied only to enemy.js]` |
| `src/mechanics/collect.js` | ⚠ **Multi-zone `active`-slot corruption (latent):** the single `active` slot is overwritten if a second answer-zone is entered while the first is open; the first zone's pickups then resolve against the wrong question, and its overwritten `slotObj.labelObj` reference would leak stacked labels on re-trigger. Unreachable today (no level has 2 collect zones: L1/L3/L4 have one each, L2 zero) but content doubles in Phases 24–25. Fix-now candidate (handler-scoping, objectively-wrong class) or explicit deferred-to-phase-25 note — planner's call. | ⚠ source read this session; zone counts `[VERIFIED: src/levels/*.js]` |
| `src/mechanics/collect.js` | Pickup handler guards on `!active \|\| slotObj.value === undefined` but not on slot-belongs-to-active-zone — same multi-zone latency as above. | ⚠ source read this session |
| `src/mechanics/enemy.js` | Fixed in 21-04 (label two-line rendering) and WR-03 (busy guard) — verify fixes still present and behavioral (audit reaches level-01 enemy x:1000). `busy` is only reset in `onSuccess` — fine while success is the only close path; note if any future close path is added. | `[VERIFIED: 21-FINDINGS Finding 2 + source read]` |
| `src/ui/mathGate.js` | Thin wrapper; "gate-cleared" banner objects rely on the imminent `go("select")` for teardown — verify Escape-during-celebration path (game.js cancels `clearTransitionTween` on scene leave, banner destroyed with scene). | `[VERIFIED: source read, game.js onSceneLeave]` |

### Cluster B — scenes & shell (static + boot screenshots)

| File | Suspect area | Provenance |
|------|-------------|------------|
| `src/scenes/select.js` | IN-03 single-row overflow: overflows the 640px canvas at ~5 tiles (START_X 120 + i·120; documented in config.js flag + research/ARCHITECTURE.md). Fits at today's 4 tiles (last tile right edge 528px). **Inventory only** — the 2×4 grid is Phase 25's LVL-04. | `[VERIFIED: research/ARCHITECTURE.md:98 + CONFIG.SELECT + arithmetic]` |
| `src/scenes/game.js` | Densest file (313 LOC): checkpoint promotion, respawn seam, goal fire-once, onHide save canceller, tween-leak sweeps. All previously reviewed; re-verify the onSceneLeave sweep covers every controller/tween added since (two separate onSceneLeave registrations exist — confirm both fire). | `[VERIFIED: source read]` |
| `src/scenes/title.js` | Simple; verify Space-to-start doesn't conflict with jump buffering after go("game") (press edge is scene-scoped, auto-cleared on go — expected clean). | source read |
| `src/ui/hud.js` | One-way contract enforced by check-progress.sh assertion 8; flash self-clean via tween. Low risk. | `[VERIFIED: check-progress.sh + source header]` |
| `src/main.js` / `src/index.html` | CSS `transform: scale(1.5)` vs `width/height` is load-bearing for mouse hit-testing (documented past bug); file:// guard is inline pre-module. Verify nothing regressed; don't "simplify" the transform. | `[VERIFIED: main.js comment — bug found via Phase 14 browser-boot]` |

### Cluster C — world/engine + data (mostly static, smoke-covered)

| File | Suspect area | Provenance |
|------|-------------|------------|
| `src/player.js` | Paused-guard on jump-buffer write exists; `onKeyRelease` jump-cut is NOT paused-guarded (benign today — vel zeroed before pause — but verify). Animation state machine: `getCurAnim()?.name` transition guard. | source read this session |
| `src/camera.js`, `src/parallax.js` | Pure functions of camera; NaN risk if a level descriptor ever carries malformed bounds (T-17-01 threat modeled it; verify the `bounds ?? CONFIG` fallbacks actually catch partial objects — `level.bounds ?? {...}` does NOT default individual missing keys in game.js, camera.js re-defaults per-key). | `[VERIFIED: 17-01-PLAN.md T-17-01 + source read]` |
| `src/fx.js` | Self-clean via tween().onEnd; `_fxScaleTween` handle canceled in game.js sweep (WR-03). Verify squash/stretch cancel path on rapid jump-land sequences. | `[VERIFIED: source + game.js]` |
| `src/progress.js` | Firewalled, validated, smoke-covered — lowest risk. Confirm QuotaExceededError guard intact (check-progress.sh asserts). | `[VERIFIED: gates green this session]` |
| `src/config.js` | 245 LOC of constants; check for orphaned/dead tokens (dead-code removal is in scope when gates stay green). | CONTEXT.md scope |
| `src/levels/*.js`, `src/levels/build.js` | Structural defects (below) — INVENTORY ONLY. build.js apex-derived blocker heights (WR-04/CR-02) verified present. | `[VERIFIED: source read]` |
| `scripts/check-gate.sh` | **Known flaky (~30%): pipefail + `grep -q` SIGPIPE race.** Diagnosed with suggested fix in Phase 21 deferred-items.md; unambiguous test-infra auto-fix. Fix FIRST (Wave 0) so every subsequent gate run is trustworthy. Reproduced green 3/3 this session but the race is timing-dependent. | `[VERIFIED: 32348f5 + deferred-items.md]` |

### Structural defect inventory candidates (INVENTORY ONLY — Phase 23 calibration targets)

Data-level interval check run this session against the live descriptors (`node` import of `src/levels/index.js`, mechanic footprint vs floor runs):

| Level | Entity | Footprint | Status |
|-------|--------|-----------|--------|
| level-01 | mathGate x:600..632 | spans gap 560..720 (sits over the hole; stepping-stone platform 560..688 @ y192 overlaps it) | over-hole candidate — note: audit DOES reach/resolve this one |
| level-01 | mathGate x:1300..1332 | spans gap 1200..1360 | over-hole candidate — one of the 6 audit-unreached encounters |
| level-04 | mathGate x:1800..1832 | spans gap 1760..1960 | over-hole candidate — one of the 6 audit-unreached encounters |
| level-03 | platforms x:1880, x:2640 | flagged by rough envelope check | possibly-unreachable candidates (heuristic — needs Phase 23 calibrated envelope) |
| level-04 | platforms x:1080, 1400, 1760, 2140, 2520, 3240 | flagged by rough envelope check | possibly-unreachable candidates (heuristic; several sit at gap edges, may be reachable — Phase 23 decides) |

`[VERIFIED: computed this session from src/levels/*.js + CONFIG]` — the over-hole interval test is exact arithmetic; the platform-reachability flags are a crude heuristic (envelope ≈96.6px rise / ≈178px run, no safety factor, naive adjacency) and must be labeled *candidates* in 22-FINDINGS.md, not confirmed defects. Note the correlation worth recording: **the audit's unreached encounters cluster on the over-hole math gates** — spike-timing resonance is the documented cause, but gate-over-gap placement plausibly compounds it.

## Kaplay 3001 Bug-Pattern Checklist (all classes shipped before in this repo)

For each runtime file, check these engine-specific classes. Every one has a concrete in-repo precedent:

| # | Pattern | How it bites | Precedent | Check |
|---|---------|--------------|-----------|-------|
| 1 | `player.paused = true` skips the object in BOTH collision roles and halts its onUpdate — but NOT global `onKeyPress` controllers | Pausing near a needed collision soft-locks; unguarded key handlers mutate state while frozen | collect.js soft-lock (headless playtest, documented in its header); player.js buffer guard | Any mechanic relying on collisions while paused; any global key handler without a `paused` guard `[VERIFIED: collect.js/player.js comments]` |
| 2 | Handler stacking on onCollide re-entry — onCollide fires once per *touch session*, so re-entry re-fires the outer handler; registering handlers inside handlers stacks them forever | Duplicate brain.reportResult calls, stacked overlays | collect.js original shape (fixed: single handler + `active` slot) | grep for `onCollide(` or `onKeyPress(` inside another handler body `[VERIFIED: collect.js header]` |
| 3 | Tag-based bulk teardown (`destroyAll("tag")`) destroying an unrelated instance's objects | Second challenge's close wiped the first's overlay | New Finding 4 state half (fixed: per-instance tag, eab06ed) | Any `destroyAll` on a shared tag `[VERIFIED: 21-FINDINGS]` |
| 4 | Uncolored `text()` defaults to opaque WHITE in this vendored build (`color: t.color ?? j.WHITE`) — missing `color()` is NOT an invisibility bug, but uncolored `rect()` renders default mid-gray fill | Colliders/badges show as gray bars; labels invisible against same-fill badges | build.js `opacity(0)` collider comments; collect.js label color "load-bearing" comment; Finding 1 REFUTED | New `rect()` without color/opacity; convention says explicit `color(LABEL_FG…)` anyway `[VERIFIED: 21-FINDINGS Finding 1 + source]` |
| 5 | Global app-bus controllers (`onHide`, module-captured `onKeyPress` outliving objects) are NOT auto-cleared by `go()` — scene-registered ones ARE | Stacked hide-savers overwrite live save with stale snapshot | game.js `hideCtrl` WR-02; challenge.js keyCtrls cancel | Every global controller must have an explicit cancel path `[VERIFIED: game.js/challenge.js comments]` |
| 6 | In-flight tweens surviving scene teardown | Dead-scene tween calls `go("select")` a second time / scaleTo() on destroyed player | game.js `clearTransitionTween` + `_fxScaleTween` sweep | Any `tween(` whose handle isn't canceled on onSceneLeave (or self-cleans via onEnd destroy) `[VERIFIED: game.js]` |
| 7 | a727c13: engine global at module top level throws at import, blanks canvas | One misplaced `add()`/`typeof tween` bricks the boot | The original a727c13 regression; enforced by check-import-safety.sh with RED/GREEN calibration fixtures | The gate covers listed modules — verify the scan list still covers all 24 files (new files since Phase 19?) `[VERIFIED: check-import-safety.sh]` |
| 8 | Jump-over exploit: cosmetic-height colliders under the ~97px jump apex | Player jumps over locked doors/gates/enemies, skipping the math | CR-02/WR-04 apex-derived blockers (38b24e4, 61dcb80) | Any new barrier must use the apex-derived blocker height `[VERIFIED: build.js]` |
| 9 | Synchronous `go()` in the same tick as celebration `add()` — scene tears down before a frame paints | "LEVEL CLEAR" was never visible | game.js NAV-03 comment (fixed via tween-deferred transition) | Any go() immediately following visual feedback `[VERIFIED: game.js comment]` |
| 10 | NaN positions from wrong loop variables / malformed descriptor fields | Entity at NaN never renders/collides silently | `[ASSUMED]` — cited by the phase brief as an in-repo class, but no archived instance was located this session; NaN-guarding exists in progress.js validation and camera fallbacks | Cheap check regardless: verify loop index vs entry usage in build.js/parallax.js iteration code |
| 11 | `hidden` flag misuse — base GameObj.hidden suppresses draw only, not update/collision | Hidden-but-live objects still interact | 21-06 hide/restore uses this deliberately | Any new `hidden` use must state whether live-while-hidden is intended `[VERIFIED: 21-FINDINGS disposition]` |

## Regression Baseline Commands (exact, with expected-green shapes)

Record ALL of these in 22-FINDINGS.md as the pre-fix baseline (Phase 21's standard, CONTEXT-locked):

| Command | Covers | Misses | Expected green output | Runtime |
|---------|--------|--------|----------------------|---------|
| `bash scripts/check-gate.sh` | challenge.js structural contracts: public API, brain bridge, `fixed()` overlay, cancel+destroy teardown, no DOM sink, no timer, one-way dep, 5 thin callers | Behavior, visuals | `gate checks: PASS` — **⚠ flaky ~30% (SIGPIPE race); fix in Wave 0 per deferred-items.md suggested fix** | <1s |
| `bash scripts/check-import-safety.sh` | a727c13 top-level engine-global trap (scoped module list + RED/GREEN self-calibration), scene factory exports, main.js boot wiring | game.js/main.js bodies (legitimately excluded) | `import-safety checks: PASS` | <1s |
| `bash scripts/check-safety.sh` | whole-src no-timer + no-punishment (comment-stripped), SPACE-jump hint present, fx onEnd self-clean | Everything non-greppable | `safety checks: PASS` | ~1s |
| `bash scripts/check-progress.sh` | persistence firewall (no engine in progress.js, no storage in brain.js), save key, brain seeding both ends, HUD one-way, registry/builder API; chains smoke | Browser-only persistence behavior | `smoke-progress: PASS` then `progress checks: PASS` | ~2s |
| `node scripts/smoke-progress.mjs` | Pure XP curve, serialize round-trip, history/mastery round-trip, weak-spot resume, registry/unlock derivation | Anything engine-side | `smoke-progress: PASS`, exit 0 | ~1s |
| `node scripts/browser-boot.mjs` | Real boot title→select→each of 4 levels, zero uncaught errors; save blob derived from LEVEL_ORDER | Mechanic resolution depth | exits 0; per-level OK lines | ~1–2 min |
| `node scripts/audit-phase21-mechanics.mjs` | 16 mechanic encounters, real movement + real 1–4 keys, before/after screenshots | The 6 blind-spot rows | **Always exits 0** (diagnostic). Expected shape: 10/16 `triggered:true/resolved:true` (collect zones `resolved:null` by design), the SAME 6 rows unreached (L1 gate1300, L2 gate1100 + door1540, L3 enemy2400, L4 gate1800 + enemy2400), final line `AUDIT: FAILURES DETECTED` **is expected** for exactly those rows — compare row-by-row against the 21-FINDINGS Full Mechanic Sweep table, not against the exit code | ~3–5 min |

`[VERIFIED: all four static gates + smoke run green this session; audit shapes from 21-FINDINGS.md]`

Ports: 8765 (browser-boot), 8768 (audit), 8766/8767 reserved by the two screenshot scripts — reuse these, don't collide.

**Zero-regressions definition for this phase:** every currently-green assertion stays green AND the audit's 10 resolved rows stay `true/true` byte-identically (reachedX float jitter excepted). The 6 unreached rows stay unreached — improving them is Phase 23 scope.

## Escalation Candidates (pre-identified for the FIX-02 batch)

The planner should expect at least these to land in the approve/reject round rather than be auto-fixed:

1. **Door/gate/enemy glyph clarity** ("X"/"?"/"!" meaning not self-evident — live kid report "boxes with question marks and exclamation marks I'm not sure what they are"; recorded as a non-blocking observation in 21-FINDINGS). Any fix (on-touch hint text, legend) changes UX/visual identity → escalate. `[VERIFIED: 21-FINDINGS Observation]`
2. **Same-time-open prevention for challenges** (residual New Finding 4 tech debt): mechanic-semantics change; the hide/restore compromise was deliberate (refusing to open would strand a frozen player). Recommend "leave as designed" but present it. `[VERIFIED: v4.1-MILESTONE-AUDIT tech_debt]`
3. **collect.js multi-zone hardening** — if judged a semantics change rather than a leak fix; alternatively auto-fix as a defect-class fix with a deferred-activation note. Borderline by CONTEXT.md's own rule ("when genuinely ambiguous, escalate").
4. **challenge.js magic-number extraction to CONFIG.GATE** — creates new config tokens, which the polish rule restricts; cheap, zero-behavior-change, but technically outside "existing tokens only."

## Common Pitfalls

### Pitfall 1: Trusting a flaky baseline
**What goes wrong:** check-gate.sh intermittently fails green code (~30%, SIGPIPE race); a red baseline run wastes a debugging cycle or, worse, a post-fix flake gets misread as a regression.
**How to avoid:** Fix the script first (deferred-items.md documents the exact fix: `grep -c > /dev/null` instead of `grep -q`, or guard the sed stage). Then capture baseline.
**Warning signs:** `gate checks: FAIL — missing 'export function openChallenge'` on an untouched tree.

### Pitfall 2: Fixing Phase 23's calibration targets
**What goes wrong:** An eager fix of a gate-over-hole placement destroys the RED-first proof the validator needs; VALID-02 then can't be satisfied honestly.
**How to avoid:** Structural defects go ONLY into the inventory table with `deferred-to-phase-24` disposition. The auto-fix boundary in CONTEXT.md does not cover level geometry.
**Warning signs:** any diff to `src/levels/level-0*.js` geometry in this phase.

### Pitfall 3: Code-only review verdicts
**What goes wrong:** v4.1's core lesson — Phase 18 "human sign-off recorded" claims were unsubstantiated; two of three plausible code-level hypotheses (Findings 1 & 3) were REFUTED by screenshots.
**How to avoid:** every visual/behavioral claim in 22-FINDINGS.md carries a screenshot or an audit-row reference; only unconditional-semantics bugs may rest on source reads (Finding 2 precedent).
**Warning signs:** a findings entry that says "should render correctly."

### Pitfall 4: Regressing the audit's own expectations
**What goes wrong:** A legitimate fix (e.g. re-entrancy guard) changes challenge-open counts or timing the audit scripts implicitly rely on (`resolveIfBoxed` detects resolution via baseline *decrease*, not zero — CR-01).
**How to avoid:** Re-run the audit after mechanic-cluster fixes, diff row-by-row; if a script assumption (not the game) broke, lightly extend the script per CONTEXT discretion and say so in findings.

### Pitfall 5: The 22-FINDINGS.md drift problem
**What goes wrong:** With ~24 entity verdicts + N findings across multiple plans, the per-finding dispositions go stale (Phase 21 handled this by rewriting sections in place with dated updates).
**How to avoid:** One owner-plan for the findings file structure; other plans append/update their own numbered findings with dated disposition lines, 21-FINDINGS style.

## Code Examples

### Structural-defect inventory check (pure data, no engine — inventory deliverable)
```js
// Source: written and run this session against the live repo; exact interval test
import { LEVEL_ORDER, getLevel } from "./src/levels/index.js";
import { CONFIG } from "./src/config.js";
const W = { doors: CONFIG.DOOR.W, mathGates: CONFIG.MATH_GATE.W, enemies: CONFIG.ENEMY.W };
for (const id of LEVEL_ORDER) {
  const g = getLevel(id).geometry;
  const runs = g.floors.map(f => [f.x, f.x + f.w]);
  const onFloor = x => runs.some(([a, b]) => x >= a && x <= b);
  for (const kind of ["doors", "mathGates", "enemies"])
    for (const e of g[kind] ?? [])
      if (!onFloor(e.x) || !onFloor(e.x + W[kind]))
        console.log(id, kind, e.x, "OVER HOLE / OFF FLOOR");
}
```

### check-gate.sh SIGPIPE fix (from Phase 21's own diagnosis)
```bash
# Source: .planning/milestones/v4.1-phases/21-.../deferred-items.md (suggested fix)
# Replace the racy form:
strip_comments "$TARGET" | grep -q 'pattern'
# with a read-to-EOF form that cannot SIGPIPE the upstream sed under pipefail:
[ "$(strip_comments "$TARGET" | grep -c 'pattern')" -gt 0 ]
```

### Targeted behavioral evidence (Phase 21 throwaway-script precedent)
```js
// Source: 21-FINDINGS.md Plan 21-06 evidence item 2 (pattern, paraphrased)
// One-off Playwright script in the scratchpad: drive the exact scenario, then
// inspect live scene state through the page handle:
const open = await page.evaluate(() => get("challenge").length);
const hidden = await page.evaluate(() => get("challenge").filter(o => o.hidden).length);
// ...assert counts before/after resolving, screenshot both states.
```

## State of the Art

| Old approach (pre-v4.1) | Current approach (post-v4.1, binding) | Impact on this phase |
|--------------------------|----------------------------------------|----------------------|
| Code-read verification + claimed sign-offs | Interactive proof (real input, screenshots) for every behavioral claim | Review method is CONTEXT-locked to static + behavioral |
| Single-jump traversal model | `driveToXClimbing` platform-aware model, 10/16 coverage | Baseline comparisons must use the current model's table |
| `destroyAll("challenge")` shared teardown | Per-instance tag + hide/restore | The residual coupling is a known, deliberate design — review it, don't reflexively "finish" it |
| `volume()` Kaplay API | `setVolume` (deprecation noted in STATE.md) | Not this phase (audio is 27), but don't introduce deprecated calls in fixes |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "NaN positions from wrong loop variables" is an in-repo historical bug class | Bug-Pattern Checklist #10 | Low — the check is cheap either way; no archived instance was found this session, so it may be a misremembered class from the phase brief |
| A2 | The rough platform-reachability flags (8 platforms) include false positives | Structural inventory | Low if labeled candidates; HIGH if the planner records them as confirmed defects — Phase 23's calibrated envelope is the arbiter |
| A3 | Kaplay 3001's collision pass skips paused objects in both roles | Checklist #1 | Low — asserted by collect.js's header citing a headless playtest and the engine source; re-confirm in lib/kaplay.mjs if a fix depends on the precise semantics |

## Open Questions

1. **Is the door/gates missing-`busy`-guard actually exploitable?**
   - What we know: enemy.js got the guard (WR-03); door/gates rely on `player.paused` alone; paused objects skip collisions.
   - What's unclear: whether two distinct barrier collisions can both fire in the frame before `paused` takes effect.
   - Recommendation: resolve during Cluster A review with a targeted behavioral check; add the guard for symmetry if any doubt remains (leak/defect class → auto-fix).
2. **Does the "existing config tokens only" polish rule permit *moving* existing literals into CONFIG?**
   - What we know: the rule targets new *visual systems*; IN-03 magic-number extraction is zero-behavior-change.
   - Recommendation: treat as escalation-batch item 4; cheap either way.
3. **Which of the 8 flagged platforms are genuinely unreachable?**
   - What we know: heuristic only; Phase 23 owns the calibrated answer.
   - Recommendation: record all as candidates with the heuristic disclosed; do not attempt in-phase confirmation beyond what the audit's traversal already evidences.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥18 | all scripts | ✓ | v22.22.2 | — |
| Playwright + Chromium | browser-boot, audit, throwaway evidence scripts | ✓ (machine-global) | fallback path exists: `/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs` | `PLAYWRIGHT_MJS_PATH` env override |
| bash + git | gate scripts (ROOT via `git rev-parse`) | ✓ | — | — |
| Ports 8765/8768 free | script-embedded servers | ✓ (loopback-bound) | — | scripts fail loudly if taken |

**Missing dependencies with no fallback:** none. `[VERIFIED: probed this session]`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no-build/no-dep canon) — the bash gate suite + Node smoke + Playwright scripts ARE the test layer |
| Config file | n/a — scripts are self-contained in `scripts/` |
| Quick run command | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && bash scripts/check-progress.sh` (~5s; chains smoke) |
| Full suite command | quick run + `node scripts/browser-boot.mjs` + `node scripts/audit-phase21-mechanics.mjs` (~5–8 min) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FIX-01 | Fixes don't regress seam/safety/persistence contracts | static gates | quick run command above | ✅ |
| FIX-01 | Fixes don't regress boot or mechanic resolution | integration (real browser) | `node scripts/browser-boot.mjs`; `node scripts/audit-phase21-mechanics.mjs` (diff vs baseline table) | ✅ |
| FIX-01 | Per-entity review completeness | manual-only (verdict table in 22-FINDINGS.md) — no automatable "was it reviewed" oracle | — | n/a |
| FIX-02 | Escalations presented, none silently implemented | manual-only (checkpoint: human decision round) + git-log inspection that no escalated finding's fix commit predates approval | — | n/a |

### Sampling Rate
- **Per fix commit:** `node --check` on touched files + the 4 static gates (~5s)
- **Per cluster/wave merge:** + `node scripts/browser-boot.mjs`
- **Phase gate:** full suite including the 16-encounter audit, diffed row-by-row against the recorded baseline, before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `scripts/check-gate.sh` — de-flake (SIGPIPE fix) so the per-commit gate is deterministic; covers every FIX-01 regression claim made afterward
- [ ] Baseline capture — one full-suite run recorded verbatim into 22-FINDINGS.md before any src/ edit

*(No new test files needed — existing infrastructure covers the phase's automatable surface.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-player game, no accounts |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Save-blob validation already in progress.js (explicit-field copy, Number.isFinite guards, no spread — prototype-pollution mitigation). Fixes must preserve this. `[VERIFIED: 13-VERIFICATION.md + progress.js header]` |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Markup injection via question/label text | Tampering | Canvas-only rendering; `innerHTML`/`document.*`/`alert(` banned by check-gate.sh assertion 6 — any fix touching challenge rendering must keep pure `text()` draws |
| Path traversal / network exposure in the local test servers | Info disclosure | Already hardened (CR-02: path clamp with separator boundary + loopback-only bind, commit 20903c4/bf1e2b9) — don't regress when copying the server skeleton |
| Malicious/corrupt save blob | Tampering/DoS | loadSave version-gate + try/catch + defaults; junk level id falls back to LEVEL_ORDER[0] — preserve when touching progress/registry |

## Sources

### Primary (HIGH confidence — read/executed this session)
- All 24 runtime `src/` files + `scripts/*.sh`, `scripts/*.mjs`, `scripts/lib/mechanic-drive.mjs` — direct reads
- `.planning/milestones/v4.1-phases/21-.../21-FINDINGS.md` — findings format, baseline table, methodology, blind-spot rows
- `.planning/milestones/v4.1-phases/21-.../deferred-items.md` (via commit 32348f5) — check-gate.sh flake diagnosis + fix
- `.planning/milestones/v4.1-MILESTONE-AUDIT.md` — recorded tech debt (Finding 4 residual, 6/16 blind spot, gate flake)
- git log (fix-commit series 21-01…21-07, CR/WR fixes) — bug-class provenance
- Live executions: 4 static gates + smoke (green), node/Playwright availability probes, structural interval check over level data
- `.planning/research/` (v5.0 project research: SUMMARY/ARCHITECTURE/STACK/PITFALLS/FEATURES) — validator boundary, IN-03 flag, blind-spot policy

### Secondary (MEDIUM confidence)
- `.planning/milestones/v4.0-phases/` review/verification files (IN-03 origin, T-17-01 threat model) — older but archived verbatim

### Tertiary (LOW confidence)
- None — no external web research was needed; this phase's domain is entirely in-repo.

## Metadata

**Confidence breakdown:**
- Suspect inventory: HIGH — grounded in archived findings + fresh source reads; ⚠ items explicitly flagged as unconfirmed review targets
- Regression baseline: HIGH — scripts executed this session; expected shapes cross-checked against 21-FINDINGS
- Structural defect candidates: HIGH for over-hole intervals (exact arithmetic), LOW for platform-reachability flags (crude heuristic, labeled as such)
- Bug-pattern checklist: HIGH except #10 (NaN loop-variable class, [ASSUMED])

**Research date:** 2026-07-05
**Valid until:** Phase 22 execution completes (repo-internal research goes stale with the first fix commit — re-derive baselines, don't reuse, if the phase is re-planned later)
