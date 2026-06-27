---
phase: 10-math-gate-integration-port-the-brain
verified: 2026-06-26T00:00:00Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: # none — initial verification
human_verification:
  - test: "Serve the game over HTTP (the no-build static app), run the player to the goal."
    expected: "The level pauses and the in-world math gate renders over the dimmed-but-visible level — a dark-grunge panel with the question and 4 answer boxes drawn as Kaplay canvas objects (NOT a browser/system popup). The avatar stays visible behind the dim layer."
    why_human: "GATE-01 is a runtime render assertion (fixed() overlay over a paused scene). The supporting code is present and wired, but a zero-test-framework static Kaplay game cannot assert pixels/visibility headlessly."
  - test: "At the open gate, pick the CORRECT answer once via a number key (1-4) AND, on a fresh run, via mouse click."
    expected: "The interactive overlay tears down cleanly (no TypeError soft-lock), a persistent neon-green 'LEVEL CLEAR' banner appears over the cleared level, and the run ends cleared (player stays frozen). onClear fires exactly once (levelCleared=true)."
    why_human: "GATE-03 correct-answer path + the CR-01 destroyAll fix + the WR-01 persistent-celebration restructure are runtime UI/teardown behaviors. Code-verified present and correct; visible behavior needs a browser."
  - test: "At the open gate, pick a WRONG answer (key or click), then pick again."
    expected: "The chosen box flashes red and the gate shakes, the SAME question stays on screen, the gate stays open and input stays live, and the run never ends (no game-over). A subsequent correct pick still clears the level."
    why_human: "GATE-04 forgiving re-ask is a runtime interaction. The wrong branch (recolor+shake+return, no onClear/close) is code-verified, but the felt 'forgiving, never game-over' experience needs human play."
  - test: "Sit at the open gate without answering for a while; observe the gate over time."
    expected: "Nothing counts down, nothing auto-advances or auto-closes, no time-pressure cue appears anywhere. The gate waits indefinitely for a correct answer."
    why_human: "GATE-05 'no time pressure felt' is an absence-over-time observation. Static greps prove no scheduler/timer token exists in the source, but only a human can confirm the felt no-pressure UX."
  - test: "Clear the level, then replay it (re-enter the game scene) and reach the goal again. Press the number keys 1-4 a few times in the second gate."
    expected: "A FRESH gate opens with no duplicated/stacked keypress effects (each key press selects exactly one box once), and the brain's accuracy/history is reset (no adaptation bleed from the prior run)."
    why_human: "Anti-leak across replays (createBrain per scene + cancel()+destroyAll on close) is the highest-risk area per research. The closure-per-scene brain and controller cancellation are code-verified, but stacked-handler leakage only manifests in a live re-open."
---

# Phase 10: Math-Gate Integration (Port the Brain) — Verification Report

**Phase Goal:** The milestone keystone — the ported, framework-agnostic math brain (6–9-weighted selection) is wired to the level through a single bridge so that reaching the goal opens an in-world, forgiving, no-timer math gate that clears the level on a correct answer. The math port has zero dependency on the game shell.
**Verified:** 2026-06-26
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | `createBrain().nextQuestion()` returns a 4-choice question, answer included, biased 6–9 (GATE-02) | ✓ VERIFIED | Headless node smoke (5000 samples): 0 four-choice/duplicate/answer-missing/`answer!==a*b` failures; **76.6% hard-table (6–9) share** (>50% required). brain.js:181-189. |
| 2 | The brain imports nothing from the engine and runs headlessly in plain node (GATE-06 firewall) | ✓ VERIFIED | Headless `node --input-type=module` import succeeds with no engine globals. Non-comment grep for `kaplay` = none; no `XpCalculator/DUNGEON/combat/potion/SAVE_KEY/toJSON/fromJSON`. brain.js:26 imports only `../config.js`. |
| 3 | Each `createBrain()` yields a fresh, independent closure (no module-level state — anti-leak) | ✓ VERIFIED | No top-level `let/var accuracy|history`; state is closure-local (brain.js:43-55). Two `createBrain()` are distinct objects; `reportResult` on one leaves the other usable (smoke). |
| 4 | `openMathGate({brain,onClear})` renders a fixed, screen-space, dimmed in-world panel + 4 boxes — not a DOM popup (GATE-01) | ✓ VERIFIED (presence+wiring; render is human-checked) | All visuals are Kaplay `add([... fixed(), z(), "math-gate"])` (mathGate.js:70-148). check-gate.sh negative grep: no `innerHTML/document./alert`. `fixed(` present. Visible render → Human #1. |
| 5 | A wrong choice marks/shakes the box, keeps the SAME question, gate stays open — forgiving, no game-over (GATE-04) | ✓ VERIFIED (presence+wiring; feel is human-checked) | Wrong branch recolors red + `shake(6)` + `return` with no `onClear`/`close` and no run-ending state (mathGate.js:174-180). `q` pulled once and reused (mathGate.js:62). Felt forgiveness → Human #3. |
| 6 | A correct choice flashes + LEVEL CLEAR, closes cleanly, calls `onClear()` exactly once (GATE-03) | ✓ VERIFIED (presence+wiring; render is human-checked) | `cleared` latch set before `close()` (mathGate.js:192-194); `onClear?.()` once (217). Persistent `"gate-cleared"` celebration survives `destroyAll("math-gate")` (WR-01 fix, 198-215). Visible clear → Human #2. |
| 7 | Closing cancels every captured key controller AND destroys every `"math-gate"` object (no leaked handlers) | ✓ VERIFIED | `close()`: `keyCtrls.forEach(c=>c.cancel())` + `destroyAll("math-gate")` (mathGate.js:225-228). **CR-01 fix confirmed in source** — buggy `destroy("math-gate")` string-tag call is gone; `destroyAll` present. Replay leak → Human #5. |
| 8 | There is no countdown/timer/time-pressure anywhere in the gate (GATE-05) | ✓ VERIFIED (presence; felt absence is human-checked) | check-gate.sh negative grep: no `setTimeout/setInterval/countdown/wait(/loop(`. No deferred scheduler (WR-01 fix deliberately avoided `wait()`). Felt no-pressure → Human #4. |
| 9 | Reaching the goal opens the gate via the single bridge with a fresh per-scene brain; the old `text("GOAL!")` stub is gone (GATE-03 wiring) | ✓ VERIFIED | `onReachGoal()` calls `openMathGate({brain,onClear})` (game.js:142-152); `const brain = createBrain()` closure-local (game.js:56); freeze preserved (`player.paused = true`, game.js:137); no `text("GOAL!")`; exactly one `player.onCollide("goal"` (check-wiring.sh PASS). |

**Score:** 9/9 truths verified (0 present, behavior-unverified)

> Note: truths 4, 5, 6, 8 are verified at the code level (artifact present + substantive + wired + correct branch logic). Their *runtime visible behavior* is intrinsically non-node-testable in this zero-framework static Kaplay game and is routed to human UAT (not counted as a gap, per phase context). The behavior-dependent state/cleanup invariants (truth 7 teardown, truth 3 anti-leak) have their *code* verified and their *runtime* leak-absence routed to Human #5.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/math/brain.js` | Pure `createBrain()` factory; nextQuestion+reportResult; min 60 lines | ✓ VERIFIED | 207 lines; `export function createBrain`; closure-local state; imports only `../config.js`; headless smoke passes. |
| `src/config.js` | `CONFIG.BRAIN` (verbatim EWMA/tables) + `CONFIG.GATE` (panel/dim) | ✓ VERIFIED | BRAIN: ACCURACY_ALPHA 0.15, MASTERY_THRESHOLD 0.8, STRUGGLE_THRESHOLD 0.6, STRUGGLE_BOOST 1.5, MASTERY_WINDOW 10, HARD_TABLES [6,7,8,9], EASY_TABLES [1,2,3,4,5]. GATE: DIM_OPACITY 0.6, PANEL_W 420, PANEL_H 220. No XP/dungeon constants. |
| `src/ui/mathGate.js` | Single bridge; `openMathGate`; dual input; forgiving/correct branches; min 70 lines | ✓ VERIFIED | 229 lines; `export function openMathGate`; dual input (onClick + onKeyPress 1-4); leak-safe close; CR-01 + WR-01/WR-03/IN-02 fixes present. |
| `src/scenes/game.js` | `onReachGoal()` wired to `openMathGate`; fresh brain; freeze reused | ✓ VERIFIED | Imports createBrain + openMathGate; closure-local brain; handoff in onReachGoal; stub removed; single goal handler. |
| `scripts/check-gate.sh` | Structural firewall/anti-leak/no-timer/no-DOM-sink/one-way gate | ✓ VERIFIED | Runs green: `gate checks: PASS`. 8 assertions encoded. |
| `scripts/check-wiring.sh` | Structural scene-wiring gate | ✓ VERIFIED | Runs green: `wiring checks: PASS`. 6 assertions encoded. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `src/math/brain.js` | `src/config.js` | `CONFIG.BRAIN.*` | ✓ WIRED | 13 `CONFIG.BRAIN.` references; imports `../config.js`. |
| `src/ui/mathGate.js` | `src/math/brain.js` | `brain.nextQuestion()/reportResult()` (one-way, only consumer) | ✓ WIRED | nextQuestion (62), reportResult (170); imports createBrain (34). Brain never imports gate. |
| `src/ui/mathGate.js` | `src/config.js` | `CONFIG.GATE.*` | ✓ WIRED | DIM_OPACITY (77,202), PANEL_W/PANEL_H (85). |
| `src/scenes/game.js` | `src/ui/mathGate.js` | `openMathGate(...)` from onReachGoal (single bridge) | ✓ WIRED | game.js:142; import at 24. |
| `src/scenes/game.js` | `src/math/brain.js` | `createBrain()` fresh per scene (anti-leak) | ✓ WIRED | game.js:56 closure-local; import at 23. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Brain headless import + 4-choice 6–9-biased invariants | `node --input-type=module` 5000-sample smoke | 0 invariant failures; 76.6% hard-table bias; fresh closures | ✓ PASS |
| Gate structural firewall (GATE-01/05/one-way/leak-safe) | `bash scripts/check-gate.sh` | `gate checks: PASS` | ✓ PASS |
| Scene wiring (GATE-03 handoff/freeze/single-handler/stub-removed) | `bash scripts/check-wiring.sh` | `wiring checks: PASS` | ✓ PASS |
| Syntax gate (all 4 modules) | `node --check` | all OK | ✓ PASS |
| CR-01 fix present in source | `grep destroyAll / grep -E 'destroy("math-gate")'` | destroyAll present; buggy string-tag call absent | ✓ PASS |
| Runtime gate render / correct-clears / wrong-reask / no-timer-felt / replay-no-leak | (browser) | not node-testable by design | ? SKIP → human (5 items) |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| scripts/check-gate.sh | `bash scripts/check-gate.sh` | exit 0, `gate checks: PASS` | PASS |
| scripts/check-wiring.sh | `bash scripts/check-wiring.sh` | exit 0, `wiring checks: PASS` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| GATE-01 | 10-02 | In-world gate (not system popup), level paused & visible | ✓ SATISFIED (code) / human render | Kaplay fixed() overlay + dim, no DOM sink. Visible render → Human #1. |
| GATE-02 | 10-01 | 4 multiple-choice, ported weighted selection biased 6–9 | ✓ SATISFIED | Headless smoke: 4 distinct choices incl. answer, 76.6% 6–9 bias. |
| GATE-03 | 10-03 | Correct answer opens/clears the level with a celebration | ✓ SATISFIED (code) / human render | onClear once; persistent LEVEL CLEAR celebration. Visible clear → Human #2. |
| GATE-04 | 10-02 | Wrong answer forgiving — re-ask, no penalty, no progress lost | ✓ SATISFIED (code) / human feel | Wrong branch: recolor+shake+keep same q, no game-over. Feel → Human #3. |
| GATE-05 | 10-02 | No countdown/time pressure | ✓ SATISFIED | No scheduler/timer token (check-gate.sh). Felt → Human #4. |
| GATE-06 | 10-01 | Math brain standalone, no engine dependency (firewall) | ✓ SATISFIED | Headless import; no kaplay/XP/persistence tokens; one-way; closure-per-game anti-leak. |

All 6 phase requirement IDs (GATE-01..06) are claimed across plans 10-01/02/03 and match REQUIREMENTS.md Phase 10 mapping exactly. **No orphaned requirements.**

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | None | — | No TBD/FIXME/XXX, no TODO/HACK/PLACEHOLDER, no stub returns in any of the 4 modified modules + player.js. |

### Human Verification Required

5 items (all are runtime UI/interaction behaviors of a zero-test-framework static Kaplay game; supporting code is present, correct, and wired). See frontmatter `human_verification` for full test/expected/why-human detail:

1. **Gate renders in-world over the paused, dimmed level** (GATE-01) — not a system popup.
2. **Correct answer clears the level** (GATE-03) — no soft-lock (CR-01), persistent LEVEL CLEAR banner (WR-01), onClear once.
3. **Wrong answer is forgiving** (GATE-04) — same question, shake/red, never game-over.
4. **No time pressure felt** (GATE-05) — gate waits indefinitely.
5. **Replay opens a fresh gate with no leaked handlers / no brain adaptation bleed** (anti-leak; highest-risk area).

### Gaps Summary

No gaps. Every must-have is code-verified present, substantive, correctly wired, and (where headlessly testable) behaviorally confirmed:

- The **brain** (GATE-02/06) is fully proven headlessly: 4-choice questions, 76.6% 6–9 bias, zero invariant violations over 5000 samples, clean firewall, fresh closure per game.
- The **gate** and **scene wiring** pass both structural gates green and all syntax checks.
- The **CRITICAL CR-01 bug** (`destroy("math-gate")` string-tag → TypeError soft-lock) is **confirmed fixed in current source** (`destroyAll("math-gate")` at mathGate.js:227; no buggy call remains). The WR-01 (persistent celebration via separate `"gate-cleared"` tag), WR-02 (jump-buffer guard while paused, player.js:72), and WR-03 (key-reservation doc) fixes are all present.

The phase is code-complete and the keystone path is wired end-to-end. Remaining work is exclusively human UAT of runtime visual/interaction behaviors that cannot be asserted without a browser — which is the legitimate, expected verification mode for this no-build static game, not a deficiency. Status is `human_needed` (not `passed`) solely because those UAT items exist.

---

_Verified: 2026-06-26_
_Verifier: Claude (gsd-verifier)_
