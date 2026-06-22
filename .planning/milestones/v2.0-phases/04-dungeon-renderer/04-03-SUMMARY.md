---
plan: 04-03
phase: 04-dungeon-renderer
status: complete
tags: [combat-input-handler, combat-loop, answer-handling, hp-bars, damage-animation, rpg-feedback]
subsystem: combat-input-handler
dependency_graph:
  requires: [04-02]
  provides: [CombatInputHandler, COMB-02, COMB-04, COMB-05, ENE-03]
  affects: [math-lab.html]
tech_stack:
  added: []
  patterns: [change-event-delegation-on-fieldset, mode-guard-first, lock-guard-reentrancy, parseInt-radix-10, textContent-only-feedback]
key_files:
  modified:
    - math-lab.html
decisions:
  - CombatInputHandler uses change event delegation on #combat-question fieldset — mirrors InputHandler pattern; arrow-key navigation fires change (not click) so this catches all input methods
  - Mode guard App.mode !== 'dungeon' is first check before locked guard — ensures v1 quiz click events are rejected immediately without touching locked state
  - On killed/died paths, App.transition() is called and handler returns — locked state intentionally not released (T-04-03-04 mitigated; new session via startCombat resets state)
  - result.leveledUp branch calls both Renderer.showLevelUpOverlay and Renderer.updateHud — v1 HUD stays live in dungeon mode showing XP/level progress
  - CombatInputHandler.nextQuestion() is its own method (not inlined in setTimeout) — clean separation, testable, mirrors InputHandler pattern
  - CombatInputHandler does NOT call PlayerState.updateAccuracy() — combat answers skip v1 per-table accuracy tracking per plan spec (Phase 5 may extend)
metrics:
  duration: ~10m
  completed: 2026-06-21
  tasks_completed: 1
  files_modified: 1
---

# Phase 04 Plan 03: CombatInputHandler — Combat Answer Loop Summary

## One-liner

CombatInputHandler wires the complete combat answer loop: radio change event → CombatEngine.resolveAnswer() → HP bar drain + floating damage number + RPG feedback text → kill/death screen transitions or auto-advance to next question.

## What was built

### Task 1: Add CombatInputHandler inside DOMContentLoaded and call setup() (commit 1c3d259)

**CombatInputHandler** inserted inside DOMContentLoaded after the `InputHandler` const block and before `App._nextQuestion` assignment.

**Structure:**

- `locked: false` — boolean re-entrance guard; prevents double-answer during 1s feedback pause
- `currentQuestion: null` — holds active question object from QuestionSelector

**Method `setup()`:**
- Registers `change` event listener on `document.getElementById('combat-question')` (combat fieldset)
- Guard order: (1) `App.mode !== 'dungeon'` first, (2) `CombatInputHandler.locked`, (3) INPUT/radio type check
- Calls `CombatInputHandler.handleAnswer(e.target.value)` on valid input

**Method `handleAnswer(selectedValue)`:**
- Sets `locked = true`
- `parseInt(selectedValue, 10)` — explicit radix (security pattern, consistent with InputHandler)
- Calls `CombatEngine.resolveAnswer(isCorrect)` → stores result
- `DungeonRenderer.updateHP(result.enemyHP, result.playerHP)` — HP bars drain within 300ms (CSS transition)
- Correct: `showDamageNumber(#combat-enemy-area, DAMAGE_CORRECT, true)` → green float over enemy
- Wrong: `showDamageNumber(#player-hp-container, DAMAGE_WRONG, false)` → red float over player bar
- Feedback: `'Critical hit!'` (20% random), `'Attack!'` (80%) for correct; `'You took a hit!'` for wrong
- `result.leveledUp` → calls `Renderer.showLevelUpOverlay()` + `Renderer.updateHud()` (v1 HUD stays live)
- `result.killed` → `App.transition('loot')` + return (no question advance)
- `result.died` → `App.transition('dead')` + return (no question advance)
- Otherwise → `setTimeout(() => { locked=false; nextQuestion(); }, CONFIG.ADVANCE_DELAY_MS)`

**Method `nextQuestion()`:**
- `QuestionSelector.selectNext(PlayerState)` → stores in `CombatInputHandler.currentQuestion`
- `DungeonRenderer.renderCombatQuestion(q)` — renders 4 options in combat fieldset

**Bootstrap call:**
- `CombatInputHandler.setup()` added after `InputHandler.setup()` in the Bootstrap section

## Verification

Acceptance criteria verified:

- `grep -c 'CombatInputHandler' math-lab.html` → 12 (≥ 6 required) ✓
- `grep -c 'CombatInputHandler\.setup()' math-lab.html` → 1 (setup() call in bootstrap) ✓
- `grep -c "App.mode !== 'dungeon'" math-lab.html` → 2 (comment + guard in listener; 1 functional guard) ✓
- `grep -c 'parseInt(selectedValue, 10)' math-lab.html` → 2 (InputHandler + CombatInputHandler) ✓
- `grep -c 'CombatEngine\.resolveAnswer' math-lab.html` → 1 ✓
- `grep -i 'showFeedback.*[Cc]orrect\|showFeedback.*[Ww]rong\b' math-lab.html` → 0 (no forbidden words in feedback) ✓
- No new `innerHTML` writes added by this plan (CombatInputHandler uses zero innerHTML) ✓

## Threat Model Compliance

| Threat ID | Status |
|-----------|--------|
| T-04-03-01 | MITIGATED — `parseInt(selectedValue, 10)` with radix; integer equality comparison |
| T-04-03-02 | MITIGATED — Mode guard first; `name="combat-answer"` in combat options vs `name="answer"` in v1 options; distinct radio groups |
| T-04-03-03 | MITIGATED — v1 InputHandler.handleAnswer has `if (App.mode !== 'quiz') return;`; CombatInputHandler uses `App.mode !== 'dungeon'`; XP only via CombatEngine.resolveAnswer |
| T-04-03-04 | MITIGATED — killed/died paths call App.transition() and return; no setTimeout created; lock held permanently until new session via startCombat() |

## Deviations from Plan

### Pre-existing deviation (not introduced by this plan)

**innerHTML count: 3 (plan acceptance criterion expected ≤ 2)**
- The plan criterion anticipated 2 innerHTML uses: `DOM.xpBar.innerHTML = ''` (Renderer) + `list.innerHTML = ''` (DungeonRenderer).
- A third pre-existing use `DOM.optionsList.innerHTML = ''` in `Renderer.showQuestion()` was present before Phase 4.
- CombatInputHandler adds zero innerHTML uses. The count remains unchanged from Plan 02 baseline.
- This is a documentation inaccuracy in the plan criterion, not a regression from Plan 03.

## Known Stubs

- `CombatInputHandler.currentQuestion` starts as `null`. Caller must call `CombatInputHandler.nextQuestion()` (or set `currentQuestion` directly) before the first answer is processed. Phase 5 wires the full dungeon-map → startCombat → renderCombat → nextQuestion() sequence.
- `loot-continue`, `floor-summary-continue`, `dead-retry` button `onclick` handlers are not wired in Phase 4 (per plan spec — Phase 5 concern).

## Phase 4 Requirements Coverage

| Requirement | Status |
|-------------|--------|
| COMB-02: HP bars visible during combat; drain on answer within 300ms | COMPLETE — updateHP() called in handleAnswer; CSS transition: width 300ms ease handles visual drain |
| COMB-04: Floating damage number animates and disappears within 500ms | COMPLETE — showDamageNumber() called in handleAnswer with animationend + 600ms fallback |
| COMB-05: RPG-themed combat copy; no "correct"/"wrong" in feedback | COMPLETE — 'Attack!', 'Critical hit!', 'You took a hit!' only; grep confirmed 0 forbidden occurrences |
| ENE-03: Flavor text rotates per enemy (no same-line repeat) | COMPLETE (Phase 02) — do-while guard in getFlavorText(); renderCombatQuestion() refreshes on each question |

## Self-Check: PASSED

- Commit `1c3d259` exists in git log ✓
- `CombatInputHandler` present 12 times in math-lab.html ✓
- `CombatInputHandler.setup()` call present in bootstrap section ✓
- Mode guard `App.mode !== 'dungeon'` is first check in change listener ✓
- `parseInt(selectedValue, 10)` present in CombatInputHandler.handleAnswer ✓
- `CombatEngine.resolveAnswer` called exactly once (in handleAnswer) ✓
- Feedback strings: 'Attack!', 'Critical hit!', 'You took a hit!' — no forbidden words ✓
- `handleAnswer` calls: updateHP, showDamageNumber, showFeedback, transitions or nextQuestion ✓
- v1 InputHandler unchanged (verified by git diff showing only additions) ✓
