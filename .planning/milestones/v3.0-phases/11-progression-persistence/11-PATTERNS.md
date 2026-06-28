# Phase 11: Progression & Persistence - Pattern Map

**Mapped:** 2026-06-26
**Files analyzed:** 8 (2 new modules, 4 modified modules, 2 new Wave-0 scripts)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/progress.js` (NEW) | model + store | CRUD / file-I/O (localStorage) + transform (XP math) | `src/math/brain.js` (pure-factory shape) + `archive/math-lab.html` XpCalculator/PlayerState/PersistenceStore | exact (factory shape) + verbatim port (math/persistence) |
| `src/ui/hud.js` (NEW) | component (Kaplay UI) | request-response (one-way read of progress) + event-driven (level-up flash) | `src/ui/mathGate.js` (fixed() overlay idiom) + archive levelUpFlash keyframe | exact (overlay idiom) |
| `src/math/brain.js` (MOD) | model (pure) | transform (EWMA accuracy) | itself — `createBrain()` lines 40-56, 191-204 | self (additive extension) |
| `src/ui/mathGate.js` (MOD) | component (Kaplay UI) | event-driven (onClear callback) | itself — `onClear?.()` line 217 | self (one-line contract change) |
| `src/scenes/game.js` (MOD) | controller (scene wiring) | event-driven (collision → onClear) + request-response (boot load) | itself — `onReachGoal`/`onClear` lines 127-154, brain construct line 56 | self (wiring extension) |
| `src/config.js` (MOD) | config | n/a (leaf constants) | itself — `CONFIG.BRAIN` lines 49-57, `CONFIG.GATE` lines 60-64 | self (additive namespaces) |
| `scripts/check-progress.sh` (NEW) | test (structural gate) | batch (grep assertions) | `.planning/phases/10/scripts/check-gate.sh` | exact (mirror) |
| `scripts/smoke-progress.mjs` (NEW) | test (headless unit) | batch (node import + assert) | none (no JS test framework exists) — see No Analog Found | new |

## Pattern Assignments

### `src/progress.js` (NEW — model + store, pure XP math + guarded localStorage)

Two analogs combine: copy the **pure-factory shape and firewall header** from `src/math/brain.js`, and **verbatim-port the math + persistence bodies** from `archive/math-lab.html`.

**Firewall + factory shape** — copy the header discipline from `src/math/brain.js` lines 10-26:
```javascript
// FIREWALL (GATE-06): this module imports NOTHING from the game engine — only
// ./config.js's leaf constants ... It is headlessly importable and runnable in plain node.
// ANTI-LEAK: ... exposed as a createBrain() FACTORY, NOT the archive's module-level IIFE
// singleton. Each call returns a fresh closure with its OWN ... state ...
import { CONFIG } from "../config.js"; // leaf constants only
```
Note: `progress.js` lives at `src/` (NOT `src/math/`), so its config import is `./config.js` (one dot), unlike brain.js's `../config.js`. ZERO Kaplay imports (the firewall that keeps it node-testable). `createProgress(saved)` takes a saved object and NEVER reads `localStorage` itself.

**XP threshold + calculateXp** — port VERBATIM from `archive/math-lab.html` lines 648-657 (read `CONFIG.PROGRESS.*` instead of bare `CONFIG.*`):
```javascript
getLevelThreshold(level) {
  return Math.round(CONFIG.BASE_XP * Math.pow(CONFIG.LEVEL_MULT, level - 1));
},
calculateXp(table) {
  return CONFIG.HARD_TABLES.includes(table) ? CONFIG.XP_HARD : CONFIG.XP_EASY;
}
```

**addXp with surplus carry-over** — port from `archive/math-lab.html` lines 678-687. RESEARCH (Pattern 1, lines 158-168) recommends a `while` loop instead of the archive's single `if` (defensive, free — max award 20 < BASE_XP 200 so one `if` suffices today). Returns `true` exactly on a level-up cross (drives the SAVE-04 flash):
```javascript
addXp(points) {
  xp += points;
  const threshold = XpCalculator.getLevelThreshold(level);
  if (xp >= threshold) {
    xp -= threshold;  // carry over surplus XP (not xp = 0) — DO NOT change to xp=0 (feels punishing)
    level++;
    return true;      // signal level-up to caller
  }
  return false;
}
```

**Initial accuracy seed + closure state** — copy from `archive/math-lab.html` lines 663-670 (hard tables start at 0.4, easy at 0.5). This matches `src/math/brain.js` lines 43-55 exactly.

**Validated deserialize (security V5 — explicit-field copy, NOT Object.assign)** — port from `archive/math-lab.html` `fromJSON` lines 720-743. This is the prototype-pollution mitigation (T-01-01) — copy named keys only, `parseInt(k,10)` on JSON string keys, clamp accuracy to 0..1 and tables to 1..9, filter history to booleans and `.slice(-MASTERY_WINDOW)`:
```javascript
xp    = (typeof data.xp === 'number' && data.xp >= 0) ? data.xp : 0;
level = (typeof data.level === 'number' && data.level >= 1) ? Math.floor(data.level) : 1;
if (data.accuracy && typeof data.accuracy === 'object') {
  Object.entries(data.accuracy).forEach(([k, v]) => {
    const table = parseInt(k, 10);
    if (table >= 1 && table <= 9 && typeof v === 'number' && v >= 0 && v <= 1) {
      accuracy[table] = v;
    }
  });
}
// history: filter(x => typeof x === 'boolean').slice(-CONFIG.MASTERY_WINDOW)
```

**Guarded localStorage seam (`loadSave`/`writeSave`)** — port from `archive/math-lab.html` `PersistenceStore` lines 844-903, BUT add a `storageAvailable()` guard (node has NO localStorage). DROP the `migrate()` v1→v2 logic (lines 776-842) — CONTEXT lines 35-36 forbid migration. See RESEARCH Pattern 2 (lines 187-218) for the node-hardened version:
```javascript
function storageAvailable() {
  try { return typeof localStorage !== "undefined" && localStorage !== null; }
  catch (_) { return false; }
}
// loadSave: if (!storageAvailable()) return defaults();  then try{getItem→JSON.parse→version check→validate}catch→defaults
// writeSave: if (!storageAvailable()) return;  then try{setItem(JSON.stringify(blob))}catch(e){ QuotaExceededError→warn }
```
The archive's quota handling is at lines 896-900:
```javascript
if (e.name === 'QuotaExceededError') {
  console.warn('[MathLab] localStorage full — progress may not save');
} else { console.warn('[MathLab] Save failed:', e); }
```

**serialize(brainSnapshot)** — progress.js owns the blob shape. Combine the archive `toJSON` (lines 713-716, `Object.assign({}, accuracy)` shallow copy) with a `version: CONFIG.SAVE.VERSION` field. See RESEARCH Pattern 1 lines 170-178.

---

### `src/ui/hud.js` (NEW — component, Kaplay fixed HUD, one-way read of progress)

**Analog:** `src/ui/mathGate.js` (the fixed-overlay idiom) + `archive/math-lab.html` levelUpFlash (the flash feel).

**Engine-global + firewall header** — copy the discipline from `src/ui/mathGate.js` lines 9-16: Kaplay primitives (`add`, `fixed`, `z`, `rect`, `text`, `color`, `pos`, `anchor`, `opacity`, `width`, `center`, `tween`, `easings`, `destroy`) are bare globals (NOT imported); the only import is `CONFIG`. `src/ui/` is one dir below `src/`, so `import { CONFIG } from "../config.js"`. ONE-WAY: the HUD reads `progress.getLevel()/getXp()/nextThreshold()` — it NEVER calls `progress.addXp` or mutates progress (CONTEXT line 50).

**Fixed overlay objects** — mirror the `add([...])` fixed()/z() idiom from `src/ui/mathGate.js` lines 70-104 (the panel/dim/text construction). The HUD uses the same pattern at high `z` for a level badge (`text`) + XP track (`rect`) + XP fill (`rect`). Tag every object `"hud"` for scene-teardown cleanup, exactly as the gate tags `"math-gate"` (mathGate.js line 70, 80-81). See RESEARCH Pattern 5 lines 278-301.

**Dark-grunge palette (no pink)** — reuse the exact accent constants from `src/ui/mathGate.js` lines 37-43: `PANEL_BORDER = [0x33,0x33,0x33]`, `ACCENT_GREEN = [0x00,0xff,0x88]`. The XP fill uses ACCENT_GREEN, the track uses `#333`.

**Level-up flash** — port the FEEL of `archive/math-lab.html` levelUpFlash keyframe lines 266-275, but as a Kaplay `tween` (the archive is CSS). Critical: the archive flash is `0.8s` (line 274) — RESEARCH Pitfall 5 (lines 365-369) requires reducing to `CONFIG.HUD.FLASH_MS = 450` for ADHD-safety, no scale-bomb. Self-destroying tagged `"hud-flash"` object:
```javascript
// tween(1, 0, M.FLASH_MS/1000, (v) => (f.opacity = v), easings.easeOutQuad).then(() => destroy(f));
```
Tween/easings teardown mirrors the existing `reset()` flash in `src/scenes/game.js` line 97 (`tween(0.2, 1, 0.18, (v)=>(player.opacity=v), easings.easeOutQuad)`).

**Return shape** — `mountHud(progress)` returns `{ refresh, flashLevelUp }`, matching the scene's call sites in Pattern 4.

---

### `src/math/brain.js` (MODIFIED — model, add seedAccuracy + snapshot, firewall intact)

**Analog:** itself. Purely additive — DO NOT touch the locked selection math (lines 80-130) or the EWMA `reportResult` (lines 193-204).

**Extend the factory signature** — `src/math/brain.js` line 40 `export function createBrain()` becomes `export function createBrain({ seedAccuracy, seedHistory } = {})`. The default `{}` keeps the gate's fallback caller (`mathGate.js` line 58 `createBrain()`) working unchanged. After the accuracy literal at lines 43-53, inject the saved values using the SAME validation rules as archive `fromJSON` lines 726-733:
```javascript
if (seedAccuracy && typeof seedAccuracy === "object") {
  for (const [k, v] of Object.entries(seedAccuracy)) {
    const t = parseInt(k, 10);
    if (t >= 1 && t <= 9 && typeof v === "number" && v >= 0 && v <= 1) accuracy[t] = v;
  }
}
```
(Optionally seed `history` too with archive lines 734-743 rules — RESEARCH Open Q1 recommends persisting both for full mastery resume.)

**Add a `snapshot()` method** — to the returned object (after `reportResult`, currently ends line 204). A read-only shallow copy so progress.js can serialize it — the brain still reads NO storage (firewall intact). Mirror the archive `toJSON` shallow-copy at lines 713-716:
```javascript
snapshot() {
  return { accuracy: { ...accuracy }, history: { ...history } };
}
```
Update the firewall header (lines 36-38, 21) which currently says "persistence is Phase 11" / "save/load persistence layer ... DROPPED" — the brain still owns NO storage, but now EXPOSES a snapshot for the loader to persist.

---

### `src/ui/mathGate.js` (MODIFIED — component, carry the cleared table in onClear)

**Analog:** itself. One-line contract change at line 217.

The gate already holds the question's table as `q.a` (used at line 170 `brain.reportResult(q.a, correct)`). Extend the callback to carry it. Current line 217:
```javascript
onClear?.();
```
becomes:
```javascript
onClear?.({ table: q.a });   // q.a is the cleared question's table
```
Also update the JSDoc for `onClear` (lines 52-54) to document the `{ table }` payload. NO other change — XP must be awarded ONLY through this single correct-branch seam (forgiving mandate; wrong path at lines 174-180 stays XP-free — RESEARCH Pitfall 6).

---

### `src/scenes/game.js` (MODIFIED — controller, load on boot + wire onClear→addXp→HUD + save)

**Analog:** itself. The wiring extends existing seams; all new state stays closure-local (anti-leak, lines 36-56).

**Boot load + construct (inside `gameScene`, closure)** — RESEARCH Open Q2 (lines 460-463) locks this INSIDE the scene callback, not main.js. Add imports alongside lines 19-24, then replace the bare `const brain = createBrain();` at line 56:
```javascript
import { createProgress, loadSave, writeSave } from "../progress.js";
import { mountHud } from "../ui/hud.js";
// ... inside gameScene, replacing line 56:
const saved    = loadSave();                                    // guarded; defaults in node/blocked storage
const progress = createProgress(saved);                         // SAVE-01/03
const brain    = createBrain({ seedAccuracy: saved.accuracy }); // SAVE-03 resume weak-spot weighting
const hud      = mountHud(progress);                            // SAVE-04
hud.refresh();                                                  // show loaded XP/level immediately
```

**Extend the onClear hook** — `src/scenes/game.js` lines 144-151 currently just set `levelCleared = true`. Extend to receive `{ table }` and drive XP/HUD/save (RESEARCH Pattern 4 lines 261-267):
```javascript
onClear({ table }) {
  levelCleared = true;
  const leveledUp = progress.addXp(table);          // SAVE-01
  hud.refresh();                                     // one-way HUD update (SAVE-04)
  if (leveledUp) hud.flashLevelUp();                // level-up moment (SAVE-04)
  writeSave(progress.serialize(brain.snapshot()));  // SAVE-02 — persist on each clear
}
```

**Save on tab-hide** — add an `onHide()` registration (KAPLAY's `visibilitychange` wrapper, verified global, RESEARCH line 41). Mirror the existing scene-level `onUpdate` registration at line 157 (same bare-global, scene-scoped pattern):
```javascript
onHide(() => writeSave(progress.serialize(brain.snapshot())));
```

DO NOT persist run state — `coinsCollected` (line 40), `goalReached` (line 44), `lastCheckpoint` (line 35), player position all stay closure-local and are NEVER passed to serialize (CONTEXT line 37, RESEARCH Pitfall 3).

---

### `src/config.js` (MODIFIED — config, add PROGRESS/SAVE/HUD namespaces)

**Analog:** itself — the existing `CONFIG.BRAIN` (lines 49-57) and `CONFIG.GATE` (lines 60-64) namespaced blocks. Add three sibling blocks inside the `CONFIG` object (before the closing `}` at line 65), following the same "verbatim port, DO NOT re-tune" comment discipline (line 46-48). Exact values from RESEARCH lines 388-405 (ported from archive lines 604-619):
```javascript
PROGRESS: { XP_EASY: 10, XP_HARD: 20, BASE_XP: 200, LEVEL_MULT: 1.3,
            HARD_TABLES: [6,7,8,9], EASY_TABLES: [1,2,3,4,5] },
SAVE: { KEY: "mathlab_platformer_v1", VERSION: 1 },  // NEW key — independent of archive's mathlab_save_*
HUD:  { X: 16, Y: 16, BADGE_SIZE: 18, BAR_W: 160, BAR_H: 10, BAR_DY: 24,
        FLASH_SIZE: 36, FLASH_MS: 450 },             // FLASH_MS 450 = ADHD-safe (NOT archive's 800)
```
Note: `HARD_TABLES`/`EASY_TABLES` are intentionally duplicated under both `BRAIN` and `PROGRESS` — they serve different consumers (brain weighting vs. XP amount) and the firewall keeps the modules independent.

---

### `scripts/check-progress.sh` (NEW — test, structural gate)

**Analog:** `.planning/phases/10-math-gate-integration-port-the-brain/scripts/check-gate.sh` (read in full). Mirror its exact structure:
- shebang `#!/usr/bin/env bash` + `set -euo pipefail` (line 15)
- `ROOT="$(git rev-parse --show-toplevel)"` for cwd-independence (line 18)
- a `fail()` helper that echoes to stderr + `exit 1` (lines 21-24)
- `[ -f "$TARGET" ]` existence guard + `node --check` syntax gate per target (lines 27-30)
- positive greps for required API/wiring (lines 33-44)
- NEGATIVE greps wrapped in `if grep -Eq ... then fail` for forbidden tokens (lines 53-65)
- final `echo "... checks: PASS"` (line 67)

Phase-11-specific assertions (from RESEARCH Validation lines 497-504, 512):
```bash
# firewall: progress.js imports NO kaplay
if grep -qE 'kaplay|from .*lib/kaplay' "$ROOT/src/progress.js"; then fail "..."; fi
# guarded seam present
grep -q 'QuotaExceededError' "$ROOT/src/progress.js" || fail "..."
grep -q 'mathlab_platformer_v1' "$ROOT/src/config.js" || fail "..."
# brain seeding wired both ends
grep -q 'seedAccuracy' "$ROOT/src/scenes/game.js" || fail "..."
grep -q 'seedAccuracy' "$ROOT/src/math/brain.js" || fail "..."
# HUD one-way (no writes back into progress)
grep -q 'fixed(' "$ROOT/src/ui/hud.js" || fail "..."
if grep -qE 'progress\.(addXp|level\s*=)' "$ROOT/src/ui/hud.js"; then fail "HUD must be one-way"; fi
# forgiving: addXp not reachable from the gate
if grep -q 'addXp' "$ROOT/src/ui/mathGate.js"; then fail "XP must not be awarded in the gate"; fi
# invoke the headless math smoke
node "$ROOT/scripts/smoke-progress.mjs" || fail "smoke-progress failed"
```
Run-from-root usage comment mirrors check-gate.sh lines 12-13.

---

### `scripts/smoke-progress.mjs` (NEW — test, headless node unit)

No analog (project has no JS test framework). Plain ESM script using `console.assert` + a non-zero exit on failure. It imports `src/progress.js` and `src/math/brain.js` directly (both are pure / node-safe — that is the whole point of the firewall). Asserts, per RESEARCH lines 495-503:
- SAVE-01: `createProgress().threshold(1) === 200 && threshold(2) === 260`; `addXp(7)` adds 20, returns `false` (20 < 200); a forced level-up carries surplus.
- SAVE-02: `createProgress(p.serialize(brain.snapshot()))` round-trips xp/level/accuracy with a `version` field.
- SAVE-03 (statistical): seed a brain with table 7 = 0.05, draw ~2000 `nextQuestion()`, assert table-7 share is materially higher than a fresh brain's baseline (RESEARCH Pitfall 2 lines 348-351).

Must NOT touch `localStorage` (call `createProgress(fixture)` directly — RESEARCH Pitfall 1 lines 342-345).

---

## Shared Patterns

### Pure-factory anti-leak (createX returning a fresh closure)
**Source:** `src/math/brain.js` lines 15-19, 40-56
**Apply to:** `src/progress.js` (`createProgress`), `src/ui/hud.js` (`mountHud` closure)
The codebase's #1 locked rule: NO module-level mutable `let` for run/progress state — it leaks across `go("game")` replays. Every stateful module is a factory returning a closure. (RESEARCH Anti-Patterns line 305.)

### Two-firewall import discipline
**Source:** `src/math/brain.js` lines 10-13 (no engine), `src/ui/mathGate.js` lines 5-7 (one-way)
**Apply to:** `progress.js` (imports ONLY `./config.js`, no Kaplay → node-testable); `brain.js` (no storage, exposes `snapshot()` only); `hud.js` (reads progress one-way, never writes).

### Guarded localStorage persistence (versioned + try-catch + quota)
**Source:** `archive/math-lab.html` lines 844-903, hardened with `storageAvailable()` for node
**Apply to:** `src/progress.js` `loadSave`/`writeSave`. Versioned key, `JSON.parse`/`stringify`, try-catch on quota/disabled storage, never throw to the game loop. This is the project's locked persistence pattern (CLAUDE.md "Persistence Without Backend").

### Security V5 — explicit-field deserialize (anti prototype-pollution)
**Source:** `archive/math-lab.html` `fromJSON` lines 720-743
**Apply to:** `src/progress.js` validate/deserialize. Copy named keys only — NEVER `Object.assign(this, data)` or spread untrusted blob. `parseInt(k,10)` on JSON string keys; range-clamp accuracy (0..1), tables (1..9), history (booleans, window-clamped). (T-01-01.)

### Kaplay fixed() overlay idiom + tagged teardown
**Source:** `src/ui/mathGate.js` lines 70-104 (fixed/z/tag), `src/scenes/game.js` line 97 (tween flash)
**Apply to:** `src/ui/hud.js`. `add([... fixed(), z(9000), "hud"])`; rely on KAPLAY destroying scene-scoped tagged objects on `go()`. Mount inside the scene closure, never at module load (anti double-mount, RESEARCH Pitfall 4).

### Dark-grunge palette (no pink)
**Source:** `src/ui/mathGate.js` lines 37-43
**Apply to:** `src/ui/hud.js`. Reuse `ACCENT_GREEN = [0x00,0xff,0x88]` (XP fill), `[0x33,0x33,0x33]` (track), near-black panels. CLAUDE.md aesthetic.

### Structural-gate script shape
**Source:** `.planning/phases/10/scripts/check-gate.sh` lines 15-67
**Apply to:** `scripts/check-progress.sh`. `set -euo pipefail`, `git rev-parse` root, `fail()` helper, `node --check` per file, positive + negative greps, PASS line.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/smoke-progress.mjs` | test (headless unit) | batch | No headless JS unit test exists in the repo — Phase 10 used only `check-gate.sh`/`check-wiring.sh` (structural greps), no `.mjs` smoke. The shape (plain ESM + `console.assert` + non-zero exit, importing the pure modules) is new this phase. The CONTENT of its assertions is fully specified by RESEARCH Validation lines 495-503; only the harness file is novel. Low risk — it imports already-pure, node-safe modules. |

## Metadata

**Analog search scope:** `src/`, `src/math/`, `src/ui/`, `src/scenes/`, `archive/math-lab.html`, `.planning/phases/10/scripts/`
**Files scanned:** 8 source/archive files read in full or in targeted ranges (brain.js, config.js, game.js, mathGate.js, main.js, archive 600-903, archive 260-275, check-gate.sh)
**Pattern extraction date:** 2026-06-26
