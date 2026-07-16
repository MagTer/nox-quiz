// src/main.js — Nox Run v3.0 game shell (Phase 8 platformer boot)
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
import { titleScene } from "./scenes/title.js";
import { selectScene } from "./scenes/select.js";
import { gameScene } from "./scenes/game.js";
import { ASSETS_MANIFEST } from "./assets-manifest.js";

// kaplay() returns a context and, with global: true (the default), also
// exposes scene/add/text/pos/anchor/color/go/loadSprite on the global scope.
const k = kaplay({
  width: 640,
  height: 360,
  background: CONFIG.PALETTE.BG,    // project dark-grunge background (single source of truth)
  crisp: true,                      // pixel-perfect upscale (image-rendering: pixelated) — keeps art sharp when the canvas is scaled up
  canvas: document.querySelector("#game"),
});

// --- Display scaling (+50%) — DISPLAY ONLY, not internal resolution ---
// The internal render buffer stays 640x360 (above), so every collider, jump,
// camera, and level number in CONFIG remains valid. We enlarge the *displayed*
// canvas via a CSS `transform: scale()`, NOT `width`/`height`. This is
// deliberate, not stylistic: Kaplay's non-letterbox mouse handler reads the
// browser-native `event.offsetX/offsetY` directly as the mouse position,
// assuming the canvas's CSS-rendered size equals its internal resolution
// (640x360). `offsetX/offsetY` are computed in the element's untransformed
// layout box, so a `transform: scale()` visually enlarges the canvas while
// leaving that assumption intact; setting `width`/`height` instead changes the
// layout box itself and desyncs offsetX/offsetY from the 640x360 world space
// — silently breaking every object-scoped, position-based `box.onClick()`
// (area()-gated hit-testing) while leaving position-agnostic global onClick
// handlers (e.g. the title screen's "click anywhere to start") unaffected.
// Found via the Phase 14 mandatory browser-boot checkpoint: level-select tile
// clicks silently missed their target after the width/height version shipped.
// `transform-origin` defaults to the element's center; index.html flex-centers
// the canvas on BOTH axes (see its <style> comment — the earlier margin:auto
// approach only centered horizontally), so scaling from center keeps the
// visually-enlarged canvas centered without any layout changes.
{
  const canvas = document.querySelector("#game");
  canvas.style.transform = "scale(1.5)";
}

// --- Sprite loads (Phase 9 + Phase 18 art/animation/parallax) ---
// Register every image asset by name BEFORE the boot go() so scenes never draw
// against missing sprites — Kaplay queues these loads and shows its loading
// screen until they resolve.
//
// CRITICAL PATH RULE (Pitfall 1 — a wrong path is a SILENT 404): every path uses
// the `../assets/...` web-root convention, mirroring the `import ... from
// "../lib/kaplay.mjs"` above. `assets/` is a SIBLING of the served src/ root, so
// `assets/` or `/assets/` would silently fail to load. Use `loadSprite` with
// `sliceX`/`anims` — `loadSpriteSheet` does NOT exist in Kaplay 3001.
loadSprite("spike", "../assets/spike.png");
loadSprite("goal", "../assets/goal.png");
// Key pickup (D-04; Phase 34.6.1 Plan 03) — static sprite, no sliceX/anims (single frame).
// Rendered footprint-pinned to CONFIG.KEY.W/H by src/levels/build.js; the manifest entry
// (src/assets-manifest.js) only covers existence-gate coverage, not this load.
loadSprite("key", "../assets/key.png");
loadSprite("player", "../assets/player-swamphunter.png", {
  sliceX: CONFIG.PLAYER_FRAMES,
  anims: {
    idle: { from: 0, to: 1, loop: true, speed: CONFIG.PLAYER_IDLE_SPEED },
    run: { from: 2, to: 7, loop: true, speed: CONFIG.PLAYER_RUN_SPEED },
    jump: { from: 8, to: 9, loop: false, speed: CONFIG.PLAYER_JUMP_SPEED },
    fall: { from: 10, to: 11, loop: true, speed: CONFIG.PLAYER_FALL_SPEED },
    // No dedicated land-pose frames exist in the bake (locked "wiring only" scope,
    // 33-RESEARCH.md Pitfall 2) — synthesized below by holding fall's last frame
    // (index 11) briefly, mirroring the existing single-frame non-looping jump idiom.
    land: { from: 11, to: 11, loop: false, speed: CONFIG.PLAYER_LAND_SPEED },
  },
});
loadSprite("coin", "../assets/coin.png", {
  // coin.png is 256x32 = 8 evenly-gridded 32px frames; sliceX:8 cuts them and the
  // named `spin` anim loops 0..7 at the CONFIG-tuned frame rate (no magic numbers).
  sliceX: CONFIG.COIN_FRAMES,
  anims: {
    spin: { from: 0, to: CONFIG.COIN_FRAMES - 1, loop: true, speed: CONFIG.COIN_SPIN_SPEED },
  },
});

// Parallax background layers (Phase 18 ART-03)
loadSprite("bg-far", "../assets/parallax/far.png");
loadSprite("bg-mid", "../assets/parallax/mid.png");
loadSprite("bg-near", "../assets/parallax/near.png");

// Shared title / level-select dark-grunge backdrop (Phase 18 ART-04)
loadSprite("title-bg", "../assets/tiles/title-bg.png");

// Baked "NOX RUN" wordmark (BRAND-01/BRAND-03; Phase 26 Plan 07) — hero size
// for the title screen, badge size for level-select. Replaces the old
// plain-text wordmark.
loadSprite("logo-hero", "../assets/logo-hero.png");
loadSprite("logo-badge", "../assets/logo-badge.png");

// Biome atlas/parallax assets (ART-02/ART-03; Phase 32 Plan 04) — manifest-driven
// load loop over ASSETS_MANIFEST's biome-atlas/biome-bg entries, replacing the old
// hand-written per-theme-N block. Every other manifest `kind` is intentionally
// skipped here — those assets are loaded by the hand-written calls elsewhere in
// this file, and looping them too would double-load.
for (const a of ASSETS_MANIFEST) {
  const webPath = `../${a.path}`;
  if (a.kind === "biome-atlas") {
    // 3 frames of 16x32 (48x32 sheet): 0 = cap (ground surface), 1 = fill
    // (underground mass), 2 = platform (the cap's top 16px cell over a transparent
    // bottom half — the WYSIWYG 16px ledge that matches a platform's 16px collider).
    // Bumped 2 -> 3 alongside the platform frame added to _bake_biome_atlas().
    loadSprite(a.key, webPath, { sliceX: 3, sliceY: 1 });
  } else if (a.kind === "biome-bg") {
    loadSprite(a.key, webPath);
  }
}

// Door + enemy + math-gate sprite art (ART-04/ART-05; Phase 33) — replaces the
// flat-color rect+glyph placeholder shipped since Phase 18.
loadSprite("door", "../assets/door.png");
loadSprite("math-gate", "../assets/math-gate.png");
loadSprite("enemy-hellhound", "../assets/enemy-hellhound.png", {
  sliceX: 6,
  anims: {
    idle: { from: 0, to: 5, loop: true, speed: CONFIG.ENEMY.IDLE_SPEED },
  },
});

// Audio loads (Phase 27 AUD-01/AUD-02) — 7 CC0 SFX + 1 ambient music loop, registered
// here before any go() so the audio.js seam (src/audio.js) never plays against a
// not-yet-loaded asset. Same `../assets/...` web-root convention as every loadSprite()
// above. loadMusic() only prefetches (constructs a throwaway Audio element and stores
// the URL) — it never calls .play() itself, so this is safe pre-user-gesture, same as
// every SFX load below.
loadSound("jump", "../assets/sfx/jump.ogg");
loadSound("land", "../assets/sfx/land.ogg");
loadSound("correct", "../assets/sfx/correct.ogg");
loadSound("wrong", "../assets/sfx/wrong.ogg");
loadSound("door", "../assets/sfx/door.ogg");
loadSound("clear", "../assets/sfx/clear.ogg");
loadSound("pickup", "../assets/sfx/pickup.ogg");
loadMusic("ambient", "../assets/music/ambient.ogg");

// Register the real platformer scene and boot it. Seed data is passed via
// go(name, data) — the CONTEXT-locked anti-leak mechanism: the scene reads its
// start position from this payload instead of any module-level state.
// Register all three navigation scenes BEFORE any go() — the title is the boot
// entry (NAV-01). The select→game handoff carries a levelId payload; the game
// scene derives its start defaults internally (data?.startX ?? 64), so no start
// coords are passed at boot.
scene("title", titleScene);
scene("select", selectScene);
scene("game", gameScene);

go("title");
