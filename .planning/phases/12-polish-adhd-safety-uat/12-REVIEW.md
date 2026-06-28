---
phase: 12-polish-adhd-safety-uat
reviewed: 2026-06-28T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/config.js
  - src/fx.js
  - src/player.js
  - src/scenes/game.js
  - src/ui/hud.js
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-06-28
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the Phase 12 juice/polish layer (`src/fx.js`), its call sites
(`src/player.js`, `src/scenes/game.js`), the persistent controls hint
(`src/ui/hud.js`), and the new tuning blocks in `src/config.js`. Cross-referenced
against `src/level.js`, `src/ui/mathGate.js`, `src/main.js`, and
`scripts/check-safety.sh` to verify the phase-specific risk list.

The headline regression risk is **clear**: `src/fx.js` touches NO Kaplay global at
module top level. Its only top-level statements are `import { CONFIG }` and a plain
`ACCENT_GREEN` array literal (verified by a comment-stripped scan, lines 33/37). All
engine calls (`add`, `tween`, `destroy`, `scaleTo`, `vec2`, `center`, `fixed`,
`easings`) live strictly inside exported function bodies. The level.js-style
import-time blank-screen bug is not present here. `node --check` passes on all five
files.

The no-timer mandate (SAFE-01) holds: no `setTimeout`/`setInterval` and no Kaplay
`wait()`/`loop()`/`lifespan()` scheduler anywhere in the reviewed files; every
transient self-cleans via `tween().onEnd(destroy)`. Anti-leak tagging is correct —
all fx objects carry the `"fx"` tag, the persistent hint is tagged `"hud"` (torn
down with the scene), and `game.js` sweeps `destroyAll("fx")` on scene leave. The
preserved invariants I could verify (fire-once goal latch, single goal handler,
`paused`-guarded jump buffer, respawn-in-place, progress/brain firewalls, dark-grunge
no-pink palette) are all intact.

Findings below are real defects, not style. The most material is a z-ordering bug
that makes the level-clear burst (JUICE-03) effectively invisible.

## Warnings

### WR-01: level-clear burst is rendered BENEATH the gate's opaque dim backdrop — effectively invisible

**File:** `src/fx.js:179` (z value) + `src/scenes/game.js:172` + `src/ui/mathGate.js:200-208`
**Issue:** `clearBurst()` mounts at `z(9400)`. It is fired from `onReachGoal()`'s
`onClear()` callback (`game.js:172`). But by the time `onClear` runs, the gate's
`choose()` has already (1) torn down the interactive overlay and then (2) added the
PERSISTENT `"gate-cleared"` objects: a full-screen black dim layer at `z(9990)` with
`opacity(CONFIG.GATE.DIM_OPACITY)` = 0.6, and a "LEVEL CLEAR" banner at `z(9994)`
(`mathGate.js:200-217`). The burst at `z(9400)` therefore renders UNDER a 60%-opaque
full-screen black rectangle (and under `flashLevelUp`'s `z(9500)` banner). The
celebratory burst is largely occluded — the user sees at most a dim smear through 60%
black. The docstring claim "LAYERED on the existing LEVEL CLEAR moment" is not
achieved; it is layered *below* the terminal cleared backdrop, not above it.
The `z(9400)` was chosen only to sit below `flashLevelUp` (z 9500), but the gate's
persistent z-9990 dim was not accounted for.
**Fix:** Raise the burst above the gate's persistent dim backdrop but keep it below
the "LEVEL UP" / "LEVEL CLEAR" text so it never hides them. The gate-cleared dim is
9990 and the banners are 9500/9994, so there is no single z that sits above the dim
yet below both banners. Either (a) lower `CONFIG.GATE.DIM_OPACITY` is not viable, so
(b) place the burst at e.g. `z(9992)` (above the 9990 dim, below the 9994 "LEVEL
CLEAR" text and accept it sits above the 9500 flash), or better (c) give the burst a
much higher z and rely on its own short fade + small footprint so it reads as an
accent over the banners:
```js
// src/fx.js clearBurst()
z(9993), // above gate-cleared dim (9990) and flash (9500); below "LEVEL CLEAR" text (9994)
```
Whichever z is chosen, verify visually that the burst is actually seen during a clear.

### WR-02: concurrent un-cancelled scale tweens can leave the player visibly mid-deformation on rapid land/jump cycles

**File:** `src/fx.js:53-68` (`squash`) and `src/player.js:41-44, 73`
**Issue:** `squash()`/`stretch()` snap `obj.scaleTo(...)` then start a NEW tween that
eases scale back to (1,1), but they never cancel the previous scale tween. On a rapid
jump→land (or land→land via `onGround` re-fire on a bumpy merged-floor seam) within
the 120–140ms settle window, two tweens drive `obj.scaleTo()` on the SAME object
concurrently. Each frame, both call `scaleTo` and the LAST writer wins; the two
tweens compute from different `from` poses (stretch 0.9/1.1 vs squash 1.15/0.85), so
the on-screen scale jitters between the two interpolations until the later tween
finishes. The terminal frame `v=1` of either tween yields exactly (1,1), so there is
no *permanent* deformation as long as a tween completes — but the visible result is a
flicker/fight, which directly undercuts the "ONE smooth fade per effect, never
strobing" SAFE-03 design goal. (`onGround` correctly fires only on real landings, so
this is bounded, but the jump-stretch-then-immediate-land path is reachable in normal
play.)
**Fix:** Track and cancel the prior scale tween before starting a new one, so only one
drives the player scale at a time:
```js
// keep the in-flight handle on the obj (closure-free, no module state)
export function squash(obj, dir = "land") {
  const F = CONFIG.FX;
  const sx = dir === "jump" ? F.STRETCH_X : F.SQUASH_X;
  const sy = dir === "jump" ? F.STRETCH_Y : F.SQUASH_Y;
  const ms = dir === "jump" ? F.STRETCH_MS : F.SQUASH_MS;
  if (obj._fxScaleTween) obj._fxScaleTween.cancel();
  obj.scaleTo(sx, sy);
  obj._fxScaleTween = tween(0, 1, ms / 1000,
    (v) => obj.scaleTo(sx + (1 - sx) * v, sy + (1 - sy) * v),
    easings.easeOutQuad);
}
```
Note `.cancel()` is the same canceller idiom already used in `game.js:209`/
`mathGate.js:228`, so it stays within the established pattern.

### WR-03: orphan scale tweens are not cancelled on scene leave and reference the player after teardown

**File:** `src/fx.js:61-67` + `src/scenes/game.js:215`
**Issue:** The `squash`/`stretch` tweens write to `obj.scaleTo(...)` but, unlike the
particle/pop/burst tweens, they are NOT attached to an `"fx"`-tagged object and have
no `.onEnd(destroy)`. `game.js`'s `onSceneLeave(() => destroyAll("fx"))` therefore
does NOT reach them. If the scene leaves (any future "play again"/level-select path)
while a player squash tween is mid-flight, the tween survives the sweep and continues
to dereference the player. The player object is itself destroyed on scene teardown, so
a surviving tween calling `scaleTo` on a destroyed object is a latent error path. This
is lower-probability than WR-01/WR-02 because the current single-scene game only ever
leaves on full reload, but the anti-leak contract the module documents ("a scene
replay / respawn ... wipes any in-flight effect") is NOT actually satisfied for these
two tweens — only for the tagged transients.
**Fix:** Adopt the WR-02 handle-on-obj pattern AND cancel it on scene leave alongside
the existing sweep, e.g. in `game.js`:
```js
onSceneLeave(() => {
  destroyAll("fx");
  if (player.exists() && player._fxScaleTween) player._fxScaleTween.cancel();
});
```
Or document explicitly that Kaplay cancels scene-scoped tweens on scene change and
that the single-scene design makes this unreachable — but the current docstring claims
coverage it does not provide.

## Info

### IN-01: `dust` with an even `DUST_COUNT` produces an asymmetric spread, not the documented symmetry

**File:** `src/fx.js:90-96`
**Issue:** `half = (F.DUST_COUNT - 1) / 2`. With `DUST_COUNT = 4` (current config),
`half = 1.5`, so `driftX = (i - 1.5) * SPREAD` yields offsets {-1.5, -0.5, +0.5,
+1.5}×SPREAD — that IS symmetric about `at.x`, good. But the comment "leftmost
negative, rightmost positive" plus "center the spread around `at`" only holds for the
chosen value; nothing enforces it. If `DUST_COUNT` is retuned to an even-vs-odd mix or
to 1, the math still works numerically but a future editor could assume integer
offsets. No bug today; flagging because the spread relies on a float `half` that is
not obvious. No fix required; consider a one-line assertion comment that `half` is
intentionally fractional for even counts.

### IN-02: `pop` marker size is derived from `DUST_SIZE * 3`, coupling the coin pop to the dust constant

**File:** `src/fx.js:136`
**Issue:** The coin pop marker uses `rect(F.DUST_SIZE * 3, F.DUST_SIZE * 3)` (9×9
from DUST_SIZE 3). This silently couples the pop's footprint to a DUST tuning knob; a
UAT retune of `DUST_SIZE` (a landing-dust concern) would unexpectedly resize the coin
pop. `CONFIG.FX` already defines `POP_SCALE`/`POP_MS` for the pop but no base size.
**Fix:** Add a dedicated `POP_SIZE` constant to `CONFIG.FX` and use it, so dust and
pop tune independently:
```js
// config.js CONFIG.FX
POP_SIZE: 9, // px — coin pop marker base footprint (independent of DUST_SIZE)
// fx.js pop()
rect(F.POP_SIZE, F.POP_SIZE),
```

### IN-03: `clearBurst` uses magic numbers `80`, `4`/`3` for size and grow factor

**File:** `src/fx.js:172, 189`
**Issue:** `rect(80, 80)` and the grow `const s = 1 + 3 * v` (scale 1→4) are hard-coded,
while every other FX magnitude is CONFIG-driven (the module's own docstring stresses
"no magic numbers"). These two escape the config discipline that `config.js:102-122`
establishes for the rest of the juice layer.
**Fix:** Promote to `CONFIG.FX`, e.g. `BURST_SIZE: 80` and `BURST_GROW: 4`, and read
them in `clearBurst()`.

---

_Reviewed: 2026-06-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
