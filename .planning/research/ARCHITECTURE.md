# Architecture Research

**Domain:** Dungeon crawler combat layer on top of existing single-file vanilla JS math app
**Researched:** 2026-06-20
**Confidence:** HIGH

> **Scope note:** This document supersedes the v1 ARCHITECTURE.md for the v2.0 Dungeon Crawler milestone. It focuses specifically on how to integrate new dungeon modules into the existing codebase without breaking v1 math engine behaviour, how to migrate the save schema from v1 to v2, how to render rooms and enemies in pure DOM+CSS, and what build order makes sense given module dependencies.

---

## System Overview

The v2 architecture adds three new layers — dungeon state, combat engine, and dungeon renderer — that sit *around* the existing math engine, not inside it. The existing modules (CONFIG, XpCalculator, PlayerState, PersistenceStore, QuestionSelector, Renderer, InputHandler, App) are modified minimally. The new modules consume the existing ones; the existing ones do not know about the dungeon.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HUD (extended)                               │
│  Level | XP bar | HP bar | Floor/Room indicator                     │
├─────────────────────────────────────────────────────────────────────┤
│                        GAME SCREENS (one visible at a time)          │
│  ┌─────────────────┐  ┌────────────────┐  ┌───────────────────┐    │
│  │  DUNGEON VIEW   │  │  COMBAT VIEW   │  │  FLOOR COMPLETE   │    │
│  │  Room map,      │  │  Enemy sprite, │  │  Loot summary,    │    │
│  │  door choices   │  │  HP bars,      │  │  continue button  │    │
│  │  (between fights│  │  question card │  │                   │    │
│  └────────┬────────┘  └───────┬────────┘  └────────┬──────────┘    │
│           │ (enter room)      │ (answer)             │ (cleared)    │
├───────────┴───────────────────┴──────────────────────┴──────────────┤
│                        ORCHESTRATOR: App                             │
│  mode: 'dungeon' | 'combat' | 'loot' | 'floor-complete'            │
│  Routes events and screen transitions                               │
├─────────────────────────────────────────────────────────────────────┤
│  NEW MODULES                          EXISTING (v1) MODULES         │
│  ┌──────────────┐  ┌───────────┐      ┌────────────────────────┐   │
│  │ DungeonState │  │FloorConfig│      │ PlayerState (extended) │   │
│  │ floor, room, │  │enemy types│      │ xp, level, accuracy,   │   │
│  │ enemyHp,     │  │tables per │      │ + hp, maxHp            │   │
│  │ playerHp,    │  │floor,     │      └────────────────────────┘   │
│  │ loot         │  │room count │      ┌────────────────────────┐   │
│  └──────┬───────┘  └─────┬─────┘      │ QuestionSelector       │   │
│         │                │            │ (unchanged; used by    │   │
│  ┌──────┴───────┐         │            │ CombatEngine)          │   │
│  │CombatEngine  │◄────────┘            └────────────────────────┘   │
│  │Wraps Question│                      ┌────────────────────────┐   │
│  │Selector;     │                      │ XpCalculator           │   │
│  │damage calc;  │                      │ (unchanged)            │   │
│  │hit/miss logic│                      └────────────────────────┘   │
│  └──────┬───────┘                      ┌────────────────────────┐   │
│         │                              │ PersistenceStore v2    │   │
│  ┌──────┴──────────────┐               │ migrates v1 → v2 on    │   │
│  │ DungeonRenderer     │               │ first load             │   │
│  │ Room display,       │               └────────────────────────┘   │
│  │ enemy sprite,       │                                            │
│  │ HP bars, loot anims │                                            │
│  └─────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

### Existing modules — what changes vs. what is untouched

| Module | v2 Change | Rationale |
|--------|-----------|-----------|
| **CONFIG** | Add dungeon constants block (HP values, damage amounts, loot drop rates, floor counts). Existing keys are untouched. | Single source of truth; all new magic numbers co-located with old ones. |
| **XpCalculator** | No change. | XP is still awarded per correct answer, same formula. |
| **PlayerState** | Add `hp` and `maxHp` fields. Keep all accuracy/history logic intact. Add `takeDamage(amount)`, `heal(amount)`, `resetHp()` methods. | HP is session-scoped (resets on floor restart); accuracy data is persistent. Both live in one state object because they share the save/load cycle. |
| **PersistenceStore** | Bump VERSION to 2. Add `migrate(data, fromVersion)` function. v1→v2 migration adds `dungeon` sub-object with defaults (floor 1, room 1, no loot) without touching accuracy/history. Change SAVE_KEY to `mathlab_save_v2` to guarantee a clean migration path. | Existing v1 save at `mathlab_save_v1` is read once, migrated, written to v2 key. Old key is left (not deleted) so a rollback remains possible. |
| **QuestionSelector** | No change. | CombatEngine calls `selectNext(playerState)` with the same interface; the floor config is resolved before calling selector, not inside it. |
| **Renderer** | Rename to `MathRenderer` (or keep as `Renderer`). Its methods still manage the question card and HUD XP/level display. HP bar is owned by `DungeonRenderer`. | Keeps separation of concerns: `Renderer` owns math feedback UI; `DungeonRenderer` owns everything dungeon-visual. |
| **InputHandler** | Add awareness of `App.mode`. When mode is `'dungeon'`, ignore answer events. When mode is `'combat'`, route as before. | InputHandler already has a `locked` flag; mode check is a one-line guard added to `handleAnswer`. |
| **App** | Add `mode` field and `transition(newMode)` method. Bootstrap now also initialises `DungeonState`. | App becomes the screen router. Current `App.nextQuestion()` becomes `App.nextCombatRound()` internally; external API stays. |

### New modules — full responsibility definitions

| Module | Responsibility | Does NOT own |
|--------|---------------|-------------|
| **FloorConfig** | Static data: enemy name, sprite variant, HP values, which multiplication tables to use, loot drop table per floor. Returns config object for a given floor number. Pure data, no state. | Any game logic. It is a lookup table, not a controller. |
| **DungeonState** | Runtime dungeon state: current floor number, current room index, current enemy HP, current enemy type, loot inventory (array of collected items), rooms-cleared count. Exposes `enterRoom()`, `dealDamageToEnemy(amount)`, `isEnemyDefeated()`, `collectLoot(item)`, `toJSON()`, `fromJSON()`. | Player HP (owned by PlayerState). Question logic. |
| **CombatEngine** | Bridges math answers to combat outcomes. On correct answer: calculates damage using table difficulty + optional weapon modifier, calls `DungeonState.dealDamageToEnemy(damage)`. On wrong answer: calculates enemy damage, calls `PlayerState.takeDamage(damage)`. Calls `QuestionSelector.selectNext(playerState, tablePool)` where `tablePool` comes from `FloorConfig` for the current floor. Decides if combat round ends (enemy HP ≤ 0) or player HP ≤ 0. | DOM. QuestionSelector internals. Rendering. |
| **DungeonRenderer** | All DOM manipulation for the dungeon view: room layout, enemy sprite (CSS-drawn), HP bars for both player and enemy, loot drop animations, floor-complete screen. Reads from `DungeonState`, `PlayerState` (for player HP), and `FloorConfig` (for enemy name/sprite variant). Owns a separate DOM cache (`DUNGEON_DOM`) populated at init. | Question rendering (that is `Renderer`'s territory). State mutations. |

---

## Recommended Module Insertion Order in the Single HTML File

Because all modules are sequential `const` declarations in one `<script>` block, order equals dependency order.

```
<script>
  'use strict';

  // --- EXISTING (minimal changes noted) ---
  const CONFIG           // + dungeon constants block appended
  const XpCalculator     // unchanged
  const PlayerState      // + hp/maxHp fields and HP methods
  const PersistenceStore // + VERSION=2, migrate(), new SAVE_KEY

  // --- NEW: static data, no dependencies ---
  const FloorConfig      // pure data; depends only on CONFIG

  // --- EXISTING ---
  const QuestionSelector // unchanged

  // --- NEW: stateful dungeon objects ---
  const DungeonState     // depends on FloorConfig

  // --- NEW: combat bridge ---
  const CombatEngine     // depends on QuestionSelector, DungeonState,
                         //   PlayerState, XpCalculator, FloorConfig

  document.addEventListener('DOMContentLoaded', () => {

    // DOM caches
    const DOM         = { /* existing math DOM refs */ }
    const DUNGEON_DOM = { /* new dungeon DOM refs */ }

    // --- EXISTING renderer ---
    const Renderer       // unchanged; uses DOM cache

    // --- NEW dungeon renderer ---
    const DungeonRenderer // uses DUNGEON_DOM + reads DungeonState,
                          //   PlayerState, FloorConfig

    // --- EXISTING (one-line mode guard added) ---
    const InputHandler

    // --- EXISTING (mode field + transition() added) ---
    const App

    // Bootstrap
    // ...
  });
</script>
```

---

## Save Schema: v1 → v2 Migration

### v1 schema (current)

```json
{
  "version": 1,
  "xp": 0,
  "level": 1,
  "accuracy": { "1": 0.5, "2": 0.5, "3": 0.5, "4": 0.5, "5": 0.5,
                "6": 0.4, "7": 0.4, "8": 0.4, "9": 0.4 },
  "history":  {}
}
```

### v2 schema (target)

```json
{
  "version": 2,
  "xp": 0,
  "level": 1,
  "accuracy": { "1": 0.5, ... "9": 0.4 },
  "history":  {},
  "dungeon": {
    "floor": 1,
    "roomsCleared": 0,
    "loot": []
  }
}
```

### Migration logic

```javascript
// Inside PersistenceStore:
const VERSION = 2;
const KEY = 'mathlab_save_v2';
const LEGACY_KEY = 'mathlab_save_v1';

function migrate(data, fromVersion) {
  if (fromVersion === 1) {
    // Carry forward all math progress; add dungeon sub-object
    data.dungeon = { floor: 1, roomsCleared: 0, loot: [] };
    data.version = 2;
  }
  return data;
}

function load() {
  // 1. Try v2 key first
  let raw = localStorage.getItem(KEY);
  if (!raw) {
    // 2. Fall back to v1 key (migration path)
    raw = localStorage.getItem(LEGACY_KEY);
  }
  if (!raw) return defaults();

  const data = JSON.parse(raw);
  if (data.version < VERSION) return migrate(data, data.version);
  return data;
}
```

**Key constraint:** Player HP (`hp`, `maxHp`) is NOT in the save schema. HP is session-scoped — the player always starts a floor at full HP. HP is held in `PlayerState` in memory only. The save schema only persists progress that should survive a browser close.

**DungeonState floor/room progress** is also NOT persisted in v2. Dungeon runs are session-scoped (the game design specifies "no permadeath: die = restart the floor"). There is no benefit to saving mid-floor state — on reload the player starts fresh at floor 1. The `dungeon` object in the save schema is reserved for future cross-session dungeon progress (e.g., "deepest floor reached") but is not functionally used in v2 gameplay.

---

## Data Flow

### Combat round flow (the core loop replacement)

```
User enters a room
    ↓
App.transition('combat')
    ├─→ FloorConfig.get(DungeonState.floor) → enemy config
    ├─→ DungeonState.enterRoom(enemyConfig) → reset enemy HP
    ├─→ CombatEngine.startRound() → calls QuestionSelector.selectNext(
    │       playerState, enemyConfig.tablePools
    │   ) → question object
    ├─→ Renderer.showQuestion(question)     (existing)
    └─→ DungeonRenderer.renderCombat(
            DungeonState, PlayerState, enemyConfig
        )

User selects answer
    ↓
InputHandler.handleAnswer(selectedValue)  (existing path, with mode guard)
    ↓
CombatEngine.resolveAnswer(isCorrect, question)
    ├─→ [correct] → damage = CombatEngine.calcPlayerDamage(question.table,
    │       DungeonState.loot)
    │   DungeonState.dealDamageToEnemy(damage)
    │   XpCalculator.calculateXp(question.table) → PlayerState.addXp(xp)
    │   DungeonRenderer.animatePlayerAttack(damage)
    │
    ├─→ [wrong] → damage = FloorConfig.enemyDamage(DungeonState.floor)
    │   PlayerState.takeDamage(damage)
    │   DungeonRenderer.animateEnemyAttack(damage)
    │
    ├─→ PlayerState.updateAccuracy(table, isCorrect)  (existing)
    ├─→ PersistenceStore.save(PlayerState, DungeonState)
    ├─→ Renderer.updateHud(PlayerState)               (existing)
    └─→ DungeonRenderer.updateHpBars(DungeonState, PlayerState)
         ↓
CombatEngine.checkOutcome()
    ├─→ enemy HP ≤ 0 → App.transition('loot')
    │   DungeonRenderer.showLootDrop(FloorConfig.rollLoot())
    │
    ├─→ player HP ≤ 0 → App.transition('defeat')
    │   DungeonRenderer.showDefeatScreen()
    │   → on confirm: DungeonState.resetFloor(); App.transition('dungeon')
    │
    └─→ neither → CombatEngine.startRound() (next question)
```

### Screen transitions

```
App.mode:

  'dungeon'  ←──────────────────────────────┐
      ↓ (player clicks a room door)          │
  'combat'                                   │
      ↓ (enemy defeated)                     │
  'loot'                                     │
      ↓ (player clicks continue)             │
  'dungeon'  (if rooms remain on floor)      │
      ↓ (all rooms cleared on floor)         │
  'floor-complete'                           │
      ↓ (player clicks next floor)           │
  'dungeon'  (floor counter incremented) ───►┘

  'combat'
      ↓ (player HP = 0)
  'defeat'
      ↓ (player clicks retry)
  'dungeon'  (floor reset, room 1)
```

---

## Rendering Approach: Pure DOM + CSS (No Canvas)

The single-file constraint and zero-dependency rule means no canvas libraries. Rooms and enemies are rendered entirely in HTML+CSS.

### Enemy sprites — CSS character approach

Enemies are CSS-drawn characters using layered `div` elements with `border-radius`, `box-shadow`, and CSS custom properties for colour variants. This is the same technique used for CSS art (e.g., pure CSS animals). Complexity is kept low — silhouette-level, not pixel-art detail.

Each enemy type is defined by a CSS class on a root container `div`. The `DungeonRenderer` sets the class based on `FloorConfig.enemyType`:

```html
<div id="enemy-sprite" class="enemy goblin">
  <!-- All parts are CSS pseudoelements or child divs -->
  <div class="enemy-body"></div>
  <div class="enemy-head"></div>
</div>
```

```css
.enemy.goblin { --enemy-color: #4a7c3f; --enemy-size: 80px; }
.enemy.skeleton { --enemy-color: #c8c8c0; --enemy-size: 90px; }
.enemy.dragon { --enemy-color: #8b1a1a; --enemy-size: 120px; }
```

Hit and defeat animations are CSS `@keyframes` triggered by adding/removing a class (`enemy-hit`, `enemy-defeated`). No JavaScript animation code is needed.

### HP bars — CSS width transition

HP bars are `div` elements where a fill `div`'s `width` is set to a percentage via JavaScript `style.width`. CSS `transition: width 0.3s ease` handles smooth animation automatically.

```html
<div class="hp-bar-track">
  <div id="enemy-hp-fill" class="hp-bar-fill enemy-hp"></div>
</div>
<div class="hp-bar-track">
  <div id="player-hp-fill" class="hp-bar-fill player-hp"></div>
</div>
```

```javascript
// DungeonRenderer:
updateHpBars(dungeonState, playerState) {
  const enemyPct = Math.max(0,
    dungeonState.enemyHp / dungeonState.enemyMaxHp * 100
  );
  const playerPct = Math.max(0,
    playerState.getHp() / playerState.getMaxHp() * 100
  );
  DUNGEON_DOM.enemyHpFill.style.width = enemyPct + '%';
  DUNGEON_DOM.playerHpFill.style.width = playerPct + '%';
}
```

### Room layout — CSS grid + state classes

The dungeon view shows the current floor's rooms as a row of room cards. Each card is a `<button>` (accessible, keyboard-navigable). Cleared rooms get a `cleared` class, the active combat room gets `active`, locked rooms get `locked` (disabled attribute).

```html
<div id="room-row" role="list">
  <!-- Rendered by DungeonRenderer.renderRoomRow(DungeonState, FloorConfig) -->
</div>
```

Loot inventory is a flex row of icon `div` elements at the bottom of the dungeon view. Icons use Unicode characters (e.g., ⚔ for sword upgrade, 🛡 for shield) styled in the grunge colour palette — no images needed.

### Screen visibility — CSS class toggle (no display switching in JS)

Each screen section exists in the DOM at all times. `App.transition(mode)` adds/removes a single `active` class. CSS handles `display`:

```css
.game-screen { display: none; }
.game-screen.active { display: flex; }
```

This avoids the common pitfall of setting `display` in JS and then needing to undo it. `DOMContentLoaded` renders all screens; only the CSS class controls which one is visible.

---

## Build Order

The dungeon system can be built in two independently testable phases:

### Phase A — Combat works without rooms (combat-only stub)

Build in this order:

1. **CONFIG extension** — Add HP values, damage constants, loot config. No behaviour change.
2. **PlayerState HP methods** — `takeDamage()`, `heal()`, `resetHp()`, `getHp()`, `getMaxHp()`. Can be verified in the console immediately.
3. **FloorConfig** — Static data only. No DOM needed.
4. **DungeonState** — State object with `enterRoom()`, `dealDamageToEnemy()`, `isEnemyDefeated()`. No DOM needed.
5. **CombatEngine** — Wire `QuestionSelector` output to damage logic. At this point, the combat loop works: answer a question → enemy HP decreases → when zero, combat ends. Test entirely in DevTools console by calling `CombatEngine.resolveAnswer(true, fakeQuestion)`.
6. **PersistenceStore v2 migration** — Update VERSION, add migrate(), test with existing v1 save to confirm math accuracy data is preserved.

At the end of Phase A, the game is still the v1 question loop visually, but underneath `CombatEngine` is resolving damage correctly. This is the "can combat work before rooms work" answer: yes. The room navigation view is a display concern; the combat engine is pure logic.

### Phase B — Dungeon visuals and screen routing

7. **HTML structure** — Add dungeon-view, combat-view (wraps existing question card), defeat-screen, floor-complete-screen sections to the HTML. Add `DUNGEON_DOM` cache.
8. **DungeonRenderer** — Enemy sprites, HP bars, room row, loot icons, screen animations. Test visuals in isolation by calling `DungeonRenderer.renderCombat(fakeDungeonState, fakePlayerState, fakeEnemyConfig)`.
9. **App mode routing** — Add `mode` field and `transition()` method. Wire `App.transition('combat')` call when a room button is clicked. Wire defeat and floor-complete transitions.
10. **InputHandler mode guard** — Add `if (App.mode !== 'combat') return;` guard at the top of `handleAnswer`.
11. **End-to-end flow integration** — Walk through a full floor: enter room → fight → defeat enemy → collect loot → next room → floor complete.

---

## Integration Points: New vs. Modified vs. Untouched

| Module | Status | Change Description |
|--------|--------|-------------------|
| CONFIG | Modified | Add `DUNGEON` constants block. No existing keys removed or renamed. |
| XpCalculator | Untouched | No change. |
| PlayerState | Modified | Add `hp`, `maxHp` private vars. Add `takeDamage`, `heal`, `resetHp`, `getHp`, `getMaxHp`. Add `hp`-related field to `toJSON` (for in-session state; NOT to save schema). |
| PersistenceStore | Modified | VERSION 1→2. New SAVE_KEY. Add `migrate()` function. Legacy key read on first load. |
| QuestionSelector | Untouched | `selectNext(playerState)` signature unchanged. CombatEngine passes a playerState reference as before. Floor-specific table weighting is handled by CombatEngine adjusting which tables appear in FloorConfig, not by changing QuestionSelector internals. |
| Renderer | Untouched | Keeps all existing methods. DungeonRenderer is a separate object. |
| InputHandler | Modified | One-line mode guard at top of `handleAnswer`. `setup()` unchanged. |
| App | Modified | Add `mode` string field. Add `transition(newMode)` method. `nextQuestion` renamed `nextCombatRound` (internal only; no external callers beyond App itself). Bootstrap now calls `DungeonState.init()`. |
| **FloorConfig** | New | Static floor data only. |
| **DungeonState** | New | Session-scoped dungeon state. |
| **CombatEngine** | New | Combat resolution logic. Bridges QuestionSelector to DungeonState/PlayerState. |
| **DungeonRenderer** | New | All dungeon visual DOM operations. |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Leaking dungeon logic into QuestionSelector

**What people do:** Add `floorNumber` or `enemyType` parameters to `QuestionSelector.selectNext()` to change table weighting per floor.

**Why it's wrong:** QuestionSelector's accuracy-based weighting is the core learning mechanic. Floor-specific table filtering belongs in FloorConfig. Mixing them makes QuestionSelector stateful about the dungeon and breaks the v1 math loop.

**Do this instead:** CombatEngine reads `FloorConfig.get(floor).tablePools` and validates that the question returned by QuestionSelector uses an allowed table. If not (edge case: all weak tables mastered), CombatEngine re-rolls or uses a fallback pool. QuestionSelector remains a pure accuracy-driven selector.

### Anti-Pattern 2: Merging DungeonState into PlayerState

**What people do:** Add `floor`, `enemyHp`, `roomsCleared` directly onto the PlayerState closure to avoid a second state object.

**Why it's wrong:** PlayerState is the persistent player identity (XP, level, accuracy). DungeonState is the ephemeral run. They have different lifecycles: PlayerState persists to localStorage on every answer; DungeonState resets on floor restart. Merging them means HP and enemy state pollute the save schema, the toJSON/fromJSON validation logic, and the v2 migration path.

**Do this instead:** Keep them separate. PersistenceStore.save() receives both objects and knows which fields to persist from each. A clear signature: `save(playerState, dungeonState)` where only `playerState.toJSON()` fields and `dungeon: { floor, roomsCleared, loot }` from DungeonState go into localStorage.

### Anti-Pattern 3: Rendering dungeon state from InputHandler

**What people do:** Add `DungeonRenderer.updateHpBars()` calls inside `InputHandler.handleAnswer()` because that is where the answer is processed.

**Why it's wrong:** InputHandler already calls Renderer, PersistenceStore, and PlayerState from within handleAnswer — it is already the most entangled function in v1. Adding DungeonRenderer calls there makes it own four different concerns and is the most likely place for hard-to-trace bugs.

**Do this instead:** `handleAnswer` calls `CombatEngine.resolveAnswer()`. CombatEngine is the single place that decides what changed (player HP, enemy HP, XP) and then calls both `Renderer.updateHud()` and `DungeonRenderer.updateHpBars()` at the end of its resolution. InputHandler's only job remains delegating the selected value.

### Anti-Pattern 4: Multiple save keys for the same player

**What people do:** Write dungeon state to a separate `mathlab_dungeon_v1` key and math state to `mathlab_save_v2`, reasoning that they are "independent data."

**Why it's wrong:** Two save keys means two `try/catch` blocks, two quota checks, two migration paths, two consistency problems (they can become out of sync if one write succeeds and the other fails mid-session). localStorage writes are synchronous — keep them atomic in a single key.

**Do this instead:** One key (`mathlab_save_v2`), one JSON object with two sub-schemas: the existing math fields at the root and a `dungeon` object for dungeon progress. One write, one read, one migration function.

### Anti-Pattern 5: Canvas for enemy sprites

**What people do:** Reach for `<canvas>` to draw enemies because it feels like the "game" approach.

**Why it's wrong:** Canvas requires a drawing library or significant hand-rolled render code. It does not integrate with CSS animations (which are hardware-accelerated and free). It is harder to make accessible. It adds complexity that the single-file constraint cannot absorb without a major code size increase.

**Do this instead:** CSS character art (layered divs with border-radius). Three enemy types can each be a distinct CSS class applying colour and shape variations. Hit animations are CSS `@keyframes`. The visual result is stylised and grunge-appropriate, not photorealistic — which matches the project aesthetic.

---

## Scalability Notes

This architecture is deliberately session-local. There is no meaningful scale dimension beyond "does it work well for one user on one device." The constraints that apply:

| Concern | Bound | Mitigation |
|---------|-------|------------|
| localStorage size | ~5 MB | v2 save schema adds ~50 bytes (dungeon sub-object). Total save size remains under 5 KB. No issue. |
| DOM node count | v2 adds ~30 nodes (room row, HP bars, enemy sprite) | Still tiny. DocumentFragment batch-insertion for room row render. |
| Combat loop performance | ~1 ms per answer resolution | No loops, no rAF needed for combat logic. All synchronous, immediate. |
| CSS animation concurrency | Hit flash + HP bar transition simultaneously | CSS composites independently. No JS animation needed. No conflict. |

---

## Sources

All findings from direct inspection of the v1 source file (`math-lab.html`) and established patterns from:

- v1 ARCHITECTURE.md (this project's existing research, 2026-06-20) — closure module pattern, localStorage versioning, DOM cache pattern. Confidence: HIGH (direct codebase evidence).
- Game Programming Patterns: State — separate ephemeral run state from persistent player identity. Confidence: HIGH.
- MDN CSS Transitions — `transition: width` for HP bars; hardware-accelerated, no JS needed. Confidence: HIGH.
- CSS-Tricks: Grainy Gradients + CSS character art patterns — confirms pure CSS is viable for stylised sprite work. Confidence: HIGH.
- localStorage atomicity — single-key design from v1 PersistenceStore; extending rather than splitting is the safe migration path. Confidence: HIGH (direct code pattern).

---

*Architecture research for: Dungeon crawler integration layer on existing single-file math app*
*Researched: 2026-06-20*
