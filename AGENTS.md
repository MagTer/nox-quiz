# Nox Run — instructions for agents

Read `README.md` first; it is for people. This file is read on every turn.

## Project

**Nox Run** (formerly Math Lab)

A real 2D platformer for a 12-year-old girl, played in the browser with the keyboard — run, jump across platforms, reach the goal — where multiplication is the *gate to progress*, modeled on the Mario-style math game she plays at school. The platforming is the intrinsically fun part; math (weighted toward the 6–9 tables) is what stands between her and the next stage. Dark grunge aesthetic, no pink, no timers, no pressure.

> **Direction correction (v3.0):** v1.0–v2.0 built a multiple-choice quiz with a static picture (a dungeon "crawler" that was really scorekeeping with a goblin emoji above the question). That was a misread of the intent. The actual goal — established at v3.0 kickoff — is an *actual game she controls*: a 2D platformer with a moving avatar, real physics, and levels. v3.0 pivots to that. The tuned "math brain" (weighted question selection toward 6–9 tables) is carried forward; the quiz shell is replaced by a game shell.

**Core Value:** She opens it because she *wants* to, not because she has to.

### Constraints

- **Tech stack**: Vanilla JS + Kaplay (one vendored game library). No JS build step, no npm install to run — vendor the library file directly.
- **Deployment**: Static files served from a Docker container (nginx) on the home-server cluster, reachable at a web URL (`docs/DEPLOY.md`). This is *packaging + static hosting*, NOT a backend — no database, no accounts, no server-side logic, no data leaves her browser. Docker is not a JS build step.
- **Persistence**: Browser `localStorage` only — XP, level, and practice history live client-side, scoped to the URL's origin (clearing browser data resets it, like her school game).
- **Design**: Grunge/dark aesthetic; explicitly no pink, no bubbly or childish elements. Holds for pixel art too — dark, edgy sprites.
- **No timers / no pressure**: Carries over from v1/v2 — ADHD-safe. Platforming hazards are fine; *countdown* pressure is not.

## Technology Stack

### Shipped Stack (v5.0-era, verified against the live tree 2026-07-07)

- **This is the CURRENT-STATE stack doc** — `.planning/research/STACK.md` is per-milestone research (v5.0: audio/validation/logo/palette additions only) and must NOT be read as the full stack.

| Piece | What | Notes |
|-------|------|-------|
| Engine | Kaplay 3001.0.19, vendored at `lib/kaplay.mjs` | Pinned (sha256 in header); `kaplay({ global: true })` — engine globals exist only AFTER init (a727c13 rule). Code against Kaplay 3001 API only; ignore `kaboom(` snippets. Never upgrade without re-testing. |
| Language | Vanilla ES2020 modules under `src/` | No TypeScript, no JSX, no framework, no npm, no build step, no node_modules. |
| Serving | MUST be over HTTP — `file://` is blocked (guard in `src/index.html`) | Dev: run `python3 -m http.server 8000` from the **repo root** (not `src/` — `lib/` is a sibling of `src/`, not nested inside it, so a server rooted at `src/` 404s on `lib/kaplay.mjs`), then browse to `http://localhost:8000/src/index.html`. Matches `scripts/browser-boot.mjs`'s serving convention and the Dockerfile's flattened production layout. Production: nginx Docker static container on the home-server cluster (`docker/`, `docs/DEPLOY.md`) — packaging, not a build. |
| Canvas | Internal 640×360, displayed 1.5× via CSS `transform: scale(1.5)` | NEVER scale via width/height — desyncs Kaplay's offsetX/offsetY mouse mapping and silently breaks `box.onClick()` (documented in `src/main.js`). |
| Persistence | localStorage key `noxrun_platformer_v1`, save-format version 3 (`CONFIG.SAVE` in `src/config.js`, read 2026-11-01) | The Phase 26 Nox Run rebrand changed the key on purpose, resetting pre-rebrand progress with no migration (the user's explicit decision); version 3 added `secretFound`, again with no migration. All access still goes through guarded `src/progress.js` seams (never throw, forgiving defaults). |
| Assets | Curated CC0 pixel art under `assets/` | Licenses in `assets/LICENSES/`, credits in `CREDITS.md`; some baked by `scripts/build-art-assets.py` (Pillow). |
| Test harness | Playwright driven from `scripts/*.mjs` | Resolved dynamically (project dep → `PLAYWRIGHT_MJS_PATH` env → every nvm node version, newest first, checking each for a global `playwright` and then the old `gsd-pi` bundle). No JS test framework — the shell gates + browser scripts ARE the suite. |

## Verification gates (run after any `src/` or level change)

- `bash scripts/check-gate.sh` — math-gate/challenge invariants
- `bash scripts/check-safety.sh` — SAFE-01 no-timer + forgiving mandate (whole `src/`)
- `bash scripts/check-import-safety.sh` — a727c13 module-top-level engine-global trap
- `bash scripts/check-progress.sh` — progress/save invariants (ends with `smoke-progress.mjs`)
- `node scripts/check-assets-manifest.mjs` — asset manifest existence gate (every declared sprite/sound path exists on disk)
- `bash scripts/check-terrain-atlas.sh` — terrain PIXEL gate (REQUIRED after any `assets/tiles/` or `build-art-assets.py` change). The ONLY gate that looks at rendered pixels: hard-fails a ground atlas that would tile into a sawtooth, render as achromatic grey (the `_remap_luminance` trap), or float above its own collider. Every other gate was green while the game shipped both a sawtoothed floor and grey-static ground — see `.planning/research/ART-PARITY-STEERING.md`.
- `node scripts/validate-levels.mjs` — static level validator, REQUIRED for any level edit (green = zero HARD-FAIL)
- `node scripts/browser-boot.mjs` — real-browser boot + drive across all levels
- `node scripts/audit-phase21-mechanics.mjs` — interactive mechanic audit (`triggered: true` required for every encounter; `resolved: false` rows are known headless-timing flakiness)

## Debug overlay

- Serve with `?debug=1` (e.g. `http://localhost:8000/?debug=1`) to render normally-invisible entities: merged colliders, tall door/gate/enemy blockers, answer zones, pickup slots, checkpoints, secret alcoves (magenta markers).
- Display-only; never hand-edit `opacity(0)` in production code for playtesting.

## Conventions

### Binding rules (verified against the live tree 2026-07-07)

- **a727c13 rule (critical):** never reference a Kaplay engine global (`add`, `rect`, `go`, `onKeyPress`, …) at module top level — they exist only after `kaplay({ global: true })` runs; a top-level ref throws at import and blanks the game. Engine refs live INSIDE function bodies only. Enforced by `check-import-safety.sh`.
- **No timers/schedulers** (`setTimeout`, `setInterval`, `wait()`, `loop()`, `lifespan()`) and **no punishment constructs** anywhere in `src/`. Delayed effects use the `tween().onEnd()` self-clean idiom. Enforced by `check-safety.sh`.
- **All tunables live in `src/config.js`** — no magic numbers in logic modules.
- **`src/math/brain.js` is LOCKED** — the selection/EWMA math is validated; difficulty is tuned ONLY via per-level `allowedTables` pools in the level descriptors.
- **Anti-leak:** run state is closure-local (never module-level `let`); app-bus controllers (`onHide`, global key handlers) are cancelled on `onSceneLeave`.
- **Levels are pure data** (`src/levels/level-0N.js`) built by the ONE builder `src/levels/build.js`; the registry `src/levels/index.js` must stay node-importable (no engine refs). Unlock state is always DERIVED from cleared facts, never stored.
- **Level authoring rules live in `docs/LEVEL-DESIGN.md`** — quantified gap/rise/overlap/spacing/checkpoint rules derived from the calibrated jump envelope; read BEFORE creating or editing any level descriptor.
- **Bounds convention trap:** level-01 derives its camera right edge from geometry; level-02+ carry an explicit `bounds` field used AS-IS — when extending such a level, bump `bounds.right` by hand.
- **Extending kid-validated levels:** append new sections after the existing geometry — never edit inside it.
- **Playwright script duplication is deliberate** (`browser-boot.mjs` / `audit-phase21-mechanics.mjs` / `calibrate-jump-envelope.mjs` share copied server/guard code): fix a bug identically in every copy by hand; do not extract a shared module.
- **Verification standard:** no phase closes on greps/automation alone — interactive proof, and human sign-off where claimed. "Checks that don't play the game lie."

## Architecture

### Module map (verified against the live tree 2026-07-07)

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

### Data flow

- **Boot:** `main.js` inits Kaplay → registers title/select/game scenes → `go("title")`.
- **Level entry:** select passes `{ levelId }` via `go()` payload → `game.js` loads the descriptor from the registry → `buildLevel()` emits tagged entities → mechanics modules wire `player.onCollide` handlers against tags.
- **Math seam:** every mechanic routes through the ONE shared challenge panel (`src/ui/challenge.js`) with the scene's closure-local brain; the secret alcove is the sole exception (wired with `progress`, never opens a challenge).
- **Persistence:** save writes happen on level-clear and tab-hide only (no timer autosave); unlock is derived from cleared facts at read time, never stored.

## Planning layer

- `.planning/` is this project's research and milestone archive, written by GSD while it was in use (it is uninstalled), and the art pipeline's working area: `scripts/build-art-assets.py` reads `research/v6-scouting/styleboard.py` and writes into `phases/`, as most `screenshot-phase*.mjs` scripts do. It stays where it is (decided 2026-11-01): `.dockerignore`, `docker/Dockerfile` and `publish-image.yml`'s `paths-ignore` exclude it by name. `ROADMAP.md` there is the phase plan, `PROJECT.md` the product definition, `milestones/` the history and `research/` per-milestone research. A new plan goes in `docs/planning/`. Where a session stands is `.agent-state.md` at the root (gitignored), not `.planning/STATE.md`.
