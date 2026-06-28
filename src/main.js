// src/main.js — Math Lab v3.0 game shell (Phase 8 platformer boot)
//
// Imports the vendored Kaplay engine (relative to src/, so the same path
// resolves under the dev server and inside the nginx container), initializes
// it, and boots the real platformer test-strip scene.
//
// Note: the file:// protocol guard lives as an inline non-module script in
// index.html (it must run BEFORE this module's hoisted import). Do not rely
// on a guard here — a top-level import is hoisted and would run first.

import kaplay from "../lib/kaplay.mjs";
import { CONFIG } from "./config.js";
import { gameScene } from "./scenes/game.js";

// kaplay() returns a context and, with global: true (the default), also
// exposes scene/add/text/pos/anchor/color/go/loadSprite on the global scope.
const k = kaplay({
  width: 640,
  height: 360,
  background: "#0a0a0a",            // project dark-grunge background
  crisp: true,                      // pixel-perfect upscale (image-rendering: pixelated) — keeps art sharp when the canvas is scaled up
  canvas: document.querySelector("#game"),
});

// --- Display scaling (+50%) — DISPLAY ONLY, not internal resolution ---
// The internal render buffer stays 640x360 (above), so every collider, jump,
// camera, and level number in CONFIG remains valid. We only enlarge the
// *displayed* canvas via CSS. Kaplay writes canvas.style.cssText at init with
// inline `width: 640px; height: 360px` (both width+height were passed), which
// beats any stylesheet rule — so we override it HERE, after init. 640x360 * 1.5
// = 960x540. `crisp: true` keeps the upscale sharp; index.html's
// `canvas { display:block; margin:auto }` still centers it (cssText leaves those
// properties untouched).
{
  const canvas = document.querySelector("#game");
  canvas.style.width = "960px";
  canvas.style.height = "540px";
}

// --- CC0 sprite loads (Phase 9) ---
// Register every image asset by name BEFORE go("game") so the scene never draws
// against missing sprites — Kaplay queues these loads and shows its loading
// screen until they resolve.
//
// CRITICAL PATH RULE (Pitfall 1 — a wrong path is a SILENT 404): every path uses
// the `../assets/...` web-root convention, mirroring the `import ... from
// "../lib/kaplay.mjs"` above. `assets/` is a SIBLING of the served src/ root, so
// `assets/` or `/assets/` would silently fail to load. Use `loadSprite` with
// `sliceX` (the old-Kaboom sheet-loader helper does NOT exist in Kaplay 3001).
loadSprite("ground", "../assets/tiles/ground.png");
loadSprite("spike", "../assets/spike.png");
loadSprite("goal", "../assets/goal.png");
loadSprite("player", "../assets/player.png");
loadSprite("coin", "../assets/coin.png", {
  // coin.png is 256x32 = 8 evenly-gridded 32px frames; sliceX:8 cuts them and the
  // named `spin` anim loops 0..7 at the CONFIG-tuned frame rate (no magic numbers).
  sliceX: CONFIG.COIN_FRAMES,
  anims: {
    spin: { from: 0, to: CONFIG.COIN_FRAMES - 1, loop: true, speed: CONFIG.COIN_SPIN_SPEED },
  },
});

// Register the real platformer scene and boot it. Seed data is passed via
// go(name, data) — the CONTEXT-locked anti-leak mechanism: the scene reads its
// start position from this payload instead of any module-level state.
scene("game", gameScene);

go("game", { startX: 64, startY: 64 });
