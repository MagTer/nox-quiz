<!-- GSD:project-start source:PROJECT.md -->

## Project

**Math Lab**

A real 2D platformer for a 12-year-old girl, played in the browser with the keyboard — run, jump across platforms, reach the goal — where multiplication is the *gate to progress*, modeled on the Mario-style math game she plays at school. The platforming is the intrinsically fun part; math (weighted toward the 6–9 tables) is what stands between her and the next stage. Dark grunge aesthetic, no pink, no timers, no pressure.

> **Direction correction (v3.0):** v1.0–v2.0 built a multiple-choice quiz with a static picture (a dungeon "crawler" that was really scorekeeping with a goblin emoji above the question). That was a misread of the intent. The actual goal — established at v3.0 kickoff — is an *actual game she controls*: a 2D platformer with a moving avatar, real physics, and levels. v3.0 pivots to that. The tuned "math brain" (weighted question selection toward 6–9 tables) is carried forward; the quiz shell is replaced by a game shell.

**Core Value:** She opens it because she *wants* to, not because she has to.

### Constraints

- **Tech stack**: Vanilla JS + Kaplay (one vendored game library). No JS build step, no npm install to run — vendor the library file directly.
- **Deployment**: Static files served from a Docker container (nginx) deployed via Dokploy, reachable at a web URL. This is *packaging + static hosting*, NOT a backend — no database, no accounts, no server-side logic, no data leaves her browser. Docker is not a JS build step.
- **Persistence**: Browser `localStorage` only — XP, level, and practice history live client-side, scoped to the URL's origin (clearing browser data resets it, like her school game).
- **Design**: Grunge/dark aesthetic; explicitly no pink, no bubbly or childish elements. Holds for pixel art too — dark, edgy sprites.
- **No timers / no pressure**: Carries over from v1/v2 — ADHD-safe. Platforming hazards are fine; *countdown* pressure is not.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Shipped Stack (v5.0-era, verified against the live tree 2026-07-07)

- **This is the CURRENT-STATE stack doc** — `.planning/research/STACK.md` is per-milestone research (v5.0: audio/validation/logo/palette additions only) and must NOT be read as the full stack.

| Piece | What | Notes |
|-------|------|-------|
| Engine | Kaplay 3001.0.19, vendored at `lib/kaplay.mjs` | Pinned (sha256 in header); `kaplay({ global: true })` — engine globals exist only AFTER init (a727c13 rule). Code against Kaplay 3001 API only; ignore `kaboom(` snippets. Never upgrade without re-testing. |
| Language | Vanilla ES2020 modules under `src/` | No TypeScript, no JSX, no framework, no npm, no build step, no node_modules. |
| Serving | MUST be over HTTP — `file://` is blocked (guard in `src/index.html`) | Dev: `cd src && python3 -m http.server 8000`. Production: nginx Docker static container via Dokploy (`docker/`, `docs/DEPLOY.md`) — packaging, not a build. |
| Canvas | Internal 640×360, displayed 1.5× via CSS `transform: scale(1.5)` | NEVER scale via width/height — desyncs Kaplay's offsetX/offsetY mouse mapping and silently breaks `box.onClick()` (documented in `src/main.js`). |
| Persistence | localStorage key `mathlab_platformer_v2`, version 2 | Key is NOT part of the brand — rebrand must never touch it. All access through guarded `src/progress.js` seams (never throw, forgiving defaults). |
| Assets | Curated CC0 pixel art under `assets/` | Licenses in `assets/LICENSES/`, credits in `CREDITS.md`; some baked by `scripts/build-art-assets.py` (Pillow). |
| Test harness | Playwright driven from `scripts/*.mjs` | Resolved dynamically (project dep → `PLAYWRIGHT_MJS_PATH` env → nvm-wide gsd-pi search). No JS test framework — the shell gates + browser scripts ARE the suite. |

## Verification gates (run after any `src/` or level change)

- `bash scripts/check-gate.sh` — math-gate/challenge invariants
- `bash scripts/check-safety.sh` — SAFE-01 no-timer + forgiving mandate (whole `src/`)
- `bash scripts/check-import-safety.sh` — a727c13 module-top-level engine-global trap
- `bash scripts/check-progress.sh` — progress/save invariants (ends with `smoke-progress.mjs`)
- `node scripts/validate-levels.mjs` — static level validator, REQUIRED for any level edit (green = zero HARD-FAIL)
- `node scripts/browser-boot.mjs` — real-browser boot + drive across all levels
- `node scripts/audit-phase21-mechanics.mjs` — interactive mechanic audit (`triggered: true` required for every encounter; `resolved: false` rows are known headless-timing flakiness)

## Debug overlay

- Serve with `?debug=1` (e.g. `http://localhost:8000/?debug=1`) to render normally-invisible entities: merged colliders, tall door/gate/enemy blockers, answer zones, pickup slots, checkpoints, secret alcoves (magenta markers).
- Display-only; never hand-edit `opacity(0)` in production code for playtesting.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Binding rules (verified against the live tree 2026-07-07)

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

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

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

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
