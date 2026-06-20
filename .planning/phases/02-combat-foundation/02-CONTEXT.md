# Phase 2: Combat Foundation - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure JS logic layer for dungeon combat: GameFSM state machine, DungeonState (session-scoped), CombatEngine (HP math and damage resolution), FloorConfig (enemy types and table pools), and PersistenceStore v2 with v1 migration. No DOM elements created in this phase. All logic must be verifiable via browser console calls.

</domain>

<decisions>
## Implementation Decisions

### GameFSM State Machine
- States: EXPLORE, COMBAT, LOOT, FLOOR_SUMMARY, DEAD (5 states — no separate TRANSITION state)
- Illegal transitions throw Error with a descriptive message (best for console debugging in Phase 2)
- Window exports: individual — `window.GameFSM`, `window.CombatEngine`, `window.FloorConfig`, `window.DungeonState` (mirrors v1 `window.debugAccuracy` pattern)
- Code location: outside DOMContentLoaded, after existing v1 modules, in the same `<script>` block

### Combat Balance Constants
- Player damage per correct answer: 3 HP (Goblin 9HP = 3 hits, Skeleton 15HP = 5 hits, Dragon 21HP = 7 hits — satisfies COMB-03: 3–5 hits per enemy)
- Wrong-answer damage to player: 8 HP (player survives 12 wrong answers in a row; well above ADHD-03 minimum of 5)
- Enemy HP by floor: Goblin 9HP (Floor 1), Skeleton 15HP (Floor 2), Dragon 21HP (Floor 3) — linear scaling
- CONFIG structure: extend existing CONFIG with `CONFIG.DUNGEON = { ... }` sub-object (all dungeon constants in one place)
- All balance values are named CONFIG constants — no magic numbers in combat logic (required for Phase 5 tuning)

### PersistenceStore v2 Architecture
- Modify PersistenceStore in-place: bump VERSION constant to 2, add `migrate()` method, switch to `mathlab_save_v2` key
- Migration trigger: auto on page load — if `mathlab_save_v2` absent but `mathlab_save_v1` present, migrate silently and transparently
- v1 key (`mathlab_save_v1`) left untouched after migration (never deleted or overwritten)
- DungeonState loot inventory: object map `{ sword: false, shield: false, potions: 0 }` — easy membership check, matches LOOT-02 (max 1 per type)
- DungeonState player HP initialized from `CONFIG.DUNGEON.PLAYER_HP` at session start (pure config, no level-based modifiers)

### Claude's Discretion
- FloorConfig table pools: Floor 1 ×2×3×5, Floor 2 ×4×6×7, Floor 3 ×7×8×9 (locked in DIFF-01; no decisions needed)
- Enemy type emoji: 👺 Goblin, 💀 Skeleton, 🐉 Dragon (locked in ENE-01)
- XP awarded on enemy defeat: feed directly to `PlayerState.addXp()` (locked in PROG2-01)
- DungeonState session scope: nothing from DungeonState ever written to localStorage (locked in TECH2-03)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CONFIG` — extend with `CONFIG.DUNGEON` sub-object; keep v1 fields untouched
- `PlayerState.addXp(points)` — call this to award XP on enemy defeat; returns true if level-up occurred
- `PlayerState.getAccuracy(table)` — use in FloorConfig/QuestionSelector integration for DIFF-02 weighting
- `PersistenceStore.load()` / `.save(playerState)` — modify in-place to support v2 schema and migration
- `XpCalculator.getLevelThreshold(level)` — untouched; v2 XP system still uses this

### Established Patterns
- Closure-based IIFE modules: `const ModuleName = (() => { ... return { publicApi }; })();` — use for GameFSM, CombatEngine, FloorConfig, DungeonState
- All magic numbers in CONFIG (not inline) — extend to CONFIG.DUNGEON for dungeon constants
- `window.debugAccuracy` pattern — expose `window.GameFSM`, `window.CombatEngine` etc for console testing
- `'use strict';` already at script top — all new code inherits it
- Security: `typeof` checks before assignment in `fromJSON()` — apply same pattern in PersistenceStore v2 load/migrate

### Integration Points
- New modules go in `<script>` after MODULE 5 (QuestionSelector) and before the `DOMContentLoaded` block
- `CombatEngine.resolveAnswer(true)` awards XP via `PlayerState.addXp()` — crosses module boundary
- `PersistenceStore.load()` is called in bootstrap (inside DOMContentLoaded) — migration must run before this returns
- `App.nextQuestion()` remains unchanged in Phase 2 — dungeon routing added in Phase 3

</code_context>

<specifics>
## Specific Ideas

- The success criteria require console-callable API: `GameFSM.transition('COMBAT')`, `CombatEngine.resolveAnswer(true/false)` — design the public API to match these call signatures exactly
- Phase 5 ROADMAP note: "balance values are LOW CONFIDENCE — expect at least one tuning iteration" — all HP/damage values MUST be CONFIG.DUNGEON constants, never hardcoded
- Boss floor Dragon HP is 21 (same as Floor 3 combat Dragon) — a separate boss-specific HP can be added in Phase 5 tuning if needed
- DungeonState enemy HP field tracks CURRENT enemy HP (not max HP); max HP comes from FloorConfig

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 2 scope
- Balance tuning (HP values, damage, loot economy) explicitly deferred to Phase 5 per ROADMAP
- Flavor text content for enemy types explicitly deferred to Phase 6 per ROADMAP

</deferred>
