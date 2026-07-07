# Codebase Conventions — Nox Run

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
