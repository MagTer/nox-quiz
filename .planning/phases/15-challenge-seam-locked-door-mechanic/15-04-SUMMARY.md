# 15-04 Summary — Wire `wireDoor({player, brain})` into `src/scenes/game.js`

## Goal
Complete the single integration call this entire phase has been building toward: import
`wireDoor` from `src/mechanics/door.js` and call it inside `src/scenes/game.js` once both
`player` and `brain` exist in the scene closure. Then run the full static suite (all four
scripts) green for the first time this phase.

## Tasks completed

### Task 1: Wire `wireDoor` into `src/scenes/game.js` and run the full static suite
- Added `import { wireDoor } from "../mechanics/door.js";` alongside the existing
  `../ui/mathGate.js` import block.
- Added one call right after the existing `player.onCollide("goal", onReachGoal);` wiring:

  ```js
  // Phase 15 MECH-02 wiring: every "door" entity routes through the shared challenge seam.
  wireDoor({ player, brain });
  ```

- Made no other change to `src/scenes/game.js`.
- Ran the full static suite end-to-end. Every stage passed:
  - `bash scripts/check-gate.sh` → `gate checks: PASS`
  - `bash scripts/check-import-safety.sh` → `import-safety checks: PASS`
  - `bash scripts/check-safety.sh` → `safety checks: PASS`
  - `node scripts/smoke-progress.mjs` → `smoke-progress: PASS`

## Files touched
- `src/scenes/game.js` — added the `wireDoor` import and the single additive wiring call.

## Verification

```bash
node --check src/scenes/game.js && \
  grep -q 'import { wireDoor } from "../mechanics/door.js"' src/scenes/game.js && \
  grep -q 'wireDoor({ player, brain })' src/scenes/game.js && \
  grep -q 'player.onCollide("goal", onReachGoal)' src/scenes/game.js && \
  bash scripts/check-gate.sh && \
  bash scripts/check-import-safety.sh && \
  bash scripts/check-safety.sh && \
  node scripts/smoke-progress.mjs && \
  echo OK
```

Output:

```
gate checks: PASS
import-safety checks: PASS
safety checks: PASS
smoke-progress: PASS
OK
```

## Commits
- `40ac75d` feat(game): wire `wireDoor({player, brain})` for Phase 15 MECH-02

## Left pending

### Task 2: Mandatory real-browser boot (human verification)
Task 2 was **not** executed. It requires a real browser boot to confirm:

- **MECH-01:** the end-of-level math gate still behaves identically after the
  `challenge.js` extraction (same completion banner, same XP award, same return-to-select).
- **MECH-02:** the locked door blocks the player until answered, opens on a correct answer,
  clears the path, and the player can still move/jump/fall normally afterward (no soft-lock).
- **MECH-02:** a wrong answer at the door never consumes progress, never locks the player
  out, and never sends her back — the same question re-asks.
- **MECH-02:** the overlay pauses the world and renders above the nearby hazard when opened
  next to it.

The static suite is fully green and the code change is committed. Task 2 is pending human
verification before this phase can be signed off.
