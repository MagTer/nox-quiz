// src/mechanics/secretAlcove.js — secret-alcove XP-bonus mechanic (LVL-06).
//
// This module wires the "secret-alcove" tagged walk-through area() entities created by
// src/levels/build.js onto the player. Unlike every other mechanic in this directory,
// touching an alcove NEVER pauses the player and NEVER opens a challenge — it is a
// silent, flat XP bonus (CONFIG.PROGRESS.XP_ALCOVE) awarded exactly once per alcove
// object, deliberately below XP_EASY so it reads as a bonus, not a shortcut.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): `destroy` is referenced ONLY inside the exported
// function body, after kaplay({ global }) runs. mechanics/ is one directory below src/,
// so the config import below is `../config.js`.
//
// CRITICAL CONTRACT: this never opens the shared math-challenge UI and never freezes
// the player (no pause flag, no velocity zeroing) — this is a walk-through bonus
// (ADHD-safe: never an interruption).

import { CONFIG } from "../config.js";

/**
 * Wire the player to every "secret-alcove"-tagged entity created by buildLevel().
 *
 * @param {object} args
 * @param {GameObj} args.player    the player entity (must have onCollide).
 * @param {object} args.progress   the scene's progression tracker (addBonusXp).
 * @param {object} args.hud        the scene's HUD controller ({ refresh, flashLevelUp }) —
 *   mirrors the goal's own "one-way HUD update, then flash on a level-up" idiom
 *   (game.js's onReachGoal). Without this, addBonusXp silently updates progress's
 *   internal xp/level but the on-screen bar never moves — found via manual playtest:
 *   touching the alcove appeared to do nothing at all.
 */
export function wireSecretAlcove({ player, progress, hud }) {
  // Fire-once latch keyed by the touched alcove object. Closure-local (never
  // module-level) so it is garbage-collected with the scene and cannot leak across
  // replays — same anti-leak discipline as enemy.js's `defeated` Set.
  const found = new Set();

  player.onCollide("secret-alcove", (alcoveObj) => {
    if (found.has(alcoveObj)) return;
    found.add(alcoveObj);
    const leveledUp = progress.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE);
    hud.refresh();
    if (leveledUp) hud.flashLevelUp();
    destroy(alcoveObj);
  });
}
