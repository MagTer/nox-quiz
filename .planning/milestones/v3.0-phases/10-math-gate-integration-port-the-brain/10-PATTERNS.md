# Phase 10: Math-Gate Integration (Port the Brain) - Pattern Map

**Mapped:** 2026-06-25
**Files analyzed:** 5 (2 NEW, 3 modified)
**Analogs found:** 5 / 5 (every new/modified file has a strong in-repo analog or verbatim port source)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/math/brain.js` (NEW) | model / pure logic | transform (request-response, in-memory) | `archive/math-lab.html` `QuestionSelector`+`PlayerState` (port source) + `src/level.js` (ES-module export shape) | exact (verbatim port) |
| `src/ui/mathGate.js` (NEW) | component / UI bridge | event-driven (input→render) | `src/scenes/game.js` goal-banner block (125-131) + `src/player.js` input handlers (40-73) | role-match |
| `src/scenes/game.js` (MODIFIED) | scene controller | event-driven | itself — `onReachGoal()` seam (113-133) | exact (in-place seam) |
| `src/config.js` (MODIFIED) | config | n/a (constant block) | itself (12-45) + archive CONFIG (604-619) | exact |
| `src/main.js` (likely UNCHANGED) | config / boot | n/a | itself (34-45) | n/a — no new asset/font this phase |

## Pattern Assignments

### `src/math/brain.js` (NEW — pure model, zero Kaplay)

**Port source:** `archive/math-lab.html` lines 604-619 (CONFIG), 663-711 (PlayerState EWMA slice), 911-1030 (QuestionSelector).
**ES-module shape analog:** `src/level.js` (named `export const`/`export function`, single-purpose, leaf import of `./config.js` only).

**Module-header + import convention** (copy the doc-header + import style from `src/level.js` lines 1-23, `src/player.js` lines 1-19). The new module lives at `src/math/`, one dir below `src/`, so sibling imports use `../`:
```js
import { CONFIG } from "../config.js"; // leaf constants only — BRAIN namespace. ZERO Kaplay imports (GATE-06).
```
Note: `src/level.js`/`src/player.js` use `./config.js` because they sit in `src/`; `brain.js` is in `src/math/`, so it is `../config.js` (same as `src/scenes/game.js` line 19).

**Anti-leak factory shape** — DO NOT copy the archive's IIFE-singleton (`const PlayerState = (() => { let xp ... })()`, archive 663). That singleton would leak accuracy across replays (RESEARCH Pitfall 2). Instead wrap the ported state in a `createBrain()` factory so each `go("game")` gets a fresh closure — mirroring the closure-state discipline `src/scenes/game.js` uses for `coinsCollected`/`goalReached` (lines 33-42) and `src/player.js` uses for `coyote`/`buffer` (lines 37-38):
```js
export function createBrain() {
  const accuracy = { 1:.5, 2:.5, 3:.5, 4:.5, 5:.5, 6:.4, 7:.4, 8:.4, 9:.4 }; // archive 667-668
  const history = {};                                                         // archive 670
  // ... ported shuffle / calculateWeights / weightedRandom / generateDistractors ...
  return {
    nextQuestion() { /* selectNext over closure accuracy/history */ },
    reportResult(table, isCorrect) { /* updateAccuracy EWMA */ },
  };
}
```

**EWMA core — port verbatim** (archive 690-700), reading `CONFIG.BRAIN.*` instead of the flat archive `CONFIG`:
```js
reportResult(table, isCorrect) {
  const prev = accuracy[table] !== undefined ? accuracy[table] : 0.5;
  accuracy[table] = prev * (1 - CONFIG.BRAIN.ACCURACY_ALPHA) +
                    (isCorrect ? 1 : 0) * CONFIG.BRAIN.ACCURACY_ALPHA;
  if (!history[table]) history[table] = [];
  history[table].push(isCorrect);
  if (history[table].length > CONFIG.BRAIN.MASTERY_WINDOW) history[table].shift();
}
```
Also port `getAccuracy` (702-704) and `isMastered` (707-711) as closure helpers — `calculateWeights` calls both.

**Weighted selector — port verbatim** (archive 911-1030). Key excerpts to copy exactly (do NOT re-tune exponents/`0.3`/`1.5` — explicitly out of scope):
- `shuffle` Fisher-Yates (915-921) — keep it; never `sort(()=>Math.random())`.
- `calculateWeights` (927-956): HARD `Math.pow(1-acc, 1.5)` ×`STRUGGLE_BOOST` if struggling, ×0.3 if mastered; EASY `Math.pow(1-acc, 0.8) * 0.3`; zero-total → equal-weight fallback.
- `weightedRandom` (960-969): roll-and-walk.
- `generateDistractors` (975-1009): ±1/±2 same-table, one wrong-table, ±3 fallback, last-resort pad; dedupe `v !== answer && v > 0`.
- `selectNext` (1014-1028) → rename to `nextQuestion()`. **Return-shape decision (resolve Open Question #1): use `{ a, b, answer, choices }`** mapping `a=table`, `b=multiplicand`, `choices=options` (already shuffled with the answer mixed in). The gate builds the display string itself (`q.a + " × " + q.b`), so DROP the archive's `question:` field.

**What to DROP (firewall — RESEARCH Pitfall 4):** `xp`, `level`, `addXp`, `getXp`, `getLevel`, `toJSON`, `fromJSON` from PlayerState; the entire `XpCalculator` (648-657); `CONFIG.DUNGEON` (621-642); `GameFSM` (1032+). Verify: `grep -Eqi 'xp|XpCalculator|DUNGEON|level\+\+|combat|potion|SAVE_KEY' src/math/brain.js` must return nothing.

---

### `src/ui/mathGate.js` (NEW — Kaplay UI bridge, the single seam)

**Analog:** `src/scenes/game.js` goal-banner block (125-131) for the `fixed()` screen-space overlay idiom; `src/player.js` (40-73) for the input-handler idioms; `src/level.js` (1-23) for the module-header + `Rect`-style fail-loud convention.

**Engine-global convention** (mirror `src/scenes/game.js` 14-17 / `src/level.js` 8-10 / `src/player.js` 9-11): Kaplay primitives come from `global: true` — do NOT import them; only import the brain. `src/ui/` is one dir below `src/`, so use `../`:
```js
import { createBrain } from "../math/brain.js"; // the ONLY consumer of the brain (one-way)
import { CONFIG } from "../config.js";          // GATE tuning constants
```

**Fixed screen-space overlay pattern** — copy the exact idiom from the existing "GOAL!" banner (`src/scenes/game.js` 125-131): `add([... fixed(), ...])` makes it camera-immune HUD over the paused/dimmed level. Extend it with `rect(width(), height())` dim layer + a centered panel + `text` + four `area()` answer boxes, all tagged `"math-gate"` and given a high `z()`:
```js
// Source idiom: src/scenes/game.js:125-131 (fixed() + anchor("center") + pos(center()))
const gateRoot = add([fixed(), z(9999), "math-gate"]);
add([rect(width(), height()), pos(0,0), color(0,0,0), opacity(CONFIG.GATE.DIM_OPACITY), fixed(), z(9990), "math-gate"]);
add([rect(CONFIG.GATE.PANEL_W, CONFIG.GATE.PANEL_H), anchor("center"), pos(center()),
     color(20,20,20), outline(2, rgb(0x33,0x33,0x33)), fixed(), z(9991), "math-gate"]);
add([text(q.a + " × " + q.b), anchor("center"), pos(center().x, center().y - 60), fixed(), z(9992), "math-gate"]);
```
Palette per CLAUDE.md dark-grunge mandate: bg `#0a0a0a` (already the `main.js` canvas bg, line 20), borders `#333`, neon-green/orange accents for the correct flash, NO pink.

**Dual-input answer boxes, leak-safe** — two idioms from the repo:
- Object-scoped click (auto-dies on destroy, like every `player.onCollide` in `src/scenes/game.js` 69/98/108): `box.onClick(() => choose(idx))`. `area()` provides `obj.onClick`.
- Global keys MUST be captured + cancelled (the player's bare `onKeyPress(JUMP_KEYS, ...)` at `src/player.js` 65 lives until scene end — fine there because the scene owns it, but a gate re-opens, so it would STACK — RESEARCH Pitfall 1):
```js
const keyCtrls = ["1","2","3","4"].map((k, i) => onKeyPress(k, () => choose(i)));
```

**Clean close — destroy tagged subtree + cancel key controllers** (combines `destroy(c)` idiom from `src/scenes/game.js` 101 with EventController cleanup):
```js
function close() {
  keyCtrls.forEach((c) => c.cancel()); // kill global key handlers (no leak)
  destroy("math-gate");                // remove every tagged gate object (boxes/panel/dim/text)
}
```
Required by validation: `grep -Eq 'cancel\(\)|destroy\(' src/ui/mathGate.js` must find BOTH.

**Bridge contract** (one-way gate→brain): pull once with `q = brain.nextQuestion()`; on each pick `brain.reportResult(q.a, correct)`; correct → flash + "LEVEL CLEAR" banner + `close()` + `onClear()` (called EXACTLY once — RESEARCH Pitfall 5); wrong → shake/flash the chosen box, KEEP the same `q`, re-enable input (no run-ending state — GATE-04). NO `wait()`/`loop()`/timer (GATE-05). NO `innerHTML`/`document.` (GATE-01 / XSS — use `text()` only).

---

### `src/scenes/game.js` (MODIFIED — replace the stub body 117-131)

**Self-analog:** the `onReachGoal()` fire-once seam already exists at lines 113-133 and is documented as "the SINGLE-POINT handoff seam" (110-112). Modify IN PLACE — do not add a second goal handler.

**Keep (lines 113-124):** the `goalReached` fire-once latch (114-115), `player.vel = vec2(0)` clean stop (123), and `player.paused = true` gentle freeze (124). The freeze already neutralizes movement input (RESEARCH Pitfall 3 / Assumption A2 — run+jump both live in the paused `player.onUpdate`).

**Replace (lines 125-131, the `text("GOAL!")` banner):** construct a fresh brain in the scene closure (anti-leak) and hand off to the gate. Add the import alongside the existing ones (19-22):
```js
import { createBrain } from "../math/brain.js";
import { openMathGate } from "../ui/mathGate.js";
```
Inside `onReachGoal()`, after the freeze (replacing the banner `add([...])`):
```js
const brain = createBrain(); // fresh per game — held in scene closure (anti-leak, like coinsCollected)
openMathGate({
  brain,
  onClear() {
    // This phase: simple LEVEL CLEAR (Phase 12 polishes). Single level — no go() to next.
    // Phase 11 (XP award) hooks here later. Player stays frozen = cleared.
  },
});
```
The `brain` may instead be created once near the other closure state (33-42) and passed in — either is fine as long as it is closure-local, never module-level.

---

### `src/config.js` (MODIFIED — add BRAIN/GATE namespaces)

**Self-analog:** the existing flat `CONFIG = { ... }` block (12-45) with grouped `// ---` section comments and inline-commented constants. Follow that exact comment style. Port the archive CONFIG values (604-619) under a nested `BRAIN` namespace (the archive's `CONFIG.DUNGEON = {...}` at 622 shows the nested-namespace precedent):
```js
// --- Math brain (ported verbatim from archive/math-lab.html 604-619 — DO NOT re-tune) ---
BRAIN: {
  ACCURACY_ALPHA:     0.15, // EWMA weight for a new answer
  MASTERY_THRESHOLD:  0.80, // 80% over last MASTERY_WINDOW → reduce drilling
  STRUGGLE_THRESHOLD: 0.60, // below this → STRUGGLE_BOOST weight
  STRUGGLE_BOOST:     1.5,
  MASTERY_WINDOW:     10,    // sliding window for mastery check
  HARD_TABLES:        [6, 7, 8, 9],
  EASY_TABLES:        [1, 2, 3, 4, 5],
},
// --- Math gate UI (dark-grunge panel; Phase 12 retunes visuals) ---
GATE: {
  DIM_OPACITY: 0.6, // full-screen dim behind the panel
  PANEL_W:     420,
  PANEL_H:     220,
},
```
DROP all XP/dungeon constants (`XP_EASY/HARD`, `BASE_XP`, `LEVEL_MULT`, `SAVE_KEY`, `ADVANCE_DELAY_MS`, `SEGMENT_COUNT`, and the whole `CONFIG.DUNGEON`) — Phase 11/never. The exact `HARD_TABLES`/`EASY_TABLES` glyph and value table must match the archive verbatim (the selection math is locked).

---

### `src/main.js` (likely UNCHANGED)

No new sprite/font/asset this phase — the gate uses Kaplay's built-in default bitmap font (no `loadFont` exists anywhere in the repo; RESEARCH Standard Stack). The `loadSprite` block (34-45) is the analog IF a future asset is added, but none is needed. Only touch `main.js` if the first playtest shows the `×` (U+00D7) glyph renders as tofu (Assumption A1) — and even then the fix is in `mathGate.js` (`'x'` fallback), not here.

## Shared Patterns

### Anti-leak closure state (factory / scene-closure, NEVER module-level `let`)
**Source:** `src/scenes/game.js` 33-42 (`coinsCollected`/`goalReached`), `src/player.js` 37-38 (`coyote`/`buffer`), and the IIFE-closure in `archive/math-lab.html` 663-711.
**Apply to:** `src/math/brain.js` (`createBrain()` factory — fresh accuracy/history per game), `src/ui/mathGate.js` (no module-level gate state; capture `keyCtrls` locally).
```js
// Pattern: all run/session state lives in a per-construction closure.
export function createBrain() { const accuracy = {...}; const history = {}; return {...}; }
```

### Engine-global discipline (do NOT import Kaplay primitives)
**Source:** `src/scenes/game.js` 14-17, `src/level.js` 8-10, `src/player.js` 9-11, `src/camera.js` 11-12.
**Apply to:** `src/ui/mathGate.js` — use `add/text/rect/fixed/z/onKeyPress/onClick/area/color/opacity/outline/anchor/center/width/height/destroy/rgb` as bare globals; import ONLY `../math/brain.js` and `../config.js`. (`src/math/brain.js` imports NOTHING from Kaplay — GATE-06.)

### Relative-import depth convention
**Source:** `src/scenes/game.js` 19-22 (`../` from `src/scenes/`), vs `src/level.js` 23 (`./` from `src/`).
**Apply to:** `src/math/brain.js` and `src/ui/mathGate.js` both sit one level below `src/`, so they import `../config.js` / `../math/brain.js` — NOT `./`.

### Object-scoped handlers auto-clean; global handlers must be cancelled
**Source:** `src/scenes/game.js` 69/98/108 (`player.onCollide(...)` — object-scoped, dies with the scene) vs `src/player.js` 65 (`onKeyPress(JUMP_KEYS, ...)` — global, survives until scene end).
**Apply to:** `src/ui/mathGate.js` — prefer `box.onClick` (auto-dies on `destroy`); for the global `onKeyPress("1".."4")`, capture each EventController and `.cancel()` in `close()` (the gate re-opens, so leaks stack — RESEARCH Pitfall 1).

### No-magic-numbers → all tunables in config.js
**Source:** `src/config.js` 1-11 header ("no magic numbers in the ... logic modules") + how `src/player.js`/`src/camera.js` read every number from `CONFIG.*`.
**Apply to:** `brain.js` reads `CONFIG.BRAIN.*`; `mathGate.js` reads `CONFIG.GATE.*` (panel size, dim opacity). No literal tuning constants in the new modules.

### XSS / DOM-sink guard (Kaplay text() only)
**Source:** `src/scenes/game.js` 118 comment ("Rendered as a Kaplay canvas text() (NOT a DOM string sink) — no XSS path (T-09-07)").
**Apply to:** `src/ui/mathGate.js` — render the question and answers via `text()`; never `innerHTML`/`document.`/`alert()`.

## No Analog Found

None. Every new file has either a verbatim port source (`brain.js` ← archive) or strong in-repo idiom analogs (`mathGate.js` ← game.js overlay + player.js input). The only genuinely new structural element is the `src/math/` and `src/ui/` directories (do not exist yet — create them this phase).

## Metadata

**Analog search scope:** `src/` (all 7 modules: config, main, level, player, camera, scenes/game), `archive/math-lab.html` (port source, lines 600-1030), `lib/` (Kaplay symbol availability — confirmed in RESEARCH).
**Files scanned:** 8 read (game.js, config.js, player.js, level.js, main.js, camera.js, archive 600-720, archive 905-1034) + directory listing.
**Pattern extraction date:** 2026-06-25
