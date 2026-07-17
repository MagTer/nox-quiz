// src/ui/mathGate.js — thin wrapper preserving the end-of-level math-gate contract.
//
// The interactive overlay itself now lives in ./challenge.js. This file's ONLY job is to
// keep the pre-existing openMathGate({ brain, onClear }) public contract alive for
// src/scenes/game.js's end-of-level call site and to OWN the end-of-level-specific
// "LEVEL CLEAR" celebration banner (renderLevelClearBanner) that is inappropriate for a
// generic challenge component.
//
// WR-02 (Phase 34.6): the banner + clear sfx are now a single exported helper
// (renderLevelClearBanner) invoked from the scene's shared clearLevel() path so BOTH the
// math path and the key-skip path render the clear moment from ONE source and can never
// drift. openMathGate's onSuccess no longer renders the banner itself — it just fires
// onClear, which (via clearLevel) renders the banner exactly once.
//
// ENGINE-GLOBAL DISCIPLINE (mirror src/scenes/game.js 14-17): Kaplay primitives
// (add, text, rect, color, opacity, anchor, pos, fixed, z, center, width, height)
// come from Kaplay `global: true`. They are used as bare globals inside the exported
// function body only — they are NOT imported.

import { openChallenge } from "./challenge.js";
import { CONFIG } from "../config.js"; // banner dim opacity + CONFIG.PALETTE.REWARD (VIS-01)
import * as audio from "../audio.js"; // audio.js lives in src/, mathGate.js in src/ui/ — sibling of config.js, not challenge.js

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
 *   Level-clear hook invoked EXACTLY once on a correct answer. The shared clearLevel()
 *   this resolves to renders the "LEVEL CLEAR" celebration (renderLevelClearBanner) itself,
 *   so onSuccess no longer renders it here (WR-02) — otherwise it would double-render.
 */
export function openMathGate({ brain, onClear } = {}) {
  openChallenge({
    brain,
    onSuccess({ table }) {
      // WR-02: the banner + clear sfx are NOT rendered here anymore. onClear resolves to
      // the scene's clearLevel(), which calls renderLevelClearBanner() below exactly once,
      // so the math path and the key-skip path share ONE clear presentation.
      onClear?.({ table }); // carry the cleared table (q.a) so the scene awards its XP
    },
  });
}

/**
 * Render the persistent end-of-level "LEVEL CLEAR" celebration banner + clear sfx.
 *
 * The SINGLE source of the clear-moment presentation (WR-02, Phase 34.6): invoked once
 * from the scene's shared clearLevel() path, so BOTH the math path and the key-skip path
 * render an identical banner and can never drift. Tagged "gate-cleared" so it survives
 * challenge.js's close() destroyAll(instanceTag) (a different tag) and is torn down with
 * the scene on the clear->select transition. Magic numbers live in CONFIG.GATE (WR-02).
 */
export function renderLevelClearBanner() {
  // Persistent neon-green clear panel behind the banner (re-asserts the dim backdrop
  // so the cleared level reads as "done", not blank).
  add([
    rect(width(), height()),
    pos(0, 0),
    color(0, 0, 0),
    opacity(CONFIG.GATE.DIM_OPACITY),
    fixed(),
    z(CONFIG.GATE.CLEAR_DIM_Z),
    "gate-cleared",
  ]);
  add([
    text("LEVEL CLEAR", { size: CONFIG.GATE.CLEAR_TEXT_SIZE }),
    anchor("center"),
    pos(center().x, center().y),
    color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]),
    fixed(),
    z(CONFIG.GATE.CLEAR_TEXT_Z),
    "gate-cleared",
  ]);

  audio.playSfx("clear", CONFIG.AUDIO.CLEAR_VOLUME);
}
