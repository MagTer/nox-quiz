# Phase 14: Multi-Scene Shell - Pattern Map

**Mapped:** 2026-06-29
**Files analyzed:** 6 (2 new scenes, 1 new script, 2 modifies, 1 optional UI helper)
**Analogs found:** 6 / 6 (every new/modified file has a strong in-repo analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/scenes/title.js` (NEW) | scene factory | event-driven (input → `go`) | `src/scenes/game.js` | exact (same scene-factory shape; far simpler body) |
| `src/scenes/select.js` (NEW) | scene factory + in-scene canvas UI | request-response (read registry/progress → render → input → `go`) | `src/scenes/game.js` (factory shell) + `src/ui/hud.js` (canvas UI idiom) + `src/ui/mathGate.js` (dual-input + app-bus cancel) | exact (composes three proven idioms) |
| `src/scenes/game.js` (MODIFY) | scene factory | event-driven | itself (extend `onClear` + add Escape ctrl) | self |
| `src/main.js` (MODIFY) | engine shell / boot | config (register scenes + boot) | itself (lines 63-68) | self |
| `scripts/check-import-safety.sh` (NEW) | verification gate (bash) | batch/transform (read files → assert) | `scripts/check-progress.sh` (`strip_comments` + scoped negative grep + `node --check` loop) | exact (same gate scaffolding) |
| `src/ui/selectTiles.js` (NEW, OPTIONAL) | in-scene UI helper factory | transform (tile model → canvas objects) | `src/ui/hud.js` (`mountXxx` factory returning a small API) | exact (Claude's Discretion — inline in select.js is also fine) |

---

## Pattern Assignments

### `src/scenes/title.js` (NEW — scene factory, event-driven)

**Analog:** `src/scenes/game.js` (the shipped scene-factory template). Title is the simplest possible instance of it: closure-only, body-only engine globals, dual-input controllers that `go("select")`.

**Scene-factory shape to copy** — `src/scenes/game.js:31-33`:
```javascript
export function gameScene(data) {
  // Engine gravity for this scene (px/s^2). Set once on scene entry.
  setGravity(CONFIG.GRAVITY);
```
Title mirrors this exactly: `export function titleScene(data) { /* every engine global INSIDE here */ }`. No `setGravity` needed; the body just draws + wires input.

**Canvas-draw idiom to copy** — from `src/ui/hud.js:56-63` (text) and `src/ui/mathGate.js:86-95` (centered panel/text). For the title use `add([ text("Math Lab", {size}), anchor("center"), pos(center()), color(...), fixed(), z(...) ])`. Pure canvas `text()`/`rect()` only — NO `innerHTML`/`document.*` (no-DOM-sink canon, mathGate.js:18-23).

**Dual-input start controllers** (registered INSIDE the body so `go()` tears them down) — pattern from `src/ui/mathGate.js:147,158`:
```javascript
// obj-scoped click (mathGate.js:147) — auto-cleaned when the object is destroyed:
box.onClick(() => choose(i));
// app-bus key controllers (mathGate.js:158) — auto-cleared by go() in Kaplay 3001:
const keyCtrls = ["1", "2", "3", "4"].map((k, i) => onKeyPress(k, () => choose(i)));
```
For title: `onKeyPress("enter", () => go("select"))`, `onKeyPress("space", () => go("select"))`, plus a full-screen `onClick(() => go("select"))` (laptop mouse). These plain navigation controllers need no manual cancel in 3001 (app bus is cleared on `go()`), but cancelling is harmless.

**Palette constants** — copy the module-scope data literals (NOT engine calls) from `src/ui/hud.js:35-37` / `src/ui/mathGate.js:38-43`:
```javascript
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // neon-green accent, NO pink
const HINT_FG = [0xe8, 0xe8, 0xe8];
```
These are safe at module scope — they call nothing (a727c13). Engine `color(...)`/`rgb(...)` go INSIDE the body.

**Layout constants** — add a `CONFIG.TITLE` block following the existing `CONFIG.HUD`/`CONFIG.HINT` pattern (`src/config.js:94-103,138-142`) so no magic numbers live in the scene.

---

### `src/scenes/select.js` (NEW — scene factory + in-scene canvas UI, request-response)

**Analogs:** `src/scenes/game.js` (factory shell) + `src/ui/hud.js` (canvas UI) + `src/ui/mathGate.js` (dual-input + boxes-array + app-bus cancel) + reads `src/levels/index.js` and `src/progress.js`.

**Fresh-read-every-entry pattern** (NAV-04 clean state) — compose `src/progress.js:270` (`loadSave`), `:57` (`createProgress`), and `src/levels/index.js:23,36,28` at the TOP of the factory body:
```javascript
// inside selectScene(data):
const saved = loadSave();                 // progress.js:270 — guarded, never throws, defaults under node
const progress = createProgress(saved);   // progress.js:57 — fresh closure, no module-level state
const tiles = LEVEL_ORDER.map((id, i) => {            // levels/index.js:23 — ordered ids
  const cleared  = progress.isLevelCleared(id);       // progress.js:128 — strict === true
  const unlocked = isUnlocked(id, progress);          // levels/index.js:36 — DERIVED, never stored
  const state = cleared ? "cleared" : unlocked ? "unlocked" : "locked";
  return { id, i, state };
});
```
CRITICAL (RESEARCH Pitfall 2 / levels/index.js:5-7 doc): the select screen READS `isUnlocked` — it must NOT compute or store its own "unlocked" booleans. One source of truth.

The consumed read APIs verified present:
- `LEVEL_ORDER` — `src/levels/index.js:23` (ordered id list, the unlock backbone)
- `isUnlocked(id, progress)` — `src/levels/index.js:36-44` (forgiving: `i <= 0` → always open; null progress → only first open)
- `getLevel(id)` — `src/levels/index.js:28-30` (forgiving fallback to `LEVELS[0]`)
- `loadSave()` — `src/progress.js:270-294` (forgiving; every failure → `defaults()`)
- `createProgress(saved)` — `src/progress.js:57` (pure; never reads localStorage)
- `progress.isLevelCleared(id)` — `src/progress.js:128-130`

**Three-state tile render** — copy hud.js's tagged `add([...])` canvas idiom (`src/ui/hud.js:56-84`); give each state a distinct color/glyph (locked = dim + lock glyph, unlocked = bright accent, cleared = check mark). Tag tiles (e.g. `"select"`) so `go()` teardown wipes them; mount inside the closure (factory, no module-level singleton — hud.js:24-29). Reuse `fixed()` + `z()` for screen-space draws (hud.js:55).

**Dual-input selection (keyboard cursor + mouse click), locked tiles never selectable** — pattern from `src/ui/mathGate.js:108-159`:
```javascript
const boxes = [];                                   // keep refs to recolor the cursor (mathGate.js:117,174)
q.choices.forEach((choice, i) => {
  const box = add([ rect(BOX_W, BOX_H), area(), ... , "answer", { idx: i } ]); // :122-134
  box.onClick(() => choose(i));                     // :147 obj-scoped click — auto-cleaned
  boxes.push(box);
});
const keyCtrls = ["1","2","3","4"].map((k,i) => onKeyPress(k, () => choose(i))); // :158 app-bus
```
For select: each UNLOCKED tile gets `tile.onClick(() => go("game", { levelId: id }))`; LOCKED tiles get NO click handler and are skipped by the cursor. Arrow keys move a closure-local cursor among unlocked tiles; Enter plays it:
```javascript
const navCtrls = [
  onKeyPress("left",  () => moveCursor(-1)),
  onKeyPress("right", () => moveCursor(+1)),
  onKeyPress("enter", () => playCursor()),  // go("game", { levelId: tiles[cursor].id })
];
```
Cursor index is closure-local (`let cursor = ...`), NEVER a module-level `let` (anti-leak — game.js:42-45 / RESEARCH Pitfall 2).

**Cross-scene handoff** — `go("game", { levelId })` is the ONLY legal channel (RESEARCH "Don't Hand-Roll"; game.js:65 already reads `data?.levelId`). Never a module-level `selectedLevelId`.

**Belt-and-braces cancel** — only required for an app-bus controller you hold a handle to (Pattern 6); plain nav controllers are auto-cleared by `go()` in 3001. Mirror `src/scenes/game.js:225-226` only if a persistent controller (e.g. `onHide`) is added:
```javascript
const hideCtrl = onHide(() => writeSave(progress.serialize(brain.snapshot())));
onSceneLeave(() => hideCtrl.cancel());
```

---

### `src/scenes/game.js` (MODIFY — scene factory, event-driven)

**Analog:** itself. Two surgical edits; levelId threading is ALREADY wired.

**(1) levelId read — ALREADY EXISTS, do NOT rebuild** — `src/scenes/game.js:65`:
```javascript
const level = getLevel(data?.levelId ?? LEVEL_ORDER[0]); // forgiving: junk id → LEVEL_ORDER[0]
```
Select supplies the payload via `go("game", { levelId })`; no game.js change needed for the read.

**(2) Clear path → return to select** — extend the EXISTING `onClear` (`src/scenes/game.js:168-195`). The `markCleared` + `writeSave` persist already exist (lines 180, 194); ADD `go("select")` as the final line of `onClear`:
```javascript
onClear({ table }) {
  const leveledUp = progress.addXp(table);   // EXISTING (game.js:175)
  progress.markCleared(level.id);            // EXISTING (game.js:180) — SAVE-06
  hud.refresh(); if (leveledUp) hud.flashLevelUp(); // EXISTING (game.js:183-184)
  fx.clearBurst();                           // EXISTING (game.js:189)
  writeSave(progress.serialize(brain.snapshot())); // EXISTING (game.js:194)
  go("select");                              // NEW — return to select; next level derives unlocked
}
```
NOTE: today the gate renders a TERMINAL "LEVEL CLEAR" banner and the scene stays (mathGate.js:184-217). Adding `go("select")` turns that into a return — the `gate-cleared` objects are torn down by `go()` cleanly (they are `fixed()` canvas objects, no `stay()`). Do NOT add a `wait()`/timer to "let the banner show" — SAFE-01 violation (RESEARCH Pitfall 4; check-safety.sh bans `wait(`/`loop(`/`setTimeout`). If a beat is wanted, gate it on input, never elapsed time.

**(3) Escape → select** — add a controller inside the scene body (NAV-03 agency):
```javascript
onKeyPress("escape", () => go("select")); // NEW — bail back to select; auto-cleared by go()
```

---

### `src/main.js` (MODIFY — engine shell / boot)

**Analog:** itself, lines 13, 66-68.

**Generalize boot** — extend the existing single registration (`src/main.js:66-68`):
```javascript
// CURRENT:
scene("game", gameScene);
go("game", { startX: 64, startY: 64 });
```
to:
```javascript
import { titleScene } from "./scenes/title.js";   // NEW (mirror line 13 import)
import { selectScene } from "./scenes/select.js"; // NEW
// ...
scene("title", titleScene);   // NEW
scene("select", selectScene); // NEW
scene("game", gameScene);     // EXISTING
go("title");                  // CHANGED — was go("game", { startX: 64, startY: 64 })
```
LEAVE the `loadSprite(...)` asset calls (`src/main.js:50-61`) and the canvas display-scale block (`:34-38`) untouched — assets load before any scene runs. `startX/startY` defaults stay in game.js (`:38-39`), so `go("game", { levelId })` need not pass start coords.

---

### `scripts/check-import-safety.sh` (NEW — verification gate, batch/transform)

**Analog:** `scripts/check-progress.sh` — copy its scaffolding verbatim and re-scope.

**Scaffolding to copy** — `scripts/check-progress.sh:21-34`:
```bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
fail() { echo "import-safety checks: FAIL — $1" >&2; exit 1; }
strip_comments() { sed -E 's://.*$::' "$1"; }
```

**Existence + syntax loop** — copy the `node --check` loop shape from `scripts/check-progress.sh:40-45`, scoped to the scene modules + main.js:
```bash
for f in src/scenes/title.js src/scenes/select.js src/scenes/game.js src/main.js; do
  [ -f "$ROOT/$f" ] || fail "missing module: $f"
  node --check "$ROOT/$f" || fail "node --check failed (syntax error in $f)"
done
```

**Positive structural invariants** — assert each scene exports a factory and main.js registers + boots (mirrors check-progress.sh:108-115 positive greps):
```bash
grep -Eq 'export function .*[Ss]cene\(' "$ROOT/src/scenes/title.js"  || fail "title.js must export a scene factory"
grep -Eq 'export function .*[Ss]cene\(' "$ROOT/src/scenes/select.js" || fail "select.js must export a scene factory"
grep -q 'scene("title"'  "$ROOT/src/main.js" || fail "main.js must register the title scene"
grep -q 'scene("select"' "$ROOT/src/main.js" || fail "main.js must register the select scene"
grep -q 'go("title"'     "$ROOT/src/main.js" || fail "main.js must boot go(\"title\")"
```

**Negative a727c13 gate (SCOPED — the load-bearing detail)** — model on `scripts/check-progress.sh:117-126`. That gate is SCOPED to PURE modules (`level-01.js`, `index.js`) and EXPLICITLY excludes `build.js` because build.js legitimately uses engine globals INSIDE its body. The new gate must likewise assert "no engine global at MODULE TOP LEVEL" for the SCENE modules — NOT "no engine global anywhere" (RESEARCH Pitfall 5: a naive whole-file grep would false-flag the correct, body-internal `add(`/`text(` in game.js/title.js/select.js). The check-progress.sh:122-126 block to adapt (anchor the negative grep so it only matches column-0/top-level forms):
```bash
# check-progress.sh:122-126 (the idiom to re-scope for top-level traps):
for f in "src/levels/level-01.js" "src/levels/index.js"; do
  if strip_comments "$ROOT/$f" | grep -Eq 'typeof Rect|[^a-zA-Z]add\(|[^a-zA-Z]rect\(|[^a-zA-Z]sprite\(|[^a-zA-Z]vec2\(|kaplay'; then
    fail "engine global referenced in $f ..."
  fi
done
```
For scenes, anchor to top-level statement forms (see RESEARCH "check-import-safety.sh skeleton", lines 361-369): `^(const|let|var)[^=]*=[^=]*\b(add|rect|sprite|text|vec2|rgb|onKeyPress|onKeyDown|onClick|onUpdate)\(` and `^[[:space:]]*typeof (Rect|add|vec2|rgb)`. CALIBRATE against BOTH a bad fixture (a top-level `const c = add([...])` must go RED) and the shipped-good `game.js` (must stay GREEN).

---

### `src/ui/selectTiles.js` (NEW, OPTIONAL — in-scene UI helper factory)

**Analog:** `src/ui/hud.js` (the `mountXxx` factory template). OPTIONAL per Claude's Discretion (RESEARCH Open Question 2); inline tile drawing in select.js is equally acceptable for the single-row, few-tile layout.

**Factory shape to copy** — `src/ui/hud.js:51,147`:
```javascript
export function mountHud(progress) {     // hud.js:51 — factory, no module-level singleton
  // ... add([...]) tagged canvas objects, mounted in caller's scene closure ...
  return { refresh, flashLevelUp };      // hud.js:147 — small returned API
}
```
A `mountTiles({ tiles, onSelect })` would return e.g. `{ moveCursor, playCursor }`. Tag objects (`"select"`) so `go()` tears them down; engine globals only inside the function body (hud.js:8-12 discipline note). One non-engine import: `CONFIG` (hud.js:31).

---

## Shared Patterns

### Scene-factory / anti-leak discipline (applies to title.js, select.js)
**Source:** `src/scenes/game.js:31-65`, `:225-241`
**Apply to:** Every new scene.
```javascript
export function gameScene(data) {
  setGravity(CONFIG.GRAVITY);                 // engine global INSIDE the body (a727c13)
  const startX = data?.startX ?? 64;          // closure-local, seeded from go() payload
  let coinsCollected = 0;                      // closure-local run state — NEVER module-level
  // ... all add()/onKeyPress()/onUpdate() live here ...
}
```
- ALL state is `const`/`let` in the closure, seeded from `data`.
- NEVER a module-level `let` for run/selection state (game.js:42-45 comments; RESEARCH Pitfall 2).
- NEVER an engine global at module top level (throws at import; blanks the canvas — a727c13).
- NEVER introduce `stay()` this phase (the one way to leak across `go()`).

### Dual-input + app-bus controller cancel (applies to title.js, select.js)
**Source:** `src/ui/mathGate.js:147,158,227-230` and `src/scenes/game.js:225-226`
**Apply to:** Every scene that registers input.
```javascript
box.onClick(() => choose(i));                                  // obj-scoped — dies with the object
const keyCtrls = ["1","2","3","4"].map((k,i) => onKeyPress(k, () => choose(i))); // app-bus
// for a persistent controller you hold a handle to:
const hideCtrl = onHide(() => writeSave(...));
onSceneLeave(() => hideCtrl.cancel());                         // belt-and-braces (game.js:226)
```
In Kaplay 3001 `go()` clears the app bus, so plain nav `onKeyPress`/`onClick` need no manual cancel; only controllers you re-create each entry AND hold a stale reference to need the explicit `onSceneLeave(cancel)` (RESEARCH Pattern 6).

### Pure-canvas, no-DOM-sink UI (applies to title.js, select.js, selectTiles.js)
**Source:** `src/ui/hud.js:14-16`, `src/ui/mathGate.js:18-23`
**Apply to:** All new screens.
- Every visual is a Kaplay `text()`/`rect()` canvas object — no `innerHTML`/`document.*`/markup-string sink (no injection path; security V5/Tampering).
- Screen-space overlays use `fixed()` + high `z()` (hud.js:55-63).
- No direct `localStorage` access in scenes — read state through `loadSave()`/`createProgress()` (the validated, forgiving seam — progress.js:270, :57).

### Derived-unlock, single-source-of-truth (applies to select.js)
**Source:** `src/levels/index.js:5-7,36-44`
**Apply to:** The select screen's tile-state computation.
- Unlock is DERIVED from `LEVEL_ORDER` + cleared facts via `isUnlocked(id, progress)`. NEVER store or recompute "unlocked" in the scene or save (RESEARCH Pitfall 2 / "Don't Hand-Roll").

### Structural-gate idiom (applies to check-import-safety.sh)
**Source:** `scripts/check-progress.sh:21-45,108-126`
**Apply to:** The new a727c13 gate.
- `set -euo pipefail` + `ROOT=$(git rev-parse --show-toplevel)` + `fail()` + `strip_comments()`.
- A `node --check` existence/syntax loop; positive structural greps; a SCOPED negative grep (comment-stripped) — calibrated against a bad fixture AND the shipped-good files.

### No-timer mandate (applies to game.js clear path)
**Source:** `scripts/check-safety.sh:1-11,50-51` (bans `wait(`/`loop(`/`setTimeout`)
**Apply to:** The clear→select transition and any beat.
- `go("select")` directly in `onClear`, or gate a beat on input — NEVER on elapsed time (RESEARCH Pitfall 4).

---

## No Analog Found

None. Every new/modified file has a strong in-repo analog (the project deliberately shipped game.js/hud.js/mathGate.js/check-progress.sh as the templates this phase mirrors).

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All files have analogs. |

---

## Metadata

**Analog search scope:** `src/scenes/`, `src/ui/`, `src/levels/`, `src/`, `scripts/`, `src/config.js`
**Files scanned:** `src/scenes/game.js`, `src/main.js`, `src/ui/hud.js`, `src/ui/mathGate.js`, `src/levels/index.js`, `src/progress.js`, `src/config.js`, `scripts/check-progress.sh`, `scripts/check-safety.sh`
**Pattern extraction date:** 2026-06-29
