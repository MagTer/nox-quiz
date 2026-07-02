# Phase 15: Challenge Seam + Locked-Door Mechanic - Pattern Map

**Mapped:** 2026-07-02
**Files analyzed:** 7 (2 new, 5 modified/restored)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/ui/challenge.js` (NEW) | component/service (in-world overlay) | request-response (question -> answer -> callback) | `src/ui/mathGate.js` (entire current body) | exact — this is a literal extraction/rename of the analog |
| `src/ui/mathGate.js` (MODIFIED — becomes thin wrapper) | service/adapter | request-response | itself, pre-extraction (231 lines) → collapses to ~10-line adapter over `challenge.js` | exact — same file, contract-preserving rewrite |
| `src/mechanics/door.js` (NEW) | controller/mechanic (collision-triggered) | event-driven (onCollide → freeze → challenge → destroy → unfreeze) | `src/scenes/game.js` `onReachGoal()` (lines 159-222) | role-match — same shape, but MUST add the unfreeze `onReachGoal()` never needed |
| `src/config.js` (MODIFIED — add `CONFIG.DOOR`) | config | CRUD (static tuning object) | `CONFIG.GATE` (lines 60-64) + `CONFIG.SELECT` (lines 156-165, esp. `LOCKED_GREY`/`LOCKED_BORDER` precedent in `src/scenes/select.js:39,43`) | exact — same file, same block-per-feature pattern |
| `src/levels/build.js` (MODIFIED — consume `doors` array) | service (level instantiation) | CRUD (data → tagged entities) | itself — the existing `spikes`/`goal` loops (lines 93-113) | exact — same file, same loop-over-array idiom |
| `src/levels/level-01.js` (MODIFIED — add one `doors` entry) | model (pure data) | transform (descriptor consumed by build.js) | itself — the existing `spikes`/`checkpoints` arrays (lines 76-99) | exact — same file, same data-literal idiom |
| `scripts/check-gate.sh` (RESTORE + re-point) | test/tooling | batch (static structural gate) | `.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` (archived original) | exact — restore-and-edit source |
| `scripts/check-import-safety.sh` (MODIFIED — extend scanned-file list) | test/tooling | batch | itself — Section 0/2 `for f in ...` loops (lines ~90-95, ~140-145) | exact — same file, list-extension edit |

## Pattern Assignments

### `src/ui/challenge.js` (component, request-response) — NEW

**Analog:** `src/ui/mathGate.js` (READ IN FULL — this is a structural lift, not a loose reference)

**Header/discipline comment pattern** (lines 1-32 of `mathGate.js`):
```javascript
// One-way dependency (GATE-06): imports the brain and leaf config constants only —
// never the scene layer. ENGINE-GLOBAL DISCIPLINE: Kaplay primitives (add, text, rect,
// color, opacity, outline, anchor, pos, fixed, z, area, onKeyPress, center, width,
// height, rgb, destroyAll, shake) come from Kaplay `global: true` and are used as bare
// globals inside the function body only — never imported, never referenced at module
// top level (a727c13). IN-WORLD, NOT A SYSTEM POPUP (GATE-01): every visual is a Kaplay
// canvas object (text()/rect()), no DOM sink. FORGIVING + NO TIME PRESSURE (GATE-04/05):
// wrong pick nudges + keeps the SAME question; no timer anywhere.
```
Carry this comment block into `challenge.js` verbatim except: drop the "math gate" framing → "shared in-world challenge component"; keep every invariant citation (GATE-01/04/05/06) since they still apply to the shared seam.

**Imports pattern** (lines 34-35):
```javascript
import { createBrain } from "../math/brain.js";
import { CONFIG } from "../config.js";
```
Identical for `challenge.js` — same relative depth (`src/ui/`).

**Core signature — rename `onClear` to `onSuccess`, add optional `prompt`** (lines 45-65):
```javascript
export function openMathGate({ brain, onClear } = {}) {
  if (!brain) brain = createBrain();
  const q = brain.nextQuestion();
  const display = `${q.a} × ${q.b}`;
  let cleared = false;
  add([fixed(), z(9999), "math-gate"]);
  // ...dim layer, panel, question text — all "math-gate" tagged...
```
Becomes (per RESEARCH Pattern 1, CONTEXT's explicit `onSuccess` rename + optional prompt override, kept as a plain STRING not an options object per CONTEXT's discretion note):
```javascript
export function openChallenge({ brain, onSuccess, prompt } = {}) {
  if (!brain) brain = createBrain();
  const q = brain.nextQuestion();
  const display = prompt ?? `${q.a} × ${q.b}`;
  let cleared = false;
  add([fixed(), z(9999), "challenge"]);   // NEW tag — mechanic-agnostic (see Pattern 2 naming caution below)
  // ...dim layer, panel, question text — all "challenge" tagged...
```

**Answer boxes / dual input (mouse + keys 1-4)** (lines 108-158) — copy VERBATIM, only the tag string changes from `"math-gate"` to `"challenge"` everywhere it appears (dim layer, panel, question text, boxes, labels).

**choose(i) bounds guard + brain report** (lines 164-172) — copy VERBATIM (V5 input-validation invariant: `i < 0 || i >= q.choices.length`).

**Wrong-answer branch (forgiving, no penalty)** (lines 176-182) — copy VERBATIM:
```javascript
if (!correct) {
  if (box) box.color = rgb(ACCENT_RED[0], ACCENT_RED[1], ACCENT_RED[2]);
  shake(6);
  return;
}
```

**Correct-answer branch — this is where `challenge.js` and `mathGate.js` DIVERGE from the original**: the original inlines the "LEVEL CLEAR" banner render (lines 184-219) inside the correct branch. Per RESEARCH Pattern 2 (Assumption A1, recommended path), `challenge.js`'s correct branch should be ONLY:
```javascript
cleared = true;
close();                          // cancel key controllers + destroyAll("challenge")
onSuccess?.({ table: q.a });      // carry the cleared table so callers award XP / react
```
No "LEVEL CLEAR" text, no `gate-cleared` tag — that celebration UI is END-OF-LEVEL-SPECIFIC and moves to `mathGate.js`'s wrapper (see next section). `challenge.js` must not know the word "level".

**close() teardown (anti-leak)** (lines 222-230) — copy VERBATIM, only the tag argument changes:
```javascript
function close() {
  keyCtrls.forEach((c) => c.cancel());
  destroyAll("challenge");   // was destroyAll("math-gate")
}
```

**Palette constants** (lines 38-43) — copy VERBATIM (`PANEL_BG`, `PANEL_BORDER`, `BOX_BG`, `BOX_BORDER`, `ACCENT_GREEN`, `ACCENT_RED`); `ACCENT_GREEN` may become unused in `challenge.js` once the LEVEL-CLEAR banner moves out — verify at implementation time whether it's still referenced (it is not needed if the celebration UI fully relocates to `mathGate.js`) and drop it here if so, to avoid an unused-const smell (not a functional requirement, just cleanliness).

---

### `src/ui/mathGate.js` (adapter, request-response) — MODIFIED (thin wrapper)

**Analog:** itself (pre-extraction) — RESEARCH Pattern 2 gives the exact target shape:
```javascript
import { openChallenge } from "./challenge.js";

export function openMathGate({ brain, onClear } = {}) {
  openChallenge({
    brain,
    onSuccess({ table }) {
      // Relocate the "LEVEL CLEAR" banner render here (was mathGate.js lines 199-217),
      // tagged "gate-cleared" (UNCHANGED tag — challenge.js's own close() destroyAll("challenge")
      // never touches it, since the tags no longer collide).
      add([
        rect(width(), height()),
        pos(0, 0),
        color(0, 0, 0),
        opacity(CONFIG.GATE.DIM_OPACITY),
        fixed(),
        z(9990),
        "gate-cleared",
      ]);
      add([
        text("LEVEL CLEAR", { size: 30 }),
        anchor("center"),
        pos(center().x, center().y),
        color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]),
        fixed(),
        z(9994),
        "gate-cleared",
      ]);
      onClear?.({ table });   // forward to the scene's real onClear — game.js call site UNCHANGED
    },
  });
}
```
Keep `ACCENT_GREEN` (and the dark-grunge palette constants used only by the banner) local to `mathGate.js` now — `challenge.js` no longer needs them if the banner fully relocates.

**Verification point (explicit plan task):** `game.js`'s call site `openMathGate({ brain, onClear({ table }) {...} })` (game.js lines 174-221) needs ZERO changes — this is the MECH-01 "behaves identically" proof. Confirm via the mandatory real-browser boot that "LEVEL CLEAR" still renders exactly as before.

---

### `src/mechanics/door.js` (mechanic/controller, event-driven) — NEW

**Analog:** `src/scenes/game.js` `onReachGoal()` (lines 159-222) — ADAPTED, not copied verbatim (RESEARCH Pattern 3 + Pitfall 1/4 are the load-bearing deltas).

**Freeze pattern to copy** (game.js lines 159-169):
```javascript
function onReachGoal() {
  if (goalReached) return;      // fire-once latch — mirror as `opened` in door.js
  goalReached = true;
  player.vel = vec2(0);          // clean stop BEFORE pausing — copy this ordering
  player.paused = true;          // halts onUpdate + excludes from collision spatial-hash
  openMathGate({ brain, onClear({ table }) { ... } });
}
player.onCollide("goal", onReachGoal);
```

**door.js target shape** (per RESEARCH Pattern 3 code example, adapted from the above with the two critical deltas — fire-once latch placed AFTER success per goal precedent, and the mandatory unfreeze):
```javascript
import { openChallenge } from "../ui/challenge.js";
import * as fx from "../fx.js";

export function wireDoor(doorObj, { player, brain }) {
  let opened = false;   // closure-local fire-once latch (anti-leak: never module-level)

  player.onCollide("door", () => {
    if (opened) return;
    player.vel = vec2(0);
    player.paused = true;

    openChallenge({
      brain,
      onSuccess() {
        opened = true;          // latch AFTER success, mirrors goalReached's placement
        fx.clearBurst();        // JUICE-03 precedent, reused as-is — no new fx function
        destroy(doorObj);       // MUST happen BEFORE the unpause (Pitfall 4 ordering)
        player.paused = false;  // CRITICAL — onReachGoal() never does this (scene transitions
                                 // away instead); door.js is mid-level and MUST undo the freeze
                                 // or the player is permanently soft-locked (Pitfall 1).
      },
    });
  });
}
```

**Door entity creation (visual + solid collider)** — analog is `build.js`'s spike/goal tagged-entity idiom (see next section) rather than `game.js`; `door.js` should expose the wiring function above, while entity creation happens in `build.js` per the CONTEXT/RESEARCH architecture split (`door.js` "owns" collision+challenge-invocation, `build.js` instantiates the entity, `game.js`'s scene body calls `wireDoor(doorEntity, { player, brain })` once per door — mirroring how `player.onCollide("goal", onReachGoal)` is wired in the scene body today).

**Visual — locked-tile "X" glyph precedent** (`src/scenes/select.js` lines 36-46, 90-101):
```javascript
const LOCKED_GREY = [0x44, 0x44, 0x44];   // locked tile fill
const LOCKED_BORDER = [0x55, 0x55, 0x55]; // dim neutral outline — NOT the accent-green
// ...
const fillColor = t.state === "locked" ? LOCKED_GREY : ...;
const borderColor = t.state === "locked" ? LOCKED_BORDER : SELECTABLE_BORDER;
```
`CONFIG.DOOR` (see config.js section below) should mirror these exact RGB triples so the "locked" visual language reads identically door-vs-tile per CONTEXT.md's explicit instruction. Add a centered "X" glyph `text("X", {...})` over the door rect, same z-layering idiom as the select-tile glyph overlay.

**Anti-Pattern warning (from RESEARCH, must be stated in the plan verbatim):** do NOT copy `onReachGoal()` into `door.js` without adding `player.paused = false` in the `onSuccess` handler — this is the single highest-risk pitfall in the phase (Pitfall 1/4).

---

### `src/config.js` (config) — MODIFIED, add `CONFIG.DOOR` block

**Analog:** `CONFIG.GATE` (lines 60-64):
```javascript
GATE: {
  DIM_OPACITY: 0.6,
  PANEL_W: 420,
  PANEL_H: 220,
},
```
And `CONFIG.SELECT` (lines 156-165) for the locked-tile-language precedent (glyph/label sizing convention). New block, same file, same position style (grouped near `GATE`/`SELECT`):
```javascript
DOOR: {
  W: 32,           // px — door footprint width (Claude's discretion, tune to level-01 geometry)
  H: 64,           // px — door footprint height
  LOCKED_GREY: [0x44, 0x44, 0x44],   // mirror select.js LOCKED_GREY verbatim (visual-language match)
  LOCKED_BORDER: [0x55, 0x55, 0x55], // mirror select.js LOCKED_BORDER verbatim
  GLYPH_SIZE: 22,  // px — "X" lock glyph text size, mirror CONFIG.SELECT.GLYPH_SIZE precedent
},
```

---

### `src/levels/build.js` (service, CRUD data→entities) — MODIFIED, consume `doors` array

**Analog:** itself — the existing spike loop (lines 93-110) and goal creation (lines 112-113):
```javascript
for (const s of g.spikes) {
  add([
    sprite("spike"),
    pos(s.x, s.y),
    area({ shape: new Rect(vec2(0), CONFIG.SPIKE_HITBOX_W, CONFIG.SPIKE_HITBOX_H), offset: vec2(spikeOffX, spikeOffY) }),
    "spike",
  ]);
}
add([sprite("goal"), pos(g.goal.x, g.goal.y), area(), "goal"]);
```
New `doors` loop (mirrors this shape, but needs a SOLID collider per CONTEXT — closer to the merged-floor `body({ isStatic: true })` idiom, lines 58-64, than the trigger-only spike/goal/coin idiom):
```javascript
// --- Doors (Phase 15 MECH-02 — solid blocking collider until opened) ---
for (const d of g.doors ?? []) {
  add([
    rect(CONFIG.DOOR.W, CONFIG.DOOR.H),
    pos(d.x, d.y),
    color(CONFIG.DOOR.LOCKED_GREY[0], CONFIG.DOOR.LOCKED_GREY[1], CONFIG.DOOR.LOCKED_GREY[2]),
    outline(2, rgb(CONFIG.DOOR.LOCKED_BORDER[0], CONFIG.DOOR.LOCKED_BORDER[1], CONFIG.DOOR.LOCKED_BORDER[2])),
    area(),
    body({ isStatic: true }),   // solid — blocks the player while locked (CONTEXT-locked)
    "door",
  ]);
  add([
    text("X", { size: CONFIG.DOOR.GLYPH_SIZE }),
    anchor("center"),
    pos(d.x + CONFIG.DOOR.W / 2, d.y + CONFIG.DOOR.H / 2),
    "door-glyph",   // separate tag so it can be destroyed alongside the door body
  ]);
}
```
Note: `g.doors ?? []` guard keeps `build.js` backward-compatible with any level descriptor that doesn't yet define a `doors` array (mirrors the optional-slot defensive style already used for `mechanics`/`theme`/`parallax` in `level-01.js`).

**Note on entity return** — unlike spikes/coins (which `game.js` never needs a handle back to), `door.js`'s `wireDoor()` needs the actual door `GameObj` reference to `destroy()` it. `build.js` should either return the created door objects from `buildLevel()` (a structural change beyond today's `void` return) or `game.js` should look them up via `get("door")` after `buildLevel()` runs (mirrors no existing precedent exactly — Claude's discretion per CONTEXT, but `get("door")` is the lower-risk option since it requires zero `buildLevel()` signature change).

---

### `src/levels/level-01.js` (data model) — MODIFIED, add `doors` array

**Analog:** itself — the existing `spikes`/`checkpoints` array literal idiom (lines 76-99):
```javascript
spikes: [
  { x: 880, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
  { x: 1520, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
  { x: 2000, y: FLOOR_Y - CONFIG.SPIKE_SIZE },
],
```
New `doors` array (RESEARCH's Open Question #2 recommends placing near the second spike at x:1520 so success criterion #3's "next to a hazard, mid-level" is unambiguous):
```javascript
doors: [
  { x: 1480, y: FLOOR_Y - CONFIG.DOOR.H },   // one proof door, mid-level, adjacent to the x:1520 spike
],
```
Also update the `mechanics: []` placeholder comment (line 103) — it currently says "Phase 15/16 placeholder"; Phase 15 is the first to actually populate a mechanic-adjacent array (`doors` lives in `geometry`, not `mechanics`, per RESEARCH's structure — `mechanics: []` itself likely stays empty this phase since CONTEXT's `door.js` is wired imperatively from `game.js`/`build.js`, not data-declared as a "mechanic" entry; confirm this at planning time, it is Claude's discretion beyond the locked decisions).

---

### `scripts/check-gate.sh` (tooling) — RESTORE + re-point

**Analog:** `.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` (READ IN FULL — 60 lines, reproduced above)

**Restore-and-edit deltas** (apply to the archived source, write to `scripts/check-gate.sh`):
```bash
TARGET="$ROOT/src/ui/challenge.js"        # was src/ui/mathGate.js
...
grep -q 'export function openChallenge' "$TARGET" \    # was 'export function openMathGate'
  || fail "missing 'export function openChallenge' (public API contract)"
...
grep -q 'destroyAll(' "$TARGET" \                        # was plain 'destroy(' — challenge.js's
  || fail "missing 'destroyAll(' — tagged challenge objects not destroyed on close (leak)"  # close() uses destroyAll(tag), not destroy(obj); the archived script's check-5
                                                           # already asserted 'destroy(' which still
                                                           # substring-matches 'destroyAll(' — verify
                                                           # this at implementation time, may need no change
```
Keep sections 0/1/3/4/6/7/8 structurally identical (existence, syntax, bridge wiring `brain.nextQuestion`/`brain.reportResult`, camera-immune `fixed(`, no-DOM-sink negative grep, no-timer negative grep, one-way-import negative grep) — only the `TARGET` path and the exported-function-name assertion change.

**Additional per CONTEXT.md decision** ("mathGate.js and door.js sanity-checked as thin callers"): add two more grep assertions:
```bash
# 9. mathGate.js must be a thin caller of challenge.js (MECH-01 seam contract).
grep -q 'openChallenge' "$ROOT/src/ui/mathGate.js" \
  || fail "mathGate.js must call openChallenge() — it must be a thin wrapper over the shared seam"

# 10. door.js must be a thin caller of challenge.js too (same one-way seam, second consumer).
grep -q 'openChallenge' "$ROOT/src/mechanics/door.js" \
  || fail "door.js must call openChallenge() — the door mechanic must reuse the shared seam"
```

---

### `scripts/check-import-safety.sh` (tooling) — MODIFIED, extend scanned lists

**Analog:** itself — Section 0's `for f in ...` existence/syntax loop (lines ~90-95) and Section 2's negative a727c13 scan loop (lines ~140-145):
```bash
# Section 0 (existence+syntax) currently:
for f in \
  "src/scenes/title.js" "src/scenes/select.js" \
  "src/scenes/game.js" "src/main.js"; do
  ...
done

# Section 2 (negative a727c13 top-level trap) currently:
for f in "src/scenes/title.js" "src/scenes/select.js"; do
  ...
done
```
Per RESEARCH Pitfall 3 (Assumption A3, recommended): extend BOTH loops to add `"src/ui/challenge.js"` and `"src/mechanics/door.js"`. Both new modules already follow the a727c13 discipline (engine globals only inside function bodies per CONTEXT's explicit "same discipline as every other Phase 13/14 module"), so this should go GREEN immediately once added, not stay red — treat it as a real regression check, same posture as `game.js`'s calibration GREEN case.

## Shared Patterns

### One-way UI → Brain firewall (GATE-06)
**Source:** `src/ui/mathGate.js` lines 4-7 (comment) + `scripts/check-gate.sh` sections 3/8 (archived)
**Apply to:** `src/ui/challenge.js` (imports `../math/brain.js` only, never scene layer) and `src/mechanics/door.js` (imports `../ui/challenge.js` directly, NOT through `mathGate.js` — CONTEXT.md explicit: "does NOT go through mathGate.js, which stays end-of-level-specific").
```javascript
import { createBrain } from "../math/brain.js"; // only in challenge.js
import { openChallenge } from "../ui/challenge.js"; // only in door.js — never openMathGate
```

### Anti-leak: fire-once latch + global controller cancellation
**Source:** `src/ui/mathGate.js` lines 67-68 (`cleared` latch), 152-158 (`keyCtrls`), 227-230 (`close()`); `src/scenes/game.js` lines 47-49 (`goalReached`), closure-local `let`
**Apply to:** `challenge.js` (`cleared`), `door.js` (`opened`) — both MUST be closure-local `let`, NEVER module-level, and any captured global controller (key handlers) must be explicitly `.cancel()`-ed in a `close()`/teardown path.

### Engine-global discipline (a727c13)
**Source:** `src/ui/mathGate.js` lines 9-14 (comment), `src/fx.js` lines 15-22 (comment), enforced by `scripts/check-import-safety.sh`'s `TOPLEVEL_TRAP`
**Apply to:** `challenge.js` and `door.js` both — every Kaplay primitive (`add`, `body`, `area`, `destroy`, `onCollide`, `fixed`, `z`, `rect`, `pos`, `color`, `outline`, `text`, `anchor`) referenced ONLY inside exported function bodies, never at module top level.

### Solid vs. trigger-only collider idiom
**Source:** `src/levels/build.js` lines 54-71 (floors: `body({ isStatic: true })`, blocking) vs. lines 93-113 (spikes/coins/goal: `area()` only, trigger — no `body()`)
**Apply to:** `src/levels/build.js`'s new door loop — the door needs `body({ isStatic: true })` (a BLOCKING collider, unlike spike/coin/goal) because CONTEXT.md requires "the player physically cannot pass" while locked; this is the merged-floor collider shape, not the trigger-entity shape, despite doors otherwise looking like a single tagged entity (small footprint, no seam-stick merge needed since it's one entity, not a run).

### Self-cleaning fx (JUICE-03, reused as-is)
**Source:** `src/fx.js` lines 148-175 (`clearBurst()`), called from `src/scenes/game.js` line 197
**Apply to:** `src/mechanics/door.js`'s `onSuccess` handler — call `fx.clearBurst()` exactly as `game.js` does, no new fx function (CONTEXT-locked).

### Dark-grunge locked-visual language
**Source:** `src/scenes/select.js` lines 36-46 (palette consts), 90-101 (fill/border selection logic)
**Apply to:** `CONFIG.DOOR` block in `src/config.js` — reuse the exact `LOCKED_GREY`/`LOCKED_BORDER` RGB triples so the "locked" meaning reads consistently between select-screen tiles and the in-level door (CONTEXT.md explicit instruction).

## No Analog Found

None — every file in this phase has a strong, directly-applicable analog already in the codebase. This phase is explicitly framed by both CONTEXT.md and RESEARCH.md as a disciplined extraction + one new mechanic built entirely from existing, verified patterns (no new engine primitive, no new async pattern).

## Metadata

**Analog search scope:** `src/ui/`, `src/scenes/`, `src/levels/`, `src/fx.js`, `src/config.js`, `scripts/`, `.planning/milestones/v3.0-phases/10-math-gate-integration-port-the-brain/scripts/` (archived)
**Files scanned (read in full or targeted-section):** `src/ui/mathGate.js`, `src/scenes/game.js`, `src/scenes/select.js` (excerpts), `src/levels/build.js`, `src/levels/level-01.js`, `src/config.js` (excerpts), `src/fx.js`, `scripts/check-import-safety.sh`, `scripts/check-safety.sh`, archived `scripts/check-gate.sh`
**Pattern extraction date:** 2026-07-02
