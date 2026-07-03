// src/mechanics/collect.js — collect-the-answer collision mechanic (MECH-03).
//
// This module wires the invisible "answer-zone" triggers and "answer-pickup-slot"
// placeholders created by src/levels/build.js onto the player via the SHARED
// src/ui/challenge.js seam. Entering a zone freezes the player, generates ONE question,
// spawns numeric pickups from that SAME question, and clears the zone only when the
// player touches the pickup whose value equals q.answer. Wrong pickups give a brief
// non-punishing visual nudge and leave the challenge open.
//
// ONE-WAY DEPENDENCY: this module imports ../ui/challenge.js DIRECTLY. It NEVER imports
// ../ui/mathGate.js. The arrow is collect.js -> challenge.js, full stop.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): `vec2`, `destroy`, and `get` are referenced ONLY
// inside the exported function body, after kaplay({ global }) runs. mechanics/ is one
// directory below src/, so sibling imports use `../`.
//
// CRITICAL CONTRACT: the question used for the prompt overlay and the values placed on
// pickups are the EXACT SAME `q` object. There is NO punishment path: wrong pickups do
// NOT reset position, reduce progress, end the run, or close the overlay.

import { openChallenge } from "../ui/challenge.js";
import { CONFIG } from "../config.js";
import * as fx from "../fx.js";

/**
 * Wire the player to "answer-zone" triggers and "answer-pickup-slot" entities.
 *
 * @param {object} args
 * @param {GameObj} args.player  the player entity (must be pausable + have onCollide).
 * @param {object} args.brain    the scene's math brain; passed straight to openChallenge.
 */
export function wireCollect({ player, brain }) {
  // Fire-once latch keyed by the touched zone object. Closure-local (never module-level)
  // so it is garbage-collected with the scene and cannot leak across replays.
  const cleared = new Set();

  // The currently-open collect challenge, if any — closure-local, single mutable slot
  // (never module-level). ANTI-LEAK: the pickup-collision handler is registered EXACTLY
  // ONCE below (not per zone-open) and reads this instead of closing over a per-open `q`.
  // Registering a fresh player.onCollide("answer-pickup-slot", ...) inside the zone
  // handler (the original shape) would stack a NEW, never-cancelled handler every time an
  // unanswered zone is re-touched (walk in, walk away, walk back in — onCollide fires once
  // per touch-session, confirmed from the Kaplay source, so re-entry genuinely re-fires
  // the outer handler): each stacked handler independently calls brain.reportResult() and
  // challenge.close() on every future pickup touch, skewing accuracy tracking and stacking
  // duplicate overlay objects. One handler + one mutable `active` slot has no such leak.
  let active = null; // { zoneObj, q, challenge }

  player.onCollide("answer-zone", (zoneObj) => {
    if (cleared.has(zoneObj)) return;
    if (active && active.zoneObj === zoneObj) return; // already open for this zone

    // CRITICAL: unlike door/gates/enemy, this mechanic's ONLY resolution path is walking
    // into the correct pickup — so the player must NOT be frozen. `player.paused = true`
    // halts BOTH onUpdate (movement) and onCollide (Kaplay's collision spatial-hash
    // explicitly skips paused objects as self or partner) — pausing here would make the
    // pickups permanently unreachable, soft-locking the player the instant they touch the
    // zone (found via headless playtest: player.pos was provably frozen and unable to
    // reach any pickup). Movement and collision stay fully live through this challenge.

    // Generate the question ONCE and use the same object for both the prompt and pickups.
    const q = brain.nextQuestion();
    const shuffledChoices = shuffle([...q.choices]);

    // Activate the slot objects owned by this zone.
    for (let i = 0; i < zoneObj.slots.length; i++) {
      const slotIdx = zoneObj.slots[i];
      const slotObj = get("answer-pickup-slot").find((s) => s.slotIndex === slotIdx);
      if (!slotObj) continue;

      slotObj.value = shuffledChoices[i];
      slotObj.opacity = 1;

      // Numeric label centered on the pickup. Explicit color is load-bearing: without it,
      // the label defaults to the SAME engine fill as the (also previously uncolored)
      // badge rect, rendering the number invisible against its own background.
      slotObj.labelObj = add([
        text(String(slotObj.value), { size: CONFIG.COLLECT.PICKUP_SIZE }),
        anchor("center"),
        pos(slotObj.pos.x + CONFIG.COLLECT.PICKUP_W / 2, slotObj.pos.y + CONFIG.COLLECT.PICKUP_H / 2),
        color(...CONFIG.COLLECT.PICKUP_FG),
        "answer-pickup-label",
      ]);
    }

    // Open a prompt-only challenge (no answer boxes). The caller closes it on correct pickup.
    const challenge = openChallenge({
      brain,
      question: q,
      renderChoices: false,
      prompt: `Collect the answer to ${q.a} × ${q.b}`,
    });

    active = { zoneObj, q, challenge };
  });

  // Pickup collision: registered ONCE for the scene's lifetime. Reads `active` (set above)
  // instead of a per-open closure, so no handler ever stacks across zone re-entries.
  player.onCollide("answer-pickup-slot", (slotObj) => {
    if (!active || slotObj.value === undefined) return;

    const { zoneObj, q, challenge } = active;
    const correct = slotObj.value === q.answer;
    brain.reportResult(q.a, correct);

    if (correct) {
      cleared.add(zoneObj);
      challenge.close();
      destroyPickups(zoneObj);
      active = null;
    } else {
      // Brief, non-punishing visual nudge. The challenge stays open, the player keeps
      // moving freely, and the pickups remain available until the correct answer is chosen.
      fx.pop(slotObj.pos.clone());
    }
  });

  /**
   * Destroy all pickups and labels belonging to a cleared zone.
   */
  function destroyPickups(zoneObj) {
    for (const slotObj of get("answer-pickup-slot")) {
      if (!zoneObj.slots.includes(slotObj.slotIndex)) continue;
      if (slotObj.labelObj) destroy(slotObj.labelObj);
      slotObj.value = undefined;
      destroy(slotObj);
    }
  }

  /**
   * Fisher-Yates uniform shuffle (in-place copy).
   */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
