---
phase: 14-multi-scene-shell
reviewed: 2026-06-29T21:20:33Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/scenes/title.js
  - src/scenes/select.js
  - src/main.js
  - src/scenes/game.js
  - src/config.js
  - scripts/check-import-safety.sh
  - scripts/fixtures/bad-scene.js
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-06-29T21:20:33Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the Phase 14 multi-scene shell: the title scene (NAV-01), the
level-select scene (NAV-02), the boot wiring in `main.js`, the `game.js`
clear→select return path (NAV-03), the shared `config.js` layout constants, and
the `check-import-safety.sh` a727c13 gate plus its `bad-scene.js` calibration
fixture.

The scene code itself is in good shape against the project's hard constraints:

- **Engine-global discipline (a727c13):** `title.js` and `select.js` reference
  every Kaplay primitive only inside the factory body. Module scope is limited to
  imports and inert color-array literals. Verified manually, not just via the gate.
- **NAV-04 state hygiene:** run state lives in closures (`select.js` `cursor` is a
  closure-local `let`; `game.js` owns coins/goal/checkpoint state in-closure). No
  `stay()`. Nav controllers are registered inside scene bodies. The one persistent
  global controller in `game.js` (`onHide`) is explicitly cancelled on
  `onSceneLeave` (lines 238-239).
- **ADHD-safe:** no `wait`/`loop`/`setTimeout` on the clear→select path; the clear
  branch in `game.js` calls `go("select")` directly with no auto-advance into a
  next level.
- **Pure-canvas UI:** scenes use only `text()`/`rect()` canvas objects — no DOM
  sinks, no `innerHTML`. The only `document.*` is the legitimate boot-time canvas
  wiring in `main.js`, not in a scene.
- **No direct storage in scenes:** `select.js` reads progress through the guarded
  `loadSave()` → `createProgress()` seam, never `localStorage` directly.
- **Derived-not-stored:** `select.js` (lines 57-63) derives `locked`/`unlocked`/
  `cleared` fresh on every entry via `isUnlocked(id, progress)` +
  `progress.isLevelCleared(id)`. It stores no `unlocked` boolean of its own.

The substantive concerns are all in the **safety gate itself**: the negative grep
in `check-import-safety.sh` is under-scoped relative to the engine surface it
claims to police, and the `bad-scene.js` fixture it is calibrated against is never
actually executed by the script. Because the scenes happen to be written
correctly, the gate currently passes — but it provides materially weaker
protection than its own header comments assert, and would fail to catch the most
natural form of the a727c13 regression it exists to prevent.

## Warnings

### WR-01: import-safety gate misses bare top-level engine-call statements

**File:** `scripts/check-import-safety.sh:48,76-80`
**Issue:** The negative-grep `TOPLEVEL_TRAP` only matches engine calls in two
shapes: (a) a `const|let|var` declaration whose initializer calls one of a fixed
list of factories, and (b) a `typeof` guard. It does **not** match a bare
top-level *expression statement*. A scene containing, at module top level:

```js
add([text("nope"), pos(0, 0)]);   // not assigned to anything
go("select");
onKeyPress("space", () => {});
```

passes the gate cleanly. This is the single most natural a727c13 regression — a
copy-pasted `add(...)`/`go(...)` left at module scope rather than inside the
factory — and it is exactly the class the gate's header (lines 6-8) says it
exists to catch ("never reference a Kaplay engine global at MODULE TOP LEVEL").
Verified: `add([text("nope")]);` as a bare statement does not match the regex.

**Fix:** Add an anchored alternative for bare top-level call statements, e.g.
extend the pattern with a leading-token form:

```bash
# (c) a column-0 bare call statement: <engine-fn>( ... )  not preceded by `function`/`.`
TOPLEVEL_TRAP="${TOPLEVEL_TRAP}|^(add|go|scene|onKeyPress|onKeyDown|onClick|onUpdate|setGravity|loadSprite)\("
```

Anchor to `^` so indented (in-body) calls still never match.

### WR-02: trap vocabulary omits the engine globals these scenes actually use

**File:** `scripts/check-import-safety.sh:48`
**Issue:** The factory list in the regex is
`add|rect|sprite|text|vec2|rgb|onKeyPress|onKeyDown|onClick|onUpdate`. The scenes
under guard lean heavily on globals that are **not** in this list — `go`,
`center`, `color`, `pos`, `anchor`, `fixed`, `z`, `outline`, `area`, `body`,
`setGravity`, `destroy`, `tween`, `scene`, `loadSprite`. The most likely
top-level slip in these specific files is a hoisted layout constant such as:

```js
const W = center();   // NOT caught — center is absent from the list
const HOME = go;      // NOT caught
```

Verified: `const W = center();` does not match the trap, while `sprite` (which
none of these scenes use) does. The gate's vocabulary is mismatched to the engine
surface it is policing, so even form-(a) assignments can pass with a banned
global. Combined with WR-01, the gate's real coverage is much narrower than its
header comments claim.

**Fix:** Expand the factory alternation to the globals the scenes actually
touch — at minimum add `go|center|color|pos|anchor|fixed|outline|area|body|setGravity|destroy|tween|scene|loadSprite`.
A maintainable alternative is to invert the check: derive the banned-symbol set
from the engine's exported globals rather than hand-maintaining a partial list
that drifts as scenes add primitives.

### WR-03: bad-scene.js fixture is never executed by the gate it calibrates

**File:** `scripts/check-import-safety.sh:76` and `scripts/fixtures/bad-scene.js:1-21`
**Issue:** Both the script header (lines 41-48) and the fixture header
(lines 9-12) describe `bad-scene.js` as the RED half of a calibration pair: the
fixture "must match" the negative grep so the gate is proven non-trivial. But the
script's Section 2 loop iterates over only `src/scenes/title.js` and
`src/scenes/select.js` — it never references `scripts/fixtures/bad-scene.js`
(`grep -n "fixture\|bad-scene" check-import-safety.sh` returns nothing). The
fixture therefore exists purely as documentation of an *intended* test that the
script does not perform. The "must stay GREEN on game.js" half is likewise never
run (game.js is excluded from Section 2). The gate has no self-test, so a future
edit that breaks the regex (e.g. a typo making it match nothing) would silently
pass with zero signal — defeating the fixture's stated purpose.

**Fix:** Add an explicit calibration step that asserts the regex fires on the bad
fixture and stays silent on a known-good scene, failing the build if either
expectation breaks:

```bash
# Self-test the trap so a broken regex can't silently pass.
strip_comments "$ROOT/scripts/fixtures/bad-scene.js" | grep -Eq "$TOPLEVEL_TRAP" \
  || fail "calibration: TOPLEVEL_TRAP no longer matches the bad fixture (regex is broken)"
strip_comments "$ROOT/src/scenes/game.js" | grep -Eq "$TOPLEVEL_TRAP" \
  && fail "calibration: TOPLEVEL_TRAP false-matches shipped game.js (over-broad)"
```

## Info

### IN-01: every select tile carries an accent-green outline regardless of state

**File:** `src/scenes/select.js:97`
**Issue:** All tiles — including `locked` ones — are created with
`outline(2, rgb(CURSOR_BORDER...))`, where `CURSOR_BORDER` is the accent green.
So a locked tile is grey-filled but framed in the same accent green used to signal
"selectable." The three states are still distinguishable by fill color
(grey/accent/blue) and glyph (`X`/`v`/none), so this is cosmetic, but the green
frame on a non-selectable tile slightly muddies the locked affordance for a
12-year-old. Consider a neutral/dim outline color for locked tiles.

### IN-02: cursor highlight is width-only, easy to miss on a single-tile row

**File:** `src/scenes/select.js:148-154`
**Issue:** `paintCursor()` distinguishes the active tile from the rest only by
outline width (5 vs 2), with no color change. On the current single-level row the
active cursor is visually near-identical to a static tile. With the engine-green
already used as the universal outline (IN-01), the keyboard cursor's position is
under-communicated. Consider also brightening/altering the active tile's outline
color, not just its width.

### IN-03: select-row layout has no wrap/overflow handling

**File:** `src/scenes/select.js:82-83` and `src/config.js:149-158`
**Issue:** Tiles are laid out in a single horizontal row at
`x = START_X + i * (TILE_W + GAP)` with no wrap. With `START_X=120`, `TILE_W=96`,
`GAP=24` on a 640px internal canvas, roughly the 5th tile's center already exceeds
the right edge. Only one level exists today so nothing overflows, but the layout
will silently run tiles off-canvas as `LEVEL_ORDER` grows. Not a defect now;
flag for whoever appends level 2+.

### IN-04: unused `data` parameter in both new scene factories

**File:** `src/scenes/title.js:35` and `src/scenes/select.js:50`
**Issue:** Both factories accept `data` but never read it. This is intentional
per the documented factory contract (the comments say so), so it is not a bug —
noted only for completeness. No change recommended; the contract consistency is
worth more than removing the unused param.

---

_Reviewed: 2026-06-29T21:20:33Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
