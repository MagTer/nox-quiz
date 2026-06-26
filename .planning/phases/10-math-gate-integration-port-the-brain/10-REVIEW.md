---
phase: 10-math-gate-integration-port-the-brain
reviewed: 2026-06-26T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/config.js
  - src/math/brain.js
  - src/ui/mathGate.js
  - src/scenes/game.js
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-06-26T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the Phase 10 math-gate integration: the pure brain (`brain.js`), the in-world gate UI (`mathGate.js`), the scene wiring (`game.js`), and the shared config (`config.js`).

**The brain firewall and selection math are solid.** `brain.js` imports nothing from Kaplay, runs headlessly in plain `node`, and is a clean `createBrain()` factory with per-call closure state (verified: imported and ran in node with no engine globals present). A 200,000-sample fuzz of `nextQuestion()` found zero invariant violations: every question has exactly 4 choices, no duplicate choices, the answer is always present, `answer === a*b`, all distractors are positive, and `a ∈ 1..9`, `b ∈ 1..10`. Distractor generation, the Fisher-Yates shuffle, the EWMA, and the weighted-table selection are all correct. The scene's anti-leak discipline (closure-local run state, fresh brain per scene, `goalReached` fire-once latch, single goal wiring, no in-scene replay path) holds.

**However, there is one BLOCKER that breaks the entire happy path.** The gate's teardown calls `destroy("math-gate")` with a string tag, but Kaplay 3001's `destroy()` only accepts a `GameObj` — the tag-based variant is `destroyAll()`. Against the vendored `lib/kaplay.mjs` (3001.0.19), `destroy` is bound to `ir`, defined as `function ir(t){t.destroy()}`. Passing the string `"math-gate"` calls `"math-gate".destroy()`, which is not a function and throws a `TypeError`. Because `close()` is called immediately before `onClear?.()` on a correct answer, the throw aborts before `onClear` runs: the overlay is never removed, `levelCleared` is never set, and the player stays frozen under a permanent dim panel — a hard soft-lock the first time the kid answers correctly. This is the keystone interaction of the phase and it does not work.

A second, dependent issue (WR-01) means that even after fixing the BLOCKER, the green-flash and "LEVEL CLEAR" banner are created and destroyed in the same frame, so the success celebration never renders.

## Critical Issues

### CR-01: `destroy("math-gate")` throws — correct-answer path soft-locks the game

**File:** `src/ui/mathGate.js:201` (also the throw aborts `onClear` at `:191`)
**Issue:**
In Kaplay/Kaboom 3001 the global `destroy(obj)` takes a single `GameObj`; the tag-based bulk removal is `destroyAll(tag)`. The vendored engine confirms this — the public API binds `destroy: ir` where `ir` is:

```js
function ir(t){ t.destroy() }
```

`close()` calls `destroy("math-gate")`, i.e. `ir("math-gate")` → `"math-gate".destroy()` → `TypeError: "math-gate".destroy is not a function`.

Control flow on a correct answer:

```js
close();        // throws inside destroy("math-gate")
onClear?.();    // NEVER reached
```

Consequences on the first correct answer (the core phase deliverable):
- The exception aborts `close()` mid-way (after `keyCtrls.forEach(c => c.cancel())`, before/at `destroy`), so none of the `"math-gate"` objects are destroyed — the dim layer, panel, question, answer boxes, and "LEVEL CLEAR" text all persist forever.
- `onClear?.()` never fires → `levelCleared` stays `false`; the scene's clear hook never runs.
- The player remains `paused` under a permanent overlay → unrecoverable soft-lock.

This is not an edge case: it fires on the very first correct answer, which is the success path the entire phase exists to deliver.

**Fix:** Use the tag-aware API for bulk teardown.

```js
function close() {
  keyCtrls.forEach((c) => c.cancel());
  destroyAll("math-gate"); // tag-based removal; destroy() only accepts a GameObj
}
```

Remember to add `destroyAll` to the engine-globals discipline comment at the top of the file (it is a Kaplay `global: true` primitive, same as `destroy`). After fixing, also resolve WR-01 (the celebration renders for zero frames).

## Warnings

### WR-01: Success celebration (green flash + "LEVEL CLEAR") is destroyed the same frame it is created

**File:** `src/ui/mathGate.js:178-192`
**Issue:**
On a correct answer the code recolors the chosen box green and adds a "LEVEL CLEAR" text object (all tagged `"math-gate"`), then immediately calls `close()` which (once CR-01 is fixed) destroys every `"math-gate"` object synchronously in the same tick:

```js
if (box) box.color = rgb(...ACCENT_GREEN);   // tagged "math-gate"
add([ text("LEVEL CLEAR", ...), "math-gate" ]); // tagged "math-gate"
close();   // destroyAll("math-gate") wipes both before they ever render
```

Nothing renders between the `add` and the `destroyAll`, so the player never sees the green flash or the "LEVEL CLEAR" banner. The comment at line 177 ("flash the chosen box neon-green, show LEVEL CLEAR, then close cleanly") promises feedback that the code prevents. GATE-03's visible "you got it" moment is silently dropped.

**Fix:** Defer the teardown so the celebration is visible for a beat, e.g. via Kaplay's `wait()`:

```js
cleared = true;
if (box) box.color = rgb(...ACCENT_GREEN);
add([ text("LEVEL CLEAR", { size: 30 }), /* ... */ "math-gate" ]);
wait(0.6, () => {        // let the flash + banner render first
  close();
  onClear?.();
});
```

Note: deferring with `wait()` is a scheduler, but it is a fixed one-shot post-success delay, not a countdown/fail timer — it does not violate the "no time pressure" rule (the gate has already been cleared). If a deferred teardown is judged out of scope, at minimum draw the celebration on a separate, non-`"math-gate"` short-lived object so `close()` does not wipe it, or document that the celebration is intentionally instantaneous.

### WR-02: Global jump handler keeps registering buffered jumps while the gate is open

**File:** `src/player.js:73-75` (interacts with `src/scenes/game.js:137`)
**Issue:**
The scene sets `player.paused = true` before opening the gate, which halts `player.onUpdate` (movement via `isKeyDown` stops — good). But the jump press handler in `player.js` is a **global** controller, not object-scoped:

```js
onKeyPress(JUMP_KEYS, () => { buffer = CONFIG.BUFFER_MS / 1000; });
```

`player.paused` does not pause global event controllers (verified against the engine: `onKeyPress` is the global `xn`, independent of any object's `paused` flag). So pressing space/up/W while the gate is open still mutates `buffer`. Today this is latent rather than exploitable: the buffered jump is only consumed inside the paused `player.onUpdate`, so it cannot fire mid-gate, and `buffer` decays. But it is fragile — any future code that unpauses the player without first zeroing `buffer` (or any future object-vs-global refactor) would let a stale buffered jump fire an immediate lurch on resume, exactly the failure mode the scene's `player.vel = vec2(0)` comment (game.js:136) is trying to prevent for velocity.

**Fix:** Either gate the buffer write on pause state, or have the gate suppress jump input explicitly. Minimal hardening in `player.js`:

```js
onKeyPress(JUMP_KEYS, () => {
  if (player.paused) return; // do not queue jumps while the run is frozen
  buffer = CONFIG.BUFFER_MS / 1000;
});
```

This keeps the freeze airtight regardless of how the player is later unpaused.

### WR-03: Number-key handlers (1–4) fire even when no gate is open / overlap with future global keybinds

**File:** `src/ui/mathGate.js:150`
**Issue:**
The 1–4 key controllers are correctly cancelled on `close()` (good anti-leak). However, this is sound only because CR-01 currently prevents `close()` from completing on the success path — wait, no: `keyCtrls.forEach(c => c.cancel())` runs *before* the throwing `destroy` call, so cancellation does survive CR-01. The real concern is forward-looking: the gate binds bare `1`/`2`/`3`/`4` globally with no guard against other systems binding the same keys, and `choose(i)` is the only consumer. If a later phase adds global numeric hotkeys (level select, debug), the gate's handlers and those would both fire while the gate is open. Today there is no collision, so this is a robustness/maintainability warning, not a live bug.

**Fix:** Lowest-risk option is to leave as-is and document the reservation of keys 1–4 for the gate. If defensiveness is wanted, scope the handlers' effect through the existing `cleared`/bounds guards (already present in `choose`) and add a short comment that 1–4 are gate-reserved global keys so future phases avoid rebinding them.

## Info

### IN-01: Brain selects only tables 1–9 — `a` can never be a "10 times" question, and table 10 is excluded

**File:** `src/math/brain.js:182-185`, `src/config.js:55-56`
**Issue:**
`weightedRandom` only ever returns a table from `HARD_TABLES` (6–9) or `EASY_TABLES` (1–5). The multiplicand `b` ranges 1–10, but `a` (the table) never includes 10. This matches the documented design (6–9 focus with 1–5 confidence mix) and the JSDoc ("`a`=table (1..9)"), so it is intentional, not a bug. Flagged only so the deliberate exclusion of the 10× table is on record (the project targets 6–9 tables, so this is correct).

**Fix:** None required — confirm this is intended; no 10× questions will ever appear.

### IN-02: Redundant string concatenation for the question display

**File:** `src/ui/mathGate.js:61`
**Issue:**
```js
const display = q.a + " " + "×" + " " + q.b;
```
`" " + "×" + " "` is three constant literals concatenated at runtime for no reason; it reads awkwardly. The `×` (U+00D7) glyph also depends on the loaded Kaplay font containing that codepoint — if the bitmap font lacks it, it renders as tofu/blank (the line's own comment acknowledges a possible fall back to `'x'`, but no such fallback is implemented).

**Fix:** Simplify and make the glyph choice explicit:

```js
const display = `${q.a} × ${q.b}`; // ensure the gate font includes U+00D7, else use "x"
```
Verify the active font renders `×`; if uncertain, use ASCII `x` to guarantee legibility for a 12-year-old.

### IN-03: Unreachable last-resort pad block in `generateDistractors`

**File:** `src/math/brain.js:164-169`
**Issue:**
The `while (chosen.length < 3)` pad loop is documented as "should be unreachable for multiplicand 1–10 range," and the 200k-sample fuzz confirmed it never triggers (distractor pool always reaches ≥3 via ±1/±2, the wrong-table value, and ±3). It is harmless defensive code, but it is dead in practice and adds surface area. Keeping it is defensible as a safety net.

**Fix:** Optional — keep as a guard, or replace with an assertion/comment that the prior steps guarantee ≥3 candidates, to make the invariant explicit rather than silently padding.

---

_Reviewed: 2026-06-26T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
