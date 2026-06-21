# Phase 3: Screen Architecture - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Add all dungeon screen panels to the HTML and wire up the single `renderScreen()` routing function that controls which panel is visible. No screen content is built yet — only placeholder content — but calling `App.transition('combat')` from the browser console must show the combat panel and hide all others. The v1 quiz flow continues to work unchanged; InputHandler gains a mode guard that rejects quiz answers when not in quiz mode.

</domain>

<decisions>
## Implementation Decisions

### HTML Structure & v1 Integration
- Wrap existing `#game-board` (the v1 quiz markup) in `<section data-panel="quiz">` — v1 markup untouched, the section wrapper provides the data-panel hook
- `<main>` receives `data-screen="quiz"` as its initial default attribute — CSS shows only the panel matching the current data-screen value
- 5 new dungeon screen `<section>` elements added inside `<main>` after the quiz section: `data-panel="dungeon-map"`, `data-panel="combat"`, `data-panel="loot"`, `data-panel="floor-summary"`, `data-panel="dead"` — each with a minimal placeholder (`<h2>` + `<p>(placeholder)</p>`)
- No "Enter Dungeon" button in Phase 3 — console-only testing per success criteria (`window.App.transition('combat')`) — button wired up in Phase 5

### App Mode & renderScreen() Design
- `App.mode` is a string: `'quiz'` | `'dungeon'` — InputHandler guards v1 answer flow with `if (App.mode !== 'quiz') return;`
- `App.transition(screenName)` sets `data-screen` on `<main>` and updates `App.mode` (`'quiz'` when screenName is `'quiz'`, `'dungeon'` for all dungeon screen names) — deliberately separate from GameFSM which handles dungeon-internal FSM state
- `renderScreen(name)` is a single function called only from `App.transition()` — no other code path modifies `data-screen`
- `App` is elevated out of `DOMContentLoaded` closure so `window.App.transition()` is callable from console for Phase 3 UAT — mirrors the `window.GameFSM` / `window.CombatEngine` pattern from Phase 2

### Claude's Discretion
- CSS selector pattern: `main[data-screen="X"] [data-panel="X"] { display: block; }` and all `[data-panel]` default to `display: none` — cleanest, no JS layout toggling
- Placeholder styling: minimal inline styles on the placeholder sections (`padding`, `display: flex`, `align-items: center`, `justify-content: center`, `min-height: 100vh`) so each screen is visually verifiable without color overlap with v1 styles
- No CSS transition on screen switch in Phase 3 — correctness over polish; Phase 4 adds animations

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CONFIG.DUNGEON` — all dungeon constants already defined; no new constants needed for Phase 3
- `GameFSM` — already implemented; `App.transition()` must NOT call `GameFSM.transition()` — they are separate concerns
- `Renderer` — v1 renderer; dungeon rendering deferred to Phase 4 (DungeonRenderer)
- `InputHandler.setup()` — change listener on `#question-fieldset`; Phase 3 adds mode guard at the top of the handler

### Established Patterns
- Closure-based IIFE modules: `const ModuleName = (() => { ... return { publicApi }; })();`
- Window exports: `window.App = App;` — mirrors Phase 2 pattern (`window.GameFSM`, `window.CombatEngine`, etc.)
- `'use strict';` already at script top — all new code inherits it
- Security: `textContent`, never `innerHTML` for user-controlled values
- DOM cache: all element references stored in `DOM` object inside `DOMContentLoaded`; new dungeon panel refs added here

### Integration Points
- `InputHandler.handleAnswer()` — add mode guard `if (App.mode !== 'quiz') return;` before lock check
- `<main id="game-board">` — wrap its children in `<section data-panel="quiz">` in HTML; or add the section element directly (Phase 3 HTML edit)
- New `App` object replaces the existing bare `const App = { nextQuestion() {...} }` — extend it with `mode`, `transition()`, and expose via `window.App`
- `InputHandler.setup()` — already sets up the fieldset change listener; guard goes inside the existing callback

</code_context>

<specifics>
## Specific Ideas

- Success criteria require these exact console calls to work: `App.transition('dungeon-map')`, `App.transition('combat')`, `App.transition('loot')`, `App.transition('floor-summary')`, `App.transition('dead')` — design the API to match these signatures exactly
- Verification requires visual check: calling each transition shows exactly ONE panel and hides all others — placeholder content must be visible enough to confirm this in a browser tab
- The ROADMAP explicitly states: "no `innerHTML` replacement, no `display` toggling in JavaScript outside of a single `renderScreen()` function" — all CSS visibility must flow through `data-screen` + CSS, not JS style manipulation

</specifics>

<deferred>
## Deferred Ideas

- "Enter Dungeon" button — deferred to Phase 5 (full floor loop)
- Dungeon screen content (combat UI, loot UI, etc.) — deferred to Phase 4 (DungeonRenderer)
- CSS transitions between screens — deferred to Phase 4 polish
- Dungeon map visual (room grid) — deferred to Phase 4

</deferred>
