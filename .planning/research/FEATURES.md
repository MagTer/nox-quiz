# Feature Research

**Domain:** Kid-friendly 2D platformer (Mario-style) with an end-of-stage math gate — built in Kaplay, keyboard control
**Researched:** 2026-06-22
**Confidence:** HIGH for platformer conventions (decades-stable, cross-verified); MEDIUM for ADHD-framing specifics (principles established, individual response varies — verify in UAT)

> **Scope reminder (v3.0 milestone):** ONE great, polished level + the end-of-stage math gate. The "math brain" (weighted 6–9 multiple-choice selection) is already built and ported — NOT re-researched here. Richer math mechanics (locked doors, collect-the-answer, defeat-the-enemy) are explicitly LATER milestones and appear only in the deferred section.

## What a 12-Year-Old Recognizes as "A Real Game"

She has a mental model from Super Mario and her school's Mario-style math platformer. For ONE level to read as a real game (not a tech demo), it must have: a controllable avatar that **runs and jumps with weight**, **platforms and gaps to clear**, a **camera that follows her**, a **visible goal** to reach, at least one **collectible** (coins) and one **simple hazard**, and **gentle respawn** when she misses. The math gate then fires at the goal. Everything below is sorted against that bar.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these makes it feel like a prototype, not "the game she wants." All are this-milestone.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Run left/right (Arrow/A-D) with acceleration + friction | Instant-snap movement feels robotic; ramp-up reads as "Mario" | LOW | Kaplay `body()` + manual horizontal velocity with accel/decel; not just position teleport |
| Jump with gravity and weight (Space/Up) | The core verb of a platformer | LOW | Kaplay `body().jump()` + `setGravity()`; tune gravity & jump force together for a satisfying arc |
| **Variable jump height** (hold = higher, tap = small hop) | Mario does this; flat jumps feel cheap | LOW–MED | Cut upward velocity when jump key released early; biggest single "feel" lever after gravity tuning |
| **Coyote time** (~80–120ms grace after leaving a ledge) | Players blame the game for "missed" edge jumps without it | MEDIUM | NOT built into Kaplay `body()` — add a timer that keeps `canJump` true briefly after `isGrounded()` goes false |
| **Jump buffering** (~100–150ms; press just before landing still jumps) | Eliminates the "I pressed jump and nothing happened" frustration | MEDIUM | NOT in Kaplay — remember last jump-press time; on `onGround()` fire jump if within window |
| Solid platforms + ground collision | Can't have a platformer without standing on things | LOW | Kaplay `body({ isStatic: true })` + `area()`; engine handles resolution |
| Gaps / pits to jump over | A flat floor isn't a level; gaps create the challenge | LOW | Gentle version: fall into pit → respawn at checkpoint (see anti-features re: instant-death) |
| Camera follows player | Without it the level can't be bigger than one screen | LOW | Kaplay `setCamPos()`/`camPos()` lerped toward player each frame; clamp to level bounds |
| Visible goal (flag / door / portal at level end) | She needs to see what she's running toward | LOW | Reaching it triggers the math gate; should be obvious and rewarding-looking |
| Collectible coins | "Real game" signal; gives optional sub-goals along the path | LOW | `area()` + `onCollide` → despawn coin, increment a counter; pure dopamine, no penalty for missing |
| At least one simple hazard or enemy | Stakes make the platforming matter | MEDIUM | One patrolling enemy OR spikes. Contact → gentle respawn, NOT death-screen. Keep it ONE type for this level |
| Gentle death/respawn | She must never feel punished (ADHD; no-pressure mandate) | MEDIUM | Respawn at last checkpoint/level start; no lives lost, no XP lost, no scolding. Quick fade, back in |
| Checkpoint(s) mid-level | A long level with one respawn point = rage-quit risk | LOW–MED | One or two invisible/visible checkpoints; respawn moves forward as she progresses |
| Math gate at level end (using ported math brain) | The whole point — math is the gate to clearing the stage | MEDIUM | See "Math Gate Integration" below — must feel diegetic, not a quiz popup |
| Pause that suspends physics cleanly | The math gate is a pause; movement must freeze and resume correctly | LOW | Kaplay scene/flag to halt update of player + enemies; resume in place on correct answer |

### Differentiators (Competitive Advantage)

Not required for the level to "work," but they're what make HER open it again. Align with Core Value ("she opens it because she *wants* to"). Mostly this-milestone-if-cheap, some deferred.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dark/grunge pixel-art styling (no pink) | The whole emotional hook — feels cool/edgy, not a baby math app | MEDIUM | This-milestone. CC0 packs (Kenney/itch) recolored to dark palette; sets it apart from school's generic version |
| Tactile jump/land feel (squash, dust puff, landing thud) | "Juice" is what makes movement *fun* to repeat | MEDIUM | This-milestone if time allows. Simple sprite squash + particle; high feel-per-effort |
| Coin pickup pop (scale-up + fade) | Cheap reward signal that makes collecting moreish | LOW | This-milestone-if-cheap |
| Math gate framed in-world (a guardian/gate/rune that "unlocks") | Turns the quiz into part of the story, not an interruption | MEDIUM | This-milestone — the key differentiator vs a popup. Reuse v2 art (👺💀🐉 lineage) as the gatekeeper |
| Forgiving math feedback (wrong answer = "try again," never fail-out) | ADHD-safe; keeps her in flow, no shame | LOW | This-milestone. On wrong: gentle shake/redo, re-ask (math brain re-weights); correct → gate opens |
| Celebratory level-clear moment | The payoff that makes the whole loop satisfying | LOW–MED | This-milestone-if-cheap. Gate opens, brief celebration, "stage clear." No score grading |
| Double jump | Extra movement expressiveness, fun to master | LOW | DEFERRED — Kaplay has `doubleJump()` component but adds level-design complexity; keep ONE level simple |
| Multiple worlds / themed levels | Replay variety | HIGH | DEFERRED (explicitly later milestone) |
| Audio (jump SFX, music) | Huge for game feel | MEDIUM | DEFERRED (PROJECT.md lists audio as later) — but flag: silence noticeably weakens "real game" feel |
| Richer math mechanics (locked doors, collect-the-answer, defeat-the-enemy) | Deeper math/play integration | HIGH | DEFERRED — explicit later-milestone roadmap; do not scope now |
| XP/leveling/persistence migration from v2 | Long-term progression hook | MEDIUM | DEFERRED — PROJECT.md lists persistence migration as later |

### Anti-Features (Commonly Requested, Often Problematic)

These are platformer staples that are actively WRONG for this user (ADHD, no-pressure, no-shame mandate). Document them so they don't sneak in as "it's a platformer, of course it has lives."

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Lives counter / game over | "Mario has lives" | Running out = hard stop + restart-from-zero = punishment loop; pure stress for ADHD profile | Infinite retries; respawn at checkpoint, progress intact |
| Any countdown timer (level timer, math timer) | "Adds urgency" | Direct violation of the no-pressure mandate; timer pressure is the documented enemy here | No timers anywhere; she controls the pace fully |
| Score / grade / accuracy % shown as judgment | "Track performance" | Score-shaming and comparison spiral; turns play into evaluation | Coins as fun-only counter (no scolding); never show a math grade or accuracy % |
| Instant-death bottomless pits with no respawn | Classic platformer hazard | Loss-of-progress + "you failed" framing; rage-quit risk | Pits respawn gently at checkpoint; falling costs nothing but a few seconds |
| Fail-out on wrong math answer | "Make the gate meaningful" | A wrong answer ejecting her from the level = shame + lost platforming progress | Wrong answer = gentle "try again," re-ask (math brain re-weights); gate stays, no penalty |
| Leaderboards / social comparison | "Competition is motivating" | Explicit PROJECT.md out-of-scope; shame spiral risk; solo practice only | None — solo, private, self-paced |
| Punishing precision platforming (pixel-perfect jumps, knockback into pits) | "Skill ceiling" | Frustration > fun for the target; defeats "wants to play" goal | Generous platform sizes, forgiving gaps, coyote time + jump buffering |
| Enemy that does damage/knockback with a health bar | v2 had combat | Reintroduces the quiz-combat model the pivot is moving away from for THIS level | One simple "touch = gentle respawn" hazard; combat is a deferred mechanic |
| Hard-mode difficulty toggle | "Replay value" | Adds UI + balancing burden; not the point of ONE polished level | Tune the single level to be reliably clearable and satisfying |

## Math Gate Integration (Concrete Behavior)

The gate is the milestone's signature moment. It must feel like *part of the world*, not an alert box. Concrete recommended behavior:

1. **Trigger:** Player reaches the goal (a guardian/gate/rune at level end), not a random mid-level popup. `area()` + `onCollide`.
2. **Transition in:** Brief diegetic beat — the gate glows / guardian stirs / camera eases in. Physics pauses (player + enemies stop updating). No jarring instant overlay.
3. **Question UI:** Multiple-choice (4 options, ported math brain, weighted 6–9). Styled to the dark/grunge game UI, NOT a browser dialog. **No timer, no countdown bar.** She answers at her own pace; movement keys can map to choice selection so it still feels like the game.
4. **Correct answer:** Gate opens / guardian yields / rune lights. Short celebratory moment → **stage clear**. This is the dopamine payoff.
5. **Wrong answer:** Gentle, non-punishing — small shake or "not quite," the gate stays closed, re-ask (math brain re-weights toward what she missed). **Never** eject her from the level, lose progress, or show a fail screen.
6. **Resume:** On clear, physics resumes / level-complete state. On wrong, she's still standing at the gate, free to try again. She never loses platforming progress or XP for a wrong answer.

**Why this framing:** It converts the unavoidable "stop and do math" moment into a boss-gate / key-to-the-door beat she recognizes from games — the math is *the obstacle in the world*, matching her school game's model, instead of a quiz interrupting a game.

## Feature Dependencies

```
Run + Jump + Gravity (Kaplay body)
    └──requires──> Platform/ground collision (static body + area)
                       └──enables──> Gaps, hazards, coins, goal placement

Camera follow (setCamPos)
    └──requires──> Player exists with pos
    └──enables──> Level larger than one screen

Variable jump height ──enhances──> Jump
Coyote time         ──enhances──> Jump + ledge/gap edges
Jump buffering      ──enhances──> Jump + landing (onGround)

Gentle respawn
    └──requires──> Checkpoint(s) + a "respawn" position
    └──conflicts──> Lives counter / game over (incompatible philosophies)

Math gate
    └──requires──> Goal trigger (area+onCollide) + ported math brain + clean pause
    └──conflicts──> Any timer; fail-out-on-wrong

Pause (suspend physics)
    └──required-by──> Math gate (clean freeze/resume)
```

### Dependency Notes

- **Collision is the spine:** gaps, coins, hazards, and the goal are all just `area()` interactions on top of `body()` movement — build movement + collision first, then everything decorates it.
- **Coyote time / jump buffering are NOT free in Kaplay:** `body()` gives `jump()`/`isGrounded()`/`onGround()` but the grace windows must be hand-coded with timers. Budget for them as their own small task — they're the difference between "feels like Mario" and "feels stiff."
- **Math gate depends on a clean pause:** if physics keeps running under the question UI, enemies drift / player slides. Implement a deliberate pause (scene swap or update-gate flag) before wiring the gate.
- **Gentle respawn conflicts with lives:** these encode opposite philosophies; pick respawn-with-progress-intact and never add lives.

## MVP Definition

### Launch With (v3.0 — this milestone)

ONE polished level that reads as a real game + the math gate.

- [ ] Run left/right with accel/friction — core verb
- [ ] Jump + gravity tuned for a satisfying arc — core verb
- [ ] Variable jump height — biggest feel lever after gravity
- [ ] Coyote time + jump buffering — forgiveness that makes it feel responsive (and ADHD-kind)
- [ ] Solid platforms, ground, and gaps — the level itself
- [ ] Camera follows player, clamped to level bounds — makes the level bigger than a screen
- [ ] Coins (collect, pop, count — no penalty) — "real game" signal + sub-goals
- [ ] One simple hazard/enemy → gentle respawn on contact — stakes without punishment
- [ ] Checkpoint(s) + gentle respawn (no lives, no XP loss) — ADHD-safe failure
- [ ] Visible goal at level end → triggers math gate
- [ ] Math gate: paused, in-world framed, 4-choice (ported brain, 6–9 weighted), NO timer, forgiving on wrong, celebratory on clear
- [ ] Dark/grunge pixel-art styling, no pink (CC0 assets recolored)

### Add After Validation (next milestone)

- [ ] Audio (jump/land/coin SFX, ambient music) — trigger: core loop feels good but flat without sound
- [ ] Double jump — trigger: she wants more movement expression
- [ ] A second/third level + simple level select — trigger: she replays and wants more
- [ ] XP/leveling/persistence migration from v2 — trigger: long-term retention hook needed

### Future Consideration (v4+)

- [ ] Richer math mechanics: locked doors, collect-the-answer, defeat-the-enemy (reuse 👺💀🐉) — defer: each is a level-design system on its own; prove the end-gate first
- [ ] Multiple themed worlds — defer: content scaling, not core-loop validation
- [ ] Moving platforms, one-way platforms (Kaplay `platformEffector()`) — defer: nice level-design spice once the base loop is locked

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Run + jump + gravity (tuned) | HIGH | LOW | P1 |
| Variable jump height | HIGH | LOW | P1 |
| Coyote time + jump buffering | HIGH | MEDIUM | P1 |
| Platforms / ground / gaps | HIGH | LOW | P1 |
| Camera follow | HIGH | LOW | P1 |
| Goal → math gate trigger + clean pause | HIGH | MEDIUM | P1 |
| Math gate UI (ported brain, no timer, forgiving) | HIGH | MEDIUM | P1 |
| Gentle respawn + checkpoint | HIGH | MEDIUM | P1 |
| Dark/grunge pixel-art styling | HIGH | MEDIUM | P1 |
| Coins (collect + pop) | MEDIUM | LOW | P2 |
| One simple hazard/enemy | MEDIUM | MEDIUM | P2 |
| In-world gate framing (guardian) | HIGH | MEDIUM | P2 |
| Jump/land juice (squash, dust) | MEDIUM | MEDIUM | P2 |
| Celebratory level-clear | MEDIUM | LOW | P2 |
| Audio | HIGH | MEDIUM | P3 (deferred) |
| Double jump | LOW | LOW | P3 (deferred) |
| Richer math mechanics | HIGH | HIGH | P3 (deferred) |

**Priority key:** P1 = must have for this level to feel real + gate to work · P2 = strong polish, add within milestone if time · P3 = explicitly deferred to later milestones.

## Competitor Feature Analysis

| Feature | Her school's Mario-math platformer | Classic Super Mario | Our Approach |
|---------|-----------------------------------|----------------------|--------------|
| Movement feel | Functional, generic | Gold standard (coyote/buffer/variable jump) | Match Mario's forgiveness; exceed school version on feel |
| Math integration | End-of-stage questions (the model) | N/A | Same model — end-of-stage gate, but framed diegetically |
| Failure handling | Often lives/restart | Lives + game over | NO lives/game over — gentle respawn, progress intact (ADHD) |
| Timers | Sometimes timed | Level timer | NO timers at all |
| Aesthetic | Generic/childish/often bright | Iconic but bright | Dark grunge, no pink — the emotional differentiator |
| Wrong-answer handling | Often penalizes | N/A | Forgiving re-ask, never eject, never shame |

## Sources

- WebSearch: coyote time / jump buffering / variable jump height — game-feel consensus across Roblox DevForum, Indie Game Academy (Godot), Unity & GameMaker community resources. Mechanics are decades-stable and cross-corroborated → treated HIGH despite raw-search base tier. (Per-claim: HIGH)
- Kaplay docs — Physics guide (`setGravity`, `body`, `area`, `onCollide`, `platformEffector`) and `body()` reference (`jump()`, `isGrounded()`, `onGround()`, `doubleJump()`) + camera (`setCamPos`/`camPos`). Confirms engine provides core physics but NOT coyote/buffer. (context7/official → MEDIUM–HIGH)
- `.planning/PROJECT.md` (v3.0 section) — scope, ADHD/no-pressure mandate, out-of-scope (timers, lives implied, leaderboards, pink), deferred math roadmap. (HIGH — project canon)
- ADHD-friendly low-stress UI principles (no timers, low stimulation, clear forgiving feedback) — established design principles; individual response varies → verify in UAT. (MEDIUM)

---
*Feature research for: kid-friendly 2D platformer (Kaplay) with end-of-stage math gate*
*Researched: 2026-06-22*
