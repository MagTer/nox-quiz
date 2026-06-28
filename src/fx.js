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
// statement that touches a name is `import { CONFIG } from "./config.js"` (plus the
// plain ACCENT_GREEN array literal, which is just data — no engine call). Every
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

// Dark-grunge neon-green accent (reused verbatim from src/ui/hud.js:36). A plain
// array literal — data only, no engine call — so it is safe at module top level.
const ACCENT_GREEN = [0x00, 0xff, 0x88]; // pop + clear burst (NO pink anywhere)

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

  // Snap to the pose, then ease each axis back to neutral 1 over ms.
  obj.scaleTo(sx, sy);
  tween(
    0,
    1,
    ms / 1000,
    (v) => obj.scaleTo(sx + (1 - sx) * v, sy + (1 - sy) * v),
    easings.easeOutQuad,
  );
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
 * A quick neon-green scale-pop + fade at `at` (world-space), then self-destroy.
 *
 * Fired on coin collect at the coin's spot — coins stay count-only, so there is NO
 * "+1" / text, just a brief mark. One smooth easeOutQuad fade: scale grows 1 ->
 * POP_SCALE while opacity fades 1 -> 0 over POP_MS, then .onEnd(destroy). Tagged "fx".
 *
 * @param {Vec2} at  the coin's position (pass a .clone() — the coin is destroyed right after).
 */
export function pop(at) {
  const F = CONFIG.FX;

  const marker = add([
    rect(F.POP_SIZE, F.POP_SIZE), // dedicated pop footprint — decoupled from DUST_SIZE (IN-02)
    pos(at.x, at.y),
    color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]), // neon-green
    opacity(1),
    anchor("center"),
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
      marker.scaleTo(s, s);
      marker.opacity = 1 - v;
    },
    easings.easeOutQuad,
  ).onEnd(() => destroy(marker));
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
    color(ACCENT_GREEN[0], ACCENT_GREEN[1], ACCENT_GREEN[2]), // neon-green
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
