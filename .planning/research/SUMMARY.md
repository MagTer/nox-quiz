# Project Research Summary

**Project:** Math Lab v2.0 — Dungeon Crawler
**Domain:** Single-file browser RPG with math combat, ADHD-safe, 12-year-old target user
**Researched:** 2026-06-20
**Confidence:** HIGH (stack + architecture), MEDIUM (feature tuning + loot economy)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All v2 additions are pure vanilla JS/CSS extensions of proven v1 patterns. No new dependencies introduced. Emoji sprites, CSS HP bars, data-screen switching — all MDN-documented, battle-tested. |
| Architecture | HIGH | Module boundaries are clean and directly derived from inspecting the existing v1 codebase. Build order is dependency-driven. Migration path is low-risk. |
| Features | MEDIUM | Genre conventions (HP bars, turn-based combat, loot) are well-established. ADHD-specific tuning (damage numbers, pacing, death framing) rests on research consensus but needs real-user validation. |
| Pitfalls | HIGH | ADHD punishment research is well-sourced (PMC studies). Scope creep, localStorage migration, and CSS screen-state patterns are engineering truths confirmed across multiple sources. |
| Combat balance | LOW | Exact HP values, damage per wrong answer, and loot drop rates are informed guesses. No empirical data exists for this specific user. Balance requires live playtesting. |

**Overall confidence:** HIGH for architecture and stack decisions. MEDIUM/LOW for game-feel tuning — plan to iterate on CONFIG values post-launch.

---

## Executive Summary

Math Lab v2.0 adds a dungeon crawler combat layer on top of the existing v1 math engine. The core design insight across all four research files is identical: **the dungeon is a wrapper, not a replacement**. The v1 QuestionSelector, XpCalculator, PlayerState, and PersistenceStore remain essentially unchanged. Three new modules (GameFSM / DungeonState, CombatEngine, DungeonRenderer) sit around the existing engine, consuming it without modifying its internals. This is the correct architecture for a single-file app — additive, not invasive.

The recommended approach is to build in two independently testable phases: Phase A establishes the combat logic (FSM, DungeonState, CombatEngine, save migration) entirely in-memory before any visuals are touched; Phase B adds the dungeon renderer, screen routing, and HTML structure. This means the math-to-combat bridge can be verified in the browser console before a single new DOM element exists. This separation is the most important risk mitigation for the project.

The single biggest risk is not technical — it is ADHD safety. All research converges on the same finding: standard dungeon crawler conventions (escalating damage, time pressure, stat comparison, loot choices) are individually harmful for ADHD learners when imported without modification. Every combat mechanic must pass an explicit ADHD-safety checklist before implementation. Wrong-answer damage must be small and non-compounding, death must be a gentle floor restart with no stat loss, loot must auto-apply with no choice required, and no implicit timer or streak mechanic may be introduced in any form. Violating any of these is not a quality issue — it is a product-killing issue. The user will stop opening the app.

---

## Key Findings

### Recommended Stack

The v1 stack (vanilla ES2020+, CSS3, localStorage, requestAnimationFrame) carries forward unchanged. v2 adds no new dependencies. The dungeon layer uses a plain JS FSM object (20 lines) for game phase management, a separate DungeonState closure for session-scoped run data, `data-screen` attribute on `<main>` driving CSS visibility for all screens, CSS `@keyframes` + `animationend` for all combat feedback, Unicode emoji at 5–6rem for enemy sprites, and CSS `transition: width` on a `<div>` fill element for HP bars.

**Core technologies (v2 additions):**
- GameFSM: game phase controller — prevents if/else spaghetti across 5 game states
- DungeonState: ephemeral run state — kept separate from persistent PlayerState by design
- CombatEngine: bridges QuestionSelector output to damage logic — single responsibility
- DungeonRenderer: all dungeon DOM operations — separate from existing Renderer (math feedback)
- FloorConfig: static enemy data and table pools per floor — pure lookup, no state
- PersistenceStore v2: bumps schema version, migrates v1 save data without losing XP/accuracy

### Expected Features

**Must have (table stakes) — v2.0 launch:**
- HP bars for player and enemy — core feedback loop; without this combat has no stakes
- Turn-based combat: correct answer attacks, wrong answer takes damage — the mechanic
- 3 enemy types with distinct visuals and stat differences (Goblin / Skeleton / Dragon)
- 5 rooms per floor, 3 floors + boss, fixed structure (not procedural)
- Multiple questions per enemy to defeat (3–5 correct answers, not 1-shot)
- Die = restart floor only — retain all XP, level, and cross-run loot. Non-negotiable.
- 3 loot types (sword / shield / potion), max 1 of each held, auto-applied (no choice)
- Visual combat feedback: floating damage numbers, enemy shake, HP bar drain
- XP bonus on enemy defeat — bridges dungeon outcomes to existing v1 progression
- Floor summary screen after clearing a floor

**Should have — v2.1 after validation:**
- Enemy flavor text and taunts
- HP recovery on floor clear
- Loot persistence across floor retries
- Enemy HP scaling with player level

**Defer to v2.2+:**
- Personal best tracking per floor
- Additional enemy types
- Cosmetic loot

**Anti-features — never build these:**
- Timer-based combat (any form)
- Full permadeath / full game reset on death
- Loot choice between two items
- Combo multiplier / streak mechanic
- Enemy rage mode / charge animation
- Comparison stats on death screen
- Procedurally generated floors

### Architecture Approach

The v2 architecture adds three new layers around the existing math engine, not inside it. Existing modules are modified minimally: CONFIG extended, PlayerState gains HP methods, PersistenceStore bumps to version 2, InputHandler gains one mode guard, App gains a `transition()` method. Four new modules — FloorConfig, DungeonState, CombatEngine, DungeonRenderer — slot into the existing single-`<script>` block in dependency order.

**Major components:**
1. **GameFSM** — enforces legal state transitions between EXPLORE / COMBAT / LOOT / TRANSITION / DEAD
2. **DungeonState** — holds floor, room, enemy HP, player HP, loot inventory (session-scoped, not persisted)
3. **CombatEngine** — resolves answers into damage values; calls QuestionSelector with enemy table pools; checks win/death conditions
4. **DungeonRenderer** — owns all dungeon DOM: room row, enemy sprite, HP bars, loot animations, screen transitions
5. **FloorConfig** — static enemy data and table pools per floor; pure lookup, no state
6. **PersistenceStore v2** — reads v1 key on first load, migrates, writes to `mathlab_save_v2`; HP and combat state NOT persisted

**Critical architecture rules:**
- Do NOT leak dungeon logic into QuestionSelector (preserves EWMA adaptive learning)
- Do NOT merge DungeonState into PlayerState (different lifecycles)
- Do NOT render from InputHandler (all DOM updates flow through CombatEngine → DungeonRenderer)
- Do NOT use multiple localStorage keys (one key, one JSON, one migration function)

### Critical Pitfalls

1. **Dungeon scope creep kills the project before launch** — Hard-freeze scope before any code. Write a "won't build" list before coding starts. Evaluate every addition as: "Can she play without this?" If yes, defer.

2. **Wrong-answer damage becomes a punishment loop** — Cap damage so no encounter is lethal with 3–4 wrong answers. Start player at 100 HP. Wrong-answer damage: 5–10 HP. Test explicitly at 30% wrong-answer rate.

3. **ADHD-unsafe patterns sneaking in via standard RPG conventions** — Five patterns to check every UI element against: implicit time pressure, death stripping progress, comparison stats, sensory overload from animations (all under 500ms), loot choice requiring decision under stress.

4. **CSS/DOM screen state becomes spaghetti** — Establish a single `renderScreen(stateName)` function before building any screen. Use `data-screen` attribute on `<main>`. Scope all screen CSS under `#screen-X`.

5. **v1 localStorage schema breaks v2 without migration** — Read `schemaVersion` on first load. Migrate v1 data carrying forward XP, level, accuracy. Write to new key `mathlab_save_v2`. Leave old key intact. Test with real v1 data before shipping.

6. **Enemy difficulty gating adaptive tables** — Do NOT force specific multiplication tables by floor. Floor determines enemy HP and XP reward. Question difficulty remains EWMA-driven from v1. This preserves the core learning value inside the dungeon structure.

7. **Loot economy breaking at accuracy extremes** — Model at both 30% and 70% wrong-answer rates before coding drop rates. One guaranteed item per floor as safety valve. Target: 60–80% HP at floor end across both extremes.

---

## Implications for Roadmap

### Phase 2: Combat Foundation (Logic Only)
**Rationale:** Combat logic must be verifiable in isolation before any DOM work begins. All new modules in this phase are testable in the browser console without touching HTML.
**Delivers:** CONFIG extension with dungeon constants, PlayerState HP methods, FloorConfig static data, DungeonState, GameFSM, CombatEngine, PersistenceStore v2 migration
**Addresses:** Turn-based combat loop, HP system, enemy stat differentiation, floor progression structure
**Avoids:** Anti-pattern of rendering from InputHandler; localStorage migration pitfall built first not retrofitted; EWMA adaptive tables preserved
**Research flag:** Standard patterns — skip research phase.

### Phase 3: Screen Architecture and HTML Structure
**Rationale:** Screen routing must be established before any screen's content is built. The `data-screen` / `renderScreen()` pattern must be locked in first.
**Delivers:** All `<section>` screen panels in HTML, `DUNGEON_DOM` cache, `App.transition()` mode routing, `InputHandler` mode guard, `data-screen` CSS visibility system
**Addresses:** CSS/DOM screen spaghetti pitfall; DOM panel architecture
**Avoids:** Screen visibility bugs where two screens are partially visible simultaneously
**Research flag:** Standard patterns — skip research phase.

### Phase 4: Dungeon Renderer and Combat Visuals
**Rationale:** With logic and routing in place, the renderer can be built and tested against real state.
**Delivers:** DungeonRenderer (full), enemy sprites (emoji at 5–6rem), CSS HP bars with color transitions, room row layout, floating damage numbers, hit/hurt CSS @keyframes, floor-complete screen
**Addresses:** Visual combat feedback, HP bars, floor summary; CSS animations without canvas
**Avoids:** ADHD sensory overload — all animations under 500ms, no screen shake, no flashing
**Research flag:** Standard patterns, but ADHD animation limits require explicit checklist review at this phase.

### Phase 5: Full Floor Loop Integration and Balance
**Rationale:** End-to-end floor flow requires all prior phases complete. Balance tuning is only meaningful with the full loop running.
**Delivers:** End-to-end playable floor run, floor summary wired, death/retry screen wired, loot drop system with auto-apply, XP bonus on enemy defeat, full 3-floor + boss structure
**Addresses:** All MVP features; loot economy balance; wrong-answer damage tuning
**Avoids:** Scope creep — this phase ships the explicit MVP list and nothing more
**Research flag:** Needs balance validation. Model loot economy at 30% and 70% wrong-answer rates before locking CONFIG values.

### Phase 6: Polish and ADHD Safety Audit
**Rationale:** A dedicated audit phase after the game is playable catches ADHD-unsafe violations before they reach the user.
**Delivers:** ADHD safety checklist pass (all 5 unsafe patterns verified absent), flavor text and enemy taunts, UX copy review ("Attack" not "answer correctly"), final localStorage migration test with real v1 data
**Addresses:** ADHD-unsafe patterns sneaking in; floor repetition feeling like reskinned quiz
**Research flag:** Flavor text tone requires the 12-year-old's input — content decisions, not implementation.

### Phase Ordering Rationale

- Logic before visuals: prevents building screens before the state machine is solid
- Screen routing before screen content: central `renderScreen()` must exist before any screen is built
- Full loop before balance tuning: balance numbers are meaningless in isolation
- ADHD audit last but not skippable: holistic audit only possible once the full game exists

### Research Flags

Phases needing deeper research during planning:
- **Phase 5 (balance):** HP values, damage-per-wrong-answer, and loot drop rates are LOW confidence. Build all as named CONFIG constants so tuning is single-line changes.

Phases with standard patterns (skip research):
- **Phases 2, 3, 4, 6:** All patterns derived directly from v1 codebase or MDN-documented web APIs.

---

## Open Questions Requiring User Decisions Before Requirements

1. **Enemy table pools: fully adaptive, floor-gated, or blended?** PROJECT.md specifies floor-specific table gates (×2×3×5 → ×4×6×7 → ×7×8×9). PITFALLS.md warns against hard-gating. **Recommendation: blended** — floor gates the pool, EWMA weights within that pool. Needs an explicit call.

2. **Rooms per floor: 5 or 6?** PROJECT.md says 5–6. Research recommends 5 (entrance + 3 combat + 1 boss). Recommendation: 5.

3. **Loot persistence across floor retries in v2.0 MVP?** Scoped as v2.1. If "die = start floor fresh including loot" is acceptable for launch, this simplifies localStorage schema significantly. Needs a call.

4. **Enemy sprites: emoji or CSS-drawn shapes?** Emoji recommended for speed and readability. CSS shapes are more grunge-consistent but higher maintenance. Final call on aesthetic.

5. **Flavor text and enemy taunts in v2.0 or v2.1?** Floor repetition is a critical pitfall. Even 3 lines per enemy prevents the "same room 15 times" feeling. Recommend including in v2.0 as low-effort insurance.

---

## Gaps to Address

- **Combat balance values:** Starting values (player HP 100, wrong-answer damage 5–10, enemy HP 8/14/30) are estimates. Plan a tuning iteration after first 2–3 real play sessions.
- **Boss encounter multi-phase design:** What changes at phase 2 of the dragon boss fight? Underdefined. Needs explicit design before Phase 5 implementation.
- **Floor-to-floor enemy visual differentiation:** Strategy for making floor 1 goblin look distinct from floor 3 enemies needs content decisions before Phase 4.

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — CSS `data-*`, `@keyframes`, `animationend`, `transition`, `clip-path`
- MDN Web Docs — localStorage API, error handling, quota limits
- Existing v1 codebase (`math-lab.html`) — module boundary conventions, animationend + `{ once: true }` pattern

### Secondary (MEDIUM confidence)
- PMC: Reward and Punishment Sensitivity in Children with ADHD
- Medevel: Customizing Game Mechanics for ADHD
- Roleplayingtips.com: The Ultimate Guide to 5 Room Dungeons
- Prodigy Math Game Battles wiki — math-combat integration reference
- Game Programming Patterns: State — separate ephemeral run state from persistent player identity

### Tertiary (LOW confidence)
- Combat balance values (HP, damage, drop rates) — informed guesses; require live tuning

---
*Research completed: 2026-06-20*
*Synthesized from: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
*Ready for roadmap: yes*
