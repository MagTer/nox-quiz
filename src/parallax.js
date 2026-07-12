// src/parallax.js — camera-driven parallax background helpers (Phase 18 ART-03).
//
// Builds three horizontally tiled background layers and updates their positions
// from the camera X coordinate. No timers, no tweens, no auto-scroll — motion is
// a pure function of getCamPos().x.
//
// Engine globals (add, sprite, pos, z, width, destroyAll) are referenced ONLY
// inside function bodies (a727c13). The module imports nothing but CONFIG.

import { CONFIG } from "./config.js";

/**
 * Build one tiled parallax layer.
 *
 * Vertically the layer is SCREEN-locked (updateParallaxLayers repositions it
 * from the camera Y every frame): `screenY` is a viewport-space y. The far
 * plate (full 640x360 bake) anchors its top edge at screenY 0 so it covers the
 * whole view at any camera height (levels 07/08 climb 360px above the floor —
 * a floor-anchored strip would leave raw #0a0a0a clear color there, the
 * "black mess" class of bug). Mid/near feature layers anchor their BOTTOM at
 * screenY height(), the same bottom-at-360 alignment styleboard.py's tile_x
 * uses for every approved board scene (terrain covers the lowest band, like
 * the boards' own tile rows).
 *
 * @param {string} name - sprite name (e.g. "bg-far")
 * @param {object} bounds - level bounds with left/right
 * @param {number} ratio - parallax scroll ratio (0 = camera-locked, 1 = world-locked)
 * @param {number} zLayer - z-order for this layer
 * @param {number} screenY - viewport-space y for the anchored edge
 * @param {boolean} bottomAnchored - true anchors the sprite's bottom edge at screenY
 * @returns {GameObj[]} array of layer sprite instances
 */
function makeParallaxLayer(name, bounds, ratio, zLayer, screenY, bottomAnchored) {
  const levelWidth = bounds.right - bounds.left;
  const count = Math.ceil((levelWidth + width() * 2) / width()) + 1;
  const instances = [];
  for (let i = 0; i < count; i++) {
    instances.push(
      add([
        sprite(name),
        pos(bounds.left - width() + i * width(), screenY),
        anchor(bottomAnchored ? "botleft" : "topleft"),
        z(zLayer),
        "parallax",
        { ratio, screenY },
      ]),
    );
  }
  return instances;
}

/**
 * Build all three parallax layers for a level.
 * @param {object} bounds - level bounds with left/right
 * @param {string} [biome] - level biome id (e.g. "swamp"); falsy -> base untinted layers
 * @returns {{name: string, instances: GameObj[], ratio: number}[]}
 */
export function makeParallaxLayers(bounds, biome) {
  const P = CONFIG.PARALLAX;
  // Per-key defaulting, same idiom as camera.js: game.js's whole-object fallback
  // (`level.bounds ?? {...}`) does NOT default individual missing keys, so a future
  // descriptor carrying a PARTIAL bounds object (e.g. { left } without right) reaches
  // here as-is and `bounds.right - bounds.left` goes NaN -> tile count NaN -> the
  // build loop never runs -> ZERO layer instances (silently invisible background,
  // bug-pattern #10 class). Probe-proven in 22-FINDINGS.md Finding 12; inert today
  // because game.js always passes a complete bounds object for shipped descriptors.
  const safeBounds = {
    left: bounds?.left ?? CONFIG.LEVEL_LEFT,
    right: bounds?.right ?? CONFIG.LEVEL_RIGHT,
  };
  // Biome-templated sprite-name helper (ART-03; Phase 32 Plan 04), same per-key-
  // defaulting spirit as safeBounds above: biome absent means the base untinted
  // layer set, never a crash.
  const layerName = (base) => (biome ? `${base}-${biome}` : base);
  return [
    {
      name: layerName("bg-far"),
      instances: makeParallaxLayer(
        layerName("bg-far"),
        safeBounds,
        P.FAR_RATIO,
        P.FAR_Z,
        0, // full-viewport plate: top edge at the view top
        false,
      ),
      ratio: P.FAR_RATIO,
    },
    {
      name: layerName("bg-mid"),
      instances: makeParallaxLayer(
        layerName("bg-mid"),
        safeBounds,
        P.MID_RATIO,
        P.MID_Z,
        height(), // feature layer: bottom edge at the view bottom (board alignment)
        true,
      ),
      ratio: P.MID_RATIO,
    },
    {
      name: layerName("bg-near"),
      instances: makeParallaxLayer(
        layerName("bg-near"),
        safeBounds,
        P.NEAR_RATIO,
        P.NEAR_Z,
        height(),
        true,
      ),
      ratio: P.NEAR_RATIO,
    },
  ];
}

/**
 * Update parallax layer positions from the current camera X.
 * @param {{name: string, instances: GameObj[], ratio: number}[]} layers
 * @param {number} camX
 * @param {object} bounds
 */
export function updateParallaxLayers(layers, camX, bounds) {
  // Same per-key defaulting as makeParallaxLayers above: a partial bounds object
  // missing `left` would otherwise write NaN into every instance's pos.x each frame
  // (silently invisible layers). Inert today — game.js always passes a complete object.
  const left = bounds?.left ?? CONFIG.LEVEL_LEFT;
  // Vertical: layers are screen-locked (see makeParallaxLayer). viewTop + screenY
  // keeps the far plate covering the viewport when the camera climbs (levels
  // 07/08 bounds.top -360); for levels whose camera Y is clamped fixed (01-06,
  // top 0 / bottom 360) this is byte-identical to the old static placement.
  const viewTop = getCamPos().y - height() / 2;
  const viewLeft = camX - width() / 2;
  for (const layer of layers) {
    for (let i = 0; i < layer.instances.length; i++) {
      const inst = layer.instances[i];
      inst.pos.x = left - width() + i * width() + camX * (1 - inst.ratio);
      inst.pos.y = viewTop + inst.screenY;
      // Cull tiles fully outside the view: the full-viewport far plates are 3x
      // the old strips' pixel area, and without this every tile across the
      // whole level width is drawn each frame (measured ~44fps vs the 45
      // browser-boot floor on the headless-Chromium rig; hidden skips draw).
      inst.hidden = inst.pos.x + width() < viewLeft || inst.pos.x > viewLeft + width();
    }
  }
}
