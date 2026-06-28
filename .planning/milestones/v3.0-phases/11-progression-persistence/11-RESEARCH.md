# Phase 11: Progression & Persistence - Research

**Researched:** 2026-06-26
**Domain:** Browser-local XP/level progression + versioned localStorage persistence + Kaplay fixed HUD, ported verbatim from the v1/v2 single-file game into the multi-file Kaplay 3001 platformer.
**Confidence:** HIGH (verbatim port of already-validated archive code + direct grep verification of every Kaplay symbol against the vendored `lib/kaplay.mjs`; zero external dependencies).

## Summary

This phase ports the proven v1/v2 XP/level math and the localStorage persistence pattern out of `archive/math-lab.html` into a new **pure** module `src/progress.js` (no Kaplay imports), wires XP awarding into the existing gate→scene `onClear` seam by extending that hook to carry the cleared question's `table`, extends `src/math/brain.js` to seed per-table accuracy from saved history (`createBrain({ seedAccuracy })`), and adds a fixed Kaplay HUD (`src/ui/hud.js`) that reads one-way from `progress.js` with a distinct level-up moment.

The hard architectural constraint is a **two-firewall** design that already exists in the codebase and must be preserved: (1) the brain never touches storage or the engine (GATE-06, verified intact in `brain.js`), and (2) the new `progress.js` owns XP/level math AND localStorage but imports nothing from Kaplay — so the pure XP/level math is headlessly testable in node. The one wrinkle: **node has no `localStorage`** (verified: `typeof localStorage === "undefined"` in node). Therefore `progress.js` must be structured so the XP/level math (`addXp`, `getLevel`, `getXp`, `threshold`, `serialize`/`deserialize`) is callable with zero storage access, and the storage read/write is a thin guarded layer (`load()`/`save()`) that try-catches both the `typeof localStorage` check AND quota/disabled-storage errors.

The two highest-risk behaviors are **resume-across-visits** (XP/level restored) and **weak-spot-adaptation-resume** (the brain's EWMA accuracy restored so question selection stays targeted) — both are SAVE-03 and both depend on the serialize→localStorage→deserialize→seedBrain round-trip working end to end. These are best validated with a headless node smoke test of the pure math plus a manual browser playtest (reload the URL, confirm XP/level survive and weak tables stay over-selected).

**Primary recommendation:** Create `src/progress.js` as a `createProgress()` factory that holds XP/level + per-table accuracy snapshot, exposes pure math + `serialize()`/`deserialize()`, and a separate thin `loadSave()`/`writeSave()` pair guarded for missing/blocked `localStorage`. Port `getLevelThreshold`/`calculateXp`/`addXp` (with surplus carry-over) and the `PersistenceStore` validation logic VERBATIM. Add `CONFIG.PROGRESS`, `CONFIG.SAVE`, `CONFIG.HUD` namespaces. Extend `onClear` → `onClear({ table })`, seed the brain on boot via `createBrain({ seedAccuracy })`, and render the HUD with KAPLAY globals (`add`, `fixed`, `z`, `rect`, `text`, `onUpdate`) using `onHide` (KAPLAY's `visibilitychange` wrapper, verified present and global) for the save-on-hide trigger.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| XP/level math (threshold, addXp, calculateXp) | Pure logic (`src/progress.js`) | — | Engine-agnostic, deterministic, node-testable; never needs the DOM or Kaplay [VERIFIED: archive XpCalculator/PlayerState are pure IIFEs with no engine refs] |
| localStorage read/write (versioned JSON + try-catch) | Pure logic (`src/progress.js`) | Browser global `localStorage` | localStorage is a browser global, not a game-engine dependency (CONTEXT line 30); keep it OUT of the brain and OUT of Kaplay modules |
| Per-table accuracy persistence (EWMA snapshot) | Pure logic (brain exposes snapshot; progress serializes it) | — | The brain owns the EWMA math; the loader injects saved accuracy back via `createBrain({ seedAccuracy })` — brain never reads storage (CONTEXT line 49) |
| Award XP on correct answer | Scene (`src/scenes/game.js`) | Gate (`src/ui/mathGate.js`) carries `table` | The gate already knows the table (`q.a`); the scene owns run wiring and calls `progress.addXp(table)` in the existing `onClear` hook |
| XP bar + level badge + level-up flash | Engine UI (`src/ui/hud.js`, Kaplay) | reads `progress.js` one-way | The HUD is the ONLY Kaplay consumer of progress; one-way read keeps the firewall (CONTEXT line 50) |
| Seed brain accuracy on boot | Boot/scene-start (`src/scenes/game.js` or `src/main.js`) | — | The loader injects saved accuracy at brain construction; resumes weak-spot weighting (SAVE-03) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla ES2020 modules | native | `src/progress.js` pure XP/level + persistence | Project canon: zero deps, no build step (CLAUDE.md) [VERIFIED: codebase is all plain ESM] |
| `localStorage` (browser global) | native | versioned JSON save/load | The project's locked persistence pattern (CLAUDE.md "Persistence Without Backend") [CITED: ./.claude/CLAUDE.md] |
| KAPLAY | 3001.0.19 (vendored `lib/kaplay.mjs`) | fixed HUD draw + `onHide` save trigger | Pinned engine; HUD uses the same global primitives as `mathGate.js` [VERIFIED: grep against lib/kaplay.mjs] |
| `JSON.parse`/`JSON.stringify` | native | serialize the save blob | Built-in; archive already uses this exact pattern [VERIFIED: archive 890-894] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `onHide()` (KAPLAY global) | 3001.0.19 | fire a save when the tab is hidden | Replaces the archive's raw `visibilitychange` listener — it is KAPLAY's wrapper over the same event [VERIFIED: lib/kaplay.mjs global binding `onHide:ve`; internally `a.app.onHide(...)`] |
| node (for headless validation only) | local | run the pure XP/level math without a browser | Validation harness only — NOT a runtime dependency [VERIFIED: `node -e "typeof localStorage"` → `undefined`] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| KAPLAY `onHide()` for the hidden-tab save | raw `document.addEventListener("visibilitychange", ...)` | Both work; `onHide` keeps the save trigger inside the engine's lifecycle and is auto-cleaned on scene/context teardown. The archive used raw `visibilitychange` (single-file). For this multi-file Kaplay game, `onHide` is the lower-leak choice. Either is acceptable; document which. |
| `createProgress()` factory holding state | module-level singleton (archive's IIFE) | The codebase has a LOCKED anti-leak rule: factories, not module-level mutable `let` (CONTEXT line 30, brain.js comment lines 15-19). Use the factory. |
| Persisting the full sliding-window `history` | persisting only the EWMA `accuracy` snapshot | The brain's *selection* math reads `accuracy` directly; `history` only feeds `isMastered`. Persisting both (as the archive does) preserves mastery state across visits and is cheap (<1KB). **Recommend persisting both** to fully resume adaptation (SAVE-03), but the accuracy map is the minimum that resumes weak-spot weighting. |

**Installation:**
```bash
# None. Zero-dependency, no build step, no package manager (CLAUDE.md hard constraint).
```

**Version verification:** No packages are installed in this phase. KAPLAY is already vendored and pinned at 3001.0.19 (`lib/kaplay.mjs`, sha recorded in Phase 7). Every Kaplay symbol used by the HUD was grep-verified against the vendored source this session (see Code Examples → API Verification).

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external packages — the project is a zero-dependency, no-build, vendored-engine static game (CLAUDE.md "What NOT to Use" forbids CDN libraries and bundlers). The only third-party code is the already-vendored, already-audited KAPLAY 3001.0.19. No npm/PyPI/crates fetch occurs.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SAVE-01 | Earn XP for correct answers and level up (port v1/v2 curve) | `progress.addXp(table)` ← `calculateXp(table)` (HARD 6–9 = 20, else 10) + `getLevelThreshold(level) = round(BASE_XP·LEVEL_MULT^(level-1))` ported verbatim from archive 648-657, 678-687. Awarded only on the gate's CORRECT path (forgiving: wrong = no XP). |
| SAVE-02 | XP, level, per-table accuracy persist in versioned localStorage | NEW key `mathlab_platformer_v1` + `version` field; `JSON.stringify` of `{version, xp, level, accuracy, history}`; try-catch on quota/disabled storage; validated `deserialize` (archive PersistenceStore 760-903 pattern). |
| SAVE-03 | Returning resumes XP/level AND weak-spot adaptation | Boot loads the save, seeds `createBrain({ seedAccuracy })` with saved accuracy/history so the weighted selector keeps over-picking weak tables; HUD reflects loaded XP/level immediately. **Highest-risk behavior — gate with a reload playtest.** |
| SAVE-04 | XP/level visible in-game with a level-up moment | Fixed Kaplay HUD: level badge + XP fill bar to next threshold + a brief level-up flash/banner when `addXp` returns "leveled up" (port the archive levelUpFlash feel, archive 266-275). |

## Architecture Patterns

### System Architecture Diagram

```
                          BOOT (main.js / scene start)
                                   |
                                   v
                       progress.loadSave()  ──reads──▶ localStorage["mathlab_platformer_v1"]
                                   |  (guarded: missing/blocked storage → defaults)
                                   |
                returns { xp, level, accuracy, history }
                                   |
              ┌────────────────────┼─────────────────────────┐
              v                    v                          v
   createProgress(saved)   createBrain({ seedAccuracy:     hud reads progress
   (pure XP/level state)     saved.accuracy/history })     (level badge + XP bar)
              |                    |                          ^
              |                    | (resumes weak-spot       |
              |                    |  weighting — SAVE-03)    | one-way read
              |                    v                          |
              |        ┌──────────────────────────┐           |
              |        │  GAME LOOP (scene)        │           |
              |        └──────────────────────────┘           |
              |                    |                           |
              |     player reaches goal → openMathGate(brain)  |
              |                    |                           |
              |        gate: correct answer (table = q.a)      |
              |                    |                           |
              |        onClear({ table })  ◀── EXTENDED HOOK   |
              |                    |                           |
              └──▶ progress.addXp(table) ── leveledUp? ───────┘
                                   |              │
                                   |              └─▶ HUD level-up flash (SAVE-04)
                                   v
                       progress.writeSave()  ──writes──▶ localStorage  (guarded try-catch)
                                   ^
                                   |
                  ALSO: onHide() (tab hidden) ──▶ progress.writeSave()
```

Data flows ONE way into the HUD (HUD never mutates progress). XP is awarded ONLY on the gate's correct branch. Saves fire on (a) each gate clear and (b) tab-hide.

### Recommended Project Structure
```
src/
├── progress.js          # NEW — pure: XP/level math + serialize/deserialize + guarded localStorage. ZERO Kaplay imports.
├── config.js            # MODIFY — add CONFIG.PROGRESS, CONFIG.SAVE, CONFIG.HUD
├── math/
│   └── brain.js         # MODIFY — createBrain({ seedAccuracy }) + expose accuracy/history snapshot. Firewall intact.
├── ui/
│   ├── mathGate.js      # MODIFY — onClear() → onClear({ table: q.a })
│   └── hud.js           # NEW — Kaplay fixed HUD; reads progress one-way; level-up flash
└── scenes/
    └── game.js          # MODIFY — load save on entry, seed brain, addXp in onClear, mount HUD, save on clear + onHide
```

### Pattern 1: Pure progress factory with storage as a thin guarded seam
**What:** `createProgress()` returns an object whose XP/level math is 100% pure (node-runnable); `loadSave()`/`writeSave()` are separate module functions that guard `localStorage`.
**When to use:** Always here — it is the firewall that makes SAVE-01 math headlessly testable while SAVE-02 stays browser-only.
**Example:**
```javascript
// Source: ported from archive/math-lab.html XpCalculator (648-657) + PlayerState (663-753)
//         + PersistenceStore (760-903), restructured into a pure factory + guarded storage seam.
import { CONFIG } from "./config.js"; // leaf constants only — NO kaplay import (firewall)

// --- PURE: node-testable, never touches localStorage ---
export function createProgress(saved) {
  let xp    = (typeof saved?.xp === "number" && saved.xp >= 0) ? saved.xp : 0;
  let level = (typeof saved?.level === "number" && saved.level >= 1) ? Math.floor(saved.level) : 1;

  const threshold = (lvl) =>
    Math.round(CONFIG.PROGRESS.BASE_XP * Math.pow(CONFIG.PROGRESS.LEVEL_MULT, lvl - 1));

  const calculateXp = (table) =>
    CONFIG.PROGRESS.HARD_TABLES.includes(table) ? CONFIG.PROGRESS.XP_HARD : CONFIG.PROGRESS.XP_EASY;

  return {
    getXp:    () => xp,
    getLevel: () => level,
    threshold,                 // threshold() for the CURRENT level (HUD bar denominator)
    nextThreshold: () => threshold(level),
    // Award XP for a cleared table; carry surplus across a level-up (archive 678-687).
    // Returns true exactly when a level-up occurred (drives the SAVE-04 flash).
    addXp(table) {
      xp += calculateXp(table);
      let leveledUp = false;
      // while-loop, not single if: a big award could cross >1 threshold (archive used if;
      // award max 20 < BASE_XP 200 so one if suffices, but while is safe and cheap).
      while (xp >= threshold(level)) {
        xp -= threshold(level);
        level += 1;
        leveledUp = true;
      }
      return leveledUp;
    },
    // serialize() takes the brain's accuracy/history snapshot so progress.js owns the blob shape.
    serialize(brainSnapshot) {
      return {
        version:  CONFIG.SAVE.VERSION,
        xp, level,
        accuracy: brainSnapshot?.accuracy ?? {},
        history:  brainSnapshot?.history  ?? {},
      };
    },
  };
}
```

### Pattern 2: Guarded localStorage seam (node-safe, quota-safe, disabled-storage-safe)
**What:** Three failure modes are handled with one try-catch wrapper: `localStorage` undefined (node / some private modes), `getItem`/`setItem` throwing (disabled storage), and `QuotaExceededError`. Never crash; warn and fall back.
**When to use:** Every read/write. This is the project's locked persistence pattern (CLAUDE.md).
**Example:**
```javascript
// Source: archive/math-lab.html PersistenceStore.load/save (845-903), hardened for node-undefined.
function storageAvailable() {
  try { return typeof localStorage !== "undefined" && localStorage !== null; }
  catch (_) { return false; } // accessing localStorage can THROW in some sandboxed iframes
}

export function loadSave() {
  if (!storageAvailable()) return defaults();        // node / blocked storage → defaults
  try {
    const raw = localStorage.getItem(CONFIG.SAVE.KEY);
    if (raw === null) return defaults();
    let data;
    try { data = JSON.parse(raw); }
    catch (_) { console.warn("[MathLab] save corrupt — defaults"); return defaults(); }
    if (data.version !== CONFIG.SAVE.VERSION) {        // wrong/absent version → defaults (no migration)
      console.warn("[MathLab] save version mismatch — defaults"); return defaults();
    }
    return validate(data);                            // explicit-field copy, NOT Object.assign (T-01-01)
  } catch (e) { console.warn("[MathLab] load failed:", e); return defaults(); }
}

export function writeSave(blob) {
  if (!storageAvailable()) return;                    // node / blocked → silently no-op (do not crash)
  try {
    localStorage.setItem(CONFIG.SAVE.KEY, JSON.stringify(blob));
  } catch (e) {
    if (e && e.name === "QuotaExceededError")
      console.warn("[MathLab] localStorage full — progress may not save");
    else console.warn("[MathLab] save failed:", e);   // forgiving: never throw to the game loop
  }
}
```

### Pattern 3: Brain seeding without breaking the firewall
**What:** `createBrain({ seedAccuracy })` injects saved accuracy (and optionally history) at construction. The brain still imports NOTHING from storage or Kaplay; the *loader* (scene/boot) reads the save and passes the snapshot in.
**When to use:** Boot/scene-start, to resume weak-spot adaptation (SAVE-03).
**Example:**
```javascript
// Source: extends src/math/brain.js createBrain() (current lines 40-56) — additive, firewall intact.
export function createBrain({ seedAccuracy } = {}) {        // default {} keeps current callers working
  const accuracy = { 1:0.5,2:0.5,3:0.5,4:0.5,5:0.5, 6:0.4,7:0.4,8:0.4,9:0.4 };
  const history  = {};
  // Inject saved per-table accuracy (validated 1..9, 0..1) — same rules as archive fromJSON (726-733).
  if (seedAccuracy && typeof seedAccuracy === "object") {
    for (const [k, v] of Object.entries(seedAccuracy)) {
      const t = parseInt(k, 10);
      if (t >= 1 && t <= 9 && typeof v === "number" && v >= 0 && v <= 1) accuracy[t] = v;
    }
  }
  // ... rest of the existing closure unchanged ...
  return {
    nextQuestion() { /* unchanged */ },
    reportResult(table, isCorrect) { /* unchanged */ },
    // NEW: one-way snapshot for persistence (read-only copy — the brain never reads storage).
    snapshot() {
      return { accuracy: { ...accuracy }, history: { ...history } };
    },
  };
}
```
*(If seeding `history` too: add a `seedHistory` param validated like archive 734-743 — filter to booleans, clamp to MASTERY_WINDOW. Recommended for full mastery resume but optional; accuracy alone resumes weak-spot weighting.)*

### Pattern 4: Extend the gate→onClear contract to carry the table
**What:** `onClear()` becomes `onClear({ table })`, passing `q.a` (the gate already holds the question's table). The scene reads `table` and calls `progress.addXp(table)`.
**When to use:** The single XP-award seam.
**Example:**
```javascript
// In src/ui/mathGate.js, the existing correct-branch (current line 217):
//   onClear?.();
// becomes:
onClear?.({ table: q.a });          // q.a is the cleared question's table (brain return shape locked)

// In src/scenes/game.js, the existing hook (current lines 144-151):
onClear({ table }) {
  levelCleared = true;
  const leveledUp = progress.addXp(table);     // SAVE-01
  hud.refresh();                               // one-way HUD update (SAVE-04)
  if (leveledUp) hud.flashLevelUp();           // the level-up moment (SAVE-04)
  writeSave(progress.serialize(brain.snapshot())); // SAVE-02 — persist on each clear
}
```

### Pattern 5: Fixed Kaplay HUD reading progress one-way + level-up flash
**What:** `mountHud(progress)` adds `fixed()` text/rect objects at high `z`, and returns `{ refresh, flashLevelUp }`. It reads progress; it never writes. The XP bar is a `rect` whose `.width` is recomputed in `refresh()` (or in an `onUpdate`).
**When to use:** SAVE-04. Mirrors the `mathGate.js` fixed-overlay idiom exactly.
**Example:**
```javascript
// Source: KAPLAY globals verified in lib/kaplay.mjs (add, fixed, z, rect, text, color, pos,
//         anchor, width, onUpdate, wait/tween for the flash). Mirrors mathGate.js fixed() overlay.
import { CONFIG } from "../config.js"; // CONFIG.HUD layout — the ONLY non-engine import
export function mountHud(progress) {
  const M = CONFIG.HUD;
  // Level badge (top-left), fixed so it ignores the camera (verified: fixed() is a global comp).
  const badge = add([ text("LVL " + progress.getLevel(), { size: M.BADGE_SIZE }),
    pos(M.X, M.Y), fixed(), z(9000), color(0x00,0xff,0x88), "hud" ]);
  // XP bar track + fill (dark-grunge, no pink).
  add([ rect(M.BAR_W, M.BAR_H), pos(M.X, M.Y + M.BAR_DY), fixed(), z(9000),
        color(0x33,0x33,0x33), "hud" ]);                 // track
  const fill = add([ rect(1, M.BAR_H), pos(M.X, M.Y + M.BAR_DY), fixed(), z(9001),
        color(0x00,0xff,0x88), "hud" ]);                 // fill (#00ff88 accent)
  function refresh() {
    badge.text = "LVL " + progress.getLevel();
    const frac = Math.min(1, progress.getXp() / progress.nextThreshold());
    fill.width = Math.max(1, M.BAR_W * frac);            // mutate .width (rect comp width is settable)
  }
  function flashLevelUp() {
    const f = add([ text("LEVEL UP", { size: M.FLASH_SIZE }), pos(center()), anchor("center"),
      fixed(), z(9500), color(0x00,0xff,0x88), opacity(1), "hud-flash" ]);
    // ADHD-safe: short (~400-500ms), no scale-bomb. Tween opacity down, then destroy.
    tween(1, 0, M.FLASH_MS / 1000, (v) => (f.opacity = v), easings.easeOutQuad)
      .then(() => destroy(f));
  }
  return { refresh, flashLevelUp };
}
```

### Anti-Patterns to Avoid
- **Module-level `let xp/level/accuracy` in progress.js or hud.js** — would leak across `go("game")` replays (the codebase's #1 locked pitfall; brain.js, game.js all use closures/factories). Use `createProgress()` / `mountHud()` closures.
- **Importing `localStorage` access into `brain.js`** — breaks the GATE-06 firewall (the brain's own header forbids it). The loader injects; the brain only exposes `snapshot()`.
- **Importing Kaplay into `progress.js`** — breaks node testability of the XP math. progress.js imports only `./config.js`.
- **HUD writing back into progress** — must be strictly one-way (CONTEXT line 50).
- **Saving run/session state** (player position, coins-this-run, goalReached) — CONTEXT line 37: persist ONLY xp/level/accuracy/history. Coins are per-run and reset each visit.
- **A `setInterval`/timed autosave** — no timers anywhere (SAFE-01 / project hard constraint). Save on event (clear, onHide) only.
- **Re-mounting the HUD without tagging/teardown** — if a future replay calls `go("game")`, untagged HUD objects could stack. Tag `"hud"` and rely on scene teardown (KAPLAY destroys scene objects on `go()`), matching the mathGate teardown discipline.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XP curve / level thresholds | a new formula | port `getLevelThreshold`/`calculateXp` VERBATIM (archive 648-657) | Already validated with the kid; re-tuning is explicitly out of scope (CONTEXT line 29) |
| Surplus carry-over on level-up | `xp = 0` after level-up | port `xp -= threshold` carry-over (archive 682) | Losing surplus XP feels punishing; the validated curve carries it over |
| Save validation / type guards | trust `JSON.parse` output | port `fromJSON`/`load` explicit-field validation (archive 720-743, 870-879) | Mitigates prototype-pollution (T-01-01) and corrupt-save crashes; copy named keys only, never `Object.assign(this, data)` |
| Tab-hidden save trigger | hand-rolled `visibilitychange` plumbing | KAPLAY `onHide()` global | Already in the engine, auto-cleaned with the context; one line (verified `onHide:ve` global) |
| Weighted question selection | re-deriving weak-spot logic | the EXISTING `brain.js` selector (port already done Phase 10) | Locked, validated; this phase only *seeds* its accuracy |

**Key insight:** Almost everything in this phase already exists as validated code in `archive/math-lab.html` (XP math, persistence, validation, level-up flash). The work is **porting + restructuring into the two firewalls**, not inventing. The only genuinely new code is the Kaplay HUD and the `onClear({ table })` plumbing.

## Runtime State Inventory

This is a port/migration-flavored phase (introduces a new persisted save), so the inventory applies:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | NEW localStorage key `mathlab_platformer_v1` (this phase creates it). The archive's `mathlab_save_v1`/`mathlab_save_v2` keys belong to the OLD single-file game. | Create the new key. **No migration** from the school game's save (CONTEXT line 35-36) — fresh, independent progression. Do NOT read or write the old keys. |
| Live service config | None — no backend, no external service (static game, CLAUDE.md). | None. |
| OS-registered state | None — browser-only. | None. |
| Secrets / env vars | None — no auth, no env (offline static game). | None. |
| Build artifacts | None — no build step (no-build philosophy). The new `src/progress.js` and `src/ui/hud.js` are plain ESM served as-is by nginx; ensure they're added to any asset list and the nginx `.mjs`/`.js` MIME mapping already covers `.js` (Phase 7 decision). | Confirm new `.js` files load (they will — same MIME config as existing modules). |

**The canonical question — what runtime state holds an old string after a file rename?** Not applicable (no rename this phase). The relevant analog: the save KEY is brand new and deliberately namespaced (`mathlab_platformer_v1`) so it cannot collide with the archive's `mathlab_save_*` keys.

## Common Pitfalls

### Pitfall 1: `localStorage` is undefined in node — the headless XP test crashes on import
**What goes wrong:** A node smoke test `import`s `progress.js`; if the module touches `localStorage` at top level (or `createProgress` calls `loadSave`), node throws `ReferenceError: localStorage is not defined`.
**Why it happens:** node has no `localStorage` (verified: `typeof localStorage === "undefined"`).
**How to avoid:** Keep `createProgress()` pure (it takes a `saved` object, never reads storage itself). `loadSave()`/`writeSave()` guard with `storageAvailable()` (try-catch + `typeof` check) and are only called by the BROWSER boot path, never at module top level. The node test calls `createProgress(fixtureSave)` directly.
**Warning signs:** `node --check` passes but `node -e "import('./src/progress.js')"` throws — means a storage access leaked to module scope.

### Pitfall 2: Weak-spot adaptation silently does NOT resume (SAVE-03 false-pass)
**What goes wrong:** XP/level resume correctly, so it *looks* done, but the brain is constructed without the saved accuracy — every visit starts question selection fresh, defeating the whole point.
**Why it happens:** Two seams must both fire: `loadSave()` must return `accuracy`, AND boot must pass it as `createBrain({ seedAccuracy: saved.accuracy })`. Easy to wire XP and forget the brain.
**How to avoid:** In the headless test, seed a brain with a lopsided accuracy (e.g. table 7 = 0.05) and assert `nextQuestion()` over many draws over-selects table 7 vs. a fresh brain. In the browser, reload after several correct 7s and confirm 7s keep appearing more often.
**Warning signs:** After reload, the question mix looks uniform / un-targeted.

### Pitfall 3: Saving run/session state pollutes the save and breaks resume
**What goes wrong:** Persisting `coinsCollected`, `goalReached`, or player position means a reload resumes mid-level or with stale flags.
**Why it happens:** Over-broad `serialize()` that grabs scene state.
**How to avoid:** `serialize()` takes ONLY `{xp, level} + brain.snapshot()`. Run state stays in the scene closure and is never passed in (CONTEXT line 37).
**Warning signs:** Save blob contains position/coins keys.

### Pitfall 4: HUD object leak / double-mount across replays
**What goes wrong:** If a future `go("game")` replays the scene, a HUD mounted with untagged objects (or via a module-level singleton) stacks a second HUD.
**Why it happens:** Same class of bug as the gate's key-controller leak (mathGate.js header, Pitfall 1).
**How to avoid:** Tag all HUD objects `"hud"`; rely on KAPLAY destroying scene-scoped objects on `go()`. Mount the HUD INSIDE the scene callback (closure), never at module load. `flashLevelUp` objects tagged `"hud-flash"` and self-destroy after the tween.
**Warning signs:** Two level badges after a respawn-via-go or replay.

### Pitfall 5: Level-up flash too long / over-stimulating (ADHD-safety regression)
**What goes wrong:** The archive's flash was 800ms; v2.0 close notes flagged reducing it to 400–500ms for ADHD compliance (STATE.md tech debt).
**Why it happens:** Direct port of the 0.8s keyframe.
**How to avoid:** Set `CONFIG.HUD.FLASH_MS = 450` (a tunable), no scale-bomb, subtle. Phase 12 owns final juice tuning, but don't regress past the known-good window now.
**Warning signs:** A long, big, attention-grabbing flash.

### Pitfall 6: XP awarded on wrong answers (forgiving-mandate violation)
**What goes wrong:** Awarding XP (or penalizing) on the gate's wrong branch.
**Why it happens:** Wiring `addXp` into `choose()` generally instead of only the correct path.
**How to avoid:** XP is awarded ONLY in the `onClear({ table })` hook, which the gate fires ONLY on a correct answer (mathGate.js line 217). Wrong answers already just nudge+reask. Confirm `addXp` is reachable from no other call site (grep).
**Warning signs:** A wrong pick changes the XP bar.

### Pitfall 7: `JSON.parse` numeric-key coercion in the accuracy map
**What goes wrong:** `JSON.stringify({1:0.5})` → `{"1":0.5}`; on parse, keys are strings. Code that does `accuracy[table]` with a numeric `table` still works (JS coerces), but a strict `Object.keys` walk yields string keys.
**Why it happens:** JSON has no integer keys.
**How to avoid:** Always `parseInt(k, 10)` when iterating saved accuracy/history (archive does this at 727, 736). The seed loop in Pattern 3 already does.
**Warning signs:** Accuracy seems to seed but lookups miss.

## Code Examples

### CONFIG additions (src/config.js)
```javascript
// Source: ported verbatim from archive/math-lab.html CONFIG (604-619). DO NOT re-tune (CONTEXT line 29).
PROGRESS: {
  XP_EASY:    10,            // correct answer on tables 1–5
  XP_HARD:    20,            // correct answer on tables 6–9
  BASE_XP:    200,           // XP for Level 1 → 2
  LEVEL_MULT: 1.3,           // per-level threshold multiplier
  HARD_TABLES: [6, 7, 8, 9],
  EASY_TABLES: [1, 2, 3, 4, 5],
},
SAVE: {
  KEY:     "mathlab_platformer_v1", // NEW namespaced key — independent of the archive's mathlab_save_*
  VERSION: 1,                       // bump for future migrations
},
HUD: {
  X: 16, Y: 16,             // top-left anchor
  BADGE_SIZE: 18,
  BAR_W: 160, BAR_H: 10, BAR_DY: 24,
  FLASH_SIZE: 36, FLASH_MS: 450,    // ADHD-safe flash window (STATE.md tech-debt note)
},
```

### Boot / scene-start wiring (src/scenes/game.js)
```javascript
// Source: composes Patterns 1-5. Replaces the bare `const brain = createBrain();` (current line 56).
import { createProgress, loadSave, writeSave } from "../progress.js";
import { mountHud } from "../ui/hud.js";

const saved    = loadSave();                                   // guarded; defaults in node/blocked storage
const progress = createProgress(saved);                        // pure XP/level state (SAVE-01/03)
const brain    = createBrain({ seedAccuracy: saved.accuracy }); // resume weak-spot weighting (SAVE-03)
const hud      = mountHud(progress);                           // fixed HUD reflects loaded state (SAVE-04)
hud.refresh();                                                 // show loaded XP/level immediately

// Save when the tab is hidden (KAPLAY's visibilitychange wrapper — verified global).
onHide(() => writeSave(progress.serialize(brain.snapshot())));
// ...and inside onReachGoal's onClear({ table }) — see Pattern 4 (save on each clear).
```

### API Verification (re-confirmed against `lib/kaplay.mjs` this session)
Grep-confirmed present and (where noted) in the `global: true` binding block:
`add`, `fixed`, `z`, `rect`, `text`, `color`, `pos`, `anchor`, `opacity`, `width`, `height`, `center`, `onUpdate`, `tween`, `easings`, `destroy`, `destroyAll`, `wait` — all already used by `mathGate.js`/`game.js`.
`onHide` and `onShow` are present AND in the global binding block (`onHide:ve, onShow:qt`); internally KAPLAY wires `a.app.onHide(...)` to the page-hidden event, making it the engine-native `visibilitychange` equivalent.
`loadSpriteSheet` is **ABSENT** (confirmed) — not needed this phase (no new sprites); the HUD is pure `rect`/`text` draws.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-file IIFE singletons (PlayerState, PersistenceStore) | Factory functions per game session (`createProgress`, `createBrain`) | v3.0 multi-file refactor | Anti-leak across `go()` replays; required by the codebase's locked discipline |
| Raw `document.addEventListener("visibilitychange", ...)` | KAPLAY `onHide()` global | this phase (Kaplay context available) | Engine-managed lifecycle, auto-cleanup; either is valid |
| 800ms level-up flash | ~450ms flash | this phase (per v2.0 tech-debt note) | ADHD-safety; avoids over-stimulation regression |
| Migrating v1→v2 save | NO migration; fresh `mathlab_platformer_v1` | this phase (CONTEXT decision) | Clean, independent platformer progression — simpler, no cross-key coupling |

**Deprecated/outdated:**
- The archive's `migrate()` v1→v2 logic — NOT ported (CONTEXT line 35-36: no migration from the school game).
- HP/combat/dungeon/loot CONFIG and PlayerState methods — explicitly dropped (out of milestone scope).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | KAPLAY `onHide()` fires on tab-hide equivalently to `visibilitychange` (it wraps the page-hidden event). | Supporting / Code Examples | LOW — if it behaves differently, fall back to the archive's raw `visibilitychange` listener (Pattern 2 still saves on each clear regardless, so resume still works). Verified present + globally bound; semantics inferred from internal `a.app.onHide` audio-suspend usage. |
| A2 | Persisting both `accuracy` and `history` (not accuracy alone) is desired for full mastery resume. | Standard Stack Alternatives | LOW — accuracy alone already resumes weak-spot weighting (the selector reads accuracy). History only affects `isMastered` (drill reduction). Persisting both is cheap and matches the archive; recommend it, but accuracy-only also satisfies SAVE-03's literal wording. Confirm scope with planner. |
| A3 | `FLASH_MS = 450` is the right ADHD-safe flash duration. | Pitfall 5 / CONFIG | LOW — it's a CONFIG tunable; Phase 12 finalizes juice with the kid. 450 is the v2.0-recommended window, not yet UAT-confirmed for this game. |
| A4 | A single `if`/`while` level-up loop is fine because max award (20) < BASE_XP (200), so one clear never crosses two thresholds. | Pattern 1 | NONE — using a `while` makes it correct even if awards ever grow; defensive and free. |

## Open Questions

1. **Persist `history` as well as `accuracy`?**
   - What we know: the selector reads `accuracy`; `history` only feeds `isMastered` (drill-reduction). Archive persists both.
   - What's unclear: whether the planner wants full mastery resume or the minimal accuracy resume.
   - Recommendation: persist BOTH (cheap, archive-faithful, fully resumes adaptation). Seed via `createBrain({ seedAccuracy, seedHistory })`.

2. **Where exactly to mount the HUD and run the load — `main.js` boot vs. `game.js` scene start?**
   - What we know: run state lives in the scene closure (anti-leak); the brain is already constructed in `game.js`.
   - What's unclear: nothing blocking — both work.
   - Recommendation: do load + `createProgress` + `createBrain({seedAccuracy})` + `mountHud` INSIDE `gameScene` (closure), so a future `go("game")` re-loads cleanly and nothing lives at module scope. Keep `main.js` as the pure boot (kaplay init + sprite loads + `go`).

3. **`onHide` save vs. only save-on-clear?**
   - What we know: save-on-clear alone already persists every XP/accuracy change (XP only changes on a clear; accuracy changes on every gate answer, including wrong ones).
   - What's unclear: wrong answers update accuracy but don't trigger a clear — so without an onHide/onAnswer save, an in-progress accuracy change could be lost if she closes the tab mid-gate.
   - Recommendation: keep BOTH — save on clear (XP+accuracy) AND on `onHide` (captures accuracy drift from wrong attempts). Optionally also save inside the gate's `reportResult` path, but onHide is the cheaper catch-all.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| KAPLAY (vendored) | HUD draw + `onHide` | ✓ | 3001.0.19 (`lib/kaplay.mjs`) | — |
| `localStorage` (browser) | SAVE-02 persistence | ✓ (browser runtime) / ✗ (node) | native | In node/blocked storage → `loadSave` returns defaults, `writeSave` no-ops (Pattern 2) |
| node | headless XP-math smoke test ONLY | ✓ | local | — (validation aid, not a runtime dep) |
| `python3 -m http.server` / nginx | serve ES modules (file:// blocks them) | ✓ | documented (Phase 7) | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** `localStorage` in node — handled by the guarded seam so the pure math stays node-testable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | NONE (no JS test framework — project canon). Validation = `node --check` syntax gate + structural greps + a headless `node` import smoke of the pure XP/level math + manual browser UAT. |
| Config file | none — see Wave 0 (a `check-progress.sh` structural gate mirroring Phase 10's `check-gate.sh`) |
| Quick run command | `node --check src/progress.js && node --check src/ui/hud.js && node --check src/math/brain.js` |
| Full suite command | `bash scripts/check-progress.sh` (syntax + greps + headless math smoke) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SAVE-01 | correct answer awards XP; level-up carries surplus; HARD=20/EASY=10 | unit (headless) | `node -e "import('./src/progress.js').then(m=>{const p=m.createProgress();console.assert(p.addXp(7)===false);/* 20<200 */ ...})"` (or a `scripts/smoke-progress.mjs`) | ❌ Wave 0 |
| SAVE-01 | threshold = round(200·1.3^(L-1)) | unit (headless) | assert `p.threshold(1)===200 && p.threshold(2)===260` | ❌ Wave 0 |
| SAVE-02 | serialize/deserialize round-trips xp/level/accuracy with version field; guarded against node-undefined localStorage | unit (headless) + structural grep | smoke: `createProgress(p.serialize(brain.snapshot()))` round-trip; grep: `grep -q "mathlab_platformer_v1" src/config.js`; grep: `grep -q "QuotaExceededError" src/progress.js` | ❌ Wave 0 |
| SAVE-02 | progress.js imports NO kaplay (firewall) | structural grep | `! grep -qE "kaplay|fixed\(|add\(\[" src/progress.js` | ❌ Wave 0 |
| SAVE-03 | seeded brain over-selects a low-accuracy table vs. fresh brain | unit (headless, statistical) | smoke: seed table 7 = 0.05, draw 2000 `nextQuestion()`, assert table-7 share materially higher than fresh-brain baseline | ❌ Wave 0 |
| SAVE-03 | boot wires `createBrain({ seedAccuracy: saved.accuracy })` | structural grep | `grep -q "seedAccuracy" src/scenes/game.js && grep -q "seedAccuracy" src/math/brain.js` | ❌ Wave 0 |
| SAVE-03 | XP/level resume after reload | manual UAT | reload URL → badge/bar show prior level/XP | n/a (browser) |
| SAVE-04 | HUD shows level badge + XP fill bar; reads progress one-way | structural grep + manual | `grep -q "fixed()" src/ui/hud.js`; `! grep -qE "progress\.(addXp|level\s*=)" src/ui/hud.js` (no writes); visual check | ❌ Wave 0 |
| SAVE-04 | level-up flash fires only on threshold cross, ≤500ms | unit (return value) + manual | assert `addXp` returns true exactly on cross; visual flash check | ❌ Wave 0 |
| forgiving | wrong answer awards NO XP | structural grep | assert `addXp` called only from the `onClear({table})` hook, not the wrong branch: `! grep -n "addXp" src/ui/mathGate.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `node --check` on each touched module + the relevant grep(s).
- **Per wave merge:** `bash scripts/check-progress.sh` (syntax + all greps + headless math/seed smoke).
- **Phase gate:** full script green + manual browser playtest (reload-resume + weak-spot-resume + level-up flash) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `scripts/check-progress.sh` — structural gate (mirror `scripts/check-gate.sh` from Phase 10): syntax greps + firewall greps + invokes the math smoke.
- [ ] `scripts/smoke-progress.mjs` — headless node: XP/threshold assertions (SAVE-01), serialize round-trip (SAVE-02), seeded-brain weak-spot-resume statistical check (SAVE-03).
- [ ] No framework install needed (project has no JS test framework by design).

*(The highest-risk behaviors — reload-resume and weak-spot-adaptation-resume — get BOTH a headless smoke AND a manual UAT step, because the statistical seed check is the only automated proof that SAVE-03 actually resumes adaptation.)*

## Security Domain

`security_enforcement` is enabled (config), ASVS L1. This is an offline, no-backend, no-auth static game; the only attack surface is the localStorage save blob (attacker-controlled if she or a script edits it).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | no accounts, no auth |
| V3 Session Management | no | no sessions/server |
| V4 Access Control | no | single local user, no privileges |
| V5 Input Validation | **yes** | Validate the deserialized save: explicit-field copy (never `Object.assign(this, data)`), numeric/range checks on xp/level, `1..9` + `0..1` clamps on accuracy, boolean-only + window-clamped history (port archive 720-743). Prevents prototype-pollution (T-01-01) and corrupt-save crashes. |
| V6 Cryptography | no | no secrets; save is non-sensitive local progress |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious/corrupt localStorage blob → prototype pollution | Tampering | Explicit named-field copy in `deserialize`/`validate`; no spread/`Object.assign(this, data)`; reject `__proto__`/`constructor` implicitly by only reading whitelisted keys (archive pattern, T-01-01) |
| Corrupt JSON / wrong version crashes the game | Denial of Service | try-catch `JSON.parse`; version mismatch → defaults; never throw into the game loop (Pattern 2) |
| Quota-exceeded write crashes the loop | Denial of Service | catch `QuotaExceededError`, warn, continue (forgiving — progress just isn't saved that write) |
| HUD/gate rendering of saved values | Injection | None — values are drawn via KAPLAY `text()` canvas draws, NOT DOM/innerHTML (continues the game.js/mathGate.js no-DOM-sink guard); numbers only, no string injection path |

## Sources

### Primary (HIGH confidence)
- `archive/math-lab.html` (direct read) — CONFIG 604-619, XpCalculator 648-657, PlayerState 663-753, PersistenceStore 760-903, levelUpFlash keyframe 266-275. The verbatim port source.
- `src/math/brain.js`, `src/ui/mathGate.js`, `src/scenes/game.js`, `src/config.js`, `src/main.js` (direct read) — the exact seams to extend (`onClear`, `createBrain`, CONFIG namespaces, boot).
- `lib/kaplay.mjs` (grep verification this session) — confirmed `onHide`/`onShow` present + globally bound; `fixed`/`z`/`rect`/`text`/`onUpdate`/`tween`/`destroy` present; `loadSpriteSheet` ABSENT.
- `node -e "typeof localStorage"` → `undefined` (direct execution) — node has no localStorage; drives the guarded-seam requirement.
- `.planning/phases/11-progression-persistence/11-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `./.claude/CLAUDE.md` — locked decisions, requirement IDs, persistence pattern.

### Secondary (MEDIUM confidence)
- `.planning/phases/08-platformer-core-movement-physics-camera/08-PATTERNS.md` — confirms ESM/global-binding conventions and the anti-leak scene-closure discipline reused here.

### Tertiary (LOW confidence)
- None. All external search providers are disabled in config; this phase is fully source-grounded against vendored code and the archive — no web fetch performed or needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; every primitive verified in the vendored engine or the archive.
- Architecture: HIGH — extends existing, working seams (onClear, createBrain, scene closure) per locked CONTEXT decisions.
- Pitfalls: HIGH — node-localStorage and anti-leak pitfalls verified directly; ADHD flash-duration is a known v2.0 tech-debt note.

**Research date:** 2026-06-26
**Valid until:** 2026-07-26 (stable — vendored pinned engine, verbatim port of frozen archive code; the only volatility is planner choices in the Open Questions).
