# Stack Research

**Domain:** Dungeon crawler combat layer added to existing vanilla JS math practice app (single HTML file)
**Researched:** 2026-06-20
**Confidence:** HIGH

## Executive Summary

The v1 stack (vanilla ES2020+, CSS3, localStorage, requestAnimationFrame) carries forward unchanged. The dungeon crawler adds three new technical concerns on top of it: (1) a finite-state machine to manage game phases (explore, combat, loot, floor-transition, death), (2) DOM-based room/combat rendering using `<section>` panels swapped via CSS class toggling rather than innerHTML replacement, and (3) visual character representation using Unicode emoji and CSS-shaped HP bars without any image files. No new dependencies are introduced. The patterns below are the specific additions needed for v2 — everything already in STACK.md for v1 continues to apply.

---

## New Stack Additions for v2

### 1. Finite-State Machine (Game Phase Controller)

**Use:** Plain JavaScript object with a `state` string and a `transition(event)` method.

**Why:** The dungeon crawler has discrete phases — exploring a room, in combat, receiving loot, transitioning floors, and the death screen. Without an explicit FSM, `if/else` chains multiply across every handler and the flow becomes untraceable. A simple FSM with named states and named events makes illegal transitions visible and keeps the App module clean.

**Pattern:**

```javascript
const STATES = {
  EXPLORE:    'explore',
  COMBAT:     'combat',
  LOOT:       'loot',
  TRANSITION: 'floor-transition',
  DEAD:       'dead'
};

const GameFSM = (() => {
  let current = STATES.EXPLORE;

  // Legal transitions: { fromState: { eventName: toState } }
  const transitions = {
    [STATES.EXPLORE]:    { ENTER_ROOM: STATES.COMBAT },
    [STATES.COMBAT]:     { ENEMY_DEAD: STATES.LOOT, PLAYER_DEAD: STATES.DEAD },
    [STATES.LOOT]:       { LOOT_TAKEN: STATES.EXPLORE, FLOOR_CLEAR: STATES.TRANSITION },
    [STATES.TRANSITION]: { NEXT_FLOOR: STATES.EXPLORE },
    [STATES.DEAD]:       { RESTART_FLOOR: STATES.EXPLORE }
  };

  return {
    getState() { return current; },
    send(event) {
      const next = transitions[current]?.[event];
      if (!next) {
        console.warn(`[FSM] Illegal transition: ${current} + ${event}`);
        return false;
      }
      current = next;
      return true;
    },
    is(state) { return current === state; }
  };
})();
```

**Why NOT a library:** XState and similar add 50–200 KB. A 20-line object does 100% of what this game needs. Keep it inline.

**Integration with existing modules:** `InputHandler.handleAnswer` calls `GameFSM.send('ENEMY_DEAD')` or `GameFSM.send('PLAYER_DEAD')` after resolving combat. `App.nextQuestion` is replaced by a dispatcher that reads `GameFSM.getState()` and calls the right render path.

---

### 2. DungeonState Module

**Use:** New closure module alongside existing PlayerState, holding session-scoped run data (current floor, room index, enemy HP, player HP, loot inventory). Not persisted to localStorage — runs are session-scoped (die = restart floor, not persist).

**Why a separate module:** PlayerState holds XP/level/accuracy which persists across sessions. DungeonState holds per-run combat data which resets on floor restart. Mixing them would require clearing dungeon fields on every save/load cycle and risks corrupting the accuracy EWMA between sessions.

**Shape:**

```javascript
const DungeonState = (() => {
  // Session-scoped — not saved to localStorage
  let floor       = 1;   // 1–3 + boss
  let roomIndex   = 0;   // 0–5 (5–6 rooms per floor)
  let playerHp    = 20;
  let playerMaxHp = 20;
  let playerAtk   = 3;   // base attack; upgraded by sword loot
  let playerDef   = 0;   // base defence; upgraded by shield loot
  let potions     = 0;
  let currentEnemy = null;  // { name, hp, maxHp, atk, table, emoji }

  return {
    getFloor()        { return floor; },
    getRoomIndex()    { return roomIndex; },
    getPlayerHp()     { return playerHp; },
    getPlayerMaxHp()  { return playerMaxHp; },
    getEnemy()        { return currentEnemy; },
    getPotions()      { return potions; },

    spawnEnemy(enemyDef) {
      currentEnemy = { ...enemyDef };  // shallow copy of enemy template
    },

    dealDamageToEnemy(amount) {
      currentEnemy.hp = Math.max(0, currentEnemy.hp - amount);
      return currentEnemy.hp === 0;  // returns true if killed
    },

    dealDamageToPlayer(amount) {
      playerHp = Math.max(0, playerHp - Math.max(0, amount - playerDef));
      return playerHp === 0;  // returns true if dead
    },

    applyLoot(lootType) {
      if (lootType === 'sword')   playerAtk  = Math.min(playerAtk + 2, 10);
      if (lootType === 'shield')  playerDef  = Math.min(playerDef + 1, 4);
      if (lootType === 'potion')  potions    = Math.min(potions + 1, 3);
    },

    usePotion() {
      if (potions === 0) return false;
      potions--;
      playerHp = Math.min(playerMaxHp, playerHp + 8);
      return true;
    },

    advanceRoom() {
      roomIndex++;
    },

    advanceFloor() {
      floor++;
      roomIndex = 0;
      // Partial heal on floor transition (rewarding, not full reset)
      playerHp = Math.min(playerMaxHp, playerHp + 5);
    },

    restartFloor() {
      roomIndex = 0;
      playerHp  = playerMaxHp;
      potions   = 0;
      playerAtk = 3;
      playerDef = 0;
    },

    getAttack() { return playerAtk; }
  };
})();
```

---

### 3. Enemy Definitions (Data, Not Code)

**Use:** A plain `ENEMIES` config object — not a class hierarchy. Each enemy is a template object. `DungeonState.spawnEnemy()` shallow-copies the template into live state.

**Why not classes:** ES6 classes add `new`, `this`, prototype chains, and inheritance complexity to a data structure that never needs methods. A plain object with spread is simpler to read, test, and modify.

```javascript
const ENEMIES = {
  goblin: {
    name:    'Goblin',
    emoji:   '👺',
    hp:      8,
    maxHp:   8,
    atk:     2,
    tables:  [2, 3, 5],   // question pool for this enemy
    xpDrop:  15,
    lootTable: ['potion', null, null]  // 1-in-3 chance
  },
  skeleton: {
    name:    'Skeleton',
    emoji:   '💀',
    hp:      14,
    maxHp:   14,
    atk:     4,
    tables:  [4, 6, 7],
    xpDrop:  25,
    lootTable: ['sword', 'potion', null]
  },
  dragon: {
    name:    'Dragon',
    emoji:   '🐉',
    hp:      30,
    maxHp:   30,
    atk:     7,
    tables:  [7, 8, 9],
    xpDrop:  80,
    lootTable: ['sword', 'shield', 'potion']
  }
};
```

**Integration:** `QuestionSelector.selectNext` already accepts a table list. For combat questions, pass `currentEnemy.tables` directly instead of the full table pool from CONFIG.

---

### 4. DOM Panel Architecture (Screen Switching)

**Use:** Pre-rendered `<section>` panels in the HTML, toggled visible/hidden by a single CSS class on `<main>`. No innerHTML swapping for screen changes.

**Why:** innerHTML replacement on every screen change re-creates DOM nodes, resets focus, and flashes content. CSS class toggling on a wrapper is instantaneous, preserves focus, and plays well with CSS transitions for panel slide-in/out.

**HTML structure:**

```html
<main id="game-board" data-screen="explore">
  <section id="screen-explore">...</section>
  <section id="screen-combat">...</section>
  <section id="screen-loot">...</section>
  <section id="screen-transition">...</section>
  <section id="screen-dead">...</section>
</main>
```

**CSS:**

```css
/* All screens hidden by default */
#game-board > section { display: none; }

/* Only the active screen shows — driven by data-screen attribute */
#game-board[data-screen="explore"]    #screen-explore    { display: flex; }
#game-board[data-screen="combat"]     #screen-combat     { display: flex; }
#game-board[data-screen="loot"]       #screen-loot       { display: flex; }
#game-board[data-screen="floor-transition"] #screen-transition { display: flex; }
#game-board[data-screen="dead"]       #screen-dead       { display: flex; }
```

**JS (Renderer addition):**

```javascript
showScreen(stateName) {
  document.getElementById('game-board').dataset.screen = stateName;
}
```

**Why `data-screen` attribute over class toggling:** A single attribute swap on the parent is one DOM write that controls all children. Adding/removing classes on each child section requires one write per section and risks forgetting one.

---

### 5. HP Bar Rendering (CSS + DOM, No Canvas, No Images)

**Use:** A `<div class="hp-bar"><div class="hp-fill"></div></div>` where the fill's `width` is set inline as a percentage. No canvas, no SVG, no images.

**Why:** Canvas requires `getContext('2d')` and a repaint loop. SVG adds markup complexity. A CSS bar is three lines of JS and hardware-accelerated via CSS `transition: width`.

```css
.hp-bar {
  width: 100%;
  height: 12px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #444;
}

.hp-fill {
  height: 100%;
  background: var(--accent);   /* green at full health */
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

/* Color shifts as HP drops — pure CSS, no JS color logic */
.hp-fill[data-health="low"]      { background: #ff6600; }   /* orange below 50% */
.hp-fill[data-health="critical"] { background: var(--danger); }  /* red below 25% */
```

```javascript
// In Renderer:
updateHpBar(barEl, current, max) {
  const pct = Math.max(0, (current / max) * 100);
  barEl.querySelector('.hp-fill').style.width = pct + '%';
  const fill = barEl.querySelector('.hp-fill');
  fill.style.width = pct + '%';
  fill.dataset.health = pct <= 25 ? 'critical' : pct <= 50 ? 'low' : 'ok';
}
```

---

### 6. Combat Feedback Animations (CSS @keyframes Only)

**Use:** CSS `@keyframes` classes added/removed by JS for hit flash, enemy shake, and damage numbers. No JavaScript animation library, no requestAnimationFrame animation loop for visual effects.

**Why CSS over JS for visual feedback:** CSS animations are GPU-composited and run on the compositor thread — they don't block JS execution during the 1s feedback delay that already exists in `InputHandler`. Adding them via a class toggle is one line of JS.

**Patterns:**

```css
/* Enemy takes damage — red flash */
@keyframes enemyHit {
  0%   { filter: brightness(1) sepia(0); transform: translateX(0); }
  20%  { filter: brightness(3) sepia(1) hue-rotate(-30deg); transform: translateX(-6px); }
  40%  { transform: translateX(6px); }
  60%  { transform: translateX(-3px); }
  100% { filter: brightness(1) sepia(0); transform: translateX(0); }
}

.enemy-sprite.hit {
  animation: enemyHit 0.45s ease-out forwards;
}

/* Player takes damage — screen edge flash */
@keyframes playerHurt {
  0%   { box-shadow: inset 0 0 0 0 rgba(255, 51, 51, 0); }
  30%  { box-shadow: inset 0 0 40px 20px rgba(255, 51, 51, 0.4); }
  100% { box-shadow: inset 0 0 0 0 rgba(255, 51, 51, 0); }
}

#game-board.player-hurt {
  animation: playerHurt 0.6s ease-out forwards;
}

/* Damage number float (no JS position calc needed) */
@keyframes dmgFloat {
  0%   { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-40px); }
}

.dmg-number {
  position: absolute;
  pointer-events: none;
  font-weight: 900;
  animation: dmgFloat 0.8s ease-out forwards;
}
```

**JS integration (one-shot class add/remove):**

```javascript
// Trigger and auto-clean via animationend
function triggerAnimation(el, className) {
  el.classList.add(className);
  el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
}
```

This pattern is already established in v1's `showLevelUpOverlay` — extend it, don't replace it.

---

### 7. Character Representation (Emoji + CSS Shapes — No Images)

**Use:** Unicode emoji for enemy sprites; CSS borders and `clip-path` for decorative dungeon UI elements (doorways, keys, chests). No PNG/JPG/SVG image files.

**Why emoji:** Emoji render natively on all modern browsers including Chrome/Edge/Firefox on Windows. They scale with `font-size`. No network request, no file size, no CORS issue. At 2–4em they read clearly as character "sprites" in a DOM-based RPG without any visual ambiguity.

**Concrete character assignments:**

| Entity | Emoji/Unicode | CSS font-size |
|--------|--------------|---------------|
| Goblin | 👺 | 5rem |
| Skeleton | 💀 | 5rem |
| Dragon (boss) | 🐉 | 6rem |
| Player (hero) | ⚔️ | 4rem |
| Sword loot | 🗡️ | 2.5rem |
| Shield loot | 🛡️ | 2.5rem |
| Potion | 🧪 | 2.5rem |
| Locked door | 🚪 | 3rem |
| Stairs (next floor) | 🪜 | 3rem |
| Boss room | 💥 | 3rem |

**Rendering consideration:** Emoji rendering differs between Windows/macOS/Linux at very large sizes. At 5–6rem on a Windows laptop (the target device), all of the above render reliably in Chrome/Edge. Do not use skin-tone modifier emojis — they render differently across systems. Stick to non-human emojis (objects, monsters, symbols).

**Alternative (CSS shapes only):** If emoji feel too playful for the grunge aesthetic, CSS `clip-path` polygons can create angular monster silhouettes. Example:

```css
.enemy-goblin-icon {
  width: 60px; height: 80px;
  background: #2d5a1e;
  clip-path: polygon(50% 0%, 85% 15%, 100% 50%, 85% 85%, 50% 100%, 15% 85%, 0% 50%, 15% 15%);
}
```

This is more work, harder to maintain, and less immediately readable. Emoji is the right call here.

---

### 8. Save Schema Extension (localStorage v2)

**Use:** Bump `PersistenceStore` schema version to `2`, add dungeon-specific persistent fields (best floor reached, total enemies defeated, run count) while keeping all v1 fields intact. Session-scoped combat state (DungeonState) is NOT persisted.

**Why version bump:** v1 save data is already in the wild (the existing app). A version mismatch causes `PersistenceStore.load()` to return defaults — which wipes XP and accuracy. The migration path must preserve v1 data.

**Migration pattern:**

```javascript
load() {
  // ...existing parse + validate...
  if (data.version === 1) {
    // Migrate v1 → v2: add dungeon stats with defaults
    return {
      ...data,
      version: 2,
      bestFloor:       1,
      totalEnemies:    0,
      totalRuns:       0
    };
  }
  if (data.version === 2) return data;
  // Unknown version — use defaults
  return defaults();
}
```

**New fields (v2 only, not in DungeonState):**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `bestFloor` | number | 1 | Persistent achievement; shown in HUD |
| `totalEnemies` | number | 0 | Lifetime counter; motivational stat |
| `totalRuns` | number | 0 | Counts floor restarts for analytics |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| HTML5 Canvas | No canvas libraries exist offline; drawing API is verbose for DOM-based UI; no benefit over CSS for this scope | CSS HP bars + emoji sprites + CSS @keyframes |
| Phaser.js / Kaboom.js | 1–2 MB; breaks single-file constraint; designed for sprite-sheet games, not DOM text-based | Plain JS FSM + DOM panels |
| Web Animations API (WAAPI) | More verbose than CSS keyframes for this use case; `element.animate()` requires JS arrays of keyframe objects | CSS `@keyframes` + class toggling |
| `<canvas>` for room maps | Canvas is stateful and requires repaint on every state change; DOM is easier to update declaratively | `<section>` panels swapped via `data-screen` |
| sessionStorage for DungeonState | No benefit over a JS closure variable; sessionStorage adds serialization/deserialization overhead for state that resets per floor anyway | Module-scoped closure variables in DungeonState |
| Object.assign prototype inheritance for enemies | Introduces `this` binding complexity and prototype chain bugs in strict mode | Plain object spread `{ ...enemyTemplate }` |
| CSS Grid layout for dungeon map | Floor map visualization (5–6 rooms) doesn't need a 2D grid; a linear `<ol>` of room indicators suffices | Flexbox `<ol>` with room nodes |

---

## Integration Points with v1 Modules

| v1 Module | Change Required | Notes |
|-----------|----------------|-------|
| `CONFIG` | Add dungeon constants: `ROOMS_PER_FLOOR`, `FLOORS`, `PLAYER_MAX_HP`, `BASE_DAMAGE`, `FLOOR_HEAL` | Keep existing keys; add new ones below. |
| `XpCalculator` | No change needed | Enemy XP drops are defined in `ENEMIES` config, passed to `PlayerState.addXp()` directly. |
| `PlayerState` | No change needed | `addXp` and `updateAccuracy` called from combat resolution, same as before. |
| `PersistenceStore` | Version bump to 2 + migration | See schema extension above. |
| `QuestionSelector.selectNext()` | Add optional `tables` parameter | `selectNext(playerState, tables)` — if `tables` provided, use it instead of full CONFIG pool. Defaults to existing behavior if omitted. |
| `Renderer` | Add: `showScreen()`, `updateHpBar()`, `showEnemy()`, `showLoot()`, `triggerAnimation()` | Extend the existing Renderer object; do not replace it. |
| `InputHandler` | Add: FSM-aware dispatch in `handleAnswer` | After answer is evaluated, call `GameFSM.send()` with the appropriate event, then let App dispatcher handle routing. |
| `App` | Replace `nextQuestion()` with `dispatch()` | `dispatch()` reads `GameFSM.getState()` and calls the appropriate `Renderer.*` + `DungeonState.*` methods. |

---

## New Module Load Order

```
CONFIG (extended)
  → XpCalculator (unchanged)
  → PlayerState (unchanged)
  → PersistenceStore (v2 schema)
  → ENEMIES (new — data only)
  → DungeonState (new)
  → GameFSM (new)
  → QuestionSelector (extended)
  → DOMContentLoaded {
      DOM cache (extended)
      → Renderer (extended)
      → InputHandler (extended)
      → App.dispatch() (replaces App.nextQuestion)
    }
```

All modules remain in the single `<script>` block. New modules slot in before `DOMContentLoaded` alongside existing pre-DOM modules. No structural change to the file layout is required.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Plain JS FSM object | Class-based state pattern | `class` syntax adds prototype overhead; `new` + `this` binding is unnecessary for a singleton; ES2020 closure is cleaner. |
| `data-screen` attribute on `<main>` | Separate `show/hide` class on each `<section>` | One attribute write vs. N class writes; CSS attribute selectors are equally fast; attribute approach is less error-prone. |
| Emoji character sprites | CSS `clip-path` shapes | Emoji are immediately readable, require zero maintenance, and render correctly on all Windows browsers at target sizes. |
| CSS @keyframes + class toggle | Web Animations API | WAAPI is more verbose and offers no benefit here; class toggling reuses the exact pattern already in v1's level-up overlay. |
| Separate DungeonState closure | Extend PlayerState | Mixing session-scoped combat state with persisted XP/accuracy data creates save-file contamination risk; separation is clean and testable. |
| Enemy tables in ENEMIES config | Pass floor number to QuestionSelector | Decouples enemy difficulty from floor number; a dragon could appear on any floor in future; explicit table list per enemy is clearer intent. |

---

## Performance Targets (v2 additions)

| Metric | Target | Notes |
|--------|--------|-------|
| Single-file size | < 300 KB total | v1 was 848 lines (~28 KB); v2 adds ~250–350 lines; well under limit. |
| Screen switch latency | < 16 ms (1 frame) | `dataset.screen` swap is a single attribute write; CSS handles show/hide. |
| Combat animation frame rate | 60 FPS | All animations are CSS; compositor thread handles them independently of JS. |
| Emoji render size | 5–6rem | Tested range on Windows Chrome/Edge; renders clearly without pixelation. |
| DungeonState memory | < 1 KB | Flat object with ~10 numeric fields; no allocation pressure. |

---

## Sources

- MDN Web Docs — CSS `data-*` attributes and attribute selectors (HIGH — official spec)
- MDN Web Docs — `element.dataset` API (HIGH — official spec)
- MDN Web Docs — CSS `@keyframes` and `animationend` event (HIGH — official spec)
- MDN Web Docs — CSS `clip-path` property (HIGH — official spec)
- Unicode Consortium — Emoji list 15.1, platform rendering notes (HIGH — authoritative)
- Existing v1 codebase (`math-lab.html`) — module boundary conventions, `animationend` + `{ once: true }` pattern already established (HIGH — first-party)

---

*Stack research for: Math Lab v2 — Dungeon Crawler combat layer*
*Researched: 2026-06-20*
*Confidence: HIGH*
