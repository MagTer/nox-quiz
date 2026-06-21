# Phase 5: Full Floor Loop + Balance - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the complete dungeon run flow end-to-end: player enters dungeon from the dungeon-map panel, fights through 4 floors (each with 1 entrance room + 3 combat rooms + 1 boss room = 5 rooms per floor = 20 rooms total), collects loot that auto-applies, retries from the current floor on death (XP/level preserved), and reaches a "Dungeon Cleared!" end state after beating floor 4. All navigation buttons (loot-continue, floor-summary-continue, dead-retry) are wired. No new visual modules — Phase 5 is pure orchestration and game loop logic on top of the modules from Phases 2–4.

</domain>

<decisions>
## Implementation Decisions

### Room Navigation & Dungeon Entry
- "Enter Dungeon" button added to the dungeon-map panel; replaces placeholder text; on click transitions to combat for the current floor's first combat room
- Room type determined by room counter: room 1 = entrance (dungeon-map shown), rooms 2–4 = regular combat, room 5 = boss (same enemy type, 2× HP via `CONFIG.DUNGEON.BOSS_HP_MULT`)
- After loot-continue clicked: check `DungeonState.get().room` — if `< CONFIG.DUNGEON.ROOMS_PER_FLOOR` → start next combat room; if `>= ROOMS_PER_FLOOR` → floor-summary screen
- Try Again (dead screen): calls `DungeonState.init(currentFloor)` to reset HP + loot for that floor, then transitions to dungeon-map so player sees "Enter Floor N" before re-entering

### Loot System Design
- 3 items: **Sword** (🗡️, `SWORD_BONUS: 1` → DAMAGE_CORRECT goes 3→4), **Shield** (🛡️, `SHIELD_REDUCTION: 3` → DAMAGE_WRONG goes 8→5), **Potion** (🧪, `POTION_HEAL: 25` → instantly restores 25 HP on pickup)
- Auto-apply on pickup: sword/shield only applied once per run (duplicate ignored silently per DungeonState.applyLoot); potion applies HP immediately even at full HP — no inventory
- Drop rate: `LOOT_DROP_RATE: 0.6` (60% for regular enemies); boss room (room 5) always drops (100%); drop pool is uniform random across the 3 items
- Sword and shield effects must use CONFIG constants (no magic numbers in combat math); CombatEngine reads effective damage values at resolve time

### Floor Progression & End Game
- 4 floors total: Floor 1 (Goblin 👺), Floor 2 (Skeleton 💀), Floor 3 (Dragon 🐉), Floor 4 (Final Boss 🐲 — stronger Dragon variant with `FINAL_BOSS_HP: 40`, `FINAL_BOSS_XP: 150`, `tablePools: [7,8,9]`)
- Floor 4 added to FloorConfig using same structure as floors 1–3
- After beating floor 4: floor-summary shows **"Dungeon Cleared!"** headline + total XP earned; "Advance" returns to `App.transition('quiz')` — dungeon run complete
- Floor-summary "Advance" logic: if `currentFloor < CONFIG.DUNGEON.MAX_FLOORS` → init next floor + transition to dungeon-map; if `currentFloor >= MAX_FLOORS` → App.transition('quiz')
- Dungeon-map panel shows: floor number ("Floor N") + enemy emoji/name preview + "Enter Combat" button

### Balance Tuning
- Boss room HP = `floorDef.hp * CONFIG.DUNGEON.BOSS_HP_MULT` (2×) — computed at startCombat, no new FloorConfig entry
- New CONFIG.DUNGEON constants: `BOSS_HP_MULT: 2`, `FINAL_BOSS_HP: 40`, `FINAL_BOSS_XP: 150`, `MAX_FLOORS: 4`, `SWORD_BONUS: 1`, `SHIELD_REDUCTION: 3`, `POTION_HEAL: 25`, `LOOT_DROP_RATE: 0.6`
- Existing damage values (PLAYER_HP: 100, DAMAGE_CORRECT: 3, DAMAGE_WRONG: 8) already satisfy SC-5 without loot; loot makes the player more resilient (intended)

### Claude's Discretion
- Floor 4 enemy name for FloorConfig (e.g. "Dragon Lord", "Ancient Dragon", or just "Dragon" with higher HP)
- Exact loot drop item selection logic (uniform random from 3 items, or weighted by floor)
- DungeonRunner orchestration pattern — a new `DungeonRunner` const or inline functions inside DOMContentLoaded; use inline if logic is small enough

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DungeonState` — `init(floorNumber)`, `get()`, `advanceRoom()`, `applyLoot(itemName)`, `setEnemyHP()`, `setPlayerHP()` — all methods Phase 5 needs
- `CombatEngine.startCombat(floorNumber)` — initialises combat; Phase 5 calls this per combat room; must check FSM state before calling
- `CombatEngine.getState()` — returns `{ floorDef, enemyHP, playerHP }` — for renderCombat
- `GameFSM.transition()` / `GameFSM.reset()` — FSM guards; Phase 5 must stay in sync with FSM state
- `DungeonRenderer.renderCombat(state)` / `renderFloorComplete(summary)` / `renderLoot(item)` — already wired, Phase 5 calls them to populate screens
- `CombatInputHandler.beginCombat()` — call after `renderCombat()` to load first question and unlock input
- `FloorConfig.getFloor(N)` — Phase 5 adds floor 4 definition here
- `App.transition(screenName)` — single entry point for all screen changes; sets mode
- CONFIG.DUNGEON — extend with 8 new constants (BOSS_HP_MULT, FINAL_BOSS_HP, FINAL_BOSS_XP, MAX_FLOORS, SWORD_BONUS, SHIELD_REDUCTION, POTION_HEAL, LOOT_DROP_RATE)

### Established Patterns
- All constants in CONFIG.DUNGEON — no magic numbers anywhere
- IIFE closure modules; window.* exports
- `textContent` only — no innerHTML for content
- `DOMContentLoaded` block for button wiring (onclick handlers)
- CombatEngine.resolveAnswer() handles HP math; loot modifiers must feed into CONFIG values that resolveAnswer reads

### Integration Points
- `#loot-continue` button (line 533) — wire onclick in DOMContentLoaded for Phase 5 loot-to-next-room logic
- `#floor-summary-continue` button (line 543) — wire onclick for floor advance / dungeon clear
- `#dead-retry` button (line 550) — wire onclick for floor retry
- dungeon-map panel (line 490–493) — replace placeholder with floor info + Enter button
- `FloorConfig` FLOORS object (line 1015) — add floor 4 entry
- `CONFIG.DUNGEON` (line 582) — extend with new constants
- `CombatEngine.startCombat()` — Phase 5 must guard FSM state before calling (already throws if COMBAT state)
- Loot modifiers: sword/shield effects modify DAMAGE_CORRECT/DAMAGE_WRONG; CombatEngine currently reads raw CONFIG values — either pass modified values in or let CombatEngine read loot state from DungeonState

</code_context>

<specifics>
## Specific Ideas

- ADHD-03: no XP or level loss on death under ANY code path — verify DungeonState.init() only resets HP/loot, not PlayerState
- Death screen must have zero comparison stats or personal-best fields (SC-3) — already the case from Phase 4 (static text only)
- ROOMS_PER_FLOOR = 5 already defined; Phase 5 uses it for room-type logic (room <= 1 is entrance, room 5 is boss)
- Loot effect on CombatEngine: resolve-time effective damage must account for sword/shield — read `DungeonState.get().loot` inside `resolveAnswer()` and apply modifiers using CONFIG constants
- The Phase 4 VERIFICATION.md confirms `App.transition('floor-summary')` is called 0 times — Phase 5 wires this
- `CombatInputHandler.nextQuestion()` already restricts questions to floor's `tablePools` via `CombatEngine.getState().floorDef.tablePools` — no changes needed
- Floor 4 tablePools: [7, 8, 9] (same as Dragon, hardest tables — appropriate for final boss)

</specifics>

<deferred>
## Deferred Ideas

- Dungeon map visual (room grid with completed rooms highlighted) — Phase 6 polish or v3
- Sound effects / music — explicitly out of scope for v2.0
- Cosmetic loot (new emoji skins, color changes) — v3 or beyond
- Multiple loot items per chest / inventory UI — out of scope; auto-apply keeps it ADHD-friendly
- Difficulty settings / handicap mode — v3

</deferred>
