# Phase 37: Mobile — Responsive Canvas & Touch Controls - Research

**Researched:** 2026-07-19
**Domain:** Kaplay 3001 responsive canvas (letterbox), browser touch input, pointer/gesture handling, iOS Web Audio activation
**Confidence:** HIGH (the load-bearing coordinate-mapping question is answered by reading the vendored engine source directly, not from docs)

## Summary

The load-bearing question for this phase — *does `letterbox: true` cleanly unify mouse + touch coordinate mapping, or do we need a DOM-overlay fallback?* — is answered **YES, letterbox unifies both**, and it is proven by reading the vendored `lib/kaplay.mjs` directly. The engine routes **every** pointer position (mouse AND touch) through one function `Qe(...)` (the letterbox-aware window→content transform). The ONLY reason mouse and touch diverge today is the project's `transform: scale(1.5)` CSS hack: mouse reads `event.offsetX` (measured in the element's *untransformed* local box, so it is transform-immune and correct), while touch reads `clientX − getBoundingClientRect().x` (the rect reflects the *scaled* 960×540 visual box, so touch overshoots by exactly the 1.5× scale factor). Remove the CSS transform, switch to `letterbox: true`, and both inputs feed the same `Qe` in the same coordinate space. `box.onClick()` continues to work on both because `touchToMouse` (default on) also synthesizes a left-mouse press on tap.

The recommended migration keeps the desktop look by wrapping the canvas in a **fixed 960×540 container on desktop** (letterbox scales the internal 640×360 → 960×540 = exactly 1.5×, with zero bars because both are 16:9) and a **full-viewport container on touch/mobile** (letterbox adds pillar/letterbox bars for non-16:9 screens). One rendering path, transform-free coordinate math everywhere.

Touch controls are hand-rolled (Kaplay 3001 has **no** built-in virtual-button API). Use the engine's public `onTouchStart / onTouchMove / onTouchEnd` globals — each fires `(gamePos, rawTouch)`, and `rawTouch.identifier` gives per-finger tracking for true multi-touch (left + jump simultaneously). Feed both keyboard and virtual buttons through **one new `src/input.js` seam** so `player.js`'s existing coyote/buffer/variable-height jump is reused verbatim — never a parallel jump implementation. Variable-height needs **no timer** (it is pure press/release edges + `vel.y` sign already), so `check-safety.sh`'s no-timer mandate is satisfied for free.

**Primary recommendation:** Migrate to `letterbox: true` behind a RED-first Playwright touch-coordinate probe; add a single `src/input.js` OR-seam that both the keyboard path and new CONFIG-driven virtual buttons feed; make tappable UI fall out of `touchToMouse` + the unified mapping; gate visibility on `matchMedia('(pointer: coarse)')`; wire audio unlock to `pointerup`/`click` (never `touchstart`); keep the entire desktop `browser-boot.mjs` battery green as the hard parity gate. The DOM-overlay fallback is **not** needed — but the probe is what formally decides that.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Responsive canvas sizing | Browser / DOM (index.html container + Kaplay letterbox) | Engine (viewport math) | The container defines display size per device class; the engine letterboxes 640×360 into it |
| Coordinate mapping (mouse+touch) | Engine (`Qe` window→content) | — | Single transform in `lib/kaplay.mjs`; app code never computes coordinates |
| Virtual button input | App (`src/input.js` seam + game scene UI) | Engine (`onTouchStart/Move/End`) | Engine delivers raw touches; app tracks identifiers and ORs into the input seam |
| Jump physics (coyote/buffer/variable-height) | App (`src/player.js`, unchanged) | — | LOCKED game-feel; touch must reuse, never re-implement |
| Tappable answers/mute/reset | Engine (`box.onClick` via `touchToMouse`) | App (existing click seams) | Falls out of the unified mapping — no per-widget code |
| Orientation overlay + gesture suppression | Browser / DOM (CSS `touch-action`, viewport meta, overlay div/canvas) | App (media query) | Browser-level concerns; JS only toggles the overlay |
| Audio unlock | Browser (activation-triggering gesture) | App (`src/audio.js`) | iOS gates `AudioContext.resume()` on a real user-activation event |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Canvas migration = LETTERBOX (probe-decided, primary).** Replace CSS `transform: scale(1.5)` with Kaplay `letterbox: true` + a responsive canvas so internal 640×360 maps to the viewport with transform-free coordinate math. Rationale is source-verified: mouse reads `offsetX` (transform-immune), touch reads `clientX − rect()` (transform-affected) — mutually exclusive under the CSS-scale trick. The RED-first probe proves the desync, then proves letterbox fixes it. If the probe shows letterbox does NOT cleanly fix mapping, the **DOM-overlay fallback** is the alternative — the probe decides, not assumption.
- **Desktop look + ALL mouse behavior preserved** (`box.onClick` etc. must stay working — the documented `offsetX/offsetY` trap). Stale pitfall comments in `main.js`/`index.html` get rewritten to match reality.
- **Touch controls = thumb-zone virtual buttons.** Discrete left/right bottom-LEFT + jump bottom-RIGHT; ≥64px effective hit zones (oversized for a 12-year-old's thumbs); dark-grunge, semi-transparent, unobtrusive. **Hold semantics** for variable-height jump (press-hold = higher). Multi-touch per `Touch.identifier` (left+jump simultaneously). Visible ONLY on touch-capable devices (feature-detect, NOT UA-sniff); hidden on desktop. Challenge-pause-aware (movement inert while a math panel is open, like the keyboard). All sizing/placement/opacity tunables in CONFIG.
- **Tappable UI (MOB-03):** math answer boxes, mute toggle, reset become tappable via the SAME unified coordinate mapping (one seam, not per-widget hacks).
- **Orientation + gestures (MOB-04):** portrait → a "rotate your device" overlay. `touch-action: none` on the canvas + proper viewport meta. NO `screen.orientation.lock()` reliance.
- **Audio gesture gate (MOB-05 — code now, device-proof deferred):** wire audio unlock to the first real gesture using an activation-triggering event (pointerup/click/touchend — NOT touchstart).

### Claude's Discretion
- Exact button glyphs/art, overlay copy, probe assertions, and the feature-detect predicate — Claude's discretion within the above; confirmed at the on-device MOB-06 tuning (Phase 38).

### Deferred Ideas (OUT OF SCOPE)
- **MOB-05 real-device audio-activation PROOF** (touchstart is not activation-triggering — must be VERIFIED on device).
- **MOB-06 kid touch-layout tuning** (button size/placement adjusted from watching her hands) → Phase 38.
- **iOS ITP 7-day storage eviction** — DOCUMENTED as expectation only; no backend fix — the laptop stays the progress home.
- Any change to game logic, math brain, motion, or the kid-validated desktop feel — desktop must stay byte-identical.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOB-01 | Responsive canvas — letterbox migration replacing CSS `transform: scale(1.5)`, opened by a RED-first Playwright touch-coordinate probe; desktop look + all mouse behavior preserved; stale comments rewritten | §1 letterbox source-verified; §2 RED-first probe design; §Code Examples migration; §Pitfalls offsetX trap |
| MOB-02 | Touch controls — discrete left/right + jump virtual buttons, hold semantics (variable-height), multi-touch per-identifier, ≥64px hit zones, touch-only, challenge-pause-aware, CONFIG tunables | §3 touch API + `src/input.js` seam; §Don't Hand-Roll; §Pitfalls per-identifier + no-timer |
| MOB-03 | Math answers, mute, reset tappable on touch (unified mapping) | §4 — falls out of `touchToMouse` + unified `Qe`; existing `box.onClick` seams |
| MOB-04 | Portrait overlay + gesture suppression (`touch-action: none`, viewport meta); no `screen.orientation.lock()` | §5 orientation + gestures |
| MOB-05 | Audio gesture gate proven on real touch; iOS ITP 7-day eviction documented | §6 — code wiring now; device proof + ITP DEFERRED |

## Standard Stack

This is a **zero-dependency, no-build, single-vendored-library** project. No new packages are installed for this phase. All capability comes from the already-vendored engine plus browser platform APIs.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Kaplay (vendored) | 3001.0.19 @ `lib/kaplay.mjs` | Letterbox canvas, `onTouchStart/Move/End`, `isTouchscreen()`, `touchToMouse`, `Qe` mapping | Already the ONE engine; all needed primitives verified present in source |
| Browser platform APIs | — | `matchMedia`, `getBoundingClientRect`, `Touch.identifier`, `AudioContext`, `touch-action` CSS, viewport meta | Native, no dependency; the correct home for feature-detect + gesture suppression |
| Playwright (dynamically resolved) | as resolved by `scripts/browser-boot.mjs` pattern | RED-first touch-coordinate probe + desktop parity gate | Already the project's test harness; supports `hasTouch`/`isMobile` contexts + `touchscreen.tap` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | Do not add packages; CLAUDE.md forbids npm install to run |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `letterbox: true` (single unified path) | Keep CSS transform on desktop + DOM-overlay for touch input | Two coordinate systems, two code paths, more surface for the offsetX trap to regress. Only take this if the probe shows letterbox breaks desktop mouse — source analysis says it will not |
| Engine `onTouchStart/Move/End` | Raw `canvas.addEventListener('touchstart', …)` | Raw listeners survive `go()` and must be manually removed on `onSceneLeave` (leak risk); the engine's app-bus controllers are auto-cancelled. Prefer the engine API |
| `matchMedia('(pointer: coarse)')` for button visibility | `isTouchscreen()` (`ontouchstart`/`maxTouchPoints`) | `isTouchscreen()` returns true on touch-capable *laptops* (hybrid false-positive) — would show thumb buttons on desktop. `pointer: coarse` matches the *primary* input being coarse. Use `pointer: coarse` primary, `isTouchscreen()` as a documented fallback |

**Installation:** None. `git`-tracked vendored engine only.

**Version verification:** Engine is pinned at `lib/kaplay.mjs` (Kaplay 3001.0.19, sha256 in header per CLAUDE.md). No registry lookup applies — the library is vendored and MUST NOT be upgraded without re-testing (CLAUDE.md binding rule).

## Package Legitimacy Audit

Not applicable — this phase installs **no external packages**. The one library (Kaplay) is already vendored and pinned; Playwright is resolved from the existing machine/CI install by `browser-boot.mjs`'s established resolver. No registry surface, no slopsquat risk introduced.

## Source-Verified Engine Findings (the load-bearing section)

> All offsets below are character offsets into the minified single-line `lib/kaplay.mjs`. Quotes are the real engine source. This is the verification the whole phase rests on.

### 1. `letterbox: true` EXISTS and is the documented responsive path — `[VERIFIED: lib/kaplay.mjs]`

**Viewport computation (offset ~42142):**
```js
// s = drawingBufferWidth/t, i = drawingBufferHeight/t  (t = pixelDensity)
if (a.globalOpt.letterbox) {
  if (!e || !n) throw new Error("Letterboxing requires width and height defined.");
  let b = s/i, l = e/n;              // b = display aspect, l = 640/360 game aspect
  if (b > l) { let h = i*l; m = (s-h)/2, c = h }   // pillarbox (bars left/right)
  else       { let h = s/l; p = h,     u = (i-h)/2 } // letterbox (bars top/bottom)
}
// a.gfx.viewport = { x:m, y:u, width:c, height:p, scale:… }
```
So letterbox **requires** `width` and `height` (we have 640/360), preserves the 16:9 aspect, and produces a `viewport` with an offset (`x,y`) and size (`width,height`) that the coordinate transform below consumes.

### 2. ONE window→content transform serves BOTH mouse and touch — `[VERIFIED: lib/kaplay.mjs]`

**`Qe` (window→content), offset ~42540:**
```js
function Qe(t){
  return new E(
    (t.x - a.gfx.viewport.x) * a.gfx.width  / a.gfx.viewport.width,
    (t.y - a.gfx.viewport.y) * a.gfx.height / a.gfx.viewport.height
  );
}
```
`a.gfx.width` is the internal game width (640). `Qe` maps a canvas-space pixel into 640×360 game space, subtracting the letterbox bar offset and dividing by the viewport size. **This is the single mapping.**

**Mouse handler (`Me.mousemove`, offset ~52314):**
```js
Me.mousemove = f => {
  let T = Qe(new E(f.offsetX, f.offsetY)), P = new E(f.movementX, f.movementY);
  if (y()) { /* isFullscreen()-only extra correction, not used by this game */ }
  e.events.onOnce("input", () => { e.isMouseMoved = !0; e.mousePos = T; … });
};
```
Mouse position = `Qe(offsetX, offsetY)`. `offsetX/offsetY` are measured in the canvas element's **untransformed** local box → transform-immune (this is exactly why the current CSS-scale hack keeps mouse working, per `main.js`'s comment).

**Touch handlers (`Me.touchstart` ~54790, `touchmove` ~55310, `touchend` ~55669, `touchcancel` ~56179):**
```js
Me.touchstart = f => {
  f.preventDefault();
  e.events.onOnce("input", () => {
    let T = [...f.changedTouches], P = e.canvas.getBoundingClientRect();
    t.touchToMouse !== !1 && (
      e.mousePos = Qe(new E(T[0].clientX - P.x, T[0].clientY - P.y)),
      e.lastInputDevice = "mouse",
      e.buttonsByMouse.has("left") && … ,
      e.mouseState.press("left"),               // ← synthesizes a LEFT-MOUSE PRESS
      e.events.trigger("mousePress", "left")
    );
    T.forEach(B => {                              // ← per-Touch iteration
      e.events.trigger("touchStart", Qe(new E(B.clientX - P.x, B.clientY - P.y)), B)
      //                                                                          ^ raw Touch (has .identifier)
    });
  });
};
```
Touch position = `Qe(clientX − rect.x, clientY − rect.y)`. `getBoundingClientRect()` reflects the **actual on-screen (post-CSS-transform) box** → transform-affected.

**The desync, exactly (source-derived):** Under today's `transform: scale(1.5)`, the rect is 960×540 while the backing store / viewport is 640×360. A tap at the visual center gives `clientX − rect.x = 480`, and `Qe` (non-letterbox: `viewport.width = 640`) maps it `480 * 640/640 = 480`. But the true center is game-x **320**. A mouse click at the same visual center gives `offsetX = 320` (untransformed box) → `Qe → 320` (correct). **Mouse = 320, touch = 480 — off by the 1.5× scale factor. Mutually exclusive.**

**Why letterbox fixes it:** Under `letterbox: true` with NO CSS transform, the canvas CSS display size **equals** its layout box (canvas init sets `width:100%;height:100%`, backing store = parent size — see finding 4). Now `offsetX` and `clientX − rect.x` are in the **same** CSS-pixel space, both fed through the **same** `Qe`, which subtracts the letterbox offset and scales to 640×360. **Unified. One mapping serves mouse and touch.** `[VERIFIED: lib/kaplay.mjs]`

**Conclusion: the DOM-overlay fallback is NOT needed.** The probe (§2 below) formally confirms this before the migration is accepted.

### 3. Public touch API + feature-detect — `[VERIFIED: lib/kaplay.mjs]`

- **Exported globals** (offset ~58287, and re-exported ~185730): `onTouchStart`, `onTouchMove`, `onTouchEnd`. Each callback receives `(gamePos, rawTouch)` — `gamePos` already through `Qe`, `rawTouch` is the DOM `Touch` (carries `.identifier`, `.clientX`, `.clientY`).
- **`isTouchscreen()`** (offset ~46255): `function R(){ return "ontouchstart" in window || navigator.maxTouchPoints > 0 }`. Exposed as the `isTouchscreen` global.
- **`mousePos()`** (offset ~46289): `function V(){ return e.mousePos.clone() }` — returns game/content space, written by both mouse and touch via `Qe`.
- **`touchToMouse`** is a `kaplay()` option (offset ~177165: `touchToMouse: t.touchToMouse`), **default ON** (guards read `t.touchToMouse !== false`). It is what makes taps fire `box.onClick`.
- **No built-in virtual-button API** — `grep` for `addButton|VirtualButton|virtualButton|drawButton` returns nothing. Virtual buttons must be hand-rolled.

### 4. Canvas init + resize behavior — `[VERIFIED: lib/kaplay.mjs]`

**Init (offset ~176504):**
```js
let r = t.scale ?? 1; a.gscale = r;
let o = t.width && t.height && !t.stretch && !t.letterbox;   // "fixed-size" mode
o ? (n.width = t.width*r, n.height = t.height*r)
  : (n.width = n.parentElement.offsetWidth, n.height = n.parentElement.offsetHeight);
let s = ["outline: none","cursor: default"];
if (o) { s.push(`width: ${…}px`); s.push(`height: ${…}px`); }   // fixed CSS px
else   { s.push("width: 100%");   s.push("height: 100%"); }      // ← letterbox: fill parent
t.crisp && (s.push("image-rendering: pixelated"), s.push("image-rendering: crisp-edges"));
```
With `letterbox: true`, `o` is false → **canvas fills its parent (`width:100%;height:100%`), backing store = parent's offset size**. So the parent container's dimensions define the display; the engine letterboxes 640×360 into it. `crisp` still emits `image-rendering: pixelated` (sharp upscale preserved).

**Resize (offset ~138531):** `onResize` recomputes `canvas.width/height = offsetWidth/Height * pixelDensity` when `stretch`/`letterbox` is set (skips only for fixed-size non-letterbox). So the canvas is **genuinely responsive** — rotate/resize re-fits automatically. No app code needed for resize.

## Architecture Patterns

### System Architecture Diagram

```
                        ┌─────────────────────────────────────────┐
   Device class ───────▶│  index.html container sizing            │
   (pointer:coarse?)    │  desktop → fixed 960×540 wrapper         │
                        │  touch   → full-viewport wrapper         │
                        └───────────────┬─────────────────────────┘
                                        │ parent offset size
                                        ▼
   DOM input events                ┌──────────────────────────┐
   mouse: offsetX/Y ──────────────▶│  Kaplay engine            │
   touch: clientX−rect ───────────▶│  letterbox viewport       │
                                   │  Qe(win→content) ── ONE map│───▶ mousePos() (640×360 game space)
                                   │  touchToMouse: press "left"│───▶ box.onClick fires on tap
                                   │  onTouchStart/Move/End     │───▶ (gamePos, rawTouch.identifier)
                                   └───────┬──────────┬─────────┘
                                           │          │
                          tappable UI ◀────┘          ▼
                    (answers/mute/reset,        ┌──────────────────────┐
                     via box.onClick)           │ src/input.js SEAM     │
                                                │ OR(keyboard, virtual) │
                                                │ isLeftHeld/isRightHeld│
                                                │ onJumpPress/Release   │
                                                └──────────┬───────────┘
                                                           ▼
                                                ┌──────────────────────┐
                                                │ src/player.js (UNCHANGED│
                                                │ physics): coyote,      │
                                                │ buffer, variable-height│
                                                └──────────────────────┘
   Orientation ─── portrait ──▶ "rotate device" overlay (CSS/canvas) ; touch-action:none suppresses pinch/scroll
   First real gesture (pointerup/click) ──▶ src/audio.js unlock (AudioContext.resume via ensureMusicPlaying)
```

Trace the primary use case: a finger touch enters as a DOM `touchstart`; the engine maps it through the single `Qe`; if it lands on an answer box, `touchToMouse` fires `box.onClick`; if it lands on a virtual movement/jump button, the game scene's `onTouchStart` handler (tracking `identifier`) sets state on `src/input.js`, which `player.js` reads through the same seam the keyboard uses — so the LOCKED jump physics run unchanged.

### Recommended Project Structure
```
src/
├── input.js          # NEW — the ONE input seam: OR(keyboard, virtual buttons).
│                     #   exposes isLeftHeld()/isRightHeld() + onJumpPress()/onJumpRelease()
├── ui/
│   └── touchControls.js  # NEW — game-scene virtual button UI (draw + onTouchStart/Move/End,
│                         #   per-identifier tracking) that drives src/input.js. touch-only.
├── main.js           # EDIT — kaplay({ letterbox:true, … }); DELETE the transform:scale(1.5) block;
│                     #   rewrite the stale offsetX comment to describe letterbox reality
├── player.js         # EDIT (minimal) — read src/input.js instead of raw isKeyDown/onKeyPress/onKeyRelease
├── audio.js          # EDIT — add unlock-on-first-gesture wiring (pointerup/click)
├── config.js         # EDIT — new CONFIG.TOUCH { button sizes/positions/opacity, hit zones }
│                     #        + CONFIG.CANVAS { desktop wrapper W/H } if lifted from index.html
└── index.html        # EDIT — viewport meta (add), touch-action:none, device-class container,
                      #        portrait overlay markup; rewrite the transform-centering comment
scripts/
└── touch-coordinate-probe.mjs  # NEW — RED-first permanent gate (dup the browser-boot server/resolver)
```

### Pattern 1: The unified input seam (`src/input.js`)
**What:** A tiny module both the keyboard and the virtual buttons feed; `player.js` reads only from it, so jump physics are reused, never re-implemented.
**When to use:** All player-facing directional + jump input.
**Example (design sketch — a727c13-safe: engine globals only inside functions):**
```js
// src/input.js — the ONE input seam. No engine globals at module top level (a727c13).
let leftBtn = false, rightBtn = false;             // virtual-button held state (closure-ish module data, not engine refs)
const jumpPressCbs = [], jumpReleaseCbs = [];

export function setLeftHeld(v)  { leftBtn = v; }   // called by touchControls.js per identifier
export function setRightHeld(v) { rightBtn = v; }
export function onJumpPress(cb)   { jumpPressCbs.push(cb); }
export function onJumpRelease(cb) { jumpReleaseCbs.push(cb); }
export function fireJumpPress()   { jumpPressCbs.forEach(cb => cb()); }
export function fireJumpRelease() { jumpReleaseCbs.forEach(cb => cb()); }

// isKeyDown is an engine global — referenced INSIDE the function only.
export function isLeftHeld()  { return isKeyDown("left")  || isKeyDown("a") || leftBtn; }
export function isRightHeld() { return isKeyDown("right") || isKeyDown("d") || rightBtn; }
```
`player.js` change is minimal: `if (input.isLeftHeld()) dir -= 1;` etc., and register its existing buffer-set / variable-height-cut on `input.onJumpPress/onJumpRelease` instead of directly on `onKeyPress/onKeyRelease` — then keyboard AND touch drive the *same* buffer/coyote/cut code. The keyboard's own `onKeyPress(JUMP_KEYS)` becomes a call to `input.fireJumpPress()`.

> **Anti-leak nuance:** callback arrays on a module-scope singleton must not accumulate across scene re-entries. Register player jump callbacks once per `makePlayer()` and clear/replace them on `onSceneLeave`, mirroring the challenge.js controller-cancel discipline. (Simplest: `input.reset()` on scene leave.)

### Pattern 2: Multi-touch virtual buttons via `identifier`
**What:** Track which `Touch.identifier` is inside which button; left + jump held simultaneously works.
**Example (design sketch):**
```js
// src/ui/touchControls.js — mounted in game scene, torn down on onSceneLeave.
// onTouchStart/Move/End are engine globals (app-bus controllers auto-cancelled by go()).
const active = new Map();   // identifier -> "left" | "right" | "jump"

function hit(pos, btn) { /* AABB test pos against btn's ≥64px zone (game space) */ }

onTouchStart((pos, touch) => {
  for (const b of buttons) if (hit(pos, b)) {
    active.set(touch.identifier, b.name);
    if (b.name === "left")  input.setLeftHeld(true);
    if (b.name === "right") input.setRightHeld(true);
    if (b.name === "jump")  input.fireJumpPress();   // reuses keyboard buffer path
  }
});
onTouchEnd((pos, touch) => {
  const name = active.get(touch.identifier);
  active.delete(touch.identifier);
  if (name === "left")  input.setLeftHeld(false);
  if (name === "right") input.setRightHeld(false);
  if (name === "jump")  input.fireJumpRelease();     // reuses variable-height cut
});
```
No timer measures hold duration — variable-height is already `vel.y`-sign + release-edge in `player.js` (§Pitfalls, no-timer).

### Anti-Patterns to Avoid
- **Setting `canvas.width/height` to scale (instead of letterbox/transform):** desyncs `offsetX/offsetY` and silently breaks every `box.onClick` — the exact Phase-14 regression documented in `main.js`. Letterbox is the sanctioned replacement.
- **A parallel touch jump implementation:** re-deriving buffer/coyote/variable-height in the touch layer. Forbidden by CONTEXT and by common sense — feed the ONE seam.
- **`setTimeout` to measure hold-to-jump:** violates `check-safety.sh`. Not needed anyway.
- **UA-sniffing for touch:** brittle; use `matchMedia('(pointer: coarse)')`.
- **Relying on `screen.orientation.lock()`:** unsupported/permission-gated on iOS Safari — CSS/overlay only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mapping touch/mouse pixels → game coords | A custom `clientX − rect × scale` calc | Engine `Qe` via `letterbox:true` + read `mousePos()` / `onTouchStart` pos | The engine already does it correctly for both inputs; hand-rolling re-introduces the desync |
| Making answer boxes/mute/reset tappable | Per-widget touch listeners | Existing `box.onClick()` + `touchToMouse` (default on) | Taps synthesize a left-mouse press; every existing `onClick` seam works unchanged |
| Responsive resize on rotate | A `resize` listener resizing the canvas | `letterbox:true` (engine `onResize` refits automatically) | Verified in source — engine handles it |
| Touch-capability detection | UA string parsing | `matchMedia('(pointer: coarse)')` (+ `isTouchscreen()` fallback) | Robust, spec-based, avoids hybrid-laptop false-positives |
| Variable-height jump from touch | Timer measuring press duration | Reuse `player.js`'s existing `vel.y`-sign + release-edge cut via `src/input.js` | No timer (safety gate), and it's the LOCKED game-feel |

**Key insight:** Almost every "mobile" capability this phase needs already exists in the vendored engine — the phase is mostly *removing* the CSS-transform hack and *wiring* existing engine features through one seam, not building new machinery.

## Runtime State Inventory

> This is not a rename/migration phase, but the migration touches persisted display assumptions. Explicit audit:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no persisted value encodes canvas scale/coordinates. `localStorage` holds only save blob (`noxrun_platformer_v1`) + mute flag (`noxrun_mute_v1`); neither references display geometry. | None |
| Live service config | None — static hosting only (nginx/Dokploy); no service stores canvas config. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None. | None |
| Build artifacts | Docker/nginx serve `src/` + `lib/` flattened; the container serves `index.html` as-is. Changing the viewport meta / container CSS ships as static file edits — no rebuild of assets. `scripts/browser-boot.mjs` uses `viewport: { width: 960, height: 540 }` — the desktop parity context; keep it 960×540 so the fixed-wrapper desktop path is what the gate exercises. | Verify Docker layout still serves the edited `index.html`; add a touch-context probe (new script) |

**Nothing found requiring data migration** — the save-key rename already happened in Phase 26; this phase changes no stored values.

## Common Pitfalls

### Pitfall 1: The `offsetX`/`onClick` trap resurfacing
**What goes wrong:** Any accidental reintroduction of `canvas.width/height` scaling, or a leftover CSS transform, desyncs the coordinate spaces and silently breaks position-scoped `box.onClick`.
**Why it happens:** `offsetX` (mouse) and `clientX − rect()` (touch) respond differently to layout-box vs. transform changes.
**How to avoid:** Single letterbox path, no CSS transform, no width/height scaling. The desktop parity gate (`browser-boot.mjs` — level-select tile clicks, mute-icon click) catches a regression.
**Warning signs:** Clicks/taps "miss" targets; the RED-first probe or a `browser-boot` mouse audit goes red.

### Pitfall 2: Per-identifier multi-touch not tracked
**What goes wrong:** Using only `touches[0]` (like `touchToMouse` does for mouse-sim) means left+jump can't be held together; releasing one finger clears the other.
**Why it happens:** `changedTouches[0]` is a convenient shortcut.
**How to avoid:** Track a `Map<identifier, buttonName>`; add on `onTouchStart`, remove on `onTouchEnd`. Cancelled touches need NO extra handler: **there is NO `onTouchCancel` public global in Kaplay 3001** (only `onTouchStart`/`onTouchMove`/`onTouchEnd` are exported — verified against `lib/kaplay.mjs`). The engine's internal DOM `touchcancel` handler (offset ~56179) fires the same **`touchEnd`** KEvent, so `onTouchEnd` already receives cancelled touches and per-identifier cleanup is fully covered. Do NOT call `onTouchCancel(...)` — it is `undefined` and throws `ReferenceError` at mount, breaking ALL touch input.
**Warning signs:** Jump cancels movement; a "stuck" direction after lifting a finger.

### Pitfall 3: A timer sneaks into hold-to-jump
**What goes wrong:** `setTimeout`/`setInterval`/`wait()`/`loop()`/`lifespan(` anywhere in `src/` hard-fails `check-safety.sh`.
**Why it happens:** Instinct to "measure how long the button is held."
**How to avoid:** Do NOT measure duration. Emit press/release edges into `src/input.js`; `player.js`'s existing release-edge `vel.y *= JUMP_CUT` already gives variable height. Zero timers.
**Warning signs:** `bash scripts/check-safety.sh` fails on the new `input.js`/`touchControls.js`.

### Pitfall 4: a727c13 — engine globals at module top level
**What goes wrong:** Referencing `onTouchStart`, `isKeyDown`, `add`, etc. at module scope throws at import and blanks the game.
**Why it happens:** New modules (`input.js`, `touchControls.js`) are tempting to wire at top level.
**How to avoid:** Every engine-global reference lives INSIDE a function body called after `kaplay()` runs. `check-import-safety.sh` enforces it. Module scope may hold only plain data (`leftBtn = false`, callback arrays) — same as `audio.js`'s `musicHandle`.
**Warning signs:** `bash scripts/check-import-safety.sh` fails; blank canvas.

### Pitfall 5: Feature-detect false-positives on hybrid laptops
**What goes wrong:** `isTouchscreen()` (`ontouchstart`/`maxTouchPoints>0`) is true on touch-capable laptops → thumb buttons appear on desktop, violating "desktop byte-identical."
**Why it happens:** Touch *capability* ≠ touch being the *primary* input.
**How to avoid:** Gate button visibility on `matchMedia('(pointer: coarse)')` (primary pointer is coarse). Keep `isTouchscreen()` only as a documented fallback. Note: this cannot be perfectly resolved headless — the on-device MOB-06 pass confirms.
**Warning signs:** Desktop parity playtest shows on-screen buttons.

### Pitfall 6: `touchstart` is not an activation-triggering event (iOS)
**What goes wrong:** Wiring `AudioContext.resume()` to `touchstart` fails to unlock audio on iOS Safari; music stays silent.
**Why it happens:** iOS treats only certain events (`pointerup`, `click`, `touchend`, `keydown`) as user activation for audio.
**How to avoid:** Unlock on `pointerup`/`click` (the title's existing start handler already runs `ensureMusicPlaying()` synchronously in a gesture — reuse that discipline). The real proof is DEFERRED to a device (MOB-05 device gate).
**Warning signs:** Cannot be caught headless — Playwright's synthetic taps DO grant activation, so the headless gate passes even where a real iPhone would fail. This is exactly why the device proof is deferred.

### Pitfall 7: Desktop "byte-identical" vs. rendering-path change
**What goes wrong:** Letterbox renders via the engine's internal scale, not CSS transform — pixel output may not be literally byte-for-byte identical to today's transform-scaled frame, even at 960×540.
**Why it happens:** Different upscale path (GL viewport vs. CSS `transform`), though both use `image-rendering: pixelated`.
**How to avoid:** Interpret "byte-identical" as **behavioral + display-geometry parity** (960×540, 16:9, crisp, all clicks land, all audits green) — which is what the hard gate (`browser-boot.mjs`) actually proves. Fix the desktop wrapper at 960×540 so letterbox scales 640→960 with **zero bars**. Flag any visible pixel difference at UAT; if unacceptable, the device-branch fallback (letterbox only on touch) is available. See Open Questions.
**Warning signs:** UAT notices softened/shifted pixels vs. the current build.

## Code Examples

### The `main.js` migration (letterbox in, transform out)
```js
// Source: lib/kaplay.mjs canvas-init + letterbox source (offsets 176504, 42142) — VERIFIED
const k = kaplay({
  width: 640,
  height: 360,
  letterbox: true,        // ← unifies mouse+touch through Qe; requires width+height (verified)
  background: CONFIG.PALETTE.BG,
  crisp: true,            // still emits image-rendering: pixelated under letterbox (verified)
  canvas: document.querySelector("#game"),
  // touchToMouse defaults ON — taps fire box.onClick (verified); leave it unset.
});

// DELETE the entire `canvas.style.transform = "scale(1.5)"` block (main.js:48-51).
// The parent container in index.html now defines display size:
//   desktop  → fixed 960×540 wrapper (letterbox scales 640→960 = 1.5×, no bars)
//   touch    → full-viewport wrapper (letterbox adds bars for non-16:9)
// Rewrite the stale offsetX/offsetY comment (main.js:28-47) to describe letterbox reality.
```

### `index.html` viewport meta + gesture suppression (MOB-04)
```html
<!-- Source: MDN viewport + touch-action; iOS guidance -->
<meta name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<style>
  #game { touch-action: none; }   /* suppress pinch-zoom/scroll/double-tap-zoom over the canvas */
  /* device-class container: desktop fixed 960×540, touch full-viewport */
  @media (pointer: coarse) { #stage { width: 100vw; height: 100vh; } }
  @media (pointer: fine)   { #stage { width: 960px; height: 540px; } }
  /* portrait overlay (MOB-04): shown only on coarse-pointer + portrait */
  #rotate { display: none; }
  @media (pointer: coarse) and (orientation: portrait) {
    #rotate { display: flex; /* dark-grunge "rotate your device" overlay */ }
    #stage  { display: none; }
  }
</style>
```
> Note: `user-scalable=no`/`maximum-scale=1` is honored inconsistently on iOS; `touch-action: none` on the canvas is the reliable suppressor. Do not rely on `screen.orientation.lock()`.

### Audio unlock on first real gesture (MOB-05 code — device proof deferred)
```js
// Source: src/audio.js existing ensureMusicPlaying() (must run synchronously in a gesture) — VERIFIED
// Wire on pointerup/click, NEVER touchstart (iOS activation rule). The title's start handler
// already calls ensureMusicPlaying() synchronously inside a gesture — extend the same pattern
// so a first tap anywhere unlocks. AudioContext.resume() is what browser-boot asserts via
// audioCtx.state "suspended"→"running".
```

### RED-first Playwright touch-coordinate probe (MOB-01, permanent gate)
```js
// Source: scripts/browser-boot.mjs server + resolvePlaywright() pattern (dup deliberately) — VERIFIED
// Context MUST be touch-enabled:
const context = await browser.newContext({
  viewport: { width: 960, height: 540 },
  hasTouch: true,          // enables page.touchscreen.tap + touch events
  isMobile: true,          // stricter emulation (viewport meta honored)
});
// After the game boots, tap the canvas visual-center and read game-space back.
// Inject a probe listener via the engine global (global:true exposes onTouchStart on window):
await page.evaluate(() => { window.__lastTouch = null;
  onTouchStart((pos) => { window.__lastTouch = { x: pos.x, y: pos.y }; }); });
const box = await page.locator("#game").boundingBox();
await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
await page.evaluate(() => new Promise(r => requestAnimationFrame(() => r())));
const p = await page.evaluate(() => window.__lastTouch);
// EXACT assertion that demonstrates the desync:
//   RED (current CSS-transform build): p.x ≈ 480  (overshoots by 1.5×)
//   GREEN (after letterbox migration):  p.x ≈ 320  (canvas center in 640-space)
assert(Math.abs(p.x - 320) <= 2, `touch desync: expected game-x≈320, got ${p.x}`);
```
> The probe is written and committed **first**, run against the pre-migration build to prove it goes RED (asserting ≈320 while the build yields ≈480), then the migration turns it GREEN, and it stays as a permanent gate. This mirrors the project's Phase-30 RED-first mover harness.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `transform: scale(1.5)` display hack | Kaplay `letterbox: true` responsive canvas | This phase (37) | Unifies mouse+touch coordinate mapping; enables mobile |
| Mouse-only `onClick`, keyboard-only input | Unified `Qe` mapping + `touchToMouse` + `src/input.js` seam | This phase | Same code paths serve mouse and touch |
| UA-sniffing for device class | `matchMedia('(pointer: coarse)')` | Current best practice | Robust touch detection, avoids hybrid false-positives |

**Deprecated/outdated:**
- `screen.orientation.lock()` for enforcing landscape: unsupported/permission-gated on iOS Safari → use a CSS/overlay "rotate your device" pattern instead.
- Wiring audio unlock to `touchstart`: not an iOS activation event → use `pointerup`/`click`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A fixed 960×540 desktop wrapper makes letterbox scale 640→960 with **zero** bars (16:9 into 16:9) and preserves the desktop look "closely enough" | Pitfall 7, Code Examples | Desktop pixels differ subtly from today; UAT may object → device-branch fallback needed. **VERIFY at desktop-parity UAT.** |
| A2 | `matchMedia('(pointer: coarse)')` is the right visibility predicate for the kid's actual tablet/phone | Pitfall 5, index.html | If her device reports `fine`/hybrid, buttons hidden → confirmed only at MOB-06 on-device (deferred by design) |
| A3 | Playwright `hasTouch` + `touchscreen.tap` grants user-activation, so the headless audio-gesture gate passes even though a real iOS `touchstart` would not | Pitfall 6, Validation | Low risk (documented) — this is precisely WHY MOB-05 device proof is deferred |
| A4 | iOS ITP evicts localStorage after ~7 days of no interaction | §MOB-05 / Deferred | Documentation-only expectation per CONTEXT; no code depends on it. Behavior varies by iOS version |
| A5 | `page.touchscreen.tap` + injected `onTouchStart` reads back game coords reliably across a frame boundary | Probe design | If timing flakes, use `mousePos()` read after tap (also set via touchToMouse). Probe author picks the stable read. |

**None of these are package/security claims.** A1 and A2 are the ones the planner should surface for UAT/device confirmation; A3/A4 are already scoped as deferred.

## Open Questions

> **All RESOLVED — resolutions folded into the phase plans (2026-07-19).**

1. **Exact desktop-parity definition of "byte-identical." (RESOLVED)**
   - What we know: `browser-boot.mjs` proves behavioral + geometry parity (960×540, clicks land, audits green). The letterbox render path differs from CSS transform.
   - What's unclear: whether the rendered pixels are literally identical, and whether any difference matters to the kid.
   - **Resolution (Q1):** "Byte-identical" is defined as behavioral + display-geometry parity, enforced by the `browser-boot.mjs` HARD gate (desktop wrapper fixed at 960×540 = zero-bar 1.5× letterbox scale). Literal pixel identity is Assumption A1, carried to a desktop-parity **UAT spot-check** (Phase 38). The *letterbox-only-on-touch* device-branch fallback is documented but NOT taken unless UAT rejects the pixels — plan 37-02 owns the migration + parity gate.

2. **Where the touch controls hint / affordance lives. (RESOLVED)**
   - What we know: the game scene shows a keyboard hint "← → move · SPACE jump" (`hud.js`, gated by `check-safety.sh`'s `SPACE jump` substring — do NOT remove that string).
   - What's unclear: whether touch devices need an equivalent on-screen affordance beyond the buttons themselves.
   - **Resolution (Q2):** Keep the keyboard hint string intact (safety gate); the visible buttons are self-explanatory. Any touch-specific hint copy is DEFERRED to MOB-06 (Phase 38 kid tuning) — no touch-hint work in this phase.

3. **Container element: reuse `<body>` as canvas parent, or add a `#stage` wrapper? (RESOLVED)**
   - What we know: letterbox sizes the canvas to `parentElement.offsetWidth/Height`. Today the parent is `<body>` (flex-centered).
   - **Resolution (Q3):** Add a dedicated `#stage` wrapper (plan 37-02) so the device-class media queries + the portrait `#rotate` overlay (plan 37-04) target it cleanly without touching `<body>` layout.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Kaplay (vendored) | letterbox, touch API, touchToMouse | ✓ | 3001.0.19 @ `lib/kaplay.mjs` | — (pinned, do not upgrade) |
| Playwright (resolver) | RED-first probe + parity gate | ✓ (per `browser-boot.mjs` resolver: project dep → `PLAYWRIGHT_MJS_PATH` → nvm gsd-pi search) | as installed | Set `PLAYWRIGHT_MJS_PATH` |
| Playwright touch emulation (`hasTouch`/`isMobile`/`touchscreen.tap`) | probe | ✓ (Chromium) | bundled | `dispatchTouchEvent` via CDP if `touchscreen` unavailable |
| Real phone/tablet | MOB-05 audio proof, MOB-06 ergonomics | ✗ | — | DEFERRED to Phase 38 / user's device (by design) |
| `python3 -m http.server` (dev serve) | manual playtest | ✓ (per CLAUDE.md) | — | any static server over HTTP |

**Missing dependencies with no fallback:** Real touch device for audio-activation + ergonomics proof — **intentionally deferred**, not a blocker for the buildable scope (MOB-01..05 code).
**Missing dependencies with fallback:** None blocking.

## Validation Architecture

> `nyquist_validation: true` — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | No JS test framework (no-build canon). Shell gates + Playwright browser scripts ARE the suite. |
| Config file | none — scripts self-contained |
| Quick run command | `node scripts/touch-coordinate-probe.mjs` (new) + `bash scripts/check-safety.sh` |
| Full suite command | `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh && node scripts/validate-levels.mjs && node scripts/browser-boot.mjs && node scripts/touch-coordinate-probe.mjs` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOB-01 | Touch tap at canvas center maps to game (320,180) under letterbox; RED before, GREEN after | integration (touch-emu) | `node scripts/touch-coordinate-probe.mjs` | ❌ Wave 0 (new probe; author it RED-first) |
| MOB-01 | Desktop mouse behavior unchanged — level-select tile clicks + mute-icon click still land | integration | `node scripts/browser-boot.mjs` | ✅ (extend/keep green) |
| MOB-02 | Virtual buttons drive `src/input.js`; jump reuses buffer/coyote/variable-height | integration (touch-emu) | new assertion in probe or a `touch-controls-drive.mjs` (dup harness) | ❌ Wave 0 |
| MOB-02 | No timer in new touch code | static | `bash scripts/check-safety.sh` | ✅ |
| MOB-02 | No engine global at module top level in `input.js`/`touchControls.js` | static | `bash scripts/check-import-safety.sh` | ✅ |
| MOB-03 | Tap on an answer box fires `box.onClick` (via touchToMouse + unified map) | integration (touch-emu) | assertion: emulate touch, resolve a math challenge by tap | ❌ Wave 0 |
| MOB-04 | Portrait shows overlay; `touch-action:none` present on canvas | integration + static | probe checks overlay visibility in portrait viewport; grep `touch-action` in index.html | ❌ Wave 0 (static grep trivial) |
| MOB-05 | `AudioContext` resumes on gesture (headless — NOT the device proof) | integration | existing `assertAudioContextState` in `browser-boot.mjs` (already green) | ✅ (device proof DEFERRED) |

### Sampling Rate
- **Per task commit:** `bash scripts/check-safety.sh && bash scripts/check-import-safety.sh` (fast static) + `node scripts/touch-coordinate-probe.mjs`.
- **Per wave merge:** add `node scripts/browser-boot.mjs` (desktop parity — the HARD gate) + `node scripts/validate-levels.mjs`.
- **Phase gate:** full suite green; plus a manual desktop-parity spot-check (A1) and a note that MOB-05 device proof + MOB-06 ergonomics are formally deferred to Phase 38.

### Wave 0 Gaps
- [ ] `scripts/touch-coordinate-probe.mjs` — the RED-first permanent gate (dup `browser-boot.mjs`'s server + `resolvePlaywright()` per the deliberate-duplication convention). Author it asserting ≈320, prove RED on the current build, land migration, prove GREEN.
- [ ] Touch-context assertions for MOB-02/MOB-03 (can live in the same probe or a sibling `touch-controls-drive.mjs`).
- [ ] Static grep for `touch-action: none` + viewport meta (can fold into an existing check or the probe).
- [ ] No new framework install needed.

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1`. This is a **static, client-side, no-backend, no-accounts, no-network-input** game (CLAUDE.md). The attack surface is minimal and unchanged by this phase.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts/auth |
| V3 Session Management | no | No sessions/backend |
| V4 Access Control | no | No server, no resources to protect |
| V5 Input Validation | minimal | Touch/pointer input is numeric coordinate data consumed by the engine; no string sink. New UI stays canvas-draw (no `innerHTML`) — continues the project's "in-world, not the DOM" no-injection rule. The one DOM markup site (index.html file:// guard + new portrait overlay) uses static strings only. |
| V6 Cryptography | no | No secrets, no crypto |

### Known Threat Patterns for {static browser game}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DOM injection via new overlay markup | Tampering | Static string overlay only; no user/`localStorage` value interpolated into HTML. Keep touch UI as Kaplay canvas objects (existing convention). |
| `localStorage` tampering (save/mute) | Tampering | Already mitigated: guarded `progress.js`/`audio.js` seams never throw, forgiving defaults. Unchanged by this phase. |
| Path traversal in probe/harness server | Information Disclosure | `browser-boot.mjs` already clamps to ROOT + loopback bind; the new probe dups that hardened server (do NOT weaken it). |

No new secrets, network calls, or trust boundaries are introduced. The iOS ITP 7-day storage eviction is a *privacy-platform behavior*, not a vulnerability — documented as an expectation (laptop remains the progress home).

## Sources

### Primary (HIGH confidence)
- `lib/kaplay.mjs` (vendored Kaplay 3001.0.19) — direct source read: `letterbox` viewport math (offset ~42142), `Qe` window→content transform (~42540), `Me.mousemove` (~52314), `Me.touchstart/move/end/cancel` (~54790/55310/55669/56179), `onTouchStart/Move/End` exports (~58287, ~185730), `isTouchscreen()` (~46255), `mousePos()` (~46289), `touchToMouse` option (~177165), canvas init (~176504), `onResize` (~138531). **This is the load-bearing verification.**
- `src/main.js`, `src/index.html`, `src/player.js`, `src/ui/challenge.js`, `src/audio.js`, `src/scenes/title.js`, `src/scenes/select.js`, `scripts/browser-boot.mjs`, `scripts/check-safety.sh`, `src/config.js` — read directly for the current seams, conventions, and gates.
- `.planning/phases/37-.../37-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/config.json` — locked decisions, MOB IDs, workflow toggles.

### Secondary (MEDIUM confidence)
- iOS Safari audio-activation + ITP storage-eviction behavior; `matchMedia('(pointer: coarse)')` semantics; `touch-action` / viewport-meta gesture suppression — established platform knowledge, `[ASSUMED]` for exact iOS-version thresholds (A3/A4), to be confirmed on device (deferred).

### Tertiary (LOW confidence)
- None relied upon.

## Metadata

**Confidence breakdown:**
- Letterbox unifies mouse+touch coordinate mapping: **HIGH** — read directly from vendored engine source with offsets; the DOM-overlay fallback is provably unnecessary (probe confirms).
- Touch API / multi-touch / touchToMouse: **HIGH** — public globals + handlers verified in source.
- Desktop "byte-identical" pixel parity: **MEDIUM** — behavioral/geometry parity is gated; literal pixel identity is A1 (UAT-verify).
- Feature-detect predicate on the kid's real device: **MEDIUM** — `pointer: coarse` is the right primitive; the specific device is MOB-06/deferred.
- iOS audio activation + ITP specifics: **MEDIUM/LOW** — correct in direction, exact behavior device-verified (deferred by design).

**Research date:** 2026-07-19
**Valid until:** 2026-08-18 (30 days) — engine is pinned/vendored so findings are stable; iOS platform specifics may drift but are deferred anyway.
