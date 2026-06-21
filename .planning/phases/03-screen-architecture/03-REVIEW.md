---
phase: 03-screen-architecture
reviewed: 2026-06-21T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - math-lab.html
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-21
**Depth:** standard
**Files Reviewed:** 1 (`math-lab.html`)
**Status:** issues_found

## Summary

Phase 3 added the screen architecture: `data-screen`/`data-panel` CSS visibility system, the `App` IIFE elevated outside `DOMContentLoaded`, `App._nextQuestion` delegation, `DOM.main` cache entry, and the `InputHandler` mode guard. The implementation is structurally sound. All six focus-area questions were traced to clean outcomes except two lower-severity issues documented below.

The `App._nextQuestion` race was confirmed not to exist: the assignment at line 1199 and the first call at line 1212 are in the same synchronous `DOMContentLoaded` block, with assignment first. The `App.nextQuestion()` stub guards with `typeof App._nextQuestion === 'function'` as an extra safety net. No CSS layout conflict was found: the `:not([data-panel="quiz"])` rule only applies flex layout props to panels that receive `display: flex` from the screen rules; the quiz panel gets `display: block` and is excluded from that rule. No JS syntax errors were introduced by the IIFE elevation.

## Warnings

### WR-01: `renderScreen()` accepts unchecked arbitrary string — silent blank-screen on bad input

**File:** `math-lab.html:1005`

**Issue:** `renderScreen(name)` sets `data-screen` to whatever string is passed without validating it against the known screen names (`quiz`, `dungeon-map`, `combat`, `loot`, `floor-summary`, `dead`). An invalid value (e.g. a typo: `App.transition('dungon-map')`) silently hides all panels, leaving the user with a blank main area and no error. Because `window.App` is exported and phase 3 UAT tests this via the console, a typo during testing produces a confusing blank screen with no diagnostic.

**Fix:** Add a guard in `renderScreen` or `transition`:

```js
const KNOWN_SCREENS = new Set(['quiz', 'dungeon-map', 'combat', 'loot', 'floor-summary', 'dead']);

function renderScreen(name) {
  if (!KNOWN_SCREENS.has(name)) {
    console.warn('[App] Unknown screen name: ' + name);
    return;
  }
  const main = document.getElementById('game-board');
  if (main) main.setAttribute('data-screen', name);
}
```

---

## Info

### IN-01: `DOM.main` is assigned but never read — dead cache entry

**File:** `math-lab.html:1042`

**Issue:** `DOM.main = document.getElementById('game-board')` is added to the DOM cache at line 1042, but it is not referenced anywhere in the code. `renderScreen()` (defined outside `DOMContentLoaded` in the `App` IIFE, line 1006) calls `document.getElementById('game-board')` directly on every invocation, which is correct given its scope — it cannot close over `DOM.main` which does not exist at IIFE definition time.

The DOM cache comment ("populated once at init; never queried again") implies `DOM.main` should replace the live query in `renderScreen`. That refactor is architecturally impossible without passing `DOM.main` into the `App` module or restructuring `renderScreen` to run post-DOM-ready. As-is, `DOM.main` is dead.

**Fix (option A — remove dead entry, simplest):** Delete line 1042.

**Fix (option B — wire it up):** Move `renderScreen` inside `DOMContentLoaded` (or pass `DOM.main` to `App` after DOM ready) so the cache reference can be used:

```js
// Inside DOMContentLoaded, after DOM cache is populated:
App._renderScreen = function(name) {
  DOM.main.setAttribute('data-screen', name);
};
// Then in App.transition(), call App._renderScreen(name) instead of renderScreen(name).
```

Option A is the lowest-friction fix for Phase 3 scope.

---

_Reviewed: 2026-06-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
