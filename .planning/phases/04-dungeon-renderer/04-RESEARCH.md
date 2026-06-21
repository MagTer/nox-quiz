# Phase 04: Dungeon Renderer - Research

**Researched:** 2026-06-21
**Domain:** Vanilla JS DOM module, CSS animation, RPG UI patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Combat Screen Architecture**
- Combat panel has its own question markup: separate `<fieldset id="combat-question">` with `<p id="combat-question-text">` and `<ul id="combat-options-list">` inside `[data-panel="combat"]`; DungeonRenderer updates these IDs; the quiz panel's `#question-fieldset` remains untouched for v1 quiz mode
- Combat screen layout (top to bottom): Floor/Room indicator → Enemy sprite + enemy HP bar → Feedback text area → Player HP bar → Question fieldset + answer choices
- Room progress shown as `"Floor N · Room M/5"` text line — simple, no graphical map needed in Phase 4
- Dungeon-map panel stays placeholder in Phase 4 — real content built in Phase 5

**HP Bars & Damage Animation**
- Enemy HP bar color: `#ff4444` (red); Player HP bar color: `#00ff88` (accent green)
- No HP numbers shown alongside bars — visual bar only
- Floating damage numbers: green text for correct answers, red text for wrong answers; both animate upward from the target and fade out within 400ms using CSS `@keyframes`
- Wrong-answer effect on player HP bar: width drains only via `transition: width 300ms ease` — no shake, no flash, no glow; ADHD-safe hard constraint

**RPG Copy & Flavor Text**
- Attack success feedback variants: `"Attack!"` (~80%) / `"Critical hit!"` (~20%); shown in feedback area for 1.5s then cleared
- Wrong-answer feedback: `"You took a hit!"`
- Floor-complete headline: `"Floor N Cleared!"` as h2; stats block: enemies defeated / XP earned / HP remaining
- Flavor text: 3 placeholder lines per enemy implemented now; Phase 6 replaces content after user approval; words "Correct", "Wrong", "Answer", "Question" must not appear in any dungeon screen

**DungeonRenderer Module Design**
- New `const DungeonRenderer = (() => { ... })()` IIFE outside DOMContentLoaded; exported as `window.DungeonRenderer`
- Separate from v1 `Renderer` module — no merge
- DungeonRenderer owns: `renderCombat(state)`, `renderFloorComplete(summary)`, `renderLoot(item)`, `renderDead()`, `showDamageNumber(target, value, isHit)`, `updateHP(enemyHP, playerHP)`, `showFeedback(text)`
- Uses `textContent` throughout — never `innerHTML`

### Claude's Discretion
- Enemy sprite font-size: `font-size: clamp(4rem, 8vw, 6rem)` for responsive sizing
- HP bar height: 12px, border-radius: 6px (pill shape); full width of container
- Damage number position: `position: absolute` relative to target element; animates `translateY(-40px)` over 400ms then `opacity: 0`
- Critical hit threshold: `Math.random() < 0.2` — 20% chance; damage values still come from CONFIG.DUNGEON

### Deferred Ideas (OUT OF SCOPE)
- Dungeon-map panel visual (room grid) — Phase 5
- "Enter Dungeon" button wiring — Phase 5
- Final flavor text content approved by user — Phase 6
- CSS screen transition animations — Phase 4 polish or Phase 6 if time allows
- Sound effects / audio feedback — explicitly out of scope for v2.0
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMB-02 | HP bars (CSS transition-animated) for both player and current enemy | HP bar CSS pattern: width% driven by JS, `transition: width 300ms ease`, pilll shape via border-radius. Container wraps a fill div. Enemy bar #ff4444, player bar #00ff88 (accent). |
| COMB-04 | Visual combat feedback: floating damage numbers, HP bar drain animation after each hit | CSS `@keyframes floatUp` animates translateY(-40px) + opacity 0 over 400ms. Position: absolute relative to target container. Created dynamically, removed on animationend. |
| COMB-05 | All combat copy is RPG-themed ("Attack!" not "Correct!", "You took a hit!" not "Wrong") | Flavor text rotation with lastIndex tracking prevents same line twice in a row. No prohibited words in any dungeon panel text. |
| ENE-03 | Each enemy type has 3+ flavor text lines shown during combat to prevent repetition | Per-enemy flavor text arrays in DungeonRenderer closure. Rotation guard: track lastFlavorIndex per enemy type. |
</phase_requirements>

---

## Summary

Phase 4 replaces all dungeon placeholder panels with real visual content. The core work is three things: (1) write the `DungeonRenderer` IIFE module with all public DOM-update methods, (2) add the static HTML structure for the combat panel (HP bars, enemy sprite area, feedback area, combat fieldset), floor-summary, loot, and dead screens into the existing `[data-panel]` sections, and (3) add the CSS for HP bars and floating damage number animations.

The architecture is already fully designed in CONTEXT.md — the IIFE module pattern, the `textContent`-only security constraint, the CSS custom property palette, the animation timing constraints, and every method signature are all locked. The planner does not need to make any architecture decisions. The primary planning task is sequencing the three workstreams (HTML structure, CSS, DungeonRenderer JS module) into plans and identifying the CombatInputHandler gap that must also be addressed.

**Primary recommendation:** Build in three sequential waves — (1) HTML panel structure, (2) CSS for HP bars and animation keyframes, (3) DungeonRenderer JS module with all public methods — then wire question + answer loop in combat mode. Each wave is independently verifiable in the browser.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Enemy sprite display | Browser/Client DOM | — | Static emoji rendered by JS textContent into a dedicated element inside [data-panel="combat"] |
| HP bars | Browser/Client CSS | Browser/Client JS | CSS owns the visual (width%, transition, color); JS drives the data (calls updateHP with new values) |
| Floating damage numbers | Browser/Client CSS | Browser/Client JS | CSS @keyframes drives the animation; JS creates/removes the element and positions it |
| Combat question render | Browser/Client DOM | — | DungeonRenderer.renderCombat() writes to combat-specific fieldset IDs; never touches v1 quiz fieldset |
| RPG feedback text | Browser/Client DOM | — | DungeonRenderer.showFeedback() writes textContent to #combat-feedback; auto-clears after 1.5s |
| Floor-complete screen | Browser/Client DOM | — | DungeonRenderer.renderFloorComplete(summary) populates static slots with textContent |
| Loot screen | Browser/Client DOM | — | DungeonRenderer.renderLoot(item) shows item name and emoji via textContent |
| Dead screen | Browser/Client DOM | — | DungeonRenderer.renderDead() no dynamic content needed; static HTML suffices |
| Combat input routing | Browser/Client JS | — | New CombatInputHandler or extension handles answer clicks in dungeon mode, calls CombatEngine.resolveAnswer() |
| Question cycling | Browser/Client JS | — | DungeonRenderer wires its own question loop; does NOT use App._nextQuestion or Renderer.showQuestion() |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES2020+ | DungeonRenderer IIFE module | Project constraint — single file, zero dependencies |
| CSS3 @keyframes | Native | Floating damage numbers, HP bar transition | Hardware accelerated; no JS overhead; declarative; ADHD-safe timing control |
| CSS custom properties | Native | Color tokens (--accent, --danger, etc.) | Already established in codebase; consistent palette reuse |
| textContent | Native DOM | All text writes in DungeonRenderer | Security pattern; never innerHTML (established project rule) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| DocumentFragment | Native DOM | Batch DOM insertion for answer options | Use when building the combat options list to avoid layout thrash |
| CSS `position: relative/absolute` | Native | Damage number float positioning | Required for damage numbers to float relative to their parent container |
| animationend event | Native | Remove damage number element after animation | Prevents DOM accumulation; use `{ once: true }` listener |

**Installation:** None required — vanilla only.

---

## Package Legitimacy Audit

Not applicable — this phase installs zero external packages.

---

## Architecture Patterns

### System Architecture Diagram

```
User clicks answer option (combat fieldset)
          |
          v
CombatInputHandler.handleAnswer(value)
  [Mode guard: if App.mode !== 'dungeon' return]
          |
          v
CombatEngine.resolveAnswer(isCorrect)
  --> returns { enemyHP, playerHP, killed, died, leveledUp }
          |
    ------+------
    |            |
  correct      wrong
    |            |
DungeonRenderer.showDamageNumber(enemyEl, dmg, true)   DungeonRenderer.showDamageNumber(playerEl, dmg, false)
DungeonRenderer.updateHP(newEnemyHP, playerHP)          DungeonRenderer.updateHP(enemyHP, newPlayerHP)
DungeonRenderer.showFeedback("Attack!" / "Critical hit!")  DungeonRenderer.showFeedback("You took a hit!")
    |            |
    +------+------
           |
     killed?  died?  --> App.transition('loot') / App.transition('dead')
           |
     (neither) --> QuestionSelector.selectNext() --> DungeonRenderer.renderCombat() question update
```

### Recommended Project Structure

All code is inline in `math-lab.html`. The new additions follow this ordering within the `<script>` block:

```
<script>
  'use strict';

  // ... existing modules 1-10 (CONFIG through App) ...

  // MODULE 11: DungeonRenderer          <-- NEW (outside DOMContentLoaded)
  const DungeonRenderer = (() => { ... })();
  window.DungeonRenderer = DungeonRenderer;

  // DOMContentLoaded block
  document.addEventListener('DOMContentLoaded', () => {
    // ... existing DOM cache, Renderer, InputHandler, bootstrap ...

    // CombatInputHandler setup         <-- NEW (inside DOMContentLoaded, after DOM cache)
    const CombatInputHandler = { ... };
    CombatInputHandler.setup();
  });
</script>
```

Within `<main>`, the combat panel HTML structure replaces the placeholder:

```html
<section data-panel="combat">
  <!-- Floor/room indicator -->
  <p id="combat-room-indicator"></p>

  <!-- Enemy area: sprite + enemy HP bar -->
  <div id="combat-enemy-area">
    <div id="combat-enemy-sprite"></div>        <!-- emoji lives here -->
    <div class="hp-bar-container" id="enemy-hp-container">
      <div class="hp-bar hp-bar--enemy" id="enemy-hp-fill"></div>
    </div>
  </div>

  <!-- Feedback text -->
  <p id="combat-feedback"></p>

  <!-- Player HP bar -->
  <div class="hp-bar-container" id="player-hp-container">
    <div class="hp-bar hp-bar--player" id="player-hp-fill"></div>
  </div>

  <!-- Combat question fieldset (separate from v1 #question-fieldset) -->
  <fieldset id="combat-question">
    <ul id="combat-options-list"></ul>
  </fieldset>
</section>
```

### Pattern 1: HP Bar CSS + JS Update

**What:** A container div with fixed height holds a fill div whose width% is driven by JS.
**When to use:** Any HP/progress indicator that needs smooth CSS transition animation.

```css
/* Source: CSS3 native — established pattern in web games */
.hp-bar-container {
  width: 100%;
  height: 12px;
  background: #222;
  border-radius: 6px;
  overflow: hidden;
}

.hp-bar {
  height: 100%;
  border-radius: 6px;
  transition: width 300ms ease;  /* ADHD-safe: under 500ms */
}

.hp-bar--enemy  { background: #ff4444; }
.hp-bar--player { background: var(--accent); }  /* #00ff88 */
```

```javascript
// Source: [ASSUMED] — standard web game HP bar pattern
function updateHP(enemyHP, playerHP) {
  const enemyMax  = CombatEngine.getState().floorDef.hp;
  const playerMax = CONFIG.DUNGEON.PLAYER_HP;
  const enemyPct  = Math.max(0, Math.min(100, (enemyHP / enemyMax) * 100));
  const playerPct = Math.max(0, Math.min(100, (playerHP / playerMax) * 100));
  document.getElementById('enemy-hp-fill').style.width  = enemyPct  + '%';
  document.getElementById('player-hp-fill').style.width = playerPct + '%';
}
```

**CRITICAL NOTE:** `getState()` throws if called before `startCombat()`. Only call it from within an active combat session.

### Pattern 2: Floating Damage Numbers

**What:** A `<span>` is created, appended to a relatively-positioned parent, animated upward with CSS keyframes, then removed on `animationend`.
**When to use:** Any short-lived overlay text that must disappear automatically without a setTimeout DOM leak.

```css
/* Source: [ASSUMED] — standard floating text pattern in web games */
@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-40px); }
}

.damage-number {
  position: absolute;
  font-size: 1.4rem;
  font-weight: 900;
  pointer-events: none;
  animation: floatUp 400ms ease-out forwards;  /* 400ms — under ADHD 500ms limit */
  font-family: 'Impact', 'Arial Black', Arial, sans-serif;
}

.damage-number--hit    { color: var(--accent); }   /* green: damage dealt */
.damage-number--damage { color: var(--danger); }   /* red: damage received */
```

```javascript
// Source: [ASSUMED] — standard animationend cleanup pattern
function showDamageNumber(targetEl, value, isHit) {
  const span = document.createElement('span');
  span.className = 'damage-number ' + (isHit ? 'damage-number--hit' : 'damage-number--damage');
  span.textContent = (isHit ? '-' : '') + value;
  targetEl.style.position = 'relative';  // ensure containing block
  targetEl.appendChild(span);
  span.addEventListener('animationend', () => span.remove(), { once: true });
}
```

### Pattern 3: Flavor Text Rotation Without Repetition

**What:** Per-enemy text arrays with a `lastIndex` guard ensure the same line never appears twice in a row.
**When to use:** Any cyclic content rotation where immediate repetition must be prevented.

```javascript
// Source: [ASSUMED] — standard rotation guard pattern
const FLAVOR = {
  Goblin:   [
    /* PLACEHOLDER — Phase 6 replaces with user-approved content */
    'The goblin snarls at you.',
    'It bares its rotten teeth.',
    'The goblin charges forward.'
  ],
  Skeleton: [
    /* PLACEHOLDER — Phase 6 replaces with user-approved content */
    'Bones rattle in the dark.',
    'Its hollow eye sockets stare.',
    'The skeleton raises its blade.'
  ],
  Dragon:   [
    /* PLACEHOLDER — Phase 6 replaces with user-approved content */
    'Smoke curls from its nostrils.',
    'The dragon lets out a low rumble.',
    'Its scales shimmer like obsidian.'
  ]
};

// Track last shown index per enemy type to prevent immediate repetition
const lastFlavorIndex = {};

function getFlavorText(enemyName) {
  const lines = FLAVOR[enemyName];
  if (!lines || lines.length === 0) return '';
  let idx;
  do {
    idx = Math.floor(Math.random() * lines.length);
  } while (lines.length > 1 && idx === lastFlavorIndex[enemyName]);
  lastFlavorIndex[enemyName] = idx;
  return lines[idx];
}
```

### Pattern 4: CombatInputHandler (separate from v1 InputHandler)

**What:** A parallel input handler that listens on `#combat-question` fieldset changes and routes to `CombatEngine.resolveAnswer()`.
**When to use:** Required because `InputHandler.handleAnswer()` guards on `App.mode !== 'quiz'` and cannot be reused for combat.

```javascript
// Source: [ASSUMED] — mirrors v1 InputHandler setup pattern
const CombatInputHandler = {
  locked: false,

  setup() {
    document.getElementById('combat-question').addEventListener('change', (e) => {
      if (App.mode !== 'dungeon') return;
      if (CombatInputHandler.locked) return;
      if (e.target.tagName !== 'INPUT' || e.target.type !== 'radio') return;
      CombatInputHandler.handleAnswer(e.target.value);
    });
  },

  handleAnswer(selectedValue) {
    CombatInputHandler.locked = true;
    const selected  = parseInt(selectedValue, 10);
    const q         = CombatInputHandler.currentQuestion;
    const isCorrect = selected === q.answer;

    const result = CombatEngine.resolveAnswer(isCorrect);

    DungeonRenderer.updateHP(result.enemyHP, result.playerHP);
    DungeonRenderer.showFeedback(isCorrect
      ? (Math.random() < 0.2 ? 'Critical hit!' : 'Attack!')
      : 'You took a hit!');
    DungeonRenderer.showDamageNumber(/* target */, isCorrect
      ? CONFIG.DUNGEON.DAMAGE_CORRECT
      : CONFIG.DUNGEON.DAMAGE_WRONG, isCorrect);

    if (result.killed)  { App.transition('loot');  return; }
    if (result.died)    { App.transition('dead');   return; }

    // Advance to next question after brief feedback pause
    setTimeout(() => {
      CombatInputHandler.locked = false;
      CombatInputHandler.nextQuestion();
    }, CONFIG.ADVANCE_DELAY_MS);
  },

  nextQuestion() {
    // QuestionSelector constrained to current floor's table pools
    const state = CombatEngine.getState();
    // NOTE: Phase 4 uses standard QuestionSelector; Phase 5 wires floor table pools
    const q = QuestionSelector.selectNext(PlayerState);
    CombatInputHandler.currentQuestion = q;
    DungeonRenderer.renderCombatQuestion(q);
  }
};
```

**Note on table pools:** `CombatEngine.getState().floorDef.tablePools` contains the floor-specific tables. Full integration of DIFF-01/DIFF-02 constrained selection is a Phase 5 concern; Phase 4 uses the standard QuestionSelector to keep scope tight.

### Anti-Patterns to Avoid

- **innerHTML in DungeonRenderer:** `innerHTML` is forbidden for any user-facing content writes. Use `textContent` for all dynamic text, `createElement/appendChild` for option items. This is a locked project security rule.
- **Shake or flash on wrong answer:** CSS `animation: shake` or `box-shadow` flash on wrong answer violates ADHD-03/ADHD-04. Wrong answer is width drain only — no other visual effect.
- **Calling `CombatEngine.getState()` before `startCombat()`:** The engine throws. `renderCombat()` must only be called after CombatEngine has been initialized. DungeonRenderer should not guard this internally — it is the caller's responsibility.
- **JS display toggling on panels:** All panel visibility is owned by `data-screen` CSS. DungeonRenderer must never set `element.style.display`. It can only update content inside panels.
- **RPG-forbidden words in dungeon text:** "Correct", "Wrong", "Answer", "Question" must not appear in any dungeon-panel text string anywhere in the module, including FLAVOR text, feedback strings, and button labels.
- **Removing animationend listener with removeEventListener instead of `{ once: true }`:** Use `{ once: true }` to auto-deregister; avoids listener accumulation over multiple combat rounds.
- **Setting `position: relative` on a parent in JS every time:** Set it once in CSS on `#combat-enemy-area` and `#player-hp-container` via the stylesheet; do not set it in the `showDamageNumber` function repeatedly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HP bar animation | Custom `requestAnimationFrame` loop interpolating width | CSS `transition: width 300ms ease` | Native CSS transition is hardware-accelerated, zero JS overhead, timing is guaranteed |
| Damage number animation | `setInterval` or `requestAnimationFrame` loop | CSS `@keyframes floatUp` + `animationend` removal | Declarative, self-cleaning, no timer references to manage |
| Flavor text rotation | Complex data structure / shuffle | Simple array + `lastIndex` guard | 3 items with no-repeat is trivially solved with a do-while; anything more complex is over-engineering |
| Option item rendering | `innerHTML` string concatenation | `createElement`/`appendChild` fragment | textContent security rule; Fragment avoids layout thrash |

**Key insight:** CSS handles everything visual in this phase. JavaScript's only job is to set width% numbers, update textContent strings, and create/remove the damage number `<span>`. No JS animation timers are needed.

---

## Common Pitfalls

### Pitfall 1: `CombatEngine.getState()` called outside active combat

**What goes wrong:** `CombatEngine.getState()` throws `[CombatEngine] getState called before startCombat`. If DungeonRenderer is called from the wrong application state, the entire screen crashes.
**Why it happens:** DungeonRenderer methods are called before `CombatEngine.startCombat(floorNumber)` has been invoked (e.g. during Phase 4 testing by switching to combat screen manually).
**How to avoid:** During Phase 4, initialize a test combat session with `CombatEngine.startCombat(1)` from the console before calling any DungeonRenderer methods. In production (Phase 5), `CombatEngine.startCombat()` is always called before `App.transition('combat')`.
**Warning signs:** Console error `[CombatEngine] getState called before startCombat` when switching to combat screen.

### Pitfall 2: HP bar doesn't animate — transition fires on first render

**What goes wrong:** Setting `width: X%` at initial render time and then immediately changing it causes no visual transition — the browser has not painted the initial state yet.
**Why it happens:** CSS `transition` only fires between two distinct painted states. If you set the initial width and the "drained" width in the same JS microtask, only the final value is painted.
**How to avoid:** Set the HP bar to its current value in `renderCombat()`, then let `updateHP()` calls triggered by `resolveAnswer()` drive subsequent changes. Initial render is not an animation — only subsequent updates are.
**Warning signs:** HP bar jumps to value without transition on first hit.

### Pitfall 3: Damage number elements accumulate in DOM

**What goes wrong:** If `animationend` never fires (element removed from DOM before animation ends, or animation cancelled), the `span.remove()` call never runs.
**Why it happens:** `animationend` does not fire if the element is detached from the DOM or if the animation is interrupted.
**How to avoid:** The `{ once: true }` listener is still required, but also add a safety `setTimeout` fallback: `setTimeout(() => { if (span.parentNode) span.remove(); }, 600);` — slightly longer than the 400ms animation.
**Warning signs:** After 20+ combat exchanges, inspecting the DOM shows many `.damage-number` spans lingering.

### Pitfall 4: Wrong IDs targeted by DungeonRenderer

**What goes wrong:** DungeonRenderer mistakenly writes to `#question-text` or `#options-list` (the v1 quiz fieldset IDs) instead of `#combat-question-text` and `#combat-options-list`.
**Why it happens:** Copy-paste from the v1 Renderer module; easy to miss the ID difference during authoring.
**How to avoid:** The v1 IDs and combat IDs must be distinct and documented in code comments. DungeonRenderer's DOM cache (or element lookups) must only ever reference combat panel IDs.
**Warning signs:** Correct answers in dungeon mode advance the v1 quiz question; XP is awarded via the wrong handler.

### Pitfall 5: Feedback text cleared too early, blocking next question

**What goes wrong:** `showFeedback(text)` uses `setTimeout(clear, 1500)` which races with `CombatInputHandler.locked` release (also using `setTimeout`). If both timeouts run at the same frame, the feedback may flash too briefly.
**Why it happens:** Two independent timeouts referencing the same 1500ms / `CONFIG.ADVANCE_DELAY_MS` window without coordination.
**How to avoid:** Use `CONFIG.ADVANCE_DELAY_MS` (1000ms) for advancing to the next question. The feedback text clears when `renderCombatQuestion()` is called for the next question — do not add a separate clear timeout. The next question render implicitly clears feedback by resetting the feedback element.
**Warning signs:** Feedback text either disappears immediately or persists across the next question.

---

## Code Examples

Verified patterns from the existing codebase:

### Existing @keyframes pattern (from `levelUpFlash` — already in math-lab.html)

```css
/* Source: math-lab.html line 266 — established animation pattern */
@keyframes levelUpFlash {
  0%   { opacity: 0; transform: scale(0.8); }
  15%  { opacity: 1; transform: scale(1.05); }
  70%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}

#levelup-overlay.active {
  animation: levelUpFlash 0.8s ease-out forwards;
}
```

The `floatUp` keyframe for damage numbers follows the same pattern — define named `@keyframes`, apply via a class, remove the class (or element) on `animationend`.

### Existing IIFE module pattern (from `App` — math-lab.html line 1000)

```javascript
/* Source: math-lab.html line 1000 — established module pattern */
const App = (() => {
  let mode = 'quiz';
  // private state here

  return {
    get mode() { return mode; },
    transition(screenName) { /* ... */ }
  };
})();
window.App = App;
```

`DungeonRenderer` follows identical structure: private state (flavor last-index map, element ID references), public API object, `window.DungeonRenderer = DungeonRenderer` export.

### Existing animationend cleanup pattern (from `showLevelUpOverlay` — math-lab.html line 1105)

```javascript
/* Source: math-lab.html line 1108 — established animationend pattern */
DOM.levelupOverlay.addEventListener('animationend', () => {
  DOM.levelupOverlay.classList.remove('active');
}, { once: true });
```

`showDamageNumber` follows the same pattern with `span.remove()` instead of class removal.

### Existing option-list build pattern (from `Renderer.showQuestion` — math-lab.html line 1080)

```javascript
/* Source: math-lab.html line 1080 — established option-build pattern */
DOM.optionsList.innerHTML = '';
questionObj.options.forEach((val, i) => {
  const li    = document.createElement('li');
  li.className = 'option-item';
  const input = document.createElement('input');
  input.type  = 'radio';
  input.name  = 'answer';
  input.id    = 'opt-' + i;
  input.value = String(val);
  const label = document.createElement('label');
  label.setAttribute('for', 'opt-' + i);
  label.textContent = String(val);
  li.appendChild(input);
  li.appendChild(label);
  DOM.optionsList.appendChild(li);
});
```

`DungeonRenderer.renderCombatQuestion()` follows this same pattern targeting `#combat-options-list` with `name="combat-answer"` to avoid radio group conflict with the v1 quiz fieldset.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `innerHTML` template strings for option lists | `createElement/appendChild` with `textContent` | Established in Phase 1 | Security: prevents XSS; must be followed in all new code |
| Separate `display` toggling per panel in JS | Single `data-screen` attribute + CSS visibility rules | Established in Phase 3 | All screen switches flow through `App.transition()` only |
| `setInterval` for game feedback timing | `setTimeout` for one-shot delays only | Established in Phase 1 | `requestAnimationFrame` used for loops; `setTimeout` for one-shot advance delay |

**Not deprecated but scope-constrained:**
- `Renderer` module: still fully valid for v1 quiz mode HUD updates; DungeonRenderer does NOT replace it — they coexist for their respective modes.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CombatInputHandler should live inside `DOMContentLoaded` (needs DOM access at setup) | Architecture Patterns | Minor — could be structured differently; but DOM element refs require DOMContentLoaded |
| A2 | Phase 4 uses standard QuestionSelector for combat questions, not floor-pool-constrained | Pattern 4 | Questions in Phase 4 combat may draw from all tables instead of floor-specific pools — acceptable for Phase 4 testing; Phase 5 wires correctly |
| A3 | `CONFIG.ADVANCE_DELAY_MS` (1000ms) is reused as the combat feedback pause delay | Common Pitfalls 5 | If the UX feels too slow or too fast in combat, the constant value may need a separate `CONFIG.COMBAT_ADVANCE_MS` |
| A4 | `combat-answer` used as `name` attribute for combat radio inputs (not `answer`) | Code Examples | If the same `name="answer"` is used as v1, both radio groups would interfere — risk is real and must be avoided |

---

## Open Questions

1. **Floor-summary XP total source**
   - What we know: `CombatEngine.resolveAnswer()` awards XP incrementally via `PlayerState.addXp()` on each kill; floor XP total is not separately accumulated
   - What's unclear: Phase 4 needs to show "XP earned this floor" on the floor-summary screen, but there's no running floor-XP counter in DungeonState
   - Recommendation: DungeonRenderer tracks a `floorXpEarned` running counter internally, incremented each time `renderCombat()` processes a `killed: true` result — this is renderer-internal state, not game state

2. **CombatEngine.startCombat resets DungeonState.init() which resets loot**
   - What we know: `CombatEngine.startCombat(floorNumber)` calls `DungeonState.init(floorNumber)` which clears all loot
   - What's unclear: Phase 4 test harness for floor-summary will need to call `startCombat` which clears state; this is correct behavior but may confuse Phase 4 testing
   - Recommendation: Document this in plan comments; Phase 4 testing should call `startCombat(1)` once per test session, not per room

3. **Dead screen retry button wiring**
   - What we know: `DungeonRenderer.renderDead()` renders the dead screen; CONTEXT.md says "no stats" — just a retry button
   - What's unclear: What does the retry button call? `App.transition('combat')` directly? Or `CombatEngine.startCombat(currentFloor)` first?
   - Recommendation: Phase 4 renders the button but leaves its `onclick` as a console-callable stub; Phase 5 wires the full retry flow

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure single-HTML-file, no tools required beyond a browser)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Browser DevTools console (no automated test framework — project constraint) |
| Config file | none |
| Quick run command | Open `math-lab.html` in browser; run UAT commands in console |
| Full suite command | Same — manual verification per success criteria |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMB-02 | HP bars visible; drain within 300ms on correct/wrong answer | manual/visual | `CombatEngine.startCombat(1); App.transition('combat'); DungeonRenderer.updateHP(6, 100)` | ❌ Wave 0 — no test infra |
| COMB-04 | Floating damage number appears and fades within 500ms after each answer | manual/visual | `DungeonRenderer.showDamageNumber(document.getElementById('combat-enemy-area'), 3, true)` | ❌ Wave 0 |
| COMB-05 | No "Correct"/"Wrong"/"Answer"/"Question" in dungeon panel text; RPG copy used | grep + visual | `grep -i "correct\|wrong\|answer\|question" math-lab.html` (expect 0 hits in panel text) | ❌ Wave 0 |
| ENE-03 | 3+ flavor lines per enemy; no same line twice in a row | manual | Trigger 6+ combat exchanges same enemy type; verify rotation | ❌ Wave 0 |

### Sampling Rate

- Per task commit: Open `math-lab.html`; call `App.transition('combat')` from console; visually confirm panel renders
- Per wave merge: All Phase 4 success criteria checklist verified manually in browser
- Phase gate: All 5 success criteria from ROADMAP pass before `/gsd-verify-work`

### Wave 0 Gaps

- No automated test infrastructure exists for this project (single HTML file, no Node.js)
- All validation is browser console + visual verification
- Key console commands to use as test harness documented in "Test Map" column above

---

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | parseInt(value, 10) before any comparison; no eval; textContent only |
| V6 Cryptography | no | — |

### Known Threat Patterns for Vanilla JS DOM

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via innerHTML with game-generated text | Tampering | Never use innerHTML for any DungeonRenderer output — textContent only (existing project rule) |
| Prototype pollution via `Object.assign({}, data)` | Tampering | FloorConfig already returns shallow copies; DungeonRenderer must not call `Object.assign(this, ...)` or spread untrusted objects |
| Input parsing: `parseInt(selectedValue)` without radix | Tampering | Always use `parseInt(value, 10)` — established project pattern in InputHandler.handleAnswer() |
| Radio input name collision between quiz and combat fieldsets | Tampering | Use `name="combat-answer"` for combat inputs, not `name="answer"` — prevents cross-form radio selection |

---

## Sources

### Primary (HIGH confidence)

- math-lab.html (project codebase) — entire module structure, established patterns, existing CSS/JS
- `.planning/phases/04-dungeon-renderer/04-CONTEXT.md` — all locked design decisions
- `.planning/REQUIREMENTS.md` — COMB-02, COMB-04, COMB-05, ENE-03 requirement text
- `.planning/phases/03-screen-architecture/03-02-SUMMARY.md` — what was built in Phase 3; App.transition API, InputHandler mode guard

### Secondary (MEDIUM confidence)

- `.planning/ROADMAP.md` — Phase 4 success criteria (exact test conditions)
- `.planning/STATE.md` — project architectural decisions history

### Tertiary (LOW confidence)

- [ASSUMED] CSS `@keyframes floatUp` pattern for floating damage numbers — standard web game pattern, not referenced to a specific external source
- [ASSUMED] `animationend` + `{ once: true }` cleanup pattern — standard browser API pattern
- [ASSUMED] Flavor text rotation with `lastFlavorIndex` guard — common game dev pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — vanilla only, zero ambiguity; all patterns already established in codebase
- Architecture: HIGH — fully specified in CONTEXT.md; no design decisions remain open
- Pitfalls: HIGH — derived from direct reading of existing code (CombatEngine throws, ID naming collisions, animation timing)
- Animation constraints: HIGH — locked in CONTEXT.md; 400ms damage number, 300ms HP bar, all under 500ms ADHD limit

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable vanilla JS patterns; no external dependencies to drift)
