# Codebase Architecture — Nox Run

## Module map (verified against the live tree 2026-07-07)

| Module | Role |
|--------|------|
| `src/index.html` | entry shell (file:// guard, flex-centers the canvas) |
| `src/main.js` | `kaplay()` init, 1.5× display scale, sprite loads, scene registry, `go("title")` |
| `src/config.js` | ALL tunables (movement, camera, palette roles, HUD, FX, SAVE key…) |
| `src/player.js` | player factory (coyote/buffer/variable-height jump) |
| `src/camera.js` | clamped frame-rate-independent follow |
| `src/parallax.js` | camera-driven background layers |
| `src/fx.js` | juice (squash/dust/pop/burst) — self-cleaning tweens |
| `src/progress.js` | guarded save/load/reset + XP/level tracker (`createProgress`) |
| `src/math/brain.js` | LOCKED question selection (6–9 weighting, EWMA accuracy) |
| `src/levels/index.js` | ordered registry + derived unlock (node-importable, pure) |
| `src/levels/build.js` | the ONE descriptor→entities builder (+ `?debug=1` overlay) |
| `src/levels/level-0N.js` | 8 pure-data level descriptors |
| `src/scenes/title.js` | wordmark + start + Reset Progress (R, Y/N confirm) |
| `src/scenes/select.js` | 2×4 level grid, row-aware keyboard cursor |
| `src/scenes/game.js` | the run: build level, wire mechanics, respawn, save on clear/hide |
| `src/mechanics/*.js` | door, gates (checkpoint math gates), enemy, collect, secretAlcove |
| `src/ui/challenge.js` | shared math-challenge panel (the one challenge seam) |
| `src/ui/mathGate.js` | end-of-level gate → LEVEL CLEAR |
| `src/ui/hud.js` | level badge + XP bar + level-up flash |

## Data flow

- **Boot:** `main.js` inits Kaplay → registers title/select/game scenes → `go("title")`.
- **Level entry:** select passes `{ levelId }` via `go()` payload → `game.js` loads the descriptor from the registry → `buildLevel()` emits tagged entities → mechanics modules wire `player.onCollide` handlers against tags.
- **Math seam:** every mechanic routes through the ONE shared challenge panel (`src/ui/challenge.js`) with the scene's closure-local brain; the secret alcove is the sole exception (wired with `progress`, never opens a challenge).
- **Persistence:** save writes happen on level-clear and tab-hide only (no timer autosave); unlock is derived from cleared facts at read time, never stored.

## Planning layer

- Planning state lives in `.planning/` (GSD): `STATE.md` = current position, `ROADMAP.md` = phase plan, `PROJECT.md` = product definition.
- Milestone history is archived under `.planning/milestones/`; per-milestone research under `.planning/research/` (milestone-scoped — not a current-state stack description).
