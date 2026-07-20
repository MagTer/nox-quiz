// src/ui/touchControls.js — the on-screen virtual thumb buttons (MOB-02; Phase 37-06).
//
// PURPOSE: draw discrete left/right (bottom-LEFT) + jump (bottom-RIGHT) virtual buttons
// and feed the src/input.js seam so a phone player can run and jump. This is the VISIBLE
// half of MOB-02. It NEVER re-implements jump — it forwards press/release EDGES into the
// seam 37-03 established (input.fireJumpPress/fireJumpRelease), so player.js's LOCKED
// coyote/buffer/variable-height physics are reused verbatim for both keyboard and touch.
// Movement is the same story: it only flips input.setLeftHeld/setRightHeld, which player.js
// ORs with the keyboard read — one shared movement path.
//
// TOUCH-ONLY (desktop byte-identical): the FIRST thing mount does is feature-detect
// matchMedia("(pointer: coarse)") — the PRIMARY pointer being coarse, NOT UA-sniffing and
// NOT isTouchscreen() (which is true on touch-capable laptops → would leak buttons onto the
// desktop, breaking parity; 37-RESEARCH Pitfall 5). On a fine-pointer desktop mount returns
// a no-op teardown handle and draws NOTHING, so browser-boot stays byte-identical.
//
// MULTI-TOUCH (per-identifier): a closure-local Map<Touch.identifier, buttonName> tracks
// which finger holds which button, so left+jump held simultaneously works and lifting one
// finger never clears the other (37-RESEARCH Pattern 2 / Pitfall 2). ONLY onTouchStart and
// onTouchEnd are registered — there is NO onTouchCancel public global in Kaplay 3001
// (calling it throws ReferenceError at mount and breaks ALL touch input); the engine's
// internal DOM touchcancel handler fires the SAME public "touchEnd" KEvent, so onTouchEnd
// already receives cancelled touches and per-identifier cleanup is fully covered.
//
// NO TIMERS (SAFE-01): nothing here measures hold duration. Variable-height jump is a pure
// press/release edge + vel.y sign in player.js — this module only forwards the two edges.
// No setTimeout/setInterval/wait()/loop()/lifespan() anywhere.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): every Kaplay primitive (add, circle, pos, color,
// opacity, fixed, z, text, anchor, onTouchStart, onTouchEnd, destroyAll) is referenced
// ONLY inside the mountTouchControls() function body — never at module top level. matchMedia
// is a browser global (not an engine global), so it is safe inside the body too.

import { CONFIG } from "../config.js";
import * as input from "../input.js"; // the ONE input seam (37-03) — this module ONLY drives it

// mountTouchControls(isFrozen): draws the buttons on a coarse-pointer device and wires the
// per-identifier touch handlers into the input seam. `isFrozen` is a getter the scene passes
// (() => player.paused) so movement is inert while a math panel is open — the same freeze the
// keyboard respects (player.paused halts the player's onUpdate). Returns a teardown handle
// whose destroy() cancels the engine controllers + clears the identifier map + destroys the
// button entities. On desktop (fine pointer) it returns a no-op handle and draws nothing.
export function mountTouchControls(isFrozen = () => false) {
  // FIRST guard — feature-detect the PRIMARY pointer (37-RESEARCH Pitfall 5). matchMedia is
  // a browser global; guarded for node/headless-without-matchMedia so an import never throws.
  const coarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  if (!coarse) {
    // Desktop / fine pointer: mount NOTHING — desktop byte-identical (browser-boot parity).
    return { destroy() {} };
  }

  const T = CONFIG.TOUCH;

  // Button model — rects are authored in the internal 640x360 GAME space (CONFIG.TOUCH), and
  // the letterbox migration (37-02) maps taps into that same space via the engine's single Qe
  // transform, so the rect X/Y/W/H ARE the AABB hit-test coordinates (zero magic numbers here).
  const buttons = [
    { name: "left", r: T.LEFT, glyph: T.GLYPHS.LEFT, box: null },
    { name: "right", r: T.RIGHT, glyph: T.GLYPHS.RIGHT, box: null },
    { name: "jump", r: T.JUMP, glyph: T.GLYPHS.JUMP, box: null },
  ];

  // Draw each button as a fixed() (camera-immune) high-z() Kaplay draw object — NOT DOM, so
  // the no-injection canvas-object convention (challenge.js/audio.js) continues. Dark-grunge
  // fill (PALETTE.MUTED) at CONFIG.TOUCH.OPACITY, with a centered glyph label. All tagged
  // "touchctl" so destroyAll("touchctl") sweeps every piece on teardown.
  //
  // Roblox-style circular visual (quick 260720-mob): the VISIBLE button is a circle()
  // inscribed in the config rect (diameter = W, centered on the rect's center) — but the
  // HIT zone stays the full CONFIG.TOUCH AABB square below (deliberately MORE generous
  // than the visible circle; a near-miss thumb still lands the press). circle() draws
  // centered on the object's pos, so pos is the rect center, not the rect origin.
  for (const b of buttons) {
    b.box = add([
      circle(b.r.W / 2),
      pos(b.r.X + b.r.W / 2, b.r.Y + b.r.H / 2),
      color(CONFIG.PALETTE.MUTED[0], CONFIG.PALETTE.MUTED[1], CONFIG.PALETTE.MUTED[2]),
      outline(2, rgb(CONFIG.PALETTE.MUTED_BORDER[0], CONFIG.PALETTE.MUTED_BORDER[1], CONFIG.PALETTE.MUTED_BORDER[2])),
      opacity(T.OPACITY),
      fixed(),
      z(9500),
      "touchctl",
    ]);
    add([
      text(b.glyph, { size: T.GLYPH_SIZE }),
      pos(b.r.X + b.r.W / 2, b.r.Y + b.r.H / 2),
      anchor("center"),
      color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
      opacity(Math.min(1, T.OPACITY + 0.4)), // glyph a touch brighter than the fill so it reads
      fixed(),
      z(9501),
      "touchctl",
    ]);
  }

  // Per-finger tracking (37-RESEARCH Pattern 2): identifier -> button name. Closure-local
  // (never module-level — anti-leak), cleared on teardown.
  const active = new Map();

  // AABB hit-test: pos (already in 640x360 game space via Qe) inside a button's rect.
  function hit(pos, r) {
    return pos.x >= r.X && pos.x <= r.X + r.W && pos.y >= r.Y && pos.y <= r.Y + r.H;
  }

  function setPressed(b, pressed) {
    if (b.box && b.box.exists()) b.box.opacity = pressed ? T.PRESSED_OPACITY : T.OPACITY;
  }

  // onTouchStart delivers (gamePos, rawTouch) — rawTouch.identifier is the per-finger id.
  // First matching button wins (a finger presses one button). Jump forwards the press EDGE
  // (player.js's onJumpPress already guards player.paused, so a jump while frozen is a no-op);
  // movement flips held-state ONLY when NOT frozen — the buttons never mutate held-state while
  // the run is frozen (challenge-pause-aware, mirrors the keyboard).
  const startCtrl = onTouchStart((pos, touch) => {
    for (const b of buttons) {
      if (!hit(pos, b.r)) continue;
      active.set(touch.identifier, b.name);
      setPressed(b, true);
      if (b.name === "jump") {
        input.fireJumpPress(); // reuses the LOCKED buffer/coyote path (no new jump logic)
      } else if (!isFrozen()) {
        if (b.name === "left") input.setLeftHeld(true);
        else input.setRightHeld(true);
      }
      break; // one button per finger
    }
  });

  // onTouchEnd fires for BOTH lifted AND cancelled touches (the engine routes DOM touchcancel
  // to this same event — there is no onTouchCancel global). Read the finger's button by its
  // identifier, delete it, and release: jump forwards the release EDGE (variable-height cut),
  // movement always clears held-state (clearing to false is always safe, frozen or not).
  const endCtrl = onTouchEnd((pos, touch) => {
    const name = active.get(touch.identifier);
    if (name === undefined) return; // a touch that never started on a button
    active.delete(touch.identifier);
    const b = buttons.find((x) => x.name === name);
    if (b) setPressed(b, false);
    if (name === "jump") input.fireJumpRelease();
    else if (name === "left") input.setLeftHeld(false);
    else input.setRightHeld(false);
  });

  // Teardown handle (anti-leak): cancel the app-bus controllers, clear the identifier map,
  // and destroy the button entities. Wired on game.js's onSceneLeave so nothing (held-state,
  // controllers, or entities) survives a go()/respawn. Paired with input.reset() in the scene.
  return {
    destroy() {
      startCtrl.cancel();
      endCtrl.cancel();
      active.clear();
      destroyAll("touchctl");
    },
  };
}
