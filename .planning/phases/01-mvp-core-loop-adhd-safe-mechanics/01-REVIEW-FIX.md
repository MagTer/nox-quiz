---
phase: 01-mvp-core-loop-adhd-safe-mechanics
fixed_at: 2026-06-20T00:00:00Z
review_path: .planning/phases/01-mvp-core-loop-adhd-safe-mechanics/01-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-06-20
**Source review:** .planning/phases/01-mvp-core-loop-adhd-safe-mechanics/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (CR-01, CR-02, WR-01, WR-02, WR-03)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: XP label span erased on first render

**Files modified:** `math-lab.html`
**Commit:** 0c8bfd5
**Applied fix:** In `renderXpBar`, before the segment loop, a `<span class="xp-label">` element is now created and prepended to the DocumentFragment. This means every `innerHTML = ''` clear is followed by a full rebuild of the label + segments, so the "XP" text always appears regardless of how many times the function is called.

---

### WR-01: aria-live="assertive" on level-up overlay

**Files modified:** `math-lab.html`
**Commit:** c5c617e
**Applied fix:** Changed `aria-live="assertive"` to `aria-live="polite"` on `#levelup-overlay`. Level-up announcements are now queued behind any in-progress screen-reader speech instead of interrupting it.

---

### WR-03: PlayerState.reset() hardcoded table lists

**Files modified:** `math-lab.html`
**Commit:** a36ceac
**Applied fix:** Replaced literal arrays `[1, 2, 3, 4, 5]` and `[6, 7, 8, 9]` in `reset()` with `CONFIG.EASY_TABLES` and `CONFIG.HARD_TABLES`. Any future change to the table configuration in CONFIG now propagates to reset automatically.

---

### CR-02 + WR-02: Keyboard navigation broken / fragile label-text matching

**Files modified:** `math-lab.html`
**Commit:** b7045e9
**Applied fix:** These two findings were fixed together as a single cohesive change.

CR-02: Replaced the `click` listener on `DOM.optionsList` with a `change` listener on `#question-fieldset`. Radio inputs fire `change` events on arrow-key navigation but not `click`, so keyboard selection now correctly calls `handleAnswer`.

WR-02: `handleAnswer` no longer extracts values from label `textContent`. A `findItemByValue(val)` helper now locates option items by querying `input[type="radio"]` and comparing `parseInt(inp.value, 10)`. This uses the canonical `input.value` attribute (already set to `String(val)` during `showQuestion`) and eliminates the fragile text-parsing path entirely.

---

_Fixed: 2026-06-20_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
