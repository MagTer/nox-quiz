# Phase 11: Progression & Persistence - Context

**Gathered:** 2026-06-26
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — all four grey areas accepted as recommended

<domain>
## Phase Boundary

Her play accumulates. Correct answers at the math gate earn XP and level her up using
the proven v1/v2 curve; XP, level, and per-table practice history persist in the browser
(versioned localStorage) and survive tab close; returning to the URL resumes progression
and keeps question selection adapted to her weak spots. XP/level are visible in-game and a
level-up shows a distinct moment.

In scope: a pure `src/progress.js` (XP/level math + localStorage), extending the gate's
`onClear` to award XP by table difficulty, persisting + restoring per-table accuracy to
resume weak-spot adaptation, a fixed Kaplay HUD (`src/ui/hud.js`) with a level-up moment,
and seeding `createBrain({ seedAccuracy })` on boot.

Out of scope (deferred): heavy juice/polish, contrast audit, full UAT (Phase 12); multi-level
progression; the archive's HP/combat. No migration from the school game's save.
</domain>

<decisions>
## Implementation Decisions

### XP & Level Model (port v1/v2)
- Port the v1/v2 curve VERBATIM (already validated, do not re-tune): XP_EASY=10, XP_HARD=20, BASE_XP=200, LEVEL_MULT=1.3; level threshold = round(BASE_XP · LEVEL_MULT^(level-1)); calculateXp(table) = HARD_TABLES(6–9) ? 20 : 10. (Archive: CONFIG ~604-608, XpCalculator ~648-654.)
- New PURE module `src/progress.js` exposing a `createProgress()` factory: XP/level math + localStorage, ZERO Kaplay imports (engine-agnostic; localStorage is a browser global, not a game-engine dependency).
- XP is awarded on the gate's CORRECT answer: extend the gate→scene `onClear` to pass the cleared question's `table` so the scene calls `progress.addXp(table)` → `calculateXp(table)`. (Wrong answers are forgiving/retry — no XP, no penalty.)
- Per-table practice history (the brain's EWMA accuracy per table) is persisted so weak-spot adaptation survives between visits.

### Persistence (localStorage)
- NEW versioned key for this game, e.g. `mathlab_platformer_v1`, with a `version` field for future migration (independent of the school game's `mathlab_save_v2`).
- NO migration from the school game's save — fresh, independent platformer progression.
- Persist ONLY: XP, level, per-table accuracy/history. Never session/run state (current position, coins-this-run, etc.).
- Save after each gate clear (XP/accuracy change) AND on `visibilitychange`; wrap writes in try-catch and warn (don't crash) on quota-exceeded / disabled storage (per the project's persistence pattern).

### HUD & Level-Up Moment
- Always-visible FIXED Kaplay HUD: a level badge + a simple XP fill bar toward the next-level threshold (dark grunge, no pink).
- A distinct level-up moment: a brief celebratory flash/banner when XP crosses a level threshold (port the archive's level-up flash feel).
- New module `src/ui/hud.js` (Kaplay) that READS from the pure progress module — the engine-side consumer.
- Simple fill bar + "Level N" for this phase; segmented/heavier polish deferred to Phase 12.

### Integration & Resume
- Wiring: gate correct → `onClear({ table })` → `progress.addXp(table)` → HUD update (+ level-up moment if threshold crossed) → persist.
- On boot/game start: load saved XP/level and seed the brain's accuracy from saved per-table history; the HUD reflects the loaded state immediately.
- Resume adaptation: extend the brain factory to `createBrain({ seedAccuracy })` so persisted per-table accuracy resumes the weak-spot weighting (the brain stays pure — the loader injects saved accuracy; the brain does not read storage itself).
- Firewall: `src/progress.js` owns XP/level math AND localStorage (engine-agnostic, headlessly testable); `src/ui/hud.js` is the only Kaplay consumer of progress. Keep the brain's firewall intact (it never imports storage or Kaplay).

### Claude's Discretion
- Exact `createProgress()` / `progress.addXp` / persistence API shapes and the saved-JSON schema (with a `version` field).
- HUD layout/positioning specifics within dark-grunge / no-pink.
- The exact seedAccuracy shape passed into createBrain().

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `archive/math-lab.html` — the v1/v2 progression: CONFIG (XP_EASY/HARD, BASE_XP, LEVEL_MULT ~604-608), XpCalculator (getLevelThreshold/calculateXp ~648-654), PlayerState.toJSON/fromJSON (~713-720), the localStorage save/load + versioned-key migration (~757-897), and the level-up flash keyframe (~266-274). Port the XP/level/persistence parts; DROP HP/combat/dungeon.
- `src/math/brain.js` — pure brain with `createBrain()` and `reportResult(table, isCorrect)` updating in-memory EWMA accuracy. Phase 11 extends it to accept `createBrain({ seedAccuracy })` and to expose its per-table accuracy for persistence (keeping it pure — no storage/Kaplay imports).
- `src/scenes/game.js` — the `onClear` hook (lines ~144-150, currently sets `levelCleared`). Extend the gate→onClear contract to carry the cleared question's table, and call into progress + HUD here.
- `src/ui/mathGate.js` — `openMathGate({ brain, onClear })`; onClear is called once on correct. Extend so onClear receives the cleared table (the gate already knows the current question's `a`).
- `src/config.js` — central constants; add CONFIG.PROGRESS (XP/level tuning) + CONFIG.SAVE (key, version) + CONFIG.HUD namespaces.

### Established Patterns
- Vanilla ES modules; `import "../lib/kaplay.mjs"`; Kaplay UI via fixed()/z()/text()/rect(); canvas text, never DOM innerHTML.
- Scene-closure state discipline; pure modules (brain) carry no module-level mutable run state and no engine imports.
- Persistence pattern (per CLAUDE.md): synchronous localStorage + JSON, versioned key for migrations, try-catch on quota, `visibilitychange` save.

### Integration Points
- `src/scenes/game.js` → `src/progress.js` (addXp on clear; load on boot) and → `src/ui/hud.js` (render + update + level-up moment).
- boot/`src/main.js` or scene start → load progress + seed `createBrain({ seedAccuracy })`.
- `src/ui/hud.js` → reads `src/progress.js` state only (one-way).

</code_context>

<specifics>
## Specific Ideas

- "Just like her school game" — the XP bar + level badge + level-up moment should feel familiar; the curve is the exact validated v1/v2 curve.
- Returning to the URL must resume XP/level AND the weak-spot adaptation (persisted per-table accuracy), so practice stays targeted across visits.
- Forgiving mandate continues: wrong answers never lose XP/progress.

</specifics>

<deferred>
## Deferred Ideas

- Heavy juice/polish, discoverable controls, contrast audit, full UAT — Phase 12.
- Segmented/animated XP bar styling beyond a simple fill — Phase 12.
- Multi-level progression; HP/combat/potions from the archive — out of milestone scope.
- Migration/import of the school game's localStorage save — explicitly not done.

</deferred>
