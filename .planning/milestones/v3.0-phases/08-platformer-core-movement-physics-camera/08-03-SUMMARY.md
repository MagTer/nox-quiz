---
phase: 08-platformer-core-movement-physics-camera
plan: 03
subsystem: platformer-core
tags: [frame-rate-independence, dt-correctness, camera, audit, MOVE-05]
requires:
  - "08-01: stress strip + dt-correct run/jump baseline"
  - "08-02: coyote/buffer/variable-height jump, camera follow+clamp, checkpoint respawn"
provides:
  - "MOVE-05 dt-correctness audit pass (no double-scale, no raw-constant lerp, no hand-rolled gravity)"
  - "MOVE-05 human-verify gate recorded for end-of-phase validation"
affects:
  - src/config.js
  - src/player.js
  - src/camera.js
  - src/scenes/game.js
tech-stack:
  added: []
  patterns:
    - "RESEARCH Pattern 6: engine-integrated vel/gravity is already dt-correct; only hand-wired timers + camera lerp need dt()"
    - "RESEARCH Pattern 4 / Pitfall 4: camera uses 1 - exp(-rate*dt()), never a raw constant-factor lerp"
key-files:
  created: []
  modified: []
decisions:
  - "Task 1 audit clean — no code changes needed; all four dt-correctness rules already satisfied by Plans 01-02"
  - "Human-verify gate (Task 2) recorded for end-of-phase validation per config human_verify_mode: end-of-phase (not blocking inline)"
metrics:
  duration: "~1min"
  completed: 2026-06-24
status: complete
---

# Phase 8 Plan 03: Frame-Rate Independence Verification (MOVE-05) Summary

dt-correctness audit of every hand-wired motion path (run, gravity, coyote/buffer timers, camera lerp) confirmed clean with zero code changes — no double-scaling, no raw constant-factor lerp, no hand-rolled gravity; the throttled-vs-60Hz human playthrough is recorded for end-of-phase verification.

## What This Plan Did

This was an **audit + verification** plan (no new modules). It proves the dt-discipline established in Plans 01–02 actually holds across refresh rates (MOVE-05), as the phase's final gate.

### Task 1: dt-correctness audit of all hand-wired motion — AUDIT CLEAN, NO CHANGES

Audited `src/player.js`, `src/camera.js`, `src/scenes/game.js`, `src/config.js` against RESEARCH Pattern 6 (frame-rate independence) and Pitfall 4 (frame-rate-dependent feel). All four rules pass:

1. **Horizontal run — no double-scale.** `player.vel.x = dir * CONFIG.RUN_SPEED` (player.js:46). No `dt()` multiplier on the assignment; `body().move()` integrates `vel` with `dt()` internally. A `dt()` here would be a double-scale bug — absent.
2. **Gravity — no hand-rolled integration.** No `vel.y += g * dt()` anywhere. Gravity is engine-integrated via `setGravity(CONFIG.GRAVITY)` (game.js:23) + `body({ maxVelocity: CONFIG.MAX_FALL_SPEED })` (player.js:28), which preserves the `maxVelocity` terminal clamp and physics events. The only `vel.y` writes are the dimensionless variable-height cut (`vel.y *= CONFIG.JUMP_CUT`, player.js:72) and a read (`vel.y < 0`).
3. **Timers decrement by dt().** `coyote = Math.max(0, coyote - dt())` (player.js:50) and `buffer = Math.max(0, buffer - dt())` (player.js:53) bleed down in dt-seconds — frame-rate independent. No raw per-frame constant decrement.
4. **Camera — frame-rate-independent smoothing.** `const t = 1 - Math.exp(-CONFIG.CAM_RATE * dt())` (camera.js:20), then `lerp(cur, target, t)`. No raw constant-factor lerp (`lerp(a, b, 0.1)`) exists in any motion module — confirmed by sweep across `src/`.

**Result:** Audit clean — no changes. No CONFIG tune adjustments were surfaced (those, if any, would have landed in `src/config.js` only). No inline literals introduced.

**Automated verification (plan's exact command) → OK:**
```
node --check src/player.js && node --check src/camera.js && node --check src/scenes/game.js \
  && grep -q "Math.exp(-CONFIG.CAM_RATE" src/camera.js \
  && ! grep -Eq "vel\.x[ ]*=[^;]*\bdt\(\)" src/player.js \
  && ! grep -Eq "vel\.y[ ]*\+=" src/player.js src/scenes/game.js \
  && ! grep -Eq "lerp\([^,]+,[^,]+,[ ]*0\.[0-9]+\)" src/camera.js src/player.js src/scenes/game.js \
  && echo OK
```
Supplementary sweeps across all of `src/`: no raw-constant lerp, no `dt()` on any `vel.(x|y)=` assignment.

### Task 2: Human verification — throttled / non-60Hz playthrough (MOVE-05) — DEFERRED to end-of-phase

This is a `checkpoint:human-verify gate="blocking"` task. Project config sets `human_verify_mode: end-of-phase`, so per that policy the gate is **recorded here and deferred** to end-of-phase verification rather than blocking mid-execution. All automated work (Task 1 audit) is complete. See the Human Verification section below for the exact steps to run.

## Deviations from Plan

None — plan executed exactly as written. Task 1 audit found no dt-correctness violations, so no fixes were required (the plan explicitly allows "record 'audit clean — no changes'").

## Human Verification Required (end-of-phase)

**Gate:** MOVE-05 — throttled / non-60Hz playthrough must match the 60Hz baseline. Status: **pending** (deferred to end-of-phase per `human_verify_mode: end-of-phase`).

Steps (from the plan's how-to-verify):
1. Serve the game: `cd src && python3 -m http.server 8000`, open http://localhost:8000/ in a modern browser.
2. **Baseline (60Hz):** hold Right and note run distance per ~1s; full-hold jump peak height; camera follow feel. Repeat coyote, buffer, and variable-height checks.
3. **Throttle:** DevTools → Rendering → enable an FPS/refresh limit or CPU throttling (e.g. 4x CPU slowdown / forced lower frame rate), OR run on a real 120/144Hz display.
4. **Re-run the SAME checks under throttling:** run distance per ~1s hold, full-hold jump height, and camera follow feel must MATCH the 60Hz baseline (not faster/slower, not floatier/heavier). Jumps must not be eaten; the camera must not speed up.
5. Confirm the DevTools console is clean (no errors/warnings) throughout.
6. If anything differs across refresh rates, that is a dt-correctness bug — report exactly which behavior changed (run / jump / camera) so it can be fixed in CONFIG or the relevant module before re-verifying.

Resume signal: "approved" if the throttled playthrough matches 60Hz (MOVE-05 passes), or describe exactly which behavior changed across refresh rates.

## Known Stubs

None.

## Threat Flags

None — this plan introduced no new code paths, inputs, or dependencies (audit + verification only). Trust surface unchanged from Plans 01–02 (keyboard → game state only).

## Verification Results

- `node --check` clean on `src/player.js`, `src/camera.js`, `src/scenes/game.js`.
- dt-correctness greps pass: no double-scale on `vel.x`, no hand-rolled `vel.y +=` gravity, camera uses `Math.exp(-CONFIG.CAM_RATE * dt())`, no raw constant-factor lerp in any motion module.
- Human-confirmed throttled playthrough: **pending end-of-phase** (recorded above).

## Self-Check: PASSED

- src/config.js, src/player.js, src/camera.js, src/scenes/game.js all present and unchanged (audit was read-only).
- Task 1 automated verification command returned OK.
