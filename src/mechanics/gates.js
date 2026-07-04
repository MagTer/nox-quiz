// src/mechanics/gates.js — multiple checkpoint math-gate collision mechanic (MECH-04).
//
// This module wires the "math-gate" tagged solid colliders created by
// src/levels/build.js onto the player via the SHARED src/ui/challenge.js seam.
// A single call handles ALL checkpoint gates: Kaplay's onCollide passes the specific
// touched object as the callback argument, so each gate opens independently.
//
// ONE-WAY DEPENDENCY: this module imports ../ui/challenge.js DIRECTLY. It NEVER imports
// ../ui/mathGate.js. The arrow is gates.js -> challenge.js, full stop.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): `vec2` and `destroy` are referenced ONLY inside the
// exported function body, after kaplay({ global }) runs. mechanics/ is one directory below
// src/, so sibling imports use `../`.
//
// CRITICAL ORDERING: the collider and its glyph MUST be destroyed BEFORE unfreezing the
// player, otherwise the player could re-collide in the same frame and soft-lock.

import { openChallenge } from "../ui/challenge.js";
import * as fx from "../fx.js";

/**
 * Wire the player to every "math-gate"-tagged entity created by buildLevel().
 *
 * Multiple gates can coexist and each opens independently on its own correct answer.
 *
 * @param {object} args
 * @param {GameObj} args.player  the player entity (must be pausable + have onCollide).
 * @param {object} args.brain    the scene's math brain; passed straight to openChallenge.
 */
export function wireGates({ player, brain }) {
  // Fire-once latch keyed by the touched gate object. Closure-local (never module-level)
  // so it is garbage-collected with the scene and cannot leak across replays.
  const opened = new Set();

  player.onCollide("math-gate", (gateObj) => {
    if (opened.has(gateObj)) return; // belt-and-braces: ignore an already-opened gate

    // Freeze the player exactly like the door mechanic does.
    player.vel = vec2(0);
    player.paused = true;

    openChallenge({
      brain,
      onSuccess() {
        opened.add(gateObj);

        fx.clearBurst();

        // Destroy the touched collider, its visible panel, and its glyph BEFORE unfreezing.
        // CR-02: gateObj is now the invisible tall anti-jump-over blocker (mirrors door.js);
        // the visible panel is a separate, non-colliding cosmetic object that must be
        // destroyed alongside it or a panel-with-no-collider would be left behind.
        destroy(gateObj);
        if (gateObj.panelObj) destroy(gateObj.panelObj);
        if (gateObj.glyphObj) destroy(gateObj.glyphObj);

        player.paused = false;
      },
    });
  });
}
