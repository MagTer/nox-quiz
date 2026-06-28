---
phase: 12-polish-adhd-safety-uat
plan: 01
subsystem: ui
tags: [kaplay, juice, game-feel, tween, scale, particles, adhd-safety]

# Dependency graph
requires:
  - phase: 12-polish-adhd-safety-uat (Plan 00)
    provides: CONFIG.FX tuning namespace + scripts/check-safety.sh no-timer/forgiving audit gate
  - phase: 11 (progression)
    provides: hud.flashLevelUp() + the onClear seam in scenes/game.js the burst layers on
  - phase: 10 (math gate)
    provides: the gate's terminal "LEVEL CLEAR" banner the burst enhances (untouched)
provides:
  - src/fx.js — squash/stretch/dust/pop/clearBurst self-cleaning effect helpers
  - JUICE-01 player squash-on-land + stretch-on-jump + dust particles
  - JUICE-02 coin-collect neon-green pop (count-only, no XP/+1)
  - JUICE-03 brief non-strobing level-clear burst layered on the existing clear moment
affects: [12 Plan 02 (controls hint + UAT), future visual tuning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One effect idiom for all juice: add([... 'fx']) transient + tween(...).onEnd(() => destroy(obj))"
    - "a727c13-safe module: only top-level statement touching a name is the CONFIG import; all Kaplay globals used inside fn bodies only"
    - "Anti-leak: every transient tagged 'fx'; onSceneLeave(destroyAll('fx')) belt-and-braces sweep"

key-files:
  created:
    - src/fx.js
  modified:
    - src/player.js
    - src/scenes/game.js

key-decisions:
  - "Single src/fx.js of small functions reuses the proven hud.js tween().onEnd(destroy) idiom — no new animation mechanism per effect"
  - "squash() drives scale back to neutral via from + (1 - from) * v interpolation (easeOutQuad, never elastic/back — non-bouncy, ADHD-safe)"
  - "stretch() is a thin alias for squash(obj, 'jump') so the jump call site reads clearly"
  - "clearBurst() z=9400 sits BELOW the hud-flash banner (z=9500) so it never hides 'LEVEL UP'; one smooth grow+fade, never a strobe"
  - "coin pop is fired BEFORE destroy(c) with c.pos.clone() (live pos, entity about to be destroyed); coinsCollected += 1 left untouched, no +1 text"

patterns-established:
  - "Self-cleaning timer-free effect: tween(0,1,ms/1000,setter,easeOutQuad).onEnd(() => destroy(obj))"
  - "Engine-global discipline for new modules: import CONFIG only at top; every Kaplay symbol inside fn bodies (a727c13 lesson)"

requirements-completed: [JUICE-01, JUICE-02, JUICE-03]

# Metrics
duration: ~12min
completed: 2026-06-28
status: complete
---

# Phase 12 Plan 01: The Juice Summary

**src/fx.js squash/stretch/dust/pop/clearBurst — one self-cleaning tween().onEnd(destroy) idiom wired into player jump/land, coin collect, and the level-clear moment; subtle, non-strobing, no-timer, no pink.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-06-28
- **Tasks:** 3
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `src/fx.js` created — four exported effect helpers (`squash`/`dust`/`pop`/`clearBurst`, plus a `stretch` alias), each an `add([... "fx"])` transient that animates with `tween(...)` and self-destroys on `.onEnd(() => destroy(obj))`. Reads `CONFIG.FX`. a727c13-safe (only top-level statement touching a name is the `CONFIG` import); no timer; grunge-grey dust + neon-green pop/burst, no pink.
- JUICE-01: player gains `scale(1)`; `fx.stretch(player)` fires on jump; `body().onGround` hook fires `fx.squash(player)` + `fx.dust(player.pos)` on landing.
- JUICE-02: `fx.pop(c.pos.clone())` fires at the coin's spot before `destroy(c)`; count stays unaffected (no XP, no "+1").
- JUICE-03: `fx.clearBurst()` fires in `onClear`, layered after `hud.refresh()`/`hud.flashLevelUp()` — enhances, never replaces, the gate banner + level-up flash.
- Anti-leak: `onSceneLeave(() => destroyAll("fx"))` belt-and-braces sweep added.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/fx.js effect helpers** - `f450409` (feat)
2. **Task 2: Wire squash/stretch + dust into the player (JUICE-01)** - `5f04fed` (feat)
3. **Task 3: Fire coin pop + clear burst from the scene (JUICE-02/03)** - `135765a` (feat)

## Files Created/Modified
- `src/fx.js` (NEW) - squash/stretch/dust/pop/clearBurst self-cleaning effect helpers; engine globals only inside fn bodies
- `src/player.js` - added `import * as fx`, `scale(1)` comp, `fx.stretch` on jump, `body().onGround` -> `fx.squash` + `fx.dust`
- `src/scenes/game.js` - added `import * as fx`, `fx.pop` on coin collect, `fx.clearBurst` in onClear, `onSceneLeave(destroyAll("fx"))` sweep

## Decisions Made
- Used `import * as fx` (namespace import) at both call sites for clarity (`fx.squash`, `fx.pop`, etc.).
- `clearBurst` uses `fixed()` (screen-space celebration) at `z=9400`, deliberately below the hud-flash banner (`z=9500`) so the "LEVEL UP" text always reads on top.
- Kept the `body().onGround` hook as the primary land trigger (bundle-confirmed present); the documented `isGrounded()` rising-edge fallback was NOT needed.

## Deviations from Plan

None - plan executed exactly as written. The `body().onGround` land hook worked as the primary path (the isGrounded() rising-edge fallback documented in the plan was not required).

## Issues Encountered
None. (One self-check false positive during verification: the local pink grep matched a hex pattern inside the grep command itself, not the file — confirmed no pink color literal in src/fx.js; all colors are grunge-grey `0x88` or neon-green `ACCENT_GREEN`.)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Juice layer complete and replay-safe. Plan 02 (controls hint + UAT) is next; the SAFE-02 hint positive check in `scripts/check-safety.sh` remains red by design until Plan 02 mounts the `"SPACE jump"` hint.
- The no-timer + forgiving audits pass clean for all three modified files; `node --check` clean on all.

## Self-Check: PASSED
- FOUND: src/fx.js, src/player.js, src/scenes/game.js
- FOUND commits: f450409, 5f04fed, 135765a
- safety audit: only the expected SAFE-02 hint check is red (Plan 02 closes it); no-timer/forgiving/onEnd-positive all green
- mathGate.js NOT modified (gate banner untouched); firewall (src/math/*, src/progress.js) intact

---
*Phase: 12-polish-adhd-safety-uat*
*Completed: 2026-06-28*
