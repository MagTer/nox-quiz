# Phase 23: Level Validation Harness - Research

**Researched:** 2026-07-05
**Domain:** Static 2D-platformer level structural validation (graph reachability + interval arithmetic) and Playwright-driven empirical physics calibration, in a zero-dependency, no-build-step Node/vanilla-JS codebase
**Confidence:** MEDIUM-HIGH (the domain logic — physics/geometry/graph theory — is HIGH confidence and grounded directly in this repo's own already-proven code; the exact safety-margin percentage and retry count are explicitly left to empirical measurement per CONTEXT, so they cannot be pinned before that measurement runs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Validator Check Design**
- Spawn→goal reachability: graph/BFS reachability over floor runs + platforms + gap edges, using the calibrated jump envelope as edge cost (chain-of-hops model) — not a single-hop-only check, since Phase 22 already found level-04 candidates that may only be reachable via multi-platform chains
- Door/mathGate-over-hole check: exact interval arithmetic (barrier footprint vs floor-run coverage) — promote Phase 22's scratchpad `interval-check-22-04.mjs` logic into the real validator; it already proved correct against the 3 known over-hole rows
- Output format: human-readable per-level stdout report (level id / check name / PASS-FAIL / offending descriptor), non-zero exit on any failure — matches `check-gate.sh`'s existing convention; no JSON needed (no CI consumes it)
- Standalone script only (`node scripts/validate-levels.mjs`, per ROADMAP wording verbatim) — not wired into `check-gate.sh`; matches the no-npm direct-`node` invocation pattern already used by `smoke-progress.mjs` and `browser-boot.mjs`
- Scope is exactly the 4 ROADMAP-named checks (spawn→goal reachability, gap width vs envelope, door-over-hole, mechanic reachability) — no opportunistic extra checks, to avoid scope creep in a phase meant to close a specific known failure class

**Jump Envelope Calibration**
- Empirical measurement via a dedicated Playwright probe reusing `browser-boot.mjs`'s launch/page pattern — spawn the player on a flat test strip, press jump, sample real position via `page.evaluate` (same technique already proven in `mechanic-drive.mjs`)
- Safety margin derived empirically from the calibration run's own variance, with the chosen margin explicitly documented in code comments (not a blind round-number guess) — the CONFIG-formula heuristic's "no safety factor" was already flagged in 22-FINDINGS as a source of false candidates
- One-time measurement recorded as a checked-in constant (mirrors `CONFIG.JUMP_FORCE`'s tuning-comment style) — the validator does NOT launch a browser on every invocation; re-measuring every run would make it too slow for routine use
- Multi-hop/chain reachability is supported by the envelope model (feeds Area 1's BFS graph), not single-hop-only

**RED-First Proof & Findings Documentation**
- "Proven RED" means: validator non-zero-exits against the untouched levels 1–4 AND its failure list specifically names the known defects (level-01 mathGate x600/x1300, level-04 mathGate x1800) — recorded as an evidence table, not just a bare non-zero exit code
- Two severity tiers in validator output: HARD-FAIL (exact interval arithmetic proves impossible) vs WARN (reachability graph says technically reachable but tight/near-envelope-edge) — mirrors 22-FINDINGS' own "exact" vs "heuristic candidate" distinction, avoids false-failing legitimate tight jumps
- Zero level-descriptor fixes in this phase (already-locked project decision, not re-litigated): "Validator trusted only after catching the known live bugs... Phase 24 fixes them"
- Findings written to a new `23-FINDINGS.md` following the 21/22-FINDINGS.md per-check evidence-table format — keeps the RED-first proof auditable for Phase 28's final sign-off

**Interactive Audit Harness Upgrade (VALID-03 groundwork)**
- Blind-spot reduction via a multiple-run retry strategy (3–5 retries) on the existing `driveToXClimbing` model — an encounter counts as reached if ANY retry reaches it, since 22-FINDINGS already documented some rows as timing-sensitive (flip between identical-code runs) rather than fundamentally unreachable
- Effort ceiling: 3–5 retries per still-unreached encounter, then accept it as a documented exclusion rather than continuing to chase it (matches this project's existing flake-diagnosis retry norms, e.g. the check-gate.sh SIGPIPE investigation)
- Remaining exclusions after retries are individually documented in `23-FINDINGS.md` (level + position + mechanic type + technical reason), mirroring 21-FINDINGS' "Methodology Note" style
- Changes isolated to the mechanic-drive audit path (`mechanic-drive.mjs` / its caller script) — `browser-boot.mjs` (the shipped boot gate) stays untouched; it's a separate, already-stable concern (basic boot-and-traverse smoke, not exhaustive mechanic-encounter auditing)

### Claude's Discretion
- Internal structure/ordering of `23-FINDINGS.md` beyond the required evidence tables
- Exact retry count within the 3–5 range, and exact chosen safety-margin percentage (to be set from observed calibration variance, not pre-decided)
- Naming/internal organization of the graph-reachability implementation (e.g. adjacency list vs matrix) as long as it correctly models chain-of-hops

### Deferred Ideas (OUT OF SCOPE)
- All structural defect FIXES (doors over holes, unreachable platforms) → Phase 24
- Full 8-level / 16-encounter interactive audit closure → Phase 28 (VALID-03 final close)
- New level content / 2×4 select grid → Phase 25
- Any CI wiring beyond local `node` invocation → not requested, no CI system exists in this project
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VALID-01 | Static level validator (`scripts/validate-levels.mjs`) checks spawn→goal reachability, gap widths vs jump envelope, door-over-hole, and mechanic reachability on every level; exits non-zero on failure | Architecture Patterns (BFS graph model + interval-arithmetic module), Code Examples, Common Pitfalls |
| VALID-02 | Validator is calibrated against real engine physics (empirically measured jump envelope) and proven by catching the two known live bugs (door-over-hole, unreachable areas) before being trusted | Jump Envelope Calibration research, RED-First Proof design, Runtime-adjacent Common Pitfalls |
</phase_requirements>

## Summary

This phase builds two artifacts against a codebase that already contains 90% of the hard-won primitives it needs. `scripts/lib/mechanic-drive.mjs` already proves the "hold right, jump when grounded, poll live state via `page.evaluate`" traversal model works against this exact vendored Kaplay build. Phase 22's scratchpad `interval-check-22-04.mjs` (not checked in, but its logic and exact output are preserved verbatim in `22-FINDINGS.md`) already proves the door/mathGate-over-hole interval-arithmetic check is correct against the 3 known defects. `scripts/fixtures/bad-scene.js` already establishes this project's convention for a deliberately-broken fixture used to prove a checker goes RED on demand. Phase 23's job is almost entirely **promotion and composition**: lift the interval check into a real module, add a genuine multi-hop BFS graph on top of Phase 22's flat single-hop heuristic (replacing its "no safety factor" closed-form envelope with an empirically-measured one), and wrap the existing single-pass audit in a bounded retry loop.

The one genuinely new piece of engineering is the empirical jump-envelope calibration probe and the height-aware (not flat-Δy) reachability formula that consumes it. The existing closed-form constants (`JUMP_FORCE²/(2·GRAVITY)` ≈ 96.6px max rise, `RUN_SPEED·2·JUMP_FORCE/GRAVITY` ≈ 178px max flat-Δy run) are already written twice in this codebase (`build.js`'s apex-derived blocker heights, `mechanic-drive.mjs`'s traversal-model comment) — Phase 23 does not invent new physics, it **measures** the same physics against the real running engine (browser frame timing, `dt()` discretization, coyote/buffer interactions) instead of trusting the textbook formula, and turns the raw closed-form model into a **Δy-aware quadratic** so platforms above or below the takeoff point get materially different (not just averaged) horizontal-reach budgets — this is what upgrades Phase 22's flat, no-safety-factor heuristic into something the planner can defensibly call HARD-FAIL vs WARN.

**Primary recommendation:** Build three small, focused Node-only modules — `scripts/lib/reachability.mjs` (Δy-aware jump-edge model + BFS), `scripts/lib/over-hole-check.mjs` (promoted interval arithmetic), and a one-time `scripts/calibrate-jump-envelope.mjs` (Playwright probe, writes its result into a documented `CONFIG`-style constant) — then compose them in `scripts/validate-levels.mjs` using the exact `check(cond, msg)` / `console.error` / `process.exit(1)` idiom `smoke-progress.mjs` already establishes. Upgrade the interactive audit as a *wrapper* (`scripts/lib/audit-retry.mjs` or similar) around the existing, unmodified `driveToXClimbing`/`deriveEncounters`/`resolveIfBoxed` exports — never touching `browser-boot.mjs`.

## Architectural Responsibility Map

This is a dev-tooling phase, not a user-facing feature — the "tiers" below map to this project's actual execution surfaces (no server/CDN exists; the "backend" is a local Node script, the "client" is the same vendored Kaplay build already shipped).

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Level geometry ingestion (`src/levels/*.js`) | Level data (pure-data modules) | — | Already a pure, node-importable, engine-global-free layer (a727c13-conformant); the validator only ever reads it, never engine state |
| Jump-envelope empirical calibration | Browser (Playwright driving the real vendored Kaplay build) | Node/CLI (persists the measured constant) | The whole point of VALID-02 is that the envelope comes from the *running engine*, not a closed-form guess — must be measured live, then frozen into a checked-in constant so routine runs stay fast |
| Reachability graph construction + BFS | Node/CLI tooling (pure-data, no engine) | — | Operates purely on `geometry` objects + the frozen calibration constant; no browser needed once calibration is done |
| Door/mathGate-over-hole interval check | Node/CLI tooling (pure-data) | — | Exact arithmetic on floor-run intervals vs barrier footprints; already proven correct in Phase 22's scratchpad, zero engine dependency |
| Validator orchestration + reporting (`validate-levels.mjs`) | Node/CLI tooling | — | Composes the two pure-data checks above; iterates `LEVEL_ORDER` from the registry |
| Interactive mechanic-reachability retry harness | Browser (Playwright driving the real engine) | — | Must observe real `isGrounded()`/`pos`/`challenge` state through `page.evaluate`, exactly like the existing audit — cannot be simulated offline |

**Load-bearing boundary:** the static validator (VALID-01's core checks) must NEVER launch a browser at routine-run time (CONTEXT-locked: "the validator does NOT launch a browser on every invocation"). Only the one-time calibration script and the interactive audit harness touch Playwright.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (built-in `assert`-free `check()` idiom) | v22.22.2 (confirmed installed on this machine) | Runs `validate-levels.mjs`, `calibrate-jump-envelope.mjs` as plain ES modules | Matches this project's zero-build, zero-npm canon; identical to `smoke-progress.mjs`'s own execution model |
| Playwright (`chromium`) | resolved via `browser-boot.mjs`'s existing fallback-path pattern | Drives the real vendored Kaplay build for calibration + the interactive audit retry harness | Already the only browser-automation tool this repo uses; no new dependency — `[VERIFIED: local environment probe]` confirmed the exact same fallback path `browser-boot.mjs` already uses (`/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs`) resolves successfully on this machine when the plain-`import("playwright")` project-relative resolution fails (also confirmed to fail here, matching `browser-boot.mjs`'s own documented expectation) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No new runtime or dev dependency is needed anywhere in this phase — everything is composition of existing in-repo primitives |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled BFS/graph module | A generic graph library (e.g. `graphology`, `ngraph.graph`) | Would violate the project's zero-npm/zero-build canon (CLAUDE.md: "Automatic minification... None; edit HTML directly" / "no npm, no build step") for a problem small enough (≤20 nodes per level) that a 30-line adjacency-list BFS is simpler, more auditable, and has zero install/version-drift risk |
| Playwright | Puppeteer | Already-vendored choice in this repo (`browser-boot.mjs`, `mechanic-drive.mjs`); switching tooling mid-project for one phase would fragment the audit surface with no benefit |
| Empirical calibration probe | Trust the closed-form CONFIG formula (`JUMP_FORCE²/(2·GRAVITY)`) | Roadmap Success Criterion #2 and CONTEXT explicitly reject this — Phase 22 already found it produces unsafe-margin false candidates (no safety factor, and it only models the flat-Δy case) |

**Installation:**
```bash
# No new installs. Playwright is already resolvable via browser-boot.mjs's existing
# fallback logic; confirmed working on this machine during this research session.
```

**Version verification:** N/A — no new packages. `node --version` confirmed `v22.22.2` on this machine `[VERIFIED: local environment probe]`.

## Package Legitimacy Audit

**Not applicable — this phase installs zero new packages.** All tooling (Node built-ins, the already-vendored Playwright resolved via `browser-boot.mjs`'s existing fallback chain) is pre-existing in this repo. No `package-legitimacy check` run was needed.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────┐
                    │  src/levels/*.js  (pure data) │
                    │  floors / platforms / doors /  │
                    │  mathGates / enemies / goal     │
                    └───────────────┬─────────────────┘
                                    │  getLevel(id) / LEVEL_ORDER
                                    ▼
   ┌─────────────────────────────────────────────────────────────┐
   │            scripts/validate-levels.mjs  (orchestrator)        │
   │                                                                │
   │   for each level in LEVEL_ORDER:                              │
   │     ┌──────────────────────┐   ┌──────────────────────────┐   │
   │     │ over-hole-check.mjs   │   │ reachability.mjs           │   │
   │     │ (exact interval math) │   │ (Δy-aware jump edges + BFS)│   │
   │     │ doors/mathGates/      │   │ nodes: floor runs +        │   │
   │     │ enemies footprint vs  │   │        platforms            │   │
   │     │ floor-run coverage    │   │ edges: jump-feasible hops   │   │
   │     └──────────┬───────────┘   │ reads: calibrated envelope  │   │
   │                │                │ (checked-in constant)       │   │
   │                │                └──────────────┬─────────────┘   │
   │                │  HARD-FAIL rows                │  PASS/WARN/    │
   │                │                                │  HARD-FAIL     │
   │                ▼                                ▼                │
   │         per-level stdout report: level id / check name /         │
   │         PASS-FAIL(-WARN) / offending descriptor                  │
   │         → non-zero exit if any HARD-FAIL exists                  │
   └─────────────────────────────────────────────────────────────┘
                     ▲
                     │  frozen constant, written once
   ┌─────────────────┴─────────────────────────────────────────────┐
   │      scripts/calibrate-jump-envelope.mjs  (ONE-TIME, Playwright) │
   │                                                                   │
   │  browser-boot.mjs-style launch/serve  →  reposition player on a  │
   │  flat test strip (page.evaluate)  →  hold jump (standing) /       │
   │  hold right+jump (running)  →  sample pos every rAF tick  →       │
   │  repeat N trials  →  compute min/mean/max rise + run distance  →  │
   │  print the constant + documented safety-margin derivation         │
   └───────────────────────────────────────────────────────────────┘

   ┌───────────────────────────────────────────────────────────────┐
   │  scripts/audit-phase21-mechanics.mjs (or successor) — retry wrap │
   │                                                                   │
   │  for attempt in 1..N (N ∈ [3,5]):                                │
   │    reload level fresh (browser-boot.mjs-style serve+navigate)    │
   │    for each encounter (deriveEncounters, UNMODIFIED):             │
   │      if already reached in a prior attempt → skip                │
   │      driveToXClimbing(page, x)  +  resolveIfBoxed(page, ...)      │
   │      — BOTH UNMODIFIED, imported straight from mechanic-drive.mjs │
   │    OR the per-encounter result into the running results map       │
   │    early-exit once every encounter has been reached at least once │
   │  → write 23-FINDINGS.md: reached-if-ANY-run table + exclusions    │
   └───────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
scripts/
├── validate-levels.mjs          # NEW — VALID-01 orchestrator, standalone `node` entry point
├── calibrate-jump-envelope.mjs  # NEW — one-time Playwright probe (VALID-02); NOT run by validate-levels.mjs
├── lib/
│   ├── mechanic-drive.mjs       # UNCHANGED — driveToXClimbing / deriveEncounters / resolveIfBoxed
│   ├── reachability.mjs         # NEW — Δy-aware jump-edge model + BFS (pure data, no engine)
│   └── over-hole-check.mjs      # NEW — promoted exact interval arithmetic (pure data, no engine)
├── browser-boot.mjs             # UNCHANGED per CONTEXT — stays the basic boot-and-traverse smoke
└── audit-phase21-mechanics.mjs  # UPGRADED in place (or superseded by a 23-named successor) with
                                  # the retry wrapper — imports mechanic-drive.mjs UNCHANGED
```

### Pattern 1: Δy-aware jump-edge reachability (the core new algorithm)

**What:** A directed graph where nodes are floor runs and platforms (each `{ id, xStart, xEnd, y }`), and a directed edge `u → v` exists if a rightward (or leftward) jump launched from `u`'s near edge can land within `v`'s horizontal span, given the *height difference* between `u` and `v` — not a single flat "gap ≤ 178px" heuristic (Phase 22's approach, which implicitly assumed Δy = 0 everywhere).

**Why height-aware, concretely:** Kaplay's Y axis increases downward. A jump is standard projectile motion: `y(t) = y0 - JUMP_FORCE·t + 0.5·GRAVITY·t²`, `x(t) = x0 ± RUN_SPEED·t` (RUN_SPEED is a *constant* held-input speed, not something the jump impulse adds to). Given a target height `y1` (so `Δy = y1 - y0`, positive = landing lower/easier, negative = landing higher/harder):

- If `Δy < -maxRise` (target is higher than the calibrated max rise) → **no edge exists**, full stop — the arc physically cannot reach that height. This is the same `JUMP_FORCE²/(2·GRAVITY)` quantity already computed twice in this repo (`build.js` blocker heights, `mechanic-drive.mjs`'s header comment) — Phase 23's contribution is *replacing that closed-form constant with the empirically-measured one*, and using it as a **hard cutoff on Δy**, not as a flat max-run distance for every case.
- Otherwise, solve the quadratic for `t`: `0.5·GRAVITY·t² - JUMP_FORCE·t - Δy = 0` → `t = [JUMP_FORCE ± √(JUMP_FORCE² + 2·GRAVITY·Δy)] / GRAVITY`. This has up to two positive roots — `t_up` (arc crosses `y1` while still rising, only relevant if `Δy < 0`) and `t_down` (arc crosses `y1` while falling). For each valid root, `reach = RUN_SPEED · t`. **An edge exists if the target node's horizontal span, measured from the takeoff x, contains `reach` for EITHER root** (landing on top of a raised platform can happen on the ascending or descending part of the arc; landing on a lower/same-level floor only ever uses `t_down`, since `t_up` would be negative or undefined when `Δy ≥ 0`).
- Apply the calibrated safety margin by shrinking `RUN_SPEED` (or, equivalently, the resulting `reach`) by the empirically-derived margin percentage before testing containment — this is what turns "any envelope-adjacent hop is a hard PASS" into "hops that only clear because of exact best-case timing are WARN, not PASS" (see Pattern 3).

**When to use:** Every jump-edge test in the BFS graph — this fully replaces Phase 22's flat `rise≤96.6px, run≤178.3px, no safety factor` heuristic (`22-FINDINGS.md` line ~493), which the roadmap explicitly names as too crude to trust as a gate.

**Falling-only edges (free, no jump needed):** two nodes at the same or a lower height are also connected if the horizontal gap is small enough to just walk-and-fall off the edge (Δy > 0, RUN_SPEED-only horizontal budget over the full fall time) — this is a strict superset of the jump case (a fall gives *more* time in the air than a jump to the same height would), so it is naturally covered by evaluating the same quadratic with `JUMP_FORCE = 0` for the "step off the ledge" case in addition to the "jump off the ledge" case. Recommend computing both and taking the max horizontal reach.

**Example:**
```js
// Source: derived from src/config.js physics constants (RUN_SPEED, GRAVITY, JUMP_FORCE)
// and the same projectile-motion model mechanic-drive.mjs's header comment already
// documents for the flat (Δy=0) special case — this generalizes it to arbitrary Δy.
// maxRise / calibratedRunSpeed come from scripts/calibrate-jump-envelope.mjs's frozen
// output, NOT CONFIG.RUN_SPEED directly (the empirical value already bakes in the
// safety margin).
function jumpReach(dy, { gravity, jumpForce, calibratedRunSpeed, maxRise }) {
  if (dy < -maxRise) return []; // physically cannot rise this high — no edge
  const disc = jumpForce * jumpForce + 2 * gravity * dy;
  if (disc < 0) return []; // no real root (shouldn't happen given the maxRise guard above)
  const sqrtDisc = Math.sqrt(disc);
  const roots = [
    (jumpForce - sqrtDisc) / gravity, // ascending crossing (only positive/meaningful if dy < 0)
    (jumpForce + sqrtDisc) / gravity, // descending crossing
  ].filter((t) => t > 0);
  return roots.map((t) => calibratedRunSpeed * t); // candidate horizontal reaches
}
```

### Pattern 2: BFS over the jump-edge graph (spawn→goal, gap-width, mechanic-reachability checks)

**What:** Build the node list (one per floor run, one per platform) once per level; build the adjacency list by testing `jumpReach` between every ordered pair of nodes whose vertical relationship is compatible (skip pairs where neither direction has a valid Δy); then run a standard BFS/DFS from the node containing the spawn x-position to the node containing the goal x-position.

**Why BFS specifically (not Dijkstra/A*):** this is a pure connectivity question — is there ANY chain of feasible hops from spawn to goal — not a shortest-path optimization. Every edge is a boolean "feasible or not" (unweighted), so BFS is both correct and the simplest possible tool; introducing weights/costs would be solving a problem the roadmap doesn't ask for. `[ASSUMED — standard graph-theory application, not project-specific; risk is negligible since BFS/DFS give identical connectivity results for unweighted graphs]`

**How this satisfies each ROADMAP-named check:**
- **Spawn→goal reachability:** BFS from the node covering spawn-x to the node covering goal-x; FAIL if disconnected.
- **Gap widths vs jump envelope:** for each pair of *adjacent* floor runs (ordered by x, with no other floor run between them), report PASS if at least one edge (direct or via an intermediate platform) bridges them, FAIL otherwise — this reuses the exact same edge-test function, just reported per-gap instead of aggregated into one boolean.
- **Mechanic reachability:** for each door/mathGate/enemy/collectZone, confirm its floor run is in the BFS-reachable component from spawn. **Mechanics are NOT modeled as blocking walls in the graph** — see Pitfall 4 below; a door/gate/enemy is a physical collider the player touches and resolves (per `door.js`/`gates.js`/`enemy.js` — challenge.js has no lockout, wrong answers just re-ask, per this project's forgiving/no-game-over design), so once its floor run is reachable, the mechanic is reachable too. The over-hole check (Pattern 3-adjacent, see next section) is the separate, necessary precondition that the barrier's own footprint isn't floating over a hole (in which case the player could never physically touch it to trigger the challenge at all).

**When to use:** Once per level, as the core of `validate-levels.mjs`'s reachability + gap-width checks.

### Pattern 3: HARD-FAIL vs WARN tiering (CONTEXT-locked)

**What:** Every reachability edge test returns not just boolean feasibility but a **margin ratio** — how close the required `reach`/`Δy` came to the calibrated envelope's edge. Two thresholds:
- **HARD-FAIL:** the door/mathGate-over-hole interval check finds a barrier NOT fully supported by a floor run (exact arithmetic — always HARD-FAIL, never WARN, since a floating barrier is unconditionally untouchable) — OR the BFS finds NO path at all from spawn to goal (exact graph-connectivity fact, not a margin call).
- **WARN:** the BFS finds a path, but the edge(s) it depends on used more than some threshold fraction (recommend starting at 90%, tune once calibration variance is known) of the calibrated envelope — i.e. the jump barely clears with essentially no room for player imprecision. This deliberately mirrors 22-FINDINGS' own "exact" (over-hole, 3 confirmed) vs "heuristic candidate" (8 platforms, arbiter-pending) split, but is now backed by the *empirically calibrated* margin rather than the flat, no-safety-factor CONFIG formula that produced those 8 unconfirmed candidates.

**Why this avoids false-failing legitimate tight jumps:** several of Phase 22's 8 "heuristic candidate" platforms sit at gap edges under the flat, no-safety-factor formula (`22-FINDINGS.md` explicitly: "may well be reachable in practice — Phase 23's calibrated envelope is the arbiter"). A validator that HARD-FAILs on every near-envelope-edge case would likely reintroduce false positives the roadmap is trying to eliminate; WARN preserves visibility without blocking the gate.

### Pattern 4: Promoted exact interval arithmetic (door/mathGate/enemy-over-hole)

**What:** Directly promote Phase 22's already-run-and-proven scratchpad logic (`interval-check-22-04.mjs`, whose exact source is preserved in `22-RESEARCH.md`'s Code Examples section) into a real, exported module.

**Example:**
```js
// Source: scripts/lib/over-hole-check.mjs — promoted verbatim from 22-RESEARCH.md's
// Code Examples ("Structural-defect inventory check"), which was itself run this
// session against the live repo (22-FINDINGS.md Structural Defect Inventory) and
// proved correct against the 3 known over-hole defects (level-01 x600/x1300,
// level-04 x1800). ONE change from the scratchpad version: export it as a function
// returning structured rows instead of console.log-ing, so validate-levels.mjs can
// format its own PASS/FAIL report.
import { CONFIG } from "../../src/config.js";

const BARRIER_WIDTH = {
  doors: CONFIG.DOOR.W,       // 32
  mathGates: CONFIG.MATH_GATE.W, // 32
  enemies: CONFIG.ENEMY.W,    // 32
};

export function findOverHoleBarriers(geometry) {
  const runs = geometry.floors.map((f) => [f.x, f.x + f.w]);
  const onFloor = (x) => runs.some(([a, b]) => x >= a && x <= b);
  const rows = [];
  for (const kind of ["doors", "mathGates", "enemies"]) {
    for (const e of geometry[kind] ?? []) {
      const w = BARRIER_WIDTH[kind];
      if (!onFloor(e.x) || !onFloor(e.x + w)) {
        rows.push({ kind, x: e.x, w, footprint: [e.x, e.x + w] });
      }
    }
  }
  return rows; // [] means clean — HARD-FAIL only if length > 0
}
```

**When to use:** Once per level, per barrier type, in `validate-levels.mjs`. This check is entirely independent of the calibrated jump envelope — it needs no browser, no calibration constant, and can be implemented and unit-tested against a synthetic fixture (see Pattern 5) before the calibration probe even exists.

### Pattern 5: A deliberately-broken fixture to prove the validator goes RED on demand

**What:** This project already has exactly this pattern for a different checker: `scripts/fixtures/bad-scene.js` exists solely so `check-import-safety.sh`'s calibration self-test can prove the a727c13 checker fires on a known-bad input, independent of whether any *shipped* file happens to be bad right now.

**Recommendation:** add a `scripts/fixtures/bad-level.js` (or a small inline fixture object literal directly in a `validate-levels.self-test.mjs`, developer's naming choice) — a synthetic level descriptor with (a) a mathGate placed squarely over a gap with no stepping-stone, and (b) an isolated platform with a Δy/run combination that exceeds even the theoretical (non-margin-adjusted) closed-form envelope, so it is UNCONDITIONALLY unreachable regardless of the exact calibration numbers. Run the validator against this fixture as a fast, browser-free self-test that the validator's own checks are wired correctly, **in addition to** (not instead of) the CONTEXT-required RED-first proof against the real, untouched levels 1–4. This closes a testing gap the real levels 1–4 cannot: proving the checker fires on cases that have nothing to do with this specific game's authored content.

### Anti-Patterns to Avoid
- **Modeling doors/gates/enemies as impassable walls in the reachability graph:** this project's math mechanics have no lockout state (challenge.js re-asks indefinitely on a wrong answer, per the ADHD-safe no-game-over design) — treating them as blocking would produce false HARD-FAILs on every level that has a barrier past a gap, which is every level in this game.
- **Re-measuring the jump envelope on every validator run:** CONTEXT explicitly locks this — the calibration probe is a separate, manually-invoked one-time script; `validate-levels.mjs` must read a checked-in constant, never launch Playwright itself.
- **Using the flat, no-safety-factor CONFIG formula as the calibrated envelope:** this is the exact anti-pattern Phase 22 already caught (the source of the 8 unconfirmed "heuristic candidate" platforms) and Roadmap Success Criterion #2 exists specifically to require empirical replacement.
- **Treating "possibly unreachable" (WARN) as equivalent to a confirmed HARD-FAIL** in `23-FINDINGS.md`'s RED-first proof table — conflating the two tiers would misrepresent what was actually proven and could mislead Phase 24's fix scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph connectivity check | A custom pathfinding/Dijkstra implementation with weights | Plain unweighted BFS/DFS (≤20 nodes/level) | The roadmap only asks "is X reachable from Y", a boolean connectivity question — weights add complexity with zero payoff here |
| Physics trajectory sampling | A full physics-engine re-implementation to "predict" landings offline | Direct empirical measurement via `page.evaluate` polling (already-proven `mechanic-drive.mjs` technique) | The whole point of VALID-02 is trusting the REAL running engine's numbers over any offline re-derivation; re-implementing the engine's integrator would just reintroduce the same "theory vs reality" gap this phase exists to close |
| Retry/flake handling for the interactive audit | A generic retry/backoff library | A bounded (3–5 attempt) loop reusing the existing `driveToXClimbing`/`resolveIfBoxed` exports unmodified, OR-ing per-encounter results | This project's own established idiom for flake diagnosis (the `check-gate.sh` SIGPIPE investigation, cited directly in CONTEXT) is manual, bounded, and explained-in-comments — not a dependency |

**Key insight:** almost everything this phase needs already exists somewhere in this repo, proven correct once already (Phase 21's traversal model, Phase 22's interval check, the `bad-scene.js` self-test convention). The main engineering risk is *not* algorithmic — it's under-crediting/duplicating that prior work instead of promoting it verbatim, which would both waste effort and risk silently regressing a check that was already validated against the real defects.

## Common Pitfalls

### Pitfall 1: Confusing the empirically-calibrated envelope's job with the closed-form formula's job
**What goes wrong:** Someone re-derives `JUMP_FORCE²/(2·GRAVITY)` from `CONFIG` and calls it "the calibrated envelope," defeating the entire point of VALID-02.
**Why it happens:** the closed-form value and the empirically-measured value will likely be numerically *close* (the physics is well-understood; `GRAVITY`/`JUMP_FORCE`/`RUN_SPEED` are exact `CONFIG` constants, not estimates) — it's tempting to skip the browser step since "we already know the answer."
**How to avoid:** the calibration script's OUTPUT (raw sampled trials + derived min/mean/max + the chosen margin) must be pasted into the checked-in constant's comment, mirroring `CONFIG.JUMP_FORCE`'s own tuning-comment convention — if that comment cites `page.evaluate` sample data, it was done correctly; if it only cites the formula, it wasn't.
**Warning signs:** a "calibrated" constant that exactly equals `JUMP_FORCE**2/(2*GRAVITY)` with no derivation trail.

### Pitfall 2: First-sample / first-frame timing contamination in the calibration probe
**What goes wrong:** Kaplay's `dt()` on the very first frame after a scene loads or after repositioning the player can be anomalously large (accumulated setup time), which would skew a naive "sample immediately after triggering the jump" measurement.
**Why it happens:** this is a well-known class of browser/game-loop timing artifact; `player.js`'s own `onUpdate` relies on `dt()` being frame-rate-independent, which assumes reasonably-behaved per-frame deltas.
**How to avoid:** let the scene settle (e.g. `page.waitForTimeout(300-500)`, matching the existing settle-time conventions already used in `browser-boot.mjs`/`mechanic-drive.mjs`) after any teleport/reposition, before triggering the jump under measurement; sample position every rendered frame (not a coarse poll) so a single bad frame doesn't dominate a small trial count; run enough trials (recommend ≥10) that one outlier frame doesn't bias the min/mean.
**Warning signs:** the calibration script's own trial-to-trial variance is implausibly large (e.g. >10-15% spread) — investigate before trusting the derived margin.

### Pitfall 3: Reusing `driveToXClimbing`'s coarse 120ms poll cadence for calibration
**What goes wrong:** `mechanic-drive.mjs`'s `pollMs: 120` default is tuned for *traversal* (get roughly there, trigger the mechanic) not *precision measurement* of an apex or landing point — using it for calibration would under-sample the peak of the jump arc, systematically under-measuring max rise.
**Why it happens:** it's the readily-available default in the shared module, so it is easy to reach for without re-reading its own doc comment (which is explicit that it exists for traversal, not measurement).
**How to avoid:** the calibration probe should NOT import `driveToXClimbing` for the measurement loop itself (it MAY still reuse `browser-boot.mjs`'s launch/serve skeleton, per CONTEXT) — sample every rendered frame via a tight loop (e.g. bridging to `requestAnimationFrame` inside `page.evaluate`, or polling as fast as Playwright's round-trip allows) for the duration of one full jump arc.
**Warning signs:** measured max rise is suspiciously close to (but always slightly less than) the closed-form `JUMP_FORCE²/(2·GRAVITY)` value by an amount that scales with poll interval, not with genuine physics variance.

### Pitfall 4: Modeling barriers (door/mathGate/enemy) as walls in the BFS graph
**What goes wrong:** treating a door/gate/enemy as blocking traversal in the reachability graph produces false HARD-FAILs — every level in this game places at least one barrier past a gap by design (that's the whole "mid-level challenge seam" pattern from `door.js`'s own header comment).
**Why it happens:** it's the intuitive first model ("there's a solid collider there, so movement stops until it's resolved") and it IS true at the physics level for a single frozen frame — but the game's forgiving, no-lockout challenge design (wrong answers just re-ask, confirmed by reading `challenge.js`'s close()-only-on-success semantics) means the barrier is *always eventually* passable, so for a **structural** reachability question (can the player ever get from spawn to goal, given unlimited attempts) it should be treated as fully passable once its floor run is reached.
**How to avoid:** explicitly document (in the module's own header comment, mirroring this repo's convention) that barriers are NOT graph-blocking; the ONLY thing that can make a barrier truly unreachable is Pattern 4's over-hole check (its footprint literally floating over empty space, so the player can never touch it to trigger the challenge in the first place).
**Warning signs:** the BFS check fails on a level whose interactive audit (a real Playwright run) already proves the barrier is reachable and resolvable.

### Pitfall 5: Full-level reload cost multiplying the retry harness's runtime unnecessarily
**What goes wrong:** naively re-running the ENTIRE 16-encounter sweep 5 times (5x the current audit runtime) when most encounters are already stably-reached (Phase 22's baseline: 8 stable-reached, 5 stable-unreached, 3 timing-sensitive) wastes time re-proving things that don't need re-proving.
**Why it happens:** the simplest possible retry-wrapper implementation is "just run the whole thing N times."
**How to avoid:** OR the per-encounter results across attempts and skip re-driving an encounter that's already recorded as reached in an earlier attempt within the same run (see the wrapper sketch in Architecture Patterns' diagram) — the retries should concentrate effort on the still-unreached rows, per CONTEXT's own framing ("3–5 retries per still-unreached encounter"). Note this still requires a fresh level reload per attempt (since `driveToXClimbing` is stateful/sequential within a level — an encounter's outcome depends on the player's position/state carried over from the previous encounter in the same pass), so the "skip" only applies to not re-driving individual already-reached encounters' *outcome bookkeeping*, not to skipping the reload itself.
**Warning signs:** the upgraded audit script's total runtime is close to 5x the original per level with no early-exit ever firing, even on levels where every encounter was already stably reached in Phase 22's baseline.

## Code Examples

### Reachability graph construction skeleton
```js
// Source: synthesized this session from src/levels/*.js geometry shape + the Δy-aware
// jump model above (Pattern 1). Node ids are stable strings so validator output can
// name the offending node directly (CONTEXT: "offending descriptor" in the report).
export function buildNodes(geometry) {
  const nodes = [];
  geometry.floors.forEach((f, i) =>
    nodes.push({ id: `floor-${i}`, xStart: f.x, xEnd: f.x + f.w, y: geometry.__FLOOR_Y }));
  (geometry.platforms ?? []).forEach((p, i) =>
    nodes.push({ id: `platform-${i}`, xStart: p.x, xEnd: p.x + p.w, y: p.y }));
  return nodes;
}

export function nodeContaining(nodes, x, y /* optional, for platform vs floor disambiguation */) {
  return nodes.find((n) => x >= n.xStart && x <= n.xEnd && (y === undefined || Math.abs(y - n.y) < 8));
}
```

### Calibration probe skeleton (Playwright, one-time script)
```js
// Source: adapted from browser-boot.mjs's launch/serve skeleton (imported verbatim
// per CONTEXT's "reusing browser-boot.mjs's launch/page pattern" — copy the server +
// resolvePlaywright() functions rather than importing browser-boot.mjs itself, since
// browser-boot.mjs has no exports and CONTEXT keeps it untouched/unextended).
// Reposition (not walk-to) the player for deterministic, repeatable trial starts.
async function measureStandingJump(page, startX, floorY) {
  await page.evaluate(({ x, y }) => {
    const p = get("player")[0];
    p.pos.x = x; p.pos.y = y; p.vel = vec2(0);
  }, { x: startX, y: floorY - 32 });
  await page.waitForTimeout(300); // let the reposition settle (Pitfall 2)
  await page.keyboard.down("Space");
  const samples = [];
  for (let i = 0; i < 120; i++) { // generous sample budget for one full arc
    const s = await page.evaluate(() => {
      const p = get("player")[0];
      return { x: p.pos.x, y: p.pos.y, grounded: p.isGrounded() };
    });
    samples.push(s);
    if (i > 5 && s.grounded) break; // landed — stop sampling this trial
    await page.waitForTimeout(16); // ~1 frame at 60fps; finer than driveToXClimbing's 120ms (Pitfall 3)
  }
  await page.keyboard.up("Space");
  const minY = Math.min(...samples.map((s) => s.y));
  return { maxRise: floorY - 32 - minY, samples };
}
```

### Retry-wrapper skeleton (interactive audit upgrade)
```js
// Source: synthesized this session, composing UNCHANGED mechanic-drive.mjs exports
// per CONTEXT's "changes isolated to the mechanic-drive audit path" constraint.
import { deriveEncounters, driveToXClimbing, resolveIfBoxed } from "./lib/mechanic-drive.mjs";

export async function auditLevelWithRetries(page, level, { maxAttempts = 5 } = {}) {
  const results = new Map(); // `${tag}@${x}` -> { triggered, resolved, attempts }
  const encounters = deriveEncounters(level.geometry);
  const firstFloorEnd = level.geometry.floors?.[0]
    ? level.geometry.floors[0].x + level.geometry.floors[0].w : 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // caller reloads/navigates to a fresh instance of `level` here before each attempt
    for (const enc of encounters) {
      const key = `${enc.tag}@${enc.x}`;
      if (results.get(key)?.triggered) continue; // already proven reachable — save time
      const opts = enc.x < firstFloorEnd ? { warmupUntilFirstGap: true } : {};
      const { triggered } = await driveToXClimbing(page, enc.x, opts);
      let resolved = results.get(key)?.resolved ?? null;
      if (triggered && enc.renderChoices) ({ resolved } = await resolveIfBoxed(page, true));
      results.set(key, {
        triggered: triggered || (results.get(key)?.triggered ?? false),
        resolved,
        attempts: (results.get(key)?.attempts ?? 0) + 1,
      });
      if (!triggered) break; // matches existing sequential-approach semantics
    }
    if (encounters.every((e) => results.get(`${e.tag}@${e.x}`)?.triggered)) break; // early exit
  }
  return results; // still-false rows here → documented exclusions in 23-FINDINGS.md
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Phase 22's flat, no-safety-factor closed-form envelope (`rise≤96.6px, run≤178.3px`, ignores Δy, ignores landing precision) | Δy-aware quadratic jump-edge model fed by an empirically-measured (not formula-derived) envelope with a documented safety margin | This phase (VALID-02) | Turns 8 unconfirmed "heuristic candidate" platforms into arbitrated PASS/WARN/HARD-FAIL verdicts; removes the "no safety factor" false-positive source Phase 22 explicitly flagged |
| Single-pass interactive audit (one run, timing-sensitive rows flip nondeterministically between identical-code runs) | Bounded (3–5) OR-across-attempts retry harness | This phase (VALID-03 groundwork) | Distinguishes genuinely-unreachable encounters from merely timing-sensitive ones, shrinking the reported 6/16 blind spot per ROADMAP Success Criterion #4 |
| Scratchpad, uncommitted interval-arithmetic check (`interval-check-22-04.mjs`, evidence-only, not a real gate) | Promoted, exported, real validator module (`over-hole-check.mjs`) | This phase (VALID-01) | Makes the already-proven-correct check a permanent, re-runnable gate instead of one-off evidence |

**Deprecated/outdated:** the closed-form-only envelope approach is superseded by empirical calibration for THIS specific validator's HARD-FAIL/WARN decisions; the closed-form constants remain correctly in use elsewhere in the codebase (`build.js`'s apex-derived blocker heights) since that usage never claimed to need a safety margin — CONTEXT does not ask this phase to touch `build.js`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Δy-aware quadratic projectile model is the correct generalization of Phase 22's flat-Δy heuristic | Architecture Patterns, Pattern 1 | LOW — this is standard, unconditional projectile-motion algebra (not project-specific), it reduces exactly to Phase 22's flat case at Δy=0 (already partially validated by that phase's own use), and the empirical calibration step corrects for any residual real-engine discretization (dt() stepping, coyote/buffer interaction) that a pure formula would miss |
| A2 | Barriers (door/mathGate/enemy) should NOT be modeled as blocking edges in the BFS reachability graph | Architecture Patterns, Pitfall 4 | LOW — directly grounded in a source read of `door.js`/`gates.js`/`enemy.js`/`challenge.js` (no lockout state exists; wrong answers re-ask indefinitely), but if a future mechanic ever introduces a real lockout, this assumption would need revisiting |
| A3 | A safety margin derived as "minimum observed trial value, further shaved by a documented percentage" is an appropriate conservative choice (vs. e.g. mean minus N standard deviations) | Jump Envelope Calibration guidance (Common Pitfalls, Code Examples) | MEDIUM — this is the researcher's methodological recommendation, not something CONTEXT or existing code pins down; CONTEXT explicitly leaves "the exact chosen safety-margin percentage" to Claude's discretion informed by the observed variance, so the planner should treat the exact statistical method as an open implementation choice to finalize once real trial data exists, not a locked formula |
| A4 | ≥10 calibration trials per jump type (standing max-rise, running max-reach) is enough to get a stable min/mean/max without excessive runtime | Common Pitfalls (Pitfall 2) | LOW — this is a reasonable statistical default for a one-time script with no strict runtime budget; if variance turns out unexpectedly high, the planner/implementer can simply increase the trial count, since this script is not part of the routine per-commit gate |
| A5 | Player spawn is always `(64, 64)` for every level (game.js's hardcoded default, never overridden by any `go("game", ...)` call site) | Used only as a reference fact for calibration-probe test-strip placement, not for validator logic | LOW — directly confirmed by reading `src/scenes/game.js` (`const startX = data?.startX ?? 64`) and every `go("game", ...)` call site in `select.js` (passes only `{ levelId }`, never `startX`/`startY`) |

**If this table is empty:** N/A — see rows above; none of these are compliance/retention/security-standard claims, all are either standard physics/graph-theory or directly source-verified project facts, but A3 in particular should be flagged to the user/planner as an open methodological choice rather than a locked decision.

## Open Questions

1. **What exact trial count and margin-derivation formula should `calibrate-jump-envelope.mjs` use?**
   - What we know: CONTEXT explicitly defers this to Claude's discretion, informed by the observed calibration variance; this research recommends ≥10 trials per jump type and a "minimum-observed-value minus a documented percentage" conservative approach (Assumption A3).
   - What's unclear: the actual variance this specific engine/browser combination will produce — it cannot be known until the probe is actually run.
   - Recommendation: the planner should schedule the calibration probe as an early task (before the reachability module is built against its output), and have the implementer document the raw sampled numbers directly in the frozen constant's comment, exactly as `CONFIG.JUMP_FORCE`'s own comment cites "tuned on the stress strip in 08-01 Task 3."

2. **Should the WARN-tier margin threshold (this research suggested starting at 90% of the calibrated envelope) be a `CONFIG`-style tunable constant or a hardcoded literal in `reachability.mjs`?**
   - What we know: CONTEXT locks the two-tier HARD-FAIL/WARN design but does not specify where the threshold lives.
   - What's unclear: whether Phase 24 (which fixes the flagged defects) will need to retune this threshold once real fixes are attempted against real playtesting.
   - Recommendation: treat as a named, commented constant near the top of `reachability.mjs` (not buried inline) so Phase 24 can find and retune it without re-deriving the whole model — low-cost insurance regardless of the answer.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `validate-levels.mjs`, `calibrate-jump-envelope.mjs`, retry-wrapper | ✓ | v22.22.2 `[VERIFIED: local environment probe]` | — |
| Playwright (`chromium`) | Calibration probe + interactive audit retry harness | ✓ (via `browser-boot.mjs`'s existing fallback path, confirmed working this session) | resolved via `/home/magnus/.nvm/versions/node/v22.22.2/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs` `[VERIFIED: local environment probe]` | Set `PLAYWRIGHT_MJS_PATH` env var on a different machine, per `browser-boot.mjs`'s own documented override mechanism |

**Missing dependencies with no fallback:** none.

**Missing dependencies with fallback:** none currently missing — the fallback path itself was confirmed working, matching `browser-boot.mjs`'s own already-documented expectation for this machine.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (project canon) — the `check(cond, msg)` + failure-counter + `process.exit(1)` idiom `smoke-progress.mjs` establishes IS this project's unit-test layer |
| Config file | none — direct `node scripts/*.mjs` invocation |
| Quick run command | `node scripts/validate-levels.mjs` (once built) |
| Full suite command | `node scripts/validate-levels.mjs && bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VALID-01 | Validator checks all 4 named properties on every registered level, exits non-zero on failure | integration (pure-data, no browser) | `node scripts/validate-levels.mjs` (verify exit code + stdout table shape) | ❌ Wave 0 — script does not exist yet |
| VALID-01 | Validator's own checks fire correctly on a synthetic known-bad fixture (Pattern 5) | integration (pure-data, no browser) | `node scripts/validate-levels.mjs --fixture scripts/fixtures/bad-level.js` (or equivalent self-test entry point — naming is implementer's discretion) | ❌ Wave 0 — fixture + self-test entry point do not exist yet |
| VALID-02 | Jump envelope constant is empirically measured (not closed-form) with a documented safety margin | manual-only (one-time Playwright probe, not part of the routine gate) — justification: CONTEXT explicitly locks this as a manually-invoked, non-routine script; automating it into the per-commit path would violate the "does NOT launch a browser on every invocation" constraint | `node scripts/calibrate-jump-envelope.mjs` (run once, output reviewed by a human, then frozen into a constant) | ❌ Wave 0 — script does not exist yet |
| VALID-02 | Validator, run against the untouched levels 1–4, non-zero-exits AND names the 3 known over-hole defects | integration (pure-data, no browser) — this IS the RED-first proof itself, recorded in `23-FINDINGS.md` | `node scripts/validate-levels.mjs` against unmodified `src/levels/*.js` | ❌ Wave 0 — depends on the validator existing first |
| VALID-03 (groundwork) | Retry harness reduces the 6/16 blind spot on levels 1–4, every remaining exclusion documented | manual/interactive (Playwright-driven, real browser) — this class of test cannot be a fast automated unit test by its nature (it drives the real running game) | `node scripts/audit-phase21-mechanics.mjs` (upgraded) or a 23-named successor | ❌ Wave 0 — retry wrapper does not exist yet |

### Sampling Rate
- **Per task commit:** `node scripts/validate-levels.mjs` (fast, pure-data, no browser — safe to run after every task that touches `scripts/lib/reachability.mjs` or `scripts/lib/over-hole-check.mjs`)
- **Per wave merge:** full suite (validator + all 4 existing static gates + smoke)
- **Phase gate:** full suite green, PLUS the RED-first proof recorded in `23-FINDINGS.md` (this is a one-time, deliberate RED that must be captured before any fix lands — do not "green up" the validator against levels 1–4 in this phase; that is explicitly Phase 24's job)

### Wave 0 Gaps
- [ ] `scripts/lib/reachability.mjs` — does not exist; covers the BFS + Δy-aware jump-edge model (VALID-01)
- [ ] `scripts/lib/over-hole-check.mjs` — does not exist; promotes Phase 22's proven scratchpad logic (VALID-01)
- [ ] `scripts/validate-levels.mjs` — does not exist; the orchestrator entry point (VALID-01)
- [ ] `scripts/calibrate-jump-envelope.mjs` — does not exist; the one-time Playwright probe (VALID-02)
- [ ] `scripts/fixtures/bad-level.js` (or equivalent) — does not exist; recommended self-test fixture (Pattern 5), not CONTEXT-required but strongly recommended to de-risk validator correctness independent of levels 1–4's specific content
- [ ] Retry-wrapper module/upgrade to the interactive audit — does not exist; wraps `mechanic-drive.mjs`'s unmodified exports (VALID-03 groundwork)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | This phase adds local dev-tooling scripts with no auth surface |
| V3 Session Management | No | No sessions involved |
| V4 Access Control | No | No access-control surface; scripts run locally by the developer |
| V5 Input Validation | Marginal — see below | The validator reads `src/levels/*.js` descriptors, which are trusted, developer-authored, non-remote data (not user/network input); no external input-validation control is warranted, but the validator should stay forgiving (never throw/crash) per the project's established `T-13-07`/`SAVE-05` "never brick" convention when a descriptor is malformed (e.g. missing `floors`), consistent with `build.js`'s existing `?? []`-guarded optional-slot pattern |
| V6 Cryptography | No | No cryptography anywhere in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Local-loopback HTTP server used by the calibration/audit probes serving arbitrary paths | Tampering (path traversal) | `browser-boot.mjs` ALREADY implements the correct mitigation (CR-02: resolve+clamp to `ROOT_ABS` with a path-separator boundary check, bind to `127.0.0.1` only) — any new script that copies this server skeleton (per CONTEXT's "reusing browser-boot.mjs's launch/page pattern") MUST copy this guard verbatim, not a simplified version |
| Malformed/adversarial level descriptor crashing the validator | Denial of Service (local, low severity — this is a dev tool, not a deployed service) | Follow the `build.js`/`progress.js` "never brick" convention: `?? []` guards on optional geometry arrays, forgiving fallbacks rather than throws, so a malformed descriptor produces a clear FAIL row instead of an uncaught exception |

This phase's actual security-relevant surface is minimal (a local dev tool operating on trusted, developer-authored data) — the one concrete, actionable control is: any new Playwright-driving script that stands up its own local HTTP server must replicate `browser-boot.mjs`'s existing path-traversal guard and loopback-only bind, not write a simplified version from scratch.

## Sources

### Primary (HIGH confidence)
- `scripts/lib/mechanic-drive.mjs` (this repo) — proven `driveToXClimbing`/`deriveEncounters`/`resolveIfBoxed` traversal model, `page.evaluate` sampling technique, physics constants derivation comment `[VERIFIED: direct file read]`
- `scripts/browser-boot.mjs` (this repo) — Playwright launch/serve pattern, CR-02 path-traversal guard, playwright-fallback-path resolution `[VERIFIED: direct file read + local environment probe confirming the fallback resolves]`
- `scripts/smoke-progress.mjs` (this repo) — the `check(cond, msg)`/failure-counter/`process.exit(1)` no-framework assertion idiom `[VERIFIED: direct file read]`
- `scripts/fixtures/bad-scene.js` (this repo) — the established "deliberately-bad fixture proves the checker goes RED" convention `[VERIFIED: direct file read]`
- `src/config.js`, `src/player.js`, `src/mechanics/door.js` (this repo) — physics constants, jump/coyote/buffer mechanics, barrier no-lockout confirmation `[VERIFIED: direct file read]`
- `src/levels/index.js`, `src/levels/level-01.js` (+ 02/03/04 geometry cross-checked via `smoke-progress.mjs`'s own expected-geometry assertions) (this repo) — registry API, exact geometry for all 4 shipped levels `[VERIFIED: direct file read]`
- `.planning/phases/22-implementation-review-auto-fix/22-FINDINGS.md` and `22-RESEARCH.md` (this repo/planning artifacts) — the exact 3 confirmed over-hole defects, 8 heuristic-candidate platforms, the promotable interval-arithmetic script source, the audit baseline nondeterminism data `[VERIFIED: direct file read]`
- `.planning/milestones/v4.1-phases/.../21-FINDINGS.md` (this repo/planning artifacts) — the 6/16 blind-spot baseline and its documented spike-timing-resonance methodology note `[VERIFIED: direct file read]`

### Secondary (MEDIUM confidence)
- [kode80 — Level Generation for Platform Games](https://kode80.com/blog/2015/02/02/level-generation-for-platform-games/index.html) — confirms the standard "nodes = platforms, directed edges = jump-trajectory-feasible connections computed per approach style" graph model used in real platformer level-generation tooling `[CITED: kode80.com]`
- [An Integrated Framework for AI Assisted Level Design in 2D Platformers (arXiv:1804.09153)](https://arxiv.org/pdf/1804.09153) — academic confirmation that jump-arc reachability graphs are standard practice for platformer level validation/generation `[CITED: arxiv.org]`

### Tertiary (LOW confidence)
- General web search for "Playwright headless browser physics simulation sampling position frame variance measurement" returned no directly relevant specialized documentation — the calibration-probe methodology in this document is synthesized from this repo's own already-proven `page.evaluate` polling technique, not from any external Playwright-specific physics-measurement guide `[flagged LOW confidence per the classify-confidence seam's own verdict for an unverified websearch result]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, environment probe confirmed everything needed already resolves on this machine
- Architecture (BFS graph + interval arithmetic): HIGH — grounded directly in this repo's own already-proven prior work (Phase 21/22) plus standard, unconditional projectile-motion algebra
- Calibration methodology (exact trial count, exact margin formula): MEDIUM — CONTEXT deliberately leaves the exact numbers to post-measurement discretion; this research provides a defensible starting methodology, not a locked formula
- Pitfalls: HIGH — sourced directly from this repo's own documented history of near-identical failure modes (audit nondeterminism, first-frame timing, poll-cadence tradeoffs)

**Research date:** 2026-07-05
**Valid until:** No expiry risk from external ecosystem drift (zero new dependencies) — the only invalidation trigger is a future retune of `CONFIG.RUN_SPEED`/`GRAVITY`/`JUMP_FORCE`, which would require re-running the calibration probe (this is a project-internal event, not a time-based one, so no fixed "valid until" date applies).
