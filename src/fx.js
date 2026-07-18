// src/fx.js — the engine-side juice layer (JUICE-01/02/03).
//
// Four tiny, self-cleaning visual effects — squash/stretch on the player, a few
// dust particles on landing, a coin-collect pop, and a level-clear burst — each
// built from the ONE proven in-repo idiom (src/ui/hud.js flashLevelUp 117-123 /
// src/scenes/game.js reset 107): an add([... "fx"]) transient that animates with
// tween(...) and removes itself on .onEnd(() => destroy(obj)). No new animation
// mechanism per effect. The juice language is locked: subtle, brief, NON-STROBING,
// dark-grunge grey dust + neon-green pop/burst, NO pink.
//
// ENGINE-GLOBAL DISCIPLINE — a727c13 LESSON (HARD): this module's ONLY top-level
// statement that touches a name is `import { CONFIG } from "./config.js"`. Every
// Kaplay global (add, tween, rect, pos, color, opacity, anchor, z, scale, vec2,
// destroy, easings, fixed, center) is used ONLY INSIDE the exported function bodies.
// Imports are hoisted and run BEFORE main.js calls kaplay({ global: true }), so a
// top-level engine reference — or even a `typeof tween` guard at module scope —
// throws at import time and blanks the whole game (this is the exact bug that bit
// level.js). Keep all engine use inside the functions. fx.js lives at src/, so the
// sibling config import is `./config.js` (NOT `../config.js`).
//
// NO TIMER (SAFE-01): self-clean via tween().onEnd(destroy) ONLY. There is NO
// setTimeout / setInterval and NO Kaplay lifespan() / wait() / loop() scheduler
// anywhere here — scripts/check-safety.sh enforces this across all of src/.
//
// IN-WORLD, NOT THE DOM (CLAUDE.md canon): every visual is a Kaplay canvas object
// (rect()) — no innerHTML / document.* / markup-string sink, so no injection path.
//
// ANTI-LEAK: every transient is tagged "fx" and self-destroys on .onEnd, so a scene
// replay / respawn (and the optional onSceneLeave(destroyAll("fx")) sweep in
// game.js) wipes any in-flight effect. There is NO module-level mutable state.

import { CONFIG } from "./config.js"; // FX tuning constants — the only non-engine import

// Dark-grunge neon-green accent, read from CONFIG.PALETTE.REWARD (VIS-01; Phase 26
// Plan 01) — pop + clear burst (NO pink anywhere).

/**
 * Squash/stretch the player via its scale() comp, then snap back to neutral (1,1).
 *
 * Default (landing) = squash: snap WIDER + SHORTER (SQUASH_X/SQUASH_Y) then ease back.
 * dir === "jump" = stretch: snap NARROWER + TALLER (STRETCH_X/STRETCH_Y) then ease back.
 *
 * One smooth easeOutQuad fade per call (NOT easeOutBack/Elastic — those read bouncy /
 * over-stimulating). The tween drives a 0->1 progress `v`; the scale interpolates from
 * the snapped pose back to (1,1) as `from + (1 - from) * v`. The player object persists,
 * so there is nothing to destroy — the tween simply restores neutral and ends.
 *
 * @param {GameObj} obj  the player entity (must have a scale() comp).
 * @param {"land"|"jump"} [dir="land"]  which pose to snap to before settling.
 */
export function squash(obj, dir = "land") {
  const F = CONFIG.FX;
  const sx = dir === "jump" ? F.STRETCH_X : F.SQUASH_X;
  const sy = dir === "jump" ? F.STRETCH_Y : F.SQUASH_Y;
  const ms = dir === "jump" ? F.STRETCH_MS : F.SQUASH_MS;

  // SINGLE-FLIGHT (WR-02): cancel any in-flight squash/stretch tween before starting a
  // new one. Without this, a jump→land within the settle window runs two scale tweens
  // concurrently — they compute from different poses and the last writer each frame wins,
  // so the on-screen scale jitters (a flicker that undercuts the SAFE-03 non-strobe goal).
  // The handle lives ON the obj (no module-level state — anti-leak). The replacement tween
  // always ends at (1,1), so an interrupted settle still resolves to neutral.
  if (obj._fxScaleTween) obj._fxScaleTween.cancel();

  // Snap to the pose, then ease each axis back to neutral 1 over ms.
  obj.scaleTo(sx, sy);
  obj._fxScaleTween = tween(
    0,
    1,
    ms / 1000,
    (v) => obj.scaleTo(sx + (1 - sx) * v, sy + (1 - sy) * v),
    easings.easeOutQuad,
  );
  // Clear the handle once it settles so a later call never cancels a finished tween.
  obj._fxScaleTween.onEnd(() => {
    obj._fxScaleTween = null;
  });
}

/**
 * Stretch on jump — a thin alias for squash(obj, "jump") so the call site reads clearly.
 *
 * @param {GameObj} obj  the player entity (must have a scale() comp).
 */
export function stretch(obj) {
  squash(obj, "jump");
}

/**
 * Kick up a few short-lived grunge-grey dust particles at `at` (world-space).
 *
 * Each particle is a small grey rect that rises (pos.y up by DUST_RISE), drifts out
 * (pos.x by a symmetric spread), and fades (opacity -> 0) over DUST_MS, then self-
 * destroys on .onEnd(destroy). One smooth easeOutQuad fade — no strobe. Tagged "fx".
 *
 * @param {Vec2} at  the landing position (typically player.pos). World-space; no fixed().
 */
export function dust(at) {
  const F = CONFIG.FX;
  const half = (F.DUST_COUNT - 1) / 2; // center the spread around `at`

  for (let i = 0; i < F.DUST_COUNT; i++) {
    const startX = at.x;
    const startY = at.y;
    // Symmetric horizontal drift: leftmost negative, rightmost positive.
    const driftX = (i - half) * F.DUST_SPREAD;

    const p = add([
      rect(F.DUST_SIZE, F.DUST_SIZE),
      pos(startX, startY),
      color(0x88, 0x88, 0x88), // grunge grey — NO pink
      opacity(1),
      anchor("center"),
      z(50),
      "fx",
    ]);

    // Drive 0->1 progress; rise + drift + fade together, destroy on end.
    tween(
      0,
      1,
      F.DUST_MS / 1000,
      (v) => {
        p.pos.x = startX + driftX * v;
        p.pos.y = startY - F.DUST_RISE * v;
        p.opacity = 1 - v;
      },
      easings.easeOutQuad,
    ).onEnd(() => destroy(p));
  }
}

/**
 * A world-space rising/fading text popup at `at` (typically an alcove's position), then
 * self-destroy. Mirrors dust()'s rise/fade tween idiom exactly, using a text() label
 * instead of a rect(). World-space (NO fixed()) — this floats at `at` and scrolls with
 * the camera, unlike the HUD's screen-space "LEVEL UP" banner (src/ui/hud.js). One smooth
 * easeOutQuad fade — no strobe. Tagged "fx" so it is swept by game.js's destroyAll("fx")
 * on scene leave, same as every other effect in this file.
 *
 * @param {Vec2} at  the world position to float up from (pass a .clone() if the source
 *   entity is about to be destroyed).
 * @param {string} label  the text to display, e.g. "+5 XP".
 */
export function popupText(at, label) {
  const F = CONFIG.FX;

  const marker = add([
    text(label, { size: F.XP_POPUP_SIZE }),
    pos(at.x, at.y),
    anchor("center"),
    color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]), // neon-green
    opacity(1),
    z(60),
    "fx",
  ]);

  const startY = at.y;
  tween(
    0,
    1,
    F.XP_POPUP_MS / 1000,
    (v) => {
      marker.pos.y = startY - F.XP_POPUP_RISE * v;
      marker.opacity = 1 - v;
    },
    easings.easeOutQuad,
  ).onEnd(() => destroy(marker));
}

/**
 * A quick neon-green collect twinkle at `at` (world-space), then self-destroy.
 *
 * RESTYLE (Phase 35 Plan 08): the old flat POP_SIZE rect read as a missing-sprite
 * placeholder (2026-07-17 play-test). It is now a dark-grunge "glint": a small
 * 45°-rotated diamond CORE that flashes (scale 1 -> POP_SCALE, opacity 1 -> 0) while
 * a ring of POP_SPARK_COUNT diamond SPARKS flies outward (POP_SPARK_DIST) and fades —
 * a legible collect flourish rather than a solid box. Fired on coin/key/alcove collect
 * at the item's spot — coins stay count-only, so there is NO "+1"/text, just the mark.
 *
 * Every transient is a pure sprite-less rect() with NO area()/body() — visual only, so
 * it can never affect coin counting or add a collider. Each animates with ONE smooth
 * easeOutQuad fade and self-cleans via tween().onEnd(destroy) — no scheduler, no strobe
 * (SAFE-01 / SAFE-03). The diamonds share CONFIG.PALETTE.REWARD (NO pink). Every engine
 * global here is referenced INSIDE this body only (a727c13). Tagged "fx".
 *
 * @param {Vec2} at  the item's position (pass a .clone() — the item is destroyed right after).
 */
export function pop(at) {
  const F = CONFIG.FX;
  const [r, g, b] = CONFIG.PALETTE.REWARD; // dark-grunge reward accent (NO pink)

  // Central glint: a 45°-rotated diamond that flashes bigger + fades once. The rotation
  // is what turns the old axis-aligned "box" into a spark/glint that reads as intentional.
  const core = add([
    rect(F.POP_SIZE, F.POP_SIZE),
    pos(at.x, at.y),
    color(r, g, b),
    opacity(1),
    anchor("center"),
    rotate(45),
    scale(1),
    z(60),
    "fx",
  ]);
  tween(
    0,
    1,
    F.POP_MS / 1000,
    (v) => {
      const s = 1 + (F.POP_SCALE - 1) * v;
      core.scaleTo(s, s);
      core.opacity = 1 - v;
    },
    easings.easeOutQuad,
  ).onEnd(() => destroy(core));

  // Radiating sparks: POP_SPARK_COUNT small diamonds evenly spaced around a ring, each
  // flying outward POP_SPARK_DIST while fading — a brief collect burst. Mirrors dust()'s
  // per-particle rise/fade idiom (multi-particle, each self-cleaning; no scheduler).
  for (let i = 0; i < F.POP_SPARK_COUNT; i++) {
    const ang = (i / F.POP_SPARK_COUNT) * Math.PI * 2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const startX = at.x;
    const startY = at.y;

    const spark = add([
      rect(F.POP_SPARK_SIZE, F.POP_SPARK_SIZE),
      pos(startX, startY),
      color(r, g, b),
      opacity(1),
      anchor("center"),
      rotate(45),
      z(60),
      "fx",
    ]);
    tween(
      0,
      1,
      F.POP_MS / 1000,
      (v) => {
        spark.pos.x = startX + dx * F.POP_SPARK_DIST * v;
        spark.pos.y = startY + dy * F.POP_SPARK_DIST * v;
        spark.opacity = 1 - v;
      },
      easings.easeOutQuad,
    ).onEnd(() => destroy(spark));
  }
}

/**
 * A brief, NON-STROBING neon-green level-clear flourish (JUICE-03).
 *
 * Screen-space (fixed()) celebration LAYERED on the existing LEVEL CLEAR moment — it
 * does NOT replace the gate's "LEVEL CLEAR" banner or hud.flashLevelUp(). A single
 * expanding ring/square that fades ONCE over BURST_MS via easeOutQuad — ONE smooth
 * fade, never a flicker/strobe (SAFE-03 / ADHD-safety) — then .onEnd(destroy).
 * Tagged "fx" so it is swept on replay.
 */
export function clearBurst() {
  const F = CONFIG.FX;

  const burst = add([
    rect(F.BURST_SIZE, F.BURST_SIZE),
    pos(center()),
    color(CONFIG.PALETTE.REWARD[0], CONFIG.PALETTE.REWARD[1], CONFIG.PALETTE.REWARD[2]), // neon-green
    opacity(0.6),
    anchor("center"),
    scale(1),
    fixed(), // screen-space celebration (camera-immune, like the HUD flash)
    // Above the gate-cleared dim (mathGate.js z 9990) so the burst is VISIBLE over the
    // cleared level, but below the "LEVEL CLEAR" banner (z 9994) so it never hides that
    // text. The old z(9400) rendered the burst UNDER the 60%-black dim — invisible (WR-01).
    z(F.BURST_Z),
    "fx",
  ]);

  // One smooth grow + fade: scale 1 -> BURST_GROW while opacity 0.6 -> 0 over BURST_MS, then destroy.
  tween(
    0,
    1,
    F.BURST_MS / 1000,
    (v) => {
      const s = 1 + (F.BURST_GROW - 1) * v;
      burst.scaleTo(s, s);
      burst.opacity = 0.6 * (1 - v);
    },
    easings.easeOutQuad,
  ).onEnd(() => destroy(burst));
}
