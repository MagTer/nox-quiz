---
phase: 16-remaining-mechanics-difficulty-curve
verified: 2026-07-03T14:33:00Z
status: code-verified / human-needed
score: 10/10 must-haves code-verified; 4 runtime behaviors human-needed
human_sign_off: Not yet recorded — real-browser boot items in this report are flagged `human_needed` because this execution context has no browser runtime.
behavior_unverified: 4
behavior_unverified_items:
  - truth: "MECH-04 runtime: checkpoint gates block, open on correct answer, and never soft-lock"
    test: "Walk into the gate near x:600 and later x:1300; answer incorrectly and correctly; move/jump afterward."
    expected: "Gate blocks entry; wrong answer re-asks with no penalty; correct answer removes gate+glyph and player can move/jump immediately."
    why_human: "Collision removal, player.paused toggling, and same-frame re-collision avoidance are runtime-only invariants."
  - truth: "MECH-05 runtime: enemy blocks with custom prompt, disappears on correct answer, and never deals contact damage"
    test: "Walk into the enemy near x:1000; answer incorrectly and correctly."
    expected: "Enemy blocks entry with 'Answer to defeat the guard:' prompt; wrong answer re-asks; correct answer removes enemy+glyph; touching enemy never resets position or ends the run."
    why_human: "The no-contact-damage contract and custom prompt rendering can only be confirmed in a real browser."
  - truth: "MECH-03 runtime: collect zone opens prompt-only challenge, spawns pickups from the same question, clears on correct pickup, and never punishes on wrong pickup"
    test: "Walk into the zone near x:300; choose wrong and correct numeric pickups."
    expected: "Overlay shows only the question; numeric pickups appear; wrong pickup gives only a brief visual nudge, question stays open; correct pickup closes overlay, removes pickups, and unfreezes the player."
    why_human: "Pickup spawning, value sync with the prompt, and non-punishing feedback are runtime behaviors invisible to static analysis."
  - truth: "LVL-03 runtime: level-01 still draws questions from tables 6–9 and existing gate/door behavior is unchanged"
    test: "Inspect console questions and play to the goal / door."
    expected: "All questions are 6–9 multiplication; end-of-level gate and locked door at x:1400 behave identically to Phase 15."
    why_human: "The allowedTables data seam is wired correctly in code, but the actual question distribution and existing-behavior no-drift require live play."
---

# Phase 16: Remaining Mechanics + Difficulty Curve Verification Report

**Phase Goal:** Add defeat-enemy (MECH-05), multiple checkpoint gates (MECH-04), collect-the-answer (MECH-03), and prove the per-level `allowedTables` difficulty seam (LVL-03) still feeds the unchanged brain.
**Verified:** 2026-07-03T14:33:00Z
**Status:** code-verified / human-needed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | MECH-04: `src/mechanics/gates.js` exports `wireGates({ player, brain })`, calls `openChallenge`, and destroys the gate + glyph before unpausing | ✓ CODE VERIFIED | `src/mechanics/gates.js:37` exports `wireGates`; lines 23, 42-60 call `openChallenge` and order `destroy(gateObj)` / `destroy(gateObj.glyphObj)` strictly before `player.paused = false`. |
| 2 | MECH-05: `src/mechanics/enemy.js` exports `wireEnemy({ player, brain })`, uses the prompt "Answer to defeat the guard:", and contains no `respawn` token | ✓ CODE VERIFIED | `src/mechanics/enemy.js:37` exports `wireEnemy`; line 49 sets custom prompt; `grep -c respawn src/mechanics/enemy.js` = 0. |
| 3 | MECH-03: `src/mechanics/collect.js` exports `wireCollect({ player, brain })`, passes `renderChoices: false` and the same `question: q` used to spawn pickups | ✓ CODE VERIFIED | `src/mechanics/collect.js:38` exports `wireCollect`; line 66 uses `const q = brain.nextQuestion()`; lines 82-87 call `openChallenge({ brain, question: q, renderChoices: false, prompt: ... })`. |
| 4 | MECH-03/04/05: all three modules are thin callers of `src/ui/challenge.js` and never import `mathGate.js` | ✓ CODE VERIFIED | Each module imports `openChallenge` from `../ui/challenge.js`; none import `../ui/mathGate.js`. |
| 5 | LVL-03: `src/scenes/game.js` still passes `allowedTables: level.allowedTables` into `createBrain` | ✓ CODE VERIFIED | `src/scenes/game.js:81` `allowedTables: level.allowedTables` preserved unchanged. |
| 6 | Integration: `src/scenes/game.js` imports and calls `wireGates`, `wireEnemy`, and `wireCollect` once each, immediately after `wireDoor` | ✓ CODE VERIFIED | `src/scenes/game.js:28-30` imports; lines 232-234 calls. |
| 7 | Data: `src/levels/level-01.js` adds `mathGates`, `enemies`, `collectZones`, and `answerPickupSlots` without changing existing geometry; `allowedTables` stays `[6, 7, 8, 9]` | ✓ CODE VERIFIED | Arrays present in geometry; `grep -q 'allowedTables: \[6, 7, 8, 9\]'` passes; `node --check src/levels/level-01.js` passes. |
| 8 | Builder: `src/levels/build.js` instantiates tagged `math-gate`, `enemy`, `answer-zone`, and `answer-pickup-slot` entities with correct static/trigger bodies | ✓ CODE VERIFIED | Blocking `math-gate` and `enemy` use `body({ isStatic: true })`; `answer-zone` and slots use `area()` without `body()`; `zoneObj.slots` and `slotObj.slotIndex` are stashed. |
| 9 | Shared seam: `src/ui/challenge.js` accepts optional `question` and `renderChoices`, returns `{ close }`, and remains backward-compatible | ✓ CODE VERIFIED | Signature at `src/ui/challenge.js:64`; `question ?? brain.nextQuestion()` at line 71; `renderChoices` guard at line 124; `return { close }` at line 222. |
| 10 | Gates: `check-gate.sh`, `check-import-safety.sh`, `check-safety.sh`, and `smoke-progress.mjs` all pass now that game.js is wired | ✓ CODE VERIFIED | See Behavioral Spot-Checks below — all four exit 0. |

**Score:** 10/10 truths code-verified; 4 runtime behaviors flagged `human_needed` below.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/mechanics/gates.js` | MECH-04 checkpoint gate wiring | ✓ EXISTS + SUBSTANTIVE | 57 lines, exports `wireGates`, follows door.js destroy-before-unpause pattern. |
| `src/mechanics/enemy.js` | MECH-05 defeat-enemy wiring | ✓ EXISTS + SUBSTANTIVE | 57 lines, exports `wireEnemy`, custom prompt, no `respawn` token. |
| `src/mechanics/collect.js` | MECH-03 collect-the-answer wiring | ✓ EXISTS + SUBSTANTIVE | 116 lines, exports `wireCollect`, same-question sync, prompt-only overlay. |
| `src/scenes/game.js` | Integration call sites | ✓ WIRED | Three additive imports + three additive calls after `wireDoor`. |
| `src/config.js` | MATH_GATE / ENEMY / COLLECT blocks | ✓ EXISTS | Blocks present with the specified palette/dimensions. |
| `src/levels/level-01.js` | Authored mechanic placements | ✓ EXISTS | Two gates, one enemy, one collect zone, four pickup slots. |
| `src/levels/build.js` | Entity instantiation | ✓ EXISTS | Four guarded loops create tagged entities. |
| `src/ui/challenge.js` | Extended shared seam | ✓ EXISTS | Optional `question`, `renderChoices`, `{ close }` return. |
| `scripts/check-gate.sh` | Thin-caller coverage | ✓ EXTENDED | Assertions 11-13 cover gates/enemy/collect. |
| `scripts/check-import-safety.sh` | a727c13 coverage | ✓ EXTENDED | New modules in Section 0 and Section 2 loops. |
| `scripts/smoke-progress.mjs` | Geometry fixture in sync | ✓ IN SYNC | Expected geometry includes the four new arrays; exits 0. |

**Artifacts:** 11/11 verified.

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/scenes/game.js` | `src/mechanics/gates.js` | imports `wireGates`, calls once with `player` and `brain` | ✓ WIRED | `src/scenes/game.js:29` import; `src/scenes/game.js:232` call. |
| `src/scenes/game.js` | `src/mechanics/enemy.js` | imports `wireEnemy`, calls once with `player` and `brain` | ✓ WIRED | `src/scenes/game.js:30` import; `src/scenes/game.js:233` call. |
| `src/scenes/game.js` | `src/mechanics/collect.js` | imports `wireCollect`, calls once with `player` and `brain` | ✓ WIRED | `src/scenes/game.js:31` import; `src/scenes/game.js:234` call. |
| `src/scenes/game.js` | `src/math/brain.js` | `createBrain({ ..., allowedTables: level.allowedTables })` preserved | ✓ WIRED | `src/scenes/game.js:78-82`. |
| `src/mechanics/collect.js` | `src/ui/challenge.js` | calls `openChallenge({ brain, question: q, renderChoices: false, prompt })` | ✓ WIRED | `src/mechanics/collect.js:82-87`. |
| `src/mechanics/gates.js` | `src/ui/challenge.js` | calls `openChallenge({ brain, onSuccess })` | ✓ WIRED | `src/mechanics/gates.js:42-60`. |
| `src/mechanics/enemy.js` | `src/ui/challenge.js` | calls `openChallenge({ brain, prompt, onSuccess })` | ✓ WIRED | `src/mechanics/enemy.js:42-60`. |
| `src/levels/level-01.js` | `src/levels/build.js` | new geometry arrays consumed by `buildLevel` | ✓ WIRED | `src/levels/build.js` reads `g.mathGates ?? []`, `g.enemies ?? []`, `g.collectZones ?? []`, `g.answerPickupSlots ?? []`. |

**Wiring:** 8/8 connections verified.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Structural firewall gate | `bash scripts/check-gate.sh` | `gate checks: PASS` (exit 0) | ✓ PASS |
| Import-safety / a727c13 gate | `bash scripts/check-import-safety.sh` | `import-safety checks: PASS` (exit 0) | ✓ PASS |
| ADHD-safety gate | `bash scripts/check-safety.sh` | `safety checks: PASS` (exit 0) | ✓ PASS |
| LVL-02 regression + new mechanic fixtures | `node scripts/smoke-progress.mjs` | `smoke-progress: PASS` (exit 0) | ✓ PASS |
| Syntax of all new/modified modules | `node --check` on challenge.js, config.js, level-01.js, build.js, gates.js, enemy.js, collect.js, game.js | All pass | ✓ PASS |
| Real-browser MECH-03/04/05 + LVL-03 sign-off | Agent/browser runtime boot | Not performed — no headless browser or manual session available in this execution context | ⚠️ HUMAN NEEDED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MECH-03 | 16-02, 16-03 | Collect-the-answer with synced question/pickups and non-punishing wrong pickup | ✓ SATISFIED (code) | collect.js implementation verified above; runtime pickup behavior human-needed. |
| MECH-04 | 16-02, 16-03 | Multiple checkpoint gates opening independently with no soft-lock | ✓ SATISFIED (code) | gates.js implementation verified above; runtime blocking/opening human-needed. |
| MECH-05 | 16-02, 16-03 | Defeat-enemy with custom prompt and no contact damage | ✓ SATISFIED (code) | enemy.js implementation verified above; runtime behavior human-needed. |
| LVL-03 | 16-02, 16-03 | Per-level allowedTables difficulty seam into unchanged brain | ✓ SATISFIED (code) | `allowedTables: level.allowedTables` preserved; runtime table distribution human-needed. |

No orphaned requirements.

### Anti-Patterns Found

No debt markers (TBD/FIXME/XXX/HACK), no empty stub returns, no hardcoded-empty data flowing to render found in any Phase-16 file.

## Human Verification Required

The phase's own Plan 03 (`16-03-PLAN.md`) designed a mandatory, blocking, `autonomous:false` human-verify checkpoint for exactly this reason — greps proving code is present and wired is not proof the player can still move after a gate opens, that wrong answers never punish, or that the LVL-03 table pool still feels like tables 6–9. All static/code-level evidence above supports the claims, but the following must still be confirmed live:

### 1. MECH-04 — Checkpoint gates block, open independently, and never soft-lock
**Test:** Serve `src/` over HTTP and open the game. Walk into the first checkpoint gate near x:600. Answer incorrectly at least twice; confirm the same question stays open, the picked box tints red and shakes, and the gate stays locked. Answer correctly; confirm the gate body and "?" glyph disappear and the player can immediately move/jump again. Continue to the final run and test the second gate near x:1300 independently.
**Expected:** Each gate blocks until its own correct answer; wrong answers re-ask with no penalty; correct answer removes gate+glyph and resumes full control.
**Result:** ⚠️ HUMAN NEEDED

### 2. MECH-05 — Enemy blocks, prompts, and disappears on correct answer with no contact damage
**Test:** Walk into the enemy near x:1000. Confirm the challenge opens with the prompt "Answer to defeat the guard:". Answer incorrectly at least twice; confirm no penalty. Answer correctly; confirm the enemy body and "!" glyph disappear and the player can move/jump immediately. Walk into where the enemy was before answering — it must never reset position or end the run.
**Expected:** Enemy is a pure blocker that removes itself on correct answer; touching it is never harmful.
**Result:** ⚠️ HUMAN NEEDED

### 3. MECH-03 — Collect zone opens prompt-only challenge and clears only on correct pickup
**Test:** Walk into the collect zone near x:300. Confirm the overlay shows only the question prompt (no answer boxes) and numeric pickups appear. Walk into a wrong pickup; confirm only a brief visual nudge occurs, the same question stays open, and the pickups remain. Walk into the correct pickup; confirm the overlay closes, the pickups disappear, and the player can move again.
**Expected:** Prompt-only overlay, synced pickup values, non-punishing wrong pickup, clear on correct pickup.
**Result:** ⚠️ HUMAN NEEDED

### 4. LVL-03 — Difficulty seam and existing behavior no-drift
**Test:** Open the browser console and inspect questions asked throughout the level; confirm they are drawn from tables 6–9. Play to the end-of-level goal and confirm the existing math gate behaves identically (wrong re-asks, correct shows LEVEL CLEAR, awards XP, returns to select). Confirm the locked door at x:1400 still blocks and opens cleanly.
**Expected:** Table pool unchanged from v3.0; existing gate/door behavior identical to Phase 15.
**Result:** ⚠️ HUMAN NEEDED

## Gaps Summary

All code-level requirements are satisfied and the full static suite is green. The only remaining gap is the mandatory real-browser boot sign-off for runtime behavior, recorded here as `human_needed` because this execution context cannot run a browser.

---

_Verified: 2026-07-03T14:33:00Z_
_Verifier: Claude (gsd-executor)_
