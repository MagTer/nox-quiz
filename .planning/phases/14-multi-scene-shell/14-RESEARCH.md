# Phase 14: Multi-Scene Shell - Research

**Researched:** 2026-06-29
**Domain:** Kaplay 3001 multi-scene navigation + scene-teardown/state-hygiene contract (NAV-01..04)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Scene Architecture & State Hygiene (NAV-04)**
- One factory module per scene: `src/scenes/title.js` and `src/scenes/select.js` alongside the existing `src/scenes/game.js`, each exporting a scene callback and registered in `main.js` (mirror the existing `scene("game", gameScene)` pattern).
- NAV-04 no-leak contract: ALL input/update/collide handlers are registered INSIDE scene bodies so Kaplay tears them down on `go()`; scenes cancel any controllers they create; NEVER register input/update at module top level (a727c13 — engine globals only inside scene-time function bodies).
- The chosen level reaches the game scene via `go("game", { levelId })` data payload — never a module-level variable (the Phase 9/13 anti-leak pattern). The game scene already reads its level by id; thread `levelId` through it.
- Verification: extend `scripts/check-import-safety.sh` (must stay green) PLUS a real browser boot that enters→leaves→re-enters each screen twice and confirms no leaked input handlers, colliders, tweens, or effects (greps passing ≠ boots).

**Title Screen (NAV-01)**
- Title shows the game name ("Math Lab") + a one-line "press to start" prompt; minimal dark-grunge styling now, real art deferred to Phase 18.
- She advances from the title via EITHER keyboard (Enter/Space) OR a mouse click (she plays on a laptop).
- Single entry point → level-select (no separate "Continue" — the select screen itself surfaces progress, so a New/Continue split is unnecessary).

**Level-Select Screen (NAV-02 / NAV-03)**
- Layout: a row of numbered level tiles in `LEVEL_ORDER` — lists EVERY registered level (only `level-01` exists today, but built to grow as Phase 17 adds levels).
- Three visually distinct states per tile: LOCKED (dimmed + lock glyph, not selectable), UNLOCKED (bright, selectable), CLEARED (a check/done mark). Exact art deferred to Phase 18, but the three states must be visually distinguishable in THIS phase.
- Selection/navigation: arrow keys move between UNLOCKED tiles + Enter to play, AND mouse click on an unlocked tile; locked tiles are never selectable.
- After clearing a level: return to LEVEL-SELECT (now showing the newly-unlocked next level); Escape also returns from a level to select. No forced replay of earlier levels and NO auto-advance into the next level — she keeps agency (NAV-03, ADHD-friendly, low-pressure).

### Claude's Discretion
- Exact module/file layout and naming under `src/scenes/` and any new select-screen UI helper under `src/ui/`; exact tile geometry/spacing/glyphs (within the dark-grunge, no-pink, distinguishable-states constraint — UI-SPEC will formalize visuals); exact key bindings beyond the accepted Enter/Space/Escape/arrows/click; whether the unlock-derivation read uses the registry's `isUnlocked` helper directly.
- A reset-progress affordance is intentionally NOT in this phase (deferred — avoid accidental wipes; the v2 clean-reset key already handles a fresh slate).

### Deferred Ideas (OUT OF SCOPE)
- Real art/animation, parallax, and FINAL styling of title/select screens (Phase 18).
- A reset-progress affordance on the title (deferred — accidental-wipe risk).
- The shared challenge seam + mechanics + locked-door (Phases 15/16).
- Additional authored levels + platforming difficulty ramp (Phase 17).
- Stars / scoring / completion texture (out of scope, v4.0).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | A dark-grunge title screen is shown on load, from which she can start/continue into the game. | New `src/scenes/title.js` factory; `main.js` boots `go("title")` instead of `go("game", ...)`; dual-input start (keyboard `onKeyPress("enter"/"space")` + `onClick`) registered inside the scene body. Patterns 1, 5. |
| NAV-02 | A level-select screen lists levels with locked/unlocked/cleared state; pick any unlocked level. | New `src/scenes/select.js` factory reads `LEVEL_ORDER` (registry) + `loadSave()`→`createProgress()` and per-tile `isUnlocked(id, progress)` / `isLevelCleared(id)`; three distinguishable tile states; `go("game", { levelId })` on pick. Patterns 2, 3; Architectural Responsibility Map. |
| NAV-03 | Clearing unlocks the next; return to select and resume any unlocked level (no forced replay). | game.js `onClear` already calls `progress.markCleared(level.id)` + `writeSave(...)`; ADD `go("select")` on clear (replacing the terminal stay) + an Escape→select controller. Unlock is DERIVED in the registry (`isUnlocked`) from cleared facts — no auto-advance. Pattern 4; Pitfall 2. |
| NAV-04 | Scene-based navigation with clean state on every entry — no leaked input handlers, colliders, tweens, or effects across enter→leave→re-enter. | Kaplay 3001.0.19 `go()` teardown contract (verified in the vendored bundle): `app.events.clear()` + `game.events.clear()` + `objEvents.clear()` + remove all non-`stay()` root children. Register all controllers inside scene bodies; cancel any app-bus controller you hold a handle to (belt-and-braces, mirrors game.js `onHide`/`_fxScaleTween`). Verified by `check-import-safety.sh` + real browser boot. Patterns 1, 5, 6; Pitfalls 1, 2, 3; Don't Hand-Roll. |
</phase_requirements>

## Summary

Phase 14 generalizes the single-scene boot (`go("game", { startX, startY })`) into a three-scene shell — **title → select → game** — using the exact per-scene factory pattern already proven in `src/scenes/game.js`. Each scene is a callback `(data) => {...}` registered via `scene(name, fn)` in `main.js`; engine globals are touched ONLY inside those bodies (a727c13); all run/selection state lives in the closure and crosses scenes ONLY through the `go(name, data)` payload — never a module-level `let`. There are zero new runtime dependencies; everything is native to the vendored Kaplay 3001.0.19 bundle and the existing pure modules (`levels/index.js`, `progress.js`).

The single most important finding — **the Kaplay 3001.0.19 `go()` teardown contract** — was verified by decompiling the vendored bundle's `go` implementation (function `ha`), not just the docs. On every `go()`, at the next `frameEnd`, Kaplay: (1) fires `onSceneLeave` callbacks, (2) **clears the entire app event bus** (`a.app.events.clear()` — this catches global `onKeyPress`/`onKeyDown`/`onClick`/`onHide`/`onShow`), (3) clears `game.events` and `objEvents` (per-frame `onUpdate`, tween/timer drivers, collisions), (4) removes every root child that lacks `stay()` (game objects with their `area`/`body`/`onCollide`/`obj.onUpdate`), then (5) runs the target scene. This means in **3001** — unlike the 4000-era `defaultLifetimeScope` model the web docs describe — global handlers registered inside a scene body ARE auto-cancelled on scene change. NAV-04's no-leak guarantee therefore rests on ONE discipline: **register everything inside the scene body, and never re-register the same global twice without leaving the scene.** The residual leak risk is (a) a controller registered at MODULE TOP LEVEL (which also throws at import — a727c13), (b) a `stay()` object (none needed this phase — do not introduce one), and (c) a controller registered on the app bus that you re-register on every entry AND also hold a stale closure to — already mitigated in game.js's `onHide`/`onSceneLeave(cancel)` belt-and-braces idiom, which the new scenes should mirror for any app-bus controller they create.

**Primary recommendation:** Create `src/scenes/title.js` and `src/scenes/select.js` as factory callbacks that mirror `game.js` line-for-line in discipline (closure state, body-only globals, no module-level run state). In `main.js`, register all three scenes then `go("title")`. Add `go("select")` + an Escape→select controller to game.js's `onClear` path and thread `levelId` through its existing `data?.levelId` read (already wired — line 65). Extend the verification gate by writing the not-yet-existent `scripts/check-import-safety.sh` (model it on `check-progress.sh`/`check-safety.sh`) to assert the new scene modules keep engine globals out of module top level, and finish on a mandatory real browser enter→leave→re-enter-twice boot.

## Architectural Responsibility Map

This is a single-tier offline browser game (no backend, no SSR, no CDN logic). The relevant "tiers" are the in-engine scene graph vs. the pure (engine-free) data/logic modules. The firewall between them is the load-bearing boundary.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Boot + scene registration | Engine shell (`main.js`) | — | `kaplay()` init, asset loads, `scene(...)`, `go("title")` all live here (the only place globals exist at module scope, post-init). |
| Title screen UI + start input | Engine scene (`scenes/title.js`) | — | Pure canvas `text()`/`rect()` + dual-input controllers, ALL inside the scene body (a727c13). |
| Level-select UI + tile state render | Engine scene (`scenes/select.js`) + optional `ui/selectTiles.js` helper | Pure registry/progress (read) | Tiles are canvas objects; their locked/unlocked/cleared state is READ from the pure tier on entry. |
| Level order + derived unlock | Pure data (`levels/index.js`) | — | `LEVEL_ORDER` + `isUnlocked(id, progress)` — node-importable, no engine, no storage. The select screen's source of truth. |
| Cleared facts + persistence | Pure logic (`progress.js`) | — | `createProgress`/`loadSave`/`writeSave`/`isLevelCleared`/`markCleared` — engine-free firewall module. |
| Level play + clear → unlock-next | Engine scene (`scenes/game.js`) | Pure progress (write) | Game scene reads `levelId` from `go()` data, plays, on clear calls `markCleared`+`writeSave`, then `go("select")`. |
| Cross-scene state transport | `go(name, data)` payload | — | The ONLY legal channel between scenes (anti-leak); never a module-level variable. |

**Tier-correctness check for the planner:** the select screen must NOT compute or store its own "unlocked" booleans — it READS `isUnlocked(id, progress)` from the registry (one source of truth; Pitfall 2). The pure tier (`levels/`, `progress.js`) must remain node-importable (no engine globals) — `check-progress.sh` already asserts this for `levels/index.js` and `level-01.js`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay (vendored) | 3001.0.19 (pinned, sha256 `fb4a4ef2…`) | Scene graph, `scene()`/`go()`/`onSceneLeave`, canvas draw, input | Already the project engine; `scene`/`go` are the native multi-screen primitive — no router/framework needed. [VERIFIED: lib/kaplay.mjs header + bundle `ha`/`fa`/`ga` decompile] |
| Vanilla ES2020 modules | — | Scene factories, registry/progress reads | Project canon; zero build step. [VERIFIED: existing src/ tree] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/levels/index.js` (existing) | Phase 13 | `LEVEL_ORDER`, `getLevel`, `isUnlocked(id, progress)` | Select screen reads these on every entry. [VERIFIED: file read] |
| `src/progress.js` (existing) | Phase 13 | `loadSave`/`createProgress`/`isLevelCleared`/`markCleared`/`writeSave` | Select reads cleared; game persists a clear. [VERIFIED: file read] |
| `src/config.js` (existing) | — | New CONFIG block for title/select layout constants (no magic numbers in scene logic) | Add `CONFIG.TITLE` / `CONFIG.SELECT` tuning consts following the existing GATE/HUD/HINT pattern. [VERIFIED: config.js read] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Kaplay `scene()`/`go()` | A hand-rolled state-machine swapping `add`/`destroyAll` in one scene | Loses Kaplay's automatic full-teardown on `go()` (the NAV-04 safety net) — you would have to manually destroy every object/handler yourself. Strictly worse; reject. |
| `go("game", { levelId })` data payload | Module-level `let selectedLevelId` | Direct violation of the locked anti-leak decision + Pitfall 2; a stale value survives across scenes. Reject. |
| A `ui/selectTiles.js` helper | Inline tile drawing in `select.js` | Either is fine (Claude's Discretion). A helper mirrors `ui/hud.js` and keeps the scene body lean; inline is acceptable for the single-row layout. |

**Installation:**
```bash
# No installation — zero new runtime dependencies. v4.0 capabilities are native to the
# vendored Kaplay 3001.0.19 bundle. Do NOT add packages; do NOT upgrade Kaplay (pin held).
```

**Version verification:** The vendored bundle self-reports `version:"3001.0.19"` and `VERSION` constant in-file; header records `sha256: fb4a4ef2392e9bf95601f01ddfcf2b0bc27b46636201747dfa1c560e0ec2dac5`, source `https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs`. [VERIFIED: lib/kaplay.mjs header + grep `"3001.0.19"`] No registry install occurs; the pin is immutable per STATE.md ("Upgrading Kaplay past 3001.0.19" is out of scope).

## Package Legitimacy Audit

> Phase 14 installs **no external packages**. The only third-party code is the already-vendored, sha256-pinned Kaplay 3001.0.19 bundle (added in Phase 7, integrity-recorded). No npm/PyPI/crates resolution happens in this phase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| kaplay@3001.0.19 (vendored, not installed) | npm (origin) | mature | high | github.com/kaplayjs/kaplay | OK (pinned + sha256-verified) | Already vendored — no action |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                          ┌──────────────────────────────────────────────┐
   browser load           │  main.js (engine shell — module scope OK)     │
        │                 │  kaplay({...}) → loadSprite(...)               │
        ▼                 │  scene("title",titleScene)                    │
   index.html (file://    │  scene("select",selectScene)                  │
   guard) → main.js       │  scene("game",gameScene)                      │
        │                 │  go("title")   ◄── boot entry (was go("game"))│
        ▼                 └───────────────┬──────────────────────────────┘
                                          │ go("title")
                                          ▼
                          ┌──────────────────────────────────────┐
                          │  TITLE scene (scenes/title.js)         │
                          │  draws "Math Lab" + "press to start"   │
                          │  onKeyPress("enter"/"space") ─┐        │
                          │  onClick() ───────────────────┤        │
                          └───────────────────────────────┼────────┘
                                                          │ go("select")
                                                          ▼
   reads on EVERY entry ──────────────►  ┌──────────────────────────────────────┐
   ┌───────────────────────────┐         │  SELECT scene (scenes/select.js)      │
   │ levels/index.js (pure)    │◄────────│  loadSave()→createProgress(saved)     │
   │  LEVEL_ORDER              │         │  for id in LEVEL_ORDER:                │
   │  isUnlocked(id,progress)  │         │    state = cleared? / unlocked? /lock │
   │ progress.js (pure)        │◄────────│    draw tile (3 distinct states)      │
   │  isLevelCleared(id)       │         │  arrows move sel · Enter / click play │
   └───────────────────────────┘         └───────────────┬──────────────────────┘
                                                          │ go("game", { levelId })
                                                          ▼
                          ┌──────────────────────────────────────────────┐
                          │  GAME scene (scenes/game.js — EXISTING)        │
                          │  level = getLevel(data?.levelId ?? ORDER[0])   │
                          │  …play… on clear:                              │
                          │    progress.markCleared(level.id)              │
                          │    writeSave(progress.serialize(...))          │
                          │    go("select")   ◄── NEW (was: terminal stay) │
                          │  onKeyPress("escape") → go("select")  ◄── NEW  │
                          └───────────────┬──────────────────────────────┘
                                          │ go("select")  → unlock derived fresh
                                          ▼
                                    (back to SELECT — next level now unlocked)

   ── go() teardown (Kaplay 3001 `ha`) on EVERY arrow above, at next frameEnd ──
      trigger onSceneLeave → app.events.clear() → game.events.clear()
      → objEvents.clear() → remove all non-stay() root children → run target scene
```

### Recommended Project Structure
```
src/
├── main.js              # register title/select/game; go("title") on boot (was go("game"))
├── scenes/
│   ├── title.js         # NEW — title factory (dual-input start → go("select"))
│   ├── select.js        # NEW — level-select factory (tiles, nav, → go("game",{levelId}))
│   └── game.js          # EXISTING — thread levelId (already read), add go("select")+escape on clear
├── ui/
│   ├── selectTiles.js   # OPTIONAL helper (Claude's Discretion) — mirrors ui/hud.js factory idiom
│   ├── hud.js           # EXISTING — the in-scene UI factory template
│   └── mathGate.js      # EXISTING — the app-bus-controller cancel template (keyCtrls.forEach(cancel))
├── levels/index.js      # EXISTING (pure) — LEVEL_ORDER + isUnlocked (select's source of truth)
└── progress.js          # EXISTING (pure) — loadSave/createProgress/isLevelCleared/markCleared
scripts/
└── check-import-safety.sh  # NEW — a727c13 gate for scenes/* (model on check-progress.sh §13)
```

### Pattern 1: Scene factory — closure-owned state, body-only globals (a727c13)
**What:** Each scene is `export function xScene(data) { /* engine globals ONLY here */ }`, registered via `scene("x", xScene)` in main.js. ALL state is `const`/`let` in the closure, seeded from `data`.
**When to use:** Every scene, no exception. This is the locked pattern.
**Example:**
```javascript
// Source: src/scenes/game.js lines 31-65 (the existing, shipped template)
export function gameScene(data) {
  setGravity(CONFIG.GRAVITY);                  // engine global — INSIDE the body (a727c13-safe)
  const startX = data?.startX ?? 64;           // closure-local, seeded from go() payload
  let coinsCollected = 0;                      // closure-local run state — NEVER module-level
  const level = getLevel(data?.levelId ?? LEVEL_ORDER[0]); // levelId already threaded (line 65)
  // … all add()/onKeyPress()/onUpdate() calls live here …
}
// title.js / select.js mirror this exactly: no top-level engine reference, no module-level run state.
```

### Pattern 2: Select-screen tile state — derived, read fresh on every entry
**What:** On scene entry, load the save once, build a progress instance, then for each id in `LEVEL_ORDER` compute its three-way state from the PURE tier. Never cache across scenes.
**When to use:** The select scene body, top of factory.
**Example:**
```javascript
// Source: derived from src/levels/index.js:36 (isUnlocked) + src/progress.js (isLevelCleared)
// inside selectScene(data):
const progress = createProgress(loadSave());        // fresh read every entry (clean state, NAV-04)
const tiles = LEVEL_ORDER.map((id, i) => {
  const cleared  = progress.isLevelCleared(id);
  const unlocked = isUnlocked(id, progress);        // registry derives from LEVEL_ORDER + cleared facts
  const state = cleared ? "cleared" : unlocked ? "unlocked" : "locked";
  return { id, i, state };                           // draw 3 visually-distinct states; locked not selectable
});
```

### Pattern 3: Dual-input selection (keyboard + mouse), no locked-tile selection
**What:** Arrow keys move a cursor among UNLOCKED tiles; Enter plays the cursor; each unlocked tile also gets `obj.onClick`. Locked tiles get no click handler and are skipped by the cursor.
**When to use:** Select scene. Mirror the gate's dual-input (`box.onClick` + `onKeyPress`) idiom.
**Example:**
```javascript
// Source: src/ui/mathGate.js:147,158 (dual-input precedent)
tile.onClick(() => { if (tile.state !== "locked") go("game", { levelId: tile.id }); }); // obj-scoped: auto-cleaned
const navCtrls = [
  onKeyPress("left",  () => moveCursor(-1)),   // app-bus controllers — auto-cleared by go()
  onKeyPress("right", () => moveCursor(+1)),   // (3001 contract); cancel-on-leave optional but encouraged
  onKeyPress("enter", () => playCursor()),
];
```

### Pattern 4: Clear → return-to-select (no auto-advance), Escape → select
**What:** In game.js `onClear`, AFTER the existing `markCleared`+`writeSave`, call `go("select")`. Also register an Escape controller inside the scene body that `go("select")`. Unlock of the next level is then DERIVED freshly when select re-renders.
**When to use:** game.js clear path + scene body.
**Example:**
```javascript
// Source: extends src/scenes/game.js onClear (lines 171-195) — the persist already exists
onClear({ table }) {
  const leveledUp = progress.addXp(table);
  progress.markCleared(level.id);                       // EXISTING (SAVE-06)
  hud.refresh(); if (leveledUp) hud.flashLevelUp();
  fx.clearBurst();
  writeSave(progress.serialize(brain.snapshot()));      // EXISTING persist
  go("select");                                          // NEW — return to select; next level derives unlocked
}
// elsewhere in the scene body:
onKeyPress("escape", () => go("select"));                // NEW — bail back to select (NAV-03 agency)
```
**Note:** Today the gate renders a TERMINAL "LEVEL CLEAR" banner and the scene stays. Adding `go("select")` changes that to a return. The planner should decide the beat: either `go("select")` immediately from `onClear`, or after the existing burst — but with NO timer/scheduler (SAFE-01). Simplest compliant choice: `go("select")` directly in `onClear` (the burst still renders for the frame before teardown; if a visible beat is wanted, gate it on a key/click, never a `wait()`).

### Pattern 5: main.js boot generalization
**What:** Register all three scenes, then boot the title.
**Example:**
```javascript
// Source: extends src/main.js:66-68
scene("title", titleScene);
scene("select", selectScene);
scene("game", gameScene);
go("title");                                  // was: go("game", { startX: 64, startY: 64 })
```
**Note:** `startX/startY` for the game scene now come from the level/registry (game.js already defaults `data?.startX ?? 64`). The select→game `go("game", { levelId })` need not pass start coords; game.js keeps its defaults. Leave the existing `loadSprite(...)` asset calls in main.js untouched (assets load before any scene runs).

### Pattern 6: Belt-and-braces cancel for app-bus controllers you hold a handle to
**What:** Although Kaplay 3001 `go()` clears the app bus, the project convention (game.js) is to ALSO cancel any app-bus controller the scene constructs, via `onSceneLeave`. Continue this for any new `onHide`/persistent controller; plain navigation `onKeyPress`/`onClick` are auto-cleared and need no explicit cancel (but cancelling is harmless and the audit may require it).
**Example:**
```javascript
// Source: src/scenes/game.js:225-226
const hideCtrl = onHide(() => writeSave(progress.serialize(brain.snapshot())));
onSceneLeave(() => hideCtrl.cancel());        // explicit cancel — survives the app.events.clear() race-free
```

### Anti-Patterns to Avoid
- **Top-level engine reference in a scene module:** `const x = vec2(0)` or `onKeyPress(...)` at module scope (outside the factory). Throws at import (globals don't exist until `kaplay()` runs) AND blanks the game (a727c13 — the exact bug that bit `level.js`). Everything goes inside the factory body.
- **Module-level run/selection state:** `let selectedLevelId` at module scope. Survives across scenes/re-entries → stale state. Use the `go()` payload + closure-local.
- **Introducing `stay()`:** No object should survive a scene change this phase. A `stay()` object would dodge the teardown and is the one way to LEAK across `go()`. Do not add one.
- **Re-deriving/storing "unlocked" in the select screen:** Unlock is owned by the registry (`isUnlocked`). Storing it in the save or the scene desyncs from cleared facts (Pitfall 2 / locked decision).
- **Any timer/scheduler to delay a transition:** `wait()`/`setTimeout` to "show the clear banner then go". Violates SAFE-01 (check-safety.sh bans `wait(`/`loop(`/`setTimeout`). Gate beats on input or transition immediately.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tearing down a screen's objects/handlers on navigation | A manual "destroy everything I added" cleanup list per screen | Kaplay `go()` (it does `app.events.clear()`+`game.events.clear()`+`objEvents.clear()`+remove non-`stay()` children) | The engine already does a total teardown; a hand-rolled list will miss something and reintroduce the exact leak NAV-04 forbids. [VERIFIED: bundle `ha`] |
| Knowing which level is unlocked | A stored `unlocked` flag or per-screen recompute | `isUnlocked(id, progress)` from `levels/index.js` | One source of truth (derived from `LEVEL_ORDER` + cleared facts); avoids desync. [VERIFIED: levels/index.js:36] |
| Cross-scene data hand-off | A module-level shared variable | `go(name, data)` payload + closure read | Anti-leak; a module var survives teardown and goes stale. [VERIFIED: game.js:65 `data?.levelId`] |
| Routing / navigation state | A hand-written router/URL/history layer | Three `scene()` registrations + `go(name)` | Native, zero-dep, and gives the teardown for free. [CITED: kaplayjs.com/docs/guides/scenes] |
| Persisting cleared/unlock state | Re-implementing storage in a scene | `loadSave`/`writeSave`/`markCleared` (progress.js, guarded) | Already firewalled, validated, quota-safe, node-importable. [VERIFIED: progress.js] |

**Key insight:** In Kaplay 3001 the scene boundary is a hard reset of the app/game/object event buses plus the object graph. NAV-04 is satisfied by *leaning on* that reset (everything inside scene bodies), not by adding cleanup machinery. The only things that escape the reset are module-top-level registrations (which also break a727c13) and `stay()` objects (which we don't create) — so the audit reduces to: "no engine globals at module scope, no `stay()`, no module-level run state."

## Runtime State Inventory

> Phase 14 is NOT a rename/migration phase — it adds new scene modules and rewires the boot/clear path. No stored-data keys, OS registrations, or secrets change. This section is included briefly because the phase touches the boot path and persistence read/write timing.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | localStorage key `mathlab_platformer_v2` (CONFIG.SAVE.KEY, VERSION 2). Phase 14 only READS it on select entry and the game scene continues to WRITE it on clear. The cleared-facts map (`levels[id].cleared`) is the unlock source. | None — no key/shape change. Select reads via `loadSave()`; game persists via `writeSave()` (both existing). |
| Live service config | None — offline browser game, no external services. | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | None. | None. |
| Build artifacts | No build step (no-build canon). Vendored `lib/kaplay.mjs` unchanged. | None. |

**Boot-path note (not "runtime state" but boot-critical):** `main.js` currently boots `go("game", { startX: 64, startY: 64 })`. Changing this to `go("title")` is the one boot-behavior change — verify the title actually renders on load (real browser boot), since a broken scene registration order or an a727c13 throw in a new scene module would blank the canvas with only a console error (the most expensive v3.0 lesson).

## Common Pitfalls

### Pitfall 1: a727c13 — engine global at module top level in a new scene file
**What goes wrong:** A new `scenes/title.js`/`select.js` references `add`/`onKeyPress`/`vec2`/`text`/`rgb` (or even a `typeof Rect` guard) at module scope. The ES module import is hoisted and runs BEFORE `main.js` calls `kaplay({ global: true })`, so the global doesn't exist yet → `ReferenceError` at import → the whole game blanks (only a console error).
**Why it happens:** Copy-pasting a helper or a palette constant that calls an engine fn at module scope; or "hoisting" a controller out of the factory for readability.
**How to avoid:** Keep EVERY engine call inside the exported factory body. Plain data literals (color arrays like `const ACCENT_GREEN = [0,255,136]`) at module scope are fine — they call nothing. Mirror `fx.js`'s explicit discipline note (fx.js:11-20).
**Warning signs:** Canvas blank on load; `ReferenceError: add is not defined` (or `rgb`, `vec2`, …) in the console at import time. `check-import-safety.sh` (this phase) + the browser boot catch it.

### Pitfall 2: Cross-scene state / handler / tween leak on re-entry
**What goes wrong:** Something survives `go()` and stacks on re-entry: a module-level `let selectedLevelId` goes stale; a `stay()` object lingers; or an app-bus controller is re-registered every entry while a stale closure also persists, so a later tab-hide/keypress hits a dead scene's state (the exact `onHide`-stacking hazard game.js:220-226 documents).
**Why it happens:** Treating a scene like a long-lived singleton; hoisting selection state to module scope; adding `stay()` for convenience.
**How to avoid:** Closure-local state only; `go()` payload for hand-off; never `stay()` this phase; for any app-bus controller you hold a handle to, `onSceneLeave(() => ctrl.cancel())` (Pattern 6). In 3001, `go()` already clears the app bus, so plain navigation controllers need no manual cancel — but DO NOT rely on that for a controller you also keep a reference to and re-create each entry.
**Warning signs:** Pressing a key fires its action twice after one round-trip; the select cursor "remembers" a stale position; the game scene reacts after you've left it. The mandatory enter→leave→re-enter-twice boot is designed to surface exactly this.

### Pitfall 3: Re-entry test passes the grep but fails the boot (greps ≠ boots)
**What goes wrong:** `check-import-safety.sh` is green (no top-level globals) but a real navigation cycle leaks or a scene fails to render, because a static grep cannot observe runtime handler counts, double-fired inputs, or a blanked canvas.
**Why it happens:** Over-trusting the static gate; skipping the browser run (the single most expensive v3.0 lesson, STATE.md §"Cross-Cutting Mitigations 2").
**How to avoid:** End the phase with a REAL browser boot: title → select (shows level-01 unlocked) → play → clear → back to select, THEN enter→leave→re-enter each screen twice and confirm no double inputs / lingering objects / blanked canvas. Use DevTools to spot-check (e.g. count app event listeners or just verify a single keypress fires once).
**Warning signs:** "It greps clean so it must work" — the failure mode that motivated the mandatory-boot rule.

### Pitfall 4: The clear→select transition fights the gate's terminal banner / SAFE-01
**What goes wrong:** game.js's `onClear` today renders a PERSISTENT "LEVEL CLEAR" state and the scene stays. Adding `go("select")` must not (a) leave the gate's `gate-cleared`-tagged objects orphaned (they're torn down by `go()` anyway), nor (b) tempt a `wait()`/timer to "let the banner show" (SAFE-01 violation — check-safety.sh bans `wait(`/`loop(`/`setTimeout`).
**Why it happens:** Wanting a celebratory beat before leaving; reaching for a scheduler.
**How to avoid:** Either `go("select")` directly in `onClear` (teardown wipes the gate objects cleanly — they're `fixed()` canvas objects, no `stay()`), or gate the transition on an input ("press to continue"), never on elapsed time. The existing `fx.clearBurst()` still fires for the current frame.
**Warning signs:** A `wait(`/`setTimeout` appears near the transition → check-safety.sh goes red; or `gate-cleared` objects flicker into the next scene (they won't, given teardown, but verify in the boot).

### Pitfall 5: `check-import-safety.sh` over-scopes and false-flags game.js / build.js
**What goes wrong:** The new a727c13 gate greps for engine tokens (`add(`/`onKeyPress(`/`vec2(`/`text(`) and flags `scenes/game.js`, `scenes/title.js`, `scenes/select.js`, `levels/build.js`, `ui/*.js` — but those LEGITIMATELY use engine globals INSIDE their function bodies. A naive whole-file grep would fail on correct code.
**Why it happens:** Copying `check-progress.sh §13` (which is correctly SCOPED to the PURE modules `level-01.js`/`index.js` and explicitly EXCLUDES `build.js`) without preserving the scoping.
**How to avoid:** The gate must assert "no engine global at MODULE TOP LEVEL" — i.e. outside any function body — for the SCENE modules, not "no engine global anywhere." Two viable approaches: (a) scope the negative grep to lines NOT inside a function (harder in bash), or (b) the pragmatic project idiom — assert the structural invariants positively (each scene file `export function …Scene(`, registered in main.js) and run `node --check`, plus a targeted negative grep for the known top-level-trap forms (`^const .*=.*\b(add|rect|sprite|vec2|onKeyPress|onUpdate)\(` and `^[^/]*typeof (Rect|add|vec2)`), comment-stripped via the existing `strip_comments` idiom. Model on `check-progress.sh` lines 122-126 and reuse its `strip_comments`/`fail`/`ROOT` scaffolding.
**Warning signs:** The new gate fails on shipped, correct `game.js`; or it's so loose it would miss a real top-level `onKeyPress(`. Calibrate against BOTH the existing-good files (must stay green) and a deliberately-bad fixture (a top-level `add(` must go red).

## Code Examples

### check-import-safety.sh skeleton (model on check-progress.sh)
```bash
# Source: pattern from scripts/check-progress.sh:21-45,122-126 (strip_comments + scoped negative grep)
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
fail() { echo "import-safety checks: FAIL — $1" >&2; exit 1; }
strip_comments() { sed -E 's://.*$::' "$1"; }

# 0. Existence + syntax for the new + existing scene modules.
for f in src/scenes/title.js src/scenes/select.js src/scenes/game.js src/main.js; do
  [ -f "$ROOT/$f" ] || fail "missing module: $f"
  node --check "$ROOT/$f" || fail "node --check failed (syntax error in $f)"
done

# 1. POSITIVE — each scene exports a factory and main.js registers + boots it.
grep -Eq 'export function .*[Ss]cene\(' "$ROOT/src/scenes/title.js"  || fail "title.js must export a scene factory"
grep -Eq 'export function .*[Ss]cene\(' "$ROOT/src/scenes/select.js" || fail "select.js must export a scene factory"
grep -q 'scene("title"'  "$ROOT/src/main.js" || fail "main.js must register the title scene"
grep -q 'scene("select"' "$ROOT/src/main.js" || fail "main.js must register the select scene"
grep -q 'go("title"'     "$ROOT/src/main.js" || fail "main.js must boot go(\"title\")"

# 2. NEGATIVE — a727c13: no engine global at MODULE TOP LEVEL in the scene modules.
#    Comment-stripped; matches the known top-level-trap forms only (a bare `const x = add(...)`
#    or a `typeof <global>` guard at column 0 — i.e. NOT indented inside a function body).
for f in src/scenes/title.js src/scenes/select.js; do
  if strip_comments "$ROOT/$f" | grep -Eq '^(const|let|var)[^=]*=[^=]*\b(add|rect|sprite|text|vec2|rgb|onKeyPress|onKeyDown|onClick|onUpdate)\(' \
     || strip_comments "$ROOT/$f" | grep -Eq '^[[:space:]]*typeof (Rect|add|vec2|rgb)'; then
    fail "engine global at module top level in $f — a727c13 (must be inside the scene body)"
  fi
done

echo "import-safety checks: PASS"
```
*(Calibrate against a deliberately-bad fixture — a top-level `const c = add([...])` must turn this red — and confirm the shipped `game.js` stays green. Wire this into the per-phase verification alongside `check-safety.sh` + `check-progress.sh`.)*

### Threading levelId (already wired — confirm, don't rebuild)
```javascript
// Source: src/scenes/game.js:65 — the read ALREADY exists; select just supplies the payload.
const level = getLevel(data?.levelId ?? LEVEL_ORDER[0]); // forgiving: junk id → LEVEL_ORDER[0]
// from select.js: go("game", { levelId: tile.id });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `scene("game")` booted directly | Three scenes (`title`/`select`/`game`) with `go()` navigation | Phase 14 (this) | First reintroduction of cross-scene leak + a727c13 surface since v3.0 single-scene. |
| `go("game", { startX, startY })` boot | `go("title")` boot; level via `go("game", { levelId })` | Phase 14 | Title is the new entry; level chosen by select, not hardcoded. |
| Gate clear = terminal "LEVEL CLEAR" + scene stays | Clear = persist + `go("select")`; Escape → select | Phase 14 (NAV-03) | Return-to-select with derived next-level unlock; no auto-advance. |
| Kaplay 4000 `defaultLifetimeScope: "app"` keeps global handlers across scenes | **Not applicable** — vendored 3001.0.19 `go()` clears the app bus on every scene change | (engine pinned at 3001) | The web docs describing handler-survival are 4000-era; in 3001 the teardown is automatic. Pin held — do NOT adopt 4000 mental model. |

**Deprecated/outdated:**
- `loadSpriteSheet` (does NOT exist in Kaplay 3001 — `loadSprite({ sliceX, sliceY, anims })` only; STATE.md locked decision). Not used this phase, but keep it banned.
- The web/4000 `defaultLifetimeScope` setting: absent from the 3001.0.19 bundle (verified by grep). Do not reference it.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tweens/timers (`tween`/`wait`-driven) are torn down by `go()` because they ride `game.events`/the root update loop, which `game.events.clear()` + root-child removal handle. game.js's `_fxScaleTween` cancel is belt-and-braces, not strictly required for scene change. | Summary / Pattern 6 | LOW — if an in-flight tween somehow survived, it'd reference a destroyed object and no-op or warn; the existing `onSceneLeave(destroyAll("fx") + _fxScaleTween.cancel())` already covers the game scene. New scenes should keep tweens scene-local and self-cleaning (fx.js idiom). Confirm in the boot (no lingering animation after navigation). |
| A2 | The `check-import-safety.sh` negative-grep approach (anchored `^(const|let|var)…(add|…)\(` for top-level traps) reliably distinguishes module-scope engine calls from inside-body ones for the typical formatting in this repo (factory bodies are indented). | Pitfall 5 / Code Examples | MEDIUM — an unusually-formatted top-level call (e.g. no leading keyword, or a multiline statement) could slip past. Mitigation: calibrate against a bad fixture AND keep the mandatory browser boot as the real backstop (greps ≠ boots). The planner may prefer a positive-invariant + node --check + boot over a clever negative regex. |

**Note:** The core teardown contract (Summary, Pitfall 2, Pattern 6) is `[VERIFIED]` against the vendored bundle's `ha`/`ga`/`ve` functions — not assumed.

## Open Questions

1. **Beat between clear and return-to-select**
   - What we know: SAFE-01 forbids any timer/scheduler; `go("select")` tears down the gate's clear banner immediately.
   - What's unclear: Whether a momentary "LEVEL CLEAR" beat is wanted before returning, or an immediate jump is fine.
   - Recommendation: Default to immediate `go("select")` in `onClear` (simplest, fully SAFE-01-compliant; `fx.clearBurst()` still fires the current frame). If a beat is desired, gate it on a keypress/click ("press to continue"), NEVER on elapsed time. Defer the exact feel to UI-SPEC / kid-UAT.

2. **`ui/selectTiles.js` helper vs. inline tile drawing**
   - What we know: Either satisfies the locked decisions (Claude's Discretion); `ui/hud.js` is the factory-helper template.
   - What's unclear: Whether the single-row, few-tile layout warrants a separate helper now.
   - Recommendation: Inline in `select.js` for this phase (one row, few tiles); extract to `ui/selectTiles.js` later if Phase 17's growing level list makes the scene body unwieldy. Keep the factory/anti-leak discipline either way.

3. **Title "Continue" semantics**
   - What we know: Locked decision — NO separate Continue; the select screen surfaces progress.
   - What's unclear: Nothing — resolved by CONTEXT. Title has a single "press to start" → select.
   - Recommendation: One entry point. No action needed; flagged only to confirm it's settled.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (`node --check`, smoke scripts) | Static gates (`check-*.sh`, `smoke-progress.mjs`) | ✓ | v22.22.2 | — |
| Bash | `check-import-safety.sh`, existing check scripts | ✓ | system | — |
| git | `git rev-parse --show-toplevel` (ROOT in scripts) | ✓ | repo | — |
| Vendored Kaplay 3001.0.19 | Engine scenes | ✓ | 3001.0.19 (sha256 `fb4a4ef2…`) | — (pin held) |
| A real browser + local HTTP serve | Mandatory enter→leave→re-enter boot | ✓ (project canon: `python3 -m http.server` or the nginx/Dokploy container) | — | None — the boot is non-negotiable (greps ≠ boots) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

> `workflow.nyquist_validation: true` — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | NONE (no-build / no-dep canon). Validation = `node --check` + structural bash greps + headless `.mjs` smokes + a MANDATORY real browser boot. |
| Config file | none — see Wave 0 |
| Quick run command | `bash scripts/check-import-safety.sh` (new) |
| Full suite command | `bash scripts/check-safety.sh && bash scripts/check-progress.sh && bash scripts/check-import-safety.sh` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Title renders on load; Enter/Space/click → select | structural + boot | `grep 'go("title"' src/main.js; node --check src/scenes/title.js` then browser boot | ❌ Wave 0 (title.js, gate update) |
| NAV-02 | Select lists LEVEL_ORDER with 3 distinct states; pick unlocked | structural + boot | `node --check src/scenes/select.js`; grep `isUnlocked`/`LEVEL_ORDER` usage; browser boot shows level-01 unlocked | ❌ Wave 0 (select.js) |
| NAV-03 | Clear → markCleared + writeSave + go("select"); Escape → select; no forced replay/auto-advance | structural + boot | grep `go("select")` + `onKeyPress("escape"` in game.js; boot: clear → back to select | ❌ Wave 0 (game.js edits) |
| NAV-04 | No leaked handlers/colliders/tweens/effects on enter→leave→re-enter×2; no top-level engine globals | structural (a727c13 gate) + boot | `bash scripts/check-import-safety.sh`; browser enter→leave→re-enter-twice each screen | ❌ Wave 0 (check-import-safety.sh) |

### Sampling Rate
- **Per task commit:** `bash scripts/check-import-safety.sh` (+ `node --check` on edited files)
- **Per wave merge:** full suite (`check-safety.sh && check-progress.sh && check-import-safety.sh`)
- **Phase gate:** full suite green AND the mandatory real browser boot (title → select → play → clear → select, then enter→leave→re-enter-twice each screen) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `scripts/check-import-safety.sh` — the a727c13 gate for scene modules (NAV-04 static half). Model on `check-progress.sh` (strip_comments + scoped negative grep + `node --check` loop). Calibrate against a bad fixture (a top-level `add(` must go red) and the shipped good files (must stay green).
- [ ] `src/scenes/title.js`, `src/scenes/select.js` — new factory modules the gate verifies.
- [ ] No new test framework — explicitly NONE (no-build canon). The browser boot is the irreplaceable runtime check.

## Security Domain

> `security_enforcement: true`, ASVS level 1. This phase adds canvas-drawn navigation UI and reads/writes localStorage via the existing guarded seam. No network, no auth, no server.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Offline single-user game; no accounts. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No multi-user/authz. |
| V5 Input Validation | yes (read path) | Save blob is already validated by `progress.js validate()` (named-key, range-checked, no spread/Object.assign — prototype-pollution mitigation T-01-01/T-13-03). The select screen READS the validated `progress` instance, so junk ids in the blob can't unlock a real level (unlock derived from `LEVEL_ORDER`). New scenes add no new untrusted input sink. |
| V6 Cryptography | no | No secrets/crypto. |

### Known Threat Patterns for vanilla-JS canvas game

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Injection via a markup/DOM sink in the new screens | Tampering | NONE introduced — all UI is Kaplay `text()`/`rect()` canvas draws (no `innerHTML`/`document.*`), continuing the gate/HUD no-DOM-sink canon (mathGate.js:18-23, hud.js:14-16). Keep title/select pure canvas. |
| Malicious/corrupt save → privilege (unlock all) or boot brick | Tampering / DoS | Already mitigated upstream: `loadSave()` is forgiving (defaults on any failure, never throws), `validate()` copies only named range-checked keys, `getLevel`/`isUnlocked` are forgiving for junk ids. Select must READ through these, never trust raw localStorage. |
| Prototype pollution via `levels` map keys (`__proto__`) | Tampering | Mitigated in `progress.js validate()`/`createProgress()` (own-key reads, plain own-key writes, strict `=== true`). New scenes inherit this — do not re-parse the raw blob. |

**Net:** No new threat surface from the navigation shell itself, provided the new scenes (a) draw only via canvas (no DOM sink) and (b) read state through the existing validated `progress`/registry seams rather than touching `localStorage` directly. The planner should add a verification note that `title.js`/`select.js` contain no `innerHTML`/`document.` and no direct `localStorage` access.

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (vendored 3001.0.19, sha256 `fb4a4ef2…`) — decompiled `ha` (`go`), `fa` (`scene`), `ga` (`onSceneLeave`), `ve` (`onHide`): the exact teardown order (`onSceneLeave` → `app.events.clear()` → `game.events.clear()` → `objEvents.clear()` → remove non-`stay()` root children → run target scene). The authoritative source for NAV-04. [VERIFIED]
- `src/scenes/game.js`, `src/main.js`, `src/levels/index.js`, `src/progress.js`, `src/ui/mathGate.js`, `src/ui/hud.js`, `src/player.js`, `src/fx.js`, `src/config.js` — the shipped patterns this phase mirrors/extends. [VERIFIED: read]
- `scripts/check-progress.sh`, `scripts/check-safety.sh` — the established structural-gate idiom (`strip_comments`, scoped negative grep, `node --check` loop, headless smoke). [VERIFIED: read]
- `.planning/phases/14-multi-scene-shell/14-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` — locked decisions, requirement IDs, cross-cutting mitigations. [VERIFIED: read]

### Secondary (MEDIUM confidence)
- [KAPLAY Guides — Scenes](https://kaplayjs.com/docs/guides/scenes/) — `go()` destroys all non-`stay()` objects; `stay()` preserves. [CITED]
- [KAPLAY Docs — onSceneLeave](https://kaplayjs.com/docs/api/ctx/onSceneLeave/) — signature `(newScene?: string) => void`, fires on scene transition. [CITED]
- [KAPLAY Guides — Events](https://kaplayjs.com/docs/guides/events/) — App events (`onKeyPress` et al.) vs object events; obj-scoped variants die with the object. [CITED]

### Tertiary (LOW confidence)
- General web/search results describing `defaultLifetimeScope: "app"` handler-survival — this is **4000-era** behavior and does NOT apply to the pinned 3001.0.19 bundle (confirmed absent by grep). Recorded only to mark it as not-applicable. [ASSUMED — and explicitly overridden by the bundle decompile]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; all modules read directly; engine version + sha verified in-file.
- Architecture / scene-factory pattern: HIGH — mirrors the shipped `game.js`; `levelId` read already exists (line 65).
- NAV-04 teardown contract: HIGH — verified against the vendored bundle's `go` implementation, not just docs.
- `check-import-safety.sh` design: MEDIUM — pattern is sound (models existing gates) but the negative-grep calibration needs a bad-fixture test (Assumption A2); the mandatory browser boot is the backstop.
- Pitfalls: HIGH — grounded in shipped code comments (game.js `onHide`-stacking, fx.js a727c13 note) + STATE.md's enumerated v4.0 pitfalls.

**Research date:** 2026-06-29
**Valid until:** 2026-07-29 (stable — engine pinned, patterns shipped; re-check only if the Kaplay pin or the save shape changes)
