# Phase 14: Multi-Scene Shell - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning
**Mode:** smart discuss (autonomous — grey-area tables accepted as recommended)

<domain>
## Phase Boundary

The navigation SHELL of v4.0: three Kaplay scenes — **title → level-select → game** —
wired together so she boots into a dark-grunge title, moves to a level-select that
shows locked/unlocked/cleared state per registered level, and plays any unlocked
level, with clean state on every scene entry (NAV-01..04).

This phase establishes the contracts every later engine-touching phase inherits:
the per-scene factory pattern, the closure/cancel state-hygiene contract (no leaked
handlers/colliders/tweens across scene re-entry), the `go(name, data)` data-payload
seam, and import-safety (a727c13).

In scope: NAV-01 (dark-grunge title → start into the game), NAV-02 (level-select
lists every registered level with locked/unlocked/cleared marks; pick any unlocked
level), NAV-03 (clearing unlocks the next; return to select and resume any unlocked
level, no forced replay), NAV-04 (scene-based navigation with no leaked input
handlers/colliders/tweens/effects on enter→leave→re-enter, verified by a real
browser boot + `scripts/check-import-safety.sh` green).

Out of scope (later phases): the shared challenge seam + mechanics (15/16), additional
authored levels (17), real art/animation/parallax and the FINAL styling of the
title/select screens (18). Phase 14 builds the functional shell with MINIMAL dark
styling only — Phase 18 skins it. Stars/scoring are out of scope entirely.
</domain>

<decisions>
## Implementation Decisions

### Scene Architecture & State Hygiene (NAV-04)
- One factory module per scene: `src/scenes/title.js` and `src/scenes/select.js`
  alongside the existing `src/scenes/game.js`, each exporting a scene callback and
  registered in `main.js` (mirror the existing `scene("game", gameScene)` pattern).
- NAV-04 no-leak contract: ALL input/update/collide handlers are registered INSIDE
  scene bodies so Kaplay tears them down on `go()`; scenes cancel any controllers
  they create; NEVER register input/update at module top level (a727c13 — engine
  globals only inside scene-time function bodies).
- The chosen level reaches the game scene via `go("game", { levelId })` data payload
  — never a module-level variable (the Phase 9/13 anti-leak pattern). The game scene
  already reads its level by id; thread `levelId` through it.
- Verification: extend `scripts/check-import-safety.sh` (must stay green) PLUS a real
  browser boot that enters→leaves→re-enters each screen twice and confirms no leaked
  input handlers, colliders, tweens, or effects (greps passing ≠ boots).

### Title Screen (NAV-01)
- Title shows the game name ("Math Lab") + a one-line "press to start" prompt; minimal
  dark-grunge styling now, real art deferred to Phase 18.
- She advances from the title via EITHER keyboard (Enter/Space) OR a mouse click
  (she plays on a laptop).
- Single entry point → level-select (no separate "Continue" — the select screen itself
  surfaces progress, so a New/Continue split is unnecessary).

### Level-Select Screen (NAV-02 / NAV-03)
- Layout: a row of numbered level tiles in `LEVEL_ORDER` — lists EVERY registered level
  (only `level-01` exists today, but built to grow as Phase 17 adds levels).
- Three visually distinct states per tile: LOCKED (dimmed + lock glyph, not selectable),
  UNLOCKED (bright, selectable), CLEARED (a check/done mark). Exact art is deferred to
  Phase 18, but the three states must be visually distinguishable in this phase.
- Selection/navigation: arrow keys move between UNLOCKED tiles + Enter to play, AND
  mouse click on an unlocked tile; locked tiles are never selectable.
- After clearing a level: return to LEVEL-SELECT (now showing the newly-unlocked next
  level); Escape also returns from a level to select. No forced replay of earlier
  levels and NO auto-advance into the next level — she keeps agency (NAV-03,
  ADHD-friendly, low-pressure).

### Claude's Discretion
- Exact module/file layout and naming under `src/scenes/` and any new select-screen
  UI helper under `src/ui/`; exact tile geometry/spacing/glyphs (within the dark-grunge,
  no-pink, distinguishable-states constraint — UI-SPEC will formalize visuals);
  exact key bindings beyond the accepted Enter/Space/Escape/arrows/click; whether the
  unlock-derivation read uses the registry's `isUnlocked` helper directly.
- A reset-progress affordance is intentionally NOT in this phase (deferred — avoid
  accidental wipes; the v2 clean-reset key already handles a fresh slate).
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main.js` — the boot shell. Currently registers ONE scene (`scene("game",
  gameScene)`) and boots it directly via `go("game", { startX, startY })`. Generalize:
  register title/select/game, then `go("title")` on boot. Asset `loadSprite` calls and
  the canvas/display-scale setup stay here.
- `src/scenes/game.js` — the existing scene factory: owns all run state in its closure
  (anti-leak), seeded via the `go()` data payload, engine globals used only inside the
  body. The template every new scene factory mirrors. Already loads its level by id from
  the Phase 13 registry — thread a `levelId` through its `data` payload and call
  `progress.markCleared` + return-to-select on clear.
- `src/levels/index.js` — `LEVEL_ORDER`, `getLevel(id)`, and the derived `isUnlocked`
  helper (Phase 13) — the select screen's source of truth for locked/unlocked.
- `src/progress.js` — `createProgress(saved)` / `loadSave` / `writeSave` /
  `isLevelCleared(id)` / `markCleared(id)` (Phase 13) — the select screen reads cleared
  state; the game scene persists a clear.
- `src/ui/hud.js`, `src/ui/mathGate.js` — existing in-scene UI helpers; the pattern for
  any new select-screen UI helper.
- `scripts/check-import-safety.sh` — extend to assert the new scene modules keep engine
  globals out of module top level (a727c13).

### Established Patterns
- Per-scene factory callback owning run state in a closure, seeded via `go(name, data)`;
  no module-level run state.
- a727c13: engine globals (add, onKeyPress, onUpdate, onClick, go, ...) only inside
  scene-time function bodies; pure modules (progress, levels, math) stay node-importable.
- Validation for this no-test-framework game: `node --check` + structural greps +
  `check-import-safety.sh` + a MANDATORY real browser boot (greps ≠ boots).

### Integration Points
- main.js boot: `go("game", ...)` → `go("title")`; register all three scenes first.
- title → select → game navigation via `go(...)`; game clear → `markCleared` +
  `writeSave` → `go("select")`.
- select screen ↔ `levels/index.js` (LEVEL_ORDER + isUnlocked) and `progress.js`
  (cleared state) — read on every entry (clean state, no caching across scenes).
</code_context>

<specifics>
## Specific Ideas
- Keep Phase 14 functional and well-guarded; defer real art/styling to Phase 18 (the
  roadmap sequences "title/select to style" into 18). The three select-screen states
  must be visually distinguishable NOW, but final art comes later.
- End the phase with a real browser boot: title → select (shows level-01 unlocked) →
  play → clear → back to select, then enter→leave→re-enter each screen twice with no
  leaks, and `check-import-safety.sh` green.
- ADHD-safe: no timers, no forced replay, no auto-advance; she chooses what to play.
</specifics>

<deferred>
## Deferred Ideas
- Real art/animation, parallax, and FINAL styling of title/select screens (Phase 18).
- A reset-progress affordance on the title (deferred — accidental-wipe risk).
- The shared challenge seam + mechanics + locked-door (Phases 15/16).
- Additional authored levels + platforming difficulty ramp (Phase 17).
- Stars / scoring / completion texture (out of scope, v4.0).
</deferred>
