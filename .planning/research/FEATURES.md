# Feature Research

**Domain:** Kid-targeted educational 2D platformer (math-gated progression), v4.0 "Content & Challenge" milestone
**Researched:** 2026-06-28
**Confidence:** HIGH (existing v3.0 modules read directly; canonical platformer/edu-game patterns cross-checked against external sources)

> **Supersedes** the 2026-06-22 v3.0-era FEATURES.md (which specced the single-level slice). This document covers the v4.0 NEW features only.
>
> **Scope note (subsequent milestone):** This document specs ONLY the NEW v4.0 features. The v3.0 spine — run/jump/coyote/buffer/variable-height, clamped camera, gentle checkpoint respawn, the end-of-stage `mathGate`, the 6–9-weighted `brain`, XP/leveling, versioned localStorage — is SHIPPED and is treated as a fixed foundation, not re-specced.
>
> **LOCKED constraints checked against every feature below:** dark grunge / NO pink · ADHD-safe (NO timers, wrong answers NEVER punish, non-strobing) · 4-option multiple choice · the 6–9 weighted brain is unchanged · vendored Kaplay, no build step.

---

## The Central Insight: One Abstraction for All Four Math Mechanics

The four requested mid-game math mechanics (locked door/key, collect-the-answer, multiple checkpoint gates, defeat-enemy) are **four skins over one mechanic**: *an in-world obstacle that blocks forward progress until a brain-supplied question is answered correctly; a wrong answer is always penalty-free and re-askable.*

`src/ui/mathGate.js` already IS that mechanic, minus three small extensions:

1. It currently renders a **full-screen dim + centered panel** ("end of stage" framing). Three of the four new mechanics want a **smaller in-world prompt anchored near the obstacle**, not a screen takeover.
2. Its correct-branch is hardwired to a **terminal "LEVEL CLEAR"** persistent banner. The new mechanics need correct to **dissolve the specific obstacle and return control**, then keep playing.
3. It pulls **one question and keeps it** (forgiving re-ask). That contract is exactly right and carries forward verbatim.

**Recommendation for the roadmap:** generalize `mathGate.js` into a single `openMathChallenge({ brain, allowedTables, onCorrect, onClose, layout })` that all four mechanics call, where `layout` ∈ {`stage` (existing full-screen), `prompt` (compact, near-obstacle)} and `onCorrect` is the obstacle-specific dissolve. The existing end-of-stage gate becomes the `layout: "stage"` caller. **Do not build four separate question UIs** — that multiplies the ADHD-safety surface (timers, punishment, leak audits) by four and guarantees drift. This is the single most important architectural recommendation in this document.

All four mechanics depend on: `brain.js` (unchanged, provides the question + 4 choices), the generalized challenge UI (extends `mathGate.js`), and the scene's collision idiom (`player.onCollide("<tag>", …)` — already the one wiring pattern in `game.js`).

---

## Feature Landscape

### Table Stakes (Users Expect These)

Without these, v4.0 does not read as "a real game with more content" — it reads as the same 30-second slice with extra buttons.

| Feature | Why Expected | Complexity | Notes / Dependencies |
|---------|--------------|------------|----------------------|
| **3–5 hand-built levels** | "More content" is the headline of the milestone; one level = a demo, several = a game | MEDIUM | Extend `level.js` from one exported `LEVEL` object to a `LEVELS` array (or one module per level). `buildLevel()` already takes a level arg — it's level-data-driven, low-risk. Effort is authoring + tuning, not engine work. |
| **Level-select / world-map screen** | A multi-level game needs a hub to choose/resume from; the school reference game has stage progression | MEDIUM | New Kaplay scene `scene("select", …)`. Reads per-level unlock/completion from `progress.js`. `main.js` boots `select` instead of `game`; `game` scene takes a `levelId` in its `go()` payload (the payload seam already exists). |
| **Locked vs unlocked level states** | Canonical platformer progression; gives "advancing" feel; prevents a wall of identical buttons | LOW–MEDIUM | Visual state per level node: locked (dimmed/greyed, not clickable), unlocked (selectable), completed (marked). External sources confirm distinct locked/unlocked/current visual states are the baseline expectation. Linear unlock (beat N → unlock N+1) is simplest and fits a 3–5 level game. |
| **Completion marks per level** | Players need to see what they've finished; the "sense of progression" the milestone explicitly asks for | LOW | A simple checkmark / "cleared" glyph per node is table stakes. Stars (see Differentiators) are the richer version — NOT required for table stakes. |
| **Resume / return to map after a level** | After clearing a level the player must land somewhere that shows progress, not a dead "LEVEL CLEAR" screen | LOW–MEDIUM | Replace the gate's terminal banner (for end-of-stage) with `go("select")` after the clear celebration. The `onSceneLeave` teardown discipline in `game.js` already exists and must be honored. |
| **Per-level completion/unlock persistence** | Progress that doesn't survive a refresh feels broken; XP already persists, so levels not persisting is jarring | LOW–MEDIUM | Extend the save blob in `progress.js`: add `levels: { "<id>": { completed: bool } }`. The validated-copy `validate()` pattern (explicit per-key, no spread — prototype-pollution guard) MUST be reused for the new field. Bump `CONFIG.SAVE.VERSION`; loadSave already returns defaults on version mismatch (forgiving, no migration). |
| **A difficulty curve across levels** | "Challenge" is half the milestone title; identical levels = no progression | MEDIUM | Concrete knobs below. Crucially, table difficulty per level is gated via the brain's existing `allowedTables` parameter (`calculateWeights(allowedTables)` already supports it — currently called with `undefined` = all tables). This is the cleanest, already-built lever. |
| **Generalized in-world math challenge** | The shared substrate all four mid-game mechanics need | MEDIUM | Extend `mathGate.js` per "The Central Insight" above. This is itself table stakes because three of the four mechanics are otherwise un-buildable safely. |
| **At least one mid-game math mechanic working** | The milestone's defining new idea is math *woven throughout* a level, not only at the goal | MEDIUM | Locked door/key is the recommended first one (see per-mechanic analysis) — it's the most direct reuse of the gate + a dissolve. |
| **Art / presentation pass** | v3.0 art was flagged "reads as early-MVP" in PROJECT.md Key Decisions; "looks like an actual game" is an explicit goal | MEDIUM–HIGH | Animated player (idle/run/jump), real tileset, background/parallax, title screen. Sprite-anim support already proven (coin `sliceX`/`anims` in `main.js`). Mostly asset sourcing (CC0, dark/grunge, no pink) + wiring, not new systems. Parallax is a new but small Kaplay concern. |

### Differentiators (Competitive Advantage / Aligns with Core Value)

Core Value = "she opens it because she *wants* to." Differentiators are the things that make it feel like *her* game, beyond a functional math-gated platformer.

| Feature | Value Proposition | Complexity | Notes / Dependencies |
|---------|-------------------|------------|----------------------|
| **All four math mechanics shipped** | Variety is what keeps an ADHD kid re-opening it; each level can feel mechanically fresh instead of "find the goal again" | MEDIUM (given the shared abstraction) | Once the generalized challenge exists, each additional mechanic is mostly: a tagged entity in `level.js` + a small `onCorrect` dissolve in the scene + a layout variant. Marginal cost per mechanic is LOW *after* the first. |
| **Stars / tiered completion per level** | Richer "advancing" feel than a binary checkmark; gives optional replay pull without any pressure | MEDIUM | Earn-able by e.g. (clear) + (all coins) + (no respawns) — but **the third must never be framed as failure** (see Anti-Features). Stars are a known, well-loved platformer pattern (external sources). Keep them additive and silent — never red, never "you lost a star." |
| **Defeat-enemy-with-answer reusing 👺💀🐉** | Callback to v2.0's combat; the kid already met these enemies; turns a "boss" beat into a satisfying math win | MEDIUM | Reuses v2's enemy *identity* (emoji/sprite), NOT v2's HP/turn-combat engine (that's archived). Mechanically it's "answer → enemy dissolves with a juicy non-strobing burst." See per-mechanic analysis. |
| **Title screen** | Makes it feel like a shipped product, not a dev build; a clean entry beat | LOW–MEDIUM | New scene before `select`. Pure presentation; dark-grunge logo + "press to play." Listed in PROJECT.md target features. |
| **Background / parallax depth** | Single biggest cheap win for "looks like an actual game" vs flat MVP | MEDIUM | One or two scrolling layers behind the level. New Kaplay wiring but well-trodden; tie scroll to camera x. |
| **World-map "path" visuals between nodes** | Sells progression viscerally (the dotted-line-advancing feeling) | LOW–MEDIUM | External sources note drawing inter-level paths in the same tile style fills out the map and reinforces progression. Pure presentation on the select scene. |
| **Per-level table theming surfaced to the player** | "This is the 7s level" gives the practice intent a face; subtle mastery framing | LOW | Optional label on the map node (e.g. "×7 zone"). Drives off the same `allowedTables` the difficulty curve already uses. Keep it cool/edgy, not schooly. |

### Anti-Features (Deliberately NOT Built)

These are the ADHD-safe / no-pink / no-shame guardrails. Every one of these is something a "normal" platformer or quiz app would add and that would actively harm THIS user.

| Feature | Why It Gets Requested | Why Problematic Here | Build Instead |
|---------|----------------------|----------------------|---------------|
| **Any timer / countdown on a math challenge** | "Adds urgency / tests fluency" | Hard-locked out by ADHD context; v3.0 `mathGate` is *defined by construction* to have no scheduler/elapsed-fail. External ADHD sources: timers are the #1 thing to remove. | The existing no-timer forgiving gate, unchanged. The challenge stays open until correct. |
| **Lives / game-over / "you failed this level"** | Classic platformer staple | v3.0 deliberately has no lives/game-over (gentle respawn). Re-introducing it for harder levels would betray the whole respawn philosophy. | Gentle checkpoint respawn (already shipped). Harder levels add *more interesting* platforming, never punishment. |
| **Wrong-answer penalty (lose progress / take damage / kicked back)** | "Make answers matter" | LOCKED: wrong answers NEVER punish. The gate already re-asks the SAME question penalty-free. | Wrong → small non-strobing nudge (red flash on the chosen box, `shake(6)` already in `mathGate.js`), keep the same question, stay open. |
| **Enemies that hurt / kill the player on touch** | Standard platformer hazard | The defeat-enemy mechanic is a *math gate with a face*, not a damage source. A patrolling enemy that costs a respawn edges toward punishment and timing pressure. | Enemy *blocks* a path (acts as a gate). Touch → opens the math challenge. Correct → enemy dissolves. No contact damage. (Spikes already exist as the one forgiving hazard; don't multiply hazard types.) |
| **Leaderboards / scores / "best time" / social compare** | Engagement & replay | Explicitly Out of Scope in PROJECT.md (shame-spiral risk). Solo practice only. External ADHD sources: avoid comparison/pressure framing. | Personal, silent progress: completion marks, optional stars, XP/level — all self-referential, never ranked. |
| **A star you can LOSE / red "0/3" framing** | Mastery feedback | Turns the optional star into a punishment vector — the exact shame dynamic to avoid. | Stars are *earned and additive only*. Un-earned = simply not-yet-lit (grunge-neutral), never a red "missed." |
| **Streaks / combo meters that break on a wrong answer** | Dopamine loop | A breakable streak makes a wrong answer a loss — punishment by another name; also adds time-pressure feel. | XP that only ever goes up (already shipped); the brain quietly re-weights weak tables without telling her she "broke" anything. |
| **Hard locked-gate that strands her with no way forward** | "Math must be mandatory to progress" | A door she *cannot* pass without answering is fine; a door where a wrong answer locks her out (cooldown/limited attempts) is not. | Unlimited, penalty-free re-asks. She always has a path forward the moment she answers correctly — which the forgiving brain makes very reachable. |
| **Strobing / flashing celebration on clear** | "Juicy" feedback | LOCKED non-strobing constraint; v3.0 audit (`check-safety.sh`) enforces it. | Self-cleaning, ≤~500ms, non-strobing bursts (the `fx.js` pattern already shipped). |
| **Pink / cute / bubbly art for the "girl" user** | Demographic assumption | Explicitly excluded — the whole point is it's NOT girly/cutesy. Holds for new sprites, the title screen, the map, and stars. | Dark grunge, edgy, neon accents (#00ff88 / #ff6600). New art must pass the same palette bar. |
| **Typed numeric answer input for "collect-the-answer"** | Seems natural for grabbing a number | Out of Scope (typed input rejected for friction). Even the pickup mechanic must stay multiple-choice in spirit. | Collect-the-answer = several physical pickups, exactly one correct (it IS a 4-option choice rendered in world-space). |
| **An in-world level editor / user-generated levels** | "More content forever" | Massive scope; not the ask; the value is *hand-tuned* levels for *her* | 3–5 carefully authored levels in `level.js` data. |
| **Audio / SFX / music** | Juice | Explicitly DEFERRED (AUDIO-01) — not this milestone. | Visual juice only this milestone. |

---

## The Four Math Mechanics — Per-Mechanic Analysis

All four are skins over the generalized challenge (see Central Insight). For each: how the player triggers it, what correct/wrong does (staying forgiving + no-timer), how it reuses vs extends `mathGate`, and relative complexity. **Recommended build order: A → B → D → C** (each reuses the prior, increasing in placement/state complexity).

### (a) Locked Door / Key — *recommended first*

- **Trigger:** Player walks into a tagged `"door"` (or `"keygate"`) entity blocking the path (a solid or a barrier). Collision opens the challenge — same idiom as the existing goal collision in `game.js`.
- **Correct:** The door dissolves (destroy the barrier + a non-strobing burst), control returns, player walks through. Optionally award XP via the same `progress.addXp(table)` seam the goal uses (the `onCorrect` carries `{ table }` exactly like `onClear` does today).
- **Wrong:** Identical to the shipped gate — nudge + redden the chosen box, `shake(6)`, keep the SAME question, door stays closed, no penalty, re-ask freely.
- **Reuse vs extend:** Highest reuse of any mechanic. It's the existing gate with (1) `layout: "prompt"` instead of full-screen `stage`, and (2) `onCorrect` = `destroy(door)` instead of the terminal banner. No new question logic.
- **Complexity:** **LOW–MEDIUM.** This is the proof-of-concept for the generalized challenge; build it alongside the abstraction.
- **Key/optional variant:** A "key" pickup the player grabs first, then the door opens on contact without re-asking — a softer flavor. Adds run-state (`hasKey`) but no new UI. Keep optional; the answer-at-the-door flavor is the core.

### (b) Collect-the-Answer Pickup

- **Trigger:** The level shows a question prompt (in a HUD-style banner or near a gate), and several **numbered pickups** are placed in the level geometry — one per choice, exactly one correct. The player physically navigates to and touches the pickup they believe is the answer. This is a 4-option multiple-choice rendered *as platforming*.
- **Correct:** The correct pickup grants passage / lights a gate / awards XP with a non-strobing pop. Forgiving framing: she chose right.
- **Wrong:** The wrong pickup gives a gentle non-strobing nudge and **does NOT consume the question or punish** — she can go touch the right one. No respawn, no damage, no "wrong" stamp. (Design subtlety: a wrong pickup should *remain available* or respawn, so there's never a dead-end where she touched the wrong one and is now stuck.)
- **Reuse vs extend:** Reuses `brain.nextQuestion()` for the question + the 4 choices, but renders the *choices in world space* (pickup entities tagged with their value) instead of in the gate panel. The "is this correct?" check reuses the gate's `picked === q.answer` logic. New: spawning/positioning choice entities from `q.choices`, and the wrong-touch-is-harmless rule.
- **Complexity:** **MEDIUM.** New world-space rendering of choices + level-authoring concern (placing 4 reachable pickups fairly). Most distinct of the four; build after the door proves the abstraction.

### (c) Multiple Checkpoint Gates Within a Level

- **Trigger:** Several end-of-stage-style gates *within* one level (e.g. a gate at each third), each blocking forward progress until answered — the existing `mathGate` experience, but N times per level instead of once at the goal.
- **Correct:** That gate clears (dissolves), play continues to the next segment. Each clear can award XP (same seam). The *cleared* gate must stay cleared if she respawns at a checkpoint past it (run-state, not persisted).
- **Wrong:** Same forgiving re-ask as the shipped gate, per gate.
- **Reuse vs extend:** Conceptually the *closest* to today's gate (it literally is the stage gate, repeated). The extension is **state management**, not UI: tracking which gates are cleared this run, ensuring a respawn doesn't re-lock a passed gate, and ensuring the fire-once latch is *per gate* (today there's a single `goalReached` closure latch — this generalizes to a per-gate cleared set). Anti-leak: per `mathGate.js`'s own warnings, the key controllers `1–4` are reserved while a gate is open; multiple gates must never have two open at once (only the one you're touching opens).
- **Complexity:** **MEDIUM** — low UI cost, but the per-gate run-state + respawn interaction is the fiddliest correctness concern of the four. Build after door + collect, when the abstraction is stable.
- **Synergy with difficulty curve:** Each gate can pull from a different `allowedTables` set, so a single level can ramp table difficulty internally.

### (d) Defeat-Enemy-With-Answer (👺💀🐉)

- **Trigger:** A tagged enemy entity (Goblin/Skeleton/Dragon, escalating per level) **blocks the path**. Touching it (NO damage to the player — see Anti-Features) opens the math challenge.
- **Correct:** The enemy is "defeated" — dissolves with a satisfying non-strobing burst (its emoji/sprite poofs), path opens, XP via the same seam. This is the emotional payoff beat.
- **Wrong:** Forgiving re-ask; the enemy just stands there (it does not attack, does not advance, no timer). She tries again freely.
- **Reuse vs extend:** Mechanically identical to the locked door (a blocking entity + challenge + dissolve `onCorrect`). The *only* real difference from the door is presentation (enemy sprite/emoji + a "defeat" burst) and that escalating enemies map naturally onto the per-level table ramp (Goblin = easier tables, Dragon = the 6–9 weak spot, deep in). Reuses v2's enemy *identity only* — NOT the archived HP/turn-combat engine.
- **Complexity:** **MEDIUM**, but mostly art/presentation; mechanically it rides on the door's abstraction. The dragon-as-final-gate is a strong differentiator beat.
- **ADHD guard:** the enemy must never deal contact damage, patrol into her, or impose timing. It is a gate that looks scary, not a threat.

**Shared-abstraction summary:** (a) and (d) are the *same mechanic* with different art. (c) is the same mechanic repeated with per-gate state. (b) is the one that renders choices in world-space and so diverges most. One `openMathChallenge` covers a/c/d directly; b reuses the brain + correctness check but needs world-space choice entities.

---

## Level-Select / World-Map — Table Stakes vs Nice-to-Have

| Aspect | TABLE STAKES (must) | NICE-TO-HAVE (differentiator) | ANTI |
|--------|---------------------|-------------------------------|------|
| Layout | A scene listing the 3–5 levels as selectable nodes | World-map with themed path art between nodes; parallax map background | Procedural/infinite map |
| Locked state | Locked levels visibly distinct (dimmed/greyed) and **not selectable** | Themed locked art (e.g. a chained/dark node in grunge style) | A locked node with no indication of *how* to unlock |
| Unlock rule | Linear: clear level N → unlock N+1 (simple, fits 3–5 levels) | "Next world's first level unlocks early so she's never hard-stuck" (external pattern) — likely overkill at this scale | Star-gated unlocks that can *strand* her (must avoid pressure) |
| Completion | A clear/checkmark glyph on completed nodes | Stars (e.g. cleared / all-coins / clean-run), additive-only | Any losable or red "missed" marker |
| Resume | Returning to the map shows current progress; XP/level persists (already does) | "Continue" jumps to the next unlocked level; remembers last-played | Forcing replay from level 1 each session |
| Entry | Map is the post-v3.0 boot scene; `main.js` boots `select`, `game` takes `levelId` | Title screen → map | A dead "LEVEL CLEAR" terminal with no way back (today's end-state — must be replaced) |

**Implementation seam:** the select scene reads `progress`'s new per-level state; `game` scene already accepts a `go()` data payload (used today for `startX/startY`) — extend it with `levelId`. On clear, `go("select")` instead of the terminal banner. Honor the existing `onSceneLeave` teardown discipline (`game.js` cancels `hideCtrl` and the fx scale tween on leave — re-entry via the map makes this *load-bearing*, not theoretical).

---

## Difficulty Curve — Concrete Knobs

The curve has two axes the milestone names explicitly: **platforming difficulty** and **table difficulty**. Concrete, tunable knobs (all data-driven in `level.js` / `config.js`, no engine changes):

| Knob | Easy (Level 1) | Hard (Level 5) | Where it lives |
|------|----------------|----------------|----------------|
| **Level length** | ~3.5 screens (today) | longer, more segments | `floors`/`platforms` extent in level data; `CONFIG.LEVEL_RIGHT` per level |
| **Gap width / jump precision** | wide forgiving gaps, big platforms | tighter gaps near the player's max jump arc | `floors` gaps + `platforms` x/w/y in level data; player jump constants stay LOCKED (don't retune the feel) |
| **Vertical complexity** | mostly flat, few hops | stacked ledges, height variety | `platforms` y-values |
| **Hazard density** | 1–3 spikes, generous checkpoints before each | more spikes, still-generous checkpoints | `spikes` + `checkpoints` arrays (keep the "checkpoint before every hazard" ADHD rule) |
| **Math mechanic richness** | end-of-stage gate only | doors + collect + multiple gates + a dragon | which tagged challenge entities the level data includes |
| **Tables per level (the cleanest lever)** | `allowedTables: [1,2,3,4,5]` (confidence) | `allowedTables: [6,7,8,9]` (the weak spot) | `brain.calculateWeights(allowedTables)` ALREADY supports this; today it's called with `undefined` (all tables). Pass a per-level/per-gate set. The 6–9 *weighting within the pool* stays locked. |

**Crucial ADHD guard on the curve:** harder = *more interesting platforming and harder tables*, NEVER more punishment (no shrinking respawn generosity, no timers, no contact damage). The respawn stays gentle at every difficulty. Keep checkpoints before every hazard even in level 5.

**Note on `allowedTables` + 6–9 lock:** restricting a level to `[1,2,3,4,5]` does *not* violate the "6–9 weighted brain is locked" constraint — the *weighting algorithm* (the exponents, struggle boost, easy-table 0.3 factor) is untouched; we only restrict the *pool* it weights over, which is the brain's already-built, already-validated `allowedTables` feature. Confirm with the user that early-level easy pools are desired (they aid confidence per the "mix in easier ones" Core Value), since the default end-game brain plays all 9.

---

## Feature Dependencies

```
brain.js (UNCHANGED, provides question + 4 choices + allowedTables pool)
    └──feeds──> Generalized in-world math challenge (extends mathGate.js)
                   ├──skins as──> (a) Locked door/key
                   ├──skins as──> (d) Defeat-enemy (👺💀🐉)   [== door + enemy art]
                   ├──repeats as─> (c) Multiple checkpoint gates  [+ per-gate run-state]
                   └──reuses for─> (b) Collect-the-answer  [choices rendered in world-space]

level.js (one LEVEL → LEVELS array; carries tagged challenge entities + allowedTables)
    └──requires──> Generalized challenge (to give the tagged entities behavior)
    └──feeds──> Level-select scene (reads which levels exist)

progress.js (extend save blob with per-level completion; reuse validate() guard)
    └──required by──> Level-select scene (locked/unlocked/completed states + resume)
    └──required by──> Per-level unlock persistence

Level-select scene
    └──requires──> per-level persistence + LEVELS array
    └──enhanced by──> title screen, parallax, path art (presentation)

Difficulty curve ──drives──> level.js data (length/gaps/hazards) + allowedTables per level/gate

Art pass (animated player, tileset, parallax, title) ──enhances──> everything, depends on nothing mechanical
```

### Dependency Notes

- **All four mechanics require the generalized challenge first.** Build `openMathChallenge` (extending `mathGate.js`) before any mechanic. Door (a) is the natural co-delivery with the abstraction.
- **(a) and (d) share one implementation** — d is a re-art of a. Sequencing them adjacently is cheap.
- **(c) requires per-gate run-state** that (a)/(d) don't (cleared-set + respawn-past-a-gate must not re-lock). Build it after the abstraction is hardened on a/d.
- **(b) is the odd one out** — it renders choices in the world, so it needs new entity-spawning from `q.choices` and a "wrong pickup is harmless and not consumed" rule. Independent of c.
- **Level-select requires per-level persistence** (`progress.js` extension) AND the `LEVELS` array. Persistence and the level array can be built in parallel; the select scene needs both.
- **Persistence change requires a `CONFIG.SAVE.VERSION` bump.** `loadSave()` returns defaults on mismatch (no migration, by design) — so existing XP/level on her machine will reset on the bump. **Flag for the user / roadmap:** either accept the reset (clean, matches the "no migration" decision) or add a one-time additive migration that preserves xp/level/accuracy/history while defaulting the new `levels` field. Recommend the additive in-place approach since her real progress lives in xp/level/accuracy.
- **Art pass conflicts with nothing** — it's pure presentation and can be sequenced first (so later levels are authored against final art) or last (polish). Sourcing CC0 dark/grunge sprites early is low-risk and de-risks the "looks like a game" goal.

---

## MVP Definition (for this milestone)

### Launch With (v4.0 core)

- [ ] **LEVELS array + 3 hand-built levels** — the headline content; without it nothing else matters.
- [ ] **Generalized in-world math challenge** (extends `mathGate.js`) — the substrate for every mid-game mechanic.
- [ ] **Locked door/key mechanic (a)** — proves the abstraction; first mid-game math beat.
- [ ] **Level-select scene with locked/unlocked/completed states + resume** — the progression hub.
- [ ] **Per-level completion/unlock persistence** (extend `progress.js`, reuse `validate()`).
- [ ] **Difficulty curve** via `allowedTables` per level + length/gap/hazard tuning.
- [ ] **Art pass: animated player + real tileset** — minimum to clear the "early-MVP art" flag.

### Add After Core Works (same milestone, later phases)

- [ ] **Defeat-enemy (d)** — cheap once (a) exists; high emotional payoff (dragon beat).
- [ ] **Multiple checkpoint gates (c)** — once per-gate state is understood.
- [ ] **Collect-the-answer (b)** — the most distinct; build when the abstraction is stable.
- [ ] **Title screen + parallax/background + map path art** — presentation polish.
- [ ] **Stars / tiered completion** — additive-only; richer progression once binary completion works.
- [ ] **4th–5th levels** — scale content once the systems are proven on 3.

### Future / Out of This Milestone

- [ ] **Audio/SFX/music** — explicitly deferred (AUDIO-01).
- [ ] **Anything in the Anti-Features table** — never.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 3 hand-built levels (LEVELS array) | HIGH | MEDIUM | P1 |
| Generalized math challenge (extend mathGate) | HIGH | MEDIUM | P1 |
| Locked door/key (a) | HIGH | LOW–MEDIUM | P1 |
| Level-select scene (locked/unlocked/completed/resume) | HIGH | MEDIUM | P1 |
| Per-level persistence | HIGH | LOW–MEDIUM | P1 |
| Difficulty curve (allowedTables + tuning) | HIGH | MEDIUM | P1 |
| Art pass (animated player + tileset) | HIGH | MEDIUM–HIGH | P1 |
| Defeat-enemy (d) 👺💀🐉 | HIGH | MEDIUM (LOW after a) | P2 |
| Multiple checkpoint gates (c) | MEDIUM | MEDIUM | P2 |
| Collect-the-answer (b) | MEDIUM | MEDIUM | P2 |
| Title screen | MEDIUM | LOW–MEDIUM | P2 |
| Parallax / background | MEDIUM | MEDIUM | P2 |
| Stars / tiered completion | MEDIUM | MEDIUM | P3 |
| 4th–5th levels | MEDIUM | LOW (after 3 work) | P3 |
| World-map path art / per-level table labels | LOW–MEDIUM | LOW–MEDIUM | P3 |

**Priority key:** P1 = must-have for the milestone to be "Content & Challenge" · P2 = should-have, the variety/payoff layer · P3 = polish/scale once the spine holds.

---

## Existing-Module Dependency Map (for the roadmapper)

| New feature | `brain.js` | `mathGate.js` | `progress.js` | `level.js` | `game.js` scene | `main.js` | `config.js` | `fx.js` |
|-------------|-----------|---------------|---------------|------------|-----------------|-----------|-------------|---------|
| LEVELS array | — | — | — | **extend** (array + per-level `allowedTables`) | reads `levelId` from payload | — | per-level extents | — |
| Generalized challenge | reuse (unchanged) | **extend** (layout + onCorrect dissolve) | — | — | calls it | — | new GATE layout consts | reuse bursts |
| Door/key (a) | reuse | reuse generalized | reuse addXp seam | **add tagged entity** | add `onCollide("door")` + dissolve | — | door size consts | reuse |
| Defeat-enemy (d) | reuse | reuse generalized | reuse addXp seam | **add enemy entity** | add `onCollide("enemy")` + dissolve | load enemy sprites | enemy consts | defeat burst |
| Multiple gates (c) | reuse (per-gate `allowedTables`) | reuse generalized | reuse addXp seam | **add gate entities** | **per-gate cleared-set** (generalize `goalReached`) | — | — | reuse |
| Collect-the-answer (b) | reuse (question + choices) | reuse correctness check | reuse addXp seam | **author choice placements** | spawn choice entities from `q.choices` | — | pickup consts | reuse |
| Level-select scene | — | — | **read per-level state** | reads LEVELS | new `scene("select")`; `go("select")` on clear | **boot `select`** | map consts | — |
| Per-level persistence | — | — | **extend blob + `validate()`; bump SAVE.VERSION** | — | persist on clear (existing seam) | — | `SAVE.VERSION` | — |
| Difficulty curve | reuse `allowedTables` | — | — | **per-level knobs** | pass `allowedTables` to challenge | — | per-level tuning | — |
| Art pass | — | (re-skin panel) | — | tileset wiring | — | **loadSprite anims** (proven coin pattern) | frame consts | — |
| Title screen | — | — | — | — | new `scene("title")` | boot `title` | — | — |

**Firewall reminders that MUST survive v4.0** (from the module headers): `brain.js` imports NOTHING from the engine (one-way; gate consumes brain, never reverse). `progress.js` keeps localStorage behind the guarded seam, never in the pure factory. The `mathGate` anti-leak discipline (cancel global key controllers on close; tag-destroy on teardown; keys 1–4 reserved while open) MUST extend to every new challenge instance — with multiple gates/doors, only ONE challenge may be open at a time, or the 1–4 key controllers collide.

---

## Competitor / Reference Feature Analysis

| Feature | School reference game (Mario-style math platformer) | Canonical kid platformers (external sources) | Our v4.0 approach |
|---------|-----------------------------------------------------|----------------------------------------------|-------------------|
| Math integration | Question at end of each stage | n/a (math-specific) | End-of-stage gate (shipped) + four mid-game mechanics woven through levels |
| Progression | Stage-by-stage, stores progress in browser cache | Linear unlock, world map, locked/unlocked/current states, stars | Linear unlock + map + completion marks (stars as P3) |
| Difficulty | Stages get harder | Length/gap/hazard ramps; some unlock next-world-early to avoid hard-stops | Length/gap/hazard + `allowedTables` ramp; keep respawn gentle |
| Failure | (forgiving, browser-cached) | Lives/game-over common | NONE — gentle respawn, no lives, no game-over (ADHD-locked) |
| Wrong answer | (her school game is the comfortable reference) | n/a | Penalty-free re-ask, same question (shipped contract) |
| Art | Mario-style | Themed tilesets, parallax, path-art maps | Dark grunge, no pink, CC0 sprites, animated player + parallax |

---

## Confidence & Open Questions

**Confidence: HIGH.** The architectural claims (what reuses vs extends) are read directly from the shipped v3.0 source (`mathGate.js`, `brain.js`, `progress.js`, `level.js`, `game.js`, `main.js`), and the platformer/edu-game pattern claims are cross-checked against external sources. The single highest-leverage recommendation — one generalized challenge for all four mechanics — falls straight out of `mathGate.js`'s current shape.

**Open questions for requirements/discuss (decisions, not research gaps):**
- **SAVE.VERSION bump policy:** accept a clean reset of existing XP/level on her machine (matches the "no migration" decision) vs add an additive migration that preserves xp/level/accuracy/history. *Recommend additive.*
- **Easy-table early levels:** confirm `allowedTables: [1..5]` for level 1 is wanted (Core Value says mix in easier ones for confidence) vs always playing all 9 with 6–9 weighting. *Recommend easy-pool early levels, ramping to 6–9 deep in.*
- **Stars criteria:** if stars ship, confirm the third criterion is something non-punishing (e.g. all-coins) — never "no respawns" framed as failure.
- **How many of the four mechanics are P1 vs P2:** milestone wants all four; recommend door (a) as P1 and the rest P2, sequenced after the abstraction is proven.

## Sources

- Existing v3.0 source (HIGH — read directly): `src/ui/mathGate.js`, `src/math/brain.js`, `src/progress.js`, `src/level.js`, `src/scenes/game.js`, `src/main.js`
- `.planning/PROJECT.md`, `.planning/MILESTONES.md` (project context, locked constraints, deferred items)
- [Game UI Database — Level Select: World Map](https://www.gameuidatabase.com/index.php?scrn=6) (HIGH — canonical level-select/world-map patterns)
- [Dave's Compendium of Level Select Screens](http://www.davetech.co.uk/gamedevlevelselect) (MEDIUM — locked/unlocked/current visual states, path art)
- [Polishing a Level Select screen — Game Developer](https://www.gamedeveloper.com/art/polishing-a-level-select-screen-process-and-implementation) (MEDIUM — progression feedback, unlock UI)
- [The Art of Platformer Level Design — iD Tech](https://www.idtech.com/blog/platformer-level-design-made-simple) (MEDIUM — difficulty curve, gap/precision knobs)
- [What Makes a Math Game Truly ADHD-Friendly — Monster Math](https://www.monstermath.app/blog/what-makes-a-math-game-truly-adhd-friendly-parents-checklist) (MEDIUM — no timers, forgiving, low cognitive load, adaptive difficulty)
- [4 Math Activities for Kids with ADHD — ADDitude](https://www.additudemag.com/do-the-math/) (MEDIUM — ADHD-safe practice framing)

---
*Feature research for: kid educational math platformer — v4.0 Content & Challenge milestone*
*Researched: 2026-06-28*
