# 15-03 Summary — Locked-door entity and collision mechanic

## Tasks completed

### Task 1: CONFIG.DOOR + level-01 doors array + smoke-progress fixture
- Added `CONFIG.DOOR` to `src/config.js` with `W: 32`, `H: 64`,
  `LOCKED_GREY: [0x44, 0x44, 0x44]`, `LOCKED_BORDER: [0x55, 0x55, 0x55]`,
  and `GLYPH_SIZE: 22` — mirroring `src/scenes/select.js` locked-tile palette verbatim.
- Added one door descriptor to `src/levels/level-01.js` geometry:
  `{ x: 1480, y: FLOOR_Y - CONFIG.DOOR.H }`, placed 40 px before the x:1520 spike.
- Updated the LVL-02 regression fixture in `scripts/smoke-progress.mjs` with the same
  `doors` array so the deep-equal of `getLevel("level-01").geometry` stays balanced.

### Task 2: build.js doors consumer
- Added a guarded doors loop to `src/levels/build.js` using `g.doors ?? []`.
- Each door instantiates:
  - A solid blocking collider (`rect`, `area`, `body({ isStatic: true })`, tag `"door"`)
    colored with `CONFIG.DOOR.LOCKED_GREY` / `CONFIG.DOOR.LOCKED_BORDER`.
  - A separate lock-glyph text entity (`text("X")`, `anchor("center")`, tag `"door-glyph"`)
    with no `area()`.
- The glyph handle is stashed on the door as `door.glyphObj` for paired cleanup.
- Adjusted a comment in the file so the static `body({ isStatic: true })` count check
  accurately reflects the three runtime occurrences (floor + platform + door).

### Task 3: src/mechanics/door.js
- Created `src/mechanics/door.js`, the first module in `src/mechanics/`.
- Exports `wireDoor({ player, brain })` which registers a single
  `player.onCollide("door", (doorObj) => ...)` handler covering every door entity.
- On first contact: freezes the player (`player.vel = vec2(0)` then `player.paused = true`)
  and opens the shared `src/ui/challenge.js` overlay.
- On correct answer: adds the door to a closure-local `opened` Set, plays
  `fx.clearBurst()`, destroys the door collider AND its glyph, and finally unpauses the
  player (`player.paused = false`). The destroy lines strictly precede the unpause line.
- Imports `openChallenge` directly from `../ui/challenge.js`; never imports
  `../ui/mathGate.js`.

## Files touched
- `src/config.js`
- `src/levels/level-01.js`
- `scripts/smoke-progress.mjs`
- `src/levels/build.js`
- `src/mechanics/door.js` (created)

## Verification

All per-task verifications passed:

```bash
node --check src/config.js && node --check src/levels/level-01.js && \
  node --check scripts/smoke-progress.mjs && \
  grep -q 'DOOR:' src/config.js && \
  grep -q 'LOCKED_GREY: \[0x44, 0x44, 0x44\]' src/config.js && \
  grep -q 'doors:' src/levels/level-01.js && \
  grep -q '{ x: 1480' src/levels/level-01.js && \
  grep -q 'doors:' scripts/smoke-progress.mjs && \
  node scripts/smoke-progress.mjs && echo OK
# → smoke-progress: PASS / OK

node --check src/levels/build.js && \
  grep -q 'g.doors' src/levels/build.js && \
  grep -q '"door"' src/levels/build.js && \
  grep -q '"door-glyph"' src/levels/build.js && \
  grep -q 'glyphObj' src/levels/build.js && \
  test "$(grep -c 'body({ isStatic: true })' src/levels/build.js)" = "3" && \
  bash scripts/check-safety.sh && echo OK
# → safety checks: PASS / OK

node --check src/mechanics/door.js && \
  grep -q 'export function wireDoor' src/mechanics/door.js && \
  grep -q 'import { openChallenge } from "../ui/challenge.js"' src/mechanics/door.js && \
  test "$(grep -c 'from "../ui/mathGate.js"' src/mechanics/door.js)" = "0" && \
  grep -q 'player.paused = false' src/mechanics/door.js && \
  grep -q 'destroy(doorObj)' src/mechanics/door.js && \
  grep -q 'glyphObj' src/mechanics/door.js && \
  DESTROY_LINE=$(grep -n 'destroy(doorObj)' src/mechanics/door.js | head -1 | cut -d: -f1) && \
  UNPAUSE_LINE=$(grep -n 'player.paused = false' src/mechanics/door.js | head -1 | cut -d: -f1) && \
  [ "$DESTROY_LINE" -lt "$UNPAUSE_LINE" ] && \
  bash scripts/check-safety.sh && echo OK
# → safety checks: PASS / OK
```

Final wave-merge verification:

```bash
node scripts/smoke-progress.mjs   # → PASS
bash scripts/check-safety.sh      # → PASS
```

Note: `scripts/check-gate.sh` and `scripts/check-import-safety.sh` also passed. The plan
expected them to be red until `src/scenes/game.js` wires `wireDoor(...)` in 15-04, but the
current script versions only verify that `src/mechanics/door.js` exists, calls
`openChallenge`, and contains no module-top-level engine references — all of which are now
satisfied.

## Commits
- `0e8b415` Task 1: CONFIG.DOOR, level-01 doors array, and smoke-progress fixture
- `a6c6a63` Task 2: build.js doors consumer — solid collider + lock glyph
- `3f7f6f8` Task 3: src/mechanics/door.js — wireDoor with freeze/challenge/destroy/unfreeze

## Left for 15-04
- The actual `wireDoor({ player, brain })` call site in `src/scenes/game.js`.
- Real-browser boot verification that touching the door opens the challenge, answering
  correctly destroys the door + glyph, and the player can move/jump afterward (no soft-lock).
