// src/input.js — the ONE input seam (MOB-02; Phase 37).
//
// PURPOSE: merge KEYBOARD input and VIRTUAL-BUTTON (touch) input into a single
// interface that src/player.js consumes, so the LOCKED coyote/buffer/variable-height
// jump in player.js is REUSED verbatim by BOTH the keyboard and (in 37-06) the touch
// buttons — never a parallel jump implementation. The keyboard is routed THROUGH this
// seam (initKeyboardJump wires onKeyPress/onKeyRelease to fire the same jump edges the
// touch buttons will), which guarantees exactly ONE jump code path. Desktop feel stays
// byte-identical: the seam only ORs in a virtual finger that is simply never active on
// desktop.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): every Kaplay primitive this module touches
// (isKeyDown, onKeyPress, onKeyRelease) is referenced ONLY inside function bodies —
// NEVER at module top level. The module-scope state below (leftBtn/rightBtn booleans +
// the two callback arrays) is plain data, not engine calls, so it is safe at module
// scope — exactly mirroring src/audio.js's musicHandle/muted precedent. A top-level
// engine reference would throw at import and blank the canvas.
//
// NO TIMERS (SAFE-01): this module measures NOTHING. Variable-height jump stays a pure
// press/release edge + vel.y sign in player.js — the seam only forwards the press and
// release EDGES (fireJumpPress/fireJumpRelease). There is no setTimeout/setInterval/
// wait()/loop()/lifespan() anywhere here, and none is needed.

// --- Module-scope state (plain data only — a727c13-safe, like audio.js's musicHandle) ---
// Virtual-button held-state: driven by src/ui/touchControls.js (37-06) per finger via
// setLeftHeld/setRightHeld. false on desktop (no touch UI mounted), so the OR in
// isLeftHeld/isRightHeld collapses to the pure keyboard read — desktop byte-identical.
let leftBtn = false;
let rightBtn = false;

// Jump press/release edge registries: player.js registers its buffer-set (onJumpPress)
// and variable-height cut (onJumpRelease) here ONCE per makePlayer(); both the keyboard
// (via initKeyboardJump) and touch (via touchControls.js) invoke them through
// fireJumpPress/fireJumpRelease — the SAME single jump path.
const jumpPressCbs = [];
const jumpReleaseCbs = [];

// --- Virtual-button held-state setters (called by touchControls.js in 37-06) ---
export function setLeftHeld(v) {
  leftBtn = !!v;
}
export function setRightHeld(v) {
  rightBtn = !!v;
}

// --- Jump edge registry: register (player.js) + fire (keyboard + touch drivers) ---
export function onJumpPress(cb) {
  jumpPressCbs.push(cb);
}
export function onJumpRelease(cb) {
  jumpReleaseCbs.push(cb);
}
export function fireJumpPress() {
  // Snapshot-free forward: player.js registers exactly one press cb per scene entry.
  for (const cb of jumpPressCbs) cb();
}
export function fireJumpRelease() {
  for (const cb of jumpReleaseCbs) cb();
}

// --- Held-direction reads (consumed by player.js's horizontal-run onUpdate) ---
// isKeyDown is an engine GLOBAL — referenced INSIDE the function body ONLY (a727c13).
// The keyboard OR-terms are byte-identical to player.js's original reads (left/a, right/d);
// the virtual-button term is the only addition, and it is always false on desktop.
export function isLeftHeld() {
  return isKeyDown("left") || isKeyDown("a") || leftBtn;
}
export function isRightHeld() {
  return isKeyDown("right") || isKeyDown("d") || rightBtn;
}

// --- Keyboard jump wiring — called ONCE from makePlayer AFTER kaplay() has run ---
// Routes the keyboard's jump keys through the SAME edge registry the touch buttons use,
// so both drive player.js's one buffer/coyote/variable-height path. reset() first (see
// below) so nothing accumulates across scene re-entries — the keyboard's onKeyPress/
// onKeyRelease app-bus controllers are auto-cancelled by go(), but the module-scope
// callback arrays are not, so we clear them here on every clean (re)mount. onKeyPress/
// onKeyRelease are engine globals — referenced inside this function body only (a727c13).
export function initKeyboardJump(jumpKeys) {
  reset();
  onKeyPress(jumpKeys, () => fireJumpPress());
  onKeyRelease(jumpKeys, () => fireJumpRelease());
}

// --- Anti-leak reset (anti-leak; mirrors challenge.js controller-cancel discipline) ---
// Clears virtual held-state and empties both jump-callback registries so nothing
// accumulates across scene re-entries. Called by initKeyboardJump on every clean mount
// (this plan) and, per 37-RESEARCH §Pattern 1, wired on onSceneLeave in game.js (37-06)
// as defence-in-depth. Plain-data mutation only — no engine calls, safe to call anytime.
export function reset() {
  leftBtn = false;
  rightBtn = false;
  jumpPressCbs.length = 0;
  jumpReleaseCbs.length = 0;
}
