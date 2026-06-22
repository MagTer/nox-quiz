---
plan: 04-01
phase: 04-dungeon-renderer
status: complete
tags: [html-structure, css-animation, hp-bars, dungeon-panels, combat-ui]
subsystem: dungeon-renderer-html
dependency_graph:
  requires: [03-02]
  provides: [combat-panel-ids, floor-summary-slots, loot-slots, dead-slots, hp-bar-css, floatUp-keyframe]
  affects: [math-lab.html]
tech_stack:
  added: []
  patterns: [CSS hp-bar container/fill pattern, CSS @keyframes floatUp, position:relative for absolute damage number float]
key_files:
  modified:
    - math-lab.html
decisions:
  - Combat panel uses separate fieldset id="combat-question" (not v1 #question-fieldset) to prevent radio group collision
  - HP bar width starts at 100%; JS drives subsequent changes via style.width = pct + '%' (CSS transition fires on change, not on initial render)
  - position:relative set in CSS on #combat-enemy-area and #player-hp-container — not inline in showDamageNumber — per anti-pattern guidance
  - Dead panel has no stats (ADHD-05 compliant) — static RPG flavor text only
  - Dungeon-map panel intentionally left as placeholder — Phase 5 builds it
metrics:
  duration: ~2m
  completed: 2026-06-21
  tasks_completed: 2
  files_modified: 1
---

# Phase 04 Plan 01: Dungeon Panel HTML Structure + HP Bar CSS Summary

## One-liner

Static HTML structure for combat, floor-summary, loot, and dead panels with all DungeonRenderer-target element IDs, plus CSS HP bars (300ms transition) and @keyframes floatUp (400ms) for damage numbers.

## What was built

### Task 1: Combat panel HTML (commit 8d20d20)

Replaced the combat panel `<h2>Combat</h2><p>(placeholder)</p>` with full layout structure matching the locked D-01 top-to-bottom order from CONTEXT.md:

1. `<p id="combat-room-indicator"></p>` — floor/room text slot (DungeonRenderer writes "Floor N · Room M/5")
2. `<div id="combat-enemy-area">` with nested `#combat-enemy-sprite` (emoji) and `#enemy-hp-container`/`#enemy-hp-fill` (.hp-bar--enemy)
3. `<p id="combat-feedback"></p>` — RPG feedback text slot
4. `<div class="hp-bar-container" id="player-hp-container">` with `#player-hp-fill` (.hp-bar--player) — outside enemy area
5. `<fieldset id="combat-question"><ul id="combat-options-list"></ul></fieldset>` — separate from v1 #question-fieldset

The v1 quiz panel (`[data-panel="quiz"]`) and its `#question-fieldset` were not touched.

### Task 2: Floor-summary/loot/dead HTML + CSS (commit 22c9823)

**floor-summary panel:** `#floor-summary-headline`, `#floor-summary-enemies`, `#floor-summary-xp`, `#floor-summary-hp`, `#floor-summary-continue` (Advance button — Phase 5 wires onclick)

**loot panel:** Static `<h2>Loot Acquired</h2>`, `#loot-emoji`, `#loot-name`, `#loot-continue` (Continue button — Phase 5 wires onclick)

**dead panel:** Static `<h2>You Fell</h2>` + `<p>The dungeon claims another soul.</p>` + `#dead-retry` (Try Again button — Phase 5 wires onclick). No stats (ADHD-05 compliant).

**CSS added:**
- `.hp-bar-container` — 100% width, 12px height, #222 background, border-radius:6px, overflow:hidden
- `.hp-bar` — full height, border-radius, `transition: width 300ms ease`, width:100% initial
- `.hp-bar--enemy` — background: #ff4444 (red)
- `.hp-bar--player` — background: var(--accent) (#00ff88)
- `#combat-enemy-area` — position:relative, flex column, align-items:center, gap:8px, max-width:320px
- `#player-hp-container` — position:relative, max-width:320px
- `.damage-number` — position:absolute, top:0, left:50%, transform:translateX(-50%), animation: floatUp 400ms ease-out forwards
- `.damage-number--hit` — color: var(--accent) (green, damage dealt)
- `.damage-number--damage` — color: var(--danger) (red, damage received)
- `@keyframes floatUp` — 0%: opacity:1, translateX(-50%) translateY(0); 100%: opacity:0, translateX(-50%) translateY(-40px)
- `#combat-enemy-sprite` — font-size: clamp(4rem, 8vw, 6rem), line-height:1, user-select:none
- `#combat-feedback` — 1.1rem, 700 weight, color:var(--accent), min-height:1.5em, text-align:center
- `#combat-room-indicator` — 0.85rem, 700 weight, color:var(--text-muted), uppercase, letter-spacing:0.1em
- `#combat-question` — border:none, margin:0, padding:0, max-width:520px
- `[data-panel] button` — accent background, dark text, Impact font, uppercase, border-radius:6px

## Verification

All acceptance criteria verified by grep:

- `grep -c 'id="combat-room-indicator"' math-lab.html` → 1 ✓
- `grep -c 'id="combat-enemy-sprite"' math-lab.html` → 1 ✓
- `grep -c 'id="enemy-hp-fill"' math-lab.html` → 1 ✓
- `grep -c 'id="player-hp-fill"' math-lab.html` → 1 ✓
- `grep -c 'id="combat-feedback"' math-lab.html` → 1 ✓
- `grep -c 'id="combat-question"' math-lab.html` → 1 ✓
- `grep -c 'id="combat-options-list"' math-lab.html` → 1 ✓
- `grep -c 'id="combat-enemy-area"' math-lab.html` → 1 ✓
- `grep -c 'id="question-fieldset"' math-lab.html` → 1 ✓ (v1 untouched)
- `grep -c '@keyframes floatUp' math-lab.html` → 1 ✓
- `grep -c '\.hp-bar--enemy' math-lab.html` → 1 ✓
- `grep -c '\.hp-bar--player' math-lab.html` → 1 ✓
- `grep -c 'transition: width 300ms ease' math-lab.html` → 1 ✓
- `grep -c 'id="floor-summary-headline"' math-lab.html` → 1 ✓
- `grep -c 'id="floor-summary-xp"' math-lab.html` → 1 ✓
- `grep -c 'id="loot-name"' math-lab.html` → 1 ✓
- `grep -c 'id="dead-retry"' math-lab.html` → 1 ✓
- `grep -c 'damage-number--hit' math-lab.html` → 1 ✓

Forbidden words ("Correct", "Wrong", "Answer", "Question") do not appear as visible dungeon panel text — only in v1 quiz CSS class names and JS code.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `[data-panel="dungeon-map"]` retains placeholder `<h2>Dungeon Map</h2><p>(placeholder)</p>` — intentional per plan scope. Phase 5 builds dungeon-map panel.
- `#floor-summary-continue`, `#loot-continue`, `#dead-retry` button onclick handlers are unconnected — intentional per plan. Phase 5 wires navigation.

## Self-Check: PASSED
- `8d20d20` commit exists in git log ✓
- `22c9823` commit exists in git log ✓
- All 19 required element IDs present in math-lab.html (1 each) ✓
- CSS: hp-bar-container, hp-bar, hp-bar--enemy, hp-bar--player, @keyframes floatUp all present ✓
