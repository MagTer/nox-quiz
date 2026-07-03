# Phase 15: Challenge Seam + Locked-Door Mechanic - Research

**Researched:** 2026-07-02
**Domain:** Kaplay 3001.0.19 in-world overlay refactor + solid-body mid-scene mechanic (vanilla JS, no external libs)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Seam Extraction & Wiring**
- `ui/challenge.js` exposes the shared component with a neutral `onSuccess`
  callback (renamed from `mathGate.js`'s `onClear` — a door doesn't "clear a
  level"). `mathGate.js` becomes a thin wrapper: it calls `challenge.js` and maps
  its own `onClear` param to the shared `onSuccess`, so the existing end-of-level
  call sites in `game.js` need NO changes (MECH-01's "behaves identically").
- Door-specific entity/collision/challenge-invocation code lives in a NEW
  `src/mechanics/door.js` module — establishes the `mechanics/` directory pattern
  Phase 16's MECH-03/04/05 (defeat-enemy, multiple gates, collect-the-answer) will
  reuse, keeping `game.js` from growing unbounded as mechanics accumulate.
- `scripts/check-gate.sh` KEEPS its filename (minimize churn) but its
  target/grep scope is re-pointed at `challenge.js`, with `mathGate.js` and
  `door.js` sanity-checked as thin callers of the one-way ui→brain firewall.
- `challenge.js` accepts an OPTIONAL prompt/framing override now (not hardcoded
  "answer this" text) — Phase 16's other mechanics (collect-the-answer,
  defeat-enemy) will want custom framing and this avoids re-touching the seam
  again next phase.

**Locked-Door Visual, Collision & Trigger**
- Visual: a solid rect (dark-grunge palette) with an "X" lock glyph overlay —
  mirrors the EXACT visual language already established on the select screen's
  locked tiles (Phase 14) so the "locked" meaning reads consistently across the
  whole game. No sprite exists yet; Phase 18 skins it for real.
- Collision: a solid `body()` blocking collider while locked (the player
  physically cannot pass) — destroyed (collider + visual removed) on a correct
  answer, satisfying MECH-02's "opens it and clears the path to the next
  section."
- Trigger: `onCollide`-touch on the door tag opens the challenge automatically —
  matches the existing goal/coin/spike pattern exactly, zero new controls to
  teach a 12-year-old (no dedicated "interact" key).
- Placement: ONE proof door is added into level-01's existing geometry this
  phase, mid-level, positioned so the mandatory real-browser boot can confirm
  MECH-02 end-to-end (blocked → open → path clear) and the overlay's pause/z-order
  behavior next to a hazard (per success criterion #3). Phase 17 designs full
  door placement across all 3-5 authored levels — this is proof-of-seam only, not
  final level design.

**Feedback & Persistence**
- Door-open reuses `fx.clearBurst()` as-is (JUICE-03 precedent) — no new
  door-specific effect this phase, keeps the "correct answer" feel consistent
  across every mechanic.
- Door removal is an instant destroy (matches the existing goal/spike/coin
  precedent) — no slide/fade transition.
- Once opened, the door stays open for the REST of the current level session
  (closure-local `doorOpened`-style flag on the scene, same anti-leak discipline
  as `coinsCollected`/`goalReached` — never a module-level `let`, never persisted
  to the save). Respawning at a checkpoint after opening the door must NEVER
  force a re-answer — that would be a punishment construct and violate the
  forgiving/no-punishment mandate (SAFE-01/GATE-04 lineage).

### Claude's Discretion
- Exact door dimensions/placement coordinates within level-01's geometry (within
  the "next to a hazard, mid-level" constraint from success criterion #3); exact
  `door.js` internal API shape beyond the locked contract above; exact CONFIG.DOOR
  tuning constants (color values, glyph size) — mirror `CONFIG.GATE`/`CONFIG.SELECT`
  conventions; whether `challenge.js`'s prompt override is a string or a richer
  options object (keep it minimal — Phase 16 can extend, not redesign).

### Deferred Ideas (OUT OF SCOPE)
- Defeat-enemy, multiple gates, collect-the-answer mechanics (Phase 16,
  MECH-03/04/05).
- Per-level difficulty ramp via allowed-tables pool (Phase 16, LVL-03).
- Full door placement across all 3-5 authored levels (Phase 17) — this phase
  places exactly one proof door in level-01.
- Real door/key art, animation (Phase 18).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| MECH-01 | A single shared in-world challenge component (forgiving, no-timer, multiple-choice) backs every math interaction; a wrong answer re-asks with no penalty and no progress lost | See Architecture Patterns (Pattern 1/2), Code Examples (shared overlay extraction skeleton), Common Pitfalls #2/#3 (structural gate must be restored+repointed), Validation Architecture map |
| MECH-02 | Locked door / key — answering correctly opens a door or bridge that gates the next section mid-level | See Architecture Patterns (Pattern 3), Code Examples (collision-triggered mechanic), Common Pitfalls #1/#4/#5 (freeze/unfreeze, destroy-ordering, no persisted flag), Don't Hand-Roll |
</phase_requirements>

## Summary

This phase has two parts that are mechanically simple but sequencing-sensitive: (1) a
pure extraction of the existing, working `mathGate.js` overlay into a shared
`ui/challenge.js` with zero behavior drift, and (2) a second caller (`mechanics/door.js`)
that reuses the extracted seam mid-level. Every visual/input/anti-leak pattern needed
already exists verbatim in the codebase (`mathGate.js`'s dual-input answer boxes,
`game.js`'s `onReachGoal()` freeze-then-bridge-call idiom, `fx.js`'s self-cleaning
tween-then-destroy idiom, `levels/build.js`'s tagged-entity-creation idiom). There is
no new library, no new engine primitive, and no new async pattern to learn — this is
disciplined mechanical extraction plus one new solid-collider entity.

Two things surfaced during research that are NOT obvious from the phase description and
must be in the plan:

1. **`scripts/check-gate.sh` does not currently exist in the live tree.** It was
   archived wholesale in commit `4e02732` ("chore: archive v3.0 phase directories")
   along with the rest of the `10-math-gate-integration-*` phase directory. "Re-point
   check-gate.sh" is therefore not an edit to an existing file — it requires **restoring
   the archived script to `scripts/check-gate.sh`** (or rewriting it fresh at that path)
   before its target/grep-scope can be repointed at `challenge.js`. The archived original
   is a good source to restore and edit; see `.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` in this repo.

2. **`door.js`'s success handler MUST explicitly un-pause the player; `onReachGoal()`'s
   pattern does NOT do this and must not be copied verbatim.** `onReachGoal()` freezes
   the player (`player.paused = true`) and never unfreezes it because the level is over
   (the scene transitions away via `go("select")`). The door is a MID-level gate — after
   it opens, gameplay continues in the SAME scene, so if `door.js` mirrors the freeze
   half of the pattern without adding `player.paused = false` in its own `onSuccess`
   handler, the player is permanently soft-locked immediately after every level's first
   correctly-answered door. This is the single highest-risk pitfall in this phase and is
   invisible to every static gate (`check-gate.sh`, `check-safety.sh`,
   `check-import-safety.sh`) — it only shows up in the mandatory real-browser boot.

**Primary recommendation:** Extract `challenge.js` as a literal lift of `mathGate.js`'s
body with only the callback name changed (`onClear` → `onSuccess`) and an added optional
prompt-override parameter; make `mathGate.js` a 3-line wrapper; build `door.js` by
copying `onReachGoal()`'s freeze+bridge-call shape but explicitly re-enabling
`player.paused = false` and destroying the door's collider+visual inside the success
callback, before restoring `scripts/check-gate.sh` from its archived source and
re-pointing it at `challenge.js`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Question selection / accuracy weighting | Brain (pure logic, `math/brain.js`) | — | Locked, engine-agnostic, node-importable; firewall forbids any UI-tier logic here |
| Challenge overlay render + input (mouse+keys) + forgiving retry | UI (`ui/challenge.js`) | — | In-world Kaplay canvas objects; screen-space fixed()+z() overlay; owns input while open |
| End-of-level wiring (thin wrapper preserving `onClear` contract) | UI (`ui/mathGate.js`) | — | Existing `game.js` call site must not change; wrapper absorbs the seam |
| Door entity (visual, solid collider, collision trigger, challenge invocation) | Mechanics (`mechanics/door.js`) | Scene (freeze/unfreeze player) | New `mechanics/` tier — collision-triggered game logic that bridges to the UI-tier challenge, mirrors `onReachGoal()`'s scene-level pattern but owns its own success/freeze contract |
| Level geometry data (door placement) | Level data (`levels/level-01.js`) | Builder (`levels/build.js`) | Data-driven per LVL-02; builder instantiates tagged entities from a `doors` array, same as coins/spikes/goal |
| Structural firewall / invariant enforcement | Tooling (`scripts/check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`) | — | Static per-commit gates; no JS test framework in this project (locked project convention) |

## Standard Stack

No new libraries or dependencies. This phase is a pure extension of the existing vanilla
Kaplay 3001.0.19 codebase (pinned, no upgrades — Out of Scope per REQUIREMENTS.md).

### Core (existing, reused as-is)
| Module | Purpose | Why Standard (for this codebase) |
|--------|---------|-----------------------------------|
| Kaplay 3001.0.19 (`lib/kaplay.mjs`, vendored) | Engine: `add`, `area`, `body`, `destroy`, `onCollide`, `fixed`, `z`, `onKeyPress`, `box.onClick` | Pinned; version-coupled code exists elsewhere (Rect class, setCamPos) — no upgrade path this phase |
| `src/math/brain.js` (`createBrain`) | Pure question selection / accuracy tracking | Locked algorithm (REQUIREMENTS Out of Scope); `challenge.js` consumes it exactly as `mathGate.js` does today |
| `src/fx.js` (`clearBurst`) | Door-open celebration | CONTEXT-locked: reused AS-IS, no new fx function this phase |
| `src/config.js` (`CONFIG`) | All tunables | New `CONFIG.DOOR` block follows the `CONFIG.GATE`/`CONFIG.SELECT` precedent |

### New modules this phase creates
| Module | Purpose | Pattern source |
|--------|---------|-----------------|
| `src/ui/challenge.js` | The shared overlay (extracted from `mathGate.js`) | Direct lift of `mathGate.js` body (231 lines), see Code Examples |
| `src/mechanics/door.js` | Door entity + collision handler + challenge invocation | `onReachGoal()` in `game.js` (freeze + single bridge call), see Code Examples |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `player.paused = true/false` freeze pattern | A custom `frozen` flag gating `player.onUpdate` manually | Rejected — `player.paused` already correctly halts BOTH the player's own `onUpdate` (movement) AND its participation in the collision spatial-hash (verified in engine source, see Common Pitfalls); a hand-rolled flag would have to reimplement that collision-exclusion behavior and risks missing it |
| Destroying the door via `destroy(doorObj)` | A "locked"→"open" sprite-swap keeping the collider alive but non-solid | CONTEXT.md decision: instant destroy (collider + visual), matching goal/spike/coin precedent — no slide/fade transition this phase |
| `mechanics/` as a new top-level directory | Putting `door.js` directly in `scenes/` or `ui/` | CONTEXT.md decision: establishes the pattern Phase 16's 3 more mechanics reuse; keeps `game.js` from growing unbounded |

**Installation:** None — no new files to fetch/install; only new source files to author inside the existing structure.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external packages (no `npm install`, no new
vendored files). The project's hard constraint (`CLAUDE.md` / REQUIREMENTS.md Out of
Scope) is zero new runtime dependencies for the entire v4.0 milestone — every capability
is native to the already-vendored, pinned Kaplay 3001.0.19 bundle. No package-legitimacy
gate runs this phase.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │              game.js (scene)              │
                    │  owns: brain, player, level, HUD, save    │
                    └───────────────┬─────────────┬─────────────┘
                                     │             │
                     onReachGoal()   │             │  buildLevel(level) creates
                     (existing,      │             │  tagged "door" entities from
                     UNCHANGED)      │             │  level.geometry.doors[]
                                     ▼             ▼
                    ┌────────────────────┐  ┌──────────────────────────┐
                    │  ui/mathGate.js     │  │  mechanics/door.js        │
                    │  (thin wrapper)     │  │  player.onCollide("door") │
                    │  onClear -> onSuccess│  │  freeze -> challenge ->  │
                    └──────────┬──────────┘  │  destroy+unfreeze on win │
                               │              └──────────┬────────────────┘
                               │  openChallenge({...})   │  openChallenge({...})
                               ▼                          ▼
                    ┌─────────────────────────────────────────┐
                    │           ui/challenge.js (SHARED)        │
                    │  1. brain.nextQuestion() -> q              │
                    │  2. render fixed()+z(9990+) overlay        │
                    │     (dim, panel, prompt, N answer boxes)   │
                    │  3. dual input: box.onClick() + onKeyPress │
                    │  4. choose(i):                             │
                    │       wrong -> tint+shake, SAME q, re-ask   │
                    │       correct -> close() + onSuccess()      │
                    └──────────────────┬──────────────────────────┘
                                       │ brain.reportResult(q.a, correct)
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │          math/brain.js (LOCKED, pure)      │
                    │  nextQuestion() / reportResult()           │
                    └─────────────────────────────────────────┘

  Collision exclusion while overlay is open (verified in engine source):
  player.paused=true  =>  player excluded from Kaplay's per-frame collision
  spatial-hash build AND from its own onUpdate/body-gravity integration.
  No re-entrant onCollide("door") can fire against a paused player, and the
  player cannot fall/move, even though it may still visually overlap the
  (not-yet-destroyed) door collider.
```

### Recommended Project Structure
```
src/
├── ui/
│   ├── challenge.js     # NEW — the shared overlay (extracted core logic)
│   ├── mathGate.js       # MODIFIED — thin wrapper calling challenge.js
│   └── hud.js             # unchanged
├── mechanics/             # NEW directory — Phase 16 adds enemy.js, gates.js, pickup.js here
│   └── door.js             # NEW — door entity + collision + challenge invocation
├── levels/
│   ├── build.js            # MODIFIED — consumes a new `doors` array from level data
│   ├── level-01.js          # MODIFIED — adds one `doors: [{x, y, w, h}]` entry mid-level
│   └── index.js              # unchanged
├── config.js                # MODIFIED — adds CONFIG.DOOR block
└── scenes/
    └── game.js                # unchanged call site for the end-of-level gate (MECH-01 proof)
```

### Pattern 1: Shared overlay with optional prompt override
**What:** `challenge.js` exposes `openChallenge({ brain, onSuccess, prompt })` where
`prompt` is an OPTIONAL string that overrides the default `"${q.a} × ${q.b}"` display.
**When to use:** Every math interaction in the game (end-of-level gate, locked door;
Phase 16's collect-the-answer and defeat-enemy will pass their own `prompt` framing).
**Example:**
```javascript
// Source: derived from src/ui/mathGate.js:65 (display construction) — direct lift
export function openChallenge({ brain, onSuccess, prompt } = {}) {
  if (!brain) brain = createBrain();
  const q = brain.nextQuestion();
  const display = prompt ?? `${q.a} × ${q.b}`; // optional override, minimal (string, not an options object — CONTEXT discretion: keep minimal, Phase 16 extends)
  // ...rest is verbatim mathGate.js body, with onClear renamed onSuccess throughout
}
```
Keep the override as a plain string (per CONTEXT.md's discretion note: "whether
`challenge.js`'s prompt override is a string or a richer options object — keep it
minimal, Phase 16 can extend, not redesign"). Do not add a full options object this
phase — that is scope creep against the explicit discretion note.

### Pattern 2: Thin-wrapper preservation of an existing external contract
**What:** `mathGate.js` keeps its exact public signature (`openMathGate({ brain, onClear })`)
so `game.js`'s call site needs zero changes — it just forwards to `challenge.js`.
**When to use:** Any time an internal implementation is extracted but an external call
site's contract must not change (MECH-01's "behaves identically").
**Example:**
```javascript
// Source: derived pattern — thin adapter over the extracted seam
import { openChallenge } from "./challenge.js";

export function openMathGate({ brain, onClear } = {}) {
  openChallenge({ brain, onSuccess: onClear }); // name-mapped, zero behavior change
}
```
Note: `mathGate.js`'s own "gate-cleared" LEVEL CLEAR celebration (the persistent
neon-green banner, tagged `"gate-cleared"`) is END-OF-LEVEL-SPECIFIC UI, not shared
overlay logic — CONTEXT.md's phase boundary does not ask for this banner to move into
`challenge.js`. Two structurally sound options exist and are BOTH consistent with
"mathGate.js becomes a thin caller": (a) keep the celebration construction inside
`mathGate.js`'s wrapper, appended after `openChallenge(...)` fires its `onSuccess`
callback (i.e. `mathGate.js`'s own `onClear` wrapper renders the banner before calling
the scene's real `onClear`); or (b) leave `challenge.js`'s `onSuccess` free of any
celebration UI entirely and have `mathGate.js`'s `onClear` forward do the banner. Either
keeps `challenge.js` free of end-of-level-specific concerns (it does NOT know about
"LEVEL CLEAR" — a door doesn't clear a level) while preserving pixel-identical
end-of-level behavior. The planner should pick ONE and state it explicitly as a task
verification point (byte-for-byte requires the banner still renders and is still
tagged `"gate-cleared"`, not `"math-gate"`, so `challenge.js`'s own close()
`destroyAll("math-gate")` doesn't wipe it if `challenge.js` uses a different tag).

**Naming caution:** if `challenge.js` uses a DIFFERENT tag than `"math-gate"` for its
own overlay objects (e.g. `"challenge"` — recommended, since the tag is now
mechanic-agnostic), `mathGate.js`'s "gate-cleared" banner tag can stay `"gate-cleared"`
unchanged, but the interactive overlay's `destroyAll(...)` call inside `challenge.js`'s
`close()` must reference whatever NEW tag `challenge.js` actually uses — audit
`check-gate.sh`'s greps (which currently assert on `mathGate.js`'s literal tag/symbol
names) accordingly when re-pointing them (see Common Pitfalls).

### Pattern 3: Collision-triggered mechanic with freeze/unfreeze (NEW for this phase)
**What:** `door.js` mirrors `onReachGoal()`'s freeze-then-bridge-call shape but is a
MID-level mechanic, so it must UNDO the freeze on success (unlike the end-of-level gate).
**When to use:** Any mechanic (door, and Phase 16's gates/enemy) that pauses play for a
challenge but expects gameplay to CONTINUE afterward in the same scene.
**Example:**
```javascript
// Source: derived from src/scenes/game.js onReachGoal() (lines 159-223) — adapted, NOT copied verbatim
export function wireDoor(doorObj, { player, brain }) {
  let opened = false; // closure-local fire-once latch (anti-leak: never module-level)

  player.onCollide("door", () => {
    if (opened) return;
    // NOTE: do NOT set `opened = true` here yet if a wrong answer must allow the
    // player to walk away and re-touch the door later without being stuck reopening
    // the SAME q — actually the challenge itself is fire-once by CORRECT answer only,
    // so latch AFTER success, matching the goal pattern's placement.
    player.vel = vec2(0);
    player.paused = true; // freeze — verified: this ALSO excludes player from the
                            // collision spatial-hash, so no re-entrant "door" collide
                            // fires while paused, even while still overlapping doorObj.

    openChallenge({
      brain,
      onSuccess() {
        opened = true; // fire-once latch — mirrors goalReached's placement
        fx.clearBurst(); // CONTEXT-locked: reuse as-is, no new fx
        destroy(doorObj); // instant removal — collider AND visual (single tagged entity)

        // CRITICAL — the one thing onReachGoal()'s pattern does NOT do, because the
        // end-of-level flow transitions scenes instead. A door is mid-level: gameplay
        // must resume in the SAME scene, so the freeze must be explicitly undone here.
        player.paused = false;
      },
    });
  });
}
```

### Anti-Patterns to Avoid
- **Copying `onReachGoal()` verbatim into `door.js`:** it never unpauses the player —
  doing so soft-locks the game after every door (see Summary finding #2).
- **Giving `challenge.js` knowledge of "level clear" vocabulary:** the shared component
  must stay mechanic-agnostic (CONTEXT.md: "a door doesn't clear a level" — hence the
  `onSuccess` rename). Any LEVEL-CLEAR-specific text/banner belongs in `mathGate.js`'s
  wrapper layer, not `challenge.js`.
- **A per-tile collider for the door instead of one merged `body()` entity:** unlike
  floor runs (which need seam-stick avoidance), the door is a single small entity —
  `levels/build.js`'s merged-floor pattern does not apply here; one `add([rect(...),
  area(), body({ isStatic: true }), "door"])` per door is correct and matches how goal/
  spike/coin are each single tagged entities already.
- **Forgetting `area()` on the door's clickable/collidable rect:** not applicable here
  (the door is `onCollide`-triggered, not `onClick`-triggered — CONTEXT.md's Trigger
  decision is explicit: "zero new controls to teach a 12-year-old, no dedicated
  'interact' key"). `area()` IS still required for the `body()` collider AND for
  `onCollide` to fire at all — Kaplay's `onCollide`/`body()` both depend on the entity
  having an `area()` component, same as every existing solid ("ground") and
  trigger-only ("goal", "spike", "coin") entity in `build.js`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pausing player + suppressing further collision resolution while the overlay is open | A custom `if (frozen) return` guard inside every onCollide handler across every mechanic | `player.paused = true` | Verified in the vendored engine source: setting `paused` on a game object gates BOTH its own registered event listeners (onUpdate, its area's fixedUpdate) AND its participation in the global collision spatial-hash build (`Q.c("area") && !Q.paused` guard in the broad-phase pass). A hand-rolled per-handler guard would have to reimplement this and is easy to miss on a future mechanic |
| Detecting "is this the same touch session" for fire-once collision handling | A manual distance/overlap-frame counter | Kaplay's built-in `onCollide` (as opposed to `onCollideUpdate`) | `onCollide` already only fires once per continuous overlap "session" internally (an `e[o.id]` presence cache cleared by `collideEnd` on frame-exit) — layering a closure-local `opened`/`goalReached` latch on top (as the codebase already does) is the correct BELT-AND-BRACES pattern, not a replacement for one or the other |
| Self-cleaning celebration effect on door-open | A new door-specific particle/flash function | `fx.clearBurst()` as-is | CONTEXT.md decision: JUICE-03 precedent, keeps "correct answer" feel consistent across every mechanic — this phase adds NO new fx function |

**Key insight:** every "hard part" of this phase (freeze semantics, fire-once collision,
self-cleaning fx) is already a solved, verified problem elsewhere in this codebase or in
the pinned engine itself. The actual net-new code this phase writes is small: one prompt
parameter, one new entity type, one collision wiring function, and one config block.

## Common Pitfalls

### Pitfall 1: Door stays frozen forever after opening (soft-lock)
**What goes wrong:** Player answers correctly, the door is destroyed, but
`player.paused` is never reset to `false`, so the player can no longer move, jump, or
fall for the rest of the level.
**Why it happens:** The only existing precedent in this codebase for the freeze pattern
(`onReachGoal()`) never unfreezes, because it is followed by a scene transition
(`go("select")`) — a naive "mirror the existing pattern" instinct will copy the freeze
half and miss that the unfreeze half doesn't exist yet because it was never needed.
**How to avoid:** `door.js`'s `onSuccess` handler MUST include `player.paused = false`
(see Code Example, Pattern 3). Add this as an explicit plan verification step, not just
an implicit "mirror the existing pattern" instruction.
**Warning signs:** In the mandatory real-browser boot (success criterion #3/#4), after
answering the door's question correctly, confirm the player can still move
LEFT/RIGHT/JUMP. A visually-open door with a stuck player is the signature of this bug.

### Pitfall 2: `check-gate.sh` doesn't exist at `scripts/check-gate.sh` yet
**What goes wrong:** A plan task that says "edit scripts/check-gate.sh to point at
challenge.js" will fail — there is nothing at that path to edit.
**Why it happens:** The script was authored in Phase 10 at
`.planning/phases/10-math-gate-integration-.../scripts/check-gate.sh` and the ENTIRE
v3.0 phase-directory tree (including that script) was archived in commit `4e02732`
("chore: archive v3.0 phase directories") to
`.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh`.
It was never copied to the top-level `scripts/` directory the way
`check-import-safety.sh` and `check-safety.sh` were (those two DO live in
top-level `scripts/` today — confirmed).
**How to avoid:** The plan's first `check-gate.sh` task must CREATE
`scripts/check-gate.sh` fresh (using the archived file as a source/reference), targeting
`src/ui/challenge.js` instead of `src/ui/mathGate.js`, and additionally sanity-check that
`mathGate.js` and `door.js` are thin/well-formed callers (per CONTEXT.md's decision).
Do not phrase this as "re-point" in a way that implies an in-place edit of an existing
tracked file.
**Warning signs:** `bash scripts/check-gate.sh` returning "No such file or directory".

### Pitfall 3: `check-import-safety.sh`'s scoped scene list and engine-global vocabulary don't cover `mechanics/door.js`
**What goes wrong:** `check-import-safety.sh`'s Section 2 negative a727c13 scan is
currently HARD-SCOPED to `["src/scenes/title.js", "src/scenes/select.js"]` only — it does
NOT scan `game.js`, `mathGate.js`, or (today) anything in a `mechanics/` directory that
doesn't exist yet. A top-level engine-global leak in `door.js` or `challenge.js` would
pass this gate silently.
**Why it happens:** The gate's file list was written in Phase 14 before `mechanics/`
existed and is a literal array, not a glob.
**How to avoid:** The plan should either (a) add `src/mechanics/door.js` and
`src/ui/challenge.js` to `check-import-safety.sh`'s Section 0/2 scanned-file lists (both
already discipline-follow a727c13 per CONTEXT.md's "same discipline as every other
Phase 13/14 module"), or (b) explicitly accept that these two new modules are verified
by manual code review + the mandatory real-browser boot instead of this specific static
gate, and say so in the plan. Given the gate exists specifically to catch this class of
bug BEFORE a browser boot, extending its scanned-file list (option a) is the stronger,
lower-cost choice — a one-line addition to an existing `for f in ...` loop.
**Warning signs:** A module-top-level `add(...)`/`body(...)` call in `door.js` that
`check-import-safety.sh` reports PASS on anyway.

### Pitfall 4: Destroying the door while the player is still overlapping it, then unpausing, causes an immediate re-trigger
**What goes wrong:** If `door.js`'s `onSuccess` unpauses the player BEFORE (or in the
same synchronous tick without) the door being destroyed, or if `destroy(doorObj)` is
somehow skipped/ordered after the unpause, the player — now un-paused and still
physically overlapping the door's collider bounding box — could immediately re-enter
the collision spatial-hash and re-trigger `onCollide("door", ...)` on the very next
frame, reopening the (now stale) challenge.
**Why it happens:** `onCollide`'s fire-once-per-touch-session cache is keyed by
continuously overlapping IDs; unpausing without first removing the door object leaves
both conditions (still touching + no longer paused) true simultaneously for one frame.
**How to avoid:** Order matters within `onSuccess`: `destroy(doorObj)` MUST happen
BEFORE (or in the same synchronous callback tick as, but never after) `player.paused =
false`. The Code Example in Pattern 3 already orders these correctly (destroy, then
unpause) — the plan should preserve that order and the fire-once `opened` latch as a
second line of defense (the latch guards even if ordering is ever changed later).
**Warning signs:** The challenge overlay reopens for a split second immediately after
the door visually disappears, during the real-browser boot.

### Pitfall 5: `doorOpened` flag leaking across a checkpoint respawn or accidentally becoming persisted
**What goes wrong:** If the "door stays open for the rest of the level" flag is
implemented as anything other than a closure-local `let` inside `game.js`'s (or
`door.js`'s) scene-scoped state — e.g. stored on the level DATA object, or written into
`progress.serialize()` — it either leaks across level replays (module-level `let`
anti-pattern, RESEARCH Pitfall 5 lineage) or gets persisted to the save (violating
CONTEXT.md's explicit "never persisted to the save" decision and SAVE-05/06/07's
"run/session state is NEVER serialized" invariant already enforced for
`coinsCollected`/`goalReached`).
**Why it happens:** The door object itself is destroyed on open, so there's a temptation
to store "was this door opened" somewhere that outlives the object — the WRONG place to
reach for is level data or the save.
**How to avoid:** The door staying open is naturally satisfied by `destroy(doorObj)`
itself — there is no separate boolean needed AT ALL if the door's solid collider and
visual are truly gone; "respawning at a checkpoint" only repositions the player
(`reset()`), it never calls `buildLevel()` again or otherwise recreates entities, so a
destroyed door simply never reappears for the rest of the scene's lifetime. The `opened`
/fire-once latch in the Code Example exists ONLY to guard against a same-frame
double-trigger of `onSuccess` (Pitfall 4's concern), not to gate "is the door still
there" — that's already physically true via `destroy()`. Do not add a second
persistence mechanism for "door open" state.
**Warning signs:** A `doorsOpened` array/set appearing in `progress.serialize()`'s output
or in `level-01.js`'s data.

## Code Examples

Verified patterns from the actual pinned engine source (`lib/kaplay.mjs`,
Kaplay 3001.0.19) and this codebase:

### Collision spatial-hash exclusion for paused objects (the mechanism behind Pattern 3's safety claim)
```javascript
// Source: lib/kaplay.mjs (minified; deobfuscated function name ye — the per-frame
// collision spatial-hash builder, walking a.game.root.children recursively).
// Verified 2026-07-02 against the exact vendored/pinned file in this repo.
//
// function ye(Q) {
//   ...
//   if (Q.c("area") && !Q.paused) {           // <-- paused objects are SKIPPED entirely
//     const bbox = Q.worldArea().bbox();
//     // ...populate spatial hash cells with Q...
//     for (const candidate of cell) {
//       if (candidate.paused || !candidate.exists() || alreadySeen.has(candidate.id))
//         continue;                            // <-- paused candidates also skipped
//       // ...collision test + "collideUpdate"/"collide" trigger...
//     }
//   }
//   Q.children.forEach(ye);
// }
```
**Implication for this phase:** `player.paused = true` (already the exact pattern
`onReachGoal()` uses) is sufficient, on its own, to prevent the door's `onCollide`
handler from re-firing while the challenge overlay is open — no additional guard is
needed inside `door.js`'s collision callback beyond the existing fire-once `opened` latch.

### Per-object event gating for `paused` (confirms body()/onUpdate freeze correctness)
```javascript
// Source: lib/kaplay.mjs — the generic event-registry wrapper every onUpdate/onCollide/
// etc. handler is built from (deobfuscated names for clarity):
// class EventList {
//   add(handler) {
//     const wrapped = (...args) => { if (!this.paused) return handler(...args); };
//     ...
//   }
// }
```
**Implication:** `player.paused = true` gates the player's OWN `onUpdate` (movement +
`body()`'s gravity/velocity integration hook), which is exactly why `reset()`/
`onReachGoal()` already rely on it to fully freeze the player. This is existing,
already-verified codebase behavior — cited here because `door.js` depends on the SAME
guarantee holding for a SECOND caller.

### Shared overlay extraction skeleton
```javascript
// Source: direct structural lift of src/ui/mathGate.js (231 lines) — rename onClear
// to onSuccess throughout, add an optional `prompt` param, keep every other line
// (dual-input answer boxes, fire-once `cleared` latch, wrong-answer tint+shake,
// close()'s keyCtrls.cancel()+destroyAll(tag) — same anti-leak contract) unchanged.
export function openChallenge({ brain, onSuccess, prompt } = {}) {
  if (!brain) brain = createBrain();
  const q = brain.nextQuestion();
  const display = prompt ?? `${q.a} × ${q.b}`;
  let cleared = false;
  // ...identical overlay construction, choose(i), close() as mathGate.js...
  // wrong: box.color = red; shake(6); return; (SAME question, no penalty)
  // correct: cleared = true; close(); onSuccess?.({ table: q.a });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| One math-gate consumer (`game.js`'s end-of-level goal only) | Shared `challenge.js` seam with 2 consumers (end-of-level + door), extensible to 5 by end of Phase 16 | This phase (15) | `mathGate.js` becomes a 3-line adapter; all new mechanics import `challenge.js` directly, never `mathGate.js` |
| `scripts/check-gate.sh` targets `src/ui/mathGate.js` and lives only in an archived phase directory | Must be restored to `scripts/check-gate.sh` (top level) and re-targeted at `src/ui/challenge.js` | This phase (15) | The gate must be recreated at the live path, not merely edited |

**Deprecated/outdated:** None — no engine version change, no removed API. This is a
pure refactor within the same pinned engine version.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `mathGate.js`'s own "gate-cleared" celebration banner logic should be kept in `mathGate.js`'s wrapper layer rather than moved into `challenge.js` | Architecture Patterns, Pattern 2 | If the planner instead moves the celebration into `challenge.js`, a door-open would ALSO render "LEVEL CLEAR" text unless explicitly special-cased — CONTEXT.md doesn't fully disambiguate this, though the "a door doesn't clear a level" framing (which motivated the `onSuccess` rename) strongly implies the celebration text stays end-of-level-specific. Low risk since success criterion #1's "byte-for-byte end-of-level behavior preserved" would catch a regression in the mandatory browser boot either way |
| A2 | The door's solid collider should be a single `body({ isStatic: true })` rect entity (not a merged-run pattern like floors) | Architecture Patterns, Anti-Patterns | Low risk — this mirrors the goal/spike/coin single-entity precedent exactly; the merged-floor pattern in `build.js` is explicitly for CONTIGUOUS floor runs, which a door is not |
| A3 | `check-import-safety.sh`'s scanned-file list should be extended to include `door.js`/`challenge.js` rather than left as-is | Common Pitfalls, Pitfall 3 | Medium risk if skipped — a real a727c13 regression in either new module would pass this specific gate silently and only surface at the mandatory real-browser boot (which IS still mandatory this phase, so it would still be caught, just later/more expensively) |

**Note on confidence:** the Kaplay-engine-mechanics claims (collision spatial-hash
pause-exclusion, per-object event gating) are tagged `[VERIFIED: lib/kaplay.mjs source
inspection]` — this is HIGHER confidence than a web search or official docs lookup would
be, because it was read directly from the exact pinned/vendored file this project ships
(3001.0.19), eliminating any version-drift risk between docs and the actual running code.

## Open Questions

1. **Where exactly does the "gate-cleared" LEVEL CLEAR banner logic live post-extraction?**
   - What we know: it must keep rendering identically for end-of-level (success criterion #1).
   - What's unclear: whether the planner puts it in `mathGate.js`'s `onClear` forward-wrapper
     (recommended) or leaves a hook inside `challenge.js` that only `mathGate.js` uses.
   - Recommendation: keep it in `mathGate.js`'s wrapper (Pattern 2, option a/b) — verify via
     the mandatory browser boot that both the door (no LEVEL CLEAR text) and the end gate
     (LEVEL CLEAR text still there) behave correctly.

2. **Exact door placement coordinates in `level-01.js`.**
   - What we know: CONTEXT.md leaves this to Claude's discretion, constrained to
     "mid-level, next to a hazard" so success criterion #3 (pause/z-order confirmed next
     to a hazard) can be verified.
   - What's unclear: the precise `{x, y, w, h}` — this is a planning/implementation
     decision, not a research gap.
   - Recommendation: place it near the existing spike at `x: 1520` (level-01's SECOND
     spike, mid-level, well after the opening run) so success criterion #3's "next to a
     hazard" is unambiguous; leave exact `w`/`h` for CONFIG.DOOR tuning constants.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js (for `node --check` syntax gates + `check-*.sh` scripts) | All structural gates | ✓ | v22.22.2 | — |
| bash | `check-gate.sh`/`check-import-safety.sh`/`check-safety.sh` | ✓ | (system) | — |
| A real browser (manual boot verification) | Success criteria #3/#4 (mandatory real-browser boot) | Assumed available (developer machine) | — | None — this project's canon (STATE.md Critical Pitfall #2) treats a browser boot as NON-OPTIONAL; no automated fallback exists or should be substituted |

**Missing dependencies with no fallback:** None currently known.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — project convention is bash structural gates + a mandatory manual real-browser boot (no JS test framework, confirmed project-wide) |
| Config file | none |
| Quick run command | `bash scripts/check-import-safety.sh && bash scripts/check-safety.sh` |
| Full suite command | `bash scripts/check-gate.sh && bash scripts/check-import-safety.sh && bash scripts/check-safety.sh` (after `check-gate.sh` is restored/repointed) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|--------------|
| MECH-01 | Shared `challenge.js` backs every math interaction; wrong answer re-asks, no penalty; `mathGate.js` is a thin caller; end gate behaves identically | structural (grep) + manual | `bash scripts/check-gate.sh` (repointed) | ❌ Wave 0 — must restore+repoint the script itself first |
| MECH-01 | End-of-level gate still works byte-for-byte after extraction | manual (real browser) | N/A — mandatory human boot | ✅ existing level to test against (level-01) |
| MECH-02 | Door opens on correct answer, never punishes/locks-out on wrong, clears the path | manual (real browser) | N/A — mandatory human boot, blocked → answer → open → path clear | ❌ Wave 0 — the door entity itself doesn't exist yet |
| MECH-02 | Overlay pauses world (no move/fall/hurt), owns input, renders above world+parallax, verified next to a hazard | manual (real browser) | N/A — visual/behavioral confirmation only | ❌ Wave 0 — no automated z-order/pause test exists in this no-framework project |
| — | `check-import-safety.sh` covers the two new modules | structural (grep) | `bash scripts/check-import-safety.sh` | ❌ Wave 0 — file list needs extending (Pitfall 3) |
| — | `check-safety.sh` (no-timer/forgiving) still passes across the whole tree including new modules | structural (grep) | `bash scripts/check-safety.sh` | ✅ already whole-tree scoped, no change needed |

### Sampling Rate
- **Per task commit:** `bash scripts/check-import-safety.sh && bash scripts/check-safety.sh`
- **Per wave merge:** full suite (all three `check-*.sh` scripts) once `check-gate.sh` exists
- **Phase gate:** full suite green PLUS the mandatory real-browser boot (success criteria
  #3/#4 are explicitly manual-verification requirements per the phase description — this
  is not a gap, it is the established project convention, STATE.md Critical Pitfall #2)

### Wave 0 Gaps
- [ ] `scripts/check-gate.sh` — does not exist at the live path; must be restored from
      the archived Phase 10 copy and re-targeted at `src/ui/challenge.js` (Pitfall 2)
- [ ] `scripts/check-import-safety.sh` — Section 0/2 file lists need `src/mechanics/door.js`
      and `src/ui/challenge.js` added, or an explicit plan decision to rely on manual
      review + browser boot for these two files instead (Pitfall 3)
- [ ] No automated fixture/harness exists for "player cannot move while overlay is open" or
      "z-order places overlay above a hazard" — these remain real-browser-boot-only checks
      by established project convention; do not attempt to fabricate a headless DOM/canvas
      test for them (this project deliberately has none)

## Security Domain

This is a fully local, offline, single-player kid's game with no network calls, no
authentication, no user accounts, and no server — the ASVS categories that apply to
web-app auth/session/access-control are not applicable to this phase's scope.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | N/A — no accounts, local single-user |
| V3 Session Management | No | N/A — no server sessions |
| V4 Access Control | No | N/A — no multi-user access boundary |
| V5 Input Validation | Yes (narrow) | Bounds-checked input surface: `choose(i)` already guards `i < 0 \|\| i >= q.choices.length` (existing `mathGate.js` pattern, must be preserved verbatim in `challenge.js`); the door introduces NO new user-text input (no typing, no free-form fields — multiple-choice only, per project canon) |
| V6 Cryptography | No | N/A — no secrets, no crypto in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| DOM/markup injection via question/answer text | Tampering/Info Disclosure | N/A by construction — every visual is a Kaplay canvas `text()`/`rect()` object, never `innerHTML`/`document.*`; `check-gate.sh`'s existing negative grep (`innerHTML\|document\.\|alert\(`) already enforces this and must be preserved when the gate is re-pointed at `challenge.js` |
| Out-of-bounds array access from malformed/tampered index (mouse/key input) | Denial of Service (local crash) | The existing `i < 0 \|\| i >= q.choices.length` guard in `choose(i)` — preserve verbatim in the extraction |

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (vendored, pinned Kaplay 3001.0.19, sha256-recorded per STATE.md) —
  read directly for collision spatial-hash pause-exclusion behavior and per-object event
  `paused` gating. This is the single most authoritative source available for this exact
  pinned version — more authoritative than external docs, which may describe a different
  version.
- `src/ui/mathGate.js`, `src/scenes/game.js`, `src/fx.js`, `src/config.js`,
  `src/levels/build.js`, `src/levels/level-01.js`, `src/levels/index.js`,
  `src/player.js`, `src/scenes/select.js`, `src/main.js` — read in full for existing
  patterns this phase must mirror or extend.
- `scripts/check-import-safety.sh`, `scripts/check-safety.sh`,
  `.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` —
  read in full to understand the current and archived structural-gate contracts.
- `git log --all -- '*check-gate.sh'` — confirmed the script's only history is authored
  in commit `759e913` then archived wholesale in commit `4e02732`; no top-level copy
  exists in the current working tree.

### Secondary (MEDIUM confidence)
None used this phase — no web search or external documentation was needed; all
technical questions were resolvable by direct inspection of the pinned vendored engine
source and the existing, already-verified codebase patterns.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all patterns lifted from existing, working, already-shipped code
- Architecture: HIGH — every pattern (freeze, fire-once, self-cleaning fx, tagged-entity creation) is a direct, verified lift from code already in this repo
- Pitfalls: HIGH — the two highest-risk findings (missing check-gate.sh, missing unfreeze) were discovered via direct filesystem/git verification and direct engine-source reading, not inference

**Research date:** 2026-07-02
**Valid until:** No expiry driver — this research is tied to the pinned Kaplay
3001.0.19 vendored file and this repo's current file layout, both of which are stable
until an explicit future decision to upgrade or restructure.
