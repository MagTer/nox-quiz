// src/mechanics/enemy.js — defeat-enemy collision mechanic (MECH-05).
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

  player.onCollide("enemy", (enemyObj) => {
    if (defeated.has(enemyObj)) return; // belt-and-braces: ignore an already-defeated enemy

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

        fx.clearBurst();

        // Destroy the touched collider and its glyph BEFORE unfreezing.
        destroy(enemyObj);
        if (enemyObj.glyphObj) destroy(enemyObj.glyphObj);

        player.paused = false;
      },
    });
  });
}
