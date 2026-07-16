// src/mechanics/key.js — the key/lock mechanic (KEY-01; Phase 34.5).
//
// The game's FIRST non-math gate. This module wires BOTH halves in one call:
// the KEY half (a walk-through pickup, secretAlcove-style) and the LOCK half
// (a solid barrier, door.js-style MINUS the math challenge). This is a NEW
// barrier layered on top of the existing math density (3 challenges/level is
// LOCKED — see 34.5-CONTEXT.md); the lock never opens the shared challenge
// seam and never freezes the player.
//
// KEY HALF — mirrors src/mechanics/secretAlcove.js: closure-local fire-once
// Set latch, fx/audio feedback triad, destroy LAST. Unlike the alcove, key-held
// is scene RUN-STATE (never persisted — no progress.* calls here at all).
//
// LOCK HALF — mirrors src/mechanics/door.js MINUS the freeze machinery: no
// `busy` re-entrancy guard, no player.paused/vel zeroing, no openChallenge().
// The lock is a wall, not a math gate. On a key-held collide it destroys the
// collider + panel BEFORE the next frame (door.js:74-79 ordering) so the same
// touch cannot re-block. On a keyless collide it shows a brief, non-blocking
// hint that self-cleans via tween().onEnd() — NEVER a setTimeout/wait()/loop()
// (banned by check-safety.sh). NO damage, NO bounce-back, NO reset, NO
// game-over (CONTEXT-locked: the remedy is always "go back and get it").
//
// ENGINE-GLOBAL DISCIPLINE (a727c13): `destroy`, `add`, `text`, `anchor`, `pos`,
// `center`, `color`, `fixed`, `z`, `opacity`, `tween`, `easings` are referenced
// ONLY inside the exported wireKey() body, after kaplay({ global }) runs.
// mechanics/ is one directory below src/, so sibling imports use `../`.

import { CONFIG } from "../config.js";
import * as fx from "../fx.js";
import * as audio from "../audio.js";

/**
 * Wire the player to every "key"/"lock"-tagged entity created by buildLevel().
 *
 * A single call handles ALL keys and ALL locks (Kaplay's onCollide passes the
 * specific touched object as the callback argument, same idiom as every other
 * mechanic in this directory).
 *
 * @param {object} args
 * @param {GameObj} args.player      the player entity (must have onCollide).
 * @param {object} args.hud          the scene's HUD controller — must expose showKey().
 * @param {(keyId: string|null) => void} args.onPickup called once per distinct key
 *   entity touched (`collected` is fire-once PER key, not fire-once overall); the
 *   scene records the touched key's id (build.js's `keyObj.keyId`, or null for the
 *   common no-id single-pair case) into its closure-local held-keys run-state
 *   (never serialized). WR-01: threading the id lets a future multi-lock level
 *   distinguish which key was picked up.
 * @param {(keyId: string|null) => boolean} args.hasKey reads the scene's held-keys
 *   run-state for the SPECIFIC keyId the collided lock carries (null for the
 *   common no-id case, which behaves as one shared default so a single key-lock
 *   pair works exactly as before); the lock branch decides open-vs-hint from this.
 */
export function wireKey({ player, hud, onPickup, hasKey }) {
  // --- KEY half (mirror secretAlcove.js:47) ---
  // Fire-once latch keyed by the touched key object. Closure-local (never
  // module-level) so it is garbage-collected with the scene and cannot leak
  // across replays — same anti-leak discipline as every other mechanic here.
  const collected = new Set();

  player.onCollide("key", (keyObj) => {
    if (collected.has(keyObj)) return;
    collected.add(keyObj);

    // WR-01: pass this key's own id (or null) so the scene can track held keys
    // per-id rather than as one undifferentiated boolean.
    onPickup(keyObj.keyId ?? null);
    hud.showKey(); // persistent HUD "key held" indicator

    // Discovery feedback (burst + chime + rising popup) — mirrors secretAlcove.js's
    // triad. Clone .pos BEFORE destroy (keyObj is about to be destroyed).
    fx.pop(keyObj.pos.clone());
    fx.popupText(keyObj.pos.clone(), CONFIG.KEY.PICKUP_LABEL);
    audio.playSfx("pickup"); // reuse the existing pickup sfx — no new asset

    destroy(keyObj); // destroy LAST
  });

  // --- LOCK half (mirror door.js:38-86 MINUS the freeze machinery) ---
  // Fire-once latch for the open path, closure-local (never module-level) —
  // same GC-with-the-scene reasoning as `collected` above and door.js's `opened`.
  const opened = new Set();

  // Closure-local, no-timer fire-once gate for the hint: onCollide fires every
  // overlap frame while the player leans on the wall; without this a naive hint
  // would stack dozens of text objects. Cleared ONLY by the hint's own
  // tween().onEnd() (Pitfall 3 / check-safety.sh's no-timer mandate).
  let hintShowing = false;

  player.onCollide("lock", (lockObj) => {
    if (opened.has(lockObj)) return;

    // WR-01: check the SPECIFIC keyId this lock requires (null for the common
    // no-id single-pair case), not just "any key held at all".
    if (hasKey(lockObj.keyId ?? null)) {
      opened.add(lockObj);
      audio.playSfx("door"); // reuse the existing door sfx — no new asset
      fx.clearBurst(); // optional celebratory beat (door.js precedent)

      // Destroy collider + panel BEFORE the next frame so the same touch cannot
      // re-block (door.js:74-79 ordering, load-bearing).
      destroy(lockObj);
      if (lockObj.panelObj) destroy(lockObj.panelObj);
      return;
    }

    // No key: the solid wall stays. Show a brief, non-blocking hint — NO pause,
    // NO challenge, NO damage/bounce/reset/game-over (CONTEXT-locked).
    if (hintShowing) return;
    hintShowing = true;

    const hint = add([
      text(CONFIG.LOCK.HINT_TEXT, { size: CONFIG.LOCK.HINT_SIZE }),
      anchor("center"),
      pos(center().x, CONFIG.LOCK.HINT_Y),
      color(CONFIG.PALETTE.TEXT[0], CONFIG.PALETTE.TEXT[1], CONFIG.PALETTE.TEXT[2]),
      fixed(),
      z(9200),
      opacity(1),
      "hud-flash", // torn down on scene leave (anti-leak, mirrors flashLevelUp)
    ]);

    // Self-cleaning fade — the ONLY dismissal path (no setTimeout/wait()/loop()/
    // lifespan(), banned by check-safety.sh).
    tween(1, 0, CONFIG.LOCK.HINT_MS / 1000, (v) => (hint.opacity = v), easings.easeOutQuad).onEnd(
      () => {
        destroy(hint);
        hintShowing = false;
      },
    );
  });
}
