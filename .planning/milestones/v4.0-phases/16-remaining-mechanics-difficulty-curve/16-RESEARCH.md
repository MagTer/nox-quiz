# Phase 16: Remaining Mechanics + Difficulty Curve - Research

**Researched:** 2026-07-03
**Domain:** Kaplay 3001.0.19 in-world math mechanics + per-level difficulty seam (vanilla JS, no external libs)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Mechanic Pattern**
- One `mechanics/{mechanic}.js` module per mechanic.
- Each exports a single `wire{Mech}({ player, brain })` function.
- On collide/touch, freeze the player and call `openChallenge({ brain, onSuccess })`.
- `onSuccess` removes the relevant entity/entities and unpauses the player.
- All engine globals stay inside the exported function body (a727c13).

**Tags**
- `math-gate` — checkpoint gate entities (MECH-04).
- `answer-pickup` — numeric answer pickups (MECH-03). A special `answer-zone` or `collect-challenge` tag triggers the challenge when the player enters the zone.
- `enemy` — blocking enemy entities (MECH-05).

**Difficulty Ramp**
- `allowedTables` already exists on level descriptors and in `createBrain`.
- Verify `src/scenes/game.js` passes `allowedTables` into `createBrain`.
- Update `LEVEL_01` to keep `[6,7,8,9]` (the existing v3.0 feel) so this phase does not accidentally make level-01 easier.
- Authoring harder/easier pools is Phase 17's job; this phase only proves the seam works.

**Visual Placeholders**
- Enemies and pickups use simple shapes/text for now, same placeholder policy as Phase 14/15.
- No new sprite assets; Phase 18 will skin them.

### Deferred Ideas (OUT OF SCOPE)
- Real enemy/pickup art and animation (Phase 18).
- Full level authoring across 3–5 levels (Phase 17).
- Consolidated ADHD-safety audit and kid-UAT (Phase 19).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| MECH-03 | Collect-the-answer — the correct numeric answer is one of several in-world pickups; collecting the right one clears the challenge, and collecting a wrong one never punishes | See Architecture Patterns (Pattern 1), Code Examples (challenge.js extension for no-choice overlay), Common Pitfalls #1 (pickup values must match the SAME question shown in the overlay) |
| MECH-04 | Multiple checkpoint gates — several in-level math gates (not only at the goal) each independently tracked within the level | See Architecture Patterns (Pattern 2), Code Examples (door.js generalization to `math-gate` tag) |
| MECH-05 | Defeat-enemy-with-answer — answering correctly removes a blocking enemy; the enemy never deals contact damage and never ends the run | See Architecture Patterns (Pattern 3), Code Examples (blocking enemy with custom prompt) |
| LVL-03 | Table difficulty ramps across levels via a per-level `allowedTables` pool fed to the unchanged brain | See Existing Code Insights (game.js already threads `allowedTables` from level to `createBrain`) |
</phase_requirements>

## Summary

This phase wires three new math mechanics over the already-proven shared `ui/challenge.js` seam from Phase 15 and turns the existing per-level `allowedTables` field into a verified difficulty seam. The work is almost entirely disciplined pattern extension — no new engine primitives, no new dependencies, and no changes to the locked `math/brain.js` algorithm.

Two design decisions are not obvious from the phase description and must be in the plan:

1. **Collect-the-answer requires a small, backward-compatible extension to `challenge.js`.** The shared overlay currently always renders four clickable/keyboard answer boxes. For MECH-03 the choices must be rendered as in-world numeric pickups instead. The cleanest seam extension is to add two optional parameters to `openChallenge`: `question` (so the caller can generate the question and spawn matching pickups BEFORE the overlay renders) and `renderChoices: false` (to suppress the answer boxes while keeping the dim/panel/prompt). The function can return `{ close }` so the caller can tear the overlay down when the correct pickup is touched. Existing callers (`mathGate.js`, `door.js`, the new `gates.js`/`enemy.js`) ignore the return value and leave `renderChoices` at its default `true`, so Phase 15 behavior is unchanged.

2. **Level-01's geometry smoke fixture must be updated for every new geometry array.** `scripts/smoke-progress.mjs` performs a recursive deep-equal of `getLevel("level-01").geometry` against a hardcoded literal. Adding `mathGates`, `enemies`, or `collectZones`/`answerPickups` to the descriptor without mirroring them into the fixture will break the LVL-02 regression smoke. This is the same companion-edit pattern as Phase 15's `doors` field.

**Primary recommendation:** Extend `challenge.js` minimally (`question` + `renderChoices` + return handle), then build `mechanics/gates.js`, `mechanics/enemy.js`, and `mechanics/collect.js` as near-verbatim copies of the `door.js` freeze-challenge-destroy-unfreeze pattern with different tags/prompts. Add the corresponding geometry arrays to `level-01.js`, consume them in `build.js`, update the smoke fixture, extend the static gates to cover the new modules, wire all three in `game.js`, and close with the mandatory real-browser boot.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Question selection / accuracy weighting | Brain (pure logic, `math/brain.js`) | — | Locked, engine-agnostic, node-importable; firewall forbids any UI-tier logic here |
| Challenge overlay render + input | UI (`ui/challenge.js`) | — | Shared seam; extended with optional `question`/`renderChoices`/return handle for MECH-03 |
| Checkpoint gate entities + collision (MECH-04) | Mechanics (`mechanics/gates.js`) | Scene (freeze/unfreeze player) | Mirrors `door.js` with `math-gate` tag and independent per-object state |
| Enemy entities + collision (MECH-05) | Mechanics (`mechanics/enemy.js`) | Scene (freeze/unfreeze player) | Blocking enemy with custom prompt, no contact damage |
| Collect-the-answer zone + pickups (MECH-03) | Mechanics (`mechanics/collect.js`) | Scene (freeze/unfreeze player), UI (`challenge.js` extension) | Owns question generation, pickup spawning, wrong-pickup feedback, and external overlay close |
| Level geometry data + builder | Level data / builder (`levels/level-01.js`, `levels/build.js`) | — | Data-driven per LVL-02; builder instantiates tagged entities |
| Difficulty pool seam (LVL-03) | Scene (`src/scenes/game.js`) | Level data (`allowedTables`) | Already wired; verify it stays wired and LEVEL_01 stays hard |
| Structural firewall / invariant enforcement | Tooling (`scripts/check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`) | — | Static per-commit gates; extend to cover new mechanic modules |

## Standard Stack

No new libraries or dependencies. This phase is a pure extension of the existing vanilla Kaplay 3001.0.19 codebase (pinned, no upgrades — Out of Scope per REQUIREMENTS.md).

### Core (existing, reused as-is)
| Module | Purpose | Why Standard (for this codebase) |
|--------|---------|-----------------------------------|
| Kaplay 3001.0.19 (`lib/kaplay.mjs`, vendored) | Engine primitives | Pinned; version-coupled code exists elsewhere |
| `src/math/brain.js` (`createBrain`) | Pure question selection / accuracy tracking | Locked algorithm; unchanged |
| `src/ui/challenge.js` (`openChallenge`) | Shared overlay seam | Extended, not redesigned |
| `src/fx.js` (`clearBurst`, `pop`) | Celebration / feedback | Reused for correct clears and wrong-pickup nudges |
| `src/config.js` (`CONFIG`) | All tunables | New `CONFIG.MATH_GATE`, `CONFIG.ENEMY`, `CONFIG.COLLECT` blocks follow precedent |

### New modules this phase creates
| Module | Purpose | Pattern source |
|--------|---------|-----------------|
| `src/mechanics/gates.js` | Multiple checkpoint gate mechanic | `src/mechanics/door.js` |
| `src/mechanics/enemy.js` | Defeat-enemy mechanic | `src/mechanics/door.js` |
| `src/mechanics/collect.js` | Collect-the-answer mechanic | `src/mechanics/door.js` + `challenge.js` extension |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending `challenge.js` with `renderChoices: false` | Build a second overlay module just for MECH-03 | Rejected — violates the "one shared challenge seam" decision and duplicates the dim/panel/anti-leak code |
| Having `collect.js` generate the question itself | Letting `challenge.js` generate it and exposing the current answer | Rejected — would require state-sharing or a callback into `challenge.js`; passing the `question` in is simpler and deterministic |
| Reusing the `door` tag for MECH-04 checkpoint gates | A distinct `math-gate` tag | CONTEXT.md explicitly requires `math-gate` tag for MECH-04; distinct tag lets gates and doors coexist and be styled differently later |

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │              game.js (scene)              │
                    │  owns: brain, player, level, HUD, save    │
                    └───────────────┬─────────────┬─────────────┘
                                     │             │
                                     │             │ buildLevel(level) creates
                                     │             │ tagged "math-gate"/"enemy"/
                                     │             │ "answer-zone"/"answer-pickup"
                                     ▼             ▼
        ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
        │ mechanics/gates.js│  │ mechanics/enemy.js│  │ mechanics/collect.js│
        │ wireGates({p,b})  │  │ wireEnemy({p,b})  │  │ wireCollect({p,b})  │
        │ freeze→challenge→│  │ freeze→challenge→│  │ freeze→challenge→  │
        │ destroy+unfreeze  │  │ destroy+unfreeze  │  │ pickup-based success │
        └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
                  │ openChallenge        │ openChallenge        │ openChallenge({question, renderChoices:false})
                  ▼                      ▼                      ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │                         ui/challenge.js (SHARED)                 │
        │  optional question in; optional suppress-answer-boxes mode       │
        │  returns { close } for external resolution (collect mechanic)    │
        └─────────────────────────────────────────────────────────────────┘
```

### Pattern 1: Collect-the-answer with external resolution
**What:** The caller (`collect.js`) generates `q = brain.nextQuestion()`, spawns in-world pickups whose values are `q.choices`, and opens the overlay with `question: q` and `renderChoices: false`. The overlay only shows the prompt. When the player touches a pickup, `collect.js` calls `brain.reportResult` itself and, on a correct pickup, calls the returned `close()` and then its own success teardown.
**Why:** This keeps the shared seam intact while moving the answer-input surface into the world for MECH-03.
**Example:**
```javascript
// In mechanics/collect.js
const q = brain.nextQuestion();
const pickups = spawnPickups(zone, q.choices);
const challenge = openChallenge({
  brain,
  question: q,
  renderChoices: false,
  prompt: `Collect the answer to ${q.a} × ${q.b}`,
  onSuccess({ table }) { /* unused here — collect handles its own resolution */ },
});
player.onCollide("answer-pickup", (pickup) => {
  const correct = pickup.value === q.answer;
  brain.reportResult(q.a, correct);
  if (correct) {
    challenge.close();
    destroyPickups(pickups);
    player.paused = false;
    onSuccess?.({ table: q.a });
  } else {
    fx.pop(pickup.pos.clone()); // brief non-punishing feedback
  }
});
```

### Pattern 2: Checkpoint gate (MECH-04)
**What:** `mechanics/gates.js` registers `player.onCollide("math-gate", (gateObj) => { ... })`. Each gate is a solid `body({ isStatic: true })` blocker that destroys on correct answer. State is a per-object `opened` Set, identical to `door.js`.
**Why:** Several independent mid-level gates are needed; a distinct `math-gate` tag lets them coexist with doors and future skinning.

### Pattern 3: Defeat enemy (MECH-05)
**What:** `mechanics/enemy.js` registers `player.onCollide("enemy", (enemyObj) => { ... })`. The enemy is a blocking entity; on correct answer it is destroyed and the player unfreezes. There is NO contact-damage branch.
**Why:** Reuses the same freeze-challenge-destroy-unfreeze contract; the absence of any damage/respawn path is the requirement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pause the world while the overlay is open | A custom freeze flag | `player.paused = true/false` | Already verified to gate onUpdate and collision spatial-hash |
| Track which gate/enemy/door is already open | Module-level state | Closure-local `Set` keyed by touched object | Anti-leak; mirrors `door.js` |
| Wrong-pickup feedback in MECH-03 | A new punishment construct (XP loss, respawn) | A brief shake/pop and re-ask | ADHD-safe mandate |
| Per-level difficulty ramp | Tweak the brain algorithm | Pass `allowedTables` into `createBrain` | Brain is LOCKED; ramp is data-only |

## Common Pitfalls

### Pitfall 1: Collect mechanic shows a different question than the spawned pickups
**What goes wrong:** `openChallenge` generates its own question because the caller didn't pass `question`, so the prompt says e.g. "6 × 7" but the spawned pickups were generated from a different `q`.
**How to avoid:** `collect.js` MUST call `brain.nextQuestion()` once, use that SAME `q` both to spawn pickup values and to pass into `openChallenge({ question: q, ... })`.

### Pitfall 2: `challenge.js` extension breaks existing callers
**What goes wrong:** Adding `renderChoices` or return value changes behavior for `mathGate.js`/`door.js`.
**How to avoid:** Default `renderChoices` to `true`; return value is optional and ignored by existing callers; keep the existing `onSuccess` callback contract unchanged.

### Pitfall 3: New geometry arrays break the LVL-02 smoke regression
**What goes wrong:** `scripts/smoke-progress.mjs` deep-equals `getLevel("level-01").geometry` against a literal that lacks the new keys.
**How to avoid:** Mirror every new geometry array into the smoke fixture's `expectedGeometry` in the same commit that adds it to `level-01.js`.

### Pitfall 4: Enemy deals contact damage or ends the run
**What goes wrong:** A naive copy of the spike handler (which calls `respawn()`) is used for the enemy.
**How to avoid:** The enemy handler must open the challenge, not call `respawn()` or any damage function. The ONLY success path is answering correctly.

### Pitfall 5: `allowedTables` accidentally made easier for level-01
**What goes wrong:** While proving LVL-03, someone changes `LEVEL_01.allowedTables` to an easier pool.
**How to avoid:** Explicitly keep `LEVEL_01.allowedTables = [6,7,8,9]`; LVL-03 proof is the wiring verification, not a level-data change.

## Code Examples

### Backward-compatible challenge.js extension
```javascript
export function openChallenge({ brain, onSuccess, prompt, question, renderChoices = true } = {}) {
  if (!brain) brain = createBrain();
  const q = question ?? brain.nextQuestion();
  const display = prompt ?? `${q.a} × ${q.b}`;
  let cleared = false;

  // ... existing dim/panel/question text ...

  let keyCtrls = [];
  if (renderChoices) {
    // ... existing answer boxes + key controllers ...
  }

  function close() {
    keyCtrls.forEach((c) => c.cancel());
    destroyAll("challenge");
  }

  return { close };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Door is the only mid-level mechanic | Three new mechanics reuse the `mechanics/` pattern | Phase 16 | `game.js` wires `wireGates`, `wireEnemy`, `wireCollect` alongside `wireDoor` |
| `challenge.js` only supports its own four on-screen choices | `challenge.js` supports caller-supplied question + suppressed choices + external `close()` | Phase 16 | Enables MECH-03 without a second overlay module |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Extending `openChallenge` with optional `question`, `renderChoices`, and a return handle is the minimal seam change for MECH-03 | Architecture Patterns, Pattern 1 | Medium — if a simpler design is chosen, the plan should still preserve one shared seam and avoid duplicating overlay code |
| A2 | Level-01 remains the only real level this phase; LVL-03 proof is wiring-only | Difficulty Ramp | Low — CONTEXT.md explicitly says authoring pools is Phase 17 |
| A3 | New mechanic modules are a727c13-clean and can be added to `check-import-safety.sh` | Tooling | Low — they follow the same factory discipline as `door.js` |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js (for `node --check` syntax gates + `check-*.sh` scripts) | All structural gates | ✓ | v22.22.2 | — |
| bash | `check-*.sh` | ✓ | (system) | — |
| A real browser (manual boot verification) | Success criteria (mandatory real-browser boot) | Assumed available | — | None — project canon treats browser boot as non-optional |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — project convention is bash structural gates + mandatory manual real-browser boot |
| Quick run command | `bash scripts/check-import-safety.sh && bash scripts/check-safety.sh` |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh && node scripts/smoke-progress.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|---------------------|
| MECH-03 | Collect-the-answer: right pickup clears, wrong pickup never punishes | structural + manual | `check-safety.sh` (no punishment), real browser |
| MECH-04 | Multiple checkpoint gates open independently on correct answer | structural + manual | `check-gate.sh` (thin caller), real browser |
| MECH-05 | Defeat enemy: correct answer removes blocking enemy, no contact damage | structural + manual | `check-safety.sh` (no punishment), real browser |
| LVL-03 | `allowedTables` flows from level data to `createBrain` | structural | grep + `node scripts/smoke-progress.mjs` |

## Security Domain

This is a fully local, offline, single-player kid's game with no network calls, no authentication, no user accounts, and no server. The only applicable ASVS category is narrow input validation: the mechanic modules introduce no free-form text input (multiple-choice / collision only), and every visual remains a Kaplay canvas primitive (no DOM sink).

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (vendored, pinned Kaplay 3001.0.19) — collision/pause semantics.
- `src/ui/challenge.js`, `src/mechanics/door.js`, `src/scenes/game.js`, `src/levels/build.js`, `src/levels/level-01.js`, `src/levels/index.js`, `src/config.js`, `src/fx.js`, `src/player.js` — existing patterns to mirror/extend.
- `scripts/check-gate.sh`, `scripts/check-import-safety.sh`, `scripts/check-safety.sh`, `scripts/smoke-progress.mjs` — gates to extend.

### Secondary (MEDIUM confidence)
None — all technical questions resolvable by direct inspection of the pinned engine source and existing codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all patterns lifted from existing working code.
- Architecture: HIGH — every mechanic mirrors `door.js`; the only extension is a small backward-compatible `challenge.js` option.
- Pitfalls: HIGH — the LVL-02 smoke companion-edit and the collect-mechanic question/pickup sync are identified by direct inspection.

**Research date:** 2026-07-03
**Valid until:** No expiry driver — tied to the pinned Kaplay 3001.0.19 vendored file and current repo layout.
