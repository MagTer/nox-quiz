// src/mechanics/door.js — the locked-door collision mechanic (Plan 15-03).
//
// This is the first module in the new mechanics/ directory. It wires the "door" tagged
// solid colliders created by src/levels/build.js onto the player via the SHARED
// src/ui/challenge.js seam (created in 15-02), proving that seam generalizes to a second,
// mid-level caller beyond the end-of-level math gate.
//
// ONE-WAY DEPENDENCY: this module imports ../ui/challenge.js DIRECTLY. It NEVER imports
// ../ui/mathGate.js — that wrapper remains end-of-level-specific (GATE-06). The arrow is
// door.js -> challenge.js, full stop.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): `vec2` and `destroy` are referenced ONLY inside the
// exported function body, after kaplay({ global }) runs. mechanics/ is one directory below
// src/, so sibling imports use `../`.
//
// CRITICAL DELTA from src/scenes/game.js onReachGoal(): the goal NEVER unfreezes the
// player because the scene transitions away via go("select") immediately after a correct
// answer. A mid-level door MUST resume play (set the player's `paused` back to false) so
// play resumes in the SAME scene. Additionally, the door collider and its glyph MUST be
// destroyed BEFORE unfreezing, otherwise the player could re-collide in the same frame and
// soft-lock.

import { openChallenge } from "../ui/challenge.js";
import * as fx from "../fx.js";

/**
 * Wire the player to every "door"-tagged entity created by buildLevel().
 *
 * A single call handles ALL doors: Kaplay's onCollide passes the specific touched object
 * as the callback argument, so no per-door registration is needed (same idiom as the
 * checkpoint handler in src/scenes/game.js).
 *
 * @param {object} args
 * @param {GameObj} args.player  the player entity (must be pausable + have onCollide).
 * @param {object} args.brain    the scene's math brain; passed straight to openChallenge.
 */
export function wireDoor({ player, brain }) {
  // Fire-once latch keyed by the touched door object. Closure-local (never module-level)
  // so it is garbage-collected with the scene and cannot leak across replays.
  const opened = new Set();

  // WR-03 (applied here by 22-FINDINGS.md Finding 4): guard against onCollide re-firing
  // for a SECOND door while a challenge for this wiring is already open. Copied from the
  // enemy.js WR-03 guard (commit 5d168dc). `player.paused = true` below is NOT sufficient
  // on its own: the engine's collision pass dispatches pairs synchronously in one
  // incremental traversal and only re-checks the grid-resident partner's paused flag per
  // pair — the traversed object's own paused flag is read ONCE before its pair loop. The
  // player is added AFTER buildLevel's barriers (game.js), so the player is the traversed
  // object and a second overlapping door pair can still dispatch in the same frame after
  // the first handler pauses the player. Closure-local (never module-level) for the same
  // GC-with-the-scene reason as `opened` above; reset ONLY in onSuccess — the challenge's
  // sole close path (see Finding 3's invariant note).
  let busy = false;

  player.onCollide("door", (doorObj) => {
    if (opened.has(doorObj) || busy) return; // belt-and-braces + re-entrancy guard
    busy = true;

    // Freeze the player exactly like onReachGoal() does: zero velocity first, then pause.
    player.vel = vec2(0);
    player.paused = true;

    openChallenge({
      brain,
      onSuccess() {
        // Latch AFTER success, mirroring the goalReached placement in game.js.
        opened.add(doorObj);
        busy = false;

        fx.clearBurst();

        // Destroy the touched collider, its visible panel, and its glyph BEFORE unfreezing.
        // This ordering is load-bearing: the collider must not exist when player.paused
        // becomes false, or the same touch session could re-trigger and soft-lock the player.
        destroy(doorObj);
        if (doorObj.panelObj) destroy(doorObj.panelObj);
        if (doorObj.glyphObj) destroy(doorObj.glyphObj);

        // CRITICAL: always resume play. Unlike the end-of-level goal, the scene continues.
        player.paused = false;
      },
    });
  });
}
