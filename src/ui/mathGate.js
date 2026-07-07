// src/ui/mathGate.js — thin wrapper preserving the end-of-level math-gate contract.
//
// The interactive overlay itself now lives in ./challenge.js. This file's ONLY job is to
// keep the pre-existing openMathGate({ brain, onClear }) public contract alive for
// src/scenes/game.js's end-of-level call site and to render the end-of-level-specific
// "LEVEL CLEAR" celebration banner that is inappropriate for a generic challenge component.
//
// ENGINE-GLOBAL DISCIPLINE (mirror src/scenes/game.js 14-17): Kaplay primitives
// (add, text, rect, color, opacity, anchor, pos, fixed, z, center, width, height)
// come from Kaplay `global: true`. They are used as bare globals inside the exported
// function body only — they are NOT imported.

import { openChallenge } from "./challenge.js";
import { CONFIG } from "../config.js"; // banner dim opacity + CONFIG.PALETTE.REWARD (VIS-01)

/**
 * Open the end-of-level math gate over the (already paused) level.
 *
 * This signature is byte-identical to the pre-extraction API: game.js calls
 * openMathGate({ brain, onClear({ table }) {...} }) with zero changes.
 *
 * @param {object} args
 * @param {{ nextQuestion: Function, reportResult: Function }} args.brain
 *   The math brain instance supplied by the scene.
 * @param {(payload: { table: number }) => void} args.onClear
 *   Level-clear hook invoked EXACTLY once on a correct answer, after the persistent
 *   "LEVEL CLEAR" celebration has been rendered.
 */
export function openMathGate({ brain, onClear } = {}) {
  openChallenge({
    brain,
    onSuccess({ table }) {
      // Persistent neon-green clear panel behind the banner (re-asserts the dim backdrop
      // so the cleared level reads as "done", not blank). Tagged "gate-cleared" (survives
      // challenge.js's close() destroyAll("challenge") because it uses a different tag).
      add([
        rect(width(), height()),
        pos(0, 0),
        color(0, 0, 0),
        opacity(CONFIG.GATE.DIM_OPACITY),
        fixed(),
        z(9990),
        "gate-cleared",
      ]);
      add([
        text("LEVEL CLEAR", { size: 30 }),
        anchor("center"),
        pos(center().x, center().y),
        color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]),
        fixed(),
        z(9994),
        "gate-cleared",
      ]);

      onClear?.({ table }); // carry the cleared table (q.a) so the scene awards its XP
    },
  });
}
