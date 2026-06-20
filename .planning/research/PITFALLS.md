# Pitfalls Research: Dungeon Crawler Integration into Existing Math Game

**Domain:** Adding dungeon crawler combat layer to existing single-HTML-file browser math game (ADHD-safe, 12-year-old target user)
**Researched:** 2026-06-20
**Confidence:** HIGH (game design patterns + ADHD research + single-file architecture constraints)

---

## Critical Pitfalls

### Pitfall 1: Dungeon Feature Scope Creep Kills the Project Before Launch

**What goes wrong:**
The v1 quiz app is finished and working. v2 adds room navigation, HP combat, 3 enemy types, loot drops, floor progression, and a boss. That is already 5–6 independent subsystems. Each one feels small in isolation — "just add a map", "just add health potions" — but together they produce a scope that could take 3× longer than estimated. Over 70% of indie games exceeding their initial scope fail to meet deadlines. The common trajectory: start building rooms, decide they need animations, decide enemies need idle behavior, decide loot needs a UI inventory panel, ship nothing.

**Why it happens:**
The transition from a quiz app to a "game" creates infinite expansion surface. Every dungeon crawler reference (Roblox, Minecraft dungeons) the developer has in mind adds features subconsciously. Dungeon crawlers are a well-established genre with many expected affordances, and the temptation is to build them all.

**How to avoid:**
- Hard-freeze scope at: room navigation (text/icon-based, not animated maps), HP combat (player HP bar + enemy HP bar, no elaboration), 3 enemy archetypes (stat differences only, not unique mechanics), loot as passive stat bonuses (sword = +damage, shield = -damage taken, potion = +HP), floor progression (table difficulty gates). That is the complete list.
- Write a "won't build" list before coding starts: no inventory UI, no item descriptions panel, no animated room transitions, no multiple ability types, no story dialogue, no achievement system in v2.
- Evaluate every proposed addition with: "Can she play without this?" If yes, defer.
- Assign phases to features explicitly. If it isn't assigned to a phase, it does not get built.

**Warning signs:**
- Planning doc includes "it would be cool if..." sentences
- Enemy types gain unique special attacks (rather than just different stat values)
- Loot gains an inventory screen or comparison UI
- A map/minimap gets designed
- Session estimate grows past 2 weeks

**Phase to address:**
Requirements phase — scope freeze before any code is written. Document the won't-build list explicitly. Revisit at each phase transition.

---

### Pitfall 2: Wrong-Answer Damage Becomes a Punishment Loop for ADHD Users

**What goes wrong:**
The combat design is "correct answer attacks enemy, wrong answer takes damage." This sounds fun, but for a 12-year-old with ADHD who is also math-anxious, a streak of wrong answers triggers: HP drains → enemy stronger → more pressure → working memory collapses → more wrong answers → death → frustration → app closed. ADHD brains are more sensitive to punishment signals than neurotypical brains. A single bad run can permanently associate the app with failure. Research confirms that punishment-based feedback worsens math anxiety and undermines motivation in ADHD children.

**Why it happens:**
The combat mechanic naturally maps "wrong answer = bad outcome." Developers copy standard RPG logic without adjusting for a non-punishing educational context. The damage system feels balanced when playtested by an adult who can recover quickly; it is not balanced for a child mid-anxiety spiral.

**How to avoid:**
- Cap wrong-answer damage so it is never lethal in a single encounter. The enemy should be defeatable even with 3–4 wrong answers per fight.
- Wrong answers show the correct answer immediately and let the player retry (possibly with a different choice set) rather than forcing move-on. The math teaching happens at the moment of error.
- Death should cost nothing except restarting the current floor only (already planned). No XP loss, no loot loss. Death = mild inconvenience, not setback.
- Add "grace HP" — the player starts with generous HP (e.g. 100) and damage from a wrong answer is small relative to that pool (e.g. 5–10). Enemy HP is tuned so 2–3 correct answers finish the fight regardless.
- Enemy attacks on wrong answer should be visually dramatic but mechanically gentle. Flash and sound, small number.

**Warning signs:**
- Playtesting shows the player dying in the first or second room more than 10% of attempts
- The player loses HP faster than they gain it back from potions
- Any single enemy can kill in fewer than 5 wrong answers
- Wrong-answer rate on hard tables (×7, ×8, ×9) exceeds 30% in early testing — if so, those tables deal too much damage relative to her current mastery

**Phase to address:**
Combat design phase — define exact HP values and damage numbers before coding. Test specifically with 30%+ wrong-answer rate scenarios (simulate the worst session). Revisit after first real user session.

---

### Pitfall 3: Floor Repetition Makes the Dungeon Feel Like the Quiz with a Skin

**What goes wrong:**
5 rooms per floor × 3 floors = 15 rooms. If each room is "fight one enemy, answer questions, move to next room," the novelty wears off by floor 2. The dungeon skin evaporates and it feels like the v1 quiz with extra steps. Research on dungeon crawlers explicitly identifies this as a documented failure: "progressing through floors doesn't introduce any new features — players basically repeat what they did on the first floor but with stronger opponents."

**Why it happens:**
Minimizing scope (correctly) means each room is mechanically identical. But identical rooms create perceptual monotony quickly. The player's brain stops anticipating and starts grinding.

**How to avoid:**
- Introduce minimal mechanical variety without adding new systems: room types. Example: Combat room (standard fight), Treasure room (loot drop, no fight), Boss room (end of floor, harder enemy, bigger reward). These three types are enough to break monotony.
- Vary enemy visuals and flavour text per floor even if stats only change incrementally. Goblin floor 1 is a scraggly goblin; floor 2 is a goblin champion. Same mechanic, different text.
- The boss encounter should feel genuinely different: multi-hit fight (player must answer 3–4 questions to win, not just 1–2), dramatic visual treatment.
- Do not add more mechanics to fix repetition — add narrative flavour (room descriptions, enemy taunts, item flavour text) which costs hours not days.

**Warning signs:**
- Playtesters describe floors 2 and 3 as "same as floor 1 but harder"
- Player skips reading room descriptions after floor 1
- Time spent per room drops sharply on floor 2 (losing interest signal)
- Player explicitly asks "is there anything different on this floor?"

**Phase to address:**
Room/floor design phase — define room type variety and flavour text before implementing rooms. Even 3 lines of per-enemy flavour text changes the feel dramatically.

---

### Pitfall 4: CSS/DOM Screen Management Becomes Spaghetti as Screens Multiply

**What goes wrong:**
v1 had one screen: the quiz. v2 needs: title/start screen, dungeon map/room selection, combat screen, loot screen, death/floor-fail screen, level-up overlay, floor-complete screen. That is 7 distinct UI states in a single HTML file. The naive approach — toggle `display:none` / `display:block` on each section via class manipulation — works for 2 screens but becomes a combinatorial mess by screen 5. A bug in the CSS class toggling leaves the combat screen visible under the loot screen. The state the JavaScript thinks it is in diverges from what CSS shows. This kind of visual state corruption is extremely difficult to debug in a single file.

**Why it happens:**
Single-file architecture does not enforce component encapsulation. Every screen's CSS bleeds into every other screen. Developers add `display:none` to one section, forget the z-index on an overlay, and the ordering of `classList.add/remove` calls creates race conditions. The complexity scales faster than expected because each new screen interacts with all existing screens.

**How to avoid:**
- Use a single JavaScript `currentScreen` variable as the ground truth. All DOM visibility is derived from this one variable. Never toggle screen visibility anywhere except the `renderScreen(state)` function.
- Pattern: `document.querySelectorAll('.screen').forEach(s => s.hidden = true); document.getElementById(screenId).hidden = false;` — one toggle point, always consistent.
- Name screens with explicit IDs matching the state machine: `screen-start`, `screen-combat`, `screen-loot`, `screen-floor-complete`, `screen-death`. Never use ad-hoc class names.
- Keep each screen's CSS scoped: `.screen-combat .hp-bar` not `.hp-bar`. Prevents rules bleeding across screens.
- Overlays (level-up, correct-answer flash) live in a separate layer above screens, never embedded in a screen's DOM.

**Warning signs:**
- Two screens are partially visible at the same time
- A transition to a new screen requires more than one `classList` call outside the central render function
- Screen-specific CSS rules start with generic selectors (`.button`, `.title`) that affect other screens
- A new screen breaks an existing screen's layout

**Phase to address:**
Combat/screen architecture phase — establish the screen state machine pattern before building individual screens. Retrofitting this after 5 screens are built is expensive.

---

### Pitfall 5: v1 localStorage Schema Breaks v2 Save State Without Migration

**What goes wrong:**
v1 saves: `{ xp, level, accuracy }`. v2 adds: `{ currentFloor, playerHP, lootInventory, enemiesDefeated, floorProgress }`. If v2 reads v1 data naively, `currentFloor` is `undefined`, the game tries to render a floor that doesn't exist, and the app throws a JavaScript error. At best, the player sees a blank screen. At worst, XP and level from v1 are silently lost because the migration clobbers the old key. For a user who has been playing v1 for weeks, losing progress destroys trust immediately.

**Why it happens:**
Developers test v2 on a clean browser profile where no v1 data exists. The migration problem only surfaces for real users who have existing saves. It is easy to forget that anyone who played v1 has data in localStorage that will conflict with v2's expected schema.

**How to avoid:**
- On v2 app start, read the stored `schemaVersion` key. If it is `undefined` (v1) or `"1"`, run a migration function before any game logic executes.
- Migration from v1 to v2: read `xp`, `level`, `accuracy` from v1 keys, write them into the v2 save object under the new schema, add default values for all new v2 fields (`currentFloor: 1`, `playerHP: 100`, `lootInventory: []`), then write the complete v2 object and set `schemaVersion: "2"`.
- Never delete v1 keys until after v2 keys are confirmed written successfully.
- Test explicitly: create a v1 save in DevTools, then reload with v2 code. Verify XP and level survived and v2 defaults are correct.
- Validate on load: after reading localStorage, check all required fields exist and are the correct type. If any are missing or wrong type, apply defaults rather than crashing.

**Warning signs:**
- v2 development done entirely on a fresh browser profile — v1 migration never tested
- No `schemaVersion` field in the v1 save design
- The save/load code reads fields with no fallback defaults (e.g. `state.currentFloor` with no `?? 1` guard)
- Tests only cover "fresh install" scenario

**Phase to address:**
Save/state architecture phase — define the v2 schema and migration path before writing any save/load code. Include v1-to-v2 migration in the very first implementation of the save system.

---

### Pitfall 6: Accidental ADHD-Unsafe Patterns Sneaking in via Combat Mechanics

**What goes wrong:**
Five ADHD-unsafe patterns can accidentally appear in the dungeon layer even when everyone agrees timers are banned:

1. **Implicit time pressure from HP drain**: Seeing HP drop with each wrong answer creates urgency and cortisol spike. Even without a visible timer, a shrinking health bar is a countdown. The user rushes, makes more errors, takes more damage, spirals.
2. **Death as hard punishment with XP/loot loss**: Any mechanic that strips progress earned inverts the reward loop. ADHD users experience this as "the game punishes me for struggling" and quit.
3. **Comparison metrics accidentally added**: "Floor 2 best time: 3:22" or "Defeated in 7 questions (average: 4)" introduces performance comparison and social anxiety against a virtual past self.
4. **Sensory overload from combat feedback**: Screen shake, flashing red damage overlays, loud sound effects, and simultaneous animations overwhelm working memory during a math question. The player is trying to think about 8×7 while the screen vibrates.
5. **Loot/upgrade complexity requiring decision-making under stress**: "You found a sword (+2 attack) and a shield (+1 defense). Choose one." This choice requires comparison, risk assessment, and commitment — a cognitive load spike at a moment that should feel like reward, not work.

**Why it happens:**
Each of these patterns is standard RPG design. Combat feedback is expected to be dramatic. Loot choices are expected to be interesting. Developers import genre conventions without filtering them through ADHD-safety requirements. The harm is not obvious until a real user session reveals the anxiety response.

**How to avoid:**
- HP bar: use colour progression (green → amber → red) but never show a timer. Wrong-answer damage is small and shown as a number, not an animated drain.
- Death: restart floor only. Zero XP loss. Zero loot loss. Death screen says "Try again?" not "You failed" or "Floor 2 — your best run: 5 questions."
- No time tracking displayed anywhere. No session comparison stats. Progress is absolute ("You defeated 12 enemies today") not relative ("3 fewer than yesterday").
- Combat animations: brief (under 0.5s), non-flashing, no screen shake. Sound effects optional and off by default.
- Loot drops: automatic application, no choice required. "You found a Rusty Sword! +2 Attack." It just applies. If multiple items are possible, pick automatically based on what is most needed (low HP → potion, otherwise sword/shield).

**Warning signs:**
- Player reports feeling "rushed" or "panicked" during a combat encounter
- Player takes noticeably longer to answer questions mid-combat than pre-combat
- Loot screen has a "choose between two items" design
- Any animation runs longer than 500ms and overlaps with the question display
- A "best run" or "last run" stat appears anywhere in the UI

**Phase to address:**
Combat design + UI design phases — ADHD-safety checklist must be applied at both design and implementation review. Any new UI element requires an explicit check against these five patterns before merging.

---

### Pitfall 7: Enemy Difficulty Tied to Table Difficulty Creates Frustrating Gates

**What goes wrong:**
The planned design gates enemy types by multiplication table: Goblins = ×2×3×5, Skeletons = ×4×6×7, Dragon = ×7×8×9. This means a player who cannot answer ×8 questions reliably will die every time they face a Skeleton or Dragon — not because the combat is unfair, but because the math is hard and the combat damage adds punishment on top. The difficulty of the math and the difficulty of the combat are compounding rather than independent. The player cannot separate "I'm bad at ×8" from "I hate this game."

**Why it happens:**
Difficulty progression in a dungeon naturally maps to "harder enemies later." Multiplying that with harder math seems elegant but doubles the frustration gradient. v1 already used EWMA accuracy tracking to adaptively serve the right tables — v2 risks throwing that away by forcing hard tables on floor 3 regardless of where the player actually is.

**How to avoid:**
- Decouple math difficulty from floor difficulty. Floor number determines enemy HP and XP reward (visual/narrative progression). Question difficulty is still determined by EWMA accuracy from v1 (the existing adaptive system).
- On floor 3, a Goblin-type enemy can still appear — it just has more HP. The player faces the Dragon boss having been prepared by questions at their actual mastery level, not force-fed ×9 tables they have never practiced.
- Enemy type determines visual/aesthetic/flavour and HP/damage scaling. Table selection remains adaptive. This preserves v1's core value (confidence-building through appropriate challenge) inside the dungeon structure.

**Warning signs:**
- Floor 2 question set contains exclusively ×6 and ×7 regardless of accuracy history
- Player has not answered ×7 questions correctly in any prior session but floor 2 presents them exclusively
- Death rate on floor 2 exceeds death rate on floor 3 (wrong difficulty curve)
- Player says "I can't get past floor 2" when they can answer ×4 and ×5 fine

**Phase to address:**
Combat design phase — explicitly document how the adaptive question system (EWMA from v1) integrates with floor progression. Test with a simulated player who has low accuracy on hard tables.

---

### Pitfall 8: Loot Economy Becomes Either Meaningless or Overpowering

**What goes wrong:**
Two failure modes: (a) loot drops are so common that every room gives an upgrade and the game becomes trivially easy by floor 2 — sword maxed, shield maxed, potions full — so there is no tension; (b) loot drops are so rare that the player runs an entire floor with no upgrades and the HP damage from wrong answers accumulates with no recovery mechanism. Both kill engagement. Too easy = boring. Too scarce = punishing. Dungeon crawler design literature explicitly identifies this as the primary pacing challenge.

**Why it happens:**
Without playtesting calibration, loot frequency defaults to "what feels right" which is usually too generous (developer wants the player to feel rewarded) or too stingy (developer wants the loot to feel special).

**How to avoid:**
- Fix loot to structure: one guaranteed item per floor (in the treasure room), one potion available from a specific room type per floor. Boss drop is always a significant upgrade. Random loot in combat rooms is a bonus, not the primary source.
- Potions are the safety valve. Ensure at least one potion is accessible per floor regardless of random drops. This caps the punishment floor of a bad run.
- For v2 scope, item variety should be minimal: one sword tier, one shield, one potion. No comparison choices. Picking up a second sword could either upgrade the existing one (preferred) or be auto-converted to HP.
- Design to targets: player should finish each floor with 60–80% HP on average with reasonable question accuracy. If internal playtesting shows average HP at floor end < 40%, add a potion drop. If > 90%, remove one.

**Warning signs:**
- Player reaches floor 2 boss with full HP regardless of accuracy
- Player dies on floor 1 with only potions and no sword drops
- Loot screen appears more than 4 times in a single floor
- Player never uses a potion because they never take meaningful damage

**Phase to address:**
Combat/loot design phase — define drop rates and structure before coding. Build a spreadsheet model or do a manual "pen and paper" run through 10 floors at 30% wrong-answer rate and 70% wrong-answer rate to verify the economy holds at both extremes.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline all screen HTML in one flat `<body>` block | No screen abstraction needed | CSS bleeds between screens; toggling 7 screens requires tracking 7 visibility states manually | Never — use `hidden` attribute + central `renderScreen()` from day one |
| Store dungeon state as flat top-level variables | Simple to read initially | v2 save schema is a pile of unrelated globals; migration becomes guess-work | Never — store all dungeon state in one `dungeonState` object |
| Hardcode enemy stats as inline numbers | Fast to write | Rebalancing requires ctrl+F through all game logic | Only for initial prototyping; move to a `CONFIG` object before first real test |
| No v1→v2 migration, just clear localStorage | No migration code to write | Users lose weeks of XP and level progress; trust destroyed | Never — always migrate v1 data |
| Damage animations using `setTimeout` chains | Easier than CSS keyframes | Timers stack when player answers quickly; animations overlap; jank accumulates | Never — use CSS animations with `animationend` callbacks |
| Loot as free choice between two items | More interesting decision | Adds cognitive load during what should be a reward moment; ADHD-unsafe | Never for this audience — auto-apply loot |
| Add a "combo multiplier" for consecutive correct answers | Exciting escalating reward | Creates implicit pressure to not break the streak — ADHD-unsafe anxiety driver | Never — any streak mechanic creates implicit punishment for breaking it |
| Enemy has a rage mode (attacks faster after low HP) | Dramatic climax | Introduces implicit time pressure; ADHD-unsafe | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| v1 EWMA accuracy system + v2 combat | Ignore EWMA; assign questions by floor number | Feed floor enemy encounters through the same EWMA question selector; floor determines HP/reward scaling, not question difficulty |
| v1 XP system + v2 dungeon progression | Create a second parallel XP track for dungeon | Unify: defeating enemies awards XP to the same v1 XP/level system; no parallel progression tracks |
| v1 localStorage schema + v2 new fields | Add new fields to v1 key assuming backward compat | Read `schemaVersion`, run migration, write new unified save object under versioned key |
| CSS for 7 screens in single file | Global selectors (`.title`, `.button`) applied to all screens | Scope all selectors under screen ID: `#screen-combat .button`; treat each screen as a CSS namespace |
| CSS animations for damage feedback | Use `setTimeout` for animation timing | Use CSS `@keyframes` + `animationend` event; never `setTimeout` for visual state transitions |
| Combat state + DOM state | Update DOM directly in combat logic | Combat logic writes to `gameState`; a single `render(gameState)` function owns all DOM updates |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rendering all 7 screens in DOM simultaneously (just hidden) | Layout cost scales with all screen DOM even when hidden; forced layout on every combat update | Use `hidden` attribute (browser skips layout for hidden elements) not just `display:none` via class | After screen count exceeds 4 |
| Combat animation loop using `setInterval` | Animation jank, CPU spin when tab hidden, potential memory leak | Use `requestAnimationFrame` + CSS animations; RAF pauses when tab hidden | Immediately — setInterval always runs |
| Saving full dungeon state on every question answer | localStorage writes on every keypress; storage thrashing after 30+ minute sessions | Save only on: room cleared, floor complete, app hidden (`visibilitychange`), not on every answer | After 200+ answers in a session |
| DOM manipulation inside combat loop per-frame | Reflow triggered every animation frame; UI jank | Batch DOM updates; read layout properties before writing; update HP bar via CSS custom property change only | Immediately on low-end laptop |
| Accumulating `addEventListener` calls without cleanup | Memory leak; stale handlers fire multiple times per event after screen transitions | Remove event listeners when leaving a screen, or use event delegation on a stable parent | After 3+ screen transitions |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| HP bar shrinking too fast on wrong answers | Triggers urgency panic; ADHD cortisol response; math performance degrades | Small damage amounts; generous starting HP; HP loss animated slowly (not instant) |
| Death screen with stats comparison ("Your best: 8 questions") | Comparison to past self creates shame; "I got worse" narrative | Death screen: simple "Try floor again?" — no stats, no comparison, no shame |
| Room navigation requiring multiple clicks to advance | Friction breaks flow; ADHD brains need one clear next action | One button: "Enter Room" → combat starts immediately; no intermediate confirmation screen |
| Loot choice requiring player to compare two items | Decision fatigue; cognitive load at reward moment | Auto-apply loot; announce what dropped; no choice required |
| Floor complete screen with extensive stats breakdown | Information overload; player doesn't read it | Floor complete: brief celebration ("Floor 2 cleared! +150 XP"), single continue button, 2-second hold maximum |
| Enemy having visible "charging attack" animation | Creates implicit time pressure ("I must answer before it attacks") | Enemy just waits indefinitely; no countdown, no charge animation, no urgency cues |
| Progress reset on floor failure showing previous best | Creates comparison anxiety | Show only the current attempt; no historical comparison until after a successful run |

---

## "Looks Done But Isn't" Checklist

- [ ] **v1→v2 migration:** Tested by loading v2 with v1 data in localStorage. XP and level survive. New dungeon fields initialise to correct defaults. No crash on undefined fields.
- [ ] **Combat balance at 30% accuracy:** Simulated a session where 30% of answers are wrong. Player can still complete floor 1 without dying. Floor 2 is survivable with potion use. Not trivially easy.
- [ ] **Screen state machine:** Verify only one screen is ever visible at a time. Inspect DOM after every screen transition. No residual `hidden=false` on inactive screens.
- [ ] **ADHD safety audit:** No timers (visible or hidden). No streak mechanics. No comparison stats on death screen. Wrong-answer damage is small. Death = restart floor only. Loot auto-applies.
- [ ] **Adaptive tables preserved:** Questions during combat still come from EWMA accuracy selector, not hardcoded to floor number. A player weak on ×9 does not face exclusively ×9 on floor 3.
- [ ] **CSS scope isolation:** All screen-specific CSS scoped under `#screen-X`. No global selectors that affect multiple screens. DevTools inspection of combat screen shows no styles leaking from other screens.
- [ ] **Event listener cleanup:** All event listeners added when entering a screen are removed when leaving. No duplicate handlers firing after screen transitions.
- [ ] **Loot economy balance:** Ran 10 simulated floors at 30% wrong-answer rate and 70% wrong-answer rate. Player ends floors with 50–85% HP in both scenarios. Adjust drop rates until both pass.
- [ ] **Floor repetition check:** Played all 3 floors consecutively. Rooms feel distinct (at minimum: combat rooms, one treasure room per floor, boss room). Enemy flavour text is different per floor even if mechanics are the same.
- [ ] **Save versioning:** `schemaVersion` field exists in save object. Loading save with missing `schemaVersion` triggers migration path, not crash.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| v1 data broken by v2 release without migration | HIGH | Ship hotfix that reads old key format and reconstructs valid v2 save; users must reload; XP may need manual restoration if already overwritten |
| Combat punishes too hard (players dying repeatedly) | LOW | Reduce wrong-answer damage multiplier in CONFIG; increase starting HP; add one guaranteed potion to floor 1; deploys as single-file update |
| Dungeon scope crept to unshippable size | HIGH | Cut features back to the fixed scope list; delete incomplete features; ship what works; document cut features in backlog |
| Screen state corruption (two screens visible) | MEDIUM | Audit all `renderScreen` call sites; enforce single entry point pattern; test every screen transition |
| ADHD-unsafe feature shipped (streak mechanic, timer) | MEDIUM | Remove feature entirely; do not "soften" it — any version of it re-introduces the unsafe pattern |
| Loot economy broken (trivially easy or HP death spiral) | LOW | Adjust CONFIG drop rates and damage values; single-file rebalance deploys immediately |
| Floor repetition complaint (boring by floor 2) | MEDIUM | Add per-room flavour text without touching mechanics; low code cost but requires content writing |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dungeon scope creep | Requirements / planning phase | Won't-build list exists and is signed off before any code is written |
| Wrong-answer damage punishment loop | Combat design phase | Combat tested at 30% accuracy rate; player can complete floor without death spiral |
| Floor repetition | Room/floor design phase | Room types (combat / treasure / boss) defined before rooms are coded; flavour text written per enemy per floor |
| CSS/DOM screen spaghetti | Screen architecture phase (first thing built) | Single `renderScreen()` function; one screen visible in DOM at all times; verified by inspection |
| v1→v2 save migration | Save/state architecture phase | v1 data loads without crash; XP and level preserved; new fields initialised correctly |
| ADHD-unsafe patterns sneaking in | Combat + UI design phases | Explicit ADHD checklist applied at design review and at code review; no timers, no streaks, no comparison stats anywhere |
| Enemy difficulty gating adaptive tables | Combat design phase | EWMA integration document written before combat coded; test with simulated weak-×9 player on floor 3 |
| Loot economy imbalance | Loot/drop design phase | Economy modelled at two accuracy extremes before implementation; drop rates in CONFIG not hardcoded |

---

## Sources

- [Feature Creep: The Silent Killer of Indie Game Dreams — Wayline](https://www.wayline.io/blog/feature-creep-silent-killer-indie-games)
- [How to Avoid Scope Creep in Game Development — Codecks](https://www.codecks.io/blog/2025/how-to-avoid-scope-creep-in-game-development/)
- [Why Rewards and Punishments Don't Work for ADHD Kids — We Thrive Learning](https://www.wethrivelearning.com/post/why-rewards-and-punishments-don-t-work-for-adhd-kids-and-what-actually-motivates-them)
- [Reward and Punishment Sensitivity in Children with ADHD — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC3268965/)
- [Building Games for ADHD? What You're Probably Doing Wrong — Medevel](https://medevel.com/building-games-for-adhd-heres-what-youre-probably-doing-wrong-and-how-to-fix-it/)
- [Customizing Game Mechanics for ADHD — Medevel](https://medevel.com/customizing-game-mechanics-for-adhd-what-developers-need-to-know/)
- [ADHD-Friendly App Design: What to Look For — Monster Math Blog](https://www.monstermath.app/blog/adhd-friendly-app-design-what-to-look-for-and-what-to-avoid)
- [What Makes a Dungeon Crawl Good — Skeleton Code Machine](https://www.skeletoncodemachine.com/p/what-makes-a-dungeon-crawl-good)
- [How to Make Dungeon Crawling Less of a Crawl — Grimly Enthusiastic](https://grimlyenthusiastic.wordpress.com/2010/07/30/guide-to-good-dungeons/)
- [Dynamic Game Difficulty Balancing — Wikipedia](https://en.wikipedia.org/wiki/Dynamic_game_difficulty_balancing)
- [How Much Loot Is Too Much? — Cheat Code Central](https://www.cheatcc.com/articles/how-much-loot-is-too-much/)
- [Balancing Loot Distribution in TTRPGs — TTRPG Games](https://www.ttrpg-games.com/blog/balancing-loot-distribution-in-ttrpgs/)
- [Build a State Management System with Vanilla JavaScript — CSS-Tricks](https://css-tricks.com/build-a-state-management-system-with-vanilla-javascript/)
- [Managing Complex State in Vanilla JavaScript — Java Code Geeks](https://www.javacodegeeks.com/2024/11/managing-complex-state-in-vanilla-javascript-a-comprehensive-guide.html)
- [Simple Frontend Data Migration — Jan Monschke](https://janmonschke.com/simple-frontend-data-migration/)
- [Pro Tips Using localStorage — Medium](https://medium.com/@mohamedelayadi/pro-tips-using-localstorage-51931f40f0be)
- [Cross-Document View Transitions Gotchas — CSS-Tricks](https://css-tricks.com/cross-document-view-transitions-part-1/)
- [Optimize DOM Size for Better Web Performance — DebugBear](https://www.debugbear.com/blog/excessive-dom-size)

---

*Pitfalls research for: Dungeon crawler layer added to existing single-HTML-file math game (ADHD-safe, 12-year-old)*
*Researched: 2026-06-20*
*Confidence: HIGH*
