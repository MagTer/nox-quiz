---
phase: 04-dungeon-renderer
reviewed: 2026-06-21T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - math-lab.html
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-06-21
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Phase 4 adds MODULE 11 (DungeonRenderer IIFE), CombatInputHandler, combat panel HTML, HP bars, CSS `@keyframes floatUp`, and four dungeon screen panels. The XSS posture is sound — `textContent` is used throughout with the single permitted `innerHTML = ''` clear. The lock pattern, mode guard order, and `parseInt` radix are all correct. However, one critical crash path exists: `CombatInputHandler.handleAnswer()` dereferences `currentQuestion` when it is `null` (the initial value), which will throw a TypeError the moment a change event fires before `nextQuestion()` has been called. Three warnings cover a permanent lock on the kill/death paths, a layout ordering mismatch against the CONTEXT.md spec, and a `do-while` infinite-loop risk when `lastFlavorIndex` holds a stale index at array boundaries. Two info items cover the missing question text in the combat panel and a debug console.table call left in the final build.

---

## Critical Issues

### CR-01: `CombatInputHandler.handleAnswer()` crashes on null `currentQuestion`

**File:** `math-lab.html:1595`
**Issue:** `CombatInputHandler.currentQuestion` is initialised to `null` (line 1580). `handleAnswer()` reads `q.answer` at line 1596 without a null-guard. If the browser fires a `change` event on `#combat-question` before `CombatInputHandler.nextQuestion()` has been called (e.g., any stale radio state, or a console test that calls `App.transition('combat')` before rendering the first question), `q` is `null` and `const isCorrect = (selected === q.answer)` throws `TypeError: Cannot read properties of null`. The lock is already set to `true` at line 1592, so after the crash the combat fieldset is permanently frozen for the session with no recovery path.

**Fix:**
```javascript
handleAnswer(selectedValue) {
  // Guard: no question loaded yet — ignore spurious change events
  if (!CombatInputHandler.currentQuestion) return;

  CombatInputHandler.locked = true;
  // ... rest of method unchanged
```

---

## Warnings

### WR-01: Lock never releases on kill or death paths

**File:** `math-lab.html:1622-1629`
**Issue:** When `result.killed` or `result.died` is true, `handleAnswer()` calls `App.transition()` and immediately returns — it never sets `CombatInputHandler.locked = false`. The lock is intentionally left set (see threat model T-04-03-04: "new combat session via startCombat() sets fresh state"). However, there is no code path in Phase 4 that resets `CombatInputHandler.locked` as part of starting a new session. Phase 5 wires the continue/retry buttons; if those buttons call `startCombat()` but not a `CombatInputHandler.locked = false`, the first answer in the next session will be silently swallowed by the guard at line 1585. This is a latent bug that will be triggered the moment Phase 5 wires the buttons.

**Fix:** Either reset the lock inside `nextQuestion()` (so it is always correct on a fresh question load) or add an explicit `reset()` method:
```javascript
// Option A — reset in nextQuestion():
nextQuestion() {
  CombatInputHandler.locked = false;   // ensure clean state at question boundary
  const q = QuestionSelector.selectNext(PlayerState);
  CombatInputHandler.currentQuestion = q;
  DungeonRenderer.renderCombatQuestion(q);
},

// Option B — expose reset() for Phase 5 to call alongside startCombat():
reset() {
  CombatInputHandler.locked = false;
  CombatInputHandler.currentQuestion = null;
}
```

### WR-02: Combat panel layout order deviates from CONTEXT.md spec

**File:** `math-lab.html:486-512`
**Issue:** CONTEXT.md D-01 specifies the top-to-bottom layout as: Room indicator → Enemy sprite + enemy HP bar → Feedback text area → Player HP bar → Question fieldset. The implementation inserts `#combat-flavor` between the enemy area and `#combat-feedback` (lines 499 and 502), placing flavor text above feedback. Plan 02 Task 1 description also specifies flavor between the enemy area and the feedback area. However, the CONTEXT.md spec does not list flavor text as a distinct layout slot at all — it was added by Plan 02 after CONTEXT was written. The result is:

```
combat-room-indicator   ← correct
combat-enemy-area       ← correct
combat-flavor           ← NOT in D-01; sits above feedback
combat-feedback         ← per D-01 this should be here
player-hp-container     ← correct
combat-question         ← correct
```

This may be intentional (Plan 02 effectively amended D-01 by adding `#combat-flavor`), but the layout puts RPG flavor copy immediately after the enemy sprite and before combat feedback, which means the feedback text ("Attack!", "You took a hit!") appears below the flavor text. If the intent was that feedback replaces or sits adjacent to flavor, the visual result differs from a user reading CONTEXT.md. The discrepancy should be resolved by either updating CONTEXT.md or confirming the actual intended order.

**Fix:** If flavor above feedback is correct, update CONTEXT.md D-01 to reflect the actual layout order. If feedback should appear before flavor, swap lines 499 and 502:
```html
<!-- Feedback first, then flavor -->
<p id="combat-feedback"></p>
<p id="combat-flavor"></p>
```

### WR-03: `getFlavorText` do-while loop can spin infinitely on stale `lastFlavorIndex` at boundary

**File:** `math-lab.html:1257-1263`
**Issue:** `getFlavorText` uses a do-while that rejects any `idx` equal to `lastFlavorIndex[enemyName]`. For a 3-element array this is safe in normal rotation. However, `lastFlavorIndex` is a module-level object that persists for the lifetime of the page. If `lastFlavorIndex[enemyName]` is `undefined` (first call for a new enemy), `idx === undefined` is always `false`, so the loop exits immediately — that is fine. But if `FLAVOR[enemyName]` is replaced in a future Phase 6 edit with a **1-element array** and `lastFlavorIndex[enemyName]` equals `0`, the do-while has no valid index to return (`idx` must not equal 0, but 0 is the only valid index) and loops forever, hanging the browser tab. The `lines.length === 1` guard at line 1257 returns `idx = 0` directly and skips the do-while, so for the current arrays this is safe. The bug only manifests if Phase 6 reduces an enemy's lines to 1 without seeing this guard is only checked once at the top. The guard is present but the comment should make this dependency explicit.

**Fix:** Add an assertion comment and a defensive guard inside the do-while:
```javascript
function getFlavorText(enemyName) {
  const lines = FLAVOR[enemyName];
  if (!lines || lines.length === 0) return '';

  let idx;
  if (lines.length === 1) {
    idx = 0;
  } else {
    // Safety: do-while only terminates when lines.length > 1
    // If length were 1 and lastFlavorIndex[enemyName] === 0, this would loop forever.
    // The lines.length === 1 guard above prevents reaching here with a single-entry array.
    do {
      idx = Math.floor(Math.random() * lines.length);
    } while (idx === lastFlavorIndex[enemyName]);
  }

  lastFlavorIndex[enemyName] = idx;
  return lines[idx];
}
```
The fix is a comment only for Phase 4; Phase 6 must not reduce any FLAVOR array below 2 entries while this code is in place.

---

## Info

### IN-01: Combat question text not rendered — answer options shown without the multiplication expression

**File:** `math-lab.html:1295-1331`
**Issue:** `renderCombatQuestion()` builds four radio option buttons but never writes `questionObj.question` (e.g. `"7 × 8"`) to any visible element. Plan 02 Task 1 notes this is intentional for Phase 4: "Phase 4 combat questions show only the options, not the text." However, showing four numbers with no visible multiplication expression means the player cannot form the question in their head — they must guess or reverse-engineer from the options. For a math drill app targeting a 12-year-old, this makes combat functionally unplayable without a question prompt. This decision should be confirmed with the product owner before Phase 5 wires the flow end-to-end.

**Fix:** Add a `<p id="combat-question-text"></p>` element to the combat panel HTML (per the Plan 02 suggestion) and write to it in `renderCombatQuestion`:
```javascript
const qtEl = document.getElementById('combat-question-text');
if (qtEl) qtEl.textContent = questionObj.question + ' = ?';
```

### IN-02: `debugAccuracy` console helper left in production code

**File:** `math-lab.html:1680-1687`
**Issue:** `window.debugAccuracy` is assigned inside `DOMContentLoaded` and exposed on the global `window` object. This was present before Phase 4 but is flagged here as it remains in the shipped file. It leaks internal accuracy state to any script with window access and, while low-risk for a single-HTML file, is a debug artifact in production code.

**Fix:** Remove the `window.debugAccuracy` assignment before shipping, or wrap it in a development flag:
```javascript
// Dev only — remove before production release
if (location.hostname === 'localhost' || location.search.includes('debug=1')) {
  window.debugAccuracy = () => { ... };
}
```

---

_Reviewed: 2026-06-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
