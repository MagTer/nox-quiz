---
phase: 01-mvp-core-loop-adhd-safe-mechanics
reviewed: 2026-06-20T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - math-lab.html
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-20
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`math-lab.html` is a single-file vanilla JS quiz game. The overall structure is sound — state modules are cleanly separated, persistence is properly validated, and the distractor generation logic is robust. However, two blockers were found: the XP label is permanently destroyed on first render (visible UI regression), and keyboard navigation is silently broken despite being listed as a design requirement. Three warnings cover aria misconfiguration, a fragile answer-matching pattern, and a reset function that bypasses config constants.

---

## Critical Issues

### CR-01: XP label span erased on first render — permanent UI regression

**File:** `math-lab.html:673`

**Issue:** `renderXpBar()` clears `DOM.xpBar.innerHTML = ''` and then appends only the segment `<div>` elements via a DocumentFragment. The HTML at line 283 contains a `<span class="xp-label">XP</span>` as the first child of `#xp-bar`. This span is destroyed on the very first call to `renderXpBar` (triggered at bootstrap, line 829) and never re-created. Every subsequent render also clears the bar, so the label never reappears. The visual result is a bar of green blocks with no "XP" label beside them.

**Fix:** Either prepend the label span to the fragment before appending, or — simpler — cache the label span and leave it in the DOM by only clearing/replacing the segment children, not the whole container:

```javascript
renderXpBar(xp, level) {
  const threshold   = XpCalculator.getLevelThreshold(level);
  const filledCount = Math.min(
    CONFIG.SEGMENT_COUNT,
    Math.max(0, Math.floor((xp / threshold) * CONFIG.SEGMENT_COUNT))
  );
  const frag = document.createDocumentFragment();
  // Re-create the label so it survives innerHTML clear
  const label = document.createElement('span');
  label.className = 'xp-label';
  label.textContent = 'XP';
  frag.appendChild(label);
  for (let i = 0; i < CONFIG.SEGMENT_COUNT; i++) {
    const seg = document.createElement('div');
    seg.className = 'xp-segment' + (i < filledCount ? ' filled' : '');
    frag.appendChild(seg);
  }
  DOM.xpBar.innerHTML = '';
  DOM.xpBar.appendChild(frag);
  DOM.xpBar.title = xp + ' / ' + threshold + ' XP';
},
```

Alternatively, give the label an id and never clear it:

```html
<div id="xp-bar"><span id="xp-label" class="xp-label">XP</span></div>
```

```javascript
// In renderXpBar, clear only the segments by querying existing spans
const existing = Array.from(DOM.xpBar.querySelectorAll('.xp-segment'));
existing.forEach(s => s.remove());
DOM.xpBar.appendChild(frag);
```

---

### CR-02: Keyboard navigation silently broken — arrow-key selection never triggers handleAnswer

**File:** `math-lab.html:728–748`

**Issue:** The CLAUDE.md design spec explicitly states "Keyboard navigation is native (arrow keys, Enter)." The radio inputs are visually hidden (1×1px, `opacity: 0`, `clip: rect(0,0,0,0)`). When a user navigates the option group with arrow keys, the browser moves focus and fires `change` events on the radio inputs — but no `click` event fires. The single delegated listener at line 730 listens only for `click`. Arrow-key selection therefore changes the radio's checked state visually but never calls `handleAnswer`, making keyboard navigation completely non-functional for the primary interaction.

Space-key activation on a focused radio does fire a `click` on the input, which the handler at line 736 catches (`event.target.tagName === 'INPUT'`), so Space works. Arrow keys do not.

**Fix:** Add a `change` listener alongside the `click` listener, or replace with a unified `change` listener on the fieldset:

```javascript
// Replace the click-only listener with a change listener on the fieldset:
document.getElementById('question-fieldset').addEventListener('change', (event) => {
  if (InputHandler.locked) return;
  if (event.target.tagName !== 'INPUT' || event.target.type !== 'radio') return;
  InputHandler.handleAnswer(event.target.value);
});
```

Note: `event.target.value` is already set to `String(val)` on the input (line 691), so this avoids the label-text-parsing step entirely and is more robust. The `click` listener can be removed or kept for mouse redundancy (it will re-trigger `handleAnswer` on click, but `locked` will block the second call).

---

## Warnings

### WR-01: `aria-live="assertive"` on level-up overlay interrupts screen reader mid-question

**File:** `math-lab.html:298`

**Issue:** `aria-live="assertive"` causes screen readers to interrupt whatever they are currently announcing (e.g., reading the question or options) to announce the level-up message. For a user who just answered a question and is listening to feedback, this creates disorienting, overlapping speech. `aria-live="polite"` queues the announcement until the current speech completes, which is appropriate for a celebratory (non-urgent) notification.

**Fix:**
```html
<div id="levelup-overlay" aria-live="polite"></div>
```

---

### WR-02: Answer matching via label `textContent` parsing — fragile pattern

**File:** `math-lab.html:764–792`

**Issue:** `handleAnswer` is passed `selectedValue` as a string scraped from `targetLabel.textContent.trim()` (line 746). Inside `handleAnswer`, the value is parsed back to integer via `parseInt(selectedValue, 10)` and then three separate `Array.find` loops each parse `parseInt(lbl.textContent, 10)` to match items. The inputs already carry `value = String(val)` (line 691), making the label-text approach a redundant and error-prone indirection. If any label ever contains non-integer text (e.g., a future UI change adds units or symbols), all three `find` calls silently fail, leaving the UI in a locked-but-unresolved state with no feedback.

Additionally, the `click` handler reads from `targetLabel.textContent` (line 746) but the input's `.value` attribute carries the same data and is the canonical source. The same `change`-listener fix from CR-02 resolves this entirely by using `event.target.value` directly.

**Fix:** Use input values instead of label text for matching:
```javascript
handleAnswer(selectedValue) {
  InputHandler.locked = true;
  const items = Array.from(DOM.optionsList.querySelectorAll('.option-item'));
  items.forEach(item => item.classList.add('disabled'));

  const selected = parseInt(selectedValue, 10);
  const isCorrect = selected === InputHandler.currentQuestion.answer;

  // Match by input value, not label text
  const findItemByValue = (val) =>
    items.find(item => {
      const inp = item.querySelector('input[type="radio"]');
      return inp && parseInt(inp.value, 10) === val;
    });

  if (isCorrect) {
    const clickedItem = findItemByValue(selected);
    if (clickedItem) clickedItem.classList.add('correct');
    // ... rest of XP logic
  } else {
    const clickedItem = findItemByValue(selected);
    if (clickedItem) clickedItem.classList.add('wrong');
    const correctItem = findItemByValue(InputHandler.currentQuestion.answer);
    if (correctItem) correctItem.classList.add('correct');
  }
  // ...
}
```

---

### WR-03: `PlayerState.reset()` hardcodes table lists instead of referencing `CONFIG`

**File:** `math-lab.html:427–431`

**Issue:** `reset()` iterates literal arrays `[1, 2, 3, 4, 5]` and `[6, 7, 8, 9]` with hardcoded initial accuracy values. These duplicate the logic in the closure's initial `accuracy` object declaration (lines 347–348) and bypass `CONFIG.EASY_TABLES`, `CONFIG.HARD_TABLES`. If the table configuration is ever adjusted (e.g., adding table 10, or reclassifying table 5 as hard), `reset()` silently uses stale table lists and initial accuracies while the rest of the system uses updated `CONFIG` values.

**Fix:**
```javascript
reset() {
  xp    = 0;
  level = 1;
  CONFIG.EASY_TABLES.forEach(t => { accuracy[t] = 0.5; delete history[t]; });
  CONFIG.HARD_TABLES.forEach(t => { accuracy[t] = 0.4; delete history[t]; });
}
```

---

## Info

### IN-01: `console.warn` left in production persistence path — exposes internal state schema

**File:** `math-lab.html:465–487`

**Issue:** Five `console.warn` calls in `PersistenceStore.load()` log internal field names and save-version details to the browser console. While intentional for dev debugging, they run in production (there is no dev/prod distinction in a single HTML file). For a local file opened by a child, this is harmless, but the messages expose internal structure (`[MathLab] Save data invalid (xp) — using defaults`) that could confuse a curious parent inspecting DevTools. The project CLAUDE.md notes a `window.debugAccuracy()` helper is intentional; the load-path warns are not gated the same way.

**Fix:** If the warns are desired for debugging, document them alongside `debugAccuracy`. Otherwise convert to no-ops or replace with a single silent fallback to defaults. No code change is urgent; this is a polish item.

---

### IN-02: `#levelup-overlay` receives `textContent` write while CSS animation is already running — potential text flicker on rapid level-ups

**File:** `math-lab.html:704–709`

**Issue:** `showLevelUpOverlay` writes `textContent` and adds the `active` class synchronously. If the player levels up twice in rapid succession (e.g., banked surplus XP pushes through two thresholds — currently impossible since `addXp` only returns true once per call), the `animationend` listener from the first call would be waiting with `{ once: true }` and removing `active` at the wrong time. The current `addXp` implementation only ever detects one level-up per XP award, so this is unreachable today, but the pattern has no guard against mid-animation re-trigger. A second rapid answer during the 1-second feedback window is blocked by `InputHandler.locked`, so this is also effectively safe in practice. No immediate fix required — note for future multi-level-up support.

---

_Reviewed: 2026-06-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
