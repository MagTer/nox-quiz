# Phase 10: Math-Gate Integration (Port the Brain) - Context

**Gathered:** 2026-06-25
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — all four grey areas accepted as recommended

<domain>
## Phase Boundary

The milestone keystone. Port the framework-agnostic math brain (6–9-weighted question
selection) from `archive/math-lab.html` into a pure module with ZERO game-engine
dependency, and wire it to the Phase-9 level goal through a single bridge so that
reaching the goal opens an in-world, forgiving, no-timer math gate that clears the
level on a correct answer.

In scope: the pure math brain (weighted selector + 4-choice question generation +
in-memory accuracy weighting), the in-world gate UI (Kaplay-rendered), the single
bridge module (`src/ui/mathGate.js`), and the goal→gate integration via the existing
`onReachGoal()` seam.

Out of scope (deferred): XP / leveling / persistence (Phase 11), polish/juice/UAT
(Phase 12), multi-level progression, HP/combat/potions from the archive.
</domain>

<decisions>
## Implementation Decisions

### Math Brain Port (the firewall)
- Port ONLY the weighted question-selector (6–9 bias) plus in-memory accuracy/struggle weighting from `archive/math-lab.html`. Do NOT port XP, level, HP, combat, or potions — those belong to Phase 11.
- New module `src/math/brain.js` — a pure ES module with ZERO Kaplay imports (GATE-06 clean firewall). Exports a small surface, e.g. `nextQuestion()` (returns `{ a, b, answer, choices[] }`) and `checkAnswer(choice)` / a result reporter.
- 4 multiple-choice answers: 1 correct + 3 distractors. Reuse the archive's distractor logic if present; otherwise generate plausible near-misses (±1 row, off-by-one product) — never trivially-spotted random numbers.
- Brain state is IN-MEMORY only this phase: per-session accuracy weighting works, but localStorage persistence is deferred to Phase 11. State must not leak across game replays.

### Gate Presentation (UI)
- Render the gate IN-WORLD with Kaplay (game font/palette, the avatar visible/dimmed behind the panel) — NOT a DOM/HTML popup.
- `src/ui/mathGate.js` is the ONLY connector between the Kaplay scene and the pure brain (the single bridge named in the success criteria).
- Answer input accepts BOTH keyboard number keys 1–4 AND mouse-click on the answer boxes (kid-friendly).
- Layout: big question expression at the top, four answer boxes below, dark grunge panel overlay; the level is paused and dimmed behind the gate.

### Gate Behavior (forgiving, no-timer)
- Wrong answer is forgiving: mark the wrong choice (shake/flash), KEEP the same question, let her retry — no penalty, no progress lost, the run never ends / no game-over.
- Correct answer: a celebratory moment (flash) + a "LEVEL CLEAR" banner; clears the level. Single level — no next-level wiring this phase.
- NO countdown timer and no time pressure anywhere (GATE-05).
- A single correct answer clears the gate (one question per gate this phase — no streak requirement).

### Integration Seam
- The existing `onReachGoal()` stub in `src/scenes/game.js` calls `openMathGate(...)` in `src/ui/mathGate.js`, replacing the temporary "GOAL!" text.
- Reuse the existing player-freeze to pause the scene/physics while the gate is open; everything resets cleanly on replay (no leaked module/gate state).
- The gate question uses the 6–9-weighted selector (any table possible, biased to 6–9 per GATE-02) — not hardcoded to 6–9 only.
- One-way dependency: the brain knows nothing of Kaplay; the gate pulls question data from the brain and pushes answer results back — never the reverse.

### Claude's Discretion
- Exact function signatures/return shapes of `src/math/brain.js`.
- Visual styling details of the gate panel within the dark-grunge / no-pink mandate.
- Exact celebration/"LEVEL CLEAR" presentation (kept simple here; Phase 12 polishes).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `archive/math-lab.html` (1976 lines) — the v1/v2 brain: `CONFIG` (XP_EASY/HARD, LEVEL_MULT, ACCURACY_ALPHA EWMA=0.15, STRUGGLE_THRESHOLD=0.60 → 1.5× weight boost), `XpCalculator`, and the weighted question selection. Port ONLY the question-selection + accuracy weighting parts.
- `src/scenes/game.js` — the `onReachGoal()` fire-once seam (lines ~112–133): one `onReachGoal` function + one `player.onCollide("goal", onReachGoal)`, guarded by `goalReached`. Currently stubs a canvas `text("GOAL!")` and zeroes velocity + pauses the player. This is the attach point.
- Player-freeze pattern: `player.vel = vec2(0); player.paused = true;` already used in the goal stub.
- `src/config.js` — central constants module (TILE_SIZE, LEVEL_* bounds, etc.); add gate/brain tuning constants here, no magic-number leaks.

### Established Patterns
- Vanilla ES modules, `import "../lib/kaplay.mjs"`; assets via `../assets/...`.
- Kaplay 3001 API: use `loadSprite`/`sprite`/`area`/`onCollide`/`text`/`rect`/`add`; `loadSpriteSheet` does NOT exist. Canvas `text()` for UI, never DOM `innerHTML`.
- Scene-closure state discipline — all run state lives in the scene closure, never module-level `let`.
- NO build step, NO test framework (validate via `node --check` + browser playtest).

### Integration Points
- `src/scenes/game.js` `onReachGoal()` → `src/ui/mathGate.js#openMathGate(...)`.
- `src/ui/mathGate.js` → `src/math/brain.js` (the only place the brain is consumed).
- `src/main.js` may need to preload any gate fonts/assets (reuse existing font/palette).

</code_context>

<specifics>
## Specific Ideas

- "Like the Mario-style game from her school" — math is the gate to progress; the gate must feel in-world, not like a system quiz popup.
- The 6–9 weighting is already validated — port it verbatim; do not re-tune the selection algorithm.
- Forgiving and no-timer are non-negotiable (ADHD-safety mandate): wrong answers re-ask the same question with zero penalty.

</specifics>

<deferred>
## Deferred Ideas

- XP earning, level-up, and localStorage persistence — Phase 11 (SAVE-01).
- Juice/polish, discoverable controls, contrast audit, UAT — Phase 12.
- Multi-level progression / a next level after the goal — out of milestone scope (single polished level).
- HP / combat / potions from the archive brain — not ported.

</deferred>
