# Phase 4: Dungeon Renderer - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all 5 dungeon placeholder panels with real visual content: combat screen (enemy sprite, HP bars, floating damage numbers, question markup, RPG copy), floor-complete screen (cleared summary with XP/enemies/HP), loot screen, and dead screen. The dungeon-map panel stays placeholder until Phase 5 wires navigation. All animations stay under 500ms with no flash or shake effects (ADHD hard constraint). DungeonRenderer module encapsulates all dungeon DOM logic, separate from the v1 Renderer.

</domain>

<decisions>
## Implementation Decisions

### Combat Screen Architecture
- Combat panel has its own question markup — separate `<fieldset id="combat-question">` with its own `<p id="combat-question-text">` and `<ul id="combat-options-list">` inside `[data-panel="combat"]`; DungeonRenderer updates these IDs; the quiz panel's `#question-fieldset` remains untouched for v1 quiz mode
- Combat screen layout (top to bottom): Floor/Room indicator → Enemy sprite + enemy HP bar → Feedback text area → Player HP bar → Question fieldset + answer choices
- Room progress shown as `"Floor N · Room M/5"` text line — simple, no graphical map needed in Phase 4
- Dungeon-map panel stays placeholder in Phase 4 — real content built in Phase 5

### HP Bars & Damage Animation
- Enemy HP bar color: `#ff4444` (red); Player HP bar color: `#00ff88` (accent green) — RPG convention, high contrast on dark background
- No HP numbers shown alongside bars — visual bar only; reduces cognitive load for ADHD profile
- Floating damage numbers: green text for correct answers (damage dealt to enemy), red text for wrong answers (damage taken by player); both animate upward from the target and fade out within 400ms using CSS `@keyframes`
- Wrong-answer effect on player HP bar: width drains only via `transition: width 300ms ease` — no shake, no flash, no glow; ADHD-safe hard constraint

### RPG Copy & Flavor Text
- Attack success feedback variants: `"Attack!"` (standard, ~80% chance) / `"Critical hit!"` (~20% chance, random); shown in feedback area for 1.5s then cleared
- Wrong-answer feedback: `"You took a hit!"` — player perspective, direct, no word "wrong" or "incorrect"
- Floor-complete headline: `"Floor N Cleared!"` as h2; stats block below: enemies defeated / XP earned / HP remaining
- Flavor text approach: implement rotation logic now with 3 placeholder lines per enemy; Phase 6 replaces content after user (the 12-year-old) approves final copy — words "Correct", "Wrong", "Answer", "Question" must not appear in any dungeon screen

### DungeonRenderer Module Design
- New `const DungeonRenderer = (() => { ... })()` IIFE outside DOMContentLoaded; exported as `window.DungeonRenderer`
- Separate from v1 `Renderer` module which handles quiz-mode HUD updates — no merge
- DungeonRenderer owns: `renderCombat(state)`, `renderFloorComplete(summary)`, `renderLoot(item)`, `renderDead()`, `showDamageNumber(target, value, isHit)`, `updateHP(enemyHP, playerHP)`, `showFeedback(text)`
- Uses `textContent` throughout — never `innerHTML` (established security pattern)

### Claude's Discretion
- Enemy sprite font-size: 5rem on mobile-friendly default; CSS `font-size: clamp(4rem, 8vw, 6rem)` for responsive sizing within the 5–6rem requirement
- HP bar height: 12px, border-radius: 6px (pill shape); full width of enemy/player area container
- Damage number position: `position: absolute` relative to the target element; animates `translateY(-40px)` over 400ms then `opacity: 0`
- Critical hit threshold: `Math.random() < 0.2` — 20% chance; all damage values still come from CONFIG.DUNGEON regardless of "Critical" label

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CONFIG.DUNGEON` — all HP/damage/XP constants: `PLAYER_HP: 100`, `GOBLIN_HP: 9`, `SKELETON_HP: 15`, `DRAGON_HP: 21`, `DAMAGE_CORRECT: 3`, `DAMAGE_WRONG: 8`, `GOBLIN_XP: 30`, `SKELETON_XP: 50`, `DRAGON_XP: 80`
- `CombatEngine.resolveAnswer(isCorrect)` — returns `{ enemyHP, playerHP, killed, died, leveledUp }` — DungeonRenderer reads these values to update bars
- `CombatEngine.getState()` — returns `{ floorDef, enemyHP, playerHP }` — use on initial render of combat screen
- `FloorConfig.getFloor(N)` — returns `{ enemy, emoji, hp, xpReward, tablePools }` — emoji is the sprite
- `App.transition(screenName)` — use to switch screens after kill/death/floor-complete
- `QuestionSelector.selectNext(PlayerState)` — call to get next question for combat panel
- `Renderer.showQuestion(q)` — NOT usable for combat (targets quiz fieldset IDs) — DungeonRenderer needs its own question render

### Established Patterns
- Closure-based IIFE modules: `const DungeonRenderer = (() => { ... return { publicApi }; })();`
- Window exports: `window.DungeonRenderer = DungeonRenderer;` immediately after module definition
- `textContent`, never `innerHTML`
- `'use strict';` at script top — inherited by all new code
- CSS `@keyframes` for animations — no JS animation timers (requestAnimationFrame not needed for one-shot CSS animations)
- CSS custom properties: `--accent: #00ff88`, `--text: #e8e8e8`, `--text-muted: #888888`, background `#0a0a0a`
- All values from CONFIG (no magic numbers) — applies to HP bars, damage, XP

### Integration Points
- `[data-panel="combat"]` — currently has placeholder; replace its children with full combat UI in HTML; DungeonRenderer updates dynamic content
- `[data-panel="floor-summary"]` — currently placeholder; replace with cleared screen HTML
- `[data-panel="loot"]` — currently placeholder; Phase 4 renders basic loot display (item name/emoji)
- `[data-panel="dead"]` — currently placeholder; Phase 4 renders death screen with retry button (no stats)
- `InputHandler.handleAnswer()` — has `if (App.mode !== 'quiz') return;` guard; Phase 4 needs a parallel `CombatInputHandler` or extension that calls `CombatEngine.resolveAnswer()` in dungeon mode
- `App._nextQuestion` — wired to quiz flow; DungeonRenderer needs its own question cycle

</code_context>

<specifics>
## Specific Ideas

- ADHD-03 hard constraints enforced here: all animations ≤500ms; damage number fade-out at 400ms, HP bar drain at 300ms — both under limit
- Words "correct", "wrong", "answer", "question" must not appear in any dungeon panel text — verify by grep in Phase 6 audit
- Phase 6 ROADMAP note: "Flavor text tone is a content decision requiring the target user's input" — Phase 4 placeholder lines must be clearly labeled as temporary in code comments so they're easy to find and replace
- `CombatEngine.resolveAnswer()` does not call QuestionSelector or display anything — DungeonRenderer must wire question → combat → next question loop
- Boss room (Room 5 of each floor) uses same CombatEngine and same enemy type as the floor — no separate boss logic in Phase 4

</specifics>

<deferred>
## Deferred Ideas

- Dungeon-map panel visual (room grid) — Phase 5
- "Enter Dungeon" button wiring — Phase 5
- Final flavor text content approved by user — Phase 6 (placeholder lines used in Phase 4)
- CSS screen transition animations (fade in/out between panels) — Phase 4 polish or Phase 6 if time allows
- Sound effects / audio feedback — explicitly out of scope for v2.0

</deferred>
