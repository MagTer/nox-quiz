# Feature Research

**Domain:** Browser-based dungeon crawler with math combat — 12-year-old girl, ADHD-safe, single HTML file
**Researched:** 2026-06-20
**Confidence:** MEDIUM (web research, cross-checked against existing educational game analysis and game design literature)
**Scope:** v2.0 dungeon crawler layer added to existing math practice engine (v1 XP/level/adaptive weighting already built)

---

## Context: What Already Exists (v1 Engine — Do Not Re-Scope)

The v1 engine provides these capabilities that the dungeon crawler builds on top of:
- Weighted question selection (70% hard tables 6–9, 30% easy 1–5)
- EWMA accuracy tracking per multiplication table
- XP and level system persisted in localStorage
- 4-option multiple-choice interface
- Immediate answer feedback

The dungeon layer wraps this engine: every combat encounter IS a question. The math engine stays unchanged; only what frames it changes.

---

## Table Stakes (Users Expect These)

Features the target user assumes exist in any dungeon game. Missing these = "this isn't really a dungeon game."

| Feature | Why Expected | Complexity | ADHD/Age Fit | Notes |
|---------|--------------|------------|--------------|-------|
| **HP bars for player and enemy** | Every dungeon/RPG/combat game since Pokemon has visible health. Seeing the enemy's HP shrink is the core feedback loop. | LOW | CRITICAL: Visual, immediate, no reading required. HP bar fills/drains give dopamine hit per correct answer. | Player HP ~100, enemy HP scales by tier. Show as filled bar + number. |
| **Turn-based combat (player acts, then enemy acts)** | Roblox RPGs, Pokemon, Prodigy Math — all use turn structure. Pre-teens expect to control their pace; real-time combat adds stress. | LOW | TABLE STAKES for ADHD: Turn-based = no time pressure. Player can think. Matches existing no-timer philosophy. | Sequence: question appears → player answers → if correct, player attacks; if wrong, enemy attacks → next question. |
| **Multiple enemy types with visible differences** | Goblins vs skeletons vs dragons — visual variety signals "I'm making progress." Identical enemies feel like a treadmill. | LOW-MED | Novelty prevents habituation. ADHD brains need visual change to maintain interest. | 3 types confirmed: Goblin (easy), Skeleton (medium), Dragon (hard). Each needs distinct art/description even if text-based. |
| **Room-by-room floor exploration** | Minecraft/Roblox players understand "rooms to clear" as progress unit. "You've cleared 3 of 5 rooms" is tangible. | MED | Chunked progress = ADHD-friendly. Each room is a micro-session. "Just one more room" is less commitment than "one more floor." | 5 rooms per floor (entrance, 3 combat rooms, boss room). Classic 5-room dungeon structure is proven for short sessions. |
| **Loot after defeating enemy** | Every game in this genre drops loot. Loot = variable reward = dopamine. No loot = combat feels pointless. | LOW | Variable reward schedule (not every kill drops loot) is highly motivating for ADHD. Unpredictability sustains attention. | 3 loot types: weapon upgrade (more attack), potion (restore HP), armor (reduce incoming damage). Simple item holding, no complex inventory. |
| **Boss at end of each floor** | Bosses are a genre convention. A floor without a boss feels incomplete. Builds anticipation. | MED | Predictable structure (boss at floor end) reduces anxiety. Pre-teens want to know what's coming. | Dragon boss for floor 3 confirmed. Floor 1-2 mini-bosses can be stronger versions of existing enemies. |
| **Die = restart floor, not full game** | Permadeath is hostile for casual players, especially pre-teens. Minecraft uses this pattern (respawn near death point). | LOW | CRITICAL for ADHD: Full-game reset triggers shame spiral and app avoidance. Floor restart maintains a sense of progression. | Retain XP/level on death. Lose only loot from current floor run. "Try floor 2 again?" with clear framing, no shame. |
| **Floor/difficulty progression (3 floors + boss)** | There must be an end goal visible. "Floor 2 of 4" gives orientation. Without it, the game feels infinite and purposeless. | MED | Goal visibility is executive-function scaffolding. "I'm on floor 2, almost to the boss" = clear session objective. | Math difficulty maps to floor: Floor 1 = ×2×3×5, Floor 2 = ×4×6×7, Floor 3 = ×7×8×9, Boss = hardest tables. |
| **Visual combat feedback (hit animations, damage numbers)** | Every game shows damage numbers floating up. No visual = combat feels disconnected from answers. | LOW | Fast, purposeful animation is ADHD-positive. Idle/waiting screens break engagement. | "+12 damage!" floating text. Enemy "shakes" on hit. Player HP bar drains on wrong answer. CSS animations only. |

---

## Differentiators (What Makes This Worth Opening Again)

Features that go beyond genre expectations and create "I actually want to play this" vs "I play it because it's there."

| Feature | Value Proposition | Complexity | ADHD Fit | Notes |
|---------|-------------------|------------|----------|-------|
| **Math difficulty tied to enemy type, not floor** | Goblins always ask easy tables (1–5), Skeletons ask medium (4–7), Dragons ask hard (7–9). Player perceives the _enemy_ as the challenge, not the math. The narrative does the pedagogical work. | MED | Reframes "hard math" as "hard enemy." ADHD learners respond better to challenge framed as game difficulty vs academic difficulty. Reduces math anxiety. | Goblin: uses CONFIG.EASY_TABLES. Skeleton: mixed 4–7. Dragon: CONFIG.HARD_TABLES. Leverages existing EWMA weighting. |
| **HP recovery on floor clear** | Clearing all rooms on a floor restores a portion of HP (e.g., 30 HP). Creates "push your luck" tension without timer pressure. | LOW | Reward for completion. ADHD learners often undervalue what they've already done; a concrete HP reward for clearing a floor makes effort visible. | "Floor cleared! +30 HP." Show animation. Full HP restore between floors via potion OR as milestone reward. |
| **Loot that persists across floor restart** | If player dies and retries floor, they keep any loot earned in previous attempts (just not from the current failed run). Gives incremental progress even on hard floors. | LOW | Prevents "all that work for nothing" feeling. ADHD players are highly sensitive to sunk-cost frustration. Small retained rewards make retrying feel worth it. | Store loot in localStorage by floor key. Clear per-run loot on death but preserve cross-run loot. |
| **Enemy flavor text / taunts** | Short, edgy text from enemies ("Think you can handle me?", "Wrong answer, loser!") adds personality without cuteness. Grunge tone. | LOW | Micro-narrative keeps attention. 1–2 sentences of personality. Pre-teens read short text; long lore walls = instant skip. | Change taunt by enemy type. Goblin: dumb/overconfident. Skeleton: spooky/sarcastic. Dragon: menacing. No humor that reads as "for babies." |
| **XP from combat, not just math** | Currently XP comes from correct answers. In dungeon mode, defeating an enemy gives bonus XP on top. Enemy-specific XP values reward harder fights. | LOW | XP as combat reward creates stronger narrative link between math and game outcome. Prodigy uses this successfully; it's the gold standard for this age group. | Goblin defeated = +15 XP bonus. Skeleton = +25 XP. Dragon = +50 XP. Stack on top of existing per-answer XP. |
| **Floor summary screen** | After clearing a floor: "Floor 1 cleared! Enemies defeated: 6. Damage taken: 30. Loot found: 2 items. XP earned: 180." Feels like a report card you want to beat. | LOW | Session summary is ADHD goldmine: clear start/end, explicit achievement, motivates "beat my score" on replay. Maps to existing session-summary feature. | Show before transitioning to next floor. Store floor-best stats in localStorage for "personal best" comparison. |
| **Enemy HP scales with player level** | If player is Level 8, enemies have more HP than at Level 2. Ensures the game stays challenging as the v1 XP system levels player up. | LOW-MED | Prevents mastery plateau. ADHD learners disengage when challenge disappears. Keeps the game in the "flow zone" automatically. | Simple scaling: enemy_hp = base_hp * (1 + player_level * 0.05). Cap at 2x base HP. |
| **Multiple questions per enemy (not 1-shot)** | Each enemy requires 3–5 correct answers to defeat, not just 1. Creates a combat arc per encounter instead of a rapid-fire quiz. | MED | Pacing. One-question combat feels like the old quiz app wearing a costume. Multi-answer combat makes the enemy feel like a real obstacle. Research shows 3–5 turns is the sweet spot for pre-teen engagement before an encounter feels "too long." | Goblin: 3 correct answers to defeat. Skeleton: 4. Dragon boss: 8 (multi-phase). |

---

## Anti-Features

Features that seem like good ideas for a dungeon crawler but actively harm this specific user and context.

| Anti-Feature | Why Requested | Why Harmful | What to Do Instead |
|--------------|---------------|-------------|-------------------|
| **Timer-based combat ("answer in 10 seconds or enemy attacks")** | Adds urgency/excitement, common in math games. | ADHD-critical: Time pressure triggers working-memory shutdown. Math anxiety + timer = guaranteed wrong answer + frustration. App avoidance follows. War Solution (steam game) uses speed-scaling; this game must not. | No timers, period. Fast feedback without time constraint. Enemy attacks only on wrong answer, never on "too slow." |
| **Full permadeath (die anywhere = back to floor 1)** | "Roguelike authenticity." | Pre-teens with ADHD will quit the app, not retry. Lose 8 minutes of progress on Floor 3 = shame + learned helplessness. Research: casual players (especially kids) need to feel run was never wasted. | Die = restart current floor only. Retain XP, level, and cross-run loot. No exception. |
| **Complex inventory management (many items, slots, upgrades)** | RPG depth, "it's what dungeon crawlers do." | Cognitive load. Managing 10 items across 3 slots when you just want to fight a goblin breaks the math-combat flow. Inventory UI becomes the game. | Max 3 held items at a time. Simple: weapon (damage boost), armor (defense boost), potion (use to heal). No crafting, no merging, no slots. |
| **Procedurally generated floors** | Replayability. | Increases implementation complexity 10x for a single-file vanilla JS app. Also removes the player's ability to "learn the dungeon" — familiarity is comforting for ADHD players. | Fixed floor/room structure. Same 5 rooms per floor, same enemy types per tier. Novelty comes from which specific math questions appear, not the map. |
| **Social/multiplayer dungeon features** | "Can my friend play too?" | Breaks offline-only constraint. Also, this user's core value is solitary practice she controls. Social adds pressure. | Single-player only. No scores shared online, no co-op rooms. |
| **Multiple playable characters with different stats** | "Customization." | Adds menu complexity before combat starts. Pre-teen will spend 5 minutes on character select instead of 5 minutes on math. Also increases scope significantly. | One character, cosmetically adjustable. Unlock visual upgrades (weapon skin, armor color) via loot/level-up. Stats are universal. |
| **Random loot that can downgrade stats** | "Risk/reward tension." | Cognitive load + frustration. Equipping loot should always feel good. A player who gets "weaker sword" as a drop will stop collecting loot. | All drops are upgrades or consumables. No downgrades, no duplicate-slot replacement. Simple: loot is always good, always clear in value. |
| **Story-heavy cutscenes between rooms** | "It's an RPG!" | Text walls break flow. ADHD learners skip all reading beyond ~2 sentences. Story investment requires sessions longer than 5–10 min. | Flavor text max 2 sentences. Enemy taunts, floor intros as 1-line popups only. World-building deferred to future scope. |
| **Stamina/energy systems (limit how much you can play)** | "Prevents burnout." | Creates anxiety about "wasting" play time. Also removes player autonomy — a key ADHD motivator. | No stamina. Play as long or short as desired. Session goals are voluntary (from v1 should-have feature). |

---

## Feature Dependencies

```
Dungeon Layer depends on v1 Math Engine:
  v1 QuestionSelector (weighted tables, EWMA accuracy)
      └──feeds──> CombatEncounter (each question = one combat turn)
                      └──requires──> EnemyState (HP, type, attack power)
                                         └──requires──> EnemyConfig (Goblin/Skeleton/Dragon stats)

Combat Loop (per room):
  RoomEntry
      └──spawns──> Enemy (type determined by floor/room index)
                      └──drives──> CombatEncounter
                                      └──on correct answer──> PlayerAttack (enemy HP -damage)
                                      └──on wrong answer──> EnemyAttack (player HP -damage)
                                      └──on enemy HP = 0──> EnemyDefeat
                                                                └──triggers──> LootDrop (weighted random)
                                                                └──triggers──> XPBonus (enemy-type value)

Floor Progression:
  RoomCleared (all enemies in room defeated)
      └──unlocks──> NextRoom
                      └──if final room──> BossEncounter
                                              └──on defeat──> FloorComplete
                                                                  └──restores HP (partial)
                                                                  └──shows FloorSummary
                                                                  └──unlocks NextFloor

Death Handler:
  PlayerHP = 0
      └──triggers──> DeathScreen ("Floor X cleared X rooms")
                      └──option──> RetryFloor (reset room index, restore full player HP, keep cross-run loot)
                      └──option──> ReturnToStart (keep all XP/level, reset dungeon)

Loot System:
  LootDrop
      └──updates──> PlayerStats (weapon_damage, armor_reduction, potion_count)
                      └──persisted in localStorage (dungeon-scoped, cleared on full dungeon reset)

XP Bridge:
  CombatEncounter XP ──adds to──> v1 PlayerState.xp (existing engine)
  EnemyDefeat bonus XP ──adds to──> v1 PlayerState.xp (existing engine)
  Level up logic unchanged (v1 handles this)
```

### Key Dependency Notes

- **CombatEncounter depends on v1 QuestionSelector** — the math question IS the combat mechanic. The dungeon layer is a wrapper, not a replacement.
- **EnemyConfig determines which table tier QuestionSelector uses** — Goblin pulls from EASY_TABLES config, Dragon pulls from HARD_TABLES. This is the only modification to the v1 question selection.
- **Loot is floor-scoped in localStorage** — persists across floor retries but resets on full dungeon reset. Separate key from v1 PlayerState.
- **Death handler is new** — v1 has no death state. This is the biggest new state machine addition.
- **FloorSummary extends v1 SessionSummary concept** — reuses the pattern, adds dungeon-specific metrics.

---

## MVP Definition

### Launch With (v2.0 — This Milestone)

What's needed for the dungeon crawler to feel like a real game, not a reskinned quiz.

- [ ] **HP system (player + enemy)** — Without this there's no stakes. Core feature of the milestone.
- [ ] **Turn-based combat loop** — correct answer = player attacks, wrong answer = enemy attacks. The core mechanic.
- [ ] **3 enemy types with different HP and attack values** — Goblin (easy), Skeleton (medium), Dragon (hard).
- [ ] **5 rooms per floor, 3 floors + boss floor** — 20 rooms total. Fixed structure.
- [ ] **Boss at end of floor 3** — Dragon boss, harder tables, more HP. Climax moment.
- [ ] **Die = restart floor (keep XP and level)** — Non-negotiable. Permadeath breaks the user.
- [ ] **3 loot types: weapon upgrade, armor, potion** — Keep at most 1 of each. No complex inventory.
- [ ] **Multiple questions per enemy (3–5 correct answers to defeat)** — Makes combat feel like combat.
- [ ] **Visual combat feedback (HP bars, floating damage numbers, enemy shake)** — Without this combat feels inert.
- [ ] **Enemy difficulty matches floor** — Floor 1: easy tables, Floor 3: hard tables. Bridges to v1 adaptive weighting.
- [ ] **XP bonus on enemy defeat** — Bridges dungeon actions to existing XP progression.
- [ ] **Floor summary screen** — "Floor cleared! XP: 180, enemies: 6." Satisfying endpoint per floor.

### Add After Validation (v2.1)

- [ ] **Enemy flavor text/taunts** — Adds personality. Low effort, deferred to not block launch.
- [ ] **HP recovery on floor clear** — Reward for full-floor clears. Adds strategic layer.
- [ ] **Loot persistence across floor retries** — Quality-of-life that reduces retry frustration. Adds localStorage complexity.
- [ ] **Enemy HP scales with player level** — Prevents mastery plateau. Requires tuning based on real play data.

### Future Consideration (v2.2+)

- [ ] **Personal best tracking per floor** — "Beat your floor 2 record!" Replayability driver, needs data from v2.0 sessions.
- [ ] **Additional enemy types (4–5 total)** — Only if user asks for more variety after v2.0.
- [ ] **Cosmetic loot (visual upgrades only)** — Depends on whether loot system feels motivating enough in v2.0.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| HP system (player + enemy) | HIGH | LOW | P1 |
| Turn-based combat (correct = attack, wrong = damage) | HIGH | LOW | P1 |
| 3 enemy types (Goblin/Skeleton/Dragon) | HIGH | LOW | P1 |
| 5 rooms per floor, 3 floors + boss | HIGH | MED | P1 |
| Multiple questions per enemy (3–5 turns) | HIGH | LOW | P1 |
| Die = restart floor (keep XP) | HIGH | LOW | P1 |
| Visual combat feedback (HP bars, damage numbers) | HIGH | LOW | P1 |
| 3 loot types (weapon/armor/potion) | HIGH | LOW | P1 |
| Floor summary screen | MED | LOW | P1 |
| Enemy difficulty tied to floor/type | HIGH | LOW | P1 (leverages existing v1 config) |
| XP bonus on enemy defeat | MED | LOW | P1 |
| Enemy flavor text/taunts | MED | LOW | P2 |
| HP recovery on floor clear | MED | LOW | P2 |
| Loot persistence across floor retries | MED | MED | P2 |
| Enemy HP scaling with player level | MED | LOW | P2 |
| Personal best tracking per floor | LOW | LOW | P3 |
| Additional enemy types | LOW | MED | P3 |

**Priority key:**
- P1: Must have for v2.0 launch
- P2: Add in v2.1 after validation
- P3: Future consideration

---

## Competitor / Reference Feature Analysis

| Feature | Prodigy Math | Math Dungeon Quest (itch.io) | Math Gauntlet | This App's Approach |
|---------|--------------|------------------------------|---------------|---------------------|
| Math→combat mapping | Correct answer = cast spell, magic points replenished by correct answers | Correct answer = attack, wrong = vulnerable | Faster answer = more damage (timed) | Correct = attack, wrong = take damage. No speed component. No timer. |
| HP system | Hearts-based, 600 HP with scaling | Binary (attack/defend) | Hearts (lives) | Numeric HP bars, player 100 / enemy scales by type. Visual bar + number. |
| Enemy variety | 8 elemental types with type advantages | Generic enemy types | Generic | 3 types: Goblin/Skeleton/Dragon. No elemental complexity. Simpler is better for this scope. |
| Floor/progression | Level-gated world map, zones | Linear dungeon rooms | Linear waves | 3 floors + boss, 5 rooms each. Fixed, not procedural. |
| Loot | Gear drops, cosmetics, pets | Basic items | No loot system | 3 item types, max 1 each. No cosmetics in v2.0. |
| Permadeath | No permadeath, retry battle | Unclear | Lose hearts, retry | Die = restart floor. Retain all XP/level. |
| Timer | None (turn-based) | None shown | Yes — core mechanic | Explicitly no timer. Against ADHD constraints. |
| Session length | ~15–20 min typical | ~5–10 min per run | ~5 min | 5–10 min target. 5 rooms ~10 questions each = ~50 questions per floor at 30 sec each. |

---

## Age-Specific Design Notes: 12-Year-Old Roblox/Minecraft Player

Research on what specifically hooks this demographic:

**What Roblox and Minecraft players expect:**
- Progress that is always visible (health bars, XP, floor count, room count)
- No single mechanic dominates (variety within the session)
- Aesthetic coherence — "does this feel cool?" is the first evaluation
- Short feedback loops — reward every 1–3 minutes, not every 10
- Control over pacing — "I'll do one more room" is a valid stopping point

**What they reject:**
- "For babies" aesthetics (bright colors, cute characters, simplified text)
- Forced tutorials that explain things they can figure out
- Grinding with no visible payoff
- Text-heavy explanations
- Anything that feels like school ("quiz," "test," "correct/incorrect" labels)

**Framing guidance for copy:**
- "Attack" not "answer correctly"
- "Take damage" not "wrong answer"
- "Defeated" not "failed"
- "Dungeon run" not "practice session"
- "Loot" not "reward"
- Enemy is the obstacle, not the math problem

---

## ADHD-Specific Dungeon Crawler Constraints

These modify how standard dungeon crawler conventions apply:

1. **No accumulating wrong-answer penalty debt.** Standard dungeon crawlers might chain-punish: wrong answer → lose HP → next question → still at risk. For ADHD, this creates spiral anxiety. Limit: a single wrong answer deals limited, fixed damage. Player never feels "I can't recover from this."

2. **Clear structure, always visible.** "Room 3 of 5, Floor 2 of 4" must always be on screen. ADHD learners lose orientation without persistent context. They can't reconstruct "where am I?" from memory.

3. **Turn animation is short (≤600ms).** After answering, the hit animation (enemy shakes, HP drains, damage number floats) must resolve within 600ms. ADHD learners experience brief blank/waiting screens as disconnection. Instant-feeling response even if slightly animated.

4. **Death screen is empathetic, not punishing.** "Floor 2, Room 3 — you fought well. Try again?" not "GAME OVER." Show what was accomplished, offer retry immediately. No countdown on the retry button.

5. **Potion use is player-initiated.** Potions used any time (not just when HP low). Gives the player a sense of control. ADHD learners value autonomy highly.

6. **No "you could have done better" comparisons on death screen.** Show what happened, not what didn't. "You cleared 2 rooms and defeated 8 enemies" — not "You almost made it to the boss."

---

## Sources

Research confidence: **MEDIUM** (web research cross-checked across game design literature, educational game analysis, and ADHD-specific design research).

- [The Ultimate Guide to 5 Room Dungeons](https://www.roleplayingtips.com/5-room-dungeons/) — 5-room dungeon structure as proven short-session design pattern.
- [Turn-Based Combat in E-Learning (The Mathinator)](https://gamingintraining.wordpress.com/2015/06/09/how-we-can-use-turn-based-combat-in-e-learning-with-the-help-of-vikings-and-the-mathinator/) — How correct/wrong answers map to combat actions in educational games.
- [Math Dungeon Quest (synthbit.itch.io)](https://synthbit.itch.io/match-dungeon-quest) — Reference implementation: correct answer = attack, wrong = vulnerable.
- [An Adaptive Fantasy RPG Where Students Battle Monsters by Solving Math](https://helovesmath.com/math-game/rpg-math-game/) — HP/XP/loot mechanics in math RPG context.
- [Prodigy Math Game Battles](https://prodigy-game.fandom.com/wiki/Battles) — Industry standard for math-combat integration.
- [Roguelike vs. Roguelite: What's the Difference?](https://screenrant.com/roguelike-roguelite-difference-permadeath-hades-rogue-slay-spire/) — Roguelite pattern for casual players, permadeath alternatives.
- [Loot Drop Best Practices (gamedeveloper.com)](https://www.gamedeveloper.com/design/loot-drop-best-practices) — Minimal viable loot complexity for casual games.
- [Customizing Game Mechanics for ADHD](https://medevel.com/customizing-game-mechanics-for-adhd-what-developers-need-to-know/) — Turn structure, feedback speed, session length for ADHD players.
- [ADHD Games: Engaging Activities to Boost Focus and Learning](https://neurolaunch.com/adhd-games/) — ADHD engagement patterns in game contexts.
- [What Drives Roblox's Incredible 2.3 Hour Avg Daily Session Times?](https://www.maxpowergaming.co/post/what-drives-roblox-s-incredible-2-3-hour-avg-daily-session-times) — What keeps this demographic engaged; short feedback loops, progress visibility, social and reward variety.
- [How to Make a Roblox Game That Keeps Players Engaged](https://robloxera.com/blog/how-to-make-a-roblox-game-that-keeps-players-engaged) — First loop obvious, first minute useful, return hooks.
- [Boss Battle Design and Structure](https://www.gamedeveloper.com/design/boss-battle-design-and-structure) — Boss design principles: test learned skills, satisfying reward, no debilitating failure.

---

*Feature research for: Math Lab v2.0 Dungeon Crawler Milestone*
*Researched: 2026-06-20*
*Downstream: Requirements definition for dungeon crawler feature scope*
