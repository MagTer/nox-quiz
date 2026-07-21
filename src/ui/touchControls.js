// src/ui/touchControls.js — the on-screen virtual thumb buttons (MOB-02; Phase 37-06,
// rewritten as an HTML VIEWPORT OVERLAY in quick 260721-cct).
//
// PURPOSE: activate the left/right + jump buttons that live in the #touch-controls HTML
// overlay (src/index.html) and feed the src/input.js seam so a phone player can run and
// jump. This is the VISIBLE half of MOB-02. It NEVER re-implements jump — it forwards
// press/release EDGES into the seam 37-03 established (input.fireJumpPress/fireJumpRelease),
// so player.js's LOCKED coyote/buffer/variable-height physics are reused verbatim for both
// keyboard and touch. Movement is the same story: it only flips input.setLeftHeld/
// setRightHeld, which player.js ORs with the keyboard read — one shared movement path.
//
// DOM OVERLAY (quick 260721-cct): the buttons are NO LONGER drawn inside the Kaplay 640x360
// buffer. They are real <button> elements in an HTML overlay pinned to the PHYSICAL viewport
// (screen-edge based, screen-relative size — see the CSS in src/index.html). After the
// letterbox/contain framing change (quick 260721-ban) the game renders with pillarbox bars
// on the SIDES, so in-buffer buttons sat over the art and their fixed game-space px size
// could never reach the bars. This module now does PURE DOM POINTER WIRING — it toggles the
// overlay's `.active` class and binds pointer handlers on the three buttons. Consequence:
// it uses ONLY DOM/browser globals (document, matchMedia, PointerEvent), NO Kaplay engine
// primitives at all — even safer under the a727c13 rule than the old Kaplay-drawn version.
//
// TOUCH-ONLY (desktop byte-identical): the FIRST thing mount does is feature-detect
// matchMedia("(pointer: coarse)") — the PRIMARY pointer being coarse, NOT UA-sniffing and
// NOT isTouchscreen() (which is true on touch-capable laptops → would leak buttons onto the
// desktop, breaking parity; 37-RESEARCH Pitfall 5). On a fine-pointer desktop mount returns
// a no-op teardown handle, adds NO `.active`, and binds NOTHING, so the overlay stays
// display:none and browser-boot stays byte-identical.
//
// MULTI-TOUCH (per-element pointer capture): each button is its OWN element and calls
// setPointerCapture on pointerdown, so left+jump held simultaneously works and lifting one
// finger never clears the other — the browser routes each pointerId to its captured element.
// No identifier Map is needed (the old Kaplay path tracked Touch.identifier by hand).
//
// NO TIMERS (SAFE-01): nothing here measures hold duration. Variable-height jump is a pure
// press/release edge + vel.y sign in player.js — this module only forwards the two edges.
// No setTimeout/setInterval/wait()/loop()/lifespan() anywhere.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): this module references NO Kaplay engine globals at all
// (module top level or inside the body). Only DOM/browser globals (document, window.matchMedia,
// PointerEvent via addEventListener) are used, all inside the function body. An import can
// never throw an engine-global ReferenceError.

import * as input from "../input.js"; // the ONE input seam (37-03) — this module ONLY drives it

// mountTouchControls(isFrozen): activates the #touch-controls HTML overlay on a coarse-pointer
// device and wires each button's pointer handlers into the input seam. `isFrozen` is a getter
// the scene passes (() => player.paused) so movement is inert while a math panel is open — the
// same freeze the keyboard respects (player.paused halts the player's onUpdate). Returns a
// teardown handle whose destroy() removes every addEventListener, strips `.pressed`, and drops
// the overlay's `.active` class. On desktop (fine pointer) or when the overlay element is
// absent (headless without the markup) it returns a no-op handle and binds nothing.
export function mountTouchControls(isFrozen = () => false) {
  // FIRST guard — feature-detect the PRIMARY pointer (37-RESEARCH Pitfall 5). matchMedia is
  // a browser global; guarded for node/headless-without-matchMedia so an import never throws.
  const coarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (!coarse) {
    // Desktop / fine pointer: activate NOTHING — desktop byte-identical (browser-boot parity).
    return { destroy() {} };
  }

  // The overlay markup lives in src/index.html. If it (or document) is missing — e.g. a
  // headless harness without the element — return the no-op handle rather than throwing.
  const container =
    typeof document !== "undefined" ? document.getElementById("touch-controls") : null;
  if (!container) {
    return { destroy() {} };
  }

  const left = document.getElementById("tc-left");
  const right = document.getElementById("tc-right");
  const jump = document.getElementById("tc-jump");
  if (!left || !right || !jump) {
    return { destroy() {} };
  }

  // Reveal the overlay: the CSS only paints .tc-btn when the container carries `.active`
  // (AND the device is coarse-pointer landscape). Removed again on teardown.
  container.classList.add("active");

  // Closure-local listener registry (anti-leak) — every addEventListener is recorded here and
  // removed 1:1 in destroy(). NO module-level let anywhere in this file.
  const listeners = [];
  function on(el, type, handler) {
    el.addEventListener(type, handler);
    listeners.push({ el, type, handler });
  }

  // A pointerdown on a movement button: capture the pointer to THIS element (so a drag off
  // the button still delivers its pointerup here → held-state is always cleared), mark it
  // pressed, and set held-state ONLY when NOT frozen — the buttons never mutate held-state
  // while the run is frozen (challenge-pause-aware, mirrors the keyboard). preventDefault
  // stops the synthetic mouse/scroll/zoom the browser would otherwise emit.
  function onMoveDown(el, setHeld) {
    return (e) => {
      e.preventDefault();
      if (el.setPointerCapture && e.pointerId !== undefined) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* capture is best-effort; pointerup still clears held-state */
        }
      }
      el.classList.add("pressed");
      if (!isFrozen()) setHeld(true);
    };
  }

  // pointerup / pointercancel on a movement button: un-press and ALWAYS clear held-state
  // (clearing to false is safe frozen or not — it can never start a spurious move).
  function onMoveUp(el, setHeld) {
    return (e) => {
      e.preventDefault();
      el.classList.remove("pressed");
      setHeld(false);
    };
  }

  const leftDown = onMoveDown(left, input.setLeftHeld);
  const leftUp = onMoveUp(left, input.setLeftHeld);
  on(left, "pointerdown", leftDown);
  on(left, "pointerup", leftUp);
  on(left, "pointercancel", leftUp);

  const rightDown = onMoveDown(right, input.setRightHeld);
  const rightUp = onMoveUp(right, input.setRightHeld);
  on(right, "pointerdown", rightDown);
  on(right, "pointerup", rightUp);
  on(right, "pointercancel", rightUp);

  // Jump: pointerdown forwards the press EDGE (player.js's onJumpPress already guards
  // player.paused, so a jump while frozen is a no-op → no isFrozen() check needed here);
  // pointerup/pointercancel forwards the release EDGE (the variable-height cut).
  const jumpDown = (e) => {
    e.preventDefault();
    if (jump.setPointerCapture && e.pointerId !== undefined) {
      try {
        jump.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort */
      }
    }
    jump.classList.add("pressed");
    input.fireJumpPress(); // reuses the LOCKED buffer/coyote path (no new jump logic)
  };
  const jumpUp = (e) => {
    e.preventDefault();
    jump.classList.remove("pressed");
    input.fireJumpRelease();
  };
  on(jump, "pointerdown", jumpDown);
  on(jump, "pointerup", jumpUp);
  on(jump, "pointercancel", jumpUp);

  // Teardown handle (anti-leak): remove every listener 1:1, strip any lingering `.pressed`,
  // and drop the overlay's `.active` class so nothing (listeners, pressed state, or the
  // visible overlay) survives a go()/respawn. Wired on game.js's onSceneLeave (paired with
  // input.reset() in the scene). On desktop this handle is never reached (the early return
  // above hands back the empty no-op destroy).
  return {
    destroy() {
      for (const { el, type, handler } of listeners) {
        el.removeEventListener(type, handler);
      }
      listeners.length = 0;
      left.classList.remove("pressed");
      right.classList.remove("pressed");
      jump.classList.remove("pressed");
      container.classList.remove("active");
    },
  };
}
