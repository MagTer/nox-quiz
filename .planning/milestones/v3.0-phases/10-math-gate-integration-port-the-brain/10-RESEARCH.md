# Phase 10: Math-Gate Integration (Port the Brain) - Research

**Researched:** 2026-06-25
**Domain:** Pure-JS algorithm extraction (multiplication-question brain) + Kaplay 3001 in-world UI overlay + single-bridge integration
**Confidence:** HIGH

## Summary

This phase has two halves and one seam. The first half — the math brain — is a **verbatim port**, not a design problem: the weighted selector, distractor generator, and EWMA accuracy weighting already exist, fully working, in `archive/math-lab.html` (lines 911–1030 + the `PlayerState` EWMA core at 663–711 + `CONFIG` at 604–619). The job is to lift `QuestionSelector` and the in-memory accuracy slice into a pure ES module `src/math/brain.js` with **zero Kaplay imports** (GATE-06), dropping everything XP/level/HP/combat/persistence (Phase 11). The selection math must not be re-tuned (REQUIREMENTS "Out of Scope": *Modifying the tuned question-selection algorithm*).

The second half — the gate UI — is a standard Kaplay 3001 fixed-overlay pattern: a full-screen dimming `rect` + a panel + big question `text` + four clickable answer boxes, all `fixed()` (screen-space, camera-immune) with a high `z()`. Every symbol needed is present in the vendored `lib/kaplay.mjs` (verified by grep) and matches the Kaplay 3001 docs.

The seam is `src/ui/mathGate.js#openMathGate(...)` — the **only** consumer of the brain — invoked from the existing fire-once `onReachGoal()` stub in `src/scenes/game.js` (lines 113–133). The dependency is strictly one-way (gate → brain). The single highest-risk area is **event-handler leakage**: a bare global `onKeyPress("1", ...)` survives the scene and stacks on every gate re-open. The fix is to attach all gate input/visuals to a single gate root game-object and `destroy()` it on close, or to capture every `EventController` and `.cancel()` it — both confirmed against Kaplay docs.

**Primary recommendation:** Port `QuestionSelector` + the EWMA/`getAccuracy`/`updateAccuracy`/`isMastered` slice into `src/math/brain.js` as a pure module exposing `nextQuestion()` and `reportResult(table, isCorrect)`; build the gate as a single destroyable root object in `src/ui/mathGate.js` with object-scoped (not global) input handlers; wire `onReachGoal()` → `openMathGate({ onClear })`. Validate via `node --check` + structural grep assertions + manual browser UAT (no test framework exists).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Math Brain Port (the firewall)**
- Port ONLY the weighted question-selector (6–9 bias) plus in-memory accuracy/struggle weighting from `archive/math-lab.html`. Do NOT port XP, level, HP, combat, or potions — those belong to Phase 11.
- New module `src/math/brain.js` — a pure ES module with ZERO Kaplay imports (GATE-06 clean firewall). Exports a small surface, e.g. `nextQuestion()` (returns `{ a, b, answer, choices[] }`) and `checkAnswer(choice)` / a result reporter.
- 4 multiple-choice answers: 1 correct + 3 distractors. Reuse the archive's distractor logic if present; otherwise generate plausible near-misses (±1 row, off-by-one product) — never trivially-spotted random numbers.
- Brain state is IN-MEMORY only this phase: per-session accuracy weighting works, but localStorage persistence is deferred to Phase 11. State must not leak across game replays.

**Gate Presentation (UI)**
- Render the gate IN-WORLD with Kaplay (game font/palette, the avatar visible/dimmed behind the panel) — NOT a DOM/HTML popup.
- `src/ui/mathGate.js` is the ONLY connector between the Kaplay scene and the pure brain (the single bridge named in the success criteria).
- Answer input accepts BOTH keyboard number keys 1–4 AND mouse-click on the answer boxes (kid-friendly).
- Layout: big question expression at the top, four answer boxes below, dark grunge panel overlay; the level is paused and dimmed behind the gate.

**Gate Behavior (forgiving, no-timer)**
- Wrong answer is forgiving: mark the wrong choice (shake/flash), KEEP the same question, let her retry — no penalty, no progress lost, the run never ends / no game-over.
- Correct answer: a celebratory moment (flash) + a "LEVEL CLEAR" banner; clears the level. Single level — no next-level wiring this phase.
- NO countdown timer and no time pressure anywhere (GATE-05).
- A single correct answer clears the gate (one question per gate this phase — no streak requirement).

**Integration Seam**
- The existing `onReachGoal()` stub in `src/scenes/game.js` calls `openMathGate(...)` in `src/ui/mathGate.js`, replacing the temporary "GOAL!" text.
- Reuse the existing player-freeze to pause the scene/physics while the gate is open; everything resets cleanly on replay (no leaked module/gate state).
- The gate question uses the 6–9-weighted selector (any table possible, biased to 6–9 per GATE-02) — not hardcoded to 6–9 only.
- One-way dependency: the brain knows nothing of Kaplay; the gate pulls question data from the brain and pushes answer results back — never the reverse.

### Claude's Discretion
- Exact function signatures/return shapes of `src/math/brain.js`.
- Visual styling details of the gate panel within the dark-grunge / no-pink mandate.
- Exact celebration/"LEVEL CLEAR" presentation (kept simple here; Phase 12 polishes).

### Deferred Ideas (OUT OF SCOPE)
- XP earning, level-up, and localStorage persistence — Phase 11 (SAVE-01).
- Juice/polish, discoverable controls, contrast audit, UAT — Phase 12.
- Multi-level progression / a next level after the goal — out of milestone scope (single polished level).
- HP / combat / potions from the archive brain — not ported.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GATE-01 | At the goal, a math question appears as an in-world gate (not a system quiz popup), level paused and visible behind it | Fixed full-screen dim `rect` + panel `rect` + `text`, all `fixed()`+`z(9999)` drawn over the still-rendered (paused) level. Pause via existing `player.paused = true` (game.js:124). [CITED: kaplayjs.com/docs/api/ctx/z] |
| GATE-02 | 4 multiple-choice answers using the ported weighted selection (biased toward 6–9) | Port `QuestionSelector.selectNext` (archive 1014–1028): `calculateWeights` biases HARD_TABLES [6,7,8,9] via `(1-acc)^1.5` vs EASY `(1-acc)^0.8*0.3`; `generateDistractors` makes 3 near-miss distractors. [VERIFIED: archive/math-lab.html grep] |
| GATE-03 | Correct answer opens the gate / clears the level with a celebratory moment | Correct branch: flash chosen box green, "LEVEL CLEAR" banner, invoke `onClear()` callback the scene supplies. `tween`/`shake` confirmed present. [VERIFIED: lib/kaplay.mjs grep] |
| GATE-04 | Wrong answer is forgiving — re-ask with no penalty, no progress lost | Wrong branch: shake/flash the chosen box red, KEEP same question object, re-enable input. No state mutation that ends the run. (Brain `reportResult` may still record the miss for EWMA — that adapts, it does not penalize.) [VERIFIED: archive distractor + EWMA logic] |
| GATE-05 | No countdown timer or any time pressure | No `wait()`/`loop()` timer drives gate state. Gate stays open until a correct answer. SAFE-01 audit deferred to Phase 12 but must hold here. [CITED: CONTEXT decisions] |
| GATE-06 | Ported math brain is standalone, no game-engine dependency (clean firewall) | `src/math/brain.js` imports nothing from Kaplay; uses only `Math.random`. Verifiable by `grep -L kaplay src/math/brain.js` and `node --check`. [VERIFIED: archive QuestionSelector is already engine-agnostic] |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Weighted question selection (6–9 bias) | Pure logic (`src/math/brain.js`) | — | Framework-agnostic arithmetic; must have zero Kaplay coupling (GATE-06). Already pure in archive. |
| Distractor generation | Pure logic (`src/math/brain.js`) | — | Pure arithmetic on `table`/`multiplicand`; no rendering. |
| In-memory accuracy / EWMA / mastery | Pure logic (`src/math/brain.js`) | — | Per-session adaptation; no persistence this phase. Closure-held state, reset per game start. |
| Gate panel rendering + dimming overlay | Kaplay UI (`src/ui/mathGate.js`) | — | Screen-space `fixed()` objects; the ONLY place that draws the gate. |
| Answer input (keys 1–4 + mouse-click) | Kaplay UI (`src/ui/mathGate.js`) | — | Object-scoped `onKeyPress`/`onClick`; never bare-global (leak risk). |
| Goal→gate handoff + scene pause/resume | Scene (`src/scenes/game.js`) | Kaplay UI | The fire-once `onReachGoal()` is the single attach point; owns `player.paused` and the `onClear` callback. |
| Brain ↔ gate bridge | Bridge (`src/ui/mathGate.js`) | — | One-way: gate pulls `nextQuestion()`, pushes `reportResult()`. Brain never imports the gate. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla ES modules | ES2020+ | `src/math/brain.js` pure module; `src/ui/mathGate.js` bridge | Project canon: zero deps, no build step (CLAUDE.md). [VERIFIED: repo has no package.json build] |
| Kaplay | 3001.0.19 (vendored `lib/kaplay.mjs`) | In-world gate rendering + input | Pinned + vendored per SETUP-03; `global: true` exposes `add/text/rect/onKeyPress/onClick/fixed/z/...`. [VERIFIED: lib/kaplay.mjs grep] |
| `Math.random` | Native | Weighted roll + Fisher-Yates shuffle | Already used by the archive selector; no RNG library needed. [VERIFIED: archive 916–920, 960–968] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Kaplay default bitmap font | built-in | Gate question/answer text | `text()` with no font loaded uses Kaplay's default; no `loadFont` exists in repo and none required this phase. [VERIFIED: grep found zero `loadFont` usages] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single destroyable gate root object | Bare global `onKeyPress` + loose objects | REJECTED: global handlers leak across re-opens (see Pitfall 1). Object-scoped is the safe idiom. |
| Kaplay in-world panel | DOM/HTML popup overlay | REJECTED by CONTEXT (GATE-01 "not a system quiz popup"). |
| `fixed()` screen-space overlay | World-space panel following camera | `fixed()` is simpler and camera-immune; matches the existing "GOAL!" banner pattern (game.js:129). |

**Installation:** None. Zero new dependencies (project canon). Kaplay is already vendored at `lib/kaplay.mjs` (188 KB, pinned 3001.0.19).

**Version verification:** No package install occurs in this phase. `node --version` = v22.22.2 (supports ES2020 modules for `node --check`). [VERIFIED: shell]

## Package Legitimacy Audit

**Not applicable.** This phase installs ZERO external packages (zero-dependency, no-build project canon — CLAUDE.md "What NOT to Use": no CDN libraries, no bundler). The only third-party code is the already-vendored, already-pinned Kaplay 3001.0.19 at `lib/kaplay.mjs` (SETUP-03, accepted in Phases 7–9). No npm/PyPI/crates lookups required.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## EXACT Port Targets (quoted from archive/math-lab.html)

### What to PORT (the firewall keeps these)

**1. CONFIG constants** (archive lines 604–619) — port these into `src/config.js` (project canon: no magic numbers) under a `BRAIN`/`GATE` namespace:
```js
ACCURACY_ALPHA:    0.15,  // EWMA weight for new answer
MASTERY_THRESHOLD: 0.80,  // 80% accuracy over last 10 → reduce drilling
STRUGGLE_THRESHOLD: 0.60, // below this → 1.5× weight boost
STRUGGLE_BOOST:    1.5,
MASTERY_WINDOW:    10,     // sliding window for mastery check
HARD_TABLES:       [6, 7, 8, 9],
EASY_TABLES:       [1, 2, 3, 4, 5],
```
DROP: `XP_EASY/XP_HARD/BASE_XP/LEVEL_MULT/SEGMENT_COUNT/ADVANCE_DELAY_MS/SAVE_KEY`, and the entire `CONFIG.DUNGEON` block (HP/combat/potions — Phase 11/never). [VERIFIED: archive 604–642]

**2. EWMA accuracy slice** from `PlayerState` (archive 663–711) — port `updateAccuracy`, `getAccuracy`, `isMastered`, and the `accuracy`/`history` state. The EWMA core:
```js
// archive 690–700 — port verbatim
updateAccuracy(table, isCorrect) {
  const prev = accuracy[table] !== undefined ? accuracy[table] : 0.5;
  accuracy[table] = prev * (1 - CONFIG.ACCURACY_ALPHA) +
                    (isCorrect ? 1 : 0) * CONFIG.ACCURACY_ALPHA;
  if (!history[table]) history[table] = [];
  history[table].push(isCorrect);
  if (history[table].length > CONFIG.MASTERY_WINDOW) history[table].shift();
}
```
Initial accuracy seed (hard tables start lower → higher initial weight): `{1:.5,2:.5,3:.5,4:.5,5:.5, 6:.4,7:.4,8:.4,9:.4}` (archive 667–668). [VERIFIED: archive grep]
DROP from `PlayerState`: `xp`, `level`, `addXp`, `getXp`, `getLevel`, `toJSON`/`fromJSON` (the toJSON/fromJSON persistence belongs to Phase 11).

**3. The entire `QuestionSelector` module** (archive 911–1030) — port verbatim:
- `shuffle` (Fisher-Yates, 915–921) — unbiased; do NOT replace with `sort(()=>Math.random())`.
- `calculateWeights(playerState, allowedTables)` (927–956) — the 6–9 bias engine: HARD weight `(1-acc)^1.5` (×1.5 if struggling, ×0.3 if mastered); EASY weight `(1-acc)^0.8 * 0.3`; zero-total fallback to equal weights.
- `weightedRandom(weights)` (960–969) — roll-and-walk selection.
- `generateDistractors(answer, table, multiplicand)` (975–1009) — ±1/±2 multiplicand on same table + one wrong-table distractor + ±3 fallback + last-resort pad; dedupes `v !== answer && v > 0`.
- `selectNext(playerState, allowedTables)` (1014–1028) — returns `{ table, multiplicand, answer, options, question }`. **`options` is already shuffled** with the answer mixed in.

**Note on the return shape:** the archive returns `options` and `question: table + ' × ' + multiplicand`. CONTEXT suggested `{ a, b, answer, choices[] }`. Map cleanly: `a=table`, `b=multiplicand`, `choices=options`. Either naming is Claude's discretion — pick ONE and document it. The `'×'` (U+00D7) glyph renders in Kaplay's default font; if it does not, fall back to `'x'`.

### What to DROP (XP/combat firewall — Phase 11 / never)
- `XpCalculator` (648–657), all `addXp`/level logic, XP CONFIG.
- `CONFIG.DUNGEON`, `GameFSM`, combat/HP/potion/loot.
- `toJSON`/`fromJSON`/localStorage save (Phase 11 SAVE-01/02).
- `allowedTables` (DIFF-01) param is harmless to keep but unused this phase — pass `undefined` so all 9 tables are in play, biased to 6–9 (GATE-02). [VERIFIED: archive 1014 default]

### Cleanest pure-module API surface for `src/math/brain.js` (recommended)
```js
// src/math/brain.js — ZERO Kaplay imports. Only CONFIG (leaf constants) may be imported.
// Closure-held per-game state (NOT module-level mutable that leaks across replays —
// expose a factory OR a reset()).
export function createBrain() {
  const accuracy = { 1:.5,2:.5,3:.5,4:.5,5:.5, 6:.4,7:.4,8:.4,9:.4 };
  const history = {};
  // ... shuffle / calculateWeights / weightedRandom / generateDistractors (ported) ...
  return {
    nextQuestion() { /* selectNext over accuracy/history → { a, b, answer, choices } */ },
    reportResult(table, isCorrect) { /* updateAccuracy */ },
  };
}
```
A factory (`createBrain()`) is the cleanest anti-leak shape: each new game gets a fresh closure, so accuracy never bleeds across replays (CONTEXT: "State must not leak across game replays"). A module-level singleton + `reset()` also works but is leak-prone if `reset()` is forgotten. **Recommend the factory.**

## Architecture Patterns

### System Architecture Diagram

```
  [player run/jump input]            (paused while gate open: player.paused=true)
            │
            ▼
  ┌───────────────────────┐   onCollide("goal")   ┌──────────────────────────────┐
  │  src/scenes/game.js    │ ────fire-once───────▶ │ onReachGoal() (lines 113–133)│
  │  (owns run-state       │                       │  player.vel=0; player.paused │
  │   closure)             │ ◀──onClear() callback─│  = true; openMathGate({...}) │
  └───────────────────────┘                       └──────────────┬───────────────┘
            ▲ clears level                                        │ (the ONLY brain consumer)
            │                                                     ▼
            │                                   ┌──────────────────────────────────┐
            │                                   │  src/ui/mathGate.js  (the BRIDGE) │
            │                                   │  gateRoot = add([fixed,z,...])    │
            │                                   │  ├─ dim rect + panel + question   │
            │                                   │  ├─ 4 answer boxes (onClick)      │
            │                                   │  └─ onKeyPress "1".."4" (scoped)  │
            │                                   └─────┬───────────────────▲────────┘
            │                                         │ nextQuestion()    │ reportResult()
            │                                         ▼                   │  (one-way: gate→brain)
            │                                   ┌──────────────────────────────────┐
            │   correct → onClear() ───────────│  src/math/brain.js (PURE, no KX)  │
            └──────────────────────────────────│  createBrain(): nextQuestion /    │
                                                │  reportResult (EWMA, weighted sel)│
                                                └──────────────────────────────────┘
```
Data flow trace (primary use case): player reaches goal → `onReachGoal()` freezes player + calls `openMathGate` → gate calls `brain.nextQuestion()` → renders question + 4 boxes → player presses `1`–`4` or clicks → gate compares to `answer`, calls `brain.reportResult()` → wrong: shake + re-ask same question; correct: flash + "LEVEL CLEAR" + `destroy(gateRoot)` + `onClear()` → scene clears level.

### Recommended Project Structure
```
src/
├── math/
│   └── brain.js      # NEW — pure ES module, zero Kaplay (GATE-06)
├── ui/
│   └── mathGate.js   # NEW — the single bridge: scene ↔ brain, renders gate
├── scenes/
│   └── game.js       # EDIT — onReachGoal() calls openMathGate (replace stub 117–131)
├── config.js         # EDIT — add BRAIN/GATE constants (no magic numbers)
└── main.js           # likely UNCHANGED — no new asset/font to preload
```

### Pattern 1: Fixed full-screen gate overlay (camera-immune, on top)
**What:** A dimming layer + panel + content, all screen-space.
**When to use:** GATE-01 in-world pause overlay.
```js
// Source: kaplayjs.com/docs/api/ctx/z + repo "GOAL!" banner (game.js:125–131)
const gateRoot = add([fixed(), z(9999), "math-gate"]); // parent/tag for cleanup
add([ rect(width(), height()), pos(0,0), color(0,0,0), opacity(0.6), fixed(), z(9990), "math-gate" ]); // dim
// panel
add([ rect(420, 220), anchor("center"), pos(center()), color(20,20,20), outline(2, rgb(0x33,0x33,0x33)), fixed(), z(9991), "math-gate" ]);
// big question
add([ text(q.a + " × " + q.b), anchor("center"), pos(center().x, center().y - 60), fixed(), z(9992), "math-gate" ]);
```
All `text/rect/color/opacity/outline/anchor/fixed/z/center/width/height` confirmed present. [VERIFIED: lib/kaplay.mjs grep]

### Pattern 2: Dual-input answer boxes (mouse + keys), leak-safe
**What:** Each of 4 boxes is clickable; keys 1–4 select the same boxes.
```js
// Object-scoped click — auto-removed when the box is destroyed (no leak).
const box = add([ rect(80,40), area(), pos(...), color(...), fixed(), z(9992), "math-gate", "answer", { idx } ]);
box.onClick(() => choose(idx)); // area() provides obj.onClick; tied to box lifetime. [CITED: kaplayjs events]
// Keys: capture EventControllers and cancel on close, OR scope to gateRoot.
const keyCtrls = ["1","2","3","4"].map((k, i) => onKeyPress(k, () => choose(i)));
// on close: keyCtrls.forEach(c => c.cancel());  // EventController.cancel() confirmed. [CITED: kaplayjs events]
```
**Why both cleanup paths:** `obj.onClick` dies with the object on `destroy`; but a **global** `onKeyPress` does NOT — it must be `.cancel()`-ed or it leaks (Pitfall 1).

### Pattern 3: Clean close — destroy the tagged subtree + cancel key controllers
```js
function closeGate() {
  keyCtrls.forEach(c => c.cancel());      // kill global key handlers
  destroy("math-gate");                    // destroy every tagged gate object (boxes, panel, dim, text)
}
```
`destroy(tag)` removes all objects with that tag (or iterate `get("math-gate")`). Object-scoped handlers go with them. [CITED: kaplayjs.com/guides/events — "removed when the object was destroyed"]

### Anti-Patterns to Avoid
- **Bare global `onKeyPress("1", ...)` with no `.cancel()`:** leaks across every gate re-open; after N goals, one keypress fires N times. ALWAYS capture the controller or scope to an object.
- **Module-level mutable brain state (`let accuracy = ...` at file top):** leaks across game replays (CONTEXT forbids). Use a `createBrain()` factory closure.
- **Re-tuning `calculateWeights` exponents/`0.3` factor:** explicitly out of scope ("port verbatim; the 6–9 weighting is already validated").
- **`array.sort(() => Math.random()-0.5)`:** biased; the archive uses Fisher-Yates — keep it.
- **DOM `innerHTML` for the gate:** forbidden (GATE-01, and T-09-07 XSS note in game.js:118). Use Kaplay `text()`.
- **A timer that auto-advances or pressures (`wait`/`loop` countdown):** violates GATE-05/SAFE-01.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weighted 6–9 question selection | A new biasing algorithm | Ported `QuestionSelector.calculateWeights`/`weightedRandom` | Already tuned + validated; re-tuning is out of scope. |
| Plausible wrong answers | Random distractor numbers | Ported `generateDistractors` (±1/±2 near-misses) | Random numbers are trivially spotted; near-misses make her actually compute. |
| Unbiased option shuffle | `sort(random)` | Ported Fisher-Yates `shuffle` | `sort(random)` is statistically biased. |
| Adaptive difficulty (EWMA) | New accuracy formula | Ported `updateAccuracy` EWMA (α=0.15) + `isMastered` window | Proven smoothing; drives the struggle-boost. |
| Camera-immune overlay | Manual camera-offset math per object | `fixed()` component | Built-in screen-space; matches existing banner. |
| Per-object click hit-testing | Manual `mousePos()` AABB checks | `area()` + `obj.onClick()` | Built-in, auto-cleaned on destroy. |

**Key insight:** Almost the entire "brain" already exists and is engine-agnostic by construction (the archive author deliberately built `QuestionSelector` as a pure IIFE taking a `playerState` arg). The phase is 80% mechanical extraction + firewall verification, 20% Kaplay overlay wiring. The novel risk is not the math — it's handler/state leakage at the seam.

## Runtime State Inventory

> This is an extract/port phase, not a rename. Reviewed for leak vectors per the anti-leak contract.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — persistence (localStorage `mathlab_save_*`) is explicitly DEFERRED to Phase 11. Brain state is in-memory only this phase. | None. Do NOT port `toJSON/fromJSON`/SAVE_KEY. |
| Live service config | None — static client-only game, no services. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | None — no build step (project canon). `node --check` only. | None. |
| **Cross-replay module state (project-specific leak class)** | Risk: a module-level `let accuracy`/gate object surviving a game replay. game.js already enforces "all run state in the scene closure, never module-level `let`" (lines 1–18, 33–43). | Brain MUST use a `createBrain()` factory (fresh closure per game); gate MUST `destroy("math-gate")` + cancel key controllers on close. |

## Common Pitfalls

### Pitfall 1: Leaked global key handlers across gate re-opens
**What goes wrong:** `onKeyPress("1", choose)` registered when the gate opens persists after the gate closes (global handlers live until `.cancel()` or scene end — confirmed). Reach the goal again (or re-open the gate) and a second handler stacks; pressing `1` now fires twice.
**Why it happens:** Kaplay global event handlers are NOT tied to any object's lifetime; only `obj.onKeyPress`/`obj.onClick` die with their object.
**How to avoid:** Capture every `onKeyPress` `EventController` and `.cancel()` them in `closeGate()`; prefer `obj.onClick` for the boxes (auto-cleaned). Tag everything `"math-gate"` and `destroy("math-gate")`.
**Warning signs:** A keypress that triggers multiple selections; console shows duplicate handler effects after a second goal-touch.

### Pitfall 2: Brain state bleeding across game replays
**What goes wrong:** Accuracy/history accumulated in a previous playthrough biases the next game's questions; CONTEXT forbids this.
**Why it happens:** Module-level `let accuracy = {...}` (singleton) is shared across `go("game")` calls.
**How to avoid:** `createBrain()` factory — the scene constructs a fresh brain per game start, holding it in the scene closure (same discipline game.js uses for `coinsCollected`/`goalReached`).
**Warning signs:** Second playthrough's questions look "already adapted"; mastery triggers immediately.

### Pitfall 3: Movement input bleeding through the open gate
**What goes wrong:** Player keeps running/jumping while the gate is up.
**Why it happens (and why it is ALREADY mostly handled):** Run input is read in `player.onUpdate` (object handler) and jump-consumption also in `player.onUpdate`; both freeze when `player.paused = true` (set in `onReachGoal`, game.js:124). The jump `onKeyPress(JUMP_KEYS)` (player.js:65) only sets a `buffer` that the *paused* `onUpdate` never consumes. So freezing the player neutralizes movement.
**How to avoid:** Keep the existing `player.paused = true` before opening the gate (already in the stub). Verify by playtest that arrows/space do nothing while the gate is open. If any residual fires, the gate's own key handlers should `stopPropagation`/be the only live consumers — but no change is expected to be required.
**Warning signs:** Avatar drifts or jumps behind the dimmed panel.

### Pitfall 4: Accidentally porting XP/combat (firewall breach → GATE-06 fail)
**What goes wrong:** Copying `PlayerState` wholesale drags in `addXp`/`level`/`XpCalculator`/`DUNGEON`, coupling brain to Phase-11 concerns.
**Why it happens:** The archive interleaves XP and accuracy in one IIFE.
**How to avoid:** Port ONLY `updateAccuracy/getAccuracy/isMastered` + the accuracy/history state + `QuestionSelector`. Grep the new file: `grep -E 'xp|level|Xp|DUNGEON|HP|combat|potion' src/math/brain.js` must return nothing.
**Warning signs:** `brain.js` references `xp`/`level`/`SAVE_KEY`.

### Pitfall 5: `node --check` passes but the gate never clears the level
**What goes wrong:** Syntax is fine; the `onClear()` callback isn't wired, so a correct answer flashes but the level state doesn't advance.
**Why it happens:** No test framework catches integration gaps; only `node --check` runs.
**How to avoid:** Define the contract explicitly: `openMathGate({ onClear })` calls `onClear()` exactly once on the correct answer; the scene passes a closure that performs the level-clear (and, this phase, keeps the simple "LEVEL CLEAR" banner). Manual UAT must confirm the full loop.
**Warning signs:** Correct answer celebrates but the player stays frozen with nothing happening.

## Code Examples

### Pure brain factory skeleton (port target → new module)
```js
// Source: archive/math-lab.html lines 663–711 (EWMA) + 911–1030 (selector), de-XP'd.
// src/math/brain.js — ZERO Kaplay imports (GATE-06).
import { CONFIG } from "../config.js"; // leaf constants only (BRAIN namespace)

export function createBrain() {
  const accuracy = { 1:.5,2:.5,3:.5,4:.5,5:.5, 6:.4,7:.4,8:.4,9:.4 };
  const history = {};
  const shuffle = (a) => { for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  // calculateWeights / weightedRandom / generateDistractors — ported verbatim (archive 927–1009)
  return {
    nextQuestion() {
      // selectNext logic (archive 1014–1028), reading the closure's accuracy/history
      // returns { a: table, b: multiplicand, answer, choices }  (choices already shuffled)
    },
    reportResult(table, isCorrect) {
      const prev = accuracy[table] ?? 0.5;
      accuracy[table] = prev*(1-CONFIG.BRAIN.ACCURACY_ALPHA) + (isCorrect?1:0)*CONFIG.BRAIN.ACCURACY_ALPHA;
      (history[table] ??= []).push(isCorrect);
      if (history[table].length > CONFIG.BRAIN.MASTERY_WINDOW) history[table].shift();
    },
  };
}
```

### Bridge entry point (the single seam)
```js
// src/ui/mathGate.js — the ONLY consumer of the brain.
import { createBrain } from "../math/brain.js";
// brain is created per-game by the scene and passed in (anti-leak), OR created here per open.
export function openMathGate({ brain, onClear }) {
  const q = brain.nextQuestion();      // pull (gate → brain, one-way)
  const keyCtrls = [];
  // ... render dim + panel + text(q.a + " × " + q.b) + 4 boxes from q.choices ...
  function choose(i) {
    const picked = q.choices[i];
    const correct = picked === q.answer;
    brain.reportResult(q.a, correct);  // push result (gate → brain)
    if (correct) { /* flash + "LEVEL CLEAR" */ close(); onClear(); }
    else         { /* shake red; KEEP same q; re-enable */ }
  }
  function close() { keyCtrls.forEach(c => c.cancel()); destroy("math-gate"); }
}
```

### Scene wiring (replace the stub body, game.js 117–131)
```js
// src/scenes/game.js inside onReachGoal(), after player.vel=0; player.paused=true;
const brain = makeBrain();          // fresh per game (held in scene closure — anti-leak)
openMathGate({
  brain,
  onClear() {
    // this phase: simple LEVEL CLEAR banner (Phase 12 polishes). Single level — no go() to next.
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Kaboom.js `loadSpriteSheet` | Kaplay `loadSprite(..., { sliceX })` | Kaplay 3000+ | N/A this phase (no new sprites), but confirms the vendored API set. [VERIFIED: main.js:33 note] |
| Archive brain coupled to DOM Renderer + XP HUD | Pure `QuestionSelector` IIFE taking `playerState` | already in archive | The selector was authored engine-agnostic — extraction is clean. |

**Deprecated/outdated:** Do not reach for `loadSpriteSheet` (absent in 3001). Not needed here regardless.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Kaplay default bitmap font renders the `×` (U+00D7) glyph acceptably | Standard Stack / Pattern 1 | LOW — if it renders as tofu, fall back to `'x'`; verify in first playtest. |
| A2 | `player.paused = true` fully neutralizes movement input while the gate is open (no extra input-gating needed) | Pitfall 3 | LOW — grounded in code reading (run+jump-consume both in paused `player.onUpdate`); confirm by playtest. |
| A3 | Replaying the level happens via a fresh game start (new brain), not an in-scene re-open of the gate | Pitfall 2 | MEDIUM — multi-level/replay isn't wired this phase (single level). If a future replay re-opens the gate in-scene, the factory + `destroy`/`cancel` cleanup still holds. |

**If A1–A3 hold (expected), no user confirmation is needed — all are validated by the first browser playtest.**

## Open Questions

1. **Return-shape naming: `{a,b,answer,choices}` vs archive's `{table,multiplicand,answer,options,question}`?**
   - What we know: both carry the same data; CONTEXT suggested the former; archive uses the latter.
   - What's unclear: which the planner prefers for the gate's text rendering.
   - Recommendation: pick `{ a, b, answer, choices }` (matches CONTEXT) and have the gate build the question string itself (`q.a + " × " + q.b`). Document the chosen shape in `brain.js`.

2. **Does `onClear()` this phase do anything beyond the "LEVEL CLEAR" banner?**
   - What we know: single level, no next-level wiring (CONTEXT deferred).
   - Recommendation: `onClear()` just shows the banner + leaves the player frozen (cleared). Keep the callback so Phase 11 (XP award) and future multi-level wiring have a clean hook.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (for `node --check` syntax gate) | Validation | ✓ | v22.22.2 | — |
| Vendored Kaplay | Gate rendering | ✓ | 3001.0.19 (`lib/kaplay.mjs`, 188 KB) | — |
| Browser (manual UAT) | GATE-01..05 visual/interaction | ✓ (dev) | any modern | — |
| Build tool / bundler | — | ✗ (by design) | — | none needed — no build step |
| Test framework | — | ✗ (by design) | — | `node --check` + structural grep + manual UAT |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** test framework — replaced by the Validation Architecture below (project has no unit-test harness by canon).

## Validation Architecture

> `nyquist_validation` is enabled. There is NO JS test framework (project canon). Validation = a **syntax gate** (`node --check`) + **structural assertions** (grep/static checks that encode the firewall + anti-leak contracts) + **manual UAT** items for behavior that only a human can confirm.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no-build, no-test-framework project canon) |
| Config file | none |
| Quick run command | `node --check src/math/brain.js && node --check src/ui/mathGate.js && node --check src/scenes/game.js` |
| Full suite command | `for f in $(git ls-files 'src/**/*.js'); do node --check "$f" || exit 1; done` + the structural greps below |
| Pure-module guard | `node -e "import('./src/math/brain.js').then(m=>{const b=m.createBrain();const q=b.nextQuestion();console.log(q.choices.length===4 && q.choices.includes(q.answer))})"` (runs the brain headless — proves zero-Kaplay + correct shape) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command / Check | Exists? |
|--------|----------|-----------|---------------------------|---------|
| GATE-06 | Brain has zero Kaplay dependency | structural | `! grep -qi 'kaplay' src/math/brain.js` (must succeed) | ❌ Wave 0 |
| GATE-06 | Brain is importable & runs headless in Node | smoke | `node -e "import('./src/math/brain.js')..."` returns true (4 choices incl. answer) | ❌ Wave 0 |
| GATE-02 | 4 choices, one correct, biased to 6–9 | smoke (statistical) | headless: run `nextQuestion()` 1000×, assert `choices.length===4`, `answer∈choices`, and `>50%` of `a`∈[6,7,8,9] | ❌ Wave 0 |
| GATE-02 | No XP/combat ported (firewall clean) | structural | `! grep -Eqi 'xp|XpCalculator|DUNGEON|level\+\+|combat|potion|SAVE_KEY' src/math/brain.js` | ❌ Wave 0 |
| GATE-05 | No timer/countdown in the gate | structural | `! grep -Eq 'wait\(|loop\(|setTimeout|countdown|timer' src/ui/mathGate.js` | ❌ Wave 0 |
| GATE-01 | In-world (no DOM popup) | structural | `! grep -Eq 'innerHTML|document\.|alert\(' src/ui/mathGate.js` | ❌ Wave 0 |
| GATE-06 | One-way dependency (brain never imports gate/scene) | structural | `! grep -Eq "from .*mathGate|from .*scenes/" src/math/brain.js` | ❌ Wave 0 |
| Leak | Gate cleans up handlers/objects on close | structural | `grep -Eq 'cancel\(\)|destroy\(' src/ui/mathGate.js` (must find both) | ❌ Wave 0 |
| Anti-leak | Brain uses factory, not module-level mutable state | structural | `grep -q 'export function createBrain' src/math/brain.js` AND `! grep -Eq '^\s*let (accuracy|history)' src/math/brain.js` | ❌ Wave 0 |
| GATE-01 | Gate panel appears over paused, visible level | manual UAT | Reach goal → dimmed level visible behind a centered panel with the question | manual |
| GATE-02 | Question shows a×b + 4 plausible answers | manual UAT | Distractors are near-misses, not random; one is correct | manual |
| GATE-03 | Correct → celebration + LEVEL CLEAR | manual UAT | Pick correct (key 1–4 AND mouse) → flash + "LEVEL CLEAR" | manual |
| GATE-04 | Wrong → forgiving re-ask, no penalty/game-over | manual UAT | Pick wrong repeatedly → box shakes red, SAME question stays, run never ends | manual |
| GATE-05 | No timer/time pressure anywhere | manual UAT | Sit on the gate 60s → nothing changes/advances | manual |
| Input | Both keys 1–4 and mouse-click select answers | manual UAT | Verify both paths choose the same boxes | manual |
| Leak (runtime) | Re-reach goal / replay → no double-fire, fresh question stream | manual UAT | After clearing + restart, keys fire once; questions not pre-adapted | manual |

### Sampling Rate
- **Per task commit:** `node --check` on every changed `.js` + the structural greps relevant to that file.
- **Per wave merge:** full `node --check` sweep + brain headless smoke (1000× selection stats) + all structural assertions.
- **Phase gate:** all structural checks green + the manual UAT checklist completed in-browser before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] A tiny validation script (e.g. `scripts/check-phase-10.sh` or inline in the plan's verify steps) bundling the structural greps + the brain headless smoke — there is no harness yet, so the assertions must be authored as part of this phase's verification.
- [ ] No `src/math/` or `src/ui/` directory exists yet — both are created in this phase.

## Security Domain

> `security_enforcement` enabled, ASVS Level 1. This is a static, client-only, single-player game with NO backend, NO accounts, NO network, and NO persistence this phase. Most ASVS categories are N/A.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth — single local player. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No protected resources. |
| V5 Input Validation | minimal | Answer input is constrained to clicks on 4 boxes / keys 1–4; no free-text. Brain consumes only its own generated integers. |
| V6 Cryptography | no | No secrets, no crypto. |
| V7 Output Encoding (XSS) | yes | Render via Kaplay `text()` only — NEVER DOM `innerHTML` (continues the T-09-07 guard in game.js:118). |

### Known Threat Patterns for {static Kaplay client}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via DOM string sink | Tampering | Use Kaplay canvas `text()`; structural check `! grep innerHTML src/ui/mathGate.js`. |
| Prototype-pollution via untrusted JSON (`fromJSON`) | Tampering | N/A this phase — persistence/`fromJSON` deferred to Phase 11 (the archive already guards it with explicit-key copying, not `Object.assign`). |

## Sources

### Primary (HIGH confidence)
- `archive/math-lab.html` lines 604–642 (CONFIG), 663–711 (PlayerState EWMA/mastery), 911–1030 (QuestionSelector: weights/distractors/selectNext) — the verbatim port source. [VERIFIED via Read]
- `src/scenes/game.js` 113–133 (`onReachGoal` fire-once stub seam), 1–18 (anti-leak closure contract). [VERIFIED via Read]
- `src/player.js` 40–73 (input lives in paused `player.onUpdate` + global jump `onKeyPress`). [VERIFIED via Read]
- `src/config.js` (constant-centralization convention). [VERIFIED via Read]
- `lib/kaplay.mjs` symbol grep — confirmed present: onKeyPress, onClick, onHover, isKeyPressed, mousePos, fixed, anchor, outline, opacity, color, rect, text, area, z, scale, shake, tween, easings, center, width, height, destroy, wait, loop, setLayers; keys "1".."9". [VERIFIED via grep]
- KAPLAY 3001 docs: z-index draw order + fixed overlay idiom (kaplayjs.com/docs/api/ctx/z); scenes destroy all objects on `go()` (kaplayjs.com/guides/scenes); events return cancellable EventController, object handlers auto-removed on destroy, global handlers persist (kaplayjs.com/guides/events). [CITED]

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` (GATE-01..06 + Out-of-Scope: do not re-tune selection). [VERIFIED via Read]
- `.planning/phases/10-.../10-CONTEXT.md` (locked decisions). [VERIFIED via Read]

### Tertiary (LOW confidence)
- None — all findings are codebase-grounded or docs-cited. (External search providers are disabled in config.json; not needed for this codebase-bound phase.)

## Metadata

**Confidence breakdown:**
- Port targets (what to extract): HIGH — exact lines read and quoted from the archive.
- Kaplay UI API surface: HIGH — every symbol grep-confirmed in the vendored file and cross-checked against 3001 docs.
- Leak/anti-leak pitfalls: HIGH — confirmed by Kaplay events docs + reading the existing closure/`paused` discipline in game.js/player.js.
- Validation approach: HIGH — matches the established no-build, `node --check`-only project canon.

**Research date:** 2026-06-25
**Valid until:** 2026-07-25 (stable — vendored Kaplay is pinned; archive is frozen; no fast-moving deps)
