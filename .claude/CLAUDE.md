<!-- GSD:project-start source:PROJECT.md -->

## Project

**Nox Run** (formerly Math Lab; rebrand completes in Phase 26)

A 2D platformer (vendored [Kaplay](https://kaplayjs.com/) engine) for a 12-year-old girl where multiplication is the gate to progress: locked doors, checkpoint gates, enemies, and collect-the-answer zones all open on a correct answer. Targets the 6–9 times tables with easier ones mixed in for confidence. Dark grunge aesthetic, keyboard-controlled, XP + leveling persistence — **no pink, no timers, no game over, no pressure**.

**Core Value:** She opens it because she *wants* to, not because she has to.

**History:** v1 was a single-file quiz (preserved verbatim at `archive/math-lab.html` — reference only, do not edit). v2 a dungeon crawler. v3.0+ is the current multi-file platformer. Any doc describing a "single HTML file" app is describing v1, not this codebase.

### Constraints (binding)

- **No npm, no build step, no bundler, no node_modules** — plain HTML + vanilla ES2020 modules, edited and served as-is. The vendored engine `lib/kaplay.mjs` (Kaplay **3001.0.19**, pinned, sha256 in its header) is a committed file — never upgrade or CDN-swap it without re-testing; ignore `kaboom(` snippets online.
- **Must be served over HTTP** — `file://` is blocked (ES modules fail under the opaque origin; `src/index.html` shows a guard message). Dev: `cd src && python3 -m http.server 8000`. Production: static files in an nginx Docker container via Dokploy (`docker/`, `docs/DEPLOY.md`) — Docker packages, it does not build.
- **Design**: dark grunge (`#0a0a0a` bg, `#e8e8e8` fg, `#00ff88` accent), explicitly **no pink**, nothing bubbly.
- **ADHD-safe**: no timers/countdowns, wrong answers re-ask penalty-free, respawn never costs meaningful progress, no strobing (flashes ≤ ~500ms), calm feedback only.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

| Piece | What | Notes |
|-------|------|-------|
| Engine | Kaplay 3001.0.19, vendored at `lib/kaplay.mjs` | `kaplay({ global: true })` — engine globals exist only AFTER init (see a727c13 rule below). Code against the Kaplay 3001 API only. |
| Language | Vanilla ES2020 modules under `src/` | No TypeScript, no JSX, no framework. |
| Canvas | Internal 640×360, displayed at 1.5× via CSS `transform: scale(1.5)` | NEVER scale via width/height — it desyncs Kaplay's offsetX/offsetY mouse mapping and silently breaks `box.onClick()` hit-testing (documented in `src/main.js`). |
| Persistence | localStorage key **`mathlab_platformer_v2`**, version 2 | The key is NOT part of the brand — the rebrand must never touch it. All reads/writes go through guarded `src/progress.js` seams (never throw, default forgivingly). |
| Assets | Curated CC0 pixel art under `assets/` (licenses in `assets/LICENSES/`, credits in `CREDITS.md`) | Some baked by `scripts/build-art-assets.py` (Pillow). |
| Test harness | Playwright driven from `scripts/*.mjs` (resolved dynamically; `PLAYWRIGHT_MJS_PATH` env override) | No JS test framework — the shell gates + browser scripts ARE the test suite. |

### Verification gates (run after any `src/` or level change)

```bash
bash scripts/check-gate.sh            # math-gate/challenge invariants
bash scripts/check-safety.sh          # SAFE-01 no-timer + forgiving mandate (whole src/)
bash scripts/check-import-safety.sh   # a727c13 module-top-level engine-global trap
bash scripts/check-progress.sh        # progress/save invariants (ends with smoke-progress.mjs)
node scripts/validate-levels.mjs      # static level validator — REQUIRED for any level edit (green = zero HARD-FAIL)
node scripts/browser-boot.mjs         # real-browser boot + drive across all levels
node scripts/audit-phase21-mechanics.mjs  # interactive mechanic audit (triggered:true required; resolved:false rows are known flaky)
```

### Debug overlay

Serve with **`?debug=1`** (e.g. `http://localhost:8000/?debug=1`) to render normally-invisible entities: merged colliders, tall door/gate/enemy blockers, answer zones, checkpoints, and secret alcoves (magenta markers). Display-only; never hand-edit `opacity(0)` in production code for playtesting.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

- **a727c13 rule (critical):** never reference a Kaplay engine global (`add`, `rect`, `go`, `onKeyPress`, …) at module top level — they exist only after `kaplay({ global: true })` runs; a top-level ref throws at import and blanks the game. Engine refs live INSIDE function bodies only. Enforced by `check-import-safety.sh`.
- **No timers/schedulers** (`setTimeout`, `setInterval`, `wait()`, `loop()`, `lifespan()`) and **no punishment constructs** anywhere in `src/`. Delayed effects use the `tween().onEnd()` self-clean idiom. Enforced by `check-safety.sh`.
- **All tunables live in `src/config.js`** — no magic numbers in logic modules.
- **`src/math/brain.js` is LOCKED** — the selection/EWMA math is validated; difficulty is tuned ONLY via per-level `allowedTables` pools in the level descriptors.
- **Anti-leak:** run state is closure-local (never module-level `let`); app-bus controllers (`onHide`, global key handlers) are cancelled on `onSceneLeave`.
- **Levels are pure data** (`src/levels/level-0N.js`) built by the ONE builder `src/levels/build.js`; the registry `src/levels/index.js` must stay node-importable (no engine refs). Unlock state is always DERIVED from cleared facts, never stored.
- **Level authoring rules live in `docs/LEVEL-DESIGN.md`** — quantified gap/rise/overlap/spacing/checkpoint rules derived from the calibrated jump envelope; read it BEFORE creating or editing any level descriptor.
- **Bounds convention trap:** level-01 derives its camera right edge from geometry; level-02+ carry an explicit `bounds` field used AS-IS — when extending such a level, bump `bounds.right` by hand.
- **Extending kid-validated levels:** append new sections after the existing geometry — never edit inside it.
- **Playwright script duplication is deliberate** (`browser-boot.mjs` / `audit-phase21-mechanics.mjs` / `calibrate-jump-envelope.mjs` share copied server/guard code): fix a bug identically in every copy by hand; do not extract a shared module.
- **Verification standard:** no phase closes on greps/automation alone — interactive proof, and human sign-off where claimed. "Checks that don't play the game lie."
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

```
src/index.html        entry shell (file:// guard, flex-centers the canvas)
src/main.js           kaplay() init, 1.5× display scale, sprite loads, scene registry, go("title")
src/config.js         ALL tunables (movement, camera, palette roles, HUD, FX, SAVE key…)
src/player.js         player factory (coyote/buffer/variable-height jump)
src/camera.js         clamped frame-rate-independent follow
src/parallax.js       camera-driven background layers
src/fx.js             juice (squash/dust/pop/burst) — self-cleaning tweens
src/progress.js       guarded save/load/reset + XP/level tracker (createProgress)
src/math/brain.js     LOCKED question selection (6–9 weighting, EWMA accuracy)
src/levels/index.js   ordered registry + derived unlock (node-importable, pure)
src/levels/build.js   the ONE descriptor→entities builder (+ ?debug=1 overlay)
src/levels/level-0N.js  8 pure-data level descriptors
src/scenes/title.js   wordmark + start + Reset Progress (R, Y/N confirm)
src/scenes/select.js  2×4 level grid, row-aware keyboard cursor
src/scenes/game.js    the run: build level, wire mechanics, respawn, save on clear/hide
src/mechanics/*.js    door, gates (checkpoint math gates), enemy, collect, secretAlcove
src/ui/challenge.js   shared math-challenge panel (the one challenge seam)
src/ui/mathGate.js    end-of-level gate → LEVEL CLEAR
src/ui/hud.js         level badge + XP bar + level-up flash
```

Planning state lives in `.planning/` (GSD): `STATE.md` is current position, `ROADMAP.md` the phase plan, `PROJECT.md` the product definition. Milestone history is archived under `.planning/milestones/`.
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
