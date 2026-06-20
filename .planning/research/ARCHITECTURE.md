# Architecture Research

**Domain:** Single-file gamified educational web app (vanilla JS)
**Researched:** 2026-06-20
**Confidence:** HIGH

## Standard Architecture

### System Overview

A single-file game app operates as a unified namespace with tightly coupled modules (closures) to avoid globals while maintaining simplicity. The architecture centers on a game loop that drives the entire experience.

```
┌────────────────────────────────────────────────────────────────────┐
│                      GAME LOOP ORCHESTRATOR                        │
│  (requestAnimationFrame → Update → Render → repeat)               │
├────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │  INPUT HANDLER  │  │  STATE MANAGER   │  │  RENDERER       │   │
│  │ (events, input) │  │ (XP, level, Qs)  │  │ (DOM updates)   │   │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘   │
│           │                    │                     │             │
├───────────┴────────────────────┴─────────────────────┴─────────────┤
│  GAME STATE LAYER (shared via closure/namespace)                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  PlayerState (XP, level, accuracy by table, session count)  │ │
│  │  QuestionQueue (current Q, history, weighting calculations)│ │
│  │  PersistenceStore (localStorage interface)                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│  SERVICE LAYER (pure functions for computation)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ XP & Leveling│  │ Question     │  │ Persistence  │            │
│  │ Calculator   │  │ Selector     │  │ Manager      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|-----------------|
| **Game Loop** | Coordinate frame timing, call update/render | `requestAnimationFrame` callback with delta time accumulation |
| **Input Handler** | Capture user interactions (clicks, keyboard) | Event listeners on document; pass to state updates |
| **State Manager** | Hold and modify game state | Closure object with getter/setter methods; single source of truth |
| **Question Selector** | Choose weighted next question based on accuracy history | Algorithm: prioritize weak tables (6–9), weight by recent misses |
| **XP/Level Engine** | Calculate XP earned, determine level ups | Exponential curve (e.g., 100 XP per level, 1.5x multiplier) |
| **Renderer** | Update DOM to reflect current state | Query game state, update DOM elements (no virtual DOM overhead) |
| **Persistence Manager** | Save/load state from localStorage | JSON serialize state; version and migrate on load |

## Recommended Project Structure

Since this is a **single HTML file**, the internal organization uses the namespace module pattern with closures:

```
index.html
├── <style> — Embedded CSS
│   ├── Reset & layout
│   ├── Game board styling
│   ├── UI components (buttons, modals)
│   └── Animations & transitions
│
├── <div> — Semantic HTML structure
│   ├── #app — Root container
│   ├── #game-board — Question & choices display
│   ├── #hud — XP bar, level display, session stats
│   ├── #level-up-modal — Overlay for celebrations
│   └── #menu — Pause/settings (optional v2)
│
└── <script> — Embedded JavaScript, organized as:
    │
    ├── Config object — Constants
    │   ├── XP curves, table weights, question pool
    │   └── DOM selectors, animation timings
    │
    ├── PersistenceStore — localStorage wrapper
    │   ├── load() → player state object
    │   ├── save(state) → JSON to localStorage
    │   └── migrate() → version check & upgrades
    │
    ├── PlayerState — Game state holder (closure)
    │   ├── xp, level, accuracy[table], sessionCount
    │   ├── getLevel(), addXp(), updateAccuracy()
    │   └── toJSON() for persistence
    │
    ├── QuestionSelector — Question weighting logic
    │   ├── selectNext(playerState) → { question, options, answer }
    │   ├── calculateWeights() → distribution by weakness
    │   └── recordAnswer(isCorrect) → update history
    │
    ├── XpCalculator — XP reward rules
    │   ├── calculateXp(table, isCorrect, difficulty) → points
    │   ├── getLevelThreshold(level) → XP required
    │   └── detectLevelUp(xp) → new level?
    │
    ├── Renderer — DOM updates
    │   ├── renderQuestion(q, options)
    │   ├── updateHud(playerState)
    │   ├── showLevelUp(newLevel)
    │   └── animateXpGain(points)
    │
    ├── InputHandler — Event listeners
    │   ├── onAnswerClick(index) → validate & flow
    │   ├── onPauseClick() → pause game (v2)
    │   └── setupEventListeners()
    │
    ├── GameLoop — Main orchestrator
    │   ├── lastTimestamp, accumulatedDelta
    │   ├── tick(timestamp) → update(delta) + render()
    │   ├── update(delta) → advance question timing, check level-ups
    │   ├── render() → Renderer.updateHud() + DOM sync
    │   └── start() → requestAnimationFrame loop
    │
    └── App — Initialization
        ├── Load persisted state
        ├── Initialize all systems
        └── Start game loop
```

### Structure Rationale

- **Single file:** No HTTP requests, no build step, instant portability to Windows. All code loads synchronously in one parse.
- **Closure-based modules:** Each logical component (PlayerState, QuestionSelector, etc.) is an IIFE that returns a public API, keeping internals private without polluting globals.
- **No frameworks:** Vanilla DOM operations are fast and transparent for a simple UI. No virtual DOM overhead; direct `textContent` and `classList` updates.
- **Config object at top:** Magic numbers isolated; easy to tune game balance without touching logic.
- **PersistenceStore abstraction:** localStorage logic isolated; can swap for IndexedDB later if needed without touching game logic.
- **Service layer separation:** XpCalculator, QuestionSelector, and Renderer are pure-ish functions that don't depend on the full app state; easy to test with console or dev tools.

## Architectural Patterns

### Pattern 1: Module Closure (Namespace Pattern)

**What:** Each component is an IIFE that returns a public API object; internal state is private via closure.

**When to use:** Single-file apps where you need modularity without build tools or frameworks.

**Trade-offs:**
- ✅ Works in any browser, zero dependencies
- ✅ Minimal performance overhead
- ✅ Code organization is clear despite no file separation
- ❌ No tree-shaking; all modules load regardless of use
- ❌ Debugging requires DevTools to inspect closure variables
- ❌ Refactoring to multi-file is more work later

**Example:**
```javascript
const PlayerState = (() => {
  let xp = 0;
  let level = 1;
  const accuracy = {}; // { 1: 0.85, 2: 0.9, ... 9: 0.6 }

  return {
    getXp() { return xp; },
    addXp(points) { 
      xp += points;
      this.checkLevelUp();
    },
    getLevel() { return level; },
    checkLevelUp() {
      const threshold = XpCalculator.getLevelThreshold(level);
      if (xp >= threshold) {
        level++;
        return true; // Signal for celebration
      }
      return false;
    },
    getAccuracy(table) { return accuracy[table] || 0; },
    updateAccuracy(table, correct) {
      const current = accuracy[table] || 0;
      // Simple running average; could be ewma for recency weighting
      accuracy[table] = (current * 0.9) + (correct ? 0.1 : 0);
    },
    toJSON() {
      return { xp, level, accuracy };
    },
    fromJSON(data) {
      xp = data.xp || 0;
      level = data.level || 1;
      Object.assign(accuracy, data.accuracy || {});
    }
  };
})();
```

### Pattern 2: Fixed-Step Game Loop with Delta Time

**What:** Game logic runs at a fixed timestep (e.g., 60 Hz) to ensure determinism; rendering is uncapped. Delta time accumulates across frames to handle variable browser refresh rates.

**When to use:** Games with physics or timing that must be stable across devices; ensures reproducibility.

**Trade-offs:**
- ✅ Timing is predictable; no sudden jumps or slow-mo glitches
- ✅ Game state is independent of frame rate
- ✅ Can easily debug by changing timestep multiplier (slow-mo)
- ❌ Extra code complexity; accumulation logic can be confusing
- ❌ Overkill for turn-based (not real-time) games

**For this app:** The math quiz is turn-based, so a simpler event-driven model is sufficient. Use fixed-step only if you add timed animations (e.g., XP +50 floating upward).

**Example:**
```javascript
const GameLoop = (() => {
  const FIXED_TIMESTEP = 1 / 60; // 16.67 ms per game tick
  let lastTimestamp = null;
  let accumulatedDelta = 0;

  const tick = (timestamp) => {
    if (lastTimestamp === null) lastTimestamp = timestamp;
    let delta = (timestamp - lastTimestamp) / 1000; // Convert to seconds
    lastTimestamp = timestamp;
    
    // Cap delta to prevent huge jumps (e.g., tab lost focus)
    delta = Math.min(delta, 0.1);
    
    accumulatedDelta += delta;
    
    // Update at fixed timestep
    while (accumulatedDelta >= FIXED_TIMESTEP) {
      update(FIXED_TIMESTEP);
      accumulatedDelta -= FIXED_TIMESTEP;
    }
    
    render(); // Render with current accumulated time (for smooth animations)
    requestAnimationFrame(tick);
  };

  return {
    start() {
      requestAnimationFrame(tick);
    },
    update(dt) {
      // Advance question animations, check level-ups, etc.
      // dt is always 1/60 for determinism
    },
    render() {
      // Update DOM based on current state
    }
  };
})();
```

### Pattern 3: Weighted Question Selection via Accuracy History

**What:** Questions are selected based on a probability distribution that prioritizes weak tables and recent mistakes.

**When to use:** Adaptive difficulty + spaced-repetition feel in educational games.

**Trade-offs:**
- ✅ Keeps user focused on weak spots
- ✅ Feels dynamic; not a rigid sequence
- ✅ Simple to implement (no ML needed)
- ❌ Requires careful tuning to avoid repetitive feel
- ❌ Weak tables might dominate if not balanced with easier questions

**Example (simplified):**
```javascript
const QuestionSelector = (() => {
  const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const TARGET_TABLES = [6, 7, 8, 9]; // Focus area
  
  const calculateWeights = (playerState) => {
    const weights = {};
    
    ALL_TABLES.forEach(table => {
      const accuracy = playerState.getAccuracy(table);
      
      if (TARGET_TABLES.includes(table)) {
        // Weak table gets higher weight
        // Inverse: low accuracy = high probability
        weights[table] = (1 - accuracy) ** 1.5;
      } else {
        // Easier tables get lower weight but not zero
        // Occasional confidence boosts
        weights[table] = (1 - accuracy) ** 0.8 * 0.3;
      }
    });
    
    return weights;
  };

  const selectNext = (playerState) => {
    const weights = calculateWeights(playerState);
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    let selected = null;
    
    for (const [table, weight] of Object.entries(weights)) {
      roll -= weight;
      if (roll <= 0) {
        selected = parseInt(table);
        break;
      }
    }
    
    const multiplicand = Math.floor(Math.random() * 10) + 1; // 1–10
    const answer = selected * multiplicand;
    const options = generateMultipleChoice(answer);
    
    return {
      table: selected,
      multiplicand,
      answer,
      options,
      question: `${selected} × ${multiplicand} = ?`
    };
  };

  return { selectNext };
})();
```

### Pattern 4: XP & Level Curve (Exponential Progression)

**What:** Each level requires more XP than the last, following an exponential curve. This creates longer engagement sessions (Skinner Box principle) and a sense of growing achievement.

**When to use:** Games with progression mechanics; XP should feel like it matters without requiring infinite grind.

**Trade-offs:**
- ✅ Early levels feel fast (quick wins); later levels require commitment
- ✅ Clear visual progress (level ↑) motivates return sessions
- ✅ Easily tunable (adjust multiplier or base)
- ❌ Can feel grindy if curve is too steep
- ❌ Requires playtesting to get right for target age/ability

**Example:**
```javascript
const XpCalculator = (() => {
  const BASE_XP_PER_LEVEL = 100; // Level 1 requires 100 XP
  const LEVEL_MULTIPLIER = 1.2;  // Each level is 1.2x harder
  const CORRECT_XP = 10;          // Base XP for correct answer
  
  const getLevelThreshold = (level) => {
    // XP required to reach this level (cumulative)
    return BASE_XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1);
  };

  const getTotalXpForLevel = (level) => {
    // Total XP accumulated to reach this level
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += getLevelThreshold(i);
    }
    return total;
  };

  const calculateXp = (table, isCorrect, accuracy) => {
    let points = 0;
    if (isCorrect) {
      points = CORRECT_XP;
      // Difficulty modifier: harder tables worth more
      if (table >= 6) points *= 1.5; // 6–9 tables are priority
      // Accuracy modifier: consistently correct = bonus
      if (accuracy >= 0.8) points *= 1.2;
    }
    return points;
  };

  return {
    getLevelThreshold,
    getTotalXpForLevel,
    calculateXp
  };
})();
```

### Pattern 5: localStorage Versioning & Migration

**What:** State is serialized to JSON and stored in localStorage. Version number allows safe schema updates without losing player progress.

**When to use:** Any game that persists state locally; future-proofs against adding new features (new accuracy columns, new currencies, etc.).

**Trade-offs:**
- ✅ Simple, no backend needed
- ✅ Fast (synchronous)
- ✅ Survives browser restart
- ❌ Limited to ~5–10 MB per domain
- ❌ No conflict resolution if user plays on multiple devices
- ❌ Can be cleared by cache/cookie wipe

**Example:**
```javascript
const PersistenceStore = (() => {
  const STORAGE_KEY = 'mathlab_player_v2';
  const CURRENT_VERSION = 2;

  const migrate = (data, fromVersion) => {
    if (fromVersion === 1) {
      // v1 → v2: added table-level difficulty tracking
      data.accuracy = data.accuracy || {};
      // Backfill missing tables
      for (let i = 1; i <= 9; i++) {
        if (!(i in data.accuracy)) {
          data.accuracy[i] = 0.5; // Neutral baseline
        }
      }
    }
    data.version = CURRENT_VERSION;
    return data;
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultState();
      
      const data = JSON.parse(raw);
      if (data.version < CURRENT_VERSION) {
        data = migrate(data, data.version);
      }
      return data;
    } catch (e) {
      console.error('localStorage load failed:', e);
      return getDefaultState();
    }
  };

  const save = (playerState) => {
    try {
      const data = {
        version: CURRENT_VERSION,
        ...playerState.toJSON()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('localStorage save failed:', e);
      // Silently fail; game continues in memory
    }
  };

  const getDefaultState = () => ({
    version: CURRENT_VERSION,
    xp: 0,
    level: 1,
    accuracy: { 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
                6: 0.4, 7: 0.4, 8: 0.4, 9: 0.4 },
    sessionCount: 0
  });

  return { load, save };
})();
```

## Data Flow

### Main Event Loop

```
requestAnimationFrame(timestamp)
    ↓
GameLoop.tick(timestamp)
    ├─→ Calculate delta time
    ├─→ Update(delta) — Game state advance
    │   ├─→ Check if time for next question render
    │   ├─→ Detect level-ups
    │   └─→ Update animations/particles if any
    ├─→ Render() — DOM sync
    │   ├─→ Query PlayerState for XP/level/accuracy
    │   ├─→ Update HUD display
    │   └─→ (Animate transitions)
    └─→ requestAnimationFrame(callback) — Loop continues
```

### User Answers a Question

```
User clicks answer choice
    ↓
InputHandler.onAnswerClick(index)
    ├─→ Get current question & user selection
    ├─→ Validate: is it correct?
    ├─→ Calculate XP earned
    │   └─→ XpCalculator.calculateXp(table, isCorrect, accuracy)
    ├─→ Update PlayerState
    │   ├─→ PlayerState.addXp(points)
    │   ├─→ PlayerState.updateAccuracy(table, isCorrect)
    │   └─→ Detect level-up (internal to PlayerState)
    ├─→ PersistenceStore.save(PlayerState)
    ├─→ Select next question
    │   └─→ QuestionSelector.selectNext(PlayerState)
    ├─→ Renderer updates HUD & question display
    └─→ (Next frame will animate transitions)
```

### Initialization & State Restore

```
App.init()
    ↓
PersistenceStore.load() → prev player data or defaults
    ↓
PlayerState.fromJSON(data) → hydrate game state
    ↓
Renderer.renderQuestion() & Renderer.updateHud()
    ↓
GameLoop.start() → begins requestAnimationFrame loop
```

### Key Data Flows

1. **Question Selection Flow:** PlayerState (accuracy by table) → QuestionSelector (weighting algorithm) → Question object (table, multiplicand, options) → Renderer (DOM update)

2. **XP Reward Flow:** Answer validation → XpCalculator (apply modifiers) → XP points → PlayerState.addXp() → Level-up detection → PersistenceStore.save() → Renderer celebration

3. **Persistence Flow:** PlayerState.toJSON() → localStorage (versioned) → on next session: load() → PlayerState.fromJSON() → game resumes

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **1 session (MVP)** | Single HTML file; all modules in one file; no optimization needed. Focus on game feel. |
| **Multiple sessions (v2+)** | localStorage persistence is already built-in; question weighting can stay simple (inverse accuracy). |
| **Offline indicator (future)** | Add Service Worker for offline capability; same architecture, SW just intercepts fetch. |
| **Mobile version (future)** | Touch events added to InputHandler; responsive CSS media queries. Single file still works. |
| **Analytics (future)** | Add optional events layer; post to server if online, queue locally if offline. Doesn't change game logic. |

### Scaling Priorities

1. **First concern:** Game feel is mushy — animations lag or stutter. Fix: profile DOM updates; batch them. Use `requestAnimationFrame` to sync with browser refresh (already in pattern).

2. **Second concern:** XP grind feels tedious. Fix: tune curve (LEVEL_MULTIPLIER, BASE_XP_PER_LEVEL); playtest with target user. Adjust weighting so weak tables appear 60–70% of the time.

3. **Third concern:** localStorage quota full (5–10 MB). Fix: at 1-2 years of play, ~500 KB used for state + history. Unlikely to hit limit; if it does, add optional cloud save (v3+).

## Anti-Patterns

### Anti-Pattern 1: Global Variables Outside Namespace

**What people do:** Write game logic directly into global scope; no closure wrapping.

```javascript
// ❌ DON'T DO THIS
let playerXp = 0;
let playerLevel = 1;

function addXp(points) {
  playerXp += points;
}
```

**Why it's wrong:** Naming collisions; hard to refactor; pollutes debugger; difficult to test in isolation.

**Do this instead:** Wrap in closure IIFE; return public API only.

```javascript
// ✅ DO THIS
const PlayerState = (() => {
  let xp = 0;
  let level = 1;
  
  return {
    addXp(points) { xp += points; },
    getXp() { return xp; }
  };
})();
```

### Anti-Pattern 2: DOM Queries Inside Hot Loops

**What people do:** Repeatedly query the DOM for the same element inside `update()` or `render()`.

```javascript
// ❌ DON'T DO THIS
const render = () => {
  for (let i = 0; i < 1000; i++) {
    document.getElementById('xp-display').textContent = playerState.getXp();
  }
};
```

**Why it's wrong:** DOM queries are expensive; doing it repeatedly wastes CPU; UI feels janky.

**Do this instead:** Cache DOM reference; update once.

```javascript
// ✅ DO THIS
const xpDisplay = document.getElementById('xp-display');

const render = () => {
  xpDisplay.textContent = playerState.getXp();
};
```

### Anti-Pattern 3: Tightly Coupled State & UI

**What people do:** Render code directly modifies state; state changes directly manipulate DOM; hard to reason about what affects what.

```javascript
// ❌ DON'T DO THIS
const onAnswerClick = (idx) => {
  const isCorrect = answers[idx] === correctAnswer;
  if (isCorrect) playerXp += 10; // State change
  document.getElementById('xp').textContent = playerXp; // UI change in event handler
  document.getElementById('choices').innerHTML = ''; // Side effect
};
```

**Why it's wrong:** Logic is scattered; hard to test; refactoring breaks things; UI and state get out of sync.

**Do this instead:** Separate concerns: update state, then let render pull from state.

```javascript
// ✅ DO THIS
const onAnswerClick = (idx) => {
  const isCorrect = validateAnswer(idx, currentQuestion);
  const xpEarned = XpCalculator.calculateXp(currentQuestion.table, isCorrect);
  PlayerState.addXp(xpEarned); // Update state only
  PlayerState.updateAccuracy(currentQuestion.table, isCorrect);
  // Render will be called by game loop and read from state
};

const render = () => {
  Renderer.updateHud(PlayerState);
  Renderer.renderQuestion(QuestionSelector.selectNext(PlayerState));
};
```

### Anti-Pattern 4: Over-Eager Weighting Algorithm

**What people do:** Make question selection so complex that weak tables *always* appear, and it feels repetitive.

```javascript
// ❌ DON'T DO THIS
const selectNext = (playerState) => {
  const weakTables = [6, 7, 8, 9].filter(t => playerState.getAccuracy(t) < 0.7);
  // If user is weak at everything, only drill weak tables forever
  return randomFromArray(weakTables);
};
```

**Why it's wrong:** Feels like punishment; no confidence-building breaks; user gives up.

**Do this instead:** Mix weak tables (60–70%) with easier ones (30–40%) to maintain engagement and confidence.

```javascript
// ✅ DO THIS
const weights = {};
ALL_TABLES.forEach(table => {
  const accuracy = playerState.getAccuracy(table);
  if (TARGET_TABLES.includes(table)) {
    weights[table] = (1 - accuracy) ** 1.5; // Prioritize weak
  } else {
    weights[table] = (1 - accuracy) ** 0.8 * 0.3; // Occasional confidence boosts
  }
});
```

### Anti-Pattern 5: No Version Control on localStorage

**What people do:** Change the schema of player state (add a new field) without migration; old saves break or lose data.

```javascript
// ❌ DON'T DO THIS
const save = (playerState) => {
  localStorage.setItem('game_state', JSON.stringify(playerState));
};

// Later, you add a `sessionCount` field. Old saves don't have it.
// playerState.sessionCount is undefined; bugs ensue.
```

**Why it's wrong:** Players lose progress; feel betrayed; uninstall; bad review.

**Do this instead:** Include version number; detect and migrate on load.

```javascript
// ✅ DO THIS
const CURRENT_VERSION = 2;

const load = () => {
  const raw = localStorage.getItem('game_state');
  const data = JSON.parse(raw);
  
  if (data.version < CURRENT_VERSION) {
    data = migrate(data, data.version);
  }
  
  return data;
};
```

## Integration Points

### External Services

| Service | Integration | Notes |
|---------|-------------|-------|
| **localStorage** | `PersistenceStore.load()` / `.save()` | Synchronous; ~5–10 MB limit. Consider IndexedDB if you add analytics/history logs later. |
| **RequestAnimationFrame** | `GameLoop.start()` callback | Built-in browser API; no dependency. Automatically syncs to refresh rate. |
| **DOM Events** | `InputHandler.setupEventListeners()` | Attach to document or specific elements; no framework events needed. |
| **Future: Cloud Save** | Optional async `PersistenceStore.syncCloud()` | Not in MVP; would post state to server if online, queue if offline. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **InputHandler ↔ PlayerState** | Events → State mutations | InputHandler calls PlayerState methods; no return value needed. |
| **PlayerState ↔ Renderer** | Getter methods → DOM updates | Renderer queries PlayerState; one-way pull. Keeps them loosely coupled. |
| **QuestionSelector ↔ PlayerState** | Reads accuracy → Returns Question object | Selector is pure; reads state, no mutations. Easy to test. |
| **XpCalculator ↔ PlayerState** | Receives params → Returns points | Calculator doesn't touch state; PlayerState.addXp() applies it. |
| **GameLoop ↔ All** | Calls update() then render() | GameLoop coordinates; others don't know about it. |
| **PersistenceStore ↔ PlayerState** | toJSON() / fromJSON() | Serialization is bidirectional; state owns its own schema. |

## Build Order for Implementation

**Recommended phase sequencing** (based on dependencies):

1. **PlayerState + Config** — Foundation; everything else reads from it.
2. **PersistenceStore** — Load defaults; save/restore state.
3. **Renderer** — Display the UI; pull from state.
4. **QuestionSelector + XpCalculator** — Question logic; independent of UI.
5. **InputHandler** — Wire up interactivity.
6. **GameLoop** — Orchestrate the flow.
7. **Polish** — Animations, transitions, sound effects (if any).

**Dependency graph:**
```
Config
  ↓
PlayerState
  ├─→ PersistenceStore (load/save)
  ├─→ XpCalculator (read-only)
  └─→ QuestionSelector (read-only)
       ↓
    Renderer (reads PlayerState & Questions)
       ↓
    InputHandler (mutates PlayerState)
       ↓
    GameLoop (coordinates all)
```

## Sources

- [Game Programming Patterns: Game Loop](https://gameprogrammingpatterns.com/game-loop.html)
- [JavaScript Game Foundations - Game Loop by Jake Gordon](https://jakesgordon.com/writing/javascript-game-foundations-the-game-loop/)
- [Time-Based Animation with requestAnimationFrame](https://dr-nick-nagel.github.io/blog/raf-time.html)
- [Performant Game Loops in JavaScript by Aleksandr Hovhannisyan](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/)
- [Module Design Pattern by DigitalOcean](https://www.digitalocean.com/community/conceptual-articles/module-design-pattern-in-javascript)
- [How JavaScript works: Module Pattern by Lawrence Eagles](https://medium.com/sessionstack-blog/how-javascript-works-the-module-pattern-comparing-commonjs-amd-umd-and-es6-modules-437f77548437)
- [State Management Without Libraries by Adam Morelli](https://www.adammorelli.com/blog/vanilla-state-management)
- [Quick & Easy Game State Saving with localStorage by Scott Westover](https://scottwestover.dev/post/2023/04/quick-and-easy-game-state-saving-with-javascript-and-localstorage/)
- [Adaptive Difficulty and Stealth Assessment in Collaborative Game-Based Learning (Rjiba, 2025)](https://onlinelibrary.wiley.com/doi/10.1002/cae.70102)
- [Spaced Repetition Algorithm: FSRS on GitHub](https://github.com/open-spaced-repetition/fsrs4anki/wiki/Spaced-Repetition-Algorithm:-A-Three%E2%80%90Day-Journey-from-Novice-to-Expert)
- [Medium: Spaced Repetition for All by Shane Mooney](https://medium.com/tech-quizlet/spaced-repetition-for-all-cognitive-science-meets-big-data-in-a-procrastinating-world-59e4d2c8ede1)
- [Creating HTML5 Games in Vanilla JavaScript by Geng Sng](https://medium.com/@snggeng/creating-html5-games-in-vanilla-javascript-part-i-4b37ba947e10)
- [How I structure my vanilla JS projects by Go Make Things](https://gomakethings.com/how-i-structure-my-vanilla-js-projects/)

---

*Architecture research for: Single-file gamified math practice web app*
*Researched: 2026-06-20*
