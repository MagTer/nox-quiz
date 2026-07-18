// src/mechanics/secretAlcove.js — secret-alcove XP-bonus mechanic (LVL-06).
//
// This module wires the "secret-alcove" tagged walk-through area() entities created by
// src/levels/build.js onto the player. Unlike every other mechanic in this directory,
// touching an alcove NEVER pauses the player and NEVER opens a challenge — it is a
// silent, flat XP bonus (CONFIG.PROGRESS.XP_ALCOVE) awarded exactly once per LEVEL
// (not per alcove object — see progress.hasSecretFound/markSecretFound below), deliberately
// below XP_EASY so it reads as a bonus, not a shortcut. If a level ever authors more than one
// secretAlcove entry, only the first one touched pays out; author accordingly.
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): `destroy` is referenced ONLY inside the exported
// function body, after kaplay({ global }) runs. mechanics/ is one directory below src/,
// so the config import below is `../config.js`.
//
// CRITICAL CONTRACT: this never opens the shared math-challenge UI and never freezes
// the player (no pause flag, no velocity zeroing) — this is a walk-through bonus
// (ADHD-safe: never an interruption).

import { CONFIG } from "../config.js";
import * as fx from "../fx.js";
import * as audio from "../audio.js";

/**
 * Wire the player to every "secret-alcove"-tagged entity created by buildLevel().
 *
 * @param {object} args
 * @param {GameObj} args.player    the player entity (must have onCollide).
 * @param {object} args.progress   the scene's progression tracker (addBonusXp, markSecretFound).
 * @param {object} args.hud        the scene's HUD controller ({ refresh, flashLevelUp }) —
 *   mirrors the goal's own "one-way HUD update, then flash on a level-up" idiom
 *   (game.js's onReachGoal). Without this, addBonusXp silently updates progress's
 *   internal xp/level but the on-screen bar never moves — found via manual playtest:
 *   touching the alcove appeared to do nothing at all.
 * @param {string} args.levelId    the current level's id — threaded through so the
 *   cross-run persisted secretFound fact (MECH-06) is recorded against the right level.
 * @param {() => void} [args.save] optional immediate-persist callback (mirrors game.js's
 *   own `writeSave(progress.serialize(brain.snapshot()))` pattern used on goal-clear and
 *   tab-hide). Called synchronously right after a genuinely NEW secret is recorded so the
 *   discovery survives an Escape-to-select bail, which does not otherwise trigger a save.
 * @param {(alcoveObj: GameObj) => void} [args.onDiscover] optional one-shot hook (MECH-05;
 *   Phase 36) fired EXACTLY ONCE, only in the genuine-NEW-secret branch below, right after
 *   the discovery is recorded + persisted. game.js wires this to lightAmbient() — the
 *   persistent, positive-only ambient change (a linked dark light brightens for the rest of
 *   the run). It is NOT fired in the already-found replay branch: that path's lit state is
 *   DERIVED on scene entry from progress.hasSecretFound (game.js), never re-fired here. This
 *   never opens a challenge and never freezes the player — the walk-through contract stands.
 */
export function wireSecretAlcove({ player, progress, hud, levelId, save, onDiscover }) {
  // Fire-once latch keyed by the touched alcove object. Closure-local (never
  // module-level) so it is garbage-collected with the scene and cannot leak across
  // replays — same anti-leak discipline as enemy.js's `defeated` Set. This is the
  // IN-RUN feedback latch (fires once per scene instance); distinct from the
  // cross-run persisted secretFound fact recorded below via progress.markSecretFound.
  const found = new Set();

  player.onCollide("secret-alcove", (alcoveObj) => {
    if (found.has(alcoveObj)) return;
    found.add(alcoveObj);

    // CR-01 guard: the in-run `found` Set above only stops a double-award within the
    // SAME scene instance. Without checking the cross-run persisted fact too, replaying
    // an already-cleared level (levels stay selectable after clear — select.js) and
    // touching the alcove again would re-award XP_ALCOVE indefinitely. If it was already
    // earned in a prior playthrough, still play the discovery feedback (a replay should
    // feel rewarding, not silently do nothing) but never re-award XP or re-persist.
    if (progress.hasSecretFound(levelId)) {
      fx.pop(alcoveObj.pos.clone());
      audio.playSfx("pickup");
      destroy(alcoveObj);
      return;
    }

    const leveledUp = progress.addBonusXp(CONFIG.PROGRESS.XP_ALCOVE);
    hud.refresh();
    if (leveledUp) hud.flashLevelUp();

    // MECH-03/MECH-06: discovery feedback (burst + chime + rising popup) plus the
    // cross-run persisted marker, keyed by the level this alcove belongs to. Clone
    // .pos before the object is destroyed, mirroring game.js's own coin-collision
    // handler convention (fx.pop(c.pos.clone()); destroy(c);).
    progress.markSecretFound(levelId);

    // CR-02: persist immediately, mirroring the goal-clear save pattern. Escape back to
    // level-select (NAV-03) is a fully supported bail path that does NOT otherwise save
    // (only goal-clear and tab-hide call writeSave in game.js) — without this call, a
    // secret found and then Escaped away from is silently lost: select.js re-reads
    // createProgress(loadSave()) fresh on every entry, so the star marker would never
    // appear even though the alcove was genuinely touched.
    if (save) save();

    // MECH-05 (Phase 36): fire the persistent-ambient hook EXACTLY ONCE, ONLY here in the
    // genuine-NEW-secret branch (never the already-found replay branch above — that path
    // derives its lit state on scene entry from progress.hasSecretFound). Positive-only
    // visual side effect (game.js brightens a linked dark light); the CRITICAL CONTRACT is
    // intact — this opens no challenge and never freezes the player.
    if (onDiscover) onDiscover(alcoveObj);

    fx.pop(alcoveObj.pos.clone());
    fx.popupText(alcoveObj.pos.clone(), "+5 XP");
    audio.playSfx("pickup");

    destroy(alcoveObj);
  });
}
