// src/mechanics/enemy.js — defeat-enemy (math-blocker) collision mechanic.
//
// REQUIREMENT-ID NOTE (Phase 36, A3): this header formerly tagged the defeat-enemy
// mechanic "MECH-05". That was requirement-ID drift — MECH-05 is the secret-alcove
// PERSISTENT AMBIENT change (a linked dark light brightens on discovery; see
// src/mechanics/secretAlcove.js + src/scenes/game.js's lightAmbient()). The enemy here is
// the math-challenge blocker, unrelated to MECH-05. Comment-only fix; behavior unchanged.
//
// This module wires the "enemy" tagged solid colliders created by
// src/levels/build.js onto the player via the SHARED src/ui/challenge.js seam.
// A single call handles ALL enemies: Kaplay's onCollide passes the specific touched
// object as the callback argument, so each enemy is defeated independently.
//
// ONE-WAY DEPENDENCY: this module imports ../ui/challenge.js DIRECTLY. It NEVER imports
// ../ui/mathGate.js. The arrow is enemy.js -> challenge.js, full stop.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): `vec2` and `destroy` are referenced ONLY inside the
// exported function body, after kaplay({ global }) runs. mechanics/ is one directory below
// src/, so sibling imports use `../`.
//
// CRITICAL CONTRACT: there is NO contact-damage branch. The enemy NEVER teleports the
// player, NEVER reduces HP, NEVER ends the run, and NEVER punishes the player for touching it.
// The ONLY resolution path is answering the challenge correctly.

import { openChallenge } from "../ui/challenge.js";
import * as fx from "../fx.js";

/**
 * Wire the player to every "enemy"-tagged entity created by buildLevel().
 *
 * @param {object} args
 * @param {GameObj} args.player  the player entity (must be pausable + have onCollide).
 * @param {object} args.brain    the scene's math brain; passed straight to openChallenge.
 */
export function wireEnemy({ player, brain }) {
  // Fire-once latch keyed by the touched enemy object. Closure-local (never module-level)
  // so it is garbage-collected with the scene and cannot leak across replays.
  const defeated = new Set();

  // WR-03: guard against onCollide re-firing for the SAME not-yet-defeated enemy (or a
  // DIFFERENT enemy) while a challenge for this wiring is already open. Closure-local
  // (never module-level) for the same GC-with-the-scene reason as `defeated` above.
  let busy = false;

  player.onCollide("enemy", (enemyObj) => {
    if (defeated.has(enemyObj) || busy) return; // belt-and-braces + re-entrancy guard
    busy = true;

    // Freeze the player exactly like the door mechanic does.
    player.vel = vec2(0);
    player.paused = true;

    openChallenge({
      brain,
      label: "Answer to defeat the guard:", // PREFIXES the arithmetic display rather than
      // replacing it (21-FINDINGS.md Finding 2 fix) — the player must still see the actual
      // "6 × 7" problem the four answer boxes are answering, not just the guard framing.
      onSuccess() {
        defeated.add(enemyObj);
        busy = false;

        fx.clearBurst();

        // Destroy the touched collider, its visible panel, and its glyph BEFORE unfreezing.
        // CR-02: enemyObj is now the invisible tall anti-jump-over blocker (mirrors
        // door.js); the visible panel is a separate, non-colliding cosmetic object that
        // must be destroyed alongside it or a panel-with-no-collider would be left behind.
        destroy(enemyObj);
        if (enemyObj.panelObj) destroy(enemyObj.panelObj);
        if (enemyObj.glyphObj) destroy(enemyObj.glyphObj);

        player.paused = false;
      },
    });
  });
}
