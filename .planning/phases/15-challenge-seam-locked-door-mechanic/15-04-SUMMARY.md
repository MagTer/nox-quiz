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
- `1492905` fix(15): increase door height to block jump bypass
- `4b2343f` fix(15): door lintel + reposition to prevent aerial bypass
- `222e5bc` fix(15): position lintel at max jump height, not just above door
- `6a782ea` fix(15): replace lintel with tall invisible blocker

## Verification

### Task 2: Mandatory real-browser boot (human verification)

First verification pass:

- **MECH-01:** end-of-level gate still behaves identically — ✅ user confirmed OK.
- **MECH-02:** door opens the challenge overlay on touch — ✅ user confirmed OK.
- **MECH-02 defect found:** the 64px door could be jumped over, allowing progress without
  answering. Multiple attempted fixes:
  - Raising `CONFIG.DOOR.H` to 128px — still bypassable from the raised platform and looked
    silly.
  - Adding a horizontal lintel — acted as a ledge the player could stand on and pass.
  - **Final fix:** a tall *vertical invisible blocker* (tag `"door"`, `opacity(0)`) that
    covers the player's jump arc, paired with a separate visible 64px panel and glyph. The
    blocker physically prevents bypass and triggers the challenge on contact; the panel
    provides the visual. Static suite re-run green.

Re-verification needed: confirm the player cannot bypass the door at x:1400 from the floor,
from the raised platform at x:1640, or from any other ledge, and must answer the challenge to
progress.


